import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { repondreErreur, idValide } from '../http/outils.js'
import { listerSoldes, creerSolde, modifierSolde, supprimerSolde } from '../services/soldes.js'

const router = Router()
router.use(authentifier)

// Entier positif ou nul, sinon null
function soldeValide(valeur) {
  const n = Number(valeur)
  return Number.isInteger(n) && n >= 0 ? n : null
}

// GET /api/soldes
router.get('/', autoriser('soldes.gerer'), async (req, res) => {
  try {
    res.json({ soldes: await listerSoldes() })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/soldes  body : { id_membre, id_niveau, solde }
router.post('/', autoriser('soldes.gerer'), async (req, res) => {
  const idMembre = idValide(req.body?.id_membre)
  const idNiveau = idValide(req.body?.id_niveau)
  const solde = soldeValide(req.body?.solde)
  if (!idMembre || !idNiveau || solde === null) {
    return res.status(400).json({ message: 'Apprenant, niveau et solde (entier positif ou nul) sont obligatoires.' })
  }
  try {
    res.status(201).json({ solde: await creerSolde(idMembre, idNiveau, solde) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/soldes/:idMembre/:idNiveau  body : { solde }
router.put('/:idMembre/:idNiveau', autoriser('soldes.gerer'), async (req, res) => {
  const idMembre = idValide(req.params.idMembre)
  const idNiveau = idValide(req.params.idNiveau)
  const solde = soldeValide(req.body?.solde)
  if (!idMembre || !idNiveau || solde === null) {
    return res.status(400).json({ message: 'Identifiants ou solde invalides.' })
  }
  try {
    res.json({ solde: await modifierSolde(idMembre, idNiveau, solde) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// DELETE /api/soldes/:idMembre/:idNiveau
router.delete('/:idMembre/:idNiveau', autoriser('soldes.gerer'), async (req, res) => {
  const idMembre = idValide(req.params.idMembre)
  const idNiveau = idValide(req.params.idNiveau)
  if (!idMembre || !idNiveau) return res.status(400).json({ message: 'Identifiants invalides.' })
  try {
    await supprimerSolde(idMembre, idNiveau)
    res.json({ ok: true })
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router