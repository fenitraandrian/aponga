const LONGUEUR_NOM_MAX = 100

export function validerNiveau(corps) {
  const erreurs = []
  if (typeof corps.nom !== 'string' || corps.nom.trim().length === 0 || corps.nom.trim().length > LONGUEUR_NOM_MAX) {
    erreurs.push(`Le nom est obligatoire (${LONGUEUR_NOM_MAX} caractères maximum).`)
  }
  if (!Number.isInteger(corps.ordre) || corps.ordre < 0) {
    erreurs.push("L'ordre doit être un entier positif ou nul.")
  }
  return erreurs
}