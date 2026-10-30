-- Séance : une occurrence d'une unité, animée par un enseignant
CREATE TABLE seance (
  id             SERIAL PRIMARY KEY,
  id_etude       INTEGER NOT NULL REFERENCES etude(id) ON DELETE RESTRICT,
  id_enseignant  INTEGER NOT NULL REFERENCES membre(id) ON DELETE RESTRICT,
  date_debut     TIMESTAMPTZ NOT NULL,
  duree_minutes  INTEGER NOT NULL CHECK (duree_minutes > 0 AND duree_minutes <= 1440),
  cree_le        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pour le planning d'un enseignant et le contrôle des chevauchements
CREATE INDEX idx_seance_enseignant_date ON seance (id_enseignant, date_debut);
CREATE INDEX idx_seance_etude ON seance (id_etude);