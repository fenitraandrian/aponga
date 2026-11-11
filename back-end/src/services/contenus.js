import fs from 'fs'
import path from 'path'
import { pool } from '../db.js'
import { ErreurMetier } from './pedagogie.js'

// Dossier de stockage, hors base de données. Il doit être monté en volume Docker.
export const DOSSIER = process.env.UPLOADS_DIR ?? path.resolve('uploads')
fs.mkdirSync(DOSSIER, { recursive: true })

const MO = 1024 * 1024
export const LIMITE_MAX_OCTETS = 500 * MO

export const TYPES_AUTORISES = {
  'application/pdf': { media: 'pdf', extensions: ['.pdf'] },
  'image/jpeg': { media: 'image', extensions: ['.jpg', '.jpeg'] },
  'image/png': { media: 'image', extensions: ['.png'] },
  'audio/mpeg': { media: 'audio', extensions: ['.mp3'] },
  'audio/mp4': { media: 'audio', extensions: ['.m4a'] },
  'audio/x-m4a': { media: 'audio', extensions: ['.m4a'] },
  'video/mp4': { media: 'video', extensions: ['.mp4'] },
}

export const LIMITES_MO = { pdf: 50, image: 20, audio: 100, video: 500 }

// Règle métier : une séance ne se rattache qu'à une unité, pas à une formation
async function verifierUnite(idEtude) {
  const { rows } = await pool.query('SELECT type_etude FROM etude WHERE id = $1', [idEtude])
  if (!rows[0]) throw new ErreurMetier(400, 'Unité introuvable.')
  if (rows[0].type_etude !== 'unite') {
    throw new ErreurMetier(400, 'Un contenu se rattache à une unité, pas à une formation.')
  }
}

// Règle métier : la séance choisie doit appartenir à la même unité
async function verifierSeanceDansUnite(idSeance, idEtude) {
  const { rows } = await pool.query('SELECT id_etude FROM seance WHERE id = $1', [idSeance])
  if (!rows[0]) throw new ErreurMetier(400, 'Séance introuvable.')
  if (Number(rows[0].id_etude) !== Number(idEtude)) {
    throw new ErreurMetier(400, "Cette séance n'appartient pas à cette unité.")
  }
}

// Conteneurs avec leurs fichiers, selon une condition SQL sur l'alias c
async function chargerConteneurs(condition, params) {
  const { rows } = await pool.query(
    `SELECT c.id, c.id_etude, c.id_seance, c.titre, c.description, c.cree_le,
            s.date_debut AS seance_date
       FROM conteneur_contenu c
       LEFT JOIN seance s ON s.id = c.id_seance
      WHERE ${condition}
      ORDER BY c.cree_le, c.id`,
    params
  )
  if (rows.length === 0) return []

  const fichiers = await pool.query(
    `SELECT id, id_conteneur, nom_original, type_media, taille_octets
       FROM fichier
      WHERE id_conteneur = ANY($1::INT[])
      ORDER BY id`,
    [rows.map((r) => r.id)]
  )
  return rows.map((c) => ({
    ...c,
    fichiers: fichiers.rows.filter((f) => f.id_conteneur === c.id),
  }))
}

export function listerContenus(idEtude, idSeance) {
  return chargerConteneurs(
    'c.id_etude = $1 AND ($2::INT IS NULL OR c.id_seance = $2)',
    [idEtude, idSeance ?? null]
  )
}

export async function trouverConteneur(id) {
  const [conteneur] = await chargerConteneurs('c.id = $1', [id])
  return conteneur ?? null
}

export async function creerConteneur(corps, idMembre) {
  await verifierUnite(corps.id_etude)
  if (corps.id_seance != null) await verifierSeanceDansUnite(corps.id_seance, corps.id_etude)

  const { rows } = await pool.query(
    `INSERT INTO conteneur_contenu (id_etude, id_seance, titre, description, cree_par)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [corps.id_etude, corps.id_seance ?? null, corps.titre.trim(), corps.description?.trim() || null, idMembre]
  )
  return trouverConteneur(rows[0].id)
}

// Renvoie le conteneur modifié, ou null s'il n'existe pas. L'unité ne change pas.
export async function modifierConteneur(id, corps) {
  const existant = await pool.query('SELECT id_etude FROM conteneur_contenu WHERE id = $1', [id])
  if (!existant.rows[0]) return null
  if (corps.id_seance != null) {
    await verifierSeanceDansUnite(corps.id_seance, existant.rows[0].id_etude)
  }

  await pool.query(
    'UPDATE conteneur_contenu SET titre = $2, description = $3, id_seance = $4 WHERE id = $1',
    [id, corps.titre.trim(), corps.description?.trim() || null, corps.id_seance ?? null]
  )
  return trouverConteneur(id)
}

export async function supprimerFichierDisque(nomStocke) {
  try {
    await fs.promises.unlink(path.join(DOSSIER, nomStocke))
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}

// Supprime le conteneur, ses fichiers en base (cascade), puis les fichiers sur le disque
export async function supprimerConteneur(id) {
  const fichiers = await pool.query('SELECT nom_stocke FROM fichier WHERE id_conteneur = $1', [id])
  const { rowCount } = await pool.query('DELETE FROM conteneur_contenu WHERE id = $1', [id])
  if (rowCount === 0) return false
  for (const fichier of fichiers.rows) {
    await supprimerFichierDisque(fichier.nom_stocke)
  }
  return true
}

// fichier : objet fourni par multer (originalname, mimetype, size, filename)
export async function ajouterFichier(idConteneur, fichier) {
  const conteneur = await pool.query('SELECT id FROM conteneur_contenu WHERE id = $1', [idConteneur])
  if (!conteneur.rows[0]) throw new ErreurMetier(404, 'Conteneur introuvable.')

  // multer lit le nom d'origine en latin1 : on le remet en UTF-8 pour garder les accents
  const nomOriginal = Buffer.from(fichier.originalname, 'latin1').toString('utf8')
  const extension = path.extname(nomOriginal).toLowerCase()

  const type = TYPES_AUTORISES[fichier.mimetype]
  if (!type || !type.extensions.includes(extension)) {
    throw new ErreurMetier(400, 'Type de fichier non autorisé : PDF, JPG, PNG, MP3, M4A ou MP4.')
  }

  const limite = LIMITES_MO[type.media]
  if (fichier.size > limite * MO) {
    throw new ErreurMetier(400, `Fichier trop volumineux : ${limite} Mo maximum pour ce type.`)
  }

  const { rows } = await pool.query(
    `INSERT INTO fichier (id_conteneur, nom_original, nom_stocke, type_mime, type_media, taille_octets)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nom_original, type_media, taille_octets, cree_le`,
    [idConteneur, nomOriginal, fichier.filename, fichier.mimetype, type.media, fichier.size]
  )
  return rows[0]
}

export async function trouverFichier(id) {
  const { rows } = await pool.query(
    'SELECT nom_original, nom_stocke FROM fichier WHERE id = $1',
    [id]
  )
  return rows[0] ?? null
}

// Renvoie true si supprimé, false s'il n'existait pas
export async function supprimerFichier(id) {
  const { rows } = await pool.query('DELETE FROM fichier WHERE id = $1 RETURNING nom_stocke', [id])
  if (!rows[0]) return false
  await supprimerFichierDisque(rows[0].nom_stocke)
  return true
}