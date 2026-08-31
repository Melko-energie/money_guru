import { useFinances } from '../../state/finances'
import { ChampMontant } from '../../components/Champs'
import { libelleMois } from '../../lib/calendrier'
import { fraisDuMois, moisFinancant, salairePercu } from '../../lib/suivi'

/**
 * Le salaire et les frais d'un mois, saisissables.
 *
 * Un même bloc partout où un mois s'affiche : suivi mensuel, détail du
 * calendrier annuel. Une vue qui montre les chiffres d'un mois doit permettre
 * de les corriger — sinon on lit à un endroit et on saisit à un autre.
 */
export function ChampsMois({ cle }: { cle: string }) {
  const { profil, definirRevenuPercu, definirFraisMois } = useFinances()

  const devise = profil.devise
  const decalage = profil.versementSalaire.financeMoisSuivant
  const moisSalaire = moisFinancant(profil, cle)
  const fiche = profil.mois[moisSalaire]
  const fraisPropres = profil.mois[cle]?.fraisMaintenance

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <ChampMontant
          libelle={
            decalage
              ? `Salaire touché en ${libelleMois(moisSalaire).toLowerCase()}`
              : 'Revenu réellement perçu ce mois'
          }
          valeur={salairePercu(profil, moisSalaire)}
          suffixe={devise}
          onChange={(v) => definirRevenuPercu(moisSalaire, v)}
          aide={
            decalage ? `C’est lui qui finance ${libelleMois(cle).toLowerCase()}.` : undefined
          }
        />
        {fiche?.revenuPercu != null ? (
          <button
            type="button"
            onClick={() => definirRevenuPercu(moisSalaire, null)}
            className="mt-1.5 text-[11.5px] font-semibold text-meta underline-offset-2 hover:text-encre hover:underline"
          >
            Revenir au revenu du profil
          </button>
        ) : null}
      </div>

      <div>
        <ChampMontant
          libelle="Frais de maintenance du mois"
          valeur={fraisDuMois(profil, cle)}
          suffixe={devise}
          onChange={(v) => definirFraisMois(cle, v)}
          aide={
            decalage
              ? `${libelleMois(cle)} — couverts par le salaire touché en ${libelleMois(moisSalaire).toLowerCase()}.`
              : fraisPropres == null
                ? `${libelleMois(cle)} — le total déclaré dans Mes chiffres, modifiable pour ce mois seul.`
                : `${libelleMois(cle)} — propre à ce mois : les autres gardent le total déclaré.`
          }
        />
        {fraisPropres != null ? (
          <button
            type="button"
            onClick={() => definirFraisMois(cle, null)}
            className="mt-1.5 text-[11.5px] font-semibold text-meta underline-offset-2 hover:text-encre hover:underline"
          >
            Revenir aux frais déclarés
          </button>
        ) : null}
      </div>
    </div>
  )
}
