import { motion } from 'framer-motion'
import { CalendarDays, Flame, Repeat, Sliders } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { useAnimations } from '../../state/animations'
import { BarreProgression } from '../../components/BarreProgression'
import { libelleJour, libelleMois } from '../../lib/calendrier'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/donneesDemo'
import { formaterDevise } from '../../lib/format'
import { elementApparition } from '../../lib/animations'
import type { Vue } from '../../lib/types'

/**
 * Zone calendrier du context §10 : dépenses du mois, jours coûteux,
 * récurrences à venir et écart prévu/réel — en résumé, sur le tableau de bord.
 */
export function BandeauCalendrier({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { profil, bilanMois, moisAffiche } = useFinances()
  const { animations } = useAnimations()

  const depassement = bilanMois.totalReel - bilanMois.totalPrevu
  const ratio = bilanMois.totalPrevu > 0 ? bilanMois.totalReel / bilanMois.totalPrevu : 0
  // les trois catégories qui creusent le plus l'écart
  const pires = [...bilanMois.ecarts].sort((a, b) => b.ecart - a.ecart).slice(0, 3)

  return (
    <motion.section
      variants={elementApparition}
      className="relative overflow-hidden rounded-carte border border-encre/[0.06] bg-white p-5 shadow-carte sm:p-6"
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl ${
          depassement > 0 ? 'bg-brique/10' : 'bg-ardoise/10'
        } ${animations ? 'animate-[deriver_21s_ease-in-out_infinite]' : ''}`}
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center gap-5">
        <div className="flex min-w-[240px] flex-1 items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ardoise-soft to-ardoise-deep text-white shadow-[0_16px_32px_-16px_rgba(44,68,79,0.9)]">
            <CalendarDays size={24} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17px] font-bold leading-none text-encre">
                Dépenses de {libelleMois(moisAffiche).toLowerCase()}
              </h3>
              {bilanMois.recurrences.length > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-pilule bg-papier-100 px-2.5 py-1 text-[10.5px] font-bold text-meta">
                  <Repeat size={10} />
                  {bilanMois.recurrences.length} récurrence(s)
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-[12.5px] text-meta">
              {formaterDevise(bilanMois.totalReel, profil.devise, 0)} saisis sur{' '}
              {formaterDevise(bilanMois.totalPrevu, profil.devise, 0)} de budget
              {bilanMois.totalProjete > 0 ? (
                <>
                  {' '}
                  · {formaterDevise(bilanMois.totalProjete, profil.devise, 0)} de récurrences encore
                  à venir
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-5">
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
              Écart prévu / réel
            </p>
            <p
              className={`text-[19px] font-bold tabular-nums leading-tight ${
                depassement > 0 ? 'text-brique-deep' : 'text-foret-deep'
              }`}
            >
              {depassement > 0 ? '+' : '−'}
              {formaterDevise(Math.abs(depassement), profil.devise, 0)}
            </p>
          </div>

          <span className="hidden h-9 w-px bg-encre/10 sm:block" aria-hidden />

          <div className="hidden text-right sm:block">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-meta">
              <Flame size={12} />
              Jour le plus lourd
            </p>
            <p className="text-[19px] font-bold tabular-nums leading-tight text-encre">
              {bilanMois.joursCouteux[0]
                ? formaterDevise(bilanMois.joursCouteux[0].total, profil.devise, 0)
                : '—'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNaviguer('calendrier')}
            title="Ouvrir le calendrier"
            className="grid h-11 w-11 place-items-center rounded-full border border-encre/[0.09] bg-papier/80 text-encre/60 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-encre hover:shadow-md active:translate-y-0 active:scale-95"
          >
            <Sliders size={17} strokeWidth={1.9} />
            <span className="sr-only">Ouvrir le calendrier</span>
          </button>
        </div>
      </div>

      <div className="relative mt-5">
        <BarreProgression
          valeur={Math.min(100, ratio * 100)}
          hauteur="h-4"
          degrade={
            depassement > 0
              ? 'from-brique-soft via-brique to-brique-deep'
              : 'from-ardoise-soft via-ardoise to-ardoise-deep'
          }
          jalons={[{ position: 100, libelle: 'budget', atteint: ratio >= 1 }]}
        />
      </div>

      <div className="relative mt-4 grid gap-3 border-t border-encre/[0.06] pt-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-meta">
            Ce qui creuse l’écart
          </p>
          <ul className="flex flex-col gap-1.5">
            {pires.map((e) => (
              <li key={e.categorie} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-encre">
                  <span className={`h-2 w-2 rounded-full ${COULEURS_CATEGORIE[e.categorie].puce}`} />
                  {LIBELLES_CATEGORIE[e.categorie].titre}
                </span>
                <span
                  className={`text-[12px] font-bold tabular-nums ${
                    e.ecart > 0 ? 'text-brique-deep' : 'text-meta'
                  }`}
                >
                  {e.ecart > 0 ? '+' : '−'}
                  {formaterDevise(Math.abs(e.ecart), profil.devise, 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-meta">
            Jours coûteux
          </p>
          {bilanMois.joursCouteux.length === 0 ? (
            <p className="text-[12px] text-meta">Aucune dépense saisie ce mois-ci.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {bilanMois.joursCouteux.map((j) => (
                <li key={j.cle} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 truncate text-[12px] font-semibold text-encre">
                    {j.eleve ? <Flame size={11} className="shrink-0 text-brique" /> : null}
                    {libelleJour(j.cle)}
                  </span>
                  <span className="shrink-0 text-[12px] font-bold tabular-nums text-encre">
                    {formaterDevise(j.total, profil.devise, 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.section>
  )
}
