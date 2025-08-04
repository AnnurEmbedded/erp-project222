// ui-module.js
// Modul ini bertanggung jawab untuk semua manipulasi DOM, rendering UI,
// dan penanganan event listener.

import { state, setState, DIVISIONS } from './state-module.js';
import { handleLogout } from './auth-module.js';
import { listenForTasks, listenForComments, saveProject, deleteProject, saveTask, updateTaskStatus, deleteTask, saveComment, updateUser } from './data-module.js';
import { initialize as initializeSalesModule } from '../sales-module.js'; 
import { db, auth } from './firebase-module.js';

// --- Chart.js ---
import 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';

const appContainer = document.getElementById('app-container');
let mainContent = null;
let loadingOverlay = null;

// PERBAIKAN KRITIS: Path ke file HTML disesuaikan dengan struktur folder Anda yang sebenarnya.
const moduleMap = {
    'dashboard': 'modules/dashboard.html',
    'projects': 'modules/projects.html',
    'project-detail': 'modules/project-detail.html',
    'timeline': 'modules/timeline.html',
    'sales': 'modules/sales.html',
    'superadmin': 'modules/superadmin-dashboard.html'
};

// --- INITIALIZATION ---

export async function initializeUI() {
    if (document.querySelector('aside')) return;

    let superAdminNav = state.currentUser.role === 'Super Admin' ? 
        `<a href="#" id="nav-superadmin" class="nav-link block py-3 px-6 text-var(--text-secondary) hover:bg-blue-50 hover:text-var(--accent-primary) font-medium"><i class="fas fa-crown w-6 mr-2"></i> Tinjauan Admin</a>` : '';
    let userManagementNav = (state.currentUser.role === 'Super Admin' || state.currentUser.role === 'Admin') ?
        `<a href="#" id="manage-users-btn" class="nav-link block py-3 px-6 text-var(--text-secondary) hover:bg-blue-50 hover:text-var(--accent-primary) font-medium"><i class="fas fa-users-cog w-6 mr-2"></i> Manajemen Pengguna</a>` : '';

    appContainer.innerHTML = `
        <div id="loading-overlay" class="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div class="flex flex-col items-center">
                <i class="fas fa-spinner fa-spin text-blue-600 text-4xl"></i>
                <p class="mt-4 text-lg font-semibold text-gray-700">Memuat data...</p>
            </div>
        </div>
        <div class="flex h-screen bg-var(--bg-primary)">
            <aside class="w-64 bg-var(--bg-secondary) shadow-md flex-shrink-0 flex flex-col">
                <div class="p-6"><h1 class="text-2xl font-bold text-var(--accent-primary)">ERP Terpadu</h1></div>
                <nav class="mt-6 flex-grow">
                    ${superAdminNav}
                    <a href="#" id="nav-dashboard" class="nav-link block py-3 px-6 text-var(--text-secondary) hover:bg-blue-50 hover:text-var(--accent-primary) font-medium"><i class="fas fa-tachometer-alt w-6 mr-2"></i> Dashboard</a>
                    <a href="project-planner.html" target="_blank" class="block py-3 px-6 text-var(--text-secondary) hover:bg-blue-50 hover:text-var(--accent-primary) font-medium"><i class="fas fa-lightbulb w-6 mr-2"></i> Perencana Proyek</a>
                    <a href="bom-generator.html" target="_blank" class="block py-3 px-6 text-var(--text-secondary) hover:bg-blue-50 hover:text-var(--accent-primary) font-medium"><i class="fas fa-list-alt w-6 mr-2"></i> Generator BOM</a>
                    <a href="#" id="nav-projects" class="nav-link block py-3 px-6 text-var(--text-secondary) hover:bg-blue-50 hover:text-var(--accent-primary) font-medium"><i class="fas fa-folder w-6 mr-2"></i> Proyek</a>
                    <a href="#" id="nav-timeline" class="nav-link block py-3 px-6 text-var(--text-secondary) hover:bg-blue-50 hover:text-var(--accent-primary) font-medium"><i class="fas fa-chart-gantt w-6 mr-2"></i> Timeline</a>
                    <a href="#" id="nav-sales" class="nav-link block py-3 px-6 text-var(--text-secondary) hover:bg-blue-50 hover:text-var(--accent-primary) font-medium"><i class="fas fa-cash-register w-6 mr-2"></i> Pengadaan & Penjualan</a>
                    ${userManagementNav}
                </nav>
                <div class="p-6 border-t border-var(--border-color)">
                     <button id="theme-switcher-btn" class="w-full text-left mb-4 py-2 px-6 text-sm text-var(--text-secondary) hover:bg-blue-50 hover:text-var(--accent-primary) font-medium rounded-lg">
                        <i class="fas fa-moon w-6 mr-2"></i> Ganti Tema
                     </button>
                     <div id="user-profile" class="flex items-center"></div>
                     <p class="text-xs text-gray-400 mt-2">User ID: <span id="user-id-display"></span></p>
                     <button id="logout-btn" class="w-full text-left mt-4 py-2 px-6 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium">
                        <i class="fas fa-sign-out-alt w-6 mr-2"></i> Logout
                     </button>
                </div>
            </aside>
            <main id="main-content" class="flex-1 p-8 overflow-y-auto"></main>
        </div>
    `;
    
    mainContent = document.getElementById('main-content');
    loadingOverlay = document.getElementById('loading-overlay');
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    renderUserProfile();
    setupEventListeners();
}

// --- NAVIGATION ---

export async function navigateTo(pageName) {
    setState({ currentPage: pageName });
    if(loadingOverlay) loadingOverlay.style.display = 'flex';
    if(mainContent) mainContent.innerHTML = '';

    const moduleUrl = moduleMap[pageName];
    if (!moduleUrl) {
        console.error(`No module URL for page: ${pageName}`);
        if(loadingOverlay) loadingOverlay.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(moduleUrl);
        if (!response.ok) throw new Error(`Could not load module: ${pageName}`);
        const html = await response.text();
        if(mainContent) mainContent.innerHTML = html;
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-blue-50', 'text-blue-600');
            const linkPageName = link.id.replace('nav-', '');
            if (linkPageName === pageName || (pageName === 'superadmin' && linkPageName === 'superadmin')) {
                link.classList.add('bg-blue-50', 'text-blue-600');
            }
        });

        if (pageName === 'sales') {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-project-erp';
            initializeSalesModule(db, auth, state, appId);
        } else {
            renderCurrentPage();
        }

    } catch (error) {
        console.error("Failed to load module:", error);
        if(mainContent) mainContent.innerHTML = `<p class="text-red-500">Gagal memuat modul.</p>`;
        if(loadingOverlay) loadingOverlay.style.display = 'none';
    }
}

// --- RENDER LOGIC ---

export function renderCurrentPage() {
    if (!state.currentPage) return;

    switch (state.currentPage) {
        case 'dashboard': renderDashboard(); break;
        case 'projects': renderProjectList(); break;
        case 'timeline': renderTimeline(); break;
        case 'project-detail': updateProjectDetailContent(state.currentProject); break;
        case 'superadmin': renderSuperAdminDashboard(); break;
    }
    if(loadingOverlay) loadingOverlay.style.display = 'none';
}

function renderUserProfile() {
    if (!state.currentUser) return;
    const profileEl = document.getElementById('user-profile');
    const userIdDisplay = document.getElementById('user-id-display');
    if (profileEl) {
        profileEl.innerHTML = `
            <img src="${state.currentUser.avatar}" alt="User Avatar" class="rounded-full w-10 h-10">
            <div class="ml-3">
                <p class="text-sm font-semibold text-var(--text-primary)">${state.currentUser.name}</p>
                <p class="text-xs text-var(--text-secondary)">${state.currentUser.role}</p>
            </div>
        `;
    }
    if(userIdDisplay) {
        userIdDisplay.textContent = state.currentUser.id;
    }
}

function renderDashboard() {
    const activeProjectsEl = document.getElementById('summary-active-projects');
    if (!activeProjectsEl) return;
    
    activeProjectsEl.textContent = state.projects.length;

    const myTasks = state.allTasks.filter(t => t.assignedTo === state.currentUser.id && t.status !== 'Done').length;
    const completedTasks = state.allTasks.filter(t => t.status === 'Done').length;

    document.getElementById('summary-my-tasks').textContent = myTasks;
    document.getElementById('summary-completed-tasks').textContent = completedTasks;

    const myToDoTasks = state.allTasks.filter(t => t.assignedTo === state.currentUser.id && t.status === 'To Do');
    const taskListEl = document.getElementById('dashboard-my-tasks-list');
    if(taskListEl) {
        taskListEl.innerHTML = '';
        if (myToDoTasks.length === 0) {
            taskListEl.innerHTML = '<p class="text-gray-500">Tidak ada tugas yang perlu dikerjakan.</p>';
        } else {
            myToDoTasks.forEach(task => {
                const project = state.projects.find(p => p.id === task.projectId);
                const taskEl = document.createElement('div');
                taskEl.className = 'flex justify-between items-center p-3 bg-var(--bg-secondary) rounded-lg border border-var(--border-color)';
                taskEl.innerHTML = `
                    <div>
                        <p class="font-semibold text-var(--text-primary)">${task.title}</p>
                        <p class="text-sm text-var(--text-secondary)">Proyek: ${project ? project.name : 'N/A'}</p>
                    </div>
                    <button class="text-var(--accent-primary) hover:underline view-task-project" data-project-id="${task.projectId}">Lihat Proyek</button>
                `;
                taskListEl.appendChild(taskEl);
            });
        }
    }
}

function renderProjectList() {
    const container = document.getElementById('project-list');
    if (!container) return;
    
    container.innerHTML = '';
    if (state.projects.length === 0) {
        container.innerHTML = `<p class="text-var(--text-secondary) col-span-3">Belum ada proyek. Admin dapat membuat proyek baru.</p>`;
    } else {
        state.projects.forEach(project => {
            const tasksInProject = state.allTasks.filter(t => t.projectId === project.id);
            const completedTasks = tasksInProject.filter(t => t.status === 'Done').length;
            const progress = tasksInProject.length > 0 ? Math.round((completedTasks / tasksInProject.length) * 100) : 0;

            const card = document.createElement('div');
            card.className = 'bg-var(--bg-secondary) p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer';
            card.dataset.projectId = project.id;
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <h3 class="text-xl font-bold mb-2 text-var(--text-primary)">${project.name}</h3>
                    ${(state.currentUser.role === 'Admin' || state.currentUser.role === 'Super Admin') ? `
                    <div class="relative group">
                        <button class="text-var(--text-secondary) hover:text-var(--text-primary)"><i class="fas fa-ellipsis-v"></i></button>
                        <div class="absolute right-0 mt-2 w-40 bg-var(--bg-secondary) rounded-md shadow-lg z-10 hidden group-hover:block border border-var(--border-color)">
                            <a href="#" class="block px-4 py-2 text-sm text-var(--text-secondary) hover:bg-gray-100 edit-project-btn" data-project-id="${project.id}">Edit</a>
                            <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 delete-project-btn" data-project-id="${project.id}">Hapus</a>
                        </div>
                    </div>` : ''}
                </div>
                <p class="text-var(--text-secondary) text-sm mb-4 h-12 overflow-hidden">${project.description}</p>
                <div class="mb-2">
                    <div class="flex justify-between text-sm text-var(--text-secondary)">
                        <span>Progress</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                        <div class="bg-var(--accent-primary) h-2.5 rounded-full" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="text-sm text-var(--text-secondary) mt-4">${tasksInProject.length} Tugas</div>
            `;
            container.appendChild(card);
        });
    }
    
    const addProjectBtn = document.getElementById('add-project-btn');
    if (addProjectBtn) {
        if (state.currentUser && (state.currentUser.role === 'Admin' || state.currentUser.role === 'Super Admin')) {
            addProjectBtn.classList.remove('hidden');
        } else {
            addProjectBtn.classList.add('hidden');
        }
    }
}

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    
    container.innerHTML = '';
    if (state.projects.length === 0) {
        container.innerHTML = '<p class="text-var(--text-secondary)">Tidak ada proyek untuk ditampilkan di timeline.</p>';
        return;
    }

    state.projects.forEach(project => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'mb-8';
        projectDiv.innerHTML = `<h3 class="text-xl font-bold mb-4 text-var(--text-primary)">${project.name}</h3>`;
        
        const timelineGrid = document.createElement('div');
        timelineGrid.className = 'relative space-y-4';
        
        const tasksInProject = state.allTasks
            .filter(t => t.projectId === project.id)
            .sort((a,b) => a.startDate.toMillis() - b.startDate.toMillis());

        if (tasksInProject.length === 0) {
            timelineGrid.innerHTML = '<p class="text-sm text-var(--text-secondary)">Tidak ada tugas dalam proyek ini.</p>';
        } else {
            tasksInProject.forEach(task => {
                const assignee = state.users.find(u => u.id === task.assignedTo);
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const startDate = task.startDate.toDate();
                const endDate = task.endDate.toDate();
                
                const totalDuration = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
                const elapsedDuration = Math.max(0, (today - startDate) / (1000 * 60 * 60 * 24));
                const progressPercentage = Math.min(100, (elapsedDuration / totalDuration) * 100);

                const diffTime = endDate - today;
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let deadlineText = '';
                let deadlineClass = '';
                
                if (task.status === 'Done') {
                    deadlineText = 'Selesai';
                    deadlineClass = 'deadline-done';
                } else if (daysRemaining < 0) {
                    deadlineText = `Terlambat ${Math.abs(daysRemaining)} hari`;
                    deadlineClass = 'deadline-critical';
                } else if (daysRemaining === 0) {
                    deadlineText = 'Jatuh Tempo Hari Ini';
                    deadlineClass = 'deadline-critical';
                } else if (daysRemaining <= 3) {
                    deadlineText = `Sisa ${daysRemaining} hari lagi`;
                    deadlineClass = 'deadline-warning';
                } else {
                    deadlineText = `Sisa ${daysRemaining} hari lagi`;
                    deadlineClass = 'deadline-safe';
                }

                let priorityClass = '';
                switch (task.priority) {
                    case 'Tinggi': priorityClass = 'priority-high'; break;
                    case 'Sedang': priorityClass = 'priority-medium'; break;
                    case 'Rendah': priorityClass = 'priority-low'; break;
                    default: priorityClass = 'border-gray-200';
                }

                const taskHtml = `
                <div class="flex items-start gap-4">
                    <img src="${assignee ? assignee.avatar : 'https://placehold.co/40x40/ccc/fff?text=?'}" alt="${assignee ? assignee.name : 'N/A'}" class="w-10 h-10 rounded-full mt-1" title="${assignee ? assignee.name : 'N/A'}">
                    <div class="flex-grow">
                        <div class="flex justify-between items-center">
                            <p class="font-bold text-var(--text-primary)">${task.title}</p>
                            <span class="text-xs font-medium px-2 py-1 rounded-full ${deadlineClass}">${deadlineText}</span>
                        </div>
                        <p class="text-xs text-var(--text-secondary)">${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}</p>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div class="bg-var(--accent-primary) h-2.5 rounded-full" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
                
                const taskElement = document.createElement('div');
                taskElement.className = `p-4 rounded-lg bg-var(--bg-secondary) border-l-4 ${priorityClass}`;
                taskElement.innerHTML = taskHtml;
                timelineGrid.appendChild(taskElement);
            });
        }
        
        projectDiv.appendChild(timelineGrid);
        container.appendChild(projectDiv);
    });
}

function renderSuperAdminDashboard() {
    const totalProjectsEl = document.getElementById('sa-total-projects');
    if (!totalProjectsEl) return;

    totalProjectsEl.textContent = state.projects.length;
    document.getElementById('sa-total-tasks').textContent = state.allTasks.length;
    document.getElementById('sa-completed-tasks').textContent = state.allTasks.filter(t => t.status === 'Done').length;
    document.getElementById('sa-total-users').textContent = state.users.length;

    const tasksByDivision = DIVISIONS.reduce((acc, div) => {
        acc[div] = state.allTasks.filter(t => t.division === div).length;
        return acc;
    }, {});

    const tasksByStatus = state.allTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {});

    const divisionCtx = document.getElementById('tasks-by-division-chart')?.getContext('2d');
    if (divisionCtx) {
        new Chart(divisionCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(tasksByDivision),
                datasets: [{
                    label: 'Jumlah Tugas',
                    data: Object.values(tasksByDivision),
                    backgroundColor: ['#3b82f6', '#f59e0b', '#22c55e'],
                    hoverOffset: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    const statusCtx = document.getElementById('tasks-by-status-chart')?.getContext('2d');
    if (statusCtx) {
        new Chart(statusCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(tasksByStatus),
                datasets: [{
                    label: 'Jumlah Tugas',
                    data: Object.values(tasksByStatus),
                    backgroundColor: ['#60a5fa', '#facc15', '#4ade80']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' }
        });
    }
}

export function renderProjectDetail(projectId) {
    state.currentProject = projectId;
    listenForTasks(projectId);
    navigateTo('project-detail');
}

export function updateProjectDetailContent(projectId) {
    if (!projectId) return;
    setState({ currentProject: projectId });
    
    const kanbanContainer = document.getElementById('kanban-container');
    if (!kanbanContainer) return;

    const project = state.projects.find(p => p.id === projectId);
    if (!project) { navigateTo('projects'); return; }

    document.getElementById('project-detail-title').textContent = project.name;
    document.getElementById('project-detail-description').textContent = project.description;
    
    kanbanContainer.innerHTML = '';

    const userRole = state.currentUser.role;
    const userDivision = state.currentUser.division;

    const divisionsToShow = (userRole === 'Super Admin' || userRole === 'Admin') ? DIVISIONS : [userDivision];

    divisionsToShow.forEach(division => {
        const divisionHeader = document.createElement('h3');
        divisionHeader.className = 'text-2xl font-semibold mb-4 mt-6 col-span-3 text-var(--text-primary)';
        divisionHeader.textContent = `Divisi ${division}`;
        kanbanContainer.appendChild(divisionHeader);

        ['To Do', 'In Progress', 'Done'].forEach(status => {
            const column = document.createElement('div');
            column.className = 'bg-var(--bg-secondary) rounded-lg shadow p-4 kanban-column';
            column.dataset.status = status;
            column.dataset.division = division;
            column.innerHTML = `<h3 class="font-bold text-lg mb-4 border-b pb-2 border-var(--border-color) text-var(--text-primary)">${status}</h3><div class="task-list space-y-3 min-h-[100px]"></div>`;
            kanbanContainer.appendChild(column);
        });
    });

    state.tasks.forEach(task => {
        if (userRole === 'Super Admin' || userRole === 'Admin' || task.division === userDivision) {
            const assignee = state.users.find(u => u.id === task.assignedTo);
            const taskCard = document.createElement('div');
            taskCard.className = 'p-4 bg-var(--bg-primary) rounded-lg border border-var(--border-color) task-card';
            taskCard.draggable = true;
            taskCard.dataset.taskId = task.id;
            taskCard.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-semibold text-var(--text-primary)">${task.title}</h4>
                    <div class="flex items-center gap-2">
                        <button class="text-var(--accent-primary) hover:underline text-xs font-semibold task-detail-btn" data-task-id="${task.id}">Detail</button>
                        <button class="text-var(--text-secondary) hover:text-var(--text-primary) edit-task-btn" data-task-id="${task.id}"><i class="fas fa-pen text-xs"></i></button>
                    </div>
                </div>
                <p class="text-sm text-var(--text-secondary) mt-1 truncate">${task.description}</p>
                <div class="flex items-center mt-3">
                    <img src="${assignee ? assignee.avatar : 'https://placehold.co/24x24/ccc/fff?text=?'}" alt="Assignee" class="w-6 h-6 rounded-full" title="Ditugaskan kepada: ${assignee ? assignee.name : 'Belum ada'}">
                </div>
            `;
            const column = document.querySelector(`.kanban-column[data-status="${task.status}"][data-division="${task.division}"] .task-list`);
            if (column) column.appendChild(taskCard);
        }
    });
}

export function renderComments() {
    const container = document.getElementById('comment-list');
    if (!container) return;

    if (state.comments.length === 0) {
        container.innerHTML = '<p class="text-xs text-var(--text-secondary) text-center">Belum ada komentar.</p>';
        return;
    }

    container.innerHTML = state.comments.map(comment => {
        const commentDate = comment.createdAt ? comment.createdAt.toDate().toLocaleString('id-ID') : 'Baru saja';
        return `
            <div class="flex items-start gap-3 text-sm">
                <img src="${comment.authorAvatar}" alt="${comment.authorName}" class="w-8 h-8 rounded-full">
                <div>
                    <p>
                        <span class="font-semibold text-var(--text-primary)">${comment.authorName}</span>
                        <span class="text-xs text-gray-400 ml-2">${commentDate}</span>
                    </p>
                    <p class="text-var(--text-secondary)">${comment.text}</p>
                </div>
            </div>
        `;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

// --- MODAL & FORM RENDERERS ---

function renderUserManagementModal() {
    const oldModal = document.getElementById('user-management-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'user-management-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    // PERBAIKAN: Logika hirarki peran untuk mencegah Admin membuat Super Admin
    const roleHierarchy = { 'Member': 1, 'Admin': 2, 'Super Admin': 3 };
    const currentUserLevel = roleHierarchy[state.currentUser.role];
    const availableRoles = Object.keys(roleHierarchy).filter(role => roleHierarchy[role] <= currentUserLevel);

    let usersHtml = state.users.map(user => {
        const isCurrentUser = user.id === state.currentUser.id;
        
        const roleOptions = availableRoles.map(role => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${role}</option>`).join('');
        const divisionOptions = DIVISIONS.map(div => `<option value="${div}" ${user.division === div ? 'selected' : ''}>${div}</option>`).join('');

        return `
            <div class="grid grid-cols-3 gap-4 items-center p-3 border-b border-var(--border-color)">
                <div>
                    <p class="font-semibold text-var(--text-primary)">${user.name} ${isCurrentUser ? '<span class="text-xs text-blue-500">(Anda)</span>' : ''}</p>
                    <p class="text-sm text-var(--text-secondary)">${user.email}</p>
                </div>
                <div>
                    <select data-userid="${user.id}" data-field="role" class="user-update-select bg-var(--bg-primary) text-var(--text-primary) border border-var(--border-color) rounded px-2 py-1 w-full" ${isCurrentUser ? 'disabled' : ''}>
                        ${roleOptions}
                    </select>
                </div>
                <div>
                    <select data-userid="${user.id}" data-field="division" class="user-update-select bg-var(--bg-primary) text-var(--text-primary) border border-var(--border-color) rounded px-2 py-1 w-full" ${isCurrentUser ? 'disabled' : ''}>
                        ${divisionOptions}
                    </select>
                </div>
            </div>
        `;
    }).join('');

    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-var(--text-primary)">Manajemen Pengguna & Divisi</h2>
                <button id="close-user-modal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div class="bg-var(--bg-primary) p-4 rounded-lg mb-6">
                <h3 class="font-semibold mb-2 text-var(--text-primary)">Tambah Pengguna Baru</h3>
                <p class="text-sm text-var(--text-secondary) mb-4">
                    Minta pengguna baru untuk mendaftar sendiri melalui <a href="login.html" target="_blank" class="text-var(--accent-primary) underline">halaman login</a>.
                </p>
            </div>
            <div class="grid grid-cols-3 gap-4 px-3 mb-2 font-bold text-sm text-var(--text-secondary)">
                <span>Pengguna</span>
                <span>Peran (Role)</span>
                <span>Divisi</span>
            </div>
            <div class="max-h-64 overflow-y-auto">${usersHtml}</div>
        </div>
    `;

    // modal.innerHTML = `
    //     <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl">
    //         <div class="flex justify-between items-center mb-6">
    //             <h2 class="text-2xl font-bold">Manajemen Pengguna & Divisi</h2>
    //             <button id="close-user-modal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
    //         </div>

    //         <div class="bg-gray-50 p-4 rounded-lg mb-6">
    //             <h3 class="font-semibold mb-2">Tambah Pengguna Baru</h3>
    //             <p class="text-sm text-gray-600 mb-4">
    //                 Minta pengguna baru untuk mendaftar sendiri melalui <a href="login.html" target="_blank" class="text-blue-600 underline">halaman login</a>. Akun mereka akan otomatis muncul di sini setelah mereka memverifikasi email.
    //             </p>
    //         </div>

    //         <div class="grid grid-cols-3 gap-4 px-3 mb-2 font-bold text-sm">
    //             <span>Pengguna</span>
    //             <span>Peran (Role)</span>
    //             <span>Divisi</span>
    //         </div>
    //         <div class="max-h-64 overflow-y-auto">
    //             ${usersHtml}
    //         </div>
    //     </div>
    // `;

    document.body.appendChild(modal);

    modal.querySelector('#close-user-modal').addEventListener('click', () => modal.remove());

    modal.querySelectorAll('.user-update-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const userId = e.target.dataset.userid;
            const field = e.target.dataset.field;
            const value = e.target.value;
            updateUser(userId, { [field]: value });
        });
    });
}

function renderTaskDetailModal(task) {
    const oldModal = document.getElementById('task-detail-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'task-detail-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4';
    modal.dataset.taskId = task.id;
    
    const assignee = state.users.find(u => u.id === task.assignedTo);
    
    const deleteButtonHtml = (state.currentUser.role === 'Admin' || state.currentUser.role === 'Super Admin') ? 
        `<div><button id="delete-task-btn" class="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-xs font-semibold">Hapus Tugas</button></div>` : '';

    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div class="p-6 border-b border-var(--border-color)">
                <div class="flex justify-between items-start">
                    <h2 class="text-2xl font-bold text-var(--text-primary)">${task.title}</h2>
                    <button id="close-task-detail-modal" class="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <p class="text-sm text-var(--text-secondary) mt-2">${task.description}</p>
            </div>
            <div class="p-6 grid grid-cols-3 gap-4 text-sm text-var(--text-primary)">
                <div><strong>Ditugaskan Kepada:</strong><br>${assignee ? assignee.name : 'N/A'}</div>
                <div><strong>Tanggal Mulai:</strong><br>${task.startDate.toDate().toLocaleDateString('id-ID')}</div>
                <div><strong>Jatuh Tempo:</strong><br>${task.endDate.toDate().toLocaleDateString('id-ID')}</div>
                <div><strong>Prioritas:</strong><br>${task.priority || 'Normal'}</div>
                <div><strong>Status:</strong><br>${task.status}</div>
                ${deleteButtonHtml}
            </div>
            <div class="flex-grow bg-var(--bg-primary) p-6 overflow-y-auto">
                <h3 class="font-bold mb-4 text-var(--text-primary)">Komentar</h3>
                <div id="comment-list" class="space-y-4"></div>
            </div>
            <div class="p-6 border-t border-var(--border-color) bg-var(--bg-secondary)">
                <form id="comment-form" class="flex gap-2">
                    <input type="text" id="comment-input" placeholder="Tulis komentar..." class="w-full px-3 py-2 border border-var(--border-color) rounded-lg bg-var(--bg-primary) text-var(--text-primary)" required>
                    <button type="submit" class="px-4 py-2 bg-var(--accent-primary) text-black rounded-lg hover:bg-var(--accent-hover) font-semibold">Kirim</button>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    listenForComments(task.id);

    modal.querySelector('#close-task-detail-modal').addEventListener('click', () => {
        state.unsubscribeComments();
        modal.remove();
    });

    modal.querySelector('#comment-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const commentInput = modal.querySelector('#comment-input');
        saveComment(task.id, commentInput.value);
        commentInput.value = '';
    });

    modal.querySelector('#send-warning-btn').addEventListener('click', () => {
        console.log(`PERINGATAN: Mengirim notifikasi ke ${assignee ? assignee.name : 'pengguna'} untuk tugas "${task.title}" yang akan jatuh tempo.`);
        alert(`Peringatan jatuh tempo untuk tugas "${task.title}" telah dikirim ke ${assignee ? assignee.name : 'pengguna'}.`);
    });

    // FITUR BARU: Event listener untuk tombol hapus
    const deleteBtn = modal.querySelector('#delete-task-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm(`Apakah Anda yakin ingin menghapus tugas "${task.title}"? Aksi ini tidak dapat dibatalkan.`)) {
                await deleteTask(task.id);
                modal.remove(); // Tutup modal setelah hapus
            }
        });
    }
}

function openProjectModal(project = null) {
    const modal = document.getElementById('project-modal');
    if (!modal) return;
    const form = modal.querySelector('#project-form');
    form.reset();
    modal.querySelector('#project-id').value = project ? project.id : '';
    modal.querySelector('#project-modal-title').textContent = project ? 'Edit Proyek' : 'Proyek Baru';
    if (project) {
        modal.querySelector('#project-name').value = project.name;
        modal.querySelector('#project-description').value = project.description;
        modal.querySelector('#project-start-date').value = project.startDate.toDate().toISOString().split('T')[0];
        modal.querySelector('#project-end-date').value = project.endDate.toDate().toISOString().split('T')[0];
    }
    modal.classList.remove('hidden');
}

function openTaskModal(task = null) {
    const modal = document.getElementById('task-modal');
    if (!modal) return;
    const form = modal.querySelector('#task-form');
    form.reset();
    modal.querySelector('#task-id').value = task ? task.id : '';
    modal.querySelector('#task-modal-title').textContent = task ? 'Edit Tugas' : 'Tugas Baru';

    const userRole = state.currentUser.role;
    const userDivision = state.currentUser.division;
    const divisionSelect = modal.querySelector('#task-division');
    
    if (userRole === 'Super Admin' || userRole === 'Admin') {
        divisionSelect.disabled = false;
    } else {
        divisionSelect.value = userDivision;
        divisionSelect.disabled = true;
    }
    
    const selectedDivision = divisionSelect.value;
    const usersInDivision = state.users.filter(u => u.division === selectedDivision);

    const assigneeSelect = modal.querySelector('#task-assignee');
    assigneeSelect.innerHTML = '<option value="">-- Pilih Anggota --</option>';
    usersInDivision.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        assigneeSelect.appendChild(option);
    });

    if (task) {
        modal.querySelector('#task-title').value = task.title;
        modal.querySelector('#task-description').value = task.description;
        divisionSelect.value = task.division;
        assigneeSelect.value = task.assignedTo;
        modal.querySelector('#task-start-date').value = task.startDate.toDate().toISOString().split('T')[0];
        modal.querySelector('#task-end-date').value = task.endDate.toDate().toISOString().split('T')[0];
        modal.querySelector('#task-priority').value = task.priority || 'Sedang';
    }
    modal.classList.remove('hidden');
}

// --- THEME ---

function applyTheme(theme) {
    const root = document.documentElement;
    const themeIcon = document.querySelector('#theme-switcher-btn i');
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    } else {
        root.setAttribute('data-theme', 'light');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

// --- EVENT LISTENERS & HANDLERS ---

function setupEventListeners() {
    appContainer.addEventListener('click', (e) => {
        const target = e.target;
        
        // Navigation
        const navLink = target.closest('.nav-link');
        if (navLink) {
            e.preventDefault();
            const page = navLink.id.replace('nav-', '');
            if (page === 'manage-users-btn') {
                renderUserManagementModal();
            } else {
                navigateTo(page);
            }
            return;
        }

        // Global Actions
        if (target.closest('#logout-btn')) { handleLogout(); return; }
        if (target.closest('#theme-switcher-btn')) {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
            return;
        }

        // PERBAIKAN: Menambahkan listener untuk tombol "Lihat Proyek"
        const viewProjectBtn = e.target.closest('.view-task-project');
        if (viewProjectBtn) {
            const projectId = viewProjectBtn.dataset.projectId;
            if (projectId) {
                renderProjectDetail(projectId);
            }
            return;
        }

        const detailBtn = e.target.closest('.task-detail-btn');
        if (detailBtn) {
            const taskId = detailBtn.dataset.taskId;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                renderTaskDetailModal(task);
            }
            return;
        }

        if (e.target.closest('#back-to-projects-btn')) {
            navigateTo('projects');
            return;
        }

        const projectCard = e.target.closest('#project-list .cursor-pointer');
        if (projectCard && !e.target.closest('.group')) {
            renderProjectDetail(projectCard.dataset.projectId);
            return;
        }

        if (e.target.closest('#add-project-btn')) {
            openProjectModal();
            return;
        }

        if (e.target.closest('#add-task-btn')) {
            openTaskModal();
            return;
        }
        
        if (e.target.closest('#cancel-project-btn')) {
            document.getElementById('project-modal').classList.add('hidden');
            return;
        }
        if (e.target.closest('#cancel-task-btn')) {
            document.getElementById('task-modal').classList.add('hidden');
            return;
        }

        const editProjectBtn = e.target.closest('.edit-project-btn');
        if (editProjectBtn) {
            e.preventDefault();
            const project = state.projects.find(p => p.id === editProjectBtn.dataset.projectId);
            openProjectModal(project);
            return;
        }

        const deleteProjectBtn = e.target.closest('.delete-project-btn');
        if (deleteProjectBtn) {
            e.preventDefault();
            if (confirm('Apakah Anda yakin ingin menghapus proyek ini? (Tugas tidak akan terhapus)')) {
                deleteDoc(doc(collections.projects, deleteProjectBtn.dataset.projectId));
            }
            return;
        }
        
        const editTaskBtn = e.target.closest('.edit-task-btn');
        if (editTaskBtn) {
            const task = state.tasks.find(t => t.id === editTaskBtn.dataset.taskId);
            openTaskModal(task);
            return;
        }

        // Modal Close Buttons
        if (target.matches('.close-modal-btn') || target.closest('.close-modal-btn') || target.id === 'close-user-modal' || target.closest('#cancel-project-btn') || target.closest('#cancel-task-btn')) {
            const modal = target.closest('.fixed');
            if (modal) {
                if(modal.id === 'project-modal' || modal.id === 'task-modal'){
                    modal.classList.add('hidden');
                } else {
                    modal.remove();
                }
            }
            return;
        }

        // Page-specific Actions
        handleProjectListPageEvents(target, e);
        handleProjectDetailPageEvents(target, e);
        handleUserManagementModalEvents(target);
        handleTaskDetailModalEvents(target);
    });

    appContainer.addEventListener('submit', (e) => {
        if (e.target.id === 'project-form') handleProjectFormSubmit(e);
        if (e.target.id === 'task-form') handleTaskFormSubmit(e);
        if (e.target.id === 'comment-form') handleCommentFormSubmit(e);
    });
    
    // Drag and Drop listeners
    let draggedItem = null;
    appContainer.addEventListener('dragstart', e => {
        if (e.target.classList.contains('task-card')) {
            draggedItem = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });
    appContainer.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    });
    appContainer.addEventListener('dragover', e => {
        e.preventDefault();
        const column = e.target.closest('.kanban-column');
        if (column) column.classList.add('drag-over');
    });
    appContainer.addEventListener('dragleave', e => {
        const column = e.target.closest('.kanban-column');
        if (column) column.classList.remove('drag-over');
    });
    appContainer.addEventListener('drop', e => {
        e.preventDefault();
        const column = e.target.closest('.kanban-column');
        if (column && draggedItem) {
            column.classList.remove('drag-over');
            const newStatus = column.dataset.status;
            const taskId = draggedItem.dataset.taskId;
            updateTaskStatus(taskId, newStatus);
        }
    });
}

function handleProjectListPageEvents(target, e) {
    if (state.currentPage !== 'projects') return;

    const projectCard = target.closest('#project-list .cursor-pointer');
    if (projectCard && !target.closest('.group')) {
        listenForTasks(projectCard.dataset.projectId);
        navigateTo('project-detail');
        return;
    }

    if (target.closest('#add-project-btn')) { openProjectModal(); return; }
    
    const editBtn = target.closest('.edit-project-btn');
    if (editBtn) {
        e.preventDefault();
        const project = state.projects.find(p => p.id === editBtn.dataset.projectId);
        openProjectModal(project);
        return;
    }

    const deleteBtn = target.closest('.delete-project-btn');
    if (deleteBtn) {
        e.preventDefault();
        if (confirm('Yakin ingin menghapus proyek ini?')) {
            deleteProject(deleteBtn.dataset.projectId);
        }
        return;
    }
}

function handleProjectDetailPageEvents(target, e) {
    if (state.currentPage !== 'project-detail') return;

    if (target.closest('#back-to-projects-btn')) { navigateTo('projects'); return; }
    if (target.closest('#add-task-btn')) { openTaskModal(); return; }
    
    const detailBtn = target.closest('.task-detail-btn');
    if (detailBtn) {
        const task = state.tasks.find(t => t.id === detailBtn.dataset.taskId);
        if (task) renderTaskDetailModal(task);
        return;
    }

    const editBtn = target.closest('.edit-task-btn');
    if (editBtn) {
        const task = state.tasks.find(t => t.id === editBtn.dataset.taskId);
        if (task) openTaskModal(task);
        return;
    }
}

function handleUserManagementModalEvents(target) {
    const select = target.closest('.user-update-select');
    if (select) {
        const userId = select.dataset.userid;
        const field = select.dataset.field;
        const value = select.value;
        updateUser(userId, { [field]: value });
    }
}

function handleTaskDetailModalEvents(target) {
    const deleteBtn = target.closest('#delete-task-btn');
    if (deleteBtn) {
        const modal = target.closest('#task-detail-modal');
        const taskId = modal.dataset.taskId;
        const task = state.allTasks.find(t => t.id === taskId);
        if (confirm(`Yakin ingin menghapus tugas "${task.title}"?`)) {
            deleteTask(taskId);
            modal.remove();
        }
    }
}


function handleProjectFormSubmit(e) {
    e.preventDefault();
    const id = e.target.querySelector('#project-id').value;
    const projectData = {
        id: id,
        name: e.target.querySelector('#project-name').value,
        description: e.target.querySelector('#project-description').value,
        startDate: e.target.querySelector('#project-start-date').value,
        endDate: e.target.querySelector('#project-end-date').value,
    };
    saveProject(projectData);
    e.target.closest('.fixed').classList.add('hidden');
}

function handleTaskFormSubmit(e) {
    e.preventDefault();
    const id = e.target.querySelector('#task-id').value;
    const existingTask = id ? state.tasks.find(t => t.id === id) : {};
    const taskData = {
        id: id,
        title: e.target.querySelector('#task-title').value,
        description: e.target.querySelector('#task-description').value,
        division: e.target.querySelector('#task-division').value,
        assignedTo: e.target.querySelector('#task-assignee').value,
        startDate: e.target.querySelector('#task-start-date').value,
        endDate: e.target.querySelector('#task-end-date').value,
        priority: e.target.querySelector('#task-priority').value,
        projectId: state.currentProject,
        status: existingTask.status || 'To Do',
    };
    saveTask(taskData);
    e.target.closest('.fixed').classList.add('hidden');
}

function handleCommentFormSubmit(e) {
    e.preventDefault();
    const input = e.target.querySelector('#comment-input');
    const taskId = e.target.closest('#task-detail-modal').dataset.taskId;
    saveComment(taskId, input.value);
    input.value = '';
}
