<template>
  <section class="activites-unite">
    <h2>Activités</h2>

    <p v-if="erreur" class="message erreur">{{ erreur }}</p>
    <p v-if="succes" class="message succes">{{ succes }}</p>

    <p v-if="activites.length === 0" class="vide">Aucune activité dans cette unité.</p>

    <article v-for="activite in activites" :key="activite.id" class="activite">
      <div class="ligne">
        <div>
          <strong>
            <RouterLink :to="`/activites/${activite.id}`">{{ activite.titre }}</RouterLink>
          </strong>
          <span class="meta">{{ libelleType(activite.code_type_activite) }}</span>
        </div>
        <button v-if="peutGerer && versionOuverte !== activite.id" @click="ouvrirVersion(activite)">
          + Version
        </button>
      </div>

      <ul class="versions-activite">
        <li v-for="version in activite.versions" :key="version.id" class="ligne">
          <span>
            Version {{ version.numero }} : {{ version.titre_version }}
            <span :class="['etat', version.etat]">{{ version.etat }}</span>
          </span>
          <button
            v-if="peutGerer && version.etat === 'brouillon'"
            class="bouton-principal"
            @click="publier(version)"
          >
            Publier
          </button>
        </li>
        <li v-if="activite.versions.length === 0" class="vide">Aucune version.</li>
      </ul>

      <form
        v-if="versionOuverte === activite.id"
        class="formulaire-bloc"
        novalidate
        @submit.prevent="nouvelleVersion(activite)"
      >
        <div class="champ">
          <label :for="`av-titre-${activite.id}`">Titre de la version</label>
          <input :id="`av-titre-${activite.id}`" v-model="formVersion.titre_version" type="text" maxlength="200" />
        </div>
        <div class="champ">
          <label :for="`av-duree-${activite.id}`">Durée estimée (minutes)</label>
          <input :id="`av-duree-${activite.id}`" v-model="formVersion.duree" type="number" min="1" step="1" />
        </div>
        <div class="actions">
          <button class="bouton-principal" type="submit" :disabled="enCours">Créer le brouillon</button>
          <button type="button" @click="fermerVersion">Annuler</button>
        </div>
      </form>
    </article>

    <form v-if="peutGerer" class="formulaire-bloc" novalidate @submit.prevent="nouvelleActivite">
      <h3>Nouvelle activité</h3>

      <div class="champ">
        <label for="act-titre">Titre</label>
        <input id="act-titre" v-model="formActivite.titre" type="text" maxlength="200" />
      </div>

      <div class="champ">
        <label for="act-type">Type</label>
        <select id="act-type" v-model="formActivite.code_type_activite">
          <option v-for="(libelle, code) in libellesType" :key="code" :value="code">{{ libelle }}</option>
        </select>
      </div>

      <div class="champ">
        <label for="act-description">Description</label>
        <textarea id="act-description" v-model="formActivite.description" rows="3"></textarea>
      </div>

      <div class="actions">
        <button class="bouton-principal" type="submit" :disabled="enCours">Créer l'activité</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  listerActivites,
  creerActivite,
  creerVersionActivite,
  publierVersionActivite,
} from '../../services/api'

const props = defineProps({
  idEtude: { type: Number, required: true },
  peutGerer: { type: Boolean, required: true },
})

const activites = ref([])
const erreur = ref('')
const succes = ref('')
const enCours = ref(false)

const formActivite = ref({ titre: '', description: '', code_type_activite: 'exercice' })
const versionOuverte = ref(null)
const formVersion = ref({ titre_version: '', duree: '' })

const libellesType = {
  cours: 'Cours',
  exercice: 'Exercice',
  lecture: 'Lecture',
  evaluation: 'Évaluation',
}

function libelleType(code) {
  return libellesType[code] ?? code
}

async function charger() {
  const donnees = await listerActivites(props.idEtude)
  activites.value = donnees.activites
}

onMounted(async () => {
  try {
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
})

watch(() => props.idEtude, charger)

function reinitialiser() {
  erreur.value = ''
  succes.value = ''
}

async function nouvelleActivite() {
  reinitialiser()
  const titre = formActivite.value.titre.trim()
  if (!titre) {
    erreur.value = "Le titre de l'activité est obligatoire."
    return
  }

  enCours.value = true
  try {
    await creerActivite({
      id_etude: props.idEtude,
      code_type_activite: formActivite.value.code_type_activite,
      titre,
      description: formActivite.value.description.trim(),
    })
    succes.value = 'Activité créée.'
    formActivite.value = { titre: '', description: '', code_type_activite: 'exercice' }
    await charger()
  } catch (err) {
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}

function ouvrirVersion(activite) {
  reinitialiser()
  versionOuverte.value = activite.id
  formVersion.value = { titre_version: '', duree: '' }
}

function fermerVersion() {
  versionOuverte.value = null
}

async function nouvelleVersion(activite) {
  reinitialiser()
  const titre = formVersion.value.titre_version.trim()
  if (!titre) {
    erreur.value = 'Le titre de la version est obligatoire.'
    return
  }

  enCours.value = true
  try {
    await creerVersionActivite(activite.id, {
      titre_version: titre,
      duree_estimee_min: formVersion.value.duree === '' ? null : Number(formVersion.value.duree),
    })
    succes.value = 'Brouillon créé.'
    fermerVersion()
    await charger()
  } catch (err) {
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}

async function publier(version) {
  reinitialiser()
  if (!confirm(`Publier la version ${version.numero} de cette activité ?`)) return

  try {
    await publierVersionActivite(version.id)
    succes.value = 'Version publiée.'
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}
</script>

<style scoped>
.activites-unite {
  margin-top: 2rem;
  border-top: 1px solid #ddd;
  padding-top: 1rem;
}

.activite {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.ligne {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.versions-activite {
  list-style: none;
  padding-left: 1rem;
}

.versions-activite .ligne {
  padding: 0.3rem 0;
}

.formulaire-bloc {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin: 0.75rem 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.meta {
  color: #666;
  font-size: 0.85rem;
  margin-left: 0.5rem;
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

.vide {
  color: #666;
  font-style: italic;
}
</style>
