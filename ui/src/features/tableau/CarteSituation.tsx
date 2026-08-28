import { motion } from 'framer-motion'
import { ArrowUpRight, Coins, Gauge, Plus, Scale, Wallet } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { useAnimations } from '../../state/animations'
import { useEstMobile } from '../../state/media'
import { formaterDevise, formaterRatio } from '../../lib/format'
import { libelleMois } from '../../lib/calendrier'
import { ficheMethode } from '../../lib/methodes'
import { elementApparition } from '../../lib/animations'
import type { Vue } from '../../lib/types'

/**
 * Zone haute du context §10, en deux mises en page.
 *
 * Au téléphone : le grand disque de synthèse des références mobiles — le
 * chiffre qui compte au centre, l'action principale dedans, les repères
 * dessous en liste. Sur grand écran : la carte héros verticale de la colonne
 * étroite. Mêmes données, deux lectures.
 */
export function CarteSituation({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { profil, frais, pression, resteVital, montants, bilanMois, revenuMois, moisAffiche } =
    useFinances()
  const { animations } = useAnimations()
  const mobile = useEstMobile()
  const methode = ficheMethode(profil.methode)

  const revenuDuMoisDiffere = revenuMois !== profil.revenuNet
  const reperes = [
    {
      libelle: revenuDuMoisDiffere ? `Revenu ${libelleMois(moisAffiche).toLowerCase()}` : 'Revenu net',
      valeur: formaterDevise(revenuMois, profil.devise, 0),
      icone: Wallet,
    },
    { libelle: 'Maintenance', valeur: formaterDevise(frais, profil.devise, 0), icone: Gauge },
    { libelle: 'Fun money', valeur: formaterDevise(montants.fun, profil.devise, 0), icone: Coins },
  ]

  const pilule = (
    <button
      type="button"
      onClick={() => onNaviguer('methodes')}
      className="inline-flex items-center gap-1.5 rounded-pilule bg-white/20 px-3 py-1.5 text-[11.5px] font-bold text-white backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5"
    >
      <Scale size={12} />
      {methode.titre}
    </button>
  )

  if (mobile) {
    return (
      /* ——— téléphone : le disque ——— */
      <motion.section
        variants={elementApparition}
        className="relative overflow-hidden rounded-carte bg-papier-100 px-4 pb-5 pt-6 ring-1 ring-encre/[0.05]"
      >
        <div className="relative mx-auto grid aspect-square w-full max-w-[300px] place-items-center rounded-full bg-gradient-to-br from-olive-soft via-olive to-olive-deep p-8 text-center text-white shadow-[0_24px_60px_-24px_rgba(118,125,47,0.95)]">
          <div
            className={`pointer-events-none absolute inset-6 rounded-full bg-white/10 blur-2xl ${
              animations ? 'animate-[lueur_7s_ease-in-out_infinite]' : ''
            }`}
            aria-hidden
          />
          <div className="relative">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/65">
              Après la maintenance
            </p>
            <p className="mt-1.5 text-[34px] font-bold leading-none tabular-nums">
              {formaterDevise(resteVital, profil.devise, 0)}
            </p>
            <p className="mt-1.5 text-[12px] font-medium text-white/70">
              {formaterDevise(bilanMois.totalReel, profil.devise, 0)} déjà dépensés ce mois
            </p>
            <button
              type="button"
              onClick={() => onNaviguer('calendrier')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-pilule bg-white px-4 py-2.5 text-[12.5px] font-bold text-olive-deep active:scale-95"
            >
              <Plus size={15} strokeWidth={2.4} />
              Ajouter une dépense
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => onNaviguer('methodes')}
            className="inline-flex items-center gap-1.5 rounded-pilule bg-white px-3.5 py-2 text-[11.5px] font-bold text-olive-deep shadow-pilule"
          >
            <Scale size={12} />
            {methode.titre} · maintenance à {formaterRatio(pression)}
          </button>
        </div>

        <ul className="mt-4 flex flex-col divide-y divide-encre/[0.07]">
          {reperes.map(({ libelle, valeur, icone: Icone }) => (
            <li key={libelle} className="flex items-center justify-between gap-3 py-2.5">
              <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-meta">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-encre/60">
                  <Icone size={16} />
                </span>
                {libelle}
              </span>
              <span className="text-[14px] font-bold tabular-nums text-encre">{valeur}</span>
            </li>
          ))}
        </ul>
      </motion.section>
    )
  }

  return (
    /* ——— grand écran : la carte héros ——— */
    <motion.section
      variants={elementApparition}
      className="relative overflow-hidden rounded-carte bg-gradient-to-br from-olive-soft via-olive to-olive-deep p-5 text-white shadow-carte"
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl ${
          animations ? 'animate-[deriver_16s_ease-in-out_infinite]' : ''
        }`}
        aria-hidden
      />

      <div className="relative">
        {pilule}

        <p className="mt-5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/60">
          Après la maintenance
        </p>
        <p className="mt-1 text-[34px] font-bold leading-none tabular-nums">
          {formaterDevise(resteVital, profil.devise, 0)}
        </p>
        <p className="mt-1.5 text-[12px] font-semibold text-white/70">
          à affecter · maintenance à {formaterRatio(pression)} du revenu
        </p>

        <div className="mt-5 flex flex-col gap-1.5 border-t border-white/15 pt-4">
          {reperes.map(({ libelle, valeur, icone: Icone }) => (
            <div key={libelle} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[12px] font-medium text-white/70">
                <Icone size={13} />
                {libelle}
              </span>
              <span className="text-[13px] font-bold tabular-nums">{valeur}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onNaviguer('reglages')}
          className="group mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-pilule bg-white px-4 py-2.5 text-[12.5px] font-bold text-olive-deep transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
        >
          Mettre à jour mes chiffres
          <ArrowUpRight
            size={14}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </button>
      </div>
    </motion.section>
  )
}
