import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { Depliable } from './Depliable'
import { AVERTISSEMENT } from '../lib/pedagogie'
import type { Note } from '../lib/pedagogie'
import { elementApparition } from '../lib/animations'

/**
 * Zone pédagogique du context §7.5. Les notes sont repliées : on lit les
 * questions, on ouvre celle qui intéresse. Aucun texte n'est perdu.
 */
export function ZonePedagogique({ notes }: { notes: Note[] }) {
  return (
    <motion.section
      variants={elementApparition}
      className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-papier-100 text-encre/70">
          <BookOpen size={18} strokeWidth={1.9} />
        </span>
        <div>
          <h2 className="text-[15.5px] font-bold leading-tight text-encre">À garder en tête</h2>
          <p className="text-[12px] leading-tight text-meta">
            {notes.length} note(s) liées à votre situation — cliquez pour lire
          </p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-encre/[0.06]">
        {notes.map((n) => (
          <div key={n.id} className="py-3 first:pt-0 last:pb-0">
            <Depliable titre={n.titre}>
              <p className="text-[12px] leading-relaxed text-meta">{n.texte}</p>
            </Depliable>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-encre/[0.06] pt-3 text-[11px] leading-relaxed text-meta">
        {AVERTISSEMENT}
      </p>
    </motion.section>
  )
}
