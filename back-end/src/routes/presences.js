import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { repondreErreur, idValide } from '../http/outils.js'
import { trouverIdMembreActif } from '../services/pedagogie.js'
import { listerPresences, marquerPresences, listerMesPresences } from '../services/presences.js'

const router = Router()

// GET /api/presences/seances/:id
router.get('/seances/:id', authentifier, autoriser('presences.lire'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const resultat = await listerPresences(id)
    if (!resultat) return res.status(404).json({ message: 'Séance introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/presences/seances/:id
// body : { "presences": [ { "id_membre": 12, "present": true }, ... ] }
router.put('/seances/:id', authentifier, autoriser('presences.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  const presences = req.body?.presences
  const valides = Array.isArray(presences) && presences.length > 0 && presences.every(
    (p) => idValide(p.id_membre) && typeof p.present === 'boolean'
  )
  if (!valides) {
    return res.status(400).json({ message: 'Indiquez, pour chaque apprenant, s\'il est présent ou absent.' })
  }

  try {
    const idFormateur = await trouverIdMembreActif(req.utilisateur.id)
    res.json(await marquerPresences(id, idFormateur, presences))
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/presences/mes
router.get('/mes', authentifier, autoriser('inscriptions.soi'), async (req, res) => {
  try {
    const idMembre = await trouverIdMembreActif(req.utilisateur.id)
    res.json({ presences: await listerMesPresences(idMembre) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router