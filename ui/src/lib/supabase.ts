import type { SupabaseClient } from '@supabase/supabase-js'

const ADRESSE = import.meta.env.VITE_SUPABASE_URL
const CLE = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Sans adresse ni clé, l'application reste ce qu'elle a toujours été :
 * un site sans serveur, dont les chiffres ne quittent pas le navigateur.
 * La synchronisation ne s'allume que si les deux variables sont fournies.
 */
export const synchroDisponible = Boolean(ADRESSE && CLE)

/** La table qui garde une copie du profil, une ligne par personne. */
export const TABLE_PROFILS = 'profils'

let instance: SupabaseClient | null = null

/**
 * Le client, chargé à la demande.
 * L'import est dynamique pour que la bibliothèque ne pèse dans le
 * téléchargement que si la synchronisation est réellement configurée.
 */
export async function supabase(): Promise<SupabaseClient | null> {
  if (!ADRESSE || !CLE) return null
  if (!instance) {
    const { createClient } = await import('@supabase/supabase-js')
    instance = createClient(ADRESSE, CLE, {
      auth: {
        // PKCE renvoie le code dans la requête (`?code=`), jamais dans l'ancre.
        // L'application navigue par ancre : le flux implicite écraserait
        // `#/mois/suivi` par un jeton.
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return instance
}

/** L'adresse où le lien magique ramène : la page, sans son ancre. */
export function adresseRetour(): string {
  return `${window.location.origin}${window.location.pathname}`
}
