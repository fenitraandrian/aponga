const LONGUEUR_TITRE_MAX = 200
const LONGUEUR_DESCRIPTION_MAX = 2000

export function validerConteneur(corps, { creation }) {
  const erreurs = []
  if (creation && !Number.isInteger(corps.id_etude)) {
    erreurs.push("L'unité est obligatoire.")
  }
  if (
    typeof corps.titre !== 'string' ||
    corps.titre.trim().length === 0 ||
    corps.titre.trim().length > LONGUEUR_TITRE_MAX
  ) {
    erreurs.push(`Le titre est obligatoire (${LONGUEUR_TITRE_MAX} caractères maximum).`)
  }
  if (
    corps.description != null &&
    (typeof corps.description !== 'string' || corps.description.length > LONGUEUR_DESCRIPTION_MAX)
  ) {
    erreurs.push(`La description ne doit pas dépasser ${LONGUEUR_DESCRIPTION_MAX} caractères.`)
  }
  if (corps.id_seance != null && !Number.isInteger(corps.id_seance)) {
    erreurs.push('La séance doit être un identifiant, ou vide.')
  }
  return erreurs
}