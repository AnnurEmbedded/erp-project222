// state-module.js
// Modul ini berfungsi sebagai "single source of truth" atau pusat data
// untuk seluruh state (status) aplikasi.

// --- GLOBAL STATE & CONSTANTS ---

// Definisikan konstanta divisi yang digunakan di seluruh aplikasi.
export const DIVISIONS = ['Mekanikal', 'Elektrikal', 'Programming'];

// Inisialisasi state awal aplikasi.
// Semua data dinamis seperti pengguna, proyek, tugas, dll., disimpan di sini.
export let state = {
    currentUser: null,      // Data pengguna yang sedang login
    currentProject: null,   // ID proyek yang sedang dibuka
    users: [],              // Daftar semua pengguna dalam sistem
    projects: [],           // Daftar semua proyek
    tasks: [],              // Daftar tugas untuk proyek yang sedang dibuka
    allTasks: [],           // Daftar semua tugas dari semua proyek
    comments: [],           // Daftar komentar untuk tugas yang sedang dibuka
    
    // Fungsi untuk berhenti mendengarkan perubahan data di Firestore.
    // Ini penting untuk mencegah memory leak.
    unsubscribeProjects: () => {},
    unsubscribeTasks: () => {},
    unsubscribeAllTasks: () => {},
    unsubscribeComments: () => {},

    currentPage: null,      // Halaman yang sedang aktif
};

/**
 * @function_setState
 * @description Helper function to update the global state.
 * This is a simple way to manage state changes from different modules.
 * @param {object} newState - An object with the new state values.
 */
export function setState(newState) {
    // Menggabungkan state baru dengan state yang sudah ada.
    state = { ...state, ...newState };
}
