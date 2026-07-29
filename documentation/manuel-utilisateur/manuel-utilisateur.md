# Manuel utilisateur

Un visiteur consulte l’accueil, filtre les menus, ouvre une fiche et utilise Contact. Pour commander, il crée un compte avec ses coordonnées, accepte les conditions puis se connecte. Le bouton Commander redirige vers l’authentification si nécessaire.

L’espace client affiche les commandes et permet d’annuler une commande encore en attente.
Le formulaire de commande demande la date, l’heure, le nombre de personnes et l’adresse ;
le prix définitif est toujours recalculé par le serveur. L’espace employé permet de faire
progresser une commande dans son cycle de préparation et de livraison.

En cas d’oubli du mot de passe, saisir l’adresse du compte sur la page dédiée. Le message
reçu contient un lien valable 30 minutes et utilisable une seule fois.

Après une commande terminée, le client peut déposer un seul avis. Celui-ci n’apparaît sur
l’accueil qu’après approbation par un employé. L’équipe dispose de pages pour suivre les
commandes, consulter et créer des plats/allergènes, et modérer les avis. L’administrateur peut
créer ou désactiver des employés et reconstruire les statistiques depuis PostgreSQL.

Le compte administrateur local n’a aucun identifiant prédéfini. Il se crée via les variables `INITIAL_ADMIN_*` décrites dans le README. Ne jamais partager ni versionner ce mot de passe.

Les captures d’écran seront ajoutées après stabilisation des écrans CRUD. Les fonctions marquées comme partielles dans `ETAT_DU_PROJET.md` ne doivent pas être présentées comme disponibles.
