// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPnmxOvqi96_YuHmgRA-9PQLt4vYBP88E",
  authDomain: "secrecthitler.firebaseapp.com",
  projectId: "secrecthitler",
  storageBucket: "secrecthitler.firebasestorage.app",
  messagingSenderId: "1038408309127",
  appId: "1:1038408309127:web:96b6396319a7e494eedb22",
  measurementId: "G-JVRWEEH389",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
