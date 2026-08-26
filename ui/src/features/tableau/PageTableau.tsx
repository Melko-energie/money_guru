import { motion } from 'framer-motion'
import { CarteSituation } from './CarteSituation'
import { CartesRepartition } from './CartesRepartition'
import { BandeauFondsUrgence } from './BandeauFondsUrgence'
import { BandeauDette } from './BandeauDette'
import { BandeauCalendrier } from './BandeauCalendrier'
import { ListeAllocations } from './ListeAllocations'
import { PanneauStatistiques } from './PanneauStatistiques'
import { CarteProjection } from './CarteProjection'
import { EnteteSection } from '../../components/EnteteSection'
import { BandeauAlertes } from '../../components/BandeauAlertes'
import { ZonePedagogique } from '../../components/ZonePedagogique'
import { useFinances } from '../../state/finances'
import { conteneurCascade, elementApparition, elementLateral } from '../../lib/animations'
import type { Vue } from '../../lib/types'

/**
 * Grille de la maquette conservée — colonne large + colonne étroite — et remplie
 * selon le context §10 : zone haute, stratégie, sécurité, dette, projection, pédagogie.
 */
export function PageTableau({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { listeAlertes, notes } = useFinances()

  return (
    <motion.div
      variants={conteneurCascade}
      initial="cache"
      animate="visible"
      className="grid gap-5 pb-2 xl:grid-cols-[minmax(0,1.62fr)_minmax(320px,1fr)]"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <CarteSituation onNaviguer={onNaviguer} />

        <motion.div variants={elementApparition}>
          <BandeauAlertes alertes={listeAlertes} />
        </motion.div>

        <section>
          <EnteteSection
            titre="Votre répartition"
            action="Tout ajuster"
            onAction={() => onNaviguer('reglages')}
          />
          <CartesRepartition />
        </section>

        <section>
          <EnteteSection
            titre="Votre sécurité"
            action="Détail"
            onAction={() => onNaviguer('reglages')}
          />
          <BandeauFondsUrgence onNaviguer={onNaviguer} />
        </section>

        <section>
          <EnteteSection
            titre="Vos dettes"
            action="Détail"
            onAction={() => onNaviguer('reglages')}
          />
          <BandeauDette onNaviguer={onNaviguer} />
        </section>

        <section>
          <EnteteSection
            titre="Votre mois réel"
            action="Ouvrir le calendrier"
            onAction={() => onNaviguer('calendrier')}
          />
          <BandeauCalendrier onNaviguer={onNaviguer} />
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <motion.section variants={elementLateral}>
          <EnteteSection
            titre="En un coup d’œil"
            action="Modifier"
            onAction={() => onNaviguer('reglages')}
          />
          <ListeAllocations onNaviguer={onNaviguer} />
        </motion.section>

        <PanneauStatistiques onNaviguer={onNaviguer} />
      </div>

      <div className="flex flex-col gap-5 xl:col-span-2">
        <CarteProjection onNaviguer={onNaviguer} />
        <ZonePedagogique notes={notes} />
      </div>
    </motion.div>
  )
}
