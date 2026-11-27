// Apps « Découvrir » : sciences et géographie, niveau école primaire.
// Même format que les outils : { id, nom, icone, couleur, desc, cat, mount(el, ctx) -> cleanup? }
// Les textes s'en tiennent à des faits simples et établis. Les schémas ne sont pas à l'échelle sauf mention.
import { REGIONS, TERRES } from "./data/geo.js";

const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function loop(fn) { let id, last = performance.now(); const f = (t) => { fn(Math.min(0.05, (t - last) / 1000), t); last = t; id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => cancelAnimationFrame(id); }
const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ---------- Système solaire ----------
const PLANETES = [
  { nom: "Mercure", c1: "#d8cfc4", c2: "#9b8f84", d: 0.38, an: "88 jours", p: 0.24, type: "Planète rocheuse", txt: "C'est la planète la plus proche du Soleil et la plus petite du système solaire." },
  { nom: "Vénus", c1: "#ffe2a8", c2: "#e0a85a", d: 0.95, an: "225 jours", p: 0.62, type: "Planète rocheuse", txt: "C'est la planète la plus chaude. On la voit souvent briller le soir ou le matin : on l'appelle « l'étoile du berger »." },
  { nom: "Terre", c1: "#8fd3ff", c2: "#2e7bd6", d: 1, an: "365 jours", p: 1, type: "Planète rocheuse", txt: "C'est notre planète. C'est la seule où l'on connaît la vie. Elle a un satellite naturel : la Lune." },
  { nom: "Mars", c1: "#ffb08a", c2: "#d4553a", d: 0.53, an: "687 jours (presque 2 ans)", p: 1.88, type: "Planète rocheuse", txt: "On l'appelle « la planète rouge » : son sol contient beaucoup de rouille (de l'oxyde de fer)." },
  { nom: "Jupiter", c1: "#f6dcb8", c2: "#c98f5a", d: 11.2, an: "environ 12 ans", p: 11.9, type: "Géante gazeuse", txt: "C'est la plus grande planète. Sa Grande Tache rouge est une tempête géante." },
  { nom: "Saturne", c1: "#fbe9b7", c2: "#d6b26b", d: 9.4, an: "environ 29 ans", p: 29.5, type: "Géante gazeuse", txt: "Elle est célèbre pour ses anneaux, faits de morceaux de glace et de roche." },
  { nom: "Uranus", c1: "#c9f3f4", c2: "#6cc4cf", d: 4, an: "environ 84 ans", p: 84, type: "Géante glacée", txt: "Elle tourne sur elle-même couchée sur le côté." },
  { nom: "Neptune", c1: "#a9c4ff", c2: "#3a5fd0", d: 3.9, an: "environ 165 ans", p: 165, type: "Géante glacée", txt: "C'est la planète la plus éloignée du Soleil. Il y souffle des vents très violents." },
];
function systemeSolaire(el) {
  let vue = "orbites", play = !reduced(), vitesse = 1, noms = true, sel = 2, t = 0;
  const ang = PLANETES.map((_, i) => i * 1.7);
  el.innerHTML = `
    <div class="tool-top wrap">
      <div class="seg"><button class="on" data-vue="orbites">🪐 Orbites</button><button data-vue="tailles">📏 Tailles</button></div>
      <button class="pill" id="pp">${play ? "⏸ Pause" : "▶ Lecture"}</button>
      <label class="inline">Vitesse <input type="range" id="sp" min="0.2" max="4" step="0.1" value="1" style="width:110px"></label>
      <label class="check"><input type="checkbox" id="nm" checked> Noms</label>
    </div>
    <div class="explore">
      <div class="explore-main"><svg id="sv" class="space" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid meet"></svg></div>
      <aside class="explore-card" id="card"></aside>
    </div>
    <p class="muted center" id="note"></p>`;
  const sv = el.querySelector("#sv"), card = el.querySelector("#card"), note = el.querySelector("#note");
  const R = (i) => 95 + i * 48;
  const size = (p) => 7 + Math.sqrt(p.d) * 7;
  const defs = `<defs>${PLANETES.map((p, i) => `<radialGradient id="pg${i}" cx="35%" cy="35%"><stop offset="0" stop-color="${p.c1}"/><stop offset="1" stop-color="${p.c2}"/></radialGradient>`).join("")}
    <radialGradient id="sun" cx="45%" cy="45%"><stop offset="0" stop-color="#fff6b0"/><stop offset=".6" stop-color="#ffc93c"/><stop offset="1" stop-color="#ff9a3c"/></radialGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#ffd76a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd76a" stop-opacity="0"/></radialGradient></defs>`;
  const stars = Array.from({ length: 70 }, (_, i) => `<circle cx="${(((i * 137.5) % 1000) - 500).toFixed(0)}" cy="${(((i * 271.3) % 1000) - 500).toFixed(0)}" r="${i % 5 ? 1.2 : 2}" fill="#fff" opacity="${0.3 + (i % 4) * 0.15}"/>`).join("");
  const planetSVG = (p, i, r) => `${p.nom === "Saturne" ? `<ellipse rx="${r * 1.9}" ry="${r * 0.55}" fill="none" stroke="#e8d39a" stroke-width="${r * 0.28}" opacity=".9"/>` : ""}<circle r="${r}" fill="url(#pg${i})"/>${p.nom === "Terre" ? `<path d="M${-r * 0.4},${-r * 0.2} q${r * 0.3},${-r * 0.4} ${r * 0.6},0 q${-r * 0.1},${r * 0.4} ${-r * 0.6},0z" fill="#6ccf7f"/>` : ""}`;
  const drawCard = () => {
    if (sel === -1) {
      card.innerHTML = `<div class="ec-head"><span class="ec-ball" style="background:radial-gradient(circle at 40% 40%,#fff6b0,#ffc93c 60%,#ff9a3c)"></span><div><h3>Le Soleil</h3><span class="ec-type">Une étoile</span></div></div>
        <p>Le Soleil est une étoile : une énorme boule de gaz très chaude qui produit de la lumière et de la chaleur.</p>
        <p>Sa lumière met environ 8 minutes pour arriver jusqu'à la Terre.</p>`;
      return;
    }
    const p = PLANETES[sel], e = 22, k = Math.min(1, 120 / (p.d * e));
    card.innerHTML = `<div class="ec-head"><span class="ec-ball" style="background:radial-gradient(circle at 35% 35%,${p.c1},${p.c2})"></span><div><h3>${p.nom}</h3><span class="ec-type">${p.type}</span></div></div>
      <dl class="ec-facts"><dt>Place depuis le Soleil</dt><dd>${sel + 1}<sup>${sel ? "e" : "re"}</sup></dd><dt>Durée d'une année</dt><dd>${p.an}</dd><dt>Taille comparée à la Terre</dt><dd>${p.d === 1 ? "—" : (p.d > 1 ? `${String(p.d).replace(".", ",")} fois plus grande` : `environ ${String(p.d).replace(".", ",")} fois sa taille`)}</dd></dl>
      <div class="ec-compare"><svg viewBox="0 0 280 ${Math.max(60, p.d * e * k * 2 + 20)}"><g transform="translate(${30},${Math.max(30, p.d * e * k + 10)})"><circle r="${e * k}" fill="url(#cmpE)"/></g><g transform="translate(${70 + p.d * e * k},${Math.max(30, p.d * e * k + 10)})"><circle r="${p.d * e * k}" fill="url(#cmpP)"/></g>
        <defs><radialGradient id="cmpE" cx="35%" cy="35%"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#2e7bd6"/></radialGradient><radialGradient id="cmpP" cx="35%" cy="35%"><stop offset="0" stop-color="${p.c1}"/><stop offset="1" stop-color="${p.c2}"/></radialGradient></defs></svg>
        <span class="hint">À gauche la Terre, à droite ${p.nom} (tailles à l'échelle)</span></div>
      <p>${p.txt}</p>`;
  };
  const draw = () => {
    if (vue === "orbites") {
      note.textContent = "Les distances et les tailles ne sont pas à l'échelle. Les vitesses respectent les durées des années.";
      sv.setAttribute("viewBox", "-500 -500 1000 1000");
      sv.innerHTML = defs + stars + `<circle r="120" fill="url(#glow)"/>` + PLANETES.map((_, i) => `<circle r="${R(i)}" fill="none" stroke="#ffffff" stroke-opacity=".16" stroke-width="2" stroke-dasharray="4 8"/>`).join("") +
        `<g class="sun" data-p="-1"><circle r="52" fill="url(#sun)"/><circle cx="-16" cy="-6" r="4" fill="#7a4a1a"/><circle cx="16" cy="-6" r="4" fill="#7a4a1a"/><path d="M-14,12 q14,12 28,0" stroke="#7a4a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>` +
        PLANETES.map((p, i) => { const r = size(p), x = Math.cos(ang[i]) * R(i), y = Math.sin(ang[i]) * R(i);
          return `<g class="pl ${sel === i ? "on" : ""}" data-p="${i}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${sel === i ? `<circle r="${r + 9}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="5 5"/>` : ""}${planetSVG(p, i, r)}<circle r="${Math.max(r, 22)}" fill="transparent"/>${noms ? `<text y="${r + 22}" class="pl-name">${p.nom}</text>` : ""}</g>`; }).join("");
    } else {
      note.textContent = "Ici, les tailles des planètes sont à l'échelle entre elles. Le Soleil est bien plus grand : on n'en voit qu'un morceau.";
      const e = 9; let x = -60; const parts = [];
      sv.setAttribute("viewBox", "-160 -200 1160 400");
      parts.push(`<circle cx="-400" cy="0" r="${109 * e * 0.36}" fill="url(#sun)" data-p="-1" class="sun"/>`);
      PLANETES.forEach((p, i) => { const r = p.d * e; x += r + 22; parts.push(`<g class="pl ${sel === i ? "on" : ""}" data-p="${i}" transform="translate(${x},0)">${planetSVG(p, i, r)}<circle r="${Math.max(r, 16)}" fill="transparent"/>${noms ? `<text y="${Math.max(r, 10) + 26}" class="pl-name">${p.nom}</text>` : ""}</g>`); x += r; });
      sv.innerHTML = defs + stars + parts.join("");
    }
  };
  const stop = loop((dt) => {
    if (play && vue === "orbites") { PLANETES.forEach((p, i) => { ang[i] += (dt * vitesse * 0.9) / p.p; }); draw(); }
  });
  el.onclick = (e) => {
    const g = e.target.closest("[data-p]"); if (g) { sel = +g.dataset.p; drawCard(); draw(); return; }
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.vue) { vue = b.dataset.vue; el.querySelectorAll("[data-vue]").forEach((x) => x.classList.toggle("on", x === b)); draw(); }
    if (b.id === "pp") { play = !play; b.textContent = play ? "⏸ Pause" : "▶ Lecture"; }
  };
  el.oninput = (e) => { if (e.target.id === "sp") vitesse = +e.target.value; if (e.target.id === "nm") { noms = e.target.checked; draw(); } };
  draw(); drawCard();
  return stop;
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
  el.innerHTML = `
    <div class="explore">
      <div class="explore-main moon-scene">
        <svg viewBox="-260 -200 520 400" class="moon-orbit" id="orb"></svg>
      </div>
      <aside class="explore-card">
        <h3>Ce que l'on voit depuis la Terre</h3>
        <svg viewBox="-110 -110 220 220" class="moon-view" id="mv"></svg>
        <div class="moon-name" id="mn"></div>
        <p class="muted" id="md"></p>
      </aside>
    </div>
    <div class="tool-top wrap">
      <button class="pill" id="pp">▶ Animer</button>
      <input type="range" id="sl" min="0" max="${MOIS}" step="0.1" value="${jour}" class="wide-range" aria-label="Jour du cycle">
    </div>
    <p class="muted center">La Lune fait le tour de la Terre en environ 29 jours et demi. Elle ne produit pas de lumière : elle est éclairée par le Soleil, et on voit plus ou moins sa partie éclairée.</p>`;
  const orb = el.querySelector("#orb"), mv = el.querySelector("#mv");
  const draw = () => {
    const phi = (jour / MOIS) * TAU;
    // vue de dessus : Soleil à gauche, la Lune tourne dans le sens inverse des aiguilles d'une montre (vu depuis le pôle Nord)
    const a = Math.PI - phi; // nouvelle lune entre la Terre et le Soleil (à gauche)
    const mx = Math.cos(a) * 140, my = Math.sin(a) * 140; // y vers le bas : gauche → bas → droite = sens inverse des aiguilles d'une montre vu du nord
    const rays = Array.from({ length: 7 }, (_, i) => `<line x1="-255" x2="-200" y1="${-150 + i * 50}" y2="${-150 + i * 50}" stroke="#ffd34d" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 10" class="ray"/>`).join("");
    orb.innerHTML = `${rays}<text x="-250" y="-170" class="lbl">Lumière du Soleil →</text>
      <circle r="140" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-dasharray="4 8"/>
      <g><circle r="34" fill="#2e7bd6"/><path d="M0,-34 A34,34 0 0 1 0,34 Z" fill="#0b1d3a" opacity=".55"/><path d="M-14,-10 q10,-14 22,-4 q-4,12 -22,4z" fill="#6ccf7f"/><text y="56" class="lbl c">Terre</text></g>
      <g transform="translate(${mx.toFixed(1)},${my.toFixed(1)})"><circle r="16" fill="#f2f0e6"/><path d="M0,-16 A16,16 0 0 1 0,16 Z" fill="#0b1d3a" opacity=".7"/><text y="34" class="lbl c">Lune</text></g>`;
    mv.innerHTML = `<defs><radialGradient id="mg" cx="40%" cy="40%"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#e9e2c4"/></radialGradient></defs>
      <circle r="96" fill="#2a2f4a"/><path d="${moonPath(phi, 96)}" fill="url(#mg)"/>
      <circle cx="-30" cy="-20" r="12" fill="#000" opacity=".06"/><circle cx="25" cy="30" r="16" fill="#000" opacity=".06"/><circle cx="35" cy="-35" r="8" fill="#000" opacity=".06"/>`;
    el.querySelector("#mn").textContent = PHASES.find(([d]) => jour < d)[1];
    el.querySelector("#md").textContent = `Jour ${Math.round(jour)} du cycle`;
  };
  const stop = loop((dt) => { if (play) { jour = (jour + dt * 3) % MOIS; el.querySelector("#sl").value = jour; draw(); } });
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
function globe(el) {
  let lon0 = -10, lat0 = 20, spin = !reduced(), drag = null, mode = "explorer", target = null, score = [0, 0], flash = null, labels = true;
  el.innerHTML = `
    <div class="tool-top wrap">
      <div class="seg"><button class="on" data-mode="explorer">🌍 Explorer</button><button data-mode="quiz">❓ Quiz</button></div>
      <button class="pill" id="sp">${spin ? "⏸ Arrêter" : "↻ Tourner"}</button>
      <label class="check"><input type="checkbox" id="lb" checked> Noms</label>
    </div>
    <div class="explore">
      <div class="explore-main"><canvas id="cv" class="globe"></canvas></div>
      <aside class="explore-card" id="card"></aside>
    </div>
    <p class="muted center">Fais tourner le globe avec le doigt ou la souris. Données : Natural Earth.</p>`;
  const cv = el.querySelector("#cv"), g = cv.getContext("2d");
  let W = 400, H = 400;
  const fit = () => { const r = cv.getBoundingClientRect(), d = devicePixelRatio || 1; W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(fit); ro.observe(cv);
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
  const geom = () => { const R = Math.min(W, H) * 0.44; return [R, W / 2, H / 2]; };
  const render = () => {
    const [R, cx, cy] = geom();
    g.clearRect(0, 0, W, H);
    const sea = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    sea.addColorStop(0, "#8fd3ff"); sea.addColorStop(1, "#2c78c9");
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fillStyle = sea; g.fill();
    g.strokeStyle = "#ffffff30"; g.lineWidth = 1;
    for (let la = -60; la <= 60; la += 30) { g.beginPath(); let pen = false; for (let lo = -180; lo <= 180; lo += 4) { const [x, y, v] = proj(la, lo, R, cx, cy); if (v > 0) { pen ? g.lineTo(x, y) : g.moveTo(x, y); pen = true; } else pen = false; } g.stroke(); }
    for (let lo = -180; lo < 180; lo += 30) { g.beginPath(); let pen = false; for (let la = -90; la <= 90; la += 4) { const [x, y, v] = proj(la, lo, R, cx, cy); if (v > 0) { pen ? g.lineTo(x, y) : g.moveTo(x, y); pen = true; } else pen = false; } g.stroke(); }
    g.fillStyle = "#8bd17c"; g.strokeStyle = "#5fa55a"; g.lineWidth = 0.8;
    for (const ring of TERRES) {
      const pts = ring.map(([lo, la]) => proj(la, lo, R, cx, cy));
      if (!pts.some((p) => p[2] > 0)) continue;
      g.beginPath();
      pts.forEach(([x, y, v], i) => {
        if (v < 0) { const k = R / Math.hypot(x - cx, y - cy || 1e-6); x = cx + (x - cx) * k; y = cy + (y - cy) * k; }
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      });
      g.closePath(); g.fill(); g.stroke();
    }
    const shade = g.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.2, cx, cy, R * 1.02);
    shade.addColorStop(0, "#ffffff22"); shade.addColorStop(0.7, "#00000000"); shade.addColorStop(1, "#00000035");
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fillStyle = shade; g.fill();
    if (labels && mode === "explorer") {
      g.textAlign = "center"; g.textBaseline = "middle";
      for (const [set, col, sz] of [[CONTINENTS, "#2b3a1f", 15], [OCEANS, "#0d3b70", 13]]) for (const [n, pts] of Object.entries(set)) {
        const [x, y, v] = proj(pts[0][0], pts[0][1], R, cx, cy); if (v < 0.25) continue;
        g.font = `800 ${sz}px Nunito, system-ui, sans-serif`;
        g.lineWidth = 4; g.strokeStyle = "#ffffffcc"; g.strokeText(n, x, y); g.fillStyle = col; g.fillText(n, x, y);
      }
    }
    if (flash) {
      const [x, y, v] = proj(flash.lat, flash.lon, R, cx, cy);
      if (v > 0) { g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fillStyle = flash.ok ? "#5cc87acc" : "#ef6461cc"; g.fill(); g.lineWidth = 3; g.strokeStyle = "#fff"; g.stroke(); }
    }
  };
  const card = (msg = "") => {
    const c = el.querySelector("#card");
    if (mode === "explorer") c.innerHTML = `<h3>Continents et océans</h3><p>Touche le globe pour savoir où tu es.</p>${msg ? `<div class="answer">${msg}</div>` : ""}
      <p class="muted">7 continents : Afrique, Amérique du Nord, Amérique du Sud, Antarctique, Asie, Europe, Océanie.</p><p class="muted">5 océans : Pacifique, Atlantique, Indien, Arctique, Austral.</p>`;
    else c.innerHTML = `<h3>Quiz</h3><p>Touche :</p><div class="quiz-target">${target}</div>${msg ? `<div class="answer">${msg}</div>` : ""}<p class="score">Score : <b>${score[0]}</b> / ${score[1]}</p><button class="pill" id="skip">Autre question</button>`;
  };
  const newQ = () => { const all = [...Object.keys(CONTINENTS), ...Object.keys(OCEANS)]; let n; do n = all[Math.floor(Math.random() * all.length)]; while (n === target); target = n; };
  const stop = loop((dt) => { if (spin && !drag) lon0 -= dt * 8; render(); });
  let moved = false;
  cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); drag = [e.clientX, e.clientY, lon0, lat0]; moved = false; };
  cv.onpointermove = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag[0], dy = e.clientY - drag[1];
    if (Math.hypot(dx, dy) > 4) moved = true;
    const [R] = geom(); lon0 = drag[2] - (dx / R) * 60; lat0 = Math.max(-80, Math.min(80, drag[3] + (dy / R) * 60));
  };
  cv.onpointerup = (e) => {
    const was = drag; drag = null;
    if (!was || moved) return;
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
    if (b.id === "sp") { spin = !spin; b.textContent = spin ? "⏸ Arrêter" : "↻ Tourner"; }
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
  { id: "globe", nom: "Globe", icone: "🌍", couleur: "#c9ecd4", desc: "Continents et océans, avec quiz", cat: "decouvrir", mount: globe },
  { id: "regions", nom: "Régions de France", icone: "🗺️", couleur: "#ffd0dc", desc: "Les 13 régions, avec quiz", cat: "decouvrir", mount: regions },
];
