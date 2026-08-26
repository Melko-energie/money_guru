import { motion } from 'framer-motion'
import {
  Car,
  HandCoins,
  Heart,
  Home,
  Lightbulb,
  Plus,
  Repeat,
  RotateCcw,
  ShieldQuestion,
  ShoppingBasket,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react'
import { useFinances } from '../../state/finances'
import { ChampMontant, Curseur, Selecteur } from '../../components/Champs'
import { EnteteSection } from '../../components/EnteteSection'
import { BarreProgression } from '../../components/BarreProgression'
import { DetailScore } from '../../components/JaugeScore'
import { COULEURS_CATEGORIE, LIBELLES_CATEGORIE } from '../../lib/donneesDemo'
import { METHODES } from '../../lib/methodes'
import { CATEGORIES, MOIS_OBJECTIF_URGENCE } from '../../lib/calculs'
import { DEVISES, formaterDevise, formaterPourcent, formaterRatio } from '../../lib/format'
import { conteneurCascade, elementApparition, elementLateral } from '../../lib/animations'
import type { CleIcone, CodeDevise, MethodeAllocation } from '../../lib/types'

const ICONES_DEPENSE: Record<CleIcone, typeof Home> = {
  logement: Home,
  alimentation: ShoppingBasket,
  energie: Lightbulb,
  transport: Car,
  sante: Heart,
  assurance: ShieldQuestion,
  telecom: Smartphone,
  famille: Users,
  abonnement: Repeat,
  autre: HandCoins,
}

export function PageReglages() {
  const {
    profil,
    frais,
    pression,
    resteVital,
    objectifUrgence,
    progressionUrgencePct,
    montants,
    limiteDette,
    usageDette,
    ratioFutur,
    score,
    definirPrenom,
    definirDevise,
    definirRevenu,
    definirDepense,
    ajouterDepense,
    retirerDepense,
    definirMethode,
    definirAllocation,
    definirSoldeUrgence,
    definirDettes,
    definirTauxRendement,
    reinitialiser,
  } = useFinances()

  return (
    <motion.div
      variants={conteneurCascade}
      initial="cache"
      animate="visible"
      className="grid gap-5 pb-2 xl:grid-cols-[minmax(0,1.62fr)_minmax(320px,1fr)]"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <motion.section
          variants={elementApparition}
          className="rounded-carte border border-encre/[0.06] bg-white p-5 shadow-carte sm:p-6"
        >
          <EnteteSection titre="Ce qui rentre" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="prenom" className="mb-1.5 block text-[12px] font-semibold text-meta">
                Votre prénom
              </label>
              <input
                id="prenom"
                value={profil.prenom}
                onChange={(e) => definirPrenom(e.target.value)}
                maxLength={24}
                className="h-12 w-full rounded-2xl border border-encre/[0.09] bg-white px-4 text-[15px] font-semibold text-encre outline-none transition-all duration-300 focus:border-saphir/45 focus:shadow-[0_16px_36px_-24px_rgba(27,95,140,0.75)]"
              />
            </div>
            <ChampMontant
              libelle="Revenu net mensuel"
              valeur={profil.revenuNet}
              suffixe={profil.devise}
              onChange={definirRevenu}
              aide={`Soit ${formaterDevise(profil.revenuNet * 12, profil.devise, 0)} sur l’année.`}
            />
            <Selecteur
              libelle="Devise"
              valeur={profil.devise}
              options={DEVISES.map((d) => ({
                valeur: d.code as CodeDevise,
                libelle: `${d.code} — ${d.libelle}`,
              }))}
              onChange={definirDevise}
              aide="Le formatage suit la devise choisie, partout."
            />
          </div>
        </motion.section>

        <motion.section
          variants={elementApparition}
          className="rounded-carte border border-encre/[0.06] bg-white p-5 shadow-carte sm:p-6"
        >
          <EnteteSection titre="Frais de maintenance personnelle" />
          <p className="mb-4 text-[12.5px] leading-relaxed text-meta">
            Le coût mensuel pour maintenir une vie stable : logement, nourriture, eau, électricité,
            transport, santé, assurance, télécom, obligations familiales, abonnements essentiels.
            Ni fun money, ni objectifs, ni remboursements — ils ont leur propre poste. Ce total sert
            de base au fonds d’urgence.
          </p>

          <div className="flex flex-col gap-2.5">
            {profil.depenses.map((depense) => {
              const Icone = ICONES_DEPENSE[depense.icone] ?? HandCoins
              return (
                <div
                  key={depense.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-encre/[0.06] bg-papier/60 p-2.5 transition-colors duration-300 hover:bg-papier-100"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-meta shadow-pilule">
                    <Icone size={18} strokeWidth={1.9} />
                  </span>

                  <input
                    value={depense.libelle}
                    aria-label={`Libellé du poste ${depense.libelle}`}
                    onChange={(e) => definirDepense(depense.id, { libelle: e.target.value })}
                    className="h-9 min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 text-[14px] font-semibold text-encre outline-none transition-colors focus:border-encre/10 focus:bg-white"
                  />

                  <div className="flex shrink-0 items-center rounded-xl border border-encre/[0.09] bg-white">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={depense.montant}
                      aria-label={`Montant de ${depense.libelle}`}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        definirDepense(depense.id, { montant: Math.max(0, Number(e.target.value)) })
                      }
                      className="h-9 w-24 rounded-xl bg-transparent px-3 text-right text-[14px] font-bold tabular-nums text-encre outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="pr-3 text-[11px] font-semibold text-meta">
                      {profil.devise}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => retirerDepense(depense.id)}
                    title={`Supprimer ${depense.libelle}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-meta transition-colors duration-300 hover:bg-brique-tint hover:text-brique-deep"
                  >
                    <Trash2 size={15} />
                    <span className="sr-only">Supprimer {depense.libelle}</span>
                  </button>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={ajouterDepense}
            className="mt-3 inline-flex items-center gap-1.5 rounded-pilule border border-dashed border-encre/20 px-4 py-2 text-[12.5px] font-semibold text-meta transition-all duration-300 hover:-translate-y-0.5 hover:border-encre/40 hover:text-encre active:translate-y-0"
          >
            <Plus size={14} />
            Ajouter un poste
          </button>

          <div className="mt-5 grid gap-3 border-t border-encre/[0.06] pt-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
                Total maintenance
              </p>
              <p className="mt-0.5 text-[19px] font-bold tabular-nums text-encre">
                {formaterDevise(frais, profil.devise, 0)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
                Pression sur le revenu
              </p>
              <p className="mt-0.5 text-[19px] font-bold tabular-nums text-encre">
                {formaterRatio(pression)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-meta">
                Reste à affecter
              </p>
              <p
                className={`mt-0.5 text-[19px] font-bold tabular-nums ${
                  resteVital < 0 ? 'text-brique' : 'text-foret-deep'
                }`}
              >
                {formaterDevise(resteVital, profil.devise, 0)}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          variants={elementApparition}
          className="rounded-carte border border-encre/[0.06] bg-white p-5 shadow-carte sm:p-6"
        >
          <EnteteSection titre="Votre méthode d’allocation" />
          <div className="mb-5">
            <Selecteur
              libelle="Méthode"
              valeur={profil.methode}
              options={METHODES.map((m) => ({
                valeur: m.cle as MethodeAllocation,
                libelle: `${m.titre} — ${m.regle}`,
              }))}
              onChange={definirMethode}
              aide={`${formaterPourcent(ratioFutur)} du revenu vont vers la sécurité et le futur. Bouger un curseur bascule en stratégie personnalisée.`}
            />
          </div>

          <div className="flex flex-col gap-5">
            {CATEGORIES.map((categorie) => {
              const couleurs = COULEURS_CATEGORIE[categorie]
              const libelles = LIBELLES_CATEGORIE[categorie]
              return (
                <div key={categorie}>
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-[13.5px] font-bold text-encre">
                      <span className={`h-2.5 w-2.5 rounded-full ${couleurs.puce}`} />
                      {libelles.titre}
                    </span>
                    <span className="text-[13px] font-bold tabular-nums text-encre">
                      {formaterPourcent(profil.allocation[categorie])}
                      <span className="ml-2 font-semibold text-meta">
                        {formaterDevise(montants[categorie], profil.devise, 0)} / mois
                      </span>
                    </span>
                  </div>
                  <Curseur
                    libelle={`Part allouée à ${libelles.titre}`}
                    valeur={profil.allocation[categorie]}
                    min={0}
                    max={100}
                    couleur={couleurs.trait}
                    onChange={(v) => definirAllocation(categorie, v)}
                  />
                  <p className="mt-1.5 text-[11.5px] leading-snug text-meta">{libelles.role}</p>
                </div>
              )
            })}
          </div>
        </motion.section>

        <motion.section
          variants={elementApparition}
          className="rounded-carte border border-encre/[0.06] bg-white p-5 shadow-carte sm:p-6"
        >
          <EnteteSection titre="Dettes personnelles sans intérêt" />
          <p className="mb-4 text-[12.5px] leading-relaxed text-meta">
            Argent emprunté à des proches — famille, amis, collègues. Aucun intérêt n’est modélisé :
            le suivi sert à visualiser une limite d’emprunt que vous vous fixez, et à éviter le
            surendettement. Les crédits bancaires avec intérêts sont hors périmètre.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <ChampMontant
              libelle="Total dû"
              valeur={profil.dettes.total}
              suffixe={profil.devise}
              onChange={(v) => definirDettes({ total: Math.max(0, v) })}
            />
            <ChampMontant
              libelle="Remboursement mensuel prévu"
              valeur={profil.dettes.remboursementMensuel}
              suffixe={profil.devise}
              onChange={(v) => definirDettes({ remboursementMensuel: Math.max(0, v) })}
              aide={`Budget alloué au poste dettes : ${formaterDevise(montants.dettes, profil.devise, 0)}`}
            />
            <ChampMontant
              libelle="Limite d’emprunt"
              valeur={profil.dettes.multiplicateurLimite}
              suffixe="× revenu"
              min={0}
              max={12}
              onChange={(v) => definirDettes({ multiplicateurLimite: Math.max(0, v) })}
              aide={`Soit ${formaterDevise(limiteDette, profil.devise, 0)} — ${formaterRatio(usageDette)} déjà consommés.`}
            />
          </div>
        </motion.section>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <motion.section
          variants={elementLateral}
          className="rounded-carte border border-encre/[0.06] bg-white p-5 shadow-carte"
        >
          <EnteteSection titre="Votre sécurité" />
          <div className="flex flex-col gap-4">
            <ChampMontant
              libelle="Solde du fonds d’urgence"
              valeur={profil.soldeFondsUrgence}
              suffixe={profil.devise}
              onChange={definirSoldeUrgence}
              aide="À garder liquide et accessible, sur un compte séparé. Jamais investi."
            />
            <div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[12px] font-semibold text-meta">
                  Rendement annuel brut retenu
                </span>
                <span className="text-[15px] font-bold tabular-nums text-encre">
                  {formaterPourcent(profil.tauxRendementAnnuel, 1)}
                </span>
              </div>
              <Curseur
                libelle="Rendement annuel brut retenu pour la projection"
                valeur={profil.tauxRendementAnnuel}
                min={0}
                max={15}
                couleur="#1B5F8C"
                onChange={definirTauxRendement}
              />
            </div>
          </div>
        </motion.section>

        <motion.section
          variants={elementLateral}
          className="rounded-carte border border-encre/[0.06] bg-white p-5 shadow-carte"
        >
          <EnteteSection titre="Objectif du fonds d’urgence" />
          <p className="text-[12.5px] leading-relaxed text-meta">
            {formaterDevise(frais, profil.devise, 0)} de maintenance ×{' '}
            {MOIS_OBJECTIF_URGENCE} mois =
          </p>
          <p className="mt-1 text-[28px] font-bold tabular-nums leading-none text-encre">
            {formaterDevise(objectifUrgence, profil.devise, 0)}
          </p>
          <div className="mt-4">
            <BarreProgression valeur={progressionUrgencePct} />
          </div>
          <p className="mt-3 text-[12px] font-semibold text-foret-deep">
            {formaterPourcent(progressionUrgencePct)} atteint
          </p>
        </motion.section>

        <motion.section
          variants={elementLateral}
          className="rounded-carte border border-encre/[0.06] bg-white p-5 shadow-carte"
        >
          <EnteteSection titre="Détail de votre marge" />
          <DetailScore score={score} />
        </motion.section>

        <motion.aside
          variants={elementLateral}
          className="rounded-carte bg-encre p-5 text-white shadow-carte"
        >
          <p className="text-[13px] font-bold">Vos données restent chez vous</p>
          <p className="mt-2 text-[12px] leading-relaxed text-white/60">
            Tout est enregistré dans le stockage local de votre navigateur. Aucun compte, aucun
            serveur, aucune connexion bancaire. Money Guru ne déplace pas un dirham : il montre les
            résultats prévus d’une stratégie, rien de plus.
          </p>
          <button
            type="button"
            onClick={reinitialiser}
            className="mt-4 inline-flex items-center gap-1.5 rounded-pilule border border-white/20 px-3.5 py-2 text-[12px] font-semibold text-white/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:text-white active:translate-y-0"
          >
            <RotateCcw size={13} />
            Repartir des valeurs d’exemple
          </button>
        </motion.aside>
      </div>
    </motion.div>
  )
}
