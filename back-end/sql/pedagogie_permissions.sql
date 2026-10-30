-- Permissions de la couche pédagogique
INSERT INTO permission (code, description) VALUES
  ('pedagogie.lire', 'Consulter les formations, unités et leurs versions'),
  ('pedagogie.gerer', 'Créer, modifier, supprimer et publier formations et unités')
ON CONFLICT DO NOTHING;

-- Administrateur : lecture et gestion
INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.code = 'administrateur'
  AND p.code IN ('pedagogie.lire', 'pedagogie.gerer')
ON CONFLICT DO NOTHING;

-- Formateur : lecture seule pour l'instant
INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.code = 'formateur'
  AND p.code = 'pedagogie.lire'
ON CONFLICT DO NOTHING;