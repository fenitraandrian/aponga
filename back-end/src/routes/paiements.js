import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { repondreErreur, idValide } from '../http/outils.js'
// import { enregistrerPaiement } from '../services/paiements.js'
import { enregistrerPaiement, listerMembres, listerNiveaux, definirTarif, listerPaiements ,  } from '../services/paiements.js'
import {  listerTypesAbonnement} from '../services/abonnements.js'

const router = Router()
router.use(authentifier)

// POST /api/paiements  body : { id_membre, id_niveau, montant }
router.post('/', autoriser('paiements.gerer'), async (req, res) => {
  const idMembre = idValide(req.body?.id_membre)
  const idNiveau = idValide(req.body?.id_niveau)
  const idTypeAbonnement  = idValide(req.body?.id_type_abonnement)
  const montant = Number(req.body?.montant)

  if (!idMembre || !idNiveau|| !idTypeAbonnement  || !Number.isFinite(montant) || montant <= 0) {
    return res.status(400).json({
      message: 'Apprenant, niveau, type d\'abonnement  et montant (supérieur à 0) sont obligatoires.',
    })
  }

  try {
    const resultat = await enregistrerPaiement({
      idMembre,
      idNiveau,
      montant,
      idTypeAbonnement,
      idUtilisateur: req.utilisateur.id,
    })
    res.status(201).json({
      paiement: resultat.paiement,
      nombreSeances: resultat.nombreSeances,
      reste: resultat.reste,
    })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/paiements/membres
router.get('/membres', autoriser('paiements.gerer'), async (req, res) => {
  try {
    res.json({ membres: await listerMembres() })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/paiements/niveaux : niveaux avec leur tarif
router.get('/niveaux', autoriser('paiements.gerer'), async (req, res) => {
  try {
    res.json({ niveaux: await listerNiveaux() })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// PUT /api/paiements/tarifs/:idNiveau  body : { prix }
router.put('/tarifs/:idNiveau', autoriser('paiements.gerer'), async (req, res) => {
  const idNiveau = idValide(req.params.idNiveau)
  const prix = Number(req.body?.prix)
  if (!idNiveau || !Number.isFinite(prix) || prix <= 0) {
    return res.status(400).json({ message: 'Niveau et prix (supérieur à 0) sont obligatoires.' })
  }
  try {
    res.json({ tarif: await definirTarif(idNiveau, prix) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/paiements?membre=ID : historique
router.get('/', autoriser('paiements.gerer'), async (req, res) => {
  try {
    const idMembre = idValide(req.query.membre) || null
    res.json({ paiements: await listerPaiements({ idMembre }) })
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/paiements/types
router.get('/types', autoriser('paiements.gerer'), async (req, res) => {
  try {
    res.json({ types: await listerTypesAbonnement() })
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router