/** Vistas del rol CIUDADANO: "Mis reportes" y "Nuevo reporte". */
import { STATUS, TYPES } from "../config.js";
import { esc } from "../utils.js";
import { $, $$, closeLayer, mainEl, onItemClick, openLayer, renderError, renderLoading, renderMain, toast } from "../ui/dom.js";
import { detail, listHTML, pageHead, ratingBlock, reportItem, statusFilter } from "../ui/components.js";
import { ICON_PIN, typeIcon } from "../ui/icons.js";
import { createLocationPicker, currentPosition, reverseGeocode } from "../services/map.js";

const CREATE_BUTTON = `<button class="btn primary" data-go="nuevo">Crear reporte</button>`;

/** @param {{repo: object}} ctx */
export async function misReportes(ctx, estado = "") {
  renderLoading();
  try {
    const items = await ctx.repo.misReportes(estado);
    const empty = estado
      ? `<p>No tienes reportes en estado “${STATUS[estado]}”.</p>`
      : `<p>Aún no tienes reportes. Cuando veas un problema en tu barrio, repórtalo aquí.</p>${CREATE_BUTTON}`;

    renderMain(`${pageHead("Mis reportes", "Sigue el recorrido de cada problema que reportaste.", CREATE_BUTTON)}
    ${statusFilter(estado, "Todos")}${listHTML(items, reportItem, empty)}`);

    const root = mainEl();
    for (const chip of $$("[data-s]", root)) chip.addEventListener("click", () => misReportes(ctx, chip.dataset.s));
    onItemClick(root, items, (r) => showReport(ctx, r, () => misReportes(ctx, estado)));
  } catch (e) {
    renderError(e);
  }
}

function showReport(ctx, report, onRated) {
  const panel = openLayer(detail(report, report.status === "RESUELTO" ? ratingBlock(report.rating) : ""));
  for (const star of $$(".stars button", panel)) {
    star.addEventListener("click", async () => {
      try {
        await ctx.repo.calificar(report, Number(star.dataset.n));
        toast("¡Gracias por tu calificación!");
        closeLayer();
        onRated();
      } catch {
        toast("No se pudo calificar");
      }
    });
  }
}

const reportFormHTML = () => `${pageHead("Nuevo reporte", "Cuéntanos qué viste y dónde. Toma menos de un minuto.")}
    <form class="form" id="rf">
      <label>¿Qué tipo de problema es?</label>
      <div class="filters tp" id="tp" role="group" aria-label="Tipo de problema">${Object.entries(TYPES)
        .map(([k, l], i) => `<button type="button" class="chip ${i ? "" : "on"}" data-k="${k}">${typeIcon(k)}<span>${l}</span></button>`)
        .join("")}</div>
      <label for="desc">Descripción</label><textarea id="desc" name="description" rows="3" required placeholder="Ej. Basura acumulada junto al paradero"></textarea>
      <label for="addr">Dirección o referencia</label>
      <div class="addr"><input name="address" id="addr" required placeholder="Av. España 1234"><button type="button" class="btn" id="geo" title="Usar mi ubicación">${ICON_PIN}<span>Mi ubicación</span></button></div>
      <div id="map"></div><p class="hint" id="lh">Toca el mapa para marcar el lugar exacto, o usa tu ubicación.</p>
      <label for="ph">Fotos (opcional)</label><input type="file" accept="image/*" multiple id="ph"><div class="photos" id="pv"></div>
      <div class="actions"><button type="button" class="btn ghost" data-go="mis">Cancelar</button><button class="btn primary">Enviar reporte</button></div>
    </form>`;

/** @param {{repo: object, go: (view: string) => void}} ctx */
export function nuevoReporte(ctx) {
  const photos = [];
  let location = {};

  renderMain(reportFormHTML());

  // Tipo de problema: selección única
  const typeChips = $$("#tp .chip");
  for (const chip of typeChips) {
    chip.addEventListener("click", () => {
      typeChips.forEach((c) => c.classList.remove("on"));
      chip.classList.add("on");
    });
  }

  // Ubicación: mapa + geocodificación inversa
  const setLocation = async (lat, lng, recenter = false) => {
    location = { lat, lng };
    picker.mark(lat, lng, recenter);
    $("#lh").textContent = `Ubicación: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    try {
      $("#addr").value = await reverseGeocode(lat, lng);
    } catch {
      /* sin red o sin resultado: se conserva lo escrito por el usuario */
    }
  };
  const picker = createLocationPicker($("#map"), { onPick: setLocation });

  $("#geo").addEventListener("click", async () => {
    if (!navigator.geolocation) return toast("Tu navegador no soporta ubicación");
    toast("Obteniendo ubicación…");
    try {
      const { lat, lng } = await currentPosition();
      setLocation(lat, lng, true);
    } catch {
      toast("No se pudo obtener la ubicación; márcala en el mapa");
    }
  });

  // Fotos: se suben al elegirlas
  $("#ph").addEventListener("change", async (e) => {
    for (const file of e.target.files) {
      try {
        const url = await ctx.repo.subir(file, "reporte");
        photos.push(url);
        $("#pv").insertAdjacentHTML("beforeend", `<img src="${esc(url)}" alt="Foto adjunta">`);
      } catch {
        toast("No se pudo subir la foto (revisa Cloudinary)");
      }
    }
  });

  $("#rf").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target));
    if (location.lat == null) return toast("Marca la ubicación en el mapa");
    try {
      await ctx.repo.crearReporte({
        type: $("#tp .chip.on").dataset.k,
        description: form.description,
        location: { ...location, address: form.address },
        photos,
      });
      toast("Reporte enviado");
      ctx.go("mis");
    } catch (err) {
      toast(/zona/i.test(err.message) ? "Esa ubicación está fuera de las zonas de SEGAT" : "No se pudo enviar: " + err.message.slice(0, 90));
    }
  });
}
