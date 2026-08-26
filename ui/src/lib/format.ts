import type { CodeDevise } from './types'

/** Devises supportées par le formatage (NFR-02). MAD par défaut. */
export const DEVISES: Array<{ code: CodeDevise; libelle: string }> = [
  { code: 'MAD', libelle: 'Dirham marocain' },
  { code: 'EUR', libelle: 'Euro' },
  { code: 'USD', libelle: 'Dollar américain' },
  { code: 'GBP', libelle: 'Livre sterling' },
  { code: 'AED', libelle: 'Dirham des Émirats' },
  { code: 'CAD', libelle: 'Dollar canadien' },
  { code: 'CHF', libelle: 'Franc suisse' },
]

const cacheDevise = new Map<string, Intl.NumberFormat>()

function formateurDevise(devise: CodeDevise, decimales: number): Intl.NumberFormat {
  const cle = `${devise}:${decimales}`
  let f = cacheDevise.get(cle)
  if (!f) {
    f = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: devise,
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    })
    cacheDevise.set(cle, f)
  }
  return f
}

const nombre = (decimales: number) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })

/**
 * Format monétaire localisé (NFR-03) : « 10 000,00 MAD ».
 * Les tuiles denses du tableau de bord passent `decimales: 0`.
 */
export function formaterDevise(valeur: number, devise: CodeDevise, decimales = 2): string {
  return formateurDevise(devise, decimales).format(Number.isFinite(valeur) ? valeur : 0)
}

export function formaterNombre(valeur: number, decimales = 0): string {
  return nombre(decimales).format(Number.isFinite(valeur) ? valeur : 0)
}

/** « 12,3 k MAD » / « 1,4 M MAD » — pour les axes et les tuiles serrées. */
export function formaterCompact(valeur: number, devise?: CodeDevise): string {
  const v = Number.isFinite(valeur) ? valeur : 0
  const suffixe = devise ? ` ${devise}` : ''
  if (Math.abs(v) >= 1_000_000_000) return `${nombre(1).format(v / 1_000_000_000)} Md${suffixe}`
  if (Math.abs(v) >= 1_000_000) return `${nombre(1).format(v / 1_000_000)} M${suffixe}`
  if (Math.abs(v) >= 1_000) return `${nombre(1).format(v / 1_000)} k${suffixe}`
  return `${nombre(0).format(v)}${suffixe}`
}

export function formaterPourcent(valeur: number, decimales = 0): string {
  return `${nombre(decimales).format(Number.isFinite(valeur) ? valeur : 0)} %`
}

/** Prend un ratio 0-1 et l'affiche en pourcentage. */
export function formaterRatio(ratio: number, decimales = 0): string {
  return formaterPourcent((Number.isFinite(ratio) ? ratio : 0) * 100, decimales)
}

/** « 3 ans et 4 mois », « 8 mois », « 1 an ». */
export function formaterDuree(mois: number): string {
  const total = Math.max(0, Math.round(mois))
  const annees = Math.floor(total / 12)
  const reste = total % 12
  const bouts: string[] = []
  if (annees > 0) bouts.push(annees === 1 ? '1 an' : `${annees} ans`)
  if (reste > 0) bouts.push(reste === 1 ? '1 mois' : `${reste} mois`)
  return bouts.length ? bouts.join(' et ') : 'moins d’un mois'
}

export function salutation(date = new Date()): string {
  const h = date.getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bel après-midi'
  return 'Bonsoir'
}

export function moisEnCours(date = new Date()): string {
  const libelle = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
  return libelle.charAt(0).toUpperCase() + libelle.slice(1)
}
