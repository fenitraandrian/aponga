-- MODIFICATION : début
ALTER TABLE etude ADD COLUMN parcours_particulier BOOLEAN NOT NULL DEFAULT FALSE;

-- Une formation n'a pas de niveau
ALTER TABLE etude ADD CONSTRAINT chk_etude_niveau_unite CHECK (
  type_etude = 'unite'
  OR (id_niveau IS NULL AND id_niveau_prerequis IS NULL AND parcours_particulier = FALSE)
);

-- Un prérequis choisi à la main n'existe que pour un parcours particulier
ALTER TABLE etude ADD CONSTRAINT chk_etude_prerequis_particulier CHECK (
  parcours_particulier OR id_niveau_prerequis IS NULL
);
-- MODIFICATION : fin