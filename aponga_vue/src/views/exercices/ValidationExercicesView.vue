<template>
  <BarreNavigation />
  <main class="page-exercices">
    <h1>Exercices à valider</h1>

    <p v-if="erreur" class="message erreur" role="alert">{{ erreur }}</p>
    <p v-if="chargement">Chargement…</p>
    <p v-else-if="!depots.length" class="meta">Aucun exercice en attente de correction.</p>

    <section v-for="d in depots" :key="d.id" class="carte">
      <h2>{{ d.prenom }} {{ d.nom }}</h2>
      <p class="meta">
        {{ d.consigne_titre }} · séance du {{ formater(d.seance_date) }} · version {{ d.numero_version }}
        · déposé le {{ formater(d.depose_le) }}
      </p>

      <ul class="fichiers">
        <li v-for="f in d.fichiers" :key="f.id">
          <a :href="urlTelechargementFichierDepot(f.id)" target="_blank" rel="noopener">{{ f.nom }}</a>
        </li>
      </ul>

      <form @submit.prevent="valider(d)" novalidate>
        <fieldset class="decision">
          <legend>Décision</legend>
          <label>
            <input type="radio" value="valider" v-model="formulaires[d.id].decision" />
            Valider
          </label>
          <label>
            <input type="radio" value="rejeter" v-model="formulaires[d.id].decision" />
            Rejeter (à refaire)
          </label>
        </fieldset>

        <div v-if="formulaires[d.id].decision === 'valider'" class="champ">
          <label :for="`note-${d.id}`">Note sur 20</label>
          <input
            :id="`note-${d.id}`"
            v-model="formulaires[d.id].note"
            type="number"
            min="0"
            max="20"
            step="0.5"
            :disabled="envoyant[d.id]"
          />
        </div>

        <div class="champ">
          <label :for="`commentaire-${d.id}`">
            Commentaire {{ formulaires[d.id].decision === 'rejeter' ? '(obligatoire)' : '(facultatif)' }}
          </label>
          <textarea
            :id="`commentaire-${d.id}`"
            v-model="formulaires[d.id].commentaire"
            rows="3"
            :disabled="envoyant[d.id]"
          ></textarea>
        </div>

        <p v-if="messages[d.id]" class="message erreur" role="alert">{{ messages[d.id] }}</p>

        <button class="bouton" type="submit" :disabled="envoyant[d.id]">
          {{ envoyant[d.id] ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  listerDepots,
  validerDepot,
  urlTelechargementFichierDepot,
} from '../../services/api'

const depots = ref([])
const formulaires = ref({})
const messages = ref({})
const envoyant = ref({})
const chargement = ref(true)
const erreur = ref('')

function formater(date) {
  return new Date(date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

async function charger() {
  chargement.value = true
  erreur.value = ''
  try {
    const donnees = await listerDepots('soumis')
    formulaires.value = Object.fromEntries(
      donnees.depots.map((d) => [d.id, { decision: 'valider', note: '', commentaire: '' }])
    )
    depots.value = donnees.depots
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}

async function valider(d) {
  const f = formulaires.value[d.id]
  messages.value = { ...messages.value, [d.id]: '' }

  if (f.decision === 'valider' && (f.note === '' || f.note === null)) {
    messages.value = { ...messages.value, [d.id]: 'Indiquez une note sur 20.' }
    return
  }
  if (f.decision === 'rejeter' && !f.commentaire.trim()) {
    messages.value = { ...messages.value, [d.id]: 'Un commentaire est obligatoire pour un rejet.' }
    return
  }

  envoyant.value = { ...envoyant.value, [d.id]: true }
  try {
    await validerDepot(d.id, {
      decision: f.decision,
      note: f.decision === 'valider' ? Number(f.note) : undefined,
      commentaire: f.commentaire.trim() || undefined,
    })
    depots.value = depots.value.filter((x) => x.id !== d.id)
  } catch (e) {
    messages.value = { ...messages.value, [d.id]: e.message }
  } finally {
    envoyant.value = { ...envoyant.value, [d.id]: false }
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
.meta {
  color: #555;
  font-size: 0.9rem;
}
.fichiers {
  margin: 0.5rem 0 1rem;
}
.decision {
  border: none;
  padding: 0;
  margin-bottom: 0.9rem;
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}
.champ {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.9rem;
}
.champ input,
.champ textarea {
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
</style>
