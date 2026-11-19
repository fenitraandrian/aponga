<template>
  <BarreNavigation />
  <main class="page-exercices">
    <h1>Exercices de la séance</h1>

    <p v-if="erreur" class="message erreur" role="alert">{{ erreur }}</p>
    <p v-if="chargement">Chargement…</p>

    <section v-if="peutGerer" class="carte">
      <h2>Nouvel exercice</h2>
      <form @submit.prevent="creer" novalidate>
        <div class="champ">
          <label for="titre">Titre</label>
          <input id="titre" v-model="formulaire.titre" :disabled="envoi" />
        </div>
        <div class="champ">
          <label for="description">Consigne</label>
          <textarea id="description" v-model="formulaire.description" rows="4" :disabled="envoi"></textarea>
        </div>
        <div class="champ">
          <label for="limite">Date limite (facultative)</label>
          <input id="limite" v-model="formulaire.dateLimite" type="datetime-local" :disabled="envoi" />
        </div>
        <button class="bouton" type="submit" :disabled="envoi">Créer l'exercice</button>
      </form>
    </section>

    <section v-for="c in consignes" :key="c.id" class="carte">
      <h2>{{ c.titre }}</h2>
      <p v-if="c.description" class="texte">{{ c.description }}</p>
      <p v-if="c.date_limite" class="meta">Date limite : {{ formater(c.date_limite) }}</p>

      <form v-if="peutDeposer" @submit.prevent="deposer(c)" novalidate>
        <div class="champ">
          <label :for="`fichiers-${c.id}`">
            Vos fichiers (PDF, image, audio ou vidéo ; 20 Mo maximum ; 5 fichiers au plus)
          </label>
          <input
            :id="`fichiers-${c.id}`"
            type="file"
            multiple
            accept="application/pdf,image/*,audio/*,video/*"
            @change="choisir(c.id, $event)"
          />
        </div>
        <p v-if="messages[c.id]" :class="['message', messages[c.id].type]" role="status">
          {{ messages[c.id].texte }}
        </p>
        <button
          class="bouton"
          type="submit"
          :disabled="!(fichiersChoisis[c.id] && fichiersChoisis[c.id].length) || envoyant[c.id]"
        >
          {{ envoyant[c.id] ? 'Envoi en cours…' : 'Envoyer mon exercice' }}
        </button>
      </form>
    </section>

    <p v-if="!chargement && !consignes.length" class="meta">Aucun exercice pour cette séance.</p>

    <RouterLink :to="peutGerer ? `/seances/${id}` : '/mes-seances'" class="retour">
      {{ peutGerer ? 'Retour à la séance' : 'Retour à mes séances' }}
    </RouterLink>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  moi,
  listerConsignesSeance,
  creerConsigneSeance,
  deposerExercice,
} from '../../services/api'

const route = useRoute()
const id = route.params.id

const consignes = ref([])
const permissions = ref([])
const chargement = ref(true)
const erreur = ref('')
const envoi = ref(false)
const formulaire = ref({ titre: '', description: '', dateLimite: '' })
const fichiersChoisis = ref({})
const envoyant = ref({})
const messages = ref({})

const peutGerer = computed(() => permissions.value.includes('exercices.gerer'))
const peutDeposer = computed(() => permissions.value.includes('exercices.soumettre'))

function formater(date) {
  return new Date(date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

async function charger() {
  try {
    const [profil, donnees] = await Promise.all([moi(), listerConsignesSeance(id)])
    permissions.value = profil.permissions
    consignes.value = donnees.consignes
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}

async function creer() {
  erreur.value = ''
  if (!formulaire.value.titre.trim()) {
    erreur.value = 'Le titre est obligatoire.'
    return
  }
  envoi.value = true
  try {
    await creerConsigneSeance(id, {
      titre: formulaire.value.titre.trim(),
      description: formulaire.value.description.trim() || null,
      date_limite: formulaire.value.dateLimite
        ? new Date(formulaire.value.dateLimite).toISOString()
        : null,
    })
    formulaire.value = { titre: '', description: '', dateLimite: '' }
    consignes.value = (await listerConsignesSeance(id)).consignes
  } catch (e) {
    erreur.value = e.message
  } finally {
    envoi.value = false
  }
}

function choisir(idConsigne, evenement) {
  fichiersChoisis.value = {
    ...fichiersChoisis.value,
    [idConsigne]: Array.from(evenement.target.files),
  }
}

async function deposer(c) {
  const fichiers = fichiersChoisis.value[c.id] ?? []
  envoyant.value = { ...envoyant.value, [c.id]: true }
  messages.value = { ...messages.value, [c.id]: null }
  try {
    const { depot } = await deposerExercice(c.id, fichiers)
    messages.value = {
      ...messages.value,
      [c.id]: {
        type: 'succes',
        texte: `Dépôt envoyé (version ${depot.numero_version}). Il est en attente de correction.`,
      },
    }
    fichiersChoisis.value = { ...fichiersChoisis.value, [c.id]: [] }
  } catch (e) {
    messages.value = { ...messages.value, [c.id]: { type: 'erreur', texte: e.message } }
  } finally {
    envoyant.value = { ...envoyant.value, [c.id]: false }
  }
}

onMounted(charger)
</script>

<style scoped>
.page-exercices {
  max-width: 44rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}
.carte {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}
.champ {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.9rem;
}
.champ input,
.champ textarea,
.champ select {
  padding: 0.5rem;
  font: inherit;
}
.bouton {
  padding: 0.6rem 1.3rem;
  background: #0066cc;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.bouton:disabled {
  background: #9bbfe6;
  cursor: not-allowed;
}
.message.erreur {
  color: #b00020;
}
.message.succes {
  color: #2e7d32;
}
.meta {
  color: #555;
  font-size: 0.9rem;
}
.retour {
  display: inline-block;
  margin-top: 1rem;
}
</style>
