import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useFinances } from '../state/finances'
import { useEstMobile } from '../state/media'
import { moisEnCours, salutation } from '../lib/format'
import type { Vue } from '../lib/types'

/** Titre en deux tons, façon « Welcome Back, Sujon » du layout de référence. */
const TITRES: Record<Vue, { doux: string; fort: string; aide: string }> = {
  tableau: { doux: '', fort: '', aide: '' }, // rempli avec le prénom, voir plus bas
  methodes: {
    doux: 'Comparer',
    fort: 'les méthodes',
    aide: 'Les cinq stratégies projetées sur vos chiffres réels.',
  },
  objectifs: {
    doux: 'Mes',
    fort: 'objectifs',
    aide: 'Un achat, une date, et le verdict de vos chiffres.',
  },
  calendrier: {
    doux: 'Votre',
    fort: 'calendrier des dépenses',
    aide: 'Le rythme réel de vos dépenses, jour par jour.',
  },
  suivi: {
    doux: 'Votre',
    fort: 'suivi mensuel',
    aide: 'Ce qui reste d’un mois passe au suivant.',
  },
  simulateur: {
    doux: 'Simulateur',
    fort: '« et si… »',
    aide: 'Ce que produit un versement régulier, sur la durée que vous choisissez.',
  },
  patrimoine: {
    doux: 'Mon',
    fort: 'patrimoine',
    aide: 'Ce qui est mobilisable, et ce qui ne l’est pas.',
  },
  reglages: {
    doux: 'Mes',
    fort: 'chiffres',
    aide: 'Toutes vos saisies au même endroit.',
  },
}

/**
 * Zone de titre du layout de référence : titre géant à gauche,
 * repère de contexte et actions de page à droite.
 */
export function EntetePage({ vue, onNaviguer }: { vue: Vue; onNaviguer: (v: Vue) => void }) {
  const { profil } = useFinances()
  const mobile = useEstMobile()

  const titre =
    vue === 'tableau'
      ? {
          doux: `${salutation()},`,
          fort: profil.prenom || 'vous',
          aide: `${moisEnCours()} · ${profil.devise}`,
        }
      : TITRES[vue]

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-1">
      <div className="min-w-0">
        <h1 className="truncate text-[34px] leading-[1.1] tracking-tight sm:text-[44px]">
          <span className="font-display italic text-meta">{titre.doux} </span>
          <span className="font-bold text-encre">{titre.fort}</span>
        </h1>
        <p className="mt-1 text-[13px] font-medium text-meta">{titre.aide}</p>
      </div>

      {/* au téléphone, l'ajout vit dans le disque de synthèse : pas deux fois */}
      {mobile ? null : (
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNaviguer('calendrier')}
          className="inline-flex items-center gap-2 rounded-pilule bg-white px-4 py-2.5 text-[13.5px] font-semibold text-encre shadow-pilule ring-1 ring-encre/[0.08] transition-shadow duration-300 hover:shadow-md"
        >
          <Plus size={17} strokeWidth={2.2} />
          Ajouter une dépense
        </motion.button>
      )}
    </div>
  )
}
