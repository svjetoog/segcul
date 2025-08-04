// js/main.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword, deleteUser } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, doc, addDoc, deleteDoc, onSnapshot, query, serverTimestamp, getDocs, writeBatch, updateDoc, arrayUnion, where, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { 
    getEl, showNotification, renderSalasGrid, createCicloCard, createLogEntry,
    renderGeneticsList, renderStockList, renderSeedBankList, initializeAppEventListeners
} from './ui.js';

// --- STATE MANAGEMENT ---
let userId = null;
let salasUnsubscribe = null;
let ciclosUnsubscribe = null;
let logsUnsubscribe = null;
let geneticsUnsubscribe = null;
let seedsUnsubscribe = null;
let currentSalas = [];
let currentCiclos = [];
let currentGenetics = [];
let currentSeeds = [];
let currentSalaId = null; 
let currentSalaName = null;
let confirmCallback = null;
let mainAppListenersInitialized = false;

// --- AUTHENTICATION & VIEW MANAGEMENT ---
onAuthStateChanged(auth, user => {
    // Oculta el spinner inicial porque la verificación de Firebase ya terminó.
    getEl('initial-loader').classList.add('hidden');

    if (user) {
        if (user.isAnonymous) {
            signOut(auth);
            return; 
        }
        
        userId = user.uid;
        getEl('authView').classList.add('hidden');
        getEl('app').classList.remove('hidden');
        getEl('welcomeUser').innerText = `Anota todo, no seas pancho.`;

        if (!mainAppListenersInitialized) {
            initializeAppEventListeners(handlers);
            mainAppListenersInitialized = true;
        }

        loadSalas();
        loadCiclos();
        loadGenetics();
        loadSeeds();
    } else {
        userId = null;
        if(salasUnsubscribe) salasUnsubscribe();
        if(ciclosUnsubscribe) ciclosUnsubscribe();
        if(geneticsUnsubscribe) geneticsUnsubscribe();
        if(seedsUnsubscribe) seedsUnsubscribe();
        
        getEl('app').classList.add('hidden');
        getEl('ciclosView').classList.add('hidden');
        getEl('cicloDetailView').classList.add('hidden');
        getEl('toolsView').classList.add('hidden');
        getEl('settingsView').classList.add('hidden');
        getEl('authView').classList.remove('hidden'); // Muestra el login
        mainAppListenersInitialized = false;
    }
});

const handleAuthError = (error) => {
    switch (error.code) {
        case 'auth/invalid-email': return 'El formato del email no es válido.';
        case 'auth/user-not-found':
        case 'auth/wrong-password': return 'Email o contraseña incorrectos.';
        case 'auth/email-already-in-use': return 'Este email ya está registrado.';
        case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.';
        default: return 'Ocurrió un error. Inténtalo de nuevo.';
    }
};

// --- AUTH VIEW LISTENERS ---
getEl('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = getEl('login-email').value;
    const password = getEl('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .catch(error => {
            getEl('authError').innerText = handleAuthError(error);
            getEl('authError').classList.remove('hidden');
        });
});

getEl('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = getEl('register-email').value;
    const password = getEl('register-password').value;
    createUserWithEmailAndPassword(auth, email, password)
        .catch(error => {
            getEl('authError').innerText = handleAuthError(error);
            getEl('authError').classList.remove('hidden');
        });
});

getEl('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    getEl('loginForm').classList.add('hidden');
    getEl('registerForm').classList.remove('hidden');
    getEl('authError').classList.add('hidden');
});

getEl('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    getEl('registerForm').classList.add('hidden');
    getEl('loginForm').classList.remove('hidden');
    getEl('authError').classList.add('hidden');
});

getEl('aboutBtnAuth').addEventListener('click', () => getEl('aboutModal').style.display = 'flex');
getEl('aboutBtnAuthRegister').addEventListener('click', () => getEl('aboutModal').style.display = 'flex');
getEl('closeAboutBtn').addEventListener('click', () => getEl('aboutModal').style.display = 'none');

// --- HELPERS ---
function calculateDaysSince(startDateString) {
    if (!startDateString) return null;
    const start = new Date(startDateString + 'T00:00:00Z');
    if (isNaN(start.getTime())) return null;
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    if (start > todayUTC) return 0;
    const diffTime = todayUTC - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
}

function getPhaseInfo(phaseName) {
    switch(phaseName) {
        case 'PRE-FLORA': return { name: 'PRE-FLORA', color: 'bg-purple-600', class: 'pre-flora' };
        case 'FLORA': return { name: 'FLORA', color: 'bg-pink-600', class: 'flora' };
        case 'MADURACION': return { name: 'MADURACION', color: 'bg-orange-600', class: 'maduracion' };
        case 'LAVADO': return { name: 'LAVADO', color: 'bg-blue-600', class: 'lavado' };
        case 'SECADO': return { name: 'SECADO', color: 'bg-yellow-600 text-black', class: 'secado' };
        default: return { name: 'Finalizado', color: 'bg-gray-500', class: 'finalizado' };
    }
}

function generateStandardWeeks() {
    const weeks = [];
    for (let i = 1; i <= 10; i++) {
        let phaseName;
        if (i <= 3) phaseName = 'PRE-FLORA';
        else if (i <= 6) phaseName = 'FLORA';
        else if (i <= 8) phaseName = 'MADURACION';
        else if (i === 9) phaseName = 'LAVADO';
        else if (i === 10) phaseName = 'SECADO';
        weeks.push({ weekNumber: i, phaseName });
    }
    return weeks;
}

function formatFertilizers(ferts) {
    if (!ferts) return 'Ninguno';
    const used = [];
    if (ferts.basesAmount && ferts.basesUnit) {
        used.push(`Bases (${ferts.basesAmount} ${ferts.basesUnit})`);
    }
    if (ferts.enzimas) used.push('Enzimas');
    if (ferts.candy) used.push('Candy');
    if (ferts.bigBud) used.push('BigBud');
    if (ferts.flawlessFinish) used.push('FlawlessFinish');
    if (ferts.foliar && ferts.foliarProduct) {
        used.push(`Foliar (${ferts.foliarProduct})`);
    }
    return used.length > 0 ? used.join(', ') : 'Ninguno';
}

// --- DATA LOADING ---
function loadSalas() {
    if (!userId) return;
    getEl('loadingSalas').style.display = 'block';
    getEl('emptySalasState').style.display = 'none';

    const salasRef = collection(db, `users/${userId}/salas`);
    const q = query(salasRef);

    if (salasUnsubscribe) salasUnsubscribe();
    salasUnsubscribe = onSnapshot(q, (snapshot) => {
        currentSalas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderSalasGrid(currentSalas, currentCiclos, handlers);
    }, error => {
        console.error("Error loading salas:", error);
        getEl('loadingSalas').innerText = "Error al cargar las salas.";
    });
}

function loadCiclos() {
    if (!userId) return;
    const ciclosRef = collection(db, `users/${userId}/ciclos`);
    const q = query(ciclosRef);

    if (ciclosUnsubscribe) ciclosUnsubscribe();
    ciclosUnsubscribe = onSnapshot(q, (snapshot) => {
        currentCiclos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        renderSalasGrid(currentSalas, currentCiclos, handlers); 

        if (!getEl('ciclosView').classList.contains('hidden')) {
            handlers.showCiclosView(currentSalaId, currentSalaName);
        }
        
        if (!getEl('cicloDetailView').classList.contains('hidden')) {
            const activeCicloId = getEl('cicloDetailContent').querySelector('[data-ciclo-id]')?.dataset.cicloId;
            if (activeCicloId) {
                const updatedCiclo = currentCiclos.find(c => c.id === activeCicloId);
                if (updatedCiclo) {
                    handlers.showCicloDetails(updatedCiclo);
                } else {
                    handlers.hideCicloDetails();
                }
            }
        }
    });
}

function loadGenetics() {
    if (!userId) return;
    const geneticsRef = collection(db, `users/${userId}/genetics`);
    const q = query(geneticsRef);

    if (geneticsUnsubscribe) geneticsUnsubscribe();
    geneticsUnsubscribe = onSnapshot(q, (snapshot) => {
        currentGenetics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderGeneticsList(currentGenetics, handlers);
        renderStockList(currentGenetics, handlers);
    });
}

function loadSeeds() {
    if (!userId) return;
    const seedsRef = collection(db, `users/${userId}/seeds`);
    const q = query(seedsRef);

    if (seedsUnsubscribe) seedsUnsubscribe();
    seedsUnsubscribe = onSnapshot(q, (snapshot) => {
        currentSeeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderSeedBankList(currentSeeds, handlers);
    });
}

function loadLogsForCiclo(cicloId, weekNumbers) {
    if (logsUnsubscribe) logsUnsubscribe();
    
    const logsRef = collection(db, `users/${userId}/ciclos/${cicloId}/logs`);
    const q = query(logsRef);

    logsUnsubscribe = onSnapshot(q, (snapshot) => {
        weekNumbers.forEach(weekNum => {
             const logContainer = getEl(`logs-week-${weekNum}`);
            if(logContainer) {
                   logContainer.innerHTML = `<p class="text-gray-500 italic">No hay registros para esta semana.</p>`;
            }
        });

        const allLogs = snapshot.docs.map(doc => {
            const data = doc.data();
            const logDate = data.date && data.date.toDate ? data.date.toDate() : new Date();
            return { id: doc.id, ...data, date: logDate };
        });

        allLogs.sort((a, b) => b.date - a.date);

        allLogs.forEach(log => {
            const logContainer = getEl(`logs-week-${log.week}`);
            if (logContainer) {
                if (logContainer.querySelector('p.italic')) {
                    logContainer.innerHTML = '';
                }
                const ciclo = currentCiclos.find(c => c.id === cicloId);
                const logEntry = createLogEntry(log, ciclo, handlers);
                logContainer.appendChild(logEntry);
            }
        });
    });
}

// --- HANDLERS & LOGIC FUNCTIONS ---
const handlers = {
    signOut: () => signOut(auth),
    calculateDaysSince,
    getPhaseInfo,
    formatFertilizers,
    // Resto de los handlers...
};