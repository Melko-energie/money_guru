import { cleJour, decalerMois, decomposerMois, cleMoisDe, nombreDeJours } from '../lib/calendrier'
import type { Categorie, DepenseDatee, Depense, ProfilFinancier } from '../lib/types'

/**
 * Profil de test — il ne quitte jamais le dossier `test`.
 * L'application livrée ne contient aucune donnée inventée : elle démarre vide
 * et pose ses questions. Ce jeu-là sert uniquement à monter les vues dans les
 * tests, avec des chiffres stables.
 */
/** Frais de maintenance personnelle par défaut (context §4). */
export const DEPENSES_DE_TEST: Depense[] = [
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

/**
 * Profil d'exemple, chargeable depuis « Mes chiffres ».
 * Il ne s'applique jamais tout seul : au premier lancement, l'application
 * démarre sur un profil vide et pose ses questions.
 */
export const PROFIL_DE_TEST: ProfilFinancier = {
  prenom: 'Yacine',
  devise: 'MAD',
  revenuNet: 14000,
  depenses: DEPENSES_DE_TEST,
  methode: '70-30',
  allocation: { maintenance: 52, fun: 12, objectifs: 6, urgence: 12, investissement: 13, dettes: 5 },
  soldeFondsUrgence: 18400,
  dettes: { total: 12000, remboursementMensuel: 700, multiplicateurLimite: 3 },
  patrimoine: { liquide: 18400, creances: 3000, investi: 9500, revente: 0, usage: 45000 },
  tauxRendementAnnuel: 6,
  redirectionApresUrgence: 'investissement',
  journal: journalDemo(),
  versementSalaire: { jour: 1, financeMoisSuivant: false },
  mois: {},
  objectifs: [],
  onboarding: { etape: 0, termine: true },
}

