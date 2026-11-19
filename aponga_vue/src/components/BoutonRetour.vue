<template>
  <RouterLink :to="to" class="bouton-retour">
    <span aria-hidden="true">←</span> {{ libelle }}
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  to: { type: String, required: true },
  libelle: { type: String, default: 'Retour' },
})
</script>

<style scoped>
.bouton-retour {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  color: #0066cc;
  text-decoration: none;
  font-size: 0.95rem;
}
.bouton-retour:hover,
.bouton-retour:focus-visible {
  text-decoration: underline;
}
</style>
