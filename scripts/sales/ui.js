/**
 * ui.js
 * Versi 2.4: Fase 2 - Modul Inventaris
 * - REFACTOR: Mengubah 'products' menjadi 'items' dengan kategori.
 * - FEAT: Menambahkan logika untuk form inventaris multikategori.
 * - FEAT: Menambahkan logika untuk Bill of Materials (BOM).
 * - FEAT: Menambahkan modal dan logika untuk penggunaan consumable.
 * - FEAT: Menambahkan perhitungan dan tampilan depresiasi aset.
 */

import { getCompanyProfile, getClientById, getClients, getVendors, getItems } from './store.js';
import { DOCUMENT_TEMPLATES, SPECIFIC_DETAILS_TEMPLATES, COMPANY_MODAL_TEMPLATE, CLIENTS_MODAL_TEMPLATE, VENDORS_MODAL_TEMPLATE, PR_MODAL_TEMPLATE, VENDOR_INVOICE_MODAL_TEMPLATE, INVENTORY_MODAL_TEMPLATE, EMAIL_MODAL_TEMPLATE, PROJECT_STATUS_TEMPLATE, PAYMENT_MODAL_TEMPLATE, CONSUMABLE_USAGE_MODAL_TEMPLATE } from './config.js';

// --- Elemen UI ---
const authView = document.getElementById('auth-view');
const appContainer = document.getElementById('app-container');
const userEmailEl = document.getElementById('user-email');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
let salesChart = null;
let procurementChart = null;

// --- Kontrol Tampilan Otentikasi ---
export function showAuthView() {
    authView.style.display = 'flex';
    appContainer.style.display = 'none';
}

export function showAppView() {
    authView.style.display = 'none';
    appContainer.style.display = 'block';
}

export function setUserEmail(email) {
    if (userEmailEl) {
        userEmailEl.textContent = email;
    }
}

// --- Loading State ---
export function setLoading(isLoading, message = 'Memuat...') {
    loadingOverlay.style.display = isLoading ? 'flex' : 'none';
    loadingText.textContent = message;
}

// --- UX: Toast Notification ---
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let bgColor, textColor;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            break;
        default:
            bgColor = 'bg-gray-800';
            textColor = 'text-white';
            break;
    }

    toast.className = `toast ${bgColor} ${textColor} p-4 rounded-lg shadow-lg animate-fade-in-out`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}


// --- View Management ---
export function switchView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none';
    });
    const activeView = document.getElementById(viewId);
    activeView.classList.add('active');
    activeView.style.display = 'block';

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (viewId.includes('procurement') || viewId.includes('po-editor')) {
        document.getElementById('nav-procurement').classList.add('active');
    } else {
        document.getElementById('nav-dashboard').classList.add('active');
    }
}

export async function updateWorkflowUI(project) {
    if (!project) return;
    const company = await getCompanyProfile();
    const status = project.status;
    const hasDp = project.specificDetails.hasDp;

    const isApproved = ['Disetujui', 'Dibayar Sebagian', 'Lunas'].includes(status);
    const isInvoiceGenerated = project.docNumbers && project.docNumbers.invoice;

    document.querySelector('[data-doc="proforma"]').disabled = !hasDp || status === 'Draft';
    document.querySelector('[data-doc="invoice"]').disabled = !isApproved;
    document.querySelector('[data-doc="suratjalan"]').disabled = !isApproved;
    document.querySelector('[data-doc="bast"]').disabled = !isApproved;
    document.querySelector('[data-doc="kwitansi"]').disabled = status !== 'Lunas' && status !== 'Dibayar Sebagian';
    
    const fakturPajakBtn = document.querySelector('[data-doc="fakturpajak"]');
    if (fakturPajakBtn) {
        fakturPajakBtn.disabled = !company.isPKP || !isApproved || !isInvoiceGenerated;
    }
}

// --- Dashboard UI (Penjualan & Analitik) ---
export function renderAnalyticsDashboard(projects, clients, company) {
    const totalProjects = projects.length;
    const totalClients = clients.length;
    
    const totalRevenue = projects.reduce((sum, p) => {
        const { finalTotal } = calculateAllFinancials(p, company);
        return sum + finalTotal;
    }, 0);

    document.getElementById('stats-total-projects').textContent = totalProjects;
    document.getElementById('stats-total-clients').textContent = totalClients;
    document.getElementById('stats-total-revenue').textContent = formatCurrency(totalRevenue);

    // Sales Chart Data
    const monthlySales = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    
    projects.forEach(p => {
        const date = new Date(p.createdAt);
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${String(month).padStart(2, '0')}`;
        const { finalTotal } = calculateAllFinancials(p, company);
        
        if (!monthlySales[key]) {
            monthlySales[key] = { total: 0, label: `${monthNames[month]} ${year}` };
        }
        monthlySales[key].total += finalTotal;
    });

    const sortedKeys = Object.keys(monthlySales).sort();
    const chartLabels = sortedKeys.map(key => monthlySales[key].label);
    const chartData = sortedKeys.map(key => monthlySales[key].total);
    
    const ctx = document.getElementById('sales-chart').getContext('2d');
    if (salesChart) {
        salesChart.destroy();
    }
    salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Total Penjualan',
                data: chartData,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + (value / 1000000) + ' Jt';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Total: ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

export function renderProjectsTable(projects, clients, onEdit) {
    const tableBody = document.getElementById('projects-table-body');
    
    tableBody.innerHTML = '';
    if (projects.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-6 text-gray-500">Tidak ada proyek penjualan.</td></tr>`;
        return;
    }

    const clientMap = new Map(clients.map(c => [c.id, c.name]));

    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    projects.forEach(project => {
        const clientName = clientMap.get(project.clientId) || 'N/A';
        const status = project.status || 'Draft';
        const statusColor = getStatusColor(status);
        const quotationNumber = project.docNumbers?.penawaran || '-';

        const row = `
            <tr class="bg-white border-b hover:bg-[--calm-gray]">
                <td class="p-4"><input type="checkbox" class="project-checkbox" data-id="${project.id}"></td>
                <td class="px-6 py-4 font-medium text-[--deep-charcoal]">${project.subject || 'Tanpa Judul'}</td>
                <td class="px-6 py-4">${quotationNumber}</td>
                <td class="px-6 py-4">${clientName}</td>
                <td class="px-6 py-4"><span class="text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${statusColor}">${status}</span></td>
                <td class="px-6 py-4">${new Date(project.createdAt).toLocaleDateString('id-ID')}</td>
                <td class="px-6 py-4 flex gap-2">
                    <button data-id="${project.id}" class="edit-btn font-medium text-[--limitless-sky] hover:underline">Edit</button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => onEdit(e.target.dataset.id));
    });
}

function getStatusColor(status) {
    switch (status) {
        case 'Draft': return 'bg-gray-100 text-gray-800';
        case 'Disetujui': return 'bg-blue-100 text-blue-800';
        case 'Lunas': return 'bg-green-100 text-green-800';
        case 'Dibayar Sebagian': return 'bg-yellow-100 text-yellow-800';
        case 'Dibatalkan': return 'bg-red-100 text-red-800';
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        case 'Approved': return 'bg-green-100 text-green-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'PO Created': return 'bg-blue-100 text-blue-800';
        case 'PO Issued': return 'bg-purple-100 text-purple-800';
        case 'Goods Received': return 'bg-teal-100 text-teal-800';
        case 'Validated': return 'bg-green-100 text-green-800';
        case 'Paid': return 'bg-gray-500 text-white';
        default: return 'bg-yellow-100 text-yellow-800';
    }
}

// --- Dashboard UI (Pengadaan) ---
export function renderProcurementAnalyticsDashboard(orders, vendors) {
    document.getElementById('stats-total-po').textContent = orders.length;

    const totalExpense = orders.reduce((sum, po) => {
        const poTotal = po.items.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0);
        return sum + poTotal;
    }, 0);
    document.getElementById('stats-total-expense').textContent = formatCurrency(totalExpense);

    const vendorExpenses = {};
    orders.forEach(po => {
        const poTotal = po.items.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0);
        if (!vendorExpenses[po.vendorId]) {
            vendorExpenses[po.vendorId] = 0;
        }
        vendorExpenses[po.vendorId] += poTotal;
    });

    const topVendorId = Object.keys(vendorExpenses).sort((a, b) => vendorExpenses[b] - vendorExpenses[a])[0];
    const topVendor = vendors.find(v => v.id === topVendorId);
    document.getElementById('stats-top-vendor').textContent = topVendor ? topVendor.name : '-';

    // Procurement Chart Data
    const monthlyExpenses = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    
    orders.forEach(po => {
        const date = new Date(po.createdAt);
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${String(month).padStart(2, '0')}`;
        const poTotal = po.items.reduce((itemSum, item) => itemSum + (item.quantity * item.price), 0);
        
        if (!monthlyExpenses[key]) {
            monthlyExpenses[key] = { total: 0, label: `${monthNames[month]} ${year}` };
        }
        monthlyExpenses[key].total += poTotal;
    });

    const sortedKeys = Object.keys(monthlyExpenses).sort();
    const chartLabels = sortedKeys.map(key => monthlyExpenses[key].label);
    const chartData = sortedKeys.map(key => monthlyExpenses[key].total);

    const ctx = document.getElementById('procurement-chart').getContext('2d');
    if (procurementChart) {
        procurementChart.destroy();
    }
    procurementChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Total Pengadaan',
                data: chartData,
                backgroundColor: 'rgba(13, 148, 136, 0.5)',
                borderColor: 'rgba(13, 148, 136, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + (value / 1000000) + ' Jt';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Total: ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

export function renderPurchaseRequisitionsTable(requisitions) {
    const tableBody = document.getElementById('pr-table-body');
    tableBody.innerHTML = '';

    if (requisitions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-6 text-gray-500">Belum ada Permintaan Pembelian.</td></tr>`;
        return;
    }

    requisitions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    requisitions.forEach(pr => {
        const statusColor = getStatusColor(pr.status);
        const actionButton = pr.status === 'Pending' 
            ? `<button class="create-po-btn font-medium text-green-600 hover:underline">Buat PO</button>`
            : `<span class="text-gray-400">Selesai</span>`;

        const row = `
            <tr class="bg-white border-b hover:bg-[--calm-gray]">
                <td class="p-4"><input type="checkbox" class="procurement-checkbox" data-id="${pr.id}"></td>
                <td class="px-6 py-4 font-medium text-[--deep-charcoal]">${pr.id}</td>
                <td class="px-6 py-4">${new Date(pr.createdAt).toLocaleDateString('id-ID')}</td>
                <td class="px-6 py-4">${pr.requester}</td>
                <td class="px-6 py-4">${pr.justification}</td>
                <td class="px-6 py-4"><span class="text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${statusColor}">${pr.status}</span></td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        ${actionButton}
                        <button class="edit-pr-btn font-medium text-blue-600 hover:underline">Edit</button>
                        <button class="delete-pr-btn font-medium text-red-600 hover:underline">Hapus</button>
                        <button class="print-pr-btn font-medium text-gray-600 hover:underline">Cetak</button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

export function renderPurchaseOrdersTable(orders, vendors) {
    const tableBody = document.getElementById('po-table-body');
    tableBody.innerHTML = '';

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-6 text-gray-500">Belum ada Pesanan Pembelian.</td></tr>`;
        return;
    }

    const vendorMap = new Map(vendors.map(v => [v.id, v.name]));

    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    orders.forEach(po => {
        const statusColor = getStatusColor(po.status);
        const vendorName = vendorMap.get(po.vendorId) || 'N/A';
        
        let actionButton;
        switch (po.status) {
            case 'PO Issued':
                actionButton = `<button class="receive-goods-btn font-medium text-teal-600 hover:underline">Terima Barang</button>`;
                break;
            case 'Goods Received':
                actionButton = `<button class="record-invoice-btn font-medium text-blue-600 hover:underline">Catat Invoice</button>`;
                break;
            case 'Validated':
                actionButton = `<button class="pay-po-btn font-medium text-red-600 hover:underline">Bayar</button>`;
                break;
            default:
                actionButton = `<span class="text-gray-400">Selesai</span>`;
        }

        const row = `
            <tr class="bg-white border-b hover:bg-[--calm-gray]">
                <td class="p-4"><input type="checkbox" class="procurement-checkbox" data-id="${po.id}"></td>
                <td class="px-6 py-4 font-medium text-[--deep-charcoal]">${po.id}</td>
                <td class="px-6 py-4">${new Date(po.createdAt).toLocaleDateString('id-ID')}</td>
                <td class="px-6 py-4">${vendorName}</td>
                <td class="px-6 py-4">${po.prRefId}</td>
                <td class="px-6 py-4"><span class="text-xs font-medium mr-2 px-2.5 py-0.5 rounded ${statusColor}">${po.status}</span></td>
                <td class="px-6 py-4">
                     <div class="flex items-center gap-3">
                        ${actionButton}
                        ${po.status === 'PO Issued' ? `<button class="edit-po-btn font-medium text-blue-600 hover:underline">Edit</button>` : ''}
                        ${po.status === 'PO Issued' ? `<button class="delete-po-btn font-medium text-red-600 hover:underline">Hapus</button>` : ''}
                        <button class="print-po-btn font-medium text-gray-600 hover:underline">Cetak</button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

// --- Editor UI (Penjualan) ---
export function populateForm(project, products) {
    if (!project) return;
    document.getElementById('subject').value = project.subject || '';
    document.getElementById('clientId').value = project.clientId || '';
    
    const projectIdEl = document.getElementById('projectId');
    if (project.docNumbers && project.docNumbers[window.currentDocType]) {
        projectIdEl.value = project.docNumbers[window.currentDocType];
    } else {
        projectIdEl.value = project.projectId || '';
    }
    
    const specificDetailsForm = document.getElementById('specific-details-form');
    
    const oldStatusContainer = document.getElementById('project-status-container');
    if(oldStatusContainer) oldStatusContainer.remove();

    if (specificDetailsForm.parentElement) {
        const statusContainer = document.createElement('div');
        statusContainer.id = 'project-status-container';
        statusContainer.innerHTML = PROJECT_STATUS_TEMPLATE;
        specificDetailsForm.insertAdjacentElement('afterend', statusContainer);
        document.getElementById('projectStatus').value = project.status || 'Draft';
    }
    
    document.querySelectorAll('#specific-details-form input, #specific-details-form select, #specific-details-form textarea').forEach(input => {
        const key = input.id || input.name;
        if (project.specificDetails && project.specificDetails[key] !== undefined) {
             if (input.type === 'checkbox') {
                input.checked = project.specificDetails[key];
            } else {
                input.value = project.specificDetails[key];
            }
        }
    });
    
    const hasDpCheckbox = document.getElementById('hasDp');
    if (hasDpCheckbox) {
        const dpWrapper = document.getElementById('dp-percentage-wrapper');
        dpWrapper.classList.toggle('hidden', !hasDpCheckbox.checked);
    }

    const paymentTermEl = document.getElementById('paymentTerm');
    if (paymentTermEl) {
        paymentTermEl.value = project.specificDetails?.paymentTerm || '';
    }

    const itemsContainer = document.getElementById('items-container');
    itemsContainer.innerHTML = '';
    if (project.items && project.items.length > 0) {
        project.items.forEach(item => addItemRow(products, item));
    } else {
        addItemRow(products);
    }
}

export function addItemRow(products, item = { id: '', quantity: 1, price: 0 }) {
    const container = document.getElementById('items-container');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'grid grid-cols-12 gap-2 mb-2 item-row';

    const productOptions = products.map(p => 
        `<option value="${p.id}" data-price="${p.price}" ${item.id === p.id ? 'selected' : ''}>${p.name} (${p.code})</option>`
    ).join('');

    itemDiv.innerHTML = `
        <select class="col-span-6 p-2 border rounded item-id-select text-sm">
            <option value="">-- Pilih Produk --</option>
            ${productOptions}
        </select>
        <input type="number" value="${item.quantity}" min="1" placeholder="Qty" class="col-span-2 p-2 border rounded item-qty">
        <input type="number" value="${item.price}" min="0" placeholder="Harga" class="col-span-3 p-2 border rounded item-price">
        <button type="button" class="col-span-1 bg-red-500 text-white rounded remove-item-btn">&times;</button>
    `;
    container.appendChild(itemDiv);

    const selectEl = itemDiv.querySelector('.item-id-select');
    selectEl.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const price = selectedOption.dataset.price || 0;
        const row = e.target.closest('.item-row');
        row.querySelector('.item-price').value = price;
        row.querySelector('.item-price').dispatchEvent(new Event('input', { bubbles: true }));
    });
}

export async function switchDocument(userId, docType, projectData, products) {
    window.currentDocType = docType; 

    document.querySelectorAll('.doc-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.doc === docType);
    });

    const formContainer = document.getElementById('specific-details-form');
    let template = '';
    
    if (docType !== 'fakturpajak') {
        template += SPECIFIC_DETAILS_TEMPLATES.common;
    }
    if (SPECIFIC_DETAILS_TEMPLATES[docType]) {
        template += SPECIFIC_DETAILS_TEMPLATES[docType];
    }
    formContainer.innerHTML = template;

    populateForm(projectData, products);
    
    const docDateEl = document.getElementById('docDate');
    if (docDateEl && !docDateEl.value) {
        docDateEl.valueAsDate = new Date();
    }

    const invoicePoWrapper = document.getElementById('invoice-po-number-wrapper');
    if (invoicePoWrapper) {
        const proformaBtn = document.querySelector('[data-doc="proforma"]');
        invoicePoWrapper.classList.toggle('hidden', !proformaBtn.disabled);
    }

    await updatePreview(userId, docType, projectData, products);
}

// --- Preview UI ---
export async function updatePreview(userId, docType, projectData, products) {
    const printArea = document.getElementById('print-area');
    if (!projectData) {
        printArea.innerHTML = '<p class="text-center text-gray-500">Data proyek tidak ditemukan.</p>';
        return;
    }

    const company = await getCompanyProfile();
    const client = projectData.clientId ? await getClientById(userId, projectData.clientId) : null;
    const docInfo = DOCUMENT_TEMPLATES[docType];

    const financials = calculateAllFinancials(projectData, company);
    
    const docDate = projectData.specificDetails.docDate ? new Date(projectData.specificDetails.docDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Belum diatur';

    let mainContent = '';

    switch (docType) {
        case 'penawaran':
        case 'invoice':
            mainContent = generateInvoiceOrQuotationTemplate(docType, projectData, company, client, docDate, financials);
            break;
        case 'proforma':
            mainContent = generateProformaTemplate(projectData, company, client, docDate, financials);
            break;
        case 'fakturpajak':
            mainContent = generateFakturPajakTemplate(projectData, company, client, docDate, financials);
            break;
        case 'suratjalan':
            mainContent = generateSuratJalanTemplate(projectData, company, client, docDate);
            break;
        case 'bast':
             mainContent = generateBastTemplate(projectData, company, client, docDate);
            break;
        case 'kwitansi':
            mainContent = generateKwitansiTemplate(projectData, company, client, docDate, financials);
            break;
        default:
            mainContent = '<p>Template tidak ditemukan.</p>';
    }

    const headerHtml = docType !== 'fakturpajak' ? `
        <header class="document-header">
            <div class="company-info">
                ${company.companyLogo ? `<img src="${company.companyLogo}" alt="Logo Perusahaan" class="company-logo">` : ''}
                <div class="company-details">
                    <h2 class="font-montserrat font-bold text-base text-[--deep-ocean]">${company.companyName || 'Nama Perusahaan'}</h2>
                    <p>${company.companyAddress || 'Alamat Perusahaan'}</p>
                    <p>Email: ${company.companyEmail || ''} | Telp: ${company.companyPhone || ''}</p>
                </div>
            </div>
            <div class="document-title">
                <h1 class="font-montserrat font-bold text-xl text-[--deep-ocean]">${docInfo.title}</h1>
                <p class="font-montserrat text-sm text-[--limitless-sky]">${docInfo.subtitle || ''}</p>
            </div>
        </header>` : '';

    const footerHtml = docType !== 'fakturpajak' ? `
        <footer class="document-footer">
            <p><strong>${company.companyName || ''}</strong></p>
            <p>NPWP: ${company.companyNpwp || ''}</p>
            <p>${company.companyWebsite || ''}</p>
        </footer>` : '';

    printArea.innerHTML = `
        <div class="document-wrapper">
            ${headerHtml}
            <main class="document-body">
                ${mainContent}
            </main>
            ${footerHtml}
        </div>
    `;
}

// --- Modals UI ---
export async function showCompanyProfileModal() {
    const modal = document.getElementById('company-profile-modal');
    modal.innerHTML = COMPANY_MODAL_TEMPLATE;
    modal.style.display = 'block';
    const profile = await getCompanyProfile();
    Object.keys(profile).forEach(key => {
        const el = modal.querySelector(`#${key}`);
        if (el) {
            if (el.type === 'checkbox') el.checked = profile[key];
            else el.value = profile[key];
        }
    });
}

export async function showClientsModal(userId) {
    const modal = document.getElementById('clients-modal');
    modal.innerHTML = CLIENTS_MODAL_TEMPLATE;
    modal.style.display = 'block';
    setLoading(true, 'Memuat daftar klien...');
    const clientList = await getClients(userId);
    renderClientsList(clientList);
    setLoading(false);
}
export function renderClientsList(clients) {
    const listContainer = document.getElementById('clients-list');
    if (!listContainer) return;
    if (clients.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-500 p-4">Belum ada klien.</p>`;
        return;
    }
    listContainer.innerHTML = clients.map(client => `
        <div class="p-3 border-b flex justify-between items-center hover:bg-white">
            <div>
                <p class="font-semibold">${client.name}</p>
                <p class="text-xs text-gray-500">${client.clientEmail || 'No Email'}</p>
                <p class="text-xs text-gray-500">NPWP: ${client.npwp || 'N/A'}</p>
            </div>
            <div class="flex gap-3"><button data-id="${client.id}" class="edit-client-btn text-[--limitless-sky] text-xs font-bold">EDIT</button><button data-id="${client.id}" class="delete-client-btn text-red-500 text-xs font-bold">HAPUS</button></div>
        </div>`).join('');
}

export async function showVendorsModal(userId) {
    const modal = document.getElementById('vendors-modal');
    modal.innerHTML = VENDORS_MODAL_TEMPLATE;
    modal.style.display = 'block';
    setLoading(true, 'Memuat daftar vendor...');
    const vendorList = await getVendors(userId);
    renderVendorsList(vendorList);
    setLoading(false);
}
export function renderVendorsList(vendors) {
    const listContainer = document.getElementById('vendors-list');
    if (!listContainer) return;
    if (vendors.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-500 p-4">Belum ada vendor.</p>`;
        return;
    }
    listContainer.innerHTML = vendors.map(vendor => `
        <div class="p-3 border-b flex justify-between items-center hover:bg-white">
            <div>
                <p class="font-semibold">${vendor.name}</p>
                <p class="text-xs text-gray-500">${vendor.email || 'No Email'}</p>
                <p class="text-xs text-gray-500">NPWP: ${vendor.npwp || 'N/A'}</p>
            </div>
            <div class="flex gap-3"><button data-id="${vendor.id}" class="edit-vendor-btn text-[--limitless-sky] text-xs font-bold">EDIT</button><button data-id="${vendor.id}" class="delete-vendor-btn text-red-500 text-xs font-bold">HAPUS</button></div>
        </div>`).join('');
}

export function showPurchaseRequisitionModal(prData, allItems) {
    const modal = document.getElementById('pr-modal');
    modal.innerHTML = PR_MODAL_TEMPLATE;
    modal.style.display = 'block';

    const itemsForPR = allItems.filter(i => i.category === 'raw_material' || i.category === 'product');

    if (prData) { // Editing existing PR
        document.getElementById('editPrId').value = prData.id;
        document.getElementById('prRequester').value = prData.requester;
        document.getElementById('prDate').value = prData.createdAt;
        document.getElementById('prJustification').value = prData.justification;
        prData.items.forEach(item => addPurchaseRequisitionItemRow(itemsForPR, item));
    } else { // New PR
        document.getElementById('pr-form').reset();
        document.getElementById('editPrId').value = '';
        document.getElementById('prDate').valueAsDate = new Date();
        addPurchaseRequisitionItemRow(itemsForPR);
    }
    
    document.getElementById('add-pr-item-btn').addEventListener('click', () => addPurchaseRequisitionItemRow(itemsForPR));

    document.getElementById('pr-items-container').addEventListener('click', (e) => {
        if (e.target.matches('.remove-pr-item-btn')) {
            e.target.closest('.pr-item-row').remove();
        }
    });
}

function addPurchaseRequisitionItemRow(items, item = { id: '', quantity: 1 }) {
    const container = document.getElementById('pr-items-container');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'grid grid-cols-12 gap-2 mb-2 pr-item-row';

    const itemOptions = items.map(p => 
        `<option value="${p.id}" ${item.id === p.id ? 'selected' : ''}>${p.name} (${p.code})</option>`
    ).join('');

    itemDiv.innerHTML = `
        <select class="col-span-8 p-2 border rounded pr-item-id-select text-sm" required>
            <option value="">-- Pilih Item --</option>
            ${itemOptions}
        </select>
        <input type="number" value="${item.quantity}" min="1" placeholder="Qty" class="col-span-3 p-2 border rounded pr-item-qty" required>
        <button type="button" class="col-span-1 bg-red-500 text-white rounded remove-pr-item-btn">&times;</button>
    `;
    container.appendChild(itemDiv);
}

export function populatePOEditor(data, vendors, isEditing = false) {
    const form = document.getElementById('po-form');
    form.reset();
    
    document.getElementById('po-editor-title').textContent = isEditing ? 'Edit Purchase Order (PO)' : 'Buat Purchase Order (PO)';

    const vendorSelect = document.getElementById('poVendorId');
    vendorSelect.innerHTML = '<option value="">-- Pilih Vendor --</option>' + vendors.map(v => `<option value="${v.id}">${v.name}</option>`).join('');

    const itemsContainer = document.getElementById('po-items-container');
    itemsContainer.innerHTML = '';

    if (isEditing) { // Editing existing PO
        const poData = data;
        document.getElementById('poId').value = poData.id;
        document.getElementById('prRefId').value = poData.prRefId;
        document.getElementById('poDate').value = poData.createdAt;
        vendorSelect.value = poData.vendorId;
        document.getElementById('poStatus').value = poData.status;

        poData.items.forEach(item => {
            addPOItemRow(item);
        });
    } else { // Creating new PO from PR
        const prData = data;
        document.getElementById('poId').value = `PO-${Date.now()}`;
        document.getElementById('prRefId').value = prData.id;
        document.getElementById('poDate').valueAsDate = new Date();
        document.getElementById('poStatus').value = 'PO Issued';

        prData.items.forEach(item => {
            addPOItemRow({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                price: 0 // Default price to 0, user must fill it
            });
        });
    }
}

function addPOItemRow(item) {
    const itemsContainer = document.getElementById('po-items-container');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'grid grid-cols-12 gap-2 mb-2 po-item-row';
    itemDiv.dataset.id = item.id;
    itemDiv.innerHTML = `
        <input type="text" value="${item.description}" class="col-span-6 p-2 border rounded bg-gray-100 po-item-desc text-sm" readonly>
        <input type="number" value="${item.quantity}" class="col-span-2 p-2 border rounded bg-gray-100 po-item-qty" readonly>
        <input type="number" value="${item.price}" min="0" placeholder="Harga Satuan" class="col-span-4 p-2 border rounded po-item-price" required>
    `;
    itemsContainer.appendChild(itemDiv);
}


export function showVendorInvoiceModal(po) {
    const modal = document.getElementById('vendor-invoice-modal');
    modal.innerHTML = VENDOR_INVOICE_MODAL_TEMPLATE;
    modal.style.display = 'block';

    document.getElementById('refPoId').value = po.id;
    document.getElementById('vendorInvoiceDate').valueAsDate = new Date();
    
    const poTotal = po.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const poTotalEl = document.getElementById('poTotalAmount');
    poTotalEl.textContent = formatCurrency(poTotal);
    
    const invoiceAmountInput = document.getElementById('vendorInvoiceAmount');
    const matchStatusEl = document.getElementById('match-status');
    const saveBtn = document.getElementById('save-vendor-invoice-btn');

    invoiceAmountInput.addEventListener('input', () => {
        const invoiceAmount = parseFloat(invoiceAmountInput.value) || 0;
        if (invoiceAmount === poTotal) {
            matchStatusEl.textContent = 'COCOK';
            matchStatusEl.className = 'text-sm font-bold mt-1 text-green-600';
            saveBtn.disabled = false;
        } else {
            matchStatusEl.textContent = 'TIDAK COCOK';
            matchStatusEl.className = 'text-sm font-bold mt-1 text-red-600';
            saveBtn.disabled = true;
        }
    });
}

export function showInventoryModal(userId, allItems, activeCategory = 'product', itemToEdit = null, rawMaterials = []) {
    const modal = document.getElementById('inventory-modal');
    modal.innerHTML = INVENTORY_MODAL_TEMPLATE;
    modal.style.display = 'block';

    const form = document.getElementById('inventory-form');
    const tabs = document.querySelectorAll('.inventory-tab');
    const listTitle = document.getElementById('inventory-list-title');

    function switchTab(category) {
        tabs.forEach(tab => {
            tab.classList.toggle('active-tab', tab.dataset.category === category);
        });
        document.getElementById('itemCategory').value = category;
        listTitle.textContent = `Daftar ${category.replace('_', ' ')}`;
        
        document.querySelectorAll('.form-field-wrapper').forEach(wrapper => {
            wrapper.style.display = wrapper.dataset.category.includes(category) ? 'block' : 'none';
        });

        renderInventoryList(allItems, category);
        form.reset();
        document.getElementById('editItemId').value = '';
        document.getElementById('bom-items-container').innerHTML = '';
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.category));
    });

    document.getElementById('add-bom-item-btn').addEventListener('click', () => {
        addBomItemRow(rawMaterials);
    });

    document.getElementById('bom-items-container').addEventListener('click', e => {
        if (e.target.matches('.remove-bom-item-btn')) {
            e.target.closest('.bom-item-row').remove();
        }
    });

    if (itemToEdit) {
        switchTab(itemToEdit.category);
        document.getElementById('editItemId').value = itemToEdit.id;
        document.getElementById('itemCode').value = itemToEdit.code;
        document.getElementById('itemName').value = itemToEdit.name;
        document.getElementById('itemUnit').value = itemToEdit.unit;
        
        if (itemToEdit.category !== 'asset') {
            document.getElementById('itemStock').value = itemToEdit.stock || 0;
        }
        if (itemToEdit.category === 'product') {
            document.getElementById('itemPrice').value = itemToEdit.price || 0;
            if (itemToEdit.bom) {
                itemToEdit.bom.forEach(bomItem => addBomItemRow(rawMaterials, bomItem));
            }
        }
        if (itemToEdit.category === 'asset') {
            document.getElementById('assetPurchaseDate').value = itemToEdit.purchaseDate || '';
            document.getElementById('assetPurchaseValue').value = itemToEdit.purchaseValue || 0;
            document.getElementById('assetUsefulLife').value = itemToEdit.usefulLife || 0;
        }
    } else {
        switchTab(activeCategory);
    }
}

function addBomItemRow(rawMaterials, bomItem = { id: '', quantity: 1 }) {
    const container = document.getElementById('bom-items-container');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'grid grid-cols-12 gap-2 bom-item-row';

    const options = rawMaterials.map(item => `<option value="${item.id}" ${item.id === bomItem.id ? 'selected' : ''}>${item.name}</option>`).join('');

    itemDiv.innerHTML = `
        <select class="col-span-7 p-1 border rounded bom-item-select text-xs">
            <option value="">Pilih Bahan Baku</option>
            ${options}
        </select>
        <input type="number" value="${bomItem.quantity}" min="0" placeholder="Qty" class="col-span-4 p-1 border rounded bom-item-qty text-xs">
        <button type="button" class="col-span-1 bg-red-500 text-white rounded remove-bom-item-btn text-xs">&times;</button>
    `;
    container.appendChild(itemDiv);
}

function renderInventoryList(allItems, category) {
    const listContainer = document.getElementById('inventory-list');
    const filteredItems = allItems.filter(item => item.category === category);
    
    if (filteredItems.length === 0) {
        listContainer.innerHTML = `<p class="text-center text-gray-500 p-4">Belum ada item.</p>`;
        return;
    }

    let html = '';
    filteredItems.forEach(item => {
        let detailsHtml = '';
        if (category === 'product') {
            detailsHtml = `<p class="text-sm text-gray-600">Stok: <span class="font-bold">${item.stock || 0}</span> ${item.unit} | Harga: <span class="font-bold">${formatCurrency(item.price)}</span></p>`;
        } else if (category === 'raw_material' || category === 'consumable') {
            detailsHtml = `<p class="text-sm text-gray-600">Stok: <span class="font-bold">${item.stock || 0}</span> ${item.unit}</p>`;
        } else if (category === 'asset') {
            const { bookValue, isDepreciated } = calculateDepreciation(item);
            const warningClass = isDepreciated ? 'bg-red-100 text-red-700' : '';
            detailsHtml = `<p class="text-sm text-gray-600">Nilai Buku: <span class="font-bold">${formatCurrency(bookValue)}</span> <span class="text-xs px-2 py-0.5 rounded ${warningClass}">${isDepreciated ? 'Telah Terdepresiasi' : ''}</span></p>`;
        }

        html += `
            <div class="p-3 border-b flex justify-between items-center hover:bg-white">
                <div>
                    <p class="font-semibold">${item.name} <span class="text-xs text-gray-500">(${item.code})</span></p>
                    ${detailsHtml}
                </div>
                <div class="flex gap-3">
                    <button data-id="${item.id}" class="edit-item-btn text-[--limitless-sky] text-xs font-bold">EDIT</button>
                    <button data-id="${item.id}" class="delete-item-btn text-red-500 text-xs font-bold">HAPUS</button>
                </div>
            </div>`;
    });
    listContainer.innerHTML = html;
}

function calculateDepreciation(asset) {
    if (!asset.purchaseDate || !asset.purchaseValue || !asset.usefulLife) {
        return { bookValue: asset.purchaseValue || 0, isDepreciated: false };
    }
    const purchaseDate = new Date(asset.purchaseDate);
    const now = new Date();
    const monthsElapsed = (now.getFullYear() - purchaseDate.getFullYear()) * 12 + (now.getMonth() - purchaseDate.getMonth());
    
    const monthlyDepreciation = asset.purchaseValue / asset.usefulLife;
    const accumulatedDepreciation = Math.min(monthlyDepreciation * monthsElapsed, asset.purchaseValue);
    const bookValue = asset.purchaseValue - accumulatedDepreciation;
    
    return {
        bookValue: bookValue,
        isDepreciated: bookValue <= 0
    };
}

export function showConsumableUsageModal(consumables) {
    const modal = document.getElementById('consumable-usage-modal');
    modal.innerHTML = CONSUMABLE_USAGE_MODAL_TEMPLATE;
    
    const select = document.getElementById('usageItemId');
    select.innerHTML = '<option value="">-- Pilih Item --</option>' + consumables.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    document.getElementById('usageDate').valueAsDate = new Date();
    modal.style.display = 'block';
}


export async function showEmailModal(userId, projectData) {
    const modal = document.getElementById('email-modal');
    const company = await getCompanyProfile();
    const client = projectData.clientId ? await getClientById(userId, projectData.clientId) : null;

    if (!client || !client.clientEmail) {
        showToast('Email klien belum diatur. Harap lengkapi data klien terlebih dahulu.', 'error');
        return;
    }
    
    const { grandTotal } = calculateAllFinancials(projectData, company);

    const emailSubject = `Penawaran: ${projectData.subject} dari ${company.companyName}`;
    const defaultBody = `Kepada Yth. ${client.pic || client.name},\n\nDengan hormat,\n\nMenindaklanjuti pembicaraan kita sebelumnya, bersama ini kami dari ${company.companyName} mengajukan penawaran harga untuk pekerjaan "${projectData.subject}".\nTotal nilai penawaran adalah ${formatCurrency(grandTotal)}.\n\nDetail lengkap penawaran terlampir dalam dokumen PDF.\n\nApabila ada pertanyaan lebih lanjut, jangan ragu untuk menghubungi kami. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.\n\nHormat kami,\n\n${company.directorName || ''}\n${company.companyName}\n${company.companyPhone || ''}\n${company.companyEmail || ''}`;
    
    const mailtoLink = `mailto:${client.clientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(defaultBody)}`;

    modal.innerHTML = EMAIL_MODAL_TEMPLATE
        .replace('{clientEmail}', client.clientEmail)
        .replace('{subject}', emailSubject)
        .replace('{body}', defaultBody.trim().replace(/^\s+/gm, ''))
        .replace('{mailtoLink}', mailtoLink);

    modal.style.display = 'block';

    document.getElementById('generate-email-ai-btn').onclick = async () => {
        const button = document.getElementById('generate-email-ai-btn');
        const buttonText = document.getElementById('ai-button-text');
        const spinner = document.getElementById('ai-spinner');
        const emailBodyEl = document.getElementById('email-body');

        button.disabled = true;
        buttonText.textContent = 'Membuat...';
        spinner.classList.remove('hidden');
        emailBodyEl.value = 'Menghubungi AI, mohon tunggu...';

        try {
            const prompt = `Buatkan draf email penawaran yang profesional, ramah, dan persuasif dalam Bahasa Indonesia.
            - Nama saya: ${company.directorName} dari ${company.companyName}.
            - Email untuk: ${client.pic || client.name} dari ${client.name}.
            - Nama proyek/pekerjaan: "${projectData.subject}".
            - Total nilai penawaran: ${formatCurrency(grandTotal)}.
            - Sampaikan bahwa detail terlampir dalam PDF.
            - Gunakan gaya bahasa yang sopan dan bisnis.
            - Akhiri dengan salam, nama, jabatan, perusahaan, dan kontak saya.`;

            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = ""; // API key is handled by the environment
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                const aiText = result.candidates[0].content.parts[0].text;
                emailBodyEl.value = aiText;
                document.getElementById('mailto-link').href = `mailto:${client.clientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(aiText)}`;
            } else {
                throw new Error('Invalid response structure from AI.');
            }
        } catch (error) {
            console.error("AI email generation failed:", error);
            emailBodyEl.value = `Gagal membuat email dengan AI. Silakan gunakan template standar.\n\nError: ${error.message}`;
        } finally {
            button.disabled = false;
            buttonText.textContent = 'Buat dengan AI';
            spinner.classList.add('hidden');
        }
    };
}

export function showPaymentModal(projectData) {
    const modalContainer = document.getElementById('payment-modal');
    modalContainer.innerHTML = PAYMENT_MODAL_TEMPLATE;
    modalContainer.style.display = 'block';
    document.getElementById('paymentDate').valueAsDate = new Date();
}

function calculateAllFinancials(projectData, company) {
    const subtotal = (projectData.items || []).reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const discountAmount = subtotal * ((projectData.specificDetails?.discount || 0) / 100);
    const dpp = subtotal - discountAmount;
    const ppnRate = company.ppnRate || 11;
    const isPPNApplicable = projectData.specificDetails?.isPPN ?? (company.isPKP || false);
    const ppnAmount = isPPNApplicable ? dpp * (ppnRate / 100) : 0;
    const grandTotal = dpp + ppnAmount;
    
    const isMeteraiApplicable = projectData.specificDetails?.applyMeterai;
    const meteraiAmount = isMeteraiApplicable ? 10000 : 0;
    const finalTotal = grandTotal + meteraiAmount;

    const totalPaid = (projectData.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const amountDue = finalTotal - totalPaid;

    const dpPercentage = projectData.specificDetails?.hasDp ? (parseFloat(projectData.specificDetails.dpPercentage) || 0) : 0;
    const dpAmount = grandTotal * (dpPercentage / 100);
    
    const isProformaPaid = (projectData.payments || []).some(p => p.notes.includes('via Proforma'));

    return { subtotal, discountAmount, dpp, ppnAmount, grandTotal, meteraiAmount, finalTotal, isPPNApplicable, isMeteraiApplicable, ppnRate, totalPaid, amountDue, dpAmount, isProformaPaid };
}

export function formatCurrency(amount) {
    return "Rp " + new Intl.NumberFormat('id-ID').format(amount || 0);
}

function terbilang(n) {
    if (n === 0) return "Nol";
    const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let result = "";
    const toWords = (num) => {
        if (num < 12) return satuan[num];
        if (num < 20) return toWords(num - 10) + " Belas";
        if (num < 100) return satuan[Math.floor(num / 10)] + " Puluh " + toWords(num % 10);
        if (num < 200) return "Seratus " + toWords(num - 100);
        if (num < 1000) return toWords(Math.floor(num / 100)) + " Ratus " + toWords(num % 100);
        if (num < 2000) return "Seribu " + toWords(num - 1000);
        if (num < 1000000) return toWords(Math.floor(num / 1000)) + " Ribu " + toWords(num % 1000);
        if (num < 1000000000) return toWords(Math.floor(num / 1000000)) + " Juta " + toWords(num % 1000000);
        return "";
    };
    result = toWords(n);
    return result.replace(/\s+/g, ' ').trim();
}

// Template Functions
function generateInvoiceOrQuotationTemplate(docType, projectData, company, client, docDate, financials) {
    const { subtotal, discountAmount, dpp, ppnAmount, grandTotal, meteraiAmount, finalTotal, isPPNApplicable, isMeteraiApplicable, ppnRate, totalPaid, amountDue, dpAmount, isProformaPaid } = financials;
    const itemsHtml = (projectData.items || []).map((item, index) => `<tr class="border-b border-gray-200"><td class="py-2 px-1 text-center align-top">${index + 1}</td><td class="py-2 px-2 align-top">${(item.description || '').replace(/\n/g, '<br class="ml-4">')}</td><td class="py-2 px-1 text-center align-top">${item.quantity || ''}</td><td class="py-2 px-2 text-right align-top">${item.price > 0 ? formatCurrency(item.price) : ''}</td><td class="py-2 px-2 text-right align-top">${(item.quantity * item.price) > 0 ? formatCurrency(item.quantity * item.price) : ''}</td></tr>`).join('');
    let totalsHtml = `<div class="total-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>${discountAmount > 0 ? `<div class="total-row text-red-600"><span>Diskon (${projectData.specificDetails.discount}%)</span><span>- ${formatCurrency(discountAmount)}</span></div>` : ''}${isPPNApplicable ? `<div class="total-row"><span>DPP</span><span>${formatCurrency(dpp)}</span></div><div class="total-row"><span>PPN (${ppnRate}%)</span><span>${formatCurrency(ppnAmount)}</span></div>` : ''}<div class="total-row grand-total"><span class="font-montserrat">GRAND TOTAL</span><span>${formatCurrency(grandTotal)}</span></div>${isMeteraiApplicable ? `<div class="total-row"><span>Bea Materai</span><span>${formatCurrency(meteraiAmount)}</span></div>` : ''}${isProformaPaid && docType === 'invoice' ? `<div class="total-row text-green-600"><span>Uang Muka (DP)</span><span>- ${formatCurrency(dpAmount)}</span></div>` : ''}<div class="total-row final-total"><span class="font-montserrat">TOTAL TAGIHAN</span><span>${formatCurrency(finalTotal - (isProformaPaid && docType === 'invoice' ? dpAmount : 0))}</span></div>`;
    if (docType === 'invoice' && totalPaid > 0) { const currentTotalTagihan = finalTotal - (isProformaPaid ? dpAmount : 0); const sisaTagihan = currentTotalTagihan - (totalPaid - (isProformaPaid ? dpAmount : 0)); totalsHtml += `<div class="total-row text-green-600 mt-2"><span>Telah Dibayar (non-DP)</span><span>- ${formatCurrency(totalPaid - (isProformaPaid ? dpAmount : 0))}</span></div><div class="total-row final-total"><span class="font-montserrat">SISA TAGIHAN</span><span>${formatCurrency(sisaTagihan)}</span></div>`; }
    const paymentTermText = (projectData.specificDetails?.paymentTerm || '').replace(/\n/g, '<br>');
    const paymentSection = docType === 'invoice' ? `<div class="payment-section"><h4 class="font-bold mb-2 font-montserrat">Riwayat Pembayaran</h4>${(projectData.payments && projectData.payments.length > 0) ? `<table class="w-full text-xs border"><thead class="bg-gray-50"><tr><th class="p-1 text-left">Tanggal</th><th class="p-1 text-left">Catatan</th><th class="p-1 text-right">Jumlah</th></tr></thead><tbody>${projectData.payments.map(p => `<tr><td class="p-1 border-t">${new Date(p.date).toLocaleDateString('id-ID')}</td><td class="p-1 border-t">${p.notes}</td><td class="p-1 border-t text-right">${formatCurrency(p.amount)}</td></tr>`).join('')}</tbody></table>` : '<p class="text-xs text-gray-500">Belum ada pembayaran.</p>'}<button id="add-payment-btn" class="no-print bg-[--sunrise-gold] text-xs text-[--deep-ocean] font-bold py-1 px-3 rounded-md mt-2">Catat Pembayaran</button></div>` : `<div><h4 class="font-bold mb-1 font-montserrat">Informasi Pembayaran</h4><div class="prose prose-xs whitespace-pre-wrap">${company.companyPaymentInfo || ''}</div></div>`;
    const invoiceRefs = docType === 'invoice' ? `${projectData.docNumbers?.penawaran ? `<p><strong>Ref. Penawaran:</strong> ${projectData.docNumbers.penawaran}</p>`: ''}${projectData.specificDetails?.poNumber ? `<p><strong>Ref. PO:</strong> ${projectData.specificDetails.poNumber}</p>`: ''}${projectData.docNumbers?.proforma ? `<p><strong>Ref. Proforma:</strong> ${projectData.docNumbers.proforma}</p>`: ''}` : '';
    return `<div class="document-meta"><div class="client-info"><p class="meta-title">Ditujukan Kepada:</p><p class="font-bold">${client?.name || ''}</p><p>${client?.clientDepartment || ''}</p><p>${client?.address || ''}</p><p class="mt-1"><strong>Up.</strong> ${client?.pic || ''}</p></div><div class="doc-details"><p><strong>Nomor:</strong> ${projectData.docNumbers[docType] || projectData.projectId}</p><p><strong>Tanggal:</strong> ${docDate}</p>${docType === 'invoice' && projectData.specificDetails.dueDate ? `<p><strong>Jatuh Tempo:</strong> ${new Date(projectData.specificDetails.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>` : ''}${invoiceRefs}</div></div><div class="mt-4"><p><strong>Perihal:</strong> ${projectData.subject || ''}</p></div><table class="items-table"><thead><tr><th class="w-[5%]">No.</th><th class="w-[45%] text-left">Deskripsi</th><th class="w-[10%]">Kuantitas</th><th class="w-[20%]">Harga (IDR)</th><th class="w-[20%]">Jumlah (IDR)</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="summary-section"><div class="terbilang-section"><p class="font-bold font-montserrat">Terbilang:</p><p class="terbilang-text">${terbilang(isMeteraiApplicable ? finalTotal : grandTotal)} Rupiah</p></div><div class="totals-section">${totalsHtml}</div></div><div class="terms-section"><div><h4 class="font-bold mb-1 font-montserrat">Termin Pembayaran</h4><p>${paymentTermText}</p></div>${paymentSection}</div>${docType !== 'invoice' ? `<div class="terms-full"><h4 class="font-bold mb-1 font-montserrat">Syarat dan Ketentuan</h4><div class="prose prose-xs whitespace-pre-wrap">${company.companyTerms || ''}</div></div>` : ''}<div class="signature-area"><div class="signature-box"><p>Hormat kami,</p><p class="font-bold">${company.companyName || ''}</p><div class="signature-space">${company.companyStamp ? `<img src="${company.companyStamp}" alt="Stempel Perusahaan" class="stamp">` : ''}${isMeteraiApplicable ? `<span class="meterai-label">E-METERAI<br>10000</span>` : ''}</div><p class="signature-name">${company.directorName || '( NAMA DIREKTUR )'}</p><p class="font-montserrat">Direktur/CEO</p></div><div class="signature-box">
    
    </div></div>`;
}
function generateProformaTemplate(projectData, company, client, docDate, financials) {
    const { grandTotal, dpAmount, isProformaPaid } = financials;
    const dpPercentage = projectData.specificDetails.dpPercentage || 50;
    const paymentButton = !isProformaPaid ? `<div class="no-print mt-4 text-right"><button id="mark-proforma-paid-btn" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Tandai Sudah Dibayar</button></div>` : `<div class="mt-4 text-right text-green-600 font-bold"><p>UANG MUKA SUDAH DIBAYAR</p></div>`;
    return `<div class="document-meta"><div class="client-info"><p class="meta-title">Ditujukan Kepada:</p><p class="font-bold">${client?.name || ''}</p><p>${client?.address || ''}</p></div><div class="doc-details"><p><strong>Nomor Proforma:</strong> ${projectData.docNumbers.proforma}</p><p><strong>Tanggal:</strong> ${docDate}</p><p><strong>Ref. Penawaran:</strong> ${projectData.docNumbers?.penawaran || 'N/A'}</p><p><strong>Ref. PO:</strong> ${projectData.specificDetails.poNumber || ''}</p></div></div><div class="mt-8"><p><strong>Perihal: Pembayaran Uang Muka (Down Payment) untuk ${projectData.subject || ''}</strong></p></div><table class="items-table mt-4"><thead class="bg-white"><tr><th class="w-[70%] text-left font-bold">Deskripsi</th><th class="w-[30%] text-right font-bold">Jumlah</th></tr></thead><tbody><tr class="border-b border-gray-200"><td class="py-2 px-2">Total Nilai Proyek (termasuk PPN jika berlaku)</td><td class="py-2 px-2 text-right">${formatCurrency(grandTotal)}</td></tr><tr class="border-b border-gray-200"><td class="py-2 px-2">Uang Muka (${dpPercentage}%)</td><td class="py-2 px-2 text-right">${formatCurrency(dpAmount)}</td></tr></tbody><tfoot><tr class="font-bold bg-[--calm-gray]"><td class="py-2 px-2 text-right">TOTAL TAGIHAN</td><td class="py-2 px-2 text-right">${formatCurrency(dpAmount)}</td></tr></tfoot></table><div class="summary-section mt-4"><div class="terbilang-section"><p class="font-bold font-montserrat">Terbilang:</p><p class="terbilang-text">${terbilang(dpAmount)} Rupiah</p></div></div><div class="terms-section"><div><h4 class="font-bold mb-1 font-montserrat">Informasi Pembayaran</h4><div class="prose prose-xs whitespace-pre-wrap">${company.companyPaymentInfo || ''}</div></div></div><div class="signature-area" style="grid-template-columns: 1fr;"><div class="signature-box" style="margin-left: auto; margin-right: 0; text-align: center;"><p>Hormat kami,</p><p class="font-bold">${company.companyName || ''}</p><div class="signature-space">${company.companyStamp ? `<img src="${company.companyStamp}" alt="Stempel Perusahaan" class="stamp">` : ''}</div><p class="signature-name">${company.directorName || '( NAMA DIREKTUR )'}</p><p class="font-montserrat">Direktur/CEO</p></div></div>${paymentButton}`;
}
function generateFakturPajakTemplate(projectData, company, client, docDate, financials) {
    const { subtotal, discountAmount, dpp, ppnAmount, ppnRate } = financials;
    const nsfp = projectData.specificDetails?.nsfp || 'NOMOR SERI FAKTUR PAJAK BELUM DIISI';
    return `<div class="faktur-pajak-wrapper"><div class="fp-header"><div class="fp-code-title"><p>Kode dan Nomor Seri Faktur Pajak:</p><p class="fp-nsfp">${nsfp}</p></div><h3 class="fp-main-title">FAKTUR PAJAK</h3></div><div class="fp-section"><h4 class="fp-section-title">Pengusaha Kena Pajak</h4><table class="fp-table-meta"><tr><td class="w-1/4">Nama</td><td>: ${company.companyName || ''}</td></tr><tr><td class="align-top">Alamat</td><td class="align-top">: ${company.companyAddress || ''}</td></tr><tr><td>NPWP</td><td>: ${company.companyNpwp || ''}</td></tr></table></div><div class="fp-section"><h4 class="fp-section-title">Pembeli Barang Kena Pajak / Penerima Jasa Kena Pajak</h4><table class="fp-table-meta"><tr><td class="w-1/4">Nama</td><td>: ${client?.name || ''}</td></tr><tr><td class="align-top">Alamat</td><td class="align-top">: ${client?.address || ''}</td></tr><tr><td>NPWP</td><td>: ${client?.npwp || '00.000.000.0-000.000'}</td></tr></table></div><table class="items-table fp-items-table mt-4"><thead><tr><th class="w-[5%]">No.</th><th class="w-[55%] text-left">Nama Barang Kena Pajak / Jasa Kena Pajak</th><th class="w-[40%] text-right">Harga Jual/Penggantian/Uang Muka/Termin (Rp)</th></tr></thead><tbody>${(projectData.items || []).map((item, index) => `<tr class="border-b border-gray-200"><td class="py-2 px-1 text-center align-top">${index + 1}</td><td class="py-2 px-2 align-top">${(item.description || '').replace(/\n/g, '<br>')}</td><td class="py-2 px-2 text-right align-top">${formatCurrency((item.quantity || 0) * (item.price || 0))}</td></tr>`).join('')}<tr><td colspan="3" style="padding: 1rem;"></td></tr></tbody><tfoot><tr><td colspan="2" class="text-right px-2 py-1 font-bold">Harga Jual/Penggantian</td><td class="text-right px-2 py-1">${formatCurrency(subtotal)}</td></tr><tr><td colspan="2" class="text-right px-2 py-1 font-bold">Dikurangi Potongan Harga</td><td class="text-right px-2 py-1">${formatCurrency(discountAmount)}</td></tr><tr><td colspan="2" class="text-right px-2 py-1 font-bold">Dikurangi Uang Muka yang telah diterima</td><td class="text-right px-2 py-1">0</td></tr><tr><td colspan="2" class="text-right px-2 py-1 font-bold">Dasar Pengenaan Pajak</td><td class="text-right px-2 py-1 font-bold">${formatCurrency(dpp)}</td></tr><tr><td colspan="2" class="text-right px-2 py-1 font-bold">PPN = ${ppnRate}% x Dasar Pengenaan Pajak</td><td class="text-right px-2 py-1 font-bold">${formatCurrency(ppnAmount)}</td></tr></tfoot></table><div class="terbilang-section mt-4"><p class="font-bold font-montserrat text-sm">Jumlah PPN Terutang Terbilang:</p><p class="terbilang-text">${terbilang(ppnAmount)} Rupiah</p></div><div class="signature-area mt-8"><div class="signature-box" style="margin-left: auto; margin-right: 0; text-align: center;"><p>${(company.companyAddress || 'Jakarta').split(',').slice(-2, -1)[0]?.trim()}, ${docDate}</p><p class="mt-2 text-xs">Sesuai dengan ketentuan yang berlaku, Direktorat Jenderal Pajak mengatur bahwa Faktur Pajak ini telah ditandatangani secara elektronik sehingga tidak diperlukan tanda tangan basah pada Faktur Pajak ini.</p><p class="signature-name mt-4">${company.directorName || '( NAMA DIREKTUR )'}</p><p class="font-montserrat text-xs">Nama Jelas Pejabat yang Berwenang</p></div></div></div>`;
}
function generateKwitansiTemplate(projectData, company, client, docDate, financials) {
    const { finalTotal, totalPaid } = financials;
    const paymentToAcknowledge = totalPaid > 0 ? totalPaid : finalTotal;
    const showMeteraiBox = projectData.specificDetails.applyMeteraiKwitansi;
    const city = (company.companyAddress || '').split(',').slice(-2, -1)[0]?.trim() || '';
    return `<div class="kwitansi-box"><div class="kwitansi-row"><span class="kwitansi-label">No.</span><span class="kwitansi-value">: ${projectData.docNumbers.kwitansi}</span></div><div class="kwitansi-row mt-4"><span class="kwitansi-label">Telah Diterima Dari</span><span class="kwitansi-value">: ${client?.name || ''}</span></div><div class="kwitansi-row"><span class="kwitansi-label">Uang Sejumlah</span><span class="kwitansi-value terbilang-kwitansi">: ${terbilang(paymentToAcknowledge)} Rupiah</span></div><div class="kwitansi-row"><span class="kwitansi-label">Untuk Pembayaran</span><span class="kwitansi-value">: ${projectData.status === 'Lunas' ? 'Pelunasan' : 'Pembayaran'} Proyek ${projectData.subject} (Invoice No. ${projectData.docNumbers?.invoice || 'N/A'})</span></div><div class="kwitansi-footer"><div class="kwitansi-total">${formatCurrency(paymentToAcknowledge)}</div><div class="signature-box" style="text-align: center;"><p>${city}, ${docDate}</p><div class="signature-space">${company.companyStamp ? `<img src="${company.companyStamp}" alt="Stempel Perusahaan" class="stamp">` : ''}${showMeteraiBox ? `<div class="meterai-box">MATERAI<br>TEMPEL</div>` : ''}</div><p class="signature-name">${company.directorName || '( NAMA DIREKTUR )'}</p></div></div></div>`;
}
function generateSuratJalanTemplate(projectData, company, client, docDate) {
    const itemsHtml = (projectData.items || []).map((item, index) => `
        <tr class="border-b border-gray-200"><td class="py-2 px-1 text-center align-top">${index + 1}</td><td class="py-2 px-2 align-top">${(item.description || '').replace(/\n/g, '<br class="ml-4">')}</td><td class="py-2 px-1 text-center align-top">${item.quantity || ''}</td><td class="py-2 px-1 text-center align-top">Unit</td></tr>`).join('');
    
    const actionButton = !projectData.stockDeducted
        ? `<div class="no-print mt-6 text-right"><button id="confirm-delivery-btn" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Konfirmasi Pengiriman & Kurangi Stok</button></div>`
        : `<div class="mt-6 text-right text-green-600 font-bold"><p>STOK TELAH DIKURANGI</p></div>`;

    return `
        <div class="document-meta">
            <div class="client-info"><p class="meta-title">Dikirim Kepada:</p><p class="font-bold">${client?.name || ''}</p><p>${client?.address || ''}</p><p class="mt-1"><strong>Up.</strong> ${client?.pic || ''}</p></div>
            <div class="doc-details"><p><strong>Nomor:</strong> ${projectData.docNumbers.suratjalan}</p><p><strong>Tanggal Kirim:</strong> ${docDate}</p><p><strong>Ref. Invoice:</strong> ${projectData.docNumbers?.invoice || 'N/A'}</p></div>
        </div>
        <table class="items-table mt-8"><thead><tr><th class="w-[5%]">No.</th><th class="w-[65%] text-left">Deskripsi Barang</th><th class="w-[15%]">Kuantitas</th><th class="w-[15%]">Satuan</th></tr></thead><tbody>${itemsHtml}</tbody></table>
        <div class="mt-4 text-xs"><p>Catatan: ${projectData.specificDetails.deliveryNotes || 'Barang telah diterima dalam kondisi baik dan jumlah yang cukup.'}</p></div>
        <div class="signature-area grid-cols-3 mt-8">
            <div class="signature-box"><p>Disiapkan oleh,</p><div class="signature-space"></div><p class="signature-name">( .......................... )</p><p class="font-montserrat">${company.companyName}</p></div>
            <div class="signature-box"><p>Dikirim oleh,</p><div class="signature-space"></div><p class="signature-name">( .......................... )</p><p class="font-montserrat">Kurir</p></div>
            <div class="signature-box"><p>Diterima oleh,</p><div class="signature-space"></div><p class="signature-name">( .......................... )</p><p class="font-montserrat">${client?.name}</p></div>
        </div>
        ${actionButton}
    `;
}
function generateBastTemplate(projectData, company, client, docDate) {
    const pihak1Name = projectData.specificDetails.bastPihak1Name || company.directorName;
    const pihak1Jabatan = projectData.specificDetails.bastPihak1Jabatan || 'Direktur';
    const pihak2Name = projectData.specificDetails.bastPihak2Name || client?.pic;
    const pihak2Jabatan = projectData.specificDetails.bastPihak2Jabatan || 'Perwakilan Klien';
    return `<div class="text-center mb-8"><p class="font-bold underline">BERITA ACARA SERAH TERIMA</p><p>Nomor: ${projectData.docNumbers.bast}</p></div><div class="text-sm leading-relaxed"><p>Pada hari ini, ${new Date(projectData.specificDetails.docDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, yang bertanda tangan di bawah ini:</p><table class="w-full my-4 text-sm"><tr><td class="w-[20%] align-top">Nama</td><td class="w-[5%] align-top">:</td><td class="w-[75%] font-bold">${pihak1Name}</td></tr><tr><td class="align-top">Jabatan</td><td class="align-top">:</td><td>${pihak1Jabatan}, ${company.companyName}</td></tr><tr><td class="align-top">Alamat</td><td class="align-top">:</td><td>${company.companyAddress || ''}</td></tr></table><p>Selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>.</p><table class="w-full my-4 text-sm"><tr><td class="w-[20%] align-top">Nama</td><td class="w-[5%] align-top">:</td><td class="w-[75%] font-bold">${pihak2Name}</td></tr><tr><td class="align-top">Jabatan</td><td class="align-top">:</td><td>${pihak2Jabatan}, ${client?.name || ''}</td></tr><tr><td class="align-top">Alamat</td><td class="align-top">:</td><td>${client?.address || ''}</td></tr></table><p class="mt-4">Dengan ini menyatakan bahwa <strong>PIHAK PERTAMA</strong> telah menyelesaikan dan menyerahkan hasil pekerjaan kepada <strong>PIHAK KEDUA</strong>, dan <strong>PIHAK KEDUA</strong> telah menerima hasil pekerjaan tersebut dalam keadaan baik dan lengkap. Pekerjaan yang diserahterimakan adalah sebagai berikut:</p><p class="my-2"><strong>Nama Proyek: ${projectData.subject}</strong></p><p>Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p></div><div class="signature-area mt-8"><div class="signature-box"><p><strong>PIHAK KEDUA</strong></p><p>Yang Menerima,</p><div class="signature-space"></div><p class="signature-name">( ${pihak2Name} )</p></div><div class="signature-box"><p><strong>PIHAK PERTAMA</strong></p><p>Yang Menyerahkan,</p><div class="signature-space">${company.companyStamp ? `<img src="${company.companyStamp}" alt="Stempel Perusahaan" class="stamp">` : ''}</div><p class="signature-name">( ${pihak1Name} )</p></div></div>`;
}

// --- Print Templates for Procurement ---
export function generatePOTemplate(poData, company, vendor) {
    const totalAmount = poData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const itemsHtml = poData.items.map((item, index) => `
        <tr>
            <td class="py-2 px-1 text-center align-top">${index + 1}</td>
            <td class="py-2 px-2 align-top">${item.description}</td>
            <td class="py-2 px-1 text-center align-top">${item.quantity}</td>
            <td class="py-2 px-2 text-right align-top">${formatCurrency(item.price)}</td>
            <td class="py-2 px-2 text-right align-top">${formatCurrency(item.quantity * item.price)}</td>
        </tr>
    `).join('');

    return `
        <html>
            <head>
                <title>Purchase Order - ${poData.id}</title>
                <script src="https://cdn.tailwindcss.com"><\/script>
                <style>
                    body { font-family: sans-serif; font-size: 10pt; }
                    .print-container { max-width: 800px; margin: auto; padding: 2rem; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid black; padding-bottom: 1rem; }
                    .items-table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
                    .items-table th, .items-table td { border: 1px solid #ccc; padding: 0.5rem; }
                    .items-table th { background-color: #f4f4f4; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    .signature-area { margin-top: 4rem; display: flex; justify-content: flex-end; }
                    .signature-box { text-align: center; width: 200px; }
                    .signature-space { height: 5rem; border-bottom: 1px solid #333; margin-bottom: 0.5rem; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="header">
                        <div>
                            <h1 class="text-2xl font-bold">${company.companyName || 'Nama Perusahaan'}</h1>
                            <p>${company.companyAddress || 'Alamat Perusahaan'}</p>
                        </div>
                        <div class="text-right">
                            <h2 class="text-3xl font-bold">PURCHASE ORDER</h2>
                            <p><strong>No. PO:</strong> ${poData.id}</p>
                            <p><strong>Tanggal:</strong> ${new Date(poData.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-8 mt-8">
                        <div>
                            <p class="font-bold">VENDOR:</p>
                            <p>${vendor.name}</p>
                            <p>${vendor.address}</p>
                            <p>Kontak: ${vendor.contactPerson || ''} (${vendor.phone || ''})</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold">KIRIM KE:</p>
                            <p>${company.companyName}</p>
                            <p>${company.companyAddress}</p>
                        </div>
                    </div>
                    <table class="items-table">
                        <thead>
                            <tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga Satuan</th><th>Jumlah</th></tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4" class="text-right font-bold">TOTAL</td>
                                <td class="text-right font-bold">${formatCurrency(totalAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div class="signature-area">
                        <div class="signature-box">
                            <p>Disetujui oleh,</p>
                            <div class="signature-space"></div>
                            <p class="font-bold">${company.directorName || '(Direktur)'}</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `;
}

export function generatePRTemplate(prData, company) {
    const itemsHtml = prData.items.map((item, index) => `
        <tr>
            <td class="py-2 px-1 text-center align-top">${index + 1}</td>
            <td class="py-2 px-2 align-top">${item.description}</td>
            <td class="py-2 px-1 text-center align-top">${item.quantity}</td>
        </tr>
    `).join('');

    return `
        <html>
            <head>
                <title>Purchase Requisition - ${prData.id}</title>
                <script src="https://cdn.tailwindcss.com"><\/script>
                 <style>
                    body { font-family: sans-serif; font-size: 10pt; }
                    .print-container { max-width: 800px; margin: auto; padding: 2rem; }
                    .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 1rem; margin-bottom: 2rem; }
                    .items-table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
                    .items-table th, .items-table td { border: 1px solid #ccc; padding: 0.5rem; }
                    .items-table th { background-color: #f4f4f4; }
                    .font-bold { font-weight: bold; }
                    .signature-area { margin-top: 4rem; display: flex; justify-content: space-between; text-align: center; }
                    .signature-box { width: 200px; }
                    .signature-space { height: 5rem; border-bottom: 1px solid #333; margin-bottom: 0.5rem; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="header">
                        <h1 class="text-3xl font-bold">PERMINTAAN PEMBELIAN</h1>
                        <p class="text-lg">(Purchase Requisition)</p>
                    </div>
                    <div class="grid grid-cols-2 gap-8">
                        <div>
                            <p><strong>No. PR:</strong> ${prData.id}</p>
                            <p><strong>Tanggal:</strong> ${new Date(prData.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div class="text-right">
                             <p><strong>Pemohon:</strong> ${prData.requester}</p>
                        </div>
                    </div>
                    <div class="mt-4">
                        <p><strong>Justifikasi:</strong> ${prData.justification}</p>
                    </div>
                    <table class="items-table">
                        <thead>
                            <tr><th class="w-1/12">No.</th><th class="w-8/12">Deskripsi</th><th class="w-3/12">Kuantitas</th></tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <div class="signature-area">
                        <div class="signature-box">
                            <p>Pemohon,</p>
                            <div class="signature-space"></div>
                            <p>(${prData.requester})</p>
                        </div>
                        <div class="signature-box">
                            <p>Menyetujui,</p>
                            <div class="signature-space"></div>
                            <p>(Manajer)</p>
                        </div>
                         <div class="signature-box">
                            <p>Mengetahui,</p>
                            <div class="signature-space"></div>
                            <p>(Direktur)</p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    `;
}
