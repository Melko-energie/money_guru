import { motion } from 'framer-motion'
import { ArrowUpRight, Coins, Gauge, Scale, Wallet } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { useAnimations } from '../../state/animations'
import { JaugeScore } from '../../components/JaugeScore'
import { formaterDevise, formaterRatio } from '../../lib/format'
import { ficheMethode } from '../../lib/methodes'
import { elementApparition } from '../../lib/animations'
import type { Vue } from '../../lib/types'

/**
 * Zone haute du context §10 : revenu net, méthode choisie, devise
 * et score de marge de manœuvre — dans la carte héros de la maquette.
 */
export function CarteSituation({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { profil, frais, pression, resteVital, score, montants } = useFinances()
  const { animations } = useAnimations()
  const methode = ficheMethode(profil.methode)

  const miniStats = [
    {
      libelle: 'Revenu net',
      valeur: formaterDevise(profil.revenuNet, profil.devise, 0),
      icone: Wallet,
    },
    { libelle: 'Maintenance', valeur: formaterDevise(frais, profil.devise, 0), icone: Gauge },
    {
      libelle: 'Fun money',
      valeur: formaterDevise(montants.fun, profil.devise, 0),
      icone: Coins,
    },
  ]

  return (
    <motion.section
      variants={elementApparition}
      className="relative overflow-hidden rounded-carte bg-gradient-to-br from-papier-100 via-papier to-foret-tint p-6 shadow-carte ring-1 ring-encre/[0.06] sm:p-7"
    >
      <div
        className={`pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-saphir/15 blur-3xl ${
          animations ? 'animate-[deriver_16s_ease-in-out_infinite]' : ''
        }`}
        aria-hidden
      />

      <div className="relative flex flex-wrap items-start gap-6">
        <div className="min-w-[260px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNaviguer('methodes')}
              className="inline-flex items-center gap-1.5 rounded-pilule bg-white px-3 py-1.5 text-[11.5px] font-bold text-saphir-deep shadow-pilule transition-transform duration-300 hover:-translate-y-0.5"
            >
              <Scale size={12} />
              {methode.titre}
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-pilule bg-white/70 px-3 py-1.5 text-[11.5px] font-bold text-meta">
              Maintenance à {formaterRatio(pression)} du revenu
            </span>
          </div>

          <h2 className="mt-4 text-[38px] leading-[1.02] sm:text-[48px]">
            <span className="font-display italic text-meta">Après la maintenance, </span>
            <br />
            <span className="font-bold tabular-nums text-encre">
              {formaterDevise(resteVital, profil.devise, 0)}
            </span>
            <span className="font-display italic text-meta"> à affecter</span>
          </h2>

          <p className="mt-3 max-w-[42ch] text-[13.5px] leading-relaxed text-meta">
            {methode.promesse.toLowerCase().charAt(0).toUpperCase() + methode.promesse.slice(1)}.
            {' '}
            {methode.regle} — chaque dirham reçoit une affectation dès la réception du salaire,
            avant d’être dépensé.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {miniStats.map(({ libelle, valeur, icone: Icone }) => (
              <div
                key={libelle}
                className="inline-flex items-center gap-2 rounded-pilule bg-white/85 px-3.5 py-2 shadow-pilule backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5"
              >
                <Icone size={14} className="text-meta" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-meta">
                  {libelle}
                </span>
                <span className="text-[13px] font-bold tabular-nums text-encre">{valeur}</span>
              </div>
            ))}

            <button
              type="button"
              onClick={() => onNaviguer('reglages')}
              className="group inline-flex items-center gap-1.5 rounded-pilule bg-encre px-4 py-2 text-[12.5px] font-semibold text-white shadow-[0_14px_30px_-14px_rgba(14,26,36,0.9)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              Mettre à jour mes chiffres
              <ArrowUpRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </div>

        <div className="relative flex shrink-0 flex-col items-center gap-1 self-center rounded-carte bg-white/70 px-6 py-5 shadow-pilule backdrop-blur-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-meta">
            Marge de manœuvre
          </p>
          <JaugeScore score={score} taille={176} />
          <button
            type="button"
            onClick={() => onNaviguer('methodes')}
            className="mt-1 text-[11.5px] font-semibold text-saphir-deep underline-offset-2 transition-colors hover:underline"
          >
            Comparer les méthodes
          </button>
        </div>
      </div>
    </motion.section>
  )
}
