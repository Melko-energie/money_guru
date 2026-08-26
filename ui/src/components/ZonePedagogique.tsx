import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { AVERTISSEMENT } from '../lib/pedagogie'
import type { Note } from '../lib/pedagogie'
import { elementApparition } from '../lib/animations'

/** Zone pédagogique du context §7.5 : textes courts liés aux alertes en cours. */
export function ZonePedagogique({ notes }: { notes: Note[] }) {
  return (
    <motion.section
      variants={elementApparition}
      className="rounded-carte border border-encre/[0.06] bg-white p-5 shadow-carte sm:p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <BookOpen size={16} className="text-meta" />
        <h2 className="text-[19px] font-bold leading-none text-encre">À garder en tête</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {notes.map((n) => (
          <article key={n.id} className="carte-douce p-4">
            <h3 className="text-[13.5px] font-bold leading-snug text-encre">{n.titre}</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-meta">{n.texte}</p>
          </article>
        ))}
      </div>

      <p className="mt-4 border-t border-encre/[0.06] pt-3 text-[11px] leading-relaxed text-meta">
        {AVERTISSEMENT}
      </p>
    </motion.section>
  )
}
