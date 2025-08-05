// js/main.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword, deleteUser } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, doc, addDoc, deleteDoc, onSnapshot, query, serverTimestamp, getDocs, writeBatch, updateDoc, arrayUnion, where, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { 
    getEl, showNotification, renderSalasGrid, createCicloCard, createLogEntry,
    renderGeneticsList, renderStockList, 
    renderBaulSemillasList, // CAMBIO: Importa la función con el nuevo nombre
    initializeEventListeners,
    renderCicloDetails, renderToolsView, renderSettingsView,
    openSalaModal as uiOpenSalaModal, 
    openCicloModal as uiOpenCicloModal, 
    openLogModal as uiOpenLogModal,
    openGerminateModal as uiOpenGerminateModal,
    openMoveCicloModal as uiOpenMoveCicloModal
} from './ui.js';

// --- STATE MANAGEMENT ---
let userId = null;
let salasUnsubscribe = null, ciclosUnsubscribe = null, logsUnsubscribe = null, geneticsUnsubscribe = null, seedsUnsubscribe = null;
let currentSalas = [], currentCiclos = [], currentGenetics = [], currentSeeds = [];
let currentSalaId = null, currentSalaName = null;
let confirmCallback = null;

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
    if (ferts.basesAmount && ferts.basesUnit) used.push(`Bases (${ferts.basesAmount} ${ferts.basesUnit})`);
    if (ferts.enzimas) used.push('Enzimas');
    if (ferts.candy) used.push('Candy');
    if (ferts.bigBud) used.push('BigBud');
    if (ferts.flawlessFinish) used.push('FlawlessFinish');
    if (ferts.foliar && ferts.foliarProduct) used.push(`Foliar (${ferts.foliarProduct})`);
    return used.length > 0 ? used.join(', ') : 'Ninguno';
}

function loadSalas() {
    if (!userId) return;
    getEl('loadingSalas').style.display = 'block';
    getEl('emptySalasState').style.display = 'none';
    const q = query(collection(db, `users/${userId}/salas`));
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
    const q = query(collection(db, `users/${userId}/ciclos`));
    if (ciclosUnsubscribe) ciclosUnsubscribe();
    ciclosUnsubscribe = onSnapshot(q, (snapshot) => {
        currentCiclos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderSalasGrid(currentSalas, currentCiclos, handlers); 
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
        if(!getEl('toolsView').classList.contains('hidden')) {
            renderGeneticsList(currentGenetics, handlers);
            renderStockList(currentGenetics, handlers);
        }
    });
}

function loadSeeds() {
    if (!userId) return;
    const q = query(collection(db, `users/${userId}/seeds`));
    if (seedsUnsubscribe) seedsUnsubscribe();
    seedsUnsubscribe = onSnapshot(q, (snapshot) => {
        currentSeeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         if(!getEl('toolsView').classList.contains('hidden')) {
            // CAMBIO: Llama a la función con el nuevo nombre
            renderBaulSemillasList(currentSeeds, handlers);
        }
    });
}

function loadLogsForCiclo(cicloId, weekNumbers) {
    if (logsUnsubscribe) logsUnsubscribe();
    const q = query(collection(db, `users/${userId}/ciclos/${cicloId}/logs`));
    logsUnsubscribe = onSnapshot(q, (snapshot) => {
        weekNumbers.forEach(weekNum => {
            const logContainer = getEl(`logs-week-${weekNum}`);
            if(logContainer) logContainer.innerHTML = `<p class="text-gray-500 italic">No hay registros.</p>`;
        });
        const allLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() }));
        allLogs.sort((a, b) => b.date - a.date);
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


// --- 2. HANDLERS OBJECT DEFINITION ---

const handlers = {
    // --- AUTH ---
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

    // --- HELPERS & UTILS ---
    calculateDaysSince,
    getPhaseInfo,
    formatFertilizers,
    getConfirmCallback: () => confirmCallback,

    // --- CONFIRMATION MODAL ---
    hideConfirmationModal: () => {
        getEl('confirmationModal').style.display = 'none';
        confirmCallback = null;
    },
    showConfirmationModal: (message, onConfirm) => {
        getEl('confirmationMessage').textContent = message;
        confirmCallback = onConfirm;
        getEl('confirmationModal').style.display = 'flex';
    },

    // --- SALAS ---
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
                await addDoc(collection(db, `users/${userId}/salas`), { name: salaName });
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

    // --- CICLOS ---
    openCicloModal: (ciclo = null) => {
        uiOpenCicloModal(ciclo, currentSalas);
    },
    updateCicloModalDateFields: () => {
        const phase = getEl('cicloPhase').value;
        getEl('vegetativeDateContainer').classList.toggle('hidden', phase !== 'Vegetativo');
        getEl('floweringDateContainer').classList.toggle('hidden', phase !== 'Floración');
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
            notes: getEl('ciclo-notes').value.trim()
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

    // --- VIEW MANAGEMENT ---
    showCiclosView: (salaId, salaName) => {
        currentSalaId = salaId;
        currentSalaName = salaName;
        handlers.hideAllViews();

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
        getEl('ciclosView').classList.remove('hidden');
    },
    hideCiclosView: () => {
        getEl('ciclosView').classList.add('hidden');
        getEl('app').classList.remove('hidden');
        currentSalaId = null;
        currentSalaName = null;
    },
    showCicloDetails: (ciclo) => {
        if (logsUnsubscribe) logsUnsubscribe();
        handlers.hideAllViews();
        const detailView = getEl('cicloDetailView');
        detailView.innerHTML = renderCicloDetails(ciclo, handlers);
        detailView.classList.remove('hidden');
        
        getEl('backToCiclosBtn').addEventListener('click', () => handlers.showCiclosView(ciclo.salaId, currentSalas.find(s=>s.id === ciclo.salaId)?.name));
        
        const weekNumbers = ciclo.floweringWeeks ? ciclo.floweringWeeks.map(w => w.weekNumber) : [];
        if (ciclo.phase === 'Floración' && weekNumbers.length > 0) {
            loadLogsForCiclo(ciclo.id, weekNumbers);
        }
    },
    hideCicloDetails: () => {
        if (logsUnsubscribe) logsUnsubscribe();
        getEl('cicloDetailView').classList.add('hidden');
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
        handlers.switchToolsTab('genetics'); 
        
        renderGeneticsList(currentGenetics, handlers);
        renderStockList(currentGenetics, handlers);
        renderBaulSemillasList(currentSeeds, handlers); // CAMBIO: Llama a la función con el nuevo nombre
        
        getEl('backToPanelBtn').addEventListener('click', handlers.hideToolsView);
        getEl('geneticsTabBtn').addEventListener('click', () => handlers.switchToolsTab('genetics'));
        getEl('stockTabBtn').addEventListener('click', () => handlers.switchToolsTab('stock'));
        // CAMBIO: ID del botón y nombre de la pestaña
        getEl('baulSemillasTabBtn').addEventListener('click', () => handlers.switchToolsTab('baulSemillas'));
        getEl('geneticsForm').addEventListener('submit', handlers.handleGeneticsFormSubmit);
        getEl('seedForm').addEventListener('submit', handlers.handleSeedFormSubmit);
    },
    hideToolsView: () => {
        getEl('toolsView').classList.add('hidden');
        getEl('app').classList.remove('hidden');
    },
    showSettingsView: () => {
        handlers.hideAllViews();
        const settingsView = getEl('settingsView');
        settingsView.innerHTML = renderSettingsView();
        settingsView.classList.remove('hidden');
        
        getEl('backToPanelFromSettingsBtn').addEventListener('click', handlers.hideSettingsView);
        getEl('changePasswordForm').addEventListener('submit', handlers.handleChangePassword);
        getEl('deleteAccountBtn').addEventListener('click', handlers.handleDeleteAccount);
    },
    hideSettingsView: () => {
        getEl('settingsView').classList.add('hidden');
        getEl('app').classList.remove('hidden');
    },
    hideAllViews: () => {
        ['app', 'ciclosView', 'cicloDetailView', 'toolsView', 'settingsView'].forEach(id => {
            const el = getEl(id);
            if (el) el.classList.add('hidden');
        });
    },
    
    // --- TOOLS ---
    switchToolsTab: (activeTab) => {
        // CAMBIO: Se actualiza el array de pestañas con el nuevo nombre
        ['genetics', 'stock', 'baulSemillas'].forEach(tab => {
            getEl(`${tab}Content`).classList.toggle('hidden', tab !== activeTab);
            getEl(`${tab}TabBtn`).classList.toggle('border-amber-400', tab === activeTab);
            getEl(`${tab}TabBtn`).classList.toggle('border-transparent', tab !== activeTab);
        });
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
            cloneStock: parseInt(getEl('genetic-stock').value) || 0
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

    // --- GENETICS IN CICLO ---
    handleAddGeneticToCiclo: async (type) => {
        console.log(`Adding genetic via: ${type}`);
        showNotification('Función no implementada completamente.', 'error');
    },

    // --- SETTINGS ---
    handleDeleteAccount: () => {
        handlers.showConfirmationModal('¿ESTÁS SEGURO? Esta acción eliminará permanentemente tu cuenta y todos tus datos (salas, ciclos, registros). No se puede deshacer.', async () => {
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
        } catch (error) {
            console.error("Error changing password:", error);
            showNotification('Error al cambiar la contraseña. Es posible que necesites volver a iniciar sesión.', 'error');
        }
    },

    // --- LOGS ---
    closeLogModal: () => {
        getEl('logModal').style.display = 'none';
    },
    toggleLogFields: () => {
        const logType = getEl('logType').value;
        getEl('riegoFields').style.display = logType === 'Riego' ? 'block' : 'none';
        getEl('solucionFields').style.display = logType === 'Cambio de Solución' ? 'block' : 'none';
        getEl('plagasFields').style.display = logType === 'Control de Plagas' ? 'block' : 'none';
        getEl('podasFields').style.display = logType === 'Podas' ? 'block' : 'none';
    },
    handleLogFormSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const cicloId = form.dataset.cicloId;
        const logId = form.dataset.logId;
        const week = form.dataset.week;

        const logData = {
            type: getEl('logType').value,
            date: serverTimestamp(),
            week: parseInt(week)
        };

        if (logData.type === 'Riego' || logData.type === 'Cambio de Solución') {
            logData.ph = getEl('log-ph').value;
            logData.ec = getEl('log-ec').value;
            logData.fertilizers = {
                basesAmount: getEl('fert-bases-amount').value,
                basesUnit: getEl('fert-bases-unit').value,
                enzimas: getEl('fert-enzimas').checked,
                candy: getEl('fert-candy').checked,
                bigBud: getEl('fert-bigbud').checked,
                flawlessFinish: getEl('fert-flawless').checked,
                foliar: getEl('fert-foliar').checked,
                foliarProduct: getEl('fert-foliar-product').value,
            };
            if(logData.type === 'Cambio de Solución') logData.litros = getEl('log-litros').value;
        } else if (logData.type === 'Control de Plagas') {
            logData.notes = getEl('plagas-notes').value;
        } else if (logData.type === 'Podas') {
            logData.podaType = getEl('podaType').value;
            if (logData.podaType === 'Clones') {
                logData.clonesCount = getEl('clones-count').value;
            }
        }

        try {
            await addDoc(collection(db, `users/${userId}/ciclos/${cicloId}/logs`), logData);
            showNotification('Registro añadido.');
            handlers.closeLogModal();
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

    // --- WEEKS ---
    closeAddWeekModal: () => {
        getEl('addWeekModal').style.display = 'none';
    },
    handleAddWeekSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const cicloId = form.dataset.cicloId;
        const weekNumber = parseInt(getEl('weekNumber').value);
        const phaseName = getEl('weekPhase').value;

        if (!cicloId || !weekNumber || !phaseName) {
            showNotification('Datos de semana inválidos.', 'error');
            return;
        }

        try {
            const cicloRef = doc(db, `users/${userId}/ciclos`, cicloId);
            await updateDoc(cicloRef, {
                floweringWeeks: arrayUnion({ weekNumber, phaseName })
            });
            showNotification(`Semana ${weekNumber} añadida.`);
            handlers.closeAddWeekModal();
        } catch (error) {
            console.error("Error adding week:", error);
            showNotification('Error al añadir la semana.', 'error');
        }
    },

    // --- MOVE CICLO ---
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
    }
};


// --- 3. INICIALIZACIÓN Y MANEJO DE ESTADO ---
onAuthStateChanged(auth, user => {
    getEl('initial-loader').classList.add('hidden');
    if (user) {
        userId = user.uid;
        handlers.hideAllViews();
        getEl('app').classList.remove('hidden');
        getEl('welcomeUser').innerText = `Anota todo, no seas pancho.`;
        
        loadSalas();
        loadCiclos();
        loadGenetics();
        loadSeeds();
        initializeEventListeners(handlers);
    } else {
        userId = null;
        if (salasUnsubscribe) salasUnsubscribe();
        if (ciclosUnsubscribe) ciclosUnsubscribe();
        if (geneticsUnsubscribe) geneticsUnsubscribe();
        if (seedsUnsubscribe) seedsUnsubscribe();
        
        handlers.hideAllViews();
        getEl('authView').classList.remove('hidden');
        initializeEventListeners(handlers);
    }
});