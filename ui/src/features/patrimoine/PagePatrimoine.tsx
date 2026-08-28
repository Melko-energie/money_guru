import { useState } from 'react'
import { motion } from 'framer-motion'
import { Banknote, Boxes, Handshake, Landmark, Sofa, Wallet } from 'lucide-react'
import { useFinances } from '../../state/finances'
import { Anneau } from '../../components/Anneau'
import { ChampMontant } from '../../components/Champs'
import { EnteteSection } from '../../components/EnteteSection'
import { LIBELLES_CAPITAL } from '../../lib/definitions'
import { formaterCompact, formaterDevise, formaterRatio } from '../../lib/format'
import { conteneurCascade, elementApparition, elementLateral } from '../../lib/animations'
import type { CategorieCapital } from '../../lib/types'

const CLASSES: CategorieCapital[] = ['liquide', 'creances', 'investi', 'revente', 'usage']

const ICONES: Record<CategorieCapital, typeof Wallet> = {
  liquide: Banknote,
  creances: Handshake,
  investi: Landmark,
  revente: Boxes,
  usage: Sofa,
}

/**
 * Vue capital du context §6.6 : structurer le patrimoine suivi en s'inspirant
 * des grandes classes utilisées pour la zakat, sans être un calculateur de zakat.
 */
export function PagePatrimoine() {
  const { profil, capitalProductif, patrimoineComplet, definirPatrimoine } = useFinances()
  const [actif, setActif] = useState<CategorieCapital | null>(null)

  const productives = CLASSES.filter((c) => LIBELLES_CAPITAL[c].productif)

  const segments = productives.map((c) => ({
    cle: c,
    valeur: profil.patrimoine[c],
    degrade: LIBELLES_CAPITAL[c].degrade,
    libelle: LIBELLES_CAPITAL[c].titre,
  }))

  const misEnAvant = actif
    ? { titre: LIBELLES_CAPITAL[actif].titre, montant: profil.patrimoine[actif] }
    : { titre: 'Capital mobilisable', montant: capitalProductif }

  return (
    <motion.div
      variants={conteneurCascade}
      initial="cache"
      animate="visible"
      className="grid gap-5 pb-2 xl:grid-cols-[minmax(0,1fr)_minmax(300px,330px)]"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <motion.section
          variants={elementApparition}
          className="relative overflow-hidden rounded-carte bg-gradient-to-br from-papier-100 via-papier to-saphir-tint p-6 shadow-carte ring-1 ring-encre/[0.06] sm:p-7"
        >
          <span className="inline-flex items-center gap-1.5 rounded-pilule bg-white px-3 py-1.5 text-[11.5px] font-bold text-saphir-deep shadow-pilule">
            <Wallet size={12} />
            Ce qui est réellement mobilisable
          </span>

          <h2 className="mt-4 text-[36px] leading-[1.04] sm:text-[44px]">
            <span className="font-display italic text-meta">Capital productif </span>
            <br />
            <span className="font-bold tabular-nums text-encre">
              {formaterDevise(capitalProductif, profil.devise, 0)}
            </span>
          </h2>

          <p className="mt-3 max-w-[58ch] text-[13.5px] leading-relaxed text-meta">
            Sur {formaterDevise(patrimoineComplet, profil.devise, 0)} de patrimoine total,{' '}
            {formaterRatio(patrimoineComplet > 0 ? capitalProductif / patrimoineComplet : 0)} sont
            mobilisables ou productifs. Le reste — voiture, mobilier, objets du quotidien — a de la
            valeur, mais ne finance rien et ne se vend pas du jour au lendemain.
          </p>
        </motion.section>

        <motion.section
          variants={elementApparition}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <EnteteSection
            icone={Wallet}
            titre="Vos classes de patrimoine"
            sousTitre="Mobilisable d’un côté, biens d’usage de l’autre"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {CLASSES.map((cle) => {
              const fiche = LIBELLES_CAPITAL[cle]
              const Icone = ICONES[cle]
              return (
                <article
                  key={cle}
                  onMouseEnter={() => setActif(cle)}
                  onMouseLeave={() => setActif(null)}
                  className={`carte-douce p-4 ${fiche.productif ? '' : 'opacity-90'}`}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
                      style={{
                        background: `linear-gradient(140deg, ${fiche.degrade[0]}, ${fiche.degrade[1]})`,
                      }}
                    >
                      <Icone size={18} strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[13.5px] font-bold leading-tight text-encre">
                        {fiche.titre}
                      </h3>
                      <p className="mt-0.5 text-[11px] font-semibold text-meta">
                        {fiche.productif ? 'Mobilisable' : 'Bien d’usage — compté à part'}
                      </p>
                    </div>
                  </div>

                  <ChampMontant
                    libelle={`Valeur estimée`}
                    valeur={profil.patrimoine[cle]}
                    suffixe={profil.devise}
                    onChange={(v) => definirPatrimoine(cle, v)}
                    aide={fiche.role}
                  />
                </article>
              )
            })}
          </div>
        </motion.section>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <motion.section
          variants={elementLateral}
          className="relative flex flex-col overflow-hidden rounded-carte bg-encre p-5 text-white shadow-carte sm:p-6"
        >
          <h2 className="mb-2 text-[19px] font-bold leading-none">Composition</h2>

          <div className="relative grid flex-1 place-items-center py-2">
            <Anneau
              segments={segments}
              taille={224}
              epaisseur={19}
              segmentActif={actif}
              enfant={
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/50">
                    {misEnAvant.titre}
                  </p>
                  <p className="mt-1 text-[28px] font-bold leading-none tabular-nums">
                    {formaterCompact(misEnAvant.montant)}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-white/50">{profil.devise}</p>
                </div>
              }
            />
          </div>

          <ul className="relative mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
            {CLASSES.map((cle) => (
              <li key={cle} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[12px] font-medium text-white/70">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: `linear-gradient(140deg, ${LIBELLES_CAPITAL[cle].degrade[0]}, ${LIBELLES_CAPITAL[cle].degrade[1]})`,
                    }}
                  />
                  {LIBELLES_CAPITAL[cle].titre}
                </span>
                <span className="text-[12px] font-bold tabular-nums">
                  {formaterCompact(profil.patrimoine[cle])}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.aside
          variants={elementLateral}
          className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]"
        >
          <h3 className="text-[13.5px] font-bold text-encre">Pourquoi cette découpe</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-meta">
            Elle reprend les grandes classes utilisées pour évaluer un patrimoine dans les calculs
            de zakat, parce qu’elles distinguent bien ce qui est disponible de ce qui ne l’est pas.
            Money Guru s’arrête là : ce n’est pas un calculateur de zakat, et aucun seuil ni taux
            n’est appliqué.
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-meta">
            L’intérêt pratique est simple : votre voiture vaut peut-être{' '}
            {formaterDevise(profil.patrimoine.usage, profil.devise, 0)}, mais elle ne paiera pas
            vos six mois de charges. Seul le capital mobilisable le fera.
          </p>
        </motion.aside>
      </div>
    </motion.div>
  )
}
