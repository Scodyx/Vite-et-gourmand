-- Données strictement fictives. Aucun mot de passe ni compte n'est inséré ici.
INSERT INTO opening_hours(day_of_week, opening_time, closing_time, closed, display_order) VALUES
('MONDAY','09:00','18:00',false,1),('TUESDAY','09:00','18:00',false,2),
('WEDNESDAY','09:00','18:00',false,3),('THURSDAY','09:00','18:00',false,4),
('FRIDAY','09:00','19:00',false,5),('SATURDAY','10:00','16:00',false,6),
('SUNDAY',NULL,NULL,true,7);

INSERT INTO allergen(name) VALUES ('Gluten'),('Lait'),('Œufs'),('Fruits à coque'),('Soja'),('Poisson'),('Crustacés');
INSERT INTO dish(name,description,type) VALUES
('Velouté de potimarron','Crème légère et noisettes','ENTRY'),
('Saumon de l’Atlantique','Sauce citronnée et légumes de saison','MAIN_COURSE'),
('Entremets chocolat','Chocolat noir et praliné','DESSERT'),
('Tarte fine aux légumes','Légumes du marché et herbes fraîches','ENTRY'),
('Risotto aux cèpes','Riz arborio et cèpes','MAIN_COURSE'),
('Pavlova aux fruits','Meringue et fruits frais','DESSERT');

INSERT INTO menu(title,slug,description,conditions,minimum_persons,base_price,available_stock,active,theme,diet) VALUES
('Menu de Noël','menu-de-noel','Une table festive aux saveurs hivernales.','Commande 7 jours avant la prestation.',10,390.00,80,true,'Fêtes','Classique'),
('Menu Élégance Bordelaise','elegance-bordelaise','Une réception raffinée inspirée du terroir bordelais.','Commande 5 jours avant la prestation.',12,456.00,144,true,'Réception','Classique'),
('Menu Végétarien Gourmand','vegetarien-gourmand','Une cuisine végétale généreuse et colorée.','Commande 4 jours avant la prestation.',8,248.00,120,true,'Nature','Végétarien'),
('Menu Réception Classique','reception-classique','Des incontournables soignés pour tous les événements.','Commande 5 jours avant la prestation.',15,510.00,150,true,'Réception','Classique');

INSERT INTO menu_image(menu_id,image_url,alt_text,display_order)
SELECT id,'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
       'Table dressée avec des plats de traiteur',0 FROM menu;
INSERT INTO menu_dish(menu_id,dish_id) SELECT m.id,d.id FROM menu m CROSS JOIN dish d;
INSERT INTO dish_allergen(dish_id,allergen_id)
SELECT d.id,a.id FROM dish d JOIN allergen a ON a.name IN ('Gluten','Lait') WHERE d.name IN ('Entremets chocolat','Risotto aux cèpes');
