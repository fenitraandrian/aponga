const TYPES_ETUDE = ['formation', 'unite']
const LONGUEUR_TITRE_MAX = 200
const CHAMPS_IDENTIFIANTS = ['id_categorie', 'id_niveau', 'id_niveau_prerequis']
const LONGUEUR_DESCRIPTION_MAX = 2000

function titreValide(titre) {
  return typeof titre === 'string'
    && titre.trim().length > 0
    && titre.trim().length <= LONGUEUR_TITRE_MAX
}

function identifiantValide(valeur) {
  return valeur === null || valeur === undefined || Number.isInteger(valeur)
}

function ordreValide(valeur) {
  return Number.isInteger(valeur) && valeur >= 0
}

function descriptionValide(description) {
  return description === undefined
    || description === null
    || (typeof description === 'string' && description.length <= LONGUEUR_DESCRIPTION_MAX)
}

export function validerCreationEtude(corps) {
  const erreurs = []

  if (!TYPES_ETUDE.includes(corps.type_etude)) {
    erreurs.push('Le type doit être « formation » ou « unite ».')
  }
  if (!titreValide(corps.titre)) {
    erreurs.push(`Le titre est obligatoire (${LONGUEUR_TITRE_MAX} caractères maximum).`)
  }
  // Règle de hiérarchie, aussi vérifiée par la contrainte chk_etude_hierarchie
  if (corps.type_etude === 'formation' && corps.id_parent != null) {
    erreurs.push('Une formation ne peut pas avoir de formation parente.')
  }
  if (corps.type_etude === 'unite' && !Number.isInteger(corps.id_parent)) {
    erreurs.push('Une unité doit être rattachée à une formation.')
  }
  if (corps.ordre !== undefined && !ordreValide(corps.ordre)) {
    erreurs.push("L'ordre doit être un entier positif ou nul.")
  }
  for (const champ of CHAMPS_IDENTIFIANTS) {
    if (!identifiantValide(corps[champ])) {
      erreurs.push(`« ${champ} » doit être un identifiant entier.`)
    }
  }

  if (!descriptionValide(corps.description)) {
    erreurs.push(`La description ne doit pas dépasser ${LONGUEUR_DESCRIPTION_MAX} caractères.`)
  }

  if (corps.type_etude === 'unite' && (corps.id_niveau == null)) {
    erreurs.push("Une unité doit avoir un niveau.")
  }
  if (corps.type_etude === 'formation' && (corps.id_niveau != null || corps.id_niveau_prerequis != null)) {
    erreurs.push("Une formation n'a pas de niveau : indiquez le niveau sur chacune de ses unités.")
  }

  return erreurs
}

export function validerMiseAJourEtude(corps) {
  const erreurs = []

  // La nature d'une étude et son parent ne se modifient pas
  for (const champ of ['type_etude', 'id_parent']) {
    if (champ in corps) {
      erreurs.push(`« ${champ} » ne peut pas être modifié.`)
    }
  }
  if ('titre' in corps && !titreValide(corps.titre)) {
    erreurs.push(`Le titre doit contenir entre 1 et ${LONGUEUR_TITRE_MAX} caractères.`)
  }
  if ('ordre' in corps && !ordreValide(corps.ordre)) {
    erreurs.push("L'ordre doit être un entier positif ou nul.")
  }
  for (const champ of CHAMPS_IDENTIFIANTS) {
    if (champ in corps && !identifiantValide(corps[champ])) {
      erreurs.push(`« ${champ} » doit être un identifiant entier.`)
    }
  }

  if ('description' in corps && !descriptionValide(corps.description)) {
    erreurs.push(`La description ne doit pas dépasser ${LONGUEUR_DESCRIPTION_MAX} caractères.`)
  }

  return erreurs
}

export function validerVersion(corps) {
  const erreurs = []

  if (!titreValide(corps.titre)) {
    erreurs.push(`Le titre de la version est obligatoire (${LONGUEUR_TITRE_MAX} caractères maximum).`)
  }
  if (corps.description != null && typeof corps.description !== 'string') {
    erreurs.push('La description doit être un texte.')
  }

  return erreurs
}

