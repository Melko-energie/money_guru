import { motion } from 'framer-motion'
import { CalendarClock, PartyPopper, ShieldCheck, ArrowUpRight } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { useAnimations } from '../../state/animations'
import { BarreProgression } from '../../components/BarreProgression'
import { Selecteur } from '../../components/Champs'
import { formaterDevise, formaterNombre, formaterPourcent } from '../../lib/format'
import { formaterEcheance } from '../../lib/pedagogie'
import { MOIS_OBJECTIF_URGENCE } from '../../lib/calculs'
import { LIBELLES_CATEGORIE } from '../../lib/definitions'
import { elementApparition } from '../../lib/animations'
import type { ProfilFinancier, Vue } from '../../lib/types'

type CibleRedirection = ProfilFinancier['redirectionApresUrgence']

const CIBLES: CibleRedirection[] = ['investissement', 'objectifs', 'dettes', 'fun']

/** Rangée « Last Downloads » : la jauge du fonds d'urgence et ses paliers. */
export function BandeauFondsUrgence({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const {
    profil,
    objectifUrgence,
    progressionUrgencePct,
    moisDejaCouverts,
    moisAvantObjectif,
    montants,
    paliers,
    urgenceAtteinte,
    definirRedirection,
    appliquerRedirection,
  } = useFinances()
  const { animations } = useAnimations()

  const jalons = paliers.map((p) => ({
    position: (p.mois / MOIS_OBJECTIF_URGENCE) * 100,
    libelle: `${p.mois} mois`,
    atteint: p.atteint,
  }))

  return (
    <motion.section
      variants={elementApparition}
      className="relative overflow-hidden rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
    >
      <div
        className={`pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-foret/10 blur-3xl ${
          animations ? 'animate-[deriver_20s_ease-in-out_infinite]' : ''
        }`}
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center gap-5">
        <div className="flex min-w-[240px] flex-1 items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-foret to-foret-deep text-white shadow-[0_16px_32px_-16px_rgba(42,92,41,0.9)]">
            {urgenceAtteinte ? <PartyPopper size={24} /> : <ShieldCheck size={24} />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17px] font-bold leading-none text-encre">Votre sécurité</h3>
              <span className="rounded-pilule bg-foret-tint px-2.5 py-1 text-[10.5px] font-bold text-foret-deep">
                Objectif {MOIS_OBJECTIF_URGENCE} mois de maintenance
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-meta">
              {formaterDevise(profil.soldeFondsUrgence, profil.devise, 0)} sur{' '}
              {formaterDevise(objectifUrgence, profil.devise, 0)}
              {montants.urgence > 0 ? (
                <> · {formaterDevise(montants.urgence, profil.devise, 0)} mis de côté chaque mois</>
              ) : (
                <> · aucune part allouée pour l’instant</>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-5">
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
              Mois couverts
            </p>
            <p className="text-[19px] font-bold tabular-nums leading-tight text-encre">
              {formaterNombre(Math.min(moisDejaCouverts, 99), 1)}
              <span className="text-[12px] font-semibold text-meta">
                {' '}
                / {MOIS_OBJECTIF_URGENCE}
              </span>
            </p>
          </div>

          <span className="hidden h-9 w-px bg-encre/10 sm:block" aria-hidden />

          <div className="hidden text-right sm:block">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-meta">
              <CalendarClock size={12} />
              Objectif dans
            </p>
            <p className="text-[19px] font-bold leading-tight text-encre">
              {formaterEcheance(moisAvantObjectif)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNaviguer('reglages')}
            title="Ajuster mes montants"
            className="grid h-11 w-11 place-items-center rounded-full bg-papier-100 text-encre/60 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-encre hover:shadow-md active:translate-y-0 active:scale-95"
          >
            <ArrowUpRight size={17} strokeWidth={2} />
            <span className="sr-only">Ajuster mes montants</span>
          </button>
        </div>
      </div>

      <div className="relative mt-5">
        <BarreProgression valeur={progressionUrgencePct} jalons={jalons} hauteur="h-4" />
        <p className="mt-4 text-[12px] font-semibold text-foret-deep">
          {formaterPourcent(progressionUrgencePct)} de l’objectif, soit{' '}
          {formaterNombre(moisDejaCouverts, 1)} mois de maintenance couverts.
        </p>
      </div>

      {urgenceAtteinte ? (
        <div className="relative mt-4 flex flex-wrap items-end gap-4 rounded-2xl bg-foret-tint p-4">
          <p className="min-w-[220px] flex-1 text-[12.5px] leading-relaxed text-foret-deep">
            Objectif atteint. Les {formaterDevise(montants.urgence, profil.devise, 0)} mensuels
            n’ont plus de raison d’alimenter ce fonds : choisissez leur nouvelle destination.
          </p>
          <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
            <div className="min-w-[220px] flex-1 sm:w-[240px] sm:flex-none">
              <Selecteur
                libelle="Rediriger cette allocation vers"
                valeur={profil.redirectionApresUrgence}
                options={CIBLES.map((c) => ({ valeur: c, libelle: LIBELLES_CATEGORIE[c].titre }))}
                onChange={definirRedirection}
              />
            </div>
            <button
              type="button"
              onClick={appliquerRedirection}
              disabled={montants.urgence <= 0}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-pilule bg-encre px-4 py-3 text-[12.5px] font-bold text-white transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-35 disabled:hover:translate-y-0"
            >
              Appliquer
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </motion.section>
  )
}
