import { beforeEach, describe, expect, it } from "vitest";
import { createDemoStore } from "../../js/data/demo.js";
import { createDemoRepo, UnsupportedInDemoError } from "../../js/data/repository.js";

const NOW = 1_800_000_000_000;
let store, repo;

beforeEach(() => {
  store = createDemoStore(NOW);
  repo = createDemoRepo(store, { now: () => NOW, createObjectURL: (f) => `blob:${f.name}` });
});

describe("createDemoStore", () => {
  it("cada llamada devuelve datos independientes", () => {
    const other = createDemoStore(NOW);
    other.reportes[0].status = "RESUELTO";
    expect(store.reportes[0].status).toBe("PENDIENTE");
  });
  it("genera ids de reporte únicos y crecientes", () => {
    const ids = [store.nextReportId(), store.nextReportId()];
    expect(ids).toEqual([106, 107]);
  });
});

describe("lecturas", () => {
  it("misReportes devuelve solo los del ciudadano demo y filtra por estado", async () => {
    expect((await repo.misReportes("")).map((r) => r.id)).toEqual([101, 104]);
    expect(await repo.misReportes("RESUELTO")).toEqual([]);
  });

  it("zona aplica filtros combinados de estado y tipo", async () => {
    expect(await repo.zona({ estados: [], tipos: [] })).toHaveLength(5);
    expect((await repo.zona({ estados: ["PENDIENTE"], tipos: [] })).map((r) => r.id)).toEqual([101, 104]);
    expect((await repo.zona({ estados: ["RESUELTO"], tipos: ["MALEZA"] })).map((r) => r.id)).toEqual([105]);
    expect(await repo.zona()).toHaveLength(5);
  });

  it("resumen cuenta totales y por tipo", async () => {
    expect(await repo.resumen()).toEqual({
      total: 5,
      pending: 2,
      resolved: 2,
      byType: { RESIDUOS_SOLIDOS: 2, MALEZA: 2, BARRIDO: 1 },
    });
  });

  it("misTareas filtra por estado", async () => {
    expect(await repo.misTareas("")).toHaveLength(3);
    expect((await repo.misTareas("PENDIENTE")).map((t) => t.id)).toEqual([502]);
  });
});

describe("escrituras", () => {
  it("crearReporte agrega un pendiente al inicio con id nuevo", async () => {
    await repo.crearReporte({ type: "BARRIDO", description: "Hojas", location: { lat: 1, lng: 2, address: "X" }, photos: [] });
    await repo.crearReporte({ type: "MALEZA", description: "Pasto", location: {}, photos: [] });
    const [last, prev] = store.reportes;
    expect(last).toMatchObject({ id: 107, description: "Pasto", status: "PENDIENTE", citizenName: "Lucía Ramos", createdAt: NOW });
    expect(prev.id).toBe(106);
    expect(await repo.misReportes("")).toHaveLength(4);
  });

  it("asignar pasa el reporte a EN_PROGRESO con el nombre del trabajador", async () => {
    const [rep] = await repo.zona({ estados: ["PENDIENTE"], tipos: [] });
    await repo.asignar(rep, "2", "Ir hoy");
    expect(store.reportes.find((r) => r.id === rep.id)).toMatchObject({ status: "EN_PROGRESO", assignedTo: "María Quispe" });
    expect((await repo.resumen()).pending).toBe(1);
  });

  it("asignar falla con un trabajador inexistente", async () => {
    await expect(repo.asignar(store.reportes[0], "99")).rejects.toThrow("Trabajador no encontrado");
    expect(store.reportes[0].status).toBe("PENDIENTE");
  });

  it("completar y calificar mutan el elemento", async () => {
    const [tarea] = await repo.misTareas("PENDIENTE");
    await repo.completar(tarea, "blob:x");
    expect(tarea).toMatchObject({ status: "RESUELTO", completedAt: NOW });

    const rep = store.reportes[2];
    await repo.calificar(rep, 3);
    expect(rep.rating).toBe(3);
  });

  it("subir devuelve una URL local y exportPdf no está disponible", async () => {
    expect(await repo.subir({ name: "a.png" })).toBe("blob:a.png");
    await expect(repo.exportPdf()).rejects.toBeInstanceOf(UnsupportedInDemoError);
  });
});
