INSERT INTO permission (code, description) VALUES
  ('inscriptions.lire', 'Voir les apprenants inscrits à une séance'),
  ('inscriptions.gerer', 'Inscrire et désinscrire des apprenants aux séances')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'administrateur' AND p.code IN ('inscriptions.lire', 'inscriptions.gerer')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'formateur' AND p.code = 'inscriptions.lire'
ON CONFLICT DO NOTHING;