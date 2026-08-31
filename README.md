# Money Guru

Application web de **visualisation financière** pour salarié. Elle transforme un salaire
mensuel en stratégie lisible : combien finance la survie courante, la sécurité, les
dettes, le capital de long terme, les objectifs intermédiaires et le plaisir.

Money Guru ne fait **aucune opération bancaire** : pas de virement, pas d'achat, pas de
vente, pas d'API bancaire. Elle présente les résultats prévus d'une stratégie en cours,
rend les arbitrages visibles, et montre l'effet d'une discipline mensuelle sur une
carrière complète.

## En bref

| | |
|---|---|
| Stack | Vite 5 · React 18 · TypeScript · Tailwind 3 · framer-motion |
| Données | `localStorage`, clé `money-guru:profil:v2` — aucun compte, aucun serveur |
| Saisie | Manuelle uniquement : aucune synchronisation ni importation bancaire |
| Devise | MAD par défaut, formatage multi-devise (EUR, USD, GBP, AED, CAD, CHF) |
| Écrans | Téléphone et grand écran — deux mises en page, aucune fonction perdue |
| Adressage | Ancre : `#/mois/suivi`, `#/strategie/objectifs`… rechargement et retour arrière |
| Ports | dev **6012** · backend réservé **3012** · prod Docker **6112** |
| Tests | 257 · `tsc --noEmit` propre · build vert |

## Démarrer

```bat
.\start-all.bat
```

ou à la main :

```bat
cd ui
npm install
npm run dev
```

→ http://localhost:6012 · arrêt `.\stop-all.bat` · prod nginx `.\deploy.bat` → :6112

Au premier lancement l'application est **vide** : elle pose ses questions en huit étapes
plutôt que d'afficher des chiffres inventés. Le parcours se reprend là où on s'est
arrêté, et se relance depuis « Mes chiffres ».

## Les huit vues, en cinq sections

| Section | Vue | Ce qu'elle répond |
|---|---|---|
| Tableau de bord | Tableau de bord | Où j'en suis ce mois-ci |
| Mon mois | Calendrier des dépenses | Où part l'argent, jour par jour |
| Mon mois | Suivi mensuel | Ce que le mois laisse, et ce qu'il transmet |
| Ma stratégie | Comparer les méthodes | Ce que coûte ou rapporte un changement de stratégie |
| Ma stratégie | Mes objectifs | Cet achat à cette date, réalisable ou pas |
| Ma stratégie | Simulateur « et si… » | Ce que produit un versement régulier |
| Mon patrimoine | Mon patrimoine | Ce qui est mobilisable, ce qui ne l'est pas |
| Mes chiffres | Mes chiffres | Toutes les saisies au même endroit |

Trois chemins vers ces vues : les sections en toutes lettres dans la barre du haut, le
rail d'icônes à gauche, et au téléphone la barre basse à trois pastilles plus une feuille
qui liste les huit.

## Le mois, unité de suivi

C'est le cœur de l'application. Un mois n'est pas une donnée isolée.

- **Un revenu par mois.** 5 000 en août et 15 000 en septembre ne donnent pas la même
  répartition. Toute l'application — allocation, alertes, budgets du calendrier, capacité
  d'un objectif — suit le revenu du mois regardé.
- **Le mois que le salaire finance.** Un salaire touché le 28 fait vivre le mois suivant.
  Le réglage est dans « Mes chiffres » ; quand il est actif, le budget de septembre est
  rempli par le salaire d'août, et chaque ligne du tableau annuel le dit : *finance sept.*
- **Des frais par mois.** Les frais de maintenance se règlent poste par poste, pour le
  modèle qui vaut partout ou pour un mois précis. Un loyer qui augmente en mars ne
  réécrit pas janvier. Le détail d'un mois prime sur son total en un chiffre, qui prime
  sur le modèle.
- **Les frais déclarés sortent sans saisie.** Ils sont comptés comme dépensés dans toutes
  les vues : c'est ce qui évite d'afficher « 0 dépensé sur la maintenance » pendant qu'on
  paie son loyer.
- **Le reste passe au mois suivant**, catégorie par catégorie, dès que le mois est clos.
  Le report n'est jamais stocké : il est recalculé depuis le premier mois porteur de
  données, donc corriger un mois ancien se propage tout seul.
- **Le cumul traverse les années.** Janvier reprend le total de décembre. Le suivi
  commence à la première année porteuse de données, jamais avant.

## Les objectifs

Un achat, une date, un verdict. L'application confronte le montant visé à ce que la
situation finance réellement d'ici l'échéance, aux salaires annoncés pour ces mois-là.

Le financement est **un choix, jamais deux réglages côte à côte** :

- **par un poste** — objectifs, fun money, capital productif ou fonds d'urgence : le
  ratio du poste donne le rythme ;
- **par un montant fixe** — ce que vous décidez de mettre de côté chaque mois.

Les conseils sont chiffrés et conditionnels : rythme exact à tenir, mois d'atteinte réel
au rythme actuel, points de ratio à trouver ailleurs que dans la maintenance, budget que
la situation finance vraiment, priorité au fonds d'urgence incomplet, alerte quand
l'engagement dépasse ce qui reste une fois les frais payés. Le jour venu, « Enregistrer
l'achat » inscrit une vraie ligne au calendrier, une seule fois.

## Les six catégories

| Catégorie | Rôle |
|---|---|
| Maintenance personnelle | Coût mensuel pour tenir une vie stable — base du fonds d'urgence |
| Fonds d'urgence | Réserve liquide, objectif 6 mois de maintenance |
| Dettes personnelles | Sans intérêt, auprès de particuliers — limite d'emprunt et alerte |
| Capital productif | Construction de capital long terme, sans référence produit |
| Objectifs | Projets datés court/moyen terme, hors urgence |
| Fun money | Plaisir assumé parce que prévu |

## Règles de calcul

- `montant_categorie = revenu_du_mois × ratio_categorie`, ratios verrouillés à 100 %.
  Les parts se règlent au curseur ou au chiffre exact, point par point.
- `pression_maintenance = frais_du_mois / revenu_du_mois` — alerte au-delà de 60 %.
- `objectif_fonds_urgence = frais_maintenance × 6`, paliers 1 / 3 / 6 mois, progression
  affichée **en mois couverts** autant qu'en pourcentage.
- Dette sans intérêt : `limite_emprunt = revenu_net × multiplicateur`,
  `ratio_remboursement = remboursement_mensuel / revenu_net` — alerte au-delà de 20 %
  ou de la limite.
- Suivi mensuel : `reste = report_entrant + alloué − frais_déclarés − dépenses_saisies`.
  Seul un mois clos transmet son reste.
- Avancement annuel : `salaire_cumulé + salaire_du_mois − frais_du_mois_financé`.
  Un mois compte dès qu'il est passé, ou dès que son salaire est saisi d'avance.
- Objectif : `effort_mensuel = (montant − déjà_de_côté) / mois_restants`, échéance
  incluse. Le mois d'atteinte se calcule en avançant mois par mois, jamais en divisant :
  les salaires annoncés ne sont pas identiques d'un mois à l'autre.
- Projection : `taux_mensuel = taux_annuel / 12`, capitalisation mensuelle, **versements
  en début de mois**, horizon principal **42 ans**.
  `capital_final = C₀(1+i)ⁿ + V·((1+i)ⁿ−1)/i·(1+i)` · `gain_brut = capital − versé`.
  Repère : 1 000 MAD/mois à 7 % sur 1 an ≈ **468 MAD** de gain brut en début de mois
  (≈ 396 en fin de mois).
- **Score de marge de manœuvre** (0-100) : pression de maintenance 35 %, fonds d'urgence
  30 %, dette 20 %, part consacrée au futur 15 %.
- **Jour coûteux** : signalé au-delà de la moyenne des jours dépensés du mois, plus une
  fois et demie leur écart-type. En dessous de trois jours dépensés, rien n'est signalé.
- **Récurrence** : une dépense cochée « récurrente » est reportée sur les mois suivants,
  au même jour du mois (borné à la longueur du mois), tant qu'aucune occurrence réelle
  n'y a été saisie. La projection reste un affichage : elle n'entre dans le journal que
  lorsqu'elle est confirmée.

> Résultats **bruts** : ni frais, ni fiscalité, ni inflation. Les taux sont des scénarios
> pédagogiques et ne représentent aucun produit d'épargne précis. Aucun conseil en
> investissement. Crypto, placements spéculatifs et crédit bancaire avec intérêts sont
> hors périmètre.

La vue patrimoine s'inspire des grandes classes utilisées pour évaluer un patrimoine
dans les calculs de zakat — elle distingue le mobilisable de l'usage. **Ce n'est pas un
calculateur de zakat** : aucun seuil ni taux n'est appliqué.

## Design

Mise en page reprise de `Template/T1.png` : barre supérieure flottante en verre, rail
d'icônes détaché, grille colonne étroite · large · étroite, bouton ↗ par carte.
Charte de couleurs relevée sur `Template/T2.png` — glacé `#D9EDF4`, bleu `#74B5D5`,
olive `#767D2F`, olive profond `#2F370E`, encre `#27282A` — plus deux teintes hors
nuancier pour les états : alerte `#B4452F`, succès `#2E7D5B`. Typo Inter + Instrument
Serif.

Téléphone : principes repris de `Template/T3-T5.png` — barre basse à trois pastilles,
feuille de menu plein écran, feuilles glissantes pour les réglages. Ce n'est pas la
version bureau rétrécie : le disque de synthèse, la liste des postes, la liste des
dépenses et les cartes de l'avancement annuel sont des mises en page distinctes, montées
seules. **Aucune fonction du grand écran n'est absente du téléphone.**

Animations : entrée en cascade, halos d'ambiance, transitions de vue. Bouton
**animations on/off** dans « Mes chiffres », `prefers-reduced-motion` respecté d'office.

## Vérifier

```bat
cd ui
npx tsc --noEmit
npx vitest run
npm run build
```

Les tests couvrent les calculs (allocation, urgence, dette, projection, score), le
calendrier et ses récurrences, la chaîne mensuelle et son report, le cumul pluriannuel,
la faisabilité des objectifs, la recherche, le parcours d'accueil, la structure des vues
et la parité téléphone.

## Déployer

**Netlify** — `netlify.toml` à la racine : base `ui`, commande `npm run build`, dossier
publié `dist`, Node 20, toute adresse retombe sur la page unique.

```bash
git push
```

En dépôt non connecté, générer puis déposer le dossier `ui/dist` :

```bash
npm run build --prefix ui
```

**Docker / nginx** — `.\deploy.bat` → http://localhost:6112

## Partage sur le réseau local

`vite.config.ts` écoute déjà sur `0.0.0.0`. Ouvrir le port (droits admin) :

```powershell
New-NetFirewallRule -DisplayName "Money Guru 6012" -Direction Inbound -Protocol TCP -LocalPort 6012 -Action Allow
```

## Arborescence

```
money_guru/
├── netlify.toml                 déploiement : base ui, publie ui/dist
├── Template/                    T1 mise en page · T2 charte · T3-T5 téléphone
├── context.md · questions.md    brief produit et points à trancher
├── ui/src/
│   ├── App.tsx                  coquille, rail, transitions de vue
│   ├── components/              barre supérieure, rail, barre basse, feuilles,
│   │                            carte, chiffre, champs, anneau, courbe, jauge
│   ├── features/
│   │   ├── onboarding/          le parcours en huit étapes
│   │   ├── tableau/             tableau de bord, bureau et téléphone
│   │   ├── calendrier/          grille, liste mobile, vue annuelle
│   │   ├── suivi/               fiche du mois, avancement de l'année
│   │   ├── objectifs/           achats prévus et leur faisabilité
│   │   ├── methodes/ simulateur/ patrimoine/ reglages/
│   ├── lib/                     calculs · suivi · objectifs · calendrier · methodes ·
│   │                            pedagogie · recherche · sections · format ·
│   │                            graphiques · animations · definitions · types
│   ├── state/                   finances (localStorage) · navigation · animations · media
│   └── test/                    profil de test — jamais livré à l'application
├── server/                      réservé, vierge
├── Dockerfile · nginx.conf · docker-compose.yml
└── start-all.bat · stop-all.bat · deploy.bat
```

## Sources de méthode

FMEF (budget, catégorisation, alerte de surendettement) · AMMC (horizon, liquidité,
risque et rentabilité) · FINRA (fonds d'urgence liquide, 3 à 6 mois) · Investor.gov
(investissement régulier, croissance composée) · Zakat Foundation (classes de patrimoine).
Liens complets dans `context.md` §13.
