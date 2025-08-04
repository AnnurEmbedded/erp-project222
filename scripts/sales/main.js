/**
 * main.js
 * Versi 2.6: Perbaikan Bug Stuck Loading & Penambahan UID
 * - FIX: Membungkus logika pemuatan data dalam try...catch untuk memastikan
 * layar loading selalu hilang, bahkan jika terjadi error.
 * - REFACTOR: Menggunakan UID pengguna secara konsisten dari window.erpShared.
 */
import { getProjects, saveProject, deleteProject, deleteMultipleProjects, getProjectById, getClients, saveClient, deleteClient, getCompanyProfile, saveCompanyProfile, getDocumentCounters, incrementDocumentCounter, getVendors, saveVendor, deleteVendor, getPurchaseRequisitions, savePurchaseRequisition, deletePurchaseRequisition, deleteMultiplePurchaseRequisitions, getPurchaseRequisitionById, savePurchaseOrder, getPurchaseOrders, getPurchaseOrderById, deletePurchaseOrder, deleteMultiplePurchaseOrders, getItems, saveItem, deleteItem, updateStock, saveConsumableUsage } from './store.js';
import { switchView, renderProjectsTable, populateForm, addItemRow, switchDocument, updatePreview, updateWorkflowUI, showCompanyProfileModal, showClientsModal, renderClientsList, showVendorsModal, renderVendorsList, showPurchaseRequisitionModal, renderPurchaseRequisitionsTable, renderPurchaseOrdersTable, populatePOEditor, showVendorInvoiceModal, showInventoryModal, showEmailModal, setLoading, showPaymentModal, setUserEmail, formatCurrency, showToast, renderAnalyticsDashboard, renderProcurementAnalyticsDashboard, generatePOTemplate, generatePRTemplate, showConsumableUsageModal } from './ui.js';
import { DOCUMENT_CODES } from './config.js';

// --- State Aplikasi ---
let currentUser = null;
let currentProject = null;
let currentDocType = 'penawaran';
let isNewProject = false;
let allClients = [];
let allProjects = [];
let allVendors = [];
let allPurchaseRequisitions = [];
let allPurchaseOrders = [];
let allItems = []; 

export async function initializeSalesModule() {
    if (window.erpShared && window.erpShared.currentUser) {
        currentUser = window.erpShared.currentUser;
        setUserEmail(currentUser.email);
        setLoading(true, 'Inisialisasi modul penjualan...');
        setupGlobalEventListeners();
        setupDashboardEventListeners();
        setupEditorEventListeners();
        setupModalEventListeners();
        await loadDashboard();
        // setLoading(false) dipanggil di dalam loadDashboard
    } else {
        console.error("Tidak dapat menginisialisasi modul sales: currentUser tidak ditemukan.");
        setLoading(false);
    }
}


// --- Routing / View Management ---
async function loadDashboard() {
    if (!currentUser) return;
    setLoading(true, 'Memuat data penjualan...');
    try {
        const uid = currentUser.id || currentUser.uid;
        [allProjects, allClients, allVendors, allPurchaseRequisitions, allPurchaseOrders, allItems] = await Promise.all([
            getProjects(uid),
            getClients(uid),
            getVendors(uid),
            getPurchaseRequisitions(uid),
            getPurchaseOrders(uid),
            getItems(uid) 
        ]);

        const companyProfile = await getCompanyProfile();
        
        renderAnalyticsDashboard(allProjects, allClients, companyProfile);
        renderProcurementAnalyticsDashboard(allPurchaseOrders, allVendors);
        renderProjectsTable(allProjects, allClients, loadEditor);
        renderPurchaseRequisitionsTable(allPurchaseRequisitions);
        renderPurchaseOrdersTable(allPurchaseOrders, allVendors);
        
        switchView('dashboard-view');
    } catch (error) {
        console.error("Gagal memuat dashboard penjualan:", error);
        showToast("Gagal memuat data penjualan. Cek konsol untuk detail.", "error");
    } finally {
        setLoading(false);
    }
}

async function loadEditor(projectId) {
    if (!currentUser) return;
    const uid = currentUser.id || currentUser.uid;
    setLoading(true, 'Memuat editor...');
    try {
        const projectIdInput = document.getElementById('projectId');
        
        if (projectId) {
            isNewProject = false;
            currentProject = await getProjectById(uid, projectId);
            projectIdInput.disabled = true;
        } else {
            isNewProject = true;
            const companyProfile = await getCompanyProfile();
            currentProject = {
                id: `PROJ-${Date.now()}`,
                createdAt: new Date().toISOString(),
                subject: '',
                clientId: '',
                status: 'Draft',
                projectId: 'Nomor akan dibuat otomatis',
                docNumbers: {},
                items: [],
                payments: [],
                stockDeducted: false,
                specificDetails: {
                    paymentTerm: companyProfile.defaultPaymentTerm || '',
                    hasDp: companyProfile.defaultHasDp || false,
                    dpPercentage: 50,
                    poNumber: '',
                    isPPN: companyProfile.isPKP || false,
                },
                discount: 0,
            };
            projectIdInput.disabled = true;
        }

        const clientSelect = document.getElementById('clientId');
        clientSelect.innerHTML = '<option value="">-- Pilih Klien --</option>' + allClients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        
        document.getElementById('project-form').reset();
        document.getElementById('items-container').innerHTML = '';
        
        currentDocType = 'penawaran';
        const products = allItems.filter(item => item.category === 'product');
        await switchDocument(uid, currentDocType, currentProject, products);
        
        if (isNewProject) {
            await generateDocumentNumber(uid, currentDocType);
        }
        await updateWorkflowUI(currentProject); 
        switchView('editor-view');
    } catch (error) {
        console.error("Gagal memuat editor:", error);
        showToast("Gagal memuat editor proyek.", "error");
    } finally {
        setLoading(false);
    }
}

async function loadPOEditor(prId) {
    if (!currentUser) return;
    const uid = currentUser.id || currentUser.uid;
    setLoading(true, 'Memuat editor PO...');
    try {
        const prData = await getPurchaseRequisitionById(uid, prId);
        if (!prData) {
            showToast('Data Permintaan Pembelian tidak ditemukan.', 'error');
            return;
        }

        populatePOEditor(prData, allVendors);
        switchView('po-editor-view');
    } catch (error) {
        console.error("Gagal memuat editor PO:", error);
        showToast("Gagal memuat editor PO.", "error");
    } finally {
        setLoading(false);
    }
}

// Sisa kode (event listener, helper, dll.) tetap sama
// ... (Kode dari file main.js sebelumnya)
// ...
function setupGlobalEventListeners() {
    window.onbeforeprint = () => document.getElementById('print-area-container').style.transform = 'scale(1)';
    window.onafterprint = () => {
        const scaleValue = document.getElementById('preview-scale').value;
        document.getElementById('print-area-container').style.transform = `scale(${scaleValue})`;
    };

    document.getElementById('print-area').addEventListener('click', async (e) => {
        const uid = currentUser.id || currentUser.uid;
        if (e.target.id === 'mark-proforma-paid-btn') {
            if (confirm('Apakah Anda yakin ingin menandai Proforma ini sudah dibayar? Aksi ini akan mencatat pembayaran DP.')) {
                setLoading(true, 'Mencatat pembayaran DP...');
                
                const company = await getCompanyProfile();
                const { dpAmount } = calculateFinancials(currentProject, company);

                if (!currentProject.payments) currentProject.payments = [];
                
                currentProject.payments.push({
                    amount: dpAmount,
                    date: new Date().toISOString().split('T')[0],
                    notes: `Pembayaran DP (${currentProject.specificDetails.dpPercentage}%) via Proforma No. ${currentProject.docNumbers.proforma}`,
                    id: `PAY-DP-${Date.now()}`
                });

                currentProject.specificDetails.isProformaPaid = true;
                currentProject.status = 'Dibayar Sebagian';

                await saveProject(uid, currentProject);
                await updatePreview(uid, currentDocType, currentProject, allItems.filter(i => i.category === 'product'));
                await updateWorkflowUI(currentProject);
                
                setLoading(false);
                showToast('Pembayaran DP berhasil dicatat.', 'success');
            }
        } else if (e.target.id === 'confirm-delivery-btn') {
            if (confirm('Apakah Anda yakin ingin mengonfirmasi pengiriman ini? Aksi ini akan mengurangi stok dari semua item dalam surat jalan.')) {
                setLoading(true, 'Mengurangi stok...');
                try {
                    const stockUpdatePromises = [];
                    for (const projectItem of currentProject.items) {
                        const product = allItems.find(i => i.id === projectItem.id);
                        if (product && product.bom && product.bom.length > 0) {
                            product.bom.forEach(bomItem => {
                                const quantityToDeduct = bomItem.quantity * projectItem.quantity;
                                stockUpdatePromises.push(updateStock(uid, bomItem.id, -quantityToDeduct));
                            });
                        } else {
                            stockUpdatePromises.push(updateStock(uid, projectItem.id, -projectItem.quantity));
                        }
                    }
                    await Promise.all(stockUpdatePromises);

                    currentProject.stockDeducted = true;
                    await saveProject(uid, currentProject);

                    await updatePreview(uid, currentDocType, currentProject, allItems.filter(i => i.category === 'product'));
                    showToast('Stok berhasil dikurangi.', 'success');

                } catch (error) {
                    console.error("Stock deduction failed:", error);
                    showToast(`Gagal mengurangi stok: ${error.message}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        }
    });

    document.getElementById('nav-dashboard').addEventListener('click', () => switchView('dashboard-view'));
    document.getElementById('nav-procurement').addEventListener('click', () => switchView('procurement-view'));
}

function setupDashboardEventListeners() {
    const uid = currentUser.id || currentUser.uid;
    document.getElementById('new-project-btn').addEventListener('click', () => loadEditor(null));
    document.getElementById('manage-company-btn').addEventListener('click', showCompanyProfileModal);
    document.getElementById('manage-clients-btn').addEventListener('click', () => {
        if (currentUser) {
            showClientsModal(uid);
        }
    });
    document.getElementById('manage-vendors-btn').addEventListener('click', () => {
        if (currentUser) {
            showVendorsModal(uid);
        }
    });
    document.getElementById('manage-inventory-btn').addEventListener('click', () => {
        if (currentUser) {
            showInventoryModal(uid, allItems);
        }
    });
    
    document.getElementById('search-input').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const clientMap = new Map(allClients.map(c => [c.id, c.name.toLowerCase()]));
        const filteredProjects = allProjects.filter(project => {
            const projectName = project.subject.toLowerCase();
            const clientName = clientMap.get(project.clientId) || '';
            return projectName.includes(searchTerm) || clientName.includes(searchTerm);
        });
        renderProjectsTable(filteredProjects, allClients, loadEditor);
    });
    
    document.getElementById('delete-selected-btn').addEventListener('click', async () => {
        if (!currentUser) return;
        const selectedCheckboxes = document.querySelectorAll('#projects-table-body .project-checkbox:checked');
        if (selectedCheckboxes.length === 0) {
            showToast('Tidak ada proyek yang dipilih.', 'error');
            return;
        }
        if (confirm(`Apakah Anda yakin ingin menghapus ${selectedCheckboxes.length} proyek terpilih?`)) {
            setLoading(true, `Menghapus ${selectedCheckboxes.length} proyek...`);
            const projectIdsToDelete = Array.from(selectedCheckboxes).map(cb => cb.dataset.id);
            await deleteMultipleProjects(uid, projectIdsToDelete);
            setLoading(false);
            showToast('Proyek terpilih berhasil dihapus.', 'success');
            await loadDashboard();
        }
    });

     document.getElementById('delete-selected-procurement-btn').addEventListener('click', async () => {
        if (!currentUser) return;
        const selectedPRs = document.querySelectorAll('#pr-table-body .procurement-checkbox:checked');
        const selectedPOs = document.querySelectorAll('#po-table-body .procurement-checkbox:checked');

        if (selectedPRs.length === 0 && selectedPOs.length === 0) {
            showToast('Tidak ada item yang dipilih untuk dihapus.', 'error');
            return;
        }

        if (confirm(`Yakin ingin menghapus ${selectedPRs.length} PR dan ${selectedPOs.length} PO terpilih?`)) {
            setLoading(true, 'Menghapus item pengadaan...');
            if (selectedPRs.length > 0) {
                const ids = Array.from(selectedPRs).map(cb => cb.dataset.id);
                await deleteMultiplePurchaseRequisitions(uid, ids);
            }
            if (selectedPOs.length > 0) {
                const ids = Array.from(selectedPOs).map(cb => cb.dataset.id);
                await deleteMultiplePurchaseOrders(uid, ids);
            }
            setLoading(false);
            showToast('Item pengadaan terpilih berhasil dihapus.', 'success');
            await loadDashboard();
            switchView('procurement-view');
        }
    });
    
    document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
        document.querySelectorAll('#projects-table-body .project-checkbox').forEach(checkbox => checkbox.checked = e.target.checked);
    });

    document.getElementById('select-all-pr-checkbox').addEventListener('change', (e) => {
        document.querySelectorAll('#pr-table-body .procurement-checkbox').forEach(checkbox => checkbox.checked = e.target.checked);
    });

    document.getElementById('select-all-po-checkbox').addEventListener('change', (e) => {
        document.querySelectorAll('#po-table-body .procurement-checkbox').forEach(checkbox => checkbox.checked = e.target.checked);
    });

    document.getElementById('new-pr-btn').addEventListener('click', () => {
        showPurchaseRequisitionModal(null, allItems.filter(i => i.category === 'raw_material' || i.category === 'product'));
    });

    document.getElementById('report-consumable-usage-btn').addEventListener('click', () => {
        showConsumableUsageModal(allItems.filter(i => i.category === 'consumable'));
    });

    document.getElementById('pr-table-body').addEventListener('click', (e) => {
        const target = e.target;
        const prId = target.closest('tr')?.querySelector('.procurement-checkbox')?.dataset.id;

        if (!prId) return;

        if (target.matches('.create-po-btn')) {
            loadPOEditor(prId);
        } else if (target.matches('.edit-pr-btn')) {
            handleEditPR(prId);
        } else if (target.matches('.delete-pr-btn')) {
            handleDeletePR(prId);
        } else if (target.matches('.print-pr-btn')) {
            handlePrintPR(prId);
        }
    });

    document.getElementById('po-table-body').addEventListener('click', async (e) => {
        const target = e.target;
        const poId = target.closest('tr')?.querySelector('.procurement-checkbox')?.dataset.id;
        
        if (!poId) return;

        const poToUpdate = allPurchaseOrders.find(po => po.id === poId);

        if (target.matches('.receive-goods-btn')) {
            if (confirm(`Apakah Anda yakin ingin menandai PO #${poId} sebagai "Barang Diterima"?\n\nAKSI INI AKAN MENAMBAH STOK BARANG.`)) {
                setLoading(true, 'Memperbarui status & stok...');
                try {
                    if (poToUpdate) {
                        poToUpdate.status = 'Goods Received';
                        await savePurchaseOrder(uid, poToUpdate);

                        const stockUpdatePromises = poToUpdate.items.map(item =>
                            updateStock(uid, item.id, item.quantity)
                        );
                        await Promise.all(stockUpdatePromises);
                        
                        showToast('Status PO dan stok berhasil diperbarui.', 'success');
                        await loadDashboard();
                        switchView('procurement-view');
                    }
                } catch (error) {
                    console.error("Stock update failed:", error);
                    showToast(`Gagal memperbarui stok: ${error.message}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        } else if (target.matches('.record-invoice-btn')) {
            if (poToUpdate) showVendorInvoiceModal(poToUpdate);
        } else if (target.matches('.pay-po-btn')) {
            if (poToUpdate) {
                const totalAmount = poToUpdate.vendorInvoice.amount;
                if (confirm(`Apakah Anda yakin ingin melakukan pembayaran untuk PO #${poId}?\n\nTotal: ${formatCurrency(totalAmount)}`)) {
                    setLoading(true, 'Memproses pembayaran...');
                    poToUpdate.status = 'Paid';
                    await savePurchaseOrder(uid, poToUpdate);
                    await loadDashboard();
                    switchView('procurement-view');
                    setLoading(false);
                    showToast('Pembayaran berhasil dicatat.', 'success');
                }
            }
        } else if (target.matches('.edit-po-btn')) {
            handleEditPO(poId);
        } else if (target.matches('.delete-po-btn')) {
            handleDeletePO(poId);
        } else if (target.matches('.print-po-btn')) {
            handlePrintPO(poId);
        }
    });
}

function setupEditorEventListeners() {
    const uid = currentUser.id || currentUser.uid;
    document.getElementById('back-to-dashboard-btn').addEventListener('click', () => switchView('dashboard-view'));
    document.getElementById('back-to-procurement-btn').addEventListener('click', () => switchView('procurement-view'));

    document.getElementById('doc-nav').addEventListener('click', async (e) => {
        if (e.target.matches('.doc-nav-btn:not(:disabled)')) {
            currentDocType = e.target.dataset.doc;
            await collectFormData(); 
            await switchDocument(uid, currentDocType, currentProject, allItems.filter(i => i.category === 'product'));
            if (!currentProject.docNumbers || !currentProject.docNumbers[currentDocType]) {
                 await generateDocumentNumber(uid, currentDocType);
            } else {
                document.getElementById('projectId').value = currentProject.docNumbers[currentDocType];
                await updatePreview(uid, currentDocType, currentProject, allItems.filter(i => i.category === 'product'));
            }
        }
    });

    document.getElementById('project-form').addEventListener('input', async (e) => {
        await collectFormData();
        await updatePreview(uid, currentDocType, currentProject, allItems.filter(i => i.category === 'product'));
        await updateWorkflowUI(currentProject);
    });

    document.getElementById('project-form').addEventListener('change', async (e) => {
        if (e.target.id === 'projectStatus') {
            currentProject.status = e.target.value;
            await updateWorkflowUI(currentProject);
            await updatePreview(uid, currentDocType, currentProject, allItems.filter(i => i.category === 'product'));
        }
        if (e.target.id === 'hasDp') {
            document.getElementById('dp-percentage-wrapper').classList.toggle('hidden', !e.target.checked);
        }
    });
    
    document.getElementById('generate-email-btn').addEventListener('click', async () => {
        await collectFormData();
        showEmailModal(uid, currentProject);
    });

    document.getElementById('add-item-btn').addEventListener('click', () => addItemRow(allItems.filter(i => i.category === 'product')));
    
    document.getElementById('items-container').addEventListener('click', async (e) => {
        if (e.target.matches('.remove-item-btn')) {
            e.target.closest('.item-row').remove();
            await collectFormData();
            await updatePreview(uid, currentDocType, currentProject, allItems.filter(i => i.category === 'product'));
        }
    });

    document.getElementById('save-project-btn').addEventListener('click', async () => {
        if (!currentUser) return;
        setLoading(true, 'Menyimpan proyek...');
        await collectFormData();
        if (!currentProject.clientId || !currentProject.subject) {
            showToast('Nama Proyek dan Klien tidak boleh kosong.', 'error');
            setLoading(false);
            return;
        }
        if (isNewProject) {
            for (const docType of Object.keys(currentProject.docNumbers || {})) {
                 await incrementDocumentCounter(docType);
            }
        }
        isNewProject = false;
        document.getElementById('projectId').disabled = true;

        await saveProject(uid, currentProject);
        setLoading(false);
        showToast('Proyek berhasil disimpan!', 'success');
        await loadDashboard();
    });
    
    document.getElementById('delete-project-btn').addEventListener('click', async () => {
        if (!currentUser) return;
        if (confirm('Apakah Anda yakin ingin menghapus proyek ini?')) {
            setLoading(true, 'Menghapus proyek...');
            await deleteProject(uid, currentProject.id);
            setLoading(false);
            showToast('Proyek berhasil dihapus.', 'success');
            await loadDashboard();
        }
    });

    document.getElementById('print-btn').addEventListener('click', () => window.print());
    
    document.getElementById('preview-scale').addEventListener('input', e => {
        document.getElementById('print-area-container').style.transform = `scale(${e.target.value})`;
    });
}

function setupModalEventListeners() {
    const uid = currentUser.id || currentUser.uid;
    document.body.addEventListener('click', async (e) => {
        if (e.target.matches('#close-company-modal, #close-clients-modal, #close-vendors-modal, #close-inventory-modal, #close-email-modal, #close-payment-modal, #close-pr-modal, #close-vendor-invoice-modal, #close-consumable-usage-modal')) {
            e.target.closest('.fixed').style.display = 'none';
        }
        
        if (e.target.matches('.edit-item-btn')) {
            const item = allItems.find(p => p.id === e.target.dataset.id);
            if (item) {
                const rawMaterials = allItems.filter(i => i.category === 'raw_material');
                showInventoryModal(uid, allItems, item.category, item, rawMaterials);
            }
        }
        if (e.target.matches('.delete-item-btn')) {
            if (!currentUser) return;
            if (confirm('Yakin ingin menghapus item ini?')) {
                await deleteItem(uid, e.target.dataset.id);
                allItems = await getItems(uid);
                const currentCategory = document.querySelector('.inventory-tab.active-tab').dataset.category;
                const rawMaterials = allItems.filter(i => i.category === 'raw_material');
                showInventoryModal(uid, allItems, currentCategory, null, rawMaterials);
            }
        }
        if (e.target.matches('#clear-inventory-form')) {
            document.getElementById('inventory-form').reset();
            document.getElementById('editItemId').value = '';
            document.getElementById('bom-items-container').innerHTML = '';
        }
        if (e.target.id === 'add-payment-btn') {
            showPaymentModal(currentProject);
        }
        if (e.target.matches('.edit-client-btn')) {
            const client = allClients.find(c => c.id === e.target.dataset.id);
            if (client) {
                document.getElementById('editClientId').value = client.id;
                document.getElementById('clientName').value = client.name;
                document.getElementById('clientDepartment').value = client.clientDepartment || '';
                document.getElementById('clientPic').value = client.pic;
                document.getElementById('clientEmail').value = client.clientEmail || '';
                document.getElementById('clientAddress').value = client.address;
                document.getElementById('clientNpwp').value = client.npwp || '';
            }
        }
        if (e.target.matches('.delete-client-btn')) {
            if (!currentUser) return;
            if (confirm('Yakin ingin menghapus klien ini?')) {
                await deleteClient(uid, e.target.dataset.id);
                allClients = await getClients(uid);
                renderClientsList(allClients);
            }
        }
        if (e.target.matches('#clear-client-form')) {
            document.getElementById('client-form').reset();
            document.getElementById('editClientId').value = '';
        }

        if (e.target.matches('.edit-vendor-btn')) {
            const vendor = allVendors.find(v => v.id === e.target.dataset.id);
            if (vendor) {
                document.getElementById('editVendorId').value = vendor.id;
                document.getElementById('vendorName').value = vendor.name;
                document.getElementById('vendorContactPerson').value = vendor.contactPerson || '';
                document.getElementById('vendorPhone').value = vendor.phone || '';
                document.getElementById('vendorEmail').value = vendor.email || '';
                document.getElementById('vendorAddress').value = vendor.address || '';
                document.getElementById('vendorNpwp').value = vendor.npwp || '';
            }
        }
        if (e.target.matches('.delete-vendor-btn')) {
            if (!currentUser) return;
            if (confirm('Yakin ingin menghapus vendor ini?')) {
                await deleteVendor(uid, e.target.dataset.id);
                allVendors = await getVendors(uid);
                renderVendorsList(allVendors);
            }
        }
        if (e.target.matches('#clear-vendor-form')) {
            document.getElementById('vendor-form').reset();
            document.getElementById('editVendorId').value = '';
        }
    });

    document.body.addEventListener('submit', async (e) => {
        e.preventDefault();
        const uid = currentUser.id || currentUser.uid;
        if (e.target.matches('#company-profile-form')) {
            const profile = {
                    companyName: document.getElementById('companyName').value,
                    companyInitials: document.getElementById('companyInitials').value,
                    companyPhone: document.getElementById('companyPhone').value,
                    companyAddress: document.getElementById('companyAddress').value,
                    companyEmail: document.getElementById('companyEmail').value,
                    companyWebsite: document.getElementById('companyWebsite').value,
                    companyNpwp: document.getElementById('companyNpwp').value,
                    companyLogo: document.getElementById('companyLogo').value,
                    companyStamp: document.getElementById('companyStamp').value,
                    directorName: document.getElementById('directorName').value,
                    defaultPaymentTerm: document.getElementById('defaultPaymentTerm').value,
                    defaultHasDp: document.getElementById('defaultHasDp').checked,
                    companyTerms: document.getElementById('companyTerms').value,
                    companyPaymentInfo: document.getElementById('companyPaymentInfo').value,
                    isPKP: document.getElementById('isPKP').checked,
                    ppnRate: parseFloat(document.getElementById('ppnRate').value) || 11,
                };
                await saveCompanyProfile(profile);
                showToast('Profil perusahaan disimpan.', 'success');
                document.getElementById('company-profile-modal').style.display = 'none';
        }
        if (e.target.matches('#client-form')) {
            if (!currentUser) return;
            const client = {
                id: document.getElementById('editClientId').value || `CLIENT-${Date.now()}`,
                name: document.getElementById('clientName').value,
                clientDepartment: document.getElementById('clientDepartment').value,
                pic: document.getElementById('clientPic').value,
                clientEmail: document.getElementById('clientEmail').value,
                address: document.getElementById('clientAddress').value,
                npwp: document.getElementById('clientNpwp').value,
            };
            await saveClient(uid, client);
            allClients = await getClients(uid);
            renderClientsList(allClients);
            e.target.reset();
            document.getElementById('editClientId').value = '';
        }
        if (e.target.matches('#vendor-form')) {
            if (!currentUser) return;
            const vendor = {
                id: document.getElementById('editVendorId').value || `VENDOR-${Date.now()}`,
                name: document.getElementById('vendorName').value,
                contactPerson: document.getElementById('vendorContactPerson').value,
                phone: document.getElementById('vendorPhone').value,
                email: document.getElementById('vendorEmail').value,
                address: document.getElementById('vendorAddress').value,
                npwp: document.getElementById('vendorNpwp').value,
            };
            await saveVendor(uid, vendor);
            allVendors = await getVendors(uid);
            renderVendorsList(allVendors);
            e.target.reset();
            document.getElementById('editVendorId').value = '';
        }
        if (e.target.matches('#inventory-form')) {
            const category = document.getElementById('itemCategory').value;
            const itemData = {
                id: document.getElementById('editItemId').value || document.getElementById('itemCode').value,
                code: document.getElementById('itemCode').value,
                name: document.getElementById('itemName').value,
                unit: document.getElementById('itemUnit').value,
                category: category,
            };

            if (!itemData.id) {
                showToast('Kode Item wajib diisi!', 'error');
                return;
            }

            if (category === 'product' || category === 'raw_material' || category === 'consumable') {
                itemData.stock = parseInt(document.getElementById('itemStock').value, 10) || 0;
            }
            if (category === 'product') {
                itemData.price = parseFloat(document.getElementById('itemPrice').value) || 0;
                itemData.bom = [];
                document.querySelectorAll('.bom-item-row').forEach(row => {
                    const id = row.querySelector('.bom-item-select').value;
                    const qty = parseFloat(row.querySelector('.bom-item-qty').value) || 0;
                    if (id && qty > 0) {
                        itemData.bom.push({ id, quantity: qty });
                    }
                });
            }
            if (category === 'asset') {
                itemData.purchaseDate = document.getElementById('assetPurchaseDate').value;
                itemData.purchaseValue = parseFloat(document.getElementById('assetPurchaseValue').value) || 0;
                itemData.usefulLife = parseInt(document.getElementById('assetUsefulLife').value, 10) || 0;
            }

            await saveItem(uid, itemData);
            allItems = await getItems(uid);
            const rawMaterials = allItems.filter(i => i.category === 'raw_material');
            showInventoryModal(uid, allItems, category, null, rawMaterials);
            e.target.reset();
            document.getElementById('editItemId').value = '';
            document.getElementById('bom-items-container').innerHTML = '';
        }
        
        if (e.target.matches('#pr-form')) {
            const items = [];
            document.querySelectorAll('.pr-item-row').forEach(row => {
                const id = row.querySelector('.pr-item-id-select').value;
                const qty = parseInt(row.querySelector('.pr-item-qty').value, 10) || 0;
                if (id && qty > 0) {
                    const product = allItems.find(p => p.id === id);
                    items.push({ 
                        id: id,
                        description: product.name,
                        quantity: qty 
                    });
                }
            });

            if (items.length === 0) {
                showToast('Harap tambahkan setidaknya satu item.', 'error');
                return;
            }
            
            const prId = document.getElementById('editPrId').value;
            const isEditing = !!prId;

            const prData = {
                id: prId || `PR-${Date.now()}`,
                requester: document.getElementById('prRequester').value,
                justification: document.getElementById('prJustification').value,
                createdAt: document.getElementById('prDate').value,
                status: 'Pending',
                items: items,
            };
            
            setLoading(true, 'Menyimpan permintaan...');
            await savePurchaseRequisition(uid, prData);
            await loadDashboard();
            switchView('procurement-view');
            setLoading(false);
            
            document.getElementById('pr-modal').style.display = 'none';
            showToast(`Permintaan Pembelian berhasil ${isEditing ? 'diperbarui' : 'diajukan'}.`, 'success');
        }

        if (e.target.matches('#payment-form')) {
            const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
            const paymentDate = document.getElementById('paymentDate').value;
            const paymentNotes = document.getElementById('paymentNotes').value;

            if (!paymentAmount || !paymentDate) {
                showToast('Jumlah dan Tanggal Pembayaran harus diisi.', 'error');
                return;
            }

            if (!currentProject.payments) currentProject.payments = [];
            currentProject.payments.push({
                amount: paymentAmount,
                date: paymentDate,
                notes: paymentNotes,
                id: `PAY-${Date.now()}`
            });

            const company = await getCompanyProfile();
            const { finalTotal } = calculateFinancials(currentProject, company);
            const totalPaid = currentProject.payments.reduce((sum, p) => sum + p.amount, 0);

            if (totalPaid >= finalTotal) {
                currentProject.status = 'Lunas';
            } else {
                currentProject.status = 'Dibayar Sebagian';
            }

            document.getElementById('payment-modal').style.display = 'none';
            await updatePreview(uid, currentDocType, currentProject, allItems.filter(i => i.category === 'product'));
            await updateWorkflowUI(currentProject);
        }

        if (e.target.matches('#po-form')) {
            if (!currentUser) return;

            const items = [];
            document.querySelectorAll('.po-item-row').forEach(row => {
                const id = row.dataset.id;
                const desc = row.querySelector('.po-item-desc').value;
                const qty = parseInt(row.querySelector('.po-item-qty').value, 10);
                const price = parseFloat(row.querySelector('.po-item-price').value) || 0;
                items.push({ id: id, description: desc, quantity: qty, price: price });
            });
            
            const poId = document.getElementById('poId').value;
            const isEditing = allPurchaseOrders.some(po => po.id === poId);

            const poData = {
                id: poId,
                prRefId: document.getElementById('prRefId').value,
                vendorId: document.getElementById('poVendorId').value,
                createdAt: document.getElementById('poDate').value,
                status: document.getElementById('poStatus').value,
                items: items,
            };

            if (!poData.vendorId) {
                showToast('Harap pilih vendor.', 'error');
                return;
            }

            setLoading(true, 'Menyimpan Purchase Order...');
            
            await savePurchaseOrder(uid, poData);
            
            if (!isEditing) {
                const prToUpdate = await getPurchaseRequisitionById(uid, poData.prRefId);
                if (prToUpdate) {
                    prToUpdate.status = 'PO Created';
                    await savePurchaseRequisition(uid, prToUpdate);
                }
                await incrementDocumentCounter('po');
            }

            setLoading(false);
            showToast(`Purchase Order berhasil ${isEditing ? 'diperbarui' : 'dibuat'}!`, 'success');
            await loadDashboard(); 
            switchView('procurement-view');
        }
        if (e.target.matches('#vendor-invoice-form')) {
            if (!currentUser) return;

            const poId = document.getElementById('refPoId').value;
            const vendorInvoiceNumber = document.getElementById('vendorInvoiceNumber').value;
            const vendorInvoiceDate = document.getElementById('vendorInvoiceDate').value;
            const vendorInvoiceAmount = parseFloat(document.getElementById('vendorInvoiceAmount').value);
            
            setLoading(true, 'Memvalidasi dan menyimpan invoice...');
            
            const poToUpdate = allPurchaseOrders.find(po => po.id === poId);
            if (poToUpdate) {
                poToUpdate.status = 'Validated';
                poToUpdate.vendorInvoice = {
                    number: vendorInvoiceNumber,
                    date: vendorInvoiceDate,
                    amount: vendorInvoiceAmount
                };
                await savePurchaseOrder(uid, poToUpdate);
                await loadDashboard();
                switchView('procurement-view');
            }

            setLoading(false);
            document.getElementById('vendor-invoice-modal').style.display = 'none';
            showToast('Invoice Vendor berhasil divalidasi dan disimpan.', 'success');
        }
        if (e.target.matches('#consumable-usage-form')) {
            const usageData = {
                pic: document.getElementById('usagePIC').value,
                date: document.getElementById('usageDate').value,
                itemId: document.getElementById('usageItemId').value,
                quantity: parseInt(document.getElementById('usageQuantity').value, 10),
                notes: document.getElementById('usageNotes').value,
            };

            if (!usageData.itemId || !usageData.quantity > 0) {
                showToast('Item dan jumlah harus diisi.', 'error');
                return;
            }

            setLoading(true, 'Menyimpan laporan penggunaan...');
            try {
                await saveConsumableUsage(uid, usageData);
                await updateStock(uid, usageData.itemId, -usageData.quantity);
                allItems = await getItems(uid);
                showToast('Laporan penggunaan berhasil disimpan.', 'success');
                document.getElementById('consumable-usage-modal').style.display = 'none';
            } catch (error) {
                showToast(`Gagal menyimpan: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        }
    });
}
