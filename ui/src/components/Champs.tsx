import { useId } from 'react'
import { ChevronDown } from 'lucide-react'

/** Curseur habillé : la piste se colore jusqu'au pouce. */
export function Curseur({
  valeur,
  min,
  max,
  pas = 1,
  couleur = '#27282A',
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
        background: `linear-gradient(to right, ${couleur} 0%, ${couleur} ${ratio}%, rgba(39, 40, 42,0.1) ${ratio}%, rgba(39, 40, 42,0.1) 100%)`,
      }}
    />
  )
}

/**
 * Réglage fin d'un pourcentage : on tape la valeur exacte, ou on l'ajuste
 * point par point. Le curseur donne le geste rapide, ce compteur donne la
 * précision — viser 23 % à la souris sur une piste de 100 est illusoire.
 */
export function CompteurPourcent({
  valeur,
  onChange,
  libelle,
  pas = 1,
}: {
  valeur: number
  onChange: (v: number) => void
  /** Nom lisible du poste réglé, pour l'étiquette d'accessibilité. */
  libelle: string
  pas?: number
}) {
  const borner = (v: number) => Math.min(100, Math.max(0, Math.round(v)))
  const classeBouton =
    'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[15px] font-bold leading-none text-meta transition-colors duration-200 hover:bg-papier-100 hover:text-encre disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div className="inline-flex items-center gap-0.5 rounded-pilule border border-encre/[0.09] bg-white px-1 py-1">
      <button
        type="button"
        onClick={() => onChange(borner(valeur - pas))}
        disabled={valeur <= 0}
        title={`Baisser ${libelle} de ${pas} point`}
        className={classeBouton}
      >
        <span aria-hidden>−</span>
        <span className="sr-only">Baisser {libelle}</span>
      </button>

      <div className="flex items-center">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          step={pas}
          value={valeur}
          aria-label={`Part de ${libelle} en pourcent`}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => onChange(borner(Number(e.target.value)))}
          className="w-11 bg-transparent text-right text-[14px] font-bold tabular-nums text-encre outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="pl-0.5 pr-1 text-[12px] font-semibold text-meta">%</span>
      </div>

      <button
        type="button"
        onClick={() => onChange(borner(valeur + pas))}
        disabled={valeur >= 100}
        title={`Monter ${libelle} de ${pas} point`}
        className={classeBouton}
      >
        <span aria-hidden>+</span>
        <span className="sr-only">Monter {libelle}</span>
      </button>
    </div>
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
      <div className="group relative flex items-center rounded-2xl border border-encre/[0.09] bg-white transition-all duration-300 focus-within:border-ciel focus-within:shadow-[0_16px_36px_-24px_rgba(116,181,213,0.85)]">
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
      <div className="relative flex items-center rounded-2xl border border-encre/[0.09] bg-white transition-all duration-300 focus-within:border-ciel focus-within:shadow-[0_16px_36px_-24px_rgba(116,181,213,0.85)]">
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
      className="inline-flex rounded-pilule border border-encre/[0.08] bg-papier-100 p-1"
    >
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          onClick={() => onChange(o.valeur)}
          aria-pressed={valeur === o.valeur}
          className={`rounded-pilule px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-300 ${
            valeur === o.valeur
              ? 'bg-encre text-white shadow-[0_8px_20px_-10px_rgba(39, 40, 42,0.7)]'
              : 'text-meta hover:text-encre'
          }`}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  )
}
