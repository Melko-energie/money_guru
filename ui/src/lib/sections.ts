import {
  ArrowRightLeft,
  CalendarDays,
  FlaskConical,
  LayoutGrid,
  Scale,
  Settings2,
  Target,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Vue } from './types'

export type FicheVue = {
  vue: Vue
  /** Segment d'URL, sous la section. */
  chemin: string
  libelle: string
  titre: string
  /** Une ligne pour dire à quoi sert la vue. */
  aide: string
  icone: LucideIcon
}

export type Section = {
  cle: string
  /** Segment d'URL de premier niveau. */
  chemin: string
  libelle: string
  icone: LucideIcon
  vues: FicheVue[]
}

/**
 * Les vues rangées par rôle, pas à plat.
 * La barre du haut montre les sections, le rail garde l'accès direct à chaque
 * vue, et une sous-navigation apparaît dans les sections qui en portent
 * plusieurs. Chaque vue a son adresse : `#/mois/calendrier`.
 */
export const SECTIONS: Section[] = [
  {
    cle: 'tableau',
    chemin: 'tableau',
    libelle: 'Tableau de bord',
    icone: LayoutGrid,
    vues: [
      {
        vue: 'tableau',
        chemin: '',
        libelle: 'Tableau de bord',
        titre: 'Tableau de bord',
        aide: 'Votre situation du mois',
        icone: LayoutGrid,
      },
    ],
  },
  {
    cle: 'mois',
    chemin: 'mois',
    libelle: 'Mon mois',
    icone: CalendarDays,
    vues: [
      {
        vue: 'calendrier',
        chemin: 'calendrier',
        libelle: 'Calendrier',
        titre: 'Calendrier des dépenses',
        aide: 'Le rythme réel, jour par jour',
        icone: CalendarDays,
      },
      {
        vue: 'suivi',
        chemin: 'suivi',
        libelle: 'Suivi mensuel',
        titre: 'Suivi mensuel',
        aide: 'Ce qui reste passe au mois suivant',
        icone: ArrowRightLeft,
      },
    ],
  },
  {
    cle: 'strategie',
    chemin: 'strategie',
    libelle: 'Ma stratégie',
    icone: Scale,
    vues: [
      {
        vue: 'methodes',
        chemin: 'methodes',
        libelle: 'Méthodes',
        titre: 'Comparer les méthodes',
        aide: 'Les cinq stratégies sur vos chiffres',
        icone: Scale,
      },
      {
        vue: 'objectifs',
        chemin: 'objectifs',
        libelle: 'Objectifs',
        titre: 'Mes objectifs',
        aide: 'Un achat, une date, un verdict',
        icone: Target,
      },
      {
        vue: 'simulateur',
        chemin: 'simulateur',
        libelle: 'Simulateur',
        titre: 'Simulateur « et si… »',
        aide: 'Ce que produit un versement régulier',
        icone: FlaskConical,
      },
    ],
  },
  {
    cle: 'patrimoine',
    chemin: 'patrimoine',
    libelle: 'Mon patrimoine',
    icone: Wallet,
    vues: [
      {
        vue: 'patrimoine',
        chemin: '',
        libelle: 'Mon patrimoine',
        titre: 'Mon patrimoine',
        aide: 'Ce qui est mobilisable, et ce qui ne l’est pas',
        icone: Wallet,
      },
    ],
  },
  {
    cle: 'chiffres',
    chemin: 'chiffres',
    libelle: 'Mes chiffres',
    icone: Settings2,
    vues: [
      {
        vue: 'reglages',
        chemin: '',
        libelle: 'Mes chiffres',
        titre: 'Mes chiffres',
        aide: 'Revenu, frais, ratios, dettes, rendement',
        icone: Settings2,
      },
    ],
  },
]

/** Toutes les vues, dans l'ordre des sections. */
export const VUES: FicheVue[] = SECTIONS.flatMap((s) => s.vues)

export function ficheVue(vue: Vue): FicheVue {
  return VUES.find((v) => v.vue === vue) ?? VUES[0]
}

export function sectionDe(vue: Vue): Section {
  return SECTIONS.find((s) => s.vues.some((v) => v.vue === vue)) ?? SECTIONS[0]
}

/** « #/mois/calendrier » — l'adresse d'une vue. */
export function cheminDe(vue: Vue): string {
  const section = sectionDe(vue)
  const fiche = ficheVue(vue)
  return fiche.chemin ? `/${section.chemin}/${fiche.chemin}` : `/${section.chemin}`
}

/** L'inverse : retrouve la vue depuis une adresse, `null` si inconnue. */
export function vueDepuisChemin(chemin: string): Vue | null {
  const propre = chemin.replace(/^#/, '').replace(/\/+$/, '') || '/tableau'
  return VUES.find((v) => cheminDe(v.vue) === propre)?.vue ?? null
}
