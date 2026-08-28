import { Gauge } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { Carte } from '../../components/Carte'
import { JaugeScore } from '../../components/JaugeScore'
import type { Vue } from '../../lib/types'

/**
 * Petite carte de la colonne étroite : le score de marge de manœuvre
 * et le détail de ses quatre composantes (context §10).
 */
export function CarteMarge({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { score } = useFinances()

  return (
    <Carte
      icone={Gauge}
      titre="Marge de manœuvre"
      sousTitre={score.libelle}
      ouvrir={() => onNaviguer('methodes')}
      ouvrirLibelle="Comparer les méthodes"
    >
      <div className="grid place-items-center pb-1">
        <JaugeScore score={score} taille={180} />
      </div>
    </Carte>
  )
}
