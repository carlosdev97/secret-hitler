// src/firebase/CreateGame.js

import { db, auth } from "./config";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import Swal from "sweetalert2";

// Genera un código de 4 dígitos
const generarCodigo = () => Math.floor(1000 + Math.random() * 9000).toString();

// Estado reactivo de la partida
const game = {
  codigo: "",
  participantes: [],
  estado: "No iniciada",
  configuracion: {
    maxJugadores: 10,
    minJugadores: 1,
  },
};

// Escucha cambios en Firestore y actualiza `game`
// redirectCallback ahora recibe un objeto para router.push()
function escucharCambios(codigo, redirectCallback) {
  const partidaRef = doc(db, "partidas", codigo);

  onSnapshot(partidaRef, (docSnap) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    game.estado = data.estado;

    if (data.estado === "iniciada" && typeof redirectCallback === "function") {
      localStorage.removeItem("codigoPartida");
      // Redirige usando la ruta nombrada y el parámetro id
      redirectCallback({ name: "GameRoom", params: { id: codigo } });
    }
  });

  onSnapshot(
    collection(db, `partidas/${codigo}/jugadores`),
    (querySnapshot) => {
      game.participantes = querySnapshot.docs.map((doc) => doc.data());
    }
  );
}

export function createGame(redirectCallback) {
  // Reconecta si había una partida en localStorage
  function onReconnect() {
    const codigoGuardado = localStorage.getItem("codigoPartida");
    if (codigoGuardado) {
      game.codigo = codigoGuardado;
      escucharCambios(codigoGuardado, redirectCallback);
    }
  }

  // Inicializa la partida en Firestore y arranca listeners
  async function inicializarJuego() {
    const user = auth.currentUser;
    if (!user) return;

    const userNombre = user.displayName || "Jugador";
    let nuevoCodigo = generarCodigo();
    let partidasRef = doc(db, "partidas", nuevoCodigo);

    try {
      // Evita colisiones de código
      const partidaSnap = await getDoc(partidasRef);
      if (partidaSnap.exists()) {
        nuevoCodigo = generarCodigo();
        partidasRef = doc(db, "partidas", nuevoCodigo);
      }

      // 1) Crear documento de partida
      await setDoc(partidasRef, {
        codigo: nuevoCodigo,
        estado: "No iniciada",
        uidCreador: user.uid,
        usuarioCreador: userNombre,
        fallos_consecutivos: 0,
        
        ganador: null,
        turno_jugador_id: null,
        configuracion: game.configuracion,
      });

      // 2) Agregar creador como primer jugador
      const jugadorRef = doc(db, `partidas/${nuevoCodigo}/jugadores`, user.uid);
      await setDoc(jugadorRef, {
        uid: user.uid,
        nombre: userNombre,
        esta_vivo: true,
        es_presidente: false,
        es_canciller: false,
        rol: null,
        inclinacion: null,
      });

      // 3) Inicializar tablero
      const tableroRef = doc(db, `partidas/${nuevoCodigo}/tablero`, "estado");
      await setDoc(tableroRef, {
        leyes_fascistas: 0,
        leyes_liberales: 0,
        poderes_habilitados: [],
      });

      // 4) Actualizar estado local
      game.codigo = nuevoCodigo;
      game.participantes = [
        {
          uid: user.uid,
          nombre: userNombre,
          esta_vivo: true,
          rol: null,
          inclinacion: null,
        },
      ];

      // 5) Guardar para reconexión
      localStorage.setItem("codigoPartida", nuevoCodigo);

      // 6) Arrancar listeners
      escucharCambios(nuevoCodigo, redirectCallback);
    } catch (error) {
      console.error("Error al crear la partida:", error);
      Swal.fire(
        "Error",
        "No se pudo crear la partida. Inténtalo de nuevo.",
        "error"
      );
    }
  }

  // Inicia la partida: distribuye roles y asigna primer presidente
  async function iniciarPartida() {
    try {
      const confirmar = await Swal.fire({
        title: "¿Iniciar partida?",
        text: "Una vez iniciada, no podrás agregar más jugadores.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, iniciar",
        cancelButtonText: "Cancelar",
      });

      if (!confirmar.isConfirmed) return;

      const jugadoresSnapshot = await getDocs(
        collection(db, `partidas/${game.codigo}/jugadores`)
      );

      if (jugadoresSnapshot.size < game.configuracion.minJugadores) {
        Swal.fire(
          "Mínimo de jugadores no alcanzado",
          `Necesitas al menos ${game.configuracion.minJugadores} jugadores.`,
          "error"
        );
        return;
      }

      // Distribuir roles
      const numJugadores = jugadoresSnapshot.size;
      const roles = distribuirRoles(numJugadores);
      const jugadores = jugadoresSnapshot.docs.map((doc, i) => ({
        id: doc.id,
        ...doc.data(),
        rol: roles[i].rol,
        inclinacion: roles[i].inclinacion,
      }));

      // Actualizar roles en batch
      const batch = writeBatch(db);
      jugadores.forEach((j) => {
        const ref = doc(db, `partidas/${game.codigo}/jugadores`, j.id);
        batch.update(ref, { rol: j.rol, inclinacion: j.inclinacion });
      });

      // Primer presidente y mazo
      const primerPresidente =
        jugadores[Math.floor(Math.random() * jugadores.length)];
      const mazo = generarMazoCartas();
      const partidaRef = doc(db, "partidas", game.codigo);

      batch.update(partidaRef, {
        estado: "iniciada",
        turno_jugador_id: primerPresidente.id,
        mazo,
      });

      // Marcar presidente
      const presRef = doc(
        db,
        `partidas/${game.codigo}/jugadores`,
        primerPresidente.id
      );
      batch.update(presRef, { es_presidente: true });

      await batch.commit();
    } catch (error) {
      console.error("Error al iniciar la partida:", error);
      Swal.fire("Error", "No se pudo iniciar la partida.", "error");
    }
  }

  // Escucha jugadores con callback
  function escucharJugadores(codigo, callback) {
    return onSnapshot(collection(db, "partidas", codigo, "jugadores"), (snap) =>
      callback(snap.docs.map((d) => d.data()))
    );
  }
  async function joinGame(codigo) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado");
  
      // Verificar partida existe
      const partidaRef = doc(db, "partidas", codigo);
      const partidaSnap = await getDoc(partidaRef);
      if (!partidaSnap.exists()) {
        Swal.fire("Error", "El código de partida no existe", "error");
        return false;
      }
  
      // Añadir jugador
      const jugadorRef = doc(db, `partidas/${codigo}/jugadores`, user.uid);
      await setDoc(jugadorRef, {
        uid: user.uid,
        nombre: user.displayName || "Jugador",
        esta_vivo: true,
        es_presidente: false,
        es_canciller: false,
        rol: null,
        inclinacion: null
      });
  
      // Actualizar estado local y listeners
      game.codigo = codigo;
      localStorage.setItem("codigoPartida", codigo);
      escucharCambios(codigo, redirectCallback);
  
      return true;
    } catch (e) {
      console.error("joinGame error:", e);
      return false;
    }
  }
  // Reconexión al cargar
  onReconnect();

  return {
    game,
    inicializarJuego,
    iniciarPartida,
    escucharJugadores,
    joinGame,
  };
}

// Helper: distribuye roles según número de jugadores
function distribuirRoles(numJugadores) {
  const roles = [{ rol: "Hitler", inclinacion: "Fascista" }];
  const numFascistas = Math.floor((numJugadores - 1) / 2);
  for (let i = 1; i < numFascistas; i++) {
    roles.push({ rol: "Fascista", inclinacion: "Fascista" });
  }
  for (let i = 0; i < numJugadores - numFascistas; i++) {
    roles.push({ rol: "Liberal", inclinacion: "Liberal" });
  }
  return roles.sort(() => Math.random() - 0.5);
}

// Helper: genera mazo de políticas
function generarMazoCartas() {
  const mazo = Array(6).fill("liberal").concat(Array(11).fill("fascista"));
  return mazo.sort(() => Math.random() - 0.5);
}
