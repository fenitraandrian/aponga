-- Règle de téléchargement par type de document (modifiable par l'admin)
CREATE TABLE regle_telechargement (
  type_fichier   VARCHAR(20) PRIMARY KEY
                 CHECK (type_fichier IN ('pdf', 'image', 'audio', 'video')),
  telechargeable BOOLEAN NOT NULL DEFAULT FALSE
);

-- Valeurs de départ : à ajuster dans l'admin
INSERT INTO regle_telechargement (type_fichier, telechargeable) VALUES
  ('pdf', TRUE),
  ('image', TRUE),
  ('audio', FALSE),
  ('video', FALSE)
ON CONFLICT DO NOTHING;