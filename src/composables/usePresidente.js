// composables/usePresidente.js
import { ref, onUnmounted } from 'vue';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config'; // cambia la ruta según tu proyecto

export function usePresidente(partidaId) {
  const presidenteId = ref(null);

  const unsub = onSnapshot(doc(db, "partidas", partidaId), (docSnap) => {
    if (docSnap.exists()) {
      presidenteId.value = docSnap.data()?.turnoActual?.presidenteId || null;
    }
  });

  onUnmounted(() => unsub());

  return { presidenteId };
}
