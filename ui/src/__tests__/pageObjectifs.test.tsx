import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from '../App'
import { PROFIL_DE_TEST } from '../test/profils'
import { FournisseurAnimations } from '../state/animations'
import { FournisseurFinances } from '../state/finances'
import { cleMoisDe, decalerMois, libelleMois, libelleMoisCourt } from '../lib/calendrier'
import { CATEGORIES } from '../lib/calculs'
import { LIBELLES_CATEGORIE } from '../lib/definitions'
import type { ProfilFinancier } from '../lib/types'

function monter(champs: Partial<ProfilFinancier> = {}) {
  window.localStorage.setItem(
    'money-guru:profil:v2',
    JSON.stringify({ ...PROFIL_DE_TEST, ...champs }),
  )
  return render(
    <FournisseurAnimations>
      <FournisseurFinances>
        <App />
      </FournisseurFinances>
    </FournisseurAnimations>,
  )
}

const ouvrirObjectifs = () => fireEvent.click(screen.getAllByTitle('Mes objectifs')[0])

beforeEach(() => {
  window.localStorage.clear()
})

describe('la page des objectifs', () => {
  it('a son adresse, son titre et sa place dans « Ma stratégie »', async () => {
    monter()
    ouvrirObjectifs()
    expect(window.location.hash).toBe('#/strategie/objectifs')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('objectifs')

    const sous = screen.getByRole('navigation', { name: 'Vues de Ma stratégie' })
    expect(within(sous).getAllByRole('button')).toHaveLength(3)
  })

  it('n’invente aucun objectif : elle attend une saisie', async () => {
    monter()
    ouvrirObjectifs()
    expect(await screen.findByText('Aucun objectif enregistré')).toBeInTheDocument()
    expect(screen.queryByText('Vos achats prévus')).toBeNull()
  })

  it('refuse d’enregistrer un objectif sans intitulé ni montant', async () => {
    monter()
    ouvrirObjectifs()
    const ajouter = await screen.findByRole('button', { name: /Ajouter cet objectif/ })
    expect(ajouter).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Quoi'), { target: { value: 'Une moto' } })
    expect(screen.getByRole('button', { name: /Ajouter cet objectif/ })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Budget visé'), { target: { value: '30000' } })
    expect(screen.getByRole('button', { name: /Ajouter cet objectif/ })).toBeEnabled()
  })

  it('enregistre un achat prévu et rend son verdict', async () => {
    monter()
    ouvrirObjectifs()
    await screen.findByText('Nouvel objectif')

    const cible = decalerMois(cleMoisDe(), 6)
    fireEvent.change(screen.getByLabelText('Quoi'), { target: { value: 'Une moto' } })
    fireEvent.change(screen.getByLabelText('Budget visé'), { target: { value: '30000' } })
    fireEvent.change(screen.getByLabelText('Mois de l’achat'), { target: { value: cible } })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))

    expect(screen.getByText('Vos achats prévus')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Une moto' })).toBeInTheDocument()
    expect(screen.getAllByText(libelleMois(cible), { exact: false }).length).toBeGreaterThan(0)
    // 30 000 sur sept mois avec 6 % du revenu : le verdict tombe
    expect(screen.getByText('Trop juste')).toBeInTheDocument()
  })

  it('donne des bonnes pratiques chiffrées, pas des généralités', async () => {
    monter()
    ouvrirObjectifs()
    await screen.findByText('Nouvel objectif')

    fireEvent.change(screen.getByLabelText('Quoi'), { target: { value: 'Une moto' } })
    fireEvent.change(screen.getByLabelText('Budget visé'), { target: { value: '30000' } })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))

    expect(screen.getByText('Les bonnes pratiques')).toBeInTheDocument()
    expect(screen.getAllByText(/Il manque/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Troisième voie/)).toBeInTheDocument()
  })

  it('bascule au vert dès que ce qui est de côté suffit', async () => {
    monter()
    ouvrirObjectifs()
    await screen.findByText('Nouvel objectif')

    fireEvent.change(screen.getByLabelText('Quoi'), { target: { value: 'Un vélo' } })
    fireEvent.change(screen.getByLabelText('Budget visé'), { target: { value: '4000' } })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))
    expect(screen.getByText('Réalisable')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Déjà mis de côté pour Un vélo'), {
      target: { value: '4000' },
    })
    expect(screen.getByText('Financé')).toBeInTheDocument()
    expect(screen.getAllByText(/déjà de côté/).length).toBeGreaterThan(0)
  })

  it('inscrit l’achat au calendrier, sur le mois visé, une seule fois', async () => {
    monter()
    ouvrirObjectifs()
    await screen.findByText('Nouvel objectif')

    const cible = cleMoisDe()
    fireEvent.change(screen.getByLabelText('Quoi'), { target: { value: 'Un vélo' } })
    fireEvent.change(screen.getByLabelText('Budget visé'), { target: { value: '4000' } })
    fireEvent.change(screen.getByLabelText('Mois de l’achat'), { target: { value: cible } })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer l’achat/ }))
    expect(screen.getByText('Achat enregistré')).toBeInTheDocument()
    // le bouton disparaît : pas de double écriture possible
    expect(screen.queryByRole('button', { name: /Enregistrer l’achat/ })).toBeNull()

    fireEvent.click(screen.getAllByTitle('Calendrier des dépenses')[0])
    expect(await screen.findAllByText('Un vélo')).not.toHaveLength(0)
  })

  it('retire un objectif abandonné', async () => {
    monter()
    ouvrirObjectifs()
    await screen.findByText('Nouvel objectif')

    fireEvent.change(screen.getByLabelText('Quoi'), { target: { value: 'Un vélo' } })
    fireEvent.change(screen.getByLabelText('Budget visé'), { target: { value: '4000' } })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Un vélo' }))
    expect(screen.queryByText('Vos achats prévus')).toBeNull()
  })
})

describe('l’avancement de l’année', () => {
  const ouvrirSuivi = () => fireEvent.click(screen.getAllByTitle('Suivi mensuel')[0])

  it('affiche les douze mois, avec leur cumul', async () => {
    monter()
    ouvrirSuivi()
    await screen.findByText('La chaîne des mois')

    expect(screen.getByText('Salaire cumulé')).toBeInTheDocument()
    expect(screen.getByText('Avancement')).toBeInTheDocument()
    for (const libelle of ['Salaire', 'Maintenance', 'Net du mois', 'Cumulé']) {
      expect(screen.getByRole('columnheader', { name: libelle })).toBeInTheDocument()
    }
  })

  it('accepte le salaire d’un mois à venir et le fait compter', async () => {
    monter()
    ouvrirSuivi()
    await screen.findByText('La chaîne des mois')

    const suivant = decalerMois(cleMoisDe(), 1)
    const annee = Number(suivant.slice(0, 4))
    const champ = screen.getByLabelText(`Salaire de ${libelleMoisCourt(suivant)} ${annee}`)
    // rien n'est supposé pour un mois qui n'est pas arrivé
    expect(champ).toHaveValue(null)

    fireEvent.change(champ, { target: { value: '25000' } })
    expect(champ).toHaveValue(25000)

    // le mois compte désormais dans le cumul : le total a bougé
    const enregistre = JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}')
    expect(enregistre.mois[suivant].revenuPercu).toBe(25000)
  })

  it('ramène un mois au revenu du profil quand on vide sa case', async () => {
    monter()
    ouvrirSuivi()
    await screen.findByText('La chaîne des mois')

    const suivant = decalerMois(cleMoisDe(), 1)
    const annee = Number(suivant.slice(0, 4))
    const champ = screen.getByLabelText(`Salaire de ${libelleMoisCourt(suivant)} ${annee}`)

    fireEvent.change(champ, { target: { value: '25000' } })
    fireEvent.change(champ, { target: { value: '' } })

    const enregistre = JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}')
    expect(enregistre.mois[suivant].revenuPercu).toBeNull()
  })
})

describe('le réglage fin des parts', () => {
  it('permet de taper le pourcentage exact au lieu de viser au curseur', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Mes chiffres')[0])
    const champ = await screen.findByLabelText('Part de Fun money en pourcent')

    fireEvent.change(champ, { target: { value: '23' } })
    expect(screen.getByLabelText('Part de Fun money en pourcent')).toHaveValue(23)
    // la somme reste verrouillée à 100 %
    const somme = CATEGORIES.reduce(
      (s, c) =>
        s +
        Number(
          (
            screen.getByLabelText(
              `Part de ${LIBELLES_CATEGORIE[c].titre} en pourcent`,
            ) as HTMLInputElement
          ).value,
        ),
      0,
    )
    expect(somme).toBe(100)
  })

  it('ajuste point par point avec les deux boutons', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Mes chiffres')[0])
    await screen.findByLabelText('Part de Fun money en pourcent')

    const avant = Number(
      (screen.getByLabelText('Part de Fun money en pourcent') as HTMLInputElement).value,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Monter Fun money' }))
    expect(screen.getByLabelText('Part de Fun money en pourcent')).toHaveValue(avant + 1)

    fireEvent.click(screen.getByRole('button', { name: 'Baisser Fun money' }))
    expect(screen.getByLabelText('Part de Fun money en pourcent')).toHaveValue(avant)
  })
})

/**
 * Le point qui rendait la vue calendrier incompréhensible : les frais
 * déclarés dans Mes chiffres n'étaient comptés nulle part.
 */
describe('les frais déclarés comptent comme dépensés', () => {
  it('le calendrier les affiche et les compte dans l’écart', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Calendrier des dépenses')[0])
    await screen.findByText('Budget prévu')

    // les 7 900 de frais du profil de test, comptés sans aucune saisie
    const bloc = screen.getByText('Frais déclarés').parentElement as HTMLElement
    expect(bloc.textContent).toMatch(/7\s?900/)
    expect(bloc.textContent).toMatch(/comptés sans saisie/)
  })

  it('la maintenance n’est plus à zéro dans « prévu contre réel »', async () => {
    // journal vide : ce qui s'affiche ne peut venir que des frais déclarés
    monter({ journal: [] })
    fireEvent.click(screen.getAllByTitle('Calendrier des dépenses')[0])
    await screen.findByText('Prévu contre réel')

    const carte = screen.getByText('Prévu contre réel').closest('section') as HTMLElement
    const ligne = within(carte)
      .getByText('Maintenance personnelle')
      .closest('div') as HTMLElement
    expect(ligne.textContent).toMatch(/7\s?900/)
  })

  it('le suivi mensuel dit ce qui sort sans saisie', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Suivi mensuel')[0])
    await screen.findByText('La chaîne des mois')

    const bloc = screen.getByText('Dépensé').parentElement as HTMLElement
    expect(bloc.textContent).toMatch(/de frais déclarés/)
  })

  it('accepte des frais propres à un mois, sans toucher aux autres', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Suivi mensuel')[0])
    await screen.findByText('La chaîne des mois')

    const suivant = decalerMois(cleMoisDe(), 1)
    const annee = Number(suivant.slice(0, 4))
    const champ = screen.getByLabelText(`Frais de ${libelleMoisCourt(suivant)} ${annee}`)
    // vide par défaut : le mois reprend le total déclaré
    expect(champ).toHaveValue(null)

    fireEvent.change(champ, { target: { value: '9500' } })

    const enregistre = JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}')
    expect(enregistre.mois[suivant].fraisMaintenance).toBe(9500)
    // le mois en cours garde les frais du profil
    expect(enregistre.mois[cleMoisDe()]?.fraisMaintenance ?? null).toBeNull()
  })
})

/**
 * Un salaire touché le 28 sert à vivre le mois suivant : sans ce réglage,
 * la prime d'août irait gonfler un mois déjà passé.
 */
describe('le mois financé par le salaire', () => {
  const passerAuMoisSuivant = async () => {
    fireEvent.click(screen.getAllByTitle('Mes chiffres')[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Le mois suivant' }))
  }

  it('se règle dans Mes chiffres, avec le jour du versement', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Mes chiffres')[0])
    await screen.findByLabelText('Jour du versement')

    fireEvent.change(screen.getByLabelText('Jour du versement'), { target: { value: '28' } })
    fireEvent.click(screen.getByRole('button', { name: 'Le mois suivant' }))

    const enregistre = JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}')
    expect(enregistre.versementSalaire).toEqual({ jour: 28, financeMoisSuivant: true })
  })

  it('fait financer le mois affiché par le salaire du mois d’avant', async () => {
    monter()
    await passerAuMoisSuivant()

    fireEvent.click(screen.getAllByTitle('Suivi mensuel')[0])
    await screen.findByText('La chaîne des mois')

    const precedent = decalerMois(cleMoisDe(), -1)
    const attendu = `Salaire touché en ${libelleMois(precedent).toLowerCase()}`
    expect(screen.getByLabelText(attendu)).toBeInTheDocument()
    expect(screen.getAllByText(attendu).length).toBeGreaterThan(0)
  })

  it('la saisie du salaire s’applique au mois où il tombe', async () => {
    monter()
    await passerAuMoisSuivant()

    fireEvent.click(screen.getAllByTitle('Suivi mensuel')[0])
    await screen.findByText('La chaîne des mois')

    const precedent = decalerMois(cleMoisDe(), -1)
    fireEvent.change(
      screen.getByLabelText(`Salaire touché en ${libelleMois(precedent).toLowerCase()}`),
      { target: { value: '5600' } },
    )

    const enregistre = JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}')
    // c'est bien le mois précédent qui porte le salaire, pas le mois affiché
    expect(enregistre.mois[precedent].revenuPercu).toBe(5600)
    expect(enregistre.mois[cleMoisDe()]?.revenuPercu ?? null).toBeNull()
  })
})

/**
 * Une seule date pour toute l'application, et les mêmes champs partout où un
 * mois s'affiche : on ne lit pas à un endroit pour saisir à un autre.
 */
describe('une période partagée par toutes les vues', () => {
  const anneeCourante = Number(cleMoisDe().slice(0, 4))

  it('changer d’année dans le suivi la change dans le calendrier', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Suivi mensuel')[0])
    await screen.findByText('La chaîne des mois')

    expect(screen.getByText(`Avancement ${anneeCourante}`)).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Année suivante'))
    expect(screen.getByText(`Avancement ${anneeCourante + 1}`)).toBeInTheDocument()

    // le calendrier ouvre la même année, pas la sienne
    fireEvent.click(screen.getAllByTitle('Calendrier des dépenses')[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Année' }))
    expect(screen.getByText(String(anneeCourante + 1))).toBeInTheDocument()
  })

  it('garde le mois quand on change d’année', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Suivi mensuel')[0])
    await screen.findByText('La chaîne des mois')

    const moisEnCours = cleMoisDe().slice(5, 7)
    fireEvent.click(screen.getByTitle('Année précédente'))
    const enregistreDansLaVue = screen.getByText(`Avancement ${anneeCourante - 1}`)
    expect(enregistreDansLaVue).toBeInTheDocument()
    // le titre de la carte du mois suit la même bascule
    expect(
      screen.getAllByText(libelleMois(`${anneeCourante - 1}-${moisEnCours}`)).length,
    ).toBeGreaterThan(0)
  })

  it('permet de corriger salaire et frais depuis le détail du calendrier', async () => {
    monter({ journal: [] })
    fireEvent.click(screen.getAllByTitle('Calendrier des dépenses')[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Année' }))

    const tuile = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.startsWith(libelleMoisCourt(cleMoisDe()))) as HTMLElement
    fireEvent.click(tuile)

    const boite = screen.getByRole('dialog')
    const champFrais = within(boite).getByLabelText('Frais de maintenance du mois')
    // les frais déclarés du profil de test
    expect(champFrais).toHaveValue(7900)

    fireEvent.change(champFrais, { target: { value: '9000' } })
    // la modale se recalcule au lieu d'afficher la photo prise au clic
    expect(within(boite).getByLabelText('Frais de maintenance du mois')).toHaveValue(9000)
    expect(
      JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}').mois[cleMoisDe()]
        .fraisMaintenance,
    ).toBe(9000)
  })
})

/**
 * Parité mobile : tout ce qui existe sur grand écran doit rester atteignable
 * au téléphone. On force la borne `sm` de Tailwind pour monter réellement la
 * mise en page téléphone, pas une version rétrécie de celle du bureau.
 */
describe('au téléphone, rien n’est perdu', () => {
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

  it('remplace le tableau annuel par une liste, sans défilement latéral', async () => {
    forcerMobile()
    monter()
    fireEvent.click(screen.getAllByTitle('Suivi mensuel')[0])
    await screen.findByText('La chaîne des mois')

    // le tableau large du bureau n'est pas monté
    expect(document.querySelector('table')).toBeNull()
    // les douze mois restent saisissables, salaire et frais
    const annee = Number(cleMoisDe().slice(0, 4))
    expect(screen.getAllByLabelText(new RegExp(`^Salaire de .+ ${annee}$`))).toHaveLength(12)
    expect(screen.getAllByLabelText(new RegExp(`^Frais de .+ ${annee}$`))).toHaveLength(12)
  })

  it('garde la saisie du mois affiché — salaire et frais', async () => {
    forcerMobile()
    monter()
    fireEvent.click(screen.getAllByTitle('Suivi mensuel')[0])
    await screen.findByText('La chaîne des mois')

    expect(screen.getByLabelText('Revenu réellement perçu ce mois')).toBeInTheDocument()
    expect(screen.getByLabelText('Frais de maintenance du mois')).toBeInTheDocument()
  })

  it('laisse créer un objectif au doigt', async () => {
    forcerMobile()
    monter()
    fireEvent.click(screen.getAllByTitle('Mes objectifs')[0])
    await screen.findByText('Nouvel objectif')

    fireEvent.change(screen.getByLabelText('Quoi'), { target: { value: 'Une moto' } })
    fireEvent.change(screen.getByLabelText('Budget visé'), { target: { value: '30000' } })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))

    expect(screen.getByRole('heading', { name: 'Une moto' })).toBeInTheDocument()
    expect(screen.getByText('Les bonnes pratiques')).toBeInTheDocument()
  })

  it('garde le réglage du versement et les compteurs de parts', async () => {
    forcerMobile()
    monter()
    fireEvent.click(screen.getAllByTitle('Mes chiffres')[0])
    await screen.findByLabelText('Jour du versement')

    expect(screen.getByRole('button', { name: 'Le mois suivant' })).toBeInTheDocument()
    for (const c of CATEGORIES) {
      expect(
        screen.getByLabelText(`Part de ${LIBELLES_CATEGORIE[c].titre} en pourcent`),
      ).toBeInTheDocument()
    }
  })

  it('règle une part au point près depuis la feuille des postes', async () => {
    forcerMobile()
    monter()

    const liste = screen.getByRole('list', { name: 'Vos six postes' })
    fireEvent.click(within(liste).getByRole('button', { name: /Fun money/ }))

    const feuille = screen.getByRole('dialog', { name: 'Fun money' })
    const compteur = within(feuille).getByLabelText('Part de Fun money en pourcent')
    fireEvent.change(compteur, { target: { value: '23' } })
    expect(within(feuille).getByText('23 %')).toBeInTheDocument()
  })

  it('donne accès aux huit vues depuis la feuille menu', () => {
    forcerMobile()
    monter()
    fireEvent.click(screen.getByRole('button', { name: 'Toutes les vues' }))
    const feuille = screen.getByRole('dialog', { name: 'Toutes les vues' })

    for (const titre of [
      'Tableau de bord',
      'Calendrier des dépenses',
      'Suivi mensuel',
      'Comparer les méthodes',
      'Mes objectifs',
      'Simulateur « et si… »',
      'Mon patrimoine',
      'Mes chiffres',
    ]) {
      expect(within(feuille).getByText(titre)).toBeInTheDocument()
    }
  })
})

/**
 * « Mes chiffres » règle les frais mois par mois : on choisit le mois, on
 * remplit ses postes, et les autres mois ne bougent pas.
 */
describe('les frais se règlent mois par mois', () => {
  const ouvrirChiffres = async () => {
    fireEvent.click(screen.getAllByTitle('Mes chiffres')[0])
    return screen.findByLabelText('Mois à régler')
  }

  const profilEnregistre = () =>
    JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}')

  it('propose le modèle et les mois de deux années', async () => {
    monter()
    const selecteur = await ouvrirChiffres()
    const options = Array.from((selecteur as HTMLSelectElement).options).map((o) => o.value)

    expect(options[0]).toBe('modele')
    // 1 modèle + 24 mois
    expect(options).toHaveLength(25)
    expect(options).toContain(cleMoisDe())
  })

  it('part des postes du modèle quand le mois n’a rien de propre', async () => {
    monter()
    const selecteur = await ouvrirChiffres()
    fireEvent.change(selecteur, { target: { value: cleMoisDe() } })

    // le profil de test déclare un loyer de 4 200
    expect(screen.getByLabelText('Montant de Logement')).toHaveValue(3200)
    expect(screen.getByText(/suit encore le modèle/)).toBeInTheDocument()
  })

  it('écrit la correction sur le seul mois choisi', async () => {
    monter()
    const selecteur = await ouvrirChiffres()
    const cible = cleMoisDe()
    fireEvent.change(selecteur, { target: { value: cible } })

    fireEvent.change(screen.getByLabelText('Montant de Logement'), { target: { value: '5000' } })

    const p = profilEnregistre()
    // le mois porte désormais ses propres postes
    expect(p.mois[cible].depenses.find((d: { id: string }) => d.id === 'logement').montant).toBe(5000)
    // le modèle n'a pas bougé
    expect(p.depenses.find((d: { id: string }) => d.id === 'logement').montant).toBe(3200)
    expect(screen.getByText(/ses propres postes/)).toBeInTheDocument()
  })

  it('rend le mois au modèle sur demande', async () => {
    monter()
    const selecteur = await ouvrirChiffres()
    const cible = cleMoisDe()
    fireEvent.change(selecteur, { target: { value: cible } })
    fireEvent.change(screen.getByLabelText('Montant de Logement'), { target: { value: '5000' } })

    fireEvent.click(screen.getByRole('button', { name: /Rendre ce mois au modèle/ }))
    expect(profilEnregistre().mois[cible].depenses).toBeNull()
    expect(screen.getByLabelText('Montant de Logement')).toHaveValue(3200)
  })

  it('laisse le modèle intact quand aucun mois n’est choisi', async () => {
    monter()
    await ouvrirChiffres()
    fireEvent.change(screen.getByLabelText('Montant de Logement'), { target: { value: '4900' } })

    const p = profilEnregistre()
    expect(p.depenses.find((d: { id: string }) => d.id === 'logement').montant).toBe(4900)
    expect(p.mois[cleMoisDe()]?.depenses ?? null).toBeNull()
  })

  it('un total saisi ailleurs efface le détail, et l’inverse', async () => {
    monter()
    const selecteur = await ouvrirChiffres()
    const cible = cleMoisDe()
    fireEvent.change(selecteur, { target: { value: cible } })
    fireEvent.change(screen.getByLabelText('Montant de Logement'), { target: { value: '5000' } })
    expect(profilEnregistre().mois[cible].fraisMaintenance).toBeNull()

    // le champ « total » du suivi mensuel reprend la main
    fireEvent.click(screen.getAllByTitle('Suivi mensuel')[0])
    await screen.findByText('La chaîne des mois')
    fireEvent.change(screen.getByLabelText('Frais de maintenance du mois'), {
      target: { value: '7000' },
    })

    const p = profilEnregistre()
    expect(p.mois[cible].fraisMaintenance).toBe(7000)
    expect(p.mois[cible].depenses).toBeNull()
  })

  it('le repère du tableau annuel montre les frais du mois détaillé', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Mes chiffres')[0])
    const selecteur = await screen.findByLabelText('Mois à régler')

    const suivant = decalerMois(cleMoisDe(), 1)
    fireEvent.change(selecteur, { target: { value: suivant } })
    fireEvent.change(screen.getByLabelText('Montant de Logement'), { target: { value: '9000' } })

    fireEvent.click(screen.getAllByTitle('Suivi mensuel')[0])
    await screen.findByText('La chaîne des mois')

    const annee = Number(suivant.slice(0, 4))
    const champ = screen.getByLabelText(`Frais de ${libelleMoisCourt(suivant)} ${annee}`)
    // 9 000 de logement + les autres postes du modèle, et non le total du modèle
    expect(Number((champ as HTMLInputElement).placeholder)).toBeGreaterThan(9000)
  })
})

/**
 * Sur la page : quatre postes possibles, et un montant mensuel qu'on décide
 * soi-même plutôt que de subir un pourcentage.
 */
describe('financer un objectif à son rythme', () => {
  const creer = async (montant: string) => {
    fireEvent.click(screen.getAllByTitle('Mes objectifs')[0])
    await screen.findByText('Nouvel objectif')
    fireEvent.change(screen.getByLabelText('Quoi'), { target: { value: 'Une moto' } })
    fireEvent.change(screen.getByLabelText('Budget visé'), { target: { value: montant } })
  }

  const parMontant = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Par un montant fixe' }))

  const profilEnregistre = () =>
    JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}')

  it('ne montre qu’un seul réglage de financement à la fois', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Mes objectifs')[0])
    await screen.findByText('Nouvel objectif')

    // par défaut : le poste, et aucun champ de montant mensuel
    expect(screen.getByLabelText('Poste qui le finance')).toBeInTheDocument()
    expect(screen.queryByLabelText('Je mets de côté chaque mois')).toBeNull()

    parMontant()
    expect(screen.getByLabelText('Je mets de côté chaque mois')).toBeInTheDocument()
    expect(screen.queryByLabelText('Poste qui le finance')).toBeNull()
  })

  it('propose quatre postes de financement', async () => {
    monter()
    fireEvent.click(screen.getAllByTitle('Mes objectifs')[0])
    const selecteur = await screen.findByLabelText('Poste qui le finance')
    const options = Array.from((selecteur as HTMLSelectElement).options).map((o) => o.value)

    expect(options).toEqual(['objectifs', 'fun', 'investissement', 'urgence'])
  })

  it('enregistre le mode et le montant choisis', async () => {
    monter()
    await creer('30000')
    parMontant()
    fireEvent.change(screen.getByLabelText('Je mets de côté chaque mois'), {
      target: { value: '5000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))

    const o = profilEnregistre().objectifs[0]
    expect(o.financement).toBe('montant')
    expect(o.versementMensuel).toBe(5000)
  })

  it('ne garde aucun montant quand le poste donne le rythme', async () => {
    monter()
    await creer('30000')
    parMontant()
    fireEvent.change(screen.getByLabelText('Je mets de côté chaque mois'), {
      target: { value: '5000' },
    })
    // on change d'avis avant de valider
    fireEvent.click(screen.getByRole('button', { name: 'Par un poste' }))
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))

    const o = profilEnregistre().objectifs[0]
    expect(o.financement).toBe('poste')
    expect(o.versementMensuel).toBeNull()
  })

  it('change le verdict quand on monte le versement', async () => {
    monter()
    await creer('30000')
    parMontant()
    fireEvent.change(screen.getByLabelText('Je mets de côté chaque mois'), {
      target: { value: '1000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))
    expect(screen.getByText('Trop juste')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Versement mensuel pour Une moto'), {
      target: { value: '6000' },
    })
    expect(screen.getByText('Réalisable')).toBeInTheDocument()
  })

  it('parle du montant décidé, pas de points de ratio', async () => {
    monter()
    await creer('30000')
    parMontant()
    fireEvent.change(screen.getByLabelText('Je mets de côté chaque mois'), {
      target: { value: '1000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))

    expect(screen.getByText(/Vous mettez/)).toBeInTheDocument()
    expect(screen.queryByText(/monter ce poste de/)).toBeNull()
  })

  it('affiche ce que le poste donne, sans champ de saisie, en mode poste', async () => {
    monter()
    await creer('30000')
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))

    expect(screen.getByText('Le poste donne')).toBeInTheDocument()
    expect(screen.queryByLabelText('Versement mensuel pour Une moto')).toBeNull()
  })
})

/**
 * Un achat prévu se corrige : le montant, la date, le financement.
 * Sans ça, la moindre erreur oblige à supprimer puis recréer.
 */
describe('modifier un achat prévu', () => {
  const creerMoto = async () => {
    fireEvent.click(screen.getAllByTitle('Mes objectifs')[0])
    await screen.findByText('Nouvel objectif')
    fireEvent.change(screen.getByLabelText('Quoi'), { target: { value: 'Une moto' } })
    fireEvent.change(screen.getByLabelText('Budget visé'), { target: { value: '30000' } })
    fireEvent.click(screen.getByRole('button', { name: /Ajouter cet objectif/ }))
  }

  it('ouvre la fiche de l’objectif et la referme', async () => {
    monter()
    await creerMoto()

    fireEvent.click(screen.getByRole('button', { name: 'Modifier Une moto' }))
    const boite = screen.getByRole('dialog')
    expect(within(boite).getByLabelText('Quoi')).toHaveValue('Une moto')
    expect(within(boite).getByLabelText('Budget visé')).toHaveValue(30000)

    fireEvent.click(within(boite).getByRole('button', { name: 'Annuler' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('corrige le libellé, le montant et la date', async () => {
    monter()
    await creerMoto()

    fireEvent.click(screen.getByRole('button', { name: 'Modifier Une moto' }))
    const boite = screen.getByRole('dialog')
    fireEvent.change(within(boite).getByLabelText('Quoi'), { target: { value: 'Un scooter' } })
    fireEvent.change(within(boite).getByLabelText('Budget visé'), { target: { value: '12000' } })
    fireEvent.change(within(boite).getByLabelText('Mois de l’achat'), {
      target: { value: '2027-06' },
    })
    fireEvent.click(within(boite).getByRole('button', { name: /Enregistrer les modifications/ }))

    const o = JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}').objectifs[0]
    expect(o.libelle).toBe('Un scooter')
    expect(o.montant).toBe(12000)
    expect(o.moisCible).toBe('2027-06')
    expect(screen.getByRole('heading', { name: 'Un scooter' })).toBeInTheDocument()
  })

  it('bascule un objectif du poste vers un montant fixe', async () => {
    monter()
    await creerMoto()
    expect(screen.getByText('Le poste donne')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Modifier Une moto' }))
    const boite = screen.getByRole('dialog')
    fireEvent.click(within(boite).getByRole('button', { name: 'Par un montant fixe' }))
    fireEvent.change(within(boite).getByLabelText('Je mets de côté chaque mois'), {
      target: { value: '4500' },
    })
    fireEvent.click(within(boite).getByRole('button', { name: /Enregistrer les modifications/ }))

    const o = JSON.parse(window.localStorage.getItem('money-guru:profil:v2') ?? '{}').objectifs[0]
    expect(o.financement).toBe('montant')
    expect(o.versementMensuel).toBe(4500)
    expect(screen.getByLabelText('Versement mensuel pour Une moto')).toHaveValue(4500)
  })
})
