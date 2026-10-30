import { permissionsDeLUtilisateur } from '../services/permissions.js'

// Usage : autoriser('roles.gerer'). Il doit venir après authentifier.
export function autoriser(...permissionsRequises) {
  return async (req, res, next) => {
    try {
      const permissions = await permissionsDeLUtilisateur(req.utilisateur.id)
      const manque = permissionsRequises.some((p) => !permissions.includes(p))

      if (manque) {
        return res.status(403).json({ message: 'Accès refusé.' })
      }
      next()
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Erreur serveur, veuillez réessayer.' })
    }
  }
}