import { useId, useState } from 'react'
import { MailCheck, RefreshCw, Smartphone } from 'lucide-react'
import { useFinances } from '../state/finances'
import { useSynchro } from '../state/synchro'
import { apercu, dateLisible, type ApercuProfil } from '../lib/synchro'
import { formaterDevise } from '../lib/format'
import { BOUTON_PLEIN, BOUTON_VIDE, Panne } from './Boutons'
import { RestaurerCopie } from './Sauvegarde'
import type { CodeDevise } from '../lib/types'


/**
 * Demander le lien de connexion.
 * Le même bloc sert dans « Mes chiffres » et dans le questionnaire d'accueil :
 * un téléphone neuf n'a pas d'autre porte d'entrée.
 */
export function FormulaireConnexion({ intro }: { intro?: string }) {
  const { etat, message, envoyerLien } = useSynchro()
  const [saisie, setSaisie] = useState('')
  const id = useId()

  if (etat === 'lien-envoye') {
    return (
      <div className="rounded-2xl bg-foret-tint/60 p-4">
        <p className="text-[12.5px] font-semibold text-foret-deep">Lien envoyé à {message}</p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-meta">
          Ouvrez-le depuis cet appareil : c’est lui qui ouvre la session ici. Le lien ne sert
          qu’une fois et expire au bout d’une heure.
        </p>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (saisie.trim()) void envoyerLien(saisie)
      }}
    >
      {intro ? <p className="text-[12.5px] leading-relaxed text-meta">{intro}</p> : null}
      <div>
        <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-meta">
          Votre adresse e-mail
        </label>
        <input
          id={id}
          type="email"
          required
          autoComplete="email"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="vous@exemple.com"
          className="h-12 w-full rounded-2xl border border-encre/[0.09] bg-white px-4 text-[14px] font-semibold text-encre outline-none transition-all duration-300 focus:border-ciel focus:shadow-[0_16px_36px_-24px_rgba(116,181,213,0.85)]"
        />
      </div>
      <button type="submit" className={BOUTON_PLEIN} disabled={etat === 'occupe'}>
        <MailCheck size={13} />
        {etat === 'occupe' ? 'Envoi…' : 'Recevoir le lien'}
      </button>
      {etat === 'erreur' && message ? <Panne texte={message} /> : null}
    </form>
  )
}

/** Les chiffres qui permettent de reconnaître une copie sans l'ouvrir. */
function Resume({ vue, devise }: { vue: ApercuProfil; devise: CodeDevise }) {
  return (
    <ul className="mt-2 flex flex-col gap-1 text-[11.5px] text-meta">
      <li>Modifié le {dateLisible(vue.majLe)}</li>
      <li>
        Revenu {formaterDevise(vue.revenuNet, devise, 0)} · {vue.moisRenseignes} mois renseignés
      </li>
      <li>
        {vue.lignesJournal} dépenses saisies · {vue.objectifs} objectifs
      </li>
    </ul>
  )
}

/**
 * Le choix entre les deux copies, quand elles ont bougé toutes les deux.
 * Rien n'est décidé à la place de l'utilisateur : les chiffres des deux côtés
 * sont posés à plat, et c'est lui qui tranche.
 */
export function ChoixCopie() {
  const { profil } = useFinances()
  const { conflit, resoudre } = useSynchro()
  if (!conflit) return null

  return (
    <div className="flex flex-col gap-3">
      <Panne texte="Les deux copies ont changé chacune de leur côté depuis le dernier échange. Choisir l’une efface l’autre : regardez les chiffres avant de trancher." />
      <div className="rounded-2xl border border-encre/[0.09] p-4">
        <p className="text-[12.5px] font-bold text-encre">Cet appareil</p>
        <Resume vue={apercu(profil)} devise={profil.devise} />
        <button
          type="button"
          onClick={() => void resoudre('local')}
          className={`${BOUTON_PLEIN} mt-3 w-full`}
        >
          Garder cet appareil
        </button>
      </div>
      <div className="rounded-2xl border border-encre/[0.09] p-4">
        <p className="text-[12.5px] font-bold text-encre">L’autre appareil</p>
        <Resume vue={apercu(conflit)} devise={profil.devise} />
        <button
          type="button"
          onClick={() => void resoudre('distant')}
          className={`${BOUTON_VIDE} mt-3 w-full`}
        >
          Garder l’autre appareil
        </button>
      </div>
    </div>
  )
}

/**
 * La porte d'entrée du questionnaire d'accueil.
 * Sans elle, un téléphone neuf devrait répondre aux huit questions avant de
 * pouvoir se connecter — et sa copie fraîchement remplie entrerait alors en
 * conflit avec celle de l'ordinateur. Ici, elle arrive vierge et prend l'autre
 * sans rien demander.
 */
export function RecupererAilleurs() {
  const { disponible, etat, message, courriel, synchroniser, deconnecter } = useSynchro()
  const [ouvert, setOuvert] = useState(false)

  if (!disponible) return null

  const cadre = 'rounded-carte border border-white/70 bg-white/85 p-5 shadow-carte backdrop-blur-2xl'

  if (etat === 'conflit') {
    return (
      <div className={cadre}>
        <ChoixCopie />
      </div>
    )
  }

  /*
   * Connecté, mais toujours devant les questions : c'est que la base n'a
   * encore rien reçu. Sans ce bloc l'écran resterait muet, et on croirait
   * la connexion cassée alors qu'il manque seulement l'envoi depuis
   * l'appareil qui détient les chiffres.
   */
  if (courriel) {
    return (
      <div className={cadre}>
        <p className="text-[12.5px] font-semibold text-encre">Connecté · {courriel}</p>

        {etat === 'occupe' ? (
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-meta">
            Récupération de vos chiffres…
          </p>
        ) : etat === 'erreur' ? (
          <div className="mt-2">
            {/* une panne de base ne doit jamais passer pour une base vide :
                sans ce message, on cherche du côté du compte alors que le
                problème est ailleurs */}
            <Panne texte={message ?? 'La base a refusé la lecture.'} />
          </div>
        ) : (
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-meta">
            La base ne contient encore aucune copie sous cette adresse. Ouvrez l’application sur
            l’appareil qui a déjà vos chiffres et connectez-vous avec la même adresse : l’envoi
            part tout seul.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void synchroniser()}
            className={BOUTON_PLEIN}
            disabled={etat === 'occupe'}
          >
            <RefreshCw size={13} />
            {etat === 'occupe' ? 'En cours…' : 'Récupérer mes chiffres'}
          </button>
          <button type="button" onClick={() => void deconnecter()} className={BOUTON_VIDE}>
            Utiliser une autre adresse
          </button>
        </div>

        <div className="mt-4 border-t border-encre/[0.07] pt-4">
          <p className="mb-2 text-[11.5px] leading-relaxed text-meta">
            Vous avez un fichier de sauvegarde ? Il marche sans compte et sans réseau.
          </p>
          <RestaurerCopie />
        </div>
      </div>
    )
  }

  if (!ouvert && etat !== 'lien-envoye') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="inline-flex items-center gap-2 rounded-pilule border border-encre/[0.12] bg-white/70 px-4 py-2.5 text-[12.5px] font-semibold text-meta backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-encre/30 hover:text-encre active:translate-y-0"
        >
          <Smartphone size={14} />
          J’ai déjà mes chiffres sur un autre appareil
        </button>
        {/* le fichier ne dépend de rien : il reste la porte qui marche
            toujours, même sans compte et sans réseau */}
        <RestaurerCopie />
      </div>
    )
  }

  return (
    <div className={cadre}>
      <FormulaireConnexion intro="Connectez-vous avec l’adresse déjà utilisée : vos chiffres arriveront ici tels quels, et vous n’aurez aucune question à reprendre." />
    </div>
  )
}
