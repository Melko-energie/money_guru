import { useId } from 'react'
import { motion } from 'framer-motion'
import { arcAnneau } from '../lib/graphiques'
import { useAnimations } from '../state/animations'

export type SegmentAnneau = {
  cle: string
  valeur: number
  degrade: [string, string]
  libelle: string
}

/**
 * Anneau à segments, façon « Your Statistic » de la maquette :
 * couches concentriques translucides + segments épais à extrémités arrondies.
 */
export function Anneau({
  segments,
  taille = 220,
  epaisseur = 18,
  enfant,
  segmentActif,
}: {
  segments: SegmentAnneau[]
  taille?: number
  epaisseur?: number
  enfant?: React.ReactNode
  segmentActif?: string | null
}) {
  const id = useId()
  const { animations } = useAnimations()
  const centre = taille / 2
  const rayon = centre - epaisseur / 2 - 4
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.valeur), 0) || 1

  let curseur = 0
  const arcs = segments.map((seg) => {
    const part = Math.max(0, seg.valeur) / total
    const debut = curseur
    curseur += part
    return { ...seg, debut, fin: curseur, part }
  })

  return (
    <div className="relative grid place-items-center" style={{ width: taille, height: taille }}>
      {/* halos d'ambiance derrière l'anneau */}
      <div
        className={`pointer-events-none absolute inset-3 rounded-full bg-gradient-to-br from-foret/15 via-transparent to-saphir/20 blur-2xl ${
          animations ? 'animate-[lueur_6s_ease-in-out_infinite]' : ''
        }`}
        aria-hidden
      />

      <svg
        width={taille}
        height={taille}
        viewBox={`0 0 ${taille} ${taille}`}
        className="relative"
        role="img"
        aria-label={arcs
          .map((a) => `${a.libelle} ${Math.round(a.part * 100)} %`)
          .join(', ')}
      >
        <defs>
          {arcs.map((a) => (
            <linearGradient key={a.cle} id={`${id}-${a.cle}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={a.degrade[0]} />
              <stop offset="100%" stopColor={a.degrade[1]} />
            </linearGradient>
          ))}
        </defs>

        <circle
          cx={centre}
          cy={centre}
          r={rayon}
          fill="none"
          stroke="rgba(14,26,36,0.06)"
          strokeWidth={epaisseur}
        />
        <circle
          cx={centre}
          cy={centre}
          r={rayon - epaisseur - 5}
          fill="none"
          stroke="rgba(14,26,36,0.04)"
          strokeWidth={2}
        />

        {arcs.map((a, i) => {
          const estActif = !segmentActif || segmentActif === a.cle
          return (
            <motion.path
              key={a.cle}
              d={arcAnneau(centre, centre, rayon, a.debut + 0.006, a.fin - 0.006)}
              fill="none"
              stroke={`url(#${id}-${a.cle})`}
              strokeWidth={epaisseur}
              strokeLinecap="round"
              initial={animations ? { pathLength: 0, opacity: 0 } : false}
              animate={{ pathLength: 1, opacity: estActif ? 1 : 0.22 }}
              transition={{
                pathLength: { duration: 0.9, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.28 },
              }}
            />
          )
        })}
      </svg>

      {enfant ? (
        <div className="absolute inset-0 grid place-items-center px-6 text-center">{enfant}</div>
      ) : null}
    </div>
  )
}
