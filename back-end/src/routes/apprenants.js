import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
// import { trouverIdMembreActif } from '../services/pedagogie.js'
import {
  validerMiseAJourApprenant,
  validerAffectation,
  validerStatutApprenant,
} from '../validation/apprenants.js'
import {
  listerApprenants,
  trouverApprenant,
  modifierApprenant,
  affecterNiveau,
  changerStatutApprenant,
} from '../services/apprenants.js'
import { repondreErreur, idValide } from '../http/outils.js'

const router = Router()
router.use(authentifier)

// GET /api/apprenants?q=...
router.get('/', autoriser('apprenants.lire'), async (req, res) => {
  try {
    res.json({ apprenants: await listerApprenants(req.query.q) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/apprenants/:id
router.get('/:id', autoriser('apprenants.lire'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const resultat = await trouverApprenant(id)
    if (!resultat) return res.status(404).json({ message: 'Apprenant introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/apprenants/:id
router.put('/:id', autoriser('apprenants.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  const corps = req.body ?? {}
  const erreurs = validerMiseAJourApprenant(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })
  try {
    const resultat = await modifierApprenant(id, corps)
    if (!resultat) return res.status(404).json({ message: 'Apprenant introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/apprenants/:id/niveau   body : { "id_niveau": 2 } ou { "id_niveau": null }
router.put('/:id/niveau', autoriser('apprenants.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  const corps = req.body ?? {}
  const erreurs = validerAffectation(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })
  try {
    const resultat = await affecterNiveau(id, corps.id_niveau)
    if (!resultat) return res.status(404).json({ message: 'Apprenant introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

router.put('/:id/statut', autoriser('apprenants.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  const corps = req.body ?? {}
  const erreurs = validerStatutApprenant(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })
  try {
    const resultat = await changerStatutApprenant(id, corps.statut)
    if (!resultat) return res.status(404).json({ message: 'Apprenant introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router