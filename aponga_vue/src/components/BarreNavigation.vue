<template>
  <header class="barre-navigation">
    <RouterLink to="/" class="marque">
      <img src="../assets/OIP.webp" alt="APONGA" class="logo" />
    </RouterLink>

    <nav class="menu" aria-label="Menu principal">
      <RouterLink to="/accueil" class="lien">Accueil</RouterLink>
      <RouterLink to="/a-propos" class="lien">À propos</RouterLink>
      <RouterLink
        v-if="permissions.includes('inscriptions.soi')"
        to="/mes-seances"
        class="lien"
      >
        Mes séances
      </RouterLink>

      <div
        v-for="cat in menuCategories"
        :key="cat.titre"
        class="categorie"
      >
        <button
          type="button"
          class="titre-categorie"
          :aria-expanded="categorieOuverte === cat.titre"
          @click.stop="basculer(cat.titre)"
        >
          {{ cat.titre }} <span aria-hidden="true">▾</span>
        </button>

        <div v-if="categorieOuverte === cat.titre" class="panneau">
          <RouterLink
            v-for="item in cat.items"
            :key="item.to"
            :to="item.to"
            class="lien-panneau"
          >
            {{ item.label }}
          </RouterLink>
        </div>
      </div>
    </nav>

    <div class="session">
      <span v-if="nomAffiche" class="nom">{{ nomAffiche }}</span>
      <button class="bouton-deconnexion" @click="seDeconnecter">Se déconnecter</button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { moi, deconnexion } from '../services/api'

const router = useRouter()
const route = useRoute()
const utilisateur = ref(null)
const permissions = ref([])
const categorieOuverte = ref(null)

// Chaque catégorie regroupe des liens. Un lien n'apparaît que si l'utilisateur a la permission.
const categories = computed(() => {
  const p = permissions.value
  return [
    {
      titre: 'Formation',
      items: [
        { to: '/pedagogie', label: 'Pédagogie', visible: p.includes('pedagogie.lire') },
        { to: '/niveaux', label: 'Niveaux', visible: p.includes('pedagogie.lire') },
        { to: '/enseignants', label: 'Enseignants', visible: p.includes('enseignants.lire') },
        { to: '/exercices/a-valider', label: 'Exercices à valider', visible: p.includes('exercices.gerer') },
      ],
    },
    {
      titre: 'Planning',
      items: [
        { to: '/planning', label: 'Planning', visible: p.includes('seances.lire') },
        { to: '/inscriptions-seances', label: 'Apprenants par séance', visible: p.includes('inscriptions.lire') },
      ],
    },
    {
      titre: 'Apprenants',
      items: [
        { to: '/apprenants', label: 'Apprenants', visible: p.includes('apprenants.lire') },
        { to: '/admin/soldes', label: 'Soldes', visible: p.includes('soldes.gerer') },
      ],
    },
    {
      titre: 'Exercices',
      items: [
        { to: '/mes-exercices', label: 'Mes exercices', visible: p.includes('exercices.soumettre') },
      ],
    },
    {
      titre: 'Administration',
      items: [
        { to: '/admin/roles', label: 'Gestion des rôles', visible: p.includes('roles.lire') },
        { to: '/admin/telechargements', label: 'Téléchargements', visible: p.includes('telechargements.gerer') },
        { to: '/admin/journal', label: 'Journal', visible: p.includes('journal.lire') },
        { to: '/admin/tarifs', label: 'Tarifs', visible: p.includes('paiements.gerer') },
        { to: '/admin/paiements', label: 'Paiements', visible: p.includes('paiements.gerer') },
      ],
    },
  ]
})

// On ne garde que les catégories qui contiennent au moins un lien visible
const menuCategories = computed(() =>
  categories.value
    .map((c) => ({ ...c, items: c.items.filter((i) => i.visible) }))
    .filter((c) => c.items.length > 0)
)

const nomAffiche = computed(() => {
  if (!utilisateur.value) return ''
  const nom = `${utilisateur.value.prenom ?? ''} ${utilisateur.value.nom ?? ''}`.trim()
  return nom || utilisateur.value.email
})

function basculer(titre) {
  categorieOuverte.value = categorieOuverte.value === titre ? null : titre
}

// Ferme le panneau dès qu'on change de page
watch(
  () => route.fullPath,
  () => {
    categorieOuverte.value = null
  }
)

// Ferme le panneau quand on clique en dehors du menu
function fermerSiDehors(evenement) {
  if (!evenement.target.closest('.categorie')) categorieOuverte.value = null
}

onMounted(async () => {
  document.addEventListener('click', fermerSiDehors)
  try {
    const donnees = await moi()
    utilisateur.value = donnees.utilisateur
    permissions.value = donnees.permissions
  } catch {
    router.push('/connexion')
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', fermerSiDehors)
})

async function seDeconnecter() {
  try {
    await deconnexion()
  } finally {
    router.push('/connexion')
  }
}
</script>

<style scoped>
.barre-navigation {
  position: sticky;
  top: 0;
  z-index: 100;
  /* background: #fff; */
  background: var(--couleur-principale);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.6rem 1.5rem;
  border-bottom: 1px solid #ddd;
}

.marque {
  font-weight: 700;
  font-size: 1.2rem;
  text-decoration: none;
  color: inherit;
}

.menu {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.lien,
.titre-categorie {
  padding: 0.4rem 0.7rem;
  border-radius: 6px;
  color: #f8f8f8;
  text-decoration: none;
  background: none;
  border: none;
  font: inherit;
  cursor: pointer;
}

.lien:hover,
.titre-categorie:hover {
  background: rgba(255, 255, 255, 0.12);
}

.lien.router-link-active {
  font-weight: 700;
  background: rgba(255, 255, 255, 0.18);
}

.titre-categorie[aria-expanded='true'] {
  background: rgba(255, 255, 255, 0.18);
}

.categorie {
  position: relative;
}

.panneau {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 6px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.4rem;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  z-index: 110;
}

.lien-panneau {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: #222;
  text-decoration: none;
  white-space: nowrap;
}

.lien-panneau:hover {
  background: #eef5ff;
  color: #0066cc;
}

.lien-panneau.router-link-active {
  font-weight: 700;
  color: #0066cc;
}

.session {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nom {
  font-size: 0.95rem;
}

.bouton-deconnexion {
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}

.logo { height: 80px; width: auto; border-radius: 6px; display: block; }

@media (max-width: 720px) {
  .barre-navigation {
    justify-content: center;
  }
}
</style>
