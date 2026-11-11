-- Conteneur de contenu : un ensemble de fichiers rattaché à une unité, et optionnellement à une séance
CREATE TABLE conteneur_contenu (
  id          SERIAL PRIMARY KEY,
  id_etude    INTEGER NOT NULL REFERENCES etude(id) ON DELETE RESTRICT,
  id_seance   INTEGER REFERENCES seance(id) ON DELETE RESTRICT,
  titre       VARCHAR(200) NOT NULL,
  description TEXT,
  cree_par    INTEGER REFERENCES membre(id) ON DELETE RESTRICT,
  cree_le     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conteneur_etude ON conteneur_contenu (id_etude);
CREATE INDEX idx_conteneur_seance ON conteneur_contenu (id_seance);

-- Fichier téléversé : seul le nom aléatoire est utilisé sur le disque
CREATE TABLE fichier (
  id             SERIAL PRIMARY KEY,
  id_conteneur   INTEGER NOT NULL REFERENCES conteneur_contenu(id) ON DELETE CASCADE,
  nom_original   VARCHAR(255) NOT NULL,
  nom_stocke     VARCHAR(64) NOT NULL UNIQUE,
  type_mime      VARCHAR(100) NOT NULL,
  type_media     VARCHAR(20) NOT NULL CHECK (type_media IN ('pdf', 'image', 'audio', 'video')),
  taille_octets  BIGINT NOT NULL CHECK (taille_octets > 0),
  cree_le        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fichier_conteneur ON fichier (id_conteneur);

