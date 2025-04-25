<template>
  <div v-if="show && isPresident" class="modal-overlay" @click.self="close">
    <div class="modal-box d-flex flex-column align-items-center gap-5">
      <h3>Selecciona el candidato</h3>
      <div class="player-list d-flex gap-3">
        <PlayerCard
          v-for="(player, index) in filteredPlayers"
          :key="index"
          :username="player.nombre"
          :class="{ selected: selectedIndex === index }"
          @click="selectCard(index)"
        />
      </div>
      <button
        class="btn btn-dark btn-font px-5 py-3 rounded-4 fw-bold"
        @click="close"
      >
        Nominar
      </button>
    </div>
  </div>
</template>

<script>
import PlayerCard from "../components/PlayerCard.vue";
import { postularCanciller } from "../firebase/GameBoard.js";

export default {
  name: "SimpleModal",
  components: {
    PlayerCard,
  },
  props: {
    show: Boolean,
    isPresident: {
      type: Boolean,
      required: true
    },
    players: {
      type: Array,
      default: () => [],
    },
    partidaId: {
      type: String,
      required: true
    },
    currentPlayer: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      selectedIndex: null,
    };
  },
  computed: {
    filteredPlayers() {
      return this.players.filter(player => !player.es_presidente);
    }
  },
  watch: {
    show(newValue) {
      console.log("Modal show changed:", newValue);
    },
    isPresident(newValue) {
      console.log("Modal isPresident changed:", newValue);
    }
  },
  methods: {
    selectCard(index) {
      this.selectedIndex = index;
    },
    async close() {
      const selectedPlayer = this.filteredPlayers[this.selectedIndex];
      if (selectedPlayer) {
        try {
          const result = await postularCanciller(
            this.partidaId,
            this.currentPlayer.uid,
            selectedPlayer.uid
          );
          if (!result.success) {
            console.error("Error al postular canciller:", result.error);
            return;
          }
          this.$emit("player-selected", selectedPlayer);
        } catch (error) {
          console.error("Error al postular canciller:", error);
          return;
        }
      }
      this.$emit("update:show", false);
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: #e7e7e7;
  padding: 1.5rem;
  border-radius: 0.5rem;
  min-width: 500px;
  text-align: center;
}

.player-card.selected {
  border-width: 3px;
  border-color: #fddf50;
}

.btn-font {
  font-family: "Courier Prime", monospace;
  background-color: #434343;
  color: #fbb969;
}

.btn-font:hover {
  color: #fddf50;
}
</style>
