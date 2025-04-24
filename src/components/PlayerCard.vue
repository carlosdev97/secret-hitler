<template>
  <div
    class="card player-card rounded-4 p-4 d-flex flex-column align-items-center"
  >
    <div class="user-icon mb-2">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" />
        <path
          d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <div class="player-name">
      {{ username }}
    </div>
  </div>
</template>

<script>
export default {
  name: "PlayerCard",
  props: {
    username: {
      type: String,
      required: true,
      default: "Jugador",
    },
  },
};
</script>

<style scoped>
.player-card {
  width: 120px;
  min-height: 150px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: border 0.3s ease;
}

.player-card:hover {
  cursor: pointer;
  border-width: 3px;
  border-color: #fddf50;
}

.user-icon {
  color: #000;
}

.player-name {
  font-size: 1rem;
  font-weight: 500;
}
</style>
