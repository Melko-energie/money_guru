import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { CourbeProjection } from '../../components/CourbeProjection'
import { Segments } from '../../components/Champs'
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
      accent: 'text-encre',
    },
    {
      libelle: 'Total versé',
      valeur: formaterDevise(resultat.totalVerse, profil.devise, 0),
      accent: 'text-meta',
    },
    {
      libelle: 'Gain brut',
      valeur: formaterDevise(resultat.gainBrut, profil.devise, 0),
      accent: 'text-foret-deep',
    },
  ]

  return (
    <motion.section
      variants={elementApparition}
      className="rounded-carte border border-encre/[0.06] bg-white p-5 shadow-carte sm:p-6"
    >
      <EnteteSection
        titre="Capital projeté sur une carrière"
        action="Ouvrir le simulateur"
        onAction={() => onNaviguer('simulateur')}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-[12.5px] text-meta">
          <TrendingUp size={14} className="text-saphir" />
          {formaterDevise(montants.investissement, profil.devise, 0)} par mois à{' '}
          {formaterPourcent(profil.tauxRendementAnnuel)} par an, versés en début de mois, en
          partant de {formaterDevise(profil.patrimoine.investi, profil.devise, 0)}.
        </p>
        <Segments
          libelle="Horizon de projection"
          valeur={horizon}
          options={HORIZONS.map((h) => ({ valeur: h.valeur as CleHorizon, libelle: h.libelle }))}
          onChange={setHorizon}
        />
      </div>

      <CourbeProjection points={resultat.points} devise={profil.devise} />

      <div className="mt-4 grid gap-3 border-t border-encre/[0.06] pt-4 sm:grid-cols-3">
        {chiffres.map((c) => (
          <div key={c.libelle}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
              {c.libelle}
            </p>
            <p className={`mt-0.5 text-[19px] font-bold tabular-nums ${c.accent}`}>{c.valeur}</p>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
