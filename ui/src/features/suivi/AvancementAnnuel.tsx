import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { Carte } from '../../components/Carte'
import { Chiffre } from '../../components/Chiffre'
import { cleMoisDe, decalerMois, libelleMoisCourt } from '../../lib/calendrier'
import { cumulAnnee } from '../../lib/suivi'
import { formaterDevise } from '../../lib/format'

/**
 * L'avancement de l'année, mois par mois, à côté du total.
 *
 * La règle est celle que l'utilisateur a demandée, sans détour :
 * salaire déjà accumulé + salaire du mois − frais de maintenance = avancement.
 *
 * Chaque salaire se saisit ici, y compris pour les mois à venir : un salaire
 * n'est pas le même d'un mois à l'autre, et une prime annoncée en septembre
 * doit peser sur septembre, pas se diluer dans une moyenne.
 */
export function AvancementAnnuel() {
  const {
    profil,
    frais,
    moisAffiche,
    anneeAffichee: annee,
    definirMoisAffiche,
    definirAnnee,
    definirRevenuPercu,
    definirFraisMois,
  } = useFinances()

  const lignes = useMemo(() => cumulAnnee(profil, annee), [profil, annee])
  const devise = profil.devise
  const moisCourant = cleMoisDe()
  const decalage = profil.versementSalaire.financeMoisSuivant
  const fraisDeclares = frais
  const bilan = lignes[lignes.length - 1]
  const comptes = lignes.filter((l) => l.renseigne).length

  return (
    <Carte
      icone={TrendingUp}
      titre={`Avancement ${annee}`}
      sousTitre="Salaire accumulé, maintenance déduite"
      controles={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => definirAnnee(annee - 1)}
            title="Année précédente"
            className="grid h-9 w-9 place-items-center rounded-full bg-papier-100 text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre"
          >
            <ChevronLeft size={16} />
            <span className="sr-only">Année précédente</span>
          </button>
          <span className="min-w-[52px] text-center text-[14px] font-bold tabular-nums text-encre">
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
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Chiffre
          libelle="Salaire cumulé"
          valeur={formaterDevise(bilan.cumulRevenu, devise, 0)}
          sens={`Sur ${comptes} mois comptés`}
        />
        <Chiffre
          libelle="Maintenance cumulée"
          valeur={formaterDevise(bilan.cumulMaintenance, devise, 0)}
          sens="Le coût de votre vie courante"
        />
        <Chiffre
          libelle="Avancement"
          valeur={formaterDevise(bilan.cumulNet, devise, 0)}
          sens="Ce que l’année vous a réellement laissé"
          accent={bilan.cumulNet >= 0 ? 'text-succes-deep' : 'text-alerte-deep'}
          taille="grand"
        />
      </div>

      <div className="defilement-doux mt-5 overflow-x-auto border-t border-encre/[0.06] pt-1">
        <table className="w-full min-w-[440px] border-collapse">
          <caption className="sr-only">
            Salaire, maintenance et avancement cumulé, mois par mois
          </caption>
          <thead>
            <tr className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
              <th scope="col" className="py-2 text-left font-semibold">
                Mois
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Salaire
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Maintenance
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Net du mois
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Cumulé
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-encre/[0.06]">
            {lignes.map((l) => {
              const saisi = profil.mois[l.cle]?.revenuPercu
              const actif = l.cle === moisAffiche
              return (
                <tr
                  key={l.cle}
                  className={`transition-colors duration-200 ${actif ? 'bg-olive-tint/50' : ''}`}
                >
                  <th scope="row" className="py-1.5 pr-2 text-left align-top">
                    <button
                      type="button"
                      onClick={() => definirMoisAffiche(l.cle)}
                      className="text-[12.5px] font-bold text-encre underline-offset-2 hover:underline"
                    >
                      {libelleMoisCourt(l.cle)}
                    </button>
                    {l.cle === moisCourant ? (
                      <span className="ml-1.5 text-[10px] font-semibold text-meta">en cours</span>
                    ) : null}
                    {decalage ? (
                      <span className="block text-[10px] font-medium leading-tight text-meta">
                        finance {libelleMoisCourt(decalerMois(l.cle, 1)).toLowerCase()}
                      </span>
                    ) : null}
                  </th>

                  <td className="py-1.5 text-right">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={saisi ?? ''}
                      placeholder={l.renseigne ? String(Math.round(l.revenu)) : '—'}
                      aria-label={`Salaire de ${libelleMoisCourt(l.cle)} ${annee}`}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        definirRevenuPercu(
                          l.cle,
                          e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                        )
                      }
                      className="h-8 w-24 rounded-xl border border-transparent bg-papier-100/70 px-2 text-right text-[12.5px] font-bold tabular-nums text-encre outline-none transition-colors duration-200 placeholder:font-semibold placeholder:text-meta/70 hover:border-encre/10 focus:border-ciel focus:bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </td>

                  <td className="py-1.5 text-right">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={profil.mois[l.cle]?.fraisMaintenance ?? ''}
                      placeholder={String(Math.round(l.renseigne ? l.maintenance : fraisDeclares))}
                      aria-label={`Frais de ${libelleMoisCourt(l.cle)} ${annee}`}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        definirFraisMois(
                          l.cle,
                          e.target.value === '' ? null : Math.max(0, Number(e.target.value)),
                        )
                      }
                      className="h-8 w-24 rounded-xl border border-transparent bg-papier-100/70 px-2 text-right text-[12.5px] font-semibold tabular-nums text-meta outline-none transition-colors duration-200 placeholder:text-meta/70 hover:border-encre/10 focus:border-ciel focus:bg-white focus:text-encre [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </td>
                  <td
                    className={`py-1.5 text-right text-[12.5px] font-semibold tabular-nums ${
                      !l.renseigne ? 'text-meta/50' : l.net >= 0 ? 'text-encre' : 'text-alerte-deep'
                    }`}
                  >
                    {l.renseigne ? formaterDevise(l.net, devise, 0) : '—'}
                  </td>
                  <td
                    className={`py-1.5 text-right text-[13px] font-bold tabular-nums ${
                      l.cumulNet >= 0 ? 'text-succes-deep' : 'text-alerte-deep'
                    }`}
                  >
                    {formaterDevise(l.cumulNet, devise, 0)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 border-t border-encre/[0.06] pt-3 text-[11.5px] leading-relaxed text-meta">
        Un mois compte dès qu’il est passé, ou dès que vous saisissez son salaire à l’avance. Les
        frais suivent le même principe : une case vide reprend le total déclaré dans Mes chiffres,
        une case remplie ne vaut que pour ce mois-là.
        {decalage
          ? ' Votre salaire finance le mois suivant : celui de janvier fait vivre février.'
          : null}
      </p>
    </Carte>
  )
}
