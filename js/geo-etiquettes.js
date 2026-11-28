// Maths : « Légender les figures » — étiquettes à placer (ou noms à écrire) sous des figures planes, des solides,
// ou à côté des éléments d'une figure (côté, sommet, angle droit…). Même principe que le Tableau de conjugaison.
// Les noms des figures et les figures tirées viennent des tables de js/geo.js (NOMME, CHAINES, SOLIDES) : l'app reste cohérente.
// Attention : geo.js importe ce fichier (import circulaire). On ne touche à _geo que dans les fonctions, jamais au chargement.
import { segNiveau, surNiveau, niveauJeux, rang } from "./niveau.js";
import { _geo } from "./geo.js";

const hasard = (n) => Math.floor(Math.random() * n);
const choix = (a) => a[hasard(a.length)];
const rnd = (a, b) => a + Math.random() * (b - a);
const melange = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = hasard(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const RAD = Math.PI / 180;
const f1 = (n) => Math.round(n * 10) / 10;
const des = (niv, min) => rang(niv) >= rang(min);
// Comparaison souple pour « Écrire » : sans accents, sans majuscules, tirets et espaces multiples ignorés.
export const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/œ/g, "oe").replace(/[-'’]/g, " ").replace(/\s+/g, " ").trim();

// =====================================================================
// CONTENUS PAR NIVEAU — à relire par l'enseignante.
// 1. Les figures : noms et figures de NOMME (js/geo.js, outil « Formes et polygones »), même progression.
//    Le nom attendu est le plus précis parmi les noms du niveau ; un nom vrai mais moins précis
//    (« rectangle » pour un carré) est signalé en orange, pas compté juste.
// 2. Les solides : SOLIDES (js/geo.js) à partir de leur niveau. Nom court avant le CM2 (« pyramide », « prisme droit »),
//    nom complet au CM2 (« pyramide à base carrée »…).
// 3. Le vocabulaire : deux figures, des flèches numérotées vers leurs éléments.
// =====================================================================
const NB_FIG = { CP: 6, CE1: 6, CE2: 6, CM1: 8, CM2: 8 };
const NB_SOL = { CP: 4, CE1: 5, CE2: 6, CM1: 6, CM2: 8 };
const VOC = {
  CE1: { poly: ["carre", "rectangle", "triRect"], diag: false, cercle: [], solides: ["cube", "pave", "pyr4"] },
  CE2: { poly: ["carre", "rectangle", "triRect"], diag: false, cercle: ["centre", "rayon"], solides: ["cube", "pave", "pyr4"] },
  CM1: { poly: ["carre", "rectangle", "triRect"], diag: true, cercle: ["centre", "rayon", "diamètre"], solides: ["cube", "pave", "pyr4", "prisme3"] },
  CM2: { poly: ["carre", "rectangle", "triRect"], diag: true, cercle: ["centre", "rayon", "diamètre"], solides: ["cube", "pave", "pyr4", "prisme3", "prisme6"] },
};
const MOTS_VOC = ["côté", "sommet", "angle droit", "diagonale", "centre", "rayon", "diamètre", "face", "arête"];
// Réponses « vraies mais pas assez précises » dans le vocabulaire.
const PRESQUE_VOC = { "angle droit": ["angle"], "côté": ["segment"], "rayon": ["segment"], "diamètre": ["segment"], "diagonale": ["segment"] };
const PIEGES_3D = ["cube", "boule", "pavé droit"], PIEGES_2D = ["carré", "cercle", "rectangle", "triangle"];
export const MODES = [
  { id: "fig", nom: "🔷 Les figures", des: "CP" },
  { id: "sol", nom: "🧊 Les solides", des: "CP" },
  { id: "voc", nom: "📍 Les mots de la géométrie", des: "CE1" },
];

// ---------- 1. Les figures planes ----------
// Pour chaque niveau : [{ type, cible, ok, presque }] possibles, à partir de NOMME et CHAINES.
export function typesFigures(niv) {
  const { NOMME, CHAINES } = _geo, nm = NOMME[niv], groupes = [];
  nm.types.forEach((t, i) => groupes.push({ nom: nm.vocab[i], types: Array.isArray(t) ? t : [t] }));
  return groupes.map((g) => ({ ...g, attendu: g.types.map((type) => attenduFigure(CHAINES[type], nm.vocab)) }));
}
function attenduFigure(chaine, vocab) {
  const k = chaine.findIndex((n) => vocab.includes(n));
  return { cible: chaine[k], ok: chaine.slice(0, k + 1), presque: chaine.slice(k + 1) };
}
function codage(f) {
  if (!f.poly) return "";
  const P = f.pts, pr = f.pr, n = P.length; let g = "";
  for (const i of pr.droits) {
    const V = P[i], A = P[(i - 1 + n) % n], B = P[(i + 1) % n], la = Math.hypot(A[0] - V[0], A[1] - V[1]), lb = Math.hypot(B[0] - V[0], B[1] - V[1]), s = Math.min(7, 0.3 * Math.min(la, lb));
    const u = [(A[0] - V[0]) / la * s, (A[1] - V[1]) / la * s], w = [(B[0] - V[0]) / lb * s, (B[1] - V[1]) / lb * s];
    g += `<path d="M${f1(V[0] + u[0])} ${f1(V[1] + u[1])}L${f1(V[0] + u[0] + w[0])} ${f1(V[1] + u[1] + w[1])}L${f1(V[0] + w[0])} ${f1(V[1] + w[1])}" class="gl-mk"/>`;
  }
  for (let i = 0; i < n; i++) {
    const gi = pr.groupe[i]; if (gi < 0) continue;
    const a = P[i], b = P[(i + 1) % n], L = pr.L[i], ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    for (let t = 0; t <= gi; t++) { const o = (t - gi / 2) * 2.6; g += `<line x1="${f1(mx + o * ux - 3.4 * uy)}" y1="${f1(my + o * uy + 3.4 * ux)}" x2="${f1(mx + o * ux + 3.4 * uy)}" y2="${f1(my + o * uy - 3.4 * ux)}" class="gl-mk"/>`; }
  }
  return g;
}
const ptsStr = (P) => P.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ");
function svgFigure(f, avecCodage) {
  const fig = f.cercle ? `<circle cx="${f1(f.cercle.cx)}" cy="${f1(f.cercle.cy)}" r="${f1(f.cercle.r)}" class="gl-fp" style="fill:${f.coul}"/>`
    : `<polygon points="${ptsStr(f.pts)}" class="gl-fp" style="fill:${f.coul}"/>`;
  return `<svg viewBox="0 0 100 100" class="gl-svg" aria-hidden="true">${fig}${avecCodage ? codage(f) : ""}</svg>`;
}
export function serieFigures(niv) {
  const gs = typesFigures(niv), nb = NB_FIG[niv];
  const tirage = melange(gs).slice(0, nb);
  while (tirage.length < nb) tirage.push(choix(gs));
  const formes = [], items = [];
  melange(tirage).forEach((g, k) => {
    const j = hasard(g.types.length), f = _geo.fabriquer(g.types[j]);
    formes.push(f);
    items.push({ fig: k, type: g.types[j], ...g.attendu[j] });
  });
  const surPlateau = new Set(items.flatMap((it) => [...it.ok, ...it.presque]));
  const autres = Object.values(_geo.NOMME).flatMap((x) => x.vocab);
  const pieges = [melange(_geo.NOMME[niv].vocab), melange(des(niv, "CE2") ? autres : PIEGES_3D), melange(PIEGES_3D)].map((t) => t.filter((n) => !surPlateau.has(n)));
  // figures(codage) : redessinées à chaque affichage, pour montrer ou cacher le codage sans changer de série.
  return { formes, figures: (avecCodage) => formes.map((f) => svgFigure(f, avecCodage)), items, pieges };
}

// ---------- 2. Les solides ----------
const D = 9;
const sous = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norme = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
// roulis (autour de z) puis lacet (autour de y) puis tangage (autour de x) : y vers le haut, l'œil sur l'axe z.
function tourner([x, y, z], yaw, pitch, roll = 0) {
  const cr = Math.cos(roll), sr = Math.sin(roll); [x, y] = [x * cr - y * sr, x * sr + y * cr];
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
}
let idGrad = 0;
// Dessine un solide dans un carré 100 × 100. ajuste : "boite" (cartes) ou "cercle" (vocabulaire : laisse de la place aux flèches).
// Renvoie le SVG intérieur, les points projetés et ce qui est visible (pour placer les flèches).
export function solide(id, { yaw, pitch, roll = 0, taille = 1, ajuste = "boite", centre = [50, 50] }) {
  const sol = _geo.SOLIDES.find((s) => s.id === id), hue = sol.teinte;
  if (id === "boule") {
    const r = 34 * taille, [cx, cy] = centre, g = `gl-g${++idGrad}`, inc = rnd(0.18, 0.35);
    return { svg: `<defs><radialGradient id="${g}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="hsl(${hue} 90% 93%)"/><stop offset=".55" stop-color="hsl(${hue} 70% 74%)"/><stop offset="1" stop-color="hsl(${hue} 55% 50%)"/></radialGradient></defs>
      <circle cx="${cx}" cy="${cy}" r="${f1(r)}" fill="url(#${g})" class="gl-boule"/>
      <path d="M${f1(cx - r)} ${cy}A${f1(r)} ${f1(r * inc)} 0 0 1 ${f1(cx + r)} ${cy}" class="gl-ar-cachee"/><path d="M${f1(cx - r)} ${cy}A${f1(r)} ${f1(r * inc)} 0 0 0 ${f1(cx + r)} ${cy}" class="gl-ar-lisse"/>` };
  }
  const m = _geo.modele3D(id), V = m.V.map((p) => tourner(p, yaw, pitch, roll));
  const brut = V.map(([x, y, z]) => { const f = D / (D - z); return [x * f, -y * f]; });
  const xs = brut.map((p) => p[0]), ys = brut.map((p) => p[1]);
  let P;
  if (ajuste === "cercle") {
    const c = [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2], R = Math.max(...brut.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])));
    const k = 31 * taille / R; P = brut.map(([x, y]) => [centre[0] + (x - c[0]) * k, centre[1] + (y - c[1]) * k]);
  } else {
    const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys), k = 80 * taille / Math.max(w, h);
    const ox = 50 - (w * k) / 2 + rnd(-1, 1) * (80 - w * k) * 0.25, oy = 50 - (h * k) / 2 + rnd(-1, 1) * (80 - h * k) * 0.25;
    P = brut.map(([x, y]) => [ox + (x - Math.min(...xs)) * k, oy + (y - Math.min(...ys)) * k]);
  }
  const eye = [0, 0, D], lum = norme([-0.45, 0.75, 0.6]);
  const vis = m.F.map((f, fi) => { const n = tourner(m.N[fi], yaw, pitch, roll); return { n, v: dot(n, sous(eye, V[f[0]])) > 0 }; });
  let g = "";
  m.F.forEach((f, fi) => {
    if (!vis[fi].v) return;
    const l = Math.max(0, dot(vis[fi].n, lum)), fill = `hsl(${hue} 65% ${f1(52 + 34 * l)}%)`;
    g += `<polygon points="${ptsStr(f.map((i) => P[i]))}" fill="${fill}" stroke="${m.lisse.has(fi) ? fill : "none"}" stroke-width=".6"/>`;
  });
  const cachees = [], vues = [], aretesVues = [];
  m.E.forEach((e, ei) => {
    const front = e.f.map((fi) => vis[fi].v), d = `M${f1(P[e.a][0])} ${f1(P[e.a][1])}L${f1(P[e.b][0])} ${f1(P[e.b][1])}`;
    if (e.lisse) { if (front[0] !== front[1]) vues.push(`<path d="${d}" class="gl-ar"/>`); return; }
    if (front.some(Boolean)) { vues.push(`<path d="${d}" class="gl-ar"/>`); aretesVues.push(ei); } else cachees.push(`<path d="${d}" class="gl-ar-cachee"/>`);
  });
  return { svg: g + cachees.join("") + vues.join(""), P, m, vis, aretesVues };
}
// Orientation au hasard, jamais de face (sinon un cube ressemble à un carré). Pavé, prisme ou cylindre parfois couchés.
function orientation(id, carte = true) {
  const yaw = (hasard(4) * 90 + rnd(22, 68)) * RAD, pitch = rnd(0.28, 0.6);
  const couche = carte && ["pave", "cylindre", "prisme3", "prisme5", "prisme6"].includes(id) && Math.random() < 0.3;
  return { yaw, pitch, roll: couche ? 90 * RAD : 0 };
}
export function nomsSolides(niv) {
  return _geo.SOLIDES.filter((s) => des(niv, s.niv)).map((s) => {
    const cm2 = niv === "CM2", cible = cm2 ? s.nom : s.court;
    // « prisme » ou « pavé » tout court : vrai mais incomplet (orange).
    const presque = [...(cm2 && s.court !== s.nom ? [s.court] : []), ...(s.id.startsWith("prisme") ? ["prisme"] : s.id === "pave" ? ["pavé"] : [])];
    return { id: s.id, cible, ok: [...new Set([cible, s.nom])], presque };
  });
}
export function serieSolides(niv) {
  const ss = nomsSolides(niv), nb = NB_SOL[niv];
  const tirage = melange(ss).slice(0, nb);
  while (tirage.length < nb) tirage.push(choix(ss));
  const figures = [], items = [];
  melange(tirage).forEach((s, k) => {
    const d = solide(s.id, { ...orientation(s.id), taille: rnd(0.7, 1) });
    figures.push(`<svg viewBox="0 0 100 100" class="gl-svg" aria-hidden="true">${d.svg}</svg>`);
    items.push({ fig: k, type: s.id, cible: s.cible, ok: s.ok, presque: s.presque });
  });
  const surPlateau = new Set(items.flatMap((it) => [...it.ok, ...it.presque]));
  const pieges = [melange(ss.map((s) => s.cible)), melange(PIEGES_2D)].map((t) => [...new Set(t)].filter((n) => !surPlateau.has(n)));
  return { figures, items, pieges };
}

// ---------- 3. Le vocabulaire (flèches numérotées) ----------
// cibles : [{ x, y, mot, libre? }] ; libre = au centre de la figure, la pastille va dans le plus grand espace libre.
function pastilles(cibles, c = [50, 50], R = 45) {
  const ang = cibles.map((t) => (t.libre ? null : Math.atan2(t.y - c[1], t.x - c[0])));
  const ecart = 52 * RAD;
  for (let tour = 0; tour < 40; tour++) {
    let bouge = false;
    for (let i = 0; i < ang.length; i++) for (let j = i + 1; j < ang.length; j++) {
      if (ang[i] == null || ang[j] == null) continue;
      let d = Math.atan2(Math.sin(ang[j] - ang[i]), Math.cos(ang[j] - ang[i]));
      if (Math.abs(d) < ecart) { const p = (ecart - Math.abs(d)) / 2 + 0.01, s = d >= 0 ? 1 : -1; ang[i] -= s * p; ang[j] += s * p; bouge = true; }
    }
    if (!bouge) break;
  }
  ang.forEach((a, i) => {
    if (a != null) return;
    const pris = ang.filter((x) => x != null).map((x) => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((p, q) => p - q);
    if (!pris.length) { ang[i] = -Math.PI / 4; return; }
    let best = 0, milieu = 0;
    pris.forEach((p, k) => { const q = k + 1 < pris.length ? pris[k + 1] : pris[0] + 2 * Math.PI, gap = q - p; if (gap > best) { best = gap; milieu = p + gap / 2; } });
    ang[i] = milieu;
  });
  return ang.map((a) => [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a)]);
}
function fleches(cibles, num0) {
  const pos = pastilles(cibles);
  return cibles.map((t, i) => {
    const [bx, by] = pos[i], dx = t.x - bx, dy = t.y - by, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const sx = bx + ux * 6.6, sy = by + uy * 6.6, ex = t.x - ux * (t.point ? 2.6 : 0.8), ey = t.y - uy * (t.point ? 2.6 : 0.8);
    const tete = `${f1(ex)},${f1(ey)} ${f1(ex - ux * 4.2 - uy * 2.2)},${f1(ey - uy * 4.2 + ux * 2.2)} ${f1(ex - ux * 4.2 + uy * 2.2)},${f1(ey - uy * 4.2 - ux * 2.2)}`;
    return `<line x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(ex - ux * 3)}" y2="${f1(ey - uy * 3)}" class="gl-fl"/><polygon points="${tete}" class="gl-fl-t"/>
      <circle cx="${f1(bx)}" cy="${f1(by)}" r="6.4" class="gl-pa p${(num0 + i) % 8}"/><text x="${f1(bx)}" y="${f1(by)}" class="gl-pa-t">${num0 + i + 1}</text>`;
  }).join("");
}
const tour = (P, th, c = [50, 50]) => P.map(([x, y]) => [c[0] + x * Math.cos(th) - y * Math.sin(th), c[1] + x * Math.sin(th) + y * Math.cos(th)]);
function vocPolygone(niv) {
  const t = VOC[niv], type = choix(t.poly), th = (Math.random() < 0.2 ? hasard(4) * 90 : rnd(0, 360)) * RAD, mir = Math.random() < 0.5 ? -1 : 1;
  let P;
  if (type === "carre") { const s = rnd(19, 22); P = [[-s, -s], [s, -s], [s, s], [-s, s]]; }
  else if (type === "rectangle") { const b = rnd(27, 30), h = b / rnd(1.5, 2); P = [[-b, -h], [b, -h], [b, h], [-b, h]]; }
  else { const a = rnd(38, 44), b = a / rnd(1.35, 1.9); P = [[-a / 3, -b * 2 / 3], [-a / 3, b / 3], [a * 2 / 3, b / 3]]; } // angle droit au sommet 1
  P = tour(P.map(([x, y]) => [mir * x, y]), th);
  const n = P.length, droit = type === "triRect" ? 1 : hasard(4), V = P[droit], A = P[(droit - 1 + n) % n], B = P[(droit + 1) % n];
  const la = Math.hypot(A[0] - V[0], A[1] - V[1]), lb = Math.hypot(B[0] - V[0], B[1] - V[1]), s = 8.5;
  const u = [(A[0] - V[0]) / la * s, (A[1] - V[1]) / la * s], w = [(B[0] - V[0]) / lb * s, (B[1] - V[1]) / lb * s];
  const somI = (droit + (n === 4 ? 2 : 1)) % n, cote = n === 4 ? [(droit + 1) % n, (droit + 2) % n] : [(droit + 1) % n, (droit + 2) % n];
  const cibles = [
    { x: V[0] + (u[0] + w[0]) * 0.7, y: V[1] + (u[1] + w[1]) * 0.7, mot: "angle droit" },
    { x: P[somI][0], y: P[somI][1], mot: "sommet", point: true },
    { x: (P[cote[0]][0] + P[cote[1]][0]) / 2, y: (P[cote[0]][1] + P[cote[1]][1]) / 2, mot: "côté" },
  ];
  let diag = "";
  if (t.diag && n === 4) {
    const i = (droit + 1) % 4, j = (droit + 3) % 4; // la diagonale qui ne passe pas par le sommet marqué « sommet »
    diag = `<line x1="${f1(P[0][0])}" y1="${f1(P[0][1])}" x2="${f1(P[2][0])}" y2="${f1(P[2][1])}" class="gl-diag"/><line x1="${f1(P[1][0])}" y1="${f1(P[1][1])}" x2="${f1(P[3][0])}" y2="${f1(P[3][1])}" class="gl-diag"/>`;
    cibles.push({ x: P[i][0] + (P[j][0] - P[i][0]) * 0.36, y: P[i][1] + (P[j][1] - P[i][1]) * 0.36, mot: "diagonale" });
  }
  const svg = `<polygon points="${ptsStr(P)}" class="gl-fp" style="fill:${choix(["#ffd0dc", "#cfe6ff", "#c9ecd4", "#ffe3a3"])}"/>${diag}
    <path d="M${f1(V[0] + u[0])} ${f1(V[1] + u[1])}L${f1(V[0] + u[0] + w[0])} ${f1(V[1] + u[1] + w[1])}L${f1(V[0] + w[0])} ${f1(V[1] + w[1])}" class="gl-mk"/>
    ${P.map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.5" class="gl-pt"/>`).join("")}`;
  return { svg, cibles: melange(cibles), type };
}
function vocCercle(niv) {
  const mots = VOC[niv].cercle, r = rnd(28, 31), a = rnd(0, 360) * RAD, b = a + rnd(95, 130) * RAD, c = 50;
  const R = (t, k = 1) => [c + r * k * Math.cos(t), c + r * k * Math.sin(t)];
  const pr = R(a), d1 = R(b), d2 = R(b + Math.PI);
  let svg = `<circle cx="${c}" cy="${c}" r="${f1(r)}" class="gl-fp gl-cercle" style="fill:#e7f6ff"/>
    <line x1="${c}" y1="${c}" x2="${f1(pr[0])}" y2="${f1(pr[1])}" class="gl-seg r"/>`;
  if (mots.includes("diamètre")) svg += `<line x1="${f1(d1[0])}" y1="${f1(d1[1])}" x2="${f1(d2[0])}" y2="${f1(d2[1])}" class="gl-seg d"/>`;
  svg += `<circle cx="${c}" cy="${c}" r="1.7" class="gl-pt"/>`;
  const cibles = [{ x: c, y: c, mot: "centre", libre: true, point: true }, { x: R(a, 0.62)[0], y: R(a, 0.62)[1], mot: "rayon" }];
  if (mots.includes("diamètre")) { const q = R(b + Math.PI, 0.6); cibles.push({ x: q[0], y: q[1], mot: "diamètre" }); }
  return { svg, cibles: melange(cibles), type: "cercle" };
}
function vocSolide(niv) {
  const id = choix(VOC[niv].solides), d = solide(id, { ...orientation(id, false), ajuste: "cercle", taille: rnd(0.9, 1) });
  const { P, m, vis, aretesVues } = d, aire = (Q) => Math.abs(Q.reduce((s, p, i) => { const q = Q[(i + 1) % Q.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  const faces = m.F.map((f, fi) => ({ fi, Q: f.map((i) => P[i]) })).filter((x) => vis[x.fi].v).sort((p, q) => aire(q.Q) - aire(p.Q));
  const fc = faces[0], cf = fc.Q.reduce((s, p) => [s[0] + p[0] / fc.Q.length, s[1] + p[1] / fc.Q.length], [0, 0]);
  const surFace = new Set(m.F[fc.fi]);
  const ar = aretesVues.map((ei) => m.E[ei]).sort((p, q) => (surFace.has(p.a) + surFace.has(p.b)) - (surFace.has(q.a) + surFace.has(q.b)))[0];
  const visibles = [...new Set(faces.flatMap((x) => m.F[x.fi]))];
  const som = visibles.filter((i) => i !== ar.a && i !== ar.b).sort((i, j) => (surFace.has(i) - surFace.has(j)) || (P[i][1] - P[j][1]))[0];
  const cibles = [
    { x: cf[0], y: cf[1], mot: "face", libre: Math.hypot(cf[0] - 50, cf[1] - 50) < 9 },
    { x: (P[ar.a][0] + P[ar.b][0]) / 2, y: (P[ar.a][1] + P[ar.b][1]) / 2, mot: "arête" },
    { x: P[som][0], y: P[som][1], mot: "sommet", point: true },
  ];
  return { svg: d.svg + `<circle cx="${f1(P[som][0])}" cy="${f1(P[som][1])}" r="1.5" class="gl-pt"/>`, cibles: melange(cibles), type: id };
}
export function serieVocabulaire(niv) {
  const t = VOC[niv] || VOC.CE1, a = vocPolygone(niv in VOC ? niv : "CE1");
  const b = t.cercle.length && Math.random() < 0.5 ? vocCercle(niv) : vocSolide(niv in VOC ? niv : "CE1");
  const figures = [], items = [];
  [a, b].forEach((f, k) => {
    figures.push(`<svg viewBox="-6 -6 112 112" class="gl-svg gl-voc-svg" aria-hidden="true">${f.svg}${fleches(f.cibles, items.length)}</svg>`);
    f.cibles.forEach((c) => items.push({ fig: k, type: f.type, cible: c.mot, ok: [c.mot], presque: PRESQUE_VOC[c.mot] || [], x: c.x, y: c.y }));
  });
  const surPlateau = new Set(items.map((it) => it.cible)), duNiveau = new Set([...(t.diag ? ["diagonale"] : []), "côté", "sommet", "angle droit", ...t.cercle, "face", "arête"]);
  const pieges = [melange(MOTS_VOC.filter((m) => duNiveau.has(m))), melange(MOTS_VOC)].map((l) => l.filter((m) => !surPlateau.has(m)));
  return { figures, items, pieges };
}

// Étiquettes intruses : on puise dans les paniers dans l'ordre, sans doublon, jamais un nom accepté sur le plateau.
function intrus(pieges, n = 2) {
  const out = [];
  for (const p of pieges) for (const x of p) { if (out.length >= n) return out; if (!out.includes(x)) out.push(x); }
  return out;
}
// État d'une réponse : "" (vide), "good", "presque" ou "bad".
export function juger(it, txt) {
  if (!txt || !txt.trim()) return "";
  const n = norm(txt);
  if (it.ok.some((x) => norm(x) === n)) return "good";
  if (it.presque.some((x) => norm(x) === n)) return "presque";
  return "bad";
}
// Orthographe exacte attendue pour une réponse jugée juste (pour l'afficher si l'élève a oublié un accent).
const graphie = (it, txt) => it.ok.find((x) => norm(x) === norm(txt));
export const _legende = { typesFigures, nomsSolides, serieFigures, serieSolides, serieVocabulaire, intrus, juger, norm, VOC, NB_FIG, NB_SOL };

// =====================================================================
// L'OUTIL
// =====================================================================
function legende(el) {
  let niv = niveauJeux(), mode = "fig", saisie = "etq", avecIntrus = false, avecCodage = false;
  let serie = null, banque = [], rep = [], sel = null, verif = false, sol = false;
  const modesDispo = () => MODES.filter((m) => des(niv, m.des));
  const fabriquer = () => {
    if (!modesDispo().some((m) => m.id === mode)) mode = "fig";
    serie = mode === "fig" ? serieFigures(niv) : mode === "sol" ? serieSolides(niv) : serieVocabulaire(niv);
    preparer();
  };
  const preparer = () => {
    const extra = avecIntrus ? intrus(serie.pieges) : [];
    banque = melange([...serie.items.map((it) => it.cible), ...extra]).map((txt) => ({ txt, pris: false }));
    rep = serie.items.map(() => ({ place: null, val: "" }));
    sel = null; verif = false; sol = false;
  };
  const texte = (k) => (saisie === "etq" ? (rep[k].place != null ? banque[rep[k].place].txt : "") : rep[k].val);
  const place = (e, c) => {
    if (sol || !rep[c] || !banque[e]) return;
    rep.forEach((x) => { if (x.place === e) x.place = null; });
    if (rep[c].place != null) banque[rep[c].place].pris = false;
    rep[c].place = e; banque[e].pris = true; sel = null; verif = false;
  };
  const retirer = (c) => { const x = rep[c]; if (x.place == null || sol) return; banque[x.place].pris = false; x.place = null; verif = false; };
  const etat = (k) => (sol ? (juger(serie.items[k], texte(k)) === "good" ? "good" : "sol") : verif ? juger(serie.items[k], texte(k)) || "bad" : "");
  const fente = (k) => {
    const it = serie.items[k], et = etat(k);
    if (saisie === "ecrire") {
      const t = texte(k), g = !sol && et === "good" && t.trim() !== graphie(it, t) ? graphie(it, t) : "";
      return `<span class="gl-fente"><input class="gl-saisie ${et}" data-c="${k}" value="${esc(sol ? (et === "good" ? graphie(it, t) : it.cible) : t)}" ${sol ? "readonly" : ""} autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Nom ${k + 1}">${g ? `<small class="gl-ortho">On écrit : <b>${esc(g)}</b></small>` : ""}</span>`;
    }
    const txt = sol && et !== "good" ? it.cible : texte(k);
    return `<button class="gl-case ${txt ? "plein" : ""} ${et} ${sel != null && !txt ? "attend" : ""}" data-c="${k}">${esc(txt) || "&nbsp;"}</button>`;
  };
  const consigne = () => {
    const v = saisie === "etq" ? "Place" : "Écris";
    if (mode === "fig") return `${v} le nom de chaque figure${des(niv, "CE2") ? " : le nom <b>le plus précis</b>" : ""}.`;
    if (mode === "sol") return `${v} le nom de chaque solide.`;
    return `${v} le bon mot à côté de chaque numéro.`;
  };
  const render = () => {
    const figs = typeof serie.figures === "function" ? serie.figures(avecCodage) : serie.figures;
    const n = serie.items.length, etats = serie.items.map((_, k) => juger(serie.items[k], texte(k)));
    const justes = etats.filter((x) => x === "good").length, presque = etats.filter((x) => x === "presque").length;
    const plateau = mode === "voc"
      ? `<div class="gl-voc">${figs.map((f, i) => `<div class="gl-voc-fig">${f}<div class="gl-voc-liste">${serie.items.map((it, k) => (it.fig === i ? `<div class="gl-voc-l"><span class="gl-num p${k % 8}">${k + 1}</span>${fente(k)}</div>` : "")).join("")}</div></div>`).join("")}</div>`
      : `<div class="gl-grille n${n}">${figs.map((f, k) => `<div class="gl-carte">${f}${fente(k)}</div>`).join("")}</div>`;
    el.innerHTML = `
      <div class="tool-top wrap">${segNiveau(niv)}
        <div class="seg">${modesDispo().map((m) => `<button data-mode="${m.id}" class="${m.id === mode ? "on" : ""}">${m.nom}</button>`).join("")}</div></div>
      <div class="tool-top wrap">
        <div class="seg"><button data-saisie="etq" class="${saisie === "etq" ? "on" : ""}">🏷️ Étiquettes</button><button data-saisie="ecrire" class="${saisie === "ecrire" ? "on" : ""}">✏️ Écrire</button></div>
        ${saisie === "etq" ? `<button class="pill gl-opt ${avecIntrus ? "on" : ""}" id="intrus">🙈 Intrus</button>` : ""}
        ${mode === "fig" ? `<button class="pill gl-opt ${avecCodage ? "on" : ""}" id="codage" title="Angles droits et côtés de même longueur">📐 Codage</button>` : ""}
      </div>
      <div class="tool-center rc-board gl-zone">
        <p class="gl-consigne">${consigne()}</p>
        ${plateau}
        ${saisie === "etq" ? `<div class="gl-banque">${banque.map((b, k) => (b.pris || sol ? "" : `<button class="gl-etq ${sel === k ? "sel" : ""}" data-e="${k}">${esc(b.txt)}</button>`)).join("") || (sol ? "" : `<span class="hint">Toutes les étiquettes sont placées.</span>`)}</div>` : ""}
        ${verif && !sol ? (justes === n ? `<div class="banner ok" data-fete>Bravo, tout est juste ! 🎉</div>`
          : `<div class="banner ko">${justes} / ${n} : regarde les cases en rouge.${presque ? ` En orange : c'est vrai, mais il y a un nom plus précis.` : ""}</div>`) : ""}
        <div class="pills rc-keep"><button class="pill" id="verif">✅ Vérifier</button><button class="pill" id="sol">👀 Solution</button><button class="pill" id="eff">↺ Recommencer</button><button class="pill" id="nouv">🎲 Nouvelle série</button></div>
        <p class="hint">${saisie === "etq" ? "Touche une étiquette puis une case, ou fais-la glisser." : "Les accents oubliés sont acceptés : la bonne orthographe s'affiche à la correction."}</p>
      </div>`;
  };
  // Glisser une étiquette vers une case (souris, doigt, stylet) : même geste que le Tableau de conjugaison.
  let drag = null, ignoreClic = false;
  const bouge = (e) => {
    if (!drag) return;
    if (!drag.fant && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
      const g = drag.src.cloneNode(true); g.classList.add("gl-fantome"); g.classList.remove("sel");
      const r = drag.src.getBoundingClientRect(); drag.ox = drag.x - r.left; drag.oy = drag.y - r.top;
      document.body.appendChild(g); drag.fant = g; drag.src.classList.add("gl-parti");
    }
    if (drag.fant) {
      drag.fant.style.left = e.clientX - drag.ox + "px"; drag.fant.style.top = e.clientY - drag.oy + "px";
      el.querySelectorAll(".gl-case.survol").forEach((x) => x.classList.remove("survol"));
      const s = document.elementFromPoint(e.clientX, e.clientY)?.closest(".gl-case"); if (s && el.contains(s)) s.classList.add("survol");
    }
  };
  const lache = (e) => {
    const d = drag; arreter(); if (!d || !d.fant) return;
    ignoreClic = true; setTimeout(() => { ignoreClic = false; }, 60);
    const s = document.elementFromPoint(e.clientX, e.clientY)?.closest(".gl-case");
    if (s && el.contains(s)) place(d.e, +s.dataset.c);
    render();
  };
  const arreter = () => {
    if (drag?.fant) drag.fant.remove();
    drag = null;
    window.removeEventListener("pointermove", bouge); window.removeEventListener("pointerup", lache); window.removeEventListener("pointercancel", arreter);
  };
  const appui = (e) => {
    const b = e.target.closest(".gl-etq"); if (!b || sol) return;
    drag = { e: +b.dataset.e, x: e.clientX, y: e.clientY, src: b, fant: null };
    window.addEventListener("pointermove", bouge); window.addEventListener("pointerup", lache); window.addEventListener("pointercancel", arreter);
  };
  el.addEventListener("pointerdown", appui);
  // Saisie : on retient le texte sans redessiner (le clavier reste ouvert) ; la case perd sa couleur dès qu'on la modifie.
  el.oninput = (e) => {
    const i = e.target.closest(".gl-saisie"); if (!i) return;
    rep[+i.dataset.c].val = i.value; i.classList.remove("good", "bad", "presque"); i.parentElement.querySelector(".gl-ortho")?.remove();
  };
  el.onkeydown = (e) => {
    const i = e.target.closest(".gl-saisie"); if (!i || e.key !== "Enter") return;
    e.preventDefault();
    const tous = [...el.querySelectorAll(".gl-saisie")], suiv = tous[tous.indexOf(i) + 1];
    if (suiv) suiv.focus(); else { i.blur(); verif = true; render(); }
  };
  el.onclick = (e) => {
    if (ignoreClic) { ignoreClic = false; return; }
    if (surNiveau(e, (n) => { niv = n; fabriquer(); render(); })) return;
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.e != null) { sel = sel === +b.dataset.e ? null : +b.dataset.e; return render(); }
    if (b.dataset.c != null) { const c = +b.dataset.c; if (sel != null) place(sel, c); else retirer(c); return render(); }
    if (b.dataset.mode) { mode = b.dataset.mode; fabriquer(); }
    if (b.dataset.saisie) { saisie = b.dataset.saisie; preparer(); }
    if (b.id === "intrus") { avecIntrus = !avecIntrus; preparer(); }
    if (b.id === "codage") avecCodage = !avecCodage;
    if (b.id === "verif") verif = true;
    if (b.id === "sol") { sol = true; sel = null; }
    if (b.id === "eff") preparer();
    if (b.id === "nouv") fabriquer();
    render();
  };
  fabriquer(); render();
  return () => { arreter(); el.removeEventListener("pointerdown", appui); el.onclick = null; el.oninput = null; el.onkeydown = null; };
}

export const GEO_ETIQUETTES = [
  { id: "geo-legende", nom: "Légender les figures", icone: "🏷️", couleur: "#ffe3ec", desc: "Figures, solides, côté, sommet, arête… : étiquettes à placer ou noms à écrire", mount: legende },
];
