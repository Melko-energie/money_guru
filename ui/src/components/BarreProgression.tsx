import { motion } from 'framer-motion'
import { useAnimations } from '../state/animations'

/** Jauge à dégradé, avec balayage lumineux tant que l'objectif n'est pas atteint. */
export function BarreProgression({
  valeur,
  degrade = 'from-foret-soft via-foret to-foret-deep',
  hauteur = 'h-3.5',
  jalons = [],
}: {
  /** Entre 0 et 100. */
  valeur: number
  degrade?: string
  hauteur?: string
  /** Positions de repère en %, dessinées comme des encoches. */
  jalons?: Array<{ position: number; libelle: string; atteint: boolean }>
}) {
  const { animations } = useAnimations()
  const pct = Math.min(100, Math.max(0, valeur))

  return (
    <div className="relative">
      <div className={`relative w-full overflow-hidden rounded-pilule bg-encre/[0.07] ${hauteur}`}>
        <motion.div
          className={`relative h-full rounded-pilule bg-gradient-to-r ${degrade}`}
          initial={animations ? { width: 0 } : false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          {animations && pct > 4 && pct < 100 ? (
            <span
              className="absolute inset-y-0 w-1/3 animate-[balayage_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/45 to-transparent"
              aria-hidden
            />
          ) : null}
        </motion.div>

        {jalons.map((j) => (
          <span
            key={j.libelle}
            className={`absolute top-0 h-full w-px ${j.atteint ? 'bg-white/60' : 'bg-encre/15'}`}
            style={{ left: `${Math.min(100, Math.max(0, j.position))}%` }}
            aria-hidden
          />
        ))}
      </div>

      {jalons.length > 0 ? (
        <div className="relative mt-2 h-4">
          {jalons.map((j) => (
            <span
              key={j.libelle}
              className={`absolute -translate-x-1/2 whitespace-nowrap text-[10.5px] font-semibold ${
                j.atteint ? 'text-foret-deep' : 'text-meta'
              }`}
              style={{ left: `${Math.min(96, Math.max(4, j.position))}%` }}
            >
              {j.libelle}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
