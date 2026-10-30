<template>
  <main class="page-formulaire">
    <section class="carte">
      <header>
        <h1>APONGA</h1>
        <p class="sous-titre">Nouveau mot de passe</p>
      </header>

      <template v-if="!succes">
        <form @submit.prevent="changerMotDePasse" novalidate>
          <div class="champ">
            <label for="nouveau-mdp">Nouveau mot de passe (8 caractères minimum)</label>
            <div class="champ-mot-de-passe">
              <input
                id="nouveau-mdp"
                v-model="nouveauMotDePasse"
                :type="afficherMotDePasse ? 'text' : 'password'"
                autocomplete="new-password"
                :disabled="chargement"
              />
              <button
                type="button"
                class="bascule"
                @click="afficherMotDePasse = !afficherMotDePasse"
              >
                {{ afficherMotDePasse ? 'Masquer' : 'Afficher' }}
              </button>
            </div>
          </div>

          <div class="champ">
            <label for="confirmation-mdp">Confirmer le mot de passe</label>
            <input
              id="confirmation-mdp"
              v-model="confirmation"
              :type="afficherMotDePasse ? 'text' : 'password'"
              autocomplete="new-password"
              :disabled="chargement"
            />
          </div>

          <p v-if="erreur" class="message erreur" role="alert">{{ erreur }}</p>

          <button type="submit" class="bouton-principal" :disabled="chargement">
            {{ chargement ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </form>
      </template>

      <template v-else>
        <p class="message succes" role="status">{{ succes }}</p>
        <p class="pied">
          <RouterLink to="/connexion">Aller à la connexion</RouterLink>
        </p>
      </template>
    </section>
  </main>
</template>
<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { reinitialiser } from '../services/api.js'

// Le jeton vient de l'URL : /reinitialiser?jeton=...
const route = useRoute()
const jeton = String(route.query.jeton ?? '')

const nouveauMotDePasse = ref('')
const confirmation = ref('')
const afficherMotDePasse = ref(false)
const chargement = ref(false)
const erreur = ref('')
const succes = ref('')

async function changerMotDePasse() {
  erreur.value = ''

  if (!jeton) {
    erreur.value = 'Lien incomplet. Refaites une demande de réinitialisation.'
    return
  }
  if (nouveauMotDePasse.value.length < 8) {
    erreur.value = 'Le mot de passe doit contenir au moins 8 caractères.'
    return
  }
  if (nouveauMotDePasse.value !== confirmation.value) {
    erreur.value = 'Les deux mots de passe ne correspondent pas.'
    return
  }

  chargement.value = true
  try {
    const { message } = await reinitialiser(jeton, nouveauMotDePasse.value)
    succes.value = message
    nouveauMotDePasse.value = ''
    confirmation.value = ''
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}
</script>

