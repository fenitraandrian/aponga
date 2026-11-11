INSERT INTO permission (code, description) VALUES
  ('enseignants.lire', 'Consulter les enseignants et leurs affectations'),
  ('enseignants.gerer', 'Modifier les enseignants et gérer leurs affectations')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'administrateur' AND p.code IN ('enseignants.lire', 'enseignants.gerer')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'formateur' AND p.code = 'enseignants.lire'
ON CONFLICT DO NOTHING;