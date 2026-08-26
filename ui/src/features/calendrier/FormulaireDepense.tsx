import { useEffect, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { ChampMontant, Selecteur } from '../../components/Champs'
import { CATEGORIES } from '../../lib/calculs'
import { LIBELLES_CATEGORIE } from '../../lib/donneesDemo'
import type { Categorie, CodeDevise, DepenseDatee } from '../../lib/types'

export type BrouillonDepense = Omit<DepenseDatee, 'id'>

/** Saisie et modification d'une dépense datée (FR-12). */
export function FormulaireDepense({
  date,
  devise,
  initial,
  onValider,
  onAnnuler,
}: {
  date: string
  devise: CodeDevise
  /** Fourni en modification, absent en création. */
  initial?: DepenseDatee
  onValider: (brouillon: BrouillonDepense) => void
  onAnnuler?: () => void
}) {
  const [libelle, setLibelle] = useState(initial?.libelle ?? '')
  const [montant, setMontant] = useState(initial?.montant ?? 0)
  const [categorie, setCategorie] = useState<Categorie>(initial?.categorie ?? 'fun')
  const [note, setNote] = useState(initial?.note ?? '')
  const [recurrent, setRecurrent] = useState(initial?.recurrent ?? false)

  useEffect(() => {
    if (initial) return
    setLibelle('')
    setMontant(0)
    setNote('')
    setRecurrent(false)
  }, [date, initial])

  const valide = libelle.trim().length > 0 && montant > 0

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!valide) return
        onValider({
          date: initial?.date ?? date,
          montant,
          devise,
          categorie,
          libelle: libelle.trim(),
          note: note.trim() || undefined,
          recurrent,
          serie: initial?.serie,
        })
        if (!initial) {
          setLibelle('')
          setMontant(0)
          setNote('')
          setRecurrent(false)
        }
      }}
      className="rounded-2xl border border-encre/[0.07] bg-papier/60 p-3.5"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`libelle-${initial?.id ?? 'nouveau'}`}
            className="mb-1.5 block text-[12px] font-semibold text-meta"
          >
            Libellé court
          </label>
          <input
            id={`libelle-${initial?.id ?? 'nouveau'}`}
            value={libelle}
            maxLength={48}
            placeholder="Courses, restaurant, essence…"
            onChange={(e) => setLibelle(e.target.value)}
            className="h-11 w-full rounded-2xl border border-encre/[0.09] bg-white px-3.5 text-[14px] font-semibold text-encre outline-none transition-all duration-300 placeholder:font-normal placeholder:text-meta focus:border-saphir/45 focus:shadow-[0_16px_36px_-24px_rgba(27,95,140,0.75)]"
          />
        </div>

        <ChampMontant
          libelle="Montant"
          valeur={montant}
          suffixe={devise}
          onChange={setMontant}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Selecteur
          libelle="Catégorie"
          valeur={categorie}
          options={CATEGORIES.map((c) => ({ valeur: c, libelle: LIBELLES_CATEGORIE[c].titre }))}
          onChange={setCategorie}
        />

        <div>
          <label
            htmlFor={`note-${initial?.id ?? 'nouveau'}`}
            className="mb-1.5 block text-[12px] font-semibold text-meta"
          >
            Note <span className="font-normal">(optionnelle)</span>
          </label>
          <input
            id={`note-${initial?.id ?? 'nouveau'}`}
            value={note}
            maxLength={120}
            onChange={(e) => setNote(e.target.value)}
            className="h-11 w-full rounded-2xl border border-encre/[0.09] bg-white px-3.5 text-[13.5px] text-encre outline-none transition-all duration-300 focus:border-saphir/45"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] font-semibold text-meta">
          <input
            type="checkbox"
            checked={recurrent}
            onChange={(e) => setRecurrent(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-[#1B5F8C]"
          />
          Récurrente — la projeter sur les mois suivants
        </label>

        <div className="flex items-center gap-2">
          {onAnnuler ? (
            <button
              type="button"
              onClick={onAnnuler}
              className="inline-flex items-center gap-1.5 rounded-pilule border border-encre/10 px-3.5 py-2 text-[12.5px] font-semibold text-meta transition-colors duration-300 hover:text-encre"
            >
              <X size={13} />
              Annuler
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!valide}
            className="inline-flex items-center gap-1.5 rounded-pilule bg-encre px-4 py-2 text-[12.5px] font-semibold text-white shadow-[0_12px_26px_-14px_rgba(14,26,36,0.9)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-35 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {initial ? <Check size={13} /> : <Plus size={13} />}
            {initial ? 'Enregistrer' : 'Ajouter la dépense'}
          </button>
        </div>
      </div>
    </form>
  )
}
