import { db } from "./config";
import { doc, updateDoc, collection, query, where, getDoc, getDocs, writeBatch, setDoc, increment } from "firebase/firestore";
import Swal from "sweetalert2";
import { ref, onUnmounted } from 'vue';
import { getFirestore, onSnapshot } from 'firebase/firestore';
/**
 * Asigna el siguiente presidente basado en el orden de turno
 * @param {string} partidaId - ID de la partida
 * @returns {Promise<{success: boolean, nuevoPresidente?: string, ordenTurno?: number, error?: string}>}
 */
export async function rotarPresidente(partidaId) {
    try {
        // 1. Obtener todos los jugadores vivos ordenados por turno
        const jugadoresRef = collection(db, `partidas/${partidaId}/jugadores`);
        const q = query(jugadoresRef, where("esta_vivo", "==", true));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error("No hay jugadores vivos en la partida");
        }

        const jugadores = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a, b) => a.ordenTurno - b.ordenTurno);

        // 2. Obtener partida actual
        const partidaRef = doc(db, "partidas", partidaId);
        const partidaSnap = await getDoc(partidaRef);
        if (!partidaSnap.exists()) throw new Error("Partida no existe");

        const presidenteActualId = partidaSnap.data().turno_jugador_id;

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
            batch.update(jugadorRef, { es_presidente: false });
        });

        // Asignar nuevo presidente
        const nuevoPresidenteRef = doc(db, `partidas/${partidaId}/jugadores`, siguientePresidente.id);
        batch.update(nuevoPresidenteRef, { 
            es_presidente: true,
            es_canciller: false
        });

        // Actualizar estado de partida
        batch.update(partidaRef, {
            turno_jugador_id: siguientePresidente.id,
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
        return { success: false, error: error.message };
    }
}

/**
 * Termina el turno actual y asigna el siguiente presidente
 * @param {string} partidaId - ID de la partida
 */
export async function terminarTurno(partidaId) {
    const { success, error } = await rotarPresidente(partidaId);
    if (!success) {
        throw new Error(error || "Error al terminar turno");
    }
}

export async function postularCanciller(partidaId, presidenteId, candidatoId) {
    try {
        const partidaRef = doc(db, "partidas", partidaId);
        const partidaSnap = await getDoc(partidaRef);
        if (!partidaSnap.exists()) throw new Error("La partida no existe.");

        // Verificar que quien postula es el presidente actual
        const presidenteRef = doc(db, `partidas/${partidaId}/jugadores`, presidenteId);
        const presidenteSnap = await getDoc(presidenteRef);
        if (!presidenteSnap.exists() || !presidenteSnap.data().es_presidente) {
            throw new Error("Solo el presidente actual puede postular al canciller.");
        }

        // Obtener lista de jugadores vivos
        const jugadoresRef = collection(db, `partidas/${partidaId}/jugadores`);
        const vivosQuery = query(jugadoresRef, where("esta_vivo", "==", true));
        const vivosSnap = await getDocs(vivosQuery);

        const jugadoresVivos = vivosSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Validar que el candidato es válido
        const esValido = jugadoresVivos.some(j => j.id === candidatoId && j.id !== presidenteId);
        if (!esValido) {
            throw new Error("El jugador seleccionado no es válido para ser canciller.");
        }

        // Actualizar estado con la nueva estructura
        const partidaUpdate = {
            turno_jugador_id: presidenteId,
            "turnoActual.presidenteId": presidenteId,
            "turnoActual.id_canciller_postulado": candidatoId,
            "turnoActual.fase": "votacion",
        };

        await updateDoc(partidaRef, partidaUpdate);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export const registrarVoto = async (partidaId, jugadorId, voto) => {
  try {
    // Referencia al documento estado en la subcolección tablero
    const estadoRef = doc(db, `partidas/${partidaId}/tablero/estado`);
    const estadoDoc = await getDoc(estadoRef);

    if (!estadoDoc.exists()) {
      return { success: false, error: "No existe el documento estado en tablero" };
    }

    const data = estadoDoc.data();
    // Verifica si ya votó
    if (data.votacion?.votos?.[jugadorId]) {
      return { success: false, error: "El jugador ya ha votado" };
    }

    // Actualiza solo el voto de este jugador
    await updateDoc(estadoRef, {
      [`votacion.votos.${jugadorId}`]: voto,
      "votacion.completada": false
    });
  
    return { success: true };

  } catch (error) {
    return { success: false, error: error.message };
  }
};
  
// Función para contar votos
export function contarVotos(votos) {
    const totalVotos = Object.keys(votos).length;
    const votosJa = Object.values(votos).filter(v => v === "Ja").length;
    const votosNein = totalVotos - votosJa;
    
    // En caso de empate, la votación es rechazada
    if (votosJa === votosNein) {
        return false;
    }
    
    return votosJa > votosNein;
}
  
// Función para verificar si todos han votado
export async function verificarVotacionCompleta(partidaId) {
    try {
        // Referencia al documento estado en la subcolección tablero
        const estadoRef = doc(db, `partidas/${partidaId}/tablero/estado`);
        const estadoSnap = await getDoc(estadoRef);
        
        if (!estadoSnap.exists()) {
            throw new Error("No existe el documento estado en tablero");
        }

        const data = estadoSnap.data();
        const votos = data.votacion?.votos || {};
        
        // Obtener jugadores vivos directamente de la colección
        const jugadoresRef = collection(db, `partidas/${partidaId}/jugadores`);
        const vivosQuery = query(jugadoresRef, where("esta_vivo", "==", true));
        const vivosSnap = await getDocs(vivosQuery);
        const jugadoresVivos = vivosSnap.size;
        
        const todosHanVotado = Object.keys(votos).length === jugadoresVivos;
        
        // Si todos han votado, actualizar el estado
        if (todosHanVotado) {
            await updateDoc(estadoRef, {
                "votacion.completada": true
            });
        }
        
        return todosHanVotado;
    } catch (error) {
        return false;
    }
}

export async function actualizarCanciller(partidaId, cancillerId) {
    try {
        const batch = writeBatch(db);
        
        // 1. Resetear todos los cancilleres
        const jugadoresRef = collection(db, `partidas/${partidaId}/jugadores`);
        const jugadoresSnap = await getDocs(jugadoresRef);
        jugadoresSnap.docs.forEach(doc => {
            batch.update(doc.ref, { es_canciller: false });
        });

        // 2. Asignar nuevo canciller
        const nuevoCancillerRef = doc(db, `partidas/${partidaId}/jugadores`, cancillerId);
        batch.update(nuevoCancillerRef, { es_canciller: true });

        // 3. Actualizar estado de la partida en la subcolección tablero
        const estadoRef = doc(db, `partidas/${partidaId}/tablero/estado`);
        const actualRef = doc(db, `partidas/${partidaId}`);
        batch.update(estadoRef, {
            "votacion": {}
        });
        batch.update(actualRef, {
            "turnoActual.id_canciller_postulado": null,
            "turnoActual.cancillerId": cancillerId,
            "turnoActual.fase": "legislacion"
        }); 
        
        await batch.commit();
        return { success: true };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Función para manejar el caso de votación rechazada
async function rechazado(partidaId) {
    try {
        const batch = writeBatch(db);

        // Referencia al documento estado
        const estadoRef = doc(db, `partidas/${partidaId}/tablero/estado`);
        const partidaRef = doc(db, `partidas/${partidaId}`);
        
        // Actualizar estado
        batch.update(estadoRef, {
            "votacion": {},
        });

        batch.update(partidaRef, {
            "turnoActual.id_canciller_postulado": null,
            "fallos_consecutivos": increment(1),
            "id_canciller_postulado": null
        }); 

        // Aplicar cambios
        await batch.commit();

        // Rotar presidente
        const { success, error } = await rotarPresidente(partidaId);
        if (!success) {
            throw new Error(error || "Error al rotar presidente");
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function manejarResultadoVotacion(partidaId, aprobado, candidatoId) {
    try {
        const batch = writeBatch(db);

        // Referencia al documento estado en la subcolección tablero
        const estadoRef = doc(db, `partidas/${partidaId}/tablero/estado`);
        const estadoSnap = await getDoc(estadoRef);
        
        if (!estadoSnap.exists()) {
            throw new Error("No existe el documento estado en tablero");
        }

        const data = estadoSnap.data();

        // Verificar que la votación está completada
        if (!data.votacion?.completada) {
            throw new Error("La votación no está completada");
        }

        if (aprobado) {
            const { success, error } = await actualizarCanciller(partidaId, candidatoId);
            if (!success) {
                throw new Error(error || "Error al asignar canciller");
            }
        } else {
            const { success, error } = await rechazado(partidaId);
            if (!success) {
                throw new Error(error || "Error al procesar rechazo de votación");
            }
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}




