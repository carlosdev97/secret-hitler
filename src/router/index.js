import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'
import Register from '../views/Register.vue'
import GameRoom from '../views/GameRoom.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/register', name: 'Register', component: Register },
  { path: '/game', name: 'GameRoom', component: GameRoom }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

