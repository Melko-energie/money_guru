import { useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { useAnimations } from '../../state/animations'
import { Anneau } from '../../components/Anneau'
import { EnteteSection } from '../../components/EnteteSection'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/definitions'
import { CATEGORIES } from '../../lib/calculs'
import { formaterCompact, formaterDevise, formaterPourcent } from '../../lib/format'
import { elementApparition } from '../../lib/animations'
import type { Categorie, Vue } from '../../lib/types'

/**
 * Panneau sombre du layout de référence : l'anneau des six parts du revenu.
 * Le détail chiffré de chaque part vit dans les cartes de répartition —
 * ici on ne montre que la proportion et le total sécurité & futur.
 */
export function PanneauStatistiques({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { profil, montants, ratioFutur, capitalProductif } = useFinances()
  const { animations } = useAnimations()
  const [actif, setActif] = useState<Categorie | null>(null)

  const segments = CATEGORIES.map((c) => ({
    cle: c,
    valeur: profil.allocation[c],
    degrade: COULEURS_CATEGORIE[c].degrade,
    libelle: LIBELLES_CATEGORIE[c].titre,
  }))

  const misEnAvant = actif
    ? {
        titre: LIBELLES_CATEGORIE[actif].titre,
        montant: montants[actif],
        part: profil.allocation[actif],
      }
    : {
        titre: 'Sécurité & futur',
        montant: montants.urgence + montants.investissement + montants.objectifs + montants.dettes,
        part: ratioFutur,
      }

  return (
    <motion.section
      variants={elementApparition}
      className="relative flex flex-col overflow-hidden rounded-carte bg-encre p-5 text-white shadow-carte"
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-olive/30 blur-3xl ${
          animations ? 'animate-[deriver_19s_ease-in-out_infinite]' : ''
        }`}
        aria-hidden
      />

      <EnteteSection
        icone={PieChart}
        titre="Votre répartition"
        sousTitre="Survolez une part pour la détailler"
        action="Comparer les méthodes"
        onAction={() => onNaviguer('methodes')}
        sombre
      />

      <div className="relative grid flex-1 place-items-center py-3">
        <Anneau
          segments={segments}
          taille={224}
          epaisseur={19}
          segmentActif={actif}
          surSegment={(cle) => setActif(cle as Categorie | null)}
          enfant={
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/50">
                {misEnAvant.titre}
              </p>
              <p className="mt-1 text-[28px] font-bold leading-none tabular-nums">
                {formaterCompact(misEnAvant.montant)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-white/50">
                {profil.devise} / mois · {formaterPourcent(misEnAvant.part)}
              </p>
            </div>
          }
        />
      </div>

      <div className="relative mt-2 grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-white/40">
            Déjà en sécurité
          </p>
          <p className="mt-0.5 text-[14px] font-bold tabular-nums">
            {formaterDevise(profil.soldeFondsUrgence, profil.devise, 0)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNaviguer('patrimoine')}
          className="text-left transition-opacity duration-300 hover:opacity-80"
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-white/40">
            Capital mobilisable
          </p>
          <p className="mt-0.5 text-[14px] font-bold tabular-nums">
            {formaterDevise(capitalProductif, profil.devise, 0)}
          </p>
        </button>
      </div>
    </motion.section>
  )
}
