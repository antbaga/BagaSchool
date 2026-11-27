// Histoire : frises chronologiques.
// 1. La grande frise : les 5 périodes (explorer, placer les périodes et leurs bornes, placer des dates).
// 2. Frise d'une période : frise graduée, cartes-repères par catégorie (explorer, placer les dates).
// 3. Remettre dans l'ordre : classer des cartes sans dates.
// Données : js/data/decouvrir/histoire-reperes.js (programmes 2026 + repères classiques « hors programme »).
import { NIVEAUX, esc, shuffle, niveauxHTML, niveauMemo, bravo, dragEtiquettes, clicApresDrag } from "./kit.js";
import { PERIODES, BORNES, CATEGORIES as CAT, REPERES, FRISES } from "../data/decouvrir/histoire-reperes.js";

const NI = (n) => NIVEAUX.indexOf(n);
const PAR_ID = Object.fromEntries(REPERES.map((r) => [r.id, r]));
const BASTILLE = PAR_ID.bastille.v;
const perDe = (v) => (v < -3000 ? 0 : v < 476 ? 1 : v < 1492 ? 2 : v < BASTILLE ? 3 : 4);
const en1789 = (r) => !r.b && r.v >= 1789 && r.v < 1790; // repères de l'année 1789 (frise dédiée)
const dispo = (niv, hp) => REPERES.filter((r) => NI(r.n) <= NI(niv) && (hp || !r.hp));
const nb = (n) => (Math.abs(n) >= 10000 ? Math.round(n).toLocaleString("fr-FR") : String(Math.round(n)));
const fmtAn = (y) => (y < 0 ? `${nb(-y)} av. J.-C.` : y === 0 ? "an 1" : nb(y));
const ROM = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
const romain = (n) => ROM.reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, "");
const siecle = (k) => `${romain(k)}<sup>${k === 1 ? "er" : "e"}</sup> s.`;
const MOIS = ["janv.", "févr.", "mars", "avril", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const catStyle = (c) => `--cc:${CAT[c].coul};--cf:${CAT[c].fonce}`;
const progTag = (r) => `<span class="dk-tag ${r.hp ? "hi-hp" : ""}">${r.hp === "6e" ? "Programme de 6e" : r.hp ? "Hors programme" : "Programme 2026"}</span>`;
const SOURCE = `Repères : programmes d'histoire 2026 (cycles 2 et 3, BO n°22 du 28 mai 2026). Les repères « hors programme » sont des dates classiques ajoutées pour enrichir la frise.`;

// Carte-repère (bouton). opts : date (afficher la date), cls, style, attrs.
function carteHTML(r, { date = true, cls = "", style = "", attrs = "" } = {}) {
  return `<button class="hi-carte ${cls}" ${attrs} style="${catStyle(r.c)};${style}" title="${esc(CAT[r.c].un)}"><span class="hi-ico" aria-hidden="true">${CAT[r.c].ico}</span><span class="hi-txt">${date ? `<b>${esc(r.d)}</b> ` : ""}${esc(r.t)}</span></button>`;
}
function ficheHTML(r) {
  return `<div class="hi-fiche" style="${catStyle(r.c)}"><div class="hi-fiche-top"><span class="hi-fiche-ico">${CAT[r.c].ico}</span><div><div class="hi-fiche-date">${esc(r.d)}</div><h3>${esc(r.t)}</h3></div></div>
    <p>${esc(r.x)}</p><p class="hi-tags"><span class="dk-tag hi-tcat">${esc(CAT[r.c].un)}</span>${progTag(r)}<span class="dk-tag hi-tper">${PERIODES[perDe(r.v)].nom}</span></p></div>`;
}
const boutonsHTML = (nouveau = "↺ Recommencer") => `<div class="tool-top hi-actions"><button class="big-btn" data-act="verifier">✔ Vérifier</button><button class="big-btn soft" data-act="solution">💡 Solution</button><button class="big-btn soft" data-act="nouveau">${nouveau}</button></div>`;
const hpHTML = (hp) => `<label class="check hi-hpbox"><input type="checkbox" id="hp" ${hp ? "checked" : ""}> Repères hors programme</label>`;

// Suivi du glisser au bord d'un conteneur défilant : fait défiler pendant qu'on transporte une carte.
function autoDefil(sc) {
  const mv = (e) => {
    if (!document.querySelector(".dk-ghost")) return;
    const r = sc.getBoundingClientRect();
    if (e.clientY < r.top - 40 || e.clientY > r.bottom + 40) return;
    if (e.clientX < r.left + 50) sc.scrollLeft -= 16; else if (e.clientX > r.right - 50) sc.scrollLeft += 16;
  };
  window.addEventListener("pointermove", mv);
  return () => window.removeEventListener("pointermove", mv);
}

// =====================================================================
// 1. La grande frise
// =====================================================================
const POIDS = [1.4, 1.2, 1.15, 1.05, 1.25]; // largeurs « lisibles » (non proportionnelles)
const cumul = (w) => { const t = w.reduce((a, b) => a + b, 0); let s = 0; return w.map((x) => (s += x) / t * 100); };
const DUREES = () => ["environ 3 millions d'années", "environ 3 500 ans", "environ 1 000 ans", "presque 300 ans", `${new Date().getFullYear() - 1789} ans, et elle continue`];

function grandeFrise(el) {
  const NIVS = ["CE1", "CE2", "CM1", "CM2"];
  const niv = niveauMemo("hist-grande-frise", NIVS, "CE1");
  const NCARTES = { CE1: 5, CE2: 7, CM1: 8, CM2: 10 };
  let mode = "explorer", echelle = "lisible", selP = null, hp = true, sel = null;
  let poses = {}, etat = {}, ordreLab = [], msg = "";   // placer les périodes
  let cartes = [], ou = {}, ok = {}, verifie = false;   // placer les dates
  const LABS = Object.fromEntries([...PERIODES.map((p, i) => ["n" + i, p.nom]), ...BORNES.map((b, j) => ["b" + j, b])]);
  const cum = cumul(POIDS);

  el.innerHTML = `
    <div class="tool-top wrap">
      <div class="seg" id="modes"><button data-mode="explorer" class="on">🔎 Explorer</button><button data-mode="periodes">🧩 Placer les périodes</button><button data-mode="dates">📌 Placer les dates</button></div>
      <span id="niv"></span>
    </div>
    <div class="tool-top wrap" id="opts"></div>
    <div class="hi-zone rc-board" id="zone"></div>
    <p class="dk-source">${SOURCE}</p>`;
  const zone = el.querySelector("#zone");

  const resetPeriodes = () => { poses = {}; etat = {}; ordreLab = shuffle(Object.keys(LABS)); msg = ""; sel = null; };
  const distribuer = () => {
    const pool = dispo(niv.get(), hp).filter((r) => !r.b && !en1789(r));
    const groupes = PERIODES.map((_, i) => shuffle(pool.filter((r) => perDe(r.v) === i)));
    const ordreP = shuffle([0, 1, 2, 3, 4]); const pris = [];
    for (let tour = 0; pris.length < NCARTES[niv.get()] && groupes.some((g) => g.length); tour++)
      for (const i of ordreP) { if (groupes[i].length && pris.length < NCARTES[niv.get()]) pris.push(groupes[i].pop()); }
    cartes = shuffle(pris.map((r) => r.id)); ou = {}; ok = {}; verifie = false; msg = ""; sel = null;
  };

  const opts = () => {
    const o = el.querySelector("#opts");
    if (mode === "explorer") o.innerHTML = `<div class="seg"><button data-ech="lisible" class="${echelle === "lisible" ? "on" : ""}">📏 Frise lisible</button><button data-ech="echelle" class="${echelle === "echelle" ? "on" : ""}">📐 À l'échelle</button></div>`;
    else if (mode === "dates") o.innerHTML = hpHTML(hp);
    else o.innerHTML = "";
    el.querySelector("#niv").innerHTML = niveauxHTML(NIVS, niv.get());
  };

  const bornesHTML = (slots) => `<div class="hi-gbornes">
      <span class="hi-gb hi-gb0">il y a environ 3 millions d'années</span>
      ${BORNES.map((b, j) => `<span class="hi-gb" style="left:${cum[j]}%">${slots ? slotHTML("sb" + j, true) : `<b>${b}</b>`}</span>`).join("")}
      <span class="hi-gb hi-gbn">aujourd'hui</span></div>`;
  const labHTML = (id) => {
    const s = Object.keys(poses).find((k) => poses[k] === id);
    return `<button class="dk-etq hi-lab ${id[0] === "b" ? "hi-labb" : ""} ${sel === id ? "on" : ""} ${s ? etat[s] || "" : ""}" data-etq="${id}">${esc(LABS[id])}</button>`;
  };
  const slotHTML = (s, borne) => `<span class="hi-slot ${borne ? "hi-slotb" : ""} ${etat[s] || ""}" ${borne ? `data-cible="${s}"` : ""}>${poses[s] ? labHTML(poses[s]) : "?"}</span>`;

  const infoPeriode = () => {
    if (selP == null) return `<div class="hi-fiche vide"><h3>La grande frise de l'histoire</h3><p>Touche une période pour découvrir ce qui marque son début et sa fin, et quelques grands repères.</p>
      ${echelle === "lisible" ? `<p class="hi-attention">⚠️ Cette frise n'est <b>pas à l'échelle</b> : chaque période a une largeur facile à lire, mais elles n'ont pas du tout la même durée. Touche « À l'échelle » pour comparer.</p>` : `<p class="hi-attention">📐 À l'échelle, la Préhistoire occupe presque toute la frise : si la frise mesurait 10 mètres, tout ce qui vient après (de l'invention de l'écriture à aujourd'hui) tiendrait dans les <b>1,7 derniers centimètres</b> !</p>`}</div>`;
    const p = PERIODES[selP];
    const reps = dispo(niv.get(), hp).filter((r) => perDe(r.v) === selP && !r.b && !en1789(r));
    const choix = [...reps.filter((r) => !r.hp), ...reps.filter((r) => r.hp)].slice(0, niv.get() === "CE1" ? 3 : 5).sort((a, b) => a.v - b.v);
    return `<div class="hi-fiche hi-fper" style="--pc:${p.coul};--pf:${p.fonce}"><h3>${p.emo} ${p.nom}</h3>
      <dl class="ec-facts"><dt>Début</dt><dd>${p.deb}</dd><dt>Fin</dt><dd>${p.fin}</dd><dt>Durée</dt><dd>${DUREES()[selP]}</dd></dl>
      <p>${p.txt}</p>
      ${choix.length ? `<h4>Quelques repères</h4><ul class="hi-liste">${choix.map((r) => `<li style="${catStyle(r.c)}"><span>${CAT[r.c].ico}</span><b>${esc(r.d)}</b> ${esc(r.t)}${r.hp ? ` <small class="muted">(hors programme)</small>` : ""}</li>`).join("")}</ul>` : ""}</div>`;
  };

  const zoneExplorer = () => {
    if (echelle === "lisible") {
      return `<div class="hi-gscroll"><div class="hi-gf"><div class="hi-gbar">${PERIODES.map((p, i) => `<button class="hi-gper ${selP === i ? "on" : ""}" data-p="${i}" style="flex:${POIDS[i]} 1 0;--pc:${p.coul};--pf:${p.fonce}"><span class="hi-gemo">${p.emo}</span><b>${p.nom}</b><small>${DUREES()[i]}</small></button>`).join("")}<span class="hi-gfin"></span></div>${bornesHTML(false)}</div></div>
        <p class="hi-note">📏 Frise non proportionnelle : les périodes n'ont pas la même durée.</p>${infoPeriode()}`;
    }
    const ans = [2997000, 3476, 1016, 297, new Date().getFullYear() - 1789];
    const recent = ans.slice(1).reduce((a, b) => a + b, 0);
    const cl = cumul(ans.slice(1));
    const P0 = PERIODES[0];
    return `<div class="hi-gscroll"><div class="hi-gf">
        <div class="hi-gbar"><button class="hi-gper ${selP === 0 ? "on" : ""}" data-p="0" style="flex:${ans[0]} 1 0;--pc:${P0.coul};--pf:${P0.fonce}"><span class="hi-gemo">${P0.emo}</span><b>Préhistoire</b><small>environ 3 millions d'années</small></button><span class="hi-reste" style="flex:${recent} 1 0"></span></div>
        <div class="hi-gbornes"><span class="hi-gb hi-gb0">il y a environ 3 millions d'années</span><span class="hi-gb hi-gbn hi-fleche">▲ tout le reste est ici !</span></div>
        <div class="hi-loupe-titre">🔍 Agrandissement des 5 000 dernières années (environ 600 fois plus grand)</div>
        <div class="hi-gbar hi-loupe">${PERIODES.slice(1).map((p, k) => `<button class="hi-gper ${selP === k + 1 ? "on" : ""}" data-p="${k + 1}" style="flex:${ans[k + 1]} 1 0;--pc:${p.coul};--pf:${p.fonce}"><span class="hi-gemo">${p.emo}</span>${ans[k + 1] / recent > 0.12 ? `<b>${p.nom}</b>` : ""}</button>`).join("")}</div>
        <div class="hi-gbornes"><span class="hi-gb hi-gb0 haut"><b>3000 av. J.-C.</b></span>${BORNES.slice(1).map((b, j) => `<span class="hi-gb ${j === 2 ? "bas" : ""}" style="left:${cl[j]}%"><b>${b}</b></span>`).join("")}<span class="hi-gb hi-gbn loin">aujourd'hui</span></div>
        <div class="hi-legende">${PERIODES.slice(1).map((p, k) => `<button data-p="${k + 1}" style="--pc:${p.coul};--pf:${p.fonce}"><i></i>${p.nom}</button>`).join("")}</div>
      </div></div>
      <p class="hi-note">📐 Frise à l'échelle : la longueur de chaque période correspond à sa durée.</p>${infoPeriode()}`;
  };

  const zonePeriodes = () => `<p class="hi-consigne">Glisse les noms des périodes et les dates qui les séparent à leur place (ou touche une étiquette, puis sa place).</p>
    <div class="hi-gscroll"><div class="hi-gf"><div class="hi-gbar">${PERIODES.map((p, i) => `<div class="hi-gper hi-cible ${etat["sn" + i] === "good" ? "" : "gris"}" data-cible="sn${i}" style="flex:${POIDS[i]} 1 0;--pc:${p.coul};--pf:${p.fonce}">${etat["sn" + i] === "good" ? `<span class="hi-gemo">${p.emo}</span>` : ""}${slotHTML("sn" + i)}</div>`).join("")}</div>${bornesHTML(true)}</div></div>
    <div class="dk-banque hi-banque" data-cible="banque">${ordreLab.filter((id) => !Object.values(poses).includes(id)).map(labHTML).join("") || `<span class="muted">Toutes les étiquettes sont placées.</span>`}</div>
    ${boutonsHTML()}<div class="hi-msg">${msg}</div>`;

  const zoneDates = () => `<p class="hi-consigne">Dans quelle période ? Glisse chaque carte sur la bonne période (ou touche une carte, puis la période).</p>
    <div class="hi-gscroll"><div class="hi-gf"><div class="hi-gbar hi-gbar-dates">${PERIODES.map((p, i) => `<div class="hi-gper hi-cible" data-cible="p${i}" style="flex:1 1 0;--pc:${p.coul};--pf:${p.fonce}"><b>${p.emo} ${p.nom}</b><div class="hi-poses">${cartes.filter((id) => ou[id] === i).map((id) => carteHTML(PAR_ID[id], { cls: `hi-mini ${sel === id ? "on" : ""} ${ok[id] ?? ""}`, attrs: `data-etq="${id}"` })).join("")}</div></div>`).join("")}</div>
    <div class="hi-gbornes">${BORNES.map((b, j) => `<span class="hi-gb" style="left:${(j + 1) * 20}%"><b>${b}</b></span>`).join("")}</div></div></div>
    <div class="dk-banque hi-banque" data-cible="banque">${cartes.filter((id) => ou[id] == null).map((id) => carteHTML(PAR_ID[id], { cls: sel === id ? "on" : "", attrs: `data-etq="${id}"` })).join("") || `<span class="muted">Toutes les cartes sont placées.</span>`}</div>
    ${boutonsHTML("🔀 Nouvelles cartes")}<div class="hi-msg">${msg}</div>${verifie && sel ? ficheHTML(PAR_ID[sel]) : ""}`;

  const rendre = () => {
    el.querySelectorAll("#modes [data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
    opts();
    zone.innerHTML = mode === "explorer" ? zoneExplorer() : mode === "periodes" ? zonePeriodes() : zoneDates();
  };

  const poserLab = (lab, s) => {
    for (const k of Object.keys(poses)) if (poses[k] === lab) delete poses[k];
    if (s !== "banque") poses[s] = lab;
    etat = {}; msg = "";
  };
  const poser = (id, cible) => {
    if (mode === "periodes") poserLab(id, cible);
    else if (mode === "dates") { if (cible === "banque") delete ou[id]; else ou[id] = +cible.slice(1); ok = {}; verifie = false; msg = ""; }
    sel = null; rendre();
  };
  const finDrag = dragEtiquettes(el, { aimant: 70, onPose: (etq, c) => poser(etq.dataset.etq, c.dataset.cible) });

  const agir = (a) => {
    if (mode === "periodes") {
      if (a === "nouveau") resetPeriodes();
      if (a === "solution") { poses = {}; Object.keys(LABS).forEach((id) => { poses["s" + id] = id; }); Object.keys(poses).forEach((s) => { etat[s] = "good"; }); msg = "Voici la solution."; }
      if (a === "verifier") {
        let n = 0; etat = {};
        for (const [s, lab] of Object.entries(poses)) { etat[s] = s.slice(1) === lab ? "good" : "bad"; if (etat[s] === "good") n++; }
        const total = Object.keys(LABS).length, poseN = Object.keys(poses).length;
        msg = n === total ? "🎉 Parfait : les 5 périodes et leurs bornes sont bien placées !" : `${n} / ${total} bien placées.${poseN < total ? " Il reste des étiquettes à placer." : ""}${n < poseN ? " Déplace les étiquettes rouges." : ""}`;
        if (n === total) bravo(el);
      }
    } else if (mode === "dates") {
      if (a === "nouveau") distribuer();
      if (a === "solution") { cartes.forEach((id) => { ou[id] = perDe(PAR_ID[id].v); ok[id] = "good"; }); verifie = true; msg = "Voici la solution. Touche une carte pour lire son explication."; }
      if (a === "verifier") {
        let n = 0; ok = {};
        cartes.forEach((id) => { if (ou[id] != null) { ok[id] = ou[id] === perDe(PAR_ID[id].v) ? "good" : "bad"; if (ok[id] === "good") n++; } });
        verifie = true;
        const reste = cartes.filter((id) => ou[id] == null).length;
        msg = n === cartes.length ? "🎉 Bravo, toutes les cartes sont dans la bonne période ! Touche une carte pour lire son explication." : `${n} / ${cartes.length} bien placées.${reste ? ` Il reste ${reste} carte${reste > 1 ? "s" : ""} à placer.` : ""} Touche une carte pour lire son explication.`;
        if (n === cartes.length) bravo(el);
      }
    }
    sel = null; rendre();
  };

  el.onclick = (e) => {
    if (clicApresDrag(el)) return;
    const t = e.target;
    const nv = t.closest("[data-niv]");
    if (nv) { niv.set(nv.dataset.niv); distribuer(); rendre(); return; }
    const m = t.closest("[data-mode]");
    if (m) { mode = m.dataset.mode; sel = null; msg = ""; rendre(); return; }
    const ec = t.closest("[data-ech]");
    if (ec) { echelle = ec.dataset.ech; rendre(); return; }
    const a = t.closest("[data-act]");
    if (a) { agir(a.dataset.act); return; }
    const etq = t.closest("[data-etq]");
    if (etq && mode !== "explorer") { sel = sel === etq.dataset.etq ? null : etq.dataset.etq; rendre(); return; }
    const c = t.closest("[data-cible]");
    if (c && sel && mode !== "explorer") { poser(sel, c.dataset.cible); return; }
    const p = t.closest("[data-p]");
    if (p && mode === "explorer") { selP = selP === +p.dataset.p ? null : +p.dataset.p; rendre(); }
  };
  el.onchange = (e) => { if (e.target.id === "hp") { hp = e.target.checked; distribuer(); rendre(); } };

  resetPeriodes(); distribuer(); rendre();
  return () => { finDrag(); };
}

// =====================================================================
// 2. Frise d'une période
// =====================================================================
const PRINCIPALES = new Set(["prehistoire", "antiquite", "moyen-age", "temps-modernes", "contemporaine"]);
const dansFrise = (r, f) => r.v >= f.a && r.v <= f.b &&
  (!PRINCIPALES.has(f.id) || ((perDe(r.v) === f.per || (r.b && perDe(r.v) === f.per + 1)) && !en1789(r)));

function frisePeriode(el) {
  const NIVS = ["CE2", "CM1", "CM2"];
  const niv = niveauMemo("hist-frise-periode", NIVS, "CE2");
  const DEF = { CE2: "moyen-age", CM1: "temps-modernes", CM2: "contemporaine" };
  const NCARTES = { CE2: 6, CM1: 8, CM2: 10 };
  const PAD = 92, LH = 62, BH = 36;
  let fid = DEF[niv.get()], mode = "explorer", hp = true, cats = new Set(Object.keys(CAT)), z = 1, W = 1000;
  let selR = null, cartes = [], pos = {}, st = {}, sel = null, verifie = false, msg = "";
  const F = () => FRISES.find((f) => f.id === fid);
  const frisesDispo = () => FRISES.filter((f) => NI(f.niv) <= NI(niv.get()));
  const tousItems = () => dispo(niv.get(), hp).filter((r) => dansFrise(r, F()));
  const items = () => tousItems().filter((r) => cats.has(r.c));

  el.innerHTML = `
    <div class="tool-top wrap">
      <div class="seg" id="modes"><button data-mode="explorer" class="on">🔎 Explorer</button><button data-mode="placer">📌 Placer les dates</button></div>
      <span id="niv"></span>${hpHTML(hp)}
    </div>
    <div class="hi-frises" id="frises"></div>
    <div class="hi-cats" id="cats"></div>
    <div class="hi-zone rc-board">
      <div class="hi-fbar"><div class="hi-ftitre" id="titre"></div><div class="hi-zoomb" role="group" aria-label="Zoom"><button data-z="out" aria-label="Dézoomer">−</button><button data-z="in" aria-label="Zoomer">+</button><button data-z="reset" aria-label="Toute la frise">⟲</button></div></div>
      <div class="hi-scroll" id="sc"><div class="hi-track" id="tr" data-cible="frise"></div></div>
      <div id="bas"></div>
    </div>
    <p class="dk-source">${SOURCE} Faire glisser la frise avec le doigt, zoomer en pinçant ou avec + / −.</p>`;
  const sc = el.querySelector("#sc"), tr = el.querySelector("#tr");

  const distribuer = () => { cartes = shuffle(items()).slice(0, NCARTES[niv.get()]).map((r) => r.id); pos = {}; st = {}; sel = null; verifie = false; msg = ""; };
  const X = (y) => { const f = F(); return PAD + ((Math.min(f.b, Math.max(f.a, y)) - f.a) / (f.b - f.a)) * (W - 2 * PAD); };
  const versAn = (clientX) => {
    const f = F(), r = tr.getBoundingClientRect();
    let y = f.a + ((clientX - r.left - PAD) / (W - 2 * PAD)) * (f.b - f.a);
    y = Math.min(f.b, Math.max(f.a, y));
    if (f.mois) return f.a + (Math.min(11, Math.floor((y - f.a) * 12)) + 0.5) / 12; // milieu du mois
    return Math.min(f.b, Math.max(f.a, Math.round(y / f.min) * f.min));
  };
  const juste = (id) => {
    const f = F(), v = PAR_ID[id].v, p = pos[id];
    return f.mois ? Math.floor((v - f.a) * 12) === Math.floor((p - f.a) * 12) : Math.abs(p - v) <= f.tol;
  };

  // ---- graduations, bandes des périodes et des siècles ----
  const axeHTML = () => {
    const f = F(), px = (W - 2 * PAD) / (f.b - f.a);
    let h = `<div class="hi-ligne" style="left:${PAD - 20}px;width:${W - 2 * PAD + 40}px"></div>`;
    if (f.mois) {
      for (let k = 0; k <= 12; k++) h += `<i class="hi-tick maj" style="left:${X(f.a + k / 12)}px"></i>`;
      for (let k = 0; k < 12; k++) h += `<span class="hi-tlab" style="left:${X(f.a + (k + 0.5) / 12)}px">${MOIS[k]}</span>`;
    } else {
      const besoin = f.a <= -10000 ? 150 : f.a < 0 ? 118 : 60;
      let lab = f.maj;
      while (lab * px < besoin && lab < (f.b - f.a) / 2) lab *= 2;
      if (lab === f.maj) for (const d of [2, 5, 10]) { const s = f.maj / d; if (s >= f.min && s * px >= besoin) lab = s; }
      const k0 = Math.ceil(f.a / f.min - 1e-9), k1 = Math.floor(f.b / f.min + 1e-9);
      const pasMin = f.min * px >= 5;
      for (let k = k0; k <= k1; k++) {
        const y = +(k * f.min).toFixed(6);
        const estLab = Math.abs(y / lab - Math.round(y / lab)) < 1e-6, estMaj = Math.abs(y / f.maj - Math.round(y / f.maj)) < 1e-6;
        if (!estLab && !pasMin) continue;
        h += `<i class="hi-tick ${estMaj ? "maj" : estLab ? "mid" : ""}" style="left:${X(y)}px"></i>`;
        if (estLab) h += `<span class="hi-tlab ${estMaj ? "maj" : ""}" style="left:${X(y)}px">${fmtAn(y)}</span>`;
      }
    }
    // bandes des grandes périodes
    let bandes = "";
    PERIODES.forEach((p, i) => {
      const de = i === 4 ? BASTILLE : p.de, a = i === 3 ? BASTILLE : p.a;
      if (a <= f.a || de >= f.b) return;
      const x1 = X(de), x2 = X(a);
      bandes += `<div class="hi-bande" style="left:${x1}px;width:${x2 - x1}px;--pc:${p.coul};--pf:${p.fonce}">${x2 - x1 > 70 ? `<span>${p.nom}</span>` : ""}</div>`;
    });
    let sie = "";
    if (f.siecles) {
      for (let k = Math.floor(f.a / 100); k * 100 < f.b; k++) {
        if (k < 0) continue;
        const x1 = X(k * 100), x2 = X((k + 1) * 100);
        if (x2 - x1 < 2) continue;
        sie += `<div class="hi-siecle ${k % 2 ? "alt" : ""}" style="left:${x1}px;width:${x2 - x1}px">${x2 - x1 > 46 ? `<span>${siecle(k + 1)}</span>` : ""}</div>`;
      }
    }
    return `<div class="hi-axe">${h}</div><div class="hi-bandes">${bandes}</div>${sie ? `<div class="hi-siecles">${sie}</div>` : ""}`;
  };

  // Répartit des éléments en couches pour qu'ils ne se chevauchent pas. Renvoie le nombre de couches.
  const couches = (liste) => {
    const fins = [];
    liste.sort((a, b) => a.g - b.g).forEach((o) => {
      let k = fins.findIndex((fin) => fin + 6 <= o.g);
      if (k < 0) { k = fins.length; fins.push(o.d); } else fins[k] = o.d;
      o.el.style.setProperty("--l", k);
    });
    return fins.length;
  };

  // auto : on agrandit la frise tant qu'elle est trop chargée (trop de couches de cartes).
  const rendreFrise = (auto = false) => {
    if (auto) z = 1;
    for (let essai = 0; essai < 8; essai++) {
      const n = dessinerFrise();
      if (!auto || n <= (sc.clientWidth < 600 ? 4 : 6) || z >= 2.5) break;
      z = Math.min(2.5, z * 1.25);
    }
  };
  const dessinerFrise = () => {
    const f = F();
    W = Math.round(Math.max(sc.clientWidth || 800, 860) * z);
    tr.style.width = W + "px";
    let pins, barres;
    if (mode === "explorer") { const its = items(); pins = its.filter((r) => r.f == null); barres = its.filter((r) => r.f != null); }
    else { pins = cartes.filter((id) => pos[id] != null).map((id) => PAR_ID[id]); barres = pins.filter((r) => r.f != null && st[r.id] === "good"); }
    const up = pins.map((r) => {
      const x = mode === "explorer" ? X(r.v) : X(pos[r.id]);
      const cls = mode === "explorer" ? (selR === r.id ? "on" : "") : `${sel === r.id ? "on" : ""} ${st[r.id] || ""}`;
      return carteHTML(r, { cls: `hi-pin ${cls}`, style: `--x:${x}px`, attrs: mode === "explorer" ? `data-r="${r.id}"` : `data-etq="${r.id}"` });
    }).join("");
    const down = barres.map((r) => {
      const x1 = X(r.v), x2 = X(r.f);
      return `<button class="hi-barre ${selR === r.id ? "on" : ""}" data-r="${r.id}" style="${catStyle(r.c)};--x:${x1}px;--w:${Math.max(8, x2 - x1)}px"><i></i><span>${CAT[r.c].ico} ${esc(r.t)} <small>${esc(r.d)}</small></span></button>`;
    }).join("");
    tr.innerHTML = `<div class="hi-up">${up}${!up && mode === "placer" ? `<div class="hi-vide-txt" style="left:${W / 2}px">Dépose les cartes ici, au-dessus de la bonne date</div>` : ""}</div>${axeHTML()}<div class="hi-down">${down}</div>`;
    const nUp = couches([...tr.querySelectorAll(".hi-up .hi-pin")].map((e) => { const x = parseFloat(e.style.getPropertyValue("--x")), w = e.offsetWidth; return { el: e, g: x - w / 2, d: x + w / 2 }; }));
    const nDown = couches([...tr.querySelectorAll(".hi-barre")].map((e) => {
      const x = parseFloat(e.style.getPropertyValue("--x")), wb = parseFloat(e.style.getPropertyValue("--w")), ws = e.querySelector("span").offsetWidth;
      const dehors = wb < ws + 14, gauche = dehors && x + wb + ws + 16 > W;
      e.classList.toggle("dehors", dehors && !gauche); e.classList.toggle("gauche", gauche);
      return { el: e, g: gauche ? x - ws - 10 : x, d: x + (dehors && !gauche ? wb + ws + 10 : wb) };
    }));
    tr.style.setProperty("--hup", Math.max(nUp, mode === "placer" ? 3 : 1) * LH + 26 + "px");
    tr.style.setProperty("--hdown", nDown ? nDown * BH + 12 + "px" : "8px");
    return nUp;
  };

  const rendreBas = () => {
    const b = el.querySelector("#bas"), f = F();
    if (mode === "explorer") {
      const r = selR && PAR_ID[selR];
      const its = items();
      b.innerHTML = r ? ficheHTML(r) : `<div class="hi-fiche vide"><p><b>Touche une carte ou une barre</b> pour lire son explication. ${its.length} repère${its.length > 1 ? "s" : ""} sur cette frise.</p><p class="muted">${esc(f.prog)}</p>
        ${its.some((x) => x.f != null) ? `<p class="muted">Les barres sous la frise montrent une durée : un règne, une guerre, une vie.</p>` : ""}</div>`;
    } else {
      b.innerHTML = `<p class="hi-consigne">Glisse chaque carte au-dessus de sa date sur la frise (ou touche une carte, puis touche la frise). Pour un règne ou une guerre, place le début.</p>
        <div class="dk-banque hi-banque" data-cible="banque">${cartes.filter((id) => pos[id] == null).map((id) => carteHTML(PAR_ID[id], { cls: sel === id ? "on" : "", attrs: `data-etq="${id}"` })).join("") || `<span class="muted">${cartes.length ? "Toutes les cartes sont sur la frise." : "Aucun repère pour ces choix : change de catégorie ou de frise."}</span>`}</div>
        ${boutonsHTML("🔀 Nouvelles cartes")}<div class="hi-msg">${msg}</div>${verifie && sel ? ficheHTML(PAR_ID[sel]) : ""}`;
    }
  };

  const rendreHaut = () => {
    el.querySelectorAll("#modes [data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
    el.querySelector("#niv").innerHTML = niveauxHTML(NIVS, niv.get());
    el.querySelector("#frises").innerHTML = `<div class="seg wrap hi-fsel">${frisesDispo().map((f) => `<button data-f="${f.id}" class="${f.id === fid ? "on" : ""}">${f.nom}<small>${f.sous}</small></button>`).join("")}</div>`;
    const tous = tousItems();
    const presentes = Object.keys(CAT).filter((c) => tous.some((r) => r.c === c));
    el.querySelector("#cats").innerHTML = `<button class="hi-chip ${presentes.every((c) => cats.has(c)) ? "on" : ""}" data-cat="*">Tout</button>${presentes.map((c) => `<button class="hi-chip ${cats.has(c) ? "on" : ""}" data-cat="${c}" style="${catStyle(c)}">${CAT[c].ico} ${CAT[c].nom} <span>${tous.filter((r) => r.c === c).length}</span></button>`).join("")}`;
    const f = F();
    el.querySelector("#titre").innerHTML = `<b>${f.nom}</b> <span class="muted">${f.sous}</span>`;
  };
  const tout = () => { rendreHaut(); rendreFrise(true); rendreBas(); sc.scrollLeft = 0; };

  // ---- zoom (boutons, pincement, ctrl + molette) et défilement au doigt ----
  const zoomer = (nz, cx) => {
    nz = Math.min(8, Math.max(1, nz)); if (Math.abs(nz - z) < 0.001) return;
    const r = sc.getBoundingClientRect(); const ox = cx == null ? r.width / 2 : cx - r.left;
    const frac = (sc.scrollLeft + ox) / W; z = nz; rendreFrise(); sc.scrollLeft = frac * W - ox;
  };
  const pts = new Map(); let pan = null, pince = null;
  const pdown = (e) => {
    if (e.target.closest("[data-etq]")) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pince = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z }; pan = null; }
    else if (pts.size === 1 && (e.pointerType !== "mouse" || e.button === 0)) pan = { x: e.clientX, s: sc.scrollLeft, bouge: false };
  };
  const pmove = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pince && pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pince.d > 0) zoomer(pince.z * (d / pince.d), (a[0] + b[0]) / 2); e.preventDefault(); }
    else if (pan) { const dx = e.clientX - pan.x; if (Math.abs(dx) > 6) pan.bouge = true; if (pan.bouge) sc.scrollLeft = pan.s - dx; }
  };
  const pup = (e) => {
    pts.delete(e.pointerId);
    if (pan?.bouge) { sc._hiPan = true; setTimeout(() => { sc._hiPan = false; }, 0); }
    if (pts.size < 2) pince = null; if (!pts.size) pan = null;
  };
  const roue = (e) => { if (e.ctrlKey) { e.preventDefault(); zoomer(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX); } };
  sc.addEventListener("pointerdown", pdown); window.addEventListener("pointermove", pmove, { passive: false });
  window.addEventListener("pointerup", pup); window.addEventListener("pointercancel", pup);
  sc.addEventListener("wheel", roue, { passive: false });
  let largeur = 0;
  const ro = new ResizeObserver(() => { if (Math.abs(sc.clientWidth - largeur) > 4) { largeur = sc.clientWidth; rendreFrise(); } });
  ro.observe(sc);
  const finDefil = autoDefil(sc);

  const poser = (id, cible, clientX) => {
    if (cible === "banque") delete pos[id];
    else if (cible === "frise") pos[id] = versAn(clientX);
    else return;
    delete st[id]; verifie = false; msg = ""; sel = null; rendreFrise(); rendreBas();
  };
  const finDrag = dragEtiquettes(el, { onPose: (etq, c, e) => poser(etq.dataset.etq, c.dataset.cible, e.clientX) });

  const agir = (a) => {
    if (a === "nouveau") distribuer();
    if (a === "solution") { cartes.forEach((id) => { pos[id] = PAR_ID[id].v; st[id] = "good"; }); verifie = true; msg = "Voici la solution. Touche une carte pour lire son explication."; }
    if (a === "verifier") {
      st = {}; let n = 0;
      cartes.forEach((id) => { if (pos[id] != null) { st[id] = juste(id) ? "good" : "bad"; if (st[id] === "good") n++; } });
      verifie = true;
      const reste = cartes.filter((id) => pos[id] == null).length;
      msg = n === cartes.length ? "🎉 Bravo, toutes les cartes sont bien placées ! Touche une carte pour lire son explication." : `${n} / ${cartes.length} bien placées.${reste ? ` Il reste ${reste} carte${reste > 1 ? "s" : ""} à placer.` : ""}${Object.values(st).includes("bad") ? " Déplace les cartes rouges." : ""}`;
      if (n === cartes.length && n) bravo(el);
    }
    sel = null; rendreFrise(); rendreBas();
  };

  el.onclick = (e) => {
    if (clicApresDrag(el) || sc._hiPan) return;
    const t = e.target;
    const zb = t.closest("[data-z]");
    if (zb) { if (zb.dataset.z === "reset") { z = 1; rendreFrise(); sc.scrollLeft = 0; } else zoomer(z * (zb.dataset.z === "in" ? 1.5 : 1 / 1.5)); return; }
    const nv = t.closest("[data-niv]");
    if (nv) { niv.set(nv.dataset.niv); if (!frisesDispo().some((f) => f.id === fid)) fid = DEF[niv.get()]; selR = null; distribuer(); tout(); return; }
    const m = t.closest("[data-mode]");
    if (m) { mode = m.dataset.mode; selR = null; sel = null; if (mode === "placer") distribuer(); tout(); return; }
    const fb = t.closest("[data-f]");
    if (fb) { fid = fb.dataset.f; z = 1; selR = null; cats = new Set(Object.keys(CAT)); distribuer(); tout(); return; }
    const cb = t.closest("[data-cat]");
    if (cb) {
      const c = cb.dataset.cat, toutes = Object.keys(CAT);
      if (c === "*") cats = new Set(toutes);
      else if (cats.size === toutes.length) cats = new Set([c]); // premier clic : n'afficher que cette catégorie
      else { cats.has(c) ? cats.delete(c) : cats.add(c); if (!cats.size) cats = new Set(toutes); }
      selR = null; if (mode === "placer") distribuer(); tout(); return;
    }
    const a = t.closest("[data-act]");
    if (a) { agir(a.dataset.act); return; }
    if (mode === "explorer") {
      const r = t.closest("[data-r]");
      selR = r ? (selR === r.dataset.r ? null : r.dataset.r) : t.closest("#tr") ? null : selR;
      if (r || t.closest("#tr")) { rendreFrise(); rendreBas(); }
      return;
    }
    const etq = t.closest("[data-etq]");
    if (etq) { sel = sel === etq.dataset.etq ? null : etq.dataset.etq; rendreFrise(); rendreBas(); return; }
    const c = t.closest("[data-cible]");
    if (c && sel) poser(sel, c.dataset.cible, e.clientX);
  };
  el.onchange = (e) => { if (e.target.id === "hp") { hp = e.target.checked; selR = null; distribuer(); tout(); } };

  distribuer(); tout();
  return () => {
    finDrag(); finDefil(); ro.disconnect();
    sc.removeEventListener("wheel", roue);
    window.removeEventListener("pointermove", pmove); window.removeEventListener("pointerup", pup); window.removeEventListener("pointercancel", pup);
  };
}

// =====================================================================
// 3. Remettre dans l'ordre
// =====================================================================
function remettreOrdre(el) {
  const NIVS = ["CE1", "CE2", "CM1", "CM2"];
  const niv = niveauMemo("hist-ordre", NIVS, "CE2");
  const N = { CE1: 4, CE2: 5, CM1: 6, CM2: 7 }, ECART = { CE1: 300, CE2: 100, CM1: 30, CM2: 5 };
  let per = -1, hp = true, ordre = [], st = [], sel = null, montrer = false, msg = "";

  el.innerHTML = `
    <div class="tool-top wrap"><span id="niv"></span>${hpHTML(hp)}</div>
    <div class="hi-cats" id="pers"></div>
    <div class="hi-zone rc-board">
      <p class="hi-consigne">Range les cartes de la plus ancienne à la plus récente : glisse une carte sur une autre pour les échanger (ou touche deux cartes).</p>
      <div class="hi-sens"><span>⏪ le plus ancien</span><span>le plus récent ⏩</span></div>
      <div class="hi-ordre" id="ordre"></div>
      ${boutonsHTML("🔀 Nouvelles cartes")}<div class="hi-msg" id="msg"></div><div id="fiche"></div>
    </div>
    <p class="dk-source">${SOURCE}</p>`;

  const tirer = () => {
    let pool = dispo(niv.get(), hp).filter((r) => per < 0 || perDe(r.v) === per);
    pool = shuffle(pool); const n = N[niv.get()];
    let pris = [];
    for (let ecart = ECART[niv.get()]; ecart >= 0.01 && pris.length < n; ecart /= 2) {
      pris = [];
      for (const r of pool) if (pris.length < n && pris.every((p) => Math.abs(p.v - r.v) >= ecart)) pris.push(r);
    }
    ordre = pris.map((r) => r.id); st = []; sel = null; montrer = false;
    msg = pris.length < 3 ? "Pas assez de repères pour ce choix : choisis une autre période ou un autre niveau." : "";
    if (pris.length > 1 && [...ordre].every((id, i, a) => i === 0 || PAR_ID[a[i - 1]].v <= PAR_ID[id].v)) [ordre[0], ordre[1]] = [ordre[1], ordre[0]];
  };
  const rendre = () => {
    el.querySelector("#niv").innerHTML = niveauxHTML(NIVS, niv.get());
    el.querySelector("#pers").innerHTML = `<button class="hi-chip ${per < 0 ? "on" : ""}" data-per="-1">Toutes les périodes</button>${PERIODES.map((p, i) => `<button class="hi-chip ${per === i ? "on" : ""}" data-per="${i}" style="--cc:${p.coul};--cf:${p.fonce}">${p.emo} ${p.nom}</button>`).join("")}`;
    el.querySelector("#ordre").innerHTML = ordre.map((id, i) => `<div class="hi-case"><span class="hi-num">${i + 1}</span>${carteHTML(PAR_ID[id], { date: montrer, cls: `hi-grande ${sel === i ? "on" : ""} ${st[i] || ""}`, attrs: `data-etq="${i}" data-cible="${i}"` })}</div>`).join("");
    el.querySelector("#msg").innerHTML = msg;
    el.querySelector("#fiche").innerHTML = montrer && sel != null ? ficheHTML(PAR_ID[ordre[sel]]) : "";
  };
  const echanger = (i, j) => { if (i === j) return; [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; st = []; if (!montrer) msg = ""; sel = null; rendre(); };
  const finDrag = dragEtiquettes(el, { onPose: (etq, c) => echanger(+etq.dataset.etq, +c.dataset.cible) });

  el.onclick = (e) => {
    if (clicApresDrag(el)) return;
    const t = e.target;
    const nv = t.closest("[data-niv]");
    if (nv) { niv.set(nv.dataset.niv); tirer(); rendre(); return; }
    const p = t.closest("[data-per]");
    if (p) { per = +p.dataset.per; tirer(); rendre(); return; }
    const a = t.closest("[data-act]");
    if (a) {
      const tri = [...ordre].sort((x, y) => PAR_ID[x].v - PAR_ID[y].v);
      if (a.dataset.act === "nouveau") tirer();
      if (a.dataset.act === "solution") { ordre = tri; st = ordre.map(() => "good"); montrer = true; msg = "Voici le bon ordre, avec les dates. Touche une carte pour lire son explication."; }
      if (a.dataset.act === "verifier") {
        st = ordre.map((id, i) => (PAR_ID[id].v === PAR_ID[tri[i]].v ? "good" : "bad"));
        const n = st.filter((s) => s === "good").length;
        if (n === ordre.length) { montrer = true; msg = "🎉 Bravo, c'est le bon ordre ! Les dates sont maintenant affichées."; bravo(el); }
        else msg = `${n} / ${ordre.length} cartes à la bonne place. Échange les cartes rouges.`;
      }
      sel = null; rendre(); return;
    }
    const c = t.closest("[data-etq]");
    if (c) { const i = +c.dataset.etq; if (sel == null || montrer) sel = sel === i ? null : i; else echanger(sel, i); rendre(); }
  };
  el.onchange = (e) => { if (e.target.id === "hp") { hp = e.target.checked; tirer(); rendre(); } };
  tirer(); rendre();
  return () => finDrag();
}

export const HISTOIRE = [
  { id: "hist-grande-frise", nom: "La grande frise", icone: "🏺", couleur: "#fbe08a", desc: "Les 5 grandes périodes de l'histoire et leurs dates", niveaux: ["CE1", "CE2", "CM1", "CM2"], mount: grandeFrise },
  { id: "hist-frise-periode", nom: "Frise d'une période", icone: "🏰", couleur: "#c5e6ad", desc: "Placer les grandes dates : rois, guerres, inventions…", niveaux: ["CE2", "CM1", "CM2"], mount: frisePeriode },
  { id: "hist-ordre", nom: "Remettre dans l'ordre", icone: "🔢", couleur: "#e6c9f3", desc: "Ranger des événements du plus ancien au plus récent", niveaux: ["CE1", "CE2", "CM1", "CM2"], mount: remettreOrdre },
];
