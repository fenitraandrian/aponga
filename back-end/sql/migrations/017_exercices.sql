-- Exercices : consignes par séance, dépôts versionnés par apprenant, fichiers joints

CREATE TABLE consigne (
  id           SERIAL PRIMARY KEY,
  id_seance    INTEGER NOT NULL REFERENCES seance(id) ON DELETE CASCADE,
  titre        VARCHAR(200) NOT NULL,
  description  TEXT,
  date_limite  TIMESTAMPTZ,
  cree_le      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_consigne_seance ON consigne (id_seance);

CREATE TABLE depot (
  id              SERIAL PRIMARY KEY,
  id_consigne     INTEGER NOT NULL REFERENCES consigne(id) ON DELETE CASCADE,
  id_membre       INTEGER NOT NULL REFERENCES membre(id) ON DELETE RESTRICT,
  numero_version  INTEGER NOT NULL CHECK (numero_version > 0),
  statut          VARCHAR(20) NOT NULL DEFAULT 'soumis'
                  CHECK (statut IN ('soumis', 'valide', 'rejete')),
  depose_le       TIMESTAMP NOT NULL DEFAULT NOW(),
  note            NUMERIC(4,2) CHECK (note BETWEEN 0 AND 20),
  commentaire     TEXT,
  valide_par      INTEGER REFERENCES membre(id) ON DELETE RESTRICT,
  valide_le       TIMESTAMP,
  CONSTRAINT uq_depot_version UNIQUE (id_consigne, id_membre, numero_version),
  CONSTRAINT ck_depot_validation CHECK (statut = 'soumis' OR valide_le IS NOT NULL)
);
CREATE INDEX idx_depot_membre ON depot (id_membre);
CREATE INDEX idx_depot_statut ON depot (statut);

CREATE TABLE depot_fichier (
  id            SERIAL PRIMARY KEY,
  id_depot      INTEGER NOT NULL REFERENCES depot(id) ON DELETE CASCADE,
  nom_original  VARCHAR(255) NOT NULL,
  chemin        VARCHAR(500) NOT NULL,
  type_mime     VARCHAR(100) NOT NULL,
  taille        INTEGER NOT NULL CHECK (taille > 0)
);
CREATE INDEX idx_depot_fichier_depot ON depot_fichier (id_depot);