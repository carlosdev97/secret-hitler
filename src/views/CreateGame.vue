<!-- src/views/CreateGame.vue -->
<template>
  <div class="container-create text-center">
    <div class="card card-create">
      <div class="card-body card-body-create">
        <div class="container-box">

          <!-- Unirse a partida existente -->
          <div class="mb-4 w-100">
            <h4>Unirse a una partida</h4>
            <div class="input-group justify-content-center">
              <input
                v-model="joinCode"
                type="text"
                class="form-control"
                placeholder="Código de partida"
              />
              <button
                class="btn btn-outline-primary"
                @click="handleJoin"
              >
                Unirse
              </button>
            </div>
          </div>

          <!-- Lista de participantes -->
          <div class="container-info conta me-3" style="width: 500px; padding: 8px;">
            <h4>Lista de participantes</h4>
            <table class="table table-striped table-bordered">
              <thead class="table-dark">
                <tr>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th v-if="game.estado === 'iniciada'">Rol</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in game.participantes" :key="p.uid">
                  <td>
                    {{ p.nombre }}
                    <span v-if="p.es_presidente" class="badge bg-warning text-dark ms-2">Presidente</span>
                    <span v-if="p.es_canciller"  class="badge bg-info text-dark ms-2">Canciller</span>
                  </td>
                  <td>
                    <span v-if="p.esta_vivo" class="badge bg-success">Vivo</span>
                    <span v-else class="badge bg-danger">Eliminado</span>
                  </td>
                  <td v-if="game.estado === 'iniciada'">
                    <span
                      v-if="mostrarRoles && (p.inclinacion === 'Fascista' || p.uid === usuarioActual.uid)"
                      class="badge"
                      :class="rolClass(p.rol)"
                    >
                      {{ p.rol }} ({{ p.inclinacion }})
                    </span>
                    <span v-else class="badge bg-secondary">?</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="game.estado === 'iniciada'" class="mt-3">
              <button
                class="btn btn-sm"
                :class="mostrarRoles ? 'btn-danger' : 'btn-success'"
                @click="mostrarRoles = !mostrarRoles"
              >
                {{ mostrarRoles ? 'Ocultar roles' : 'Mostrar roles' }}
              </button>
              <small class="d-block mt-1 text-muted">* Sólo ves roles fascistas y el tuyo</small>
            </div>
          </div>

          <!-- Controles y estado -->
          <div class="container-buttons d-grid" style="width: 250px; padding: 8px;">
            <h3>Código: {{ game.codigo }}</h3>
            <h5>
              Estado:
              <span class="badge"
                    :class="{
                      'bg-primary': game.estado === 'No iniciada',
                      'bg-success': game.estado === 'iniciada',
                      'bg-danger':  game.estado === 'finalizada'
                    }"
              >
                {{ game.estado }}
              </span>
            </h5>

            <div v-if="game.estado === 'No iniciada'">
              <div class="alert alert-info mt-2">
                <strong>Jugadores:</strong> {{ game.participantes.length }}/{{ game.configuracion.maxJugadores }}<br>
                <small>Mínimo para empezar: {{ game.configuracion.minJugadores }}</small>
              </div>
              <button
                class="btn btn-success mt-3"
                @click="iniciarPartida"
                :disabled="game.participantes.length < game.configuracion.minJugadores"
              >
                Iniciar partida
              </button>
              <button class="btn btn-outline-danger mt-2" @click="router.push({ name: 'Home' })">
                Volver
              </button>
            </div>

            <div v-else-if="game.estado === 'iniciada'">
              <div class="alert alert-warning mt-2">
                <strong>Partida en curso</strong><br>
                <small>El juego ha comenzado</small>
              </div>
              <button class="btn btn-primary mt-3" @click="irAPartida">
                Ir a partida
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }   from 'vue-router'
import { AuthService } from '@/firebase/auth.js'
import { createGame }  from '@/firebase/CreateGame.js'

// Redirigir si no está logueado
const router = useRouter()
const usuarioActual = AuthService.getCurrentUser()
if (!usuarioActual) {
  router.push({ name: 'Login' })
}

// Local state
const mostrarRoles = ref(false)
const joinCode     = ref('')

// CreateGame composable
const { game, inicializarJuego, iniciarPartida, escucharJugadores, joinGame } =
  createGame(({ name, params }) => router.push({ name, params }))

// On mount, initialize and subscribe
onMounted(async () => {
  await inicializarJuego()
  escucharJugadores(game.codigo, jugadores => {
    game.participantes = jugadores
  })
})

// Handle join
async function handleJoin() {
  if (!joinCode.value) return
  const ok = await joinGame(joinCode.value)
  if (ok) {
    // Clear input on success
    joinCode.value = ''
  }
}

// Navigate to nomination
const irAPartida = () => {
  router.push({ name: 'Nomination', params: { id: game.codigo } })
}

// Role badge classes
const rolClass = rol => ({
  'bg-danger':  rol === 'Hitler',
  'bg-warning': rol === 'Fascista',
  'bg-primary': rol === 'Liberal'
})
</script>

<style scoped>
.container-create {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}
.card-create {
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.card-body-create {
  padding: 2rem;
}
.container-box {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.table {
  margin-top: 1rem;
}
.badge {
  font-size: 0.8em;
  padding: 0.35em 0.65em;
}
</style>
