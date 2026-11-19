import { test, expect, loginDemo, items, drawer, toast } from "./fixtures.js";

const kpi = (page, label) => page.locator(".kpi", { hasText: label }).locator("b");

test.describe("Supervisor", () => {
  test.beforeEach(async ({ page }) => loginDemo(page, "Supervisor"));

  test("panel con KPIs, pendientes y barras por tipo", async ({ page }) => {
    await expect(kpi(page, "Total")).toHaveText("5");
    await expect(kpi(page, "Pendientes")).toHaveText("2");
    await expect(kpi(page, "En progreso")).toHaveText("1");
    await expect(kpi(page, "Resueltos")).toHaveText("2");
    await expect(page.locator(".kpi.warn")).toContainText("Pendientes");
    await expect(items(page)).toHaveCount(2);
    await expect(page.locator(".types .tbh")).toHaveText(["Residuos sólidos2", "Maleza2", "Barrido1"]);
    await expect(page.locator(".bar i").first()).toHaveAttribute("style", "width:100%");
    await expect(page.locator(".bar i").last()).toHaveAttribute("style", "width:50%");
  });

  test("exportar PDF en demo avisa que requiere servidor", async ({ page }) => {
    await page.getByRole("button", { name: "Exportar PDF" }).click();
    await expect(toast(page, "La exportación PDF requiere el servidor real")).toBeVisible();
  });

  test("asigna un reporte pendiente desde el panel", async ({ page }) => {
    await items(page).first().click();
    await expect(drawer(page).locator("h2")).toHaveText("Acumulación de basura en la esquina del parque");
    await expect(drawer(page).locator("#w option")).toHaveText(["Carlos Vega", "María Quispe", "Luis Castro"]);
    await drawer(page).locator("#w").selectOption("2");
    await drawer(page).locator("#ins").fill("Recoger con camión");
    await drawer(page).getByRole("button", { name: "Asignar tarea" }).click();
    await expect(toast(page, "Tarea asignada")).toBeVisible();
    await expect(drawer(page)).toHaveCount(0);
    await expect(kpi(page, "Pendientes")).toHaveText("1");
    await expect(kpi(page, "En progreso")).toHaveText("2");
    await expect(items(page)).toHaveCount(1);
  });

  test("reportes de zona: filtros por estado y tipo", async ({ page }) => {
    await page.locator("#nav .nav", { hasText: "Reportes de zona" }).click();
    await expect(items(page)).toHaveCount(5);
    await expect(page.locator("#main .sub")).toContainText("5 reportes.");
    await page.locator('.filters[data-g="estados"] .chip', { hasText: "Pendiente" }).click();
    await expect(items(page)).toHaveCount(2);
    await expect(page.locator("#main .sub")).toContainText("2 reportes.");
    await expect(page.locator('.filters[data-g="estados"] .chip.on')).toHaveText("Pendiente");
    await page.locator('.filters[data-g="tipos"] .chip', { hasText: "Maleza" }).click();
    await expect(page.locator("#main .empty")).toContainText("Ningún reporte coincide con estos filtros.");
    await page.locator('.filters[data-g="estados"] .chip', { hasText: "Pendiente" }).click();
    await expect(items(page)).toHaveCount(2);
    await expect(page.locator("#main .sub")).toContainText("2 reportes.");
  });

  test("reportes de zona: Quitar filtros vuelve a mostrar todos", async ({ page }) => {
    await page.locator("#nav .nav", { hasText: "Reportes de zona" }).click();
    await page.locator('.filters[data-g="estados"] .chip', { hasText: "Pendiente" }).click();
    await page.locator('.filters[data-g="tipos"] .chip', { hasText: "Maleza" }).click();
    await expect(items(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Quitar filtros" }).click();
    await expect(items(page)).toHaveCount(5);
    await expect(page.locator(".filters .chip.on")).toHaveCount(0);
  });

  test("un reporte ya asignado no muestra el formulario de asignación", async ({ page }) => {
    await page.locator("#nav .nav", { hasText: "Reportes de zona" }).click();
    await items(page).nth(1).click();
    await expect(drawer(page).locator("dl")).toContainText("Carlos Vega");
    await expect(drawer(page).locator(".assign")).toHaveCount(0);
  });
});
