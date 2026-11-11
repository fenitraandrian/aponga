<script setup>
import { ref, onMounted } from 'vue'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  listerSeancesDisponibles,
  listerMesInscriptions,
  inscrireMoi,
  desinscrireMoi,
} from '../../services/api.js'

const disponibles = ref({ niveau: null, solde: 0, seances: [] })
const mesInscriptions = ref([])
const chargement = ref(true)
const erreur = ref('')
const confirmation = ref('')

function formaterDateHeure(valeur) {
  return new Date(valeur).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
}

function placesTexte(s) {
  if (s.capacite === null) return 'Places illimitées'
  return `${s.capacite - s.inscrits} place(s) restante(s)`
}

// Dit pourquoi on peut ou non s'inscrire à une séance
function etatSeance(s) {
  if (s.deja_inscrit) return { texte: 'Déjà inscrit', peut: false }
  if (s.capacite !== null && s.inscrits >= s.capacite) return { texte: 'Complète', peut: false }
  if (disponibles.value.solde <= 0) return { texte: 'Solde insuffisant', peut: false }
  return { texte: 'Disponible', peut: true }
}

const prochaines = () => mesInscriptions.value.filter((i) => new Date(i.date_debut) > new Date())
const passees = () => mesInscriptions.value.filter((i) => new Date(i.date_debut) <= new Date())

async function charger() {
  const [dispo, mes] = await Promise.all([listerSeancesDisponibles(), listerMesInscriptions()])
  disponibles.value = dispo
  mesInscriptions.value = mes.inscriptions ?? []
}

onMounted(async () => {
  try {
    await charger()
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
})

async function sInscrire(s) {
  erreur.value = ''
  confirmation.value = ''
  try {
    await inscrireMoi(s.id)
    confirmation.value = `Inscription confirmée : ${s.titre_unite}, le ${formaterDateHeure(s.date_debut)}.`
    await charger()
  } catch (e) {
    erreur.value = e.message
  }
}

async function annuler(idSeance) {
  if (!window.confirm('Annuler votre inscription à cette séance ?')) return
  erreur.value = ''
  confirmation.value = ''
  try {
    await desinscrireMoi(idSeance)
    confirmation.value = 'Votre inscription a été annulée.'
    await charger()
  } catch (e) {
    erreur.value = e.message
  }
}
</script>

<template>
  <BarreNavigation />

  <main class="page">
    <h1>Mes séances</h1>

    <p v-if="chargement">Chargement…</p>

    <template v-else>
      <p v-if="erreur" class="erreur" role="alert">{{ erreur }}</p>
      <p v-if="confirmation" class="confirmation" role="status">{{ confirmation }}</p>

      <p v-if="!disponibles.niveau" class="discret">
        Vous n'êtes affecté à aucun niveau pour le moment. Contactez l'administrateur.
      </p>
      <p v-else class="solde">
        Solde : <strong>{{ disponibles.solde }}</strong> séance(s) pour votre niveau.
      </p>

      <section>
        <h2>Séances disponibles</h2>
        <p v-if="disponibles.niveau && !disponibles.seances.length">
          Aucune séance à venir pour votre niveau.
        </p>
        <ul v-else class="liste">
          <li v-for="s in disponibles.seances" :key="s.id" class="carte">
            <div>
              <strong>{{ formaterDateHeure(s.date_debut) }}</strong>
              <span class="discret">({{ s.duree_minutes }} min)</span>
              <div>{{ s.titre_unite }}</div>
              <div class="discret">{{ placesTexte(s) }}</div>
            </div>
            <div class="action">
              <span>{{ etatSeance(s).texte }}</span>
              <button type="button" :disabled="!etatSeance(s).peut" @click="sInscrire(s)">
                S'inscrire
              </button>
            </div>
          </li>
        </ul>
      </section>

      <section>
        <h2>Mes inscriptions à venir</h2>
        <p v-if="!prochaines().length">Aucune inscription à venir.</p>
        <ul v-else class="liste">
          <li v-for="i in prochaines()" :key="i.id" class="carte">
            <div>
              <strong>{{ formaterDateHeure(i.date_debut) }}</strong>
              <div>{{ i.titre_unite }}</div>
            </div>
            <div class="action">
              <button type="button" @click="annuler(i.id)">Annuler</button>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="passees().length">
        <h2>Séances passées</h2>
        <ul class="liste">
          <li v-for="i in passees()" :key="i.id" class="carte discret">
            <div>
              {{ formaterDateHeure(i.date_debut) }}, {{ i.titre_unite }}
            </div>
            <!-- (suivi de cours, T14) -->
            <RouterLink :to="`/mes-seances/${i.id}/contenus`">Contenus</RouterLink>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

<style scoped>
.page { padding: 16px; max-width: 760px; margin: 0 auto; }
section { margin-top: 28px; }
.liste { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.carte {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.action { display: flex; align-items: center; gap: 12px; white-space: nowrap; }
.solde { font-size: 1.05em; }
.discret { color: #666; font-size: 0.9em; }
.erreur { color: #b00020; }
.confirmation { color: #1b6e2b; }
</style>
