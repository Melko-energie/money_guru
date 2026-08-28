import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { Modale } from '../../components/Modale'
import { ChampsMois } from '../suivi/ChampsMois'
import { BarreProgression } from '../../components/BarreProgression'
import { situationsAnnee } from '../../lib/suivi'
import { cleMoisDe, libelleMois, libelleMoisCourt } from '../../lib/calendrier'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/definitions'
import { CATEGORIES } from '../../lib/calculs'
import { formaterCompact, formaterDevise } from '../../lib/format'

/**
 * Les douze mois d'un coup d'œil : une tuile par mois, compacte.
 * Chaque tuile répond à trois questions — combien est parti, ce qui restait du
 * mois d'avant, ce qui reste à la fin. Le détail s'ouvre au clic.
 */
export function VueAnnuelle({ onOuvrirMois }: { onOuvrirMois: (cle: string) => void }) {
  const { profil, moisAffiche, anneeAffichee: annee, definirAnnee } = useFinances()
  // on retient la clé, pas l'objet : corriger un chiffre dans la modale doit
  // rafraîchir ce qu'elle affiche, pas garder une photo prise au clic
  const [detailCle, setDetailCle] = useState<string | null>(null)

  const mois = useMemo(() => situationsAnnee(profil, annee), [profil, annee])
  const detail = mois.find((m) => m.cle === detailCle) ?? null
  const devise = profil.devise

  // un mois à venir n'a rien « dépensé » : ses charges fixes sont une prévision
  const moisCourant = cleMoisDe()
  const totalDepense = mois
    .filter((m) => m.cle <= moisCourant)
    .reduce((s, m) => s + m.totalSorties, 0)
  const plafond = Math.max(...mois.map((m) => Math.max(m.totalBudget, m.totalSorties)), 1)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
            Dépensé sur l’année
          </p>
          <p className="text-[22px] font-bold tabular-nums leading-tight text-encre">
            {formaterDevise(totalDepense, devise, 0)}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => definirAnnee(annee - 1)}
            title="Année précédente"
            className="grid h-9 w-9 place-items-center rounded-full bg-papier-100 text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre"
          >
            <ChevronLeft size={16} />
            <span className="sr-only">Année précédente</span>
          </button>
          <span className="min-w-[64px] text-center text-[15px] font-bold tabular-nums text-encre">
            {annee}
          </span>
          <button
            type="button"
            onClick={() => definirAnnee(annee + 1)}
            title="Année suivante"
            className="grid h-9 w-9 place-items-center rounded-full bg-papier-100 text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre"
          >
            <ChevronRight size={16} />
            <span className="sr-only">Année suivante</span>
          </button>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {mois.map((m) => {
          const vide = m.cle > moisCourant && m.totalDepense === 0
          const part = Math.min(100, (m.totalSorties / plafond) * 100)
          const depasse = m.totalReste < 0
          return (
            <li key={m.cle}>
              <button
                type="button"
                onClick={() => setDetailCle(m.cle)}
                className={`flex w-full flex-col gap-1.5 rounded-2xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-carte active:translate-y-0 ${
                  m.cle === moisAffiche
                    ? 'border-olive/40 bg-olive-tint'
                    : 'border-encre/[0.07] bg-white'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-bold text-encre">
                    {libelleMoisCourt(m.cle)}
                  </span>
                  {m.clos ? (
                    <Lock size={11} className="shrink-0 text-meta" aria-label="Mois clos" />
                  ) : null}
                </span>

                <span
                  className={`text-[16px] font-bold tabular-nums leading-none ${
                    vide ? 'text-meta/50' : 'text-encre'
                  }`}
                >
                  {vide ? '—' : formaterCompact(m.totalSorties, devise)}
                </span>

                <BarreProgression valeur={part} hauteur="h-1.5" />

                <span className="flex items-center justify-between gap-2 text-[10.5px] font-semibold">
                  <span className="text-meta">
                    {m.totalReportEntrant > 0
                      ? `+${formaterCompact(m.totalReportEntrant)} reporté`
                      : 'aucun report'}
                  </span>
                  <span className={depasse ? 'text-alerte-deep' : 'text-succes-deep'}>
                    {formaterCompact(m.totalReste)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <Modale
        ouverte={detail !== null}
        titre={detail ? libelleMois(detail.cle) : ''}
        sousTitre={detail?.clos ? 'Mois clos — son reste passe au suivant' : 'Mois ouvert'}
        onFermer={() => setDetailCle(null)}
      >
        {detail ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { l: 'Report entrant', v: detail.totalReportEntrant, a: 'text-ciel-deep' },
                { l: 'Revenu', v: detail.revenu, a: 'text-encre' },
                { l: 'Dépensé', v: detail.totalSorties, a: 'text-encre' },
                {
                  l: 'Reste',
                  v: detail.totalReste,
                  a: detail.totalReste >= 0 ? 'text-succes-deep' : 'text-alerte-deep',
                },
              ].map((c) => (
                <div key={c.l}>
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                    {c.l}
                  </p>
                  <p className={`mt-0.5 text-[17px] font-bold tabular-nums leading-tight ${c.a}`}>
                    {formaterDevise(c.v, devise, 0)}
                  </p>
                </div>
              ))}
            </div>

            <ul className="mt-4 flex flex-col divide-y divide-encre/[0.06] border-t border-encre/[0.06] pt-2">
              {CATEGORIES.map((c) => {
                const sorti =
                  detail.depense[c] + (c === 'maintenance' ? detail.chargesFixes : 0)
                return (
                  <li key={c} className="flex items-center justify-between gap-3 py-2">
                    <span className="inline-flex min-w-0 items-center gap-2 text-[12.5px] font-semibold text-encre">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${COULEURS_CATEGORIE[c].puce}`}
                      />
                      <span className="truncate">
                        {LIBELLES_CATEGORIE[c].titre}
                        {c === 'maintenance' && detail.chargesFixes > 0 ? (
                          <span className="ml-1.5 text-[10.5px] font-medium text-meta">
                            frais déclarés
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11.5px] tabular-nums text-meta">
                      {formaterDevise(sorti, devise, 0)} sur{' '}
                      {formaterDevise(detail.budget[c], devise, 0)}
                    </span>
                  </li>
                )
              })}
            </ul>

            {/* on lit et on corrige au même endroit : pas de va-et-vient entre vues */}
            <div className="mt-5 border-t border-encre/[0.06] pt-4">
              <ChampsMois cle={detail.cle} />
            </div>

            <button
              type="button"
              onClick={() => {
                onOuvrirMois(detail.cle)
                setDetailCle(null)
              }}
              className="mt-5 w-full rounded-pilule bg-encre py-3 text-[13.5px] font-bold text-white transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
            >
              Ouvrir {libelleMois(detail.cle).toLowerCase()} en détail
            </button>
          </>
        ) : null}
      </Modale>
    </>
  )
}
