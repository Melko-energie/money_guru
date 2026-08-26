import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, Landmark, Scale, Shield, ShieldAlert, Target } from 'lucide-react'
import { useFinances } from '../state/finances'
import { formaterDevise } from '../lib/format'
import { METHODES } from '../lib/methodes'
import type { MethodeAllocation } from '../lib/types'

const ICONES_PALIER = [Shield, Target, Landmark]

/** Pastille du rail : l'étiquette apparaît ENTIÈREMENT à gauche, jamais par-dessus. */
function PastilleRail({
  children,
  etiquette,
  detail,
  actif,
  accent,
  onClick,
  coche,
}: {
  children: ReactNode
  etiquette: string
  detail: string
  actif?: boolean
  accent: string
  onClick?: () => void
  coche?: boolean
}) {
  return (
    <div className="group relative">
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.94 }}
        title={etiquette}
        className={`relative grid h-11 w-11 place-items-center rounded-full border transition-colors duration-300 ${
          actif
            ? 'border-transparent text-white shadow-[0_10px_22px_-10px_rgba(14,26,36,0.6)]'
            : 'border-white/70 bg-white/70 text-encre/50 hover:bg-white hover:text-encre'
        }`}
        style={actif ? { background: accent } : undefined}
      >
        {children}
        {coche ? (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-papier bg-foret text-white">
            <Check size={9} strokeWidth={3.5} />
          </span>
        ) : null}
        <span className="sr-only">{etiquette}</span>
      </motion.button>

      <div className="pointer-events-none absolute right-full top-1/2 z-30 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-2xl bg-encre px-3.5 py-2 text-left text-white opacity-0 shadow-bulle transition-opacity duration-200 group-hover:opacity-100 lg:block">
        <span className="block text-[12.5px] font-semibold leading-tight">{etiquette}</span>
        <span className="block text-[11px] leading-tight text-white/60">{detail}</span>
      </div>
    </div>
  )
}

/** Colonne de droite : paliers du fonds d'urgence, alerte dette, méthodes. */
export function RailJalons({
  onMethode,
}: {
  onMethode: (m: MethodeAllocation) => void
}) {
  const { paliers, profil, detteExcessive, definirMethode } = useFinances()

  return (
    <div
      className="flex h-full w-[68px] flex-col items-center gap-4"
      aria-label="Jalons et méthodes"
    >
      <div className="grid h-11 w-11 place-items-center rounded-full bg-encre text-[13px] font-bold text-white">
        {(profil.prenom || 'MG').slice(0, 2).toUpperCase()}
      </div>

      <span className="h-px w-7 bg-encre/10" aria-hidden />

      <div className="flex flex-col items-center gap-3">
        {paliers.map((palier, i) => {
          const Icone = ICONES_PALIER[i] ?? Shield
          return (
            <PastilleRail
              key={palier.mois}
              etiquette={`${palier.libelle} · ${palier.mois} mois`}
              detail={`${palier.description} — ${formaterDevise(palier.montant, profil.devise, 0)}`}
              actif={palier.atteint}
              coche={palier.atteint}
              accent="linear-gradient(135deg,#6FA86D,#2A5C29)"
            >
              <Icone size={18} strokeWidth={1.9} />
            </PastilleRail>
          )
        })}

        <PastilleRail
          etiquette={detteExcessive ? 'Dette au-delà du seuil' : 'Dette sous contrôle'}
          detail={
            detteExcessive
              ? 'Limite d’emprunt ou remboursement dépassé'
              : `${formaterDevise(profil.dettes.total, profil.devise, 0)} dus`
          }
          actif={detteExcessive}
          accent="linear-gradient(135deg,#D0806E,#8A3120)"
        >
          <ShieldAlert size={18} strokeWidth={1.9} />
        </PastilleRail>
      </div>

      <span className="h-px w-7 bg-encre/10" aria-hidden />

      <div className="flex flex-col items-center gap-3">
        {METHODES.filter((m) => m.ratios).map((m) => (
          <PastilleRail
            key={m.cle}
            etiquette={m.titre}
            detail={m.regle}
            actif={profil.methode === m.cle}
            accent="linear-gradient(135deg,#4E83AB,#0E3D5C)"
            onClick={() => {
              definirMethode(m.cle)
              onMethode(m.cle)
            }}
          >
            <Scale size={18} strokeWidth={1.9} />
          </PastilleRail>
        ))}
      </div>

      <span className="mt-auto select-none font-display text-[12px] italic leading-none text-meta [writing-mode:vertical-rl]">
        Vos jalons
      </span>
    </div>
  )
}
