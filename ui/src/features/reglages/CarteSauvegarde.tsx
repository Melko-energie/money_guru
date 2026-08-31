import { HardDriveDownload } from 'lucide-react'
import { EnteteSection } from '../../components/EnteteSection'
import { BoutonEnregistrerCopie, RestaurerCopie } from '../../components/Sauvegarde'

/**
 * Une copie sur votre disque, indépendante du navigateur et du réseau.
 * Un stockage local se vide sans prévenir — nettoyage du navigateur, session
 * privée, changement de machine. Un fichier, lui, reste.
 */
export function CarteSauvegarde() {
  return (
    <section className="rounded-carte bg-white p-5 shadow-carte ring-1 ring-encre/[0.05]">
      <EnteteSection
        icone={HardDriveDownload}
        titre="Copie de sécurité"
        sousTitre="Un fichier, sur votre disque"
      />

      <p className="text-[12.5px] leading-relaxed text-meta">
        Le stockage d’un navigateur peut se vider sans prévenir : un nettoyage, une session
        privée, un changement de machine. Un fichier, lui, reste. Prenez-en un de temps en temps.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <BoutonEnregistrerCopie />
        <RestaurerCopie />
      </div>
    </section>
  )
}
