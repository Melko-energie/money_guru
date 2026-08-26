import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Coins, HandCoins, Home, Landmark, PiggyBank, Target } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { useAnimations } from '../../state/animations'
import { Anneau } from '../../components/Anneau'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/donneesDemo'
import { CATEGORIES } from '../../lib/calculs'
import { formaterCompact, formaterDevise, formaterPourcent } from '../../lib/format'
import { elementLateral } from '../../lib/animations'
import type { Categorie, Vue } from '../../lib/types'

const ICONES: Record<Categorie, typeof Home> = {
  maintenance: Home,
  urgence: PiggyBank,
  dettes: HandCoins,
  investissement: Landmark,
  objectifs: Target,
  fun: Coins,
}

const DESTINATIONS: Record<Categorie, Vue> = {
  maintenance: 'reglages',
  urgence: 'reglages',
  dettes: 'reglages',
  investissement: 'simulateur',
  objectifs: 'reglages',
  fun: 'reglages',
}

/** Panneau « Your Statistic » : l'anneau des six parts du revenu net. */
export function PanneauStatistiques({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { profil, montants, ratioFutur } = useFinances()
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
        montant:
          montants.urgence + montants.investissement + montants.objectifs + montants.dettes,
        part: ratioFutur,
      }

  return (
    <motion.section
      variants={elementLateral}
      className="relative flex flex-1 flex-col overflow-hidden rounded-carte bg-encre p-5 text-white shadow-carte sm:p-6"
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-saphir/35 blur-3xl ${
          animations ? 'animate-[deriver_19s_ease-in-out_infinite]' : ''
        }`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-foret/25 blur-3xl ${
          animations ? 'animate-[deriver_24s_ease-in-out_infinite_reverse]' : ''
        }`}
        aria-hidden
      />

      <div className="relative mb-2 flex items-center justify-between gap-3">
        <h2 className="text-[19px] font-bold leading-none">Vos statistiques</h2>
        <button
          type="button"
          onClick={() => onNaviguer('methodes')}
          title="Comparer les méthodes"
          className="group grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-colors duration-300 hover:bg-white/20"
        >
          <ArrowRight
            size={17}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
          <span className="sr-only">Comparer les méthodes</span>
        </button>
      </div>

      <div className="relative grid flex-1 place-items-center py-2">
        <Anneau
          segments={segments}
          taille={224}
          epaisseur={19}
          segmentActif={actif}
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

      <div className="relative mt-3 grid grid-cols-3 gap-2">
        {CATEGORIES.map((categorie) => {
          const Icone = ICONES[categorie]
          const couleurs = COULEURS_CATEGORIE[categorie]
          return (
            <button
              key={categorie}
              type="button"
              onMouseEnter={() => setActif(categorie)}
              onMouseLeave={() => setActif(null)}
              onFocus={() => setActif(categorie)}
              onBlur={() => setActif(null)}
              onClick={() => onNaviguer(DESTINATIONS[categorie])}
              title={LIBELLES_CATEGORIE[categorie].titre}
              className="flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 transition-colors duration-300 hover:bg-white/[0.07]"
            >
              <span
                className="grid h-10 w-10 place-items-center rounded-full text-white transition-transform duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(140deg, ${couleurs.degrade[0]}, ${couleurs.degrade[1]})`,
                }}
              >
                <Icone size={17} strokeWidth={1.9} />
              </span>
              <span className="text-center">
                <span className="block text-[12.5px] font-bold tabular-nums leading-none">
                  {formaterCompact(montants[categorie])}
                </span>
                <span className="mt-0.5 block text-[9.5px] font-medium leading-tight text-white/45">
                  {LIBELLES_CATEGORIE[categorie].sousTitre}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <p className="relative mt-3 border-t border-white/10 pt-3 text-center text-[11px] leading-snug text-white/40">
        Déjà de côté : {formaterDevise(profil.soldeFondsUrgence, profil.devise, 0)} en sécurité ·{' '}
        {formaterDevise(profil.patrimoine.investi, profil.devise, 0)} investis
      </p>
    </motion.section>
  )
}
