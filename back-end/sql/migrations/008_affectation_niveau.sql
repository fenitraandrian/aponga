-- Historique des niveaux suivis par un membre.
-- Une affectation est active tant que date_fin est vide.
CREATE TABLE affectation_niveau (
  id          SERIAL PRIMARY KEY,
  id_membre   INTEGER NOT NULL REFERENCES membre(id) ON DELETE RESTRICT,
  id_niveau   INTEGER NOT NULL REFERENCES niveau(id) ON DELETE RESTRICT,
  date_debut  DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin    DATE,
  cree_le     TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_affectation_dates CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

-- Un membre n'a qu'une seule affectation active à la fois
CREATE UNIQUE INDEX uq_affectation_active
  ON affectation_niveau (id_membre)
  WHERE date_fin IS NULL;

-- Pour l'historique par niveau (T16)
CREATE INDEX idx_affectation_niveau_niveau ON affectation_niveau (id_niveau);