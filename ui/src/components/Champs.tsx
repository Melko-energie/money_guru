import { useId } from 'react'
import { ChevronDown } from 'lucide-react'

/** Curseur habillé : la piste se colore jusqu'au pouce. */
export function Curseur({
  valeur,
  min,
  max,
  pas = 1,
  couleur = '#0E1A24',
  onChange,
  libelle,
}: {
  valeur: number
  min: number
  max: number
  pas?: number
  couleur?: string
  onChange: (v: number) => void
  libelle: string
}) {
  const ratio = max === min ? 0 : ((valeur - min) / (max - min)) * 100
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={pas}
      value={valeur}
      aria-label={libelle}
      onChange={(e) => onChange(Number(e.target.value))}
      className="curseur"
      style={{
        background: `linear-gradient(to right, ${couleur} 0%, ${couleur} ${ratio}%, rgba(14,26,36,0.1) ${ratio}%, rgba(14,26,36,0.1) 100%)`,
      }}
    />
  )
}

/** Champ numérique avec suffixe intégré (devise, %, ×…). */
export function ChampMontant({
  valeur,
  onChange,
  libelle,
  suffixe,
  min = 0,
  max,
  aide,
}: {
  valeur: number
  onChange: (v: number) => void
  libelle: string
  suffixe: string
  min?: number
  max?: number
  aide?: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-meta">
        {libelle}
      </label>
      <div className="group relative flex items-center rounded-2xl border border-encre/[0.09] bg-white transition-all duration-300 focus-within:border-saphir/45 focus-within:shadow-[0_16px_36px_-24px_rgba(27,95,140,0.75)]">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={Number.isFinite(valeur) ? valeur : 0}
          min={min}
          max={max}
          // « any » : un montant libre ne doit jamais être bloqué par la
          // validation HTML, sinon le formulaire refuse de se soumettre
          step="any"
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-12 w-full min-w-0 rounded-2xl bg-transparent px-4 text-[15px] font-semibold tabular-nums text-encre outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="pointer-events-none pr-4 text-[12px] font-semibold text-meta">{suffixe}</span>
      </div>
      {aide ? <p className="mt-1.5 text-[11.5px] leading-snug text-meta">{aide}</p> : null}
    </div>
  )
}

/** Liste déroulante habillée — devise, méthode, redirection. */
export function Selecteur<T extends string>({
  valeur,
  options,
  onChange,
  libelle,
  aide,
}: {
  valeur: T
  options: Array<{ valeur: T; libelle: string }>
  onChange: (v: T) => void
  libelle: string
  aide?: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-meta">
        {libelle}
      </label>
      <div className="relative flex items-center rounded-2xl border border-encre/[0.09] bg-white transition-all duration-300 focus-within:border-saphir/45 focus-within:shadow-[0_16px_36px_-24px_rgba(27,95,140,0.75)]">
        <select
          id={id}
          value={valeur}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-12 w-full cursor-pointer appearance-none rounded-2xl bg-transparent px-4 pr-10 text-[15px] font-semibold text-encre outline-none"
        >
          {options.map((o) => (
            <option key={o.valeur} value={o.valeur}>
              {o.libelle}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-4 text-meta" />
      </div>
      {aide ? <p className="mt-1.5 text-[11.5px] leading-snug text-meta">{aide}</p> : null}
    </div>
  )
}

/** Groupe de boutons exclusifs, façon segmented control. */
export function Segments<T extends string>({
  valeur,
  options,
  onChange,
  libelle,
}: {
  valeur: T
  options: Array<{ valeur: T; libelle: string }>
  onChange: (v: T) => void
  libelle: string
}) {
  return (
    <div
      role="group"
      aria-label={libelle}
      className="inline-flex rounded-pilule border border-encre/[0.08] bg-papier/80 p-1"
    >
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          onClick={() => onChange(o.valeur)}
          aria-pressed={valeur === o.valeur}
          className={`rounded-pilule px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-300 ${
            valeur === o.valeur
              ? 'bg-encre text-white shadow-[0_8px_20px_-10px_rgba(14,26,36,0.7)]'
              : 'text-meta hover:text-encre'
          }`}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  )
}
