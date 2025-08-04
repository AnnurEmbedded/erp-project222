/**
 * config.js
 * Versi 2.1: Fase 2 - Modul Inventaris
 * - Mengganti PRODUCT_MODAL_TEMPLATE menjadi INVENTORY_MODAL_TEMPLATE yang canggih.
 * - Menambahkan template untuk modal penggunaan consumable.
 * - Menambahkan template untuk Bill of Materials (BOM) pada form.
 */

export const DOCUMENT_TEMPLATES = {
    penawaran: { title: "PENAWARAN HARGA", subtitle: "QUOTATION" },
    proforma: { title: "PROFORMA INVOICE", subtitle: "PROFORMA INVOICE" },
    invoice: { title: "INVOICE" },
    fakturpajak: { title: "FAKTUR PAJAK", subtitle: "" },
    suratjalan: { title: "SURAT JALAN", subtitle: "DELIVERY ORDER" },
    bast: { title: "BERITA ACARA SERAH TERIMA", subtitle: "HANDOVER CERTIFICATE" },
    kwitansi: { title: "KWITANSI", subtitle: "RECEIPT" }
};

export const DOCUMENT_CODES = {
    penawaran: 'Q',
    proforma: 'P-INV',
    invoice: 'INV',
    fakturpajak: 'FP',
    suratjalan: 'SJ',
    bast: 'BAST',
    kwitansi: 'KWT',
    pr: 'PR',
    po: 'PO'
};

export const PROJECT_STATUSES = [
    'Draft',
    'Penawaran Terkirim',
    'Disetujui',
    'Dibatalkan',
    'Dibayar Sebagian',
    'Lunas'
];

export const PROJECT_STATUS_TEMPLATE = `
    <fieldset class="mt-6 border p-4 rounded-md">
        <legend class="font-montserrat font-bold px-2 text-gray-700">Status Proyek</legend>
        <label for="projectStatus" class="sr-only">Status Proyek</label>
        <select id="projectStatus" class="block w-full rounded-md p-2 border-gray-300 shadow-sm">
            ${PROJECT_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
    </fieldset>
`;

export const SPECIFIC_DETAILS_TEMPLATES = {
    common: `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
                <label for="docDate" class="block text-sm font-medium text-gray-700">Tanggal Dokumen</label>
                <input type="date" id="docDate" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm">
            </div>
             <div>
                <label for="discount" class="block text-sm font-medium text-gray-700">Diskon (%)</label>
                <input type="number" id="discount" value="0" min="0" max="100" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm">
            </div>
        </div>
        <div class="mt-4">
            <label for="paymentTerm" class="block text-sm font-medium text-gray-700">Termin Pembayaran</label>
            <textarea id="paymentTerm" rows="3" placeholder="Contoh: 50% Uang Muka setelah PO diterima.&#10;50% Pelunasan setelah BAST." class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm"></textarea>
            <div class="flex items-center mt-2">
                <input id="hasDp" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-[--limitless-sky] focus:ring-[--limitless-sky]">
                <label for="hasDp" class="ml-2 block text-sm text-gray-900">Termin ini memerlukan DP (mengaktifkan Proforma)</label>
            </div>
            <div id="dp-percentage-wrapper" class="hidden mt-2">
                <label for="dpPercentage" class="block text-sm font-medium text-gray-700">Persentase DP (%)</label>
                <input type="number" id="dpPercentage" value="50" min="0" max="100" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm">
            </div>
        </div>
        <div class="mt-4 flex items-center">
            <input id="isPPN" name="isPPN" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-[--limitless-sky] focus:ring-[--limitless-sky]">
            <label for="isPPN" class="ml-2 block text-sm text-gray-900">Kenakan PPN untuk proyek ini</label>
        </div>
    `,
    invoice: `
        <div class="mt-4">
            <label for="dueDate" class="block text-sm font-medium text-gray-700">Tanggal Jatuh Tempo</label>
            <input type="date" id="dueDate" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm">
        </div>
        <div id="invoice-po-number-wrapper" class="hidden mt-4">
             <label for="poNumber" class="block text-sm font-medium text-gray-700">PO No. (Ref No.)</label>
             <input type="text" id="poNumber" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm" placeholder="Nomor Purchase Order dari klien">
        </div>
        <div class="mt-4 flex items-center">
            <input id="applyMeterai" name="applyMeterai" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-[--limitless-sky] focus:ring-[--limitless-sky]">
            <label for="applyMeterai" class="ml-2 block text-sm text-gray-900">Gunakan Bea Materai 10.000</label>
        </div>
    `,
    proforma: `
        <div class="mt-4">
            <label for="poNumber" class="block text-sm font-medium text-gray-700">PO No. (Ref No.)</label>
            <input type="text" id="poNumber" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm" placeholder="Nomor Purchase Order dari klien">
        </div>
    `,
    fakturpajak: `
        <div class="mt-4">
            <label for="nsfp" class="block text-sm font-medium text-gray-700">Kode dan Nomor Seri Faktur Pajak (NSFP)</label>
            <input type="text" id="nsfp" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm" placeholder="Contoh: 010.000-24.00000001">
        </div>
        <p class="text-xs text-gray-500 mt-2">Pastikan NPWP Klien sudah terisi di Manajemen Klien untuk ditampilkan di Faktur Pajak.</p>
    `,
    suratjalan: `
        <div class="mt-4">
            <label for="deliveryNotes" class="block text-sm font-medium text-gray-700">Catatan Pengiriman</label>
            <input type="text" id="deliveryNotes" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm" placeholder="Contoh: Mohon diterima oleh security">
        </div>
    `,
    bast: `
        <h3 class="font-montserrat font-semibold text-gray-800 mt-4 border-t pt-4">Data Penandatangan BAST</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
                <label for="bastPihak1Name" class="block text-sm font-medium text-gray-700">Nama Pihak Pertama</label>
                <input type="text" id="bastPihak1Name" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm" placeholder="Nama dari perusahaan Anda">
            </div>
            <div>
                <label for="bastPihak1Jabatan" class="block text-sm font-medium text-gray-700">Jabatan Pihak Pertama</label>
                <input type="text" id="bastPihak1Jabatan" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm" placeholder="Contoh: Direktur">
            </div>
            <div>
                <label for="bastPihak2Name" class="block text-sm font-medium text-gray-700">Nama Pihak Kedua</label>
                <input type="text" id="bastPihak2Name" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm" placeholder="Nama PIC Klien">
            </div>
            <div>
                <label for="bastPihak2Jabatan" class="block text-sm font-medium text-gray-700">Jabatan Pihak Kedua</label>
                <input type="text" id="bastPihak2Jabatan" class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm" placeholder="Contoh: Manajer Proyek">
            </div>
        </div>
    `,
    kwitansi: `
        <div class="mt-4 flex items-center">
            <input id="applyMeteraiKwitansi" name="applyMeteraiKwitansi" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-[--limitless-sky] focus:ring-[--limitless-sky]">
            <label for="applyMeteraiKwitansi" class="ml-2 block text-sm text-gray-900">Sediakan Kotak Materai 10.000</label>
        </div>
    `
};

export const PR_MODAL_TEMPLATE = `
<div class="mx-auto my-8 p-8 bg-white w-full max-w-4xl rounded-lg shadow-xl">
    <h2 class="text-2xl font-bold mb-6 font-montserrat text-[--deep-ocean]">Buat Permintaan Pembelian (PR)</h2>
    <form id="pr-form">
        <input type="hidden" id="editPrId">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label for="prRequester" class="block text-sm font-medium text-gray-700">Departemen Pemohon</label>
                <input type="text" id="prRequester" class="mt-1 block w-full rounded-md p-2 border-gray-300" required placeholder="Contoh: IT, Marketing">
            </div>
            <div>
                <label for="prDate" class="block text-sm font-medium text-gray-700">Tanggal Permintaan</label>
                <input type="date" id="prDate" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
            </div>
            <div class="md:col-span-2">
                <label for="prJustification" class="block text-sm font-medium text-gray-700">Justifikasi / Alasan Pembelian</label>
                <textarea id="prJustification" rows="3" class="mt-1 block w-full rounded-md p-2 border-gray-300" required placeholder="Contoh: Untuk kebutuhan proyek X, upgrade hardware, dll."></textarea>
            </div>
        </div>
        
        <fieldset class="mt-6 mb-6 border p-4 rounded-md">
            <legend class="font-montserrat font-bold px-2 text-gray-700">Item yang Diminta</legend>
            <div id="pr-items-container"></div>
            <button id="add-pr-item-btn" type="button" class="mt-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-4 rounded-lg">Tambah Item</button>
        </fieldset>

        <div class="mt-6 flex justify-end gap-3">
            <button type="button" id="close-pr-modal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Batal</button>
            <button type="submit" class="bg-[--deep-ocean] hover:bg-blue-900 text-white font-bold py-2 px-4 rounded">Ajukan Permintaan</button>
        </div>
    </form>
</div>
`;

export const VENDOR_INVOICE_MODAL_TEMPLATE = `
<div class="mx-auto my-12 p-8 bg-white w-full max-w-lg rounded-lg shadow-xl">
    <h2 class="text-2xl font-bold mb-4 font-montserrat text-[--deep-ocean]">Catat & Validasi Invoice Vendor</h2>
    <form id="vendor-invoice-form">
        <input type="hidden" id="refPoId">
        <div class="space-y-4">
            <div>
                <label for="vendorInvoiceNumber" class="block text-sm font-medium">Nomor Invoice Vendor</label>
                <input type="text" id="vendorInvoiceNumber" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
            </div>
            <div>
                <label for="vendorInvoiceDate" class="block text-sm font-medium">Tanggal Invoice Vendor</label>
                <input type="date" id="vendorInvoiceDate" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
            </div>
            <div>
                <label for="vendorInvoiceAmount" class="block text-sm font-medium">Total Tagihan (IDR)</label>
                <input type="number" id="vendorInvoiceAmount" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
            </div>
            <div class="pt-2">
                <p class="text-sm font-medium text-gray-900">Proses Validasi (Three-Way Match)</p>
                <p class="text-xs text-gray-500">Pastikan total tagihan pada invoice vendor sesuai dengan total harga pada Purchase Order.</p>
                <div class="mt-2 p-3 bg-gray-50 rounded-md">
                    <p class="text-sm">Total PO: <span id="poTotalAmount" class="font-bold"></span></p>
                    <p id="match-status" class="text-sm font-bold mt-1"></p>
                </div>
            </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
            <button type="button" id="close-vendor-invoice-modal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Batal</button>
            <button type="submit" id="save-vendor-invoice-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" disabled>Validasi & Siap Bayar</button>
        </div>
    </form>
</div>
`;


export const PAYMENT_MODAL_TEMPLATE = `
<div class="mx-auto my-12 p-8 bg-white w-full max-w-lg rounded-lg shadow-xl">
    <h2 class="text-2xl font-bold mb-4 font-montserrat text-[--deep-ocean]">Catat Pembayaran</h2>
    <form id="payment-form">
        <div class="space-y-4">
            <div>
                <label for="paymentAmount" class="block text-sm font-medium">Jumlah Pembayaran (IDR)</label>
                <input type="number" id="paymentAmount" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
            </div>
            <div>
                <label for="paymentDate" class="block text-sm font-medium">Tanggal Pembayaran</label>
                <input type="date" id="paymentDate" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
            </div>
            <div>
                <label for="paymentNotes" class="block text-sm font-medium">Catatan (Opsional)</label>
                <input type="text" id="paymentNotes" placeholder="Contoh: Transfer via BCA" class="mt-1 block w-full rounded-md p-2 border-gray-300">
            </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
            <button type="button" id="close-payment-modal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Batal</button>
            <button type="submit" class="bg-[--limitless-sky] hover:bg-sky-600 text-white font-bold py-2 px-4 rounded">Simpan Pembayaran</button>
        </div>
    </form>
</div>
`;

export const COMPANY_MODAL_TEMPLATE = `
    <div class="mx-auto my-8 p-8 bg-white w-full max-w-3xl rounded-lg shadow-xl">
        <h2 class="text-2xl font-bold mb-6 font-montserrat text-[--deep-ocean]">Profil Perusahaan</h2>
        <form id="company-profile-form">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium">Nama Perusahaan</label>
                    <input type="text" id="companyName" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
                </div>
                 <div>
                    <label class="block text-sm font-medium">Inisial Perusahaan (Untuk No. Surat)</label>
                    <input type="text" id="companyInitials" placeholder="Contoh: EJA" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium">Alamat</label>
                    <textarea id="companyAddress" rows="3" class="mt-1 block w-full rounded-md p-2 border-gray-300"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium">Nomor Telepon</label>
                    <input type="text" id="companyPhone" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                </div>
                <div>
                    <label class="block text-sm font-medium">Email</label>
                    <input type="email" id="companyEmail" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                </div>
                 <div>
                    <label class="block text-sm font-medium">Website</label>
                    <input type="url" id="companyWebsite" placeholder="https://..." class="mt-1 block w-full rounded-md p-2 border-gray-300">
                </div>
                 <div>
                    <label class="block text-sm font-medium">NPWP</label>
                    <input type="text" id="companyNpwp" placeholder="00.000.000.0-000.000" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                </div>
                 <div>
                    <label class="block text-sm font-medium">Logo Perusahaan (URL)</label>
                    <input type="url" id="companyLogo" placeholder="https://..." class="mt-1 block w-full rounded-md p-2 border-gray-300">
                </div>
                 <div>
                    <label class="block text-sm font-medium">Stempel Digital (URL)</label>
                    <input type="url" id="companyStamp" placeholder="https://..." class="mt-1 block w-full rounded-md p-2 border-gray-300">
                </div>
                <div>
                    <label class="block text-sm font-medium">Nama Direktur</label>
                    <input type="text" id="directorName" placeholder="Nama Lengkap" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                </div>
                <div class="md:col-span-2 border-t pt-4">
                    <h3 class="font-montserrat font-semibold text-gray-800">Pengaturan Pajak & Termin</h3>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium">Default Termin Pembayaran</label>
                     <textarea id="defaultPaymentTerm" rows="3" placeholder="Contoh: 50% Uang Muka setelah PO diterima.&#10;50% Pelunasan setelah BAST." class="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm"></textarea>
                    <div class="flex items-center mt-2">
                        <input id="defaultHasDp" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-[--limitless-sky] focus:ring-[--limitless-sky]">
                        <label for="defaultHasDp" class="ml-2 block text-sm text-gray-900">Termin ini memerlukan DP (mengaktifkan Proforma)</label>
                    </div>
                </div>
                <div class="md:col-span-2">
                     <div class="flex items-center">
                        <input id="isPKP" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-[--limitless-sky] focus:ring-[--limitless-sky]">
                        <label for="isPKP" class="ml-2 block text-sm text-gray-900">Perusahaan adalah Pengusaha Kena Pajak (PKP)</label>
                    </div>
                </div>
                 <div>
                    <label class="block text-sm font-medium">Tarif PPN (%)</label>
                    <input type="number" id="ppnRate" value="11" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                </div>
                <div class="md:col-span-2 border-t pt-4">
                     <h3 class="font-montserrat font-semibold text-gray-800">Informasi Tambahan</h3>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium">Syarat & Ketentuan Umum</label>
                    <textarea id="companyTerms" rows="4" placeholder="1. Harga belum termasuk PPN...&#10;2. Garansi teknis..." class="mt-1 block w-full rounded-md p-2 border-gray-300"></textarea>
                </div>
                 <div class="md:col-span-2">
                    <label class="block text-sm font-medium">Informasi Pembayaran</label>
                    <textarea id="companyPaymentInfo" rows="4" placeholder="Bank: BCA&#10;No. Rekening: 123-456-7890&#10;Atas Nama: PT..." class="mt-1 block w-full rounded-md p-2 border-gray-300"></textarea>
                </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
                <button type="button" id="close-company-modal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Batal</button>
                <button type="submit" class="bg-[--deep-ocean] hover:bg-blue-900 text-white font-bold py-2 px-4 rounded">Simpan</button>
            </div>
        </form>
    </div>
`;

export const CLIENTS_MODAL_TEMPLATE = `
    <div class="mx-auto my-12 p-8 bg-white w-full max-w-4xl rounded-lg shadow-xl">
        <h2 class="text-2xl font-bold mb-4 font-montserrat text-[--deep-ocean]">Manajemen Klien</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-1">
                <h3 class="font-semibold mb-2">Tambah/Edit Klien</h3>
                <form id="client-form">
                    <input type="hidden" id="editClientId">
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium">Nama Klien</label>
                            <input type="text" id="clientName" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Departemen (Opsional)</label>
                            <input type="text" id="clientDepartment" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">PIC (Up.)</label>
                            <input type="text" id="clientPic" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Email Klien</label>
                            <input type="email" id="clientEmail" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">NPWP Klien</label>
                            <input type="text" id="clientNpwp" placeholder="00.000.000.0-000.000" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Alamat</label>
                            <textarea id="clientAddress" rows="3" class="mt-1 block w-full rounded-md p-2 border-gray-300"></textarea>
                        </div>
                        <div class="flex gap-2">
                           <button type="submit" class="w-full bg-[--limitless-sky] hover:bg-sky-600 text-white font-bold py-2 px-3 rounded">Simpan</button>
                           <button type="button" id="clear-client-form" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded">Batal</button>
                        </div>
                    </div>
                </form>
            </div>
            <div class="md:col-span-2">
                <h3 class="font-semibold mb-2">Daftar Klien</h3>
                <div id="clients-list" class="h-96 overflow-y-auto border rounded-md p-2 bg-[--calm-gray]"></div>
            </div>
        </div>
        <div class="mt-6 flex justify-end">
            <button type="button" id="close-clients-modal" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Tutup</button>
        </div>
    </div>
`;

export const VENDORS_MODAL_TEMPLATE = `
    <div class="mx-auto my-12 p-8 bg-white w-full max-w-4xl rounded-lg shadow-xl">
        <h2 class="text-2xl font-bold mb-4 font-montserrat text-[--deep-ocean]">Manajemen Vendor</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-1">
                <h3 class="font-semibold mb-2">Tambah/Edit Vendor</h3>
                <form id="vendor-form">
                    <input type="hidden" id="editVendorId">
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium">Nama Vendor</label>
                            <input type="text" id="vendorName" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Contact Person</label>
                            <input type="text" id="vendorContactPerson" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Nomor Telepon</label>
                            <input type="text" id="vendorPhone" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Email Vendor</label>
                            <input type="email" id="vendorEmail" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">NPWP Vendor</label>
                            <input type="text" id="vendorNpwp" placeholder="00.000.000.0-000.000" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Alamat</label>
                            <textarea id="vendorAddress" rows="3" class="mt-1 block w-full rounded-md p-2 border-gray-300"></textarea>
                        </div>
                        <div class="flex gap-2">
                           <button type="submit" class="w-full bg-[--limitless-sky] hover:bg-sky-600 text-white font-bold py-2 px-3 rounded">Simpan</button>
                           <button type="button" id="clear-vendor-form" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded">Batal</button>
                        </div>
                    </div>
                </form>
            </div>
            <div class="md:col-span-2">
                <h3 class="font-semibold mb-2">Daftar Vendor</h3>
                <div id="vendors-list" class="h-96 overflow-y-auto border rounded-md p-2 bg-[--calm-gray]"></div>
            </div>
        </div>
        <div class="mt-6 flex justify-end">
            <button type="button" id="close-vendors-modal" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Tutup</button>
        </div>
    </div>
`;


export const EMAIL_MODAL_TEMPLATE = `
    <div class="mx-auto my-12 p-8 bg-white w-full max-w-3xl rounded-lg shadow-xl">
        <h2 class="text-2xl font-bold mb-4 font-montserrat text-[--deep-ocean]">Bantuan Pembuatan Email</h2>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium">Penerima</label>
                <input type="email" id="email-recipient" value="{clientEmail}" class="mt-1 block w-full rounded-md p-2 border-gray-300 bg-gray-100" readonly>
            </div>
            <div>
                <label class="block text-sm font-medium">Subjek</label>
                <input type="text" id="email-subject" value="{subject}" class="mt-1 block w-full rounded-md p-2 border-gray-300">
            </div>
            <div>
                <label class="block text-sm font-medium">Isi Email</label>
                <textarea id="email-body" rows="10" class="mt-1 block w-full rounded-md p-2 border-gray-300 text-sm">{body}</textarea>
            </div>
             <div class="text-right">
                <button id="generate-email-ai-btn" class="inline-flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50">
                    <span id="ai-button-text">Buat dengan AI</span>
                    <svg id="ai-spinner" class="animate-spin ml-2 h-4 w-4 text-white hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </button>
            </div>
        </div>
        <div class="mt-6 flex justify-between items-center gap-3">
            <a id="mailto-link" href="{mailtoLink}" target="_blank" class="bg-[--limitless-sky] hover:bg-sky-600 text-white font-bold py-2 px-4 rounded">Buka di Aplikasi Email</a>
            <div>
                <button id="copy-email-btn" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Salin Isi Email</button>
                <button id="close-email-modal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Tutup</button>
            </div>
        </div>
    </div>
`;

export const INVENTORY_MODAL_TEMPLATE = `
<div class="mx-auto my-8 p-6 bg-white w-full max-w-6xl rounded-lg shadow-xl">
    <div class="flex justify-between items-start">
        <h2 class="text-2xl font-bold mb-4 font-montserrat text-[--deep-ocean]">Manajemen Inventaris</h2>
        <button type="button" id="close-inventory-modal" class="text-gray-400 hover:text-gray-600">&times;</button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
        <nav id="inventory-tabs" class="-mb-px flex space-x-6" aria-label="Tabs">
            <button data-category="product" class="inventory-tab active-tab">Produk</button>
            <button data-category="raw_material" class="inventory-tab">Bahan Baku</button>
            <button data-category="consumable" class="inventory-tab">Consumable</button>
            <button data-category="asset" class="inventory-tab">Aset</button>
        </nav>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <!-- Form Column -->
        <div class="md:col-span-1">
            <h3 class="font-semibold mb-2">Tambah/Edit Item</h3>
            <form id="inventory-form">
                <input type="hidden" id="editItemId">
                <input type="hidden" id="itemCategory" value="product">
                <div class="space-y-3">
                    <!-- Common Fields -->
                    <div>
                        <label class="block text-sm font-medium">Kode Item</label>
                        <input type="text" id="itemCode" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Nama Item</label>
                        <input type="text" id="itemName" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">Satuan</label>
                        <input type="text" id="itemUnit" class="mt-1 block w-full rounded-md p-2 border-gray-300" placeholder="Contoh: Pcs, Unit, Kg" required>
                    </div>
                    <div class="form-field-wrapper" data-category="product raw_material consumable">
                        <label class="block text-sm font-medium">Stok Saat Ini</label>
                        <input type="number" id="itemStock" class="mt-1 block w-full rounded-md p-2 border-gray-300" value="0">
                    </div>
                    
                    <!-- Product-specific Fields -->
                    <div class="form-field-wrapper" data-category="product">
                        <label class="block text-sm font-medium">Harga Jual</label>
                        <input type="number" id="itemPrice" class="mt-1 block w-full rounded-md p-2 border-gray-300" value="0">
                    </div>

                    <!-- Asset-specific Fields -->
                    <div class="form-field-wrapper" data-category="asset">
                        <label class="block text-sm font-medium">Tanggal Beli</label>
                        <input type="date" id="assetPurchaseDate" class="mt-1 block w-full rounded-md p-2 border-gray-300">
                    </div>
                    <div class="form-field-wrapper" data-category="asset">
                        <label class="block text-sm font-medium">Harga Perolehan</label>
                        <input type="number" id="assetPurchaseValue" class="mt-1 block w-full rounded-md p-2 border-gray-300" value="0">
                    </div>
                    <div class="form-field-wrapper" data-category="asset">
                        <label class="block text-sm font-medium">Masa Manfaat (bulan)</label>
                        <input type="number" id="assetUsefulLife" class="mt-1 block w-full rounded-md p-2 border-gray-300" value="0">
                    </div>
                    
                    <!-- Bill of Materials Section -->
                    <div id="bom-section" class="form-field-wrapper pt-4 mt-4 border-t" data-category="product">
                        <h4 class="font-semibold text-sm mb-2">Bill of Materials (BOM)</h4>
                        <div id="bom-items-container" class="space-y-2"></div>
                        <button id="add-bom-item-btn" type="button" class="mt-2 text-sm text-green-600 hover:text-green-800">+ Tambah Bahan Baku</button>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex gap-2 pt-2">
                       <button type="submit" class="w-full bg-[--limitless-sky] hover:bg-sky-600 text-white font-bold py-2 px-3 rounded">Simpan</button>
                       <button type="button" id="clear-inventory-form" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded">Batal</button>
                    </div>
                </div>
            </form>
        </div>

        <!-- List Column -->
        <div class="md:col-span-2">
            <h3 id="inventory-list-title" class="font-semibold mb-2">Daftar Produk</h3>
            <div id="inventory-list" class="h-96 overflow-y-auto border rounded-md p-2 bg-[--calm-gray]"></div>
        </div>
    </div>
</div>
`;

export const CONSUMABLE_USAGE_MODAL_TEMPLATE = `
<div class="mx-auto my-12 p-8 bg-white w-full max-w-lg rounded-lg shadow-xl">
    <h2 class="text-2xl font-bold mb-6 font-montserrat text-[--deep-ocean]">Lapor Penggunaan Consumable</h2>
    <form id="consumable-usage-form">
        <div class="space-y-4">
            <div>
                <label for="usagePIC" class="block text-sm font-medium">Nama Pengguna (PIC)</label>
                <input type="text" id="usagePIC" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
            </div>
            <div>
                <label for="usageDate" class="block text-sm font-medium">Tanggal Penggunaan</label>
                <input type="date" id="usageDate" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
            </div>
            <div>
                <label for="usageItemId" class="block text-sm font-medium">Pilih Item Consumable</label>
                <select id="usageItemId" class="mt-1 block w-full rounded-md p-2 border-gray-300" required></select>
            </div>
            <div>
                <label for="usageQuantity" class="block text-sm font-medium">Jumlah yang Digunakan</label>
                <input type="number" id="usageQuantity" min="1" class="mt-1 block w-full rounded-md p-2 border-gray-300" required>
            </div>
            <div>
                <label for="usageNotes" class="block text-sm font-medium">Keterangan</label>
                <textarea id="usageNotes" rows="3" class="mt-1 block w-full rounded-md p-2 border-gray-300" placeholder="Contoh: Untuk keperluan meeting bulanan"></textarea>
            </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
            <button type="button" id="close-consumable-usage-modal" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Batal</button>
            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Simpan Laporan</button>
        </div>
    </form>
</div>
`;