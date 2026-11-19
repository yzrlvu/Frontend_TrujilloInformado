/** Estado de la sesión y su persistencia en el navegador. */
import { API_DEFAULT, DEFAULT_ROLE, NAV, STORAGE_KEYS } from "./config.js";

/** Estado mutable de la sesión actual (única fuente de verdad). */
export const session = {
  token: null,
  role: null,
  demo: false,
  name: "",
  uid: null,
  view: null,
  filters: { estados: [], tipos: [] },
};

/** Campos que se guardan para restaurar la sesión al recargar. */
const PERSISTED = ["token", "role", "demo", "name", "uid"];

/** "ROLE_supervisor" → "SUPERVISOR"; los roles desconocidos caen en CIUDADANO. */
export function normalizeRole(role) {
  const r = String(role ?? "").replace("ROLE_", "").toUpperCase();
  return NAV[r] ? r : DEFAULT_ROLE;
}

export function saveSession(s, storage = sessionStorage) {
  const data = Object.fromEntries(PERSISTED.map((k) => [k, s[k]]));
  storage.setItem(STORAGE_KEYS.session, JSON.stringify(data));
}

/** Sesión guardada, o null si no hay una válida (con token o en modo demo). */
export function loadSession(storage = sessionStorage) {
  try {
    const s = JSON.parse(storage.getItem(STORAGE_KEYS.session));
    return s && (s.token || s.demo) ? s : null;
  } catch {
    return null;
  }
}

export function clearSession(storage = sessionStorage) {
  storage.removeItem(STORAGE_KEYS.session);
}

/** URL base de la API sin "/" final. */
export function getApiBase(storage = localStorage) {
  return (storage.getItem(STORAGE_KEYS.apiBase) || API_DEFAULT).replace(/\/$/, "");
}

/** Valor configurado por el usuario (vacío si usa el predeterminado). */
export const getCustomApiBase = (storage = localStorage) => storage.getItem(STORAGE_KEYS.apiBase) || "";

export function setApiBase(url, storage = localStorage) {
  storage.setItem(STORAGE_KEYS.apiBase, url);
}
