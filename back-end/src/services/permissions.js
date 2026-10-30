import { pool } from '../db.js'

// Renvoie les codes de permission d'un utilisateur, via ses membres actifs et leurs rôles
export async function permissionsDeLUtilisateur(idUtilisateur) {
  const { rows } = await pool.query(
    `SELECT DISTINCT p.code
     FROM membre m
     JOIN membre_role mr ON mr.id_membre = m.id
     JOIN role_permission rp ON rp.id_role = mr.id_role
     JOIN permission p ON p.id = rp.id_permission
     WHERE m.id_utilisateur = $1 AND m.statut = 'actif'`,
    [idUtilisateur]
  )
  return rows.map((ligne) => ligne.code)
}

export async function rolesDeLUtilisateur(idUtilisateur) {
  const { rows } = await pool.query(
    `SELECT DISTINCT r.code, r.nom
       FROM membre m
       JOIN membre_role mr ON mr.id_membre = m.id
       JOIN role r ON r.id = mr.id_role
      WHERE m.id_utilisateur = $1 AND m.statut = 'actif'`,
    [idUtilisateur]
  )
  return rows
}
