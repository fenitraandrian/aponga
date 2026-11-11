-- Solde de séances par apprenant et par niveau (rempli plus tard par le module paiement, T20)
CREATE TABLE solde_seance (
  id_membre INTEGER NOT NULL REFERENCES membre(id) ON DELETE RESTRICT,
  id_niveau INTEGER NOT NULL REFERENCES niveau(id) ON DELETE RESTRICT,
  nombre    INTEGER NOT NULL DEFAULT 0 CHECK (nombre >= 0),
  PRIMARY KEY (id_membre, id_niveau)
);

-- Niveau décompté lors de l'inscription (sert à rembourser le solde à la désinscription)
ALTER TABLE inscription_seance ADD COLUMN id_niveau INTEGER REFERENCES niveau(id) ON DELETE RESTRICT;