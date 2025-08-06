/**
 * Crea y devuelve un elemento DOM que representa una barra de progreso segmentada.
 * @param {number} diaActual - El día actual del ciclo para calcular el progreso.
 * @param {number} semanasTotales - El número total de semanas que tendrá la barra.
 * @returns {HTMLElement} El elemento div del contenedor de la timeline.
 */
function crearTimelinePrincipal(diaActual, semanasTotales) {
    // Crear el contenedor principal de la timeline
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline-principal';

    // Validar para evitar bucles infinitos o errores si los datos no son correctos
    if (typeof semanasTotales !== 'number' || semanasTotales <= 0) {
        // Devuelve un contenedor vacío si no hay semanas que mostrar
        return timelineContainer;
    }

    // Calcular en qué semana estamos
    const semanaActual = Math.floor(diaActual / 7);

    // Crear un segmento por cada semana total
    for (let i = 0; i < semanasTotales; i++) {
        const segment = document.createElement('div');
        segment.className = 'timeline-segment';

        // Si el índice del bucle es menor que la semana actual, ese segmento está "activo"
        if (i < semanaActual) {
            segment.classList.add('active');
        }

        timelineContainer.appendChild(segment);
    }

    return timelineContainer;
}

// Hacemos la función exportable por si estás usando módulos ES6 en tu proyecto.
// Si no, no afectará su funcionamiento si la incluís con <script>.
export { crearTimelinePrincipal };