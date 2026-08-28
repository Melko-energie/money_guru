import { motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useFinances } from '../../state/finances'
import { AvancementAnnuel } from './AvancementAnnuel'
import { ChampsMois } from './ChampsMois'
import { Carte } from '../../components/Carte'
import { Chiffre } from '../../components/Chiffre'
import { cleMoisDe, decalerMois, libelleMois } from '../../lib/calendrier'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/definitions'
import { CATEGORIES } from '../../lib/calculs'
import { formaterDevise } from '../../lib/format'
import { conteneurCascade } from '../../lib/animations'
import type { Vue } from '../../lib/types'

/**
 * Suivi mensuel : le mois n'est pas une donnée isolée.
 * Report entrant + revenu − dépenses = reste, et ce reste devient le report
 * du mois suivant dès que le mois est clos.
 */
export function PageSuivi({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const {
    profil,
    moisAffiche,
    definirMoisAffiche,
    situationDuMois: s,
    chaineDuSuivi,
    ficheDuMois,
    moisDuSalaire,
    basculerCloture,
  } = useFinances()

  const devise = profil.devise
  const positif = s.totalReste >= 0
  const decalage = profil.versementSalaire.financeMoisSuivant

  return (
    <motion.div
      variants={conteneurCascade}
      initial="cache"
      animate="visible"
      className="grid gap-5 pb-2 xl:grid-cols-[minmax(0,1fr)_minmax(300px,330px)]"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <Carte
          icone={Wallet}
          titre={libelleMois(moisAffiche)}
          sousTitre={s.clos ? 'Mois clos — son reste passe au suivant' : 'Mois ouvert'}
          controles={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => definirMoisAffiche(decalerMois(moisAffiche, -1))}
                title="Mois précédent"
                className="grid h-9 w-9 place-items-center rounded-full bg-papier-100 text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre"
              >
                <ChevronLeft size={16} />
                <span className="sr-only">Mois précédent</span>
              </button>
              <button
                type="button"
                onClick={() => definirMoisAffiche(cleMoisDe())}
                className="rounded-pilule bg-papier-100 px-3.5 py-2 text-[12px] font-semibold text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre"
              >
                Ce mois-ci
              </button>
              <button
                type="button"
                onClick={() => definirMoisAffiche(decalerMois(moisAffiche, 1))}
                title="Mois suivant"
                className="grid h-9 w-9 place-items-center rounded-full bg-papier-100 text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre"
              >
                <ChevronRight size={16} />
                <span className="sr-only">Mois suivant</span>
              </button>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-4">
            <Chiffre
              libelle="Report entrant"
              valeur={formaterDevise(s.totalReportEntrant, devise, 0)}
              sens="Ce qui restait du mois précédent"
              accent="text-ciel-deep"
            />
            <Chiffre
              libelle="Revenu du mois"
              valeur={formaterDevise(s.revenu, devise, 0)}
              sens={
                decalage
                  ? `Le salaire touché en ${libelleMois(moisDuSalaire).toLowerCase()}`
                  : ficheDuMois.revenuPercu === null
                    ? 'Celui de votre profil, modifiable ci-dessous'
                    : 'Saisi pour ce mois précisément'
              }
            />
            <Chiffre
              libelle="Dépensé"
              valeur={formaterDevise(s.totalSorties, devise, 0)}
              sens={`Dont ${formaterDevise(s.chargesFixes, devise, 0)} de frais déclarés`}
            />
            <Chiffre
              libelle="Reste"
              valeur={formaterDevise(s.totalReste, devise, 0)}
              sens={
                s.clos
                  ? 'Transmis au mois suivant'
                  : 'Sera transmis dès que vous clôturez le mois'
              }
              accent={positif ? 'text-succes-deep' : 'text-alerte-deep'}
            />
          </div>

          <div className="mt-5 border-t border-encre/[0.06] pt-4">
            <ChampsMois cle={moisAffiche} />
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <button
              type="button"
              onClick={() => basculerCloture(moisAffiche)}
              className={`inline-flex items-center gap-2 rounded-pilule px-4 py-2.5 text-[13px] font-bold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                s.clos
                  ? 'bg-papier-100 text-encre'
                  : 'bg-encre text-white shadow-[0_12px_26px_-14px_rgba(39,40,42,0.9)]'
              }`}
            >
              {s.clos ? <LockOpen size={15} /> : <Lock size={15} />}
              {s.clos ? 'Rouvrir le mois' : 'Clôturer le mois'}
            </button>
          </div>
        </Carte>

        <AvancementAnnuel />

        <Carte
          icone={positif ? TrendingUp : TrendingDown}
          titre="Ce qui reste, poste par poste"
          sousTitre="Report entrant + alloué − ce qui sort"
        >
          <ul className="flex flex-col divide-y divide-encre/[0.06]">
            {CATEGORIES.map((c) => {
              const reste = s.reste[c]
              // la maintenance sort sans saisie : ses frais déclarés comptent
              const sorti = s.depense[c] + (c === 'maintenance' ? s.chargesFixes : 0)
              return (
                <li key={c} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                  <span className="inline-flex min-w-[170px] flex-1 items-center gap-2 text-[13px] font-semibold text-encre">
                    <span className={`h-2.5 w-2.5 rounded-full ${COULEURS_CATEGORIE[c].puce}`} />
                    {LIBELLES_CATEGORIE[c].titre}
                  </span>
                  <span className="text-[12px] tabular-nums text-meta">
                    {formaterDevise(s.reportEntrant[c], devise, 0)}
                    {' + '}
                    {formaterDevise(s.alloue[c], devise, 0)}
                    {' − '}
                    {formaterDevise(sorti, devise, 0)}
                    {c === 'maintenance' && s.chargesFixes > 0 ? (
                      <span className="ml-1.5 text-[11px]">(frais déclarés)</span>
                    ) : null}
                  </span>
                  <span
                    className={`ml-auto text-[13.5px] font-bold tabular-nums ${
                      reste >= 0 ? 'text-encre' : 'text-alerte-deep'
                    }`}
                  >
                    {formaterDevise(reste, devise, 0)}
                  </span>
                </li>
              )
            })}
          </ul>
        </Carte>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <Carte
          icone={ArrowRight}
          titre="La chaîne des mois"
          sousTitre="Du plus ancien au plus récent"
          ouvrir={() => onNaviguer('calendrier')}
          ouvrirLibelle="Ouvrir le calendrier"
        >
          <ul className="flex flex-col gap-1">
            {chaineDuSuivi.map((m) => {
              const actif = m.cle === moisAffiche
              return (
                <li key={m.cle}>
                  <button
                    type="button"
                    onClick={() => definirMoisAffiche(m.cle)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-200 ${
                      actif ? 'bg-papier-100' : 'hover:bg-papier-100/60'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-encre">
                        {libelleMois(m.cle)}
                      </span>
                      <span className="block truncate text-[11.5px] text-meta">
                        {m.clos ? 'clos' : 'ouvert'} ·{' '}
                        {formaterDevise(m.totalReportEntrant, devise, 0)} reportés
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-[13px] font-bold tabular-nums ${
                        m.totalReste >= 0 ? 'text-succes-deep' : 'text-alerte-deep'
                      }`}
                    >
                      {formaterDevise(m.totalReste, devise, 0)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <p className="mt-3 border-t border-encre/[0.06] pt-3 text-[11.5px] leading-relaxed text-meta">
            Un mois ne transmet son reste qu'une fois clos. Corriger un mois ancien recalcule tous
            les suivants.
          </p>
        </Carte>
      </div>
    </motion.div>
  )
}
