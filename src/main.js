import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import "./style.css";
import App from "./App.vue";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const routes = [{ path: "/", component: () => import("./views/Home.vue") }];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);

app.use(router);

// app.use(Vue3Toastify, {
//   autoClose: 3000,
//   position: "top-center",
// });

app.mount("#app");
