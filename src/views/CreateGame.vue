<template>
    <div class="container-create text-center">
      <div class="card card-create">
        <div class="card-body card-body-create">
          <div class="container-box">
            <div class="container-info conta me-3" style="width: 500px; padding: 8px;">
              <h4>Lista de participantes</h4>
              <table class="table table-striped table-bordered">
                <thead class="table-dark">
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Estado</th>
                    <th v-if="estado === 'iniciada'" scope="col">Rol</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, index) in participantes" :key="index">
                    <td>
                      {{ p.nombre }}
                      <span v-if="p.es_presidente" class="badge bg-warning text-dark ms-2">Presidente</span>
                      <span v-if="p.es_canciller" class="badge bg-info text-dark ms-2">Canciller</span>
                    </td>
                    <td>
                      <span v-if="p.esta_vivo" class="badge bg-success">Vivo</span>
                      <span v-else class="badge bg-danger">Eliminado</span>
                    </td>
                    <td v-if="estado === 'iniciada'">
                      <span v-if="mostrarRoles && p.uid === usuarioActual?.uid" class="badge" :class="rolClass(p.rol)">
                        {{ p.rol }} ({{ p.inclinacion }})
                      </span>
                      <span v-else-if="mostrarRoles && p.inclinacion === 'Fascista'" class="badge" :class="rolClass(p.rol)">
                        {{ p.rol }} ({{ p.inclinacion }})
                      </span>
                      <span v-else class="badge bg-secondary">
                        ?
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="estado === 'iniciada'" class="mt-3">
                <button class="btn btn-sm" :class="mostrarRoles ? 'btn-danger' : 'btn-success'" @click="mostrarRoles = !mostrarRoles">
                  {{ mostrarRoles ? 'Ocultar roles' : 'Mostrar roles' }}
                </button>
                <small class="d-block mt-1 text-muted">* Solo ves roles completos de fascistas y el tuyo</small>
              </div>
            </div>
  
            <div class="container-buttons d-grid" style="width: 250px; padding: 8px;">
              <h3 class="me-2">Código: {{ codigo }}</h3>
              <h5>Estado: 
                <span class="badge" :class="{
                  'bg-primary': estado === 'No iniciada',
                  'bg-success': estado === 'iniciada',
                  'bg-danger': estado === 'finalizada'
                }">
                  {{ estado }}
                </span>
              </h5>
              
              <div v-if="estado === 'No iniciada'">
                <div class="alert alert-info mt-2">
                  <strong>Jugadores:</strong> {{ participantes.length }}/{{ game.configuracion.maxJugadores }}<br>
                  <small>Mínimo para empezar: {{ game.configuracion.minJugadores }}</small>
                </div>
                <button 
                  class="btn btn-success mt-3" 
                  @click="iniciarPartida"
                  :disabled="participantes.length < game.configuracion.minJugadores"
                >
                  Iniciar partida
                </button>
                <button class="btn btn-outline-danger mt-3" @click="$router.push('/home')">Volver</button>
              </div>
              
              <div v-else-if="estado === 'iniciada'">
                <div class="alert alert-warning mt-2">
                  <strong>Partida en curso</strong><br>
                  <small>El juego ha comenzado</small>
                </div>
                <button class="btn btn-primary mt-3" @click="irAPartida">Ir a partida</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from "vue";
  import { useRouter } from "vue-router";
  import { getAuth } from "firebase/auth";
  import { createGame } from "../firebase/CreateGame.js";
  
  const auth = getAuth();
  const router = useRouter();
  
  const codigo = ref("");
  const participantes = ref([]);
  const estado = ref("No iniciada");
  const mostrarRoles = ref(false);
  const usuarioActual = ref(null);
  
  const { game, inicializarJuego, iniciarPartida, escucharJugadores } = createGame((url) => router.push(url));
  
  const rolClass = (rol) => {
    return {
      'bg-danger': rol === 'Hitler',
      'bg-warning': rol === 'Fascista',
      'bg-primary': rol === 'Liberal'
    };
  };
  
  onMounted(async () => {
    usuarioActual.value = auth.currentUser;
    await inicializarJuego();
    codigo.value = game.codigo;
    participantes.value = game.participantes;
    estado.value = game.estado;
  
    escucharJugadores(game.codigo, (jugadores) => {
      participantes.value = jugadores;
    });
  });
  
  const irAPartida = () => {
    router.push(`/partida/${codigo.value}`);
  };
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
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .card-body-create {
    padding: 2rem;
  }
  
  .container-box {
    display: flex;
    justify-content: center;
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