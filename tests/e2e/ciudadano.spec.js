import { test, expect, loginDemo, items, drawer, toast } from "./fixtures.js";

test.describe("Ciudadano", () => {
  test.beforeEach(async ({ page }) => loginDemo(page, "Ciudadano"));

  test("lista sus reportes con su recorrido", async ({ page }) => {
    await expect(items(page)).toHaveCount(2);
    await expect(items(page).first()).toContainText("Acumulación de basura en la esquina del parque");
    await expect(items(page).first()).toContainText("Residuos sólidos");
    await expect(items(page).first().locator(".journey")).toHaveAttribute("aria-label", "Estado: Pendiente, paso 1 de 3");
  });

  test("filtra por estado y muestra estado vacío", async ({ page }) => {
    await page.locator("#main .chip", { hasText: "Resuelto" }).click();
    await expect(page.locator("#main .empty")).toContainText("No tienes reportes en estado “Resuelto”.");
    await expect(page.locator("#main .chip.on")).toHaveText("Resuelto");
    await page.locator("#main .chip", { hasText: "Todos" }).click();
    await expect(items(page)).toHaveCount(2);
  });

  test("el estado vacío filtrado ofrece volver a todos los reportes", async ({ page }) => {
    await page.locator("#main .chip", { hasText: "Resuelto" }).click();
    await page.locator("#main .empty").getByRole("button", { name: "Ver todos mis reportes" }).click();
    await expect(items(page)).toHaveCount(2);
    await expect(page.locator("#main .chip.on")).toHaveText("Todos");
  });

  test("abre y cierra el detalle", async ({ page }) => {
    await items(page).first().click();
    await expect(drawer(page)).toBeVisible();
    await expect(drawer(page).locator("h2")).toHaveText("Acumulación de basura en la esquina del parque");
    await expect(drawer(page).locator("dl")).toContainText("Av. España 1234");
    await expect(drawer(page).locator(".urg")).toHaveText("Alta");
    await expect(drawer(page).locator(".stars")).toHaveCount(0);
    await page.getByRole("button", { name: "Cerrar", exact: true }).click();
    await expect(drawer(page)).toHaveCount(0);
  });

  test("cierra el detalle tocando fuera", async ({ page }) => {
    await items(page).first().click();
    await page.locator(".overlay").click({ position: { x: 5, y: 5 } });
    await expect(drawer(page)).toHaveCount(0);
  });

  test("Enter sobre un reporte abre el detalle", async ({ page }) => {
    await items(page).nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(drawer(page).locator("h2")).toHaveText("Desmonte abandonado frente al colegio");
  });

  test("botón Crear reporte lleva al formulario", async ({ page }) => {
    await page.locator(".head").getByRole("button", { name: "Crear reporte" }).click();
    await expect(page.getByRole("heading", { name: "Nuevo reporte" })).toBeVisible();
    await expect(page.locator("#nav .nav.active")).toHaveText("Nuevo reporte");
    await page.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("heading", { name: "Mis reportes" })).toBeVisible();
  });

  test("crea un reporte marcando el mapa", async ({ page }) => {
    await page.locator("#nav .nav", { hasText: "Nuevo reporte" }).click();
    await expect(page.locator("#tp .chip.on")).toContainText("Residuos sólidos");
    await page.locator("#tp .chip", { hasText: "Maleza" }).click();
    await expect(page.locator("#tp .chip.on")).toHaveCount(1);
    await expect(page.locator("#tp .chip.on")).toContainText("Maleza");
    await page.locator("#desc").fill("Maleza en el parque <b>central</b>");
    await page.locator("#addr").fill("Jr. Bolívar 100");

    await page.getByRole("button", { name: "Enviar reporte" }).click();
    await expect(toast(page, "Marca la ubicación en el mapa")).toBeVisible();

    await page.locator("#map").click({ position: { x: 120, y: 120 } });
    await expect(page.locator("#lh")).toContainText("Ubicación: -8.");
    await expect(page.locator("#map .leaflet-marker-icon")).toHaveCount(1);
    await expect(page.locator("#addr")).toHaveValue("Av. España 1234");

    await page.locator("#ph").setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: Buffer.from("x") });
    await expect(page.locator("#pv img")).toHaveCount(1);

    await page.getByRole("button", { name: "Enviar reporte" }).click();
    await expect(toast(page, "Reporte enviado")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mis reportes" })).toBeVisible();
    await expect(items(page)).toHaveCount(3);
    await expect(items(page).first().locator("h3")).toHaveText("Maleza en el parque <b>central</b>");
    await expect(items(page).first()).toContainText("Maleza");
  });

  test("usa la geolocalización del navegador", async ({ page }) => {
    await page.locator("#nav .nav", { hasText: "Nuevo reporte" }).click();
    await page.getByRole("button", { name: "Mi ubicación" }).click();
    await expect(page.locator("#lh")).toHaveText("Ubicación: -8.11160, -79.02880");
    await expect(page.locator("#addr")).toHaveValue("Av. España 1234");
  });
});
