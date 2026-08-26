import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import App from '../App'
import { FournisseurAnimations } from '../state/animations'
import { FournisseurFinances } from '../state/finances'

function monter() {
  return render(
    <FournisseurAnimations>
      <FournisseurFinances>
        <App />
      </FournisseurFinances>
    </FournisseurAnimations>,
  )
}

/**
 * Garde-fou sur le point qui casse le plus vite : le rail doit rester une couche
 * ARRIÈRE translucide posée sur le fond, jamais un bloc placé dans la carte blanche.
 */
describe('empilement de la fenêtre', () => {
  it('place les rails en couche arrière, hors de la carte blanche', () => {
    const { container } = monter()
    const rails = Array.from(container.querySelectorAll('aside'))
    expect(rails).toHaveLength(2)

    for (const rail of rails) {
      const classes = rail.className
      expect(classes).toContain('z-0')
      expect(classes).toContain('bg-white/25')
      expect(classes).toContain('backdrop-blur-2xl')
      // le rail n'est pas un descendant de la carte blanche
      expect(rail.closest('.rounded-fenetre')).toBeNull()
    }
  })

  it('met la carte blanche devant et la fait chevaucher les rails', () => {
    const { container } = monter()
    const carte = container.querySelector('.rounded-fenetre') as HTMLElement
    expect(carte).not.toBeNull()
    expect(carte.className).toContain('z-10')
    expect(carte.className).toContain('bg-white')
    expect(carte.className).toContain('sm:-ml-8')
    expect(carte.className).toContain('xl:-mr-8')

    // rail gauche, puis carte, puis rail droit : l'ordre du DOM porte le chevauchement
    const enfants = Array.from(carte.parentElement?.children ?? [])
    expect(enfants).toHaveLength(3)
    expect(enfants[0].tagName).toBe('ASIDE')
    expect(enfants[1]).toBe(carte)
    expect(enfants[2].tagName).toBe('ASIDE')
  })

  it('garde des marges généreuses autour de la fenêtre', () => {
    const { container } = monter()
    const fenetre = container.firstElementChild as HTMLElement
    expect(fenetre.className).toContain('p-4')
    expect(fenetre.className).toContain('sm:p-7')
    expect(fenetre.className).toContain('lg:p-10')
    expect(fenetre.querySelector('.max-w-\\[1560px\\]')).not.toBeNull()
  })

  it('laisse les blobs d’ambiance derrière tout le reste', () => {
    const { container } = monter()
    const blobs = container.querySelectorAll('[aria-hidden].blur-3xl.rounded-full')
    expect(blobs.length).toBeGreaterThanOrEqual(3)
    blobs.forEach((b) => expect(b.className).toContain('pointer-events-none'))
  })
})
