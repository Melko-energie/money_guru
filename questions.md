# Questions de validation avant reformulation de `context.md`

Objectif : valider la justesse de la méthode financière avant de renforcer le document produit, les arguments et les spécifications.

## 1. Public cible et périmètre

1. L'utilisateur cible est-il spécifiquement un salarié marocain payé mensuellement en MAD, ou faut-il garder une méthode applicable à tout salarié francophone ?

2. Le dashboard doit-il rester un outil strictement éducatif et personnel, ou peut-il formuler des recommandations plus prescriptives ?

3. Souhaite-t-on ajouter une mention explicite du type : "outil pédagogique, pas un conseil financier" ?

## 2. Méthode budgétaire

4. Quel modèle d'allocation doit servir de référence principale ?
   - `50/30/20` : besoins / envies / épargne-investissement-dettes.
   - `70/30` : dépenses / épargne, proche de l'idée d'épargner environ 30%.
   - Modèle flexible : l'utilisateur fixe ses propres pourcentages, l'app explique seulement les compromis.

5. L'application doit-elle distinguer clairement ces catégories : besoins essentiels, dettes, fonds d'urgence, investissements, objectifs court/moyen terme, plaisir ?

6. Les dépenses courantes et le plaisir doivent-ils rester regroupés, ou faut-il les séparer pour mieux montrer le reste-à-vivre réel ?

7. La capacité d'épargne doit-elle être calculée comme `revenu net - dépenses essentielles`, ou comme un montant librement défini par l'utilisateur ?

## 3. Fonds d'urgence

8. Faut-il renommer `Fonds de Roulement` en `Fonds d'Urgence` ou `Matelas de sécurité`, puisque "fonds de roulement" est plutôt un terme d'entreprise ?

9. Le fonds d'urgence doit-il viser exactement `6 mois`, ou afficher une progression par paliers : `1 mois`, `3 mois minimum`, `6 mois confortable/conservateur` ?

10. Le montant cible doit-il être calculé sur les dépenses essentielles uniquement, ou sur toutes les dépenses mensuelles habituelles ?

11. Une fois le fonds d'urgence atteint, où doit aller automatiquement l'allocation mensuelle correspondante : investissements, objectifs moyen terme, remboursement de dettes, ou choix utilisateur ?

12. L'application doit-elle expliquer où garder le fonds d'urgence : compte séparé, liquide, accessible, non investi ?

## 4. Dettes et priorités financières

13. Le remboursement des dettes à intérêt élevé doit-il devenir une priorité explicite avant l'investissement ?

14. Les remboursements de dettes doivent-ils être considérés comme des dépenses incompressibles, comme une catégorie financière séparée, ou les deux ?

15. Faut-il prévoir un indicateur d'alerte si les dépenses essentielles dépassent un certain pourcentage du salaire ?

## 5. Investissement et simulation

16. Quels produits d'épargne ou d'investissement le texte doit-il rester compatible avec : épargne bancaire, DAT, OPCVM, actions, produits retraite, ou uniquement des placements génériques ?

17. Faut-il exclure explicitement les placements spéculatifs ou très risqués comme la crypto du périmètre MVP ?

18. Les taux `5%`, `7%`, `10%` doivent-ils être présentés comme des scénarios pédagogiques plutôt que comme des rendements attendus ?

19. Le simulateur doit-il afficher des résultats bruts uniquement, ou intégrer frais, fiscalité et inflation ?

20. Pour les versements mensuels, la formule doit-elle supposer un versement en début de mois ou en fin de mois ?

21. L'exemple `1000 MAD/mois à 7% sur 1 an ≈ 450 MAD d'intérêts` doit-il être conservé ? Il correspond plutôt à un versement en début de mois ; en fin de mois, le gain est plus proche de `393 MAD`.

22. La courbe de projection doit-elle afficher seulement 1 an, ou aussi 5 ans et 10 ans pour mieux montrer l'effet des intérêts composés ?

## 6. Ton, UX et gamification

23. Le ton doit-il rester très gamifié et encourageant, ou devenir plus sobre vu le sujet financier ?

24. Les emojis doivent-ils être utilisés dans l'interface, ou remplacés par des badges/icônes plus professionnels ?

25. Les couleurs doivent-elles suivre une logique financière simple : sécurité, investissement, plaisir, alerte, ou une palette plus neutre ?

26. Le dashboard doit-il montrer d'abord la situation actuelle, puis les recommandations, puis la simulation ?

## 7. Structure du document

27. Souhaite-t-on garder `context.md` comme un brief développeur, ou le reformater en document produit plus complet ?

28. La nouvelle structure doit-elle contenir ces sections : principes financiers, méthode budgétaire, règles de calcul, fonctionnalités MVP, limites, UX, stack technique, critères de succès ?

29. Faut-il ajouter une section "Hypothèses financières" pour documenter clairement les choix : 3-6 mois d'urgence, taux de rendement brut, allocation par défaut, absence de conseil financier ?

30. Faut-il corriger entièrement l'encodage et la langue française dans `context.md` pendant la reformulation ?

## 8. Sources à citer ou utiliser

31. Souhaite-t-on citer explicitement les sources dans `context.md`, ou seulement s'en servir pour renforcer les arguments ?

32. Les sources marocaines doivent-elles être prioritaires dans l'argumentaire, notamment FMEF et AMMC ?

33. Les sources internationales doivent-elles être gardées comme appui secondaire pour les pratiques générales : fonds d'urgence, budget, diversification, investissement long terme ?

