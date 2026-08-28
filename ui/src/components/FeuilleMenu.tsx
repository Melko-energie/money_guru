import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'
import { BasculeAnimations } from './BasculeAnimations'
import { useFinances } from '../state/finances'
import { formaterDevise, moisEnCours } from '../lib/format'
import { ficheMethode } from '../lib/methodes'
import { SECTIONS } from '../lib/sections'
import type { Vue } from '../lib/types'

/**
 * Feuille plein écran du mobile, reprise de la référence T5 : carte de profil
 * en aplat sombre, puis les vues rangées en sections de lignes cliquables.
 * C'est elle qui garantit que les six pages restent accessibles au téléphone.
 */
export function FeuilleMenu({
  ouverte,
  vue,
  onNaviguer,
  onFermer,
}: {
  ouverte: boolean
  vue: Vue
  onNaviguer: (v: Vue) => void
  onFermer: () => void
}) {
  const { profil, montants } = useFinances()

  return (
    <AnimatePresence>
      {ouverte ? (
        <motion.div
          key="feuille-menu"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Toutes les vues"
          className="defilement-doux fixed inset-0 z-50 overflow-y-auto bg-papier px-4 pb-32 pt-5 sm:hidden"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[22px] font-bold text-encre">Tout Money Guru</h2>
            <button
              type="button"
              onClick={onFermer}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-encre/60 shadow-pilule ring-1 ring-encre/[0.06] active:scale-95"
            >
              <X size={18} />
              <span className="sr-only">Fermer le menu</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onNaviguer('reglages')
              onFermer()
            }}
            className="mb-5 flex w-full items-center gap-3.5 rounded-carte bg-encre p-4 text-left text-white shadow-carte active:scale-[0.99]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15 text-[15px] font-bold">
              {(profil.prenom || 'MG').slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] font-bold">
                {profil.prenom || 'Vous'}
              </span>
              <span className="block truncate text-[12px] text-white/55">
                {moisEnCours()} · {ficheMethode(profil.methode).titre}
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-white/50" />
          </button>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-carte bg-white p-3.5 shadow-pilule ring-1 ring-encre/[0.05]">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                Fun money
              </p>
              <p className="mt-0.5 text-[16px] font-bold tabular-nums text-encre">
                {formaterDevise(montants.fun, profil.devise, 0)}
              </p>
            </div>
            <div className="rounded-carte bg-white p-3.5 shadow-pilule ring-1 ring-encre/[0.05]">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                Fonds d’urgence
              </p>
              <p className="mt-0.5 text-[16px] font-bold tabular-nums text-encre">
                {formaterDevise(profil.soldeFondsUrgence, profil.devise, 0)}
              </p>
            </div>
          </div>

          {SECTIONS.map((section) => (
            <section key={section.cle} className="mb-4">
              {section.vues.length > 1 ? (
                <h3 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wide text-meta">
                  {section.libelle}
                </h3>
              ) : null}
              <div className="overflow-hidden rounded-carte bg-white shadow-pilule ring-1 ring-encre/[0.05]">
                {section.vues.map(({ vue: cible, icone: Icone, titre, aide }, i) => (
                  <button
                    key={cible}
                    type="button"
                    onClick={() => {
                      onNaviguer(cible)
                      onFermer()
                    }}
                    aria-current={vue === cible ? 'page' : undefined}
                    className={`flex w-full items-center gap-3.5 p-3.5 text-left transition-colors duration-200 active:bg-papier-100 ${
                      i > 0 ? 'border-t border-encre/[0.06]' : ''
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                        vue === cible ? 'bg-olive text-white' : 'bg-papier-100 text-encre/60'
                      }`}
                    >
                      <Icone size={18} strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-bold text-encre">
                        {titre}
                      </span>
                      <span className="block truncate text-[12px] text-meta">{aide}</span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-meta" />
                  </button>
                ))}
              </div>
            </section>
          ))}

          <div className="flex items-center justify-between gap-3 rounded-carte bg-white p-3.5 shadow-pilule ring-1 ring-encre/[0.05]">
            <span className="text-[13.5px] font-semibold text-encre">Animations</span>
            <BasculeAnimations compact />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
