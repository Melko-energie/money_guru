import { moisDeCleJour } from './calendrier'
import { LIBELLES_CAPITAL, LIBELLES_CATEGORIE } from './definitions'
import { METHODES } from './methodes'
import type { Categorie, ProfilFinancier, Vue } from './types'

export type ResultatRecherche = {
  id: string
  /** Ce qui s'affiche en gras. */
  titre: string
  /** La ligne de contexte en dessous. */
  detail: string
  famille: 'Dépenses' | 'Frais de maintenance' | 'Vues' | 'Méthodes' | 'Patrimoine'
  vue: Vue
  /** Mois à afficher en arrivant, pour les résultats datés. */
  mois?: string
  jour?: string
  categorie?: Categorie
}

const NB_MAX = 8

/** Sans accents ni casse : « Café » trouve « cafe ». */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

const VUES: Array<{ vue: Vue; titre: string; detail: string }> = [
  { vue: 'tableau', titre: 'Tableau de bord', detail: 'Votre situation du mois' },
  { vue: 'methodes', titre: 'Comparer les méthodes', detail: 'Les cinq stratégies' },
  { vue: 'calendrier', titre: 'Calendrier des dépenses', detail: 'Le mois jour par jour' },
  { vue: 'suivi', titre: 'Suivi mensuel', detail: 'Ce qui reste passe au mois suivant' },
  { vue: 'simulateur', titre: 'Simulateur « et si… »', detail: 'Projection paramétrable' },
  { vue: 'patrimoine', titre: 'Mon patrimoine', detail: 'Vos cinq classes de capital' },
  { vue: 'reglages', titre: 'Mes chiffres', detail: 'Toutes vos saisies' },
]

/**
 * Cherche dans ce que l'utilisateur a réellement saisi — ses dépenses, ses
 * postes de frais — puis dans les vues, les méthodes et les classes de
 * patrimoine. Chaque résultat sait où il mène.
 */
export function rechercher(profil: ProfilFinancier, texte: string): ResultatRecherche[] {
  const q = normaliser(texte)
  if (q.length < 2) return []

  const resultats: ResultatRecherche[] = []
  const correspond = (...champs: Array<string | undefined>) =>
    champs.some((c) => c && normaliser(c).includes(q))

  // les dépenses datées, la plus récente en premier
  const journal = [...profil.journal].sort((a, b) => b.date.localeCompare(a.date))
  for (const ligne of journal) {
    if (!correspond(ligne.libelle, ligne.note, LIBELLES_CATEGORIE[ligne.categorie].titre)) continue
    resultats.push({
      id: `journal-${ligne.id}`,
      titre: ligne.libelle,
      detail: `${LIBELLES_CATEGORIE[ligne.categorie].titre} · ${ligne.date}`,
      famille: 'Dépenses',
      vue: 'calendrier',
      mois: moisDeCleJour(ligne.date),
      jour: ligne.date,
      categorie: ligne.categorie,
    })
  }

  for (const poste of profil.depenses) {
    if (!correspond(poste.libelle)) continue
    resultats.push({
      id: `frais-${poste.id}`,
      titre: poste.libelle,
      detail: 'Poste de maintenance personnelle',
      famille: 'Frais de maintenance',
      vue: 'reglages',
    })
  }

  for (const v of VUES) {
    if (!correspond(v.titre, v.detail)) continue
    resultats.push({ id: `vue-${v.vue}`, titre: v.titre, detail: v.detail, famille: 'Vues', vue: v.vue })
  }

  for (const m of METHODES) {
    if (!correspond(m.titre, m.promesse, m.regle)) continue
    resultats.push({
      id: `methode-${m.cle}`,
      titre: m.titre,
      detail: m.promesse,
      famille: 'Méthodes',
      vue: 'methodes',
    })
  }

  for (const [cle, fiche] of Object.entries(LIBELLES_CAPITAL)) {
    if (!correspond(fiche.titre, fiche.role)) continue
    resultats.push({
      id: `capital-${cle}`,
      titre: fiche.titre,
      detail: 'Classe de patrimoine',
      famille: 'Patrimoine',
      vue: 'patrimoine',
    })
  }

  return resultats.slice(0, NB_MAX)
}
