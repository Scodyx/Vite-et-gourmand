# Gestion de projet

Méthode : itérations courtes orientées parcours de bout en bout, avec démonstration et rétrospective à chaque lot.

## Backlog initial

| Priorité | Lot | Critère de fin |
|---|---|---|
| P0 | Infrastructure, données, sécurité | Build vert, migrations reproductibles, aucun secret |
| P0 | Catalogue et commande | Parcours testé, prix/stock recalculés en transaction |
| P1 | Espace employé | CRUD et transitions protégés |
| P1 | Espace administrateur | Employés et statistiques MongoDB |
| P2 | Accessibilité, RGPD, déploiement | Audit, mentions finalisées, exploitation documentée |

Git : `main` reçoit les versions, `develop` intègre, les branches courtes portent `feature/`, `fix/` ou `docs/`. Les commits suivent Conventional Commits.

La définition de terminé exige : critères métier satisfaits, contrôle back-end, tests pertinents verts, accessibilité clavier, documentation mise à jour, revue et absence de secret.

Risques principaux : périmètre large, calcul géographique non spécifié, concurrence sur le stock, données personnelles, délivrabilité e-mail et divergence SQL/JPA. Réponses : lots verticaux, abstraction de distance, verrou transactionnel, minimisation/RGPD, Mailpit/outbox et Flyway + `ddl-auto=validate`.

Découpage conseillé : fondations → catalogue/auth → commande → employé → admin/statistiques → qualité/déploiement.
