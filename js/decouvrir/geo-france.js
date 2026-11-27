// Géographie de la France : relief (« la carte verte »), départements, fleuves.
// Toutes les cartes partagent la projection de js/data/geo.js : X = (lon + 5,5) × cos(46,5°) × 100, Y = (51,5 − lat) × 100.
import { NIVEAUX, esc, shuffle, niveauxHTML, niveauMemo, bravo, dragEtiquettes, clicApresDrag, zoomSVG } from "./kit.js";
import { DEPTS, REGIONS18, CADRES_DOM, TRAITS_REGIONS } from "../data/decouvrir/geo-departements.js";
import { ZONES, FRANCE, LACS, GRILLE } from "../data/decouvrir/geo-relief.js";
import { TRACES_FLEUVES, VILLES, CADRE_GUYANE, GUYANE } from "../data/decouvrir/geo-fleuves.js";
import { RELIEF, ULTRAMARIN, LEGENDE, FLEUVES, MERS } from "../data/decouvrir/geo-infos.js";

const K = Math.cos((46.5 * Math.PI) / 180);
const P = ([lon, lat]) => [(lon + 5.5) * K * 100, (51.5 - lat) * 100];
const VB_FR = [0, 0, 1067.4, 1030];
const IMG_RELIEF = "img/decouvrir/relief-france.webp";
const nivOK = (niv, cur) => NIVEAUX.indexOf(niv) <= NIVEAUX.indexOf(cur);
const f1 = (n) => n.toFixed(1);
const Maj = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Taille constante à l'écran des textes et cibles posés sur la carte (quel que soit le zoom) : --k = unités SVG par pixel.
function echelle(svg) {
  const maj = () => {
    const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect();
    if (r.width && vb.width) svg.style.setProperty("--k", Math.max(vb.width / r.width, vb.height / r.height).toFixed(3));
  };
  const ro = new ResizeObserver(maj); ro.observe(svg);
  const mo = new MutationObserver(maj); mo.observe(svg, { attributes: true, attributeFilter: ["viewBox"] });
  maj();
  return () => { ro.disconnect(); mo.disconnect(); };
}
// Texte sur la carte, avec liseré blanc ; groupe .gf-s mis à l'échelle de l'écran.
const txt = (x, y, t, cls = "") => `<g transform="translate(${f1(x)},${f1(y)})"><g class="gf-s"><text class="gf-txt ${cls}">${esc(t)}</text></g></g>`;
const point = (x, y, cls = "") => `<g transform="translate(${f1(x)},${f1(y)})"><g class="gf-s"><circle r="5" class="gf-ville ${cls}"/></g></g>`;

// ---------- Placer des étiquettes (glisser-déposer ou toucher-toucher) ----------
// items : [{ id, nom, x, y }] ; la cible d'un item est le point (x, y). Rendu des cibles dans getLayer(), banque dans getBanque().
function placeur({ el, items, getLayer, getBanque, getMsg }) {
  let pose = {}, sel = null, verif = false, ordre = shuffle(items.map((i) => i.id));
  const nom = (id) => items.find((i) => i.id === id)?.nom ?? "";
  const msg = (h) => { const m = getMsg(); if (m) m.innerHTML = h; };
  const render = () => {
    const layer = getLayer(), banque = getBanque(); if (!layer) return;
    layer.innerHTML = items.map((c) => {
      const it = pose[c.id], st = verif && it ? (it === c.id ? "good" : "bad") : "";
      return `<g class="gf-cible ${it ? "pleine" : ""} ${st}" data-cible="${c.id}" transform="translate(${f1(c.x)},${f1(c.y)})"><g class="gf-s">
        <circle r="24" class="gf-hitc"/><circle r="9" class="gf-pt"/>${it ? `<text class="gf-txt gf-pose" y="${c.y < 90 ? 22 : -21}">${esc(nom(it))}</text>` : ""}</g></g>`;
    }).join("");
    const main = layer.closest(".gf-main"); let puce = main?.querySelector(".gf-choix");
    if (main && !puce) { puce = document.createElement("div"); puce.className = "gf-choix"; main.appendChild(puce); }
    if (puce) { puce.hidden = !sel; puce.textContent = sel ? `🏷️ ${Maj(nom(sel))} : touche le bon point` : ""; }
    if (banque) {
      const placees = new Set(Object.values(pose));
      const libres = ordre.filter((id) => !placees.has(id));
      banque.innerHTML = libres.length ? libres.map((id) => `<button class="dk-etq ${sel === id ? "on" : ""}" data-etq="${id}">${esc(Maj(nom(id)))}</button>`).join("")
        : `<p class="muted center">Toutes les étiquettes sont placées.</p>`;
    }
  };
  const poser = (id, cible) => {
    for (const k of Object.keys(pose)) if (pose[k] === id) delete pose[k];
    pose[cible] = id; sel = null; verif = false; render();
    msg(Object.keys(pose).length === items.length ? "Tout est placé : appuie sur <b>Vérifier</b>." : "");
  };
  return {
    render,
    poser,
    clic(e) {
      const b = e.target.closest("[data-etq]");
      if (b && el.contains(b)) { sel = sel === b.dataset.etq ? null : b.dataset.etq; render(); return true; }
      const c = e.target.closest("[data-cible]");
      if (c) {
        const id = c.dataset.cible;
        if (sel) poser(sel, id);
        else if (pose[id]) { sel = pose[id]; delete pose[id]; verif = false; render(); msg("Étiquette reprise : touche le bon point."); }
        else msg("Choisis d'abord une étiquette, puis touche ce point.");
        return true;
      }
      return false;
    },
    verifier() {
      verif = true; render();
      const ok = items.filter((c) => pose[c.id] === c.id).length;
      if (ok === items.length) { msg(`Tout est juste : ${ok} / ${items.length} 🎉`); bravo(el); }
      else msg(`${ok} / ${items.length} bien placées. ${Object.keys(pose).length < items.length ? "Il reste des étiquettes. " : ""}Les rouges sont à revoir : touche-les pour les reprendre.`);
    },
    solution() { pose = Object.fromEntries(items.map((c) => [c.id, c.id])); sel = null; verif = true; render(); msg("Voici la solution."); },
    recommencer() { pose = {}; sel = null; verif = false; ordre = shuffle(items.map((i) => i.id)); render(); msg(""); },
  };
}
const placerCarteHTML = (titre, aide) => `<h3>${titre}</h3><p class="gf-aide">${aide}</p>
  <div class="gf-act"><button class="primary" data-act="verif">✔ Vérifier</button><button class="ghost" data-act="sol">Solution</button><button class="ghost" data-act="reset">↺ Recommencer</button></div>
  <div class="gf-msg" id="msg" aria-live="polite"></div>
  <div class="dk-banque gf-banque" id="banque"></div>`;

// Squelette commun : barre d'outils, carte + fiche, source.
function squelette(el, { modes, niv, dispo, options = "", vb, svg, sous = "", source }) {
  el.innerHTML = `
    <div class="tool-top wrap gf-top">
      <div class="seg" role="group" aria-label="Mode">${modes.map(([id, l], i) => `<button data-mode="${id}" class="${i ? "" : "on"}">${l}</button>`).join("")}</div>
      ${niveauxHTML(dispo, niv)}
      ${options}
    </div>
    <div class="explore gf rc-board">
      <div class="explore-main gf-main"><svg viewBox="${vb.join(" ")}" class="gf-map" id="mp" role="img">${svg}</svg>${sous}</div>
      <aside class="explore-card gf-card" id="card"></aside>
    </div>
    <p class="dk-source">${source}</p>`;
  return el.querySelector("#mp");
}
const setOn = (el, attr, val) => el.querySelectorAll(`[data-${attr}]`).forEach((b) => b.classList.toggle("on", b.dataset[attr] === val));

// Parcours de quiz sans répétition.
function tirage() {
  let l = [], i = 0;
  return (pool, sauf) => { if (i >= l.length || !l.every((x) => pool.includes(x))) { l = shuffle(pool); i = 0; if (l[0] === sauf && l.length > 1) l.push(l.shift()); } return l[i++]; };
}

// ======================================================================
// 1. Relief de France (la carte verte)
// ======================================================================
const LIMITES = [100, 200, 500, 1000, 1500, 2000, 3000];
const classeTexte = (c) => c === 0 ? "moins de 100 m" : c === 7 ? "plus de 3 000 m" : `entre ${LEGENDE[c][0]} et ${LEGENDE[c + 1][0].replace(/\s*m$/, "")} m`;
const legCourte = (c) => c === 0 ? "moins de 100 m" : c === 7 ? "plus de 3 000 m" : `${LEGENDE[c][0]} à ${LEGENDE[c + 1][0].replace(/\s*m$/, "")} m`;
let grilleCache = null;
function grille() {
  if (grilleCache) return grilleCache;
  const g = new Uint8Array(GRILLE.w * GRILLE.h); let k = 0;
  GRILLE.rle.replace(/([A-J])([0-9a-z]*)/g, (_, c, n) => { const v = c.charCodeAt(0) - 65, m = n ? parseInt(n, 36) : 1; g.fill(v, k, k + m); k += m; return ""; });
  return (grilleCache = g);
}
const altitudeEn = (x, y) => { const i = Math.floor(x / GRILLE.pas), j = Math.floor(y / GRILLE.pas); if (i < 0 || j < 0 || i >= GRILLE.w || j >= GRILLE.h) return 9; return grille()[j * GRILLE.w + i]; };

function relief(el) {
  const DISPO = ["CE2", "CM1", "CM2"];
  const niv = niveauMemo("geo-relief", DISPO, "CE2");
  let mode = "explorer", sel = null, tap = null, fleuves = false, noms = false, pl = null;
  const q = { cible: null, ok: 0, n: 0, faux: null, juste: null, essais: 0 }, tire = tirage();
  const liste = () => RELIEF.filter((r) => nivOK(r.niv, niv.get()));
  const legende = `<details class="gf-legende" ${innerWidth < 700 ? "" : "open"}><summary>Altitude</summary>${[...LEGENDE].reverse().map(([, c], i) => `<span><i style="background:${c}"></i>${legCourte(7 - i)}</span>`).join("")}</details>`;
  const mp = squelette(el, {
    modes: [["explorer", "🔎 Explorer"], ["placer", "🏷️ Placer les noms"], ["quiz", "❓ Quiz"]], niv: niv.get(), dispo: DISPO,
    options: `<label class="check"><input type="checkbox" id="gfFl"> Fleuves</label><label class="check"><input type="checkbox" id="gfNm"> Tous les noms</label>`,
    vb: VB_FR,
    svg: `<image href="${IMG_RELIEF}" x="0" y="0" width="1067.4" height="1030" preserveAspectRatio="none"/>
      <path d="${FRANCE}" class="gf-france"/><g id="gZ"></g><g id="gFl"></g><g id="gS"></g><g id="gT"></g><g id="gC"></g>`,
    sous: legende,
    source: "Relief : Mapzen Terrain Tiles / AWS (SRTM, ETOPO1…), mis en couleurs pour BagaSchool · Contour : IGN Admin Express (Licence Ouverte) · Fleuves et lacs : Natural Earth (domaine public). Zones des plaines et bassins : approximatives.",
  });
  const zm = zoomSVG(mp, { max: 6 }); el.querySelector(".gf-main").insertAdjacentHTML("beforeend", zm.boutonsHTML); zm.lier(el.querySelector(".gf-main"));
  const stopEch = echelle(mp);
  const $ = (s) => el.querySelector(s);

  const draw = () => {
    const L = liste();
    const zones = L.filter((r) => r.type !== "l"), lacs = L.filter((r) => r.type === "l");
    const ordreZ = [...zones.filter((r) => r.type === "p"), ...zones.filter((r) => r.type === "m")];
    const cls = (id) => [sel === id && mode === "explorer" ? "on" : "", q.juste === id ? "ok" : "", q.faux === id ? "bad" : "", mode === "quiz" && q.essais >= 2 && q.cible === id ? "indice" : ""].join(" ");
    $("#gZ").innerHTML = ordreZ.map((r) => `<path d="${ZONES[r.id]}" data-z="${r.id}" class="gf-zone ${cls(r.id)}"/>`).join("")
      + lacs.map((r) => `<path d="${LACS[r.id]}" data-z="${r.id}" class="gf-lac ${cls(r.id)}"/>`).join("");
    const riv = FLEUVES.filter((f) => !f.guyane && nivOK(f.niv, niv.get()));
    $("#gFl").innerHTML = fleuves ? riv.map((f) => `<path d="${TRACES_FLEUVES[f.id]}" class="gf-riv ${f.f ? "fleuve" : ""}"/>`).join("") : "";
    // sommets
    $("#gS").innerHTML = mode === "placer" ? "" : L.filter((r) => r.sommet && r.type === "m" || (r.sommet && sel === r.id)).map((r) => {
      const [x, y] = P(r.sommet[2]);
      return `<g transform="translate(${f1(x)},${f1(y)})" data-z="${r.id}" class="gf-sommet ${sel === r.id ? "on" : ""}"><g class="gf-s"><path d="M0,-8L7,5H-7Z"/></g></g>`;
    }).join("");
    let t = "";
    if (mode === "explorer") {
      for (const r of L) if (noms || sel === r.id) { const [x, y] = P(r.pos); t += txt(x, y, r.nom, r.type === "m" ? "gf-massif" : r.type === "l" ? "gf-eau" : "gf-plaine"); }
      const s = L.find((r) => r.id === sel);
      if (s?.sommet) { const [x, y] = P(s.sommet[2]); t += txt(x, y + 0, `${s.sommet[0]} ${s.sommet[1].replace("environ ", "≈ ")}`, "gf-petit gf-dessous"); }
      if (tap && !s) t += point(tap.x, tap.y, "gf-tap");
    }
    $("#gT").innerHTML = t;
    if (mode === "placer") pl.render(); else $("#gC").innerHTML = "";
  };
  const card = (m = "") => {
    const c = $("#card");
    if (mode === "explorer") {
      const r = RELIEF.find((x) => x.id === sel);
      if (!r) {
        c.innerHTML = `<h3>Le relief de la France</h3><p>Touche un massif, une plaine ou n'importe quel endroit de la carte.</p>${tap ? `<div class="answer">${tap.html}</div>` : ""}
          <p class="muted">Sur cette carte, les couleurs indiquent l'altitude : <b style="color:#4f8f3e">vert</b> pour les plaines basses, <b style="color:#b58a1e">jaune</b> et <b style="color:#b06a2c">orange</b> pour les plateaux et les montagnes moyennes, <b style="color:#7a4430">brun</b> pour les hautes montagnes.</p>
          ${niv.get() === "CE2" ? `<p class="muted"><b>Montagne</b> : relief élevé aux pentes fortes. <b>Plaine</b> : étendue plate et basse. <b>Plateau</b> : étendue plate en hauteur. <b>Vallée</b> : creux où coule un cours d'eau.</p>` : ""}
          <p class="muted">${ULTRAMARIN}</p>`;
        return;
      }
      const type = r.type === "m" ? "Massif montagneux" : r.type === "l" ? "Lac" : r.id === "armoricain" || r.id === "ardennes" ? "Massif ancien (collines)" : "Plaine, bassin";
      c.innerHTML = `<h3>${esc(r.nom)}</h3><span class="dk-tag">${type}</span>
        ${r.sommet ? `<dl class="ec-facts"><dt>Point culminant</dt><dd>${esc(r.sommet[0])}, ${esc(r.sommet[1])}</dd></dl>` : ""}
        <p>${esc(r.txt)}</p>${r.note ? `<p class="muted">${esc(r.note)}</p>` : ""}${tap?.html ? `<p class="muted">${tap.html}</p>` : ""}
        <button class="ghost" data-act="fermer">← Toute la carte</button>`;
    } else if (mode === "placer") {
      c.innerHTML = placerCarteHTML("Placer les noms", "Glisse chaque étiquette sur le bon point de la carte, ou touche une étiquette puis le point.");
      pl.render();
    } else {
      const r = RELIEF.find((x) => x.id === q.cible);
      c.innerHTML = `<h3>Quiz</h3><p>Touche sur la carte :</p><div class="quiz-target">${esc(r.nom)}</div>${m ? `<div class="answer">${m}</div>` : ""}
        <p class="score">Score : <b>${q.ok}</b> / ${q.n}</p><button class="ghost" data-act="suivant">Autre question</button>`;
    }
  };
  const nouveauPlaceur = () => {
    pl = placeur({ el, items: liste().map((r) => { const [x, y] = P(r.pos); return { id: r.id, nom: r.nom, x, y }; }), getLayer: () => $("#gC"), getBanque: () => $("#banque"), getMsg: () => $("#msg") });
  };
  const question = () => { q.cible = tire(liste().map((r) => r.id), q.cible); q.faux = q.juste = null; q.essais = 0; };
  const setMode = (m) => {
    mode = m; sel = null; tap = null; setOn(el, "mode", m);
    el.querySelector(".gf-choix")?.remove(); q.juste = q.faux = null;
    if (m === "placer") nouveauPlaceur();
    if (m === "quiz") { q.ok = q.n = 0; question(); }
    draw(); card();
  };
  let tm = null;
  const toucher = (e) => {
    const z = e.target.closest("[data-z]");
    if (mode === "explorer") {
      const r = mp.getBoundingClientRect(), vb = mp.viewBox.baseVal, s = Math.max(vb.width / r.width, vb.height / r.height);
      const x = vb.x + (e.clientX - r.left) * s - (r.width * s - vb.width) / 2, y = vb.y + (e.clientY - r.top) * s - (r.height * s - vb.height) / 2;
      const a = altitudeEn(x, y);
      const html = a === 9 ? "Ici, c'est la mer." : a === 8 ? "Ici, on n'est plus en France." : `Altitude ici : <b>${classeTexte(a)}</b>.`;
      tap = { x, y, html }; sel = z ? z.dataset.z : null; draw(); card(); return;
    }
    if (mode === "quiz" && z) {
      if (q.juste) return;
      const id = z.dataset.z; q.n++;
      if (id === q.cible) { q.ok++; q.juste = id; q.faux = null; draw(); card("Bravo ! 🎉"); clearTimeout(tm); tm = setTimeout(() => { if (mode === "quiz") { question(); draw(); card(); } }, 1300); }
      else { q.faux = id; q.essais++; draw(); card(`Non, ça c'est : ${esc(RELIEF.find((r) => r.id === id).nom)}.${q.essais >= 2 ? " La bonne zone clignote." : ""}`); }
    }
  };
  const stopDrag = dragEtiquettes(el, { aimant: 46, onPose: (b, c) => { if (mode === "placer") pl.poser(b.dataset.etq, c.dataset.cible); } });
  el.onclick = (e) => {
    if (clicApresDrag(el) || zm.panFini()) return;
    const b = e.target.closest("button");
    if (b?.dataset.mode) return setMode(b.dataset.mode);
    if (b?.dataset.niv) { niv.set(b.dataset.niv); setOn(el, "niv", b.dataset.niv); return setMode(mode); }
    if (mode === "placer" && pl.clic(e)) return;
    if (b?.dataset.act) {
      const a = b.dataset.act;
      if (a === "verif") pl.verifier(); else if (a === "sol") pl.solution(); else if (a === "reset") pl.recommencer();
      else if (a === "fermer") { sel = null; tap = null; draw(); card(); }
      else if (a === "suivant") { question(); draw(); card(); }
      return;
    }
    if (e.target.closest("#mp")) toucher(e);
  };
  el.onchange = (e) => {
    if (e.target.id === "gfFl") { fleuves = e.target.checked; draw(); }
    if (e.target.id === "gfNm") { noms = e.target.checked; draw(); }
  };
  setMode("explorer");
  return () => { stopDrag(); stopEch(); zm.cleanup(); clearTimeout(tm); };
}

// ======================================================================
// 2. Départements
// ======================================================================
const COUL_REG = { "11": "#ffc9d6", "24": "#ffe3a3", "27": "#c9ecd4", "28": "#c8e6a8", "32": "#d7ccff", "44": "#ffd7bf", "52": "#f7cfe9", "53": "#fff0a8", "75": "#e2f0b5", "76": "#ffe0c2", "84": "#a9dcd0", "93": "#e3d7ff", "94": "#ffd0dc", "01": "#ffd7bf", "02": "#ffe3a3", "03": "#c9ecd4", "04": "#ffd0dc", "06": "#d7ccff" };
const PETITS = new Set(["75", "92", "93", "94"]);
const MON_DEP = "bagaschool-geo-mon-dep";
const D = Object.fromEntries(DEPTS.map(([c, nom, pref, reg, d, x, y, vois]) => [c, { c, nom, pref, reg, d, x, y, vois }]));
const ORDRE_DEP = DEPTS.map((d) => d[0]);
const lib = (d) => `${d.nom} (${d.c})`;

function departements(el) {
  const DISPO = ["CE2", "CM1", "CM2"];
  const niv = niveauMemo("geo-departements", DISPO, "CM1");
  let mode = "explorer", sel = null, filtre = "", numeros = false, mon = localStorage.getItem(MON_DEP);
  if (!D[mon]) mon = null;
  const q = { type: "nom", cible: null, ok: 0, n: 0, faux: null, juste: null, essais: 0 }, tire = tirage();
  const defi = { actif: false, trouves: new Set(), faux: null, erreurs: 0 };
  let zm = null, tm = null;
  const regOptions = Object.entries(REGIONS18).sort((a, b) => a[1][0].localeCompare(b[1][0], "fr")).map(([c, [n]]) => `<option value="${c}">${esc(n)}</option>`).join("");
  const VB = [-262, 0, 1330, 1030];
  const mp = squelette(el, {
    modes: [["explorer", "🔎 Explorer"], ["quiz", "❓ Quiz"], ["moi", "⭐ Mon département"]], niv: niv.get(), dispo: DISPO,
    options: `<label class="gf-sel">Région <select id="gfReg"><option value="">Toute la France</option>${regOptions}</select></label><label class="check"><input type="checkbox" id="gfNum"> Numéros</label>`,
    vb: VB,
    svg: `${CADRES_DOM.map(([c, x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" class="gf-cadre"/><text x="${x + w / 2}" y="${y + 21}" class="gf-cadre-t">${esc(D[c].nom)}</text>`).join("")}
      <text x="-147" y="1027" class="gf-cadre-n">Outre-mer : pas à la même échelle</text>
      <g id="gD"></g><path d="${TRAITS_REGIONS}" class="gf-regtraits"/><g id="gN"></g>`,
    source: "Tracés : IGN Admin Express (Licence Ouverte Etalab), via france-geojson, simplifiés. 96 départements métropolitains et 5 d'outre-mer.",
  });
  const $ = (s) => el.querySelector(s);
  const stopEch = echelle(mp);
  const dans = (c) => !filtre || D[c].reg === filtre;
  const pool = () => ORDRE_DEP.filter(dans);
  const majZoom = () => {
    zm?.cleanup(); el.querySelector(".gf-main .dk-zoom")?.remove();
    let v = VB;
    if (filtre) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      mp.querySelectorAll("#gD [data-d]").forEach((p) => { if (!dans(p.dataset.d)) return; const b = p.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); });
      const m = Math.max(x1 - x0, y1 - y0) * 0.08 + 12; v = [x0 - m, y0 - m, x1 - x0 + 2 * m, y1 - y0 + 2 * m];
    }
    mp.setAttribute("viewBox", v.map(f1).join(" "));
    zm = zoomSVG(mp, { max: filtre ? 4 : 8 });
    $(".gf-main").insertAdjacentHTML("beforeend", zm.boutonsHTML); zm.lier($(".gf-main"));
  };
  const draw = () => {
    const moiV = mon && mode === "moi" ? new Set(D[mon].vois) : new Set();
    $("#gD").innerHTML = DEPTS.map(([c]) => {
      const d = D[c]; const k = [];
      if (!dans(c)) k.push("hors");
      if (mode === "explorer" && sel === c) k.push("on");
      if (mode === "quiz") { if (q.juste === c) k.push("ok"); if (q.faux === c) k.push("bad"); if (q.essais >= 2 && q.cible === c) k.push("indice"); }
      if (mode === "moi") {
        if (c === mon) k.push("moi");
        else if (defi.actif) { if (defi.trouves.has(c)) k.push("ok"); if (defi.faux === c) k.push("bad"); }
        else if (moiV.has(c)) k.push("voisin");
        if (!defi.actif && sel === c && c !== mon) k.push("on");
      }
      return `<path d="${d.d}" data-d="${c}" class="gf-dep ${k.join(" ")}" style="--rc:${COUL_REG[d.reg]}"/>`;
    }).join("");
    let t = "";
    if (numeros) for (const c of ORDRE_DEP) if (dans(c)) t += `<g transform="translate(${D[c].x},${D[c].y})"><g class="gf-s"><text class="gf-num ${PETITS.has(c) ? "petit" : ""}">${c}</text></g></g>`;
    const nomSur = mode === "explorer" ? sel : mode === "moi" ? (defi.actif ? null : sel || mon) : q.juste;
    if (nomSur) t += txt(D[nomSur].x, D[nomSur].y - (numeros ? 18 : 0), D[nomSur].nom, "gf-depnom");
    if (mode === "moi" && mon && nomSur !== mon) t += txt(D[mon].x, D[mon].y - (numeros ? 18 : 0), "⭐ " + D[mon].nom, "gf-depnom");
    $("#gN").innerHTML = t;
  };
  const fiche = (c) => {
    const d = D[c], n = niv.get(), [rn, rcap] = REGIONS18[d.reg];
    const voisins = d.vois.map((v) => D[v]?.nom).filter(Boolean);
    return `<dl class="ec-facts"><dt>Numéro</dt><dd>${d.c}</dd>${n !== "CE2" ? `<dt>Préfecture</dt><dd>${esc(d.pref)}</dd>` : ""}<dt>Région</dt><dd>${esc(rn)}</dd>
      ${n === "CM2" ? `<dt>Capitale régionale</dt><dd>${esc(rcap)}</dd>` : ""}</dl>
      ${n === "CM2" && voisins.length ? `<p class="muted">Départements voisins : ${voisins.map(esc).join(", ")}.</p>` : ""}
      ${d.c.length === 3 ? `<p class="muted">Département et région d'outre-mer.</p>` : ""}`;
  };
  const typesQuiz = () => niv.get() === "CE2" ? [["nom", "Par le nom"]] : niv.get() === "CM1" ? [["nom", "Par le nom"], ["num", "Par le numéro"]] : [["nom", "Par le nom"], ["num", "Par le numéro"], ["pref", "Par la préfecture"]];
  const enonce = (c) => q.type === "num" ? `le n° ${c}` : q.type === "pref" ? `le département ${/^[AEIOUYÉÈÊÂÎH]/i.test(D[c].pref) ? "d'" : "de "}${esc(D[c].pref)}` : esc(D[c].nom);
  const card = (m = "") => {
    const c = $("#card");
    if (mode === "explorer") {
      if (!sel) {
        c.innerHTML = `<h3>Les départements</h3><p>Touche un département pour voir son numéro${niv.get() !== "CE2" ? ", sa préfecture" : ""} et sa région.</p>
          <p class="muted">La France compte 101 départements : 96 en métropole et 5 en outre-mer. Ils ont été créés en 1790.</p>
          ${filtre ? `<div class="answer">${esc(REGIONS18[filtre][0])} : ${pool().length} département${pool().length > 1 ? "s" : ""}, capitale régionale ${esc(REGIONS18[filtre][1])}.</div>` : `<p class="muted">Astuce : choisis une région dans la liste pour la voir en grand.</p>`}`;
      } else c.innerHTML = `<h3>${esc(D[sel].nom)}</h3>${fiche(sel)}${sel !== mon ? `<button class="ghost" data-act="cestmoi">⭐ C'est mon département</button>` : `<p><span class="dk-tag">⭐ Mon département</span></p>`}`;
    } else if (mode === "quiz") {
      const T = typesQuiz(); if (!T.some(([t]) => t === q.type)) q.type = "nom";
      c.innerHTML = `<h3>Quiz</h3>${T.length > 1 ? `<div class="seg gf-seg">${T.map(([t, l]) => `<button data-qt="${t}" class="${q.type === t ? "on" : ""}">${l}</button>`).join("")}</div>` : ""}
        <p>Touche sur la carte :</p><div class="quiz-target">${enonce(q.cible)}</div>${m ? `<div class="answer">${m}</div>` : ""}
        <p class="score">Score : <b>${q.ok}</b> / ${q.n}</p><button class="ghost" data-act="suivant">Autre question</button>
        ${filtre ? `<p class="muted">Questions sur : ${esc(REGIONS18[filtre][0])}.</p>` : `<p class="muted">Pour travailler une seule région, choisis-la dans la liste « Région ».</p>`}`;
    } else {
      const opts = [...ORDRE_DEP].sort((a, b) => D[a].nom.localeCompare(D[b].nom, "fr")).map((x) => `<option value="${x}" ${x === mon ? "selected" : ""}>${esc(D[x].nom)} (${x})</option>`).join("");
      const choix = `<label class="gf-sel gf-sel-bloc">Mon département <select id="gfMon"><option value="">— choisir —</option>${opts}</select></label>`;
      if (!mon) { c.innerHTML = `<h3>⭐ Mon département</h3><p>Choisis le département de l'école dans la liste, ou touche-le sur la carte.</p>${choix}<p class="muted">Le choix est gardé sur cet appareil.</p>`; return; }
      const d = D[mon];
      if (defi.actif) {
        const n = d.vois.length;
        c.innerHTML = `<h3>🎯 Les voisins</h3><p>Touche tous les départements qui touchent ton département (${esc(lib(d))}).</p>
          <p class="score">Trouvés : <b>${defi.trouves.size}</b> / ${n}${defi.erreurs ? ` · erreurs : ${defi.erreurs}` : ""}</p>${m ? `<div class="answer">${m}</div>` : ""}
          ${defi.trouves.size ? `<p class="muted">${[...defi.trouves].map((v) => esc(D[v].nom)).join(", ")}</p>` : ""}
          <div class="gf-act"><button class="ghost" data-act="solvois">Solution</button><button class="ghost" data-act="findefi">Terminer</button></div>`;
        return;
      }
      const vu = sel && sel !== mon ? `<div class="answer">${esc(lib(D[sel]))}${D[mon].vois.includes(sel) ? " : c'est un voisin !" : ""} <button class="ghost gf-mini" data-act="cestmoi">⭐ Choisir</button></div>` : "";
      c.innerHTML = `<h3>⭐ ${esc(d.nom)}</h3>${fiche(mon)}${vu}
        ${d.vois.length ? `<p>Ses voisins (en jaune) : ${d.vois.map((v) => esc(D[v].nom)).join(", ")}.</p><button class="primary" data-act="defi">🎯 Défi : retrouve les voisins</button>` : `<p class="muted">Pas de département voisin sur la carte${d.c.length === 3 ? " : c'est une île ou un territoire d'outre-mer" : ""}.</p>`}
        ${choix}`;
    }
  };
  const question = () => { q.cible = tire(pool(), q.cible); q.faux = q.juste = null; q.essais = 0; };
  const setMode = (m) => {
    mode = m; sel = null; defi.actif = false; setOn(el, "mode", m);
    if (m === "quiz") { q.ok = q.n = 0; question(); }
    draw(); card();
  };
  const choisirMon = (c) => { mon = c; localStorage.setItem(MON_DEP, c); sel = null; defi.actif = false; draw(); card(); };
  const toucher = (c) => {
    if (mode === "explorer") { sel = c; draw(); card(); return; }
    if (mode === "quiz") {
      if (q.juste || !dans(c)) return;
      q.n++;
      if (c === q.cible) { q.ok++; q.juste = c; q.faux = null; draw(); card(`Bravo ! 🎉 ${esc(lib(D[c]))}${q.type === "pref" ? ", préfecture : " + esc(D[c].pref) : ""}`); clearTimeout(tm); tm = setTimeout(() => { if (mode === "quiz") { question(); draw(); card(); } }, 1400); }
      else { q.faux = c; q.essais++; draw(); card(`Non, ça c'est ${esc(lib(D[c]))}.${q.essais >= 2 ? " La bonne réponse clignote." : ""}`); }
      return;
    }
    if (!mon) return choisirMon(c);
    if (defi.actif) {
      if (c === mon) return;
      if (D[mon].vois.includes(c)) {
        defi.trouves.add(c); defi.faux = null; draw();
        if (defi.trouves.size === D[mon].vois.length) { card(`Bravo ! Tu as trouvé les ${defi.trouves.size} voisins 🎉`); bravo(el); }
        else card(`Oui : ${esc(D[c].nom)} !`);
      } else { defi.faux = c; defi.erreurs++; draw(); card(`Non : ${esc(D[c].nom)} ne touche pas ton département.`); }
      return;
    }
    sel = c === mon ? null : c; draw(); card();
  };
  el.onclick = (e) => {
    if (zm?.panFini()) return;
    const b = e.target.closest("button");
    if (b?.dataset.mode) return setMode(b.dataset.mode);
    if (b?.dataset.niv) { niv.set(b.dataset.niv); setOn(el, "niv", b.dataset.niv); return setMode(mode); }
    if (b?.dataset.qt) { q.type = b.dataset.qt; q.ok = q.n = 0; question(); draw(); card(); return; }
    if (b?.dataset.act) {
      const a = b.dataset.act;
      if (a === "suivant") { question(); draw(); card(); }
      if (a === "cestmoi" && sel) choisirMon(sel);
      if (a === "defi") { defi.actif = true; defi.trouves = new Set(); defi.faux = null; defi.erreurs = 0; sel = null; draw(); card(); }
      if (a === "solvois") { defi.trouves = new Set(D[mon].vois); draw(); card("Voici tous les voisins."); }
      if (a === "findefi") { defi.actif = false; draw(); card(); }
      return;
    }
    const p = e.target.closest("[data-d]");
    if (p) toucher(p.dataset.d);
  };
  el.onchange = (e) => {
    if (e.target.id === "gfReg") { filtre = e.target.value; sel = null; if (mode === "quiz") { q.ok = q.n = 0; question(); } draw(); majZoom(); card(); }
    if (e.target.id === "gfNum") { numeros = e.target.checked; draw(); }
    if (e.target.id === "gfMon" && e.target.value) choisirMon(e.target.value);
  };
  setMode("explorer");
  majZoom();
  return () => { zm?.cleanup(); stopEch(); clearTimeout(tm); };
}

// ======================================================================
// 3. Fleuves de France
// ======================================================================
const sommetsDe = (d) => { const n = d.match(/-?\d+(?:\.\d+)?/g).map(Number); const r = []; for (let i = 0; i + 1 < n.length; i += 2) r.push([n[i], n[i + 1]]); return r; };
function ancre(f) {
  const pts = sommetsDe(TRACES_FLEUVES[f.id]);
  if (!f.pos) return pts[Math.floor(pts.length * 0.45)];
  const [x, y] = P(f.pos); let best = pts[0], bd = Infinity;
  for (const p of pts) { const dd = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (dd < bd) { bd = dd; best = p; } }
  return best;
}
const GAUCHE = new Set(["Le Havre", "Clermont-Ferrand", "Limoges", "Tours", "Cayenne", "Nantes", "Bordeaux"]);
function fleuves(el) {
  const DISPO = ["CE2", "CM1", "CM2"];
  const niv = niveauMemo("geo-fleuves", DISPO, "CE2");
  let mode = "explorer", sel = null, relief = true, villes = false, pl = null, tm = null;
  const q = { cible: null, ok: 0, n: 0, faux: null, juste: null, essais: 0 }, tire = tirage();
  const liste = () => FLEUVES.filter((f) => nivOK(f.niv, niv.get()));
  const lacs = () => niv.get() === "CM2" ? RELIEF.filter((r) => r.type === "l") : [];
  const [gx, gy, gw, gh] = CADRE_GUYANE;
  const mp = squelette(el, {
    modes: [["explorer", "🔎 Explorer"], ["placer", "🏷️ Placer les noms"], ["quiz", "❓ Quiz"]], niv: niv.get(), dispo: DISPO,
    options: `<label class="check"><input type="checkbox" id="gfRel" checked> Relief</label><label class="check"><input type="checkbox" id="gfVil"> Grandes villes</label>`,
    vb: VB_FR,
    svg: `<rect x="0" y="0" width="1067.4" height="1030" class="gf-mer" id="gfMer"/>
      <image href="${IMG_RELIEF}" x="0" y="0" width="1067.4" height="1030" preserveAspectRatio="none" class="gf-pale" id="gfImg"/>
      <path d="${FRANCE}" class="gf-france gf-terre" id="gfTerre"/>
      <rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="14" class="gf-cadre"/><text x="${gx + gw / 2}" y="${gy + 21}" class="gf-cadre-t">Guyane</text>
      <path d="${GUYANE}" class="gf-guyane"/>
      <g id="gL"></g><g id="gR"></g><g id="gV"></g><g id="gT"></g><g id="gC"></g>`,
    source: "Fleuves, lacs et villes : Natural Earth 1:10m (domaine public) · Contours : IGN Admin Express (Licence Ouverte) · Relief : Mapzen Terrain Tiles / AWS (SRTM, ETOPO1…). Encart de la Guyane : pas à la même échelle.",
  });
  const zm = zoomSVG(mp, { max: 6 }); el.querySelector(".gf-main").insertAdjacentHTML("beforeend", zm.boutonsHTML); zm.lier(el.querySelector(".gf-main"));
  const stopEch = echelle(mp);
  const $ = (s) => el.querySelector(s);
  const draw = () => {
    const L = liste();
    $("#gfImg").style.display = relief ? "" : "none"; $("#gfTerre").classList.toggle("uni", !relief); $("#gfMer").classList.toggle("uni", !relief);
    const cls = (id) => [mode === "explorer" && sel === id ? "on" : "", q.juste === id ? "ok" : "", q.faux === id ? "bad" : "", mode === "quiz" && q.essais >= 2 && q.cible === id ? "indice" : ""].join(" ");
    $("#gL").innerHTML = lacs().map((r) => `<path d="${LACS[r.id]}" data-f="${r.id}" class="gf-lac ${cls(r.id)}"/>`).join("");
    const ord = [...L.filter((f) => !f.f), ...L.filter((f) => f.f)];
    $("#gR").innerHTML = ord.map((f) => `<path d="${TRACES_FLEUVES[f.id]}" class="gf-riv ${f.f ? "fleuve" : ""} ${cls(f.id)}"/>`).join("")
      + ord.map((f) => `<path d="${TRACES_FLEUVES[f.id]}" data-f="${f.id}" class="gf-hit"/>`).join("");
    const s = FLEUVES.find((f) => f.id === sel);
    let v = "", t = "";
    const montrer = new Set(villes ? Object.keys(VILLES) : []);
    if (mode === "explorer" && s?.villes) s.villes.forEach((n) => VILLES[n] && montrer.add(n));
    for (const n of montrer) { const [x, y] = VILLES[n]; v += point(x, y); t += txt(x, y, n, `gf-petit ${GAUCHE.has(n) ? "gf-gauche" : "gf-droite"}`); }
    $("#gV").innerHTML = v;
    if (mode === "explorer") {
      for (const m of MERS) { const [x, y] = P(m.pos); t += txt(x, y, Maj(m.nom), "gf-mer-t"); }
      if (s) { const [x, y] = ancre(s); t += txt(x, y - 4, Maj(s.nom), "gf-eau gf-dessus"); }
      const lac = RELIEF.find((r) => r.id === sel && r.type === "l"); if (lac) { const [x, y] = P(lac.pos); t += txt(x, y - 16, lac.nom, "gf-eau"); }
    }
    $("#gT").innerHTML = t;
    if (mode === "placer") pl.render(); else $("#gC").innerHTML = "";
  };
  const card = (m = "") => {
    const c = $("#card");
    if (mode === "explorer") {
      const f = FLEUVES.find((x) => x.id === sel), lac = RELIEF.find((r) => r.id === sel && r.type === "l");
      if (lac) { c.innerHTML = `<h3>${esc(lac.nom)}</h3><span class="dk-tag">Lac</span><p>${esc(lac.txt)}</p><button class="ghost" data-act="fermer">← Toute la carte</button>`; return; }
      if (!f) {
        c.innerHTML = `<h3>Les fleuves de France</h3><p>Touche un cours d'eau pour le découvrir.</p>
          <p class="muted">Un <b>fleuve</b> se jette dans la mer ou l'océan. Une <b>rivière</b> se jette dans un autre cours d'eau : c'est un <b>affluent</b>.</p>
          <p class="muted">Les fleuves sont en trait épais, les rivières en trait fin.</p>`;
        return;
      }
      c.innerHTML = `<h3>${esc(Maj(f.nom))}</h3><span class="dk-tag">${f.f ? "Fleuve" : "Rivière (affluent)"}</span>
        <dl class="ec-facts">${f.long ? `<dt>Longueur</dt><dd>${esc(f.long)}</dd>` : ""}${f.source ? `<dt>Source</dt><dd>${esc(f.source)}</dd>` : ""}<dt>Se jette dans</dt><dd>${esc(f.dans)}</dd>
        ${f.villes ? `<dt>Villes</dt><dd>${f.villes.map(esc).join(", ")}</dd>` : ""}</dl>${f.plus ? `<p>${esc(f.plus)}</p>` : ""}
        <button class="ghost" data-act="fermer">← Toute la carte</button>`;
    } else if (mode === "placer") {
      c.innerHTML = placerCarteHTML("Placer les noms", `Place les noms des cours d'eau, des mers${lacs().length ? " et des lacs" : ""} : glisse chaque étiquette sur son point, ou touche l'étiquette puis le point.`);
      pl.render();
    } else {
      const it = [...FLEUVES, ...RELIEF].find((x) => x.id === q.cible);
      c.innerHTML = `<h3>Quiz</h3><p>Touche sur la carte :</p><div class="quiz-target">${esc(Maj(it.nom))}</div>${m ? `<div class="answer">${m}</div>` : ""}
        <p class="score">Score : <b>${q.ok}</b> / ${q.n}</p><button class="ghost" data-act="suivant">Autre question</button>`;
    }
  };
  const nouveauPlaceur = () => {
    const items = [...liste().map((f) => { const [x, y] = ancre(f); return { id: f.id, nom: f.nom, x, y }; }),
      ...MERS.map((m) => { const [x, y] = P(m.pos); return { id: m.id, nom: m.nom, x, y }; }),
      ...lacs().map((r) => { const [x, y] = P(r.pos); return { id: r.id, nom: r.nom, x, y }; })];
    pl = placeur({ el, items, getLayer: () => $("#gC"), getBanque: () => $("#banque"), getMsg: () => $("#msg") });
  };
  const question = () => { q.cible = tire([...liste().map((f) => f.id), ...lacs().map((r) => r.id)], q.cible); q.faux = q.juste = null; q.essais = 0; };
  const setMode = (m) => {
    mode = m; sel = null; setOn(el, "mode", m); el.querySelector(".gf-choix")?.remove(); q.juste = q.faux = null;
    if (m === "placer") nouveauPlaceur();
    if (m === "quiz") { q.ok = q.n = 0; question(); }
    draw(); card();
  };
  const nomDe = (id) => Maj([...FLEUVES, ...RELIEF].find((x) => x.id === id).nom);
  const stopDrag = dragEtiquettes(el, { aimant: 46, onPose: (b, c) => { if (mode === "placer") pl.poser(b.dataset.etq, c.dataset.cible); } });
  el.onclick = (e) => {
    if (clicApresDrag(el) || zm.panFini()) return;
    const b = e.target.closest("button");
    if (b?.dataset.mode) return setMode(b.dataset.mode);
    if (b?.dataset.niv) { niv.set(b.dataset.niv); setOn(el, "niv", b.dataset.niv); return setMode(mode); }
    if (mode === "placer" && pl.clic(e)) return;
    if (b?.dataset.act) {
      const a = b.dataset.act;
      if (a === "verif") pl.verifier(); else if (a === "sol") pl.solution(); else if (a === "reset") pl.recommencer();
      else if (a === "fermer") { sel = null; draw(); card(); }
      else if (a === "suivant") { question(); draw(); card(); }
      return;
    }
    const f = e.target.closest("[data-f]");
    if (mode === "explorer") { sel = f ? f.dataset.f : null; draw(); card(); return; }
    if (mode === "quiz" && f) {
      if (q.juste) return;
      const id = f.dataset.f; q.n++;
      if (id === q.cible) { q.ok++; q.juste = id; q.faux = null; draw(); card("Bravo ! 🎉"); clearTimeout(tm); tm = setTimeout(() => { if (mode === "quiz") { question(); draw(); card(); } }, 1300); }
      else { q.faux = id; q.essais++; draw(); card(`Non, ça c'est ${esc(nomDe(id).replace(/^./, (c) => c.toLowerCase()))}.${q.essais >= 2 ? " Le bon cours d'eau clignote." : ""}`); }
    }
  };
  el.onchange = (e) => {
    if (e.target.id === "gfRel") { relief = e.target.checked; draw(); }
    if (e.target.id === "gfVil") { villes = e.target.checked; draw(); }
  };
  setMode("explorer");
  return () => { stopDrag(); stopEch(); zm.cleanup(); clearTimeout(tm); };
}

export const GEO_FRANCE = [
  { id: "geo-relief", nom: "Relief de France", icone: "⛰️", couleur: "#c9ecd4", desc: "La carte verte : massifs, plaines, altitudes", niveaux: ["CE2", "CM1", "CM2"], mount: relief },
  { id: "geo-departements", nom: "Départements", icone: "🧩", couleur: "#ffe3a3", desc: "Les 101 départements, quiz et mon département", niveaux: ["CE2", "CM1", "CM2"], mount: departements },
  { id: "geo-fleuves", nom: "Fleuves de France", icone: "🌊", couleur: "#cfe6ff", desc: "Fleuves, affluents, mers et océan", niveaux: ["CE2", "CM1", "CM2"], mount: fleuves },
];
