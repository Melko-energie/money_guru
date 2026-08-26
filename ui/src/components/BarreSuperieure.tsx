import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Search, Settings2, X } from 'lucide-react'
import { useFinances } from '../state/finances'
import { useAnimations } from '../state/animations'
import { formaterDevise, moisEnCours, salutation } from '../lib/format'
import { ficheMethode } from '../lib/methodes'
import type { Vue } from '../lib/types'

const EXEMPLES = [
  'Combien coûte ma maintenance personnelle ?',
  'Combien puis-je me permettre en fun money ?',
  'Où en est mon fonds d’urgence ?',
  'Ma dette dépasse-t-elle ma limite ?',
  'Que vaut ma stratégie sur 42 ans ?',
]

export function BarreSuperieure({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { profil, montants, listeAlertes } = useFinances()
  const { animations } = useAnimations()
  const [index, setIndex] = useState(0)
  const [recherche, setRecherche] = useState('')
  const champ = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!animations) return
    const t = setInterval(() => setIndex((i) => (i + 1) % EXEMPLES.length), 4200)
    return () => clearInterval(t)
  }, [animations])

  const bonjour = useMemo(() => salutation(), [])
  const grave = listeAlertes.some((a) => a.niveau === 'danger')
  const attention = listeAlertes.some((a) => a.niveau === 'attention')

  return (
    <header className="flex flex-wrap items-center gap-4 px-6 pb-2 pt-6 sm:px-9 lg:px-11">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-meta">
          {moisEnCours()} · {ficheMethode(profil.methode).titre} · {profil.devise}
        </p>
        <h1 className="mt-0.5 truncate text-[26px] leading-tight sm:text-[30px]">
          <span className="font-display italic text-meta">{bonjour}, </span>
          <span className="font-bold text-encre">{profil.prenom || 'vous'}</span>
        </h1>
      </div>

      <label className="group relative hidden min-w-[240px] flex-1 items-center lg:flex lg:max-w-[380px]">
        <span className="sr-only">Rechercher dans votre tableau de bord</span>
        <Search
          size={17}
          className="pointer-events-none absolute left-4 text-meta transition-colors duration-300 group-focus-within:text-encre"
        />
        <input
          ref={champ}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={EXEMPLES[index]}
          className="h-11 w-full rounded-pilule border border-encre/[0.09] bg-papier/80 pl-11 pr-10 text-[14px] text-encre outline-none transition-all duration-300 placeholder:text-meta focus:border-saphir/40 focus:bg-white focus:shadow-[0_16px_36px_-24px_rgba(27,95,140,0.7)]"
        />
        {recherche ? (
          <button
            type="button"
            onClick={() => {
              setRecherche('')
              champ.current?.focus()
            }}
            className="absolute right-3 grid h-6 w-6 place-items-center rounded-full text-meta transition-colors hover:bg-encre/5 hover:text-encre"
          >
            <X size={14} />
            <span className="sr-only">Effacer la recherche</span>
          </button>
        ) : null}
      </label>

      <div className="flex items-center gap-2.5">
        <div className="hidden items-baseline gap-2 rounded-pilule border border-encre/[0.08] bg-papier/80 px-4 py-2 sm:flex">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-meta">
            Fun money
          </span>
          <span className="text-[15px] font-bold tabular-nums text-encre">
            {formaterDevise(montants.fun, profil.devise, 0)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNaviguer('reglages')}
          title="Mes chiffres"
          className="grid h-11 w-11 place-items-center rounded-full border border-encre/[0.08] bg-papier/80 text-encre/60 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-encre hover:shadow-md active:translate-y-0 active:scale-95"
        >
          <Settings2 size={18} strokeWidth={1.9} />
          <span className="sr-only">Mes chiffres</span>
        </button>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onNaviguer('tableau')}
          title={
            listeAlertes.length
              ? `${listeAlertes.length} point(s) d’attention`
              : 'Aucune alerte en cours'
          }
          className="relative grid h-11 w-11 place-items-center rounded-full border border-encre/[0.08] bg-papier/80 text-encre/60 transition-colors hover:bg-white hover:text-encre"
        >
          <Bell size={18} strokeWidth={1.9} />
          {listeAlertes.length ? (
            <span
              className={`absolute right-2.5 top-2.5 h-2 w-2 rounded-full ${
                grave ? 'bg-brique' : attention ? 'bg-ambre' : 'bg-foret'
              } ${animations ? 'animate-[pulser_2.6s_ease-in-out_infinite]' : ''}`}
              aria-hidden
            />
          ) : null}
          <span className="sr-only">Alertes</span>
        </motion.button>
      </div>
    </header>
  )
}
