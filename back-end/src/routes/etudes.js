import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import {
  validerCreationEtude,
  validerMiseAJourEtude,
  validerVersion,
} from '../validation/etudes.js'
import {
  ErreurMetier,
  listerEtudes,
  trouverEtude,
  creerEtude,
  modifierEtude,
  supprimerEtude,
  creerVersion,
  modifierVersion,
  publierVersion,
  supprimerVersionEtude
} from '../services/pedagogie.js'
import { repondreErreur, idValide } from '../http/outils.js'

const router = Router()
router.use(authentifier)

// Traduit les erreurs en réponses HTTP

// GET /api/etudes
router.get('/', autoriser('pedagogie.lire'), async (req, res) => {
  try {
    const etudes = await listerEtudes()
    res.json({ etudes })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/etudes/:id
router.get('/:id', autoriser('pedagogie.lire'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  try {
    const resultat = await trouverEtude(id)
    if (!resultat) return res.status(404).json({ message: 'Étude introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/etudes
router.post('/', autoriser('pedagogie.gerer'), async (req, res) => {
  const corps = req.body ?? {}
  const erreurs = validerCreationEtude(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

  try {
    const etude = await creerEtude(corps)
    res.status(201).json({ etude })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/etudes/:id
router.put('/:id', autoriser('pedagogie.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  const corps = req.body ?? {}
  const erreurs = validerMiseAJourEtude(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

  try {
    const etude = await modifierEtude(id, corps)
    if (!etude) return res.status(404).json({ message: 'Étude introuvable.' })
    res.json({ etude })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// DELETE /api/etudes/:id
router.delete('/:id', autoriser('pedagogie.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  try {
    const supprimee = await supprimerEtude(id)
    if (!supprimee) return res.status(404).json({ message: 'Étude introuvable.' })
    res.json({ message: 'Étude supprimée.' })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/etudes/:id/versions
router.post('/:id/versions', autoriser('pedagogie.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  const corps = req.body ?? {}
  const erreurs = validerVersion(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

  try {
    const version = await creerVersion(id, corps)
    if (!version) return res.status(404).json({ message: 'Étude introuvable.' })
    res.status(201).json({ version })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/etudes/versions/:idVersion
// Une version publiée est refusée par le trigger : réponse 409
router.put('/versions/:idVersion', autoriser('pedagogie.gerer'), async (req, res) => {
  const idVersion = idValide(req.params.idVersion)
  if (!idVersion) return res.status(400).json({ message: 'Identifiant invalide.' })

  const corps = req.body ?? {}
  const erreurs = validerVersion(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

  try {
    const version = await modifierVersion(idVersion, corps)
    if (!version) return res.status(404).json({ message: 'Version introuvable.' })
    res.json({ version })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/etudes/versions/:idVersion/publier
router.post('/versions/:idVersion/publier', autoriser('pedagogie.gerer'), async (req, res) => {
  const idVersion = idValide(req.params.idVersion)
  if (!idVersion) return res.status(400).json({ message: 'Identifiant invalide.' })

  try {
    const version = await publierVersion(idVersion, req.utilisateur.id)
    res.json({ version })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// DELETE /api/etudes/versions/:idVersion : brouillon uniquement
router.delete('/versions/:idVersion', autoriser('pedagogie.gerer'), async (req, res) => {
  const idVersion = idValide(req.params.idVersion)
  if (!idVersion) return res.status(400).json({ message: 'Identifiant invalide.' })

  try {
    const supprimee = await supprimerVersionEtude(idVersion)
    if (!supprimee) return res.status(404).json({ message: 'Version introuvable.' })
    res.json({ message: 'Version supprimée.' })
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router