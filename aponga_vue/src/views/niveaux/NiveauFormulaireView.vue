<template>
  <BarreNavigation />

  <main class="page-formulaire">
    <div class="carte">
      <h1>{{ titrePage }}</h1>

      <p v-if="erreur" class="message erreur">{{ erreur }}</p>

      <form novalidate @submit.prevent="enregistrer">
        <div class="champ">
          <label for="nom">Nom</label>
          <input id="nom" v-model="formulaire.nom" type="text" maxlength="100" />
          <small v-if="erreursChamps.nom" class="erreur-champ">{{ erreursChamps.nom }}</small>
        </div>

        <div class="champ">
          <label for="ordre">Ordre</label>
          <input id="ordre" v-model.number="formulaire.ordre" type="number" min="0" step="1" />
          <small>L'ordre est unique : deux niveaux ne peuvent pas avoir le même.</small>
          <small v-if="erreursChamps.ordre" class="erreur-champ">{{ erreursChamps.ordre }}</small>
        </div>

        <button class="bouton-principal" type="submit" :disabled="enCours">Enregistrer</button>
      </form>

      <RouterLink to="/niveaux" class="lien-secondaire">Retour aux niveaux</RouterLink>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { moi, trouverNiveau, creerNiveau, modifierNiveau } from '../../services/api'

const router = useRouter()
const route = useRoute()

const modification = computed(() => Boolean(route.params.id))
const titrePage = computed(() => (modification.value ? 'Modifier le niveau' : 'Nouveau niveau'))

const formulaire = ref({ nom: '', ordre: null })
const erreur = ref('')
const erreursChamps = ref({})
const enCours = ref(false)

function validerLocalement() {
  const erreurs = {}
  const nom = formulaire.value.nom.trim()
  const ordre = formulaire.value.ordre

  if (!nom) erreurs.nom = 'Le nom est obligatoire.'
  else if (nom.length > 100) erreurs.nom = '100 caractères maximum.'

  if (!Number.isInteger(ordre) || ordre < 0) {
    erreurs.ordre = "L'ordre doit être un entier positif ou nul."
  }

  erreursChamps.value = erreurs
  return Object.keys(erreurs).length === 0
}

onMounted(async () => {
  try {
    const { permissions } = await moi()
    if (!permissions.includes('pedagogie.gerer')) {
      router.push('/niveaux')
      return
    }
  } catch {
    router.push('/connexion')
    return
  }

  if (modification.value) {
    try {
      const { niveau } = await trouverNiveau(route.params.id)
      formulaire.value = { nom: niveau.nom, ordre: niveau.ordre }
    } catch (err) {
      erreur.value = err.message
    }
  }
})

async function enregistrer() {
  erreur.value = ''
  if (!validerLocalement()) return

  const donnees = { nom: formulaire.value.nom.trim(), ordre: formulaire.value.ordre }

  enCours.value = true
  try {
    if (modification.value) {
      await modifierNiveau(route.params.id, donnees)
    } else {
      await creerNiveau(donnees)
    }
    router.push('/niveaux')
  } catch (err) {
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}
</script>

<style scoped>
.carte {
  max-width: 520px;
  width: 100%;
}

.erreur-champ {
  display: block;
  color: #b00020;
  margin-top: 0.25rem;
}
</style>
