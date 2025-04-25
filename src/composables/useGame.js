import { reactive, onUnmounted } from "vue";
import { doc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";

export function useGame(gameId) {
  console.log("Iniciando useGame con ID:", gameId);
  const cleanId = gameId.replace(':', '');
  console.log("ID limpio:", cleanId);
  
  // Estado reactivo único para la partida
  const state = reactive({
    info: null, // datos de partidas/{gameId}
    players: [], // lista de jugadores
    board: null, // documento tablero/estado
  });

  // 1) Suscripción a la partida
  const partidaRef = doc(db, "partidas", cleanId);
  console.log("Referencia a partida:", partidaRef.path);
  
  const unsubInfo = onSnapshot(partidaRef, (snap) => {
    console.log("Snapshot de partida recibido");
    if (snap.exists()) {
      state.info = { ...snap.data(), codigo: cleanId };
      console.log("Datos de partida:", state.info);
    } else {
      console.log("La partida no existe");
    }
  });

  // 2) Suscripción a la subcolección de jugadores
  const jugadoresRef = collection(db, "partidas", cleanId, "jugadores");
  console.log("Referencia a jugadores:", jugadoresRef.path);
  
  const unsubPlayers = onSnapshot(jugadoresRef, 
    (snap) => {
      console.log("Snapshot de jugadores recibido");
      console.log("Número de documentos:", snap.size);
      const jugadores = snap.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id
      }));
      state.players = jugadores;
      console.log("Jugadores actualizados en el estado:", state.players);
    },
    (error) => {
      console.error("Error en la suscripción a jugadores:", error);
    }
  );

  // 3) Suscripción al estado del tablero
  const tableroRef = doc(db, "partidas", cleanId, "tablero", "estado");
  console.log("Referencia a tablero:", tableroRef.path);
  
  const unsubBoard = onSnapshot(tableroRef, (snap) => {
    console.log("Snapshot de tablero recibido");
    if (snap.exists()) {
      state.board = snap.data();
      console.log("Datos del tablero:", state.board);
    } else {
      console.log("El tablero no existe");
    }
  });

  // Limpiar listeners al desmontar el componente
  onUnmounted(() => {
    unsubInfo();
    unsubPlayers();
    unsubBoard();
  });

  return state;
}
