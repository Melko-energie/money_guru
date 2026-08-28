import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Pencil,
  Repeat,
  RotateCcw,
  Trash2,
  Target,
} from 'lucide-react'
import { useFinances } from '../../state/finances'
import { GrilleCalendrier } from '../../components/GrilleCalendrier'
import { ListeMobile } from './ListeMobile'
import { VueAnnuelle } from './VueAnnuelle'
import { Segments } from '../../components/Champs'
import { Chiffre } from '../../components/Chiffre'
import { useEstMobile } from '../../state/media'
import { EnteteSection } from '../../components/EnteteSection'
import { FormulaireDepense, type BrouillonDepense } from './FormulaireDepense'
import {
  cleJourDe,
  cleMoisDe,
  decalerMois,
  estProjetee,
  libelleJour,
  libelleMois,
  moisDeCleJour,
} from '../../lib/calendrier'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/definitions'
import { formaterDevise } from '../../lib/format'
import { conteneurCascade, elementApparition, elementLateral } from '../../lib/animations'
import type { DepenseDatee, LigneJournal } from '../../lib/types'

/** Vue calendrier du context §7.5 — FR-12, FR-13, FR-14. */
export function PageCalendrier() {
  const {
    profil,
    moisAffiche,
    bilanMois,
    definirMoisAffiche,
    ajouterLigneJournal,
    modifierLigneJournal,
    retirerLigneJournal,
    materialiserOccurrence,
  } = useFinances()

  const aujourdhui = useMemo(() => cleJourDe(), [])
  const mobile = useEstMobile()
  const [portee, setPortee] = useState<'mois' | 'annee'>('mois')
  const [jourSelectionne, setJourSelectionne] = useState<string | null>(null)
  const [enEdition, setEnEdition] = useState<string | null>(null)

  // le jour retenu doit toujours appartenir au mois affiché
  const jourActif =
    jourSelectionne && moisDeCleJour(jourSelectionne) === moisAffiche
      ? jourSelectionne
      : moisDeCleJour(aujourdhui) === moisAffiche
        ? aujourdhui
        : `${moisAffiche}-01`

  const caseDuJour = bilanMois.jours.find((j) => j.cle === jourActif)
  const lignesDuJour = caseDuJour?.lignes ?? []
  // l'écart se mesure sur tout ce qui sort, frais déclarés compris
  const depassement = bilanMois.totalSorties - bilanMois.totalPrevu

  const changerMois = (pas: number) => {
    definirMoisAffiche(decalerMois(moisAffiche, pas))
    setEnEdition(null)
  }

  const enregistrer = (brouillon: BrouillonDepense, id?: string) => {
    if (id) modifierLigneJournal(id, brouillon)
    else ajouterLigneJournal(brouillon)
    setEnEdition(null)
  }

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
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-ardoise-soft to-ardoise-deep text-white">
                <CalendarDays size={20} strokeWidth={1.9} />
              </span>
              <div>
                <h2 className="text-[19px] font-bold leading-none text-encre">
                  {libelleMois(moisAffiche)}
                </h2>
                <p className="mt-1 text-[12px] text-meta">
                  {formaterDevise(bilanMois.totalSorties, profil.devise, 0)} sortis
                  {bilanMois.totalProjete > 0 ? (
                    <>
                      {' '}
                      · {formaterDevise(bilanMois.totalProjete, profil.devise, 0)} de récurrences à
                      venir
                    </>
                  ) : null}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Segments
                libelle="Portée du calendrier"
                valeur={portee}
                options={[
                  { valeur: 'mois' as const, libelle: 'Mois' },
                  { valeur: 'annee' as const, libelle: 'Année' },
                ]}
                onChange={setPortee}
              />

              {portee === 'mois' ? (
                <>
                  <button
                    type="button"
                    onClick={() => changerMois(-1)}
                    title="Mois précédent"
                    className="grid h-9 w-9 place-items-center rounded-full bg-papier-100 text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre"
                  >
                    <ChevronLeft size={16} />
                    <span className="sr-only">Mois précédent</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => definirMoisAffiche(cleMoisDe())}
                    className="rounded-pilule bg-papier-100 px-3.5 py-2 text-[12px] font-semibold text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre"
                  >
                    Ce mois-ci
                  </button>
                  <button
                    type="button"
                    onClick={() => changerMois(1)}
                    title="Mois suivant"
                    className="grid h-9 w-9 place-items-center rounded-full bg-papier-100 text-meta transition-all duration-300 hover:-translate-y-0.5 hover:text-encre"
                  >
                    <ChevronRight size={16} />
                    <span className="sr-only">Mois suivant</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {portee === 'annee' ? (
            <VueAnnuelle
              onOuvrirMois={(cle) => {
                definirMoisAffiche(cle)
                setJourSelectionne(null)
                setPortee('mois')
              }}
            />
          ) : (
            <>
            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Chiffre
                libelle="Budget prévu"
                valeur={formaterDevise(bilanMois.totalPrevu, profil.devise, 0)}
                sens="Ce que vos ratios allouent ce mois-ci"
              />
              <Chiffre
                libelle="Frais déclarés"
                valeur={formaterDevise(bilanMois.chargesFixes, profil.devise, 0)}
                sens="Vos frais de maintenance, comptés sans saisie"
              />
              <Chiffre
                libelle="Saisi ce mois"
                valeur={formaterDevise(bilanMois.totalReel, profil.devise, 0)}
                sens="La somme de ce que vous avez saisi"
              />
              <Chiffre
                libelle="Écart prévu / réel"
                valeur={`${depassement > 0 ? '+' : '−'}${formaterDevise(Math.abs(depassement), profil.devise, 0)}`}
                sens={depassement > 0 ? 'Vous dépassez votre budget' : 'Vous restez dans votre budget'}
                accent={depassement > 0 ? 'text-alerte-deep' : 'text-succes-deep'}
              />
            </div>

            {mobile ? (
              <ListeMobile
                bilan={bilanMois}
                devise={profil.devise}
                jourSelectionne={jourActif}
                onSelectionner={(cle) => {
                  setJourSelectionne(cle)
                  setEnEdition(null)
                }}
              />
            ) : (
              <GrilleCalendrier
                bilan={bilanMois}
                devise={profil.devise}
                jourSelectionne={jourActif}
                onSelectionner={(cle) => {
                  setJourSelectionne(cle)
                  setEnEdition(null)
                }}
                aujourdhui={aujourdhui}
              />
            )}
            </>
          )}

        </motion.section>

        <motion.section
          variants={elementApparition}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <EnteteSection
            icone={CalendarDays}
            titre={libelleJour(jourActif)}
            sousTitre="Détail du jour et saisie"
          />

          {lignesDuJour.length === 0 ? (
            <p className="mb-4 rounded-2xl bg-papier-100 px-4 py-3 text-[12.5px] text-meta">
              Aucune dépense ce jour-là. Ajoutez-en une ci-dessous — la saisie reste manuelle,
              aucune synchronisation bancaire n’est prévue.
            </p>
          ) : (
            <ul className="mb-4 flex flex-col gap-2.5">
              {lignesDuJour.map((ligne) => (
                <LigneDepense
                  key={ligne.id}
                  ligne={ligne}
                  devise={profil.devise}
                  enEdition={enEdition === ligne.id}
                  onEditer={() => setEnEdition(ligne.id)}
                  onFermer={() => setEnEdition(null)}
                  onEnregistrer={(b) => enregistrer(b, ligne.id)}
                  onSupprimer={() => retirerLigneJournal(ligne.id)}
                  onMaterialiser={() => materialiserOccurrence(ligne as DepenseDatee)}
                />
              ))}
            </ul>
          )}

          {enEdition === null ? (
            <FormulaireDepense
              date={jourActif}
              devise={profil.devise}
              onValider={(b) => enregistrer(b)}
            />
          ) : null}
        </motion.section>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <motion.section
          variants={elementLateral}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <EnteteSection
            icone={Target}
            titre="Prévu contre réel"
            sousTitre="Frais déclarés compris"
          />
          <ul className="flex flex-col gap-3.5">
            {bilanMois.ecarts.map((e) => {
              const couleurs = COULEURS_CATEGORIE[e.categorie]
              const ratio = e.prevu > 0 ? e.reel / e.prevu : e.reel > 0 ? 1.5 : 0
              const depasse = e.ecart > 0
              return (
                <li key={e.categorie}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-encre">
                      <span className={`h-2.5 w-2.5 rounded-full ${couleurs.puce}`} />
                      {LIBELLES_CATEGORIE[e.categorie].titre}
                    </span>
                    <span
                      className={`text-[12px] font-bold tabular-nums ${
                        depasse ? 'text-brique-deep' : 'text-meta'
                      }`}
                    >
                      {formaterDevise(e.reel, profil.devise, 0)}
                      <span className="font-semibold text-meta">
                        {' '}
                        / {formaterDevise(e.prevu, profil.devise, 0)}
                      </span>
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-pilule bg-encre/[0.07]">
                    <div
                      className="h-full rounded-pilule transition-[width] duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, ratio * 100)}%`,
                        background: depasse ? '#B4452F' : couleurs.trait,
                      }}
                    />
                  </div>
                  {e.projete > 0 ? (
                    <p className="mt-1 text-[10.5px] font-semibold text-meta">
                      + {formaterDevise(e.projete, profil.devise, 0)} de récurrences prévues
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </motion.section>

        <motion.section
          variants={elementLateral}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <EnteteSection
            icone={Flame}
            titre="Jours les plus coûteux"
            sousTitre="Au-delà du seuil du mois"
          />
          {bilanMois.joursCouteux.length === 0 ? (
            <p className="text-[12.5px] text-meta">Aucune dépense saisie ce mois-ci.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {bilanMois.joursCouteux.map((j) => (
                <li key={j.cle}>
                  <button
                    type="button"
                    onClick={() => setJourSelectionne(j.cle)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl bg-papier/60 px-3.5 py-2.5 text-left transition-colors duration-300 hover:bg-papier-100"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-semibold text-encre">
                        {libelleJour(j.cle)}
                      </span>
                      <span className="text-[11px] text-meta">
                        {j.lignes.filter((l) => !estProjetee(l)).length} dépense(s)
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      {j.eleve ? <Flame size={12} className="text-brique" /> : null}
                      <span
                        className={`text-[13px] font-bold tabular-nums ${
                          j.eleve ? 'text-brique-deep' : 'text-encre'
                        }`}
                      >
                        {formaterDevise(j.total, profil.devise, 0)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {Number.isFinite(bilanMois.seuilJourEleve) ? (
            <p className="mt-3 border-t border-encre/[0.06] pt-3 text-[11px] leading-relaxed text-meta">
              Un jour est signalé au-delà de{' '}
              {formaterDevise(bilanMois.seuilJourEleve, profil.devise, 0)} — la moyenne des jours
              dépensés du mois, plus une fois et demie leur écart-type.
            </p>
          ) : null}
        </motion.section>

        <motion.section
          variants={elementLateral}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <EnteteSection
            icone={Repeat}
            titre="Dépenses récurrentes"
            sousTitre="Reportées sur les mois suivants"
          />
          {bilanMois.recurrences.length === 0 ? (
            <p className="text-[12.5px] text-meta">
              Aucune récurrence. Cochez « récurrente » à la saisie pour qu’une dépense soit
              reportée automatiquement sur les mois suivants.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {bilanMois.recurrences.map((r) => (
                <li
                  key={r.serie ?? r.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-papier/60 px-3.5 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-semibold text-encre">
                      {r.libelle}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-meta">
                      <Repeat size={10} />
                      le {Number(r.date.slice(8, 10))} de chaque mois ·{' '}
                      {LIBELLES_CATEGORIE[r.categorie].titre}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-bold tabular-nums text-encre">
                    {formaterDevise(r.montant, profil.devise, 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>
    </motion.div>
  )
}

/** Une ligne du jour : lecture, édition en place, suppression, ou acceptation d'une récurrence. */
function LigneDepense({
  ligne,
  devise,
  enEdition,
  onEditer,
  onFermer,
  onEnregistrer,
  onSupprimer,
  onMaterialiser,
}: {
  ligne: LigneJournal
  devise: string
  enEdition: boolean
  onEditer: () => void
  onFermer: () => void
  onEnregistrer: (b: BrouillonDepense) => void
  onSupprimer: () => void
  onMaterialiser: () => void
}) {
  const projetee = estProjetee(ligne)
  const couleurs = COULEURS_CATEGORIE[ligne.categorie]

  if (enEdition && !projetee) {
    return (
      <li>
        <FormulaireDepense
          date={ligne.date}
          devise={ligne.devise}
          initial={ligne}
          onValider={onEnregistrer}
          onAnnuler={onFermer}
        />
      </li>
    )
  }

  return (
    <li
      className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 transition-colors duration-300 ${
        projetee
          ? 'border-dashed border-encre/20 bg-papier/40'
          : 'border-encre/[0.06] bg-papier/60 hover:bg-papier-100'
      }`}
    >
      <span
        className="h-9 w-1.5 shrink-0 rounded-pilule"
        style={{ background: couleurs.trait }}
        aria-hidden
      />

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-bold text-encre">{ligne.libelle}</span>
          <span className={`text-[10.5px] font-bold ${couleurs.texte}`}>
            {LIBELLES_CATEGORIE[ligne.categorie].titre}
          </span>
          {ligne.recurrent ? (
            <span className="inline-flex items-center gap-1 rounded-pilule bg-white px-2 py-0.5 text-[10px] font-bold text-meta shadow-pilule">
              <Repeat size={9} />
              {projetee ? 'prévue' : 'récurrente'}
            </span>
          ) : null}
        </span>
        {ligne.note ? (
          <span className="mt-0.5 block text-[11.5px] leading-snug text-meta">{ligne.note}</span>
        ) : null}
      </span>

      <span className="shrink-0 text-[15px] font-bold tabular-nums text-encre">
        {formaterDevise(ligne.montant, ligne.devise, 0)}
      </span>

      <span className="flex shrink-0 items-center gap-1">
        {projetee ? (
          <button
            type="button"
            onClick={onMaterialiser}
            title="Confirmer cette récurrence"
            className="inline-flex items-center gap-1.5 rounded-pilule border border-encre/10 px-3 py-1.5 text-[11.5px] font-semibold text-meta transition-colors duration-300 hover:text-encre"
          >
            <RotateCcw size={12} />
            Confirmer
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onEditer}
              title={`Modifier ${ligne.libelle}`}
              className="grid h-9 w-9 place-items-center rounded-full text-meta transition-colors duration-300 hover:bg-white hover:text-encre"
            >
              <Pencil size={14} />
              <span className="sr-only">Modifier {ligne.libelle}</span>
            </button>
            <button
              type="button"
              onClick={onSupprimer}
              title={`Supprimer ${ligne.libelle}`}
              className="grid h-9 w-9 place-items-center rounded-full text-meta transition-colors duration-300 hover:bg-brique-tint hover:text-brique-deep"
            >
              <Trash2 size={14} />
              <span className="sr-only">Supprimer {ligne.libelle}</span>
            </button>
          </>
        )}
      </span>
      <span className="sr-only">{devise}</span>
    </li>
  )
}
