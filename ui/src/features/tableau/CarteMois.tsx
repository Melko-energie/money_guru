import { CalendarDays, Flame, Receipt, Repeat } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { Carte } from '../../components/Carte'
import { BarreProgression } from '../../components/BarreProgression'
import { estProjetee, libelleJour, libelleMois } from '../../lib/calendrier'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/definitions'
import { formaterDevise } from '../../lib/format'
import type { LigneJournal, Vue } from '../../lib/types'

const NB_LIGNES = 6

/**
 * Votre mois réel, en une seule carte : les trois chiffres qui comptent,
 * l'avancement contre le budget, ce qui creuse l'écart, et le journal.
 * Regroupe l'ancien bandeau calendrier et l'ancien tableau des dépenses,
 * qui répétaient les mêmes données (context §7.5, §10).
 */
export function CarteMois({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { profil, bilanMois, moisAffiche } = useFinances()

  const depassement = bilanMois.totalReel - bilanMois.totalPrevu
  const ratio = bilanMois.totalPrevu > 0 ? bilanMois.totalReel / bilanMois.totalPrevu : 0
  const pires = [...bilanMois.ecarts].sort((a, b) => b.ecart - a.ecart).slice(0, 3)

  const lignes: LigneJournal[] = bilanMois.jours
    .filter((j) => j.dansLeMois)
    .flatMap((j) => j.lignes)
    .sort((a, b) => b.date.localeCompare(a.date) || b.montant - a.montant)
    .slice(0, NB_LIGNES)

  const chiffres = [
    {
      libelle: 'Dépensé',
      valeur: formaterDevise(bilanMois.totalReel, profil.devise, 0),
      detail: `sur ${formaterDevise(bilanMois.totalPrevu, profil.devise, 0)} de budget`,
      accent: 'text-encre',
    },
    {
      libelle: 'Écart prévu / réel',
      valeur: `${depassement > 0 ? '+' : '−'}${formaterDevise(Math.abs(depassement), profil.devise, 0)}`,
      detail:
        bilanMois.totalProjete > 0
          ? `${formaterDevise(bilanMois.totalProjete, profil.devise, 0)} de récurrences à venir`
          : 'aucune récurrence en attente',
      accent: depassement > 0 ? 'text-alerte-deep' : 'text-succes-deep',
    },
    {
      libelle: 'Jour le plus lourd',
      valeur: bilanMois.joursCouteux[0]
        ? formaterDevise(bilanMois.joursCouteux[0].total, profil.devise, 0)
        : '—',
      detail: bilanMois.joursCouteux[0] ? libelleJour(bilanMois.joursCouteux[0].cle) : 'rien saisi',
      accent: 'text-encre',
    },
  ]

  return (
    <Carte
      icone={CalendarDays}
      titre="Votre mois réel"
      sousTitre={`${libelleMois(moisAffiche)}${
        bilanMois.recurrences.length ? ` · ${bilanMois.recurrences.length} récurrence(s)` : ''
      }`}
      ouvrir={() => onNaviguer('calendrier')}
      ouvrirLibelle="Ouvrir le calendrier des dépenses"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {chiffres.map((c) => (
          <div key={c.libelle}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
              {c.libelle}
            </p>
            <p className={`mt-0.5 text-[20px] font-bold tabular-nums leading-tight ${c.accent}`}>
              {c.valeur}
            </p>
            <p className="mt-0.5 text-[11.5px] text-meta">{c.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <BarreProgression
          valeur={Math.min(100, ratio * 100)}
          hauteur="h-4"
          degrade={
            depassement > 0
              ? 'from-alerte-soft via-alerte to-alerte-deep'
              : 'from-ardoise-soft via-ardoise to-ardoise-deep'
          }
          jalons={[{ position: 100, libelle: 'budget', atteint: ratio >= 1 }]}
        />
      </div>

      <div className="mt-4 grid gap-4 border-t border-encre/[0.06] pt-4 sm:grid-cols-2">
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
                    e.ecart > 0 ? 'text-alerte-deep' : 'text-meta'
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
                    {j.eleve ? <Flame size={11} className="shrink-0 text-alerte" /> : null}
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

      {lignes.length === 0 ? null : (
        <div className="defilement-doux -mx-1 mt-4 overflow-x-auto border-t border-encre/[0.06] px-1 pt-4">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Dépenses récentes du mois affiché</caption>
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-meta">
                <th scope="col" className="pb-2 pr-3 font-semibold">Libellé</th>
                <th scope="col" className="pb-2 pr-3 font-semibold">Date</th>
                <th scope="col" className="pb-2 pr-3 font-semibold">Statut</th>
                <th scope="col" className="pb-2 text-right font-semibold">Montant</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => {
                const projetee = estProjetee(l)
                const couleurs = COULEURS_CATEGORIE[l.categorie]
                return (
                  <tr
                    key={l.id}
                    className="border-t border-encre/[0.06] transition-colors duration-200 hover:bg-papier-100/60"
                  >
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white"
                          style={{
                            background: `linear-gradient(140deg, ${couleurs.degrade[0]}, ${couleurs.degrade[1]})`,
                          }}
                          title={LIBELLES_CATEGORIE[l.categorie].titre}
                        >
                          {projetee ? <Repeat size={13} /> : <Receipt size={13} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold text-encre">
                            {l.libelle}
                          </span>
                          <span className="block truncate text-[11px] text-meta">
                            {LIBELLES_CATEGORIE[l.categorie].titre}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-[12.5px] text-meta">{libelleJour(l.date)}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-pilule px-2.5 py-1 text-[11px] font-semibold ${
                          projetee ? 'bg-papier-100 text-meta' : 'bg-succes-tint text-succes-deep'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${projetee ? 'bg-meta' : 'bg-succes'}`}
                        />
                        {projetee ? 'Prévue' : 'Saisie'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-[13px] font-bold tabular-nums text-encre">
                      {formaterDevise(l.montant, profil.devise, 0)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Carte>
  )
}
