<template>
  <div class="card-test-view">
    <div class="header">
      <h1>Prueba de Sistema de Cartas</h1>
      <p>Esta vista permite probar el sistema de cartas de manera independiente</p>
    </div>

    <div class="content">
      <CardTest />
    </div>

    <div class="instructions">
      <h2>Instrucciones de Uso</h2>
      <ol>
        <li>Ingrese el ID de la partida en la que desea probar el sistema de cartas</li>
        <li>Seleccione el tipo de carta que desea probar (Liberal o Fascista)</li>
        <li>Utilice los botones para realizar acciones con las cartas</li>
        <li>Verifique el estado de las cartas en la sección correspondiente</li>
      </ol>
    </div>
  </div>
</template>

<script>
import CardTest from '../components/CardTest.vue';

export default {
  name: 'CardTestView',
  components: {
    CardTest
  }
};
</script>

<style scoped>
.card-test-view {
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