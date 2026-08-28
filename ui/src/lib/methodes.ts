import {
  ANNEES_CARRIERE,
  moisPourSolderDette,
  moisRestantsUrgence,
  montantsAlloues,
  objectifFondsUrgence,
  scoreMarge,
  simuler,
} from './calculs'
import type {
  Allocation,
  BilanMethode,
  MethodeAllocation,
  ProfilFinancier,
} from './types'

export type FicheMethode = {
  cle: MethodeAllocation
  titre: string
  promesse: string
  description: string
  regle: string
  /** Ratios proposés ; `null` pour la stratégie personnalisée. */
  ratios: Allocation | null
}

/**
 * Les quatre méthodes du context §5, plus la stratégie personnalisée.
 * Chaque jeu de ratios totalise 100 % et respecte la contrainte annoncée.
 */
export const METHODES: FicheMethode[] = [
  {
    cle: '50-30-20',
    titre: '50/30/20 adaptée',
    promesse: 'Une structure simple pour démarrer',
    description:
      'La moitié du revenu couvre la vie courante, un tiers finance le plaisir et les projets, le reste construit la sécurité et le capital.',
    regle: '50 % maintenance · 30 % fun money et objectifs · 20 % urgence, investissement, dettes',
    ratios: { maintenance: 50, fun: 18, objectifs: 12, urgence: 8, investissement: 8, dettes: 4 },
  },
  {
    cle: '70-30',
    titre: '70/30 pragmatique',
    promesse: 'Quand le coût de la vie pèse lourd',
    description:
      'Reconnaît qu’une grande part du salaire part dans la vie courante, tout en protégeant un tiers pour la sécurité et le futur.',
    regle: '70 % pour vivre · 30 % pour la sécurité et le futur',
    ratios: { maintenance: 52, fun: 12, objectifs: 6, urgence: 12, investissement: 13, dettes: 5 },
  },
  {
    cle: 'payer-soi',
    titre: 'Se payer en premier',
    promesse: 'La discipline avant ce qui reste',
    description:
      'On fixe d’abord la part sécurité et futur, prélevée dès réception du salaire. Le reste se répartit entre maintenance et fun money.',
    regle: '35 % mis de côté en début de mois · 65 % pour vivre',
    ratios: { maintenance: 50, fun: 15, objectifs: 6, urgence: 10, investissement: 15, dettes: 4 },
  },
  {
    cle: 'defense',
    titre: 'Mode défense',
    promesse: 'Stabiliser vite une situation fragile',
    description:
      'Priorité absolue au fonds d’urgence jusqu’aux six mois, fun money plafonné, dettes suivies de près. L’investissement attend que la maintenance et la dette soient sous contrôle.',
    regle: 'Urgence maximale · fun money plafonné à 5 % · investissement réduit',
    ratios: { maintenance: 55, fun: 5, objectifs: 2, urgence: 25, investissement: 5, dettes: 8 },
  },
  {
    cle: 'personnalisee',
    titre: 'Stratégie personnalisée',
    promesse: 'Vos propres ratios',
    description:
      'Vous fixez chaque part vous-même. Les ratios restent verrouillés à 100 % : monter un poste redescend les autres.',
    regle: 'Aucune contrainte, hors la somme à 100 %',
    ratios: null,
  },
]

export function ficheMethode(cle: MethodeAllocation): FicheMethode {
  return METHODES.find((m) => m.cle === cle) ?? METHODES[METHODES.length - 1]
}

/** Ratios d'une méthode ; pour la stratégie personnalisée, on garde ceux du profil. */
export function ratiosMethode(cle: MethodeAllocation, actuels: Allocation): Allocation {
  return ficheMethode(cle).ratios ?? actuels
}

/**
 * Projette une méthode sur la situation réelle du profil, pour comparer
 * fonds d'urgence, dette, capital de carrière, fun money et marge (context §7.3).
 */
export function bilanMethode(
  profil: ProfilFinancier,
  cle: MethodeAllocation,
  referenceCapital?: number,
  revenu = profil.revenuNet,
): BilanMethode {
  const allocation = ratiosMethode(cle, profil.allocation)
  const montants = montantsAlloues(revenu, allocation)
  const objectif = objectifFondsUrgence(profil.depenses)

  const projection = simuler(
    {
      montantInitial: profil.patrimoine.investi,
      versementMensuel: montants.investissement,
      tauxAnnuel: profil.tauxRendementAnnuel,
      dureeAnnees: ANNEES_CARRIERE,
      momentVersement: 'debut',
    },
    'an',
  )

  const dettesProjetees = {
    ...profil.dettes,
    // le budget alloué sert de remboursement dès qu'il dépasse le versement prévu
    remboursementMensuel: Math.max(profil.dettes.remboursementMensuel, montants.dettes),
  }

  return {
    methode: cle,
    allocation,
    montants,
    funMensuel: montants.fun,
    moisAvantObjectifUrgence: moisRestantsUrgence(
      profil.soldeFondsUrgence,
      objectif,
      montants.urgence,
    ),
    moisPourSolderDette: moisPourSolderDette(dettesProjetees),
    capitalCarriere: projection.capitalFinal,
    gainCarriere: projection.gainBrut,
    score: scoreMarge({ ...profil, allocation }, revenu).valeur,
    ecartCapital:
      referenceCapital === undefined ? 0 : projection.capitalFinal - referenceCapital,
  }
}

/**
 * Compare toutes les méthodes à la stratégie en cours.
 * `ecartCapital` chiffre le coût — ou le gain — d'un changement (context §7.2).
 */
export function comparerMethodes(
  profil: ProfilFinancier,
  revenu = profil.revenuNet,
): BilanMethode[] {
  const reference = bilanMethode(profil, profil.methode, undefined, revenu)
  return METHODES.map((m) => bilanMethode(profil, m.cle, reference.capitalCarriere, revenu))
}
