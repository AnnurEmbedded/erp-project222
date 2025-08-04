// --- DOM ELEMENTS ---
const projectGoalInput = document.getElementById('project-goal');
const generateBtn = document.getElementById('generate-btn');
const btnText = document.getElementById('generate-btn-text');
const spinner = document.getElementById('loading-spinner');
const inputResults = document.getElementById('input-results');
const processResults = document.getElementById('process-results');
const outputResults = document.getElementById('output-results');

// --- EVENT LISTENER ---
generateBtn.addEventListener('click', getAIRecommendations);

// --- API CALL FUNCTION ---
async function getAIRecommendations() {
    const projectGoal = projectGoalInput.value;
    if (!projectGoal.trim()) {
        alert('Harap isi tujuan utama proyek terlebih dahulu.');
        return;
    }

    // Tampilkan status loading
    setLoading(true);
    clearResults();

    // Buat prompt yang detail untuk AI
    const prompt = `
        Anda adalah seorang ahli sistem otomasi industri yang berpengalaman di bidang mekanikal, elektrikal, dan programming.
        Berdasarkan tujuan proyek berikut: "${projectGoal}", berikan rekomendasi komponen dalam format JSON.

        Struktur JSON harus sebagai berikut:
        {
          "input": [
            { "component": "Nama Komponen", "description": "Deskripsi singkat dan relevansinya dengan proyek." },
            { "component": "Nama Komponen", "description": "Deskripsi singkat dan relevansinya dengan proyek." }
          ],
          "process": [
            { "component": "Nama Komponen", "description": "Deskripsi singkat dan relevansinya dengan proyek." }
          ],
          "output": [
            { "component": "Nama Komponen", "description": "Deskripsi singkat dan relevansinya dengan proyek." }
          ]
        }

        Untuk setiap kategori (input, process, output), berikan 2-3 rekomendasi komponen yang paling umum dan sesuai.
        Contoh komponen input: Sensor Proximity, Sensor Photoelectric, Tombol HMI, Encoder.
        Contoh komponen process: PLC (misal: Siemens S7-1200), Mikrokontroler (misal: ESP32), Industrial PC.
        Contoh komponen output: Motor Servo, Solenoid Valve, Pneumatic Cylinder, Heater.
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
        const recommendations = JSON.parse(jsonText);

        // Tampilkan hasil
        renderResults(recommendations);

    } catch (error) {
        console.error("Error fetching AI recommendations:", error);
        inputResults.innerHTML = `<p class="text-red-500">Gagal mendapatkan rekomendasi. Silakan coba lagi.</p>`;
    } finally {
        // Sembunyikan status loading
        setLoading(false);
    }
}

// --- UI FUNCTIONS ---
function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    if (isLoading) {
        btnText.textContent = 'Memproses...';
        spinner.classList.remove('hidden');
    } else {
        btnText.textContent = 'Dapatkan Rekomendasi';
        spinner.classList.add('hidden');
    }
}

function clearResults() {
    inputResults.innerHTML = '';
    processResults.innerHTML = '';
    outputResults.innerHTML = '';
}

function renderResults(data) {
    renderCategory(inputResults, data.input);
    renderCategory(processResults, data.process);
    renderCategory(outputResults, data.output);
}

function renderCategory(container, items) {
    if (!items || items.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400">Tidak ada rekomendasi untuk kategori ini.</p>`;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="card border border-gray-200 p-4 rounded-lg shadow-sm">
            <h4 class="font-bold text-gray-800">${item.component}</h4>
            <p class="text-sm text-gray-600 mt-1">${item.description}</p>
        </div>
    `).join('');
}
