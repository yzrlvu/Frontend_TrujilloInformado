/** Utilidades de DOM: selección, avisos, capa modal y estados de carga. */
import { TOAST_MS } from "../config.js";
import { esc } from "../utils.js";

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Muestra un aviso temporal en la parte inferior. */
export function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), TOAST_MS);
}

/* ---------- contenido principal ---------- */
export const mainEl = () => $("#main");
export const renderMain = (html) => {
  mainEl().innerHTML = html;
};
export const renderLoading = () => renderMain(`<div class="empty">Cargando…</div>`);
export const renderError = (error) =>
  renderMain(`<div class="empty"><p>No se pudo cargar la información.</p><small>${esc(error.message)}</small></div>`);

/* ---------- capa: panel lateral (drawer) o modal centrado ---------- */
const layerEl = () => $("#layer");

export function openLayer(html, { center = false } = {}) {
  layerEl().innerHTML = `<div class="overlay ${center ? "center" : ""}"><div class="${center ? "modal" : "drawer"}">${html}</div></div>`;
  $(".overlay", layerEl()).addEventListener("click", (e) => {
    if (e.target.classList.contains("overlay")) closeLayer();
  });
  return $(center ? ".modal" : ".drawer", layerEl());
}

export function closeLayer() {
  layerEl().innerHTML = "";
}

/**
 * Asocia un handler al clic de cada elemento de lista (`.item[data-i]`)
 * y le pasa el elemento correspondiente del array.
 */
export function onItemClick(root, items, handler) {
  for (const el of $$(".item", root)) {
    el.addEventListener("click", () => handler(items[el.dataset.i]));
  }
}

/** Enter/Espacio activan los elementos con role="button" que no son <button> (accesibilidad). */
export function enableKeyboardActivation(root = document) {
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const target = e.target.closest?.('[role="button"]:not(button)');
    if (!target) return;
    e.preventDefault();
    target.click();
  });
}
