// composables/usePresidente.js
import { ref, onUnmounted, watchEffect } from 'vue';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config'; // cambia la ruta según tu proyecto

export function usePresidente(partidaId) {
  const presidenteId = ref(null);
  let unsub = null;

  watchEffect((onCleanup) => {
    if (!partidaId) {
      presidenteId.value = null;
      return;
    }

    unsub = onSnapshot(doc(db, "partidas", partidaId), (docSnap) => {
      if (docSnap.exists()) {
        presidenteId.value = docSnap.data()?.turnoActual?.presidenteId || null;
      }
    });

    onCleanup(() => {
      if (unsub) {
        unsub();
        unsub = null;
      }
    });
  });

  return { presidenteId };
}
