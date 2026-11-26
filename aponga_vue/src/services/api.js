const URL_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function appeler(chemin, { methode = 'POST', corps } = {}) {
  let reponse
  try {
    reponse = await fetch(`${URL_BASE}${chemin}`, {
      method: methode,
      credentials: 'include',
      headers: corps ? { 'Content-Type': 'application/json' } : {},
      body: corps ? JSON.stringify(corps) : undefined,
    })
  } catch {
    throw new Error('Impossible de joindre le serveur. Vérifiez que le back-end est lancé.')
  }

  const donnees = await reponse.json().catch(() => ({}))
  if (!reponse.ok) {
    throw new Error(donnees.message ?? 'Une erreur est survenue.')
  }
  return donnees
}


export const connexion = (email, motDePasse) =>
  appeler('/api/auth/connexion', {  methode: 'POST', corps: { email, motDePasse } })

export const inscription = (donnees) => appeler('/api/auth/inscription', { corps: donnees })

export const deconnexion = () => appeler('/api/auth/deconnexion')

export const moi = () => appeler('/api/auth/moi', { methode: 'GET' })

export const motDePasseOublie = (email) =>
  appeler('/api/auth/mot-de-passe-oublie', { corps: { email } })

export const reinitialiser = (jeton, nouveauMotDePasse) =>
  appeler('/api/auth/reinitialiser', { corps: { jeton, nouveauMotDePasse } })


// (gestion des rôles)
export const listerUtilisateurs = () => appeler('/api/utilisateurs', { methode: 'GET' })

export const listerRoles = () => appeler('/api/roles', { methode: 'GET' })

export const modifierRolesUtilisateur = (id, roles) =>
  appeler(`/api/utilisateurs/${id}/roles`, { methode: 'PUT', corps: { roles } })

export const listerEtudes = () => appeler('/api/etudes', { methode: 'GET' })
export const trouverEtude = (id) => appeler(`/api/etudes/${id}`, { methode: 'GET' })
export const creerEtude = (corps) => appeler('/api/etudes', { corps })
export const modifierEtude = (id, corps) => appeler(`/api/etudes/${id}`, { methode: 'PUT', corps })
export const supprimerEtude = (id) => appeler(`/api/etudes/${id}`, { methode: 'DELETE' })
export const creerVersion = (idEtude, corps) => appeler(`/api/etudes/${idEtude}/versions`, { corps })
export const modifierVersion = (idVersion, corps) =>
  appeler(`/api/etudes/versions/${idVersion}`, { methode: 'PUT', corps })
export const publierVersion = (idVersion) => appeler(`/api/etudes/versions/${idVersion}/publier`)

//  (activités et ressources)
export const trouverActivite = (id) => appeler(`/api/activites/${id}`, { methode: 'GET' })
export const creerVersionActivite = (idActivite, corps) =>
  appeler(`/api/activites/${idActivite}/versions`, { corps })
export const modifierVersionActivite = (idVersion, corps) =>
  appeler(`/api/activites/versions/${idVersion}`, { methode: 'PUT', corps })
export const publierVersionActivite = (idVersion) =>
  appeler(`/api/activites/versions/${idVersion}/publier`)
export const listerRessources = (idVersion) =>
  appeler(`/api/activites/versions/${idVersion}/ressources`, { methode: 'GET' })
export const ajouterRessource = (idVersion, corps) =>
  appeler(`/api/activites/versions/${idVersion}/ressources`, { corps })
export const supprimerRessource = (id) =>
  appeler(`/api/activites/ressources/${id}`, { methode: 'DELETE' })
// (composition d'une version d'unité)
export const listerActivites = (idEtude) => appeler(`/api/activites?etude=${idEtude}`, { methode: 'GET' })
export const listerComposition = (idVersion) =>
  appeler(`/api/etudes/versions/${idVersion}/composition`, { methode: 'GET' })
export const ajouterAuComposition = (idVersion, corps) =>
  appeler(`/api/etudes/versions/${idVersion}/composition`, { corps })
export const modifierComposition = (idVersion, idVersionActivite, corps) =>
  appeler(`/api/etudes/versions/${idVersion}/composition/${idVersionActivite}`, { methode: 'PUT', corps })
export const retirerDuComposition = (idVersion, idVersionActivite) =>
  appeler(`/api/etudes/versions/${idVersion}/composition/${idVersionActivite}`, { methode: 'DELETE' })
export const creerActivite = (corps) => appeler('/api/activites', { corps })

export const supprimerVersion = (idVersion) =>
  appeler(`/api/etudes/versions/${idVersion}`, { methode: 'DELETE' })
export const supprimerVersionActivite = (idVersion) =>
  appeler(`/api/activites/versions/${idVersion}`, { methode: 'DELETE' })

// (niveaux)
export const listerNiveaux = () => appeler('/api/niveaux', { methode: 'GET' })
export const trouverNiveau = (id) => appeler(`/api/niveaux/${id}`, { methode: 'GET' })
export const creerNiveau = (corps) => appeler('/api/niveaux', { corps })
export const modifierNiveau = (id, corps) => appeler(`/api/niveaux/${id}`, { methode: 'PUT', corps })
export const supprimerNiveau = (id) => appeler(`/api/niveaux/${id}`, { methode: 'DELETE' })

export const listerApprenants = (q) =>
  appeler(`/api/apprenants${q ? `?q=${encodeURIComponent(q)}` : ''}`, { methode: 'GET' })
export const trouverApprenant = (id) => appeler(`/api/apprenants/${id}`, { methode: 'GET' })
export const modifierApprenant = (id, corps) =>
  appeler(`/api/apprenants/${id}`, { methode: 'PUT', corps })
export const affecterNiveauApprenant = (id, idNiveau) =>
  appeler(`/api/apprenants/${id}/niveau`, { methode: 'PUT', corps: { id_niveau: idNiveau } })

export const changerStatutApprenant = (id, statut) =>
  appeler(`/api/apprenants/${id}/statut`, { methode: 'PUT', corps: { statut } })

export const listerSeances = (du, au) => {
  const params = new URLSearchParams()
  if (du) params.set('du', du)
  if (au) params.set('au', au)
  const suffixe = params.toString() ? `?${params.toString()}` : ''
  return appeler(`/api/seances${suffixe}`, { methode: 'GET' })
}
export const trouverSeance = (id) => appeler(`/api/seances/${id}`, { methode: 'GET' })
export const creerSeance = (corps) => appeler('/api/seances', { corps })
export const modifierSeance = (id, corps) => appeler(`/api/seances/${id}`, { methode: 'PUT', corps })
export const supprimerSeance = (id) => appeler(`/api/seances/${id}`, { methode: 'DELETE' })

export const listerEnseignantsSeance = () => appeler('/api/seances/enseignants', { methode: 'GET' })

// début (contenus)
export const listerContenus = (etude, seance) => {
  const params = new URLSearchParams({ etude })
  if (seance) params.set('seance', seance)
  return appeler(`/api/contenus?${params.toString()}`, { methode: 'GET' })
}
export const creerConteneur = (corps) => appeler('/api/contenus', { corps })
export const modifierConteneur = (id, corps) => appeler(`/api/contenus/${id}`, { methode: 'PUT', corps })
export const supprimerConteneur = (id) => appeler(`/api/contenus/${id}`, { methode: 'DELETE' })
export const supprimerFichierContenu = (id) => appeler(`/api/contenus/fichiers/${id}`, { methode: 'DELETE' })
export const urlTelechargementFichier = (id) => `${URL_BASE}/api/contenus/fichiers/${id}/telecharger`

// Le téléversement envoie un fichier, pas du JSON : on n'utilise pas appeler()
export async function televerserFichier(idConteneur, fichier) {
  const donnees = new FormData()
  donnees.append('fichier', fichier)

  let reponse
  try {
    reponse = await fetch(`${URL_BASE}/api/contenus/${idConteneur}/fichiers`, {
      method: 'POST',
      credentials: 'include',
      body: donnees,
    })
  } catch {
    throw new Error('Impossible de joindre le serveur.')
  }

  const json = await reponse.json().catch(() => ({}))
  if (!reponse.ok) {
    throw new Error(json.message ?? 'Téléversement impossible.')
  }
  return json
}

// MODIFICATION : début (enseignants)
export const listerEnseignants = () =>
  appeler('/api/enseignants', { methode: 'GET' })

export const trouverEnseignant = (id) =>
  appeler(`/api/enseignants/${id}`, { methode: 'GET' })

export const modifierEnseignant = (id, donnees) =>
  appeler(`/api/enseignants/${id}`, { methode: 'PUT', corps: donnees })

export const affecterEnseignantUnite = (id, idEtude) =>
  appeler(`/api/enseignants/${id}/affectations`, { methode: 'POST', corps: { id_etude: idEtude } })

export const retirerEnseignantUnite = (id, idEtude) =>
  appeler(`/api/enseignants/${id}/affectations/${idEtude}`, { methode: 'DELETE' })

//  début (inscriptions aux séances)
export const listerInscrits = (idSeance) =>
  appeler(`/api/seances/${idSeance}/inscriptions`, { methode: 'GET' })

export const inscrireApprenantSeance = (idSeance, idMembre) =>
  appeler(`/api/seances/${idSeance}/inscriptions`, { methode: 'POST', corps: { id_membre: idMembre } })

export const desinscrireApprenantSeance = (idSeance, idMembre) =>
  appeler(`/api/seances/${idSeance}/inscriptions/${idMembre}`, { methode: 'DELETE' })

// début (auto-inscription apprenant)
export const listerSeancesDisponibles = () =>
  appeler('/api/mes-inscriptions/seances-disponibles', { methode: 'GET' })

export const listerMesInscriptions = () =>
  appeler('/api/mes-inscriptions', { methode: 'GET' })

export const inscrireMoi = (idSeance) =>
  appeler('/api/mes-inscriptions', { methode: 'POST', corps: { id_seance: idSeance } })

export const desinscrireMoi = (idSeance) =>
  appeler(`/api/mes-inscriptions/${idSeance}`, { methode: 'DELETE' })


// : début (suivi de cours, T14)
export const listerMesContenus = (idSeance) =>
  appeler(`/api/mes-contenus/seances/${idSeance}`, { methode: 'GET' })

export const listerMesPresences = () =>
  appeler('/api/presences/mes', { methode: 'GET' })

export const urlLectureFichier = (idFichier) =>
  `${URL_BASE}/api/mes-contenus/fichiers/${idFichier}/lire`

export const urlTelechargementMonFichier = (idFichier) =>
  `${URL_BASE}/api/mes-contenus/fichiers/${idFichier}/telecharger`

export const listerPresences = (idSeance) =>
  appeler(`/api/presences/seances/${idSeance}`, { methode: 'GET' })

export const marquerPresences = (idSeance, presences) =>
  appeler(`/api/presences/seances/${idSeance}`, { methode: 'PUT', corps: { presences } })

export const listerReglesTelechargement = () =>
  appeler('/api/regles-telechargement', { methode: 'GET' })

export const modifierRegleTelechargement = (typeFichier, telechargeable) =>
  appeler(`/api/regles-telechargement/${typeFichier}`, { methode: 'PUT', corps: { telechargeable } })
// MODIFICATION : fin

export const listerParcoursEssai = () =>
  appeler('/api/essai/parcours', { methode: 'GET' })

export const unitesParcoursEssai = (code) =>
  appeler(`/api/essai/parcours/${code}/unites`, { methode: 'GET' })

export const corrigerQuizEssai = (idUnite, reponses) =>
  appeler(`/api/essai/unites/${idUnite}/corriger`, { corps: { reponses } })

// début (exercices, T15 à T17)
export const listerConsignesSeance = (idSeance) =>
  appeler(`/api/seances/${idSeance}/consignes`, { methode: 'GET' })

export const creerConsigneSeance = (idSeance, corps) =>
  appeler(`/api/seances/${idSeance}/consignes`, { corps })

// Dépôt de fichiers : multipart, donc pas de appeler()
export async function deposerExercice(idConsigne, fichiers) {
  const donnees = new FormData()
  for (const fichier of fichiers) donnees.append('fichiers', fichier)

  let reponse
  try {
    reponse = await fetch(`${URL_BASE}/api/consignes/${idConsigne}/depots`, {
      method: 'POST',
      credentials: 'include',
      body: donnees,
    })
  } catch {
    throw new Error('Impossible de joindre le serveur.')
  }

  const json = await reponse.json().catch(() => ({}))
  if (!reponse.ok) throw new Error(json.message ?? 'Dépôt impossible.')
  return json
}

export const listerMesExercices = (niveau, statut) => {
  const params = new URLSearchParams()
  if (niveau) params.set('niveau', niveau)
  if (statut) params.set('statut', statut)
  const suffixe = params.toString() ? `?${params.toString()}` : ''
  return appeler(`/api/mes-exercices${suffixe}`, { methode: 'GET' })
}

export const listerDepots = (statut = 'soumis') =>
  appeler(`/api/depots?statut=${statut}`, { methode: 'GET' })

export const validerDepot = (idDepot, corps) =>
  appeler(`/api/depots/${idDepot}/validation`, { methode: 'PUT', corps })

export const urlTelechargementFichierDepot = (idFichier) =>
  `${URL_BASE}/api/depots/fichiers/${idFichier}/telecharger`
// MODIFICATION : fin

//  (soldes de séances)
export const listerSoldes = () => appeler('/api/soldes', { methode: 'GET' })

export const creerSolde = (corps) => appeler('/api/soldes', { corps })

export const modifierSolde = (idMembre, idNiveau, solde) =>
  appeler(`/api/soldes/${idMembre}/${idNiveau}`, { methode: 'PUT', corps: { solde } })

export const supprimerSolde = (idMembre, idNiveau) =>
  appeler(`/api/soldes/${idMembre}/${idNiveau}`, { methode: 'DELETE' })
// MODIFICATION : fin

export const listerJournal = (params) => {
  const parametres = new URLSearchParams(params)
  return appeler(`/api/journal?${parametres.toString()}`, { methode: 'GET' })
}

export const listerEntitesJournal = () =>
  appeler('/api/journal/entites', { methode: 'GET' })

export function listerMembresPaiement() {
  return appeler('/api/paiements/membres', { methode: 'GET' })
}

export function listerNiveauxTarifs() {
  return appeler('/api/paiements/niveaux', { methode: 'GET' })
}

export function definirTarifNiveau(idNiveau, prix) {
  return appeler(`/api/paiements/tarifs/${idNiveau}`, { methode: 'PUT', corps: { prix } })
}

export function listerPaiements(idMembre = null) {
  const requete = idMembre ? `?membre=${idMembre}` : ''
  return appeler(`/api/paiements${requete}`, { methode: 'GET' })
}

// export function enregistrerPaiement({ id_membre, id_niveau, montant }) {
//   return appeler('/api/paiements', {
//     methode: 'POST',
//     corps: { id_membre, id_niveau, montant },
//   })
// }

export function listerTypesAbonnement() {
  return appeler('/api/paiements/types', { methode: 'GET' })
}

export function enregistrerPaiement({ id_membre, id_niveau, montant, id_type_abonnement }) {
  return appeler('/api/paiements', {
    methode: 'POST',
    corps: { id_membre, id_niveau, montant, id_type_abonnement },
  })
}
