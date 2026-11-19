<template>
  <main class="essai-niveau">
    <h1>Choisissez votre niveau</h1>

    <p v-if="chargement">Chargement…</p>
    <p v-if="erreur" class="erreur" role="alert">{{ erreur }}</p>

    <ul class="niveaux">
      <li v-for="p in parcours" :key="p.code">
        <button class="carte" type="button" @click="choisir(p.code)">
          <strong>{{ p.libelle }}</strong>
          <span>Commence à l'unité {{ p.position_depart }}</span>
        </button>
      </li>
    </ul>

    <RouterLink to="/essai" class="retour">Retour</RouterLink>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listerParcoursEssai } from '../../services/api'

const router = useRouter()
const parcours = ref([])
const chargement = ref(true)
const erreur = ref('')

onMounted(async () => {
  try {
    const donnees = await listerParcoursEssai()
    parcours.value = donnees.parcours
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
})

function choisir(code) {
  router.push(`/essai/parcours/${code}`)
}
</script>

<style scoped>
.essai-niveau {
  max-width: 36rem;
  margin: 0 auto;
  padding: 2rem 1rem;
}
.niveaux {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 1rem;
}
.carte {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.25rem;
  text-align: left;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
}
.carte:hover,
.carte:focus-visible {
  border-color: #0066cc;
}
.erreur {
  color: #b00020;
}
.retour {
  display: inline-block;
  margin-top: 1.5rem;
}
</style>
