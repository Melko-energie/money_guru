import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { TABLE_PROFILS, adresseRetour, supabase, synchroDisponible } from '../lib/supabase'
import { arbitrer, horodatage, type EtatSynchro } from '../lib/synchro'
import { useFinances } from './finances'
import type { ProfilFinancier } from '../lib/types'

/** Repère de la dernière rencontre réussie entre les deux copies. */
const CLE_REPERE = 'money-guru:synchro:v1'

/** Délai d'inactivité avant l'envoi : on n'écrit pas à chaque frappe. */
const DELAI_ENVOI = 2500

type ValeurSynchro = {
  /** Faux si aucune base n'est configurée : l'application reste locale. */
  disponible: boolean
  etat: EtatSynchro
  /** Ce qu'il faut dire à l'utilisateur, en clair. */
  message: string | null
  courriel: string | null
  derniereSynchro: string | null
  /** La copie d'en face, quand il faut choisir entre les deux. */
  conflit: ProfilFinancier | null
  envoyerLien: (courriel: string) => Promise<void>
  deconnecter: () => Promise<void>
  synchroniser: () => Promise<void>
  resoudre: (garder: 'local' | 'distant') => Promise<void>
}

/**
 * Valeur par défaut : tout est éteint.
 * Les tests montent les vues sans ce fournisseur, et l'application doit
 * fonctionner sans base — dans les deux cas, rien ne doit casser.
 */
const INACTIF: ValeurSynchro = {
  disponible: false,
  etat: 'inactive',
  message: null,
  courriel: null,
  derniereSynchro: null,
  conflit: null,
  envoyerLien: async () => {},
  deconnecter: async () => {},
  synchroniser: async () => {},
  resoudre: async () => {},
}

const Ctx = createContext<ValeurSynchro>(INACTIF)

function lireRepere(): string | null {
  try {
    return window.localStorage.getItem(CLE_REPERE)
  } catch {
    return null
  }
}

function ecrireRepere(valeur: string | null) {
  try {
    if (valeur) window.localStorage.setItem(CLE_REPERE, valeur)
    else window.localStorage.removeItem(CLE_REPERE)
  } catch {
    /* stockage indisponible : on continue, la prochaine rencontre demandera */
  }
}

/** Traduit les pannes courantes en phrases lisibles. */
function expliquer(erreur: unknown): string {
  const texte = erreur instanceof Error ? erreur.message : String(erreur)
  if (/relation .* does not exist|Could not find the table/i.test(texte)) {
    return 'La table « profils » n’existe pas encore dans la base. Exécutez le script d’installation.'
  }
  if (/Failed to fetch|NetworkError/i.test(texte)) {
    return 'Pas de réseau. Vos chiffres restent enregistrés sur cet appareil.'
  }
  if (/rate limit|too many/i.test(texte)) {
    return 'Trop de demandes de lien d’affilée. Réessayez dans quelques minutes.'
  }
  return texte
}

export function FournisseurSynchro({ children }: { children: ReactNode }) {
  const { profil, remplacerProfil } = useFinances()

  const [session, setSession] = useState<Session | null>(null)
  const [etat, setEtat] = useState<EtatSynchro>(synchroDisponible ? 'deconnecte' : 'inactive')
  const [message, setMessage] = useState<string | null>(null)
  const [derniereSynchro, setDerniereSynchro] = useState<string | null>(lireRepere)
  const [conflit, setConflit] = useState<ProfilFinancier | null>(null)

  // le profil vu par les fonctions asynchrones : sans cette référence, une
  // requête lancée il y a deux secondes renverrait des chiffres périmés
  const profilRef = useRef(profil)
  profilRef.current = profil

  // la date déjà connue des deux côtés — elle empêche de renvoyer en boucle
  // ce qu'on vient tout juste de recevoir
  const accordeRef = useRef<string | null>(null)

  const marquerAccord = useCallback((date: string | null) => {
    accordeRef.current = date
    const repere = date ?? horodatage()
    setDerniereSynchro(repere)
    ecrireRepere(repere)
  }, [])

  /** Écrit la copie locale dans la base, et note qu'elle y est. */
  const pousser = useCallback(async () => {
    const sb = await supabase()
    if (!sb) return
    const utilisateur = (await sb.auth.getSession()).data.session?.user
    if (!utilisateur) return

    const local = profilRef.current
    const date = local.majLe ?? horodatage()
    // un profil d'avant la synchronisation n'a pas de date : on la lui pose
    // ici, sinon les deux copies resteraient incomparables
    if (!local.majLe) remplacerProfil({ ...local, majLe: date })

    setEtat('occupe')
    const { error } = await sb
      .from(TABLE_PROFILS)
      .upsert({ utilisateur: utilisateur.id, donnees: { ...local, majLe: date }, maj_le: date })
    if (error) {
      setEtat('erreur')
      setMessage(expliquer(error))
      return
    }
    marquerAccord(date)
    setEtat('a-jour')
    setMessage(null)
  }, [marquerAccord, remplacerProfil])

  /** Pose la copie distante sur cet appareil, telle quelle. */
  const recevoir = useCallback(
    (distant: ProfilFinancier) => {
      remplacerProfil(distant)
      marquerAccord(distant.majLe ?? null)
      setConflit(null)
      setEtat('a-jour')
      setMessage(null)
    },
    [marquerAccord, remplacerProfil],
  )

  /** Va chercher la copie distante et applique la décision de l'arbitre. */
  const synchroniser = useCallback(async () => {
    if (!synchroDisponible) return
    const sb = await supabase()
    if (!sb) return
    const utilisateur = (await sb.auth.getSession()).data.session?.user
    if (!utilisateur) {
      setEtat('deconnecte')
      return
    }

    setEtat('occupe')
    setMessage(null)
    const { data, error } = await sb
      .from(TABLE_PROFILS)
      .select('donnees')
      .eq('utilisateur', utilisateur.id)
      .maybeSingle()
    if (error) {
      setEtat('erreur')
      setMessage(expliquer(error))
      return
    }

    const distant = (data?.donnees as ProfilFinancier | undefined) ?? null
    switch (arbitrer(profilRef.current, distant, lireRepere())) {
      case 'rien':
        marquerAccord(distant?.majLe ?? null)
        setEtat('a-jour')
        break
      case 'envoyer':
        await pousser()
        break
      case 'recevoir':
        if (distant) recevoir(distant)
        break
      case 'conflit':
        setConflit(distant)
        setEtat('conflit')
        break
    }
  }, [marquerAccord, pousser, recevoir])

  /* Session : on la relit au chargement, puis on suit ses changements. */
  useEffect(() => {
    if (!synchroDisponible) return
    let vivant = true
    let arreter: (() => void) | undefined

    void (async () => {
      const sb = await supabase()
      if (!sb || !vivant) return
      const { data } = await sb.auth.getSession()
      if (!vivant) return
      setSession(data.session)
      const abonnement = sb.auth.onAuthStateChange((_evenement, suivante) => {
        setSession(suivante)
      })
      arreter = () => abonnement.data.subscription.unsubscribe()
    })()

    return () => {
      vivant = false
      arreter?.()
    }
  }, [])

  /* Une session qui s'ouvre déclenche tout de suite une rencontre. */
  useEffect(() => {
    if (!session) return
    void synchroniser()
    // volontairement lié à la seule identité : re-synchroniser à chaque
    // rafraîchissement de jeton n'apporterait rien
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  /* Envoi différé : on attend que la saisie se calme. */
  useEffect(() => {
    if (!session || etat === 'conflit' || etat === 'erreur') return
    if (!profil.majLe || profil.majLe === accordeRef.current) return
    const minuteur = setTimeout(() => void pousser(), DELAI_ENVOI)
    return () => clearTimeout(minuteur)
  }, [profil.majLe, session, etat, pousser])

  const envoyerLien = useCallback(async (courriel: string) => {
    const sb = await supabase()
    if (!sb) return
    setEtat('occupe')
    setMessage(null)
    const { error } = await sb.auth.signInWithOtp({
      email: courriel.trim(),
      options: { emailRedirectTo: adresseRetour() },
    })
    if (error) {
      setEtat('erreur')
      setMessage(expliquer(error))
      return
    }
    setEtat('lien-envoye')
    setMessage(courriel.trim())
  }, [])

  const deconnecter = useCallback(async () => {
    const sb = await supabase()
    if (!sb) return
    await sb.auth.signOut()
    accordeRef.current = null
    ecrireRepere(null)
    setDerniereSynchro(null)
    setConflit(null)
    setSession(null)
    setMessage(null)
    setEtat('deconnecte')
  }, [])

  const resoudre = useCallback(
    async (garder: 'local' | 'distant') => {
      if (garder === 'distant') {
        if (conflit) recevoir(conflit)
        return
      }
      // garder cet appareil : on redate la copie locale pour qu'elle l'emporte
      // franchement, sans laisser planer d'égalité
      remplacerProfil({ ...profilRef.current, majLe: horodatage() })
      setConflit(null)
      await pousser()
    },
    [conflit, pousser, recevoir, remplacerProfil],
  )

  const valeur = useMemo<ValeurSynchro>(
    () => ({
      disponible: synchroDisponible,
      etat,
      message,
      courriel: session?.user?.email ?? null,
      derniereSynchro,
      conflit,
      envoyerLien,
      deconnecter,
      synchroniser,
      resoudre,
    }),
    [
      etat,
      message,
      session,
      derniereSynchro,
      conflit,
      envoyerLien,
      deconnecter,
      synchroniser,
      resoudre,
    ],
  )

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>
}

/**
 * Sans fournisseur, renvoie l'état éteint plutôt que de lever une erreur :
 * la synchronisation est une option, pas une dépendance des vues.
 */
export function useSynchro(): ValeurSynchro {
  return useContext(Ctx)
}
