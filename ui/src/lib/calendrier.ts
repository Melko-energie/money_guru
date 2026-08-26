import { CATEGORIES, montantsAlloues } from './calculs'
import type {
  Allocation,
  BilanMois,
  Categorie,
  DepenseDatee,
  EcartCategorie,
  JourCalendrier,
  LigneJournal,
  OccurrenceProjetee,
} from './types'

/* ------------------------------------------------------------------ */
/* Clés de date — chaînes ISO, insensibles au fuseau                   */
/* ------------------------------------------------------------------ */

const deuxChiffres = (n: number) => String(n).padStart(2, '0')

/** « 2026-03-07 » — `mois` est indexé de 0 à 11, comme `Date`. */
export function cleJour(annee: number, mois: number, jour: number): string {
  return `${annee}-${deuxChiffres(mois + 1)}-${deuxChiffres(jour)}`
}

/** « 2026-03 » */
export function cleMois(annee: number, mois: number): string {
  return `${annee}-${deuxChiffres(mois + 1)}`
}

export function moisDeCleJour(cle: string): string {
  return cle.slice(0, 7)
}

export function jourDeCle(cle: string): number {
  return Number(cle.slice(8, 10))
}

export function decomposerMois(cle: string): { annee: number; mois: number } {
  return { annee: Number(cle.slice(0, 4)), mois: Number(cle.slice(5, 7)) - 1 }
}

export function nombreDeJours(annee: number, mois: number): number {
  return new Date(annee, mois + 1, 0).getDate()
}

/** Décale d'un nombre de mois, sans jamais déborder sur le mois suivant. */
export function decalerMois(cle: string, pas: number): string {
  const { annee, mois } = decomposerMois(cle)
  const d = new Date(annee, mois + pas, 1)
  return cleMois(d.getFullYear(), d.getMonth())
}

export function cleMoisDe(date = new Date()): string {
  return cleMois(date.getFullYear(), date.getMonth())
}

export function cleJourDe(date = new Date()): string {
  return cleJour(date.getFullYear(), date.getMonth(), date.getDate())
}

const FORMAT_MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
const FORMAT_JOUR = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

export function libelleMois(cle: string): string {
  const { annee, mois } = decomposerMois(cle)
  const libelle = FORMAT_MOIS.format(new Date(annee, mois, 1))
  return libelle.charAt(0).toUpperCase() + libelle.slice(1)
}

export function libelleJour(cle: string): string {
  const { annee, mois } = decomposerMois(cle)
  const libelle = FORMAT_JOUR.format(new Date(annee, mois, jourDeCle(cle)))
  return libelle.charAt(0).toUpperCase() + libelle.slice(1)
}

/** Lundi en tête, convention française. */
export const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

/* ------------------------------------------------------------------ */
/* Récurrences                                                         */
/* ------------------------------------------------------------------ */

/** Toutes les occurrences réelles d'une série, triées de la plus ancienne à la plus récente. */
function parSerie(journal: DepenseDatee[]): Map<string, DepenseDatee[]> {
  const groupes = new Map<string, DepenseDatee[]>()
  for (const d of journal) {
    if (!d.recurrent) continue
    const serie = d.serie ?? d.id
    const liste = groupes.get(serie) ?? []
    liste.push(d)
    groupes.set(serie, liste)
  }
  for (const liste of groupes.values()) liste.sort((a, b) => a.date.localeCompare(b.date))
  return groupes
}

/**
 * Occurrences futures d'une récurrence, calculées à la volée pour un mois donné (FR-14).
 * Une série n'est projetée que si elle a démarré avant ce mois et qu'aucune occurrence
 * réelle n'y a encore été saisie — sinon on afficherait deux fois la même dépense.
 */
export function occurrencesProjetees(
  journal: DepenseDatee[],
  moisCible: string,
): OccurrenceProjetee[] {
  const { annee, mois } = decomposerMois(moisCible)
  const dernierJour = nombreDeJours(annee, mois)
  const projetees: OccurrenceProjetee[] = []

  for (const [serie, occurrences] of parSerie(journal)) {
    const premiere = occurrences[0]
    if (moisDeCleJour(premiere.date) >= moisCible) continue
    const dejaSaisie = occurrences.some((o) => moisDeCleJour(o.date) === moisCible)
    if (dejaSaisie) continue

    const modele = occurrences[occurrences.length - 1]
    const jour = Math.min(jourDeCle(premiere.date), dernierJour)
    projetees.push({
      ...modele,
      id: `projete-${serie}-${moisCible}`,
      date: cleJour(annee, mois, jour),
      serie,
      projetee: true,
    })
  }

  return projetees
}

/** Les séries récurrentes actives, une entrée par série (la plus récente). */
export function recurrencesActives(journal: DepenseDatee[]): DepenseDatee[] {
  return [...parSerie(journal).values()]
    .map((occurrences) => occurrences[occurrences.length - 1])
    .sort((a, b) => jourDeCle(a.date) - jourDeCle(b.date))
}

export function estProjetee(ligne: LigneJournal): ligne is OccurrenceProjetee {
  return (ligne as OccurrenceProjetee).projetee === true
}

/* ------------------------------------------------------------------ */
/* Agrégats du mois                                                    */
/* ------------------------------------------------------------------ */

export function depensesDuMois(journal: DepenseDatee[], moisCible: string): DepenseDatee[] {
  return journal.filter((d) => moisDeCleJour(d.date) === moisCible)
}

export function totalParCategorie(lignes: LigneJournal[]): Record<Categorie, number> {
  const totaux = CATEGORIES.reduce(
    (acc, c) => {
      acc[c] = 0
      return acc
    },
    {} as Record<Categorie, number>,
  )
  for (const l of lignes) totaux[l.categorie] += Math.max(0, l.montant)
  return totaux
}

/**
 * Seuil au-delà duquel un jour est signalé comme anormalement élevé :
 * moyenne des jours dépensés + 1,5 écart-type. En dessous de trois jours
 * dépensés, la statistique n'a pas de sens et rien n'est signalé.
 */
export function seuilJourEleve(totauxJournaliers: number[]): number {
  const actifs = totauxJournaliers.filter((t) => t > 0)
  if (actifs.length < 3) return Number.POSITIVE_INFINITY
  const moyenne = actifs.reduce((s, v) => s + v, 0) / actifs.length
  const variance = actifs.reduce((s, v) => s + (v - moyenne) ** 2, 0) / actifs.length
  return moyenne + 1.5 * Math.sqrt(variance)
}

/** Comparaison budget prévu / dépenses réelles, par catégorie (FR-13). */
export function ecartsParCategorie(
  revenuNet: number,
  allocation: Allocation,
  reelles: LigneJournal[],
  projetees: LigneJournal[],
): EcartCategorie[] {
  const budgets = montantsAlloues(revenuNet, allocation)
  const reels = totalParCategorie(reelles)
  const prevus = totalParCategorie(projetees)

  return CATEGORIES.map((categorie) => ({
    categorie,
    prevu: budgets[categorie],
    reel: reels[categorie],
    projete: prevus[categorie],
    ecart: reels[categorie] - budgets[categorie],
  }))
}

/**
 * Construit la grille du mois : six semaines de lundi à dimanche, chaque case
 * portant ses lignes, son total et son marqueur de jour coûteux.
 */
export function construireBilan(
  journal: DepenseDatee[],
  moisCible: string,
  revenuNet: number,
  allocation: Allocation,
): BilanMois {
  const { annee, mois } = decomposerMois(moisCible)
  const reelles = depensesDuMois(journal, moisCible)
  const projetees = occurrencesProjetees(journal, moisCible)
  const lignes: LigneJournal[] = [...reelles, ...projetees]

  const parJour = new Map<string, LigneJournal[]>()
  for (const l of lignes) {
    const liste = parJour.get(l.date) ?? []
    liste.push(l)
    parJour.set(l.date, liste)
  }

  const dernierJour = nombreDeJours(annee, mois)
  const totauxReels: number[] = []
  for (let j = 1; j <= dernierJour; j += 1) {
    const duJour = parJour.get(cleJour(annee, mois, j)) ?? []
    totauxReels.push(duJour.filter((l) => !estProjetee(l)).reduce((s, l) => s + l.montant, 0))
  }
  const seuil = seuilJourEleve(totauxReels)

  // décalage pour démarrer la grille un lundi
  const premierJourSemaine = (new Date(annee, mois, 1).getDay() + 6) % 7
  const cases: JourCalendrier[] = []

  for (let i = 0; i < 42; i += 1) {
    const numero = i - premierJourSemaine + 1
    const dansLeMois = numero >= 1 && numero <= dernierJour
    if (!dansLeMois) {
      cases.push({
        cle: `hors-${i}`,
        jour: 0,
        dansLeMois: false,
        total: 0,
        totalProjete: 0,
        lignes: [],
        eleve: false,
      })
      continue
    }
    const cle = cleJour(annee, mois, numero)
    const duJour = (parJour.get(cle) ?? []).sort((a, b) => b.montant - a.montant)
    const total = duJour.filter((l) => !estProjetee(l)).reduce((s, l) => s + l.montant, 0)
    const totalProjete = duJour.filter(estProjetee).reduce((s, l) => s + l.montant, 0)
    cases.push({
      cle,
      jour: numero,
      dansLeMois: true,
      total,
      totalProjete,
      lignes: duJour,
      eleve: total > 0 && total > seuil,
    })
  }

  // la sixième semaine ne sert que si le mois déborde
  const semainesUtiles = Math.ceil((premierJourSemaine + dernierJour) / 7)
  const jours = cases.slice(0, semainesUtiles * 7)

  const totalReel = totauxReels.reduce((s, v) => s + v, 0)
  const totalProjete = projetees.reduce((s, l) => s + l.montant, 0)
  const ecarts = ecartsParCategorie(revenuNet, allocation, reelles, projetees)

  return {
    cle: moisCible,
    annee,
    mois,
    jours,
    totalReel,
    totalProjete,
    totalPrevu: ecarts.reduce((s, e) => s + e.prevu, 0),
    ecarts,
    seuilJourEleve: seuil,
    joursCouteux: jours
      .filter((j) => j.dansLeMois && j.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3),
    recurrences: recurrencesActives(journal),
  }
}
