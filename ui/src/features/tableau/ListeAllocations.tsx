import { motion } from 'framer-motion'
import { ChevronRight, HandCoins, Scale, ShieldCheck, Wallet } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { formaterDevise, formaterNombre, formaterRatio } from '../../lib/format'
import { ficheMethode } from '../../lib/methodes'
import { elementLateral } from '../../lib/animations'
import type { Vue } from '../../lib/types'

/**
 * Les trois lignes de la maquette, remappées sur les trois colonnes
 * du context §10 : sécurité, dette, stratégie.
 */
export function ListeAllocations({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const {
    profil,
    moisDejaCouverts,
    progressionUrgencePct,
    usageDette,
    detteExcessive,
    capitalProductif,
    ratioFutur,
  } = useFinances()

  const lignes = [
    {
      cle: 'securite',
      titre: 'Sécurité',
      detail: `${formaterNombre(moisDejaCouverts, 1)} mois couverts · ${formaterRatio(
        progressionUrgencePct / 100,
      )} de l’objectif`,
      icone: ShieldCheck,
      degrade: ['#6FA86D', '#2A5C29'] as [string, string],
      accent: 'text-foret-deep',
      vue: 'reglages' as Vue,
    },
    {
      cle: 'dette',
      titre: 'Dette personnelle',
      detail: detteExcessive
        ? `${formaterRatio(usageDette)} de la limite — au-delà du seuil`
        : `${formaterDevise(profil.dettes.total, profil.devise, 0)} dus · ${formaterRatio(
            usageDette,
          )} de la limite`,
      icone: HandCoins,
      degrade: ['#D0806E', '#8A3120'] as [string, string],
      accent: detteExcessive ? 'text-brique-deep' : 'text-ardoise-deep',
      vue: 'reglages' as Vue,
    },
    {
      cle: 'capital',
      titre: 'Capital productif',
      detail: `${formaterDevise(capitalProductif, profil.devise, 0)} mobilisables`,
      icone: Wallet,
      degrade: ['#4E83AB', '#0E3D5C'] as [string, string],
      accent: 'text-saphir-deep',
      vue: 'patrimoine' as Vue,
    },
    {
      cle: 'methode',
      titre: ficheMethode(profil.methode).titre,
      detail: `${formaterRatio(ratioFutur / 100)} du revenu pour la sécurité et le futur`,
      icone: Scale,
      degrade: ['#9277AE', '#4C3363'] as [string, string],
      accent: 'text-prune-deep',
      vue: 'methodes' as Vue,
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      {lignes.map((l) => {
        const Icone = l.icone
        return (
          <motion.button
            key={l.cle}
            type="button"
            variants={elementLateral}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onNaviguer(l.vue)}
            className="group flex items-center gap-3.5 rounded-carte border border-encre/[0.06] bg-white p-3 text-left shadow-carte transition-shadow duration-300 hover:shadow-[0_28px_60px_-28px_rgba(14,26,36,0.4)]"
          >
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white"
              style={{ background: `linear-gradient(140deg, ${l.degrade[0]}, ${l.degrade[1]})` }}
            >
              <Icone size={20} strokeWidth={1.9} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-bold leading-tight text-encre">
                {l.titre}
              </span>
              <span className={`mt-0.5 block text-[12px] font-semibold ${l.accent}`}>
                {l.detail}
              </span>
            </span>

            <ChevronRight
              size={18}
              className="shrink-0 text-meta transition-transform duration-300 group-hover:translate-x-1 group-hover:text-encre"
            />
          </motion.button>
        )
      })}
    </div>
  )
}
