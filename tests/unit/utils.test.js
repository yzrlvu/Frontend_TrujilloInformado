import { describe, expect, it } from "vitest";
import { capitalize, decodeJwt, esc, fmtDate, pageContent, plural, qs } from "../../js/utils.js";

const jwtWith = (claims) => `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;

describe("esc", () => {
  it("escapa los caracteres especiales de HTML", () => {
    expect(esc(`<img src=x onerror="a('b')">&`)).toBe("&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;");
  });
  it("convierte null/undefined en cadena vacía y números en texto", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
    expect(esc(42)).toBe("42");
  });
});

describe("qs", () => {
  it("devuelve cadena vacía sin parámetros útiles", () => {
    expect(qs()).toBe("");
    expect(qs({ a: "", b: null, c: undefined, d: [] })).toBe("");
  });
  it("repite la clave para arrays y omite vacíos", () => {
    expect(qs({ estados: ["PENDIENTE", "RESUELTO"], tipos: [], size: 50, estado: "" })).toBe(
      "?estados=PENDIENTE&estados=RESUELTO&size=50",
    );
  });
  it("codifica caracteres especiales", () => {
    expect(qs({ sort: "createdAt,desc" })).toBe("?sort=createdAt%2Cdesc");
  });
});

describe("pageContent", () => {
  it("acepta arrays planos y páginas de Spring", () => {
    expect(pageContent([1, 2])).toEqual([1, 2]);
    expect(pageContent({ content: [3] })).toEqual([3]);
  });
  it("devuelve [] ante respuestas vacías", () => {
    expect(pageContent(null)).toEqual([]);
    expect(pageContent({})).toEqual([]);
    expect(pageContent("")).toEqual([]);
  });
});

describe("decodeJwt", () => {
  it("lee el payload, incluidos caracteres UTF-8", () => {
    expect(decodeJwt(jwtWith({ id: 7, name: "Lucía Peña" }))).toEqual({ id: 7, name: "Lucía Peña" });
  });
  it("devuelve {} con tokens inválidos", () => {
    expect(decodeJwt("no-es-un-jwt")).toEqual({});
    expect(decodeJwt(null)).toEqual({});
    expect(decodeJwt("a.%%%.b")).toEqual({});
  });
});

describe("formato", () => {
  it("fmtDate usa '—' sin fecha y formato corto con fecha", () => {
    expect(fmtDate(null)).toBe("—");
    expect(fmtDate(new Date(2026, 10, 19).getTime())).toMatch(/19/);
  });
  it("capitalize y plural", () => {
    expect(capitalize("SUPERVISOR")).toBe("Supervisor");
    expect(plural(1, "tarea", "tareas")).toBe("tarea");
    expect(plural(0, "tarea", "tareas")).toBe("tareas");
  });
});
