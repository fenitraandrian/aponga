INSERT INTO permission (code, description) VALUES
  ('inscriptions.soi', 'Voir les séances disponibles et s''inscrire ou se désinscrire soi-même')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'apprenant' AND p.code = 'inscriptions.soi'
ON CONFLICT DO NOTHING;