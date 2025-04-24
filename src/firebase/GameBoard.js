import { db } from "./config";
import { doc, updateDoc, collection, query, where, getDoc, getDocs, writeBatch } from "firebase/firestore";
import Swal from "sweetalert2";
import { ref, onUnmounted } from 'vue';
import { getFirestore, onSnapshot } from 'firebase/firestore';
/**
 * Asigna el siguiente presidente basado en el orden de turno
 * @param {string} partidaId - ID de la partida
 * @returns {Promise<{success: boolean, nuevoPresidente?: string, ordenTurno?: number, error?: string}>}
 */
export async function rotarPresidente(partidaId) {
    console.log("[DEBUG] Iniciando rotación de presidente...");
    try {
        
        // 1. Obtener todos los jugadores vivos ordenados por turno
        const jugadoresRef = collection(db, `partidas/${partidaId}/jugadores`);
        const q = query(jugadoresRef, where("esta_vivo", "==", true));
        const querySnapshot = await getDocs(q);

        console.log(`[DEBUG] Jugadores vivos encontrados: ${querySnapshot.size}`);
        
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

        console.log(`[DEBUG] Nuevo presidente asignado: ${siguientePresidente.nombre} (Turno ${siguientePresidente.ordenTurno})`);

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
        // Obtener datos de la partida
        const partidaRef = doc(db, "partidas", partidaId);
        const partidaSnap = await getDoc(partidaRef);
        if (!partidaSnap.exists()) throw new Error("La partida no existe.");

        const turnoActual = partidaSnap.data().turnoActual || {};

        // Verificar que quien postula es el presidente actual
        if (turnoActual.presidenteId !== presidenteId) {
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

        // Actualizar candidato a canciller
        const partidaUpdate = {
            "turnoActual.id_canciller_postulado": candidatoId

        };
        await updateDoc(partidaRef, partidaUpdate);

        // Marcar en el jugador
        const jugadorRef = doc(db, `partidas/${partidaId}/jugadores`, candidatoId);
        await updateDoc(jugadorRef, { es_canciller: true });

        console.log(`[DEBUG] Postulado como canciller: ${candidatoId}`);
        return { success: true };
    } catch (error) {
        console.error("Error al postular canciller:", error);
        return { success: false, error: error.message };
    }
}