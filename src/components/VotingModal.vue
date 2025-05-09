<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-box d-flex flex-column align-items-center gap-5">
      <h3>Votación: ¿Aprobar a {{ candidatoNombre }} como Canciller?</h3>
      
      <div class="voting-options d-flex gap-4">
        <button 
          class="btn btn-success btn-lg px-4 py-3"
          @click="vote('Ja')"
          :disabled="hasVoted"
        >
          Ja (Sí)
        </button>
        <button 
          class="btn btn-danger btn-lg px-4 py-3"
          @click="vote('Nein')"
          :disabled="hasVoted"
        >
          Nein (No)
        </button>
      </div>

      <div v-if="hasVoted" class="alert alert-info">
        Ya has votado: {{ userVote }}
      </div>

      <div class="voting-status" v-if="votesCount > 0">
        <p>Votos registrados: {{ votesCount }}</p>
        <p>Ja: {{ jaVotes }} | Nein: {{ neinVotes }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onUnmounted } from 'vue';
import { 
  registrarVoto as registrarVotoFB,
  manejarResultadoVotacion
} from "../firebase/GameBoard.js";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

export default {
  name: "VotingModal",
  props: {
    show: Boolean,
    candidatoId: {
      type: String,
      required: true
    },
    candidatoNombre: {
      type: String,
      required: true
    },
    partidaId: {
      type: String,
      required: true
    },
    jugadorId: {
      type: String,
      required: true
    }
  },
  setup(props, { emit }) {
    const hasVoted = ref(false);
    const userVote = ref(null);
    const votesCount = ref(0);
    const jaVotes = ref(0);
    const neinVotes = ref(0);
    const votingCompleted = ref(false);
    let unsubscribe = null;

    const vote = async (voto) => {
      try {
        const result = await registrarVotoFB(
          props.partidaId,
          props.jugadorId,
          voto
        );
        
        if (!result.success) {
          alert(result.error || "Error al registrar voto");
          return;
        }
        
        hasVoted.value = true;
        userVote.value = voto;
        
      } catch (error) {
        console.error("Error al votar:", error);
        alert("Error al registrar tu voto");
      }
    };

    const setupVoteListener = () => {
      const estadoRef = doc(db, `partidas/${props.partidaId}/tablero/estado`);
      unsubscribe = onSnapshot(estadoRef, async (doc) => {
        if (doc.exists()) {
          const votacion = doc.data().votacion || {};
          const votos = votacion.votos || {};
          
          // Update vote counts
          votesCount.value = Object.keys(votos).length;
          jaVotes.value = Object.values(votos).filter(v => v === "Ja").length;
          neinVotes.value = votesCount.value - jaVotes.value;
          
          // Check if voting is completed
          if (votacion.completada) {
            votingCompleted.value = true;
            processVotingResult(); // Procesar automáticamente el resultado
          }
          
          // Check if current user has voted
          if (votos[props.jugadorId]) {
            hasVoted.value = true;
            userVote.value = votos[props.jugadorId];
          }
        }
      });
    };

    const processVotingResult = async () => {
      try {
        const aprobado = jaVotes.value > neinVotes.value;
        const result = await manejarResultadoVotacion(
          props.partidaId,
          aprobado,
          props.candidatoId
        );
        
        if (!result.success) {
          alert("Error al procesar resultados: " + (result.error || ""));
        }
        
        emit("voto-registrado", {
          aprobado,
          candidato: props.candidatoNombre,
          jaVotes: jaVotes.value,
          neinVotes: neinVotes.value
        });
        
        resetState();
        emit("update:show", false);
      } catch (error) {
        console.error("Error al manejar resultado:", error);
        alert("Error al procesar los resultados de la votación");
      }
    };

    const resetState = () => {
      if (unsubscribe) {
        unsubscribe();
      }
      hasVoted.value = false;
      userVote.value = null;
      votesCount.value = 0;
      jaVotes.value = 0;
      neinVotes.value = 0;
      votingCompleted.value = false;
    };

    watch(() => props.show, (newVal) => {
      if (newVal) {
        setupVoteListener();
      } else {
        resetState();
      }
    });

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    return {
      hasVoted,
      userVote,
      votesCount,
      jaVotes,
      neinVotes,
      votingCompleted,
      vote
    };
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 10px;
  min-width: 600px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.voting-options {
  margin: 1.5rem 0;
}

.btn-success, .btn-danger {
  min-width: 120px;
  font-weight: bold;
}

.voting-status {
  margin-top: 1rem;
  padding: 1rem;
  background: #e9ecef;
  border-radius: 5px;
  width: 100%;
}

.btn-font {
  font-family: "Courier Prime", monospace;
  background-color: #434343;
  color: #fbb969;
  transition: all 0.3s;
}

.btn-font:hover {
  color: #fddf50;
  transform: translateY(-2px);
}

.btn-font:disabled {
  opacity: 0.7;
  transform: none;
}
</style>