-- Une composition d'une version publiée ne peut plus être modifiée
CREATE OR REPLACE FUNCTION bloquer_composition_publiee()
RETURNS TRIGGER AS $$
DECLARE
  etat_version VARCHAR;
BEGIN
  SELECT etat INTO etat_version
    FROM version_etude
   WHERE id = COALESCE(NEW.id_version_etude, OLD.id_version_etude);

  IF etat_version = 'publiee' THEN
    RAISE EXCEPTION 'La composition d''une version publiée est immuable.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_composition_immuable
BEFORE INSERT OR UPDATE OR DELETE ON version_etude_activite
FOR EACH ROW EXECUTE FUNCTION bloquer_composition_publiee();