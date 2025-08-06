// js/ui.js

import { crearTimelinePrincipal } from './components/timelinePrincipal.js';

export const getEl = (id) => document.getElementById(id);
let notificationTimeout;

const FERTILIZER_LINES = {
    "Top Crop": ["Deeper Underground", "Top Veg", "Top Bloom", "Big One", "Top Candy", "Top Bud", "Micro Vita"],
    "Namaste": ["Amazonia Roots", "Oro Negro", "Flora Booster", "Trico+", "Shanti", "Bio CaMg"],
    "Kawsay": ["Nutri Base", "Amazonia", "Flora Booster", "Bud Engorde", "Super Candy"],
    "Advanced Nutrients": ["Sensi Grow A+B", "Sensi Bloom A+B", "Voodoo Juice", "B-52", "Big Bud", "Overdrive", "Flawless Finish"],
    "Athena (Blended)": ["Grow A", "Grow B", "Bloom A", "Bloom B", "CaMg", "PK", "Cleanse"],
    "Orgánico / Living Soil": ["Humus de lombriz", "Compost", "Bokashi", "Guano de murciélago", "Harina de hueso", "Melaza", "Micorrizas", "Trichodermas"],
    "Personalizada": []
};

function createTooltipIcon(title) {
    return `
        <span class="tooltip-trigger inline-flex items-center justify-center" data-tippy-content="${title}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-amber-500 cursor-pointer">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
        </span>
    `;
}

function initializeTooltips() {
    setTimeout(() => {
        tippy('.tooltip-trigger', {
            animation: 'scale-subtle',
            theme: 'light-border',
            allowHTML: true,
            trigger: 'mouseenter focus',
        });
        tippy('.tooltip-trigger-click', {
            animation: 'scale-subtle',
            theme: 'light-border',
            allowHTML: true,
            trigger: 'click',
            interactive: true,
        });
    }, 0);
}

export function showNotification(message, type = 'success') {
    const container = getEl('notification-container');
    if (!container) return;

    if(document.getElementById('main-notification')) {
        return;
    }
    
    const notif = document.createElement('div');
    notif.id = 'main-notification';
    notif.textContent = message;
    
    notif.className = `p-3 rounded-lg shadow-lg text-white transition-all duration-500 ease-in-out`;
    notif.classList.add(type === 'success' ? 'bg-green-500' : 'bg-red-500');

    notif.style.opacity = '0';
    notif.style.transform = 'translateY(20px)';
    
    container.innerHTML = '';
    container.appendChild(notif);

    void notif.offsetWidth;

    notif.style.opacity = '1';
    notif.style.transform = 'translateY(0)';
    
    clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateY(20px)';
        notif.addEventListener('transitionend', () => notif.remove());
    }, 4000);
}

function createModalHTML(id, title, formId, content, submitText, cancelId, submitId = "submitBtn") {
    return `
        <div class="w-11/12 md:w-full max-w-lg p-6 rounded-lg shadow-lg overflow-y-auto max-h-screen">
            <h2 class="text-2xl font-bold mb-6 text-amber-400">${title}</h2>
            <form id="${formId}" data-id="">
                ${content}
                <div class="flex justify-end gap-4 mt-8">
                    <button type="button" id="${cancelId}" class="btn-secondary btn-base py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" id="${submitId}" class="btn-primary btn-base py-2 px-4 rounded-lg">${submitText}</button>
                </div>
            </form>
        </div>
    `;
}

export function openSalaModal(sala = null) {
    const title = sala ? 'Editar Sala' : 'Añadir Sala';
    const content = `
        <div>
            <label for="sala-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la Sala</label>
            <input type="text" id="sala-name" required class="w-full p-2 rounded-md" value="${sala ? sala.name : ''}">
        </div>
    `;
    const modal = getEl('salaModal');
    modal.innerHTML = createModalHTML('salaModalContent', title, 'salaForm', content, sala ? 'Guardar Cambios' : 'Crear Sala', 'cancelSalaBtn');
    
    getEl('salaForm').dataset.id = sala ? sala.id : '';
    modal.style.display = 'flex';
}

export function openCicloModal(ciclo = null, salas = [], preselectedSalaId = null) {
    const title = ciclo ? 'Editar Ciclo' : 'Añadir Ciclo';
    const salaOptions = salas.length > 0
        ? salas.map(s => `<option value="${s.id}" ${ (ciclo && ciclo.salaId === s.id) || (preselectedSalaId === s.id) ? 'selected' : ''}>${s.name}</option>`).join('')
        : '<option value="" disabled>Crea una sala primero</option>';
    
    const content = `
        <div class="space-y-4">
            <div>
                <label for="ciclo-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Ciclo</label>
                <input type="text" id="ciclo-name" required class="w-full p-2 rounded-md" value="${ciclo ? ciclo.name : ''}">
            </div>
            <div>
                <label for="ciclo-sala-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sala</label>
                <select id="ciclo-sala-select" required class="w-full p-2 rounded-md">${salaOptions}</select>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label for="cicloPhase" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fase Inicial</label>
                    <select id="cicloPhase" class="w-full p-2 rounded-md">
                        <option value="Vegetativo" ${ciclo && ciclo.phase === 'Vegetativo' ? 'selected' : ''}>Vegetativo</option>
                        <option value="Floración" ${ciclo && ciclo.phase === 'Floración' ? 'selected' : ''}>Floración</option>
                    </select>
                </div>
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <label for="cultivationType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Cultivo</label>
                        ${createTooltipIcon("Define el método de cultivo. Esto ajustará las opciones de registro disponibles (ej: 'Cambio de Solución' para Hidroponia).")}
                    </div>
                    <select id="cultivationType" class="w-full p-2 rounded-md">
                        <option value="Sustrato" ${ciclo && ciclo.cultivationType === 'Sustrato' ? 'selected' : ''}>Sustrato</option>
                        <option value="Hidroponia" ${ciclo && ciclo.cultivationType === 'Hidroponia' ? 'selected' : ''}>Hidroponia</option>
                    </select>
                </div>
            </div>
            <div id="vegetativeDateContainer" class="${(ciclo && ciclo.phase === 'Vegetativo') || !ciclo ? '' : 'hidden'}">
                <label for="vegetativeStartDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio Vegetativo</label>
                <input type="date" id="vegetativeStartDate" class="w-full p-2 rounded-md" value="${ciclo ? ciclo.vegetativeStartDate : ''}">
            </div>
            <div id="floweringDateContainer" class="${ciclo && ciclo.phase === 'Floración' ? '' : 'hidden'}">
                <label for="floweringStartDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio Floración (12/12)</label>
                <input type="date" id="floweringStartDate" class="w-full p-2 rounded-md" value="${ciclo ? ciclo.floweringStartDate : ''}">
            </div>
            <div>
                <label for="ciclo-notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                <textarea id="ciclo-notes" rows="3" class="w-full p-2 rounded-md">${ciclo ? ciclo.notes : ''}</textarea>
            </div>
        </div>
    `;
    const modal = getEl('cicloModal');
    modal.innerHTML = createModalHTML('cicloModalContent', title, 'cicloForm', content, ciclo ? 'Guardar Cambios' : 'Crear Ciclo', 'cancelCicloBtn');
    
    getEl('cicloForm').dataset.id = ciclo ? ciclo.id : '';
    modal.style.display = 'flex';
    initializeTooltips();
}

export function openLogModal(ciclo, week, log = null) {
    const title = 'Añadir Registro';
    const content = `
        <div class="space-y-4">
            <div>
                <label for="logType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Registro</label>
                <select id="logType" class="w-full p-2 rounded-md">
                    <option value="Riego">${ciclo.cultivationType === 'Hidroponia' ? 'Control de Solución' : 'Riego'}</option>
                    ${ciclo.cultivationType === 'Hidroponia' ? '<option value="Cambio de Solución">Cambio de Solución</option>' : ''}
                    <option value="Control de Plagas">Control de Plagas</option>
                    <option value="Podas">Podas</option>
                </select>
            </div>
            <div id="log-fields-container"></div>
        </div>
    `;
    const modal = getEl('logModal');
    modal.innerHTML = createModalHTML('logModalContent', title, 'logForm', content, 'Guardar Registro', 'cancelLogBtn');
    
    const form = getEl('logForm');
    form.dataset.cicloId = ciclo.id;
    form.dataset.week = week.weekNumber;
    form.dataset.logId = log ? log.id : '';
    
    const logTypeSelect = getEl('logType');
    const logFieldsContainer = getEl('log-fields-container');

    const toggleLogFields = () => {
        const type = logTypeSelect.value;
        logFieldsContainer.innerHTML = '';

        if (type === 'Riego' || type === 'Cambio de Solución') {
            logFieldsContainer.innerHTML = getRiegoHTML(type, FERTILIZER_LINES);
            const lineSelect = getEl('fert-line-select');
            lineSelect.addEventListener('change', () => renderFertilizerProducts(lineSelect.value));
            renderFertilizerProducts(lineSelect.value);
        } else if (type === 'Control de Plagas') {
            logFieldsContainer.innerHTML = `
                <label for="plagas-notes">Notas / Producto Aplicado</label>
                <textarea id="plagas-notes" rows="3" class="w-full p-2 rounded-md"></textarea>
            `;
        } else if (type === 'Podas') {
             logFieldsContainer.innerHTML = `
                <label for="podaType">Tipo de Poda</label>
                <select id="podaType" class="w-full p-2 rounded-md">
                    <option>LST</option><option>Main-lining</option><option>Supercropping</option><option>Defoliación</option><option>Lollipop</option><option>Clones</option>
                </select>
                <div id="clonesSection" class="mt-2 hidden">
                    <label for="clones-count">Cantidad de Clones</label>
                    <input type="number" id="clones-count" class="w-full p-2 rounded-md">
                </div>
            `;
            getEl('podaType').addEventListener('change', () => getEl('clonesSection').style.display = getEl('podaType').value === 'Clones' ? 'block' : 'none');
        }
    };
    
    logTypeSelect.addEventListener('change', toggleLogFields);
    toggleLogFields();

    modal.style.display = 'flex';
}

function getRiegoHTML(type, lines) {
    const lineOptions = Object.keys(lines).map(line => `<option value="${line}">${line}</option>`).join('');
    const litrosField = type === 'Cambio de Solución' ? `
        <div>
            <label for="log-litros" class="text-gray-700 dark:text-gray-300">Litros Totales</label>
            <input type="number" step="0.1" id="log-litros" class="w-full p-2 rounded-md">
        </div>
    ` : '';
    
    return `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label for="log-ph" class="text-gray-700 dark:text-gray-300">pH</label>
                <input type="number" step="0.1" id="log-ph" class="w-full p-2 rounded-md">
            </div>
            <div>
                <label for="log-ec" class="text-gray-700 dark:text-gray-300">EC</label>
                <input type="number" step="0.1" id="log-ec" class="w-full p-2 rounded-md">
            </div>
            ${litrosField}
        </div>
        <fieldset class="mt-4 border border-gray-300 dark:border-gray-600 p-3 rounded-md">
            <legend class="px-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fertilizantes</legend>
            <div class="space-y-4">
                <div>
                    <label for="fert-line-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Línea de Fertilizantes</label>
                    <select id="fert-line-select" class="w-full p-2 rounded-md">${lineOptions}</select>
                </div>
                <div id="fertilizer-products-container" class="space-y-3"></div>
            </div>
        </fieldset>
    `;
}

function renderFertilizerProducts(lineName) {
    const container = getEl('fertilizer-products-container');
    container.innerHTML = '';
    const products = FERTILIZER_LINES[lineName];
    if (lineName === 'Personalizada') {
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.id = 'add-custom-fert-btn';
        addBtn.textContent = '+ Añadir Producto';
        addBtn.className = 'btn-secondary btn-base py-2 px-3 text-sm rounded-md';
        addBtn.onclick = () => {
            const productRow = document.createElement('div');
            productRow.className = 'grid grid-cols-3 gap-2 custom-fert-row';
            productRow.innerHTML = `
                <input type="text" placeholder="Nombre Producto" class="p-2 rounded-md col-span-1 fert-product-name">
                <input type="number" step="0.1" placeholder="Dosis" class="p-2 rounded-md col-span-1 fert-dose">
                <select class="p-2 rounded-md col-span-1 fert-unit">
                    <option>ml/L</option><option>gr/L</option><option>ml</option><option>gr</option>
                </select>
            `;
            container.insertBefore(productRow, addBtn);
        };
        container.appendChild(addBtn);
    } else {
        products.forEach(productName => {
            const productRow = document.createElement('div');
            productRow.className = 'grid grid-cols-3 gap-2 items-center product-row';
            productRow.innerHTML = `
                <label class="text-gray-700 dark:text-gray-300 col-span-1">${productName}</label>
                <input type="number" step="0.1" placeholder="Dosis" data-product-name="${productName}" class="p-2 rounded-md col-span-1 fert-dose">
                <select class="p-2 rounded-md col-span-1 fert-unit">
                    <option>ml/L</option><option>gr/L</option><option>ml</option><option>gr</option>
                </select>
            `;
            container.appendChild(productRow);
        });
    }
}

export function openMoveCicloModal(ciclo, salas) {
    const title = `Mover Ciclo "${ciclo.name}"`;
    const salaOptions = salas
        .filter(s => s.id !== ciclo.salaId)
        .map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    
    const content = `
        <p class="mb-4 text-gray-700 dark:text-gray-300">Selecciona la sala de destino:</p>
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
        <p class="mb-1 text-gray-700 dark:text-gray-300">Disponibles: ${seed.quantity}</p>
        <label for="germinate-quantity" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad a germinar</label>
        <input type="number" id="germinate-quantity" min="1" max="${seed.quantity}" required class="w-full p-2 rounded-md" value="1">
    `;
    const modal = getEl('germinateSeedModal');
    modal.innerHTML = createModalHTML('germinateSeedModalContent', title, 'germinateSeedForm', content, 'Germinar', 'cancelGerminateBtn');
    
    getEl('germinateSeedForm').dataset.id = seed.id;
    modal.style.display = 'flex';
}

// MODIFICADO: Añadida la lógica del botón de eliminar semana
export function renderCicloDetails(ciclo, handlers) {
    let weeksToRender = [];
    let phaseTitle = '';

    if (ciclo.phase === 'Vegetativo' && ciclo.vegetativeWeeks) {
        weeksToRender = ciclo.vegetativeWeeks;
        phaseTitle = 'Semanas de Vegetativo';
    } else if (ciclo.phase === 'Floración' && ciclo.floweringWeeks) {
        weeksToRender = ciclo.floweringWeeks;
        phaseTitle = 'Semanas de Floración';
    }

    let actionButtonsHTML = '';
    if (ciclo.estado === 'en_secado') {
        actionButtonsHTML = `
            <div class="mt-8 text-center bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
                <h3 class="text-xl font-bold text-amber-400 mb-2">Proceso de Secado en Marcha</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-4">Cuando la cosecha esté seca y lista para enfrascar, haz clic abajo para guardar el resultado final.</p>
                <button id="finalizar-ciclo-btn" class="btn-primary btn-base py-3 px-6 rounded-lg text-lg animate-pulse">
                    Finalizar y Enfrascar Cosecha
                </button>
            </div>
        `;
    } else {
        const lastWeekNumber = weeksToRender.length > 0 ? weeksToRender[weeksToRender.length - 1].weekNumber : 0;
        const weeksHTML = weeksToRender.length > 0 ? `
            <div class="space-y-4">
                ${weeksToRender.sort((a,b) => a.weekNumber - b.weekNumber).map((week, index) => {
                    const phaseInfo = handlers.getPhaseInfo(week.phaseName || ciclo.phase);
                    const isLastWeek = week.weekNumber === lastWeekNumber;
                    
                    const deleteButtonHTML = `
                        <button 
                            data-action="delete-week" 
                            data-ciclo-id="${ciclo.id}" 
                            data-week-number="${week.weekNumber}" 
                            class="btn-base p-1 rounded-md ${isLastWeek ? 'text-gray-400 hover:bg-red-800 hover:text-white' : 'text-gray-700 dark:text-gray-800 cursor-not-allowed'}" 
                            ${!isLastWeek ? 'disabled' : ''} 
                            ${!isLastWeek ? `data-tippy-content="Solo se puede eliminar la última semana"` : ''}
                            title="Eliminar Semana ${week.weekNumber}">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    `;

                    return `
                        <div class="mb-4">
                            <div class="week-header p-3 rounded-t-lg flex justify-between items-center cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
                                <div class="flex items-center gap-2">
                                    ${deleteButtonHTML}
                                    <h4 class="font-bold text-lg text-gray-900 dark:text-white">Semana ${week.weekNumber} 
                                        <span class="text-sm font-normal px-2 py-1 rounded-full ml-2 ${phaseInfo.color}">${phaseInfo.name}</span>
                                    </h4>
                                </div>
                                <button class="btn-primary btn-base text-xs py-1 px-2 rounded-md add-log-for-week-btn" data-week='${JSON.stringify(week)}'>+ Registro</button>
                            </div>
                            <div class="p-4 bg-white dark:bg-[#262626] rounded-b-lg space-y-3" id="logs-week-${week.weekNumber}">
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>` : `<p class="text-center text-gray-500 dark:text-gray-400">No hay semanas definidas.</p>`;
        
        const mainActionButtons = `
            <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button id="add-week-btn" class="btn-secondary btn-base py-2 px-4 rounded-lg w-full sm:w-auto">
                    + Añadir Semana de ${ciclo.phase === 'Floración' ? 'Floración' : 'Vegetativo'}
                </button>
                ${ciclo.phase === 'Floración' ? `
                <button id="iniciar-secado-btn" class="btn-primary btn-base py-2 px-4 rounded-lg font-bold w-full sm:w-auto">
                    🌱 Poner a Secar
                </button>` : ''}
            </div>
        `;

        actionButtonsHTML = `
            <div class="mt-6">
                <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">${phaseTitle}</h3>
                ${weeksHTML}
                ${mainActionButtons}
            </div>`;
    }

    const diffDaysVege = handlers.calculateDaysSince(ciclo.vegetativeStartDate);
    const diffDaysFlora = handlers.calculateDaysSince(ciclo.floweringStartDate);
    let statusText = '';
    if(ciclo.estado === 'en_secado') statusText = `El ciclo está <span class="font-bold text-yellow-400">EN SECADO</span>.`;
    else if(ciclo.phase === 'Vegetativo' && diffDaysVege !== null) statusText = `Día ${diffDaysVege} de vegetativo.`;
    else if(ciclo.phase === 'Floración' && diffDaysFlora !== null) statusText = `Día ${diffDaysFlora} de floración.`;

    const html = `
        <div data-ciclo-id="${ciclo.id}">
            <header class="flex justify-between items-start mb-6">
                <div>
                    <h2 class="text-3xl font-bold text-amber-400 font-mono tracking-wider">${ciclo.name}</h2>
                    <p class="text-gray-500 dark:text-gray-400">${statusText}</p>
                </div>
                <button id="backToCiclosBtn" class="btn-secondary btn-base py-2 px-4 rounded-lg">Volver</button>
            </header>
            <div id="timeline-container" class="my-2"></div>
            <main>
                ${actionButtonsHTML}
            </main>
        </div>
    `;

    setTimeout(() => {
        document.querySelectorAll('.add-log-for-week-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const weekData = JSON.parse(e.target.dataset.week);
                openLogModal(ciclo, weekData);
            });
        });

        // NUEVO: Listener para el botón de eliminar semana.
        document.querySelectorAll('[data-action="delete-week"]').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handlers.handleDeleteLastWeek(e.currentTarget.dataset.cicloId);
                });
            } else {
                // Aseguramos que el tooltip se inicialice para los botones deshabilitados
                tippy(btn, {
                    animation: 'scale-subtle',
                    theme: 'light-border',
                });
            }
        });

        const finalizarBtn = getEl('finalizar-ciclo-btn');
        if (finalizarBtn) {
            finalizarBtn.addEventListener('click', () => handlers.openFinalizarCicloModal(ciclo));
        }
        
        try {
            if (ciclo.phase === 'Floración' && ciclo.estado !== 'en_secado') {
                const timelineContainer = getEl('timeline-container');
                if (timelineContainer) {
                    const diaActual = handlers.calculateDaysSince(ciclo.floweringStartDate);
                    const semanasTotales = weeksToRender.length;
                    
                    if (diaActual !== null && semanasTotales > 0) {
                        const timelineElement = crearTimelinePrincipal(diaActual, semanasTotales);
                        timelineContainer.innerHTML = '';
                        timelineContainer.appendChild(timelineElement);
                    }
                }
            }
        } catch (error) {
            console.error("Error al renderizar la timeline principal:", error);
        }

        initializeTooltips();
    }, 0);
    
    return html;
}

export function renderToolsView() {
    const html = `
        <header class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-amber-400 font-mono tracking-wider">Herramientas</h1>
            <button id="backToPanelBtn" class="btn-secondary btn-base py-2 px-4 rounded-lg">Volver al Panel</button>
        </header>
        <div class="mb-6 border-b border-gray-300 dark:border-gray-700">
            <nav class="flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                <button id="geneticsTabBtn" class="py-4 px-1 border-b-2 font-medium text-lg text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-300 whitespace-nowrap btn-base">Genéticas</button>
                <button id="stockTabBtn" class="py-4 px-1 border-b-2 font-medium text-lg text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-300 whitespace-nowrap btn-base">Stock Clones</button>
                <button id="baulSemillasTabBtn" class="py-4 px-1 border-b-2 font-medium text-lg text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-300 whitespace-nowrap btn-base">Baúl de Semillas</button>
                <button id="historialTabBtn" class="py-4 px-1 border-b-2 font-medium text-lg text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-300 whitespace-nowrap btn-base">Historial</button>
            </nav>
        </div>
        <div class="flex items-center justify-between my-4">
            <input type="search" id="searchTools" placeholder="Buscar..." class="w-full max-w-xs p-2 rounded-md focus:ring-amber-500 focus:border-amber-500">
            <div id="view-mode-toggle" class="flex items-center gap-2">
                <button id="view-mode-card" class="btn-secondary p-2 rounded-md btn-base" title="Vista de tarjetas"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg></button>
                <button id="view-mode-list" class="btn-secondary p-2 rounded-md btn-base" title="Vista de lista"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg></button>
            </div>
        </div>
        <div id="geneticsContent">
            <div id="geneticsListContainer" class="flex flex-col md:flex-row gap-8">
                <div class="w-full md:w-2/5 lg:w-1/3">
                    <form id="geneticsForm" class="card p-6 space-y-4">
                        <h3 id="genetic-form-title" class="text-xl font-bold text-amber-400">Añadir Nueva Genética</h3>
                        <div class="form-field-with-tooltip">
                            <input type="text" id="genetic-name" placeholder="Nombre de la genética" required class="w-full p-2 rounded-md">
                            ${createTooltipIcon("El nombre con el que identificás a esta variedad. Ej: 'Gorilla Glue #4', 'Moby Dick', 'Punto Rojo'.")}
                        </div>
                        <div class="form-field-with-tooltip">
                            <input type="text" id="genetic-parents" placeholder="Padres" class="w-full p-2 rounded-md">
                            ${createTooltipIcon("El cruce que le dio origen. Si no lo sabés, dejalo vacío. Ej: 'Chem's Sister x Sour Dubb'.")}
                        </div>
                        <div class="form-field-with-tooltip">
                            <input type="text" id="genetic-bank" placeholder="Banco" class="w-full p-2 rounded-md">
                            ${createTooltipIcon("El banco de semillas que la comercializa o la creó. Ej: 'DNA Genetics', 'Sweet Seeds', 'BSF'.")}
                        </div>
                        <div class="form-field-with-tooltip">
                            <input type="text" id="genetic-owner" placeholder="Dueño" class="w-full p-2 rounded-md">
                            ${createTooltipIcon("Acá ponés de quién es el 'cut' (el esqueje original). Sirve para saber quién te pasó el clon. Ej: 'esqueje de Growshop X'.")}
                        </div>
                        <div class="form-field-with-tooltip">
                            <input type="number" id="genetic-stock" placeholder="Stock de clones inicial" class="w-full p-2 rounded-md">
                            ${createTooltipIcon("Con cuántos clones o 'madres' de esta genética empezás. Después, el stock se manejará desde la pestaña 'Stock de Clones'.")}
                        </div>
                        <button type="submit" class="btn-primary btn-base w-full py-2 rounded-lg">Guardar Genética</button>
                    </form>
                </div>
                <div id="geneticsList" class="w-full md:w-3/5 lg:w-2/3 space-y-4"></div>
            </div>
        </div>
        <div id="stockContent" class="hidden">
            <div id="stockList" class="space-y-4"></div>
        </div>
        <div id="baulSemillasContent" class="hidden">
            <div id="baulSemillasListContainer" class="flex flex-col md:flex-row gap-8">
                <div class="w-full md:w-2/5 lg:w-1/3">
                    <form id="seedForm" class="card p-6 space-y-4">
                        <h3 class="text-xl font-bold text-amber-400">Añadir Semillas al Baúl</h3>
                        <input type="text" id="seed-name" placeholder="Nombre de la semilla" required class="w-full p-2 rounded-md">
                        <input type="text" id="seed-bank" placeholder="Banco de origen" class="w-full p-2 rounded-md">
                        <input type="number" id="seed-quantity" placeholder="Cantidad" required class="w-full p-2 rounded-md">
                        <button type="submit" class="btn-primary btn-base w-full py-2 rounded-lg">Añadir al Baúl</button>
                    </form>
                </div>
                <div id="baulSemillasList" class="w-full md:w-3/5 lg:w-2/3 space-y-4"></div>
            </div>
        </div>
        <div id="historialContent" class="hidden">
            <div class="flex flex-col md:flex-row gap-8">
                <aside class="w-full md:w-1/4">
                    <div id="historial-filter-panel" class="card p-4">
                        <h3 class="font-bold text-lg mb-4">Filtrar Cosechas</h3>
                        </div>
                </aside>
                <main class="w-full md:w-3/4">
                    <div id="historialGrid" class="space-y-4">
                        </div>
                </main>
            </div>
        </div>
    `;
    setTimeout(() => initializeTooltips(), 0);
    return html;
}

export function renderSettingsView() {
    const html = `
        <header class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-amber-400 font-mono tracking-wider">Ajustes</h1>
            <button id="backToPanelFromSettingsBtn" class="btn-secondary btn-base py-2 px-4 rounded-lg">Volver al Panel</button>
        </header>
        <div class="max-w-2xl mx-auto space-y-8">
            <div class="card p-6">
                <h2 class="text-xl font-bold text-amber-400 mb-4">Apariencia</h2>
                <div class="flex justify-between items-center">
                    <span class="text-gray-700 dark:text-gray-300">Tema de la aplicación</span>
                    <button id="theme-toggle" class="btn-secondary btn-base p-2 rounded-full"></button>
                </div>
            </div>
            <div class="card p-6">
                <h2 class="text-xl font-bold text-amber-400 mb-4">Cambiar Contraseña</h2>
                <form id="changePasswordForm" class="space-y-4">
                    <input type="password" id="newPassword" placeholder="Nueva contraseña" required class="w-full p-2 rounded-md">
                    <input type="password" id="confirmPassword" placeholder="Confirmar nueva contraseña" required class="w-full p-2 rounded-md">
                    <button type="submit" class="btn-primary btn-base py-2 px-4 rounded-lg">Cambiar Contraseña</button>
                </form>
            </div>
            <div class="card p-6 border-red-500 dark:border-red-500">
                <h2 class="text-xl font-bold text-red-500 dark:text-red-400 mb-4">Zona de Peligro</h2>
                <p class="text-gray-500 dark:text-gray-400 mb-4">Esta acción no se puede deshacer. Perderás todos tus datos de cultivo.</p>
                <button id="deleteAccountBtn" class="btn-danger btn-base py-2 px-4 rounded-lg">Eliminar mi Cuenta</button>
            </div>
        </div>
    `;
    setTimeout(() => initializeTooltips(), 0);
    return html;
}

export function createCicloCard(ciclo, handlers) {
    const card = document.createElement('div');
    card.className = 'card rounded-xl p-5 flex flex-col justify-between';
    
    let phaseColor = 'bg-gray-500';
    let phaseText = ciclo.phase;
    if (ciclo.estado === 'en_secado') {
        phaseColor = handlers.getPhaseInfo('en_secado').color;
        phaseText = handlers.getPhaseInfo('en_secado').name;
    } else if (ciclo.phase === 'Floración') {
        phaseColor = 'bg-pink-500';
    } else if (ciclo.phase === 'Vegetativo') {
        phaseColor = 'bg-green-500';
    }

    const typeText = ciclo.cultivationType || 'Sustrato';
    const typeColor = typeText === 'Hidroponia' ? 'bg-blue-500' : 'bg-yellow-600';
    let statusInfo = '';
    let microTimelineHTML = '';

    if (ciclo.estado === 'en_secado') {
        statusInfo = `<p class="text-sm text-yellow-400 font-semibold mt-1">¡Listo para enfrascar!</p>`;
    } else if (ciclo.phase === 'Floración') {
        const diffDays = handlers.calculateDaysSince(ciclo.floweringStartDate);
        if (diffDays !== null && diffDays >= 0) {
            const currentWeek = Math.floor(diffDays / 7) + 1;
            const totalWeeks = ciclo.floweringWeeks ? ciclo.floweringWeeks.length : 0;
            
            if (totalWeeks > 0) {
                 statusInfo = `<p class="text-sm text-gray-500 dark:text-gray-300 mt-1">Día ${diffDays} (Semana ${currentWeek} / ${totalWeeks})</p>`;
                
                const totalDays = totalWeeks * 7;
                const progressPercentage = Math.min(100, (diffDays / totalDays) * 100);
                microTimelineHTML = `
                    <div class="micro-timeline-container">
                        <div class="micro-timeline-progress" style="width: ${progressPercentage}%;"></div>
                    </div>
                `;
            }
        }
    } else if (ciclo.phase === 'Vegetativo') {
        const diffDays = handlers.calculateDaysSince(ciclo.vegetativeStartDate);
        if (diffDays !== null && diffDays >= 0) {
            const currentWeek = Math.floor(diffDays / 7) + 1;
            statusInfo = `<p class="text-sm text-gray-500 dark:text-gray-300 mt-1">Día ${diffDays} (Semana ${currentWeek}) de vegetativo</p>`;
        }
    }
    card.innerHTML = `
        <div>
            <div class="flex justify-between items-start">
                <h3 class="text-xl font-bold text-amber-400">${ciclo.name}</h3>
                <div class="flex flex-col items-end gap-2">
                   <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${phaseColor} text-white">${phaseText}</span>
                   <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${typeColor} text-white">${typeText}</span>
                </div>
            </div>
            ${statusInfo}
            ${microTimelineHTML}
        </div>
        <div class="mt-6 flex flex-wrap justify-end gap-2">
            <button data-action="move-ciclo" class="btn-secondary btn-base p-2 rounded-lg tooltip-trigger" data-tippy-content="Permite mover este ciclo a otra Sala sin afectar sus datos.">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
            </button>
            <button data-action="edit-ciclo" class="btn-secondary btn-base p-2 rounded-lg" title="Editar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
            </button>
            <button data-action="delete-ciclo" class="btn-danger btn-base p-2 rounded-lg" title="Eliminar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </button>
            <button data-action="view-details" class="btn-primary btn-base flex-grow sm:flex-grow-0 font-semibold py-2 px-3 rounded-lg text-sm">Ver Detalles</button>
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
    let details = '';
    let borderColorClass = 'border-amber-500';

    if (log.type === 'Iniciar Secado') {
        borderColorClass = 'border-yellow-400';
        details = `<p class="font-semibold text-yellow-400">🔥 Inicio de Secado</p><p class="text-sm text-gray-500 dark:text-gray-300 mt-1">El ciclo ha sido marcado para secado.</p>`;
    } else if (log.type === 'Riego' || log.type === 'Cambio de Solución') {
        const title = log.type === 'Cambio de Solución' ? 'Cambio de Solución' : (ciclo.cultivationType === 'Hidroponia' ? 'Control de Solución' : 'Riego');
        const color = log.type === 'Cambio de Solución' ? 'text-blue-400' : 'text-amber-400';
        details = `<p class="font-semibold ${color}">${title}</p>
                        <div class="text-sm text-gray-500 dark:text-gray-300 mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                            ${log.litros ? `<span><strong>Litros:</strong> ${log.litros}</span>` : ''}
                            <span><strong>pH:</strong> ${log.ph || 'N/A'}</span>
                            <span><strong>EC:</strong> ${log.ec || 'N/A'}</span>
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-300 mt-2"><strong>Fertilizantes:</strong> ${handlers.formatFertilizers(log.fertilizers)}</div>`;
        borderColorClass = log.type === 'Cambio de Solución' ? 'border-blue-400' : 'border-amber-500';

    } else if (log.type === 'Control de Plagas') {
        borderColorClass = 'border-yellow-400';
        details = `<p class="font-semibold text-yellow-400">Control de Plagas</p>
                         <p class="text-sm text-gray-500 dark:text-gray-300 mt-1 whitespace-pre-wrap">${log.notes || 'Sin notas.'}</p>`;
    } else if (log.type === 'Podas') {
        borderColorClass = 'border-green-400';
        details = `<p class="font-semibold text-green-400">Poda: ${log.podaType || ''}</p>`;
        if(log.clonesCount) details += `<p class="text-sm text-gray-500 dark:text-gray-300">Se sacaron ${log.clonesCount} clones.</p>`;
    }
    entry.className = `log-entry p-3 rounded-md ${borderColorClass}`;

    entry.innerHTML = `
        <div class="flex justify-between items-center">
            <div>
                <span class="text-xs text-gray-400 dark:text-gray-400">${logDate}</span>
            </div>
            <button data-action="delete-log" data-ciclo-id="${ciclo.id}" data-log-id="${log.id}" class="p-1 rounded-md text-gray-500 dark:text-gray-500 hover:bg-red-800 hover:text-white btn-base" title="Eliminar registro">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <div class="mt-2">${details}</div>
    `;
    entry.querySelector('[data-action="delete-log"]').addEventListener('click', (e) => {
        handlers.deleteLog(e.currentTarget.dataset.cicloId, e.currentTarget.dataset.logId);
    });
    return entry;
}

export function renderSalasGrid(salas, ciclos, handlers) {
    const salasGrid = getEl('salasGrid');
    if (!salasGrid) return;
    getEl('loadingSalas').style.display = 'none';
    salasGrid.innerHTML = '';
    if (salas.length === 0) {
        getEl('emptySalasState').style.display = 'block';
        return;
    }
    getEl('emptySalasState').style.display = 'none';

    salas.sort((a, b) => (a.position || 0) - (b.position || 0));

    salas.forEach(sala => {
        const ciclosInSala = ciclos.filter(c => c.salaId === sala.id);
        const activeCiclos = ciclosInSala.filter(c => c.estado !== 'finalizado');
        const salaCard = document.createElement('div');
        salaCard.className = 'card rounded-xl p-5 flex flex-col justify-between aspect-square relative';
        salaCard.dataset.salaId = sala.id;
        
        let ciclosPreviewHTML = '';
        if (activeCiclos.length > 0) {
            const listHTML = activeCiclos.map(c => {
                let phaseClass = 'vege';
                if (c.estado === 'en_secado') {
                    phaseClass = 'secado';
                } else if (c.phase === 'Floración' && c.floweringStartDate && c.floweringWeeks) {
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
            ciclosPreviewHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Sala vacía</p>';
        }

        salaCard.innerHTML = `
            <div class="absolute top-2 right-2">
                <button data-action="quick-add-ciclo" data-sala-id="${sala.id}" class="btn-secondary h-8 w-8 rounded-full flex items-center justify-center btn-base hover:bg-amber-500" title="Añadir Ciclo a ${sala.name}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
            </div>
            <div class="flex-grow flex flex-col cursor-pointer" data-action="open-sala">
                <h3 class="text-2xl font-bold text-amber-400">${sala.name}</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4">${activeCiclos.length} ciclo(s) activo(s)</p>
                <div class="flex-grow relative overflow-y-auto">${ciclosPreviewHTML}</div>
            </div>
            <div class="flex justify-end gap-2 mt-4 flex-wrap">
                <button data-action="edit-sala" class="btn-secondary btn-base p-2 rounded-lg" title="Editar Sala">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                </button>
                <button data-action="delete-sala" class="btn-danger btn-base p-2 rounded-lg" title="Eliminar Sala">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
            </div>
        `;
        salaCard.querySelector('[data-action="open-sala"]').addEventListener('click', (e) => {
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
        salaCard.querySelector('[data-action="quick-add-ciclo"]').addEventListener('click', (e) => {
            e.stopPropagation();
            handlers.openCicloModal(null, null, e.currentTarget.dataset.salaId);
        });
        salasGrid.appendChild(salaCard);
    });
    initializeTooltips();
}

export function renderGeneticsList(genetics, handlers) {
    const geneticsList = getEl('geneticsList');
    if (!geneticsList) return;
    geneticsList.innerHTML = '';
    if (genetics.length === 0) {
        geneticsList.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">No hay genéticas que coincidan con la búsqueda.</p>`;
        return;
    }
    genetics.sort((a, b) => (a.position || 0) - (b.position || 0));
    genetics.forEach(g => {
        const geneticCard = document.createElement('div');
        geneticCard.className = 'card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center';
        geneticCard.dataset.id = g.id;
        geneticCard.innerHTML = `
            <div class="mb-3 sm:mb-0">
                <p class="font-bold text-lg text-amber-400 flex items-center gap-2">${g.favorita ? '⭐' : ''} ${g.name}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">${g.parents || 'Sin padres definidos'} | ${g.bank || 'Sin banco'} | ${g.owner || 'Sin dueño'}</p>
            </div>
            <div class="flex gap-2 flex-wrap">
                <button data-action="edit-genetic" data-id="${g.id}" class="btn-secondary btn-base p-2 rounded-lg" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                </button>
                <button data-action="delete-genetic" data-id="${g.id}" class="btn-danger btn-base p-2 rounded-lg" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
            </div>
        `;
        geneticsList.appendChild(geneticCard);
    });
    geneticsList.querySelectorAll('[data-action="edit-genetic"]').forEach(btn => btn.addEventListener('click', (e) => handlers.editGenetic(e.currentTarget.dataset.id)));
    geneticsList.querySelectorAll('[data-action="delete-genetic"]').forEach(btn => btn.addEventListener('click', (e) => handlers.deleteGenetic(e.currentTarget.dataset.id)));
}

export function renderGeneticsListCompact(genetics, handlers) {
    const geneticsList = getEl('geneticsList');
    if (!geneticsList) return;
    geneticsList.innerHTML = '';
    if (genetics.length === 0) {
        geneticsList.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">No hay genéticas que coincidan con la búsqueda.</p>`;
        return;
    }
    genetics.sort((a, b) => (a.position || 0) - (b.position || 0));
    genetics.forEach(g => {
        const item = document.createElement('div');
        item.className = 'compact-list-item flex justify-between items-center';
        item.dataset.id = g.id;
        item.innerHTML = `
            <div>
                <p class="font-semibold text-amber-400 flex items-center gap-2">${g.favorita ? '⭐' : ''} ${g.name}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${g.bank || 'Sin banco'}</p>
            </div>
            <div class="flex gap-2">
                <button data-action="edit-genetic" data-id="${g.id}" class="btn-secondary btn-base p-2 rounded-lg" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                </button>
                <button data-action="delete-genetic" data-id="${g.id}" class="btn-danger btn-base p-2 rounded-lg" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
            </div>
        `;
        geneticsList.appendChild(item);
    });
    geneticsList.querySelectorAll('[data-action="edit-genetic"]').forEach(btn => btn.addEventListener('click', (e) => handlers.editGenetic(e.currentTarget.dataset.id)));
    geneticsList.querySelectorAll('[data-action="delete-genetic"]').forEach(btn => btn.addEventListener('click', (e) => handlers.deleteGenetic(e.currentTarget.dataset.id)));
}

export function renderStockList(genetics, handlers) {
    const stockList = getEl('stockList');
    if (!stockList) return;
    stockList.innerHTML = '';
    if (genetics.length === 0) {
        stockList.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">Añade genéticas para ver el stock.</p>`;
        return;
    }
    stockList.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    genetics.sort((a, b) => (a.position || 0) - (b.position || 0));
    genetics.forEach(g => {
        const stockCard = document.createElement('div');
        stockCard.className = 'card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center';
        stockCard.dataset.id = g.id;
        stockCard.innerHTML = `
            <div class="mb-3 sm:mb-0">
                <p class="font-bold text-lg text-amber-400">${g.name}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Clones en stock: <span class="font-bold text-xl text-amber-400">${g.cloneStock || 0}</span></p>
            </div>
            <div class="flex items-center gap-2 tooltip-trigger" data-tippy-content="Actualiza manualmente tu stock. También se suma automáticamente cuando registrás una 'Poda de Clones' en un ciclo.">
                <button data-action="update-stock" data-id="${g.id}" data-amount="-1" class="btn-secondary btn-base rounded-full w-10 h-10 flex items-center justify-center text-2xl">-</button>
                <button data-action="update-stock" data-id="${g.id}" data-amount="1" class="btn-secondary btn-base rounded-full w-10 h-10 flex items-center justify-center text-2xl">+</button>
            </div>
        `;
        stockList.appendChild(stockCard);
    });
    stockList.querySelectorAll('[data-action="update-stock"]').forEach(btn => btn.addEventListener('click', (e) => handlers.updateStock(e.currentTarget.dataset.id, parseInt(e.currentTarget.dataset.amount))));
}

export function renderStockListCompact(genetics, handlers) {
    const stockList = getEl('stockList');
    if (!stockList) return;
    stockList.innerHTML = '';
    if (genetics.length === 0) {
        stockList.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">No hay clones en stock.</p>`;
        return;
    }
    stockList.className = 'space-y-4';
    genetics.sort((a, b) => (a.position || 0) - (b.position || 0));
    genetics.forEach(g => {
        const item = document.createElement('div');
        item.className = 'compact-list-item flex justify-between items-center';
        item.dataset.id = g.id;
        item.innerHTML = `
            <div>
                <p class="font-semibold text-amber-400">${g.name}</p>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-bold text-lg text-gray-700 dark:text-gray-300">${g.cloneStock || 0}</span>
                <div class="flex items-center gap-2 tooltip-trigger" data-tippy-content="Actualiza manualmente tu stock. También se suma automáticamente cuando registrás una 'Poda de Clones' en un ciclo.">
                    <button data-action="update-stock" data-id="${g.id}" data-amount="-1" class="btn-secondary btn-base rounded-full w-8 h-8 flex items-center justify-center text-xl">-</button>
                    <button data-action="update-stock" data-id="${g.id}" data-amount="1" class="btn-secondary btn-base rounded-full w-8 h-8 flex items-center justify-center text-xl">+</button>
                </div>
            </div>
        `;
        stockList.appendChild(item);
    });
    stockList.querySelectorAll('[data-action="update-stock"]').forEach(btn => btn.addEventListener('click', (e) => handlers.updateStock(e.currentTarget.dataset.id, parseInt(e.currentTarget.dataset.amount))));
}

export function renderBaulSemillasList(seeds, handlers) {
    const baulSemillasList = getEl('baulSemillasList');
    if (!baulSemillasList) return;
    baulSemillasList.innerHTML = '';
    if (seeds.length === 0) {
        baulSemillasList.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">No hay semillas que coincidan con la búsqueda.</p>`;
        return;
    }
    seeds.sort((a, b) => (a.position || 0) - (b.position || 0));
    seeds.forEach(s => {
        const seedCard = document.createElement('div');
        seedCard.className = 'card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center';
        seedCard.dataset.id = s.id;
        seedCard.innerHTML = `
            <div class="mb-3 sm:mb-0">
                <p class="font-bold text-lg text-amber-400">${s.name}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">${s.bank || 'Banco Desconocido'}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Cantidad: <span class="font-bold text-amber-400">${s.quantity || 0}</span></p>
            </div>
            <div class="flex gap-2 flex-wrap">
                <button data-action="germinate-seed" data-id="${s.id}" class="btn-primary btn-base py-2 px-4 rounded-lg text-sm tooltip-trigger" ${s.quantity > 0 ? '' : 'disabled'} data-tippy-content="Inicia el proceso de germinación. Esto descontará la cantidad seleccionada de tu stock en el baúl.">Germinar</button>
                <button data-action="delete-seed" data-id="${s.id}" class="btn-danger btn-base p-2 rounded-lg" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
            </div>
        `;
        baulSemillasList.appendChild(seedCard);
    });
    baulSemillasList.querySelectorAll('[data-action="germinate-seed"]').forEach(btn => btn.addEventListener('click', (e) => handlers.openGerminateModal(e.currentTarget.dataset.id)));
    baulSemillasList.querySelectorAll('[data-action="delete-seed"]').forEach(btn => btn.addEventListener('click', (e) => handlers.deleteSeed(e.currentTarget.dataset.id)));
}

export function renderBaulSemillasListCompact(seeds, handlers) {
    const baulSemillasList = getEl('baulSemillasList');
    if (!baulSemillasList) return;
    baulSemillasList.innerHTML = '';
    if (seeds.length === 0) {
        baulSemillasList.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">No hay semillas que coincidan con la búsqueda.</p>`;
        return;
    }
    seeds.sort((a, b) => (a.position || 0) - (b.position || 0));
    seeds.forEach(s => {
        const item = document.createElement('div');
        item.className = 'compact-list-item flex justify-between items-center';
        item.dataset.id = s.id;
        item.innerHTML = `
            <div>
                <p class="font-semibold text-amber-400">${s.name} <span class="text-sm font-normal text-gray-500 dark:text-gray-400">(${s.quantity})</span></p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${s.bank || 'Banco Desconocido'}</p>
            </div>
            <div class="flex gap-2">
                <button data-action="germinate-seed" data-id="${s.id}" class="btn-primary btn-base p-2 rounded-lg text-sm tooltip-trigger" ${s.quantity > 0 ? '' : 'disabled'} data-tippy-content="Inicia el proceso de germinación. Esto descontará la cantidad seleccionada de tu stock en el baúl.">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" /></svg>
                </button>
                <button data-action="delete-seed" data-id="${s.id}" class="btn-danger btn-base p-2 rounded-lg" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
            </div>
        `;
        baulSemillasList.appendChild(item);
    });
    baulSemillasList.querySelectorAll('[data-action="germinate-seed"]').forEach(btn => btn.addEventListener('click', (e) => handlers.openGerminateModal(e.currentTarget.dataset.id)));
    baulSemillasList.querySelectorAll('[data-action="delete-seed"]').forEach(btn => btn.addEventListener('click', (e) => handlers.deleteSeed(e.currentTarget.dataset.id)));
}

export function renderHistorialView(historial, handlers) {
    const grid = getEl('historialGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (historial.length === 0) {
        grid.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400 col-span-full">No hay cosechas en tu historial. ¡Finaliza un ciclo para empezar!</p>`;
        return;
    }

    historial.sort((a,b) => b.fechaFinalizacion.toDate() - a.fechaFinalizacion.toDate());
    historial.forEach(ciclo => {
        grid.appendChild(createHistorialCard(ciclo, handlers));
    });
    initializeTooltips();
}

function createHistorialCard(ciclo, handlers) {
    const card = document.createElement('div');
    card.className = 'card p-4 rounded-lg';

    const fechaFin = ciclo.fechaFinalizacion ? ciclo.fechaFinalizacion.toDate().toLocaleDateString('es-AR') : 'N/A';
    const allTags = [...(ciclo.etiquetasGlobales || []), ...(ciclo.etiquetasCustom || [])];
    const tagsHTML = allTags.map(tag => {
        const isCustom = ciclo.etiquetasCustom && ciclo.etiquetasCustom.includes(tag);
        return `<span class="tag ${isCustom ? 'tag-custom' : 'tag-standard'}">${tag}</span>`;
    }).join('');
    
    const geneticsList = ciclo.genetics ? ciclo.genetics.map(g => `<li>${g.name}</li>`).join('') : '<li>No especificadas</li>';

    card.innerHTML = `
        <div class="flex justify-between items-start">
            <h3 class="text-xl font-bold text-amber-400">${ciclo.name}</h3>
            <div class="flex items-center gap-2">
                <span class="text-lg font-mono text-gray-700 dark:text-gray-200 cursor-pointer tooltip-trigger-click" data-tippy-content="<ul class='list-disc list-inside text-left'>${geneticsList}</ul>">🧬</span>
            </div>
        </div>
        <hr class="border-gray-200 dark:border-gray-700 my-2">
        <div class="flex justify-between items-center text-gray-600 dark:text-gray-300 font-mono text-lg my-3">
            <span class="tooltip-trigger" data-tippy-content="Peso en seco">⚖️ ${ciclo.pesoSeco || 0}g</span>
            <span class="tooltip-trigger" data-tippy-content="Días de floración">🌸 ${ciclo.diasDeFlora || 0}d</span>
            <span class="tooltip-trigger" data-tippy-content="Días de secado">⏳ ${ciclo.diasDeSecado || 0}d</span>
            <span class="tooltip-trigger" data-tippy-content="Fecha de cosecha">🗓️ ${fechaFin}</span>
        </div>
        <div class="flex flex-wrap gap-2 mt-2">
            ${tagsHTML || '<p class="text-xs text-gray-400 italic">Sin etiquetas.</p>'}
        </div>
    `;
    
    return card;
}

export function openFinalizarCicloModal(ciclo, predefinedTags, maxCustomTags, allGenetics) {
    const modal = getEl('finalizarCicloModal');
    const form = getEl('finalizarCicloForm');
    form.dataset.cicloId = ciclo.id;

    const globalTagsContainer = getEl('global-tags-container');
    globalTagsContainer.innerHTML = '';
    Object.entries(predefinedTags).forEach(([category, tags]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'mb-2';
        categoryDiv.innerHTML = `<h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">${category}</h4>`;
        const tagsWrapper = document.createElement('div');
        tagsWrapper.className = 'flex flex-wrap gap-2';
        tags.forEach(tag => {
            const tagEl = document.createElement('button');
            tagEl.type = 'button';
            tagEl.className = 'tag tag-standard';
            tagEl.textContent = tag;
            tagEl.onclick = () => tagEl.classList.toggle('active');
            tagsWrapper.appendChild(tagEl);
        });
        categoryDiv.appendChild(tagsWrapper);
        globalTagsContainer.appendChild(categoryDiv);
    });

    const customTagsContainer = getEl('custom-tags-container');
    const customTagInput = getEl('custom-tag-input');
    const addCustomTagBtn = getEl('add-custom-tag-btn');
    customTagsContainer.innerHTML = '';

    const addCustomTag = () => {
        if (customTagsContainer.children.length >= maxCustomTags) {
            showNotification(`Puedes añadir un máximo de ${maxCustomTags} etiquetas personalizadas.`, 'error');
            return;
        }
        const value = customTagInput.value.trim();
        if (value) {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag tag-custom flex items-center gap-1';
            tagEl.textContent = value;
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.innerHTML = '&times;';
            removeBtn.className = 'font-bold';
            removeBtn.onclick = () => tagEl.remove();
            tagEl.appendChild(removeBtn);
            customTagsContainer.appendChild(tagEl);
            customTagInput.value = '';
        }
    };
    addCustomTagBtn.onclick = addCustomTag;
    customTagInput.onkeydown = (e) => { if(e.key === 'Enter') { e.preventDefault(); addCustomTag(); }};

    const geneticasContainer = getEl('geneticas-feedback-container');
    geneticasContainer.innerHTML = '';
    if (ciclo.genetics && ciclo.genetics.length > 0) {
        ciclo.genetics.forEach(g => {
            const geneticInfo = allGenetics.find(ag => ag.id === g.id);
            const row = document.createElement('div');
            row.className = 'genetic-feedback-row p-3 rounded-md bg-gray-100 dark:bg-gray-800';
            row.dataset.id = g.id;
            row.dataset.name = g.name;
            row.innerHTML = `
                <p class="font-bold text-lg text-amber-400">${g.name}</p>
                <div class="flex items-center justify-between mt-2">
                    <div class="flex gap-4 text-sm">
                        <label class="flex items-center gap-1"><input type="radio" name="decision-${g.id}" value="repetir"> 👍 Repetir</label>
                        <label class="flex items-center gap-1"><input type="radio" name="decision-${g.id}" value="no-repetir"> 👎 No Repetir</label>
                    </div>
                    <label class="flex items-center gap-2 text-lg cursor-pointer">
                        <input type="checkbox" class="favorite-checkbox h-5 w-5 rounded text-amber-500 focus:ring-amber-500" ${geneticInfo && geneticInfo.favorita ? 'checked' : ''}> ⭐ Favorita
                    </label>
                </div>
            `;
            geneticasContainer.appendChild(row);
        });
    } else {
        geneticasContainer.innerHTML = '<p class="italic text-gray-500">No se especificaron genéticas para este ciclo.</p>';
    }

    modal.style.display = 'flex';
}

export function initializeEventListeners(handlers) {
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
    
    const menuAddSalaLink = getEl('menuAddSala');
    menuAddSalaLink.innerHTML = "Añadir Sala " + createTooltipIcon("Una Sala es tu espacio físico de cultivo, como una carpa o un indoor. Dentro de las salas organizarás tus Ciclos.");
    menuAddSalaLink.addEventListener('click', (e) => { e.preventDefault(); handlers.openSalaModal(); getEl('dropdownMenu').classList.add('hidden'); });
    
    getEl('menuAddCiclo').addEventListener('click', (e) => { e.preventDefault(); handlers.openCicloModal(); getEl('dropdownMenu').classList.add('hidden'); });
    getEl('menuTools').addEventListener('click', (e) => { e.preventDefault(); handlers.showToolsView(); getEl('dropdownMenu').classList.add('hidden'); });
    getEl('menuSettings').addEventListener('click', (e) => { e.preventDefault(); handlers.showSettingsView(); getEl('dropdownMenu').classList.add('hidden'); });
    
    getEl('backToSalasBtn').addEventListener('click', handlers.hideCiclosView);

    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#cancelSalaBtn')) getEl('salaModal').style.display = 'none';
        if (e.target.closest('#cancelCicloBtn')) getEl('cicloModal').style.display = 'none';
        if (e.target.closest('#cancelLogBtn')) getEl('logModal').style.display = 'none';
        if (e.target.closest('#cancelMoveCicloBtn')) getEl('moveCicloModal').style.display = 'none';
        if (e.target.closest('#cancelGerminateBtn')) getEl('germinateSeedModal').style.display = 'none';
        if (e.target.closest('#closeAboutBtn')) getEl('aboutModal').style.display = 'none';
        if (e.target.closest('#cancelActionBtn')) handlers.hideConfirmationModal();
        if (e.target.closest('#confirmActionBtn')) {
            if (handlers.getConfirmCallback()) handlers.getConfirmCallback()();
            handlers.hideConfirmationModal();
        }
        if (e.target.closest('#cancelFinalizarBtn')) getEl('finalizarCicloModal').style.display = 'none';
    });

    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'salaForm') handlers.handleSalaFormSubmit(e);
        if (e.target.id === 'cicloForm') handlers.handleCicloFormSubmit(e);
        if (e.target.id === 'logForm') handlers.handleLogFormSubmit(e);
        if (e.target.id === 'moveCicloForm') handlers.handleMoveCicloSubmit(e);
        if (e.target.id === 'germinateSeedForm') handlers.handleGerminateFormSubmit(e);
        if (e.target.id === 'seedForm') handlers.handleSeedFormSubmit(e);
        if (e.target.id === 'finalizarCicloForm') handlers.handleFinalizarCicloFormSubmit(e);
    });
    
    initializeTooltips();
}