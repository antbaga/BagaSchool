// Télécommande : le téléphone pilote l'outil affiché au tableau.
//
// Côté écran (PC) : en « mode projection », les boutons et réglages de l'outil sont masqués au tableau.
// Leur liste est envoyée au téléphone (libellé, type, état), qui les affiche en grand.
// Un appui sur le téléphone déclenche le vrai bouton côté PC : chaque outil fonctionne donc
// sans code spécifique. Les zones de jeu touchées par les élèves (.rc-board) restent au tableau.
import { envoyerRc, ecransConnectes, sync } from "./sync.js";

const CONTAINERS = ".tool-top,.seg,.pills,.tables,.keys,.keypad,.bank,.tray,.mem-setup,.deck-list,.toolbar,.row";
const rcEsc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- côté écran ----------
export const ecran = { actif: false, rev: 0, obs: null, timer: null, outil: null };

function libelle(el) {
  const aria = el.getAttribute("aria-label") || el.getAttribute("title");
  if (aria) return aria;
  if (el.tagName === "BUTTON") return el.innerText.replace(/\s+/g, " ").trim().slice(0, 40) || "•";
  const lab = el.closest("label");
  if (lab) return [...lab.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ").replace(/\s+/g, " ").trim().slice(0, 50) || el.placeholder || "";
  return el.placeholder || "";
}

function collecter(root) {
  const groupes = new Map(), items = [];
  const els = [...root.querySelectorAll("button,select,input,textarea")].filter((el) => !el.closest(".rc-board") && el.type !== "hidden" && el.type !== "file" && !el.hidden);
  els.forEach((el, i) => {
    el.dataset.rc = i;
    const cont = el.closest(CONTAINERS) || root;
    if (!groupes.has(cont)) groupes.set(cont, groupes.size);
    const it = { i, g: groupes.get(cont), label: libelle(el), dis: el.disabled };
    if (el.tagName === "SELECT") Object.assign(it, { k: "select", value: el.value, opts: [...el.options].map((o) => [o.value, o.text]) });
    else if (el.tagName === "TEXTAREA") Object.assign(it, { k: "textarea", value: el.value });
    else if (el.tagName === "INPUT") {
      if (el.type === "checkbox") Object.assign(it, { k: "check", on: el.checked });
      else if (el.type === "range") Object.assign(it, { k: "range", value: el.value, min: el.min, max: el.max, step: el.step });
      else Object.assign(it, { k: "text", value: el.type === "password" ? "" : el.value, secret: el.type === "password", num: el.type === "number" });
    } else Object.assign(it, { k: "button", on: el.classList.contains("on") || el.classList.contains("flipped"), etat: el.classList.contains("good") ? "good" : el.classList.contains("bad") ? "bad" : "", submit: el.type === "submit" });
    items.push(it);
  });
  return items;
}

function apercu(root) {
  const c = root.cloneNode(true);
  c.querySelectorAll("button:not(.rc-keep *),select,input,textarea,style,svg,canvas,.tool-top,.pills,.seg,.keys,.keypad,.bank").forEach((n) => n.remove());
  return c.innerText.replace(/\s+/g, " ").trim().slice(0, 240);
}

function publier() {
  if (!ecran.actif) return;
  const root = document.getElementById("tool");
  if (!root) { envoyerRc({ cmd: "ui", outil: null, rev: ++ecran.rev }); return; }
  ecran.rev++;
  envoyerRc({ cmd: "ui", outil: ecran.outil, titre: document.querySelector(".board-head h2")?.innerText.trim(), rev: ecran.rev, items: collecter(root), apercu: apercu(root) });
}
const publierBientot = () => { clearTimeout(ecran.timer); ecran.timer = setTimeout(publier, 120); };

export function surveiller() {
  ecran.obs?.disconnect();
  const root = document.getElementById("tool");
  if (!ecran.actif) return;
  if (root) {
    ecran.obs = new MutationObserver(publierBientot);
    ecran.obs.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "disabled"], characterData: true });
  }
  publierBientot();
}

export function quitterProjection() {
  ecran.actif = false; ecran.obs?.disconnect();
  document.body.classList.remove("projection");
}

// Messages reçus par l'écran
export function surRcEcran(msg) {
  if (document.visibilityState !== "visible" || sync.cfg?.role === "tel") return;
  if (msg.cmd === "open") {
    ecran.actif = true; ecran.outil = msg.outil;
    document.body.classList.add("projection");
    const h = msg.outil ? `#/outils/${msg.outil}` : "#/outils";
    if (location.hash !== h) location.hash = h; else surveiller();
  } else if (msg.cmd === "close") {
    quitterProjection(); location.hash = "#/outils";
  } else if (msg.cmd === "hello" && ecran.actif) publier();
  else if (msg.cmd === "act" && ecran.actif) {
    if (msg.rev !== ecran.rev) return publier();
    const el = document.querySelector(`#tool [data-rc="${msg.i}"]`);
    if (!el) return;
    if (msg.value !== undefined && el.tagName !== "BUTTON") {
      if (el.type === "checkbox") el.checked = !!msg.value; else el.value = msg.value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      if (msg.enter && el.form) el.form.requestSubmit();
    } else if (el.type === "submit" && el.form) el.form.requestSubmit(el);
    else el.click();
  }
}

// ---------- côté téléphone ----------
const tel = { ui: null, outils: [], app: null, lock: null };

export function surRcTel(msg) {
  if (msg.cmd === "ui") { tel.ui = msg.outil ? msg : null; dessiner(); }
}

async function garderEcranAllume() { try { tel.lock = await navigator.wakeLock?.request("screen"); } catch {} }

export function viewTelecommande(app, { outils, actif }) {
  tel.app = app; tel.outils = outils;
  if (!actif) {
    app.innerHTML = `<div class="sheet"><h2>📱 Télécommande</h2><p>Pour piloter le tableau depuis ton téléphone, lie d'abord tes appareils : sur l'ordinateur, va dans Réglages > Synchroniser mes appareils, puis scanne le QR code avec ce téléphone.</p><a class="primary btn" href="#/reglages">Réglages</a></div>`;
    return () => {};
  }
  document.body.classList.add("remote-mode");
  garderEcranAllume();
  envoyerRc({ cmd: "hello" });
  dessiner();
  const vis = () => { if (document.visibilityState === "visible") { garderEcranAllume(); envoyerRc({ cmd: "hello" }); } };
  document.addEventListener("visibilitychange", vis);
  app.onclick = (e) => {
    const t = e.target.closest("[data-rcact],[data-open],#rcBack,#rcQuit,#rcExit"); if (!t) return;
    if (t.dataset.open) { envoyerRc({ cmd: "open", outil: t.dataset.open }); tel.ui = { outil: t.dataset.open, titre: "…", items: [], rev: -1 }; dessiner(); }
    if (t.id === "rcBack") { envoyerRc({ cmd: "open", outil: null }); tel.ui = null; dessiner(); }
    if (t.id === "rcQuit") { envoyerRc({ cmd: "close" }); tel.ui = null; dessiner(); }
    if (t.id === "rcExit") { location.hash = "#/accueil"; }
    if (t.dataset.rcact !== undefined && t.tagName === "BUTTON") {
      const i = +t.dataset.rcact, it = tel.ui?.items.find((x) => x.i === i);
      if (it?.k === "check") return envoyerRc({ cmd: "act", i, rev: tel.ui.rev, value: !it.on });
      // si le bouton valide un formulaire, on envoie d'abord les champs texte saisis
      if (it?.submit) app.querySelectorAll("[data-rctext]").forEach((f) => envoyerRc({ cmd: "act", i: +f.dataset.rctext, rev: tel.ui.rev, value: f.value }));
      envoyerRc({ cmd: "act", i, rev: tel.ui.rev });
      navigator.vibrate?.(15);
    }
  };
  app.onchange = (e) => {
    const t = e.target; if (!tel.ui) return;
    if (t.dataset.rcsel !== undefined) envoyerRc({ cmd: "act", i: +t.dataset.rcsel, rev: tel.ui.rev, value: t.value });
    if (t.dataset.rctext !== undefined) envoyerRc({ cmd: "act", i: +t.dataset.rctext, rev: tel.ui.rev, value: t.value });
  };
  let lastRange = 0;
  app.oninput = (e) => {
    const t = e.target;
    if (t.dataset.rcrange !== undefined && Date.now() - lastRange > 80) { lastRange = Date.now(); envoyerRc({ cmd: "act", i: +t.dataset.rcrange, rev: tel.ui.rev, value: t.value }); }
  };
  app.onkeydown = (e) => {
    const t = e.target;
    if (e.key === "Enter" && t.dataset.rctext !== undefined && t.tagName === "INPUT") { e.preventDefault(); envoyerRc({ cmd: "act", i: +t.dataset.rctext, rev: tel.ui.rev, value: t.value, enter: true }); t.value = ""; }
  };
  return () => {
    document.body.classList.remove("remote-mode");
    document.removeEventListener("visibilitychange", vis);
    try { tel.lock?.release(); } catch {}
    tel.app = null;
  };
}

function dessiner() {
  const app = tel.app; if (!app) return;
  const n = ecransConnectes();
  const statut = `<span class="rc-dot ${n ? "on" : ""}"></span>${n ? "Écran connecté" : "Aucun écran connecté : ouvre BagaSchool sur l'ordinateur de la classe"}`;
  if (!tel.ui) {
    app.innerHTML = `<div class="rc">
      <header class="rc-head"><button id="rcExit" class="round-btn" aria-label="Quitter la télécommande">✕</button><b>Télécommande</b><span class="rc-stat">${statut}</span></header>
      <p class="hint">Choisis ce que tu veux afficher au tableau.</p>
      <div class="tiles small rc-tiles">${tel.outils.map((o) => `<button class="tile" data-open="${o.id}" style="--tile:${o.couleur}"><span class="tile-ico">${o.icone}</span><span class="tile-name">${rcEsc(o.nom)}</span></button>`).join("")}</div></div>`;
    return;
  }
  const u = tel.ui, groupes = {};
  for (const it of u.items) (groupes[it.g] ??= []).push(it);
  const ctl = (it) => {
    const dis = it.dis ? "disabled" : "";
    if (it.k === "select") return `<label class="rc-field">${rcEsc(it.label)}<select data-rcsel="${it.i}" ${dis}>${it.opts.map(([v, l]) => `<option value="${rcEsc(v)}" ${v === it.value ? "selected" : ""}>${rcEsc(l)}</option>`).join("")}</select></label>`;
    if (it.k === "range") return `<label class="rc-field">${rcEsc(it.label)}<input type="range" data-rcrange="${it.i}" min="${it.min}" max="${it.max}" step="${it.step || 1}" value="${rcEsc(it.value)}" ${dis}></label>`;
    if (it.k === "text") return `<label class="rc-field">${rcEsc(it.label)}<input data-rctext="${it.i}" type="${it.secret ? "password" : it.num ? "number" : "text"}" value="${rcEsc(it.value)}" placeholder="${rcEsc(it.label)}" ${dis}></label>`;
    if (it.k === "textarea") return `<label class="rc-field">${rcEsc(it.label)}<textarea data-rctext="${it.i}" rows="4" ${dis}>${rcEsc(it.value)}</textarea></label>`;
    return `<button class="rc-btn ${it.on ? "on" : ""} ${it.etat || ""} ${it.k === "check" ? "check" : ""}" data-rcact="${it.i}" ${dis}>${it.k === "check" ? (it.on ? "☑ " : "☐ ") : ""}${rcEsc(it.label)}</button>`;
  };
  // on ne réécrit pas un champ en cours de saisie
  const focus = document.activeElement?.dataset?.rctext;
  if (focus !== undefined && u.items.some((x) => String(x.i) === focus)) return;
  app.innerHTML = `<div class="rc">
    <header class="rc-head"><button id="rcBack" class="round-btn" aria-label="Autres outils">←</button><b>${rcEsc(u.titre || "")}</b><button id="rcQuit" class="ghost small">Fin de la projection</button></header>
    <div class="rc-stat">${statut}</div>
    ${u.apercu ? `<div class="rc-apercu">Au tableau : ${rcEsc(u.apercu)}</div>` : ""}
    <div class="rc-ctl">${Object.values(groupes).map((g) => `<div class="rc-group ${g.length > 12 ? "compact" : ""}">${g.map(ctl).join("")}</div>`).join("") || `<p class="hint">Connexion à l'écran…</p>`}</div></div>`;
}

export function rafraichirTel() { if (tel.app) dessiner(); }
