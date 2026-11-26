import { pool } from '../db.js'
import { ErreurMetier } from './pedagogie.js'
import { ouvrirAbonnement } from './abonnements.js'

// Calcule le nombre de séances couvertes et le reste conservé.
// Les calculs se font en centimes pour éviter les erreurs d'arrondi.
export function calculerSeances({ montant, reste = 0, prixSeance }) {
  const total = Math.round((Number(montant) + Number(reste)) * 100)
  const prix = Math.round(Number(prixSeance) * 100)
  const nombre = Math.floor(total / prix)
  const resteApres = (total - nombre * prix) / 100
  return { nombre, resteApres }
}

export async function enregistrerPaiement({ idMembre, idNiveau, montant, idUtilisateur, idTypeAbonnement }) {
  const valeur = Number(montant)
  if (!Number.isFinite(valeur) || valeur <= 0) {
    throw new ErreurMetier(400, 'Le montant doit être supérieur à 0.')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const tarif = await client.query(
      'SELECT prix_seance FROM tarif_niveau WHERE id_niveau = $1',
      [idNiveau]
    )
    if (!tarif.rows[0]) {
      throw new ErreurMetier(400, 'Aucun tarif défini pour ce niveau.')
    }
    const prix = Number(tarif.rows[0].prix_seance)

    // Crée la ligne de solde si elle n'existe pas, puis la verrouille
    await client.query(
      `INSERT INTO solde_seance (id_membre, id_niveau, nombre, reste)
       VALUES ($1, $2, 0, 0)
       ON CONFLICT (id_membre, id_niveau) DO NOTHING`,
      [idMembre, idNiveau]
    )
    const solde = await client.query(
      'SELECT reste FROM solde_seance WHERE id_membre = $1 AND id_niveau = $2 FOR UPDATE',
      [idMembre, idNiveau]
    )

    const { nombre, resteApres } = calculerSeances({
      montant: valeur,
      reste: solde.rows[0].reste,
      prixSeance: prix,
    })

    await client.query(
      `UPDATE solde_seance
       SET nombre = nombre + $3, reste = $4
       WHERE id_membre = $1 AND id_niveau = $2`,
      [idMembre, idNiveau, nombre, resteApres]
    )

    const paiement = await client.query(
      `INSERT INTO paiement
         (id_membre, id_niveau, montant, prix_seance, nombre_seances, reste_apres, enregistre_par, id_type_abonnement)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [idMembre, idNiveau, valeur, prix, nombre, resteApres, idUtilisateur, idTypeAbonnement]
    )

    await ouvrirAbonnement(client, {
      idMembre,
      idNiveau,
      idType: idTypeAbonnement,
      idPaiement: paiement.rows[0].id,
      montant: valeur,
    })
    await client.query('COMMIT')
    return { paiement: paiement.rows[0], nombreSeances: nombre, reste: resteApres }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function listerMembres() {
  const { rows } = await pool.query(
    `SELECT m.id, u.nom, u.prenom
     FROM membre m
     JOIN utilisateur u ON u.id = m.id_utilisateur
     ORDER BY u.nom, u.prenom`
  )
  return rows
}

// Niveaux avec leur tarif (prix_seance est null si aucun tarif n'est défini)
export async function listerNiveaux() {
  const { rows } = await pool.query(
    `SELECT n.id, n.nom AS libelle, t.prix_seance
     FROM niveau n
     LEFT JOIN tarif_niveau t ON t.id_niveau = n.id
     ORDER BY n.ordre`
  )
  return rows
}

export async function definirTarif(idNiveau, prix) {
  const { rows } = await pool.query(
    `INSERT INTO tarif_niveau (id_niveau, prix_seance)
     VALUES ($1, $2)
     ON CONFLICT (id_niveau) DO UPDATE SET prix_seance = EXCLUDED.prix_seance
     RETURNING *`,
    [idNiveau, prix]
  )
  return rows[0]
}

// Derniers paiements, éventuellement filtrés sur un apprenant
export async function listerPaiements({ idMembre = null } = {}) {
  const params = []
  let filtre = ''
  if (idMembre) {
    params.push(idMembre)
    filtre = 'WHERE p.id_membre = $1'
  }
  const { rows } = await pool.query(
    `SELECT p.id, p.cree_le, p.montant, p.prix_seance, p.nombre_seances, p.reste_apres,
            u.nom, u.prenom, n.nom AS niveau
     FROM paiement p
     JOIN membre m ON m.id = p.id_membre
     JOIN utilisateur u ON u.id = m.id_utilisateur
     JOIN niveau n ON n.id = p.id_niveau
     ${filtre}
     ORDER BY p.cree_le DESC
     LIMIT 100`,
    params
  )
  return rows
}