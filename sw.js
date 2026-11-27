// Service worker : app utilisable hors ligne. Réseau d'abord (pour recevoir
// les mises à jour poussées sur GitHub), cache en secours.
const CACHE = "bagaschool-v0.9.0";
const ASSETS = ["./", "index.html", "css/app.css", "js/app.js", "js/db.js", "js/competences.js", "js/outils.js", "js/imprimer.js", "js/decouvrir.js", "js/data/geo.js", "js/data/calendrier.js", "js/jeux.js", "js/motsmeles.js", "js/sync.js", "js/telecommande.js", "js/config.js", "js/compte.js", "js/vendor/supabase.js", "js/installer.js", "js/outils2.js", "js/anglais.js", "js/data/issr.js", "js/distance.js", "js/annoter.js", "js/barre.js", "css/barre.css", "js/ressources.js", "js/vendor/qrcode.mjs", "js/vendor/jsQR.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => {
    const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
