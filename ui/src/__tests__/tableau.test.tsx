import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { FournisseurAnimations } from '../state/animations'
import { FournisseurFinances } from '../state/finances'
import { CATEGORIES } from '../lib/calculs'
import { cleMoisDe } from '../lib/calendrier'

function monter() {
  return render(
    <FournisseurAnimations>
      <FournisseurFinances>
        <App />
      </FournisseurFinances>
    </FournisseurAnimations>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('tableau de bord', () => {
  it('affiche la zone haute : revenu, méthode, devise et marge de manœuvre', () => {
    monter()
    expect(screen.getByRole('heading', { name: /Yacine/ })).toBeInTheDocument()
    expect(screen.getAllByText(/70\/30 pragmatique/).length).toBeGreaterThan(0)
    expect(screen.getByText('Marge de manœuvre')).toBeInTheDocument()
  })

  it('présente les six catégories financières obligatoires', () => {
    monter()
    const curseurs = screen.getAllByLabelText(/Part allouée à/)
    expect(curseurs).toHaveLength(CATEGORIES.length)
    expect(screen.getAllByText(/Maintenance personnelle/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Fonds d’urgence/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Dettes personnelles/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Capital productif/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Objectifs/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Fun money/).length).toBeGreaterThan(0)
  })

  it('montre la sécurité en mois couverts et la dette avec sa limite', () => {
    monter()
    expect(screen.getByText('Mois couverts')).toBeInTheDocument()
    expect(screen.getByText('Limite d’emprunt')).toBeInTheDocument()
    // frais 7 900 × 6 = 47 400 d'objectif
    expect(screen.getAllByText(/47\s?400/).length).toBeGreaterThan(0)
  })

  it('porte la zone calendrier du mois en cours', () => {
    monter()
    expect(screen.getAllByText(/Votre mois réel/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Ce qui creuse l’écart/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Jours coûteux/).length).toBeGreaterThan(0)
  })

  it('déplace un curseur d’allocation et garde la somme à 100 %', () => {
    monter()
    const curseur = screen.getAllByLabelText(/Part allouée à Capital productif/)[0]
    fireEvent.change(curseur, { target: { value: '30' } })

    expect((curseur as HTMLInputElement).value).toBe('30')
    const parts = screen
      .getAllByLabelText(/Part allouée à/)
      .slice(0, CATEGORIES.length)
      .map((c) => Number((c as HTMLInputElement).value))
    expect(parts.reduce((s, v) => s + v, 0)).toBe(100)
  })
})

describe('navigation entre les vues', () => {
  it('compare les cinq méthodes et chiffre l’écart de capital', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Comparer les méthodes')[0])

    expect(await screen.findByRole('heading', { name: /Les cinq stratégies/ })).toBeInTheDocument()
    expect(screen.getAllByText('50/30/20 adaptée').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mode défense').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/face à votre stratégie actuelle/).length).toBeGreaterThan(0)
  })

  it('adopte une méthode depuis la comparaison', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Comparer les méthodes')[0])
    await screen.findByRole('heading', { name: /Les cinq stratégies/ })

    const titre = screen
      .getAllByText('Mode défense')
      .find((n) => n.tagName === 'H3') as HTMLElement
    const carte = titre.closest('article') as HTMLElement
    fireEvent.click(within(carte).getByText('Adopter'))

    expect(within(carte).getByText('En cours')).toBeInTheDocument()
  })

  it('simule sur 42 ans avec versement en début de mois', async () => {
    monter()
    fireEvent.click(screen.getByTitle('Simulateur « et si… »'))

    expect(await screen.findByRole('heading', { name: /Vos hypothèses/ })).toBeInTheDocument()
    expect(screen.getByText(/Versement en début de mois/)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByText(/42 ans/).length).toBeGreaterThan(0)

    const versement = screen.getByLabelText('Versement mensuel')
    fireEvent.change(versement, { target: { value: '2000' } })

    const capital = screen.getByText('Capital final').parentElement as HTMLElement
    // 2 000/mois pendant 42 ans à 7 % : le capital dépasse le million
    expect(within(capital).getByText(/\d\s?\d{3}\s?\d{3}/)).toBeInTheDocument()
  })

  it('compare deux scénarios et affiche la différence', async () => {
    monter()
    fireEvent.click(screen.getByTitle('Simulateur « et si… »'))
    await screen.findByRole('heading', { name: /Vos hypothèses/ })

    expect(screen.getByText('Scénario A')).toBeInTheDocument()
    expect(screen.getByText('Scénario B')).toBeInTheDocument()
    expect(screen.getByText('Différence')).toBeInTheDocument()

    const ecart = screen.getByLabelText('Écart de rendement du scénario alternatif')
    fireEvent.change(ecart, { target: { value: '5' } })
    expect((ecart as HTMLInputElement).value).toBe('5')
  })

  it('ouvre le calendrier, saisit une dépense et met à jour le jour', async () => {
    monter()
    fireEvent.click(screen.getByTitle('Calendrier des dépenses'))

    const grille = await screen.findByText('Budget prévu')
    expect(grille).toBeInTheDocument()
    expect(screen.getByText('Réellement dépensé')).toBeInTheDocument()
    expect(screen.getAllByText('Écart prévu / réel').length).toBeGreaterThan(0)

    // la case du 12 du mois affiché
    const mois = cleMoisDe()
    const case12 = screen.getByRole('button', { name: /^12 — / })
    fireEvent.click(case12)

    fireEvent.change(screen.getByLabelText('Libellé court'), {
      target: { value: 'Test de saisie' },
    })
    fireEvent.change(screen.getByLabelText('Montant'), { target: { value: '750' } })
    fireEvent.click(screen.getByText('Ajouter la dépense'))

    expect(await screen.findByText('Test de saisie')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: new RegExp(`^12 — 750 `) })).toBeInTheDocument()
    expect(mois).toMatch(/^\d{4}-\d{2}$/)
  })

  it('supprime une dépense saisie', async () => {
    monter()
    fireEvent.click(screen.getByTitle('Calendrier des dépenses'))
    await screen.findByText('Budget prévu')

    fireEvent.click(screen.getByRole('button', { name: /^12 — / }))
    fireEvent.change(screen.getByLabelText('Libellé court'), { target: { value: 'À supprimer' } })
    fireEvent.change(screen.getByLabelText('Montant'), { target: { value: '120' } })
    fireEvent.click(screen.getByText('Ajouter la dépense'))
    await screen.findByText('À supprimer')

    fireEvent.click(screen.getByTitle('Supprimer À supprimer'))
    expect(screen.queryByText('À supprimer')).not.toBeInTheDocument()
  })

  it('projette les récurrences et permet de les confirmer', async () => {
    monter()
    fireEvent.click(screen.getByTitle('Calendrier des dépenses'))
    await screen.findByText('Budget prévu')

    // le journal de démonstration porte quatre récurrences
    expect(screen.getAllByText(/le \d+ de chaque mois/).length).toBeGreaterThan(0)

    // au mois suivant, elles ne sont plus saisies : elles apparaissent en « prévue »
    fireEvent.click(screen.getByTitle('Mois suivant'))
    // le loyer récurrent tombe le 2 : c'est ce jour-là qu'il faut regarder
    fireEvent.click(await screen.findByRole('button', { name: /^2 — / }))
    expect((await screen.findAllByText('prévue')).length).toBeGreaterThan(0)

    const confirmer = screen.getAllByText('Confirmer')[0]
    fireEvent.click(confirmer)
    expect(screen.getAllByText('récurrente').length).toBeGreaterThan(0)
  })

  it('détaille le patrimoine en classes mobilisables et biens d’usage', async () => {
    monter()
    fireEvent.click(screen.getByTitle('Mon patrimoine'))

    expect(
      await screen.findByRole('heading', { name: /Vos classes de patrimoine/ }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Capital liquide').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Créances récupérables').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Biens destinés à la revente').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Biens personnels d’usage/).length).toBeGreaterThan(0)
  })
})

describe('mes chiffres', () => {
  it('recalcule l’objectif de sécurité quand un poste change', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Mes chiffres')[0])

    const logement = await screen.findByLabelText('Montant de Logement')
    fireEvent.change(logement, { target: { value: '4000' } })

    // 4000 + 1800 + 450 + 700 + 300 + 350 + 300 + 800 = 8700, x6 = 52 200
    expect(screen.getAllByText(/52\s?200/).length).toBeGreaterThan(0)
  })

  it('change la devise et le formatage suit partout', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Mes chiffres')[0])

    const devise = await screen.findByLabelText('Devise')
    fireEvent.change(devise, { target: { value: 'EUR' } })

    expect(screen.getAllByText(/€/).length).toBeGreaterThan(0)
  })

  it('suit les dettes et alerte au-delà de la limite d’emprunt', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Mes chiffres')[0])

    const total = await screen.findByLabelText('Total dû')
    fireEvent.change(total, { target: { value: '60000' } })

    // limite = 14 000 × 3 = 42 000 : la dette la dépasse
    fireEvent.click(screen.getByTitle('Tableau de bord'))
    expect(
      (await screen.findAllByText(/Limite d’emprunt dépassée/)).length,
    ).toBeGreaterThan(0)
  })
})

describe('accessibilité et garde-fous', () => {
  it('coupe les animations à la demande', () => {
    monter()
    const bascule = screen.getByTitle('Couper les animations')
    expect(bascule).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(bascule)
    expect(screen.getByTitle('Réactiver les animations')).toHaveAttribute('aria-pressed', 'false')
  })

  it('ne propose aucune action bancaire (FR-16)', () => {
    monter()
    const interdits = /acheter|vendre|transférer|virement|connecter ma banque/i
    for (const bouton of screen.getAllByRole('button')) {
      expect(bouton.textContent ?? '').not.toMatch(interdits)
    }
  })
})
