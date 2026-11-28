// À découvrir · Sciences : « Le climat change » (CP → CM2).
// Une seule activité en 6 étapes (effet de serre, causes, +2 °C ?, conséquences, agir, quiz) et une fiche enseignant.
// Dans les images, toucher un élément ouvre une bulle d'info à côté de lui.
// Trois versions de texte : CP-CE1, CE2, CM1-CM2 (palier 0, 1, 2). Contenus : js/data/decouvrir/climat-donnees.js.
import { NIVEAUX, esc, shuffle, niveauxHTML, niveauMemo, bravo, dragEtiquettes, clicApresDrag, scoreHTML } from "./kit.js";
import { moinsAnim, entree } from "../anim.js";
import { SERRE, SERRE_INTRO, CAUSES, CAUSES_INTRO, SECTEURS_FR, EPOQUES, EPOQUES_TXT, CONSEQUENCES, GESTES, ENSEMBLE, ENSEMBLE_MSG, QUIZ, ENSEIGNANT, INFOS_SERRE, DEG_VUES, FIEVRE_CORPS, FIEVRE_TERRE, FIEVRE_TXT, COURBE, ZOOM, DEG_POINTS, CANICULES, CANICULES_TXT } from "../data/decouvrir/climat-donnees.js";

const palier = (n) => (n === "CP" || n === "CE1" ? 0 : n === "CE2" ? 1 : 2);
// Texte selon le palier : chaîne commune, ou tableau [CP-CE1, CE2, CM] (case vide = celle d'avant).
const P = (v, t) => { if (!Array.isArray(v)) return v ?? ""; for (let i = Math.min(t, v.length - 1); i >= 0; i--) if (v[i]) return v[i]; return ""; };
const reduit = moinsAnim;
const ETAPES = [["serre", "🏠", "Effet de serre"], ["causes", "🏭", "Causes"], ["degres", "📈", "+2 °C ?"], ["consequences", "🌊", "Conséquences"], ["agir", "🌱", "Agir"], ["quiz", "❓", "Quiz"]];
const NS = "http://www.w3.org/2000/svg";
const mix = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join(""); };
// Pseudo-hasard stable (positions des molécules, des arbres) : même dessin à chaque affichage.
const alea = (s) => { let x = s; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; };
const melange = (n, graine) => { const r = alea(graine), a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Bulle d'info posée dans la scène, à côté du point (x, y) de l'image (viewBox 800 × 460). r = rayon de l'élément visé.
function bulle(scene, x, y, html, r = 36) {
  scene.querySelector(".cl-bulle")?.remove();
  const svg = scene.querySelector("svg"), rs = scene.getBoundingClientRect(), rv = svg.getBoundingClientRect(), k = rv.width / 800;
  const px = rv.left - rs.left + x * k, py = rv.top - rs.top + y * k, d = r * k + 12;
  const b = document.createElement("div");
  b.className = "cl-bulle"; b.setAttribute("role", "dialog");
  b.innerHTML = `<button class="cl-bulle-x" data-act="bulle-x" aria-label="Fermer">✕</button>${html}`;
  scene.appendChild(b);
  // Au-dessus si ça tient, sinon en dessous, sinon à côté : la bulle reste dans la scène et ne cache pas l'élément.
  const w = b.offsetWidth, h = b.offsetHeight, H = rs.height, W = rs.width;
  const haut = py - d - h >= 4, bas = !haut && py + d + h <= H - 4;
  let left, top, cote;
  if (haut || bas) { cote = haut ? "haut" : "bas"; left = Math.max(6, Math.min(W - w - 6, px - w / 2)); top = haut ? py - d - h : py + d; }
  else { cote = px > W / 2 ? "gauche" : "droite"; left = cote === "gauche" ? Math.max(4, px - d - w) : Math.min(W - w - 4, px + d); top = Math.max(4, Math.min(H - h - 4, py - h / 2)); }
  b.classList.add(cote);
  b.style.left = `${left}px`; b.style.top = `${top}px`;
  b.style.setProperty("--fx", `${Math.max(18, Math.min(w - 18, px - left))}px`);
  b.style.setProperty("--fy", `${Math.max(18, Math.min(h - 18, py - top))}px`);
}
const bulleHTML = (ico, titre, txt, plus = "") => `<h4>${ico} ${esc(titre)}</h4><p>${esc(txt)}</p>${plus}`;
// Point de l'image (viewBox) sous un clic.
const ptSVG = (svg, e) => { const r = svg.getBoundingClientRect(), k = 800 / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; };

// Point cliquable dans une scène SVG (cause ou conséquence).
const spot = (s, t, sel, vu) => `<g class="cl-spot ${sel ? "on" : ""} ${vu ? "vu" : ""}" data-spot="${s.id}" transform="translate(${s.x},${s.y})" role="button" tabindex="0" aria-label="${esc(P(s.nom, t))}">
  <circle r="34" class="cl-halo"/><text class="cl-emo" y="2">${s.ico}</text>${vu && !sel ? `<circle cx="24" cy="-24" r="10" class="cl-vu"/><text x="24" y="-23" class="cl-vu-t">✓</text>` : ""}
</g>`;

export function mountClimat(el) {
  const niv = niveauMemo("climat", NIVEAUX, "CE2");
  let t = palier(niv.get()), etape = "serre", fin = null, clic = null, saisie = null;
  el.innerHTML = `<div class="cl-root">
    <div class="tool-top cl-top">${niveauxHTML(NIVEAUX, niv.get())}
      <div class="seg cl-etapes" role="group" aria-label="Étapes">${ETAPES.map(([id, ico, nom], i) => `<button data-etape="${id}"><b class="cl-n">${i + 1}</b>${ico} <span>${nom}</span></button>`).join("")}</div>
      <button class="round-btn cl-prof-b" data-act="prof" aria-label="Fiche enseignant" title="Fiche enseignant">📖</button></div>
    <div class="cl-corps"></div></div>`;
  const corps = el.querySelector(".cl-corps");
  let surFermeture = null; // remet à zéro la sélection de l'étape quand on ferme la bulle
  // Remplace le contenu de l'étape. partiel : garde le curseur en place (on ne casse pas un glisser en cours).
  const remplacer = (html, partiel) => {
    if (!partiel || !corps.querySelector(".cl-scene")) { corps.innerHTML = html; return; }
    const tmp = document.createElement("div"); tmp.innerHTML = html;
    for (const sel of [".cl-scene", "#clCard", ".cl-crans", ".cl-cur-l"]) { const a = corps.querySelector(sel), b = tmp.querySelector(sel); if (a && b) a.replaceWith(b); }
  };
  const fermerBulle = () => { corps.querySelector(".cl-bulle")?.remove(); surFermeture?.(); };

  const rendu = () => {
    fin?.(); fin = null; clic = null; saisie = null; surFermeture = null;
    el.querySelectorAll("[data-etape]").forEach((b) => b.classList.toggle("on", b.dataset.etape === etape));
    ({ serre, causes, degres, consequences, agir, quiz })[etape]();
  };

  // ---------- 1. Effet de serre ----------
  let cran = 2;
  function serre() {
    const G = 372, ATM = [92, 205]; // sol, bande de l'atmosphère
    const r = alea(7), mols = Array.from({ length: 17 }, () => [40 + r() * 640, ATM[0] + 12 + r() * (ATM[1] - ATM[0] - 24)]);
    const arbres = [250, 330, 560, 640].map((x, i) => `<g transform="translate(${x},${G - 4})"><rect x="-4" y="-22" width="8" height="22" fill="#8a5a2b"/><circle cy="-34" r="${18 + (i % 2) * 4}" fill="#4fae5b"/></g>`).join("");
    const maisons = [[400, 0], [455, 1]].map(([x, k]) => `<g transform="translate(${x},${G})"><rect x="-20" y="-30" width="40" height="30" fill="${k ? "#ffd0a8" : "#fff1c9"}"/><path d="M-26,-30 L0,-52 L26,-30Z" fill="#d9644a"/><rect x="-6" y="-16" width="12" height="16" fill="#8a5a2b"/></g>`).join("");
    corps.innerHTML = `<div class="explore cl-explore"><div class="cl-gauche">
        <div class="explore-main cl-scene rc-board"><svg viewBox="0 0 800 460" class="cl-svg" aria-label="Modèle de l'effet de serre">
          <defs><linearGradient id="clEsp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1640"/><stop offset="1" stop-color="#26458f"/></linearGradient>
            <linearGradient id="clCiel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0ff"/><stop offset="1" stop-color="#dff3ff"/></linearGradient>
            <radialGradient id="clSol"><stop offset="0" stop-color="#fff6b0"/><stop offset=".6" stop-color="#ffd34d"/><stop offset="1" stop-color="#ffb02e"/></radialGradient></defs>
          <rect width="800" height="${ATM[0]}" fill="url(#clEsp)"/>
          ${[[300, 20], [420, 50], [520, 18], [690, 40], [610, 70], [240, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fff" opacity=".8"/>`).join("")}
          <text x="790" y="22" class="cl-zone d">${t ? "Espace" : "L'espace"}</text>
          <rect y="${ATM[0]}" width="800" height="${G - ATM[0]}" fill="url(#clCiel)"/>
          <rect y="${ATM[0]}" width="800" height="${ATM[1] - ATM[0]}" class="cl-atm cl-info" id="clAtm" data-info="atm"/>
          <text x="790" y="${ATM[0] + 20}" class="cl-zone">${["L'air autour de la Terre", "Atmosphère", "Atmosphère"][t]}</text>
          <g id="clMol" class="cl-info" data-info="${t === 2 ? "co2" : "atm"}"></g>
          <circle cx="86" cy="46" r="38" fill="url(#clSol)" class="cl-info" data-info="soleil"/><text x="86" y="104" class="cl-zone c d">Soleil</text>
          <g class="cl-info" data-info="sol"><path d="M0,${G} C150,${G - 12} 300,${G + 6} 460,${G - 8} S700,${G + 4} 800,${G - 6} L800,460 L0,460Z" fill="#6fbf5f"/>
          <rect y="${G + 14}" width="800" height="${460 - G}" fill="#a8743f"/><rect y="${G + 6}" width="800" height="10" fill="#5fa84f"/></g>
          ${arbres}${maisons}
          <rect y="${G - 60}" width="800" height="${460 - G + 60}" class="cl-chaud" id="clChaud"/>
          <text x="400" y="${G + 52}" class="cl-zone c">${["Le sol", "Le sol se réchauffe", "Le sol chauffé émet des infrarouges"][t]}</text>
          <g id="clPh"></g>
          <g transform="translate(735,232)" class="cl-thermo cl-info" data-info="thermo"><rect x="-13" y="0" width="26" height="128" rx="13" fill="#fff" stroke="#c9c2dc" stroke-width="3"/>
            <rect x="-6" id="clTf" width="12" rx="6"/><circle cy="140" r="20" id="clTb" stroke="#c9c2dc" stroke-width="3"/>
            <text y="-34" class="cl-visage" id="clVis"></text><text y="-8" class="cl-temp" id="clTv"></text></g>
          ${[["soleil", 128, 22], ["atm", 28, 150], ["sol", 28, 432], ["thermo", 772, 300]].map(([k, x, y]) => `<g class="cl-i" data-info="${k}" transform="translate(${x},${y})" role="button" tabindex="0" aria-label="${esc(P(INFOS_SERRE[k].nom, t))}"><circle r="15"/><text>i</text></g>`).join("")}
        </svg></div>
      <div class="tool-top cl-curseur">
        <div class="cl-cur"><label class="cl-cur-l" for="clGes">${["Épaisseur de la couverture", "Gaz à effet de serre", "Quantité de gaz à effet de serre"][t]}</label><input type="range" id="clGes" min="0" max="3" step="1" value="${cran}" class="wide-range" aria-label="${["Épaisseur de la couverture", "Gaz à effet de serre", "Quantité de gaz à effet de serre"][t]}">
          <div class="cl-crans">${SERRE.map((s, i) => `<span data-cran="${i}">${esc(P(s.nom, t))}</span>`).join("")}</div></div>
        ${reduit() ? "" : `<button class="pill" data-act="pause">⏸ Pause</button>`}</div></div>
        <aside class="explore-card" id="clCard"></aside></div>`;
    const svg = corps.querySelector("svg"), gPh = svg.querySelector("#clPh");
    const maj = () => {
      const s = SERRE[cran];
      svg.querySelector("#clAtm").style.opacity = 0.12 + cran * 0.14;
      svg.querySelector("#clChaud").style.opacity = [0, 0.04, 0.1, 0.22][cran];
      svg.querySelector("#clMol").innerHTML = mols.slice(0, s.mol).map(([x, y], i) => t === 2
        ? `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)})" class="cl-co2"><circle cx="-9" r="5.5"/><circle r="6.5" class="c"/><circle cx="9" r="5.5"/>${i === 0 ? `<text y="-11">CO₂</text>` : ""}</g>`
        : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="7" class="cl-gaz"/>`).join("");
      const k = (s.temp + 20) / 40;
      const tf = svg.querySelector("#clTf"), c = s.temp < 0 ? "#5fb3f0" : s.temp < 15 ? "#f5b83d" : s.temp < 16 ? "#f08a3d" : "#e0463c";
      tf.setAttribute("y", (6 + (1 - k) * 116).toFixed(0)); tf.setAttribute("height", (k * 116 + 16).toFixed(0)); tf.setAttribute("fill", c);
      svg.querySelector("#clTb").setAttribute("fill", c);
      svg.querySelector("#clVis").textContent = s.visage;
      svg.querySelector("#clTv").textContent = t ? s.affiche : "";
      corps.querySelectorAll("[data-cran]").forEach((x) => x.classList.toggle("on", +x.dataset.cran === cran));
      corps.querySelector("#clCard").innerHTML = `<p class="cl-intro">${esc(SERRE_INTRO[t])}</p>
        <h3>${s.visage} ${esc(P(s.nom, t))}</h3>${t ? `<p class="cl-gros">${s.affiche} <span class="muted">en moyenne sur Terre</span></p>` : ""}<p>${esc(s.txt[t])}</p>
        <div class="cl-legende"><span><i class="j"></i>${t === 2 ? "Lumière du Soleil" : "Chaleur du Soleil"}</span><span><i class="r"></i>${t === 2 ? "Infrarouge (chaleur) émis par le sol" : "Chaleur renvoyée par le sol"}</span></div><p class="muted cl-petit">👆 Touche le Soleil, l'air, le sol ou le thermomètre pour en savoir plus.</p>`;
    };
    // Flèches de lumière et de chaleur : modèle simplifié (pas une mesure).
    let ph = [], acc = 0, play = true;
    const V = 230;
    const nouveau = (k, x, y, vx, vy) => { const l = document.createElementNS(NS, "line"); l.setAttribute("class", k === "sol" ? "cl-ph j" : "cl-ph r"); gPh.appendChild(l); const p = { k, x, y, vx, vy, l, h: 0 }; ph.push(p); return p; };
    const monter = (p) => { const a = (Math.random() - 0.5) * 0.9; p.k = "ir"; p.vx = Math.sin(a) * V; p.vy = -Math.cos(a) * V; p.h = ATM[0] + 10 + Math.random() * (ATM[1] - ATM[0] - 20); p.dec = false; p.l.setAttribute("class", "cl-ph r"); };
    const pas = (dt) => {
      acc += dt;
      while (acc > 0.42) { acc -= 0.42; if (ph.length < 70) { const tx = 180 + Math.random() * 500, x = 96 + Math.random() * 20, y = 60, d = Math.hypot(tx - x, G - y); nouveau("sol", x, y, ((tx - x) / d) * V, ((G - y) / d) * V); } }
      const ret = SERRE[cran].retour;
      ph = ph.filter((p) => {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.k === "sol" && p.y >= G) { p.y = G; monter(p); }
        else if (p.k === "ir" && p.vy < 0 && !p.dec && p.y <= p.h) { p.dec = true; if (Math.random() < ret) p.vy = -p.vy; }
        else if (p.k === "ir" && p.vy > 0 && p.y >= G) { p.y = G; monter(p); }
        if (p.y < -30 || p.x < -30 || p.x > 830) { p.l.remove(); return false; }
        return true;
      });
    };
    const dessiner = () => ph.forEach((p) => { const n = Math.hypot(p.vx, p.vy) || 1, L = p.k === "sol" ? 30 : 24; p.l.setAttribute("x1", p.x.toFixed(1)); p.l.setAttribute("y1", p.y.toFixed(1)); p.l.setAttribute("x2", (p.x - (p.vx / n) * L).toFixed(1)); p.l.setAttribute("y2", (p.y - (p.vy / n) * L).toFixed(1)); });
    const figer = () => { ph.forEach((p) => p.l.remove()); ph = []; acc = 0; for (let i = 0; i < 260; i++) pas(0.05); dessiner(); };
    let raf = 0, last = performance.now();
    const boucle = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (play) { pas(dt); dessiner(); } raf = requestAnimationFrame(boucle); };
    maj();
    if (reduit()) figer(); else { for (let i = 0; i < 120; i++) pas(0.05); dessiner(); raf = requestAnimationFrame(boucle); }
    const choisir = (v) => { cran = Math.max(0, Math.min(3, v)); corps.querySelector("#clGes").value = cran; maj(); if (reduit()) figer(); };
    saisie = (e) => { if (e.target.id === "clGes") choisir(+e.target.value); };
    clic = (e) => {
      const z = e.target.closest("[data-info]");
      if (z) { const inf = INFOS_SERRE[z.dataset.info], [x, y] = z.classList.contains("cl-i") ? z.getAttribute("transform").match(/[\d.]+/g).map(Number) : ptSVG(svg, e); return bulle(corps.querySelector(".cl-scene"), x, y, bulleHTML(inf.ico, P(inf.nom, t), P(inf.txt, t)), 14); }
      const c = e.target.closest("[data-cran]"); if (c) return choisir(+c.dataset.cran);
      const b = e.target.closest("[data-act='pause']"); if (b) { play = !play; b.textContent = play ? "⏸ Pause" : "▶ Animer"; }
    };
    fin = () => cancelAnimationFrame(raf);
  }

  // ---------- 2. Causes ----------
  let causeSel = null, causesVues = new Set(), graphe = false, reveles = new Set();
  function causes() {
    const liste = CAUSES.filter((c) => c.t <= t);
    if (causeSel && !liste.some((c) => c.id === causeSel)) causeSel = null;
    const fumee = (x, y, n = 3) => `<g class="cl-fumee">${Array.from({ length: n }, (_, i) => `<circle cx="${x}" cy="${y}" r="${9 + i * 3}" style="animation-delay:${i * 0.9}s"/>`).join("")}</g>`;
    const r = alea(11), sapins = Array.from({ length: 9 }, (_, i) => [640 + (i % 3) * 45 + r() * 14, 205 + Math.floor(i / 3) * 30 + r() * 10]);
    corps.innerHTML = `<div class="explore cl-explore">
        <div class="explore-main cl-scene rc-board"><svg viewBox="0 0 800 460" class="cl-svg" aria-label="Paysage : causes du réchauffement">
          <defs><linearGradient id="clC2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd6ff"/><stop offset="1" stop-color="#e6f6ff"/></linearGradient></defs>
          <rect width="800" height="460" fill="url(#clC2)"/>
          <path d="M0,215 C140,190 260,230 400,205 S650,185 800,200 L800,460 L0,460Z" fill="#9ad27f"/>
          <path d="M0,300 C200,280 500,320 800,290 L800,460 L0,460Z" fill="#7cc46a"/>
          <rect y="372" width="800" height="42" fill="#77757f"/><path d="M0,393 H800" stroke="#fff" stroke-width="3" stroke-dasharray="22 18"/>
          <g transform="translate(150,250)"><rect x="-55" y="-30" width="110" height="60" fill="#c9b8a6"/><rect x="-40" y="-75" width="16" height="48" fill="#8f7d6c"/><rect x="10" y="-90" width="16" height="62" fill="#8f7d6c"/></g>
          ${fumee(118, 175)}${fumee(168, 160)}
          <g transform="translate(300,300)"><rect x="-32" y="-26" width="64" height="40" fill="#fff1c9"/><path d="M-40,-26 L0,-56 L40,-26Z" fill="#d9644a"/><rect x="16" y="-60" width="10" height="24" fill="#8a5a2b"/></g>${fumee(321, 236, 2)}
          ${t ? `<g transform="translate(60,330)"><path d="M-26,30 Q-18,-10 -22,-40 L22,-40 Q18,-10 26,30Z" fill="#c4c9d2"/></g>${fumee(60, 280, 3)}` : ""}
          ${sapins.map(([x, y], i) => i % 3 === 1 ? `<rect x="${x - 8}" y="${y + 6}" width="16" height="10" rx="3" fill="#a8743f"/>` : `<path d="M${x},${y - 28} L${x + 16},${y + 8} L${x - 16},${y + 8}Z" fill="#3f8f4f"/><rect x="${x - 3}" y="${y + 8}" width="6" height="8" fill="#8a5a2b"/>`).join("")}
          <path d="M520,300 h80 M520,318 h80" stroke="#c9a56b" stroke-width="3"/>
          ${liste.map((c) => spot(c, t, c.id === causeSel, causesVues.has(c.id))).join("")}
        </svg></div>
        <aside class="explore-card" id="clCard"></aside></div>`;
    const carte = () => {
      const c = CAUSES.find((x) => x.id === causeSel), n = liste.filter((x) => causesVues.has(x.id)).length;
      let h;
      if (graphe) {
        const max = Math.max(...SECTEURS_FR.map((s) => s.p));
        h = `<h3>📊 En France, d'où viennent les gaz ?</h3><p class="muted">Devine d'abord, puis touche chaque ligne pour voir sa part.</p>
          <div class="cl-barres rc-board">${SECTEURS_FR.map((s, i) => `<button class="cl-barre ${reveles.has(i) ? "vue" : ""}" data-barre="${i}"><span class="cl-b-n">${s.ico} ${esc(s.nom)}</span><span class="cl-b-t"><i style="width:${reveles.has(i) ? (s.p / max) * 100 : 0}%"></i></span><b>${reveles.has(i) ? `${s.p} %` : "?"}</b></button>`).join("")}</div>
          <p class="dk-source">Émissions 2025, estimation provisoire (SDES, d'après le Citepa).</p>
          <div class="tool-top"><button class="pill" data-act="tout">👀 Tout montrer</button><button class="pill" data-act="graphe">← Le paysage</button></div>`;
      } else h = `<h3>🔎 Qu'est-ce qui réchauffe la Terre ?</h3><p>${esc(CAUSES_INTRO[t])}</p>`;
      if (!graphe) h += `<p class="cl-compte">${n === liste.length ? "🎉 Tout est découvert !" : `Découvert : <b>${n}</b> / ${liste.length}`}</p>${t === 2 ? `<button class="pill" data-act="graphe">📊 Qui émet le plus en France ?</button>` : ""}`;
      corps.querySelector("#clCard").innerHTML = h;
    };
    carte();
    const sel = CAUSES.find((x) => x.id === causeSel);
    if (sel) bulle(corps.querySelector(".cl-scene"), sel.x, sel.y, bulleHTML(sel.ico, P(sel.nom, t), P(sel.txt, t), t ? `<p><span class="dk-tag">${sel.gaz === "CO₂" ? "dioxyde de carbone (CO₂)" : sel.gaz}</span></p>` : ""));
    surFermeture = () => { causeSel = null; corps.querySelectorAll(".cl-spot.on").forEach((x) => x.classList.remove("on")); };
    clic = (e) => {
      const s = e.target.closest("[data-spot]");
      if (s) { causeSel = s.dataset.spot; causesVues.add(causeSel); graphe = false; return causes(); }
      const b = e.target.closest("[data-barre]"); if (b) { reveles.add(+b.dataset.barre); return carte(); }
      const a = e.target.closest("[data-act]")?.dataset.act;
      if (a === "graphe") { graphe = !graphe; carte(); }
      if (a === "tout") { SECTEURS_FR.forEach((_, i) => reveles.add(i)); carte(); }
    };
  }

  // ---------- +2 °C ? Pourquoi quelques degrés, c'est beaucoup ----------
  let vueDeg = "fievre", degPlus = 2, canic = 1, degSel = null, ptsVitesse = [];
  function degres(partiel = false) {
    const seuil = (l, v) => l.find(([s]) => v <= s);
    let scene = "", curseur = "", carteH = "";
    if (vueDeg === "fievre") {
      const [, vC, eC] = seuil(FIEVRE_CORPS, degPlus), [, vT, eT] = seuil(FIEVRE_TERRE, degPlus);
      const fmt = (v) => String(v).replace(".", ",");
      // Deux thermomètres gradués de 0 à +5 degrés, même échelle.
      const thermo = (x, base, coul) => { const h = 250, y0 = 360, k = degPlus / 5;
        return `<g transform="translate(${x},0)"><rect x="-16" y="${y0 - h - 10}" width="32" height="${h + 20}" rx="16" fill="#fff" stroke="#c9c2dc" stroke-width="3"/>
          <rect x="-8" y="${(y0 - 30 - k * (h - 40)).toFixed(0)}" width="16" height="${(30 + k * (h - 40) + 8).toFixed(0)}" rx="8" fill="${coul}" class="cl-fill"/><circle cy="${y0 + 22}" r="26" fill="${coul}" stroke="#c9c2dc" stroke-width="3"/>
          ${[0, 1, 2, 3, 4, 5].map((d) => { const y = y0 - 30 - (d / 5) * (h - 40); return `<line x1="16" x2="28" y1="${y}" y2="${y}" stroke="#8a829c" stroke-width="2"/><text x="34" y="${y + 5}" class="cl-grad">${fmt(base + d)} °C</text>`; }).join("")}</g>`; };
      scene = `<svg viewBox="0 0 800 460" class="cl-svg" aria-label="Comparaison avec la fièvre">
        <rect width="800" height="460" fill="#fdf7ef"/><line x1="400" y1="30" x2="400" y2="430" stroke="#e8dccb" stroke-width="3" stroke-dasharray="8 8"/>
        <text x="160" y="80" class="cl-grand-emo">${vC}</text><text x="160" y="150" class="cl-titre-s">Toi</text>
        <text x="160" y="196" class="cl-val">${fmt(37 + degPlus)} °C</text><text x="160" y="226" class="cl-etat">${esc(eC)}</text>
        ${thermo(300, 37, degPlus >= 3 ? "#e0463c" : degPlus >= 1.5 ? "#f08a3d" : "#f5b83d")}
        <text x="545" y="80" class="cl-grand-emo">🌍</text><text x="595" y="60" class="cl-petit-emo">${vT}</text><text x="545" y="150" class="cl-titre-s">La Terre</text>
        <text x="545" y="196" class="cl-val">${t ? `${fmt(14 + degPlus)} °C` : `+${fmt(degPlus)} °C`}</text><text x="545" y="226" class="cl-etat">${esc(eT)}</text>
        ${thermo(710, 14, degPlus >= 3 ? "#e0463c" : degPlus >= 1.5 ? "#f08a3d" : "#f5b83d")}
        <text x="400" y="452" class="cl-zone c fin">${t ? "Température normale du corps : 37 °C · Terre avant 1850 : environ 14 °C" : "Le même nombre de degrés en plus"}</text></svg>`;
      curseur = `<div class="tool-top cl-curseur"><div class="cl-cur"><label class="cl-cur-l" for="clDeg">🌡️ Degrés en plus : <b>+${fmt(degPlus)} °C</b></label><input type="range" id="clDeg" min="0" max="4" step="0.5" value="${degPlus}" class="wide-range" aria-label="Degrés en plus">
        <div class="cl-crans">${[0, 1, 2, 3, 4].map((d) => `<span data-deg="${d}" class="${d === degPlus ? "on" : ""}">+${d} °C</span>`).join("")}</div></div></div>`;
      carteH = `<h3>🤒 Comme une fièvre</h3><p>${esc(FIEVRE_TXT[t])}</p>`;
    } else if (vueDeg === "vitesse") {
      const X = (an) => 70 + ((an + 22000) / 24100) * 690, Y = (T) => 50 + ((5 - T) / 12) * 340;
      const chemin = COURBE.map(([a, T], i) => `${i ? "L" : "M"}${X(a).toFixed(1)},${Y(T).toFixed(1)}`).join("");
      const ZX = (an) => 110 + ((an - 1850) / 250) * 250, ZY = (T) => 196 - ((T + 0.2) / 4.8) * 92;
      const zoom = ZOOM.map(([a, T], i) => `${i ? "L" : "M"}${ZX(a).toFixed(1)},${ZY(T).toFixed(1)}`).join("");
      const pts = (ptsVitesse = DEG_POINTS.map((p) => ({ ...p, x: p.id === "vite" ? 720 : X(p.an), y: p.id === "vite" ? 150 : Y(p.T) })));
      scene = `<svg viewBox="0 0 800 460" class="cl-svg" aria-label="Température de la Terre sur 22 000 ans">
        <rect width="800" height="460" fill="#f7f9ff"/>
        ${[4, 2, 0, -2, -4, -6].map((T) => `<line x1="70" x2="770" y1="${Y(T)}" y2="${Y(T)}" class="cl-grille ${T === 0 ? "zero" : ""}"/>${t ? `<text x="62" y="${Y(T) + 5}" class="cl-ax e">${T > 0 ? "+" : T < 0 ? "−" : ""}${Math.abs(T)} °C</text>` : ""}`).join("")}
        ${t ? "" : `<text x="62" y="${Y(4) + 5}" class="cl-ax e">🥵</text><text x="62" y="${Y(-6) + 5}" class="cl-ax e">🥶</text>`}
        ${[[-20000, t ? "il y a 20 000 ans" : "il y a très longtemps"], [-10000, t ? "il y a 10 000 ans" : ""], [2025, "aujourd'hui"]].map(([a, l]) => l ? `<text x="${X(a)}" y="420" class="cl-ax ${a > 0 ? "e" : "c"}">${l}</text>` : "").join("")}
        <path d="${chemin}" class="cl-courbe ${reduit() ? "" : "anim"}" pathLength="1"/>
        <path d="M${X(2025)},${Y(1.4)} L${X(2100)},${Y(4.4)}" class="cl-futur haut"/><path d="M${X(2025)},${Y(1.4)} L${X(2100)},${Y(1.8)}" class="cl-futur bas"/>
        <g class="cl-zoom"><rect x="96" y="56" width="284" height="166" rx="12"/><text x="110" y="78" class="cl-zoom-t">🔍 ${t ? "Zoom sur 1850 → 2100" : "Zoom sur la fin"}</text>
          <path d="${zoom}" class="cl-courbe z"/><path d="M${ZX(2025)},${ZY(1.4)} L${ZX(2100)},${ZY(4.4)}" class="cl-futur haut"/><path d="M${ZX(2025)},${ZY(1.4)} L${ZX(2100)},${ZY(1.8)}" class="cl-futur bas"/>
          <text x="${ZX(2100) - 8}" y="${ZY(4.4) + 2}" class="cl-ax e r">${t ? "+4,4 °C" : "🔥"}</text><text x="${ZX(2100) - 4}" y="${ZY(1.8) + 20}" class="cl-ax e v">${t ? "+1,8 °C" : "🌱"}</text>
          <text x="110" y="210" class="cl-ax">1850</text><text x="${ZX(2025)}" y="210" class="cl-ax c">2025</text></g>
        ${pts.map((p) => spot(p, t, p.id === degSel, false)).join("")}
        <text x="770" y="452" class="cl-zone fin">Courbe simplifiée · moyenne mondiale par rapport à 1850-1900</text></svg>`;
      curseur = `<div class="tool-top cl-legende-l"><span><i class="cl-l-h"></i>${t ? "2100 si les émissions augmentent" : "Si on ne fait rien"}</span><span><i class="cl-l-b"></i>${t ? "2100 si on les réduit vite" : "Si on agit vite"}</span>${reduit() ? "" : `<button class="pill" data-act="retracer">↺ Retracer la courbe</button>`}</div>`;
      carteH = `<h3>🐌 → 🚀 Trop vite</h3><p>${esc(DEG_POINTS.find((p) => p.id === "vite").txt[t])}</p><p class="muted">👆 Touche les images sur la courbe pour lire son histoire.</p>`;
    } else {
      const c = CANICULES[canic], ordre = melange(50, 5), chaud = new Set(ordre.slice(0, c.n));
      scene = `<svg viewBox="0 0 800 460" class="cl-svg" aria-label="Canicules extrêmes en 50 ans">
        <rect width="800" height="460" fill="#fff8f0"/>
        <text x="400" y="40" class="cl-titre-s">${t ? `🔥 ${c.n} chaleur${c.n > 1 ? "s" : ""} extrême${c.n > 1 ? "s" : ""} en 50 ans` : `🔥 × ${c.n}`}</text>
        ${Array.from({ length: 50 }, (_, i) => { const x = 50 + (i % 10) * 71, y = 64 + Math.floor(i / 10) * 72, on = chaud.has(i); return `<g transform="translate(${x},${y})"><rect width="62" height="62" rx="12" class="cl-an ${on ? "on" : ""}"/>${on ? `<text x="31" y="33" class="cl-an-f">🔥</text>` : `<text x="31" y="36" class="cl-an-n">${i + 1}</text>`}</g>`; }).join("")}
        <text x="400" y="440" class="cl-zone c fin">${t ? "Chaque case = 1 année · chaleur extrême qui arrivait 1 fois en 50 ans avant 1900 (GIEC)" : "Chaque case = 1 année"}</text></svg>`;
      curseur = `<div class="tool-top cl-curseur"><div class="cl-cur"><label class="cl-cur-l" for="clCan">🌍 Réchauffement de la Terre</label><input type="range" id="clCan" min="0" max="4" step="1" value="${canic}" class="wide-range" aria-label="Réchauffement">
        <div class="cl-crans">${CANICULES.map((x, i) => `<span data-can="${i}" class="${i === canic ? "on" : ""}">${esc(x.nom)}</span>`).join("")}</div></div></div>`;
      carteH = `<h3>🔥 Les canicules</h3>${t ? `<p class="cl-gros">${c.nom} : ${c.n} fois en 50 ans</p>` : ""}<p>${esc(CANICULES_TXT[t])}</p>`;
    }
    remplacer(`<div class="explore cl-explore"><div class="cl-gauche">
        <div class="tool-top"><div class="seg cl-vues" role="group" aria-label="Explication">${DEG_VUES.map(([id, ico, nom]) => `<button data-vue="${id}" class="${id === vueDeg ? "on" : ""}">${ico} ${nom}</button>`).join("")}</div></div>
        <div class="explore-main cl-scene rc-board">${scene}</div>${curseur}</div>
      <aside class="explore-card" id="clCard"><p class="cl-intro">${esc(["Pourquoi quelques degrés, c'est beaucoup ?", "Pourquoi 2 ou 3 degrés de plus, c'est beaucoup ?", "Pourquoi +2 ou +3 °C, c'est énorme ?"][t])}</p>${carteH}</aside></div>`, partiel);
    surFermeture = () => { degSel = null; corps.querySelectorAll(".cl-spot.on").forEach((x) => x.classList.remove("on")); };
    saisie = (e) => {
      if (e.target.id === "clDeg") { degPlus = +e.target.value; degres(true); }
      if (e.target.id === "clCan") { canic = +e.target.value; degres(true); }
    };
    clic = (e) => {
      const v = e.target.closest("[data-vue]"); if (v) { vueDeg = v.dataset.vue; degSel = null; return degres(); }
      const d = e.target.closest("[data-deg]"); if (d) { degPlus = +d.dataset.deg; return degres(); }
      const c = e.target.closest("[data-can]"); if (c) { canic = +c.dataset.can; return degres(); }
      const s = e.target.closest("[data-spot]");
      if (s) { // pas de nouveau rendu : la courbe animée reste tracée
        degSel = s.dataset.spot; const p = ptsVitesse.find((x) => x.id === degSel);
        corps.querySelectorAll(".cl-spot").forEach((x) => x.classList.toggle("on", x === s));
        return bulle(corps.querySelector(".cl-scene"), p.x, p.y, bulleHTML(p.ico, P(p.nom, t), P(p.txt, t)));
      }
      if (e.target.closest("[data-act='retracer']")) { degSel = null; degres(); }
    };
  }

  // ---------- 3. Conséquences ----------
  let epoque = 1, consSel = null, consVues = new Set();
  function consequences(partiel = false) {
    const liste = CONSEQUENCES.filter((c) => c.t <= t);
    if (consSel && !liste.some((c) => c.id === consSel)) consSel = null;
    const ep = EPOQUES[epoque], mer = 330 - ep.mer;
    const peak = [660, 58], gauche = [530, 290], droite = [795, 290], f = 0.6 * ep.glacier;
    const pt = (a, k) => [peak[0] + (a[0] - peak[0]) * k, peak[1] + (a[1] - peak[1]) * k];
    const [gl, dr] = [pt(gauche, f), pt(droite, f)];
    const glacier = ep.glacier > 0.05 ? `M${peak.join(",")} L${dr.join(",")} L${(dr[0] - 18).toFixed(0)},${(dr[1] - 12).toFixed(0)} L${(peak[0] + 12).toFixed(0)},${(dr[1] - 2).toFixed(0)} L${(peak[0] - 16).toFixed(0)},${(gl[1] - 10).toFixed(0)} L${gl.join(",")}Z` : "";
    const herbe = mix("#8bcf7a", "#d8b866", ep.sec), feuilles = mix("#4fae5b", "#c79a3d", ep.sec * 0.8);
    remplacer(`<div class="explore cl-explore"><div class="cl-gauche">
        <div class="explore-main cl-scene rc-board"><svg viewBox="0 0 800 460" class="cl-svg" aria-label="Paysage : conséquences du réchauffement">
          <defs><linearGradient id="clC3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix("#9fd6ff", "#ffd59a", ep.sec * 0.7)}"/><stop offset="1" stop-color="#f2fbff"/></linearGradient></defs>
          <rect width="800" height="460" fill="url(#clC3)"/>
          <circle cx="430" cy="70" r="${(30 + ep.sec * 16).toFixed(0)}" fill="#ffd34d" opacity=".95"/><circle cx="430" cy="70" r="${(46 + ep.sec * 34).toFixed(0)}" fill="#ffb02e" opacity="${(0.12 + ep.sec * 0.2).toFixed(2)}"/>
          <path d="M${gauche.join(",")} L${peak.join(",")} L${droite.join(",")} L800,290 L800,330 L520,330Z" fill="#9b8f86"/>
          ${glacier ? `<path d="${glacier}" fill="#f4fbff" stroke="#cfe6f5" stroke-width="2"/>` : ""}
          <path d="M250,335 C330,300 420,290 520,300 C600,292 700,300 800,292 L800,460 L250,460Z" fill="${herbe}"/>
          <path d="M240,336 L330,312 L330,460 L240,460Z" fill="#f1dca0"/>
          ${[[270, 318], [304, 309]].map(([x, y]) => `<g transform="translate(${x},${y})"><rect x="-12" y="-20" width="24" height="20" fill="#fff"/><path d="M-16,-20 L0,-34 L16,-20Z" fill="#3f7fd9"/></g>`).join("")}
          <rect y="${mer}" width="${300 + ep.mer * 1.2}" height="${460 - mer}" fill="#4aa3e8" opacity=".92"/>
          <path d="M0,${mer} q20,-6 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0" stroke="#bfe6ff" stroke-width="3" fill="none"/>
          <ellipse cx="105" cy="${mer + 3}" rx="${(10 + 70 * ep.banquise).toFixed(0)}" ry="9" fill="#f4fbff" stroke="#cfe6f5" stroke-width="2"/>
          ${[[470, 320], [560, 312], [720, 318]].map(([x, y]) => `<g transform="translate(${x},${y})"><rect x="-4" y="-22" width="8" height="22" fill="#8a5a2b"/><circle cy="-34" r="20" fill="${feuilles}"/></g>`).join("")}
          ${[[340, 350], [380, 358], [420, 352]].map(([x, y]) => `<path d="M${x},${y} v18 M${x - 6},${y + 4} l6,6 6,-6" stroke="${mix("#5fa84f", "#b98d3e", ep.sec)}" stroke-width="3" fill="none"/>`).join("")}
          <g transform="translate(535,150)"><ellipse rx="56" ry="22" fill="#c9d3e0"/><circle cx="-22" cy="-14" r="20" fill="#c9d3e0"/><circle cx="14" cy="-20" r="24" fill="#c9d3e0"/>
            ${Array.from({ length: 6 }, (_, i) => `<line x1="${-36 + i * 14}" y1="26" x2="${-42 + i * 14}" y2="44" stroke="#3a8fe0" stroke-width="3" stroke-linecap="round" class="cl-goutte" style="animation-delay:${i * 0.17}s"/>`).join("")}</g>
          <g class="cl-epoque" transform="translate(12,12)"><rect width="${Math.round(Math.max(P(ep.nom, t).length, 8) * 9.6 + 28)}" height="${t ? 64 : 42}" rx="14"/><text x="14" y="28" class="cl-ep-n">${esc(P(ep.nom, t))}</text>${t && P(ep.degre, t) ? `<text x="14" y="54" class="cl-ep-d">${esc(P(ep.degre, t))}</text>` : ""}</g>
          ${liste.map((c) => spot(c, t, c.id === consSel, consVues.has(c.id))).join("")}
          ${ep.mer ? `<text x="790" y="452" class="cl-zone fin">Dessin exagéré pour bien voir</text>` : ""}
        </svg></div>
      <div class="tool-top cl-curseur">
        <div class="cl-cur"><label class="cl-cur-l" for="clEp">⏳ Le temps</label><input type="range" id="clEp" min="0" max="3" step="1" value="${epoque}" class="wide-range" aria-label="Époque">
          <div class="cl-crans">${EPOQUES.map((x, i) => `<span data-ep="${i}" class="${i === epoque ? "on" : ""}">${esc(P(x.nom, t))}</span>`).join("")}</div></div></div></div>
        <aside class="explore-card" id="clCard"></aside></div>`, partiel);
    const c = CONSEQUENCES.find((x) => x.id === consSel), n = liste.filter((x) => consVues.has(x.id)).length;
    corps.querySelector("#clCard").innerHTML = `<h3>⏳ ${esc(P(ep.nom, t))}</h3>${t && P(ep.degre, t) ? `<p class="cl-gros">${esc(P(ep.degre, t))}</p>` : ""}<p>${esc(EPOQUES_TXT[epoque][t])}</p><p class="muted">👆 Bouge le curseur du temps, puis touche les images pour découvrir les conséquences.</p>`
      + `<p class="cl-compte">${n === liste.length ? "🎉 Tout est découvert !" : `Découvert : <b>${n}</b> / ${liste.length}`}</p>`;
    if (c) bulle(corps.querySelector(".cl-scene"), c.x, c.y, bulleHTML(c.ico, P(c.nom, t), P(c.txt, t)));
    surFermeture = () => { consSel = null; corps.querySelectorAll(".cl-spot.on").forEach((x) => x.classList.remove("on")); };
    const choisir = (v, partiel = false) => { epoque = Math.max(0, Math.min(3, v)); consSel = null; consequences(partiel); };
    saisie = (e) => { if (e.target.id === "clEp") choisir(+e.target.value, true); };
    clic = (e) => {
      const s = e.target.closest("[data-spot]"); if (s) { consSel = s.dataset.spot; consVues.add(consSel); return consequences(); }
      const x = e.target.closest("[data-ep]"); if (x) choisir(+x.dataset.ep);
    };
  }

  // ---------- 4. Agir ----------
  let gestes = null, gestesPalier = -1, choix = {}, choisi = null;
  function agir() {
    if (gestesPalier !== t) {
      const l = GESTES.filter((g) => g.t <= t);
      gestes = shuffle([...shuffle(l.filter((g) => g.ok)).slice(0, 6), ...shuffle(l.filter((g) => !g.ok)).slice(0, 6)]);
      gestesPalier = t; choix = {}; choisi = null;
    }
    let dragFin = null;
    const etq = (g, cls = "") => `<button class="dk-etq cl-geste ${cls} ${choisi === g.id ? "on" : ""}" data-etq="${g.id}"><span class="cl-g-i">${g.ico}</span><span>${esc(g.nom)}</span></button>`;
    const dessiner = (solution = false, res = "") => {
      dragFin?.();
      if (solution) gestes.forEach((g) => { choix[g.id] = g.ok ? "1" : "0"; });
      const col = (v, titre) => `<div class="cl-col ${v === "1" ? "oui" : "non"}" data-cible="${v}"><h4>${titre}</h4><div class="cl-col-l">${gestes.filter((g) => choix[g.id] === v).map((g) => etq(g, solution ? "good" : "")).join("")}</div></div>`;
      corps.innerHTML = `<div class="explore cl-explore">
          <div class="cl-tri rc-board"><p class="center cl-cons">${["Ce geste aide-t-il la planète ?", "Range chaque geste dans la bonne colonne.", "Range chaque geste : aide-t-il à rejeter moins de gaz à effet de serre ?"][t]} <span class="muted">Glisse, ou touche un geste puis une colonne.</span></p>
            <div class="dk-banque cl-banque">${gestes.filter((g) => !choix[g.id]).map((g) => etq(g)).join("") || `<span class="muted">Tous les gestes sont rangés.</span>`}</div>
            <div class="cl-cols">${col("1", "👍 Ça aide la planète")}${col("0", "👎 Ça la réchauffe")}</div>
            <div class="tool-top"><button class="big-btn" data-act="verifier">✔ Vérifier</button><button class="pill" data-act="solution">💡 Solution</button><button class="pill" data-act="recommencer">↺ Recommencer</button></div><div class="cl-res">${res}</div></div>
          <aside class="explore-card"><h3>🤝 Tous ensemble</h3><ul class="cl-ensemble">${ENSEMBLE.map((x) => `<li><span>${x.ico}</span><p><b>${esc(P(x.nom, t))}</b> ${esc(P(x.txt, t))}</p></li>`).join("")}</ul>
            <p class="cl-espoir">🌱 ${esc(ENSEMBLE_MSG[t])}</p></aside></div>`;
      dragFin = dragEtiquettes(corps, { onPose: (b, c) => { choix[b.dataset.etq] = c.dataset.cible; choisi = null; dessiner(); } });
    };
    dessiner();
    clic = (e) => {
      if (clicApresDrag(corps)) return;
      const b = e.target.closest("button, [data-cible]"); if (!b) return;
      if (b.dataset.etq) {
        if (b.closest("[data-cible]")) { delete choix[b.dataset.etq]; return dessiner(); }
        choisi = choisi === b.dataset.etq ? null : b.dataset.etq;
        corps.querySelectorAll(".cl-geste").forEach((x) => x.classList.toggle("on", x.dataset.etq === choisi)); return;
      }
      if (b.dataset.cible && choisi) { choix[choisi] = b.dataset.cible; choisi = null; return dessiner(); }
      const a = b.dataset.act;
      if (a === "verifier") {
        let ok = 0;
        corps.querySelectorAll(".cl-col .cl-geste").forEach((x) => { const g = gestes.find((y) => y.id === x.dataset.etq), bon = (g.ok ? "1" : "0") === choix[g.id]; if (bon) ok++; x.classList.add(bon ? "good" : "bad"); });
        const reste = gestes.filter((g) => !choix[g.id]).length;
        corps.querySelector(".cl-res").innerHTML = scoreHTML(ok, gestes.length) + (reste ? `<p class="muted center">Il reste ${reste} geste${reste > 1 ? "s" : ""} à ranger.</p>` : ok < gestes.length ? `<p class="muted center">Les étiquettes rouges sont mal rangées : touche-les pour les reprendre.</p>` : "");
        if (ok === gestes.length) bravo(el);
      }
      if (a === "solution") dessiner(true);
      if (a === "recommencer") { gestesPalier = -1; agir(); }
    };
    fin = () => dragFin?.();
  }

  // ---------- 5. Quiz ----------
  let qz = null;
  function quiz() {
    if (!qz || qz.t !== t) {
      const l = shuffle(QUIZ.filter((q) => q.t.includes(t))).slice(0, t ? 8 : 6);
      qz = { t, l: l.map((q) => { const vf = q.r.length === 2 && q.r[0] === "Vrai"; const ordre = vf ? [0, 1] : shuffle(q.r.map((_, i) => i)); return { ...q, ordre }; }), i: 0, ok: 0, rep: null };
    }
    const fini = qz.i >= qz.l.length;
    if (fini) {
      corps.innerHTML = `<div class="cl-quiz rc-board"><h3 class="center">${qz.ok === qz.l.length ? "🏆 Parfait !" : qz.ok >= qz.l.length * 0.6 ? "🌟 Bravo !" : "🌱 Bien essayé !"}</h3>${scoreHTML(qz.ok, qz.l.length)}
        <div class="tool-top"><button class="big-btn" data-act="rejouer">↺ Rejouer</button></div></div>`;
      if (qz.ok === qz.l.length) bravo(el);
    } else {
      const q = qz.l[qz.i], rep = qz.rep;
      corps.innerHTML = `<div class="cl-quiz rc-board"><p class="cl-q-n">Question ${qz.i + 1} / ${qz.l.length}</p><h3 class="cl-q">${esc(q.q)}</h3>
        <div class="cl-reps">${q.ordre.map((k) => `<button class="cl-rep ${rep == null ? "" : k === q.ok ? "good" : k === rep ? "bad" : "off"}" data-rep="${k}" ${rep == null ? "" : "disabled"}>${esc(q.r[k])}</button>`).join("")}</div>
        ${rep == null ? "" : `<p class="cl-expl ${rep === q.ok ? "ok" : "ko"}">${rep === q.ok ? "✅ Oui !" : "❌ Non."} ${esc(q.e)}</p><div class="tool-top"><button class="big-btn" data-act="suivant">${qz.i + 1 < qz.l.length ? "Suivant →" : "Voir mon score"}</button></div>`}
        <p class="muted center">Score : ${qz.ok}</p></div>`;
    }
    clic = (e) => {
      const r = e.target.closest("[data-rep]");
      if (r && qz.rep == null) { qz.rep = +r.dataset.rep; if (qz.rep === qz.l[qz.i].ok) qz.ok++; return quiz(); }
      const a = e.target.closest("[data-act]")?.dataset.act;
      if (a === "suivant") { qz.i++; qz.rep = null; quiz(); }
      if (a === "rejouer") { qz = null; quiz(); }
    };
  }

  // ---------- Fiche enseignant ----------
  const ouvrirProf = () => {
    const E = ENSEIGNANT, d = document.createElement("div");
    d.className = "cl-prof";
    d.innerHTML = `<div class="cl-prof-box" role="dialog" aria-label="Fiche enseignant"><button class="round-btn cl-x rc-keep" data-act="prof-x" aria-label="Fermer">✕</button>
      <h3>📖 Fiche enseignant</h3>
      <p class="muted">Même activité pour toute l'école primaire : choisissez le niveau en haut. CP-CE1 : mots simples, pas de chiffres. CE2 : premiers chiffres et vocabulaire. CM1-CM2 : gaz, chiffres du GIEC, émissions de la France.</p>
      <h4>Déroulé conseillé (2 séances de 45 min)</h4><ol>${E.deroule.map(([a, b]) => `<li><b>${a}</b> : ${esc(b)}</li>`).join("")}</ol>
      <h4>Vocabulaire</h4><dl class="cl-dl">${E.vocab.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>
      <h4>Idées reçues à travailler</h4><ul>${E.idees.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <h4>Ne pas inquiéter</h4><p>${esc(E.anxiete)}</p>
      <h4>Liens avec les programmes</h4><ul>${E.programmes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <h4>⚠️ À vérifier par l'enseignant·e</h4><ul class="cl-verif">${E.verifier.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <h4>Sources</h4><ul class="cl-sources">${E.sources.map(([a, u]) => `<li>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(a)}</a>` : esc(a)}</li>`).join("")}</ul></div>`;
    el.querySelector(".cl-root").appendChild(d);
  };

  el.onclick = (e) => {
    const b = e.target.closest("button");
    if (b?.dataset.niv) { niv.set(b.dataset.niv); el.querySelectorAll(".dk-niv button").forEach((x) => x.classList.toggle("on", x === b)); t = palier(b.dataset.niv); return rendu(); }
    if (b?.dataset.etape) { etape = b.dataset.etape; rendu(); return entree(corps); }
    if (b?.dataset.act === "prof") return ouvrirProf();
    if (b?.dataset.act === "prof-x" || e.target.classList.contains("cl-prof")) return el.querySelector(".cl-prof")?.remove();
    if (e.target.closest(".cl-prof")) return;
    if (b?.dataset.act === "bulle-x" || (e.target.closest(".cl-scene") && !e.target.closest("[data-spot],[data-info],.cl-bulle"))) fermerBulle();
    clic?.(e);
  };
  el.oninput = (e) => saisie?.(e);
  el.onkeydown = (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.closest?.("[data-spot],.cl-i")) { e.preventDefault(); clic?.(e); } };
  rendu();
  return () => fin?.();
}

export const CLIMAT = [
  { id: "climat", nom: "Le climat change", icone: "🌡️", couleur: "#ffd9b8", desc: "Effet de serre, causes, conséquences, agir, quiz · CP → CM2", cat: "decouvrir", niveaux: ["CP", "CE1", "CE2", "CM1", "CM2"], mount: mountClimat },
];
