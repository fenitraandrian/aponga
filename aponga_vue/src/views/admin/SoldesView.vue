<template>
  <BarreNavigation />

  <main class="page">
    <h1>Soldes de séances</h1>

    <p v-if="erreur" class="erreur" role="alert">{{ erreur }}</p>
    <p v-if="confirmation" class="confirmation" role="status">{{ confirmation }}</p>

    <section class="carte">
      <h2>Ajouter ou attribuer un solde</h2>
      <form class="grille" @submit.prevent="ajouter" novalidate>
        <div class="champ">
          <label for="nouveau-membre">Apprenant</label>
          <select id="nouveau-membre" v-model="nouveau.id_membre">
            <option value="" disabled>Choisir un apprenant</option>
            <option v-for="a in apprenants" :key="a.id_membre ?? a.id" :value="a.id_membre ?? a.id">
              {{ nomComplet(a) }}
            </option>
          </select>
        </div>

        <div class="champ">
          <label for="nouveau-niveau">Niveau</label>
          <select id="nouveau-niveau" v-model="nouveau.id_niveau">
            <option value="" disabled>Choisir un niveau</option>
            <option v-for="n in niveaux" :key="n.id" :value="n.id">{{ n.nom }}</option>
          </select>
        </div>

        <div class="champ">
          <label for="nouveau-solde">Nombre de séances</label>
          <input id="nouveau-solde" v-model.number="nouveau.solde" type="number" min="0" step="1" />
        </div>

        <button class="bouton" type="submit" :disabled="envoi">Enregistrer</button>
      </form>
    </section>

    <section>
      <h2>Soldes existants</h2>
      <p v-if="chargement">Chargement…</p>
      <p v-else-if="!soldes.length">Aucun solde enregistré.</p>

      <table v-else class="tableau">
        <thead>
          <tr>
            <th>Apprenant</th>
            <th>Niveau</th>
            <th>Séances</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in soldes" :key="cle(s)">
            <td>{{ s.prenom }} {{ s.nom }}</td>
            <td>{{ s.niveau_nom }}</td>
            <td>
              <input
                v-model.number="edition[cle(s)]"
                type="number"
                min="0"
                step="1"
                :aria-label="`Solde de ${s.prenom} ${s.nom}`"
              />
            </td>
            <td class="actions">
              <button
                type="button"
                :disabled="edition[cle(s)] === s.solde"
                @click="enregistrer(s)"
              >Modifier</button>
              <button type="button" class="danger" @click="supprimer(s)">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  listerSoldes,
  creerSolde,
  modifierSolde,
  supprimerSolde,
  listerApprenants,
  listerNiveaux,
} from '../../services/api.js'

const soldes = ref([])
const apprenants = ref([])
const niveaux = ref([])
const edition = ref({})
const nouveau = ref({ id_membre: '', id_niveau: '', solde: 0 })
const chargement = ref(true)
const envoi = ref(false)
const erreur = ref('')
const confirmation = ref('')

const cle = (s) => `${s.id_membre}-${s.id_niveau}`

function nomComplet(a) {
  return `${a.prenom ?? ''} ${a.nom ?? ''}`.trim() || a.email
}

async function charger() {
  const [s, a, n] = await Promise.all([listerSoldes(), listerApprenants(), listerNiveaux()])
  soldes.value = s.soldes
  apprenants.value = a.apprenants ?? []
  niveaux.value = n.niveaux ?? []
  edition.value = Object.fromEntries(soldes.value.map((x) => [cle(x), x.solde]))
}

function messageErreur(e) {
  erreur.value = e.message
}

async function ajouter() {
  erreur.value = ''
  confirmation.value = ''
  if (!nouveau.value.id_membre || !nouveau.value.id_niveau) {
    erreur.value = 'Choisissez un apprenant et un niveau.'
    return
  }
  envoi.value = true
  try {
    await creerSolde({
      id_membre: nouveau.value.id_membre,
      id_niveau: nouveau.value.id_niveau,
      solde: Number(nouveau.value.solde),
    })
    nouveau.value = { id_membre: '', id_niveau: '', solde: 0 }
    confirmation.value = 'Solde enregistré.'
    await charger()
  } catch (e) {
    messageErreur(e)
  } finally {
    envoi.value = false
  }
}

async function enregistrer(s) {
  erreur.value = ''
  confirmation.value = ''
  try {
    await modifierSolde(s.id_membre, s.id_niveau, Number(edition.value[cle(s)]))
    confirmation.value = 'Solde modifié.'
    await charger()
  } catch (e) {
    messageErreur(e)
  }
}

async function supprimer(s) {
  if (!window.confirm(`Supprimer le solde de ${s.prenom} ${s.nom} pour ${s.niveau_nom} ?`)) return
  erreur.value = ''
  confirmation.value = ''
  try {
    await supprimerSolde(s.id_membre, s.id_niveau)
    confirmation.value = 'Solde supprimé.'
    await charger()
  } catch (e) {
    messageErreur(e)
  }
}

onMounted(async () => {
  try {
    await charger()
  } catch (e) {
    messageErreur(e)
  } finally {
    chargement.value = false
  }
})
</script>

<style scoped>
.page { padding: 16px; max-width: 860px; margin: 0 auto; }
section { margin-top: 28px; }
.carte { border: 1px solid #ddd; border-radius: 6px; padding: 12px 16px; }
.grille { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
.champ { display: flex; flex-direction: column; gap: 4px; }
.champ select, .champ input { padding: 6px; min-width: 180px; }
.tableau { width: 100%; border-collapse: collapse; }
.tableau th, .tableau td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
.tableau input { width: 90px; padding: 4px; }
.actions { display: flex; gap: 8px; }
.bouton, .actions button { padding: 6px 12px; cursor: pointer; }
.bouton:disabled, .actions button:disabled { cursor: not-allowed; opacity: 0.5; }
.danger { color: #b00020; }
.erreur { color: #b00020; }
.confirmation { color: #1b6e2b; }
</style>
