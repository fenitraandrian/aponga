<script setup>
import { ref, computed, onMounted } from 'vue'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  listerMembresPaiement,
  listerNiveauxTarifs,
  enregistrerPaiement,
  listerPaiements,
  listerTypesAbonnement,

} from '../../services/api.js'

const membres = ref([])
const niveaux = ref([])
const paiements = ref([])
const erreur = ref('')
const succes = ref('')
const formulaire = ref({ idMembre: '', idNiveau: '',idType: '', montant: '' })
const types = ref([])

const niveauChoisi = computed(() =>
  niveaux.value.find((n) => String(n.id) === String(formulaire.value.idNiveau))
)

async function charger() {
  const [m, n, p, t] = await Promise.all([
    listerMembresPaiement(),
    listerNiveauxTarifs(),
    listerPaiements(),
    listerTypesAbonnement(),
  ])
  membres.value = m.membres
  niveaux.value = n.niveaux
  paiements.value = p.paiements
  types.value = t.types
}

async function valider() {
  erreur.value = ''
  succes.value = ''
  try {
    const r = await enregistrerPaiement({
      id_membre: formulaire.value.idMembre,
      id_niveau: formulaire.value.idNiveau,
      montant: formulaire.value.montant,
      id_type_abonnement: formulaire.value.idType,
    })
    succes.value = `${r.nombreSeances} séance(s) ajoutée(s). Reste conservé : ${r.reste} Ar.`
    formulaire.value.montant = ''
    paiements.value = (await listerPaiements()).paiements
  } catch (e) {
    erreur.value = e.message
  }
}

onMounted(() => {
  charger().catch((e) => (erreur.value = e.message))
})
</script>

<template>

  <BarreNavigation />

  <main class="page">
    <h1>Enregistrer un paiement</h1>

    <form class="formulaire" @submit.prevent="valider">
      <label>
        Apprenant
        <select v-model="formulaire.idMembre" required>
          <option value="" disabled>Choisir…</option>
          <option v-for="m in membres" :key="m.id" :value="m.id">
            {{ m.nom }} {{ m.prenom }}
          </option>
        </select>
      </label>

      <label>
        Niveau
        <select v-model="formulaire.idNiveau" required>
          <option value="" disabled>Choisir…</option>
          <option v-for="n in niveaux" :key="n.id" :value="n.id">
            {{ n.libelle }}{{ n.prix_seance ? ` (${n.prix_seance} Ar / séance)` : ' (pas de tarif)' }}
          </option>
        </select>
      </label>

      <label>
        Type d'abonnement
        <select v-model="formulaire.idType" required>
          <option value="" disabled>Choisir…</option>
          <option v-for="t in types" :key="t.id" :value="t.id">
            {{ t.libelle }} ({{ t.duree_jours }} jours, {{ t.prix }} Ar minimum)
          </option>
        </select>
      </label>

      <label>
        Montant (Ar)
        <input v-model="formulaire.montant" type="number" min="1" required />
      </label>

      <p v-if="niveauChoisi && !niveauChoisi.prix_seance" class="erreur">
        Ce niveau n'a pas de tarif. Définis-le d'abord dans les tarifs.
      </p>

      <button type="submit" :disabled="!niveauChoisi?.prix_seance || !formulaire.idType">Enregistrer le paiement</button>
    </form>

    <p v-if="erreur" class="erreur">{{ erreur }}</p>
    <p v-if="succes" class="succes">{{ succes }}</p>

    <h2>Derniers paiements</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Apprenant</th>
          <th>Niveau</th>
          <th>Montant</th>
          <th>Prix séance</th>
          <th>Séances</th>
          <th>Reste</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in paiements" :key="p.id">
          <td>{{ new Date(p.cree_le).toLocaleString('fr-FR') }}</td>
          <td>{{ p.nom }} {{ p.prenom }}</td>
          <td>{{ p.niveau }}</td>
          <td>{{ p.montant }}</td>
          <td>{{ p.prix_seance }}</td>
          <td>{{ p.nombre_seances }}</td>
          <td>{{ p.reste_apres }}</td>
        </tr>
        <tr v-if="!paiements.length">
          <td colspan="7">Aucun paiement pour l'instant.</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
.page { padding: 16px; }
.formulaire { display: grid; gap: 12px; max-width: 420px; margin-bottom: 24px; }
.formulaire label { display: grid; gap: 4px; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
.erreur { color: #b00020; }
.succes { color: #1b7a34; }
</style>
