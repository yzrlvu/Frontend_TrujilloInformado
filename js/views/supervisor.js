/** Vistas del rol SUPERVISOR: "Panel" y "Reportes de zona". */
import { STATUS, TYPES } from "../config.js";
import { plural } from "../utils.js";
import { $, $$, closeLayer, mainEl, onItemClick, openLayer, renderError, renderLoading, renderMain, toast } from "../ui/dom.js";
import { assignForm, chipGroup, detail, listHTML, pageHead, reportItem } from "../ui/components.js";
import { UnsupportedInDemoError } from "../data/repository.js";

const PDF_BUTTON = `<button class="btn" id="pdf">Exportar PDF</button>`;
const RECENT_PENDING = 5;

const kpiHTML = (k) => {
  const inProgress = k.total - k.pending - k.resolved;
  const kpis = [["Total", k.total, ""], ["Pendientes", k.pending, "warn"], ["En progreso", inProgress, ""], ["Resueltos", k.resolved, ""]];
  return `<div class="kpis">${kpis.map(([l, v, c]) => `<div class="kpi ${c}"><span>${l}</span><b>${v}</b></div>`).join("")}</div>`;
};

const byTypeHTML = (byType = {}) => {
  const max = Math.max(1, ...Object.values(byType));
  const bars = Object.entries(byType)
    .map(([t, n]) => `<div><div class="tbh"><span>${TYPES[t] || t}</span><b>${n}</b></div><div class="bar"><i style="width:${(n / max) * 100}%"></i></div></div>`)
    .join("");
  return `<div class="types">${bars || "<span class='sub'>Sin datos</span>"}</div>`;
};

/** @param {{repo: object, session: object, refresh: () => void}} ctx */
export async function panel(ctx) {
  renderLoading();
  try {
    const [summary, items] = await Promise.all([ctx.repo.resumen(ctx.session.filters), ctx.repo.zona(ctx.session.filters)]);
    const pending = items.filter((r) => r.status === "PENDIENTE").slice(0, RECENT_PENDING);
    const empty = `<p>No hay reportes pendientes en tu zona. Revisa los reportes en progreso para dar seguimiento.</p><button class="btn" data-go="reportes">Ver reportes de zona</button>`;

    renderMain(`${pageHead("Panel", "Resumen de los reportes de tu zona.", PDF_BUTTON)}
    ${kpiHTML(summary)}
    <div class="grid2"><section><h2 class="sec">Pendientes recientes</h2>${listHTML(pending, reportItem, empty)}</section>
    <section><h2 class="sec">Por tipo</h2>${byTypeHTML(summary.byType)}</section></div>`);

    onItemClick(mainEl(), pending, (r) => showReport(ctx, r));
    $("#pdf").addEventListener("click", () => exportPdf(ctx));
  } catch (e) {
    renderError(e);
  }
}

/** Valores activos de un grupo de chips de selección múltiple. */
const pickedChips = (group) => $$(`.filters[data-g="${group}"] .chip.on`).map((c) => c.dataset.k);

export async function reportesZona(ctx) {
  renderLoading();
  try {
    const { filters } = ctx.session;
    const items = await ctx.repo.zona(filters);
    const sub = `${items.length} ${plural(items.length, "reporte", "reportes")}. Filtra por estado o tipo y asigna los pendientes.`;

    renderMain(`${pageHead("Reportes de zona", sub, PDF_BUTTON)}
    <div class="fgroup"><span>Estado</span>${chipGroup("estados", STATUS, filters.estados)}</div><div class="fgroup" style="margin-bottom:20px"><span>Tipo</span>${chipGroup("tipos", TYPES, filters.tipos)}</div>${listHTML(items, reportItem, `<p>Ningún reporte coincide con estos filtros. Quita alguno para ver más resultados.</p><button class="btn" id="clearFilters">Quitar filtros</button>`)}`);

    const root = mainEl();
    for (const chip of $$(".filters .chip", root)) {
      chip.addEventListener("click", () => {
        chip.classList.toggle("on");
        ctx.session.filters = { estados: pickedChips("estados"), tipos: pickedChips("tipos") };
        reportesZona(ctx);
      });
    }
    $("#clearFilters", root)?.addEventListener("click", () => {
      ctx.session.filters = { estados: [], tipos: [] };
      reportesZona(ctx);
    });
    onItemClick(root, items, (r) => showReport(ctx, r));
    $("#pdf").addEventListener("click", () => exportPdf(ctx));
  } catch (e) {
    renderError(e);
  }
}

/** Detalle de un reporte; si está pendiente, permite asignarlo a un trabajador. */
async function showReport(ctx, report) {
  let workers = [];
  try {
    workers = await ctx.repo.trabajadores();
  } catch {
    /* sin lista de trabajadores: el selector queda vacío */
  }
  const panelEl = openLayer(detail(report, report.status === "PENDIENTE" ? assignForm(workers) : ""));
  const assignBtn = $("#asg", panelEl);
  if (!assignBtn) return;

  assignBtn.addEventListener("click", async () => {
    try {
      await ctx.repo.asignar(report, $("#w", panelEl).value, $("#ins", panelEl).value || report.description);
      toast("Tarea asignada");
      closeLayer();
      ctx.refresh();
    } catch {
      toast("No se pudo asignar");
    }
  });
}

async function exportPdf(ctx) {
  try {
    const blob = await ctx.repo.exportPdf(ctx.session.filters);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reportes.pdf";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
  } catch (e) {
    toast(e instanceof UnsupportedInDemoError ? e.message : "No se pudo exportar");
  }
}
