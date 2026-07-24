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

- Le parcours de commande est raccordé : création transactionnelle, verrou pessimiste du stock,
  recalcul tarifaire serveur, historique initial, espace client, annulation contrôlée et transitions employé.
- Le mot de passe oublié utilise un jeton aléatoire à usage unique dont seule l'empreinte SHA-256
  est stockée. Le lien envoyé par e-mail expire après 30 minutes.
- Les plats, allergènes et horaires disposent d’API protégées ; les écrans Angular couvrent la
  création et la consultation de base, mais pas encore toutes les modifications et associations.
- Les avis sont contrôlés par propriété/état de commande, modérés par l’équipe et seuls les avis
  approuvés sont publics. L’accueil consomme cette API.
- MongoDB possède un pipeline de reconstruction idempotent depuis les commandes PostgreSQL non
  annulées, des filtres par période/menu et un écran administrateur synthétique.
- Les refresh tokens sont aléatoires, hachés en base, expirables, révoqués au logout et tournés à
  chaque renouvellement. Angular mutualise une seule tentative après une réponse 401.

## À faire en priorité

1. Finaliser les formulaires Angular de modification des menus, plats, associations et horaires.
2. Remplacer le dialogue natif d’annulation et enrichir les détails/historiques de commande.
3. Ajouter davantage de tests d’intégration PostgreSQL/MongoDB et de tests Angular par écran.
4. Transporter idéalement le refresh token par cookie `HttpOnly SameSite` en production.

## Validation de cette passe

Avant le dernier groupe de changements : Maven réussissait avec 11 tests et Angular compilait.
La validation finale a été interrompue par la limite d’usage de l’environnement d’approbation ;
les ajouts postérieurs doivent donc être recompilés avant intégration.
5. Tests d’intégration avec Testcontainers et tests Angular des guards/formulaires.
6. Remplacer les images externes et l’estimation de distance avant production.

## Vérification

Le front est compilé et testé dans l’environnement de réalisation. Le back-end n’a pas pu être exécuté faute de JDK 21 installé ; une validation Maven est impérative dès son installation.
