/**
 * Un KPI lisible sans connaître l'application : son nom, sa valeur, et une
 * ligne qui dit ce qu'elle signifie. Jamais un chiffre seul.
 */
export function Chiffre({
  libelle,
  valeur,
  sens,
  accent = 'text-encre',
  taille = 'normal',
}: {
  libelle: string
  valeur: string
  /** Ce que l'utilisateur doit comprendre en le regardant. */
  sens: string
  accent?: string
  taille?: 'normal' | 'grand'
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">{libelle}</p>
      <p
        className={`mt-0.5 font-bold tabular-nums leading-tight ${accent} ${
          taille === 'grand' ? 'text-[24px]' : 'text-[19px]'
        }`}
      >
        {valeur}
      </p>
      <p className="mt-0.5 text-[11.5px] leading-snug text-meta">{sens}</p>
    </div>
  )
}
