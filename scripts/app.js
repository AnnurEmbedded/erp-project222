// app.js (Main Entry Point)
// Versi 3.1: Path & Initialization Fix
// Memastikan semua modul diimpor dengan path yang benar dan
// alur inisialisasi aplikasi sudah solid.

import { setupAuthStateListener } from './modules/auth-module.js';
import { initializeUI, navigateTo } from './modules/ui-module.js';
import { state } from './modules/state-module.js';
import { listenForDataChanges, fetchAllUsers } from './modules/data-module.js';

/**
 * @function initializeApp
 * @description Fungsi utama untuk menginisialisasi seluruh aplikasi.
 */
function initializeApp() {
    setupAuthStateListener(async (user) => {
        if (user && state.currentUser) {
            // Inisialisasi UI utama aplikasi.
            await initializeUI();
            
            // Ambil semua data awal yang diperlukan.
            await fetchAllUsers();
            listenForDataChanges();

            // Tentukan halaman default berdasarkan peran pengguna.
            const defaultPage = state.currentUser.role === 'Super Admin' ? 'superadmin' : 'dashboard';
            
            // Arahkan pengguna ke halaman default mereka.
            navigateTo(defaultPage);
        }
        // Jika tidak ada user, auth-module akan mengarahkan ke login.html
    });
}

// Jalankan aplikasi.
initializeApp();
