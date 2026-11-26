-- Journal d'activité : une ligne par action d'écriture réussie
CREATE TABLE journal_activite (
  id              SERIAL PRIMARY KEY,
  cree_le         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_utilisateur  INTEGER REFERENCES utilisateur(id) ON DELETE SET NULL,
  methode         VARCHAR(10) NOT NULL,
  route           VARCHAR(255) NOT NULL,
  entite          VARCHAR(60) NOT NULL,
  statut          INTEGER NOT NULL,
  details         JSONB,
  adresse_ip      VARCHAR(45)
);

CREATE INDEX idx_journal_date ON journal_activite (cree_le DESC);
CREATE INDEX idx_journal_utilisateur ON journal_activite (id_utilisateur);
CREATE INDEX idx_journal_entite ON journal_activite (entite);