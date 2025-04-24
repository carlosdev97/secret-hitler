
import { reactive, onUnmounted } from "vue";
import { doc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";

export function useGame(gameId) {
  // Estado reactivo único para la partida
  const state = reactive({
    info: null, // datos de partidas/{gameId}
    players: [], // lista de jugadores
    board: null, // documento tablero/estado
  });

  // 1) Suscripción a la partida
  const unsubInfo = onSnapshot(doc(db, "partidas", gameId), (snap) => {
    if (snap.exists()) state.info = snap.data();
  });

  // 2) Suscripción a la subcolección de jugadores
  const unsubPlayers = onSnapshot(
    collection(db, "partidas", gameId, "jugadores"),
    (snap) => {
      state.players = snap.docs.map((d) => d.data());
    }
  );

  // 3) Suscripción al estado del tablero
  const unsubBoard = onSnapshot(
    doc(db, "partidas", gameId, "tablero", "estado"),
    (snap) => {
      if (snap.exists()) state.board = snap.data();
    }
  );

  // Limpiar listeners al desmontar el componente
  onUnmounted(() => {
    unsubInfo();
    unsubPlayers();
    unsubBoard();
  });

  return state;
}
