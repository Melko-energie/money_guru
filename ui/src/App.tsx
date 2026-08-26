import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RailLateral } from './components/RailLateral'
import { RailJalons } from './components/RailJalons'
import { BarreSuperieure } from './components/BarreSuperieure'
import { PageTableau } from './features/tableau/PageTableau'
import { PageMethodes } from './features/methodes/PageMethodes'
import { PageCalendrier } from './features/calendrier/PageCalendrier'
import { PageSimulateur } from './features/simulateur/PageSimulateur'
import { PagePatrimoine } from './features/patrimoine/PagePatrimoine'
import { PageReglages } from './features/reglages/PageReglages'
import { useAnimations } from './state/animations'
import { SIMULATION_PAR_DEFAUT } from './lib/donneesDemo'
import { transitionVue } from './lib/animations'
import type { ParametresSimulation, Vue } from './lib/types'

export default function App() {
  const { animations } = useAnimations()
  const [vue, setVue] = useState<Vue>('tableau')
  const [simulation, setSimulation] = useState<ParametresSimulation>(SIMULATION_PAR_DEFAUT)

  const majSimulation = useCallback((champs: Partial<ParametresSimulation>) => {
    setSimulation((p) => ({ ...p, ...champs }))
  }, [])

  const contenu = () => {
    switch (vue) {
      case 'tableau':
        return <PageTableau onNaviguer={setVue} />
      case 'methodes':
        return <PageMethodes onNaviguer={setVue} />
      case 'calendrier':
        return <PageCalendrier />
      case 'simulateur':
        return <PageSimulateur parametres={simulation} onChange={majSimulation} />
      case 'patrimoine':
        return <PagePatrimoine />
      case 'reglages':
        return <PageReglages />
    }
  }

  return (
    <div className="relative flex min-h-screen items-stretch justify-center overflow-hidden p-4 sm:p-7 lg:p-10">
      {/* blobs d'ambiance : ils dérivent derrière et transparaissent à travers les rails */}
      <div
        className={`pointer-events-none absolute -left-16 top-16 h-80 w-80 rounded-full bg-foret/20 blur-3xl ${
          animations ? 'animate-[deriver_18s_ease-in-out_infinite]' : ''
        }`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute -right-24 bottom-4 h-96 w-96 rounded-full bg-saphir/20 blur-3xl ${
          animations ? 'animate-[deriver_22s_ease-in-out_infinite_reverse]' : ''
        }`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-ambre/15 blur-3xl ${
          animations ? 'animate-[deriver_26s_ease-in-out_infinite]' : ''
        }`}
        aria-hidden
      />

      <div className="relative flex w-full max-w-[1560px] items-stretch">
        {/* RAIL GAUCHE : couche arrière translucide posée sur le fond */}
        <aside className="relative z-0 hidden shrink-0 items-stretch rounded-[40px] border border-white/50 bg-white/25 py-5 pl-3 pr-11 shadow-carte backdrop-blur-2xl sm:flex">
          <RailLateral vue={vue} onNaviguer={setVue} />
        </aside>

        {/* CARTE BLANCHE : couche avant, elle chevauche les deux rails */}
        <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden rounded-fenetre bg-white shadow-fenetre ring-1 ring-encre/5 sm:-ml-8 xl:-mr-8">
          <BarreSuperieure onNaviguer={setVue} />

          <main className="defilement-doux flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-7 pt-3 sm:px-9 lg:px-11">
            <AnimatePresence mode="wait">
              <motion.div key={vue} {...transitionVue} className="flex min-h-0 flex-1 flex-col">
                {contenu()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* RAIL DROIT : jalons et méthodes, même couche arrière en verre */}
        <aside className="relative z-0 hidden shrink-0 items-stretch rounded-[40px] border border-white/50 bg-white/25 py-5 pl-11 pr-3 shadow-carte backdrop-blur-2xl xl:flex">
          <RailJalons onMethode={() => setVue('methodes')} />
        </aside>
      </div>
    </div>
  )
}
