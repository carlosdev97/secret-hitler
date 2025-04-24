// src/composables/useLogin.js
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config.js';
import Swal from 'sweetalert2';

export function useLogin() {
    const email = ref('');
    const password = ref('');
    const router = useRouter();

    const handleAuthError = (error) => {
        console.error("Error al iniciar sesión:", error.message);
        alert("Error al iniciar sesión: " + error.message);
    };

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
            console.log("Usuario autenticado:", userCredential.user);
            Swal.fire({
                title: '¡Bienvenido!',
                text: 'Has iniciado sesión correctamente.',
                icon: 'success',
                confirmButtonText: 'Continuar'
            }).then(() => {
                router.push("/create-Game");
            });
        } catch (error) {
            handleAuthError(error);
        }
    };

    return { 
        email, 
        password, 
        handleLogin 
    };
}