import { test as base, expect } from "@playwright/test";

/**
 * Página aislada de servicios externos: los tiles de OSM se abortan y
 * Nominatim responde con una dirección fija, para que las pruebas sean deterministas.
 * Falla la prueba si la página lanza errores de JavaScript.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route(/tile\.openstreetmap\.org/, (r) => r.abort());
    await page.route(/nominatim\.openstreetmap\.org/, (r) =>
      r.fulfill({ json: { address: { road: "Av. España", house_number: "1234" } } }),
    );
    await use(page);
    expect(errors, "errores de JavaScript en la página").toEqual([]);
  },
});

export { expect };

/** Entra en modo demo con el rol indicado. */
export async function loginDemo(page, rol) {
  await page.goto("/");
  await page.getByRole("button", { name: rol, exact: true }).click();
  await expect(page.locator("#appView")).toBeVisible();
}

export const items = (page) => page.locator("#main .item");
export const drawer = (page) => page.locator(".drawer");
export const toast = (page, text) => page.locator(".toast", { hasText: text });
