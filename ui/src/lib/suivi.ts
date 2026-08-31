import { CATEGORIES, fraisMaintenance, montantsAlloues } from './calculs'
import {
  anneeDeCle,
  cleMois,
  cleMoisDe,
  decalerMois,
  moisDeLAnnee,
  moisDeCleJour,
} from './calendrier'
import type {
  Categorie,
  CumulMois,
  Depense,
  DepenseDatee,
  MoisSuivi,
  ProfilFinancier,
  SituationMois,
} from './types'

/** Au-delà, on ne remonte plus la chaîne : trois ans suffisent à tout affichage. */
const MOIS_CHAINE_MAX = 36

const parCategorie = (valeur = 0): Record<Categorie, number> =>
  CATEGORIES.reduce(
    (acc, c) => {
      acc[c] = valeur
      return acc
    },
    {} as Record<Categorie, number>,
  )

/* ------------------------------------------------------------------ */
/* Le mois, unité de suivi                                             */
/* ------------------------------------------------------------------ */

/** Salaire touché à la fin de ce mois-là ; à défaut, celui du profil. */
export function salairePercu(profil: ProfilFinancier, cle: string): number {
  const saisi = profil.mois[cle]?.revenuPercu
  return saisi === undefined || saisi === null ? profil.revenuNet : Math.max(0, saisi)
}

/**
 * Le mois dont le salaire finance `cle`.
 * Quand le salaire tombe le 28, ce qui est touché fin août fait vivre
 * septembre : le mois de septembre est financé par le salaire d'août.
 */
export function moisFinancant(profil: ProfilFinancier, cle: string): string {
  return profil.versementSalaire?.financeMoisSuivant ? decalerMois(cle, -1) : cle
}

/**
 * L'inverse de `moisFinancant` : le mois que le salaire de `cle` fait vivre.
 * Touché fin août, il couvre septembre.
 */
function moisCouvert(profil: ProfilFinancier, cle: string): string {
  return profil.versementSalaire?.financeMoisSuivant ? decalerMois(cle, 1) : cle
}

/** Ce dont on dispose pour vivre ce mois-là, décalage du versement compris. */
export function revenuDuMois(profil: ProfilFinancier, cle: string): number {
  return salairePercu(profil, moisFinancant(profil, cle))
}

/**
 * Les postes de frais qui valent pour ce mois : les siens s'il en a, sinon
 * ceux du modèle. C'est ce que « Mes chiffres » montre quand on choisit un mois.
 */
export function postesDuMois(profil: ProfilFinancier, cle: string): Depense[] {
  return profil.mois[cle]?.depenses ?? profil.depenses
}

/** Vrai si ce mois a sa propre liste de postes, différente du modèle. */
export function moisDetaille(profil: ProfilFinancier, cle: string): boolean {
  return Array.isArray(profil.mois[cle]?.depenses)
}

/**
 * Frais retenus pour ce mois. Le détail prime sur le total, le total prime
 * sur le modèle : c'est toujours la déclaration la plus précise qui gagne.
 */
export function fraisDuMois(profil: ProfilFinancier, cle: string): number {
  const fiche = profil.mois[cle]
  if (Array.isArray(fiche?.depenses)) return fraisMaintenance(fiche.depenses)
  const saisi = fiche?.fraisMaintenance
  return saisi === undefined || saisi === null
    ? fraisMaintenance(profil.depenses)
    : Math.max(0, saisi)
}

function moisClos(profil: ProfilFinancier, cle: string): boolean {
  return profil.mois[cle]?.clos === true
}

/** Dépenses réellement saisies ce mois, par catégorie. */
export function depensesDuMoisParCategorie(
  journal: DepenseDatee[],
  cle: string,
): Record<Categorie, number> {
  const totaux = parCategorie()
  for (const ligne of journal) {
    if (moisDeCleJour(ligne.date) !== cle) continue
    totaux[ligne.categorie] += Math.max(0, ligne.montant)
  }
  return totaux
}

/**
 * Le mois le plus ancien qui porte une donnée — première dépense saisie ou
 * premier mois renseigné. C'est de là que part la chaîne.
 */
export function premierMoisSuivi(profil: ProfilFinancier): string {
  const cles = [
    ...profil.journal.map((l) => moisDeCleJour(l.date)),
    ...Object.keys(profil.mois),
  ]
  if (cles.length === 0) return cleMoisDe()
  return cles.reduce((min, c) => (c < min ? c : min))
}

/* ------------------------------------------------------------------ */
/* La chaîne : ce qui reste passe au mois suivant                      */
/* ------------------------------------------------------------------ */

/**
 * Situation d'un mois, report compris.
 *
 * Le report entrant n'est jamais stocké : il est recalculé depuis le premier
 * mois porteur de données. C'est ce qui garantit qu'une correction sur un mois
 * ancien se propage à tous les suivants, au lieu de laisser deux chiffres
 * diverger en silence.
 */
export function situationMois(profil: ProfilFinancier, cible: string): SituationMois {
  return chaineSuivi(profil, cible).slice(-1)[0]
}

/**
 * Toute la chaîne, du premier mois porteur de données jusqu'à `cible`.
 * Le reste de chaque mois devient le report entrant du suivant, catégorie
 * par catégorie : ce qui reste de fun money reste du fun money.
 */
export function chaineSuivi(profil: ProfilFinancier, cible = cleMoisDe()): SituationMois[] {
  let curseur = premierMoisSuivi(profil)
  if (curseur > cible) curseur = cible

  const situations: SituationMois[] = []
  let report = parCategorie()

  for (let i = 0; i < MOIS_CHAINE_MAX; i += 1) {
    const revenu = revenuDuMois(profil, curseur)
    const alloue = montantsAlloues(revenu, profil.allocation)
    const depense = depensesDuMoisParCategorie(profil.journal, curseur)
    // les frais déclarés sortent sans saisie : les ignorer ferait croire que
    // la maintenance ne coûte rien tant qu'on n'a pas tapé son loyer
    const chargesFixes = fraisDuMois(profil, curseur)

    const budget = parCategorie()
    const reste = parCategorie()
    for (const c of CATEGORIES) {
      budget[c] = report[c] + alloue[c]
      reste[c] = budget[c] - depense[c] - (c === 'maintenance' ? chargesFixes : 0)
    }

    const somme = (r: Record<Categorie, number>) => CATEGORIES.reduce((s, c) => s + r[c], 0)
    const totalDepense = somme(depense)

    situations.push({
      cle: curseur,
      revenu,
      reportEntrant: report,
      alloue,
      budget,
      depense,
      chargesFixes,
      reste,
      totalReportEntrant: somme(report),
      totalBudget: somme(budget),
      totalDepense,
      totalCharges: chargesFixes,
      totalSorties: totalDepense + chargesFixes,
      totalReste: somme(reste),
      clos: moisClos(profil, curseur),
    })

    if (curseur === cible) break
    // seul un mois clos transmet son reste : tant qu'il est ouvert, on n'anticipe pas
    report = moisClos(profil, curseur) ? reste : parCategorie()
    curseur = decalerMois(curseur, 1)
  }

  return situations
}

/** Les douze mois d'une année, chacun avec son report et son reste. */
export function situationsAnnee(profil: ProfilFinancier, annee: number): SituationMois[] {
  return moisDeLAnnee(annee).map((cle) => situationMois(profil, cle))
}

/* ------------------------------------------------------------------ */
/* L'avancement cumulé de l'année                                      */
/* ------------------------------------------------------------------ */

/**
 * Un mois compte dans l'avancement s'il est passé, ou si son salaire a été
 * saisi d'avance. Sans cette règle, les mois futurs gonfleraient le cumul
 * avec un salaire supposé que l'utilisateur n'a jamais annoncé.
 */
function moisRenseigne(
  profil: ProfilFinancier,
  cle: string,
  moisCourant = cleMoisDe(),
): boolean {
  const saisi = profil.mois[cle]?.revenuPercu
  if (saisi !== undefined && saisi !== null) return true
  // avant le début du suivi il n'y a rien à compter : inventer des mois
  // antérieurs gonflerait le cumul avec un salaire jamais annoncé
  if (cle < debutSuivi(profil)) return false
  return cle <= moisCourant
}

/**
 * Janvier de la première année porteuse de données.
 * C'est de là que part le cumul, et il ne repart jamais à zéro ensuite :
 * ce que 2026 a laissé entre dans 2027.
 */
function debutSuivi(profil: ProfilFinancier): string {
  return cleMois(anneeDeCle(premierMoisSuivi(profil)), 0)
}

/** Au-delà, on arrête de remonter : personne ne suit un budget sur cinquante ans. */
const MOIS_CUMUL_MAX = 600

/** Le cumul mois par mois, de `debut` à `fin` inclus. */
function cumulEntre(
  profil: ProfilFinancier,
  debut: string,
  fin: string,
  moisCourant: string,
): CumulMois[] {
  const lignes: CumulMois[] = []
  let cumulRevenu = 0
  let cumulMaintenance = 0
  let curseur = debut

  for (let i = 0; i < MOIS_CUMUL_MAX && curseur <= fin; i += 1) {
    const renseigne = moisRenseigne(profil, curseur, moisCourant)
    // ce tableau montre le salaire au mois où il est touché, pas au mois
    // qu'il finance : c'est la ligne que l'utilisateur saisit lui-même
    const revenu = renseigne ? salairePercu(profil, curseur) : 0
    // en revanche les frais sont ceux du mois que ce salaire fait vivre :
    // retrancher les frais d'août d'un salaire qui sert à vivre septembre
    // donnerait un « net » qui ne correspond à aucun mois réel
    const moisFinance = moisCouvert(profil, curseur)
    const maintenance = renseigne ? fraisDuMois(profil, moisFinance) : 0
    cumulRevenu += revenu
    cumulMaintenance += maintenance
    lignes.push({
      cle: curseur,
      moisFinance,
      renseigne,
      revenu,
      maintenance,
      net: revenu - maintenance,
      cumulRevenu,
      cumulMaintenance,
      cumulNet: cumulRevenu - cumulMaintenance,
    })
    curseur = decalerMois(curseur, 1)
  }

  return lignes
}

/** Ce que les années précédentes ont laissé, à l'entrée du 1er janvier. */
export function reportAvantAnnee(
  profil: ProfilFinancier,
  annee: number,
  moisCourant = cleMoisDe(),
): { revenu: number; maintenance: number; net: number } {
  const debut = debutSuivi(profil)
  const janvier = cleMois(annee, 0)
  if (debut >= janvier) return { revenu: 0, maintenance: 0, net: 0 }

  const lignes = cumulEntre(profil, debut, decalerMois(janvier, -1), moisCourant)
  const dernier = lignes[lignes.length - 1]
  if (!dernier) return { revenu: 0, maintenance: 0, net: 0 }
  return {
    revenu: dernier.cumulRevenu,
    maintenance: dernier.cumulMaintenance,
    net: dernier.cumulNet,
  }
}

/**
 * Les douze mois de l'année en cumul : salaire déjà accumulé + salaire du
 * mois − frais de maintenance = avancement restant.
 *
 * La maintenance retenue est le coût mensuel déclaré, pas les dépenses
 * saisies : c'est la charge qui revient de toute façon.
 */
export function cumulAnnee(
  profil: ProfilFinancier,
  annee: number,
  moisCourant = cleMoisDe(),
): CumulMois[] {
  const debut = debutSuivi(profil)
  const janvier = cleMois(annee, 0)
  // on repart du début du suivi pour que le cumul traverse les années :
  // ce que décembre a laissé est ce dont janvier hérite
  const depart = debut < janvier ? debut : janvier
  const lignes = cumulEntre(profil, depart, cleMois(annee, 11), moisCourant)

  const douze = lignes.slice(-12)
  // une année entièrement antérieure au suivi n'a aucune ligne calculée
  if (douze.length === 12) return douze
  return moisDeLAnnee(annee).map(
    (cle) =>
      douze.find((l) => l.cle === cle) ?? {
        cle,
        moisFinance: moisCouvert(profil, cle),
        renseigne: false,
        revenu: 0,
        maintenance: 0,
        net: 0,
        cumulRevenu: 0,
        cumulMaintenance: 0,
        cumulNet: 0,
      },
  )
}

/* ------------------------------------------------------------------ */
/* Le journal bouge les soldes                                         */
/* ------------------------------------------------------------------ */

/**
 * Effet d'une ligne du journal sur les soldes du profil.
 * Une dépense « fonds d'urgence » est de l'argent mis de côté : elle augmente
 * le solde. Une dépense « dettes » est un remboursement : elle réduit le dû.
 * `sens` vaut 1 quand on ajoute la ligne, −1 quand on la retire.
 */
export function effetSurSoldes(
  ligne: Pick<DepenseDatee, 'categorie' | 'montant'>,
  sens: 1 | -1,
): { urgence: number; dette: number } {
  const montant = Math.max(0, ligne.montant) * sens
  if (ligne.categorie === 'urgence') return { urgence: montant, dette: 0 }
  if (ligne.categorie === 'dettes') return { urgence: 0, dette: -montant }
  return { urgence: 0, dette: 0 }
}

/** Applique un effet au profil, en gardant les soldes positifs. */
export function appliquerEffet(
  profil: ProfilFinancier,
  effet: { urgence: number; dette: number },
): ProfilFinancier {
  if (effet.urgence === 0 && effet.dette === 0) return profil
  return {
    ...profil,
    soldeFondsUrgence: Math.max(0, profil.soldeFondsUrgence + effet.urgence),
    dettes: { ...profil.dettes, total: Math.max(0, profil.dettes.total + effet.dette) },
    patrimoine: {
      ...profil.patrimoine,
      // le fonds d'urgence fait partie du capital liquide
      liquide: Math.max(0, profil.patrimoine.liquide + effet.urgence),
    },
  }
}

/** Fiche de suivi d'un mois, créée à la volée avec les valeurs du profil. */
export function ficheMois(profil: ProfilFinancier, cle: string): MoisSuivi {
  const enregistree = profil.mois[cle]
  if (!enregistree) return { cle, revenuPercu: null, fraisMaintenance: null, clos: false }
  // les fiches écrites avant le suivi des frais n'ont pas ce champ
  return { fraisMaintenance: null, ...enregistree }
}
