# État du projet

## Fonctionnel dans le code

- Angular standalone responsive : navigation, accueil, menus, détail, authentification, contact et pages légales.
- API publique des menus paginée et DTO dédiés.
- Inscription normalisée, mot de passe fort, BCrypt et rôle `USER` imposé.
- Connexion JWT, filtre stateless, CORS et contrôles `USER`/`EMPLOYEE`/`ADMIN`.
- Initialisation optionnelle et contrôlée d’un administrateur en profil `dev`.
- Contact persisté puis transmis par SMTP vers Mailpit.
- Calcul serveur : prix unitaire, remise de 10 %, Bordeaux gratuit, hors Bordeaux `5 € + 0,59 €/km`.
- Machine de transitions de commande et tests unitaires associés.
- Schéma PostgreSQL complet, contraintes, index, jeu de démonstration et migrations Flyway identiques.
- Modèle de document et repository MongoDB pour les agrégats.

## Partiel

- Les tableaux de bord et routes de rôle existent, leurs écrans CRUD détaillés restent à raccorder.
- Le modèle SQL couvre commandes, historique, avis, horaires et jetons ; toutes les entités/services REST ne sont pas encore codés.
- MongoDB est configuré et son document existe ; calcul incrémental, reconstruction et graphiques restent à faire.
- Le JWT d’accès fonctionne ; refresh token et révocation restent à implémenter.

## À faire en priorité

1. Entités et endpoints transactionnels de commande, verrouillage pessimiste du stock et contrôle de propriété.
2. CRUD employé : menus, plats, horaires, transitions, avis.
3. Gestion administrateur des employés et agrégats MongoDB.
4. Parcours mot de passe oublié et refresh token haché.
5. Tests d’intégration avec Testcontainers et tests Angular des guards/formulaires.
6. Remplacer les images externes et l’estimation de distance avant production.

## Vérification

Le front est compilé et testé dans l’environnement de réalisation. Le back-end n’a pas pu être exécuté faute de JDK 21 installé ; une validation Maven est impérative dès son installation.
