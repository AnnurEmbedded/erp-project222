// File: scripts/sales-module.js

function loadScript(url, isModule = true) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        if (isModule) script.type = 'module';
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Gagal memuat skrip: ${url}`));
        document.head.appendChild(script);
    });
}

export async function initialize(db, auth, state, appId) {
    console.log("Modul Pengadaan & Penjualan mulai dimuat...");

    // Simpan semua variabel yang dibutuhkan ke window agar bisa diakses modul lain
    window.erpShared = {
        db: db,
        auth: auth,
        currentUser: state.currentUser,
        appId: appId // PERBAIKAN: Simpan appId
    };

    const moduleScriptsToLoad = [
        './scripts/sales/firebase-init.js',
        './scripts/sales/config.js',
        './scripts/sales/store.js',
        './scripts/sales/ui.js',
        './scripts/sales/main.js'
    ];

    try {
        await loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js', false);

        for (const scriptUrl of moduleScriptsToLoad) {
            await loadScript(scriptUrl, true);
        }
        
        const mainModule = await import('./scripts/sales/main.js');
        mainModule.initializeSalesModule();

        console.log("Semua skrip untuk modul sales telah berhasil dimuat dan diinisialisasi.");

    } catch (error) {
        console.error("Terjadi kesalahan saat memuat atau menginisialisasi skrip modul sales:", error);
    }
}
