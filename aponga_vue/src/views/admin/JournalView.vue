<template>
  <BarreNavigation />

  <main class="page">
    <h1>Journal d'activité</h1>

    <form class="filtres" @submit.prevent="appliquer" novalidate>
      <div class="champ">
        <label for="du">Du</label>
        <input id="du" v-model="filtres.du" type="date" />
      </div>
      <div class="champ">
        <label for="au">Au</label>
        <input id="au" v-model="filtres.au" type="date" />
      </div>
      <div class="champ">
        <label for="methode">Action</label>
        <select id="methode" v-model="filtres.methode">
          <option value="">Toutes</option>
          <option value="POST">Création ou action</option>
          <option value="PUT">Modification</option>
          <option value="DELETE">Suppression</option>
        </select>
      </div>
      <div class="champ">
        <label for="entite">Section</label>
        <select id="entite" v-model="filtres.entite">
          <option value="">Toutes</option>
          <option v-for="e in entites" :key="e" :value="e">{{ e }}</option>
        </select>
      </div>
      <div class="champ">
        <label for="utilisateur">Utilisateur</label>
        <input
          id="utilisateur"
          v-model="filtres.utilisateur"
          type="search"
          placeholder="Nom, prénom ou e-mail"
        />
      </div>
      <button class="bouton" type="submit">Filtrer</button>
      <button class="bouton secondaire" type="button" @click="reinitialiser">Réinitialiser</button>
    </form>

    <p v-if="erreur" class="erreur" role="alert">{{ erreur }}</p>
    <p v-if="chargement">Chargement…</p>
    <p v-else class="discret">{{ resultat.total }} entrée(s)</p>

    <table v-if="resultat.lignes.length" class="tableau">
      <thead>
        <tr>
          <th>Date</th>
          <th>Utilisateur</th>
          <th>Action</th>
          <th>Route</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="l in resultat.lignes" :key="l.id">
          <tr>
            <td>{{ formater(l.cree_le) }}</td>
            <td>{{ nomDe(l) }}</td>
            <td>{{ libelleMethode[l.methode] ?? l.methode }}</td>
            <td><code>{{ l.route }}</code></td>
            <td>{{ l.statut }}</td>
            <td>
              <button type="button" class="lien" @click="basculer(l.id)">
                {{ ouverts[l.id] ? 'Masquer' : 'Voir' }}
              </button>
            </td>
          </tr>
          <tr v-if="ouverts[l.id]" class="ligne-details">
            <td colspan="6"><pre>{{ JSON.stringify(l.details, null, 2) }}</pre></td>
          </tr>
        </template>
      </tbody>
    </table>

    <div v-if="resultat.pages > 1" class="pagination">
      <button class="bouton secondaire" :disabled="page <= 1" @click="allerA(page - 1)">
        Précédente
      </button>
      <span>Page {{ page }} / {{ resultat.pages }}</span>
      <button class="bouton secondaire" :disabled="page >= resultat.pages" @click="allerA(page + 1)">
        Suivante
      </button>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { listerJournal, listerEntitesJournal } from '../../services/api.js'

const filtres = ref({ du: '', au: '', methode: '', entite: '', utilisateur: '' })
const entites = ref([])
const resultat = ref({ lignes: [], total: 0, pages: 1 })
const page = ref(1)
const ouverts = ref({})
const chargement = ref(true)
const erreur = ref('')

const libelleMethode = {
  POST: 'Création ou action',
  PUT: 'Modification',
  PATCH: 'Modification',
  DELETE: 'Suppression',
}

function formater(valeur) {
  return new Date(valeur).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })
}

// Pour une connexion, l'utilisateur n'est pas connu du middleware : on affiche l'e-mail saisi
function nomDe(l) {
  if (l.prenom || l.nom) return `${l.prenom ?? ''} ${l.nom ?? ''}`.trim()
  return l.details?.corps?.email ?? 'Anonyme'
}

function construireParams() {
  const params = { page: page.value, taille: 20 }
  if (filtres.value.du) {
    params.du = new Date(`${filtres.value.du}T00:00`).toISOString()
  }
  if (filtres.value.au) {
    // Fin de journée incluse : on prend le jour suivant à minuit, en exclusion
    const fin = new Date(`${filtres.value.au}T00:00`)
    fin.setDate(fin.getDate() + 1)
    params.au = fin.toISOString()
  }
  if (filtres.value.methode) params.methode = filtres.value.methode
  if (filtres.value.entite) params.entite = filtres.value.entite
  if (filtres.value.utilisateur.trim()) params.utilisateur = filtres.value.utilisateur.trim()
  return params
}

async function charger() {
  chargement.value = true
  erreur.value = ''
  try {
    resultat.value = await listerJournal(construireParams())
    ouverts.value = {}
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}

function appliquer() {
  page.value = 1
  charger()
}

function reinitialiser() {
  filtres.value = { du: '', au: '', methode: '', entite: '', utilisateur: '' }
  page.value = 1
  charger()
}

function allerA(numero) {
  page.value = numero
  charger()
}

function basculer(id) {
  ouverts.value = { ...ouverts.value, [id]: !ouverts.value[id] }
}

onMounted(async () => {
  try {
    entites.value = (await listerEntitesJournal()).entites
  } catch {
    entites.value = []
  }
  charger()
})
</script>

<style scoped>
.page { padding: 16px; max-width: 1000px; margin: 0 auto; }
.filtres { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin: 16px 0; }
.champ { display: flex; flex-direction: column; gap: 4px; }
.champ input, .champ select { padding: 6px; min-width: 150px; }
.bouton { padding: 6px 12px; cursor: pointer; background: #0066cc; color: #fff; border: none; border-radius: 4px; }
.secondaire { background: #fff; color: #0066cc; border: 1px solid #0066cc; }
.bouton:disabled { opacity: 0.5; cursor: not-allowed; }
.tableau { width: 100%; border-collapse: collapse; font-size: 0.95em; }
.tableau th, .tableau td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
.ligne-details td { background: #f7f7f7; }
pre { white-space: pre-wrap; word-break: break-word; margin: 0; font-size: 0.85em; }
.lien { background: none; border: none; color: #0066cc; cursor: pointer; padding: 0; }
.pagination { display: flex; gap: 12px; align-items: center; justify-content: center; margin-top: 16px; }
.discret { color: #666; font-size: 0.9em; }
.erreur { color: #b00020; }
</style>
