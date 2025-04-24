<!-- src/components/GameBoard.vue -->
<template>
  <div class="container-fluid bg-warning p-4 rounded-3 text-center">
    <h4 class="mb-4">Zona de Juego</h4>

    <!-- Tablero Fascista -->
    <div class="mb-3 p-2 bg-danger text-white rounded">
      <h5>[{{ board.leyes_fascistas }}] Tablero Fascista</h5>
      <div class="d-flex justify-content-center gap-2 flex-wrap">
        <!-- Políticas promulgadas -->
        <div
          v-for="n in board.leyes_fascistas"
          :key="`f-${n}`"
          class="card p-2 bg-dark text-white"
        >
          Política
        </div>
        <!-- Espacios vacíos hasta 6 -->
        <div
          v-for="n in 6 - board.leyes_fascistas"
          :key="`f-v-${n}`"
          class="card p-2 bg-transparent border"
        />
      </div>
    </div>

    <!-- Tablero Liberal -->
    <div class="mb-3 p-2 bg-primary text-white rounded">
      <h5>[{{ board.leyes_liberales }}] Tablero Liberal</h5>
      <div class="d-flex justify-content-center gap-2 flex-wrap">
        <!-- Políticas promulgadas -->
        <div
          v-for="n in board.leyes_liberales"
          :key="`l-${n}`"
          class="card p-2 bg-light text-dark"
        >
          Política
        </div>
        <!-- Espacios vacíos hasta 5 -->
        <div
          v-for="n in 5 - board.leyes_liberales"
          :key="`l-v-${n}`"
          class="card p-2 bg-transparent border"
        />
      </div>
    </div>

    <!-- Zona inferior: mazo, última política, terminar turno y descarte -->
    <div class="row mt-4 justify-content-center">
      <div class="col-2">
        <div class="card p-3 bg-success text-white">
          [{{ board.mazo.length }}] Pila de Robar
        </div>
      </div>

      <div class="col-2">
        <div class="card p-3 bg-dark text-white">
          [{{ board.ultima_politica || '-' }}] Última Política
        </div>
      </div>

      <div class="col-2 d-flex align-items-center justify-content-center">
        <button class="btn btn-secondary" @click="endTurn">
          Terminar Turno
        </button>
      </div>

      <div class="col-2">
        <div class="card p-3 bg-secondary text-white">
          [{{ board.descartes.length }}] Descarte
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { rotarPresidente } from '@/firebase/GameBoard.js'

const props = defineProps({
  game: {
    type: Object,
    required: true
  }
})

// Inicializamos board con defaults para evitar undefined
const board = {
  leyes_fascistas:      props.game.board?.leyes_fascistas      ?? 0,
  leyes_liberales:      props.game.board?.leyes_liberales      ?? 0,
  mazo:                 props.game.board?.mazo                 ?? [],
  ultima_politica:      props.game.board?.ultima_politica      ?? null,
  descartes:            props.game.board?.descartes            ?? []
}

// Llama a la función que rota presidente
async function endTurn() {
  try {
    await rotarPresidente(props.game.codigo)
  } catch (error) {
    console.error("Error al terminar turno:", error)
  }
}
</script>

<style scoped>
.card {
  width: 100px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Borde punteado para espacios vacíos */
.border {
  border: 1px dashed #ccc;
}
</style>
