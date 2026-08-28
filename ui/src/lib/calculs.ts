import type {
  Allocation,
  Categorie,
  Depense,
  Dettes,
  Palier,
  ParametresSimulation,
  Patrimoine,
  PointProjection,
  ProfilFinancier,
  ResultatSimulation,
  ScoreMarge,
} from './types'

/** Objectif du fonds d'urgence, en mois de frais de maintenance (context §6.3). */
export const MOIS_OBJECTIF_URGENCE = 6

/** Horizon principal : une carrière moyenne complète (context §3, §6.5). */
export const ANNEES_CARRIERE = 42

/** Au-delà, la pression de maintenance devient un signal d'alerte. */
export const SEUIL_PRESSION_MAINTENANCE = 0.6
/** Au-delà, le remboursement mensuel pèse trop sur le revenu. */
export const SEUIL_RATIO_REMBOURSEMENT = 0.2

export const CATEGORIES: Categorie[] = [
  'maintenance',
  'urgence',
  'dettes',
  'investissement',
  'objectifs',
  'fun',
]

/** Les postes qui construisent la sécurité et le futur (context §5.2, §5.3). */
export const CATEGORIES_FUTUR: Categorie[] = ['urgence', 'dettes', 'investissement', 'objectifs']

/* ------------------------------------------------------------------ */
/* Frais de maintenance personnelle                                    */
/* ------------------------------------------------------------------ */

/** frais_maintenance_mensuels : le total réel saisi par l'utilisateur. */
export function fraisMaintenance(depenses: Depense[]): number {
  return depenses.reduce((somme, d) => somme + Math.max(0, d.montant), 0)
}

/** pression = frais / revenu, à partir d'un total de frais déjà connu. */
export function pressionDeFrais(revenuNet: number, frais: number): number {
  if (revenuNet <= 0) return 0
  return frais / revenuNet
}

/** pression_maintenance = frais_maintenance_mensuels / revenu_net_mensuel */
export function pressionMaintenance(revenuNet: number, depenses: Depense[]): number {
  return pressionDeFrais(revenuNet, fraisMaintenance(depenses))
}

/** Ce qui reste une fois la maintenance réelle payée. */
export function resteApresMaintenance(revenuNet: number, depenses: Depense[]): number {
  return revenuNet - fraisMaintenance(depenses)
}

/* ------------------------------------------------------------------ */
/* Allocation                                                          */
/* ------------------------------------------------------------------ */

/** montant_categorie = revenu_net_mensuel * ratio_categorie */
export function montantsAlloues(
  revenuNet: number,
  allocation: Allocation,
): Record<Categorie, number> {
  return CATEGORIES.reduce(
    (acc, c) => {
      acc[c] = (revenuNet * allocation[c]) / 100
      return acc
    },
    {} as Record<Categorie, number>,
  )
}

/** Part cumulée consacrée à la sécurité et au futur, en %. */
export function partFutur(allocation: Allocation): number {
  return CATEGORIES_FUTUR.reduce((s, c) => s + allocation[c], 0)
}

/** Part cumulée consacrée à la vie courante (maintenance + fun), en %. */
export function partVie(allocation: Allocation): number {
  return allocation.maintenance + allocation.fun
}

/**
 * Règle une catégorie et redistribue l'écart sur les autres, proportionnellement
 * à leur poids, pour que la somme reste à 100 % (FR-03).
 */
export function ajusterAllocation(
  allocation: Allocation,
  categorie: Categorie,
  valeur: number,
): Allocation {
  const cible = Math.min(100, Math.max(0, Math.round(valeur)))
  const autres = CATEGORIES.filter((c) => c !== categorie)
  const restant = 100 - cible
  const sommeAutres = autres.reduce((s, c) => s + allocation[c], 0)

  const suivante = { ...allocation, [categorie]: cible } as Allocation

  if (sommeAutres <= 0) {
    const part = Math.floor(restant / autres.length)
    let distribue = 0
    autres.forEach((c, i) => {
      const v = i === autres.length - 1 ? restant - distribue : part
      suivante[c] = v
      distribue += v
    })
    return suivante
  }

  let distribue = 0
  autres.forEach((c, i) => {
    if (i === autres.length - 1) {
      suivante[c] = restant - distribue
    } else {
      const part = Math.round((allocation[c] / sommeAutres) * restant)
      suivante[c] = part
      distribue += part
    }
  })
  return suivante
}

/**
 * Bascule toute la part d'une catégorie sur une autre.
 * Transfert exact, sans redistribution : la somme reste à 100 %.
 * Sert quand le fonds d'urgence est plein et que sa part doit servir ailleurs.
 */
export function redirigerPart(
  allocation: Allocation,
  source: Categorie,
  cible: Categorie,
): Allocation {
  if (source === cible || allocation[source] <= 0) return allocation
  return {
    ...allocation,
    [source]: 0,
    [cible]: allocation[cible] + allocation[source],
  }
}

/** Corrige un jeu de ratios pour qu'il totalise exactement 100 %. */
export function normaliserAllocation(allocation: Allocation): Allocation {
  const somme = CATEGORIES.reduce((s, c) => s + Math.max(0, allocation[c]), 0)
  if (somme === 0) return ajusterAllocation(allocation, 'maintenance', 100)
  if (somme === 100) return allocation

  const suivante = {} as Allocation
  let distribue = 0
  CATEGORIES.forEach((c, i) => {
    if (i === CATEGORIES.length - 1) {
      suivante[c] = 100 - distribue
    } else {
      const v = Math.round((Math.max(0, allocation[c]) / somme) * 100)
      suivante[c] = v
      distribue += v
    }
  })
  return suivante
}

/* ------------------------------------------------------------------ */
/* Fonds d'urgence                                                     */
/* ------------------------------------------------------------------ */

/** objectif_fonds_urgence = frais_maintenance_mensuels * 6 */
export function objectifFondsUrgence(depenses: Depense[]): number {
  return fraisMaintenance(depenses) * MOIS_OBJECTIF_URGENCE
}

/** mois_couverts = solde_fonds_urgence / frais_maintenance_mensuels */
export function moisCouverts(solde: number, depenses: Depense[]): number {
  const frais = fraisMaintenance(depenses)
  if (frais <= 0) return 0
  return solde / frais
}

/** progression = solde_fonds_urgence / objectif_fonds_urgence, bornée à [0, 1]. */
export function progressionUrgence(solde: number, objectif: number): number {
  if (objectif <= 0) return 0
  return Math.min(1, Math.max(0, solde / objectif))
}

/** Mois restants avant l'objectif au rythme d'allocation actuel. */
export function moisRestantsUrgence(
  solde: number,
  objectif: number,
  versementMensuel: number,
): number | null {
  if (solde >= objectif) return 0
  if (versementMensuel <= 0) return null
  return Math.ceil((objectif - solde) / versementMensuel)
}

/** Paliers 1 / 3 / 6 mois (context §6.3). */
export function paliersUrgence(depenses: Depense[], solde: number): Palier[] {
  const frais = fraisMaintenance(depenses)
  const modele = [
    { mois: 1, libelle: 'Premier filet', description: 'un mois de maintenance couvert' },
    { mois: 3, libelle: 'Stabilité minimale', description: 'trois mois, le socle recommandé' },
    { mois: 6, libelle: 'Objectif atteint', description: 'six mois, marge de manœuvre réelle' },
  ]
  return modele.map((p) => {
    const montant = frais * p.mois
    return { ...p, montant, atteint: montant > 0 && solde >= montant }
  })
}

/* ------------------------------------------------------------------ */
/* Dettes personnelles sans intérêt                                    */
/* ------------------------------------------------------------------ */

/** limite_emprunt = revenu_net_mensuel * multiplicateur_limite */
export function limiteEmprunt(revenuNet: number, dettes: Dettes): number {
  return Math.max(0, revenuNet) * Math.max(0, dettes.multiplicateurLimite)
}

/** ratio_remboursement = remboursement_mensuel / revenu_net_mensuel */
export function ratioRemboursement(revenuNet: number, dettes: Dettes): number {
  if (revenuNet <= 0) return 0
  return dettes.remboursementMensuel / revenuNet
}

/** ratio_dette_totale = dette_totale / revenu_net_mensuel */
export function ratioDetteTotale(revenuNet: number, dettes: Dettes): number {
  if (revenuNet <= 0) return 0
  return dettes.total / revenuNet
}

/** Part de la limite d'emprunt déjà consommée, bornée à [0, 1+]. */
export function usageLimiteEmprunt(revenuNet: number, dettes: Dettes): number {
  const limite = limiteEmprunt(revenuNet, dettes)
  if (limite <= 0) return dettes.total > 0 ? 1 : 0
  return dettes.total / limite
}

/** Sans intérêt : le nombre de mois est un simple quotient. */
export function moisPourSolderDette(dettes: Dettes): number | null {
  if (dettes.total <= 0) return 0
  if (dettes.remboursementMensuel <= 0) return null
  return Math.ceil(dettes.total / dettes.remboursementMensuel)
}

/** Vrai si la dette dépasse la limite choisie ou si le remboursement pèse trop. */
export function surendettement(revenuNet: number, dettes: Dettes): boolean {
  return (
    usageLimiteEmprunt(revenuNet, dettes) > 1 ||
    ratioRemboursement(revenuNet, dettes) > SEUIL_RATIO_REMBOURSEMENT
  )
}

/* ------------------------------------------------------------------ */
/* Patrimoine (structure inspirée de la zakat)                         */
/* ------------------------------------------------------------------ */

/** Capital réellement mobilisable ou productif, hors biens d'usage. */
export function capitalMobilisable(patrimoine: Patrimoine): number {
  return patrimoine.liquide + patrimoine.creances + patrimoine.investi + patrimoine.revente
}

export function patrimoineTotal(patrimoine: Patrimoine): number {
  return capitalMobilisable(patrimoine) + patrimoine.usage
}

/* ------------------------------------------------------------------ */
/* Projection de capital                                               */
/* ------------------------------------------------------------------ */

/**
 * Intérêts composés, capitalisation mensuelle (context §6.5).
 * taux_mensuel = taux_annuel / 12 ; versements en début de mois par défaut.
 * Résultats bruts : ni frais, ni fiscalité, ni inflation (FR-11).
 */
export function projeter(
  p: ParametresSimulation,
  granularite: 'mois' | 'an' = 'mois',
): PointProjection[] {
  const nbMois = Math.max(0, Math.round(p.dureeAnnees * 12))
  const i = p.tauxAnnuel / 100 / 12
  const facteurMoment = p.momentVersement === 'debut' ? 1 + i : 1
  const pas = granularite === 'an' ? 12 : 1

  const capitalAu = (m: number): number => {
    const verse = p.montantInitial + p.versementMensuel * m
    if (i === 0) return verse
    const croissance = Math.pow(1 + i, m)
    return (
      p.montantInitial * croissance +
      p.versementMensuel * ((croissance - 1) / i) * facteurMoment
    )
  }

  const points: PointProjection[] = []
  for (let m = 0; m <= nbMois; m += pas) {
    const verse = p.montantInitial + p.versementMensuel * m
    const capital = capitalAu(m)
    points.push({ mois: m, verse, capital, gain: capital - verse })
  }
  // toujours terminer sur l'échéance exacte
  if (points[points.length - 1]?.mois !== nbMois) {
    const verse = p.montantInitial + p.versementMensuel * nbMois
    const capital = capitalAu(nbMois)
    points.push({ mois: nbMois, verse, capital, gain: capital - verse })
  }
  return points
}

export function simuler(
  p: ParametresSimulation,
  granularite: 'mois' | 'an' = 'mois',
): ResultatSimulation {
  const points = projeter(p, granularite)
  const dernier = points[points.length - 1] ?? { capital: 0, verse: 0, gain: 0, mois: 0 }
  return {
    capitalFinal: dernier.capital,
    totalVerse: dernier.verse,
    gainBrut: dernier.gain,
    points,
  }
}

/** Part du gain brut dans le capital final, en %. */
export function partGain(resultat: ResultatSimulation): number {
  if (resultat.capitalFinal <= 0) return 0
  return (resultat.gainBrut / resultat.capitalFinal) * 100
}

/* ------------------------------------------------------------------ */
/* Score de marge de manœuvre                                          */
/* ------------------------------------------------------------------ */

const borne = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Un score 0-100 qui agrège les quatre tensions du tableau de bord :
 * pression de maintenance, avancement du fonds d'urgence, poids de la dette
 * et part réellement consacrée au futur.
 */
export function scoreMarge(profil: ProfilFinancier, revenu = profil.revenuNet): ScoreMarge {
  const pression = pressionMaintenance(revenu, profil.depenses)
  const progression = progressionUrgence(
    profil.soldeFondsUrgence,
    objectifFondsUrgence(profil.depenses),
  )
  const usageDette = usageLimiteEmprunt(revenu, profil.dettes)
  const futur = partFutur(profil.allocation) / 100

  const composantes = [
    {
      cle: 'maintenance',
      libelle: 'Pression de maintenance',
      // 35 % de pression = idéal, 70 % = saturé
      valeur: borne((0.7 - pression) / (0.7 - 0.35)),
      poids: 0.35,
    },
    { cle: 'urgence', libelle: 'Fonds d’urgence', valeur: progression, poids: 0.3 },
    { cle: 'dettes', libelle: 'Dette personnelle', valeur: borne(1 - usageDette), poids: 0.2 },
    { cle: 'futur', libelle: 'Part pour le futur', valeur: borne(futur / 0.3), poids: 0.15 },
  ]

  const valeur = Math.round(
    composantes.reduce((s, c) => s + c.valeur * c.poids, 0) * 100,
  )

  const libelle =
    valeur >= 75 ? 'Solide' : valeur >= 55 ? 'Correct' : valeur >= 35 ? 'À consolider' : 'Fragile'

  return { valeur, libelle, composantes }
}
