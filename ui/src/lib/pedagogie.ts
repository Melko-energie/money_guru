import {
  ANNEES_CARRIERE,
  MOIS_OBJECTIF_URGENCE,
  SEUIL_PRESSION_MAINTENANCE,
  SEUIL_RATIO_REMBOURSEMENT,
  moisCouverts,
  objectifFondsUrgence,
  pressionMaintenance,
  progressionUrgence,
  ratioRemboursement,
  resteApresMaintenance,
  usageLimiteEmprunt,
} from './calculs'
import { formaterDevise, formaterDuree, formaterRatio } from './format'
import type { Alerte, ProfilFinancier } from './types'

export type Note = {
  id: string
  titre: string
  texte: string
}

/** Les garde-fous du context §7.5 : courts, utiles, actionnables. */
const NOTES: Note[] = [
  {
    id: 'maintenance-vs-fun',
    titre: 'Pourquoi séparer maintenance et fun money',
    texte:
      'Les frais de maintenance sont subis : ils reviennent chaque mois, que vous le vouliez ou non. Le fun money est choisi. Les mélanger fait croire que tout est incompressible, alors que seule une part l’est vraiment.',
  },
  {
    id: 'urgence-liquide',
    titre: 'Pourquoi le fonds d’urgence reste liquide',
    texte:
      'Un fonds d’urgence sert le jour où tout va mal — souvent le pire moment pour vendre un placement. Il se garde disponible, sur un compte séparé, jamais investi.',
  },
  {
    id: 'rendement-non-garanti',
    titre: 'Pourquoi les rendements ne sont pas garantis',
    texte:
      'Un taux annuel est une hypothèse, pas une promesse. Les marchés montent et descendent, et un rendement passé ne dit rien du prochain. Les chiffres affichés ici sont bruts : ni frais, ni impôt, ni inflation.',
  },
  {
    id: 'emprunter-pour-investir',
    titre: 'Pourquoi emprunter pour investir est dangereux',
    texte:
      'La dette est certaine, le rendement ne l’est pas. Si le placement baisse, la dette, elle, reste due. Money Guru ne suit que des dettes personnelles sans intérêt, et jamais pour financer un investissement.',
  },
  {
    id: 'commencer-tot',
    titre: 'Pourquoi commencer tôt change tout',
    texte: `Sur ${ANNEES_CARRIERE} ans, l’essentiel du capital ne vient pas de ce que vous versez mais de ce que les versements produisent. Chaque année de retard retire une année de composition — celle qui rapportait le plus.`,
  },
  {
    id: 'ratios-reperes',
    titre: 'Pourquoi les ratios sont des repères',
    texte:
      '50/30/20 ou 70/30 sont des points de départ pensés pour des situations moyennes. Votre loyer, votre ville et vos charges familiales ne sont pas moyens. Ajustez, mais gardez la logique : chaque dirham reçoit une affectation.',
  },
]

export function note(id: string): Note | undefined {
  return NOTES.find((n) => n.id === id)
}

/** Alertes contextuelles (FR-08), les plus graves en premier. */
export function alertes(profil: ProfilFinancier, revenu = profil.revenuNet): Alerte[] {
  const liste: Alerte[] = []
  const { devise } = profil

  const pression = pressionMaintenance(revenu, profil.depenses)
  const reste = resteApresMaintenance(revenu, profil.depenses)
  const usageDette = usageLimiteEmprunt(revenu, profil.dettes)
  const ratioRembours = ratioRemboursement(revenu, profil.dettes)
  const objectif = objectifFondsUrgence(profil.depenses)
  const progression = progressionUrgence(profil.soldeFondsUrgence, objectif)
  const couverts = moisCouverts(profil.soldeFondsUrgence, profil.depenses)

  if (reste < 0) {
    liste.push({
      id: 'reste-negatif',
      niveau: 'danger',
      titre: 'Vos frais dépassent votre revenu',
      message: `Il manque ${formaterDevise(Math.abs(reste), devise, 0)} chaque mois. Aucune allocation ne tient tant que ce trou n’est pas comblé : le poste le plus lourd doit baisser.`,
    })
  }

  if (usageDette > 1) {
    liste.push({
      id: 'limite-depassee',
      niveau: 'danger',
      titre: 'Limite d’emprunt dépassée',
      message: `Votre dette représente ${formaterRatio(usageDette)} de la limite que vous vous êtes fixée. Solder avant d’emprunter à nouveau.`,
    })
  }

  if (ratioRembours > SEUIL_RATIO_REMBOURSEMENT) {
    liste.push({
      id: 'remboursement-lourd',
      niveau: 'attention',
      titre: 'Le remboursement pèse trop',
      message: `${formaterRatio(ratioRembours)} de votre revenu part en remboursement, au-delà du repère de ${formaterRatio(SEUIL_RATIO_REMBOURSEMENT)}. Votre marge de manœuvre se réduit d’autant.`,
    })
  }

  if (pression > SEUIL_PRESSION_MAINTENANCE) {
    liste.push({
      id: 'pression-maintenance',
      niveau: 'attention',
      titre: 'Pression de maintenance élevée',
      message: `Vos frais de maintenance absorbent ${formaterRatio(pression)} du revenu, au-delà du repère de ${formaterRatio(SEUIL_PRESSION_MAINTENANCE)}. Sécurité et capital se construiront lentement tant que ce poste ne baisse pas.`,
    })
  }

  if (objectif > 0 && couverts < 1) {
    liste.push({
      id: 'urgence-vide',
      niveau: 'attention',
      titre: 'Moins d’un mois de couverture',
      message: `Un imprévu se paierait aujourd’hui à crédit. Le premier palier — un mois de maintenance, soit ${formaterDevise(objectif / 6, devise, 0)} — passe avant tout le reste.`,
    })
  }

  if (progression >= 1 && objectif > 0) {
    liste.push({
      id: 'urgence-atteinte',
      niveau: 'info',
      titre: 'Fonds d’urgence complet',
      message: `${MOIS_OBJECTIF_URGENCE} mois de maintenance sont couverts. Choisissez où rediriger cette allocation mensuelle : investissement, objectifs, dettes ou fun money.`,
    })
  }

  if (profil.allocation.investissement === 0 && progression >= 1) {
    liste.push({
      id: 'investissement-nul',
      niveau: 'info',
      titre: 'Rien ne part vers le capital',
      message: `Votre sécurité est faite mais aucune part ne construit de capital long terme. Sur ${ANNEES_CARRIERE} ans, l’écart devient considérable.`,
    })
  }

  return liste
}

/** Les notes à mettre en avant, choisies d'après les alertes en cours. */
export function notesPertinentes(profil: ProfilFinancier, revenu = profil.revenuNet): Note[] {
  const ids = new Set<string>()
  for (const a of alertes(profil, revenu)) {
    if (a.id === 'pression-maintenance' || a.id === 'reste-negatif') ids.add('maintenance-vs-fun')
    if (a.id === 'urgence-vide') ids.add('urgence-liquide')
    if (a.id === 'limite-depassee' || a.id === 'remboursement-lourd') ids.add('emprunter-pour-investir')
    if (a.id === 'investissement-nul' || a.id === 'urgence-atteinte') ids.add('commencer-tot')
  }
  ids.add('rendement-non-garanti')
  ids.add('ratios-reperes')

  const choisies = NOTES.filter((n) => ids.has(n.id))
  return choisies.slice(0, 3)
}

/** Rappel affiché sous la projection : rien ici n'est un conseil. */
export const AVERTISSEMENT =
  'Outil de visualisation. Résultats bruts, hors frais, fiscalité et inflation. Les taux sont des scénarios pédagogiques et ne représentent aucun produit d’épargne précis. Aucun conseil en investissement.'

export function formaterEcheance(mois: number | null): string {
  if (mois === null) return 'jamais au rythme actuel'
  if (mois === 0) return 'déjà atteint'
  return formaterDuree(mois)
}
