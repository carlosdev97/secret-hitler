<!-- src/components/Jugadores.vue -->
<template>
  <div 
    class="player-card d-flex align-items-center px-3 py-2 rounded position-relative"
    :class="{ 'opacity-50': !isAlive }"
  >
    <font-awesome-icon 
      :icon="['far','user']" 
      class="fs-4 me-2" 
      style="color: #434343" 
    />
    <span class="fw-semibold me-2">{{ name }}</span>
    <span v-if="isPresident" class="badge bg-warning text-dark me-1">P</span>
    <span v-if="isChancellor" class="badge bg-info text-dark">C</span>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  name: { type: String,  required: true },
  isAlive: { type: Boolean, default: true },
  isPresident: { type: Boolean, default: false },
  isChancellor:{ type: Boolean, default: false }
})
</script>

<style scoped>
.player-card {
  background-color: transparent;
  color: #000;
  font-family: "Segoe UI", Tahoma, Verdana, sans-serif;
}
.opacity-50 {
  opacity: .5;
}
</style>
