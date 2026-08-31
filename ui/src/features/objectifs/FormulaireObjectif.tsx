import { useId, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { ChampMontant, Segments, Selecteur } from '../../components/Champs'
import { cleMoisDe, decalerMois } from '../../lib/calendrier'
import { modeFinancement } from '../../lib/objectifs'
import { LIBELLES_CATEGORIE } from '../../lib/definitions'
import { formaterDevise } from '../../lib/format'
import type { Objectif } from '../../lib/types'

/**
 * Les postes qui peuvent financer un achat prévu.
 * Ni la maintenance — un coût subi — ni les dettes, qui se remboursent.
 */
const POSTES: Array<Objectif['categorie']> = [
  'objectifs',
  'fun',
  'investissement',
  'urgence',
]

export type BrouillonObjectif = Omit<Objectif, 'id' | 'achatEnregistre'>

const VIDE = (): BrouillonObjectif => ({
  libelle: '',
  montant: 0,
  moisCible: decalerMois(cleMoisDe(), 6),
  categorie: 'objectifs',
  dejaMisDeCote: 0,
  financement: 'poste',
  versementMensuel: null,
})

/**
 * Un achat prévu : ce qu'on veut, combien, quand, et d'où vient l'argent.
 *
 * Le financement est un choix, jamais deux réglages côte à côte : soit un
 * poste donne le rythme à son ratio, soit vous fixez le montant mensuel.
 * Afficher les deux laisserait croire qu'ils s'additionnent.
 */
export function FormulaireObjectif({
  initial,
  onValider,
  onAnnuler,
}: {
  initial?: Objectif
  onValider: (brouillon: BrouillonObjectif) => void
  onAnnuler?: () => void
}) {
  const { profil, revenuMois } = useFinances()
  const devise = profil.devise
  // deux formulaires peuvent être montés en même temps — la carte de création
  // et la fiche de modification : des identifiants fixes brancheraient les
  // étiquettes sur le mauvais champ
  const idLibelle = useId()
  const idMois = useId()

  const [brouillon, setBrouillon] = useState<BrouillonObjectif>(() =>
    initial
      ? { ...initial, financement: modeFinancement(initial) }
      : VIDE(),
  )

  const maj = (champs: Partial<BrouillonObjectif>) =>
    setBrouillon((b) => ({ ...b, ...champs }))

  const parMontant = brouillon.financement === 'montant'
  const valide = brouillon.libelle.trim().length > 0 && brouillon.montant > 0

  const soumettre = () => {
    if (!valide) return
    onValider({
      ...brouillon,
      libelle: brouillon.libelle.trim(),
      // un mode n'emporte jamais la valeur de l'autre
      versementMensuel: parMontant ? Math.max(0, brouillon.versementMensuel ?? 0) : null,
    })
    if (!initial) setBrouillon(VIDE())
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={idLibelle}
            className="mb-1.5 block text-[12px] font-semibold text-meta"
          >
            Quoi
          </label>
          <input
            id={idLibelle}
            value={brouillon.libelle}
            placeholder="Une moto"
            maxLength={40}
            onChange={(e) => maj({ libelle: e.target.value })}
            className="h-12 w-full rounded-2xl border border-encre/[0.09] bg-white px-4 text-[15px] font-semibold text-encre outline-none transition-all duration-300 placeholder:font-medium placeholder:text-meta/60 focus:border-ciel focus:shadow-[0_16px_36px_-24px_rgba(116,181,213,0.85)]"
          />
        </div>

        <ChampMontant
          libelle="Budget visé"
          valeur={brouillon.montant}
          suffixe={devise}
          onChange={(v) => maj({ montant: Math.max(0, v) })}
        />

        <div>
          <label
            htmlFor={idMois}
            className="mb-1.5 block text-[12px] font-semibold text-meta"
          >
            Mois de l’achat
          </label>
          <input
            id={idMois}
            type="month"
            value={brouillon.moisCible}
            onChange={(e) => maj({ moisCible: e.target.value || brouillon.moisCible })}
            className="h-12 w-full rounded-2xl border border-encre/[0.09] bg-white px-4 text-[15px] font-semibold tabular-nums text-encre outline-none transition-all duration-300 focus:border-ciel focus:shadow-[0_16px_36px_-24px_rgba(116,181,213,0.85)]"
          />
        </div>

        <ChampMontant
          libelle="Déjà mis de côté"
          valeur={brouillon.dejaMisDeCote}
          suffixe={devise}
          onChange={(v) => maj({ dejaMisDeCote: Math.max(0, v) })}
        />
      </div>

      <div className="mt-5 border-t border-encre/[0.06] pt-4">
        <p className="mb-1.5 text-[12px] font-semibold text-meta">Comment vous le financez</p>
        <Segments
          libelle="Mode de financement"
          valeur={brouillon.financement ?? 'poste'}
          options={[
            { valeur: 'poste' as const, libelle: 'Par un poste' },
            { valeur: 'montant' as const, libelle: 'Par un montant fixe' },
          ]}
          onChange={(v) => maj({ financement: v })}
        />

        <div className="mt-4 max-w-[420px]">
          {parMontant ? (
            <ChampMontant
              libelle="Je mets de côté chaque mois"
              valeur={brouillon.versementMensuel ?? 0}
              suffixe={devise}
              onChange={(v) => maj({ versementMensuel: Math.max(0, v) })}
              aide="Le montant que vous comptez vraiment stocker. L’achat sera inscrit sur le poste Objectifs le jour venu."
            />
          ) : (
            <Selecteur
              libelle="Poste qui le finance"
              valeur={brouillon.categorie}
              options={POSTES.map((c) => ({
                valeur: c,
                libelle: `${LIBELLES_CATEGORIE[c].titre} — ${formaterDevise(
                  (revenuMois * profil.allocation[c]) / 100,
                  devise,
                  0,
                )} par mois`,
              }))}
              onChange={(v) => maj({ categorie: v })}
              aide="C’est le ratio de ce poste qui donne le rythme, au revenu de chaque mois."
            />
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={soumettre}
          disabled={!valide}
          className="inline-flex items-center gap-2 rounded-pilule bg-encre px-5 py-3 text-[13.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(39,40,42,0.9)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {initial ? <Check size={15} /> : <Plus size={15} />}
          {initial ? 'Enregistrer les modifications' : 'Ajouter cet objectif'}
        </button>

        {onAnnuler ? (
          <button
            type="button"
            onClick={onAnnuler}
            className="rounded-pilule bg-papier-100 px-4 py-3 text-[13px] font-semibold text-meta transition-colors duration-300 hover:text-encre"
          >
            Annuler
          </button>
        ) : null}
      </div>
    </>
  )
}
