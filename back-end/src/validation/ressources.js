export const TYPES_MEDIA = ['video', 'pdf', 'audio', 'image', 'lien']
const LONGUEUR_TITRE_MAX = 200

function urlValide(url) {
  return typeof url === 'string' && /^https?:\/\/\S+$/i.test(url.trim())
}

// function titreValide(titre) {
//   return titre === undefined || titre === null
//     || (typeof titre === 'string' && titre.length <= LONGUEUR_TITRE_MAX)
// }

function titreObligatoire(titre) {
  return typeof titre === 'string'
    && titre.trim().length > 0
    && titre.trim().length <= LONGUEUR_TITRE_MAX
}

function dureeValide(duree) {
  return duree === undefined || duree === null || (Number.isInteger(duree) && duree > 0)
}

function ordreValide(ordre) {
  return ordre === undefined || (Number.isInteger(ordre) && ordre >= 0)
}

export function validerAjoutRessource(corps) {
  const erreurs = []
  if (!TYPES_MEDIA.includes(corps.type_media)) {
    erreurs.push(`Le type doit être l'un de : ${TYPES_MEDIA.join(', ')}.`)
  }
  if (!urlValide(corps.url)) {
    erreurs.push("L'adresse doit commencer par http:// ou https://.")
  }
  if (!titreObligatoire(corps.titre)) {
    erreurs.push(`Le titre est obligatoire (${LONGUEUR_TITRE_MAX} caractères maximum).`)
  }
  if (!dureeValide(corps.duree_secondes)) {
    erreurs.push('La durée doit être un nombre entier de secondes, supérieur à 0.')
  }
  if (!ordreValide(corps.ordre)) {
    erreurs.push("L'ordre doit être un entier positif ou nul.")
  }
  return erreurs
}

export function validerMiseAJourRessource(corps) {
  const erreurs = []
  if ('type_media' in corps) {
    erreurs.push('Le type de média ne peut pas être modifié : supprimez la ressource et recréez-la.')
  }
  if ('url' in corps && !urlValide(corps.url)) {
    erreurs.push("L'adresse doit commencer par http:// ou https://.")
  }
  if ('titre' in corps && !titreObligatoire(corps.titre)) {
    erreurs.push(`Le titre doit contenir entre 1 et ${LONGUEUR_TITRE_MAX} caractères.`)
  }
  if ('duree_secondes' in corps && !dureeValide(corps.duree_secondes)) {
    erreurs.push('La durée doit être un nombre entier de secondes, supérieur à 0.')
  }
  if ('ordre' in corps && !ordreValide(corps.ordre)) {
    erreurs.push("L'ordre doit être un entier positif ou nul.")
  }
  return erreurs
}