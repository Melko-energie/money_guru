import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ajusterAllocation,
  capitalMobilisable,
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
  partVie,
  patrimoineTotal,
  pressionMaintenance,
  progressionUrgence,
  ratioDetteTotale,
  ratioRemboursement,
  resteApresMaintenance,
  scoreMarge,
  surendettement,
  usageLimiteEmprunt,
} from '../lib/calculs'
import { ratiosMethode } from '../lib/methodes'
import { cleMoisDe, construireBilan } from '../lib/calendrier'
import { alertes, notesPertinentes } from '../lib/pedagogie'
import { PROFIL_PAR_DEFAUT } from '../lib/donneesDemo'
import type {
  BilanMois,
  Categorie,
  CategorieCapital,
  CodeDevise,
  Depense,
  DepenseDatee,
  Dettes,
  MethodeAllocation,
  ProfilFinancier,
} from '../lib/types'

const CLE_STOCKAGE = 'money-guru:profil:v2'

function lireStockage(): ProfilFinancier {
  if (typeof window === 'undefined') return PROFIL_PAR_DEFAUT
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE)
    if (!brut) return PROFIL_PAR_DEFAUT
    const enregistre = JSON.parse(brut) as Partial<ProfilFinancier>
    return {
      ...PROFIL_PAR_DEFAUT,
      ...enregistre,
      allocation: normaliserAllocation({
        ...PROFIL_PAR_DEFAUT.allocation,
        ...(enregistre.allocation ?? {}),
      }),
      dettes: { ...PROFIL_PAR_DEFAUT.dettes, ...(enregistre.dettes ?? {}) },
      patrimoine: { ...PROFIL_PAR_DEFAUT.patrimoine, ...(enregistre.patrimoine ?? {}) },
      depenses:
        Array.isArray(enregistre.depenses) && enregistre.depenses.length
          ? enregistre.depenses
          : PROFIL_PAR_DEFAUT.depenses,
      journal: Array.isArray(enregistre.journal) ? enregistre.journal : PROFIL_PAR_DEFAUT.journal,
    }
  } catch {
    return PROFIL_PAR_DEFAUT
  }
}

type ValeurContexte = {
  profil: ProfilFinancier
  /* Dérivés — recalculés à chaque changement. */
  frais: number
  pression: number
  resteVital: number
  montants: Record<Categorie, number>
  ratioFutur: number
  ratioVie: number
  objectifUrgence: number
  progressionUrgencePct: number
  moisDejaCouverts: number
  moisAvantObjectif: number | null
  paliers: ReturnType<typeof paliersUrgence>
  urgenceAtteinte: boolean
  limiteDette: number
  usageDette: number
  ratioRembours: number
  ratioDette: number
  moisSolderDette: number | null
  detteExcessive: boolean
  capitalProductif: number
  patrimoineComplet: number
  score: ReturnType<typeof scoreMarge>
  listeAlertes: ReturnType<typeof alertes>
  notes: ReturnType<typeof notesPertinentes>
  /* Calendrier des dépenses (context §7.5). */
  moisAffiche: string
  bilanMois: BilanMois
  definirMoisAffiche: (cle: string) => void
  /* Actions. */
  definirPrenom: (v: string) => void
  definirDevise: (v: CodeDevise) => void
  definirRevenu: (v: number) => void
  definirDepense: (id: string, champs: Partial<Depense>) => void
  ajouterDepense: () => void
  retirerDepense: (id: string) => void
  definirMethode: (m: MethodeAllocation) => void
  definirAllocation: (categorie: Categorie, valeur: number) => void
  definirSoldeUrgence: (v: number) => void
  definirDettes: (champs: Partial<Dettes>) => void
  definirPatrimoine: (cle: CategorieCapital, v: number) => void
  definirTauxRendement: (v: number) => void
  definirRedirection: (c: ProfilFinancier['redirectionApresUrgence']) => void
  ajouterLigneJournal: (ligne: Omit<DepenseDatee, 'id'>) => void
  modifierLigneJournal: (id: string, champs: Partial<DepenseDatee>) => void
  retirerLigneJournal: (id: string) => void
  /** Matérialise une occurrence projetée en dépense réellement saisie. */
  materialiserOccurrence: (occurrence: DepenseDatee) => void
  reinitialiser: () => void
}

const Ctx = createContext<ValeurContexte | null>(null)

export function FournisseurFinances({ children }: { children: ReactNode }) {
  const [profil, setProfil] = useState<ProfilFinancier>(lireStockage)

  useEffect(() => {
    try {
      window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(profil))
    } catch {
      /* stockage indisponible (navigation privée) : on continue sans persistance */
    }
  }, [profil])

  const majProfil = useCallback((champs: Partial<ProfilFinancier>) => {
    setProfil((p) => ({ ...p, ...champs }))
  }, [])

  const definirDepense = useCallback((id: string, champs: Partial<Depense>) => {
    setProfil((p) => ({
      ...p,
      depenses: p.depenses.map((d) => (d.id === id ? { ...d, ...champs } : d)),
    }))
  }, [])

  const ajouterDepense = useCallback(() => {
    setProfil((p) => ({
      ...p,
      depenses: [
        ...p.depenses,
        {
          id: `frais-${p.depenses.length + 1}-${p.depenses.reduce((s, d) => s + d.libelle.length, 0)}`,
          libelle: 'Nouveau poste',
          montant: 0,
          icone: 'autre',
        },
      ],
    }))
  }, [])

  const retirerDepense = useCallback((id: string) => {
    setProfil((p) => ({ ...p, depenses: p.depenses.filter((d) => d.id !== id) }))
  }, [])

  /** Choisir une méthode applique ses ratios ; « personnalisée » garde les vôtres. */
  const definirMethode = useCallback((methode: MethodeAllocation) => {
    setProfil((p) => ({ ...p, methode, allocation: ratiosMethode(methode, p.allocation) }))
  }, [])

  /** Toucher un curseur bascule automatiquement en stratégie personnalisée. */
  const definirAllocation = useCallback((categorie: Categorie, valeur: number) => {
    setProfil((p) => ({
      ...p,
      methode: 'personnalisee',
      allocation: ajusterAllocation(p.allocation, categorie, valeur),
    }))
  }, [])

  const definirDettes = useCallback((champs: Partial<Dettes>) => {
    setProfil((p) => ({ ...p, dettes: { ...p.dettes, ...champs } }))
  }, [])

  const definirPatrimoine = useCallback((cle: CategorieCapital, v: number) => {
    setProfil((p) => ({ ...p, patrimoine: { ...p.patrimoine, [cle]: Math.max(0, v) } }))
  }, [])

  const [moisAffiche, setMoisAffiche] = useState<string>(() => cleMoisDe())

  const ajouterLigneJournal = useCallback((ligne: Omit<DepenseDatee, 'id'>) => {
    setProfil((p) => {
      const id = `saisie-${ligne.date}-${p.journal.length + 1}-${Math.round(ligne.montant)}`
      return {
        ...p,
        journal: [
          ...p.journal,
          // une récurrence est sa propre tête de série tant qu'aucune n'est fournie
          { ...ligne, id, serie: ligne.recurrent ? (ligne.serie ?? id) : undefined },
        ],
      }
    })
  }, [])

  const modifierLigneJournal = useCallback((id: string, champs: Partial<DepenseDatee>) => {
    setProfil((p) => ({
      ...p,
      journal: p.journal.map((l) => {
        if (l.id !== id) return l
        const suivante = { ...l, ...champs }
        // devenir récurrente crée une série ; ne plus l'être la dissout
        if (suivante.recurrent) suivante.serie = suivante.serie ?? suivante.id
        else delete suivante.serie
        return suivante
      }),
    }))
  }, [])

  const retirerLigneJournal = useCallback((id: string) => {
    setProfil((p) => ({ ...p, journal: p.journal.filter((l) => l.id !== id) }))
  }, [])

  /** Une occurrence projetée n'existe qu'en mémoire : l'accepter la fige dans le journal. */
  const materialiserOccurrence = useCallback((occurrence: DepenseDatee) => {
    setProfil((p) => {
      const id = `saisie-${occurrence.date}-${occurrence.serie ?? 'serie'}`
      if (p.journal.some((l) => l.id === id)) return p
      // le drapeau `projetee` ne doit surtout pas être persisté : la ligne
      // deviendrait immuable et resterait affichée comme une prévision
      const { projetee: _ignore, ...reelle } = occurrence as DepenseDatee & { projetee?: boolean }
      return { ...p, journal: [...p.journal, { ...reelle, id }] }
    })
  }, [])

  const valeur = useMemo<ValeurContexte>(() => {
    const frais = fraisMaintenance(profil.depenses)
    const objectifUrgence = objectifFondsUrgence(profil.depenses)
    const montants = montantsAlloues(profil.revenuNet, profil.allocation)
    const progression = progressionUrgence(profil.soldeFondsUrgence, objectifUrgence)

    // le budget alloué aux dettes sert de remboursement s'il dépasse le versement saisi
    const dettesEffectives: Dettes = {
      ...profil.dettes,
      remboursementMensuel: Math.max(profil.dettes.remboursementMensuel, montants.dettes),
    }

    return {
      profil,
      frais,
      pression: pressionMaintenance(profil.revenuNet, profil.depenses),
      resteVital: resteApresMaintenance(profil.revenuNet, profil.depenses),
      montants,
      ratioFutur: partFutur(profil.allocation),
      ratioVie: partVie(profil.allocation),
      objectifUrgence,
      progressionUrgencePct: progression * 100,
      moisDejaCouverts: moisCouverts(profil.soldeFondsUrgence, profil.depenses),
      moisAvantObjectif: moisRestantsUrgence(
        profil.soldeFondsUrgence,
        objectifUrgence,
        montants.urgence,
      ),
      paliers: paliersUrgence(profil.depenses, profil.soldeFondsUrgence),
      urgenceAtteinte: progression >= 1,
      limiteDette: limiteEmprunt(profil.revenuNet, profil.dettes),
      usageDette: usageLimiteEmprunt(profil.revenuNet, profil.dettes),
      ratioRembours: ratioRemboursement(profil.revenuNet, dettesEffectives),
      ratioDette: ratioDetteTotale(profil.revenuNet, profil.dettes),
      moisSolderDette: moisPourSolderDette(dettesEffectives),
      detteExcessive: surendettement(profil.revenuNet, dettesEffectives),
      capitalProductif: capitalMobilisable(profil.patrimoine),
      patrimoineComplet: patrimoineTotal(profil.patrimoine),
      score: scoreMarge(profil),
      listeAlertes: alertes(profil),
      notes: notesPertinentes(profil),
      moisAffiche,
      bilanMois: construireBilan(profil.journal, moisAffiche, profil.revenuNet, profil.allocation),
      definirMoisAffiche: setMoisAffiche,
      definirPrenom: (v: string) => majProfil({ prenom: v }),
      definirDevise: (v: CodeDevise) =>
        setProfil((p) => ({
          ...p,
          devise: v,
          // le journal suit la devise du profil : on ne mélange pas les unités
          journal: p.journal.map((l) => ({ ...l, devise: v })),
        })),
      definirRevenu: (v: number) => majProfil({ revenuNet: Math.max(0, v) }),
      definirDepense,
      ajouterDepense,
      retirerDepense,
      definirMethode,
      definirAllocation,
      definirSoldeUrgence: (v: number) =>
        setProfil((p) => ({
          ...p,
          soldeFondsUrgence: Math.max(0, v),
          // le fonds d'urgence fait partie du capital liquide
          patrimoine: { ...p.patrimoine, liquide: Math.max(p.patrimoine.liquide, Math.max(0, v)) },
        })),
      definirDettes,
      definirPatrimoine,
      definirTauxRendement: (v: number) =>
        majProfil({ tauxRendementAnnuel: Math.min(20, Math.max(0, v)) }),
      definirRedirection: (c) => majProfil({ redirectionApresUrgence: c }),
      ajouterLigneJournal,
      modifierLigneJournal,
      retirerLigneJournal,
      materialiserOccurrence,
      reinitialiser: () => {
        setProfil(PROFIL_PAR_DEFAUT)
        setMoisAffiche(cleMoisDe())
      },
    }
  }, [
    profil,
    majProfil,
    definirDepense,
    ajouterDepense,
    retirerDepense,
    definirMethode,
    definirAllocation,
    definirDettes,
    definirPatrimoine,
    moisAffiche,
    ajouterLigneJournal,
    modifierLigneJournal,
    retirerLigneJournal,
    materialiserOccurrence,
  ])

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>
}

export function useFinances() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useFinances hors FournisseurFinances')
  return c
}

/** Raccourci : formate un montant dans la devise du profil. */
export function useDevise() {
  return useFinances().profil.devise
}
