# Application de calcul des tarifs AdG pour le Forum

J'ai mis ça dans cette repo "buvette" pour tester rapidement.
Mais il faudra déplacer l'application vers une autre repo
plus tard.

## Spécifications

Elle permettrait de calculer et de donner aux personnes intéressées le tarif
de l'inscription en fonction de nos différents critères :

- la date de naissance
- le calcul de la FFTA pour déterminer la catégorie en fonction de la date de naissance
- la réinscription de l'archer de l'année précédente ou pas
- le choix entre compétition et loisir
- l'inscription au cours de Nathalie ou pas
- la location d'un arc ou pas
- la réduction si plusieurs personnes dans la famille

Peut-être d'autres critères que je ne connais pas



Tarif par rapport à l'age et renouvellement ou pas

Tableau age FFTA, tableau tarifs AdG, renouvellement ou pas



## Version générique

J'ai généré une version générique grâce à cette conversation ChatGPT :

Se mettre dans le dossier `forum` puis faire la commande :
```bash
python3 -m http.server 9000
```

La page est visible à http://127.0.0.1:9000/.
