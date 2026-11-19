/** Cifras de impacto de la portada del login, calculadas con los datos demo. */
import { plural } from "../utils.js";

/**
 * @param {{reportes: Array<{zone?: string, status: string}>}} store  almacén demo
 * @returns {Array<[number, string]>} filas [cifra, texto]
 */
export function impactFigures(store) {
  const reportes = store?.reportes || [];
  if (!reportes.length) return [];
  const resueltos = reportes.filter((r) => r.status === "RESUELTO").length;
  const zonas = new Set(reportes.map((r) => r.zone).filter(Boolean)).size;
  return [
    [reportes.length, `${plural(reportes.length, "reporte", "reportes")} de vecinos en la demo`],
    [resueltos, `${plural(resueltos, "reporte ya resuelto", "reportes ya resueltos")} por SEGAT`],
    [zonas, "zonas de Trujillo atendidas"],
  ];
}

/** Reemplaza las cifras fijas del HTML; si no hay datos, se mantienen los textos fijos. */
export function renderImpact(el, store) {
  const rows = impactFigures(store);
  if (!el || !rows.length) return;
  el.innerHTML = rows.map(([n, label]) => `<li><b>${n}</b><span>${label}</span></li>`).join("");
}
