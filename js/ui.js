// js/ui.js

export const getEl = (id) => document.getElementById(id);
let notificationTimeout;

export function showNotification(message, type = 'success') {
    const container = getEl('notification-container');
    if (!container) return;

    // Create a new notification element
    const notif = document.createElement('div');
    notif.textContent = message;
    notif.className = `p-3 rounded-lg shadow-lg mb-2 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white transition-opacity duration-500 ease-in-out opacity-100`;

    container.appendChild(notif);
    if (container.style.display !== 'block') {
        container.style.display = 'block';
    }

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.addEventListener('transitionend', () => {
            notif.remove();
            if (container.children.length === 0) {
                container.style.display = 'none';
            }
        });
    }, 4000);
}


// --- DYNAMIC CONTENT RENDERERS ---

function createModalHTML(id, title, formId, content, submitText, cancelId, submitId = "submitBtn") {
    return `
        <div class="w-full max-w-lg p-6 rounded-lg shadow-lg">
            <h2 class="text-2xl font-bold mb-6 text-amber-400">${title}</h2>
            <form id="${formId}">
                ${content}
                <div class="flex justify-end gap-4 mt-8">
                    <button type="button" id="${cancelId}" class="btn-secondary py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" id="${submitId}" class="btn-primary py-2 px-4 rounded-lg">${submitText}</button>
                </div>
            </form>
        </div>
    `;
}

export function openSalaModal(sala = null) {
    const title = sala ? 'Editar Sala' : 'Añadir Sala';
    const content = `
        <div>
            <label for="sala-name" class="block text-sm font-medium text-gray-300 mb-1">Nombre de la Sala</label>
            <input type="text" id="sala-name" required class="w-full p-2 rounded-md" value="${sala ? sala.name : ''}">
        </div>
    `;
    const modal = getEl('salaModal');
    modal.innerHTML = createModalHTML('salaModalContent', title, 'salaForm', content, sala ? 'Guardar Cambios' : 'Crear Sala', 'cancelSalaBtn');
    
    getEl('salaForm').dataset.id = sala ? sala.id : '';
    modal.style.display = 'flex';
}

export function openCicloModal(ciclo = null, salas = []) {
    const title = ciclo ? 'Editar Ciclo' : 'Añadir Ciclo';
    const salaOptions = salas.length > 0
        ? salas.map(s => `<option value="${s.id}" ${ciclo && ciclo.salaId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')
        : '<option value="" disabled>Crea una sala primero</option>';
    
    const content = `
        <div class="space-y-4">
            <div>
                <label for="ciclo-name" class="block text-sm font-medium text-gray-300 mb-1">Nombre del Ciclo</label>
                <input type="text" id="ciclo-name" required class="w-full p-2 rounded-md" value="${ciclo ? ciclo.name : ''}">
            </div>
            <div>
                <label for="ciclo-sala-select" class="block text-sm font-medium text-gray-300 mb-1">Sala</label>
                <select id="ciclo-sala-select" required class="w-full p-2 rounded-md">${salaOptions}</select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="cicloPhase" class="block text-sm font-medium text-gray-300 mb-1">Fase Inicial</label>
                    <select id="cicloPhase" class="w-full p-2 rounded-md">
                        <option value="Vegetativo" ${ciclo && ciclo.phase === 'Vegetativo' ? 'selected' : ''}>Vegetativo</option>
                        <option value="Floración" ${ciclo && ciclo.phase === 'Floración' ? 'selected' : ''}>Floración</option>
                        <option value="Finalizado" ${ciclo && ciclo.phase === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                    </select>
                </div>
                <div>
                    <label for="cultivationType" class="block text-sm font-medium text-gray-300 mb-1">Tipo de Cultivo</label>
                    <select id="cultivationType" class="w-full p-2 rounded-md">
                        <option value="Sustrato" ${ciclo && ciclo.cultivationType === 'Sustrato' ? 'selected' : ''}>Sustrato</option>
                        <option value="Hidroponia" ${ciclo && ciclo.cultivationType === 'Hidroponia' ? 'selected' : ''}>Hidroponia</option>
                    </select>
                </div>
            </div>
            <div id="vegetativeDateContainer" class="${(ciclo && ciclo.phase === 'Vegetativo') || !ciclo ? '' : 'hidden'}">
                <label for="vegetativeStartDate" class="block text-sm font-medium text-gray-300 mb-1">Fecha Inicio Vegetativo</label>
                <input type="date" id="vegetativeStartDate" class="w-full p-2 rounded-md" value="${ciclo ? ciclo.vegetativeStartDate : ''}">
            </div>
            <div id="floweringDateContainer" class="${ciclo && ciclo.phase === 'Floración' ? '' : 'hidden'}">
                <label for="floweringStartDate" class="block text-sm font-medium text-gray-300 mb-1">Fecha Inicio Floración (12/12)</label>
                <input type="date" id="floweringStartDate" class="w-full p-2 rounded-md" value="${ciclo ? ciclo.floweringStartDate : ''}">
            </div>
             <div>
                <label for="ciclo-notes" class="block text-sm font-medium text-gray-300 mb-1">Notas</label>
                <textarea id="ciclo-notes" rows="3" class="w-full p-2 rounded-md">${ciclo ? ciclo.notes : ''}</textarea>
            </div>
        </div>
    `;
    const modal = getEl('cicloModal');
    modal.innerHTML = createModalHTML('cicloModalContent', title, 'cicloForm', content, ciclo ? 'Guardar Cambios' : 'Crear Ciclo', 'cancelCicloBtn');
    
    getEl('cicloForm').dataset.id = ciclo ? ciclo.id : '';
    modal.style.display = 'flex';
}

export function openLogModal(ciclo, week, log = null) {
    const title = 'Añadir Registro';
    const content = `
        <input type="hidden" id="log-ciclo-id" value="${ciclo.id}">
        <input type="hidden" id="log-week-number" value="${week.weekNumber}">
        <div class="space-y-4">
            <div>
                <label for="logType" class="block text-sm font-medium text-gray-300 mb-1">Tipo de Registro</label>
                <select id="logType" class="w-full p-2 rounded-md">
                    <option value="Riego">${ciclo.cultivationType === 'Hidroponia' ? 'Control de Solución' : 'Riego'}</option>
                    ${ciclo.cultivationType === 'Hidroponia' ? '<option value="Cambio de Solución">Cambio de Solución</option>' : ''}
                    <option value="Control de Plagas">Control de Plagas</option>
                    <option value="Podas">Podas</option>
                </select>
            </div>

            <div id="riegoFields">
                <div class="grid grid-cols-2 gap-4">
                    <div><label for="log-ph">pH</label><input type="number" step="0.1" id="log-ph" class="w-full p-2 rounded-md"></div>
                    <div><label for="log-ec">EC</label><input type="number" step="0.1" id="log-ec" class="w-full p-2 rounded-md"></div>
                </div>
                 <fieldset class="mt-4 border border-gray-600 p-3 rounded-md">
                    <legend class="px-2 text-sm font-medium">Fertilizantes</legend>
                    <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div class="flex items-center gap-2"><input type="number" id="fert-bases-amount" placeholder="Cant." class="w-20 p-1 rounded"><select id="fert-bases-unit" class="p-1 rounded"><option>ml/L</option><option>gr/L</option></select></div>
                        <div class="flex items-center gap-2"><input type="checkbox" id="fert-enzimas" class="h-4 w-4 rounded"><label for="fert-enzimas">Enzimas</label></div>
                        <div class="flex items-center gap-2"><input type="checkbox" id="fert-candy" class="h-4 w-4 rounded"><label for="fert-candy">Candy</label></div>
                        <div class="flex items-center gap-2"><input type="checkbox" id="fert-bigbud" class="h-4 w-4 rounded"><label for="fert-bigbud">BigBud</label></div>
                        <div class="flex items-center gap-2"><input type="checkbox" id="fert-flawless" class="h-4 w-4 rounded"><label for="fert-flawless">Flawless Finish</label></div>
                        <div class="flex items-center gap-2"><input type="checkbox" id="fert-foliar" class="h-4 w-4 rounded"><label for="fert-foliar">Foliar</label></div>
                    </div>
                     <input type="text" id="fert-foliar-product" placeholder="Producto foliar" class="w-full p-2 rounded-md mt-2 hidden">
                </fieldset>
            </div>

            <div id="solucionFields" class="hidden">
                 <div><label for="log-litros">Litros Totales</label><input type="number" id="log-litros" class="w-full p-2 rounded-md"></div>
            </div>

            <div id="plagasFields" class="hidden">
                <label for="plagas-notes">Notas / Producto Aplicado</label>
                <textarea id="plagas-notes" rows="3" class="w-full p-2 rounded-md"></textarea>
            </div>

            <div id="podasFields" class="hidden">
                 <label for="podaType">Tipo de Poda</label>
                 <select id="podaType" class="w-full p-2 rounded-md">
                    <option>LST</option><option>Main-lining</option><option>Supercropping</option><option>Defoliación</option><option>Lollipop</option><option>Clones</option>
                 </select>
                 <div id="clonesSection" class="mt-2 hidden">
                    <label for="clones-count">Cantidad de Clones</label>
                    <input type="number" id="clones-count" class="w-full p-2 rounded-md">
                 </div>
            </div>
        </div>
    `;
    const modal = getEl('logModal');
    modal.innerHTML = createModalHTML('logModalContent', title, 'logForm', content, 'Guardar Registro', 'cancelLogBtn');
    
    const form = getEl('logForm');
    form.dataset.cicloId = ciclo.id;
    form.dataset.week = week.weekNumber;
    form.dataset.logId = log ? log.id : ''; // For editing later
    
    modal.style.display = 'flex';
}

export function openMoveCicloModal(ciclo, salas) {
    const title = `Mover Ciclo "${ciclo.name}"`;
    const salaOptions = salas
        .filter(s => s.id !== ciclo.salaId)
        .map(s => `<option value="${s.id}">${s.name}</option>`)
        .join('');
    
    const content = `
        <p class="mb-4">Selecciona la sala de destino:</p>
        <select id="move-ciclo-sala-select" class="w-full p-2 rounded-md">
            ${salaOptions.length > 0 ? salaOptions : '<option disabled>No hay otras salas</option>'}
        </select>
    `;

    const modal = getEl('moveCicloModal');
    modal.innerHTML = createModalHTML('moveCicloModalContent', title, 'moveCicloForm', content, 'Mover', 'cancelMoveCicloBtn');
    
    getEl('moveCicloForm').dataset.cicloId = ciclo.id;
    modal.style.display = 'flex';
}

export function openGerminateModal(seed) {
     const title = `Germinar "${seed.name}"`;
     const content = `
        <p class="mb-1">Disponibles: ${seed.quantity}</p>
        <label for="germinate-quantity" class="block text-sm font-medium text-gray-300 mb-1">Cantidad a germinar</label>
        <input type="number" id="germinate-quantity" min="1" max="${seed.quantity}" required class="w-full p-2 rounded-md" value="1">
     `;
     const modal = getEl('germinateSeedModal');
     modal.innerHTML = createModalHTML('germinateSeedModalContent', title, 'germinateSeedForm', content, 'Germinar', 'cancelGerminateBtn');
     
     getEl('germinateSeedForm').dataset.id = seed.id;
     modal.style.display = 'flex';
}

export function renderCicloDetails(ciclo, handlers) {
    let weeksHTML = '<p class="text-gray-500">Este ciclo no tiene seguimiento por semanas (es vegetativo o finalizado).</p>';

    if (ciclo.phase === 'Floración' && ciclo.floweringWeeks) {
        // Sort weeks just in case they are not in order
        ciclo.floweringWeeks.sort((a, b) => a.weekNumber - b.weekNumber);
        
        weeksHTML = ciclo.floweringWeeks.map(week => {
            const phaseInfo = handlers.getPhaseInfo(week.phaseName);
            return `
                <div class="mb-4">
                    <div class="week-header p-3 rounded-t-lg flex justify-between items-center cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                        <h4 class="font-bold text-lg">Semana ${week.weekNumber} <span class="text-sm font-normal px-2 py-1 rounded-full ${phaseInfo.color}">${phaseInfo.name}</span></h4>
                        <button class="btn-primary text-xs py-1 px-2 rounded-md add-log-for-week-btn" data-week='${JSON.stringify(week)}'>+ Registro</button>
                    </div>
                    <div class="p-4 bg-[#262626] rounded-b-lg space-y-3" id="logs-week-${week.weekNumber}">
                        </div>
                </div>
            `;
        }).join('');
    }

    const diffDaysVege = handlers.calculateDaysSince(ciclo.vegetativeStartDate);
    const diffDaysFlora = handlers.calculateDaysSince(ciclo.floweringStartDate);
    let statusText = '';
    if(ciclo.phase === 'Vegetativo' && diffDaysVege !== null) statusText = `Día ${diffDaysVege} de vegetativo.`;
    if(ciclo.phase === 'Floración' && diffDaysFlora !== null) statusText = `Día ${diffDaysFlora} de floración.`;

    const html = `
        <div data-ciclo-id="${ciclo.id}">
             <header class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-4xl font-bold text-white">${ciclo.name}</h2>
                    <p class="text-gray-400">${statusText}</p>
                </div>
                <button id="backToCiclosBtn" class="btn-secondary py-2 px-4 rounded-lg">Volver</button>
            </header>
            <main>
                ${weeksHTML}
            </main>
        </div>
    `;

    // After setting innerHTML, re-attach listeners for dynamically created buttons inside the weeks
    setTimeout(() => {
        document.querySelectorAll('.add-log-for-week-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the header click from firing
                const weekData = JSON.parse(e.target.dataset.week);
                openLogModal(ciclo, weekData);
            });
        });
    }, 0);
    
    return html;
}

export function renderToolsView() {
    return `
        <header class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-white">Herramientas</h1>
            <button id="backToPanelBtn" class="btn-secondary py-2 px-4 rounded-lg">Volver al Panel</button>
        </header>

        <div class="mb-6 border-b border-gray-700">
            <nav class="flex space-x-8" aria-label="Tabs">
                <button id="geneticsTabBtn" class="py-4 px-1 border-b-2 font-medium text-lg text-gray-300 hover:text-white hover:border-gray-300">Genéticas</button>
                <button id="stockTabBtn" class="py-4 px-1 border-b-2 font-medium text-lg text-gray-300 hover:text-white hover:border-gray-300">Stock Clones</button>
                <button id="seedBankTabBtn" class="py-4 px-1 border-b-2 font-medium text-lg text-gray-300 hover:text-white hover:border-gray-300">Banco Semillas</button>
            </nav>
        </div>

        <div id="geneticsContent">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-1">
                    <form id="geneticsForm" class="card p-6 space-y-4">
                        <h3 id="genetic-form-title" class="text-xl font-bold text-amber-400">Añadir Nueva Genética</h3>
                        <input type="text" id="genetic-name" placeholder="Nombre de la genética" required class="w-full p-2 rounded-md">
                        <input type="text" id="genetic-parents" placeholder="Padres (ej: Blue Dream x AK-47)" class="w-full p-2 rounded-md">
                        <input type="text" id="genetic-bank" placeholder="Banco" class="w-full p-2 rounded-md">
                        <input type="text" id="genetic-owner" placeholder="Dueño" class="w-full p-2 rounded-md">
                        <input type="number" id="genetic-stock" placeholder="Stock de clones inicial" class="w-full p-2 rounded-md">
                        <button type="submit" class="btn-primary w-full py-2 rounded-lg">Guardar Genética</button>
                    </form>
                </div>
                <div id="geneticsList" class="lg:col-span-2 space-y-4">
                    </div>
            </div>
        </div>

        <div id="stockContent" class="hidden">
            <div id="stockList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                </div>
        </div>

        <div id="seedBankContent" class="hidden">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-1">
                    <form id="seedForm" class="card p-6 space-y-4">
                        <h3 class="text-xl font-bold text-amber-400">Añadir Semillas al Banco</h3>
                        <input type="text" id="seed-name" placeholder="Nombre de la semilla" required class="w-full p-2 rounded-md">
                        <input type="text" id="seed-bank" placeholder="Banco" class="w-full p-2 rounded-md">
                        <input type="number" id="seed-quantity" placeholder="Cantidad" required class="w-full p-2 rounded-md">
                        <button type="submit" class="btn-primary w-full py-2 rounded-lg">Añadir al Banco</button>
                    </form>
                </div>
                <div id="seedBankList" class="lg:col-span-2 space-y-4">
                    </div>
            </div>
        </div>
    `;
}

export function renderSettingsView() {
    return `
        <header class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-white">Ajustes</h1>
            <button id="backToPanelFromSettingsBtn" class="btn-secondary py-2 px-4 rounded-lg">Volver al Panel</button>
        </header>
        <div class="max-w-2xl mx-auto space-y-8">
            <div class="card p-6">
                <h2 class="text-xl font-bold text-amber-400 mb-4">Cambiar Contraseña</h2>
                <form id="changePasswordForm" class="space-y-4">
                    <input type="password" id="newPassword" placeholder="Nueva contraseña" required class="w-full p-2 rounded-md">
                    <input type="password" id="confirmPassword" placeholder="Confirmar nueva contraseña" required class="w-full p-2 rounded-md">
                    <button type="submit" class="btn-primary py-2 px-4 rounded-lg">Cambiar Contraseña</button>
                </form>
            </div>
            <div class="card p-6 border-red-500">
                <h2 class="text-xl font-bold text-red-400 mb-4">Zona de Peligro</h2>
                <p class="text-gray-400 mb-4">Esta acción no se puede deshacer. Perderás todos tus datos de cultivo.</p>
                <button id="deleteAccountBtn" class="btn-danger py-2 px-4 rounded-lg">Eliminar mi Cuenta</button>
            </div>
        </div>
    `;
}

// --- CARD AND LIST ITEM CREATORS (EXISTING CODE) ---
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
        if(log.clonesCount) details += `<p class="text-sm text-gray-300">Se sacaron ${log.clonesCount} clones.</p>`;
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
        handlers.deleteLog(e.currentTarget.dataset.cicloId, e.currentTarget.dataset.logId);
    });
    return entry;
}

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
                        const currentWeek = Math.floor((diffDays - 1) / 7) + 1;
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

export function renderGeneticsList(currentGenetics, handlers) {
    const geneticsList = getEl('geneticsList');
    if (!geneticsList) return;
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
                <p class="font-bold text-lg flex items-center gap-2">${g.name}</p>
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
    geneticsList.querySelectorAll('[data-action="edit-genetic"]').forEach(btn => btn.addEventListener('click', (e) => handlers.editGenetic(e.currentTarget.dataset.id)));
    geneticsList.querySelectorAll('[data-action="delete-genetic"]').forEach(btn => btn.addEventListener('click', (e) => handlers.deleteGenetic(e.currentTarget.dataset.id)));
}

export function renderStockList(currentGenetics, handlers) {
    const stockList = getEl('stockList');
    if (!stockList) return;
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
    if (!seedBankList) return;
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
                <button data-action="germinate-seed" data-id="${s.id}" class="btn-primary py-2 px-4 rounded-lg text-sm" ${s.quantity > 0 ? '' : 'disabled'}>Germinar</button>
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

// --- EVENT LISTENERS INITIALIZER ---
export function initializeEventListeners(handlers) {
    // Auth listeners
    getEl('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handlers.handleLogin(getEl('login-email').value, getEl('login-password').value);
    });
    getEl('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handlers.handleRegister(getEl('register-email').value, getEl('register-password').value);
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

    // Main App Listeners (for elements that are always in the DOM)
    getEl('logoutBtn').addEventListener('click', () => handlers.signOut());
    getEl('menuBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        getEl('dropdownMenu').classList.toggle('hidden');
    });
    window.addEventListener('click', (e) => {
        const menuBtn = getEl('menuBtn');
        const dropdownMenu = getEl('dropdownMenu');
        if (menuBtn && dropdownMenu && !menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });
    getEl('aboutBtn').addEventListener('click', () => getEl('aboutModal').style.display = 'flex');
    getEl('menuAddSala').addEventListener('click', (e) => { e.preventDefault(); handlers.openSalaModal(); getEl('dropdownMenu').classList.add('hidden'); });
    getEl('menuAddCiclo').addEventListener('click', (e) => { e.preventDefault(); handlers.openCicloModal(); getEl('dropdownMenu').classList.add('hidden'); });
    getEl('menuTools').addEventListener('click', (e) => { e.preventDefault(); handlers.showToolsView(); getEl('dropdownMenu').classList.add('hidden'); });
    getEl('menuSettings').addEventListener('click', (e) => { e.preventDefault(); handlers.showSettingsView(); getEl('dropdownMenu').classList.add('hidden'); });
    
    // Listener for the button that was causing issues. It's static, so it can be initialized here.
    getEl('backToSalasBtn').addEventListener('click', handlers.hideCiclosView);

    // Dynamic modal/view listeners (using event delegation on a static parent)
    document.body.addEventListener('click', (e) => {
        // Modal cancel buttons
        if (e.target.id === 'cancelSalaBtn') getEl('salaModal').style.display = 'none';
        if (e.target.id === 'cancelCicloBtn') getEl('cicloModal').style.display = 'none';
        if (e.target.id === 'cancelLogBtn') getEl('logModal').style.display = 'none';
        if (e.target.id === 'cancelMoveCicloBtn') getEl('moveCicloModal').style.display = 'none';
        if (e.target.id === 'cancelGerminateBtn') getEl('germinateSeedModal').style.display = 'none';
        if (e.target.id === 'closeAboutBtn') getEl('aboutModal').style.display = 'none';
        if (e.target.id === 'cancelActionBtn') handlers.hideConfirmationModal();
        if (e.target.id === 'confirmActionBtn') {
             if (handlers.getConfirmCallback()) handlers.getConfirmCallback()();
             handlers.hideConfirmationModal();
        }
    });

    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'salaForm') handlers.handleSalaFormSubmit(e);
        if (e.target.id === 'cicloForm') handlers.handleCicloFormSubmit(e);
        if (e.target.id === 'logForm') handlers.handleLogFormSubmit(e);
        if (e.target.id === 'moveCicloForm') handlers.handleMoveCicloSubmit(e);
        if (e.target.id === 'germinateSeedForm') handlers.handleGerminateFormSubmit(e);
    });

    document.body.addEventListener('change', (e) => {
        if (e.target.id === 'cicloPhase') handlers.updateCicloModalDateFields();
        if (e.target.id === 'logType') handlers.toggleLogFields();
        if (e.target.id === 'podaType') getEl('clonesSection').style.display = e.target.value === 'Clones' ? 'block' : 'none';
        if (e.target.id === 'fert-foliar') getEl('fert-foliar-product').classList.toggle('hidden', !e.target.checked);
    });
}