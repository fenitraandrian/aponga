<template>
  <section class="composition">
    <h4>Activités de cette version</h4>

    <p v-if="erreur" class="message erreur">{{ erreur }}</p>
    <p v-if="succes" class="message succes">{{ succes }}</p>

    <p v-if="composition.length === 0" class="vide">Aucune activité dans cette version.</p>

    <ol class="liste-composition">
      <li v-for="ligne in composition" :key="ligne.id_version_activite" class="ligne-composition">
        <span>
          <RouterLink :to="`/activites/${ligne.id_activite}`">{{ ligne.titre_activite }}</RouterLink>
          <span class="meta">v{{ ligne.numero_version }} · {{ ligne.code_type_activite }}</span>
        </span>

        <div v-if="editable" class="actions">
          <label>
            Ordre
            <input
              type="number"
              min="0"
              step="1"
              :value="ligne.ordre"
              class="petit"
              @change="modifierOrdre(ligne, $event.target.value)"
            />
          </label>
          <label>
            <input
              type="checkbox"
              :checked="ligne.obligatoire"
              @change="basculerObligatoire(ligne, $event.target.checked)"
            />
            Obligatoire
          </label>
          <button class="danger" @click="retirer(ligne)">Retirer</button>
        </div>
        <span v-else class="meta">{{ ligne.obligatoire ? 'obligatoire' : 'facultative' }}</span>
      </li>
    </ol>

    <form v-if="editable && disponibles.length" class="ajout" novalidate @submit.prevent="ajouter">
      <div class="champ">
        <label for="ajout-activite">Activité publiée</label>
        <select id="ajout-activite" v-model="form.id_version_activite">
          <option :value="null" disabled>Choisir une activité</option>
          <option v-for="option in disponibles" :key="option.id" :value="option.id">
            {{ option.libelle }}
          </option>
        </select>
      </div>

      <div class="champ">
        <label for="ajout-ordre">Ordre</label>
        <input id="ajout-ordre" v-model.number="form.ordre" type="number" min="0" step="1" class="petit" />
      </div>

      <label class="case">
        <input v-model="form.obligatoire" type="checkbox" />
        Obligatoire
      </label>

      <div class="actions">
        <button class="bouton-principal" type="submit">Ajouter à la version</button>
      </div>
      <small v-if="erreurAjout" class="erreur-champ">{{ erreurAjout }}</small>
    </form>

    <p v-else-if="editable" class="vide">
      Publiez d'abord une version d'activité de cette unité pour pouvoir la composer.
    </p>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  listerComposition,
  ajouterAuComposition,
  modifierComposition,
  retirerDuComposition,
  listerActivites,
} from '../../services/api'

const props = defineProps({
  version: { type: Object, required: true },
  idEtude: { type: Number, required: true },
  peutGerer: { type: Boolean, required: true },
})

const composition = ref([])
const activitesUnite = ref([])
const erreur = ref('')
const erreurAjout = ref('')
const succes = ref('')
const form = ref({ id_version_activite: null, ordre: 0, obligatoire: true })

// On ne compose que les versions en brouillon, et seulement si l'utilisateur peut gérer
const editable = computed(() => props.peutGerer && props.version.etat === 'brouillon')

// Versions publiées des activités de cette unité, pas encore dans la composition
const disponibles = computed(() => {
  const dejaPresentes = new Set(composition.value.map((ligne) => ligne.id_version_activite))
  const options = []
  for (const activite of activitesUnite.value) {
    for (const version of activite.versions) {
      if (version.etat === 'publiee' && !dejaPresentes.has(version.id)) {
        options.push({
          id: version.id,
          libelle: `${activite.titre} — v${version.numero} ${version.titre_version}`,
        })
      }
    }
  }
  return options
})

async function charger() {
  const [reponseComposition, reponseActivites] = await Promise.all([
    listerComposition(props.version.id),
    listerActivites(props.idEtude),
  ])
  composition.value = reponseComposition.composition
  activitesUnite.value = reponseActivites.activites
}

function reinitialiserMessages() {
  erreur.value = ''
  succes.value = ''
  erreurAjout.value = ''
}

function ordreValide(valeur) {
  return valeur !== '' && Number.isInteger(Number(valeur)) && Number(valeur) >= 0
}

onMounted(async () => {
  try {
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
})

watch(() => props.version.id, charger)

async function ajouter() {
  reinitialiserMessages()
  if (!form.value.id_version_activite) {
    erreurAjout.value = 'Choisissez une activité publiée.'
    return
  }
  if (!ordreValide(form.value.ordre)) {
    erreurAjout.value = "L'ordre doit être un entier positif ou nul."
    return
  }

  try {
    await ajouterAuComposition(props.version.id, {
      id_version_activite: form.value.id_version_activite,
      ordre: Number(form.value.ordre),
      obligatoire: form.value.obligatoire,
    })
    succes.value = 'Activité ajoutée à la version.'
    form.value = { id_version_activite: null, ordre: 0, obligatoire: true }
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}

async function modifierOrdre(ligne, valeur) {
  reinitialiserMessages()
  if (!ordreValide(valeur)) {
    erreur.value = "L'ordre doit être un entier positif ou nul."
    await charger()
    return
  }

  try {
    await modifierComposition(props.version.id, ligne.id_version_activite, { ordre: Number(valeur) })
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}

async function basculerObligatoire(ligne, obligatoire) {
  reinitialiserMessages()
  try {
    await modifierComposition(props.version.id, ligne.id_version_activite, { obligatoire })
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}

async function retirer(ligne) {
  reinitialiserMessages()
  if (!confirm(`Retirer « ${ligne.titre_activite} » de cette version ?`)) return

  try {
    await retirerDuComposition(props.version.id, ligne.id_version_activite)
    succes.value = 'Activité retirée.'
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
}
</script>

<style scoped>
.composition {
  margin-top: 0.75rem;
  padding-left: 1rem;
}

.liste-composition {
  padding-left: 1.2rem;
}

.ligne-composition,
.actions,
.ajout .actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.ligne-composition {
  padding: 0.3rem 0;
  border-bottom: 1px dashed #eee;
}

.ajout {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.75rem;
}

.meta {
  color: #666;
  font-size: 0.85rem;
  margin-left: 0.4rem;
}

.petit {
  width: 5rem;
}

.case {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
}

.danger {
  color: #b00020;
}

.erreur-champ {
  display: block;
  color: #b00020;
  margin-top: 0.25rem;
}

.vide {
  color: #666;
  font-style: italic;
}
</style>
