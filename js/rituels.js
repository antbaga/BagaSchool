// Rituels du matin (v0.10) : date du jour (FR / EN), nombre du jour (activités au choix),
// mot du jour, horloge (lire, placer, durées), enquête grammaticale, phrases à transformer.
// Contenus d'exemple rédigés pour l'outil (pas des textes officiels).
// Même format que outils.js : mount(el, ctx) -> cleanup.
import { enLettres } from "./imprimer.js";
import { pieceHTML } from "./jeux.js";
import { MOTS } from "./data/mots.js";

const hasard = (n) => Math.floor(Math.random() * n);
const entre = (a, b) => a + hasard(b - a + 1);
const melange = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = hasard(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const escO = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const NIVEAUX_R = ["CP", "CE1", "CE2", "CM1", "CM2"];
const MAX_NB = { CP: 100, CE1: 1000, CE2: 9999, CM1: 99999, CM2: 999999 };
const RANGS = ["unité", "dizaine", "centaine", "unité de mille", "dizaine de mille", "centaine de mille"];
const pluriel = (k, mot) => k > 1 ? mot.replace(/^(\S+)/, "$1s") : mot;
const fmtNb = (n) => n.toLocaleString("fr-FR").replace(/ | /g, " ");

// Activités du nombre du jour. Chaque carte a une clé stable : l'enseignante choisit
// celles qu'elle veut travailler (mémorisé sur l'appareil).
const CARTES_NB = [
  ["lettres", "En lettres"], ["unites", "Unités de numération"], ["decomp", "Décomposition"], ["materiel", "Avec le matériel"],
  ["combien", "Combien de… ?"], ["avantapres", "Avant, après"], ["encadrement", "Encadrement"], ["parite", "Pair ou impair ?"],
  ["multiples", "Dans quelles tables ?"], ["doublemoitie", "Double et moitié"], ["euros", "En euros"], ["droite", "Sur la droite graduée"],
];
const CARTES_NB_OFF = "bagaschool-rit-nb-off";

// Plaques (centaines), barres (dizaines) et cubes (unités), pour les nombres < 1 000.
function materielSVG(n) {
  const c = Math.floor(n / 100), d = Math.floor(n / 10) % 10, u = n % 10, s = 7;
  const grille = (w, h) => { let r = ""; for (let i = 1; i < 10; i++) { if (w > s) r += `<line x1="${i * s}" y1="0" x2="${i * s}" y2="${h}"/>`; r += `<line x1="0" y1="${i * s}" x2="${w}" y2="${i * s}"/>`; } return r; };
  const plaque = `<svg viewBox="-1 -1 ${10 * s + 2} ${10 * s + 2}" class="mt-pl"><rect width="${10 * s}" height="${10 * s}" class="mt-c"/>${grille(10 * s, 10 * s)}</svg>`;
  const barre = `<svg viewBox="-1 -1 ${s + 2} ${10 * s + 2}" class="mt-ba"><rect width="${s}" height="${10 * s}" class="mt-d"/>${grille(s, 10 * s)}</svg>`;
  const cubes = u ? `<svg viewBox="-1 -1 ${2 * s + 5} ${10 * s + 2}" class="mt-cu">${Array.from({ length: u }, (_, k) => `<rect x="${(k % 2) * (s + 3)}" y="${10 * s - s - Math.floor(k / 2) * (s + 3)}" width="${s}" height="${s}" class="mt-u"/>`).join("")}</svg>` : "";
  return `<div class="rit-materiel" role="img" aria-label="${c} centaines, ${d} dizaines, ${u} unités">${plaque.repeat(c)}${c && (d || u) ? "<i></i>" : ""}${barre.repeat(d)}${d && u ? "<i></i>" : ""}${cubes}</div>`;
}

function cartesNombre(n, niv) {
  const r = NIVEAUX_R.indexOf(niv), ch = String(n).split("").reverse().map(Number), cartes = [];
  const trad = enLettres(n, false);
  cartes.push(["lettres", "En lettres", `<p class="rit-gros">${enLettres(n)}</p>${trad !== enLettres(n) ? `<p class="muted">Orthographe traditionnelle : ${trad}</p>` : ""}`]);
  const rangs = ch.map((c, i) => [c, i]).filter(([c]) => c).reverse();
  cartes.push(["unites", "Unités de numération", `<p>${rangs.map(([c, i]) => `${c} ${pluriel(c, RANGS[i])}`).join(", ") || "0 unité"}</p>`]);
  cartes.push(["decomp", "Décomposition", `<p>${rangs.map(([c, i]) => fmtNb(c * 10 ** i)).join(" + ") || "0"}</p>${r >= 2 && rangs.length > 1 ? `<p>${rangs.map(([c, i]) => i ? `(${c} × ${fmtNb(10 ** i)})` : c).join(" + ")}</p>` : ""}`]);
  if (n > 0 && n < 1000) cartes.push(["materiel", "Avec le matériel", `${materielSVG(n)}<p class="muted">${n >= 100 ? "plaques = centaines, " : ""}barres = dizaines, cubes = unités</p>`]);
  if (r >= 1 && n >= 10) cartes.push(["combien", "Combien de… ?", `<p>${fmtNb(Math.floor(n / 10))} ${pluriel(Math.floor(n / 10), "dizaine")}${n >= 100 ? `<br>${fmtNb(Math.floor(n / 100))} ${pluriel(Math.floor(n / 100), "centaine")}` : ""}${r >= 3 && n >= 1000 ? `<br>${fmtNb(Math.floor(n / 1000))} ${pluriel(Math.floor(n / 1000), "millier")}` : ""}</p>`]);
  const pas = [1, 10, 100, 1000].slice(0, r <= 0 ? 1 : r === 1 ? 2 : r === 2 ? 3 : 4).filter((p) => p <= Math.max(1, n));
  cartes.push(["avantapres", "Avant, après", pas.map((p) => `<p>${n - p >= 0 ? fmtNb(n - p) : "—"} ← <b>${fmtNb(n)}</b> → ${fmtNb(n + p)} <span class="muted">(${p === 1 ? "de 1 en 1" : `de ${fmtNb(p)} en ${fmtNb(p)}`})</span></p>`).join("")]);
  const enc = [10, 100, 1000].slice(0, r === 0 ? 1 : r === 1 ? 2 : 3).filter((p) => n >= p / 10 && p <= n * 10);
  const nomP = { 10: "à la dizaine", 100: "à la centaine", 1000: "au millier" };
  if (enc.length) cartes.push(["encadrement", "Encadrement", enc.map((p) => { const bas = n % p ? Math.floor(n / p) * p : n - p, haut = n % p ? Math.ceil(n / p) * p : n + p; return `<p>${fmtNb(Math.max(0, bas))} &lt; ${fmtNb(n)} &lt; ${fmtNb(haut)} <span class="muted">(${nomP[p]})</span></p>`; }).join("")]);
  cartes.push(["parite", "Pair ou impair ?", `<p class="rit-gros">${n % 2 ? "Impair" : "Pair"}</p><p class="muted">Son chiffre des unités est ${ch[0]}.</p>`]);
  // Tables : CE1 2, 5, 10 ; CE2 tables de 2 à 9 ; CM : critères de divisibilité 2, 3, 5, 9, 10.
  if (r >= 1 && n > 0) {
    const ds = r === 1 ? [2, 5, 10] : r === 2 ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 5, 9, 10];
    const lib = r >= 3 ? "Divisible par" : "Dans la table de";
    cartes.push(["multiples", r >= 3 ? "Divisible par… ?" : "Dans quelles tables ?", `<p class="muted">${lib}</p><div class="rit-tables">${ds.map((x) => `<span class="${n % x ? "non" : "oui"}">${x} ${n % x ? "✗" : "✓"}</span>`).join("")}</div>${r >= 3 ? `<p class="muted">Somme des chiffres : ${ch.reduce((a, b) => a + b, 0)}</p>` : ""}`]);
  }
  cartes.push(["doublemoitie", "Double et moitié", `<p>Double : ${fmtNb(2 * n)}</p><p>Moitié : ${n % 2 === 0 ? fmtNb(n / 2) : r >= 3 ? (n / 2).toLocaleString("fr-FR") : "pas de moitié entière"}</p>`]);
  // Monnaie : le moins de billets et de pièces possible (euros entiers)
  let reste = n; const tas = [];
  for (const v of [500, 200, 100, 50, 20, 10, 5, 2, 1]) { const k = Math.floor(reste / v); if (k) { tas.push([v, k]); reste -= k * v; } }
  cartes.push(["euros", "En euros", `<div class="rit-monnaie">${tas.map(([v, k]) => `<span class="rit-m">${k <= 4 ? Array(k).fill(pieceHTML(v * 100, 'tabindex="-1"')).join("") : pieceHTML(v * 100, 'tabindex="-1"') + `<b>× ${k}</b>`}</span>`).join("")}</div>`]);
  // Droite graduée autour du nombre
  const u = 10 ** Math.max(0, String(n).length - 2), a0 = Math.floor(n / (10 * u)) * 10 * u, W = 520;
  let svg = `<svg viewBox="-20 0 ${W + 40} 70" class="rit-droite"><line x1="0" y1="30" x2="${W}" y2="30"/>`;
  for (let k = 0; k <= 10; k++) { const x = k * W / 10; svg += `<line x1="${x}" y1="${k % 5 ? 23 : 18}" x2="${x}" y2="${k % 5 ? 37 : 42}"/>`; if (k % 5 === 0) svg += `<text x="${x}" y="60">${fmtNb(a0 + k * u)}</text>`; }
  const xn = (n - a0) / (10 * u) * W;
  svg += `<path d="M${xn} 14 l-7 -10 h14 z" class="rit-fleche"/><text x="${xn}" y="10" class="rit-n"></text></svg>`;
  cartes.push(["droite", "Sur la droite graduée", svg]);
  return cartes;
}

// Enquête grammaticale : « mot/NATURE » ; groupes = fonctions (indices de mots, ponctuation exclue).
// Natures : N nom, D déterminant, V verbe, A adjectif, P pronom, Adv adverbe, Prep préposition, C conjonction.
// Fonctions : S sujet, V verbe, CV complément du verbe (COD / COI), CP complément de phrase.
const PHRASES_G = [
  ["Le/D petit/A chat/N boit/V du/D lait/N .", "S:0-2 V:3 CV:4-5:COD"],
  ["Les/D élèves/N chantent/V dans/Prep la/D cour/N .", "S:0-1 V:2 CP:3-5"],
  ["Ma/D sœur/N lit/V un/D livre/N passionnant/A .", "S:0-1 V:2 CV:3-5:COD"],
  ["Demain/Adv ,/ nous/P visiterons/V le/D musée/N .", "CP:0 S:1 V:2 CV:3-4:COD"],
  ["Le/D vent/N emporte/V les/D feuilles/N mortes/A .", "S:0-1 V:2 CV:3-5:COD"],
  ["Paul/N et/C Léa/N préparent/V un/D gâteau/N .", "S:0-2 V:3 CV:4-5:COD"],
  ["Chaque/D matin/N ,/ le/D boulanger/N cuit/V du/D pain/N frais/A .", "CP:0-1 S:2-3 V:4 CV:5-7:COD"],
  ["Elle/P regarde/V les/D étoiles/N avec/Prep ses/D jumelles/N .", "S:0 V:1 CV:2-3:COD CP:4-6"],
  ["Les/D oiseaux/N construisent/V leur/D nid/N en/Prep avril/N .", "S:0-1 V:2 CV:3-4:COD CP:5-6"],
  ["Mon/D grand/A frère/N répare/V son/D vélo/N dans/Prep le/D garage/N .", "S:0-2 V:3 CV:4-5:COD CP:6-8"],
  ["Tu/P parles/V à/Prep ta/D voisine/N .", "S:0 V:1 CV:2-4:COI"],
  ["Le/D soir/N ,/ la/D maîtresse/N corrige/V nos/D cahiers/N .", "CP:0-1 S:2-3 V:4 CV:5-6:COD"],
  ["Nous/P mangeons/V à/Prep la/D cantine/N .", "S:0 V:1 CP:2-4"],
  ["La/D petite/A fille/N caresse/V un/D chien/N noir/A .", "S:0-2 V:3 CV:4-6:COD"],
];
const NATURES = { N: ["Nom", "#2f7d32"], D: ["Déterminant", "#8a6d00"], V: ["Verbe", "#d0342c"], A: ["Adjectif", "#b8457e"], P: ["Pronom", "#2448b8"], Adv: ["Adverbe", "#6a4fb3"], Prep: ["Préposition", "#00838f"], C: ["Conjonction", "#5d6b78"] };
const NAT_NIV = { CP: ["N", "V"], CE1: ["N", "V", "D", "A"], CE2: ["N", "V", "D", "A", "P"], CM1: Object.keys(NATURES), CM2: Object.keys(NATURES) };
const FONCTIONS = { S: ["Sujet", "#2448b8"], V: ["Verbe", "#d0342c"], CV: ["Complément du verbe", "#1f8a4c"], CP: ["Complément de phrase", "#8e44ad"] };
const FCT_NIV = { CP: ["V"], CE1: ["V", "S"], CE2: ["V", "S", "CV", "CP"], CM1: ["V", "S", "CV", "CP"], CM2: ["V", "S", "CV", "CP"] };
const parsePhrase = ([txt, grp]) => {
  const toks = txt.split(" ").map((t) => { const [m, n] = t.split("/"); return { m, n: n || "" }; });
  let w = 0; toks.forEach((t) => { if (t.n) t.w = w++; });
  const groupes = grp.split(" ").map((g) => { const [f, r, sous] = g.split(":"); const [a, b] = r.split("-").map(Number); return { f, a, b: b ?? a, sous }; });
  return { toks, groupes };
};

// Phrases à transformer : [phrase, [[consigne, réponse], …]] ; c2 = CE1-CE2, c3 = CM1-CM2.
const TRANSFOS = {
  c2: [
    ["Le chat dort sur le canapé.", [["Mets à la forme négative.", "Le chat ne dort pas sur le canapé."], ["Remplace « Le chat » par « Les chats ».", "Les chats dorment sur le canapé."], ["Écris la phrase au futur.", "Le chat dormira sur le canapé."]]],
    ["Je mange une pomme.", [["Mets à la forme négative.", "Je ne mange pas de pomme."], ["Remplace « Je » par « Nous ».", "Nous mangeons une pomme."], ["Écris la phrase à l'imparfait.", "Je mangeais une pomme."]]],
    ["Tu joues au ballon dans la cour.", [["Mets à la forme négative.", "Tu ne joues pas au ballon dans la cour."], ["Remplace « Tu » par « Vous ».", "Vous jouez au ballon dans la cour."], ["Écris la phrase au futur.", "Tu joueras au ballon dans la cour."]]],
    ["Nous allons à la piscine.", [["Mets à la forme négative.", "Nous n'allons pas à la piscine."], ["Remplace « Nous » par « Il ».", "Il va à la piscine."], ["Écris la phrase au futur.", "Nous irons à la piscine."]]],
    ["Elle a un vélo rouge.", [["Mets à la forme négative.", "Elle n'a pas de vélo rouge."], ["Remplace « Elle » par « Elles ».", "Elles ont un vélo rouge."], ["Écris la phrase à l'imparfait.", "Elle avait un vélo rouge."]]],
    ["Les enfants sont contents.", [["Mets à la forme négative.", "Les enfants ne sont pas contents."], ["Remplace « Les enfants » par « L'enfant ».", "L'enfant est content."], ["Écris la phrase au futur.", "Les enfants seront contents."]]],
    ["Il fait un dessin.", [["Mets à la forme négative.", "Il ne fait pas de dessin."], ["Remplace « Il » par « Ils ».", "Ils font un dessin."], ["Écris la phrase au futur.", "Il fera un dessin."]]],
    ["Vous chantez une chanson.", [["Mets à la forme négative.", "Vous ne chantez pas de chanson."], ["Remplace « Vous » par « Tu ».", "Tu chantes une chanson."], ["Écris la phrase à l'imparfait.", "Vous chantiez une chanson."]]],
    ["Le chien court dans le jardin.", [["Mets à la forme négative.", "Le chien ne court pas dans le jardin."], ["Remplace « Le chien » par « Les chiens ».", "Les chiens courent dans le jardin."], ["Écris la phrase à l'imparfait.", "Le chien courait dans le jardin."]]],
  ],
  c3: [
    ["Le maître corrige les cahiers.", [["Écris la phrase au passé composé.", "Le maître a corrigé les cahiers."], ["Mets à la forme négative.", "Le maître ne corrige pas les cahiers."], ["Remplace « Le maître » par « Les maîtresses ».", "Les maîtresses corrigent les cahiers."]]],
    ["Nous finissons notre travail.", [["Écris la phrase au passé composé.", "Nous avons fini notre travail."], ["Écris la phrase au futur.", "Nous finirons notre travail."], ["Mets à la forme négative.", "Nous ne finissons pas notre travail."]]],
    ["Elles partent en vacances.", [["Écris la phrase au passé composé.", "Elles sont parties en vacances."], ["Écris la phrase à l'imparfait.", "Elles partaient en vacances."], ["Mets à la forme négative.", "Elles ne partent pas en vacances."]]],
    ["Je prends le bus.", [["Écris la phrase au passé composé.", "J'ai pris le bus."], ["Remplace « Je » par « Ils ».", "Ils prennent le bus."], ["Mets à la forme négative.", "Je ne prends pas le bus."]]],
    ["Tu vois la mer.", [["Écris la phrase au futur.", "Tu verras la mer."], ["Écris la phrase au passé composé.", "Tu as vu la mer."], ["Mets à la forme négative.", "Tu ne vois pas la mer."]]],
    ["Mon frère vient avec nous.", [["Écris la phrase au passé composé.", "Mon frère est venu avec nous."], ["Écris la phrase au futur.", "Mon frère viendra avec nous."], ["Mets à la forme négative.", "Mon frère ne vient pas avec nous."]]],
    ["On fait une expérience.", [["Mets à la forme négative.", "On ne fait pas d'expérience."], ["Écris la phrase au passé composé.", "On a fait une expérience."], ["Remplace « On » par « Nous ».", "Nous faisons une expérience."]]],
    ["Il pleut encore.", [["Mets à la forme négative avec « ne… plus ».", "Il ne pleut plus."], ["Écris la phrase à l'imparfait.", "Il pleuvait encore."]]],
    ["Je mange toujours à la cantine.", [["Mets à la forme négative avec « ne… jamais ».", "Je ne mange jamais à la cantine."], ["Remplace « Je » par « Vous ».", "Vous mangez toujours à la cantine."], ["Écris la phrase au futur.", "Je mangerai toujours à la cantine."]]],
    ["Les élèves écrivent une lettre.", [["Écris la phrase au passé composé.", "Les élèves ont écrit une lettre."], ["Écris la phrase à l'imparfait.", "Les élèves écrivaient une lettre."], ["Remplace « Les élèves » par « Léa ».", "Léa écrit une lettre."]]],
  ],
};

// =====================================================================
// Horloge : manipuler, lire l'heure (QCM), placer les aiguilles, durées.
// Précision par défaut selon le niveau (réglable) ; heures en lettres et en anglais.
// =====================================================================
const p2 = (n) => String(n).padStart(2, "0");
const PREC = { h: [60, "Heures pile"], demi: [30, "Et demie"], quart: [15, "Quarts d'heure"], m5: [5, "5 minutes"], m1: [1, "À la minute"] };
const PREC_NIV = { CP: "h", CE1: "demi", CE2: "m5", CM1: "m1", CM2: "m1" };
const minFr = (m) => m === 1 ? "une" : enLettres(m).replace(/-et-un$/, "-et-une");
const heuresFr = (h) => h === 0 ? "zéro heure" : h === 1 ? "une heure" : enLettres(h).replace(/-et-un$/, "-et-une") + " heures";
// 3 h 45 (12 h) ou 15 h 45 (24 h)
const digHeure = (t, h24) => { const H = Math.floor(t / 60) % 24, m = t % 60; return `${h24 ? H : H % 12 || 12} h ${p2(m)}`; };
const periode = (H) => H === 0 || H === 12 ? "" : H < 12 ? " du matin" : H < 18 ? " de l'après-midi" : " du soir";
// Façon de dire : « quatre heures moins le quart », avec le moment de la journée en mode 24 h.
function heureParlee(t, h24) {
  const H = Math.floor(t / 60) % 24, m = t % 60, moins = m > 30 && m % 5 === 0;
  const h = moins ? (H + 1) % 24 : H, mm = moins ? 60 - m : m, h12 = h % 12;
  const midi = h24 ? h === 12 : false, minuit = h24 ? h === 0 : false;
  let s = minuit ? "minuit" : midi ? "midi" : h12 === 0 ? "douze heures" : h12 === 1 ? "une heure" : enLettres(h12) + " heures";
  if (mm) s += moins ? (mm === 15 ? " moins le quart" : " moins " + minFr(mm)) : mm === 15 ? " et quart" : mm === 30 ? (midi || minuit ? " et demi" : " et demie") : " " + minFr(mm);
  return "Il est " + s + (h24 ? periode(h) : "") + ".";
}
const heureOfficielle = (t) => { const H = Math.floor(t / 60) % 24, m = t % 60; return `Il est ${heuresFr(H)}${m ? " " + minFr(m) : ""}.`; };
const EN_N = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const enN = (n) => n < 20 ? EN_N[n] : ["", "", "twenty", "thirty", "forty", "fifty"][Math.floor(n / 10)] + (n % 10 ? "-" + EN_N[n % 10] : "");
function heureEn(t) {
  const H = Math.floor(t / 60) % 24, m = t % 60, h = H % 12 || 12, nx = (H + 1) % 12 || 12;
  if (m === 0) return `It's ${enN(h)} o'clock.`;
  if (m === 15) return `It's quarter past ${enN(h)}.`;
  if (m === 30) return `It's half past ${enN(h)}.`;
  if (m === 45) return `It's quarter to ${enN(nx)}.`;
  if (m % 5 === 0) return m < 30 ? `It's ${enN(m)} past ${enN(h)}.` : `It's ${enN(60 - m)} to ${enN(nx)}.`;
  return `It's ${enN(h)} ${m < 10 ? "oh " + enN(m) : enN(m)}.`;
}
const momentIcone = (t) => { const H = Math.floor(t / 60) % 24; return H < 12 ? "☀️ Le matin" : H < 18 ? "🌤️ L'après-midi" : "🌙 Le soir"; };
const dureeTxt = (d) => { const h = Math.floor(d / 60), m = d % 60; return h ? `${h} h${m ? ` ${p2(m)} min` : ""}` : `${m} min`; };

function cadranSVG(t, { cls = "", reperes = false } = {}) {
  const ticks = Array.from({ length: 60 }, (_, i) => { const a = i * 6 * Math.PI / 180, r1 = i % 5 ? 96 : 90; return `<line x1="${Math.sin(a) * r1}" y1="${-Math.cos(a) * r1}" x2="${Math.sin(a) * 100}" y2="${-Math.cos(a) * 100}" class="${i % 5 ? "tk" : "tk5"}"/>`; }).join("");
  const nums = Array.from({ length: 12 }, (_, i) => { const a = (i + 1) * 30 * Math.PI / 180; return `<text x="${Math.sin(a) * 76}" y="${-Math.cos(a) * 76}" class="num">${i + 1}</text>`; }).join("");
  const mins = reperes ? Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180; return `<text x="${Math.sin(a) * 117}" y="${-Math.cos(a) * 117}" class="num-min">${p2(i * 5)}</text>`; }).join("") : "";
  return `<svg viewBox="-128 -128 256 256" class="clock ${cls}" role="img" aria-label="Horloge">
    <circle r="104" class="clock-face"/>${ticks}${nums}${mins}
    <line class="hand-h" x1="0" y1="0" x2="0" y2="-50" transform="rotate(${(t % 720) * 0.5})"/>
    <line class="hand-m" x1="0" y1="0" x2="0" y2="-80" transform="rotate(${(t % 60) * 6})"/>
    <circle r="6" class="hub"/></svg>`;
}
const aiguilles = (svg, t) => { svg.querySelector(".hand-h").setAttribute("transform", `rotate(${(t % 720) * 0.5})`); svg.querySelector(".hand-m").setAttribute("transform", `rotate(${(t % 60) * 6})`); };
// Les deux aiguilles se déplacent au doigt ou au stylet : on attrape celle qui est la plus proche.
function aiguillesMobiles(svg, get, set, pas = 1) {
  let prise = null;
  const angle = (e) => { const r = svg.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2); return (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360; };
  const ecart = (a, b) => { const z = Math.abs(a - b) % 360; return Math.min(z, 360 - z); };
  const bouge = (e) => {
    if (!prise) return;
    const a = angle(e), t = get();
    let nt;
    if (prise === "m") {
      const nm = (Math.round(a / 6 / pas) * pas) % 60, old = t % 60;
      let base = t - old;
      if (old > 45 && nm < 15) base += 60; else if (old < 15 && nm > 45) base -= 60;
      nt = base + nm;
    } else {
      const m = t % 60, h = ((Math.round((a - m * 0.5) / 30) % 12) + 12) % 12;
      nt = (t >= 720 ? 720 : 0) + h * 60 + m;
    }
    set(((nt % 1440) + 1440) % 1440);
  };
  svg.onpointerdown = (e) => { const a = angle(e), t = get(); prise = ecart(a, (t % 720) * 0.5) + 8 < ecart(a, (t % 60) * 6) ? "h" : "m"; svg.setPointerCapture(e.pointerId); bouge(e); };
  svg.onpointermove = bouge;
  svg.onpointerup = svg.onpointercancel = () => { prise = null; };
}

// Problèmes de durées : situations de la vie de classe, plages réalistes (minutes depuis minuit).
const SITUATIONS = [
  ["La récréation", 1, [600, 630], [15, 30]], ["Le film", 0, [840, 960], [75, 150]], ["Le match de football", 0, [840, 1020], [90, 120]],
  ["La séance de piscine", 1, [540, 660], [40, 60]], ["Le trajet en car", 0, [480, 570], [20, 150]], ["La cuisson du gâteau", 1, [900, 1020], [25, 50]],
  ["Le spectacle", 0, [1080, 1230], [60, 150]], ["Le pique-nique", 0, [720, 750], [30, 90]], ["La randonnée", 1, [540, 600], [120, 240]],
  ["Le repas à la cantine", 0, [690, 735], [45, 60]], ["La visite du musée", 1, [570, 840], [60, 120]], ["La répétition de la chorale", 1, [810, 900], [30, 60]],
];
function problemeDuree(niv) {
  const pas = niv === "CP" || niv === "CE1" ? 30 : niv === "CM2" ? 1 : 5, r = NIVEAUX_R.indexOf(niv);
  const cap = r <= 2 ? 120 : 240; // CE1-CE2 : jusqu'à 2 h ; CM : jusqu'à 4 h
  const ok = SITUATIONS.filter(([, , , [a, b]]) => Math.floor(Math.min(b, cap) / pas) * pas >= Math.max(pas, a));
  const [quoi, fem, [d0, d1], [a, b0]] = ok[hasard(ok.length)], b = Math.min(b0, cap);
  const arr = (x, p) => Math.round(x / p) * p;
  const debut = arr(entre(d0, d1), pas === 30 ? 30 : pas);
  const duree = Math.max(pas, arr(entre(Math.max(a, pas), b), pas));
  const types = r <= 1 ? ["fin"] : r === 2 ? ["fin", "duree"] : ["fin", "duree", "debut"];
  return { quoi, fem, debut, duree, fin: debut + duree, q: types[hasard(types.length)] };
}
function enonceDuree(p) {
  const il = p.fem ? "elle" : "il", d = (t) => digHeure(t, true);
  if (p.q === "fin") return `${p.quoi} commence à ${d(p.debut)} et dure ${dureeTxt(p.duree)}. À quelle heure se termine-t-${il} ?`;
  if (p.q === "duree") return `${p.quoi} commence à ${d(p.debut)} et se termine à ${d(p.fin)}. Combien de temps dure-t-${il} ?`;
  return `${p.quoi} se termine à ${d(p.fin)}. ${il === "il" ? "Il" : "Elle"} a duré ${dureeTxt(p.duree)}. À quelle heure a-t-${il} commencé ?`;
}
// Frise « par bonds » : début → heure pile → … → fin.
function friseBonds(a, b) {
  const pts = [a], h1 = Math.ceil(a / 60) * 60, hn = Math.floor(b / 60) * 60;
  if (h1 > a && h1 < b) pts.push(h1);
  if (hn > pts[pts.length - 1] && hn < b) pts.push(hn);
  pts.push(b);
  let html = `<span class="fb-t">${digHeure(pts[0], true)}</span>`;
  for (let i = 1; i < pts.length; i++) html += `<span class="fb-j">+ ${dureeTxt(pts[i] - pts[i - 1])}</span><span class="fb-t">${digHeure(pts[i], true)}</span>`;
  return `<div class="frise-bonds">${html}</div>`;
}

export function horloge(el, opts = {}) {
  const CLE = "bagaschool-horloge";
  const cfg = Object.assign({ mode: "manip", h24: false, reperes: false, lettres: true, en: false, prec: {}, niv: "CE1" }, JSON.parse(localStorage.getItem(CLE) || "{}"));
  const sauver = () => localStorage.setItem(CLE, JSON.stringify(cfg));
  const niv = () => opts.niv || cfg.niv;
  const prec = () => cfg.prec[niv()] || PREC_NIV[niv()] || "m5";
  const pas = () => PREC[prec()][0];
  const tirer = () => { const p = pas(), n = cfg.h24 ? 1440 : 720; let t = hasard(n / p) * p; return t; };
  const maintenant = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  // états par mode
  let t = maintenant(), voirDig = true;
  let lire = null, score = { ok: 0, tot: 0 };
  let cible = 0, place = 0, verdict = null;
  let pb = null, voirRep = false;
  const fmt = (x) => digHeure(x, cfg.h24);
  const nouvelleLecture = () => {
    const v = tirer(), m = v % 60, h = Math.floor(v / 60) % 12, demi = v >= 720 ? 720 : 0;
    const cands = [];
    if (m % 5 === 0) cands.push(demi + ((m / 5) % 12) * 60 + (h * 5) % 60); // aiguilles inversées
    cands.push(demi + (((m >= 30 ? h + 1 : h + 11) % 12) * 60) + m); // erreur d'une heure
    if (m % 5 === 0 && m) cands.push(demi + h * 60 + m / 5); // minutes lues sur le chiffre
    if (cfg.h24) cands.push((v + 720) % 1440); // matin / après-midi
    for (let k = 0; k < 20; k++) cands.push(tirer());
    const vus = new Set([fmt(v)]), choix = [v];
    for (const c of cands) { const s = fmt(c); if (!vus.has(s)) { vus.add(s); choix.push(c); } if (choix.length === 4) break; }
    lire = { v, choix: melange(choix), pris: null, voir: false };
  };
  const nouvelleCible = () => { cible = tirer(); place = cible >= 720 ? 720 : 0; verdict = null; };
  const phrases = (x, toujours) => `${cfg.lettres || toujours ? `<p class="clk-phrase">${heureParlee(x, cfg.h24)}</p>${cfg.h24 ? `<p class="muted">${heureOfficielle(x)}</p>` : ""}` : ""}${cfg.en ? `<p class="clk-en">🇬🇧 ${heureEn(x)}</p>` : ""}`;

  const render = () => {
    const pasDrag = pas() >= 5 ? 5 : 1;
    let corps = "";
    if (cfg.mode === "manip") corps = `<div class="clock-wrap">${cadranSVG(t, { reperes: cfg.reperes, cls: "mobile" })}
      <div class="clock-side">
        ${cfg.h24 ? `<p class="clk-moment">${momentIcone(t)}</p>` : ""}
        <div class="clock-digital">${voirDig ? fmt(t) : "? h ??"}</div>
        ${voirDig ? phrases(t) : ""}
        <p class="muted">Fais glisser la grande ou la petite aiguille.</p>
        <div class="pills"><button class="pill" data-a="-60">− 1 h</button><button class="pill" data-a="-5">− 5 min</button><button class="pill" data-a="-1">− 1 min</button><button class="pill" data-a="1">+ 1 min</button><button class="pill" data-a="5">+ 5 min</button><button class="pill" data-a="60">+ 1 h</button></div>
        <div class="pills"><button class="pill" id="ckNow">Heure actuelle</button><button class="pill" id="ckRand">🎲 Au hasard</button><button class="pill" id="ckDig">${voirDig ? "🙈 Masquer l'heure" : "👀 Afficher l'heure"}</button></div>
      </div></div>`;
    if (cfg.mode === "lire") {
      if (!lire) nouvelleLecture();
      const fini = lire.pris != null || lire.voir;
      corps = `<div class="clock-wrap">${cadranSVG(lire.v, { reperes: cfg.reperes })}
        <div class="clock-side">
          ${cfg.h24 ? `<p class="clk-moment">${momentIcone(lire.v)}</p>` : ""}
          <h3 class="clk-q">Quelle heure est-il ?</h3>
          <div class="clk-choix">${lire.choix.map((c, k) => `<button class="clk-c ${fini && c === lire.v ? "good" : ""} ${lire.pris === k && c !== lire.v ? "bad" : ""}" data-choix="${k}" ${fini ? "disabled" : ""}>${fmt(c)}</button>`).join("")}</div>
          ${fini ? `<div class="clk-rep">${lire.pris != null ? (lire.choix[lire.pris] === lire.v ? "<b>✅ Bravo !</b>" : "<b>Pas tout à fait…</b>") : ""}${phrases(lire.v, true)}</div>` : ""}
          <div class="pills">${fini ? "" : `<button class="big-btn soft" id="ckVoir">👀 Réponse</button>`}<button class="big-btn" id="ckAutre">Autre heure ➜</button></div>
          ${score.tot ? `<p class="muted">Bonnes réponses : ${score.ok} / ${score.tot}</p>` : ""}
        </div></div>`;
    }
    if (cfg.mode === "placer") corps = `<div class="clock-wrap">${cadranSVG(place, { reperes: cfg.reperes, cls: "mobile" })}
      <div class="clock-side">
        <p class="muted">Place les aiguilles sur :</p>
        <div class="clock-digital">${fmt(cible)}</div>
        ${cfg.lettres ? `<p class="clk-phrase">${heureParlee(cible, cfg.h24)}</p>` : ""}${cfg.en ? `<p class="clk-en">🇬🇧 ${heureEn(cible)}</p>` : ""}
        ${verdict === true ? `<p class="clk-ok">✅ Bravo, c'est juste !</p>` : verdict === false ? `<p class="clk-ko">Pas encore : ${(place % 60) !== (cible % 60) ? "regarde la grande aiguille (les minutes)." : "regarde la petite aiguille (les heures)."}</p>` : verdict === "sol" ? `<p class="clk-ok">Voilà la solution.</p>` : ""}
        <div class="pills"><button class="big-btn" id="ckVerif">✔ Vérifier</button><button class="big-btn soft" id="ckSol">👀 Solution</button></div>
        <div class="pills"><button class="pill" data-p="-60">− 1 h</button><button class="pill" data-p="-5">− 5 min</button><button class="pill" data-p="5">+ 5 min</button><button class="pill" data-p="60">+ 1 h</button><button class="pill" id="ckCible">Autre heure ➜</button></div>
      </div></div>`;
    if (cfg.mode === "duree") {
      if (!pb) pb = problemeDuree(niv());
      const cache = (k) => !voirRep && pb.q === k;
      corps = `<div class="clk-duree">
        <p class="clk-enonce">${enonceDuree(pb)}</p>
        <div class="clk-deux">
          <div class="clk-une"><b>Début</b>${cache("debut") ? `<div class="clk-mystere">?</div>` : cadranSVG(pb.debut, { cls: "sm", reperes: cfg.reperes })}<span class="clk-d">${cache("debut") ? "? h ??" : digHeure(pb.debut, true)}</span></div>
          <div class="clk-fl">➜<span>${cache("duree") ? "?" : dureeTxt(pb.duree)}</span></div>
          <div class="clk-une"><b>Fin</b>${cache("fin") ? `<div class="clk-mystere">?</div>` : cadranSVG(pb.fin, { cls: "sm", reperes: cfg.reperes })}<span class="clk-d">${cache("fin") ? "? h ??" : digHeure(pb.fin, true)}</span></div>
        </div>
        ${voirRep ? `<div class="clk-rep"><b>Réponse : ${pb.q === "fin" ? digHeure(pb.fin, true) : pb.q === "debut" ? digHeure(pb.debut, true) : dureeTxt(pb.duree)}</b>${friseBonds(pb.debut, pb.fin)}</div>` : ""}
        <div class="pills">${voirRep ? "" : `<button class="big-btn soft" id="ckRepD">👀 Réponse</button>`}<button class="big-btn" id="ckPb">Autre problème ➜</button></div>
      </div>`;
    }
    el.innerHTML = `
      <div class="tool-top wrap">
        <div class="seg">${[["manip", "🖐️ Manipuler"], ["lire", "👀 Lire l'heure"], ["placer", "🎯 Placer les aiguilles"], ["duree", "⏱️ Durées"]].map(([k, v]) => `<button data-mode="${k}" class="${cfg.mode === k ? "on" : ""}">${v}</button>`).join("")}</div>
      </div>
      <div class="tool-top wrap">
        ${opts.niv ? "" : `<div class="seg">${NIVEAUX_R.map((x) => `<button data-niv="${x}" class="${niv() === x ? "on" : ""}">${x}</button>`).join("")}</div>`}
        ${cfg.mode === "duree" ? "" : `<div class="tables">${Object.entries(PREC).map(([k, [, l]]) => `<button class="mini ${prec() === k ? "on" : ""}" data-prec="${k}">${l}</button>`).join("")}</div>
        <button class="pill ${cfg.h24 ? "on" : ""}" id="ck24">${cfg.h24 ? "✓ " : ""}Sur 24 h</button>
        <button class="pill ${cfg.lettres ? "on" : ""}" id="ckLet">${cfg.lettres ? "✓ " : ""}En lettres</button>`}
        <button class="pill ${cfg.reperes ? "on" : ""}" id="ckRep">${cfg.reperes ? "✓ " : ""}Repères minutes</button>
        ${cfg.mode === "duree" ? "" : `<button class="pill ${cfg.en ? "on" : ""}" id="ckEn">${cfg.en ? "✓ " : ""}🇬🇧 English</button>`}
      </div>
      ${corps}`;
    const svg = el.querySelector("svg.mobile");
    if (svg && cfg.mode === "manip") aiguillesMobiles(svg, () => t, (v) => { t = v; aiguilles(svg, t); majTexte(); }, 1);
    if (svg && cfg.mode === "placer") aiguillesMobiles(svg, () => place, (v) => { place = v; verdict = null; aiguilles(svg, place); const f = el.querySelector(".clk-ok,.clk-ko"); if (f) f.remove(); }, pasDrag);
  };
  // Pendant le glissement, on ne met à jour que le texte (pas tout l'outil).
  const majTexte = () => {
    const side = el.querySelector(".clock-side"); if (!side) return;
    const dg = side.querySelector(".clock-digital"); if (dg) dg.textContent = voirDig ? fmt(t) : "? h ??";
    const old = side.querySelectorAll(".clk-phrase,.clk-en,.clock-side > p.muted:not(:last-of-type)");
    const mo = side.querySelector(".clk-moment"); if (mo) mo.textContent = momentIcone(t);
    if (voirDig) { old.forEach((n) => n.remove()); dg.insertAdjacentHTML("afterend", phrases(t)); }
  };
  render();
  el.onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mode) { cfg.mode = b.dataset.mode; sauver(); }
    if (b.dataset.niv) { cfg.niv = b.dataset.niv; sauver(); lire = null; pb = null; nouvelleCible(); voirRep = false; }
    if (b.dataset.prec) { cfg.prec[niv()] = b.dataset.prec; sauver(); lire = null; nouvelleCible(); }
    if (b.id === "ck24") { cfg.h24 = !cfg.h24; sauver(); lire = null; nouvelleCible(); }
    if (b.id === "ckLet") { cfg.lettres = !cfg.lettres; sauver(); }
    if (b.id === "ckRep") { cfg.reperes = !cfg.reperes; sauver(); }
    if (b.id === "ckEn") { cfg.en = !cfg.en; sauver(); }
    if (b.dataset.a) t = ((t + +b.dataset.a) % 1440 + 1440) % 1440;
    if (b.id === "ckNow") t = maintenant();
    if (b.id === "ckRand") t = tirer();
    if (b.id === "ckDig") voirDig = !voirDig;
    if (b.dataset.choix != null && lire.pris == null) { lire.pris = +b.dataset.choix; score.tot++; if (lire.choix[lire.pris] === lire.v) score.ok++; }
    if (b.id === "ckVoir") lire.voir = true;
    if (b.id === "ckAutre") nouvelleLecture();
    if (b.dataset.p) { place = ((place + +b.dataset.p) % 1440 + 1440) % 1440; verdict = null; }
    if (b.id === "ckVerif") verdict = place % 720 === cible % 720;
    if (b.id === "ckSol") { place = cible; verdict = "sol"; }
    if (b.id === "ckCible") nouvelleCible();
    if (b.id === "ckRepD") voirRep = true;
    if (b.id === "ckPb") { pb = problemeDuree(niv()); voirRep = false; }
    render();
  };
  nouvelleCible();
  render();
}

// =====================================================================
// Date du jour : jour, numéro, mois, année, en français et/ou en anglais.
// « À compléter » (par défaut) : quatre cases vides, toutes les étiquettes en dessous ;
// les élèves touchent ou glissent l'étiquette dans sa case, puis on vérifie.
// « Afficher » : la date du jour (toucher une case la cache). L'année est facultative.
// =====================================================================
const JOURS_FR = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const JOURS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ordEn = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
const numFr = (n) => n === 1 ? "1er" : String(n);
const jourIdx = (d) => (d.getDay() + 6) % 7;
function saison(d) {
  const k = (d.getMonth() + 1) * 100 + d.getDate();
  return k < 320 || k >= 1221 ? ["l'hiver", "winter", "❄️"] : k < 621 ? ["le printemps", "spring", "🌷"] : k < 922 ? ["l'été", "summer", "☀️"] : ["l'automne", "autumn", "🍂"];
}
const CASES_DATE = [["jour", "Jour", "Day"], ["num", "Date", "Date"], ["mois", "Mois", "Month"], ["annee", "Année", "Year"]];

export function dateDuJour(el) {
  const CLE = "bagaschool-date";
  const cfg = Object.assign({ langue: "fr", mode: "construire", annee: true }, JSON.parse(localStorage.getItem(CLE) || "{}"));
  const sauver = () => localStorage.setItem(CLE, JSON.stringify(cfg));
  let decal = 0, caches = new Set(), choix = {}, verifie = false, ignorerClic = false;
  const fr = () => cfg.langue !== "en", en = () => cfg.langue !== "fr";
  const cases = () => CASES_DATE.filter(([k]) => cfg.annee || k !== "annee");
  const jourJ = () => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + decal); return d; };
  const valeurs = (d) => ({ jour: jourIdx(d), num: d.getDate(), mois: d.getMonth(), annee: d.getFullYear() });
  const libelle = (k, v) => {
    if (v == null) return ["", ""];
    if (k === "jour") return [JOURS_FR[v], JOURS_EN[v]];
    if (k === "num") return [numFr(v), ordEn(v)];
    if (k === "mois") return [MOIS_FR[v], MOIS_EN[v]];
    return [String(v), String(v)];
  };
  const double = ([f, e]) => cfg.langue === "both" && f !== e ? `${escO(f)}<small>${escO(e)}</small>` : escO(fr() ? f : e);
  const titre = (lf, le) => cfg.langue === "both" && lf !== le ? `${lf} · ${le}` : fr() ? lf : le;
  const phrasesDate = (d) => {
    const hier = new Date(d); hier.setDate(d.getDate() - 1);
    const dem = new Date(d); dem.setDate(d.getDate() + 1);
    const v = valeurs(d), s = saison(d), out = [], an = cfg.annee ? ` ${v.annee}` : "";
    const ajd = decal === 0;
    if (fr()) out.push(`<p class="dt-phrase">${ajd ? "Aujourd'hui, nous sommes" : "Ce jour-là, nous sommes"} <b>${JOURS_FR[v.jour]} ${numFr(v.num)} ${MOIS_FR[v.mois]}${an}</b>.</p>
      <p class="dt-sous">Hier, c'était ${JOURS_FR[jourIdx(hier)]} ${numFr(hier.getDate())} ${MOIS_FR[hier.getMonth()]}. Demain, ce sera ${JOURS_FR[jourIdx(dem)]} ${numFr(dem.getDate())} ${MOIS_FR[dem.getMonth()]}.</p>`);
    if (en()) out.push(`<p class="dt-phrase en">🇬🇧 ${ajd ? "Today is" : "It is"} <b>${JOURS_EN[v.jour]} ${ordEn(v.num)} ${MOIS_EN[v.mois]}${an}</b>.</p>
      <p class="dt-sous en">Yesterday was ${JOURS_EN[jourIdx(hier)]}. Tomorrow will be ${JOURS_EN[jourIdx(dem)]}.</p>`);
    const extras = [`${p2(v.num)}/${p2(v.mois + 1)}${cfg.annee ? "/" + v.annee : ""}`];
    if (fr()) extras.push(`${s[2]} Saison : ${s[0]}`);
    if (en()) extras.push(`${fr() ? "" : s[2] + " "}Season: ${s[1]}`);
    if (fr()) extras.push(`En lettres : le ${v.num === 1 ? "premier" : enLettres(v.num)} ${MOIS_FR[v.mois]}${cfg.annee ? " " + enLettres(v.annee) : ""}`);
    return out.join("") + `<p class="dt-extra">${extras.map(escO).join(" · ")}</p>`;
  };
  // Toutes les étiquettes, rangée par rangée (une rangée par case).
  const banque = (d) => {
    const v = valeurs(d);
    const rangs = {
      jour: JOURS_FR.map((_, i) => [i, libelle("jour", i)]),
      num: Array.from({ length: 31 }, (_, i) => [i + 1, [String(i + 1), String(i + 1)]]),
      mois: MOIS_FR.map((_, i) => [i, libelle("mois", i)]),
      annee: [v.annee - 1, v.annee, v.annee + 1].map((y) => [y, [String(y), String(y)]]),
    };
    return `<div class="dt-banque">${cases().map(([k, lf, le]) => `<div class="dt-rang"><span class="dt-rang-lab">${titre(lf, le)}</span>
      <div class="dt-picker dt-p-${k}">${rangs[k].map(([val, lab]) => `<button class="dt-opt t-${k} ${choix[k] === val ? "on" : ""}" data-k="${k}" data-opt="${val}">${double(lab)}</button>`).join("")}</div></div>`).join("")}</div>`;
  };
  const render = () => {
    const d = jourJ(), v = valeurs(d), construire = cfg.mode === "construire";
    const juste = construire && cases().every(([k]) => choix[k] === v[k]);
    el.innerHTML = `
      <div class="tool-top wrap">
        <div class="seg">${[["fr", "🇫🇷 Français"], ["en", "🇬🇧 English"], ["both", "FR + EN"]].map(([k, l]) => `<button data-lang="${k}" class="${cfg.langue === k ? "on" : ""}">${l}</button>`).join("")}</div>
        <div class="seg">${[["construire", "🧩 À compléter"], ["voir", "👀 Afficher"]].map(([k, l]) => `<button data-dmode="${k}" class="${cfg.mode === k ? "on" : ""}">${l}</button>`).join("")}</div>
        <button class="pill ${cfg.annee ? "on" : ""}" id="dtAn">${cfg.annee ? "✓ " : ""}Avec l'année</button>
        <div class="pills"><button class="pill" data-dec="-1" aria-label="Jour précédent">◀</button><button class="pill ${decal ? "" : "on"}" id="dtAuj">Aujourd'hui</button><button class="pill" data-dec="1" aria-label="Jour suivant">▶</button></div>
      </div>
      <div class="dt-board">
        <div class="dt-tiles n${cases().length}">${cases().map(([k, lf, le]) => {
          const val = construire ? choix[k] : v[k], cache = !construire && caches.has(k);
          const etat = construire && verifie ? (choix[k] == null ? "vide" : choix[k] === v[k] ? "ok" : "ko") : "";
          return `<button class="dt-tile t-${k} ${construire && val == null ? "attente" : ""} ${etat}" data-tile="${k}" aria-label="${titre(lf, le)}"><span class="dt-lab">${titre(lf, le)}</span><span class="dt-val">${cache ? "?" : val == null ? "" : double(libelle(k, val))}</span></button>`;
        }).join("")}</div>
        ${construire ? `<p class="muted center">Touche ou fais glisser une étiquette dans sa case. Touche une case pour la vider.</p>${banque(d)}
          <div class="pills"><button class="big-btn" id="dtVerif">✔ Vérifier</button><button class="big-btn soft" id="dtEff">↺ Tout effacer</button></div>` : `<p class="muted center">Touchez une case pour la cacher ou la montrer.</p>`}
        ${construire && verifie ? (juste ? `<p class="dt-bravo">🎉 Bravo, la date est juste !</p>` : `<p class="dt-encore">${cases().some(([k]) => choix[k] == null) ? "Il manque des étiquettes. " : ""}${cases().some(([k]) => choix[k] != null && choix[k] !== v[k]) ? "Les cases rouges sont à corriger." : ""}</p>`) : ""}
        <div class="dt-phrases">${!construire || juste ? phrasesDate(d) : ""}</div>
        <div class="dt-heure" id="dtH">${p2(new Date().getHours())}:${p2(new Date().getMinutes())}</div>
      </div>`;
  };
  const poser = (k, val) => { choix[k] = val; verifie = false; };
  el.onclick = (e) => {
    if (ignorerClic) { ignorerClic = false; return; }
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.lang) { cfg.langue = b.dataset.lang; sauver(); }
    if (b.dataset.dmode) { cfg.mode = b.dataset.dmode; sauver(); verifie = false; }
    if (b.id === "dtAn") { cfg.annee = !cfg.annee; sauver(); verifie = false; }
    if (b.dataset.dec) { decal += +b.dataset.dec; choix = {}; verifie = false; }
    if (b.id === "dtAuj") { decal = 0; choix = {}; verifie = false; }
    if (b.dataset.tile) { const k = b.dataset.tile; if (cfg.mode === "construire") { delete choix[k]; verifie = false; } else caches.has(k) ? caches.delete(k) : caches.add(k); }
    if (b.dataset.opt != null) poser(b.dataset.k, +b.dataset.opt);
    if (b.id === "dtVerif") verifie = true;
    if (b.id === "dtEff") { choix = {}; verifie = false; }
    render();
  };
  // Glisser une étiquette (doigt, stylet de TBI ou souris) jusqu'à sa case.
  let glisse = null;
  el.onpointerdown = (e) => {
    const b = e.target.closest(".dt-opt"); if (!b) return;
    glisse = { b, x: e.clientX, y: e.clientY, fant: null, id: e.pointerId };
  };
  const bouge = (e) => {
    if (!glisse || e.pointerId !== glisse.id) return;
    const dx = e.clientX - glisse.x, dy = e.clientY - glisse.y;
    if (!glisse.fant && Math.hypot(dx, dy) < 10) return;
    if (!glisse.fant) {
      const r = glisse.b.getBoundingClientRect(), f = glisse.b.cloneNode(true);
      f.classList.add("dt-fantome"); Object.assign(f.style, { width: r.width + "px", height: r.height + "px" });
      document.body.appendChild(f); glisse.fant = f; glisse.dx = glisse.x - r.left; glisse.dy = glisse.y - r.top;
    }
    glisse.fant.style.transform = `translate(${e.clientX - glisse.dx}px, ${e.clientY - glisse.dy}px)`;
    const sous = document.elementFromPoint(e.clientX, e.clientY)?.closest(".dt-tile");
    el.querySelectorAll(".dt-tile.survol").forEach((t) => t !== sous && t.classList.remove("survol"));
    if (sous && sous.dataset.tile === glisse.b.dataset.k) sous.classList.add("survol");
    e.preventDefault();
  };
  const lache = (e) => {
    if (!glisse || e.pointerId !== glisse.id) return;
    const g = glisse; glisse = null;
    if (!g.fant) return; // simple toucher : le clic s'en charge
    g.fant.remove(); ignorerClic = true; setTimeout(() => { ignorerClic = false; }, 0);
    const sous = document.elementFromPoint(e.clientX, e.clientY)?.closest(".dt-tile");
    if (sous && sous.dataset.tile === g.b.dataset.k) poser(g.b.dataset.k, +g.b.dataset.opt);
    render();
  };
  window.addEventListener("pointermove", bouge, { passive: false });
  window.addEventListener("pointerup", lache);
  window.addEventListener("pointercancel", lache);
  render();
  const tm = setInterval(() => { const h = el.querySelector("#dtH"); if (h) h.textContent = `${p2(new Date().getHours())}:${p2(new Date().getMinutes())}`; }, 15000);
  return () => { clearInterval(tm); window.removeEventListener("pointermove", bouge); window.removeEventListener("pointerup", lache); window.removeEventListener("pointercancel", lache); document.querySelectorAll(".dt-fantome").forEach((f) => f.remove()); };
}

// =====================================================================
// Mot du jour : un mot par jour d'école (du lundi au vendredi), par niveau.
// =====================================================================
const REF_MOT = Date.UTC(2026, 8, 1); // rentrée 2026 : premier mot
function joursEcole(d) {
  const t = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const jours = Math.floor((t - REF_MOT) / 864e5), sem = Math.floor(jours / 7), r = ((jours % 7) + 7) % 7;
  const dow0 = new Date(REF_MOT).getUTCDay(); // jour de la semaine de la référence
  let ouvres = 0;
  for (let k = 0; k < r; k++) { const w = (dow0 + k) % 7; if (w !== 0 && w !== 6) ouvres++; }
  return sem * 5 + ouvres;
}
const reMot = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const surligne = (phrase, mot) => {
  const racine = mot.length > 5 ? mot.slice(0, mot.length - 2) : mot;
  try { return escO(phrase).replace(new RegExp(`(\\p{L}*${reMot(escO(racine))}\\p{L}*)`, "iu"), "<mark>$1</mark>"); } catch { return escO(phrase); }
};
function direFr(txt) {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt); u.lang = "fr-FR"; u.rate = 0.85;
  const v = speechSynthesis.getVoices().find((x) => /^fr/i.test(x.lang)); if (v) u.voice = v;
  speechSynthesis.speak(u);
}

export function motDuJour(el, { niv }) {
  const liste = MOTS[niv] || MOTS.CE1, n = liste.length;
  const base = joursEcole(new Date());
  let i = ((base % n) + n) % n, vus = new Set(), syll = niv === "CP" || niv === "CE1";
  const aToi = (m) => niv === "CP" || niv === "CE1" ? `Dessine « ${escO(m.mot)} », puis dis une phrase avec ce mot.` : niv === "CE2" ? `Invente une phrase avec « ${escO(m.mot)} ».` : `Invente une phrase avec « ${escO(m.mot)} », puis cherche-le dans le dictionnaire.`;
  const cartes = (m) => [
    ["def", "Ce que ça veut dire", `<p>${escO(m.def)}</p>`],
    ["ex", "Dans une phrase", `<p>${surligne(m.ex, m.mot)}</p>`],
    m.syn?.length && ["syn", "Synonymes", `<p>${m.syn.map(escO).join(", ")}</p>`],
    m.ctr?.length && ["ctr", "Contraires", `<p>${m.ctr.map(escO).join(", ")}</p>`],
    m.fam?.length && ["fam", "Famille de mots", `<p>${m.fam.map(escO).join(", ")}</p>`],
    ["atoi", "À toi !", `<p>${aToi(m)}</p>`],
  ].filter(Boolean);
  const motHTML = (m) => syll && m.syll ? m.syll.split("-").map((s, k) => `<span class="sy${k % 2}">${escO(s)}</span>`).join("") : escO(m.mot);
  const render = () => {
    const m = liste[i], cs = cartes(m), dec = i - (((base % n) + n) % n);
    const prec = [1, 2, 3, 4, 5].map((k) => (((i - k) % n) + n) % n);
    el.innerHTML = `
      <div class="tool-top wrap center-row">
        <button class="pill" id="mjPrev">◀ Mot précédent</button>
        <button class="pill ${dec ? "" : "on"}" id="mjAuj">📅 Mot du jour</button>
        <button class="pill" id="mjNext">Mot suivant ▶</button>
        <button class="pill" id="mjHas">🎲</button>
        <button class="pill" id="mjDire">🔊 Écouter</button>
        ${m.syll ? `<button class="pill ${syll ? "on" : ""}" id="mjSyl">${syll ? "✓ " : ""}Syllabes</button>` : ""}
        <button class="pill" id="mjTout">${vus.size === cs.length ? "Tout cacher" : "Tout montrer"}</button>
      </div>
      <div class="mdj-tete">
        <div class="mdj-mot">${motHTML(m)}</div>
        <div class="mdj-info"><span class="mdj-nat">${escO(m.nat)}</span>${m.theme ? `<span class="mdj-theme">${escO(m.theme)}</span>` : ""}</div>
      </div>
      <div class="rit-cartes">${cs.map(([k, titre, corps]) => `<button class="rit-carte ${vus.has(k) ? "vu" : ""}" data-mc="${k}" aria-label="${vus.has(k) ? "Cacher" : "Montrer"} : ${titre}"><span class="rit-titre">${titre}</span><span class="rit-corps">${vus.has(k) ? corps : "❓"}</span></button>`).join("")}</div>
      <div class="mdj-revis"><span class="muted">Pour réviser :</span>${prec.map((k) => `<button class="mini" data-mi="${k}">${escO(liste[k].mot)}</button>`).join("")}</div>`;
  };
  el.onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const go = (k) => { i = ((k % n) + n) % n; vus.clear(); };
    if (b.id === "mjPrev") go(i - 1);
    if (b.id === "mjNext") go(i + 1);
    if (b.id === "mjAuj") go(base);
    if (b.id === "mjHas") go(hasard(n));
    if (b.dataset.mi != null) go(+b.dataset.mi);
    if (b.id === "mjSyl") syll = !syll;
    if (b.id === "mjDire") { const m = liste[i]; direFr(`${m.mot}. ${vus.has("ex") ? m.ex : ""}`); return; }
    if (b.dataset.mc) { const k = b.dataset.mc; vus.has(k) ? vus.delete(k) : vus.add(k); }
    if (b.id === "mjTout") { const cs = cartes(liste[i]); vus = vus.size === cs.length ? new Set() : new Set(cs.map(([k]) => k)); }
    render();
  };
  render();
}

// =====================================================================
// Rituels du matin : date, nombre du jour, mot du jour, horloge,
// enquête grammaticale, phrases à transformer.
// =====================================================================
const ONGLETS_R = [["date", "📅 Date"], ["nombre", "🔢 Nombre du jour"], ["mot", "💬 Mot du jour"], ["horloge", "🕒 Horloge"], ["grammaire", "🔍 Enquête grammaticale"], ["transfo", "🔁 Phrases à transformer"]];

export function rituels(el) {
  let niv = localStorage.getItem("bagaschool-rituel-niv") || "CE1";
  if (!NIVEAUX_R.includes(niv)) niv = "CE1";
  let onglet = localStorage.getItem("bagaschool-rituel-onglet") || "date";
  if (!ONGLETS_R.some(([k]) => k === onglet)) onglet = "date";
  let n = 0, vus = new Set(), cacheNb = false, reglerNb = false;
  let off = new Set(JSON.parse(localStorage.getItem(CARTES_NB_OFF) || "[]"));
  let gi = 0, montreF = new Set(), montreN = new Set(), marques = {}, phrasePerso = "";
  let ti = 0, montreT = new Set();
  const tirerNb = () => { const m = MAX_NB[niv]; n = entre(niv === "CP" ? 1 : Math.ceil(m / 20), m); vus.clear(); };
  const ordreG = melange(PHRASES_G.map((_, k) => k));
  const listeT = () => TRANSFOS[["CM1", "CM2"].includes(niv) ? "c3" : "c2"];
  const cartesVisibles = () => cartesNombre(n, niv).filter(([k]) => !off.has(k));
  tirerNb(); ti = hasard(listeT().length);

  el.innerHTML = `<div class="tool-top wrap" id="ritTete"></div><div class="rituel" id="ritCorps"></div>`;
  const tete = el.querySelector("#ritTete"), corps = el.querySelector("#ritCorps");
  let finSous = null;

  const vueNombre = () => {
    const cartes = cartesVisibles();
    return `<div class="tool-top wrap center-row">
        <label class="inline">Nombre <input type="number" id="nb" min="0" max="${MAX_NB[niv]}" value="${n}" class="rit-input"></label>
        <button class="pill" id="hasard">🎲 Au hasard</button><button class="pill" id="toutvoir">${cartes.length && cartes.every(([k]) => vus.has(k)) ? "Tout cacher" : "Tout montrer"}</button>
        <button class="pill ${cacheNb ? "on" : ""}" id="cachenb">${cacheNb ? "Montrer" : "Cacher"} le nombre</button>
        <button class="pill ${reglerNb ? "on" : ""}" id="reglernb">⚙️ Choisir les activités</button></div>
      ${reglerNb ? `<div class="rit-choix"><p class="muted">Touchez une activité pour l'ajouter ou l'enlever (le choix est gardé sur cet appareil). Certaines n'apparaissent qu'à partir d'un niveau.</p>
        <div class="tables">${CARTES_NB.map(([k, l]) => `<button class="mini ${off.has(k) ? "" : "on"}" data-nbk="${k}">${l}</button>`).join("")}</div>
        <div class="pills"><button class="pill" id="nbTous">Tout cocher</button><button class="pill" id="reglernbOk">Fermer</button></div></div>` : ""}
      <div class="rit-nb">${cacheNb ? "?" : fmtNb(n)}</div>
      <div class="rit-cartes">${cartes.map(([k, titre, contenu]) => `<button class="rit-carte ${vus.has(k) ? "vu" : ""}" data-carte="${k}" aria-label="${vus.has(k) ? "Cacher" : "Montrer"} : ${titre}"><span class="rit-titre">${titre}</span><span class="rit-corps">${vus.has(k) ? contenu : "❓"}</span></button>`).join("") || `<p class="muted">Aucune activité choisie pour ce niveau : touchez « Choisir les activités ».</p>`}</div>`;
  };
  const vueGrammaire = () => {
    const perso = phrasePerso.trim();
    const ph = perso ? { toks: perso.split(/\s+/).map((m, w) => ({ m, n: "?", w })), groupes: [] } : parsePhrase(PHRASES_G[ordreG[gi % ordreG.length]]);
    const natOk = NAT_NIV[niv], fctOk = FCT_NIV[niv];
    const mot = (t) => {
      if (!t.n) return `<span class="gw-pt">${escO(t.m)}</span>`;
      const nat = !perso && montreN.has(t.n) && NATURES[t.n];
      return `<span class="gw ${marques[t.w] ? "m" + marques[t.w] : ""}" data-w="${t.w}" ${nat ? `style="--nc:${nat[1]}"` : ""}><span class="gw-m">${escO(t.m)}</span>${nat ? `<span class="gw-tag">${nat[0].toLowerCase()}</span>` : ""}</span>`;
    };
    let html = "", k = 0;
    while (k < ph.toks.length) {
      const t = ph.toks[k], g = t.n && ph.groupes.find((g) => g.a === t.w && montreF.has(g.f));
      if (g) {
        let inner = ""; while (k < ph.toks.length) { const tk = ph.toks[k]; inner += mot(tk) + " "; k++; if (tk.n && tk.w === g.b) break; }
        const [lib, col] = FONCTIONS[g.f];
        html += `<span class="gg" style="--fc:${col}">${inner}<span class="gg-tag">${lib}${g.sous && ["CM1", "CM2"].includes(niv) ? ` (${g.sous})` : ""}</span></span> `;
      } else { html += mot(t) + " "; k++; }
    }
    return `<div class="tool-top wrap center-row">
        ${perso ? "" : `<button class="pill" id="gsuiv">Phrase suivante ›</button>`}
        <div class="seg">${fctOk.map((f) => `<button data-fct="${f}" class="${montreF.has(f) ? "on" : ""}" ${perso ? "disabled" : ""}><span class="dot" style="background:${FONCTIONS[f][1]}"></span>${FONCTIONS[f][0]}</button>`).join("")}</div>
        <div class="seg">${natOk.map((x) => `<button data-nat="${x}" class="${montreN.has(x) ? "on" : ""}" ${perso ? "disabled" : ""}>${NATURES[x][0]}</button>`).join("")}</div>
        <button class="pill" id="gefface">Tout cacher</button></div>
      <div class="rit-phrase rc-board">${html}</div>
      <div class="tool-top wrap center-row"><label class="inline grow">Ou écris ta phrase <input id="gperso" value="${escO(phrasePerso)}" placeholder="Ta phrase (on souligne à la main)"></label>${perso ? `<button class="pill" id="gcorpus">Revenir aux phrases prêtes</button>` : ""}</div>
      <p class="muted center">Touche un mot pour le colorier (rouge, bleu, vert, puis rien). Les boutons montrent la correction.</p>`;
  };
  const vueTransfo = () => {
    const [p, cons] = listeT()[ti % listeT().length];
    return `<div class="tool-top wrap center-row"><button class="pill" id="tsuiv">Phrase suivante ›</button><button class="pill" id="ttout">${montreT.size === cons.length ? "Tout cacher" : "Tout montrer"}</button></div>
      <div class="rit-phrase">${escO(p)}</div>
      <div class="rit-transfos">${cons.map(([c, rep], k) => `<div class="rit-tr"><p class="rit-cons">${escO(c)}</p><button class="rit-rep ${montreT.has(k) ? "vu" : ""}" data-tr="${k}" aria-label="${montreT.has(k) ? "Cacher" : "Montrer"} la réponse : ${escO(c)}">${montreT.has(k) ? escO(rep) : "Montrer la réponse"}</button></div>`).join("")}</div>`;
  };
  const dessinerTete = () => {
    tete.innerHTML = `<div class="seg">${ONGLETS_R.map(([k, v]) => `<button data-ong="${k}" class="${onglet === k ? "on" : ""}">${v}</button>`).join("")}</div>
      <span class="grow"></span>
      ${onglet === "date" ? "" : `<div class="seg">${NIVEAUX_R.map((x) => `<button data-niv="${x}" class="${niv === x ? "on" : ""}">${x}</button>`).join("")}</div>`}`;
  };
  const dessinerClassique = () => { corps.innerHTML = onglet === "nombre" ? vueNombre() : onglet === "grammaire" ? vueGrammaire() : vueTransfo(); };
  const monter = () => {
    if (typeof finSous === "function") finSous();
    finSous = null; corps.onclick = corps.onchange = null; corps.innerHTML = "";
    dessinerTete();
    if (onglet === "date") finSous = dateDuJour(corps);
    else if (onglet === "horloge") finSous = horloge(corps, { niv });
    else if (onglet === "mot") finSous = motDuJour(corps, { niv });
    else { corps.onclick = clicClassique; corps.onchange = changeClassique; dessinerClassique(); }
  };
  tete.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.ong) { onglet = t.dataset.ong; localStorage.setItem("bagaschool-rituel-onglet", onglet); }
    if (t.dataset.niv) { niv = t.dataset.niv; localStorage.setItem("bagaschool-rituel-niv", niv); tirerNb(); montreF.clear(); montreN.clear(); ti = hasard(listeT().length); montreT.clear(); }
    if (t.dataset.ong || t.dataset.niv) monter();
  };
  const clicClassique = (e) => {
    const w = e.target.closest("[data-w]");
    if (w) { const k = +w.dataset.w; marques[k] = ((marques[k] || 0) + 1) % 4; return dessinerClassique(); }
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.carte != null) { const k = t.dataset.carte; vus.has(k) ? vus.delete(k) : vus.add(k); }
    if (t.id === "hasard") tirerNb();
    if (t.id === "toutvoir") { const cs = cartesVisibles(); vus = cs.every(([k]) => vus.has(k)) ? new Set() : new Set(cs.map(([k]) => k)); }
    if (t.id === "cachenb") cacheNb = !cacheNb;
    if (t.id === "reglernb") reglerNb = !reglerNb;
    if (t.id === "reglernbOk") reglerNb = false;
    if (t.dataset.nbk) { const k = t.dataset.nbk; if (off.has(k)) off.delete(k); else if (off.size < CARTES_NB.length - 1) off.add(k); localStorage.setItem(CARTES_NB_OFF, JSON.stringify([...off])); }
    if (t.id === "nbTous") { off.clear(); localStorage.setItem(CARTES_NB_OFF, "[]"); }
    if (t.id === "gsuiv") { gi++; montreF.clear(); montreN.clear(); marques = {}; }
    if (t.dataset.fct) montreF.has(t.dataset.fct) ? montreF.delete(t.dataset.fct) : montreF.add(t.dataset.fct);
    if (t.dataset.nat) montreN.has(t.dataset.nat) ? montreN.delete(t.dataset.nat) : montreN.add(t.dataset.nat);
    if (t.id === "gefface") { montreF.clear(); montreN.clear(); marques = {}; }
    if (t.id === "gcorpus") { phrasePerso = ""; marques = {}; }
    if (t.id === "tsuiv") { ti++; montreT.clear(); }
    if (t.dataset.tr != null) { const k = +t.dataset.tr; montreT.has(k) ? montreT.delete(k) : montreT.add(k); }
    if (t.id === "ttout") { const nc = listeT()[ti % listeT().length][1].length; montreT = montreT.size === nc ? new Set() : new Set(Array.from({ length: nc }, (_, k) => k)); }
    dessinerClassique();
  };
  const changeClassique = (e) => {
    if (e.target.id === "nb") { n = Math.max(0, Math.min(MAX_NB[niv], Math.floor(+e.target.value || 0))); vus.clear(); dessinerClassique(); }
    if (e.target.id === "gperso") { phrasePerso = e.target.value; marques = {}; dessinerClassique(); }
  };
  monter();
  return () => { if (typeof finSous === "function") finSous(); };
}

export { cartesNombre as _cartesNombre };
