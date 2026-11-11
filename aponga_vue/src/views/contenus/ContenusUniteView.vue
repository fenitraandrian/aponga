<template>
  <BarreNavigation />

  <main class="page">
    <h1>Contenus de l'unité</h1>

    <p v-if="erreur" class="message erreur">{{ erreur }}</p>
    <p v-if="message" class="message succes">{{ message }}</p>

    <section v-if="peutGerer" class="carte">
      <h2>Nouveau conteneur</h2>
      <form novalidate @submit.prevent="creer">
        <div class="champ">
          <label for="titre">Titre</label>
          <input id="titre" v-model="nouveau.titre" type="text" maxlength="200" />
        </div>

        <div class="champ">
          <label for="description">Description</label>
          <textarea id="description" v-model="nouveau.description" rows="3" maxlength="2000"></textarea>
        </div>

        <div class="champ">
          <label for="seance">Séance (facultatif)</label>
          <select id="seance" v-model="nouveau.id_seance">
            <option :value="null">Aucune séance</option>
            <option v-for="seance in seancesUnite" :key="seance.id" :value="seance.id">
              {{ formaterDate(seance.date_debut) }}
            </option>
          </select>
        </div>

        <button class="bouton-principal" type="submit" :disabled="enCours">Créer le conteneur</button>
      </form>
    </section>

    <p v-if="chargement">Chargement…</p>
    <p v-else-if="conteneurs.length === 0">Aucun contenu pour cette unité.</p>

    <section v-for="conteneur in conteneurs" :key="conteneur.id" class="carte">
      <div class="entete">
        <h2>{{ conteneur.titre }}</h2>
        <button v-if="peutGerer" type="button" @click="retirerConteneur(conteneur)">
          Supprimer le conteneur
        </button>
      </div>

      <p v-if="conteneur.description">{{ conteneur.description }}</p>
      <p v-if="conteneur.seance_date"><em>Séance : {{ formaterDate(conteneur.seance_date) }}</em></p>

      <ul class="liste">
        <li v-for="fichier in conteneur.fichiers" :key="fichier.id" class="ligne">
          <a :href="urlTelechargementFichier(fichier.id)" target="_blank">{{ fichier.nom_original }}</a>
          <span>{{ fichier.type_media }} · {{ tailleMo(fichier.taille_octets) }}</span>
          <button v-if="peutGerer" type="button" @click="retirerFichier(fichier)">Supprimer</button>
        </li>
      </ul>
      <p v-if="conteneur.fichiers.length === 0"><em>Aucun fichier.</em></p>

      <div v-if="peutGerer" class="televersement">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.mp3,.m4a,.mp4"
          @change="choisir(conteneur.id, $event)"
        />
        <button
          type="button"
          :disabled="!fichiersChoisis[conteneur.id] || enCours"
          @click="televerser(conteneur)"
        >
          Téléverser
        </button>
      </div>
    </section>

    <RouterLink :to="`/pedagogie/${idEtude}`" class="lien-secondaire">Retour à l'unité</RouterLink>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  moi,
  listerContenus,
  creerConteneur,
  supprimerConteneur,
  supprimerFichierContenu,
  televerserFichier,
  urlTelechargementFichier,
  listerSeances,
} from '../../services/api'

const route = useRoute()
const router = useRouter()
const idEtude = Number(route.params.id)

const peutGerer = ref(false)
const conteneurs = ref([])
const seancesUnite = ref([])
const nouveau = ref({ titre: '', description: '', id_seance: null })
const fichiersChoisis = ref({})
const chargement = ref(true)
const enCours = ref(false)
const erreur = ref('')
const message = ref('')

function formaterDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

function tailleMo(octets) {
  return `${(Number(octets) / (1024 * 1024)).toFixed(1)} Mo`
}

async function charger() {
  chargement.value = true
  erreur.value = ''
  try {
    const { conteneurs: liste } = await listerContenus(idEtude)
    conteneurs.value = liste
    if (peutGerer.value) {
      const { seances } = await listerSeances()
      seancesUnite.value = seances.filter((seance) => seance.id_etude === idEtude)
    }
  } catch (err) {
    erreur.value = err.message
  } finally {
    chargement.value = false
  }
}

onMounted(async () => {
  try {
    const { permissions } = await moi()
    if (!permissions.includes('contenus.lire')) {
      router.push('/accueil')
      return
    }
    peutGerer.value = permissions.includes('contenus.gerer')
  } catch {
    router.push('/connexion')
    return
  }
  charger()
})

async function creer() {
  erreur.value = ''
  message.value = ''
  if (!nouveau.value.titre.trim()) {
    erreur.value = 'Le titre est obligatoire.'
    return
  }
  enCours.value = true
  try {
    await creerConteneur({
      id_etude: idEtude,
      titre: nouveau.value.titre.trim(),
      description: nouveau.value.description.trim() || null,
      id_seance: nouveau.value.id_seance,
    })
    nouveau.value = { titre: '', description: '', id_seance: null }
    message.value = 'Conteneur créé.'
    await charger()
  } catch (err) {
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}

function choisir(idConteneur, evenement) {
  fichiersChoisis.value[idConteneur] = evenement.target.files[0] ?? null
}

async function televerser(conteneur) {
  const fichier = fichiersChoisis.value[conteneur.id]
  if (!fichier) return
  erreur.value = ''
  message.value = ''
  enCours.value = true
  try {
    await televerserFichier(conteneur.id, fichier)
    fichiersChoisis.value[conteneur.id] = null
    message.value = `« ${fichier.name} » téléversé.`
    await charger()
  } catch (err) {
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}

async function retirerFichier(fichier) {
  if (!window.confirm(`Supprimer le fichier « ${fichier.nom_original} » ?`)) return
  erreur.value = ''
  message.value = ''
  try {
    await supprimerFichierContenu(fichier.id)
    message.value = 'Fichier supprimé.'
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}

async function retirerConteneur(conteneur) {
  if (!window.confirm(`Supprimer le conteneur « ${conteneur.titre} » et tous ses fichiers ?`)) return
  erreur.value = ''
  message.value = ''
  try {
    await supprimerConteneur(conteneur.id)
    message.value = 'Conteneur supprimé.'
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1rem;
}

.carte {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.entete,
.ligne,
.televersement {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.liste {
  list-style: none;
  padding: 0;
}

.ligne {
  padding: 0.4rem 0;
  border-bottom: 1px solid #f0f0f0;
}
</style>
