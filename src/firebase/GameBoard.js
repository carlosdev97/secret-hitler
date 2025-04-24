import { getFirestore, doc, updateDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, auth } from "./config"; // Usa las instancias inicializadas desde config.js
import Swal from "sweetalert2";

// Función para rotar presidente
export async function rotarPresidente(partidaId) {
  try {
    // 1. Obtener jugadores vivos ordenados por turno
    const jugadoresRef = collection(db, `partidas/${partidaId}/jugadores`);
    const q = query(jugadoresRef, where("estaVivo", "==", true));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) throw new Error("No hay jugadores vivos");

    const jugadores = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => a.ordenTurno - b.ordenTurno);

    // 2. Obtener partida actual
    const partidaRef = doc(db, "partidas", partidaId);
    const partidaSnap = await getDoc(partidaRef);
    if (!partidaSnap.exists()) throw new Error("Partida no existe");

    const presidenteActualId = partidaSnap.data().turnoActual?.presidenteId;

    // 3. Determinar siguiente presidente
    let siguientePresidente;
    if (!presidenteActualId) {
      siguientePresidente = jugadores.find(j => j.ordenTurno === 1);
    } else {
      const currentIndex = jugadores.findIndex(j => j.id === presidenteActualId);
      const nextIndex = (currentIndex + 1) % jugadores.length;
      siguientePresidente = jugadores[nextIndex];
    }

    // 4. Actualizar con batch
    const batch = writeBatch(db);

    // Resetear todos los presidentes
    jugadores.forEach(jugador => {
      const jugadorRef = doc(db, `partidas/${partidaId}/jugadores`, jugador.id);
      batch.update(jugadorRef, { esPresidente: false });
    });

    // Asignar nuevo presidente
    const nuevoPresidenteRef = doc(db, `partidas/${partidaId}/jugadores`, siguientePresidente.id);
    batch.update(nuevoPresidenteRef, { esPresidente: true });

    // Actualizar estado de partida
    batch.update(partidaRef, {
      "turnoActual.presidenteId": siguientePresidente.id,
      "turnoActual.cancillerId": null,
      "turnoActual.fase": "nominacion"
    });

    await batch.commit();

    return {
      success: true,
      nuevoPresidente: siguientePresidente.nombre,
      ordenTurno: siguientePresidente.ordenTurno
    };

  } catch (error) {
    console.error("Error al rotar presidente:", error);
    return { success: false, error: error.message };
  }
}

// Función para distribuir roles
export async function distribuirRoles(partidaId) {
  try {
    const jugadoresRef = collection(db, `partidas/${partidaId}/jugadores`);
    const jugadoresSnap = await getDocs(jugadoresRef);
    const jugadores = jugadoresSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const numJugadores = jugadores.length;
    const roles = [];
    
    // 1 Hitler
    roles.push({ rol: "Hitler", inclinacion: "Fascista" });
    
    // Resto de fascistas
    const numFascistas = Math.floor((numJugadores - 1) / 2);
    for (let i = 1; i < numFascistas; i++) {
      roles.push({ rol: "Fascista", inclinacion: "Fascista" });
    }
    
    // Liberales
    const numLiberales = numJugadores - numFascistas;
    for (let i = 0; i < numLiberales; i++) {
      roles.push({ rol: "Liberal", inclinacion: "Liberal" });
    }
    
    // Mezclar roles
    const rolesMezclados = roles.sort(() => Math.random() - 0.5);

    // Asignar roles a jugadores
    const batch = writeBatch(db);
    jugadores.forEach((jugador, index) => {
      const jugadorRef = doc(db, `partidas/${partidaId}/jugadores`, jugador.id);
      batch.update(jugadorRef, {
        rol: rolesMezclados[index].rol,
        inclinacion: rolesMezclados[index].inclinacion
      });
    });

    await batch.commit();
    return { success: true };

  } catch (error) {
    console.error("Error al distribuir roles:", error);
    return { success: false, error: error.message };
  }
}

// Función para iniciar partida
export async function iniciarPartida(partidaId) {
  try {
    // 1. Distribuir roles
    const distribucion = await distribuirRoles(partidaId);
    if (!distribucion.success) throw new Error(distribucion.error);

    // 2. Asignar primer presidente aleatorio
    const jugadoresRef = collection(db, `partidas/${partidaId}/jugadores`);
    const jugadoresSnap = await getDocs(jugadoresRef);
    const jugadores = jugadoresSnap.docs.map(doc => doc.id);
    
    const primerPresidenteId = jugadores[Math.floor(Math.random() * jugadores.length)];
    
    const batch = writeBatch(db);
    
    // Actualizar partida
    const partidaRef = doc(db, "partidas", partidaId);
    batch.update(partidaRef, {
      estado: "en_progreso",
      "turnoActual.presidenteId": primerPresidenteId,
      "turnoActual.fase": "nominacion"
    });
    
    // Actualizar jugador
    const presidenteRef = doc(db, `partidas/${partidaId}/jugadores`, primerPresidenteId);
    batch.update(presidenteRef, { esPresidente: true });
    
    await batch.commit();
    return { success: true };

  } catch (error) {
    console.error("Error al iniciar partida:", error);
    return { success: false, error: error.message };
  }
}