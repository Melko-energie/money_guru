import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from '../App'
import { FournisseurAnimations } from '../state/animations'
import { FournisseurFinances } from '../state/finances'

/** Premier lancement : aucun profil en mémoire. */
function monter() {
  return render(
    <FournisseurAnimations>
      <FournisseurFinances>
        <App />
      </FournisseurFinances>
    </FournisseurAnimations>,
  )
}

const CLE = 'money-guru:profil:v2'

function profilEnregistre() {
  return JSON.parse(window.localStorage.getItem(CLE) ?? '{}')
}

const remplirMontant = (libelle: RegExp | string, valeur: string) =>
  fireEvent.change(screen.getByLabelText(libelle), { target: { value: valeur } })

beforeEach(() => {
  window.localStorage.clear()
})

describe('premier lancement', () => {
  it('pose des questions au lieu d’afficher des données inventées', () => {
    monter()
    expect(screen.getByText(/Comment vous appelez-vous/)).toBeInTheDocument()
    // aucun tableau de bord tant que le parcours n'est pas fini
    expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).toBeNull()
    expect(screen.queryByText('Marge de manœuvre')).toBeNull()
  })

  it('affiche l’étape et sa progression', () => {
    monter()
    expect(screen.getByLabelText(/Étape 1 sur 8/)).toBeInTheDocument()
  })
})

describe('le parcours', () => {
  it('refuse d’avancer tant qu’une réponse nécessaire manque', () => {
    monter()
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }))

    // étape 2 : le revenu est obligatoire
    expect(screen.getByText(/Combien touchez-vous net/)).toBeInTheDocument()
    const continuer = screen.getByRole('button', { name: /Continuer/ })
    expect(continuer).toBeDisabled()

    remplirMontant('Revenu net mensuel', '12000')
    expect(screen.getByRole('button', { name: /Continuer/ })).toBeEnabled()
  })

  it('permet de revenir en arrière et de corriger', () => {
    monter()
    fireEvent.change(screen.getByLabelText('Votre prénom'), { target: { value: 'Amina' } })
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }))
    expect(screen.getByText(/Combien touchez-vous net/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Retour/ }))
    expect(screen.getByLabelText('Votre prénom')).toHaveValue('Amina')
  })

  it('écrit chaque réponse tout de suite et retient l’étape en cours', () => {
    monter()
    fireEvent.change(screen.getByLabelText('Votre prénom'), { target: { value: 'Amina' } })
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }))
    remplirMontant('Revenu net mensuel', '12000')

    const enregistre = profilEnregistre()
    expect(enregistre.prenom).toBe('Amina')
    expect(enregistre.revenuNet).toBe(12000)
    expect(enregistre.onboarding).toEqual({ etape: 1, termine: false })
  })

  it('reprend là où l’utilisateur s’était arrêté', () => {
    const premiere = monter()
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }))
    remplirMontant('Revenu net mensuel', '12000')
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }))
    expect(screen.getByText(/Que coûte votre vie courante/)).toBeInTheDocument()

    // l'utilisateur ferme vraiment l'application, puis revient
    premiere.unmount()
    expect(screen.queryByText(/Que coûte votre vie courante/)).toBeNull()

    monter()
    expect(screen.getByText(/Que coûte votre vie courante/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Étape 3 sur 8/)).toBeInTheDocument()
  })

  it('va jusqu’au bout et ouvre le tableau de bord avec les chiffres saisis', () => {
    monter()
    const continuer = () => fireEvent.click(screen.getAllByRole('button', { name: /Continuer/ })[0])

    continuer() // bienvenue → revenu
    remplirMontant('Revenu net mensuel', '12000')
    continuer() // revenu → frais
    remplirMontant('Montant de Logement', '4000')
    continuer() // frais → sécurité
    remplirMontant(/Solde de votre fonds/, '6000')
    continuer() // sécurité → dettes
    continuer() // dettes → patrimoine
    continuer() // patrimoine → méthode
    continuer() // méthode → récapitulatif

    const recap = screen.getByText('Récapitulatif', { exact: false })
    expect(recap).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir mon tableau de bord/ }))

    // l'application s'ouvre, alimentée par les réponses
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
    expect(screen.getAllByText(/12\s?000/).length).toBeGreaterThan(0)
    expect(profilEnregistre().onboarding.termine).toBe(true)
  })
})

describe('aucune donnée inventée', () => {
  it('ne propose nulle part de charger un profil tout fait', () => {
    monter()
    expect(screen.queryByText(/profil d’exemple/i)).toBeNull()
  })

  it('démarre tous les montants à zéro', () => {
    monter()
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }))
    expect(screen.getByLabelText('Revenu net mensuel')).toHaveValue(0)

    fireEvent.change(screen.getByLabelText('Revenu net mensuel'), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }))
    // les postes sont des suggestions à chiffrer, pas des chiffres tout faits
    for (const poste of ['Logement', 'Nourriture', 'Transport']) {
      expect(screen.getByLabelText(`Montant de ${poste}`)).toHaveValue(0)
    }
  })
})
