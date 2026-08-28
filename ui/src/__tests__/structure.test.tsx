import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from '../App'
import { PROFIL_DE_TEST } from '../test/profils'
import { FournisseurAnimations } from '../state/animations'
import { FournisseurFinances } from '../state/finances'
import { SECTIONS, VUES, cheminDe } from '../lib/sections'
import { act } from 'react'

/**
 * L'application démarre désormais sur un profil vide et pose ses questions.
 * Les tests d'interface ont besoin d'un profil déjà rempli : on sème celui
 * d'exemple, exactement comme le ferait un utilisateur ayant fini le parcours.
 */
function monter() {
  window.localStorage.setItem('money-guru:profil:v2', JSON.stringify(PROFIL_DE_TEST))
  return render(
    <FournisseurAnimations>
      <FournisseurFinances>
        <App />
      </FournisseurFinances>
    </FournisseurAnimations>,
  )
}

/**
 * Garde-fous de la coquille reprise du layout de référence : barre blanche
 * flottante, rail d'icônes détaché, contenu posé à plat sur le fond de page.
 */
describe('coquille de la fenêtre', () => {
  it('pose une barre supérieure en verre, collante, hors de tout conteneur de contenu', () => {
    const { container } = monter()
    const barre = container.querySelector('header') as HTMLElement
    expect(barre).not.toBeNull()
    // le verre : fond translucide + flou, sinon le fond ne transparaît pas
    expect(barre.className).toContain('bg-white/55')
    expect(barre.className).toContain('backdrop-blur-2xl')
    expect(barre.className).toContain('sticky')
    expect(barre.closest('main')).toBeNull()
    // et la racine ne doit pas être un conteneur de défilement, sinon le collant saute
    expect((container.firstElementChild as HTMLElement).className).not.toContain('overflow-x-hidden')
  })

  it('donne accès aux cinq sections, en toutes lettres, depuis la barre supérieure', () => {
    const { container } = monter()
    const barre = container.querySelector('header') as HTMLElement
    const onglets = within(barre).getByRole('navigation', { name: 'Navigation principale' })
    for (const { libelle } of SECTIONS) {
      expect(within(onglets).getByRole('button', { name: libelle })).toBeInTheDocument()
    }
  })

  it('détache le rail d’icônes et le rend collant, sans effet de verre', () => {
    const { container } = monter()
    const rails = Array.from(container.querySelectorAll('aside'))
    expect(rails).toHaveLength(1)
    expect(rails[0].className).toContain('sticky')
    expect(rails[0].className).toContain('bg-white')
    expect(rails[0].className).not.toContain('backdrop-blur')
    expect(rails[0].closest('main')).toBeNull()
  })

  it('garde le contenu à plat : plus de carte-fenêtre qui enveloppe les vues', () => {
    const { container } = monter()
    expect(container.querySelector('.rounded-fenetre')).toBeNull()
    expect(container.querySelector('main')).not.toBeNull()
  })

  it('garde des marges généreuses et une largeur de fenêtre bornée', () => {
    const { container } = monter()
    const fenetre = container.firstElementChild as HTMLElement
    expect(fenetre.className).toContain('p-4')
    expect(fenetre.className).toContain('sm:p-7')
    expect(fenetre.className).toContain('lg:p-10')
    expect(fenetre.querySelector('.max-w-\\[1560px\\]')).not.toBeNull()
  })

  it('laisse les halos d’ambiance derrière tout le reste', () => {
    const { container } = monter()
    const halos = container.querySelectorAll('[aria-hidden].blur-3xl.rounded-full')
    expect(halos.length).toBeGreaterThanOrEqual(3)
    halos.forEach((h) => expect(h.className).toContain('pointer-events-none'))
  })
})

/**
 * Anti-doublon : chaque information du tableau de bord ne doit apparaître
 * qu'à un seul endroit. C'est ce qui casse le plus vite quand on ajoute une carte.
 */
describe('aucune information en double', () => {
  const uneSeuleFois = [
    'Marge de manœuvre',
    'Votre répartition',
    'Vos six postes',
    'Votre mois réel',
    'Votre sécurité',
    'Vos dettes',
    'Ce qui creuse l’écart',
    'Jours coûteux',
  ]

  it.each(uneSeuleFois)('n’affiche « %s » qu’une fois', (libelle) => {
    monter()
    expect(screen.getAllByText(libelle)).toHaveLength(1)
  })

  it('garde deux chemins vers les vues — onglets nommés et rail d’icônes — et rien de plus', () => {
    const { container } = monter()
    const nav = container.querySelector('nav') as HTMLElement
    expect(nav.querySelectorAll('button')).toHaveLength(SECTIONS.length)
    const rail = container.querySelector('aside') as HTMLElement
    // les vues, et rien d'autre : aucune icône orpheline au bas du rail
    expect(rail.querySelectorAll('button')).toHaveLength(VUES.length)
  })
})

/**
 * Mobile : la barre basse à trois pastilles ne montre que deux vues, la
 * feuille menu doit donc rendre les six accessibles — aucune page perdue
 * au téléphone.
 */
describe('navigation mobile', () => {
  it('pose une barre basse flottante à trois pastilles', () => {
    const { container } = monter()
    const barre = screen.getByRole('navigation', { name: 'Navigation mobile' })
    expect(barre.className).toContain('fixed')
    expect(barre.className).toContain('sm:hidden')
    expect(barre.querySelectorAll('button')).toHaveLength(3)
    // elle flotte au-dessus du contenu : la page lui réserve de la place
    expect((container.firstElementChild as HTMLElement).className).toContain('pb-28')
  })

  it('donne accès à toutes les vues depuis la feuille menu', () => {
    monter()
    expect(screen.queryByRole('dialog', { name: 'Toutes les vues' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Toutes les vues' }))
    const feuille = screen.getByRole('dialog', { name: 'Toutes les vues' })

    for (const { titre } of VUES) {
      expect(within(feuille).getByText(titre)).toBeInTheDocument()
    }
  })

  it('referme la feuille dès qu’on choisit une vue', async () => {
    monter()
    fireEvent.click(screen.getByRole('button', { name: 'Toutes les vues' }))
    const feuille = screen.getByRole('dialog', { name: 'Toutes les vues' })
    fireEvent.click(within(feuille).getByText('Mon patrimoine'))
    // la feuille sort en animation : on attend son démontage
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Toutes les vues' })).toBeNull(),
    )
  })
})

/**
 * L6 — surcharge de texte : les textes longs sont repliés, jamais supprimés.
 * Le titre reste toujours lisible, le corps s'ouvre au clic.
 */
describe('textes longs repliés', () => {
  it('cache le corps des notes pédagogiques et le rend au clic', () => {
    monter()
    const note = 'Pourquoi les rendements ne sont pas garantis'
    const debutDuTexte = /Un taux annuel est une hypothèse/

    expect(screen.getByText(note)).toBeInTheDocument()
    expect(screen.queryByText(debutDuTexte)).toBeNull()

    const bouton = screen.getByText(note).closest('button') as HTMLElement
    expect(bouton).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(bouton)

    expect(bouton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(debutDuTexte)).toBeInTheDocument()
  })

  it('garde le titre d’alerte visible même replié', () => {
    monter()
    // profil de démonstration : aucune alerte, le bandeau affiche son message court
    expect(screen.getByText(/Rien à signaler/)).toBeInTheDocument()
  })
})

/**
 * L5 — mise en page téléphone. On force `matchMedia` sur la borne mobile pour
 * vérifier que c'est bien une autre mise en page qui est montée, et pas la
 * version bureau réduite.
 */
describe('mise en page téléphone', () => {
  const vraiMatchMedia = window.matchMedia

  const forcerMobile = () => {
    window.matchMedia = vi.fn().mockImplementation((requete: string) => ({
      matches: requete.includes('max-width: 639px'),
      media: requete,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  }

  afterEach(() => {
    window.matchMedia = vraiMatchMedia
  })

  it('remplace la carte héros par le disque de synthèse', () => {
    forcerMobile()
    monter()
    // le bouton de la carte bureau n'est plus monté
    expect(screen.queryByText('Mettre à jour mes chiffres')).toBeNull()
    // le disque porte l'action principale et le dépensé du mois
    expect(screen.getByText(/déjà dépensés ce mois/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ajouter une dépense/ })).toBeInTheDocument()
  })

  it('règle les parts dans une feuille glissante, pas dans le carrousel', async () => {
    forcerMobile()
    monter()

    // au doigt, les six postes sont une liste : aucun curseur monté au repos
    expect(screen.queryAllByLabelText(/Part allouée à/)).toHaveLength(0)
    expect(screen.queryByRole('dialog', { name: 'Fun money' })).toBeNull()

    const liste = screen.getByRole('list', { name: 'Vos six postes' })
    fireEvent.click(within(liste).getByRole('button', { name: /Fun money/ }))

    const feuille = screen.getByRole('dialog', { name: 'Fun money' })
    const curseur = within(feuille).getByLabelText('Part allouée à Fun money')
    expect(curseur).toBeInTheDocument()
    // un seul curseur à l'écran : celui qu'on règle
    expect(screen.getAllByLabelText(/Part allouée à/)).toHaveLength(1)

    fireEvent.change(curseur, { target: { value: '25' } })
    expect(within(feuille).getByText('25 %')).toBeInTheDocument()

    fireEvent.click(within(feuille).getByRole('button', { name: 'Terminé' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Fun money' })).toBeNull())
  })

  it('garde le carrousel et ses six curseurs sur grand écran', () => {
    monter()
    expect(screen.getAllByLabelText(/Part allouée à/)).toHaveLength(6)
  })

  it('remplace la grille du calendrier par la liste groupée par jour', async () => {
    forcerMobile()
    monter()
    fireEvent.click(screen.getByTitle('Calendrier des dépenses'))

    // les actions rapides de la référence mobile
    for (const action of ['Ajouter', 'Jour lourd', 'Récurrences', 'Écart']) {
      expect(await screen.findByText(action)).toBeInTheDocument()
    }
    // la grille sept colonnes n'est pas montée : ses en-têtes de semaine sont absents
    expect(screen.queryByText('Lun')).toBeNull()
  })

  it('monte la grille, pas la liste, sur grand écran', async () => {
    monter()
    fireEvent.click(screen.getByTitle('Calendrier des dépenses'))
    expect(await screen.findByText('Lun')).toBeInTheDocument()
    expect(screen.queryByText('Jour lourd')).toBeNull()
  })
})

/**
 * L3 — les six vues parlent la même langue de carte : coque blanche à anneau
 * (ou aplat sombre / dégradé assumé), jamais l'ancienne bordure grise.
 */
describe('langage de carte commun à toutes les vues', () => {
  const VUES = [
    'Tableau de bord',
    'Comparer les méthodes',
    'Mes objectifs',
    'Calendrier des dépenses',
    'Suivi mensuel',
    'Simulateur « et si… »',
    'Mon patrimoine',
    'Mes chiffres',
  ]

  it.each(VUES)('%s : toutes les cartes portent la coque unifiée', async (vue) => {
    const { container } = monter()
    // certains libellés servent aussi de bouton d'ouverture dans une carte :
    // le premier du DOM est celui du rail
    fireEvent.click(screen.getAllByTitle(vue)[0])
    await screen.findByRole('main')

    const cartes = Array.from(container.querySelectorAll('main section')).filter((s) =>
      s.className.includes('rounded-carte'),
    )
    expect(cartes.length).toBeGreaterThan(0)

    for (const carte of cartes) {
      const c = carte.className
      const coqueValide =
        c.includes('ring-1') || c.includes('bg-encre') || c.includes('bg-gradient')
      expect(coqueValide, `coque inattendue : ${c}`).toBe(true)
      // l'ancienne bordure grise ne doit plus exister nulle part
      expect(c).not.toContain('border border-encre')
    }
  })
})

/**
 * Aucune action décorative : les deux contrôles qui ne faisaient rien
 * doivent maintenant produire un résultat visible.
 */
describe('actions réellement fonctionnelles', () => {
  it('la recherche affiche des résultats et y emmène', async () => {
    monter()
    fireEvent.click(screen.getByTitle('Rechercher'))

    const champ = screen.getByLabelText('Rechercher dans votre tableau de bord')
    fireEvent.change(champ, { target: { value: 'essaouira' } })

    const liste = await screen.findByRole('listbox', { name: 'Résultats de recherche' })
    const resultat = within(liste).getByText(/Week-end à Essaouira/)
    expect(resultat).toBeInTheDocument()

    fireEvent.click(resultat.closest('button') as HTMLElement)
    // on atterrit sur le calendrier, pas sur une page vide
    expect(await screen.findByText('Budget prévu')).toBeInTheDocument()
  })

  it('la recherche le dit quand elle ne trouve rien', async () => {
    monter()
    fireEvent.click(screen.getByTitle('Rechercher'))
    fireEvent.change(screen.getByLabelText('Rechercher dans votre tableau de bord'), {
      target: { value: 'zzzzzz' },
    })
    expect(await screen.findByText(/Rien trouvé pour/)).toBeInTheDocument()
  })
})

/**
 * Chaque vue a une adresse : le rechargement retombe au bon endroit et le
 * retour arrière du navigateur fonctionne.
 */
describe('navigation adressable', () => {
  it('inscrit l’adresse de la vue dans l’ancre', () => {
    monter()
    expect(window.location.hash).toBe('#/tableau')

    fireEvent.click(screen.getAllByTitle('Calendrier des dépenses')[0])
    expect(window.location.hash).toBe('#/mois/calendrier')

    fireEvent.click(screen.getAllByTitle('Simulateur « et si… »')[0])
    expect(window.location.hash).toBe('#/strategie/simulateur')
  })

  it('ouvre la bonne vue quand on arrive par une adresse', () => {
    window.location.hash = cheminDe('patrimoine')
    monter()
    // le titre de page, celui qui annonce la vue ouverte
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mon patrimoine')
  })

  it('suit le retour arrière du navigateur', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Mon patrimoine')[0])
    expect(window.location.hash).toBe('#/patrimoine')

    // ce que fait le bouton « précédent » : l'ancre change, l'application suit
    act(() => {
      window.location.hash = '#/mois/suivi'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(await screen.findByText('La chaîne des mois')).toBeInTheDocument()
  })

  it('n’affiche la sous-navigation que dans les sections à plusieurs vues', () => {
    monter()
    // « Tableau de bord » n'a qu'une vue
    expect(screen.queryByRole('navigation', { name: /Vues de/ })).toBeNull()

    fireEvent.click(screen.getAllByTitle('Calendrier des dépenses')[0])
    const sous = screen.getByRole('navigation', { name: 'Vues de Mon mois' })
    expect(within(sous).getAllByRole('button')).toHaveLength(2)
  })
})

/**
 * §6 du brief : un KPI doit se comprendre sans connaître l'application.
 * Chaque chiffre porte une ligne qui dit ce qu'il signifie.
 */
describe('KPI compréhensibles', () => {
  // [vue à ouvrir, repère propre à cette vue, libellé du KPI, sens attendu]
  const attendus: Array<[string, string, string, RegExp]> = [
    ['Calendrier des dépenses', 'Jours les plus coûteux', 'Budget prévu', /Ce que vos ratios allouent/],
    [
      'Calendrier des dépenses',
      'Jours les plus coûteux',
      'Saisi ce mois',
      /La somme de ce que vous avez saisi/,
    ],
    ['Suivi mensuel', 'La chaîne des mois', 'Report entrant', /Ce qui restait du mois précédent/],
    ['Suivi mensuel', 'La chaîne des mois', 'Dépensé', /Dont .* de frais déclarés/],
  ]

  it.each(attendus)('%s → « %s » est expliqué', async (vue, repere, libelle, sens) => {
    monter()
    fireEvent.click(screen.getAllByTitle(vue)[0])
    // certains libellés existent aussi ailleurs : on attend d'être sur la bonne vue
    await screen.findByText(repere)
    const etiquette = screen.getByText(libelle)
    // le sens vit dans le même bloc que la valeur : c'est ça, le contrat
    const bloc = etiquette.parentElement as HTMLElement
    expect(bloc.textContent).toMatch(sens)
  })

  it('explique aussi les trois chiffres de la projection de carrière', () => {
    monter()
    expect(screen.getByText(/Ce que vous auriez dans 42 ans/)).toBeInTheDocument()
    expect(screen.getByText('La somme sortie de votre poche')).toBeInTheDocument()
    expect(screen.getByText(/hors frais et impôts/)).toBeInTheDocument()
  })
})
