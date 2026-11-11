<template>
  <BarreNavigation />
  
  <main class="page">
    <p v-if="chargement">Chargement…</p>
    <p v-else-if="erreur && !seance" class="erreur">{{ erreur }}</p>

    <template v-else-if="seance">
      <header>
        <h1>Séance du {{ formaterDateHeure(seance.date_debut) }}</h1>
        <p v-if="capacite === null">Pas de limite de places.</p>
        <p v-else>
          {{ inscrits.length }} / {{ capacite }} places
          <span v-if="complete" class="alerte">(complète)</span>
        </p>
        <p v-if="!aVenir" class="discret">Cette séance a déjà commencé. Les inscriptions ne sont plus modifiables.</p>
      </header>

      <section>
        <h2>Apprenants inscrits</h2>
        <p v-if="!inscrits.length">Aucun apprenant inscrit pour le moment.</p>
        <ul v-else>
          <li v-for="i in inscrits" :key="i.id_membre">
            {{ nomComplet(i) }}
            <span class="discret">{{ i.email }}</span>
            <button
              v-if="peutGerer && aVenir"
              type="button"
              @click="desinscrire(i.id_membre)"
            >Retirer</button>
          </li>
        </ul>
      </section>

      <section v-if="peutGerer && aVenir && !complete">
        <h2>Inscrire un apprenant</h2>
        <input v-model="recherche" placeholder="Rechercher un apprenant" />
        <div class="ajout">
          <select v-model="idMembreChoisi">
            <option value="" disabled>Choisir un apprenant</option>
            <option
              v-for="a in apprenantsDisponibles"
              :key="a.id_membre ?? a.id"
              :value="a.id_membre ?? a.id"
            >{{ nomComplet(a) }}</option>
          </select>
          <button type="button" :disabled="!idMembreChoisi" @click="inscrire">Inscrire</button>
        </div>
      </section>

      <p v-if="erreur" class="erreur">{{ erreur }}</p>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  trouverSeance,
  listerInscrits,
  inscrireApprenantSeance,
  desinscrireApprenantSeance,
  listerApprenants,
  moi,
} from '../../services/api.js'

const route = useRoute()
const id = route.params.id

const seance = ref(null)
const inscrits = ref([])
const capacite = ref(null)
const apprenants = ref([])
const recherche = ref('')
const idMembreChoisi = ref('')
const peutGerer = ref(false)
const chargement = ref(true)
const erreur = ref('')

// Accepte un tableau directement, ou un objet qui contient la liste
function extraire(reponse, cle) {
  if (Array.isArray(reponse)) return reponse
  return reponse?.[cle] ?? reponse?.collection ?? []
}

function nomComplet(p) {
  return `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || p.email
}

function formaterDateHeure(valeur) {
  return new Date(valeur).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
}

const aVenir = computed(() => !!seance.value && new Date(seance.value.date_debut) > new Date())
const complete = computed(() => capacite.value !== null && inscrits.value.length >= capacite.value)

// Apprenants pas encore inscrits, filtrés par la recherche
const apprenantsDisponibles = computed(() => {
  const dejaInscrits = inscrits.value.map((i) => i.id_membre)
  const texte = recherche.value.trim().toLowerCase()
  return apprenants.value.filter((a) => {
    const idMembre = a.id_membre ?? a.id
    return !dejaInscrits.includes(idMembre) && nomComplet(a).toLowerCase().includes(texte)
  })
})

onMounted(async () => {
  try {
    const session = await moi()
    peutGerer.value = session.permissions.includes('inscriptions.gerer')

    const reponseSeance = await trouverSeance(id)
    seance.value = reponseSeance.seance ?? reponseSeance

    const liste = await listerInscrits(id)
    inscrits.value = liste.inscrits
    capacite.value = liste.capacite

    if (peutGerer.value) {
      const reponse = await listerApprenants('')
      apprenants.value = extraire(reponse, 'apprenants')
    }
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
})

async function inscrire() {
  if (!idMembreChoisi.value) return
  erreur.value = ''
  try {
    const liste = await inscrireApprenantSeance(id, Number(idMembreChoisi.value))
    inscrits.value = liste.inscrits
    capacite.value = liste.capacite
    idMembreChoisi.value = ''
  } catch (e) {
    erreur.value = e.message
  }
}

async function desinscrire(idMembre) {
  if (!window.confirm('Retirer cet apprenant de la séance ?')) return
  erreur.value = ''
  try {
    const liste = await desinscrireApprenantSeance(id, idMembre)
    inscrits.value = liste.inscrits
    capacite.value = liste.capacite
  } catch (e) {
    erreur.value = e.message
  }
}
</script>

<style scoped>
.page { padding: 16px; max-width: 760px; margin: 0 auto; }
section { margin-top: 24px; }
.discret { color: #666; font-size: 0.9em; }
.alerte { color: #b26a00; font-weight: bold; }
.ajout { margin-top: 12px; display: flex; gap: 8px; }
.erreur { color: #b00020; }
</style>
