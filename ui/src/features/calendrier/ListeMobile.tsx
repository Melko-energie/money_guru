import { Flame, Plus, Receipt, Repeat, Target } from 'lucide-react'
import { estProjetee, libelleJour } from '../../lib/calendrier'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/definitions'
import { formaterDevise } from '../../lib/format'
import type { BilanMois, CodeDevise } from '../../lib/types'

/**
 * Vue téléphone du mois, reprise de la référence T4 : quatre actions rapides
 * en cercles, puis les dépenses groupées par jour avec le total du jour à
 * droite. Remplace la grille sept colonnes, illisible au doigt.
 */
export function ListeMobile({
  bilan,
  devise,
  jourSelectionne,
  onSelectionner,
}: {
  bilan: BilanMois
  devise: CodeDevise
  jourSelectionne: string | null
  onSelectionner: (cle: string) => void
}) {
  const joursRemplis = bilan.jours.filter((j) => j.dansLeMois && j.lignes.length > 0).reverse()
  const jourLePlusLourd = bilan.joursCouteux[0]
  const premiereRecurrence = bilan.recurrences[0]

  const actions = [
    {
      cle: 'ajouter',
      icone: Plus,
      libelle: 'Ajouter',
      actif: true,
      action: () => onSelectionner(jourSelectionne ?? bilan.jours.find((j) => j.dansLeMois)!.cle),
    },
    {
      cle: 'lourd',
      icone: Flame,
      libelle: 'Jour lourd',
      actif: !!jourLePlusLourd,
      action: () => jourLePlusLourd && onSelectionner(jourLePlusLourd.cle),
    },
    {
      cle: 'recurrences',
      icone: Repeat,
      libelle: 'Récurrences',
      actif: !!premiereRecurrence,
      action: () => premiereRecurrence && onSelectionner(premiereRecurrence.date),
    },
    {
      cle: 'ecart',
      icone: Target,
      libelle: 'Écart',
      actif: !!bilan.ecarts.length,
      action: () => {
        const pire = [...bilan.ecarts].sort((a, b) => b.ecart - a.ecart)[0]
        const jour = joursRemplis.find((j) =>
          j.lignes.some((l) => l.categorie === pire?.categorie),
        )
        if (jour) onSelectionner(jour.cle)
      },
    },
  ]

  return (
    <div>
      <div className="mb-5 grid grid-cols-4 gap-2">
        {actions.map(({ cle, icone: Icone, libelle, actif, action }) => (
          <button
            key={cle}
            type="button"
            onClick={action}
            disabled={!actif}
            className="flex flex-col items-center gap-1.5 disabled:opacity-35"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-papier-100 text-encre/70 ring-1 ring-encre/[0.06] active:scale-95">
              <Icone size={19} strokeWidth={1.9} />
            </span>
            <span className="text-[11px] font-semibold text-meta">{libelle}</span>
          </button>
        ))}
      </div>

      {joursRemplis.length === 0 ? (
        <p className="rounded-2xl bg-papier-100 px-4 py-3 text-[12.5px] text-meta">
          Aucune dépense ce mois-ci. Choisissez un jour et ajoutez-en une plus bas.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {joursRemplis.map((jour) => (
            <section key={jour.cle}>
              <button
                type="button"
                onClick={() => onSelectionner(jour.cle)}
                aria-current={jourSelectionne === jour.cle ? 'true' : undefined}
                className="mb-2 flex w-full items-center gap-3 text-left"
              >
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-bold ${
                    jourSelectionne === jour.cle ? 'text-encre' : 'text-meta'
                  }`}
                >
                  {jour.eleve ? <Flame size={12} className="text-alerte" /> : null}
                  {libelleJour(jour.cle)}
                </span>
                <span className="h-px flex-1 border-b border-dashed border-encre/15" aria-hidden />
                <span className="shrink-0 text-[12.5px] font-bold tabular-nums text-encre">
                  −{formaterDevise(jour.total, devise, 0)}
                </span>
              </button>

              <ul className="flex flex-col gap-2">
                {jour.lignes.map((ligne) => {
                  const projetee = estProjetee(ligne)
                  const couleurs = COULEURS_CATEGORIE[ligne.categorie]
                  return (
                    <li key={ligne.id}>
                      <button
                        type="button"
                        onClick={() => onSelectionner(jour.cle)}
                        className="flex w-full items-center gap-3 rounded-2xl px-1 py-1.5 text-left active:bg-papier-100"
                      >
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
                          style={{
                            background: `linear-gradient(140deg, ${couleurs.degrade[0]}, ${couleurs.degrade[1]})`,
                          }}
                        >
                          {projetee ? <Repeat size={15} /> : <Receipt size={15} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-encre">
                            {ligne.libelle}
                          </span>
                          <span className="block truncate text-[11.5px] text-meta">
                            {LIBELLES_CATEGORIE[ligne.categorie].titre}
                            {projetee ? ' · prévue' : ''}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 text-[13.5px] font-bold tabular-nums ${
                            projetee ? 'text-meta' : 'text-encre'
                          }`}
                        >
                          {formaterDevise(ligne.montant, devise, 0)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
