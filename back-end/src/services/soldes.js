import { pool } from '../db.js'
import { ErreurMetier } from './pedagogie.js'

export async function listerSoldes() {
  const { rows } = await pool.query(
    `SELECT s.id_membre, s.id_niveau, s.nombre AS solde,s.reste,
            u.prenom, u.nom, n.nom AS niveau_nom, n.ordre AS niveau_ordre
       FROM solde_seance s
       JOIN membre m ON m.id = s.id_membre
       JOIN utilisateur u ON u.id = m.id_utilisateur
       JOIN niveau n ON n.id = s.id_niveau
      ORDER BY u.nom, u.prenom, n.ordre`
  )
  return rows
}

export async function creerSolde(idMembre, idNiveau, solde) {
  const { rows } = await pool.query(
    `INSERT INTO solde_seance (id_membre, id_niveau, nombre)
     VALUES ($1, $2, $3)
     RETURNING id_membre, id_niveau, nombre AS solde`,
    [idMembre, idNiveau, solde]
  )
  return rows[0]
}

export async function modifierSolde(idMembre, idNiveau, solde) {
  const { rows } = await pool.query(
    `UPDATE solde_seance
        SET nombre = $3
      WHERE id_membre = $1 AND id_niveau = $2
  RETURNING id_membre, id_niveau, nombre AS solde`,
    [idMembre, idNiveau, solde]
  )
  if (!rows[0]) throw new ErreurMetier(404, 'Solde introuvable.')
  return rows[0]
}

export async function supprimerSolde(idMembre, idNiveau) {
  const { rowCount } = await pool.query(
    'DELETE FROM solde_seance WHERE id_membre = $1 AND id_niveau = $2',
    [idMembre, idNiveau]
  )
  if (!rowCount) throw new ErreurMetier(404, 'Solde introuvable.')
}