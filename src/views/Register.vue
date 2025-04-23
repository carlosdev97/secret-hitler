<template>
  <div
    class="vh-100 position-relative d-flex flex-column justify-content-center align-items-center"
    style="background-color: #fbb25b"
  >
    <!-- Flecha en la esquina superior izquierda -->
    <font-awesome-icon
      :icon="['fas', 'arrow-left']"
      class="position-absolute top-0 start-0 m-4 fs-4"
      @click="router.push('/')"
      style="cursor: pointer; color: #434343"
    />

    <div class="w-100" style="max-width: 400px">
      <!-- Campo: Nombre de usuario -->
      <div class="mb-4">
        <label class="form-label font-monospace fw-bold"
          >Nombre de usuario</label
        >
        <input type="text" class="form-control border border-dark rounded-0" />
      </div>

      <!-- Campo: Correo electrónico -->
      <div class="mb-4">
        <label class="form-label font-monospace fw-bold"
          >Correo electronico</label
        >
        <input type="email" class="form-control border border-dark rounded-0" />
      </div>

      <!-- Campo: Contraseña -->
      <div class="mb-4">
        <label class="form-label font-monospace fw-bold"
          >Nombre de Usuario</label
        >
        <input
          type="password"
          class="form-control border border-dark rounded-0"
        />
      </div>

      <!-- Botón Registrarse -->
      <div class="text-center">
        <button class="btn btn-dark btn-font px-5 py-3 rounded-4 fw-bold">
          Registrarse
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from "vue-router";
export default {
  name: "Register",
  setup() {
    const router = useRouter();
    return {
      router,
    };
  },
};
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
