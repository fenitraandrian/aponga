import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db.js'
import {
  NOM_COOKIE,
  OPTIONS_COOKIE,
  creerSession,
  empreinte,
  genererJeton,
  revoquerSession,
} from '../services/sessions.js'
import { authentifier } from '../middlewares/authentifier.js'
import { permissionsDeLUtilisateur ,rolesDeLUtilisateur } from '../services/permissions.js'

const router = Router()

const ID_ORGANISATION = 1 // l'organisation est unique dans l'instance
const COUT_HACHAGE = 12   // nombre de tours de calcul de bcrypt
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const texte = (valeur) => (typeof valeur === 'string' ? valeur.trim() : '')

function validerInscription({ nom, prenom, email, telephone, motDePasse }) {
  if (!texte(nom) || !texte(prenom)) {
    return 'Le nom et le prénom sont obligatoires.'
  }
  // MODIFICATION : début (l'email sert à se connecter, il est donc obligatoire)
  if (!texte(email)) {
    return 'L\'adresse e-mail est obligatoire.'
  }
  if (!REGEX_EMAIL.test(texte(email))) {
    return 'Adresse e-mail invalide.'
  }
  // MODIFICATION : fin
  if (typeof motDePasse !== 'string' || motDePasse.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères.'
  }
  return null
}

// POST /api/auth/inscription
router.post('/inscription', async (req, res) => {
  const erreurValidation = validerInscription(req.body ?? {})
  if (erreurValidation) {
    return res.status(400).json({ message: erreurValidation })
  }

  const nom = texte(req.body.nom)
  const prenom = texte(req.body.prenom)
  const email = texte(req.body.email).toLowerCase() || null
  const telephone = texte(req.body.telephone) || null

  const client = await pool.connect()
  try {
    const motDePasseHache = await bcrypt.hash(req.body.motDePasse, COUT_HACHAGE)

    await client.query('BEGIN')

    const { rows } = await client.query(
      `INSERT INTO utilisateur (nom, prenom, email, telephone, mot_de_passe_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nom, prenom, email`,
      [nom, prenom, email, telephone, motDePasseHache]
    )

    // Un utilisateur devient membre de l'organisation (la table membre est utilisée par tous les autres blocs)
    // await client.query(
    //   'INSERT INTO membre (id_utilisateur, id_organisation) VALUES ($1, $2)',
    //   [rows[0].id, ID_ORGANISATION]
    // )

    // MODIFICATION : début (rôle apprenant par défaut à l'inscription)
    const membre = await client.query(
      'INSERT INTO membre (id_utilisateur, id_organisation) VALUES ($1, $2) RETURNING id',
      [rows[0].id, ID_ORGANISATION]
    )

    await client.query(
      `INSERT INTO membre_role (id_membre, id_role)
       VALUES ($1, (SELECT id FROM role WHERE code = 'apprenant'))`,
      [membre.rows[0].id]
    )
    // MODIFICATION : fin

    await client.query('COMMIT')
    res.status(201).json({ utilisateur: rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')

    // 23505 : violation d'une contrainte UNIQUE (e-mail ou téléphone déjà pris)
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Cet e-mail ou ce téléphone est déjà utilisé.' })
    }

    console.error(err)
    res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
  } finally {
    client.release()
  }
})

// POST /api/auth/connexion : vérifie les identifiants (le jeton de session viendra à l'étape suivante)
router.post('/connexion', async (req, res) => {
  const email = texte(req.body?.email).toLowerCase()
  const motDePasse = req.body?.motDePasse

  if (!email || typeof motDePasse !== 'string') {
    return res.status(400).json({ message: 'E-mail et mot de passe requis.' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, nom, prenom, email, mot_de_passe_hash, statut FROM utilisateur WHERE email = $1',
      [email]
    )
    const utilisateur = rows[0]
    const motDePasseValide =
      utilisateur.mot_de_passe_hash && (await bcrypt.compare(motDePasse, utilisateur.mot_de_passe_hash))

    if (!motDePasseValide) {
      return res.status(401).json({ message: 'E-mail ou mot de passe incorrect.' })
    }

    if (utilisateur.statut !== 'actif') {
      return res.status(403).json({ message: 'Ce compte est suspendu. Contactez l\'administrateur.' })
    }

    const jeton = await creerSession(utilisateur.id)
    res.cookie(NOM_COOKIE, jeton, OPTIONS_COOKIE)

    res.json({
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
  }
})

// MODIFICATION : début (déconnexion, moi, mot de passe oublié, réinitialisation)

// POST /api/auth/deconnexion
router.post('/deconnexion', async (req, res) => {
  const jeton = req.cookies?.[NOM_COOKIE]
  try {
    if (jeton) await revoquerSession(jeton)
    res.clearCookie(NOM_COOKIE, { path: '/' })
    res.json({ message: 'Déconnecté.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
  }
})

// GET /api/auth/moi : route protégée, sert au test
// moi renvoie aussi les permissions, pour que le front adapte l'affichage
router.get('/moi', authentifier, async (req, res) => {
  try {
    const [permissions, roles] = await Promise.all([
      permissionsDeLUtilisateur(req.utilisateur.id),
      rolesDeLUtilisateur(req.utilisateur.id),
    ])
    res.json({ utilisateur: req.utilisateur, permissions, roles })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
  }
})

// POST /api/auth/mot-de-passe-oublie
// La réponse est identique que le compte existe ou non.
router.post('/mot-de-passe-oublie', async (req, res) => {
  const email = texte(req.body?.email).toLowerCase()
  const reponse = {
    message: 'Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.',
  }

  if (!email) {
    return res.status(400).json({ message: 'Adresse e-mail requise.' })
  }

  try {
    const { rows } = await pool.query('SELECT id FROM utilisateur WHERE email = $1', [email])

    if (rows[0]) {
      const jeton = genererJeton()
      await pool.query(
        `INSERT INTO reinitialisation_mot_de_passe (id_utilisateur, empreinte_jeton, expire_le)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [rows[0].id, empreinte(jeton)]
      )
      // Pas encore de serveur SMTP : en développement, le lien s'affiche dans le terminal
      console.log(`Lien de réinitialisation : http://localhost:5173/reinitialiser?jeton=${jeton}`)
    }

    res.json(reponse)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
  }
})

// POST /api/auth/reinitialiser
router.post('/reinitialiser', async (req, res) => {
  const jeton = texte(req.body?.jeton)
  const nouveauMotDePasse = req.body?.nouveauMotDePasse

  if (!jeton || typeof nouveauMotDePasse !== 'string' || nouveauMotDePasse.length < 8) {
    return res.status(400).json({ message: 'Jeton et mot de passe (8 caractères minimum) requis.' })
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, id_utilisateur FROM reinitialisation_mot_de_passe
       WHERE empreinte_jeton = $1 AND utilisee_le IS NULL AND expire_le > NOW()`,
      [empreinte(jeton)]
    )
    const demande = rows[0]
    if (!demande) {
      return res.status(400).json({ message: 'Lien invalide ou expiré.' })
    }

    const motDePasseHache = await bcrypt.hash(nouveauMotDePasse, COUT_HACHAGE)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('UPDATE utilisateur SET mot_de_passe_hash = $1 WHERE id = $2', [
        motDePasseHache,
        demande.id_utilisateur,
      ])
      await client.query('UPDATE reinitialisation_mot_de_passe SET utilisee_le = NOW() WHERE id = $1', [
        demande.id,
      ])
      await client.query(
        'UPDATE session_utilisateur SET revoquee_le = NOW() WHERE id_utilisateur = $1 AND revoquee_le IS NULL',
        [demande.id_utilisateur]
      )
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    res.json({ message: 'Mot de passe modifié. Vous pouvez vous connecter.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
  }
})

export default router