import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, PiggyBank, Search, X } from 'lucide-react'
import { useFinances } from '../state/finances'
import { useAnimations } from '../state/animations'
import { rechercher } from '../lib/recherche'
import { SECTIONS, sectionDe } from '../lib/sections'
import type { Vue } from '../lib/types'

const EXEMPLES = [
  'Combien coûte ma maintenance personnelle ?',
  'Combien puis-je me permettre en fun money ?',
  'Où en est mon fonds d’urgence ?',
  'Ma dette dépasse-t-elle ma limite ?',
  'Que vaut ma stratégie sur 42 ans ?',
]

/** Bouton rond de la barre : verre clair, il laisse passer le fond. */
const ROND =
  'grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/55 text-encre/60 shadow-interne backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-encre hover:shadow-md active:translate-y-0 active:scale-95'

/** Pastille de l'onglet en cours. */
const PASTILLE =
  'absolute inset-0 rounded-pilule border border-white/80 bg-white shadow-[0_10px_24px_-14px_rgba(39,40,42,0.6)]'

/**
 * Barre de navigation en verre : panneau translucide et flouté, collé en haut,
 * que le fond et les halos traversent. Marque à gauche, onglets pilule au
 * centre avec une pastille active qui glisse, actions rondes à droite.
 */
export function BarreSuperieure({
  vue,
  onNaviguer,
}: {
  vue: Vue
  onNaviguer: (v: Vue) => void
}) {
  const { profil, listeAlertes, definirMoisAffiche } = useFinances()
  const { animations } = useAnimations()
  const [index, setIndex] = useState(0)
  const [recherche, setRecherche] = useState('')
  const [rechercheOuverte, setRechercheOuverte] = useState(false)
  const champ = useRef<HTMLInputElement>(null)

  const resultats = useMemo(() => rechercher(profil, recherche), [profil, recherche])
  const sectionActive = sectionDe(vue).cle

  useEffect(() => {
    if (!animations) return
    const t = setInterval(() => setIndex((i) => (i + 1) % EXEMPLES.length), 4200)
    return () => clearInterval(t)
  }, [animations])

  useEffect(() => {
    if (rechercheOuverte) champ.current?.focus()
  }, [rechercheOuverte])

  const grave = listeAlertes.some((a) => a.niveau === 'danger')
  const attention = listeAlertes.some((a) => a.niveau === 'attention')
  const initiales = (profil.prenom || 'MG').slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-3 z-30 flex items-center gap-3 rounded-[30px] border border-white/70 bg-white/55 px-4 py-3 shadow-[0_24px_60px_-28px_rgba(39,40,42,0.5)] backdrop-blur-2xl sm:top-4 sm:px-5">
      {/* le liseré et le voile du haut donnent son épaisseur au verre */}
      <span
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 rounded-[30px] bg-gradient-to-b from-white/55 via-white/10 to-transparent"
        aria-hidden
      />

      <button
        type="button"
        onClick={() => onNaviguer('tableau')}
        className="relative flex shrink-0 items-center gap-2.5 rounded-pilule pr-2 transition-opacity duration-300 hover:opacity-80"
        title="Money Guru — tableau de bord"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-olive-soft to-olive-deep text-white shadow-[0_8px_18px_-8px_rgba(118,125,47,0.9)]">
          <PiggyBank size={19} strokeWidth={2} />
        </span>
        <span className="hidden text-[17px] font-bold tracking-tight text-encre sm:block">
          Money Guru
        </span>
      </button>

      {rechercheOuverte ? (
        <label className="relative flex min-w-0 flex-1 items-center">
          <span className="sr-only">Rechercher dans votre tableau de bord</span>
          <Search size={17} className="pointer-events-none absolute left-4 text-meta" />
          <input
            ref={champ}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={EXEMPLES[index]}
            className="h-11 w-full rounded-pilule border border-white/70 bg-white/70 pl-11 pr-10 text-[14px] text-encre shadow-interne outline-none backdrop-blur-md transition-all duration-300 placeholder:text-meta focus:border-ciel focus:bg-white"
          />
          <button
            type="button"
            onClick={() => {
              setRecherche('')
              setRechercheOuverte(false)
            }}
            className="absolute right-3 grid h-6 w-6 place-items-center rounded-full text-meta transition-colors hover:bg-encre/5 hover:text-encre"
          >
            <X size={14} />
            <span className="sr-only">Fermer la recherche</span>
          </button>

          {recherche.trim().length >= 2 ? (
            <div
              role="listbox"
              aria-label="Résultats de recherche"
              className="defilement-doux absolute left-0 right-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-carte border border-white/70 bg-white/95 p-1.5 shadow-carte backdrop-blur-2xl"
            >
              {resultats.length === 0 ? (
                <p className="px-3 py-4 text-center text-[12.5px] text-meta">
                  Rien trouvé pour « {recherche.trim()} ».
                </p>
              ) : (
                resultats.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      if (r.mois) definirMoisAffiche(r.mois)
                      onNaviguer(r.vue)
                      setRecherche('')
                      setRechercheOuverte(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-200 hover:bg-papier-100"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-encre">
                        {r.titre}
                      </span>
                      <span className="block truncate text-[11.5px] text-meta">{r.detail}</span>
                    </span>
                    <span className="shrink-0 rounded-pilule bg-papier-100 px-2.5 py-1 text-[10.5px] font-bold text-meta">
                      {r.famille}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </label>
      ) : (
        <nav
          className="defilement-doux relative hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:flex lg:justify-center"
          aria-label="Navigation principale"
        >
          {SECTIONS.map((section) => {
            const actif = section.cle === sectionActive
            return (
              <button
                key={section.cle}
                type="button"
                onClick={() => onNaviguer(section.vues[0].vue)}
                aria-current={actif ? 'page' : undefined}
                className={`relative shrink-0 rounded-pilule px-4 py-2.5 text-[13.5px] font-semibold transition-colors duration-300 ${
                  actif ? 'text-olive-deep' : 'text-meta hover:text-encre'
                }`}
              >
                {actif ? (
                  animations ? (
                    // la pastille glisse d'un onglet à l'autre plutôt que de sauter
                    <motion.span
                      layoutId="onglet-actif"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className={PASTILLE}
                      aria-hidden
                    />
                  ) : (
                    <span className={PASTILLE} aria-hidden />
                  )
                ) : null}
                <span className="relative">{section.libelle}</span>
              </button>
            )
          })}
        </nav>
      )}

      <div className="relative ml-auto flex shrink-0 items-center gap-2">
        {rechercheOuverte ? null : (
          <button
            type="button"
            onClick={() => setRechercheOuverte(true)}
            title="Rechercher"
            className={ROND}
          >
            <Search size={18} strokeWidth={1.9} />
            <span className="sr-only">Rechercher dans votre tableau de bord</span>
          </button>
        )}

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
          className={`relative ${ROND}`}
        >
          <Bell size={18} strokeWidth={1.9} />
          {listeAlertes.length ? (
            <span
              className={`absolute right-2.5 top-2.5 h-2 w-2 rounded-full ring-2 ring-white ${
                grave ? 'bg-alerte' : attention ? 'bg-ambre' : 'bg-olive'
              } ${animations ? 'animate-[pulser_2.6s_ease-in-out_infinite]' : ''}`}
              aria-hidden
            />
          ) : null}
          <span className="sr-only">Alertes</span>
        </motion.button>

        <button
          type="button"
          onClick={() => onNaviguer('reglages')}
          title={`${profil.prenom || 'Vous'} — mes chiffres`}
          className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-encre-soft to-encre text-[13px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(39,40,42,0.9)] ring-1 ring-white/40 transition-transform duration-300 hover:-translate-y-0.5 active:scale-95"
        >
          {initiales}
          <span className="sr-only">Votre profil</span>
        </button>
      </div>
    </header>
  )
}
