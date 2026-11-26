import { NOM_COOKIE, trouverUtilisateurParJeton } from '../services/sessions.js'
import { enregistrerAction } from '../services/journal.js'

const METHODES_ECRITURE = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const CLES_SENSIBLES = /mot.?de.?passe|password|jeton|token/i

// Masque les valeurs sensibles avant de les écrire dans le journal
function nettoyer(corps) {
  if (!corps || typeof corps !== 'object') return null
  const propre = {}
  for (const [cle, valeur] of Object.entries(corps)) {
    propre[cle] = CLES_SENSIBLES.test(cle) ? '[masqué]' : valeur
  }
  return propre
}

// Enregistre chaque écriture réussie. Les erreurs ne sont pas journalisées.
export async function journaliserActions(req, res, next) {
  if (!METHODES_ECRITURE.has(req.method)) return next()

  // L'utilisateur est identifié avant la route : une déconnexion supprime la session
  let auteur = req.utilisateur ?? null
  const jeton = req.cookies?.[NOM_COOKIE]
  if (!auteur && jeton) {
    try {
      auteur = await trouverUtilisateurParJeton(jeton)
    } catch {
      auteur = null
    }
  }

  res.on('finish', () => {
    if (res.locals.journalise || res.statusCode >= 400) return
    const route = req.baseUrl + (req.route?.path ?? req.path)
    enregistrerAction({
      idUtilisateur: auteur?.id ?? null,
      methode: req.method,
      route,
      statut: res.statusCode,
      details: {
        corps: nettoyer(req.body),
        parametres: req.params,
        fichiers: req.files ? req.files.map((f) => f.originalname) : null,
      },
      ip: req.ip,
    }).catch((err) => console.error('Journal d\'activité :', err))
  })

  next()
}