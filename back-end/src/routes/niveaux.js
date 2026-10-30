import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { validerNiveau } from '../validation/niveaux.js'
import {
  listerNiveaux, trouverNiveau, creerNiveau, modifierNiveau, supprimerNiveau,
} from '../services/niveaux.js'
import { repondreErreur, idValide } from '../http/outils.js'

const router = Router()
router.use(authentifier)

router.get('/', autoriser('pedagogie.lire'), async (req, res) => {
  try {
    res.json({ niveaux: await listerNiveaux() })
  } catch (err) {
    repondreErreur(res, err)
  }
})

router.get('/:id', autoriser('pedagogie.lire'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const niveau = await trouverNiveau(id)
    if (!niveau) return res.status(404).json({ message: 'Niveau introuvable.' })
    res.json({ niveau })
  } catch (err) {
    repondreErreur(res, err)
  }
})

router.post('/', autoriser('pedagogie.gerer'), async (req, res) => {
  const corps = req.body ?? {}
  const erreurs = validerNiveau(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })
  try {
    res.status(201).json({ niveau: await creerNiveau(corps) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

router.put('/:id', autoriser('pedagogie.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  const corps = req.body ?? {}
  const erreurs = validerNiveau(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })
  try {
    const niveau = await modifierNiveau(id, corps)
    if (!niveau) return res.status(404).json({ message: 'Niveau introuvable.' })
    res.json({ niveau })
  } catch (err) {
    repondreErreur(res, err)
  }
})

router.delete('/:id', autoriser('pedagogie.gerer'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const supprime = await supprimerNiveau(id)
    if (!supprime) return res.status(404).json({ message: 'Niveau introuvable.' })
    res.json({ message: 'Niveau supprimé.' })
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router