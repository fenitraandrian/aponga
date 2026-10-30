-- Deux éléments frères ne peuvent pas avoir le même ordre

CREATE UNIQUE INDEX uq_etude_ordre_parent
  ON etude (id_parent, ordre)
  WHERE id_parent IS NOT NULL;

CREATE UNIQUE INDEX uq_composition_ordre
  ON version_etude_activite (id_version_etude, ordre);

CREATE UNIQUE INDEX uq_ressource_ordre
  ON ressource (id_version_activite, ordre);