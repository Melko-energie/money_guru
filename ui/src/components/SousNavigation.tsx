import { sectionDe } from '../lib/sections'
import type { Vue } from '../lib/types'

/**
 * Les vues d'une même section, en pilules.
 * N'apparaît que là où la section en porte plusieurs — ailleurs, elle
 * n'aurait rien à montrer.
 */
export function SousNavigation({
  vue,
  onNaviguer,
}: {
  vue: Vue
  onNaviguer: (v: Vue) => void
}) {
  const section = sectionDe(vue)
  if (section.vues.length < 2) return null

  return (
    <nav
      aria-label={`Vues de ${section.libelle}`}
      className="defilement-doux -mt-2 flex items-center gap-1.5 overflow-x-auto px-1"
    >
      {section.vues.map(({ vue: cible, libelle, icone: Icone }) => {
        const actif = vue === cible
        return (
          <button
            key={cible}
            type="button"
            onClick={() => onNaviguer(cible)}
            aria-current={actif ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-pilule px-3.5 py-2 text-[12.5px] font-semibold transition-all duration-300 ${
              actif
                ? 'bg-white text-encre shadow-pilule ring-1 ring-encre/[0.06]'
                : 'text-meta hover:text-encre'
            }`}
          >
            <Icone size={14} strokeWidth={2} />
            {libelle}
          </button>
        )
      })}
    </nav>
  )
}
