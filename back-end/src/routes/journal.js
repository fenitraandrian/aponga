import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { repondreErreur } from '../http/outils.js'
import { listerJournal, listerEntites } from '../services/journal.js'

const router = Router()
router.use(authentifier)

const METHODES = ['POST', 'PUT', 'PATCH', 'DELETE']

// GET /api/journal?du=&au=&methode=&entite=&utilisateur=&page=&taille=
router.get('/', autoriser('journal.lire'), async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const taille = Math.min(100, Math.max(1, Number(req.query.taille) || 20))
  const methode = METHODES.includes(req.query.methode) ? req.query.methode : null

  try {
    res.json(
      await listerJournal({
        du: req.query.du,
        au: req.query.au,
        methode,
        entite: req.query.entite,
        utilisateur: req.query.utilisateur?.trim(),
        page,
        taille,
      })
    )
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/journal/entites : valeurs proposées dans le filtre « section »
router.get('/entites', autoriser('journal.lire'), async (req, res) => {
  try {
    res.json({ entites: await listerEntites() })
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router