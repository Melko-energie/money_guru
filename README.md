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
| Stack | Vite 5 · React 18 · TypeScript strict · Tailwind 3 · framer-motion |
| Dépendances | 7 — React, framer-motion, lucide-react, deux polices, Supabase |
| Calculs | Tous dans le navigateur. Aucun calcul à distance, jamais |
| Données | `localStorage`, clé `money-guru:profil:v2` — source locale, toujours |
| Comptes | Facultatifs. Une adresse e-mail, un lien reçu, aucun mot de passe |
| Saisie | Manuelle uniquement : aucune importation bancaire |
| Devise | MAD par défaut, formatage multi-devise (EUR, USD, GBP, AED, CAD, CHF) |
| Écrans | Téléphone et grand écran — deux mises en page, aucune fonction perdue |
| Adressage | Ancre : `#/mois/suivi`, `#/strategie/objectifs`… rechargement et retour arrière |
| Ports | dev **6012** · backend réservé **3012** · prod Docker **6112** |
| Tests | 287 · `tsc --noEmit` propre · build vert |

---

# Cloner et démarrer

## 1. Ce qu'il faut

**Node 20** ou plus récent. Rien d'autre. Pas de base de données, pas de serveur, pas de
compte à créer pour faire tourner l'application.

## 2. Installer

```bash
git clone <adresse-du-depot> money_guru
cd money_guru/ui
npm install
npm run dev
```

L'application s'ouvre sur **http://localhost:6012**.

Sous Windows, `.\start-all.bat` depuis la racine fait la même chose.

## 3. Premier lancement

L'application démarre **vide**. Elle ne montre aucun chiffre inventé : elle pose ses
questions en huit étapes — prénom, devise, revenu, frais, méthode d'allocation, fonds
d'urgence, dettes, patrimoine.

Le parcours se reprend là où on s'est arrêté. Il se relance plus tard depuis « Mes
chiffres ».

À ce stade tout fonctionne : les huit vues, tous les calculs, le calendrier, les
objectifs. Vos chiffres vivent dans le navigateur et n'en sortent pas.

## 4. Activer les comptes — facultatif

Sans cette étape, l'application reste locale à un appareil. Avec, chacun retrouve ses
chiffres sur son téléphone comme sur son ordinateur.

**a.** Créer un projet sur [supabase.com](https://supabase.com) — gratuit.

**b.** Dans son éditeur SQL, exécuter le contenu de `supabase/schema.sql`. Il crée la
table des profils et les règles qui enferment chacun dans sa propre ligne.

**c.** Copier `ui/.env.example` vers `ui/.env` et y mettre les deux valeurs, qui se
trouvent dans Supabase sous *Settings → API* :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
```

**d.** Dans Supabase, *Authentication → URL Configuration* : inscrire l'adresse du site.
Sans elle, le lien de connexion ne saura pas où revenir.

**e.** Relancer `npm run dev`. Les variables sont lues au démarrage, pas en cours de
route.

> La clé « anon » est **publique par nature**. Elle est faite pour vivre dans un
> navigateur. La sécurité ne repose pas sur son secret mais sur les règles de ligne
> posées à l'étape **b**. La clé « service_role » n'a rien à faire ici : elle contourne
> ces règles.

## 5. Vérifier que tout est sain

```bash
cd ui
npx tsc --noEmit
npx vitest run
npm run build
```

---

# Comment l'application est faite

Trois couches, et une règle : chacune ne fait qu'une chose.

## La donnée — un seul objet

Tout tient dans un objet unique, le **profil**. Revenu, postes de frais, ratios
d'allocation, dettes, patrimoine, journal des dépenses, mois renseignés, objectifs.

Il est gardé dans le stockage du navigateur, et rechargé au démarrage. À la lecture il
passe par une normalisation qui complète les champs absents : un profil enregistré par
une version antérieure est réparé, jamais rejeté.

Toute modification passe par un seul point d'entrée, qui **date** le profil. Cette date
est l'arbitre entre deux appareils.

## Le calcul — des fonctions pures

Aucune règle métier ne vit dans un composant. Tout est dans des fonctions qui prennent
des chiffres et rendent des chiffres, sans React, sans effet de bord, sans date implicite.

C'est ce qui rend les tests lisibles : on donne un profil, on attend un résultat.

## L'affichage — des vues qui lisent

Les vues ne calculent pas. Elles lisent ce que le contexte a déjà calculé et le mettent
en forme. Une même valeur ne peut donc pas être calculée de deux façons dans deux écrans.

Pas de routeur : la navigation vit dans l'ancre de l'adresse. Pas de gestionnaire d'état
externe : un contexte React suffit.

---

# Ce que fait l'application

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

## Les six catégories

| Catégorie | Rôle |
|---|---|
| Maintenance personnelle | Coût mensuel pour tenir une vie stable — base du fonds d'urgence |
| Fonds d'urgence | Réserve liquide, objectif 6 mois de maintenance |
| Dettes personnelles | Sans intérêt, auprès de particuliers — limite d'emprunt et alerte |
| Capital productif | Construction de capital long terme, sans référence produit |
| Objectifs | Projets datés court/moyen terme, hors urgence |
| Fun money | Plaisir assumé parce que prévu |

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

---

# Les comptes

## Plusieurs personnes, une même application

L'application est faite pour être ouverte par n'importe qui. Chacun crée son compte avec
sa propre adresse, et ne voit que ses chiffres.

| | |
|---|---|
| Sans compte | Tout fonctionne. Les chiffres restent dans ce navigateur, sur cet appareil |
| Avec un compte | Les mêmes chiffres sur tous ses appareils |
| Entre personnes | Rien n'est partagé. Aucune requête ne peut sortir de sa propre ligne |

Les inscriptions sont **ouvertes** : la première connexion crée le compte. Pour réserver
l'application à un cercle fermé, désactiver les nouvelles inscriptions dans Supabase,
sous *Authentication → Sign In / Providers*.

## Comment on se connecte

Une adresse e-mail, un lien reçu, aucun mot de passe à retenir. Il n'y a pas d'étape
« inscription » séparée : la première connexion crée le compte.

Le lien revient sur la page par la **requête** (`?code=`) et non par l'ancre, pour ne pas
écraser l'adresse de la vue ouverte.

> **Le lien doit être ouvert dans le navigateur qui l'a demandé.** Ce navigateur garde
> un secret de son côté ; le lien seul ne suffit pas. Ouvrir le mail dans un autre
> navigateur fait échouer la connexion.

Sur un appareil neuf, le questionnaire d'accueil occupe tout l'écran. Il porte donc ses
propres portes : **« J'ai déjà mes chiffres sur un autre appareil »** et **« Restaurer
une copie »**. C'est le chemin à prendre — un profil arrivé vierge récupère l'autre sans
rien demander, alors qu'un questionnaire rempli d'abord déclencherait un conflit inutile.

## Ce qui circule

Une ligne par personne, le profil entier dans une colonne JSON. Aucun calcul n'est fait à
distance : la base ne sert qu'à transporter la copie.

| Règle | Comportement |
|---|---|
| Source locale | Le stockage du navigateur reste la vérité de l'appareil ; sans réseau, tout continue |
| Envoi | Automatique, quelques secondes après la dernière frappe |
| Arbitrage | La copie la plus récente gagne — chaque modification est datée |
| Conflit | Si les deux copies ont bougé depuis le dernier échange, l'application **s'arrête et demande**, en montrant les chiffres de chacune |
| Appareil neuf | Un profil jamais rempli prend la copie distante sans rien demander |
| Panne | Le message de la base est affiché tel quel, jamais transformé en « aucune copie » |
| Déconnexion | Ne supprime rien sur l'appareil |

## Copie de sécurité

Dans « Mes chiffres », carte *Copie de sécurité* : **Enregistrer une copie** dépose un
fichier `money-guru-AAAA-MM-JJ.json` sur le disque, **Restaurer une copie** le relit.

C'est le seul chemin qui marche toujours : ni compte, ni réseau, ni base. Il est proposé
aussi sur l'écran d'accueil, pour qu'un appareil neuf puisse s'ouvrir sur des chiffres
existants sans dépendre de quoi que ce soit.

Restaurer remplace tout, donc l'application montre d'abord ce que le fichier contient —
prénom, revenu, mois renseignés, dépenses, objectifs — et attend une confirmation. Un
fichier qui n'est pas un profil Money Guru est refusé avant d'être ouvert ; un profil
d'une version antérieure est complété par les valeurs vides plutôt que rejeté. La copie
restaurée repart datée du jour : c'est elle qui l'emporte sur les autres appareils.

---

# Design

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

---

# Exploitation

## Vérifier

```bash
cd ui
npx tsc --noEmit
npx vitest run
npm run build
```

Les tests couvrent les calculs (allocation, urgence, dette, projection, score), le
calendrier et ses récurrences, la chaîne mensuelle et son report, le cumul pluriannuel,
la faisabilité des objectifs, la recherche, le parcours d'accueil, la structure des vues,
la parité téléphone, l'arbitrage entre deux appareils, et la lecture d'un fichier de
sauvegarde.

## Déployer

**Netlify** — `netlify.toml` à la racine : base `ui`, commande `npm run build`, dossier
publié `dist`, Node 20, toute adresse retombe sur la page unique.

Pour les comptes, déclarer `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les
variables d'environnement du site. Elles sont lues **à la construction**, pas à
l'exécution : il faut donc reconstruire après les avoir ajoutées.

```bash
git push
```

En dépôt non connecté, générer puis déposer le dossier `ui/dist` :

```bash
npm run build --prefix ui
```

**Docker / nginx** — `.\deploy.bat` → http://localhost:6112

## Partage sur le réseau local

Le serveur de développement écoute déjà sur toutes les adresses. Ouvrir le port (droits
admin) :

```powershell
New-NetFirewallRule -DisplayName "Money Guru 6012" -Direction Inbound -Protocol TCP -LocalPort 6012 -Action Allow
```

## Arborescence

```
money_guru/
├── netlify.toml                 déploiement : base ui, publie ui/dist
├── supabase/schema.sql          table des profils et règles de ligne
├── Template/                    T1 mise en page · T2 charte · T3-T5 téléphone
├── context.md · questions.md    brief produit et points à trancher
├── ui/.env.example              les deux variables des comptes
├── ui/src/
│   ├── main.tsx                 les trois fournisseurs, puis l'application
│   ├── App.tsx                  coquille, rail, transitions de vue
│   ├── components/              barre supérieure, rail, barre basse, feuilles, carte,
│   │                            chiffre, champs, anneau, courbe, jauge, boutons,
│   │                            synchro (connexion, choix entre deux copies),
│   │                            sauvegarde (enregistrer, restaurer)
│   ├── features/
│   │   ├── onboarding/          le parcours en huit étapes, et ses portes de secours
│   │   ├── tableau/             tableau de bord, bureau et téléphone
│   │   ├── calendrier/          grille, liste mobile, vue annuelle
│   │   ├── suivi/               fiche du mois, avancement de l'année
│   │   ├── objectifs/           achats prévus et leur faisabilité
│   │   ├── reglages/            « Mes chiffres », vos appareils, copie de sécurité
│   │   ├── methodes/ simulateur/ patrimoine/
│   ├── lib/                     calculs · suivi · objectifs · calendrier · methodes ·
│   │                            pedagogie · recherche · sections · format ·
│   │                            graphiques · animations · definitions · types ·
│   │                            synchro (arbitrage) · supabase (client) ·
│   │                            profil (normalisation et lecture d'une sauvegarde)
│   ├── state/                   finances (le profil) · synchro (comptes et échanges) ·
│   │                            navigation · animations · media
│   ├── __tests__/               douze fichiers, 287 tests
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
