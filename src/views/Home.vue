<template>
  <div
    class="d-flex flex-column align-items-center justify-content-center vh-100"
  >
    <!-- Logo -->
    <div class="mb-5">
      <img
        src="../assets/secret-hitler.png"
        alt="Secret Hitler"
        class="img-fluid"
        style="max-height: 120px"
      />
    </div>

    <!-- Botones -->
    <div class="d-flex gap-3">
      <button
        class="btn btn-dark btn-font px-5 py-3 rounded-4 fw-bold"
        @click="router.push('/register')"
      >
        Registrarse
      </button>
      <button
        class="btn btn-dark btn-font px-5 py-3 rounded-4 fw-bold"
        @click="router.push('/login')"
      >
        Ingresar
      </button>
    </div>
  </div>
</template>

<script>
import { useRouter } from "vue-router";
export default {
  name: "Home",
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
