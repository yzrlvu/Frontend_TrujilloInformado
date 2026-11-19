/** Datos de ejemplo para el modo demo (sin backend). */
import { DEMO_USERS, ROLES } from "../config.js";

const DAY = 864e5;

export const DEMO_CITIZEN = DEMO_USERS[ROLES.CIUDADANO];
export const DEMO_ZONE = "Centro Histórico";

/**
 * Crea un almacén nuevo en memoria. Cada llamada devuelve copias independientes,
 * así las pruebas no comparten estado.
 * @param {number} now  Marca de tiempo de referencia.
 */
export function createDemoStore(now = Date.now()) {
  const reportes = [
    { id: 101, type: "RESIDUOS_SOLIDOS", description: "Acumulación de basura en la esquina del parque", location: { lat: -8.11, lng: -79.03, address: "Av. España 1234" }, zone: "Centro Histórico", status: "PENDIENTE", priority: "ALTA", citizenName: "Lucía Ramos", createdAt: now - DAY },
    { id: 102, type: "MALEZA", description: "Maleza crecida bloquea la vereda", location: { address: "Calle Los Pinos 456" }, zone: "El Recreo", status: "EN_PROGRESO", priority: "MEDIA", citizenName: "Jorge Díaz", assignedTo: "Carlos Vega", createdAt: now - 3 * DAY },
    { id: 103, type: "BARRIDO", description: "Arena y hojas en la ciclovía", location: { address: "Av. Larco 890" }, zone: "Buenos Aires", status: "RESUELTO", priority: "BAJA", citizenName: "Ana Torres", rating: 5, createdAt: now - 6 * DAY, completedAt: now - 4 * DAY },
    { id: 104, type: "RESIDUOS_SOLIDOS", description: "Desmonte abandonado frente al colegio", location: { address: "Jr. Pizarro 210" }, zone: "Centro Histórico", status: "PENDIENTE", priority: "MEDIA", citizenName: "Lucía Ramos", createdAt: now - 2 * DAY },
    { id: 105, type: "MALEZA", description: "Berma central sin mantenimiento", location: { address: "Av. América Sur" }, zone: "La Noria", status: "RESUELTO", priority: "BAJA", citizenName: "Pedro Ruiz", createdAt: now - 9 * DAY, completedAt: now - 7 * DAY },
  ];
  const trabajadores = [
    { id: 1, name: "Carlos", lastname: "Vega" },
    { id: 2, name: "María", lastname: "Quispe" },
    { id: 3, name: "Luis", lastname: "Castro" },
  ];
  const tareas = [
    { id: 501, reportId: 102, type: "MALEZA", description: "Cortar maleza y limpiar vereda", location: { address: "Calle Los Pinos 456" }, status: "EN_PROGRESO", assignedAt: now - 2 * DAY },
    { id: 502, reportId: 104, type: "RESIDUOS_SOLIDOS", description: "Retirar desmonte con camión", location: { address: "Jr. Pizarro 210" }, status: "PENDIENTE", assignedAt: now - DAY },
    { id: 503, reportId: 103, type: "BARRIDO", description: "Barrido de ciclovía", location: { address: "Av. Larco 890" }, status: "RESUELTO", assignedAt: now - 5 * DAY, completedAt: now - 4 * DAY },
  ];

  let lastId = Math.max(...reportes.map((r) => r.id));
  return { reportes, trabajadores, tareas, nextReportId: () => ++lastId };
}
