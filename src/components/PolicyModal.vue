<template>
  <div v-if="show && isPresident" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <h3 class="modal-title">Tres Cartas</h3>
      <div class="cards-container">
        <CardTest
          v-for="(card, index) in cartas"
          :key="index"
          :estado="card.partido"
          :selected="selectedIndex === index"
          @click="selectCard(index)"
        />
      </div>
      <div class="modal-actions">
        <button @click="close" class="btn btn-primary">Seleccionar</button>
      </div>
    </div>
  </div>
</template>

<script>
import CardTest from "../components/CardTest.vue";
import { obtenerCartasParaPresidente } from "../firebase/uploadCards";
import { presidenteDescartarCarta } from "../firebase/uploadCards";

export default {
  name: "PolicyModal",
  components: {
    CardTest,
  },
  props: {
    show: Boolean,
    modelValue: {
      type: Boolean,
      required: true
    },
    isPresident: {
      type: Boolean,
      required: true
    },
    partidaId: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue', 'card-selected'],
  data() {
    return {
      selectedIndex: null,
      cartas: [],
    };
  },
  watch: {
    show: async function(newVal) {
      if (newVal && this.isPresident) {
        try {
          this.cartas = await obtenerCartasParaPresidente(this.partidaId);
          console.log("Cartas obtenidas:", this.cartas);
        } catch (error) {
          console.error("Error al obtener cartas:", error);
        }
      }
    }
  },
  methods: {
    selectCard(index) {
      this.selectedIndex = index;
    },
    async close() {
      if (this.selectedIndex !== null) {
        const selectedCard = this.cartas[this.selectedIndex];
        console.log('Carta seleccionada:', selectedCard);
        try {
          await presidenteDescartarCarta(this.partidaId, this.cartas, selectedCard.id);
          this.$emit("card-selected", selectedCard);
          this.$emit("update:modelValue", false);
        } catch (error) {
          console.error('Error al procesar la carta:', error);
        }
      } else {
        this.$emit("update:modelValue", false);
      }
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
}

.modal-title {
  margin-bottom: 1.5rem;
  text-align: center;
}

.cards-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.CardTest {
  cursor: pointer;
  transition: transform 0.2s;
}

.CardTest:hover {
  transform: scale(1.05);
}

.CardTest.selected {
  border: 2px solid #42b983;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #42b983;
  color: white;
}

.btn-primary:hover {
  background-color: #359a6d;
}
</style>