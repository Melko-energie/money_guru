import { ANNEES_CARRIERE } from './calculs'
import type { Categorie, CategorieCapital, ParametresSimulation } from './types'

/**
 * Réglages d'ouverture du simulateur — pas des données.
 * Le versement part de zéro : c'est la page qui l'amorce avec la part que
 * l'utilisateur alloue réellement au capital productif.
 */
export const SIMULATION_PAR_DEFAUT: ParametresSimulation = {
  montantInitial: 0,
  versementMensuel: 0,
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

/**
 * Une teinte par catégorie, toutes dérivées du nuancier T2
 * (bleu #74B5D5, olive #767D2F, olive profond #2F370E), sauf les dettes :
 * elles portent le rouge d'alerte, seule teinte ajoutée hors nuancier.
 */
export const COULEURS_CATEGORIE: Record<
  Categorie,
  { trait: string; texte: string; puce: string; degrade: [string, string] }
> = {
  maintenance: {
    trait: '#4A6E7C',
    texte: 'text-ardoise-deep',
    puce: 'bg-ardoise',
    degrade: ['#7C9AA6', '#2F4A55'],
  },
  urgence: {
    trait: '#767D2F',
    texte: 'text-foret-deep',
    puce: 'bg-foret',
    degrade: ['#A8B457', '#4E5A1C'],
  },
  dettes: {
    trait: '#B4452F',
    texte: 'text-brique-deep',
    puce: 'bg-brique',
    degrade: ['#D0806E', '#8A3120'],
  },
  investissement: {
    trait: '#3D470F',
    texte: 'text-saphir-deep',
    puce: 'bg-saphir',
    degrade: ['#6B7530', '#2F370E'],
  },
  objectifs: {
    trait: '#74B5D5',
    texte: 'text-prune-deep',
    puce: 'bg-prune',
    degrade: ['#9DCBE3', '#3F7B9E'],
  },
  fun: {
    trait: '#A8B457',
    texte: 'text-ambre-deep',
    puce: 'bg-ambre',
    degrade: ['#C6CE93', '#767D2F'],
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
    degrade: ['#A8B457', '#4E5A1C'],
  },
  creances: {
    titre: 'Créances récupérables',
    role: 'Argent prêté que vous pensez récupérer.',
    productif: true,
    degrade: ['#9DCBE3', '#3F7B9E'],
  },
  investi: {
    titre: 'Capital investi',
    role: 'Portefeuille, parts, instruments financiers. Aucune référence produit.',
    productif: true,
    degrade: ['#6B7530', '#2F370E'],
  },
  revente: {
    titre: 'Biens destinés à la revente',
    role: 'Actifs achetés pour être revendus.',
    productif: true,
    degrade: ['#7C9AA6', '#2F4A55'],
  },
  usage: {
    titre: 'Biens personnels d’usage',
    role: 'Voiture, mobilier, objets du quotidien. Non productifs, comptés à part.',
    productif: false,
    degrade: ['#A9B2B6', '#5A6468'],
  },
}
