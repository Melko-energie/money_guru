import { useState } from 'react'
import { ChevronRight, Coins, HandCoins, Home, Landmark, PiggyBank, Target } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { CompteurPourcent, Curseur } from '../../components/Champs'
import { FeuilleGlissante } from '../../components/FeuilleGlissante'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/definitions'
import { CATEGORIES } from '../../lib/calculs'
import { formaterDevise, formaterPourcent } from '../../lib/format'
import type { Categorie } from '../../lib/types'

const ICONES: Record<Categorie, typeof Home> = {
  maintenance: Home,
  urgence: PiggyBank,
  dettes: HandCoins,
  investissement: Landmark,
  objectifs: Target,
  fun: Coins,
}

/**
 * Version téléphone des six postes : une liste, et le réglage dans une
 * feuille qui monte du bas.
 *
 * Le carrousel du bureau ne marche pas au doigt — faire glisser un curseur
 * horizontal dans une piste qui défile horizontalement, c'est le même geste
 * pour deux actions. Dans la feuille, le curseur est seul et pleine largeur.
 */
export function ListePostes() {
  const { profil, montants, frais, definirAllocation } = useFinances()
  const [ouvert, setOuvert] = useState<Categorie | null>(null)

  const libelles = ouvert ? LIBELLES_CATEGORIE[ouvert] : null

  return (
    <>
      <ul
        aria-label="Vos six postes"
        className="flex flex-col divide-y divide-encre/[0.07] overflow-hidden rounded-carte bg-white shadow-carte ring-1 ring-encre/[0.05]"
      >
        {CATEGORIES.map((categorie) => {
          const Icone = ICONES[categorie]
          const couleurs = COULEURS_CATEGORIE[categorie]
          const libelle = LIBELLES_CATEGORIE[categorie]
          return (
            <li key={categorie}>
              <button
                type="button"
                onClick={() => setOuvert(categorie)}
                className="flex w-full items-center gap-3 p-3.5 text-left active:bg-papier-100"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white"
                  style={{
                    background: `linear-gradient(140deg, ${couleurs.degrade[0]}, ${couleurs.degrade[1]})`,
                  }}
                >
                  <Icone size={19} strokeWidth={1.9} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-encre">
                    {libelle.titre}
                  </span>
                  <span className="block truncate text-[12px] text-meta">
                    {formaterPourcent(profil.allocation[categorie])} ·{' '}
                    {formaterDevise(montants[categorie], profil.devise, 0)} / mois
                  </span>
                </span>

                <ChevronRight size={18} className="shrink-0 text-meta" />
              </button>
            </li>
          )
        })}
      </ul>

      <FeuilleGlissante
        ouverte={ouvert !== null}
        titre={libelles?.titre ?? ''}
        sousTitre={libelles?.role}
        onFermer={() => setOuvert(null)}
      >
        {ouvert ? (
          <>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
                  Part du revenu
                </p>
                <p className="text-[34px] font-bold leading-none tabular-nums text-encre">
                  {formaterPourcent(profil.allocation[ouvert])}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
                  Soit chaque mois
                </p>
                <p className="text-[20px] font-bold leading-none tabular-nums text-encre">
                  {formaterDevise(montants[ouvert], profil.devise, 0)}
                </p>
              </div>
            </div>

            <Curseur
              valeur={profil.allocation[ouvert]}
              min={0}
              max={100}
              libelle={`Part allouée à ${libelles?.titre ?? ''}`}
              couleur={COULEURS_CATEGORIE[ouvert].trait}
              onChange={(v) => definirAllocation(ouvert, v)}
            />

            {/* au doigt, le curseur ne vise pas au point près : le compteur, si */}
            <div className="mt-3 flex justify-center">
              <CompteurPourcent
                valeur={profil.allocation[ouvert]}
                libelle={libelles?.titre ?? ''}
                onChange={(v) => definirAllocation(ouvert, v)}
              />
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-meta">
              {ouvert === 'maintenance'
                ? `Votre coût réel saisi est de ${formaterDevise(frais, profil.devise, 0)}. Monter une part fait descendre les autres : la somme reste à 100 %.`
                : `Monter cette part fait descendre les autres : la somme reste à 100 %. ${libelles?.exemples ?? ''}`}
            </p>

            <button
              type="button"
              onClick={() => setOuvert(null)}
              className="mt-5 w-full rounded-pilule bg-encre py-3 text-[14px] font-bold text-white active:scale-[0.99]"
            >
              Terminé
            </button>
          </>
        ) : null}
      </FeuilleGlissante>
    </>
  )
}
