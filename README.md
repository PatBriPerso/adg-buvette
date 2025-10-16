# Caisse enregistreuse pour buvette

Il s'agit d'une application web qui permet de remplir un panier
avec les articles vendus à la buvette. Le total s'affiche et
la monnaie à rendre sur différents montants également.

Une fois que la personne a payé, on peut valider et la commande
est enregistrée, le panier est vidé et on peut servir la 
personne suivante.

Une partie Admin, protégée par mot de passe, permet de voir
l'ensemble des commandes et de les exporter dans un fichier CSV.

L'application a été conçue pour être utilisée sur un téléphone
portable donc il peut y avoir plusieurs personnes qui servent
à la buvette. Chacune peut afficher l'application sur son
téléphone et servir des personnes en parallèle.

## Développement en local

Installer les dépendances :

```bash
python3 -m venv venv
source venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
deactivate
```

Lancer le serveur :

```bash
source venv/bin/activate
python3 app.py
deactivate
```

