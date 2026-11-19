import { beforeEach, describe, expect, it } from "vitest";
import {
  assignForm,
  chipGroup,
  detail,
  journey,
  listHTML,
  ratingBlock,
  reportItem,
  resetJourneyMemory,
  statusFilter,
  taskItem,
} from "../../js/ui/components.js";

/** Convierte HTML en un fragmento consultable. */
const dom = (html) => {
  const t = document.createElement("template");
  t.innerHTML = html;
  return t.content;
};

beforeEach(resetJourneyMemory);

describe("journey", () => {
  it.each([
    ["PENDIENTE", 1, "Pendiente"],
    ["EN_PROGRESO", 2, "En progreso"],
    ["RESUELTO", 3, "Resuelto"],
  ])("%s marca %i paso(s) completados", (status, step, label) => {
    const f = dom(journey({ id: 1, status }));
    expect(f.querySelectorAll("li.done")).toHaveLength(step);
    expect(f.querySelectorAll("li.cur")).toHaveLength(1);
    expect(f.querySelector(".journey").getAttribute("aria-label")).toBe(`Estado: ${label}, paso ${step} de 3`);
  });

  it("anima solo cuando el estado avanza respecto a lo ya mostrado", () => {
    const r = { id: 1, status: "PENDIENTE" };
    expect(journey(r)).not.toContain(" jx");
    r.status = "EN_PROGRESO";
    const f = dom(journey(r));
    expect(f.querySelector(".journey").classList.contains("jx")).toBe(true);
    expect(f.querySelectorAll("li.new")).toHaveLength(1);
    expect(journey(r)).not.toContain(" jx");
  });

  it("no confunde tareas y reportes con el mismo id", () => {
    journey({ id: 1, status: "PENDIENTE" });
    expect(journey({ id: 1, reportId: 9, status: "RESUELTO" })).not.toContain(" jx");
  });

  it("la versión grande muestra fechas o 'En espera'", () => {
    const f = dom(journey({ id: 2, status: "EN_PROGRESO", createdAt: Date.UTC(2026, 0, 15, 12) }, true));
    const small = [...f.querySelectorAll("small")].map((s) => s.textContent);
    expect(small[0]).toMatch(/15/);
    expect(small[1]).toBe("Hecho");
    expect(small[2]).toBe("En espera");
  });
});

describe("listas", () => {
  it("listHTML muestra el estado vacío", () => {
    expect(listHTML([], reportItem)).toBe('<div class="empty"><p>No hay nada por aquí todavía.</p></div>');
    expect(listHTML([], reportItem, "<p>x</p>")).toContain("<p>x</p>");
  });

  it("reportItem escapa los datos del usuario", () => {
    const f = dom(reportItem({ id: 1, type: "MALEZA", status: "PENDIENTE", description: "<script>x</script>", location: { address: '"><b>' }, zone: "<i>z</i>" }, 0));
    expect(f.querySelector("script")).toBeNull();
    expect(f.querySelector("h3").textContent).toBe("<script>x</script>");
    expect(f.querySelector(".meta").textContent).toContain('"><b>');
    expect(f.querySelector(".meta i")).toBeNull();
    expect(f.querySelector(".item").dataset.i).toBe("0");
  });

  it("taskItem usa la descripción del reporte si la tarea no tiene", () => {
    const f = dom(taskItem({ id: 1, reportId: 2, type: "BARRIDO", status: "PENDIENTE", report: { description: "Del reporte" } }, 3));
    expect(f.querySelector("h3").textContent).toBe("Del reporte");
    expect(f.querySelector(".meta").textContent).toContain("Asignada el");
  });
});

describe("filtros", () => {
  it("statusFilter marca la opción seleccionada", () => {
    const f = dom(statusFilter("RESUELTO", "Todos"));
    expect([...f.querySelectorAll(".chip")].map((c) => c.textContent)).toEqual(["Todos", "Pendiente", "En progreso", "Resuelto"]);
    expect(f.querySelector(".chip.on").dataset.s).toBe("RESUELTO");
  });

  it("chipGroup permite varias seleccionadas", () => {
    const f = dom(chipGroup("tipos", { A: "a", B: "b", C: "c" }, ["A", "C"]));
    expect([...f.querySelectorAll(".chip.on")].map((c) => c.dataset.k)).toEqual(["A", "C"]);
    expect(f.querySelector(".filters").dataset.g).toBe("tipos");
  });
});

describe("detalle", () => {
  it("muestra solo los campos presentes y marca la prioridad alta", () => {
    const f = dom(detail({ id: 1, type: "MALEZA", status: "PENDIENTE", description: "D", priority: "ALTA" }));
    expect([...f.querySelectorAll("dt")].map((d) => d.textContent)).toEqual(["Dirección", "Prioridad"]);
    expect(f.querySelector("dd.urg").textContent).toBe("Alta");
    expect(f.querySelector('[data-action="close-layer"]')).not.toBeNull();
    expect(f.querySelector(".photos")).toBeNull();
  });

  it("escapa URLs de fotos y evidencias", () => {
    const f = dom(detail({ id: 1, status: "RESUELTO", photos: ['x" onerror="alert(1)'], evidence: "https://e/1.png" }));
    const imgs = f.querySelectorAll("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0].getAttribute("onerror")).toBeNull();
    expect(imgs[1].getAttribute("src")).toBe("https://e/1.png");
  });

  it("ratingBlock pinta las estrellas de la calificación actual", () => {
    expect(dom(ratingBlock(3)).querySelectorAll("button.on")).toHaveLength(3);
    expect(dom(ratingBlock(undefined)).querySelector("h3").textContent).toBe("¿Cómo fue la atención?");
  });

  it("assignForm lista a los trabajadores escapados", () => {
    const f = dom(assignForm([{ id: 1, name: "Ana", lastname: "<b>" }]));
    expect(f.querySelector("option").value).toBe("1");
    expect(f.querySelector("option").textContent).toBe("Ana <b>");
  });
});
