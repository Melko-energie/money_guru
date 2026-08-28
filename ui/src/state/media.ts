import { useEffect, useState } from 'react'

/** Sous cette largeur, on sert la mise en page téléphone (borne `sm` de Tailwind). */
const REQUETE_MOBILE = '(max-width: 639px)'

/**
 * Vrai quand on est au format téléphone.
 *
 * On teste la largeur en JavaScript plutôt qu'avec `sm:hidden` : masquer en CSS
 * laisserait les deux mises en page dans le DOM, donc chaque dépense et chaque
 * montant en double. Ici, une seule est montée à la fois.
 */
export function useEstMobile(): boolean {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(REQUETE_MOBILE).matches
  })

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia(REQUETE_MOBILE)
    const suivre = () => setMobile(mq.matches)
    suivre()
    // deux signaux : tous les environnements n'émettent pas `change` sur un
    // redimensionnement — sans le second, la mise en page reste sur l'ancienne borne
    mq.addEventListener('change', suivre)
    window.addEventListener('resize', suivre)
    return () => {
      mq.removeEventListener('change', suivre)
      window.removeEventListener('resize', suivre)
    }
  }, [])

  return mobile
}
