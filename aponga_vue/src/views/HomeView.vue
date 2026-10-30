<template>
  <BarreNavigation />

  <main class="page-formulaire">
    <div class="carte">
      <h1>Bienvenue sur APONGA</h1>
      <p>Utilisez le menu ci-dessus pour accéder à votre espace.</p>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { moi } from '../services/api.js'
import BarreNavigation from '../components/BarreNavigation.vue'

const router = useRouter()
const utilisateur = ref(null)
const chargement = ref(true)

onMounted(async () => {
  try {
    const donnees = await moi()
    utilisateur.value = donnees.utilisateur
  } catch {
    // Pas de session valide : retour à la connexion
    router.push('/connexion')
  } finally {
    chargement.value = false
  }
})

// async function seDeconnecter() {
//   try {
//     await deconnexion()
//   } finally {
//     router.push('/connexion')
//   }
// }
</script>


