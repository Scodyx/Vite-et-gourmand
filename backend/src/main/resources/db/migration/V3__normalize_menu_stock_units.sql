-- Le stock est exprimé en nombre de personnes disponibles.
-- Les données V2 utilisaient un nombre de prestations : conversion idempotente par migration unique.
UPDATE menu
SET available_stock = available_stock * minimum_persons;
