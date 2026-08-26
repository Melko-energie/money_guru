import { describe, expect, it } from 'vitest'
import {
  ANNEES_CARRIERE,
  CATEGORIES,
  MOIS_OBJECTIF_URGENCE,
  ajusterAllocation,
  fraisMaintenance,
  limiteEmprunt,
  moisCouverts,
  moisPourSolderDette,
  moisRestantsUrgence,
  montantsAlloues,
  normaliserAllocation,
  objectifFondsUrgence,
  paliersUrgence,
  partFutur,
  pressionMaintenance,
  progressionUrgence,
  projeter,
  ratioDetteTotale,
  ratioRemboursement,
  resteApresMaintenance,
  scoreMarge,
  simuler,
  surendettement,
  usageLimiteEmprunt,
} from '../lib/calculs'
import { METHODES, bilanMethode, comparerMethodes, ratiosMethode } from '../lib/methodes'
import { alertes } from '../lib/pedagogie'
import { PROFIL_PAR_DEFAUT } from '../lib/donneesDemo'
import type { Allocation, Depense, Dettes } from '../lib/types'

const depenses: Depense[] = [
  { id: 'a', libelle: 'Logement', montant: 3000, icone: 'logement' },
  { id: 'b', libelle: 'Nourriture', montant: 1000, icone: 'alimentation' },
]

const allocation: Allocation = {
  maintenance: 50,
  urgence: 10,
  dettes: 5,
  investissement: 15,
  objectifs: 5,
  fun: 15,
}

describe('frais de maintenance personnelle', () => {
  it('additionne les postes saisis', () => {
    expect(fraisMaintenance(depenses)).toBe(4000)
  })

  it('exprime la pression sur le revenu', () => {
    expect(pressionMaintenance(10_000, depenses)).toBeCloseTo(0.4, 6)
    expect(pressionMaintenance(0, depenses)).toBe(0)
  })

  it('laisse le reste à affecter', () => {
    expect(resteApresMaintenance(10_000, depenses)).toBe(6000)
  })
})

describe('allocation', () => {
  it('traduit les ratios en montants', () => {
    const m = montantsAlloues(10_000, allocation)
    expect(m.maintenance).toBe(5000)
    expect(m.fun).toBe(1500)
    expect(CATEGORIES.reduce((s, c) => s + m[c], 0)).toBeCloseTo(10_000, 6)
  })

  it('reste verrouillée à 100 % sur les six postes', () => {
    const suivante = ajusterAllocation(allocation, 'investissement', 30)
    expect(suivante.investissement).toBe(30)
    expect(CATEGORIES.reduce((s, c) => s + suivante[c], 0)).toBe(100)
  })

  it('borne les valeurs hors limites', () => {
    const suivante = ajusterAllocation(allocation, 'fun', 180)
    expect(suivante.fun).toBe(100)
    expect(CATEGORIES.reduce((s, c) => s + suivante[c], 0)).toBe(100)
  })

  it('répartit équitablement quand les autres parts sont à zéro', () => {
    const depart: Allocation = {
      maintenance: 100,
      urgence: 0,
      dettes: 0,
      investissement: 0,
      objectifs: 0,
      fun: 0,
    }
    const suivante = ajusterAllocation(depart, 'maintenance', 40)
    expect(suivante.maintenance).toBe(40)
    expect(CATEGORIES.reduce((s, c) => s + suivante[c], 0)).toBe(100)
  })

  it('normalise un jeu de ratios incohérent', () => {
    const bancal = { ...allocation, fun: 40 }
    const corrige = normaliserAllocation(bancal)
    expect(CATEGORIES.reduce((s, c) => s + corrige[c], 0)).toBe(100)
  })

  it('somme la part sécurité et futur', () => {
    expect(partFutur(allocation)).toBe(35)
  })
})

describe('fonds d’urgence', () => {
  it('vise six mois de maintenance', () => {
    expect(objectifFondsUrgence(depenses)).toBe(4000 * MOIS_OBJECTIF_URGENCE)
  })

  it('compte les mois couverts', () => {
    expect(moisCouverts(8000, depenses)).toBe(2)
    expect(moisCouverts(8000, [])).toBe(0)
  })

  it('borne la progression entre 0 et 1', () => {
    expect(progressionUrgence(50_000, 24_000)).toBe(1)
    expect(progressionUrgence(12_000, 24_000)).toBe(0.5)
    expect(progressionUrgence(1000, 0)).toBe(0)
  })

  it('estime le nombre de mois restants', () => {
    expect(moisRestantsUrgence(10_000, 24_000, 2000)).toBe(7)
    expect(moisRestantsUrgence(30_000, 24_000, 2000)).toBe(0)
    expect(moisRestantsUrgence(10_000, 24_000, 0)).toBeNull()
  })

  it('marque les paliers 1 / 3 / 6 déjà franchis', () => {
    const p = paliersUrgence(depenses, 12_500)
    expect(p.map((x) => x.mois)).toEqual([1, 3, 6])
    expect(p.map((x) => x.atteint)).toEqual([true, true, false])
  })
})

describe('dettes personnelles sans intérêt', () => {
  const dettes: Dettes = { total: 30_000, remboursementMensuel: 1500, multiplicateurLimite: 3 }

  it('calcule la limite d’emprunt depuis le multiplicateur', () => {
    expect(limiteEmprunt(10_000, dettes)).toBe(30_000)
  })

  it('exprime les ratios de remboursement et de dette', () => {
    expect(ratioRemboursement(10_000, dettes)).toBeCloseTo(0.15, 6)
    expect(ratioDetteTotale(10_000, dettes)).toBe(3)
  })

  it('mesure la part de limite consommée', () => {
    expect(usageLimiteEmprunt(10_000, dettes)).toBe(1)
    expect(usageLimiteEmprunt(20_000, dettes)).toBe(0.5)
  })

  it('solde la dette sans intérêt en un simple quotient', () => {
    expect(moisPourSolderDette(dettes)).toBe(20)
    expect(moisPourSolderDette({ ...dettes, total: 0 })).toBe(0)
    expect(moisPourSolderDette({ ...dettes, remboursementMensuel: 0 })).toBeNull()
  })

  it('déclenche l’alerte au-delà de la limite ou du repère de remboursement', () => {
    expect(surendettement(20_000, dettes)).toBe(false)
    expect(surendettement(8000, dettes)).toBe(true)
    expect(surendettement(20_000, { ...dettes, remboursementMensuel: 5000 })).toBe(true)
  })
})

describe('projection de capital', () => {
  it('applique la formule du context : début de mois, taux annuel / 12', () => {
    const r = simuler({
      montantInitial: 0,
      versementMensuel: 1000,
      tauxAnnuel: 7,
      dureeAnnees: 1,
      momentVersement: 'debut',
    })
    expect(r.totalVerse).toBe(12_000)
    // 1 000/mois à 7 % sur 1 an, versé en début de mois ≈ 468 de gain brut
    expect(r.gainBrut).toBeGreaterThan(450)
    expect(r.gainBrut).toBeLessThan(480)
  })

  it('rend moins en fin de mois qu’en début de mois', () => {
    const base = {
      montantInitial: 0,
      versementMensuel: 1000,
      tauxAnnuel: 7,
      dureeAnnees: 1,
    }
    const debut = simuler({ ...base, momentVersement: 'debut' })
    const fin = simuler({ ...base, momentVersement: 'fin' })
    expect(debut.capitalFinal).toBeGreaterThan(fin.capitalFinal)
    expect(fin.gainBrut).toBeGreaterThan(380)
    expect(fin.gainBrut).toBeLessThan(400)
  })

  it('n’invente aucun gain à taux nul', () => {
    const r = simuler({
      montantInitial: 5000,
      versementMensuel: 500,
      tauxAnnuel: 0,
      dureeAnnees: 2,
      momentVersement: 'debut',
    })
    expect(r.capitalFinal).toBe(5000 + 500 * 24)
    expect(r.gainBrut).toBe(0)
  })

  it('échantillonne par mois ou par an, en terminant sur l’échéance', () => {
    const p = {
      montantInitial: 0,
      versementMensuel: 100,
      tauxAnnuel: 5,
      dureeAnnees: ANNEES_CARRIERE,
      momentVersement: 'debut' as const,
    }
    expect(projeter(p, 'mois')).toHaveLength(ANNEES_CARRIERE * 12 + 1)
    const annuel = projeter(p, 'an')
    expect(annuel).toHaveLength(ANNEES_CARRIERE + 1)
    expect(annuel[annuel.length - 1].mois).toBe(ANNEES_CARRIERE * 12)
  })

  it('donne le même résultat final quelle que soit la granularité', () => {
    const p = {
      montantInitial: 1000,
      versementMensuel: 500,
      tauxAnnuel: 6,
      dureeAnnees: 10,
      momentVersement: 'debut' as const,
    }
    expect(simuler(p, 'an').capitalFinal).toBeCloseTo(simuler(p, 'mois').capitalFinal, 6)
  })

  it('fait fortement croître le gain avec le taux sur une carrière', () => {
    const base = {
      montantInitial: 0,
      versementMensuel: 1000,
      dureeAnnees: ANNEES_CARRIERE,
      momentVersement: 'debut' as const,
    }
    const bas = simuler({ ...base, tauxAnnuel: 3 }, 'an')
    const haut = simuler({ ...base, tauxAnnuel: 10 }, 'an')
    expect(haut.gainBrut).toBeGreaterThan(bas.gainBrut * 5)
  })
})

describe('score de marge de manœuvre', () => {
  it('reste borné entre 0 et 100', () => {
    const s = scoreMarge(PROFIL_PAR_DEFAUT)
    expect(s.valeur).toBeGreaterThanOrEqual(0)
    expect(s.valeur).toBeLessThanOrEqual(100)
    expect(s.composantes).toHaveLength(4)
    expect(s.composantes.reduce((acc, c) => acc + c.poids, 0)).toBeCloseTo(1, 6)
  })

  it('monte quand la sécurité progresse', () => {
    const faible = scoreMarge({ ...PROFIL_PAR_DEFAUT, soldeFondsUrgence: 0 })
    const fort = scoreMarge({ ...PROFIL_PAR_DEFAUT, soldeFondsUrgence: 500_000 })
    expect(fort.valeur).toBeGreaterThan(faible.valeur)
  })

  it('descend quand la maintenance sature le revenu', () => {
    const serein = scoreMarge({ ...PROFIL_PAR_DEFAUT, revenuNet: 30_000 })
    const tendu = scoreMarge({ ...PROFIL_PAR_DEFAUT, revenuNet: 9000 })
    expect(serein.valeur).toBeGreaterThan(tendu.valeur)
  })
})

describe('méthodes d’allocation', () => {
  it('propose cinq méthodes dont les ratios totalisent 100 %', () => {
    expect(METHODES).toHaveLength(5)
    for (const m of METHODES) {
      if (!m.ratios) continue
      expect(CATEGORIES.reduce((s, c) => s + m.ratios![c], 0)).toBe(100)
    }
  })

  it('respecte les contraintes annoncées', () => {
    const cinquante = ratiosMethode('50-30-20', PROFIL_PAR_DEFAUT.allocation)
    expect(cinquante.maintenance).toBeLessThanOrEqual(50)
    expect(cinquante.fun + cinquante.objectifs).toBeLessThanOrEqual(30)
    expect(cinquante.urgence + cinquante.investissement + cinquante.dettes).toBeGreaterThanOrEqual(20)

    const soixanteDix = ratiosMethode('70-30', PROFIL_PAR_DEFAUT.allocation)
    expect(soixanteDix.maintenance + soixanteDix.fun + soixanteDix.objectifs).toBeLessThanOrEqual(70)
    expect(partFutur(soixanteDix)).toBeGreaterThanOrEqual(30)

    const defense = ratiosMethode('defense', PROFIL_PAR_DEFAUT.allocation)
    expect(defense.fun).toBeLessThanOrEqual(5)
    expect(defense.urgence).toBeGreaterThan(cinquante.urgence)
  })

  it('garde les ratios du profil pour la stratégie personnalisée', () => {
    expect(ratiosMethode('personnalisee', allocation)).toEqual(allocation)
  })

  it('projette chaque méthode sur la situation réelle', () => {
    const bilan = bilanMethode(PROFIL_PAR_DEFAUT, 'defense')
    expect(bilan.capitalCarriere).toBeGreaterThan(0)
    expect(bilan.funMensuel).toBeCloseTo(PROFIL_PAR_DEFAUT.revenuNet * 0.05, 6)
    expect(bilan.score).toBeGreaterThanOrEqual(0)
  })

  it('chiffre l’écart de capital face à la stratégie en cours', () => {
    const bilans = comparerMethodes(PROFIL_PAR_DEFAUT)
    expect(bilans).toHaveLength(5)
    const courant = bilans.find((b) => b.methode === PROFIL_PAR_DEFAUT.methode)
    expect(courant?.ecartCapital).toBeCloseTo(0, 6)
    // le mode défense investit moins : son capital de carrière est inférieur
    const defense = bilans.find((b) => b.methode === 'defense')
    expect(defense?.ecartCapital).toBeLessThan(0)
  })
})

describe('alertes', () => {
  it('ne signale rien de grave sur le profil de démonstration', () => {
    expect(alertes(PROFIL_PAR_DEFAUT).some((a) => a.niveau === 'danger')).toBe(false)
  })

  it('signale un revenu insuffisant', () => {
    const a = alertes({ ...PROFIL_PAR_DEFAUT, revenuNet: 3000 })
    expect(a.some((x) => x.id === 'reste-negatif')).toBe(true)
  })

  it('signale le dépassement de la limite d’emprunt', () => {
    const a = alertes({
      ...PROFIL_PAR_DEFAUT,
      dettes: { total: 90_000, remboursementMensuel: 700, multiplicateurLimite: 3 },
    })
    expect(a.some((x) => x.id === 'limite-depassee')).toBe(true)
  })

  it('félicite quand le fonds d’urgence est complet', () => {
    const a = alertes({ ...PROFIL_PAR_DEFAUT, soldeFondsUrgence: 500_000 })
    expect(a.some((x) => x.id === 'urgence-atteinte')).toBe(true)
  })
})
