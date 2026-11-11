import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { repondreErreur, idValide } from '../http/outils.js'
import { trouverIdMembreActif } from '../services/pedagogie.js'
import {
  inscrire,
  desinscrire,
  listerSeancesDisponibles,
  listerMesInscriptions,
} from '../services/inscriptions.js'

const router = Router()

// GET /api/mes-inscriptions/seances-disponibles
router.get('/seances-disponibles', authentifier, autoriser('inscriptions.soi'), async (req, res) => {
  try {
    const idMembre = await trouverIdMembreActif(req.utilisateur.id)
    res.json(await listerSeancesDisponibles(idMembre))
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/mes-inscriptions
router.get('/', authentifier, autoriser('inscriptions.soi'), async (req, res) => {
  try {
    const idMembre = await trouverIdMembreActif(req.utilisateur.id)
    res.json({ inscriptions: await listerMesInscriptions(idMembre) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/mes-inscriptions   body : { "id_seance": 7 }
router.post('/', authentifier, autoriser('inscriptions.soi'), async (req, res) => {
  const idSeance = idValide(req.body?.id_seance)
  if (!idSeance) return res.status(400).json({ message: 'La séance est obligatoire.' })
  try {
    const idMembre = await trouverIdMembreActif(req.utilisateur.id)
    const resultat = await inscrire(idSeance, idMembre, idMembre)
    res.status(201).json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// DELETE /api/mes-inscriptions/:idSeance
router.delete('/:idSeance', authentifier, autoriser('inscriptions.soi'), async (req, res) => {
  const idSeance = idValide(req.params.idSeance)
  if (!idSeance) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const idMembre = await trouverIdMembreActif(req.utilisateur.id)
    res.json(await desinscrire(idSeance, idMembre))
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router