import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * L'en-tête de carte du layout de référence : pastille d'icône, titre,
 * sous-titre, contrôles, puis le bouton d'ouverture ↗ tout à droite.
 * Toutes les cartes de l'application passent par ici — c'est ce qui garantit
 * le même rythme d'une vue à l'autre.
 */
export function EnteteSection({
  icone: Icone,
  titre,
  sousTitre,
  controles,
  action,
  onAction,
  sombre = false,
}: {
  icone?: LucideIcon
  titre: string
  sousTitre?: string
  /** Segments, sélecteurs ou pilules posés à gauche du ↗. */
  controles?: ReactNode
  /** Libellé de l'action d'ouverture ; sans lui, pas de bouton ↗. */
  action?: string
  onAction?: () => void
  sombre?: boolean
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icone ? (
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
              sombre ? 'bg-white/10 text-white' : 'bg-papier-100 text-encre/70'
            }`}
          >
            <Icone size={18} strokeWidth={1.9} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2
            className={`truncate text-[15.5px] font-bold leading-tight ${
              sombre ? 'text-white' : 'text-encre'
            }`}
          >
            {titre}
          </h2>
          {sousTitre ? (
            <p className={`truncate text-[12px] leading-tight ${sombre ? 'text-white/50' : 'text-meta'}`}>
              {sousTitre}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {controles}
        {action ? (
          <button
            type="button"
            onClick={onAction}
            title={action}
            className={`group grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
              sombre
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-papier-100 text-encre/60 hover:bg-papier-200 hover:text-encre'
            }`}
          >
            <ArrowUpRight
              size={17}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
            <span className="sr-only">{action}</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
