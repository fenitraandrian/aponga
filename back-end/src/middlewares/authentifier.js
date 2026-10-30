import { NOM_COOKIE, trouverUtilisateurParJeton } from '../services/sessions.js'

export async function authentifier(req, res, next) {
  const jeton = req.cookies?.[NOM_COOKIE]

  if (!jeton) {
    return res.status(401).json({ message: 'Non connecté.' })
  }

  try {
    const utilisateur = await trouverUtilisateurParJeton(jeton)
    if (!utilisateur) {
      return res.status(401).json({ message: 'Session expirée ou invalide.' })
    }
    req.utilisateur = utilisateur
    next()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
  }
}