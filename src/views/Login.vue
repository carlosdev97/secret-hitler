<!-- src/views/Login.vue -->
<template>
  <div
    class="vh-100 position-relative d-flex flex-column justify-content-center align-items-center"
    style="background-color: #fbb25b"
  >
    <!-- Flecha para volver al Home -->
    <font-awesome-icon
      :icon="['fas', 'arrow-left']"
      class="position-absolute top-0 start-0 m-4 fs-4"
      @click="router.push({ name: 'Home' })"
      style="cursor: pointer; color: #434343"
    />

    <div class="w-100" style="max-width: 400px">
      <!-- Campo: Correo electrónico -->
      <div class="mb-4">
        <label class="form-label font-monospace fw-bold">
          Correo electrónico
        </label>
        <input
          type="email"
          class="form-control border border-dark rounded-0"
          v-model="email"
        />
      </div>

      <!-- Campo: Contraseña -->
      <div class="mb-4">
        <label class="form-label font-monospace fw-bold">
          Contraseña
        </label>
        <input
          type="password"
          class="form-control border border-dark rounded-0"
          v-model="password"
        />
      </div>

      <!-- Botón Ingresar -->
      <div class="text-center">
        <button
          class="btn btn-dark btn-font px-5 py-3 rounded-4 fw-bold"
          @click="handleLogin"
        >
          Ingresar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { AuthService } from '@/firebase/auth.js'

const router = useRouter()
const email = ref('')
const password = ref('')

async function handleLogin() {
  const { success, error } = await AuthService.login({
    email: email.value,
    password: password.value
  })

  if (success) {
    router.push({ name: 'CreateGame' })
  } else {
    Swal.fire('Error', error, 'error')
  }
}
</script>

<style scoped>
.btn-font {
  font-family: "Courier Prime", monospace;
  background-color: #434343;
  color: #fbb969;
}
.btn-font:hover {
  color: #fddf50;
}
</style>
