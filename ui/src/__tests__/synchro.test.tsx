import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { PROFIL_DE_TEST } from '../test/profils'
import { PROFIL_VIDE } from '../lib/profilVide'
import { FournisseurAnimations } from '../state/animations'
import { FournisseurFinances } from '../state/finances'
import { cheminDe } from '../lib/sections'
import { apercu, arbitrer, dateLisible, horodatage, profilVierge } from '../lib/synchro'
import type { ProfilFinancier } from '../lib/types'

const HIER = '2026-08-01T10:00:00.000Z'
const AUJOURD_HUI = '2026-08-02T10:00:00.000Z'
const DEMAIN = '2026-08-03T10:00:00.000Z'

function copie(majLe?: string, champs: Partial<ProfilFinancier> = {}): ProfilFinancier {
  return { ...PROFIL_DE_TEST, majLe, ...champs }
}

beforeEach(() => {
  window.localStorage.clear()
})

/**
 * L'arbitre décide seul de ce qui part et de ce qui arrive.
 * C'est la pièce la plus sensible de la synchronisation : une erreur ici
 * efface un mois de saisie sans que personne ne le voie.
 */
describe('arbitrage entre deux copies', () => {
  it('envoie quand la base est encore vide', () => {
    expect(arbitrer(copie(AUJOURD_HUI), null, null)).toBe('envoyer')
  })

  it('n’envoie rien tant que rien n’a été rempli', () => {
    expect(arbitrer(PROFIL_VIDE, null, null)).toBe('rien')
  })

  it('prend la copie distante sur un appareil neuf', () => {
    expect(arbitrer(PROFIL_VIDE, copie(AUJOURD_HUI), null)).toBe('recevoir')
  })

  it('ne fait rien quand les deux copies portent la même date', () => {
    expect(arbitrer(copie(AUJOURD_HUI), copie(AUJOURD_HUI), HIER)).toBe('rien')
  })

  it('reçoit quand seule la copie distante a bougé', () => {
    expect(arbitrer(copie(AUJOURD_HUI), copie(DEMAIN), AUJOURD_HUI)).toBe('recevoir')
  })

  it('envoie quand seule la copie locale a bougé', () => {
    expect(arbitrer(copie(DEMAIN), copie(AUJOURD_HUI), AUJOURD_HUI)).toBe('envoyer')
  })

  it('demande quand les deux ont bougé depuis le dernier échange', () => {
    expect(arbitrer(copie(AUJOURD_HUI), copie(DEMAIN), HIER)).toBe('conflit')
  })

  it('demande à la première rencontre de deux appareils déjà remplis', () => {
    expect(arbitrer(copie(HIER), copie(DEMAIN), null)).toBe('conflit')
  })

  it('n’écrase jamais une copie remplie mais sans date', () => {
    expect(arbitrer(copie(undefined), copie(DEMAIN), HIER)).toBe('conflit')
    expect(arbitrer(copie(DEMAIN), copie(undefined), HIER)).toBe('conflit')
  })
})

describe('lecture d’une copie', () => {
  it('reconnaît un profil jamais rempli', () => {
    expect(profilVierge(PROFIL_VIDE)).toBe(true)
    expect(profilVierge(PROFIL_DE_TEST)).toBe(false)
  })

  it('résume ce qu’il faut pour choisir entre deux appareils', () => {
    const vue = apercu(copie(AUJOURD_HUI))
    expect(vue.majLe).toBe(AUJOURD_HUI)
    expect(vue.revenuNet).toBe(PROFIL_DE_TEST.revenuNet)
    expect(vue.lignesJournal).toBe(PROFIL_DE_TEST.journal.length)
  })

  it('dit « jamais » plutôt que d’afficher une date vide', () => {
    expect(dateLisible(null)).toBe('jamais')
    expect(dateLisible('pas une date')).toBe('date inconnue')
  })

  it('produit des dates qui se trient comme du texte', () => {
    const tot = horodatage(new Date('2026-08-01T10:00:00.000Z'))
    const tard = horodatage(new Date('2026-08-02T10:00:00.000Z'))
    expect(tard > tot).toBe(true)
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

describe('la carte des appareils', () => {
  it('annonce la synchronisation éteinte quand aucune base n’est reliée', () => {
    monterReglages()
    expect(screen.getByText('Synchronisation désactivée')).toBeInTheDocument()
    expect(screen.queryByLabelText('Votre adresse e-mail')).not.toBeInTheDocument()
  })

  it('ne promet plus que rien ne sort de la machine', () => {
    monterReglages()
    expect(screen.getByText('Ce que Money Guru ne fait pas')).toBeInTheDocument()
    expect(screen.queryByText(/Aucun compte, aucun serveur/)).not.toBeInTheDocument()
  })
})

describe('date de modification', () => {
  it('se pose dès qu’un chiffre change', async () => {
    monterReglages()
    fireEvent.change(screen.getByLabelText('Solde du fonds d’urgence'), {
      target: { value: '20000' },
    })
    await waitFor(() => {
      const enregistre = JSON.parse(
        window.localStorage.getItem('money-guru:profil:v2') ?? '{}',
      ) as ProfilFinancier
      expect(enregistre.soldeFondsUrgence).toBe(20000)
      expect(typeof enregistre.majLe).toBe('string')
    })
  })
})
