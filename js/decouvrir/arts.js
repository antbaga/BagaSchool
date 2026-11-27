// À découvrir : histoire des arts (CE1 → CM2).
// 1. Musée de la classe : galerie par période, fiche d'œuvre projetable, image zoomable ; jeu « Œuvre mystère ».
// 2. Les mots pour en parler : vocabulaire illustré de schémas SVG originaux ; associer mot ↔ définition ; étiquettes sur l'œuvre.
// 3. Qui a fait quoi ? : quiz œuvre ↔ artiste ↔ période, et frise à compléter.
// Images : chargées par le navigateur depuis fr.wikipedia.org (image principale de l'article) + crédits Wikimedia Commons,
// mémorisées dans localStorage. Repli propre (carte illustrée) si hors ligne ou si l'image manque : tout reste utilisable.
import { esc, shuffle, niveauxHTML, niveauMemo, bravo, dragEtiquettes, clicApresDrag, zoomSVG, scoreHTML } from "./kit.js";
import { PERIODES, TYPES, OEUVRES } from "../data/decouvrir/arts-oeuvres.js";
import { VOCAB, SCHEMAS, ZONES } from "../data/decouvrir/arts-vocab.js";

const NIVS = ["CE1", "CE2", "CM1", "CM2"];
const rang = (n) => NIVS.indexOf(n);
const auNiveau = (list, niv) => list.filter((o) => rang(o.niv || "CE1") <= rang(niv));
const PER = Object.fromEntries(PERIODES.map((p) => [p.id, p]));
const OE = Object.fromEntries(OEUVRES.map((o) => [o.id, o]));
const minus = (t) => t.charAt(0).toLowerCase() + t.slice(1);
const chrono = (l) => [...l].sort((a, b) => a.an - b.an);
const SOURCE = `Photos : Wikipédia et Wikimedia Commons (auteur et licence sous chaque image). Textes et schémas : BagaSchool. Repères : programmes 2026.`;
const OUVRIR = "bagaschool-arts-ouvrir";

// ---------- Images (Wikipédia → Commons), avec cache localStorage ----------
const API_WP = "https://fr.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail|name&pithumbsize=1280&titles=";
const API_COMMONS = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=extmetadata|url&iiextmetadatafilter=Artist|LicenseShortName|Credit&titles=";
const CLE_IMG = "bagaschool-arts-img-v1";
const DUREE = 30 * 24 * 3600e3; // on revérifie au bout de 30 jours (si en ligne)
let memo = null;
const lireMemo = () => memo || (memo = (() => { try { return JSON.parse(localStorage.getItem(CLE_IMG)) || {}; } catch { return {}; } })());
const ecrireMemo = () => { try { localStorage.setItem(CLE_IMG, JSON.stringify(memo)); } catch {} };
const enCours = new Map(), echecs = new Set();
let panneJusqua = 0; // après une coupure réseau, on n'insiste pas pendant une minute
const texteBrut = (html) => { try { return (new DOMParser().parseFromString(String(html || ""), "text/html").body.textContent || "").replace(/\s+/g, " ").trim(); } catch { return ""; } };
const sur = (url, hote) => { try { const u = new URL(url); return u.protocol === "https:" && u.hostname === hote ? u.href : null; } catch { return null; } };
async function lireJSON(url, ms = 9000) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { signal: ac.signal, credentials: "omit" }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
async function chercherCredit(fichier) {
  const j = await lireJSON(API_COMMONS + encodeURIComponent("File:" + fichier));
  const pg = Object.values(j?.query?.pages || {})[0]; const ii = pg?.imageinfo?.[0]; if (!ii) return null;
  const m = ii.extmetadata || {};
  return {
    licence: texteBrut(m.LicenseShortName?.value).slice(0, 60) || "",
    photo: texteBrut(m.Artist?.value).slice(0, 90) || "",
    page: sur(ii.descriptionurl, "commons.wikimedia.org") || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fichier)}`,
  };
}
// → Promise<{ url, w, h, fichier, credit } | null>
export function imageOeuvre(o) {
  const m = lireMemo(), c = m[o.id];
  const enLigne = navigator.onLine !== false;
  if (c && (!enLigne || Date.now() - c.t < DUREE)) {
    if (!c.credit && enLigne && !enCours.has("c:" + o.id)) { // crédits manquants : on réessaie sans bloquer
      enCours.set("c:" + o.id, 1);
      chercherCredit(c.fichier).then((cr) => { if (cr) { c.credit = cr; ecrireMemo(); } }).catch(() => {}).finally(() => enCours.delete("c:" + o.id));
    }
    return Promise.resolve(c);
  }
  if (!enLigne || echecs.has(o.id) || Date.now() < panneJusqua) return Promise.resolve(c || null);
  if (enCours.has(o.id)) return enCours.get(o.id);
  const p = (async () => {
    for (const titre of o.wiki) {
      let j;
      try { j = await lireJSON(API_WP + encodeURIComponent(titre)); } catch { panneJusqua = Date.now() + 60e3; break; } // réseau coupé : inutile d'insister
      const pg = Object.values(j?.query?.pages || {})[0];
      const url = sur(pg?.thumbnail?.source, "upload.wikimedia.org");
      if (!pg || "missing" in pg || !url || !pg.pageimage) continue;
      const info = { url, w: +pg.thumbnail.width || 0, h: +pg.thumbnail.height || 0, fichier: pg.pageimage, titre, t: Date.now(), credit: null };
      try { info.credit = await chercherCredit(info.fichier); } catch {}
      m[o.id] = info; ecrireMemo();
      return info;
    }
    echecs.add(o.id);
    return c || null;
  })().finally(() => enCours.delete(o.id));
  enCours.set(o.id, p);
  return p;
}
// Vignette légère : même fichier en 330 px de large (taille standard des miniatures Wikimedia).
const vignette = (url) => (/\/thumb\/.+\/\d+px-[^/]+$/.test(url) ? url.replace(/\/(\d+)px-([^/]+)$/, "/330px-$2") : null);

const repliHTML = (o, cache = false) => `<div class="ak-repli" style="--c:${PER[o.per].c};--f:${PER[o.per].fonce}"><span class="ak-repli-ico">${TYPES[o.type].ico}</span><b>${cache ? "?" : esc(o.court)}</b></div>`;
const imgHTML = (o, { cls = "", cache = false } = {}) => `<div class="ak-img ${cls}" data-img="${o.id}"${cache ? ' data-cache="1"' : ""}>${repliHTML(o, cache)}</div>`;
function remplirImages(root, petit = true) {
  root.querySelectorAll(".ak-img[data-img]:not([data-fait])").forEach((box) => {
    box.dataset.fait = "1";
    const o = OE[box.dataset.img];
    imageOeuvre(o).then((info) => {
      if (!info || !box.isConnected) return;
      const im = new Image(); im.alt = box.dataset.cache ? "Œuvre mystère" : o.titre; im.draggable = false; im.decoding = "async";
      const v = petit && vignette(info.url);
      im.onload = () => box.classList.add("ok");
      im.onerror = () => { if (v && im.src !== info.url) im.src = info.url; else im.remove(); };
      im.src = v || info.url;
      box.appendChild(im);
    });
  });
}
function creditHTML(o, info) {
  const auteur = o.qui;
  if (!info) return `<span class="ak-cred-off">Image non disponible (hors ligne ?) : la carte illustrée la remplace.</span>`;
  const cr = info.credit;
  const pd = cr && /domaine public|public domain|^pd|cc0/i.test(cr.licence);
  const photo = !cr ? "Photo : Wikimedia Commons" : pd ? `Photo : ${esc(cr.licence)}` : `Photo : ${esc(cr.photo || "voir Commons")}${cr.licence ? ` — ${esc(cr.licence)}` : ""}`;
  const lien = sur(cr?.page, "commons.wikimedia.org") || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(info.fichier)}`;
  return `<span>Œuvre : ${esc(auteur)}</span> · <span>${photo}</span> · <a href="${esc(lien)}" target="_blank" rel="noopener">Wikimedia Commons ↗</a>`;
}
// Grande image zoomable (SVG + zoomSVG du kit). Retourne une fonction de nettoyage.
function grandeImage(box, o, onCredit) {
  let fin = null, mort = false;
  box.innerHTML = repliHTML(o) + `<p class="ak-charge">Chargement de l'image…</p>`;
  imageOeuvre(o).then((info) => {
    if (mort || !box.isConnected) return;
    const charge = box.querySelector(".ak-charge");
    if (!info) { charge?.remove(); onCredit?.(null); return; }
    const im = new Image();
    im.onload = () => {
      if (mort || !box.isConnected) return;
      const w = im.naturalWidth || info.w || 1000, h = im.naturalHeight || info.h || 1000;
      box.innerHTML = `<svg class="ak-zoomsvg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(o.titre)}"><image href="${esc(info.url)}" width="${w}" height="${h}"/></svg>`;
      const z = zoomSVG(box.querySelector("svg"), { max: 6 });
      box.insertAdjacentHTML("beforeend", z.boutonsHTML + `<p class="ak-astuce">Pince avec deux doigts ou utilise la molette pour zoomer</p>`);
      z.lier(box); fin = z.cleanup;
      onCredit?.(info);
    };
    im.onerror = () => { charge?.remove(); onCredit?.(null); };
    im.src = info.url;
  });
  return () => { mort = true; fin?.(); };
}

// ---------- Étiquettes : glisser-déposer ET toucher-toucher ----------
// Étiquettes [data-etq][data-v] (data-v = valeur de la bonne cible, "" pour un leurre) ; cibles [data-cible][data-v] avec .ak-slot ;
// la banque est .ak-banque[data-cible]. data-cap : nombre d'étiquettes max (0 = illimité, défaut 1).
function placeur(root) {
  let sel = null;
  const banque = () => root.querySelector(".ak-banque");
  const slot = (c) => c.querySelector(".ak-slot") || c;
  const effacer = () => root.querySelectorAll("[data-etq]").forEach((x) => x.classList.remove("good", "bad"));
  const poser = (etq, cible) => {
    etq.classList.remove("on"); sel = null; effacer();
    if (!cible || cible.classList.contains("ak-banque")) { banque().appendChild(etq); return; }
    const s = slot(cible), cap = +(cible.dataset.cap ?? 1);
    if (cap && s.querySelectorAll("[data-etq]").length >= cap) { const old = s.querySelector("[data-etq]"); if (old && old !== etq) banque().appendChild(old); }
    s.appendChild(etq);
  };
  const finDrag = dragEtiquettes(root, { onPose: (etq, c) => poser(etq, c) });
  return {
    cleanup: finDrag,
    // à appeler depuis el.onclick ; renvoie vrai si le clic a été traité
    clic(e) {
      if (clicApresDrag(root)) return true;
      const etq = e.target.closest("[data-etq]");
      if (etq && root.contains(etq)) {
        const cibleEtq = etq.closest("[data-cible]:not(.ak-banque)");
        if (sel && sel !== etq && cibleEtq) { poser(sel, cibleEtq); return true; }
        if (sel === etq) { etq.classList.remove("on"); sel = null; return true; }
        sel?.classList.remove("on"); sel = etq; etq.classList.add("on"); return true;
      }
      const c = e.target.closest("[data-cible]");
      if (c && root.contains(c) && sel) { poser(sel, c); return true; }
      return false;
    },
    verifier() {
      let ok = 0, faux = 0; const total = root.querySelectorAll("[data-etq]:not([data-v=''])").length;
      root.querySelectorAll("[data-cible]:not(.ak-banque) [data-etq]").forEach((x) => {
        const bon = x.dataset.v !== "" && x.closest("[data-cible]").dataset.v === x.dataset.v;
        x.classList.toggle("good", bon); x.classList.toggle("bad", !bon); bon ? ok++ : faux++;
      });
      return { ok, total, faux, fini: ok === total && !faux };
    },
    solution() {
      sel = null;
      root.querySelectorAll("[data-etq]").forEach((x) => {
        x.classList.remove("on", "bad");
        const c = x.dataset.v !== "" && root.querySelector(`[data-cible]:not(.ak-banque)[data-v="${x.dataset.v}"]`);
        if (c) { slot(c).appendChild(x); x.classList.add("good"); } else { banque().appendChild(x); x.classList.remove("good"); }
      });
    },
  };
}

// ======================================================================
// 1. MUSÉE DE LA CLASSE
// ======================================================================
function musee(el) {
  const nm = niveauMemo("arts-musee", NIVS, "CE2");
  let mode = "galerie", filtre = "tout", oeuvre = null, finImg = null, my = null;
  const liste = () => chrono(auNiveau(OEUVRES, nm.get()));
  el.innerHTML = `
    <div class="tool-top wrap">${niveauxHTML(NIVS, nm.get())}
      <div class="seg rc-keep" data-grp="mode"><button data-mode="galerie" class="on">🖼️ Galerie</button><button data-mode="mystere">🔎 Œuvre mystère</button></div>
    </div>
    <div class="ak-vue" id="akv"></div>
    <p class="dk-source">${SOURCE}</p>`;
  const vue = el.querySelector("#akv");
  const stopImg = () => { finImg?.(); finImg = null; };

  const galerie = () => {
    stopImg(); oeuvre = null;
    const l = liste();
    const parPer = PERIODES.map((p) => [p, l.filter((o) => o.per === p.id)]).filter(([, os]) => os.length);
    const carte = (o) => `<button class="ak-carte" data-o="${o.id}">${imgHTML(o)}<span class="ak-carte-t">${esc(o.court)}</span><span class="ak-carte-s">${o.auteur || o.qui.length < 36 ? esc(o.auteur || o.qui) + " · " : ""}${esc(o.date)}</span></button>`;
    vue.innerHTML = `
      <div class="ak-frise rc-board" role="group" aria-label="Périodes">
        <button class="ak-fr-tout ${filtre === "tout" ? "on" : ""}" data-per="tout">Toutes<b>${l.length}</b></button>
        ${parPer.map(([p, os]) => `<button class="ak-fr ${filtre === p.id ? "on" : ""}" data-per="${p.id}" style="--c:${p.c};--f:${p.fonce}"><span>${p.court}</span><small>${p.dates}</small><b>${os.length}</b></button>`).join("")}
      </div>
      <div class="ak-galerie rc-board">
        ${parPer.filter(([p]) => filtre === "tout" || filtre === p.id).map(([p, os]) => `<section class="ak-sect" style="--c:${p.c};--f:${p.fonce}"><h3 class="ak-sect-t">${p.nom} <small>${p.dates}</small></h3><div class="ak-grille">${os.map(carte).join("")}</div></section>`).join("")}
      </div>
      <p class="muted center">Touche une œuvre pour ouvrir sa fiche, à projeter en grand.</p>`;
    remplirImages(vue);
  };

  const fiche = (o) => {
    stopImg(); oeuvre = o;
    const l = liste(), i = l.indexOf(o), n = rang(nm.get()), p = PER[o.per];
    const txt = o.txt.slice(0, n === 0 ? 2 : 3), obs = o.obs.slice(0, n === 0 ? 2 : n === 1 ? 3 : 4);
    vue.innerHTML = `
      <div class="ak-nav rc-keep"><button class="pill rc-keep" data-act="galerie">← Galerie</button>
        <span class="ak-nav-g"><button class="pill rc-keep" data-act="prec" aria-label="Œuvre précédente">◀</button><span class="ak-pos">${i >= 0 ? `${i + 1} / ${l.length}` : ""}</span><button class="pill rc-keep" data-act="suiv" aria-label="Œuvre suivante">▶</button></span></div>
      <div class="explore ak-fiche">
        <div class="explore-main ak-grand rc-board" id="akg"></div>
        <aside class="explore-card ak-info">
          <div class="ak-badges"><span class="ak-badge" style="--c:${p.c};--f:${p.fonce}">${p.nom}</span><span class="ec-type">${TYPES[o.type].ico} ${esc(TYPES[o.type].nom)}</span></div>
          <h3>${esc(o.titre)}</h3>
          <dl class="ak-dl"><dt>Qui ?</dt><dd>${esc(o.qui)}</dd><dt>Quand ?</dt><dd>${esc(o.date)}</dd><dt>Comment ?</dt><dd>${esc(o.technique)}</dd><dt>Où ?</dt><dd>${esc(o.lieu)}</dd></dl>
          ${txt.map((t) => `<p>${esc(t)}</p>`).join("")}
          <h4 class="ak-h4">👀 Ce qu'on peut observer</h4><ul class="ak-obs">${obs.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          ${n >= 3 && o.plus ? `<p class="ak-plus">💡 ${esc(o.plus)}</p>` : ""}
          <p class="ak-credit" id="akc"></p>
        </aside>
      </div>`;
    finImg = grandeImage(vue.querySelector("#akg"), o, (info) => { const c = vue.querySelector("#akc"); if (c) c.innerHTML = creditHTML(o, info); });
  };
  const bouger = (d) => { const l = liste(); if (!oeuvre) return; const i = l.indexOf(oeuvre); fiche(l[(i < 0 ? 0 : i + d + l.length) % l.length]); };

  // --- Œuvre mystère ---
  const NB = 5, FLOU = [26, 18, 11, 6, 3];
  const indicesDe = (o) => [`C'est ${TYPES[o.type].nom}.`, `Période : ${PER[o.per].nom} (${PER[o.per].dates}).`, `Date : ${o.date}.`, o.indice, ...(["peinture", "sculpture"].includes(o.type) ? [`On peut la voir ici : ${o.lieu}.`] : [])];
  const nouveauMystere = () => { my = { tours: shuffle(liste()).slice(0, NB), i: 0, score: 0, max: 0 }; tourMystere(); };
  const tourMystere = () => {
    const o = my.tours[my.i]; const autres = shuffle(liste().filter((x) => x !== o)).slice(0, nm.get() === "CE1" ? 2 : 3);
    Object.assign(my, { k: 1, rep: null, choix: shuffle([o, ...autres]), ind: indicesDe(o) });
    dessinerMystere();
  };
  const dessinerMystere = () => {
    stopImg();
    if (my.i >= my.tours.length) {
      const pct = my.max ? my.score / my.max : 0;
      vue.innerHTML = `<div class="ak-fin rc-board"><div class="ak-fin-ico">${pct >= 0.6 ? "🏆" : "🖼️"}</div><h3>Partie terminée !</h3>${scoreHTML(my.score, my.max)}<p class="muted">Moins on utilise d'indices, plus on gagne de points.</p><button class="big-btn rc-keep" data-act="rejouer">🔄 Rejouer</button></div>`;
      if (pct >= 0.6) bravo(el, "Bravo, fins connaisseurs !");
      return;
    }
    const o = my.tours[my.i], fini = !!my.rep, pts = Math.max(1, 5 - my.k);
    vue.innerHTML = `
      <div class="explore ak-myst">
        <div class="explore-main rc-board ak-myst-img">${imgHTML(o, { cls: "ak-flou" + (fini ? " net" : ""), cache: !fini })}</div>
        <aside class="explore-card">
          <p class="ak-tour">Œuvre ${my.i + 1} / ${my.tours.length} · Score : <b>${my.score}</b></p>
          <h3>${fini ? esc(o.titre) : "Quelle est cette œuvre ?"}</h3>
          <ol class="ak-indices">${my.ind.slice(0, fini ? my.ind.length : my.k).map((t) => `<li>${esc(t)}</li>`).join("")}</ol>
          ${!fini && my.k < my.ind.length ? `<button class="pill rc-keep" data-act="indice">💡 Un indice de plus <small>(${pts - 1 || 1} pt${pts - 1 > 1 ? "s" : ""} ensuite)</small></button>` : ""}
          ${!fini ? `<p class="hint">Bonne réponse maintenant : ${pts} point${pts > 1 ? "s" : ""}</p>` : ""}
          <div class="ak-choix rc-board">${my.choix.map((c) => `<button class="ak-rep ${fini ? (c === o ? "good" : c.id === my.rep ? "bad" : "") : ""}" data-rep="${c.id}" ${fini ? "disabled" : ""}>${esc(c.court)}</button>`).join("")}</div>
          ${fini ? `<p class="answer">${my.rep === o.id ? `✅ Bravo ! +${my.gain} point${my.gain > 1 ? "s" : ""}` : `❌ C'était « ${esc(o.court)} ».`} ${esc(o.qui)}, ${esc(minus(o.date))}.</p><button class="big-btn rc-keep" data-act="suite">${my.i + 1 < my.tours.length ? "Œuvre suivante ▶" : "Voir le score"}</button>` : ""}
        </aside>
      </div>`;
    const box = vue.querySelector(".ak-flou"); box.style.setProperty("--flou", (fini ? 0 : FLOU[Math.min(my.k - 1, FLOU.length - 1)]) + "px");
    remplirImages(vue, false);
  };

  const dessiner = () => {
    el.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
    if (mode === "galerie") oeuvre ? fiche(oeuvre) : galerie(); else nouveauMystere();
  };
  el.onclick = (e) => {
    const b = e.target.closest("button, [data-o]"); if (!b || !el.contains(b)) return;
    if (b.dataset.niv) { nm.set(b.dataset.niv); el.querySelectorAll("[data-niv]").forEach((x) => x.classList.toggle("on", x === b)); if (oeuvre && !liste().includes(oeuvre)) oeuvre = null; dessiner(); return; }
    if (b.dataset.mode) { mode = b.dataset.mode; oeuvre = null; dessiner(); return; }
    if (b.dataset.per) { filtre = b.dataset.per; galerie(); return; }
    if (b.dataset.o) { fiche(OE[b.dataset.o]); vue.scrollIntoView?.({ block: "nearest" }); return; }
    if (b.dataset.rep && my && !my.rep) {
      const o = my.tours[my.i]; my.rep = b.dataset.rep; my.gain = Math.max(1, 5 - my.k); my.max += 4;
      if (my.rep === o.id) my.score += my.gain; dessinerMystere(); return;
    }
    const a = b.dataset.act;
    if (a === "galerie") galerie();
    else if (a === "prec") bouger(-1);
    else if (a === "suiv") bouger(1);
    else if (a === "indice") { my.k = Math.min(my.ind.length, my.k + 1); dessinerMystere(); }
    else if (a === "suite") { my.i++; if (my.i < my.tours.length) tourMystere(); else dessinerMystere(); }
    else if (a === "rejouer") nouveauMystere();
  };
  const touche = (e) => { if (mode === "galerie" && oeuvre && !e.target.closest?.("input,textarea,select")) { if (e.key === "ArrowRight") bouger(1); if (e.key === "ArrowLeft") bouger(-1); } };
  window.addEventListener("keydown", touche);
  let ouvrir = null; try { ouvrir = sessionStorage.getItem(OUVRIR); sessionStorage.removeItem(OUVRIR); } catch {}
  if (ouvrir && OE[ouvrir]) { if (!liste().includes(OE[ouvrir])) { nm.set(OE[ouvrir].niv); el.querySelectorAll("[data-niv]").forEach((x) => x.classList.toggle("on", x.dataset.niv === nm.get())); } oeuvre = OE[ouvrir]; }
  dessiner();
  return () => { stopImg(); window.removeEventListener("keydown", touche); };
}

// ======================================================================
// 2. LES MOTS POUR EN PARLER
// ======================================================================
function mots(el) {
  const nm = niveauMemo("arts-mots", NIVS, "CE2");
  let mode = "explorer", sel = null, dessins = true, tableau = "chasseurs", pl = null, finImg = null, serie = 0;
  const NB = { CE1: 4, CE2: 6, CM1: 8, CM2: 8 };
  const liste = () => auNiveau(VOCAB, nm.get());
  el.innerHTML = `
    <div class="tool-top wrap">${niveauxHTML(NIVS, nm.get())}
      <div class="seg rc-keep" data-grp="mode"><button data-mode="explorer" class="on">📖 Explorer</button><button data-mode="associer">🧩 Associer</button><button data-mode="oeuvre">🖼️ Sur l'œuvre</button></div>
    </div>
    <div class="ak-vue" id="akv"></div>
    <p class="dk-source">Schémas dessinés pour BagaSchool. Photos : Wikipédia / Wikimedia Commons (licence sous l'image).</p>`;
  const vue = el.querySelector("#akv");
  const stop = () => { pl?.cleanup(); pl = null; finImg?.(); finImg = null; };

  const explorer = () => {
    stop(); const l = liste(); if (!l.includes(sel)) sel = l[0];
    const v = sel, exs = (v.ex || []).map((id) => OE[id]).filter(Boolean);
    vue.innerHTML = `
      <div class="explore ak-mots">
        <div class="ak-motsgrille rc-board">${l.map((x) => `<button class="ak-mot ${x === v ? "on" : ""}" data-mot="${x.id}">${SCHEMAS[x.id] || ""}<span>${esc(x.mot)}</span>${x.niv === nm.get() && nm.get() !== "CE1" ? `<i class="ak-new">nouveau</i>` : ""}</button>`).join("")}</div>
        <aside class="explore-card ak-motcarte">
          <div class="ak-grandschema">${SCHEMAS[v.id] || ""}</div>
          <h3>${esc(v.mot)}</h3>
          <p class="ak-def">${esc(v.def)}</p>
          ${exs.length ? `<h4 class="ak-h4">🖼️ Pour l'observer</h4><div class="ak-exs">${exs.map((o) => `<button class="ak-ex" data-voir="${o.id}">${imgHTML(o, { cls: "mini" })}<span>${esc(o.court)}</span></button>`).join("")}</div>` : ""}
        </aside>
      </div>`;
    remplirImages(vue);
  };

  const associer = () => {
    stop(); serie++;
    const l = liste(), n = NB[nm.get()];
    const neufs = shuffle(l.filter((x) => x.niv === nm.get())), anciens = shuffle(l.filter((x) => x.niv !== nm.get()));
    const a = neufs.slice(0, Math.ceil(n / 2)), b = anciens.slice(0, n - a.length);
    const pris = shuffle([...a, ...b, ...neufs.slice(a.length, n - b.length)]);
    vue.innerHTML = `
      <div class="ak-jeu rc-board ${dessins ? "" : "sans-dessins"}">
        <p class="ak-consigne">Place chaque mot sur sa définition (glisse l'étiquette, ou touche le mot puis la case).</p>
        <div class="ak-banque dk-banque" data-cible data-v="">${shuffle(pris).map((x) => `<button class="dk-etq" data-etq data-v="${x.id}">${esc(x.mot)}</button>`).join("")}</div>
        <div class="ak-defs">${pris.map((x) => `<div class="ak-defc" data-cible data-v="${x.id}"><div class="ak-defschema">${SCHEMAS[x.id] || ""}</div><p>${esc(x.def)}</p><div class="ak-slot"></div></div>`).join("")}</div>
      </div>
      <div class="tool-top wrap rc-keep ak-actions">
        <label class="check rc-keep"><input type="checkbox" id="akdes" ${dessins ? "checked" : ""}> 🖍️ Dessins</label>
        <button class="big-btn rc-keep" data-act="verif">✔ Vérifier</button><button class="pill rc-keep" data-act="sol">💡 Solution</button><button class="pill rc-keep" data-act="nouv">🔄 Nouvelle série</button>
      </div><div id="akres" class="center"></div>`;
    pl = placeur(vue.querySelector(".ak-jeu"));
  };

  const surOeuvre = () => {
    stop();
    const Z = ZONES.find((z) => z.oeuvre === tableau) || ZONES[0], o = OE[Z.oeuvre], niv = nm.get();
    const zones = Z.zones.filter((z) => rang(z.niv || "CE1") <= rang(niv));
    const leurres = Z.leurres.slice(0, rang(niv) >= 3 ? 2 : rang(niv) >= 2 ? 1 : 0);
    const etqs = shuffle([...zones.map((z, i) => [z.mot, String(i)]), ...leurres.map((m) => [m, ""])]);
    vue.innerHTML = `
      <div class="seg ak-tableaux rc-keep">${ZONES.map((z) => `<button data-tab="${z.oeuvre}" class="${z.oeuvre === Z.oeuvre ? "on" : ""}">${esc(OE[z.oeuvre].court)}</button>`).join("")}</div>
      <div class="ak-jeu ak-surjeu rc-board">
        <div class="ak-zonewrap"><div class="ak-zonecadre" style="--r:${o.ratio}">
          <div class="ak-zonefond">${Z.schema}</div>
          ${zones.map((z, i) => `<div class="ak-zone" data-cible data-v="${i}" style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%"><span class="ak-zn">${i + 1}</span><div class="ak-slot"></div></div>`).join("")}
        </div></div>
        <div class="ak-cote">
          <p class="ak-consigne">Place les étiquettes sur les cadres de « ${esc(o.titre)} » (${esc(o.qui)}, ${esc(o.date)}).</p>
          <div class="ak-banque dk-banque" data-cible data-v="">${etqs.map(([m, v]) => `<button class="dk-etq" data-etq data-v="${v}">${esc(m)}</button>`).join("")}</div>
          ${leurres.length ? `<p class="hint">Attention : ${leurres.length > 1 ? `${leurres.length} étiquettes ne servent pas` : "une étiquette ne sert pas"} !</p>` : ""}
          <ol class="ak-infos" hidden>${zones.map((z) => `<li><b>${esc(z.mot)}</b> : ${esc(z.info)}</li>`).join("")}</ol>
          <p class="ak-credit" id="akc"><span class="ak-cred-off">Chargement de l'image…</span></p>
        </div>
      </div>
      <div class="tool-top wrap rc-keep ak-actions"><button class="big-btn rc-keep" data-act="verif">✔ Vérifier</button><button class="pill rc-keep" data-act="sol">💡 Solution</button><button class="pill rc-keep" data-act="refaire">🔄 Recommencer</button></div>
      <div id="akres" class="center"></div>`;
    pl = placeur(vue.querySelector(".ak-surjeu"));
    let mort = false; finImg = () => { mort = true; };
    imageOeuvre(o).then((info) => {
      if (mort || !vue.isConnected) return;
      const c = vue.querySelector("#akc");
      if (!info) { if (c) c.innerHTML = `<span class="ak-cred-off">Image indisponible (hors ligne ?) : voici un schéma simplifié du tableau.</span>`; return; }
      const im = new Image();
      im.onload = () => {
        if (mort || !vue.isConnected) return;
        const r = (im.naturalWidth || info.w) / (im.naturalHeight || info.h || 1);
        if (Math.abs(r / o.ratio - 1) > 0.1) { if (c) c.innerHTML = `<span class="ak-cred-off">L'image trouvée n'a pas le format du tableau : on garde le schéma simplifié.</span>`; return; }
        im.alt = o.titre; im.draggable = false; im.className = "ak-zoneimg";
        const f = vue.querySelector(".ak-zonefond"); f.innerHTML = ""; f.appendChild(im);
        if (c) c.innerHTML = creditHTML(o, info);
      };
      im.onerror = () => { if (c && !mort) c.innerHTML = `<span class="ak-cred-off">Image indisponible : voici un schéma simplifié du tableau.</span>`; };
      im.src = info.url;
    });
  };

  const dessiner = () => {
    el.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
    ({ explorer, associer, oeuvre: surOeuvre })[mode]();
  };
  const resultat = (html) => { const r = vue.querySelector("#akres"); if (r) r.innerHTML = html; };
  el.onclick = (e) => {
    if (pl?.clic(e)) return;
    const b = e.target.closest("button"); if (!b || !el.contains(b)) return;
    if (b.dataset.niv) { nm.set(b.dataset.niv); el.querySelectorAll("[data-niv]").forEach((x) => x.classList.toggle("on", x === b)); dessiner(); return; }
    if (b.dataset.mode) { mode = b.dataset.mode; dessiner(); return; }
    if (b.dataset.mot) { sel = VOCAB.find((x) => x.id === b.dataset.mot); explorer(); if (innerWidth <= 820) vue.querySelector(".ak-motcarte")?.scrollIntoView?.({ behavior: "smooth", block: "start" }); return; }
    if (b.dataset.tab) { tableau = b.dataset.tab; surOeuvre(); return; }
    if (b.dataset.voir) { try { sessionStorage.setItem(OUVRIR, b.dataset.voir); } catch {} location.hash = "#/outils/arts-musee"; return; }
    const a = b.dataset.act;
    if (a === "verif") {
      const r = pl.verifier();
      resultat(scoreHTML(r.ok, r.total) + (r.fini ? "" : r.faux ? `<p class="muted">Les étiquettes en rouge ne sont pas à la bonne place.</p>` : `<p class="muted">Il reste des étiquettes à placer.</p>`));
      if (r.fini) { bravo(el); vue.querySelector(".ak-infos")?.removeAttribute("hidden"); }
    }
    if (a === "sol") { pl.solution(); resultat(""); vue.querySelector(".ak-infos")?.removeAttribute("hidden"); }
    if (a === "nouv") associer();
    if (a === "refaire") surOeuvre();
  };
  el.onchange = (e) => { if (e.target.id === "akdes") { dessins = e.target.checked; vue.querySelector(".ak-jeu")?.classList.toggle("sans-dessins", !dessins); } };
  dessiner();
  return () => stop();
}

// ======================================================================
// 3. QUI A FAIT QUOI ?
// ======================================================================
function quiz(el) {
  const nm = niveauMemo("arts-quiz", NIVS, "CE2");
  let mode = "quiz", q = null, pl = null;
  const liste = () => auNiveau(OEUVRES, nm.get());
  el.innerHTML = `
    <div class="tool-top wrap">${niveauxHTML(NIVS, nm.get())}
      <div class="seg rc-keep" data-grp="mode"><button data-mode="quiz" class="on">❓ Quiz</button><button data-mode="frise">📏 Frise</button></div>
    </div>
    <div class="ak-vue" id="akv"></div>
    <p class="dk-source">${SOURCE}</p>`;
  const vue = el.querySelector("#akv");
  const stop = () => { pl?.cleanup(); pl = null; };

  // --- Quiz ---
  const NBQ = { CE1: 6, CE2: 8, CM1: 10, CM2: 10 }, NBC = { CE1: 3, CE2: 4, CM1: 4, CM2: 4 };
  const ARTISTES = new Set(["a peint", "a sculpté", "a dessiné"]);
  const fabriquer = () => {
    const l = liste(), niv = nm.get(), nc = NBC[niv], qs = [];
    const autresTextes = (bon, pool) => shuffle([...new Set(pool.filter((t) => t && t !== bon))]).slice(0, nc - 1);
    for (const o of shuffle(l)) {
      const types = ["periode"];
      if (o.auteur) types.push("auteur", "auteur");
      if (o.qcm) types.push("qcm", "qcm");
      if (rang(niv) >= 2 && o.auteur && ARTISTES.has(o.verbe)) types.push("inverse");
      if (rang(niv) >= 3 && ["peinture", "sculpture"].includes(o.type)) types.push("lieu");
      const t = types[Math.floor(Math.random() * types.length)];
      if (t === "periode") {
        const bon = PER[o.per].nom; const faux = shuffle(PERIODES.map((p) => p.nom).filter((n) => n !== bon)).slice(0, nc - 1);
        qs.push({ o, txt: `À quelle période appartient « ${o.titre} » ?`, bon, choix: shuffle([bon, ...faux]), img: true });
      } else if (t === "auteur") {
        const meme = OEUVRES.filter((x) => x.auteur && ARTISTES.has(x.verbe) === ARTISTES.has(o.verbe)).map((x) => x.auteur);
        let faux = autresTextes(o.auteur, meme); if (faux.length < nc - 1) faux = autresTextes(o.auteur, OEUVRES.map((x) => x.auteur));
        qs.push({ o, txt: `Qui ${o.verbe} « ${o.titre} » ?`, bon: o.auteur, choix: shuffle([o.auteur, ...faux]), img: true });
      } else if (t === "qcm") {
        qs.push({ o, txt: o.qcm.q, bon: o.qcm.r, choix: shuffle([o.qcm.r, ...shuffle(o.qcm.faux).slice(0, nc - 1)]), img: true });
      } else if (t === "inverse") {
        const faux = shuffle(l.filter((x) => x.auteur !== o.auteur)).slice(0, nc - 1);
        qs.push({ o, txt: `Laquelle de ces œuvres est de ${o.auteur} ?`, bon: o.id, choix: shuffle([o, ...faux]).map((x) => x.id), oeuvres: true });
      } else {
        const faux = autresTextes(o.lieu, OEUVRES.filter((x) => ["peinture", "sculpture"].includes(x.type)).map((x) => x.lieu));
        qs.push({ o, txt: `Où peut-on voir « ${o.titre} » ?`, bon: o.lieu, choix: shuffle([o.lieu, ...faux]), img: true });
      }
      if (qs.length >= NBQ[niv]) break;
    }
    return { qs, i: 0, score: 0, rep: null };
  };
  const dessinerQuiz = () => {
    stop();
    if (q.i >= q.qs.length) {
      const pct = q.score / q.qs.length;
      vue.innerHTML = `<div class="ak-fin rc-board"><div class="ak-fin-ico">${pct >= 0.7 ? "🏆" : "🎨"}</div><h3>Quiz terminé !</h3>${scoreHTML(q.score, q.qs.length)}<button class="big-btn rc-keep" data-act="rejouer">🔄 Nouveau quiz</button></div>`;
      if (pct >= 0.7) bravo(el);
      return;
    }
    const Q = q.qs[q.i], fini = q.rep != null, o = Q.o;
    const etat = (c) => (fini ? (c === Q.bon ? "good" : c === q.rep ? "bad" : "") : "");
    vue.innerHTML = `
      <div class="ak-quiz rc-board ${Q.oeuvres ? "ak-quiz-oe" : ""}">
        <p class="ak-tour">Question ${q.i + 1} / ${q.qs.length} · Score : <b>${q.score}</b></p>
        <div class="quiz-target">${esc(Q.txt)}</div>
        ${Q.img ? `<div class="ak-qimg">${imgHTML(o)}</div>` : ""}
        <div class="ak-choix ${Q.oeuvres ? "ak-choix-oe" : ""}">${Q.choix.map((c) => Q.oeuvres
          ? `<button class="ak-rep ak-rep-oe ${etat(c)}" data-rep="${c}" ${fini ? "disabled" : ""}>${imgHTML(OE[c])}<span>${esc(OE[c].court)}</span></button>`
          : `<button class="ak-rep ${etat(c)}" data-rep="${esc(c)}" ${fini ? "disabled" : ""}>${esc(c)}</button>`).join("")}</div>
        ${fini ? `<p class="answer">${q.rep === Q.bon ? "✅ Bravo !" : "❌ Pas tout à fait."} « ${esc(o.titre)} » : ${esc(o.qui)}, ${esc(minus(o.date))} (${PER[o.per].nom}).</p>
          <button class="big-btn rc-keep" data-act="suite">${q.i + 1 < q.qs.length ? "Question suivante ▶" : "Voir le score"}</button>` : ""}
      </div>`;
    remplirImages(vue);
  };

  // --- Frise ---
  const NBF = { CE1: 4, CE2: 6, CM1: 8, CM2: 6 };
  const frise = () => {
    stop();
    const niv = nm.get(), l = liste();
    if (niv === "CM2") {
      const vus = new Set(), pris = [];
      for (const o of shuffle(l)) { if (!vus.has(o.an)) { vus.add(o.an); pris.push(o); } if (pris.length >= NBF.CM2) break; }
      const ordre = chrono(pris);
      vue.innerHTML = `
        <div class="ak-jeu ak-frisejeu rc-board">
          <p class="ak-consigne">Range ces œuvres de la plus ancienne (à gauche) à la plus récente (à droite).</p>
          <div class="ak-banque dk-banque" data-cible data-v="">${shuffle(pris).map((o) => `<button class="dk-etq ak-etq-oe" data-etq data-v="${ordre.indexOf(o)}">${imgHTML(o, { cls: "mini" })}<span>${esc(o.court)}</span><small class="ak-date">${esc(o.date)}</small></button>`).join("")}</div>
          <div class="ak-ligne">${ordre.map((o, i) => `<div class="ak-case" data-cible data-v="${i}"><span class="ak-zn">${i + 1}</span><div class="ak-slot"></div></div>`).join("")}</div>
          <div class="ak-fleche"><span>plus ancien</span><span>plus récent</span></div>
        </div>`;
    } else {
      const pris = shuffle(l).slice(0, NBF[niv]);
      vue.innerHTML = `
        <div class="ak-jeu ak-frisejeu rc-board">
          <p class="ak-consigne">Place chaque œuvre dans sa période (glisse, ou touche l'œuvre puis la période).</p>
          <div class="ak-banque dk-banque" data-cible data-v="">${pris.map((o) => `<button class="dk-etq ak-etq-oe" data-etq data-v="${o.per}">${imgHTML(o, { cls: "mini" })}<span>${esc(o.court)}</span><small class="ak-date">${esc(o.date)}</small></button>`).join("")}</div>
          <div class="ak-periodes">${PERIODES.map((p) => `<div class="ak-col" data-cible data-v="${p.id}" data-cap="0" style="--c:${p.c};--f:${p.fonce}"><div class="ak-col-t"><span class="ak-long">${p.nom}</span><span class="ak-court">${p.court}</span><small>${p.dates}</small></div><div class="ak-slot"></div></div>`).join("")}</div>
        </div>`;
    }
    vue.insertAdjacentHTML("beforeend", `<div class="tool-top wrap rc-keep ak-actions"><button class="big-btn rc-keep" data-act="verif">✔ Vérifier</button><button class="pill rc-keep" data-act="sol">💡 Solution</button><button class="pill rc-keep" data-act="refaire">🔄 Recommencer</button></div><div id="akres" class="center"></div>`);
    pl = placeur(vue.querySelector(".ak-frisejeu"));
    remplirImages(vue);
  };

  const dessiner = () => {
    el.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
    if (mode === "quiz") { q = fabriquer(); dessinerQuiz(); } else frise();
  };
  const resultat = (html) => { const r = vue.querySelector("#akres"); if (r) r.innerHTML = html; };
  el.onclick = (e) => {
    if (pl?.clic(e)) return;
    const b = e.target.closest("button"); if (!b || !el.contains(b)) return;
    if (b.dataset.niv) { nm.set(b.dataset.niv); el.querySelectorAll("[data-niv]").forEach((x) => x.classList.toggle("on", x === b)); dessiner(); return; }
    if (b.dataset.mode) { mode = b.dataset.mode; dessiner(); return; }
    if (b.dataset.rep != null && q && q.rep == null) { q.rep = b.dataset.rep; if (q.rep === q.qs[q.i].bon) q.score++; dessinerQuiz(); return; }
    const a = b.dataset.act;
    if (a === "suite") { q.i++; q.rep = null; dessinerQuiz(); }
    if (a === "rejouer") { q = fabriquer(); dessinerQuiz(); }
    if (a === "verif") { const r = pl.verifier(); el.querySelector(".ak-frisejeu")?.classList.add("revele"); resultat(scoreHTML(r.ok, r.total) + (r.fini ? "" : `<p class="muted">${r.faux ? "Les œuvres en rouge ne sont pas à la bonne place." : "Il reste des œuvres à placer."}</p>`)); if (r.fini) bravo(el); }
    if (a === "sol") { pl.solution(); el.querySelector(".ak-frisejeu")?.classList.add("revele"); resultat(""); }
    if (a === "refaire") frise();
  };
  dessiner();
  return () => stop();
}

export const ARTS = [
  { id: "arts-musee", nom: "Musée de la classe", icone: "🖼️", couleur: "#f6dd8a", desc: "Des œuvres de la Préhistoire à nos jours, à projeter en grand", niveaux: ["CE1", "CE2", "CM1", "CM2"], mount: musee },
  { id: "arts-mots", nom: "Les mots pour en parler", icone: "🗣️", couleur: "#f6bccb", desc: "Portrait, perspective, arc-boutant… le vocabulaire illustré", niveaux: ["CE1", "CE2", "CM1", "CM2"], mount: mots },
  { id: "arts-quiz", nom: "Qui a fait quoi ?", icone: "🎨", couleur: "#b0d2f4", desc: "Œuvres, artistes et périodes : quiz et frise", niveaux: ["CE1", "CE2", "CM1", "CM2"], mount: quiz },
];
