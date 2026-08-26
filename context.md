# Contexte Projet : Money Guru - Dashboard financier personnel

Version : v2.0

## 1. Résumé exécutif

Money Guru est une application web de visualisation financière pour salarié. Le cas par défaut est un jeune salarié marocain payé mensuellement en MAD, mais le modèle doit rester compatible avec d'autres devises.

Le dashboard ne fait aucune opération bancaire : pas de virement, pas d'achat, pas de vente, pas d'API bancaire. Il sert à présenter les résultats prévus d'une stratégie financière en cours, à rendre les arbitrages visibles et à montrer l'impact d'une discipline mensuelle sur une carrière complète.

L'objectif produit est simple : transformer le salaire mensuel en une stratégie lisible. L'utilisateur doit comprendre rapidement combien de son revenu finance sa survie courante, sa sécurité, ses dettes, son capital de long terme, ses objectifs intermédiaires et son plaisir.

## 2. Public cible

- Utilisateur principal : salarié en début ou milieu de carrière.
- Cas par défaut : salarié marocain, revenu mensuel net, devise MAD.
- Extension prévue : support d'autres devises sans changer la méthode.
- Langue V1 : français.
- Support V1 : ordinateur portable et grand écran, largeur minimale conseillée de 1024 px.

## 3. Philosophie financière

Money Guru doit aider un jeune salarié à rester lucide dans un environnement de consommation agressive. L'application doit fournir assez d'informations pour comprendre les conséquences d'une stratégie, sans faire croire qu'un dashboard peut remplacer le jugement personnel.

Principes à intégrer :

- Chaque dirham du revenu net reçoit une affectation claire.
- Les dépenses de survie, les dépenses de plaisir, les dettes et le capital ne doivent jamais être mélangés.
- L'utilisateur se paie en premier : les allocations de sécurité, dette, investissement et objectifs sont calculées au début du mois, dès réception du salaire.
- Le fonds d'urgence vise 6 mois de frais de maintenance personnelle.
- Les simulations de rendement sont pédagogiques, brutes, non garanties et ne représentent aucun produit d'épargne précis.
- Les placements spéculatifs ou très risqués sont hors périmètre MVP.
- La dette suivie en V1 correspond à des dettes personnelles sans intérêt, contractées auprès de particuliers. Elle sert surtout à visualiser une limite d'emprunt et à éviter le surendettement.
- La projection principale doit couvrir une carrière moyenne de 42 ans.

## 4. Catégories financières obligatoires

L'application doit distinguer explicitement les catégories suivantes.

| Catégorie | Rôle | Exemples |
|---|---|---|
| Frais de maintenance personnelle | Coût mensuel pour maintenir une vie stable | logement, nourriture, eau, électricité, transport, santé, assurance, télécom, obligations familiales, abonnements essentiels |
| Fonds d'urgence | Réserve liquide disponible en cas de problème | objectif de 6 mois de frais de maintenance personnelle |
| Dettes personnelles sans intérêt | Limite d'emprunt et remboursements dus à des particuliers | argent emprunté à famille, amis, collègues |
| Investissement / capital productif | Construction de capital long terme | aucune référence produit en V1 ; seulement des montants et hypothèses |
| Objectifs court/moyen terme | Projets planifiés qui ne sont pas des urgences | permis, formation, ordinateur, voyage, équipement |
| Fun Money | Argent assumé pour le plaisir | sorties, restaurants, loisirs, achats non essentiels, gadgets |

## 5. Méthodes d'allocation à proposer

Money Guru ne doit pas imposer une seule méthode. Il doit proposer plusieurs stratégies réalistes, expliquées clairement, puis laisser l'utilisateur ajuster les ratios.

Toutes les méthodes utilisent le revenu net mensuel comme base. La somme des ratios doit toujours être égale à 100 %.

### 5.1. Méthode 50/30/20 adaptée

Objectif : donner une structure simple à un salarié qui commence.

- 50 % maximum pour les frais de maintenance personnelle.
- 30 % maximum pour le fun money et les objectifs court/moyen terme.
- 20 % minimum pour le fonds d'urgence, l'investissement et le remboursement de dettes.

### 5.2. Méthode 70/30 pragmatique

Objectif : refléter une approche réaliste quand le coût de vie absorbe une grande partie du salaire.

- 70 % maximum pour toutes les dépenses de vie : maintenance personnelle, fun money, objectifs immédiats.
- 30 % minimum pour la sécurité et le futur : fonds d'urgence, investissement, remboursement de dettes.

Cette méthode est proche de la logique pédagogique de la FMEF, qui insiste sur la catégorisation des dépenses et l'intérêt d'épargner une part régulière du revenu.

### 5.3. Méthode "Se payer en premier"

Objectif : prioriser la discipline plutôt que ce qui reste à la fin du mois.

- L'utilisateur choisit d'abord un ratio de sécurité/futur : fonds d'urgence, investissement, objectifs, dettes.
- Le reste est ensuite réparti entre maintenance personnelle et fun money.
- Le dashboard montre immédiatement si le style de vie actuel est compatible avec cette ambition.

### 5.4. Mode défense

Objectif : stabiliser rapidement un salarié fragile ou trop exposé.

- Priorité au fonds d'urgence jusqu'à atteindre 6 mois.
- Fun money plafonné.
- Dettes personnelles suivies avec seuil d'alerte.
- Investissement maintenu seulement si les frais de maintenance et les dettes restent sous contrôle.

## 6. Règles de calcul

### 6.1. Allocation mensuelle

Chaque catégorie est calculée à partir d'un ratio du revenu net :

```text
montant_categorie = revenu_net_mensuel * ratio_categorie
```

Contraintes :

- Tous les ratios doivent totaliser 100 %.
- Les ratios doivent rester modifiables.
- L'application doit afficher les montants en devise locale.
- La devise par défaut est MAD.

### 6.2. Frais de maintenance personnelle

Le montant de maintenance peut être :

- calculé depuis le ratio choisi ;
- ajusté par l'utilisateur avec ses dépenses mensuelles habituelles ;
- utilisé comme base du fonds d'urgence.

Le dashboard doit afficher un indicateur de pression :

```text
pression_maintenance = frais_maintenance_mensuels / revenu_net_mensuel
```

Si ce ratio devient trop élevé, l'application doit alerter l'utilisateur, car sa marge de manoeuvre devient faible.

### 6.3. Fonds d'urgence

Objectif :

```text
objectif_fonds_urgence = frais_maintenance_mensuels * 6
```

Progression :

```text
mois_couverts = solde_fonds_urgence / frais_maintenance_mensuels
progression = solde_fonds_urgence / objectif_fonds_urgence
```

Gamification utile :

- palier 1 mois : premier filet de sécurité ;
- palier 3 mois : stabilité minimale ;
- palier 6 mois : objectif atteint ;
- visualisation en mois couverts, pas seulement en pourcentage.

Une fois l'objectif atteint, l'utilisateur choisit où rediriger l'allocation mensuelle : investissement, objectifs, dettes ou fun money.

### 6.4. Dettes personnelles sans intérêt

La dette V1 ne modélise pas les crédits bancaires avec intérêts. Elle suit les dettes contractées auprès de particuliers.

Indicateurs nécessaires :

- montant total dû ;
- remboursement mensuel prévu ;
- ratio de remboursement sur revenu ;
- limite d'emprunt choisie par l'utilisateur ;
- alerte de surendettement quand la dette ou les remboursements dépassent les seuils fixés.

Exemples de calcul :

```text
ratio_remboursement = remboursement_mensuel / revenu_net_mensuel
ratio_dette_totale = dette_totale / revenu_net_mensuel
limite_emprunt = revenu_net_mensuel * multiplicateur_limite
```

### 6.5. Projection de capital sur 42 ans

La projection principale doit couvrir 42 ans, soit une carrière moyenne complète.

Hypothèses :

- versements en début de mois ;
- rendement annuel brut ;
- capitalisation mensuelle ;
- aucun frais, impôt ou inflation en V1 ;
- taux affichés comme scénarios pédagogiques.

Formule :

```text
taux_mensuel = taux_annuel / 12
nombre_mois = duree_annees * 12

capital_final =
  capital_initial * (1 + taux_mensuel) ^ nombre_mois
  + versement_mensuel * (((1 + taux_mensuel) ^ nombre_mois - 1) / taux_mensuel) * (1 + taux_mensuel)

gain_brut = capital_final - capital_initial - (versement_mensuel * nombre_mois)
```

Si le taux annuel est 0 %, la formule devient :

```text
capital_final = capital_initial + (versement_mensuel * nombre_mois)
gain_brut = 0
```

### 6.6. Vue capital inspirée de la zakat

La section investissement/capital ne doit pas recommander de produit précis. Elle peut structurer la richesse suivie en s'inspirant des grandes catégories utilisées dans les calculs de zakat, sans devenir un calculateur de zakat en V1.

Catégories utiles :

- capital liquide : cash, compte courant, épargne disponible ;
- créances récupérables : argent prêté que l'utilisateur pense récupérer ;
- capital investi : portefeuille, parts, instruments financiers, sans référence produit ;
- biens destinés à la revente : actifs achetés pour être revendus ;
- biens personnels non productifs : voiture personnelle, mobilier, objets d'usage courant, à afficher séparément si nécessaire.

Le but est de distinguer le capital réellement mobilisable ou productif du patrimoine d'usage.

## 7. Fonctionnalités MVP

### 7.1. Saisie de base

L'utilisateur doit pouvoir renseigner :

- revenu net mensuel ;
- devise ;
- frais de maintenance personnelle mensuels ;
- solde actuel du fonds d'urgence ;
- dettes personnelles sans intérêt ;
- remboursements mensuels prévus ;
- capital initial ;
- versement mensuel d'investissement ;
- taux de rendement annuel brut ;
- ratios d'allocation ;
- méthode d'allocation choisie ;
- dépenses datées, ponctuelles ou récurrentes, associées à une catégorie.

### 7.2. Dashboard de stratégie en cours

Le dashboard principal affiche les résultats prévus de la stratégie actuelle :

- répartition du salaire par catégorie ;
- montant mensuel alloué à chaque catégorie ;
- pression des frais de maintenance ;
- niveau de dette personnelle ;
- progression du fonds d'urgence ;
- capital projeté sur 42 ans ;
- gain brut projeté ;
- coût d'un changement de stratégie.

### 7.3. Comparaison des méthodes

L'utilisateur doit pouvoir comparer plusieurs méthodes :

- 50/30/20 adaptée ;
- 70/30 pragmatique ;
- se payer en premier ;
- mode défense ;
- stratégie personnalisée.

L'app doit montrer les effets sur :

- fonds d'urgence ;
- dette ;
- capital final à 42 ans ;
- fun money mensuel ;
- marge de sécurité.

### 7.4. Simulateur pédagogique

Le simulateur permet de modifier :

- montant initial ;
- versement mensuel ;
- taux annuel brut ;
- durée, avec 42 ans comme horizon principal ;
- devise.

Résultats :

- capital final ;
- total versé ;
- gain brut ;
- courbe annuelle ;
- différence entre deux scénarios si possible.

### 7.5. Suivi des dépenses en vue calendrier

L'application doit permettre de suivre les dépenses dans une vue calendrier mensuelle.

Objectif : rendre visible le rythme réel de consommation, pas seulement les totaux abstraits. L'utilisateur doit pouvoir voir quels jours coûtent cher, quelles dépenses reviennent chaque mois et si son comportement réel respecte la stratégie prévue.

Chaque dépense doit pouvoir contenir :

- date ;
- montant ;
- devise ;
- catégorie : frais de maintenance personnelle, fun money, objectif, dette, urgence ou investissement ;
- libellé court ;
- note optionnelle ;
- statut récurrent ou ponctuel.

La vue calendrier doit afficher :

- total dépensé par jour ;
- détail des dépenses d'un jour sélectionné ;
- total mensuel par catégorie ;
- comparaison entre dépenses prévues et dépenses réelles ;
- indication visuelle des jours anormalement élevés ;
- dépenses récurrentes futures déjà prévues.

Cette fonctionnalité reste manuelle en V1 : aucune synchronisation bancaire, aucune importation automatique.

### 7.6. Informations et garde-fous

L'application doit contenir des textes courts, utiles et actionnables :

- pourquoi séparer maintenance et fun money ;
- pourquoi le fonds d'urgence est liquide ;
- pourquoi les rendements ne sont pas garantis ;
- pourquoi emprunter pour investir est dangereux ;
- pourquoi commencer tôt change fortement le résultat ;
- pourquoi les ratios sont des repères, pas des vérités universelles.

## 8. Spécifications fonctionnelles

| ID | Description |
|---|---|
| FR-01 | L'utilisateur saisit son revenu net mensuel, sa devise et ses frais de maintenance personnelle. |
| FR-02 | L'utilisateur choisit une méthode d'allocation ou définit ses propres ratios. |
| FR-03 | Les ratios d'allocation doivent toujours totaliser 100 %. |
| FR-04 | L'app calcule les montants mensuels par catégorie à partir du revenu net. |
| FR-05 | L'app calcule l'objectif du fonds d'urgence : 6 mois de frais de maintenance personnelle. |
| FR-06 | L'app affiche la progression du fonds d'urgence en pourcentage et en mois couverts. |
| FR-07 | L'app suit les dettes personnelles sans intérêt et affiche une limite d'emprunt. |
| FR-08 | L'app affiche des alertes si la maintenance ou la dette réduit trop la marge de manoeuvre. |
| FR-09 | L'app projette le capital sur 42 ans avec versements en début de mois. |
| FR-10 | L'app compare plusieurs méthodes d'allocation et leurs résultats projetés. |
| FR-11 | Le simulateur affiche des résultats bruts, sans frais, fiscalité ni inflation. |
| FR-12 | L'app permet d'ajouter, modifier et supprimer des dépenses datées dans une vue calendrier mensuelle. |
| FR-13 | La vue calendrier affiche les dépenses par jour, les totaux mensuels par catégorie et l'écart entre prévu et réel. |
| FR-14 | Les dépenses récurrentes peuvent être créées manuellement et projetées sur les mois suivants. |
| FR-15 | Les données sont sauvegardées automatiquement dans `localStorage`. |
| FR-16 | Aucun bouton Acheter, Vendre, Transférer ou Connecter ma banque ne doit être présent. |

## 9. Spécifications non fonctionnelles

| ID | Description |
|---|---|
| NFR-01 | Interface en français pour la V1. |
| NFR-02 | Devise par défaut MAD, mais formatage multi-devise prévu. |
| NFR-03 | Format monétaire localisé : exemple `10 000,00 MAD`. |
| NFR-04 | Application utilisable sur laptop et grand écran ; mobile non prioritaire en V1. |
| NFR-05 | Chargement rapide, sans dépendance serveur obligatoire pour les calculs. |
| NFR-06 | Données locales uniquement via navigateur. |
| NFR-07 | Design clair, dense, lisible, sérieux mais pas austère. |
| NFR-08 | Gamification limitée aux progrès, paliers et badges utiles. |

## 10. UX attendue

La première vue doit être le dashboard, pas une landing page.

Structure recommandée :

- zone haute : revenu net, méthode choisie, devise, score de marge de manoeuvre ;
- colonne stratégie : ratios, montants mensuels, comparaison des méthodes ;
- colonne sécurité : fonds d'urgence, mois couverts, paliers ;
- colonne dette : total dû, remboursement mensuel, limite d'emprunt, alertes ;
- zone projection : capital projeté sur 42 ans, total versé, gain brut ;
- zone calendrier : dépenses du mois, jours coûteux, dépenses récurrentes, écart prévu/réel ;
- zone pédagogique : explications courtes liées aux alertes et aux choix actuels.

Le dashboard doit répondre rapidement à ces questions :

- Combien coûte ma maintenance personnelle ?
- Combien puis-je me permettre en fun money ?
- Suis-je en train de construire mon fonds d'urgence ?
- Mon niveau de dette personnelle est-il dangereux ?
- Que vaut ma stratégie actuelle sur 42 ans ?
- Quelle méthode me laisse le meilleur équilibre entre survie, plaisir et futur ?
- Quels jours et quelles catégories détruisent mon budget réel ?

## 11. Hors périmètre MVP

- Connexion bancaire.
- Virements.
- Achat ou vente d'actifs.
- Recommandation de produits financiers précis.
- Calcul fiscal.
- Calcul de zakat complet.
- Rendements nets de frais, impôts ou inflation.
- Crypto et placements spéculatifs.
- Crédit bancaire avec intérêts.

## 12. Critères de succès

- En moins de 2 minutes, l'utilisateur comprend la répartition réelle de son salaire.
- Il connaît son objectif de fonds d'urgence en montant et en mois couverts.
- Il voit clairement la différence entre frais de maintenance personnelle et fun money.
- Il sait si ses dettes personnelles dépassent sa limite d'emprunt.
- Il comprend l'effet de sa stratégie actuelle sur une carrière de 42 ans.
- Il peut comparer plusieurs méthodes sans perdre le fil.
- Il revient mettre à jour ses chiffres parce que le dashboard lui montre quelque chose d'utile.

## 13. Sources de méthode

Les sources ne doivent pas être choisies parce qu'elles sont marocaines ou internationales, mais parce qu'elles sont utiles, crédibles et cohérentes avec le cas d'usage. Les sources marocaines sont utiles pour le contexte MAD et l'éducation financière locale ; les sources internationales sont utiles quand elles expliquent mieux une pratique générale.

- FMEF - Gérer son budget : catégorisation des revenus/dépenses, séparation besoins/désirs, épargne régulière. https://www.fmef.ma/fr/gerer-son-budget
- FMEF - Simulateur budget : logique de budget personnel, ressources, dépenses, épargne, alerte de surendettement. https://www.fmef.ma/fr/budget
- AMMC - Avant d'investir : horizon de placement, épargne disponible, liquidité, risque, diversification, prudence face aux promesses de gain. https://v8.ammc.ma/fr/espace-epargnants/avant-dinvestir-0
- AMMC - Risque et rentabilité : lien entre risque, rendement, fiscalité, volatilité, inflation et liquidité. https://v8.ammc.ma/fr/espace-epargnants/risque-et-rentabilite
- FINRA - Financial hardship / emergency fund : fonds d'urgence liquide, objectif courant de 3 à 6 mois, épargne intégrée au budget. https://www.finra.org/investors/insights/prepare-survive-financial-hardship
- Investor.gov - Introduction to investing : investissement régulier, horizon long terme, croissance composée, diversification et risque. https://www.investor.gov/introduction-investing
- Zakat Foundation - Zakat assessment : catégories générales de patrimoine zakatable et distinction entre actifs liquides, productifs et actifs d'usage. https://www.zakat.org/resource-center/zakat-assessment
