/// <reference types="vite/client" />

/**
 * Les deux seules variables d'environnement du client.
 * Absentes, l'application reste strictement locale : aucun compte, aucun envoi.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
