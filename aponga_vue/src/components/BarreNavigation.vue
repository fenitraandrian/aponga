<template>
  <header class="barre-navigation">
    <RouterLink to="/accueil" class="marque">APONGA</RouterLink>

    <nav class="menu" aria-label="Menu principal">
      <RouterLink to="/accueil">Accueil</RouterLink>
      <RouterLink to="/a-propos">À propos</RouterLink>
      <RouterLink v-if="peutVoirRoles" to="/admin/roles">Gestion des rôles</RouterLink>
      <RouterLink v-if="permissions.includes('pedagogie.lire')" to="/pedagogie">Pédagogie</RouterLink>
      <RouterLink v-if="permissions.includes('pedagogie.lire')" to="/niveaux">Niveaux</RouterLink>
      <RouterLink v-if="permissions.includes('apprenants.lire')" to="/apprenants">Apprenants</RouterLink>
      <RouterLink v-if="permissions.includes('seances.lire')" to="/planning">Planning</RouterLink>
    </nav>

    <div class="session">
      <span v-if="nomAffiche" class="nom">{{ nomAffiche }}</span>
      <button class="bouton-deconnexion" @click="seDeconnecter">Se déconnecter</button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { moi, deconnexion } from '../services/api'

const router = useRouter()
const utilisateur = ref(null)
const permissions = ref([])

const peutVoirRoles = computed(() => permissions.value.includes('roles.lire'))

const nomAffiche = computed(() => {
  if (!utilisateur.value) return ''
  const nom = `${utilisateur.value.prenom ?? ''} ${utilisateur.value.nom ?? ''}`.trim()
  return nom || utilisateur.value.email
})

onMounted(async () => {
  try {
    const donnees = await moi()
    utilisateur.value = donnees.utilisateur
    permissions.value = donnees.permissions
  } catch {
    router.push('/connexion')
  }
})

async function seDeconnecter() {
  try {
    await deconnexion()
  } finally {
    router.push('/connexion')
  }
}
</script>

<style scoped>
.barre-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #ddd;
}

.marque {
  font-weight: bold;
  font-size: 1.2rem;
  text-decoration: none;
  color: inherit;
}

.menu {
  display: flex;
  gap: 1rem;
}

.menu a {
  text-decoration: none;
  color: #0066cc;
}

.menu a.router-link-active {
  font-weight: bold;
  text-decoration: underline;
}

.session {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bouton-deconnexion {
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}
</style>
