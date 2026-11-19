insert into organisation(nom,type) values(
   'aponga',
   'test'
);

INSERT INTO solde_seance (id_membre, id_niveau, nombre)
VALUES (3, 1, 5)
ON CONFLICT (id_membre, id_niveau) DO UPDATE SET nombre = 5;

INSERT INTO solde_seance (id_membre, id_niveau, nombre)
VALUES (9, 1, 5)
ON CONFLICT (id_membre, id_niveau) DO UPDATE SET nombre = 5;

INSERT INTO solde_seance (id_membre, id_niveau, nombre)
VALUES (9, 6, 5)
ON CONFLICT (id_membre, id_niveau) DO UPDATE SET nombre = 5;


-- Valeurs de départ : à ajuster dans l'admin
INSERT INTO regle_telechargement (type_fichier, telechargeable) VALUES
  ('pdf', TRUE),
  ('image', TRUE),
  ('audio', FALSE),
  ('video', FALSE)
ON CONFLICT DO NOTHING;