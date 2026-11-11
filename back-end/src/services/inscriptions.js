import { pool } from '../db.js'
import { ErreurMetier } from './pedagogie.js'

const SELECTION_INSCRITS = `
  SELECT i.id, i.id_membre, i.date_inscription, i.inscrit_par,
         u.nom, u.prenom, u.email
    FROM inscription_seance i
    JOIN membre m ON m.id = i.id_membre
    JOIN utilisateur u ON u.id = m.id_utilisateur`

// Renvoie { capacite, inscrits }, ou null si la séance n'existe pas
export async function listerInscrits(idSeance) {
  const seance = await pool.query('SELECT id, capacite FROM seance WHERE id = $1', [idSeance])
  if (!seance.rows[0]) return null

  const { rows } = await pool.query(
    `${SELECTION_INSCRITS} WHERE i.id_seance = $1 ORDER BY u.nom, u.prenom`,
    [idSeance]
  )
  return { capacite: seance.rows[0].capacite, inscrits: rows }
}

// Niveau actuel d'un apprenant (affectation active), ou null
async function niveauActuel(executant, idMembre) {
  const { rows } = await executant.query(
    'SELECT id_niveau FROM affectation_niveau WHERE id_membre = $1 AND date_fin IS NULL',
    [idMembre]
  )
  return rows[0]?.id_niveau ?? null
}

export async function inscrire(idSeance, idMembre, idAuteur) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Verrou sur la séance : places et inscriptions restent cohérentes
    const seance = await client.query(
      `SELECT id, id_etude, capacite, (date_debut > NOW()) AS a_venir
         FROM seance WHERE id = $1 FOR UPDATE`,
      [idSeance]
    )
    if (!seance.rows[0]) throw new ErreurMetier(404, 'Séance introuvable.')
    const { id_etude: idEtude, capacite, a_venir: aVenir } = seance.rows[0]
    if (!aVenir) throw new ErreurMetier(409, 'Cette séance a déjà commencé.')

    // L'inscrit doit être un apprenant actif. Verrou sur le membre : pas de double inscription simultanée.
    const apprenant = await client.query(
      `SELECT m.id
         FROM membre m
         JOIN utilisateur u ON u.id = m.id_utilisateur
         JOIN membre_role mr ON mr.id_membre = m.id
         JOIN role r ON r.id = mr.id_role AND r.code = 'apprenant'
        WHERE m.id = $1 AND u.statut = 'actif'
        FOR UPDATE OF m`,
      [idMembre]
    )
    if (!apprenant.rows[0]) {
      throw new ErreurMetier(400, "Cet apprenant n'existe pas ou son compte est suspendu.")
    }

    // Règle de niveau : l'apprenant doit être au niveau de l'unité
    const niveauUnite = (
      await client.query('SELECT id_niveau FROM etude WHERE id = $1', [idEtude])
    ).rows[0]?.id_niveau
    const niveauApprenant = await niveauActuel(client, idMembre)
    if (niveauApprenant === null || niveauApprenant !== niveauUnite) {
      throw new ErreurMetier(400, "Cet apprenant n'est pas au niveau de cette unité.")
    }

    // Pas de chevauchement avec une autre séance de cet apprenant
    const chevauche = await client.query(
      `SELECT 1
         FROM inscription_seance i
         JOIN seance s ON s.id = i.id_seance
         JOIN seance cible ON cible.id = $2
        WHERE i.id_membre = $1
          AND s.id <> cible.id
          AND s.date_debut < cible.date_debut + (cible.duree_minutes * INTERVAL '1 minute')
          AND cible.date_debut < s.date_debut + (s.duree_minutes * INTERVAL '1 minute')
        LIMIT 1`,
      [idMembre, idSeance]
    )
    if (chevauche.rows[0]) {
      throw new ErreurMetier(409, 'Cet apprenant est déjà inscrit à une séance qui se chevauche.')
    }

    // Places (vide = pas de limite)
    if (capacite !== null) {
      const { rows } = await client.query(
        'SELECT COUNT(*)::int AS n FROM inscription_seance WHERE id_seance = $1',
        [idSeance]
      )
      if (rows[0].n >= capacite) throw new ErreurMetier(409, 'Cette séance est complète.')
    }

    // Solde : une inscription consomme une séance du solde du niveau
    const solde = await client.query(
      `UPDATE solde_seance SET nombre = nombre - 1
        WHERE id_membre = $1 AND id_niveau = $2 AND nombre > 0`,
      [idMembre, niveauUnite]
    )
    if (solde.rowCount === 0) {
      throw new ErreurMetier(409, 'Solde de séances insuffisant pour ce niveau.')
    }

    await client.query(
      'INSERT INTO inscription_seance (id_seance, id_membre, inscrit_par, id_niveau) VALUES ($1, $2, $3, $4)',
      [idSeance, idMembre, idAuteur, niveauUnite]
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return listerInscrits(idSeance)
}

// Désinscription possible seulement avant le début, et rend une séance au solde
export async function desinscrire(idSeance, idMembre) {
  const seance = await pool.query(
    'SELECT (date_debut > NOW()) AS a_venir FROM seance WHERE id = $1',
    [idSeance]
  )
  if (!seance.rows[0]) throw new ErreurMetier(404, 'Séance introuvable.')
  if (!seance.rows[0].a_venir) {
    throw new ErreurMetier(409, 'La séance a déjà commencé : désinscription impossible.')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const existe = await client.query(
      'SELECT 1 FROM inscription_seance WHERE id_seance = $1 AND id_membre = $2',
      [idSeance, idMembre]
    )
    if (!existe.rows[0]) throw new ErreurMetier(404, "Cet apprenant n'est pas inscrit à cette séance.")

    await client.query(
      `WITH supprime AS (
         DELETE FROM inscription_seance WHERE id_seance = $1 AND id_membre = $2
         RETURNING id_niveau
       )
       INSERT INTO solde_seance (id_membre, id_niveau, nombre)
       SELECT $2::INTEGER, id_niveau, 1 FROM supprime WHERE id_niveau IS NOT NULL
       ON CONFLICT (id_membre, id_niveau) DO UPDATE SET nombre = solde_seance.nombre + 1`,
      [idSeance, idMembre]
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return listerInscrits(idSeance)
}

// Séances à venir du niveau actuel de l'apprenant, avec places et solde
export async function listerSeancesDisponibles(idMembre) {
  const niveau = await niveauActuel(pool, idMembre)
  if (niveau === null) return { niveau: null, solde: 0, seances: [] }

  const solde = await pool.query(
    'SELECT nombre FROM solde_seance WHERE id_membre = $1 AND id_niveau = $2',
    [idMembre, niveau]
  )
  const seances = await pool.query(
    `SELECT s.id, s.date_debut, s.duree_minutes, s.capacite, e.titre AS titre_unite,
            (SELECT COUNT(*)::int FROM inscription_seance i WHERE i.id_seance = s.id) AS inscrits,
            EXISTS (
              SELECT 1 FROM inscription_seance i WHERE i.id_seance = s.id AND i.id_membre = $1
            ) AS deja_inscrit
       FROM seance s
       JOIN etude e ON e.id = s.id_etude
      WHERE e.id_niveau = $2 AND s.date_debut > NOW()
      ORDER BY s.date_debut`,
    [idMembre, niveau]
  )
  return { niveau, solde: solde.rows[0]?.nombre ?? 0, seances: seances.rows }
}

// Toutes les inscriptions d'un apprenant
export async function listerMesInscriptions(idMembre) {
  const { rows } = await pool.query(
    `SELECT s.id, s.date_debut, s.duree_minutes, e.titre AS titre_unite, i.date_inscription
       FROM inscription_seance i
       JOIN seance s ON s.id = i.id_seance
       JOIN etude e ON e.id = s.id_etude
      WHERE i.id_membre = $1
      ORDER BY s.date_debut`,
    [idMembre]
  )
  return rows
}