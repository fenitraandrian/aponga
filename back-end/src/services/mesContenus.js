import { pool } from '../db.js'
import { categorieDe, reglesParType } from './reglesTelechargement.js'

// Contenus d'une séance pour un apprenant inscrit à cette séance, une fois la séance commencée.
export async function listerMesContenus(idMembre, idSeance) {
  const acces = await pool.query(
    `SELECT 1
       FROM inscription_seance i
       JOIN seance s ON s.id = i.id_seance
      WHERE i.id_membre = $1 AND s.id = $2 AND s.date_debut <= NOW()`,
    [idMembre, idSeance]
  )
  if (!acces.rows[0]) return null

  const { rows } = await pool.query(
    `SELECT c.id, c.titre, c.description, c.id_seance,
            COALESCE(json_agg(f ORDER BY f.id) FILTER (WHERE f.id IS NOT NULL), '[]'::json) AS fichiers
       FROM conteneur_contenu c
       LEFT JOIN fichier f ON f.id_conteneur = c.id
      WHERE c.id_seance = $1
         OR (c.id_seance IS NULL AND c.id_etude = (SELECT id_etude FROM seance WHERE id = $1))
      GROUP BY c.id
      ORDER BY c.id`,
    [idSeance]
  )

  // Pour chaque fichier : son type, et si l'apprenant peut le télécharger.
  // Le nom de stockage n'est pas renvoyé au navigateur.
  const regles = await reglesParType()
  return rows.map((c) => ({
    ...c,
    fichiers: c.fichiers.map((f) => {
      const { nom_stocke: _nomStocke, ...reste } = f
      const categorie = categorieDe(f.nom_stocke)
      return { ...reste, categorie, telechargeable: regles[categorie] === true }
    }),
  }))
}

// Un fichier est accessible si l'apprenant est inscrit à une séance commencée
// dont un contenu visible contient ce fichier.
export async function peutAccederFichier(idMembre, idFichier) {
  const { rows } = await pool.query(
    `SELECT 1
       FROM fichier f
       JOIN conteneur_contenu c ON c.id = f.id_conteneur
      WHERE f.id = $2
        AND EXISTS (
          SELECT 1
            FROM inscription_seance i
            JOIN seance s ON s.id = i.id_seance
           WHERE i.id_membre = $1
             AND s.date_debut <= NOW()
             AND (c.id_seance = s.id OR (c.id_seance IS NULL AND c.id_etude = s.id_etude))
        )`,
    [idMembre, idFichier]
  )
  return !!rows[0]
}