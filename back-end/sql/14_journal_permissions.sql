INSERT INTO permission (code, description) VALUES
  ('journal.lire', 'Consulter le journal d''activité des utilisateurs')
ON CONFLICT DO NOTHING;

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id
  FROM role r
  JOIN permission p ON p.code = 'journal.lire'
 WHERE r.code = 'administrateur'
ON CONFLICT DO NOTHING;