/**
 * Repositorios de datos (patrón Strategy). Ambos exponen la misma interfaz:
 *
 *   misReportes(estado) · zona(filters) · resumen(filters) · trabajadores()
 *   misTareas(estado) · crearReporte(dto) · asignar(reporte, workerId, description)
 *   completar(tarea, evidence) · calificar(reporte, rating, comment)
 *   subir(file, kind) · exportPdf(filters)
 *
 * El router elige uno al iniciar sesión; las vistas no saben si están en demo.
 */
import { NEWEST_FIRST, PAGE_SIZE } from "../config.js";
import { decodeJwt, pageContent, qs } from "../utils.js";
import { DEMO_CITIZEN, DEMO_ZONE } from "./demo.js";

/** Operación que solo existe con el servidor real. */
export class UnsupportedInDemoError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnsupportedInDemoError";
  }
}

const matchesStatus = (estado) => (item) => !estado || item.status === estado;
const matchesFilters = ({ estados = [], tipos = [] } = {}) => (r) =>
  (!estados.length || estados.includes(r.status)) && (!tipos.length || tipos.includes(r.type));

/** Repositorio contra el backend real. */
export function createRemoteRepo(http, session) {
  const list = async (path, params) => pageContent(await http.request(path + qs(params)));
  const citizenId = () => String(session.uid ?? decodeJwt(session.token).id);

  return {
    misReportes: (estado) => list("/api/v1/reportes/me", { estado, size: PAGE_SIZE, sort: NEWEST_FIRST }),
    zona: (filters) => list("/api/v1/reportes/supervisor/me", { ...filters, size: PAGE_SIZE, sort: NEWEST_FIRST }),
    resumen: (filters) => http.request("/api/v1/reportes/supervisor/summary" + qs(filters)),
    trabajadores: () => http.request("/api/v1/trabajadores"),
    misTareas: (estado) => list("/api/v1/tareas/me", { estado, size: PAGE_SIZE }),

    crearReporte: (dto) =>
      http.request("/api/v1/reporte", { method: "POST", body: { ...dto, citizenId: citizenId() } }),

    asignar: (reporte, workerId, description) =>
      http.request("/api/v1/tarea", {
        method: "POST",
        // Sin `status` el backend deja el reporte en PENDIENTE tras asignarlo.
        body: { reportId: reporte.id, workerId: Number(workerId), description, type: reporte.type, location: reporte.location, status: "EN_PROGRESO" },
      }),

    completar: (tarea, evidence) =>
      http.request(`/api/v1/tarea/${tarea.id}/completar`, {
        method: "PATCH",
        body: { notes: "", evidences: [].concat(evidence) },
      }),

    calificar: (reporte, rating, comment) =>
      http.request(`/api/v1/reporte/${reporte.id}/rate`, { method: "PATCH", body: { rating, comment } }),

    subir: (file, kind) => http.upload(`/api/v1/${kind}/cargar`, file),

    exportPdf: (filters) => http.download("/api/v1/reportes/supervisor/export/pdf" + qs(filters)),
  };
}

/** Repositorio en memoria para el modo demo. Muta el `store` recibido. */
export function createDemoRepo(store, { now = Date.now, createObjectURL = (f) => URL.createObjectURL(f) } = {}) {
  return {
    async misReportes(estado) {
      return store.reportes.filter((r) => r.citizenName === DEMO_CITIZEN).filter(matchesStatus(estado));
    },
    async zona(filters) {
      return store.reportes.filter(matchesFilters(filters));
    },
    async resumen() {
      const all = store.reportes;
      const byType = {};
      for (const r of all) byType[r.type] = (byType[r.type] || 0) + 1;
      return {
        total: all.length,
        pending: all.filter((r) => r.status === "PENDIENTE").length,
        resolved: all.filter((r) => r.status === "RESUELTO").length,
        byType,
      };
    },
    async trabajadores() {
      return store.trabajadores;
    },
    async misTareas(estado) {
      return store.tareas.filter(matchesStatus(estado));
    },
    async crearReporte(dto) {
      store.reportes.unshift({
        ...dto,
        id: store.nextReportId(),
        status: "PENDIENTE",
        citizenName: DEMO_CITIZEN,
        zone: DEMO_ZONE,
        createdAt: now(),
      });
    },
    async asignar(reporte, workerId) {
      const worker = store.trabajadores.find((w) => w.id === Number(workerId));
      if (!worker) throw new Error("Trabajador no encontrado");
      reporte.status = "EN_PROGRESO";
      reporte.assignedTo = `${worker.name} ${worker.lastname}`;
    },
    async completar(tarea) {
      tarea.status = "RESUELTO";
      tarea.completedAt = now();
    },
    async calificar(reporte, rating) {
      reporte.rating = rating;
    },
    async subir(file) {
      return createObjectURL(file);
    },
    async exportPdf() {
      throw new UnsupportedInDemoError("La exportación PDF requiere el servidor real");
    },
  };
}
