import { test, expect, loginDemo, items, drawer, toast } from "./fixtures.js";

test.describe("Trabajador", () => {
  test.beforeEach(async ({ page }) => loginDemo(page, "Trabajador"));

  test("lista sus tareas y cuántas quedan", async ({ page }) => {
    await expect(items(page)).toHaveCount(3);
    await expect(page.locator("#main .sub")).toHaveText("Tienes 2 tareas por atender.");
    await page.locator("#main .chip", { hasText: "Resuelto" }).click();
    await expect(items(page)).toHaveCount(1);
  });

  test("una tarea resuelta no muestra el formulario", async ({ page }) => {
    await items(page).nth(2).click();
    await expect(drawer(page).locator("h2")).toHaveText("Barrido de ciclovía");
    await expect(drawer(page).locator("#cmp")).toHaveCount(0);
  });

  test("completa una tarea con evidencia", async ({ page }) => {
    await items(page).nth(1).click();
    await drawer(page).getByRole("button", { name: "Completar tarea" }).click();
    await expect(toast(page, "Adjunta una foto de evidencia")).toBeVisible();
    await drawer(page).locator("#evf").setInputFiles({ name: "ev.png", mimeType: "image/png", buffer: Buffer.from("x") });
    await expect(drawer(page).locator("#evp img")).toHaveCount(1);
    await drawer(page).getByRole("button", { name: "Completar tarea" }).click();
    await expect(toast(page, "Tarea completada")).toBeVisible();
    await expect(drawer(page)).toHaveCount(0);
    await expect(page.locator("#main .sub")).toHaveText("Tienes 1 tarea por atender.");
  });

  test("el estado vacío filtrado ofrece volver a todas las tareas", async ({ page }) => {
    await items(page).nth(1).click();
    await drawer(page).locator("#evf").setInputFiles({ name: "ev.png", mimeType: "image/png", buffer: Buffer.from("x") });
    await drawer(page).getByRole("button", { name: "Completar tarea" }).click();
    await expect(drawer(page)).toHaveCount(0);
    await page.locator("#main .chip", { hasText: "Pendiente" }).click();
    await expect(page.locator("#main .empty")).toContainText("No tienes tareas en estado “Pendiente”.");
    await page.locator("#main .empty").getByRole("button", { name: "Ver todas mis tareas" }).click();
    await expect(items(page)).toHaveCount(3);
    await expect(page.locator("#main .chip.on")).toHaveText("Todas");
  });
});
