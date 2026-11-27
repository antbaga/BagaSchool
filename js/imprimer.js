// Générateurs de fiches à imprimer (format A4).
// Chaque générateur : { id, nom, icone, couleur, desc, aleatoire, params: [...], render(p, ctx) -> [html de page, ...] }
// ctx = { rnd: () => [0,1[ (graine fixe), eleves, esc, xRatio }
// Toutes les dimensions des pages sont en millimètres.

import { grilleMotsMeles } from "./motsmeles.js";

const pad = (n) => String(n).padStart(2, "0");
const ri = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1)); // entier dans [a, b]
const LETTRES = "ABCDEFGHJKLMNPRSTUVWXYZ";

// ---------- éléments communs ----------
function entete(p, esc, extra = "") {
  return `
    <div class="ws-head"><span>Prénom : <i class="ws-dots"></i></span><span>Date : <i class="ws-dots short"></i></span></div>
    <h1 class="ws-title">${esc(p.titre)}${p.corrige ? ` <small class="ws-key">Corrigé</small>` : ""}</h1>
    ${p.consigne ? `<p class="ws-consigne"><b class="ws-num">1</b> ${esc(p.consigne)}</p>` : ""}${extra}`;
}
const page = (inner, cls = "") => `<div class="page ${cls}">${inner}</div>`;

// Lignes Seyès en SVG. inter = interligne en mm. Une « rangée » = 4 interlignes (ligne foncée en haut).
function seyesLines(W, H, inter, marge = 18) {
  let s = "";
  for (let y = 0, i = 0; y <= H + 0.01; y += inter, i++) {
    s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="${i % 4 ? "#c9d3f2" : "#7b8fd6"}" stroke-width="${i % 4 ? 0.15 : 0.3}"/>`;
  }
  for (let x = marge + inter * 4; x < W; x += inter * 4) s += `<line y1="0" y2="${H}" x1="${x}" x2="${x}" stroke="#e3e8f7" stroke-width="0.12"/>`;
  s += `<line y1="0" y2="${H}" x1="${marge}" x2="${marge}" stroke="#ef8fa3" stroke-width="0.35"/>`;
  return s;
}

// Horloge statique en SVG
function clockSVG(h, m, hands = true, size = 46) {
  let s = `<svg viewBox="-55 -55 110 110" width="${size}mm" height="${size}mm" class="ws-clock"><circle r="52" fill="#fff" stroke="#3b3355" stroke-width="2.5"/>`;
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180, r1 = i % 5 ? 47 : 44;
    s += `<line x1="${Math.sin(a) * r1}" y1="${-Math.cos(a) * r1}" x2="${Math.sin(a) * 50}" y2="${-Math.cos(a) * 50}" stroke="#3b3355" stroke-width="${i % 5 ? 0.6 : 1.6}"/>`;
  }
  for (let i = 1; i <= 12; i++) { const a = (i * 30 * Math.PI) / 180; s += `<text x="${Math.sin(a) * 36}" y="${-Math.cos(a) * 36}" font-size="10" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#3b3355">${i}</text>`; }
  if (hands) {
    s += `<line x2="0" y2="-24" stroke="#e0556a" stroke-width="4.5" stroke-linecap="round" transform="rotate(${(h % 12) * 30 + m * 0.5})"/>`;
    s += `<line x2="0" y2="-40" stroke="#3f7fe0" stroke-width="2.8" stroke-linecap="round" transform="rotate(${m * 6})"/>`;
  }
  return s + `<circle r="3" fill="#3b3355"/></svg>`;
}

// ---------- Calcul posé ----------
function genOperation(rnd, op, nd, retenue) {
  const digits = (n) => Array.from({ length: n }, (_, i) => (i === 0 ? ri(rnd, 1, 9) : ri(rnd, 0, 9)));
  const toN = (d) => +d.join("");
  for (let essai = 0; essai < 200; essai++) {
    if (op === "×") {
      const a = toN(digits(nd)), b = ri(rnd, 2, 9);
      const sansRet = String(a).split("").every((c) => +c * b < 10);
      if (retenue === "sans" && !sansRet) continue;
      if (retenue === "avec" && sansRet) continue;
      return { a, b, op, r: a * b };
    }
    let A = digits(nd), B = digits(nd);
    if (op === "+") {
      const carry = A.some((d, i) => d + B[i] >= 10);
      if (retenue === "sans" && carry) continue;
      if (retenue === "avec" && !carry) continue;
      return { a: toN(A), b: toN(B), op, r: toN(A) + toN(B) };
    }
    if (toN(A) < toN(B)) [A, B] = [B, A];
    const borrow = A.some((d, i) => d < B[i]);
    if (retenue === "sans" && borrow) continue;
    if (retenue === "avec" && !borrow) continue;
    if (toN(A) === toN(B)) continue;
    return { a: toN(A), b: toN(B), op, r: toN(A) - toN(B) };
  }
  return { a: 12, b: 3, op, r: op === "+" ? 15 : op === "−" ? 9 : 36 };
}
function opTable(o, couleurs, corrige) {
  const w = Math.max(String(o.a).length, String(o.b).length, String(o.r).length) + 1;
  const cells = (n, show = true) => {
    const s = String(n).padStart(w, " ").split("");
    return s.map((c, i) => { const rank = w - 1 - i; return `<td class="${couleurs && c !== " " ? "pv" + Math.min(rank, 3) : ""}">${show && c !== " " ? c : ""}</td>`; }).join("");
  };
  const opRow = String(o.b).padStart(w, " ").split("").map((c, i) => `<td class="${couleurs && c !== " " ? "pv" + Math.min(w - 1 - i, 3) : ""}">${i === 0 ? o.op : c === " " ? "" : c}</td>`).join("");
  return `<table class="ws-cp"><tr class="carry">${"<td></td>".repeat(w)}</tr><tr>${cells(o.a)}</tr><tr class="opline">${opRow}</tr><tr class="res">${corrige ? cells(o.r) : "<td></td>".repeat(w)}</tr></table>`;
}

// ---------- Graphisme ----------
function motifPath(motif, x0, x1, base, h) {
  const pts = [];
  const step = 0.4;
  if (motif === "ronds") {
    let s = ""; const r = h / 2;
    for (let x = x0 + r; x + r <= x1; x += h * 1.5) s += `M${x + r},${base - r} a${r},${r} 0 1,0 ${-2 * r},0 a${r},${r} 0 1,0 ${2 * r},0 `;
    return s;
  }
  for (let x = x0; x <= x1; x += step) {
    const t = (x - x0) / h; let y;
    if (motif === "vagues") y = base - h / 2 - (h / 2) * Math.sin(t * Math.PI);
    if (motif === "ponts") y = base - h * Math.abs(Math.sin((t * Math.PI) / 1.2));
    if (motif === "coupes") y = base - h + h * Math.abs(Math.sin((t * Math.PI) / 1.2));
    if (motif === "creneaux") { const k = Math.floor(t / 0.8) % 2; y = base - (k ? h : 0); }
    if (motif === "scie") { const u = (t / 0.8) % 2; y = base - h * (u < 1 ? u : 2 - u); }
    if (motif === "boucles") {
      // cycloïde allongée : forme des boucles « l l l »
      const th = t * 4, R = h * 0.25, d = h * 0.5;
      pts.push([x0 + R * th + d * Math.sin(th), base - (d - d * Math.cos(th))]);
      continue;
    }
    pts.push([x, y]);
  }
  const filtered = motif === "boucles" ? pts.filter(([x]) => x <= x1 && x >= x0) : pts;
  return filtered.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

// ---------- générateurs ----------
// ---------- Problèmes ----------
const PRENOMS = [["Léo", "il"], ["Inès", "elle"], ["Noah", "il"], ["Jade", "elle"], ["Hugo", "il"], ["Lina", "elle"], ["Sacha", "il"], ["Zoé", "elle"], ["Adam", "il"], ["Rose", "elle"]];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const nf = (x) => x.toLocaleString("fr-FR");
// Chaque modèle : niv = niveaux concernés, gen(rnd, niv, prénom, pronom) -> { texte, calculs: [...], reponse }
const PROBLEMES = [
  { niv: ["cp", "ce"], gen(rnd, niv, P, il) {
    const M = niv === "cp" ? 30 : 100, a = ri(rnd, 3, M - 5), b = ri(rnd, 2, M - a);
    return { texte: `${P} a ${a} billes. À la récréation, ${il} en gagne ${b}. Combien de billes ${P} a-t-${il} maintenant ?`, calculs: [`${a} + ${b} = ${a + b}`], reponse: `${P} a maintenant ${a + b} billes.` }; } },
  { niv: ["cp", "ce"], gen(rnd, niv) {
    const M = niv === "cp" ? 30 : 100, a = ri(rnd, 8, M), b = ri(rnd, 2, a - 2);
    return { texte: `Dans un bus, il y a ${a} passagers. À l'arrêt, ${b} passagers descendent. Combien reste-t-il de passagers dans le bus ?`, calculs: [`${a} − ${b} = ${a - b}`], reponse: `Il reste ${a - b} passagers dans le bus.` }; } },
  { niv: ["cp", "ce"], gen(rnd, niv, P, il) {
    const M = niv === "cp" ? 30 : 100, t = ri(rnd, 15, Math.min(M, 30)), f = ri(rnd, 5, t - 5);
    return { texte: `Dans la classe de ${P}, il y a ${t} élèves. ${f} sont des filles. Combien y a-t-il de garçons ?`, calculs: [`${t} − ${f} = ${t - f}`], reponse: `Il y a ${t - f} garçons.` }; } },
  { niv: ["cp", "ce"], gen(rnd, niv, P, il) {
    const M = niv === "cp" ? 30 : 100, a = ri(rnd, 3, M / 2), b = ri(rnd, 2, M / 2 - 1);
    return { texte: `${P} a ${a} images. Son amie Maya en a ${b} de plus. Combien d'images Maya a-t-elle ?`, calculs: [`${a} + ${b} = ${a + b}`], reponse: `Maya a ${a + b} images.` }; } },
  { niv: ["cp", "ce"], gen(rnd, niv) {
    const a = niv === "cp" ? ri(rnd, 2, 5) : ri(rnd, 4, 10), b = niv === "cp" ? ri(rnd, 2, 5) : ri(rnd, 3, 9);
    return { texte: `Une boîte contient ${a} œufs. Combien d'œufs y a-t-il dans ${b} boîtes ?`, calculs: [`${b} × ${a} = ${a * b}`], reponse: `Il y a ${a * b} œufs.` }; } },
  { niv: ["ce", "cm"], gen(rnd, niv, P, il) {
    const n = ri(rnd, 2, niv === "cm" ? 9 : 5), q = ri(rnd, 3, niv === "cm" ? 25 : 9);
    return { texte: `${P} partage ${n * q} bonbons entre ${n} amis. Chacun reçoit le même nombre de bonbons. Combien de bonbons chaque ami reçoit-il ?`, calculs: [`${n * q} : ${n} = ${q}`], reponse: `Chaque ami reçoit ${q} bonbons.` }; } },
  { niv: ["ce", "cm"], gen(rnd, niv, P, il) {
    const M = niv === "cm" ? 500 : 60, a = ri(rnd, 10, M), b = ri(rnd, 5, M / 2), c = ri(rnd, 3, a + b - 2);
    return { texte: `${P} a ${a} cartes. Le matin, ${il} en gagne ${b}. L'après-midi, ${il} en perd ${c}. Combien de cartes ${P} a-t-${il} le soir ?`, calculs: [`${a} + ${b} = ${a + b}`, `${a + b} − ${c} = ${a + b - c}`], reponse: `Le soir, ${P} a ${a + b - c} cartes.` }; } },
  { niv: ["ce", "cm"], gen(rnd, niv, P, il) {
    const n = ri(rnd, 2, niv === "cm" ? 6 : 4), pr = ri(rnd, 2, niv === "cm" ? 9 : 4), B = [10, 20, 50, 100].find((b) => b > n * pr);
    return { texte: `Au marché, ${P} achète ${n} kilos de pommes à ${pr} € le kilo. ${cap(il)} paie avec un billet de ${B} €. Combien d'argent lui rend-on ?`, calculs: [`${n} × ${pr} = ${n * pr}`, `${B} − ${n * pr} = ${B - n * pr}`], reponse: `On lui rend ${B - n * pr} €.` }; } },
  { niv: ["ce", "cm"], gen(rnd, niv) {
    const c = ri(rnd, 3, niv === "cm" ? 12 : 5), e = ri(rnd, 18, 28), a = ri(rnd, 2, 12);
    return { texte: `Une école a ${c} classes de ${e} élèves. Aujourd'hui, ${a} élèves sont absents. Combien d'élèves sont présents ?`, calculs: [`${c} × ${e} = ${nf(c * e)}`, `${nf(c * e)} − ${a} = ${nf(c * e - a)}`], reponse: `${nf(c * e - a)} élèves sont présents.` }; } },
  { niv: ["ce", "cm"], gen(rnd, niv) {
    const r = ri(rnd, 8, niv === "cm" ? 30 : 10), s = ri(rnd, 10, niv === "cm" ? 25 : 10), o = ri(rnd, 5, r * s - 5);
    return { texte: `Un cinéma a ${r} rangées de ${s} sièges. ${nf(o)} places sont occupées. Combien de places sont libres ?`, calculs: [`${r} × ${s} = ${nf(r * s)}`, `${nf(r * s)} − ${nf(o)} = ${nf(r * s - o)}`], reponse: `${nf(r * s - o)} places sont libres.` }; } },
  { niv: ["cm"], gen(rnd, niv, P, il) {
    const a = ri(rnd, 15, 40), b = ri(rnd, 15, 40), c = ri(rnd, 15, 40), t = a + b + c + ri(rnd, 20, 150);
    return { texte: `Le livre de ${P} a ${t} pages. ${cap(il)} lit ${a} pages lundi, ${b} pages mardi et ${c} pages mercredi. Combien de pages lui reste-t-il à lire ?`, calculs: [`${a} + ${b} + ${c} = ${a + b + c}`, `${t} − ${a + b + c} = ${t - a - b - c}`], reponse: `Il lui reste ${t - a - b - c} pages à lire.` }; } },
  { niv: ["cm"], gen(rnd) {
    const n = ri(rnd, 4, 12), k = [6, 8, 10, 12, 20, 25][ri(rnd, 0, 5)], u = ri(rnd, 10, n * k - 5);
    return { texte: `Pour la kermesse, l'école achète ${n} paquets de ${k} gobelets. On en utilise ${u}. Combien de gobelets reste-t-il ?`, calculs: [`${n} × ${k} = ${n * k}`, `${n * k} − ${u} = ${n * k - u}`], reponse: `Il reste ${n * k - u} gobelets.` }; } },
  { niv: ["cm"], gen(rnd, niv, P, il) {
    const e = ri(rnd, 20, 28), pr = ri(rnd, 4, 9), d = ri(rnd, 2, 4), bus = ri(rnd, 150, 400);
    return { texte: `Une classe de ${e} élèves part en sortie. L'entrée du musée coûte ${pr} € par élève et le bus coûte ${bus} €. La coopérative donne ${d * 50} €. Combien reste-t-il à payer ?`, calculs: [`${e} × ${pr} = ${e * pr}`, `${e * pr} + ${bus} = ${e * pr + bus}`, `${e * pr + bus} − ${d * 50} = ${e * pr + bus - d * 50}`], reponse: `Il reste ${e * pr + bus - d * 50} € à payer.` }; } },
  { niv: ["cm"], gen(rnd, niv, P, il) {
    const q = ri(rnd, 12, 60), n = ri(rnd, 3, 8), r = ri(rnd, 1, n - 1);
    return { texte: `Le maître range ${q * n + r} livres sur des étagères. Il met ${n} livres par étagère. Combien d'étagères peut-il remplir ? Combien de livres restera-t-il ?`, calculs: [`${q * n + r} = (${n} × ${q}) + ${r}`], reponse: `Il remplit ${q} étagères et il reste ${r} livre${r > 1 ? "s" : ""}.` }; } },
];

// ---------- Nombres en lettres ----------
// rect = orthographe rectifiée de 1990 (traits d'union entre tous les mots).
const UNITES = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
const DIZAINES = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];
function moins100(n, rect, final) {
  if (n < 17) return UNITES[n];
  if (n < 20) return "dix-" + UNITES[n - 10];
  const d = Math.floor(n / 10), u = n % 10, et = rect ? "-et-" : " et ";
  if (d === 7) return u === 1 ? "soixante" + et + "onze" : "soixante-" + moins100(10 + u, rect, final);
  if (d === 8) return u === 0 ? (final ? "quatre-vingts" : "quatre-vingt") : "quatre-vingt-" + UNITES[u];
  if (d === 9) return "quatre-vingt-" + moins100(10 + u, rect, final);
  return DIZAINES[d] + (u === 0 ? "" : u === 1 ? et + "un" : "-" + UNITES[u]);
}
function moins1000(n, rect, final) {
  const sep = rect ? "-" : " ", c = Math.floor(n / 100), r = n % 100;
  const cent = c === 0 ? "" : (c === 1 ? "" : UNITES[c] + sep) + (c > 1 && r === 0 && final ? "cents" : "cent");
  const reste = r ? moins100(r, rect, final) : "";
  return [cent, reste].filter(Boolean).join(sep);
}
export function enLettres(n, rect = true) {
  if (n === 0) return "zéro";
  const sep = rect ? "-" : " ", m = Math.floor(n / 1000), r = n % 1000;
  const mille = m === 0 ? "" : m === 1 ? "mille" : moins1000(m, rect, false) + sep + "mille";
  return [mille, r ? moins1000(r, rect, true) : ""].filter(Boolean).join(sep);
}

export const GENERATEURS = [
  {
    id: "calcul-pose", nom: "Calcul posé", icone: "➕", couleur: "#cfe6ff", desc: "Opérations en colonnes", aleatoire: true,
    params: [
      { key: "titre", label: "Titre", type: "text", def: "Calcul posé" },
      { key: "consigne", label: "Consigne", type: "text", def: "Pose et calcule." },
      { key: "op", label: "Opération", type: "seg", options: [["+", "Addition"], ["−", "Soustraction"], ["×", "Multiplication"]], def: "+" },
      { key: "nd", label: "Nombre de chiffres", type: "seg", options: [["2", "2"], ["3", "3"], ["4", "4"]], def: "3" },
      { key: "retenue", label: "Retenues", type: "seg", options: [["sans", "Sans"], ["avec", "Avec"], ["mix", "Mélangé"]], def: "mix" },
      { key: "n", label: "Nombre d'opérations", type: "seg", options: [["6", "6"], ["9", "9"], ["12", "12"]], def: "9" },
      { key: "couleurs", label: "Couleurs unités / dizaines / centaines", type: "toggle", def: true },
      { key: "corrige", label: "Afficher le corrigé", type: "toggle", def: false },
    ],
    render(p, { rnd, esc }) {
      const ops = Array.from({ length: +p.n }, () => genOperation(rnd, p.op, +p.nd, p.retenue === "mix" ? (rnd() < 0.5 ? "sans" : "avec") : p.retenue));
      const legend = p.couleurs ? `<p class="ws-legend"><span class="pv0">u</span> unités · <span class="pv1">d</span> dizaines · <span class="pv2">c</span> centaines · <span class="pv3">m</span> milliers</p>` : "";
      return [page(entete(p, esc, legend) + `<div class="ws-grid3">${ops.map((o, i) => `<div class="ws-box"><span class="ws-tag">${String.fromCharCode(97 + i)}</span>${opTable(o, p.couleurs, p.corrige)}</div>`).join("")}</div>`)];
    },
  },
  {
    id: "calcul-ligne", nom: "Calcul en ligne", icone: "🔢", couleur: "#ffe3a3", desc: "Séries d'additions, soustractions, tables", aleatoire: true,
    params: [
      { key: "titre", label: "Titre", type: "text", def: "Calcul en ligne" },
      { key: "consigne", label: "Consigne", type: "text", def: "Calcule." },
      { key: "op", label: "Opération", type: "seg", options: [["+", "+"], ["−", "−"], ["×", "×"], ["mix", "Mélangé"]], def: "+" },
      { key: "max", label: "Nombres jusqu'à (+ et −)", type: "select", options: [["10", "10"], ["20", "20"], ["50", "50"], ["100", "100"], ["1000", "1 000"]], def: "20" },
      { key: "tables", label: "Tables (×), ex. 2,3,4", type: "text", def: "2,3,4,5" },
      { key: "n", label: "Nombre de calculs", type: "seg", options: [["20", "20"], ["30", "30"], ["40", "40"]], def: "30" },
      { key: "corrige", label: "Afficher le corrigé", type: "toggle", def: false },
    ],
    render(p, { rnd, esc }) {
      const tables = String(p.tables).split(/[,; ]+/).map(Number).filter((t) => t >= 1 && t <= 20);
      const T = tables.length ? tables : [2];
      const max = +p.max;
      const items = Array.from({ length: +p.n }, () => {
        const op = p.op === "mix" ? ["+", "−", "×"][ri(rnd, 0, 2)] : p.op;
        if (op === "+") { const a = ri(rnd, 0, max), b = ri(rnd, 0, max - a); return [`${a} + ${b}`, a + b]; }
        if (op === "−") { const a = ri(rnd, 0, max), b = ri(rnd, 0, a); return [`${a} − ${b}`, a - b]; }
        const a = T[ri(rnd, 0, T.length - 1)], b = ri(rnd, 1, 10);
        return rnd() < 0.5 ? [`${a} × ${b}`, a * b] : [`${b} × ${a}`, a * b];
      });
      return [page(entete(p, esc) + `<ol class="ws-inline">${items.map(([q, r]) => `<li><span>${q} =</span><b class="ws-ans">${p.corrige ? r : ""}</b></li>`).join("")}</ol>`)];
    },
  },
  {
    id: "heure", nom: "Lire l'heure", icone: "🕰️", couleur: "#c9ecd4", desc: "Horloges à lire ou à compléter", aleatoire: true,
    params: [
      { key: "titre", label: "Titre", type: "text", def: "Lire l'heure" },
      { key: "mode", label: "Exercice", type: "seg", options: [["lire", "Écrire l'heure"], ["dessiner", "Dessiner les aiguilles"]], def: "lire" },
      { key: "niveau", label: "Heures", type: "select", options: [["pile", "Heures pile"], ["demie", "Et demie"], ["quart", "Et quart, moins le quart"], ["cinq", "Par 5 minutes"], ["minute", "À la minute"]], def: "demie" },
      { key: "n", label: "Nombre d'horloges", type: "seg", options: [["6", "6"], ["9", "9"], ["12", "12"]], def: "9" },
      { key: "corrige", label: "Afficher le corrigé", type: "toggle", def: false },
    ],
    render(p, { rnd, esc }) {
      const mins = { pile: [0], demie: [0, 30], quart: [0, 15, 30, 45], cinq: Array.from({ length: 12 }, (_, i) => i * 5), minute: Array.from({ length: 60 }, (_, i) => i) }[p.niveau];
      const times = Array.from({ length: +p.n }, () => [ri(rnd, 1, 12), mins[ri(rnd, 0, mins.length - 1)]]);
      const lire = p.mode === "lire";
      const consigne = lire ? "Écris l'heure indiquée par chaque horloge." : "Dessine les aiguilles pour indiquer l'heure.";
      const size = +p.n === 12 ? 40 : 48;
      return [page(entete({ ...p, consigne }, esc) + `<div class="ws-grid3 clocks">${times.map(([h, m]) => `
        <div class="ws-clockbox">${clockSVG(h, m, lire || p.corrige, size)}
          <div class="ws-time">${lire && !p.corrige ? `<i></i> h <i></i>` : `${h} h ${pad(m)}`}</div></div>`).join("")}</div>`)];
    },
  },
  {
    id: "droite", nom: "Droite graduée", icone: "📏", couleur: "#d7ccff", desc: "Retrouver les nombres placés", aleatoire: true,
    params: [
      { key: "titre", label: "Titre", type: "text", def: "Droite graduée" },
      { key: "consigne", label: "Consigne", type: "text", def: "Écris le nombre qui correspond à chaque lettre." },
      { key: "pas", label: "Une graduation vaut", type: "seg", options: [["1", "1"], ["2", "2"], ["10", "10"], ["100", "100"]], def: "1" },
      { key: "max", label: "Nombres jusqu'à", type: "select", options: [["20", "20"], ["100", "100"], ["1000", "1 000"], ["10000", "10 000"]], def: "100" },
      { key: "n", label: "Nombre de droites", type: "seg", options: [["4", "4"], ["5", "5"], ["6", "6"]], def: "5" },
      { key: "corrige", label: "Afficher le corrigé", type: "toggle", def: false },
    ],
    render(p, { rnd, esc }) {
      const pas = +p.pas, max = +p.max, N = 20, W = 176;
      let lettre = 0;
      const lines = Array.from({ length: +p.n }, () => {
        const startMax = Math.max(0, Math.floor((max - N * pas) / (pas * 10)));
        const start = ri(rnd, 0, startMax) * pas * 10;
        const picks = new Set();
        while (picks.size < 3) { const k = ri(rnd, 1, N - 1); if (k % 10 && !picks.has(k - 1) && !picks.has(k + 1)) picks.add(k); }
        const ks = [...picks].sort((a, b) => a - b);
        const x = (k) => 4 + (k * (W - 8)) / N;
        let svg = `<svg viewBox="0 0 ${W} 26" width="${W}mm" height="26mm"><line x1="1" x2="${W - 1}" y1="14" y2="14" stroke="#3b3355" stroke-width="0.6"/><path d="M${W - 3},12 L${W - 0.5},14 L${W - 3},16" fill="none" stroke="#3b3355" stroke-width="0.6"/>`;
        for (let k = 0; k <= N; k++) {
          const big = k % 10 === 0, mid = k % 5 === 0;
          svg += `<line x1="${x(k)}" x2="${x(k)}" y1="${14 - (big ? 3.5 : mid ? 2.5 : 1.6)}" y2="${14 + (big ? 3.5 : mid ? 2.5 : 1.6)}" stroke="#3b3355" stroke-width="${big ? 0.6 : 0.35}"/>`;
          if (big) svg += `<text x="${x(k)}" y="23" font-size="3.6" font-weight="800" text-anchor="middle" fill="#3b3355">${(start + k * pas).toLocaleString("fr-FR")}</text>`;
        }
        const names = ks.map(() => LETTRES[lettre++ % LETTRES.length]);
        ks.forEach((k, i) => { svg += `<path d="M${x(k)},8.5 L${x(k)},11.5" stroke="#e0556a" stroke-width="0.6"/><text x="${x(k)}" y="7" font-size="3.8" font-weight="900" text-anchor="middle" fill="#e0556a">${names[i]}</text>`; });
        svg += "</svg>";
        return `<div class="ws-nl">${svg}<div class="ws-nl-ans">${ks.map((k, i) => `<span><b>${names[i]}</b> = <i>${p.corrige ? (start + k * pas).toLocaleString("fr-FR") : ""}</i></span>`).join("")}</div></div>`;
      });
      return [page(entete(p, esc) + lines.join(""))];
    },
  },
  {
    id: "ecriture", nom: "Modèle d'écriture", icone: "✍️", couleur: "#ffd0dc", desc: "Mots en cursive sur lignes Seyès", aleatoire: false,
    params: [
      { key: "titre", label: "Titre", type: "text", def: "Écriture" },
      { key: "consigne", label: "Consigne", type: "text", def: "Recopie chaque mot sur les lignes." },
      { key: "mots", label: "Mots ou phrases (un par ligne)", type: "textarea", def: "le\nla\nl'école\nl'écriture" },
      { key: "taille", label: "Lignes", type: "seg", options: [["3", "Grand Seyès (CP)"], ["2", "Seyès classique"]], def: "3" },
      { key: "repasser", label: "Une ligne en pointillés à repasser", type: "toggle", def: true },
      { key: "lignes", label: "Lignes vides par mot", type: "seg", options: [["1", "1"], ["2", "2"], ["3", "3"]], def: "2" },
    ],
    render(p, { esc, xRatio }) {
      const inter = +p.taille, row = inter * 4, W = 182;
      const fs = inter / (xRatio || 0.42);
      const mots = String(p.mots).split("\n").map((s) => s.trim()).filter(Boolean);
      const rowsPer = 1 + (p.repasser ? 1 : 0) + +p.lignes;
      const usable = 297 - 16 - 48; // hauteur dispo sous l'en-tête (mm)
      const perPage = Math.max(1, Math.floor(usable / (rowsPer * row)));
      const pages = [];
      for (let i = 0; i < Math.max(1, mots.length); i += perPage) {
        const chunk = mots.slice(i, i + perPage);
        const H = chunk.length * rowsPer * row + inter;
        let svg = `<svg viewBox="0 -${inter} ${W} ${H}" width="${W}mm" height="${H}mm" class="ws-seyes">${seyesLines(W, H - inter, inter)}`;
        chunk.forEach((m, j) => {
          const y0 = j * rowsPer * row;
          const base = (r) => y0 + r * row + row; // ligne foncée du bas de la rangée
          svg += `<text x="20" y="${base(0)}" font-family="'Playwrite FR Trad', cursive" font-size="${fs.toFixed(2)}" fill="#2b2b55">${esc(m)}</text>`;
          if (p.repasser) svg += `<text x="20" y="${base(1)}" font-family="'Playwrite FR Trad', cursive" font-size="${fs.toFixed(2)}" fill="#c3c9e6">${esc(m)}</text>`;
        });
        pages.push(page((i === 0 ? entete(p, esc) : "") + svg + "</svg>"));
      }
      return pages;
    },
  },
  {
    id: "graphisme", nom: "Graphisme", icone: "〰️", couleur: "#ffd7bf", desc: "Motifs à repasser puis reproduire", aleatoire: false,
    params: [
      { key: "titre", label: "Titre", type: "text", def: "Graphisme" },
      { key: "consigne", label: "Consigne", type: "text", def: "Repasse les pointillés, puis continue seul." },
      { key: "motifs", label: "Motifs", type: "multi", options: [["boucles", "Boucles"], ["ponts", "Ponts"], ["coupes", "Coupes"], ["vagues", "Vagues"], ["creneaux", "Créneaux"], ["scie", "Dents de scie"], ["ronds", "Ronds"]], def: ["boucles", "ponts", "vagues", "creneaux"] },
      { key: "taille", label: "Taille", type: "seg", options: [["grand", "Grand"], ["moyen", "Moyen"]], def: "grand" },
    ],
    render(p, { esc }) {
      const motifs = (p.motifs || []).length ? p.motifs : ["vagues"];
      const h = p.taille === "grand" ? 12 : 8, W = 182, gap = h + 10;
      const H = motifs.length * gap * 2;
      let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" class="ws-graph">`;
      motifs.forEach((m, i) => {
        const b1 = i * gap * 2 + h + 4, b2 = b1 + gap;
        for (const b of [b1, b2]) svg += `<line x1="0" x2="${W}" y1="${b}" y2="${b}" stroke="#c9d3f2" stroke-width="0.3"/><line x1="0" x2="${W}" y1="${b - h}" y2="${b - h}" stroke="#e3e8f7" stroke-width="0.25"/>`;
        svg += `<path d="${motifPath(m, 4, 40, b1, h)}" fill="none" stroke="#e0556a" stroke-width="0.9" stroke-linecap="round"/>`;
        svg += `<path d="${motifPath(m, 44, W - 4, b1, h)}" fill="none" stroke="#9aa3c9" stroke-width="0.6" stroke-dasharray="1 1.2" stroke-linecap="round"/>`;
        svg += `<path d="${motifPath(m, 4, 40, b2, h)}" fill="none" stroke="#9aa3c9" stroke-width="0.6" stroke-dasharray="1 1.2" stroke-linecap="round"/>`;
      });
      return [page(entete(p, esc) + svg + "</svg>")];
    },
  },
  {
    id: "conjugaison", nom: "Tableaux de conjugaison", icone: "📖", couleur: "#cfe6ff", desc: "Tableaux vierges à compléter", aleatoire: false,
    params: [
      { key: "titre", label: "Titre", type: "text", def: "Conjugaison" },
      { key: "consigne", label: "Consigne", type: "text", def: "Complète les tableaux de conjugaison." },
      { key: "verbes", label: "Verbes (séparés par des virgules)", type: "text", def: "chanter, finir, être, avoir, aller, prendre" },
      { key: "temps", label: "Temps", type: "select", options: [["Présent", "Présent"], ["Imparfait", "Imparfait"], ["Futur", "Futur"], ["Passé composé", "Passé composé"], ["Passé simple", "Passé simple"]], def: "Présent" },
    ],
    render(p, { esc }) {
      const verbes = String(p.verbes).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
      const pron = ["je", "tu", "il, elle, on", "nous", "vous", "ils, elles"];
      return [page(entete(p, esc) + `<div class="ws-conj">${verbes.map((v) => `
        <div class="ws-conj-box"><div class="ws-conj-head"><b>${esc(v)}</b><span>${esc(p.temps)}</span></div>
        ${pron.map((x) => `<div class="ws-conj-row"><span>${x}</span><i></i></div>`).join("")}</div>`).join("")}</div>`)];
    },
  },
  {
    id: "etiquettes", nom: "Étiquettes prénoms", icone: "🏷️", couleur: "#c9ecd4", desc: "Pour les tables, casiers, porte-manteaux", aleatoire: false,
    params: [
      { key: "source", label: "Prénoms", type: "seg", options: [["classe", "Ma classe"], ["liste", "Liste ci-dessous"]], def: "classe" },
      { key: "liste", label: "Liste (un prénom par ligne)", type: "textarea", def: "" },
      { key: "theme", label: "Couleurs", type: "seg", options: [["arcenciel", "Arc-en-ciel"], ["doux", "Pastel"], ["sobre", "Sobre"]], def: "arcenciel" },
      { key: "deco", label: "Décoration", type: "select", options: [["", "Aucune"], ["⭐", "⭐ Étoiles"], ["🍎", "🍎 Pommes"], ["🌸", "🌸 Fleurs"], ["🦋", "🦋 Papillons"], ["🚀", "🚀 Fusées"], ["🌈", "🌈 Arcs-en-ciel"]], def: "⭐" },
      { key: "cursive", label: "Ajouter le prénom en cursive", type: "toggle", def: true },
      { key: "format", label: "Format", type: "seg", options: [["2", "Grandes (2 par ligne)"], ["3", "Petites (3 par ligne)"]], def: "2" },
    ],
    render(p, { esc, eleves }) {
      const noms = p.source === "classe" ? eleves.map((e) => e.prenom) : String(p.liste).split("\n").map((s) => s.trim()).filter(Boolean);
      if (!noms.length) return [page(`<div class="ws-empty">Aucun prénom. Ajoute tes élèves dans « Mes élèves » ou choisis « Liste ci-dessous ».</div>`)];
      const pal = { arcenciel: ["#ffb3c1", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#bdb2ff"], doux: ["#d9c8ff", "#bfe3ff", "#ffc8de", "#d4f5b0", "#ffe6a3"], sobre: ["#e5e7eb"] }[p.theme];
      const cols = +p.format, rows = cols === 2 ? 7 : 9, per = cols * rows;
      const pages = [];
      for (let i = 0; i < noms.length; i += per) {
        pages.push(page(`<div class="ws-labels cols${cols}">${noms.slice(i, i + per).map((n, k) => `
          <div class="ws-label" style="--lc:${pal[(i + k) % pal.length]}">${p.deco ? `<span class="ws-deco">${p.deco}</span>` : ""}
            <div><div class="ws-label-name">${esc(n)}</div>${p.cursive ? `<div class="ws-label-cur">${esc(n)}</div>` : ""}</div>
            ${p.deco ? `<span class="ws-deco">${p.deco}</span>` : ""}</div>`).join("")}</div>`, "labels"));
      }
      return pages;
    },
  },
  {
    id: "problemes", nom: "Problèmes", icone: "🧩", couleur: "#ffd7bf", desc: "Problèmes à une, deux ou trois étapes", aleatoire: true,
    params: [
      { key: "titre", label: "Titre", type: "text", def: "Résoudre des problèmes" },
      { key: "consigne", label: "Consigne", type: "text", def: "Lis chaque problème, écris ton calcul puis une phrase réponse." },
      { key: "niveau", label: "Niveau", type: "seg", options: [["cp", "CP-CE1 (une étape, jusqu'à 30)"], ["ce", "CE (1 ou 2 étapes, jusqu'à 100)"], ["cm", "CM (2 ou 3 étapes)"]], def: "ce" },
      { key: "n", label: "Nombre de problèmes", type: "seg", options: [["4", "4"], ["6", "6"], ["8", "8"]], def: "4" },
      { key: "corrige", label: "Afficher le corrigé", type: "toggle", def: false },
    ],
    render(p, { rnd, esc }) {
      const pool = PROBLEMES.filter((t) => t.niv.includes(p.niveau));
      const vus = new Set(), items = [];
      for (let essai = 0; items.length < +p.n && essai < 200; essai++) {
        const k = ri(rnd, 0, pool.length - 1);
        if (vus.has(k) && vus.size < pool.length) continue;
        vus.add(k);
        const [nom, pron] = PRENOMS[ri(rnd, 0, PRENOMS.length - 1)];
        const r = pool[k].gen(rnd, p.niveau, nom, pron);
        if (r) items.push(r);
      }
      const pages = [];
      for (let i = 0; i < items.length; i += 4) {
        pages.push(page((i ? "" : entete(p, esc)) + `<div class="ws-pbs">${items.slice(i, i + 4).map((it, k) => `
          <div class="ws-pb"><p class="ws-pb-text"><b class="ws-pb-n">${i + k + 1}</b> ${esc(it.texte)}</p>
            <div class="ws-pb-zone"><span class="ws-pb-lab">Mes calculs</span>${p.corrige ? `<div class="ws-pb-key">${it.calculs.map(esc).join("<br>")}</div>` : ""}</div>
            <div class="ws-pb-rep"><span>Réponse :</span><i class="ws-dots">${p.corrige ? `<span class="ws-pb-key">${esc(it.reponse)}</span>` : ""}</i></div></div>`).join("")}</div>`));
      }
      return pages;
    },
  },
  {
    id: "dictee-nombres", nom: "Dictée de nombres", icone: "🔢", couleur: "#cfe6ff", desc: "Fiche élève et liste en lettres pour l'enseignant", aleatoire: true,
    params: [
      { key: "titre", label: "Titre", type: "text", def: "Dictée de nombres" },
      { key: "mode", label: "Exercice", type: "seg", options: [["dictee", "Dictée : écrire en chiffres"], ["lettres", "Écrire en lettres"]], def: "dictee" },
      { key: "plage", label: "Nombres", type: "select", options: [["100", "De 0 à 100"], ["1000", "De 0 à 1 000"], ["10000", "De 0 à 10 000"], ["1000000", "Jusqu'à 999 999"]], def: "100" },
      { key: "n", label: "Nombre de nombres", type: "seg", options: [["10", "10"], ["15", "15"], ["20", "20"]], def: "10" },
      { key: "ortho", label: "Orthographe", type: "seg", options: [["rect", "Rectifiée (traits d'union partout)"], ["trad", "Traditionnelle"]], def: "rect" },
      { key: "corrige", label: "Afficher le corrigé", type: "toggle", def: false },
    ],
    render(p, { rnd, esc }) {
      const max = +p.plage, rect = p.ortho === "rect";
      const vus = new Set(), nb = [];
      while (nb.length < +p.n && vus.size < max) {
        // On mélange les tailles de nombres pour ne pas avoir que des grands nombres
        const chiffres = String(max).length - 1, ordre = Math.pow(10, ri(rnd, Math.max(1, chiffres - 2), chiffres));
        const x = ri(rnd, 0, Math.min(max, ordre) - (max === 1000000 ? 1 : 0));
        if (!vus.has(x)) { vus.add(x); nb.push(x); }
      }
      const fmt = (x) => x.toLocaleString("fr-FR");
      const dictee = p.mode === "dictee";
      const consigne = dictee ? "Écris en chiffres les nombres dictés." : "Écris ces nombres en lettres.";
      const eleve = page(entete({ ...p, consigne }, esc) + `<ol class="ws-dn ${dictee ? "" : "lettres"}">${nb.map((x) => `<li>${dictee ? `<b class="ws-ans">${p.corrige ? fmt(x) : ""}</b>` : `<b class="ws-dn-n">${fmt(x)}</b><i class="ws-dots">${p.corrige ? `<span class="ws-pb-key">${enLettres(x, rect)}</span>` : ""}</i>`}</li>`).join("")}</ol>`);
      if (!dictee) return [eleve];
      const prof = page(`<h1 class="ws-title">${esc(p.titre)} <small class="ws-key">Pour l'enseignant</small></h1>
        <p class="ws-consigne">Orthographe ${rect ? "rectifiée de 1990 (traits d'union entre tous les mots)" : "traditionnelle"}.</p>
        <ol class="ws-dn prof">${nb.map((x) => `<li><b>${fmt(x)}</b><span>${enLettres(x, rect)}</span></li>`).join("")}</ol>`);
      return [eleve, prof];
    },
  },
  {
    id: "fiche-lecture", nom: "Fiche de lecture", icone: "📚", couleur: "#d7ccff", desc: "Pour garder la trace d'un livre lu", aleatoire: false,
    params: [
      { key: "titre", label: "Titre de la fiche", type: "text", def: "Ma fiche de lecture" },
      { key: "niveau", label: "Version", type: "seg", options: [["c2", "Cycle 2 (simple)"], ["c3", "Cycle 3"]], def: "c2" },
      { key: "livre", label: "Titre du livre (facultatif, sinon à remplir)", type: "text", def: "" },
      { key: "auteur", label: "Auteur (facultatif)", type: "text", def: "" },
      { key: "dessin", label: "Cadre pour dessiner", type: "toggle", def: true },
    ],
    render(p, { esc }) {
      const c3 = p.niveau === "c3";
      const champ = (lab, val) => `<div class="ws-fl-row"><span>${lab} :</span><i class="ws-dots">${val ? `<b class="ws-fl-val">${esc(val)}</b>` : ""}</i></div>`;
      const lignes = (n) => `<div class="ws-fl-lines">${Array.from({ length: n }, () => `<i></i>`).join("")}</div>`;
      const genres = c3 ? ["Roman", "Album", "Bande dessinée", "Conte", "Documentaire", "Poésie", "Théâtre"] : ["Album", "Bande dessinée", "Conte", "Documentaire", "Poésie"];
      return [page(`
        <div class="ws-head"><span>Prénom : <i class="ws-dots"></i></span><span>Date : <i class="ws-dots short"></i></span></div>
        <h1 class="ws-title">${esc(p.titre)}</h1>
        <div class="ws-fl ${c3 ? "fl-c3" : "fl-c2"}">
          <div class="ws-fl-id">
            ${champ("Titre", p.livre)}${champ("Auteur", p.auteur)}${c3 ? champ("Illustrateur", "") + champ("Éditeur", "") : ""}
            <div class="ws-fl-row"><span>C'est :</span><span class="ws-fl-genres">${genres.map((g) => `<span>☐ ${g}</span>`).join("")}</span></div>
          </div>
          <h3>${c3 ? "Les personnages principaux" : "Les personnages"}</h3>${lignes(c3 ? 2 : 2)}
          <h3>${c3 ? "Résume l'histoire en quelques phrases" : "Ce qui se passe dans l'histoire"}</h3>${lignes(c3 ? 5 : 3)}
          ${c3 ? `<h3>Mon passage préféré, et pourquoi</h3>${lignes(3)}` : ""}
          ${p.dessin ? `<h3>${c3 ? "J'illustre un moment de l'histoire" : "Je dessine mon moment préféré"}</h3><div class="ws-fl-draw ${c3 ? "small" : ""}"></div>` : ""}
          <h3>Mon avis</h3>
          <div class="ws-fl-avis">${c3 ? "☆ ☆ ☆ ☆ ☆" : "<span>😍</span><span>🙂</span><span>😐</span><span>🙁</span>"}</div>
          ${c3 ? lignes(2) : ""}
        </div>`)];
    },
  },
  {
    id: "mots-meles", nom: "Mots mêlés", icone: "🔎", couleur: "#c9ecd4", desc: "Grille générée avec tes mots", aleatoire: true,
    params: [
      { key: "titre", label: "Titre", type: "text", def: "Mots mêlés" },
      { key: "consigne", label: "Consigne", type: "text", def: "Retrouve et entoure les mots cachés dans la grille." },
      { key: "mots", label: "Mots à cacher (un par ligne ou séparés par des virgules)", type: "textarea", def: "soleil, nuage, pluie, neige, orage, vent, arc-en-ciel, brouillard" },
      { key: "taille", label: "Taille de la grille", type: "seg", options: [["8", "8 × 8"], ["10", "10 × 10"], ["12", "12 × 12"], ["15", "15 × 15"]], def: "12" },
      { key: "niveau", label: "Sens des mots", type: "seg", options: [["facile", "→ et ↓"], ["moyen", "+ diagonales"], ["difficile", "+ à l'envers"]], def: "facile" },
      { key: "corrige", label: "Afficher le corrigé", type: "toggle", def: false },
    ],
    render(p, { rnd, esc }) {
      const n = +p.taille;
      const { grille, places, rejetes } = grilleMotsMeles(String(p.mots).split(/[\n,;]/), n, p.niveau, rnd);
      const sol = new Set(p.corrige ? places.flatMap((x) => x.cells.map(([r, c]) => `${r},${c}`)) : []);
      return [page(entete(p, esc) + `
        <div class="ws-mm" style="--n:${n}">${grille.map((row, r) => row.map((l, c) => `<span class="${sol.has(`${r},${c}`) ? "on" : ""}">${l}</span>`).join("")).join("")}</div>
        <ul class="ws-mm-list">${places.map((x) => `<li>☐ ${esc(x.mot)}</li>`).join("")}</ul>
        ${rejetes.length ? `<p class="ws-empty no-print">Non placés (trop longs pour la grille ?) : ${rejetes.map(esc).join(", ")}</p>` : ""}`)];
    },
  },
];

// Générateur pseudo-aléatoire à graine (même série tant qu'on ne demande pas « Nouvelle série »)
export function seeded(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
