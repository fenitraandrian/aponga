-- Capacité optionnelle d'une séance (vide = pas de limite)
ALTER TABLE seance ADD COLUMN capacite INTEGER;
ALTER TABLE seance ADD CONSTRAINT chk_seance_capacite CHECK (capacite IS NULL OR capacite > 0);

-- Un apprenant inscrit à une séance. Une seule inscription par couple (séance, apprenant).
CREATE TABLE inscription_seance (
  id               SERIAL PRIMARY KEY,
  id_seance        INTEGER NOT NULL REFERENCES seance(id) ON DELETE CASCADE,
  id_membre        INTEGER NOT NULL REFERENCES membre(id) ON DELETE RESTRICT,
  inscrit_par      INTEGER NOT NULL REFERENCES membre(id) ON DELETE RESTRICT,
  date_inscription TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_inscription_seance_membre UNIQUE (id_seance, id_membre)
);

CREATE INDEX idx_inscription_seance_membre ON inscription_seance (id_membre);