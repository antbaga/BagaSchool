// À découvrir : le monde à plat (planisphères en projection Equal Earth).
// 4 activités : continents et océans, pays du monde, monde physique, grandes villes.
// Toutes reposent sur un même « atelier » : carte zoomable + modes Explorer / Quiz / Placer (glisser ou toucher-toucher).
import { esc, shuffle, niveauxHTML, niveauMemo, bravo, dragEtiquettes, clicApresDrag, NIVEAUX } from "./kit.js";
import { CARTE, PAYS_D, AUTRES_D, CONT_D, FLEUVES_D } from "../data/decouvrir/monde-carte.js";
import { CONTINENTS, PAYS_INFO, PAYS_NOTE, UE27, UE_FONDATEURS } from "../data/decouvrir/monde-infos.js";
import { CONT_FICHE, OCEANS, MERS_NEUTRES, EUROPE_CLIP, LIMITE_EU_AS, LIGNES, FLEUVES, MASSIFS, MILIEUX, MILIEUX_PT, ZONES, BANDES, VILLES } from "../data/decouvrir/monde-physique.js";

const { W, H, S: ECH } = CARTE;
const SOURCE = "Fonds de carte : Natural Earth (domaine public), projection Equal Earth. Tracés simplifiés.";
const nivIdx = (n) => NIVEAUX.indexOf(n);

// ---------- Projection Equal Earth (mêmes constantes que le script qui a pré-projeté les pays) ----------
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
function P(lon, lat) {
  const l = (lon * Math.PI) / 180, t = Math.asin(M * Math.sin((Math.max(-89.99, Math.min(89.99, lat)) * Math.PI) / 180)), t2 = t * t, t6 = t2 * t2 * t2;
  return [W / 2 + ((l * Math.cos(t)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)))) * ECH, H / 2 - t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)) * ECH];
}
function inverse(X, Y) {
  const x = (X - W / 2) / ECH, y = (H / 2 - Y) / ECH;
  let t = y / A1;
  for (let i = 0; i < 12; i++) { const t2 = t * t, t6 = t2 * t2 * t2; const f = t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)) - y, d = A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2); t -= f / d; }
  const t2 = t * t, t6 = t2 * t2 * t2, s = Math.sin(t) / M;
  if (Math.abs(s) > 1) return null;
  const lon = (x * M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))) / Math.cos(t);
  if (Math.abs(lon) > Math.PI) return null;
  return [(lon * 180) / Math.PI, (Math.asin(s) * 180) / Math.PI];
}
const f1 = (n) => n.toFixed(1);
// anneaux [lon,lat] → chemin SVG, avec densification (les droites en degrés deviennent des courbes)
function dense(r, pas = 2) {
  const o = [];
  r.forEach((p, i) => { const q = r[(i + 1) % r.length]; o.push(p); const n = Math.ceil(Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1])) / pas); for (let k = 1; k < n; k++) o.push([p[0] + ((q[0] - p[0]) * k) / n, p[1] + ((q[1] - p[1]) * k) / n]); });
  return o;
}
const anneaux = (rings) => rings.map((r) => "M" + dense(r).map((p) => P(...p).map(f1).join(",")).join("L") + "Z").join("");
const ligne = (pts) => "M" + pts.map((p) => P(...p).map(f1).join(",")).join("L");
const SPHERE = (() => { const g = [], d = []; for (let la = -90; la <= 90; la += 3) g.push(P(-180, la)); for (let la = 90; la >= -90; la -= 3) d.push(P(180, la)); return "M" + [...g, ...d].map((p) => p.map(f1).join(",")).join("L") + "Z"; })();
const GRATICULE = (() => {
  let d = ""; for (const la of [-60, -30, 30, 60]) { const [x0, y] = P(-180, la), [x1] = P(180, la); d += `M${f1(x0)},${f1(y)}H${f1(x1)}`; }
  for (let lo = -150; lo <= 150; lo += 30) { const pts = []; for (let la = -90; la <= 90; la += 5) pts.push([lo, la]); d += ligne(pts); }
  return d;
})();
const DEFS = `<defs><clipPath id="mo-sph"><path d="${SPHERE}"/></clipPath>
  <linearGradient id="mo-mer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfeaff"/><stop offset=".5" stop-color="#a9d8fb"/><stop offset="1" stop-color="#cfeaff"/></linearGradient>
  <pattern id="mo-pdes" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="34" height="34" fill="#ffd36e" fill-opacity=".22"/><rect width="7" height="34" fill="#d9822b" fill-opacity=".7"/></pattern>
  <pattern id="mo-pfor" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#1f8a3a" fill-opacity=".16"/><circle cx="10" cy="10" r="6.5" fill="#14632a" fill-opacity=".85"/><circle cx="30" cy="30" r="6.5" fill="#14632a" fill-opacity=".85"/></pattern>
  <clipPath id="mo-eu"><path d="${anneaux([EUROPE_CLIP])}"/></clipPath></defs>`;
const MER = (cible) => `<path d="${SPHERE}" class="mo-mer"${cible ? ` data-cible="mer"` : ""}/><path d="${GRATICULE}" class="mo-grat"/>`;
const PD = Object.fromEntries(PAYS_D.map((p) => [p[0], p]));

// Océan le plus proche d'un point (graines par océan) ; null dans les mers « neutres » ou hors carte.
const gc = (a, b) => { const r = Math.PI / 180; return Math.acos(Math.min(1, Math.sin(a[1] * r) * Math.sin(b[1] * r) + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.cos((a[0] - b[0]) * r))); };
function oceanEn(ll) {
  if (!ll) return null;
  let best = null, bd = 9;
  for (const [k, o] of Object.entries(OCEANS)) for (const g of o[3]) { const d = gc(ll, g); if (d < bd) { bd = d; best = k; } }
  for (const g of MERS_NEUTRES) if (gc(ll, g) < bd) return null;
  return best;
}

// Drapeau emoji : seulement si le système sait les dessiner (Windows affiche sinon deux lettres).
let flagsOK = null;
function drapeau(code) {
  if (flagsOK === null) {
    try {
      const c = document.createElement("canvas"); c.width = c.height = 24; const g = c.getContext("2d", { willReadFrequently: true });
      g.font = "20px sans-serif"; g.textBaseline = "top"; g.fillText("\u{1F1EB}\u{1F1F7}", 0, 0);
      const d = g.getImageData(0, 0, 24, 24).data; flagsOK = false;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 100 && Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 60) { flagsOK = true; break; }
    } catch { flagsOK = false; }
  }
  if (!flagsOK || !code || code === "xk" || code === "aq" || PAYS_INFO[code]?.[3] === 0) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

// Largeur d'un texte (pour dessiner les étiquettes posées sur la carte).
const mesure = (() => { let g; return (t) => { g ||= document.createElement("canvas").getContext("2d"); g.font = "800 15px Nunito, system-ui, sans-serif"; return g.measureText(t).width; }; })();

// Copie de zoomSVG (kit.js) avec en plus : aller(vue) pour cadrer une région, vue() et un rappel onChange.
function zoomCarte(svg, { max = 8, onChange } = {}) {
  const vb0 = svg.viewBox.baseVal; const base = [vb0.x, vb0.y, vb0.width, vb0.height];
  let v = [...base];
  const appliquer = () => { svg.setAttribute("viewBox", v.map((n) => n.toFixed(2)).join(" ")); onChange?.(); };
  const borner = () => {
    v[2] = Math.min(base[2], Math.max(base[2] / max, v[2])); v[3] = v[2] * (base[3] / base[2]);
    v[0] = Math.min(base[0] + base[2] - v[2], Math.max(base[0], v[0]));
    v[1] = Math.min(base[1] + base[3] - v[3], Math.max(base[1], v[1]));
  };
  const versSVG = (cx, cy) => { const r = svg.getBoundingClientRect(); const s = Math.max(v[2] / r.width, v[3] / r.height); const ox = (r.width * s - v[2]) / 2, oy = (r.height * s - v[3]) / 2; return [v[0] + (cx - r.left) * s - ox, v[1] + (cy - r.top) * s - oy]; };
  const zoomer = (k, cx, cy) => {
    const [px, py] = cx == null ? [v[0] + v[2] / 2, v[1] + v[3] / 2] : versSVG(cx, cy);
    const w = v[2] / k; const kk = v[2] / Math.min(base[2], Math.max(base[2] / max, w));
    v[0] = px - (px - v[0]) / kk; v[1] = py - (py - v[1]) / kk; v[2] /= kk; v[3] = v[2] * (base[3] / base[2]);
    borner(); appliquer();
  };
  const wheel = (e) => { e.preventDefault(); zoomer(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX, e.clientY); };
  const pts = new Map(); let pan = null, pinch = null;
  const down = (e) => {
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) }; pan = null; }
    else if (pts.size === 1 && v[2] < base[2] - 0.01 && !e.target.closest("[data-etq]")) pan = { x: e.clientX, y: e.clientY, v: [...v], moved: false };
  };
  const move = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) {
      const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d > 0 && pinch.d > 0) zoomer(d / pinch.d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch.d = d; e.preventDefault();
    } else if (pan) {
      const r = svg.getBoundingClientRect(); const s = Math.max(v[2] / r.width, v[3] / r.height);
      const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
      if (Math.hypot(dx, dy) > 6) pan.moved = true;
      if (pan.moved) { v[0] = pan.v[0] - dx * s; v[1] = pan.v[1] - dy * s; borner(); appliquer(); }
    }
  };
  const up = (e) => {
    pts.delete(e.pointerId);
    if (pan?.moved) { svg._dkPanFini = true; setTimeout(() => { svg._dkPanFini = false; }, 0); }
    if (pts.size < 2) pinch = null; if (!pts.size) pan = null;
  };
  svg.addEventListener("wheel", wheel, { passive: false });
  svg.addEventListener("pointerdown", down); svg.addEventListener("pointermove", move);
  svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", up);
  svg.style.touchAction = "none";
  const reset = () => { v = [...base]; appliquer(); };
  const boutonsHTML = `<div class="dk-zoom"><button data-zoom="in" aria-label="Zoomer">+</button><button data-zoom="out" aria-label="Dézoomer">−</button><button data-zoom="reset" aria-label="Vue entière">⟲</button></div>`;
  const clic = (e) => { const b = e.target.closest?.("[data-zoom]"); if (!b) return; e.stopPropagation(); b.dataset.zoom === "in" ? zoomer(1.5) : b.dataset.zoom === "out" ? zoomer(1 / 1.5) : reset(); };
  let hote = null;
  return {
    reset, boutonsHTML,
    lier(conteneur) { hote = conteneur; conteneur.addEventListener("click", clic, true); },
    panFini: () => !!svg._dkPanFini,
    vue: () => [...v],
    // cadre [x, y, largeur, hauteur] (coordonnées SVG), en gardant les proportions de la carte
    aller(c) {
      if (!c) return reset();
      const k = base[3] / base[2]; let [x, y, w, h] = c;
      if (h > w * k) { const w2 = h / k; x -= (w2 - w) / 2; w = w2; } else { const h2 = w * k; y -= (h2 - h) / 2; h = h2; }
      v = [x, y, w, h]; borner(); appliquer();
    },
    cleanup() { svg.removeEventListener("wheel", wheel); hote?.removeEventListener("click", clic, true); },
  };
}
// boîte [lon0, lat0, lon1, lat1] → cadre SVG
function cadre([lo0, la0, lo1, la1]) {
  const pts = []; for (let i = 0; i <= 8; i++) { const lo = lo0 + ((lo1 - lo0) * i) / 8, la = la0 + ((la1 - la0) * i) / 8; pts.push(P(lo, la0), P(lo, la1), P(lo0, la), P(lo1, la)); }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return [x, y, Math.max(...xs) - x, Math.max(...ys) - y];
}

// ---------- L'atelier : carte + modes, partagé par les 4 activités ----------
// cfg : id, niveaux, defaut, modes [[id, libellé]], etat(), options(S), fond(S), items(S) → [{id, nom, quiz?, star?}],
//       pt(id, S) → [x, y], fiche(id, S), intro(S), mer(S) (vrai : la mer est une cible), noms(S, u) → [{id, nom}],
//       lot(S), coloriage(S) → {palette, cibles: {id: attendu}} | null, vue(S) → boîte, bouton(b, S) / change(t, S) → "monter" | "jeu" | "carte".
function atelier(el, cfg) {
  const memo = niveauMemo(cfg.id, cfg.niveaux, cfg.defaut);
  const S = { niv: memo.get(), mode: cfg.modes[0][0], sel: null, noms: false, ...(cfg.etat?.() || {}) };
  let svg = null, zoom = null, ro = null, vueGardee = null, raf = 0, minuteur = 0, cadrer = true;
  const J = { pos: {}, verif: null, sol: false, pris: null, lot: [], q: null, coul: {}, pal: null, flash: {} };
  const items = () => cfg.items(S);
  const nomDe = (id) => items().find((i) => i.id === id)?.nom ?? cfg.nom?.(id, S) ?? id;

  function nouveauJeu() {
    clearTimeout(minuteur);
    const its = items();
    Object.assign(J, { pos: {}, verif: null, sol: false, pris: null, coul: {}, pal: null, flash: {} });
    const n = cfg.lot?.(S) ?? its.length;
    J.lot = shuffle(its.filter((i) => i.quiz !== false)).slice(0, n).map((i) => i.id);
    J.q = { ordre: [], cible: null, ok: 0, total: 0, essais: 0, msg: "" };
    if (S.mode === "quiz") question();
  }
  function question() {
    const q = J.q, ids = items().filter((i) => i.quiz !== false).map((i) => i.id);
    if (!ids.length) { q.cible = null; return; }
    if (!q.ordre.length) q.ordre = shuffle(ids);
    q.cible = q.ordre.pop(); q.essais = 0; J.flash = {};
  }

  // --- rendu ---
  function monter() {
    if (svg) vueGardee = zoom.vue();
    zoom?.cleanup(); ro?.disconnect();
    el.innerHTML = `<div class="tool-top wrap mo-top">
        <div class="seg" role="group" aria-label="Mode">${cfg.modes.map(([m, t]) => `<button data-mode="${m}" class="${S.mode === m ? "on" : ""}">${t}</button>`).join("")}</div>
        ${niveauxHTML(cfg.niveaux, S.niv)}${cfg.options?.(S) ?? ""}</div>
      <div class="explore mo-explore rc-board"><div class="explore-main mo-main"><svg class="mo-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Planisphère"></svg>${cfg.sous?.(S) ?? ""}</div>
      <aside class="explore-card mo-card"></aside></div>
      <p class="dk-source">${cfg.source ?? SOURCE}</p>`;
    svg = el.querySelector(".mo-svg");
    const main = el.querySelector(".mo-main");
    zoom = zoomCarte(svg, { max: 12, onChange: () => majEchelle() });
    main.insertAdjacentHTML("beforeend", zoom.boutonsHTML); zoom.lier(main);
    ro = new ResizeObserver(() => majEchelle()); ro.observe(svg);
    dessinerCarte();
    if (cadrer) { cadrer = false; const b = cfg.vue?.(S); zoom.aller(b ? cadre(b) : null); }
    else if (vueGardee) zoom.aller(vueGardee);
    carte();
  }
  function dessinerCarte() {
    svg.innerHTML = DEFS + cfg.fond(S) + `<g class="mo-pills"></g>`;
    marquer(); etiquettes();
  }
  // classes d'état sur les formes (sélection, bon, faux, couleurs)
  function marquer() {
    if (!svg) return;
    svg.querySelectorAll("[data-cible]").forEach((n) => {
      const id = n.dataset.cible;
      n.classList.toggle("on", S.mode === "explorer" && S.sel === id);
      n.classList.toggle("good", J.flash[id] === "good");
      n.classList.toggle("bad", J.flash[id] === "bad");
      n.classList.toggle("indice", J.flash[id] === "indice");
      const c = J.coul[id]; const pal = cfg.coloriage?.(S)?.palette;
      if (pal) { n.style.fill = c ? pal[c][1] : ""; n.classList.toggle("vide", !c); n.classList.toggle("bad", !!J.verif && J.verif[id] === false); n.classList.toggle("good", !!J.verif && J.verif[id] === true); }
    });
  }
  // étiquettes posées (placer) ou noms affichés (explorer)
  function etiquettes() {
    const g = svg?.querySelector(".mo-pills"); if (!g) return;
    const u = unite();
    let html = "";
    const pill = (id, nom, pt, cls, data = "") => {
      if (!pt) return "";
      const w = Math.ceil(mesure(nom)) + 22;
      return `<g class="mo-pill ${cls}" ${data} data-x="${f1(pt[0])}" data-y="${f1(pt[1])}"><g transform="translate(0,${cfg.decal ?? 0})"><rect x="${-w / 2}" y="-15" width="${w}" height="30" rx="15"/><text y="1">${esc(nom)}</text></g></g>`;
    };
    if (S.mode === "placer" && !cfg.coloriage?.(S)) {
      for (const [l, t] of Object.entries(J.pos)) {
        const v = J.verif?.[l]; const it = items().find((i) => i.id === l);
        html += pill(l, (it?.star ? "★ " : "") + nomDe(l), cfg.pt(t, S), `${v === true ? "good" : v === false ? "bad" : ""} ${J.pris ? "cible" : ""}`, `data-pill="${l}"`);
      }
    } else if (S.mode === "explorer" && S.noms) {
      for (const it of cfg.noms ? cfg.noms(S, u * echellePill() * (cfg.pillK ?? 1)) : items()) html += pill(it.id, it.nom, cfg.pt(it.id, S), "nom");
    }
    if (S.mode === "explorer" && S.sel && !S.noms) html += pill(S.sel, cfg.nomCourt?.(S.sel, S) ?? nomDe(S.sel), cfg.pt(S.sel, S), "nom sel");
    g.innerHTML = (cfg.marques?.(S) ?? "") + html;
    majEchelle(true);
  }
  // taille des étiquettes selon la largeur de la carte à l'écran
  function echellePill() { const w = svg?.getBoundingClientRect().width || 1000; return w < 560 ? 0.72 : w < 900 ? 0.82 : w > 1300 ? 1.15 : 1; }
  // nombre d'unités SVG par pixel écran
  function unite() {
    if (!svg) return 1;
    const r = svg.getBoundingClientRect(), v = svg.viewBox.baseVal;
    return r.width ? Math.max(v.width / r.width, v.height / r.height) : W / 1000;
  }
  function majEchelle(direct) {
    if (!svg) return;
    const u = unite(), k = u * echellePill() * (cfg.pillK ?? 1);
    svg.style.setProperty("--u", u);
    svg.querySelectorAll("[data-x]").forEach((n) => n.setAttribute("transform", `translate(${n.dataset.x},${n.dataset.y}) scale(${k.toFixed(4)})`));
    if (!direct && S.mode === "explorer" && S.noms && cfg.noms) { cancelAnimationFrame(raf); raf = requestAnimationFrame(etiquettes); }
  }

  // panneau latéral
  function carte(msg) {
    const c = el.querySelector(".mo-card"); if (!c) return;
    if (S.mode === "explorer") {
      c.innerHTML = (S.sel ? cfg.fiche(S.sel, S) : cfg.intro(S)) +
        `<label class="check mo-chk"><input type="checkbox" data-opt="noms" ${S.noms ? "checked" : ""}> Afficher les noms</label>${cfg.optionsExplorer?.(S) ?? ""}`;
    } else if (S.mode === "quiz") {
      const q = J.q;
      c.innerHTML = q.cible ? `<h3>Quiz</h3><p>Touche sur la carte :</p><div class="quiz-target">${esc(nomDe(q.cible))}</div>
        <div class="answer mo-msg ${q.msg ? "" : "vide"}">${q.msg || "&nbsp;"}</div><p class="score">Score : <b>${q.ok}</b> / ${q.total}</p>
        <button class="pill" data-act="passer">Autre question</button>` : `<p>Rien à trouver ici : choisis une autre série.</p>`;
    } else {
      const col = cfg.coloriage?.(S);
      if (col) {
        c.innerHTML = `<h3>${col.titre}</h3><p class="muted">${col.consigne}</p>
          <div class="mo-pal">${Object.entries(col.palette).map(([k, [n, couleur]]) => `<button data-pal="${k}" class="${J.pal === k ? "on" : ""}" style="--pc:${couleur}">${esc(n)}</button>`).join("")}</div>
          ${boutons()}<div class="answer mo-msg ${msg ? "" : "vide"}">${msg || "&nbsp;"}</div>`;
      } else {
        const reste = cfg.lot && items().filter((i) => i.quiz !== false).length > J.lot.length;
        c.innerHTML = `<h3>${cfg.titrePlacer?.(S) ?? "Place les étiquettes"}</h3><p class="muted mo-consigne">Glisse chaque étiquette sur la carte, ou touche une étiquette puis l'endroit. Touche une étiquette posée pour la reprendre.</p>
          <div class="dk-banque mo-banque"></div>${boutons(reste)}<div class="answer mo-msg ${msg ? "" : "vide"}">${msg || "&nbsp;"}</div>`;
        banque();
      }
    }
  }
  const boutons = (reste) => `<div class="mo-btns"><button class="pill" data-act="verif">✔️ Vérifier</button><button class="pill" data-act="sol">💡 Solution</button><button class="pill" data-act="reset">↺ Recommencer</button>${reste ? `<button class="pill" data-act="suite">➜ Autres étiquettes</button>` : ""}</div>`;
  function banque() {
    const b = el.querySelector(".mo-banque"); if (!b) return;
    const libres = J.lot.filter((l) => !J.pos[l]);
    b.innerHTML = libres.length ? libres.map((l) => { const it = items().find((i) => i.id === l); return `<button class="dk-etq ${J.pris === l ? "on" : ""} ${it?.star ? "star" : ""}" data-etq="${l}">${it?.star ? "★ " : ""}${esc(nomDe(l))}</button>`; }).join("") : `<p class="muted">Toutes les étiquettes sont posées. Touche « Vérifier ».</p>`;
  }
  const message = (m) => { const n = el.querySelector(".mo-msg"); if (n) { n.innerHTML = m || "&nbsp;"; n.classList.toggle("vide", !m); } };

  // --- cibles sous un point ---
  function idsSous(cx, cy) {
    const ids = [];
    for (const n of document.elementsFromPoint(cx, cy)) {
      if (!svg.contains(n)) continue;
      const c = n.closest("[data-cible]"); if (!c) continue;
      let v = c.dataset.cible;
      if (v === "mer") { const m = svg.getScreenCTM().inverse(), p = new DOMPoint(cx, cy).matrixTransform(m); v = oceanEn(inverse(p.x, p.y)); }
      if (v && !ids.includes(v)) ids.push(v);
    }
    return ids;
  }
  function resoudre(cx, cy, attendu, cibleKit) {
    const ids = idsSous(cx, cy);
    if (ids.includes(attendu)) return attendu;
    if (ids.length) return ids[0];
    const v = cibleKit?.dataset?.cible; return v && v !== "mer" ? v : null;
  }
  function poser(l, t) {
    for (const [k, v] of Object.entries(J.pos)) if (v === t && k !== l) delete J.pos[k];
    J.pos[l] = t; J.verif = null; J.sol = false;
    etiquettes(); banque(); message("");
  }
  function verifier() {
    const col = cfg.coloriage?.(S);
    if (col) {
      J.verif = {}; let ok = 0; const ids = Object.keys(col.cibles);
      ids.forEach((id) => { J.verif[id] = J.coul[id] === col.cibles[id]; if (J.verif[id]) ok++; });
      marquer(); message(ok === ids.length ? "Bravo, tout est juste ! 🎉" : `${ok} / ${ids.length} bien colorié${ok > 1 ? "s" : ""}. Corrige les zones en rouge.`);
      if (ok === ids.length) bravo(el);
      return;
    }
    J.verif = {}; let ok = 0;
    for (const l of J.lot) if (J.pos[l]) { J.verif[l] = J.pos[l] === l; if (J.verif[l]) ok++; }
    const poses = Object.keys(J.pos).length, n = J.lot.length;
    etiquettes();
    if (ok === n) { message("Bravo, tout est juste ! 🎉"); bravo(el); }
    else message(`${ok} / ${n} bien placée${ok > 1 ? "s" : ""}.${poses < n ? ` Il reste ${n - poses} étiquette${n - poses > 1 ? "s" : ""} à poser.` : ""} Les étiquettes en rouge sont à déplacer.`);
  }
  function solution() {
    const col = cfg.coloriage?.(S);
    if (col) { J.coul = { ...col.cibles }; J.verif = null; marquer(); message("Voici la solution."); return; }
    J.pos = Object.fromEntries(J.lot.map((l) => [l, l])); J.verif = Object.fromEntries(J.lot.map((l) => [l, true])); J.sol = true; J.pris = null;
    etiquettes(); banque(); message("Voici la solution.");
  }

  // --- quiz ---
  function repondre(id) {
    const q = J.q; if (!q.cible || J.flash[q.cible] === "good") return;
    if (id === q.cible) {
      if (!q.essais) { q.ok++; q.total++; } J.flash = { [id]: "good" };
      q.msg = q.essais ? `Oui, c'est ici.` : `Bravo ! 🎉`;
      marquer(); carte(); minuteur = setTimeout(() => { question(); q.msg = ""; marquer(); carte(); }, 1200);
    } else {
      if (!q.essais) q.total++;
      q.essais++;
      J.flash = { [id]: "bad" };
      q.msg = `Non, ça, c'est ${esc(cfg.nomCourt?.(id, S) ?? nomDe(id))}.`;
      if (q.essais >= 2) { J.flash[q.cible] = "indice"; q.msg += ` La bonne réponse clignote.`; }
      marquer(); carte();
    }
  }

  // --- évènements ---
  const finDrag = dragEtiquettes(el, {
    aimant: cfg.aimant ?? 24,
    onPose(etq, cible, e) { if (S.mode !== "placer") return; const t = resoudre(e.clientX, e.clientY, etq.dataset.etq, cible); J.pris = null; if (t) poser(etq.dataset.etq, t); else banque(); },
  });
  el.onclick = (e) => {
    if (clicApresDrag(el) || zoom?.panFini()) return;
    const sm = e.target.closest("summary[data-leg]"); if (sm) { S.leg = !sm.parentElement.open; return; }
    const b = e.target.closest("button");
    if (b && el.contains(b)) {
      if (b.dataset.zoom) return;
      if (b.dataset.mode) { S.mode = b.dataset.mode; S.sel = null; nouveauJeu(); monter(); return; }
      if (b.dataset.niv) { S.niv = b.dataset.niv; memo.set(S.niv); cfg.surNiveau?.(S); S.sel = null; nouveauJeu(); monter(); return; }
      if (b.dataset.etq) { J.pris = J.pris === b.dataset.etq ? null : b.dataset.etq; banque(); etiquettes(); return; }
      if (b.dataset.pal) { J.pal = b.dataset.pal; el.querySelectorAll("[data-pal]").forEach((x) => x.classList.toggle("on", x === b)); return; }
      const a = b.dataset.act;
      if (a === "verif") return verifier();
      if (a === "sol") return solution();
      if (a === "reset") { nouveauJeu(); dessinerCarte(); carte(); return; }
      if (a === "suite") { nouveauJeu(); dessinerCarte(); carte(); return; }
      if (a === "passer") { clearTimeout(minuteur); question(); J.q.msg = ""; marquer(); carte(); return; }
      const r = cfg.bouton?.(b, S); if (r) reagir(r);
      return;
    }
    if (!svg || !svg.contains(e.target)) return;
    if (S.mode === "placer") {
      const col = cfg.coloriage?.(S);
      if (col) {
        const id = e.target.closest("[data-cible]")?.dataset.cible;
        if (!id || !(id in col.cibles)) return;
        if (!J.pal) { message("Choisis d'abord une couleur."); return; }
        J.coul[id] = J.pal; J.verif = null; marquer(); message(""); return;
      }
      const pill = e.target.closest("[data-pill]");
      if (J.pris) {
        const t = pill ? J.pos[pill.dataset.pill] : resoudre(e.clientX, e.clientY, J.pris, null);
        const l = J.pris; J.pris = null;
        if (t) poser(l, t); else { banque(); etiquettes(); }
        return;
      }
      if (pill) { delete J.pos[pill.dataset.pill]; J.verif = null; etiquettes(); banque(); message(""); }
      return;
    }
    const ids = idsSous(e.clientX, e.clientY);
    const id = cfg.choisir ? cfg.choisir(ids, S) : ids[0];
    if (S.mode === "explorer") { S.sel = id ?? null; marquer(); etiquettes(); carte(); }
    else if (S.mode === "quiz" && id) repondre(id);
  };
  const reagir = (r) => { if (r === "monter") { nouveauJeu(); monter(); } else if (r === "cadrer") { cadrer = true; S.sel = null; nouveauJeu(); monter(); } else if (r === "carte") { dessinerCarte(); carte(); } };
  el.onchange = (e) => {
    const t = e.target;
    if (t.dataset.opt === "noms") { S.noms = t.checked; etiquettes(); return; }
    const r = cfg.change?.(t, S); if (r) reagir(r);
  };
  nouveauJeu(); monter();
  return () => { finDrag(); zoom?.cleanup(); ro?.disconnect(); clearTimeout(minuteur); cancelAnimationFrame(raf); el.onclick = el.onchange = null; };
}

// ---------- Couleurs ----------
const COUL = { af: "#ffd166", eu: "#b8a4e8", as: "#f5a3ab", na: "#9fd88c", am: "#9fd88c", sa: "#6fd0b8", oc: "#ffaf73", an: "#ffffff" };
const CLAIR = { af: "#ffe7a8", eu: "#d9ccf5", as: "#fbcdd1", na: "#c9ebbd", sa: "#b3e8da", oc: "#ffd2ad", an: "#f4f4f4" };
const contPays = (c) => PAYS_INFO[c]?.[2];

// ---------- 1. Continents et océans ----------
const NOMS_CONT = { ...CONTINENTS, am: "Amérique", fr: "France" };
function continentsOceans(el) {
  const sept0 = localStorage.getItem("bagaschool-dk-monde-7") === "1";
  const lignesNiv = (S) => (nivIdx(S.niv) >= 4 ? Object.keys(LIGNES) : nivIdx(S.niv) >= 3 ? ["equateur"] : []);
  const oceansNiv = (S) => ["pacifique", "atlantique", "indien", ...(nivIdx(S.niv) >= 1 ? ["arctique", "austral"] : []), ...(nivIdx(S.niv) >= 2 ? ["mediterranee"] : [])];
  const contsDe = (S) => (S.sept ? ["af", "eu", "as", "na", "sa", "oc", "an"] : ["af", "eu", "as", "am", "oc", "an"]);
  const nom = (id) => NOMS_CONT[id] ?? OCEANS[id]?.[0] ?? LIGNES[id]?.[0] ?? id;
  const lignesSVG = (ids, cible) => ids.map((k) => {
    const [, la, lo] = LIGNES[k];
    const d = la != null ? `M${f1(P(-180, la)[0])},${f1(P(0, la)[1])}H${f1(P(180, la)[0])}` : `M${f1(P(0, 90)[0])},${f1(P(0, 90)[1])}V${f1(P(0, -90)[1])}`;
    return `<g class="mo-ligne l-${k}" ${cible ? `data-cible="${k}"` : ""}><path class="hit" d="${d}"/><path class="v" d="${d}"/></g>`;
  }).join("");
  return atelier(el, {
    id: "monde-continents", niveaux: ["CP", "CE1", "CE2", "CM1", "CM2"], defaut: "CP",
    modes: [["explorer", "🌍 Explorer"], ["quiz", "❓ Touche…"], ["placer", "🏷️ Placer"]],
    etat: () => ({ sept: sept0, lignes: false }),
    options: (S) => `<div class="seg" role="group" aria-label="Nombre de continents"><button data-sept="0" class="${S.sept ? "" : "on"}">6 continents</button><button data-sept="1" class="${S.sept ? "on" : ""}">7 continents</button></div>`,
    bouton(b, S) { if (b.dataset.sept) { S.sept = b.dataset.sept === "1"; localStorage.setItem("bagaschool-dk-monde-7", S.sept ? "1" : "0"); S.sel = null; return "monter"; } },
    change(t, S) { if (t.dataset.opt === "lignes") { S.lignes = t.checked; return "carte"; } },
    fond(S) {
      const am = (k) => (S.sept ? k : "am");
      const c = (id, d, extra = "") => `<path class="mo-cont" data-cible="${id}" style="--c:${COUL[id]}" d="${d}" ${extra}/>`;
      const lig = S.mode === "explorer" ? (S.lignes || lignesNiv(S).length ? Object.keys(LIGNES) : []) : lignesNiv(S);
      return MER(true) + `<g clip-path="url(#mo-sph)">` + c("af", CONT_D.af) + c(am("na"), CONT_D.na) + c(am("sa"), CONT_D.sa) + c("oc", CONT_D.oc) + c("an", CONT_D.an) +
        c("as", CONT_D.eua) + c("eu", CONT_D.eua, `clip-path="url(#mo-eu)"`) +
        `<path class="mo-limite" d="${LIMITE_EU_AS.map(ligne).join("")}"/>` +
        `<path class="mo-fr" data-cible="fr" d="${PD.fr[1]}"/>` + lignesSVG(lig, true) + `</g>`;
    },
    items: (S) => [...contsDe(S), ...oceansNiv(S), "fr", ...lignesNiv(S)].map((id) => ({ id, nom: nom(id) })),
    nom,
    pt(id) {
      if (id === "fr") return [PD.fr[2], PD.fr[3] - 40];
      const ll = CONT_FICHE[id]?.[0] ?? OCEANS[id]?.[1] ?? LIGNES[id]?.[3];
      return ll ? P(...ll) : null;
    },
    noms: (S) => [...contsDe(S), ...Object.keys(OCEANS), "fr", ...(S.lignes || lignesNiv(S).length ? Object.keys(LIGNES) : [])].map((id) => ({ id, nom: nom(id) })),
    choisir: (ids) => ids.find((i) => i === "fr") ?? ids.find((i) => LIGNES[i]) ?? ids[0],
    intro: (S) => `<h3>Continents et océans</h3><p>Touche un continent, un océan ou une ligne pour le découvrir.</p>
      <p class="muted">${S.sept ? "Ici, 7 continents : l'Amérique est partagée en Amérique du Nord et Amérique du Sud." : "Ici, 6 continents : en France, on compte souvent l'Amérique comme un seul continent."} Ailleurs, on en compte parfois 5, 6 ou 7 : c'est une convention.</p>`,
    optionsExplorer: (S) => lignesNiv(S).length ? "" : `<label class="check mo-chk"><input type="checkbox" data-opt="lignes" ${S.lignes ? "checked" : ""}> Lignes imaginaires</label>`,
    fiche(id) {
      if (id === "fr") return `<h3>La France</h3><span class="dk-tag">Notre pays</span><p>La France métropolitaine est en Europe, au bord de l'océan Atlantique et de la mer Méditerranée.</p><p>${PAYS_NOTE.fr}</p>`;
      if (OCEANS[id]) return `<h3>${esc(OCEANS[id][0])}</h3><span class="dk-tag">${id === "mediterranee" ? "Mer" : "Océan"}</span><p>${OCEANS[id][2]}</p>`;
      if (LIGNES[id]) return `<h3>${esc(LIGNES[id][0])}</h3><span class="dk-tag">Ligne imaginaire</span><p>${LIGNES[id][4]}</p>`;
      return `<h3>${esc(nom(id))}</h3><span class="dk-tag">Continent</span><p>${CONT_FICHE[id]?.[1] ?? ""}</p>`;
    },
    titrePlacer: (S) => `Place ${S.niv === "CP" ? "les continents, les 3 océans et la France" : "les étiquettes"}`,
  });
}

// ---------- 2. Les pays du monde ----------
const SERIES = {
  voisins: ["Voisins de la France", () => ["be", "lu", "de", "ch", "it", "mc", "es", "ad"], [-7, 39, 17, 53]],
  grands: ["Les 10 plus grands pays", () => ["ru", "ca", "us", "cn", "br", "au", "in", "ar", "kz", "dz"], null],
  ue6: ["UE : les 6 fondateurs (1957)", () => UE_FONDATEURS, [-11, 36, 22, 58]],
  ue10: ["UE : 10 pays, dont les 6 fondateurs", () => [...UE_FONDATEURS, "es", "pt", "pl", "gr"], [-12, 34, 30, 60]],
  ue27: ["UE : les 27 pays", () => UE27, [-24, 33, 36, 69]],
  eu: ["Europe", "eu", [-24, 34, 50, 71]], af: ["Afrique", "af", [-20, -36, 54, 38]], as: ["Asie", "as", [26, -11, 148, 56]],
  na: ["Amérique du Nord et centrale", "na", [-168, 6, -52, 76]], sa: ["Amérique du Sud", "sa", [-92, -56, -32, 13]], oc: ["Océanie", "oc", [112, -48, 180, 0]],
};
const palierMax = (S) => ({ CE2: 1, CM1: 2, CM2: 3 }[S.niv] ?? 3);
function paysDe(S) {
  const [, src] = SERIES[S.serie];
  if (typeof src === "function") return src();
  return Object.entries(PAYS_INFO).filter(([, i]) => i[2] === src && i[3] > 0 && i[3] <= palierMax(S)).map(([c]) => c);
}
const nomPays = (c) => PAYS_INFO[c]?.[0] ?? c;
function paysDuMonde(el) {
  const defSerie = (n) => (n === "CE2" ? "voisins" : "eu");
  const ptPays = (c, S) => (c === "ru" && S.serie === "eu" ? P(42, 57) : PD[c] ? [PD[c][2], PD[c][3]] : null);
  return atelier(el, {
    id: "monde-pays", niveaux: ["CE2", "CM1", "CM2"], defaut: "CM1", aimant: 30, pillK: 0.88,
    modes: [["explorer", "🔎 Explorer"], ["quiz", "❓ Touche…"], ["placer", "🏷️ Placer"]],
    etat() { const n = niveauMemo("monde-pays", ["CE2", "CM1", "CM2"], "CM1").get(); return { serie: localStorage.getItem("bagaschool-dk-monde-serie") || defSerie(n) }; },
    options: (S) => `<label class="inline mo-serie">Série <select data-opt="serie">${Object.entries(SERIES).map(([k, [n]]) => `<option value="${k}" ${S.serie === k ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`,
    change(t, S) { if (t.dataset.opt === "serie") { S.serie = t.value; localStorage.setItem("bagaschool-dk-monde-serie", S.serie); return "cadrer"; } },
    vue: (S) => SERIES[S.serie][2],
    lot: (S) => (S.serie === "ue27" ? 27 : { CE2: 8, CM1: 12, CM2: 15 }[S.niv]),
    fond(S) {
      const serie = new Set(paysDe(S)), ue = S.serie.startsWith("ue");
      const actif = S.mode === "explorer";
      let h = MER(false) + `<g clip-path="url(#mo-sph)"><path class="mo-autres" d="${AUTRES_D}"/>`, dots = "";
      for (const [c, d, lx, ly, a] of PAYS_D) {
        const i = PAYS_INFO[c], cont = i?.[2];
        const hors = !actif && !serie.has(c);
        h += `<path class="mo-pays ${hors ? "hors" : ""}" data-cible="${c}" style="--c:${CLAIR[cont] ?? "#eee"}" d="${d}"/>`;
        if (a < 150 && i && (i[3] > 0 || serie.has(c)) && (actif || serie.has(c))) dots += `<g class="mo-dot" data-cible="${c}" data-x="${lx}" data-y="${ly}"><circle r="15" class="hit"/><circle r="6"/></g>`;
      }
      if (ue) for (const c of UE_FONDATEURS) { const p = ptPays(c, S); if (p && S.mode !== "placer") dots += `<g class="mo-star" data-x="${f1(p[0])}" data-y="${f1(p[1] + 0)}"><text y="-14">★</text></g>`; }
      return h + `</g>` + dots;
    },
    items: (S) => paysDe(S).filter((c) => PD[c] && PAYS_INFO[c]).map((c) => ({ id: c, nom: nomPays(c), star: S.serie.startsWith("ue") && UE_FONDATEURS.includes(c), quiz: PAYS_INFO[c][3] !== 0 })),
    nom: nomPays, nomCourt: nomPays,
    pt: ptPays,
    noms(S, u) {
      // noms des pays assez grands à l'écran pour porter leur étiquette
      // u = unités SVG par pixel d'étiquette ; les plus grands pays d'abord, sans chevauchement
      const pris = [], o = [];
      for (const [c, , x, y, a] of [...PAYS_D].sort((p, q) => q[4] - p[4])) {
        const i = PAYS_INFO[c]; if (!i) continue;
        const w = (mesure(i[0]) + 22) * u, h = 30 * u;
        if (a < w * h * 0.4) continue;
        const bx = [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
        if (pris.some((b) => bx[0] < b[2] && bx[2] > b[0] && bx[1] < b[3] && bx[3] > b[1])) continue;
        pris.push(bx); o.push({ id: c, nom: nomPays(c) });
      }
      return o;
    },
    surNiveau(S) { if (!localStorage.getItem("bagaschool-dk-monde-serie")) S.serie = defSerie(S.niv); },
    intro: (S) => `<h3>Les pays du monde</h3><p>Touche un pays pour voir son nom, son continent et sa capitale. Zoome avec les boutons ou deux doigts.</p>
      <p class="muted">La série choisie (${esc(SERIES[S.serie][0])}) sert au quiz et aux étiquettes.${S.serie.startsWith("ue") ? " ★ = pays fondateurs de 1957 (traité de Rome)." : ""}</p>`,
    fiche(c) {
      const i = PAYS_INFO[c]; if (!i) return `<p class="muted">Ce territoire n'est pas détaillé ici.</p>`;
      const [nom, cap, cont] = i, fl = drapeau(c), ue = UE27.includes(c);
      return `<div class="mo-fiche-tete">${fl ? `<span class="mo-drapeau">${fl}</span>` : ""}<h3>${esc(nom)}</h3></div>
        <dl class="ec-facts"><dt>Continent</dt><dd>${c === "ru" ? "Europe et Asie" : c === "tr" ? "Asie et Europe" : esc(CONTINENTS[cont])}</dd>${cap ? `<dt>Capitale</dt><dd>${esc(cap)}</dd>` : ""}
        ${ue ? `<dt>Union européenne</dt><dd>${UE_FONDATEURS.includes(c) ? "★ Pays fondateur (1957)" : "Pays membre"}</dd>` : ""}</dl>${PAYS_NOTE[c] ? `<p>${PAYS_NOTE[c]}</p>` : ""}`;
    },
    titrePlacer: (S) => `Place les pays : ${esc(SERIES[S.serie][0])}`,
  });
}

// ---------- 3. Le monde physique ----------
// Fond : planisphère en relief (image pré-calculée dans la même projection), tracés et zones par-dessus.
const IMG_RELIEF = "img/decouvrir/relief-monde.webp";
const SOURCE_RELIEF = "Relief : Mapzen Terrain Tiles / AWS (SRTM, ETOPO1, GMTED…), mis en couleurs pour BagaSchool · Fonds de carte et fleuves : Natural Earth (domaine public), projection Equal Earth. Déserts et forêts : contours simplifiés.";
const ALTI = [["#76b260", "moins de 100 m"], ["#9ac770", "100 à 200 m"], ["#cede92", "200 à 500 m"], ["#f2dc8e", "500 à 1 000 m"], ["#e6b268", "1 000 à 1 500 m"], ["#d18b4c", "1 500 à 2 000 m"], ["#ab663c", "2 000 à 3 000 m"], ["#8a5038", "3 000 à 4 500 m"], ["#704234", "plus de 4 500 m"]];
let frontieres = null;
const CATS = { fleuves: "💧 Fleuves", massifs: "⛰️ Montagnes", milieux: "🏜️ Déserts et forêts", zones: "🌡️ Zones climatiques" };
function mondePhysique(el) {
  const dispo = (S, o) => Object.entries(o).filter(([, v]) => nivIdx(v[3]) <= nivIdx(S.niv)).map(([k]) => k);
  const voir = (S, cat) => S.mode !== "placer" ? (cat !== "zones" || (S.mode === "explorer" && S.zones)) : S.cat === cat;
  const nomItem = (id) => FLEUVES[id]?.[0] ?? MASSIFS[id]?.[0] ?? MILIEUX[id]?.[0] ?? ZONES[id.replace(/^z\d/, "")]?.[0] ?? id;
  const front0 = localStorage.getItem("bagaschool-dk-monde-front") !== "0";
  const legende = (S) => `<details class="mo-legende" ${S.leg ? "open" : ""}><summary data-leg>Légende</summary><div class="mo-leg-cols">
      <div><b>Altitude</b>${[...ALTI].reverse().map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join("")}</div>
      <div><b>Sur la carte</b><span><i style="background:#f6fafd"></i>glaces</span><span><i style="background:#cdeafa"></i>mer peu profonde</span><span><i style="background:#79b2e2"></i>océan profond</span>
      ${voir(S, "fleuves") ? `<span><i class="mo-li-fl"></i>fleuve</span>` : ""}${voir(S, "massifs") ? `<span><i class="mo-li-ma"></i>chaîne de montagnes</span>` : ""}
      ${voir(S, "milieux") ? `<span><i class="mo-li-de"></i>désert</span><span><i class="mo-li-fo"></i>forêt tropicale</span>` : ""}</div></div></details>`;
  return atelier(el, {
    id: "monde-physique", niveaux: ["CE1", "CE2", "CM1", "CM2"], defaut: "CE1", aimant: 34,
    modes: [["explorer", "🔎 Explorer"], ["quiz", "❓ Touche…"], ["placer", "🏷️ Placer"]],
    etat: () => ({ cat: "fleuves", zones: false, front: front0, leg: innerWidth >= 1500 || document.body.classList.contains("projection") }),
    options: (S) => (S.mode === "placer" ? `<div class="seg" role="group" aria-label="Thème">${Object.entries(CATS).map(([k, n]) => `<button data-cat="${k}" class="${S.cat === k ? "on" : ""}">${n}</button>`).join("")}</div>` : "")
      + `<a class="pill mo-lien-fr rc-keep" href="#/outils/geo-relief">🇫🇷 La même chose pour la France</a>`,
    bouton(b, S) { if (b.dataset.cat) { S.cat = b.dataset.cat; return "monter"; } },
    change(t, S) {
      if (t.dataset.opt === "zones") { S.zones = t.checked; return "monter"; }
      if (t.dataset.opt === "front") { S.front = t.checked; localStorage.setItem("bagaschool-dk-monde-front", S.front ? "1" : "0"); return "carte"; }
    },
    source: SOURCE_RELIEF, sous: legende,
    fond(S) {
      let h = `<path d="${SPHERE}" class="mo-mer"/><g clip-path="url(#mo-sph)"><image href="${IMG_RELIEF}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" class="mo-relief"/>`;
      const zonesActives = voir(S, "zones");
      if (zonesActives) {
        const col = S.mode === "explorer";
        h += BANDES.map(([z, a, b], i) => { const [x0] = P(-180, 0), [x1] = P(180, 0), y0 = P(0, b)[1], y1 = P(0, a)[1]; return `<rect class="mo-bande ${col ? "auto" : ""}" data-cible="z${i}${z}" x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1 - x0)}" height="${f1(y1 - y0)}" ${col ? `style="fill:${ZONES[z][1]}"` : ""}/>`; }).join("");
      }
      h += `<path d="${GRATICULE}" class="mo-grat r"/>`;
      if (S.front) h += `<path class="mo-front" d="${(frontieres ||= PAYS_D.map((p) => p[1]).join(""))}"/>`;
      h += `<path class="mo-cote" d="${["af", "eua", "na", "sa", "oc", "an"].map((k) => CONT_D[k]).join("")}"/>`;
      if (voir(S, "milieux") && !zonesActives) h += `<path class="mo-ant" data-cible="antarctique" d="${CONT_D.an}"/>`;
      if (zonesActives) h += [23.44, -23.44, 66.56, -66.56].map((la) => `<path class="mo-par" d="M${f1(P(-180, la)[0])},${f1(P(0, la)[1])}H${f1(P(180, la)[0])}"/>`).join("") + `<path class="mo-par eq" d="M${f1(P(-180, 0)[0])},${f1(H / 2)}H${f1(P(180, 0)[0])}"/>`;
      if (voir(S, "milieux")) for (const k of dispo(S, MILIEUX)) { const m = MILIEUX[k]; if (m[1]) h += `<path class="mo-milieu ${m[4]}" data-cible="${k}" d="${anneaux(m[1])}"/>`; }
      if (voir(S, "massifs")) for (const k of dispo(S, MASSIFS)) h += `<g class="mo-massif" data-cible="${k}"><path class="zc" d="${anneaux([MASSIFS[k][4]])}"/><path class="z" d="${anneaux([MASSIFS[k][4]])}"/><path class="hit" d="${ligne(MASSIFS[k][1])}"/></g>`;
      if (voir(S, "fleuves")) for (const k of dispo(S, FLEUVES)) h += `<g class="mo-fleuve" data-cible="${k}"><path class="hit" d="${FLEUVES_D[k]}"/><path class="c" d="${FLEUVES_D[k]}"/><path class="v" d="${FLEUVES_D[k]}"/></g>`;
      return h + `</g>`;
    },
    items(S) {
      const cats = S.mode !== "placer" ? ["fleuves", "massifs", "milieux"] : [S.cat];
      const o = [];
      if (cats.includes("fleuves")) dispo(S, FLEUVES).forEach((id) => o.push({ id, nom: FLEUVES[id][0] }));
      if (cats.includes("massifs")) dispo(S, MASSIFS).forEach((id) => o.push({ id, nom: MASSIFS[id][0] }));
      if (cats.includes("milieux")) dispo(S, MILIEUX).forEach((id) => o.push({ id, nom: MILIEUX[id][0] }));
      return o;
    },
    nom: nomItem, nomCourt: nomItem,
    pt(id) { const ll = FLEUVES[id]?.[1] ?? MASSIFS[id]?.[1]?.[Math.floor(MASSIFS[id][1].length / 2)] ?? MILIEUX_PT[id]; if (ll) return P(...ll); const m = /^z(\d)/.exec(id); if (m) { const [, a, b] = BANDES[+m[1]]; return P(-150, (a + b) / 2); } return null; },
    coloriage: (S) => S.mode === "placer" && S.cat === "zones" ? {
      titre: "Colorie les zones climatiques", consigne: "Choisis une couleur, puis touche une bande de la carte. Les traits marquent les tropiques et les cercles polaires.",
      palette: Object.fromEntries(Object.entries(ZONES).map(([k, [n, c]]) => [k, [n, c]])),
      cibles: Object.fromEntries(BANDES.map(([z], i) => [`z${i}${z}`, z])),
    } : null,
    choisir: (ids) => ids.find((i) => FLEUVES[i]) ?? ids.find((i) => MASSIFS[i]) ?? ids[0],
    intro: (S) => `<h3>Le monde physique</h3><p>Touche un fleuve (trait bleu), une chaîne de montagnes (contour pointillé), un désert (hachures orange) ou une forêt (points verts).</p>
      <p class="muted">Les couleurs montrent l'altitude : <b style="color:#4f8f3e">vert</b> pour les plaines basses, <b style="color:#b58a1e">jaune</b> et <b style="color:#b06a2c">orange</b> pour les plateaux, <b style="color:#7a4430">brun</b> pour les hautes montagnes, <b>blanc</b> pour les glaces. Dans les océans, plus le bleu est foncé, plus c'est profond.</p>`,
    optionsExplorer: (S) => `<label class="check mo-chk"><input type="checkbox" data-opt="zones" ${S.zones ? "checked" : ""}> Zones climatiques</label><label class="check mo-chk"><input type="checkbox" data-opt="front" ${S.front ? "checked" : ""}> Frontières des pays</label>`,
    fiche(id) {
      const z = /^z\d(.+)$/.exec(id);
      if (z) return `<h3>${esc(ZONES[z[1]][0])}</h3><span class="dk-tag">Zone climatique</span><p>${ZONES[z[1]][2]}</p>`;
      const [nom, , txt] = FLEUVES[id] ?? MASSIFS[id] ?? MILIEUX[id] ?? [];
      const type = FLEUVES[id] ? "Fleuve" : MASSIFS[id] ? "Chaîne de montagnes" : MILIEUX[id]?.[4] === "desert" ? "Désert" : "Forêt";
      return nom ? `<h3>${esc(nom[0].toUpperCase() + nom.slice(1))}</h3><span class="dk-tag">${type}</span><p>${txt}</p>` : "";
    },
    titrePlacer: (S) => ({ fleuves: "Place les fleuves", massifs: "Place les chaînes de montagnes", milieux: "Place les déserts et les forêts" }[S.cat]),
  });
}

// ---------- 4. Grandes villes du monde ----------
function grandesVilles(el) {
  const dispo = (S) => VILLES.map((v, i) => [v, i]).filter(([v]) => nivIdx(v[3]) <= nivIdx(S.niv));
  return atelier(el, {
    id: "monde-villes", niveaux: ["CE1", "CE2", "CM1", "CM2"], defaut: "CE1", aimant: 36,
    modes: [["explorer", "🔎 Explorer"], ["quiz", "❓ Touche…"], ["placer", "🏷️ Placer"]],
    fond(S) {
      let h = MER(false) + `<g clip-path="url(#mo-sph)"><path class="mo-autres" d="${AUTRES_D}"/>`;
      for (const [c, d] of PAYS_D) h += `<path class="mo-pays fixe" style="--c:${CLAIR[contPays(c)] ?? "#eee"}" d="${d}"/>`;
      h += `</g>`;
      for (const [v, i] of dispo(S)) { const [x, y] = P(...v[1]); h += `<g class="mo-ville" data-cible="v${i}" data-x="${f1(x)}" data-y="${f1(y)}"><circle r="18" class="hit"/><circle r="7" class="pt"/></g>`; }
      return h;
    },
    items: (S) => dispo(S).map(([v, i]) => ({ id: `v${i}`, nom: v[0] })),
    nom: (id) => VILLES[+id.slice(1)]?.[0],
    pt(id) { const v = VILLES[+id.slice(1)]; return v ? P(...v[1]) : null; },
    decal: -24, lot: (S) => (nivIdx(S.niv) >= 3 ? 12 : 99),
    intro: () => `<h3>Grandes villes du monde</h3><p>Touche un point rouge pour découvrir une très grande ville.</p><p class="muted">Il y a au moins une très grande ville sur chaque continent habité.</p>`,
    fiche(id) {
      const [nom, , c, , txt] = VILLES[+id.slice(1)]; const fl = drapeau(c), cont = PAYS_INFO[c][2];
      return `<div class="mo-fiche-tete"><h3>${esc(nom)}</h3></div><dl class="ec-facts"><dt>Pays</dt><dd>${fl ? fl + " " : ""}${esc(nomPays(c))}</dd><dt>Continent</dt><dd>${c === "ru" || c === "tr" ? "Europe" : esc(CONTINENTS[cont])}</dd></dl><p>${txt}</p>`;
    },
    titrePlacer: () => "Place le nom des villes",
  });
}

export const MONDE = [
  { id: "monde-continents", nom: "Planisphère : continents et océans", icone: "🌍", couleur: "#cfe8ff", desc: "Placer les continents, les océans et les grandes lignes", niveaux: ["CP", "CE1", "CE2", "CM1", "CM2"], mount: continentsOceans },
  { id: "monde-pays", nom: "Les pays du monde", icone: "🗺️", couleur: "#ffe0b8", desc: "Explorer, quiz et étiquettes ; Union européenne", niveaux: ["CE2", "CM1", "CM2"], mount: paysDuMonde },
  { id: "monde-physique", nom: "Le monde physique", icone: "⛰️", couleur: "#d6f0c8", desc: "Fleuves, montagnes, déserts, forêts, climats", niveaux: ["CE1", "CE2", "CM1", "CM2"], mount: mondePhysique },
  { id: "monde-villes", nom: "Grandes villes du monde", icone: "🏙️", couleur: "#ffd6e0", desc: "Une grande ville par continent, et plus", niveaux: ["CE1", "CE2", "CM1", "CM2"], mount: grandesVilles },
];
