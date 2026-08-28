import {
  MOIS_OBJECTIF_URGENCE,
  moisCouverts,
  objectifFondsUrgence,
  progressionUrgence,
  usageLimiteEmprunt,
} from './calculs'
import { cleMoisDe, decalerMois, decomposerMois, libelleMois } from './calendrier'
import { formaterDevise, formaterDuree } from './format'
import { revenuDuMois } from './suivi'
import type { Objectif, ProfilFinancier } from './types'

/** Au-delà de vingt ans, un objectif n’en est plus un : on arrête de chercher. */
export const MOIS_HORIZON_MAX = 240

/** Un achat qui mobilise plus d’un quart du revenu chaque mois mérite d’être signalé. */
export const SEUIL_EFFORT_LOURD = 0.25

/**
 * Nombre de mois entre deux clés « AAAA-MM », borne de départ incluse.
 * Août → février de l’année suivante donne 7 : les sept mois où l’on peut
 * encore mettre de côté, celui de l’achat compris.
 */
export function moisEntre(depuis: string, jusqua: string): number {
  const a = decomposerMois(depuis)
  const b = decomposerMois(jusqua)
  const ecart = (b.annee - a.annee) * 12 + (b.mois - a.mois)
  return ecart < 0 ? 0 : ecart + 1
}

/** Ce que le poste choisi met de côté ce mois-là, au revenu de ce mois-là. */
export function partMensuelle(
  profil: ProfilFinancier,
  cle: string,
  categorie: Objectif['categorie'],
): number {
  return (revenuDuMois(profil, cle) * profil.allocation[categorie]) / 100
}

export type FaisabiliteObjectif = {
  objectif: Objectif
  /** Mois de mise de côté restants, celui de l’achat compris. 0 si l’échéance est passée. */
  moisRestants: number
  /** Ce qu’il reste à réunir. */
  manquant: number
  /** Ce qu’il faudrait mettre de côté chaque mois pour tenir la date. */
  effortMensuel: number
  /** Ce que le poste choisi met réellement de côté, en moyenne, d’ici là. */
  capaciteMensuelle: number
  /** Tout ce que le poste aura mis de côté d’ici l’échéance. */
  capaciteTotale: number
  /** capacité − effort : négatif, c’est ce qui manque chaque mois. */
  ecartMensuel: number
  atteignable: boolean
  /** Mois où l’objectif serait financé au rythme actuel, `null` si jamais. */
  moisAtteinte: string | null
  /** Mois de retard sur l’échéance visée, 0 si elle est tenue. */
  retardMois: number
  /** Part du revenu du mois que représente l’effort mensuel. */
  partDuRevenu: number
  /** Avancement du financement, en %. */
  progressionPct: number
  /** Points de ratio à ajouter au poste pour tenir la date. */
  pointsARajouter: number
}

/**
 * Confronte un objectif à la situation réelle : ce que le poste choisi met de
 * côté, mois après mois, aux salaires annoncés pour ces mois-là.
 */
export function faisabilite(
  profil: ProfilFinancier,
  objectif: Objectif,
  moisCourant = cleMoisDe(),
): FaisabiliteObjectif {
  const montant = Math.max(0, objectif.montant)
  const dejaMisDeCote = Math.max(0, objectif.dejaMisDeCote)
  const manquant = Math.max(0, montant - dejaMisDeCote)
  const moisRestants = moisEntre(moisCourant, objectif.moisCible)

  let capaciteTotale = 0
  for (let i = 0; i < moisRestants; i += 1) {
    capaciteTotale += partMensuelle(profil, decalerMois(moisCourant, i), objectif.categorie)
  }
  const capaciteMensuelle = moisRestants > 0 ? capaciteTotale / moisRestants : 0
  const effortMensuel = moisRestants > 0 ? manquant / moisRestants : manquant

  // on avance mois par mois plutôt que de diviser : les salaires annoncés ne
  // sont pas identiques d’un mois à l’autre, une moyenne mentirait
  let cumul = dejaMisDeCote
  let moisAtteinte: string | null = cumul >= montant ? moisCourant : null
  let curseur = moisCourant
  for (let i = 0; i < MOIS_HORIZON_MAX && moisAtteinte === null; i += 1) {
    cumul += partMensuelle(profil, curseur, objectif.categorie)
    if (cumul >= montant) moisAtteinte = curseur
    else curseur = decalerMois(curseur, 1)
  }

  const revenu = revenuDuMois(profil, moisCourant)
  const pointsNecessaires =
    revenu > 0 && effortMensuel > 0 ? Math.ceil((effortMensuel / revenu) * 100) : 0

  return {
    objectif,
    moisRestants,
    manquant,
    effortMensuel,
    capaciteMensuelle,
    capaciteTotale,
    ecartMensuel: capaciteMensuelle - effortMensuel,
    atteignable: dejaMisDeCote + capaciteTotale >= montant,
    moisAtteinte,
    retardMois:
      moisAtteinte && moisAtteinte > objectif.moisCible
        ? moisEntre(objectif.moisCible, moisAtteinte) - 1
        : 0,
    partDuRevenu: revenu > 0 ? effortMensuel / revenu : 0,
    progressionPct: montant > 0 ? Math.min(100, (dejaMisDeCote / montant) * 100) : 0,
    pointsARajouter: Math.max(0, pointsNecessaires - profil.allocation[objectif.categorie]),
  }
}

/**
 * Les bonnes pratiques à suivre d’ici l’achat, tirées de la situation réelle.
 * Aucune n’est décorative : chacune correspond à une condition mesurée.
 */
export function conseils(profil: ProfilFinancier, f: FaisabiliteObjectif): string[] {
  const montant = (v: number) => formaterDevise(v, profil.devise, 0)
  const liste: string[] = []

  if (f.manquant <= 0) {
    liste.push('Le montant est déjà de côté. Enregistrez l’achat le moment venu, rien de plus.')
  } else if (f.moisRestants === 0) {
    liste.push(
      `L’échéance est passée et il manque ${montant(f.manquant)}. Repoussez la date pour que l’application puisse calculer un rythme.`,
    )
  } else if (f.atteignable) {
    liste.push(
      `Mettez ${montant(f.effortMensuel)} de côté chaque mois pendant ${formaterDuree(f.moisRestants)} : c’est exactement ce qu’il faut pour tenir la date.`,
    )
    if (f.ecartMensuel > 0) {
      liste.push(
        `Votre poste dégage ${montant(f.ecartMensuel)} de plus chaque mois que nécessaire. Ce surplus a plus de valeur en investissement qu’en attente sur le compte courant.`,
      )
    }
  } else {
    liste.push(
      `Il manque ${montant(Math.abs(f.ecartMensuel))} par mois. En l’état, l’objectif n’est pas tenable à la date visée.`,
    )
    if (f.moisAtteinte) {
      liste.push(
        `Sans rien changer, vous y êtes en ${libelleMois(f.moisAtteinte).toLowerCase()} — ${formaterDuree(f.retardMois)} plus tard. Décaler l’achat coûte moins cher que de rogner sur la sécurité.`,
      )
    } else {
      liste.push(
        'Au rythme actuel, ce poste ne financera jamais cet achat : sa part du revenu est trop faible, ou nulle.',
      )
    }
    // on ne propose de monter la part que si les points existent ailleurs :
    // la maintenance est un coût subi, on ne la rogne pas pour un achat
    const pointsDisponibles = 100 - profil.allocation.maintenance - profil.allocation[f.objectif.categorie]
    if (f.pointsARajouter > 0 && f.pointsARajouter <= pointsDisponibles) {
      liste.push(
        `Autre voie : monter ce poste de ${f.pointsARajouter} points de votre revenu. Les autres postes baissent d’autant — regardez lequel peut l’absorber.`,
      )
    }
    liste.push(
      `Troisième voie : viser ${montant(f.objectif.dejaMisDeCote + f.capaciteTotale)}, le budget que votre situation finance réellement d’ici là.`,
    )
  }

  const urgencePleine =
    progressionUrgence(profil.soldeFondsUrgence, objectifFondsUrgence(profil.depenses)) >= 1
  if (!urgencePleine && f.manquant > 0) {
    const couverture = Math.floor(moisCouverts(profil.soldeFondsUrgence, profil.depenses))
    liste.push(
      `Votre fonds d’urgence couvre ${formaterDuree(couverture)} sur les ${MOIS_OBJECTIF_URGENCE} visés. Un imprévu avant l’achat viderait ce que vous mettez de côté : gardez cette priorité devant.`,
    )
  }

  if (usageLimiteEmprunt(revenuDuMois(profil, cleMoisDe()), profil.dettes) > 1) {
    liste.push(
      'Votre dette dépasse la limite que vous vous êtes fixée. La solder avant cet achat vous rend la marge que vous cherchez ici.',
    )
  }

  if (f.partDuRevenu > SEUIL_EFFORT_LOURD) {
    liste.push(
      'Cet achat mobilise plus d’un quart de votre revenu chaque mois. C’est faisable, mais il ne restera presque rien pour le reste : décidez-le en connaissance de cause.',
    )
  }

  return liste
}

/** Du plus proche au plus lointain : ce qui arrive d’abord se décide d’abord. */
export function objectifsTries(objectifs: Objectif[]): Objectif[] {
  return [...objectifs].sort((a, b) => a.moisCible.localeCompare(b.moisCible))
}
