import { useCallback, useEffect, useState } from 'react'
import { cheminDe, vueDepuisChemin } from '../lib/sections'
import type { Vue } from '../lib/types'

function vueCourante(): Vue {
  if (typeof window === 'undefined') return 'tableau'
  return vueDepuisChemin(window.location.hash) ?? 'tableau'
}

/**
 * Navigation adressable, sans dépendance : chaque vue a son ancre
 * (`#/mois/calendrier`). Le retour arrière du navigateur fonctionne, un
 * rechargement retombe sur la bonne vue, et un lien se partage.
 *
 * Une ancre plutôt qu'un chemin réel : l'application est servie en statique
 * derrière nginx, sans réécriture d'URL à configurer.
 */
export function useNavigation() {
  const [vue, setVue] = useState<Vue>(vueCourante)

  useEffect(() => {
    const suivre = () => setVue(vueCourante())
    window.addEventListener('hashchange', suivre)
    // première visite sans ancre : on inscrit celle de la vue par défaut
    if (!window.location.hash) window.location.replace(`#${cheminDe('tableau')}`)
    return () => window.removeEventListener('hashchange', suivre)
  }, [])

  const naviguer = useCallback((cible: Vue) => {
    const chemin = `#${cheminDe(cible)}`
    if (window.location.hash === chemin) {
      setVue(cible)
      return
    }
    window.location.hash = chemin
    // en test, `hashchange` peut ne pas être émis : on met à jour tout de suite
    setVue(cible)
  }, [])

  return { vue, naviguer }
}
