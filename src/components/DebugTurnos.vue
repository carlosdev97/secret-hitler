<template>
    <div class="debug-panel">
      <h5>🔍 Debug de Turnos</h5>
      <button @click="handleRotarPresidente" class="btn-test">
        Rotar Presidente
      </button>
      <div v-if="resultado">
        <p>Nuevo presidente: {{ resultado.nombre }}</p>
        <p>Orden de turno: {{ resultado.ordenTurno }}</p>
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { rotarPresidente as rotarPresidenteFirebase } from '../firebase/gameBoard';
  
  
  const resultado = ref(null);
  const error = ref(null);
  
  const handleRotarPresidente = async () => {
    error.value = null;
    resultado.value = null;
    
    try {
      resultado.value = await rotarPresidenteFirebase("1");
      console.log('Rotación exitosa:', resultado.value);
    } catch (err) {
      error.value = err.message;
      console.error('Error al rotar presidente:', err);
    }
  };
  </script>
  
  <style scoped>
  .debug-panel {
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 8px;
    margin-top: 1rem;
  }
  
  .btn-test {
    padding: 0.5rem 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .error-message {
    color: #f44336;
    margin-top: 0.5rem;
  }
  </style>