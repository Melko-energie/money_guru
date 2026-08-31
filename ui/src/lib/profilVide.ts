import { ratiosMethode } from './methodes'
import type { Depense, ProfilFinancier } from './types'

/**
 * Les postes que l'onboarding propose de chiffrer.
 * Ce ne sont pas des données : ce sont des questions, toutes à zéro.
 */
const POSTES_SUGGERES: Depense[] = [
  { id: 'logement', libelle: 'Logement', montant: 0, icone: 'logement' },
  { id: 'nourriture', libelle: 'Nourriture', montant: 0, icone: 'alimentation' },
  { id: 'energie', libelle: 'Eau & électricité', montant: 0, icone: 'energie' },
  { id: 'transport', libelle: 'Transport', montant: 0, icone: 'transport' },
  { id: 'sante', libelle: 'Santé', montant: 0, icone: 'sante' },
  { id: 'assurance', libelle: 'Assurances', montant: 0, icone: 'assurance' },
  { id: 'telecom', libelle: 'Téléphone & internet', montant: 0, icone: 'telecom' },
  { id: 'famille', libelle: 'Obligations familiales', montant: 0, icone: 'famille' },
]

/**
 * Le profil de départ : rien d'inventé.
 * Tout est à zéro ou vide, et `onboarding.termine` reste faux tant que
 * l'utilisateur n'a pas répondu aux questions.
 */
export const PROFIL_VIDE: ProfilFinancier = {
  prenom: '',
  devise: 'MAD',
  revenuNet: 0,
  depenses: POSTES_SUGGERES,
  methode: '70-30',
  allocation: ratiosMethode('70-30', {
    maintenance: 0,
    urgence: 0,
    dettes: 0,
    investissement: 0,
    objectifs: 0,
    fun: 0,
  }),
  soldeFondsUrgence: 0,
  dettes: { total: 0, remboursementMensuel: 0, multiplicateurLimite: 3 },
  patrimoine: { liquide: 0, creances: 0, investi: 0, revente: 0, usage: 0 },
  tauxRendementAnnuel: 6,
  redirectionApresUrgence: 'investissement',
  journal: [],
  // par défaut le salaire finance le mois où il tombe : c'est à l'utilisateur
  // de dire s'il vit le mois suivant sur ce qu'il vient de toucher
  versementSalaire: { jour: 1, financeMoisSuivant: false },
  mois: {},
  objectifs: [],
  onboarding: { etape: 0, termine: false },
}
