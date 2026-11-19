<template>
  <div
    class="barre"
    role="progressbar"
    :aria-valuenow="Math.round(fraction * 100)"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuetext="libelle"
  >
    <div class="remplissage" :style="{ width: `${Math.min(fraction, 1) * 100}%` }"></div>
    <p class="libelle">{{ libelle }}</p>
  </div>
</template>

<script setup>
defineProps({
  fraction: { type: Number, required: true },
  libelle: { type: String, default: '' },
})
</script>

<style scoped>
.barre {
  position: relative;
  height: 2.75rem;
  border-radius: 999px;
  background: #e8ecef;
  overflow: hidden;
  margin-bottom: 1.5rem;
}
.remplissage {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff7a8a, #ffb3a7);
  transition: width 0.4s ease;
}
.libelle {
  position: relative;
  margin: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #1f2937;
}
</style>
