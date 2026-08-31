import { normaliserAllocation } from './calculs'
import { PROFIL_VIDE } from './profilVide'
import type { ProfilFinancier } from './types'

/**
 * Remet un profil d'aplomb, d'où qu'il vienne.
 *
 * Le stockage du navigateur et un fichier restauré posent le même problème :
 * la forme a pu changer depuis l'enregistrement, un champ peut manquer, un
 * tableau peut être arrivé en objet. Tout passe donc par ici, et rien n'entre
 * dans l'application sans avoir été complété par les valeurs vides.
 */
export function normaliserProfil(enregistre: Partial<ProfilFinancier>): ProfilFinancier {
  return {
    ...PROFIL_VIDE,
    ...enregistre,
    allocation: normaliserAllocation({
      ...PROFIL_VIDE.allocation,
      ...(enregistre.allocation ?? {}),
    }),
    dettes: { ...PROFIL_VIDE.dettes, ...(enregistre.dettes ?? {}) },
    patrimoine: { ...PROFIL_VIDE.patrimoine, ...(enregistre.patrimoine ?? {}) },
    depenses:
      Array.isArray(enregistre.depenses) && enregistre.depenses.length
        ? enregistre.depenses
        : PROFIL_VIDE.depenses,
    onboarding: { ...PROFIL_VIDE.onboarding, ...(enregistre.onboarding ?? {}) },
    journal: Array.isArray(enregistre.journal) ? enregistre.journal : PROFIL_VIDE.journal,
    mois: enregistre.mois && typeof enregistre.mois === 'object' ? enregistre.mois : {},
    objectifs: Array.isArray(enregistre.objectifs) ? enregistre.objectifs : [],
    versementSalaire: {
      ...PROFIL_VIDE.versementSalaire,
      ...(enregistre.versementSalaire ?? {}),
    },
  }
}

/**
 * Reconnaît un fichier de sauvegarde avant de l'ouvrir.
 * Restaurer remplace tout : mieux vaut refuser un fichier étranger que
 * d'écraser une année de saisie avec le contenu d'un autre logiciel.
 */
export function lireSauvegarde(texte: string): ProfilFinancier {
  let brut: unknown
  try {
    brut = JSON.parse(texte)
  } catch {
    throw new Error('Ce fichier n’est pas lisible : ce n’est pas du JSON.')
  }
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) {
    throw new Error('Ce fichier ne contient pas un profil Money Guru.')
  }
  const candidat = brut as Partial<ProfilFinancier>
  const reconnu =
    typeof candidat.revenuNet === 'number' &&
    Array.isArray(candidat.depenses) &&
    typeof candidat.allocation === 'object'
  if (!reconnu) {
    throw new Error('Ce fichier ne contient pas un profil Money Guru.')
  }
  return normaliserProfil(candidat)
}

/** « money-guru-2026-08-31.json » — un nom qui se classe tout seul. */
export function nomSauvegarde(date: Date = new Date()): string {
  const deuxChiffres = (n: number) => String(n).padStart(2, '0')
  return `money-guru-${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(
    date.getDate(),
  )}.json`
}
