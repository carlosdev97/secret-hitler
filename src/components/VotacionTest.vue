<template>
  <div class="votacion-test">
    <h2>Prueba de Funcionalidad de Votación</h2>
    
    <div class="controls">
      <div class="input-group">
        <label>ID de Partida:</label>
        <input v-model="partidaId" type="text" placeholder="Ingrese ID de partida">
        <button @click="cargarJugadores" :disabled="!partidaId">Cargar Jugadores</button>
      </div>
    </div>

    <div class="jugadores-section" v-if="jugadores.length > 0">
      <h3>Jugadores</h3>
      <div class="jugadores-list">
        <div v-for="jugador in jugadores" :key="jugador.id" class="jugador-card">
          <div class="jugador-info">
            <span class="jugador-nombre">{{ jugador.nombre }}</span>
            <span class="jugador-id">ID: {{ jugador.id }}</span>
          </div>
          
          <div class="voting-options" v-if="!jugador.voto">
            <div class="radio-group">
              <label>
                <input type="radio" :name="'voto-' + jugador.id" value="Ja" v-model="jugador.votoSeleccionado">
                Ja
              </label>
              <label>
                <input type="radio" :name="'voto-' + jugador.id" value="Nein" v-model="jugador.votoSeleccionado">
                Nein
              </label>
            </div>
            <button 
              @click="registrarVoto(jugador.id, jugador.votoSeleccionado)"
              :disabled="!jugador.votoSeleccionado"
              class="votar-btn"
            >
              Votar
            </button>
          </div>
          
          <div v-else class="voto-registrado">
            Voto registrado: {{ jugador.voto }}
          </div>
        </div>
      </div>
    </div>

    <div class="status-section">
      <h3>Estado de la Votación</h3>
      <div v-if="votacionActual">
        <p>Votos registrados: {{ Object.keys(votacionActual.votos || {}).length }}</p>
        <p>Votación completada: {{ votacionActual.completada ? 'Sí' : 'No' }}</p>
        <div v-if="votacionActual.votos">
          <h4>Detalles de votos:</h4>
          <ul>
            <li v-for="(voto, id) in votacionActual.votos" :key="id">
              Jugador {{ id }}: {{ voto }}
            </li>
          </ul>
        </div>
      </div>
      <p v-else>No hay votación en curso</p>
    </div>

    <div class="results" v-if="resultado">
      <h3>Resultado</h3>
      <p>{{ resultado }}</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { 
  registrarVoto as registrarVotoFB,
  verificarVotacionCompleta,
  manejarResultadoVotacion,
  contarVotos
} from '../firebase/GameBoard';
import { doc, onSnapshot, collection, getDocs, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default {
  name: 'VotacionTest',
  setup() {
    const partidaId = ref('');
    const jugadores = ref([]);
    const votacionActual = ref(null);
    const resultado = ref('');

    const cargarJugadores = async () => {
      try {
        const jugadoresRef = collection(db, `partidas/${partidaId.value}/jugadores`);
        const jugadoresSnap = await getDocs(jugadoresRef);
        
        jugadores.value = jugadoresSnap.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre,
          voto: null,
          votoSeleccionado: null
        }));

        // Inicializar la votación en el estado
        const estadoRef = doc(db, `partidas/${partidaId.value}/tablero/estado`);
        const partidaRef = doc(db, `partidas/${partidaId.value}`);
        const partidaSnap = await getDoc(partidaRef);

        if (!partidaSnap.exists()) {
          throw new Error("La partida no existe");
        }

        const partidaData = partidaSnap.data();
        const cancillerPostuladoId = partidaData.turnoActual?.id_canciller_postulado;

        await updateDoc(estadoRef, {
          votacion: {
            votos: {},
            completada: false
          }
        });

        // Suscribirse a cambios en el estado
        const unsubscribe = onSnapshot(estadoRef, async (doc) => {
          if (doc.exists()) {
            votacionActual.value = doc.data().votacion || null;
            
            // Actualizar los votos de los jugadores
            if (votacionActual.value?.votos) {
              jugadores.value.forEach(jugador => {
                jugador.voto = votacionActual.value.votos[jugador.id] || null;
              });

              // Verificar si todos han votado
              const todosHanVotado = jugadores.value.every(jugador => jugador.voto !== null);
              
              if (todosHanVotado && !votacionActual.value.completada) {
                // Actualizar estado a completado
                await updateDoc(estadoRef, {
                  "votacion.completada": true
                });

                // Calcular resultado automáticamente
                const votosJa = Object.values(votacionActual.value.votos).filter(v => v === "Ja").length;
                const votosNein = Object.values(votacionActual.value.votos).filter(v => v === "Nein").length;
                const aprobado = votosJa > votosNein;

                // Esperar un momento antes de procesar el resultado
                setTimeout(async () => {
                  const response = await manejarResultadoVotacion(partidaId.value, aprobado, cancillerPostuladoId);
                  if (response.success) {
                    resultado.value = `Votación ${aprobado ? 'aprobada' : 'rechazada'} automáticamente`;
                  } else {
                    resultado.value = `Error al procesar resultado: ${response.error}`;
                  }
                }, 1000);
              }
            }
          }
        });

        return () => unsubscribe();
      } catch (error) {
        resultado.value = `Error al cargar jugadores: ${error.message}`;
      }
    };

    const registrarVoto = async (jugadorId, voto) => {
      if (!partidaId.value) {
        resultado.value = 'Por favor ingrese ID de partida';
        return;
      }

      const response = await registrarVotoFB(partidaId.value, jugadorId, voto);
      if (response.success) {
        resultado.value = `Voto ${voto} registrado exitosamente para el jugador ${jugadorId}`;
        const jugador = jugadores.value.find(j => j.id === jugadorId);
        if (jugador) {
          jugador.voto = voto;
        }
      } else {
        resultado.value = `Error: ${response.error}`;
      }
    };

    onMounted(() => {
      if (partidaId.value) {
        const estadoRef = doc(db, `partidas/${partidaId.value}/tablero/estado`);
        const unsubscribe = onSnapshot(estadoRef, (doc) => {
          if (doc.exists()) {
            votacionActual.value = doc.data().votacion || null;
          }
        });

        return () => unsubscribe();
      }
    });

    return {
      partidaId,
      jugadores,
      votacionActual,
      resultado,
      cargarJugadores,
      registrarVoto
    };
  }
};
</script>

<style scoped>
.votacion-test {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.controls {
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.input-group label {
  min-width: 100px;
}

.input-group input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.jugadores-section {
  margin: 20px 0;
}

.jugadores-list {
  display: grid;
  gap: 15px;
}

.jugador-card {
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.jugador-info {
  display: flex;
  flex-direction: column;
}

.jugador-nombre {
  font-weight: bold;
  font-size: 1.1em;
}

.jugador-id {
  color: #666;
  font-size: 0.9em;
}

.voting-options {
  display: flex;
  gap: 15px;
  align-items: center;
}

.radio-group {
  display: flex;
  gap: 15px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 5px;
}

.votar-btn {
  padding: 6px 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.votar-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.voto-registrado {
  color: #4CAF50;
  font-weight: bold;
}

.status-section, .actions {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

.result-buttons {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.approve-btn {
  background-color: #4CAF50;
}

.reject-btn {
  background-color: #f44336;
}

.approve-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.reject-btn:hover:not(:disabled) {
  background-color: #d32f2f;
}

.results {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  padding: 5px 0;
}
</style> 