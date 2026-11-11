import { Router } from 'express'
import multer from 'multer'
import crypto from 'crypto'
import path from 'path'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { validerConteneur } from '../validation/contenus.js'
import { trouverIdMembreActif } from '../services/pedagogie.js'
import {
  DOSSIER,
  LIMITE_MAX_OCTETS,
  listerContenus,
  trouverConteneur,
  creerConteneur,
  modifierConteneur,
  supprimerConteneur,
  ajouterFichier,
  supprimerFichier,
  trouverFichier,
  supprimerFichierDisque,
} from '../services/contenus.js'
import { repondreErreur, idValide } from '../http/outils.js'

const router = Router()
router.use(authentifier)

// Nom aléatoire sur le disque : pas de collision, pas de nom devinable
const stockage = multer.diskStorage({
  destination: DOSSIER,
  filename: (req, file, cb) =>
    cb(null, crypto.randomBytes(24).toString('hex') + path.extname(file.originalname).toLowerCase()),
})
const televersement = multer({ storage: stockage, limits: { fileSize: LIMITE_MAX_OCTETS, files: 1 } })

// Reçoit le fichier et renvoie une réponse propre si la taille est dépassée
function recevoirFichier(req, res, next) {
  televersement.single('fichier')(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop volumineux (500 Mo maximum).' : 'Téléversement impossible.'
      return res.status(400).json({ message })
    }
    next()
  })
}

// Supprime le fichier déjà écrit sur le disque si l'enregistrement échoue
async function nettoyerFichierRecu(req) {
  if (req.file) await supprimerFichierDisque(req.file.filename).catch(() => {})
}

// GET /api/contenus?etude=ID&seance=ID
router.get('/', autoriser('contenus.lire'), async (req, res) => {
  const idEtude = idValide(req.query.etude)
  if (!idEtude) return res.status(400).json({ message: "L'unité est obligatoire." })
  const idSeance = req.query.seance ? idValide(req.query.seance) : null
  try {
    res.json({ conteneurs: await listerContenus(idEtude, idSeance) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/contenus
router.post('/', autoriser('contenus.gerer'), async (req, res) => {
  const corps = req.body ?? {}
  const erreurs = validerConteneur(corps, { creation: true })
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })
  try {
    const idMembre = await trouverIdMembreActif(req.utilisateur.id)
    res.status(201).json({ conteneur: await creerConteneur(corps, idMembre) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/contenus/:id
router.put('/:id', autoriser('contenus.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  const corps = req.body ?? {}
  const erreurs = validerConteneur(corps, { creation: false })
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })
  try {
    const conteneur = await modifierConteneur(id, corps)
    if (!conteneur) return res.status(404).json({ message: 'Conteneur introuvable.' })
    res.json({ conteneur })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// DELETE /api/contenus/:id
router.delete('/:id', autoriser('contenus.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const supprime = await supprimerConteneur(id)
    if (!supprime) return res.status(404).json({ message: 'Conteneur introuvable.' })
    res.json({ message: 'Conteneur supprimé.' })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/contenus/:id/fichiers  (champ multipart « fichier »)
router.post('/:id/fichiers', autoriser('contenus.gerer'), recevoirFichier, async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) {
    await nettoyerFichierRecu(req)
    return res.status(400).json({ message: 'Identifiant invalide.' })
  }
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu.' })
  try {
    res.status(201).json({ fichier: await ajouterFichier(id, req.file) })
  } catch (err) {
    await nettoyerFichierRecu(req)
    repondreErreur(res, err)
  }
})

// DELETE /api/contenus/fichiers/:id
router.delete('/fichiers/:id', autoriser('contenus.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const supprime = await supprimerFichier(id)
    if (!supprime) return res.status(404).json({ message: 'Fichier introuvable.' })
    res.json({ message: 'Fichier supprimé.' })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/contenus/fichiers/:id/telecharger
router.get('/fichiers/:id/telecharger', autoriser('contenus.lire'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const fichier = await trouverFichier(id)
    if (!fichier) return res.status(404).json({ message: 'Fichier introuvable.' })
    res.download(path.join(DOSSIER, fichier.nom_stocke), fichier.nom_original)
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router