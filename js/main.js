// js/main.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword, deleteUser } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, doc, addDoc, deleteDoc, onSnapshot, query, serverTimestamp, getDocs, writeBatch, updateDoc, arrayUnion, where, increment, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
    getEl, showNotification, renderSalasGrid, createCicloCard, createLogEntry,
    renderGeneticsList, renderStockList,
    renderBaulSemillasList,
    renderGeneticsListCompact, renderBaulSemillasListCompact, renderStockListCompact,
    initializeEventListeners,
    renderCicloDetails, renderToolsView, renderSettingsView,
    openSalaModal as uiOpenSalaModal,
    openCicloModal as uiOpenCicloModal,
    openLogModal as uiOpenLogModal,
    openGerminateModal as uiOpenGerminateModal,
    openMoveCicloModal as uiOpenMoveCicloModal,
    openFinalizarCicloModal as uiOpenFinalizarCicloModal,
    renderHistorialView
} from './ui.js';
import { startMainTour, startToolsTour } from './onboarding.js';

// --- STATE MANAGEMENT ---
let userId = null;
let salasUnsubscribe = null, ciclosUnsubscribe = null, logsUnsubscribe = null, geneticsUnsubscribe = null, seedsUnsubscribe = null, historialUnsubscribe = null;
let currentSalas = [], currentCiclos = [], currentGenetics = [], currentSeeds = [], currentHistorial = [];
let currentSalaId = null, currentSalaName = null;
let confirmCallback = null;
let activeToolsTab = 'genetics';
let toolsViewMode = localStorage.getItem('toolsViewMode') || 'card';
let sortableSalas = null;
let sortableGenetics = null;
let sortableStock = null;
let sortableSeeds = null;

const PREDEFINED_TAGS = {
    "Cualidades del Producto Final": ["Muy Potente", "Ultra Resinoso", "Aroma Intenso", "Sabor Complejo", "Flores Densas", "Aspecto Atractivo"],
    "Experiencia de Cultivo": ["Fácil de Cultivar", "Resistente a Plagas"],
    "Producción": ["Baja Producción", "Producción Media", "Alta Producción"]
};
const MAX_CUSTOM_TAGS = 3;


// --- 1. FUNCTION DEFINITIONS (LOGIC & DATA) ---

function handleAuthError(error) {
    switch (error.code) {
        case 'auth/invalid-email': return 'El formato del email no es válido.';
        case 'auth/user-not-found': case 'auth/wrong-password': return 'Email o contraseña incorrectos.';
        case 'auth/email-already-in-use': return 'Este email ya está registrado.';
        case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.';
        default: return 'Ocurrió un error. Inténtalo de nuevo.';
    }
}

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

function calculateDaysBetween(start, end) {
    if (!start || !end) return 0;
    const startDate = start.toDate ? start.toDate() : start;
    const endDate = end.toDate ? end.toDate() : end;
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}


function getPhaseInfo(phaseName) {
    switch(phaseName) {
        case 'Vegetativo': return { name: 'VEGETATIVO', color: 'bg-green-600', class: 'vegetativo' };
        case 'PRE-FLORA': return { name: 'PRE-FLORA', color: 'bg-purple-600', class: 'pre-flora' };
        case 'FLORA': return { name: 'FLORA', color: 'bg-pink-600', class: 'flora' };
        case 'MADURACION': return { name: 'MADURACION', color: 'bg-orange-600', class: 'maduracion' };
        case 'LAVADO': return { name: 'LAVADO', color: 'bg-blue-600', class: 'lavado' };
        case 'en_secado': return { name: 'EN SECADO', color: 'bg-yellow-400 text-black', class: 'secado' };
        default: return { name: 'Finalizado', color: 'bg-gray-500', class: 'finalizado' };
    }
}

function generateVegetativeWeeks() {
    const weeks = [];
    for (let i = 1; i <= 4; i++) {
        weeks.push({ weekNumber: i, phaseName: 'Vegetativo' });
    }
    return weeks;
}

function generateStandardWeeks() {
    const weeks = [];
    for (let i = 1; i <= 9; i++) {
        let phaseName;
        if (i <= 3) phaseName = 'PRE-FLORA';
        else if (i <= 6) phaseName = 'FLORA';
        else if (i <= 8) phaseName = 'MADURACION';
        else if (i === 9) phaseName = 'LAVADO';
        weeks.push({ weekNumber: i, phaseName });
    }
    return weeks;
}

function formatFertilizers(fertilizers) {
    if (!fertilizers) return 'Ninguno';
    if (Array.isArray(fertilizers) && fertilizers.length > 0) {
        return fertilizers.map(f => `${f.productName} (${f.dose} ${f.unit})`).join(', ');
    }
    if (typeof fertilizers === 'object' && !Array.isArray(fertilizers)) {
        const used = [];
        if (fertilizers.basesAmount && fertilizers.basesUnit) used.push(`Bases (${fertilizers.basesAmount} ${fertilizers.basesUnit})`);
        if (fertilizers.enzimas) used.push('Enzimas');
        if (fertilizers.candy) used.push('Candy');
        if (fertilizers.bigBud) used.push('BigBud');
        if (fertilizers.flawlessFinish) used.push('FlawlessFinish');
        if (fertilizers.foliar && fertilizers.foliarProduct) used.push(`Foliar (${fertilizers.foliarProduct})`);
        return used.length > 0 ? used.join(', ') : 'Ninguno';
    }
    return 'Ninguno';
}

function initializeDragAndDrop() {
    const salasGrid = getEl('salasGrid');
    if (sortableSalas) sortableSalas.destroy();

    if (salasGrid) {
        sortableSalas = new Sortable(salasGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: async (evt) => {
                const batch = writeBatch(db);
                Array.from(evt.to.children).forEach((item, index) => {
                    const salaId = item.dataset.salaId;
                    if (salaId) {
                        const salaRef = doc(db, `users/${userId}/salas`, salaId);
                        batch.update(salaRef, { position: index });
                    }
                });
                try {
                    await batch.commit();
                    showNotification('Orden de salas guardado.');
                } catch (error) {
                    console.error("Error saving new sala order:", error);
                    showNotification('Error al guardar el nuevo orden.', 'error');
                }
            },
        });
    }
}

function destroyToolSortables() {
    if (sortableGenetics) {
        sortableGenetics.destroy();
        sortableGenetics = null;
    }
    if (sortableStock) {
        sortableStock.destroy();
        sortableStock = null;
    }
    if (sortableSeeds) {
        sortableSeeds.destroy();
        sortableSeeds = null;
    }
}

function initializeToolsDragAndDrop() {
    const onSortEnd = async (evt, collectionName) => {
        const batch = writeBatch(db);
        Array.from(evt.to.children).forEach((item, index) => {
            const docId = item.dataset.id;
            if (docId) {
                const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
                batch.update(docRef, { position: index });
            }
        });
        try {
            await batch.commit();
            showNotification('Orden guardado.');
        } catch (error) {
            console.error(`Error saving new ${collectionName} order:`, error);
            showNotification('Error al guardar el nuevo orden.', 'error');
        }
    };

    destroyToolSortables();

    if (activeToolsTab === 'genetics') {
        const geneticsList = getEl('geneticsList');
        if (geneticsList) {
            sortableGenetics = new Sortable(geneticsList, { animation: 150, ghostClass: 'sortable-ghost', onEnd: (evt) => onSortEnd(evt, 'genetics') });
        }
    } else if (activeToolsTab === 'stock') {
        const stockList = getEl('stockList');
        if (stockList) {
            sortableStock = new Sortable(stockList, { animation: 150, ghostClass: 'sortable-ghost', onEnd: (evt) => onSortEnd(evt, 'genetics') });
        }
    } else if (activeToolsTab === 'baulSemillas') {
        const seedsList = getEl('baulSemillasList');
        if (seedsList) {
            sortableSeeds = new Sortable(seedsList, { animation: 150, ghostClass: 'sortable-ghost', onEnd: (evt) => onSortEnd(evt, 'seeds') });
        }
    }
}


function loadSalas() {
    if (!userId) return;
    getEl('loadingSalas').style.display = 'block';
    getEl('emptySalasState').style.display = 'none';
    const q = query(collection(db, `users/${userId}/salas`));
    if (salasUnsubscribe) salasUnsubscribe();
    salasUnsubscribe = onSnapshot(q, (snapshot) => {
        currentSalas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        currentSalas.sort((a, b) => (a.position || 0) - (b.position || 0));

        const searchInput = getEl('searchSalas');
        if (sortableSalas) sortableSalas.destroy();
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredSalas = currentSalas.filter(sala => sala.name.toLowerCase().includes(searchTerm));
            renderSalasGrid(filteredSalas, currentCiclos, handlers);
        } else {
            renderSalasGrid(currentSalas, currentCiclos, handlers);
        }
        initializeDragAndDrop();
        
        startMainTour();

    }, error => {
        console.error("Error loading salas:", error);
        getEl('loadingSalas').innerText = "Error al cargar las salas.";
    });
}

function loadCiclos() {
    if (!userId) return;
    const q = query(collection(db, `users/${userId}/ciclos`));
    if (ciclosUnsubscribe) ciclosUnsubscribe();
    ciclosUnsubscribe = onSnapshot(q, (snapshot) => {
        currentCiclos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(c => c.estado !== 'finalizado');
        
        const searchInput = getEl('searchSalas');
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredSalas = currentSalas.filter(sala => sala.name.toLowerCase().includes(searchTerm));
            renderSalasGrid(filteredSalas, currentCiclos, handlers);
        } else {
            renderSalasGrid(currentSalas, currentCiclos, handlers);
        }

        if (!getEl('ciclosView').classList.contains('hidden')) handlers.showCiclosView(currentSalaId, currentSalaName);
        if (!getEl('cicloDetailView').classList.contains('hidden')) {
            const activeCicloId = getEl('cicloDetailView').querySelector('[data-ciclo-id]')?.dataset.cicloId;
            if (activeCicloId) {
                const updatedCiclo = currentCiclos.find(c => c.id === activeCicloId);
                if (updatedCiclo) handlers.showCicloDetails(updatedCiclo);
                else handlers.hideCicloDetails();
            }
        }
    });
}

function loadGenetics() {
    if (!userId) return;
    const q = query(collection(db, `users/${userId}/genetics`));
    if (geneticsUnsubscribe) geneticsUnsubscribe();
    geneticsUnsubscribe = onSnapshot(q, (snapshot) => {
        currentGenetics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        currentGenetics.sort((a, b) => (a.position || 0) - (b.position || 0));
        if(!getEl('toolsView').classList.contains('hidden')) {
            handlers.handleToolsSearch({ target: getEl('searchTools') });
        }
    });
}

function loadSeeds() {
    if (!userId) return;
    const q = query(collection(db, `users/${userId}/seeds`));
    if (seedsUnsubscribe) seedsUnsubscribe();
    seedsUnsubscribe = onSnapshot(q, (snapshot) => {
        currentSeeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        currentSeeds.sort((a, b) => (a.position || 0) - (b.position || 0));
        if(!getEl('toolsView').classList.contains('hidden')) {
            handlers.handleToolsSearch({ target: getEl('searchTools') });
        }
    });
}

function loadHistorial() {
    if (!userId) return;
    const q = query(collection(db, `users/${userId}/ciclos`), where("estado", "==", "finalizado"));
    if (historialUnsubscribe) historialUnsubscribe();
    historialUnsubscribe = onSnapshot(q, (snapshot) => {
        currentHistorial = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (activeToolsTab === 'historial') {
             renderHistorialView(currentHistorial, handlers);
        }
    }, error => {
        console.error("Error loading history:", error);
    });
}

function loadLogsForCiclo(cicloId, weekNumbers) {
    if (logsUnsubscribe) logsUnsubscribe();
    const q = query(collection(db, `users/${userId}/ciclos/${cicloId}/logs`));
    logsUnsubscribe = onSnapshot(q, (snapshot) => {
        const allLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() }));
        allLogs.sort((a, b) => b.date - a.date);
        
        const weeksWithLogs = new Set(allLogs.map(log => log.week));

        weekNumbers.forEach(weekNum => {
            const logContainer = getEl(`logs-week-${weekNum}`);
            if(logContainer) {
                logContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400 italic">No hay registros.</p>`;
                if (!weeksWithLogs.has(weekNum)) {
                    logContainer.classList.add('hidden');
                }
            }
        });
        
        allLogs.forEach(log => {
            const logContainer = getEl(`logs-week-${log.week}`);
            if (logContainer) {
                if (logContainer.querySelector('p.italic')) logContainer.innerHTML = '';
                const ciclo = currentCiclos.find(c => c.id === cicloId);
                logContainer.appendChild(createLogEntry(log, ciclo, handlers));
            }
        });
    });
}

const handlers = {
    signOut: () => signOut(auth),
    handleLogin: (email, password) => {
        signInWithEmailAndPassword(auth, email, password)
            .catch(error => {
                getEl('authError').innerText = handleAuthError(error);
                getEl('authError').classList.remove('hidden');
            });
    },
    handleRegister: (email, password) => {
        createUserWithEmailAndPassword(auth, email, password)
            .catch(error => {
                getEl('authError').innerText = handleAuthError(error);
                getEl('authError').classList.remove('hidden');
            });
    },
    calculateDaysSince,
    getPhaseInfo,
    formatFertilizers,
    getConfirmCallback: () => confirmCallback,
    hideConfirmationModal: () => {
        getEl('confirmationModal').style.display = 'none';
        confirmCallback = null;
    },
    showConfirmationModal: (message, onConfirm) => {
        getEl('confirmationMessage').textContent = message;
        confirmCallback = onConfirm;
        getEl('confirmationModal').style.display = 'flex';
    },
    openSalaModal: (sala = null) => {
        uiOpenSalaModal(sala);
    },
    handleSalaFormSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const salaName = getEl('sala-name').value.trim();
        if (!salaName) {
            showNotification('El nombre de la sala no puede estar vacío.', 'error');
            return;
        }
        const salaId = form.dataset.id;
        try {
            if (salaId) {
                await updateDoc(doc(db, `users/${userId}/salas`, salaId), { name: salaName });
                showNotification('Sala actualizada correctamente.');
            } else {
                const newSalaData = {
                    name: salaName,
                    position: currentSalas.length
                };
                await addDoc(collection(db, `users/${userId}/salas`), newSalaData);
                showNotification('Sala creada correctamente.');
            }
            getEl('salaModal').style.display = 'none';
        } catch (error) {
            console.error("Error guardando sala:", error);
            showNotification('Error al guardar la sala.', 'error');
        }
    },
    deleteSala: (id, name) => {
        handlers.showConfirmationModal(`¿Seguro que quieres eliminar la sala "${name}"? Todos los ciclos dentro de ella también serán eliminados. Esta acción no se puede deshacer.`, async () => {
            try {
                const batch = writeBatch(db);
                const ciclosQuery = query(collection(db, `users/${userId}/ciclos`), where("salaId", "==", id));
                const ciclosSnapshot = await getDocs(ciclosQuery);
                ciclosSnapshot.forEach(cicloDoc => {
                    batch.delete(cicloDoc.ref);
                });
                batch.delete(doc(db, `users/${userId}/salas`, id));
                await batch.commit();
                showNotification(`Sala "${name}" y sus ciclos eliminados.`);
            } catch (error) {
                console.error("Error deleting sala and its ciclos:", error);
                showNotification('Error al eliminar la sala.', 'error');
            }
        });
    },
    openCicloModal: (ciclo = null, preselectedSalaId = null) => {
        uiOpenCicloModal(ciclo, currentSalas, preselectedSalaId);
    },
    handleCicloFormSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const cicloId = form.dataset.id;
        const cicloData = {
            name: getEl('ciclo-name').value.trim(),
            salaId: getEl('ciclo-sala-select').value,
            phase: getEl('cicloPhase').value,
            cultivationType: getEl('cultivationType').value,
            vegetativeStartDate: getEl('vegetativeStartDate').value,
            floweringStartDate: getEl('floweringStartDate').value,
            notes: getEl('ciclo-notes').value.trim(),
            estado: 'activo'
        };

        if (!cicloData.name || !cicloData.salaId) {
            showNotification('Nombre y sala son obligatorios.', 'error');
            return;
        }

        try {
            if (cicloId) {
                await updateDoc(doc(db, `users/${userId}/ciclos`, cicloId), cicloData);
                showNotification('Ciclo actualizado.');
            } else {
                if (cicloData.phase === 'Floración') {
                    cicloData.floweringWeeks = generateStandardWeeks();
                } else if (cicloData.phase === 'Vegetativo') {
                    cicloData.vegetativeWeeks = generateVegetativeWeeks();
                }
                await addDoc(collection(db, `users/${userId}/ciclos`), cicloData);
                showNotification('Ciclo creado.');
            }
            getEl('cicloModal').style.display = 'none';
        } catch (error) {
            console.error("Error guardando ciclo:", error);
            showNotification('Error al guardar el ciclo.', 'error');
        }
    },
    deleteCiclo: (cicloId, cicloName) => {
        handlers.showConfirmationModal(`¿Seguro que quieres eliminar el ciclo "${cicloName}"? Todos sus registros serán eliminados.`, async () => {
            try {
                const logsRef = collection(db, `users/${userId}/ciclos/${cicloId}/logs`);
                const logsSnapshot = await getDocs(logsRef);
                const batch = writeBatch(db);
                logsSnapshot.forEach(logDoc => {
                    batch.delete(logDoc.ref);
                });
                batch.delete(doc(db, `users/${userId}/ciclos`, cicloId));
                await batch.commit();
                showNotification('Ciclo eliminado correctamente.');
            } catch (error) {
                console.error("Error deleting ciclo: ", error);
                showNotification('Error al eliminar el ciclo.', 'error');
            }
        });
    },
    showCiclosView: (salaId, salaName) => {
        currentSalaId = salaId;
        currentSalaName = salaName;
        handlers.hideAllViews();
        const view = getEl('ciclosView');
        view.classList.remove('hidden');
        view.classList.add('view-container');

        getEl('salaNameHeader').innerText = `Sala: ${salaName}`;
        const ciclosGrid = getEl('ciclosGrid');
        ciclosGrid.innerHTML = '';
        const ciclosInSala = currentCiclos.filter(c => c.salaId === salaId);

        if (ciclosInSala.length > 0) {
            getEl('emptyCiclosState').classList.add('hidden');
            ciclosInSala.forEach(ciclo => {
                ciclosGrid.appendChild(createCicloCard(ciclo, handlers));
            });
        } else {
            getEl('emptyCiclosState').classList.remove('hidden');
        }
    },
    hideCiclosView: () => {
        const view = getEl('ciclosView');
        view.classList.add('hidden');
        view.classList.remove('view-container');
        getEl('app').classList.remove('hidden');
        currentSalaId = null;
        currentSalaName = null;
    },
    showCicloDetails: (ciclo) => {
        if (logsUnsubscribe) logsUnsubscribe();

        let needsUpdate = false;
        const cicloRef = doc(db, `users/${userId}/ciclos`, ciclo.id);

        if (ciclo.phase === 'Vegetativo' && !ciclo.vegetativeWeeks) {
            console.log(`Migrando ciclo vegetativo antiguo: ${ciclo.name}`);
            ciclo.vegetativeWeeks = generateVegetativeWeeks();
            needsUpdate = true;
        }

        if (ciclo.phase === 'Floración' && ciclo.floweringWeeks && ciclo.floweringWeeks.some(w => w.phaseName === 'SECADO')) {
            console.log(`Migrando ciclo de floración antiguo: ${ciclo.name}`);
            ciclo.floweringWeeks = ciclo.floweringWeeks.filter(w => w.phaseName !== 'SECADO');
            needsUpdate = true;
        }

        if (needsUpdate) {
            updateDoc(cicloRef, { 
                vegetativeWeeks: ciclo.vegetativeWeeks || null,
                floweringWeeks: ciclo.floweringWeeks || null
            }).catch(err => console.error("Error al migrar datos del ciclo:", err));
        }

        handlers.hideAllViews();
        const detailView = getEl('cicloDetailView');
        detailView.innerHTML = renderCicloDetails(ciclo, handlers);
        detailView.classList.remove('hidden');
        detailView.classList.add('view-container');

        getEl('backToCiclosBtn').addEventListener('click', () => handlers.showCiclosView(ciclo.salaId, currentSalas.find(s=>s.id === ciclo.salaId)?.name));
        
        const addWeekBtn = getEl('add-week-btn');
        if(addWeekBtn) addWeekBtn.addEventListener('click', () => handlers.handleAddWeek(ciclo.id));
        
        const iniciarSecadoBtn = getEl('iniciar-secado-btn');
        if(iniciarSecadoBtn) iniciarSecadoBtn.addEventListener('click', () => handlers.handleIniciarSecado(ciclo.id, ciclo.name));

        let weeksToShow = [];
        if (ciclo.phase === 'Floración' && ciclo.floweringWeeks) {
            weeksToShow = ciclo.floweringWeeks;
        } else if (ciclo.phase === 'Vegetativo' && ciclo.vegetativeWeeks) {
            weeksToShow = ciclo.vegetativeWeeks;
        }

        const weekNumbers = weeksToShow.map(w => w.weekNumber);
        if (weekNumbers.length > 0) {
            loadLogsForCiclo(ciclo.id, weekNumbers);
        }
    },
    hideCicloDetails: () => {
        if (logsUnsubscribe) logsUnsubscribe();
        const view = getEl('cicloDetailView');
        view.classList.add('hidden');
        view.classList.remove('view-container');
        if (currentSalaId && currentSalaName) {
            handlers.showCiclosView(currentSalaId, currentSalaName);
        } else {
            handlers.hideCiclosView();
        }
    },
    showToolsView: () => {
        handlers.hideAllViews();
        const toolsView = getEl('toolsView');
        toolsView.innerHTML = renderToolsView();
        toolsView.classList.remove('hidden');
        toolsView.classList.add('view-container');

        handlers.switchToolsTab('genetics');
        handlers.handleViewModeToggle(toolsViewMode, true);
        
        startToolsTour();

        getEl('backToPanelBtn').addEventListener('click', () => {
            destroyToolSortables();
            handlers.hideToolsView();
        });
        getEl('geneticsTabBtn').addEventListener('click', () => handlers.switchToolsTab('genetics'));
        getEl('stockTabBtn').addEventListener('click', () => handlers.switchToolsTab('stock'));
        getEl('baulSemillasTabBtn').addEventListener('click', () => handlers.switchToolsTab('baulSemillas'));
        getEl('historialTabBtn').addEventListener('click', () => handlers.switchToolsTab('historial'));
        getEl('geneticsForm').addEventListener('submit', handlers.handleGeneticsFormSubmit);
        getEl('seedForm').addEventListener('submit', handlers.handleSeedFormSubmit);
        getEl('searchTools').addEventListener('input', handlers.handleToolsSearch);
        getEl('view-mode-card').addEventListener('click', () => handlers.handleViewModeToggle('card'));
        getEl('view-mode-list').addEventListener('click', () => handlers.handleViewModeToggle('list'));
    },
    hideToolsView: () => {
        const view = getEl('toolsView');
        view.classList.add('hidden');
        view.classList.remove('view-container');
        getEl('app').classList.remove('hidden');
    },
    showSettingsView: () => {
        handlers.hideAllViews();
        const settingsView = getEl('settingsView');
        settingsView.innerHTML = renderSettingsView();
        settingsView.classList.remove('hidden');
        settingsView.classList.add('view-container');

        getEl('backToPanelFromSettingsBtn').addEventListener('click', handlers.hideSettingsView);
        getEl('changePasswordForm').addEventListener('submit', handlers.handleChangePassword);
        getEl('deleteAccountBtn').addEventListener('click', handlers.handleDeleteAccount);
        handlers.initializeTheme();
    },
    hideSettingsView: () => {
        const view = getEl('settingsView');
        view.classList.add('hidden');
        view.classList.remove('view-container');
        getEl('app').classList.remove('hidden');
    },
    hideAllViews: () => {
        ['app', 'ciclosView', 'cicloDetailView', 'toolsView', 'settingsView', 'historialView'].forEach(id => {
            const el = getEl(id);
            if (el) {
                el.classList.add('hidden');
                el.classList.remove('view-container');
            }
        });
    },
    switchToolsTab: (newTab) => {
        activeToolsTab = newTab;
        ['genetics', 'stock', 'baulSemillas', 'historial'].forEach(tab => {
            getEl(`${tab}Content`).classList.toggle('hidden', tab !== activeToolsTab);
            getEl(`${tab}TabBtn`).classList.toggle('border-amber-400', tab === activeToolsTab);
            getEl(`${tab}TabBtn`).classList.toggle('border-transparent', tab !== activeToolsTab);
        });

        const searchTools = getEl('searchTools');
        const viewMode = getEl('view-mode-toggle');
        
        if (newTab === 'historial') {
            searchTools.placeholder = 'Buscar por genética, sala...';
            viewMode.classList.add('hidden');
            renderHistorialView(currentHistorial, handlers);
        } else {
            searchTools.placeholder = 'Buscar por nombre...';
            viewMode.classList.remove('hidden');
            handlers.handleToolsSearch({ target: { value: '' } });
        }
    },
    handleToolsSearch: (e) => {
        const searchTerm = e.target.value.toLowerCase();
        let filteredData;
        let renderFunction;

        if (activeToolsTab === 'genetics') {
            filteredData = currentGenetics.filter(g => g.name.toLowerCase().includes(searchTerm));
            renderFunction = toolsViewMode === 'card' ? renderGeneticsList : renderGeneticsListCompact;
        } else if (activeToolsTab === 'baulSemillas') {
            filteredData = currentSeeds.filter(s => s.name.toLowerCase().includes(searchTerm));
            renderFunction = toolsViewMode === 'card' ? renderBaulSemillasList : renderBaulSemillasListCompact;
        } else if (activeToolsTab === 'stock') {
            filteredData = currentGenetics.filter(g => g.name.toLowerCase().includes(searchTerm));
            renderFunction = toolsViewMode === 'card' ? renderStockList : renderStockListCompact;
        }

        if (renderFunction) {
            renderFunction(filteredData, handlers);
            initializeToolsDragAndDrop();
        }
    },
    handleViewModeToggle: (mode, isInitial = false) => {
        if (!isInitial) {
            toolsViewMode = mode;
            localStorage.setItem('toolsViewMode', mode);
        }

        getEl('view-mode-card').classList.toggle('bg-amber-500', toolsViewMode === 'card');
        getEl('view-mode-list').classList.toggle('bg-amber-500', toolsViewMode === 'list');

        handlers.handleToolsSearch({ target: getEl('searchTools') });
    },
    handleGeneticsFormSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const geneticId = form.dataset.id;
        const geneticData = {
            name: getEl('genetic-name').value.trim(),
            parents: getEl('genetic-parents').value.trim(),
            bank: getEl('genetic-bank').value.trim(),
            owner: getEl('genetic-owner').value.trim(),
            cloneStock: parseInt(getEl('genetic-stock').value) || 0,
            favorita: geneticId ? (currentGenetics.find(g => g.id === geneticId)?.favorita || false) : false
        };
        if (!geneticData.name) {
            showNotification('El nombre es obligatorio.', 'error');
            return;
        }
        try {
            if (geneticId) {
                await updateDoc(doc(db, `users/${userId}/genetics`, geneticId), geneticData);
                showNotification('Genética actualizada.');
            } else {
                geneticData.position = currentGenetics.length;
                await addDoc(collection(db, `users/${userId}/genetics`), geneticData);
                showNotification('Genética añadida.');
            }
            form.reset();
            delete form.dataset.id;
            getEl('genetic-form-title').innerText = 'Añadir Nueva Genética';
        } catch (error) {
            console.error("Error saving genetic:", error);
            showNotification('Error al guardar la genética.', 'error');
        }
    },
    editGenetic: (id) => {
        const genetic = currentGenetics.find(g => g.id === id);
        if (genetic) {
            getEl('genetic-form-title').innerText = 'Editar Genética';
            getEl('genetic-name').value = genetic.name;
            getEl('genetic-parents').value = genetic.parents || '';
            getEl('genetic-bank').value = genetic.bank || '';
            getEl('genetic-owner').value = genetic.owner || '';
            getEl('genetic-stock').value = genetic.cloneStock || 0;
            getEl('geneticsForm').dataset.id = id;
            getEl('genetic-name').focus();
        }
    },
    deleteGenetic: (id) => {
        const genetic = currentGenetics.find(g => g.id === id);
        if (genetic) {
            handlers.showConfirmationModal(`¿Seguro que quieres eliminar la genética "${genetic.name}"?`, async () => {
                try {
                    await deleteDoc(doc(db, `users/${userId}/genetics`, id));
                    showNotification('Genética eliminada.');
                } catch (error) {
                    console.error("Error deleting genetic:", error);
                    showNotification('Error al eliminar la genética.', 'error');
                }
            });
        }
    },
    updateStock: async (id, amount) => {
        try {
            const geneticRef = doc(db, `users/${userId}/genetics`, id);
            await updateDoc(geneticRef, {
                cloneStock: increment(amount)
            });
        } catch (error) {
            console.error("Error updating stock:", error);
            showNotification('Error al actualizar el stock.', 'error');
        }
    },
    handleSeedFormSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const seedData = {
            name: getEl('seed-name').value.trim(),
            bank: getEl('seed-bank').value.trim(),
            quantity: parseInt(getEl('seed-quantity').value) || 0
        };
        if (!seedData.name || seedData.quantity <= 0) {
            showNotification('Nombre y cantidad (mayor a 0) son obligatorios.', 'error');
            return;
        }
        try {
            seedData.position = currentSeeds.length;
            await addDoc(collection(db, `users/${userId}/seeds`), seedData);
            showNotification('Semillas añadidas al baúl.');
            form.reset();
        } catch (error) {
            console.error("Error saving seed:", error);
            showNotification('Error al guardar las semillas.', 'error');
        }
    },
    deleteSeed: (id) => {
        const seed = currentSeeds.find(s => s.id === id);
        if(seed) {
            handlers.showConfirmationModal(`¿Seguro que quieres eliminar las semillas "${seed.name}" del baúl?`, async () => {
                try {
                    await deleteDoc(doc(db, `users/${userId}/seeds`, id));
                    showNotification('Semillas eliminadas.');
                } catch (error) {
                    console.error("Error deleting seed:", error);
                    showNotification('Error al eliminar las semillas.', 'error');
                }
            });
        }
    },
    openGerminateModal: (id) => {
        const seed = currentSeeds.find(s => s.id === id);
        if(seed) {
            uiOpenGerminateModal(seed);
        }
    },
    handleGerminateFormSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const seedId = form.dataset.id;
        const quantity = parseInt(getEl('germinate-quantity').value);

        if (!seedId || !quantity || quantity <= 0) {
            showNotification('Cantidad inválida.', 'error');
            return;
        }

        const seed = currentSeeds.find(s => s.id === seedId);
        if (quantity > seed.quantity) {
            showNotification('No puedes germinar más semillas de las que tienes.', 'error');
            return;
        }

        try {
            await updateDoc(doc(db, `users/${userId}/seeds`, seedId), {
                quantity: increment(-quantity)
            });
            showNotification(`${quantity} semilla(s) de ${seed.name} puestas a germinar.`);
            getEl('germinateSeedModal').style.display = 'none';
        } catch(error) {
            console.error("Error germinating seed:", error);
            showNotification('Error al germinar la semilla.', 'error');
        }
    },
    handleDeleteAccount: () => {
        handlers.showConfirmationModal('¿ESTÁS SEGURO? Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.', async () => {
            try {
                const user = auth.currentUser;
                await deleteUser(user);
                showNotification('Cuenta eliminada. Serás desconectado.');
            } catch (error) {
                console.error("Error deleting account:", error);
                showNotification('Error al eliminar la cuenta. Es posible que necesites volver a iniciar sesión para completar esta acción.', 'error');
            }
        });
    },
    handleChangePassword: async (e) => {
        e.preventDefault();
        const newPassword = getEl('newPassword').value;
        const confirmPassword = getEl('confirmPassword').value;
        if (newPassword.length < 6) {
            showNotification('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('Las contraseñas no coinciden.', 'error');
            return;
        }
        try {
            const user = auth.currentUser;
            await updatePassword(user, newPassword);
            showNotification('Contraseña cambiada correctamente.');
            e.target.reset();
        } catch (error)
        {
            console.error("Error changing password:", error);
            showNotification('Error al cambiar la contraseña. Es posible que necesites volver a iniciar sesión.', 'error');
        }
    },
    handleLogFormSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const cicloId = form.dataset.cicloId;
        const week = form.dataset.week;

        const logData = {
            type: getEl('logType').value,
            date: serverTimestamp(),
            week: parseInt(week)
        };
        
        if (logData.type === 'Riego' || logData.type === 'Cambio de Solución') {
            logData.ph = getEl('log-ph').value || null;
            logData.ec = getEl('log-ec').value || null;
            if (logData.type === 'Cambio de Solución') {
                logData.litros = getEl('log-litros').value || null;
            }

            const fertilizersUsed = [];
            const selectedLine = getEl('fert-line-select').value;

            if (selectedLine === 'Personalizada') {
                document.querySelectorAll('.custom-fert-row').forEach(row => {
                    const productName = row.querySelector('.fert-product-name').value.trim();
                    const dose = row.querySelector('.fert-dose').value;
                    if (productName && dose) {
                        fertilizersUsed.push({
                            productName: productName,
                            dose: parseFloat(dose),
                            unit: row.querySelector('.fert-unit').value
                        });
                    }
                });
            } else {
                document.querySelectorAll('.product-row').forEach(row => {
                    const dose = row.querySelector('.fert-dose').value;
                    if (dose) {
                        fertilizersUsed.push({
                            productName: row.querySelector('.fert-dose').dataset.productName,
                            dose: parseFloat(dose),
                            unit: row.querySelector('.fert-unit').value
                        });
                    }
                });
            }
            logData.fertilizers = fertilizersUsed;

        } else if (logData.type === 'Control de Plagas') {
            logData.notes = getEl('plagas-notes').value.trim();
        } else if (logData.type === 'Podas') {
            logData.podaType = getEl('podaType').value;
            if (logData.podaType === 'Clones') {
                logData.clonesCount = getEl('clones-count').value || 0;
            }
        }

        try {
            await addDoc(collection(db, `users/${userId}/ciclos/${cicloId}/logs`), logData);
            showNotification('Registro añadido.');
            getEl('logModal').style.display = 'none';
        } catch (error) {
            console.error("Error guardando log:", error);
            showNotification('Error al guardar el registro.', 'error');
        }
    },
    deleteLog: (cicloId, logId) => {
        handlers.showConfirmationModal('¿Seguro que quieres eliminar este registro?', async () => {
            try {
                await deleteDoc(doc(db, `users/${userId}/ciclos/${cicloId}/logs`, logId));
                showNotification('Registro eliminado.');
            } catch (error) {
                console.error("Error deleting log:", error);
                showNotification('Error al eliminar el registro.', 'error');
            }
        });
    },
    openFinalizarCicloModal: (ciclo) => {
        uiOpenFinalizarCicloModal(ciclo, PREDEFINED_TAGS, MAX_CUSTOM_TAGS, currentGenetics);
    },
    handleFinalizarCicloFormSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const cicloId = form.dataset.cicloId;
        const cicloOriginal = (await getDoc(doc(db, `users/${userId}/ciclos`, cicloId))).data();
        
        const pesoSeco = parseFloat(getEl('peso-seco').value);
        const etiquetasGlobales = Array.from(getEl('global-tags-container').querySelectorAll('.tag.active')).map(t => t.textContent);
        const etiquetasCustom = Array.from(getEl('custom-tags-container').querySelectorAll('.tag')).map(t => t.textContent.replace(' ×', ''));
        
        const feedbackGeneticas = [];
        document.querySelectorAll('.genetic-feedback-row').forEach(row => {
            const id = row.dataset.id;
            const name = row.dataset.name;
            const decision = row.querySelector('input[name="decision-' + id + '"]:checked')?.value || 'ninguna';
            const favorita = row.querySelector('.favorite-checkbox').checked;
            feedbackGeneticas.push({ id, name, decision, favorita });
        });

        const diasDeSecado = cicloOriginal.fechaInicioSecado ? calculateDaysBetween(cicloOriginal.fechaInicioSecado, new Date()) : 0;
        const diasDeFlora = calculateDaysSince(cicloOriginal.floweringStartDate);

        const cosechaData = {
            estado: 'finalizado',
            fechaFinalizacion: serverTimestamp(),
            pesoSeco: isNaN(pesoSeco) ? 0 : pesoSeco,
            diasDeFlora,
            diasDeSecado,
            etiquetasGlobales,
            etiquetasCustom,
            feedbackGeneticas
        };

        try {
            const batch = writeBatch(db);
            const cicloRef = doc(db, `users/${userId}/ciclos`, cicloId);
            batch.update(cicloRef, cosechaData);
            
            for (const feedback of feedbackGeneticas) {
                const geneticRef = doc(db, `users/${userId}/genetics`, feedback.id);
                const originalGenetic = currentGenetics.find(g => g.id === feedback.id);
                if (originalGenetic && originalGenetic.favorita !== feedback.favorita) {
                    batch.update(geneticRef, { favorita: feedback.favorita });
                }
            }
            
            await batch.commit();
            showNotification('¡Cosecha guardada en el historial! Felicitaciones.');
            getEl('finalizarCicloModal').style.display = 'none';
        } catch(error) {
            console.error("Error guardando la cosecha: ", error);
            showNotification('Error al guardar la cosecha en el historial.', 'error');
        }
    },
    handleAddWeek: async (cicloId) => {
        try {
            const cicloRef = doc(db, `users/${userId}/ciclos`, cicloId);
            const cicloSnap = await getDoc(cicloRef);
            if (!cicloSnap.exists()) throw new Error("Cycle not found");
            const cicloData = cicloSnap.data();
            
            const weeksArrayName = cicloData.phase === 'Floración' ? 'floweringWeeks' : 'vegetativeWeeks';
            const currentWeeks = cicloData[weeksArrayName] || [];
            
            const newWeekNumber = currentWeeks.length + 1;
            const newWeek = { weekNumber: newWeekNumber, phaseName: cicloData.phase === 'Floración' ? 'FLORA' : 'Vegetativo' };
            
            await updateDoc(cicloRef, { [weeksArrayName]: arrayUnion(newWeek) });
            showNotification(`Semana ${newWeekNumber} añadida al ciclo.`);
        } catch (error) {
            console.error("Error adding week:", error);
            showNotification('Error al añadir la semana.', 'error');
        }
    },
    // NUEVO: Handler para eliminar la última semana de un ciclo.
    handleDeleteLastWeek: async (cicloId) => {
        try {
            const cicloRef = doc(db, `users/${userId}/ciclos`, cicloId);
            const cicloSnap = await getDoc(cicloRef);
            if (!cicloSnap.exists()) throw new Error("Ciclo no encontrado");
            
            const cicloData = cicloSnap.data();
            const weeksArrayName = cicloData.phase === 'Floración' ? 'floweringWeeks' : 'vegetativeWeeks';
            const currentWeeks = cicloData[weeksArrayName] || [];

            if (currentWeeks.length === 0) {
                showNotification("No hay semanas para eliminar.", "error");
                return;
            }

            const lastWeekNumber = currentWeeks[currentWeeks.length - 1].weekNumber;

            handlers.showConfirmationModal(`¿Seguro que quieres eliminar la Semana ${lastWeekNumber}? Todos sus registros también se borrarán.`, async () => {
                try {
                    const batch = writeBatch(db);

                    // 1. Eliminar logs de la última semana
                    const logsQuery = query(collection(db, `users/${userId}/ciclos/${cicloId}/logs`), where("week", "==", lastWeekNumber));
                    const logsSnapshot = await getDocs(logsQuery);
                    logsSnapshot.forEach(logDoc => {
                        batch.delete(logDoc.ref);
                    });

                    // 2. Actualizar el ciclo para remover la última semana
                    const updatedWeeks = currentWeeks.slice(0, -1);
                    batch.update(cicloRef, { [weeksArrayName]: updatedWeeks });

                    await batch.commit();
                    showNotification(`Semana ${lastWeekNumber} y sus registros eliminados.`);
                } catch (error) {
                    console.error("Error al eliminar la última semana y sus logs:", error);
                    showNotification("Error al eliminar la semana.", "error");
                }
            });

        } catch (error) {
            console.error("Error preparando la eliminación de la semana:", error);
            showNotification("No se pudo preparar la eliminación de la semana.", "error");
        }
    },
    handleIniciarSecado: (cicloId, cicloName) => {
        handlers.showConfirmationModal(`¿Seguro que quieres finalizar el cultivo de "${cicloName}" y empezar el secado? Ya no podrás añadir más registros.`, async () => {
            try {
                const cicloRef = doc(db, `users/${userId}/ciclos`, cicloId);
                await updateDoc(cicloRef, {
                    estado: 'en_secado',
                    fechaInicioSecado: serverTimestamp()
                });
                showNotification('Proceso de secado iniciado.');
            } catch (error) {
                console.error("Error starting drying process:", error);
                showNotification('Error al iniciar el secado.', 'error');
            }
        });
    },
    openMoveCicloModal: (cicloId) => {
        const ciclo = currentCiclos.find(c => c.id === cicloId);
        if (ciclo) {
            uiOpenMoveCicloModal(ciclo, currentSalas);
        }
    },
    handleMoveCicloSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const cicloId = form.dataset.cicloId;
        const newSalaId = getEl('move-ciclo-sala-select').value;
        if (!cicloId || !newSalaId) {
            showNotification('Selección inválida.', 'error');
            return;
        }
        try {
            await updateDoc(doc(db, `users/${userId}/ciclos`, cicloId), { salaId: newSalaId });
            showNotification('Ciclo movido de sala.');
            getEl('moveCicloModal').style.display = 'none';
            if (!getEl('ciclosView').classList.contains('hidden')) {
                handlers.hideCiclosView();
            }
        } catch (error) {
            console.error("Error moving ciclo:", error);
            showNotification('Error al mover el ciclo.', 'error');
        }
    },
    initializeTheme: () => {
        const themeToggleBtn = getEl('theme-toggle');
        if (themeToggleBtn) {
            handlers.updateThemeIcon();
            themeToggleBtn.addEventListener('click', handlers.handleThemeToggle);
        }
    },
    handleThemeToggle: () => {
        document.documentElement.classList.toggle('dark');
        localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        handlers.updateThemeIcon();
    },
    updateThemeIcon: () => {
        const themeToggleBtn = getEl('theme-toggle');
        if (themeToggleBtn) {
            const isDark = document.documentElement.classList.contains('dark');
            const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.95-4.243-1.591 1.591M5.25 12H3m4.243-4.95L6.343 5.657M12 6.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Z" /></svg>`;
            const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>`;
            themeToggleBtn.innerHTML = isDark ? sunIcon : moonIcon;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, user => {
        // Verifica si el elemento existe antes de manipularlo
        const initialLoader = getEl('initial-loader');
        if (initialLoader) {
            initialLoader.classList.add('hidden');
        }

        if (user) {
            userId = user.uid;
            handlers.hideAllViews();
            const appView = getEl('app');
            if (appView) {
                appView.classList.remove('hidden');
                appView.classList.add('view-container');
            }
            const welcomeUser = getEl('welcomeUser');
            if (welcomeUser) {
                welcomeUser.innerText = `Anota todo, no seas pancho.`;
            }

            loadSalas();
            loadCiclos();
            loadGenetics();
            loadSeeds();
            loadHistorial();
            initializeEventListeners(handlers);

            const searchSalas = getEl('searchSalas');
            if (searchSalas) {
                searchSalas.addEventListener('input', e => {
                    const searchTerm = e.target.value.toLowerCase();
                    const filteredSalas = currentSalas.filter(sala => sala.name.toLowerCase().includes(searchTerm));
                    if (sortableSalas) sortableSalas.destroy();
                    renderSalasGrid(filteredSalas, currentCiclos, handlers);
                    initializeDragAndDrop();
                });
            }

        } else {
            userId = null;

            if (salasUnsubscribe) salasUnsubscribe();
            if (ciclosUnsubscribe) ciclosUnsubscribe();
            if (geneticsUnsubscribe) geneticsUnsubscribe();
            if (seedsUnsubscribe) seedsUnsubscribe();
            if (historialUnsubscribe) historialUnsubscribe();

            handlers.hideAllViews();

            const authView = getEl('authView');
            if (authView) {
                authView.classList.remove('hidden');
                authView.classList.add('view-container');
            }

            initializeEventListeners(handlers);
        }
    });
});if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.error('Error al registrar el Service Worker:', error);
      });
  });
}