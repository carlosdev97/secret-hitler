// src/firebase/auth.js
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile 
} from "firebase/auth";
import { db } from "./config";
import { doc, setDoc } from "firebase/firestore";

const auth = getAuth();

// Normaliza un nombre de usuario: primera letra mayúscula, resto minúsculas
function capitalizeUsername(username) {
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
}

export const AuthService = {
  /**
   * Registra un nuevo usuario en Firebase Auth y crea su perfil en Firestore.
   * @param {{ email: string, password: string, nombre: string }} param0
   */
  async register({ email, password, nombre }) {
    try {
      const displayName = capitalizeUsername(nombre);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Actualizar el displayName en el perfil de Auth
      await updateProfile(cred.user, { displayName });
      // Crear perfil en Firestore
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        uid: cred.user.uid,
        correo: email,
        nombre: displayName,
        createdAt: new Date().toISOString()
      });
      return { success: true, user: cred.user };
    } catch (e) {
      const messages = {
        "auth/email-already-in-use": "Este correo ya está registrado",
        "auth/invalid-email":       "Correo inválido",
        "auth/weak-password":       "La contraseña debe tener al menos 6 caracteres"
      };
      return { success: false, error: messages[e.code] || "Error al registrarse" };
    }
  },

  /**
   * Inicia sesión con email y contraseña.
   * @param {{ email: string, password: string }} param0
   */
  async login({ email, password }) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: cred.user };
    } catch (e) {
      const messages = {
        "auth/user-not-found": "Usuario no existe",
        "auth/wrong-password": "Contraseña incorrecta"
      };
      return { success: false, error: messages[e.code] || "Error al iniciar sesión" };
    }
  },

  /** Cierra la sesión del usuario actual. */
  async logout() {
    await signOut(auth);
  },

  /** Devuelve el usuario autenticado, o null si no hay sesión. */
  getCurrentUser() {
    return auth.currentUser;
  }
};
