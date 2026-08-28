import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Une ligne de titre, le texte au clic. C'est ce qui retire le gros du texte
 * de l'écran sans rien supprimer : tout reste lisible, à la demande.
 */
export function Depliable({
  titre,
  aide,
  icone,
  ouvertParDefaut = false,
  classeTitre = 'text-encre',
  classeAide = 'text-meta',
  children,
}: {
  titre: string
  /** Ligne courte toujours visible, sous le titre. */
  aide?: string
  icone?: ReactNode
  ouvertParDefaut?: boolean
  classeTitre?: string
  classeAide?: string
  children: ReactNode
}) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut)

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="flex w-full items-start gap-2.5 text-left"
      >
        {icone ? <span className="mt-0.5 shrink-0">{icone}</span> : null}
        <span className="min-w-0 flex-1">
          <span className={`block text-[13px] font-bold leading-snug ${classeTitre}`}>{titre}</span>
          {aide ? (
            <span className={`mt-0.5 block text-[11.5px] leading-snug ${classeAide}`}>{aide}</span>
          ) : null}
        </span>
        <ChevronDown
          size={16}
          className={`mt-0.5 shrink-0 transition-transform duration-300 ${classeAide} ${
            ouvert ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {ouvert ? <div className="mt-2">{children}</div> : null}
    </div>
  )
}
