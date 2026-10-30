import { pool } from '../db.js'

// Erreur métier : porte le code HTTP à renvoyer au client
export class ErreurMetier extends Error {
  constructor(statut, message) {
    super(message)
    this.statut = statut
  }
}

// Membre actif de l'utilisateur connecté, utilisé pour tracer les publications
export async function trouverIdMembreActif(idUtilisateur) {
  const { rows } = await pool.query(
    `SELECT id FROM membre WHERE id_utilisateur = $1 AND statut = 'actif'`,
    [idUtilisateur]
  )
  return rows[0]?.id ?? null
}

export async function listerEtudes() {
  const { rows } = await pool.query(
    `SELECT id, type_etude, id_parent, titre, description, ordre,
            id_categorie, id_niveau, id_niveau_prerequis, cree_le, modifie_le
       FROM etude
      ORDER BY id_parent NULLS FIRST, ordre, titre`
  )
  return rows
}

// Renvoie { etude, versions }, ou null si l'étude n'existe pas
export async function trouverEtude(id) {
  const etude = await pool.query('SELECT * FROM etude WHERE id = $1', [id])
  if (!etude.rows[0]) return null

  const versions = await pool.query(
    'SELECT * FROM version_etude WHERE id_etude = $1 ORDER BY numero',
    [id]
  )
  return { etude: etude.rows[0], versions: versions.rows }
}

async function verifierNiveauExiste(idNiveau) {
  if (idNiveau == null) return
  const { rows } = await pool.query('SELECT 1 FROM niveau WHERE id = $1', [idNiveau])
  if (!rows[0]) throw new ErreurMetier(400, 'Le niveau indiqué est introuvable.')
}

// début (niveaux : prérequis du parcours normal)
// Renvoie l'id du niveau juste avant celui-ci dans l'ordre, ou null
async function niveauPrecedent(idNiveau) {
  if (idNiveau == null) return null
  const { rows } = await pool.query(
    `SELECT p.id FROM niveau p
      WHERE p.ordre < (SELECT ordre FROM niveau WHERE id = $1)
      ORDER BY p.ordre DESC
      LIMIT 1`,
    [idNiveau]
  )
  return rows[0]?.id ?? null
}

// Calcule les colonnes de niveau selon le type et le parcours.
// Une formation n'a pas de niveau. Une unité en parcours normal prend le niveau précédent comme prérequis.
async function niveauxPourEtude(typeEtude, corps) {
  if (typeEtude === 'formation') {
    return { id_niveau: null, id_niveau_prerequis: null, parcours_particulier: false }
  }
  const particulier = corps.parcours_particulier === true
  return {
    id_niveau: corps.id_niveau ?? null,
    id_niveau_prerequis: particulier
      ? (corps.id_niveau_prerequis ?? null)
      : await niveauPrecedent(corps.id_niveau ?? null),
    parcours_particulier: particulier,
  }
}


export async function creerEtude(corps) {
  // Règle métier : une unité doit pointer vers une formation existante
  if (corps.type_etude === 'unite') {
    const parent = await pool.query('SELECT type_etude FROM etude WHERE id = $1', [corps.id_parent])
    if (!parent.rows[0] || parent.rows[0].type_etude !== 'formation') {
      throw new ErreurMetier(400, 'La formation parente est introuvable.')
    }
  }

  const niveaux = await niveauxPourEtude(corps.type_etude, corps)
  await verifierNiveauExiste(niveaux.id_niveau)
  await verifierNiveauExiste(niveaux.id_niveau_prerequis)

  const { rows } = await pool.query(
    `INSERT INTO etude
       (type_etude, id_parent, id_categorie, id_niveau, id_niveau_prerequis, parcours_particulier,
        ordre, titre, description)
     VALUES ($1, $2, $3, $4, $5, $6,
       COALESCE($7::INT, (SELECT COALESCE(MAX(ordre) + 1, 0) FROM etude WHERE id_parent = $2)),
       $8, $9)
     RETURNING *`,
    [
      corps.type_etude,
      corps.type_etude === 'unite' ? corps.id_parent : null,
      corps.id_categorie ?? null,
      niveaux.id_niveau,
      niveaux.id_niveau_prerequis,
      niveaux.parcours_particulier,
      corps.ordre ?? null,
      corps.titre.trim(),
      corps.description ?? null,
    ]
  )
  return rows[0]
}

// MODIFICATION : début
// Renvoie l'étude modifiée, ou null si elle n'existe pas.
// Le front envoie toujours les champs de niveau : une valeur vide retire le niveau.
export async function modifierEtude(id, corps) {
  const actuelle = await pool.query('SELECT type_etude FROM etude WHERE id = $1', [id])
  if (!actuelle.rows[0]) return null

  const niveaux = await niveauxPourEtude(actuelle.rows[0].type_etude, corps)
  await verifierNiveauExiste(niveaux.id_niveau)
  await verifierNiveauExiste(niveaux.id_niveau_prerequis)

  const { rows } = await pool.query(
    `UPDATE etude SET
       titre = COALESCE($2::VARCHAR, titre),
       ordre = COALESCE($3::INT, ordre),
       id_categorie = COALESCE($4::INT, id_categorie),
       id_niveau = $5::INT,
       id_niveau_prerequis = $6::INT,
       parcours_particulier = $7::BOOLEAN,
       description = COALESCE($8::TEXT, description)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      corps.titre?.trim() ?? null,
      corps.ordre ?? null,
      corps.id_categorie ?? null,
      niveaux.id_niveau,
      niveaux.id_niveau_prerequis,
      niveaux.parcours_particulier,
      corps.description ?? null,
    ]
  )
  return rows[0] ?? null
}
// MODIFICATION : fin

// Renvoie true si l'étude a été supprimée, false si elle n'existait pas
export async function supprimerEtude(id) {
  const { rowCount } = await pool.query('DELETE FROM etude WHERE id = $1', [id])
  return rowCount > 0
}

// Renvoie la version créée, ou null si l'étude n'existe pas
export async function creerVersion(idEtude, corps) {
  const etude = await pool.query('SELECT id FROM etude WHERE id = $1', [idEtude])
  if (!etude.rows[0]) return null

  const { rows } = await pool.query(
    `INSERT INTO version_etude (id_etude, numero, titre, description)
     VALUES ($1::INT,
             (SELECT COALESCE(MAX(numero), 0) + 1 FROM version_etude WHERE id_etude = $1::INT),
             $2, $3)
     RETURNING *`,
    [idEtude, corps.titre.trim(), corps.description ?? null]
  )
  return rows[0]
}

// Renvoie la version modifiée, ou null si elle n'existe pas.
// Le trigger trg_version_etude_immuable peut refuser la modification si la version est publiée.
export async function modifierVersion(idVersion, corps) {
  const { rows } = await pool.query(
    `UPDATE version_etude SET titre = $2, description = $3
     WHERE id = $1
     RETURNING *`,
    [idVersion, corps.titre.trim(), corps.description ?? null]
  )
  return rows[0] ?? null
}

export async function publierVersion(idVersion, idUtilisateur) {
  const idMembre = await trouverIdMembreActif(idUtilisateur)
  if (!idMembre) {
    throw new ErreurMetier(403, 'Aucun membre actif associé à votre compte.')
  }

  const version = await pool.query(
    `SELECT v.etat, e.type_etude,
            (SELECT COUNT(*) FROM version_etude_activite WHERE id_version_etude = v.id) AS nb_activites
       FROM version_etude v
       JOIN etude e ON e.id = v.id_etude
      WHERE v.id = $1`,
    [idVersion]
  )
  if (!version.rows[0]) throw new ErreurMetier(404, 'Version introuvable.')
  if (version.rows[0].etat !== 'brouillon') {
    throw new ErreurMetier(409, 'Seule une version en brouillon peut être publiée.')
  }
  if (version.rows[0].type_etude === 'unite' && Number(version.rows[0].nb_activites) === 0) {
    throw new ErreurMetier(409, 'Ajoutez au moins une activité avant de publier cette unité.')
  }

  const { rows } = await pool.query(
    `UPDATE version_etude
        SET etat = 'publiee', publie_le = NOW(), publie_par = $2
      WHERE id = $1
      RETURNING *`,
    [idVersion, idMembre]
  )
  return rows[0]
}

// ===== Activités pédagogiques (cours d'une unité) =====

async function typeActiviteExiste(code) {
  const { rows } = await pool.query('SELECT 1 FROM type_activite WHERE code = $1', [code])
  return rows.length > 0
}

// Activités d'une unité, avec leurs versions
export async function listerActivites(idEtude) {
  const { rows } = await pool.query(
    `SELECT da.id, da.id_etude, da.code_type_activite, da.titre, da.description, da.cree_le,
            COALESCE(
              json_agg(va ORDER BY va.numero) FILTER (WHERE va.id IS NOT NULL),
              '[]'
            ) AS versions
       FROM definition_activite da
       LEFT JOIN version_activite va ON va.id_definition_activite = da.id
      WHERE da.id_etude = $1
      GROUP BY da.id
      ORDER BY da.id`,
    [idEtude]
  )
  return rows
}

export async function creerActivite(corps) {
  // Règle métier : une activité se rattache à une unité, pas à une formation
  const etude = await pool.query('SELECT type_etude FROM etude WHERE id = $1', [corps.id_etude])
  if (!etude.rows[0]) throw new ErreurMetier(404, 'Unité introuvable.')
  if (etude.rows[0].type_etude !== 'unite') {
    throw new ErreurMetier(400, 'Une activité doit être rattachée à une unité, pas à une formation.')
  }

  // Règle métier : le type doit exister dans la liste des types d'activité
  if (!(await typeActiviteExiste(corps.code_type_activite))) {
    throw new ErreurMetier(400, "Type d'activité inconnu.")
  }

  const { rows } = await pool.query(
    `INSERT INTO definition_activite (id_etude, code_type_activite, titre, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [corps.id_etude, corps.code_type_activite, corps.titre.trim(), corps.description ?? null]
  )
  return rows[0]
}

// Le type d'activité ne se modifie pas (la validation le refuse)
export async function modifierActivite(id, corps) {
  const { rows } = await pool.query(
    `UPDATE definition_activite SET
       titre = COALESCE($2::VARCHAR, titre),
       description = COALESCE($3::TEXT, description)
     WHERE id = $1
     RETURNING *`,
    [id, corps.titre?.trim() ?? null, corps.description ?? null]
  )
  return rows[0] ?? null
}

// Renvoie true si supprimée, false si elle n'existait pas
export async function supprimerActivite(id) {
  const { rowCount } = await pool.query('DELETE FROM definition_activite WHERE id = $1', [id])
  return rowCount > 0
}

// Renvoie la version créée, ou null si l'activité n'existe pas
export async function creerVersionActivite(idDefinition, corps) {
  const definition = await pool.query('SELECT id FROM definition_activite WHERE id = $1', [idDefinition])
  if (!definition.rows[0]) return null

  const { rows } = await pool.query(
    `INSERT INTO version_activite (id_definition_activite, numero, titre_version, description, duree_estimee_min)
     VALUES ($1::INT,
             (SELECT COALESCE(MAX(numero), 0) + 1 FROM version_activite WHERE id_definition_activite = $1::INT),
             $2, $3, $4)
     RETURNING *`,
    [idDefinition, corps.titre_version.trim(), corps.description ?? null, corps.duree_estimee_min ?? null]
  )
  return rows[0]
}

// Renvoie la version modifiée, ou null. Le trigger refuse si la version est publiée.
export async function modifierVersionActivite(idVersion, corps) {
  const { rows } = await pool.query(
    `UPDATE version_activite SET
       titre_version = $2,
       description = $3,
       duree_estimee_min = $4
     WHERE id = $1
     RETURNING *`,
    [idVersion, corps.titre_version.trim(), corps.description ?? null, corps.duree_estimee_min ?? null]
  )
  return rows[0] ?? null
}

export async function publierVersionActivite(idVersion, idUtilisateur) {
  const idMembre = await trouverIdMembreActif(idUtilisateur)
  if (!idMembre) {
    throw new ErreurMetier(403, 'Aucun membre actif associé à votre compte.')
  }

  const version = await pool.query('SELECT etat FROM version_activite WHERE id = $1', [idVersion])
  if (!version.rows[0]) throw new ErreurMetier(404, 'Version introuvable.')
  if (version.rows[0].etat !== 'brouillon') {
    throw new ErreurMetier(409, 'Seule une version en brouillon peut être publiée.')
  }

  const { rows } = await pool.query(
    `UPDATE version_activite
        SET etat = 'publiee', publie_le = NOW(), publie_par = $2
      WHERE id = $1
      RETURNING *`,
    [idVersion, idMembre]
  )
  return rows[0]
}

// ===== Composition d'une version d'unité =====

async function trouverVersionEtude(idVersion) {
  const { rows } = await pool.query(
    `SELECT ve.id, ve.etat, ve.id_etude, e.type_etude
       FROM version_etude ve
       JOIN etude e ON e.id = ve.id_etude
      WHERE ve.id = $1`,
    [idVersion]
  )
  return rows[0] ?? null
}

// Vérifie qu'on peut modifier la composition : unité et brouillon uniquement
function verifierCompositionModifiable(version) {
  if (version.type_etude !== 'unite') {
    throw new ErreurMetier(400, "Seule une unité peut avoir une composition d'activités.")
  }
  if (version.etat !== 'brouillon') {
    throw new ErreurMetier(409, "La composition d'une version publiée est figée.")
  }
}

// Activités contenues dans une version d'unité ; null si la version n'existe pas
export async function listerComposition(idVersion) {
  const version = await trouverVersionEtude(idVersion)
  if (!version) return null

  const { rows } = await pool.query(
    `SELECT vea.id_version_activite, vea.ordre, vea.obligatoire,
            va.numero AS numero_version, va.titre_version, va.duree_estimee_min,
            da.id AS id_activite, da.titre AS titre_activite, da.code_type_activite
       FROM version_etude_activite vea
       JOIN version_activite va ON va.id = vea.id_version_activite
       JOIN definition_activite da ON da.id = va.id_definition_activite
      WHERE vea.id_version_etude = $1
      ORDER BY vea.ordre, vea.id_version_activite`,
    [idVersion]
  )
  return rows
}

export async function ajouterAuComposition(idVersion, corps) {
  const version = await trouverVersionEtude(idVersion)
  if (!version) throw new ErreurMetier(404, 'Version introuvable.')
  verifierCompositionModifiable(version)

  const activite = await pool.query(
    `SELECT va.etat, da.id_etude
       FROM version_activite va
       JOIN definition_activite da ON da.id = va.id_definition_activite
      WHERE va.id = $1`,
    [corps.id_version_activite]
  )
  if (!activite.rows[0]) throw new ErreurMetier(404, "Version d'activité introuvable.")

  // Règle métier : l'activité doit appartenir à la même unité
  if (activite.rows[0].id_etude !== version.id_etude) {
    throw new ErreurMetier(400, "Cette activité n'appartient pas à cette unité.")
  }
  // Règle métier : on ne compose qu'avec des versions publiées
  if (activite.rows[0].etat !== 'publiee') {
    throw new ErreurMetier(400, "Seule une version publiée d'une activité peut être ajoutée à une unité.")
  }

  const { rows } = await pool.query(
    `INSERT INTO version_etude_activite (id_version_etude, id_version_activite, ordre, obligatoire)
     VALUES ($1, $2,
       COALESCE($3::INT, (SELECT COALESCE(MAX(ordre) + 1, 0) FROM version_etude_activite WHERE id_version_etude = $1)),
       $4)
     RETURNING *`,
    [idVersion, corps.id_version_activite, corps.ordre ?? null, corps.obligatoire ?? true]
  )
  return rows[0]
}

// Renvoie la ligne modifiée, ou null si l'activité n'est pas dans la composition
export async function modifierComposition(idVersion, idVersionActivite, corps) {
  const version = await trouverVersionEtude(idVersion)
  if (!version) throw new ErreurMetier(404, 'Version introuvable.')
  verifierCompositionModifiable(version)

  const { rows } = await pool.query(
    `UPDATE version_etude_activite SET
       ordre = COALESCE($3::INT, ordre),
       obligatoire = COALESCE($4::BOOLEAN, obligatoire)
     WHERE id_version_etude = $1 AND id_version_activite = $2
     RETURNING *`,
    [idVersion, idVersionActivite, corps.ordre ?? null, corps.obligatoire ?? null]
  )
  return rows[0] ?? null
}

// Renvoie true si retirée, false si elle n'était pas dans la composition
export async function retirerDuComposition(idVersion, idVersionActivite) {
  const version = await trouverVersionEtude(idVersion)
  if (!version) throw new ErreurMetier(404, 'Version introuvable.')
  verifierCompositionModifiable(version)

  const { rowCount } = await pool.query(
    `DELETE FROM version_etude_activite
      WHERE id_version_etude = $1 AND id_version_activite = $2`,
    [idVersion, idVersionActivite]
  )
  return rowCount > 0
}

// ===== Ressources d'une version d'activité =====

async function trouverVersionActivite(idVersion) {
  const { rows } = await pool.query(
    'SELECT id, etat FROM version_activite WHERE id = $1',
    [idVersion]
  )
  return rows[0] ?? null
}

function verifierRessourcesModifiables(etat) {
  if (etat !== 'brouillon') {
    throw new ErreurMetier(409, "Les ressources d'une version publiée sont figées.")
  }
}

// Ressources d'une version d'activité ; null si la version n'existe pas
export async function listerRessources(idVersion) {
  const version = await trouverVersionActivite(idVersion)
  if (!version) return null

  const { rows } = await pool.query(
    'SELECT * FROM ressource WHERE id_version_activite = $1 ORDER BY ordre, id',
    [idVersion]
  )
  return rows
}

export async function ajouterRessource(idVersion, corps) {
  const version = await trouverVersionActivite(idVersion)
  if (!version) throw new ErreurMetier(404, 'Version introuvable.')
  verifierRessourcesModifiables(version.etat)

  const { rows } = await pool.query(
    `INSERT INTO ressource (id_version_activite, type_media, titre, url, duree_secondes, ordre)
     VALUES ($1, $2, $3, $4, $5,
       COALESCE($6::INT, (SELECT COALESCE(MAX(ordre) + 1, 0) FROM ressource WHERE id_version_activite = $1)))
     RETURNING *`,
    [
      idVersion,
      corps.type_media,
      corps.titre?.trim() ?? null,
      corps.url.trim(),
      corps.duree_secondes ?? null,
      corps.ordre ?? null,
    ]
  )
  return rows[0]
}

// Renvoie la ressource modifiée, ou null si elle n'existe pas
export async function modifierRessource(id, corps) {
  const existante = await pool.query(
    `SELECT va.etat
       FROM ressource r
       JOIN version_activite va ON va.id = r.id_version_activite
      WHERE r.id = $1`,
    [id]
  )
  if (!existante.rows[0]) return null
  verifierRessourcesModifiables(existante.rows[0].etat)

  const { rows } = await pool.query(
    `UPDATE ressource SET
       titre = COALESCE($2::VARCHAR, titre),
       url = COALESCE($3::TEXT, url),
       duree_secondes = COALESCE($4::INT, duree_secondes),
       ordre = COALESCE($5::INT, ordre)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      corps.titre?.trim() ?? null,
      corps.url?.trim() ?? null,
      corps.duree_secondes ?? null,
      corps.ordre ?? null,
    ]
  )
  return rows[0] ?? null
}

// Renvoie true si supprimée, false si elle n'existait pas
export async function supprimerRessource(id) {
  const existante = await pool.query(
    `SELECT va.etat
       FROM ressource r
       JOIN version_activite va ON va.id = r.id_version_activite
      WHERE r.id = $1`,
    [id]
  )
  if (!existante.rows[0]) return false
  verifierRessourcesModifiables(existante.rows[0].etat)

  const { rowCount } = await pool.query('DELETE FROM ressource WHERE id = $1', [id])
  return rowCount > 0
}

// Une activité et ses versions ; null si elle n'existe pas
export async function trouverActivite(id) {
  const activite = await pool.query(
    `SELECT da.*, e.titre AS titre_unite
       FROM definition_activite da
       JOIN etude e ON e.id = da.id_etude
      WHERE da.id = $1`,
    [id]
  )
  if (!activite.rows[0]) return null

  const versions = await pool.query(
    'SELECT * FROM version_activite WHERE id_definition_activite = $1 ORDER BY numero',
    [id]
  )
  return { activite: activite.rows[0], versions: versions.rows }
}

// Supprime un brouillon de version d'unité. Renvoie false si la version n'existe pas.
export async function supprimerVersionEtude(idVersion) {
  const version = await pool.query('SELECT etat FROM version_etude WHERE id = $1', [idVersion])
  if (!version.rows[0]) return false

  if (version.rows[0].etat !== 'brouillon') {
    throw new ErreurMetier(409, 'Seule une version en brouillon peut être supprimée.')
  }

  const liens = await pool.query(
    `SELECT (SELECT COUNT(*) FROM version_etude_activite WHERE id_version_etude = $1)
          + (SELECT COUNT(*) FROM version_etude_competence WHERE id_version_etude = $1) AS n`,
    [idVersion]
  )
  if (liens.rows[0].n > 0) {
    throw new ErreurMetier(409, 'Retirez d\'abord les activités et les compétences de cette version.')
  }

  await pool.query('DELETE FROM version_etude WHERE id = $1', [idVersion])
  return true
}

// Supprime un brouillon de version d'activité, avec ses ressources.
// Renvoie false si la version n'existe pas.
export async function supprimerVersionActivite(idVersion) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const version = await client.query(
      'SELECT etat FROM version_activite WHERE id = $1 FOR UPDATE',
      [idVersion]
    )
    if (!version.rows[0]) {
      await client.query('ROLLBACK')
      return false
    }
    if (version.rows[0].etat !== 'brouillon') {
      throw new ErreurMetier(409, 'Seule une version en brouillon peut être supprimée.')
    }

    const utilisee = await client.query(
      'SELECT COUNT(*)::INT AS n FROM version_etude_activite WHERE id_version_activite = $1',
      [idVersion]
    )
    if (utilisee.rows[0].n > 0) {
      throw new ErreurMetier(409, 'Cette version est utilisée dans une unité : elle ne peut pas être supprimée.')
    }

    await client.query('DELETE FROM ressource WHERE id_version_activite = $1', [idVersion])
    await client.query('DELETE FROM version_activite WHERE id = $1', [idVersion])

    await client.query('COMMIT')
    return true
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}