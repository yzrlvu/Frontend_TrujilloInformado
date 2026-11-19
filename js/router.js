/** Entrada a la app tras el login y navegación entre vistas según el rol. */
import { NAV } from "./config.js";
import { session, normalizeRole, saveSession, getApiBase } from "./state.js";
import { capitalize } from "./utils.js";
import { $, $$ } from "./ui/dom.js";
import { createHttp } from "./api/http.js";
import { createDemoStore } from "./data/demo.js";
import { createDemoRepo, createRemoteRepo } from "./data/repository.js";
import { misReportes, nuevoReporte } from "./views/ciudadano.js";
import { panel, reportesZona } from "./views/supervisor.js";
import { misTareas } from "./views/trabajador.js";

const VIEWS = {
  mis: misReportes,
  nuevo: nuevoReporte,
  panel,
  reportes: reportesZona,
  tareas: misTareas,
};

/** Cliente HTTP compartido (también lo usa el login). */
export const http = createHttp({ baseUrl: getApiBase, getToken: () => session.token });

/** Contexto que reciben las vistas: datos, sesión y navegación. */
const ctx = {
  repo: null,
  session,
  go,
  refresh: () => VIEWS[session.view](ctx),
};

/** Navega a una vista del rol actual y marca la pestaña activa. */
export function go(view) {
  session.view = view;
  for (const b of $$(".nav")) b.classList.toggle("active", b.dataset.v === view);
  VIEWS[view](ctx);
}

/** Inicia la app con los datos de sesión (login real, demo o sesión restaurada). */
export function enter(data) {
  Object.assign(session, data);
  session.role = normalizeRole(session.role);
  saveSession(session);
  ctx.repo = session.demo ? createDemoRepo(createDemoStore()) : createRemoteRepo(http, session);

  $("#loginView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#uName").textContent = session.name;
  $("#uRole").textContent = capitalize(session.role) + (session.demo ? " (demo)" : "");

  const nav = NAV[session.role];
  $("#nav").innerHTML = nav.map(([key, label]) => `<button class="nav" data-v="${key}">${label}</button>`).join("");
  for (const b of $$(".nav")) b.addEventListener("click", () => go(b.dataset.v));
  go(nav[0][0]);
}
