INSERT INTO permission (code, description)
SELECT 'paiements.gerer', 'Enregistrer les paiements et calculer les séances'
WHERE NOT EXISTS (SELECT 1 FROM permission WHERE code = 'paiements.gerer');

INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.code = 'administrateur'
  AND p.code = 'paiements.gerer'
  AND NOT EXISTS (
    SELECT 1 FROM role_permission rp WHERE rp.id_role = r.id AND rp.id_permission = p.id
  );