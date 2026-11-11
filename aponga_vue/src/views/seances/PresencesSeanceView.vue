<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { listerPresences, marquerPresences } from '../../services/api.js'

const route = useRoute()
const id = route.params.id

const seance = ref(null)
// choix : '' (non marqué), 'true' (présent), 'false' (absent)
const lignes = ref([])
const chargement = ref(true)
const enregistrement = ref(false)
const erreur = ref('')
const confirmation = ref('')

function versLignes(presences) {
  return presences.map((p) => ({
    ...p,
    choix: p.present === null ? '' : String(p.present),
  }))
}

const nbMarques = computed(() => lignes.value.filter((l) => l.choix !== '').length)

onMounted(async () => {
  try {
    const reponse = await listerPresences(id)
    seance.value = reponse.seance
    lignes.value = versLignes(reponse.presences)
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
})

async function enregistrer() {
  erreur.value = ''
  confirmation.value = ''

  const presences = lignes.value
    .filter((l) => l.choix !== '')
    .map((l) => ({ id_membre: l.id_membre, present: l.choix === 'true' }))

  if (!presences.length) {
    erreur.value = 'Marquez au moins un apprenant avant d\'enregistrer.'
    return
  }

  enregistrement.value = true
  try {
    const reponse = await marquerPresences(id, presences)
    lignes.value = versLignes(reponse.presences)
    confirmation.value = `${presences.length} présence(s) enregistrée(s).`
  } catch (e) {
    erreur.value = e.message
  } finally {
    enregistrement.value = false
  }
}
</script>

<template>
  <BarreNavigation />

  <main class="page">
    <p><RouterLink to="/planning">← Retour au planning</RouterLink></p>
    <h1>Présences</h1>

    <p v-if="chargement">Chargement…</p>
    <p v-else-if="erreur && !seance" class="erreur" role="alert">{{ erreur }}</p>

    <template v-else-if="seance">
      <p class="discret">Séance du {{ new Date(seance.date_debut).toLocaleString('fr-FR') }}</p>

      <p v-if="!lignes.length">Aucun apprenant inscrit à cette séance.</p>

      <table v-else>
        <thead>
          <tr>
            <th>Apprenant</th>
            <th>Présence</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in lignes" :key="l.id_membre">
            <td>{{ l.prenom }} {{ l.nom }}</td>
            <td>
              <select v-model="l.choix">
                <option value="">Non marqué</option>
                <option value="true">Présent</option>
                <option value="false">Absent</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="lignes.length" class="actions">
        <button type="button" :disabled="enregistrement" @click="enregistrer">Enregistrer</button>
        <span class="discret">{{ nbMarques }} / {{ lignes.length }} marqués</span>
      </div>

      <p v-if="confirmation" class="confirmation" role="status">{{ confirmation }}</p>
      <p v-if="erreur" class="erreur" role="alert">{{ erreur }}</p>
    </template>
  </main>
</template>

<style scoped>
.page { padding: 16px; max-width: 760px; margin: 0 auto; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; }
th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
.actions { margin-top: 16px; display: flex; align-items: center; gap: 12px; }
.discret { color: #666; font-size: 0.9em; }
.erreur { color: #b00020; }
.confirmation { color: #1b6e2b; }
</style>
