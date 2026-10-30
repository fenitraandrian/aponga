INSERT INTO permission (code, description) VALUES
  ('seances.lire', 'Consulter le planning des séances'),
  ('seances.gerer', 'Créer, modifier et supprimer des séances')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'administrateur' AND p.code IN ('seances.lire', 'seances.gerer')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'formateur' AND p.code = 'seances.lire'
ON CONFLICT DO NOTHING;