/** Punto de entrada: pantalla de login, eventos globales y restauración de sesión. */
import { DEMO_USERS } from "./config.js";
import { clearSession, getCustomApiBase, loadSession, setApiBase } from "./state.js";
import { decodeJwt } from "./utils.js";
import { $, $$, closeLayer, enableKeyboardActivation, toast } from "./ui/dom.js";
import { createAuthApi } from "./api/auth.js";
import { enter, go, http } from "./router.js";
import { createDemoStore } from "./data/demo.js";
import { renderImpact } from "./ui/impact.js";

const auth = createAuthApi(http);

/* ---------- servidor API configurable (campo opcional en el login) ---------- */
const apiInput = $("#apiBase");
if (apiInput) {
  apiInput.value = getCustomApiBase();
  apiInput.addEventListener("change", (e) => setApiBase(e.target.value));
}

/* ---------- login / registro ---------- */
let registering = false;

function setRegisterMode(on) {
  registering = on;
  $("#regFields").classList.toggle("hidden", !on);
  $("#authTitle").textContent = on ? "Crea tu cuenta" : "Inicia sesión";
  $("#authBtn").textContent = on ? "Registrarme" : "Ingresar";
  $("#toggleAuth").textContent = on ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate";
}

$("#toggleAuth").addEventListener("click", () => setRegisterMode(!registering));

$("#authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target));
  try {
    if (registering) await auth.register(form);
    const { accessToken, role } = await auth.authenticate(form);
    const claims = decodeJwt(accessToken);
    enter({
      token: accessToken,
      role: role || "CIUDADANO",
      name: claims.name || form.firstname || form.email.split("@")[0],
      uid: claims.id,
    });
  } catch {
    toast("No se pudo conectar: revisa credenciales o el servidor API");
  }
});

/* ---------- portada: cifras de impacto con los datos demo ---------- */
renderImpact($("#impact"), createDemoStore());

/* ---------- modo demo ---------- */
for (const button of $$("[data-demo]")) {
  const role = button.dataset.demo;
  button.addEventListener("click", () => enter({ demo: true, role, name: DEMO_USERS[role] }));
}

$("#logout").addEventListener("click", () => {
  clearSession();
  location.reload();
});

/* ---------- acciones declarativas en el HTML generado ---------- */
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-go], [data-action]");
  if (!target) return;
  if (target.dataset.go) go(target.dataset.go);
  else if (target.dataset.action === "close-layer") closeLayer();
});
enableKeyboardActivation();

/* ---------- sesión guardada ---------- */
const saved = loadSession();
if (saved) enter(saved);
