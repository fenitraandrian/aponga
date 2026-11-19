import { Router } from 'express'
import { repondreErreur, idValide } from '../http/outils.js'
import { listerParcours, unitesDuParcours, corrigerQuiz } from '../services/essai.js'

const router = Router()

// GET /api/essai/parcours
router.get('/parcours', async (req, res) => {
  try {
    res.json({ parcours: await listerParcours() })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/essai/parcours/:code/unites
router.get('/parcours/:code/unites', async (req, res) => {
  try {
    const resultat = await unitesDuParcours(req.params.code)
    if (!resultat) return res.status(404).json({ message: 'Parcours introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/essai/unites/:id/corriger
// body : { "reponses": [ { "id_question": 1, "id_choix": 3 } ] }
router.post('/unites/:id/corriger', async (req, res) => {
  const id = idValide(req.params.id)
  const reponses = req.body?.reponses
  const valides =
    Array.isArray(reponses) &&
    reponses.every((r) => idValide(r.id_question) && idValide(r.id_choix))
  if (!id || !valides) {
    return res.status(400).json({ message: 'Réponses invalides.' })
  }
  try {
    res.json(await corrigerQuiz(id, reponses))
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router