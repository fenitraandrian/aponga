<template>
  <BarreNavigation />

  <main class="page-formulaire">
    <div class="carte carte-large">
      <div class="entete">
        <h1>Pédagogie</h1>
        <button v-if="peutGerer" class="bouton-principal" @click="router.push('/pedagogie/nouvelle')">
          Nouvelle formation
        </button>
      </div>

      <p v-if="erreur" class="message erreur">{{ erreur }}</p>
      <p v-if="succes" class="message succes">{{ succes }}</p>

      <p v-if="formations.length === 0" class="vide">Aucune formation pour le moment.</p>

      <section v-for="formation in formations" :key="formation.id" class="formation">
        <div class="ligne-formation">
          <h2>
            <RouterLink :to="`/pedagogie/${formation.id}`">{{ formation.titre }}</RouterLink>
          </h2>
          <div v-if="peutGerer" class="actions">
            <button @click="router.push(`/pedagogie/nouvelle?parent=${formation.id}`)">+ Unité</button>
            <button @click="router.push(`/pedagogie/${formation.id}/modifier`)">Modifier</button>
            <button class="danger" @click="supprimer(formation)">Supprimer</button>
          </div>
        </div>
        <p v-if="formation.description" class="description">{{ formation.description }}</p>

        <ul class="unites">
          <li v-for="unite in unitesDe(formation.id)" :key="unite.id" class="ligne-unite">
            <div>
              <RouterLink :to="`/pedagogie/${unite.id}`">{{ unite.titre }}</RouterLink>
              <p v-if="unite.description" class="description">{{ unite.description }}</p>
            </div>
            <div v-if="peutGerer" class="actions">
              <button @click="router.push(`/pedagogie/${unite.id}/modifier`)">Modifier</button>
              <button class="danger" @click="supprimer(unite)">Supprimer</button>
            </div>
          </li>
          <li v-if="unitesDe(formation.id).length === 0" class="vide">Aucune unité.</li>
        </ul>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { moi, listerEtudes, supprimerEtude } from '../../services/api'

const router = useRouter()
const etudes = ref([])
const peutGerer = ref(false)
const erreur = ref('')
const succes = ref('')

const formations = computed(() => etudes.value.filter((e) => e.type_etude === 'formation'))

function unitesDe(idFormation) {
  return etudes.value.filter((e) => e.id_parent === idFormation)
}

async function charger() {
  const donnees = await listerEtudes()
  etudes.value = donnees.etudes
}

onMounted(async () => {
  try {
    const { permissions } = await moi()
    if (!permissions.includes('pedagogie.lire')) {
      router.push('/accueil')
      return
    }
    peutGerer.value = permissions.includes('pedagogie.gerer')
    await charger()
  } catch {
    router.push('/connexion')
  }
})

async function supprimer(etude) {
  if (!confirm(`Supprimer « ${etude.titre} » ?`)) return

  erreur.value = ''
  succes.value = ''
  try {
    await supprimerEtude(etude.id)
    succes.value = `« ${etude.titre} » a été supprimé.`
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}
</script>

<style scoped>
.carte-large {
  max-width: 900px;
  width: 100%;
}

.entete {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.formation {
  margin-top: 1.5rem;
  border-top: 1px solid #ddd;
  padding-top: 1rem;
}

.ligne-formation,
.ligne-unite {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.unites {
  list-style: none;
  padding-left: 1.5rem;
}

.ligne-unite {
  padding: 0.4rem 0;
  border-bottom: 1px dashed #eee;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.danger {
  color: #b00020;
}

.vide {
  color: #666;
  font-style: italic;
}

.description {
  color: #555;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}
</style>
