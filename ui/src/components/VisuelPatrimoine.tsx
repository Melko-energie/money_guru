import { memo, useId } from 'react'
import { useAnimations } from '../state/animations'

/**
 * Illustration abstraite qui occupe la droite de la carte héros,
 * à la place du personnage de la maquette : arcs de progression + pile de pièces.
 * Aucun asset externe, tout est vectoriel et se teinte à la charte.
 */
export const VisuelPatrimoine = memo(function VisuelPatrimoine({
  taille = 300,
  ratio = 0.62,
}: {
  taille?: number
  /** Remplissage des arcs, entre 0 et 1. */
  ratio?: number
}) {
  const id = useId()
  const { animations } = useAnimations()
  const r = Math.min(1, Math.max(0, ratio))

  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 300 300"
      aria-hidden
      className="pointer-events-none select-none overflow-visible"
    >
      <defs>
        <linearGradient id={`${id}-arc1`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A8B457" />
          <stop offset="100%" stopColor="#4E5A1C" />
        </linearGradient>
        <linearGradient id={`${id}-arc2`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9DCBE3" />
          <stop offset="100%" stopColor="#3F7B9E" />
        </linearGradient>
        <linearGradient id={`${id}-piece`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E3E8C4" />
          <stop offset="100%" stopColor="#A8B457" />
        </linearGradient>
        <linearGradient id={`${id}-tranche`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8B457" />
          <stop offset="100%" stopColor="#767D2F" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0%" stopColor="#767D2F" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#767D2F" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="150" cy="150" r="140" fill={`url(#${id}-halo)`} />

      {/* anneau extérieur : la trajectoire longue */}
      <circle
        cx="150"
        cy="150"
        r="118"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="14"
      />
      <circle
        cx="150"
        cy="150"
        r="118"
        fill="none"
        stroke={`url(#${id}-arc2)`}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * 118 * r * 0.78} ${2 * Math.PI * 118}`}
        transform="rotate(-90 150 150)"
      />

      {/* anneau intérieur : l'effort du mois */}
      <circle
        cx="150"
        cy="150"
        r="92"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="10"
      />
      <circle
        cx="150"
        cy="150"
        r="92"
        fill="none"
        stroke={`url(#${id}-arc1)`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * 92 * r} ${2 * Math.PI * 92}`}
        transform="rotate(-90 150 150)"
      />

      {/* pile de pièces au centre */}
      <g className={animations ? 'animate-[flotter_7s_ease-in-out_infinite]' : ''}>
        {[0, 1, 2, 3].map((i) => {
          const y = 196 - i * 22
          return (
            <g key={i}>
              <ellipse cx="150" cy={y + 9} rx="52" ry="15" fill={`url(#${id}-tranche)`} />
              <rect x="98" y={y - 2} width="104" height="11" fill={`url(#${id}-tranche)`} />
              <ellipse cx="150" cy={y - 2} rx="52" ry="15" fill={`url(#${id}-piece)`} />
              <ellipse
                cx="150"
                cy={y - 2}
                rx="38"
                ry="10"
                fill="none"
                stroke="rgba(150,88,15,0.35)"
                strokeWidth="1.5"
              />
            </g>
          )
        })}
      </g>

      {/* éclats discrets */}
      <g className={animations ? 'animate-[pulser_5s_ease-in-out_infinite]' : ''}>
        <circle cx="243" cy="78" r="6" fill="#767D2F" opacity="0.55" />
        <circle cx="64" cy="104" r="4" fill="#3D470F" opacity="0.5" />
        <circle cx="82" cy="228" r="5" fill="#A8B457" opacity="0.45" />
      </g>
    </svg>
  )
})
