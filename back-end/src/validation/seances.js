const DUREE_MAX = 1440 // 24 heures

export function validerSeance(corps) {
  const erreurs = []
  if (!Number.isInteger(corps.id_etude)) {
    erreurs.push("L'unité est obligatoire.")
  }
  if (!Number.isInteger(corps.id_enseignant)) {
    erreurs.push("L'enseignant est obligatoire.")
  }
  if (typeof corps.date_debut !== 'string' || Number.isNaN(new Date(corps.date_debut).getTime())) {
    erreurs.push('La date de début est obligatoire et doit être valide.')
  }
  if (!Number.isInteger(corps.duree_minutes) || corps.duree_minutes < 1 || corps.duree_minutes > DUREE_MAX) {
    erreurs.push(`La durée doit être un nombre entier de minutes, entre 1 et ${DUREE_MAX}.`)
  }
  return erreurs
}
