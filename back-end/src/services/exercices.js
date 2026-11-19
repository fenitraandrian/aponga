import { pool } from '../db.js'
import { ErreurMetier } from './pedagogie.js'
import { permissionsDeLUtilisateur } from './permissions.js'

// Liste des fichiers d'un dépôt (alias de la table : d)
const SQL_FICHIERS = `COALESCE((
  SELECT json_agg(json_build_object('id', f.id, 'nom', f.nom_original, 'taille', f.taille) ORDER BY f.id)
    FROM depot_fichier f
   WHERE f.id_depot = d.id
), '[]'::json)`

async function membreDe(idUtilisateur, client = pool) {
  const { rows } = await client.query('SELECT id FROM membre WHERE id_utilisateur = $1', [idUtilisateur])
  if (!rows[0]) throw new ErreurMetier(403, 'Ce compte n\'est pas rattaché à un membre.')
  return rows[0].id
}

async function seanceDeEnseignant(idSeance, idMembre, client = pool) {
  const { rows } = await client.query('SELECT id, id_enseignant FROM seance WHERE id = $1', [idSeance])
  if (!rows[0]) throw new ErreurMetier(404, 'Séance introuvable.')
  if (rows[0].id_enseignant !== idMembre) {
    throw new ErreurMetier(403, 'Seul l\'enseignant de cette séance peut faire cette action.')
  }
  return rows[0]
}

// Convertit la note (NUMERIC, renvoyée en texte par pg) en nombre
function noteEnNombre(ligne) {
  return { ...ligne, note: ligne.note === null ? null : Number(ligne.note) }
}

// ---------- T15 : consignes et dépôts ----------

export async function creerConsigne(idSeance, idUtilisateur, { titre, description, date_limite }) {
  const idMembre = await membreDe(idUtilisateur)
  await seanceDeEnseignant(idSeance, idMembre)

  const { rows } = await pool.query(
    `INSERT INTO consigne (id_seance, titre, description, date_limite)
     VALUES ($1, $2, $3, $4)
     RETURNING id, id_seance, titre, description, date_limite`,
    [idSeance, titre, description ?? null, date_limite ?? null]
  )
  return rows[0]
}

// Enseignant de la séance, ou apprenant inscrit
export async function listerConsignes(idSeance, idUtilisateur) {
  const idMembre = await membreDe(idUtilisateur)

  const seance = await pool.query('SELECT id_enseignant FROM seance WHERE id = $1', [idSeance])
  if (!seance.rows[0]) throw new ErreurMetier(404, 'Séance introuvable.')

  if (seance.rows[0].id_enseignant !== idMembre) {
    const inscrit = await pool.query(
      'SELECT 1 FROM inscription_seance WHERE id_seance = $1 AND id_membre = $2',
      [idSeance, idMembre]
    )
    if (!inscrit.rows[0]) {
      const permissions = await permissionsDeLUtilisateur(idUtilisateur)
      if (permissions.includes('exercices.soumettre')) {
        throw new ErreurMetier(403, 'Vous n\'êtes pas inscrit à cette séance.')
      }
      throw new ErreurMetier(403, 'Seul le formateur de cette séance peut consulter ses exercices.')
    }
  }

  const { rows } = await pool.query(
    `SELECT id, titre, description, date_limite
       FROM consigne
      WHERE id_seance = $1
      ORDER BY id`,
    [idSeance]
  )
  return rows
}

export async function soumettreDepot(idConsigne, idUtilisateur, fichiers) {
  if (!fichiers.length) throw new ErreurMetier(400, 'Ajoutez au moins un fichier.')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const idMembre = await membreDe(idUtilisateur, client)

    // Verrou sur la consigne : deux dépôts simultanés ne peuvent pas prendre le même numéro
    const { rows: [consigne] } = await client.query(
      'SELECT id, id_seance, date_limite FROM consigne WHERE id = $1 FOR UPDATE',
      [idConsigne]
    )
    if (!consigne) throw new ErreurMetier(404, 'Exercice introuvable.')

    const inscrit = await client.query(
      'SELECT 1 FROM inscription_seance WHERE id_seance = $1 AND id_membre = $2',
      [consigne.id_seance, idMembre]
    )
    if (!inscrit.rows[0]) throw new ErreurMetier(403, 'Vous n\'êtes pas inscrit à la séance de cet exercice.')

    if (consigne.date_limite && new Date(consigne.date_limite) < new Date()) {
      throw new ErreurMetier(409, 'La date limite de cet exercice est dépassée.')
    }

    const { rows: [dernier] } = await client.query(
      `SELECT numero_version, statut
         FROM depot
        WHERE id_consigne = $1 AND id_membre = $2
        ORDER BY numero_version DESC
        LIMIT 1`,
      [idConsigne, idMembre]
    )
    if (dernier && dernier.statut !== 'rejete') {
      throw new ErreurMetier(409, 'Un dépôt est déjà en attente de correction ou validé.')
    }

    const numero = dernier ? dernier.numero_version + 1 : 1

    const { rows: [depot] } = await client.query(
      'INSERT INTO depot (id_consigne, id_membre, numero_version) VALUES ($1, $2, $3) RETURNING id',
      [idConsigne, idMembre, numero]
    )

    for (const f of fichiers) {
      await client.query(
        `INSERT INTO depot_fichier (id_depot, nom_original, chemin, type_mime, taille)
         VALUES ($1, $2, $3, $4, $5)`,
        [depot.id, f.originalname, f.path, f.mimetype, f.size]
      )
    }

    await client.query('COMMIT')
    return { id: depot.id, numero_version: numero, statut: 'soumis' }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ---------- T16 : historique de l'apprenant, groupé par niveau ----------

export async function mesDepots(idUtilisateur, { niveau = null, statut = null } = {}) {
  const idMembre = await membreDe(idUtilisateur)

  // Le statut et le niveau filtrent les exercices, d'après leur dernière version
  const { rows } = await pool.query(
    `WITH derniers AS (
       SELECT DISTINCT ON (id_consigne) id_consigne, numero_version, statut
         FROM depot
        WHERE id_membre = $1
        ORDER BY id_consigne, numero_version DESC
     )
     SELECT d.id, d.numero_version, d.statut, d.depose_le, d.note, d.commentaire, d.valide_le,
            (d.numero_version = dn.numero_version) AS est_derniere,
            c.id AS id_consigne, c.titre AS consigne_titre,
            s.id AS id_seance, s.date_debut AS seance_date,
            isn.id_niveau, n.nom AS niveau_nom, n.ordre AS niveau_ordre,
            ${SQL_FICHIERS} AS fichiers
       FROM depot d
       JOIN derniers dn ON dn.id_consigne = d.id_consigne
       JOIN consigne c ON c.id = d.id_consigne
       JOIN seance s ON s.id = c.id_seance
       LEFT JOIN inscription_seance isn ON isn.id_seance = s.id AND isn.id_membre = d.id_membre
       LEFT JOIN niveau n ON n.id = isn.id_niveau
      WHERE d.id_membre = $1
        AND ($2::text IS NULL OR dn.statut = $2)
        AND ($3::int IS NULL OR isn.id_niveau = $3)
      ORDER BY n.ordre NULLS LAST, d.id_consigne, d.numero_version DESC`,
    [idMembre, statut, niveau]
  )

  const groupes = new Map()
  for (const ligne of rows.map(noteEnNombre)) {
    const cle = ligne.id_niveau ?? 0
    if (!groupes.has(cle)) {
      groupes.set(cle, {
        id_niveau: ligne.id_niveau,
        nom: ligne.niveau_nom ?? 'Sans niveau',
        depots: [],
      })
    }
    groupes.get(cle).depots.push(ligne)
  }
  return [...groupes.values()]
}

// ---------- T17 : validation par l'enseignant ----------

export async function depotsDeMesSeances(idUtilisateur, statut = 'soumis') {
  const idMembre = await membreDe(idUtilisateur)

  const { rows } = await pool.query(
    `SELECT d.id, d.numero_version, d.statut, d.depose_le, d.note, d.commentaire,
            c.id AS id_consigne, c.titre AS consigne_titre,
            s.id AS id_seance, s.date_debut AS seance_date,
            m.id AS id_membre, u.prenom, u.nom,
            ${SQL_FICHIERS} AS fichiers
       FROM depot d
       JOIN consigne c ON c.id = d.id_consigne
       JOIN seance s ON s.id = c.id_seance
       JOIN membre m ON m.id = d.id_membre
       JOIN utilisateur u ON u.id = m.id_utilisateur
      WHERE s.id_enseignant = $1 AND d.statut = $2
      ORDER BY d.depose_le`,
    [idMembre, statut]
  )
  return rows.map(noteEnNombre)
}

export async function validerDepot(idDepot, idUtilisateur, { decision, note = null, commentaire = null }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const idMembre = await membreDe(idUtilisateur, client)

    const { rows: [depot] } = await client.query(
      `SELECT d.id, d.statut, s.id_enseignant
         FROM depot d
         JOIN consigne c ON c.id = d.id_consigne
         JOIN seance s ON s.id = c.id_seance
        WHERE d.id = $1
        FOR UPDATE OF d`,
      [idDepot]
    )
    if (!depot) throw new ErreurMetier(404, 'Dépôt introuvable.')
    if (depot.id_enseignant !== idMembre) {
      throw new ErreurMetier(403, 'Seul l\'enseignant de cette séance peut valider ce dépôt.')
    }
    if (depot.statut !== 'soumis') throw new ErreurMetier(409, 'Ce dépôt a déjà été corrigé.')

    const nouveauStatut = decision === 'valider' ? 'valide' : 'rejete'

    const { rows: [maj] } = await client.query(
      `UPDATE depot
          SET statut = $2, note = $3, commentaire = $4, valide_par = $5, valide_le = NOW()
        WHERE id = $1
    RETURNING id, statut, note, commentaire, valide_le`,
      [idDepot, nouveauStatut, note, commentaire, idMembre]
    )

    await client.query('COMMIT')
    return noteEnNombre(maj)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ---------- Téléchargement d'un fichier de dépôt ----------

// Autorisé : l'apprenant qui a déposé, et l'enseignant de la séance
export async function fichierPourTelechargement(idFichier, idUtilisateur) {
  const idMembre = await membreDe(idUtilisateur)

  const { rows: [f] } = await pool.query(
    `SELECT f.nom_original, f.chemin, d.id_membre, s.id_enseignant
       FROM depot_fichier f
       JOIN depot d ON d.id = f.id_depot
       JOIN consigne c ON c.id = d.id_consigne
       JOIN seance s ON s.id = c.id_seance
      WHERE f.id = $1`,
    [idFichier]
  )
  if (!f) throw new ErreurMetier(404, 'Fichier introuvable.')
  if (f.id_membre !== idMembre && f.id_enseignant !== idMembre) {
    throw new ErreurMetier(403, 'Accès refusé.')
  }
  return { nom: f.nom_original, chemin: f.chemin }
}