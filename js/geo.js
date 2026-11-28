// Maths : géométrie du CP au CM2 (frises et motifs, formes et polygones, solides).
// Programmes : cycle 2 (rentrée 2025) et cycle 3 (CM1-CM2, rentrée 2026).
// Les contenus par niveau sont regroupés dans des tables en haut de chaque partie pour être relus facilement.
import { segNiveau, surNiveau, niveauJeux, rang } from "./niveau.js";

const hasard = (n) => Math.floor(Math.random() * n);
const choix = (a) => a[hasard(a.length)];
const rnd = (a, b) => a + Math.random() * (b - a);
const melange = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = hasard(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const RAD = Math.PI / 180;
const f1 = (n) => Math.round(n * 10) / 10;
const svgPt = (svg, e) => { const m = svg.getScreenCTM(); if (!m) return [0, 0]; const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); return [p.x, p.y]; };
const des = (niv, min) => rang(niv) >= rang(min);

// =====================================================================
// 1. FRISES ET MOTIFS
// Une frise = un motif de l carreaux de large et h de haut, répété vers la droite.
// c : cases [colonne, ligne, couleur, forme] ; s : segments [x1, y1, x2, y2] entre nœuds du quadrillage.
// Formes de case : f case pleine, q petit carré, o rond, t triangle,
// tl / tr / bl / br demi-carré (coupé par une diagonale) dont l'angle droit est en haut-gauche, haut-droite, bas-gauche, bas-droite.
// =====================================================================
const COULEURS = [["#ef6461", "rouge"], ["#4d8ef0", "bleu"], ["#f5c542", "jaune"], ["#4cbb6c", "vert"], ["#a77bdb", "violet"], ["#f59a4d", "orange"]];
const ENCRE = "#3b3355";
const FRISES = {
  CP: [
    { nom: "Rouge, bleu, rouge, bleu…", l: 2, h: 1, c: [[0, 0, 0, "f"], [1, 0, 1, "f"]] },
    { nom: "Rond, carré, rond, carré…", l: 2, h: 1, c: [[0, 0, 2, "o"], [1, 0, 3, "q"]] },
    { nom: "Deux rouges, un jaune", l: 3, h: 1, c: [[0, 0, 0, "f"], [1, 0, 0, "f"], [2, 0, 2, "f"]] },
    { nom: "Un carré, deux ronds", l: 3, h: 1, c: [[0, 0, 1, "q"], [1, 0, 0, "o"], [2, 0, 0, "o"]] },
    { nom: "Triangle, carré, rond", l: 3, h: 1, c: [[0, 0, 3, "t"], [1, 0, 1, "q"], [2, 0, 0, "o"]] },
    { nom: "Un rond, une case vide", l: 2, h: 1, c: [[0, 0, 5, "o"]] },
    { nom: "Le damier", l: 2, h: 2, c: [[0, 0, 4, "f"], [1, 1, 4, "f"]] },
    { nom: "La vague", l: 4, h: 3, c: [[0, 2, 1, "f"], [1, 1, 1, "f"], [2, 0, 1, "f"], [3, 1, 1, "f"]] },
    { nom: "Les créneaux (traits)", l: 2, h: 1, s: [[0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 2, 1]] },
  ],
  CE1: [
    { nom: "Le zigzag", l: 2, h: 1, s: [[0, 1, 1, 0], [1, 0, 2, 1]] },
    { nom: "Les grands créneaux", l: 4, h: 2, s: [[0, 2, 0, 0], [0, 0, 2, 0], [2, 0, 2, 2], [2, 2, 4, 2]] },
    { nom: "Les dents de scie", l: 2, h: 2, s: [[0, 2, 2, 0], [2, 0, 2, 2]] },
    { nom: "Les toits", l: 2, h: 1, s: [[0, 1, 1, 0], [1, 0, 2, 1], [0, 1, 2, 1]] },
    { nom: "Les marches", l: 2, h: 2, c: [[0, 1, 5, "f"], [1, 0, 5, "f"], [1, 1, 5, "f"]] },
    { nom: "Les sapins", l: 3, h: 2, c: [[0, 0, 3, "br"], [1, 0, 3, "bl"], [0, 1, 3, "br"], [1, 1, 3, "bl"]] },
    { nom: "Triangles rouges et bleus", l: 2, h: 1, c: [[0, 0, 0, "bl"], [1, 0, 1, "tr"]] },
    { nom: "Carrés coupés en deux", l: 2, h: 1, s: [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0], [0, 1, 1, 0]] },
  ],
  CE2: [
    { nom: "Les chevrons", l: 2, h: 2, s: [[0, 1, 1, 0], [1, 0, 2, 1], [0, 2, 1, 1], [1, 1, 2, 2]] },
    { nom: "Carrés posés sur la pointe", l: 2, h: 2, s: [[0, 1, 1, 0], [1, 0, 2, 1], [2, 1, 1, 2], [1, 2, 0, 1]] },
    { nom: "Les sabliers", l: 3, h: 2, s: [[0, 0, 2, 0], [0, 0, 2, 2], [2, 0, 0, 2], [0, 2, 2, 2]] },
    { nom: "Les flèches", l: 3, h: 2, s: [[0, 0, 1, 1], [1, 1, 0, 2], [1, 0, 2, 1], [2, 1, 1, 2]] },
    { nom: "Le losange de couleurs", l: 2, h: 2, c: [[0, 0, 0, "br"], [1, 0, 1, "bl"], [0, 1, 1, "tr"], [1, 1, 0, "tl"]] },
    { nom: "La fleur", l: 4, h: 3, c: [[1, 1, 2, "f"], [1, 0, 0, "o"], [0, 1, 0, "o"], [2, 1, 0, "o"], [1, 2, 3, "q"]] },
    { nom: "La grecque", l: 4, h: 3, s: [[0, 3, 0, 0], [0, 0, 3, 0], [3, 0, 3, 2], [3, 2, 1, 2], [1, 2, 1, 1], [1, 1, 2, 1], [0, 3, 4, 3]] },
  ],
  CM1: [
    { nom: "Le moulinet (quart de tour)", l: 3, h: 2, c: [[0, 0, 0, "tr"], [1, 0, 1, "br"], [1, 1, 0, "bl"], [0, 1, 1, "tl"]] },
    { nom: "Le miroir (symétrie axiale)", l: 4, h: 3, s: [[0, 3, 1, 0], [1, 0, 2, 2], [2, 2, 3, 0], [3, 0, 4, 3]] },
    { nom: "La chaîne de losanges", l: 2, h: 4, s: [[1, 0, 2, 2], [2, 2, 1, 4], [1, 4, 0, 2], [0, 2, 1, 0]] },
    { nom: "Glisser et retourner", l: 4, h: 2, c: [[0, 0, 0, "bl"], [1, 0, 1, "o"], [2, 1, 0, "tl"], [3, 1, 1, "o"]] },
    { nom: "Les étoiles", l: 3, h: 2, s: [[1, 0, 1, 2], [0, 1, 2, 1], [0, 0, 2, 2], [0, 2, 2, 0]] },
    { nom: "La grande grecque", l: 5, h: 4, s: [[0, 4, 0, 0], [0, 0, 4, 0], [4, 0, 4, 3], [4, 3, 1, 3], [1, 3, 1, 1], [1, 1, 3, 1], [3, 1, 3, 2], [3, 2, 2, 2], [0, 4, 5, 4]] },
  ],
  CM2: [
    { nom: "Les hélices (quart de tour)", l: 5, h: 4, s: [[2, 2, 3, 0], [3, 0, 4, 1], [2, 2, 4, 3], [4, 3, 3, 4], [2, 2, 1, 4], [1, 4, 0, 3], [2, 2, 0, 1], [0, 1, 1, 0]] },
    { nom: "Symétrie en couleurs", l: 4, h: 4, c: [[0, 0, 1, "br"], [3, 0, 1, "bl"], [1, 1, 0, "f"], [2, 1, 0, "f"], [0, 2, 3, "tr"], [3, 2, 3, "tl"], [1, 2, 4, "o"], [2, 2, 4, "o"], [1, 3, 1, "bl"], [2, 3, 1, "br"]] },
    { nom: "Les croisillons", l: 2, h: 2, s: [[0, 0, 2, 2], [0, 2, 2, 0], [0, 1, 2, 1]] },
    { nom: "Le carré et sa diagonale", l: 6, h: 3, s: [[0, 3, 0, 0], [0, 0, 3, 0], [3, 0, 3, 3], [3, 3, 6, 3], [0, 3, 3, 0]], c: [[4, 1, 0, "o"]] },
    { nom: "Pas de géant (symétrie glissée)", l: 4, h: 2, s: [[0, 0, 1, 1], [1, 1, 2, 0], [2, 2, 3, 1], [3, 1, 4, 2]] },
    { nom: "La grecque double", l: 5, h: 4, s: [[0, 4, 0, 0], [0, 0, 4, 0], [4, 0, 4, 3], [4, 3, 1, 3], [1, 3, 1, 1], [1, 1, 3, 1], [3, 1, 3, 2], [3, 2, 2, 2], [0, 4, 5, 4]], c: [[2, 2, 2, "f"]] },
  ],
};
// Suites de motifs évolutives (algèbre, CM1-CM2) : cases de l'étape n (n ≥ 1), origine en bas à gauche.
const SUITES = [
  { nom: "Le L qui grandit", n: (n) => 2 * n + 1, formule: "2 × n + 1", cases: (n) => [...Array.from({ length: n + 1 }, (_, i) => [0, i]), ...Array.from({ length: n }, (_, i) => [i + 1, 0])] },
  { nom: "L'escalier", n: (n) => n * (n + 1) / 2, formule: "1 + 2 + … + n", cases: (n) => { const r = []; for (let x = 0; x < n; x++) for (let y = 0; y < n - x; y++) r.push([x, y]); return r; } },
  { nom: "Les carrés", n: (n) => n * n, formule: "n × n", cases: (n) => { const r = []; for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) r.push([x, y]); return r; } },
  { nom: "La croix", n: (n) => 4 * n + 1, formule: "4 × n + 1", cases: (n) => { const r = [[n, n]]; for (let i = 1; i <= n; i++) r.push([n - i, n], [n + i, n], [n, n - i], [n, n + i]); return r; } },
  { nom: "Le T", n: (n) => 3 * n + 1, formule: "3 × n + 1", cases: (n) => { const r = []; for (let x = 0; x <= 2 * n; x++) r.push([x, n]); for (let y = 0; y < n; y++) r.push([n, y]); return r; } },
  { nom: "Les rectangles", n: (n) => n * (n + 1), formule: "n × (n + 1)", cases: (n) => { const r = []; for (let x = 0; x <= n; x++) for (let y = 0; y < n; y++) r.push([x, y]); return r; } },
];
const S = 40, OY = 1, FR_KEY = "bagaschool-frises-perso";
const cle = (a) => a.join(",");
const pgcd = (a, b) => (b ? pgcd(b, a % b) : Math.abs(a));
// Découpe un segment en segments élémentaires entre nœuds consécutifs (pour comparer deux tracés).
function decoupe(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, g = pgcd(Math.abs(dx), Math.abs(dy)); if (!g) return [];
  const sx = dx / g, sy = dy / g, out = [];
  for (let i = 0; i < g; i++) {
    const a = [x1 + i * sx, y1 + i * sy], b = [a[0] + sx, a[1] + sy];
    out.push(a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? cle([...a, ...b]) : cle([...b, ...a]));
  }
  return out;
}
const vide = () => ({ s: new Map(), c: new Map() });
function elements(m, k0, k1, cols) {
  const e = vide();
  for (let k = k0; k < k1; k++) {
    const dx = k * m.l;
    for (const [c, r, col, sh] of m.c || []) if (c + dx < cols) e.c.set(cle([c + dx, r + OY]), col + ":" + sh);
    for (const [x1, y1, x2, y2, col = -1] of m.s || []) if (Math.max(x1, x2) + dx <= cols) for (const k2 of decoupe(x1 + dx, y1 + OY, x2 + dx, y2 + OY)) e.s.set(k2, col);
  }
  return e;
}
function comparer(p, cible, deja) {
  const ko = vide(), manque = vide(); let bons = 0;
  for (const [k, v] of p.s) if (cible.s.has(k)) bons++; else ko.s.set(k, v);
  for (const [k, v] of p.c) if (cible.c.get(k) === v) bons++; else ko.c.set(k, v);
  for (const [k, v] of cible.s) if (!deja.s.has(k) && !p.s.has(k)) manque.s.set(k, v);
  for (const [k, v] of cible.c) if (!deja.c.has(k) && p.c.get(k) !== v) manque.c.set(k, v);
  return { ko, manque, bons, juste: !ko.s.size && !ko.c.size && !manque.s.size && !manque.c.size };
}
function caseSVG(c, r, v, cls = "") {
  const [col, sh] = v.split(":"), fill = COULEURS[+col]?.[0] || ENCRE, x = c * S, y = r * S;
  const P = (pts) => `<polygon points="${pts.map(([a, b]) => `${x + a * S},${y + b * S}`).join(" ")}" fill="${fill}" class="geo-case ${cls}"/>`;
  switch (sh) {
    case "q": return `<rect x="${x + 0.2 * S}" y="${y + 0.2 * S}" width="${0.6 * S}" height="${0.6 * S}" rx="3" fill="${fill}" class="geo-case ${cls}"/>`;
    case "o": return `<circle cx="${x + S / 2}" cy="${y + S / 2}" r="${0.32 * S}" fill="${fill}" class="geo-case ${cls}"/>`;
    case "t": return P([[0.5, 0.16], [0.86, 0.82], [0.14, 0.82]]);
    case "tl": return P([[0, 0], [1, 0], [0, 1]]);
    case "tr": return P([[0, 0], [1, 0], [1, 1]]);
    case "bl": return P([[0, 0], [0, 1], [1, 1]]);
    case "br": return P([[1, 0], [1, 1], [0, 1]]);
    default: return `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${fill}" class="geo-case ${cls}"/>`;
  }
}
const segSVG = (k, col, cls = "") => { const [a, b, c, d] = k.split(",").map(Number); return `<line x1="${a * S}" y1="${b * S}" x2="${c * S}" y2="${d * S}" stroke="${col >= 0 ? COULEURS[col][0] : ENCRE}" class="geo-seg ${cls}"/>`; };
const couche = (e, cls = "") => [...e.c].map(([k, v]) => { const [c, r] = k.split(",").map(Number); return caseSVG(c, r, v, cls); }).join("") + [...e.s].map(([k, v]) => segSVG(k, v, cls)).join("");
const iconeForme = (sh, col) => `<svg viewBox="-2 -2 44 44" width="30" height="30" aria-hidden="true"><rect x="0" y="0" width="40" height="40" fill="#fff" stroke="#ccc"/>${caseSVG(0, 0, `${col}:${sh}`)}</svg>`;
const NOMS_FORMES = { f: "Case pleine", q: "Petit carré", o: "Rond", t: "Triangle", tl: "Demi-carré", tr: "Demi-carré", bl: "Demi-carré", br: "Demi-carré" };

function quadrillage(cols, rows, fond) {
  let g = `<rect x="0" y="0" width="${cols * S}" height="${rows * S}" class="geo-fond"/>`;
  if (fond === "points") { for (let x = 0; x <= cols; x++) for (let y = 0; y <= rows; y++) g += `<circle cx="${x * S}" cy="${y * S}" r="2.6" class="geo-pt"/>`; }
  else { for (let x = 0; x <= cols; x++) g += `<line x1="${x * S}" y1="0" x2="${x * S}" y2="${rows * S}" class="geo-gl"/>`; for (let y = 0; y <= rows; y++) g += `<line x1="0" y1="${y * S}" x2="${cols * S}" y2="${y * S}" class="geo-gl"/>`; }
  return g;
}
const lirePerso = () => { try { const a = JSON.parse(localStorage.getItem(FR_KEY)); return Array.isArray(a) ? a : []; } catch { return []; } };

function frises(el) {
  let niv = niveauJeux(), mode = "continuer", idx = 0, outil = "trait", coul = 1, forme = "f", fond = "carreaux";
  let dess = vide(), hist = [], verif = null, sol = false, pending = null, apercu = null, act = null, voirMotif = true;
  let perso = lirePerso(), edit = { id: null, nom: "Ma frise", l: 3, h: 2 };
  let suite = 0, etapeQ = 10, voirRep = false;
  const liste = () => [...FRISES[niv], ...perso.map((m) => ({ ...m, perso: true }))];
  const modele = () => liste()[idx] || liste()[0];
  const modes = [["continuer", "➡️ Continuer"], ["reproduire", "✍️ Reproduire"], ["voir", "👁️ Voir le modèle"], ["creer", "🛠️ Créer"]];
  if (des(niv, "CM1")) modes.splice(3, 0, ["suite", "📈 Motifs qui grandissent"]);
  const garder = () => localStorage.setItem(FR_KEY, JSON.stringify(perso));
  const instantane = () => { hist.push({ s: [...dess.s], c: [...dess.c] }); if (hist.length > 80) hist.shift(); };
  const reset = () => { dess = vide(); hist = []; verif = null; sol = false; pending = null; apercu = null; voirRep = false; };

  // Dimensions et contenus selon le mode.
  const plan = () => {
    const m = modele();
    if (mode === "continuer") { const reps = Math.max(4, Math.ceil(16 / m.l)), cols = reps * m.l; return { m, cols, rows: m.h + 2, cible: elements(m, 0, reps, cols), deja: elements(m, 0, 2, cols), depart: 2 * m.l }; }
    if (mode === "reproduire") { const reps = Math.max(2, Math.ceil(9 / m.l)), cols = reps * m.l; return { m, cols, rows: m.h + 2, cible: elements(m, 0, reps, cols), deja: vide() }; }
    if (mode === "voir") { const reps = Math.max(3, Math.ceil(16 / m.l)), cols = reps * m.l; return { m, cols, rows: m.h + 2, tout: elements(m, 0, reps, cols), reps }; }
    if (mode === "suite") { const sq = SUITES[suite], w = (n) => { const cs = sq.cases(n); return Math.max(...cs.map((p) => p[0])) + 1; }, hh = Math.max(...sq.cases(4).map((p) => p[1])) + 1; const xs = [1]; for (let n = 1; n < 4; n++) xs.push(xs[n - 1] + w(n) + 2); return { cols: xs[3] + w(4) + 1, rows: hh + 2, xs, hh, sq }; }
    return { cols: edit.l * 4, rows: edit.h + 2 };
  };
  const motifEdite = () => ({ l: edit.l, h: edit.h, c: [...dess.c].map(([k, v]) => { const [c, r] = k.split(",").map(Number), [col, sh] = v.split(":"); return [c, r - OY, +col, sh]; }), s: [...dess.s].map(([k, v]) => { const [a, b, c, d] = k.split(",").map(Number); return [a, b - OY, c, d - OY, v]; }) });
  // Cases attendues pour la suite (étape 4, comparées à une translation près).
  const normaliser = (cells) => { const mx = Math.min(...cells.map((p) => p[0])), my = Math.min(...cells.map((p) => p[1])); return new Set(cells.map(([x, y]) => cle([x - mx, y - my]))); };

  const dynHTML = (p) => {
    let g = couche(dess);
    if (verif && !verif.juste) g += couche(verif.ko, "geo-ko");
    if (sol && verif) g += couche(verif.manque, "geo-manque");
    if (apercu && (apercu[0][0] !== apercu[1][0] || apercu[0][1] !== apercu[1][1])) g += `<line x1="${apercu[0][0] * S}" y1="${apercu[0][1] * S}" x2="${apercu[1][0] * S}" y2="${apercu[1][1] * S}" stroke="${COULEURS[coul][0]}" class="geo-seg geo-apercu"/>`;
    if (pending) g += `<circle cx="${pending[0] * S}" cy="${pending[1] * S}" r="9" class="geo-pending"/>`;
    if (mode === "creer") g += couche(elements(motifEdite(), 1, 4, p.cols), "geo-repete");
    return g;
  };
  const grille = (id, p, statique, inter) => `<svg class="geo-fr-svg" viewBox="-12 -12 ${p.cols * S + 24} ${p.rows * S + 24}" ${inter ? `data-inter="${id}"` : ""} role="img" aria-label="Quadrillage">
      ${quadrillage(p.cols, p.rows, fond)}${statique}${inter ? `<g class="geo-dyn">${dynHTML(p)}</g>` : ""}</svg>`;

  const palette = () => {
    const formes = niv === "CP" ? ["f", "q", "o", "t"] : ["f", "q", "o", "t", "tl", "tr", "bl", "br"];
    const suiteM = mode === "suite";
    return `<div class="geo-palette">
      ${suiteM ? "" : `<div class="geo-grp">${[["trait", "✏️ Tracer"], ["colorier", "🎨 Colorier"], ["gomme", "🧽 Gomme"]].map(([k, v]) => `<button class="geo-tb ${outil === k ? "on" : ""}" data-outil="${k}">${v}</button>`).join("")}</div>`}
      <div class="geo-grp">${COULEURS.map(([c, n], i) => `<button class="geo-coul ${coul === i ? "on" : ""}" data-coul="${i}" aria-label="${n}" style="--c:${c}"></button>`).join("")}</div>
      ${outil === "colorier" && !suiteM ? `<div class="geo-grp">${formes.map((f) => `<button class="geo-tb geo-forme ${forme === f ? "on" : ""}" data-forme="${f}" aria-label="${NOMS_FORMES[f]}">${iconeForme(f, coul)}</button>`).join("")}</div>` : ""}
      <div class="geo-grp"><button class="geo-tb" data-act="annuler" aria-label="Annuler">↶</button><button class="geo-tb" data-act="effacer" aria-label="Tout effacer">🗑️</button></div>
    </div>`;
  };
  const message = () => {
    if (!verif) return pending ? "Touche un autre point pour finir le trait." : "";
    if (verif.juste) return `<span class="banner ok">Bravo, c'est parfait ! 🎉</span>`;
    const ko = verif.ko.s.size + verif.ko.c.size, man = verif.manque.s.size + verif.manque.c.size;
    return `<span class="banner ko">${ko ? `${ko} erreur${ko > 1 ? "s" : ""} (en rouge)` : "Pas d'erreur"}${man ? ` • ${man} élément${man > 1 ? "s" : ""} manquant${man > 1 ? "s" : ""}` : ""}</span>`;
  };

  const render = () => {
    const L = liste(); if (idx >= L.length) idx = 0;
    const p = plan();
    let haut = `<div class="tool-top">${segNiveau(niv)}<div class="seg">${modes.map(([k, v]) => `<button data-mode="${k}" class="${mode === k ? "on" : ""}">${v}</button>`).join("")}</div></div>`;
    let barre = "", corps = "";
    const selFond = `<div class="seg"><button data-fond="carreaux" class="${fond === "carreaux" ? "on" : ""}">▦ Quadrillage</button><button data-fond="points" class="${fond === "points" ? "on" : ""}">⁙ Points</button></div>`;
    if (mode === "suite") {
      const sq = p.sq;
      barre = `<div class="tool-top"><select id="fr-suite" aria-label="Suite">${SUITES.map((s, i) => `<option value="${i}" ${i === suite ? "selected" : ""}>${esc(s.nom)}</option>`).join("")}</select>${selFond}<button class="pill" id="fr-verif">✔️ Vérifier l'étape 4</button><button class="pill" id="fr-rep">${voirRep ? "Cacher" : "Montrer"} la réponse</button></div>`;
      let st = "";
      for (let n = 1; n <= 3; n++) st += sq.cases(n).map(([x, y]) => caseSVG(p.xs[n - 1] + x, OY + p.hh - 1 - y, `${(n - 1) % 6}:f`)).join("");
      for (let n = 1; n <= 4; n++) st += `<text x="${(p.xs[n - 1]) * S}" y="${(p.rows - 0.2) * S}" class="geo-lbl">Étape ${n}</text>`;
      st += `<rect x="${p.xs[3] * S - 6}" y="${OY * S - 6}" width="${(p.cols - p.xs[3] - 1) * S + 12}" height="${p.hh * S + 12}" class="geo-zone"/>`;
      if (voirRep) st += sq.cases(4).map(([x, y]) => caseSVG(p.xs[3] + x, OY + p.hh - 1 - y, "3:f", "geo-manque")).join("");
      const tableau = [1, 2, 3, 4, 5].map((n) => `<td>${n <= 3 || voirRep ? sq.n(n) : "?"}</td>`).join("");
      corps = `<div class="geo-fr rc-board">${grille("suite", p, st, true)}${palette()}
        <p class="geo-msg">${verif ? (verif.juste ? `<span class="banner ok">Bravo, l'étape 4 est juste ! 🎉</span>` : `<span class="banner ko">Pas tout à fait : compte bien les carreaux.</span>`) : "Colorie l'étape 4 dans le cadre."}</p>
        <table class="geo-tab"><tr><th>Étape</th>${[1, 2, 3, 4, 5].map((n) => `<th>${n}</th>`).join("")}<th>…</th><th>${etapeQ}</th></tr><tr><th>Carreaux</th>${tableau}<td>…</td><td>${voirRep ? sq.n(etapeQ) : "?"}</td></tr></table>
        <p class="geo-q">Combien de carreaux faudra-t-il à l'étape ${etapeQ} ?${voirRep ? ` <b>${sq.n(etapeQ)}</b> <span class="muted">(étape n : ${sq.formule})</span>` : ""}</p></div>`;
      haut += barre;
      el.innerHTML = haut + corps;
      return;
    }
    if (mode !== "creer") {
      const m = p.m;
      barre = `<div class="tool-top"><select id="fr-m" aria-label="Modèle"><optgroup label="Modèles ${niv}">${FRISES[niv].map((x, i) => `<option value="${i}" ${i === idx ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</optgroup>${perso.length ? `<optgroup label="Mes frises">${perso.map((x, i) => `<option value="${FRISES[niv].length + i}" ${FRISES[niv].length + i === idx ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</optgroup>` : ""}</select>
        <button class="pill" id="fr-hasard">🎲 Au hasard</button>${selFond}
        ${mode === "voir" ? `<button class="pill ${voirMotif ? "on" : ""}" id="fr-motif">${voirMotif ? "Cacher" : "Montrer"} le motif</button>` : `<button class="pill" id="fr-verif">✔️ Vérifier</button><button class="pill" id="fr-sol">💡 Solution</button>`}
        ${m.perso ? `<button class="pill" id="fr-modif">✏️ Modifier</button>` : ""}</div>`;
      if (mode === "voir") {
        let st = "";
        if (voirMotif) for (let k = 0; k < p.reps; k++) st += `<rect x="${k * m.l * S}" y="0" width="${m.l * S}" height="${p.rows * S}" class="geo-bande ${k % 2 ? "b2" : "b1"}"/>`;
        st += couche(p.tout);
        if (voirMotif) st += `<rect x="-4" y="${OY * S - 4}" width="${m.l * S + 8}" height="${m.h * S + 8}" class="geo-motif"/><text x="4" y="${OY * S - 10}" class="geo-lbl">motif</text>`;
        corps = `<div class="geo-fr rc-board">${grille("voir", p, st, false)}<p class="geo-msg">${voirMotif ? `Le motif (${m.l} carreau${m.l > 1 ? "x" : ""} de large) se répète en glissant vers la droite.` : ""}</p></div>`;
      } else if (mode === "continuer") {
        const st = `<rect x="${p.depart * S}" y="0" width="${(p.cols - p.depart) * S}" height="${p.rows * S}" class="geo-zone-eleve"/>` + couche(p.deja, "geo-modele") + `<line x1="${p.depart * S}" y1="-8" x2="${p.depart * S}" y2="${p.rows * S + 8}" class="geo-sep"/>`;
        corps = `<div class="geo-fr rc-board"><p class="geo-q">Continue la frise jusqu'au bout ➜</p>${grille("g", p, st, true)}${palette()}<p class="geo-msg">${message()}</p></div>`;
      } else {
        corps = `<div class="geo-fr rc-board"><p class="geo-q">Le modèle :</p>${grille("modele", p, couche(p.cible, "geo-modele"), false)}<p class="geo-q">Reproduis-le ici :</p>${grille("g", p, "", true)}${palette()}<p class="geo-msg">${message()}</p></div>`;
      }
    } else {
      barre = `<div class="tool-top"><button class="pill" id="fr-new">✨ Nouvelle frise</button>
        ${perso.length ? `<select id="fr-ouvrir" aria-label="Ouvrir une de mes frises"><option value="">Ouvrir une de mes frises…</option>${perso.map((x, i) => `<option value="${i}">${esc(x.nom)}</option>`).join("")}</select>` : ""}
        <span class="stepper"><button data-dim="l-" aria-label="Moins large">−</button><span>Largeur ${edit.l}</span><button data-dim="l+" aria-label="Plus large">+</button></span>
        <span class="stepper"><button data-dim="h-" aria-label="Moins haut">−</button><span>Hauteur ${edit.h}</span><button data-dim="h+" aria-label="Plus haut">+</button></span>${selFond}</div>`;
      const st = `<rect x="0" y="${OY * S}" width="${edit.l * S}" height="${edit.h * S}" class="geo-zone"/>`;
      corps = `<div class="geo-fr rc-board"><p class="geo-q">Dessine ton motif dans le cadre : il se répète tout seul.</p>${grille("g", p, st, true)}${palette()}</div>
        <div class="geo-edit"><label class="inline">Nom <input id="fr-nom" value="${esc(edit.nom)}" maxlength="40"></label>
        <button class="pill" id="fr-save">💾 Enregistrer</button>${edit.id ? `<button class="pill" id="fr-essai">▶️ Faire continuer cette frise</button><button class="pill" id="fr-suppr">Supprimer</button>` : ""}</div>`;
    }
    el.innerHTML = haut + barre + corps;
  };
  const majDyn = () => { const g = el.querySelector("svg[data-inter] .geo-dyn"); if (g) g.innerHTML = dynHTML(plan()); const msg = el.querySelector(".geo-msg"); if (msg && mode !== "voir" && mode !== "suite") msg.innerHTML = message(); };

  // ---- dessin au doigt / stylet / souris ----
  const dansZone = (p, xs) => mode !== "creer" || xs.every((x) => x <= edit.l);
  const noeud = (p, x, y) => [Math.max(0, Math.min(p.cols, Math.round(x))), Math.max(0, Math.min(p.rows, Math.round(y)))];
  const caseA = (p, x, y) => { const c = Math.floor(x), r = Math.floor(y); return c >= 0 && r >= 0 && c < p.cols && r < p.rows ? [c, r] : null; };
  const ajouterSeg = (p, a, b) => { if (!dansZone(p, [a[0], b[0]])) return; instantane(); for (const k of decoupe(a[0], a[1], b[0], b[1])) dess.s.set(k, coul); verif = null; };
  const peindre = (p, c) => {
    if (!c || (mode === "creer" && c[0] >= edit.l)) return;
    const k = cle(c), v = mode === "suite" ? `${coul}:f` : `${coul}:${forme}`;
    if (act.efface) dess.c.delete(k); else dess.c.set(k, v);
    verif = null;
  };
  const gommer = (p, x, y) => {
    for (const k of dess.s.keys()) { const [a, b, c, d] = k.split(",").map(Number), dx = c - a, dy = d - b, t = Math.max(0, Math.min(1, ((x - a) * dx + (y - b) * dy) / (dx * dx + dy * dy))); if (Math.hypot(a + t * dx - x, b + t * dy - y) < 0.22) { dess.s.delete(k); verif = null; return; } }
    const c = caseA(p, x, y); if (c && dess.c.delete(cle(c))) verif = null;
  };
  el.onpointerdown = (e) => {
    const svg = e.target.closest("svg[data-inter]"); if (!svg) return;
    e.preventDefault(); try { svg.setPointerCapture(e.pointerId); } catch {}
    const p = plan(), [x, y] = svgPt(svg, e).map((v) => v / S);
    const o = mode === "suite" ? "colorier" : outil;
    if (o === "trait") { const n = noeud(p, x, y); act = { k: "trait", a: n, svg }; apercu = [n, n]; }
    else if (o === "colorier") { const c = caseA(p, x, y); if (!c) return; instantane(); const v = mode === "suite" ? `${coul}:f` : `${coul}:${forme}`; act = { k: "peint", efface: dess.c.get(cle(c)) === v, svg }; peindre(p, c); }
    else { instantane(); act = { k: "gomme", svg }; gommer(p, x, y); }
    majDyn();
  };
  el.onpointermove = (e) => {
    if (!act) return;
    const p = plan(), [x, y] = svgPt(act.svg, e).map((v) => v / S);
    if (act.k === "trait") apercu = [act.a, noeud(p, x, y)];
    else if (act.k === "peint") peindre(p, caseA(p, x, y));
    else gommer(p, x, y);
    majDyn();
  };
  const fin = (e) => {
    if (!act) return;
    const a = act; act = null;
    if (a.k === "trait") {
      const p = plan(), [x, y] = svgPt(a.svg, e).map((v) => v / S), n = noeud(p, x, y);
      apercu = null;
      if (n[0] !== a.a[0] || n[1] !== a.a[1]) { ajouterSeg(p, a.a, n); pending = null; }
      else if (pending && (pending[0] !== n[0] || pending[1] !== n[1])) { ajouterSeg(p, pending, n); pending = null; }
      else pending = pending ? null : n;
    }
    majDyn();
  };
  el.onpointerup = fin; el.onpointercancel = (e) => { apercu = null; act = null; majDyn(); };

  const verifier = () => {
    const p = plan();
    if (mode === "suite") { const att = normaliser(p.sq.cases(4)), x0 = p.xs[3]; const mine = [...dess.c.keys()].map((k) => k.split(",").map(Number)).filter(([c]) => c >= x0 - 1); const got = mine.length ? normaliser(mine) : new Set(); verif = { juste: got.size === att.size && [...att].every((k) => got.has(k)) }; return; }
    verif = comparer(dess, p.cible, p.deja);
  };
  el.onclick = (e) => {
    if (surNiveau(e, (n) => { niv = n; idx = 0; if (mode === "suite" && !des(niv, "CM1")) mode = "continuer"; modes.length = 0; modes.push(...[["continuer", "➡️ Continuer"], ["reproduire", "✍️ Reproduire"], ["voir", "👁️ Voir le modèle"], ["creer", "🛠️ Créer"]]); if (des(niv, "CM1")) modes.splice(3, 0, ["suite", "📈 Motifs qui grandissent"]); reset(); render(); })) return;
    const t = e.target.closest("button"); if (!t) return;
    const d = t.dataset;
    if (d.mode) { if (d.mode === "creer" && mode !== "creer") { edit = { id: null, nom: "Ma frise", l: 3, h: 2 }; } mode = d.mode; reset(); }
    else if (d.outil) { outil = d.outil; pending = null; }
    else if (d.coul) { coul = +d.coul; if (outil === "gomme") outil = "colorier"; }
    else if (d.forme) forme = d.forme;
    else if (d.fond) fond = d.fond;
    else if (d.act === "annuler") { const h = hist.pop(); if (h) { dess = { s: new Map(h.s), c: new Map(h.c) }; verif = null; } }
    else if (d.act === "effacer") { if (dess.s.size || dess.c.size) { instantane(); dess = vide(); verif = null; sol = false; } }
    else if (d.dim) { const k = d.dim[0], v = edit[k] + (d.dim[1] === "+" ? 1 : -1), max = k === "l" ? 8 : 5; if (v >= 1 && v <= max) { edit[k] = v; for (const kk of [...dess.c.keys()]) { const [c, r] = kk.split(",").map(Number); if (c >= edit.l || r - OY >= edit.h) dess.c.delete(kk); } for (const kk of [...dess.s.keys()]) { const [a, b, c, dd] = kk.split(",").map(Number); if (Math.max(a, c) > edit.l || Math.max(b, dd) - OY > edit.h) dess.s.delete(kk); } } }
    else if (t.id === "fr-hasard") { const L = liste(); let j = idx; if (L.length > 1) while (j === idx) j = hasard(L.length); idx = j; reset(); }
    else if (t.id === "fr-verif") { verifier(); sol = false; }
    else if (t.id === "fr-sol") { verifier(); sol = true; }
    else if (t.id === "fr-motif") voirMotif = !voirMotif;
    else if (t.id === "fr-rep") voirRep = !voirRep;
    else if (t.id === "fr-new") { edit = { id: null, nom: "Ma frise", l: 3, h: 2 }; reset(); }
    else if (t.id === "fr-modif") { const m = modele(); const pm = perso.find((x) => x.id === m.id); if (pm) { charger(pm); mode = "creer"; } }
    else if (t.id === "fr-save") {
      edit.nom = (el.querySelector("#fr-nom")?.value || "Ma frise").trim() || "Ma frise";
      const m = { ...motifEdite(), nom: edit.nom, id: edit.id || Date.now().toString(36) };
      if (!m.c.length && !m.s.length) { alert("Dessine d'abord un motif dans le cadre."); return; }
      const j = perso.findIndex((x) => x.id === m.id); if (j >= 0) perso[j] = m; else perso.push(m);
      edit.id = m.id; garder();
    }
    else if (t.id === "fr-essai") { const j = perso.findIndex((x) => x.id === edit.id); if (j >= 0) { idx = FRISES[niv].length + j; mode = "continuer"; reset(); } }
    else if (t.id === "fr-suppr") { if (confirm("Supprimer cette frise ?")) { perso = perso.filter((x) => x.id !== edit.id); garder(); edit = { id: null, nom: "Ma frise", l: 3, h: 2 }; reset(); } }
    else return;
    render();
  };
  const charger = (pm) => {
    reset(); edit = { id: pm.id, nom: pm.nom, l: pm.l, h: pm.h };
    for (const [c, r, col, sh] of pm.c || []) dess.c.set(cle([c, r + OY]), col + ":" + sh);
    for (const [a, b, c, d, col = -1] of pm.s || []) for (const k of decoupe(a, b + OY, c, d + OY)) dess.s.set(k, col);
  };
  el.onchange = (e) => {
    if (e.target.id === "fr-m") { idx = +e.target.value; reset(); render(); }
    if (e.target.id === "fr-suite") { suite = +e.target.value; etapeQ = choix([10, 12, 15, 20]); reset(); render(); }
    if (e.target.id === "fr-ouvrir" && e.target.value !== "") { charger(perso[+e.target.value]); render(); }
  };
  el.oninput = (e) => { if (e.target.id === "fr-nom") edit.nom = e.target.value; };
  render();
  return () => { act = null; };
}

// =====================================================================
// 2. FORMES ET POLYGONES
// Les figures sont générées au hasard (taille, orientation, symétrie) puis contrôlées :
// une figure « quelconque » ne doit pas avoir de côtés presque égaux ni d'angles presque droits.
// =====================================================================
// Nom le plus précis d'abord, puis les noms plus généraux (acceptés comme « vrais mais pas assez précis »).
const CHAINES = {
  carre: ["carré", "rectangle", "losange", "parallélogramme", "quadrilatère"], rectangle: ["rectangle", "parallélogramme", "quadrilatère"],
  losange: ["losange", "parallélogramme", "quadrilatère"], parallelogramme: ["parallélogramme", "quadrilatère"], trapeze: ["trapèze", "quadrilatère"],
  quadri: ["quadrilatère"], triQ: ["triangle"], triRect: ["triangle rectangle", "triangle"], triIso: ["triangle isocèle", "triangle"],
  triEqui: ["triangle équilatéral", "triangle isocèle", "triangle"], triRectIso: ["triangle rectangle isocèle", "triangle rectangle", "triangle isocèle", "triangle"],
  pentagone: ["pentagone"], pentaReg: ["pentagone"], hexagone: ["hexagone"], hexaReg: ["hexagone"], octogone: ["octogone"], octoReg: ["octogone"],
  etoile: ["étoile"], cercle: ["cercle"], ovale: ["ovale"], demiDisque: ["demi-disque"], ouverte: ["ligne ouverte"], courbe: ["forme à bord courbe"],
};
const TRI_ALL = ["triQ", "triRect", "triIso", "triEqui"];
// « Nomme la forme » : noms proposés (boutons) et figures tirées, par niveau. Un tableau = un groupe tiré au hasard.
const NOMME = {
  CP: { vocab: ["carré", "rectangle", "triangle", "cercle"], types: ["carre", "rectangle", TRI_ALL, "cercle"] },
  CE1: { vocab: ["carré", "rectangle", "triangle", "cercle"], types: ["carre", "rectangle", TRI_ALL, "cercle"] },
  CE2: { vocab: ["carré", "rectangle", "losange", "triangle", "triangle rectangle", "cercle"], types: ["carre", "rectangle", "losange", ["triQ", "triIso", "triEqui"], "triRect", "cercle"] },
  CM1: { vocab: ["carré", "rectangle", "losange", "quadrilatère", "triangle", "triangle rectangle", "triangle isocèle", "triangle équilatéral", "cercle"], types: ["carre", "rectangle", "losange", "quadri", "triQ", "triRect", "triIso", "triEqui", "cercle"] },
  CM2: { vocab: ["carré", "rectangle", "losange", "trapèze", "quadrilatère", "triangle", "triangle rectangle", "triangle isocèle", "triangle équilatéral", "pentagone", "hexagone", "cercle"], types: ["carre", "rectangle", "losange", "trapeze", "quadri", "triQ", "triRect", "triIso", "triEqui", ["pentagone", "pentaReg"], ["hexagone", "hexaReg"], "cercle"] },
};
// « Trie les formes » : critères par niveau. classe(f) renvoie le numéro de la boîte.
const TRIS = [
  { id: "noms", niv: ["CP", "CE1"], titre: "Carrés, rectangles, triangles", boites: ["Carrés", "Rectangles", "Triangles"], types: ["carre", "rectangle", ...TRI_ALL], classe: (f) => (f.type === "carre" ? 0 : f.type === "rectangle" ? 1 : 2) },
  { id: "rond", niv: ["CP", "CE1"], titre: "Rond ou avec des côtés droits ?", boites: ["Formes rondes", "Formes avec des côtés droits"], types: ["cercle", "ovale", "carre", "rectangle", "triQ", "triEqui"], classe: (f) => (f.poly ? 1 : 0) },
  { id: "droit", niv: ["CE1", "CE2", "CM1", "CM2"], titre: "Angle droit ou pas ?", boites: ["Au moins un angle droit", "Aucun angle droit"], types: ["carre", "rectangle", "triRect", "hexagone", "losange", "triEqui", "triQ", "pentaReg", "parallelogramme"], classe: (f) => (f.pr.droits.length ? 0 : 1) },
  { id: "polygones", niv: ["CE2", "CM1", "CM2"], titre: "Polygone ou pas ?", boites: ["Polygones", "Pas des polygones"], types: ["carre", "triQ", "pentagone", "hexagone", "etoile", "quadri", "cercle", "ovale", "demiDisque", "ouverte", "courbe"], classe: (f) => (f.poly ? 0 : 1) },
  { id: "cotes", niv: ["CE2", "CM1", "CM2"], titre: "Combien de côtés ?", boites: ["3 côtés", "4 côtés", "Plus de 4 côtés"], types: ["triQ", "triRect", "triIso", "carre", "rectangle", "losange", "quadri", "pentagone", "pentaReg", "hexagone", "hexaReg", "octoReg"], classe: (f) => (f.pr.n === 3 ? 0 : f.pr.n === 4 ? 1 : 2) },
  { id: "quadri", niv: ["CE2", "CM1", "CM2"], titre: "Les quadrilatères", boites: ["Carrés", "Rectangles (pas carrés)", "Losanges (pas carrés)", "Autres quadrilatères"], types: ["carre", "rectangle", "losange", "quadri", "parallelogramme", "trapeze"], classe: (f) => ({ carre: 0, rectangle: 1, losange: 2 }[f.type] ?? 3) },
  { id: "triangles", niv: ["CM1", "CM2"], titre: "Les triangles", boites: ["Équilatéraux", "Isocèles (pas équilatéraux)", "Rectangles", "Quelconques"], types: ["triEqui", "triIso", "triRect", "triQ"], classe: (f) => ({ triEqui: 0, triIso: 1, triRect: 2, triQ: 3 }[f.type]) },
  { id: "paralleles", niv: ["CM2"], titre: "Côtés parallèles ?", boites: ["Au moins deux côtés parallèles", "Aucun côté parallèle"], types: ["carre", "rectangle", "losange", "parallelogramme", "trapeze", "quadri", "triQ", "hexaReg", "pentaReg"], classe: (f) => (f.pr.paralleles.length ? 0 : 1) },
];
// « Qui suis-je ? » : devinettes par niveau (rep = la bonne figure, pieges = les autres figures proposées).
const DEVINETTES = {
  CP: [
    { txt: "Je suis rond. Je n'ai pas de côté.", rep: "cercle", pieges: ["carre", "triQ", "rectangle"] },
    { txt: "J'ai 3 côtés.", rep: "triQ", pieges: ["carre", "rectangle", "cercle"] },
    { txt: "J'ai 4 côtés, tous de la même longueur, et 4 coins pareils.", rep: "carre", pieges: ["rectangle", "triEqui", "cercle"] },
    { txt: "J'ai 4 côtés : 2 longs et 2 courts.", rep: "rectangle", pieges: ["carre", "triQ", "cercle"] },
  ],
  CE1: [
    { txt: "J'ai 4 côtés de même longueur et 4 angles droits.", rep: "carre", pieges: ["rectangle", "losange", "quadri"] },
    { txt: "J'ai 4 angles droits, mais mes côtés ne sont pas tous de la même longueur.", rep: "rectangle", pieges: ["carre", "losange", "parallelogramme"] },
    { txt: "J'ai 3 côtés et 3 sommets.", rep: "triQ", pieges: ["carre", "pentaReg", "cercle"] },
    { txt: "Je suis rond : je n'ai ni côté, ni sommet.", rep: "cercle", pieges: ["carre", "triQ", "hexaReg"] },
    { txt: "J'ai 3 sommets et un angle droit.", rep: "triRect", pieges: ["triQ", "triEqui", "carre"] },
  ],
  CE2: [
    { txt: "J'ai 4 côtés de même longueur mais aucun angle droit.", rep: "losange", pieges: ["carre", "rectangle", "parallelogramme"] },
    { txt: "Je suis un triangle qui a un angle droit.", rep: "triRect", pieges: ["triQ", "triIso", "triEqui"] },
    { txt: "J'ai 4 angles droits et 4 côtés de même longueur.", rep: "carre", pieges: ["losange", "rectangle", "quadri"] },
    { txt: "J'ai 4 angles droits ; mes côtés opposés ont la même longueur, mais pas tous mes côtés.", rep: "rectangle", pieges: ["carre", "losange", "parallelogramme"] },
    { txt: "Je ne suis pas un polygone : je suis une ligne courbe fermée, et tous mes points sont à la même distance du centre.", rep: "cercle", pieges: ["ovale", "carre", "hexaReg"] },
    { txt: "Je suis un polygone qui a 5 côtés.", rep: "pentaReg", pieges: ["hexaReg", "carre", "triQ"] },
  ],
  CM1: [
    { txt: "Je suis un triangle qui a 3 côtés de même longueur.", rep: "triEqui", pieges: ["triIso", "triRect", "triQ"] },
    { txt: "Je suis un triangle qui a seulement 2 côtés de même longueur.", rep: "triIso", pieges: ["triEqui", "triQ", "triRect"] },
    { txt: "Je suis un triangle qui a un angle droit et deux côtés de même longueur.", rep: "triRectIso", pieges: ["triRect", "triIso", "triEqui"] },
    { txt: "Je suis un quadrilatère : mes 4 côtés ont la même longueur et mes diagonales sont perpendiculaires, mais je n'ai pas d'angle droit.", rep: "losange", pieges: ["carre", "rectangle", "parallelogramme"] },
    { txt: "Mes diagonales ont la même longueur et se coupent en leur milieu, mais elles ne sont pas perpendiculaires.", rep: "rectangle", pieges: ["carre", "losange", "parallelogramme"] },
    { txt: "Je suis un quadrilatère avec 4 angles droits et des diagonales perpendiculaires.", rep: "carre", pieges: ["rectangle", "losange", "quadri"] },
    { txt: "Je suis un triangle : mes trois côtés ont des longueurs différentes et je n'ai pas d'angle droit.", rep: "triQ", pieges: ["triRect", "triIso", "triEqui"] },
  ],
  CM2: [
    { txt: "Je suis un quadrilatère qui a deux côtés parallèles (et seulement deux).", rep: "trapeze", pieges: ["parallelogramme", "quadri", "rectangle"] },
    { txt: "Je suis un quadrilatère : aucun de mes côtés n'est parallèle à un autre.", rep: "quadri", pieges: ["trapeze", "parallelogramme", "rectangle"] },
    { txt: "Je suis un polygone à 6 côtés, tous de la même longueur, et tous mes angles sont égaux.", rep: "hexaReg", pieges: ["hexagone", "pentaReg", "octoReg"] },
    { txt: "Je suis un polygone à 5 côtés.", rep: "pentagone", pieges: ["hexagone", "quadri", "octoReg"] },
    { txt: "Je suis un triangle : un de mes angles est droit et mes côtés ont tous des longueurs différentes.", rep: "triRect", pieges: ["triRectIso", "triQ", "triIso"] },
    { txt: "Je suis un quadrilatère : mes 4 côtés ont la même longueur et mes diagonales ont la même longueur.", rep: "carre", pieges: ["losange", "rectangle", "trapeze"] },
    { txt: "Je suis un triangle qui a seulement 2 côtés de même longueur.", rep: "triIso", pieges: ["triEqui", "triQ", "triRect"] },
  ],
};
const regulier = (n, r = 1, a0 = -90) => Array.from({ length: n }, (_, i) => [r * Math.cos((a0 + 360 * i / n) * RAD), r * Math.sin((a0 + 360 * i / n) * RAD)]);
const irregulier = (n) => { const gap = 360 / n; const ang = Array.from({ length: n }, (_, i) => i * gap + rnd(-0.3, 0.3) * gap); return ang.map((a) => { const r = rnd(0.7, 1); return [r * Math.cos(a * RAD), r * Math.sin(a * RAD)]; }); };
const arc = (cx, cy, r, a0, a1, n, ry = r) => Array.from({ length: n + 1 }, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * RAD; return [cx + r * Math.cos(a), cy + ry * Math.sin(a)]; });
const GEN = {
  carre: () => [[0, 0], [1, 0], [1, 1], [0, 1]],
  rectangle: () => { const b = rnd(1.45, 2.3); return [[0, 0], [b, 0], [b, 1], [0, 1]]; },
  losange: () => { const d = rnd(1.5, 2.6); return [[0, -d / 2], [0.5, 0], [0, d / 2], [-0.5, 0]]; },
  parallelogramme: () => { const b = rnd(1.5, 2.1), a = rnd(55, 72) * RAD, ux = Math.cos(a), uy = Math.sin(a); return [[0, 0], [b, 0], [b + ux, uy], [ux, uy]]; },
  trapeze: () => { const b = 2.2, t = rnd(0.9, 1.5), h = rnd(0.8, 1.3), o = rnd(-0.2, b - t + 0.2); return [[0, 0], [b, 0], [o + t, h], [o, h]]; },
  quadri: () => (Math.random() < 0.8 ? irregulier(4) : [[0, -1], [rnd(0.55, 0.95), rnd(0.6, 1)], [rnd(-0.1, 0.1), rnd(0.05, 0.35)], [-rnd(0.4, 0.8), rnd(0.65, 1)]]),
  triQ: () => irregulier(3),
  triRect: () => { const b = rnd(1.4, 2.2); return [[0, 0], [b, 0], [0, 1]]; },
  triIso: () => { const ap = choix([rnd(28, 48), rnd(72, 82), rnd(100, 130)]) / 2 * RAD; return [[0, 0], [Math.sin(ap), Math.cos(ap)], [-Math.sin(ap), Math.cos(ap)]]; },
  triEqui: () => regulier(3),
  triRectIso: () => [[0, 0], [1, 0], [0, 1]],
  pentaReg: () => regulier(5), hexaReg: () => regulier(6), octoReg: () => regulier(8),
  pentagone: () => irregulier(5),
  hexagone: () => (Math.random() < 0.6 ? irregulier(6) : (() => { const a = rnd(1.7, 2.1), b = rnd(0.55, 0.8), c = rnd(0.85, 1.1), d = rnd(1.35, 1.6); return [[0, 0], [a, 0], [a, b], [c, b], [c, d], [0, d]]; })()),
  octogone: () => irregulier(8),
  etoile: () => Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 0.42 : 1, a = (-90 + 36 * i) * RAD; return [r * Math.cos(a), r * Math.sin(a)]; }),
  cercle: () => ({ cercle: true }),
  ovale: () => ({ pts: arc(0, 0, 1, 0, 360, 72, rnd(0.5, 0.68)).slice(0, -1), poly: false }),
  demiDisque: () => ({ pts: arc(0, 0, 1, 180, 360, 36), poly: false }),
  ouverte: () => ({ pts: [[0, 0.6], [0.5, -0.4], [1, 0.5], [1.6, -0.5], [2, 0.3]].map(([x, y]) => [x + rnd(-0.1, 0.1), y + rnd(-0.15, 0.15)]), poly: false, ouvert: true }),
  courbe: () => ({ pts: [[0, 1], [0, 0], [1.2, 0], [1.2, 1], ...arc(0.6, 1, 0.6, 0, 180, 24).slice(1, -1)], poly: false }),
};
// tol : tolérances (relative pour les longueurs, en degrés pour les angles). Les figures tirées au hasard sont exactes ;
// la figure manipulée à la main (figures()) utilise des tolérances plus larges.
function proprietes(P, tol = { rel: 1e-6, deg: 0.5 }) {
  const n = P.length, sinT = tol.deg > 0.5 ? Math.sin(tol.deg * RAD) : tol.rel; let A = 0;
  for (let i = 0; i < n; i++) { const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % n]; A += x1 * y2 - x2 * y1; }
  const sg = Math.sign(A) || 1, L = [], ang = [], droits = [], paralleles = [], groupes = [];
  const u = (i) => { const a = P[i], b = P[(i + 1) % n]; return [b[0] - a[0], b[1] - a[1]]; };
  for (let i = 0; i < n; i++) { const [dx, dy] = u(i); L.push(Math.hypot(dx, dy)); }
  for (let i = 0; i < n; i++) {
    const d1 = u((i - 1 + n) % n), d2 = u(i), turn = Math.atan2(d1[0] * d2[1] - d1[1] * d2[0], d1[0] * d2[0] + d1[1] * d2[1]);
    const a = 180 - sg * turn / RAD; ang.push(a); if (Math.abs(a - 90) < tol.deg) droits.push(i);
  }
  const g = new Array(n).fill(-1); let ng = 0;
  for (let i = 0; i < n; i++) { if (g[i] >= 0) continue; const mem = [i]; for (let j = i + 1; j < n; j++) if (g[j] < 0 && Math.abs(L[i] - L[j]) < tol.rel * Math.max(L[i], L[j])) mem.push(j); if (mem.length > 1) { mem.forEach((k) => (g[k] = ng)); groupes.push(mem); ng++; } }
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) { if (i === 0 && j === n - 1) continue; const a = u(i), b = u(j); if (Math.abs(a[0] * b[1] - a[1] * b[0]) / (L[i] * L[j]) < sinT) paralleles.push([i, j]); }
  const pr = { n, L, ang, droits, groupes, groupe: g, paralleles, convexe: ang.every((a) => a < 180), aire: Math.abs(A) / 2 };
  if (n === 4) { const d1 = [P[2][0] - P[0][0], P[2][1] - P[0][1]], d2 = [P[3][0] - P[1][0], P[3][1] - P[1][1]], l1 = Math.hypot(...d1), l2 = Math.hypot(...d2); pr.diag = { egales: Math.abs(l1 - l2) < tol.rel * l1, perp: Math.abs(d1[0] * d2[0] + d1[1] * d2[1]) / (l1 * l2) < sinT, milieu: Math.hypot(P[0][0] + P[2][0] - P[1][0] - P[3][0], P[0][1] + P[2][1] - P[1][1] - P[3][1]) < tol.rel * l1 }; }
  return pr;
}
// Refuse les « presque » : côtés presque égaux, angles presque droits, côtés presque parallèles, angles trop fermés.
function nette(pr) {
  const { n, L, ang } = pr;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const r = Math.max(L[i], L[j]) / Math.min(L[i], L[j]); if (r > 1 + 1e-6 && r < 1.1) return false; }
  for (const a of ang) { const d = Math.abs(a - 90); if (d > 0.5 && d < 8) return false; if (a < 20 || (a > 168 && a < 192)) return false; }
  return true;
}
const ATTENDU = {
  triQ: (p) => !p.groupes.length && !p.droits.length, quadri: (p) => !p.groupes.length && !p.droits.length && !p.paralleles.length,
  trapeze: (p) => p.paralleles.length === 1 && !p.droits.length, pentagone: (p) => p.n === 5 && p.convexe && !p.droits.length, octogone: (p) => p.convexe,
  hexagone: (p) => p.n === 6 && (p.convexe ? !p.droits.length : true), triIso: (p) => p.groupes.length === 1 && p.groupes[0].length === 2 && !p.droits.length,
  triRect: (p) => p.droits.length === 1 && !p.groupes.length, parallelogramme: (p) => p.paralleles.length === 2 && !p.droits.length && !p.groupes.some((g) => g.length > 2),
};
const PASTELS = ["#ffd0dc", "#cfe6ff", "#c9ecd4", "#ffe3a3", "#d7ccff", "#ffd7bf"];
function fabriquer(type) {
  for (let essai = 0; essai < 500; essai++) {
    const g = GEN[type]();
    let pts, poly = true, ouvert = false;
    if (g.cercle) { const r = rnd(22, 40); return { type, poly: false, cercle: { cx: rnd(50 - (40 - r) * 0.6, 50 + (40 - r) * 0.6), cy: rnd(50 - (40 - r) * 0.6, 50 + (40 - r) * 0.6), r }, coul: choix(PASTELS) }; }
    if (Array.isArray(g)) pts = g; else ({ pts, poly = false, ouvert = false } = g);
    if (poly) { const pr = proprietes(pts); if (essai < 499 && (!nette(pr) || !(ATTENDU[type]?.(pr) ?? true))) continue; }
    const th = (Math.random() < 0.3 ? hasard(4) * 90 : rnd(0, 360)) * RAD, mir = Math.random() < 0.5 ? -1 : 1, c = Math.cos(th), s = Math.sin(th);
    let q = pts.map(([x, y]) => [mir * x * c - y * s, mir * x * s + y * c]);
    const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]), w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    const k = 76 / Math.max(w, h) * rnd(0.7, 1), ox = (100 - w * k) / 2 + rnd(-1, 1) * (76 - w * k) / 2 * 0.6, oy = (100 - h * k) / 2 + rnd(-1, 1) * (76 - h * k) / 2 * 0.6;
    q = q.map(([x, y]) => [(x - Math.min(...xs)) * k + ox, (y - Math.min(...ys)) * k + oy]);
    return { type, poly, ouvert, pts: q, pr: poly ? proprietes(q) : null, coul: choix(PASTELS) };
  }
}
const ptsStr = (P) => P.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ");
function marques(f, niv) {
  if (f.cercle) {
    if (!des(niv, "CE2")) return "";
    const { cx, cy, r } = f.cercle, a = rnd(0, 360) * RAD, cm = des(niv, "CM1");
    return `<circle cx="${cx}" cy="${cy}" r="1.8" class="geo-mk-pt"/><text x="${cx + 2}" y="${cy - 3}" class="geo-mk-t">centre</text>
      <line x1="${cx}" y1="${cy}" x2="${f1(cx + r * Math.cos(a))}" y2="${f1(cy + r * Math.sin(a))}" class="geo-mk-r"/>
      ${cm ? `<line x1="${f1(cx - r * Math.cos(a + 2))}" y1="${f1(cy - r * Math.sin(a + 2))}" x2="${f1(cx + r * Math.cos(a + 2))}" y2="${f1(cy + r * Math.sin(a + 2))}" class="geo-mk-d"/>` : ""}`;
  }
  if (!f.poly) return "";
  const P = f.pts, pr = f.pr, n = P.length, cx = P.reduce((s, p) => s + p[0], 0) / n, cy = P.reduce((s, p) => s + p[1], 0) / n;
  let g = "";
  if (n === 4 && des(niv, "CM1")) { g += `<line x1="${f1(P[0][0])}" y1="${f1(P[0][1])}" x2="${f1(P[2][0])}" y2="${f1(P[2][1])}" class="geo-mk-diag"/><line x1="${f1(P[1][0])}" y1="${f1(P[1][1])}" x2="${f1(P[3][0])}" y2="${f1(P[3][1])}" class="geo-mk-diag"/>`; }
  for (const i of pr.droits) {
    const V = P[i], A = P[(i - 1 + n) % n], B = P[(i + 1) % n], la = Math.hypot(A[0] - V[0], A[1] - V[1]), lb = Math.hypot(B[0] - V[0], B[1] - V[1]), s = Math.min(6, 0.3 * Math.min(la, lb));
    const u = [(A[0] - V[0]) / la * s, (A[1] - V[1]) / la * s], w = [(B[0] - V[0]) / lb * s, (B[1] - V[1]) / lb * s];
    g += `<path d="M${f1(V[0] + u[0])} ${f1(V[1] + u[1])} L${f1(V[0] + u[0] + w[0])} ${f1(V[1] + u[1] + w[1])} L${f1(V[0] + w[0])} ${f1(V[1] + w[1])}" class="geo-mk-angle"/>`;
  }
  for (let i = 0; i < n; i++) {
    const gi = pr.groupe[i]; if (gi < 0) continue;
    const a = P[i], b = P[(i + 1) % n], L = pr.L[i], ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    for (let t = 0; t <= gi; t++) { const o = (t - gi / 2) * 2.4; g += `<line x1="${f1(mx + o * ux - 3 * uy)}" y1="${f1(my + o * uy + 3 * ux)}" x2="${f1(mx + o * ux + 3 * uy)}" y2="${f1(my + o * uy - 3 * ux)}" class="geo-mk-tick"/>`; }
  }
  P.forEach(([x, y], i) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1; g += `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.9" class="geo-mk-pt"/><text x="${f1(x + dx / d * 6)}" y="${f1(y + dy / d * 6)}" class="geo-mk-n">${i + 1}</text>`; });
  return g;
}
function resume(f, niv) {
  if (f.cercle) return des(niv, "CE2") ? "Un cercle n'a ni côté ni sommet. Tous ses points sont à la même distance du centre : c'est le rayon." : "Un cercle est rond : il n'a ni côté, ni sommet.";
  if (!f.poly) return f.ouvert ? "Cette ligne n'est pas fermée : ce n'est pas un polygone." : "Cette forme a un bord courbe : ce n'est pas un polygone.";
  const pr = f.pr, r = [`${pr.n} côtés`, `${pr.n} sommets`];
  if (des(niv, "CE1")) r.push(pr.droits.length ? `${pr.droits.length} angle${pr.droits.length > 1 ? "s" : ""} droit${pr.droits.length > 1 ? "s" : ""}` : "aucun angle droit");
  if (pr.groupes.length === 1 && pr.groupes[0].length === pr.n) r.push("tous les côtés ont la même longueur");
  else if (pr.n === 4 && pr.groupes.length === 2 && pr.groupes.every((g) => g.length === 2 && (g[1] - g[0]) === 2)) r.push("les côtés opposés ont la même longueur");
  else pr.groupes.forEach((g) => r.push(`${g.length} côtés de même longueur`));
  if (des(niv, "CM1")) {
    if (pr.paralleles.length) r.push(`${pr.paralleles.length} paire${pr.paralleles.length > 1 ? "s" : ""} de côtés parallèles`);
    if (pr.diag) { const d = []; if (pr.diag.egales) d.push("de même longueur"); if (pr.diag.perp) d.push("perpendiculaires"); if (pr.diag.milieu) d.push("qui se coupent en leur milieu"); if (d.length) r.push(`diagonales ${d.join(", ")}`); }
    if (!pr.convexe) r.push("polygone non convexe (un angle « rentrant »)");
  }
  return r.join(" • ");
}
const carteSVG = (f, voir, niv, cls = "") => {
  const fig = f.cercle ? `<circle cx="${f1(f.cercle.cx)}" cy="${f1(f.cercle.cy)}" r="${f1(f.cercle.r)}" class="geo-fp" style="fill:${f.coul}"/>`
    : f.ouvert ? `<polyline points="${ptsStr(f.pts)}" class="geo-fp geo-ouv"/>` : `<polygon points="${ptsStr(f.pts)}" class="geo-fp" style="fill:${f.coul}"/>`;
  return `<svg viewBox="0 0 100 100" class="geo-fsvg ${cls}" aria-hidden="true">${fig}${voir ? marques(f, niv) : ""}</svg>`;
};

function formes(el) {
  let niv = niveauJeux(), act = "nomme", voir = false, score = 0, total = 0, dernier = null;
  let q = null; // nomme : { f, rep, faux:Set, ok, partiel }
  let dv = null; // devinette : { d, cartes, choisi }
  let tri = null; // { def, formes:[{f, b}], sel, verif }
  let drag = null;
  const triDispo = () => TRIS.filter((t) => t.niv.includes(niv));
  let triId = triDispo()[0].id;
  const tirer = (types) => { let t; do { t = choix(types); if (Array.isArray(t)) t = choix(t); } while (t === dernier && types.length > 1); dernier = t; return t; };
  const nouvelle = () => {
    voir = false;
    if (act === "nomme") { const N = NOMME[niv], f = fabriquer(tirer(N.types)); q = { f, rep: CHAINES[f.type].find((x) => N.vocab.includes(x)), faux: new Set(), ok: false, partiel: "" }; }
    else if (act === "devine") { const L = DEVINETTES[niv], d = choix(L.filter((x) => x !== dv?.d)) || L[0]; dv = { d, cartes: melange([d.rep, ...d.pieges]).map((t) => ({ t, f: fabriquer(t) })), choisi: new Set(), ok: false }; }
    else { const def = triDispo().find((t) => t.id === triId) || triDispo()[0]; triId = def.id; const fs = []; const nb = Math.min(10, Math.max(8, def.boites.length * 2 + 2)); const parBoite = def.boites.map(() => []); def.types.forEach((t) => parBoite[def.classe(fabriquer(t))]?.push(t));
      let k = 0; while (fs.length < nb) { const b = k % def.boites.length; const t = k < def.boites.length * 2 && parBoite[b].length ? choix(parBoite[b]) : choix(def.types); const f = fabriquer(t); fs.push({ f, b: -1, juste: def.classe(f) }); k++; }
      tri = { def, formes: melange(fs), sel: null, verif: false }; }
  };
  const render = () => {
    const acts = [["nomme", "🏷️ Nomme la forme"], ["trie", "🗂️ Trie les formes"], ["devine", "🕵️ Qui suis-je ?"]];
    let h = `<div class="tool-top">${segNiveau(niv)}<div class="seg">${acts.map(([k, v]) => `<button data-act="${k}" class="${act === k ? "on" : ""}">${v}</button>`).join("")}</div></div>`;
    if (act === "nomme") {
      h += `<div class="tool-top"><button class="pill ${voir ? "on" : ""}" id="fo-voir">🔍 ${voir ? "Cacher" : "Voir"} les propriétés</button><button class="pill" id="fo-next">🎲 Nouvelle forme</button><span class="score">⭐ ${score} / ${total}</span></div>
        <div class="geo-quiz rc-board"><p class="geo-q">Comment s'appelle cette forme ?</p>
        <div class="geo-scene">${carteSVG(q.f, voir, niv, "geo-big")}</div>
        ${voir ? `<p class="geo-props">${resume(q.f, niv)}</p>` : ""}
        <div class="geo-reps">${NOMME[niv].vocab.map((v) => `<button class="geo-rep ${q.ok && v === q.rep ? "good" : q.faux.has(v) ? "bad" : ""}" data-nom="${esc(v)}" ${q.ok ? "disabled" : ""}>${esc(v)}</button>`).join("")}</div>
        <p class="geo-msg">${q.ok ? `<span class="banner ok">Oui, c'est un ${q.rep} ! 🎉</span> <button class="geo-tb" id="fo-next2">Suivant ➜</button>` : q.partiel ? `<span class="banner ko">${q.partiel}</span>` : ""}</p></div>`;
    } else if (act === "devine") {
      h += `<div class="tool-top"><button class="pill ${voir ? "on" : ""}" id="fo-voir">🔍 ${voir ? "Cacher" : "Voir"} les propriétés</button><button class="pill" id="fo-next">🎲 Autre devinette</button><span class="score">⭐ ${score} / ${total}</span></div>
        <div class="geo-quiz rc-board"><p class="geo-devinette">« ${esc(dv.d.txt)} »<br><small>Qui suis-je ?</small></p>
        <div class="geo-cartes">${dv.cartes.map((c, i) => `<button class="geo-carte ${dv.ok && c.t === dv.d.rep ? "good" : dv.choisi.has(i) ? "bad" : ""}" data-dv="${i}" aria-label="Figure ${i + 1}">${carteSVG(c.f, voir, niv)}${voir ? `<small>${esc(resume(c.f, niv))}</small>` : ""}</button>`).join("")}</div>
        <p class="geo-msg">${dv.ok ? `<span class="banner ok">Bravo, trouvé ! 🎉</span> <button class="geo-tb" id="fo-next2">Suivant ➜</button>` : dv.choisi.size ? `<span class="banner ko">Non, relis bien la devinette.</span>` : ""}</p></div>`;
    } else {
      const td = tri.def, tous = tri.formes.every((x) => x.b >= 0), juste = tri.verif && tri.formes.every((x) => x.b === x.juste);
      const carte = (x, i) => `<button class="geo-carte geo-mob ${tri.sel === i ? "sel" : ""} ${tri.verif && x.b >= 0 ? (x.b === x.juste ? "good" : "bad") : ""}" data-tf="${i}" aria-label="Figure ${i + 1}">${carteSVG(x.f, voir, niv)}</button>`;
      h += `<div class="tool-top"><select id="fo-tri" aria-label="Critère de tri">${triDispo().map((t) => `<option value="${t.id}" ${t.id === td.id ? "selected" : ""}>${esc(t.titre)}</option>`).join("")}</select>
        <button class="pill" id="fo-verif">✔️ Vérifier</button><button class="pill ${voir ? "on" : ""}" id="fo-voir">🔍 Propriétés</button><button class="pill" id="fo-next">🎲 Nouvelles formes</button></div>
        <div class="geo-tri rc-board">
          <div class="geo-plateau" data-b="-1">${tri.formes.map((x, i) => (x.b < 0 ? carte(x, i) : "")).join("") || `<span class="muted">Toutes les formes sont rangées.</span>`}</div>
          <div class="geo-boites" style="--n:${td.boites.length}">${td.boites.map((b, bi) => `<div class="geo-boite" data-b="${bi}"><b>${esc(b)}</b><div class="geo-boite-in">${tri.formes.map((x, i) => (x.b === bi ? carte(x, i) : "")).join("")}</div></div>`).join("")}</div>
          <p class="geo-msg">${tri.verif ? (juste ? `<span class="banner ok">Bravo, tout est bien rangé ! 🎉</span>` : `<span class="banner ko">${tous ? "Il y a des erreurs (en rouge)." : "Il reste des formes à ranger."}</span>`) : "Fais glisser chaque forme dans la bonne boîte (ou touche la forme, puis la boîte)."}</p>
        </div>`;
    }
    el.innerHTML = h;
  };
  const placer = (i, b) => { tri.formes[i].b = b; tri.sel = null; tri.verif = false; };
  el.onpointerdown = (e) => { const b = e.target.closest("[data-tf]"); if (!b || act !== "trie") return; drag = { i: +b.dataset.tf, x: e.clientX, y: e.clientY, ghost: null, src: b }; };
  el.onpointermove = (e) => {
    if (!drag) return;
    if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) { drag.ghost = drag.src.cloneNode(true); drag.ghost.classList.add("geo-ghost"); drag.ghost.removeAttribute("data-tf"); document.body.appendChild(drag.ghost); drag.src.style.opacity = ".3"; }
    if (drag.ghost) { e.preventDefault(); drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px"; }
  };
  const finDrag = (e) => {
    if (!drag) return; const d = drag; drag = null; if (!d.ghost) return;
    d.ghost.remove(); d.src.style.opacity = "";
    const cible = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-b]");
    if (cible) placer(d.i, +cible.dataset.b);
    el._dragFini = true; setTimeout(() => { el._dragFini = false; }, 0); render();
  };
  el.onpointerup = finDrag; el.onpointercancel = finDrag;
  el.onclick = (e) => {
    if (el._dragFini) { el._dragFini = false; return; }
    if (surNiveau(e, (n) => { niv = n; if (!triDispo().some((t) => t.id === triId)) triId = triDispo()[0].id; score = total = 0; nouvelle(); render(); })) return;
    const t = e.target.closest("button, [data-b]"); if (!t) return;
    const d = t.dataset;
    if (d.act) { act = d.act; score = total = 0; nouvelle(); }
    else if (t.id === "fo-voir") voir = !voir;
    else if (t.id === "fo-next" || t.id === "fo-next2") nouvelle();
    else if (d.nom && q && !q.ok) {
      const v = d.nom;
      if (v === q.rep) { q.ok = true; q.partiel = ""; if (!q.faux.size) score++; total++; }
      else if (CHAINES[q.f.type].includes(v)) q.partiel = `Oui, c'est bien un ${v}… mais il a un nom plus précis !`;
      else { q.faux.add(v); q.partiel = "Non, regarde bien ses côtés et ses sommets."; }
    }
    else if (d.dv && dv && !dv.ok) { const i = +d.dv; if (dv.cartes[i].t === dv.d.rep) { dv.ok = true; if (!dv.choisi.size) score++; total++; } else dv.choisi.add(i); }
    else if (d.tf) { const i = +d.tf; if (tri.formes[i].b >= 0 && tri.sel == null) { placer(i, -1); } else tri.sel = tri.sel === i ? null : i; }
    else if (d.b != null && tri && tri.sel != null) placer(tri.sel, +d.b);
    else if (t.id === "fo-verif") tri.verif = true;
    else return;
    render();
  };
  el.onchange = (e) => { if (e.target.id === "fo-tri") { triId = e.target.value; nouvelle(); render(); } };
  nouvelle(); render();
  return () => { drag?.ghost?.remove(); drag = null; };
}

// =====================================================================
// 2 bis. FIGURES À MANIPULER
// Un polygone au tableau : on déplace ses sommets, on le fait glisser, tourner, on l'agrandit ou on le retourne.
// Son nom et ses propriétés (côtés, angles, parallèles, diagonales, axes de symétrie) se mettent à jour en direct.
// Unité = 1 carreau. Avec l'aimant, les sommets se posent sur les nœuds du quadrillage : les égalités sont alors exactes.
// Sans l'aimant, les tolérances TOL_MANIP s'appliquent (côtés égaux à 1,5 % près, angles à 1° près).
// =====================================================================
const FG = { C: 16, R: 10, G: 50 }; // colonnes, lignes, unités du viewBox par carreau
const TOL_MANIP = { rel: 0.015, deg: 1 };
const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const regAutour = (n, r, cx, cy) => regulier(n, r).map(([x, y]) => [cx + x, cy + y]);
const DEPARTS = [
  ["carre", "Carré", () => [[6, 3], [10, 3], [10, 7], [6, 7]]],
  ["rectangle", "Rectangle", () => [[5, 3], [11, 3], [11, 7], [5, 7]]],
  ["losange", "Losange", () => [[8, 1], [10, 5], [8, 9], [6, 5]]],
  ["parallelogramme", "Parallélogramme", () => [[4, 7], [10, 7], [12, 3], [6, 3]]],
  ["trapeze", "Trapèze", () => [[4, 7], [12, 7], [10, 3], [6, 3]]],
  ["quadri", "Quadrilatère quelconque", () => [[5, 7], [10, 8], [11, 4], [7, 2]]],
  ["triQ", "Triangle", () => [[5, 7], [11, 8], [8, 2]]],
  ["triRect", "Triangle rectangle", () => [[5, 8], [11, 8], [5, 3]]],
  ["triIso", "Triangle isocèle", () => [[5, 8], [11, 8], [8, 2]]],
  ["triEqui", "Triangle équilatéral", () => regAutour(3, 3.4, 8, 5.8)],
  ["pentaReg", "Pentagone régulier", () => regAutour(5, 3.3, 8, 5.3)],
  ["hexaReg", "Hexagone régulier", () => regAutour(6, 3.3, 8, 5)],
];
const VOC_PLUS = { CM1: ["parallélogramme", "triangle rectangle isocèle"], CM2: ["parallélogramme", "triangle rectangle isocèle", "octogone"] };
const centre = (P) => P.reduce((s, p) => [s[0] + p[0] / P.length, s[1] + p[1] / P.length], [0, 0]);
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const virg = (x) => String(Math.round(x * 10) / 10).replace(".", ",");

// Deux côtés non voisins qui se coupent : la ligne n'est plus un polygone (simple).
function croise(P) {
  const n = P.length, o = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    const a = P[i], b = P[(i + 1) % n], c = P[j], d = P[(j + 1) % n];
    if (o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0) return true;
  }
  return false;
}
// Type de la figure (clés de CHAINES) d'après ses propriétés.
function typeFigure(pr) {
  const { n, droits, groupes, paralleles } = pr, tousEgaux = groupes.length === 1 && groupes[0].length === n;
  if (n === 3) { const iso = groupes.length > 0, d = droits.length > 0; return tousEgaux ? "triEqui" : d && iso ? "triRectIso" : d ? "triRect" : iso ? "triIso" : "triQ"; }
  if (n === 4) {
    if (!pr.convexe) return "quadri";
    if (paralleles.length === 2) return droits.length && tousEgaux ? "carre" : droits.length ? "rectangle" : tousEgaux ? "losange" : "parallelogramme";
    return paralleles.length === 1 ? "trapeze" : "quadri";
  }
  const reg = tousEgaux && pr.convexe && pr.ang.every((a) => Math.abs(a - pr.ang[0]) < 2 * TOL_MANIP.deg);
  return { 5: reg ? "pentaReg" : "pentagone", 6: reg ? "hexaReg" : "hexagone", 8: reg ? "octoReg" : "octogone" }[n] || null;
}
// Nom donné à la figure avec le vocabulaire du niveau.
function nomFigure(pr, niv) {
  const t = typeFigure(pr), voc = [...NOMME[niv].vocab, ...(VOC_PLUS[niv] || [])];
  let nom = t && CHAINES[t].find((v) => voc.includes(v));
  if (nom && /Reg$/.test(t) && des(niv, "CM1")) nom += " régulier";
  if (nom) return `C'est un ${nom}.`;
  return des(niv, "CE2") ? `C'est un polygone à ${pr.n} côtés.` : `C'est une forme à ${pr.n} côtés.`;
}
// Axes de symétrie d'un polygone : droites passant par le centre (moyenne des sommets) et par un sommet ou le milieu d'un côté.
// Un axe convient si le symétrique de chaque sommet est un sommet et si les côtés restent des côtés.
function axesSym(P, tolAbs) {
  const n = P.length, c = centre(P), axes = [], cands = [];
  for (let i = 0; i < n; i++) { const q = P[(i + 1) % n]; cands.push(P[i], [(P[i][0] + q[0]) / 2, (P[i][1] + q[1]) / 2]); }
  for (const q of cands) {
    const dx = q[0] - c[0], dy = q[1] - c[1], l = Math.hypot(dx, dy); if (l < 1e-9) continue;
    const u = [dx / l, dy / l];
    if (axes.some((a) => Math.abs(a[0] * u[1] - a[1] * u[0]) < 1e-3)) continue;
    const refl = (p) => { const vx = p[0] - c[0], vy = p[1] - c[1], k = vx * u[0] + vy * u[1]; return [c[0] + 2 * k * u[0] - vx, c[1] + 2 * k * u[1] - vy]; };
    const map = P.map((p) => { const r = refl(p); return P.findIndex((s) => dist2(s, r) < tolAbs); });
    if (map.some((k) => k < 0) || new Set(map).size !== n) continue;
    if (map.every((k, i) => { const k2 = map[(i + 1) % n]; return (k2 - k + n) % n === 1 || (k - k2 + n) % n === 1; })) axes.push(u);
  }
  return { c, axes };
}
// Analyse complète de la figure manipulée.
function analyser(P) {
  const n = P.length;
  if (P.some((p, i) => dist2(p, P[(i + 1) % n]) < 0.05)) return { plat: true };
  if (croise(P)) return { croise: true };
  const pr = proprietes(P, TOL_MANIP), moyL = pr.L.reduce((s, x) => s + x, 0) / n;
  return { pr, sym: axesSym(P, TOL_MANIP.rel * 1.5 * moyL) };
}

function figures(el) {
  const { C, R, G } = FG;
  let niv = niveauJeux(), dep = "rectangle", P = DEPARTS[1][2](), hist = [], aimant = true, grille = "carreaux", sel = -1, axeX = 8, act = null;
  const voir = { longueurs: false, angles: false, codage: true, paralleles: false, diagonales: false, axes: false, miroir: false, mesures: false };
  const BOUTONS_VOIR = [["codage", "✔️ Codage"], ["longueurs", "📏 Longueurs"], ["angles", "∠ Angles"], ["paralleles", "∥ Parallèles"], ["diagonales", "⤡ Diagonales"], ["axes", "🦋 Axes de symétrie"], ["miroir", "🪞 Symétrique"], ["mesures", "📐 Périmètre et aire"]];
  const dispoVoir = () => BOUTONS_VOIR.filter(([k]) => k !== "mesures" || des(niv, "CM1"));
  const snap = (v) => (aimant ? Math.round(v) : v);
  const X = (v) => f1(v * G);
  const pt = (e) => { const [x, y] = svgPt(el.querySelector("#fg-svg"), e); return [x / G, y / G]; };
  const garder = () => { hist.push(P.map((p) => [...p])); if (hist.length > 60) hist.shift(); };
  const dedans = (Q) => Q.every(([x, y]) => x >= -1e-9 && x <= C + 1e-9 && y >= -1e-9 && y <= R + 1e-9);
  // Ramène la figure dans le tableau (après une rotation ou un agrandissement). Renvoie null si elle est trop grande.
  const recadrer = (Q) => {
    const xs = Q.map((p) => p[0]), ys = Q.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (x1 - x0 > C || y1 - y0 > R) return null;
    let dx = x0 < 0 ? -x0 : x1 > C ? C - x1 : 0, dy = y0 < 0 ? -y0 : y1 > R ? R - y1 : 0;
    if (aimant) { dx = dx > 0 ? Math.ceil(dx) : Math.floor(dx); dy = dy > 0 ? Math.ceil(dy) : Math.floor(dy); }
    const out = Q.map(([x, y]) => [x + dx, y + dy]);
    return dedans(out) ? out : Q.map(([x, y]) => [x + (x0 < 0 ? -x0 : x1 > C ? C - x1 : 0), y + (y0 < 0 ? -y0 : y1 > R ? R - y1 : 0)]);
  };
  // Centre de rotation / d'agrandissement : arrondi au demi-carreau avec l'aimant (un quart de tour garde alors les nœuds).
  const pivot = () => { const c = centre(P); return aimant ? [Math.round(c[0] * 2) / 2, Math.round(c[1] * 2) / 2] : c; };
  const tourne = (Q, c, a) => { const co = Math.cos(a), si = Math.sin(a); return Q.map(([x, y]) => { const vx = x - c[0], vy = y - c[1], nx = c[0] + vx * co - vy * si, ny = c[1] + vx * si + vy * co; return [Math.abs(nx - Math.round(nx)) < 1e-9 ? Math.round(nx) : nx, Math.abs(ny - Math.round(ny)) < 1e-9 ? Math.round(ny) : ny]; }); };

  const fondSVG = () => {
    let g = `<rect x="0" y="0" width="${C * G}" height="${R * G}" class="fg-fond"/>`;
    if (grille === "points") { for (let x = 0; x <= C; x++) for (let y = 0; y <= R; y++) g += `<circle cx="${x * G}" cy="${y * G}" r="3" class="geo-pt"/>`; }
    else if (grille === "carreaux") { for (let x = 0; x <= C; x++) g += `<line x1="${x * G}" y1="0" x2="${x * G}" y2="${R * G}" class="geo-gl"/>`; for (let y = 0; y <= R; y++) g += `<line x1="0" y1="${y * G}" x2="${C * G}" y2="${y * G}" class="geo-gl"/>`; }
    return g;
  };
  const pts = (Q) => Q.map((p) => `${X(p[0])},${X(p[1])}`).join(" ");
  const figSVG = (an) => {
    const n = P.length, c = centre(P), ok = an.pr;
    let g = "";
    if (voir.miroir) {
      const M = P.map(([x, y]) => [2 * axeX - x, y]), cm = centre(M);
      g += `<line x1="${X(axeX)}" y1="0" x2="${X(axeX)}" y2="${R * G}" class="fg-axe-m"/><polygon points="${pts(M)}" class="fg-poly-m"/>`;
      M.forEach((p, i) => { const d = dist2(p, cm) || 1; g += `<text x="${X(p[0] + (p[0] - cm[0]) / d * 0.5)}" y="${X(p[1] + (p[1] - cm[1]) / d * 0.5)}" class="fg-lettre m">${LETTRES[i]}'</text>`; });
      g += `<g data-axe="1" class="fg-poignee-axe"><circle cx="${X(axeX)}" cy="${X(R - 0.55)}" r="26" class="fg-hit"/><circle cx="${X(axeX)}" cy="${X(R - 0.55)}" r="17" class="fg-axe-pt"/><text x="${X(axeX)}" y="${X(R - 0.55)}" class="fg-axe-t">⇔</text></g>`;
    }
    if (ok && voir.axes) { const ext = Math.max(...P.map((p) => dist2(p, an.sym.c))) + 0.8; an.sym.axes.forEach(([ux, uy]) => { const [cx, cy] = an.sym.c; g += `<line x1="${X(cx - ux * ext)}" y1="${X(cy - uy * ext)}" x2="${X(cx + ux * ext)}" y2="${X(cy + uy * ext)}" class="fg-axe"/>`; }); }
    if (voir.diagonales && n > 3) for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) { if (i === 0 && j === n - 1) continue; g += `<line x1="${X(P[i][0])}" y1="${X(P[i][1])}" x2="${X(P[j][0])}" y2="${X(P[j][1])}" class="fg-diag"/>`; }
    g += `<polygon points="${pts(P)}" class="fg-poly ${ok ? "" : "ko"}" data-corps="1"/>`;
    if (ok) {
      const pr = an.pr, cotes = (i) => [P[i], P[(i + 1) % n]];
      if (voir.paralleles) pr.paralleles.forEach(([i, j], k) => { const col = ["#e0556a", "#2f7de1", "#1f8a4c", "#d18a00"][k % 4]; for (const s of [i, j]) { const [a, b] = cotes(s); g += `<line x1="${X(a[0])}" y1="${X(a[1])}" x2="${X(b[0])}" y2="${X(b[1])}" class="fg-par" stroke="${col}"/>`; } });
      if (voir.codage || voir.angles) for (const i of pr.droits) {
        const V = P[i], A = P[(i - 1 + n) % n], B = P[(i + 1) % n], la = dist2(A, V), lb = dist2(B, V), s = Math.min(0.42, 0.3 * Math.min(la, lb));
        const u = [(A[0] - V[0]) / la * s, (A[1] - V[1]) / la * s], w = [(B[0] - V[0]) / lb * s, (B[1] - V[1]) / lb * s];
        g += `<path d="M${X(V[0] + u[0])} ${X(V[1] + u[1])} L${X(V[0] + u[0] + w[0])} ${X(V[1] + u[1] + w[1])} L${X(V[0] + w[0])} ${X(V[1] + w[1])}" class="fg-droit"/>`;
      }
      if (voir.codage) for (let i = 0; i < n; i++) {
        const gi = pr.groupe[i]; if (gi < 0) continue;
        const [a, b] = cotes(i), L = pr.L[i], ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        for (let t = 0; t <= gi; t++) { const o = (t - gi / 2) * 0.16; g += `<line x1="${X(mx + o * ux - 0.17 * uy)}" y1="${X(my + o * uy + 0.17 * ux)}" x2="${X(mx + o * ux + 0.17 * uy)}" y2="${X(my + o * uy - 0.17 * ux)}" class="fg-tick"/>`; }
      }
      if (voir.angles) P.forEach((V, i) => {
        const A = P[(i - 1 + n) % n], B = P[(i + 1) % n], a = pr.ang[i], ta = Math.atan2(A[1] - V[1], A[0] - V[0]), tb = Math.atan2(B[1] - V[1], B[0] - V[0]);
        let d = Math.atan2(Math.sin(tb - ta), Math.cos(tb - ta)); if (a > 180) d -= Math.sign(d) * 2 * Math.PI;
        const r = Math.min(0.62, 0.35 * Math.min(dist2(A, V), dist2(B, V))), bis = ta + d / 2, rl = r + 0.42;
        if (!pr.droits.includes(i)) g += `<polyline points="${Array.from({ length: 17 }, (_, k) => `${X(V[0] + r * Math.cos(ta + d * k / 16))},${X(V[1] + r * Math.sin(ta + d * k / 16))}`).join(" ")}" class="fg-arc"/>`;
        g += `<text x="${X(V[0] + rl * Math.cos(bis))}" y="${X(V[1] + rl * Math.sin(bis))}" class="fg-ang">${Math.round(pr.droits.includes(i) ? 90 : a)}°</text>`;
      });
      if (voir.longueurs) for (let i = 0; i < n; i++) {
        const [a, b] = cotes(i), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, L = pr.L[i];
        let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L; if (nx * (mx - c[0]) + ny * (my - c[1]) < 0) { nx = -nx; ny = -ny; }
        g += `<text x="${X(mx + nx * 0.42)}" y="${X(my + ny * 0.42)}" class="fg-long">${virg(L)}</text>`;
      }
    }
    // poignée de rotation, au-dessus de la figure
    const ext = Math.max(...P.map((p) => dist2(p, c))), hy = Math.max(0.5, c[1] - ext - 0.75), rot = act?.k === "tourne" ? act.deg : null;
    g += `<line x1="${X(c[0])}" y1="${X(Math.min(...P.map((p) => p[1])))}" x2="${X(c[0])}" y2="${X(hy)}" class="fg-tige"/><g data-tourne="1" class="fg-poignee"><circle cx="${X(c[0])}" cy="${X(hy)}" r="28" class="fg-hit"/><circle cx="${X(c[0])}" cy="${X(hy)}" r="17" class="fg-rot"/><text x="${X(c[0])}" y="${X(hy)}" class="fg-rot-t">↻</text></g>`;
    if (rot != null) g += `<text x="${X(c[0]) + 30}" y="${X(hy)}" class="fg-rot-deg">${rot > 0 ? "+" : ""}${rot}°</text>`;
    P.forEach((p, i) => {
      const d = dist2(p, c) || 1;
      g += `<g data-v="${i}" class="fg-sommet ${i === sel ? "sel" : ""}"><circle cx="${X(p[0])}" cy="${X(p[1])}" r="30" class="fg-hit"/><circle cx="${X(p[0])}" cy="${X(p[1])}" r="11" class="fg-pt"/></g>
        <text x="${X(p[0] + (p[0] - c[0]) / d * 0.55)}" y="${X(p[1] + (p[1] - c[1]) / d * 0.55)}" class="fg-lettre">${LETTRES[i]}</text>`;
    });
    return g;
  };
  const nomCote = (i) => LETTRES[i] + LETTRES[(i + 1) % P.length];
  const infoHTML = (an) => {
    if (an.plat) return `<p class="fg-nom ko">Deux sommets sont l'un sur l'autre.</p><p class="muted">Écarte-les ou retire un sommet.</p>`;
    if (an.croise) return `<p class="fg-nom ko">Des côtés se croisent : ce n'est plus un polygone.</p><p class="muted">Déplace un sommet pour démêler la figure.</p>`;
    const pr = an.pr, n = pr.n, li = [`${n} côtés et ${n} sommets`];
    if (des(niv, "CE1")) li.push(pr.droits.length ? `${pr.droits.length === 1 ? "1 angle droit" : `${pr.droits.length} angles droits`} : ${pr.droits.map((i) => LETTRES[i]).join(", ")}` : "aucun angle droit");
    pr.groupes.forEach((g) => li.push(g.length === n ? `tous les côtés ont la même longueur` : `côtés de même longueur : ${g.map(nomCote).join(" = ")}`));
    if (des(niv, "CM1") || voir.paralleles) li.push(pr.paralleles.length ? pr.paralleles.map(([i, j]) => `[${nomCote(i)}] et [${nomCote(j)}] sont parallèles`).join(" ; ") : "aucun côté parallèle à un autre");
    if (pr.diag && (des(niv, "CM1") || voir.diagonales)) { const d = []; if (pr.diag.egales) d.push("de même longueur"); if (pr.diag.perp) d.push("perpendiculaires"); if (pr.diag.milieu) d.push("qui se coupent en leur milieu"); li.push(d.length ? `diagonales ${d.join(", ")}` : "diagonales sans propriété particulière"); }
    if (des(niv, "CE2") || voir.axes || voir.miroir) { const k = an.sym.axes.length; li.push(k ? `${k} axe${k > 1 ? "s" : ""} de symétrie` : "pas d'axe de symétrie"); }
    if (!pr.convexe && des(niv, "CM1")) li.push("un angle « rentrant » : polygone non convexe");
    if (voir.mesures) { const per = pr.L.reduce((s, x) => s + x, 0), exact = P.every(([x, y]) => Number.isInteger(x) && Number.isInteger(y)); li.push(`périmètre ${exact && pr.L.every(Number.isInteger) ? "" : "≈ "}${virg(per)} carreaux`, `aire ${exact ? "" : "≈ "}${virg(pr.aire)} carreaux`); }
    return `<p class="fg-nom">${nomFigure(pr, niv)}</p><ul class="fg-props">${li.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  };
  const maj = () => {
    const an = analyser(P), f = el.querySelector("#fg-fig"), i = el.querySelector("#fg-info");
    if (f) f.innerHTML = figSVG(an); if (i) i.innerHTML = infoHTML(an);
  };
  const render = () => {
    const an = analyser(P);
    el.innerHTML = `<div class="tool-top">${segNiveau(niv)}</div>
      <div class="fg rc-board">
        <svg class="fg-svg" id="fg-svg" viewBox="${-G * 0.3} ${-G * 0.3} ${C * G + G * 0.6} ${R * G + G * 0.6}" role="img" aria-label="Figure à manipuler"><g>${fondSVG()}</g><g id="fg-fig">${figSVG(an)}</g></svg>
        <div class="fg-panneau">
          <div class="fg-ligne"><select id="fg-dep" aria-label="Figure de départ">${DEPARTS.map(([k, v]) => `<option value="${k}" ${k === dep ? "selected" : ""}>${v}</option>`).join("")}</select><button class="geo-tb" id="fg-reset" title="Recommencer avec cette figure">🔄</button></div>
          <div id="fg-info" class="fg-info" aria-live="polite">${infoHTML(an)}</div>
          <div class="fg-ligne">${dispoVoir().map(([k, v]) => `<button class="geo-tb fg-voir ${voir[k] ? "on" : ""}" data-voir="${k}">${v}</button>`).join("")}</div>
          <div class="fg-ligne fg-actions">
            <button class="geo-tb" data-fg="g" title="Tourner de 15° vers la gauche" aria-label="Tourner vers la gauche">↺</button><button class="geo-tb" data-fg="d" title="Tourner de 15° vers la droite" aria-label="Tourner vers la droite">↻</button>
            <button class="geo-tb" data-fg="plus" title="Agrandir" aria-label="Agrandir">➕🔍</button><button class="geo-tb" data-fg="moins" title="Réduire" aria-label="Réduire">➖🔍</button>
            <button class="geo-tb" data-fg="miroir" title="Retourner la figure" aria-label="Retourner">⇋</button>
            <button class="geo-tb" data-fg="ajout" title="Ajouter un sommet">+ sommet</button><button class="geo-tb" data-fg="retrait" title="Retirer un sommet" ${P.length <= 3 ? "disabled" : ""}>− sommet</button>
            <button class="geo-tb" data-fg="annuler" ${hist.length ? "" : "disabled"}>↶ Annuler</button>
          </div>
          <div class="fg-ligne"><button class="geo-tb ${aimant ? "on" : ""}" data-fg="aimant" title="Les sommets se posent sur les nœuds du quadrillage">🧲 Aimant</button>
            <select id="fg-grille" aria-label="Fond"><option value="carreaux" ${grille === "carreaux" ? "selected" : ""}>Carreaux</option><option value="points" ${grille === "points" ? "selected" : ""}>Points</option><option value="blanc" ${grille === "blanc" ? "selected" : ""}>Blanc</option></select></div>
          <p class="muted fg-aide">Fais glisser un sommet, la figure entière, ou la pastille ↻ pour la faire tourner.${voir.mesures ? " Longueurs en carreaux." : ""}</p>
        </div>
      </div>`;
  };
  const majBoutons = () => { const a = el.querySelector('[data-fg="annuler"]'); if (a) a.disabled = !hist.length; const r = el.querySelector('[data-fg="retrait"]'); if (r) r.disabled = P.length <= 3; };

  el.onpointerdown = (e) => {
    const svg = el.querySelector("#fg-svg"); if (!svg || !svg.contains(e.target)) return;
    const v = e.target.closest("[data-v]"), tr = e.target.closest("[data-tourne]"), ax = e.target.closest("[data-axe]"), co = e.target.closest("[data-corps]");
    if (!v && !tr && !ax && !co) return;
    e.preventDefault(); try { svg.setPointerCapture(e.pointerId); } catch {}
    const p = pt(e), P0 = P.map((q) => [...q]);
    if (ax) act = { k: "axe" };
    else { garder(); majBoutons(); }
    if (v) { const i = +v.dataset.v; sel = i; act = { k: "sommet", i, off: [P[i][0] - p[0], P[i][1] - p[1]], P0 }; }
    else if (tr) { const c = pivot(); act = { k: "tourne", c, a0: Math.atan2(p[1] - c[1], p[0] - c[0]), P0, deg: 0 }; }
    else if (co) act = { k: "glisse", p0: p, P0 };
    maj();
  };
  el.onpointermove = (e) => {
    if (!act) return;
    e.preventDefault();
    const p = pt(e);
    if (act.k === "sommet") { P[act.i] = [Math.max(0, Math.min(C, snap(p[0] + act.off[0]))), Math.max(0, Math.min(R, snap(p[1] + act.off[1])))]; }
    else if (act.k === "glisse") {
      const xs = act.P0.map((q) => q[0]), ys = act.P0.map((q) => q[1]);
      let dx = snap(p[0] - act.p0[0]), dy = snap(p[1] - act.p0[1]);
      dx = Math.max(-Math.min(...xs), Math.min(C - Math.max(...xs), dx)); dy = Math.max(-Math.min(...ys), Math.min(R - Math.max(...ys), dy));
      if (aimant) { dx = dx < 0 ? Math.ceil(dx) : Math.floor(dx); dy = dy < 0 ? Math.ceil(dy) : Math.floor(dy); }
      P = act.P0.map(([x, y]) => [x + dx, y + dy]);
    }
    else if (act.k === "tourne") {
      let d = Math.atan2(p[1] - act.c[1], p[0] - act.c[0]) - act.a0; d = Math.atan2(Math.sin(d), Math.cos(d));
      const deg = aimant ? Math.round(d / RAD / 15) * 15 : Math.round(d / RAD);
      const Q = tourne(act.P0, act.c, deg * RAD); if (dedans(Q)) { P = Q; act.deg = deg; }
    }
    else if (act.k === "axe") axeX = Math.max(0.5, Math.min(C - 0.5, aimant ? Math.round(p[0] * 2) / 2 : p[0]));
    maj();
  };
  el.onpointerup = el.onpointercancel = () => { if (!act) return; act = null; maj(); };
  el.onclick = (e) => {
    if (surNiveau(e, (n) => { niv = n; if (voir.mesures && !des(niv, "CM1")) voir.mesures = false; render(); })) return;
    const t = e.target.closest("button"); if (!t || t.disabled) return;
    const d = t.dataset;
    if (d.voir) {
      voir[d.voir] = !voir[d.voir];
      if (d.voir === "miroir" && voir.miroir) { // place l'axe à droite de la figure, ou décale la figure à gauche
        const xs = P.map((p) => p[0]), x1 = Math.max(...xs), w = x1 - Math.min(...xs);
        if (x1 + 1 <= C / 2 + 1) axeX = Math.ceil(x1) + 1; else if (w <= C / 2 - 1) { garder(); const dx = Math.floor(C / 2 - 1 - x1); P = P.map(([x, y]) => [x + dx, y]); axeX = C / 2; } else axeX = C / 2;
      }
    }
    else if (t.id === "fg-reset") { garder(); P = DEPARTS.find((x) => x[0] === dep)[2](); sel = -1; }
    else if (d.fg === "aimant") aimant = !aimant;
    else if (d.fg === "annuler") { if (hist.length) P = hist.pop(); sel = -1; }
    else if (d.fg === "g" || d.fg === "d") { const Q = recadrer(tourne(P, pivot(), (d.fg === "g" ? -15 : 15) * RAD)); if (Q) { garder(); P = Q; } }
    else if (d.fg === "plus" || d.fg === "moins") {
      const k = d.fg === "plus" ? 1.25 : 0.8, c = pivot(), Q = P.map(([x, y]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k]);
      const pr = proprietes(Q), R2 = recadrer(Q);
      if (R2 && Math.min(...pr.L) >= 0.5) { garder(); P = R2; }
    }
    else if (d.fg === "miroir") { const cx = pivot()[0]; garder(); P = P.map(([x, y]) => [2 * cx - x, y]).reverse(); sel = -1; }
    else if (d.fg === "ajout") {
      const n = P.length; let i = sel; if (i < 0) { let m = -1; for (let k = 0; k < n; k++) { const l = dist2(P[k], P[(k + 1) % n]); if (l > m) { m = l; i = k; } } }
      const a = P[i], b = P[(i + 1) % n], c = centre(P), L = dist2(a, b), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L; if (nx * (mx - c[0]) + ny * (my - c[1]) < 0) { nx = -nx; ny = -ny; }
      const q = [Math.max(0, Math.min(C, snap(mx + nx))), Math.max(0, Math.min(R, snap(my + ny)))];
      garder(); P.splice(i + 1, 0, q); sel = i + 1;
    }
    else if (d.fg === "retrait" && P.length > 3) { garder(); P.splice(sel >= 0 ? sel : P.length - 1, 1); sel = -1; }
    else return;
    render();
  };
  el.onchange = (e) => {
    if (e.target.id === "fg-dep") { dep = e.target.value; garder(); P = DEPARTS.find((x) => x[0] === dep)[2](); sel = -1; render(); }
    else if (e.target.id === "fg-grille") { grille = e.target.value; render(); }
  };
  render();
  return () => { act = null; };
}

// =====================================================================
// 3. LES SOLIDES
// Modèles 3D (y vers le haut). Les nombres de faces, arêtes et sommets sont calculés à partir du modèle.
// =====================================================================
// niv : niveau à partir duquel le solide est proposé. court : nom dans les quiz avant le CM.
const SOLIDES = [
  { id: "cube", de: "du cube", nom: "cube", court: "cube", niv: "CP", roule: false, poly: true, teinte: 215, faces: "6 faces carrées" },
  { id: "pave", de: "du pavé droit", nom: "pavé droit", court: "pavé droit", niv: "CP", roule: false, poly: true, teinte: 30, faces: "6 faces rectangulaires" },
  { id: "boule", de: "de la boule", nom: "boule", court: "boule", niv: "CP", roule: true, poly: false, teinte: 345, desc: "Une boule n'a qu'une surface courbe : pas de face plane, pas d'arête, pas de sommet." },
  { id: "cone", de: "du cône", nom: "cône", court: "cône", niv: "CE1", roule: true, poly: false, teinte: 45, desc: "Un cône a une face plane (un disque), une surface courbe et un sommet (sa pointe). Ce n'est pas un polyèdre." },
  { id: "pyr4", de: "de la pyramide à base carrée", nom: "pyramide à base carrée", court: "pyramide", niv: "CE1", roule: false, poly: true, teinte: 280, faces: "1 base carrée et 4 faces triangulaires" },
  { id: "cylindre", de: "du cylindre", nom: "cylindre", court: "cylindre", niv: "CE2", roule: true, poly: false, teinte: 160, desc: "Un cylindre a deux faces planes (deux disques superposables) et une surface courbe. Il n'a pas de sommet. Ce n'est pas un polyèdre." },
  { id: "prisme3", de: "du prisme droit à base triangulaire", nom: "prisme droit à base triangulaire", court: "prisme droit", niv: "CM1", roule: false, poly: true, teinte: 120, faces: "2 bases triangulaires et 3 faces rectangulaires" },
  { id: "prisme6", de: "du prisme droit à base hexagonale", nom: "prisme droit à base hexagonale", court: "prisme droit", niv: "CM1", roule: false, poly: true, teinte: 190, faces: "2 bases hexagonales et 6 faces rectangulaires" },
  { id: "tetra", de: "de la pyramide à base triangulaire", nom: "pyramide à base triangulaire", court: "pyramide", niv: "CM1", roule: false, poly: true, teinte: 0, faces: "4 faces triangulaires (c'est aussi un tétraèdre)" },
  { id: "prisme5", de: "du prisme droit à base pentagonale", nom: "prisme droit à base pentagonale", court: "prisme droit", niv: "CM2", roule: false, poly: true, teinte: 95, faces: "2 bases pentagonales et 5 faces rectangulaires" },
  { id: "pyr6", de: "de la pyramide à base hexagonale", nom: "pyramide à base hexagonale", court: "pyramide", niv: "CM2", roule: false, poly: true, teinte: 320, faces: "1 base hexagonale et 6 faces triangulaires" },
];
// Ce que l'on compte et les questions de quiz, par niveau.
const COMPTER = { CP: ["faces"], CE1: ["faces", "aretes", "sommets"], CE2: ["faces", "aretes", "sommets"], CM1: ["faces", "aretes", "sommets"], CM2: ["faces", "aretes", "sommets"] };
const QUIZ_SOL = { CP: ["nom", "nom", "roule", "faces"], CE1: ["nom", "roule", "faces", "sommets", "aretes"], CE2: ["nom", "nom", "faces", "sommets", "aretes"], CM1: ["nom", "faces", "sommets", "aretes", "poly"], CM2: ["nom", "faces", "sommets", "aretes", "poly"] };
// Patrons : solides proposés au pliage, par niveau (patron du cube au CE2 ; reconnaître celui du pavé au CM2).
// Avant le CE2, plier et déplier le cube et le pavé sert de manipulation (comme une boîte en carton).
// Depuis « Explorer », le bouton Déplier ouvre le patron du solide affiché, quel que soit le niveau.
const PATRONS_NIV = {
  CP: ["cube", "pave"], CE1: ["cube", "pave", "pyr4"], CE2: ["cube", "pave", "pyr4", "cylindre"],
  CM1: ["cube", "pave", "pyr4", "prisme3", "prisme6", "tetra", "cylindre", "cone"],
  CM2: ["cube", "pave", "prisme3", "prisme5", "prisme6", "pyr4", "tetra", "pyr6", "cylindre", "cone"],
};
const NOTE_PATRON = {
  cylindre: "La surface courbe du cylindre se déroule : elle devient un rectangle. Les deux bases sont des disques.",
  cone: "La surface courbe du cône se déroule : elle devient une portion de disque. La base est un disque.",
};
const NOMS_COMPTE = { faces: "faces", aretes: "arêtes", sommets: "sommets" };

function boite(a, b, c) {
  const V = []; for (const x of [-a, a]) for (const y of [-b, b]) for (const z of [-c, c]) V.push([x, y, z]);
  return { V, F: [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]] };
}
function prisme(n, r, h, a0 = 90, lisse = false) {
  const V = []; for (const y of [-h / 2, h / 2]) for (let i = 0; i < n; i++) { const a = (a0 + 360 * i / n) * RAD; V.push([r * Math.cos(a), y, r * Math.sin(a)]); }
  const F = [[...Array(n).keys()], Array.from({ length: n }, (_, i) => n + i)], L = new Set();
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; if (lisse) L.add(F.length); F.push([i, j, n + j, n + i]); }
  return { V, F, lisse: L };
}
function pyramide(n, r, h, a0 = 90, lisse = false) {
  const V = []; for (let i = 0; i < n; i++) { const a = (a0 + 360 * i / n) * RAD; V.push([r * Math.cos(a), -h / 2, r * Math.sin(a)]); } V.push([0, h / 2, 0]);
  const F = [[...Array(n).keys()]], L = new Set();
  for (let i = 0; i < n; i++) { if (lisse) L.add(F.length); F.push([i, (i + 1) % n, n]); }
  return { V, F, lisse: L };
}
const sous = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const croix = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norme = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const moy = (P) => P.reduce((s, p) => [s[0] + p[0] / P.length, s[1] + p[1] / P.length, s[2] + p[2] / P.length], [0, 0, 0]);
function newell(P) { const n = [0, 0, 0]; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]); } return norme(n); }
function completer(m) {
  m.lisse ||= new Set();
  const c = moy(m.V);
  m.N = m.F.map((f) => { const P = f.map((i) => m.V[i]), n = newell(P); return dot(n, sous(moy(P), c)) < 0 ? n.map((x) => -x) : n; });
  const E = new Map();
  m.F.forEach((f, fi) => f.forEach((a, k) => { const b = f[(k + 1) % f.length], key = a < b ? `${a}-${b}` : `${b}-${a}`; if (!E.has(key)) E.set(key, { a: Math.min(a, b), b: Math.max(a, b), f: [] }); E.get(key).f.push(fi); }));
  m.E = [...E.values()].map((e) => ({ ...e, lisse: e.f.every((fi) => m.lisse.has(fi)) }));
  return m;
}
const MODELES = {
  cube: () => boite(1, 1, 1), pave: () => boite(1.55, 0.75, 0.95),
  cylindre: () => prisme(48, 1, 2.1, 90, true), cone: () => pyramide(48, 1.1, 2.1, 90, true),
  pyr4: () => pyramide(4, 1.35, 1.8, 45), prisme3: () => prisme(3, 1.05, 2.1, 90), prisme6: () => prisme(6, 1.05, 1.9, 0), prisme5: () => prisme(5, 1.05, 1.9, 90),
  tetra: () => pyramide(3, 1.25, 1.25 * Math.SQRT2, 90), pyr6: () => pyramide(6, 1.2, 1.9, 0), boule: () => ({ V: [], F: [], boule: true }),
};
const cacheM = {};
const modele3D = (id) => (cacheM[id] ||= completer(MODELES[id]()));
const comptes = (id) => { const m = modele3D(id); return { faces: m.F.length, aretes: m.E.length, sommets: m.V.length }; };

const D = 9;
function tourner([x, y, z], yaw, pitch) { const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch); const x1 = x * cy + z * sy, z1 = -x * sy + z * cy; return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; }
const projeter = ([x, y, z], W, H, K) => { const f = D / (D - z); return [W / 2 + x * f * K, H / 2 - y * f * K]; };
const vers = (Q) => Q.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ");

// Dessin d'un solide. surl : { type, k } pour le comptage (k éléments déjà montrés).
function dessinSolide(id, yaw, pitch, W, H, K, opt = {}) {
  const sol = SOLIDES.find((s) => s.id === id), hue = sol.teinte;
  if (id === "boule") {
    const R = 1.4 * K * D / Math.sqrt(D * D - 1.96), cx = W / 2, cy = H / 2;
    const eq = arc(0, 0, 1.4, 0, 360, 72).map(([x, z]) => tourner([x, 0, z], yaw, pitch)), me = arc(0, 0, 1.4, 0, 360, 72).map(([x, y]) => tourner([x, y, 0], yaw, pitch));
    const trace = (pts) => { let av = "", ar = ""; for (let i = 0; i < pts.length - 1; i++) { const a = projeter(pts[i], W, H, K), b = projeter(pts[i + 1], W, H, K), s = `M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}`; if (pts[i][2] + pts[i + 1][2] >= 0) av += s; else ar += s; } return `<path d="${ar}" class="geo-ar-cachee"/><path d="${av}" class="geo-ar-lisse"/>`; };
    return `<defs><radialGradient id="geo-bg" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="hsl(${hue} 90% 92%)"/><stop offset=".55" stop-color="hsl(${hue} 70% 72%)"/><stop offset="1" stop-color="hsl(${hue} 55% 48%)"/></radialGradient></defs>
      <circle cx="${cx}" cy="${cy}" r="${f1(R)}" fill="url(#geo-bg)" class="geo-ar"/>${opt.cachees !== false ? trace(eq) + trace(me) : ""}`;
  }
  const m = modele3D(id), V = m.V.map((p) => tourner(p, yaw, pitch)), P = V.map((p) => projeter(p, W, H, K));
  const eye = [0, 0, D], lum = norme([-0.45, 0.75, 0.6]);
  const vis = m.F.map((f, fi) => { const n = tourner(m.N[fi], yaw, pitch); return { n, v: dot(n, sous(eye, V[f[0]])) > 0 }; });
  let g = "";
  m.F.forEach((f, fi) => { if (!vis[fi].v) return; const l = Math.max(0, dot(vis[fi].n, lum)), L = 52 + 34 * l, fill = `hsl(${hue} 65% ${f1(L)}%)`; g += `<polygon points="${vers(f.map((i) => P[i]))}" fill="${fill}" stroke="${m.lisse.has(fi) ? fill : "none"}" class="geo-face"/>`; });
  const hl = opt.hl, arCache = [], arVue = [];
  m.E.forEach((e, ei) => {
    const front = e.f.map((fi) => vis[fi].v), d = `M${f1(P[e.a][0])} ${f1(P[e.a][1])}L${f1(P[e.b][0])} ${f1(P[e.b][1])}`;
    if (e.lisse) { if (front[0] !== front[1]) arVue.push(`<path d="${d}" class="geo-ar"/>`); return; }
    if (front.some(Boolean)) arVue.push(`<path d="${d}" class="geo-ar"/>`); else if (opt.cachees !== false) arCache.push(`<path d="${d}" class="geo-ar-cachee"/>`);
  });
  g += arCache.join("") + arVue.join("");
  if (hl && hl.k > 0) {
    if (hl.type === "faces") m.F.slice(0, hl.k).forEach((f, fi) => { const Q = f.map((i) => P[i]), c = Q.reduce((s, p) => [s[0] + p[0] / Q.length, s[1] + p[1] / Q.length], [0, 0]), cur = fi === hl.k - 1; g += `<polygon points="${vers(Q)}" class="geo-hl-face ${cur ? "cur" : ""} ${vis[fi].v ? "" : "cachee"}"/><text x="${f1(c[0])}" y="${f1(c[1])}" class="geo-hl-n ${vis[fi].v ? "" : "cachee"}">${fi + 1}</text>`; });
    if (hl.type === "aretes") m.E.slice(0, hl.k).forEach((e, ei) => { const a = P[e.a], b = P[e.b]; g += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" class="geo-hl-ar ${ei === hl.k - 1 ? "cur" : ""}"/>`; });
    if (hl.type === "sommets") P.slice(0, hl.k).forEach((p, i) => { g += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${i === hl.k - 1 ? 11 : 8}" class="geo-hl-som"/><text x="${f1(p[0])}" y="${f1(p[1] - 14)}" class="geo-hl-n">${i + 1}</text>`; });
  }
  return g;
}

// ---------- Patrons et pliage ----------
// Une face du patron : pts (plan), parent, charnière [A, B] et angle de pliage (degrés).
function attacher(faces, pi, k, local, ang) {
  const par = faces[pi], A = par.pts[k], B = par.pts[(k + 1) % par.pts.length], Lg = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const u = [(B[0] - A[0]) / Lg, (B[1] - A[1]) / Lg], c = par.pts.reduce((s, p) => [s[0] + p[0] / par.pts.length, s[1] + p[1] / par.pts.length], [0, 0]);
  let v = [-u[1], u[0]]; if (v[0] * (c[0] - A[0]) + v[1] * (c[1] - A[1]) > 0) v = [-v[0], -v[1]];
  faces.push({ pts: local.map(([x, y]) => [A[0] + x * u[0] + y * v[0], A[1] + x * u[1] + y * v[1]]), parent: pi, charniere: [A, B], ang });
  return faces.length - 1;
}
const rectL = (l, h) => [[0, 0], [l, 0], [l, h], [0, h]];
const triL = (l, h) => [[0, 0], [l, 0], [l / 2, h]];
// Patron obtenu en « dépliant » un modèle 3D le long d'un arbre de faces (par[i] = face parente de la face i, -1 pour la racine).
// La racine est posée à plat, face extérieure vers le bas (z < 0) ; chaque face fille est rabattue dans le plan autour
// de l'arête qu'elle partage avec sa mère. L'angle de pliage est l'angle entre les normales extérieures des deux faces.
// fines[k] : l'arête k de la face est une charnière entre deux morceaux d'une surface courbe (dessinée sans trait).
function deplier(m, par) {
  const n = m.F.length, out = [], ou = new Array(n).fill(-1), pos = new Array(n), racine = par.indexOf(-1), file = [racine];
  {
    const f = m.F[racine], P = f.map((i) => m.V[i]), ex = norme(sous(P[1], P[0])), ey = croix(m.N[racine].map((x) => -x), ex);
    pos[racine] = new Map(f.map((i, k) => { const d = sous(P[k], P[0]); return [i, [dot(d, ex), dot(d, ey)]]; }));
    ou[racine] = 0; out.push({ pts: f.map((i) => pos[racine].get(i)), parent: -1, ids: f, lisse: m.lisse.has(racine) });
  }
  while (file.length) {
    const p = file.shift(), cp = centre(out[ou[p]].pts);
    for (let c = 0; c < n; c++) {
      if (par[c] !== p) continue;
      const fc = m.F[c], [a, b] = fc.filter((i) => m.F[p].includes(i)), A2 = pos[p].get(a), B2 = pos[p].get(b), Va = m.V[a], e = norme(sous(m.V[b], Va));
      const Lg = dist2(A2, B2), u = [(B2[0] - A2[0]) / Lg, (B2[1] - A2[1]) / Lg];
      let v = [-u[1], u[0]]; if (v[0] * (cp[0] - A2[0]) + v[1] * (cp[1] - A2[1]) > 0) v = [-v[0], -v[1]];
      pos[c] = new Map(fc.map((i) => { const d = sous(m.V[i], Va), al = dot(d, e), h = Math.hypot(...sous(d, e.map((x) => x * al))); return [i, [A2[0] + al * u[0] + h * v[0], A2[1] + al * u[1] + h * v[1]]]; }));
      ou[c] = out.length;
      out.push({ pts: fc.map((i) => pos[c].get(i)), parent: ou[p], charniere: [A2, B2], ang: Math.acos(Math.max(-1, Math.min(1, dot(m.N[p], m.N[c])))) / RAD, ids: fc, lisse: m.lisse.has(c), arete: [a, b] });
      file.push(c);
    }
  }
  // charnières à l'intérieur d'une surface courbe : pas de trait
  out.forEach((f) => (f.fines = f.ids.map(() => false)));
  out.forEach((f) => {
    if (f.parent < 0 || !f.lisse || !out[f.parent].lisse) return;
    for (const g of [f, out[f.parent]]) g.ids.forEach((i, k) => { const j = g.ids[(k + 1) % g.ids.length]; if (f.arete.includes(i) && f.arete.includes(j)) g.fines[k] = true; });
  });
  return out;
}
// Arbres de dépliage : faces latérales en bande (à partir du milieu), bases accrochées à la face du milieu.
const arbrePrisme = (n) => { const r = 2 + Math.floor((n - 1) / 2), par = [r, r]; for (let k = 2; k < n + 2; k++) par.push(k === r ? -1 : k > r ? k - 1 : k + 1); return par; };
// Pyramide : faces triangulaires autour de la base ; cône : triangles en éventail (la surface courbe déroulée), base accrochée au milieu.
const arbrePyramide = (n, eventail = false) => { if (!eventail) return [-1, ...Array(n).fill(0)]; const r = 1 + Math.floor(n / 2), par = [r]; for (let k = 1; k <= n; k++) par.push(k === r ? -1 : k > r ? k - 1 : k + 1); return par; };
const PATRONS = {
  prisme5: () => deplier(modele3D("prisme5"), arbrePrisme(5)), prisme6: () => deplier(modele3D("prisme6"), arbrePrisme(6)),
  pyr6: () => deplier(modele3D("pyr6"), arbrePyramide(6)), cylindre: () => deplier(modele3D("cylindre"), arbrePrisme(48)),
  cone: () => deplier(modele3D("cone"), arbrePyramide(48, true)),
  cube: () => { const F = [{ pts: rectL(1, 1), parent: -1 }]; for (let k = 0; k < 4; k++) attacher(F, 0, k, rectL(1, 1), 90); attacher(F, 3, 2, rectL(1, 1), 90); return F; },
  pave: () => { const a = 2, b = 1.2, c = 0.8, F = [{ pts: rectL(a, b), parent: -1 }]; attacher(F, 0, 0, rectL(a, c), 90); attacher(F, 0, 1, rectL(b, c), 90); const dos = attacher(F, 0, 2, rectL(a, c), 90); attacher(F, 0, 3, rectL(b, c), 90); attacher(F, dos, 2, rectL(a, b), 90); return F; },
  pyr4: () => { const h = 1.6, s = Math.hypot(h, 1), ang = 180 - Math.atan2(h, 1) / RAD, F = [{ pts: rectL(2, 2), parent: -1 }]; for (let k = 0; k < 4; k++) attacher(F, 0, k, triL(2, s), ang); return F; },
  tetra: () => { const F = [{ pts: [[0, 0], [2, 0], [1, Math.sqrt(3)]], parent: -1 }], ang = 180 - Math.acos(1 / 3) / RAD; for (let k = 0; k < 3; k++) attacher(F, 0, k, triL(2, Math.sqrt(3)), ang); return F; },
  prisme3: () => { const s = 1.3, H = 2, F = [{ pts: rectL(s, H), parent: -1 }]; attacher(F, 0, 1, rectL(H, s), 120); attacher(F, 0, 3, rectL(H, s), 120); attacher(F, 0, 0, triL(s, s * Math.sqrt(3) / 2), 90); attacher(F, 0, 2, triL(s, s * Math.sqrt(3) / 2), 90); return F; },
};
// Patron fait de carrés (polyomino) : arbre de pliage par parcours en largeur, charnières à 90°.
function patronCarres(cells) {
  const F = [], idx = new Map(), file = [0];
  const sq = ([x, y]) => [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]];
  F.push({ pts: sq(cells[0]), parent: -1, cell: cells[0] }); idx.set(cle(cells[0]), 0);
  while (file.length) {
    const i = file.shift(), [x, y] = F[i].cell;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = [x + dx, y + dy], k = cle(nc); if (idx.has(k) || !cells.some((c) => cle(c) === k)) continue;
      const A = dx === 1 ? [x + 1, y] : dx === -1 ? [x, y] : dy === 1 ? [x, y + 1] : [x, y], B = dx !== 0 ? [A[0], A[1] + 1] : [A[0] + 1, A[1]];
      F.push({ pts: sq(nc), parent: i, charniere: [A, B], ang: 90, cell: nc }); idx.set(k, F.length - 1); file.push(F.length - 1);
    }
  }
  return F;
}
const matMul = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
const matVec = (M, v) => M.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
function rotAxe(P, d, th) {
  const [x, y, z] = d, c = Math.cos(th), s = Math.sin(th), t = 1 - c;
  const R = [[t * x * x + c, t * x * y - s * z, t * x * z + s * y], [t * x * y + s * z, t * y * y + c, t * y * z - s * x], [t * x * z - s * y, t * y * z + s * x, t * z * z + c]];
  const RP = matVec(R, P); return { R, t: [P[0] - RP[0], P[1] - RP[1], P[2] - RP[2]] };
}
const compose = (M1, M2) => ({ R: matMul(M1.R, M2.R), t: (() => { const v = matVec(M1.R, M2.t); return [v[0] + M1.t[0], v[1] + M1.t[1], v[2] + M1.t[2]]; })() });
const appliquer = (M, p) => { const v = matVec(M.R, p); return [v[0] + M.t[0], v[1] + M.t[1], v[2] + M.t[2]]; };
// Plie le patron (t de 0 à 1). Renvoie pour chaque face ses points 3D (repère « monde » : y vers le haut) et sa matrice.
function plier(F, t) {
  const M = [];
  return F.map((f, i) => {
    if (f.parent < 0) M[i] = { R: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], t: [0, 0, 0] };
    else {
      const [A, B] = f.charniere, c = f.pts.reduce((s, p) => [s[0] + p[0] / f.pts.length, s[1] + p[1] / f.pts.length], [0, 0]);
      let d = [B[0] - A[0], B[1] - A[1]]; if (d[0] * (c[1] - A[1]) - d[1] * (c[0] - A[0]) < 0) d = [-d[0], -d[1]];
      const l = Math.hypot(...d); M[i] = compose(M[f.parent], rotAxe([A[0], A[1], 0], [d[0] / l, d[1] / l, 0], f.ang * RAD * t));
    }
    // monde : X = x, Y = z (vers le haut), Z = -y
    return { pts: f.pts.map(([x, y]) => { const q = appliquer(M[i], [x, y, 0]); return [q[0], q[2], -q[1]]; }), n: (() => { const q = matVec(M[i].R, [0, 0, -1]); return [q[0], q[2], -q[1]]; })() };
  });
}
function dessinPatron(F, t, yaw, pitch, W, H, hue = 215) {
  const plat = plier(F, 0), plie = plier(F, 1), tout0 = plat.flatMap((f) => f.pts), tout1 = plie.flatMap((f) => f.pts);
  const c0 = moy(tout0), c1 = moy(tout1), c = c0.map((v, i) => v + (c1[i] - v) * t);
  const ext0 = Math.max(...tout0.map((p) => Math.hypot(...sous(p, c0)))), ext1 = Math.max(...tout1.map((p) => Math.hypot(...sous(p, c1)))) * 1.35, K = Math.min(W, H) * 0.44 / (ext0 + (ext1 - ext0) * t);
  const fs = plier(F, t).map((f, i) => { const Q = f.pts.map((p) => tourner(sous(p, c), yaw, pitch)), n = tourner(f.n, yaw, pitch); return { i, Q, z: moy(Q)[2], dehors: dot(n, sous([0, 0, D], moy(Q))) > 0, n }; });
  fs.sort((a, b) => a.z - b.z);
  const lum = norme([-0.45, 0.75, 0.6]);
  return fs.map((f) => {
    const l = Math.abs(dot(f.n, lum)), fill = f.dehors ? `hsl(${hue} 65% ${f1(55 + 25 * l)}%)` : `hsl(${hue} 45% ${f1(86 + 8 * l)}%)`, Q = f.Q.map((p) => projeter(p, W, H, K)), fines = F[f.i].fines;
    if (!fines?.some(Boolean)) return `<polygon points="${vers(Q)}" fill="${fill}" class="geo-pface"/>`;
    // morceau de surface courbe : remplissage sans trait, puis seulement les vrais bords
    return `<polygon points="${vers(Q)}" fill="${fill}" stroke="${fill}" class="geo-pface-lisse"/><path d="${Q.map((p, k) => (fines[k] ? "" : `M${f1(p[0])} ${f1(p[1])}L${f1(Q[(k + 1) % Q.length][0])} ${f1(Q[(k + 1) % Q.length][1])}`)).join("")}" class="geo-pface-bord"/>`;
  }).join("");
}
// Est-ce un patron du cube ? On « fait rouler » un cube sur les carrés : il faut que les 6 carrés touchent 6 faces différentes.
function estPatronCube(cells) {
  if (cells.length !== 6) return false;
  const set = new Set(cells.map(cle)); if (set.size !== 6) return false;
  const vu = new Map([[cle(cells[0]), { b: 0, h: 1, n: 2, s: 3, o: 4, e: 5 }]]), file = [cells[0]];
  while (file.length) {
    const [x, y] = file.shift(), o = vu.get(cle([x, y]));
    const voisins = [[[x + 1, y], { b: o.e, e: o.h, h: o.o, o: o.b, n: o.n, s: o.s }], [[x - 1, y], { b: o.o, o: o.h, h: o.e, e: o.b, n: o.n, s: o.s }], [[x, y + 1], { b: o.s, s: o.h, h: o.n, n: o.b, e: o.e, o: o.o }], [[x, y - 1], { b: o.n, n: o.h, h: o.s, s: o.b, e: o.e, o: o.o }]];
    for (const [c, no] of voisins) { const k = cle(c); if (set.has(k) && !vu.has(k)) { vu.set(k, no); file.push(c); } }
  }
  if (vu.size !== 6) return false;
  return new Set([...vu.values()].map((o) => o.b)).size === 6;
}
const normPoly = (cells) => { const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1])); return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
const SYM = [([x, y]) => [x, y], ([x, y]) => [-y, x], ([x, y]) => [-x, -y], ([x, y]) => [y, -x], ([x, y]) => [-x, y], ([x, y]) => [y, x], ([x, y]) => [x, -y], ([x, y]) => [-y, -x]];
const canon = (cells) => SYM.map((s) => JSON.stringify(normPoly(cells.map(s)))).sort()[0];
// Tous les polyominos libres de taille n (35 hexaminos pour n = 6).
function polyominos(n) {
  let niveau = new Map([[JSON.stringify([[0, 0]]), [[0, 0]]]]);
  for (let k = 1; k < n; k++) {
    const suiv = new Map();
    for (const cells of niveau.values()) { const set = new Set(cells.map(cle)); for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = [x + dx, y + dy]; if (set.has(cle(c))) continue; const nv = normPoly([...cells, c]), key = canon(nv); if (!suiv.has(key)) suiv.set(key, JSON.parse(key)); } }
    niveau = suiv;
  }
  return [...niveau.values()];
}
let HEXA = null;
const hexaminos = () => (HEXA ||= polyominos(6).map((c) => ({ cells: c, ok: estPatronCube(c) })));

function solides(el) {
  let niv = niveauJeux(), mode = "explorer", sid = "cube", yaw = -0.6, pitch = 0.42, auto = false, cachees = true;
  let compte = null, timer = null, raf = null, dragR = null, quiz = null, score = 0, total = 0;
  let pat = "cube", pt = 0, anim = null, net = null, galerie = false;
  const dispo = () => SOLIDES.filter((s) => des(niv, s.niv));
  const patDispo = () => PATRONS_NIV[niv] || [];
  const W = 400, H = 330;
  const stopCompte = () => { clearInterval(timer); timer = null; };
  const nomSolide = (s) => (des(niv, "CM1") ? s.nom : s.court);
  const vueSVG = () => {
    if (mode === "patrons" || (mode === "netcube" && net?.rep != null) || (mode === "netcube" && galerie && net?.voir)) { const F = mode === "patrons" ? PATRONS[pat]() : patronCarres(net.cells); return dessinPatron(F, pt, yaw, pitch, W, H, mode === "patrons" ? SOLIDES.find((s) => s.id === pat).teinte : 200); }
    const id = mode === "quiz" ? quiz.s.id : sid;
    return dessinSolide(id, yaw, pitch, W, H, id === "pave" || id === "prisme6" ? 74 : 82, { cachees, hl: mode === "explorer" ? compte : null });
  };
  const majVue = () => { const g = el.querySelector("#geo-vue"); if (g) g.innerHTML = vueSVG(); };
  const scene = (extra = "") => `<svg class="geo-3d" viewBox="0 0 ${W} ${H}" data-rot="1" role="img" aria-label="Solide à faire tourner"><g id="geo-vue">${vueSVG()}</g></svg>${extra}`;
  const nouvQuiz = () => {
    const types = QUIZ_SOL[niv], polys = dispo().filter((s) => s.poly);
    let type = choix(types); if (["faces", "aretes", "sommets"].includes(type) && !polys.length) type = "nom";
    const pool = ["faces", "aretes", "sommets"].includes(type) ? polys : dispo();
    let s; do { s = choix(pool); } while (quiz && s.id === quiz.s.id && pool.length > 1);
    let q, reps, bonne;
    if (type === "nom") { q = "Quel est ce solide ?"; const noms = [...new Set(dispo().map(nomSolide))]; bonne = nomSolide(s); reps = noms; }
    else if (type === "roule") { q = "Est-ce que ce solide peut rouler ?"; reps = ["Oui, il roule", "Non, il ne roule pas"]; bonne = reps[s.roule ? 0 : 1]; }
    else if (type === "poly") { q = "Ce solide est-il un polyèdre ?"; reps = ["Oui, c'est un polyèdre", "Non, ce n'est pas un polyèdre"]; bonne = reps[s.poly ? 0 : 1]; }
    else { const n = comptes(s.id)[type]; q = `Combien ce solide a-t-il de ${NOMS_COMPTE[type]} ?`; const set = new Set([n]); while (set.size < 4) { const v = n + choix([-3, -2, -1, 1, 2, 3, 4]); if (v > 0) set.add(v); } reps = [...set].sort((a, b) => a - b).map(String); bonne = String(n); }
    quiz = { s, type, q, reps, bonne, faux: new Set(), ok: false };
    yaw = rnd(-Math.PI, Math.PI); pitch = rnd(0.25, 0.6);
  };
  const nouvNet = () => {
    const H6 = hexaminos(), ok = Math.random() < 0.5, pool = H6.filter((h) => h.ok === ok && (ok || Math.max(...h.cells.map((c) => c[0])) <= 3 && Math.max(...h.cells.map((c) => c[1])) <= 3 || Math.random() < 0.15));
    const h = choix(pool.length ? pool : H6), s = choix(SYM);
    net = { cells: normPoly(h.cells.map(s)), ok: h.ok, rep: null }; pt = 0; yaw = -0.5; pitch = 0.95;
  };
  const netSVG = (cells, cls = "") => { const w = Math.max(...cells.map((c) => c[0])) + 1, h = Math.max(...cells.map((c) => c[1])) + 1; return `<svg viewBox="-0.15 -0.15 ${w + 0.3} ${h + 0.3}" class="geo-net ${cls}" aria-hidden="true">${cells.map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1" class="geo-net-c"/>`).join("")}</svg>`; };

  const render = () => {
    const modes = [["explorer", "🔍 Explorer"], ["quiz", "❓ Quiz"]];
    if (patDispo().length) modes.push(["patrons", "📦 Patrons"]);
    if (des(niv, "CE2")) modes.push(["netcube", "🧩 Patron du cube ?"]);
    if (!modes.some(([k]) => k === mode)) mode = "explorer";
    let h = `<div class="tool-top">${segNiveau(niv)}<div class="seg">${modes.map(([k, v]) => `<button data-mode="${k}" class="${mode === k ? "on" : ""}">${v}</button>`).join("")}</div></div>`;
    if (mode === "explorer") {
      if (!dispo().some((s) => s.id === sid)) sid = "cube";
      const s = SOLIDES.find((x) => x.id === sid), c = s.poly ? comptes(sid) : null;
      h += `<div class="tool-top"><div class="seg geo-choix">${dispo().map((x) => `<button data-sol="${x.id}" class="${x.id === sid ? "on" : ""}">${esc(x.nom)}</button>`).join("")}</div>
        <button class="pill ${auto ? "on" : ""}" id="so-auto">${auto ? "⏸️ Arrêter" : "🔄 Tourner tout seul"}</button><button class="pill ${cachees ? "on" : ""}" id="so-cach">${cachees ? "Masquer" : "Montrer"} les arêtes cachées</button></div>
        <div class="geo-sol rc-board">${scene()}
        <div class="geo-info"><h3>${esc(s.nom)}</h3>
          ${des(niv, "CM1") ? `<p class="geo-badge ${s.poly ? "oui" : "non"}">${s.poly ? "C'est un polyèdre" : "Ce n'est pas un polyèdre"}</p>` : ""}
          ${s.poly ? `<div class="geo-cpt">${COMPTER[niv].map((k) => `<button class="geo-tb ${compte?.type === k ? "on" : ""}" data-cpt="${k}">Compter les ${NOMS_COMPTE[k]}</button>`).join("")}</div>
            ${compte ? `<p class="geo-compte">${compte.k} ${NOMS_COMPTE[compte.type]}${compte.k === compte.total ? " : c'est fini !" : "…"}</p>` : `<p class="muted geo-compte-aide">Touche un bouton pour compter.</p>`}
            ${compte && compte.k === compte.total ? `<p class="muted">${COMPTER[niv].map((k) => `${c[k]} ${NOMS_COMPTE[k]}`).join(" • ")}${compte.type === "faces" ? ` — ${s.faces}` : ""}</p>` : ""}`
          : `<p class="geo-desc">${s.desc}</p>`}
          <p class="muted">${s.roule ? "Il peut rouler." : "Il ne roule pas."} Fais-le tourner avec le doigt.</p>
          ${PATRONS[sid] ? `<button class="geo-tb" data-deplier="${sid}">📄 Déplier ${esc(s.de)}</button>` : sid === "boule" ? `<p class="muted">Une boule ne se déplie pas : on ne peut pas l'aplatir sans la déchirer.</p>` : ""}</div></div>`;
    } else if (mode === "quiz") {
      h += `<div class="tool-top"><button class="pill" id="so-next">🎲 Autre question</button><span class="score">⭐ ${score} / ${total}</span></div>
        <div class="geo-sol rc-board">${scene()}<div class="geo-info"><p class="geo-q">${quiz.q}</p>
        <div class="geo-reps">${quiz.reps.map((r) => `<button class="geo-rep ${quiz.ok && r === quiz.bonne ? "good" : quiz.faux.has(r) ? "bad" : ""}" data-rep="${esc(r)}" ${quiz.ok ? "disabled" : ""}>${esc(r)}</button>`).join("")}</div>
        <p class="geo-msg">${quiz.ok ? `<span class="banner ok">Bravo ! 🎉</span> <button class="geo-tb" id="so-next2">Suivant ➜</button>` : quiz.faux.size ? `<span class="banner ko">Non, essaie encore. Tu peux le faire tourner !</span>` : ""}</p></div></div>`;
    } else if (mode === "patrons") {
      if (!PATRONS[pat]) pat = "cube";
      const liste = patDispo().includes(pat) ? patDispo() : [...patDispo(), pat];
      h += `<div class="tool-top"><div class="seg">${liste.map((k) => `<button data-pat="${k}" class="${k === pat ? "on" : ""}">${esc(SOLIDES.find((s) => s.id === k).nom)}</button>`).join("")}</div>
        <label class="inline">Pliage <input type="range" id="so-pt" min="0" max="100" value="${Math.round(pt * 100)}"></label></div>
        <div class="geo-sol rc-board">${scene()}<div class="geo-info"><h3>Patron ${esc(SOLIDES.find((s) => s.id === pat).de)}</h3>
        <div class="geo-cpt"><button class="geo-tb" data-plier="1">📦 Plier</button><button class="geo-tb" data-plier="0">📄 Déplier</button></div>
        <label class="geo-plieur">Plier à la main <input type="range" id="so-pt2" min="0" max="100" value="${Math.round(pt * 100)}" aria-label="Pliage"></label>
        ${NOTE_PATRON[pat] ? `<p class="geo-desc">${NOTE_PATRON[pat]}</p>` : ""}
        <p class="muted">Fais tourner avec le doigt pour regarder sous tous les angles.</p></div></div>`;
    } else {
      if (galerie) {
        const ok = hexaminos().filter((x) => x.ok);
        h += `<div class="tool-top"><button class="pill" id="so-gal">⬅️ Retour au jeu</button></div>
          <div class="geo-sol rc-board"><div class="geo-galerie">${ok.map((x, i) => `<button class="geo-carte" data-gal="${i}" aria-label="Patron ${i + 1}">${netSVG(x.cells)}<small>${i + 1}</small></button>`).join("")}</div>
          ${net?.voir ? scene() : `<p class="geo-q">Voici les 11 patrons du cube. Touche-en un pour le plier.</p>`}</div>`;
      } else {
        const r = net.rep;
        h += `<div class="tool-top"><button class="pill" id="so-net">🎲 Autre figure</button><button class="pill" id="so-gal">📚 Les 11 patrons du cube</button><span class="score">⭐ ${score} / ${total}</span></div>
          <div class="geo-sol rc-board ${r != null ? "geo-3col" : ""}"><div class="geo-netbox">${netSVG(net.cells, "big")}</div>${r != null ? scene() : ""}
          <div class="geo-info"><p class="geo-q">Cette figure est-elle un patron du cube ?</p>
          <div class="geo-reps"><button class="geo-rep ${r != null && net.ok ? "good" : r === true ? "bad" : ""}" data-net="1" ${r != null ? "disabled" : ""}>Oui</button><button class="geo-rep ${r != null && !net.ok ? "good" : r === false ? "bad" : ""}" data-net="0" ${r != null ? "disabled" : ""}>Non</button></div>
          <p class="geo-msg">${r == null ? "" : `<span class="banner ${r === net.ok ? "ok" : "ko"}">${r === net.ok ? "Bravo ! " : "Eh non ! "}${net.ok ? "C'est bien un patron du cube." : "Ce n'est pas un patron : en pliant, deux carrés se retrouvent l'un sur l'autre."}</span>`}</p>
          ${r != null ? `<div class="geo-cpt"><button class="geo-tb" data-plier="1">📦 Plier</button><button class="geo-tb" data-plier="0">📄 Déplier</button></div>` : ""}</div></div>`;
      }
    }
    el.innerHTML = h;
  };
  const animer = (cible) => {
    cancelAnimationFrame(anim); const t0 = performance.now(), p0 = pt, dur = 1800 * Math.abs(cible - p0) + 1;
    const pas = (now) => { const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; pt = p0 + (cible - p0) * e; majVue(); for (const r of el.querySelectorAll("#so-pt, #so-pt2")) r.value = Math.round(pt * 100); if (k < 1) anim = requestAnimationFrame(pas); else anim = null; };
    anim = requestAnimationFrame(pas);
  };
  const boucle = () => { if (auto && !dragR) { yaw += 0.008; majVue(); } raf = requestAnimationFrame(boucle); };
  raf = requestAnimationFrame(boucle);

  el.onpointerdown = (e) => { const s = e.target.closest("svg[data-rot]"); if (!s) return; e.preventDefault(); try { s.setPointerCapture(e.pointerId); } catch {} dragR = { x: e.clientX, y: e.clientY, s }; };
  el.onpointermove = (e) => {
    if (!dragR) return; const r = dragR.s.getBoundingClientRect(), k = 3.2 / Math.max(200, r.width);
    yaw += (e.clientX - dragR.x) * k; pitch = Math.max(-1.45, Math.min(1.45, pitch + (e.clientY - dragR.y) * k));
    dragR.x = e.clientX; dragR.y = e.clientY; majVue();
  };
  el.onpointerup = el.onpointercancel = () => { dragR = null; };
  el.onclick = (e) => {
    if (surNiveau(e, (n) => { niv = n; stopCompte(); compte = null; score = total = 0; if (mode === "quiz") nouvQuiz(); if (mode === "patrons" && !patDispo().includes(pat)) { cancelAnimationFrame(anim); pat = patDispo()[0]; pt = 0; } render(); })) return;
    const t = e.target.closest("button"); if (!t) return;
    const d = t.dataset;
    if (d.mode) { mode = d.mode; stopCompte(); compte = null; cancelAnimationFrame(anim); pt = 0; galerie = false; score = total = 0; if (mode === "quiz") nouvQuiz(); if (mode === "netcube") nouvNet(); if (mode === "patrons" || mode === "explorer") { yaw = -0.6; pitch = mode === "patrons" ? 0.9 : 0.42; } }
    else if (d.sol) { sid = d.sol; stopCompte(); compte = null; }
    else if (t.id === "so-auto") auto = !auto;
    else if (t.id === "so-cach") cachees = !cachees;
    else if (d.cpt) {
      stopCompte(); const tot = comptes(sid)[d.cpt]; compte = { type: d.cpt, k: 0, total: tot };
      timer = setInterval(() => { compte.k++; if (compte.k >= compte.total) { stopCompte(); render(); } else { majVue(); const p = el.querySelector(".geo-compte"); if (p) p.textContent = `${compte.k} ${NOMS_COMPTE[compte.type]}…`; } }, d.cpt === "faces" ? 900 : 650);
    }
    else if (t.id === "so-next" || t.id === "so-next2") nouvQuiz();
    else if (d.rep && quiz && !quiz.ok) { if (d.rep === quiz.bonne) { quiz.ok = true; if (!quiz.faux.size) score++; total++; } else quiz.faux.add(d.rep); }
    else if (d.pat) { pat = d.pat; cancelAnimationFrame(anim); pt = 0; }
    else if (d.deplier) { mode = "patrons"; pat = d.deplier; stopCompte(); compte = null; cancelAnimationFrame(anim); pt = 1; yaw = -0.6; pitch = 0.9; render(); animer(0); return; }
    else if (d.plier) { animer(+d.plier); return; }
    else if (t.id === "so-net") { nouvNet(); galerie = false; }
    else if (t.id === "so-gal") { galerie = !galerie; if (galerie) net = { ...net, voir: false }; else nouvNet(); }
    else if (d.gal) { const x = hexaminos().filter((h) => h.ok)[+d.gal]; net = { cells: x.cells, ok: true, rep: null, voir: true }; pt = 0; yaw = -0.5; pitch = 0.95; render(); animer(1); return; }
    else if (d.net && net.rep == null) { net.rep = d.net === "1"; total++; if (net.rep === net.ok) score++; render(); animer(1); return; }
    else return;
    render();
  };
  el.oninput = (e) => { if (e.target.id === "so-pt" || e.target.id === "so-pt2") { cancelAnimationFrame(anim); pt = +e.target.value / 100; majVue(); for (const r of el.querySelectorAll("#so-pt, #so-pt2")) if (r !== e.target) r.value = e.target.value; } };
  render();
  return () => { stopCompte(); cancelAnimationFrame(raf); cancelAnimationFrame(anim); dragR = null; };
}

// Fonctions exposées pour les tests.
export const _geo = { decoupe, elements, comparer, FRISES, SUITES, proprietes, fabriquer, nette, ATTENDU, TRIS, NOMME, DEVINETTES, CHAINES, SOLIDES, comptes, modele3D, estPatronCube, polyominos, PATRONS, PATRONS_NIV, plier, patronCarres, deplier, typeFigure, nomFigure, axesSym, analyser, croise, DEPARTS, TOL_MANIP };

export const GEO = [
  { id: "frises", nom: "Frises et motifs", icone: "〰️", couleur: "#ffe3a3", desc: "Continuer, reproduire, créer des frises sur quadrillage", mount: frises },
  { id: "formes", nom: "Formes et polygones", icone: "🔷", couleur: "#cfe6ff", desc: "Nommer, trier, devinettes « Qui suis-je ? »", mount: formes },
  { id: "figures", nom: "Figures à manipuler", icone: "✋", couleur: "#c9ecd4", desc: "Déplacer les sommets, tourner, agrandir : propriétés en direct", mount: figures },
  { id: "solides", nom: "Les solides", icone: "🧊", couleur: "#d7ccff", desc: "Solides en 3D à faire tourner, patrons à plier", mount: solides },
];
