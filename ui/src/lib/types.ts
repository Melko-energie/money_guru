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

/**
 * Ce qui est propre à un mois donné (context §5 du brief de refonte).
 * Le report entrant n'y figure pas : il se recalcule depuis la chaîne, pour
 * qu'une correction sur un mois ancien se propage aux suivants.
 */
export type MoisSuivi = {
  /** Clé « AAAA-MM ». */
  cle: string
  /** Revenu réellement perçu ; `null` = celui du profil. */
  revenuPercu: number | null
  /**
   * Total des frais de ce mois-là, saisi en un seul chiffre ; absent ou
   * `null` = celui du modèle. Un loyer qui augmente ou une facture
   * exceptionnelle ne valent que pour leur mois : ils ne réécrivent pas le
   * passé.
   */
  fraisMaintenance?: number | null
  /**
   * Les postes de frais propres à ce mois, ligne à ligne. Absent ou `null` =
   * ceux du modèle. Détailler un mois efface son total saisi en un chiffre :
   * les deux ne coexistent jamais, sinon deux vérités se contredisent.
   */
  depenses?: Depense[] | null
  /** Un mois clos transmet son reste au mois suivant. */
  clos: boolean
}

/**
 * Quand tombe le salaire, et quel mois il finance.
 * Un salaire touché le 28 août sert à vivre en septembre : sans ce réglage,
 * l'application ferait porter la prime d'août sur un mois déjà passé.
 */
export type VersementSalaire = {
  /** Jour du mois où le salaire tombe, de 1 à 31. */
  jour: number
  /** Vrai si le salaire touché ce mois-là finance le mois suivant. */
  financeMoisSuivant: boolean
}

/**
 * Un achat prévu à une échéance : « une moto en février 2027 ».
 * Il est financé par un poste existant — objectifs, ou fun money quand c'est
 * un achat plaisir — et jamais par un poste inventé pour l'occasion.
 */
export type Objectif = {
  id: string
  libelle: string
  /** Budget visé, dans la devise du profil. */
  montant: number
  /** Clé « AAAA-MM » du mois d'achat visé. */
  moisCible: string
  /** Le poste qui le finance. La maintenance et les dettes n'en sont pas : la
   *  première est subie, la seconde se rembourse. */
  categorie: Exclude<Categorie, 'maintenance' | 'dettes'>
  /** Ce qui est déjà mis de côté pour lui. */
  dejaMisDeCote: number
  /**
   * D'où vient le rythme : le ratio du poste, ou un montant décidé.
   * Les deux à la fois n'aurait aucun sens — c'est l'un ou l'autre.
   * Absent : déduit de `versementMensuel`, pour les objectifs déjà enregistrés.
   */
  financement?: 'poste' | 'montant'
  /** Ce que vous décidez de mettre de côté chaque mois, en mode « montant ». */
  versementMensuel?: number | null
  /** Vrai une fois l'achat inscrit au calendrier, pour ne pas le compter deux fois. */
  achatEnregistre?: boolean
  note?: string
}

/**
 * Une ligne de l'avancement cumulé de l'année.
 * Salaire cumulé + salaire du mois − frais de maintenance = avancement.
 */
export type CumulMois = {
  /** Le mois où le salaire tombe. */
  cle: string
  /**
   * Le mois que ce salaire fait vivre — le même, sauf si le salaire finance
   * le mois suivant. Ce sont ses frais qu'il faut couvrir, pas ceux du mois
   * où l'argent est arrivé.
   */
  moisFinance: string
  /** Vrai si le mois compte : il est passé, ou son salaire a été saisi d'avance. */
  renseigne: boolean
  revenu: number
  /** Les frais du mois financé. */
  maintenance: number
  /** revenu − maintenance : ce que le mois ajoute vraiment. */
  net: number
  cumulRevenu: number
  cumulMaintenance: number
  /** Le salaire accumulé, net de maintenance, depuis janvier. */
  cumulNet: number
}

/** Où en est l'utilisateur dans le parcours de remplissage. */
export type Onboarding = {
  /** Index de l'étape en cours, pour reprendre où on s'est arrêté. */
  etape: number
  termine: boolean
}

/** Situation complète d'un mois, reports compris. */
export type SituationMois = {
  cle: string
  revenu: number
  /** Ce qui restait du mois précédent, catégorie par catégorie. */
  reportEntrant: Record<Categorie, number>
  /** revenu × ratio, sans le report. */
  alloue: Record<Categorie, number>
  /** report + alloué : ce qui est réellement disponible ce mois. */
  budget: Record<Categorie, number>
  /** Ce qui a été saisi à la main dans le journal. */
  depense: Record<Categorie, number>
  /**
   * Les frais de maintenance déclarés pour ce mois : ils sortent de toute
   * façon, sans saisie. Ils pèsent sur la seule catégorie maintenance.
   */
  chargesFixes: number
  /** budget − charges fixes − dépensé : le report sortant. */
  reste: Record<Categorie, number>
  totalReportEntrant: number
  totalBudget: number
  /** Somme du journal seul. */
  totalDepense: number
  totalCharges: number
  /** Tout ce qui sort : charges fixes comprises. */
  totalSorties: number
  totalReste: number
  clos: boolean
}

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
  /** Quand le salaire tombe, et quel mois il finance. */
  versementSalaire: VersementSalaire
  /** Suivi mois par mois, indexé par clé « AAAA-MM ». */
  mois: Record<string, MoisSuivi>
  /** Achats prévus à échéance, du plus proche au plus lointain. */
  objectifs: Objectif[]
  onboarding: Onboarding
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
  /** Ce qui sort réellement : saisies du mois, charges fixes comprises. */
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
  /** Somme des lignes saisies du mois. */
  totalReel: number
  /** Frais de maintenance déclarés pour ce mois : comptés sans saisie. */
  chargesFixes: number
  /** totalReel + chargesFixes : tout ce qui sort réellement. */
  totalSorties: number
  totalProjete: number
  totalPrevu: number
  ecarts: EcartCategorie[]
  seuilJourEleve: number
  joursCouteux: JourCalendrier[]
  recurrences: DepenseDatee[]
}

export type Vue =
  | 'tableau'
  | 'methodes'
  | 'objectifs'
  | 'calendrier'
  | 'suivi'
  | 'simulateur'
  | 'patrimoine'
  | 'reglages'

export type NiveauAlerte = 'info' | 'attention' | 'danger'

export type Alerte = {
  id: string
  niveau: NiveauAlerte
  titre: string
  message: string
}
