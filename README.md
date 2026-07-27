# Vite & Gourmand

Socle full-stack de l’application d’un traiteur bordelais fictif, réalisé pour une évaluation du titre Développeur Web et Web Mobile.

## État et fonctionnalités

Sont opérationnels dans le code : catalogue public paginé, détail d’un menu, inscription limitée au rôle `USER`, authentification JWT stateless, guards Angular, formulaire de contact avec persistance et e-mail, calcul métier des commandes, règles de transition de statut, migrations et données de démonstration.

Les parcours désormais raccordés couvrent le catalogue public filtrable, l’authentification avec
rotation des refresh tokens, le mot de passe oublié, la commande transactionnelle, le profil et
les commandes client, les transitions employé, les plats/allergènes/horaires, les avis modérés,
les employés administrateur et la reconstruction des statistiques MongoDB. Voir
[l’état détaillé](documentation/ETAT_DU_PROJET.md) pour les limites et le niveau de vérification.

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

## Initialisation et smoke test privilégié

En profil `dev`, le premier administrateur n'est créé que si `INITIAL_ADMIN_ENABLED=true`,
`INITIAL_ADMIN_EMAIL` et `INITIAL_ADMIN_PASSWORD` sont explicitement fournis. L'e-mail est
normalisé, le mot de passe est haché avec BCrypt et un compte existant n'est jamais modifié.
Aucune valeur secrète par défaut n'est définie.

```powershell
$env:INITIAL_ADMIN_ENABLED = "true"
$env:INITIAL_ADMIN_EMAIL = "admin.local@example.test"
$env:INITIAL_ADMIN_PASSWORD = Read-Host "Mot de passe temporaire"
Set-Location backend
.\mvnw.cmd spring-boot:run
```

Après `docker compose up -d` et `.\mvnw.cmd clean package`, le smoke test privilégié génère
en mémoire des identifiants uniques sous le domaine réservé `example.test`, crée l'EMPLOYEE via
l'API ADMIN réelle, vérifie les permissions et exécute le smoke navigateur employé :

```powershell
Set-Location ..
.\scripts\smoke-privileged.ps1
```

Le bloc `finally` désactive ensuite, par leur adresse exacte et leur rôle attendu, l'EMPLOYEE et
l'ADMIN temporaires. Il contrôle que leurs connexions sont refusées, supprime les secrets de
l'environnement du processus et arrête Spring Boot et Angular. Aucun compte privilégié actif créé
par une exécution réussie ne doit subsister. Le script retourne un code non nul si le scénario ou
ce nettoyage obligatoire échoue.

Le test navigateur utilise Playwright avec Chromium. Le navigateur est installé dans le cache
local de l'utilisateur, jamais dans Git :

```powershell
Set-Location frontend
npm.cmd install
npx.cmd playwright install chromium
$env:E2E_EMPLOYEE_EMAIL = "<adresse-temporaire>"
$env:E2E_EMPLOYEE_PASSWORD = Read-Host "Mot de passe temporaire"
npm.cmd run e2e:smoke
Remove-Item Env:E2E_EMPLOYEE_EMAIL,Env:E2E_EMPLOYEE_PASSWORD
```

En usage normal, `smoke-privileged.ps1` fournit lui-même ces variables en mémoire. En cas d'échec
de nettoyage, conserver la sortie non secrète, vérifier que Docker et PostgreSQL sont disponibles,
puis relancer le script ; ne jamais désactiver des comptes par une recherche large ou par leur seul
rôle. Le script n'affiche aucun mot de passe, JWT ou refresh token. Ne jamais commiter de mot de
passe ni le fichier `.env`.

## Git et liens

Flux recommandé : `main` stable, `develop` pour l’intégration, branches `feature/*`, `fix/*` et `docs/*`. Commits conventionnels (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

- Dépôt GitHub : à compléter
- Application déployée : à compléter
- Gestion de projet : à compléter

Limitations principales : JDK et Docker doivent être installés localement ; la distance hors
Bordeaux est fournie de manière contrôlée en développement et devra être remplacée par un service
cartographique côté serveur ; les interfaces de gestion des images, associations menu/plat et
horaires restent moins avancées que les API ; une revue juridique des pages légales reste nécessaire.
