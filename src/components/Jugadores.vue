<!-- src/components/Jugadores.vue -->
<template>
  <div class="player-card" :class="{ 'player-dead': !isAlive }">
    <div class="player-name">
      {{ name }}
      <span v-if="isPresident" class="badge bg-primary">Presidente</span>
      <span v-if="isChancellor" class="badge bg-success">Canciller</span>
    </div>
    <div v-if="!isAlive" class="player-status">Muerto</div>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    default: 'Jugador'
  },
  isAlive: {
    type: Boolean,
    default: true
  },
  isPresident: {
    type: Boolean,
    default: false
  },
  isChancellor: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.player-card {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 5px;
}

.player-dead {
  opacity: 0.5;
  background-color: #f8f9fa;
}

.player-name {
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
}

.badge {
  margin-left: 5px;
  font-size: 0.8em;
}

.player-status {
  color: #dc3545;
  font-size: 0.9em;
}
</style>
