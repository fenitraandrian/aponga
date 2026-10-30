import { pool } from '../db.js'
import { ErreurMetier } from './pedagogie.js'

const SELECTION = `
  SELECT s.id, s.id_etude, s.id_enseignant, s.date_debut, s.duree_minutes,
         e.titre AS unite,
         u.nom AS enseignant_nom, u.prenom AS enseignant_prenom
    FROM seance s
    JOIN etude e ON e.id = s.id_etude
    JOIN membre m ON m.id = s.id_enseignant
    JOIN utilisateur u ON u.id = m.id_utilisateur`

// Planning, éventuellement filtré par période
export async function listerSeances(du, au) {
  const { rows } = await pool.query(
    `${SELECTION}
     WHERE ($1::TIMESTAMPTZ IS NULL OR s.date_debut >= $1::TIMESTAMPTZ)
       AND ($2::TIMESTAMPTZ IS NULL OR s.date_debut < $2::TIMESTAMPTZ)
     ORDER BY s.date_debut`,
    [du || null, au || null]
  )
  return rows
}

export async function trouverSeance(id, client = pool) {
  const { rows } = await client.query(`${SELECTION} WHERE s.id = $1`, [id])
  return rows[0] ?? null
}

// Règle métier : une séance se rattache à une unité, pas à une formation
async function verifierUnite(client, idEtude) {
  const { rows } = await client.query('SELECT type_etude FROM etude WHERE id = $1', [idEtude])
  if (!rows[0]) throw new ErreurMetier(400, 'Unité introuvable.')
  if (rows[0].type_etude !== 'unite') {
    throw new ErreurMetier(400, 'Une séance doit être rattachée à une unité, pas à une formation.')
  }
}

// Règle métier : seul un membre actif avec le rôle formateur peut animer une séance.
// Le verrou FOR UPDATE sur le membre empêche deux réservations simultanées pour le même enseignant.
async function verifierEnseignant(client, idEnseignant) {
  const { rows } = await client.query(
    `SELECT m.id
       FROM membre m
       JOIN membre_role mr ON mr.id_membre = m.id
       JOIN role r ON r.id = mr.id_role AND r.code = 'formateur'
      WHERE m.id = $1 AND m.statut = 'actif'
      FOR UPDATE OF m`,
    [idEnseignant]
  )
  if (!rows[0]) {
    throw new ErreurMetier(400, "Cet enseignant n'existe pas ou n'a pas le rôle formateur.")
  }
}

// Règle métier : une même personne ne peut pas animer deux séances qui se chevauchent.
// Deux créneaux se chevauchent si chacun commence avant la fin de l'autre.
async function verifierChevauchement(client, idEnseignant, dateDebut, dureeMinutes, idSeanceExclue) {
  const { rows } = await client.query(
    `SELECT e.titre AS unite, s.date_debut
       FROM seance s
       JOIN etude e ON e.id = s.id_etude
      WHERE s.id_enseignant = $1
        AND s.id <> COALESCE($4::INT, 0)
        AND s.date_debut < $2::TIMESTAMPTZ + ($3::INT * INTERVAL '1 minute')
        AND $2::TIMESTAMPTZ < s.date_debut + (s.duree_minutes * INTERVAL '1 minute')
      LIMIT 1`,
    [idEnseignant, dateDebut, dureeMinutes, idSeanceExclue]
  )
  if (rows[0]) {
    throw new ErreurMetier(
      409,
      `Chevauchement : cet enseignant anime déjà « ${rows[0].unite} » à cet horaire.`
    )
  }
}

export async function creerSeance(corps) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await verifierUnite(client, corps.id_etude)
    await verifierEnseignant(client, corps.id_enseignant)
    await verifierChevauchement(client, corps.id_enseignant, corps.date_debut, corps.duree_minutes, null)

    const { rows } = await client.query(
      `INSERT INTO seance (id_etude, id_enseignant, date_debut, duree_minutes)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [corps.id_etude, corps.id_enseignant, corps.date_debut, corps.duree_minutes]
    )
    await client.query('COMMIT')
    return trouverSeance(rows[0].id)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// Renvoie la séance modifiée, ou null si elle n'existe pas
export async function modifierSeance(id, corps) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const existante = await client.query('SELECT id FROM seance WHERE id = $1 FOR UPDATE', [id])
    if (!existante.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }
    await verifierUnite(client, corps.id_etude)
    await verifierEnseignant(client, corps.id_enseignant)
    await verifierChevauchement(client, corps.id_enseignant, corps.date_debut, corps.duree_minutes, id)

    await client.query(
      `UPDATE seance SET id_etude = $2, id_enseignant = $3, date_debut = $4, duree_minutes = $5
        WHERE id = $1`,
      [id, corps.id_etude, corps.id_enseignant, corps.date_debut, corps.duree_minutes]
    )
    await client.query('COMMIT')
    return trouverSeance(id)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// Renvoie true si supprimée, false si elle n'existait pas
export async function supprimerSeance(id) {
  const { rowCount } = await pool.query('DELETE FROM seance WHERE id = $1', [id])
  return rowCount > 0
}

export async function listerEnseignants() {
  const { rows } = await pool.query(
    `SELECT m.id, u.nom, u.prenom
       FROM membre m
       JOIN utilisateur u ON u.id = m.id_utilisateur
       JOIN membre_role mr ON mr.id_membre = m.id
       JOIN role r ON r.id = mr.id_role AND r.code = 'formateur'
      WHERE m.statut = 'actif'
      ORDER BY u.nom, u.prenom`
  )
  return rows
}