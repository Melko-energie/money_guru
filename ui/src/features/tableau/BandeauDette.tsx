import { motion } from 'framer-motion'
import { CalendarClock, HandCoins, ShieldAlert, Sliders } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { useAnimations } from '../../state/animations'
import { BarreProgression } from '../../components/BarreProgression'
import { formaterDevise, formaterNombre, formaterRatio } from '../../lib/format'
import { formaterEcheance } from '../../lib/pedagogie'
import { SEUIL_RATIO_REMBOURSEMENT } from '../../lib/calculs'
import { elementApparition } from '../../lib/animations'
import type { Vue } from '../../lib/types'

/**
 * Colonne dette du context §10, en rangée : total dû, remboursement mensuel,
 * limite d'emprunt et alerte de surendettement.
 */
export function BandeauDette({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const {
    profil,
    limiteDette,
    usageDette,
    ratioRembours,
    moisSolderDette,
    detteExcessive,
    montants,
  } = useFinances()
  const { animations } = useAnimations()

  const sansDette = profil.dettes.total <= 0
  const remboursementEffectif = Math.max(profil.dettes.remboursementMensuel, montants.dettes)

  return (
    <motion.section
      variants={elementApparition}
      className="relative overflow-hidden rounded-carte border border-encre/[0.06] bg-white p-5 shadow-carte sm:p-6"
    >
      <div
        className={`pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full blur-3xl ${
          detteExcessive ? 'bg-brique/15' : 'bg-ardoise/10'
        } ${animations ? 'animate-[deriver_23s_ease-in-out_infinite_reverse]' : ''}`}
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center gap-5">
        <div className="flex min-w-[240px] flex-1 items-center gap-4">
          <span
            className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-[0_16px_32px_-16px_rgba(138,49,32,0.8)] ${
              detteExcessive
                ? 'bg-gradient-to-br from-brique-soft to-brique-deep'
                : 'bg-gradient-to-br from-ardoise-soft to-ardoise-deep'
            }`}
          >
            {detteExcessive ? <ShieldAlert size={24} /> : <HandCoins size={24} />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17px] font-bold leading-none text-encre">
                Dettes personnelles
              </h3>
              <span className="rounded-pilule bg-papier-100 px-2.5 py-1 text-[10.5px] font-bold text-meta">
                Sans intérêt · auprès de proches
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-meta">
              {sansDette ? (
                <>Aucune dette en cours. Votre limite d’emprunt reste entière.</>
              ) : (
                <>
                  {formaterDevise(profil.dettes.total, profil.devise, 0)} dus ·{' '}
                  {formaterDevise(remboursementEffectif, profil.devise, 0)} remboursés chaque mois
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-5">
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
              Limite d’emprunt
            </p>
            <p className="text-[19px] font-bold tabular-nums leading-tight text-encre">
              {formaterDevise(limiteDette, profil.devise, 0)}
            </p>
            <p className="text-[10.5px] font-semibold text-meta">
              {formaterNombre(profil.dettes.multiplicateurLimite, 1)} × le revenu net
            </p>
          </div>

          <span className="hidden h-9 w-px bg-encre/10 sm:block" aria-hidden />

          <div className="hidden text-right sm:block">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-meta">
              <CalendarClock size={12} />
              Soldée dans
            </p>
            <p className="text-[19px] font-bold leading-tight text-encre">
              {formaterEcheance(moisSolderDette)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNaviguer('reglages')}
            title="Ajuster mes dettes"
            className="grid h-11 w-11 place-items-center rounded-full border border-encre/[0.09] bg-papier/80 text-encre/60 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-encre hover:shadow-md active:translate-y-0 active:scale-95"
          >
            <Sliders size={17} strokeWidth={1.9} />
            <span className="sr-only">Ajuster mes dettes</span>
          </button>
        </div>
      </div>

      <div className="relative mt-5">
        <BarreProgression
          valeur={Math.min(100, usageDette * 100)}
          hauteur="h-4"
          degrade={
            detteExcessive
              ? 'from-brique-soft via-brique to-brique-deep'
              : 'from-ardoise-soft via-ardoise to-ardoise-deep'
          }
          jalons={[{ position: 100, libelle: 'limite', atteint: usageDette >= 1 }]}
        />
        <p
          className={`mt-4 text-[12px] font-semibold ${
            detteExcessive ? 'text-brique-deep' : 'text-meta'
          }`}
        >
          {formaterRatio(usageDette)} de la limite consommée · le remboursement pèse{' '}
          {formaterRatio(ratioRembours)} du revenu
          {ratioRembours > SEUIL_RATIO_REMBOURSEMENT
            ? ` (au-delà du repère de ${formaterRatio(SEUIL_RATIO_REMBOURSEMENT)})`
            : ''}
          .
        </p>
      </div>
    </motion.section>
  )
}
