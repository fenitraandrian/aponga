<template>
  <BarreNavigation />
  <main class="page-formulaire">
    <div class="carte carte-large">
      <h1>Gestion des rôles</h1>

      <p v-if="erreur" class="message erreur">{{ erreur }}</p>
      <p v-if="succes" class="message succes">{{ succes }}</p>

      <table class="tableau-roles">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th v-for="role in roles" :key="role.code">{{ role.nom }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in utilisateurs" :key="user.id">
            <td>{{ user.email }}</td>
            <td v-for="role in roles" :key="role.code">
              <input
                type="checkbox"
                :value="role.code"
                v-model="selection[user.id]"
                :disabled="!peutGerer"
                :aria-label="`${role.nom} pour ${user.email}`"
              />
            </td>
            <td>
              <button
                class="bouton-principal"
                :disabled="!peutGerer || enregistrement === user.id"
                @click="enregistrer(user)"
              >
                Enregistrer
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <RouterLink to="/accueil" class="lien-secondaire">Retour à l'accueil</RouterLink>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  moi,
  listerUtilisateurs,
  listerRoles,
  modifierRolesUtilisateur,
} from '../../services/api'

const router = useRouter()

const utilisateurs = ref([])
const roles = ref([])
const selection = ref({}) // { [idUtilisateur]: ['formateur', ...] }
const peutGerer = ref(false)
const enregistrement = ref(null) // id de l'utilisateur en cours d'enregistrement
const erreur = ref('')
const succes = ref('')

onMounted(async () => {
  try {
    const { permissions } = await moi()

    // Sans roles.lire, l'écran n'a pas de raison d'être affiché
    if (!permissions.includes('roles.lire')) {
      router.push('/accueil')
      return
    }

    peutGerer.value = permissions.includes('roles.gerer')

    const [donneesUtilisateurs, donneesRoles] = await Promise.all([
      listerUtilisateurs(),
      listerRoles(),
    ])

    utilisateurs.value = donneesUtilisateurs.utilisateurs
    roles.value = donneesRoles.roles

    for (const user of utilisateurs.value) {
      selection.value[user.id] = [...(user.roles ?? [])]
    }
  } catch {
    router.push('/connexion')
  }
})

async function enregistrer(user) {
  erreur.value = ''
  succes.value = ''
  enregistrement.value = user.id

  try {
    const rolesChoisis = [...selection.value[user.id]]
    await modifierRolesUtilisateur(user.id, rolesChoisis)
    user.roles = rolesChoisis
    succes.value = `Rôles de ${user.email} mis à jour.`
  } catch (err) {
    erreur.value = err.message
  } finally {
    enregistrement.value = null
  }
}
</script>

<style scoped>
.carte-large {
  max-width: 900px;
  width: 100%;
}

.tableau-roles {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.tableau-roles th,
.tableau-roles td {
  padding: 0.5rem;
  text-align: center;
  border-bottom: 1px solid #ddd;
}

.tableau-roles td:first-child,
.tableau-roles th:first-child {
  text-align: left;
}
</style>
