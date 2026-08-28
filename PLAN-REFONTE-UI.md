# Plan — Refonte UI/UX + version mobile

> Analyse terminée. **Rien n'a été modifié.** Ce document attend ta validation.

---

## 1. Inventaire de l'existant — le contrat de conservation

Tout ce qui suit doit se retrouver à l'identique après le chantier.

### 1.1 Pages et navigation

Il n'y a **aucun routeur** : la navigation est un `useState<Vue>` dans `App.tsx`.
Six vues, pas d'URL, pas d'historique navigateur.

| Vue | Rôle |
|---|---|
| `tableau` | Tableau de bord, vue d'entrée |
| `methodes` | Comparaison des cinq stratégies |
| `calendrier` | Grille mensuelle des dépenses |
| `simulateur` | Projection « et si… » |
| `patrimoine` | Cinq classes de capital |
| `reglages` | Toutes les saisies |

### 1.2 KPI — 34 indicateurs, aucun ne disparaît

**Situation** — revenu net · frais de maintenance · fun money mensuel · pression de maintenance · reste après maintenance · score de marge de manœuvre (+ ses 4 composantes détaillées).

**Répartition** — les 6 montants par catégorie · les 6 ratios en % · part sécurité-et-futur · part vie courante.

**Sécurité** — objectif du fonds d'urgence · solde · progression en % · mois couverts · mois restants avant objectif · 3 paliers (1/3/6 mois).

**Dette** — total dû · remboursement mensuel · limite d'emprunt · usage de la limite · ratio de remboursement · ratio dette/revenu · mois pour solder.

**Projection** — capital projeté à 42 ans · total versé · gain brut · part du gain.

**Calendrier** — total réel du mois · total projeté · total prévu · écart prévu/réel par catégorie · seuil de jour coûteux · 3 jours les plus coûteux · récurrences actives.

**Patrimoine** — capital mobilisable · patrimoine total · les 5 classes.

**Méthodes** — par stratégie : capital de carrière · gain · fun mensuel · mois avant objectif urgence · mois pour solder · score · écart de capital face à la méthode en cours.

### 1.3 Filtres et contrôles — aucun ne disparaît

| Contrôle | Où | Type |
|---|---|---|
| Mois affiché (précédent / suivant / aujourd'hui) | Calendrier | navigation |
| Jour sélectionné | Calendrier | sélection dans la grille |
| Catégorie de la dépense | Formulaire de dépense | sélecteur 6 valeurs |
| Récurrente / ponctuelle | Formulaire de dépense | bascule |
| Catégorie active (mise en avant) | Anneau, patrimoine | sélection |
| Devise | Réglages, barre supérieure | sélecteur 7 valeurs |
| Méthode d'allocation | Réglages, comparaison | sélecteur 5 valeurs |
| 6 curseurs de ratios | Réglages, tableau de bord | curseurs verrouillés à 100 % |
| Taux de rendement | Réglages, simulateur | curseur |
| Durée de projection | Simulateur | curseur |
| Moment du versement (début / fin) | Simulateur | segments |
| Scénario comparé (écart de taux, écart de durée) | Simulateur | curseurs |
| Redirection après fonds d'urgence | Réglages | sélecteur |
| Animations on / off | Rail latéral | bascule |

### 1.4 Workflows

1. Saisir ses chiffres → voir la répartition → ajuster les curseurs.
2. Comparer les méthodes → adopter une méthode depuis la comparaison.
3. Ouvrir le calendrier → ajouter / modifier / supprimer une dépense datée.
4. Confirmer une récurrence projetée → elle entre dans le journal.
5. Simuler un scénario → le comparer à un second scénario.
6. Renseigner ses classes de patrimoine.
7. Changer de devise → tout se reformate, journal compris.
8. Réinitialiser le profil.

### 1.5 Zones à ne pas toucher

| Élément | Raison |
|---|---|
| `lib/calculs.ts`, `methodes.ts`, `calendrier.ts` | Formules adossées au `context.md`, couvertes par 564 lignes de tests |
| `state/finances.tsx` | Source de vérité unique, forme du `localStorage` |
| Clé `money-guru:profil:v2` | La changer efface les données de l'utilisateur |
| Absence d'action bancaire (FR-16) | Règle produit verrouillée par test |

---

## 2. Ce que disent les trois références

### T1 — layout (dashboard fintech vert « Quixotic »)

- Fond gris clair, cartes blanches à grand rayon, ombres douces.
- **Barre supérieure blanche flottante** : logo à gauche · onglets pilule au centre · recherche / notifications / avatar à droite.
- **Rail d'icônes flottant à gauche**, détaché, en deux groupes séparés par un vide.
- Titre de page géant en deux tons (noir + gris).
- Actions de page à droite du titre : sélecteur de période, bouton « + ».
- **Grille 3 colonnes** : colonne étroite (carte de synthèse + petit KPI) · colonne large (graphique) · colonne étroite (solde + actions + carte secondaire).
- Chaque carte porte un bouton « ouvrir » ↗ en haut à droite.
- Tableau en bas, pleine largeur, avec pastilles de statut.
- Segments pilule dans l'en-tête du graphique (`Monthly` / `Annually`).

### T2 — charte couleur

Ce n'est pas une maquette : c'est un nuancier de **cinq couleurs**, relevé au pixel.

| | Hex | Rôle proposé |
|---|---|---|
| ⬜ | `#D9EDF4` | fond glacé, tint |
| 🟦 | `#74B5D5` | accent secondaire |
| 🟩 | `#767D2F` | accent principal (olive) |
| 🟫 | `#2F370E` | olive profond, aplats sombres |
| ⬛ | `#27282A` | encre, texte |

### T3 / T4 / T5 — mobile

- **Barre de navigation flottante en bas**, 3 pastilles rondes, celle du centre en blanc plein et surélevée.
- T3 : en-tête compact (avatar + nom + cloche) · **grand disque de synthèse** avec le montant clé et un bouton d'action au centre · liste simple « poste / budget / montant » · grille 2×2 de petites cartes KPI.
- T4 : **page liste** — titre + sous-titre centrés · barre de recherche + bouton filtre · **4 actions rapides en cercles** (Add / Scan / Report / Recurring) · liste groupée par date avec total de groupe à droite.
- T5 : **page menu** — carte de profil en aplat sombre · sections (`Planning`, `Tracking`, `Insights`) · lignes icône + titre + sous-titre + chevron.

---

## 3. Conflits détectés — c'est là que j'ai besoin de toi

### A. La charte T2 n'a que 5 couleurs, l'app en demande 8

Les 6 catégories financières doivent rester distinguables, et il faut en plus un **rouge d'alerte** et un **vert de succès**. T2 ne contient ni rouge ni vert franc.

Sans décision, soit deux catégories deviennent identiques, soit j'invente des couleurs hors charte.

### B. Le skill UI-Stealer interdit ce que ton brief demande

Le skill dit noir sur blanc : « **Palette = charte Melko, pas les couleurs de l'image** ».
Ton brief dit : « **Reprendre exactement la charte couleur de l'image de référence** ».

Ton brief est prioritaire, mais je préfère te le signaler : la charte Melko disparaît de ce projet.

### C. Adopter T1 supprime les rails en verre

L'architecture actuelle — rails translucides en couche arrière, carte blanche qui les chevauche — est un « non négociable » du skill. T1 ne l'a pas : fond gris plat, barre et rail flottants.

Conséquence directe : `structure.test.tsx` (4 tests qui vérifient cet empilement) devient faux et doit être réécrit.

### D. Trois de nos pages n'existent pas dans T1

T1 ne montre qu'un dashboard. Le simulateur, la comparaison de méthodes et le patrimoine n'ont pas de modèle : je les composerai avec le vocabulaire T1 (cartes, segments pilule, tableau, bouton ↗).

### E. Six pages, trois boutons de navigation mobile

T3/T4/T5 utilisent 3 pastilles en bas. Nous avons 6 vues.

---

## 4. Cible proposée

### Desktop

Structure T1 reprise telle quelle, remplie avec nos contenus :

- barre supérieure flottante : logo Money Guru · onglets des 6 vues · devise · animations · réinitialiser ;
- rail d'icônes flottant à gauche : accès direct aux 6 vues, deux groupes ;
- titre géant deux tons + actions de page à droite ;
- grille 3 colonnes sur le tableau de bord :
  - étroite gauche → carte héros « votre mois » (aplat olive, façon carte VISA) + score de marge ;
  - large centre → anneau de répartition et courbe 42 ans, segments pilule pour basculer ;
  - étroite droite → fonds d'urgence, dette, patrimoine ;
- tableau pleine largeur en bas → dépenses récentes du journal, avec pastilles de catégorie ;
- bouton ↗ sur chaque carte pour ouvrir la vue détaillée correspondante.

### Mobile

Vraie adaptation, pas une réduction :

- **navigation basse à 3 pastilles** : `Calendrier` (liste, façon T4) · `Tableau` (accueil, centre surélevé) · `Menu` (grille, façon T5) ;
- le **menu T5** donne accès aux 3 vues restantes — méthodes, simulateur, patrimoine — plus les réglages, rangées en sections `Stratégie` / `Suivi` / `Mes chiffres` ;
- **tableau de bord mobile façon T3** : en-tête compact, grand disque avec le revenu net et « + Ajouter une dépense », liste des 6 catégories, grille 2×2 des KPI secondaires ;
- **calendrier mobile façon T4** : recherche + filtre, 4 actions rapides en cercles, dépenses groupées par jour avec total de groupe ;
- les curseurs de ratios passent en feuille glissante plutôt qu'en colonne.

### Moins de texte, sans rien perdre

Les zones lourdes en texte sont la zone pédagogique (3 notes longues), les messages d'alerte et les descriptions de méthodes. Aucune n'est supprimée : elles passent en **dépliable** — une ligne visible, le texte complet au clic.

---

## 5. Lots de travail

| Lot | Contenu | Risque |
|---|---|---|
| **L0** | Installer les dépendances, faire passer build + types + tests pour partir d'une base verte | aucun |
| **L1** | Charte : tokens Tailwind T2, `index.css`, états hover/actif/erreur/succès | faible |
| **L2** | Coquille desktop : barre supérieure, rail flottant, grille 3 colonnes, carte type | moyen — casse `structure.test.tsx` |
| **L3** | Remplissage desktop : les 6 vues reconstruites carte par carte | moyen — beaucoup de surface |
| **L4** | Coquille mobile : nav basse, page menu, en-tête compact | moyen |
| **L5** | Remplissage mobile : tableau T3, calendrier T4, feuilles glissantes | moyen |
| **L6** | Dépliables sur pédagogie, alertes, méthodes | faible |
| **L7** | Réécrire `structure.test.tsx`, réparer les sélecteurs de `tableau.test.tsx`, vérifier | faible |

`calculs.test.ts` et `calendrier.test.ts` ne sont pas touchés.

---

## 6. Décisions à trancher

Ma recommandation d'ensemble : **suivre ton brief à la lettre** (charte T2, layout T1, mobile T3-T5) et n'étendre la palette que là où l'application l'exige vraiment.

**1. Palette étendue.**
Choix : **A)** j'étends T2 par dérivation — j'assombris `#74B5D5` et j'éclaircis `#767D2F` pour obtenir les 6 catégories, dans la même famille · **B)** je limite T2 au décor et je garde les 6 couleurs actuelles pour les catégories · **C)** je supprime le code couleur des catégories, elles ne se distinguent plus que par l'icône.
*Recommandation : A.* Une seule charte, et les 6 catégories restent lisibles.

**2. Rouge et vert.**
T2 n'en contient aucun. Question : j'ajoute deux teintes hors nuancier pour alerte et succès — **oui ou non** ?
*Recommandation : oui.* Un dépassement de limite d'emprunt en olive n'alerte personne.

**3. Rails en verre.**
Question : je les supprime au profit du fond gris plat de T1 — **oui ou non** ?
*Recommandation : oui.* Les garder revient à mélanger deux chartes, ce que ton brief interdit.

**4. Navigation mobile.**
Choix : **A)** 3 pastilles fidèles à T3-T5, les 3 vues restantes dans la page menu · **B)** 5 pastilles, tout accessible en un geste, mais on s'écarte de la référence.
*Recommandation : A.*

**5. Découpage de la livraison.**
Choix : **A)** je livre lot par lot, tu valides entre chaque · **B)** je livre L1 à L7 d'un bloc.
*Recommandation : A*, avec une pause après L2 — c'est là que l'aspect général bascule.

**6. Le fichier `inspo/dashboard.png`** est l'ancienne référence de layout, remplacée par T1. Question : je le supprime, ou je le garde en archive ?

**7. Les images T1 à T5** sont à la racine et non versionnées. Question : je les range dans `Template/` comme le prévoit le skill, et je les committe — **oui ou non** ?

---

## 7. Zone technique concernée

- coquille : `ui/src/App.tsx`, `components/BarreSuperieure.tsx`, `RailLateral.tsx`, `RailJalons.tsx`
- charte : `ui/tailwind.config.js`, `ui/src/styles/index.css`
- vues : `ui/src/features/{tableau,methodes,calendrier,simulateur,patrimoine,reglages}`
- composants partagés : `ui/src/components/` (14 fichiers)
- tests à reprendre : `ui/src/__tests__/structure.test.tsx`, `tableau.test.tsx`
- intouchés : `ui/src/lib/`, `ui/src/state/finances.tsx`, `ui/src/__tests__/calculs.test.ts`, `calendrier.test.ts`
- références : `T1.png` à `T5.png`, `UI-Stealer/`
