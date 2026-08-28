import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, PiggyBank, Plus, Trash2 } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { ChampMontant, Selecteur } from '../../components/Champs'
import { BarreProgression } from '../../components/BarreProgression'
import { CATEGORIES, fraisMaintenance } from '../../lib/calculs'
import { METHODES } from '../../lib/methodes'
import { DEVISES, formaterDevise, formaterPourcent } from '../../lib/format'
import { LIBELLES_CAPITAL, LIBELLES_CATEGORIE } from '../../lib/definitions'
import type { CategorieCapital, ProfilFinancier } from '../../lib/types'

type Etape = {
  cle: string
  titre: string
  question: string
  /** Sans réponse ici, l'application n'afficherait que des zéros. */
  obligatoire: boolean
  valide: (p: ProfilFinancier) => boolean
}

const ETAPES: Etape[] = [
  {
    cle: 'bienvenue',
    titre: 'Bienvenue',
    question: 'Comment vous appelez-vous, et dans quelle devise comptez-vous ?',
    obligatoire: false,
    valide: () => true,
  },
  {
    cle: 'revenu',
    titre: 'Ce qui rentre',
    question: 'Combien touchez-vous net, chaque mois ?',
    obligatoire: true,
    valide: (p) => p.revenuNet > 0,
  },
  {
    cle: 'frais',
    titre: 'Ce qui sort',
    question: 'Que coûte votre vie courante, poste par poste ?',
    obligatoire: true,
    valide: (p) => fraisMaintenance(p.depenses) > 0,
  },
  {
    cle: 'securite',
    titre: 'Votre sécurité',
    question: 'Combien avez-vous de côté aujourd’hui ?',
    obligatoire: true,
    valide: () => true,
  },
  {
    cle: 'dettes',
    titre: 'Vos dettes',
    question: 'Devez-vous de l’argent à des proches ?',
    obligatoire: false,
    valide: () => true,
  },
  {
    cle: 'patrimoine',
    titre: 'Votre patrimoine',
    question: 'Que possédez-vous déjà ?',
    obligatoire: false,
    valide: () => true,
  },
  {
    cle: 'methode',
    titre: 'Votre méthode',
    question: 'Comment voulez-vous répartir votre revenu ?',
    obligatoire: true,
    valide: (p) => p.revenuNet > 0,
  },
  {
    cle: 'recapitulatif',
    titre: 'Récapitulatif',
    question: 'Tout est-il juste ?',
    obligatoire: false,
    valide: () => true,
  },
]

/**
 * Parcours de remplissage : une question à la fois, jamais un formulaire géant.
 * Chaque réponse est écrite immédiatement dans le profil — quitter et revenir
 * reprend à la même étape, sans rien perdre.
 */
export function PageOnboarding() {
  const f = useFinances()
  const { profil } = f
  const index = Math.min(profil.onboarding.etape, ETAPES.length - 1)
  const etape = ETAPES[index]
  const frais = fraisMaintenance(profil.depenses)

  const peutAvancer = !etape.obligatoire || etape.valide(profil)
  const progression = ((index + 1) / ETAPES.length) * 100

  const apercu = useMemo(
    () => METHODES.find((m) => m.cle === profil.methode) ?? METHODES[0],
    [profil.methode],
  )

  const avancer = () => {
    if (index === ETAPES.length - 1) f.terminerOnboarding()
    else f.definirEtapeOnboarding(index + 1)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-clip p-4 sm:p-8">
      <div
        className="pointer-events-none absolute -left-20 top-10 h-80 w-80 rounded-full bg-olive/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-ciel/15 blur-3xl"
        aria-hidden
      />

      <motion.section
        key={etape.cle}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        aria-label={`Étape ${index + 1} sur ${ETAPES.length} — ${etape.titre}`}
        className="relative w-full max-w-[620px] rounded-carte border border-white/70 bg-white/85 p-6 shadow-fenetre backdrop-blur-2xl sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-olive-soft to-olive-deep text-white">
            <PiggyBank size={20} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-semibold uppercase tracking-wide text-meta">
              Étape {index + 1} sur {ETAPES.length} · {etape.titre}
            </p>
            <div className="mt-1.5">
              <BarreProgression valeur={progression} hauteur="h-1.5" />
            </div>
          </div>
        </div>

        <h1 className="text-[26px] font-bold leading-tight text-encre sm:text-[30px]">
          {etape.question}
        </h1>

        <div className="mt-6 flex flex-col gap-4">
          {etape.cle === 'bienvenue' ? (
            <>
              <div>
                <label
                  htmlFor="prenom-onboarding"
                  className="mb-1.5 block text-[12px] font-semibold text-meta"
                >
                  Votre prénom
                </label>
                <input
                  id="prenom-onboarding"
                  value={profil.prenom}
                  onChange={(e) => f.definirPrenom(e.target.value)}
                  placeholder="Facultatif"
                  className="h-12 w-full rounded-2xl border border-encre/[0.09] bg-white px-4 text-[15px] font-semibold text-encre outline-none transition-all duration-300 placeholder:font-normal placeholder:text-meta focus:border-ciel"
                />
              </div>
              <Selecteur
                libelle="Devise"
                valeur={profil.devise}
                options={DEVISES.map((d) => ({ valeur: d.code, libelle: `${d.code} — ${d.libelle}` }))}
                onChange={f.definirDevise}
              />
            </>
          ) : null}

          {etape.cle === 'revenu' ? (
            <ChampMontant
              libelle="Revenu net mensuel"
              valeur={profil.revenuNet}
              suffixe={profil.devise}
              onChange={f.definirRevenu}
              aide="C’est la base de tous les calculs. Ce que vous touchez réellement, pas le brut."
            />
          ) : null}

          {etape.cle === 'frais' ? (
            <>
              <ul className="flex flex-col gap-2">
                {profil.depenses.map((d) => (
                  <li key={d.id} className="flex items-center gap-2.5">
                    <input
                      value={d.libelle}
                      onChange={(e) => f.definirDepense(d.id, { libelle: e.target.value })}
                      aria-label={`Nom du poste ${d.libelle}`}
                      className="h-11 min-w-0 flex-1 rounded-2xl border border-encre/[0.09] bg-white px-3.5 text-[13.5px] font-semibold text-encre outline-none focus:border-ciel"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min={0}
                      value={d.montant}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => f.definirDepense(d.id, { montant: Number(e.target.value) })}
                      aria-label={`Montant de ${d.libelle}`}
                      className="h-11 w-28 shrink-0 rounded-2xl border border-encre/[0.09] bg-white px-3 text-[13.5px] font-semibold tabular-nums text-encre outline-none [appearance:textfield] focus:border-ciel [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => f.retirerDepense(d.id)}
                      title={`Retirer ${d.libelle}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-meta transition-colors hover:bg-alerte-tint hover:text-alerte-deep"
                    >
                      <Trash2 size={15} />
                      <span className="sr-only">Retirer {d.libelle}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={f.ajouterDepense}
                  className="inline-flex items-center gap-1.5 rounded-pilule bg-papier-100 px-3.5 py-2 text-[12.5px] font-semibold text-meta transition-colors hover:text-encre"
                >
                  <Plus size={14} />
                  Ajouter un poste
                </button>
                <p className="text-[13px] font-bold tabular-nums text-encre">
                  Total : {formaterDevise(frais, profil.devise, 0)}
                </p>
              </div>
            </>
          ) : null}

          {etape.cle === 'securite' ? (
            <ChampMontant
              libelle="Solde de votre fonds d’urgence"
              valeur={profil.soldeFondsUrgence}
              suffixe={profil.devise}
              onChange={f.definirSoldeUrgence}
              aide={
                frais > 0
                  ? `Votre objectif sera de ${formaterDevise(frais * 6, profil.devise, 0)}, soit six mois de vos frais. Zéro est une réponse valable.`
                  : 'Zéro est une réponse valable.'
              }
            />
          ) : null}

          {etape.cle === 'dettes' ? (
            <>
              <ChampMontant
                libelle="Total dû à des proches"
                valeur={profil.dettes.total}
                suffixe={profil.devise}
                onChange={(v) => f.definirDettes({ total: v })}
                aide="Sans intérêt, auprès de la famille, d’amis ou de collègues."
              />
              <ChampMontant
                libelle="Remboursement mensuel prévu"
                valeur={profil.dettes.remboursementMensuel}
                suffixe={profil.devise}
                onChange={(v) => f.definirDettes({ remboursementMensuel: v })}
              />
            </>
          ) : null}

          {etape.cle === 'patrimoine' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(LIBELLES_CAPITAL) as CategorieCapital[]).map((cle) => (
                <ChampMontant
                  key={cle}
                  libelle={LIBELLES_CAPITAL[cle].titre}
                  valeur={profil.patrimoine[cle]}
                  suffixe={profil.devise}
                  onChange={(v) => f.definirPatrimoine(cle, v)}
                />
              ))}
            </div>
          ) : null}

          {etape.cle === 'methode' ? (
            <>
              <ul className="flex flex-col gap-2.5">
                {METHODES.filter((m) => m.ratios).map((m) => {
                  const actif = profil.methode === m.cle
                  return (
                    <li key={m.cle}>
                      <button
                        type="button"
                        onClick={() => f.definirMethode(m.cle)}
                        aria-pressed={actif}
                        className={`flex w-full items-start gap-3 rounded-carte border p-4 text-left transition-all duration-300 ${
                          actif
                            ? 'border-olive bg-olive-tint'
                            : 'border-encre/[0.08] bg-white hover:border-encre/20'
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                            actif ? 'border-olive bg-olive text-white' : 'border-encre/20'
                          }`}
                        >
                          {actif ? <Check size={11} strokeWidth={3.5} /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[14px] font-bold text-encre">{m.titre}</span>
                          <span className="mt-0.5 block text-[12px] text-meta">{m.regle}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {profil.revenuNet > 0 ? (
                <div className="rounded-carte bg-papier-100 p-4">
                  <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-meta">
                    Sur vos {formaterDevise(profil.revenuNet, profil.devise, 0)}, ça donne
                  </p>
                  <ul className="flex flex-col gap-1">
                    {CATEGORIES.map((c) => (
                      <li key={c} className="flex items-center justify-between gap-3">
                        <span className="text-[12.5px] text-encre">
                          {LIBELLES_CATEGORIE[c].titre}
                        </span>
                        <span className="text-[12.5px] font-bold tabular-nums text-encre">
                          {formaterDevise(f.montants[c], profil.devise, 0)}
                          <span className="ml-1.5 font-semibold text-meta">
                            {formaterPourcent(profil.allocation[c])}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}

          {etape.cle === 'recapitulatif' ? (
            <ul className="flex flex-col divide-y divide-encre/[0.07] rounded-carte bg-papier-100 px-4">
              {[
                { l: 'Prénom', v: profil.prenom || 'non renseigné' },
                { l: 'Revenu net', v: formaterDevise(profil.revenuNet, profil.devise, 0) },
                { l: 'Frais de maintenance', v: formaterDevise(frais, profil.devise, 0) },
                {
                  l: 'Fonds d’urgence',
                  v: `${formaterDevise(profil.soldeFondsUrgence, profil.devise, 0)} sur ${formaterDevise(frais * 6, profil.devise, 0)}`,
                },
                { l: 'Dettes', v: formaterDevise(profil.dettes.total, profil.devise, 0) },
                { l: 'Méthode', v: apercu.titre },
              ].map((r) => (
                <li key={r.l} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[12.5px] text-meta">{r.l}</span>
                  <span className="text-[13px] font-bold text-encre">{r.v}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {!peutAvancer ? (
          <p className="mt-4 rounded-2xl bg-alerte-tint px-4 py-2.5 text-[12px] font-semibold text-alerte-deep">
            Cette réponse est nécessaire : sans elle, l’application n’afficherait que des zéros.
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-encre/[0.07] pt-5">
          <button
            type="button"
            onClick={() => f.definirEtapeOnboarding(index - 1)}
            disabled={index === 0}
            className="inline-flex items-center gap-1.5 rounded-pilule px-3.5 py-2.5 text-[13px] font-semibold text-meta transition-colors hover:text-encre disabled:opacity-30"
          >
            <ArrowLeft size={15} />
            Retour
          </button>

          <div className="flex items-center gap-2">
            {!etape.obligatoire && index < ETAPES.length - 1 ? (
              <button
                type="button"
                onClick={avancer}
                className="rounded-pilule px-3.5 py-2.5 text-[13px] font-semibold text-meta transition-colors hover:text-encre"
              >
                Passer
              </button>
            ) : null}

            <button
              type="button"
              onClick={avancer}
              disabled={!peutAvancer}
              className="inline-flex items-center gap-1.5 rounded-pilule bg-encre px-5 py-2.5 text-[13.5px] font-bold text-white transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-35 disabled:hover:translate-y-0"
            >
              {index === ETAPES.length - 1 ? 'Ouvrir mon tableau de bord' : 'Continuer'}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

      </motion.section>
    </div>
  )
}
