import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { repondreErreur, idValide } from '../http/outils.js'
import {
  validerAjoutComposition,
  validerMiseAJourComposition,
} from '../validation/composition.js'
import {
  listerComposition,
  ajouterAuComposition,
  modifierComposition,
  retirerDuComposition,
} from '../services/pedagogie.js'

const router = Router()
router.use(authentifier)

// GET /api/etudes/versions/:idVersion/composition
router.get('/versions/:idVersion/composition', autoriser('pedagogie.lire'), async (req, res) => {
  const idVersion = idValide(req.params.idVersion)
  if (!idVersion) return res.status(400).json({ message: 'Identifiant invalide.' })

  try {
    const composition = await listerComposition(idVersion)
    if (!composition) return res.status(404).json({ message: 'Version introuvable.' })
    res.json({ composition })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// POST /api/etudes/versions/:idVersion/composition
router.post('/versions/:idVersion/composition', autoriser('pedagogie.gerer'), async (req, res) => {
  const idVersion = idValide(req.params.idVersion)
  if (!idVersion) return res.status(400).json({ message: 'Identifiant invalide.' })

  const corps = req.body ?? {}
  const erreurs = validerAjoutComposition(corps)
  if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

  try {
    const ligne = await ajouterAuComposition(idVersion, corps)
    res.status(201).json({ composition: ligne })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/etudes/versions/:idVersion/composition/:idVersionActivite
router.put(
  '/versions/:idVersion/composition/:idVersionActivite',
  autoriser('pedagogie.gerer'),
  async (req, res) => {
    const idVersion = idValide(req.params.idVersion)
    const idVersionActivite = idValide(req.params.idVersionActivite)
    if (!idVersion || !idVersionActivite) {
      return res.status(400).json({ message: 'Identifiant invalide.' })
    }

    const corps = req.body ?? {}
    const erreurs = validerMiseAJourComposition(corps)
    if (erreurs.length) return res.status(400).json({ message: erreurs.join(' ') })

    try {
      const ligne = await modifierComposition(idVersion, idVersionActivite, corps)
      if (!ligne) return res.status(404).json({ message: 'Cette activité ne fait pas partie de la composition.' })
      res.json({ composition: ligne })
    } catch (err) {
      repondreErreur(res, err)
    }
  }
)

// DELETE /api/etudes/versions/:idVersion/composition/:idVersionActivite
router.delete(
  '/versions/:idVersion/composition/:idVersionActivite',
  autoriser('pedagogie.gerer'),
  async (req, res) => {
    const idVersion = idValide(req.params.idVersion)
    const idVersionActivite = idValide(req.params.idVersionActivite)
    if (!idVersion || !idVersionActivite) {
      return res.status(400).json({ message: 'Identifiant invalide.' })
    }

    try {
      const retiree = await retirerDuComposition(idVersion, idVersionActivite)
      if (!retiree) return res.status(404).json({ message: 'Cette activité ne fait pas partie de la composition.' })
      res.json({ message: 'Activité retirée de la composition.' })
    } catch (err) {
      repondreErreur(res, err)
    }
  }
)

export default router