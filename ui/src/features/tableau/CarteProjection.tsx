import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { CourbeProjection } from '../../components/CourbeProjection'
import { Segments } from '../../components/Champs'
import { Chiffre } from '../../components/Chiffre'
import { EnteteSection } from '../../components/EnteteSection'
import { ANNEES_CARRIERE, simuler } from '../../lib/calculs'
import { formaterDevise, formaterPourcent } from '../../lib/format'
import { elementApparition } from '../../lib/animations'
import type { Vue } from '../../lib/types'

const HORIZONS = [
  { valeur: '10', libelle: '10 ans' },
  { valeur: '20', libelle: '20 ans' },
  { valeur: String(ANNEES_CARRIERE), libelle: `${ANNEES_CARRIERE} ans` },
] as const

type CleHorizon = (typeof HORIZONS)[number]['valeur']

/**
 * Zone projection du context §10 : capital projeté sur une carrière de 42 ans,
 * total versé et gain brut, au rythme de l'allocation en cours.
 */
export function CarteProjection({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { profil, montants } = useFinances()
  const [horizon, setHorizon] = useState<CleHorizon>(String(ANNEES_CARRIERE) as CleHorizon)

  const resultat = useMemo(
    () =>
      simuler(
        {
          montantInitial: profil.patrimoine.investi,
          versementMensuel: montants.investissement,
          tauxAnnuel: profil.tauxRendementAnnuel,
          dureeAnnees: Number(horizon),
          momentVersement: 'debut',
        },
        'an',
      ),
    [profil.patrimoine.investi, profil.tauxRendementAnnuel, montants.investissement, horizon],
  )

  const chiffres = [
    {
      libelle: 'Capital projeté',
      valeur: formaterDevise(resultat.capitalFinal, profil.devise, 0),
      sens: `Ce que vous auriez dans ${horizon} ans au rythme actuel`,
      accent: 'text-encre',
    },
    {
      libelle: 'Total versé',
      valeur: formaterDevise(resultat.totalVerse, profil.devise, 0),
      sens: 'La somme sortie de votre poche',
      accent: 'text-encre',
    },
    {
      libelle: 'Gain brut',
      valeur: formaterDevise(resultat.gainBrut, profil.devise, 0),
      sens: 'Ce que les versements ont produit, hors frais et impôts',
      accent: 'text-succes-deep',
    },
  ]

  return (
    <motion.section
      variants={elementApparition}
      className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
    >
      <EnteteSection
        icone={TrendingUp}
        titre="Capital projeté sur une carrière"
        sousTitre={`${formaterDevise(montants.investissement, profil.devise, 0)} par mois à ${formaterPourcent(profil.tauxRendementAnnuel)} par an`}
        controles={
          <Segments
            libelle="Horizon de projection"
            valeur={horizon}
            options={HORIZONS.map((h) => ({ valeur: h.valeur as CleHorizon, libelle: h.libelle }))}
            onChange={setHorizon}
          />
        }
        action="Ouvrir le simulateur"
        onAction={() => onNaviguer('simulateur')}
      />

      <p className="mb-4 text-[12.5px] text-meta">
        Versés en début de mois, en partant de{' '}
        {formaterDevise(profil.patrimoine.investi, profil.devise, 0)}.
      </p>

      <CourbeProjection points={resultat.points} devise={profil.devise} />

      <div className="mt-4 grid gap-3 border-t border-encre/[0.06] pt-4 sm:grid-cols-3">
        {chiffres.map((c) => (
          <Chiffre key={c.libelle} libelle={c.libelle} valeur={c.valeur} sens={c.sens} accent={c.accent} />
        ))}
      </div>
    </motion.section>
  )
}
