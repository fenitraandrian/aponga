import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { repondreErreur, idValide } from '../http/outils.js'
import {
  validerAjoutRessource,
  validerMiseAJourRessource,
} from '../validation/ressources.js'
import {
  listerRessources,
  ajouterRessource,
  modifierRessource,
  supprimerRessource,
} from '../services/pedagogie.js'

const router = Router()
router.use(authentifier)

// GET /api/activites/versions/:idVersion/ressources
router.get('/versions/:idVersion/ressources', autoriser('pedagogie.lire'), async (req, res) => {
  const idVersion = idValide(req.params.idVersion)
  if (!idVersion) return res.status(400).json({ message: 'Identifiant invalide.' })

  try {
    const ressources = await listerRessources(idVersion)
    if (!ressources) return res.status(404).json({ message: 'Version introuvable.' })
    res.json({ ressources })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/activites/versions/:idVersion/ressources
router.post('/versions/:idVersion/ressources', autoriser('pedagogie.gerer'), async (req, res) => {
  const idVersion = idValide(req.params.idVersion)
  if (!idVersion) return res.status(400).json({ message: 'Identifiant invalide.' })

  const corps = req.body ?? {}
  const erreurs = validerAjoutRessource(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

  try {
    const ressource = await ajouterRessource(idVersion, corps)
    res.status(201).json({ ressource })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/activites/ressources/:id
router.put('/ressources/:id', autoriser('pedagogie.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  const corps = req.body ?? {}
  const erreurs = validerMiseAJourRessource(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

  try {
    const ressource = await modifierRessource(id, corps)
    if (!ressource) return res.status(404).json({ message: 'Ressource introuvable.' })
    res.json({ ressource })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// DELETE /api/activites/ressources/:id
router.delete('/ressources/:id', autoriser('pedagogie.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })

  try {
    const supprimee = await supprimerRessource(id)
    if (!supprimee) return res.status(404).json({ message: 'Ressource introuvable.' })
    res.json({ message: 'Ressource supprimée.' })
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router