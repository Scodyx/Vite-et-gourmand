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

### Audit et nettoyage ciblé des anciennes données smoke

Le script fonctionne en lecture seule par défaut et cible exclusivement les préfixes générés par
`smoke-privileged.ps1`. Il n'agit jamais sur tous les comptes `example.test`, un rôle entier ou
une donnée dont l'origine est incertaine :

```powershell
.\scripts\cleanup-smoke-data.ps1        # audit uniquement
.\scripts\cleanup-smoke-data.ps1 -Apply # application explicite
```

Le mode `-Apply` désactive les comptes, menus et plats correspondant exactement aux motifs smoke
connus. Il détache uniquement les allergènes smoke de plats smoke, sans supprimer de compte,
commande, avis ou allergène. PostgreSQL doit être démarré par Docker Compose.

## Git et liens

Flux recommandé : `main` stable, `develop` pour l’intégration, branches `feature/*`, `fix/*` et `docs/*`. Commits conventionnels (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

- Dépôt GitHub : à compléter
- Application déployée : à compléter
- Gestion de projet : à compléter

Limitations principales : JDK et Docker doivent être installés localement ; la distance hors
Bordeaux est fournie de manière contrôlée en développement et devra être remplacée par un service
cartographique côté serveur ; les interfaces de gestion des images, associations menu/plat et
horaires restent moins avancées que les API ; une revue juridique des pages légales reste nécessaire.

## Déploiement public

La cible préparée est un Static Site Render pour Angular, un Web Service Docker Render pour
Spring Boot, PostgreSQL sur Neon, MongoDB sur Atlas et Brevo pour SMTP. Le fichier
[`render.yaml`](render.yaml) décrit les deux services Render sur la branche `develop`. Il ne crée
aucune base Render.

### 1. Services de données et e-mail

1. Créer un projet et une base PostgreSQL dans Neon, puis copier la chaîne JDBC fournie en veillant
   à conserver TLS, par exemple `jdbc:postgresql://<hôte>/<base>?sslmode=require`.
2. Créer un cluster MongoDB Atlas, un utilisateur limité à la base de statistiques et autoriser
   l'accès réseau depuis Render. Utiliser une URI `mongodb+srv://...` dans `MONGODB_URI`.
3. Dans Brevo, créer une clé SMTP distincte. Configurer `smtp-relay.brevo.com`, le port `2525`,
   l'authentification et STARTTLS. L'adresse `MAIL_FROM` doit être un expéditeur validé dans Brevo.

### 2. Backend Render

Créer le service depuis le Blueprint ou comme Web Service Docker avec `backend` comme dossier
racine. Le conteneur écoute sur `0.0.0.0:${PORT:-8080}`. Saisir manuellement toutes les variables
marquées `sync: false` dans Render. Flyway applique les migrations existantes au démarrage sur Neon.

Pour initialiser le compte de démonstration, activer temporairement `INITIAL_ADMIN_ENABLED`, saisir
`admin@vite-gourmand.test` dans `INITIAL_ADMIN_EMAIL` et fournir le mot de passe convenu directement
dans le tableau de bord Render. Ne jamais placer ce mot de passe dans Git. L'initialiseur normalise
l'adresse, hache le mot de passe avec BCrypt et ne modifie pas un compte déjà existant. Remettre
`INITIAL_ADMIN_ENABLED=false` après le premier démarrage réussi.

Vérifications :

- `https://<backend-render>/api/v1/public/health` renvoie `{"status":"UP"}` ;
- `https://<backend-render>/swagger-ui/index.html` affiche Swagger ;
- `/v3/api-docs` contient le schéma `bearerAuth` ;
- un e-mail de bienvenue ou de contact arrive via Brevo.

### 3. Frontend Render

Créer le Static Site avec `frontend` comme dossier racine, la commande
`npm ci && npm run build:render` et le dossier publié `dist/frontend/browser`. Définir `API_URL`
avec l'URL HTTPS complète du backend terminée par `/api/v1`. Le build génère
`runtime-config.js`; aucune URL publique n'est figée dans le code source. La règle Render `/*`
vers `/index.html` assure le fallback SPA tout en laissant Render servir les fichiers existants.

Après publication, renseigner l'origine exacte du Static Site, sans joker, dans
`CORS_ALLOWED_ORIGINS` et `FRONTEND_URL`, puis redéployer le backend.

### Variables d'environnement

| Nom | Exemple non sensible | Requise en production | Usage |
|---|---|---:|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | oui | Active la configuration Spring de production |
| `PORT` | `10000` | fournie par Render | Port HTTP du backend |
| `DATABASE_URL` | `jdbc:postgresql://host/db?sslmode=require` | oui | URL JDBC Neon |
| `POSTGRES_USER` | `app_owner` | oui | Utilisateur Neon |
| `POSTGRES_PASSWORD` | `<secret-neon>` | oui | Mot de passe Neon |
| `MONGODB_URI` | `mongodb+srv://user:<secret>@cluster/db` | oui | URI MongoDB Atlas |
| `JWT_SECRET` | `<secret-aleatoire-64-caracteres>` | oui | Signature JWT |
| `JWT_ACCESS_EXPIRATION` | `900000` | non | Durée access token en millisecondes |
| `JWT_REFRESH_EXPIRATION` | `604800000` | non | Durée refresh token en millisecondes |
| `CORS_ALLOWED_ORIGINS` | `https://frontend.example` | oui | Origines frontend, séparées par des virgules |
| `FRONTEND_URL` | `https://frontend.example` | oui | Liens envoyés par e-mail |
| `CONTACT_EMAIL` | `contact@example.test` | oui | Destinataire des contacts |
| `MAIL_HOST` | `smtp-relay.brevo.com` | oui | Serveur SMTP |
| `MAIL_PORT` | `2525` | oui | Port SMTP Brevo |
| `MAIL_USERNAME` | `<login-smtp-brevo>` | oui | Identifiant SMTP |
| `MAIL_PASSWORD` | `<cle-smtp-brevo>` | oui | Clé SMTP |
| `MAIL_SMTP_AUTH` | `true` | non | Authentification SMTP hors profil prod |
| `MAIL_STARTTLS_ENABLE` | `true` | non | STARTTLS hors profil prod |
| `MAIL_FROM` | `no-reply@example.test` | oui | Expéditeur Brevo validé |
| `INITIAL_ADMIN_ENABLED` | `false` | non | Active ponctuellement l'initialisation ADMIN |
| `INITIAL_ADMIN_EMAIL` | `admin@vite-gourmand.test` | si initialisation | Adresse ADMIN initiale |
| `INITIAL_ADMIN_PASSWORD` | `<saisie-manuelle>` | si initialisation | Mot de passe initial, jamais commité |
| `INITIAL_ADMIN_FIRST_NAME` | `Admin` | non | Prénom du compte initial |
| `INITIAL_ADMIN_LAST_NAME` | `Vite Gourmand` | non | Nom du compte initial |
| `API_URL` | `https://backend.example/api/v1` | oui, frontend | URL centralisée utilisée au build Render |

Les secrets doivent être saisis dans Render, Neon, Atlas ou Brevo et ne doivent jamais être placés
dans `.env.example`, `render.yaml`, une commande partagée, une capture ou un commit.
