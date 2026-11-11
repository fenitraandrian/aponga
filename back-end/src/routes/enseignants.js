import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { validerMiseAJourEnseignant, validerAffectationEnseignant } from '../validation/enseignants.js'
import {
  listerEnseignants,
  trouverEnseignant,
  modifierEnseignant,
  affecterEnseignant,
  retirerEnseignant,
} from '../services/enseignants.js'
import { repondreErreur, idValide } from '../http/outils.js'

const router = Router()
router.use(authentifier)

// GET /api/enseignants
router.get('/', autoriser('enseignants.lire'), async (req, res) => {
  try {
    res.json({ enseignants: await listerEnseignants() })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/enseignants/:id
router.get('/:id', autoriser('enseignants.lire'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const resultat = await trouverEnseignant(id)
    if (!resultat) return res.status(404).json({ message: 'Enseignant introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/enseignants/:id
router.put('/:id', autoriser('enseignants.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  const corps = req.body ?? {}
  const erreurs = validerMiseAJourEnseignant(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })
  try {
    const resultat = await modifierEnseignant(id, corps)
    if (!resultat) return res.status(404).json({ message: 'Enseignant introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/enseignants/:id/affectations   body : { "id_etude": 5 }
router.post('/:id/affectations', autoriser('enseignants.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  const corps = req.body ?? {}
  const erreurs = validerAffectationEnseignant(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })
  try {
    const resultat = await affecterEnseignant(id, corps.id_etude)
    if (!resultat) return res.status(404).json({ message: 'Enseignant introuvable.' })
    res.status(201).json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// DELETE /api/enseignants/:id/affectations/:idEtude
router.delete('/:id/affectations/:idEtude', autoriser('enseignants.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  const idEtude = idValide(req.params.idEtude)
  if (!id || !idEtude) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const resultat = await retirerEnseignant(id, idEtude)
    if (!resultat) return res.status(404).json({ message: 'Enseignant introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router