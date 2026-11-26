import { ErreurMetier } from './pedagogie.js'
import { pool } from '../db.js'

// Ouvre un abonnement dans la transaction du paiement.
// S'il existe déjà un abonnement actif sur ce niveau, le nouveau commence à sa date de fin.
export async function ouvrirAbonnement(client, { idMembre, idNiveau, idType, idPaiement, montant }) {
  const type = await client.query(
    'SELECT duree_jours, prix FROM type_abonnement WHERE id = $1 AND actif = TRUE',
    [idType]
  )
  if (!type.rows[0]) {
    throw new ErreurMetier(400, 'Type d\'abonnement inconnu ou inactif.')
  }
  if (montant < Number(type.rows[0].prix)) {
    throw new ErreurMetier(
      400,
      `Le montant doit être d'au moins ${type.rows[0].prix} Ar pour ce type d'abonnement.`
    )
  }

  const { rows } = await client.query(
    `WITH debut AS (
       SELECT COALESCE(MAX(date_fin), CURRENT_DATE) AS d
       FROM abonnement
       WHERE id_membre = $1 AND id_niveau = $2 AND date_fin >= CURRENT_DATE
     )
     INSERT INTO abonnement (id_membre, id_niveau, id_type, id_paiement, date_debut, date_fin)
     SELECT $1, $2, $3, $4, d, d + $5::int FROM debut
     RETURNING *`,
    [idMembre, idNiveau, idType, idPaiement, type.rows[0].duree_jours]
  )
  return rows[0]
}

// Vrai si l'apprenant a un abonnement encore valable sur ce niveau
export async function abonnementActif(client, idMembre, idNiveau) {
  const { rows } = await client.query(
    `SELECT 1 FROM abonnement
     WHERE id_membre = $1 AND id_niveau = $2 AND date_fin >= CURRENT_DATE
     LIMIT 1`,
    [idMembre, idNiveau]
  )
  return rows.length > 0
}

export async function listerTypesAbonnement() {
  const { rows } = await pool.query(
    'SELECT id, libelle, duree_jours,prix FROM type_abonnement WHERE actif = TRUE ORDER BY duree_jours'
  )
  return rows
}