import { describe, expect, it } from 'vitest'
import { montantsAlloues } from '../lib/calculs'
import {
  appliquerEffet,
  chaineSuivi,
  depensesDuMoisParCategorie,
  cumulAnnee,
  effetSurSoldes,
  moisFinancant,
  premierMoisSuivi,
  revenuDuMois,
  salairePercu,
  situationMois,
} from '../lib/suivi'
import { PROFIL_DE_TEST } from '../test/profils'
import type { Categorie, DepenseDatee, ProfilFinancier } from '../lib/types'

/**
 * Un profil nu : 12 000 de revenu, ratios ronds, aucun journal, aucun mois,
 * et aucun frais déclaré — les tests de la chaîne portent sur le report, pas
 * sur les charges fixes, qui ont leurs propres cas plus bas.
 */
function profil(champs: Partial<ProfilFinancier> = {}): ProfilFinancier {
  return {
    ...PROFIL_DE_TEST,
    revenuNet: 12000,
    depenses: [],
    allocation: {
      maintenance: 50,
      fun: 10,
      objectifs: 10,
      urgence: 10,
      investissement: 10,
      dettes: 10,
    },
    journal: [],
    mois: {},
    ...champs,
  }
}

function depense(date: string, montant: number, categorie: Categorie): DepenseDatee {
  return {
    id: `${date}-${categorie}-${montant}`,
    date,
    montant,
    devise: 'MAD',
    categorie,
    libelle: 'Ligne de test',
    recurrent: false,
  }
}

describe('revenu du mois', () => {
  it('reprend celui du profil quand rien n’est saisi', () => {
    expect(revenuDuMois(profil(), '2026-03')).toBe(12000)
  })

  it('prend la valeur saisie pour ce mois précis', () => {
    const p = profil({ mois: { '2026-03': { cle: '2026-03', revenuPercu: 15000, clos: false } } })
    expect(revenuDuMois(p, '2026-03')).toBe(15000)
    // les autres mois ne bougent pas
    expect(revenuDuMois(p, '2026-04')).toBe(12000)
  })
})

describe('la chaîne des mois', () => {
  it('démarre au mois le plus ancien porteur de données', () => {
    const p = profil({ journal: [depense('2026-02-10', 500, 'fun')] })
    expect(premierMoisSuivi(p)).toBe('2026-02')
  })

  it('ne transmet rien tant que le mois est ouvert', () => {
    const p = profil({ journal: [depense('2026-02-10', 200, 'fun')] })
    const mars = situationMois(p, '2026-03')
    expect(mars.totalReportEntrant).toBe(0)
    // 1 200 de fun money alloués, rien reporté
    expect(mars.budget.fun).toBe(1200)
  })

  it('transmet le reste du mois clos, catégorie par catégorie', () => {
    const p = profil({
      journal: [depense('2026-02-10', 200, 'fun')],
      mois: { '2026-02': { cle: '2026-02', revenuPercu: null, clos: true } },
    })

    const fevrier = situationMois(p, '2026-02')
    // 10 % de 12 000 = 1 200 alloués, 200 dépensés
    expect(fevrier.reste.fun).toBe(1000)

    const mars = situationMois(p, '2026-03')
    expect(mars.reportEntrant.fun).toBe(1000)
    expect(mars.budget.fun).toBe(2200)
    // le report est bien cantonné à sa catégorie
    expect(mars.reportEntrant.objectifs).toBe(1200)
    expect(mars.reportEntrant.maintenance).toBe(6000)
  })

  it('recalcule tous les mois suivants quand un mois ancien change', () => {
    const base = {
      mois: {
        '2026-01': { cle: '2026-01', revenuPercu: null, clos: true },
        '2026-02': { cle: '2026-02', revenuPercu: null, clos: true },
      },
    }
    const avant = situationMois(profil({ ...base, journal: [] }), '2026-03')

    // une dépense ajoutée en janvier doit se voir jusqu'en mars
    const apres = situationMois(
      profil({ ...base, journal: [depense('2026-01-05', 900, 'fun')] }),
      '2026-03',
    )

    expect(avant.reportEntrant.fun - apres.reportEntrant.fun).toBe(900)
  })

  it('rend une chaîne continue, du plus ancien au plus récent', () => {
    const p = profil({
      journal: [depense('2026-01-05', 100, 'fun')],
      mois: { '2026-01': { cle: '2026-01', revenuPercu: null, clos: true } },
    })
    const chaine = chaineSuivi(p, '2026-04')
    expect(chaine.map((m) => m.cle)).toEqual(['2026-01', '2026-02', '2026-03', '2026-04'])
  })

  it('compte les dépenses du bon mois seulement', () => {
    const journal = [depense('2026-02-10', 200, 'fun'), depense('2026-03-10', 50, 'fun')]
    expect(depensesDuMoisParCategorie(journal, '2026-02').fun).toBe(200)
    expect(depensesDuMoisParCategorie(journal, '2026-03').fun).toBe(50)
  })
})

describe('le journal bouge les soldes', () => {
  it('met de côté : une dépense « urgence » augmente le fonds', () => {
    expect(effetSurSoldes({ categorie: 'urgence', montant: 500 }, 1)).toEqual({
      urgence: 500,
      dette: 0,
    })
  })

  it('rembourser : une dépense « dettes » réduit le dû', () => {
    expect(effetSurSoldes({ categorie: 'dettes', montant: 700 }, 1)).toEqual({
      urgence: 0,
      dette: -700,
    })
  })

  it('les autres catégories ne touchent aucun solde', () => {
    for (const c of ['maintenance', 'fun', 'objectifs', 'investissement'] as Categorie[]) {
      expect(effetSurSoldes({ categorie: c, montant: 300 }, 1)).toEqual({ urgence: 0, dette: 0 })
    }
  })

  it('supprimer une ligne défait exactement son effet', () => {
    const ligne = { categorie: 'dettes' as Categorie, montant: 700 }
    const p = profil({ dettes: { total: 12000, remboursementMensuel: 700, multiplicateurLimite: 3 } })
    const apresAjout = appliquerEffet(p, effetSurSoldes(ligne, 1))
    expect(apresAjout.dettes.total).toBe(11300)

    const apresRetrait = appliquerEffet(apresAjout, effetSurSoldes(ligne, -1))
    expect(apresRetrait.dettes.total).toBe(12000)
  })

  it('ne descend jamais un solde sous zéro', () => {
    const p = profil({ dettes: { total: 200, remboursementMensuel: 0, multiplicateurLimite: 3 } })
    const apres = appliquerEffet(p, effetSurSoldes({ categorie: 'dettes', montant: 900 }, 1))
    expect(apres.dettes.total).toBe(0)
  })

  it('mettre de côté alimente aussi le capital liquide', () => {
    const p = profil({ soldeFondsUrgence: 1000, patrimoine: { ...PROFIL_DE_TEST.patrimoine, liquide: 1000 } })
    const apres = appliquerEffet(p, effetSurSoldes({ categorie: 'urgence', montant: 500 }, 1))
    expect(apres.soldeFondsUrgence).toBe(1500)
    expect(apres.patrimoine.liquide).toBe(1500)
  })
})

/**
 * Le cas réel : 5 000 en août, 15 000 en septembre, des primes ensuite.
 * Chaque mois doit se calculer sur ce qui est réellement tombé.
 */
describe('un revenu qui change chaque mois', () => {
  const p = profil({
    mois: {
      '2026-08': { cle: '2026-08', revenuPercu: 5000, clos: false },
      '2026-09': { cle: '2026-09', revenuPercu: 15000, clos: false },
    },
  })

  it('prend le revenu réellement perçu, mois par mois', () => {
    expect(revenuDuMois(p, '2026-08')).toBe(5000)
    expect(revenuDuMois(p, '2026-09')).toBe(15000)
    // un mois sans saisie retombe sur le revenu du profil
    expect(revenuDuMois(p, '2026-10')).toBe(12000)
  })

  it('répartit chaque mois sur son propre revenu', () => {
    const aout = situationMois(p, '2026-08')
    const septembre = situationMois(p, '2026-09')

    // 10 % de fun money : 500 en août, 1 500 en septembre
    expect(aout.alloue.fun).toBe(500)
    expect(septembre.alloue.fun).toBe(1500)
    // et la maintenance suit : 50 %
    expect(aout.alloue.maintenance).toBe(2500)
    expect(septembre.alloue.maintenance).toBe(7500)
  })

  it('une prime ponctuelle ne déforme pas les autres mois', () => {
    const avecPrime = profil({
      mois: { '2026-09': { cle: '2026-09', revenuPercu: 20000, clos: false } },
    })
    expect(situationMois(avecPrime, '2026-09').alloue.investissement).toBe(2000)
    expect(situationMois(avecPrime, '2026-10').alloue.investissement).toBe(1200)
  })

  it('l’allocation d’un mois vaut bien revenu × ratio', () => {
    const attendu = montantsAlloues(5000, p.allocation)
    expect(situationMois(p, '2026-08').alloue).toEqual(attendu)
  })
})

/**
 * L'avancement cumulé : salaire accumulé + salaire du mois − maintenance.
 * C'est la lecture demandée pour suivre une année, mois après mois.
 */
describe('l’avancement cumulé de l’année', () => {
  /** 3 000 de frais de maintenance déclarés, revenu de profil à 12 000. */
  const base = () =>
    profil({
      depenses: [{ id: 'loyer', libelle: 'Loyer', montant: 3000, icone: 'logement' }],
    })

  it('n’avance que sur les mois passés, jamais sur des salaires supposés', () => {
    const lignes = cumulAnnee(base(), 2026, '2026-03')
    expect(lignes.filter((l) => l.renseigne)).toHaveLength(3)
    // janvier, février, mars : 3 × (12 000 − 3 000)
    expect(lignes[2].cumulNet).toBe(27000)
    // avril n'ajoute rien tant qu'il n'est pas arrivé
    expect(lignes[3].net).toBe(0)
    expect(lignes[3].cumulNet).toBe(27000)
  })

  it('compte un mois à venir dès que son salaire est saisi', () => {
    const p = profil({
      depenses: [{ id: 'loyer', libelle: 'Loyer', montant: 3000, icone: 'logement' }],
      mois: { '2026-09': { cle: '2026-09', revenuPercu: 15000, clos: false } },
    })
    const lignes = cumulAnnee(p, 2026, '2026-03')
    const septembre = lignes[8]
    expect(septembre.renseigne).toBe(true)
    expect(septembre.revenu).toBe(15000)
    expect(septembre.net).toBe(12000)
    // trois mois passés + septembre annoncé : 27 000 + 12 000
    expect(septembre.cumulNet).toBe(39000)
  })

  it('empile bien salaire accumulé puis nouveau salaire, maintenance déduite', () => {
    const p = profil({
      depenses: [{ id: 'loyer', libelle: 'Loyer', montant: 3000, icone: 'logement' }],
      mois: {
        '2026-01': { cle: '2026-01', revenuPercu: 5000, clos: false },
        '2026-02': { cle: '2026-02', revenuPercu: 15000, clos: false },
      },
    })
    const [janvier, fevrier] = cumulAnnee(p, 2026, '2026-02')
    expect(janvier.cumulNet).toBe(2000)
    expect(fevrier.net).toBe(12000)
    expect(fevrier.cumulNet).toBe(14000)
    expect(fevrier.cumulRevenu).toBe(20000)
    expect(fevrier.cumulMaintenance).toBe(6000)
  })

  it('signale un mois où la maintenance dépasse le salaire', () => {
    const p = profil({
      depenses: [{ id: 'loyer', libelle: 'Loyer', montant: 3000, icone: 'logement' }],
      mois: { '2026-01': { cle: '2026-01', revenuPercu: 1000, clos: false } },
    })
    expect(cumulAnnee(p, 2026, '2026-01')[0].net).toBe(-2000)
  })

  it('douze lignes, toujours, même sur une année vide', () => {
    expect(cumulAnnee(profil(), 2030, '2026-08')).toHaveLength(12)
  })
})

/**
 * Les frais déclarés sortent sans qu'on ait rien à saisir.
 * Les ignorer laissait croire que la maintenance ne coûtait rien tant qu'on
 * n'avait pas tapé son loyer à la main.
 */
describe('les charges fixes du mois', () => {
  const loyer = [{ id: 'loyer', libelle: 'Loyer', montant: 3000, icone: 'logement' as const }]

  it('comptent comme sorties, sans aucune saisie', () => {
    const m = situationMois(profil({ depenses: loyer }), '2026-03')
    expect(m.chargesFixes).toBe(3000)
    // 50 % de 12 000 alloués à la maintenance, 3 000 partis
    expect(m.reste.maintenance).toBe(3000)
    expect(m.totalDepense).toBe(0)
    expect(m.totalSorties).toBe(3000)
  })

  it('ne pèsent que sur la maintenance', () => {
    const m = situationMois(profil({ depenses: loyer }), '2026-03')
    expect(m.reste.fun).toBe(1200)
    expect(m.reste.investissement).toBe(1200)
  })

  it('s’ajoutent aux dépenses saisies, sans les remplacer', () => {
    const p = profil({ depenses: loyer, journal: [depense('2026-03-10', 500, 'maintenance')] })
    const m = situationMois(p, '2026-03')
    expect(m.depense.maintenance).toBe(500)
    expect(m.reste.maintenance).toBe(2500)
    expect(m.totalSorties).toBe(3500)
  })

  it('suivent les frais propres à un mois quand il y en a', () => {
    const p = profil({
      depenses: loyer,
      mois: { '2026-03': { cle: '2026-03', revenuPercu: null, fraisMaintenance: 5000, clos: false } },
    })
    expect(situationMois(p, '2026-03').chargesFixes).toBe(5000)
    // le mois d'à côté garde le total déclaré
    expect(situationMois(p, '2026-04').chargesFixes).toBe(3000)
  })

  it('se transmettent au mois suivant par le report', () => {
    const p = profil({
      depenses: loyer,
      mois: { '2026-03': { cle: '2026-03', revenuPercu: null, clos: true } },
    })
    // 6 000 alloués − 3 000 de charges = 3 000 reportés
    expect(situationMois(p, '2026-04').reportEntrant.maintenance).toBe(3000)
  })
})

/**
 * Le salaire touché le 28 sert à vivre le mois suivant.
 * Sans ce décalage, une prime touchée fin août irait gonfler un mois passé.
 */
describe('le décalage du versement', () => {
  const decale = (champs: Partial<ProfilFinancier> = {}) =>
    profil({ versementSalaire: { jour: 28, financeMoisSuivant: true }, ...champs })

  it('fait financer septembre par le salaire d’août', () => {
    const p = decale({
      mois: {
        '2026-08': { cle: '2026-08', revenuPercu: 5000, clos: false },
        '2026-09': { cle: '2026-09', revenuPercu: 15000, clos: false },
      },
    })
    expect(salairePercu(p, '2026-08')).toBe(5000)
    expect(revenuDuMois(p, '2026-09')).toBe(5000)
    expect(revenuDuMois(p, '2026-10')).toBe(15000)
  })

  it('nomme le mois qui finance', () => {
    const p = decale()
    expect(moisFinancant(p, '2026-09')).toBe('2026-08')
    expect(moisFinancant(profil(), '2026-09')).toBe('2026-09')
  })

  it('décale aussi l’allocation, donc tout le budget du mois', () => {
    const p = decale({ mois: { '2026-08': { cle: '2026-08', revenuPercu: 5000, clos: false } } })
    // 10 % de fun money sur les 5 000 touchés en août
    expect(situationMois(p, '2026-09').alloue.fun).toBe(500)
  })

  it('laisse le tableau annuel sur le mois où le salaire est touché', () => {
    const p = decale({
      depenses: [],
      mois: { '2026-08': { cle: '2026-08', revenuPercu: 5000, clos: false } },
    })
    const aout = cumulAnnee(p, 2026, '2026-08')[7]
    expect(aout.revenu).toBe(5000)
  })
})
