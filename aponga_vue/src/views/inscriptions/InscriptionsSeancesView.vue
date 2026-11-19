<template>
  <BarreNavigation />

  <main class="page">
    <h1>Apprenants par séance</h1>

    <form class="filtres" @submit.prevent novalidate>
      <div class="champ">
        <label for="filtre-du">Du</label>
        <input id="filtre-du" v-model="filtres.du" type="date" />
      </div>
      <div class="champ">
        <label for="filtre-au">Au</label>
        <input id="filtre-au" v-model="filtres.au" type="date" />
      </div>
      <div class="champ">
        <label for="filtre-unite">Unité</label>
        <select id="filtre-unite" v-model="filtres.unite">
          <option value="">Toutes les unités</option>
          <option v-for="u in unites" :key="u" :value="u">{{ u }}</option>
        </select>
      </div>
      <div class="champ">
        <label for="filtre-apprenant">Apprenant</label>
        <input
          id="filtre-apprenant"
          v-model="filtres.apprenant"
          type="search"
          placeholder="Nom, prénom ou e-mail"
        />
      </div>
      <button type="button" class="reinitialiser" @click="reinitialiser">Réinitialiser</button>
    </form>

    <p v-if="erreur" class="erreur" role="alert">{{ erreur }}</p>
    <p v-if="chargement">Chargement…</p>

    <template v-else>
      <p class="discret">{{ seancesFiltrees.length }} séance(s) affichée(s)</p>
      <p v-if="!seancesFiltrees.length">Aucune séance ne correspond à ces filtres.</p>

      <section v-for="s in seancesFiltrees" :key="s.id" class="carte">
        <h2>{{ formater(s.date_debut) }} · {{ s.unite }}</h2>
        <p class="discret">{{ inscritsDe(s.id).length }} apprenant(s) inscrit(s)</p>
        <p v-if="!s.inscritsAffiches.length">Aucun apprenant inscrit.</p>
        <ul v-else>
          <li v-for="i in s.inscritsAffiches" :key="i.id_membre">
            {{ nomComplet(i) }}
            <span class="discret">{{ i.email }}</span>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { listerSeances, listerInscrits } from '../../services/api.js'

const seances = ref([])
const inscrits = ref({})
const chargement = ref(true)
const erreur = ref('')
const filtres = ref({ du: '', au: '', unite: '', apprenant: '' })

function formater(valeur) {
  return new Date(valeur).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })
}

function nomComplet(i) {
  return `${i.prenom ?? ''} ${i.nom ?? ''}`.trim() || i.email
}

function inscritsDe(idSeance) {
  return inscrits.value[idSeance] ?? []
}

// Un apprenant correspond si le texte figure dans son nom, son prénom ou son e-mail
function correspond(i, texte) {
  return [i.prenom, i.nom, i.email].filter(Boolean).join(' ').toLowerCase().includes(texte)
}

const unites = computed(() => [...new Set(seances.value.map((s) => s.unite))].sort())

const seancesFiltrees = computed(() => {
  const texte = filtres.value.apprenant.trim().toLowerCase()
  const du = filtres.value.du ? new Date(`${filtres.value.du}T00:00`) : null
  const au = filtres.value.au ? new Date(`${filtres.value.au}T23:59:59`) : null

  return seances.value
    .filter((s) => {
      const debut = new Date(s.date_debut)
      if (du && debut < du) return false
      if (au && debut > au) return false
      if (filtres.value.unite && s.unite !== filtres.value.unite) return false
      return true
    })
    .map((s) => ({
      ...s,
      inscritsAffiches: inscritsDe(s.id).filter((i) => !texte || correspond(i, texte)),
    }))
    .filter((s) => !texte || s.inscritsAffiches.length > 0)
})

function reinitialiser() {
  filtres.value = { du: '', au: '', unite: '', apprenant: '' }
}

onMounted(async () => {
  try {
    seances.value = (await listerSeances()).seances
    const resultats = await Promise.all(
      seances.value.map((s) => listerInscrits(s.id).then((d) => [s.id, d.inscrits ?? []]))
    )
    inscrits.value = Object.fromEntries(resultats)
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
})
</script>

<style scoped>
.page { padding: 16px; max-width: 860px; margin: 0 auto; }
.filtres { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin: 16px 0; }
.champ { display: flex; flex-direction: column; gap: 4px; }
.champ input, .champ select { padding: 6px; min-width: 160px; }
.reinitialiser { padding: 6px 12px; cursor: pointer; }
.carte { border: 1px solid #ddd; border-radius: 6px; padding: 12px 16px; margin-top: 16px; }
.discret { color: #666; font-size: 0.9em; }
.erreur { color: #b00020; }
</style>
