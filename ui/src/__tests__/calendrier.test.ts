import { describe, expect, it } from 'vitest'
import {
  cleJour,
  cleMois,
  construireBilan,
  decalerMois,
  decomposerMois,
  depensesDuMois,
  ecartsParCategorie,
  estProjetee,
  jourDeCle,
  nombreDeJours,
  occurrencesProjetees,
  recurrencesActives,
  seuilJourEleve,
  totalParCategorie,
} from '../lib/calendrier'
import type { Allocation, DepenseDatee } from '../lib/types'

const allocation: Allocation = {
  maintenance: 50,
  urgence: 10,
  dettes: 5,
  investissement: 15,
  objectifs: 5,
  fun: 15,
}

/** Mars 2026 commence un dimanche — un bon cas limite pour la grille. */
const MOIS = '2026-03'

function ligne(
  jour: number,
  montant: number,
  categorie: DepenseDatee['categorie'],
  options: Partial<DepenseDatee> = {},
): DepenseDatee {
  return {
    id: `${categorie}-${jour}-${montant}`,
    date: `${MOIS}-${String(jour).padStart(2, '0')}`,
    montant,
    devise: 'MAD',
    categorie,
    libelle: `${categorie} ${jour}`,
    recurrent: false,
    ...options,
  }
}

describe('clés de date', () => {
  it('formate mois et jours sur deux chiffres', () => {
    expect(cleMois(2026, 0)).toBe('2026-01')
    expect(cleJour(2026, 2, 7)).toBe('2026-03-07')
    expect(jourDeCle('2026-03-07')).toBe(7)
    expect(decomposerMois('2026-03')).toEqual({ annee: 2026, mois: 2 })
  })

  it('décale les mois sans déborder', () => {
    expect(decalerMois('2026-01', -1)).toBe('2025-12')
    expect(decalerMois('2026-12', 1)).toBe('2027-01')
    // 31 janvier + 1 mois ne doit pas basculer en mars
    expect(decalerMois('2026-01', 1)).toBe('2026-02')
  })

  it('connaît la longueur des mois, années bissextiles comprises', () => {
    expect(nombreDeJours(2026, 1)).toBe(28)
    expect(nombreDeJours(2024, 1)).toBe(29)
    expect(nombreDeJours(2026, 3)).toBe(30)
  })
})

describe('agrégats', () => {
  const journal = [
    ligne(3, 1200, 'maintenance'),
    ligne(3, 300, 'fun'),
    ligne(10, 450, 'maintenance'),
    ligne(17, 2500, 'fun'),
    { ...ligne(5, 800, 'objectifs'), date: '2026-02-05' },
  ]

  it('ne retient que le mois demandé', () => {
    expect(depensesDuMois(journal, MOIS)).toHaveLength(4)
    expect(depensesDuMois(journal, '2026-02')).toHaveLength(1)
  })

  it('totalise par catégorie sur les six postes', () => {
    const totaux = totalParCategorie(depensesDuMois(journal, MOIS))
    expect(totaux.maintenance).toBe(1650)
    expect(totaux.fun).toBe(2800)
    expect(totaux.urgence).toBe(0)
  })

  it('compare budget prévu et dépenses réelles', () => {
    const ecarts = ecartsParCategorie(10_000, allocation, depensesDuMois(journal, MOIS), [])
    const fun = ecarts.find((e) => e.categorie === 'fun')!
    expect(fun.prevu).toBe(1500)
    expect(fun.reel).toBe(2800)
    expect(fun.ecart).toBe(1300)

    const urgence = ecarts.find((e) => e.categorie === 'urgence')!
    expect(urgence.ecart).toBe(-1000)
  })
})

describe('jours anormalement élevés', () => {
  it('ne statue pas en dessous de trois jours dépensés', () => {
    expect(seuilJourEleve([100, 200, 0, 0])).toBe(Number.POSITIVE_INFINITY)
  })

  it('signale la dépense qui sort du lot', () => {
    const seuil = seuilJourEleve([100, 120, 90, 110, 2000])
    expect(seuil).toBeLessThan(2000)
    expect(seuil).toBeGreaterThan(120)
  })

  it('ne signale rien quand les jours se ressemblent', () => {
    const totaux = [100, 105, 95, 110, 90]
    const seuil = seuilJourEleve(totaux)
    expect(totaux.every((t) => t <= seuil)).toBe(true)
  })
})

describe('récurrences', () => {
  const recurrentes: DepenseDatee[] = [
    {
      id: 'loyer-fev',
      date: '2026-02-02',
      montant: 3200,
      devise: 'MAD',
      categorie: 'maintenance',
      libelle: 'Loyer',
      recurrent: true,
      serie: 'loyer',
    },
    {
      id: 'gym-jan',
      date: '2026-01-31',
      montant: 300,
      devise: 'MAD',
      categorie: 'fun',
      libelle: 'Salle de sport',
      recurrent: true,
      serie: 'gym',
    },
  ]

  it('projette les séries démarrées avant le mois visé', () => {
    const projetees = occurrencesProjetees(recurrentes, MOIS)
    expect(projetees).toHaveLength(2)
    expect(projetees.every(estProjetee)).toBe(true)
    expect(projetees.find((p) => p.serie === 'loyer')?.date).toBe('2026-03-02')
  })

  it('borne le jour aux mois plus courts', () => {
    const projetees = occurrencesProjetees(recurrentes, '2026-02')
    expect(projetees.find((p) => p.serie === 'gym')?.date).toBe('2026-02-28')
  })

  it('ne projette pas si l’occurrence réelle est déjà saisie', () => {
    const avecMars = [
      ...recurrentes,
      { ...recurrentes[0], id: 'loyer-mars', date: '2026-03-02' },
    ]
    const projetees = occurrencesProjetees(avecMars, MOIS)
    expect(projetees.map((p) => p.serie)).toEqual(['gym'])
  })

  it('ne projette pas en arrière', () => {
    expect(occurrencesProjetees(recurrentes, '2025-12')).toHaveLength(0)
  })

  it('liste une entrée par série, triée par jour du mois', () => {
    const actives = recurrencesActives(recurrentes)
    expect(actives).toHaveLength(2)
    expect(actives.map((r) => r.serie)).toEqual(['loyer', 'gym'])
  })
})

describe('bilan mensuel', () => {
  const journal = [
    ligne(3, 1200, 'maintenance'),
    ligne(10, 450, 'maintenance'),
    ligne(17, 2500, 'fun'),
    ligne(20, 300, 'fun'),
    {
      ...ligne(2, 3200, 'maintenance', { recurrent: true, serie: 'loyer' }),
      date: '2026-02-02',
      id: 'loyer-fev',
    },
  ]

  const bilan = construireBilan(journal, MOIS, 10_000, allocation)

  it('produit une grille de semaines entières démarrant un lundi', () => {
    expect(bilan.jours.length % 7).toBe(0)
    // mars 2026 commence un dimanche : six cases de remplissage avant le 1er
    expect(bilan.jours.slice(0, 6).every((j) => !j.dansLeMois)).toBe(true)
    expect(bilan.jours[6].jour).toBe(1)
    expect(bilan.jours.filter((j) => j.dansLeMois)).toHaveLength(31)
  })

  it('sépare le réel du projeté', () => {
    expect(bilan.totalReel).toBe(1200 + 450 + 2500 + 300)
    expect(bilan.totalProjete).toBe(3200)
    const jourDuLoyer = bilan.jours.find((j) => j.cle === '2026-03-02')!
    expect(jourDuLoyer.total).toBe(0)
    expect(jourDuLoyer.totalProjete).toBe(3200)
  })

  it('marque le jour coûteux et le classe en tête', () => {
    const jour17 = bilan.jours.find((j) => j.cle === '2026-03-17')!
    expect(jour17.eleve).toBe(true)
    expect(bilan.joursCouteux[0].cle).toBe('2026-03-17')
    expect(bilan.joursCouteux.length).toBeLessThanOrEqual(3)
  })

  it('reprend le budget total comme prévu', () => {
    expect(bilan.totalPrevu).toBe(10_000)
    expect(bilan.recurrences).toHaveLength(1)
  })

  it('reste stable sur un mois vide', () => {
    const vide = construireBilan([], MOIS, 10_000, allocation)
    expect(vide.totalReel).toBe(0)
    expect(vide.joursCouteux).toHaveLength(0)
    expect(vide.seuilJourEleve).toBe(Number.POSITIVE_INFINITY)
    expect(vide.jours.filter((j) => j.eleve)).toHaveLength(0)
  })
})
