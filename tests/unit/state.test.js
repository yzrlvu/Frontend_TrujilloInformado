import { beforeEach, describe, expect, it } from "vitest";
import { API_DEFAULT, STORAGE_KEYS } from "../../js/config.js";
import { clearSession, getApiBase, getCustomApiBase, loadSession, normalizeRole, saveSession, setApiBase } from "../../js/state.js";
import { formatAddress } from "../../js/services/map.js";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("normalizeRole", () => {
  it.each([
    ["ROLE_SUPERVISOR", "SUPERVISOR"],
    ["trabajador", "TRABAJADOR"],
    ["CIUDADANO", "CIUDADANO"],
    ["ADMIN", "CIUDADANO"],
    [undefined, "CIUDADANO"],
  ])("%s → %s", (input, expected) => expect(normalizeRole(input)).toBe(expected));
});

describe("sesión", () => {
  it("guarda solo los campos persistentes y la restaura", () => {
    saveSession({ token: "t", role: "SUPERVISOR", demo: false, name: "Rosa", uid: 3, view: "panel", filters: {} });
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEYS.session))).toEqual({ token: "t", role: "SUPERVISOR", demo: false, name: "Rosa", uid: 3 });
    expect(loadSession()).toMatchObject({ token: "t", name: "Rosa" });
  });

  it("ignora sesiones sin token ni demo, o corruptas", () => {
    expect(loadSession()).toBeNull();
    sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ role: "CIUDADANO" }));
    expect(loadSession()).toBeNull();
    sessionStorage.setItem(STORAGE_KEYS.session, "{roto");
    expect(loadSession()).toBeNull();
  });

  it("acepta sesiones demo y se borra con clearSession", () => {
    saveSession({ demo: true, role: "CIUDADANO", name: "Lucía" });
    expect(loadSession()).toMatchObject({ demo: true });
    clearSession();
    expect(loadSession()).toBeNull();
  });
});

describe("URL de la API", () => {
  it("usa Heroku por defecto", () => {
    expect(getApiBase()).toBe(API_DEFAULT);
    expect(API_DEFAULT).toMatch(/^https:\/\/.*herokuapp\.com$/);
    expect(getCustomApiBase()).toBe("");
  });

  it("respeta la URL configurada y quita la barra final", () => {
    setApiBase("http://localhost:8080/");
    expect(getApiBase()).toBe("http://localhost:8080");
    expect(getCustomApiBase()).toBe("http://localhost:8080/");
  });
});

describe("formatAddress", () => {
  it("prefiere calle y número", () => {
    expect(formatAddress({ address: { road: "Av. España", house_number: "12" } })).toBe("Av. España 12");
  });
  it("cae en las dos primeras partes de display_name", () => {
    expect(formatAddress({ address: {}, display_name: "Plaza de Armas, Centro, Trujillo, Perú" })).toBe("Plaza de Armas, Centro");
  });
  it("devuelve vacío sin datos", () => {
    expect(formatAddress()).toBe("");
  });
});
