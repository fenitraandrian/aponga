<template>
  <BarreNavigation />
  <main class="page">
    <header>
      <h1>Enseignants</h1>
      <p>Les enseignants sont les membres qui ont le rôle formateur.</p>
    </header>

    <p v-if="chargement">Chargement…</p>
    <p v-else-if="erreur" class="erreur">{{ erreur }}</p>
    <p v-else-if="!enseignants.length">Aucun enseignant pour le moment.</p>

    <table v-else>
      <thead>
        <tr>
          <th>Nom</th>
          <th>Prénom</th>
          <th>E-mail</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in enseignants" :key="e.id_membre">
          <td>{{ e.nom }}</td>
          <td>{{ e.prenom }}</td>
          <td>{{ e.email }}</td>
          <td>{{ e.statut_membre }}</td>
          <td>
            <RouterLink :to="`/enseignants/${e.id_membre}`">Voir</RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { listerEnseignants } from '../../services/api.js'

const enseignants = ref([])
const chargement = ref(true)
const erreur = ref('')

onMounted(async () => {
  try {
    const reponse = await listerEnseignants()
    enseignants.value = reponse.enseignants ?? []
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
})
</script>


<style scoped>
.page { padding: 16px; max-width: 960px; margin: 0 auto; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
.erreur { color: #b00020; }
</style>
