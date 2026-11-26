ALTER TABLE type_abonnement
  ADD COLUMN IF NOT EXISTS prix NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (prix >= 0);

UPDATE type_abonnement SET prix = 5000 WHERE libelle = 'Mensuel';
UPDATE type_abonnement SET prix = 15000 WHERE libelle = 'Trimestriel';