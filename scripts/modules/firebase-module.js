// firebase-module.js
// Modul ini bertanggung jawab untuk inisialisasi Firebase
// dan mengekspor instance layanan yang dibutuhkan.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// BUG FIX: Menambahkan 'collection' dari firestore.
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- FIREBASE CONFIGURATION ---
// Konfigurasi ini diambil dari Firebase project Anda.
const firebaseConfig = {
    apiKey: "AIzaSyDVD0YkMhVt_7QQS0KxdMt0mppJRJRtz0s",
    authDomain: "generator-dokumen.firebaseapp.com",
    projectId: "generator-dokumen",
    storageBucket: "generator-dokumen.firebasestorage.app",
    messagingSenderId: "983531274893",
    appId: "1:983531274893:web:d013e5ecddb4b8799858c4"
};

// Inisialisasi aplikasi Firebase.
const app = initializeApp(firebaseConfig);

// Inisialisasi layanan Firestore dan Authentication.
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- COLLECTION REFERENCES ---
// Membuat referensi ke koleksi-koleksi di Firestore untuk digunakan di modul lain.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-project-erp';

export const collections = {
    users: collection(db, `artifacts/${appId}/users`),
    projects: collection(db, `artifacts/${appId}/public/data/projects`),
    tasks: collection(db, `artifacts/${appId}/public/data/tasks`),
    comments: collection(db, `artifacts/${appId}/public/data/comments`),
};
