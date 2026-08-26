import { motion } from 'framer-motion'
import {
  CalendarDays,
  FlaskConical,
  HandCoins,
  LayoutGrid,
  LifeBuoy,
  PiggyBank,
  Scale,
  Settings2,
  Wallet,
} from 'lucide-react'
import { BasculeAnimations } from './BasculeAnimations'
import { useAnimations } from '../state/animations'
import type { Vue } from '../lib/types'

const NAVIGATION: Array<{ vue: Vue; icone: typeof LayoutGrid; libelle: string }> = [
  { vue: 'tableau', icone: LayoutGrid, libelle: 'Tableau de bord' },
  { vue: 'methodes', icone: Scale, libelle: 'Comparer les méthodes' },
  { vue: 'calendrier', icone: CalendarDays, libelle: 'Calendrier des dépenses' },
  { vue: 'simulateur', icone: FlaskConical, libelle: 'Simulateur « et si… »' },
  { vue: 'patrimoine', icone: Wallet, libelle: 'Mon patrimoine' },
  { vue: 'reglages', icone: Settings2, libelle: 'Mes chiffres' },
]

const REPERES: Array<{ icone: typeof LayoutGrid; libelle: string; vue: Vue }> = [
  { icone: LifeBuoy, libelle: 'Fonds d’urgence', vue: 'tableau' },
  { icone: HandCoins, libelle: 'Dettes personnelles', vue: 'reglages' },
]

export function RailLateral({ vue, onNaviguer }: { vue: Vue; onNaviguer: (v: Vue) => void }) {
  const { animations } = useAnimations()

  return (
    <nav
      className="flex h-full w-[68px] flex-col items-center gap-3"
      aria-label="Navigation principale"
    >
      <motion.button
        type="button"
        onClick={() => onNaviguer('tableau')}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.94 }}
        className="grid h-12 w-12 place-items-center rounded-2xl bg-encre text-white shadow-[0_14px_30px_-12px_rgba(14,26,36,0.8)]"
        title="Money Guru — tableau de bord"
      >
        <PiggyBank size={22} strokeWidth={1.9} />
        <span className="sr-only">Money Guru, retour au tableau de bord</span>
      </motion.button>

      <div className="mt-2 flex flex-col items-center gap-2.5">
        {NAVIGATION.map(({ vue: cible, icone: Icone, libelle }) => (
          <button
            key={cible}
            type="button"
            onClick={() => onNaviguer(cible)}
            title={libelle}
            aria-current={vue === cible ? 'page' : undefined}
            className={`pastille-rail ${vue === cible ? 'pastille-rail-active' : ''}`}
          >
            <Icone size={19} strokeWidth={1.9} />
            <span className="sr-only">{libelle}</span>
          </button>
        ))}
      </div>

      <span className="my-1 h-px w-7 bg-encre/10" aria-hidden />

      <div className="flex flex-col items-center gap-2.5">
        {REPERES.map(({ icone: Icone, libelle, vue: cible }) => (
          <button
            key={libelle}
            type="button"
            onClick={() => onNaviguer(cible)}
            title={libelle}
            className="pastille-rail"
          >
            <Icone size={19} strokeWidth={1.9} />
            <span className="sr-only">{libelle}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-3 pb-1">
        <BasculeAnimations compact />
        <span
          className={`h-2 w-2 rounded-full bg-foret ${
            animations ? 'animate-[pulser_3.4s_ease-in-out_infinite]' : ''
          }`}
          aria-hidden
        />
        <span className="select-none font-display text-[13px] italic leading-none text-meta [writing-mode:vertical-rl]">
          Money Guru
        </span>
      </div>
    </nav>
  )
}
