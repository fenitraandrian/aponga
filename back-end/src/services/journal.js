import { pool } from '../db.js'

// Écrit une ligne dans le journal
export async function enregistrerAction({ idUtilisateur, methode, route, statut, details, ip }) {
  const entite = route.split('/')[2] ?? 'inconnu'
  await pool.query(
    `INSERT INTO journal_activite (id_utilisateur, methode, route, entite, statut, details, adresse_ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [idUtilisateur, methode, route, entite, statut, JSON.stringify(details ?? {}), ip ?? null]
  )
}

// Liste paginée, avec filtres
export async function listerJournal({ du, au, methode, entite, utilisateur, page = 1, taille = 20 }) {
  const texte = utilisateur ? `%${utilisateur}%` : null
  const { rows } = await pool.query(
    `SELECT j.id, j.cree_le, j.methode, j.route, j.entite, j.statut, j.details, j.adresse_ip,
            u.prenom, u.nom, u.email,
            COUNT(*) OVER() AS total
       FROM journal_activite j
       LEFT JOIN utilisateur u ON u.id = j.id_utilisateur
      WHERE ($1::timestamptz IS NULL OR j.cree_le >= $1::timestamptz)
        AND ($2::timestamptz IS NULL OR j.cree_le < $2::timestamptz)
        AND ($3::text IS NULL OR j.methode = $3)
        AND ($4::text IS NULL OR j.entite = $4)
        AND ($5::text IS NULL OR u.nom ILIKE $5 OR u.prenom ILIKE $5 OR u.email ILIKE $5)
      ORDER BY j.cree_le DESC, j.id DESC
      LIMIT $6 OFFSET $7`,
    [du || null, au || null, methode || null, entite || null, texte, taille, (page - 1) * taille]
  )

  const total = rows[0] ? Number(rows[0].total) : 0
  return {
    lignes: rows.map(({ total: _ignore, ...ligne }) => ligne),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / taille)),
  }
}

export async function listerEntites() {
  const { rows } = await pool.query('SELECT DISTINCT entite FROM journal_activite ORDER BY entite')
  return rows.map((r) => r.entite)
}