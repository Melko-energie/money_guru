import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { GitCompareArrows, Info, RotateCcw, Wand2 ,
  Percent,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useFinances } from '../../state/finances'
import { ChampMontant, Curseur, Segments, Selecteur } from '../../components/Champs'
import { CourbeProjection } from '../../components/CourbeProjection'
import { EnteteSection } from '../../components/EnteteSection'
import { ComparaisonTaux } from './ComparaisonTaux'
import { ANNEES_CARRIERE, partGain, simuler } from '../../lib/calculs'
import { DEVISES, formaterDevise, formaterDuree, formaterPourcent } from '../../lib/format'
import { AVERTISSEMENT } from '../../lib/pedagogie'
import { SCENARIOS, SIMULATION_PAR_DEFAUT } from '../../lib/definitions'
import { conteneurCascade, elementApparition, elementLateral } from '../../lib/animations'
import type { CodeDevise, MomentVersement, ParametresSimulation } from '../../lib/types'

export function PageSimulateur({
  parametres,
  onChange,
}: {
  parametres: ParametresSimulation
  onChange: (champs: Partial<ParametresSimulation>) => void
}) {
  const { profil, montants, definirDevise } = useFinances()
  const devise = profil.devise

  /** Scénario B : les mêmes versements, une autre hypothèse (context §7.4). */
  const [ecartTaux, setEcartTaux] = useState(-3)
  const [ecartDuree, setEcartDuree] = useState(0)

  const resultat = useMemo(() => simuler(parametres, 'an'), [parametres])
  const alternatif = useMemo(
    () =>
      simuler(
        {
          ...parametres,
          tauxAnnuel: Math.max(0, parametres.tauxAnnuel + ecartTaux),
          dureeAnnees: Math.max(1, parametres.dureeAnnees + ecartDuree),
        },
        'an',
      ),
    [parametres, ecartTaux, ecartDuree],
  )

  const part = partGain(resultat)
  const deltaCapital = resultat.capitalFinal - alternatif.capitalFinal

  const phrase = `Avec ${formaterDevise(parametres.versementMensuel, devise, 0)} par mois à ${formaterPourcent(
    parametres.tauxAnnuel,
  )} sur ${formaterDuree(parametres.dureeAnnees * 12)}, le gain brut atteint ${formaterDevise(
    resultat.gainBrut,
    devise,
    0,
  )}, pour un capital final de ${formaterDevise(resultat.capitalFinal, devise, 0)}.`

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
          className="relative overflow-hidden rounded-carte bg-gradient-to-br from-papier-100 via-papier to-saphir-tint p-6 shadow-carte ring-1 ring-encre/[0.06] sm:p-7"
        >
          <span className="inline-flex items-center gap-1.5 rounded-pilule bg-white px-3 py-1.5 text-[11.5px] font-bold text-saphir-deep shadow-pilule">
            <Wand2 size={12} />
            Et si…
          </span>

          <h2 className="mt-4 text-[36px] leading-[1.04] sm:text-[44px]">
            <span className="font-display italic text-meta">Gain brut de </span>
            <span className="font-bold tabular-nums text-encre">
              {formaterDevise(resultat.gainBrut, devise, 0)}
            </span>
          </h2>

          <p className="mt-3 max-w-[58ch] text-[13.5px] leading-relaxed text-meta">{phrase}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              {
                libelle: 'Capital final',
                valeur: formaterDevise(resultat.capitalFinal, devise, 0),
                accent: 'text-encre',
              },
              {
                libelle: 'Total versé',
                valeur: formaterDevise(resultat.totalVerse, devise, 0),
                accent: 'text-meta',
              },
              {
                libelle: 'Part du gain',
                valeur: formaterPourcent(part, 1),
                accent: 'text-foret-deep',
              },
            ].map((c) => (
              <div
                key={c.libelle}
                className="rounded-2xl bg-white/80 px-4 py-3 shadow-pilule backdrop-blur-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
                  {c.libelle}
                </p>
                <p className={`mt-0.5 text-[20px] font-bold tabular-nums ${c.accent}`}>
                  {c.valeur}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={elementApparition}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <EnteteSection
            titre="Vos hypothèses"
            action="Réinitialiser"
            onAction={() => onChange(SIMULATION_PAR_DEFAUT)}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <ChampMontant
              libelle="Montant initial"
              valeur={parametres.montantInitial}
              suffixe={devise}
              onChange={(v) => onChange({ montantInitial: Math.max(0, v) })}
              aide={`Votre capital investi : ${formaterDevise(profil.patrimoine.investi, devise, 0)}`}
            />
            <ChampMontant
              libelle="Versement mensuel"
              valeur={parametres.versementMensuel}
              suffixe={devise}
              onChange={(v) => onChange({ versementMensuel: Math.max(0, v) })}
              aide={`Votre allocation : ${formaterDevise(montants.investissement, devise, 0)} par mois`}
            />
            <Selecteur
              libelle="Devise"
              valeur={devise}
              options={DEVISES.map((d) => ({ valeur: d.code as CodeDevise, libelle: `${d.code} — ${d.libelle}` }))}
              onChange={definirDevise}
              aide="Change l’affichage partout dans l’application."
            />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[12px] font-semibold text-meta">
                  Rendement annuel brut estimé
                </span>
                <span className="text-[15px] font-bold tabular-nums text-encre">
                  {formaterPourcent(parametres.tauxAnnuel, 1)}
                </span>
              </div>
              <Curseur
                libelle="Rendement annuel brut estimé"
                valeur={parametres.tauxAnnuel}
                min={0}
                max={15}
                couleur="#3D470F"
                onChange={(v) => onChange({ tauxAnnuel: v })}
              />
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[12px] font-semibold text-meta">
                  Durée · {ANNEES_CARRIERE} ans = une carrière
                </span>
                <span className="text-[15px] font-bold tabular-nums text-encre">
                  {formaterDuree(parametres.dureeAnnees * 12)}
                </span>
              </div>
              <Curseur
                libelle="Durée de la simulation"
                valeur={parametres.dureeAnnees}
                min={1}
                max={ANNEES_CARRIERE}
                couleur="#767D2F"
                onChange={(v) => onChange({ dureeAnnees: v })}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-encre/[0.06] pt-4">
            <Segments
              libelle="Moment du versement"
              valeur={parametres.momentVersement}
              options={[
                { valeur: 'debut' as MomentVersement, libelle: 'Versement en début de mois' },
                { valeur: 'fin' as MomentVersement, libelle: 'En fin de mois' },
              ]}
              onChange={(v) => onChange({ momentVersement: v })}
            />
            <button
              type="button"
              onClick={() =>
                onChange({
                  montantInitial: profil.patrimoine.investi,
                  versementMensuel: Math.round(montants.investissement),
                  tauxAnnuel: profil.tauxRendementAnnuel,
                  dureeAnnees: ANNEES_CARRIERE,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-pilule bg-papier-100 px-3.5 py-2 text-[12.5px] font-semibold text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre active:translate-y-0"
            >
              <RotateCcw size={13} />
              Repartir de ma situation
            </button>
          </div>
        </motion.section>

        <motion.section
          variants={elementApparition}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <EnteteSection
            icone={TrendingUp}
            titre="Évolution du capital"
            sousTitre="Résultats bruts, hors frais et inflation"
          />
          <CourbeProjection points={resultat.points} devise={devise} />
        </motion.section>

        <motion.section
          variants={elementApparition}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <div className="mb-4 flex items-center gap-2">
            <GitCompareArrows size={16} className="text-meta" />
            <h2 className="text-[19px] font-bold leading-none text-encre">
              Différence entre deux scénarios
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[12px] font-semibold text-meta">Écart de rendement</span>
                <span className="text-[15px] font-bold tabular-nums text-encre">
                  {ecartTaux >= 0 ? '+' : '−'}
                  {formaterPourcent(Math.abs(ecartTaux), 1)}
                </span>
              </div>
              <Curseur
                libelle="Écart de rendement du scénario alternatif"
                valeur={ecartTaux}
                min={-10}
                max={10}
                couleur="#A8B457"
                onChange={setEcartTaux}
              />
            </div>
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[12px] font-semibold text-meta">Écart de durée</span>
                <span className="text-[15px] font-bold tabular-nums text-encre">
                  {ecartDuree >= 0 ? '+' : '−'}
                  {Math.abs(ecartDuree)} ans
                </span>
              </div>
              <Curseur
                libelle="Écart de durée du scénario alternatif"
                valeur={ecartDuree}
                min={-20}
                max={20}
                couleur="#74B5D5"
                onChange={setEcartDuree}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-papier-100 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
                Scénario A
              </p>
              <p className="mt-0.5 text-[17px] font-bold tabular-nums text-encre">
                {formaterDevise(resultat.capitalFinal, devise, 0)}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-meta">
                {formaterPourcent(parametres.tauxAnnuel, 1)} ·{' '}
                {formaterDuree(parametres.dureeAnnees * 12)}
              </p>
            </div>
            <div className="rounded-2xl bg-papier-100 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
                Scénario B
              </p>
              <p className="mt-0.5 text-[17px] font-bold tabular-nums text-encre">
                {formaterDevise(alternatif.capitalFinal, devise, 0)}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-meta">
                {formaterPourcent(Math.max(0, parametres.tauxAnnuel + ecartTaux), 1)} ·{' '}
                {formaterDuree(Math.max(1, parametres.dureeAnnees + ecartDuree) * 12)}
              </p>
            </div>
            <div
              className={`rounded-2xl px-4 py-3 ${
                deltaCapital >= 0 ? 'bg-foret-tint' : 'bg-brique-tint'
              }`}
            >
              <p
                className={`text-[11px] font-semibold uppercase tracking-wide ${
                  deltaCapital >= 0 ? 'text-foret-deep' : 'text-brique-deep'
                }`}
              >
                Différence
              </p>
              <p
                className={`mt-0.5 text-[17px] font-bold tabular-nums ${
                  deltaCapital >= 0 ? 'text-foret-deep' : 'text-brique-deep'
                }`}
              >
                {deltaCapital >= 0 ? '+' : '−'}
                {formaterDevise(Math.abs(deltaCapital), devise, 0)}
              </p>
              <p
                className={`mt-0.5 text-[11px] font-semibold ${
                  deltaCapital >= 0 ? 'text-foret-deep' : 'text-brique-deep'
                } opacity-75`}
              >
                en faveur du scénario {deltaCapital >= 0 ? 'A' : 'B'}
              </p>
            </div>
          </div>
        </motion.section>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <motion.section variants={elementLateral}>
          <EnteteSection
            icone={Sparkles}
            titre="Scénarios"
            sousTitre="Des réglages tout prêts"
          />
          <div className="flex flex-col gap-3">
            {SCENARIOS.map((s) => (
              <motion.button
                key={s.id}
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onChange(s.parametres)}
                className="group rounded-carte bg-white p-4 text-left shadow-carte ring-1 ring-encre/[0.05] transition-shadow duration-300 hover:shadow-[0_28px_60px_-28px_rgba(39, 40, 42,0.4)]"
              >
                <span className="block text-[14.5px] font-bold text-encre">{s.titre}</span>
                <span className="mt-0.5 block text-[12.5px] text-meta">{s.resume}</span>
                <span className="mt-2 block text-[13px] font-bold tabular-nums text-saphir-deep">
                  {formaterDevise(
                    simuler({ ...parametres, ...s.parametres }, 'an').capitalFinal,
                    devise,
                    0,
                  )}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        <motion.section
          variants={elementLateral}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <EnteteSection
            icone={Percent}
            titre="3 % ou 10 % ?"
            sousTitre="Le même versement, quatre taux"
          />
          <ComparaisonTaux parametres={parametres} devise={devise} />
        </motion.section>

        <motion.aside
          variants={elementLateral}
          className="rounded-carte bg-encre p-5 text-white shadow-carte"
        >
          <p className="inline-flex items-center gap-2 text-[13px] font-bold">
            <Info size={15} />
            À lire avant de rêver
          </p>
          <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-white/60">
            <li>
              Le taux mensuel est le taux annuel divisé par 12, capitalisé chaque mois, avec un
              versement en {parametres.momentVersement === 'debut' ? 'début' : 'fin'} de mois.
            </li>
            <li>
              3 %, 7 % et 10 % sont des{' '}
              <strong className="font-semibold text-white/85">scénarios pédagogiques</strong>, pas
              des rendements promis, et ne représentent aucun produit d’épargne précis.
            </li>
            <li>{AVERTISSEMENT}</li>
          </ul>
        </motion.aside>
      </div>
    </motion.div>
  )
}
