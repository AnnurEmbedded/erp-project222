/**
 * store.js
 * Versi 2.2: Perbaikan Path Koleksi Database
 * - FIX: Menggunakan path koleksi yang benar (`artifacts/{appId}/public/data/...`)
 * untuk semua operasi Firestore agar konsisten dengan app.js.
 */
import { db } from './modules/firebase-module.js';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, runTransaction, writeBatch, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Helper untuk mendapatkan appId dari window
const getAppId = () => window.erpShared?.appId || 'default-project-erp';

// --- Projects (Siklus Penjualan) ---
export async function getProjects(userId) {
    if (!userId) return [];
    const appId = getAppId();
    // PERBAIKAN: Path disesuaikan
    const querySnapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/projects`));
    const projects = [];
    querySnapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() });
    });
    return projects;
}

export async function getProjectById(userId, id) {
    if (!userId || !id) return null;
    const appId = getAppId();
    // PERBAIKAN: Path disesuaikan
    const docRef = doc(db, `artifacts/${appId}/public/data/projects`, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function saveProject(userId, projectData) {
    if (!userId) return;
    const appId = getAppId();
    // PERBAIKAN: Path disesuaikan
    const docRef = doc(db, `artifacts/${appId}/public/data/projects`, projectData.id);
    await setDoc(docRef, projectData, { merge: true });
}

export async function deleteProject(userId, id) {
    if (!userId) return;
    const appId = getAppId();
    // PERBAIKAN: Path disesuaikan
    const docRef = doc(db, `artifacts/${appId}/public/data/projects`, id);
    await deleteDoc(docRef);
}

export async function deleteMultipleProjects(userId, projectIds) {
    if (!userId || projectIds.length === 0) return;
    const appId = getAppId();
    const batch = writeBatch(db);
    projectIds.forEach(id => {
        // PERBAIKAN: Path disesuaikan
        const docRef = doc(db, `artifacts/${appId}/public/data/projects`, id);
        batch.delete(docRef);
    });
    await batch.commit();
}

// --- Siklus Pengadaan ---
// CATATAN: Asumsi path ini juga berada di public/data. Sesuaikan jika berbeda.
export async function getPurchaseRequisitions(userId) {
    if (!userId) return [];
    const appId = getAppId();
    const querySnapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/purchaseRequisitions`));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPurchaseRequisitionById(userId, id) {
    if (!userId || !id) return null;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/purchaseRequisitions`, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function savePurchaseRequisition(userId, prData) {
    if (!userId) return;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/purchaseRequisitions`, prData.id);
    await setDoc(docRef, prData, { merge: true });
}

export async function deletePurchaseRequisition(userId, id) {
    if (!userId) return;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/purchaseRequisitions`, id);
    await deleteDoc(docRef);
}

export async function deleteMultiplePurchaseRequisitions(userId, ids) {
     if (!userId || ids.length === 0) return;
    const appId = getAppId();
    const batch = writeBatch(db);
    ids.forEach(id => {
        const docRef = doc(db, `artifacts/${appId}/public/data/purchaseRequisitions`, id);
        batch.delete(docRef);
    });
    await batch.commit();
}

export async function getPurchaseOrders(userId) {
    if (!userId) return [];
    const appId = getAppId();
    const querySnapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/purchaseOrders`));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPurchaseOrderById(userId, id) {
    if (!userId || !id) return null;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/purchaseOrders`, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function savePurchaseOrder(userId, poData) {
    if (!userId) return;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/purchaseOrders`, poData.id);
    await setDoc(docRef, poData, { merge: true });
}

export async function deletePurchaseOrder(userId, id) {
    if (!userId) return;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/purchaseOrders`, id);
    await deleteDoc(docRef);
}

export async function deleteMultiplePurchaseOrders(userId, ids) {
    if (!userId || ids.length === 0) return;
    const appId = getAppId();
    const batch = writeBatch(db);
    ids.forEach(id => {
        const docRef = doc(db, `artifacts/${appId}/public/data/purchaseOrders`, id);
        batch.delete(docRef);
    });
    await batch.commit();
}


// --- Inventaris (Items) ---
export async function getItems(userId) {
    if (!userId) return [];
    const appId = getAppId();
    const querySnapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/items`));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveItem(userId, itemData) {
    if (!userId) return;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/items`, itemData.id);
    await setDoc(docRef, itemData, { merge: true });
}

export async function deleteItem(userId, id) {
    if (!userId) return;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/items`, id);
    await deleteDoc(docRef);
}

export async function updateStock(userId, itemId, quantityChange) {
    if (!userId || !itemId) return;
    const appId = getAppId();
    const itemRef = doc(db, `artifacts/${appId}/public/data/items`, itemId);
    
    await runTransaction(db, async (transaction) => {
        const itemDoc = await transaction.get(itemRef);
        if (!itemDoc.exists()) {
            throw new Error(`Item dengan ID ${itemId} tidak ditemukan!`);
        }
        const currentStock = itemDoc.data().stock || 0;
        const newStock = currentStock + quantityChange;
        transaction.update(itemRef, { stock: newStock });
    });
}

export async function saveConsumableUsage(userId, usageData) {
    if (!userId) return;
    const appId = getAppId();
    await addDoc(collection(db, `artifacts/${appId}/public/data/consumableUsages`), usageData);
}


// --- Clients, Vendors, Company Profile, Counters (Asumsi path sama) ---
export async function getClients(userId) {
    if (!userId) return [];
    const appId = getAppId();
    const querySnapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/clients`));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveClient(userId, clientData) {
    if (!userId) return;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/clients`, clientData.id);
    await setDoc(docRef, clientData, { merge: true });
}

export async function deleteClient(userId, id) {
    if (!userId) return;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/clients`, id);
    await deleteDoc(docRef);
}

export async function getVendors(userId) {
    if (!userId) return [];
    const appId = getAppId();
    const querySnapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/vendors`));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveVendor(userId, vendorData) {
    if (!userId) return;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/vendors`, vendorData.id);
    await setDoc(docRef, vendorData, { merge: true });
}

export async function deleteVendor(userId, id) {
    if (!userId) return;
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/vendors`, id);
    await deleteDoc(docRef);
}

// Company Profile & Counters are global, not user-specific or app-specific in this structure
export async function getCompanyProfile() {
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/companyProfile`, 'main');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : {};
}

export async function saveCompanyProfile(profileData) {
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/companyProfile`, 'main');
    await setDoc(docRef, profileData, { merge: true });
}

export async function getDocumentCounters() {
    const appId = getAppId();
    const docRef = doc(db, `artifacts/${appId}/public/data/counters`, 'yearlyCounters');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const year = new Date().getFullYear();
        const allCounters = docSnap.data();
        const yearCounters = {};
        for (const key in allCounters) {
            if (key.endsWith(`_${year}`)) {
                yearCounters[key.split('_')[0]] = allCounters[key];
            }
        }
        return yearCounters;
    }
    return {};
}

export async function incrementDocumentCounter(docType) {
    const appId = getAppId();
    const counterRef = doc(db, `artifacts/${appId}/public/data/counters`, 'yearlyCounters');
    const year = new Date().getFullYear();
    const fieldName = `${docType}_${year}`;

    try {
        await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists()) {
                transaction.set(counterRef, { [fieldName]: 1 });
            } else {
                const currentCount = counterDoc.data()[fieldName] || 0;
                transaction.update(counterRef, { [fieldName]: currentCount + 1 });
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
    }
}
