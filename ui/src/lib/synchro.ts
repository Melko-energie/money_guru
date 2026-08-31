import type { ProfilFinancier } from './types'

/**
 * Ce que la synchronisation est en train de faire.
 * Un seul état à la fois : la carte de réglages lit celui-là et rien d'autre.
 */
export type EtatSynchro =
  /** aucune base configurée — l'application reste locale, comme avant */
  | 'inactive'
  | 'deconnecte'
  /** le lien magique est parti, on attend qu'il soit ouvert */
  | 'lien-envoye'
  | 'occupe'
  | 'a-jour'
  /** les deux copies ont bougé chacune de leur côté : à l'utilisateur de trancher */
  | 'conflit'
  | 'erreur'

/** Ce qu'il faut faire quand la copie locale et la copie distante se rencontrent. */
export type Arbitrage = 'envoyer' | 'recevoir' | 'rien' | 'conflit'

/** Une date comparable comme du texte : l'ISO se trie tout seul. */
export function horodatage(date: Date = new Date()): string {
  return date.toISOString()
}

/**
 * Un profil qu'on n'a jamais rempli n'a rien à défendre.
 * C'est le cas d'un appareil qu'on vient d'ouvrir : il prend la copie distante
 * sans rien demander.
 */
export function profilVierge(profil: ProfilFinancier): boolean {
  return !profil.onboarding.termine && profil.revenuNet === 0 && profil.journal.length === 0
}

/**
 * L'arbitre. Il ne touche à rien : il dit seulement quoi faire.
 *
 * Le principe retenu : le plus récent gagne — mais jamais en silence quand les
 * deux copies ont bougé depuis la dernière rencontre. Dans ce cas on s'arrête
 * et on demande, sinon un mois saisi sur le téléphone disparaîtrait sans que
 * personne ne le voie.
 *
 * @param derniereSynchro date de la dernière rencontre réussie, `null` si c'est la première
 */
export function arbitrer(
  local: ProfilFinancier,
  distant: ProfilFinancier | null,
  derniereSynchro: string | null,
): Arbitrage {
  if (!distant) return profilVierge(local) ? 'rien' : 'envoyer'
  if (profilVierge(local)) return 'recevoir'

  const dateLocale = local.majLe ?? ''
  const dateDistante = distant.majLe ?? ''
  if (dateLocale && dateLocale === dateDistante) return 'rien'

  // une copie remplie mais sans date est une inconnue : on ne l'écrase jamais
  // de notre propre chef
  if (!dateLocale || !dateDistante) return 'conflit'

  const repere = derniereSynchro ?? ''
  if (dateLocale > repere && dateDistante > repere) return 'conflit'
  return dateDistante > dateLocale ? 'recevoir' : 'envoyer'
}

/**
 * De quoi reconnaître une copie d'un coup d'œil, pour choisir en connaissance
 * de cause quand les deux appareils s'opposent.
 */
export type ApercuProfil = {
  majLe: string | null
  revenuNet: number
  lignesJournal: number
  moisRenseignes: number
  objectifs: number
}

export function apercu(profil: ProfilFinancier): ApercuProfil {
  return {
    majLe: profil.majLe ?? null,
    revenuNet: profil.revenuNet,
    lignesJournal: profil.journal.length,
    moisRenseignes: Object.keys(profil.mois ?? {}).length,
    objectifs: profil.objectifs.length,
  }
}

/** « 28 août 2026 à 14:05 » — une date qu'on lit sans effort. */
export function dateLisible(iso: string | null): string {
  if (!iso) return 'jamais'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'date inconnue'
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
