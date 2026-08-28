import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RailLateral } from './components/RailLateral'
import { BarreBasse } from './components/BarreBasse'
import { FeuilleMenu } from './components/FeuilleMenu'
import { BarreSuperieure } from './components/BarreSuperieure'
import { EntetePage } from './components/EntetePage'
import { SousNavigation } from './components/SousNavigation'
import { PageTableau } from './features/tableau/PageTableau'
import { PageMethodes } from './features/methodes/PageMethodes'
import { PageObjectifs } from './features/objectifs/PageObjectifs'
import { PageCalendrier } from './features/calendrier/PageCalendrier'
import { PageSuivi } from './features/suivi/PageSuivi'
import { PageSimulateur } from './features/simulateur/PageSimulateur'
import { PagePatrimoine } from './features/patrimoine/PagePatrimoine'
import { PageReglages } from './features/reglages/PageReglages'
import { PageOnboarding } from './features/onboarding/PageOnboarding'
import { useFinances } from './state/finances'
import { useAnimations } from './state/animations'
import { useNavigation } from './state/navigation'
import { SIMULATION_PAR_DEFAUT } from './lib/definitions'
import { transitionVue } from './lib/animations'
import type { ParametresSimulation, Vue } from './lib/types'

export default function App() {
  const { animations } = useAnimations()
  const { profil, montants } = useFinances()
  const { vue, naviguer: allerA } = useNavigation()
  const [menuOuvert, setMenuOuvert] = useState(false)

  // naviguer ferme toujours la feuille mobile : on arrive sur la vue, pas sur le menu
  const naviguer = useCallback(
    (v: Vue) => {
      allerA(v)
      setMenuOuvert(false)
    },
    [allerA],
  )
  // le simulateur s'ouvre sur ce que l'utilisateur alloue vraiment au capital,
  // jamais sur un versement inventé
  const [simulation, setSimulation] = useState<ParametresSimulation>(() => ({
    ...SIMULATION_PAR_DEFAUT,
    montantInitial: Math.round(profil.patrimoine.investi),
    versementMensuel: Math.round(montants.investissement),
    tauxAnnuel: profil.tauxRendementAnnuel,
  }))

  const majSimulation = useCallback((champs: Partial<ParametresSimulation>) => {
    setSimulation((p) => ({ ...p, ...champs }))
  }, [])

  const contenu = () => {
    switch (vue) {
      case 'tableau':
        return <PageTableau onNaviguer={naviguer} />
      case 'methodes':
        return <PageMethodes onNaviguer={naviguer} />
      case 'objectifs':
        return <PageObjectifs onNaviguer={naviguer} />
      case 'calendrier':
        return <PageCalendrier />
      case 'suivi':
        return <PageSuivi onNaviguer={naviguer} />
      case 'simulateur':
        return <PageSimulateur parametres={simulation} onChange={majSimulation} />
      case 'patrimoine':
        return <PagePatrimoine />
      case 'reglages':
        return <PageReglages />
    }
  }

  // tant que les questions n'ont pas de réponse, il n'y a rien à afficher
  if (!profil.onboarding.termine) return <PageOnboarding />

  return (
    <div className="relative min-h-screen overflow-x-clip p-4 pb-28 sm:p-7 sm:pb-7 lg:p-10">
      {/* halos d'ambiance : discrets, ils restent le témoin visible de la bascule d'animations */}
      <div
        className={`pointer-events-none absolute -left-16 top-16 h-80 w-80 rounded-full bg-olive/10 blur-3xl ${
          animations ? 'animate-[deriver_18s_ease-in-out_infinite]' : ''
        }`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute -right-24 bottom-4 h-96 w-96 rounded-full bg-ciel/15 blur-3xl ${
          animations ? 'animate-[deriver_22s_ease-in-out_infinite_reverse]' : ''
        }`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-glace/40 blur-3xl ${
          animations ? 'animate-[deriver_26s_ease-in-out_infinite]' : ''
        }`}
        aria-hidden
      />

      <div className="relative mx-auto flex w-full max-w-[1560px] flex-col gap-6">
        <BarreSuperieure vue={vue} onNaviguer={naviguer} />
        <EntetePage vue={vue} onNaviguer={naviguer} />
        <SousNavigation vue={vue} onNaviguer={naviguer} />

        <div className="flex items-start gap-4 sm:gap-5">
          <RailLateral vue={vue} onNaviguer={naviguer} />

          <main className="flex min-w-0 flex-1 flex-col">
            {/* animations coupées : on change de vue sèchement, sans transition */}
            {animations ? (
              <AnimatePresence mode="wait">
                <motion.div key={vue} {...transitionVue} className="flex min-w-0 flex-col">
                  {contenu()}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex min-w-0 flex-col">{contenu()}</div>
            )}
          </main>
        </div>
      </div>

      <BarreBasse
        vue={vue}
        menuOuvert={menuOuvert}
        onNaviguer={naviguer}
        onMenu={() => setMenuOuvert((o) => !o)}
      />
      <FeuilleMenu
        ouverte={menuOuvert}
        vue={vue}
        onNaviguer={naviguer}
        onFermer={() => setMenuOuvert(false)}
      />
    </div>
  )
}
