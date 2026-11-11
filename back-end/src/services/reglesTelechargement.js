import path from 'node:path'
import { pool } from '../db.js'
import { ErreurMetier } from './pedagogie.js'

// Extension du fichier stocké -> type de document
const CATEGORIES = {
  pdf: 'pdf',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  mp3: 'audio',
  m4a: 'audio',
  mp4: 'video',
}

export function categorieDe(nomStocke) {
  const extension = path.extname(nomStocke).slice(1).toLowerCase()
  return CATEGORIES[extension] ?? 'autre'
}

export async function listerRegles() {
  const { rows } = await pool.query(
    'SELECT type_fichier, telechargeable FROM regle_telechargement ORDER BY type_fichier'
  )
  return rows
}

// Objet du type { pdf: true, audio: false, ... }
export async function reglesParType() {
  const rows = await listerRegles()
  return Object.fromEntries(rows.map((r) => [r.type_fichier, r.telechargeable]))
}

export async function modifierRegle(typeFichier, telechargeable) {
  const { rowCount } = await pool.query(
    'UPDATE regle_telechargement SET telechargeable = $2 WHERE type_fichier = $1',
    [typeFichier, telechargeable]
  )
  if (rowCount === 0) throw new ErreurMetier(404, 'Type de document inconnu.')
  return listerRegles()
}

// Vrai seulement si une règle existe pour ce type et autorise le téléchargement
export async function telechargementAutorise(nomStocke) {
  const regles = await reglesParType()
  return regles[categorieDe(nomStocke)] === true
}