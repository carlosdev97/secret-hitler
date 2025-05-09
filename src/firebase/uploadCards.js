import { collection, addDoc, doc, setDoc, getDocs, writeBatch, query, where, orderBy, limit, updateDoc, getDoc, increment } from 'firebase/firestore';
import { db } from './config.js';

const cartasPolitica = [
  // Cartas Liberales (11)
  { id: '0', partido: 'liberal', estado: 'mazo' },
  { id: '1', partido: 'liberal', estado: 'mazo' },
  { id: '2', partido: 'liberal', estado: 'mazo' },
  { id: '3', partido: 'liberal', estado: 'mazo' },
  { id: '4', partido: 'liberal', estado: 'mazo' },
  { id: '5', partido: 'liberal', estado: 'mazo' },
  { id: '6', partido: 'liberal', estado: 'mazo' },
  { id: '7', partido: 'liberal', estado: 'mazo' },
  { id: '8', partido: 'liberal', estado: 'mazo' },
  { id: '9', partido: 'liberal', estado: 'mazo' },
  { id: '10', partido: 'liberal', estado: 'mazo' },
  
  // Cartas Fascistas (6)
  { id: '11', partido: 'fascista', estado: 'mazo' },
  { id: '12', partido: 'fascista', estado: 'mazo' },
  { id: '13', partido: 'fascista', estado: 'mazo' },
  { id: '14', partido: 'fascista', estado: 'mazo' },
  { id: '15', partido: 'fascista', estado: 'mazo' },
  { id: '16', partido: 'fascista', estado: 'mazo' }
];

export async function subirCartasAPartida(partidaId) {
  try {
    // Referencia a la colección mazo directamente en la partida
    const mazoRef = collection(db, `partidas/${partidaId}/mazo`);
    
    // Subir cada carta como un documento individual
    for (const carta of cartasPolitica) {
      const cartaRef = doc(mazoRef, carta.id);
      await setDoc(cartaRef, {
        partido: carta.partido,
        estado: carta.estado
      });
    }
    
    console.log('Cartas subidas exitosamente a la partida:', partidaId);
    return { success: true };
  } catch (error) {
    console.error('Error al subir las cartas:', error);
    return { success: false, error: error.message };
  }
}

// Función para obtener las primeras 3 cartas del mazo para el presidente
export async function obtenerCartasParaPresidente(partidaId) {
  try {
    const mazoRef = collection(db, `partidas/${partidaId}/mazo`);
    const q = query(mazoRef, where("estado", "==", "mazo"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error("No hay suficientes cartas en el mazo");
    }
    
    // Obtener todas las cartas del mazo primero
    const todasLasCartas = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Mezclar las cartas usando Fisher-Yates shuffle
    const cartas = [...todasLasCartas];
    for (let i = cartas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
    }

    // Tomar las primeras 3 cartas mezcladas
    return cartas.slice(0, 3);
  } catch (error) {
    console.error('Error al obtener cartas para presidente:', error);
    throw error;
  }
}






// Función para que el presidente descarte una carta
export async function presidenteDescartarCarta(partidaId, cartas, cartaIdSeleccionada) {
  try {
    const mazoRef = collection(db, `partidas/${partidaId}/mazo`);
    const faseRef = doc(db, `partidas/${partidaId}`);

    
    // Encontrar la carta seleccionada en el array
    const cartaSeleccionada = cartas.find(carta => carta.id === cartaIdSeleccionada);
    if (!cartaSeleccionada) {
      throw new Error("Carta seleccionada no encontrada");
    }

    // Actualizar el estado de la carta seleccionada
    const cartaRef = doc(mazoRef, cartaIdSeleccionada);
    await updateDoc(cartaRef, {
      estado: 'descartada'
    });

    // Actualizar el estado de la fase
    await updateDoc(faseRef, {
      "turnoActual.fase": "legislacion_canciller"
    });

    // Filtrar las cartas restantes (las que no son la seleccionada)
    const cartasRestantes = cartas.filter(carta => carta.id !== cartaIdSeleccionada);

    // Actualizar el estado de las cartas restantes
    const batch = writeBatch(db);
    cartasRestantes.forEach(carta => {
      const cartaRef = doc(mazoRef, carta.id);
      batch.update(cartaRef, {
        estado: 'disponible'
      });
    });
    await batch.commit();

    return cartasRestantes;
  } catch (error) {
    console.error('Error al descartar carta del presidente:', error);
    throw error;
  }
}

// Función para obtener las 2 cartas restantes para el canciller
export async function obtenerCartasParaCanciller(partidaId) {
  try {
    const mazoRef = collection(db, `partidas/${partidaId}/mazo`);
    const q = query(mazoRef, 
      where("estado", "==", "disponible")
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error("No hay cartas disponibles para el canciller");
    }
    
    const cartas = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Marcar las cartas como en mano del canciller
    const batch = writeBatch(db);
    cartas.forEach(carta => {
      const cartaRef = doc(mazoRef, carta.id);
      batch.update(cartaRef, { estado: 'en_mano_del_canciller' });
    });
    await batch.commit();

    return cartas;
  } catch (error) {
    console.error('Error al obtener cartas para canciller:', error);
    throw error;
  }
}

// Función para que el canciller descarte una carta
export async function cancillerDescartarCarta(partidaId, cartaId) {
  try {
    const mazoRef = collection(db, `partidas/${partidaId}/mazo`);
    const cartaRef = doc(mazoRef, cartaId);
    
    // Marcar la carta como descartada
    await updateDoc(cartaRef, { estado: 'descartada' });
    
    // Obtener la carta restante que está en mano del canciller
    const q = query(mazoRef, 
      where("estado", "==", "en_mano_del_canciller")
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error("No hay carta restante para promulgar");
    }
    
    const cartaRestante = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };

    return cartaRestante;
  } catch (error) {
    console.error('Error al descartar carta del canciller:', error);
    throw error;
  }
}

// Función para promulgar la carta elegida
export async function promulgarCarta(partidaId, cartaId) {
  try {
    const batch = writeBatch(db);
    
    // Get the card reference and data
    const cartaRef = doc(db, `partidas/${partidaId}/mazo`, cartaId);
    const cartaSnap = await getDoc(cartaRef);
    if (!cartaSnap.exists()) {
      throw new Error('Carta no encontrada');
    }
    const cartaData = cartaSnap.data();
    
    // Update card state
    batch.update(cartaRef, { estado: 'promulgada' });
    
    // Get the board reference
    const tableroRef = doc(db, `partidas/${partidaId}/tablero/estado`);
    
    // Increment the appropriate counter based on the card's party
    if (cartaData.partido === 'liberal') {
      batch.update(tableroRef, {
        leyes_liberales: increment(1)
      });
    } else if (cartaData.partido === 'fascista') {
      batch.update(tableroRef, {
        leyes_fascistas: increment(1)
      });
    }
    
    // Commit all changes
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error al promulgar carta:', error);
    return { success: false, error: error.message };
  }
}


