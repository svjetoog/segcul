// js/onboarding.js

/**
 * Configura e inicializa el tour principal de bienvenida para nuevos usuarios.
 */
export function startMainTour() {
    if (localStorage.getItem('onboarding_main_complete')) {
        return; 
    }

    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shepherd-theme-dark', 
            scrollTo: { behavior: 'smooth', block: 'center' },
            cancelIcon: {
                enabled: true
            },
            buttons: [
                {
                    action() { return this.back(); },
                    classes: 'shepherd-button-secondary',
                    text: 'Atrás',
                },
                {
                    action() { return this.next(); },
                    text: 'Siguiente',
                },
            ],
        },
    });

    tour.addStep({
        id: 'step-1-welcome',
        title: '¡Bienvenido a SegCul!',
        text: 'Todo empieza aquí, en las <strong>Salas</strong>, que son tus espacios de cultivo (carpas, indoors, etc.). Hacé click en una para ver sus ciclos.',
        attachTo: { element: '#salasGrid .card:first-child', on: 'bottom' },
        buttons: [{ action() { return this.next(); }, text: 'Entendido' }],
    });

    tour.addStep({
        id: 'step-2-menu',
        title: 'Menú Principal',
        text: 'Desde este menú podés <strong>añadir nuevas Salas o Ciclos</strong>, y acceder a las Herramientas.',
        attachTo: { element: '#menuBtn', on: 'bottom' },
    });
    
    tour.addStep({
        id: 'step-3-tools',
        title: 'Herramientas',
        text: 'Cuando estés listo, explorá las Herramientas para gestionar tu stock de <strong>genéticas, clones y semillas</strong>.',
        attachTo: { element: '#menuTools', on: 'bottom' },
        beforeShowPromise: function() {
            return new Promise(function(resolve) {
                document.getElementById('dropdownMenu').classList.remove('hidden');
                resolve();
            });
        },
        buttons: [
            { action() { return this.back(); }, classes: 'shepherd-button-secondary', text: 'Atrás' },
            { action() { return this.complete(); }, text: '¡Listo! A cultivar' },
        ],
    });

    const markTourAsComplete = () => {
        localStorage.setItem('onboarding_main_complete', 'true');
        const dropdown = document.getElementById('dropdownMenu');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    };
    tour.on('complete', markTourAsComplete);
    tour.on('cancel', markTourAsComplete);

    const firstStepElement = document.querySelector('#salasGrid .card:first-child');
    if (firstStepElement) {
        tour.start();
    }
}


// ======================================================
// TOUR PARA LA PANTALLA DE HERRAMIENTAS
// ======================================================

/**
 * Configura e inicializa el tour para la sección de Herramientas.
 */
export function startToolsTour() {
    if (localStorage.getItem('onboarding_tools_complete')) {
        return;
    }

    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            // ✨ CORRECCIÓN FINAL Y VERIFICADA: Usamos la misma clase que el tour principal.
            classes: 'shepherd-theme-dark',
            scrollTo: { behavior: 'smooth', block: 'center' },
            cancelIcon: {
                enabled: true
            },
            buttons: [
                {
                    action() { return this.back(); },
                    classes: 'shepherd-button-secondary',
                    text: 'Atrás',
                },
                {
                    action() { return this.next(); },
                    text: 'Siguiente',
                },
            ],
        },
    });

    tour.addStep({
        id: 'tools-step-1-tabs',
        title: 'Tres Herramientas en Una',
        text: 'Aquí gestionás todo tu inventario. Podés cambiar entre <strong>Genéticas, Stock de Clones y Baúl de Semillas</strong> usando estas pestañas.',
        attachTo: {
            element: 'nav[aria-label="Tabs"]',
            on: 'bottom',
        },
        buttons: [{ action() { return this.next(); }, text: 'OK' }],
    });

    tour.addStep({
        id: 'tools-step-2-form',
        title: 'Añadir Nuevos Ítems',
        text: 'El formulario de la izquierda te permite añadir nuevos elementos a la lista que estés viendo (una nueva genética, un nuevo pack de semillas, etc.).',
        attachTo: {
            element: '#geneticsForm',
            on: 'right',
        },
    });

    tour.addStep({
        id: 'tools-step-3-view',
        title: 'Cambiar la Vista',
        text: 'Con estos botones podés alternar entre una vista de <strong>tarjetas con detalles</strong> o una <strong>lista más compacta</strong>.',
        attachTo: {
            element: '#view-mode-toggle',
            on: 'bottom',
        },
    });

    tour.addStep({
        id: 'tools-step-4-drag',
        title: '¡Interacción Clave!',
        text: 'Un dato importante: <strong>podés arrastrar y soltar los elementos de la lista</strong> para ordenarlos a tu gusto. Tu orden se guarda automáticamente.',
        attachTo: {
            element: '#geneticsList',
            on: 'top',
        },
        buttons: [
            { action() { return this.back(); }, classes: 'shepherd-button-secondary', text: 'Atrás' },
            { action() { return this.complete(); }, text: 'Entendido' },
        ],
    });

    const markTourAsComplete = () => {
        localStorage.setItem('onboarding_tools_complete', 'true');
    };
    tour.on('complete', markTourAsComplete);
    tour.on('cancel', markTourAsComplete);

    tour.start();
}