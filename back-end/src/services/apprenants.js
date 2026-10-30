import { pool } from '../db.js'
import { ErreurMetier } from './pedagogie.js'
// import { genererJeton, empreinte } from './sessions.js'

// Membres ayant le rôle apprenant, avec leur niveau courant
const SELECTION = `
  SELECT m.id AS id_membre, m.statut AS statut_membre,
         u.id AS id_utilisateur, u.nom, u.prenom, u.email, u.telephone,
         u.date_naissance, u.statut AS statut_utilisateur,
         n.id AS id_niveau, n.nom AS niveau
    FROM membre m
    JOIN utilisateur u ON u.id = m.id_utilisateur
    JOIN membre_role mr ON mr.id_membre = m.id
    JOIN role r ON r.id = mr.id_role AND r.code = 'apprenant'
    LEFT JOIN affectation_niveau a ON a.id_membre = m.id AND a.date_fin IS NULL
    LEFT JOIN niveau n ON n.id = a.id_niveau`

export async function listerApprenants(q) {
  const recherche = typeof q === 'string' && q.trim() ? `%${q.trim()}%` : null
  const { rows } = await pool.query(
    `${SELECTION}
     WHERE ($1::TEXT IS NULL OR u.nom ILIKE $1 OR u.prenom ILIKE $1 OR u.email ILIKE $1)
     ORDER BY u.nom, u.prenom`,
    [recherche]
  )
  return rows
}

// Renvoie { apprenant, historique }, ou null si ce membre n'est pas un apprenant
export async function trouverApprenant(idMembre, client = pool) {
  const { rows } = await client.query(`${SELECTION} WHERE m.id = $1`, [idMembre])
  if (!rows[0]) return null

  const historique = await client.query(
    `SELECT a.id, n.nom AS niveau, a.date_debut, a.date_fin
       FROM affectation_niveau a
       JOIN niveau n ON n.id = a.id_niveau
      WHERE a.id_membre = $1
      ORDER BY a.date_debut DESC, a.id DESC`,
    [idMembre]
  )
  return { apprenant: rows[0], historique: historique.rows }
}

// Crée utilisateur, membre et rôle apprenant en une seule opération.
// Pas de mot de passe : l'apprenant le définira par « mot de passe oublié ».
// MODIFICATION : début (invitation : lien valable 7 jours, sans email)
// Crée utilisateur, membre, rôle apprenant et lien d'invitation en une seule opération.
// export async function creerApprenant(corps, idAdmin) {
//   const client = await pool.connect()
//   const jeton = genererJeton()
//   try {
//     await client.query('BEGIN')

//     const utilisateur = await client.query(
//       `INSERT INTO utilisateur (nom, prenom, email, telephone, date_naissance)
//        VALUES ($1, $2, $3, $4, $5)
//        RETURNING id`,
//       [
//         corps.nom.trim(),
//         corps.prenom.trim(),
//         corps.email?.trim().toLowerCase() || null,
//         corps.telephone?.trim() || null,
//         corps.date_naissance || null,
//       ]
//     )
//     const idUtilisateur = utilisateur.rows[0].id

//     const membre = await client.query(
//       'INSERT INTO membre (id_utilisateur) VALUES ($1) RETURNING id',
//       [idUtilisateur]
//     )

//     await client.query(
//       `INSERT INTO membre_role (id_membre, id_role, attribue_par)
//        VALUES ($1, (SELECT id FROM role WHERE code = 'apprenant'), $2)`,
//       [membre.rows[0].id, idAdmin]
//     )

//     await client.query(
//       `INSERT INTO reinitialisation_mot_de_passe (id_utilisateur, empreinte_jeton, expire_le)
//        VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
//       [idUtilisateur, empreinte(jeton)]
//     )

//     await client.query('COMMIT')

//     const apprenant = await trouverApprenant(membre.rows[0].id)
//     const origine = process.env.FRONT_URL ?? 'http://localhost:5173'
//     return { ...apprenant, lienInvitation: `${origine}/reinitialiser?jeton=${jeton}` }
//   } catch (err) {
//     await client.query('ROLLBACK')
//     throw err
//   } finally {
//     client.release()
//   }
// }
// // MODIFICATION : fin

// Renvoie l'apprenant modifié, ou null si ce membre n'est pas un apprenant
export async function modifierApprenant(idMembre, corps) {
  const existant = await trouverApprenant(idMembre)
  if (!existant) return null

  await pool.query(
    `UPDATE utilisateur SET
       nom = COALESCE($2::VARCHAR, nom),
       prenom = COALESCE($3::VARCHAR, prenom),
       email = COALESCE($4::VARCHAR, email),
       telephone = COALESCE($5::VARCHAR, telephone),
       date_naissance = COALESCE($6::DATE, date_naissance)
     WHERE id = $1`,
    [
      existant.apprenant.id_utilisateur,
      corps.nom?.trim() || null,
      corps.prenom?.trim() || null,
      corps.email?.trim() || null,
      corps.telephone?.trim() || null,
      corps.date_naissance || null,
    ]
  )
  return trouverApprenant(idMembre)
}

// Affecte un niveau. Clôture l'affectation active (date_fin = aujourd'hui) puis en ouvre une nouvelle.
// idNiveau à null : clôture seulement l'affectation active.
export async function affecterNiveau(idMembre, idNiveau) {
  if (!(await trouverApprenant(idMembre))) return null

  if (idNiveau !== null) {
    const niveau = await pool.query('SELECT 1 FROM niveau WHERE id = $1', [idNiveau])
    if (!niveau.rows[0]) throw new ErreurMetier(400, 'Le niveau indiqué est introuvable.')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const actuelle = await client.query(
      'SELECT id, id_niveau FROM affectation_niveau WHERE id_membre = $1 AND date_fin IS NULL FOR UPDATE',
      [idMembre]
    )
    const active = actuelle.rows[0]

    if (active && active.id_niveau === idNiveau) {
      throw new ErreurMetier(400, 'Cet apprenant est déjà dans ce niveau.')
    }
    if (active) {
      await client.query('UPDATE affectation_niveau SET date_fin = CURRENT_DATE WHERE id = $1', [active.id])
    }
    if (idNiveau !== null) {
      await client.query(
        'INSERT INTO affectation_niveau (id_membre, id_niveau) VALUES ($1, $2)',
        [idMembre, idNiveau]
      )
    }

    await client.query('COMMIT')
    return trouverApprenant(idMembre)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// MODIFICATION : début (suspension : bloque la connexion et ferme les sessions ouvertes)
// Renvoie { apprenant, historique }, ou null si ce membre n'est pas un apprenant
export async function changerStatutApprenant(idMembre, statut) {
  const existant = await trouverApprenant(idMembre)
  if (!existant) return null

  if (existant.apprenant.statut_utilisateur === 'anonymise') {
    throw new ErreurMetier(409, 'Ce compte a été anonymisé : son statut ne peut plus être modifié.')
  }

  const idUtilisateur = existant.apprenant.id_utilisateur
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('UPDATE utilisateur SET statut = $2 WHERE id = $1', [idUtilisateur, statut])
    if (statut === 'suspendu') {
      await client.query(
        'UPDATE session_utilisateur SET revoquee_le = NOW() WHERE id_utilisateur = $1 AND revoquee_le IS NULL',
        [idUtilisateur]
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
  return trouverApprenant(idMembre)
}
// MODIFICATION : fin