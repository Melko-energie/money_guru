import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react'
import { Depliable } from './Depliable'
import type { Alerte, NiveauAlerte } from '../lib/types'

const STYLES: Record<NiveauAlerte, { fond: string; texte: string; icone: typeof Info }> = {
  danger: { fond: 'bg-alerte-tint', texte: 'text-alerte-deep', icone: OctagonAlert },
  attention: { fond: 'bg-ambre-tint', texte: 'text-ambre-deep', icone: AlertTriangle },
  info: { fond: 'bg-succes-tint', texte: 'text-succes-deep', icone: Info },
}

/**
 * Alertes contextuelles (FR-08), les plus graves d'abord.
 * Le titre suffit à comprendre ; le détail s'ouvre au clic — sauf pour un
 * danger, qui reste déplié d'office.
 */
export function BandeauAlertes({ alertes }: { alertes: Alerte[] }) {
  if (alertes.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-succes-tint px-4 py-3">
        <CheckCircle2 size={17} className="shrink-0 text-succes-deep" />
        <p className="text-[12.5px] font-medium text-succes-deep">
          Rien à signaler : maintenance, dette et sécurité sont dans les repères.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {alertes.map((a) => {
          const style = STYLES[a.niveau]
          const Icone = style.icone
          return (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className={`rounded-2xl px-4 py-3 ${style.fond}`}
            >
              <Depliable
                titre={a.titre}
                ouvertParDefaut={a.niveau === 'danger'}
                classeTitre={style.texte}
                classeAide={style.texte}
                icone={<Icone size={17} className={style.texte} />}
              >
                <p className={`text-[12px] leading-relaxed ${style.texte} opacity-80`}>
                  {a.message}
                </p>
              </Depliable>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
