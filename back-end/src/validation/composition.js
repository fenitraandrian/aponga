export function validerAjoutComposition(corps) {
  const erreurs = []
  if (!Number.isInteger(corps.id_version_activite)) {
    erreurs.push("La version d'activité est obligatoire.")
  }
  if (corps.ordre !== undefined && !(Number.isInteger(corps.ordre) && corps.ordre >= 0)) {
    erreurs.push("L'ordre doit être un entier positif ou nul.")
  }
  if (corps.obligatoire !== undefined && typeof corps.obligatoire !== 'boolean') {
    erreurs.push('« obligatoire » doit être vrai ou faux.')
  }
  return erreurs
}

export function validerMiseAJourComposition(corps) {
  const erreurs = []
  if (corps.ordre === undefined && corps.obligatoire === undefined) {
    erreurs.push('Indiquez au moins un champ à modifier.')
  }
  if (corps.ordre !== undefined && !(Number.isInteger(corps.ordre) && corps.ordre >= 0)) {
    erreurs.push("L'ordre doit être un entier positif ou nul.")
  }
  if (corps.obligatoire !== undefined && typeof corps.obligatoire !== 'boolean') {
    erreurs.push('« obligatoire » doit être vrai ou faux.')
  }
  return erreurs
}