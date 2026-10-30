<template>
  <BarreNavigation />

  <main class="page">
    <div class="entete">
      <h1>Niveaux</h1>
      <RouterLink v-if="peutGerer" to="/niveaux/nouveau" class="bouton-principal">
        Nouveau niveau
      </RouterLink>
    </div>

    <p v-if="erreur" class="message erreur">{{ erreur }}</p>
    <p v-if="chargement">Chargement…</p>
    <p v-else-if="niveaux.length === 0">Aucun niveau pour le moment.</p>

    <ul v-else class="liste">
      <li v-for="niveau in niveaux" :key="niveau.id" class="ligne">
        <span>{{ niveau.ordre }}. {{ niveau.nom }}</span>
        <span v-if="peutGerer" class="actions">
          <RouterLink :to="`/niveaux/${niveau.id}/modifier`">Modifier</RouterLink>
          <button type="button" @click="supprimer(niveau)">Supprimer</button>
        </span>
      </li>
    </ul>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { moi, listerNiveaux, supprimerNiveau } from '../../services/api'

const router = useRouter()
const niveaux = ref([])
const peutGerer = ref(false)
const chargement = ref(true)
const erreur = ref('')

onMounted(async () => {
  try {
    const { permissions } = await moi()
    if (!permissions.includes('pedagogie.lire')) {
      router.push('/accueil')
      return
    }
    peutGerer.value = permissions.includes('pedagogie.gerer')
    const { niveaux: liste } = await listerNiveaux()
    niveaux.value = liste
  } catch (err) {
    erreur.value = err.message
  } finally {
    chargement.value = false
  }
})

async function supprimer(niveau) {
  if (!window.confirm(`Supprimer le niveau « ${niveau.nom} » ?`)) return
  erreur.value = ''
  try {
    await supprimerNiveau(niveau.id)
    niveaux.value = niveaux.value.filter((n) => n.id !== niveau.id)
  } catch (err) {
    erreur.value = err.message
  }
}
</script>

<style scoped>
.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 1rem;
}

.entete,
.ligne {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.liste {
  list-style: none;
  padding: 0;
}

.ligne {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e5e5;
}

.actions {
  display: flex;
  gap: 0.75rem;
}
</style>
