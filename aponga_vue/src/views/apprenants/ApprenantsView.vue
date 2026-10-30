<template>
  <BarreNavigation />

  <main class="page">
    <h1>Apprenants</h1>

    <div class="champ">
      <label for="recherche">Rechercher (nom, prénom ou email)</label>
      <input id="recherche" v-model="recherche" type="search" />
    </div>

    <p v-if="erreur" class="message erreur">{{ erreur }}</p>
    <p v-if="chargement">Chargement…</p>
    <p v-else-if="apprenants.length === 0">Aucun apprenant trouvé.</p>

    <ul v-else class="liste">
      <li v-for="apprenant in apprenants" :key="apprenant.id_membre" class="ligne">
        <RouterLink :to="`/apprenants/${apprenant.id_membre}`">
          {{ apprenant.nom }} {{ apprenant.prenom }}
        </RouterLink>
        <span>{{ apprenant.niveau ?? 'Aucun niveau' }}</span>
      </li>
    </ul>
  </main>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { moi, listerApprenants } from '../../services/api'

const router = useRouter()
const apprenants = ref([])
const recherche = ref('')
const chargement = ref(true)
const erreur = ref('')
let minuteur = null

async function charger() {
  chargement.value = true
  erreur.value = ''
  try {
    const { apprenants: liste } = await listerApprenants(recherche.value.trim())
    apprenants.value = liste
  } catch (err) {
    erreur.value = err.message
  } finally {
    chargement.value = false
  }
}

// Attend 300 ms après la dernière frappe avant de chercher
watch(recherche, () => {
  clearTimeout(minuteur)
  minuteur = setTimeout(charger, 300)
})

onMounted(async () => {
  try {
    const { permissions } = await moi()
    if (!permissions.includes('apprenants.lire')) {
      router.push('/accueil')
      return
    }
  } catch {
    router.push('/connexion')
    return
  }
  charger()
})
</script>

<style scoped>
.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 1rem;
}

.liste {
  list-style: none;
  padding: 0;
}

.ligne {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e5e5;
}
</style>
