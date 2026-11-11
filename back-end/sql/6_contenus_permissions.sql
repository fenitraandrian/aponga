INSERT INTO permission (code, description) VALUES
  ('contenus.lire', 'Consulter et télécharger les contenus des unités'),
  ('contenus.gerer', 'Téléverser, modifier et supprimer les contenus des unités')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'administrateur' AND p.code IN ('contenus.lire', 'contenus.gerer')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'formateur' AND p.code IN ('contenus.lire', 'contenus.gerer')
ON CONFLICT DO NOTHING;