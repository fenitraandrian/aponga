import { pool } from '../db.js' // même import que pedagogie.js : à adapter
import { ErreurMetier } from './pedagogie.js'

export async function listerNiveaux() {
  const { rows } = await pool.query('SELECT id, nom, ordre, cree_le FROM niveau ORDER BY ordre')
  return rows
}

export async function trouverNiveau(id) {
  const { rows } = await pool.query('SELECT id, nom, ordre, cree_le FROM niveau WHERE id = $1', [id])
  return rows[0] ?? null
}

export async function creerNiveau(corps) {
  const { rows } = await pool.query(
    'INSERT INTO niveau (nom, ordre) VALUES ($1, $2) RETURNING *',
    [corps.nom.trim(), corps.ordre]
  )
  return rows[0]
}

export async function modifierNiveau(id, corps) {
  const { rows } = await pool.query(
    'UPDATE niveau SET nom = $2, ordre = $3 WHERE id = $1 RETURNING *',
    [id, corps.nom.trim(), corps.ordre]
  )
  return rows[0] ?? null
}

export async function supprimerNiveau(id) {
  const utilisation = await pool.query(
    `SELECT (SELECT COUNT(*) FROM etude WHERE id_niveau = $1 OR id_niveau_prerequis = $1)
          + (SELECT COUNT(*) FROM competence WHERE id_niveau = $1) AS n`,
    [id]
  )
  if (Number(utilisation.rows[0].n) > 0) {
    throw new ErreurMetier(409, 'Ce niveau est utilisé par des formations, unités ou compétences : il ne peut pas être supprimé.')
  }
  const { rowCount } = await pool.query('DELETE FROM niveau WHERE id = $1', [id])
  return rowCount > 0
}