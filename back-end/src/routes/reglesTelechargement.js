import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { repondreErreur } from '../http/outils.js'
import { listerRegles, modifierRegle } from '../services/reglesTelechargement.js'

const router = Router()
const TYPES = ['pdf', 'image', 'audio', 'video']

// GET /api/regles-telechargement
router.get('/', authentifier, autoriser('telechargements.gerer'), async (req, res) => {
  try {
    res.json({ regles: await listerRegles() })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/regles-telechargement/:type   body : { "telechargeable": true }
router.put('/:type', authentifier, autoriser('telechargements.gerer'), async (req, res) => {
  const type = req.params.type
  if (!TYPES.includes(type)) return res.status(400).json({ message: 'Type de document inconnu.' })
  if (typeof req.body?.telechargeable !== 'boolean') {
    return res.status(400).json({ message: 'Indiquez true ou false.' })
  }
  try {
    res.json({ regles: await modifierRegle(type, req.body.telechargeable) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router