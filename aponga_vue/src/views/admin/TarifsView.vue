<script setup>
import { ref, onMounted } from 'vue'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { listerNiveauxTarifs, definirTarifNiveau } from '../../services/api.js'

const niveaux = ref([])
const erreur = ref('')
const succes = ref('')

async function charger() {
  const { niveaux: liste } = await listerNiveauxTarifs()
  niveaux.value = liste.map((n) => ({ ...n, saisie: n.prix_seance ?? '' }))
}

async function enregistrer(niveau) {
  erreur.value = ''
  succes.value = ''
  try {
    await definirTarifNiveau(niveau.id, niveau.saisie)
    succes.value = `Tarif de ${niveau.libelle} enregistré.`
    await charger()
  } catch (e) {
    erreur.value = e.message
  }
}

onMounted(() => {
  charger().catch((e) => (erreur.value = e.message))
})
</script>

<template>

  <BarreNavigation />

  <main class="page">
    <h1>Tarifs par niveau</h1>
    <p v-if="erreur" class="erreur">{{ erreur }}</p>
    <p v-if="succes" class="succes">{{ succes }}</p>

    <table>
      <thead>
        <tr>
          <th>Niveau</th>
          <th>Prix d'une séance (Ar)</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="n in niveaux" :key="n.id">
          <td>{{ n.libelle }}</td>
          <td>
            <input v-model.number="n.saisie" type="number" min="1" step="100" />
          </td>
          <td>
            <button type="button" @click="enregistrer(n)">Enregistrer</button>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
.page { padding: 16px; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
input { width: 120px; }
.erreur { color: #b00020; }
.succes { color: #1b7a34; }
</style>
