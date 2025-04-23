<template>
  <div
    class="player-card d-flex align-items-center px-3 py-2 rounded position-relative"
  >
    <font-awesome-icon
      :icon="['far', 'user']"
      class="fs-4 me-2"
      style="color: #434343"
    />
    <span class="fw-semibold">{{ name }}</span>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.player-card {
  background-color: transparent;
  color: #000;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}
</style>
