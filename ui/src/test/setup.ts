import { beforeEach } from 'vitest'
import '@testing-library/jest-dom'

// framer-motion et les blobs s'appuient sur matchMedia, absent de jsdom.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

// la navigation vit dans l'ancre : sans remise à zéro, un test hériterait
// de la vue ouverte par le précédent
beforeEach(() => {
  window.location.hash = ''
})
