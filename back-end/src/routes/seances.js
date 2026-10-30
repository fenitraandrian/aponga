import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { validerSeance } from '../validation/seances.js'
import {
  listerSeances,
  trouverSeance,
  creerSeance,
  modifierSeance,
  supprimerSeance,
  listerEnseignants,
} from '../services/seances.js'
import { repondreErreur, idValide } from '../http/outils.js'

const router = Router()
router.use(authentifier)

// GET /api/seances?du=...&au=...
router.get('/', autoriser('seances.lire'), async (req, res) => {
  try {
    res.json({ seances: await listerSeances(req.query.du, req.query.au) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

//  (liste des enseignants)
// GET /api/seances/enseignants
router.get('/enseignants', autoriser('seances.lire'), async (req, res) => {
  try {
    res.json({ enseignants: await listerEnseignants() })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/seances/:id
router.get('/:id', autoriser('seances.lire'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const seance = await trouverSeance(id)
    if (!seance) return res.status(404).json({ message: 'Séance introuvable.' })
    res.json({ seance })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/seances
router.post('/', autoriser('seances.gerer'), async (req, res) => {
  const corps = req.body ?? {}
  const erreurs = validerSeance(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })
  try {
    res.status(201).json({ seance: await creerSeance(corps) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/seances/:id
router.put('/:id', autoriser('seances.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  const corps = req.body ?? {}
  const erreurs = validerSeance(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })
  try {
    const seance = await modifierSeance(id, corps)
    if (!seance) return res.status(404).json({ message: 'Séance introuvable.' })
    res.json({ seance })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// DELETE /api/seances/:id
router.delete('/:id', autoriser('seances.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const supprimee = await supprimerSeance(id)
    if (!supprimee) return res.status(404).json({ message: 'Séance introuvable.' })
    res.json({ message: 'Séance supprimée.' })
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router