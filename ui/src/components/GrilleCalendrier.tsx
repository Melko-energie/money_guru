import { motion } from 'framer-motion'
import { Flame, Repeat } from 'lucide-react'
import { JOURS_SEMAINE, estProjetee } from '../lib/calendrier'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../lib/definitions'
import { formaterCompact } from '../lib/format'
import { useAnimations } from '../state/animations'
import type { BilanMois, CodeDevise, JourCalendrier } from '../lib/types'

/** Les catégories présentes dans un jour, sans doublon, pour les pastilles de couleur. */
function teintesDuJour(jour: JourCalendrier): string[] {
  const vues = new Set<string>()
  const teintes: string[] = []
  for (const l of jour.lignes) {
    if (vues.has(l.categorie)) continue
    vues.add(l.categorie)
    teintes.push(COULEURS_CATEGORIE[l.categorie].trait)
  }
  return teintes.slice(0, 4)
}

/**
 * Grille mensuelle du context §7.5 : total par jour, pastilles de catégories,
 * marquage des jours anormalement élevés et des occurrences récurrentes à venir.
 */
export function GrilleCalendrier({
  bilan,
  devise,
  jourSelectionne,
  onSelectionner,
  aujourdhui,
}: {
  bilan: BilanMois
  devise: CodeDevise
  jourSelectionne: string | null
  onSelectionner: (cle: string) => void
  aujourdhui: string
}) {
  const { animations } = useAnimations()

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {JOURS_SEMAINE.map((j) => (
          <div
            key={j}
            className="pb-1 text-center text-[10.5px] font-bold uppercase tracking-wide text-meta"
          >
            {j}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {bilan.jours.map((jour, i) => {
          if (!jour.dansLeMois) {
            return <div key={jour.cle} className="min-h-[86px] rounded-2xl bg-papier/40" aria-hidden />
          }

          const selectionne = jourSelectionne === jour.cle
          const cejour = jour.cle === aujourdhui
          const aProjete = jour.lignes.some(estProjetee)
          const teintes = teintesDuJour(jour)

          return (
            <motion.button
              key={jour.cle}
              type="button"
              onClick={() => onSelectionner(jour.cle)}
              initial={animations ? { opacity: 0, scale: 0.96 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: Math.min(i, 20) * 0.008 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              aria-pressed={selectionne}
              aria-label={`${jour.jour} — ${jour.total > 0 ? `${Math.round(jour.total)} ${devise}` : 'aucune dépense'}${
                jour.eleve ? ', jour coûteux' : ''
              }`}
              className={`relative flex min-h-[86px] flex-col items-start gap-1 rounded-2xl border p-2 text-left transition-colors duration-300 ${
                selectionne
                  ? 'border-transparent bg-encre text-white shadow-[0_14px_30px_-14px_rgba(39, 40, 42,0.8)]'
                  : jour.eleve
                    ? 'border-brique/30 bg-brique-tint hover:border-brique/50'
                    : 'border-encre/[0.07] bg-papier/60 hover:border-encre/20 hover:bg-white'
              }`}
            >
              <span className="flex w-full items-center justify-between">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[12px] font-bold tabular-nums ${
                    cejour
                      ? selectionne
                        ? 'bg-white text-encre'
                        : 'bg-encre text-white'
                      : selectionne
                        ? 'text-white/70'
                        : 'text-meta'
                  }`}
                >
                  {jour.jour}
                </span>
                <span className="flex items-center gap-1">
                  {aProjete ? (
                    <Repeat
                      size={11}
                      className={selectionne ? 'text-white/60' : 'text-meta'}
                      aria-label="récurrence prévue"
                    />
                  ) : null}
                  {jour.eleve ? (
                    <Flame
                      size={11}
                      className={selectionne ? 'text-white' : 'text-brique'}
                      aria-label="jour coûteux"
                    />
                  ) : null}
                </span>
              </span>

              {jour.total > 0 ? (
                <span
                  className={`text-[13px] font-bold tabular-nums leading-none ${
                    selectionne ? 'text-white' : jour.eleve ? 'text-brique-deep' : 'text-encre'
                  }`}
                >
                  {formaterCompact(jour.total)}
                </span>
              ) : null}

              {jour.totalProjete > 0 ? (
                <span
                  className={`text-[10.5px] font-semibold leading-none ${
                    selectionne ? 'text-white/55' : 'text-meta'
                  }`}
                >
                  + {formaterCompact(jour.totalProjete)} prévu
                </span>
              ) : null}

              <span className="mt-auto flex flex-wrap gap-1">
                {teintes.map((t) => (
                  <span
                    key={t}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: t }}
                    aria-hidden
                  />
                ))}
              </span>
            </motion.button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] font-medium text-meta">
        <span className="inline-flex items-center gap-1.5">
          <Flame size={11} className="text-brique" />
          Jour au-delà du seuil du mois
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Repeat size={11} />
          Récurrence prévue, pas encore saisie
        </span>
        {Object.entries(LIBELLES_CATEGORIE).map(([cle, l]) => (
          <span key={cle} className="inline-flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: COULEURS_CATEGORIE[cle as keyof typeof COULEURS_CATEGORIE].trait }}
            />
            {l.titre}
          </span>
        ))}
      </div>
    </div>
  )
}
