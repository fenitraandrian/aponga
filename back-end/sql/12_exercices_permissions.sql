INSERT INTO permission (code, description) VALUES
  ('exercices.gerer', 'Créer des consignes et valider les exercices'),
  ('exercices.soumettre', 'Déposer des exercices')
ON CONFLICT DO NOTHING;

-- INSERT INTO role_permission (id_role, id_permission)
-- SELECT r.id, p.id
--   FROM role r
--   JOIN permission p ON p.code IN ('exercices.gerer', 'exercices.soumettre')
--  WHERE r.code = 'administrateur'
-- ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id
  FROM role r
  JOIN permission p ON p.code = 'exercices.gerer'
 WHERE r.code = 'formateur'
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id
  FROM role r
  JOIN permission p ON p.code = 'exercices.soumettre'
 WHERE r.code = 'apprenant'
ON CONFLICT DO NOTHING;