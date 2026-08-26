import { ArrowRight } from 'lucide-react'

/** Titre de section + action à droite, comme les « See More » de la maquette. */
export function EnteteSection({
  titre,
  action,
  onAction,
  fleche = false,
}: {
  titre: string
  action?: string
  onAction?: () => void
  fleche?: boolean
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="text-[19px] font-bold leading-none text-encre">{titre}</h2>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="group inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-meta transition-colors duration-300 hover:text-encre"
        >
          {fleche ? null : action}
          <ArrowRight
            size={fleche ? 17 : 13}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
          {fleche ? <span className="sr-only">{action}</span> : null}
        </button>
      ) : null}
    </div>
  )
}
