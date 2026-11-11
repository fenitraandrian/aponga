-- Présence d'un apprenant inscrit à une séance (présent ou absent)
CREATE TABLE presence_seance (
  id_seance     INTEGER NOT NULL,
  id_membre     INTEGER NOT NULL,
  present       BOOLEAN NOT NULL,
  marque_par    INTEGER NOT NULL REFERENCES membre(id) ON DELETE RESTRICT,
  date_marquage TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_seance, id_membre),
  CONSTRAINT fk_presence_inscription FOREIGN KEY (id_seance, id_membre)
    REFERENCES inscription_seance (id_seance, id_membre) ON DELETE CASCADE
);