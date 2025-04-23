import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import "./style.css";
import App from "./App.vue";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
// Font Awesome
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const routes = [
  { path: "/", component: () => import("./views/Home.vue") },
  { path: "/register", component: () => import("./views/Register.vue") },
  { path: "/login", component: () => import("./views/Login.vue") },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

library.add(faArrowLeft);

const app = createApp(App);

app.component("font-awesome-icon", FontAwesomeIcon);
app.use(router);

// app.use(Vue3Toastify, {
//   autoClose: 3000,
//   position: "top-center",
// });

app.mount("#app");
