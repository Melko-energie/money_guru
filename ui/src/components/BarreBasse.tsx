import { CalendarDays, Home, LayoutGrid } from 'lucide-react'
import type { Vue } from '../lib/types'

/**
 * Navigation basse du mobile, reprise des références T3/T4/T5 : trois
 * pastilles rondes dans une capsule flottante, l'active en blanc plein et
 * surélevée. Le bouton Menu ouvre la feuille qui donne accès aux autres vues,
 * pour qu'aucune page ne devienne inatteignable au téléphone.
 */
export function BarreBasse({
  vue,
  menuOuvert,
  onNaviguer,
  onMenu,
}: {
  vue: Vue
  menuOuvert: boolean
  onNaviguer: (v: Vue) => void
  onMenu: () => void
}) {
  const entrees = [
    {
      cle: 'calendrier',
      icone: CalendarDays,
      libelle: 'Calendrier des dépenses',
      actif: !menuOuvert && vue === 'calendrier',
      action: () => onNaviguer('calendrier'),
    },
    {
      cle: 'tableau',
      icone: Home,
      libelle: 'Tableau de bord',
      actif: !menuOuvert && vue === 'tableau',
      action: () => onNaviguer('tableau'),
    },
    {
      cle: 'menu',
      icone: LayoutGrid,
      libelle: 'Toutes les vues',
      actif: menuOuvert,
      action: onMenu,
    },
  ]

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:hidden"
    >
      <div className="flex items-center gap-1 rounded-pilule border border-white/60 bg-white/70 p-1.5 shadow-[0_18px_40px_-16px_rgba(39,40,42,0.45)] backdrop-blur-xl">
        {entrees.map(({ cle, icone: Icone, libelle, actif, action }) => (
          <button
            key={cle}
            type="button"
            onClick={action}
            aria-current={actif ? 'page' : undefined}
            className={`grid place-items-center rounded-full transition-all duration-300 active:scale-95 ${
              actif
                ? 'h-14 w-14 -translate-y-1.5 bg-white text-encre shadow-[0_12px_26px_-10px_rgba(39,40,42,0.5)]'
                : 'h-12 w-12 bg-papier-100/70 text-encre/45'
            }`}
          >
            <Icone size={actif ? 22 : 20} strokeWidth={1.9} />
            <span className="sr-only">{libelle}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
