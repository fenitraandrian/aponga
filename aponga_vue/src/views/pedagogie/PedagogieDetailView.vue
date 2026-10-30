<template>
  <BarreNavigation />

  <main class="page-formulaire">
    <div class="carte carte-large">
      <RouterLink to="/pedagogie" class="lien-secondaire">← Retour à la pédagogie</RouterLink>

      <p v-if="erreur" class="message erreur">{{ erreur }}</p>
      <p v-if="succes" class="message succes">{{ succes }}</p>

      <div v-if="etude" class="entete-etude">
        <p class="type">{{ etude.type_etude === 'formation' ? 'Formation' : 'Unité d’apprentissage' }}</p>
        <h1>{{ etude.titre }}</h1>
        <p v-if="etude.description" class="description">{{ etude.description }}</p>
      </div>
      <ActivitesUnite
        v-if="etude && etude.type_etude === 'unite'"
        :id-etude="etude.id"
        :peut-gerer="peutGerer"
      />
      <section class="versions">
        <div class="entete">
          <h2>Versions</h2>
          <button
            v-if="peutGerer && !formulaireOuvert"
            class="bouton-principal"
            @click="ouvrirCreation"
          >
            Nouvelle version
          </button>
        </div>

        <form v-if="formulaireOuvert" class="formulaire-version" novalidate @submit.prevent="enregistrerVersion">
          <h3>{{ enEdition ? 'Modifier le brouillon' : 'Nouvelle version (brouillon)' }}</h3>

          <div class="champ">
            <label for="version-titre">Titre</label>
            <input id="version-titre" v-model="formVersion.titre" type="text" maxlength="200" />
            <small v-if="erreursVersion.titre" class="erreur-champ">{{ erreursVersion.titre }}</small>
          </div>

          <div class="champ">
            <label for="version-description">Contenu de la version</label>
            <textarea id="version-description" v-model="formVersion.description" rows="5"></textarea>
          </div>

          <div class="actions">
            <button class="bouton-principal" type="submit" :disabled="enCours">Enregistrer</button>
            <button type="button" @click="fermerFormulaire">Annuler</button>
          </div>
        </form>

        <p v-if="versions.length === 0" class="vide">Aucune version pour le moment.</p>

        <ul class="liste-versions">
          <li v-for="version in versions" :key="version.id" class="version">
            <div class="ligne">
              <div>
                <strong>Version {{ version.numero }} : {{ version.titre }}</strong>
                <span :class="['etat', version.etat]">{{ libelleEtat(version.etat) }}</span>
              </div>

              <div v-if="peutGerer && version.etat === 'brouillon'" class="actions">
                <button @click="ouvrirEdition(version)">Modifier</button>
                <button class="bouton-principal" @click="publier(version)">Publier</button>
                <button class="danger" @click="supprimer(version)">Supprimer</button>
              </div>
            </div>

            <p v-if="version.description" class="description">{{ version.description }}</p>

            <p v-if="version.etat === 'publiee'" class="info">
              Publiée le {{ formaterDate(version.publie_le) }}. Elle ne peut plus être modifiée.
            </p>

            <CompositionVersion
              v-if="etude && etude.type_etude === 'unite'"
              :version="version"
              :id-etude="etude.id"
              :peut-gerer="peutGerer"
            />
          </li>
        </ul>
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
  trouverEtude,
  creerVersion,
  modifierVersion,
  publierVersion,
  supprimerVersion
} from '../../services/api'
import CompositionVersion from '../../components/pedagogie/CompositionVersion.vue'
import ActivitesUnite from '../../components/pedagogie/ActivitesUnite.vue'

const router = useRouter()
const route = useRoute()

const peutGerer = ref(false)
const etude = ref(null)
const versions = ref([])
const erreur = ref('')
const succes = ref('')
const enCours = ref(false)

// Formulaire de version : ouvert pour une création (enEdition = null) ou une modification
const formulaireOuvert = ref(false)
const enEdition = ref(null)
const formVersion = ref({ titre: '', description: '' })
const erreursVersion = ref({})

const libellesEtat = {
  brouillon: 'Brouillon',
  publiee: 'Publiée',
  depreciee: 'Dépréciée',
  archivee: 'Archivée',
}

function libelleEtat(etat) {
  return libellesEtat[etat] ?? etat
}

function formaterDate(date) {
  return date ? new Date(date).toLocaleDateString('fr-FR') : ''
}

async function charger() {
  const donnees = await trouverEtude(route.params.id)
  etude.value = donnees.etude
  versions.value = donnees.versions
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

function ouvrirCreation() {
  reinitialiserMessages()
  enEdition.value = null
  formVersion.value = { titre: '', description: '' }
  erreursVersion.value = {}
  formulaireOuvert.value = true
}

function ouvrirEdition(version) {
  reinitialiserMessages()
  enEdition.value = version.id
  formVersion.value = { titre: version.titre, description: version.description ?? '' }
  erreursVersion.value = {}
  formulaireOuvert.value = true
}

function fermerFormulaire() {
  formulaireOuvert.value = false
  enEdition.value = null
}

function validerVersionLocalement() {
  const erreurs = {}
  const titre = formVersion.value.titre.trim()

  if (!titre) erreurs.titre = 'Le titre est obligatoire.'
  else if (titre.length > 200) erreurs.titre = '200 caractères maximum.'

  erreursVersion.value = erreurs
  return Object.keys(erreurs).length === 0
}

async function enregistrerVersion() {
  reinitialiserMessages()
  if (!validerVersionLocalement()) return

  const donnees = {
    titre: formVersion.value.titre.trim(),
    description: formVersion.value.description.trim(),
  }

  enCours.value = true
  try {
    if (enEdition.value) {
      await modifierVersion(enEdition.value, donnees)
      succes.value = 'Brouillon mis à jour.'
    } else {
      await creerVersion(etude.value.id, donnees)
      succes.value = 'Nouveau brouillon créé.'
    }
    fermerFormulaire()
    await charger()
  } catch (err) {
    // Si la version est publiée, le message du trigger s'affiche ici
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}

async function publier(version) {
  reinitialiserMessages()
  const confirme = confirm(
    `Publier la version ${version.numero} ? Elle ne pourra plus être modifiée ensuite.`
  )
  if (!confirme) return

  try {
    await publierVersion(version.id)
    succes.value = `Version ${version.numero} publiée.`
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}

async function supprimer(version) {
  reinitialiserMessages()
  if (!confirm(`Supprimer le brouillon « Version ${version.numero} : ${version.titre} » ?`)) return

  try {
    await supprimerVersion(version.id)
    succes.value = 'Brouillon supprimé.'
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
.actions {
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

.formulaire-version {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.liste-versions {
  list-style: none;
  padding: 0;
}

.version {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
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

.info {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
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
