<template>
  <main class="page-formulaire">
    <section class="carte">
      <header>
        <h1>APONGA</h1>
        <p class="sous-titre">Créer un compte</p>
      </header>

      <form @submit.prevent="creerCompte" novalidate>
        <div class="champ">
          <label for="nom">Nom</label>
          <input id="nom" v-model="formulaire.nom" autocomplete="family-name" :disabled="chargement" />
        </div>

        <div class="champ">
          <label for="prenom">Prénom</label>
          <input id="prenom" v-model="formulaire.prenom" autocomplete="given-name" :disabled="chargement" />
        </div>

        <div class="champ">
          <label for="email-inscription">Adresse e-mail</label>
          <input
            id="email-inscription"
            v-model="formulaire.email"
            type="email"
            autocomplete="email"
            :disabled="chargement"
          />
        </div>

        <div class="champ">
          <label for="telephone">Téléphone</label>
          <input
            id="telephone"
            v-model="formulaire.telephone"
            type="tel"
            autocomplete="tel"
            :disabled="chargement"
          />
        </div>

        <div class="champ">
          <label for="mdp-inscription">Mot de passe (8 caractères minimum)</label>
          <div class="champ-mot-de-passe">
            <input
              id="mdp-inscription"
              v-model="formulaire.motDePasse"
              :type="afficherMotDePasse ? 'text' : 'password'"
              autocomplete="new-password"
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

        <div class="champ">
          <label for="confirmation">Confirmer le mot de passe</label>
          <input
            id="confirmation"
            v-model="formulaire.confirmation"
            :type="afficherMotDePasse ? 'text' : 'password'"
            autocomplete="new-password"
            :disabled="chargement"
          />
        </div>

        <p v-if="erreur" class="message erreur" role="alert">{{ erreur }}</p>
        <p v-if="succes" class="message succes" role="status">{{ succes }}</p>

        <button type="submit" class="bouton-principal" :disabled="chargement">
          {{ chargement ? 'Création en cours…' : 'Créer mon compte' }}
        </button>
      </form>

      <p class="pied">
        Déjà inscrit ?
        <RouterLink to="/connexion">Se connecter</RouterLink>
      </p>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { inscription } from '../services/api.js'

const vide = () => ({ nom: '', prenom: '', email: '', telephone: '', motDePasse: '', confirmation: '' })
const formulaire = ref(vide())
const afficherMotDePasse = ref(false)
const chargement = ref(false)
const erreur = ref('')
const succes = ref('')

async function creerCompte() {
  erreur.value = ''
  succes.value = ''
  const f = formulaire.value

  if (!f.nom.trim() || !f.prenom.trim()) {
    erreur.value = 'Le nom et le prénom sont obligatoires.'
    return
  }
  if (!f.email.trim() && !f.telephone.trim()) {
    erreur.value = 'Renseignez au moins une adresse e-mail ou un numéro de téléphone.'
    return
  }
  if (f.motDePasse.length < 8) {
    erreur.value = 'Le mot de passe doit contenir au moins 8 caractères.'
    return
  }
  if (f.motDePasse !== f.confirmation) {
    erreur.value = 'Les deux mots de passe ne correspondent pas.'
    return
  }

  chargement.value = true
  try {
    const { utilisateur } = await inscription({
      nom: f.nom,
      prenom: f.prenom,
      email: f.email,
      telephone: f.telephone,
      motDePasse: f.motDePasse,
    })
    succes.value = `Compte créé pour ${utilisateur.prenom}. Vous pouvez maintenant vous connecter.`
    formulaire.value = vide()
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}
</script>
