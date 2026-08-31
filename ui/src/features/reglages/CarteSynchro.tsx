import { Cloud, CloudOff, LogOut, RefreshCw } from 'lucide-react'
import { useSynchro } from '../../state/synchro'
import { EnteteSection } from '../../components/EnteteSection'
import { BOUTON_VIDE, Panne } from '../../components/Boutons'
import { ChoixCopie, FormulaireConnexion } from '../../components/Synchro'
import { dateLisible } from '../../lib/synchro'

/**
 * Le seul endroit qui parle de synchronisation une fois l'application ouverte.
 * Sans base configurée, la carte le dit et ne propose rien : l'application
 * reste alors ce qu'elle était, un site sans compte ni serveur.
 */
export function CarteSynchro() {
  const { disponible, etat, message, courriel, derniereSynchro, deconnecter, synchroniser } =
    useSynchro()

  const occupe = etat === 'occupe'
  const connecte = Boolean(courriel)

  return (
    <section className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]">
      <EnteteSection
        icone={disponible ? Cloud : CloudOff}
        titre="Vos appareils"
        sousTitre={disponible ? 'Les mêmes chiffres partout' : 'Synchronisation désactivée'}
      />

      {!disponible ? (
        <p className="text-[12.5px] leading-relaxed text-meta">
          Aucune base n’est reliée à cette installation. Vos chiffres restent dans ce navigateur,
          sur cet appareil, et n’en sortent pas. Pour les retrouver sur téléphone, il faut fournir
          l’adresse et la clé publique d’un projet Supabase au moment de la construction du site.
        </p>
      ) : null}

      {disponible && !connecte && etat !== 'conflit' ? (
        <FormulaireConnexion intro="Donnez votre adresse : vous recevrez un lien qui vous connecte, sans mot de passe à retenir. Vos chiffres seront alors les mêmes sur l’ordinateur et sur le téléphone." />
      ) : null}

      {connecte && etat !== 'conflit' ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl bg-papier-100 p-4">
            <p className="text-[12.5px] font-semibold text-encre">{courriel}</p>
            <p className="mt-1 text-[11.5px] text-meta">
              Dernier échange : {dateLisible(derniereSynchro)}
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-meta">
              Ce que vous saisissez part tout seul quelques secondes après votre dernière frappe.
              Sans réseau, tout continue de fonctionner et repart au retour.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void synchroniser()}
              className={BOUTON_VIDE}
              disabled={occupe}
            >
              <RefreshCw size={13} />
              {occupe ? 'En cours…' : 'Synchroniser maintenant'}
            </button>
            <button type="button" onClick={() => void deconnecter()} className={BOUTON_VIDE}>
              <LogOut size={13} />
              Se déconnecter
            </button>
          </div>
          <p className="text-[11.5px] leading-relaxed text-meta">
            Se déconnecter n’efface rien sur cet appareil : vos chiffres restent affichés, ils
            cessent seulement de partir.
          </p>
        </div>
      ) : null}

      {etat === 'conflit' ? <ChoixCopie /> : null}

      {etat === 'erreur' && message && connecte ? (
        <div className="mt-3">
          <Panne texte={message} />
        </div>
      ) : null}
    </section>
  )
}
