<template>
  <BarreNavigation />

  <main class="page">
    <p v-if="erreur" class="message erreur">{{ erreur }}</p>
    <p v-if="message" class="message succes">{{ message }}</p>

    <template v-if="apprenant">
      <div class="entete">
        <h1>{{ apprenant.prenom }} {{ apprenant.nom }}</h1>
        <RouterLink
          v-if="peutGerer"
          :to="`/apprenants/${apprenant.id_membre}/modifier`"
          class="bouton-secondaire"
        >
          Modifier
        </RouterLink>
      </div>

      <section>
        <p><strong>Email :</strong> {{ apprenant.email ?? 'Non renseigné' }}</p>
        <p><strong>Téléphone :</strong> {{ apprenant.telephone ?? 'Non renseigné' }}</p>
        <p><strong>Date de naissance :</strong> {{ apprenant.date_naissance?.slice(0, 10) ?? 'Non renseignée' }}</p>
        <p><strong>Niveau actuel :</strong> {{ apprenant.niveau ?? 'Aucun niveau' }}</p>
         <p><strong>Statut :</strong> {{ apprenant.statut_utilisateur === 'suspendu' ? 'Suspendu' : 'Actif' }}</p>
      </section>

      <section v-if="peutGerer">
        <h2>Affecter à un niveau</h2>
        <div class="champ">
          <select v-model="choix">
            <option :value="null">Aucun niveau</option>
            <option v-for="niveau in niveaux" :key="niveau.id" :value="niveau.id">
              {{ niveau.nom }}
            </option>
          </select>
        </div>
        <button
          type="button"
          class="bouton-principal"
          :disabled="enCours || choix === (apprenant.id_niveau ?? null)"
          @click="appliquerNiveau"
        >
          Appliquer
        </button>
      </section>
      <br><br>
      <!-- (suspension) -->
      <section v-if="peutGerer && apprenant.statut_utilisateur !== 'anonymise'">
        <button
          v-if="apprenant.statut_utilisateur === 'actif'"
          type="button"
          class="bouton-secondaire"
          :disabled="enCours"
          @click="changerStatut('suspendu')"
        >
          Suspendre le compte
        </button>
        <button
          v-else
          type="button"
          class="bouton-principal"
          :disabled="enCours"
          @click="changerStatut('actif')"
        >
          Réactiver le compte
        </button>
      </section>

      <section>
        <h2>Historique des niveaux</h2>
        <p v-if="historique.length === 0">Aucune affectation.</p>
        <ul v-else class="liste">
          <li v-for="ligne in historique" :key="ligne.id" class="ligne">
            <span>{{ ligne.niveau }}</span>
            <span>
              {{ ligne.date_debut?.slice(0, 10) }} :
              {{ ligne.date_fin ? ligne.date_fin.slice(0, 10) : 'en cours' }}
            </span>
          </li>
        </ul>
      </section>

      <RouterLink to="/apprenants" class="lien-secondaire">Retour aux apprenants</RouterLink>
    </template>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BarreNavigation from '../../components/BarreNavigation.vue'
import {
  moi,
  trouverApprenant,
  affecterNiveauApprenant,
  listerNiveaux,
  changerStatutApprenant,
} from '../../services/api'

const route = useRoute()
const router = useRouter()
const apprenant = ref(null)
const historique = ref([])
const niveaux = ref([])
const choix = ref(null)
const peutGerer = ref(false)
const enCours = ref(false)
const erreur = ref('')
const message = ref('')

async function charger() {
  const { apprenant: a, historique: h } = await trouverApprenant(route.params.id)
  apprenant.value = a
  historique.value = h
  choix.value = a.id_niveau ?? null
}

onMounted(async () => {
  try {
    const { permissions } = await moi()
    if (!permissions.includes('apprenants.lire')) {
      router.push('/accueil')
      return
    }
    peutGerer.value = permissions.includes('apprenants.gerer')
    if (peutGerer.value) {
      const { niveaux: liste } = await listerNiveaux()
      niveaux.value = liste
    }
    await charger()
  } catch (err) {
    erreur.value = err.message
  }
})

async function appliquerNiveau() {
  erreur.value = ''
  message.value = ''
  enCours.value = true
  try {
    await affecterNiveauApprenant(route.params.id, choix.value)
    await charger()
    message.value = 'Niveau mis à jour.'
  } catch (err) {
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}

async function changerStatut(statut) {
  if (
    statut === 'suspendu' &&
    !window.confirm(`Suspendre le compte de ${apprenant.value.prenom} ${apprenant.value.nom} ? Il ne pourra plus se connecter.`)
  ) {
    return
  }
  erreur.value = ''
  message.value = ''
  enCours.value = true
  try {
    const resultat = await changerStatutApprenant(route.params.id, statut)
    apprenant.value = resultat.apprenant
    historique.value = resultat.historique
    message.value = statut === 'suspendu' ? 'Compte suspendu.' : 'Compte réactivé.'
  } catch (err) {
    erreur.value = err.message
  } finally {
    enCours.value = false
  }
}

</script>

<style scoped>
.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 1rem;
}

.entete,
.ligne {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.liste {
  list-style: none;
  padding: 0;
}

.ligne {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e5e5;
}
</style>
