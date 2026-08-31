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
  pressionDeFrais,
  progressionUrgence,
  ratioDetteTotale,
  redirigerPart,
  ratioRemboursement,
  scoreMarge,
  surendettement,
  usageLimiteEmprunt,
} from '../lib/calculs'
import { ratiosMethode } from '../lib/methodes'
import {
  anneeDeCle,
  cleJour,
  cleMoisDe,
  construireBilan,
  decomposerMois,
} from '../lib/calendrier'
import { alertes, notesPertinentes } from '../lib/pedagogie'
import {
  appliquerEffet,
  chaineSuivi,
  effetSurSoldes,
  ficheMois,
  fraisDuMois,
  moisFinancant,
  revenuDuMois,
  situationMois,
} from '../lib/suivi'
import { PROFIL_VIDE } from '../lib/profilVide'
import type {
  BilanMois,
  MoisSuivi,
  SituationMois,
  Categorie,
  CategorieCapital,
  CodeDevise,
  Depense,
  DepenseDatee,
  Dettes,
  MethodeAllocation,
  Objectif,
  VersementSalaire,
  ProfilFinancier,
} from '../lib/types'

const CLE_STOCKAGE = 'money-guru:profil:v2'

function lireStockage(): ProfilFinancier {
  if (typeof window === 'undefined') return PROFIL_VIDE
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE)
    if (!brut) return PROFIL_VIDE
    const enregistre = JSON.parse(brut) as Partial<ProfilFinancier>
    return {
      ...PROFIL_VIDE,
      ...enregistre,
      allocation: normaliserAllocation({
        ...PROFIL_VIDE.allocation,
        ...(enregistre.allocation ?? {}),
      }),
      dettes: { ...PROFIL_VIDE.dettes, ...(enregistre.dettes ?? {}) },
      patrimoine: { ...PROFIL_VIDE.patrimoine, ...(enregistre.patrimoine ?? {}) },
      depenses:
        Array.isArray(enregistre.depenses) && enregistre.depenses.length
          ? enregistre.depenses
          : PROFIL_VIDE.depenses,
      onboarding: { ...PROFIL_VIDE.onboarding, ...(enregistre.onboarding ?? {}) },
      journal: Array.isArray(enregistre.journal) ? enregistre.journal : PROFIL_VIDE.journal,
      mois: enregistre.mois && typeof enregistre.mois === 'object' ? enregistre.mois : {},
      objectifs: Array.isArray(enregistre.objectifs) ? enregistre.objectifs : [],
      versementSalaire: {
        ...PROFIL_VIDE.versementSalaire,
        ...(enregistre.versementSalaire ?? {}),
      },
    }
  } catch {
    return PROFIL_VIDE
  }
}

type ValeurContexte = {
  profil: ProfilFinancier
  /* Dérivés — recalculés à chaque changement. */
  frais: number
  /** Frais retenus pour le mois affiché : ceux du mois, sinon ceux du profil. */
  fraisMois: number
  /** Revenu du mois affiché : celui saisi, sinon celui du profil. */
  revenuMois: number
  /** Mois dont le salaire finance le mois affiché. */
  moisDuSalaire: string
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
  /** Année du mois affiché : une seule période pour toute l'application. */
  anneeAffichee: number
  bilanMois: BilanMois
  definirMoisAffiche: (cle: string) => void
  /** Change d'année sans changer de mois — le calendrier et le suivi suivent. */
  definirAnnee: (annee: number) => void
  /* Suivi mensuel : ce qui reste d'un mois passe au suivant. */
  situationDuMois: SituationMois
  chaineDuSuivi: SituationMois[]
  ficheDuMois: MoisSuivi
  definirRevenuPercu: (cle: string, valeur: number | null) => void
  /** Total de frais propre à un mois ; `null` reprend celui du modèle. */
  definirFraisMois: (cle: string, valeur: number | null) => void
  /** Postes de frais d'un mois ; `cle` nulle règle le modèle, `depenses` nulle rend au modèle. */
  definirPostesDuMois: (cle: string | null, depenses: Depense[] | null) => void
  definirVersementSalaire: (champs: Partial<VersementSalaire>) => void
  basculerCloture: (cle: string) => void
  /* Objectifs : un achat, une date, un poste qui le finance. */
  ajouterObjectif: (objectif: Omit<Objectif, 'id'>) => void
  modifierObjectif: (id: string, champs: Partial<Objectif>) => void
  retirerObjectif: (id: string) => void
  /** Inscrit l'achat au calendrier, au mois visé, sur le poste choisi. */
  enregistrerAchat: (id: string) => void
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
  /** Bascule la part « fonds d'urgence » vers la destination choisie. */
  appliquerRedirection: () => void
  ajouterLigneJournal: (ligne: Omit<DepenseDatee, 'id'>) => void
  modifierLigneJournal: (id: string, champs: Partial<DepenseDatee>) => void
  retirerLigneJournal: (id: string) => void
  /** Matérialise une occurrence projetée en dépense réellement saisie. */
  materialiserOccurrence: (occurrence: DepenseDatee) => void
  reinitialiser: () => void
  /** Parcours de remplissage : étape en cours et validation finale. */
  definirEtapeOnboarding: (etape: number) => void
  terminerOnboarding: () => void
  reprendreOnboarding: () => void
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

  /**
   * Une seule période pour toute l'application : changer d'année dans une vue
   * la change partout. Deux vues sur deux dates différentes, c'est deux
   * lectures qui ne se recoupent jamais.
   */
  const definirAnnee = useCallback((annee: number) => {
    setMoisAffiche((m) => `${Math.max(1970, Math.round(annee))}-${m.slice(5, 7)}`)
  }, [])

  const definirRevenuPercu = useCallback((cle: string, valeur: number | null) => {
    setProfil((p) => ({
      ...p,
      mois: {
        ...p.mois,
        [cle]: { ...ficheMois(p, cle), cle, revenuPercu: valeur === null ? null : Math.max(0, valeur) },
      },
    }))
  }, [])

  /**
   * Un total de frais propre à un mois ; `null` remet ceux du modèle.
   * Donner un total efface le détail de ce mois : le dernier réglage
   * remplace l'autre, jamais deux vérités côte à côte.
   */
  const definirFraisMois = useCallback((cle: string, valeur: number | null) => {
    setProfil((p) => ({
      ...p,
      mois: {
        ...p.mois,
        [cle]: {
          ...ficheMois(p, cle),
          cle,
          fraisMaintenance: valeur === null ? null : Math.max(0, valeur),
          depenses: null,
        },
      },
    }))
  }, [])

  /**
   * Les postes de frais d'un mois, ligne à ligne.
   * `cle` à `null` règle le modèle qui vaut pour tous les mois non détaillés ;
   * `depenses` à `null` rend le mois au modèle.
   */
  const definirPostesDuMois = useCallback((cle: string | null, depenses: Depense[] | null) => {
    setProfil((p) => {
      if (cle === null) return { ...p, depenses: depenses ?? PROFIL_VIDE.depenses }
      return {
        ...p,
        mois: {
          ...p.mois,
          // détailler un mois rend son total en un chiffre caduc
          [cle]: { ...ficheMois(p, cle), cle, depenses, fraisMaintenance: null },
        },
      }
    })
  }, [])

  const definirVersementSalaire = useCallback((champs: Partial<VersementSalaire>) => {
    setProfil((p) => {
      const jour = champs.jour === undefined ? p.versementSalaire.jour : champs.jour
      return {
        ...p,
        versementSalaire: {
          ...p.versementSalaire,
          ...champs,
          jour: Math.min(31, Math.max(1, Math.round(jour))),
        },
      }
    })
  }, [])

  /** Clore un mois transmet son reste au suivant ; le rouvrir le retient. */
  const basculerCloture = useCallback((cle: string) => {
    setProfil((p) => {
      const fiche = ficheMois(p, cle)
      return { ...p, mois: { ...p.mois, [cle]: { ...fiche, cle, clos: !fiche.clos } } }
    })
  }, [])

  const ajouterObjectif = useCallback((objectif: Omit<Objectif, 'id'>) => {
    setProfil((p) => ({
      ...p,
      objectifs: [
        ...p.objectifs,
        { ...objectif, id: `objectif-${objectif.moisCible}-${p.objectifs.length + 1}` },
      ],
    }))
  }, [])

  const modifierObjectif = useCallback((id: string, champs: Partial<Objectif>) => {
    setProfil((p) => ({
      ...p,
      objectifs: p.objectifs.map((o) => (o.id === id ? { ...o, ...champs } : o)),
    }))
  }, [])

  const retirerObjectif = useCallback((id: string) => {
    setProfil((p) => ({ ...p, objectifs: p.objectifs.filter((o) => o.id !== id) }))
  }, [])

  /**
   * L'achat devient une vraie ligne du calendrier, au mois visé et sur le poste
   * qui l'a financé. L'objectif est marqué pour qu'il ne soit jamais inscrit
   * deux fois.
   */
  const enregistrerAchat = useCallback((id: string) => {
    setProfil((p) => {
      const objectif = p.objectifs.find((o) => o.id === id)
      if (!objectif || objectif.achatEnregistre) return p
      const { annee, mois } = decomposerMois(objectif.moisCible)
      const aujourdhui = new Date()
      // un achat du mois en cours se date du jour, pas du 1er
      const jour =
        objectif.moisCible === cleMoisDe(aujourdhui) ? aujourdhui.getDate() : 1
      return {
        ...p,
        objectifs: p.objectifs.map((o) => (o.id === id ? { ...o, achatEnregistre: true } : o)),
        journal: [
          ...p.journal,
          {
            id: `achat-${objectif.id}`,
            date: cleJour(annee, mois, jour),
            montant: Math.max(0, objectif.montant),
            devise: p.devise,
            categorie: objectif.categorie,
            libelle: objectif.libelle,
            note: 'Objectif réalisé',
            recurrent: false,
          },
        ],
      }
    })
  }, [])

  const ajouterLigneJournal = useCallback((ligne: Omit<DepenseDatee, 'id'>) => {
    setProfil((p) => {
      const id = `saisie-${ligne.date}-${p.journal.length + 1}-${Math.round(ligne.montant)}`
      const suivant = {
        ...p,
        journal: [
          ...p.journal,
          // une récurrence est sa propre tête de série tant qu'aucune n'est fournie
          { ...ligne, id, serie: ligne.recurrent ? (ligne.serie ?? id) : undefined },
        ],
      }
      // mettre de côté ou rembourser n'est pas qu'une écriture : le solde bouge
      return appliquerEffet(suivant, effetSurSoldes(ligne, 1))
    })
  }, [])

  const modifierLigneJournal = useCallback((id: string, champs: Partial<DepenseDatee>) => {
    setProfil((p) => {
      const avant = p.journal.find((l) => l.id === id)
      if (!avant) return p
      const apres = { ...avant, ...champs }
      // devenir récurrente crée une série ; ne plus l'être la dissout
      if (apres.recurrent) apres.serie = apres.serie ?? apres.id
      else delete apres.serie

      const suivant = { ...p, journal: p.journal.map((l) => (l.id === id ? apres : l)) }
      // on défait l'effet de l'ancienne ligne avant d'appliquer celui de la nouvelle
      return appliquerEffet(
        appliquerEffet(suivant, effetSurSoldes(avant, -1)),
        effetSurSoldes(apres, 1),
      )
    })
  }, [])

  const retirerLigneJournal = useCallback((id: string) => {
    setProfil((p) => {
      const ligne = p.journal.find((l) => l.id === id)
      if (!ligne) return p
      const suivant = { ...p, journal: p.journal.filter((l) => l.id !== id) }
      return appliquerEffet(suivant, effetSurSoldes(ligne, -1))
    })
  }, [])

  /** Une occurrence projetée n'existe qu'en mémoire : l'accepter la fige dans le journal. */
  const materialiserOccurrence = useCallback((occurrence: DepenseDatee) => {
    setProfil((p) => {
      const id = `saisie-${occurrence.date}-${occurrence.serie ?? 'serie'}`
      if (p.journal.some((l) => l.id === id)) return p
      // le drapeau `projetee` ne doit surtout pas être persisté : la ligne
      // deviendrait immuable et resterait affichée comme une prévision
      const { projetee: _ignore, ...reelle } = occurrence as DepenseDatee & { projetee?: boolean }
      const suivant = { ...p, journal: [...p.journal, { ...reelle, id }] }
      return appliquerEffet(suivant, effetSurSoldes(reelle, 1))
    })
  }, [])

  const valeur = useMemo<ValeurContexte>(() => {
    const frais = fraisMaintenance(profil.depenses)
    const objectifUrgence = objectifFondsUrgence(profil.depenses)
    // tout ce que l'application affiche suit le mois regardé, pas une moyenne :
    // un mois à 5 000 et le suivant à 15 000 ne donnent pas la même répartition
    const revenuMois = revenuDuMois(profil, moisAffiche)
    const montants = montantsAlloues(revenuMois, profil.allocation)
    // les frais peuvent changer d'un mois à l'autre : le tableau de bord suit
    // ceux du mois regardé, pas une valeur figée dans le profil
    const fraisMois = fraisDuMois(profil, moisAffiche)
    const progression = progressionUrgence(profil.soldeFondsUrgence, objectifUrgence)

    // le budget alloué aux dettes sert de remboursement s'il dépasse le versement saisi
    const dettesEffectives: Dettes = {
      ...profil.dettes,
      remboursementMensuel: Math.max(profil.dettes.remboursementMensuel, montants.dettes),
    }

    return {
      profil,
      frais,
      fraisMois,
      revenuMois,
      moisDuSalaire: moisFinancant(profil, moisAffiche),
      pression: pressionDeFrais(revenuMois, fraisMois),
      resteVital: revenuMois - fraisMois,
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
      limiteDette: limiteEmprunt(revenuMois, profil.dettes),
      usageDette: usageLimiteEmprunt(revenuMois, profil.dettes),
      ratioRembours: ratioRemboursement(revenuMois, dettesEffectives),
      ratioDette: ratioDetteTotale(revenuMois, profil.dettes),
      moisSolderDette: moisPourSolderDette(dettesEffectives),
      detteExcessive: surendettement(revenuMois, dettesEffectives),
      capitalProductif: capitalMobilisable(profil.patrimoine),
      patrimoineComplet: patrimoineTotal(profil.patrimoine),
      score: scoreMarge(profil, revenuMois),
      listeAlertes: alertes(profil, revenuMois),
      notes: notesPertinentes(profil, revenuMois),
      moisAffiche,
      bilanMois: construireBilan(
        profil.journal,
        moisAffiche,
        revenuMois,
        profil.allocation,
        fraisMois,
      ),
      anneeAffichee: anneeDeCle(moisAffiche),
      definirMoisAffiche: setMoisAffiche,
      definirAnnee,
      situationDuMois: situationMois(profil, moisAffiche),
      chaineDuSuivi: chaineSuivi(profil, moisAffiche).slice(-12),
      ficheDuMois: ficheMois(profil, moisAffiche),
      definirRevenuPercu,
      definirFraisMois,
      definirPostesDuMois,
      definirVersementSalaire,
      basculerCloture,
      ajouterObjectif,
      modifierObjectif,
      retirerObjectif,
      enregistrerAchat,
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
      appliquerRedirection: () =>
        setProfil((p) => {
          if (p.allocation.urgence <= 0) return p
          return {
            ...p,
            methode: 'personnalisee',
            allocation: redirigerPart(p.allocation, 'urgence', p.redirectionApresUrgence),
          }
        }),
      ajouterLigneJournal,
      modifierLigneJournal,
      retirerLigneJournal,
      materialiserOccurrence,
      reinitialiser: () => {
        setProfil(PROFIL_VIDE)
        setMoisAffiche(cleMoisDe())
      },
      definirEtapeOnboarding: (etape: number) =>
        setProfil((p) => ({
          ...p,
          onboarding: { ...p.onboarding, etape: Math.max(0, etape) },
        })),
      terminerOnboarding: () =>
        setProfil((p) => ({ ...p, onboarding: { ...p.onboarding, termine: true } })),
      /** Revenir au parcours pour corriger, sans rien perdre. */
      reprendreOnboarding: () =>
        setProfil((p) => ({ ...p, onboarding: { etape: 0, termine: false } })),
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
    definirAnnee,
    definirRevenuPercu,
    definirFraisMois,
    definirPostesDuMois,
    definirVersementSalaire,
    basculerCloture,
    ajouterObjectif,
    modifierObjectif,
    retirerObjectif,
    enregistrerAchat,
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
