/** Mapa para elegir ubicación (Leaflet), geocodificación inversa y geolocalización. */
import { MAP } from "../config.js";

/** Convierte la respuesta de Nominatim en una dirección corta ("Av. España 1234"). */
export function formatAddress(geo = {}) {
  const a = geo.address || {};
  return [a.road, a.house_number].filter(Boolean).join(" ") || (geo.display_name || "").split(",").slice(0, 2).join(",");
}

/** Dirección aproximada de unas coordenadas usando Nominatim. */
export async function reverseGeocode(lat, lng, fetchImpl = (...args) => globalThis.fetch(...args)) {
  const url = `${MAP.reverseGeocodeUrl}?format=json&lat=${lat}&lon=${lng}&accept-language=es`;
  const response = await fetchImpl(url);
  return formatAddress(await response.json());
}

/** Posición actual del dispositivo como promesa. */
export function currentPosition(options = { enableHighAccuracy: true, timeout: 10000 }) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocalización no soportada"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      reject,
      options,
    );
  });
}

/**
 * Crea un mapa Leaflet en `el` que avisa con `onPick(lat, lng)` cuando el usuario toca un punto.
 * @returns {{ mark(lat:number, lng:number, recenter?:boolean): void }}
 */
export function createLocationPicker(el, { onPick }) {
  const L = globalThis.L;
  const map = L.map(el).setView(MAP.center, MAP.zoom);
  L.tileLayer(MAP.tiles, { attribution: MAP.attribution }).addTo(map);
  let marker;

  map.on("click", (e) => onPick(e.latlng.lat, e.latlng.lng));
  // El contenedor recién se insertó en el DOM: recalcular el tamaño cuando ya tenga layout.
  setTimeout(() => map.invalidateSize(), 50);

  return {
    mark(lat, lng, recenter = false) {
      if (marker) marker.setLatLng([lat, lng]);
      else marker = L.marker([lat, lng]).addTo(map);
      if (recenter) map.setView([lat, lng], MAP.pickZoom);
    },
  };
}
