# Documentation technique

## Architecture

Le navigateur Angular communique en JSON avec une API Spring Boot stateless. PostgreSQL est la source métier transactionnelle ; MongoDB est réservé aux agrégats administrateur reconstruisibles. Mailpit capture les e-mails locaux. Flyway crée le schéma et Hibernate le valide.

Le back-end est organisé par domaine (`auth`, `user`, `menu`, `order`, `contact`, `statistics`) puis par responsabilité (`controller`, `service`, `repository`, `entity`, `dto`). Les réponses REST n’exposent pas directement les entités. Le front sépare `core`, `features` et le layout racine.

## Sécurité et configuration

Les mots de passe utilisent BCrypt. Le JWT court est envoyé dans l’en-tête `Authorization`; le front le conserve en `sessionStorage`, compromis documenté entre persistance et réduction d’exposition. L’API reste l’autorité pour rôles, prix, stock et propriété. Secrets, CORS, SMTP et connexions sont configurés par variables d’environnement.

En production : utiliser HTTPS, une clé JWT aléatoire gérée par un coffre, des refresh tokens hachés et révocables dans un cookie `HttpOnly SameSite`, une politique CSP, une limitation de débit et une rotation des secrets.

## Données et règles

`basePrice` couvre `minimumPersons`. Le serveur calcule `basePrice / minimumPersons × personCount`, arrondit à deux décimales et applique 10 % au menu dès cinq convives supplémentaires. Bordeaux est gratuit ; hors Bordeaux coûte 5 € + 0,59 €/km. Une future implémentation de `DistanceCalculatorService` pourra appeler un fournisseur cartographique sans modifier la tarification.

Les migrations sous `backend/src/main/resources/db/migration` sont synchronisées avec `database/schema.sql` et `data.sql`. Les statistiques MongoDB sont dérivées : PostgreSQL demeure la source de vérité.

## Commandes et récupération de compte

`POST /api/v1/orders` verrouille le menu en écriture, vérifie le stock, recalcule tous les
montants côté serveur, décrémente le stock et écrit le premier historique dans une même
transaction. `GET /api/v1/orders` est limité au compte authentifié. L'annulation client
contrôle également la propriété et restitue le stock. Les transitions d'équipe passent par
`PATCH /api/v1/employee/orders/{id}/status` et la machine d'états métier.

`POST /api/v1/auth/forgot-password` répond de façon identique que l'adresse existe ou non.
Le jeton envoyé par e-mail expire après 30 minutes et seule son empreinte SHA-256 est
persistée. `POST /api/v1/auth/reset-password` impose un mot de passe fort et invalide le
jeton après le premier usage.

Les refresh tokens sont des valeurs aléatoires de 384 bits. Seule leur empreinte SHA-256 est
conservée dans PostgreSQL. Un renouvellement révoque le jeton présenté et en émet un nouveau ;
le logout révoque le jeton courant. Le stockage navigateur est limité à `sessionStorage` dans
la démonstration. Un cookie `HttpOnly`, `Secure`, `SameSite` est recommandé en production.

## Catalogue, avis et statistiques

Les plats et allergènes sont relationnels (`dish_allergen`) et le détail public d’un menu agrège
sa galerie, ses plats et leurs allergènes. Les horaires publics et administrables proviennent de
PostgreSQL. Un avis exige une commande `COMPLETED` appartenant au compte courant et passe par
la modération avant publication.

PostgreSQL demeure la source de vérité. `POST /api/v1/admin/statistics/rebuild` exclut les
commandes annulées, regroupe les montants par menu et date, remplace la collection MongoDB puis
permet les lectures filtrées. La reconstruction est idempotente pour un même état source.

## API disponible

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/public/menus`
- `GET /api/v1/public/menus/{slug}`
- `POST /api/v1/public/contact`

Swagger documente automatiquement DTO et schémas à `/swagger-ui.html`.

## E-mails

Spring Mail envoie vers SMTP. Localement, Mailpit reçoit sur `1025` et expose l’interface `8025`. L’échec SMTP fait actuellement échouer la requête de contact : une file transactionnelle/outbox est recommandée en production.

## Déploiement et limites

Construire le front statique derrière un CDN/reverse proxy, l’API en image Java 21 et utiliser PostgreSQL/MongoDB managés avec sauvegardes. Les CRUD complets, refresh tokens, réinitialisation de mot de passe, commandes et statistiques doivent être achevés avant une mise en production.
