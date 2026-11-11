INSERT INTO permission (code, description) VALUES
  ('presences.lire', 'Voir les présences d''une séance'),
  ('presences.gerer', 'Marquer les présences de ses séances')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'administrateur' AND p.code = 'presences.lire'
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'formateur' AND p.code IN ('presences.lire', 'presences.gerer')
ON CONFLICT DO NOTHING;