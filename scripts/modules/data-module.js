// data-module.js
// Modul ini bertanggung jawab untuk semua operasi data:
// mengambil, menyimpan, memperbarui, dan menghapus data dari Firestore.

import { onSnapshot, query, where, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, collections } from './firebase-module.js';
import { state, setState } from './state-module.js';
import { renderCurrentPage, updateProjectDetailContent, renderComments } from './ui-module.js';

// --- DATA FETCHING & REAL-TIME LISTENERS ---

export async function fetchAllUsers() {
    try {
        const usersSnapshot = await getDocs(collections.users);
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState({ users });
    } catch (error) {
        console.warn("Could not fetch all users:", error);
        if (state.currentUser && !state.users.some(u => u.id === state.currentUser.id)) {
            setState({ users: [...state.users, state.currentUser] });
        }
    }
}

export function listenForDataChanges() {
    if (state.unsubscribeProjects) state.unsubscribeProjects();
    state.unsubscribeProjects = onSnapshot(query(collections.projects), (snapshot) => {
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState({ projects });
        if (state.currentPage) renderCurrentPage();
    }, (error) => console.error("Error listening to projects:", error));

    if (state.unsubscribeAllTasks) state.unsubscribeAllTasks();
    state.unsubscribeAllTasks = onSnapshot(query(collections.tasks), (snapshot) => {
        const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState({ allTasks });
        if (state.currentPage) renderCurrentPage();
    }, (error) => console.error("Error listening to tasks:", error));
}

export function listenForTasks(projectId) {
    if (state.unsubscribeTasks) state.unsubscribeTasks();
    const tasksQuery = query(collections.tasks, where("projectId", "==", projectId));
    state.unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState({ tasks });
        if (state.currentPage === 'project-detail') {
            updateProjectDetailContent(projectId);
        }
    });
}

export function listenForComments(taskId) {
    if (state.unsubscribeComments) state.unsubscribeComments();
    const commentsQuery = query(collections.comments, where("taskId", "==", taskId), orderBy("createdAt"));
    state.unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState({ comments });
        renderComments();
    });
}

// --- CRUD OPERATIONS ---

export async function saveProject(data) {
    const projectData = {
        name: data.name,
        description: data.description,
        startDate: Timestamp.fromDate(new Date(data.startDate)),
        endDate: Timestamp.fromDate(new Date(data.endDate)),
    };

    if (data.id) {
        const projectRef = doc(collections.projects, data.id);
        await updateDoc(projectRef, projectData);
    } else {
        await addDoc(collections.projects, projectData);
    }
}

export async function deleteProject(projectId) {
    if (!projectId) return;
    await deleteDoc(doc(collections.projects, projectId));
}


export async function saveTask(data) {
    const taskData = {
        ...data,
        startDate: Timestamp.fromDate(new Date(data.startDate)),
        endDate: Timestamp.fromDate(new Date(data.endDate)),
    };
    
    if (data.id) {
        const taskRef = doc(collections.tasks, data.id);
        delete taskData.id;
        await updateDoc(taskRef, taskData);
    } else {
        await addDoc(collections.tasks, taskData);
    }
}

export async function updateTaskStatus(taskId, newStatus) {
    const taskRef = doc(collections.tasks, taskId);
    await updateDoc(taskRef, { status: newStatus });
}

export async function deleteTask(taskId) {
    const commentsQuery = query(collections.comments, where("taskId", "==", taskId));
    const commentsSnapshot = await getDocs(commentsQuery);
    const batch = writeBatch(db);
    commentsSnapshot.forEach(commentDoc => {
        batch.delete(commentDoc.ref);
    });
    
    const taskRef = doc(collections.tasks, taskId);
    batch.delete(taskRef);

    await batch.commit();
}

export async function saveComment(taskId, text) {
    if (!text.trim()) return;
    await addDoc(collections.comments, {
        taskId: taskId,
        text: text,
        authorId: state.currentUser.id,
        authorName: state.currentUser.name,
        authorAvatar: state.currentUser.avatar,
        createdAt: serverTimestamp()
    });
}

export async function updateUser(userId, data) {
    const userRef = doc(collections.users, userId);
    try {
        await updateDoc(userRef, data);
        const userInState = state.users.find(u => u.id === userId);
        if (userInState) {
            Object.assign(userInState, data);
        }
    } catch (error) {
        console.error("Error updating user:", error);
    }
}
