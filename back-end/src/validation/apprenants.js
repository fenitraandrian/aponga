const LONGUEUR_MAX = 100
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function texteRequis(valeur) {
  return typeof valeur === 'string' && valeur.trim().length > 0 && valeur.trim().length <= LONGUEUR_MAX
}

function emailValide(valeur) {
  return valeur == null || valeur === '' || (typeof valeur === 'string' && REGEX_EMAIL.test(valeur.trim()))
}

function telephoneValide(valeur) {
  return valeur == null || valeur === '' || (typeof valeur === 'string' && valeur.trim().length <= 30)
}

function dateNaissanceValide(valeur) {
  if (valeur == null || valeur === '') return true
  if (typeof valeur !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false
  const aujourdhui = new Date().toISOString().slice(0, 10)
  return valeur <= aujourdhui
}

// export function validerCreationApprenant(corps) {
//   const erreurs = []
//   if (!texteRequis(corps.nom)) erreurs.push(`Le nom est obligatoire (${LONGUEUR_MAX} caractères maximum).`)
//   if (!texteRequis(corps.prenom)) erreurs.push(`Le prénom est obligatoire (${LONGUEUR_MAX} caractères maximum).`)
//   if (!emailValide(corps.email)) erreurs.push("L'adresse email n'est pas valide.")
//   if (!telephoneValide(corps.telephone)) erreurs.push('Le téléphone ne doit pas dépasser 30 caractères.')
//   // if (!corps.email?.trim() && !corps.telephone?.trim()) {
//   //   erreurs.push('Indiquez au moins un email ou un téléphone.')
//   // }
//   // MODIFICATION : début (l'email sert à se connecter)
//   if (!corps.email?.trim()) {
//     erreurs.push("L'adresse email est obligatoire : elle sert à se connecter.")
//   }
//   // MODIFICATION : fin
//   if (!dateNaissanceValide(corps.date_naissance)) {
//     erreurs.push('La date de naissance doit être une date passée, au format AAAA-MM-JJ.')
//   }
//   return erreurs
// }

export function validerMiseAJourApprenant(corps) {
  const erreurs = []
  if ('nom' in corps && !texteRequis(corps.nom)) erreurs.push(`Le nom doit contenir entre 1 et ${LONGUEUR_MAX} caractères.`)
  if ('prenom' in corps && !texteRequis(corps.prenom)) erreurs.push(`Le prénom doit contenir entre 1 et ${LONGUEUR_MAX} caractères.`)
  if ('email' in corps && !emailValide(corps.email)) erreurs.push("L'adresse email n'est pas valide.")
  if ('telephone' in corps && !telephoneValide(corps.telephone)) erreurs.push('Le téléphone ne doit pas dépasser 30 caractères.')
  if ('date_naissance' in corps && !dateNaissanceValide(corps.date_naissance)) {
    erreurs.push('La date de naissance doit être une date passée, au format AAAA-MM-JJ.')
  }
  return erreurs
}

export function validerAffectation(corps) {
  if (corps.id_niveau !== null && !Number.isInteger(corps.id_niveau)) {
    return ["Le niveau doit être un identifiant, ou vide pour retirer l'apprenant de son niveau."]
  }
  return []
}

export function validerStatutApprenant(corps) {
  if (corps.statut !== 'actif' && corps.statut !== 'suspendu') {
    return ['Le statut doit être « actif » ou « suspendu ».']
  }
  return []
}