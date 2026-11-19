import { test, expect, loginDemo } from "./fixtures.js";

const fakeJwt = (claims) => `x.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.y`;

test.describe("Login", () => {
  test("muestra el login al abrir", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#loginView")).toBeVisible();
    await expect(page.locator("#appView")).toBeHidden();
    await expect(page.getByRole("heading", { name: "Inicia sesión" })).toBeVisible();
  });

  test("alterna entre login y registro", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#regFields")).toBeHidden();
    await page.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }).click();
    await expect(page.getByRole("heading", { name: "Crea tu cuenta" })).toBeVisible();
    await expect(page.locator("#regFields")).toBeVisible();
    await expect(page.locator("#authBtn")).toHaveText("Registrarme");
    await page.getByRole("button", { name: "¿Ya tienes cuenta? Inicia sesión" }).click();
    await expect(page.locator("#regFields")).toBeHidden();
    await expect(page.locator("#authBtn")).toHaveText("Ingresar");
  });

  test("login real fallido muestra un aviso", async ({ page }) => {
    await page.route(/\/api\/v1\/auth\//, (r) => r.fulfill({ status: 401, json: { message: "Credenciales inválidas" } }));
    await page.goto("/");
    await page.locator("#f-em").fill("a@b.pe");
    await page.locator("#f-pw").fill("x");
    await page.locator("#authBtn").click();
    await expect(page.locator(".toast")).toContainText("No se pudo conectar");
    await expect(page.locator("#loginView")).toBeVisible();
  });

  test("login real exitoso entra con el rol del backend", async ({ page }) => {
    await page.route(/\/api\/v1\/auth\/autenticar/, (r) =>
      r.fulfill({ json: { accessToken: fakeJwt({ id: 7, name: "Rosa" }), role: "ROLE_SUPERVISOR" } }),
    );
    await page.route(/\/api\/v1\/(reportes|trabajadores)/, (r) =>
      r.fulfill({
        json: r.request().url().includes("summary") ? { total: 0, pending: 0, resolved: 0, byType: {} } : { content: [] },
      }),
    );
    await page.goto("/");
    await page.locator("#f-em").fill("rosa@segat.pe");
    await page.locator("#f-pw").fill("secreto");
    await page.locator("#authBtn").click();
    await expect(page.locator("#uName")).toHaveText("Rosa");
    await expect(page.locator("#uRole")).toHaveText("Supervisor");
    await expect(page.getByRole("heading", { name: "Panel" })).toBeVisible();
  });

  test("registro llama a registro y luego autentica", async ({ page }) => {
    const calls = [];
    await page.route(/\/api\/v1\//, (r) => {
      const url = r.request().url();
      calls.push(url.replace(/^.*\/api\/v1/, ""));
      if (url.endsWith("/auth/registro")) return r.fulfill({ json: { ok: true } });
      if (url.endsWith("/auth/autenticar")) return r.fulfill({ json: { accessToken: fakeJwt({ id: 9 }), role: "CIUDADANO" } });
      return r.fulfill({ json: { content: [] } });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }).click();
    await page.locator("#f-fn").fill("Ana");
    await page.locator("#f-ln").fill("Pérez");
    await page.locator("#f-em").fill("ana@mail.pe");
    await page.locator("#f-pw").fill("123456");
    await page.locator("#authBtn").click();
    await expect(page.locator("#uName")).toHaveText("Ana");
    await expect(page.getByRole("heading", { name: "Mis reportes" })).toBeVisible();
    expect(calls.slice(0, 2)).toEqual(["/auth/registro", "/auth/autenticar"]);
  });

  test("usa la URL de API configurada", async ({ page }) => {
    let hit = "";
    await page.route("https://api.ejemplo.pe/**", (r) => {
      hit = r.request().url();
      return r.fulfill({ status: 500, body: "" });
    });
    await page.goto("/");
    await page.locator("details.api summary").click();
    await page.locator("#apiBase").fill("https://api.ejemplo.pe/");
    await page.locator("#apiBase").dispatchEvent("change");
    await page.locator("#f-em").fill("a@b.pe");
    await page.locator("#f-pw").fill("x");
    await page.locator("#authBtn").click();
    await expect(page.locator(".toast")).toBeVisible();
    expect(hit).toBe("https://api.ejemplo.pe/api/v1/auth/autenticar");
  });

  for (const [rol, nombre, navs] of [
    ["Ciudadano", "Lucía Ramos", ["Mis reportes", "Nuevo reporte"]],
    ["Supervisor", "Rosa Medina", ["Panel", "Reportes de zona"]],
    ["Trabajador", "Carlos Vega", ["Mis tareas"]],
  ]) {
    test(`demo ${rol}: nombre, rol y navegación`, async ({ page }) => {
      await loginDemo(page, rol);
      await expect(page.locator("#uName")).toHaveText(nombre);
      await expect(page.locator("#uRole")).toHaveText(`${rol} (demo)`);
      await expect(page.locator("#nav .nav")).toHaveText(navs);
      await expect(page.locator("#nav .nav.active")).toHaveText(navs[0]);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(navs[0]);
    });
  }

  test("la sesión persiste al recargar y se cierra con logout", async ({ page }) => {
    await loginDemo(page, "Supervisor");
    await page.reload();
    await expect(page.locator("#appView")).toBeVisible();
    await expect(page.locator("#uName")).toHaveText("Rosa Medina");
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page.locator("#loginView")).toBeVisible();
    await page.reload();
    await expect(page.locator("#loginView")).toBeVisible();
  });
});
