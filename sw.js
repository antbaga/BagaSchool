// Service worker : app utilisable hors ligne. Réseau d'abord (pour recevoir
// les mises à jour poussées sur GitHub), cache en secours.
const CACHE = "bagaschool-v0.21.1";
const ASSETS = ["./", "index.html", "css/app.css", "css/francais.css", "css/mesures.css", "css/geo.css", "js/niveau.js", "js/francais.js", "js/fluence.js", "js/data/fluence-textes.js", "js/mesures.js", "js/geo.js", "js/app.js", "js/db.js", "js/competences.js", "js/outils.js", "js/imprimer.js", "js/decouvrir.js", "js/data/geo.js", "js/data/calendrier.js", "js/jeux.js", "js/motsmeles.js", "js/sync.js", "js/telecommande.js", "js/config.js", "js/compte.js", "js/vendor/supabase.js", "js/installer.js", "js/outils2.js", "js/rituels.js", "js/data/mots.js", "js/anglais.js", "js/data/issr.js", "js/distance.js", "js/annoter.js", "js/barre.js", "css/barre.css", "js/ressources.js", "js/vendor/qrcode.mjs", "js/vendor/jsQR.js", "js/sphere.js", "img/planetes/soleil.jpg", "img/planetes/mercure.jpg", "img/planetes/venus.jpg", "img/planetes/terre.jpg", "img/planetes/mars.jpg", "img/planetes/jupiter.jpg", "img/planetes/saturne.jpg", "img/planetes/saturne-anneaux.png", "img/planetes/uranus.jpg", "img/planetes/neptune.jpg", "css/decouvrir.css", "css/dk-geo.css", "css/dk-monde.css", "css/dk-histoire.css", "css/dk-sciences.css", "css/dk-arts.css", "js/decouvrir/kit.js", "js/decouvrir/index.js", "js/decouvrir/geo-france.js", "js/decouvrir/monde.js", "js/decouvrir/histoire.js", "js/decouvrir/electricite.js", "js/decouvrir/arts.js", "js/data/decouvrir/arts-oeuvres.js", "js/data/decouvrir/arts-vocab.js", "js/data/decouvrir/elec-donnees.js", "js/data/decouvrir/geo-departements.js", "js/data/decouvrir/geo-fleuves.js", "js/data/decouvrir/geo-infos.js", "js/data/decouvrir/geo-relief.js", "js/data/decouvrir/histoire-reperes.js", "js/data/decouvrir/monde-carte.js", "js/data/decouvrir/monde-infos.js", "js/data/decouvrir/monde-physique.js", "img/decouvrir/relief-france.webp", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "js/partage.js", "css/partage.css"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))); self.skipWaiting(); });
// Images d'œuvres (histoire des arts) chargées depuis Wikimedia : cache à part, gardé entre les versions.
const IMG_CACHE = "bagaschool-images";
const IMG_HOSTS = ["upload.wikimedia.org"];
const API_HOSTS = ["fr.wikipedia.org", "commons.wikimedia.org"];
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== IMG_CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (IMG_HOSTS.includes(url.hostname)) {
    // cache d'abord : une image vue une fois reste disponible hors ligne
    e.respondWith(caches.open(IMG_CACHE).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (API_HOSTS.includes(url.hostname) && url.pathname === "/w/api.php") {
    e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); if (r.ok) caches.open(IMG_CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.open(IMG_CACHE).then((c) => c.match(e.request))));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => {
    const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
