import { describe, expect, it, vi } from "vitest";
import { ApiError, createHttp } from "../../js/api/http.js";

const response = (body, { status = 200, type = "application/json" } = {}) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "content-type": type } });

function setup({ token = null, reply = response({ ok: true }) } = {}) {
  const fetch = vi.fn().mockResolvedValue(reply);
  const http = createHttp({ baseUrl: () => "https://api.test", getToken: () => token, fetch });
  return { http, fetch };
}

describe("createHttp.request", () => {
  it("concatena la URL base y serializa el body", async () => {
    const { http, fetch } = setup();
    await http.request("/api/v1/x", { method: "POST", body: { a: 1 } });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://api.test/api/v1/x");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"a":1}');
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("añade Authorization solo si hay token", async () => {
    const anon = setup();
    await anon.http.request("/a");
    expect(anon.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();

    const logged = setup({ token: "abc" });
    await logged.http.request("/a");
    expect(logged.fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer abc");
  });

  it("GET por defecto y sin body", async () => {
    const { http, fetch } = setup();
    await http.request("/a");
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: "GET", body: undefined });
  });

  it("parsea JSON o texto según el content-type", async () => {
    expect(await setup({ reply: response({ n: 1 }) }).http.request("/a")).toEqual({ n: 1 });
    expect(await setup({ reply: response("hola", { type: "text/plain" }) }).http.request("/a")).toBe("hola");
  });

  it("lanza ApiError con el message del backend", async () => {
    const { http } = setup({ reply: response({ message: "Fuera de zona" }, { status: 400 }) });
    const err = await http.request("/a").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("Fuera de zona");
    expect(err.status).toBe(400);
  });

  it("usa el texto o el código cuando no hay JSON", async () => {
    expect((await setup({ reply: response("Boom", { status: 500, type: "text/plain" }) }).http.request("/a").catch((e) => e)).message).toBe("Boom");
    expect((await setup({ reply: response("", { status: 503, type: "text/plain" }) }).http.request("/a").catch((e) => e)).message).toBe("Error 503");
  });
});

describe("createHttp.upload / download", () => {
  it("upload envía multipart con el archivo y devuelve el texto", async () => {
    const { http, fetch } = setup({ token: "t", reply: response("https://img/1.png", { type: "text/plain" }) });
    const url = await http.upload("/api/v1/reporte/cargar", new Blob(["x"]));
    expect(url).toBe("https://img/1.png");
    const [, init] = fetch.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.body.get("file")).toBeTruthy();
    expect(init.headers).toEqual({ Authorization: "Bearer t" });
  });

  it("download devuelve un blob y falla si la respuesta no es ok", async () => {
    const ok = setup({ reply: new Response("%PDF", { status: 200, headers: { "content-type": "application/pdf" } }) });
    expect(await (await ok.http.download("/pdf")).text()).toBe("%PDF");

    const ko = setup({ reply: response({ message: "Prohibido" }, { status: 403 }) });
    await expect(ko.http.download("/pdf")).rejects.toThrow("Prohibido");
  });
});
