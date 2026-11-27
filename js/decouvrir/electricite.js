// À découvrir · Sciences : l'électricité (CE1 → CM2).
// Établi de circuits (vue réaliste / schéma normalisé, même circuit), défis vérifiés par simulation,
// symboles normalisés (explorer, associer, quiz, compléter un schéma), conducteurs et isolants.
// Simulation : analyse nodale (piles = source + petite résistance interne, lampes/moteur/buzzer = résistances,
// DEL = diode à seuil, interrupteur fermé et fils = liaison parfaite). Court-circuit = bornes d'une pile reliées sans rien entre elles.
import { esc, shuffle, niveauxHTML, niveauMemo, bravo, dragEtiquettes, clicApresDrag, scoreHTML } from "./kit.js";
import { SYMBOLES, OBJETS, ICONES, DANGERS } from "../data/decouvrir/elec-donnees.js";

// ---------- Grille ----------
const S = 100, M = 50, COLS = 8, ROWS = 5, VW = COLS * S + 2 * M, VH = ROWS * S + 2 * M;
const COUL = ["#e0463c", "#2b2b2b", "#2f7de1", "#f2b705", "#2fa35a"];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const bouts = (k) => { const [i, j] = k.slice(1).split(",").map(Number); return [[i, j], k[0] === "h" ? [i + 1, j] : [i, j + 1]]; };
const nid = ([i, j]) => j * (COLS + 1) + i;
const segKey = (a, b) => (a[1] === b[1] ? `h${Math.min(a[0], b[0])},${a[1]}` : `v${a[0]},${Math.min(a[1], b[1])}`);
const chemin = (a, b) => { const out = []; let [i, j] = a; while (i !== b[0] || j !== b[1]) { const n = [i + Math.sign(b[0] - i), j + Math.sign(b[1] - j)]; out.push(segKey([i, j], n)); [i, j] = n; } return out; };
const milieu = (k) => { const [[i, j], [i2, j2]] = bouts(k); return [M + ((i + i2) / 2) * S, M + ((j + j2) / 2) * S]; };

export const TYPES = {
  pile: { nom: "Pile plate 4,5 V", court: "Pile", V: 4.5, r: 0.4 },
  ronde: { nom: "Pile ronde 1,5 V", court: "Pile ronde", V: 1.5, r: 0.4 },
  lampe: { nom: "Lampe", court: "Lampe", R: 15 },
  inter: { nom: "Interrupteur", court: "Interrupteur" },
  moteur: { nom: "Moteur", court: "Moteur", R: 12 },
  del: { nom: "DEL", court: "DEL", R: 50, Vf: 1.8 },
  buzzer: { nom: "Buzzer", court: "Buzzer", R: 40 },
};
const PALETTES = { CE1: ["pile", "lampe", "inter"], CE2: ["pile", "lampe", "inter", "moteur", "buzzer"], CM1: ["pile", "ronde", "lampe", "inter", "moteur", "del", "buzzer"], CM2: ["pile", "ronde", "lampe", "inter", "moteur", "del", "buzzer"] };

// ---------- Circuit ----------
const vide = () => ({ comps: [], fils: {}, nc: 1, ns: 1 });
const copie = (st) => JSON.parse(JSON.stringify(st));
function poser(st, t, e, o = {}) {
  delete st.fils[e];
  const c = { id: st.nc++, t, e, inv: !!o.inv };
  if (t === "inter") c.ouvert = o.ouvert ?? true;
  if (t === "lampe" && o.devisse) c.devisse = true;
  st.comps.push(c); return c;
}
// Circuit décrit en abrégé : w = tracés de fils "x,y x,y …", c = "type arête [i=inversé o=ouvert f=fermé d=dévissée]".
export function circuit(spec) {
  const st = vide();
  (spec.w || []).forEach((w) => {
    const pts = w.split(" ").map((p) => p.split(",").map(Number)); const s = st.ns++;
    for (let k = 1; k < pts.length; k++) chemin(pts[k - 1], pts[k]).forEach((key) => { st.fils[key] = { s, c: (s - 1) % COUL.length }; });
  });
  (spec.c || []).forEach((d) => { const [t, e, f = ""] = d.split(" "); poser(st, t, e, { inv: f.includes("i"), ouvert: f.includes("o") ? true : t === "inter" ? false : undefined, devisse: f.includes("d") }); });
  return st;
}
const compSur = (st, e) => st.comps.find((c) => c.e === e);

// ---------- Simulation ----------
function resoudre(A, b) {
  const n = b.length, x = new Array(n).fill(0);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-15) continue;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; if (!f) continue; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
  }
  for (let r = n - 1; r >= 0; r--) { let s = b[r]; for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]; x[r] = Math.abs(A[r][r]) < 1e-15 ? 0 : s / A[r][r]; }
  return x;
}
export function simuler(st) {
  const N = (COLS + 1) * (ROWS + 1), par = [...Array(N).keys()];
  const f = (x) => (par[x] === x ? x : (par[x] = f(par[x])));
  const u = (a, b) => { par[f(a)] = f(b); };
  for (const k in st.fils) { const [a, b] = bouts(k); u(nid(a), nid(b)); }
  st.comps.forEach((c) => { if (c.t === "inter" && !c.ouvert) { const [a, b] = bouts(c.e); u(nid(a), nid(b)); } });
  const res = { c: {}, cc: false, ccPiles: [] }, els = [];
  st.comps.forEach((c) => {
    const r = (res.c[c.id] = { V: 0, I: 0, b: 0, marche: false, court: false });
    if (!TYPES[c.t] || c.t === "inter") return;
    const [A, B] = bouts(c.e), a = f(nid(A)), b = f(nid(B));
    if (a === b) { r.court = true; if (TYPES[c.t].V) { res.cc = true; res.ccPiles.push(c.id); } return; }
    if ((c.t === "lampe" && (c.devisse || c.grille)) || (c.t === "del" && c.grille)) return;
    els.push({ c, a, b });
  });
  const idx = new Map(); els.forEach((e) => [e.a, e.b].forEach((n) => { if (!idx.has(n)) idx.set(n, idx.size); }));
  const n = idx.size, dels = els.filter((e) => e.c.t === "del");
  let V = new Array(n).fill(0);
  const ak = (e) => (e.c.inv ? [idx.get(e.b), idx.get(e.a)] : [idx.get(e.a), idx.get(e.b)]); // DEL : [anode, cathode]
  for (let it = 0; it < 30 && n; it++) {
    const G = Array.from({ length: n }, () => new Array(n).fill(0)), rhs = new Array(n).fill(0);
    for (let i = 0; i < n; i++) G[i][i] = 1e-7;
    const stamp = (a, b, g) => { G[a][a] += g; G[b][b] += g; G[a][b] -= g; G[b][a] -= g; };
    els.forEach((e) => {
      const a = idx.get(e.a), b = idx.get(e.b), T = TYPES[e.c.t];
      if (T.V) { const [p, m] = e.c.inv ? [a, b] : [b, a], g = 1 / T.r; stamp(p, m, g); rhs[p] += T.V * g; rhs[m] -= T.V * g; }
      else if (e.c.t === "del") { const [an, ca] = ak(e); if (e.on) { const g = 1 / T.R; stamp(an, ca, g); rhs[an] += T.Vf * g; rhs[ca] -= T.Vf * g; } else stamp(an, ca, 1e-7); }
      else stamp(a, b, 1 / T.R);
    });
    V = resoudre(G, rhs);
    let change = false;
    dels.forEach((e) => { const [an, ca] = ak(e), vd = V[an] - V[ca]; if (e.on && vd < TYPES.del.Vf - 1e-9) { e.on = false; change = true; } else if (!e.on && vd > TYPES.del.Vf + 1e-6) { e.on = true; change = true; } });
    if (!change) break;
  }
  els.forEach((e) => {
    const T = TYPES[e.c.t], r = res.c[e.c.id], vab = V[idx.get(e.a)] - V[idx.get(e.b)];
    r.V = vab;
    if (T.V) { const vp = e.c.inv ? vab : -vab; r.I = (T.V - vp) / T.r; if (Math.abs(r.I) > (0.5 * T.V) / T.r) { res.cc = true; res.ccPiles.push(e.c.id); } }
    else if (e.c.t === "del") { const vd = e.c.inv ? -vab : vab; r.I = e.on ? Math.max(0, (vd - T.Vf) / T.R) : 0; r.b = Math.min(1.4, r.I / 0.035); r.marche = r.I > 0.002; r.sens = e.c.inv ? -1 : 1; }
    else {
      r.I = vab / T.R; r.sens = Math.sign(vab);
      if (e.c.t === "lampe") { r.b = (vab / 4.5) ** 2; r.marche = Math.abs(vab) > 0.8; }
      if (e.c.t === "moteur") { r.marche = Math.abs(vab) > 0.6; r.b = Math.abs(vab) / 4.5; r.tour = Math.sign(vab) * (e.c.inv ? -1 : 1); }
      if (e.c.t === "buzzer") r.marche = Math.abs(vab) > 1;
    }
  });
  return res;
}

// ---------- Dessin ----------
// Un composant posé sur une arête : repère local, bornes en x = ±50 (axe de l'arête), y perpendiculaire.
const LEAD_R = "#8a8f99", INK = "#26222f";
function dessinComp(c, r, vue, cx, cy, vert, o = {}) {
  const g = (x, y) => (vert ? [cx - y, cy + x] : [cx + x, cy + y]);
  const T = (x, y, txt, k = "") => { const [X, Y] = g(x, y); return `<text x="${X.toFixed(1)}" y="${Y.toFixed(1)}" class="el-t ${k}">${txt}</text>`; };
  const R = vue === "reel", pol = c.inv ? -1 : 1, on = !!r?.marche;
  const lead = (x1, x2) => (R ? `<line x1="${x1}" y1="0" x2="${x2}" y2="0" stroke="${LEAD_R}" stroke-width="5" stroke-linecap="round"/>` : `<line x1="${x1}" y1="0" x2="${x2}" y2="0" class="el-sw"/>`);
  let s = "", l = "", m = ""; // s : formes (repère local), m : formes miroir (sens), l : textes (repère global)
  const k = Math.min(1, Math.sqrt(Math.max(0, r?.b || 0)));
  switch (c.t) {
    case "pile":
    case "ronde": {
      const plate = c.t === "pile";
      if (R && plate) {
        m = `<rect x="38" y="-5" width="13" height="10" rx="2" fill="#e2bd55" stroke="#a07f26" stroke-width="2"/><rect x="-51" y="-5" width="30" height="10" rx="2" fill="#e2bd55" stroke="#a07f26" stroke-width="2"/>
          <rect x="-22" y="-27" width="60" height="54" rx="7" fill="#2f5fb8" stroke="#1d3f80" stroke-width="3"/><rect x="-22" y="-8" width="60" height="16" fill="#f2c230"/>`;
        l = T(pol * 45, -17, "+", "el-plus") + T(-pol * 38, -17, "−", "el-moins") + T(pol * 8, 1, "4,5 V", "el-volt");
      } else if (R) {
        m = `${lead(-50, -34)}${lead(31, 50)}<rect x="-35" y="-16" width="60" height="32" rx="6" fill="#3a3a44" stroke="#1d1d24" stroke-width="2.5"/><rect x="11" y="-16" width="14" height="32" fill="#d9822b"/><rect x="25" y="-7" width="7" height="14" rx="2" fill="#c3c7cf" stroke="#7d848f" stroke-width="1.5"/>`;
        l = T(pol * 42, -18, "+", "el-plus") + T(-pol * 12, 1, "1,5 V", "el-volt w");
      } else {
        m = `${lead(-50, -7)}${lead(7, 50)}<line x1="7" y1="-24" x2="7" y2="24" stroke="${INK}" stroke-width="4"/><line x1="-7" y1="-12" x2="-7" y2="12" stroke="${INK}" stroke-width="11"/>`;
        l = T(pol * 22, -24, "+", "el-plus s") + T(0, 34, plate ? "4,5 V" : "1,5 V", "el-mini-t");
      }
      if (o.cc) s += `<circle r="44" class="el-chaud"/>`;
      break;
    }
    case "lampe": {
      const casse = c.grille, dev = c.devisse;
      if (R) {
        s = `${lead(-50, -16)}${lead(16, 50)}<rect x="-19" y="-5" width="38" height="16" rx="4" fill="#cfd4dc" stroke="#8a8f99" stroke-width="2.5"/>`;
        const halo = !casse && !dev && k > 0.05 ? `<circle cx="0" cy="-36" r="${26 + 26 * k}" fill="#ffe066" opacity="${(0.25 * k).toFixed(2)}"/><circle cx="0" cy="-36" r="${22 + 12 * k}" fill="#ffd23a" opacity="${(0.4 * k).toFixed(2)}"/>` : "";
        const verre = casse ? "#d9d9de" : k > 0.05 ? `rgb(255,${Math.round(250 - 40 * k)},${Math.round(225 - 175 * k)})` : "#eef6ff";
        const fila = casse ? `<path d="M-6,-18 L-6,-30 l3,-4 M6,-18 L6,-30 l-2,-5" stroke="#555" stroke-width="2" fill="none"/>` : `<path d="M-6,-18 L-6,-30 l3,-5 3,5 3,-5 3,5 L6,-18" stroke="${k > 0.05 ? "#ff8a00" : "#6b6b6b"}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`;
        s += `<g transform="${dev ? "translate(10,-14) rotate(18)" : ""}">${halo}<rect x="-9" y="-17" width="18" height="13" rx="2" fill="#b9bec7" stroke="#7d848f" stroke-width="1.5"/><path d="M-9,-13 H9 M-9,-9 H9" stroke="#7d848f" stroke-width="1.3"/>
          <circle cx="0" cy="-36" r="20" fill="${verre}" stroke="${casse ? "#888" : "#9fb3c8"}" stroke-width="2"/>${fila}<path d="M-11,-44 Q-12,-50 -6,-53" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
      } else {
        const fond = !casse && !dev && k > 0.05 ? `<circle r="${22 + 16 * k}" fill="#ffe066" opacity="${(0.45 * k).toFixed(2)}"/>` : "";
        s = `${lead(-50, -20)}${lead(20, 50)}${fond}<circle r="20" fill="${k > 0.05 && !casse && !dev ? "#fff3b0" : "#fff"}" class="el-sw${dev ? " el-pointille" : ""}"/><path d="M-14,-14 L14,14 M14,-14 L-14,14" class="el-sw"/>`;
      }
      if (dev) l += T(0, R ? 26 : 32, "dévissée", "el-etat");
      if (casse) l += T(0, R ? 26 : 32, "grillée", "el-etat rouge");
      break;
    }
    case "inter": {
      const ouv = c.ouvert;
      if (R) s = `${lead(-50, -24)}${lead(24, 50)}<rect x="-32" y="-11" width="64" height="24" rx="6" fill="#e2b97f" stroke="#b98b4e" stroke-width="2.5"/><circle cx="-22" cy="0" r="5" fill="#8a8f99"/><circle cx="22" cy="0" r="5" fill="#8a8f99"/>
          <g transform="rotate(${ouv ? -34 : 0} -22 0)"><line x1="-22" y1="0" x2="26" y2="0" stroke="#b87333" stroke-width="7" stroke-linecap="round"/><circle cx="14" cy="0" r="7" fill="#e0463c" stroke="#a8322a" stroke-width="2"/></g>`;
      else s = `${lead(-50, -22)}${lead(22, 50)}<circle cx="-22" cy="0" r="4" fill="${INK}"/><circle cx="22" cy="0" r="4" fill="${INK}"/>${ouv ? `<line x1="-22" y1="0" x2="18" y2="-24" class="el-sw"/>` : `<line x1="-22" y1="0" x2="22" y2="0" class="el-sw"/>`}`;
      if (!o.sansEtat) l = T(0, R ? 28 : 24, ouv ? "ouvert" : "fermé", "el-etat");
      break;
    }
    case "moteur": {
      const tour = on ? r.tour : 0, dur = on ? (0.9 / Math.max(0.25, Math.min(3, r.b))).toFixed(2) : 1;
      const rot = `class="el-rot${on ? " on" : ""}" style="animation-duration:${dur}s;animation-direction:${tour < 0 ? "reverse" : "normal"}"`;
      if (R) {
        m = `${lead(-50, -24)}${lead(24, 50)}<circle cx="24" cy="0" r="4" fill="#e0463c"/><circle cx="-24" cy="0" r="4" fill="#2b2b2b"/>`;
        s = `<rect x="-24" y="-17" width="48" height="34" rx="9" fill="#c9cdd4" stroke="#7d848f" stroke-width="2.5"/><rect x="-24" y="-17" width="10" height="34" rx="4" fill="#aeb3bc"/><line x1="0" y1="-17" x2="0" y2="-28" stroke="#555" stroke-width="4"/>
          <g transform="translate(0,-42)"><g ${rot}><circle r="17" fill="#fff" stroke="#555" stroke-width="2.5"/><path d="M0,0 L0,-17 A17,17 0 0 1 17,0 Z" fill="#e0463c"/><path d="M0,0 L0,17 A17,17 0 0 1 -17,0 Z" fill="#2f7de1"/><circle r="3" fill="#555"/></g></g>`;
      } else {
        s = `${lead(-50, -20)}${lead(20, 50)}<circle r="20" fill="#fff" class="el-sw"/>`;
        l = T(0, 1, "M", "el-m");
      }
      if (on) l += T(R ? 30 : 0, R ? -50 : -32, tour > 0 ? "↻" : "↺", "el-tour");
      break;
    }
    case "del": {
      const casse = c.grille;
      if (R) {
        const halo = on ? `<circle cx="0" cy="-17" r="${20 + 14 * k}" fill="#ff4d4d" opacity="${(0.3 * k).toFixed(2)}"/>` : "";
        m = `<path d="M-50,0 L-26,0 L-19,9 L-6,9 L-6,-3" stroke="${LEAD_R}" stroke-width="4" fill="none" stroke-linejoin="round"/><path d="M50,0 L6,0 L6,-3" stroke="${LEAD_R}" stroke-width="4" fill="none"/>
          ${halo}<rect x="-15" y="-6" width="27" height="5" rx="1.5" fill="${on ? "#ff3030" : "#c94b4b"}"/><path d="M-12,-4 L-12,-21 A12,12 0 0 1 12,-21 L12,-4 Z" fill="${casse ? "#8a6a6a" : on ? "#ff2a2a" : "#e07a7a"}" stroke="#a02020" stroke-width="2"/><path d="M-6,-24 Q-6,-29 -2,-30" stroke="#fff" stroke-width="2.5" fill="none" opacity=".8"/>`;
        l = T(-pol * 38, -14, "+", "el-plus");
      } else {
        m = `${lead(-50, -12)}${lead(12, 50)}<path d="M-12,-15 L-12,15 L12,0 Z" fill="${on ? "#ff6b6b" : "#fff"}" class="el-sw"/><path d="M12,-15 V15" class="el-sw"/>
          <path d="M0,-18 L9,-29 M4,-29 L9,-29 L9,-24 M10,-12 L19,-23 M14,-23 L19,-23 L19,-18" stroke="${on ? "#e0463c" : INK}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      if (casse) l += T(0, 30, "grillée", "el-etat rouge");
      break;
    }
    case "buzzer": {
      const ondes = on ? `<g class="el-onde"><path d="M-26,-30 A30,30 0 0 1 -18,-44 M26,-30 A30,30 0 0 0 18,-44" stroke="#7a6cf0" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M-36,-30 A40,40 0 0 1 -26,-50 M36,-30 A40,40 0 0 0 26,-50" stroke="#7a6cf0" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>` : "";
      if (R) s = `${lead(-50, -16)}${lead(16, 50)}${ondes}<circle cx="0" cy="-8" r="21" fill="#2b2b30" stroke="#111" stroke-width="2"/><circle cx="0" cy="-8" r="6" fill="#555"/><path d="M-12,-20 Q-6,-26 2,-26" stroke="#666" stroke-width="2.5" fill="none"/>`;
      else s = `${lead(-50, -18)}${lead(18, 50)}${ondes}<path d="M-18,0 A18,18 0 0 1 18,0 Z" fill="#fff" class="el-sw"/>`;
      if (on) l += T(0, R ? 28 : 22, "bzzz", "el-etat violet");
      break;
    }
    case "trou":
      s = `${lead(-50, -28)}${lead(28, 50)}<rect x="-28" y="-28" width="56" height="56" rx="10" class="el-trou" data-cible="trou"/>`;
      l = T(0, 2, "?", "el-q");
      break;
    case "fil":
      s = R ? `<path d="M-50,0 C-25,-34 25,34 50,0" stroke="#0004" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M-50,0 C-25,-34 25,34 50,0" stroke="#e0463c" stroke-width="8" fill="none" stroke-linecap="round"/>` : `<line x1="-50" y1="0" x2="50" y2="0" class="el-sw"/>`;
      break;
  }
  if (o.num) { const [X, Y] = g(R && c.t === "lampe" ? 30 : 34, R && c.t === "lampe" ? -54 : -34); l += `<g class="el-num"><circle cx="${X}" cy="${Y}" r="13"/><text x="${X}" y="${Y}" class="el-t">${o.num}</text></g>`; }
  if (o.fleche) { const [x1, y1] = g(-o.fleche * 18, 40), [x2, y2] = g(o.fleche * 18, 40); l += `<path d="M${x1},${y1} L${x2},${y2}" class="el-fleche" marker-end="url(#el-pointe)"/>`; }
  const fond = `<rect x="-50" y="-58" width="100" height="92" fill="transparent"/>`;
  const halo = o.sel ? `<rect x="-54" y="-62" width="108" height="100" rx="16" class="el-selr"/>` : o.court ? `<rect x="-52" y="-50" width="104" height="80" rx="14" class="el-courtr"/>` : "";
  return `<g class="el-c${o.cls ? " " + o.cls : ""}" data-c="${c.id ?? ""}"><g transform="translate(${cx},${cy})${vert ? " rotate(90)" : ""}">${fond}${halo}${s}${m ? `<g transform="scale(${pol},1)">${m}</g>` : ""}</g>${l}</g>`;
}
const DEFS = `<defs><marker id="el-pointe" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#e0463c"/></marker></defs>`;

// Petit dessin isolé d'un composant (palette, cartes de symboles).
function mini(t, vue, o = {}) {
  const c = { id: "", t, inv: !!o.inv, ouvert: o.ouvert ?? true };
  const r = o.allume ? { marche: true, b: 0.9, tour: 1 } : null;
  return `<svg viewBox="-58 -64 116 104" class="el-mini" aria-hidden="true">${dessinComp(c, r, vue, 0, 0, false, { sansEtat: true })}</svg>`;
}

// Le plateau complet : fond, grille, fils, composants, bornes.
function dessinPlateau(st, sim, vue, o = {}) {
  const R = vue === "reel", deg = new Map(), inc = (n) => deg.set(nid(n), (deg.get(nid(n)) || 0) + 1);
  for (const k in st.fils) bouts(k).forEach(inc);
  st.comps.forEach((c) => bouts(c.e).forEach(inc));
  let out = DEFS;
  if (!o.crop) {
    out += `<rect width="${VW}" height="${VH}" class="el-fond ${vue}"/>`;
    for (let j = 0; j <= ROWS; j++) for (let i = 0; i <= COLS; i++) out += `<circle cx="${M + i * S}" cy="${M + j * S}" r="${R ? 4 : 3.5}" class="el-point"/>`;
  }
  if (o.placing) {
    const libres = [];
    for (let j = 0; j <= ROWS; j++) for (let i = 0; i < COLS; i++) libres.push(`h${i},${j}`);
    for (let j = 0; j < ROWS; j++) for (let i = 0; i <= COLS; i++) libres.push(`v${i},${j}`);
    libres.filter((k) => !compSur(st, k)).forEach((k) => { const [x, y] = milieu(k), h = k[0] === "h"; out += `<rect x="${x - (h ? 30 : 7)}" y="${y - (h ? 7 : 30)}" width="${h ? 60 : 14}" height="${h ? 14 : 60}" rx="7" class="el-slot${k === o.survol ? " on" : ""}"/>`; });
  }
  // fils : chaque segment de la grille. Vue réaliste : gaine colorée (deux passes pour des jonctions propres).
  const segs = Object.entries(st.fils).map(([k, f]) => { const [[i, j], [i2, j2]] = bouts(k); return { k, f, x1: M + i * S, y1: M + j * S, x2: M + i2 * S, y2: M + j2 * S }; });
  const ln = (s, a) => `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" ${a}/>`;
  if (R) { out += segs.map((s) => ln(s, `stroke="#0005" stroke-width="14" stroke-linecap="round"`)).join(""); out += segs.map((s) => ln(s, `stroke="${COUL[s.f.c]}" stroke-width="9" stroke-linecap="round"`)).join(""); }
  else out += segs.map((s) => ln(s, `class="el-sw"`)).join("");
  if (o.selFil) out += segs.filter((s) => s.f.s === o.selFil).map((s) => ln(s, `class="el-selfil"`)).join("");
  // composants (numérotés quand il y en a plusieurs du même type)
  const parType = {}; st.comps.forEach((c) => { (parType[c.t] ||= []).push(c.id); });
  st.comps.forEach((c) => {
    const [x, y] = milieu(c.e), r = sim?.c[c.id], liste = parType[c.t];
    const fl = o.courant && r && !TYPES[c.t]?.V && c.t !== "inter" && Math.abs(r.I) > 0.002 ? (c.t === "del" ? r.sens : Math.sign(r.I)) : 0;
    out += dessinComp(c, r, vue, x, y, c.e[0] === "v", { sel: o.sel === c.id, court: r?.court && !TYPES[c.t]?.V && c.t !== "inter", cc: sim?.ccPiles.includes(c.id), num: liste.length > 1 && c.t !== "trou" ? liste.indexOf(c.id) + 1 : 0, fleche: fl, cls: o.cache === c.id ? "el-cache" : "" });
  });
  // bornes (réaliste) ou points de jonction (schéma)
  deg.forEach((d, n) => { const x = M + (n % (COLS + 1)) * S, y = M + Math.floor(n / (COLS + 1)) * S; if (R) out += `<circle cx="${x}" cy="${y}" r="8" class="el-borne"/>`; else if (d >= 3) out += `<circle cx="${x}" cy="${y}" r="7" fill="${INK}"/>`; });
  if (o.pending) out += `<circle cx="${M + o.pending[0] * S}" cy="${M + o.pending[1] * S}" r="18" class="el-pend"/>`;
  return out;
}
// Vue recadrée sur le circuit (pour les schémas à compléter).
function svgCircuit(st, sim, vue, cls = "") {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  [...Object.keys(st.fils), ...st.comps.map((c) => c.e)].forEach((k) => bouts(k).forEach(([i, j]) => { const x = M + i * S, y = M + j * S; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }));
  const p = 70;
  return `<svg viewBox="${x0 - p} ${y0 - p} ${x1 - x0 + 2 * p} ${y1 - y0 + 2 * p}" class="el-schema ${cls}">${dessinPlateau(st, sim, vue, { crop: true })}</svg>`;
}

// ---------- Carte « Danger » (commune) ----------
const dangerHTML = () => `<div class="el-danger" role="dialog" aria-label="Les dangers de l'électricité"><div class="el-danger-box"><button class="el-x rc-keep" data-act="danger-x" aria-label="Fermer">✕</button>
  <h3>⚠️ L'électricité, c'est dangereux !</h3><ul>${DANGERS.map(([i, t]) => `<li><span>${i}</span><p>${t}</p></li>`).join("")}</ul></div></div>`;
const ouvrirDanger = (el) => { const r = el.querySelector(".el-root"); if (!r.querySelector(".el-danger")) r.insertAdjacentHTML("beforeend", dangerHTML()); };
const fermerDanger = (el) => el.querySelector(".el-danger")?.remove();

// ---------- Défis ----------
const RECT = "1,1 5,1 5,4 1,4 1,1", RECT2 = "1,1 6,1 6,4 1,4 1,1";
const MSG_CC = "Court-circuit ! Un fil relie les deux bornes de la pile sans passer par un composant. Retire ce fil.";
const nb = (st, t) => st.comps.filter((c) => c.t === t).length;
const de = (st, t) => st.comps.filter((c) => c.t === t);
const marche = (s, c) => !!s.c[c.id]?.marche;
const varier = (st, f) => { const x = copie(st); f(x); return [x, simuler(x)]; };
const toutFerme = (x) => x.comps.forEach((c) => { if (c.t === "inter") c.ouvert = false; });
const ouvrirSeul = (id) => (x) => x.comps.forEach((c) => { if (c.t === "inter") c.ouvert = c.id === id; });
const devisser = (id) => (x) => { toutFerme(x); x.comps.forEach((c) => { if (c.id === id) c.devisse = true; }); };
// « t commandé par un interrupteur » : interrupteurs fermés → marche ; chaque interrupteur ouvert seul → arrêt.
function commande(st, t, nom) {
  if (!nb(st, "inter")) return "Ajoute un interrupteur (pose-le à la place d'un morceau de fil).";
  const [, s] = varier(st, toutFerme); if (s.cc) return MSG_CC;
  if (!de(st, t).length) return `Il manque ${nom}.`;
  if (!de(st, t).every((c) => marche(s, c))) return `Quand l'interrupteur est fermé, ${nom} doit fonctionner. Le courant doit faire une boucle complète depuis la borne + de la pile jusqu'à sa borne −.`;
  for (const i of de(st, "inter")) { const [x, s2] = varier(st, ouvrirSeul(i.id)); if (de(x, t).some((c) => marche(s2, c))) return `Quand on ouvre l'interrupteur, ${nom} continue de fonctionner : l'interrupteur doit être sur le chemin du courant.`; }
  return true;
}
export const DEFIS = [
  { id: "allume", niv: ["CE1", "CE2"], titre: "Allume la lampe", consigne: "Avec la pile, une lampe et des fils, allume la lampe.", p: ["pile", "lampe"], sol: { w: [RECT], c: ["pile v1,2", "lampe h3,1"] },
    test: (st, s) => (!nb(st, "lampe") ? "Pose une lampe." : s.cc ? MSG_CC : de(st, "lampe").some((c) => marche(s, c)) ? true : "La lampe est éteinte : le courant doit faire une boucle fermée, de la borne + de la pile à sa borne −, en passant par la lampe.") },
  { id: "panne", niv: ["CE1", "CE2"], titre: "Trouve la panne (1)", consigne: "La lampe ne s'allume pas. Trouve pourquoi et répare le circuit.", depart: { w: ["1,1 5,1 5,4 3,4", "2,4 1,4 1,1"], c: ["pile v1,2", "lampe h3,1"] }, sol: { w: [RECT], c: ["pile v1,2", "lampe h3,1"] },
    test: (st, s) => (s.cc ? MSG_CC : de(st, "lampe").some((c) => marche(s, c)) ? true : "La lampe est toujours éteinte. Regarde bien : le circuit est-il fermé partout ?") },
  { id: "panne2", niv: ["CE1", "CE2"], titre: "Trouve la panne (2)", consigne: "Le circuit est bien fermé, mais la lampe reste éteinte. Touche la lampe pour l'examiner, puis répare.", depart: { w: [RECT], c: ["pile v1,2", "lampe h3,1 d"] }, sol: { w: [RECT], c: ["pile v1,2", "lampe h3,1"] },
    test: (st, s) => (s.cc ? MSG_CC : de(st, "lampe").some((c) => marche(s, c)) ? true : "La lampe est toujours éteinte. Touche-la : est-elle bien vissée ?") },
  { id: "inter", niv: ["CE1", "CE2", "CM1"], titre: "Un interrupteur pour la lampe", consigne: "Ajoute un interrupteur qui allume et éteint la lampe.", p: ["inter"], depart: { w: [RECT], c: ["pile v1,2", "lampe h3,1"] }, sol: { w: [RECT], c: ["pile v1,2", "lampe h3,1", "inter h3,4"] },
    test: (st) => commande(st, "lampe", "la lampe") },
  { id: "moteur", niv: ["CE2"], titre: "Fais tourner le moteur", consigne: "Construis un circuit qui fait tourner le moteur.", p: ["pile", "moteur", "inter"], sol: { w: [RECT], c: ["pile v1,2", "moteur h3,1"] },
    test: (st, s) => (!nb(st, "moteur") ? "Pose un moteur." : s.cc ? MSG_CC : de(st, "moteur").some((c) => marche(s, c)) ? true : "Le moteur ne tourne pas : vérifie que le circuit est fermé (et que l'interrupteur aussi).") },
  { id: "buzzer", niv: ["CE2", "CM1"], titre: "Une sonnette", consigne: "Fais une sonnette : le buzzer sonne quand on ferme l'interrupteur, et s'arrête quand on l'ouvre.", p: ["pile", "buzzer", "inter"], sol: { w: [RECT], c: ["pile v1,2", "buzzer h3,1", "inter h3,4"] },
    test: (st) => (!nb(st, "buzzer") ? "Pose un buzzer." : commande(st, "buzzer", "le buzzer")) },
  { id: "sens", niv: ["CE2", "CM1"], titre: "Le moteur à l'envers", consigne: "Fais tourner le moteur dans l'autre sens, sans ajouter de composant.", p: [], depart: { w: [RECT], c: ["pile v1,2", "moteur h3,1"] }, sol: { w: [RECT], c: ["pile v1,2 i", "moteur h3,1"] },
    test: (st, s, d) => { if (s.cc) return MSG_CC; const m = de(st, "moteur").find((c) => marche(s, c)); if (!m) return "Le moteur ne tourne plus : le circuit doit rester fermé."; return s.c[m.id].tour === -d.tour0 ? true : "Le moteur tourne toujours dans le même sens. Astuce : touche la pile et retourne-la."; } },
  { id: "cc", niv: ["CE2", "CM1"], titre: "Le fil de trop", consigne: "La lampe ne s'allume pas et la pile chauffe : il y a un court-circuit. Retire le fil de trop.", p: [], depart: { w: [RECT, "3,1 3,0 4,0 4,1"], c: ["pile v1,2", "lampe h3,1"] }, sol: { w: [RECT], c: ["pile v1,2", "lampe h3,1"] },
    test: (st, s) => (s.cc ? "Il y a encore un court-circuit : le courant passe par un fil au lieu de passer par la lampe." : de(st, "lampe").some((c) => marche(s, c)) ? true : "Le court-circuit a disparu, mais la lampe est éteinte : le circuit doit rester fermé.") },
  { id: "del", niv: ["CM1", "CM2"], titre: "Allume la DEL", consigne: "La DEL reste éteinte. Fais-la briller !", p: [], depart: { w: [RECT], c: ["pile v1,2", "del h3,1"] }, sol: { w: [RECT], c: ["pile v1,2", "del h3,1 i"] },
    test: (st, s) => (s.cc ? MSG_CC : de(st, "del").some((c) => marche(s, c)) ? true : "La DEL est éteinte : elle ne laisse passer le courant que dans un sens. Touche-la et retourne-la : sa patte + doit être du côté de la borne + de la pile.") },
  { id: "ensemble", niv: ["CM1", "CM2"], titre: "Deux lampes ensemble", consigne: "Deux lampes qui s'allument et s'éteignent en même temps, avec un seul interrupteur.", p: ["pile", "lampe", "inter"], sol: { w: [RECT], c: ["pile v1,2", "lampe h2,1", "lampe h4,1", "inter h3,4"] },
    test: (st) => (nb(st, "lampe") < 2 ? "Il faut deux lampes." : commande(st, "lampe", "chaque lampe")) },
  { id: "serie", niv: ["CM1", "CM2"], titre: "Deux lampes en série", consigne: "Deux lampes dans la même boucle : si on dévisse l'une, l'autre s'éteint aussi.", p: ["pile", "lampe"], sol: { w: [RECT], c: ["pile v1,2", "lampe h2,1", "lampe h4,1"] },
    test: (st) => {
      const L = de(st, "lampe"); if (L.length < 2) return "Il faut deux lampes.";
      const [, s] = varier(st, toutFerme); if (s.cc) return MSG_CC; if (!L.every((c) => marche(s, c))) return "Les deux lampes doivent briller (même faiblement).";
      for (const l of L) { const [x, s2] = varier(st, devisser(l.id)); if (de(x, "lampe").some((c) => c.id !== l.id && marche(s2, c))) return "Si on dévisse une lampe, l'autre reste allumée : tes lampes sont en dérivation. Mets-les l'une après l'autre, dans une seule boucle."; }
      return true;
    } },
  { id: "derivation", niv: ["CM1", "CM2"], titre: "Deux lampes en dérivation", consigne: "Deux lampes : si on dévisse l'une, l'autre reste allumée.", p: ["pile", "lampe"], sol: { w: [RECT2, "4,1 4,4"], c: ["pile v1,2", "lampe v4,2", "lampe v6,2"] },
    test: (st) => {
      const L = de(st, "lampe"); if (L.length < 2) return "Il faut deux lampes.";
      const [, s] = varier(st, toutFerme); if (s.cc) return MSG_CC; if (!L.every((c) => marche(s, c))) return "Les deux lampes doivent briller.";
      for (const l of L) { const [x, s2] = varier(st, devisser(l.id)); if (!de(x, "lampe").every((c) => c.id === l.id || marche(s2, c))) return "Si on dévisse une lampe, l'autre s'éteint : tes lampes sont en série. Chaque lampe doit avoir sa propre boucle avec la pile."; }
      return true;
    } },
  { id: "deux-inter", niv: ["CM2"], titre: "Chacune son interrupteur", consigne: "Deux lampes et deux interrupteurs : chaque interrupteur commande sa lampe, sans éteindre l'autre.", p: ["pile", "lampe", "inter"], sol: { w: [RECT2, "4,1 4,4"], c: ["pile v1,2", "lampe v4,1", "inter v4,3", "lampe v6,1", "inter v6,3"] },
    test: (st) => {
      const L = de(st, "lampe"), I = de(st, "inter"); if (L.length < 2 || I.length < 2) return "Il faut deux lampes et deux interrupteurs.";
      const [, s] = varier(st, toutFerme); if (s.cc) return MSG_CC; if (!L.every((c) => marche(s, c))) return "Quand tous les interrupteurs sont fermés, les deux lampes doivent briller.";
      for (const l of L) { const ok = I.some((i) => { const [, s2] = varier(st, ouvrirSeul(i.id)); return !marche(s2, l) && L.some((o) => o.id !== l.id && marche(s2, o)); }); if (!ok) return "Chaque lampe doit avoir son interrupteur : en l'ouvrant, cette lampe s'éteint et l'autre reste allumée. Essaie deux boucles en dérivation."; }
      return true;
    } },
  { id: "moteur-lampe", niv: ["CM2"], titre: "Moteur et lampe", consigne: "Une lampe toujours allumée, et un moteur commandé par un interrupteur.", p: ["pile", "lampe", "moteur", "inter"], sol: { w: [RECT2, "4,1 4,4"], c: ["pile v1,2", "moteur v4,1", "inter v4,3", "lampe v6,2"] },
    test: (st) => {
      if (!nb(st, "lampe") || !nb(st, "moteur") || !nb(st, "inter")) return "Il faut une lampe, un moteur et un interrupteur.";
      const [, s] = varier(st, toutFerme); if (s.cc) return MSG_CC;
      if (!de(st, "lampe").every((c) => marche(s, c)) || !de(st, "moteur").every((c) => marche(s, c))) return "Interrupteur fermé, la lampe doit briller et le moteur tourner.";
      const ok = de(st, "inter").some((i) => { const [x, s2] = varier(st, ouvrirSeul(i.id)); return de(x, "moteur").every((c) => !marche(s2, c)) && de(x, "lampe").every((c) => marche(s2, c)); });
      return ok ? true : "Quand on ouvre l'interrupteur, le moteur doit s'arrêter et la lampe rester allumée : mets la lampe et le moteur en dérivation.";
    } },
  { id: "piles-rondes", niv: ["CM2"], titre: "Des piles rondes", consigne: "Avec des piles rondes de 1,5 V, fais briller la lampe aussi fort qu'avec une pile plate de 4,5 V.", p: ["ronde", "lampe"], sol: { w: [RECT], c: ["ronde h2,4", "ronde h3,4", "ronde h4,4", "lampe h3,1"] },
    test: (st, s) => {
      if (!nb(st, "ronde")) return "Utilise des piles rondes."; if (s.cc) return MSG_CC;
      const L = de(st, "lampe"); if (!L.length) return "Pose une lampe.";
      const b = Math.max(...L.map((c) => s.c[c.id]?.b || 0));
      return b >= 0.7 ? true : b > 0.03 ? "La lampe brille, mais faiblement : une pile ronde donne 1,5 V. Mets plusieurs piles rondes à la suite (en série), toutes dans le même sens : 1,5 + 1,5 + 1,5 = 4,5 V." : "La lampe est éteinte. Vérifie la boucle et le sens des piles (toutes dans le même sens).";
    } },
];

// ---------- Activité 1 : l'établi des circuits (atelier libre + défis) ----------
const CLE_CIRCUIT = "bagaschool-dk-elec-circuit", CLE_VUE = "bagaschool-dk-elec-vue";
const NOM_ETAT = (c, r) => {
  if (c.t === "inter") return c.ouvert ? "ouvert : le courant ne passe pas" : "fermé : le courant passe";
  if (TYPES[c.t].V) return r?.court ? "court-circuitée !" : Math.abs(r?.I || 0) > 0.002 ? "fait circuler le courant" : "ne débite pas (circuit ouvert)";
  if (c.t === "lampe") return c.grille ? "grillée" : c.devisse ? "dévissée" : r?.court ? "court-circuitée : éteinte" : !r?.marche ? "éteinte" : r.b > 0.6 ? "brille fort" : r.b > 0.15 ? "brille" : "brille faiblement";
  if (c.t === "del") return c.grille ? "grillée" : r?.court ? "court-circuitée : éteinte" : r?.marche ? "allumée" : "éteinte";
  if (c.t === "moteur") return r?.court ? "court-circuité : arrêté" : r?.marche ? (r.tour > 0 ? "tourne (sens des aiguilles d'une montre)" : "tourne (sens inverse)") : "arrêté";
  if (c.t === "buzzer") return r?.court ? "court-circuité : muet" : r?.marche ? "sonne" : "muet";
  return "";
};

function mountCircuits(el, modeInit) {
  const ID = "elec-circuits", NIVS = ["CE1", "CE2", "CM1", "CM2"];
  const niv = niveauMemo(ID, NIVS, "CE2");
  let mode = modeInit, vue = localStorage.getItem(CLE_VUE) || (["CM1", "CM2"].includes(niv.get()) ? "schema" : "reel");
  let stAtelier; try { stAtelier = JSON.parse(localStorage.getItem(CLE_CIRCUIT)); } catch {}
  if (!stAtelier?.comps) stAtelier = circuit({ w: [RECT], c: ["pile v1,2", "lampe h3,1", "inter h3,4"] });
  let st = stAtelier, hist = [], sel = null, selFil = null, pending = null, placing = null, gomme = false, courant = false, survol = null;
  let defi = null, defiInfo = {}, retour = null, faits = new Set(), sim = null, flash = "";
  const defisNiv = () => DEFIS.filter((d) => d.niv.includes(niv.get()));
  const palette = () => (mode === "defis" && defi?.p ? (defi.p.length ? defi.p : []) : PALETTES[niv.get()]);

  el.innerHTML = `<div class="el-root">
    <div class="tool-top el-top">${niveauxHTML(NIVS, niv.get())}
      <div class="seg el-mode" role="group" aria-label="Mode"><button data-mode="atelier">🔧 Atelier libre</button><button data-mode="defis">🏆 Défis</button></div>
      <button class="pill rc-keep" data-act="danger">⚠️ Dangers</button></div>
    <div class="explore el-explore">
      <div class="explore-main el-main rc-board">
        <div class="el-consigne" hidden></div>
        <div class="el-bar"><div class="el-pal"></div>
          <div class="el-outils"><div class="seg el-vue rc-keep" role="group" aria-label="Vue"><button data-vue="reel">📷 Réaliste</button><button data-vue="schema">✏️ Schéma</button></div>
            <button class="el-ou" data-act="gomme" title="Gomme : touche un fil ou un composant pour l'enlever">🧽 Gomme</button><button class="el-ou" data-act="annuler" title="Annuler">↶</button><button class="el-ou" data-act="vider" title="Tout effacer">🗑️</button></div></div>
        <div class="el-defi-bar" hidden><button class="big-btn" data-act="verifier">✔ Vérifier</button><button class="pill" data-act="solution">💡 Solution</button><button class="pill" data-act="recommencer">↺ Recommencer</button><button class="pill" data-act="suivant">Défi suivant →</button></div>
        <div class="el-zone"><div class="el-alerte" aria-live="polite"></div><svg class="el-svg" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Établi : circuit électrique"></svg><div class="el-actions"></div></div>
        <p class="el-aide"></p>
      </div>
      <aside class="explore-card el-card"></aside>
    </div></div>`;
  const svg = el.querySelector(".el-svg"), $ = (s) => el.querySelector(s);

  const memo = () => { hist.push(JSON.stringify(st)); if (hist.length > 60) hist.shift(); };
  const sauver = () => { if (mode === "atelier") localStorage.setItem(CLE_CIRCUIT, JSON.stringify(st)); };
  const change = () => { retour = null; sauver(); rendu(); };

  const chargerDefi = (d) => {
    defi = d; st = d.depart ? circuit(d.depart) : vide(); hist = []; sel = selFil = pending = placing = null; retour = null;
    defiInfo = {}; if (d.id === "sens") { const s0 = simuler(st), m = st.comps.find((c) => c.t === "moteur"); defiInfo.tour0 = s0.c[m.id].tour; }
  };
  const setMode = (m) => {
    mode = m; sel = selFil = pending = placing = null; gomme = false; retour = null; hist = [];
    if (m === "atelier") { st = stAtelier; defi = null; }
    else { const l = defisNiv(); chargerDefi(l.find((d) => !faits.has(d.id)) || l[0]); }
    renduTout();
  };

  const placer = (t, e) => {
    if (compSur(st, e)) { flash = "Cette place est déjà prise."; rendu(); return false; }
    memo(); const c = poser(st, t, e); sel = c.id; selFil = null; placing = null; change(); return true;
  };
  const ajouterFil = (a, b) => {
    if (a[0] === b[0] && a[1] === b[1]) return;
    const routes = a[0] === b[0] || a[1] === b[1] ? [[a, b]] : [[a, [b[0], a[1]], b], [a, [a[0], b[1]], b]];
    const segsDe = (r) => r.slice(1).flatMap((p, i) => chemin(r[i], p));
    const best = routes.map(segsDe).sort((x, y) => x.filter((k) => compSur(st, k)).length - y.filter((k) => compSur(st, k)).length)[0];
    const neufs = best.filter((k) => !compSur(st, k) && !st.fils[k]);
    if (!neufs.length) return;
    memo(); const s = st.ns++; neufs.forEach((k) => { st.fils[k] = { s, c: (s - 1) % COUL.length }; }); change();
  };
  const supprimerComp = (id) => { memo(); st.comps = st.comps.filter((c) => c.id !== id); if (sel === id) sel = null; change(); };
  const supprimerFil = (s) => { memo(); for (const k in st.fils) if (st.fils[k].s === s) delete st.fils[k]; selFil = null; change(); };

  // --- rendu
  const rendu = () => {
    sim = simuler(st);
    let grille = false;
    st.comps.forEach((c) => { const r = sim.c[c.id]; if (c.t === "lampe" && !c.grille && Math.abs(r.V) > 7) { c.grille = grille = true; } if (c.t === "del" && !c.grille && r.I > 0.12) { c.grille = grille = true; } });
    if (grille) { flash = "💥 Trop de piles : ça a grillé ! Touche le composant grillé pour le changer."; sim = simuler(st); sauver(); }
    svg.classList.toggle("schema", vue === "schema"); svg.classList.toggle("gomme", gomme);
    svg.innerHTML = dessinPlateau(st, sim, vue, { sel, selFil, pending, placing, survol, courant });
    // alertes
    const al = [];
    if (sim.cc) al.push(`<div class="el-al rouge">⚡ <b>Court-circuit !</b> Les deux bornes d'une pile sont reliées sans rien entre elles. La pile chauffe et s'abîme : enlève le fil en trop.</div>`);
    const courts = st.comps.filter((c) => sim.c[c.id]?.court && !TYPES[c.t]?.V && c.t !== "inter" && TYPES[c.t]);
    if (courts.length && !sim.cc) al.push(`<div class="el-al orange">⚠️ ${courts.map((c) => esc(nomNum(c))).join(", ")} : court-circuité${courts.length > 1 ? "s" : ""}. Le courant passe par le fil d'à côté au lieu de traverser le composant.</div>`);
    if (flash) { al.push(`<div class="el-al info">${flash}</div>`); flash = ""; }
    $(".el-alerte").innerHTML = al.join("");
    // actions sur la sélection
    const c = st.comps.find((x) => x.id === sel);
    let act = "";
    if (c) {
      const b = [];
      if (c.t === "inter") b.push(`<button data-act="basculer">${c.ouvert ? "🔒 Fermer" : "🔓 Ouvrir"}</button>`);
      if (c.t === "lampe") b.push(c.grille ? `<button data-act="reparer">💡 Changer l'ampoule</button>` : `<button data-act="visser">${c.devisse ? "🔩 Visser" : "🔧 Dévisser"}</button>`);
      if (c.t === "del" && c.grille) b.push(`<button data-act="reparer">💡 Changer la DEL</button>`);
      if (TYPES[c.t]?.V || c.t === "del" || c.t === "moteur") b.push(`<button data-act="retourner">⇄ Retourner</button>`);
      b.push(`<button data-act="retirer">🗑️ Retirer</button>`);
      act = `<b>${esc(nomNum(c))}</b>${b.join("")}<button data-act="desel" aria-label="Fermer">✕</button>`;
    } else if (selFil) act = `<b>Fil</b><button data-act="retirer-fil">🗑️ Retirer ce fil</button><button data-act="desel" aria-label="Fermer">✕</button>`;
    $(".el-actions").innerHTML = act; $(".el-actions").hidden = !act;
    $(".el-aide").innerHTML = placing ? `Touche un emplacement pour poser : <b>${esc(TYPES[placing].nom)}</b>. <button class="pill" data-act="annuler-pose">Annuler</button>` : pending ? "Touche une autre borne pour tirer le fil." : gomme ? "Gomme : touche un fil ou un composant pour l'enlever." : "Touche une borne (un point) puis une autre pour tirer un fil · Glisse un composant sur un fil pour l'y insérer · Touche un composant pour l'utiliser.";
    $(".el-pal").querySelectorAll("[data-t]").forEach((b) => b.classList.toggle("on", b.dataset.t === placing));
    $("[data-act=gomme]").classList.toggle("on", gomme);
    renduCarte();
  };
  const nomNum = (c) => { const l = st.comps.filter((x) => x.t === c.t); return TYPES[c.t].court + (l.length > 1 ? " " + (l.indexOf(c) + 1) : ""); };
  const renduCarte = () => {
    const card = $(".el-card"), n = niv.get();
    if (mode === "defis") {
      const l = defisNiv();
      card.innerHTML = `<h3>🏆 Défis ${n}</h3><ol class="el-defis">${l.map((d) => `<li><button data-defi="${d.id}" class="${d === defi ? "on" : ""}">${faits.has(d.id) ? "✅" : "⬜"} ${esc(d.titre)}</button></li>`).join("")}</ol>
        ${retour ? `<p class="el-retour ${retour.ok ? "ok" : "ko"}">${retour.ok ? "✅ " : "🤔 "}${esc(retour.msg)}</p>` : `<p class="muted">Construis, puis touche <b>Vérifier</b>.</p>`}
        <p class="muted el-astuce">${defi?.p?.length === 0 ? "Pas de nouveau composant : modifie ce qui est déjà là (touche un composant, retire un fil…)." : "Touche une borne puis une autre pour tirer un fil."}</p>`;
      return;
    }
    const pertinents = st.comps.filter((c) => TYPES[c.t]);
    const ferme = pertinents.some((c) => !TYPES[c.t].V && c.t !== "inter" && sim.c[c.id]?.marche);
    const etat = !st.comps.some((c) => TYPES[c.t]?.V) ? "Pose une pile : c'est elle qui fournit l'énergie." : sim.cc ? "⚡ Court-circuit !" : ferme ? "✅ Circuit fermé : le courant circule." : "⭕ Circuit ouvert : le courant ne circule pas.";
    const astuces = {
      CE1: ["Pour qu'une lampe brille, il faut une boucle fermée : pile → fil → lampe → fil → pile.", "Un interrupteur ouvert coupe la boucle : la lampe s'éteint."],
      CE2: ["Le moteur tourne dans l'autre sens si on retourne la pile.", "Si un fil relie directement les deux bornes de la pile, c'est un court-circuit : danger !"],
      CM1: ["Deux lampes en série (dans la même boucle) brillent moins qu'une seule.", "En dérivation, chaque lampe a sa boucle : elles brillent normalement, et si l'une est dévissée, l'autre reste allumée.", "Une DEL ne s'allume que dans un sens : grande patte (+) côté borne + de la pile."],
      CM2: ["Dans un schéma, on utilise les symboles normalisés et des fils bien droits.", "Le courant sort par la borne + de la pile et revient par la borne −.", "Piles en série dans le même sens : leurs tensions s'additionnent (1,5 + 1,5 + 1,5 = 4,5 V)."],
    }[n];
    card.innerHTML = `<h3>${etat}</h3>
      <ul class="el-etats">${pertinents.map((c) => `<li class="${sim.c[c.id]?.marche ? "on" : ""}"><b>${esc(nomNum(c))}</b> : ${NOM_ETAT(c, sim.c[c.id])}</li>`).join("") || "<li class='muted'>Établi vide.</li>"}</ul>
      ${["CM1", "CM2"].includes(n) ? `<label class="check"><input type="checkbox" data-act="courant" ${courant ? "checked" : ""}> Montrer le sens du courant</label>` : ""}
      <h4>Le savais-tu ?</h4><ul class="el-astuces">${astuces.map((a) => `<li>${a}</li>`).join("")}</ul>
      <button class="pill" data-act="exemple">Charger un exemple</button>`;
  };
  const renduTout = () => {
    el.querySelectorAll(".el-mode button").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
    el.querySelectorAll(".el-vue button").forEach((b) => b.classList.toggle("on", b.dataset.vue === vue));
    $(".el-pal").innerHTML = palette().map((t) => `<button class="el-pal-b" data-t="${t}" title="${esc(TYPES[t].nom)}">${mini(t, vue)}<span>${esc(TYPES[t].nom)}</span></button>`).join("") || `<span class="muted">Modifie le circuit existant.</span>`;
    const cons = $(".el-consigne"); cons.hidden = mode !== "defis"; $(".el-defi-bar").hidden = mode !== "defis";
    if (defi) cons.innerHTML = `🏆 <b>${esc(defi.titre)}</b> — ${esc(defi.consigne)}`;
    rendu();
  };

  // --- pointeur sur le plateau
  const pt = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; };
  const noeudPres = (x, y, rad = 0.3) => { const i = Math.round((x - M) / S), j = Math.round((y - M) / S); if (i < 0 || j < 0 || i > COLS || j > ROWS) return null; return Math.hypot(x - M - i * S, y - M - j * S) < rad * S ? [i, j] : null; };
  const noeudProche = (x, y) => [clamp(Math.round((x - M) / S), 0, COLS), clamp(Math.round((y - M) / S), 0, ROWS)];
  const arete = (x, y, max = 0.45) => {
    const fx = (x - M) / S, fy = (y - M) / S, hj = Math.round(fy), hi = Math.floor(fx), vi = Math.round(fx), vj = Math.floor(fy);
    let k = null, d = 9;
    if (hi >= 0 && hi < COLS && hj >= 0 && hj <= ROWS && Math.abs(fy - hj) < d) { k = `h${hi},${hj}`; d = Math.abs(fy - hj); }
    if (vj >= 0 && vj < ROWS && vi >= 0 && vi <= COLS && Math.abs(fx - vi) < d) { k = `v${vi},${vj}`; d = Math.abs(fx - vi); }
    return d <= max ? k : null;
  };
  const apercuFil = (a, b) => { svg.querySelector(".el-apercu")?.remove(); if (!b || (a[0] === b[0] && a[1] === b[1])) return; const P = (n) => `${M + n[0] * S},${M + n[1] * S}`; const pts = a[0] === b[0] || a[1] === b[1] ? [a, b] : [a, [b[0], a[1]], b]; svg.insertAdjacentHTML("beforeend", `<polyline points="${pts.map(P).join(" ")}" class="el-apercu"/>`); };
  let ptr = null;
  const down = (e) => {
    if (e.button > 0) return;
    const [x, y] = pt(e), gc = e.target.closest?.("[data-c]"), cid = gc && gc.dataset.c ? +gc.dataset.c : null;
    const n = noeudPres(x, y), k = arete(x, y);
    ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
    if (placing && !n) { ptr.kind = "pose"; ptr.k = arete(x, y, 0.6); }
    else if (n && !(cid && gomme)) { ptr.kind = "noeud"; ptr.n = n; }
    else if (cid) { ptr.kind = "comp"; ptr.c = st.comps.find((c) => c.id === cid); }
    else if (k && compSur(st, k)) { ptr.kind = "comp"; ptr.c = compSur(st, k); }
    else if (k && st.fils[k]) { ptr.kind = "fil"; ptr.s = st.fils[k].s; }
    else ptr.kind = "vide";
    try { svg.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  };
  const move = (e) => {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (!ptr.moved && Math.hypot(e.clientX - ptr.x0, e.clientY - ptr.y0) > 10) ptr.moved = true;
    if (!ptr.moved) return;
    const [x, y] = pt(e);
    if (ptr.kind === "noeud") apercuFil(ptr.n, noeudProche(x, y));
    if (ptr.kind === "comp" && !gomme) {
      const g = svg.querySelector(`[data-c="${ptr.c.id}"]`), [mx, my] = milieu(ptr.c.e);
      if (g) { g.setAttribute("transform", `translate(${x - mx},${y - my})`); g.classList.add("el-drag"); }
      const k = arete(x, y, 0.6); svg.querySelectorAll(".el-cible").forEach((r) => r.remove());
      if (k && k !== ptr.c.e) { const [cx, cy] = milieu(k), h = k[0] === "h", libre = !compSur(st, k); svg.insertAdjacentHTML("beforeend", `<rect x="${cx - (h ? 40 : 12)}" y="${cy - (h ? 12 : 40)}" width="${h ? 80 : 24}" height="${h ? 24 : 80}" rx="12" class="el-cible ${libre ? "" : "non"}"/>`); }
    }
  };
  const up = (e) => {
    if (!ptr || e.pointerId !== ptr.id) return;
    const p = ptr; ptr = null; const [x, y] = pt(e);
    if (p.kind === "pose") { if (p.k) placer(placing, p.k); else { placing = null; rendu(); } return; }
    if (p.kind === "noeud") {
      if (p.moved) { const b = noeudPres(x, y, 0.45) || noeudProche(x, y); pending = null; apercuFil(); if (b[0] !== p.n[0] || b[1] !== p.n[1]) ajouterFil(p.n, b); else rendu(); return; }
      if (pending && (pending[0] !== p.n[0] || pending[1] !== p.n[1])) { const a = pending; pending = null; ajouterFil(a, p.n); return; }
      pending = pending ? null : p.n; sel = selFil = null; rendu(); return;
    }
    pending = null;
    if (p.kind === "comp") {
      const c = p.c;
      if (gomme) { supprimerComp(c.id); return; }
      if (p.moved) { const k = arete(x, y, 0.6); if (k && k !== c.e && !compSur(st, k)) { memo(); delete st.fils[k]; c.e = k; sel = c.id; change(); } else { if (k && k !== c.e) flash = "Cette place est déjà prise."; rendu(); } return; }
      if (c.t === "inter") { memo(); c.ouvert = !c.ouvert; sel = c.id; selFil = null; change(); return; }
      sel = sel === c.id ? null : c.id; selFil = null; rendu(); return;
    }
    if (p.kind === "fil") { if (gomme) { supprimerFil(p.s); return; } selFil = selFil === p.s ? null : p.s; sel = null; rendu(); return; }
    if (sel || selFil) { sel = selFil = null; rendu(); }
  };
  const cancel = () => { if (ptr) { ptr = null; apercuFil(); rendu(); } };
  svg.addEventListener("pointerdown", down); svg.addEventListener("pointermove", move); svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", cancel);

  // --- glisser depuis la palette
  let pd = null, ignoreClic = false;
  const pdDown = (e) => { const b = e.target.closest?.(".el-pal [data-t]"); if (!b || e.button > 0) return; pd = { t: b.dataset.t, b, x: e.clientX, y: e.clientY, ghost: null }; };
  const pdMove = (e) => {
    if (!pd) return;
    if (!pd.ghost && Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 10) { pd.ghost = pd.b.cloneNode(true); pd.ghost.classList.add("dk-ghost", "el-ghost"); document.body.appendChild(pd.ghost); placing = pd.t; survol = null; rendu(); }
    if (!pd.ghost) return;
    e.preventDefault(); pd.ghost.style.left = e.clientX + "px"; pd.ghost.style.top = e.clientY + "px";
    const r = svg.getBoundingClientRect(), dans = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    const k = dans ? arete(...pt(e), 0.7) : null;
    if (k !== survol) { survol = k; svg.querySelectorAll(".el-slot.on").forEach((s) => s.classList.remove("on")); if (k) { const [cx, cy] = milieu(k); svg.querySelectorAll(".el-slot").forEach((s) => { const sx = +s.getAttribute("x") + +s.getAttribute("width") / 2, sy = +s.getAttribute("y") + +s.getAttribute("height") / 2; if (Math.abs(sx - cx) < 1 && Math.abs(sy - cy) < 1) s.classList.add("on"); }); } }
  };
  const pdUp = () => {
    if (!pd) return; const d = pd; pd = null;
    if (!d.ghost) return;
    d.ghost.remove(); ignoreClic = true; setTimeout(() => { ignoreClic = false; }, 0);
    const k = survol; survol = null;
    if (k) placer(d.t, k); else { placing = null; rendu(); }
  };
  el.addEventListener("pointerdown", pdDown); window.addEventListener("pointermove", pdMove, { passive: false }); window.addEventListener("pointerup", pdUp); window.addEventListener("pointercancel", pdUp);

  // --- boutons
  el.onclick = (e) => {
    const b = e.target.closest("button, input"); if (!b) return;
    if (b.dataset.niv) { niv.set(b.dataset.niv); el.querySelectorAll(".dk-niv button").forEach((x) => x.classList.toggle("on", x === b)); if (mode === "defis") { const l = defisNiv(); chargerDefi(l.find((d) => !faits.has(d.id)) || l[0]); } renduTout(); return; }
    if (b.dataset.mode) { if (b.dataset.mode !== mode) setMode(b.dataset.mode); return; }
    if (b.dataset.vue) { vue = b.dataset.vue; localStorage.setItem(CLE_VUE, vue); renduTout(); return; }
    if (b.dataset.t) { if (ignoreClic) return; placing = placing === b.dataset.t ? null : b.dataset.t; gomme = false; pending = null; rendu(); return; }
    if (b.dataset.defi) { chargerDefi(DEFIS.find((d) => d.id === b.dataset.defi)); renduTout(); return; }
    const c = st.comps.find((x) => x.id === sel);
    switch (b.dataset.act) {
      case "danger": ouvrirDanger(el); break;
      case "danger-x": fermerDanger(el); break;
      case "gomme": gomme = !gomme; placing = pending = null; sel = selFil = null; rendu(); break;
      case "annuler": if (hist.length) { st = JSON.parse(hist.pop()); if (mode === "atelier") stAtelier = st; sel = selFil = null; change(); } break;
      case "vider": if (st.comps.length || Object.keys(st.fils).length) { memo(); st.comps = []; st.fils = {}; sel = selFil = null; change(); } break;
      case "annuler-pose": placing = null; rendu(); break;
      case "desel": sel = selFil = null; rendu(); break;
      case "basculer": memo(); c.ouvert = !c.ouvert; change(); break;
      case "visser": memo(); c.devisse = !c.devisse; change(); break;
      case "reparer": memo(); c.grille = false; change(); break;
      case "retourner": memo(); c.inv = !c.inv; change(); break;
      case "retirer": supprimerComp(c.id); break;
      case "retirer-fil": supprimerFil(selFil); break;
      case "courant": courant = b.checked; rendu(); break;
      case "exemple": memo(); { const ex = { CE1: { w: [RECT], c: ["pile v1,2", "lampe h3,1", "inter h3,4"] }, CE2: { w: [RECT], c: ["pile v1,2", "moteur h3,1", "inter h3,4"] }, CM1: { w: [RECT], c: ["pile v1,2", "lampe h2,1", "lampe h4,1", "inter h3,4"] }, CM2: { w: [RECT2, "4,1 4,4"], c: ["pile v1,2", "lampe v4,2", "lampe v6,2", "inter h2,4"] } }[niv.get()]; st = circuit(ex); stAtelier = st; sel = selFil = null; change(); } break;
      case "verifier": {
        const s = simuler(st), r = defi.test(st, s, defiInfo);
        retour = r === true ? { ok: true, msg: "Bravo, défi réussi !" } : { ok: false, msg: r };
        if (r === true) { faits.add(defi.id); bravo(el, "Défi réussi !"); }
        rendu(); break;
      }
      case "solution": st = circuit(defi.sol); sel = selFil = pending = null; retour = { ok: true, msg: "Voici une solution possible. Observe-la, puis essaie un autre défi." }; rendu(); break;
      case "recommencer": chargerDefi(defi); rendu(); break;
      case "suivant": { const l = defisNiv(), i = l.indexOf(defi); chargerDefi(l[(i + 1) % l.length]); renduTout(); break; }
    }
  };
  if (mode === "defis") { const l = defisNiv(); chargerDefi(l[0]); }
  renduTout();
  return () => {
    svg.removeEventListener("pointerdown", down); svg.removeEventListener("pointermove", move); svg.removeEventListener("pointerup", up); svg.removeEventListener("pointercancel", cancel);
    el.removeEventListener("pointerdown", pdDown); window.removeEventListener("pointermove", pdMove); window.removeEventListener("pointerup", pdUp); window.removeEventListener("pointercancel", pdUp);
    pd?.ghost?.remove();
  };
}

// ---------- Activité 2 : les symboles ----------
const SYM = Object.fromEntries(SYMBOLES.map((s) => [s.k, s]));
const dessinSym = (k, vue, o = {}) => { const s = SYM[k]; return mini(s?.t || "del", vue, { ...s?.o, ...o }); };
const ASSOC = { CE2: ["pile", "lampe", "inter-o", "moteur", "buzzer", "fil"], CM1: ["pile", "lampe", "inter-o", "inter-f", "moteur", "fil"], CM2: ["pile", "lampe", "inter-o", "inter-f", "moteur", "del", "buzzer"] };
const QUIZ_SET = { CE2: ["pile", "lampe", "inter-o", "inter-f", "moteur", "fil"], CM1: ["pile", "lampe", "inter-o", "inter-f", "moteur", "fil", "buzzer"], CM2: SYMBOLES.map((s) => s.k) };
const TROUS = [
  { niv: ["CE2", "CM1"], consigne: "Il manque la pile. Choisis son symbole.", spec: { w: [RECT], c: ["trou v1,2", "lampe h3,1"] }, choix: ["pile", "lampe", "moteur", "inter-f"], bon: "pile" },
  { niv: ["CE2", "CM1"], consigne: "Il manque la lampe. Choisis son symbole.", spec: { w: [RECT], c: ["pile v1,2", "trou h3,1", "inter h3,4 f"] }, choix: ["moteur", "lampe", "pile", "buzzer"], bon: "lampe" },
  { niv: ["CE2", "CM1", "CM2"], consigne: "Il manque l'interrupteur, et il est ouvert. Choisis le bon symbole.", spec: { w: [RECT], c: ["pile v1,2", "lampe h3,1", "trou h3,4"] }, choix: ["inter-f", "inter-o", "moteur"], bon: "inter-o" },
  { niv: ["CE2", "CM1", "CM2"], consigne: "Il manque le moteur. Choisis son symbole.", spec: { w: [RECT], c: ["pile v1,2", "trou h3,1", "inter h3,4 f"] }, choix: ["lampe", "buzzer", "moteur", "pile"], bon: "moteur" },
  { niv: ["CM1", "CM2"], consigne: "La lampe doit briller. Quel interrupteur faut-il dessiner ?", spec: { w: [RECT], c: ["pile v1,2", "lampe h3,1", "trou h3,4"] }, choix: ["inter-o", "inter-f"], bon: "inter-f" },
  { niv: ["CM1", "CM2"], consigne: "Il manque le buzzer de la sonnette. Choisis son symbole.", spec: { w: [RECT], c: ["pile v1,2", "trou h3,1", "inter h3,4 f"] }, choix: ["buzzer", "del", "moteur", "lampe"], bon: "buzzer" },
  { niv: ["CM1", "CM2"], consigne: "Deux lampes en dérivation : il en manque une. Choisis le bon symbole.", spec: { w: [RECT2, "4,1 4,4"], c: ["pile v1,2", "lampe v4,2", "trou v6,2"] }, choix: ["moteur", "pile", "lampe", "inter-o"], bon: "lampe" },
  { niv: ["CM2"], consigne: "Deux lampes en série : il manque la pile. Choisis son symbole.", spec: { w: [RECT], c: ["trou v1,2", "lampe h2,1", "lampe h4,1"] }, choix: ["lampe", "pile", "inter-f", "del"], bon: "pile" },
  { niv: ["CM2"], consigne: "La DEL doit s'allumer. Dans quel sens faut-il la dessiner ?", spec: { w: [RECT], c: ["pile v1,2", "trou h3,1", "inter h3,4 f"] }, choix: ["del-a", "del-b"], bon: "auto-del" },
];
const choixComp = (k) => (k === "del-a" ? { t: "del", inv: false } : k === "del-b" ? { t: "del", inv: true } : { t: SYM[k].t, ...SYM[k].o });
const dessinChoix = (k, vue) => (k.startsWith("del-") ? mini("del", vue, { inv: k === "del-b" }) : dessinSym(k, vue));

function mountSymboles(el) {
  const ID = "elec-symboles", NIVS = ["CE2", "CM1", "CM2"], niv = niveauMemo(ID, NIVS, "CM1");
  let mode = "explorer", cur = "pile", dragFin = null;
  let q = null, trou = null;
  el.innerHTML = `<div class="el-root"><div class="tool-top el-top">${niveauxHTML(NIVS, niv.get())}
      <div class="seg el-mode" role="group" aria-label="Mode"><button data-mode="explorer">🔎 Explorer</button><button data-mode="associer">🧩 Associer</button><button data-mode="quiz">❓ Quiz</button><button data-mode="completer">✏️ Compléter le schéma</button></div>
      <button class="pill rc-keep" data-act="danger">⚠️ Dangers</button></div>
    <div class="el-sym-corps"></div></div>`;
  const corps = el.querySelector(".el-sym-corps");
  const dragFini = () => { dragFin?.(); dragFin = null; };

  const explorer = () => {
    const s = SYM[cur];
    corps.innerHTML = `<div class="explore"><div class="explore-main el-sym-grille rc-board">${SYMBOLES.map((x) => `<button class="el-sym-carte ${x.k === cur ? "on" : ""}" data-k="${x.k}"><span class="el-duo">${dessinSym(x.k, "reel")}${dessinSym(x.k, "schema")}</span><b>${esc(x.nom)}</b></button>`).join("")}</div>
      <aside class="explore-card"><h3>${esc(s.long || s.nom)}</h3><div class="el-duo grand"><figure>${dessinSym(s.k, "reel", { allume: true })}<figcaption>l'objet</figcaption></figure><figure>${dessinSym(s.k, "schema", { allume: true })}<figcaption>le symbole</figcaption></figure></div>
      <p><b>À quoi sert-il ?</b> ${esc(s.role)}</p><p><b>Son symbole :</b> ${esc(s.sym)}</p><p class="muted">Dans un schéma électrique, on dessine les symboles normalisés, reliés par des fils bien droits.</p></aside></div>`;
  };

  // Associer : CE2 objet → nom ; CM1 symbole → nom ; CM2 symbole → nom + objet.
  let placement = {}, choisi = null;
  const associer = (solution = false) => {
    dragFini(); const n = niv.get(), ks = ASSOC[n], triple = n === "CM2";
    if (!solution) { placement = {}; choisi = null; }
    const etqs = shuffle([...ks.map((k) => ({ id: "nom:" + k, html: esc(SYM[k].nom) })), ...(triple ? ks.map((k) => ({ id: "obj:" + k, html: dessinSym(k, "reel"), obj: true })) : [])]);
    if (solution) ks.forEach((k) => { placement["nom:" + k] = "nom:" + k; if (triple) placement["obj:" + k] = "obj:" + k; });
    const etq = (e) => `<button class="dk-etq el-etq${e.obj ? " obj" : ""}" data-etq="${e.id}" aria-label="${e.obj ? "objet " + esc(SYM[e.id.slice(4)].nom) : esc(SYM[e.id.slice(4)].nom)}">${e.html}</button>`;
    const posee = (slot) => { const id = Object.keys(placement).find((x) => placement[x] === slot); return id ? etq(etqs.find((e) => e.id === id)) : ""; };
    corps.innerHTML = `<p class="center el-cons">${n === "CE2" ? "Associe chaque objet à son nom." : triple ? "Pour chaque symbole, place son nom et l'objet réel." : "Associe chaque symbole à son nom."} <span class="muted">Glisse les étiquettes, ou touche une étiquette puis une case.</span></p>
      <div class="el-assoc rc-board"><div class="el-as-cartes">${ks.map((k) => `<div class="el-as-carte"><div class="el-as-img">${dessinSym(k, n === "CE2" ? "reel" : "schema")}</div>
        <div class="el-slot-h" data-cible="nom:${k}">${posee("nom:" + k)}</div>${triple ? `<div class="el-slot-h obj" data-cible="obj:${k}">${posee("obj:" + k)}</div>` : ""}</div>`).join("")}</div>
        <div class="dk-banque el-banque">${etqs.filter((e) => !placement[e.id]).map(etq).join("")}</div>
        <div class="tool-top"><button class="big-btn" data-act="verifier">✔ Vérifier</button><button class="pill" data-act="solution">💡 Solution</button><button class="pill" data-act="recommencer">↺ Recommencer</button></div><div class="el-res"></div></div>`;
    corps._etqs = etqs;
    dragFin = dragEtiquettes(corps, { onPose: (b, c) => poserEtq(b.dataset.etq, c.dataset.cible) });
  };
  const poserEtq = (id, slot) => {
    if (id.slice(0, 4) !== slot.slice(0, 4)) { const c = corps.querySelector(`[data-cible="${slot}"]`); c?.classList.add("el-non"); setTimeout(() => c?.classList.remove("el-non"), 500); return; }
    for (const x in placement) if (placement[x] === slot) delete placement[x];
    placement[id] = slot; choisi = null; reAssoc();
  };
  const reAssoc = () => { // redessine sans mélanger à nouveau
    const etqs = corps._etqs, etq = (e) => `<button class="dk-etq el-etq${e.obj ? " obj" : ""}" data-etq="${e.id}">${e.html}</button>`;
    corps.querySelectorAll("[data-cible]").forEach((c) => { const id = Object.keys(placement).find((x) => placement[x] === c.dataset.cible); c.innerHTML = id ? etq(etqs.find((e) => e.id === id)) : ""; c.classList.remove("good", "bad"); });
    corps.querySelector(".el-banque").innerHTML = etqs.filter((e) => !placement[e.id]).map(etq).join("");
    corps.querySelector(".el-res").innerHTML = "";
  };

  // Quiz : 10 questions, symbole → nom, nom → symbole (CM1+), objet → symbole (CM2).
  const nouveauQuiz = () => { q = { i: 0, ok: 0, n: 10, rep: null }; question(); };
  const question = () => {
    const n = niv.get(), set = QUIZ_SET[n], types = n === "CE2" ? ["s2n"] : n === "CM1" ? ["s2n", "n2s"] : ["s2n", "n2s", "o2s"];
    const k = set[Math.floor(Math.random() * set.length)], ty = types[Math.floor(Math.random() * types.length)];
    const nbc = n === "CE2" ? 3 : 4, autres = shuffle(set.filter((x) => x !== k)).slice(0, nbc - 1);
    Object.assign(q, { k, ty, choix: shuffle([k, ...autres]), rep: null });
    renduQuiz();
  };
  const renduQuiz = () => {
    if (q.i >= q.n) { corps.innerHTML = `<div class="el-quiz rc-board center"><h3>Terminé !</h3>${scoreHTML(q.ok, q.n)}<button class="big-btn" data-act="rejouer">↺ Rejouer</button></div>`; if (q.ok === q.n) bravo(el, "Parfait !"); return; }
    const enonce = q.ty === "s2n" ? `<p class="el-q-t">Quel est ce symbole ?</p>${dessinSym(q.k, "schema")}` : q.ty === "n2s" ? `<p class="el-q-t">Quel est le symbole de :</p><div class="quiz-target">${esc(SYM[q.k].nom)}</div>` : `<p class="el-q-t">Quel est le symbole de cet objet ?</p>${dessinSym(q.k, "reel")}`;
    const cl = (c) => (q.rep ? (c === q.k ? "good" : c === q.rep ? "bad" : "") : "");
    corps.innerHTML = `<div class="el-quiz rc-board"><div class="el-q-head"><span>Question ${q.i + 1} / ${q.n}</span><span>Score : <b>${q.ok}</b></span></div><div class="el-q-enonce">${enonce}</div>
      <div class="el-q-choix ${q.ty === "s2n" ? "noms" : "syms"}">${q.choix.map((c) => `<button class="el-q-b ${cl(c)}" data-rep="${c}" ${q.rep ? "disabled" : ""}>${q.ty === "s2n" ? esc(SYM[c].nom) : dessinSym(c, "schema")}</button>`).join("")}</div>
      ${q.rep ? `<p class="el-retour ${q.rep === q.k ? "ok" : "ko"}">${q.rep === q.k ? "✅ Oui !" : `❌ C'était : ${esc(SYM[q.k].nom)}.`} ${esc(SYM[q.k].sym)}</p><div class="center"><button class="big-btn" data-act="qsuivant">Suivant →</button></div>` : ""}</div>`;
  };

  // Compléter le schéma
  let tIdx = 0, tScore = 0, tFait = 0;
  const trousNiv = () => TROUS.filter((t) => t.niv.includes(niv.get()));
  const chargerTrou = () => {
    const l = trousNiv(), t = l[tIdx % l.length];
    let bon = t.bon;
    if (bon === "auto-del") bon = t.choix.find((k) => { const st = circuit(t.spec), c = st.comps.find((x) => x.t === "trou"); Object.assign(c, choixComp(k)); return simuler(st).c[c.id]?.marche; });
    trou = { t, bon, rep: null, ordre: shuffle(t.choix) };
    renduTrou();
  };
  const renduTrou = () => {
    dragFini();
    const { t, rep, bon } = trou, st = circuit(t.spec);
    if (rep) Object.assign(st.comps.find((x) => x.t === "trou"), choixComp(rep));
    const s = simuler(st), l = trousNiv();
    corps.innerHTML = `<div class="el-trou-zone rc-board"><div class="el-q-head"><span>Schéma ${(tIdx % l.length) + 1} / ${l.length}</span><span>Score : <b>${tScore}</b> / ${tFait}</span></div>
      <p class="el-q-t">${esc(t.consigne)}</p>${svgCircuit(st, s, "schema", rep ? (rep === bon ? "ok" : "ko") : "")}
      <div class="el-q-choix syms">${trou.ordre.map((k) => `<button class="dk-etq el-q-b ${rep ? (k === bon ? "good" : k === rep ? "bad" : "") : ""}" data-etq="${k}" data-rep="${k}" ${rep ? "disabled" : ""} aria-label="symbole">${dessinChoix(k, "schema")}</button>`).join("")}</div>
      ${rep ? `<p class="el-retour ${rep === bon ? "ok" : "ko"}">${rep === bon ? "✅ Bravo, le schéma est complet !" : "❌ Ce n'est pas ce symbole. La bonne réponse est entourée en vert."}</p><div class="center"><button class="big-btn" data-act="tsuivant">Schéma suivant →</button></div>` : `<p class="muted center">Glisse le bon symbole dans la case « ? », ou touche-le.</p>`}</div>`;
    if (!rep) dragFin = dragEtiquettes(corps, { onPose: (b) => repondreTrou(b.dataset.etq) });
  };
  const repondreTrou = (k) => { if (trou.rep) return; trou.rep = k; tFait++; if (k === trou.bon) tScore++; renduTrou(); };

  const rendu = () => {
    el.querySelectorAll(".el-mode button").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
    dragFini();
    if (mode === "explorer") explorer(); else if (mode === "associer") associer(); else if (mode === "quiz") nouveauQuiz(); else { tIdx = 0; tScore = 0; tFait = 0; chargerTrou(); }
  };
  el.onclick = (e) => {
    if (clicApresDrag(corps)) return;
    const b = e.target.closest("button, [data-cible]"); if (!b) return;
    if (b.dataset.niv) { niv.set(b.dataset.niv); el.querySelectorAll(".dk-niv button").forEach((x) => x.classList.toggle("on", x === b)); rendu(); return; }
    if (b.dataset.mode) { mode = b.dataset.mode; rendu(); return; }
    if (b.dataset.act === "danger") return ouvrirDanger(el);
    if (b.dataset.act === "danger-x") return fermerDanger(el);
    if (mode === "explorer" && b.dataset.k) { cur = b.dataset.k; explorer(); return; }
    if (mode === "associer") {
      if (b.dataset.etq) { const dansSlot = b.closest("[data-cible]"); if (dansSlot) { delete placement[b.dataset.etq]; reAssoc(); return; } choisi = choisi === b.dataset.etq ? null : b.dataset.etq; corps.querySelectorAll(".el-etq").forEach((x) => x.classList.toggle("on", x.dataset.etq === choisi)); return; }
      if (b.dataset.cible && choisi) { poserEtq(choisi, b.dataset.cible); return; }
      if (b.dataset.act === "verifier") {
        let ok = 0, tot = 0;
        corps.querySelectorAll("[data-cible]").forEach((c) => { tot++; const id = Object.keys(placement).find((x) => placement[x] === c.dataset.cible); const bon = id === c.dataset.cible; if (bon) ok++; c.classList.toggle("good", bon); c.classList.toggle("bad", !!id && !bon); });
        corps.querySelector(".el-res").innerHTML = scoreHTML(ok, tot) + (ok === tot ? "" : `<p class="muted center">Les cases rouges sont fausses, les cases vides restent à remplir.</p>`);
        if (ok === tot) bravo(el); return;
      }
      if (b.dataset.act === "solution") { associer(true); corps.querySelectorAll("[data-cible]").forEach((c) => c.classList.add("good")); return; }
      if (b.dataset.act === "recommencer") { associer(); return; }
    }
    if (mode === "quiz") {
      if (b.dataset.rep && !q.rep) { q.rep = b.dataset.rep; if (q.rep === q.k) q.ok++; renduQuiz(); if (q.rep === q.k) setTimeout(() => { if (q.rep && mode === "quiz" && corps.querySelector("[data-act=qsuivant]")) { q.i++; question(); } }, 1200); return; }
      if (b.dataset.act === "qsuivant") { q.i++; question(); return; }
      if (b.dataset.act === "rejouer") { nouveauQuiz(); return; }
    }
    if (mode === "completer") {
      if (b.dataset.rep) { repondreTrou(b.dataset.rep); return; }
      if (b.dataset.act === "tsuivant") { tIdx++; chargerTrou(); return; }
    }
  };
  rendu();
  return () => dragFini();
}

// ---------- Activité 3 : conducteur ou isolant ? ----------
const icone = (o, taille = 40) => (o.svg ? `<svg viewBox="0 0 64 64" width="${taille}" height="${taille}" aria-hidden="true">${ICONES[o.svg]}</svg>` : `<span class="el-emoji" style="font-size:${taille * 0.85}px">${o.ico}</span>`);
function testeurSVG(o) {
  const k = o ? (o.c >= 1 ? 1 : o.c > 0 ? 0.25 : 0) : 0;
  const halo = k ? `<circle cx="300" cy="78" r="${40 + 40 * k}" fill="#ffe066" opacity="${0.35 * k + 0.1}"/><circle cx="300" cy="78" r="${32 + 10 * k}" fill="#ffd23a" opacity="${0.4 * k + 0.1}"/>` : "";
  const verre = k ? `rgb(255,${Math.round(250 - 40 * k)},${Math.round(225 - 175 * k)})` : "#eef6ff";
  const objet = o ? (o.svg ? `<svg x="258" y="214" width="84" height="84" viewBox="0 0 64 64">${ICONES[o.svg]}</svg>` : `<text x="300" y="262" class="el-obj-emoji">${o.ico}</text>`) : `<text x="300" y="258" class="el-t el-pose">Pose un objet ici</text>`;
  const pince = (x, d, coul) => `<g transform="translate(${x},262) scale(${d},1)"><path d="M0,-8 L-34,-14 L-40,-6 L-34,0 L0,-2 Z" fill="${coul}" stroke="#0005" stroke-width="2"/><path d="M0,8 L-34,14 L-40,6 L-34,0 L0,2 Z" fill="${coul}" stroke="#0005" stroke-width="2"/><path d="M-6,-6 L6,-3 M-6,6 L6,3" stroke="#aaa" stroke-width="3"/></g>`;
  return `<svg viewBox="0 0 600 330" class="el-testeur" role="img" aria-label="Testeur de conduction : pile, lampe et deux pinces">
    <rect width="600" height="330" fill="#f3e9d9" rx="18"/>
    <path d="M128,168 C128,90 200,110 282,110" stroke="#e0463c" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M318,110 C420,110 470,170 470,220 C470,262 430,262 404,262" stroke="#2b2b2b" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M70,232 C70,290 140,262 196,262" stroke="#2f7de1" stroke-width="9" fill="none" stroke-linecap="round"/>
    <g transform="translate(40,160)"><rect x="0" y="10" width="100" height="70" rx="8" fill="#2f5fb8" stroke="#1d3f80" stroke-width="3"/><rect x="0" y="34" width="100" height="20" fill="#f2c230"/><text x="50" y="45" class="el-t el-volt">4,5 V</text>
      <rect x="82" y="-2" width="12" height="14" fill="#e2bd55" stroke="#a07f26" stroke-width="2"/><rect x="24" y="80" width="12" height="20" fill="#e2bd55" stroke="#a07f26" stroke-width="2"/><text x="88" y="-12" class="el-t el-plus">+</text><text x="12" y="96" class="el-t el-moins">−</text></g>
    <g>${halo}<rect x="276" y="104" width="48" height="22" rx="5" fill="#cfd4dc" stroke="#8a8f99" stroke-width="3"/><rect x="288" y="92" width="24" height="14" fill="#b9bec7" stroke="#7d848f" stroke-width="2"/><circle cx="300" cy="66" r="30" fill="${verre}" stroke="#9fb3c8" stroke-width="3"/><path d="M291,92 L291,74 l4,-7 4,7 4,-7 4,7 L307,92" stroke="${k ? "#ff8a00" : "#6b6b6b"}" stroke-width="3" fill="none"/></g>
    ${pince(236, 1, "#2f7de1")}${pince(364, -1, "#2b2b2b")}
    <rect x="246" y="208" width="108" height="100" rx="16" class="el-zone-test${o ? " pleine" : ""}" data-cible="testeur"/>${objet}
  </svg>`;
}
function mountConducteurs(el) {
  const ID = "elec-conducteurs", NIVS = ["CE1", "CE2", "CM1"], niv = niveauMemo(ID, NIVS, "CE2");
  let mode = "tester", obj = null, testes = new Map(), choix = {}, choisi = null, dragFin = null;
  const objets = () => OBJETS.filter((o) => o.n <= NIVS.indexOf(niv.get()));
  el.innerHTML = `<div class="el-root"><div class="tool-top el-top">${niveauxHTML(NIVS, niv.get())}
      <div class="seg el-mode" role="group" aria-label="Mode"><button data-mode="tester">🔦 Tester</button><button data-mode="classer">🗂️ Classer</button></div>
      <button class="pill rc-keep" data-act="danger">⚠️ Dangers</button></div><div class="el-cond-corps"></div></div>`;
  const corps = el.querySelector(".el-cond-corps");
  const dragFini = () => { dragFin?.(); dragFin = null; };
  const etq = (o, cls = "") => `<button class="dk-etq el-obj ${cls}" data-etq="${o.id}">${icone(o, 34)}<span>${esc(o.nom)}</span></button>`;
  const verdict = (o) => (o.c >= 1 ? "la lampe s'allume : c'est un conducteur." : o.c > 0 ? "la lampe brille à peine : c'est un conducteur, mais un mauvais conducteur." : "la lampe reste éteinte : c'est un isolant.");

  const tester = () => {
    dragFini();
    const l = objets(), cond = l.filter((o) => testes.get(o.id) && o.c > 0), iso = l.filter((o) => testes.get(o.id) && !o.c);
    corps.innerHTML = `<div class="explore"><div class="explore-main el-cond-main rc-board">${testeurSVG(obj)}
        <div class="el-verdict ${obj ? (obj.c ? "ok" : "ko") : ""}">${obj ? `${icone(obj, 30)} <span><b>${esc(obj.nom)}</b> (${esc(obj.mat)}) : ${verdict(obj)}</span>` : "Glisse un objet entre les pinces, ou touche-le."}</div>
        <div class="dk-banque el-objets">${l.map((o) => etq(o, (obj?.id === o.id ? "on " : "") + (testes.has(o.id) ? "vu" : ""))).join("")}</div></div>
      <aside class="explore-card"><h3>Mes résultats</h3>
        <div class="el-2col"><div><h4>✅ Conducteurs</h4><p class="muted">La lampe s'allume.</p><ul>${cond.map((o) => `<li>${icone(o, 22)} ${esc(o.nom)}</li>`).join("")}</ul></div>
        <div><h4>❌ Isolants</h4><p class="muted">La lampe reste éteinte.</p><ul>${iso.map((o) => `<li>${icone(o, 22)} ${esc(o.nom)}</li>`).join("")}</ul></div></div>
        ${obj?.note ? `<p class="el-note">ℹ️ ${esc(obj.note)}</p>` : ""}
        <p class="el-retenir"><b>À retenir :</b> les métaux (fer, cuivre, aluminium…) laissent passer le courant : ce sont des <b>conducteurs</b>. Le plastique, le bois, le verre, le papier, le caoutchouc ne le laissent pas passer : ce sont des <b>isolants</b>.${niv.get() === "CM1" ? " Le corps humain conduit aussi le courant : c'est pour cela que le courant des prises (230 V) est si dangereux." : ""}</p>
        <button class="pill" data-act="effacer">↺ Effacer les résultats</button></aside></div>`;
    dragFin = dragEtiquettes(corps, { onPose: (b) => essayer(b.dataset.etq), aimant: 120 });
  };
  const essayer = (id) => { obj = OBJETS.find((o) => o.id === id); testes.set(id, true); tester(); };

  const classer = (solution = false) => {
    dragFini();
    const l = objets();
    if (solution) l.forEach((o) => { choix[o.id] = o.c > 0 ? "1" : "0"; });
    const col = (v, t, sous) => `<div class="el-col" data-cible="${v}"><h4>${t}</h4><p class="muted">${sous}</p><div class="el-col-l">${l.filter((o) => choix[o.id] === v).map((o) => etq(o, solution ? "good" : "")).join("")}</div></div>`;
    corps.innerHTML = `<p class="center el-cons">Range chaque objet : la lampe va-t-elle s'allumer ? <span class="muted">Glisse, ou touche un objet puis une colonne.</span></p>
      <div class="el-classer rc-board"><div class="dk-banque el-objets">${l.filter((o) => !choix[o.id]).map((o) => etq(o)).join("") || `<span class="muted">Tous les objets sont rangés.</span>`}</div>
        <div class="el-cols">${col("1", "✅ Conducteurs", "La lampe s'allume.")}${col("0", "❌ Isolants", "La lampe reste éteinte.")}</div>
        <div class="tool-top"><button class="big-btn" data-act="verifier">✔ Vérifier</button><button class="pill" data-act="solution">💡 Solution</button><button class="pill" data-act="recommencer">↺ Recommencer</button></div><div class="el-res"></div></div>`;
    dragFin = dragEtiquettes(corps, { onPose: (b, c) => { choix[b.dataset.etq] = c.dataset.cible; choisi = null; classer(); } });
  };

  const rendu = () => { el.querySelectorAll(".el-mode button").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode)); mode === "tester" ? tester() : classer(); };
  el.onclick = (e) => {
    if (clicApresDrag(corps)) return;
    const b = e.target.closest("button, [data-cible]"); if (!b) return;
    if (b.dataset.niv) { niv.set(b.dataset.niv); el.querySelectorAll(".dk-niv button").forEach((x) => x.classList.toggle("on", x === b)); obj = null; choix = {}; rendu(); return; }
    if (b.dataset.mode) { mode = b.dataset.mode; choisi = null; rendu(); return; }
    if (b.dataset.act === "danger") return ouvrirDanger(el);
    if (b.dataset.act === "danger-x") return fermerDanger(el);
    if (mode === "tester") {
      if (b.dataset.etq) return essayer(b.dataset.etq);
      if (b.dataset.act === "effacer") { testes.clear(); obj = null; tester(); }
      return;
    }
    if (b.dataset.etq) {
      if (b.closest("[data-cible]")) { delete choix[b.dataset.etq]; classer(); return; }
      choisi = choisi === b.dataset.etq ? null : b.dataset.etq; corps.querySelectorAll(".el-obj").forEach((x) => x.classList.toggle("on", x.dataset.etq === choisi)); return;
    }
    if (b.dataset.cible && choisi) { choix[choisi] = b.dataset.cible; choisi = null; classer(); return; }
    if (b.dataset.act === "verifier") {
      const l = objets(); let ok = 0;
      corps.querySelectorAll(".el-col .el-obj").forEach((x) => { const o = OBJETS.find((y) => y.id === x.dataset.etq), bon = (o.c > 0 ? "1" : "0") === choix[o.id]; if (bon) ok++; x.classList.add(bon ? "good" : "bad"); });
      const reste = l.filter((o) => !choix[o.id]).length;
      corps.querySelector(".el-res").innerHTML = scoreHTML(ok, l.length) + (reste ? `<p class="muted center">Il reste ${reste} objet${reste > 1 ? "s" : ""} à ranger.</p>` : ok < l.length ? `<p class="muted center">Les étiquettes rouges sont mal rangées : teste-les dans le mode « Tester » !</p>` : "");
      if (ok === l.length) bravo(el); return;
    }
    if (b.dataset.act === "solution") { classer(true); return; }
    if (b.dataset.act === "recommencer") { choix = {}; classer(); return; }
  };
  rendu();
  return () => dragFini();
}

export const SCIENCES = [
  { id: "elec-circuits", nom: "Circuits électriques", icone: "💡", couleur: "#ffe3a3", desc: "Construire des circuits, en dessin réaliste ou en schéma", niveaux: ["CE1", "CE2", "CM1", "CM2"], mount: (el) => mountCircuits(el, "atelier") },
  { id: "elec-defis", nom: "Défis électriques", icone: "🏆", couleur: "#ffd0dc", desc: "Allumer, commander, série, dérivation : défis vérifiés", niveaux: ["CE1", "CE2", "CM1", "CM2"], mount: (el) => mountCircuits(el, "defis") },
  { id: "elec-symboles", nom: "Symboles électriques", icone: "✏️", couleur: "#d8e6ff", desc: "Symboles normalisés : associer, quiz, compléter un schéma", niveaux: ["CE2", "CM1", "CM2"], mount: mountSymboles },
  { id: "elec-conducteurs", nom: "Conducteur ou isolant ?", icone: "🔌", couleur: "#c9ecd4", desc: "Tester des objets avec une pile et une lampe, puis les classer", niveaux: ["CE1", "CE2", "CM1"], mount: mountConducteurs },
];
