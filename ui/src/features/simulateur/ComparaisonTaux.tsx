import { useMemo } from 'react'
import { simuler } from '../../lib/calculs'
import { formaterCompact, formaterDevise } from '../../lib/format'
import type { CodeDevise, ParametresSimulation } from '../../lib/types'

const TAUX_COMPARES = [3, 5, 7, 10]
const TEINTES = ['#9AA6AD', '#6FA86D', '#1B5F8C', '#C77A21']

/** Montre côte à côte ce que change le taux, toutes choses égales par ailleurs. */
export function ComparaisonTaux({
  parametres,
  devise,
}: {
  parametres: ParametresSimulation
  devise: CodeDevise
}) {
  const lignes = useMemo(() => {
    const resultats = TAUX_COMPARES.map((taux, i) => ({
      taux,
      teinte: TEINTES[i],
      resultat: simuler({ ...parametres, tauxAnnuel: taux }, 'an'),
    }))
    const max = Math.max(1, ...resultats.map((r) => r.resultat.capitalFinal))
    return resultats.map((r) => ({ ...r, ratio: r.resultat.capitalFinal / max }))
  }, [parametres])

  return (
    <div className="flex flex-col gap-3">
      {lignes.map(({ taux, teinte, resultat, ratio }) => {
        const actif = taux === Math.round(parametres.tauxAnnuel)
        return (
          <div
            key={taux}
            className={`rounded-2xl p-3 transition-colors duration-300 ${actif ? 'bg-papier-100' : ''}`}
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-bold text-encre">
                {taux} % par an
                {actif ? (
                  <span className="ml-2 rounded-pilule bg-encre px-2 py-0.5 text-[10px] font-bold text-white">
                    votre hypothèse
                  </span>
                ) : null}
              </span>
              <span className="text-[13px] font-bold tabular-nums text-encre">
                {formaterCompact(resultat.capitalFinal, devise)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-pilule bg-encre/[0.07]">
              <div
                className="h-full rounded-pilule transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(4, ratio * 100)}%`, background: teinte }}
              />
            </div>
            <p className="mt-1.5 text-[11.5px] font-semibold text-meta">
              dont {formaterDevise(resultat.gainBrut, devise, 0)} de gain brut
            </p>
          </div>
        )
      })}
    </div>
  )
}
