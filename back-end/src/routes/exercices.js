import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser , autoriserUne  } from '../middlewares/autoriser.js'
import { repondreErreur, idValide } from '../http/outils.js'
import {
  creerConsigne,
  listerConsignes,
  soumettreDepot,
  mesDepots,
  depotsDeMesSeances,
  validerDepot,
  fichierPourTelechargement,
} from '../services/exercices.js'

const DOSSIER_DEPOTS = path.resolve(process.cwd(), 'uploads', 'depots')
fs.mkdirSync(DOSSIER_DEPOTS, { recursive: true })

const TYPES_AUTORISES = new Set([
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'audio/mpeg', 'audio/wav', 'audio/mp4',
  'video/mp4', 'video/quicktime', 'video/webm',
])

const televerseur = multer({
  storage: multer.diskStorage({
    destination: DOSSIER_DEPOTS,
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (!TYPES_AUTORISES.has(file.mimetype)) return cb(new Error('type-non-accepte'))
    cb(null, true)
  },
})

// Gère les erreurs de téléversement avec un message clair
function televerserFichiers(req, res, next) {
  televerseur.array('fichiers', 5)(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Fichier trop lourd (20 Mo maximum).' })
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: 'Maximum 5 fichiers par dépôt.' })
    if (err.message === 'type-non-accepte') {
      return res.status(400).json({ message: 'Type de fichier non accepté (PDF, image, audio ou vidéo).' })
    }
    return res.status(400).json({ message: 'Téléversement impossible.' })
  })
}

// Supprime les fichiers déjà écrits si l'enregistrement échoue
async function nettoyerFichiers(fichiers = []) {
  await Promise.all(fichiers.map((f) => fs.promises.unlink(f.path).catch(() => {})))
}

function erreurDecision(corps) {
  if (!['valider', 'rejeter'].includes(corps.decision)) return 'Décision invalide.'
  if (corps.decision === 'valider') {
    const note = Number(corps.note)
    if (corps.note === undefined || corps.note === null || corps.note === '' || Number.isNaN(note) || note < 0 || note > 20) {
      return 'La note doit être comprise entre 0 et 20.'
    }
  }
  if (corps.decision === 'rejeter' && !corps.commentaire?.trim()) {
    return 'Un commentaire est obligatoire pour un rejet.'
  }
  if (corps.commentaire && corps.commentaire.length > 2000) {
    return 'Le commentaire ne peut pas dépasser 2000 caractères.'
  }
  return null
}

const router = Router()

// POST /api/seances/:id/consignes  (enseignant de la séance)
router.post('/seances/:id/consignes', authentifier, autoriser('exercices.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  const corps = req.body ?? {}
  if (!corps.titre?.trim()) return res.status(400).json({ message: 'Le titre est obligatoire.' })
  if (corps.date_limite && Number.isNaN(new Date(corps.date_limite).getTime())) {
    return res.status(400).json({ message: 'La date limite est invalide.' })
  }

  try {
    const consigne = await creerConsigne(id, req.utilisateur.id, {
      titre: corps.titre.trim(),
      description: corps.description?.trim() || null,
      date_limite: corps.date_limite || null,
    })
    res.status(201).json({ consigne })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/seances/:id/consignes  (enseignant ou apprenant inscrit)
router.get('/seances/:id/consignes', authentifier, autoriserUne('exercices.gerer', 'exercices.soumettre'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    res.json({ consignes: await listerConsignes(id, req.utilisateur.id) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/consignes/:id/depots  (apprenant inscrit, multipart : champ « fichiers »)
router.post('/consignes/:id/depots', authentifier, autoriser('exercices.soumettre'), televerserFichiers, async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) {
    await nettoyerFichiers(req.files)
    return res.status(400).json({ message: 'Identifiant invalide.' })
  }
  try {
    const depot = await soumettreDepot(id, req.utilisateur.id, req.files ?? [])
    res.status(201).json({ depot })
  } catch (err) {
    await nettoyerFichiers(req.files)
    repondreErreur(res, err)
  }
})

// GET /api/mes-exercices?niveau=&statut=  (T16 : historique groupé par niveau)
router.get('/mes-exercices', authentifier, autoriser('exercices.soumettre'), async (req, res) => {
  const niveau = req.query.niveau ? idValide(req.query.niveau) : null
  if (req.query.niveau && !niveau) return res.status(400).json({ message: 'Niveau invalide.' })

  const statut = req.query.statut || null
  if (statut && !['soumis', 'valide', 'rejete'].includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide.' })
  }

  try {
    res.json({ niveaux: await mesDepots(req.utilisateur.id, { niveau, statut }) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/depots?statut=soumis  (T17 : dépôts à corriger de mes séances)
router.get('/depots', authentifier, autoriser('exercices.gerer'), async (req, res) => {
  const statut = req.query.statut || 'soumis'
  if (!['soumis', 'valide', 'rejete'].includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide.' })
  }
  try {
    res.json({ depots: await depotsDeMesSeances(req.utilisateur.id, statut) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/depots/:id/validation
// body : { decision: 'valider' | 'rejeter', note?, commentaire? }
router.put('/depots/:id/validation', authentifier, autoriser('exercices.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  const corps = req.body ?? {}
  const erreur = erreurDecision(corps)
  if (erreur) return res.status(400).json({ message: erreur })

  try {
    const depot = await validerDepot(id, req.utilisateur.id, {
      decision: corps.decision,
      note: corps.decision === 'valider' ? Number(corps.note) : null,
      commentaire: corps.commentaire?.trim() || null,
    })
    res.json({ depot })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/depots/fichiers/:idFichier/telecharger
router.get('/depots/fichiers/:idFichier/telecharger', authentifier, autoriserUne('exercices.gerer', 'exercices.soumettre'), async (req, res) => {
  const id = idValide(req.params.idFichier)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const fichier = await fichierPourTelechargement(id, req.utilisateur.id)
    res.download(fichier.chemin, fichier.nom)
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router