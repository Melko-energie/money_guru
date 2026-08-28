import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Fenêtre centrée, posée sur un fond assombri.
 * Sur téléphone elle s'ancre en bas et prend toute la largeur, comme une
 * feuille — même composant, deux ancrages, pas de dédoublement du contenu.
 */
export function Modale({
  ouverte,
  titre,
  sousTitre,
  onFermer,
  children,
}: {
  ouverte: boolean
  titre: string
  sousTitre?: string
  onFermer: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!ouverte) return
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [ouverte, onFermer])

  return (
    <AnimatePresence>
      {ouverte ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onFermer}
            className="absolute inset-0 bg-encre/45 backdrop-blur-[3px]"
          >
            <span className="sr-only">Fermer</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={titre}
            className="defilement-doux relative max-h-[86vh] w-full overflow-y-auto rounded-t-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_30px_80px_-30px_rgba(39,40,42,0.6)] backdrop-blur-2xl sm:max-w-[560px] sm:rounded-carte"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[18px] font-bold leading-tight text-encre">{titre}</h2>
                {sousTitre ? (
                  <p className="mt-0.5 text-[12px] leading-snug text-meta">{sousTitre}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onFermer}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-papier-100 text-encre/60 transition-colors hover:text-encre active:scale-95"
              >
                <X size={17} />
                <span className="sr-only">Fermer</span>
              </button>
            </div>

            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
