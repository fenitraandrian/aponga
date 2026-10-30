import { Router } from 'express'
import { pool } from '../db.js'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'

const router = Router()

// GET /api/roles : liste des rôles et de leurs permissions
router.get('/', authentifier, autoriser('roles.lire'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.code, r.nom,
              COALESCE(array_agg(p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
       FROM role r
       LEFT JOIN role_permission rp ON rp.id_role = r.id
       LEFT JOIN permission p ON p.id = rp.id_permission
       GROUP BY r.id, r.code, r.nom
       ORDER BY r.code`
    )
    res.json({ roles: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
  }
})

export default router