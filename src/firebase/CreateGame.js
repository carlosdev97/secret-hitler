import { db, auth } from "./config"; // Usa las instancias inicializadas desde config.js
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import Swal from "sweetalert2";

// El resto del código permanece igual...

export function createGame(redirectCallback) {
    const game = {
        codigo: "",
        participantes: [],
        estado: "No iniciada",
        configuracion: {
            maxJugadores: 10,
            minJugadores: 1
        }
    };

    const generarCodigo = () => Math.floor(1000 + Math.random() * 9000).toString();

    // Función para distribuir roles según el número de jugadores
    const distribuirRoles = (numJugadores) => {
        const roles = [];
        
        // Siempre hay 1 Hitler
        roles.push({ rol: "Hitler", inclinacion: "Fascista" });
        
        // Número de fascistas (incluyendo a Hitler)
        const numFascistas = Math.floor((numJugadores - 1) / 2);
        
        // Agregar fascistas (el primero es Hitler, los demás son fascistas normales)
        for (let i = 1; i < numFascistas; i++) {
            roles.push({ rol: "Fascista", inclinacion: "Fascista" });
        }
        
        // El resto son liberales
        const numLiberales = numJugadores - numFascistas;
        for (let i = 0; i < numLiberales; i++) {
            roles.push({ rol: "Liberal", inclinacion: "Liberal" });
        }
        
        // Mezclar los roles
        return roles.sort(() => Math.random() - 0.5);
    };

    const generarMazoCartas = () => {
        const mazo = [];

        // 6 cartas liberales
        for (let i = 0; i < 6; i++) {
            mazo.push("liberal");
        }

        // 11 cartas fascistas
        for (let i = 0; i < 11; i++) {
            mazo.push("fascista");
        }

        // Mezclar el mazo
        return mazo.sort(() => Math.random() - 0.5);
    };

    async function inicializarJuego() {
        const user = auth.currentUser;
        if (!user) return;

        const userNombre = user.displayName || "Jugador";
        let nuevoCodigo = generarCodigo();
        let partidasRef = doc(db, "partidas", nuevoCodigo);

        try {
            const partidaSnap = await getDoc(partidasRef);
            if (partidaSnap.exists()) {
                nuevoCodigo = generarCodigo();
                partidasRef = doc(db, "partidas", nuevoCodigo);
            }

            // Crear la partida con estructura inicial
            await setDoc(partidasRef, {
                codigo: nuevoCodigo,
                estado: "No iniciada",
                uidCreador: user.uid,
                usuarioCreador: userNombre,
                fallos_consecutivos: 0,
                ganador: null,
                turno_jugador_id: null,
                id_canciller_postulado: null,
                configuracion: game.configuracion
            });

            // Crear subcolección de jugadores
            const jugadorRef = doc(db, `partidas/${nuevoCodigo}/jugadores`, user.uid);
            await setDoc(jugadorRef, {
                uid: user.uid,
                nombre: userNombre,
                esta_vivo: true,
                es_presidente: false,
                es_canciller: false,
                // Rol e inclinación se asignarán al iniciar el juego
                rol: null,
                inclinacion: null
            });

            // Crear tablero inicial
            const tableroRef = doc(db, `partidas/${nuevoCodigo}/tablero`, "estado");
            await setDoc(tableroRef, {
                leyes_fascistas: 0,
                leyes_liberales: 0,
                poderes_habilitados: []
            });

            game.codigo = nuevoCodigo;
            game.participantes = [{
                uid: user.uid,
                nombre: userNombre,
                esta_vivo: true,
                rol: null,
                inclinacion: null
            }];

            // Guardar en localStorage
            localStorage.setItem("codigoPartida", nuevoCodigo);

            // Escuchar cambios
            escucharCambios(nuevoCodigo);

        } catch (error) {
            console.error("Error al crear la partida:", error);
            Swal.fire("Error", "No se pudo crear la partida. Inténtalo de nuevo.", "error");
        }
    }

    function escucharCambios(codigo) {
        const partidaRef = doc(db, "partidas", codigo);

        onSnapshot(partidaRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                game.estado = data.estado;

                if (data.estado === "iniciada" && typeof redirectCallback === "function") {
                    localStorage.removeItem("codigoPartida");
                    redirectCallback(`/partida/${codigo}`);
                }
            }
        });

        onSnapshot(collection(db, `partidas/${codigo}/jugadores`), (querySnapshot) => {
            game.participantes = querySnapshot.docs.map((doc) => doc.data());
        });
    }

    // Verificar si hay una partida en localStorage y reconectar
    function onReconnect() {
        const codigoGuardado = localStorage.getItem("codigoPartida");
        if (codigoGuardado) {
            game.codigo = codigoGuardado;
            escucharCambios(codigoGuardado);
        }
    }

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

            if (confirmar.isConfirmed) {
                const jugadoresSnapshot = await getDocs(
                    collection(db, `partidas/${game.codigo}/jugadores`)
                );
                
                // Verificar número mínimo de jugadores
                if (jugadoresSnapshot.size < game.configuracion.minJugadores) {
                    Swal.fire(
                        "Mínimo de jugadores no alcanzado",
                        `Necesitas al menos ${game.configuracion.minJugadores} jugadores para iniciar la partida.`,
                        "error"
                    );
                    return;
                }

                // Distribuir roles
                const roles = distribuirRoles(jugadoresSnapshot.size);
                const jugadores = jugadoresSnapshot.docs.map((doc, index) => ({
                    id: doc.id,
                    ...doc.data(),
                    rol: roles[index].rol,
                    inclinacion: roles[index].inclinacion
                }));

                // Actualizar jugadores con sus roles
                const batchUpdates = jugadores.map(jugador => {
                    const jugadorRef = doc(db, `partidas/${game.codigo}/jugadores`, jugador.id);
                    if (!game.codigo) {
                        console.error("El código de la partida no está definido.");
                        return;
                    }
                    return updateDoc(jugadorRef, {
                        rol: jugador.rol,
                        inclinacion: jugador.inclinacion
                    });
                });

                await Promise.all(batchUpdates);

                // Asignar primer presidente (aleatorio)
                const primerPresidente = jugadores[Math.floor(Math.random() * jugadores.length)];
                const partidaRef = doc(db, "partidas", game.codigo);
                const mazo = generarMazoCartas();

                await updateDoc(partidaRef, { 
                    estado: "iniciada",
                    turno_jugador_id: primerPresidente.id,
                    mazo: mazo
                });


                // Actualizar estado del presidente en la base de datos
                const presidenteRef = doc(db, `partidas/${game.codigo}/jugadores`, primerPresidente.id);
                await updateDoc(presidenteRef, { es_presidente: true });
            }
        } catch (error) {
            console.error("Error al iniciar la partida:", error);
            Swal.fire("Error", "No se pudo iniciar la partida.", "error");
        }
    }

    function escucharJugadores(codigo, callback) {
        const jugadoresRef = collection(db, "partidas", codigo, "jugadores");
        return onSnapshot(jugadoresRef, (snapshot) => {
            const jugadores = snapshot.docs.map((doc) => doc.data());
            callback(jugadores);
        });
    }

    // Inicializar reconexión al cargar
    onReconnect();

    return {
        game,
        inicializarJuego,
        iniciarPartida,
        escucharJugadores,
    };
}