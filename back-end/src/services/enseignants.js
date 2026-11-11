import { pool } from '../db.js'
import { ErreurMetier } from './pedagogie.js'

// Membres ayant le rôle formateur
const SELECTION = `
  SELECT m.id AS id_membre, m.statut AS statut_membre,
         u.id AS id_utilisateur, u.nom, u.prenom, u.email, u.telephone,
         u.statut AS statut_utilisateur
    FROM membre m
    JOIN utilisateur u ON u.id = m.id_utilisateur
    JOIN membre_role mr ON mr.id_membre = m.id
    JOIN role r ON r.id = mr.id_role AND r.code = 'formateur'`

export async function listerEnseignants() {
  const { rows } = await pool.query(`${SELECTION} ORDER BY u.nom, u.prenom`)
  return rows
}

// Renvoie { enseignant, affectations }, ou null si ce membre n'est pas formateur
export async function trouverEnseignant(idMembre) {
  const { rows } = await pool.query(`${SELECTION} WHERE m.id = $1`, [idMembre])
  if (!rows[0]) return null

  const affectations = await pool.query(
    `SELECT e.id, e.titre, a.date_debut
       FROM affectation_enseignant a
       JOIN etude e ON e.id = a.id_etude
      WHERE a.id_membre = $1 AND a.date_fin IS NULL
      ORDER BY e.titre`,
    [idMembre]
  )
  return { enseignant: rows[0], affectations: affectations.rows }
}

export async function modifierEnseignant(idMembre, corps) {
  const existant = await trouverEnseignant(idMembre)
  if (!existant) return null

  await pool.query(
    `UPDATE utilisateur SET
       nom = COALESCE($2::VARCHAR, nom),
       prenom = COALESCE($3::VARCHAR, prenom),
       email = COALESCE($4::VARCHAR, email),
       telephone = COALESCE($5::VARCHAR, telephone)
     WHERE id = $1`,
    [
      existant.enseignant.id_utilisateur,
      corps.nom?.trim() || null,
      corps.prenom?.trim() || null,
      corps.email?.trim().toLowerCase() || null,
      corps.telephone?.trim() || null,
    ]
  )
  return trouverEnseignant(idMembre)
}

// Règle métier : on n'affecte un enseignant qu'à une unité
export async function affecterEnseignant(idMembre, idEtude) {
  if (!(await trouverEnseignant(idMembre))) return null

  const etude = await pool.query('SELECT type_etude FROM etude WHERE id = $1', [idEtude])
  if (!etude.rows[0]) throw new ErreurMetier(400, 'Unité introuvable.')
  if (etude.rows[0].type_etude !== 'unite') {
    throw new ErreurMetier(400, 'Un enseignant s\'affecte à une unité, pas à une formation.')
  }

  await pool.query(
    'INSERT INTO affectation_enseignant (id_membre, id_etude) VALUES ($1, $2)',
    [idMembre, idEtude]
  )
  return trouverEnseignant(idMembre)
}

// Règle métier : on ne retire pas un enseignant d'une unité s'il a encore des séances à venir
export async function retirerEnseignant(idMembre, idEtude) {
  if (!(await trouverEnseignant(idMembre))) return null

  const aVenir = await pool.query(
    'SELECT 1 FROM seance WHERE id_enseignant = $1 AND id_etude = $2 AND date_debut > NOW() LIMIT 1',
    [idMembre, idEtude]
  )
  if (aVenir.rows[0]) {
    throw new ErreurMetier(409, 'Cet enseignant a encore des séances à venir dans cette unité.')
  }

  const { rowCount } = await pool.query(
    `UPDATE affectation_enseignant SET date_fin = CURRENT_DATE
      WHERE id_membre = $1 AND id_etude = $2 AND date_fin IS NULL`,
    [idMembre, idEtude]
  )
  if (rowCount === 0) throw new ErreurMetier(404, 'Cet enseignant n\'est pas affecté à cette unité.')
  return trouverEnseignant(idMembre)
}