<template>
  <BarreNavigation />

  <main class="page-formulaire">
    <div class="carte">
      <h1>{{ titrePage }}</h1>

      <p v-if="erreur" class="message erreur">{{ erreur }}</p>

      <form novalidate @submit.prevent="enregistrer">
        <div class="champ">
          <label for="titre">Titre</label>
          <input id="titre" v-model="formulaire.titre" type="text" maxlength="200" />
          <small v-if="erreursChamps.titre" class="erreur-champ">{{ erreursChamps.titre }}</small>
        </div>

        <div class="champ">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="formulaire.description"
            rows="4"
            maxlength="2000"
            placeholder="Ce que l'on apprend dans ce cours"
          ></textarea>
        </div>

        <!-- MODIFICATION : début (niveau visible seulement pour une unité) -->
        <template v-if="estUnite">
          <div class="champ">
            <label for="niveau">Niveau</label>
            <select id="niveau" v-model="formulaire.id_niveau">
              <option :value="null">Choisir un niveau</option>
              <option v-for="niveau in niveaux" :key="niveau.id" :value="niveau.id">
                {{ niveau.nom }}
              </option>
            </select>
          </div>

          <div class="champ">
            <label>
              <input type="checkbox" v-model="formulaire.parcours_particulier" />
              Parcours particulier
            </label>
            <small>Décochée : le prérequis est le niveau précédent. Cochée : vous choisissez le prérequis.</small>
          </div>

          <div v-if="formulaire.parcours_particulier" class="champ">
            <label for="niveau-prerequis">Niveau prérequis</label>
            <select id="niveau-prerequis" v-model="formulaire.id_niveau_prerequis">
              <option :value="null">Aucun</option>
              <option v-for="niveau in niveaux" :key="niveau.id" :value="niveau.id">
                {{ niveau.nom }}
              </option>
            </select>
          </div>
        </template>
        <!-- MODIFICATION : fin -->

        <div class="champ">
          <label for="ordre">Ordre</label>
          <input id="ordre" v-model.number="formulaire.ordre" type="number" min="0" step="1" />
          <small v-if="erreursChamps.ordre" class="erreur-champ">{{ erreursChamps.ordre }}</small>
        </div>

        <button class="bouton-principal" type="submit" :disabled="enCours">Enregistrer</button>
      </form>

      <RouterLink to="/pedagogie" class="lien-secondaire">Retour à la pédagogie</RouterLink>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  moi,
  trouverEtude,
  creerEtude,
  modifierEtude,
  listerNiveaux,
} from '../../services/api'

const router = useRouter()
const route = useRoute()

// Mode modification si l'URL contient un identifiant, sinon création
const modification = computed(() => Boolean(route.params.id))

// Création d'une unité si l'URL contient ?parent=ID, sinon création d'une formation
const idParent = computed(() => (route.query.parent ? Number(route.query.parent) : null))
const typeCree = computed(() => (idParent.value ? 'unite' : 'formation'))

// En modification, le type vient de l'étude chargée
const typeEdite = ref(null)
const estUnite = computed(() => (modification.value ? typeEdite.value : typeCree.value) === 'unite')

const titrePage = computed(() => {
  if (modification.value) {
    return typeEdite.value === 'unite' ? "Modifier l'unité" : 'Modifier la formation'
  }
  return typeCree.value === 'unite' ? 'Nouvelle unité' : 'Nouvelle formation'
})

const formulaire = ref({
  titre: '',
  description: '',
  ordre: null,
  id_niveau: null,
  id_niveau_prerequis: null,
  parcours_particulier: false,
})
const niveaux = ref([])
const erreur = ref('')
const erreursChamps = ref({})
const enCours = ref(false)

// Contrôles de forme avant l'envoi. L'API refait les mêmes contrôles.
function validerLocalement() {
  const erreurs = {}
  const titre = formulaire.value.titre.trim()
  const ordre = formulaire.value.ordre

  if (!titre) erreurs.titre = 'Le titre est obligatoire.'
  else if (titre.length > 200) erreurs.titre = '200 caractères maximum.'

  // Vide = automatique, sinon entier positif ou nul
  const ordreRenseigne = ordre !== null && ordre !== ''
  if (ordreRenseigne && (!Number.isInteger(ordre) || ordre < 0)) {
    erreurs.ordre = "L'ordre doit être un entier positif ou nul."
  }

  erreursChamps.value = erreurs
  return Object.keys(erreurs).length === 0
}

onMounted(async () => {
  try {
    const { permissions } = await moi()
    if (!permissions.includes('pedagogie.gerer')) {
      router.push('/pedagogie')
      return
    }
  } catch {
    router.push('/connexion')
    return
  }

  try {
    const { niveaux: liste } = await listerNiveaux()
    niveaux.value = liste
  } catch (err) {
    erreur.value = err.message
  }

  if (modification.value) {
    try {
      const { etude } = await trouverEtude(route.params.id)
      formulaire.value = {
        titre: etude.titre,
        description: etude.description ?? '',
        ordre: etude.ordre,
        id_niveau: etude.id_niveau ?? null,
        id_niveau_prerequis: etude.id_niveau_prerequis ?? null,
        parcours_particulier: etude.parcours_particulier ?? false,
      }
      typeEdite.value = etude.type_etude
    } catch (err) {
      erreur.value = err.message
    }
  }
})

async function enregistrer() {
  erreur.value = ''
  if (!validerLocalement()) return

  const donnees = {
    titre: formulaire.value.titre.trim(),
    description: formulaire.value.description.trim(),
    id_niveau: estUnite.value ? formulaire.value.id_niveau : null,
    id_niveau_prerequis: estUnite.value ? formulaire.value.id_niveau_prerequis : null,
    parcours_particulier: estUnite.value ? formulaire.value.parcours_particulier : false,
  }
  // L'ordre n'est envoyé que s'il est renseigné
  if (Number.isInteger(formulaire.value.ordre)) {
    donnees.ordre = formulaire.value.ordre
  }

  enCours.value = true
  try {
    if (modification.value) {
      await modifierEtude(route.params.id, donnees)
    } else {
      const corps = { ...donnees, type_etude: typeCree.value }
      if (typeCree.value === 'unite') corps.id_parent = idParent.value
      await creerEtude(corps)
    }
    router.push('/pedagogie')
  } catch (err) {
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}
</script>

<style scoped>
.carte {
  max-width: 520px;
  width: 100%;
}

.erreur-champ {
  display: block;
  color: #b00020;
  margin-top: 0.25rem;
}
</style>
