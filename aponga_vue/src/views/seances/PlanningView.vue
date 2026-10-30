<template>
  <BarreNavigation />

  <main class="page">
    <h1>Planning des séances</h1>

    <section class="filtres">
      <div class="champ">
        <label for="du">Du</label>
        <input id="du" v-model="filtre.du" type="date" />
      </div>
      <div class="champ">
        <label for="au">Au</label>
        <input id="au" v-model="filtre.au" type="date" />
      </div>
      <button type="button" class="bouton-secondaire" @click="charger">Afficher</button>
    </section>

    <p v-if="erreur" class="message erreur">{{ erreur }}</p>
    <p v-if="message" class="message succes">{{ message }}</p>

    <p v-if="chargement">Chargement…</p>
    <p v-else-if="seances.length === 0">Aucune séance sur cette période.</p>

    <ul v-else class="liste">
      <li v-for="seance in seances" :key="seance.id" class="ligne">
        <div>
          <strong>{{ formaterDate(seance.date_debut) }}</strong>
          ({{ seance.duree_minutes }} min)<br />
          {{ seance.unite }} : {{ seance.enseignant_prenom }} {{ seance.enseignant_nom }}
        </div>
        <span v-if="peutGerer" class="actions">
          <button type="button" @click="modifier(seance)">Modifier</button>
          <button type="button" @click="supprimer(seance)">Supprimer</button>
        </span>
      </li>
    </ul>

    <section v-if="peutGerer" class="formulaire">
      <h2>{{ seanceEnCours ? 'Modifier la séance' : 'Nouvelle séance' }}</h2>

      <form novalidate @submit.prevent="enregistrer">
        <div class="champ">
          <label for="unite">Unité</label>
          <select id="unite" v-model="formulaire.id_etude">
            <option value="">Choisir une unité</option>
            <option v-for="unite in unites" :key="unite.id" :value="unite.id">
              {{ unite.titre }}
            </option>
          </select>
        </div>

        <div class="champ">
          <label for="enseignant">Enseignant</label>
          <select id="enseignant" v-model="formulaire.id_enseignant">
            <option value="">Choisir un enseignant</option>
            <option v-for="enseignant in enseignants" :key="enseignant.id" :value="enseignant.id">
              {{ enseignant.prenom }} {{ enseignant.nom }}
            </option>
          </select>
        </div>

        <div class="champ">
          <label for="date">Date</label>
          <input id="date" v-model="formulaire.date" type="date" />
        </div>

        <div class="champ">
          <label for="heure">Heure de début</label>
          <input id="heure" v-model="formulaire.heure" type="time" />
        </div>

        <div class="champ">
          <label for="duree">Durée (minutes)</label>
          <input id="duree" v-model.number="formulaire.duree_minutes" type="number" min="1" max="1440" />
        </div>

        <button class="bouton-principal" type="submit" :disabled="enCours">Enregistrer</button>
        <button
          v-if="seanceEnCours"
          type="button"
          class="bouton-secondaire"
          @click="annuler"
        >
          Annuler la modification
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  moi,
  listerSeances,
  creerSeance,
  modifierSeance,
  supprimerSeance,
  listerEtudes,
  listerEnseignantsSeance,
} from '../../services/api'

const router = useRouter()

// Dates locales au format AAAA-MM-JJ (fr-CA et en-CA donnent ce format)
function dateDuJour(decalageJours = 0) {
  const d = new Date()
  d.setDate(d.getDate() + decalageJours)
  return d.toLocaleDateString('en-CA')
}

function videFormulaire() {
  return {
    id: null,
    id_etude: '',
    id_enseignant: '',
    date: dateDuJour(0),
    heure: '09:00',
    duree_minutes: 60,
  }
}

const peutGerer = ref(false)
const seances = ref([])
const unites = ref([])
const enseignants = ref([])
const filtre = ref({ du: dateDuJour(0), au: dateDuJour(30) })
const formulaire = ref(videFormulaire())
const chargement = ref(true)
const enCours = ref(false)
const erreur = ref('')
const message = ref('')

const seanceEnCours = computed(() => formulaire.value.id !== null)

function formaterDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

async function charger() {
  chargement.value = true
  erreur.value = ''
  try {
    // Début du premier jour, fin du dernier jour inclus
    const du = new Date(`${filtre.value.du}T00:00`).toISOString()
    const fin = new Date(`${filtre.value.au}T00:00`)
    fin.setDate(fin.getDate() + 1)
    const { seances: liste } = await listerSeances(du, fin.toISOString())
    seances.value = liste
  } catch (err) {
    erreur.value = err.message
  } finally {
    chargement.value = false
  }
}

onMounted(async () => {
  try {
    const { permissions } = await moi()
    if (!permissions.includes('seances.lire')) {
      router.push('/accueil')
      return
    }
    peutGerer.value = permissions.includes('seances.gerer')
  } catch {
    router.push('/connexion')
    return
  }

  charger()

  if (peutGerer.value) {
    try {
      const { etudes } = await listerEtudes()
      unites.value = etudes.filter((etude) => etude.type_etude === 'unite')
      const { enseignants: liste } = await listerEnseignantsSeance()
      enseignants.value = liste
    } catch (err) {
      erreur.value = err.message
    }
  }
})

function modifier(seance) {
  const debut = new Date(seance.date_debut)
  formulaire.value = {
    id: seance.id,
    id_etude: seance.id_etude,
    id_enseignant: seance.id_enseignant,
    date: debut.toLocaleDateString('en-CA'),
    heure: debut.toTimeString().slice(0, 5),
    duree_minutes: seance.duree_minutes,
  }
  erreur.value = ''
  message.value = ''
}

function annuler() {
  formulaire.value = videFormulaire()
}

async function enregistrer() {
  erreur.value = ''
  message.value = ''
  const f = formulaire.value

  if (!f.id_etude || !f.id_enseignant || !f.date || !f.heure || !f.duree_minutes) {
    erreur.value = 'Tous les champs sont obligatoires.'
    return
  }

  const corps = {
    id_etude: Number(f.id_etude),
    id_enseignant: Number(f.id_enseignant),
    // L'heure saisie est locale au navigateur : elle est convertie en instant précis
    date_debut: new Date(`${f.date}T${f.heure}`).toISOString(),
    duree_minutes: Number(f.duree_minutes),
  }

  enCours.value = true
  try {
    if (seanceEnCours.value) {
      await modifierSeance(f.id, corps)
      message.value = 'Séance modifiée.'
    } else {
      await creerSeance(corps)
      message.value = 'Séance créée.'
    }
    formulaire.value = videFormulaire()
    await charger()
  } catch (err) {
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}

async function supprimer(seance) {
  if (!window.confirm(`Supprimer la séance de ${seance.unite} du ${formaterDate(seance.date_debut)} ?`)) {
    return
  }
  erreur.value = ''
  message.value = ''
  try {
    await supprimerSeance(seance.id)
    message.value = 'Séance supprimée.'
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 1rem;
}

.filtres,
.ligne,
.actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.filtres {
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.liste {
  list-style: none;
  padding: 0;
}

.ligne {
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e5e5;
}

.formulaire {
  margin-top: 2rem;
}
</style>
