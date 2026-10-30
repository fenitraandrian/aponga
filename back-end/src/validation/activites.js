const LONGUEUR_TITRE_MAX = 200
const LONGUEUR_DESCRIPTION_MAX = 2000

function texteObligatoire(valeur) {
  return typeof valeur === 'string'
    && valeur.trim().length > 0
    && valeur.trim().length <= LONGUEUR_TITRE_MAX
}

function descriptionValide(valeur) {
  return valeur === undefined
    || valeur === null
    || (typeof valeur === 'string' && valeur.length <= LONGUEUR_DESCRIPTION_MAX)
}

function dureeValide(valeur) {
  return valeur === undefined || valeur === null || (Number.isInteger(valeur) && valeur > 0)
}

export function validerCreationActivite(corps) {
  const erreurs = []
  if (!Number.isInteger(corps.id_etude)) {
    erreurs.push("L'unité de rattachement est obligatoire.")
  }
  if (typeof corps.code_type_activite !== 'string' || !corps.code_type_activite.trim()) {
    erreurs.push("Le type d'activité est obligatoire.")
  }
  if (!texteObligatoire(corps.titre)) {
    erreurs.push(`Le titre est obligatoire (${LONGUEUR_TITRE_MAX} caractères maximum).`)
  }
  if (!descriptionValide(corps.description)) {
    erreurs.push(`La description ne doit pas dépasser ${LONGUEUR_DESCRIPTION_MAX} caractères.`)
  }
  return erreurs
}

export function validerMiseAJourActivite(corps) {
  const erreurs = []
  for (const champ of ['id_etude', 'code_type_activite']) {
    if (champ in corps) erreurs.push(`« ${champ} » ne peut pas être modifié.`)
  }
  if ('titre' in corps && !texteObligatoire(corps.titre)) {
    erreurs.push(`Le titre doit contenir entre 1 et ${LONGUEUR_TITRE_MAX} caractères.`)
  }
  if ('description' in corps && !descriptionValide(corps.description)) {
    erreurs.push(`La description ne doit pas dépasser ${LONGUEUR_DESCRIPTION_MAX} caractères.`)
  }
  return erreurs
}

export function validerVersionActivite(corps) {
  const erreurs = []
  if (!texteObligatoire(corps.titre_version)) {
    erreurs.push('Le titre de la version est obligatoire.')
  }
  if (!descriptionValide(corps.description)) {
    erreurs.push(`La description ne doit pas dépasser ${LONGUEUR_DESCRIPTION_MAX} caractères.`)
  }
  if (!dureeValide(corps.duree_estimee_min)) {
    erreurs.push('La durée estimée doit être un nombre entier de minutes, supérieur à 0.')
  }
  return erreurs
}