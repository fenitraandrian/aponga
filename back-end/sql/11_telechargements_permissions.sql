INSERT INTO permission (code, description) VALUES
  ('telechargements.gerer', 'Régler quels types de documents peuvent être téléchargés')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'administrateur' AND p.code = 'telechargements.gerer'
ON CONFLICT DO NOTHING;