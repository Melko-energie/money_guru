import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { EnteteSection } from './EnteteSection'
import { elementApparition } from '../lib/animations'

/**
 * La carte du layout de référence : le fond blanc, l'ombre, l'anneau, et
 * l'en-tête commun à toute l'application. Une section qui a déjà sa propre
 * mise en page peut se contenter de `EnteteSection`.
 */
export function Carte({
  icone,
  titre,
  sousTitre,
  controles,
  ouvrir,
  ouvrirLibelle,
  sombre = false,
  classe = '',
  children,
}: {
  icone?: LucideIcon
  titre: string
  sousTitre?: string
  controles?: ReactNode
  ouvrir?: () => void
  ouvrirLibelle?: string
  sombre?: boolean
  classe?: string
  children: ReactNode
}) {
  return (
    <motion.section
      variants={elementApparition}
      className={`relative flex flex-col overflow-hidden rounded-carte p-5 shadow-carte ${
        sombre ? 'bg-encre text-white' : 'bg-white ring-1 ring-encre/[0.05]'
      } ${classe}`}
    >
      <EnteteSection
        icone={icone}
        titre={titre}
        sousTitre={sousTitre}
        controles={controles}
        action={ouvrir ? (ouvrirLibelle ?? titre) : undefined}
        onAction={ouvrir}
        sombre={sombre}
      />
      {children}
    </motion.section>
  )
}
