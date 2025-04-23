<template>
    <div class="container-fluid bg-warning p-4 rounded-3 text-center">
      <h4 class="mb-4">Zona de Juego</h4>
  
      <!-- Tablero fascista -->
      <div class="mb-3 p-2 bg-danger text-white rounded">
        <h5>[2] Tablero Fascista</h5>
        <div class="d-flex justify-content-center gap-2 flex-wrap">
          <div class="card p-2 bg-dark text-white">Política</div>
          <div class="card p-2 bg-dark text-white">Política</div>
          <div class="card p-2 bg-dark text-white">Poder</div>
          <div class="card p-2 bg-dark text-white">Poder</div>
          <div class="card p-2 bg-dark text-white">Poder</div>
        </div>
      </div>
  
      <!-- Tablero liberal -->
      <div class="mb-3 p-2 bg-primary text-white rounded">
        <h5>[3] Tablero Liberal</h5>
        <div class="d-flex justify-content-center gap-2 flex-wrap">
          <div class="card p-2 bg-light text-dark">Política</div>
          <div class="card p-2 bg-light text-dark">Política</div>
          <div class="card p-2 bg-light text-dark">Vacío</div>
          <div class="card p-2 bg-light text-dark">Vacío</div>
          <div class="card p-2 bg-light text-dark">Vacío</div>
        </div>
      </div>
  
      <!-- Zona inferior -->
      <div class="row mt-4 justify-content-center">
        <div class="col-2">
          <div class="card p-3 bg-success text-white">[10] Pila de Robar</div>
        </div>
        <div class="col-2">
          <div class="card p-3 bg-dark text-white">[11] Política</div>
        </div>
        <div class="col-2 d-flex align-items-center justify-content-center">
          <button class="btn btn-secondary">[9] Terminar Turno</button>
        </div>
        <div class="col-2">
          <div class="card p-3 bg-secondary text-white">[12] Descarte</div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  // Por ahora está en estático. Más adelante lo conectaremos a Firestore.
  </script>
  
  <style scoped>
  .card {
    width: 100px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  </style>
  