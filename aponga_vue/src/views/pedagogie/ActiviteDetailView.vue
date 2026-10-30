<template>
  <BarreNavigation />

  <main class="page-formulaire">
    <div class="carte carte-large">
      <RouterLink v-if="activite" :to="`/pedagogie/${activite.id_etude}`" class="lien-secondaire">
        ← Retour à l'unité « {{ activite.titre_unite }} »
      </RouterLink>

      <p v-if="erreur" class="message erreur">{{ erreur }}</p>
      <p v-if="succes" class="message succes">{{ succes }}</p>

      <div v-if="activite" class="entete-activite">
        <p class="type">Activité · {{ libelleType(activite.code_type_activite) }}</p>
        <h1>{{ activite.titre }}</h1>
        <p v-if="activite.description" class="description">{{ activite.description }}</p>
      </div>

      <section class="versions">
        <div class="entete">
          <h2>Versions</h2>
          <button v-if="peutGerer && !formulaireOuvert" class="bouton-principal" @click="ouvrirCreation">
            Nouvelle version
          </button>
        </div>

        <form v-if="formulaireOuvert" class="formulaire-bloc" novalidate @submit.prevent="enregistrerVersion">
          <h3>{{ enEdition ? 'Modifier le brouillon' : 'Nouvelle version (brouillon)' }}</h3>

          <div class="champ">
            <label for="v-titre">Titre de la version</label>
            <input id="v-titre" v-model="formVersion.titre_version" type="text" maxlength="200" />
            <small v-if="erreursVersion.titre_version" class="erreur-champ">{{ erreursVersion.titre_version }}</small>
          </div>

          <div class="champ">
            <label for="v-description">Contenu de la version</label>
            <textarea id="v-description" v-model="formVersion.description" rows="4"></textarea>
          </div>

          <div class="champ">
            <label for="v-duree">Durée estimée (minutes)</label>
            <input id="v-duree" v-model="formVersion.duree_estimee_min" type="number" min="1" step="1" />
            <small v-if="erreursVersion.duree_estimee_min" class="erreur-champ">{{ erreursVersion.duree_estimee_min }}</small>
          </div>

          <div class="actions">
            <button class="bouton-principal" type="submit" :disabled="enCours">Enregistrer</button>
            <button type="button" @click="fermerFormulaire">Annuler</button>
          </div>
        </form>

        <p v-if="versions.length === 0" class="vide">Aucune version pour le moment.</p>

        <article v-for="version in versions" :key="version.id" class="version">
          <div class="ligne">
            <div>
              <strong>Version {{ version.numero }} : {{ version.titre_version }}</strong>
              <span :class="['etat', version.etat]">{{ libelleEtat(version.etat) }}</span>
              <span v-if="version.duree_estimee_min" class="duree">{{ version.duree_estimee_min }} min</span>
            </div>

            <div v-if="peutGerer && version.etat === 'brouillon'" class="actions">
              <button @click="ouvrirEdition(version)">Modifier</button>
              <button class="bouton-principal" @click="publier(version)">Publier</button>
              <button class="danger" @click="supprimerVersion(version)">Supprimer</button>
            </div>
          </div>

          <p v-if="version.description" class="description">{{ version.description }}</p>

          <div class="ressources">
            <div class="entete">
              <h4>Ressources</h4>
              <button
                v-if="peutGerer && version.etat === 'brouillon' && ressourceVersionId !== version.id"
                @click="ouvrirRessource(version)"
              >
                + Ressource
              </button>
            </div>

            <p v-if="!(ressources[version.id]?.length)" class="vide">Aucune ressource.</p>

            <ul class="liste-ressources">
              <li v-for="ressource in ressources[version.id] ?? []" :key="ressource.id" class="ligne-ressource">
                <span>
                  <em>{{ libelleMedia(ressource.type_media) }}</em>
                  <a :href="ressource.url" target="_blank" rel="noopener">{{ ressource.titre || ressource.url }}</a>
                </span>
                <button
                  v-if="peutGerer && version.etat === 'brouillon'"
                  class="danger"
                  @click="retirerRessource(ressource)"
                >
                  Supprimer
                </button>
              </li>
            </ul>

            <form
              v-if="ressourceVersionId === version.id"
              class="formulaire-bloc"
              novalidate
              @submit.prevent="enregistrerRessource(version)"
            >
              <div class="champ">
                <label for="r-type">Type</label>
                <select id="r-type" v-model="formRessource.type_media">
                  <option v-for="(libelle, code) in libellesMedia" :key="code" :value="code">{{ libelle }}</option>
                </select>
              </div>

              <div class="champ">
                <label for="r-url">Adresse (http:// ou https://)</label>
                <input id="r-url" v-model="formRessource.url" type="url" />
                <small v-if="erreursRessource.url" class="erreur-champ">{{ erreursRessource.url }}</small>
              </div>

              <div class="champ">
                <label for="r-titre">Titre</label>
                <input id="r-titre" v-model="formRessource.titre" type="text" maxlength="200" />
              </div>

              <div class="champ">
                <label for="r-duree">Durée (secondes, facultatif)</label>
                <input id="r-duree" v-model="formRessource.duree_secondes" type="number" min="1" step="1" />
              </div>

              <div class="actions">
                <button class="bouton-principal" type="submit" :disabled="enCours">Ajouter</button>
                <button type="button" @click="fermerRessource">Annuler</button>
              </div>
            </form>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  moi,
  trouverActivite,
  creerVersionActivite,
  modifierVersionActivite,
  publierVersionActivite,
  listerRessources,
  ajouterRessource,
  supprimerRessource,
  supprimerVersionActivite
} from '../../services/api'

const router = useRouter()
const route = useRoute()

const peutGerer = ref(false)
const activite = ref(null)
const versions = ref([])
const ressources = ref({}) // { [idVersion]: [ressource, ...] }
const erreur = ref('')
const succes = ref('')
const enCours = ref(false)

// Formulaire de version
const formulaireOuvert = ref(false)
const enEdition = ref(null)
const formVersion = ref({ titre_version: '', description: '', duree_estimee_min: '' })
const erreursVersion = ref({})

// Formulaire de ressource, ouvert pour une seule version à la fois
const ressourceVersionId = ref(null)
const formRessource = ref({ type_media: 'video', url: '', titre: '', duree_secondes: '' })
const erreursRessource = ref({})

const libellesType = {
  cours: 'Cours',
  exercice: 'Exercice',
  lecture: 'Lecture',
  evaluation: 'Évaluation',
}
const libellesMedia = {
  video: 'Vidéo',
  pdf: 'PDF',
  audio: 'Audio',
  image: 'Image',
  lien: 'Lien',
}
const libellesEtat = {
  brouillon: 'Brouillon',
  publiee: 'Publiée',
  depreciee: 'Dépréciée',
  archivee: 'Archivée',
}

function libelleType(code) {
  return libellesType[code] ?? code
}
function libelleMedia(code) {
  return libellesMedia[code] ?? code
}
function libelleEtat(etat) {
  return libellesEtat[etat] ?? etat
}

async function charger() {
  const donnees = await trouverActivite(route.params.id)
  activite.value = donnees.activite
  versions.value = donnees.versions

  const parVersion = {}
  for (const version of donnees.versions) {
    const reponse = await listerRessources(version.id)
    parVersion[version.id] = reponse.ressources
  }
  ressources.value = parVersion
}

onMounted(async () => {
  try {
    const { permissions } = await moi()
    if (!permissions.includes('pedagogie.lire')) {
      router.push('/accueil')
      return
    }
    peutGerer.value = permissions.includes('pedagogie.gerer')
  } catch {
    router.push('/connexion')
    return
  }

  try {
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
})

function reinitialiserMessages() {
  erreur.value = ''
  succes.value = ''
}

// ----- Versions -----

function ouvrirCreation() {
  reinitialiserMessages()
  enEdition.value = null
  formVersion.value = { titre_version: '', description: '', duree_estimee_min: '' }
  erreursVersion.value = {}
  formulaireOuvert.value = true
}

function ouvrirEdition(version) {
  reinitialiserMessages()
  enEdition.value = version.id
  formVersion.value = {
    titre_version: version.titre_version,
    description: version.description ?? '',
    duree_estimee_min: version.duree_estimee_min ?? '',
  }
  erreursVersion.value = {}
  formulaireOuvert.value = true
}

function fermerFormulaire() {
  formulaireOuvert.value = false
  enEdition.value = null
}

function validerVersion() {
  const erreurs = {}
  const titre = formVersion.value.titre_version.trim()
  const duree = formVersion.value.duree_estimee_min

  if (!titre) erreurs.titre_version = 'Le titre est obligatoire.'
  else if (titre.length > 200) erreurs.titre_version = '200 caractères maximum.'

  if (duree !== '' && (!Number.isInteger(Number(duree)) || Number(duree) <= 0)) {
    erreurs.duree_estimee_min = 'La durée doit être un nombre entier de minutes, supérieur à 0.'
  }

  erreursVersion.value = erreurs
  return Object.keys(erreurs).length === 0
}

async function enregistrerVersion() {
  reinitialiserMessages()
  if (!validerVersion()) return

  const donnees = {
    titre_version: formVersion.value.titre_version.trim(),
    description: formVersion.value.description.trim(),
    duree_estimee_min: formVersion.value.duree_estimee_min === '' ? null : Number(formVersion.value.duree_estimee_min),
  }

  enCours.value = true
  try {
    if (enEdition.value) {
      await modifierVersionActivite(enEdition.value, donnees)
      succes.value = 'Brouillon mis à jour.'
    } else {
      await creerVersionActivite(activite.value.id, donnees)
      succes.value = 'Nouveau brouillon créé.'
    }
    fermerFormulaire()
    await charger()
  } catch (err) {
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}

async function publier(version) {
  reinitialiserMessages()
  if (!confirm(`Publier la version ${version.numero} ? Elle ne pourra plus être modifiée.`)) return

  try {
    await publierVersionActivite(version.id)
    succes.value = `Version ${version.numero} publiée.`
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}

// (suppression d'un brouillon d'activité)
async function supprimerVersion(version) {
  reinitialiserMessages()
  if (!confirm(`Supprimer le brouillon « Version ${version.numero} : ${version.titre_version} » ?`)) return

  try {
    await supprimerVersionActivite(version.id)
    succes.value = 'Brouillon supprimé.'
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}


// ----- Ressources -----

function ouvrirRessource(version) {
  reinitialiserMessages()
  ressourceVersionId.value = version.id
  formRessource.value = { type_media: 'video', url: '', titre: '', duree_secondes: '' }
  erreursRessource.value = {}
}

function fermerRessource() {
  ressourceVersionId.value = null
}

function validerRessource() {
  const erreurs = {}
  if (!/^https?:\/\/\S+$/i.test(formRessource.value.url.trim())) {
    erreurs.url = "L'adresse doit commencer par http:// ou https://."
  }
  erreursRessource.value = erreurs
  return Object.keys(erreurs).length === 0
}

async function enregistrerRessource(version) {
  reinitialiserMessages()
  if (!validerRessource()) return

  const donnees = {
    type_media: formRessource.value.type_media,
    url: formRessource.value.url.trim(),
    titre: formRessource.value.titre.trim() || null,
    duree_secondes: formRessource.value.duree_secondes === '' ? null : Number(formRessource.value.duree_secondes),
  }

  enCours.value = true
  try {
    await ajouterRessource(version.id, donnees)
    succes.value = 'Ressource ajoutée.'
    fermerRessource()
    await charger()
  } catch (err) {
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}

async function retirerRessource(ressource) {
  reinitialiserMessages()
  if (!confirm(`Supprimer la ressource « ${ressource.titre || ressource.url} » ?`)) return

  try {
    await supprimerRessource(ressource.id)
    succes.value = 'Ressource supprimée.'
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}
</script>

<style scoped>
.carte-large {
  max-width: 900px;
  width: 100%;
}

.entete,
.ligne,
.actions,
.ligne-ressource {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.type {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0 0;
}

.description {
  color: #555;
  white-space: pre-line;
}

.versions {
  margin-top: 2rem;
  border-top: 1px solid #ddd;
  padding-top: 1rem;
}

.formulaire-bloc {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.version {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.ressources {
  margin-top: 0.5rem;
  padding-left: 1rem;
}

.liste-ressources {
  list-style: none;
  padding: 0;
}

.ligne-ressource {
  padding: 0.3rem 0;
  border-bottom: 1px dashed #eee;
}

.etat {
  margin-left: 0.5rem;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  background: #eee;
}

.etat.publiee {
  background: #d7f5dd;
  color: #17602b;
}

.etat.brouillon {
  background: #fff3cd;
  color: #7a5b00;
}

.duree {
  margin-left: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.danger {
  color: #b00020;
}

.erreur-champ {
  display: block;
  color: #b00020;
  margin-top: 0.25rem;
}

.vide {
  color: #666;
  font-style: italic;
}
</style>
