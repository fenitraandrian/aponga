<template>
  <main class="page-formulaire">
    <section class="carte">
      <header>
        <h1>APONGA</h1>
        <p class="sous-titre">Mot de passe oublié</p>
      </header>

      <form @submit.prevent="demander" novalidate>
        <div class="champ">
          <label for="email-oublie">Adresse e-mail</label>
          <input
            id="email-oublie"
            v-model="email"
            type="email"
            autocomplete="username"
            :disabled="chargement"
          />
        </div>

        <p v-if="erreur" class="message erreur" role="alert">{{ erreur }}</p>
        <p v-if="confirmation" class="message succes" role="status">{{ confirmation }}</p>

        <button type="submit" class="bouton-principal" :disabled="chargement">
          {{ chargement ? 'Envoi en cours…' : 'Recevoir le lien' }}
        </button>
      </form>

      <p class="pied">
        <RouterLink to="/connexion">Retour à la connexion</RouterLink>
      </p>
    </section>
  </main>
</template>
<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { motDePasseOublie } from '../services/api.js'

const email = ref('')
const chargement = ref(false)
const erreur = ref('')
const confirmation = ref('')

async function demander() {
  erreur.value = ''
  confirmation.value = ''

  if (!email.value.trim()) {
    erreur.value = 'Veuillez renseigner votre adresse e-mail.'
    return
  }

  chargement.value = true
  try {
    const { message } = await motDePasseOublie(email.value.trim())
    confirmation.value = message
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}
</script>
