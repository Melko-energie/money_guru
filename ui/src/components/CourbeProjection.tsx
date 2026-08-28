import { useId, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { cheminAire, cheminCourbe, echelle } from '../lib/graphiques'
import { formaterCompact, formaterDevise, formaterDuree } from '../lib/format'
import { useAnimations } from '../state/animations'
import type { CodeDevise, PointProjection } from '../lib/types'

const LARGEUR = 620
const HAUTEUR = 190
const MARGE = 12

/**
 * Courbe d'évolution du capital, avec le total versé en pointillés dessous :
 * l'écart entre les deux traits, c'est le gain brut.
 */
export function CourbeProjection({
  points,
  devise,
}: {
  points: PointProjection[]
  devise: CodeDevise
}) {
  const id = useId()
  const { animations } = useAnimations()
  const [survol, setSurvol] = useState<number | null>(null)

  const { cheminCapital, aireCapital, cheminVerse, positions } = useMemo(() => {
    const valeurs = points.map((p) => p.capital)
    const max = Math.max(1, ...valeurs)
    const pos = echelle(valeurs, LARGEUR, HAUTEUR, MARGE)
    const posVerse = points.map((p, i) => ({
      x: pos[i]?.x ?? 0,
      y: MARGE + (HAUTEUR - MARGE * 2) - (p.verse / max) * (HAUTEUR - MARGE * 2),
    }))
    return {
      cheminCapital: cheminCourbe(pos),
      aireCapital: cheminAire(pos, HAUTEUR),
      cheminVerse: cheminCourbe(posVerse),
      positions: pos,
    }
  }, [points])

  if (points.length === 0) return null

  const indexActif = survol ?? points.length - 1
  const pointActif = points[indexActif]
  const positionActive = positions[indexActif]

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        className="h-[190px] w-full overflow-visible"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Projection du capital sur ${formaterDuree(points[points.length - 1].mois)}`}
        onMouseLeave={() => setSurvol(null)}
        onMouseMove={(e) => {
          const boite = e.currentTarget.getBoundingClientRect()
          if (boite.width === 0) return
          const ratio = (e.clientX - boite.left) / boite.width
          setSurvol(
            Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1)))),
          )
        }}
      >
        <defs>
          <linearGradient id={`${id}-aire`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3D470F" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#3D470F" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-trait`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#767D2F" />
            <stop offset="100%" stopColor="#3D470F" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={0}
            x2={LARGEUR}
            y1={MARGE + (HAUTEUR - MARGE * 2) * r}
            y2={MARGE + (HAUTEUR - MARGE * 2) * r}
            stroke="rgba(39, 40, 42,0.06)"
            strokeWidth={1}
            strokeDasharray="3 7"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <motion.path
          d={aireCapital}
          fill={`url(#${id}-aire)`}
          initial={animations ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        />
        <path
          d={cheminVerse}
          fill="none"
          stroke="rgba(39, 40, 42,0.28)"
          strokeWidth={1.5}
          strokeDasharray="4 6"
          vectorEffect="non-scaling-stroke"
        />
        <motion.path
          d={cheminCapital}
          fill="none"
          stroke={`url(#${id}-trait)`}
          strokeWidth={3}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={animations ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />

        {positionActive ? (
          <g>
            <line
              x1={positionActive.x}
              x2={positionActive.x}
              y1={0}
              y2={HAUTEUR}
              stroke="rgba(39, 40, 42,0.16)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={positionActive.x}
              cy={positionActive.y}
              r={5}
              fill="#ffffff"
              stroke="#3D470F"
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ) : null}
      </svg>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4 text-[11px] font-medium text-meta">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[3px] w-5 rounded-full bg-gradient-to-r from-foret to-saphir" />
            Capital
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-[3px] w-5 rounded-full border-t-2 border-dashed border-encre/30" />
            Total versé
          </span>
        </div>
        {pointActif ? (
          <div className="text-right">
            <p className="text-[11px] font-medium text-meta">
              {pointActif.mois === 0 ? 'Aujourd’hui' : formaterDuree(pointActif.mois)}
            </p>
            <p className="text-[15px] font-bold tabular-nums text-encre">
              {formaterDevise(pointActif.capital, devise, 0)}
              <span className="ml-2 text-[12px] font-semibold text-foret-deep">
                +{formaterCompact(pointActif.gain)} de gain brut
              </span>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
