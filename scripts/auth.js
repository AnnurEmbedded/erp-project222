// --- FIREBASE SDK IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- FIREBASE CONFIGURATION (Sama seperti di app.js) ---
const firebaseConfig = {
    apiKey: "AIzaSyDVD0YkMhVt_7QQS0KxdMt0mppJRJRtz0s",
    authDomain: "generator-dokumen.firebaseapp.com",
    projectId: "generator-dokumen",
    storageBucket: "generator-dokumen.firebasestorage.app",
    messagingSenderId: "983531274893",
    appId: "1:983531274893:web:d013e5ecddb4b8799858c4"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- DOM ELEMENTS ---
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const errorEl = document.getElementById('auth-error');

// --- EVENT LISTENERS ---

// Beralih ke form registrasi
showRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    errorEl.textContent = '';
});

// Beralih ke form login
showLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    errorEl.textContent = '';
});

// Handler untuk form login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Jika berhasil, Firebase akan mengarahkan ke index.html secara otomatis
        // melalui onAuthStateChanged di app.js
        window.location.href = 'index.html';
    } catch (error) {
        errorEl.textContent = getFriendlyErrorMessage(error.code);
    }
});

// Handler untuk form registrasi
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Set nama pengguna
        await updateProfile(userCredential.user, {
            displayName: name
        });

        // Kirim email verifikasi
        await sendEmailVerification(userCredential.user);

        alert('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi sebelum login.');
        
        // Arahkan ke halaman login setelah registrasi
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');

    } catch (error) {
        errorEl.textContent = getFriendlyErrorMessage(error.code);
    }
});

// Fungsi untuk pesan error yang lebih ramah
function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Email atau password salah.';
        case 'auth/email-already-in-use':
            return 'Email ini sudah terdaftar.';
        case 'auth/weak-password':
            return 'Password harus terdiri dari minimal 6 karakter.';
        case 'auth/invalid-email':
            return 'Format email tidak valid.';
        default:
            return 'Terjadi kesalahan. Silakan coba lagi.';
    }
}
