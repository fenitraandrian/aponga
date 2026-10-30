import { Router } from 'express'
import { pool } from '../db.js'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'

const router = Router()

// GET /api/utilisateurs : liste des utilisateurs et de leurs rôles
router.get('/', authentifier, autoriser('utilisateurs.lire'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.prenom, u.nom, u.email,
              COALESCE(array_agg(r.code ORDER BY r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
       FROM utilisateur u
       LEFT JOIN membre m ON m.id_utilisateur = u.id
       LEFT JOIN membre_role mr ON mr.id_membre = m.id
       LEFT JOIN role r ON r.id = mr.id_role
       GROUP BY u.id, u.prenom, u.nom, u.email
       ORDER BY u.nom, u.prenom`
    )
    res.json({ utilisateurs: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
  }
})

// attribution des rôles d'un utilisateur
// PUT /api/utilisateurs/:id/roles : remplace la liste des rôles
// Corps attendu : { "roles": ["formateur", "apprenant"] }
router.put('/:id/roles', authentifier, autoriser('roles.gerer'), async (req, res) => {
  const idCible = Number(req.params.id)
  const codes = Array.isArray(req.body?.roles) ? [...new Set(req.body.roles)] : null

  if (!Number.isInteger(idCible) || !codes) {
    return res.status(400).json({ message: 'Identifiant ou liste de rôles invalide.' })
  }

  // Garde-fou : un administrateur ne peut pas se retirer son propre rôle
  if (idCible === req.utilisateur.id && !codes.includes('administrateur')) {
    return res.status(400).json({ message: 'Vous ne pouvez pas retirer votre propre rôle administrateur.' })
  }

  try {
    const membre = await pool.query('SELECT id FROM membre WHERE id_utilisateur = $1', [idCible])
    if (!membre.rows[0]) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' })
    }
    const idMembre = membre.rows[0].id

    const roles = await pool.query('SELECT id, code FROM role WHERE code = ANY($1)', [codes])
    if (roles.rows.length !== codes.length) {
      return res.status(400).json({ message: 'Un ou plusieurs rôles sont inconnus.' })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM membre_role WHERE id_membre = $1', [idMembre])
      for (const role of roles.rows) {
        await client.query(
          `INSERT INTO membre_role (id_membre, id_role, attribue_par)
           VALUES ($1, $2, (SELECT id FROM membre WHERE id_utilisateur = $3))`,
          [idMembre, role.id, req.utilisateur.id]
        )
      }
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    res.json({ message: 'Rôles mis à jour.', roles: codes })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
  }
})

export default router