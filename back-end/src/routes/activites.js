import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { repondreErreur, idValide } from '../http/outils.js'
import {
  validerCreationActivite,
  validerMiseAJourActivite,
  validerVersionActivite,
} from '../validation/activites.js'
import {
  listerActivites,
  creerActivite,
  modifierActivite,
  supprimerActivite,
  creerVersionActivite,
  modifierVersionActivite,
  publierVersionActivite,
  trouverActivite,
  supprimerVersionActivite,
} from '../services/pedagogie.js'

const router = Router()
router.use(authentifier)

// GET /api/activites?etude=ID : activités d'une unité
router.get('/', autoriser('pedagogie.lire'), async (req, res) => {
  const idEtude = idValide(req.query.etude)
  if (!idEtude) return res.status(400).json({ message: 'Paramètre « etude » manquant ou invalide.' })

  try {
    const activites = await listerActivites(idEtude)
    res.json({ activites })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/activites
router.post('/', autoriser('pedagogie.gerer'), async (req, res) => {
  const corps = req.body ?? {}
  const erreurs = validerCreationActivite(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

  try {
    const activite = await creerActivite(corps)
    res.status(201).json({ activite })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/activites/:id
router.put('/:id', autoriser('pedagogie.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  const corps = req.body ?? {}
  const erreurs = validerMiseAJourActivite(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

  try {
    const activite = await modifierActivite(id, corps)
    if (!activite) return res.status(404).json({ message: 'Activité introuvable.' })
    res.json({ activite })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// DELETE /api/activites/:id
router.delete('/:id', autoriser('pedagogie.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  try {
    // Refusé (409) si l'activité a des versions
    const supprimee = await supprimerActivite(id)
    if (!supprimee) return res.status(404).json({ message: 'Activité introuvable.' })
    res.json({ message: 'Activité supprimée.' })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/activites/:id/versions
router.post('/:id/versions', autoriser('pedagogie.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  const corps = req.body ?? {}
  const erreurs = validerVersionActivite(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

  try {
    const version = await creerVersionActivite(id, corps)
    if (!version) return res.status(404).json({ message: 'Activité introuvable.' })
    res.status(201).json({ version })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/activites/versions/:idVersion
// Une version publiée est refusée par le trigger trg_version_activite_immuable : 409
router.put('/versions/:idVersion', autoriser('pedagogie.gerer'), async (req, res) => {
  const idVersion = idValide(req.params.idVersion)
  if (!idVersion) return res.status(400).json({ message: 'Identifiant invalide.' })

  const corps = req.body ?? {}
  const erreurs = validerVersionActivite(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

  try {
    const version = await modifierVersionActivite(idVersion, corps)
    if (!version) return res.status(404).json({ message: 'Version introuvable.' })
    res.json({ version })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/activites/versions/:idVersion/publier
router.post('/versions/:idVersion/publier', autoriser('pedagogie.gerer'), async (req, res) => {
  const idVersion = idValide(req.params.idVersion)
  if (!idVersion) return res.status(400).json({ message: 'Identifiant invalide.' })

  try {
    const version = await publierVersionActivite(idVersion, req.utilisateur.id)
    res.json({ version })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/activites/:id : une activité et ses versions
router.get('/:id', autoriser('pedagogie.lire'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  try {
    const resultat = await trouverActivite(id)
    if (!resultat) return res.status(404).json({ message: 'Activité introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// DELETE /api/activites/versions/:idVersion : brouillon uniquement
router.delete('/versions/:idVersion', autoriser('pedagogie.gerer'), async (req, res) => {
  const idVersion = idValide(req.params.idVersion)
  if (!idVersion) return res.status(400).json({ message: 'Identifiant invalide.' })

  try {
    const supprimee = await supprimerVersionActivite(idVersion)
    if (!supprimee) return res.status(404).json({ message: 'Version introuvable.' })
    res.json({ message: 'Version supprimée.' })
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router