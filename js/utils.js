/** Funciones puras sin dependencias del DOM. */

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapa texto para insertarlo de forma segura en HTML. */
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

/** Fecha corta en español de Perú ("19 nov."), o "—" si no hay fecha. */
export const fmtDate = (date) =>
  date ? new Date(date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }) : "—";

/**
 * Construye un query string. Los arrays se repiten como `k=a&k=b`;
 * se omiten los valores vacíos, null y undefined.
 */
export function qs(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const v of [].concat(value)) {
      if (v !== "" && v != null) search.append(key, v);
    }
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

/** Normaliza una respuesta de listado: array plano o página de Spring (`{content}`). */
export const pageContent = (response) => (Array.isArray(response) ? response : response?.content || []);

/** Decodifica el payload de un JWT (sin verificar la firma). Devuelve `{}` si no es válido. */
export function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return {};
  }
}

/** "SUPERVISOR" → "Supervisor" */
export const capitalize = (s) => s.charAt(0) + s.slice(1).toLowerCase();

/** Elige singular o plural según la cantidad. */
export const plural = (n, singular, pluralForm) => (n === 1 ? singular : pluralForm);
