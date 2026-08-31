import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { FournisseurAnimations } from './state/animations'
import { FournisseurFinances } from './state/finances'
import { FournisseurSynchro } from './state/synchro'

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
        {/* la synchronisation lit et écrit le profil : elle vit sous lui */}
        <FournisseurSynchro>
          <App />
        </FournisseurSynchro>
      </FournisseurFinances>
    </FournisseurAnimations>
  </StrictMode>,
)
