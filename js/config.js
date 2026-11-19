/** Configuración y constantes compartidas por toda la aplicación. */

/** URL del backend desplegado; se puede sobrescribir desde "Servidor API" en el login. */
export const API_DEFAULT = "https://trujillo-informado-backend-3b3a9e8b54ac.herokuapp.com";

export const STORAGE_KEYS = Object.freeze({
  session: "ti_s",
  apiBase: "ti_api",
});

export const PAGE_SIZE = 50;
export const NEWEST_FIRST = "createdAt,desc";

/* Enumeraciones del backend → etiquetas visibles */
export const TYPES = Object.freeze({ RESIDUOS_SOLIDOS: "Residuos sólidos", MALEZA: "Maleza", BARRIDO: "Barrido" });
export const STATUS = Object.freeze({ PENDIENTE: "Pendiente", EN_PROGRESO: "En progreso", RESUELTO: "Resuelto" });
export const PRIORITY = Object.freeze({ BAJA: "Baja", MEDIA: "Media", ALTA: "Alta" });

export const ROLES = Object.freeze({ CIUDADANO: "CIUDADANO", SUPERVISOR: "SUPERVISOR", TRABAJADOR: "TRABAJADOR" });
export const DEFAULT_ROLE = ROLES.CIUDADANO;

/** Navegación por rol: [clave de vista, etiqueta]. La primera es la vista inicial. */
export const NAV = Object.freeze({
  [ROLES.CIUDADANO]: [["mis", "Mis reportes"], ["nuevo", "Nuevo reporte"]],
  [ROLES.SUPERVISOR]: [["panel", "Panel"], ["reportes", "Reportes de zona"]],
  [ROLES.TRABAJADOR]: [["tareas", "Mis tareas"]],
});

/** Usuario ficticio de cada rol en modo demo. */
export const DEMO_USERS = Object.freeze({
  [ROLES.CIUDADANO]: "Lucía Ramos",
  [ROLES.SUPERVISOR]: "Rosa Medina",
  [ROLES.TRABAJADOR]: "Carlos Vega",
});

export const MAP = Object.freeze({
  center: [-8.1116, -79.0288],
  zoom: 14,
  pickZoom: 17,
  tiles: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap",
  reverseGeocodeUrl: "https://nominatim.openstreetmap.org/reverse",
});

export const TOAST_MS = 2400;
