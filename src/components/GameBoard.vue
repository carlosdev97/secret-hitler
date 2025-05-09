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
          [{{ board.ultima_politica || "-" }}] Última Política
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
    <PolicyModal
      :show="showPolicyModal"
      :is-president="isCurrentPlayerPresidentPolicy"
      :partida-id="1377"
      @update:show="showPolicyModal = $event"
      @card-selected="handleCardSelected"
    />

    <!-- Modal de nominación -->
    <SimpleModal 
      v-model:show="showModal" 
      :players="game.players" 
      :current-player="currentPlayer"
      :partida-id="game.info?.codigo || ''"
      :is-president="isCurrentPlayerPresident"
      @player-selected="handlePlayerSelected" 
    />

    <!-- Modal de votación -->
    <VotingModal
      v-model:show="showVotingModal"
      :candidato-id="candidato.id"
      :candidato-nombre="candidato.nombre"
      :partida-id="game.info?.codigo || ''"
      :jugador-id="currentPlayer?.uid || ''"
      :jugadores="game.players"
      @voto-registrado="handleVotoRegistrado"
    />
  </div>
</template>

<script setup>
import { defineProps, ref, onMounted, computed, watch } from "vue";
import { rotarPresidente } from "@/firebase/GameBoard.js";
import SimpleModal from "../components/ModalWindow.vue";
import VotingModal from "../components/VotingModal.vue";
import PolicyModal from "../components/PolicyModal.vue";
import { AuthService } from "@/firebase/auth.js";
import { usePresidente } from "@/composables/usePresidente";

const props = defineProps({
  game: {
    type: Object,
    required: true,
  },
});



const candidato = ref({
  id: '',
  nombre: ''
});

// Estado inicial del modal
const showModal = ref(false);
const showVotingModal = ref(false);
const showPolicyModal = ref(false);
const candidatoId = ref('');

// Obtener el jugador actual
const currentPlayer = computed(() => {
  const currentUser = AuthService.getCurrentUser();
  const player = props.game.players.find(player => player.uid === currentUser?.uid) || {};
  console.log("Current Player:", player);
  return player;
});

const { presidenteId } = usePresidente(props.game.info?.codigo);

// Computed para verificar si el jugador actual es presidente
const isCurrentPlayerPresident = computed(() => {
  const isPresident = currentPlayer.value?.es_presidente === true;
  const fase = props.game.info?.turnoActual?.fase 
  return isPresident & fase === 'nominacion';
});

// Watch para mostrar el modal cuando el jugador se convierte en presidente
watch(isCurrentPlayerPresident, (newValue) => {
  if (newValue) {
    showModal.value = true;
  }
});

const isCurrentPlayerPresidentPolicy = computed(() => {
  const isPresident = currentPlayer.value?.es_presidente === true;
  const fase = props.game.info?.turnoActual?.fase 
  return isPresident & fase === 'legislacion';
});




// Watch para mostrar el modal de políticas cuando sea el turno del presidente
watch(isCurrentPlayerPresidentPolicy, (newValue) => {
  console.log("President status changed:", newValue);
  if (newValue) {
    showPolicyModal.value = true;
  }
});






// Watch para mostrar el modal de votación cuando hay un candidato y estamos en fase de votación
watch(() => ({
  candidato: props.game.info?.turnoActual?.id_canciller_postulado,
  fase: props.game.info?.turnoActual?.fase,
 
}), ({ candidato: candidatoId, fase }) => {
  
  if (fase === 'votacion' && candidatoId) {
    

    // Buscar el jugador completo
    const jugadorPostulado = props.game.players.find(players => players.uid === candidatoId) || {};
    console.log("Jugador postulado:", jugadorPostulado);  
    if (jugadorPostulado) {
      candidato.value = {
        id: candidatoId,
        nombre: jugadorPostulado.nombre
      };
      console.log("Mostrando modal de votación para:", candidato.value);
      showVotingModal.value = true;
    }
  } else {
    console.log("No se muestra el modal de votación, fase:", fase);
    showVotingModal.value = false;
  }
});


onMounted(() => {
  console.log("Game mounted");
  console.log("Game state:", props.game);
  console.log("Initial showModal value:", showModal.value);
  // Mostrar el modal si el jugador ya es presidente al montar el componente
  if (currentPlayer.value?.es_presidente) {
    showModal.value = true;
  }
});

const board = {
  leyes_fascistas: props.game.board?.leyes_fascistas ?? 0,
  leyes_liberales: props.game.board?.leyes_liberales ?? 0,
  mazo: props.game.board?.mazo ?? [],
  ultima_politica: props.game.board?.ultima_politica ?? null,
  descartes: props.game.board?.descartes ?? [],
};

async function endTurn() {
  try {
    await rotarPresidente(props.game.info?.codigo);
  } catch (error) {
    console.error("Error al terminar turno:", error);
  }
}

function handlePlayerSelected(player) {
  console.log("Jugador seleccionado en GameBoard:", player);
}

function handleVotoRegistrado() {
  showVotingModal.value = false;
}

function handleCardSelected() {
  showPolicyModal.value = false;
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
