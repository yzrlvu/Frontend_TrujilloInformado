/** Íconos SVG en línea (trazo de 24x24, color heredado). */

export const svg = (paths, fill = false) =>
  `<svg viewBox="0 0 24 24" fill="${fill ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const TYPE_PATHS = {
  RESIDUOS_SOLIDOS: '<path d="M6.5 9.5h11l-1.2 10a1.6 1.6 0 0 1-1.6 1.4H9.3a1.6 1.6 0 0 1-1.6-1.4z"/><path d="M9 9.5c.3-2.4 1.4-3.8 3-4.6 1.6.8 2.7 2.2 3 4.6"/><path d="M10 3.5l2 1.4 2-1.4"/><path d="M10 13.5v4M14 13.5v4"/>',
  MALEZA: '<path d="M5 20c-.6-8.4 4.4-14.2 14.5-15-.2 9.6-5.4 14.6-14.5 15z"/><path d="M5 20 14 10.5"/><path d="M9.6 15.2H13M11.8 13V9.8"/>',
  BARRIDO: '<path d="M19 3.5 12.6 11"/><path d="M10.4 9.6l4.4 3.6-2.6 7.4c-3-.6-6-2.9-7.7-5.6z"/><path d="M7.6 17.4l2.6-2.5M10.2 19.5l2-3"/>',
};
const FALLBACK_PATH = '<circle cx="12" cy="12" r="7"/>';

/** Ícono del tipo de incidencia (círculo genérico si el tipo es desconocido). */
export const typeIcon = (type) => svg(TYPE_PATHS[type] || FALLBACK_PATH);

export const ICON_PIN = svg('<path d="M12 21s-6.5-5.7-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 15.3 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/>');
export const ICON_CLOSE = svg('<path d="M6 6l12 12M18 6 6 18"/>');
export const ICON_STAR = svg('<path d="M12 3.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.5l-5.1 2.8L8 13.6l-4.3-4 5.8-.7z"/>', true);
