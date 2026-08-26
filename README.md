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
| Stack | Vite · React 18 · TypeScript · Tailwind · framer-motion |
| Données | `localStorage`, clé `money-guru:profil:v2` — aucun compte, aucun serveur |
| Saisie | Manuelle uniquement : aucune synchronisation ni importation bancaire |
| Devise | MAD par défaut, formatage multi-devise (EUR, USD, GBP, AED, CAD, CHF) |
| Cible | Laptop / grand écran (≥ 1024 px) |
| Ports | dev **6010** · backend réservé **3010** · prod Docker **6110** |

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

→ http://localhost:6010 · arrêt `.\stop-all.bat` · prod nginx `.\deploy.bat` → :6110

## Les six vues

- **Tableau de bord** — zone haute (revenu net, méthode, devise, score de marge de
  manœuvre), alertes contextuelles, rangée défilante des six catégories avec curseurs,
  jauge du fonds d'urgence à paliers, bandeau de dette avec limite d'emprunt, zone
  calendrier du mois réel, anneau de répartition, projection sur 42 ans, zone pédagogique.
- **Comparer les méthodes** — les cinq stratégies projetées sur vos chiffres réels, avec
  le coût ou le gain d'un changement, en capital de carrière.
- **Calendrier des dépenses** — grille mensuelle, total par jour, détail du jour
  sélectionné, ajout / modification / suppression, jours anormalement élevés, récurrences
  projetées sur les mois suivants et écart prévu contre réel par catégorie.
- **Simulateur « et si… »** — montant initial, versement, taux, durée, devise, moment du
  versement. Courbe, comparaison 3/5/7/10 %, et différence entre deux scénarios.
- **Mon patrimoine** — les cinq classes de capital, mobilisable contre biens d'usage.
- **Mes chiffres** — toutes les saisies : revenu, devise, frais de maintenance ligne à
  ligne, méthode, ratios, fonds d'urgence, dettes, rendement retenu.

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

- `montant_categorie = revenu_net_mensuel × ratio_categorie`, ratios verrouillés à 100 %.
- `pression_maintenance = frais_maintenance / revenu_net` — alerte au-delà de 60 %.
- `objectif_fonds_urgence = frais_maintenance × 6`, paliers 1 / 3 / 6 mois, progression
  affichée **en mois couverts** autant qu'en pourcentage.
- Dette sans intérêt : `limite_emprunt = revenu_net × multiplicateur`,
  `ratio_remboursement = remboursement_mensuel / revenu_net` — alerte au-delà de 20 %
  ou de la limite.
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

Structure reprise de `inspo/dashboard.png` : fenêtre en grand rectangle, rails latéraux
en verre en couche arrière, carte blanche qui les chevauche, colonne large + colonne
étroite, carrousel de cartes, panneau de statistiques sombre. Habillage **charte Melko**
(Encre, Papier, Forêt, Saphir), étendue de trois teintes pour couvrir les six
catégories : ardoise (maintenance), prune (objectifs), ambre (fun money), brique
(dettes et alertes). Typo Inter + Instrument Serif.

Animations : entrée en cascade, blobs d'ambiance, transitions de vue en spring. Bouton
**animations on/off** dans le rail, `prefers-reduced-motion` respecté d'office.

## Vérifier

```bat
cd ui
npx tsc --noEmit
npx vitest run
npm run build
```

## Partage sur le réseau local

`vite.config.ts` écoute déjà sur `0.0.0.0`. Ouvrir le port (droits admin) :

```powershell
New-NetFirewallRule -DisplayName "Money Guru 6010" -Direction Inbound -Protocol TCP -LocalPort 6010 -Action Allow
```

## Arborescence

```
money_guru/
├── inspo/dashboard.png          maquette de référence
├── context.md · questions.md    brief produit v2.0 et points à trancher
├── ui/src/
│   ├── App.tsx                  fenêtre, rails en verre, transitions de vue
│   ├── components/              rails, barre supérieure, anneau, courbe, jauge,
│   │                            alertes, pédagogie, champs
│   ├── features/                tableau · methodes · calendrier · simulateur ·
│   │                            patrimoine · reglages
│   ├── lib/                     calculs · methodes · calendrier · pedagogie · format ·
│   │                            graphiques · animations · donneesDemo · types
│   └── state/                   finances (localStorage) · animations
├── server/                      réservé, vierge
├── Dockerfile · nginx.conf · docker-compose.yml
└── start-all.bat · stop-all.bat · deploy.bat
```

## Sources de méthode

FMEF (budget, catégorisation, alerte de surendettement) · AMMC (horizon, liquidité,
risque et rentabilité) · FINRA (fonds d'urgence liquide, 3 à 6 mois) · Investor.gov
(investissement régulier, croissance composée) · Zakat Foundation (classes de patrimoine).
Liens complets dans `context.md` §13.
