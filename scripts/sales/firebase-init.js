    // /**
    //  * firebase-init.js
    //  * Menginisialisasi Firebase dan mengekspor instance layanan.
    //  * * !!! TUGAS ANDA !!!
    //  * Ganti placeholder di bawah ini dengan objek konfigurasi Firebase Anda
    //  * dari konsol Firebase.
    //  */
    // import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
    // import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
    // import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

    // // TODO: Ganti dengan konfigurasi proyek Firebase Anda
    // const firebaseConfig = {
    //     apiKey: "AIzaSyDVD0YkMhVt_7QQS0KxdMt0mppJRJRtz0s",
    //     authDomain: "generator-dokumen.firebaseapp.com",
    //     projectId: "generator-dokumen",
    //     storageBucket: "generator-dokumen.firebasestorage.app",
    //     messagingSenderId: "983531274893",
    //     appId: "1:983531274893:web:16ae856b1d8648769858c4",
    //     measurementId: "G-S6ML8TFWYJ"
    // };


    // // Inisialisasi Firebase
    // const app = initializeApp(firebaseConfig);

    // // Ekspor instance layanan yang akan digunakan di seluruh aplikasi
    // export const db = getFirestore(app);
    // export const auth = getAuth(app);
    
    /**
 * firebase-init.js (VERSI ADAPTASI)
 * File ini tidak lagi menginisialisasi Firebase.
 * Sebaliknya, ia mengekspor instance db dan auth yang sudah ada dari aplikasi utama.
 */

// Ambil instance yang sudah diinisialisasi dari object window
const db = window.erpShared.db;
const auth = window.erpShared.auth;

// Ekspor instance tersebut agar file lain (store.js, main.js) bisa menggunakannya
export { db, auth };
