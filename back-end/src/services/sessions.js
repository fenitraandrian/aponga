import crypto from 'crypto'
import { pool } from '../db.js'

export const NOM_COOKIE = 'aponga_session'

export const OPTIONS_COOKIE = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
}

export function genererJeton() {
  return crypto.randomBytes(32).toString('hex')
}

export function empreinte(jeton) {
  return crypto.createHash('sha256').update(jeton).digest('hex')
}

export async function creerSession(idUtilisateur) {
  const jeton = genererJeton()
  await pool.query(
    `INSERT INTO session_utilisateur (id_utilisateur, empreinte_jeton, expire_le)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [idUtilisateur, empreinte(jeton)]
  )
  return jeton
}

export async function trouverUtilisateurParJeton(jeton) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nom, u.prenom, u.email
     FROM session_utilisateur s
     JOIN utilisateur u ON u.id = s.id_utilisateur
     WHERE s.empreinte_jeton = $1
       AND s.revoquee_le IS NULL
       AND s.expire_le > NOW()`,
    [empreinte(jeton)]
  )
  return rows[0] ?? null
}

export async function revoquerSession(jeton) {
  await pool.query(
    `UPDATE session_utilisateur SET revoquee_le = NOW()
     WHERE empreinte_jeton = $1 AND revoquee_le IS NULL`,
    [empreinte(jeton)]
  )
}

export async function revoquerToutesLesSessions(idUtilisateur) {
  await pool.query(
    `UPDATE session_utilisateur SET revoquee_le = NOW()
     WHERE id_utilisateur = $1 AND revoquee_le IS NULL`,
    [idUtilisateur]
  )
}