import { describe, expect, it } from 'vitest'
import {
  conseils,
  faisabilite,
  moisEntre,
  objectifsTries,
  partMensuelle,
  versementChoisi,
  versementDuMois,
} from '../lib/objectifs'
import { PROFIL_DE_TEST } from '../test/profils'
import type { Objectif, ProfilFinancier } from '../lib/types'

/** Un profil nu : 10 000 de revenu, 10 % sur le poste objectifs, rien d'autre. */
function profil(champs: Partial<ProfilFinancier> = {}): ProfilFinancier {
  return {
    ...PROFIL_DE_TEST,
    revenuNet: 10000,
    allocation: {
      maintenance: 50,
      fun: 10,
      objectifs: 10,
      urgence: 10,
      investissement: 10,
      dettes: 10,
    },
    // fonds d'urgence plein et dette soldée : les conseils de priorité se taisent
    soldeFondsUrgence: 999999,
    dettes: { total: 0, remboursementMensuel: 0, multiplicateurLimite: 3 },
    journal: [],
    mois: {},
    objectifs: [],
    ...champs,
  }
}

function objectif(champs: Partial<Objectif> = {}): Objectif {
  return {
    id: 'moto',
    libelle: 'Une moto',
    montant: 30000,
    moisCible: '2027-02',
    categorie: 'objectifs',
    dejaMisDeCote: 0,
    ...champs,
  }
}

describe('la distance jusqu’à l’échéance', () => {
  it('compte le mois de départ et celui de l’achat', () => {
    // août 2026 → février 2027 : août, sept, oct, nov, déc, janv, févr
    expect(moisEntre('2026-08', '2027-02')).toBe(7)
  })

  it('vaut 1 quand l’achat est prévu ce mois-ci', () => {
    expect(moisEntre('2026-08', '2026-08')).toBe(1)
  })

  it('vaut 0 quand l’échéance est déjà passée', () => {
    expect(moisEntre('2026-08', '2026-05')).toBe(0)
  })
})

describe('ce que le poste met de côté', () => {
  it('suit le revenu du mois, pas celui du profil', () => {
    const p = profil({
      mois: { '2026-09': { cle: '2026-09', revenuPercu: 15000, clos: false } },
    })
    expect(partMensuelle(p, '2026-08', 'objectifs')).toBe(1000)
    expect(partMensuelle(p, '2026-09', 'objectifs')).toBe(1500)
  })
})

describe('la faisabilité d’un achat prévu', () => {
  it('dit oui quand le poste finance le montant à temps', () => {
    // 7 mois × 1 000 = 7 000 : largement de quoi pour un achat à 5 000
    const f = faisabilite(profil(), objectif({ montant: 5000 }), '2026-08')
    expect(f.moisRestants).toBe(7)
    expect(f.capaciteTotale).toBe(7000)
    expect(f.atteignable).toBe(true)
    expect(Math.round(f.effortMensuel)).toBe(714)
    expect(f.moisAtteinte).toBe('2026-12')
  })

  it('dit non, et dit quand, quand le rythme ne suffit pas', () => {
    // 30 000 au rythme de 1 000 : trente mois, l'échéance en compte sept
    const f = faisabilite(profil(), objectif(), '2026-08')
    expect(f.atteignable).toBe(false)
    expect(f.moisAtteinte).toBe('2029-01')
    expect(f.retardMois).toBe(23)
    expect(Math.round(f.ecartMensuel)).toBe(-3286)
  })

  it('tient compte des salaires annoncés pour les mois à venir', () => {
    const salaires: ProfilFinancier['mois'] = {}
    for (let m = 8; m <= 12; m += 1) {
      salaires[`2026-${String(m).padStart(2, '0')}`] = {
        cle: `2026-${String(m).padStart(2, '0')}`,
        revenuPercu: 40000,
        clos: false,
      }
    }
    // cinq mois à 40 000 : 4 000 par mois sur le poste, l'objectif passe
    const f = faisabilite(profil({ mois: salaires }), objectif({ moisCible: '2026-12' }), '2026-08')
    expect(f.capaciteTotale).toBe(20000)
    expect(f.atteignable).toBe(false)

    const g = faisabilite(
      profil({ mois: salaires }),
      objectif({ montant: 18000, moisCible: '2026-12' }),
      '2026-08',
    )
    expect(g.atteignable).toBe(true)
  })

  it('compte ce qui est déjà de côté', () => {
    const f = faisabilite(
      profil(),
      objectif({ montant: 8000, dejaMisDeCote: 6000 }),
      '2026-08',
    )
    expect(f.manquant).toBe(2000)
    expect(f.progressionPct).toBe(75)
    expect(f.atteignable).toBe(true)
  })

  it('ne cherche pas indéfiniment quand le poste est à zéro', () => {
    const p = profil({
      allocation: {
        maintenance: 60,
        fun: 10,
        objectifs: 0,
        urgence: 10,
        investissement: 10,
        dettes: 10,
      },
    })
    const f = faisabilite(p, objectif(), '2026-08')
    expect(f.moisAtteinte).toBeNull()
    expect(f.atteignable).toBe(false)
  })

  it('chiffre les points de ratio à ajouter pour tenir la date', () => {
    // il faut 30 000 / 7 ≈ 4 286 par mois, soit 43 % du revenu : 33 points de plus
    const f = faisabilite(profil(), objectif(), '2026-08')
    expect(f.pointsARajouter).toBe(33)
  })
})

describe('les bonnes pratiques', () => {
  it('donnent le rythme exact quand l’objectif tient', () => {
    const f = faisabilite(profil(), objectif({ montant: 7000 }), '2026-08')
    const liste = conseils(profil(), f)
    expect(liste[0]).toMatch(/de côté chaque mois/)
  })

  it('proposent de décaler, de monter la part, ou de viser moins', () => {
    const p = profil()
    const liste = conseils(p, faisabilite(p, objectif(), '2026-08'))
    expect(liste.join(' ')).toMatch(/Il manque/)
    expect(liste.join(' ')).toMatch(/monter ce poste de 33 points/)
    expect(liste.join(' ')).toMatch(/Troisième voie/)
  })

  it('font passer le fonds d’urgence avant l’achat', () => {
    const p = profil({ soldeFondsUrgence: 0 })
    const liste = conseils(p, faisabilite(p, objectif(), '2026-08'))
    expect(liste.join(' ')).toMatch(/fonds d’urgence couvre/)
  })

  it('signalent une dette qui dépasse la limite', () => {
    const p = profil({
      dettes: { total: 999999, remboursementMensuel: 100, multiplicateurLimite: 3 },
    })
    const liste = conseils(p, faisabilite(p, objectif(), '2026-08'))
    expect(liste.join(' ')).toMatch(/dette dépasse la limite/)
  })

  it('ne réclament rien quand le montant est déjà réuni', () => {
    const p = profil()
    const f = faisabilite(p, objectif({ montant: 1000, dejaMisDeCote: 1000 }), '2026-08')
    expect(conseils(p, f)[0]).toMatch(/déjà de côté/)
  })
})

describe('l’ordre des objectifs', () => {
  it('met la première échéance en tête', () => {
    const tries = objectifsTries([
      objectif({ id: 'b', moisCible: '2027-06' }),
      objectif({ id: 'a', moisCible: '2026-11' }),
    ])
    expect(tries.map((o) => o.id)).toEqual(['a', 'b'])
  })
})

describe('les conseils restent actionnables', () => {
  it('ne propose pas de monter la part quand les points n’existent nulle part', () => {
    // 50 % de maintenance + 10 % d'objectifs : 40 points disponibles au mieux,
    // et il en faudrait 33 de plus… sur un objectif deux fois plus cher, 76.
    const p = profil()
    const enorme = conseils(p, faisabilite(p, objectif({ montant: 60000 }), '2026-08'))
    expect(enorme.join(' ')).not.toMatch(/monter ce poste/)
    expect(enorme.join(' ')).toMatch(/Troisième voie/)
  })
})

/**
 * Un montant décidé à la main prime sur le ratio du poste : « je mets 2 000
 * par mois » est une décision, pas une conséquence du revenu.
 */
describe('le versement mensuel choisi', () => {
  it('remplace le rythme du poste', () => {
    const p = profil()
    // le poste objectifs donne 1 000 ; on décide d'en mettre 2 500
    expect(versementDuMois(p, '2026-08', objectif())).toBe(1000)
    expect(versementDuMois(p, '2026-08', objectif({ versementMensuel: 2500 }))).toBe(2500)
  })

  it('ne s’applique pas tant qu’il est nul ou absent', () => {
    const p = profil()
    expect(versementChoisi(objectif({ versementMensuel: 0 }))).toBe(false)
    expect(versementChoisi(objectif({ versementMensuel: null }))).toBe(false)
    expect(versementDuMois(p, '2026-08', objectif({ versementMensuel: 0 }))).toBe(1000)
  })

  it('rend un objectif atteignable qui ne l’était pas', () => {
    const p = profil()
    // 30 000 en 7 mois : le poste ne suffit pas, 5 000 par mois oui
    expect(faisabilite(p, objectif(), '2026-08').atteignable).toBe(false)
    const avecVersement = faisabilite(p, objectif({ versementMensuel: 5000 }), '2026-08')
    expect(avecVersement.atteignable).toBe(true)
    expect(avecVersement.capaciteMensuelle).toBe(5000)
    // 30 000 à 5 000 par mois : six mois, d'août à janvier
    expect(avecVersement.moisAtteinte).toBe('2027-01')
  })

  it('ne dépend pas du revenu du mois', () => {
    const p = profil({
      mois: { '2026-09': { cle: '2026-09', revenuPercu: 40000, clos: false } },
    })
    const o = objectif({ versementMensuel: 2000 })
    expect(versementDuMois(p, '2026-08', o)).toBe(2000)
    expect(versementDuMois(p, '2026-09', o)).toBe(2000)
  })

  it('dit ce qui manque chaque mois plutôt que des points de ratio', () => {
    const p = profil()
    const liste = conseils(p, faisabilite(p, objectif({ versementMensuel: 1000 }), '2026-08'))
    expect(liste.join(' ')).toMatch(/Vous mettez .+ par mois, il en faudrait/)
    expect(liste.join(' ')).not.toMatch(/monter ce poste/)
  })

  it('signale un versement plus gros que ce qui reste après les frais', () => {
    const p = profil()
    const liste = conseils(p, faisabilite(p, objectif({ versementMensuel: 5000 }), '2026-08'))
    expect(liste.join(' ')).toMatch(/Il ne vous reste que .+ une fois vos frais payés/)
  })
})

describe('les postes qui financent un objectif', () => {
  it('acceptent le capital productif et le fonds d’urgence', () => {
    const p = profil()
    const surInvest = faisabilite(p, objectif({ categorie: 'investissement' }), '2026-08')
    expect(surInvest.partDuPoste).toBe(1000)

    const surUrgence = conseils(p, faisabilite(p, objectif({ categorie: 'urgence' }), '2026-08'))
    expect(surUrgence.join(' ')).toMatch(/filet de sécurité/)
  })

  it('préviennent quand l’achat sort du capital productif', () => {
    const p = profil()
    const liste = conseils(p, faisabilite(p, objectif({ categorie: 'investissement' }), '2026-08'))
    expect(liste.join(' ')).toMatch(/ne travaillera pas pour vous demain/)
  })
})
