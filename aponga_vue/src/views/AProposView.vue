<template>
  <BarreNavigation />

  <main class="page-formulaire">
    <div class="carte">
      <h1>À propos</h1>

      <p v-if="erreur" class="message erreur">{{ erreur }}</p>

      <dl v-if="utilisateur" class="infos">
        <dt>Nom</dt>
        <dd>{{ utilisateur.prenom }} {{ utilisateur.nom }}</dd>

        <dt>E-mail</dt>
        <dd>{{ utilisateur.email }}</dd>

        <dt>Rôle(s)</dt>
        <dd>
          <span v-if="roles.length === 0">Aucun rôle attribué</span>
          <span v-for="role in roles" :key="role.code" class="badge">{{ role.nom }}</span>
        </dd>
      </dl>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BarreNavigation from '../components/BarreNavigation.vue'
import { moi } from '../services/api'

const router = useRouter()
const utilisateur = ref(null)
const roles = ref([])
const erreur = ref('')

onMounted(async () => {
  try {
    const donnees = await moi()
    utilisateur.value = donnees.utilisateur
    roles.value = donnees.roles
  } catch (err) {
    erreur.value = err.message
    router.push('/connexion')
  }
})
</script>

<style scoped>
.carte {
  max-width: 600px;
  width: 100%;
}

.infos {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.6rem 1.5rem;
  margin-top: 1rem;
}

.infos dt {
  font-weight: bold;
}

.infos dd {
  margin: 0;
}

.badge {
  display: inline-block;
  margin-right: 0.4rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: #e6f0ff;
  color: #0044aa;
  font-size: 0.9rem;
}
</style>
