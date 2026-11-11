<template>
  <BarreNavigation />
  <main class="page">
    <p v-if="chargement">Chargement…</p>
    <p v-else-if="erreur && !enseignant" class="erreur">{{ erreur }}</p>

    <template v-else-if="enseignant">
      <header>
        <h1>{{ enseignant.prenom }} {{ enseignant.nom }}</h1>
        <p>{{ enseignant.email }}<span v-if="enseignant.telephone"> · {{ enseignant.telephone }}</span></p>
        <p>Statut : {{ enseignant.statut_membre }}</p>
        <RouterLink v-if="peutGerer" :to="`/enseignants/${id}/modifier`">Modifier</RouterLink>
      </header>

      <section>
        <h2>Unités affectées</h2>
        <p v-if="!affectations.length">Aucune unité pour le moment.</p>
        <ul v-else>
          <li v-for="a in affectations" :key="a.id">
            {{ a.titre }}
            <span class="discret">(depuis le {{ formaterDate(a.date_debut) }})</span>
            <button v-if="peutGerer" type="button" @click="retirer(a.id)">Retirer</button>
          </li>
        </ul>

        <div v-if="peutGerer" class="ajout">
          <select v-model="idChoisi">
            <option value="" disabled>Choisir une unité</option>
            <option v-for="u in unitesDisponibles" :key="u.id" :value="u.id">{{ u.titre }}</option>
          </select>
          <button type="button" :disabled="!idChoisi" @click="affecter">Affecter</button>
        </div>
        <p v-if="erreur" class="erreur">{{ erreur }}</p>
      </section>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  trouverEnseignant,
  affecterEnseignantUnite,
  retirerEnseignantUnite,
  listerEtudes,
  moi,
} from '../../services/api.js'

const route = useRoute()
const id = route.params.id

const enseignant = ref(null)
const affectations = ref([])
const unites = ref([])
const idChoisi = ref('')
const peutGerer = ref(false)
const chargement = ref(true)
const erreur = ref('')

// Unités sur lesquelles l'enseignant n'est pas encore affecté
const unitesDisponibles = computed(() =>
  unites.value.filter((u) => !affectations.value.some((a) => a.id === u.id))
)

function formaterDate(valeur) {
  if (!valeur) return ''
  return String(valeur).slice(0, 10).split('-').reverse().join('/')
}

onMounted(async () => {
  try {
    const session = await moi()
    peutGerer.value = session.permissions.includes('enseignants.gerer')

    const reponse = await trouverEnseignant(id)
    enseignant.value = reponse.enseignant
    affectations.value = reponse.affectations

    const reponses = await listerEtudes()
    const liste = Array.isArray(reponse)
      ? reponse
      : (reponses.etudes ?? reponse.collection ?? [])
    unites.value = liste.filter((e) => e.type_etude === 'unite')

  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
})

async function affecter() {
  if (!idChoisi.value) return
  erreur.value = ''
  try {
    const reponse = await affecterEnseignantUnite(id, Number(idChoisi.value))
    affectations.value = reponse.affectations
    idChoisi.value = ''
  } catch (e) {
    erreur.value = e.message
  }
}

async function retirer(idEtude) {
  if (!window.confirm('Retirer cet enseignant de cette unité ?')) return
  erreur.value = ''
  try {
    const reponse = await retirerEnseignantUnite(id, idEtude)
    affectations.value = reponse.affectations
  } catch (e) {
    erreur.value = e.message
  }
}
</script>



<style scoped>
.page { padding: 16px; max-width: 760px; margin: 0 auto; }
.discret { color: #666; font-size: 0.9em; }
.ajout { margin-top: 12px; display: flex; gap: 8px; }
.erreur { color: #b00020; }
</style>
