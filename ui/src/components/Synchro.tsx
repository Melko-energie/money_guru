import { useId, useState } from 'react'
import { MailCheck, Smartphone, TriangleAlert } from 'lucide-react'
import { useFinances } from '../state/finances'
import { useSynchro } from '../state/synchro'
import { apercu, dateLisible, type ApercuProfil } from '../lib/synchro'
import { formaterDevise } from '../lib/format'
import type { CodeDevise } from '../lib/types'

const BOUTON =
  'inline-flex items-center justify-center gap-1.5 rounded-pilule px-3.5 py-2 text-[12px] font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-40'
export const BOUTON_PLEIN = `${BOUTON} bg-encre text-white shadow-[0_14px_28px_-18px_rgba(39,40,42,0.9)]`
export const BOUTON_VIDE = `${BOUTON} border border-encre/[0.12] text-meta hover:border-encre/30 hover:text-encre`

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

export function Panne({ texte }: { texte: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-brique-tint/70 p-4">
      <TriangleAlert size={15} className="mt-0.5 shrink-0 text-brique-deep" />
      <p className="text-[12.5px] leading-relaxed text-brique-deep">{texte}</p>
    </div>
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
  const { disponible, etat, courriel } = useSynchro()
  const [ouvert, setOuvert] = useState(false)

  if (!disponible || courriel) return null

  if (etat === 'conflit') {
    return (
      <div className="rounded-carte border border-white/70 bg-white/85 p-5 shadow-carte backdrop-blur-2xl">
        <ChoixCopie />
      </div>
    )
  }

  if (!ouvert && etat !== 'lien-envoye') {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="mx-auto inline-flex items-center gap-2 rounded-pilule border border-encre/[0.12] bg-white/70 px-4 py-2.5 text-[12.5px] font-semibold text-meta backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-encre/30 hover:text-encre active:translate-y-0"
      >
        <Smartphone size={14} />
        J’ai déjà mes chiffres sur un autre appareil
      </button>
    )
  }

  return (
    <div className="rounded-carte border border-white/70 bg-white/85 p-5 shadow-carte backdrop-blur-2xl">
      <FormulaireConnexion intro="Connectez-vous avec l’adresse déjà utilisée : vos chiffres arriveront ici tels quels, et vous n’aurez aucune question à reprendre." />
    </div>
  )
}
