import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  CalendarClock,
  Check,
  Lightbulb,
  Pencil,
  Plus,
  Target,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { useFinances } from '../../state/finances'
import { Carte } from '../../components/Carte'
import { Modale } from '../../components/Modale'
import { FormulaireObjectif } from './FormulaireObjectif'
import { Chiffre } from '../../components/Chiffre'
import { BarreProgression } from '../../components/BarreProgression'
import { EnteteSection } from '../../components/EnteteSection'
import { conseils, faisabilite, objectifsTries } from '../../lib/objectifs'
import { libelleMois } from '../../lib/calendrier'
import { LIBELLES_CATEGORIE } from '../../lib/definitions'
import { formaterDevise, formaterDuree } from '../../lib/format'
import { conteneurCascade, elementApparition, elementLateral } from '../../lib/animations'
import type { Vue } from '../../lib/types'

/**
 * Mes objectifs : un achat, une date, un verdict.
 *
 * La page ne se contente pas d'afficher un souhait. Elle confronte le montant
 * visé à ce que le poste choisi met réellement de côté chaque mois, aux
 * salaires annoncés pour ces mois-là, et dit si la date tient — ou ce qu'il
 * faudrait changer pour qu'elle tienne.
 */
export function PageObjectifs({ onNaviguer }: { onNaviguer: (v: Vue) => void }) {
  const {
    profil,
    ajouterObjectif,
    modifierObjectif,
    retirerObjectif,
    enregistrerAchat,
  } = useFinances()

  const [selection, setSelection] = useState<string | null>(null)
  const [enEdition, setEnEdition] = useState<string | null>(null)

  const devise = profil.devise
  const liste = useMemo(() => objectifsTries(profil.objectifs), [profil.objectifs])
  const etudes = useMemo(
    () => liste.map((o) => faisabilite(profil, o)),
    [profil, liste],
  )

  const etudeCourante = etudes.find((e) => e.objectif.id === selection) ?? etudes[0] ?? null
  const pratiques = etudeCourante ? conseils(profil, etudeCourante) : []
  const objetEnEdition = liste.find((o) => o.id === enEdition) ?? null

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
          className="relative overflow-hidden rounded-carte bg-gradient-to-br from-papier-100 via-papier to-ciel-tint p-6 shadow-carte ring-1 ring-encre/[0.06] sm:p-7"
        >
          <span className="inline-flex items-center gap-1.5 rounded-pilule bg-white px-3 py-1.5 text-[11.5px] font-bold text-ciel-deep shadow-pilule">
            <Target size={12} />
            {etudeCourante
              ? `Prochaine échéance : ${libelleMois(etudeCourante.objectif.moisCible)}`
              : 'Aucun objectif enregistré'}
          </span>

          {etudeCourante ? (
            <>
              <h2 className="mt-4 text-[34px] leading-[1.05] sm:text-[42px]">
                <span className="font-display italic text-meta">
                  {etudeCourante.objectif.libelle},{' '}
                </span>
                <br />
                <span className="font-bold tabular-nums text-encre">
                  {formaterDevise(etudeCourante.objectif.montant, devise, 0)}
                </span>
              </h2>
              <p className="mt-3 max-w-[58ch] text-[13.5px] leading-relaxed text-meta">
                {etudeCourante.manquant <= 0
                  ? 'Le montant est réuni. Il ne reste qu’à enregistrer l’achat le moment venu.'
                  : etudeCourante.atteignable
                    ? `En mettant ${formaterDevise(etudeCourante.effortMensuel, devise, 0)} de côté chaque mois pendant ${formaterDuree(etudeCourante.moisRestants)}, la date tient. ${
                        etudeCourante.versementChoisi
                          ? `Vous en mettez ${formaterDevise(etudeCourante.capaciteMensuelle, devise, 0)}.`
                          : `Votre poste ${LIBELLES_CATEGORIE[etudeCourante.objectif.categorie].titre.toLowerCase()} dégage ${formaterDevise(etudeCourante.capaciteMensuelle, devise, 0)} par mois.`
                      }`
                    : `Il manque ${formaterDevise(Math.abs(etudeCourante.ecartMensuel), devise, 0)} par mois pour tenir cette date. Les voies possibles sont listées à droite.`}
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-[34px] leading-[1.05] sm:text-[42px]">
                <span className="font-display italic text-meta">Un achat, </span>
                <br />
                <span className="font-bold text-encre">une date, un verdict</span>
              </h2>
              <p className="mt-3 max-w-[58ch] text-[13.5px] leading-relaxed text-meta">
                Enregistrez ce que vous voulez acheter et quand. L’application confronte le montant
                à ce que votre poste met réellement de côté chaque mois, et vous dit si l’échéance
                tient.
              </p>
            </>
          )}
        </motion.section>

        {liste.length > 0 ? (
          <motion.section variants={elementApparition}>
            <EnteteSection
              icone={CalendarClock}
              titre="Vos achats prévus"
              sousTitre="Du plus proche au plus lointain"
            />

            <ul className="flex flex-col gap-3">
              {etudes.map((e) => {
                const o = e.objectif
                const choisi = etudeCourante?.objectif.id === o.id
                const finance = e.manquant <= 0
                return (
                  <motion.li
                    key={o.id}
                    whileHover={{ y: -3 }}
                    onClick={() => setSelection(o.id)}
                    className={`cursor-pointer rounded-carte bg-white p-5 shadow-carte ring-1 transition-shadow duration-300 hover:shadow-[0_28px_60px_-28px_rgba(39,40,42,0.4)] ${
                      choisi ? 'ring-encre/25' : 'ring-encre/[0.06]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-[220px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[16px] font-bold leading-none text-encre">
                            {o.libelle}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 rounded-pilule px-2.5 py-1 text-[10px] font-bold ${
                              finance || e.atteignable
                                ? 'bg-succes-tint text-succes-deep'
                                : 'bg-alerte-tint text-alerte-deep'
                            }`}
                          >
                            {finance || e.atteignable ? (
                              <BadgeCheck size={11} />
                            ) : (
                              <TriangleAlert size={11} />
                            )}
                            {finance ? 'Financé' : e.atteignable ? 'Réalisable' : 'Trop juste'}
                          </span>
                          {o.achatEnregistre ? (
                            <span className="inline-flex items-center gap-1 rounded-pilule bg-papier-100 px-2.5 py-1 text-[10px] font-bold text-meta">
                              <Check size={11} strokeWidth={3} />
                              Achat enregistré
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-[12px] text-meta">
                          {libelleMois(o.moisCible)} ·{' '}
                          {formaterDevise(o.montant, devise, 0)} ·{' '}
                          {e.versementChoisi
                            ? `${formaterDevise(o.versementMensuel ?? 0, devise, 0)} par mois`
                            : LIBELLES_CATEGORIE[o.categorie].titre}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEnEdition(o.id)}
                          title={`Modifier ${o.libelle}`}
                          className="grid h-9 w-9 place-items-center rounded-full text-meta transition-colors duration-300 hover:bg-papier-100 hover:text-encre"
                        >
                          <Pencil size={15} />
                          <span className="sr-only">Modifier {o.libelle}</span>
                        </button>
                        {!o.achatEnregistre ? (
                          <button
                            type="button"
                            onClick={() => enregistrerAchat(o.id)}
                            className="inline-flex items-center gap-1.5 rounded-pilule bg-papier-100 px-3.5 py-2 text-[12px] font-semibold text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre active:translate-y-0"
                          >
                            <Check size={13} />
                            Enregistrer l’achat
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => retirerObjectif(o.id)}
                          title={`Supprimer ${o.libelle}`}
                          className="grid h-9 w-9 place-items-center rounded-full text-meta transition-colors duration-300 hover:bg-alerte-tint hover:text-alerte-deep"
                        >
                          <Trash2 size={15} />
                          <span className="sr-only">Supprimer {o.libelle}</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <BarreProgression
                        valeur={e.progressionPct}
                        hauteur="h-2.5"
                        degrade={
                          e.atteignable
                            ? 'from-ciel-soft via-ciel to-ciel-deep'
                            : 'from-alerte-soft via-alerte to-alerte-deep'
                        }
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                      <div>
                        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                          Déjà de côté
                        </p>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={o.dejaMisDeCote}
                          aria-label={`Déjà mis de côté pour ${o.libelle}`}
                          onFocus={(ev) => ev.currentTarget.select()}
                          onChange={(ev) =>
                            modifierObjectif(o.id, {
                              dejaMisDeCote: Math.max(0, Number(ev.target.value)),
                            })
                          }
                          className="mt-0.5 h-8 w-full max-w-[110px] rounded-xl border border-transparent bg-papier-100/70 px-2 text-[15px] font-bold tabular-nums text-encre outline-none transition-colors duration-200 hover:border-encre/10 focus:border-ciel focus:bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                      <div>
                        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                          {e.versementChoisi ? 'Je mets / mois' : 'Le poste donne'}
                        </p>
                        {e.versementChoisi ? (
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={o.versementMensuel ?? 0}
                            aria-label={`Versement mensuel pour ${o.libelle}`}
                            onFocus={(ev) => ev.currentTarget.select()}
                            onChange={(ev) =>
                              modifierObjectif(o.id, {
                                versementMensuel: Math.max(0, Number(ev.target.value)),
                              })
                            }
                            className="mt-0.5 h-8 w-full max-w-[110px] rounded-xl border border-transparent bg-papier-100/70 px-2 text-[15px] font-bold tabular-nums text-ciel-deep outline-none transition-colors duration-200 hover:border-encre/10 focus:border-ciel focus:bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        ) : (
                          <p className="mt-0.5 text-[15px] font-bold tabular-nums text-ciel-deep">
                            {formaterDevise(e.partDuPoste, devise, 0)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                          Il faudrait / mois
                        </p>
                        <p
                          className={`mt-0.5 text-[15px] font-bold tabular-nums ${
                            e.atteignable ? 'text-encre' : 'text-alerte-deep'
                          }`}
                        >
                          {formaterDevise(e.effortMensuel, devise, 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-meta">
                          Échéance
                        </p>
                        <p className="mt-0.5 text-[15px] font-bold text-encre">
                          {formaterDuree(e.moisRestants)}
                        </p>
                      </div>
                    </div>

                    {!e.atteignable && e.moisAtteinte ? (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-pilule bg-alerte-tint px-3 py-1.5 text-[11.5px] font-semibold text-alerte-deep">
                        <TriangleAlert size={12} />
                        Au rythme actuel, financé en {libelleMois(e.moisAtteinte).toLowerCase()} —{' '}
                        {formaterDuree(e.retardMois)} de retard
                      </p>
                    ) : null}
                  </motion.li>
                )
              })}
            </ul>
          </motion.section>
        ) : null}

        <Carte
          icone={Plus}
          titre="Nouvel objectif"
          sousTitre="Ce que vous voulez acheter, et quand"
        >
          <FormulaireObjectif onValider={(b) => ajouterObjectif(b)} />
        </Carte>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        {etudeCourante ? (
          <motion.section
            variants={elementLateral}
            className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
          >
            <EnteteSection
              icone={Lightbulb}
              titre="Les bonnes pratiques"
              sousTitre={`Pour « ${etudeCourante.objectif.libelle} »`}
            />
            <ol className="flex flex-col gap-3">
              {pratiques.map((texte, i) => (
                <li key={texte} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-papier-100 text-[11px] font-bold text-encre">
                    {i + 1}
                  </span>
                  <p className="text-[12.5px] leading-relaxed text-meta">{texte}</p>
                </li>
              ))}
            </ol>
          </motion.section>
        ) : null}

        {etudeCourante ? (
          <motion.section
            variants={elementLateral}
            className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
          >
            <EnteteSection
              icone={Target}
              titre="Ce que ça coûte"
              sousTitre="Sur votre revenu du mois"
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Chiffre
                libelle="Reste à réunir"
                valeur={formaterDevise(etudeCourante.manquant, devise, 0)}
                sens="Montant visé moins ce qui est déjà de côté"
              />
              <Chiffre
                libelle="Part du revenu"
                valeur={`${Math.round(etudeCourante.partDuRevenu * 100)} %`}
                sens="Ce que l’effort mensuel mobilise chaque mois"
                accent={
                  etudeCourante.partDuRevenu > 0.25 ? 'text-alerte-deep' : 'text-encre'
                }
              />
            </div>
            <button
              type="button"
              onClick={() => onNaviguer('reglages')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-pilule bg-papier-100 px-3.5 py-2 text-[12px] font-semibold text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre active:translate-y-0"
            >
              Ajuster la part de ce poste
            </button>
          </motion.section>
        ) : null}

        <motion.aside
          variants={elementLateral}
          className="rounded-carte bg-encre p-5 text-white shadow-carte"
        >
          <p className="text-[13px] font-bold">Un objectif n’est pas une dette</p>
          <p className="mt-2 text-[12px] leading-relaxed text-white/60">
            Money Guru ne propose jamais d’emprunter pour avancer la date. Un achat prévu se
            finance par ce que votre revenu dégage réellement : si la date ne tient pas, c’est la
            date ou le montant qui bouge, pas votre sécurité.
          </p>
        </motion.aside>
      </div>

      <Modale
        ouverte={objetEnEdition !== null}
        titre={objetEnEdition ? `Modifier « ${objetEnEdition.libelle} »` : ''}
        sousTitre="Le montant, la date, le financement"
        onFermer={() => setEnEdition(null)}
      >
        {objetEnEdition ? (
          <FormulaireObjectif
            initial={objetEnEdition}
            onValider={(b) => {
              modifierObjectif(objetEnEdition.id, b)
              setEnEdition(null)
            }}
            onAnnuler={() => setEnEdition(null)}
          />
        ) : null}
      </Modale>
    </motion.div>
  )
}
