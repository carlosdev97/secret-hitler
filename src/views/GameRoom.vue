<!-- src/views/GameRoom.vue -->
<script setup>
import { defineProps } from 'vue'
import { useGame } from '@/composables/useGame'
import GameBoard from '@/components/GameBoard.vue'
import Jugadores from '@/components/Jugadores.vue'

// Recibimos el ID de la ruta /game/:id
const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

// Obtenemos el estado reactivo de la partida
const game = useGame(props.id)
</script>

<template>
  <div class="container mt-4">
    <div class="row">
      <!-- Columna: Lista de jugadores -->
      <div class="col-md-3 mb-4">
        <h5 class="mb-3">Jugadores</h5>
        <div class="d-flex flex-column gap-2">
          <Jugadores
            v-for="p in game.players"
            :key="p.uid"
            :name="p.nombre"
            :is-alive="p.esta_vivo"
            :is-president="p.es_presidente"
            :is-chancellor="p.es_canciller"
          />
        </div>
      </div>

      <!-- Columna: Tablero de juego -->
      <div class="col-md-9">
        <GameBoard :game="game" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos locales si los necesitas */
</style>
