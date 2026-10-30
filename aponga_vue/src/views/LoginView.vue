<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { connexion } from '../services/api.js'

// MODIFICATION : début (le routeur remplace l'événement envoyé au parent)
const router = useRouter()
// MODIFICATION : fin

const email = ref('')
const motDePasse = ref('')
const afficherMotDePasse = ref(false)
const chargement = ref(false)
const erreur = ref('')

async function seConnecter() {
  erreur.value = ''

  if (!email.value || !motDePasse.value) {
    erreur.value = 'Veuillez renseigner votre e-mail et votre mot de passe.'
    return
  }

  chargement.value = true
  try {
    // MODIFICATION : début (après connexion, on va à l'accueil ; le cookie est posé par le serveur)
    await connexion(email.value, motDePasse.value)
    motDePasse.value = ''
    router.push('/accueil')
    // MODIFICATION : fin
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}
</script>

<template>
  <main class="page-formulaire">
    <section class="carte">
      <header>
        <h1>APONGA</h1>
        <p class="sous-titre">Connexion à votre espace</p>
      </header>

      <form @submit.prevent="seConnecter" novalidate>
        <div class="champ">
          <label for="email">Adresse e-mail</label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            autocomplete="username"
            placeholder="vous@exemple.mg"
            :disabled="chargement"
          />
        </div>

        <div class="champ">
          <label for="mot-de-passe">Mot de passe</label>
          <div class="champ-mot-de-passe">
            <input
              id="mot-de-passe"
              v-model="motDePasse"
              :type="afficherMotDePasse ? 'text' : 'password'"
              autocomplete="current-password"
              :disabled="chargement"
            />
            <button
              type="button"
              class="bascule"
              :aria-label="afficherMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
              @click="afficherMotDePasse = !afficherMotDePasse"
            >
              {{ afficherMotDePasse ? 'Masquer' : 'Afficher' }}
            </button>
          </div>
        </div>

        <p v-if="erreur" class="message erreur" role="alert">{{ erreur }}</p>

        <button type="submit" class="bouton-principal" :disabled="chargement">
          {{ chargement ? 'Connexion en cours…' : 'Se connecter' }}
        </button>
      </form>

      <p class="pied">
        Pas encore de compte ?
        <!-- MODIFICATION : lien géré par le routeur -->
        <RouterLink to="/inscription">Créer un compte</RouterLink>
      </p>
      <!-- MODIFICATION : lien géré par le routeur -->
      <RouterLink to="/mot-de-passe-oublie" class="lien-secondaire">Mot de passe oublié ?</RouterLink>
    </section>
  </main>
</template>
