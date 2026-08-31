import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { PROFIL_DE_TEST } from '../test/profils'
import { FournisseurAnimations } from '../state/animations'
import { FournisseurFinances } from '../state/finances'
import { FournisseurSynchro } from '../state/synchro'
import { cheminDe } from '../lib/sections'

/**
 * Une base est configurée, mais le client ne répond pas : on ne teste ici que
 * ce que voit l'utilisateur avant toute connexion. Le réseau n'a rien à faire
 * dans un test.
 */
vi.mock('../lib/supabase', () => ({
  synchroDisponible: true,
  TABLE_PROFILS: 'profils',
  supabase: async () => null,
  adresseRetour: () => 'http://localhost/',
}))

function monter() {
  return render(
    <FournisseurAnimations>
      <FournisseurFinances>
        <FournisseurSynchro>
          <App />
        </FournisseurSynchro>
      </FournisseurFinances>
    </FournisseurAnimations>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

/**
 * Le questionnaire couvre tout l'écran tant qu'il n'a pas de réponses.
 * Sans porte de sortie, un téléphone neuf devrait répondre aux huit questions
 * avant de pouvoir se connecter — et sa copie entrerait alors en conflit avec
 * celle de l'ordinateur.
 */
describe('un appareil neuf', () => {
  it('propose de récupérer les chiffres d’un autre appareil', () => {
    monter()
    expect(screen.getByText('Étape 1 sur 8 · Bienvenue')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'J’ai déjà mes chiffres sur un autre appareil' }),
    ).toBeInTheDocument()
  })

  it('ouvre le champ d’adresse sans faire répondre aux questions', () => {
    monter()
    fireEvent.click(
      screen.getByRole('button', { name: 'J’ai déjà mes chiffres sur un autre appareil' }),
    )
    expect(screen.getByLabelText('Votre adresse e-mail')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recevoir le lien' })).toBeInTheDocument()
    // le questionnaire reste là : la récupération ne le remplace pas
    expect(screen.getByText('Étape 1 sur 8 · Bienvenue')).toBeInTheDocument()
  })
})

/**
 * Le chemin qui marche toujours : un fichier. Ni compte, ni réseau, ni base.
 * C'est le filet quand la synchronisation refuse — et sur l'écran d'accueil
 * il n'y avait aucun autre moyen d'entrer ses chiffres sans les resaisir.
 */
describe('ouvrir un fichier depuis l’écran d’accueil', () => {
  it('propose la restauration à côté de la connexion', () => {
    monter()
    expect(screen.getByRole('button', { name: 'Restaurer une copie' })).toBeInTheDocument()
    expect(screen.getByLabelText('Fichier de sauvegarde à restaurer')).toBeInTheDocument()
  })

  it('ouvre l’application sur les chiffres du fichier, sans une seule question', async () => {
    monter()
    expect(screen.getByText('Étape 1 sur 8 · Bienvenue')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Fichier de sauvegarde à restaurer'), {
      target: { files: [new File([JSON.stringify(PROFIL_DE_TEST)], 'copie.json')] },
    })
    await waitFor(() => expect(screen.getByText('Ce fichier contient')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Remplacer par ce fichier' }))

    // le questionnaire disparaît : le profil restauré est déjà complet
    await waitFor(() =>
      expect(screen.queryByText('Étape 1 sur 8 · Bienvenue')).not.toBeInTheDocument(),
    )
    const enregistre = JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}')
    expect(enregistre.revenuNet).toBe(PROFIL_DE_TEST.revenuNet)
    expect(enregistre.onboarding.termine).toBe(true)
  })
})

describe('la carte des appareils, base configurée', () => {
  it('demande l’adresse dans Mes chiffres', () => {
    window.localStorage.setItem('money-guru:profil:v2', JSON.stringify(PROFIL_DE_TEST))
    window.location.hash = cheminDe('reglages')
    monter()
    expect(screen.getByText('Les mêmes chiffres partout')).toBeInTheDocument()
    expect(screen.getByLabelText('Votre adresse e-mail')).toBeInTheDocument()
  })
})
