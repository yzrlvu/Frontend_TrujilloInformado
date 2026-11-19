/**
 * Componentes de presentación: funciones puras que devuelven HTML.
 * Todo dato que viene del usuario o del backend pasa por `esc()`.
 */
import { PRIORITY, STATUS, TYPES } from "../config.js";
import { esc, fmtDate } from "../utils.js";
import { ICON_CLOSE, ICON_STAR, typeIcon } from "./icons.js";

const typeLabel = (type) => TYPES[type] || type;
const statusLabel = (status) => STATUS[status] || status;

/* ---------- recorrido del reporte (Reportado → Asignado → Resuelto) ---------- */
const STEPS = ["Reportado", "Asignado", "Resuelto"];
const STEP_OF_STATUS = { PENDIENTE: 1, EN_PROGRESO: 2, RESUELTO: 3 };

/** Último paso mostrado por elemento, para animar solo los avances. */
const seenSteps = new Map();
export const resetJourneyMemory = () => seenSteps.clear();

/** Las tareas tienen `reportId`; sirve para no mezclar ids de tareas y reportes. */
const journeyKey = (item) => (item.reportId != null ? "t" : "r") + item.id;

/**
 * @param {object} item  reporte o tarea (`status`, fechas `createdAt/assignedAt/completedAt`)
 * @param {boolean} big  versión grande del detalle (con etiquetas y fechas)
 */
export function journey(item, big = false) {
  const status = item.status;
  const step = STEP_OF_STATUS[status] || 1;
  const key = journeyKey(item);
  const prev = seenSteps.get(key);
  seenSteps.set(key, step);

  const animate = !big && prev && prev < step;
  const dates = [item.createdAt, item.assignedAt, item.completedAt];
  const progress = (step - 1) / 2;

  const steps = STEPS.map((label, i) => {
    const cls = [i < step && "done", i === step - 1 && "cur", animate && i >= prev && i < step && "new"]
      .filter(Boolean)
      .join(" ");
    const when = i < step ? (dates[i] ? fmtDate(dates[i]) : "Hecho") : "En espera";
    return `<li class="${cls}"><span class="jd"></span>${big ? `<b>${label}</b><small>${when}</small>` : ""}</li>`;
  }).join("");

  if (big) {
    return `<div class="journey big s-${status}" style="--p:${progress}"><div class="jt"><i></i></div><ol aria-label="Recorrido del reporte: ${statusLabel(status)}">${steps}</ol></div>`;
  }
  const prevProgress = prev ? (prev - 1) / 2 : 0;
  return `<div class="journey s-${status}${animate ? " jx" : ""}" style="--p:${progress};--p0:${prevProgress}" role="img" aria-label="Estado: ${statusLabel(status)}, paso ${step} de 3"><div class="jt"><i></i></div><ol>${steps}</ol><span class="jl">${statusLabel(status)}</span></div>`;
}

/* ---------- encabezado y listas ---------- */
export const pageHead = (title, sub, actions = "") =>
  `<div class="head"><div><h1>${title}</h1><p class="sub">${sub}</p></div>${actions}</div>`;

const DEFAULT_EMPTY = "<p>No hay nada por aquí todavía.</p>";

/** Lista de elementos o, si está vacía, el bloque de estado vacío. */
export const listHTML = (items, renderItem, emptyHTML = DEFAULT_EMPTY) =>
  items.length
    ? `<div class="list">${items.map(renderItem).join("")}</div>`
    : `<div class="empty">${emptyHTML}</div>`;

const itemRow = (i, type, title, meta, item) =>
  `<div class="item" data-i="${i}" tabindex="0" role="button"><span class="ti">${typeIcon(type)}</span><div><h3>${esc(title)}</h3>
  <div class="meta">${meta.join("")}</div></div>${journey(item)}</div>`;

const metaSpan = (text) => `<span>${text}</span>`;

export const reportItem = (r, i) =>
  itemRow(i, r.type, r.description, [
    metaSpan(typeLabel(r.type)),
    metaSpan(esc(r.location?.address || "")),
    metaSpan(fmtDate(r.createdAt)),
    r.zone ? metaSpan(esc(r.zone)) : "",
  ], r);

export const taskDescription = (t) => t.description || t.report?.description;

export const taskItem = (t, i) =>
  itemRow(i, t.type, taskDescription(t), [
    metaSpan(typeLabel(t.type)),
    metaSpan(esc(t.location?.address || "")),
    metaSpan(`Asignada el ${fmtDate(t.assignedAt)}`),
  ], t);

/* ---------- filtros ---------- */

/** Chips de selección única por estado (incluye la opción "todos"). */
export const statusFilter = (selected, allLabel) =>
  `<div class="filters">${[["", allLabel], ...Object.entries(STATUS)]
    .map(([k, l]) => `<button class="chip ${k === selected ? "on" : ""}" data-s="${k}">${l}</button>`)
    .join("")}</div>`;

/** Chips de selección múltiple, agrupados por `data-g`. */
export const chipGroup = (group, options, selected) =>
  `<div class="filters" data-g="${group}">${Object.entries(options)
    .map(([k, l]) => `<button class="chip ${selected.includes(k) ? "on" : ""}" data-k="${k}">${l}</button>`)
    .join("")}</div>`;

/* ---------- detalle ---------- */
const photoBlock = (label, urls, alt) =>
  urls?.length
    ? `<p class="lbl">${label}</p><div class="photos">${[].concat(urls).map((p) => `<img src="${esc(p)}" alt="${alt}">`).join("")}</div>`
    : "";

/** Contenido del panel lateral de un reporte o tarea; `extra` añade acciones al final. */
export function detail(r, extra = "") {
  const field = (label, value, cls = "") => `<dt>${label}</dt><dd${cls ? ` class="${cls}"` : ""}>${value}</dd>`;
  return `<div class="dh"><span class="dtype">${typeIcon(r.type)}${typeLabel(r.type)}</span><button class="btn ghost icon" data-action="close-layer" aria-label="Cerrar">${ICON_CLOSE}</button></div>
  <h2 class="dt">${esc(r.description)}</h2>
  ${journey(r, true)}
  <dl class="dl">${field("Dirección", esc(r.location?.address || "—"))}
  ${r.zone ? field("Zona", esc(r.zone)) : ""}${r.priority ? field("Prioridad", PRIORITY[r.priority], r.priority === "ALTA" ? "urg" : "") : ""}
  ${r.citizenName ? field("Ciudadano", esc(r.citizenName)) : ""}${r.assignedTo ? field("Asignado a", esc(r.assignedTo)) : ""}</dl>
  ${photoBlock("Fotos", r.photos, "Foto del reporte")}
  ${photoBlock("Evidencia", r.evidence, "Evidencia del trabajo")}${extra}`;
}

/** Bloque de calificación con estrellas (solo para reportes resueltos). */
export function ratingBlock(rating) {
  const stars = [1, 2, 3, 4, 5]
    .map((n) => `<button data-n="${n}" class="${n <= (rating || 0) ? "on" : ""}" aria-label="${n} de 5">${ICON_STAR}</button>`)
    .join("");
  return `<div class="block"><h3>${rating ? "Tu calificación" : "¿Cómo fue la atención?"}</h3><p class="hint">${rating ? "Puedes cambiarla cuando quieras." : "Tu opinión ayuda a SEGAT a mejorar."}</p><div class="stars" role="group" aria-label="Calificación">${stars}</div></div>`;
}

/** Formulario para asignar un reporte pendiente a un trabajador. */
export const assignForm = (workers) => `<div class="assign"><h3>Asignar tarea</h3>
    <label for="w">Trabajador</label><select id="w">${workers.map((w) => `<option value="${esc(w.id)}">${esc(w.name)} ${esc(w.lastname)}</option>`).join("")}</select>
    <label for="ins">Instrucciones</label><textarea id="ins" rows="2" placeholder="Qué debe hacer el trabajador"></textarea>
    <div class="actions"><button class="btn primary" id="asg">Asignar tarea</button></div></div>`;

/** Formulario para completar una tarea con foto de evidencia. */
export const completeTaskForm = () => `<div class="block"><h3>Completar tarea</h3><label for="evf">Foto de evidencia</label><input type="file" accept="image/*" id="evf"><div class="photos" id="evp"></div>
        <div class="actions"><button class="btn primary" id="cmp">Completar tarea</button></div></div>`;
