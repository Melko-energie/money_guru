import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  HandCoins,
  Home,
  Landmark,
  PiggyBank,
  Target,
} from 'lucide-react'
import { useFinances } from '../../state/finances'
import { useAnimations } from '../../state/animations'
import { Curseur } from '../../components/Champs'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/donneesDemo'
import { formaterDevise, formaterPourcent } from '../../lib/format'
import { CATEGORIES } from '../../lib/calculs'
import { elementApparition, survolCarte } from '../../lib/animations'
import type { Categorie } from '../../lib/types'

const ICONES: Record<Categorie, typeof Home> = {
  maintenance: Home,
  urgence: PiggyBank,
  dettes: HandCoins,
  investissement: Landmark,
  objectifs: Target,
  fun: Coins,
}

/**
 * Rangée défilante des six catégories, façon carrousel « New Games » de la maquette :
  * une carte par poste, curseur intégré, flèches de défilement.
 */
export function CartesRepartition() {
  const { profil, montants, frais, definirAllocation } = useFinances()
  const { animations } = useAnimations()
  const piste = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(0)

  const defiler = (sens: -1 | 1) => {
    const el = piste.current
    if (!el) return
    const pas = el.clientWidth * 0.8
    el.scrollBy({ left: sens * pas, behavior: animations ? 'smooth' : 'auto' })
  }

  return (
    <motion.div variants={elementApparition} className="relative">
      <div
        ref={piste}
        onScroll={(e) => setPosition(e.currentTarget.scrollLeft)}
        className="defilement-doux -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3"
      >
        {CATEGORIES.map((categorie, i) => {
          const Icone = ICONES[categorie]
          const couleurs = COULEURS_CATEGORIE[categorie]
          const libelles = LIBELLES_CATEGORIE[categorie]
          const pct = profil.allocation[categorie]
          const budget = montants[categorie]
          // pour la maintenance, on confronte le budget alloué au coût réel saisi
          const ecart = categorie === 'maintenance' ? budget - frais : null

          return (
            <motion.article
              key={categorie}
              whileHover={survolCarte.whileHover}
              className="group relative flex min-h-[248px] w-[236px] shrink-0 snap-start flex-col overflow-hidden rounded-carte p-5 text-white shadow-carte"
              style={{
                background: `linear-gradient(150deg, ${couleurs.degrade[0]}, ${couleurs.degrade[1]})`,
              }}
            >
              <div
                className={`pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/15 blur-2xl ${
                  animations ? 'animate-[deriver_14s_ease-in-out_infinite]' : ''
                }`}
                style={{ animationDelay: `${i * 1.2}s` }}
                aria-hidden
              />

              <div className="relative flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Icone size={19} strokeWidth={1.9} />
                </span>
                <span className="rounded-pilule bg-white/95 px-3 py-1 text-[13px] font-bold tabular-nums text-encre shadow-sm">
                  {formaterPourcent(pct)}
                </span>
              </div>

              <div className="relative mt-auto pt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/65">
                  {libelles.sousTitre}
                </p>
                <h3 className="mt-1 text-[17px] font-bold leading-tight">{libelles.titre}</h3>
                <p className="mt-1 text-[18px] font-bold tabular-nums text-white/95">
                  {formaterDevise(budget, profil.devise, 0)}
                  <span className="ml-1 text-[11px] font-semibold text-white/60">/ mois</span>
                </p>

                {ecart !== null ? (
                  <p className="mt-1 text-[11px] font-semibold text-white/75">
                    {ecart >= 0
                      ? `${formaterDevise(ecart, profil.devise, 0)} de marge sur le budget`
                      : `${formaterDevise(Math.abs(ecart), profil.devise, 0)} au-dessus du budget`}
                  </p>
                ) : (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/70">
                    {libelles.role}
                  </p>
                )}

                <div className="mt-4">
                  <Curseur
                    valeur={pct}
                    min={0}
                    max={100}
                    libelle={`Part allouée à ${libelles.titre}`}
                    couleur="rgba(255,255,255,0.95)"
                    onChange={(v) => definirAllocation(categorie, v)}
                  />
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>

      <div className="pointer-events-none absolute -top-11 right-0 flex gap-2">
        <button
          type="button"
          onClick={() => defiler(-1)}
          disabled={position <= 4}
          title="Postes précédents"
          className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-encre/[0.09] bg-white text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre disabled:opacity-30 disabled:hover:translate-y-0"
        >
          <ChevronLeft size={16} />
          <span className="sr-only">Postes précédents</span>
        </button>
        <button
          type="button"
          onClick={() => defiler(1)}
          title="Postes suivants"
          className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full border border-encre/[0.09] bg-white text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre"
        >
          <ChevronRight size={16} />
          <span className="sr-only">Postes suivants</span>
        </button>
      </div>
    </motion.div>
  )
}
