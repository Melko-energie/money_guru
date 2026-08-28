import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { CarteSituation } from './CarteSituation'
import { CarteMarge } from './CarteMarge'
import { CartesRepartition } from './CartesRepartition'
import { BandeauFondsUrgence } from './BandeauFondsUrgence'
import { BandeauDette } from './BandeauDette'
import { CarteMois } from './CarteMois'
import { PanneauStatistiques } from './PanneauStatistiques'
import { CarteProjection } from './CarteProjection'
import { EnteteSection } from '../../components/EnteteSection'
import { BandeauAlertes } from '../../components/BandeauAlertes'
import { ZonePedagogique } from '../../components/ZonePedagogique'
import { useFinances } from '../../state/finances'
import { conteneurCascade, elementApparition } from '../../lib/animations'
import type { Vue } from '../../lib/types'

/**
 * Grille du layout de référence : colonne étroite · colonne large · colonne
 * étroite, puis des rangées pleine largeur.
 *
 * Chaque donnée n'apparaît qu'une fois : la situation à gauche, la stratégie
 * au centre, la répartition à droite, puis la sécurité, la dette, le mois réel
 * et les garde-fous. Couvre le context §10 sans le répéter.
 */
export function PageTableau({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { listeAlertes, notes } = useFinances()

  return (
    <motion.div
      variants={conteneurCascade}
      initial="cache"
      animate="visible"
      className="flex flex-col gap-5 pb-2"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(280px,330px)]">
        {/* étroite gauche — où j'en suis ce mois-ci */}
        <div className="flex min-w-0 flex-col gap-5">
          <CarteSituation onNaviguer={onNaviguer} />
          <CarteMarge onNaviguer={onNaviguer} />
        </div>

        {/* large centre — ma stratégie et ce qu'elle produit */}
        <div className="flex min-w-0 flex-col gap-5">
          <motion.div variants={elementApparition}>
            <BandeauAlertes alertes={listeAlertes} />
          </motion.div>

          <CarteProjection onNaviguer={onNaviguer} />

          <section>
            <EnteteSection
              icone={Layers}
              titre="Vos six postes"
              sousTitre="Faites glisser pour changer une part"
              action="Tout ajuster dans mes chiffres"
              onAction={() => onNaviguer('reglages')}
            />
            <CartesRepartition />
          </section>
        </div>

        {/* étroite droite — la proportion, d'un coup d'œil */}
        <div className="flex min-w-0 flex-col gap-5">
          <PanneauStatistiques onNaviguer={onNaviguer} />
        </div>
      </div>

      {/* pleine largeur — sécurité et dette côte à côte */}
      <div className="grid gap-5 lg:grid-cols-2">
        <BandeauFondsUrgence onNaviguer={onNaviguer} />
        <BandeauDette onNaviguer={onNaviguer} />
      </div>

      <CarteMois onNaviguer={onNaviguer} />
      <ZonePedagogique notes={notes} />
    </motion.div>
  )
}
