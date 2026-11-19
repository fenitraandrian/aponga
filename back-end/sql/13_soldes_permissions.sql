INSERT INTO permission (code, description) VALUES
  ('soldes.gerer', 'Attribuer et modifier le solde de séances des apprenants')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id
  FROM role r
  JOIN permission p ON p.code = 'soldes.gerer'
 WHERE r.code = 'administrateur'
ON CONFLICT DO NOTHING;