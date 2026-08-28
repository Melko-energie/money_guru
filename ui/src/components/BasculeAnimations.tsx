import { Zap, ZapOff } from 'lucide-react'
import { useAnimations } from '../state/animations'

/** Coupe toutes les animations d'un clic — et respecte déjà `prefers-reduced-motion`. */
export function BasculeAnimations({ compact = false }: { compact?: boolean }) {
  const { animations, basculer } = useAnimations()
  const Icone = animations ? Zap : ZapOff

  if (compact) {
    return (
      <button
        type="button"
        onClick={basculer}
        title={animations ? 'Couper les animations' : 'Réactiver les animations'}
        aria-pressed={animations}
        className={`grid h-11 w-11 place-items-center rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-papier-100 hover:text-encre active:translate-y-0 active:scale-95 ${
          animations ? 'text-encre/45' : 'text-encre/25'
        }`}
      >
        <Icone size={18} strokeWidth={animations ? 2 : 1.5} />
        <span className="sr-only">
          {animations ? 'Couper les animations' : 'Réactiver les animations'}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={animations}
      title={animations ? 'Couper les animations' : 'Réactiver les animations'}
      className="inline-flex items-center gap-2 rounded-pilule border border-encre/10 bg-white/70 px-3.5 py-2 text-xs font-semibold text-meta transition-all duration-300 hover:-translate-y-0.5 hover:border-encre/20 hover:text-encre active:translate-y-0 active:scale-95"
    >
      <Icone size={15} strokeWidth={animations ? 2 : 1.5} />
      {animations ? 'Animations activées' : 'Animations coupées'}
    </button>
  )
}
