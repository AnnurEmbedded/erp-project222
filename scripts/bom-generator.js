// --- DOM ELEMENTS ---
const componentsInput = document.getElementById('components-input');
const generateBtn = document.getElementById('generate-bom-btn');
const btnText = document.getElementById('generate-btn-text');
const spinner = document.getElementById('loading-spinner');
const resultsContainer = document.getElementById('results-container');
const bomTableBody = document.getElementById('bom-results-table');

// --- EVENT LISTENER ---
generateBtn.addEventListener('click', getBOMFromAI);

// --- API CALL FUNCTION ---
async function getBOMFromAI() {
    const components = componentsInput.value;
    if (!components.trim()) {
        alert('Harap isi komponen utama terlebih dahulu.');
        return;
    }

    setLoading(true);
    resultsContainer.classList.add('hidden');

    const prompt = `
        Anda adalah seorang procurement specialist dan engineer otomasi. Berdasarkan daftar komponen utama berikut:
        "${components}"

        Buatlah Bill of Materials (BOM) yang detail dalam format JSON. JSON harus berupa array dari objek, di mana setiap objek memiliki properti berikut: "partName", "quantity", dan "supplierRecommendation".

        Contoh:
        [
          { "partName": "Sensor Proximity Inductive M12", "quantity": "2 pcs", "supplierRecommendation": "Omron / Sick" },
          { "partName": "Kabel Sensor M12 4-pin, 5 meter", "quantity": "2 pcs", "supplierRecommendation": "Murr / Phoenix Contact" },
          { "partName": "PLC Siemens S7-1200 CPU 1214C", "quantity": "1 unit", "supplierRecommendation": "Siemens Official Distributor" },
          { "partName": "Power Supply 24V DC 5A", "quantity": "1 unit", "supplierRecommendation": "Mean Well / Omron" },
          { "partName": "Terminal Block 4mm", "quantity": "20 pcs", "supplierRecommendation": "Weidmüller / Phoenix Contact" }
        ]

        Pecah setiap komponen utama menjadi material pendukung yang diperlukan. Misalnya, PLC memerlukan power supply dan terminal block. Sensor memerlukan kabel dan bracket. Motor memerlukan kabel power, kabel encoder, dan driver. Berikan rekomendasi merek atau jenis pemasok yang umum untuk setiap item.
    `;

    try {
        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { 
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
            }
        };
        const apiKey = ""; // Disediakan oleh environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        const jsonText = result.candidates[0].content.parts[0].text;
        const bomData = JSON.parse(jsonText);

        renderBOMTable(bomData);

    } catch (error) {
        console.error("Error fetching BOM:", error);
        bomTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 p-4">Gagal mendapatkan data. Silakan coba lagi.</td></tr>`;
        resultsContainer.classList.remove('hidden');
    } finally {
        setLoading(false);
    }
}

// --- UI FUNCTIONS ---
function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    if (isLoading) {
        btnText.textContent = 'Membuat BOM...';
        spinner.classList.remove('hidden');
    } else {
        btnText.textContent = 'Buat Bill of Materials';
        spinner.classList.add('hidden');
    }
}

function renderBOMTable(data) {
    if (!data || data.length === 0) {
        bomTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 p-4">Tidak ada data untuk ditampilkan.</td></tr>`;
        resultsContainer.classList.remove('hidden');
        return;
    }
    
    bomTableBody.innerHTML = data.map((item, index) => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${index + 1}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">${item.partName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.quantity}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.supplierRecommendation}</td>
        </tr>
    `).join('');

    resultsContainer.classList.remove('hidden');
}
