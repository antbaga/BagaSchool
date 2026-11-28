// Maths « Grandeurs et mesures », du CP au CM2 : tableau de conversion interactif, jeu des conversions,
// problèmes de mesures, « Quelle unité ? ».
// Même format que outils.js : { id, nom, icone, couleur, desc, mount(el, ctx) -> cleanup }.
// Tous les contenus par niveau sont dans les tableaux de données ci-dessous, pour être relus et ajustés.
// Repères : programmes du cycle 2 (CP-CE2, rentrée 2025) et du cycle 3 (CM1-CM2, rentrée 2026).
// Calculs exacts : toutes les valeurs sont des entiers dans la plus petite unité (mm, mg, mL, minutes…).
import { niveauJeux, segNiveau, surNiveau, rang } from "./niveau.js";

// =====================================================================
// 1. DONNÉES PAR NIVEAU (à relire)
// =====================================================================

// Puissance de 10 de chaque unité par rapport à la plus petite (mm, mg, mL).
const UNITES = {
  longueurs: { km: 6, hm: 5, dam: 4, m: 3, dm: 2, cm: 1, mm: 0 },
  masses: { t: 9, q: 8, "·": 7, kg: 6, hg: 5, dag: 4, g: 3, dg: 2, cg: 1, mg: 0 }, // « · » : colonne vide des dizaines de kg
  contenances: { hL: 5, daL: 4, L: 3, dL: 2, cL: 1, mL: 0 },
  aires: { "m²": 4, "dm²": 2, "cm²": 0 }, // CM2 : 1 m² = 100 dm², 1 dm² = 100 cm²
};
const UNITE_REF = { longueurs: "m", masses: "g", contenances: "L" };
const NOMS_UNITES = {
  km: "kilomètre", hm: "hectomètre", dam: "décamètre", m: "mètre", dm: "décimètre", cm: "centimètre", mm: "millimètre",
  t: "tonne", q: "quintal", "·": "", kg: "kilogramme", hg: "hectogramme", dag: "décagramme", g: "gramme", dg: "décigramme", cg: "centigramme", mg: "milligramme",
  "m²": "mètre carré", "dm²": "décimètre carré", "cm²": "centimètre carré",
  hL: "hectolitre", daL: "décalitre", L: "litre", dL: "décilitre", cL: "centilitre", mL: "millilitre",
  s: "seconde", min: "minute", h: "heure", jours: "jour", semaines: "semaine", mois: "mois", ans: "année",
};
const GRANDEURS = {
  longueurs: { nom: "Longueurs", ico: "📏" },
  masses: { nom: "Masses", ico: "⚖️" },
  contenances: { nom: "Contenances", ico: "🧃" },
  aires: { nom: "Aires", ico: "🟦" },
  durees: { nom: "Durées", ico: "⏱️" },
  monnaie: { nom: "Monnaie", ico: "💶" },
};

// Colonnes du tableau de conversion par niveau. « * » = unité affichée en grisé (pas encore étudiée à ce niveau,
// mais la colonne est nécessaire pour qu'il y ait un chiffre par colonne). Pas de ligne = grandeur pas au programme.
const TABLEAU_NIV = {
  CP: { longueurs: "m dm* cm" },
  CE1: { longueurs: "km hm* dam* m dm* cm", masses: "kg hg* dag* g" },
  CE2: { longueurs: "km hm* dam* m dm cm mm", masses: "t q* ·* kg hg* dag* g", contenances: "L dL cL" },
  CM1: { longueurs: "km hm dam m dm cm mm", masses: "t q · kg hg dag g dg cg mg", contenances: "hL daL L dL cL mL" },
  CM2: { longueurs: "km hm dam m dm cm mm", masses: "t q · kg hg dag g dg cg mg", contenances: "hL daL L dL cL mL" },
};

// Jeu des conversions. paires : conversions proposées (« de>vers ») ; « * » = toutes les paires entre `unites`
// distantes d'au plus `ecart` colonnes. kmax : nombre maximal dans la grande unité ; maxPetit : plus grand nombre
// dans la petite unité (le domaine numérique du niveau) ; dec : nombre maximal de chiffres après la virgule ;
// complexe : « 2 m 45 cm » ; complement : « 40 cm + … cm = 1 m ».
const CONV_NIV = {
  CP: {
    longueurs: { paires: "m>cm cm>m", kmax: 1, maxPetit: 100, dec: 0, complexe: false, complement: true },
    durees: ["sem>j", "j-semaine"],
  },
  CE1: {
    longueurs: { paires: "m>cm cm>m km>m m>km", kmax: 9, maxPetit: 1000, dec: 0, complexe: true, complement: true },
    masses: { paires: "kg>g g>kg", kmax: 1, maxPetit: 1000, dec: 0, complexe: false, complement: true },
    durees: ["sem>j", "j>h", "an>mois"],
  },
  CE2: {
    longueurs: { paires: "m>cm cm>m km>m m>km m>dm dm>m dm>cm cm>dm cm>mm mm>cm m>mm", kmax: 50, maxPetit: 10000, dec: 0, complexe: true, complement: true },
    masses: { paires: "kg>g g>kg t>kg kg>t", kmax: 9, maxPetit: 10000, dec: 0, complexe: true, complement: true },
    contenances: { paires: "L>dL dL>L L>cL cL>L dL>cL cL>dL", kmax: 20, maxPetit: 10000, dec: 0, complexe: true, complement: true },
    durees: ["h>min", "hmin>min", "min>hmin", "demi", "j>h", "sem>j"],
  },
  CM1: {
    longueurs: { paires: "*", unites: "km hm dam m dm cm mm", ecart: 3, kmax: 99, maxPetit: 100000, dec: 2, complexe: true },
    masses: { paires: "*", unites: "t kg hg dag g dg cg mg", ecart: 3, kmax: 99, maxPetit: 100000, dec: 2, complexe: true },
    contenances: { paires: "*", unites: "hL daL L dL cL mL", ecart: 3, kmax: 99, maxPetit: 100000, dec: 2, complexe: true },
    durees: ["hmin>min", "min>hmin", "jh>h", "h>jh", "siecle>an", "an>siecle", "demi"],
  },
  CM2: {
    longueurs: { paires: "*", unites: "km hm dam m dm cm mm", ecart: 3, kmax: 999, maxPetit: 1000000, dec: 3, complexe: true },
    masses: { paires: "*", unites: "t kg hg dag g dg cg mg", ecart: 3, kmax: 999, maxPetit: 1000000, dec: 3, complexe: true },
    contenances: { paires: "*", unites: "hL daL L dL cL mL", ecart: 3, kmax: 999, maxPetit: 1000000, dec: 3, complexe: true },
    aires: { paires: "m²>dm² dm²>m² dm²>cm² cm²>dm² m²>cm² cm²>m²", kmax: 99, maxPetit: 1000000, dec: 2, complexe: false },
    durees: ["hmin>min", "min>hmin", "min>s", "mins>s", "s>mins", "h>jh", "an>siecle", "h>s", "hdec>min", "millenaire"],
  },
};

// « Quelle unité ? » : unités proposées par niveau.
const QU_UNITES = {
  CP: { longueurs: ["cm", "m"], durees: ["jours", "semaines", "mois"] },
  CE1: { longueurs: ["cm", "m", "km"], masses: ["g", "kg"], durees: ["min", "h", "jours", "mois"] },
  CE2: { longueurs: ["mm", "cm", "m", "km"], masses: ["g", "kg", "t"], contenances: ["cL", "dL", "L"], durees: ["min", "h", "jours"] },
  CM1: { longueurs: ["mm", "cm", "m", "km"], masses: ["mg", "g", "kg", "t"], contenances: ["mL", "cL", "L", "hL"], durees: ["min", "h", "jours", "ans"] },
  CM2: { longueurs: ["mm", "cm", "m", "km"], masses: ["mg", "g", "kg", "t"], contenances: ["mL", "cL", "L", "hL"], durees: ["s", "min", "h", "jours", "ans"] },
};
const GRANDEUR_DE = { mm: "longueurs", cm: "longueurs", m: "longueurs", km: "longueurs", mg: "masses", g: "masses", kg: "masses", t: "masses", mL: "contenances", cL: "contenances", dL: "contenances", L: "contenances", hL: "contenances", s: "durees", min: "durees", h: "durees", jours: "durees", semaines: "durees", mois: "durees", ans: "durees" };
// [phrase avec « _ » à la place de l'unité, bonne unité, niveau minimal]
const QU_ITEMS = [
  ["Un crayon neuf mesure 17 _.", "cm", "CP"], ["La porte de la classe mesure 2 _ de haut.", "m", "CP"], ["Une règle d'écolier mesure 20 _.", "cm", "CP"],
  ["Une gomme mesure 5 _ de long.", "cm", "CP"], ["Un autobus mesure 12 _ de long.", "m", "CP"], ["La cour de récréation mesure 40 _ de long.", "m", "CP"],
  ["Un lit mesure 2 _ de long.", "m", "CP"], ["Une petite cuillère mesure 13 _.", "cm", "CP"], ["Un tableau de classe mesure 3 _ de large.", "m", "CP"],
  ["Une girafe mesure 5 _ de haut.", "m", "CP"], ["Un timbre mesure 3 _ de large.", "cm", "CP"],
  ["Entre Paris et Lyon, il y a environ 470 _ par la route.", "km", "CE1"], ["Pour aller au collège, Léo marche 2 _.", "km", "CE1"],
  ["La tour Eiffel mesure environ 330 _ de haut.", "m", "CE1"], ["Un tour de piste d'athlétisme mesure 400 _.", "m", "CE1"], ["Un marathon mesure environ 42 _.", "km", "CE1"],
  ["Une coccinelle mesure 6 _.", "mm", "CE2"], ["Un grain de riz mesure 5 _ de long.", "mm", "CE2"], ["Une pièce de 1 € a une épaisseur d'environ 2 _.", "mm", "CE2"], ["Une fourmi mesure 4 _.", "mm", "CE2"],
  ["Une pomme pèse 150 _.", "g", "CE1"], ["Un paquet de sucre pèse 1 _.", "kg", "CE1"], ["Un chat adulte pèse 4 _.", "kg", "CE1"], ["Une gomme pèse 20 _.", "g", "CE1"],
  ["Une plaquette de beurre pèse 250 _.", "g", "CE1"], ["Un cartable bien rempli pèse 5 _.", "kg", "CE1"], ["Un enfant de 7 ans pèse environ 25 _.", "kg", "CE1"],
  ["Une feuille de papier pèse 5 _.", "g", "CE1"], ["Un sac de pommes de terre pèse 10 _.", "kg", "CE1"], ["Une fraise pèse 15 _.", "g", "CE1"],
  ["Une voiture pèse environ 1 _.", "t", "CE2"], ["Un éléphant pèse environ 5 _.", "t", "CE2"], ["Un comprimé pèse 500 _.", "mg", "CM1"], ["Un camion chargé pèse 30 _.", "t", "CE2"], ["Un grain de sel pèse environ 1 _.", "mg", "CM1"],
  ["Un seau contient 10 _ d'eau.", "L", "CE2"], ["Une canette de jus contient 33 _.", "cL", "CE2"], ["Un verre d'eau contient 20 _.", "cL", "CE2"], ["Une baignoire contient 200 _ d'eau.", "L", "CE2"],
  ["Un arrosoir contient 10 _.", "L", "CE2"], ["Une brique de lait contient 1 _.", "L", "CE2"], ["Une tasse de chocolat chaud contient 2 _.", "dL", "CE2"], ["Le réservoir d'une voiture contient 50 _ d'essence.", "L", "CE2"],
  ["Une cuillère à café contient 5 _.", "mL", "CM1"], ["Un flacon de sirop contient 150 _.", "mL", "CM1"], ["Une piscine gonflable contient 20 _ d'eau.", "hL", "CM1"], ["Une goutte d'eau, c'est environ 1 _.", "mL", "CM1"],
  ["Un week-end dure 2 _.", "jours", "CP"], ["Les vacances de la Toussaint durent 2 _.", "semaines", "CP"], ["Une année scolaire dure 10 _.", "mois", "CP"], ["Les grandes vacances durent 2 _.", "mois", "CP"],
  ["Un anniversaire revient tous les 12 _.", "mois", "CP"], ["Une semaine dure 7 _.", "jours", "CP"],
  ["La récréation dure 15 _.", "min", "CE1"], ["Une nuit de sommeil dure 10 _.", "h", "CE1"], ["Se brosser les dents dure 3 _.", "min", "CE1"], ["Un match de football dure 90 _.", "min", "CE1"],
  ["Un film au cinéma dure 2 _.", "h", "CE1"], ["Une journée d'école dure 6 _.", "h", "CE1"], ["Le trajet Paris-Marseille en TGV dure environ 3 _.", "h", "CE1"], ["Les vacances d'hiver durent 14 _.", "jours", "CE1"],
  ["Un éternuement dure 1 _.", "s", "CM2"], ["Courir 50 mètres prend environ 10 _.", "s", "CM2"], ["Faire cuire un œuf à la coque prend 3 _.", "min", "CE2"], ["Un battement de cœur dure environ 1 _.", "s", "CM2"],
  ["Un siècle dure 100 _.", "ans", "CM1"], ["Une tortue peut vivre 80 _.", "ans", "CM1"], ["Faire le tour de la Terre en avion prend environ 2 _.", "jours", "CM1"],
];

// =====================================================================
// 2. OUTILS COMMUNS
// =====================================================================
const hasard = (n) => Math.floor(Math.random() * n);
const entre = (a, b) => a + hasard(b - a + 1);
const choisir = (a) => a[hasard(a.length)];
const melange = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = hasard(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const p10 = (e) => 10 ** e;
const NB = " ", FINE = " ";
const escM = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Entier v (en petite unité) -> écriture décimale dans l'unité d'exposant e (« 3250 », 3 -> « 3,25 »)
export const depuisBase = (v, e) => {
  let s = String(v);
  if (e <= 0) return s + "0".repeat(-e);
  s = s.padStart(e + 1, "0");
  const i = s.slice(0, -e), f = s.slice(-e).replace(/0+$/, "");
  return f ? `${i},${f}` : i;
};
// Écriture normalisée d'une saisie (« 03,50 » -> « 3,5 ») pour comparer les réponses
export const normaliser = (s) => {
  let [i, f = ""] = String(s).replace(".", ",").split(",");
  i = i.replace(/^0+(?=\d)/, "") || "0"; f = f.replace(/0+$/, "");
  return f ? `${i},${f}` : i;
};
// Groupes de trois chiffres séparés par une espace fine insécable (« 12 500,25 »)
const fmtNb = (s) => { const [i, f] = String(s).split(","); const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, FINE); return f !== undefined ? `${g},${f}` : g; };
const qte = (v, u) => `${fmtNb(String(v))}${NB}${u}`;
const qteB = (v, e, u) => qte(depuisBase(v, e), u);
// Typographie française : espace fine avant ? ! ; et insécable avant : et à l'intérieur des guillemets
const UNITES_RE = /(\d) (?=(?:mm|cm|dm|m|dam|hm|km|mg|cg|dg|g|dag|hg|kg|t|mL|cL|dL|L|daL|hL|m²|dm²|cm²|€|h|min|s)(?![\p{L}\d²]))/gu;
const typo = (s) => s.replace(/(\d) (?=\d{3}(?!\d))/g, `$1${FINE}`).replace(UNITES_RE, `$1${NB}`).replace(/ ([?!;])/g, `${FINE}$1`).replace(/ :/g, `${NB}:`).replace(/« /g, `«${NB}`).replace(/ »/g, `${NB}»`);
const pluriel = (n, sg, pl = sg + "s") => (n > 1 ? pl : sg);
const heure = (m) => { const h = Math.floor(m / 60) % 24, mm = m % 60; return mm ? `${h}${NB}h${NB}${String(mm).padStart(2, "0")}` : `${h}${NB}h`; };
const duree = (m) => { const h = Math.floor(m / 60), mm = m % 60; return [h ? `${h}${NB}h` : "", mm ? `${mm}${NB}min` : ""].filter(Boolean).join(" ") || `0${NB}min`; };

const colonnes = (niv, g) => (TABLEAU_NIV[niv][g] || "").split(" ").filter(Boolean).map((t) => { const faible = t.endsWith("*"), u = t.replace("*", ""); return { u, e: UNITES[g][u], faible }; });
const grandeursTableau = (niv) => Object.keys(TABLEAU_NIV[niv]);
const grandeursConv = (niv) => Object.keys(CONV_NIV[niv]);

// Pavé numérique des outils de mesure (classe mes-pad : reste au tableau en projection s'il est dans .rc-board)
const padHTML = (virgule = true) => `<div class="mes-pad" role="group" aria-label="Pavé numérique">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => `<button type="button" data-k="${n}">${n}</button>`).join("")}${virgule ? `<button type="button" data-k="," class="mes-k-virg" aria-label="Virgule">,</button>` : ""}<button type="button" data-k="del" class="mes-k-del" aria-label="Effacer">⌫</button></div>`;
const segGrandeur = (liste, cur, extra = []) => `<div class="seg mes-seg" role="group" aria-label="Grandeur">${[...liste.map((g) => [g, `${GRANDEURS[g].ico} ${GRANDEURS[g].nom}`]), ...extra].map(([g, l]) => `<button type="button" data-g="${g}" class="${g === cur ? "on" : ""}">${l}</button>`).join("")}</div>`;
// Saisie au clavier physique (sauf dans un champ de formulaire)
const clavier = (cb) => { const f = (e) => { if (e.target.closest?.("input,textarea,select,[contenteditable]") || e.ctrlKey || e.metaKey || e.altKey) return; if (cb(e) === true) e.preventDefault(); }; document.addEventListener("keydown", f); return () => document.removeEventListener("keydown", f); };

// Placement d'une valeur dans le tableau : chiffres du nombre de départ et zéros à ajouter pour l'unité d'arrivée.
export function placement(v, eDep, eArr) {
  const s = String(v); let hi = Math.max(s.length - 1, 0);
  let lo = 0; while (lo < hi && s[s.length - 1 - lo] === "0") lo++;
  if (v === 0) lo = hi = 0;
  const d1 = Math.max(hi, eDep), d0 = Math.min(eDep, lo), a1 = Math.max(hi, eArr), a0 = Math.min(eArr, lo);
  const cases = {};
  for (let e = Math.max(d1, a1); e >= Math.min(d0, a0); e--) cases[e] = { d: Math.floor(v / p10(e)) % 10, ajoute: e > d1 || e < d0 };
  return cases;
}
// Lecture d'un tableau (chiffres par colonne) dans l'unité d'exposant e : zéros manquants compris
export function lireTableau(chiffres, e) {
  const es = Object.keys(chiffres).map(Number);
  if (!es.length) return null;
  const hi = Math.max(...es, e), lo = Math.min(...es, e);
  let i = "", f = "";
  for (let k = hi; k >= lo; k--) { const d = chiffres[k] ?? "0"; if (k >= e) i += d; else f += d; }
  return normaliser(f ? `${i},${f}` : i);
}

// Tableau HTML (utilisé par l'outil tableau et par l'aide du jeu des conversions)
function tableauHTML(cols, { cases = {}, virgule = null, virguleArr = null, dep = null, arr = null, sel = null, actif = false, zeros = {} }) {
  const tag = actif ? "button" : "span";
  const c0 = cols.find((c) => c.u !== "·");
  const refU = c0 ? Object.entries(UNITE_REF).find(([g]) => UNITES[g][c0.u] !== undefined)?.[1] : null;
  return `<table class="mes-table ${actif ? "actif" : ""}" style="--n:${cols.length}"><thead><tr>${cols.map((c) => {
    const etat = c.e === dep ? "dep" : c.e === arr ? "arr" : "";
    return `<th class="${etat} ${c.faible ? "faible" : ""} ${c.u === refU ? "ref" : ""}"><${tag} ${actif ? `type="button" data-col="${c.e}" aria-label="Colonne ${escM(NOMS_UNITES[c.u] || "vide")}"` : ""} class="mes-th">${c.u === "·" ? "&nbsp;" : escM(c.u)}${etat ? `<small>${etat === "dep" ? "départ" : "arrivée"}</small>` : ""}</${tag}></th>`;
  }).join("")}</tr></thead><tbody><tr>${cols.map((c) => {
    const x = cases[c.e], z = zeros[c.e];
    const etat = c.e === dep ? "dep" : c.e === arr ? "arr" : "";
    const txt = x != null ? (typeof x === "object" ? x.d : x) : z ? "0" : "";
    const cl = [etat, c.e === sel ? "sel" : "", x != null && typeof x === "object" && x.ajoute ? "ajoute" : "", x == null && z ? "ajoute" : ""].join(" ");
    return `<td class="${cl}"><${tag} ${actif ? `type="button" data-cell="${c.e}" aria-label="Case des ${escM(NOMS_UNITES[c.u] || "dizaines")}"` : ""} class="mes-td">${txt}</${tag}>${virgule === c.e ? `<i class="mes-virg">,</i>` : virguleArr === c.e ? `<i class="mes-virg arr">,</i>` : ""}</td>`;
  }).join("")}</tr></tbody></table>`;
}

// =====================================================================
// 3. GÉNÉRATEURS DE CONVERSIONS
// =====================================================================
function pairesMetriques(C, g) {
  if (C.paires !== "*") return C.paires.split(" ").map((p) => p.split(">"));
  const us = C.unites.split(" "), out = [];
  for (const a of us) for (const b of us) if (a !== b && Math.abs(UNITES[g][a] - UNITES[g][b]) <= C.ecart) out.push([a, b]);
  return out;
}
// Conversions « complexes » (2 m 45 cm) seulement entre unités qu'on associe dans la vie courante.
const COMPLEXES_OK = new Set("km>m m>cm m>dm dm>cm cm>mm m>mm kg>g t>kg g>mg L>cL L>dL L>mL dL>cL hL>L".split(" "));
// Au cycle 3, les unités les plus courantes reviennent plus souvent (3 fois sur 4).
const COURANTES = new Set("km m cm mm t kg g mg hL L dL cL mL m² dm² cm²".split(" "));
const avecTab = (niv, tab) => (TABLEAU_NIV[niv][tab.g] ? tab : null);
function convMetrique(niv, g) {
  const C = CONV_NIV[niv][g], U = UNITES[g], paires = pairesMetriques(C, g);
  for (let essai = 0; essai < 80; essai++) {
    const courantes = paires.filter(([x, y]) => COURANTES.has(x) && COURANTES.has(y));
    const [a, b] = choisir(C.paires === "*" && courantes.length && hasard(4) ? courantes : paires), ea = U[a], eb = U[b];
    const eG = Math.max(ea, eb), eP = Math.min(ea, eb), ecart = eG - eP;
    const grand = ea > eb ? a : b, petit = ea > eb ? b : a;
    const types = ["simple", "simple"];
    if (C.complexe && COMPLEXES_OK.has(`${grand}>${petit}`)) types.push("complexe");
    if (C.complement && ea > eb && p10(ecart) <= C.maxPetit) types.push("complement");
    if (C.dec) types.push("dec", "dec", "dec");
    const type = choisir(types);
    if (type === "complement") {
      const tout = p10(ecart), pas = tout >= 1000 ? (choisir([100, 50, 250])) : tout >= 100 ? (niv === "CP" ? 10 : choisir([10, 5])) : 1;
      const x = pas * entre(1, tout / pas - 1);
      return { g, gauche: `${qte(x, petit)} + `, slots: [{ u: petit, att: String(tout - x) }], droite: ` = 1${NB}${grand}`, correction: `${qte(x, petit)} + ${qte(tout - x, petit)} = 1${NB}${grand}`, expl: `1${NB}${grand} = ${qte(tout, petit)} et ${fmtNb(String(tout))} − ${fmtNb(String(x))} = ${fmtNb(String(tout - x))}.`, cle: `c${x}${petit}` };
    }
    let v;
    if (type === "simple") v = entre(1, C.kmax) * p10(eG);
    else if (type === "complexe") v = entre(1, Math.max(1, Math.min(C.kmax, 9))) * p10(eG) + entre(1, p10(ecart) - 1) * p10(eP);
    else { // décimaux (cycle 3)
      const p = entre(Math.max(eP, eG - C.dec), eG), k = entre(2, ecart >= 2 ? 999 : 99);
      v = k * p10(p);
      if (v / p10(eG) > C.kmax) continue;
      if (v % p10(eG) === 0 && hasard(3)) continue; // on veut surtout des nombres à virgule
    }
    if (v / p10(eP) > C.maxPetit) continue;
    if (type === "complexe") {
      const A = Math.floor(v / p10(eG)), B = (v % p10(eG)) / p10(eP);
      if (B === 0) continue;
      const txtC = `${qte(A, grand)} ${qte(B, petit)}`;
      const expl = `${relation(grand, petit, ecart)}, donc ${qte(A, grand)} = ${qte(A * p10(ecart), petit)} ; ${fmtNb(String(A * p10(ecart)))} + ${fmtNb(String(B))} = ${fmtNb(depuisBase(v, eP))}.`;
      if (ea > eb) return { g, gauche: txtC, slots: [{ u: petit, att: depuisBase(v, eP) }], correction: `${txtC} = ${qteB(v, eP, petit)}`, tab: avecTab(niv, { g, v, dep: eG, arr: eP }), expl, cle: `${v}${a}${b}x`, m: { v, eb: eP, b: petit, A, B, ecart } };
      return { g, gauche: qteB(v, eP, petit), slots: [{ u: grand, att: String(A) }, { u: petit, att: String(B) }], correction: `${qteB(v, eP, petit)} = ${txtC}`, tab: avecTab(niv, { g, v, dep: eP, arr: eG }), expl, cle: `${v}${a}${b}x` };
    }
    const expl = v === p10(eG) ? `${relation(grand, petit, ecart)}.` : `${relation(grand, petit, ecart)}, donc ${qteB(v, ea, a)} = ${qteB(v, eb, b)}.` + (ea > eb ? "" : ` (Il faut ${fmtNb(String(p10(ecart)))} ${petit} pour faire 1${NB}${grand}.)`);
    return { g, gauche: qteB(v, ea, a), slots: [{ u: b, att: depuisBase(v, eb) }], correction: `${qteB(v, ea, a)} = ${qteB(v, eb, b)}`, tab: avecTab(niv, { g, v, dep: ea, arr: eb }), expl, cle: `${v}${a}${b}`, m: { v, eb, b } };
  }
  return { g: "longueurs", gauche: `1${NB}m`, slots: [{ u: "cm", att: "100" }], correction: `1${NB}m = 100${NB}cm`, tab: { g: "longueurs", v: 1000, dep: 3, arr: 1 }, expl: "1 m = 100 cm.", cle: "1mcm", m: { v: 1000, eb: 1, b: "cm" } };
}
const s1 = (u, att) => ({ u, att: String(att) });
// « 1 m = 100 cm, donc 3,5 m = 350 cm. »
const relation = (grand, petit, ecart) => `1${NB}${grand} = ${qte(p10(ecart), petit)}`;
// Durées : chaque type renvoie { gauche, slots, correction, expl }
const DUREES = {
  "sem>j": () => { const n = entre(1, 4); return { gauche: `${n} ${pluriel(n, "semaine")}`, slots: [s1("jours", 7 * n)], expl: `1 semaine = 7 jours${n > 1 ? `, donc ${n} semaines = ${n} × 7 = ${7 * n} jours` : ""}.` }; },
  "j-semaine": () => { const n = entre(1, 6); return { gauche: `${n} ${pluriel(n, "jour")} + `, slots: [s1("jours", 7 - n)], droite: ` = 1${NB}semaine`, expl: `Une semaine a 7 jours : ${n} + ${7 - n} = 7.` }; },
  "j>h": () => { const n = entre(1, 3); return { gauche: `${n} ${pluriel(n, "jour")}`, slots: [s1("h", 24 * n)], expl: `1 jour = 24 h${n > 1 ? `, donc ${n} jours = ${n} × 24 = ${24 * n} h` : ""}.` }; },
  "h>min": () => { const n = entre(1, 5); return { gauche: `${n}${NB}h`, slots: [s1("min", 60 * n)], expl: `1 h = 60 min${n > 1 ? `, donc ${n} h = ${n} × 60 = ${60 * n} min` : ""}.` }; },
  "an>mois": () => { const n = entre(1, 3); return { gauche: `${n} ${pluriel(n, "an")}`, slots: [s1("mois", 12 * n)], expl: `1 an = 12 mois${n > 1 ? `, donc ${n} ans = ${n} × 12 = ${12 * n} mois` : ""}.` }; },
  "hmin>min": () => { const a = entre(1, 3), b = 5 * entre(1, 11); return { gauche: `${a}${NB}h ${b}${NB}min`, slots: [s1("min", 60 * a + b)], expl: `${a} h = ${60 * a} min, puis ${60 * a} + ${b} = ${60 * a + b} min.` }; },
  "min>hmin": () => { const a = entre(1, 3), b = 5 * entre(1, 11), t = 60 * a + b; return { gauche: `${t}${NB}min`, slots: [s1("h", a), s1("min", b)], expl: `${t} min = ${60 * a} min + ${b} min, et ${60 * a} min = ${a} h.` }; },
  demi: () => choisir([
    { gauche: "une demi-heure", slots: [s1("min", 30)], expl: "Une heure = 60 min ; la moitié de 60, c'est 30." },
    { gauche: "un quart d'heure", slots: [s1("min", 15)], expl: "Une heure = 60 min ; le quart de 60, c'est 15." },
    { gauche: "trois quarts d'heure", slots: [s1("min", 45)], expl: "Un quart d'heure = 15 min, donc trois quarts d'heure = 3 × 15 = 45 min." },
    { gauche: "une heure et demie", slots: [s1("min", 90)], expl: "1 h = 60 min, plus une demi-heure (30 min) : 60 + 30 = 90 min." },
  ]),
  "min>s": () => { const n = entre(1, 5); return { gauche: `${n}${NB}min`, slots: [s1("s", 60 * n)], expl: `1 min = 60 s${n > 1 ? `, donc ${n} min = ${n} × 60 = ${60 * n} s` : ""}.` }; },
  "mins>s": () => { const a = entre(1, 3), b = 5 * entre(1, 11); return { gauche: `${a}${NB}min ${b}${NB}s`, slots: [s1("s", 60 * a + b)], expl: `${a} min = ${60 * a} s, puis ${60 * a} + ${b} = ${60 * a + b} s.` }; },
  "s>mins": () => { const a = entre(1, 4), b = 5 * entre(1, 11), t = 60 * a + b; return { gauche: `${t}${NB}s`, slots: [s1("min", a), s1("s", b)], expl: `${t} s = ${60 * a} s + ${b} s, et ${60 * a} s = ${a} min.` }; },
  "jh>h": () => { const a = entre(1, 3), b = entre(1, 23); return { gauche: `${a} ${pluriel(a, "jour")} ${b}${NB}h`, slots: [s1("h", 24 * a + b)], expl: `${a} ${pluriel(a, "jour")} = ${24 * a} h, puis ${24 * a} + ${b} = ${24 * a + b} h.` }; },
  "h>jh": () => { const a = entre(1, 3), b = entre(1, 23), t = 24 * a + b; return { gauche: `${t}${NB}h`, slots: [s1("j", a), s1("h", b)], expl: `${t} h = ${24 * a} h + ${b} h, et ${24 * a} h = ${a} ${pluriel(a, "jour")}.` }; },
  "siecle>an": () => { const n = entre(1, 9); return { gauche: `${n} ${pluriel(n, "siècle")}`, slots: [s1("ans", 100 * n)], expl: `1 siècle = 100 ans${n > 1 ? `, donc ${n} siècles = ${100 * n} ans` : ""}.` }; },
  "an>siecle": () => { const n = entre(2, 20); return { gauche: qte(100 * n, "ans"), slots: [s1("siècles", n)], expl: `1 siècle = 100 ans : dans ${fmtNb(String(100 * n))}, il y a ${n} centaines.` }; },
  "h>s": () => choisir([{ gauche: `1${NB}h`, slots: [s1("s", 3600)], expl: "1 h = 60 min et 1 min = 60 s, donc 1 h = 60 × 60 = 3 600 s." }, { gauche: `2${NB}h`, slots: [s1("s", 7200)], expl: "1 h = 3 600 s, donc 2 h = 2 × 3 600 = 7 200 s." }, { gauche: `10${NB}min`, slots: [s1("s", 600)], expl: "1 min = 60 s, donc 10 min = 10 × 60 = 600 s." }]),
  "hdec>min": () => { const a = entre(0, 3), q = choisir([["5", 30], ["25", 15], ["75", 45]]); return { gauche: `${a},${q[0]}${NB}h`, slots: [s1("min", 60 * a + q[1])], expl: `Attention : 0,${q[0]} h n'est pas ${q[0]} min ! 0,${q[0]} h = ${q[1]} min${a ? `, donc ${a},${q[0]} h = ${60 * a} + ${q[1]} = ${60 * a + q[1]} min` : ""}.` }; },
  millenaire: () => choisir([{ gauche: "1 millénaire", slots: [s1("ans", 1000)], expl: "1 millénaire = 1 000 ans = 10 siècles." }, { gauche: "1 millénaire", slots: [s1("siècles", 10)], expl: "1 millénaire = 1 000 ans, et 1 siècle = 100 ans : 10 siècles." }, { gauche: "2 millénaires", slots: [s1("ans", 2000)], expl: "1 millénaire = 1 000 ans, donc 2 millénaires = 2 000 ans." }]),
};
function convDuree(niv) {
  const t = choisir(CONV_NIV[niv].durees), q = DUREES[t]();
  const droite = q.slots.map((s) => qte(s.att, s.u)).join(" ");
  return { g: "durees", ...q, correction: q.droite ? `${q.gauche}${droite}${q.droite}` : `${q.gauche} = ${droite}`, cle: q.gauche + droite, t };
}
export function genConversion(niv, g) {
  const liste = grandeursConv(niv);
  if (g === "melange" || !liste.includes(g)) g = choisir(liste);
  return g === "durees" ? convDuree(niv) : convMetrique(niv, g);
}

// =====================================================================
// 3 bis. VRAI OU FAUX : « 2 kg = 200 g » — à partir des mêmes conversions que le jeu.
// Les égalités fausses sont des erreurs plausibles : un zéro de trop ou de moins (virgule décalée),
// la mauvaise unité, « 2 m 5 cm = 25 cm », 1 h = 100 min…
// =====================================================================
// Valeur entière (dans la plus petite unité) de l'écriture « 3,25 » dans l'unité d'exposant e ; null si pas entière.
export const enBase = (s, e) => { const [i, f = ""] = normaliser(s).split(","); return f.length > e ? null : Number(i + f) * p10(e - f.length); };
const unitesConv = (niv, g) => [...new Set(pairesMetriques(CONV_NIV[niv][g], g).flat())];
// Durées : la valeur fausse « typique » pour chaque type de conversion (null = on fait ×10).
const FAUX_DUREES = {
  "h>min": (n) => 100 * n[0], "min>s": (n) => 100 * n[0],
  "hmin>min": (n) => 100 * n[0] + n[1], "mins>s": (n) => 100 * n[0] + n[1],
  "jh>h": (n) => Number(`${n[0]}${n[1]}`),
  "sem>j": (n) => choisir([5, 10]) * n[0], "j>h": (n) => choisir([10, 12]) * n[0], "an>mois": (n) => 10 * n[0],
  "siecle>an": (n) => choisir([10, 1000]) * n[0], "an>siecle": (n, att) => 10 * att,
  "h>s": (n, att) => att / 10, millenaire: (n, att) => (att === 10 ? 100 : att / 10),
  "hdec>min": (n, att, g) => { const [a, d = ""] = g.split(","); return 60 * Number(a) + (d.startsWith("5") && d.length === 1 ? 50 : Number(d.replace(/\D.*$/, ""))); },
  demi: (n, att) => ({ 30: 50, 15: 25, 45: 75, 90: 150 })[att],
};
// Une égalité à juger. vrai : on garde la bonne réponse ; sinon on la remplace par une erreur plausible.
export function vraiFaux(q, vrai) {
  const s = q.slots[0], att = s.att;
  const base = { g: q.g, vrai, correction: q.correction, expl: q.expl || "", cle: q.cle + (vrai ? "v" : "f") };
  if (vrai) return { ...base, texte: q.correction };
  let val = null, u = s.u;
  for (let essai = 0; essai < 30 && val == null; essai++) {
    let v2 = null, u2 = s.u;
    if (q.g === "durees") {
      const f = FAUX_DUREES[q.t], n = (q.gauche.match(/\d+/g) || []).map(Number);
      v2 = f ? f(n, Number(att), (q.gauche.match(/\d+(?:,\d+)?/) || ["0"])[0]) : null;
      if (v2 == null || !Number.isInteger(v2) || essai > 10) v2 = Number(att) * 10;
      v2 = String(v2);
      if (normaliser(v2) === normaliser(att)) continue;
    } else {
      const m = q.m, sortes = ["zero", "zero"];
      if (m.A != null && m.B < p10(m.ecart - 1)) sortes.push("colle", "colle");
      if (q.niv) sortes.push("unite");
      const sorte = choisir(sortes);
      if (sorte === "colle") v2 = `${m.A}${m.B}`; // 2 m 5 cm = 25 cm (on oublie le zéro)
      else if (sorte === "unite") { // le bon nombre, mais la mauvaise unité
        const us = unitesConv(q.niv, q.g).filter((x) => x !== s.u && Math.abs(UNITES[q.g][x] - m.eb) <= 3);
        if (!us.length) continue;
        u2 = choisir(us); v2 = att;
      } else v2 = depuisBase(m.v, m.eb + choisir([1, -1])); // un zéro de trop ou de moins (ou la virgule décalée)
      if (enBase(v2, UNITES[q.g][u2]) === m.v) continue; // par sécurité : l'égalité doit vraiment être fausse
      if (rang(q.niv) < 3 && String(v2).includes(",")) continue; // pas de nombre à virgule avant le CM
    }
    val = v2; u = u2;
  }
  if (val == null) return { ...base, vrai: true, texte: q.correction };
  return { ...base, texte: `${q.gauche} = ${qte(val, u)}`, faux: qte(val, u) };
}
// n égalités (à peu près moitié vraies), sans doublon si possible : seulement des conversions à une case.
export function tirerVraiFaux(niv, g, n) {
  const qs = [], vus = new Set();
  for (let essai = 0; qs.length < n && essai < 400; essai++) {
    const q = genConversion(niv, g);
    if (q.slots.length !== 1 || q.droite) continue;
    if (vus.has(q.cle) && essai < 250) continue;
    vus.add(q.cle); q.niv = niv; qs.push(q);
  }
  const nbVrai = Math.round(n / 2) + choisir([-1, 0, 0, 1]);
  const verites = melange(qs.map((_, i) => i < nbVrai));
  return qs.map((q, i) => vraiFaux(q, verites[i]));
}

// =====================================================================
// 4. OUTIL : TABLEAU DE CONVERSION
// =====================================================================
function tableauConversion(el) {
  let niv = niveauJeux(), g = "longueurs", mode = "libre";
  let cases = {}, virgule = null, dep = null, arr = null, sel = null, zeros = false, ex = null, rep = "", focus = "table", verdict = null;
  const cols = () => colonnes(niv, g);
  const valider = () => { if (!grandeursTableau(niv).includes(g)) g = grandeursTableau(niv)[0]; };
  const effacer = () => { cases = {}; virgule = null; rep = ""; verdict = null; sel = cols().length ? cols()[0].e : null; focus = ex ? "table" : "table"; };
  const nouvelEx = () => {
    let q, n = 0;
    do q = convMetrique(niv, g); while ((q.slots.length !== 1 || !q.tab || q.gauche.includes(" + ") || q.gauche.split(NB).length > 2 || q.tab.v >= p10(cols()[0].e + 1)) && ++n < 80);
    ex = q; effacer(); zeros = false; dep = q.tab.dep; arr = q.tab.arr;
    const pl = placement(q.tab.v, dep, arr), es = Object.keys(pl).map(Number);
    sel = Math.max(...es.filter((e) => !pl[e].ajoute));
  };
  const zerosAffiches = () => {
    if (!zeros || arr == null) return {};
    const es = Object.keys(cases).map(Number); if (!es.length) return {};
    const out = {}; for (let e = Math.max(...es, arr); e >= Math.min(...es, arr); e--) if (cases[e] == null) out[e] = true;
    return out;
  };
  const uDe = (e) => cols().find((c) => c.e === e)?.u ?? "";
  const lecture = () => {
    const es = Object.keys(cases).map(Number);
    if (!es.length) return "";
    const parts = [];
    if (dep != null) { const lo = Math.min(...es), hi = Math.max(...es); let i = "", f = ""; for (let e = Math.max(hi, dep); e >= Math.min(lo, dep); e--) { const d = cases[e] ?? "0"; if (e >= dep) i += d; else f += d; } if (lo < dep && virgule !== dep && mode === "exemple") { /* on laisse la virgule à placer */ } parts.push(`<span class="mes-lu dep">${qte(normaliser(f ? `${i},${f}` : i), uDe(dep))}</span>`); }
    if (arr != null && zeros) parts.push(`<span class="mes-lu arr">${qte(lireTableau(cases, arr), uDe(arr))}</span>`);
    return parts.join(" = ");
  };
  const verifier = () => {
    if (!ex) return;
    const v = Object.entries(cases).reduce((s, [e, d]) => s + Number(d) * p10(Number(e)), 0);
    const msgs = []; let ok = true;
    const aDec = ex.tab.v % p10(ex.tab.dep) !== 0;
    if (!Object.keys(cases).length) { ok = false; msgs.push("Écris d'abord le nombre de départ dans le tableau."); }
    else if (v !== ex.tab.v) { ok = false; msgs.push(`Le nombre n'est pas bien placé : le chiffre des unités va dans la colonne des ${uDe(ex.tab.dep)}.`); }
    else if (aDec && virgule !== ex.tab.dep) { ok = false; msgs.push(`Le nombre est bien placé, mais la virgule doit être juste après la colonne des ${uDe(ex.tab.dep)}.`); }
    else msgs.push("Le nombre de départ est bien placé. ✔");
    if (!rep) { ok = false; msgs.push("Écris ensuite la réponse à la place des points."); }
    else if (normaliser(rep) !== normaliser(ex.slots[0].att)) { ok = false; msgs.push("La réponse n'est pas encore juste : complète avec des zéros jusqu'à la colonne d'arrivée."); }
    else msgs.push("La réponse est juste ! ✔");
    verdict = { ok, msgs };
  };
  const solution = () => {
    const pl = placement(ex.tab.v, ex.tab.dep, ex.tab.arr);
    cases = {}; for (const [e, c] of Object.entries(pl)) if (!c.ajoute) cases[e] = String(c.d);
    virgule = ex.tab.v % p10(ex.tab.dep) ? ex.tab.dep : null; zeros = true; rep = ex.slots[0].att; verdict = null;
  };
  const render = () => {
    valider();
    const cs = cols();
    if (sel != null && !cs.some((c) => c.e === sel)) sel = cs[0]?.e ?? null;
    const lu = lecture();
    el.innerHTML = `
      <div class="tool-top wrap">${segNiveau(niv)}${segGrandeur(grandeursTableau(niv), g)}
        <div class="seg"><button type="button" data-mode="libre" class="${mode === "libre" ? "on" : ""}">✍️ Libre</button><button type="button" data-mode="exemple" class="${mode === "exemple" ? "on" : ""}">🎲 Exemples</button></div></div>
      <div class="tool-top wrap">
        ${mode === "exemple" ? `<button type="button" class="pill" id="mesEx">🎲 Autre exemple</button><button type="button" class="pill" id="mesVerif">✔ Vérifier</button><button type="button" class="pill" id="mesSol">💡 Solution</button>` : ""}
        <button type="button" class="pill ${zeros ? "on mes-on" : ""}" id="mesZeros">${zeros ? "🙈 Cacher les zéros" : "👀 Zéros à ajouter"}</button>
        <button type="button" class="pill" id="mesEff">🧽 Effacer</button>
      </div>
      <div class="mes-board rc-board">
        ${mode === "exemple" && ex ? `<div class="mes-enonce">${ex.gauche} = <button type="button" class="mes-slot ${focus === "rep" ? "on" : ""}" data-rep="1" aria-label="Réponse">${rep ? fmtNb(rep) : "…"}</button>${NB}${ex.slots[0].u}</div>` : ""}
        ${rang(niv) >= 3 ? `<p class="mes-note">${typo("ℹ️ Au CM, on convertit avec les relations entre unités (1 m = 100 cm) ; le tableau aide à visualiser les unités.")}</p>` : ""}
        <p class="mes-aide">Touche une case puis un chiffre. Touche le nom de l'unité de <b class="dep">départ</b>, puis celui de l'unité d'<b class="arr">arrivée</b> (touche encore pour enlever). La touche «${NB},${NB}» place la virgule après la case choisie.</p>
        <div class="mes-scroll">${tableauHTML(cs, { cases, virgule, virguleArr: zeros && arr != null && arr !== virgule && Object.entries(cases).some(([e, d]) => +e < arr && d !== "0") ? arr : null, dep, arr, sel: focus === "table" ? sel : null, actif: true, zeros: zerosAffiches() })}</div>
        <div class="mes-lecture">${lu || "&nbsp;"}</div>
        ${verdict ? `<div class="banner ${verdict.ok ? "ok" : "ko"} mes-verdict">${verdict.ok ? `Bravo ! ${ex.correction} 🎉` : verdict.msgs.map((m) => `<div>${typo(m)}</div>`).join("")}</div>` : ""}
        ${padHTML(true)}
      </div>`;
  };
  const touche = (k) => {
    verdict = null;
    if (focus === "rep" && ex) {
      if (k === "del") rep = rep.slice(0, -1);
      else if (k === ",") { if (!rep.includes(",")) rep = (rep || "0") + ","; }
      else if (rep.length < 10) rep += k;
      return render();
    }
    const cs = cols(), i = cs.findIndex((c) => c.e === sel);
    if (i < 0) { sel = cs[0]?.e; return render(); }
    if (k === "del") {
      if (cases[sel] != null) delete cases[sel];
      else if (i > 0) { sel = cs[i - 1].e; delete cases[sel]; }
    } else if (k === ",") virgule = virgule === sel ? null : sel;
    else { cases[sel] = k; if (i < cs.length - 1) sel = cs[i + 1].e; }
    render();
  };
  el.onclick = (e) => {
    if (surNiveau(e, (n) => { niv = n; valider(); dep = arr = null; ex = null; effacer(); if (mode === "exemple") nouvelEx(); render(); })) return;
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.g) { g = t.dataset.g; dep = arr = null; ex = null; effacer(); if (mode === "exemple") nouvelEx(); return render(); }
    if (t.dataset.mode) { mode = t.dataset.mode; dep = arr = null; ex = null; effacer(); zeros = false; if (mode === "exemple") nouvelEx(); return render(); }
    if (t.dataset.col !== undefined) { const c = +t.dataset.col; if (dep === c) dep = null; else if (arr === c) arr = null; else if (dep == null) dep = c; else arr = c; verdict = null; return render(); }
    if (t.dataset.cell !== undefined) { sel = +t.dataset.cell; focus = "table"; return render(); }
    if (t.dataset.rep) { focus = "rep"; return render(); }
    if (t.dataset.k !== undefined) return touche(t.dataset.k);
    if (t.id === "mesEx") { nouvelEx(); return render(); }
    if (t.id === "mesVerif") { verifier(); return render(); }
    if (t.id === "mesSol" && ex) { solution(); return render(); }
    if (t.id === "mesZeros") { zeros = !zeros; return render(); }
    if (t.id === "mesEff") { effacer(); if (mode === "libre") { dep = arr = null; zeros = false; } return render(); }
  };
  const finClavier = clavier((e) => {
    if (/^\d$/.test(e.key)) { touche(e.key); return true; }
    if (e.key === "," || e.key === ".") { touche(","); return true; }
    if (e.key === "Backspace") { touche("del"); return true; }
    if (focus === "table" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      const cs = cols(), i = cs.findIndex((c) => c.e === sel), j = Math.max(0, Math.min(cs.length - 1, i + (e.key === "ArrowLeft" ? -1 : 1)));
      sel = cs[j]?.e; render(); return true;
    }
    if (e.key === "Enter" && ex) { verifier(); render(); return true; }
  });
  valider(); effacer(); render();
  return finClavier;
}

// =====================================================================
// 4 bis. PETIT TABLEAU DE CONVERSION : fenêtre flottante de la boîte à outils 🧰 (js/barre.js).
// Même tableau que l'outil, en plus petit (tailles en em : la fenêtre s'agrandit par son coin).
// =====================================================================
const MINI = { longueurs: "km hm dam m dm cm mm", masses: "t q · kg hg dag g dg cg mg", contenances: "hL daL L dL cL mL" };
export function tableauMini(el) {
  let g = "longueurs", cases = {}, virgule = null, sel = 3, dep = null, arr = null;
  const cols = () => MINI[g].split(" ").map((u) => ({ u, e: UNITES[g][u], faible: u === "·" }));
  const uDe = (e) => cols().find((c) => c.e === e)?.u ?? "";
  const effacer = () => { cases = {}; virgule = null; dep = arr = null; sel = cols()[0].e; };
  // Zéros à ajouter jusqu'à la colonne d'arrivée (affichés en rose, comme dans l'outil)
  const zeros = () => {
    const es = Object.keys(cases).map(Number), out = {};
    if (arr == null || !es.length) return out;
    for (let e = Math.max(...es, arr); e >= Math.min(...es, arr); e--) if (cases[e] == null) out[e] = true;
    return out;
  };
  const lecture = () => {
    if (!Object.keys(cases).length) return "";
    const eLu = dep ?? virgule ?? UNITES[g][UNITE_REF[g]];
    const l = [`<b class="dep">${qte(lireTableau(cases, eLu), uDe(eLu) === "·" ? "" : uDe(eLu))}</b>`];
    if (arr != null && arr !== eLu) l.push(`<b class="arr">${qte(lireTableau(cases, arr), uDe(arr))}</b>`);
    return l.join(" = ");
  };
  const render = () => {
    el.innerHTML = `<div class="mes-mini">
      <div class="qt-ligne mes-mini-onglets">${Object.keys(MINI).map((x) => `<button type="button" class="qt-pt ${x === g ? "on" : ""}" data-mg="${x}">${GRANDEURS[x].ico} ${GRANDEURS[x].nom}</button>`).join("")}</div>
      ${tableauHTML(cols(), { cases, virgule, dep, arr, sel, actif: true, zeros: zeros(), virguleArr: arr != null && arr !== virgule && Object.entries(cases).some(([e, d]) => +e < arr && d !== "0") ? arr : null })}
      <div class="mes-mini-lu">${lecture() || "&nbsp;"}</div>
      <div class="mes-mini-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => `<button type="button" data-k="${n}">${n}</button>`).join("")}<button type="button" data-k="," class="virg" aria-label="Virgule">,</button><button type="button" data-k="del" class="del" aria-label="Effacer le chiffre">⌫</button></div>
      <div class="qt-ligne"><button type="button" class="qt-pt" data-k="eff">🧽 Effacer</button></div>
      <p class="qt-aide">Touche une case puis un chiffre. Touche une unité : départ, puis arrivée.</p></div>`;
  };
  const touche = (k) => {
    const cs = cols(), i = cs.findIndex((c) => c.e === sel);
    if (k === "eff") effacer();
    else if (i < 0) sel = cs[0].e;
    else if (k === "del") { if (cases[sel] != null) delete cases[sel]; else if (i > 0) { sel = cs[i - 1].e; delete cases[sel]; } }
    else if (k === ",") virgule = virgule === sel ? null : sel;
    else { cases[sel] = k; if (i < cs.length - 1) sel = cs[i + 1].e; }
    render();
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.mg) { g = t.dataset.mg; effacer(); return render(); }
    if (t.dataset.cell !== undefined) { sel = +t.dataset.cell; return render(); }
    if (t.dataset.col !== undefined) { const c = +t.dataset.col; if (dep === c) dep = null; else if (arr === c) arr = null; else if (dep == null) dep = c; else arr = c; return render(); }
    if (t.dataset.k !== undefined) touche(t.dataset.k);
  };
  effacer(); render();
  return () => { el.onclick = null; };
}

// =====================================================================
// 5. OUTIL : JEU DES CONVERSIONS
// =====================================================================
const NB_QUESTIONS = 10;
const TAILLES_FICHE = [4, 6, 8, 10, 12];
const CLE_CONV = "bagaschool-conversions";
// Tirage de n conversions sans doublon (si le niveau en offre assez)
function tirerConversions(niv, g, n) {
  const vus = new Map(), out = [];
  for (let essai = 0; out.length < n && essai < 500; essai++) {
    const q = genConversion(niv, g), deja = vus.get(q.cle) || 0;
    // pas de doublon si possible ; sinon (petit niveau, peu de conversions possibles), le moins de répétitions possible
    if (deja && (essai < 300 || (deja > 1 && essai < 450))) continue;
    vus.set(q.cle, deja + 1); out.push(q);
  }
  return out;
}
// Fiche imprimable (A4) : les conversions avec des lignes à compléter, puis le corrigé sur une deuxième page
function ficheImprimable(fiche, titre, avecExpl) {
  const ligne = (x) => `${x.gauche}${x.droite ? "" : " ="} ${x.slots.map((s) => `<span class="mes-pr-trou"></span>${NB}${escM(s.u)}`).join(" ")}${x.droite || ""}`;
  return `<section class="mes-pr-page"><h1>🔁 Conversions</h1><p class="mes-pr-sous">${escM(titre)}</p>
      <p class="mes-pr-nom"><span>Prénom${NB}:</span><i></i><span>Date${NB}:</span><i></i></p>
      <ol class="mes-pr-liste">${fiche.map((x) => `<li>${ligne(x)}</li>`).join("")}</ol></section>
    <section class="mes-pr-page mes-pr-corr"><h1>Corrigé</h1><p class="mes-pr-sous">${escM(titre)}</p>
      <ol class="mes-pr-liste">${fiche.map((x) => `<li><b>${x.correction}</b>${avecExpl && x.expl ? `<small>${typo(x.expl)}</small>` : ""}</li>`).join("")}</ol></section>`;
}
function conversions(el) {
  let niv = niveauJeux(), g = "melange", equipes = 1;
  let serie = [], pos = 0, saisies = [], slotActif = 0, etat = null, voirAide = false, resultats = [], scores = [0, 0], attente = null;
  // Mode « fiche » : plusieurs conversions à la fois, puis correction collective
  const memo = (() => { try { return JSON.parse(localStorage.getItem(CLE_CONV)) || {}; } catch { return {}; } })();
  let mode = ["fiche", "vf"].includes(memo.mode) ? memo.mode : "une", taille = TAILLES_FICHE.includes(memo.taille) ? memo.taille : 8;
  let fiche = [], repF = [], revF = [], actif = null, corrPos = -1, masque = false, aDefiler = false;
  const retenir = () => { try { localStorage.setItem(CLE_CONV, JSON.stringify({ mode, taille, vf: vfSous })); } catch {} };
  const valider = () => { const l = grandeursConv(niv); if (g !== "melange" && !l.includes(g)) g = l.length > 1 ? "melange" : l[0]; };
  const nouvelleSerie = () => {
    valider(); clearTimeout(attente);
    serie = tirerConversions(niv, g, NB_QUESTIONS);
    pos = 0; resultats = []; scores = [0, 0]; preparer();
  };
  const nouvelleFiche = () => {
    valider();
    fiche = tirerConversions(niv, g, taille);
    repF = fiche.map((x) => x.slots.map(() => "")); revF = fiche.map(() => false);
    actif = null; corrPos = -1; masque = false;
  };
  const nouveau = () => { nouvelleSerie(); nouvelleFiche(); nouvelleVf(); nouvelleVfFiche(); };
  const preparer = () => { saisies = serie[pos].slots.map(() => ""); slotActif = 0; etat = null; voirAide = false; };
  const q = () => serie[pos];
  const virguleOk = () => rang(niv) >= 3;
  const slotsHTML = (x) => x.slots.map((s, i) => {
    const juste = etat && normaliser(saisies[i]) === normaliser(s.att);
    const cl = etat ? (juste ? "good" : "bad") : i === slotActif ? "on" : "";
    return `<button type="button" class="mes-slot ${cl}" data-slot="${i}" aria-label="Réponse en ${escM(s.u)}">${saisies[i] ? fmtNb(saisies[i]) : "…"}</button>${NB}<span class="mes-u">${escM(s.u)}</span>`;
  }).join(" ");
  const aideHTML = (x) => {
    if (x.tab) {
      const cs = colonnes(niv, x.tab.g);
      const pl = placement(x.tab.v, x.tab.dep, x.tab.arr);
      const maxE = Math.max(...Object.keys(pl).map(Number));
      while (cs[0].e < maxE) cs.unshift({ u: "·", e: cs[0].e + 1, faible: true }); // dizaines de km, etc.
      const aDecArr = Object.keys(pl).some((e) => +e < x.tab.arr && pl[e].d), aDecDep = Object.keys(pl).some((e) => +e < x.tab.dep && pl[e].d);
      const cm = rang(niv) >= 3;
      return `<div class="mes-aide-tab">${cm && x.expl ? `<p class="mes-expl">${typo(x.expl)}</p><p class="mes-aide">Le tableau aide à visualiser :</p>` : ""}<div class="mes-scroll">${tableauHTML(cs, { cases: pl, dep: x.tab.dep, arr: x.tab.arr, virgule: aDecArr ? x.tab.arr : aDecDep ? x.tab.dep : null })}</div>
        <p class="mes-aide">Les chiffres <b class="arr">en rose</b> sont les zéros ajoutés pour arriver jusqu'à la colonne d'arrivée.</p>${!cm && x.expl ? `<p class="mes-expl">${typo(x.expl)}</p>` : ""}</div>`;
    }
    return `<p class="mes-expl">${typo(x.expl || "")}</p>`;
  };
  const segMode = () => `<div class="seg mes-seg" role="group" aria-label="Façon de jouer"><button type="button" data-cmode="une" class="${mode === "une" ? "on" : ""}">🎯 Une à la fois</button><button type="button" data-cmode="fiche" class="${mode === "fiche" ? "on" : ""}">📋 Fiche de conversions</button><button type="button" data-cmode="vf" class="${mode === "vf" ? "on" : ""}">✔✘ Vrai ou faux</button></div>`;
  const titreFiche = () => `${niv} · ${g === "melange" ? "Mélange" : GRANDEURS[g].nom}`;

  // ---------- mode fiche ----------
  const juste = (i, j) => normaliser(repF[i][j]) === normaliser(fiche[i].slots[j].att);
  const remplie = (i) => repF[i].some(Boolean);
  const boiteHTML = (i, j, s) => {
    const v = repF[i][j], vis = revF[i] && !masque, on = actif && actif.i === i && actif.j === j;
    let cl = "", txt = v ? fmtNb(v) : "";
    if (vis) { if (v) cl = juste(i, j) ? "good" : "bad"; else { cl = "sol"; txt = fmtNb(s.att); } }
    return `<span class="mes-fi-rep"><button type="button" class="mes-slot mes-fi-box ${cl} ${on ? "on" : ""}" data-fi="${i}" data-fj="${j}" aria-label="Réponse ${i + 1}${x2(i)} en ${escM(s.u)}">${txt || NB}</button>${NB}<span class="mes-u">${escM(s.u)}</span></span>`;
  };
  const x2 = (i) => (fiche[i].slots.length > 1 ? " (plusieurs cases)" : "");
  const itemHTML = (x, i) => {
    const vis = revF[i] && !masque, faux = vis && remplie(i) && x.slots.some((_, j) => repF[i][j] && !juste(i, j));
    const cur = i === corrPos && !masque;
    // Explication (« 1 m = 100 cm, donc 3,5 m = 350 cm ») sur la ligne en cours de correction ; touche un numéro pour la revoir
    const expl = vis && cur && x.expl ? `<span class="mes-fi-expl">${typo(x.expl)}</span>` : "";
    const corr = faux && !expl ? `<span class="mes-fi-sol">➜ ${x.correction}</span>` : "";
    const num = vis ? `<button type="button" class="mes-fi-num" data-fiexpl="${i}" aria-label="Expliquer la conversion ${i + 1}">${i + 1}</button>` : `<span class="mes-fi-num">${i + 1}</span>`;
    return `<li class="mes-fi-item ${vis ? "rev" : ""} ${cur ? "cur" : ""} ${vis && remplie(i) ? (faux ? "ko" : "ok") : ""}" data-item="${i}">${num}
      <div class="mes-fi-corps"><div class="mes-fi-q">${x.gauche}${x.droite ? "" : " ="} ${x.slots.map((s, j) => boiteHTML(i, j, s)).join(" ")}${x.droite || ""}</div>${corr || expl ? `<div class="mes-fi-plus">${corr}${expl}</div>` : ""}</div></li>`;
  };
  const renderFiche = (tete) => {
    const n = fiche.length, nbRev = revF.filter(Boolean).length, tout = nbRev === n;
    const corrigees = fiche.map((_, i) => i).filter((i) => revF[i] && remplie(i));
    const bonnes = corrigees.filter((i) => fiche[i].slots.every((_, j) => juste(i, j))).length;
    const libCorr = corrPos < 0 && !nbRev ? "▶ Corriger une par une" : tout ? "✔ Tout est corrigé" : `Correction suivante ➜ (${nbRev + 1}/${n})`;
    el.innerHTML = `${tete}
      <div class="tool-top wrap mes-fi-outils">
        <div class="seg mes-seg" role="group" aria-label="Nombre de conversions">${TAILLES_FICHE.map((t) => `<button type="button" data-taille="${t}" class="${t === taille ? "on" : ""}" aria-label="${t} conversions">${t}</button>`).join("")}</div>
        <button type="button" class="pill" id="mesFiNew">↻ Nouvelle fiche</button>
        <button type="button" class="pill mes-on" id="mesFiUne" ${tout && !masque ? "disabled" : ""}>${masque && nbRev ? "▶ Corriger une par une" : libCorr}</button>
        <button type="button" class="pill" id="mesFiTout" ${tout && !masque ? "disabled" : ""}>✅ Tout corriger</button>
        <button type="button" class="pill ${masque ? "on mes-on" : ""}" id="mesFiMasque" ${nbRev ? "" : "disabled"}>${masque ? "👀 Montrer les réponses" : "🙈 Masquer les réponses"}</button>
        <button type="button" class="pill" id="mesFiEff" ${repF.some((r) => r.some(Boolean)) || nbRev ? "" : "disabled"}>🧽 Tout effacer</button>
        <button type="button" class="pill" id="mesFiPrint">🖨️ Imprimer la fiche</button>
      </div>
      <div class="mes-fiche rc-board">
        <div class="mes-fi-tete"><b>📋 ${escM(titreFiche())}</b><span>${n} conversions</span>${corrigees.length && !masque ? `<span class="mes-fi-score">✔ ${bonnes} / ${corrigees.length} ${pluriel(corrigees.length, "réponse")} ${pluriel(corrigees.length, "corrigée")}</span>` : ""}</div>
        <ol class="mes-fi-grille" style="--rows:${Math.ceil(n / 2)};--n:${n}">${fiche.map(itemHTML).join("")}</ol>
        ${actif ? `<div class="mes-fi-clavier">${padHTML(virguleOk())}<div class="mes-fi-nav"><button type="button" data-finav="prev" aria-label="Case précédente">◀</button><button type="button" data-finav="next">Case suivante ➜</button><button type="button" data-finav="close" aria-label="Fermer le clavier">✕</button></div></div>`
        : `<p class="mes-aide mes-fi-astuce">${nbRev && !masque ? "Touche un numéro pour afficher l'explication de la conversion." : "Les élèves répondent sur l'ardoise ou le cahier. Touche une case pour écrire une réponse au tableau."}</p>`}
      </div>`;
    if (aDefiler) {
      aDefiler = false;
      el.querySelector(actif ? ".mes-fi-box.on" : ".mes-fi-item.cur")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };
  // Cases dans l'ordre de lecture, pour « Case suivante »
  const cases = () => fiche.flatMap((x, i) => x.slots.map((_, j) => ({ i, j })));
  const deplacer = (d) => {
    const cs = cases(), k = cs.findIndex((c) => actif && c.i === actif.i && c.j === actif.j);
    const k2 = k + d;
    actif = k2 >= 0 && k2 < cs.length ? cs[k2] : null;
  };
  const toucheFiche = (k) => {
    if (!actif) return;
    let s = repF[actif.i][actif.j];
    if (k === "del") s = s.slice(0, -1);
    else if (k === ",") { if (!virguleOk() || s.includes(",")) return; s = (s || "0") + ","; }
    else if (s.length < 9) s = s === "0" ? k : s + k;
    repF[actif.i][actif.j] = s; render();
  };
  const corrigerSuivante = () => {
    if (masque) { masque = false; if (revF.some(Boolean)) { revF = revF.map(() => false); corrPos = -1; } }
    const k = revF.findIndex((r) => !r);
    if (k < 0) return;
    revF[k] = true; corrPos = k; actif = null; aDefiler = true;
  };
  const imprimer = () => {
    document.querySelector(".mes-print")?.remove();
    const d = document.createElement("div");
    d.className = "mes-print";
    d.innerHTML = ficheImprimable(fiche, titreFiche(), rang(niv) >= 3);
    document.body.append(d); document.body.classList.add("mes-imp");
    const fin = () => { document.body.classList.remove("mes-imp"); d.remove(); window.removeEventListener("afterprint", fin); };
    window.addEventListener("afterprint", fin);
    window.print();
    setTimeout(fin, 1500);
  };

  // ---------- mode « Vrai ou faux » : une égalité à la fois (série de 10) ou une fiche ----------
  let vfSous = memo.vf === "fiche" ? "fiche" : "une", vfSerie = [], vfPos = 0, vfChoix = null, vfRes = [], vfScores = [0, 0];
  let vfFiche = [], vfRep = [], vfRev = [], vfCorr = -1;
  const nouvelleVf = () => { valider(); vfSerie = tirerVraiFaux(niv, g, NB_QUESTIONS); vfPos = 0; vfChoix = null; vfRes = []; vfScores = [0, 0]; };
  const nouvelleVfFiche = () => { valider(); vfFiche = tirerVraiFaux(niv, g, taille); vfRep = vfFiche.map(() => null); vfRev = vfFiche.map(() => false); vfCorr = -1; };
  const verdictVf = (x) => (x.vrai ? `C'est vrai : ${x.correction}.` : `C'est faux : ${x.correction}${x.faux ? `, et non ${x.faux}` : ""}.`);
  const explVf = (x) => (x.expl ? `<p class="mes-expl">${typo(x.expl)}</p>` : "");
  const renderVfUne = (tete) => {
    if (vfPos >= vfSerie.length) {
      const err = vfRes.filter((r) => !r.ok), total = vfRes.length - err.length;
      el.innerHTML = `${tete}<div class="tool-center mes-fin rc-board">
        <div class="mes-score-big">${equipes === 2 ? `Équipe 1${NB}: ${vfScores[0]} · Équipe 2${NB}: ${vfScores[1]}` : `⭐ ${total} / ${vfSerie.length}`}</div>
        <div class="banner ok" ${equipes === 2 ? (vfScores[0] !== vfScores[1] ? "data-fete" : "") : total === vfSerie.length ? "data-fete" : ""}>${equipes === 2 ? (vfScores[0] === vfScores[1] ? "Égalité ! 🤝" : `L'équipe ${vfScores[0] > vfScores[1] ? 1 : 2} gagne ! 🎉`) : total === vfSerie.length ? "Sans faute, bravo ! 🎉" : total >= 7 ? "Très bien ! 👏" : "Continue à t'entraîner, tu progresses ! 💪"}</div>
        ${err.length ? `<p class="mes-aide">À revoir${NB}:</p><ul class="mes-revoir">${err.map((r) => `<li>${r.x.vrai ? "✔ Vrai" : "✘ Faux"}${NB}: ${r.x.texte}${r.x.vrai ? "" : ` ➜ ${r.x.correction}`}</li>`).join("")}</ul>` : ""}
        <button type="button" class="big-btn" id="mesVfNew2">↻ Rejouer</button></div>`;
      return;
    }
    const x = vfSerie[vfPos], fait = vfChoix != null, ok = fait && vfChoix === x.vrai;
    const etatB = (v) => (!fait ? "" : v === x.vrai ? "good" : v === vfChoix ? "bad" : "pale");
    el.innerHTML = `${tete}
      <div class="mes-jeu mes-vf rc-board">
        <div class="mes-prog">${vfSerie.map((_, i) => `<i class="${i < vfRes.length ? (vfRes[i].ok ? "ok" : "ko") : i === vfPos ? "cur" : ""}"></i>`).join("")}
          <span class="mes-score">${equipes === 2 ? `<b class="${vfPos % 2 === 0 ? "on" : ""}">Équipe 1${NB}: ${vfScores[0]}</b> <b class="${vfPos % 2 === 1 ? "on" : ""}">Équipe 2${NB}: ${vfScores[1]}</b>` : `⭐ ${vfScores[0]}`}</span></div>
        ${equipes === 2 && !fait ? `<div class="mes-tour t${vfPos % 2}">À l'équipe ${vfPos % 2 + 1} !</div>` : ""}
        <p class="mes-aide mes-vf-consigne">Cette égalité est-elle vraie ou fausse${NB}?</p>
        <div class="mes-vf-enonce ${fait ? (x.vrai ? "vrai" : "faux") : ""}">${x.texte}</div>
        <div class="mes-vf-btns ${fait ? "fait" : ""}"><button type="button" class="mes-vf-b vrai ${etatB(true)}" data-vf="1" ${fait ? "disabled" : ""}>✔ VRAI</button><button type="button" class="mes-vf-b faux ${etatB(false)}" data-vf="0" ${fait ? "disabled" : ""}>✘ FAUX</button></div>
        ${fait ? `<div class="banner ${ok ? "ok" : "ko"} mes-verdict">${ok ? choisir(["Bravo ! ", "Exact ! ", "Bien vu ! "]) : "Non… "}${verdictVf(x)}</div>${explVf(x)}
          <button type="button" class="big-btn mes-keep" id="mesVfNext">${vfPos + 1 < vfSerie.length ? "Suivant ➜" : "Résultats ➜"}</button>` : ""}
      </div>`;
  };
  const repondreVf = (v) => {
    if (vfChoix != null || vfPos >= vfSerie.length) return;
    const x = vfSerie[vfPos], ok = v === x.vrai;
    vfChoix = v; vfRes.push({ x, ok }); if (ok) vfScores[equipes === 2 ? vfPos % 2 : 0]++;
    render();
  };
  const suivantVf = () => { if (vfChoix == null) return; vfPos++; vfChoix = null; render(); };
  const renderVfFiche = (tete) => {
    const n = vfFiche.length, nbRev = vfRev.filter(Boolean).length, tout = nbRev === n;
    const corrigees = vfFiche.map((_, i) => i).filter((i) => vfRev[i] && vfRep[i] != null), bonnes = corrigees.filter((i) => vfRep[i] === vfFiche[i].vrai).length;
    const item = (x, i) => {
      const vis = vfRev[i], cur = i === vfCorr, r = vfRep[i];
      const etat = vis && r != null ? (r === x.vrai ? "ok" : "ko") : "";
      const bt = (v) => `<button type="button" class="mes-vf-mini ${v ? "vrai" : "faux"} ${r === v ? "on" : ""} ${vis && v === x.vrai ? "sol" : ""}" data-vfi="${i}" data-vfv="${v ? 1 : 0}" aria-label="${v ? "Vrai" : "Faux"} pour l'égalité ${i + 1}">${v ? "V" : "F"}</button>`;
      return `<li class="mes-fi-item ${vis ? "rev" : ""} ${cur ? "cur" : ""} ${etat}">${vis ? `<button type="button" class="mes-fi-num" data-vfexpl="${i}" aria-label="Expliquer l'égalité ${i + 1}">${i + 1}</button>` : `<span class="mes-fi-num">${i + 1}</span>`}
        <div class="mes-fi-corps"><div class="mes-fi-q">${x.texte}</div>${vis ? `<div class="mes-fi-plus"><span class="${x.vrai ? "mes-vf-ok" : "mes-fi-sol"}">${x.vrai ? "✔ Vrai" : `✘ Faux ➜ ${x.correction}`}</span>${cur && x.expl ? `<span class="mes-fi-expl">${typo(x.expl)}</span>` : ""}</div>` : ""}</div>
        <span class="mes-vf-paire">${bt(true)}${bt(false)}</span></li>`;
    };
    el.innerHTML = `${tete}
      <div class="tool-top wrap mes-fi-outils">
        <div class="seg mes-seg" role="group" aria-label="Nombre d'égalités">${TAILLES_FICHE.map((t) => `<button type="button" data-vftaille="${t}" class="${t === taille ? "on" : ""}" aria-label="${t} égalités">${t}</button>`).join("")}</div>
        <button type="button" class="pill" id="mesVfFiNew">↻ Nouvelle fiche</button>
        <button type="button" class="pill mes-on" id="mesVfUne" ${tout ? "disabled" : ""}>${!nbRev ? "▶ Corriger une par une" : tout ? "✔ Tout est corrigé" : `Correction suivante ➜ (${nbRev + 1}/${n})`}</button>
        <button type="button" class="pill" id="mesVfTout" ${tout ? "disabled" : ""}>✅ Tout corriger</button>
        <button type="button" class="pill" id="mesVfEff" ${vfRep.some((r) => r != null) || nbRev ? "" : "disabled"}>🧽 Tout effacer</button>
      </div>
      <div class="mes-fiche mes-vf-fiche rc-board">
        <div class="mes-fi-tete"><b>✔✘ Vrai ou faux · ${escM(titreFiche())}</b><span>${n} égalités</span>${corrigees.length ? `<span class="mes-fi-score">✔ ${bonnes} / ${corrigees.length}</span>` : ""}</div>
        <ol class="mes-fi-grille" style="--rows:${Math.ceil(n / 2)};--n:${n}">${vfFiche.map(item).join("")}</ol>
        <p class="mes-aide mes-fi-astuce">${nbRev ? "Touche un numéro pour afficher l'explication." : "Les élèves écrivent V ou F sur l'ardoise. Touche V ou F pour noter la réponse de la classe, puis corrigez ensemble."}</p>
      </div>`;
    if (aDefiler) { aDefiler = false; el.querySelector(".mes-vf-fiche .mes-fi-item.cur")?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  };
  const clicVf = (t) => {
    if (t.dataset.vfsous) { vfSous = t.dataset.vfsous; retenir(); return render(); }
    if (t.dataset.eq) { equipes = +t.dataset.eq; nouvelleVf(); return render(); }
    if (t.id === "mesVfNew" || t.id === "mesVfNew2") { nouvelleVf(); return render(); }
    if (t.dataset.vf) return repondreVf(t.dataset.vf === "1");
    if (t.id === "mesVfNext") return suivantVf();
    if (t.dataset.vftaille) { taille = +t.dataset.vftaille; retenir(); nouvelleVfFiche(); nouvelleFiche(); return render(); }
    if (t.dataset.vfi !== undefined) { const i = +t.dataset.vfi, v = t.dataset.vfv === "1"; vfRep[i] = vfRep[i] === v ? null : v; return render(); }
    if (t.dataset.vfexpl !== undefined) { const i = +t.dataset.vfexpl; vfCorr = vfCorr === i ? -1 : i; return render(); }
    if (t.id === "mesVfFiNew") { nouvelleVfFiche(); return render(); }
    if (t.id === "mesVfUne") { const k = vfRev.findIndex((r) => !r); if (k >= 0) { vfRev[k] = true; vfCorr = k; aDefiler = true; } return render(); }
    if (t.id === "mesVfTout") { vfRev = vfRev.map(() => true); vfCorr = -1; return render(); }
    if (t.id === "mesVfEff") { vfRep = vfFiche.map(() => null); vfRev = vfRev.map(() => false); vfCorr = -1; return render(); }
  };

  const render = () => {
    valider();
    const tete = `<div class="tool-top wrap">${segNiveau(niv)}${segGrandeur(grandeursConv(niv), g, grandeursConv(niv).length > 1 ? [["melange", "🎲 Mélange"]] : [])}
      ${segMode()}${mode === "une" ? `<div class="seg"><button type="button" data-eq="1" class="${equipes === 1 ? "on" : ""}">1 joueur</button><button type="button" data-eq="2" class="${equipes === 2 ? "on" : ""}">2 équipes</button></div>
      <button type="button" class="pill" id="mesNew">↻ Nouvelle série</button>` : ""}${mode === "vf" ? `<div class="seg" role="group" aria-label="Vrai ou faux"><button type="button" data-vfsous="une" class="${vfSous === "une" ? "on" : ""}">Une par une</button><button type="button" data-vfsous="fiche" class="${vfSous === "fiche" ? "on" : ""}">Plusieurs à la fois</button></div>
      ${vfSous === "une" ? `<div class="seg"><button type="button" data-eq="1" class="${equipes === 1 ? "on" : ""}">1 joueur</button><button type="button" data-eq="2" class="${equipes === 2 ? "on" : ""}">2 équipes</button></div><button type="button" class="pill" id="mesVfNew">↻ Nouvelle série</button>` : ""}` : ""}</div>`;
    if (mode === "fiche") return renderFiche(tete);
    if (mode === "vf") return vfSous === "fiche" ? renderVfFiche(tete) : renderVfUne(tete);
    if (pos >= serie.length) {
      const err = resultats.filter((r) => !r.ok);
      const total = resultats.filter((r) => r.ok).length;
      el.innerHTML = `${tete}<div class="tool-center mes-fin rc-board">
        <div class="mes-score-big">${equipes === 2 ? `Équipe 1${NB}: ${scores[0]} · Équipe 2${NB}: ${scores[1]}` : `⭐ ${total} / ${serie.length}`}</div>
        <div class="banner ok" ${equipes === 2 ? (scores[0] !== scores[1] ? "data-fete" : "") : total === serie.length ? "data-fete" : ""}>${equipes === 2 ? (scores[0] === scores[1] ? "Égalité ! 🤝" : `L'équipe ${scores[0] > scores[1] ? 1 : 2} gagne ! 🎉`) : total === serie.length ? "Sans faute, bravo ! 🎉" : total >= 7 ? "Très bien ! 👏" : "Continue à t'entraîner, tu progresses ! 💪"}</div>
        ${err.length ? `<p class="mes-aide">À revoir${NB}:</p><ul class="mes-revoir">${err.map((r) => `<li>${r.q.correction}</li>`).join("")}</ul>` : ""}
        <button type="button" class="big-btn" id="mesNew2">↻ Rejouer</button></div>`;
      return;
    }
    const x = q();
    el.innerHTML = `${tete}
      <div class="mes-jeu rc-board">
        <div class="mes-prog">${serie.map((_, i) => `<i class="${i < resultats.length ? (resultats[i].ok ? "ok" : "ko") : i === pos ? "cur" : ""}"></i>`).join("")}
          <span class="mes-score">${equipes === 2 ? `<b class="${pos % 2 === 0 ? "on" : ""}">Équipe 1${NB}: ${scores[0]}</b> <b class="${pos % 2 === 1 ? "on" : ""}">Équipe 2${NB}: ${scores[1]}</b>` : `⭐ ${scores[0]}`}</span></div>
        ${equipes === 2 && !etat ? `<div class="mes-tour t${pos % 2}">À l'équipe ${pos % 2 + 1} !</div>` : ""}
        <div class="mes-q">${x.gauche}${x.droite ? "" : " ="} ${slotsHTML(x)}${x.droite || ""}</div>
        ${etat ? `<div class="banner ${etat === "ok" ? "ok" : "ko"} mes-verdict">${etat === "ok" ? choisir(["Bravo ! 🎉", "C'est juste ! ⭐", "Super ! 👏", "Exact ! 🎯"]) : `Pas tout à fait… La bonne réponse${NB}: ${x.correction}`}</div>
          <div class="pills mes-actions"><button type="button" class="big-btn soft mes-keep" id="mesAide">${x.tab && rang(niv) < 3 ? "📊 Voir dans le tableau" : "💡 Explication"}</button><button type="button" class="big-btn mes-keep" id="mesNext">${pos + 1 < serie.length ? "Suivant ➜" : "Résultats ➜"}</button></div>
          ${voirAide ? aideHTML(x) : ""}`
        : `${padHTML(virguleOk())}<button type="button" class="big-btn mes-ok" id="mesOk">Valider ✔</button>`}
      </div>`;
  };
  const corriger = () => {
    if (etat) return;
    const x = q();
    const vide = saisies.findIndex((s) => !s);
    if (vide >= 0) { slotActif = vide; return render(); }
    const ok = x.slots.every((s, i) => normaliser(saisies[i]) === normaliser(s.att));
    etat = ok ? "ok" : "ko";
    resultats.push({ q: x, ok });
    if (ok) scores[equipes === 2 ? pos % 2 : 0]++;
    render();
  };
  const suivant = () => { if (!etat) return; pos++; if (pos < serie.length) preparer(); render(); };
  const touche = (k) => {
    if (etat) return;
    let s = saisies[slotActif];
    if (k === "del") s = s.slice(0, -1);
    else if (k === ",") { if (!virguleOk() || s.includes(",")) return; s = (s || "0") + ","; }
    else if (s.length < 9) s = s === "0" ? k : s + k;
    saisies[slotActif] = s; render();
  };
  const clicFiche = (t) => {
    if (t.dataset.taille) { taille = +t.dataset.taille; retenir(); nouvelleFiche(); return render(); }
    if (t.dataset.fi !== undefined) { actif = { i: +t.dataset.fi, j: +t.dataset.fj }; aDefiler = true; return render(); }
    if (t.dataset.k !== undefined) return toucheFiche(t.dataset.k);
    if (t.dataset.finav) { if (t.dataset.finav === "close") actif = null; else { deplacer(t.dataset.finav === "next" ? 1 : -1); aDefiler = true; } return render(); }
    if (t.dataset.fiexpl !== undefined) { const i = +t.dataset.fiexpl; corrPos = corrPos === i ? -1 : i; return render(); }
    if (t.id === "mesFiNew") { nouvelleFiche(); return render(); }
    if (t.id === "mesFiUne") { corrigerSuivante(); return render(); }
    if (t.id === "mesFiTout") { revF = revF.map(() => true); corrPos = -1; masque = false; actif = null; return render(); }
    if (t.id === "mesFiMasque") { masque = !masque; return render(); }
    if (t.id === "mesFiEff") { repF = fiche.map((x) => x.slots.map(() => "")); revF = revF.map(() => false); corrPos = -1; masque = false; actif = null; return render(); }
    if (t.id === "mesFiPrint") return imprimer();
  };
  el.onclick = (e) => {
    if (surNiveau(e, (n) => { niv = n; nouveau(); render(); })) return;
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.g) { g = t.dataset.g; nouveau(); return render(); }
    if (t.dataset.cmode) { if (mode !== t.dataset.cmode) { mode = t.dataset.cmode; retenir(); actif = null; } return render(); }
    if (mode === "fiche") return clicFiche(t);
    if (mode === "vf") return clicVf(t);
    if (t.dataset.eq) { equipes = +t.dataset.eq; nouvelleSerie(); return render(); }
    if (t.id === "mesNew" || t.id === "mesNew2") { nouvelleSerie(); return render(); }
    if (t.dataset.slot !== undefined) { if (!etat) { slotActif = +t.dataset.slot; render(); } return; }
    if (t.dataset.k !== undefined) return touche(t.dataset.k);
    if (t.id === "mesOk") return corriger();
    if (t.id === "mesAide") { voirAide = !voirAide; return render(); }
    if (t.id === "mesNext") return suivant();
  };
  const finClavier = clavier((e) => {
    if (mode === "vf") {
      if (vfSous !== "une" || vfPos >= vfSerie.length) return;
      if (/^[vV]$/.test(e.key)) { repondreVf(true); return true; }
      if (/^[fF]$/.test(e.key)) { repondreVf(false); return true; }
      if (e.key === "Enter") { suivantVf(); return true; }
      return;
    }
    if (mode === "fiche") {
      if (!actif) return;
      if (/^\d$/.test(e.key)) { toucheFiche(e.key); return true; }
      if (e.key === "," || e.key === ".") { toucheFiche(","); return true; }
      if (e.key === "Backspace") { toucheFiche("del"); return true; }
      if (e.key === "Enter" || e.key === "Tab") { deplacer(e.shiftKey ? -1 : 1); aDefiler = true; render(); return true; }
      if (e.key === "Escape") { actif = null; render(); return true; }
      return;
    }
    if (pos >= serie.length) return;
    if (/^\d$/.test(e.key)) { touche(e.key); return true; }
    if (e.key === "," || e.key === ".") { touche(","); return true; }
    if (e.key === "Backspace") { touche("del"); return true; }
    if (e.key === "Tab" && !etat && serie[pos].slots.length > 1) { slotActif = (slotActif + 1) % serie[pos].slots.length; render(); return true; }
    if (e.key === "Enter") { if (etat) suivant(); else corriger(); return true; }
  });
  nouveau(); render();
  return () => { finClavier(); clearTimeout(attente); document.body.classList.remove("mes-imp"); document.querySelector(".mes-print")?.remove(); };
}

// =====================================================================
// 6. OUTIL : PROBLÈMES DE MESURES
// =====================================================================
// Prénoms (f = fille) pour les accords : « il / elle ».
const PRENOMS = [["Léa", 1], ["Tom", 0], ["Inès", 1], ["Hugo", 0], ["Nina", 1], ["Sami", 0], ["Zoé", 1], ["Malo", 0], ["Lina", 1], ["Noah", 0], ["Jade", 1], ["Adam", 0], ["Chloé", 1], ["Yanis", 0], ["Emma", 1], ["Lucas", 0], ["Rose", 1], ["Nathan", 0], ["Alice", 1], ["Ilyes", 0]];
const de = (n) => (/^[AEÉIOUYH]/.test(n) ? `d'${n}` : `de ${n}`);
const qui = (sauf) => { let p; do p = choisir(PRENOMS); while (sauf && p[0] === sauf.n); return { n: p[0], f: !!p[1], il: p[1] ? "elle" : "il", Il: p[1] ? "Elle" : "Il" }; };
const VILLES = [["Lyon", "Marseille"], ["Paris", "Lille"], ["Bordeaux", "Toulouse"], ["Nantes", "Rennes"], ["Strasbourg", "Metz"], ["Paris", "Lyon"], ["Montpellier", "Nice"]];

// Chaque problème : niveaux, grandeur, image, et gen() -> { t: énoncé, indice, rep: réponse, calc: calcul }
const PROBLEMES = [
  { id: "ruban", niv: ["CP", "CE1"], g: "longueurs", ico: "🎀", gen: (N) => { const p = qui(), L = N === "CP" ? entre(12, 30) : entre(30, 95), c = entre(3, L - 4); return { t: `${p.n} a un ruban de ${L} cm. ${p.Il} en coupe un morceau de ${c} cm. Quelle longueur de ruban lui reste-t-il ?`, indice: "On enlève un morceau au ruban : c'est une soustraction.", rep: `Il lui reste ${qte(L - c, "cm")} de ruban.`, calc: `${L} − ${c} = ${L - c}` }; } },
  { id: "crayons", niv: ["CP", "CE1"], g: "longueurs", ico: "✏️", gen: (N) => { const p1 = qui(), p2 = qui(p1), a = entre(11, 19), b = entre(5, a - 2); return { t: `Le crayon ${de(p1.n)} mesure ${a} cm. Celui ${de(p2.n)} mesure ${b} cm. De combien de centimètres le crayon ${de(p1.n)} est-il plus long ?`, indice: "Cherche l'écart entre les deux longueurs : de combien faut-il avancer pour aller de " + b + " à " + a + " ?", rep: `Le crayon ${de(p1.n)} est plus long de ${qte(a - b, "cm")}.`, calc: `${a} − ${b} = ${a - b}` }; } },
  { id: "collier", niv: ["CP", "CE1"], g: "longueurs", ico: "📿", gen: (N) => { const p = qui(), c = N === "CP" ? entre(20, 45) : entre(35, 70), b = N === "CP" ? entre(12, 25) : entre(15, 28); return { t: `${p.n} fabrique un collier avec ${c} cm de fil et un bracelet avec ${b} cm de fil. Quelle longueur de fil a-t-${p.il} utilisée en tout ?`, indice: "On réunit les deux longueurs : c'est une addition.", rep: `${p.Il} a utilisé ${qte(c + b, "cm")} de fil.`, calc: `${c} + ${b} = ${c + b}` }; } },
  { id: "kermesse", niv: ["CP", "CE1"], g: "monnaie", ico: "🎪", gen: (N) => { const p = qui(), a = N === "CP" ? entre(3, 9) : entre(8, 25), b = N === "CP" ? entre(2, 8) : entre(5, 19); return { t: `À la kermesse, ${p.n} achète un livre à ${a} € et un jeu à ${b} €. Combien paie-t-${p.il} en tout ?`, indice: "On ajoute les deux prix.", rep: `${p.Il} paie ${qte(a + b, "€")}.`, calc: `${a} + ${b} = ${a + b}` }; } },
  { id: "vacances", niv: ["CP", "CE1"], g: "durees", ico: "🏖️", gen: (N) => { const p = qui(), k = N === "CP" ? entre(2, 3) : entre(2, 4); return { t: `Les vacances ${de(p.n)} durent ${k} semaines. Combien de jours de vacances cela fait-il ?`, indice: "Une semaine, c'est 7 jours.", rep: `Cela fait ${7 * k} jours de vacances.`, calc: N === "CP" ? `${Array(k).fill(7).join(" + ")} = ${7 * k}` : `${k} × 7 = ${7 * k}` }; } },
  { id: "tour", niv: ["CP"], g: "longueurs", ico: "🧱", gen: () => { const p = qui(), h = choisir([5, 10]), k = entre(2, 5); return { t: `${p.n} empile ${k} boîtes. Chaque boîte mesure ${h} cm de haut. Quelle est la hauteur de la tour ?`, indice: `Ajoute ${h} cm pour chaque boîte.`, rep: `La tour mesure ${qte(h * k, "cm")} de haut.`, calc: `${Array(k).fill(h).join(" + ")} = ${h * k}` }; } },
  { id: "saut", niv: ["CP", "CE1"], g: "longueurs", ico: "🤸", gen: () => { const p1 = qui(), p2 = qui(p1), a = entre(65, 99); let b; do b = entre(55, 95); while (b === a); const [g1, g2] = a > b ? [p1, p2] : [p2, p1]; return { t: `Dans la cour, ${p1.n} saute à ${a} cm et ${p2.n} saute à ${b} cm. Qui a sauté le plus loin ? De combien de centimètres ?`, indice: "Compare les deux nombres, puis cherche l'écart entre eux.", rep: `C'est ${g1.n} qui a sauté le plus loin, de ${qte(Math.abs(a - b), "cm")}.`, calc: `${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}` }; } },
  { id: "tours-cour", niv: ["CE1", "CE2"], g: "longueurs", ico: "🏃", gen: (N) => { const p = qui(), t = entre(2, N === "CE1" ? 4 : 6), l = choisir([50, 60, 75, 80, 90, 120, 150]); return { t: `Pendant l'entraînement, ${p.n} fait ${t} tours de la cour. Un tour mesure ${l} m. Quelle distance a-t-${p.il} parcourue ?`, indice: `${p.Il} parcourt ${l} m à chaque tour, ${t} fois de suite.`, rep: `${p.Il} a parcouru ${qte(t * l, "m")}.`, calc: `${t} × ${l} = ${fmtNb(String(t * l))}` }; } },
  { id: "ruban-m", niv: ["CE1", "CE2"], g: "longueurs", ico: "🎁", gen: (N) => { const L = N === "CE1" ? 1 : entre(1, 3), c = 5 * entre(3, 18); return { t: `Pour emballer un cadeau, papa a un ruban de ${L} m. Il en coupe ${c} cm. Quelle longueur de ruban reste-t-il ?`, indice: `Convertis d'abord en centimètres : 1 m = 100 cm.`, rep: `Il reste ${qte(L * 100 - c, "cm")} de ruban${L * 100 - c >= 100 ? `, soit ${qte(Math.floor((L * 100 - c) / 100), "m")}${(L * 100 - c) % 100 ? ` ${qte((L * 100 - c) % 100, "cm")}` : ""}` : ""}.`, calc: `${L} m = ${L * 100} cm ; ${L * 100} − ${c} = ${L * 100 - c}` }; } },
  { id: "colis-livre", niv: ["CE1", "CE2"], g: "masses", ico: "📦", gen: (N) => { const kg = N === "CE1" ? 1 : entre(1, 4), gr = choisir(N === "CE1" ? [200, 300, 400, 500] : [250, 350, 450, 600, 750]); return { t: `Un colis pèse ${kg} kg. On y ajoute un livre de ${gr} g. Combien pèse le colis maintenant ? Donne la réponse en grammes.`, indice: `Convertis d'abord : 1 kg = 1 000 g.`, rep: `Le colis pèse ${qte(kg * 1000 + gr, "g")}, soit ${qte(kg, "kg")} ${qte(gr, "g")}.`, calc: `${kg} kg = ${fmtNb(String(kg * 1000))} g ; ${fmtNb(String(kg * 1000))} + ${gr} = ${fmtNb(String(kg * 1000 + gr))}` }; } },
  { id: "farine", niv: ["CE1", "CE2"], g: "masses", ico: "🎂", gen: (N) => { const p = qui(), f = choisir([100, 125, 150, 200, 250]), k = entre(2, N === "CE1" ? 3 : 4); return { t: `Pour faire un gâteau, il faut ${f} g de farine. ${p.n} veut faire ${k} gâteaux. Quelle masse de farine lui faut-il ?`, indice: `Il faut ${f} g pour chaque gâteau.`, rep: `Il lui faut ${qte(f * k, "g")} de farine${f * k >= 1000 ? `, soit ${f * k === 1000 ? `1${NB}kg` : `1${NB}kg ${qte(f * k - 1000, "g")}`}` : ""}.`, calc: `${k} × ${f} = ${fmtNb(String(f * k))}` }; } },
  { id: "bouteilles", niv: ["CE1", "CE2"], g: "contenances", ico: "💧", gen: (N) => { const b = entre(3, N === "CE1" ? 6 : 9), v = choisir([1, 2]); return { t: `Pour la sortie scolaire, la classe emporte ${b} bouteilles de ${v} L d'eau. Combien de litres d'eau la classe emporte-t-elle en tout ?`, indice: `Chaque bouteille contient ${v} L.`, rep: `La classe emporte ${qte(b * v, "L")} d'eau.`, calc: `${b} × ${v} = ${b * v}` }; } },
  { id: "film", niv: ["CE1", "CE2"], g: "durees", ico: "🎬", gen: (N) => { const d = N === "CE1" ? 60 * entre(1, 3) : 5 * entre(15, 30), deb = N === "CE1" ? 60 * entre(14, 17) : 60 * entre(14, 17) + 5 * entre(0, 7); return { t: `Le film commence à ${heure(deb)}. Il dure ${duree(d)}. À quelle heure se termine-t-il ?`, indice: d % 60 === 0 ? `Avance de ${d / 60} h.` : d >= 60 ? `Avance d'abord de ${Math.floor(d / 60)} h, puis ajoute les minutes.` : "Ajoute les minutes à l'heure de début.", rep: `Le film se termine à ${heure(deb + d)}.`, calc: `${heure(deb)} + ${duree(d)} = ${heure(deb + d)}` }; } },
  { id: "rendu", niv: ["CE1", "CE2"], g: "monnaie", ico: "💶", gen: (N) => { const p = qui(), billet = N === "CE1" ? 20 : choisir([20, 50]), prix = entre(Math.round(billet / 2), billet - 2); return { t: `${p.n} achète une BD à ${prix} €. ${p.Il} paie avec un billet de ${billet} €. Combien d'argent lui rend-on ?`, indice: `Cherche ce qu'il faut ajouter à ${prix} € pour arriver à ${billet} €.`, rep: `On lui rend ${qte(billet - prix, "€")}.`, calc: `${billet} − ${prix} = ${billet - prix}` }; } },
  { id: "piscine", niv: ["CE2", "CM1"], g: "longueurs", ico: "🏊", gen: () => { const p = qui(), n = entre(4, 16); return { t: `À la piscine, ${p.n} nage ${n} longueurs d'un bassin de 25 m. Quelle distance a-t-${p.il} nagée ? Combien de mètres lui manque-t-il pour avoir nagé 1 km ?`, indice: "Calcule d'abord la distance nagée. Puis souviens-toi que 1 km = 1 000 m.", rep: `${p.Il} a nagé ${qte(25 * n, "m")}. Il lui manque ${qte(1000 - 25 * n, "m")} pour faire 1${NB}km.`, calc: `${n} × 25 = ${25 * n} ; 1 000 − ${25 * n} = ${fmtNb(String(1000 - 25 * n))}` }; } },
  { id: "jus", niv: ["CE2", "CM1"], g: "contenances", ico: "🧃", gen: (N) => { const p = qui(), tot = N === "CE2" ? 100 : 150, v = choisir([10, 20, 25]), k = entre(2, Math.floor(tot / v) - 1); return { t: `Une bouteille contient ${N === "CE2" ? "1" : "1,5"} L de jus de pomme. ${p.n} remplit ${k} verres de ${v} cL. Combien de centilitres de jus reste-t-il dans la bouteille ?`, indice: `Convertis d'abord : 1 L = 100 cL${N === "CE2" ? "" : ", donc 1,5 L = 150 cL"}.`, rep: `Il reste ${qte(tot - k * v, "cL")} de jus.`, calc: `${k} × ${v} = ${k * v} ; ${tot} − ${k * v} = ${tot - k * v}` }; } },
  { id: "laine", niv: ["CE2", "CM1"], g: "longueurs", ico: "🧶", gen: () => { const p = qui(), L = entre(1, 4), m = choisir([20, 25, 50]); return { t: `Avec une pelote de ${L} m de laine, ${p.n} coupe des morceaux de ${m} cm. Combien de morceaux peut-${p.il} couper ?`, indice: `${L} m = ${L * 100} cm. Combien de fois ${m} cm dans ${L * 100} cm ?`, rep: `${p.Il} peut couper ${(L * 100) / m} morceaux.`, calc: `${L * 100} ÷ ${m} = ${(L * 100) / m}` }; } },
  { id: "recre", niv: ["CE2"], g: "durees", ico: "🔔", gen: () => { const deb = 600 + 5 * entre(0, 6), d = 5 * entre(3, 5); return { t: `La récréation commence à ${heure(deb)} et dure ${d} minutes. À quelle heure se termine-t-elle ?`, indice: "Ajoute les minutes de la récréation aux minutes de l'heure de début.", rep: `Elle se termine à ${heure(deb + d)}.`, calc: `${heure(deb)} + ${d} min = ${heure(deb + d)}` }; } },
  { id: "train", niv: ["CE2", "CM1"], g: "durees", ico: "🚆", gen: () => { const [a, b] = choisir(VILLES), dep = 60 * entre(7, 15) + 5 * entre(0, 11), d = 5 * entre(9, 34); return { t: `Un train part de ${a} à ${heure(dep)} et arrive à ${b} à ${heure(dep + d)}. Combien de temps dure le trajet ?`, indice: `Avance de ${heure(dep)} jusqu'à l'heure pile suivante, puis continue jusqu'à ${heure(dep + d)}.`, rep: `Le trajet dure ${duree(d)}.`, calc: `De ${heure(dep)} à ${heure(dep + d)} : ${duree(d)}` }; } },
  { id: "insectes", niv: ["CE2", "CM1"], g: "longueurs", ico: "🐞", gen: () => { const a = entre(6, 15), k = entre(2, 4), t = a * k; return { t: `Une fourmi mesure ${a} mm. Un scarabée est ${k} fois plus long que la fourmi. Combien mesure le scarabée ?`, indice: `Multiplie la longueur de la fourmi par ${k}.`, rep: `Le scarabée mesure ${qte(t, "mm")}${t >= 10 ? `, soit ${qte(Math.floor(t / 10), "cm")}${t % 10 ? ` ${qte(t % 10, "mm")}` : ""}` : ""}.`, calc: `${a} × ${k} = ${t}` }; } },
  { id: "colis-poste", niv: ["CE2", "CM1"], g: "masses", ico: "📮", gen: () => { const p = qui(), l = 50 * entre(12, 18), k = 3, boite = choisir([500, 1000, 1500]), tot = k * l + boite; let seuil = choisir([3000, 4000]); if (seuil === tot) seuil += 1000; return { t: `${p.n} prépare un colis. ${p.Il} y met ${k} livres de ${l} g chacun et une boîte de ${boite >= 1000 ? `${boite === 1000 ? "1 kg" : "1 kg 500 g"}` : `${boite} g`}. Combien pèse le colis ? Pèse-t-il moins de ${seuil / 1000} kg ?`, indice: `Calcule la masse des livres, puis convertis tout en grammes (1 kg = 1 000 g).`, rep: `Le colis pèse ${qte(tot, "g")}, soit ${qte(Math.floor(tot / 1000), "kg")} ${qte(tot % 1000, "g")}. ${tot < seuil ? `Oui, il pèse moins de ${seuil / 1000}${NB}kg.` : `Non, il pèse plus de ${seuil / 1000}${NB}kg.`}`, calc: `${k} × ${l} = ${fmtNb(String(k * l))} ; ${fmtNb(String(k * l))} + ${fmtNb(String(boite))} = ${fmtNb(String(tot))}` }; } },
  { id: "rando", niv: ["CM1", "CM2"], g: "longueurs", ico: "🥾", gen: (N) => { const a = 100 * entre(20, 45), b = N === "CM1" ? 100 * entre(15, 35) : 10 * entre(150, 350); return { t: `Lors de la randonnée, la classe marche ${qteB(a, 3, "km")} le matin et ${qteB(b, 3, "km")} l'après-midi. Quelle distance la classe a-t-elle parcourue dans la journée ?`, indice: "On additionne les deux distances. Pense à bien aligner les virgules.", rep: `La classe a parcouru ${qteB(a + b, 3, "km")}.`, calc: `${fmtNb(depuisBase(a, 3))} + ${fmtNb(depuisBase(b, 3))} = ${fmtNb(depuisBase(a + b, 3))}` }; } },
  { id: "caisse", niv: ["CM1", "CM2"], g: "masses", ico: "🥫", gen: () => { const c = entre(1, 3), k = entre(4, 8), pg = choisir([250, 400, 450, 500, 800]), tot = c * 1000 + k * pg; return { t: `Une caisse vide pèse ${c} kg. On y range ${k} boîtes de conserve de ${pg} g chacune. Combien pèse la caisse pleine ? Donne la réponse en kilogrammes.`, indice: `Calcule la masse des boîtes en grammes, puis convertis-la en kilogrammes (1 000 g = 1 kg).`, rep: `La caisse pleine pèse ${qteB(tot, 3, "kg")}.`, calc: `${k} × ${pg} = ${fmtNb(String(k * pg))} g = ${fmtNb(depuisBase(k * pg, 3))} kg ; ${c} + ${fmtNb(depuisBase(k * pg, 3))} = ${fmtNb(depuisBase(tot, 3))}` }; } },
  { id: "seaux", niv: ["CM1", "CM2"], g: "contenances", ico: "🪣", gen: () => { let V, s; do { V = choisir([600, 800, 1000, 1200, 1500]); s = choisir([5, 8, 10, 12, 15]); } while (V % s); return { t: `Une piscine gonflable contient ${qte(V, "L")} d'eau. Pour la vider, on utilise un seau de ${s} L. Combien de seaux faut-il remplir pour la vider entièrement ?`, indice: `Combien de fois ${s} L dans ${fmtNb(String(V))} L ? C'est une division.`, rep: `Il faut remplir ${V / s} seaux.`, calc: `${fmtNb(String(V))} ÷ ${s} = ${V / s}` }; } },
  { id: "limonade", niv: ["CM1"], g: "contenances", ico: "🥤", gen: () => { const a = entre(2, 6), v = choisir([20, 25, 50]); return { t: `Pour la fête de l'école, on prépare ${a} L de limonade. Chaque verre contient ${v} cL. Combien de verres peut-on servir ?`, indice: `Convertis d'abord : ${a} L = ${a * 100} cL.`, rep: `On peut servir ${(a * 100) / v} verres.`, calc: `${a * 100} ÷ ${v} = ${(a * 100) / v}` }; } },
  { id: "tournoi", niv: ["CM1", "CM2"], g: "durees", ico: "🤾", gen: () => { const deb = 60 * entre(9, 14) + 5 * entre(1, 11), d = 5 * entre(20, 50); return { t: `Le tournoi de handball commence à ${heure(deb)} et se termine à ${heure(deb + d)}. Combien de temps a-t-il duré ?`, indice: `Compte d'abord jusqu'à ${heure(Math.ceil(deb / 60) * 60)}, puis les heures pleines, puis les minutes qui restent.`, rep: `Le tournoi a duré ${duree(d)}.`, calc: `De ${heure(deb)} à ${heure(deb + d)} : ${duree(d)}` }; } },
  { id: "grillage", niv: ["CM1", "CM2"], g: "longueurs", ico: "🥕", gen: () => { const a = entre(8, 20), b = 10 * entre(4, a - 2) + 5, per = 2 * (a * 10 + b); return { t: `Le potager de l'école est un rectangle de ${a} m de long et ${qteB(b, 1, "m")} de large. Quelle longueur de grillage faut-il pour en faire le tour ?`, indice: "Faire le tour, c'est calculer le périmètre : deux longueurs et deux largeurs.", rep: `Il faut ${qteB(per, 1, "m")} de grillage.`, calc: `${a} + ${fmtNb(depuisBase(b, 1))} = ${fmtNb(depuisBase(a * 10 + b, 1))} ; 2 × ${fmtNb(depuisBase(a * 10 + b, 1))} = ${fmtNb(depuisBase(per, 1))}` }; } },
  { id: "crepes", niv: ["CM1", "CM2"], g: "contenances", ico: "🥞", gen: () => { const n = choisir([8, 12, 16, 20]), k = n / 4, lait = 50 * k; return { t: `Pour 4 personnes, une recette de crêpes demande 0,5 L de lait. Quelle quantité de lait faut-il pour ${n} personnes ?`, indice: `${n} personnes, c'est ${k} fois plus que 4 personnes. Et 0,5 L = 50 cL.`, rep: `Il faut ${qteB(lait * 10, 3, "L")} de lait, soit ${qte(lait, "cL")}.`, calc: `${k} × 0,5 = ${fmtNb(depuisBase(lait * 10, 3))}` }; } },
  { id: "fuite", niv: ["CM2"], g: "contenances", ico: "🚰", gen: () => { const f = choisir([5, 10, 15, 20, 25]), cl = f * 24; return { t: `Un robinet mal fermé perd ${f} cL d'eau par heure. Combien de litres d'eau perd-il en une journée ?`, indice: "Une journée dure 24 heures. Calcule en centilitres, puis convertis : 100 cL = 1 L.", rep: `Il perd ${qte(cl, "cL")}, soit ${qteB(cl * 10, 3, "L")} d'eau par jour.`, calc: `24 × ${f} = ${cl} ; ${cl} cL = ${fmtNb(depuisBase(cl * 10, 3))} L` }; } },
  { id: "verres", niv: ["CM2"], g: "contenances", ico: "🥛", gen: () => { const v = choisir([12, 15, 20, 25, 30, 35, 40]), n = Math.floor(150 / v), r = 150 - n * v; return { t: `Avec une bouteille de 1,5 L de jus, combien de verres de ${v} cL peut-on remplir entièrement ? Quelle quantité de jus reste-t-il ensuite ?`, indice: "Convertis d'abord 1,5 L en centilitres : 1 L = 100 cL.", rep: `On peut remplir ${n} verres${r ? ` et il reste ${qte(r, "cL")} de jus` : " et il ne reste plus de jus"}.`, calc: `1,5 L = 150 cL ; ${n} × ${v} = ${n * v}${r ? ` ; 150 − ${n * v} = ${r}` : ""}` }; } },
  { id: "marathon", niv: ["CM2"], g: "longueurs", ico: "🏅", gen: () => { const d = 100 * entre(150, 400), r = 42195 - d; return { t: `Un marathon mesure 42,195 km. Après ${qteB(d, 3, "km")}, quelle distance reste-t-il à parcourir au coureur ?`, indice: "C'est une soustraction : écris 42,195 et le nombre de kilomètres parcourus en alignant bien les virgules.", rep: `Il lui reste ${qteB(r, 3, "km")} à parcourir.`, calc: `42,195 − ${fmtNb(depuisBase(d, 3))} = ${fmtNb(depuisBase(r, 3))}` }; } },
  { id: "ascenseur", niv: ["CM2"], g: "masses", ico: "🛗", gen: () => { const max = choisir([5, 6, 8]), p = choisir([65, 70, 75, 80]), k = entre(6, 11), tot = k * p, ok = tot <= max * 100; return { t: `Un ascenseur peut transporter au maximum 0,${max} t. ${k} personnes qui pèsent chacune environ ${p} kg peuvent-elles monter ensemble ?`, indice: `Convertis d'abord : 0,${max} t = ${max * 100} kg (1 t = 1 000 kg).`, rep: ok ? `Oui : ${k} × ${p} = ${tot} kg, et ${tot} kg ne dépasse pas ${max * 100} kg.` : `Non : ${k} × ${p} = ${tot} kg, c'est plus que ${max * 100} kg.`, calc: `${k} × ${p} = ${fmtNb(String(tot))} ; 0,${max} t = ${max * 100} kg` }; } },
  { id: "film-min", niv: ["CM2"], g: "durees", ico: "🍿", gen: () => { const d = 5 * entre(19, 32), deb = 20 * 60 + 5 * entre(0, 9); return { t: `Un film dure ${d} minutes. Il commence à ${heure(deb)}. À quelle heure se termine-t-il ?`, indice: `Convertis d'abord la durée : ${d} min = ${duree(d)}.`, rep: `Le film se termine à ${heure(deb + d)}.`, calc: `${d} min = ${duree(d)} ; ${heure(deb)} + ${duree(d)} = ${heure(deb + d)}` }; } },
  { id: "guirlandes", niv: ["CM2"], g: "longueurs", ico: "🎉", gen: () => { let R, gc, k; do { R = choisir([10, 12, 15, 20]); gc = choisir([60, 75, 80, 90]); k = entre(8, 20); } while (k * gc >= R * 100); const reste = R * 100 - k * gc; return { t: `Pour décorer la classe, on découpe ${k} guirlandes de ${gc} cm dans un rouleau de papier de ${R} m. Quelle longueur de papier reste-t-il ? Donne la réponse en mètres.`, indice: `Calcule la longueur des guirlandes en centimètres, puis convertis le rouleau : ${R} m = ${fmtNb(String(R * 100))} cm.`, rep: `Il reste ${qte(reste, "cm")} de papier, soit ${qteB(reste * 10, 3, "m")}.`, calc: `${k} × ${gc} = ${fmtNb(String(k * gc))} ; ${fmtNb(String(R * 100))} − ${fmtNb(String(k * gc))} = ${fmtNb(String(reste))}` }; } },
  { id: "chocolat", niv: ["CM2"], g: "masses", ico: "🍫", gen: () => { const t = choisir([100, 125, 200, 250]), b = choisir([300, 450, 600, 750, 900]), q = Math.ceil(b / t); return { t: `Une recette demande ${qteB(b, 3, "kg")} de chocolat. Le chocolat est vendu en tablettes de ${t} g. Combien de tablettes faut-il acheter ?`, indice: `Convertis d'abord : ${fmtNb(depuisBase(b, 3))} kg = ${b} g.`, rep: `Il faut acheter ${q} tablettes.`, calc: b % t === 0 ? `${b} ÷ ${t} = ${q}` : `${q - 1} tablettes = ${(q - 1) * t} g, ce n'est pas assez ; ${q} tablettes = ${fmtNb(String(q * t))} g` }; } },
];

function problemesMesures(el) {
  let niv = niveauJeux(), filtre = "tous", cur = null, dernier = [], indice = false, reponse = false, num = 0;
  const dispo = () => PROBLEMES.filter((p) => p.niv.includes(niv));
  const grandeursDispo = () => [...new Set(dispo().map((p) => p.g))];
  const nouveau = () => {
    if (filtre !== "tous" && !grandeursDispo().includes(filtre)) filtre = "tous";
    let l = dispo().filter((p) => filtre === "tous" || p.g === filtre);
    const frais = l.filter((p) => !dernier.includes(p.id)); if (frais.length) l = frais;
    const p = choisir(l);
    dernier = [p.id, ...dernier].slice(0, Math.max(0, Math.min(4, dispo().filter((x) => filtre === "tous" || x.g === filtre).length - 1)));
    cur = { p, d: p.gen(niv) }; indice = reponse = false; num++;
  };
  const render = () => {
    const { p, d } = cur;
    el.innerHTML = `
      <div class="tool-top wrap">${segNiveau(niv)}${segGrandeur(grandeursDispo(), filtre, [["tous", "🎲 Tous"]])}</div>
      <div class="mes-pb">
        <div class="mes-pb-carte">
          <div class="mes-pb-tete"><span class="mes-pb-ico" aria-hidden="true">${p.ico}</span><span class="mes-pb-num">Problème ${num} · ${GRANDEURS[p.g].nom}</span></div>
          <p class="mes-pb-txt">${typo(d.t)}</p>
        </div>
        ${indice ? `<div class="mes-pb-indice">💡 <b>Indice${NB}:</b> ${typo(d.indice)}</div>` : ""}
        ${reponse ? `<div class="mes-pb-rep"><div class="mes-pb-calc">${typo(d.calc)}</div><div>✅ ${typo(d.rep)}</div></div>` : ""}
        <div class="pills"><button type="button" class="big-btn soft" id="mesInd">${indice ? "🙈 Cacher l'indice" : "💡 Indice"}</button><button type="button" class="big-btn soft" id="mesRep">${reponse ? "🙈 Cacher la réponse" : "✅ Réponse"}</button><button type="button" class="big-btn" id="mesSuiv">Suivant ➜</button></div>
      </div>`;
  };
  el.onclick = (e) => {
    if (surNiveau(e, (n) => { niv = n; dernier = []; nouveau(); render(); })) return;
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.g) { filtre = t.dataset.g; dernier = []; nouveau(); return render(); }
    if (t.id === "mesInd") indice = !indice;
    if (t.id === "mesRep") reponse = !reponse;
    if (t.id === "mesSuiv") nouveau();
    render();
  };
  nouveau(); render();
}

// =====================================================================
// 7. OUTIL : QUELLE UNITÉ ?
// =====================================================================
function quelleUnite(el) {
  let niv = niveauJeux(), serie = [], pos = 0, choix = null, score = 0, erreurs = [];
  const itemsNiv = () => QU_ITEMS.filter(([, u, n]) => rang(n) <= rang(niv) && (QU_UNITES[niv][GRANDEUR_DE[u]] || []).includes(u));
  const nouvelleSerie = () => {
    const items = melange(itemsNiv()).slice(0, NB_QUESTIONS);
    serie = items.map(([phrase, u]) => {
      const tous = QU_UNITES[niv][GRANDEUR_DE[u]];
      const autres = melange(tous.filter((x) => x !== u)).slice(0, 3);
      const props = tous.filter((x) => x === u || autres.includes(x)); // dans l'ordre, de la plus petite à la plus grande
      return { phrase, u, props };
    });
    pos = 0; choix = null; score = 0; erreurs = [];
  };
  const phraseHTML = (it, u) => typo(escM(it.phrase).replace("_", u ? `<b class="mes-qu-u ${u === it.u ? "good" : "bad"}">${escM(u)}</b>` : `<span class="mes-qu-trou">…</span>`));
  const render = () => {
    const tete = `<div class="tool-top wrap">${segNiveau(niv)}<button type="button" class="pill" id="mesNew">↻ Nouvelle série</button></div>`;
    if (pos >= serie.length) {
      el.innerHTML = `${tete}<div class="tool-center rc-board"><div class="mes-score-big">⭐ ${score} / ${serie.length}</div>
        ${erreurs.length ? `<p class="mes-aide">À revoir${NB}:</p><ul class="mes-revoir">${erreurs.map((it) => `<li>${typo(escM(it.phrase.replace("_", it.u)))}</li>`).join("")}</ul>` : `<div class="banner ok">Sans faute, bravo ! 🎉</div>`}
        <button type="button" class="big-btn" id="mesNew2">↻ Rejouer</button></div>`;
      return;
    }
    const it = serie[pos];
    el.innerHTML = `${tete}
      <div class="mes-qu rc-board">
        <div class="mes-prog">${serie.map((_, i) => `<i class="${i < pos ? "fait" : i === pos ? "cur" : ""}"></i>`).join("")}<span class="mes-score">⭐ ${score}</span></div>
        <p class="mes-qu-phrase">${phraseHTML(it, choix)}</p>
        <div class="mes-qu-choix">${it.props.map((u) => `<button type="button" data-u="${escM(u)}" class="mes-qu-btn ${choix ? (u === it.u ? "good" : u === choix ? "bad" : "") : ""}" ${choix ? "disabled" : ""}><b>${escM(u)}</b><small>${escM(NOMS_UNITES[u] ? NOMS_UNITES[u] + (["jours", "semaines", "ans"].includes(u) ? "s" : "") : "")}</small></button>`).join("")}</div>
        ${choix ? `<div class="banner ${choix === it.u ? "ok" : "ko"} mes-verdict">${choix === it.u ? choisir(["Bravo ! 🎉", "C'est juste ! ⭐", "Exact ! 🎯"]) : `Non, ce n'est pas ${escM(choix)}. La bonne unité${NB}: ${escM(it.u)}.`}</div>
          <button type="button" class="big-btn" id="mesNext">${pos + 1 < serie.length ? "Suivant ➜" : "Résultats ➜"}</button>` : ""}
      </div>`;
  };
  el.onclick = (e) => {
    if (surNiveau(e, (n) => { niv = n; nouvelleSerie(); render(); })) return;
    const t = e.target.closest("button"); if (!t) return;
    if (t.id === "mesNew" || t.id === "mesNew2") nouvelleSerie();
    if (t.dataset.u && !choix) { choix = t.dataset.u; const it = serie[pos]; if (choix === it.u) score++; else erreurs.push(it); }
    if (t.id === "mesNext") { pos++; choix = null; }
    render();
  };
  const finClavier = clavier((e) => { if (e.key === "Enter" && choix) { pos++; choix = null; render(); return true; } });
  nouvelleSerie(); render();
  return finClavier;
}

export const MESURES = [
  { id: "tableau-conversion", nom: "Tableau de conversion", icone: "📐", couleur: "#cfe6ff", desc: "Le tableau des mesures à remplir au tableau", mount: tableauConversion },
  { id: "conversions", nom: "Conversions", icone: "🔁", couleur: "#d7ccff", desc: "Longueurs, masses, contenances, durées · fiche · vrai ou faux", mount: conversions },
  { id: "problemes-mesures", nom: "Problèmes de mesures", icone: "🧮", couleur: "#ffe3a3", desc: "Des problèmes du quotidien, avec indice", mount: problemesMesures },
  { id: "quelle-unite", nom: "Quelle unité ?", icone: "📏", couleur: "#c9ecd4", desc: "Choisir la bonne unité de mesure", mount: quelleUnite },
];
