<template>
  <main class="essai-parcours">
    <p v-if="erreur" class="erreur" role="alert">{{ erreur }}</p>
    <p v-else-if="phase === 'chargement'">Chargement…</p>

    <template v-else-if="unite">
      <BarreProgression :fraction="fraction" :libelle="libelle" />

      <!-- Cours -->
      <section v-if="phase === 'cours'">
        <BoutonRetour to="/essai/niveau" libelle="Changer de niveau" />

        <h1>{{ unite.titre }}</h1>
        <p class="objectifs">{{ unite.objectifs }}</p>

        <article v-for="s in unite.sections" :key="s.id" class="section">
          <h2>{{ s.titre }}</h2>
          <p>{{ s.contenu }}</p>
        </article>

        <button class="bouton" type="button" @click="phase = 'quiz'">Passer au quiz</button>
      </section>

      <!-- Quiz -->
      <section v-else-if="phase === 'quiz'">
        <button type="button" class="lien-retour" @click="phase = 'cours'">
          <span aria-hidden="true">←</span> Retour au cours
        </button>

        <h1>Quiz : {{ unite.titre }}</h1>

        <form @submit.prevent="valider">
          <fieldset v-for="(q, i) in unite.questions" :key="q.id" class="question">
            <legend>{{ i + 1 }}. {{ q.enonce }}</legend>
            <label v-for="c in q.choix" :key="c.id" class="choix">
              <input
                type="radio"
                :name="`question-${q.id}`"
                :value="c.id"
                v-model="reponses[q.id]"
              />
              {{ c.texte }}
            </label>
          </fieldset>

          <p v-if="erreurQuiz" class="erreur" role="alert">{{ erreurQuiz }}</p>

          <button class="bouton" type="submit" :disabled="envoi || !toutesRepondues">
            {{ envoi ? 'Correction…' : 'Valider mes réponses' }}
          </button>
          <p v-if="!toutesRepondues" class="aide">Répondez à toutes les questions pour valider.</p>
        </form>
      </section>

      <!-- Correction de l'unité -->
      <section v-else-if="phase === 'correction' && resultat">
        <h1>Votre score : {{ resultat.score }} / {{ resultat.total }}</h1>

        <ul class="corrections">
          <li v-for="q in unite.questions" :key="q.id" :class="estOk(q) ? 'ok' : 'ko'">
            <p class="enonce">{{ q.enonce }}</p>
            <p>Votre réponse : {{ texteChoix(q, reponses[q.id]) }}</p>
            <p v-if="!estOk(q)">Bonne réponse : {{ texteChoix(q, bonneReponse(q)) }}</p>
          </li>
        </ul>

        <button class="bouton" type="button" @click="suivante">
          {{ indexUnite + 1 < unites.length ? 'Unité suivante' : 'Voir mon score final' }}
        </button>
      </section>

      <!-- Score final -->
      <section v-else-if="phase === 'fin'">
        <h1>Votre score final</h1>
        <p class="score">{{ scoreTotal }} / {{ totalTotal }}</p>

        <ul class="historique">
          <li v-for="h in historique" :key="h.titre">
            {{ h.titre }} : {{ h.score }} / {{ h.total }}
          </li>
        </ul>

        <button class="bouton" type="button" @click="recommencer">Recommencer l'essai</button>
        <BoutonRetour to="/essai/niveau" libelle="Changer de niveau" />
      </section>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { unitesParcoursEssai, corrigerQuizEssai } from '../../services/api'
import BarreProgression from '../../components/essai/BarreProgression.vue'
import BoutonRetour from '../../components/BoutonRetour.vue'

const route = useRoute()

const phase = ref('chargement')
const erreur = ref('')
const erreurQuiz = ref('')
const envoi = ref(false)
const parcours = ref(null)
const unites = ref([])
const indexUnite = ref(0)
const reponses = ref({})
const resultat = ref(null)
const historique = ref([])

const unite = computed(() => unites.value[indexUnite.value] ?? null)

// Trois étapes par unité : cours (0), quiz (1), correction (2)
const etapeIndex = computed(() => ({ cours: 0, quiz: 1, correction: 2 })[phase.value] ?? -1)

const fraction = computed(() => {
  const total = unites.value.length * 3
  if (!total) return 0
  if (phase.value === 'fin') return 1
  if (etapeIndex.value < 0) return 0
  return (indexUnite.value * 3 + etapeIndex.value + 1) / total
})

const libelle = computed(() => {
  const total = unites.value.length
  if (!total) return ''
  const numero = phase.value === 'fin' ? total : indexUnite.value + 1
  return `${numero}/${total}`
})

const toutesRepondues = computed(
  () => !!unite.value && unite.value.questions.every((q) => reponses.value[q.id] !== undefined)
)

const scoreTotal = computed(() => historique.value.reduce((somme, h) => somme + h.score, 0))
const totalTotal = computed(() => historique.value.reduce((somme, h) => somme + h.total, 0))

async function charger() {
  phase.value = 'chargement'
  erreur.value = ''
  indexUnite.value = 0
  historique.value = []
  reponses.value = {}
  resultat.value = null
  try {
    const donnees = await unitesParcoursEssai(route.params.code)
    parcours.value = donnees.parcours
    unites.value = donnees.unites
    if (!unites.value.length) {
      erreur.value = 'Aucune unité n\'est disponible pour ce niveau.'
      return
    }
    phase.value = 'cours'
  } catch (e) {
    erreur.value = e.message
  }
}

async function valider() {
  envoi.value = true
  erreurQuiz.value = ''
  try {
    const liste = unite.value.questions.map((q) => ({
      id_question: q.id,
      id_choix: reponses.value[q.id],
    }))
    resultat.value = await corrigerQuizEssai(unite.value.id, liste)
    historique.value.push({
      titre: unite.value.titre,
      score: resultat.value.score,
      total: resultat.value.total,
    })
    phase.value = 'correction'
  } catch (e) {
    erreurQuiz.value = e.message
  } finally {
    envoi.value = false
  }
}

function suivante() {
  reponses.value = {}
  resultat.value = null
  if (indexUnite.value + 1 < unites.value.length) {
    indexUnite.value++
    phase.value = 'cours'
  } else {
    phase.value = 'fin'
  }
}

function recommencer() {
  charger()
}

function correctionDe(q) {
  return resultat.value?.corrections.find((c) => c.id_question === q.id)
}

function estOk(q) {
  return correctionDe(q)?.ok === true
}

function bonneReponse(q) {
  return correctionDe(q)?.id_bonne_reponse
}

function texteChoix(q, idChoix) {
  return q.choix.find((c) => c.id === idChoix)?.texte ?? 'Aucune réponse'
}

onMounted(charger)
watch(() => route.params.code, charger)
</script>

<style scoped>
.essai-parcours {
  max-width: 40rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}
.objectifs {
  font-style: italic;
  color: #444;
}
.section {
  margin-bottom: 1.25rem;
}
.question {
  margin-bottom: 1.25rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem 1rem;
}
.choix {
  display: block;
  padding: 0.25rem 0;
}
.bouton {
  margin-top: 0.5rem;
  padding: 0.7rem 1.4rem;
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
.lien-retour {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  padding: 0;
  background: none;
  border: none;
  color: #0066cc;
  font-size: 0.95rem;
  cursor: pointer;
}
.lien-retour:hover,
.lien-retour:focus-visible {
  text-decoration: underline;
}
.aide {
  color: #555;
  font-size: 0.9rem;
}
.erreur {
  color: #b00020;
}
.corrections {
  list-style: none;
  padding: 0;
}
.corrections li {
  border-left: 4px solid #ccc;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
}
.corrections li.ok {
  border-color: #2e7d32;
}
.corrections li.ko {
  border-color: #b00020;
}
.enonce {
  font-weight: bold;
}
.score {
  font-size: 2rem;
  font-weight: bold;
}
</style>
