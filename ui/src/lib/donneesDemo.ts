import { ANNEES_CARRIERE } from './calculs'
import { cleJour, decalerMois, decomposerMois, cleMoisDe, nombreDeJours } from './calendrier'
import type {
  Categorie,
  DepenseDatee,
  CategorieCapital,
  Depense,
  ParametresSimulation,
  ProfilFinancier,
} from './types'

/** Frais de maintenance personnelle par défaut (context §4). */
export const DEPENSES_PAR_DEFAUT: Depense[] = [
  { id: 'logement', libelle: 'Logement', montant: 3200, icone: 'logement' },
  { id: 'nourriture', libelle: 'Nourriture', montant: 1800, icone: 'alimentation' },
  { id: 'energie', libelle: 'Eau & électricité', montant: 450, icone: 'energie' },
  { id: 'transport', libelle: 'Transport', montant: 700, icone: 'transport' },
  { id: 'sante', libelle: 'Santé', montant: 300, icone: 'sante' },
  { id: 'assurance', libelle: 'Assurances', montant: 350, icone: 'assurance' },
  { id: 'telecom', libelle: 'Téléphone & internet', montant: 300, icone: 'telecom' },
  { id: 'famille', libelle: 'Obligations familiales', montant: 800, icone: 'famille' },
]

/**
 * Journal d'exemple : deux mois de dépenses datées, dont quatre récurrences
 * qui se projettent automatiquement sur les mois suivants.
 */
function journalDemo(): DepenseDatee[] {
  const moisCourant = cleMoisDe()
  const moisPrecedent = decalerMois(moisCourant, -1)
  const lignes: DepenseDatee[] = []

  const ajouter = (
    moisCle: string,
    jour: number,
    montant: number,
    categorie: Categorie,
    libelle: string,
    options: { recurrent?: boolean; serie?: string; note?: string } = {},
  ) => {
    const { annee, mois } = decomposerMois(moisCle)
    const jourBorne = Math.min(jour, nombreDeJours(annee, mois))
    lignes.push({
      id: `${options.serie ?? libelle}-${moisCle}-${jourBorne}`.toLowerCase().replace(/\s+/g, '-'),
      date: cleJour(annee, mois, jourBorne),
      montant,
      devise: 'MAD',
      categorie,
      libelle,
      recurrent: options.recurrent ?? false,
      serie: options.serie,
      note: options.note,
    })
  }

  // récurrences : elles démarrent le mois précédent et se projettent ensuite
  const recurrentes: Array<[number, number, Categorie, string, string]> = [
    [2, 3200, 'maintenance', 'Loyer', 'loyer'],
    [5, 300, 'maintenance', 'Téléphone & internet', 'telecom'],
    [6, 700, 'dettes', 'Remboursement à Karim', 'dette-karim'],
    [28, 1800, 'investissement', 'Versement mensuel', 'versement'],
  ]
  for (const [jour, montant, categorie, libelle, serie] of recurrentes) {
    ajouter(moisPrecedent, jour, montant, categorie, libelle, { recurrent: true, serie })
    ajouter(moisCourant, jour, montant, categorie, libelle, { recurrent: true, serie })
  }

  // ponctuelles du mois précédent
  ajouter(moisPrecedent, 8, 620, 'maintenance', 'Courses')
  ajouter(moisPrecedent, 14, 240, 'fun', 'Restaurant')
  ajouter(moisPrecedent, 19, 1450, 'objectifs', 'Acompte formation')
  ajouter(moisPrecedent, 23, 380, 'maintenance', 'Essence')

  // ponctuelles du mois en cours, avec un jour volontairement lourd
  ajouter(moisCourant, 4, 540, 'maintenance', 'Courses')
  ajouter(moisCourant, 9, 180, 'fun', 'Cinéma et sortie')
  ajouter(moisCourant, 11, 460, 'maintenance', 'Pharmacie')
  ajouter(moisCourant, 15, 2400, 'fun', 'Week-end à Essaouira', {
    note: 'Hôtel, transport et restaurants — à lisser le mois prochain.',
  })
  ajouter(moisCourant, 15, 320, 'maintenance', 'Essence')
  ajouter(moisCourant, 18, 590, 'maintenance', 'Courses')
  ajouter(moisCourant, 21, 260, 'fun', 'Livres et jeux')
  ajouter(moisCourant, 24, 900, 'objectifs', 'Deuxième acompte formation')

  return lignes
}

export const PROFIL_PAR_DEFAUT: ProfilFinancier = {
  prenom: 'Yacine',
  devise: 'MAD',
  revenuNet: 14000,
  depenses: DEPENSES_PAR_DEFAUT,
  methode: '70-30',
  allocation: { maintenance: 52, fun: 12, objectifs: 6, urgence: 12, investissement: 13, dettes: 5 },
  soldeFondsUrgence: 18400,
  dettes: { total: 12000, remboursementMensuel: 700, multiplicateurLimite: 3 },
  patrimoine: { liquide: 18400, creances: 3000, investi: 9500, revente: 0, usage: 45000 },
  tauxRendementAnnuel: 6,
  redirectionApresUrgence: 'investissement',
  journal: journalDemo(),
}

export const SIMULATION_PAR_DEFAUT: ParametresSimulation = {
  montantInitial: 0,
  versementMensuel: 1000,
  tauxAnnuel: 7,
  dureeAnnees: ANNEES_CARRIERE,
  momentVersement: 'debut',
}

/** Raccourcis de simulation, façon colonne de droite de la maquette. */
export const SCENARIOS: Array<{
  id: string
  titre: string
  resume: string
  parametres: Partial<ParametresSimulation>
}> = [
  {
    id: 'prudent',
    titre: 'Prudent',
    resume: `3 % par an sur ${ANNEES_CARRIERE} ans`,
    parametres: { tauxAnnuel: 3, dureeAnnees: ANNEES_CARRIERE },
  },
  {
    id: 'equilibre',
    titre: 'Équilibré',
    resume: `6 % par an sur ${ANNEES_CARRIERE} ans`,
    parametres: { tauxAnnuel: 6, dureeAnnees: ANNEES_CARRIERE },
  },
  {
    id: 'dix-ans',
    titre: 'Horizon court',
    resume: '7 % par an sur 10 ans',
    parametres: { tauxAnnuel: 7, dureeAnnees: 10 },
  },
]

export const LIBELLES_CATEGORIE: Record<
  Categorie,
  { titre: string; sousTitre: string; role: string; exemples: string }
> = {
  maintenance: {
    titre: 'Maintenance personnelle',
    sousTitre: 'Survie',
    role: 'Le coût mensuel pour tenir une vie stable. Subi, récurrent, et base de calcul du fonds d’urgence.',
    exemples: 'Logement, nourriture, eau, électricité, transport, santé, assurance, télécom, famille.',
  },
  urgence: {
    titre: 'Fonds d’urgence',
    sousTitre: 'Sécurité',
    role: 'Réserve liquide pour les coups durs. Objectif : six mois de maintenance. Sur un compte séparé, jamais investie.',
    exemples: 'Perte d’emploi, panne, urgence médicale, déménagement imprévu.',
  },
  dettes: {
    titre: 'Dettes personnelles',
    sousTitre: 'Remboursement',
    role: 'Argent emprunté à des proches, sans intérêt. Suivi pour visualiser une limite et éviter le surendettement.',
    exemples: 'Famille, amis, collègues.',
  },
  investissement: {
    titre: 'Capital productif',
    sousTitre: 'Long terme',
    role: 'Construction de capital sur une carrière. Aucune référence produit : seulement des montants et des hypothèses.',
    exemples: 'Versements réguliers, horizon long, aucun retrait avant terme.',
  },
  objectifs: {
    titre: 'Objectifs',
    sousTitre: 'Court/moyen terme',
    role: 'Projets planifiés qui ne sont pas des urgences. Datés, chiffrés, sortis du fonds d’urgence.',
    exemples: 'Permis, formation, ordinateur, voyage, équipement.',
  },
  fun: {
    titre: 'Fun money',
    sousTitre: 'Plaisir assumé',
    role: 'Argent dépensé sans culpabiliser, parce qu’il a été prévu. C’est ce qui rend la discipline tenable.',
    exemples: 'Sorties, restaurants, loisirs, achats non essentiels, gadgets.',
  },
}

/** Une teinte par catégorie, étendue de la charte. */
export const COULEURS_CATEGORIE: Record<
  Categorie,
  { trait: string; texte: string; puce: string; degrade: [string, string] }
> = {
  maintenance: {
    trait: '#44606E',
    texte: 'text-ardoise-deep',
    puce: 'bg-ardoise',
    degrade: ['#6E8A97', '#2C444F'],
  },
  urgence: {
    trait: '#3F8A3D',
    texte: 'text-foret-deep',
    puce: 'bg-foret',
    degrade: ['#6FA86D', '#2A5C29'],
  },
  dettes: {
    trait: '#B4452F',
    texte: 'text-brique-deep',
    puce: 'bg-brique',
    degrade: ['#D0806E', '#8A3120'],
  },
  investissement: {
    trait: '#1B5F8C',
    texte: 'text-saphir-deep',
    puce: 'bg-saphir',
    degrade: ['#4E83AB', '#0E3D5C'],
  },
  objectifs: {
    trait: '#6B4C8A',
    texte: 'text-prune-deep',
    puce: 'bg-prune',
    degrade: ['#9277AE', '#4C3363'],
  },
  fun: {
    trait: '#C77A21',
    texte: 'text-ambre-deep',
    puce: 'bg-ambre',
    degrade: ['#E0A461', '#96580F'],
  },
}

/** Classes de patrimoine inspirées de la zakat (context §6.6). */
export const LIBELLES_CAPITAL: Record<
  CategorieCapital,
  { titre: string; role: string; productif: boolean; degrade: [string, string] }
> = {
  liquide: {
    titre: 'Capital liquide',
    role: 'Cash, compte courant, épargne disponible immédiatement.',
    productif: true,
    degrade: ['#6FA86D', '#2A5C29'],
  },
  creances: {
    titre: 'Créances récupérables',
    role: 'Argent prêté que vous pensez récupérer.',
    productif: true,
    degrade: ['#9277AE', '#4C3363'],
  },
  investi: {
    titre: 'Capital investi',
    role: 'Portefeuille, parts, instruments financiers. Aucune référence produit.',
    productif: true,
    degrade: ['#4E83AB', '#0E3D5C'],
  },
  revente: {
    titre: 'Biens destinés à la revente',
    role: 'Actifs achetés pour être revendus.',
    productif: true,
    degrade: ['#E0A461', '#96580F'],
  },
  usage: {
    titre: 'Biens personnels d’usage',
    role: 'Voiture, mobilier, objets du quotidien. Non productifs, comptés à part.',
    productif: false,
    degrade: ['#8E9BA3', '#4A565E'],
  },
}
