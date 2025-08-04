// auth-module.js
// Modul ini menangani semua logika yang berkaitan dengan otentikasi pengguna.

import { onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, collections } from './firebase-module.js';
import { setState } from './state-module.js';

const appContainer = document.getElementById('app-container');

/**
 * @function setupAuthStateListener
 * @description Sets up the primary listener for authentication state changes.
 * @param {function} onUserAuthenticated - Callback function to run when user is logged in.
 */
export function setupAuthStateListener(onUserAuthenticated) {
    onAuthStateChanged(auth, async (user) => {
        const loadingOverlay = document.getElementById('loading-overlay');
        try {
            if (user) {
                // WORKAROUND: Bypassing email verification for development.
                // if (user.emailVerified) {
                    const userProfile = await fetchOrCreateUserProfile(user);
                    setState({ currentUser: userProfile });
                    onUserAuthenticated(user);
                // } else {
                //     showVerificationMessage(user);
                // }
            } else {
                setState({ currentUser: null });
                window.location.replace('login.html');
            }
        } catch (error) {
            console.error("Authentication Error:", error);
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            appContainer.innerHTML = `<div class="text-center p-8 text-red-500"><h2>Error</h2><p>${error.message}</p><a href="login.html">Login</a></div>`;
        }
    });
}

/**
 * @function fetchOrCreateUserProfile
 * @description Fetches user profile from Firestore or creates a new one if it doesn't exist.
 * @param {object} user - The Firebase user object.
 * @returns {object} The user profile data.
 */
async function fetchOrCreateUserProfile(user) {
    const userRef = doc(collections.users, user.uid);
    let userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        const isFirstUser = (await getDocs(query(collections.users))).empty;
        const newUser = {
            name: user.displayName || `User ${user.uid.substring(0, 5)}`,
            email: user.email,
            role: isFirstUser ? 'Super Admin' : 'Member',
            division: 'Mekanikal',
            avatar: user.photoURL || `https://placehold.co/40x40/E2E8F0/4A5568?text=${user.email.charAt(0).toUpperCase()}`
        };
        await setDoc(userRef, newUser);
        userDoc = await getDoc(userRef);
    }
    return { id: user.uid, ...userDoc.data() };
}

/**
 * @function showVerificationMessage
 * @description Renders a message for users who haven't verified their email.
 * @param {object} user - The Firebase user object.
 */
function showVerificationMessage(user) {
    appContainer.innerHTML = `
        <div class="fixed inset-0 bg-gray-100 flex items-center justify-center">
            <div class="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
                <h2 class="text-xl font-bold mb-4">Verifikasi Email Anda</h2>
                <p>Kami telah mengirimkan link verifikasi ke <strong>${user.email}</strong>.</p>
                <p class="mt-2">Silakan cek kotak masuk Anda dan klik link tersebut.</p>
                <div class="mt-6 flex gap-4 justify-center">
                    <button id="resend-verification-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Kirim Ulang</button>
                    <button id="logout-btn-verify" class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Logout</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('resend-verification-btn').addEventListener('click', () => sendEmailVerification(user).then(() => alert('Email terkirim!')));
    document.getElementById('logout-btn-verify').addEventListener('click', () => signOut(auth));
}

/**
 * @function handleLogout
 * @description Signs the user out of the application.
 */
export function handleLogout() {
    signOut(auth).catch(error => console.error("Logout error:", error));
}
