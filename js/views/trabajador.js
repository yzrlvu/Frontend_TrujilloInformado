/** Vista del rol TRABAJADOR: "Mis tareas". */
import { STATUS } from "../config.js";
import { esc, plural } from "../utils.js";
import { $, $$, closeLayer, mainEl, onItemClick, openLayer, renderError, renderLoading, renderMain, toast } from "../ui/dom.js";
import { completeTaskForm, detail, listHTML, pageHead, statusFilter, taskDescription, taskItem } from "../ui/components.js";

const openTasksText = (open) =>
  open ? `Tienes ${open} ${plural(open, "tarea", "tareas")} por atender.` : "No tienes tareas por atender.";

/** @param {{repo: object}} ctx */
export async function misTareas(ctx, estado = "") {
  renderLoading();
  try {
    const items = await ctx.repo.misTareas(estado);
    const open = items.filter((t) => t.status !== "RESUELTO").length;
    const empty = estado
      ? `<p>No tienes tareas en estado “${STATUS[estado]}”.</p><button class="btn" data-s="">Ver todas mis tareas</button>`
      : "<p>No tienes tareas asignadas. Cuando tu supervisor te asigne una, aparecerá aquí.</p>";

    renderMain(`${pageHead("Mis tareas", openTasksText(open))}
    ${statusFilter(estado, "Todas")}
    ${listHTML(items, taskItem, empty)}`);

    const root = mainEl();
    for (const chip of $$("[data-s]", root)) chip.addEventListener("click", () => misTareas(ctx, chip.dataset.s));
    onItemClick(root, items, (t) => showTask(ctx, t, () => misTareas(ctx, estado)));
  } catch (e) {
    renderError(e);
  }
}

function showTask(ctx, task, onCompleted) {
  const done = task.status === "RESUELTO";
  const panel = openLayer(detail({ ...task, description: taskDescription(task) }, done ? "" : completeTaskForm()));
  if (done) return;

  let evidence = null;
  $("#evf", panel).addEventListener("change", async (e) => {
    try {
      evidence = await ctx.repo.subir(e.target.files[0], "tarea");
      $("#evp", panel).innerHTML = `<img src="${esc(evidence)}" alt="Evidencia adjunta">`;
    } catch {
      toast("Error al subir");
    }
  });

  $("#cmp", panel).addEventListener("click", async () => {
    if (!evidence) return toast("Adjunta una foto de evidencia");
    try {
      await ctx.repo.completar(task, evidence);
      toast("Tarea completada");
      closeLayer();
      onCompleted();
    } catch {
      toast("No se pudo completar");
    }
  });
}
