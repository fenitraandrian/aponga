const LONGUEUR_MAX = 100
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validerMiseAJourEnseignant(corps) {
  const erreurs = []
  if ('nom' in corps && (typeof corps.nom !== 'string' || !corps.nom.trim() || corps.nom.trim().length > LONGUEUR_MAX)) {
    erreurs.push(`Le nom doit contenir entre 1 et ${LONGUEUR_MAX} caractères.`)
  }
  if ('prenom' in corps && (typeof corps.prenom !== 'string' || !corps.prenom.trim() || corps.prenom.trim().length > LONGUEUR_MAX)) {
    erreurs.push(`Le prénom doit contenir entre 1 et ${LONGUEUR_MAX} caractères.`)
  }
  if ('email' in corps && corps.email && !REGEX_EMAIL.test(corps.email.trim())) {
    erreurs.push("L'adresse e-mail n'est pas valide.")
  }
  return erreurs
}

export function validerAffectationEnseignant(corps) {
  if (!Number.isInteger(corps.id_etude)) {
    return ["L'unité est obligatoire."]
  }
  return []
}