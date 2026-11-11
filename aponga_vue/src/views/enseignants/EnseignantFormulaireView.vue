<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { trouverEnseignant, modifierEnseignant } from '../../services/api.js'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const form = ref({ nom: '', prenom: '', email: '', telephone: '' })
const chargement = ref(true)
const enregistrement = ref(false)
const erreur = ref('')

onMounted(async () => {
  try {
    const { enseignant } = await trouverEnseignant(id)
    form.value = {
      nom: enseignant.nom ?? '',
      prenom: enseignant.prenom ?? '',
      email: enseignant.email ?? '',
      telephone: enseignant.telephone ?? '',
    }
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
})

async function enregistrer() {
  erreur.value = ''
  enregistrement.value = true
  try {
    await modifierEnseignant(id, { ...form.value })
    router.push(`/enseignants/${id}`)
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
    <h1>Modifier l'enseignant</h1>
    <p v-if="chargement">Chargement…</p>

    <form v-else @submit.prevent="enregistrer">
      <label>Nom
        <input v-model="form.nom" required />
      </label>
      <label>Prénom
        <input v-model="form.prenom" required />
      </label>
      <label>E-mail
        <input v-model="form.email" type="email" />
      </label>
      <label>Téléphone
        <input v-model="form.telephone" />
      </label>

      <p v-if="erreur" class="erreur">{{ erreur }}</p>

      <div class="actions">
        <button type="submit" :disabled="enregistrement">Enregistrer</button>
        <RouterLink :to="`/enseignants/${id}`">Annuler</RouterLink>
      </div>
    </form>
  </main>
</template>

<style scoped>
.page { padding: 16px; max-width: 520px; margin: 0 auto; }
label { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
input { padding: 8px; }
.actions { display: flex; gap: 12px; align-items: center; }
.erreur { color: #b00020; }
</style>
