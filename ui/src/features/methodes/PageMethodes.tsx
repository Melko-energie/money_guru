import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Scale, TrendingDown, TrendingUp ,
  BookOpen,
  PieChart,
} from 'lucide-react'
import { useFinances } from '../../state/finances'
import { Depliable } from '../../components/Depliable'
import { EnteteSection } from '../../components/EnteteSection'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/definitions'
import { CATEGORIES } from '../../lib/calculs'
import { METHODES, comparerMethodes, ficheMethode } from '../../lib/methodes'
import { formaterCompact, formaterDevise, formaterPourcent } from '../../lib/format'
import { formaterEcheance } from '../../lib/pedagogie'
import { ANNEES_CARRIERE } from '../../lib/calculs'
import { note } from '../../lib/pedagogie'
import { conteneurCascade, elementApparition, elementLateral } from '../../lib/animations'
import type { Vue } from '../../lib/types'

/** Barre empilée des six parts d'une méthode, sur une seule ligne. */
function BandeAllocation({ allocation }: { allocation: Record<string, number> }) {
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-pilule">
      {CATEGORIES.map((c) => (
        <span
          key={c}
          title={`${LIBELLES_CATEGORIE[c].titre} ${allocation[c]} %`}
          style={{
            width: `${allocation[c]}%`,
            background: `linear-gradient(180deg, ${COULEURS_CATEGORIE[c].degrade[0]}, ${COULEURS_CATEGORIE[c].degrade[1]})`,
          }}
        />
      ))}
    </div>
  )
}

export function PageMethodes({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const { profil, revenuMois, definirMethode } = useFinances()
  const bilans = useMemo(() => comparerMethodes(profil, revenuMois), [profil])
  const courant = bilans.find((b) => b.methode === profil.methode)
  const meilleur = bilans.reduce((a, b) => (b.capitalCarriere > a.capitalCarriere ? b : a))
  const noteRatios = note('ratios-reperes')

  return (
    <motion.div
      variants={conteneurCascade}
      initial="cache"
      animate="visible"
      className="grid gap-5 pb-2 xl:grid-cols-[minmax(0,1fr)_minmax(300px,330px)]"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <motion.section
          variants={elementApparition}
          className="relative overflow-hidden rounded-carte bg-gradient-to-br from-papier-100 via-papier to-prune-tint p-6 shadow-carte ring-1 ring-encre/[0.06] sm:p-7"
        >
          <span className="inline-flex items-center gap-1.5 rounded-pilule bg-white px-3 py-1.5 text-[11.5px] font-bold text-prune-deep shadow-pilule">
            <Scale size={12} />
            Méthode en cours : {ficheMethode(profil.methode).titre}
          </span>

          <h2 className="mt-4 text-[36px] leading-[1.04] sm:text-[44px]">
            <span className="font-display italic text-meta">Sur {ANNEES_CARRIERE} ans, </span>
            <br />
            <span className="font-bold tabular-nums text-encre">
              {formaterDevise(courant?.capitalCarriere ?? 0, profil.devise, 0)}
            </span>
          </h2>

          <p className="mt-3 max-w-[58ch] text-[13.5px] leading-relaxed text-meta">
            Voilà ce que votre stratégie actuelle produirait au rythme de{' '}
            {formaterDevise(courant?.montants.investissement ?? 0, profil.devise, 0)} par mois.
            Chaque méthode ci-dessous est projetée sur vos chiffres réels — revenu, maintenance,
            fonds d’urgence et dette. L’écart affiché est le coût, ou le gain, d’un changement.
          </p>
        </motion.section>

        <motion.section variants={elementApparition}>
          <EnteteSection
            icone={Scale}
            titre="Les cinq stratégies"
            sousTitre="Projetées sur vos chiffres réels"
          />

          <div className="flex flex-col gap-3">
            {bilans.map((bilan) => {
              const fiche = ficheMethode(bilan.methode)
              const actuelle = bilan.methode === profil.methode
              const ecart = bilan.ecartCapital

              return (
                <motion.article
                  key={bilan.methode}
                  whileHover={{ y: -3 }}
                  className={`rounded-carte bg-white p-5 shadow-carte ring-1 transition-shadow duration-300 hover:shadow-[0_28px_60px_-28px_rgba(39, 40, 42,0.4)] ${
                    actuelle ? 'border-encre/25' : 'border-encre/[0.06]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-[220px] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[16px] font-bold leading-none text-encre">
                          {fiche.titre}
                        </h3>
                        {actuelle ? (
                          <span className="inline-flex items-center gap-1 rounded-pilule bg-encre px-2.5 py-1 text-[10px] font-bold text-white">
                            <Check size={10} strokeWidth={3} />
                            En cours
                          </span>
                        ) : null}
                        {bilan.methode === meilleur.methode && !actuelle ? (
                          <span className="rounded-pilule bg-foret-tint px-2.5 py-1 text-[10px] font-bold text-foret-deep">
                            Meilleur capital
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[12px] text-meta">{fiche.regle}</p>
                    </div>

                    {!actuelle ? (
                      <button
                        type="button"
                        onClick={() => definirMethode(bilan.methode)}
                        className="group inline-flex shrink-0 items-center gap-1.5 rounded-pilule bg-papier-100 px-3.5 py-2 text-[12px] font-semibold text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre active:translate-y-0"
                      >
                        Adopter
                        <ArrowRight
                          size={13}
                          className="transition-transform duration-300 group-hover:translate-x-0.5"
                        />
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <BandeAllocation allocation={bilan.allocation} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                        Capital {ANNEES_CARRIERE} ans
                      </p>
                      <p className="mt-0.5 text-[15px] font-bold tabular-nums text-encre">
                        {formaterCompact(bilan.capitalCarriere, profil.devise)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                        Fun money
                      </p>
                      <p className="mt-0.5 text-[15px] font-bold tabular-nums text-ambre-deep">
                        {formaterDevise(bilan.funMensuel, profil.devise, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                        Urgence dans
                      </p>
                      <p className="mt-0.5 text-[15px] font-bold text-foret-deep">
                        {formaterEcheance(bilan.moisAvantObjectifUrgence)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                        Dette soldée
                      </p>
                      <p className="mt-0.5 text-[15px] font-bold text-brique-deep">
                        {formaterEcheance(bilan.moisPourSolderDette)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                        Marge
                      </p>
                      <p className="mt-0.5 text-[15px] font-bold tabular-nums text-encre">
                        {bilan.score} / 100
                      </p>
                    </div>
                  </div>

                  {!actuelle ? (
                    <p
                      className={`mt-3 inline-flex items-center gap-1.5 rounded-pilule px-3 py-1.5 text-[11.5px] font-semibold ${
                        ecart >= 0
                          ? 'bg-foret-tint text-foret-deep'
                          : 'bg-brique-tint text-brique-deep'
                      }`}
                    >
                      {ecart >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {ecart >= 0 ? '+' : '−'}
                      {formaterCompact(Math.abs(ecart), profil.devise)} sur {ANNEES_CARRIERE} ans
                      face à votre stratégie actuelle
                    </p>
                  ) : null}
                </motion.article>
              )
            })}
          </div>
        </motion.section>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <motion.section
          variants={elementLateral}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <EnteteSection
            icone={BookOpen}
            titre="Ce que dit chaque méthode"
            sousTitre="Cliquez un titre pour lire"
          />
          <div className="flex flex-col divide-y divide-encre/[0.06]">
            {METHODES.map((m) => (
              <div key={m.cle} className="py-3 first:pt-0 last:pb-0">
                <Depliable titre={m.titre} aide={m.promesse}>
                  <p className="text-[12px] leading-relaxed text-meta">{m.description}</p>
                </Depliable>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={elementLateral}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <EnteteSection
            icone={PieChart}
            titre="Répartition actuelle"
            sousTitre="Vos six parts du revenu net"
          />
          <ul className="flex flex-col gap-2.5">
            {CATEGORIES.map((c) => (
              <li key={c} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-encre">
                  <span className={`h-2.5 w-2.5 rounded-full ${COULEURS_CATEGORIE[c].puce}`} />
                  {LIBELLES_CATEGORIE[c].titre}
                </span>
                <span className="text-[12.5px] font-bold tabular-nums text-encre">
                  {formaterPourcent(profil.allocation[c])}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onNaviguer('reglages')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-pilule bg-papier-100 px-3.5 py-2 text-[12px] font-semibold text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre active:translate-y-0"
          >
            Ajuster mes ratios
            <ArrowRight size={13} />
          </button>
        </motion.section>

        {noteRatios ? (
          <motion.aside
            variants={elementLateral}
            className="rounded-carte bg-encre p-5 text-white shadow-carte"
          >
            <Depliable
              titre={noteRatios.titre}
              classeTitre="text-white"
              classeAide="text-white/50"
            >
              <p className="text-[12px] leading-relaxed text-white/60">{noteRatios.texte}</p>
            </Depliable>
          </motion.aside>
        ) : null}
      </div>
    </motion.div>
  )
}
