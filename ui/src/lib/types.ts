/** Les six catégories financières obligatoires (context §4). */
export type Categorie =
  | 'maintenance'
  | 'urgence'
  | 'dettes'
  | 'investissement'
  | 'objectifs'
  | 'fun'

/** Méthodes d'allocation proposées (context §5). */
export type MethodeAllocation =
  | '50-30-20'
  | '70-30'
  | 'payer-soi'
  | 'defense'
  | 'personnalisee'

/** Classes de patrimoine inspirées des catégories de zakat (context §6.6). */
export type CategorieCapital = 'liquide' | 'creances' | 'investi' | 'revente' | 'usage'

/** Devise par défaut MAD, formatage multi-devise prévu (NFR-02). */
export type CodeDevise = 'MAD' | 'EUR' | 'USD' | 'GBP' | 'AED' | 'CAD' | 'CHF'

export type CleIcone =
  | 'logement'
  | 'alimentation'
  | 'energie'
  | 'transport'
  | 'sante'
  | 'assurance'
  | 'telecom'
  | 'famille'
  | 'abonnement'
  | 'autre'

/** Une ligne de frais de maintenance personnelle. */
export type Depense = {
  id: string
  libelle: string
  montant: number
  icone: CleIcone
}

/** Ratios du revenu net, en %. La somme est verrouillée à 100. */
export type Allocation = Record<Categorie, number>

/** Dettes personnelles sans intérêt, contractées auprès de particuliers (context §6.4). */
export type Dettes = {
  total: number
  remboursementMensuel: number
  /** limite_emprunt = revenu_net_mensuel * multiplicateurLimite */
  multiplicateurLimite: number
}

export type Patrimoine = Record<CategorieCapital, number>

export type ProfilFinancier = {
  prenom: string
  devise: CodeDevise
  revenuNet: number
  /** Frais de maintenance personnelle réels, ligne par ligne. */
  depenses: Depense[]
  methode: MethodeAllocation
  allocation: Allocation
  soldeFondsUrgence: number
  dettes: Dettes
  patrimoine: Patrimoine
  /** Hypothèse de rendement annuel brut, en %. */
  tauxRendementAnnuel: number
  /** Où rediriger l'allocation urgence une fois les 6 mois atteints (context §6.3). */
  redirectionApresUrgence: Exclude<Categorie, 'urgence' | 'maintenance'>
  /** Journal des dépenses datées, saisi à la main (context §7.5). */
  journal: DepenseDatee[]
}

/** Versements en début de mois par défaut (context §6.5). */
export type MomentVersement = 'debut' | 'fin'

export type ParametresSimulation = {
  montantInitial: number
  versementMensuel: number
  tauxAnnuel: number
  dureeAnnees: number
  momentVersement: MomentVersement
}

export type PointProjection = {
  mois: number
  /** capital_initial + versement_mensuel * nombre_mois */
  verse: number
  capital: number
  /** gain_brut = capital - verse */
  gain: number
}

export type ResultatSimulation = {
  capitalFinal: number
  totalVerse: number
  gainBrut: number
  points: PointProjection[]
}

export type Palier = {
  mois: number
  libelle: string
  description: string
  montant: number
  atteint: boolean
}

/** Score de marge de manœuvre et son détail (context §10, zone haute). */
export type ScoreMarge = {
  valeur: number
  libelle: string
  composantes: Array<{ cle: string; libelle: string; valeur: number; poids: number }>
}

/** Résultat projeté d'une méthode d'allocation, pour la comparaison (context §7.3). */
export type BilanMethode = {
  methode: MethodeAllocation
  allocation: Allocation
  montants: Record<Categorie, number>
  funMensuel: number
  moisAvantObjectifUrgence: number | null
  moisPourSolderDette: number | null
  capitalCarriere: number
  gainCarriere: number
  score: number
  /** Écart de capital à 42 ans face à la méthode actuellement retenue. */
  ecartCapital: number
}

/**
 * Une dépense datée du journal (context §7.5).
 * Saisie manuelle uniquement : aucune synchronisation bancaire en V1.
 */
export type DepenseDatee = {
  id: string
  /** Clé ISO « AAAA-MM-JJ », insensible au fuseau. */
  date: string
  montant: number
  devise: CodeDevise
  categorie: Categorie
  libelle: string
  note?: string
  /** Récurrente : elle est projetée sur les mois suivants (FR-14). */
  recurrent: boolean
  /** Identifiant de série, partagé par toutes les occurrences d'une récurrence. */
  serie?: string
}

/** Occurrence future calculée depuis une récurrence, jamais stockée telle quelle. */
export type OccurrenceProjetee = DepenseDatee & { projetee: true }

export type LigneJournal = DepenseDatee | OccurrenceProjetee

export type EcartCategorie = {
  categorie: Categorie
  /** Budget mensuel issu des ratios d'allocation. */
  prevu: number
  /** Dépenses réellement saisies ce mois. */
  reel: number
  /** Récurrences déjà prévues et pas encore saisies. */
  projete: number
  /** reel - prevu : positif = dépassement. */
  ecart: number
}

export type JourCalendrier = {
  /** Clé ISO « AAAA-MM-JJ ». */
  cle: string
  jour: number
  /** Faux pour les cases de remplissage en début et fin de grille. */
  dansLeMois: boolean
  total: number
  totalProjete: number
  lignes: LigneJournal[]
  /** Total au-delà du seuil statistique du mois. */
  eleve: boolean
}

export type BilanMois = {
  cle: string
  annee: number
  /** Index 0-11, comme `Date`. */
  mois: number
  jours: JourCalendrier[]
  totalReel: number
  totalProjete: number
  totalPrevu: number
  ecarts: EcartCategorie[]
  seuilJourEleve: number
  joursCouteux: JourCalendrier[]
  recurrences: DepenseDatee[]
}

export type Vue = 'tableau' | 'methodes' | 'calendrier' | 'simulateur' | 'patrimoine' | 'reglages'

export type NiveauAlerte = 'info' | 'attention' | 'danger'

export type Alerte = {
  id: string
  niveau: NiveauAlerte
  titre: string
  message: string
}
