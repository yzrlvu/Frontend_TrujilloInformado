import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRemoteRepo } from "../../js/data/repository.js";

let http, session, repo;

beforeEach(() => {
  http = {
    request: vi.fn().mockResolvedValue({ content: [{ id: 1 }] }),
    upload: vi.fn().mockResolvedValue("https://img/1.png"),
    download: vi.fn().mockResolvedValue(new Blob()),
  };
  session = { uid: 42, token: null };
  repo = createRemoteRepo(http, session);
});

const lastCall = (fn) => fn.mock.calls.at(-1);

describe("lecturas", () => {
  it("misReportes pagina, ordena y desenvuelve content", async () => {
    expect(await repo.misReportes("PENDIENTE")).toEqual([{ id: 1 }]);
    expect(lastCall(http.request)[0]).toBe("/api/v1/reportes/me?estado=PENDIENTE&size=50&sort=createdAt%2Cdesc");
  });

  it("misReportes sin estado no envía el parámetro", async () => {
    await repo.misReportes("");
    expect(lastCall(http.request)[0]).toBe("/api/v1/reportes/me?size=50&sort=createdAt%2Cdesc");
  });

  it("zona y resumen envían los filtros como parámetros repetidos", async () => {
    const filters = { estados: ["PENDIENTE", "EN_PROGRESO"], tipos: ["MALEZA"] };
    await repo.zona(filters);
    expect(lastCall(http.request)[0]).toBe(
      "/api/v1/reportes/supervisor/me?estados=PENDIENTE&estados=EN_PROGRESO&tipos=MALEZA&size=50&sort=createdAt%2Cdesc",
    );
    await repo.resumen(filters);
    expect(lastCall(http.request)[0]).toBe("/api/v1/reportes/supervisor/summary?estados=PENDIENTE&estados=EN_PROGRESO&tipos=MALEZA");
  });

  it("trabajadores y misTareas", async () => {
    await repo.trabajadores();
    expect(lastCall(http.request)[0]).toBe("/api/v1/trabajadores");
    await repo.misTareas("");
    expect(lastCall(http.request)[0]).toBe("/api/v1/tareas/me?size=50");
  });
});

describe("escrituras", () => {
  it("crearReporte añade citizenId desde la sesión", async () => {
    await repo.crearReporte({ type: "MALEZA", description: "d" });
    expect(lastCall(http.request)).toEqual(["/api/v1/reporte", { method: "POST", body: { type: "MALEZA", description: "d", citizenId: "42" } }]);
  });

  it("crearReporte usa el id del JWT si no hay uid", async () => {
    session.uid = null;
    session.token = `h.${Buffer.from(JSON.stringify({ id: 9 })).toString("base64url")}.s`;
    await repo.crearReporte({});
    expect(lastCall(http.request)[1].body.citizenId).toBe("9");
  });

  it("asignar envía el DTO de la tarea", async () => {
    const rep = { id: 101, type: "BARRIDO", location: { address: "X" } };
    await repo.asignar(rep, "3", "Barrer");
    expect(lastCall(http.request)).toEqual([
      "/api/v1/tarea",
      { method: "POST", body: { reportId: 101, workerId: 3, description: "Barrer", type: "BARRIDO", location: { address: "X" } } },
    ]);
  });

  it("completar y calificar usan PATCH", async () => {
    await repo.completar({ id: 5 }, "https://ev");
    expect(lastCall(http.request)).toEqual(["/api/v1/tarea/5/completar", { method: "PATCH", body: { notes: "", evidences: ["https://ev"] } }]);
    await repo.calificar({ id: 7 }, 4, "Bien");
    expect(lastCall(http.request)).toEqual(["/api/v1/reporte/7/rate", { method: "PATCH", body: { rating: 4, comment: "Bien" } }]);
  });

  it("subir y exportPdf delegan en upload/download", async () => {
    const file = new Blob(["x"]);
    expect(await repo.subir(file, "tarea")).toBe("https://img/1.png");
    expect(lastCall(http.upload)).toEqual(["/api/v1/tarea/cargar", file]);
    await repo.exportPdf({ estados: ["RESUELTO"], tipos: [] });
    expect(lastCall(http.download)).toEqual(["/api/v1/reportes/supervisor/export/pdf?estados=RESUELTO"]);
  });
});
