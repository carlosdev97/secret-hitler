<template>
  <div class="votacion-test-view">
    <div class="header">
      <h1>Prueba de Sistema de Votación</h1>
      <p>Esta vista permite probar el sistema de votación de manera independiente</p>
    </div>

    <div class="content">
      <VotacionTest />
    </div>

    <div class="instructions">
      <h2>Instrucciones de Uso</h2>
      <ol>
        <li>Ingrese el ID de la partida en la que desea probar la votación</li>
        <li>Ingrese el ID del jugador que realizará la votación</li>
        <li>Utilice los botones "Ja" o "Nein" para registrar un voto</li>
        <li>Verifique el estado de la votación en la sección correspondiente</li>
        <li>Utilice los botones de acción para aprobar o rechazar la votación</li>
      </ol>
    </div>
  </div>
</template>

<script>
import VotacionTest from '../components/VotacionTest.vue';

export default {
  name: 'VotacionTestView',
  components: {
    VotacionTest
  }
};
</script>

<style scoped>
.votacion-test-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 40px;
}

.instructions {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 40px;
}

.instructions h2 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.instructions ol {
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 10px;
  line-height: 1.5;
}
</style> 