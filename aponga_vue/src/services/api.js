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
  appeler('/api/auth/connexion', { corps: { email, motDePasse } })

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
