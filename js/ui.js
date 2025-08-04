// js/ui.js

// --- DOM ELEMENT GETTER ---
export const getEl = (id) => document.getElementById(id);
let notificationTimeout;

// --- NOTIFICATIONS ---
export function showNotification(message, type = 'success') {
    const container = getEl('notification-container');
    if (!container) return;

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    container.textContent = message;
    container.className = type; // 'success' o 'error'
    container.style.display = 'block';

    notificationTimeout = setTimeout(() => {
        container.style.display = 'none';
    }, 4000);
}

// --- RENDERING ---

export function renderSalasGrid(currentSalas, currentCiclos, handlers) {
    const salasGrid = getEl('salasGrid');
    if (!salasGrid) return;
    getEl('loadingSalas').style.display = 'none';
    salasGrid.innerHTML = '';
    if (currentSalas.length === 0) {
        getEl('emptySalasState').style.display = 'block';
        return;
    }
    getEl('emptySalasState').style.display = 'none';

    currentSalas.forEach(sala => {
        const ciclosInSala = currentCiclos.filter(c => c.salaId === sala.id);
        const activeCiclos = ciclosInSala.filter(c => c.phase !== 'Finalizado');

        const salaCard = document.createElement('div');
        salaCard.className = 'card rounded-xl p-5 flex flex-col justify-between aspect-square';
        salaCard.dataset.salaId = sala.id;
        
        let ciclosPreviewHTML = '';
        if (activeCiclos.length > 0) {
            const listHTML = activeCiclos.map(c => {
                let phaseClass = 'vege';
                if (c.phase === 'Floración' && c.floweringStartDate && c.floweringWeeks) {
                    const diffDays = handlers.calculateDaysSince(c.floweringStartDate);
                    if (diffDays !== null && diffDays > 0) {
                        const currentWeek = Math.floor((diffDays -1) / 7) + 1;
                        const weekData = c.floweringWeeks.find(w => w.weekNumber === currentWeek);
                        if (weekData) {
                            phaseClass = handlers.getPhaseInfo(weekData.phaseName).class;
                        }
                    }
                }
                return `<div class="ciclo-item ${phaseClass}">${c.name}</div>`;
            }).join('');
            ciclosPreviewHTML = `<div class="ciclos-list">${listHTML}</div>`;
        } else {
            ciclosPreviewHTML = '<p class="text-sm text-gray-500">Sala vacía</p>';
        }

        salaCard.innerHTML = `
            <div class="flex-grow flex flex-col">
                <h3 class="text-2xl font-bold text-white">${sala.name}</h3>
                <p class="text-gray-400 mb-4">${activeCiclos.length} ciclo(s) activo(s)</p>
                <div class="flex-grow relative overflow-hidden">${ciclosPreviewHTML}</div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <button data-action="edit-sala" class="btn-secondary p-2 rounded-lg transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                </button>
                <button data-action="delete-sala" class="btn-danger p-2 rounded-lg transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        `;
        salaCard.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            handlers.showCiclosView(sala.id, sala.name);
        });
        salaCard.querySelector('[data-action="edit-sala"]').addEventListener('click', (e) => {
            e.stopPropagation();
            handlers.openSalaModal(sala);
        });
        salaCard.querySelector('[data-action="delete-sala"]').addEventListener('click', (e) => {
            e.stopPropagation();
            handlers.deleteSala(sala.id, sala.name);
        });
        salasGrid.appendChild(salaCard);
    });
}

export function createCicloCard(ciclo, handlers) {
    const card = document.createElement('div');
    card.className = 'card rounded-xl p-5 flex flex-col justify-between';
    
    const phaseColor = ciclo.phase === 'Floración' ? 'bg-pink-500' : 'bg-green-500';
    const phaseText = ciclo.phase;
    const typeText = ciclo.cultivationType || 'Sustrato';
    const typeColor = typeText === 'Hidroponia' ? 'bg-blue-500' : 'bg-yellow-600';

    let statusInfo = '';
    if (ciclo.phase === 'Floración') {
        const diffDays = handlers.calculateDaysSince(ciclo.floweringStartDate);
        if (diffDays !== null && diffDays > 0) {
            const currentWeek = Math.floor((diffDays - 1) / 7) + 1;
            const totalWeeks = ciclo.floweringWeeks ? ciclo.floweringWeeks.length : 10;
            statusInfo = `<p class="text-sm text-gray-300 mt-1">Día ${diffDays} (Semana ${currentWeek} / ${totalWeeks})</p>`;
        }
    } else if (ciclo.phase === 'Vegetativo') {
        const diffDays = handlers.calculateDaysSince(ciclo.vegetativeStartDate);
        if (diffDays !== null && diffDays > 0) {
            const currentWeek = Math.floor((diffDays - 1) / 7) + 1;
            statusInfo = `<p class="text-sm text-gray-300 mt-1">Día ${diffDays} (Semana ${currentWeek}) de vegetativo</p>`;
        }
    }

    card.innerHTML = `
        <div>
            <div class="flex justify-between items-start">
                <h3 class="text-xl font-bold text-white">${ciclo.name}</h3>
                <div class="flex flex-col items-end gap-2">
                   <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${phaseColor} text-white">${phaseText}</span>
                   <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor} text-white">${typeText}</span>
                </div>
            </div>
            ${statusInfo}
        </div>
        <div class="mt-6 flex gap-2 justify-end">
            <button data-action="move-ciclo" class="btn-secondary p-2 rounded-lg transition" title="Mover Ciclo">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </button>
            <button data-action="edit-ciclo" class="btn-secondary p-2 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
            </button>
            <button data-action="delete-ciclo" class="btn-danger p-2 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <button data-action="view-details" class="btn-primary flex-grow font-semibold py-2 px-3 rounded-lg text-sm transition">Ver Detalles</button>
        </div>
    `;
    
    card.querySelector('[data-action="edit-ciclo"]').addEventListener('click', () => handlers.openCicloModal(ciclo));
    card.querySelector('[data-action="delete-ciclo"]').addEventListener('click', () => handlers.deleteCiclo(ciclo.id, ciclo.name));
    card.querySelector('[data-action="view-details"]').addEventListener('click', () => handlers.showCicloDetails(ciclo));
    card.querySelector('[data-action="move-ciclo"]').addEventListener('click', (e) => {
        e.stopPropagation();
        handlers.openMoveCicloModal(ciclo.id);
    });

    return card;
}

export function createLogEntry(log, ciclo, handlers) {
    const entry = document.createElement('div');
    const logDate = log.date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short'});
    const dayTimeInfo = log.day && log.time ? `<span class="font-semibold">${log.day}, ${log.time}</span>` : '';

    let details = '';
    let borderColor = 'border-amber-500';
    
    if (log.type === 'Riego') {
        const title = ciclo.cultivationType === 'Hidroponia' ? 'Control de Solución' : 'Riego';
        details = `<p class="font-semibold text-amber-400">${title}</p>
                    <div class="text-sm text-gray-300 mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                        <span><strong>pH:</strong> ${log.ph || 'N/A'}</span>
                        <span><strong>EC:</strong> ${log.ec || 'N/A'}</span>
                    </div>
                    <div class="text-sm text-gray-300 mt-2"><strong>Fertilizantes:</strong> ${handlers.formatFertilizers(log.fertilizers)}</div>`;
    } else if (log.type === 'Control de Plagas') {
        borderColor = 'border-yellow-400';
        details = `<p class="font-semibold text-yellow-400">Control de Plagas</p>
                   <p class="text-sm text-gray-300 mt-1 whitespace-pre-wrap">${log.notes || 'Sin notas.'}</p>`;
    } else if (log.type === 'Cambio de Solución') {
        borderColor = 'border-blue-400';
        details = `<p class="font-semibold text-blue-400">Cambio de Solución</p>
                    <div class="text-sm text-gray-300 mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                        <span><strong>Litros:</strong> ${log.litros || 'N/A'}</span>
                        <span><strong>pH:</strong> ${log.ph || 'N/A'}</span>
                        <span><strong>EC:</strong> ${log.ec || 'N/A'}</span>
                    </div>
                    <div class="text-sm text-gray-300 mt-2"><strong>Fertilizantes:</strong> ${handlers.formatFertilizers(log.fertilizers)}</div>`;
    } else if (log.type === 'Podas') {
        borderColor = 'border-green-400';
        details = `<p class="font-semibold text-green-400">Poda: ${log.podaType || ''}</p>`;
    }
    
    entry.className = `log-entry p-3 rounded-md ${borderColor}`;
    entry.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <span class="text-xs text-gray-400">${logDate}</span>
                <span class="text-xs text-gray-300 ml-2">${dayTimeInfo}</span>
            </div>
            <button data-action="delete-log" data-ciclo-id="${ciclo.id}" data-log-id="${log.id}" class="p-1 rounded-md text-gray-500 hover:bg-red-800 hover:text-white transition">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <div class="mt-2">${details}</div>
    `;

    entry.querySelector('[data-action="delete-log"]').addEventListener('click', (e) => {
        const cicloId = e.currentTarget.dataset.cicloId;
        const logId = e.currentTarget.dataset.logId;
        handlers.deleteLog(cicloId, logId);
    });

    return entry;
}

export function renderGeneticsList(currentGenetics, handlers) {
    const geneticsList = getEl('geneticsList');
    geneticsList.innerHTML = '';
    if (currentGenetics.length === 0) {
        geneticsList.innerHTML = `<p class="text-center text-gray-500">No hay genéticas guardadas.</p>`;
        return;
    }
    currentGenetics.forEach(g => {
        const geneticCard = document.createElement('div');
        geneticCard.className = 'card p-4 flex justify-between items-center';
        geneticCard.innerHTML = `
            <div>
                <p class="font-bold text-lg flex items-center gap-2">
                    ${g.name}
                </p>
                <p class="text-sm text-gray-400">${g.parents || ''} | ${g.bank || ''} | ${g.owner || ''}</p>
            </div>
            <div class="flex gap-2">
                <button data-action="edit-genetic" data-id="${g.id}" class="btn-secondary p-2 rounded-lg transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                </button>
                <button data-action="delete-genetic" data-id="${g.id}" class="btn-danger p-2 rounded-lg transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        `;
        geneticsList.appendChild(geneticCard);
    });
    // Add event listeners
    geneticsList.querySelectorAll('[data-action="edit-genetic"]').forEach(btn => btn.addEventListener('click', (e) => handlers.editGenetic(e.currentTarget.dataset.id)));
    geneticsList.querySelectorAll('[data-action="delete-genetic"]').forEach(btn => btn.addEventListener('click', (e) => handlers.deleteGenetic(e.currentTarget.dataset.id)));
}

export function renderStockList(currentGenetics, handlers) {
    const stockList = getEl('stockList');
    stockList.innerHTML = '';
    if (currentGenetics.length === 0) {
        stockList.innerHTML = `<p class="text-center text-gray-500">Añade genéticas para ver el stock.</p>`;
        return;
    }
    currentGenetics.forEach(g => {
        const stockCard = document.createElement('div');
        stockCard.className = 'card p-4 flex justify-between items-center';
        stockCard.innerHTML = `
            <div>
                <p class="font-bold text-lg">${g.name}</p>
                <p class="text-sm text-gray-400">Clones en stock: <span class="font-bold text-xl text-amber-400">${g.cloneStock || 0}</span></p>
            </div>
            <div class="flex items-center gap-2">
                <button data-action="update-stock" data-id="${g.id}" data-amount="-1" class="btn-secondary rounded-full w-10 h-10 flex items-center justify-center text-2xl">-</button>
                <button data-action="update-stock" data-id="${g.id}" data-amount="1" class="btn-secondary rounded-full w-10 h-10 flex items-center justify-center text-2xl">+</button>
            </div>
        `;
        stockList.appendChild(stockCard);
    });
    stockList.querySelectorAll('[data-action="update-stock"]').forEach(btn => btn.addEventListener('click', (e) => handlers.updateStock(e.currentTarget.dataset.id, parseInt(e.currentTarget.dataset.amount))));
}

export function renderSeedBankList(currentSeeds, handlers) {
    const seedBankList = getEl('seedBankList');
    seedBankList.innerHTML = '';
    if (currentSeeds.length === 0) {
        seedBankList.innerHTML = `<p class="text-center text-gray-500">No hay semillas en el banco.</p>`;
        return;
    }
    currentSeeds.forEach(s => {
        const seedCard = document.createElement('div');
        seedCard.className = 'card p-4 flex justify-between items-center';
        seedCard.innerHTML = `
            <div>
                <p class="font-bold text-lg">${s.name}</p>
                <p class="text-sm text-gray-400">${s.bank || 'Banco Desconocido'}</p>
                <p class="text-sm text-gray-400">Cantidad: <span class="font-bold text-amber-400">${s.quantity || 0}</span></p>
            </div>
            <div class="flex gap-2">
                <button data-action="germinate-seed" data-id="${s.id}" class="btn-primary py-2 px-4 rounded-lg text-sm">Germinar</button>
                <button data-action="delete-seed" data-id="${s.id}" class="btn-danger p-2 rounded-lg transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        `;
        seedBankList.appendChild(seedCard);
    });
    seedBankList.querySelectorAll('[data-action="germinate-seed"]').forEach(btn => btn.addEventListener('click', (e) => handlers.openGerminateModal(e.currentTarget.dataset.id)));
    seedBankList.querySelectorAll('[data-action="delete-seed"]').forEach(btn => btn.addEventListener('click', (e) => handlers.deleteSeed(e.currentTarget.dataset.id)));
}

// --- INITIALIZATION ---
export function initializeAppEventListeners(handlers) {
    getEl('logoutBtn').addEventListener('click', () => handlers.signOut());

    getEl('menuBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        getEl('dropdownMenu').classList.toggle('hidden');
    });

    window.addEventListener('click', (e) => {
        const menuBtn = getEl('menuBtn');
        const dropdownMenu = getEl('dropdownMenu');
        if (menuBtn && dropdownMenu && !dropdownMenu.contains(e.target) && !menuBtn.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });

    getEl('aboutBtn').addEventListener('click', () => getEl('aboutModal').style.display = 'flex');
    
    getEl('menuAddSala').addEventListener('click', (e) => {
        e.preventDefault();
        handlers.openSalaModal();
        getEl('dropdownMenu').classList.add('hidden');
    });
    
    getEl('menuAddCiclo').addEventListener('click', (e) => {
        e.preventDefault();
        handlers.openCicloModal();
        getEl('dropdownMenu').classList.add('hidden');
    });

    getEl('menuTools').addEventListener('click', (e) => {
        e.preventDefault();
        handlers.showToolsView();
        getEl('dropdownMenu').classList.add('hidden');
    });
    
    getEl('menuSettings').addEventListener('click', (e) => {
        e.preventDefault();
        handlers.showSettingsView();
        getEl('dropdownMenu').classList.add('hidden');
    });
    
    getEl('backToPanelBtn').addEventListener('click', handlers.hideToolsView);
    getEl('backToSalasBtn').addEventListener('click', handlers.hideCiclosView);
    getEl('geneticsTabBtn').addEventListener('click', () => handlers.switchToolsTab('genetics'));
    getEl('stockTabBtn').addEventListener('click', () => handlers.switchToolsTab('stock'));
    getEl('seedBankTabBtn').addEventListener('click', () => handlers.switchToolsTab('seedBank'));
    getEl('geneticsForm').addEventListener('submit', handlers.handleGeneticsFormSubmit);
    getEl('seedForm').addEventListener('submit', handlers.handleSeedFormSubmit);

    getEl('cancelSalaBtn').addEventListener('click', () => getEl('salaModal').style.display = 'none');
    getEl('salaForm').addEventListener('submit', handlers.handleSalaFormSubmit);

    getEl('cancelCicloBtn').addEventListener('click', () => getEl('cicloModal').style.display = 'none');
    getEl('cicloForm').addEventListener('submit', handlers.handleCicloFormSubmit);
    getEl('cicloPhase').addEventListener('change', handlers.updateCicloModalDateFields); 
    
    getEl('backToCiclosBtn').addEventListener('click', handlers.hideCicloDetails);
    
    getEl('cancelLogBtn').addEventListener('click', handlers.closeLogModal);
    getEl('logForm').addEventListener('submit', handlers.handleLogFormSubmit);
    getEl('logType').addEventListener('change', handlers.toggleLogFields);

    getEl('cancelAddWeekBtn').addEventListener('click', handlers.closeAddWeekModal);
    getEl('addWeekForm').addEventListener('submit', handlers.handleAddWeekSubmit);
    
    getEl('closeAiSummaryBtn').addEventListener('click', () => {
        getEl('aiSummaryModal').style.display = 'none';
    });
    
    getEl('fertFoliar').addEventListener('change', (e) => {
        getEl('fertFoliarProduct').classList.toggle('hidden', !e.target.checked);
    });
    
    getEl('podaType').addEventListener('change', () => {
        getEl('clonesSection').style.display = getEl('podaType').value === 'Clones' ? 'block' : 'none';
    });

    getEl('cancelGerminateBtn').addEventListener('click', () => getEl('germinateSeedModal').style.display = 'none');
    getEl('germinateSeedForm').addEventListener('submit', handlers.handleGerminateFormSubmit);

    getEl('cancelMoveCicloBtn').addEventListener('click', () => getEl('moveCicloModal').style.display = 'none');
    getEl('moveCicloForm').addEventListener('submit', handlers.handleMoveCicloSubmit);

    getEl('backToPanelFromSettingsBtn').addEventListener('click', handlers.hideSettingsView);
    getEl('changePasswordForm').addEventListener('submit', handlers.handleChangePassword);
    getEl('deleteAccountBtn').addEventListener('click', handlers.handleDeleteAccount);

    getEl('closeAddGeneticsBtn').addEventListener('click', () => getEl('addGeneticsToCicloModal').style.display = 'none');
    getEl('addFromStockBtn').addEventListener('click', () => handlers.handleAddGeneticToCiclo('stock'));
    getEl('addNewGeneticBtn').addEventListener('click', () => handlers.handleAddGeneticToCiclo('new'));

    getEl('confirmActionBtn').addEventListener('click', () => {
        if (handlers.getConfirmCallback()) {
            handlers.getConfirmCallback()();
        }
        handlers.hideConfirmationModal();
    });

    getEl('cancelActionBtn').addEventListener('click', handlers.hideConfirmationModal);
}