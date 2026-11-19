<template>
  <BarreNavigation />
  <main class="page-exercices">
    <h1>Mes exercices</h1>

    <div class="filtres">
      <div v-if="niveauxDisponibles.length" class="champ">
        <label for="filtre-niveau">Niveau</label>
        <select id="filtre-niveau" v-model="niveau" @change="charger">
          <option value="">Tous les niveaux</option>
          <option v-for="n in niveauxDisponibles" :key="n.id" :value="n.id">{{ n.nom }}</option>
        </select>
      </div>
      <div class="champ">
        <label for="filtre-statut">Statut</label>
        <select id="filtre-statut" v-model="statut" @change="charger">
          <option value="">Tous</option>
          <option value="soumis">En attente</option>
          <option value="valide">Validé</option>
          <option value="rejete">À refaire</option>
        </select>
      </div>
    </div>

    <p v-if="erreur" class="message erreur" role="alert">{{ erreur }}</p>
    <p v-if="chargement">Chargement…</p>
    <p v-else-if="!groupes.length" class="meta">Aucun exercice pour ces critères.</p>

    <section v-for="g in groupes" :key="g.id_niveau ?? 0" class="niveau">
      <h2>{{ g.nom }}</h2>

      <article
        v-for="ex in g.exercices"
        :key="ex.id_consigne"
        :class="['exercice', ex.derniere.statut]"
      >
        <header class="entete">
          <div>
            <h3>{{ ex.consigne_titre }}</h3>
            <p class="meta">Séance du {{ formater(ex.seance_date) }}</p>
          </div>
          <span :class="['badge', ex.derniere.statut]">{{ libelleStatut(ex.derniere) }}</span>
        </header>

        <div class="version-courante">
          <p class="meta">
            Version {{ ex.derniere.numero_version }} · déposée le {{ formater(ex.derniere.depose_le) }}
            · {{ ex.derniere.fichiers.length }} fichier(s)
          </p>
          <p v-if="ex.derniere.commentaire" class="commentaire">
            Commentaire : {{ ex.derniere.commentaire }}
          </p>
          <RouterLink
            v-if="ex.derniere.statut === 'rejete'"
            :to="`/seances/${ex.id_seance}/exercices`"
            class="bouton-lien"
          >
            Redéposer
          </RouterLink>
        </div>

        <template v-if="ex.precedentes.length">
          <button
            type="button"
            class="voir-versions"
            :aria-expanded="!!ouvertes[ex.id_consigne]"
            @click="basculer(ex.id_consigne)"
          >
            {{ ouvertes[ex.id_consigne] ? 'Masquer' : 'Voir' }} les versions précédentes
            ({{ ex.precedentes.length }})
          </button>

          <ul v-if="ouvertes[ex.id_consigne]" class="precedentes">
            <li v-for="p in ex.precedentes" :key="p.id" class="version-ancienne">
              <div class="entete">
                <span>Version {{ p.numero_version }} · déposée le {{ formater(p.depose_le) }}</span>
                <span class="badge-discret">{{ libelleStatut(p) }}</span>
              </div>
              <p v-if="p.commentaire" class="commentaire">Commentaire : {{ p.commentaire }}</p>
            </li>
          </ul>
        </template>
      </article>
    </section>

    <RouterLink to="/mes-seances" class="retour">Retour à mes séances</RouterLink>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import { listerMesExercices } from '../../services/api'

const niveau = ref('')
const statut = ref('')
const niveauxDisponibles = ref([])
const groupes = ref([])
const ouvertes = ref({})
const chargement = ref(true)
const erreur = ref('')

function formater(date) {
  return new Date(date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

function libelleStatut(d) {
  if (d.statut === 'valide') return `Validé : ${d.note} / 20`
  if (d.statut === 'rejete') return 'À refaire'
  return 'En attente de correction'
}

// Un exercice = une consigne. Sa dernière version est affichée, les autres sont repliées.
function regrouperParExercice(depots) {
  const exercices = new Map()
  for (const d of depots) {
    if (!exercices.has(d.id_consigne)) {
      exercices.set(d.id_consigne, {
        id_consigne: d.id_consigne,
        consigne_titre: d.consigne_titre,
        id_seance: d.id_seance,
        seance_date: d.seance_date,
        derniere: null,
        precedentes: [],
      })
    }
    const ex = exercices.get(d.id_consigne)
    if (d.est_derniere) ex.derniere = d
    else ex.precedentes.push(d)
  }
  for (const ex of exercices.values()) {
    ex.precedentes.sort((a, b) => b.numero_version - a.numero_version)
  }
  return [...exercices.values()].filter((ex) => ex.derniere)
}

// Les niveaux proposés sont ceux où l'apprenant a déjà déposé un exercice.
// Ils sont mémorisés au premier chargement, sans filtre.
function memoriserNiveaux(liste) {
  if (niveauxDisponibles.value.length) return
  const vus = new Map()
  for (const g of liste) {
    if (g.id_niveau !== null && !vus.has(g.id_niveau)) {
      vus.set(g.id_niveau, { id: g.id_niveau, nom: g.nom })
    }
  }
  niveauxDisponibles.value = [...vus.values()]
}

function basculer(idConsigne) {
  ouvertes.value = { ...ouvertes.value, [idConsigne]: !ouvertes.value[idConsigne] }
}

async function charger() {
  chargement.value = true
  erreur.value = ''
  try {
    const donnees = await listerMesExercices(niveau.value, statut.value)
    groupes.value = donnees.niveaux.map((g) => ({
      ...g,
      exercices: regrouperParExercice(g.depots),
    }))
    memoriserNiveaux(donnees.niveaux)
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
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
.filtres {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.champ {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.champ select {
  padding: 0.5rem;
  font: inherit;
}
.niveau {
  margin-bottom: 2rem;
}
.niveau > h2 {
  border-bottom: 2px solid #ddd;
  padding-bottom: 0.4rem;
  margin-bottom: 1rem;
}
.exercice {
  border: 1px solid #ddd;
  border-left: 5px solid #ccc;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  background: #fff;
}
.exercice.valide { border-left-color: #2e7d32; }
.exercice.soumis { border-left-color: #c9a227; }
.exercice.rejete { border-left-color: #b00020; }
.entete {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}
.entete h3 {
  margin: 0;
}
.badge {
  font-weight: 700;
  white-space: nowrap;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.9rem;
}
.badge.valide { color: #2e7d32; background: #e8f5e9; }
.badge.soumis { color: #8a6d00; background: #fff8e1; }
.badge.rejete { color: #b00020; background: #fdecea; }
.version-courante {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #eee;
}
.commentaire {
  font-style: italic;
  margin: 0.4rem 0;
}
.meta {
  color: #555;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}
.bouton-lien {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.4rem 0.9rem;
  border: 1px solid #0066cc;
  border-radius: 6px;
  color: #0066cc;
  text-decoration: none;
}
.voir-versions {
  margin-top: 0.75rem;
  padding: 0.35rem 0.8rem;
  background: none;
  border: 1px dashed #999;
  border-radius: 6px;
  color: #444;
  cursor: pointer;
  font: inherit;
  font-size: 0.9rem;
}
.precedentes {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0 0;
}
.version-ancienne {
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  margin-bottom: 0.5rem;
}
.badge-discret {
  font-size: 0.85rem;
  font-weight: 600;
}
.message.erreur {
  color: #b00020;
}
.retour {
  display: inline-block;
  margin-top: 1rem;
}
</style>
