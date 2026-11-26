CREATE TABLE IF NOT EXISTS type_abonnement (
  id SERIAL PRIMARY KEY,
  libelle VARCHAR(100) NOT NULL UNIQUE,
  duree_jours INTEGER NOT NULL CHECK (duree_jours > 0),
  actif BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS abonnement (
  id SERIAL PRIMARY KEY,
  id_membre INTEGER NOT NULL REFERENCES membre(id) ON DELETE CASCADE,
  id_niveau INTEGER NOT NULL REFERENCES niveau(id),
  id_type INTEGER NOT NULL REFERENCES type_abonnement(id),
  id_paiement INTEGER REFERENCES paiement(id) ON DELETE SET NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  CHECK (date_fin > date_debut)
);
CREATE INDEX IF NOT EXISTS idx_abonnement_membre_niveau
  ON abonnement(id_membre, id_niveau, date_fin);

ALTER TABLE paiement
  ADD COLUMN IF NOT EXISTS id_type_abonnement INTEGER REFERENCES type_abonnement(id);

INSERT INTO type_abonnement (libelle, duree_jours) VALUES
  ('Mensuel', 30),
  ('Trimestriel', 90)
ON CONFLICT (libelle) DO NOTHING;