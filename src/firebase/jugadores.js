// jugadores.js
import { db } from "./config.js";
import { doc, setDoc } from "firebase/firestore";

const jugadores = [
  { uid: "jugador1", nombre: "Alice", esta_vivo: true, es_presidente: false, es_canciller: false, rol: null, inclinacion: null },
  { uid: "jugador2", nombre: "Bob", esta_vivo: true, es_presidente: false, es_canciller: false, rol: null, inclinacion: null },
  { uid: "jugador3", nombre: "Charlie", esta_vivo: true, es_presidente: false, es_canciller: false, rol: null, inclinacion: null },
  { uid: "jugador4", nombre: "Diana", esta_vivo: true, es_presidente: false, es_canciller: false, rol: null, inclinacion: null },
  { uid: "jugador5", nombre: "Ethan", esta_vivo: true, es_presidente: false, es_canciller: false, rol: null, inclinacion: null }
];

async function agregarJugadores() {
  try {
    for (const jugador of jugadores) {
      const ref = doc(db, "partidas", "1165", "jugadores", jugador.uid);
      await setDoc(ref, jugador);
      console.log(`Jugador ${jugador.nombre} agregado con UID ${jugador.uid}`);
    }
    console.log("Todos los jugadores fueron agregados exitosamente.");
  } catch (error) {
    console.error("Error al agregar jugadores:", error);
  }
}

agregarJugadores();
