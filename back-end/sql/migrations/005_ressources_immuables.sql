-- Les ressources d'une version d'activité publiée ne peuvent plus changer
CREATE OR REPLACE FUNCTION bloquer_ressource_publiee()
RETURNS TRIGGER AS $$
DECLARE
  etat_version VARCHAR;
BEGIN
  SELECT etat INTO etat_version
    FROM version_activite
   WHERE id = COALESCE(NEW.id_version_activite, OLD.id_version_activite);

  IF etat_version = 'publiee' THEN
    RAISE EXCEPTION 'Les ressources d''une version publiée sont immuables.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ressource_immuable
BEFORE INSERT OR UPDATE OR DELETE ON ressource
FOR EACH ROW EXECUTE FUNCTION bloquer_ressource_publiee();