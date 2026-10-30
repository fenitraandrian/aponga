import { ErreurMetier } from '../services/pedagogie.js'

// Traduit les erreurs (métier ou base de données) en réponses HTTP
export function repondreErreur(res, err) {
  if (err instanceof ErreurMetier) {
    return res.status(err.statut).json({ message: err.message })
  }
  if (err.code === '23503') {
    return res.status(409).json({ message: 'Opération impossible : cet élément est lié à d\'autres données.' })
  }
  if (err.code === '23505') {
    const messages = {
      uq_etude_ordre_parent: 'Une autre unité de cette formation a déjà cet ordre.',
      uq_composition_ordre: 'Une autre activité de cette unité a déjà cet ordre.',
      uq_ressource_ordre: 'Une autre ressource de cette version a déjà cet ordre.',
      niveau_nom_key: 'Un niveau porte déjà ce nom.',
      niveau_ordre_key: 'Un niveau utilise déjà cet ordre.',
      utilisateur_email_key: 'Un utilisateur avec cet email existe déjà.',
      utilisateur_telephone_key: 'Un utilisateur avec ce téléphone existe déjà.',
      uq_affectation_active: 'Cet apprenant a déjà une affectation active.',
    }
    return res.status(409).json({ message: messages[err.constraint] ?? 'Cet élément existe déjà.' })
  }
  if (err.code === '23514') {
    return res.status(400).json({ message: 'Les données ne respectent pas une règle de la base.' })
  }
  if (err.code === 'P0001') {
    return res.status(409).json({ message: err.message })
  }
  console.error(err)
  return res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
}

// Lit un identifiant ; renvoie null s'il n'est pas valide
export function idValide(valeur) {
  const id = Number(valeur)
  return Number.isInteger(id) && id > 0 ? id : null
}