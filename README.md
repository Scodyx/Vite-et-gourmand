# Vite & Gourmand

Socle full-stack de l’application d’un traiteur bordelais fictif, réalisé pour une évaluation du titre Développeur Web et Web Mobile.

## État et fonctionnalités

Sont opérationnels dans le code : catalogue public paginé, détail d’un menu, inscription limitée au rôle `USER`, authentification JWT stateless, guards Angular, formulaire de contact avec persistance et e-mail, calcul métier des commandes, règles de transition de statut, migrations et données de démonstration.

Les tableaux de bord USER/EMPLOYEE/ADMIN sont accessibles selon le rôle mais les CRUD de commandes, menus et employés, le refresh token, le mot de passe oublié, les avis et le pipeline de statistiques MongoDB restent à compléter. Voir [l’état détaillé](documentation/ETAT_DU_PROJET.md).

## Stack

- Angular 20, TypeScript, composants standalone, Reactive Forms et SCSS ;
- Java 21, Spring Boot 3.5, Maven, Spring Security, JPA, MongoDB, Mail et OpenAPI ;
- PostgreSQL 16, MongoDB 7 et Mailpit via Docker Compose.

## Arborescence

```text
frontend/       application Angular
backend/        API Spring Boot et migrations Flyway
database/       schema.sql et data.sql de référence
documentation/  architecture, projet, charte, manuel et diagrammes
docker-compose.yml
```

## Prérequis

Node.js 20 ou 22 LTS (Node 24 a aussi été utilisé pour le build), npm, JDK 21 et Docker Desktop. Le port 8080 doit être libre.

## Installation et lancement

```powershell
Copy-Item .env.example .env
docker compose up -d
Set-Location backend
.\mvnw.cmd spring-boot:run
```

Dans un second terminal :

```powershell
Set-Location frontend
npm.cmd install
npm.cmd start
```

Application : `http://localhost:4200`

API : `http://localhost:8080/api/v1`

Swagger : `http://localhost:8080/swagger-ui.html`

Mailpit : `http://localhost:8025`

## Configuration

Toutes les variables sont décrites dans [.env.example](.env.example). Le fichier `.env` est ignoré. En développement uniquement, activer la création contrôlée du premier administrateur :

```dotenv
INITIAL_ADMIN_ENABLED=true
INITIAL_ADMIN_EMAIL=admin@example.test
INITIAL_ADMIN_PASSWORD=<mot-de-passe-fort-local>
```

Le mot de passe est haché avec BCrypt, n’est ni journalisé ni inséré dans les scripts SQL. Désactiver l’initialisation après la première exécution.

## Tests et builds

```powershell
Set-Location backend
.\mvnw.cmd test
.\mvnw.cmd clean package

Set-Location ..\frontend
npm.cmd run build
npm.cmd test -- --watch=false

Set-Location ..
docker compose config
```

## Git et liens

Flux recommandé : `main` stable, `develop` pour l’intégration, branches `feature/*`, `fix/*` et `docs/*`. Commits conventionnels (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

- Dépôt GitHub : à compléter
- Application déployée : à compléter
- Gestion de projet : à compléter

Limitations principales : JDK et Docker doivent être installés localement ; l’API de distance est une abstraction à implémenter avant production ; la persistance sûre des refresh tokens et les fonctions métier avancées sont planifiées.
