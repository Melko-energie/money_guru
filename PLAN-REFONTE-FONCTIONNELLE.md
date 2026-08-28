# Refonte fonctionnelle — analyse et plan

> **Chantier terminé.** Toutes les recommandations ont été retenues et livrées.
> 152 tests passent, build vert. Voir « État de livraison » en fin de document.

---

## 1. Structure actuelle

Application 100 % navigateur, aucun serveur, aucun compte.

| Couche | Où | Rôle |
|---|---|---|
| Données | `state/finances.tsx` | Un objet `ProfilFinancier` unique, sauvegardé dans `localStorage` sous `money-guru:profil:v2` |
| Calculs | `lib/calculs.ts`, `methodes.ts`, `calendrier.ts` | Fonctions pures, 56 tests dédiés |
| Textes | `lib/pedagogie.ts` | Alertes et notes |
| Vues | `features/` | Six pages, pas de routeur : un `useState<Vue>` dans `App.tsx` |
| Coquille | `components/` | Barre en verre, rail, barre basse mobile, feuilles |

**Conséquence importante** : il n'y a pas d'URL. Pas de retour arrière navigateur, pas de lien partageable, pas d'étape d'onboarding adressable. C'est le premier obstacle au parcours progressif demandé.

---

## 2. Pages et onglets actuels

| Onglet | Contenu | Problème de classement |
|---|---|---|
| Tableau de bord | Situation, marge, projection, six postes, sécurité, dette, mois réel, notes | — |
| Méthodes | Comparaison des cinq stratégies | Sépare la stratégie de sa simulation |
| Calendrier | Grille du mois, saisie, écarts, récurrences | Isolé du suivi mensuel, qui n'existe pas |
| Simulateur | Projection paramétrable, comparaison de scénarios | Même famille que Méthodes, rangé ailleurs |
| Patrimoine | Cinq classes de capital | Page isolée, sans lien avec le reste |
| Mes chiffres | Toutes les saisies | Fourre-tout : revenu, frais, méthode, dettes, sécurité, rendement |

Les six onglets sont **à plat, au même niveau**, alors qu'ils ne jouent pas le même rôle : deux servent à piloter, deux à projeter, un à saisir, un à consulter.

---

## 3. Mock data à supprimer

Tout est dans `lib/donneesDemo.ts`.

| Élément | Contenu inventé |
|---|---|
| `PROFIL_PAR_DEFAUT` | Prénom « Yacine », 14 000 MAD de revenu, méthode 70/30, ratios, 18 400 de fonds d'urgence, 12 000 de dette, un patrimoine complet, 6 % de rendement |
| `DEPENSES_PAR_DEFAUT` | 8 postes chiffrés — logement 3 200, nourriture 1 800, etc. |
| `journalDemo()` | ~22 dépenses datées sur deux mois, dont 4 récurrences, avec un week-end à Essaouira à 2 400 |
| `SCENARIOS` | 3 raccourcis de simulation — à garder, ce sont des réglages, pas des données |
| `LIBELLES_CATEGORIE`, `COULEURS_CATEGORIE`, `LIBELLES_CAPITAL` | À garder — ce sont des définitions produit, pas des données utilisateur |

**Point dur** : **105 tests s'appuient sur ce profil** (« Yacine », 47 400 d'objectif, 70/30). Supprimer la mock data sans rien faire d'autre casse une vingtaine de tests. Il faut un jeu de données de test dédié, séparé du profil applicatif.

---

## 4. Données réellement nécessaires au profil

| Donnée | Type | Obligatoire | Utilisée par |
|---|---|---|---|
| Prénom | texte | non | Accueil, avatar |
| Devise | 7 valeurs | oui | Tout formatage |
| Revenu net mensuel | montant | **oui** | Tous les calculs d'allocation |
| Frais de maintenance | lignes libellé + montant | **oui** | Pression, objectif du fonds d'urgence |
| Méthode d'allocation | 5 valeurs | oui | Ratios |
| Ratios | 6 pourcentages à 100 % | oui | Montants par catégorie |
| Solde du fonds d'urgence | montant | oui | Progression, paliers, score |
| Dette totale | montant | non | Limite d'emprunt, alertes |
| Remboursement mensuel | montant | non | Ratio de remboursement |
| Multiplicateur de limite | nombre | non | Limite d'emprunt |
| Patrimoine, 5 classes | montants | non | Vue patrimoine, capital mobilisable |
| Taux de rendement | pourcentage | oui | Projection 42 ans |
| Redirection après urgence | 4 valeurs | non | **Aujourd'hui : rien** — voir §7 |
| Journal des dépenses | lignes datées | non | Calendrier, écarts |

**À ajouter** pour le suivi mensuel (§9) : un enregistrement par mois — revenu perçu, report entrant, report sortant, statut clôturé ou non.

---

## 5. Nouveau parcours d'onboarding

Huit étapes, une question à la fois, avec barre de progression et retour possible.

| # | Étape | Ce qu'on demande | Sautable |
|---|---|---|---|
| 1 | Bienvenue | Prénom, devise | prénom oui |
| 2 | Ce qui rentre | Revenu net mensuel | non |
| 3 | Ce qui sort | Frais de maintenance, ligne par ligne, avec postes suggérés à remplir | non |
| 4 | Votre sécurité | Combien avez-vous de côté aujourd'hui | non, 0 accepté |
| 5 | Vos dettes | Devez-vous de l'argent à des proches | oui |
| 6 | Votre patrimoine | Les cinq classes | oui |
| 7 | Votre méthode | Les cinq stratégies, avec l'effet sur vos chiffres calculé en direct | non |
| 8 | Récapitulatif | Tout relire, corriger, valider | — |

**Sauvegarde et reprise** : chaque étape écrit dans `localStorage` avec l'index de l'étape en cours. Quitter puis revenir reprend au même endroit. La validation finale marque le profil comme complet et ouvre le tableau de bord.

**Reprise plus tard** : les mêmes écrans doivent servir à la modification, depuis « Mes chiffres ». Un seul jeu de composants, deux modes.

---

## 6. Nouveau classement des pages

De six onglets à plat vers **cinq sections par rôle**.

| Section | Contient | Pourquoi |
|---|---|---|
| **Tableau de bord** | La vue d'ensemble | Point d'entrée, inchangé |
| **Mon mois** | Calendrier · **Suivi mensuel** (nouveau) | Le mois réel et sa continuité au même endroit |
| **Ma stratégie** | Méthodes · Simulateur | Comparer une stratégie et la projeter, c'est le même geste |
| **Mon patrimoine** | Les cinq classes | Reste seul, mais gagne un lien depuis le tableau de bord |
| **Mes chiffres** | Toutes les saisies, réorganisées en sections | Devient l'entrée de modification du profil |

Aucune page n'est supprimée. Deux paires sont regroupées, une page est ajoutée.

**Conséquence technique** : deux niveaux de navigation. Le `useState<Vue>` actuel ne suffit plus — il faut une section et une sous-vue. C'est aussi le moment de décider si on ajoute de vraies URL.

---

## 7. Actions actuellement non fonctionnelles

Trois trouvées, vérifiées dans le code.

| Action | Ce qui se passe | Ce qui devrait se passer |
|---|---|---|
| **La recherche** de la barre du haut | Le texte est stocké, **jamais lu**. Le champ ne filtre rien, ne mène nulle part. | Filtrer les dépenses et les postes, ou être retirée |
| **« Rediriger cette allocation vers »** | Le choix est sauvegardé, **jamais relu**. Une fois le fonds d'urgence plein, rien ne bouge. | Appliquer la redirection aux ratios, ou au moins la proposer avec un bouton qui agit |
| **Une dépense datée** | Elle entre dans le journal, mais **ne débite ni le fonds d'urgence ni la dette**. Rembourser 700 à Karim ne réduit pas les 12 000 dus. | Une dépense de catégorie dette ou urgence doit bouger le solde correspondant |

Tout le reste est branché : les 19 actions du contexte de données ont chacune au moins un appelant, et les saisies se répercutent bien.

---

## 8. Logique du calendrier

**Aujourd'hui** : une grille mensuelle, navigation mois précédent / suivant, un jour sélectionnable, saisie et suppression, récurrences projetées, écarts par catégorie. Sur téléphone, une liste groupée par jour.

**Manque** :

- pas de vue annuelle ;
- pas de navigation entre années ;
- aucune lecture d'un mois à l'autre ;
- le mois affiché n'est pas sauvegardé — recharger ramène au mois courant.

**Cible** :

```text
Vue annuelle (12 mois)
        ↓  clic sur un mois
Vue détaillée du mois (modale ou page)
        ↓
Jour sélectionné → saisie
```

La vue annuelle doit montrer, par mois : total dépensé, budget prévu, écart, report entrant, et si le mois est clôturé.

⚠️ **Le template de calendrier n'est pas dans le projet.** `Template/` ne contient que T1 à T5 — un dashboard, un nuancier et trois écrans mobiles, aucun calendrier. Voir §11.

---

## 9. Logique de suivi mensuel

C'est le changement le plus profond. Aujourd'hui **chaque mois est une donnée isolée** : le journal est filtré par mois, et rien ne circule de l'un à l'autre.

**Cible** :

```text
Report entrant (reste du mois précédent)
            +
Revenu du mois
            −
Dépenses saisies du mois
            ↓
Situation du mois
            ↓
Report sortant → mois suivant
```

**Ce qu'il faut ajouter** :

- un enregistrement par mois : `{ mois, revenuPercu, reportEntrant, reportSortant, clos }` ;
- une action **clôturer le mois** qui fige le report et l'envoie au mois suivant ;
- un recalcul en chaîne : modifier un mois ancien met à jour tous les suivants ;
- une section **Suivi mensuel** qui montre la chaîne des douze derniers mois.

**Question ouverte** : que reporte-t-on exactement ? Voir §11.

---

## 10. KPI existants et leur rôle

Les 34 KPI actuels, regroupés par section, avec ce que l'utilisateur doit comprendre.

### Situation

| KPI | Ce qu'il mesure | Alimenté par | À comprendre |
|---|---|---|---|
| Revenu net | Ce qui rentre chaque mois | saisie | La base de tout le reste |
| Frais de maintenance | Le coût pour tenir sa vie | saisie ligne à ligne | Ce qui est subi, pas choisi |
| Reste après maintenance | Ce qui reste à affecter | revenu − frais | Votre vraie marge de départ |
| Pression de maintenance | Part du revenu absorbée | frais / revenu | Au-delà de 60 %, tout devient lent |
| Score de marge | Agrégat de quatre tensions | pression, urgence, dette, futur | Un seul chiffre pour savoir si ça tient |

### Répartition

Les six montants par catégorie et leurs six ratios — **alimentés par revenu × ratio**. À comprendre : chaque dirham a une affectation avant d'être dépensé.

### Sécurité

Objectif, solde, progression, mois couverts, mois restants, trois paliers. À comprendre : combien de temps vous tenez sans revenu.

### Dette

Total dû, remboursement mensuel, limite d'emprunt, usage de la limite, ratio de remboursement, ratio dette/revenu, mois pour solder. À comprendre : à partir de quand emprunter devient dangereux.

### Projection

Capital à 42 ans, total versé, gain brut, part du gain. À comprendre : ce que la discipline mensuelle produit sur une carrière.

### Mois réel

Total dépensé, budget prévu, écart, seuil de jour coûteux, trois jours les plus lourds, récurrences. À comprendre : où part réellement l'argent.

### Patrimoine

Capital mobilisable, patrimoine total, cinq classes. À comprendre : ce que vous pouvez mobiliser, ce qui ne l'est pas.

### Méthodes

Par stratégie : capital de carrière, gain, fun mensuel, échéances, score, écart de capital. À comprendre : le coût ou le gain d'un changement.

**Ce qui manque à tous** : la phrase qui dit ce que ça veut dire. Le brief demande le format valeur + une ligne d'explication. Aujourd'hui la valeur est seule, ou noyée dans un paragraphe.

**Aucun KPI n'est à supprimer.** Deux sont à ajouter pour le suivi mensuel : report entrant et report sortant.

---

## 11. Points nécessitant une décision

Recommandation d'ensemble : traiter dans l'ordre **suivi mensuel → onboarding → navigation → calendrier annuel → KPI**, parce que le suivi mensuel change le modèle de données et que tout le reste s'y adosse.

**1. Le template de calendrier n'existe pas.**
`Template/` ne contient que T1 à T5. Aucun calendrier.
Choix : **A)** tu déposes l'image dans `Template/` · **B)** je conçois la vue annuelle dans le langage déjà en place (cartes, verre, charte T2).
*Recommandation : A si tu as la référence, sinon B.*

**2. Que reporte-t-on d'un mois à l'autre ?**
Choix : **A)** une seule enveloppe — revenu non dépensé · **B)** un report par catégorie — ce qui reste de fun money reste du fun money · **C)** seulement le solde du fonds d'urgence et la dette.
*Recommandation : B.* C'est le seul qui reste cohérent avec les six postes, mais c'est aussi le plus lourd.

**3. Le revenu est-il le même tous les mois ?**
Choix : **A)** un revenu fixe au profil · **B)** un revenu saisi mois par mois, avec le profil comme valeur par défaut.
*Recommandation : B*, sinon le suivi mensuel ne sert à rien pour une prime ou un mois creux.

**4. La recherche de la barre du haut.**
Choix : **A)** la rendre fonctionnelle — filtrer dépenses et postes · **B)** la retirer.
*Recommandation : A*, le champ est déjà là et l'application a assez de contenu pour le justifier.

**5. La redirection après le fonds d'urgence.**
Question : une fois les six mois atteints, j'applique la redirection **automatiquement** aux ratios, ou je propose un bouton « appliquer » ? **Auto / bouton ?**
*Recommandation : bouton.* Modifier les ratios dans le dos de l'utilisateur est brutal.

**6. Le journal doit-il débiter les soldes ?**
Question : une dépense de catégorie « dettes » réduit-elle la dette totale, et une de catégorie « urgence » augmente-t-elle le fonds ? **Oui / non**
*Recommandation : oui.* C'est le cœur du « aucune donnée isolée » de ton brief.

**7. Le mode démo.**
Question : je supprime la mock data **complètement**, ou je garde un bouton « charger un profil d'exemple » dans les réglages ? **Supprimer / garder en option**
*Recommandation : garder en option.* Utile pour montrer l'app sans saisir 20 champs.

**8. L'onboarding est-il obligatoire ?**
Choix : **A)** on ne peut pas entrer sans avoir fini les étapes obligatoires · **B)** on peut sauter et compléter plus tard, avec un rappel.
*Recommandation : A pour les étapes 2, 3, 4, 7 — sans elles l'application n'affiche que des zéros.*

**9. Les URL.**
Deux niveaux de navigation et un parcours à étapes, sans routeur, c'est jouable mais fragile : pas de retour arrière navigateur, pas de rechargement au bon endroit.
Question : j'ajoute un routeur ? **Oui / non**
*Recommandation : oui.*

**10. Les tests.**
105 tests s'appuient sur le profil de démonstration. Supprimer la mock data les casse.
Question : je crée un jeu de données de test dédié — même contenu, mais hors de l'application ? **Oui / non**
*Recommandation : oui*, c'est la seule façon de supprimer la mock data sans perdre le filet.

**11. Le classement des onglets du §6.**
Question : tu valides les cinq sections — Tableau de bord · Mon mois · Ma stratégie · Mon patrimoine · Mes chiffres ? **Oui / à ajuster**

---

## Zone technique concernée

- données et état : `ui/src/state/finances.tsx`, `ui/src/lib/types.ts`
- mock data : `ui/src/lib/donneesDemo.ts`
- calculs à étendre : `ui/src/lib/calculs.ts`, `ui/src/lib/calendrier.ts`
- navigation : `ui/src/App.tsx`, `ui/src/components/BarreSuperieure.tsx`, `RailLateral.tsx`, `BarreBasse.tsx`, `FeuilleMenu.tsx`
- vues concernées : les six dossiers de `ui/src/features/`
- actions mortes : `components/BarreSuperieure.tsx` (recherche), `features/tableau/BandeauFondsUrgence.tsx` (redirection)
- tests à réoutiller : `ui/src/__tests__/` (4 fichiers, 105 tests)


---

## État de livraison

| Lot | État | Preuve |
|---|---|---|
| Suivi mensuel — report par catégorie, clôture, chaîne recalculée | ✅ | 15 tests + 2 d'intégration |
| Calendrier annuel compact + modale de mois | ✅ | 2 tests, mesuré à 1280 et 390 px |
| Recherche fonctionnelle | ✅ | 7 tests unitaires + 2 de bout en bout |
| Redirection après fonds d'urgence | ✅ | 2 tests sur `redirigerPart` |
| Le journal bouge les soldes | ✅ | cycle ajout / modification / suppression testé |
| Routeur par ancre + cinq sections | ✅ | 4 tests, retour arrière navigateur vérifié |
| Onboarding en 8 étapes | ✅ | 8 tests, parcours complet joué dans le navigateur |
| Mock data retirée du démarrage | ✅ | `PROFIL_DEMO` n'est plus référencé que par le bouton d'exemple |
| KPI expliqués | ✅ | 5 tests |

### Décisions appliquées

Toutes celles du §11, avec leurs recommandations.
Deux écarts assumés, expliqués au moment de la livraison :

- **Pas de dépendance de routage.** Un routeur par ancre maison (~40 lignes) fait le
  travail — retour arrière, rechargement, lien partageable — sans ajouter 60 Ko au
  paquet ni sortir du boilerplate maison.
- **Le calendrier a été conçu, pas repris.** Le template annoncé n'était pas dans
  `Template/`, qui ne contient que T1 à T5.

### Reste ouvert

- Rien n'est committé.
- Money Guru n'est pas inscrit dans `PORTS-MELKO.xlsx`.
