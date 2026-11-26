-- Prix d'une séance, par niveau
CREATE TABLE IF NOT EXISTS tarif_niveau (
  id_niveau INTEGER PRIMARY KEY REFERENCES niveau(id) ON DELETE CASCADE,
  prix_seance NUMERIC(12,2) NOT NULL CHECK (prix_seance > 0)
);

-- Paiements enregistrés
CREATE TABLE IF NOT EXISTS paiement (
  id SERIAL PRIMARY KEY,
  id_membre INTEGER NOT NULL REFERENCES membre(id) ON DELETE CASCADE,
  id_niveau INTEGER NOT NULL REFERENCES niveau(id),
  montant NUMERIC(12,2) NOT NULL CHECK (montant > 0),
  prix_seance NUMERIC(12,2) NOT NULL CHECK (prix_seance > 0),
  nombre_seances INTEGER NOT NULL CHECK (nombre_seances >= 0),
  reste_apres NUMERIC(12,2) NOT NULL CHECK (reste_apres >= 0),
  enregistre_par INTEGER REFERENCES utilisateur(id) ON DELETE SET NULL,
  cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_paiement_membre ON paiement(id_membre);

-- Reste non utilisé, conservé par niveau
ALTER TABLE solde_seance
  ADD COLUMN IF NOT EXISTS reste NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (reste >= 0);