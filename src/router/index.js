import { createRouter, createWebHistory } from "vue-router";

import Home from "../views/Home.vue";
import Register from "../views/Register.vue";
import Login from "../views/Login.vue";
import CreateGame from "../views/CreateGame.vue";
import GameRoom from "../views/GameRoom.vue";
import GameBoard from "../components/GameBoard.vue";
import VotacionTestView from "../views/VotacionTestView.vue";
import CardTestView from "../views/CardTestView.vue";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/register", name: "Register", component: Register },
  { path: "/login", name: "Login", component: Login },
  { path: "/create-Game", name: "CreateGame", component: CreateGame },
  { path: "/game", name: "GameBoard", component: GameBoard },
  { path: "/game/:id", name: "GameRoom", component: GameRoom, props: true },
  { path: "/votacion-test", name: "VotacionTest", component: VotacionTestView },
  { path: "/card-test", name: "CardTest", component: CardTestView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
