// Français : jeux de conjugaison par niveau (CP à CM2).
// Deux outils : « Conjugaison express » (3 jeux en séries de 10) et « Tableau de conjugaison » (étiquettes).
import { segNiveau, surNiveau, niveauJeux } from "./niveau.js";

const hasard = (n) => Math.floor(Math.random() * n);
const melange = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = hasard(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const maj = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// =====================================================================
// PROGRAMME PAR NIVEAU — à relire par l'enseignante.
// Sources : programmes du cycle 2 (2024, en vigueur depuis la rentrée 2025) et du cycle 3 (2025 :
// CM1 depuis la rentrée 2025, CM2 à la rentrée 2026). Ce tableau est une lecture des programmes,
// pas leur texte :
// - CP : le programme demande seulement de « s'initier à l'identification de la relation sujet-verbe ».
//   Pas de temps imposé : on s'en tient au présent d'être, d'avoir et de verbes en -er très courants
//   (c'est un choix, surtout pour le jeu « Qui parle ? »).
// - CE1 : présent d'être, avoir, aller, faire, dire, venir, pouvoir, voir, vouloir, prendre et des
//   verbes en -er (radical et terminaison des verbes du 1er groupe).
// - CE2 : présent, futur, imparfait et passé composé de ces mêmes verbes.
// - CM1 : présent, imparfait, futur et passé composé d'être, avoir, des verbes du 1er et du 2e groupe
//   (comme finir) et de faire, aller, dire, venir, pouvoir, voir, vouloir, prendre.
// - CM2 : en plus, passé simple et plus-que-parfait des mêmes verbes. Le passé simple est travaillé
//   aux 3es personnes (il, elle, ils, elles), comme à l'usage au cours moyen.
// Ni impératif ni conditionnel : les programmes de 2025 ne les citent pas au CM1-CM2.
// « temps » : pour chaque temps, les familles de verbes travaillées. « defaut » : temps cochés au départ.
// Familles : aux = être et avoir · er = verbes en -er · ir = verbes en -ir comme finir · irr = verbes
// irréguliers fréquents.
// =====================================================================
const ER_CP = ["aimer", "jouer", "chanter", "parler", "regarder", "danser"];
const ER_CE1 = [...ER_CP, "ecouter", "marcher", "arriver", "tomber", "donner", "habiter", "travailler"];
const IRR = ["aller", "faire", "dire", "venir", "pouvoir", "voir", "vouloir", "prendre"];
const IR = ["finir", "choisir", "grandir"];
export const PROGRAMME = {
  CP: { verbes: ["etre", "avoir", ...ER_CP], temps: { present: ["aux", "er"] }, defaut: ["present"] },
  CE1: { verbes: ["etre", "avoir", ...ER_CE1, ...IRR], temps: { present: ["aux", "er", "irr"] }, defaut: ["present"] },
  CE2: { verbes: ["etre", "avoir", ...ER_CE1, ...IRR],
    temps: { present: ["aux", "er", "irr"], futur: ["aux", "er", "irr"], imparfait: ["aux", "er", "irr"], pc: ["aux", "er", "irr"] },
    defaut: ["futur", "imparfait", "pc"] },
  CM1: { verbes: ["etre", "avoir", ...ER_CE1, ...IR, ...IRR],
    temps: { present: ["aux", "er", "ir", "irr"], futur: ["aux", "er", "ir", "irr"], imparfait: ["aux", "er", "ir", "irr"], pc: ["aux", "er", "ir", "irr"] },
    defaut: ["present", "imparfait", "pc"] },
  CM2: { verbes: ["etre", "avoir", ...ER_CE1, ...IR, ...IRR],
    temps: { present: ["aux", "er", "ir", "irr"], futur: ["aux", "er", "ir", "irr"], imparfait: ["aux", "er", "ir", "irr"], pc: ["aux", "er", "ir", "irr"], ps: ["aux", "er", "ir", "irr"], pqp: ["aux", "er", "ir", "irr"] },
    defaut: ["pc", "ps", "pqp"] },
};
export const TEMPS = { present: "présent", futur: "futur", imparfait: "imparfait", pc: "passé composé", ps: "passé simple", pqp: "plus-que-parfait" };
export const FAMILLES = { aux: "être et avoir", er: "verbes en -er", ir: "verbes en -ir (finir)", irr: "aller, faire, dire…" };

// =====================================================================
// LES VERBES. Les verbes irréguliers sont écrits en entier (présent, radical du futur, radical de
// l'imparfait, participe passé, passé simple aux 3es personnes) : rien n'est deviné par une règle.
// Les verbes en -er et en -ir (finir) choisis ici sont tous réguliers (pas de -ger, -cer, -eler, -yer…).
// aux: "etre" = passé composé avec l'auxiliaire être (accord du participe passé avec le sujet).
// =====================================================================
const IRREGULIERS = {
  etre: { inf: "être", g: "aux", pr: ["suis", "es", "est", "sommes", "êtes", "sont"], fut: "ser", imp: "ét", pp: "été", ps: ["fut", "furent"] },
  avoir: { inf: "avoir", g: "aux", pr: ["ai", "as", "a", "avons", "avez", "ont"], fut: "aur", imp: "av", pp: "eu", ps: ["eut", "eurent"] },
  aller: { inf: "aller", g: "irr", pr: ["vais", "vas", "va", "allons", "allez", "vont"], fut: "ir", imp: "all", pp: "allé", ps: ["alla", "allèrent"], aux: "etre" },
  faire: { inf: "faire", g: "irr", pr: ["fais", "fais", "fait", "faisons", "faites", "font"], fut: "fer", imp: "fais", pp: "fait", ps: ["fit", "firent"] },
  dire: { inf: "dire", g: "irr", pr: ["dis", "dis", "dit", "disons", "dites", "disent"], fut: "dir", imp: "dis", pp: "dit", ps: ["dit", "dirent"] },
  venir: { inf: "venir", g: "irr", pr: ["viens", "viens", "vient", "venons", "venez", "viennent"], fut: "viendr", imp: "ven", pp: "venu", ps: ["vint", "vinrent"], aux: "etre" },
  pouvoir: { inf: "pouvoir", g: "irr", pr: ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"], fut: "pourr", imp: "pouv", pp: "pu", ps: ["put", "purent"] },
  voir: { inf: "voir", g: "irr", pr: ["vois", "vois", "voit", "voyons", "voyez", "voient"], fut: "verr", imp: "voy", pp: "vu", ps: ["vit", "virent"] },
  vouloir: { inf: "vouloir", g: "irr", pr: ["veux", "veux", "veut", "voulons", "voulez", "veulent"], fut: "voudr", imp: "voul", pp: "voulu", ps: ["voulut", "voulurent"] },
  prendre: { inf: "prendre", g: "irr", pr: ["prends", "prends", "prend", "prenons", "prenez", "prennent"], fut: "prendr", imp: "pren", pp: "pris", ps: ["prit", "prirent"] },
};
const INF_ER = { aimer: "aimer", jouer: "jouer", chanter: "chanter", parler: "parler", regarder: "regarder", danser: "danser", ecouter: "écouter", marcher: "marcher", arriver: "arriver", tomber: "tomber", donner: "donner", habiter: "habiter", travailler: "travailler" };
const AVEC_ETRE = new Set(["arriver", "tomber"]);
const verbeER = (id) => { const inf = INF_ER[id], r = inf.slice(0, -2);
  return { inf, g: "er", rad: r, pr: ["e", "es", "e", "ons", "ez", "ent"].map((t) => r + t), fut: inf, imp: r, pp: r + "é", ps: [r + "a", r + "èrent"], aux: AVEC_ETRE.has(id) ? "etre" : "avoir" }; };
const verbeIR = (id) => { const r = id.slice(0, -2);
  return { inf: id, g: "ir", rad: r, pr: ["is", "is", "it", "issons", "issez", "issent"].map((t) => r + t), fut: id, imp: r + "iss", pp: r + "i", ps: [r + "it", r + "irent"] }; };
export const VERBES = { ...IRREGULIERS };
Object.keys(INF_ER).forEach((id) => { VERBES[id] = verbeER(id); });
IR.forEach((id) => { VERBES[id] = verbeIR(id); });

// Pronoms : 0 je · 1 tu · 2 il/elle/on · 3 nous · 4 vous · 5 ils/elles
export const PI = { je: 0, tu: 1, il: 2, elle: 2, on: 2, nous: 3, vous: 4, ils: 5, elles: 5 };
const FIN_IMP = ["ais", "ais", "ait", "ions", "iez", "aient"], FIN_FUT = ["ai", "as", "a", "ons", "ez", "ont"];
// Accord du participe passé avec être. Je, tu, nous, vous : on ne sait pas si c'est une fille ou un garçon → (e).
const ACCORD = { je: "(e)", tu: "(e)", il: "", on: "", elle: "e", nous: "(e)s", vous: "(e)s", ils: "s", elles: "es" };
const avecEtre = (id, t) => (t === "pc" || t === "pqp") && VERBES[id].aux === "etre";

// La forme conjuguée, sans le pronom. null si elle n'est pas travaillée (passé simple hors 3es personnes).
export function forme(id, t, pr) {
  const v = VERBES[id], i = PI[pr];
  if (t === "present") return v.pr[i];
  if (t === "futur") return v.fut + FIN_FUT[i];
  if (t === "imparfait") return v.imp + FIN_IMP[i];
  if (t === "pc" || t === "pqp") {
    const aux = forme(v.aux === "etre" ? "etre" : "avoir", t === "pc" ? "present" : "imparfait", pr);
    return aux + " " + v.pp + (v.aux === "etre" ? ACCORD[pr] : "");
  }
  if (t === "ps") return i === 2 ? v.ps[0] : i === 5 ? v.ps[1] : null;
  return null;
}
const voyelle = (s) => /^[aeiouyéèêâîôûh]/i.test(s);
export const pronom = (pr, f) => (pr === "je" && voyelle(f) ? "j'" : pr);
export const avecSujet = (pr, f) => { const p = pronom(pr, f); return p.endsWith("'") ? p + f : p + " " + f; };
// Personnes travaillées pour un temps (« on » seulement dans « Qui parle ? »).
export const personnes = (t) => (t === "ps" ? ["il", "elle", "ils", "elles"] : ["je", "tu", "il", "elle", "nous", "vous", "ils", "elles"]);

// Ce qui est travaillé au niveau : temps → verbes.
export const tempsDu = (niv) => Object.keys(PROGRAMME[niv].temps);
export const verbesDu = (niv, t, familles = null) => PROGRAMME[niv].verbes.filter((id) => (PROGRAMME[niv].temps[t] || []).includes(VERBES[id].g) && (!familles || familles.has(VERBES[id].g)));
const famillesDu = (niv) => Object.keys(FAMILLES).filter((g) => PROGRAMME[niv].verbes.some((id) => VERBES[id].g === g));

// Une ligne de conjugaison (« je chante, tu chantes… ») pour l'explication.
const ligneConj = (id, t) => (t === "ps" ? ["il", "ils"] : ["je", "tu", "il", "nous", "vous", "ils"]).map((p) => avecSujet(p, forme(id, t, p))).join(", ");

// =====================================================================
// JEU 1 : LA BONNE FORME. Pièges tirés des vraies confusions.
// =====================================================================
const ACCORD_FAUX = { je: ["s", "es"], tu: ["s", "es"], il: ["e", "s", "es"], elle: ["", "s", "es"], nous: ["", "e"], vous: [], ils: ["", "e", "es"], elles: ["", "e", "s"], on: [] };
const PP_FAUX = { fait: "fais", dit: "dis", pris: "prit", pu: "put", vu: "vus", voulu: "voulut", été: "était", eu: "eut" };
function pieges(id, t, pr) {
  const v = VERBES[id], i = PI[pr], out = [];
  if (t === "present") {
    if (v.g === "er") { if (i === 4) out.push(v.rad + "er", v.rad + "é"); if (i === 5) out.push(v.rad + "es", v.rad + "ont"); if (i === 3) out.push(v.rad + "ont"); if (i <= 2) out.push(v.rad + "ent", v.rad + "et"); }
    if (v.g === "ir") { if (i === 3) out.push(v.rad + "ons"); if (i === 5) out.push(v.rad + "ient", v.rad + "isent"); if (i <= 2) out.push(v.rad + "ie", v.rad + "ient"); if (i === 4) out.push(v.rad + "ir", v.rad + "ez"); }
    if (v.g === "irr") { const base = v.pr[3].slice(0, -3); if (i === 4) out.push(base + "ez"); if (i === 5) out.push(base + "ent"); if (i === 1) out.push(v.pr[2]); }
  }
  // Futur : « nous chanteront », « ils chanterons », « je chanterais »…
  if (t === "futur") { out.push(v.fut + ["ais", "a", "as", "ont", "iez", "ons"][i]);
    if (v.g === "irr" || v.g === "aux") out.push(v.inf.replace(/e$/, "") + FIN_FUT[i]);
    if (v.g === "er") out.push(v.rad + "r" + FIN_FUT[i]); }
  if (t === "imparfait") { if (i === 3) out.push(v.imp + "aions"); if (i === 5) out.push(v.imp + "ais", v.imp + "ait"); if (i <= 2) out.push(v.imp + ["ai", "ait", "ais"][i]); if (i === 4) out.push(v.imp + "ez", v.imp + "aiez"); }
  if (t === "pc" || t === "pqp") {
    const tAux = t === "pc" ? "present" : "imparfait";
    const auxOk = forme(v.aux === "etre" ? "etre" : "avoir", tAux, pr), auxNon = forme(v.aux === "etre" ? "avoir" : "etre", tAux, pr);
    if (v.g === "er") out.push(auxOk + " " + v.rad + "er", auxOk + " " + v.rad + "ez");
    if (v.g === "ir") out.push(auxOk + " " + v.rad + "ir", auxOk + " " + v.rad + "it");
    out.push(auxNon + " " + v.pp);
    // Accords faux, et seulement ceux qui sont faux quel que soit le sujet (« vous êtes allé » peut être juste).
    if (v.aux === "etre") ACCORD_FAUX[pr].forEach((a) => out.push(auxOk + " " + v.pp + a));
    else if (PP_FAUX[v.pp]) out.push(auxOk + " " + PP_FAUX[v.pp]);
  }
  if (t === "ps") {
    if (v.g === "er") out.push(i === 2 ? v.rad + "at" : v.rad + "arent", i === 2 ? v.rad + "as" : v.rad + "airent");
    else out.push(...(i === 2 ? [v.ps[1]] : [v.ps[0], v.ps[0] + "ent"]));
  }
  return out;
}
// Une question « bonne forme » : 1 bonne réponse et des pièges, tous différents.
export function questionForme(id, t, pr, nb = 4, autresTemps = Object.keys(TEMPS)) {
  const bonne = avecSujet(pr, forme(id, t, pr));
  const groupes = [
    personnes(t).map((p) => forme(id, t, p)).filter(Boolean),
    pieges(id, t, pr),
    autresTemps.filter((x) => x !== t).map((x) => forme(id, x, pr)).filter(Boolean),
  ].map((g) => melange(g.map((f) => avecSujet(pr, f))));
  const choix = new Set([bonne]);
  for (let tour = 0; choix.size < nb && tour < 30; tour++) {
    const g = groupes[tour % 3], f = g.shift();
    if (f && !choix.has(f)) choix.add(f);
    if (groupes.every((x) => !x.length)) break;
  }
  return { id, t, pr, bonne, options: melange([...choix]) };
}

// L'explication montrée après une erreur (et sur demande).
export function explication(id, t, pr) {
  const v = VERBES[id], i = PI[pr], l = [];
  if (t === "present") {
    if (v.g === "er") l.push("Au présent, les verbes en -er se terminent par -e, -es, -e, -ons, -ez, -ent.");
    else if (v.g === "ir") l.push("Au présent, les verbes comme finir se terminent par -is, -is, -it, -issons, -issez, -issent.");
    else l.push(`« ${v.inf} » ne suit pas la règle : on l'apprend par cœur.`);
    if (i === 3) l.push(v.pr[3].endsWith("ons") ? "Avec « nous », le verbe se termine par -ons." : "Attention : « nous sommes » se termine par -mes.");
    if (i === 4) l.push(v.pr[4].endsWith("ez") ? "Avec « vous », le verbe se termine par -ez." : `Attention : « vous ${v.pr[4]} » ne se termine pas par -ez (comme vous êtes, vous faites, vous dites).`);
    if (i === 5) l.push(v.pr[5].endsWith("ent") ? "Avec « ils » ou « elles », le verbe se termine par -ent (on ne l'entend pas)." : `Avec « ils » ou « elles », ce verbe se termine par -ont : ils ${v.pr[5]}.`);
    if (i === 1) l.push(v.pr[1].endsWith("x") ? "Avec « tu », ce verbe se termine par -x : tu peux, tu veux." : "Avec « tu », le verbe se termine par -s.");
    if (i === 0 && v.g === "er") l.push("Avec « je », le verbe en -er se termine par -e (sans s).");
  }
  if (t === "futur") {
    l.push("Au futur, les terminaisons sont toujours -ai, -as, -a, -ons, -ez, -ont.");
    if (v.g === "er" || v.g === "ir") l.push(`On garde l'infinitif « ${v.inf} » et on ajoute la terminaison : ${avecSujet("je", forme(id, t, "je"))}.`);
    else l.push(`Le radical de « ${v.inf} » change au futur : ${avecSujet("je", forme(id, t, "je"))}.`);
  }
  if (t === "imparfait") { l.push("À l'imparfait, les terminaisons sont toujours -ais, -ais, -ait, -ions, -iez, -aient.");
    if (v.g === "ir") l.push("Les verbes comme finir gardent -iss- : je finissais."); }
  if (t === "pc" || t === "pqp") {
    l.push(t === "pc" ? "Passé composé = auxiliaire être ou avoir au présent + participe passé." : "Plus-que-parfait = auxiliaire être ou avoir à l'imparfait + participe passé.");
    l.push(v.aux === "etre" ? `« ${v.inf} » se conjugue avec l'auxiliaire être.` : `« ${v.inf} » se conjugue avec l'auxiliaire avoir.`);
    if (v.aux === "etre") l.push("Avec être, le participe passé s'accorde avec le sujet : il est allé, elle est allée, ils sont allés, elles sont allées.");
    if (v.g === "er") l.push("Le participe passé des verbes en -er se termine par -é.");
    if (v.g === "ir") l.push("Le participe passé des verbes comme finir se termine par -i.");
  }
  if (t === "ps") l.push(v.g === "er" ? "Au passé simple, les verbes en -er font -a avec il/elle et -èrent avec ils/elles." : `Au passé simple : ${ligneConj(id, t)}.`);
  if ((v.g === "irr" || v.g === "aux") && t !== "ps" && t !== "pc" && t !== "pqp") l.push(`${maj(v.inf)} au ${TEMPS[t]} : ${ligneConj(id, t)}.`);
  return l;
}

// =====================================================================
// JEU 2 : QUI PARLE ? (trouver le pronom) — JEU 3 : LE BON TEMPS (indicateur de temps).
// Compléments : courts, au même sens à toutes les personnes et à tous les temps.
// =====================================================================
export const COMPL = {
  etre: ["en retard", "dans la cour", "à la piscine"], avoir: ["froid", "un chat", "faim"],
  aimer: ["les fraises", "la musique"], jouer: ["au ballon", "dans la cour"], chanter: ["une chanson", "dans la chorale"],
  parler: ["à la maîtresse", "très fort"], regarder: ["les étoiles", "un dessin animé"], danser: ["sur la musique", "dans le salon"],
  ecouter: ["une histoire", "la radio"], marcher: ["dans la forêt", "jusqu'à l'école"], arriver: ["à l'école", "en retard"],
  tomber: ["dans la neige", "de vélo"], donner: ["du pain aux canards", "un dessin à mamie"], habiter: ["à la campagne", "près de la mer"],
  travailler: ["dans le jardin", "en silence"], finir: ["le puzzle", "les exercices"], choisir: ["un livre", "une couleur"],
  grandir: ["très vite"], aller: ["au marché", "à la piscine"], faire: ["un gâteau", "du vélo"], dire: ["bonjour", "la vérité"],
  venir: ["à la fête", "en bus"], pouvoir: ["nager", "sortir"], voir: ["la mer", "un arc-en-ciel"], vouloir: ["du chocolat", "un vélo"],
  prendre: ["le bus", "un goûter"],
};
const PRON_QUI = ["je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles"];
// Le pronom affiché comme réponse (avec élision et majuscule).
const pronAff = (pr, f) => maj(pronom(pr, f));
export function questionQui(id, t, nb = 4) {
  const prs = PRON_QUI.filter((p) => !(p === "on" && avecEtre(id, t)) && forme(id, t, p));
  const pr = prs[hasard(prs.length)], f = forme(id, t, pr);
  // Tous les pronoms qui vont avec cette forme sont « bons » : on n'en propose qu'un.
  const vont = PRON_QUI.filter((p) => forme(id, t, p) === f && !(p === "on" && avecEtre(id, t)));
  const autres = melange(PRON_QUI.filter((p) => !vont.includes(p) && !(p === "on" && avecEtre(id, t))));
  // Pièges variés : une personne du singulier et une du pluriel si possible.
  const options = melange([pr, ...autres.slice(0, nb - 1)]);
  const c = COMPL[id][hasard(COMPL[id].length)];
  return { id, t, pr, f, c, bonne: pronAff(pr, f), options: options.map((p) => pronAff(p, f)), vont };
}

export const REPERES = {
  present: ["En ce moment,", "Maintenant,", "Actuellement,"],
  futur: ["Demain,", "La semaine prochaine,", "Dans dix ans,", "Plus tard,"],
  pc: ["Hier,", "Hier soir,", "La semaine dernière,", "Avant-hier,"],
  imparfait: ["Autrefois,", "Jadis,", "Autrefois, chaque été,"],
};
const SENS = { present: "parle de maintenant : on utilise le présent.", futur: "parle de l'avenir : on utilise le futur.", pc: "parle d'une action passée et terminée : on utilise le passé composé.", imparfait: "parle d'un passé lointain ou d'une habitude : on utilise l'imparfait." };
const SUJETS = [{ s: "je", p: "je" }, { s: "tu", p: "tu" }, { s: "il", p: "il" }, { s: "elle", p: "elle" }, { s: "Léo", p: "il" }, { s: "ma sœur", p: "elle" }, { s: "nous", p: "nous" }, { s: "vous", p: "vous" }, { s: "les enfants", p: "ils" }, { s: "mes cousines", p: "elles" }];
// Verbes qui sonneraient faux avec « hier » ou « demain » dans ces phrases.
const PAS_BON_TEMPS = new Set(["aimer", "habiter", "grandir", "vouloir"]);
// Temps proposés : on ne met jamais ensemble passé composé et imparfait (les deux iraient souvent),
// ni le présent quand on attend le futur (« Demain, je pars » est correct).
const OPTIONS_TEMPS = { present: ["present", "futur", "pc", "imparfait"], futur: ["futur", "pc", "imparfait"], pc: ["pc", "present", "futur"], imparfait: ["imparfait", "present", "futur"] };
export const tempsBonTemps = (niv) => ["present", "futur", "pc", "imparfait"].filter((t) => PROGRAMME[niv].temps[t]);
export function questionTemps(niv, id, t) {
  const tps = OPTIONS_TEMPS[t].filter((x) => PROGRAMME[niv].temps[x]);
  const sj = SUJETS[hasard(SUJETS.length)], rep = REPERES[t][hasard(REPERES[t].length)];
  const aff = (x) => (sj.p === "je" ? avecSujet("je", forme(id, x, "je")) : forme(id, x, sj.p));
  const c = COMPL[id][hasard(COMPL[id].length)];
  return { id, t, sj, rep, c, bonne: aff(t), options: melange(tps.map(aff)), tps };
}

// =====================================================================
// OUTIL 1 : CONJUGAISON EXPRESS
// =====================================================================
const JEUX = [
  { id: "forme", nom: "La bonne forme", icone: "🎯" },
  { id: "qui", nom: "Qui parle ?", icone: "🗣️" },
  { id: "temps", nom: "Le bon temps", icone: "⏳" },
];

function express(el) {
  let niv = niveauJeux(), jeu = "forme", temps = new Set(), familles = new Set(), serie = [], i = 0, score = 0, rep = null, aide = false, fini = false, err = [];
  const defaut = () => { temps = new Set(PROGRAMME[niv].defaut); familles = new Set(famillesDu(niv)); };
  const tempsDispo = () => (jeu === "temps" ? tempsBonTemps(niv) : tempsDu(niv));
  const nb = () => (niv === "CP" ? 3 : 4);
  // Toutes les questions possibles avec les réglages, puis 10 au hasard (en variant les verbes).
  const nouvelleSerie = () => {
    let cand = [];
    if (jeu === "temps") {
      const ts = tempsBonTemps(niv);
      if (ts.length >= 2) ts.filter((t) => temps.has(t)).forEach((t) => {
        const tps = OPTIONS_TEMPS[t].filter((x) => PROGRAMME[niv].temps[x]);
        if (tps.length < 2) return;
        PROGRAMME[niv].verbes.filter((id) => !PAS_BON_TEMPS.has(id) && familles.has(VERBES[id].g) && tps.every((x) => verbesDu(niv, x).includes(id))).forEach((id) => cand.push({ id, t }));
      });
    } else {
      tempsDu(niv).filter((t) => temps.has(t)).forEach((t) => verbesDu(niv, t, familles).forEach((id) => {
        if (jeu === "qui") cand.push({ id, t }, { id, t }, { id, t }); // le pronom est tiré au sort
        else personnes(t).forEach((pr) => cand.push({ id, t, pr }));
      }));
    }
    cand = melange(cand);
    const pris = [], vus = new Set();
    for (const c of cand) { if (pris.length >= 10) break; const k = c.id + c.t; if (!vus.has(k) || cand.length < 25) { pris.push(c); vus.add(k); } }
    for (const c of cand) { if (pris.length >= 10) break; if (!pris.includes(c)) pris.push(c); }
    serie = pris.map((c) => (jeu === "forme" ? questionForme(c.id, c.t, c.pr, nb(), tempsDu(niv)) : jeu === "qui" ? questionQui(c.id, c.t, nb()) : questionTemps(niv, c.id, c.t)));
    i = 0; score = 0; rep = null; aide = false; fini = false; err = [];
  };
  const Q = () => serie[i];
  const trou = (q) => {
    if (!rep) return `<span class="cj-trou">?</span>`;
    return rep.ok ? `<span class="cj-mot good">${esc(q.bonne)}</span>` : `<span class="cj-mot bad"><s>${esc(rep.choix)}</s> ${esc(q.bonne)}</span>`;
  };
  const phrase = (q) => {
    if (jeu === "forme") return `<p class="cj-phrase">${rep ? "" : `<b class="cj-pronom">${q.pr}</b> `}${trou(q)} <span class="cj-inf">(${esc(VERBES[q.id].inf)})</span></p>`;
    if (jeu === "qui") {
      const colle = rep && pronom(q.pr, q.f).endsWith("'");
      const r = !rep ? `<span class="cj-trou">?</span>` : rep.ok ? `<span class="cj-mot good">${esc(q.bonne)}</span>` : `<span class="cj-mot bad"><s>${esc(rep.choix)}</s> ${esc(q.bonne)}</span>`;
      return `<p class="cj-phrase">${r}${colle ? "" : " "}<b class="cj-verbe">${esc(q.f)}</b> ${esc(q.c)}.</p>`;
    }
    const sujet = q.sj.p === "je" ? "" : esc(q.sj.s) + " ";
    return `<p class="cj-phrase"><b class="cj-repere">${esc(q.rep.replace(/,$/, ""))}</b>, ${sujet}${trou(q)} ${esc(q.c)}. <span class="cj-inf">(${esc(VERBES[q.id].inf)})</span></p>`;
  };
  const consigne = (q) => {
    if (jeu === "forme") return `Conjugue <b>${esc(VERBES[q.id].inf)}</b> au <b>${TEMPS[q.t]}</b>.`;
    if (jeu === "qui") return `Qui fait l'action ? Choisis le bon pronom.`;
    return `Lis le début de la phrase : à quel temps faut-il conjuguer <b>${esc(VERBES[q.id].inf)}</b> ?`;
  };
  const explic = (q) => {
    if (jeu === "forme") return explication(q.id, q.t, q.pr);
    if (jeu === "qui") {
      const v = q.vont, l = [];
      const noms = v.map((p) => (p === "je" && pronom("je", q.f) === "j'" ? "j'" : p));
      l.push(v.length > 1 ? `« ${q.f} » va avec ${noms.map((p) => `« ${p} »`).join(" ou ")}.` : `« ${q.f} » va seulement avec « ${noms[0]} ».`);
      if (avecEtre(q.id, q.t) && /[es]$|\)$/.test(q.f)) l.push("Regarde la fin du participe passé : -e pour une fille, -s pour plusieurs.");
      if (q.f.endsWith("ons")) l.push("La terminaison -ons, c'est « nous ».");
      else if (q.f.endsWith("ez")) l.push("La terminaison -ez, c'est « vous ».");
      else if (/(ent|ont)$/.test(q.f)) l.push("Le verbe est au pluriel : « ils » ou « elles ».");
      return l;
    }
    return [`« ${q.rep.replace(/,$/, "")} » ${SENS[q.t]}`, ...explication(q.id, q.t, q.sj.p).slice(0, 2)];
  };
  const render = () => {
    const td = tempsDispo(), fd = famillesDu(niv);
    let tete = `<div class="tool-top wrap">${segNiveau(niv)}<div class="seg cj-jeux">${JEUX.map((j) => `<button data-jeu="${j.id}" class="${jeu === j.id ? "on" : ""}">${j.icone} ${j.nom}</button>`).join("")}</div></div>`;
    if (jeu === "temps" && td.length < 2) {
      el.innerHTML = tete + `<div class="tool-center"><p class="cj-vide">⏳ Ce jeu compare plusieurs temps : il commence au CE2, quand on travaille le futur, l'imparfait et le passé composé.</p><button class="big-btn" data-niv="CE2">Passer au CE2</button></div>`;
      return;
    }
    tete += `<div class="tool-top wrap cj-filtres">
      ${td.length > 1 ? `<span class="cj-lab">Temps</span>${td.map((t) => `<button class="pill ${temps.has(t) ? "on" : ""}" data-t="${t}">${TEMPS[t]}</button>`).join("")}` : `<span class="cj-lab">Temps : ${TEMPS[td[0]]}</span>`}
      ${fd.length > 1 ? `<span class="cj-lab">Verbes</span>${fd.map((g) => `<button class="pill ${familles.has(g) ? "on" : ""}" data-g="${g}">${FAMILLES[g]}</button>`).join("")}` : ""}
      <button class="pill" id="go">🔀 Nouvelle série</button></div>`;
    if (!serie.length) { el.innerHTML = tete + `<div class="tool-center"><p class="cj-vide">Choisis au moins un temps et une famille de verbes${jeu === "temps" ? " (le jeu compare au moins deux temps)" : ""}.</p></div>`; return; }
    if (fini) {
      el.innerHTML = tete + `<div class="tool-center rc-board cj-zone">
        <div class="cj-score">⭐ ${score} / ${serie.length}</div>
        ${err.length ? `<p class="cj-revoir-t">À revoir :</p><div class="cj-revoir">${err.map((r) => `<p>${r}</p>`).join("")}</div>` : `<div class="banner ok" data-fete>Aucune erreur ! 🎉</div>`}
        <button class="big-btn" id="go">Rejouer</button></div>`;
      return;
    }
    const q = Q();
    el.innerHTML = tete + `
      <div class="tool-center rc-board cj-zone">
        <div class="cj-prog">${serie.map((_, j) => `<span class="${j < i ? "fait" : j === i ? "cour" : ""}"></span>`).join("")}</div>
        <p class="cj-consigne">${consigne(q)}</p>
        <div class="cj-carte">
          ${jeu !== "temps" ? `<span class="cj-tps t-${q.t}">${TEMPS[q.t]}</span>` : ""}
          ${phrase(q)}
        </div>
        ${!rep ? `<div class="cj-options n${q.options.length}">${q.options.map((o) => `<button class="cj-opt" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>`
          : `<div class="banner ${rep.ok ? "ok" : "ko"}">${rep.ok ? ["Bravo !", "Excellent !", "C'est ça !", "Parfait !"][i % 4] : "Oups ! Regarde la bonne réponse."}</div>`}
        <div class="pills rc-keep">${!rep ? `<button class="pill" id="aide">💡 Aide</button>` : ""}${rep ? `<button class="big-btn" id="suiv">${i < serie.length - 1 ? "Suivant ➜" : "Voir le score"}</button>` : ""}</div>
        ${(aide && !rep) || (rep && !rep.ok) ? `<div class="cj-aide">${explic(q).map((x) => `<p>💡 ${esc(x)}</p>`).join("")}</div>` : ""}
        <p class="hint">${i + 1} / ${serie.length} · ⭐ ${score}</p>
      </div>`;
  };
  const resume = (q) => {
    if (jeu === "forme") return `${esc(VERBES[q.id].inf)}, ${TEMPS[q.t]} : <b>${esc(q.bonne)}</b>`;
    if (jeu === "qui") { const p = pronom(q.pr, q.f); return `<b>${esc(maj(p))}</b>${p.endsWith("'") ? "" : " "}${esc(q.f)} ${esc(q.c)}.`; }
    return `${esc(q.rep)} ${q.sj.p === "je" ? "" : esc(q.sj.s) + " "}<b>${esc(q.bonne)}</b> ${esc(q.c)}.`;
  };
  const repondre = (o) => {
    if (rep) return;
    const q = Q(), ok = o === q.bonne;
    rep = { ok, choix: o }; if (ok) score++; else err.push(resume(q));
    render();
  };
  el.onclick = (e) => {
    if (surNiveau(e, (n) => { niv = n; defaut(); if (jeu === "temps") temps = new Set(tempsBonTemps(niv)); nouvelleSerie(); render(); })) return;
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.jeu) { jeu = b.dataset.jeu; if (jeu === "temps") temps = new Set(tempsBonTemps(niv)); else defaut(); nouvelleSerie(); return render(); }
    if (b.dataset.t) { temps.has(b.dataset.t) ? temps.delete(b.dataset.t) : temps.add(b.dataset.t); nouvelleSerie(); return render(); }
    if (b.dataset.g) { familles.has(b.dataset.g) ? familles.delete(b.dataset.g) : familles.add(b.dataset.g); nouvelleSerie(); return render(); }
    if (b.dataset.o != null) return repondre(b.dataset.o);
    if (b.id === "go") nouvelleSerie();
    if (b.id === "aide") aide = !aide;
    if (b.id === "suiv") { aide = false; rep = null; if (i < serie.length - 1) i++; else fini = true; }
    render();
  };
  defaut(); nouvelleSerie(); render();
  return () => { el.onclick = null; };
}

// =====================================================================
// OUTIL 2 : LE TABLEAU DE CONJUGAISON (étiquettes à glisser ou à toucher)
// =====================================================================
// Lignes du tableau. Passé composé / plus-que-parfait avec être : une ligne par pronom (accord visible).
export function lignes(id, t) {
  let prs;
  if (t === "ps") prs = [["il", "il / elle / on"], ["ils", "ils / elles"]];
  else if (avecEtre(id, t)) prs = ["je", "tu", "il", "elle", "nous", "vous", "ils", "elles"].map((p) => [p, p]);
  else prs = [["je", "je"], ["tu", "tu"], ["il", "il / elle / on"], ["nous", "nous"], ["vous", "vous"], ["ils", "ils / elles"]];
  return prs.map(([pr, lab]) => { const f = forme(id, t, pr); return { pr, lab: pr === "je" ? pronom("je", f) : lab, f }; });
}
// Radical | terminaison, seulement quand la coupe est sûre (verbes réguliers, futur et imparfait).
export function coupe(id, t, pr) {
  const v = VERBES[id], i = PI[pr], f = forme(id, t, pr);
  let rad = null;
  if (t === "futur") rad = v.fut;
  else if (t === "imparfait") rad = v.imp;
  else if (t === "present" && (v.g === "er" || v.g === "ir")) rad = v.rad;
  else if (t === "ps" && (v.g === "er" || v.g === "ir")) rad = v.rad;
  if (rad == null || !f.startsWith(rad)) return null;
  return [rad, f.slice(rad.length)];
}
const FINS_INTRUS = ["e", "es", "ent", "s", "t", "x", "ais", "ait", "ons", "ez", "ai", "as", "a", "ont", "é", "er", "is", "it", "ions", "iez", "aient", "èrent", "irent"];

function tableau(el) {
  let niv = niveauJeux(), vid = "chanter", t = "present", mode = "formes", cache = "tout", intrus = false;
  let cases = [], banque = [], sel = null, verif = false, sol = false, finDrag = null;
  const verbes = () => PROGRAMME[niv].verbes.filter((id) => tempsDu(niv).some((x) => verbesDu(niv, x).includes(id)));
  const tempsVerbe = () => tempsDu(niv).filter((x) => verbesDu(niv, x).includes(vid));
  const coupable = () => lignes(vid, t).every((l) => coupe(vid, t, l.pr));
  const preparer = () => {
    if (!verbes().includes(vid)) vid = verbes()[0];
    if (!tempsVerbe().includes(t)) t = tempsVerbe()[0];
    const term = mode === "term" && coupable();
    const ls = lignes(vid, t);
    const n = ls.length, nbCache = cache === "tout" ? n : Math.max(2, Math.ceil(n / 2));
    const caches = new Set(melange(ls.map((_, k) => k)).slice(0, nbCache));
    cases = ls.map((l, k) => { const c = term ? coupe(vid, t, l.pr) : null; return { ...l, rad: c ? c[0] : "", cible: c ? c[1] : l.f, cache: caches.has(k), place: null }; });
    const cibles = cases.filter((c) => c.cache).map((c) => c.cible), toutes = cases.map((c) => c.cible);
    let extra = [];
    if (intrus) {
      // Deux étiquettes fausses partout dans ce tableau : d'autres temps du verbe, ou des pièges d'orthographe.
      const autres = Object.keys(TEMPS).filter((x) => x !== t && verbesDu(niv, x).includes(vid));
      const pool = term ? FINS_INTRUS : [...autres.flatMap((x) => cases.map((c) => forme(vid, x, c.pr))), ...cases.flatMap((c) => pieges(vid, t, c.pr))];
      extra = melange([...new Set(pool.filter((f) => f && !toutes.includes(f)))]).slice(0, 2);
    }
    banque = melange([...cibles, ...extra]).map((txt) => ({ txt, pris: false }));
    sel = null; verif = false; sol = false;
  };
  const place = (e, c) => {
    if (sol || !cases[c] || !cases[c].cache || !banque[e]) return;
    cases.forEach((x) => { if (x.place === e) x.place = null; });
    if (cases[c].place != null) banque[cases[c].place].pris = false;
    cases[c].place = e; banque[e].pris = true; sel = null; verif = false;
  };
  const retirer = (c) => { const x = cases[c]; if (x.place == null || sol) return; banque[x.place].pris = false; x.place = null; verif = false; };
  const render = () => {
    const term = mode === "term" && coupable();
    const tous = cases.filter((c) => c.cache), justes = tous.filter((c) => c.place != null && banque[c.place].txt === c.cible).length;
    el.innerHTML = `
      <div class="tool-top wrap">${segNiveau(niv)}
        <label class="cj-sel">Verbe <select id="tv">${verbes().map((id) => `<option value="${id}" ${id === vid ? "selected" : ""}>${esc(VERBES[id].inf)}</option>`).join("")}</select></label>
        <button class="pill" id="hasard">🎲 Au hasard</button></div>
      <div class="tool-top wrap">
        <div class="seg">${tempsVerbe().map((x) => `<button data-t="${x}" class="${x === t ? "on" : ""}">${TEMPS[x]}</button>`).join("")}</div>
        <div class="seg"><button data-mode="formes" class="${mode === "formes" ? "on" : ""}">Formes entières</button><button data-mode="term" class="${mode === "term" ? "on" : ""}">Terminaisons</button></div>
        <div class="seg"><button data-cache="tout" class="${cache === "tout" ? "on" : ""}">Tout cacher</button><button data-cache="partiel" class="${cache === "partiel" ? "on" : ""}">Quelques cases</button></div>
        <button class="pill ${intrus ? "on" : ""}" id="intrus">🙈 Intrus</button>
      </div>
      ${mode === "term" && !term ? `<p class="hint cj-note">Pour ce verbe à ce temps, la coupe radical / terminaison n'est pas régulière : on travaille avec les formes entières.</p>` : ""}
      <div class="tool-center rc-board cj-tab-zone">
        <div class="cj-tab-titre"><b>${esc(VERBES[vid].inf)}</b><span class="cj-tps t-${t}">${TEMPS[t]}</span></div>
        <div class="cj-tab ${cases.length > 6 ? "huit" : ""}">${[0, 1].map((col) => `<div class="cj-col">${cases.map((c, k) => {
          if ((k < cases.length / 2) !== (col === 0)) return "";
          const txt = sol ? c.cible : c.place != null ? banque[c.place].txt : "";
          const etat = (verif || sol) && c.cache ? (c.place != null && banque[c.place].txt === c.cible ? "good" : sol ? "sol" : "bad") : "";
          const fente = c.cache ? `<button class="cj-case ${txt ? "plein" : ""} ${etat} ${sel != null && !txt ? "attend" : ""}" data-c="${k}">${esc(txt) || "&nbsp;"}</button>` : `<span class="cj-fixe">${esc(c.cible)}</span>`;
          return `<span class="cj-pr">${esc(c.lab)}</span><span class="cj-f">${c.rad ? `<span class="cj-rad">${esc(c.rad)}</span>` : ""}${fente}</span>`;
        }).join("")}</div>`).join("")}</div>
        <div class="cj-banque">${banque.map((b, k) => (b.pris || sol ? "" : `<button class="cj-etq ${sel === k ? "sel" : ""}" data-e="${k}">${esc(b.txt)}</button>`)).join("") || (sol ? "" : `<span class="hint">Toutes les étiquettes sont placées.</span>`)}</div>
        ${verif && !sol ? `<div class="banner ${justes === tous.length ? "ok" : "ko"}">${justes === tous.length ? "Bravo, le tableau est juste ! 🎉" : `${justes} / ${tous.length} : regarde les cases en rouge.`}</div>` : ""}
        <div class="pills rc-keep"><button class="pill" id="verif">✅ Vérifier</button><button class="pill" id="sol">👀 Solution</button><button class="pill" id="eff">↺ Recommencer</button></div>
        <p class="hint">Touche une étiquette puis une case, ou fais-la glisser.</p>
      </div>`;
  };
  // Glisser une étiquette vers une case (souris, doigt, stylet).
  let drag = null, ignoreClic = false;
  const bouge = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.fant && Math.hypot(dx, dy) > 8) {
      const g = drag.src.cloneNode(true); g.classList.add("cj-fantome"); g.classList.remove("sel");
      const r = drag.src.getBoundingClientRect(); drag.ox = drag.x - r.left; drag.oy = drag.y - r.top;
      document.body.appendChild(g); drag.fant = g; drag.src.classList.add("cj-parti");
    }
    if (drag.fant) {
      drag.fant.style.left = e.clientX - drag.ox + "px"; drag.fant.style.top = e.clientY - drag.oy + "px";
      el.querySelectorAll(".cj-case.survol").forEach((x) => x.classList.remove("survol"));
      const s = document.elementFromPoint(e.clientX, e.clientY)?.closest(".cj-case"); if (s && el.contains(s)) s.classList.add("survol");
    }
  };
  const lache = (e) => {
    const d = drag; arreter(); if (!d || !d.fant) return;
    ignoreClic = true; setTimeout(() => { ignoreClic = false; }, 60); // le « click » qui suit le lâcher
    const s = document.elementFromPoint(e.clientX, e.clientY)?.closest(".cj-case");
    if (s && el.contains(s)) place(d.e, +s.dataset.c);
    render();
  };
  const arreter = () => {
    if (drag?.fant) drag.fant.remove();
    drag = null;
    window.removeEventListener("pointermove", bouge); window.removeEventListener("pointerup", lache); window.removeEventListener("pointercancel", arreter);
  };
  finDrag = arreter;
  const appui = (e) => {
    const b = e.target.closest(".cj-etq"); if (!b || sol) return;
    drag = { e: +b.dataset.e, x: e.clientX, y: e.clientY, src: b, fant: null };
    window.addEventListener("pointermove", bouge); window.addEventListener("pointerup", lache); window.addEventListener("pointercancel", arreter);
  };
  el.addEventListener("pointerdown", appui);
  el.onchange = (e) => { if (e.target.id === "tv") { vid = e.target.value; preparer(); render(); } };
  el.onclick = (e) => {
    if (ignoreClic) { ignoreClic = false; return; }
    if (surNiveau(e, (n) => { niv = n; preparer(); render(); })) return;
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.e != null) { sel = sel === +b.dataset.e ? null : +b.dataset.e; return render(); }
    if (b.dataset.c != null) { const c = +b.dataset.c; if (sel != null) place(sel, c); else retirer(c); return render(); }
    if (b.dataset.t) { t = b.dataset.t; preparer(); }
    if (b.dataset.mode) { mode = b.dataset.mode; preparer(); }
    if (b.dataset.cache) { cache = b.dataset.cache; preparer(); }
    if (b.id === "intrus") { intrus = !intrus; preparer(); }
    if (b.id === "hasard") { const vs = verbes().filter((x) => x !== vid); vid = vs[hasard(vs.length)]; const ts = tempsVerbe(); t = ts[hasard(ts.length)]; preparer(); }
    if (b.id === "verif") verif = true;
    if (b.id === "sol") { sol = true; sel = null; }
    if (b.id === "eff") preparer();
    render();
  };
  if (niv === "CP") vid = "chanter";
  preparer(); render();
  return () => { finDrag?.(); el.removeEventListener("pointerdown", appui); el.onclick = null; el.onchange = null; };
}

export const CONJUGAISON = [
  { id: "conjugaison", nom: "Conjugaison express", icone: "🎯", couleur: "#cfe8ff", desc: "La bonne forme, Qui parle ?, Le bon temps : séries de 10 par niveau", mount: express },
  { id: "conj-tableau", nom: "Tableau de conjugaison", icone: "📋", couleur: "#e4dcff", desc: "Compléter le tableau avec des étiquettes : formes ou terminaisons", mount: tableau },
];
