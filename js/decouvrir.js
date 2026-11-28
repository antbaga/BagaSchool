// Apps « Découvrir » : sciences et géographie, niveau école primaire.
// Même format que les outils : { id, nom, icone, couleur, desc, cat, mount(el, ctx) -> cleanup? }
// Les textes s'en tiennent à des faits simples et établis. Les schémas ne sont pas à l'échelle sauf mention.
import { REGIONS, TERRES } from "./data/geo.js";
import { chargerImage, dessinerSphere, figer, disqueAnneaux, dessinerAnneaux } from "./sphere.js";
import { CLIMAT } from "./decouvrir/climat.js";
import { moinsAnim } from "./anim.js";

const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function loop(fn) { let id, last = performance.now(); const f = (t) => { fn(Math.min(0.05, (t - last) / 1000), t); last = t; id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => cancelAnimationFrame(id); }
const reduced = moinsAnim;

// ---------- Système solaire ----------
// Textures : Solar System Scope (INOVE), CC BY 4.0, d'après les données de la NASA. Voir img/planetes/CREDITS.md.
const TEX = (n) => `img/planetes/${n}`;
const SOLEIL = {
  nom: "Le Soleil", tex: "soleil.jpg", c1: "#fff6b0", c2: "#ff9a3c", type: "Une étoile", h: 600,
  txt: "Le Soleil est une étoile : une énorme boule de gaz très chaude qui produit de la lumière et de la chaleur. Toutes les planètes tournent autour de lui.",
  faits: [["Diamètre", "environ 1,4 million de km (109 fois la Terre)"], ["Température de la surface", "environ 5 500 °C"], ["Sa lumière arrive sur Terre en", "environ 8 minutes"]],
  plus: "On pourrait mettre plus d'un million de Terres à l'intérieur du Soleil.",
};
const PLANETES = [
  { nom: "Mercure", tex: "mercure.jpg", c1: "#d8cfc4", c2: "#9b8f84", d: 0.38, p: 0.24, h: 1408, tilt: 0, type: "Planète rocheuse",
    km: "4 879 km", dist: "58 millions de km", an: "88 jours", jour: "59 jours", temp: "de −180 °C la nuit à 430 °C le jour", lunes: "aucune",
    txt: "C'est la planète la plus proche du Soleil et la plus petite du système solaire.",
    plus: "Elle n'a presque pas d'air pour garder la chaleur : il y fait très chaud le jour et très froid la nuit. Sa surface est couverte de cratères, comme la Lune." },
  { nom: "Vénus", tex: "venus.jpg", c1: "#ffe2a8", c2: "#e0a85a", d: 0.95, p: 0.62, h: -5832, tilt: 3, type: "Planète rocheuse",
    km: "12 104 km", dist: "108 millions de km", an: "225 jours", jour: "243 jours, en tournant à l'envers", temp: "environ 465 °C", lunes: "aucune",
    txt: "C'est la planète la plus chaude. On la voit souvent briller le soir ou le matin : on l'appelle « l'étoile du berger ».",
    plus: "Des nuages très épais cachent son sol. Elle tourne si lentement sur elle-même qu'un jour y dure plus longtemps qu'une année." },
  { nom: "Terre", tex: "terre.jpg", c1: "#8fd3ff", c2: "#2e7bd6", d: 1, p: 1, h: 24, tilt: 23.4, type: "Planète rocheuse", glow: true,
    km: "12 742 km", dist: "150 millions de km", an: "365 jours", jour: "24 heures", temp: "environ 15 °C en moyenne", lunes: "1 : la Lune",
    txt: "C'est notre planète. C'est la seule où l'on connaît la vie. Elle a un satellite naturel : la Lune.",
    plus: "L'eau recouvre environ 70 % de sa surface : vue de l'espace, elle est bleue." },
  { nom: "Mars", tex: "mars.jpg", c1: "#ffb08a", c2: "#d4553a", d: 0.53, p: 1.88, h: 24.6, tilt: 25.2, type: "Planète rocheuse",
    km: "6 779 km", dist: "228 millions de km", an: "687 jours (presque 2 ans)", jour: "24 h 37 min", temp: "environ −60 °C en moyenne", lunes: "2 : Phobos et Déimos",
    txt: "On l'appelle « la planète rouge » : son sol contient beaucoup de rouille (de l'oxyde de fer).",
    plus: "On y trouve le plus haut volcan connu du système solaire, Olympus Mons : environ 22 km de haut. Des robots y roulent pour l'étudier." },
  { nom: "Jupiter", tex: "jupiter.jpg", c1: "#f6dcb8", c2: "#c98f5a", d: 11.2, p: 11.9, h: 9.9, tilt: 3.1, type: "Géante gazeuse",
    km: "139 820 km", dist: "778 millions de km", an: "environ 12 ans", jour: "environ 10 heures", temp: "environ −110 °C en haut des nuages", lunes: "plus de 90",
    txt: "C'est la plus grande planète. Sa Grande Tache rouge est une tempête géante, plus grande que la Terre.",
    plus: "On pourrait mettre plus de 1 300 Terres à l'intérieur de Jupiter. C'est la planète qui tourne le plus vite sur elle-même." },
  { nom: "Saturne", tex: "saturne.jpg", c1: "#fbe9b7", c2: "#d6b26b", d: 9.4, p: 29.5, h: 10.7, tilt: 26.7, type: "Géante gazeuse", anneaux: true,
    km: "116 460 km", dist: "1,4 milliard de km", an: "environ 29 ans", jour: "environ 10 h 30", temp: "environ −140 °C", lunes: "plus de 270",
    txt: "Elle est célèbre pour ses anneaux, faits de morceaux de glace et de roche.",
    plus: "Ses anneaux sont très larges mais très fins. Saturne est si légère que, dans une baignoire géante, elle flotterait." },
  { nom: "Uranus", tex: "uranus.jpg", c1: "#c9f3f4", c2: "#6cc4cf", d: 4, p: 84, h: 17.2, tilt: 97.8, type: "Géante glacée",
    km: "50 724 km", dist: "2,9 milliards de km", an: "environ 84 ans", jour: "environ 17 heures", temp: "environ −195 °C", lunes: "une trentaine",
    txt: "Elle tourne sur elle-même couchée sur le côté.",
    plus: "C'est la première planète découverte avec un télescope, en 1781. Sa couleur bleu-vert vient d'un gaz, le méthane." },
  { nom: "Neptune", tex: "neptune.jpg", c1: "#a9c4ff", c2: "#3a5fd0", d: 3.9, p: 165, h: 16.1, tilt: 28.3, type: "Géante glacée",
    km: "49 244 km", dist: "4,5 milliards de km", an: "environ 165 ans", jour: "environ 16 heures", temp: "environ −200 °C", lunes: "16 connues",
    txt: "C'est la planète la plus éloignée du Soleil. Il y souffle des vents très violents.",
    plus: "Ses vents dépassent 2 000 km/h. Elle a été trouvée en 1846 grâce à des calculs, avant même d'être vue au télescope." },
];
const vitesseRot = (h) => Math.sign(h) * 0.5 * Math.min(2.2, Math.max(0.12, 24 / Math.abs(h)));

function systemeSolaire(el) {
  let vue = "orbites", play = !reduced(), vitesse = 1, noms = true, sel = 2, spin = 0, dirty = true, tps = 0;
  const ang = PLANETES.map((_, i) => i * 1.7 + 0.6);
  el.innerHTML = `
    <div class="tool-top wrap">
      <div class="seg"><button class="on" data-vue="orbites">🪐 Orbites</button><button data-vue="tailles">📏 Tailles</button></div>
      <button class="pill" id="pp">${play ? "⏸ Pause" : "▶ Lecture"}</button>
      <label class="inline">Vitesse <input type="range" id="sp" min="0.2" max="4" step="0.1" value="1" style="width:130px"></label>
      <label class="check"><input type="checkbox" id="nm" checked> Noms</label>
    </div>
    <div class="pills pl-bar"><button data-p="-1">☀️ Soleil</button>${PLANETES.map((p, i) => `<button data-p="${i}" class="${i === sel ? "on" : ""}"><i style="background:radial-gradient(circle at 35% 35%,${p.c1},${p.c2})"></i>${p.nom}</button>`).join("")}</div>
    <div class="explore explore-space">
      <div class="explore-main space-main"><canvas id="cv" class="space-cv" aria-label="Système solaire : touche une planète"></canvas></div>
      <aside class="explore-card ec-space" id="card"></aside>
    </div>
    <p class="muted center" id="note"></p>
    <p class="muted center credits">Textures : Solar System Scope (INOVE), d'après la NASA, licence CC BY 4.0.</p>`;
  const cv = el.querySelector("#cv"), g = cv.getContext("2d"), card = el.querySelector("#card"), note = el.querySelector("#note");
  let W = 600, H = 600, dpr = 1, c3 = null, g3 = null, S3 = 200;
  const imgs = {}; let anneaux = null, sprites = [], spriteSun = null, stars = null;
  const fit = () => {
    const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    W = Math.max(200, r.width); H = Math.max(200, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round((W * H) / 5000) }, () => [Math.random() * W, Math.random() * H, Math.random() < 0.15 ? 1.6 : 0.9, 0.25 + Math.random() * 0.5]);
    sprites = []; spriteSun = null; dirty = true;
  };
  const ro = new ResizeObserver(fit); ro.observe(cv);
  // ----- géométrie de la vue orbites : orbites en ellipses pour remplir un écran large (TBI)
  const geo = () => {
    const m = 0.06 * Math.min(W, H) + 18;
    const rx = W / 2 - m - 10, ry = Math.min(rx, H / 2 - m);
    const k = Math.min(rx, ry / 0.42) / 470;
    const flat = Math.max(0.42, Math.min(1, ry / rx));
    return { cx: W / 2, cy: H / 2, rx, flat, k };
  };
  const orbite = (i, G) => (0.2 + (i + 1) * 0.1) * G.rx; // 8 orbites régulières, du Soleil au bord
  const taille = (p, G) => (8 + Math.sqrt(p.d) * 8) * G.k * 1.3;
  const fs = () => Math.round(Math.max(14, Math.min(26, Math.min(W, H) * 0.028)));
  const pos = [];
  const lumiere = [-1, 0, 0.28];
  const sprite = (i, r) => {
    const key = Math.round(r * dpr);
    if (!sprites[i] || sprites[i].key !== key) sprites[i] = { key, c: imgs[i] ? figer(imgs[i], key / 2, { light: lumiere, amb: 0.26, limb: 0.1, roll: rad(PLANETES[i].tilt > 90 ? PLANETES[i].tilt : 0) }) : null };
    return sprites[i].c;
  };
  const boule = (x, y, r, p) => { const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); gr.addColorStop(0, p.c1); gr.addColorStop(1, p.c2); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = gr; g.fill(); };
  const fond = () => {
    const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    gr.addColorStop(0, "#262a63"); gr.addColorStop(1, "#0b0d26");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = "#fff";
    for (const [x, y, r, a] of stars) { g.globalAlpha = a; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
  };
  const etiquette = (txt, x, y, on) => {
    g.font = `800 ${fs()}px Nunito, system-ui, sans-serif`; g.textAlign = "center"; g.textBaseline = "top";
    g.lineJoin = "round"; g.lineWidth = 5; g.strokeStyle = "#0b0d26"; g.strokeText(txt, x, y);
    g.fillStyle = on ? "#ffe27a" : "#fff"; g.fillText(txt, x, y);
  };
  const selection = (x, y, r) => {
    g.save(); g.setLineDash([6, 6]); g.lineDashOffset = -tps * 18; g.lineWidth = 3; g.strokeStyle = "#ffe27a";
    g.beginPath(); g.arc(x, y, r + 8, 0, TAU); g.stroke(); g.restore();
  };
  const planete = (i, x, y, r, rot) => {
    const p = PLANETES[i];
    if (p.anneaux && anneaux) dessinerAnneaux(g, anneaux, x, y, r, { tilt: 0.3, moitie: "arriere" });
    const s = sprite(i, r);
    if (s) { g.save(); g.translate(x, y); g.rotate(rot); g.drawImage(s, -r, -r, 2 * r, 2 * r); g.restore(); } else boule(x, y, r, p);
    if (p.anneaux && anneaux) dessinerAnneaux(g, anneaux, x, y, r, { tilt: 0.3, moitie: "avant" });
  };
  const soleil = (x, y, r, halo = true) => {
    if (halo) {
      const gl = g.createRadialGradient(x, y, r * 0.8, x, y, r * 2.4);
      gl.addColorStop(0, "#ffcf5a88"); gl.addColorStop(1, "#ffcf5a00");
      g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 2.4, 0, TAU); g.fill();
    }
    if (imgs.sun) {
      const key = Math.min(2048, Math.round(r * dpr));
      if (!spriteSun || spriteSun.key !== key) spriteSun = { key, c: figer(imgs.sun, key, { amb: 1, limb: 0.45 }) };
      g.drawImage(spriteSun.c, x - r, y - r, 2 * r, 2 * r);
    } else boule(x, y, r, SOLEIL);
  };
  const drawOrbites = () => {
    const G = geo(); fond();
    const { cx, cy, flat } = G, rs = 46 * G.k * 1.15;
    g.lineWidth = 1.5; g.strokeStyle = "#ffffff30"; g.setLineDash([3, 7]);
    PLANETES.forEach((_, i) => { const R = orbite(i, G); g.beginPath(); g.ellipse(cx, cy, R, R * flat, 0, 0, TAU); g.stroke(); });
    g.setLineDash([]);
    const items = PLANETES.map((p, i) => { const R = orbite(i, G); return { i, x: cx + Math.cos(ang[i]) * R, y: cy + Math.sin(ang[i]) * R * flat, r: taille(p, G) }; });
    pos.length = 0;
    const order = [...items].sort((a, b) => a.y - b.y);
    let sunDone = false;
    for (const it of order) {
      if (!sunDone && it.y > cy) { soleil(cx, cy, rs); sunDone = true; }
      planete(it.i, it.x, it.y, it.r, Math.atan2(it.y - cy, it.x - cx));
      if (PLANETES[it.i].nom === "Terre") { // la Lune autour de la Terre
        const a = ang[it.i] * 13.4, lx = it.x + Math.cos(a) * it.r * 1.9, ly = it.y + Math.sin(a) * it.r * 1.9 * flat, lr = Math.max(2.5, it.r * 0.27);
        const gr = g.createRadialGradient(lx + lr * 0.4, ly, 0, lx, ly, lr); gr.addColorStop(0, "#f1efe6"); gr.addColorStop(1, "#8d8a80");
        g.beginPath(); g.arc(lx, ly, lr, 0, TAU); g.fillStyle = gr; g.fill();
      }
    }
    if (!sunDone) soleil(cx, cy, rs);
    if (sel === -1) selection(cx, cy, rs);
    for (const it of items) {
      if (sel === it.i) selection(it.x, it.y, it.r * (PLANETES[it.i].anneaux ? 1.5 : 1));
      if (noms) etiquette(PLANETES[it.i].nom, it.x, it.y + it.r * (PLANETES[it.i].anneaux ? 1.2 : 1) + 6, sel === it.i);
      pos.push({ i: it.i, x: it.x, y: it.y, r: Math.max(it.r * (PLANETES[it.i].anneaux ? 1.6 : 1), 24) });
    }
    pos.push({ i: -1, x: cx, y: cy, r: rs });
    if (noms) etiquette("Soleil", cx, cy + rs + 6, sel === -1);
  };
  const drawTailles = () => {
    fond();
    const gap = Math.max(14, W * 0.018), sunVis = W * 0.09;
    const somme = PLANETES.reduce((s, p) => s + 2 * p.d, 0);
    const e = Math.min((W - sunVis - gap * 9) / somme, H * 0.36 / 11.2);
    const cy = H * 0.5, rs = 109 * e;
    soleil(sunVis - rs, cy, rs, false);
    pos.length = 0; pos.push({ i: -1, x: sunVis - 20, y: cy, r: 40, rect: [0, 0, sunVis, H] });
    let x = sunVis + gap;
    PLANETES.forEach((p, i) => {
      const r = p.d * e; x += r;
      planete(i, x, cy, r, 0);
      if (sel === i) selection(x, cy, r * (p.anneaux ? 1.4 : 1));
      const lv = i < 4 ? Math.floor(i / 2) * fs() * 1.25 : 0; // petites planètes proches : étiquettes en quinconce
      if (noms) etiquette(p.nom, x, i % 2 ? cy - Math.max(r, 12) - 12 - fs() - lv : cy + Math.max(r, 12) + 12 + lv, sel === i);
      pos.push({ i, x, y: cy, r: Math.max(r, 22) });
      x += r + gap;
    });
    if (noms) { g.save(); g.translate(sunVis * 0.45, cy); g.rotate(-Math.PI / 2); etiquette("Soleil", 0, -fs() / 2, sel === -1); g.restore(); }
  };
  const draw = () => { if (vue === "orbites") drawOrbites(); else drawTailles(); };
  // ----- fiche avec la planète en 3D qui tourne
  const drawCard = () => {
    const o = sel === -1 ? SOLEIL : PLANETES[sel];
    const faits = sel === -1 ? SOLEIL.faits : [
      ["Place depuis le Soleil", `${sel + 1}<sup>${sel ? "e" : "re"}</sup>`], ["Diamètre", o.km],
      ["Taille comparée à la Terre", o.d === 1 ? "—" : o.d > 1 ? `${String(o.d).replace(".", ",")} fois plus grande` : `environ ${String(o.d).replace(".", ",")} fois sa taille`],
      ["Distance au Soleil", o.dist], ["Durée d'une année", o.an], ["Durée d'un tour sur elle-même", o.jour], ["Température", o.temp], ["Lunes", o.lunes]];
    card.innerHTML = `<div class="ec-head"><div><h3>${o.nom}</h3><span class="ec-type">${o.type}</span></div></div>
      <div class="ec-3d-wrap"><canvas class="ec-3d" id="c3"></canvas></div>
      <p class="ec-txt">${o.txt}</p>
      <dl class="ec-facts">${faits.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join("")}</dl>
      <p class="ec-plus"><b>Le savais-tu ?</b> ${o.plus}</p>`;
    c3 = card.querySelector("#c3"); g3 = c3.getContext("2d");
    const s = c3.getBoundingClientRect().width || 200; S3 = s; const d = Math.min(2, devicePixelRatio || 1);
    c3.width = Math.round(s * d); c3.height = Math.round(s * d); g3.setTransform(d, 0, 0, d, 0, 0);
    spin = sel === 2 ? rad(-10) : 0;
  };
  const drawPlanet3D = () => {
    if (!g3) return;
    const o = sel === -1 ? SOLEIL : PLANETES[sel], img = sel === -1 ? imgs.sun : imgs[sel], s = S3;
    g3.clearRect(0, 0, s, s);
    const roll = rad(o.tilt ?? 0), r = o.anneaux ? s * 0.2 : s * 0.4;
    if (!img) { const gr = g3.createRadialGradient(s * 0.4, s * 0.4, 2, s / 2, s / 2, r); gr.addColorStop(0, o.c1); gr.addColorStop(1, o.c2); g3.fillStyle = gr; g3.beginPath(); g3.arc(s / 2, s / 2, r, 0, TAU); g3.fill(); return; }
    const opts = sel === -1 ? { lon: spin, lat: 0.1, amb: 1, limb: 0.45 } : { lon: spin, lat: 0.3, roll, amb: 0.3, light: [-0.55, 0.3, 0.75], glow: o.glow ? 0.6 : 0, scale: o.glow ? 0.93 : 1 };
    if (o.anneaux && anneaux) dessinerAnneaux(g3, anneaux, s / 2, s / 2, r, { tilt: Math.sin(0.3) + 0.05, roll, moitie: "arriere" });
    dessinerSphere(g3, img, s / 2, s / 2, r, opts);
    if (o.anneaux && anneaux) dessinerAnneaux(g3, anneaux, s / 2, s / 2, r, { tilt: Math.sin(0.3) + 0.05, roll, moitie: "avant" });
  };
  const choisir = (i) => {
    sel = i; el.querySelectorAll(".pl-bar [data-p]").forEach((b) => b.classList.toggle("on", +b.dataset.p === i));
    drawCard(); dirty = true;
  };
  const setNote = () => { note.textContent = vue === "orbites" ? "Les distances et les tailles ne sont pas à l'échelle. Les vitesses respectent les durées des années." : "Ici, les tailles des planètes sont à l'échelle entre elles. Le Soleil est bien plus grand : on n'en voit qu'un morceau."; };
  const stop = loop((dt) => {
    tps += dt;
    if (play && vue === "orbites") { PLANETES.forEach((p, i) => { ang[i] += (dt * vitesse * 0.9) / p.p; }); dirty = true; }
    if (vue === "orbites") dirty = true; // l'anneau de sélection tourne
    if (dirty) { draw(); dirty = false; }
    if (!reduced()) { const o = sel === -1 ? SOLEIL : PLANETES[sel]; spin += dt * vitesseRot(o.h); }
    drawPlanet3D();
  });
  // chargement des textures (le dessin de secours en dégradés s'affiche en attendant)
  Promise.all(PLANETES.map((p, i) => chargerImage(TEX(p.tex)).then((im) => { imgs[i] = im; }).catch(() => {}))
    .concat(chargerImage(TEX(SOLEIL.tex)).then((im) => { imgs.sun = im; }).catch(() => {}))
    .concat(chargerImage(TEX("saturne-anneaux.png")).then((im) => { anneaux = disqueAnneaux(im); }).catch(() => {})))
    .then(() => { sprites = []; spriteSun = null; dirty = true; });
  cv.onclick = (e) => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bd = Infinity;
    for (const p of pos) {
      if (p.rect && x >= p.rect[0] && x <= p.rect[2]) { best = p; break; }
      const d = Math.hypot(x - p.x, y - p.y) - p.r;
      if (d < 14 && d < bd) { bd = d; best = p; }
    }
    if (best) choisir(best.i);
  };
  el.onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.p !== undefined) return choisir(+b.dataset.p);
    if (b.dataset.vue) { vue = b.dataset.vue; el.querySelectorAll("[data-vue]").forEach((x) => x.classList.toggle("on", x === b)); setNote(); dirty = true; }
    if (b.id === "pp") { play = !play; b.textContent = play ? "⏸ Pause" : "▶ Lecture"; }
  };
  el.oninput = (e) => { if (e.target.id === "sp") vitesse = +e.target.value; if (e.target.id === "nm") { noms = e.target.checked; dirty = true; } };
  const ro3 = new ResizeObserver(() => { if (c3) { const s = c3.getBoundingClientRect().width; if (s && Math.abs(s - S3) > 2) { const d = Math.min(2, devicePixelRatio || 1); S3 = s; c3.width = Math.round(s * d); c3.height = Math.round(s * d); g3.setTransform(d, 0, 0, d, 0, 0); } } });
  ro3.observe(card);
  fit(); setNote(); drawCard();
  return () => { stop(); ro.disconnect(); ro3.disconnect(); };
}

// ---------- Phases de la Lune ----------
const MOIS = 29.53;
const PHASES = [[1.8, "Nouvelle lune"], [6.4, "Premier croissant"], [8.4, "Premier quartier"], [13.8, "Lune gibbeuse croissante"], [15.8, "Pleine lune"], [21.1, "Lune gibbeuse décroissante"], [23.1, "Dernier quartier"], [27.7, "Dernier croissant"], [99, "Nouvelle lune"]];
function moonPath(phi, r) {
  // phi : 0 = nouvelle lune, PI = pleine lune. Partie éclairée vue depuis l'hémisphère Nord.
  const k = Math.cos(phi), rx = Math.abs(k) * r;
  const right = phi < Math.PI;
  const crescent = k > 0;
  const s1 = right ? 1 : 0;
  const s2 = right ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
  return `M0,${-r} A${r},${r} 0 0 ${s1} 0,${r} A${rx.toFixed(2)},${r} 0 0 ${s2} 0,${-r}Z`;
}
function lune(el) {
  let jour = 4, play = false;
  const rays = Array.from({ length: 7 }, (_, i) => `<line x1="-255" x2="-200" y1="${-150 + i * 50}" y2="${-150 + i * 50}" stroke="#ffd34d" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 10" class="ray"/>`).join("");
  el.innerHTML = `
    <div class="explore">
      <div class="explore-main moon-scene">
        <svg viewBox="-260 -200 520 400" class="moon-orbit" id="orb">
          ${rays}<text x="-250" y="-170" class="lbl">Lumière du Soleil →</text>
          <circle r="140" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-dasharray="4 8"/>
          <g id="terre"><circle r="34" fill="#2e7bd6"/><path d="M-14,-10 q10,-14 22,-4 q-4,12 -22,4z" fill="#6ccf7f"/><path d="M0,-34 A34,34 0 0 1 0,34 Z" fill="#0b1d3a" opacity=".55"/></g>
          <text y="56" class="lbl c">Terre</text>
          <g id="lu"><circle r="16" fill="#f2f0e6"/><path d="M0,-16 A16,16 0 0 1 0,16 Z" fill="#0b1d3a" opacity=".7"/><text y="34" class="lbl c">Lune</text></g>
        </svg>
      </div>
      <aside class="explore-card">
        <h3>Ce que l'on voit depuis la Terre</h3>
        <svg viewBox="-110 -110 220 220" class="moon-view" id="mv">
          <defs><radialGradient id="mg" cx="40%" cy="40%"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#e2dbbd"/></radialGradient>
            <clipPath id="mclip"><path id="mpc"/></clipPath></defs>
          <circle r="96" fill="#2a2f4a"/>
          <g clip-path="url(#mclip)"><circle r="96" fill="url(#mg)"/>
            <g fill="#8a8470" opacity=".22"><ellipse cx="-30" cy="-28" rx="26" ry="20"/><ellipse cx="12" cy="-40" rx="18" ry="14"/><ellipse cx="22" cy="8" rx="24" ry="18"/><ellipse cx="-22" cy="22" rx="16" ry="12"/><circle cx="-8" cy="62" r="8"/><circle cx="48" cy="40" r="6"/></g></g>
        </svg>
        <div class="moon-name" id="mn"></div>
        <p class="muted" id="md"></p>
      </aside>
    </div>
    <div class="tool-top wrap">
      <button class="pill" id="pp">▶ Animer</button>
      <input type="range" id="sl" min="0" max="${MOIS}" step="0.1" value="${jour}" class="wide-range" aria-label="Jour du cycle">
    </div>
    <p class="muted center">La Lune fait le tour de la Terre en environ 29 jours et demi. Elle ne produit pas de lumière : elle est éclairée par le Soleil, et on voit plus ou moins sa partie éclairée.</p>`;
  const lu = el.querySelector("#lu"), mpc = el.querySelector("#mpc"), mn = el.querySelector("#mn"), md = el.querySelector("#md"), sl = el.querySelector("#sl");
  // la Terre en vraie texture, éclairée par la gauche, une fois l'image chargée
  chargerImage("img/planetes/terre.jpg").then((im) => {
    const c = figer(im, 80, { lon: rad(10), lat: rad(25), light: [-1, 0, 0.2], amb: 0.14, roll: rad(23.4) });
    el.querySelector("#terre").innerHTML = `<image href="${c.toDataURL("image/png")}" x="-34" y="-34" width="68" height="68"/>`;
  }).catch(() => {});
  let txt = "";
  const draw = () => {
    const phi = (jour / MOIS) * TAU;
    // vue de dessus : Soleil à gauche ; nouvelle lune entre la Terre et le Soleil, sens inverse des aiguilles d'une montre vu du nord
    const a = Math.PI - phi;
    lu.setAttribute("transform", `translate(${(Math.cos(a) * 140).toFixed(1)},${(Math.sin(a) * 140).toFixed(1)})`);
    mpc.setAttribute("d", moonPath(phi, 96));
    const t = PHASES.find(([d]) => jour < d)[1] + "|" + Math.round(jour);
    if (t !== txt) { txt = t; mn.textContent = t.split("|")[0]; md.textContent = `Jour ${Math.round(jour)} du cycle`; }
  };
  const stop = loop((dt) => { if (play) { jour = (jour + dt * 2.5) % MOIS; sl.value = jour; draw(); } });
  el.oninput = (e) => { if (e.target.id === "sl") { jour = +e.target.value; draw(); } };
  el.onclick = (e) => { if (e.target.id === "pp") { play = !play; e.target.textContent = play ? "⏸ Pause" : "▶ Animer"; } };
  draw();
  return stop;
}

// ---------- Cycle de l'eau ----------
const ETAPES = [
  { n: "Évaporation", x: 150, y: 250, t: "Le Soleil chauffe l'eau des mers, des lacs et des rivières. Elle se transforme en vapeur d'eau, invisible, qui monte dans l'air." },
  { n: "Condensation", x: 330, y: 95, t: "En altitude, l'air est plus froid. La vapeur d'eau se transforme en minuscules gouttelettes qui forment les nuages." },
  { n: "Précipitations", x: 560, y: 150, t: "Les gouttelettes se regroupent et deviennent lourdes. Elles tombent en pluie, en neige ou en grêle." },
  { n: "Ruissellement", x: 520, y: 330, t: "Une partie de l'eau coule sur le sol, rejoint les ruisseaux et les rivières, puis la mer." },
  { n: "Infiltration", x: 690, y: 410, t: "Une autre partie de l'eau s'enfonce dans le sol et forme des nappes d'eau souterraines." },
];
function cycleEau(el) {
  let cur = 0, auto = null;
  el.innerHTML = `
    <div class="explore">
      <div class="explore-main"><svg viewBox="0 0 800 460" class="water-scene" id="ws">
        <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#eef9ff"/></linearGradient>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb3f0"/><stop offset="1" stop-color="#2c78c9"/></linearGradient></defs>
        <rect width="800" height="460" fill="url(#sky)"/>
        <g class="sunny"><circle cx="70" cy="70" r="40" fill="#ffd34d"/><circle cx="58" cy="64" r="4" fill="#7a4a1a"/><circle cx="82" cy="64" r="4" fill="#7a4a1a"/><path d="M58,80 q12,10 24,0" stroke="#7a4a1a" stroke-width="3" fill="none" stroke-linecap="round"/></g>
        <path d="M380,330 L520,150 L600,240 L660,170 L800,330 L800,460 L380,460 Z" fill="#8bcf7a"/>
        <path d="M520,150 L548,186 L530,182 L512,196 L496,182 Z M660,170 L684,200 L668,198 L650,206 L640,195 Z" fill="#fff"/>
        <path d="M380,330 L800,330 L800,460 L380,460Z" fill="#a8743f"/><path d="M380,330 L800,330 L800,350 L380,350Z" fill="#6fb85f"/>
        <path d="M0,320 L420,320 L420,460 L0,460Z" fill="url(#sea)"/>
        <path d="M610,240 C580,270 560,290 520,300 C480,310 450,316 410,322" stroke="#5fb3f0" stroke-width="10" fill="none" stroke-linecap="round" class="river"/>
        <rect x="430" y="420" width="370" height="40" fill="#5fb3f0" opacity=".45"/><text x="610" y="446" class="lbl c dark">nappe souterraine</text>
        <g class="evap">${[90, 160, 230, 300].map((x, i) => `<path d="M${x},310 q-10,-20 0,-40 q10,-20 0,-40" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" style="animation-delay:${i * 0.5}s"/>`).join("")}</g>
        <g class="cloud c1"><g transform="translate(330,90)"><ellipse rx="70" ry="30" fill="#fff"/><circle cx="-30" cy="-18" r="28" fill="#fff"/><circle cx="18" cy="-26" r="34" fill="#fff"/></g></g>
        <g class="cloud c2"><g transform="translate(570,95)"><ellipse rx="80" ry="32" fill="#dfe8f2"/><circle cx="-30" cy="-20" r="30" fill="#dfe8f2"/><circle cx="22" cy="-28" r="36" fill="#dfe8f2"/><circle cx="-12" cy="2" r="4" fill="#5c6b80"/><circle cx="12" cy="2" r="4" fill="#5c6b80"/></g></g>
        <path d="M410,80 C440,60 470,60 500,80" stroke="#fff" stroke-width="4" fill="none" stroke-dasharray="8 8" class="wind"/><path d="M490,72 l12,8 -14,4" stroke="#fff" stroke-width="4" fill="none"/>
        <g class="rain">${Array.from({ length: 14 }, (_, i) => `<line x1="${510 + (i % 7) * 18}" y1="${130 + Math.floor(i / 7) * 30}" x2="${504 + (i % 7) * 18}" y2="${146 + Math.floor(i / 7) * 30}" stroke="#3a8fe0" stroke-width="3" stroke-linecap="round" style="animation-delay:${(i % 5) * 0.15}s"/>`).join("")}</g>
        <g class="infil">${[650, 700, 750].map((x, i) => `<path d="M${x},355 l0,40 m-7,-8 l7,8 7,-8" stroke="#3a8fe0" stroke-width="3" fill="none" stroke-linecap="round" style="animation-delay:${i * 0.4}s"/>`).join("")}</g>
        ${reduced() ? "" : `<path id="trajet" d="M220,312 C220,250 260,150 330,118 C420,96 500,100 560,128 L608,238 C580,270 560,290 520,300 C480,310 450,316 410,322 C350,330 260,330 220,312" fill="none"/>
        <g class="goutte"><path d="M0,-13 C5,-5 9,1 9,5 A9,9 0 0 1 -9,5 C-9,1 -5,-5 0,-13Z" fill="#2f86de" stroke="#fff" stroke-width="2.5"/><circle cx="-3" cy="3" r="2.2" fill="#fff" opacity=".8"/>
          <animateMotion dur="14s" repeatCount="indefinite" rotate="0"><mpath href="#trajet"/></animateMotion></g>`}
        <g id="badges"></g>
      </svg></div>
      <aside class="explore-card" id="card"></aside>
    </div>
    <div class="tool-top"><button class="pill" id="prev">← Précédent</button><button class="big-btn" id="auto">▶ Étape par étape</button><button class="pill" id="next">Suivant →</button></div>`;
  const draw = () => {
    el.querySelector("#badges").innerHTML = ETAPES.map((s, i) => `<g class="badge-step ${i === cur ? "on" : ""}" data-s="${i}" transform="translate(${s.x},${s.y})"><circle r="20"/><text class="c">${i + 1}</text><text x="26" y="0" class="lbl step-name">${s.n}</text></g>`).join("");
    const s = ETAPES[cur];
    el.querySelector("#card").innerHTML = `<div class="step-num">${cur + 1}</div><h3>${s.n}</h3><p>${s.t}</p>
      <div class="dots">${ETAPES.map((_, i) => `<button class="dotb ${i === cur ? "on" : ""}" data-s="${i}" aria-label="Étape ${i + 1}"></button>`).join("")}</div>
      <p class="muted">L'eau fait ce voyage sans arrêt : c'est un cycle.</p>`;
  };
  const stopAuto = () => { clearInterval(auto); auto = null; const b = el.querySelector("#auto"); if (b) b.textContent = "▶ Étape par étape"; };
  el.onclick = (e) => {
    const s = e.target.closest("[data-s]"); if (s) { cur = +s.dataset.s; stopAuto(); draw(); return; }
    const b = e.target.closest("button"); if (!b) return;
    if (b.id === "next") { cur = (cur + 1) % ETAPES.length; stopAuto(); }
    if (b.id === "prev") { cur = (cur + ETAPES.length - 1) % ETAPES.length; stopAuto(); }
    if (b.id === "auto") { if (auto) stopAuto(); else { b.textContent = "⏸ Pause"; auto = setInterval(() => { cur = (cur + 1) % ETAPES.length; draw(); }, 4000); } }
    draw();
  };
  draw();
  return () => clearInterval(auto);
}

// ---------- États de l'eau ----------
function etatsEau(el) {
  let temp = 20;
  el.innerHTML = `
    <div class="explore">
      <div class="explore-main states">
        <div class="thermo"><div class="thermo-tube"><div class="thermo-fill" id="tf"></div></div><div class="thermo-bulb"></div>
          <div class="thermo-marks"><span style="bottom:${(120 / 140) * 100}%">100 °C</span><span style="bottom:${(20 / 140) * 100}%">0 °C</span></div></div>
        <canvas id="cv" class="particles"></canvas>
      </div>
      <aside class="explore-card" id="card"></aside>
    </div>
    <div class="tool-top wrap"><span class="temp-big" id="tv"></span><input type="range" id="sl" min="-20" max="120" step="1" value="${temp}" class="wide-range" aria-label="Température"></div>
    <p class="muted center">Températures valables à la pression habituelle, au niveau de la mer.</p>`;
  const cv = el.querySelector("#cv"), g = cv.getContext("2d");
  const N = 48;
  const P = Array.from({ length: N }, (_, i) => ({ gx: i % 8, gy: Math.floor(i / 8), x: 0, y: 0, vx: Math.random() - 0.5, vy: Math.random() - 0.5 }));
  let W = 300, H = 300;
  const fit = () => { const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1; W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(fit); ro.observe(cv);
  const etat = () => (temp < 0 ? "solide" : temp < 100 ? "liquide" : "gaz");
  const info = {
    solide: { t: "Solide : la glace", c: "#bfe6ff", txt: "En dessous de 0 °C, l'eau est solide. Les particules sont serrées et rangées : elles bougent à peine. La glace garde sa forme." },
    liquide: { t: "Liquide : l'eau", c: "#5fb3f0", txt: "Entre 0 °C et 100 °C, l'eau est liquide. Les particules restent proches mais glissent les unes sur les autres. L'eau prend la forme du récipient." },
    gaz: { t: "Gaz : la vapeur d'eau", c: "#e4e9f2", txt: "Au-dessus de 100 °C, l'eau bout et devient un gaz : la vapeur d'eau. Les particules sont éloignées et bougent très vite. La vapeur occupe tout l'espace." },
  };
  const card = () => {
    const s = etat(), i = info[s];
    el.querySelector("#card").innerHTML = `<h3>${i.t}</h3><p>${i.txt}</p>
      <div class="changes"><span class="${temp < 5 && temp > -5 ? "on" : ""}">Glace → eau : <b>fusion</b> (0 °C)</span><span class="${temp < 5 && temp > -5 ? "on" : ""}">Eau → glace : <b>solidification</b></span>
      <span class="${temp > 95 && temp < 105 ? "on" : ""}">Eau → vapeur : <b>vaporisation</b> (ébullition à 100 °C)</span><span class="${temp > 95 && temp < 105 ? "on" : ""}">Vapeur → eau : <b>condensation</b></span></div>`;
    el.querySelector("#tv").textContent = `${temp} °C`;
    el.querySelector("#tf").style.height = `${((temp + 20) / 140) * 100}%`;
    el.querySelector("#tf").style.background = temp < 0 ? "#5fb3f0" : temp < 100 ? "#f5b83d" : "#ef6461";
  };
  let last = "";
  const stop = loop((dt) => {
    const s = etat();
    if (s !== last) { last = s; card(); }
    g.clearRect(0, 0, W, H);
    const cell = Math.min(W, H) / 12, ox = W / 2 - cell * 3.5, oy = H - cell * 6.6;
    if (s === "liquide") { g.fillStyle = "#d8eeff"; g.fillRect(0, H * 0.45, W, H * 0.55); }
    const speed = s === "solide" ? 0 : s === "liquide" ? 40 + temp : 160 + temp * 1.2;
    P.forEach((p, i) => {
      if (s === "solide") {
        const tx = ox + p.gx * cell, ty = oy + p.gy * cell;
        p.x += (tx - p.x) * 0.15; p.y += (ty - p.y) * 0.15;
        p.dx = Math.sin(performance.now() / 90 + i) * (1 + (temp + 20) / 10); p.dy = Math.cos(performance.now() / 110 + i) * (1 + (temp + 20) / 10);
      } else {
        p.dx = 0; p.dy = 0;
        p.x += p.vx * speed * dt; p.y += p.vy * speed * dt;
        const top = s === "liquide" ? H * 0.45 + 8 : 8;
        if (p.x < 8 || p.x > W - 8) p.vx *= -1;
        if (p.y < top || p.y > H - 8) p.vy *= -1;
        p.x = Math.max(8, Math.min(W - 8, p.x)); p.y = Math.max(top, Math.min(H - 8, p.y));
        if (s === "liquide") p.vy += (Math.random() - 0.5) * 0.1, p.vx += (Math.random() - 0.5) * 0.1;
        const v = Math.hypot(p.vx, p.vy) || 1; p.vx /= v; p.vy /= v;
      }
      g.beginPath(); g.arc(p.x + (p.dx || 0), p.y + (p.dy || 0), cell * 0.38, 0, TAU);
      g.fillStyle = s === "solide" ? "#7cc4f5" : s === "liquide" ? "#2e7bd6" : "#9aa8c4"; g.fill();
      g.fillStyle = "#ffffff99"; g.beginPath(); g.arc(p.x + (p.dx || 0) - cell * 0.12, p.y + (p.dy || 0) - cell * 0.12, cell * 0.1, 0, TAU); g.fill();
    });
  });
  el.oninput = (e) => { if (e.target.id === "sl") { temp = +e.target.value; card(); } };
  setTimeout(() => P.forEach((p) => { p.x = Math.random() * W; p.y = H * 0.5 + Math.random() * H * 0.45; }), 30);
  card();
  return () => { stop(); ro.disconnect(); };
}

// ---------- Globe : continents et océans ----------
const CONTINENTS = {
  "Afrique": [[5, 20], [20, 10], [-20, 25], [15, 30]],
  "Europe": [[50, 10], [60, 30], [45, 0]],
  "Asie": [[45, 90], [30, 110], [60, 100], [20, 78], [35, 135], [30, 50]],
  "Amérique du Nord": [[45, -100], [65, -120], [20, -100], [72, -40]],
  "Amérique du Sud": [[-15, -60], [-35, -65], [0, -70]],
  "Océanie": [[-25, 135], [-42, 172], [-6, 145]],
  "Antarctique": [[-80, 0], [-80, 120], [-80, -120]],
};
const OCEANS = {
  "Océan Pacifique": [[0, -150], [-25, -120], [20, 160], [30, -140]],
  "Océan Atlantique": [[25, -40], [-20, -15], [45, -30]],
  "Océan Indien": [[-20, 80], [-5, 65]],
  "Océan Arctique": [[85, -40], [80, 100]],
  "Océan Austral": [[-62, 60], [-62, -120], [-62, 160]],
};
function pointInRing([lon, lat], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const isLand = (pt) => pt[1] < -72 || TERRES.some((r) => pointInRing(pt, r));
const gcDist = ([la1, lo1], [la2, lo2]) => Math.acos(Math.min(1, Math.sin(rad(la1)) * Math.sin(rad(la2)) + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.cos(rad(lo1 - lo2))));
function nearestName(lat, lon) {
  const set = isLand([lon, lat]) ? CONTINENTS : OCEANS;
  let best = null, bd = 9;
  for (const [n, pts] of Object.entries(set)) for (const p of pts) { const d = gcDist([lat, lon], p); if (d < bd) { bd = d; best = n; } }
  return best;
}
// Carte simple (terres vertes, mer bleue) peinte une fois en projection équirectangulaire,
// puis plaquée sur la sphère comme la photo. Les contours qui traversent la ligne ±180°
// sont « déroulés » et dessinés trois fois pour ne pas tracer de bande à travers la carte.
let carteCache = null;
function carteTerre() {
  if (carteCache) return carteCache;
  const w = 2048, h = 1024, c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d");
  const X = (lo) => ((lo + 180) / 360) * w, Y = (la) => ((90 - la) / 180) * h;
  g.fillStyle = "#3f8fdc"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#8bd17c"; g.strokeStyle = "#5fa55a"; g.lineWidth = 2.5; g.lineJoin = "round";
  for (const ring of TERRES) {
    let off = 0;
    const pts = ring.map(([lo, la], i) => { if (i) { const d = lo - ring[i - 1][0]; if (d > 180) off -= 360; else if (d < -180) off += 360; } return [lo + off, la]; });
    const a = pts[0], b = pts[pts.length - 1];
    if (Math.abs(b[0] - a[0]) > 180) { const pole = a[1] < 0 ? -90 : 90; pts.push([b[0], pole], [a[0], pole]); } // contour qui fait le tour d'un pôle
    for (const k of [-360, 0, 360]) {
      g.beginPath(); pts.forEach(([lo, la], i) => (i ? g.lineTo(X(lo + k), Y(la)) : g.moveTo(X(lo + k), Y(la)))); g.closePath(); g.fill(); g.stroke();
    }
  }
  carteCache = c; return c;
}
function globe(el) {
  let lon0 = -10, lat0 = 20, spin = !reduced(), drag = null, mode = "explorer", target = null, score = [0, 0], flash = null, labels = true, style = "photo", vlon = 0, photo = null;
  el.innerHTML = `
    <div class="tool-top wrap">
      <div class="seg"><button class="on" data-mode="explorer">🌍 Explorer</button><button data-mode="quiz">❓ Quiz</button></div>
      <div class="seg"><button class="on" data-style="photo">🛰️ Photo</button><button data-style="carte">🗺️ Carte</button></div>
      <button class="pill" id="sp">${spin ? "⏸ Arrêter" : "↻ Tourner"}</button>
      <label class="check"><input type="checkbox" id="lb" checked> Noms</label>
    </div>
    <div class="explore">
      <div class="explore-main space-main"><canvas id="cv" class="globe"></canvas></div>
      <aside class="explore-card" id="card"></aside>
    </div>
    <p class="muted center">Fais tourner le globe avec le doigt, le stylet ou la souris. Contours : Natural Earth. Photo : Solar System Scope (INOVE) d'après la NASA, CC BY 4.0.</p>`;
  const cv = el.querySelector("#cv"), g = cv.getContext("2d");
  let W = 400, H = 400, dpr = 1;
  const fit = () => { const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const ro = new ResizeObserver(fit); ro.observe(cv);
  chargerImage("img/planetes/terre.jpg").then((im) => { photo = im; }).catch(() => { style = "carte"; });
  const proj = (lat, lon, R, cx, cy) => {
    const φ = rad(lat), λ = rad(lon - lon0), φ0 = rad(lat0);
    const cosc = Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ);
    return [cx + R * Math.cos(φ) * Math.sin(λ), cy - R * (Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * Math.cos(φ) * Math.cos(λ)), cosc];
  };
  const inv = (x, y, R, cx, cy) => {
    const px = (x - cx) / R, py = -(y - cy) / R, ρ = Math.hypot(px, py);
    if (ρ > 1) return null;
    const c = Math.asin(ρ), φ0 = rad(lat0);
    const lat = ρ ? Math.asin(Math.cos(c) * Math.sin(φ0) + (py * Math.sin(c) * Math.cos(φ0)) / ρ) : φ0;
    const lon = rad(lon0) + Math.atan2(px * Math.sin(c), ρ * Math.cos(c) * Math.cos(φ0) - py * Math.sin(c) * Math.sin(φ0));
    return [(lat * 180) / Math.PI, ((((lon * 180) / Math.PI + 540) % 360) - 180)];
  };
  const geom = () => { const R = Math.min(W, H) * 0.43; return [R, W / 2, H / 2]; };
  const render = () => {
    const [R, cx, cy] = geom();
    g.clearRect(0, 0, W, H);
    const img = style === "photo" && photo ? photo : carteTerre();
    // la sphère entière est calculée pixel par pixel : plus de polygones coupés à l'horizon
    dessinerSphere(g, img, cx, cy, R, { lon: rad(lon0), lat: rad(lat0), amb: 0.62, light: [-0.45, 0.45, 0.77], limb: 0.12, glow: 0.55, scale: 0.92 });
    g.strokeStyle = "#ffffff38"; g.lineWidth = 1;
    for (let la = -60; la <= 60; la += 30) { g.beginPath(); let pen = false; for (let lo = -180; lo <= 180; lo += 3) { const [x, y, v] = proj(la, lo, R, cx, cy); if (v > 0) { pen ? g.lineTo(x, y) : g.moveTo(x, y); pen = true; } else pen = false; } g.stroke(); }
    for (let lo = -180; lo < 180; lo += 30) { g.beginPath(); let pen = false; for (let la = -90; la <= 90; la += 3) { const [x, y, v] = proj(la, lo, R, cx, cy); if (v > 0) { pen ? g.lineTo(x, y) : g.moveTo(x, y); pen = true; } else pen = false; } g.stroke(); }
    if (labels && mode === "explorer") {
      g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
      const k = Math.max(1, Math.min(1.9, R / 230));
      for (const [set, col, sz] of [[CONTINENTS, "#22331a", 16], [OCEANS, "#0d3b70", 14]]) for (const [n, pts] of Object.entries(set)) {
        const [x, y, v] = proj(pts[0][0], pts[0][1], R, cx, cy); if (v < 0.25) continue;
        g.globalAlpha = Math.min(1, (v - 0.25) * 4);
        g.font = `800 ${Math.round(sz * k)}px Nunito, system-ui, sans-serif`;
        g.lineWidth = 5; g.strokeStyle = "#ffffffdd"; g.strokeText(n, x, y); g.fillStyle = col; g.fillText(n, x, y);
      }
      g.globalAlpha = 1;
    }
    if (flash) {
      const [x, y, v] = proj(flash.lat, flash.lon, R, cx, cy);
      if (v > 0) { g.beginPath(); g.arc(x, y, 16, 0, TAU); g.fillStyle = flash.ok ? "#5cc87acc" : "#ef6461cc"; g.fill(); g.lineWidth = 3; g.strokeStyle = "#fff"; g.stroke(); }
    }
  };
  const card = (msg = "") => {
    const c = el.querySelector("#card");
    if (mode === "explorer") c.innerHTML = `<h3>Continents et océans</h3><p>Touche le globe pour savoir où tu es.</p>${msg ? `<div class="answer">${msg}</div>` : ""}
      <p class="muted">7 continents : Afrique, Amérique du Nord, Amérique du Sud, Antarctique, Asie, Europe, Océanie.</p><p class="muted">5 océans : Pacifique, Atlantique, Indien, Arctique, Austral.</p>`;
    else c.innerHTML = `<h3>Quiz</h3><p>Touche :</p><div class="quiz-target">${target}</div>${msg ? `<div class="answer">${msg}</div>` : ""}<p class="score">Score : <b>${score[0]}</b> / ${score[1]}</p><button class="pill" id="skip">Autre question</button>`;
  };
  const newQ = () => { const all = [...Object.keys(CONTINENTS), ...Object.keys(OCEANS)]; let n; do n = all[Math.floor(Math.random() * all.length)]; while (n === target); target = n; };
  const stop = loop((dt) => {
    if (!drag) {
      if (Math.abs(vlon) > 0.5) { lon0 -= vlon * dt; vlon *= Math.pow(0.04, dt); } // élan après un lancer
      else if (spin) lon0 -= dt * 8;
    }
    render();
  });
  let moved = false, lastMove = null;
  cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); drag = [e.clientX, e.clientY, lon0, lat0]; moved = false; vlon = 0; lastMove = [e.clientX, performance.now()]; };
  cv.onpointermove = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag[0], dy = e.clientY - drag[1];
    if (Math.hypot(dx, dy) > 6) moved = true;
    const [R] = geom(), now = performance.now();
    lon0 = drag[2] - (dx / R) * 60; lat0 = Math.max(-80, Math.min(80, drag[3] + (dy / R) * 60));
    const dts = (now - lastMove[1]) / 1000;
    if (dts > 0.004) { vlon = vlon * 0.5 + 0.5 * (((e.clientX - lastMove[0]) / R) * 60) / dts; lastMove = [e.clientX, now]; }
  };
  cv.onpointercancel = () => { drag = null; vlon = 0; };
  cv.onpointerup = (e) => {
    const was = drag; drag = null;
    if (!was) return;
    if (moved) { vlon = performance.now() - lastMove[1] > 80 ? 0 : Math.max(-400, Math.min(400, vlon)); return; }
    vlon = 0;
    const r = cv.getBoundingClientRect(), [R, cx, cy] = geom();
    const ll = inv(e.clientX - r.left, e.clientY - r.top, R, cx, cy); if (!ll) return;
    const name = nearestName(ll[0], ll[1]);
    if (mode === "explorer") { flash = { lat: ll[0], lon: ll[1], ok: true }; card(`Ici : <b>${name}</b>`); }
    else {
      const ok = name === target; score[1]++; if (ok) score[0]++;
      flash = { lat: ll[0], lon: ll[1], ok };
      card(ok ? `Bravo ! 🎉 C'est bien ${target}.` : `Non, ici c'est ${name}. Essaie encore !`);
      if (ok) setTimeout(() => { if (mode === "quiz") { newQ(); flash = null; card(); } }, 1600);
    }
  };
  el.onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mode) { mode = b.dataset.mode; el.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("on", x === b)); flash = null; if (mode === "quiz") { score = [0, 0]; newQ(); spin = false; el.querySelector("#sp").textContent = "↻ Tourner"; } card(); }
    if (b.dataset.style) { style = b.dataset.style; el.querySelectorAll("[data-style]").forEach((x) => x.classList.toggle("on", x === b)); }
    if (b.id === "sp") { spin = !spin; vlon = 0; b.textContent = spin ? "⏸ Arrêter" : "↻ Tourner"; }
    if (b.id === "skip") { newQ(); flash = null; card(); }
  };
  el.oninput = (e) => { if (e.target.id === "lb") labels = e.target.checked; };
  card();
  return () => { stop(); ro.disconnect(); };
}

// ---------- Régions de France ----------
const CHEFS_LIEUX = { "11": "Paris", "24": "Orléans", "27": "Dijon", "28": "Rouen", "32": "Lille", "44": "Strasbourg", "52": "Nantes", "53": "Rennes", "75": "Bordeaux", "76": "Toulouse", "84": "Lyon", "93": "Marseille", "94": "Ajaccio" };
const COUL_REG = ["#ffd0dc", "#ffe3a3", "#c9ecd4", "#cfe6ff", "#d7ccff", "#ffd7bf"];
function regions(el) {
  const k = Math.cos(rad(46.5));
  const X = (lon) => (lon + 5.5) * k * 100, Y = (lat) => (51.5 - lat) * 100;
  let mode = "explorer", sel = null, target = null, score = [0, 0], noms = false, wrong = null;
  const area = (r) => Math.abs(r.reduce((s, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return s + x * y2 - x2 * y; }, 0));
  const cent = REGIONS.map((reg) => { const r = reg.rings.reduce((a, b) => (area(b) > area(a) ? b : a)); const cx = r.reduce((s, p) => s + p[0], 0) / r.length, cy = r.reduce((s, p) => s + p[1], 0) / r.length; return [X(cx), Y(cy)]; });
  el.innerHTML = `
    <div class="tool-top wrap">
      <div class="seg"><button class="on" data-mode="explorer">🗺️ Explorer</button><button data-mode="quiz">❓ Quiz</button></div>
      <label class="check"><input type="checkbox" id="nm"> Afficher les noms</label>
    </div>
    <div class="explore">
      <div class="explore-main"><svg viewBox="0 0 ${X(10)} ${Y(41.2)}" class="fr-map" id="mp"></svg></div>
      <aside class="explore-card" id="card"></aside>
    </div>
    <p class="muted center">Les 13 régions de France métropolitaine. Tracés : IGN Admin Express (Licence Ouverte), simplifiés.</p>`;
  const mp = el.querySelector("#mp");
  const draw = () => {
    mp.innerHTML = REGIONS.map((reg, i) => {
      const d = reg.rings.map((r) => "M" + r.map(([lo, la]) => `${X(lo).toFixed(1)},${Y(la).toFixed(1)}`).join("L") + "Z").join("");
      const cls = sel === i ? "on" : wrong === i ? "bad" : "";
      return `<path d="${d}" data-r="${i}" class="reg ${cls}" style="--rc:${COUL_REG[i % COUL_REG.length]}"/>`;
    }).join("") + (noms || (mode === "explorer" && sel !== null) ? REGIONS.map((reg, i) => (noms || sel === i) ? `<text x="${cent[i][0]}" y="${cent[i][1]}" class="reg-name">${reg.nom}</text>` : "").join("") : "");
  };
  const card = (msg = "") => {
    const c = el.querySelector("#card");
    if (mode === "explorer") {
      if (sel === null) { c.innerHTML = `<h3>Les régions de France</h3><p>Touche une région pour voir son nom et sa capitale régionale.</p><p class="muted">La France métropolitaine compte 13 régions depuis 2016.</p>`; return; }
      const r = REGIONS[sel];
      c.innerHTML = `<h3>${r.nom}</h3><dl class="ec-facts"><dt>Chef-lieu (capitale de la région)</dt><dd>${CHEFS_LIEUX[r.code] ?? "—"}</dd></dl>`;
    } else c.innerHTML = `<h3>Quiz</h3><p>Touche la région :</p><div class="quiz-target">${REGIONS[target].nom}</div>${msg ? `<div class="answer">${msg}</div>` : ""}<p class="score">Score : <b>${score[0]}</b> / ${score[1]}</p><button class="pill" id="skip">Autre question</button>`;
  };
  const order = { list: [], i: 0 };
  const newQ = () => { if (order.i >= order.list.length) { order.list = shuffle(REGIONS.map((_, i) => i)); order.i = 0; } target = order.list[order.i++]; };
  el.onclick = (e) => {
    const p = e.target.closest("[data-r]");
    if (p) {
      const i = +p.dataset.r;
      if (mode === "explorer") { sel = i; draw(); card(); }
      else {
        score[1]++;
        if (i === target) { score[0]++; sel = i; wrong = null; draw(); card(`Bravo ! 🎉`); setTimeout(() => { if (mode === "quiz") { sel = null; newQ(); draw(); card(); } }, 1300); }
        else { wrong = i; draw(); card(`Non, ça c'est ${REGIONS[i].nom}.`); }
      }
      return;
    }
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mode) { mode = b.dataset.mode; el.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("on", x === b)); sel = null; wrong = null; if (mode === "quiz") { score = [0, 0]; newQ(); } draw(); card(); }
    if (b.id === "skip") { sel = null; wrong = null; newQ(); draw(); card(); }
  };
  el.oninput = (e) => { if (e.target.id === "nm") { noms = e.target.checked; draw(); } };
  draw(); card();
}

export const DECOUVRIR = [
  { id: "systeme-solaire", nom: "Système solaire", icone: "🪐", couleur: "#d7ccff", desc: "Les planètes autour du Soleil", cat: "decouvrir", mount: systemeSolaire },
  { id: "lune", nom: "Phases de la Lune", icone: "🌙", couleur: "#cfe6ff", desc: "Pourquoi la Lune change de forme", cat: "decouvrir", mount: lune },
  { id: "cycle-eau", nom: "Cycle de l'eau", icone: "🌧️", couleur: "#c9ecd4", desc: "Le voyage de l'eau, étape par étape", cat: "decouvrir", mount: cycleEau },
  { id: "etats-eau", nom: "États de l'eau", icone: "🧊", couleur: "#ffe3a3", desc: "Glace, eau, vapeur", cat: "decouvrir", mount: etatsEau },
  ...CLIMAT,
  { id: "globe", nom: "Globe", icone: "🌍", couleur: "#c9ecd4", desc: "Continents et océans, avec quiz", cat: "decouvrir", mount: globe },
  { id: "regions", nom: "Régions de France", icone: "🗺️", couleur: "#ffd0dc", desc: "Les 13 régions, avec quiz", cat: "decouvrir", mount: regions },
];
