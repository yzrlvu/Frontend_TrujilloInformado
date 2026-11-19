/** Cliente HTTP mínimo para el backend: JSON, multipart y descargas. */

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Extrae el mensaje de error del cuerpo (JSON `{message}` o texto plano). */
async function toApiError(response) {
  const text = await response.text();
  let message = text;
  try {
    message = JSON.parse(text).message || text;
  } catch {
    /* cuerpo no JSON: se usa el texto tal cual */
  }
  return new ApiError(message || `Error ${response.status}`, response.status);
}

/**
 * @param {object} deps
 * @param {() => string} deps.baseUrl   URL base sin "/" final.
 * @param {() => string|null} deps.getToken  JWT actual, si hay sesión.
 * @param {typeof fetch} [deps.fetch]  Inyectable para pruebas.
 */
export function createHttp({ baseUrl, getToken, fetch: fetchImpl = (...args) => globalThis.fetch(...args) }) {
  const authHeader = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function send(path, init) {
    const response = await fetchImpl(baseUrl() + path, init);
    if (!response.ok) throw await toApiError(response);
    return response;
  }

  /** Petición JSON. `body` se serializa automáticamente. */
  async function request(path, { method = "GET", body, headers } = {}) {
    const response = await send(path, {
      method,
      headers: { "Content-Type": "application/json", ...authHeader(), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("json") ? response.json() : response.text();
  }

  /** Sube un archivo como multipart (`file`) y devuelve el texto de la respuesta (la URL). */
  async function upload(path, file) {
    const form = new FormData();
    form.append("file", file);
    const response = await send(path, { method: "POST", headers: authHeader(), body: form });
    return response.text();
  }

  /** Descarga un binario (p. ej. PDF). */
  async function download(path) {
    const response = await send(path, { headers: authHeader() });
    return response.blob();
  }

  return { request, upload, download };
}
