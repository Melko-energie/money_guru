import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useFinances } from '../state/finances'
import { BOUTON_PLEIN, BOUTON_VIDE, Panne } from './Boutons'
import { lireSauvegarde, nomSauvegarde } from '../lib/profil'
import { horodatage } from '../lib/synchro'
import { formaterDevise } from '../lib/format'
import type { ProfilFinancier } from '../lib/types'

/**
 * `FileReader` plutôt que `File.text()` : la seconde manque encore sur les
 * navigateurs anciens, et la lecture d'une sauvegarde ne doit jamais dépendre
 * de la fraîcheur du navigateur.
 */
function lireFichier(fichier: File): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader()
    lecteur.onload = () => resoudre(String(lecteur.result ?? ''))
    lecteur.onerror = () => rejeter(new Error('Ce fichier n’a pas pu être ouvert.'))
    lecteur.readAsText(fichier)
  })
}

export function BoutonEnregistrerCopie() {
  const { profil } = useFinances()
  return (
    <button
      type="button"
      className={BOUTON_PLEIN}
      onClick={() => {
        const contenu = JSON.stringify(profil, null, 2)
        const adresse = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }))
        const lien = document.createElement('a')
        lien.href = adresse
        lien.download = nomSauvegarde()
        lien.click()
        URL.revokeObjectURL(adresse)
      }}
    >
      <Download size={13} />
      Enregistrer une copie
    </button>
  )
}

/**
 * Ouvrir un fichier de sauvegarde, où que l'on soit.
 * Ce chemin ne dépend ni du réseau, ni d'un compte, ni d'une base : c'est le
 * seul qui marche toujours, y compris quand la synchronisation refuse.
 */
export function RestaurerCopie({ pleineLargeur = false }: { pleineLargeur?: boolean }) {
  const { remplacerProfil } = useFinances()
  const champ = useRef<HTMLInputElement>(null)
  const [candidat, setCandidat] = useState<ProfilFinancier | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const ouvrir = async (fichier: File) => {
    setErreur(null)
    try {
      setCandidat(lireSauvegarde(await lireFichier(fichier)))
    } catch (e) {
      setCandidat(null)
      setErreur(e instanceof Error ? e.message : 'Ce fichier n’a pas pu être lu.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => champ.current?.click()}
        className={`${BOUTON_VIDE} ${pleineLargeur ? 'w-full' : ''}`}
      >
        <Upload size={13} />
        Restaurer une copie
      </button>
      <input
        ref={champ}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Fichier de sauvegarde à restaurer"
        onChange={(e) => {
          const fichier = e.target.files?.[0]
          if (fichier) void ouvrir(fichier)
          e.target.value = ''
        }}
      />

      {erreur ? (
        <div className="mt-3 w-full">
          <Panne texte={erreur} />
        </div>
      ) : null}

      {candidat ? (
        <div className="mt-3 w-full rounded-2xl border border-encre/[0.09] p-4">
          <p className="text-[12.5px] font-bold text-encre">Ce fichier contient</p>
          <ul className="mt-2 flex flex-col gap-1 text-[11.5px] text-meta">
            <li>
              {candidat.prenom || 'sans prénom'} · revenu{' '}
              {formaterDevise(candidat.revenuNet, candidat.devise, 0)}
            </li>
            <li>
              {Object.keys(candidat.mois).length} mois renseignés · {candidat.journal.length}{' '}
              dépenses saisies
            </li>
            <li>
              {candidat.depenses.length} postes de frais · {candidat.objectifs.length} objectifs
            </li>
          </ul>
          <p className="mt-3 text-[11.5px] leading-relaxed text-brique-deep">
            Restaurer remplace tout ce qui est affiché aujourd’hui.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={BOUTON_PLEIN}
              onClick={() => {
                // restaurer est un geste volontaire : la copie restaurée doit
                // l'emporter sur les autres appareils, donc elle repart datée
                remplacerProfil({ ...candidat, majLe: horodatage() })
                setCandidat(null)
              }}
            >
              Remplacer par ce fichier
            </button>
            <button type="button" onClick={() => setCandidat(null)} className={BOUTON_VIDE}>
              Annuler
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
