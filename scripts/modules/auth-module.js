// File: scripts/modules/auth-module.js
// Deskripsi: File ini SEKARANG menjadi satu-satunya sumber kebenaran untuk SEMUA logika otentikasi.
// - Menggabungkan fungsionalitas dari 'scripts/auth.js'.
// - Menyediakan fungsi terpusat untuk login, logout, dan memeriksa status otentikasi.

import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase-module.js"; // Mengimpor instance auth yang sudah diinisialisasi

const authModule = (() => {
    // Fungsi untuk menangani proses login pengguna
    const handleLogin = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("User logged in successfully:", userCredential.user);
                return { success: true, user: userCredential.user };
            })
            .catch((error) => {
                console.error("Login error:", error.message);
                return { success: false, error: error.message };
            });
    };

    // Fungsi untuk menangani proses logout pengguna
    const handleLogout = () => {
        return signOut(auth)
            .then(() => {
                console.log("User logged out successfully.");
                return { success: true };
            })
            .catch((error) => {
                console.error("Logout error:", error.message);
                return { success: false, error: error.message };
            });
    };

    // Fungsi untuk memeriksa status otentikasi pengguna saat aplikasi dimuat
    // dan setiap kali status berubah.
    const checkAuthState = (callback) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Pengguna sedang login
                console.log("Auth state changed: User is logged in.", user.uid);
                callback({ loggedIn: true, user: user });
            } else {
                // Pengguna tidak login
                console.log("Auth state changed: User is logged out.");
                callback({ loggedIn: false });
            }
        });
    };

    return {
        login: handleLogin,
        logout: handleLogout,
        observeAuthChanges: checkAuthState,
    };
})();

export default authModule;