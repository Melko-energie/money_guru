import { Fragment } from 'react'
import { SECTIONS } from '../lib/sections'
import type { Vue } from '../lib/types'

/**
 * Rail d'icônes flottant : l'accès direct à chaque vue, groupé par section.
 * La barre du haut porte les sections, le rail porte les raccourcis — deux
 * chemins assumés vers la même vue.
 *
 * Rien d'autre n'y a sa place : une icône sans libellé qui ne mène nulle part
 * est un bouton qu'on n'ose pas cliquer. Le réglage des animations vit dans
 * « Mes chiffres », avec son intitulé.
 */
export function RailLateral({ vue, onNaviguer }: { vue: Vue; onNaviguer: (v: Vue) => void }) {
  return (
    <aside
      className="sticky top-6 hidden shrink-0 flex-col items-center gap-2 rounded-[28px] bg-white px-2 py-3 shadow-carte ring-1 ring-encre/[0.05] sm:flex"
      aria-label="Accès rapide aux vues"
    >
      {SECTIONS.map((section, i) => (
        <Fragment key={section.cle}>
          {i > 0 ? <span className="my-1.5 h-px w-7 bg-encre/10" aria-hidden /> : null}
          {section.vues.map(({ vue: cible, titre, icone: Icone }) => (
            <button
              key={cible}
              type="button"
              onClick={() => onNaviguer(cible)}
              title={titre}
              aria-current={vue === cible ? 'page' : undefined}
              className={`grid h-11 w-11 place-items-center rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                vue === cible
                  ? 'bg-olive text-white shadow-[0_10px_22px_-10px_rgba(118,125,47,0.9)]'
                  : 'text-encre/45 hover:bg-papier-100 hover:text-encre'
              }`}
            >
              <Icone size={19} strokeWidth={1.9} />
              <span className="sr-only">{titre}</span>
            </button>
          ))}
        </Fragment>
      ))}
    </aside>
  )
}
