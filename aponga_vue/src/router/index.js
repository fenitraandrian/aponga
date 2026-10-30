import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/connexion' },
    { path: '/connexion', name: 'connexion', component: LoginView },
    { path: '/inscription', name: 'inscription', component: RegisterView },
    { path: '/mot-de-passe-oublie', name: 'mot-de-passe-oublie', component: ForgotPasswordView },
    { path: '/reinitialiser', name: 'reinitialiser', component: ResetPasswordView },
    { path: '/accueil', name: 'accueil', component: HomeView },
    {path: '/admin/roles',name: 'gestion-roles',component: () => import('../views/gestion_role/GestionRolesView.vue'),},
    {path: '/a-propos',name: 'a-propos',component: () => import('../views/AProposView.vue'),},
    {path: '/pedagogie',name: 'pedagogie',component: () => import('../views/pedagogie/PedagogieView.vue'),},
    {path: '/pedagogie/nouvelle',name: 'pedagogie-nouvelle',component: () => import('../views/pedagogie/FormulaireEtudeView.vue'),},
    {path: '/pedagogie/:id/modifier',name: 'pedagogie-modifier',component: () => import('../views/pedagogie/FormulaireEtudeView.vue'),},
    {path: '/pedagogie/:id',name: 'pedagogie-detail',component: () => import('../views/pedagogie/PedagogieDetailView.vue'),},
    {path: '/activites/:id',name: 'activite-detail',component: () => import('../views/pedagogie/ActiviteDetailView.vue'),},

    {path: '/niveaux',name: 'niveaux',component: () => import('../views/niveaux/NiveauxView.vue'),},
    {path: '/niveaux/nouveau',name: 'niveau-nouveau',component: () => import('../views/niveaux/NiveauFormulaireView.vue'),},
    {path: '/niveaux/:id/modifier',name: 'niveau-modifier',component: () => import('../views/niveaux/NiveauFormulaireView.vue'),},

    {path: '/apprenants',name: 'apprenants',component: () => import('../views/apprenants/ApprenantsView.vue'),},
    {path: '/apprenants/:id',name: 'apprenant-detail',component: () => import('../views/apprenants/ApprenantDetailView.vue'),},
    {path: '/apprenants/:id/modifier',name: 'apprenant-modifier',component: () => import('../views/apprenants/ApprenantFormulaireView.vue'),},

    {path: '/planning',name: 'planning',component: () => import('../views/seances/PlanningView.vue'),},
  ],
})

export default router
