import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { PROFIL_DE_TEST } from '../test/profils'
import { PROFIL_VIDE } from '../lib/profilVide'
import { FournisseurAnimations } from '../state/animations'
import { FournisseurFinances } from '../state/finances'
import { cheminDe } from '../lib/sections'
import { lireSauvegarde, nomSauvegarde, normaliserProfil } from '../lib/profil'

beforeEach(() => {
  window.localStorage.clear()
})

/**
 * Restaurer remplace tout. Un fichier étranger accepté par erreur effacerait
 * une année de saisie : la reconnaissance passe avant la lecture.
 */
describe('lire un fichier de sauvegarde', () => {
  it('accepte un profil complet', () => {
    const relu = lireSauvegarde(JSON.stringify(PROFIL_DE_TEST))
    expect(relu.prenom).toBe(PROFIL_DE_TEST.prenom)
    expect(relu.revenuNet).toBe(PROFIL_DE_TEST.revenuNet)
    expect(relu.journal).toHaveLength(PROFIL_DE_TEST.journal.length)
  })

  it('refuse ce qui n’est pas du JSON', () => {
    expect(() => lireSauvegarde('bonjour')).toThrow(/pas du JSON/)
  })

  it('refuse un JSON qui n’est pas un profil', () => {
    expect(() => lireSauvegarde('{"autre":1}')).toThrow(/profil Money Guru/)
    expect(() => lireSauvegarde('[1,2,3]')).toThrow(/profil Money Guru/)
  })

  it('complète les champs absents plutôt que de refuser', () => {
    const partiel = JSON.stringify({
      revenuNet: 5600,
      depenses: [{ id: 'loyer', libelle: 'Loyer', montant: 3200, icone: 'logement' }],
      allocation: { maintenance: 50 },
    })
    const relu = lireSauvegarde(partiel)
    expect(relu.revenuNet).toBe(5600)
    expect(relu.mois).toEqual({})
    expect(relu.objectifs).toEqual([])
    expect(relu.versementSalaire).toEqual(PROFIL_VIDE.versementSalaire)
  })

  it('redresse un profil dont les listes ont mal vieilli', () => {
    const abime = { ...PROFIL_DE_TEST, journal: null, mois: null, objectifs: undefined }
    const relu = normaliserProfil(abime as never)
    expect(relu.journal).toEqual([])
    expect(relu.mois).toEqual({})
    expect(relu.objectifs).toEqual([])
  })

  it('nomme le fichier par sa date', () => {
    expect(nomSauvegarde(new Date(2026, 7, 31))).toBe('money-guru-2026-08-31.json')
  })
})

function monterReglages() {
  window.localStorage.setItem('money-guru:profil:v2', JSON.stringify(PROFIL_DE_TEST))
  window.location.hash = cheminDe('reglages')
  return render(
    <FournisseurAnimations>
      <FournisseurFinances>
        <App />
      </FournisseurFinances>
    </FournisseurAnimations>,
  )
}

describe('la carte de sauvegarde', () => {
  it('propose d’enregistrer et de restaurer', () => {
    monterReglages()
    expect(screen.getByText('Copie de sécurité')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enregistrer une copie' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restaurer une copie' })).toBeInTheDocument()
  })

  it('montre ce que contient le fichier avant de remplacer quoi que ce soit', async () => {
    monterReglages()
    const fichier = new File(
      [JSON.stringify({ ...PROFIL_DE_TEST, prenom: 'Copie', revenuNet: 9100 })],
      'copie.json',
      { type: 'application/json' },
    )
    fireEvent.change(screen.getByLabelText('Fichier de sauvegarde à restaurer'), {
      target: { files: [fichier] },
    })

    await waitFor(() => expect(screen.getByText('Ce fichier contient')).toBeInTheDocument())
    expect(screen.getByText(/Copie · revenu/)).toBeInTheDocument()
    // rien n'a bougé tant que le remplacement n'est pas confirmé
    const enregistre = JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}')
    expect(enregistre.prenom).toBe(PROFIL_DE_TEST.prenom)

    fireEvent.click(screen.getByRole('button', { name: 'Remplacer par ce fichier' }))
    await waitFor(() => {
      const apres = JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}')
      expect(apres.prenom).toBe('Copie')
      expect(apres.revenuNet).toBe(9100)
      // la copie restaurée doit l'emporter sur les autres appareils
      expect(typeof apres.majLe).toBe('string')
    })
  })

  it('dit pourquoi un fichier étranger est refusé', async () => {
    monterReglages()
    fireEvent.change(screen.getByLabelText('Fichier de sauvegarde à restaurer'), {
      target: { files: [new File(['{"quelque":"chose"}'], 'autre.json')] },
    })
    await waitFor(() =>
      expect(screen.getByText(/ne contient pas un profil Money Guru/)).toBeInTheDocument(),
    )
    expect(screen.queryByRole('button', { name: 'Remplacer par ce fichier' })).not.toBeInTheDocument()
  })
})
