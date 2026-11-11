import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { repondreErreur, idValide } from '../http/outils.js'
import { trouverIdMembreActif } from '../services/pedagogie.js'
import { listerInscrits, inscrire, desinscrire } from '../services/inscriptions.js'

const router = Router()

// GET /api/seances/:id/inscriptions
router.get('/:id/inscriptions', authentifier, autoriser('inscriptions.lire'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const resultat = await listerInscrits(id)
    if (!resultat) return res.status(404).json({ message: 'Séance introuvable.' })
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/seances/:id/inscriptions   body : { "id_membre": 12 }
router.post('/:id/inscriptions', authentifier, autoriser('inscriptions.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  const idMembre = idValide(req.body?.id_membre)
  if (!id || !idMembre) {
    return res.status(400).json({ message: 'La séance et l\'apprenant sont obligatoires.' })
  }
  try {
    const idAuteur = await trouverIdMembreActif(req.utilisateur.id)
    const resultat = await inscrire(id, idMembre, idAuteur)
    res.status(201).json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// DELETE /api/seances/:id/inscriptions/:idMembre
router.delete('/:id/inscriptions/:idMembre', authentifier, autoriser('inscriptions.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  const idMembre = idValide(req.params.idMembre)
  if (!id || !idMembre) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const resultat = await desinscrire(id, idMembre)
    res.json(resultat)
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router