import { pool } from '../db.js'
import { ErreurMetier } from './pedagogie.js'

export async function listerParcours() {
  const { rows } = await pool.query(
    'SELECT code, libelle, position_depart FROM essai_parcours ORDER BY position_depart'
  )
  return rows
}

// Unités du parcours, avec cours et quiz. Les bonnes réponses ne sont jamais renvoyées.
export async function unitesDuParcours(code) {
  const parcours = await pool.query(
    'SELECT code, libelle, position_depart FROM essai_parcours WHERE code = $1',
    [code]
  )
  if (!parcours.rows[0]) return null

  const unites = await pool.query(
    'SELECT id, position, titre, objectifs FROM essai_unite WHERE position >= $1 ORDER BY position',
    [parcours.rows[0].position_depart]
  )
  if (!unites.rows.length) return { parcours: parcours.rows[0], unites: [] }

  const ids = unites.rows.map((u) => u.id)

  const sections = await pool.query(
    'SELECT id, id_unite, titre, contenu FROM essai_section WHERE id_unite = ANY($1::int[]) ORDER BY id_unite, position',
    [ids]
  )
  const questions = await pool.query(
    'SELECT id, id_unite, enonce FROM essai_question WHERE id_unite = ANY($1::int[]) ORDER BY id_unite, position',
    [ids]
  )
  const choix = await pool.query(
    `SELECT c.id, c.id_question, c.texte
       FROM essai_choix c
       JOIN essai_question q ON q.id = c.id_question
      WHERE q.id_unite = ANY($1::int[])
      ORDER BY c.id_question, c.position`,
    [ids]
  )

  return {
    parcours: parcours.rows[0],
    unites: unites.rows.map((u) => ({
      ...u,
      sections: sections.rows
        .filter((s) => s.id_unite === u.id)
        .map(({ id, titre, contenu }) => ({ id, titre, contenu })),
      questions: questions.rows
        .filter((q) => q.id_unite === u.id)
        .map((q) => ({
          id: q.id,
          enonce: q.enonce,
          choix: choix.rows
            .filter((c) => c.id_question === q.id)
            .map((c) => ({ id: c.id, texte: c.texte })),
        })),
    })),
  }
}

// reponses : [{ id_question, id_choix }]. Renvoie le score et la correction.
export async function corrigerQuiz(idUnite, reponses) {
  const lignes = await pool.query(
    `SELECT q.id AS id_question, c.id AS id_choix, c.est_bonne
       FROM essai_question q
       JOIN essai_choix c ON c.id_question = q.id
      WHERE q.id_unite = $1`,
    [idUnite]
  )
  if (!lignes.rows.length) throw new ErreurMetier(404, 'Quiz introuvable.')

  const valides = new Set(lignes.rows.map((l) => `${l.id_question}:${l.id_choix}`))
  for (const r of reponses) {
    if (!valides.has(`${r.id_question}:${r.id_choix}`)) {
      throw new ErreurMetier(400, 'Une réponse ne correspond pas à cette question.')
    }
  }

  const bonnes = new Map()
  for (const l of lignes.rows) {
    if (l.est_bonne) bonnes.set(l.id_question, l.id_choix)
  }
  const choisies = new Map(reponses.map((r) => [r.id_question, r.id_choix]))

  let score = 0
  const corrections = [...bonnes.entries()].map(([idQuestion, idBonne]) => {
    const ok = choisies.get(idQuestion) === idBonne
    if (ok) score++
    return { id_question: idQuestion, ok, id_bonne_reponse: idBonne }
  })

  return { score, total: bonnes.size, corrections }
}