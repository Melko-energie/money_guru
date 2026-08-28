import { describe, expect, it } from 'vitest'
import { normaliser, rechercher } from '../lib/recherche'
import { PROFIL_DE_TEST } from '../test/profils'
import type { DepenseDatee, ProfilFinancier } from '../lib/types'

function profil(journal: DepenseDatee[] = []): ProfilFinancier {
  return { ...PROFIL_DE_TEST, journal, mois: {} }
}

const ligne = (libelle: string, note?: string): DepenseDatee => ({
  id: `l-${libelle}`,
  date: '2026-03-12',
  montant: 240,
  devise: 'MAD',
  categorie: 'fun',
  libelle,
  note,
  recurrent: false,
})

describe('normalisation', () => {
  it('ignore la casse et les accents', () => {
    expect(normaliser('Café')).toBe('cafe')
    expect(normaliser('  ÉPARGNE ')).toBe('epargne')
    expect(normaliser('Week-end à Essaouira')).toBe('week-end a essaouira')
  })
})

describe('recherche', () => {
  it('ne cherche pas en dessous de deux caractères', () => {
    expect(rechercher(profil([ligne('Restaurant')]), 'r')).toHaveLength(0)
  })

  it('trouve une dépense par son libellé, accents compris', () => {
    const r = rechercher(profil([ligne('Café du matin')]), 'cafe')
    expect(r).toHaveLength(1)
    expect(r[0].titre).toBe('Café du matin')
    expect(r[0].famille).toBe('Dépenses')
  })

  it('sait où mène chaque résultat', () => {
    const r = rechercher(profil([ligne('Restaurant')]), 'restau')[0]
    expect(r.vue).toBe('calendrier')
    expect(r.mois).toBe('2026-03')
    expect(r.jour).toBe('2026-03-12')
  })

  it('cherche aussi dans la note d’une dépense', () => {
    const r = rechercher(profil([ligne('Sortie', 'Anniversaire de Karim')]), 'karim')
    expect(r[0].titre).toBe('Sortie')
  })

  it('trouve les postes de frais, les vues, les méthodes et les classes de capital', () => {
    const p = profil()
    expect(rechercher(p, 'logement')[0].famille).toBe('Frais de maintenance')
    expect(rechercher(p, 'simulateur')[0].vue).toBe('simulateur')
    expect(rechercher(p, 'défense')[0].famille).toBe('Méthodes')
    expect(rechercher(p, 'créances')[0].vue).toBe('patrimoine')
  })

  it('borne le nombre de résultats', () => {
    const journal = Array.from({ length: 30 }, (_, i) => ({
      ...ligne(`Course ${i}`),
      id: `l-${i}`,
    }))
    expect(rechercher(profil(journal), 'course').length).toBeLessThanOrEqual(8)
  })
})
