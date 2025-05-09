<template>
  <div
    class="card policy-card rounded-4 p-4 d-flex flex-column align-items-center"
    :class="{ 
      'liberal': estado === 'liberal', 
      'fascist': estado === 'fascista',
      'selected': selected
    }"
    @click="$emit('click')"
  >
    <div class="card-type" style="color: white">
      {{ estado === 'liberal' ? 'LIBERAL' : 'FASCISTA' }}
    </div>
  </div>
</template>

<script>
export default {
  name: "CardTest",
  props: {
    estado: {
      type: String,
      required: true,
      validator: (value) => ['liberal', 'fascista'].includes(value)
    },
    selected: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.policy-card {
  width: 120px;
  min-height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.policy-card:hover {
  transform: scale(1.05);
  border-width: 3px;
}

.policy-card.selected {
  transform: scale(1.2);
  border: 3px solid white;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.policy-card.liberal {
  background-color: #3498db;
  color: white;
}

.policy-card.fascist {
  background-color: #e74c3c;
  color: white;
}

.card-type {
  font-size: 1.2rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
}
</style>
