<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'

import {
  listerMesContenus,
  listerMesPresences,
  urlLectureFichier,
  urlTelechargementMonFichier,
} from '../../services/api.js'

const route = useRoute()
const id = route.params.id

const contenus = ref([])
const presence = ref(null)
const chargement = ref(true)
const erreur = ref('')

function libellePresence(valeur) {
  if (valeur === true) return 'Présent'
  if (valeur === false) return 'Absent'
  return 'Non marquée'
}

onMounted(async () => {
  try {
    const reponse = await listerMesContenus(id)
    contenus.value = reponse.contenus

    const mes = await listerMesPresences()
    const trouvee = mes.presences.find((p) => String(p.id) === String(id))
    presence.value = trouvee ? trouvee.present : null
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
})
</script>

<template>
  <BarreNavigation />

  <main class="page">
    <p><RouterLink to="/mes-seances">← Retour à mes séances</RouterLink></p>
    <h1>Contenus de la séance</h1>

    <p v-if="chargement">Chargement…</p>
    <p v-else-if="erreur" class="erreur" role="alert">{{ erreur }}</p>

    <template v-else>
      <p class="presence">Votre présence : <strong>{{ libellePresence(presence) }}</strong></p>

      <p v-if="!contenus.length" class="discret">Aucun contenu pour cette séance.</p>

      <section v-for="c in contenus" :key="c.id" class="contenu">
        <h2>{{ c.titre }}</h2>
        <p v-if="c.description">{{ c.description }}</p>

        <div v-for="f in c.fichiers" :key="f.id" class="fichier">
          <p class="nom">{{ f.nom_original }}</p>

          <audio v-if="f.categorie === 'audio'" controls preload="none" :src="urlLectureFichier(f.id)"></audio>
          <video
            v-else-if="f.categorie === 'video'"
            controls
            preload="none"
            :src="urlLectureFichier(f.id)"
            class="video"
          ></video>
          <a
            v-else-if="f.categorie === 'pdf'"
            :href="urlLectureFichier(f.id)"
            target="_blank"
            rel="noopener"
          >Ouvrir le document</a>
          <img
            v-else-if="f.categorie === 'image'"
            :src="urlLectureFichier(f.id)"
            :alt="f.nom_original"
            class="image"
          />

          <div class="telechargement">
            <a v-if="f.telechargeable" :href="urlTelechargementMonFichier(f.id)">Télécharger</a>
            <span v-else class="discret">Téléchargement non autorisé pour ce type de document.</span>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.page { padding: 16px; max-width: 760px; margin: 0 auto; }
.presence { font-size: 1.05em; }
.contenu { margin-top: 28px; padding-top: 16px; border-top: 1px solid #ddd; }
.fichier { margin: 16px 0; }
.nom { font-weight: bold; margin-bottom: 6px; }
.telechargement { margin-top: 8px; }
.video { width: 100%; max-height: 420px; }
.image { max-width: 100%; }
.discret { color: #666; font-size: 0.9em; }
.erreur { color: #b00020; }
</style>
