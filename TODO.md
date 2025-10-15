# TODO

- [x] Clic sur le bouton (bleu légèrement différent pas très visible), changer plutôt la couleur du texte en rouge
- [x] Augmenter la taille des textes du panier
- [x] Ajouter le produit "Gobelet rendu"
- [x] Bouton "-- 1.50€" à changer en " [1.50€]"
- [x] "Vider le panier" : bouton sur fond rouge
- [x] Ajouter le rendu dans la confirmation (sur 5€, 10€, 15€, 20€)
- [x] Demander un code pour le caissier
- [x] Admin : Enlever la colonne "Acheteur"
- [x] Admin : formater la date et l'heure
- [x] Admin (et CSV) : mettre l'heure France
- [x] Admin : bouton pour tout supprimer (avec confirmation)
- [x] Admin : Enlever Logout (ne marche pas)
- [x] Si le total panier est négatif ou nul (possible avec le rendu des consignes), ne pas afficher les sommes à rendre
- [x] Changer `Commande payée` par `Enregistrer la commande` (car `payée` n'est pas correct quand on doit redonner de l'argent au client)
- [x] Demander une confirmation Oui/Non avant d'enregistrer la commande (afficher les produits commandés)
- [x] Gérer les commandes particulières
    - [x] les volontaires organisateur du club ne paient pas
    - [x] certains archers ne paient pas directement car c'est leur club qui payent


V2 : laisser les archers faire leur commande

# Spécification panier négatif

Le total du panier peut être négatif. Exemple : un client ramène 2 gobelets
consigné à 1€ et achète une petite bouteille d'eau à 0.50€, il ne paye rien
et on doit lui rendre 1.50€ (Total panier = -1.50€).

Quand le total du panier est positif, par exemple 3.50€, on affiche 
`À payer : 3.50€`, le bouton `Commande payée` puis la monnaie à rendre
sur plusieurs sommes avec le titre `À rendre :`.

Du coup, quand le total du panier est négatif, par exemple -1.50€, on affiche
`À payer : -1.50€`, le bouton `Commande payée` puis la monnaie à rendre
sur plusieurs sommes avec le titre `À rendre :` et `Sur 1€ rendre 2.50€`, 
`Sur 2€ rendre 3.50€`, etc.

Je pense renommer le bouton `Commande payée` par `Enregistrer la commande` car
`payée` n'est pas correct quand on doit redonner de l'argent au client.

Voilà ce que je voudrais afficher en fonction des cas :

| Négatif                   | Nul                       | Positif                   |
| :------------------------ | :------------------------ | :------------------------ |
| Total : -3.50€            | Total : 0.00€             | Total : 2.50€             |
| `Enregistrer la commande` | `Enregistrer la commande` | `Enregistrer la commande` |
| À payer : 0€              | À payer : 0€              | À payer : 2.50€           |
| À rendre : 3.50€          | À rendre : 0€             | À rendre :                |
| -                         | -                         | 3€ -> 0.50€               |
| -                         | -                         | 4€ -> 1.50€               |
| -                         | -                         | 5€ -> 2.50€               |


# Spécification commandes particulières

2 cas particuliers :

- les volontaires organisateur du club ne paient pas
- certains archers ne paient pas directement car c'est leur club qui payent

Dans l'interface, je vais ajouter 2 boutons, un pour chaque cas :

- "Commande organisateur"
- "Commande club"

Je veux mettre ces 2 boutons éloignés du bouton "Enregistrer la commande"
pour éviter les erreurs. 

Je veux aussi ajouter une confirmation avant d'enregistrer où je mets le
type de commande "standard", "club", "organisateur", le détail et le total.


