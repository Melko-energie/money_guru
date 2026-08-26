import type { Variants } from 'framer-motion'

export const conteneurCascade: Variants = {
  cache: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

export const elementApparition: Variants = {
  cache: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 220, damping: 24 },
  },
}

export const elementLateral: Variants = {
  cache: { opacity: 0, x: 18 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 200, damping: 26 },
  },
}

export const transitionVue = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
}

/** Soulèvement doux au survol, partagé par toutes les cartes cliquables. */
export const survolCarte = {
  whileHover: { y: -4, transition: { type: 'spring' as const, stiffness: 300, damping: 22 } },
  whileTap: { scale: 0.985 },
}
