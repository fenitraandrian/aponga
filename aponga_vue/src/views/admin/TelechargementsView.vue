<script setup>
import { ref, onMounted } from 'vue'
import BarreNavigation from '../../components/BarreNavigation.vue'

import { listerReglesTelechargement, modifierRegleTelechargement } from '../../services/api.js'

const regles = ref([])
const chargement = ref(true)
const erreur = ref('')

const libelles = {
  pdf: 'Documents PDF',
  image: 'Images',
  audio: 'Fichiers audio',
  video: 'Vidéos',
}

onMounted(async () => {
  try {
    const reponse = await listerReglesTelechargement()
    regles.value = reponse.regles
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
})

async function changer(regle, valeur) {
  erreur.value = ''
  try {
    const reponse = await modifierRegleTelechargement(regle.type_fichier, valeur)
    regles.value = reponse.regles
  } catch (e) {
    erreur.value = e.message
    // Remet la case à son état réel si l'enregistrement a échoué
    const reponse = await listerReglesTelechargement()
    regles.value = reponse.regles
  }
}
</script>

<template>
  <BarreNavigation />

  <main class="page">
    <h1>Téléchargement des documents</h1>
    <p class="discret">
      Cochez les types de documents que les apprenants peuvent télécharger.
      La lecture en ligne reste possible pour les apprenants inscrits à la séance.
      Les formateurs et les administrateurs peuvent toujours télécharger.
    </p>

    <p v-if="chargement">Chargement…</p>
    <p v-else-if="erreur" class="erreur" role="alert">{{ erreur }}</p>

    <ul v-if="!chargement" class="liste">
      <li v-for="r in regles" :key="r.type_fichier">
        <label>
          <input
            type="checkbox"
            :checked="r.telechargeable"
            @change="changer(r, $event.target.checked)"
          />
          {{ libelles[r.type_fichier] ?? r.type_fichier }}
        </label>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.page { padding: 16px; max-width: 640px; margin: 0 auto; }
.liste { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.discret { color: #666; font-size: 0.95em; }
.erreur { color: #b00020; }
</style>
