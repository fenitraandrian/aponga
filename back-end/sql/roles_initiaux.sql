-- Rôles et permissions de départ (rejouable sans erreur)

INSERT INTO permission (code, description) VALUES
  ('profil.consulter', 'Voir son propre profil'),
  ('utilisateurs.lire', 'Voir la liste des utilisateurs et leurs rôles'),
  ('utilisateurs.modifier', 'Modifier les informations des utilisateurs'),
  ('roles.lire', 'Voir les rôles et leurs permissions'),
  ('roles.gerer', 'Attribuer des rôles aux membres')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role (code, nom) VALUES
  ('administrateur', 'Administrateur'),
  ('formateur', 'Formateur'),
  ('apprenant', 'Apprenant')
ON CONFLICT (code) DO NOTHING;

-- administrateur : toutes les permissions
INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'administrateur'
ON CONFLICT DO NOTHING;

-- formateur : son profil et la consultation des utilisateurs
INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'formateur' AND p.code IN ('profil.consulter', 'utilisateurs.lire')
ON CONFLICT DO NOTHING;

-- apprenant : son profil uniquement
INSERT INTO role_permission (id_role, id_permission)
SELECT r.id, p.id FROM role r, permission p
WHERE r.code = 'apprenant' AND p.code = 'profil.consulter'
ON CONFLICT DO NOTHING;

-- Rôle administrateur pour ton compte de test
INSERT INTO membre_role (id_membre, id_role)
SELECT m.id, r.id FROM membre m
JOIN utilisateur u ON u.id = m.id_utilisateur
JOIN role r ON r.code = 'administrateur'
WHERE u.email = 'lanja@test.mg'
ON CONFLICT DO NOTHING;