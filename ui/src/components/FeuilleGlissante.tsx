import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

/**
 * Feuille qui monte du bas, geste des références mobiles.
 * Elle sert à isoler un réglage : un curseur seul, pleine largeur, sans
 * concurrence avec le défilement de la page.
 */
export function FeuilleGlissante({
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
        <div className="fixed inset-0 z-50 flex items-end">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onFermer}
            className="absolute inset-0 bg-encre/40 backdrop-blur-[2px]"
          >
            <span className="sr-only">Fermer</span>
          </motion.button>

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={titre}
            className="relative w-full rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-[0_-20px_50px_-20px_rgba(39,40,42,0.5)]"
          >
            <span
              className="mx-auto mb-4 block h-1.5 w-11 rounded-pilule bg-encre/15"
              aria-hidden
            />

            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[17px] font-bold leading-tight text-encre">{titre}</h2>
                {sousTitre ? (
                  <p className="mt-0.5 text-[12px] leading-snug text-meta">{sousTitre}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onFermer}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-papier-100 text-encre/60 active:scale-95"
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
