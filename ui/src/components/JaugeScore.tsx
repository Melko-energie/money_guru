import { useId } from 'react'
import { motion } from 'framer-motion'
import { arcAnneau } from '../lib/graphiques'
import { useAnimations } from '../state/animations'
import type { ScoreMarge } from '../lib/types'

function teinte(valeur: number): [string, string] {
  if (valeur >= 75) return ['#A8B457', '#4E5A1C']
  if (valeur >= 55) return ['#6B7530', '#2F370E']
  if (valeur >= 35) return ['#C6CE93', '#767D2F']
  return ['#D0806E', '#8A3120']
}

/** Score de marge de manœuvre : demi-anneau + détail des quatre composantes. */
export function JaugeScore({ score, taille = 168 }: { score: ScoreMarge; taille?: number }) {
  const id = useId()
  const { animations } = useAnimations()
  const centre = taille / 2
  const epaisseur = 14
  const rayon = centre - epaisseur / 2 - 2
  const [clair, fonce] = teinte(score.valeur)

  // demi-cercle : de 0,75 (9 h) à 1,25 (3 h) en passant par midi
  const debut = 0.75
  const etendue = 0.5
  const fin = debut + etendue * (score.valeur / 100)

  return (
    <div
      className="relative"
      style={{ width: taille, height: taille * 0.62 }}
      role="img"
      aria-label={`Marge de manœuvre : ${score.valeur} sur 100, ${score.libelle}`}
    >
      <svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`} className="absolute -top-0">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={clair} />
            <stop offset="100%" stopColor={fonce} />
          </linearGradient>
        </defs>
        <path
          d={arcAnneau(centre, centre, rayon, debut, debut + etendue)}
          fill="none"
          stroke="rgba(39, 40, 42,0.08)"
          strokeWidth={epaisseur}
          strokeLinecap="round"
        />
        <motion.path
          d={arcAnneau(centre, centre, rayon, debut, Math.max(debut + 0.004, fin))}
          fill="none"
          stroke={`url(#${id}-g)`}
          strokeWidth={epaisseur}
          strokeLinecap="round"
          initial={animations ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      <div className="absolute inset-x-0 top-[26%] text-center">
        <p className="text-[32px] font-bold leading-none tabular-nums text-encre">{score.valeur}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-meta">
          {score.libelle}
        </p>
      </div>
    </div>
  )
}

/** Le détail chiffré du score, en barres fines. */
export function DetailScore({ score }: { score: ScoreMarge }) {
  return (
    <ul className="flex flex-col gap-2">
      {score.composantes.map((c) => (
        <li key={c.cle}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-meta">{c.libelle}</span>
            <span className="text-[11.5px] font-bold tabular-nums text-encre">
              {Math.round(c.valeur * 100)} / 100
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-pilule bg-encre/[0.07]">
            <motion.div
              className="h-full rounded-pilule bg-gradient-to-r from-foret-soft to-saphir"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(c.valeur * 100)}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
