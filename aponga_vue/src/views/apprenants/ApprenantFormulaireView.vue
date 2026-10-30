<template>
  <BarreNavigation />

  <main class="page-formulaire">
    <div class="carte">
      <h1>Modifier l'apprenant</h1>

      <p v-if="erreur" class="message erreur">{{ erreur }}</p>

      <form novalidate @submit.prevent="enregistrer">
        <div class="champ">
          <label for="nom">Nom</label>
          <input id="nom" v-model="formulaire.nom" type="text" maxlength="100" />
          <small v-if="erreursChamps.nom" class="erreur-champ">{{ erreursChamps.nom }}</small>
        </div>

        <div class="champ">
          <label for="prenom">Prénom</label>
          <input id="prenom" v-model="formulaire.prenom" type="text" maxlength="100" />
          <small v-if="erreursChamps.prenom" class="erreur-champ">{{ erreursChamps.prenom }}</small>
        </div>

        <div class="champ">
          <label for="email">Adresse e-mail</label>
          <input id="email" v-model="formulaire.email" type="email" />
          <small v-if="erreursChamps.email" class="erreur-champ">{{ erreursChamps.email }}</small>
        </div>

        <div class="champ">
          <label for="telephone">Téléphone</label>
          <input id="telephone" v-model="formulaire.telephone" type="tel" maxlength="30" />
        </div>

        <div class="champ">
          <label for="date-naissance">Date de naissance</label>
          <input id="date-naissance" v-model="formulaire.date_naissance" type="date" />
        </div>

        <button class="bouton-principal" type="submit" :disabled="enCours">Enregistrer</button>
      </form>

      <RouterLink :to="`/apprenants/${route.params.id}`" class="lien-secondaire">
        Retour à la fiche
      </RouterLink>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { moi, trouverApprenant, modifierApprenant } from '../../services/api'

const route = useRoute()
const router = useRouter()

const formulaire = ref({ nom: '', prenom: '', email: '', telephone: '', date_naissance: '' })
const erreur = ref('')
const erreursChamps = ref({})
const enCours = ref(false)

// L'email sert à se connecter : il est obligatoire, comme à l'inscription
function validerLocalement() {
  const erreurs = {}
  const f = formulaire.value
  if (!f.nom.trim()) erreurs.nom = 'Le nom est obligatoire.'
  if (!f.prenom.trim()) erreurs.prenom = 'Le prénom est obligatoire.'
  if (!f.email.trim()) erreurs.email = "L'adresse e-mail est obligatoire."
  erreursChamps.value = erreurs
  return Object.keys(erreurs).length === 0
}

onMounted(async () => {
  try {
    const { permissions } = await moi()
    if (!permissions.includes('apprenants.gerer')) {
      router.push(`/apprenants/${route.params.id}`)
      return
    }
    const { apprenant } = await trouverApprenant(route.params.id)
    formulaire.value = {
      nom: apprenant.nom,
      prenom: apprenant.prenom,
      email: apprenant.email ?? '',
      telephone: apprenant.telephone ?? '',
      date_naissance: apprenant.date_naissance?.slice(0, 10) ?? '',
    }
  } catch (err) {
    erreur.value = err.message
  }
})

async function enregistrer() {
  erreur.value = ''
  if (!validerLocalement()) return

  const f = formulaire.value
  enCours.value = true
  try {
    await modifierApprenant(route.params.id, {
      nom: f.nom.trim(),
      prenom: f.prenom.trim(),
      email: f.email.trim(),
      telephone: f.telephone.trim(),
      date_naissance: f.date_naissance,
    })
    router.push(`/apprenants/${route.params.id}`)
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
