import { pool } from '../db.js'
import { ErreurMetier } from './pedagogie.js'

// Inscrits d'une séance avec leur présence (present = null si pas encore marqué)
export async function listerPresences(idSeance) {
  const seance = await pool.query(
    'SELECT id, date_debut, id_enseignant FROM seance WHERE id = $1',
    [idSeance]
  )
  if (!seance.rows[0]) return null

  const { rows } = await pool.query(
    `SELECT i.id_membre, u.nom, u.prenom, u.email, p.present
       FROM inscription_seance i
       JOIN membre m ON m.id = i.id_membre
       JOIN utilisateur u ON u.id = m.id_utilisateur
       LEFT JOIN presence_seance p ON p.id_seance = i.id_seance AND p.id_membre = i.id_membre
      WHERE i.id_seance = $1
      ORDER BY u.nom, u.prenom`,
    [idSeance]
  )
  return { seance: seance.rows[0], presences: rows }
}

// Marque ou corrige les présences. Seul l'enseignant de la séance peut le faire, une fois la séance commencée.
export async function marquerPresences(idSeance, idFormateur, presences) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const seance = await client.query(
      'SELECT id_enseignant, (date_debut <= NOW()) AS commencee FROM seance WHERE id = $1 FOR UPDATE',
      [idSeance]
    )
    if (!seance.rows[0]) throw new ErreurMetier(404, 'Séance introuvable.')
    if (seance.rows[0].id_enseignant !== idFormateur) {
      throw new ErreurMetier(403, "Seul l'enseignant de cette séance peut marquer les présences.")
    }
    if (!seance.rows[0].commencee) {
      throw new ErreurMetier(409, "La séance n'a pas encore commencé.")
    }

    for (const p of presences) {
      await client.query(
        `INSERT INTO presence_seance (id_seance, id_membre, present, marque_par)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id_seance, id_membre) DO UPDATE
           SET present = EXCLUDED.present,
               marque_par = EXCLUDED.marque_par,
               date_marquage = NOW()`,
        [idSeance, p.id_membre, p.present, idFormateur]
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return listerPresences(idSeance)
}

// Présences d'un apprenant, pour les séances déjà commencées
export async function listerMesPresences(idMembre) {
  const { rows } = await pool.query(
    `SELECT s.id, s.date_debut, e.titre AS titre_unite, p.present
       FROM inscription_seance i
       JOIN seance s ON s.id = i.id_seance
       JOIN etude e ON e.id = s.id_etude
       LEFT JOIN presence_seance p ON p.id_seance = i.id_seance AND p.id_membre = i.id_membre
      WHERE i.id_membre = $1 AND s.date_debut <= NOW()
      ORDER BY s.date_debut DESC`,
    [idMembre]
  )
  return rows
}