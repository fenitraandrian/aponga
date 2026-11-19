-- Un seul solde par apprenant et par niveau
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_solde_membre_niveau') THEN
    ALTER TABLE solde_seance
      ADD CONSTRAINT uq_solde_membre_niveau UNIQUE (id_membre, id_niveau);
  END IF;
END $$;