-- Affectation d'un enseignant à une unité. Active tant que date_fin est vide.
CREATE TABLE affectation_enseignant (
  id          SERIAL PRIMARY KEY,
  id_membre   INTEGER NOT NULL REFERENCES membre(id) ON DELETE RESTRICT,
  id_etude    INTEGER NOT NULL REFERENCES etude(id) ON DELETE RESTRICT,
  date_debut  DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin    DATE,
  cree_le     TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_affectation_enseignant_dates CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

-- Un enseignant n'est affecté qu'une fois à la fois à une même unité
CREATE UNIQUE INDEX uq_affectation_enseignant_active
  ON affectation_enseignant (id_membre, id_etude)
  WHERE date_fin IS NULL;

CREATE INDEX idx_affectation_enseignant_etude ON affectation_enseignant (id_etude);