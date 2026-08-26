import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { FournisseurAnimations } from './state/animations'
import { FournisseurFinances } from './state/finances'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './styles/index.css'

const racine = document.getElementById('racine')
if (!racine) throw new Error('Élément racine introuvable')

createRoot(racine).render(
  <StrictMode>
    <FournisseurAnimations>
      <FournisseurFinances>
        <App />
      </FournisseurFinances>
    </FournisseurAnimations>
  </StrictMode>,
)
