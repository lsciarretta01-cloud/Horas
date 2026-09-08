// Horas trabajadas — service worker
// Estrategia: RED PRIMERO, copia guardada como respaldo.
// Así, al subir un index.html nuevo, el celular lo toma enseguida;
// y si no hay señal, sigue funcionando con la última copia guardada.

const CACHE = "horas-v4";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // dolarapi y externos van directo a la red

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Guardamos una copia fresca para cuando no haya señal
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() =>
        // Sin internet: servimos la última copia guardada
        caches.match(e.request).then((hit) => hit || caches.match("./index.html"))
      )
  );
});
