import { TriangleAlert } from 'lucide-react'

/**
 * Les deux boutons et le bandeau d'erreur partagés par la synchronisation et
 * la sauvegarde. Ils vivent à part pour que ces deux modules puissent
 * s'appeler l'un l'autre sans se tourner autour.
 */
const BOUTON =
  'inline-flex items-center justify-center gap-1.5 rounded-pilule px-3.5 py-2 text-[12px] font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-40'

export const BOUTON_PLEIN = `${BOUTON} bg-encre text-white shadow-[0_14px_28px_-18px_rgba(39,40,42,0.9)]`
export const BOUTON_VIDE = `${BOUTON} border border-encre/[0.12] text-meta hover:border-encre/30 hover:text-encre`

/** Ce qui a échoué, dit en clair plutôt que caché. */
export function Panne({ texte }: { texte: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-brique-tint/70 p-4">
      <TriangleAlert size={15} className="mt-0.5 shrink-0 text-brique-deep" />
      <p className="text-[12.5px] leading-relaxed text-brique-deep">{texte}</p>
    </div>
  )
}
