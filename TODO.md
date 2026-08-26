# TODO

## Couverture du `context.md` v2.0

| Spéc | État |
|---|---|
| FR-01 revenu, devise, frais de maintenance | ✅ vue « mes chiffres » |
| FR-02 méthode ou ratios propres | ✅ sélecteur + curseurs, bascule auto en personnalisée |
| FR-03 ratios verrouillés à 100 % | ✅ `ajusterAllocation`, testé |
| FR-04 montants mensuels par catégorie | ✅ six catégories |
| FR-05 objectif = maintenance × 6 | ✅ |
| FR-06 progression en % **et** en mois couverts | ✅ jauge + paliers 1/3/6 |
| FR-07 dettes sans intérêt + limite d'emprunt | ✅ bandeau dédié |
| FR-08 alertes maintenance et dette | ✅ `lib/pedagogie` → `BandeauAlertes` |
| FR-09 projection 42 ans, début de mois | ✅ défaut du simulateur et du tableau |
| FR-10 comparaison des méthodes | ✅ vue dédiée, écart de capital chiffré |
| FR-11 résultats bruts | ✅ mention sous chaque projection |
| FR-12 ajout/modif/suppression de dépenses datées | ✅ vue calendrier |
| FR-13 dépenses par jour, totaux par catégorie, écart prévu/réel | ✅ grille + panneau latéral |
| FR-14 récurrences créées et projetées | ✅ projection à la volée, confirmation explicite |
| FR-15 `localStorage` | ✅ clé `money-guru:profil:v2` |
| FR-16 aucune action bancaire | ✅ vérifié par test |
| §7.5 vue calendrier mensuelle | ✅ vue dédiée + zone sur le tableau de bord |
| §6.6 vue capital inspirée zakat | ✅ vue patrimoine, 5 classes |
| §7.5 garde-fous pédagogiques | ✅ 6 notes, 3 affichées selon les alertes |
| §10 score de marge de manœuvre | ✅ jauge + détail des 4 composantes |
| NFR-02 multi-devise | ✅ 7 devises, formatage `fr-FR` |
| NFR-03 format `10 000,00 MAD` | ✅ 2 décimales par défaut, 0 sur les tuiles denses |

## Corrigé en passant
- Un `step` sur les champs `type="number"` bloquait la validation HTML : tout montant
  non multiple du pas empêchait le formulaire de se soumettre (120 MAD refusé avec un
  pas de 50). Remplacé par `step="any"`.
- Une récurrence confirmée conservait son drapeau de projection : elle restait affichée
  comme « prévue » et devenait impossible à modifier ou supprimer.

## À trancher avec l'utilisateur
- [ ] Les ratios par défaut de chaque méthode répartissent l'enveloppe annoncée
      (ex. 50/30/20 → fun 18 / objectifs 12). Ce découpage interne est un choix : à
      valider ou à ajuster.
- [ ] Le score de marge de manœuvre et ses pondérations (35/30/20/15) sont une
      construction maison, à confirmer.
- [ ] Une fois le fonds d'urgence atteint, la redirection est **proposée** mais pas
      appliquée automatiquement aux ratios. Faut-il l'appliquer d'office ?
- [ ] `questions.md` reste ouvert sur le ton, les emojis et la structure du document.
- [ ] Le seuil de « jour coûteux » (moyenne + 1,5 écart-type) est un choix statistique
      maison, à confirmer ou à remplacer par un seuil en dirhams.
- [ ] Les récurrences sont mensuelles uniquement. Faut-il hebdomadaire / trimestriel ?

## Pistes
- [ ] Historique mois par mois — aujourd'hui c'est une photo de l'instant
- [ ] Objectifs court/moyen terme nommés et datés, pas seulement une enveloppe
- [ ] Rapprocher le journal des soldes : aujourd'hui les dépenses datées ne débitent pas
      automatiquement le fonds d'urgence ni la dette
- [ ] Export / import du profil en JSON
- [ ] Inflation en option dans le simulateur (résultats en pouvoir d'achat)
- [ ] Version lisible sous 1024 px (aujourd'hui : rails masqués, grille repliée)
