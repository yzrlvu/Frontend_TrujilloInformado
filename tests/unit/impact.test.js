import { describe, expect, it } from "vitest";
import { createDemoStore } from "../../js/data/demo.js";
import { impactFigures, renderImpact } from "../../js/ui/impact.js";

describe("impactFigures", () => {
  it("cuenta reportes, resueltos y zonas distintas de los datos demo", () => {
    expect(impactFigures(createDemoStore(0))).toEqual([
      [5, "reportes de vecinos en la demo"],
      [2, "reportes ya resueltos por SEGAT"],
      [4, "zonas de Trujillo atendidas"],
    ]);
  });
  it("usa singular cuando la cifra es 1", () => {
    const rows = impactFigures({ reportes: [{ status: "RESUELTO", zone: "La Noria" }] });
    expect(rows[0][1]).toBe("reporte de vecinos en la demo");
    expect(rows[1][1]).toBe("reporte ya resuelto por SEGAT");
  });
  it("devuelve una lista vacía sin datos", () => {
    expect(impactFigures({ reportes: [] })).toEqual([]);
    expect(impactFigures(undefined)).toEqual([]);
  });
});

describe("renderImpact", () => {
  it("reemplaza las filas fijas por las cifras calculadas", () => {
    const ul = document.createElement("ul");
    ul.innerHTML = "<li>fijo</li>";
    renderImpact(ul, createDemoStore(0));
    expect(ul.querySelectorAll("li")).toHaveLength(3);
    expect(ul.querySelector("b").textContent).toBe("5");
  });
  it("conserva los textos fijos si no hay datos", () => {
    const ul = document.createElement("ul");
    ul.innerHTML = "<li>fijo</li>";
    renderImpact(ul, { reportes: [] });
    expect(ul.innerHTML).toBe("<li>fijo</li>");
  });
});
