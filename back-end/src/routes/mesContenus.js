import path from 'node:path'
import { Router } from 'express'
import { authentifier } from '../middlewares/authentifier.js'
import { autoriser } from '../middlewares/autoriser.js'
import { repondreErreur, idValide } from '../http/outils.js'
import { trouverIdMembreActif } from '../services/pedagogie.js'
import { DOSSIER, trouverFichier } from '../services/contenus.js'
import { listerMesContenus, peutAccederFichier } from '../services/mesContenus.js'
import { telechargementAutorise } from '../services/reglesTelechargement.js'

const router = Router()

// GET /api/mes-contenus/seances/:id
router.get('/seances/:id', authentifier, autoriser('inscriptions.soi'), async (req, res) => {
  const idSeance = idValide(req.params.id)
  if (!idSeance) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const idMembre = await trouverIdMembreActif(req.utilisateur.id)
    const contenus = await listerMesContenus(idMembre, idSeance)
    if (!contenus) {
      return res.status(403).json({
        message: 'Les contenus sont accessibles une fois la séance commencée, et seulement si vous y êtes inscrit.',
      })
    }
    res.json({ contenus })
  } catch (err) {
    repondreErreur(res, err)
  }
})

//  début (règles de téléchargement)
// GET /api/mes-contenus/fichiers/:id/telecharger
router.get('/fichiers/:id/telecharger', authentifier, autoriser('inscriptions.soi'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const idMembre = await trouverIdMembreActif(req.utilisateur.id)
    if (!(await peutAccederFichier(idMembre, id))) {
      return res.status(403).json({ message: "Vous n'avez pas accès à ce fichier." })
    }
    const fichier = await trouverFichier(id)
    if (!fichier) return res.status(404).json({ message: 'Fichier introuvable.' })
    if (!(await telechargementAutorise(fichier.nom_stocke))) {
      return res.status(403).json({ message: "Le téléchargement de ce type de document n'est pas autorisé." })
    }
    res.download(path.join(DOSSIER, fichier.nom_stocke), fichier.nom_original)
  } catch (err) {
    repondreErreur(res, err)
  }
})

// GET /api/mes-contenus/fichiers/:id/lire : lecture dans le navigateur (audio et vidéo)
router.get('/fichiers/:id/lire', authentifier, autoriser('inscriptions.soi'), async (req, res) => {
  const id = idValide(req.params.id)
  if (!id) return res.status(400).json({ message: 'Identifiant invalide.' })
  try {
    const idMembre = await trouverIdMembreActif(req.utilisateur.id)
    if (!(await peutAccederFichier(idMembre, id))) {
      return res.status(403).json({ message: "Vous n'avez pas accès à ce fichier." })
    }
    const fichier = await trouverFichier(id)
    if (!fichier) return res.status(404).json({ message: 'Fichier introuvable.' })
    // sendFile prend en charge les requêtes par plage : on peut avancer dans la piste
    res.sendFile(path.join(DOSSIER, fichier.nom_stocke))
  } catch (err) {
    repondreErreur(res, err)
  }
})

export default router