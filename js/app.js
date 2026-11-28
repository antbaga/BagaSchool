import * as db from "./db.js";
import { COMPETENCES, SOURCES, NIVEAUX, DISCIPLINES } from "./competences.js";
import { OUTILS as OUTILS_CLASSE } from "./outils.js";
import { DECOUVRIR } from "./decouvrir.js";
import { DECOUVRIR_THEMES, DECOUVRIR_PLUS } from "./decouvrir/index.js";
import { JEUX } from "./jeux.js";
import { OUTILS2 } from "./outils2.js";
import { ANGLAIS } from "./anglais.js";
import { FRANCAIS } from "./francais.js";
import { FLUENCE } from "./fluence.js";
import { MESURES } from "./mesures.js";
import { GEO } from "./geo.js";
const OUTILS = [...OUTILS_CLASSE, ...OUTILS2, ...FRANCAIS, ...FLUENCE, ...MESURES, ...GEO, ...ANGLAIS, ...DECOUVRIR, ...DECOUVRIR_PLUS, ...JEUX];
import { GENERATEURS, seeded } from "./imprimer.js";
import { CALENDRIERS, ZONES, joursFeries } from "./data/calendrier.js";
import { sync, initSync, marquer, demarrer, arreter, oublier, appareil, actif as syncActif, appareilsConnectes } from "./sync.js";
import * as compte from "./compte.js";
import { ecran, surveiller, quitterProjection, surRcEcran, surRcTel, viewTelecommande, rafraichirTel } from "./telecommande.js";
import qrcode from "./vendor/qrcode.mjs";
import { ISSR_BAREMES, issrJour, trancheISSR, nomTrancheISSR } from "./data/issr.js";
import { chercherAdresse, distanceRoute, lienGeoportail } from "./distance.js";
import { installerAnnotation, tapFiable } from "./annoter.js";
import { installerBarre } from "./barre.js";
import * as res from "./ressources.js";
import { viewPartager, viewVoir } from "./partage.js";
import { initInstallation, estInstallee, contenuInstallation, lancerInstallation, plateforme } from "./installer.js";

export const VERSION = "0.19.0";

// ---------- état ----------
let state = {};
const save = (coll) => { const p = db.set(coll, state[coll]); planifierBackup(); marquer(coll); return p; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
// Référentiel = textes officiels intégrés + compétences ajoutées par l'utilisatrice
let ALL_COMP = COMPETENCES, compById = {};
function rebuildComp() {
  ALL_COMP = [...COMPETENCES, ...(state.reglages?.compPerso ?? [])];
  compById = Object.fromEntries(ALL_COMP.map((c) => [c.id, c]));
}

// ---------- utilitaires DOM ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const opts = (list, sel, empty = "") =>
  (empty !== null ? `<option value="">${esc(empty)}</option>` : "") +
  list.map((v) => `<option ${v === sel ? "selected" : ""}>${esc(v)}</option>`).join("");
const fmtDate = (d) => (d ? new Date(d + "T00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) : "");
const app = $("#app");

function formData(form) {
  const o = {};
  for (const el of form.elements) if (el.name) o[el.name] = el.value.trim();
  return o;
}

// ---------- modale ----------
const modal = $("#modal");
let onModalClose = null;
function openModal(html, onMount, onClose = null) {
  onModalClose = onClose;
  modal.firstElementChild.innerHTML = html;
  modal.hidden = false;
  onMount?.(modal.firstElementChild);
  const first = modal.querySelector("input, textarea, select");
  first?.focus();
}
function closeModal(silent = false) {
  modal.hidden = true; modal.firstElementChild.innerHTML = "";
  const cb = onModalClose; onModalClose = null;
  if (cb && !silent) cb();
}
modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close]")) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

// ---------- sélecteur de compétences ----------
function pickCompetences(selected, onDone) {
  const sel = new Set(selected);
  openModal(`
    <h2>Insérer des compétences</h2>
    <div class="row">
      <input type="search" id="cq" placeholder="Rechercher…">
      <select id="cn"><option value="">Tous niveaux</option>${opts(NIVEAUX.filter((n) => ALL_COMP.some((c) => c.niveau === n)), pickCompetences.niveau ?? "", null)}</select>
      <select id="cd"><option value="">Toutes disciplines</option>${opts(DISCIPLINES.filter((d) => ALL_COMP.some((c) => c.discipline === d)), pickCompetences.disc ?? "", null)}</select>
    </div>
    <p class="hint">Une compétence manque ? <a href="#" id="cadd">Ajoute-la depuis le programme officiel</a>.</p>
    <div class="comp-list" id="cl"></div>
    <div class="actions"><span id="cc" class="hint"></span><button data-close class="ghost">Annuler</button><button id="cok" class="primary">Insérer</button></div>
  `, (m) => {
    const draw = () => {
      const q = $("#cq", m).value.toLowerCase();
      const n = (pickCompetences.niveau = $("#cn", m).value), d = (pickCompetences.disc = $("#cd", m).value);
      const list = ALL_COMP.filter((c) => (!n || c.niveau === n) && (!d || c.discipline === d) && (!q || (c.texte + c.sousDomaine).toLowerCase().includes(q)));
      let last = "";
      $("#cl", m).innerHTML = list.map((c) => {
        const head = `${c.niveau} · ${c.discipline === "Français" || c.discipline === "Mathématiques" ? "" : c.discipline + " · "}${c.domaine} · ${c.sousDomaine}`;
        const h = head !== last ? `<div class="comp-head">${esc(head)}</div>` : "";
        last = head;
        return `${h}<label class="comp"><input type="checkbox" value="${c.id}" ${sel.has(c.id) ? "checked" : ""}> ${esc(c.texte)}</label>`;
      }).join("") || `<p class="hint">Aucun résultat.</p>`;
      $("#cc", m).textContent = `${sel.size} sélectionnée(s)`;
    };
    m.oninput = (e) => { // la modale est réutilisée : on se débranche dès qu'elle affiche autre chose
      if (!$("#cq", m)) return void (m.oninput = null);
      if (e.target.type === "checkbox") { e.target.checked ? sel.add(e.target.value) : sel.delete(e.target.value); $("#cc", m).textContent = `${sel.size} sélectionnée(s)`; }
      else draw();
    };
    $("#cok", m).onclick = () => { closeModal(); onDone([...sel]); };
    $("#cadd", m).onclick = (e) => { e.preventDefault(); importerCompetences(() => pickCompetences([...sel], onDone)); };
    draw();
  });
}
const compChips = (ids, removable = false) => ids.map((id) => {
  const c = compById[id];
  const t = c ? `${c.niveau} · ${c.texte}` : "(compétence inconnue)";
  return `<span class="chip" title="${esc(c?.sousDomaine)}">${esc(t)}${removable ? ` <button class="x" data-rmcomp="${id}" aria-label="Retirer">×</button>` : ""}</span>`;
}).join("");

// ---------- EMPLOI DU TEMPS ----------
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const COULEURS = ["#cfe3f5", "#f9d9c4", "#d6efd2", "#efe0f7", "#fbefb8", "#f5cfd8", "#d3ece9", "#e5e5e5"];
function viewEdt() {
  const days = state.reglages.jours ?? ["Lundi", "Mardi", "Jeudi", "Vendredi"];
  const cols = days.map((d) => {
    const slots = state.edt.filter((s) => s.jour === d).sort((a, b) => a.debut.localeCompare(b.debut));
    return `<section class="day"><h3>${d}</h3>${slots.map((s) => `
      <button class="slot" data-edit="${s.id}" style="background:${s.couleur}">
        <span class="time">${esc(s.debut)}–${esc(s.fin)} · ${dureeTxt(s.debut, s.fin)}</span>
        <strong>${esc(s.discipline || "")}</strong>${s.libelle ? `<span>${esc(s.libelle)}</span>` : ""}
      </button>`).join("") || `<p class="hint">Rien pour l'instant.</p>`}
      <button class="ghost small" data-add="${d}">+ Créneau</button></section>`;
  }).join("");
  app.innerHTML = `
    <p class="intro">Ton emploi du temps type, valable toute l'année. Il remplit chaque jour du <a href="#/journal">cahier journal</a> avec les horaires et les matières. Pour un jour particulier (sortie, piscine…), modifie les horaires directement dans le cahier journal.</p>
    <div class="toolbar">
      <div class="days-pick">${JOURS.map((d) => `<label><input type="checkbox" value="${d}" ${days.includes(d) ? "checked" : ""}> ${d.slice(0, 3)}</label>`).join("")}</div>
      <button class="ghost" onclick="print()">Imprimer</button>
    </div>
    <div class="week" style="--n:${days.length}">${cols}</div>`;
  $(".days-pick", app).onchange = () => {
    state.reglages.jours = JOURS.filter((d) => $(`.days-pick input[value="${d}"]`, app).checked);
    save("reglages"); viewEdt();
  };
  app.onclick = (e) => {
    const a = e.target.closest("[data-add]"); if (a) return editSlot({ jour: a.dataset.add });
    const ed = e.target.closest("[data-edit]"); if (ed) return editSlot(state.edt.find((s) => s.id === ed.dataset.edit));
  };
}
const hm2min = (t) => { const [h, m] = String(t).split(":").map(Number); return h * 60 + (m || 0); };
const min2hm = (n) => `${String(Math.floor(n / 60) % 24).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const dureeTxt = (a, b) => { const d = hm2min(b) - hm2min(a); return d >= 60 ? `${Math.floor(d / 60)} h${d % 60 ? String(d % 60).padStart(2, "0") : ""}` : `${d} min`; };
// cible : par défaut l'emploi du temps type ; le cahier journal passe la liste des créneaux adaptés d'un jour (jourFixe).
const CIBLE_EDT = { liste: () => state.edt, apres: () => { save("edt"); viewEdt(); } };
function editSlot(s, cible = CIBLE_EDT) {
  const isNew = !s.id;
  if (isNew) { // le nouveau créneau commence à la fin du dernier créneau du jour
    const last = cible.liste().filter((x) => cible.jourFixe || x.jour === s.jour).sort((a, b) => b.fin.localeCompare(a.fin))[0];
    const debut = last ? last.fin : "08:30";
    s = { debut, fin: min2hm(hm2min(debut) + 45), ...s };
  }
  s = { couleur: COULEURS[0], ...s };
  openModal(`
    <h2>${isNew ? "Nouveau créneau" : "Modifier le créneau"}</h2>
    ${cible.jourFixe ? `<p class="hint">Pour ce jour seulement : ton emploi du temps type ne change pas.</p>` : ""}
    <form id="f">
      ${cible.jourFixe ? "" : `<label>Jour<select name="jour">${opts(JOURS, s.jour, null)}</select></label>`}
      <div class="row"><label>Début<input type="time" name="debut" value="${s.debut}" step="300" required></label>
      <label>Fin<input type="time" name="fin" value="${s.fin}" step="300" required></label></div>
      <div class="field"><span class="field-label">Durée</span><div class="seg wrap" id="durs">${[15, 20, 30, 45, 60, 90, 120].map((d) => `<button type="button" data-dur="${d}">${d < 60 ? d + " min" : d / 60 + " h" + (d % 60 ? "30" : "")}</button>`).join("")}</div></div>
      <label>Discipline<input name="discipline" list="disc" value="${esc(s.discipline)}" required></label>
      <datalist id="disc">${DISCIPLINES.map((d) => `<option value="${d}">`).join("")}<option value="Récréation"><option value="Pause méridienne"></datalist>
      <label>Précision (facultatif)<input name="libelle" value="${esc(s.libelle)}" placeholder="ex. Lecture compréhension, groupe CM1"></label>
      <label>Couleur</label><div class="colors">${COULEURS.map((c) => `<label class="sw" style="background:${c}"><input type="radio" name="couleur" value="${c}" ${c === s.couleur ? "checked" : ""}></label>`).join("")}</div>
      <div class="actions">${isNew ? "" : `<button type="button" class="danger" id="del">Supprimer</button>`}<button type="button" data-close class="ghost">Annuler</button><button class="primary">Enregistrer</button></div>
    </form>`, (m) => {
    const f = $("#f", m);
    const majDur = () => { const d = hm2min(f.fin.value) - hm2min(f.debut.value); $$("#durs button", m).forEach((b) => b.classList.toggle("on", +b.dataset.dur === d)); };
    $("#durs", m).onclick = (e) => { const b = e.target.closest("[data-dur]"); if (!b) return; f.fin.value = min2hm(hm2min(f.debut.value) + +b.dataset.dur); majDur(); };
    f.debut.addEventListener("change", () => { const b = $("#durs .on", m); if (b) f.fin.value = min2hm(hm2min(f.debut.value) + +b.dataset.dur); });
    f.fin.addEventListener("input", majDur); majDur();
    $("#f", m).onsubmit = (e) => {
      e.preventDefault();
      const d = formData(e.target);
      d.couleur = $("input[name=couleur]:checked", m)?.value ?? COULEURS[0];
      if (d.fin <= d.debut) return alertInline(m, "L'heure de fin doit être après l'heure de début.");
      const L = cible.liste();
      if (isNew) L.push({ id: uid(), jour: s.jour, ...d }); else Object.assign(L.find((x) => x.id === s.id), d);
      closeModal(); cible.apres();
    };
    $("#del", m)?.addEventListener("click", () => { const L = cible.liste(); L.splice(L.findIndex((x) => x.id === s.id), 1); closeModal(); cible.apres(); });
  });
}
function alertInline(root, msg) {
  let p = $(".err", root); if (!p) { p = document.createElement("p"); p.className = "err"; $(".actions", root).before(p); }
  p.textContent = msg;
}

// ---------- PROGRAMMATIONS & PROGRESSIONS ----------
const PERIODES = ["Période 1", "Période 2", "Période 3", "Période 4", "Période 5"];
function viewProgList() {
  app.innerHTML = `
    <p class="intro">Une programmation par discipline et par niveau : les séquences réparties sur les 5 périodes. Dans chaque séquence, la progression liste les séances dans l'ordre.</p>
    <div class="toolbar"><button class="primary" id="add">+ Nouvelle programmation</button></div>
    <div class="cards">${state.programmations.map((p) => `
      <a class="card" href="#/programmations/${p.id}"><strong>${esc(p.discipline)}</strong><span>${esc(p.niveau)} · ${esc(p.annee)}</span>
      <span class="hint">${p.periodes.flat().length} séquence(s)</span></a>`).join("") || `<p class="hint">Aucune programmation.</p>`}</div>`;
  $("#add").onclick = () => openModal(`
    <h2>Nouvelle programmation</h2>
    <form id="f">
      <label>Discipline<select name="discipline" required>${opts(DISCIPLINES, "Français", null)}</select></label>
      <label>Niveau(x)<input name="niveau" placeholder="ex. CM1-CM2" required></label>
      <label>Année scolaire<input name="annee" value="${anneeScolaire()}" required></label>
      <div class="actions"><button type="button" data-close class="ghost">Annuler</button><button class="primary">Créer</button></div>
    </form>`, (m) => {
    $("#f", m).onsubmit = (e) => {
      e.preventDefault();
      const p = { id: uid(), ...formData(e.target), periodes: PERIODES.map(() => []) };
      state.programmations.push(p); save("programmations"); closeModal(); location.hash = `#/programmations/${p.id}`;
    };
  });
}
function anneeScolaire() { const d = new Date(); const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-${y + 1}`; }

function viewProg(id) {
  const p = state.programmations.find((x) => x.id === id);
  if (!p) return notFound();
  setTitle(`${p.discipline} · ${p.niveau}`);
  const cal = p.annee === anneeScolaire() ? calendrierCourant() : null;
  app.innerHTML = `
    <div class="toolbar"><a href="#/programmations" class="ghost btn">← Programmations</a>
      <span class="grow"><strong>${esc(p.discipline)}</strong> · ${esc(p.niveau)} · ${esc(p.annee)}</span>
      <button class="ghost" id="dupp">Dupliquer</button><button class="ghost" onclick="print()">Imprimer</button><button class="danger" id="delp">Supprimer</button></div>
    <div class="periods">${p.periodes.map((seqs, i) => `
      <section class="period"><h3>${PERIODES[i]}${cal?.periodes[i] ? `<span class="period-dates">${fmtCourt(cal.periodes[i].debut)} → ${fmtCourt(cal.periodes[i].fin)} · ${cal.periodes[i].semaines} sem.</span>` : ""}</h3>
        ${seqs.map((s) => `<button class="seq" data-seq="${i}:${s.id}"><strong>${esc(s.titre)}</strong>
          <span class="hint">${s.seances.length} séance(s) · ${s.competences.length} compétence(s)</span></button>`).join("")}
        <button class="ghost small" data-addseq="${i}">+ Séquence</button></section>`).join("")}</div>`;
  app.onclick = (e) => {
    const a = e.target.closest("[data-addseq]");
    if (a) { const s = { id: uid(), titre: "Nouvelle séquence", competences: [], seances: [] }; p.periodes[+a.dataset.addseq].push(s); save("programmations"); return editSeq(p, +a.dataset.addseq, s); }
    const q = e.target.closest("[data-seq]");
    if (q) { const [i, sid] = q.dataset.seq.split(":"); return editSeq(p, +i, p.periodes[i].find((s) => s.id === sid)); }
    if (e.target.id === "dupp") return dupliquerProgrammation(p);
    if (e.target.id === "delp" && confirm("Supprimer cette programmation ?")) {
      state.programmations = state.programmations.filter((x) => x.id !== id); save("programmations"); location.hash = "#/programmations";
    }
  };
}
function editSeq(p, pi, s) {
  const draw = (m) => {
    m.innerHTML = `
      <h2>Séquence · ${PERIODES[pi]}</h2>
      <label>Titre<input id="st" value="${esc(s.titre)}"></label>
      <label>Compétences visées</label>
      <div class="chips">${compChips(s.competences, true)}</div>
      <button class="ghost small" id="addc">+ Insérer depuis les programmes</button>
      <h3>Progression (séances)</h3>
      <ol class="seances">${s.seances.map((se, k) => `
        <li><div class="row"><input data-se="${k}" data-f="titre" value="${esc(se.titre)}" placeholder="Titre de la séance">
          <button class="ghost small" data-up="${k}" ${k === 0 ? "disabled" : ""} aria-label="Monter">↑</button>
          <button class="ghost small" data-fiche="${k}" title="Créer la fiche de préparation">${se.ficheId ? "Ouvrir la fiche" : "Créer la fiche"}</button>
          <button class="ghost small" data-rmse="${k}" aria-label="Supprimer">×</button></div>
          <input data-se="${k}" data-f="objectif" value="${esc(se.objectif)}" placeholder="Objectif de la séance"></li>`).join("")}</ol>
      <button class="ghost small" id="addse">+ Séance</button>
      <div class="actions"><button class="danger" id="dels">Supprimer la séquence</button><button class="primary" data-close>Fermer</button></div>`;
  };
  const persist = () => { save("programmations"); };
  openModal("", (m) => {
    draw(m);
    m.oninput = (e) => {
      if (e.target.id === "st") s.titre = e.target.value;
      if (e.target.dataset.se) s.seances[+e.target.dataset.se][e.target.dataset.f] = e.target.value;
      persist();
    };
    m.onclick = (e) => {
      const t = e.target;
      if (t.id === "addc") return pickCompetences(s.competences, (ids) => { s.competences = ids; persist(); editSeq(p, pi, s); });
      if (t.dataset.rmcomp) { s.competences = s.competences.filter((x) => x !== t.dataset.rmcomp); persist(); return draw(m); }
      if (t.id === "addse") { s.seances.push({ id: uid(), titre: `Séance ${s.seances.length + 1}`, objectif: "" }); persist(); return draw(m); }
      if (t.dataset.rmse) { s.seances.splice(+t.dataset.rmse, 1); persist(); return draw(m); }
      if (t.dataset.up) { const k = +t.dataset.up; [s.seances[k - 1], s.seances[k]] = [s.seances[k], s.seances[k - 1]]; persist(); return draw(m); }
      if (t.dataset.fiche) {
        const se = s.seances[+t.dataset.fiche];
        if (!se.ficheId || !state.fiches.some((f) => f.id === se.ficheId)) {
          const f = newFiche({ titre: `${s.titre} – ${se.titre}`, discipline: p.discipline, niveau: p.niveau, objectif: se.objectif, competences: [...s.competences] });
          se.ficheId = f.id; persist();
        }
        closeModal(true); location.hash = `#/fiches/${se.ficheId}`; return;
      }
      if (t.id === "dels" && confirm("Supprimer cette séquence ?")) { p.periodes[pi] = p.periodes[pi].filter((x) => x !== s); persist(); closeModal(); }
    };
  }, () => viewProg(p.id));
}

// ---------- FICHES DE PRÉPARATION ----------
function newFiche(init = {}) {
  const f = { id: uid(), titre: "Nouvelle fiche", discipline: "", niveau: "", date: "", duree: "45 min", periode: periodeCourante(), sequence: "", numSeance: "", typeSeance: "", objectif: "", criteresReussite: "", criteresRealisation: "", competences: [], materiel: "",
    phases: [{ duree: "10 min", phase: "Découverte", deroulement: "", modalite: "Collectif" }], differenciation: "", bilan: "", ...init };
  state.fiches.unshift(f); save("fiches"); return f;
}
function viewFiches() {
  app.innerHTML = `
    <div class="toolbar"><input type="search" id="q" placeholder="Rechercher une fiche…" class="grow"><button class="primary" id="add">+ Nouvelle fiche</button></div>
    <div class="list" id="l"></div>`;
  const draw = () => {
    const q = $("#q").value.toLowerCase();
    $("#l").innerHTML = state.fiches.filter((f) => !q || (f.titre + f.discipline).toLowerCase().includes(q)).map((f) => `
      <a class="item" href="#/fiches/${f.id}"><strong>${esc(f.titre)}</strong><span class="hint">${esc(f.discipline)} ${esc(f.niveau)} ${f.date ? "· " + fmtDate(f.date) : ""}</span></a>`).join("")
      || `<p class="hint">Aucune fiche. Crée-en une ici, ou depuis une séance dans Programmations.</p>`;
  };
  $("#q").oninput = draw; draw();
  $("#add").onclick = choisirModele;
}
const MODALITES = ["Collectif", "Individuel", "Binômes", "Groupes", "Ateliers"];
const TYPES_SEANCE = ["Découverte", "Recherche", "Investigation (sciences)", "Expérimentation", "Structuration", "Entraînement", "Réinvestissement", "Remédiation", "Évaluation"];
function periodeCourante() {
  try { const c = calendrierCourant(); const t = isoLocal(new Date()); const p = c?.periodes.find((x) => t <= x.fin); return p ? `P${p.n}` : ""; } catch { return ""; }
}
function viewFiche(id) {
  const f = state.fiches.find((x) => x.id === id);
  if (!f) return notFound();
  setTitle("Fiche de préparation");
  const draw = () => {
    app.innerHTML = `
      <div class="toolbar no-print"><a href="#/fiches" class="ghost btn">← Fiches</a><span class="grow hint">Enregistrement automatique</span>
        <button class="ghost" id="dup">Dupliquer</button><button class="ghost" id="mod">⭐ Enregistrer comme modèle</button><button class="ghost" onclick="print()">Imprimer / PDF</button><button class="danger" id="del">Supprimer</button></div>
      <form class="sheet" id="f" autocomplete="off">
        <input class="title-input" name="titre" value="${esc(f.titre)}" aria-label="Titre de la séance" placeholder="Titre de la séance">
        <div class="grid4">
          <label>Séquence<input name="sequence" value="${esc(f.sequence ?? "")}" placeholder="ex. Les fractions"></label>
          <label>Séance n°<input name="numSeance" value="${esc(f.numSeance ?? "")}" inputmode="numeric"></label>
          <label>Période<select name="periode">${opts(["P1", "P2", "P3", "P4", "P5"], f.periode ?? "")}</select></label>
          <label>Type de séance<select name="typeSeance">${opts(TYPES_SEANCE, f.typeSeance ?? "")}</select></label>
        </div>
        <div class="grid4">
          <label>Discipline<select name="discipline">${opts(DISCIPLINES, f.discipline)}</select></label>
          <label>Niveau<input name="niveau" value="${esc(f.niveau)}"></label>
          <label>Date<input type="date" name="date" value="${esc(f.date)}"></label>
          <label>Durée<input name="duree" value="${esc(f.duree)}"></label>
        </div>
        <label>Objectif de la séance<textarea name="objectif" rows="2">${esc(f.objectif)}</textarea></label>
        <div class="grid2">
          <label>Critères de réussite <span class="hint">(« J'ai réussi si… »)</span><textarea name="criteresReussite" rows="3" placeholder="ex. Mes 10 calculs sont justes.">${esc(f.criteresReussite ?? "")}</textarea></label>
          <label>Critères de réalisation <span class="hint">(« Pour réussir, je dois… »)</span><textarea name="criteresRealisation" rows="3" placeholder="ex. Aligner les unités sous les unités. Commencer par la droite.">${esc(f.criteresRealisation ?? "")}</textarea></label>
        </div>
        <div class="label-row"><span>Compétences des programmes officiels</span><button type="button" class="ghost small no-print" id="addc">+ Insérer</button></div>
        <div class="chips">${compChips(f.competences, true) || `<span class="hint">Aucune.</span>`}</div>
        <label>Matériel<textarea name="materiel" rows="2">${esc(f.materiel)}</textarea></label>
        <div class="label-row"><span>Déroulement</span></div>
        <table class="phases"><thead><tr><th>Durée</th><th>Phase</th><th>Déroulement / consignes</th><th>Modalité</th><th class="no-print"></th></tr></thead>
        <tbody>${f.phases.map((ph, k) => `<tr>
          <td><input data-ph="${k}" data-f="duree" value="${esc(ph.duree)}"></td>
          <td><input data-ph="${k}" data-f="phase" value="${esc(ph.phase)}"></td>
          <td><textarea data-ph="${k}" data-f="deroulement" rows="3">${esc(ph.deroulement)}</textarea></td>
          <td><select data-ph="${k}" data-f="modalite">${opts(MODALITES, ph.modalite, null)}</select></td>
          <td class="no-print"><button type="button" class="ghost small" data-rmph="${k}" aria-label="Supprimer la phase">×</button></td></tr>`).join("")}</tbody></table>
        <button type="button" class="ghost small no-print" id="addph">+ Phase</button>
        <label>Différenciation<textarea name="differenciation" rows="2">${esc(f.differenciation)}</textarea></label>
        <label>Bilan / remarques<textarea name="bilan" rows="2">${esc(f.bilan)}</textarea></label>
      </form>`;
  };
  draw();
  app.oninput = (e) => {
    const t = e.target;
    if (t.dataset.ph) f.phases[+t.dataset.ph][t.dataset.f] = t.value;
    else if (t.name) f[t.name] = t.value;
    save("fiches");
  };
  app.onchange = app.oninput;
  app.onclick = (e) => {
    const t = e.target;
    if (t.id === "addc") pickCompetences(f.competences, (ids) => { f.competences = ids; save("fiches"); draw(); });
    else if (t.dataset.rmcomp) { f.competences = f.competences.filter((x) => x !== t.dataset.rmcomp); save("fiches"); draw(); }
    else if (t.id === "addph") { f.phases.push({ duree: "", phase: "", deroulement: "", modalite: "Collectif" }); save("fiches"); draw(); }
    else if (t.dataset.rmph) { f.phases.splice(+t.dataset.rmph, 1); save("fiches"); draw(); }
    else if (t.id === "mod") { enregistrerModele(f); t.textContent = "✓ Modèle enregistré"; t.disabled = true; }
    else if (t.id === "dup") { const c = newFiche({ ...structuredClone(f), id: uid(), titre: f.titre + " (copie)" }); location.hash = `#/fiches/${c.id}`; }
    else if (t.id === "del" && confirm("Supprimer cette fiche ?")) { state.fiches = state.fiches.filter((x) => x.id !== id); save("fiches"); location.hash = "#/fiches"; }
  };
}

// ---------- ÉVALUATIONS ----------
const CODES = [
  { code: "", label: "—" },
  { code: "NA", label: "Non atteint" },
  { code: "PA", label: "Partiellement atteint" },
  { code: "A", label: "Atteint" },
  { code: "D", label: "Dépassé" },
];
function viewEvals() {
  app.innerHTML = `
    <div class="toolbar"><button class="primary" id="add">+ Nouvelle évaluation</button></div>
    <div class="list">${state.evaluations.map((ev) => `
      <a class="item" href="#/evaluations/${ev.id}"><strong>${esc(ev.titre)}</strong>
      <span class="hint">${esc(ev.discipline)} ${esc(ev.niveau)} ${ev.date ? "· " + fmtDate(ev.date) : ""} · ${ev.items.length} item(s)</span></a>`).join("") || `<p class="hint">Aucune évaluation.</p>`}</div>`;
  $("#add").onclick = () => { location.hash = `#/evaluations/${newEval().id}`; };
}
function newEval() {
  const ev = { id: uid(), titre: "Nouvelle évaluation", discipline: "Français", niveau: "", date: "", consigne: "", items: [], resultats: {} };
  state.evaluations.unshift(ev); save("evaluations"); return ev;
}
function viewEval(id, tab = "prep") {
  const ev = state.evaluations.find((x) => x.id === id);
  if (!ev) return notFound();
  setTitle("Évaluation");
  const draw = () => {
    const eleves = state.eleves;
    app.innerHTML = `
      <div class="toolbar no-print"><a href="#/evaluations" class="ghost btn">← Évaluations</a>
        <div class="tabs grow"><button class="${tab === "prep" ? "on" : ""}" data-tab="prep">Préparer</button><button class="${tab === "res" ? "on" : ""}" data-tab="res">Résultats</button></div>
        <button class="ghost" onclick="print()">Imprimer</button><button class="danger" id="del">Supprimer</button></div>
      ${tab === "prep" ? `
      <form class="sheet" id="f">
        <input class="title-input" name="titre" value="${esc(ev.titre)}" aria-label="Titre">
        <div class="grid4">
          <label>Discipline<select name="discipline">${opts(DISCIPLINES, ev.discipline)}</select></label>
          <label>Niveau<input name="niveau" value="${esc(ev.niveau)}"></label>
          <label>Date<input type="date" name="date" value="${esc(ev.date)}"></label>
        </div>
        <p class="print-only">Prénom : ............................................ &nbsp; Date : ...................</p>
        <label class="no-print">Consigne générale<textarea name="consigne" rows="2">${esc(ev.consigne)}</textarea></label>
        <p class="print-only">${esc(ev.consigne)}</p>
        <div class="label-row"><span>Compétences évaluées</span>
          <span class="no-print"><button type="button" class="ghost small" id="addc">+ Insérer depuis les programmes</button>
          <button type="button" class="ghost small" id="addl">+ Item libre</button></span></div>
        <table class="items"><thead><tr><th>Compétence</th>${CODES.slice(1).map((c) => `<th class="code" title="${c.label}">${c.code}</th>`).join("")}<th class="no-print"></th></tr></thead>
        <tbody>${ev.items.map((it, k) => `<tr>
          <td>${it.compId ? `<span>${esc(compById[it.compId]?.texte ?? "(compétence inconnue)")}</span>` : `<input data-it="${k}" value="${esc(it.texte)}" placeholder="Intitulé de l'item"><input class="no-print dom-input" data-dom="${k}" value="${esc(it.domaine ?? "")}" list="domList" placeholder="Domaine (pour les graphiques), ex. Lecture">`}</td>
          ${CODES.slice(1).map(() => `<td class="code box"></td>`).join("")}
          <td class="no-print"><button type="button" class="ghost small" data-rmit="${k}" aria-label="Retirer">×</button></td></tr>`).join("")
          || `<tr><td colspan="6" class="hint">Ajoute des compétences : elles sont insérées telles qu'écrites dans le référentiel.</td></tr>`}</tbody></table>
        <p class="hint">${CODES.slice(1).map((c) => `${c.code} = ${c.label}`).join(" · ")}</p>
        <datalist id="domList">${domainesConnus(ev.discipline).map((d) => `<option value="${esc(d)}">`).join("")}</datalist>
      </form>` : `
      <div class="sheet">
        <h2>${esc(ev.titre)}</h2>
        ${!eleves.length ? `<p class="hint">Ajoute d'abord tes élèves dans <a href="#/classe">Ma classe</a>.</p>` :
        !ev.items.length ? `<p class="hint">Ajoute des compétences dans l'onglet Préparer.</p>` : `
        <p class="hint no-print">Touche une case pour faire défiler : — → NA → PA → A → D.</p>
        <div class="scroll-x"><table class="results"><thead><tr><th>Élève</th>${ev.items.map((it, k) => `<th title="${esc(itemText(it))}">${k + 1}</th>`).join("")}</tr></thead>
        <tbody>${eleves.map((el) => `<tr><th>${esc(el.prenom)}</th>${ev.items.map((_, k) => {
          const v = ev.resultats[el.id]?.[k] ?? "";
          return `<td><button class="res r-${v || "x"}" data-r="${el.id}:${k}">${v || "—"}</button></td>`;
        }).join("")}</tr>`).join("")}</tbody>
        <tfoot><tr><th>Atteint ou +</th>${ev.items.map((_, k) => {
          const n = eleves.filter((el) => ["A", "D"].includes(ev.resultats[el.id]?.[k])).length;
          return `<td>${n}/${eleves.length}</td>`;
        }).join("")}</tr></tfoot></table></div>
        <ol class="legend">${ev.items.map((it) => `<li>${esc(itemText(it))}</li>`).join("")}</ol>`}
      </div>`}`;
  };
  draw();
  app.oninput = (e) => {
    const t = e.target;
    if (t.dataset.it) ev.items[+t.dataset.it].texte = t.value;
    else if (t.dataset.dom) ev.items[+t.dataset.dom].domaine = t.value;
    else if (t.name) ev[t.name] = t.value;
    save("evaluations");
  };
  app.onchange = app.oninput;
  app.onclick = (e) => {
    const t = e.target;
    if (t.dataset.tab) { tab = t.dataset.tab; draw(); }
    else if (t.id === "addc") pickCompetences(ev.items.filter((i) => i.compId).map((i) => i.compId), (ids) => {
      const keep = ev.items.filter((i) => !i.compId || ids.includes(i.compId));
      const have = new Set(keep.map((i) => i.compId));
      ev.items = [...keep, ...ids.filter((x) => !have.has(x)).map((compId) => ({ compId, texte: "" }))];
      ev.resultats = {}; // les index changent : on repart d'une grille vide (prototype)
      save("evaluations"); draw();
    });
    else if (t.id === "addl") { ev.items.push({ compId: null, texte: "" }); save("evaluations"); draw(); }
    else if (t.dataset.rmit) {
      const k = +t.dataset.rmit; ev.items.splice(k, 1);
      for (const r of Object.values(ev.resultats)) { for (let i = k; i < ev.items.length + 1; i++) r[i] = r[i + 1]; delete r[ev.items.length]; }
      save("evaluations"); draw();
    }
    else if (t.dataset.r) {
      const [el, k] = t.dataset.r.split(":");
      const cur = ev.resultats[el]?.[k] ?? "";
      const next = CODES[(CODES.findIndex((c) => c.code === cur) + 1) % CODES.length].code;
      (ev.resultats[el] ??= {})[k] = next; save("evaluations"); draw();
    }
    else if (t.id === "del" && confirm("Supprimer cette évaluation ?")) { state.evaluations = state.evaluations.filter((x) => x.id !== id); save("evaluations"); location.hash = "#/evaluations"; }
  };
}
const domaineItem = (it) => (it.compId ? compById[it.compId]?.domaine : it.domaine?.trim()) || "Non classé";
const itemText = (it) => (it.compId ? compById[it.compId]?.texte ?? "(compétence inconnue)" : it.texte || "(item sans titre)");

// ---------- CLASSE ----------
function viewClasse() {
  app.innerHTML = `
    <p class="intro">Les prénoms restent sur cet appareil. Évite les noms de famille.</p>
    <form id="f" class="row"><textarea name="noms" rows="2" placeholder="Un ou plusieurs prénoms (un par ligne)" class="grow"></textarea><button class="primary">Ajouter</button></form>
    <ul class="pupils">${state.eleves.map((e) => `<li><input data-el="${e.id}" value="${esc(e.prenom)}"><a class="pill" href="#/classe/${e.id}">Suivi</a><button class="ghost small" data-rm="${e.id}" aria-label="Retirer">×</button></li>`).join("")}</ul>
    <p class="hint">${state.eleves.length} élève(s)</p>`;
  $("#f").onsubmit = (e) => {
    e.preventDefault();
    const noms = e.target.noms.value.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
    state.eleves.push(...noms.map((prenom) => ({ id: uid(), prenom }))); save("eleves"); viewClasse();
  };
  app.oninput = (e) => { const el = state.eleves.find((x) => x.id === e.target.dataset.el); if (el) { el.prenom = e.target.value; save("eleves"); } };
  app.onclick = (e) => { const id = e.target.dataset.rm; if (id && confirm("Retirer cet élève ?")) { state.eleves = state.eleves.filter((x) => x.id !== id); save("eleves"); viewClasse(); } };
}

// ---------- RÉFÉRENTIEL ----------
function viewCompetences() {
  const perso = compPerso();
  const parSource = Object.entries(SOURCES).map(([k, src]) => ({ ...src, n: COMPETENCES.filter((c) => c.source === k).length }));
  app.innerHTML = `
    <div class="notice"><strong>Ce qui est déjà dedans :</strong> ${COMPETENCES.length} objectifs recopiés mot pour mot depuis les programmes publiés sur education.gouv.fr.
      Le référentiel est <b>incomplet</b> : les objectifs que l'application n'a pas pu lire en entier ont été laissés de côté plutôt que réécrits.
      <ul class="src-list">${parSource.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a> · ${s.n} objectifs${s.couverture ? `<br><span class="hint">${esc(s.couverture)}</span>` : ""}</li>`).join("")}</ul>
      <span class="hint">Textes non encore vérifiés contre le Bulletin officiel. Rien pour le cycle 1 ni pour les autres disciplines : ajoute-les avec le bouton ci-dessous.</span></div>
    <div class="toolbar"><button class="primary" id="addc">+ Ajouter des compétences</button><span class="grow"></span>${perso.length ? `<span class="hint">${perso.length} ajoutée(s) par toi</span>` : ""}</div>
    <div class="row">
      <input type="search" id="q" placeholder="Rechercher…">
      <select id="fn"><option value="">Tous niveaux</option>${opts(NIVEAUX.filter((n) => ALL_COMP.some((c) => c.niveau === n)), "", null)}</select>
      <select id="fd"><option value="">Toutes disciplines</option>${opts(DISCIPLINES.filter((d) => ALL_COMP.some((c) => c.discipline === d)), "", null)}</select>
    </div>
    <div id="l"></div>`;
  const draw = () => {
    const q = $("#q").value.toLowerCase(), n = $("#fn").value, d = $("#fd").value;
    let last = "";
    $("#l").innerHTML = ALL_COMP.filter((c) => (!n || c.niveau === n) && (!d || c.discipline === d) && (!q || c.texte.toLowerCase().includes(q))).map((c) => {
      const head = `${c.niveau} · ${c.discipline} · ${c.domaine}${c.sousDomaine && c.sousDomaine !== c.domaine ? " · " + c.sousDomaine : ""}`;
      const h = head !== last ? `<h3 class="comp-head">${esc(head)}</h3>` : ""; last = head;
      return `${h}<p class="comp">${esc(c.texte)}${c.source === "perso" ? ` <span class="tag-perso" title="${esc(c.sourceLabel || "Ajoutée par toi")}">perso</span> <button class="ghost small" data-rmperso="${c.id}" aria-label="Supprimer">×</button>` : ""}</p>`;
    }).join("") || `<p class="hint">Aucun résultat.</p>`;
  };
  app.oninput = (e) => { if (["q", "fn", "fd"].includes(e.target.id)) draw(); };
  app.onchange = app.oninput;
  app.onclick = (e) => {
    if (e.target.id === "addc") importerCompetences();
    const r = e.target.dataset.rmperso;
    if (r && confirm("Supprimer cette compétence ? Elle disparaîtra aussi des fiches et évaluations qui l'utilisent.")) {
      state.reglages.compPerso = perso.filter((c) => c.id !== r); save("reglages"); rebuildComp(); draw();
    }
  };
  draw();
}

// ---------- RÉGLAGES ----------
async function viewReglages() {
  const persisted = await navigator.storage?.persisted?.().catch(() => false);
  app.innerHTML = `
    <div class="sheet">
      <h2>Sauvegarde</h2>
      <p>Tes données sont enregistrées <strong>sur cet appareil</strong>, dans ce navigateur.${compte.configure() ? " Avec un compte, tes préparations sont aussi copiées sur le serveur et synchronisées ; les élèves, les évaluations et l'appel restent uniquement ici." : ""}
      Pour ne rien perdre, exporte régulièrement un fichier de sauvegarde.</p>
      <p class="hint">Stockage protégé par le navigateur : ${persisted ? "oui" : "non (le navigateur peut effacer les données s'il manque de place)"}.</p>
      <div class="row"><button class="primary" id="exp">Exporter une sauvegarde</button>
        <label class="btn ghost">Importer une sauvegarde<input type="file" id="imp" accept="application/json,.json" hidden></label></div>
      <p class="hint">L'import remplace toutes les données actuelles de cet appareil. Le fichier de sauvegarde contient aussi tes élèves et leurs fiches (difficultés, bilans) : garde-le en lieu sûr et ne le partage pas.</p>
      <h3>Sauvegarde automatique</h3>
      ${canAutoFile() ? `<p>Sur cet ordinateur, BagaSchool peut écrire tout seul une copie de tes données dans un fichier (par exemple dans ton dossier Google Drive, OneDrive ou Dropbox), à chaque modification.</p>
        <p class="hint">État : ${backup.etat === "on" ? `✅ activée${backup.handle?.name ? ` (fichier « ${esc(backup.handle.name)} »)` : ""}` : backup.etat === "pause" ? "⏸️ en pause : le navigateur demande ton accord après un redémarrage" : "désactivée"}.</p>
        <div class="row">${backup.etat === "pause" ? `<button class="primary" id="bres">Reprendre</button>` : ""}<button class="ghost" id="bpick">${backup.handle ? "Changer de fichier" : "Choisir le fichier de sauvegarde"}</button></div>`
      : `<p>Sur ce navigateur, la sauvegarde ne peut pas être automatique. ${navigator.canShare ? "Le bouton « Envoyer » ci-dessous permet de l'envoyer par mail, dans Drive ou sur ton ordinateur en deux gestes." : "Exporte régulièrement un fichier."}</p>
        ${navigator.canShare ? `<div class="row"><button class="primary" id="bshare">📤 Envoyer une sauvegarde</button></div>` : ""}`}
      <p class="hint">Dernière sauvegarde : ${state.reglages._lastBackup ? new Date(state.reglages._lastBackup).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : "jamais"}.</p>
      <h3>Passer du téléphone à l'ordinateur (ou l'inverse)</h3>
      <p class="hint">Sur le premier appareil : « Exporter » (ou « Envoyer »). Sur l'autre : « Importer » et choisis le fichier. L'import remplace tout ce qu'il y a sur l'appareil qui reçoit.</p>
      <h2>Mon compte</h2>
      <div id="compteBox"><p class="hint">…</p></div>
      <h2>Calendrier</h2>
      <p>Zone scolaire : <span class="seg">${["A", "B", "C"].map((z) => `<button data-zone="${z}" class="${state.reglages.zone === z ? "on" : ""}">${z}</button>`).join("")}</span> <a href="#/calendrier" class="link">Voir le calendrier</a></p>
      <h2>Données d'exemple</h2>
      <div class="row"><button class="ghost" id="demo">Charger un exemple</button><button class="danger" id="wipe">Tout effacer</button></div>
      <p class="hint">BagaSchool version ${VERSION}</p>
    </div>`;
  $("#exp").onclick = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `bagaschool-${new Date().toISOString().slice(0, 10)}.json` });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    marquerSauvegarde();
  };
  app.onclick = async (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.zone) { state.reglages.zone = t.dataset.zone; await save("reglages"); viewReglages(); }
    if (await actionCompte(t)) return;
    if (t.id === "bpick" && await choisirFichierBackup()) viewReglages();
    if (t.id === "bres") { await reprendreBackup(); viewReglages(); }
    if (t.id === "bshare" && await partagerSauvegarde()) viewReglages();
  };
  $("#imp").onchange = async (e) => {
    try {
      const j = JSON.parse(await e.target.files[0].text());
      if (j.app !== "bagaschool" || !j.data) throw new Error("Ce fichier n'est pas une sauvegarde BagaSchool.");
      if (!confirm("Remplacer toutes les données de cet appareil par cette sauvegarde ?")) return;
      for (const c of db.COLLECTIONS) { state[c] = j.data[c] ?? (db.OBJETS.includes(c) ? {} : []); await save(c); }
      rebuildComp();
      alert("Sauvegarde importée."); route();
    } catch (err) { alert(err.message); }
  };
  $("#demo").onclick = async () => { if (confirm("Ajouter des données d'exemple ?")) { await loadDemo(); location.hash = "#/accueil"; } };
  $("#wipe").onclick = async () => {
    if (!confirm(syncActif() ? "Effacer toutes les données de cet appareil ? Tes préparations restent dans ton compte et reviendront ici ; les élèves, évaluations, l'appel et « Mes ressources » seront perdus. Exporte une sauvegarde avant si besoin." : "Effacer toutes les données de cet appareil, y compris « Mes ressources » ? Exporte une sauvegarde avant si besoin.")) return;
    const connecte = syncActif();
    await oublier(); await db.clear(); await res.toutSupprimer().catch(() => {}); state = await db.loadAll(); rebuildComp(); backup.handle = null; backup.etat = "off";
    if (connecte) lancerSync();
    route();
  };
  remplirCompte($("#compteBox"));
}

async function loadDemo() {
  const add = (j, d, f, disc, lib, c) => state.edt.push({ id: uid(), jour: j, debut: d, fin: f, discipline: disc, libelle: lib, couleur: c });
  for (const j of ["Lundi", "Mardi", "Jeudi", "Vendredi"]) {
    add(j, "08:30", "09:30", "Français", "Lecture", COULEURS[0]);
    add(j, "09:30", "10:15", "Mathématiques", "Calcul", COULEURS[1]);
    add(j, "10:15", "10:30", "Récréation", "", COULEURS[7]);
    add(j, "10:30", "11:30", "Français", "Écriture", COULEURS[0]);
  }
  const ids = COMPETENCES.filter((c) => c.niveau === "CM1" && c.domaine === "Lecture").slice(0, 3).map((c) => c.id);
  state.programmations.push({ id: uid(), discipline: "Français", niveau: "CM1", annee: anneeScolaire(), periodes: [
    [{ id: uid(), titre: "Lire à voix haute", competences: ids.slice(0, 2), seances: [{ id: uid(), titre: "Séance 1", objectif: "Exemple d'objectif" }] }], [], [], [], []] });
  state.eleves.push(...["Exemple A", "Exemple B", "Exemple C"].map((prenom) => ({ id: uid(), prenom })));
  state.evaluations.unshift({ id: uid(), titre: "Exemple d'évaluation – lecture", discipline: "Français", niveau: "CM1", date: "", consigne: "", items: ids.map((compId) => ({ compId, texte: "" })), resultats: {} });
  for (const c of ["edt", "programmations", "eleves", "evaluations"]) await save(c);
}

// ---------- AUJOURD'HUI ----------
const JOURS_JS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const toolTile = (o, desc = false) => `<a class="tile" href="#/outils/${o.id}" style="--tile:${o.couleur}"><span class="tile-ico">${o.icone}</span><span class="tile-name">${esc(o.nom)}</span>${desc ? `<span class="tile-desc">${esc(o.desc)}</span>` : ""}</a>`;
const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function viewAccueil() {
  const now = new Date();
  const jour = JOURS_JS[now.getDay()];
  const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const slots = creneauxDuJour(localISO(now));
  const fiches = state.fiches.filter((f) => f.date === localISO(now));
  const recent = state.fiches.slice(0, 3);
  const dateTxt = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  app.innerHTML = `
    ${rappelSauvegarde()}
    ${!(matchMedia("(display-mode: standalone)").matches || navigator.standalone) && !state.reglages._aideVue ? `<a class="aide-card" href="#/aide">📲 <b>Première fois ?</b> Installer BagaSchool sur ton ordinateur et ton téléphone, et projeter au tableau.</a>` : ""}
    <div id="accCompte"></div>
    <section class="hello"><h2>Bonjour ! 👋</h2><p>Nous sommes ${esc(dateTxt)}.${(() => { const st = statutJour(localISO(now)); if (st && st.type !== "weekend") return ` ${esc(st.nom)} 🏖️`; const v = prochainesVacances(localISO(now)); return v ? ` Vacances ${v.nom} dans ${v.jours} jour${v.jours > 1 ? "s" : ""}.` : ""; })()}</p></section>
    <div class="home-grid">
      <section class="panel">
        <div class="panel-head"><h3>Ma journée</h3><a href="#/journal" class="link">Cahier journal</a></div>
        ${slots.length ? `<ol class="today">${slots.map((s) => {
          const cls = s.fin <= hm ? "past" : s.debut <= hm ? "now" : "";
          return `<li class="${cls}" style="--c:${s.couleur}"><span class="today-time">${esc(s.debut)}</span><span class="today-what"><b>${esc(s.discipline)}</b>${s.libelle ? ` · ${esc(s.libelle)}` : ""}</span>${cls === "now" ? `<span class="badge">en cours</span>` : ""}</li>`;
        }).join("")}</ol>` : `<div class="empty"><span>🌤️</span><p>${state.edt.length ? `Pas de cours prévu ce ${jour.toLowerCase()}.` : "Ton emploi du temps est vide."}</p>${state.edt.length ? "" : `<a class="primary btn" href="#/edt">Remplir mon emploi du temps</a>`}</div>`}
        <div class="quick" style="margin-top:12px"><a class="quick-btn" href="#/journal"><span>📒</span>Cahier journal</a><a class="quick-btn" href="#/partager/${localISO(now)}"><span>👥</span>Partager ma journée</a>${state.eleves.length ? `<a class="quick-btn" href="#/appel"><span>🙋</span>${state.appel[localISO(now)] ? "Appel fait ✓" : "Faire l'appel"}</a>` : ""}</div>
        ${fiches.length ? `<h4>Fiches prévues aujourd'hui</h4>${fiches.map((f) => `<a class="item" href="#/fiches/${f.id}">📝 ${esc(f.titre)}</a>`).join("")}` : ""}
      </section>
      <section class="panel">
        <div class="panel-head"><h3>En classe</h3><a href="#/outils" class="link">Tous les outils</a></div>
        <div class="tiles small">${OUTILS.slice(0, 6).map((o) => toolTile(o)).join("")}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h3>Préparer</h3></div>
        <div class="quick">
          <a class="quick-btn" href="#/fiches/modele"><span>📝</span>Nouvelle fiche</a>
          <a class="quick-btn" href="#/evaluations/new"><span>✅</span>Nouvelle évaluation</a>
          <a class="quick-btn" href="#/imprimer"><span>🖨️</span>À imprimer</a>
          ${syncActif() && matchMedia("(pointer:coarse)").matches ? `<a class="quick-btn" href="#/telecommande"><span>📱</span>Télécommande</a>` : ""}
        </div>
        ${recent.length ? `<h4>Dernières fiches</h4>${recent.map((f) => `<a class="item" href="#/fiches/${f.id}">${esc(f.titre)}<span class="hint">${esc(f.discipline)}</span></a>`).join("")}` : ""}
      </section>
    </div>`;
  carteCompte();
}
// Rappel discret pour se connecter (ex. app installée sur iPhone, qui ne partage pas la connexion de Safari).
async function carteCompte() {
  if (!compte.configure() || localStorage.getItem("bagaschool-carte-compte")) return;
  const s = await compte.session().catch(() => null);
  const box = $("#accCompte"); if (s || !box) return;
  box.innerHTML = `<div class="aide-card acc-compte">🔑 <span><b>Tu as un compte ?</b> Connecte-toi pour retrouver tes préparations sur cet appareil.</span>
    <a class="btn primary" href="#/connexion">Me connecter</a><button class="inst-x" aria-label="Masquer" id="accX">✕</button></div>`;
  $("#accX").onclick = () => { localStorage.setItem("bagaschool-carte-compte", "1"); box.innerHTML = ""; };
}

// ---------- EN CLASSE (outils) ----------
let toolCleanup = null;
function viewOutils() {
  const GESTION = ["minuteur", "tirage", "groupes", "voix", "feu", "date"];
  const sections = [
    ["☀️ Au tableau", "Rituels du matin, cahier, calcul posé, géométrie : à projeter et à manipuler.", OUTILS2],
    ["🧑‍🏫 Gérer la classe", "", OUTILS_CLASSE.filter((o) => GESTION.includes(o.id))],
    ["🧮 Maths, mots et dessin", "", OUTILS_CLASSE.filter((o) => !GESTION.includes(o.id))],
    ["✏️ Français", "Du CP au CM2 : étiquettes, homophones, accords, lecture chronométrée. Choisis le niveau dans chaque jeu.", [...FRANCAIS, ...FLUENCE]],
    ["🔢 Maths", "Du CP au CM2 : mesures et conversions, problèmes, géométrie.", [...MESURES, ...GEO]],
    ["🇬🇧 Anglais", "Images et son pour les petits, mots écrits pour les CM.", ANGLAIS],
    ["🎲 Jeux", "Pour réviser en s'amusant, au tableau ou en petits groupes.", JEUX],
    ["🔭 Découvrir", "Sciences et géographie, à explorer ensemble.", DECOUVRIR],
    ...DECOUVRIR_THEMES,
  ];
  app.innerHTML = `<p class="intro">Des outils à projeter au tableau ou à utiliser sur ton téléphone pendant la classe.</p>
    ${sections.map(([t, d, list]) => `<h2 class="section-title">${t}</h2>${d ? `<p class="hint section-desc">${d}</p>` : ""}<div class="tiles">${list.map((o) => toolTile(o, true)).join("")}</div>`).join("")}`;
}
// Barre d'outils du tableau : élèves présents (sans les absents de l'appel de la demi-journée en cours).
function ctxBarre() {
  const a = state.appel?.[localISO(new Date())], demi = new Date().getHours() < 12 ? "matin" : "aprem";
  const pres = state.eleves.filter((e) => a?.[demi]?.[e.id] !== "A");
  return { presents: () => pres.map((e) => e.prenom), absents: state.eleves.length - pres.length };
}
function viewOutil(id) {
  const o = OUTILS.find((x) => x.id === id);
  if (!o) return notFound();
  setTitle(o.nom);
  app.innerHTML = `
    <section class="board" id="board" style="--tile:${o.couleur}">
      <header class="board-head">
        <a href="#/outils" class="round-btn" aria-label="Retour aux outils">←</a>
        <h2><span>${o.icone}</span> ${esc(o.nom)}</h2>
        <button class="round-btn" id="fs" aria-label="Plein écran" title="Plein écran">⛶</button>
      </header>
      <div class="board-body" id="tool"></div>
    </section>`;
  const finOutil = o.mount($("#tool"), { eleves: state.eleves, esc, decks: state.decks, saveDecks: () => save("decks"), cahier: state.cahier, saveCahier: () => save("cahier"), fluence: state.fluence, saveFluence: () => save("fluence") }) || null;
  const finAnnot = installerAnnotation($("#board")), finTap = tapFiable($("#board")), finBarre = installerBarre($("#board"), ctxBarre);
  toolCleanup = () => { finBarre(); finAnnot(); finTap(); finOutil?.(); };
  surveiller();
  $("#fs").onclick = () => {
    const b = $("#board");
    if (document.fullscreenElement) document.exitFullscreen?.();
    else { try { (b.requestFullscreen || b.webkitRequestFullscreen)?.call(b)?.catch?.(() => {}); } catch {} }
  };
}

// ---------- À IMPRIMER (générateurs) ----------
const genTile = (g) => `<a class="tile" href="#/imprimer/${g.id}" style="--tile:${g.couleur}"><span class="tile-ico">${g.icone}</span><span class="tile-name">${esc(g.nom)}</span><span class="tile-desc">${esc(g.desc)}</span></a>`;
function viewImprimer() {
  app.innerHTML = `<p class="intro">Choisis un modèle, règle deux ou trois options, et imprime. Les exercices sont générés automatiquement.</p>
    <div class="tiles">${GENERATEURS.map(genTile).join("")}</div>`;
}
let xRatioCache = null;
async function cursiveRatio() {
  if (xRatioCache) return xRatioCache;
  try {
    await Promise.race([document.fonts.load('100px "Playwrite FR Trad"', "xl"), new Promise((r) => setTimeout(r, 2500))]);
    if (!document.fonts.check('100px "Playwrite FR Trad"')) return 0.42;
    const c = document.createElement("canvas").getContext("2d");
    c.font = '100px "Playwrite FR Trad"';
    const m = c.measureText("x");
    xRatioCache = m.actualBoundingBoxAscent / 100 || 0.42;
  } catch { xRatioCache = 0.42; }
  return xRatioCache;
}
async function viewGenerateur(id) {
  const g = GENERATEURS.find((x) => x.id === id);
  if (!g) return notFound();
  setTitle(g.nom);
  state.reglages.imprimer ??= {};
  const saved = state.reglages.imprimer[id] ?? {};
  const p = Object.fromEntries(g.params.map((x) => [x.key, saved[x.key] ?? (Array.isArray(x.def) ? [...x.def] : x.def)]));
  let seed = saved._seed ?? Math.floor(Math.random() * 1e9);
  const persist = () => { state.reglages.imprimer[id] = { ...p, _seed: seed }; save("reglages"); };
  const field = (x) => {
    const v = p[x.key];
    if (x.type === "seg") return `<div class="field"><span class="field-label">${esc(x.label)}</span><div class="seg wrap">${x.options.map(([val, lab]) => `<button type="button" data-k="${x.key}" data-v="${esc(val)}" class="${String(v) === val ? "on" : ""}">${esc(lab)}</button>`).join("")}</div></div>`;
    if (x.type === "multi") return `<div class="field"><span class="field-label">${esc(x.label)}</span><div class="seg wrap">${x.options.map(([val, lab]) => `<button type="button" data-multi="${x.key}" data-v="${val}" class="${v.includes(val) ? "on" : ""}">${esc(lab)}</button>`).join("")}</div></div>`;
    if (x.type === "toggle") return `<label class="switch"><input type="checkbox" data-k="${x.key}" ${v ? "checked" : ""}><span class="switch-ui"></span>${esc(x.label)}</label>`;
    if (x.type === "select") return `<label>${esc(x.label)}<select data-k="${x.key}">${x.options.map(([val, lab]) => `<option value="${esc(val)}" ${String(v) === val ? "selected" : ""}>${esc(lab)}</option>`).join("")}</select></label>`;
    if (x.type === "textarea") return `<label>${esc(x.label)}<textarea data-k="${x.key}" rows="4">${esc(v)}</textarea></label>`;
    return `<label>${esc(x.label)}<input data-k="${x.key}" value="${esc(v)}"></label>`;
  };
  app.innerHTML = `
    <div class="gen">
      <aside class="gen-form panel">
        <div class="gen-title"><a href="#/imprimer" class="round-btn" aria-label="Retour">←</a><span class="tile-ico" style="--tile:${g.couleur}">${g.icone}</span><h2>${esc(g.nom)}</h2></div>
        <div id="fields"></div>
        <div class="gen-actions">
          ${g.aleatoire ? `<button class="big-btn soft" id="reroll">🔀 Nouvelle série</button>` : ""}
          <button class="big-btn" id="print">🖨️ Imprimer</button>
        </div>
        <p class="hint">Pour un PDF : choisis « Enregistrer en PDF » dans la fenêtre d'impression.</p>
      </aside>
      <section class="gen-preview" id="preview"></section>
    </div>`;
  const drawFields = () => { $("#fields").innerHTML = g.params.map(field).join(""); };
  const ratio = g.id === "ecriture" || g.id === "etiquettes" ? await cursiveRatio() : 0.42;
  if (!$("#preview")) return; // la vue a changé pendant le chargement de la police
  const prev = $("#preview");
  const draw = () => {
    let pages;
    try { pages = g.render(p, { rnd: seeded(seed), esc, eleves: state.eleves, xRatio: ratio }); }
    catch (err) { pages = [`<div class="page"><p>Impossible de générer cette fiche (${esc(err.message)}).</p></div>`]; }
    prev.innerHTML = pages.map((h) => `<div class="page-wrap">${h}</div>`).join("") + (pages.length > 1 ? `<p class="hint center">${pages.length} pages</p>` : "");
    fit();
  };
  const fit = () => {
    const w = prev.clientWidth;
    const pagePx = 210 * 96 / 25.4;
    prev.style.setProperty("--s", Math.min(1, (w - 4) / pagePx));
  };
  const ro = new ResizeObserver(fit); ro.observe(prev);
  toolCleanup = () => ro.disconnect();
  drawFields(); draw();
  const onField = (e) => {
    const t = e.target; const k = t.dataset.k;
    if (!k || t.tagName === "BUTTON") return;
    p[k] = t.type === "checkbox" ? t.checked : t.value;
    persist(); draw();
  };
  app.oninput = onField; app.onchange = onField;
  app.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.k) { p[t.dataset.k] = t.dataset.v; persist(); drawFields(); draw(); }
    if (t.dataset.multi) { const arr = p[t.dataset.multi]; const i = arr.indexOf(t.dataset.v); i >= 0 ? arr.splice(i, 1) : arr.push(t.dataset.v); persist(); drawFields(); draw(); }
    if (t.id === "reroll") { seed = Math.floor(Math.random() * 1e9); persist(); draw(); }
    if (t.id === "print") window.print();
  };
}

// ---------- CALENDRIER SCOLAIRE ----------
const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (s, n) => { const d = new Date(s + "T12:00"); d.setDate(d.getDate() + n); return isoLocal(d); };
const fmtLong = (s) => new Date(s + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtCourt = (s) => new Date(s + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const capit = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function calendrierCourant() {
  const cal = CALENDRIERS[anneeScolaire()];
  const zone = state.reglages.zone;
  if (!cal || !zone) return null;
  const vac = cal.vacances.map((v) => ({ nom: v.nom, debut: v[zone][0], reprise: v[zone][1] }));
  const y1 = +anneeScolaire().slice(0, 4);
  const feries = [...joursFeries(y1), ...joursFeries(y1 + 1)];
  // Périodes : de la rentrée (ou d'une reprise) jusqu'au dernier jour avant les vacances suivantes
  const bornes = [cal.rentree, ...vac.map((v) => v.reprise)];
  const fins = [...vac.map((v) => addDays(v.debut, -1)), addDays(cal.ete, -1)];
  const periodes = bornes.map((d, i) => {
    const semaines = Math.round((new Date(fins[i] + "T12:00") - new Date(d + "T12:00")) / (7 * 864e5));
    return { n: i + 1, debut: d, fin: fins[i], semaines };
  });
  return { ...cal, zone, vac, feries, periodes };
}
const NOMS_VAC = { Toussaint: "Vacances de la Toussaint", "Noël": "Vacances de Noël", Hiver: "Vacances d'hiver", Printemps: "Vacances de printemps" };
function statutJour(dateISO) {
  const c = calendrierCourant();
  const day = new Date(dateISO + "T12:00").getDay();
  if (c) {
    const v = c.vac.find((v) => dateISO >= v.debut && dateISO < v.reprise);
    if (v) return { type: "vacances", nom: NOMS_VAC[v.nom] ?? v.nom };
    if (dateISO < c.rentree || dateISO >= c.ete) return { type: "vacances", nom: "Vacances d'été" };
    const f = c.feries.find((f) => f.date === dateISO);
    if (f) return { type: "ferie", nom: `${f.nom} (jour férié)` };
    const p = c.pontsOfficiels.find((p) => p.date === dateISO);
    if (p) return { type: "ferie", nom: p.nom };
  }
  if (day === 0 || day === 6) return { type: "weekend", nom: "Week-end" };
  return null;
}
function prochainesVacances(dateISO) {
  const c = calendrierCourant(); if (!c) return null;
  const v = [...c.vac.map((v) => ({ nom: v.nom, debut: v.debut })), { nom: "été", debut: c.ete }].find((v) => v.debut > dateISO);
  if (!v) return null;
  const jours = Math.round((new Date(v.debut + "T12:00") - new Date(dateISO + "T12:00")) / 864e5);
  const nom = { "Toussaint": "de la Toussaint", "Noël": "de Noël", "Hiver": "d'hiver", "Printemps": "de printemps", "été": "d'été" }[v.nom] ?? v.nom;
  return { nom, jours };
}
function viewCalendrier() {
  const c = calendrierCourant();
  const zoneSel = `<div class="seg">${["A", "B", "C"].map((z) => `<button data-zone="${z}" class="${state.reglages.zone === z ? "on" : ""}">Zone ${z}</button>`).join("")}</div>`;
  if (!c) {
    app.innerHTML = `<div class="sheet"><h2>Ton calendrier scolaire</h2>
      ${CALENDRIERS[anneeScolaire()] ? `<p>Choisis ta zone pour afficher les vacances et calculer les périodes.</p>${zoneSel}<p class="hint">Zone A : ${ZONES.A}.<br>Zone B : ${ZONES.B}.<br>Zone C : ${ZONES.C}.</p>` : `<p>Le calendrier de l'année ${anneeScolaire()} n'est pas encore dans l'application.</p>`}</div>`;
  } else {
    const today = isoLocal(new Date());
    app.innerHTML = `
      <div class="toolbar">${zoneSel}<span class="hint grow">Année ${anneeScolaire()} · ${esc(ZONES[c.zone])}</span></div>
      <div class="periods-cal">${c.periodes.map((p, i) => `
        <div class="pcal ${today >= p.debut && today <= p.fin ? "now" : ""}">
          <div class="pcal-n">Période ${p.n}</div>
          <div class="pcal-dates">${fmtCourt(p.debut)} → ${fmtCourt(p.fin)}</div>
          <div class="pcal-w">${p.semaines} semaines</div>
        </div>${c.vac[i] ? `<div class="vcal">🏖️ ${NOMS_VAC[c.vac[i].nom] ?? c.vac[i].nom}<span>${fmtCourt(c.vac[i].debut)} → reprise ${fmtCourt(c.vac[i].reprise)}</span></div>` : `<div class="vcal">☀️ Été<span>à partir du ${fmtCourt(c.ete)}</span></div>`}`).join("")}</div>
      <div class="sheet" style="margin-top:16px"><h3>Jours sans classe</h3>
        <ul class="feries">${[...c.feries.filter((f) => f.date >= c.rentree && f.date < c.ete && ![0, 6].includes(new Date(f.date + "T12:00").getDay()) && !c.vac.some((v) => f.date >= v.debut && f.date < v.reprise)), ...c.pontsOfficiels].sort((a, b) => a.date.localeCompare(b.date)).map((f) => `<li><b>${capit(fmtLong(f.date))}</b> · ${esc(f.nom)}</li>`).join("")}</ul>
        <p class="hint">Source : calendrier scolaire officiel (arrêté du 22 octobre 2025), service-public.gouv.fr. Les périodes sont calculées par l'application.</p></div>`;
  }
  app.onclick = (e) => { const z = e.target.closest("[data-zone]"); if (z) { state.reglages.zone = z.dataset.zone; save("reglages"); viewCalendrier(); } };
}

// ---------- CAHIER JOURNAL ----------
const jourDe = (date) => JOURS_JS[new Date(date + "T12:00").getDay()];
const parDebut = (a, b) => a.debut.localeCompare(b.debut);
// Créneaux d'un jour : ceux de l'emploi du temps type, sauf si ce jour a été adapté dans le cahier journal (J.slots).
function creneauxDuJour(date) {
  const perso = state.journal[date]?.slots;
  return [...(perso ?? state.edt.filter((s) => s.jour === jourDe(date)))].sort(parDebut);
}
const lundiDe = (date) => addDays(date, -((new Date(date + "T12:00").getDay() + 6) % 7));
function jourRempli(J) {
  if (!J) return false;
  if (J.slots || J.notes?.trim()) return true;
  return Object.values(J.creneaux ?? {}).some((c) => c.ficheId || c.fait || c.notes?.trim() || c.objectif?.trim() || c.differenciation?.trim() || c.competences?.length || c.supports?.length);
}
// Copie un jour du cahier journal vers une autre date (remplace son contenu). Les cases « Fait » repartent vides.
function copierJour(src, dst) {
  const C = structuredClone(state.journal[src]);
  for (const c of Object.values(C.creneaux ?? {})) delete c.fait;
  // Les contenus sont rangés par créneau : vers un autre jour de la semaine, on emporte aussi les horaires.
  if (!C.slots && jourDe(src) !== jourDe(dst)) C.slots = structuredClone(creneauxDuJour(src));
  C.slots?.forEach((s) => { s.jour = jourDe(dst); });
  state.journal[dst] = { creneaux: C.creneaux ?? {}, notes: C.notes ?? "", ...(C.slots ? { slots: C.slots } : {}) };
}
function dupliquerJournal(date) {
  let mode = "jour";
  const sources = () => (mode === "jour" ? [date] : [0, 1, 2, 3, 4, 5].map((i) => addDays(lundiDe(date), i))).filter((d) => jourRempli(state.journal[d]));
  openModal(`
    <h2>Dupliquer le cahier journal</h2>
    <div class="seg" id="qui"><button type="button" data-q="jour" class="on">Ce jour</button><button type="button" data-q="semaine">Toute la semaine</button></div>
    <label><span id="lbl">Vers le</span><input type="date" id="cible" value="${addDays(date, 7)}"></label>
    <p class="hint">Copie les horaires, les fiches, les objectifs, compétences et différenciation, et les remarques. Les cases « Fait » sont décochées. Les devoirs ne sont pas copiés.</p>
    <p class="err" id="warn"></p>
    <div class="actions"><button type="button" data-close class="ghost">Annuler</button><button type="button" class="primary" id="go">Dupliquer</button></div>`, (m) => {
    const cible = $("#cible", m), warn = $("#warn", m), go = $("#go", m);
    const destination = (d) => (mode === "jour" ? cible.value : addDays(lundiDe(cible.value), (new Date(d + "T12:00").getDay() + 6) % 7));
    const maj = () => {
      $$("#qui button", m).forEach((b) => b.classList.toggle("on", b.dataset.q === mode));
      $("#lbl", m).textContent = mode === "jour" ? "Vers le" : "Vers la semaine du";
      const src = sources();
      const memeDate = cible.value && src.some((d) => destination(d) === d);
      const ecrase = cible.value && src.filter((d) => jourRempli(state.journal[destination(d)])).length;
      warn.textContent = !src.length ? (mode === "jour" ? "Ce jour est vide : rien à copier." : "Cette semaine est vide : rien à copier.")
        : memeDate ? "Choisis une autre date." : ecrase ? `${mode === "jour" ? "Ce jour contient" : `${ecrase} jour(s) de cette semaine contiennent`} déjà quelque chose : ce sera remplacé.` : "";
      go.disabled = !src.length || !cible.value || memeDate;
    };
    $("#qui", m).onclick = (e) => { const b = e.target.closest("[data-q]"); if (b) { mode = b.dataset.q; maj(); } };
    cible.oninput = maj;
    go.onclick = () => {
      const src = sources(); if (!src.length || !cible.value) return;
      for (const d of src) copierJour(d, destination(d));
      save("journal"); closeModal(true);
      location.hash = `#/journal/${destination(mode === "jour" ? date : src[0])}`;
    };
    maj();
  });
}
// Supports d'une séance (c.supports) : liens (synchronisés) et fichiers rangés dans « Mes ressources » (restent sur l'appareil).
let urlsJournal = [];
const lienPropre = (u) => { u = String(u || "").trim(); if (/^www\./i.test(u)) u = "https://" + u; try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; } };
const nomLien = (u) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, "") + (x.pathname.length > 1 ? x.pathname.replace(/\/$/, "").slice(0, 30) : ""); } catch { return u; } };
function supportsHTML(c) {
  const sup = c.supports ?? [];
  return `<div class="jt-sup">${sup.map((x) => `<span class="sup">${x.type === "lien"
      ? `<a href="${esc(x.url)}" target="_blank" rel="noopener" title="${esc(x.url)}">🔗 ${esc(x.titre || nomLien(x.url))}</a><span class="print-only">${esc(x.url)}</span>`
      : `<a href="#/ressources/${esc(x.resId)}" title="Ouvrir">${x.genre === "image" ? `<img data-vig="${esc(x.resId)}" alt="">` : res.ICONES[x.genre] ?? "📁"} ${esc(x.nom)}</a>`}<button type="button" class="x no-print" data-rmsup="${esc(x.id)}" aria-label="Retirer" title="Retirer de la séance (le fichier reste dans Mes ressources)">×</button></span>`).join("")}<button type="button" class="ghost small no-print" data-addsup>📎 Support</button></div>`;
}
// Ajoute à une séance des fichiers (rangés dans Mes ressources), un fichier existant ou un lien.
async function ajouterSupports(c, { files = [], url = "", titre = "", resId = "" }, dossier) {
  const sup = (c.supports ??= []);
  let n = 0;
  for (const file of files) {
    const f = { id: uid(), nom: file.name || "image.png", type: file.type, taille: file.size, dossier, ajoute: new Date().toISOString(), blob: file };
    try { await res.enregistrer(f); sup.push({ id: uid(), type: "fichier", resId: f.id, nom: f.nom, genre: res.genre(f) }); n++; }
    catch (e) { alert(`« ${f.nom} » n'a pas pu être enregistré (${/quota/i.test(e?.name + e?.message) ? "plus assez de place sur l'appareil" : e?.message || e}).`); }
  }
  if (resId) { const f = await res.lire(resId); if (f) { sup.push({ id: uid(), type: "fichier", resId, nom: f.nom, genre: res.genre(f) }); n++; } }
  const u = lienPropre(url); if (u) { sup.push({ id: uid(), type: "lien", url: u, titre: titre.trim() }); n++; }
  return n;
}
const depuisTransfert = (dt) => {
  const files = [...(dt?.files || [])];
  if (files.length) return { files };
  const uri = (dt?.getData("text/uri-list") || "").split(/\r?\n/).find((l) => l && !l.startsWith("#")) || "";
  const txt = dt?.getData("text/plain") || "";
  return { url: uri || (lienPropre(txt) ? txt : "") };
};
function choisirSupport(c, dossier, apres) {
  openModal(`
    <h2>Ajouter un support</h2>
    <div class="sup-drop" id="supDrop"><p>Glisse ici un fichier ou une image, ou colle une capture (Ctrl+V).</p>
      <label class="btn ghost">Choisir un fichier<input type="file" id="supFile" multiple hidden></label></div>
    <div class="row sup-lien"><input id="supUrl" placeholder="Lien : https://…" inputmode="url"><input id="supTit" placeholder="Nom (facultatif)"><button type="button" class="primary" id="supOk">Ajouter le lien</button></div>
    <div id="supRes"></div>
    <p class="hint">Les fichiers sont rangés dans <a href="#/ressources">Mes ressources</a> (dossier « ${esc(dossier)} ») et restent sur cet appareil. Les liens suivent ton compte.</p>
    <p class="err" id="supErr"></p>
    <div class="actions"><button type="button" data-close class="ghost">Fermer</button></div>`, (m) => {
    const fini = (n) => { if (n) { closeModal(true); apres(); } };
    $("#supFile", m).onchange = async (e) => fini(await ajouterSupports(c, { files: [...e.target.files] }, dossier));
    $("#supOk", m).onclick = async () => {
      if (!lienPropre($("#supUrl", m).value)) { $("#supErr", m).textContent = "Ce lien n'est pas valide (il doit commencer par http:// ou https://)."; return; }
      fini(await ajouterSupports(c, { url: $("#supUrl", m).value, titre: $("#supTit", m).value }, dossier));
    };
    const z = $("#supDrop", m);
    z.ondragover = (e) => { e.preventDefault(); z.classList.add("survol"); };
    z.ondragleave = () => z.classList.remove("survol");
    z.ondrop = async (e) => { e.preventDefault(); e.stopPropagation(); z.classList.remove("survol"); fini(await ajouterSupports(c, depuisTransfert(e.dataTransfer), dossier)); };
    m.onpaste = async (e) => { // la modale est réutilisée : on se débranche dès qu'elle affiche autre chose
      if (!$("#supDrop", m)) { m.onpaste = null; return; }
      const files = [...(e.clipboardData?.files || [])];
      if (files.length) { e.preventDefault(); fini(await ajouterSupports(c, { files }, dossier)); }
    };
    res.lister().then((liste) => {
      if (!liste.length || !$("#supRes", m)) return;
      $("#supRes", m).innerHTML = `<label>Ou un fichier déjà dans Mes ressources<select id="supSel"><option value="">— Choisir —</option>${liste.map((f) => `<option value="${esc(f.id)}">${esc((f.dossier ? f.dossier + " · " : "") + f.nom)}</option>`).join("")}</select></label>`;
      $("#supSel", m).onchange = async (e) => { if (e.target.value) fini(await ajouterSupports(c, { resId: e.target.value }, dossier)); };
    }).catch(() => {});
  });
}
function viewJournal(dateISO) {
  const date = dateISO || isoLocal(new Date());
  urlsJournal.forEach((u) => URL.revokeObjectURL(u)); urlsJournal = [];
  if (!dateISO) { location.replace(`#/journal/${date}`); return; }
  const jour = jourDe(date);
  const slots = creneauxDuJour(date);
  const st = statutJour(date);
  const J = (state.journal[date] ??= { creneaux: {}, notes: "" });
  const perso = !!J.slots;
  const app_ = state.appel[date];
  const absents = app_ ? state.eleves.filter((e) => app_.matin?.[e.id] === "A" || app_.aprem?.[e.id] === "A") : [];
  const fichesDuJour = state.fiches.filter((f) => f.date === date);
  const ficheOpts = (sel, disc) => {
    const list = [...state.fiches].sort((a, b) => (b.discipline === disc) - (a.discipline === disc));
    return `<option value="">— Aucune fiche —</option>` + list.map((f) => `<option value="${f.id}" ${f.id === sel ? "selected" : ""}>${esc(f.titre)}${f.discipline ? ` (${esc(f.discipline)})` : ""}</option>`).join("");
  };
  const peda = (c) => {
    const rempli = c.objectif?.trim() || c.competences?.length || c.differenciation?.trim();
    return `<details class="jt-peda${rempli ? "" : " vide"}" ${rempli ? "open" : ""}><summary>🎯 Objectif, compétences, différenciation</summary>
      <label>Objectif<textarea data-p="objectif" rows="1" placeholder="À la fin de la séance, les élèves sauront…">${esc(c.objectif ?? "")}</textarea></label>
      <div class="label-row"><span>Compétences</span><button type="button" class="ghost small no-print" data-addc>+ Insérer</button></div>
      <div class="chips">${compChips(c.competences ?? [], true) || `<span class="hint no-print">Aucune.</span>`}</div>
      <label>Différenciation<textarea data-p="differenciation" rows="1" placeholder="Aides, groupes, adaptations…">${esc(c.differenciation ?? "")}</textarea></label></details>`;
  };
  const cellule = (s, html) => (perso ? `<button class="jt-edit" data-slot="${s.id}" title="Modifier ce créneau pour ce jour">${html}</button>` : html);
  app.innerHTML = `
    <div class="toolbar no-print">
      <a class="round-btn ghost" href="#/journal/${addDays(date, -1)}" aria-label="Jour précédent">‹</a>
      <input type="date" id="dp" value="${date}" style="width:auto">
      <a class="round-btn ghost" href="#/journal/${addDays(date, 1)}" aria-label="Jour suivant">›</a>
      <a class="pill" href="#/journal/${isoLocal(new Date())}">Aujourd'hui</a>
      <span class="grow"></span>
      <a class="btn ghost" href="#/partager/${date}">👥 Partager la journée</a><button class="ghost" id="dup">📋 Dupliquer</button><button class="ghost" id="pday">🖨️ Imprimer le jour</button><button class="ghost" id="pweek">🖨️ Imprimer la semaine</button>
    </div>
    <div class="sheet journal">
      <h2 class="journal-date">${capit(fmtLong(date))}</h2>
      ${st && st.type !== "weekend" ? `<div class="banner-soft">🏖️ ${esc(st.nom)}</div>` : ""}
      <div class="journal-meta">${state.eleves.length ? `<a href="#/appel/${date}" class="chip-link">👧 ${app_ ? `${state.eleves.length - absents.length} présent(s), ${absents.length} absent(s)${absents.length ? " : " + absents.map((e) => esc(e.prenom)).join(", ") : ""}` : "Faire l'appel"}</a>` : ""}</div>
      ${slots.length || perso ? `<p class="hint jt-source no-print">${perso
        ? `✏️ Horaires adaptés pour ce jour seulement. Touche un horaire pour le modifier. <button class="link" id="reset">Reprendre l'emploi du temps</button>`
        : `Horaires repris de ton <a href="#/edt">emploi du temps</a>. <button class="link" id="adapt">Modifier pour ce jour</button>`}</p>` : ""}
      ${slots.length ? `<table class="jtable"><thead><tr><th>Horaire</th><th>Discipline</th><th>Fiche / contenu</th><th class="no-print">Fait</th></tr></thead><tbody>
        ${slots.map((s) => { const c = J.creneaux[s.id] ?? {}; const f = state.fiches.find((x) => x.id === c.ficheId);
          return `<tr data-s="${s.id}" style="--c:${s.couleur}" class="${c.fait ? "done" : ""}">
            <td class="jt-time">${cellule(s, `${esc(s.debut)}<br><span class="hint">${esc(s.fin)}</span>`)}</td>
            <td class="jt-disc">${cellule(s, `<b>${esc(s.discipline)}</b>${s.libelle ? `<br><span class="hint">${esc(s.libelle)}</span>` : ""}`)}</td>
            <td><div class="row no-print"><select data-fiche="${s.id}">${ficheOpts(c.ficheId, s.discipline)}</select>${f ? `<a class="pill" href="#/fiches/${f.id}">Ouvrir</a>` : `<button class="pill" data-newfiche="${s.id}">+ Créer</button>`}</div>
              ${f ? `<div class="print-only"><b>${esc(f.titre)}</b>${f.objectif && !c.objectif?.trim() ? ` — ${esc(f.objectif)}` : ""}</div>` : ""}
              <textarea data-note="${s.id}" rows="2" placeholder="Contenu, remarques…">${esc(c.notes ?? "")}</textarea>
              ${supportsHTML(c)}
              ${peda(c)}</td>
            <td class="no-print jt-done"><input type="checkbox" data-fait="${s.id}" ${c.fait ? "checked" : ""} aria-label="Fait"></td></tr>`; }).join("")}
        </tbody></table>` : `<div class="empty"><span>📅</span><p>${st?.type === "weekend" && !perso ? "C'est le week-end !" : `Aucun créneau ${perso ? "pour ce jour" : `le ${jour.toLowerCase()} dans ton emploi du temps`}.`}</p>${st?.type === "weekend" || perso ? "" : `<a class="primary btn" href="#/edt">Compléter l'emploi du temps</a>`}</div>`}
      ${perso || (!slots.length && st?.type !== "weekend") ? `<button class="ghost small no-print" id="addslot">+ Créneau pour ce jour seulement</button>` : ""}
      ${fichesDuJour.length ? `<p class="hint">Fiches datées de ce jour : ${fichesDuJour.map((f) => `<a href="#/fiches/${f.id}">${esc(f.titre)}</a>`).join(", ")}</p>` : ""}
      <div class="devoirs-box"><div class="label-row"><span>📚 Devoirs à donner pour le ${fmtCourt(prochainJourClasse(date))}</span><a class="link no-print" href="#/devoirs">Tous les devoirs</a></div>
        ${devoirsEditeur(prochainJourClasse(date))}</div>
      <label>Remarques du jour<textarea id="jn" rows="3">${esc(J.notes)}</textarea></label>
    </div>
    <div id="weekPrint" class="print-week"></div>`;
  $("#dp").onchange = (e) => { if (e.target.value) location.hash = `#/journal/${e.target.value}`; };
  const persist = () => save("journal");
  const redraw = () => viewJournal(date);
  const C = (id) => (J.creneaux[id] ??= {});
  const adapter = () => { if (!J.slots) J.slots = structuredClone(slots); }; // copie les créneaux du jour depuis l'emploi du temps
  const cibleJour = { jourFixe: true, liste: () => (adapter(), J.slots), apres: () => { persist(); redraw(); } };
  brancherDevoirs(app, redraw);
  // vignettes des images jointes (fichier absent sur un autre appareil : ⚠️)
  $$("img[data-vig]", app).forEach((img) => res.lire(img.dataset.vig).then((f) => {
    if (!f) { img.closest("a")?.setAttribute("title", "Fichier absent de cet appareil"); img.replaceWith("⚠️"); return; }
    const u = URL.createObjectURL(f.blob); urlsJournal.push(u); img.src = u;
  }).catch(() => {}));
  toolCleanup = () => { urlsJournal.forEach((u) => URL.revokeObjectURL(u)); urlsJournal = []; };
  const dossierDe = (sid) => slots.find((x) => x.id === sid)?.discipline || "Cahier journal";
  const zoneDe = (e) => e.target.closest?.("tr[data-s]");
  app.ondragover = (e) => {
    const tr = zoneDe(e), ty = [...(e.dataTransfer?.types || [])];
    if (!tr || !(ty.includes("Files") || ty.includes("text/uri-list"))) return;
    e.preventDefault(); $$("tr.survol", app).forEach((x) => x !== tr && x.classList.remove("survol")); tr.classList.add("survol");
  };
  app.ondragleave = (e) => { const tr = zoneDe(e); if (tr && !tr.contains(e.relatedTarget)) tr.classList.remove("survol"); };
  app.ondrop = async (e) => {
    const tr = zoneDe(e); if (!tr) return;
    e.preventDefault(); tr.classList.remove("survol");
    if (await ajouterSupports(C(tr.dataset.s), depuisTransfert(e.dataTransfer), dossierDe(tr.dataset.s))) { persist(); redraw(); }
  };
  app.oninput = (e) => {
    const t = e.target;
    if (t.dataset.dv !== undefined) return;
    if (t.dataset.note) { C(t.dataset.note).notes = t.value; persist(); }
    if (t.dataset.p) { C(t.closest("tr").dataset.s)[t.dataset.p] = t.value; persist(); }
    if (t.id === "jn") { J.notes = t.value; persist(); }
  };
  app.onchange = (e) => {
    const t = e.target;
    if (t.dataset.fiche) {
      const c = C(t.dataset.fiche); c.ficheId = t.value || null;
      const f = state.fiches.find((x) => x.id === c.ficheId);
      if (f) { // reprend ce que la fiche précise déjà, sans écraser ce qui est saisi ici
        if (!c.objectif?.trim() && f.objectif) c.objectif = f.objectif;
        if (!c.competences?.length && f.competences?.length) c.competences = [...f.competences];
        if (!c.differenciation?.trim() && f.differenciation) c.differenciation = f.differenciation;
      }
      persist(); redraw();
    }
    if (t.dataset.fait) { C(t.dataset.fait).fait = t.checked; persist(); t.closest("tr").classList.toggle("done", t.checked); }
  };
  app.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.dvadd || t.dataset.dvrm) return;
    const sid = t.closest("tr")?.dataset.s;
    if (t.dataset.addc !== undefined) { const c = C(sid); pickCompetences(c.competences ?? [], (ids) => { c.competences = ids; persist(); redraw(); }); }
    if (t.dataset.rmcomp) { const c = C(sid); c.competences = (c.competences ?? []).filter((x) => x !== t.dataset.rmcomp); persist(); redraw(); }
    if (t.dataset.newfiche) {
      const s = slots.find((x) => x.id === t.dataset.newfiche), c = C(s.id);
      const f = newFiche({ titre: `${s.discipline}${s.libelle ? " – " + s.libelle : ""}`, discipline: DISCIPLINES.includes(s.discipline) ? s.discipline : "", date,
        objectif: c.objectif ?? "", competences: [...(c.competences ?? [])], differenciation: c.differenciation ?? "" });
      c.ficheId = f.id; persist(); location.hash = `#/fiches/${f.id}`;
    }
    if (t.id === "adapt") { adapter(); persist(); redraw(); }
    if (t.id === "reset" && confirm("Reprendre les horaires de l'emploi du temps pour ce jour ? Les créneaux ajoutés seulement pour ce jour seront retirés.")) {
      delete J.slots;
      const ids = new Set(creneauxDuJour(date).map((s) => s.id));
      for (const k of Object.keys(J.creneaux)) if (!ids.has(k)) delete J.creneaux[k];
      persist(); redraw();
    }
    if (t.dataset.slot) editSlot(J.slots.find((s) => s.id === t.dataset.slot), cibleJour);
    if (t.id === "addslot") editSlot({ jour }, cibleJour);
    if (t.id === "dup") dupliquerJournal(date);
    if (t.dataset.addsup !== undefined) choisirSupport(C(sid), dossierDe(sid), () => { persist(); redraw(); });
    if (t.dataset.rmsup) { const c = C(sid); c.supports = (c.supports ?? []).filter((x) => x.id !== t.dataset.rmsup); persist(); redraw(); }
    if (t.id === "pday") { $("#weekPrint").innerHTML = ""; window.print(); }
    if (t.id === "pweek") { $("#weekPrint").innerHTML = semaineHTML(date); document.body.classList.add("print-week-mode"); window.print(); setTimeout(() => document.body.classList.remove("print-week-mode"), 500); }
  };
}
function semaineHTML(date) {
  const lundi = lundiDe(date);
  return [0, 1, 2, 3, 4, 5].map((i) => addDays(lundi, i)).filter((x) => creneauxDuJour(x).length).map((x) => {
    const J = state.journal[x]?.creneaux ?? {};
    const st = statutJour(x);
    return `<section class="pw-day"><h2>${capit(fmtLong(x))}</h2>${st && st.type !== "weekend" ? `<p><b>${esc(st.nom)}</b></p>` : `<table class="jtable"><tbody>${creneauxDuJour(x).map((s) => { const c = J[s.id] ?? {}; const f = state.fiches.find((y) => y.id === c.ficheId);
      const comp = (c.competences ?? []).map((id) => compById[id]?.texte).filter(Boolean);
      return `<tr><td class="jt-time">${esc(s.debut)}–${esc(s.fin)}</td><td class="jt-disc"><b>${esc(s.discipline)}</b> ${esc(s.libelle ?? "")}</td><td>${f ? `<b>${esc(f.titre)}</b>${f.objectif && !c.objectif?.trim() ? " — " + esc(f.objectif) : ""}<br>` : ""}${c.objectif?.trim() ? `🎯 ${esc(c.objectif)}<br>` : ""}${comp.length ? `<span class="hint">${comp.map(esc).join(" · ")}</span><br>` : ""}${esc(c.notes ?? "")}${c.differenciation?.trim() ? `<br><i>Différenciation : ${esc(c.differenciation)}</i>` : ""}${c.supports?.length ? `<br>📎 ${c.supports.map((x) => esc(x.type === "lien" ? `${x.titre ? x.titre + " : " : ""}${x.url}` : x.nom)).join(" · ")}` : ""}</td></tr>`; }).join("")}</tbody></table>`}${state.journal[x]?.notes ? `<p>${esc(state.journal[x].notes)}</p>` : ""}</section>`;
  }).join("");
}

// ---------- APPEL ----------
function viewAppel(dateISO) {
  const date = dateISO || isoLocal(new Date());
  if (!dateISO) { location.replace(`#/appel/${date}`); return; }
  if (!state.eleves.length) { app.innerHTML = `<div class="empty"><span>👧🧒</span><p>Ajoute d'abord tes élèves.</p><a class="primary btn" href="#/classe">Mes élèves</a></div>`; return; }
  let demi = new Date().getHours() >= 12 && date === isoLocal(new Date()) ? "aprem" : "matin";
  const A = () => (state.appel[date] ??= { matin: {}, aprem: {}, cantine: {} });
  const draw = () => {
    const a = state.appel[date] ?? { matin: {}, aprem: {}, cantine: {} };
    const abs = state.eleves.filter((e) => a[demi][e.id] === "A").length, ret = state.eleves.filter((e) => a[demi][e.id] === "R").length;
    const cant = state.eleves.filter((e) => a.cantine[e.id]).length;
    app.innerHTML = `
      <div class="toolbar">
        <a class="round-btn ghost" href="#/appel/${addDays(date, -1)}" aria-label="Jour précédent">‹</a>
        <input type="date" id="dp" value="${date}" style="width:auto">
        <a class="round-btn ghost" href="#/appel/${addDays(date, 1)}" aria-label="Jour suivant">›</a>
        <div class="seg"><button data-demi="matin" class="${demi === "matin" ? "on" : ""}">☀️ Matin</button><button data-demi="aprem" class="${demi === "aprem" ? "on" : ""}">🌤️ Après-midi</button></div>
        <a class="pill" href="#/appel/bilan">Bilan du mois</a>
      </div>
      <div class="appel-sum"><span class="ok">✅ ${state.eleves.length - abs} présent(s)</span><span class="ko">❌ ${abs} absent(s)</span>${ret ? `<span class="late">⏰ ${ret} retard(s)</span>` : ""}<span class="cant">🍽️ ${cant} à la cantine</span></div>
      <p class="hint">Touche un prénom pour passer de présent à absent, puis en retard. Touche 🍽️ pour la cantine.</p>
      <div class="appel-grid">${state.eleves.map((e) => { const v = a[demi][e.id] ?? "P";
        return `<div class="appel-card s-${v}"><button class="appel-name" data-e="${e.id}"><span class="appel-ico">${v === "A" ? "❌" : v === "R" ? "⏰" : "✅"}</span>${esc(e.prenom)}</button><button class="appel-cant ${a.cantine[e.id] ? "on" : ""}" data-c="${e.id}" aria-label="Cantine ${esc(e.prenom)}">🍽️</button></div>`; }).join("")}</div>`;
    $("#dp").onchange = (ev) => { if (ev.target.value) location.hash = `#/appel/${ev.target.value}`; };
  };
  app.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.demi) demi = t.dataset.demi;
    if (t.dataset.e) { const a = A(), cur = a[demi][t.dataset.e] ?? "P"; const next = { P: "A", A: "R", R: "P" }[cur]; if (next === "P") delete a[demi][t.dataset.e]; else a[demi][t.dataset.e] = next; save("appel"); }
    if (t.dataset.c) { const a = A(); a.cantine[t.dataset.c] = !a.cantine[t.dataset.c]; save("appel"); }
    draw();
  };
  draw();
}
function viewAppelBilan() {
  const now = new Date();
  let ym = state.reglages._bilanMois ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const draw = () => {
    const jours = Object.keys(state.appel).filter((d) => d.startsWith(ym)).sort();
    const rows = state.eleves.map((e) => {
      let a = 0, r = 0, c = 0;
      for (const d of jours) { const x = state.appel[d]; for (const k of ["matin", "aprem"]) { if (x[k]?.[e.id] === "A") a++; if (x[k]?.[e.id] === "R") r++; } if (x.cantine?.[e.id]) c++; }
      return { e, a, r, c };
    });
    app.innerHTML = `
      <div class="toolbar"><a class="pill" href="#/appel">← Appel</a><input type="month" id="mo" value="${ym}" style="width:auto"><span class="grow"></span><button class="ghost" onclick="print()">🖨️ Imprimer</button></div>
      <div class="sheet"><h2>Bilan ${new Date(ym + "-15").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h2>
      <p class="hint">${jours.length} jour(s) d'appel enregistrés. Les absences sont comptées en demi-journées.</p>
      <table><thead><tr><th>Élève</th><th>Demi-journées d'absence</th><th>Retards</th><th>Repas à la cantine</th></tr></thead>
      <tbody>${rows.map(({ e, a, r, c }) => `<tr><td><a href="#/classe/${e.id}">${esc(e.prenom)}</a></td><td>${a}</td><td>${r}</td><td>${c}</td></tr>`).join("")}</tbody></table></div>`;
    $("#mo").onchange = (ev) => { ym = ev.target.value; draw(); };
  };
  draw();
}

// ---------- SUIVI ÉLÈVE ----------
// Graphiques : dernier résultat de chaque élève pour chaque compétence (comme le tableau de suivi),
// regroupés par discipline puis par domaine du référentiel (ou domaine saisi pour un item libre).
const ACQUIS = (c) => c === "A" || c === "D";
const vide4 = () => ({ NA: 0, PA: 0, A: 0, D: 0 });
const nb4 = (c) => c.NA + c.PA + c.A + c.D;
function domainesConnus(discipline) {
  const s = new Set(ALL_COMP.filter((c) => !discipline || c.discipline === discipline).map((c) => c.domaine));
  for (const ev of state.evaluations) for (const it of ev.items) if (!it.compId && it.domaine?.trim()) s.add(it.domaine.trim());
  return [...s].filter(Boolean).sort((a, b) => a.localeCompare(b, "fr"));
}
// { discipline: { domaine: { eleveId: {NA,PA,A,D} } } }
function statsDomaines() {
  const out = {};
  for (const c of resultatsParCompetence(null)) for (const [elId, r] of Object.entries(c.res)) {
    const dom = ((out[c.discipline] ??= {})[c.domaine] ??= {});
    (dom[elId] ??= vide4())[r.code]++;
  }
  return out;
}
const somme4 = (list) => list.reduce((t, c) => { for (const k in t) t[k] += c[k]; return t; }, vide4());
const pctAcquis = (c) => (nb4(c) ? Math.round(((c.A + c.D) / nb4(c)) * 100) : null);
// Couleur continue rouge → vert selon le pourcentage d'acquis (pas de seuil arbitraire).
const teinte = (p) => (p == null ? "#f4f1fb" : `hsl(${Math.round(p * 1.2)} 70% 84%)`);
function barreEleve(c, classePct, label, fort = false) {
  const t = nb4(c) || 1, p = pctAcquis(c);
  return `<div class="gline${fort ? " fort" : ""}"><span class="gl">${esc(label)}</span>
    <div class="gbar" title="${CODES.slice(1).map((x) => `${x.label} : ${c[x.code]}`).join(" · ")}">${["D", "A", "PA", "NA"].map((k) => c[k] ? `<span class="r-${k}" style="width:${(c[k] / t) * 100}%">${c[k]}</span>` : "").join("")}
      ${classePct != null ? `<i class="gmark" style="left:${classePct}%" title="Classe : ${classePct} % d'acquis"></i>` : ""}</div>
    <span class="gv"><b>${p} %</b> <small>${c.A + c.D}/${nb4(c)}</small></span></div>`;
}
function graphiqueEleve(id) {
  const st = statsDomaines();
  const discs = Object.entries(st).filter(([, doms]) => Object.values(doms).some((d) => d[id]));
  if (!discs.length) return `<p class="hint">Pas encore de résultats saisis pour cet élève.</p>`;
  return `<div class="graph">${discs.map(([disc, doms]) => {
    const lignes = Object.entries(doms).filter(([, d]) => d[id]).sort((a, b) => a[0].localeCompare(b[0], "fr"));
    const elTot = somme4(lignes.map(([, d]) => d[id])), clTot = somme4(lignes.flatMap(([, d]) => Object.values(d)));
    return `<section class="gdisc"><h4>${esc(disc)}</h4>
      ${barreEleve(elTot, pctAcquis(clTot), "Ensemble", true)}
      ${lignes.length > 1 || lignes[0][0] !== "Non classé" ? lignes.map(([dom, d]) => barreEleve(d[id], pctAcquis(somme4(Object.values(d))), dom)).join("") : ""}</section>`;
  }).join("")}
  <p class="hint">${CODES.slice(1).reverse().map((c) => `<span class="legend-dot r-${c.code}"></span> ${c.label}`).join(" &nbsp; ")} &nbsp; <i class="gmark-l"></i> moyenne de la classe (% d'atteint ou dépassé). Dernier résultat pour chaque compétence.</p></div>`;
}

const DISPOSITIFS = ["PPRE", "PAP", "PPS", "PAI", "RASED"];
const TYPES_NOTE = ["Progrès", "Difficulté", "Remarque", "Échange avec la famille", "Équipe éducative"];
const TYPES_BILAN = ["Orthophonie", "Neuropsychologie", "Psychologue (Éducation nationale)", "Psychologue (libéral)", "Psychomotricité", "Ergothérapie", "Orthoptie", "Médecin / pédiatre", "Autre"];
function ficheEleve(el) {
  return (el.fiche ??= {}), Object.assign(el.fiche, { dispositifs: el.fiche.dispositifs ?? [], dispositifAutre: el.fiche.dispositifAutre ?? "", pointsForts: el.fiche.pointsForts ?? "", difficultes: el.fiche.difficultes ?? "", amenagements: el.fiche.amenagements ?? "", notes: el.fiche.notes ?? [], bilans: el.fiche.bilans ?? [] });
}

function viewEleve(id, sub) {
  const el = state.eleves.find((x) => x.id === id);
  if (!el) return notFound();
  setTitle(el.prenom);
  const onglets = `<div class="tabs grow"><a class="${sub !== "fiche" ? "on" : ""}" href="#/classe/${id}">📊 Résultats</a><a class="${sub === "fiche" ? "on" : ""}" href="#/classe/${id}/fiche">📝 Fiche élève</a></div>`;
  if (sub === "fiche") return viewFicheEleve(el, onglets);
  const evs = state.evaluations.filter((ev) => ev.items.length && ev.resultats[id] && Object.values(ev.resultats[id]).some(Boolean));
  const counts = vide4();
  for (const ev of evs) for (const v of Object.values(ev.resultats[id])) if (v) counts[v]++;
  const total = nb4(counts);
  let absA = 0, absR = 0;
  for (const x of Object.values(state.appel)) for (const k of ["matin", "aprem"]) { if (x[k]?.[id] === "A") absA++; if (x[k]?.[id] === "R") absR++; }
  el.observations ??= "";
  app.innerHTML = `
    <div class="toolbar no-print"><a class="pill" href="#/classe">← Mes élèves</a>${onglets}<button class="ghost" onclick="print()">🖨️ Imprimer le bilan</button></div>
    <div class="sheet">
      <h2>${esc(el.prenom)}</h2>
      <div class="stats"><div><b>${evs.length}</b><span>évaluation(s)</span></div><div><b>${total ? Math.round(((counts.A + counts.D) / total) * 100) + " %" : "—"}</b><span>items atteints ou dépassés</span></div><div><b>${absA}</b><span>demi-journée(s) d'absence</span></div><div><b>${absR}</b><span>retard(s)</span></div></div>
      <h3>Où en est ${esc(el.prenom)} ?</h3>
      ${graphiqueEleve(id)}
      ${evs.map((ev) => `<h4>${esc(ev.titre)} <span class="hint">${esc(ev.discipline)} ${ev.date ? "· " + fmtDate(ev.date) : ""}</span></h4>
        <table class="items"><tbody>${ev.items.map((it, k) => { const v = ev.resultats[id]?.[k]; return v ? `<tr><td>${esc(itemText(it))}</td><td class="code"><span class="res r-${v}">${v}</span></td></tr>` : ""; }).join("")}</tbody></table>`).join("")}
      ${(() => { const comps = resultatsParCompetence(null).filter((c) => c.res[id]); if (!comps.length) return "";
        const parD = {}; for (const c of comps) (parD[c.discipline] ??= []).push(c);
        return `<h3>Compétences évaluées (dernier résultat)</h3>${Object.entries(parD).map(([dd, cs]) => `<h4>${esc(dd)} <span class="hint">${cs.filter((c) => ACQUIS(c.res[id].code)).length} acquise(s) sur ${cs.length}</span></h4><table class="items"><tbody>${cs.map((c) => `<tr><td>${esc(c.texte)}</td><td class="code"><span class="res r-${c.res[id].code}">${c.res[id].code}</span></td></tr>`).join("")}</tbody></table>`).join("")}`; })()}
      ${(() => { const fl = (state.fluence ?? []).filter((r) => r.eleveId === id).sort((a, b) => a.date.localeCompare(b.date)); if (!fl.length) return "";
        return `<h3>Lecture chronométrée</h3><table class="items"><thead><tr><th>Date</th><th>Texte</th><th>Mots lus</th><th>Erreurs</th><th>Mots correctement lus / min</th></tr></thead><tbody>${fl.map((r) => `<tr><td>${new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</td><td>${esc(r.titre)} <span class="hint">${r.niveau}</span></td><td>${r.lus}</td><td>${r.erreurs}</td><td><b>${r.mclm}</b></td></tr>`).join("")}</tbody></table>`; })()}
      <label>Observations (pour le livret, les rendez-vous avec les parents…)<textarea id="obs" rows="4">${esc(el.observations)}</textarea></label>
    </div>`;
  $("#obs").oninput = (e) => { el.observations = e.target.value; save("eleves"); };
}

function viewFicheEleve(el, onglets) {
  const f = ficheEleve(el);
  const today = localISO(new Date());
  const draw = () => {
    const notes = [...f.notes].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const bilans = [...f.bilans].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    app.innerHTML = `
    <div class="toolbar no-print"><a class="pill" href="#/classe">← Mes élèves</a>${onglets}<button class="ghost" onclick="print()">🖨️ Imprimer la fiche</button></div>
    <p class="notice no-print">🔒 <b>Informations sensibles.</b> Cette fiche reste sur cet appareil : elle n'est jamais envoyée sur le serveur ni synchronisée. Elle figure en revanche dans le fichier de sauvegarde que tu exportes : range-le en lieu sûr. Note ce qui sert en classe plutôt que des diagnostics détaillés, et évite d'afficher cette page au tableau.</p>
    <div class="sheet fiche-eleve">
      <h2>${esc(el.prenom)} <span class="hint print-only">· fiche élève, confidentiel</span></h2>
      <h3>Dispositifs</h3>
      <div class="seg wrap disp">${DISPOSITIFS.map((d) => `<button type="button" data-disp="${d}" class="${f.dispositifs.includes(d) ? "on" : ""}">${d}</button>`).join("")}</div>
      <input data-f="dispositifAutre" value="${esc(f.dispositifAutre)}" placeholder="Autre (ex. AESH 6 h/semaine, ULIS…)">
      <div class="grid2">
        <label>Points d'appui, réussites<textarea data-f="pointsForts" rows="4">${esc(f.pointsForts)}</textarea></label>
        <label>Difficultés observées<textarea data-f="difficultes" rows="4">${esc(f.difficultes)}</textarea></label>
      </div>
      <label>Aménagements en classe (place, supports, temps, outils…)<textarea data-f="amenagements" rows="3">${esc(f.amenagements)}</textarea></label>

      <div class="label-row"><h3>Suivi au fil de l'année</h3><button type="button" class="ghost small no-print" id="addNote">+ Ajouter une note</button></div>
      ${notes.length ? `<ul class="fnotes">${notes.map((n) => `<li><span class="ftag t-${TYPES_NOTE.indexOf(n.type)}">${esc(n.type)}</span><span class="hint">${n.date ? fmtDate(n.date) : ""}</span><p>${esc(n.texte)}</p><span class="no-print"><button class="ghost small" data-enote="${n.id}">Modifier</button></span></li>`).join("")}</ul>` : `<p class="hint">Note ici les progrès, les difficultés repérées, les échanges avec la famille, avec leur date.</p>`}

      <div class="label-row"><h3>Bilans et prises en charge</h3><button type="button" class="ghost small no-print" id="addBilan">+ Ajouter un bilan</button></div>
      ${bilans.length ? `<div class="fbilans">${bilans.map((b) => `<div class="fbilan"><b>${esc(b.type)}</b> <span class="hint">${b.date ? "bilan du " + fmtDate(b.date) : "date non précisée"}${b.qui ? " · " + esc(b.qui) : ""}${b.enCours ? " · suivi en cours" : ""}${b.suite ? " · à revoir le " + fmtDate(b.suite) : ""}</span>
        ${b.texte ? `<p>${esc(b.texte)}</p>` : ""}<span class="no-print"><button class="ghost small" data-ebilan="${b.id}">Modifier</button></span></div>`).join("")}</div>` : `<p class="hint">Orthophonie, neuropsychologie, psychologue… Date du bilan, et ce qu'il change pour la classe.</p>`}
    </div>`;
  };
  draw();
  app.oninput = (e) => { const k = e.target.dataset.f; if (k) { f[k] = e.target.value; save("eleves"); } };
  const formNote = (n) => openModal(`<h2>${n ? "Modifier la note" : "Nouvelle note"}</h2><form id="fn">
      <div class="grid2"><label>Date<input type="date" name="date" value="${esc(n?.date ?? today)}"></label>
      <label>Type<select name="type">${opts(TYPES_NOTE, n?.type ?? "Progrès", null)}</select></label></div>
      <label>Note<textarea name="texte" rows="4" required>${esc(n?.texte ?? "")}</textarea></label>
      <div class="actions">${n ? `<button type="button" class="danger" id="rm">Supprimer</button>` : ""}<span class="grow"></span><button type="button" class="ghost" data-close>Annuler</button><button class="primary">Enregistrer</button></div></form>`, (m) => {
    $("#fn", m).onsubmit = (e) => { e.preventDefault(); const d = formData(e.target); if (n) Object.assign(n, d); else f.notes.push({ id: uid(), ...d }); save("eleves"); closeModal(true); draw(); };
    $("#rm", m)?.addEventListener("click", () => { if (!confirm("Supprimer cette note ?")) return; f.notes = f.notes.filter((x) => x !== n); save("eleves"); closeModal(true); draw(); });
  });
  const formBilan = (b) => openModal(`<h2>${b ? "Modifier le bilan" : "Nouveau bilan"}</h2><form id="fb">
      <div class="grid2"><label>Type<select name="type">${opts(TYPES_BILAN, b?.type ?? "Orthophonie", null)}</select></label>
      <label>Date du bilan<input type="date" name="date" value="${esc(b?.date ?? "")}"></label></div>
      <label>Professionnel (facultatif)<input name="qui" value="${esc(b?.qui ?? "")}" placeholder="ex. orthophoniste de ville"></label>
      <label>Ce qu'il faut retenir pour la classe<textarea name="texte" rows="5">${esc(b?.texte ?? "")}</textarea></label>
      <div class="grid2"><label class="check"><input type="checkbox" name="enCours" ${b?.enCours ? "checked" : ""}> Suivi en cours</label>
      <label>À revoir / renouveler le (facultatif)<input type="date" name="suite" value="${esc(b?.suite ?? "")}"></label></div>
      <div class="actions">${b ? `<button type="button" class="danger" id="rm">Supprimer</button>` : ""}<span class="grow"></span><button type="button" class="ghost" data-close>Annuler</button><button class="primary">Enregistrer</button></div></form>`, (m) => {
    $("#fb", m).onsubmit = (e) => { e.preventDefault(); const d = { ...formData(e.target), enCours: e.target.enCours.checked }; if (b) Object.assign(b, d); else f.bilans.push({ id: uid(), ...d }); save("eleves"); closeModal(true); draw(); };
    $("#rm", m)?.addEventListener("click", () => { if (!confirm("Supprimer ce bilan ?")) return; f.bilans = f.bilans.filter((x) => x !== b); save("eleves"); closeModal(true); draw(); });
  });
  app.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.disp) { const d = t.dataset.disp; f.dispositifs = f.dispositifs.includes(d) ? f.dispositifs.filter((x) => x !== d) : [...f.dispositifs, d]; save("eleves"); t.classList.toggle("on"); }
    else if (t.id === "addNote") formNote(null);
    else if (t.dataset.enote) formNote(f.notes.find((x) => x.id === t.dataset.enote));
    else if (t.id === "addBilan") formBilan(null);
    else if (t.dataset.ebilan) formBilan(f.bilans.find((x) => x.id === t.dataset.ebilan));
  };
}

// ---------- MODÈLES DE FICHES ----------
const MODELES_BASE = [
  { nom: "Séance de découverte", type: "Découverte", phases: [["10 min", "Mise en situation", "Collectif"], ["15 min", "Recherche", "Groupes"], ["10 min", "Mise en commun", "Collectif"], ["10 min", "Institutionnalisation (trace écrite)", "Collectif"]] },
  { nom: "Séance d'entraînement", type: "Entraînement", phases: [["5 min", "Rappel", "Collectif"], ["25 min", "Exercices", "Individuel"], ["10 min", "Correction", "Collectif"], ["5 min", "Bilan", "Collectif"]] },
  { nom: "Séance d'évaluation", type: "Évaluation", phases: [["5 min", "Lecture des consignes", "Collectif"], ["35 min", "Évaluation", "Individuel"], ["5 min", "Ramassage", "Collectif"]] },
  { nom: "Séance d'investigation (sciences)", type: "Investigation (sciences)", phases: [["5 min", "Situation de départ, question", "Collectif"], ["10 min", "Hypothèses (je pense que…)", "Groupes"], ["15 min", "Expérimentation / observation", "Groupes"], ["10 min", "Résultats et interprétation", "Collectif"], ["5 min", "Conclusion, trace écrite", "Collectif"]] },
  { nom: "Séance d'expérimentation", type: "Expérimentation", phases: [["5 min", "Rappel de la question et du protocole", "Collectif"], ["20 min", "Expérience, relevé des observations", "Groupes"], ["10 min", "Mise en commun des résultats", "Collectif"], ["10 min", "Conclusion", "Collectif"]] },
  { nom: "Séance de réinvestissement", type: "Réinvestissement", phases: [["5 min", "Rappel de la notion", "Collectif"], ["25 min", "Tâche complexe / problème", "Binômes"], ["10 min", "Mise en commun", "Collectif"]] },
  { nom: "Ateliers tournants", phases: [["5 min", "Présentation des ateliers", "Collectif"], ["15 min", "Atelier 1", "Ateliers"], ["15 min", "Atelier 2", "Ateliers"], ["5 min", "Bilan", "Collectif"]] },
];
function choisirModele() {
  const perso = state.modeles;
  openModal(`<h2>Nouvelle fiche</h2>
    <div class="model-list">
      <button class="model" data-m="vide"><b>📄 Fiche vierge</b></button>
      ${perso.map((m, i) => `<div class="model-row"><button class="model" data-perso="${i}"><b>⭐ ${esc(m.titre)}</b><span class="hint">Mon modèle${m.discipline ? " · " + esc(m.discipline) : ""}</span></button><button class="ghost small" data-rmm="${i}" aria-label="Supprimer le modèle">×</button></div>`).join("")}
      ${MODELES_BASE.map((m, i) => `<button class="model" data-base="${i}"><b>${esc(m.nom)}</b><span class="hint">${m.phases.map((p) => p[1]).join(" → ")}</span></button>`).join("")}
    </div>
    <p class="hint">Astuce : dans une fiche, « Enregistrer comme modèle » l'ajoute ici.</p>
    <div class="actions"><button data-close class="ghost">Annuler</button></div>`, (m) => {
    m.onclick = (e) => {
      const t = e.target.closest("button"); if (!t) return;
      let f;
      if (t.dataset.m) f = newFiche();
      if (t.dataset.base) { const b = MODELES_BASE[+t.dataset.base]; f = newFiche({ titre: b.nom, typeSeance: b.type ?? "", phases: b.phases.map(([duree, phase, modalite]) => ({ duree, phase, deroulement: "", modalite })) }); }
      if (t.dataset.perso) f = newFiche({ ...structuredClone(state.modeles[+t.dataset.perso]), date: "" });
      if (t.dataset.rmm) { state.modeles.splice(+t.dataset.rmm, 1); save("modeles"); return choisirModele(); }
      if (f) { closeModal(true); location.hash = `#/fiches/${f.id}`; }
    };
  });
}
function enregistrerModele(f) {
  const { id, date, ...rest } = structuredClone(f);
  state.modeles.unshift(rest); save("modeles");
}
function dupliquerProgrammation(p) {
  const y = +String(p.annee).slice(0, 4);
  openModal(`<h2>Dupliquer la programmation</h2><form id="f">
    <label>Année scolaire<input name="annee" value="${isNaN(y) ? anneeScolaire() : `${y + 1}-${y + 2}`}" required></label>
    <label>Niveau(x)<input name="niveau" value="${esc(p.niveau)}" required></label>
    <p class="hint">Les séquences, séances et compétences sont copiées. Les liens vers les fiches ne le sont pas.</p>
    <div class="actions"><button type="button" data-close class="ghost">Annuler</button><button class="primary">Dupliquer</button></div></form>`, (m) => {
    $("#f", m).onsubmit = (e) => {
      e.preventDefault(); const d = formData(e.target);
      const c = structuredClone(p); c.id = uid(); c.annee = d.annee; c.niveau = d.niveau;
      c.periodes.forEach((seqs) => seqs.forEach((s) => { s.id = uid(); s.seances.forEach((se) => { se.id = uid(); delete se.ficheId; }); }));
      state.programmations.push(c); save("programmations"); closeModal(true); location.hash = `#/programmations/${c.id}`;
    };
  });
}

// ---------- SAUVEGARDE AUTOMATIQUE ----------
// Chrome / Edge sur ordinateur : écriture automatique dans un fichier choisi (API File System Access).
// Ailleurs : rappel d'export + partage du fichier (téléphone).
const backup = { handle: null, timer: null, etat: "off" };
const canAutoFile = () => "showSaveFilePicker" in window;
function exportJSON() { return JSON.stringify({ app: "bagaschool", version: VERSION, exportedAt: new Date().toISOString(), data: state }, null, 2); }
function marquerSauvegarde() { state.reglages._lastBackup = new Date().toISOString(); db.set("reglages", state.reglages); }
async function initBackup() {
  if (!canAutoFile()) return;
  try { backup.handle = await db.get("_backupHandle"); } catch {}
  if (!backup.handle) return;
  const perm = await backup.handle.queryPermission?.({ mode: "readwrite" });
  backup.etat = perm === "granted" ? "on" : "pause";
}
function planifierBackup() {
  if (backup.etat !== "on" || !backup.handle) return;
  clearTimeout(backup.timer);
  backup.timer = setTimeout(async () => {
    try { const w = await backup.handle.createWritable(); await w.write(exportJSON()); await w.close(); marquerSauvegarde(); }
    catch { backup.etat = "pause"; }
  }, 3000);
}
async function choisirFichierBackup() {
  try {
    const h = await window.showSaveFilePicker({ suggestedName: "bagaschool-sauvegarde.json", types: [{ description: "Sauvegarde BagaSchool", accept: { "application/json": [".json"] } }] });
    backup.handle = h; backup.etat = "on"; await db.set("_backupHandle", h); planifierBackup(); return true;
  } catch { return false; }
}
async function reprendreBackup() {
  if (!backup.handle) return false;
  const p = await backup.handle.requestPermission?.({ mode: "readwrite" });
  backup.etat = p === "granted" ? "on" : "pause"; if (backup.etat === "on") planifierBackup();
  return backup.etat === "on";
}
async function partagerSauvegarde() {
  const file = new File([exportJSON()], `bagaschool-${isoLocal(new Date())}.json`, { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: "Sauvegarde BagaSchool" }); marquerSauvegarde(); return true; } catch { return false; } }
  return false;
}
function rappelSauvegarde() {
  if (backup.etat === "on") return "";
  const last = state.reglages._lastBackup;
  const jours = last ? Math.floor((Date.now() - new Date(last)) / 864e5) : null;
  const hasData = state.fiches.length || state.edt.length || state.evaluations.length;
  if (!hasData || (jours !== null && jours < 7)) return "";
  return `<a class="backup-nag" href="#/reglages">💾 ${backup.etat === "pause" ? "Sauvegarde automatique en pause : touche pour la reprendre." : jours === null ? "Tu n'as encore jamais sauvegardé tes données. Touche ici pour le faire." : `Dernière sauvegarde il y a ${jours} jours. Pense à sauvegarder.`}</a>`;
}

// ---------- RÉFÉRENTIEL PERSONNEL ----------
function compPerso() { return (state.reglages.compPerso ??= []); }
function importerCompetences(apres = null) {
  openModal(`<h2>Ajouter des compétences</h2>
    <p class="hint">Copie un passage du programme officiel (PDF du Bulletin officiel ou Éduscol), colle-le ici : chaque ligne devient une compétence que tu pourras insérer dans tes fiches et évaluations.</p>
    <form id="f">
      <div class="grid4"><label>Niveau<select name="niveau">${opts(NIVEAUX, "", null)}</select></label>
      <label>Discipline<select name="discipline">${opts(DISCIPLINES, "Français", null)}</select></label></div>
      <label>Domaine<input name="domaine" placeholder="ex. Grandeurs et mesures" required></label>
      <label>Sous-domaine (facultatif)<input name="sousDomaine" placeholder="ex. Les longueurs"></label>
      <label>Compétences (une par ligne)<textarea name="lignes" rows="7" required></textarea></label>
      <label>Source (facultatif)<input name="source" placeholder="ex. BO n°41 du 31 octobre 2024"></label>
      <div class="actions"><button type="button" data-close class="ghost">Annuler</button><button class="primary">Ajouter</button></div>
    </form>`, (m) => {
    $("#f", m).onsubmit = (e) => {
      e.preventDefault(); const d = formData(e.target);
      const lignes = d.lignes.split("\n").map((s) => s.replace(/^[\s•\-–·*]+/, "").trim()).filter((s) => s.length > 2);
      compPerso().push(...lignes.map((texte) => ({ id: "perso-" + uid(), cycle: null, niveau: d.niveau, discipline: d.discipline, domaine: d.domaine, sousDomaine: d.sousDomaine || d.domaine, texte, source: "perso", sourceLabel: d.source })));
      save("reglages"); rebuildComp(); closeModal(true); apres ? apres() : route();
    };
  });
}

// ---------- SYNCHRO & TÉLÉCOMMANDE ----------
const ETATS_SYNC = { off: "Synchronisation arrêtée", connexion: "Connexion…", ok: "Synchronisé", "hors-ligne": "Hors ligne : les modifications seront envoyées au retour du réseau" };
function majEtatSync(e) {
  const dot = $("#syncDot");
  if (dot) { dot.hidden = !syncActif(); dot.className = "sync-dot s-" + e; dot.title = ETATS_SYNC[e] ?? ""; }
  const el = $("#syEtat"); if (el) el.textContent = texteEtatSync();
  rafraichirTel();
}
// Une autre machine a modifié des données : on redessine la vue, sauf si on est en train d'écrire.
let rafraichirEnAttente = false;
function rafraichir() {
  const v = document.body.dataset.view;
  if (["outils", "imprimer", "telecommande", "connexion", "inscription", "bienvenue", "admin"].includes(v)) return;
  const f = document.activeElement;
  const ecrit = f && app.contains(f) && (f.matches("input:not([type=checkbox]):not([type=radio]),textarea,select") );
  if (ecrit || !modal.hidden) { rafraichirEnAttente = true; return; }
  route(true);
}
document.addEventListener("focusout", () => setTimeout(() => { if (rafraichirEnAttente && !app.contains(document.activeElement)) { rafraichirEnAttente = false; rafraichir(); } }, 300));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && ecran.actif) quitterProjection(); });

// ---------- COMPTE ----------
const ROLE_TXT = { pc: "ordinateur", tel: "téléphone" };
async function lancerSync() {
  try { await demarrer(await compte.transportSupabase(appareil())); } catch (e) { console.warn("sync", e); }
}
async function remplirCompte(box) {
  if (!box) return;
  if (!compte.configure()) { box.innerHTML = `<p class="hint">Les comptes (synchronisation entre ordinateur et téléphone) ne sont pas encore activés sur cette version. Tout fonctionne sans compte, sur cet appareil.</p>`; return; }
  const u = await compte.utilisateur().catch(() => null);
  if (!box.isConnected) return;
  if (!u) {
    box.innerHTML = `<p>Avec un compte, tu retrouves tes préparations (emploi du temps, fiches, programmations, devoirs, remplacements…) sur ton ordinateur et ton téléphone, et ton téléphone devient la télécommande du tableau.</p>
      <p class="hint">🔒 Les prénoms des élèves, les évaluations et l'appel ne quittent jamais cet appareil.</p>
      <div class="row"><a class="btn primary" href="#/connexion">Se connecter</a><a class="btn ghost" href="#/inscription">J'ai un code d'invitation</a><button class="ghost" id="cScan">📷 Scanner le QR code de mon ordinateur</button></div>`;
    return;
  }
  const admin = await compte.estAdmin();
  if (!box.isConnected) return;
  box.innerHTML = `<p>Connectée avec <b>${esc(u.email)}</b>. <span class="hint" id="syEtat">${texteEtatSync()}</span></p>
    <div class="row"><button class="primary" id="cQR">📱 Connecter un autre appareil (QR code)</button><button class="ghost" id="cScan">📷 Scanner un QR code</button><a class="btn ghost" href="#/telecommande">Télécommande</a></div>
    <div class="row"><button class="ghost" id="cMdp">Changer de mot de passe</button><button class="ghost" id="cOut">Se déconnecter</button>${admin ? `<a class="btn ghost" href="#/admin">🛠️ Administration</a>` : ""}</div>
    <p class="hint">Synchronisé : emploi du temps, programmations, fiches, modèles, cahier journal, devoirs, cahier au tableau, flashcards, remplacements, réglages. Jamais envoyé : élèves, évaluations, appel.</p>
    <details class="hint"><summary>Supprimer mon compte</summary><p>Supprime ton compte et toutes les données copiées sur le serveur. Les données de cet appareil restent ici.</p><button class="danger" id="cDel">Supprimer définitivement mon compte</button></details>`;
}
function texteEtatSync() {
  const e = sync.etat;
  return `${ETATS_SYNC[e] ?? e}${e === "ok" ? ` · ${appareilsConnectes()} appareil${appareilsConnectes() > 1 ? "s" : ""} connecté${appareilsConnectes() > 1 ? "s" : ""} en ce moment` : ""}`;
}
async function actionCompte(t) {
  if (t.id === "cQR") { afficherQR(); return true; }
  if (t.id === "cScan") { scannerQR(); return true; }
  if (t.id === "cMdp") {
    openModal(`<h2>Changer de mot de passe</h2><form id="fm"><label>Nouveau mot de passe (8 caractères minimum)<input name="m" type="password" autocomplete="new-password" minlength="8" required></label><p class="hint" id="fmErr"></p>
      <div class="actions"><button type="button" data-close class="ghost">Annuler</button><button class="primary">Enregistrer</button></div></form>`, (m) => {
      m.querySelector("#fm").onsubmit = async (e) => { e.preventDefault(); try { await compte.changerMotDePasse(e.target.m.value); closeModal(true); alert("Mot de passe changé."); } catch (err) { m.querySelector("#fmErr").textContent = compte.messageErreur(err); } };
    });
    return true;
  }
  if (t.id === "cOut") {
    openModal(`<h2>Se déconnecter</h2><p>Tes préparations restent dans ton compte.</p>
      <div class="actions col"><button class="primary" id="o1">Se déconnecter et garder les données sur cet appareil</button><button class="ghost" id="o2">Se déconnecter et effacer les données de cet appareil</button><button data-close class="ghost">Annuler</button></div>`, (m) => {
      m.querySelector("#o1").onclick = async () => { closeModal(true); await oublier(); await compte.deconnecter(); route(); };
      m.querySelector("#o2").onclick = async () => {
        if (!confirm("Effacer toutes les données de cet appareil, y compris les élèves, les évaluations et l'appel (qui ne sont pas dans ton compte) ?")) return;
        closeModal(true); await oublier(); await compte.deconnecter(); await db.clear(); state = await db.loadAll(); rebuildComp(); route();
      };
    });
    return true;
  }
  if (t.id === "cDel") {
    if (!confirm("Supprimer définitivement ton compte et les données copiées sur le serveur ?")) return true;
    try { await oublier(); await compte.supprimerCompte(); alert("Compte supprimé. Les données de cet appareil sont toujours là."); route(); }
    catch (err) { alert(compte.messageErreur(err)); }
    return true;
  }
  return false;
}
function afficherQR() {
  compte.utilisateur().then((u) => {
    if (!u) return;
    const lien = `${location.origin}${location.pathname}#/connexion/${encodeURIComponent(u.email)}`;
    const qr = qrcode(0, "M"); qr.addData(lien); qr.make();
    openModal(`<h2>Connecter un autre appareil</h2>
      <p>Sur le téléphone, scanne ce code avec l'appareil photo (ou dans BagaSchool : Réglages > « Scanner un QR code »). BagaSchool s'ouvre avec ton adresse déjà remplie : il ne reste qu'à taper ton mot de passe.</p>
      <div class="qr">${qr.createSvgTag({ cellSize: 6, margin: 3, scalable: true })}</div>
      <p class="hint">Le code contient seulement ton adresse e-mail, pas ton mot de passe.</p>
      <div class="actions"><button data-close class="primary">Terminé</button></div>`);
  });
}
async function scannerQR() {
  openModal(`<h2>Scanner le QR code</h2><p class="hint">Vise le QR code affiché sur ton ordinateur (Réglages > Mon compte > Connecter un autre appareil).</p>
    <div class="scan"><video id="scv" playsinline muted></video></div><p class="hint" id="scm"></p>
    <div class="actions"><button data-close class="ghost">Annuler</button></div>`, null, () => { stop(); });
  let stream = null, timer = null;
  const stop = () => { clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
  try {
    if (!window.jsQR) await new Promise((ok, ko) => { const s = document.createElement("script"); s.src = "js/vendor/jsQR.js"; s.onload = ok; s.onerror = ko; document.head.append(s); });
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const v = $("#scv"); if (!v) return stop();
    v.srcObject = stream; await v.play();
    const c = document.createElement("canvas"), g = c.getContext("2d", { willReadFrequently: true });
    timer = setInterval(() => {
      if (!v.videoWidth) return;
      c.width = v.videoWidth; c.height = v.videoHeight; g.drawImage(v, 0, 0);
      const r = window.jsQR(g.getImageData(0, 0, c.width, c.height).data, c.width, c.height, { inversionAttempts: "dontInvert" });
      const m = r?.data.match(/#\/connexion\/([^\s#]+)/);
      if (m) { stop(); closeModal(true); location.hash = `#/connexion/${m[1]}`; }
    }, 250);
  } catch (e) {
    stop(); const m = $("#scm"); if (m) m.textContent = "Impossible d'utiliser l'appareil photo ici. Utilise l'appareil photo du téléphone, ou connecte-toi avec ton e-mail et ton mot de passe.";
  }
}
function pasConfigure() { app.innerHTML = `<div class="sheet"><h2>Comptes</h2><p>Les comptes ne sont pas encore activés sur cette version. BagaSchool fonctionne sans compte, sur cet appareil.</p><a class="btn ghost" href="#/accueil">Retour</a></div>`; }
async function viewConnexion(emailPre) {
  if (!compte.configure()) return pasConfigure();
  const u = await compte.utilisateur().catch(() => null);
  if (u) { location.replace("#/reglages"); return; }
  const email = emailPre ? decodeURIComponent(emailPre) : "";
  app.innerHTML = `<div class="sheet auth">
    <h2>Se connecter</h2>
    <form id="fc">
      <label>Adresse e-mail<input name="email" type="email" autocomplete="username" required value="${esc(email)}"></label>
      <label>Mot de passe<input name="mdp" type="password" autocomplete="current-password" required></label>
      <p class="err" id="err"></p>
      <button class="primary big">Se connecter</button>
    </form>
    <p class="hint">Les préparations déjà présentes sur cet appareil seront ajoutées à ton compte (rien n'est effacé).</p>
    <p>Pas encore de compte ? <a href="#/inscription">J'ai un code d'invitation</a></p>
    <p class="hint">Mot de passe oublié ? Demande un mot de passe provisoire à la personne qui t'a invitée, puis change-le dans Réglages.</p>
  </div>`;
  if (email) app.querySelector("[name=mdp]").focus();
  $("#fc").onsubmit = async (e) => {
    e.preventDefault(); const f = e.target, btn = f.querySelector("button");
    btn.disabled = true; $("#err").textContent = "";
    try { await compte.connecter(f.email.value, f.mdp.value); await lancerSync(); location.replace("#/reglages"); }
    catch (err) { $("#err").textContent = compte.messageErreur(err); btn.disabled = false; }
  };
}
async function viewInscription(codePre) {
  if (!compte.configure()) return pasConfigure();
  const u = await compte.utilisateur().catch(() => null);
  if (u) { location.replace("#/reglages"); return; }
  app.innerHTML = `<div class="sheet auth">
    <h2>Créer mon compte</h2>
    <p>BagaSchool est en test privé : il faut un code d'invitation.</p>
    <form id="fi">
      <label>Code d'invitation<input name="code" required autocomplete="off" autocapitalize="characters" value="${esc(codePre ? decodeURIComponent(codePre) : "")}" placeholder="BAGA-XXXXXXXX"></label>
      <label>Adresse e-mail<input name="email" type="email" autocomplete="username" required></label>
      <label>Mot de passe (8 caractères minimum)<input name="mdp" type="password" autocomplete="new-password" minlength="8" required></label>
      <label class="check"><input type="checkbox" name="ok" required> J'ai compris : mes préparations sont copiées sur un serveur en Europe pour être synchronisées. Les prénoms des élèves, les évaluations et l'appel restent sur mes appareils.</label>
      <p class="err" id="err"></p>
      <button class="primary big">Créer mon compte</button>
    </form>
    <p class="hint">Les préparations déjà présentes sur cet appareil seront ajoutées à ton compte.</p>
    <p>Déjà un compte ? <a href="#/connexion">Se connecter</a></p>
  </div>`;
  $("#fi").onsubmit = async (e) => {
    e.preventDefault(); const f = e.target, btn = f.querySelector("button");
    btn.disabled = true; $("#err").textContent = "";
    try {
      const r = await compte.inscrire(f.email.value, f.mdp.value, f.code.value);
      if (r.aConfirmer) { app.innerHTML = `<div class="sheet auth"><h2>Presque fini</h2><p>Un e-mail de confirmation a été envoyé à <b>${esc(f.email.value)}</b>. Ouvre le lien, puis reviens te connecter.</p><a class="btn primary" href="#/connexion">Se connecter</a></div>`; return; }
      await lancerSync(); location.replace("#/reglages");
    } catch (err) { $("#err").textContent = compte.messageErreur(err); btn.disabled = false; }
  };
}

// ---------- BIENVENUE (lien d'invitation des alpha-testeurs) ----------
// Parcours guidé ouvert par le lien #/bienvenue/<code> : présentation, compte (code déjà rempli),
// réglages de base, installation, petit tour. Chaque étape peut être passée.
async function viewBienvenue(codePre) {
  const code = codePre ? decodeURIComponent(codePre).trim().toUpperCase() : "";
  const p = plateforme();
  const etapes = ["salut", "compte", "classe", ...(estInstallee() ? [] : ["installer"]), "tour"];
  let i = 0, compteFait = !!(compte.configure() && await compte.utilisateur().catch(() => null)), compteExistant = compteFait, codeOk = null;
  if (code && compte.configure() && !compteFait) codeOk = await compte.codeValide(code).catch(() => null);
  const fin = () => { state.reglages._introVue = true; save("reglages"); location.replace("#/accueil"); };
  const points = () => `<div class="bv-pts" aria-hidden="true">${etapes.map((_, k) => `<span class="${k === i ? "on" : k < i ? "fait" : ""}"></span>`).join("")}</div>`;
  const nav = (suivant = "Continuer", passer = true) => `<div class="bv-nav">${i > 0 ? `<button class="ghost" data-bv="prec">Retour</button>` : "<span></span>"}
    <div class="row">${passer ? `<button class="ghost" data-bv="passer">Passer</button>` : ""}<button class="primary big" data-bv="suiv">${suivant}</button></div></div>`;

  const ecrans = {
    salut: () => `<div class="bv-hero">🍎</div><h2>Bienvenue dans BagaSchool !</h2>
      <p class="bv-lead">Tu fais partie des tout premiers profs à tester l'app. Merci 💜</p>
      <ul class="bv-liste">
        <li><span>🗓️</span><div><b>Préparer</b> : emploi du temps, fiches, programmations, cahier journal.</div></li>
        <li><span>🧑‍🏫</span><div><b>En classe</b> : des outils à projeter au tableau (minuteur, tirage au sort, calcul…).</div></li>
        <li><span>🖨️</span><div><b>À imprimer</b> : des fiches d'exercices prêtes en un clic.</div></li>
        <li><span>📱</span><div><b>Ordinateur et téléphone</b> : tes préparations te suivent, et le téléphone sert de télécommande.</div></li>
      </ul>
      <p class="hint">C'est une version de test : il peut rester des bugs. Le bouton <b>💬 Donner mon avis</b> du menu est là pour tout nous dire.</p>
      ${nav("C'est parti", false)}`,
    compte: () => {
      if (!compte.configure()) return `<h2>Ton compte</h2><p>Les comptes ne sont pas disponibles sur cette version. Tout fonctionne sur cet appareil.</p>${nav()}`;
      if (compteFait) return `<div class="bv-hero">✅</div><h2>Ton compte est prêt</h2><p>Tes préparations seront enregistrées dans ton compte et synchronisées sur tes appareils.</p>${nav()}`;
      return `<h2>Crée ton compte</h2>
        <p class="bv-lead">Il te servira à retrouver tes préparations sur ton ordinateur et ton téléphone.</p>
        ${code ? (codeOk === false ? `<p class="err">Ce lien d'invitation n'est plus valable (déjà utilisé ou expiré). Demande un nouveau lien à la personne qui te l'a envoyé.</p>` : `<p class="bv-code">🎟️ Invitation <b>${esc(code)}</b></p>`) : ""}
        <form id="bvF" class="bv-form">
          ${code && codeOk !== false ? `<input type="hidden" name="code" value="${esc(code)}">` : `<label>Code d'invitation<input name="code" required autocomplete="off" autocapitalize="characters" placeholder="BAGA-XXXXXXXX"></label>`}
          <label>Adresse e-mail<input name="email" type="email" autocomplete="username" required></label>
          <label>Choisis un mot de passe (8 caractères minimum)<input name="mdp" type="password" autocomplete="new-password" minlength="8" required></label>
          <label class="check"><input type="checkbox" name="ok" required> J'ai compris : mes préparations sont copiées sur un serveur en Europe. Les prénoms des élèves, les évaluations et l'appel restent sur mes appareils.</label>
          <p class="err" id="bvErr"></p>
          <button class="primary big">Créer mon compte</button>
        </form>
        <p class="hint">Déjà un compte ? <a href="#" data-bv="login">Me connecter</a></p>
        ${nav("Continuer sans compte")}`;
    },
    login: () => `<h2>Me connecter</h2>
      <form id="bvL" class="bv-form">
        <label>Adresse e-mail<input name="email" type="email" autocomplete="username" required></label>
        <label>Mot de passe<input name="mdp" type="password" autocomplete="current-password" required></label>
        <p class="err" id="bvErr"></p>
        <button class="primary big">Se connecter</button>
      </form>
      <p class="hint"><a href="#" data-bv="inscr">Je n'ai pas encore de compte</a></p>`,
    classe: () => {
      const jours = state.reglages.jours ?? ["Lundi", "Mardi", "Jeudi", "Vendredi"];
      return `<h2>Ta semaine</h2>
        <p class="bv-lead">Deux réglages pour que l'app colle à ton école. Tu pourras les changer dans Réglages.</p>
        <h4>Jours de classe</h4>
        <div class="days-pick">${JOURS.map((d) => `<label><input type="checkbox" value="${d}" ${jours.includes(d) ? "checked" : ""}> ${d}</label>`).join("")}</div>
        <h4>Zone de vacances</h4>
        <div class="seg" id="bvZone">${["A", "B", "C"].map((z) => `<button type="button" data-zone="${z}" class="${state.reglages.zone === z ? "on" : ""}">Zone ${z}</button>`).join("")}</div>
        ${!compteExistant && !state.edt.length && !state.fiches.length ? `<label class="check bv-ex"><input type="checkbox" id="bvDemo"> Ajouter des exemples pour découvrir (emploi du temps, fiches, élèves fictifs). Tu pourras tout effacer.</label>` : ""}
        ${nav()}`;
    },
    installer: () => `<h2>Installe l'app</h2>
      <p class="bv-lead">BagaSchool s'ouvre alors comme une vraie app, en plein écran, même sans internet.</p>
      <div class="bv-inst">${contenuInstallation()}</div>
      ${p.os === "ios" && compteFait ? `<p class="hint">Sur iPhone et iPad, l'app installée ne partage pas la connexion de Safari : à la première ouverture, touche <b>Me connecter</b> et tape ton e-mail et ton mot de passe.</p>` : ""}
      <p class="hint">Pense aussi à ton ${p.os === "pc" ? "téléphone" : "ordinateur"} : connecte-toi avec le même e-mail sur <b>${esc(location.host + location.pathname)}</b>.</p>
      ${nav()}`,
    tour: () => `<div class="bv-hero">🎉</div><h2>C'est prêt !</h2>
      <p class="bv-lead">Par où commencer :</p>
      <div class="bv-tour">
        <a href="#/edt" data-bv="go"><span>🗓️</span><b>Remplir mon emploi du temps</b><small>La page Aujourd'hui affiche ensuite ta journée.</small></a>
        <a href="#/outils" data-bv="go"><span>🧑‍🏫</span><b>Essayer un outil au tableau</b><small>Bouton ⛶ pour le plein écran.</small></a>
        <a href="#/imprimer" data-bv="go"><span>🖨️</span><b>Imprimer une fiche</b><small>Calcul, lecture, écriture…</small></a>
        <a href="#/aide" data-bv="go"><span>📽️</span><b>Projeter au tableau</b><small>Brancher le vidéoprojecteur, pas à pas.</small></a>
      </div>
      <p class="hint">Une idée, un bug, un outil qui manque ? Menu ☰ > <b>💬 Donner mon avis</b>.</p>
      <div class="bv-nav"><button class="ghost" data-bv="prec">Retour</button><button class="primary big" data-bv="fin">Commencer</button></div>`,
  };

  let vue = null; // écran affiché hors étapes (connexion)
  const dessiner = () => {
    const nom = vue ?? etapes[i];
    app.innerHTML = `<div class="sheet bv">${points()}${ecrans[nom]()}</div>`;
    window.scrollTo(0, 0);
    app.querySelector("input:not([type=hidden]):not([type=checkbox])")?.focus({ preventScroll: true });
    $("#bvF")?.addEventListener("submit", async (e) => {
      e.preventDefault(); const f = e.target, b = f.querySelector("button"); b.disabled = true; $("#bvErr").textContent = "";
      try {
        const r = await compte.inscrire(f.email.value, f.mdp.value, f.code.value);
        if (r.aConfirmer) { $("#bvErr").textContent = `Ouvre le lien reçu à ${f.email.value}, puis reviens te connecter.`; b.disabled = false; return; }
        compteFait = true; lancerSync(); compte.signalerPresence(VERSION); i++; dessiner();
      } catch (err) { $("#bvErr").textContent = compte.messageErreur(err); b.disabled = false; }
    });
    $("#bvL")?.addEventListener("submit", async (e) => {
      e.preventDefault(); const f = e.target, b = f.querySelector("button"); b.disabled = true; $("#bvErr").textContent = "";
      try { await compte.connecter(f.email.value, f.mdp.value); compteFait = compteExistant = true; lancerSync(); vue = null; i++; dessiner(); }
      catch (err) { $("#bvErr").textContent = compte.messageErreur(err); b.disabled = false; }
    });
  };
  const garderClasse = async () => {
    if (etapes[i] !== "classe") return;
    const j = JOURS.filter((d) => app.querySelector(`.days-pick input[value="${d}"]`)?.checked);
    if (j.length) state.reglages.jours = j;
    const z = app.querySelector("#bvZone .on")?.dataset.zone; if (z) state.reglages.zone = z;
    await save("reglages");
    if (app.querySelector("#bvDemo")?.checked) await loadDemo();
  };
  app.onclick = async (e) => {
    const z = e.target.closest("[data-zone]");
    if (z) { app.querySelectorAll("#bvZone button").forEach((b) => b.classList.toggle("on", b === z)); return; }
    if (e.target.closest("#instGo")) { if (await lancerInstallation()) { i = Math.min(etapes.length - 1, i + 1); dessiner(); } return; }
    const t = e.target.closest("[data-bv]"); if (!t) return;
    const a = t.dataset.bv;
    if (a === "go") { state.reglages._introVue = true; save("reglages"); return; } // le lien suit son cours
    e.preventDefault();
    if (a === "login") { vue = "login"; return dessiner(); }
    if (a === "inscr") { vue = null; return dessiner(); }
    if (a === "prec") { vue = null; i = Math.max(0, i - 1); return dessiner(); }
    if (a === "suiv" || a === "passer") { if (a === "suiv") await garderClasse(); vue = null; i = Math.min(etapes.length - 1, i + 1); return dessiner(); }
    if (a === "fin") fin();
  };
  dessiner();
}

// ---------- ADMINISTRATION (alpha) ----------
async function viewAdmin() {
  if (!compte.configure()) return pasConfigure();
  if (!(await compte.estAdmin())) { app.innerHTML = `<div class="sheet"><h2>Administration</h2><p>Réservé à l'administratrice. <a href="#/reglages">Retour</a></p></div>`; return; }
  app.innerHTML = `<p class="hint">Chargement…</p>`;
  let inv = [], profils = [], avis = [];
  try { [inv, profils, avis] = await Promise.all([compte.admin.invitations(), compte.admin.profils(), compte.admin.avis()]); }
  catch (e) { app.innerHTML = `<div class="sheet"><p class="err">${esc(compte.messageErreur(e))}</p></div>`; return; }
  const base = `${location.origin}${location.pathname}`;
  const lienInv = (c) => `${base}#/bienvenue/${c}`;
  const messageInv = (c) => `Bonjour ! Je te propose de tester BagaSchool, une app pour préparer sa classe et projeter des outils au tableau (ordinateur, tablette, téléphone). C'est une version de test, ton avis compte beaucoup.\n\nOuvre ce lien, tout est guidé : ${lienInv(c)}`;
  const etatInv = (i) => i.revoquee ? "révoqué" : i.expire_le && new Date(i.expire_le) < new Date() ? "expiré" : i.utilisations >= i.max_utilisations ? "utilisé" : "disponible";
  const date = (d) => d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";
  app.innerHTML = `<div class="admin">
    <div class="sheet"><h2>✉️ Invitations</h2>
      <form id="fInv" class="row wrap">
        <label class="inline">Nombre <input name="n" type="number" min="1" max="100" value="5" style="width:70px"></label>
        <label class="inline grow">Note <input name="note" placeholder="ex. collègues de l'école"></label>
        <label class="inline">Utilisations par code <input name="max" type="number" min="1" value="1" style="width:70px"></label>
        <label class="inline">Valable <select name="j"><option value="">sans limite</option><option value="7">7 jours</option><option value="30" selected>30 jours</option><option value="90">90 jours</option></select></label>
        <button class="primary">Créer</button>
      </form>
      <p class="hint">Le lien ouvre un accueil pas à pas avec le code déjà rempli : présentation, création du compte, réglages, installation. « ${navigator.share ? "Partager" : "Copier le message"} » prépare un message prêt à envoyer (SMS, WhatsApp, e-mail). Pour un groupe, un seul code avec plusieurs utilisations suffit (ex. 20).</p>
      <table class="adm-t"><thead><tr><th>Code</th><th>Note</th><th>État</th><th>Créé</th><th></th></tr></thead><tbody>
        ${inv.map((i) => `<tr class="${etatInv(i) === "disponible" ? "" : "off"}"><td><code>${esc(i.code)}</code></td><td>${esc(i.note)}</td><td>${etatInv(i)} (${i.utilisations}/${i.max_utilisations})</td><td>${date(i.cree_le)}</td>
          <td class="nowrap">${etatInv(i) === "disponible" ? `<button class="mini" data-copy="${esc(lienInv(i.code))}">Copier le lien</button> <button class="mini" data-msg="${esc(i.code)}">${navigator.share ? "Partager" : "Copier le message"}</button> <button class="mini" data-revoke="${esc(i.code)}">Révoquer</button>` : ""}</td></tr>`).join("")}
      </tbody></table></div>
    <div class="sheet"><h2>👩‍🏫 Comptes (${profils.length})</h2>
      <table class="adm-t"><thead><tr><th>E-mail</th><th>Inscrit</th><th>Dernière visite</th><th>Version</th><th></th></tr></thead><tbody>
        ${profils.map((p) => `<tr><td>${esc(p.email)}</td><td>${date(p.cree_le)}</td><td>${date(p.vu_le)}</td><td>${esc(p.version_app ?? "")}</td><td><button class="mini" data-mdp="${p.user_id}" data-email="${esc(p.email)}">Mot de passe provisoire</button></td></tr>`).join("")}
      </tbody></table></div>
    <div class="sheet"><h2>💬 Avis (${avis.filter((a) => !a.traite).length} à lire)</h2>
      ${avis.map((a) => `<div class="avis ${a.traite ? "traite" : ""}"><div class="avis-tete"><b>${esc(a.email || "anonyme")}</b> · ${date(a.cree_le)} · ${esc(a.page ?? "")} · v${esc(a.version_app ?? "")}
        <label class="inline"><input type="checkbox" data-avis="${a.id}" ${a.traite ? "checked" : ""}> traité</label></div><p>${esc(a.message).replace(/\n/g, "<br>")}</p></div>`).join("") || `<p class="hint">Aucun avis pour l'instant.</p>`}
    </div></div>`;
  $("#fInv").onsubmit = async (e) => {
    e.preventDefault(); const f = e.target;
    try { await compte.admin.creerInvitations(+f.n.value, f.note.value.trim(), +f.max.value || 1, f.j.value ? +f.j.value : null); viewAdmin(); }
    catch (err) { alert(compte.messageErreur(err)); }
  };
  app.onclick = async (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.copy) { try { await navigator.clipboard.writeText(t.dataset.copy); t.textContent = "Copié ✓"; } catch { prompt("Copie ce lien :", t.dataset.copy); } }
    if (t.dataset.msg) {
      const texte = messageInv(t.dataset.msg);
      if (navigator.share) { navigator.share({ title: "Invitation BagaSchool", text: texte }).catch(() => {}); }
      else { try { await navigator.clipboard.writeText(texte); t.textContent = "Copié ✓"; } catch { prompt("Copie ce message :", texte); } }
    }
    if (t.dataset.revoke && confirm(`Révoquer le code ${t.dataset.revoke} ?`)) { await compte.admin.revoquer(t.dataset.revoke).catch((err) => alert(compte.messageErreur(err))); viewAdmin(); }
    if (t.dataset.mdp && confirm(`Créer un mot de passe provisoire pour ${t.dataset.email} ? L'ancien ne marchera plus.`)) {
      try { const m = await compte.admin.motDePasseProvisoire(t.dataset.mdp); prompt(`Mot de passe provisoire pour ${t.dataset.email} (à lui transmettre ; elle pourra le changer dans Réglages) :`, m); }
      catch (err) { alert(compte.messageErreur(err)); }
    }
  };
  app.onchange = async (e) => { const id = e.target.dataset.avis; if (id) await compte.admin.marquerAvis(+id, e.target.checked).catch((err) => alert(compte.messageErreur(err))); };
}

// ---------- AVIS ----------
function ouvrirAvis() {
  document.body.classList.remove("nav-open");
  if (!compte.configure()) { alert("L'envoi d'avis sera disponible avec les comptes."); return; }
  const page = location.hash || "#/accueil";
  openModal(`<h2>💬 Donner mon avis</h2>
    <form id="fa"><label>Qu'est-ce qui marche bien, qui manque, qui ne marche pas ?<textarea name="m" rows="6" required maxlength="5000" placeholder="Un bug, une idée, un outil qui manque…"></textarea></label>
    <label>Ton e-mail pour qu'on te réponde (facultatif)<input name="email" type="email" id="faMail"></label>
    <p class="hint">Merci de ne pas écrire de nom d'élève. On joint automatiquement la page où tu étais (${esc(page)}), la version de l'app et le type d'appareil.</p>
    <p class="err" id="faErr"></p>
    <div class="actions"><button type="button" data-close class="ghost">Annuler</button><button class="primary">Envoyer</button></div></form>`, async (m) => {
    compte.utilisateur().then((u) => { if (u && m.querySelector("#faMail")) m.querySelector("#faMail").value = u.email; }).catch(() => {});
    m.querySelector("#fa").onsubmit = async (e) => {
      e.preventDefault(); const f = e.target, b = f.querySelector(".primary"); b.disabled = true;
      try { await compte.envoyerAvis({ message: f.m.value.trim(), email: f.email.value.trim(), page, version: VERSION }); m.innerHTML = `<h2>Merci ! 💜</h2><p>Ton avis est bien arrivé.</p><div class="actions"><button data-close class="primary">Fermer</button></div>`; }
      catch (err) { m.querySelector("#faErr").textContent = compte.messageErreur(err); b.disabled = false; }
    };
  });
}

// ---------- MISES À JOUR ----------
function afficherMiseAJour() {
  if (document.getElementById("majBan")) return;
  const d = document.createElement("div");
  d.id = "majBan"; d.className = "maj-ban no-print";
  d.innerHTML = `<span>✨ Une nouvelle version de BagaSchool est prête.</span><button class="primary" id="majGo">Recharger</button><button class="ghost" id="majX" aria-label="Plus tard">Plus tard</button>`;
  document.body.append(d);
  d.querySelector("#majGo").onclick = () => location.reload();
  d.querySelector("#majX").onclick = () => d.remove();
}

// ---------- DEVOIRS ----------
function prochainJourClasse(date) {
  const jours = state.reglages.jours ?? ["Lundi", "Mardi", "Jeudi", "Vendredi"];
  for (let i = 1; i <= 21; i++) { const d = addDays(date, i); if (jours.includes(JOURS_JS[new Date(d + "T12:00").getDay()]) && !statutJour(d)) return d; }
  return addDays(date, 1);
}
function devoirsEditeur(date) {
  const L = state.devoirs[date] ?? [];
  return `<ul class="dv-list">${L.map((d) => `<li><span class="dv-disc">${esc(d.discipline || "")}</span><input data-dv="${date}" data-dvid="${d.id}" value="${esc(d.texte)}" aria-label="Devoir"><button type="button" class="ghost small no-print" data-dvrm="${date}" data-dvid="${d.id}" aria-label="Supprimer">×</button></li>`).join("")}</ul>
    <div class="row no-print dv-add"><select data-dvdisc="${date}"><option value="">Matière</option>${opts(DISCIPLINES, "", null)}</select><input data-dvnew="${date}" placeholder="ex. Apprendre la table de 7, lire p. 12"><button type="button" class="ghost small" data-dvadd="${date}">Ajouter</button></div>`;
}
function brancherDevoirs(root, redraw) {
  root._dvRedraw = redraw;
  if (root._dvInstalled) return;
  root._dvInstalled = true;
  redraw = () => root._dvRedraw?.();
  root.addEventListener("input", (e) => {
    const t = e.target; if (t.dataset.dv === undefined) return;
    const d = (state.devoirs[t.dataset.dv] ?? []).find((x) => x.id === t.dataset.dvid); if (d) { d.texte = t.value; save("devoirs"); }
  });
  const ajouter = (date) => {
    const inp = root.querySelector(`[data-dvnew="${date}"]`), sel = root.querySelector(`[data-dvdisc="${date}"]`);
    if (!inp.value.trim()) return inp.focus();
    (state.devoirs[date] ??= []).push({ id: uid(), discipline: sel.value, texte: inp.value.trim() }); save("devoirs"); redraw();
  };
  root.addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.dvadd) ajouter(t.dataset.dvadd);
    if (t.dataset.dvrm) { state.devoirs[t.dataset.dvrm] = (state.devoirs[t.dataset.dvrm] ?? []).filter((x) => x.id !== t.dataset.dvid); if (!state.devoirs[t.dataset.dvrm].length) delete state.devoirs[t.dataset.dvrm]; save("devoirs"); redraw(); }
  });
  root.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.dataset.dvnew) { e.preventDefault(); ajouter(e.target.dataset.dvnew); } });
}
function viewDevoirs(dateISO) {
  const today = isoLocal(new Date());
  const ref = dateISO || today;
  const d = new Date(ref + "T12:00"), lundi = addDays(ref, -((d.getDay() + 6) % 7));
  const jours = state.reglages.jours ?? ["Lundi", "Mardi", "Jeudi", "Vendredi"];
  const dates = [0, 1, 2, 3, 4, 5].map((i) => addDays(lundi, i)).filter((x) => jours.includes(JOURS_JS[new Date(x + "T12:00").getDay()]));
  const draw = () => {
    app.innerHTML = `
      <div class="toolbar no-print">
        <a class="round-btn ghost" href="#/devoirs/${addDays(lundi, -7)}" aria-label="Semaine précédente">‹</a>
        <b>Semaine du ${fmtCourt(lundi)}</b>
        <a class="round-btn ghost" href="#/devoirs/${addDays(lundi, 7)}" aria-label="Semaine suivante">›</a>
        <span class="grow"></span><button class="ghost" onclick="print()">🖨️ Imprimer</button>
        <button class="primary" id="proj">📺 Afficher au tableau</button>
      </div>
      <p class="hint no-print">Les devoirs sont rangés par jour où ils sont à faire. Tu peux aussi les saisir depuis le cahier journal.</p>
      <div class="dv-week">${dates.map((x) => `<section class="sheet dv-day ${x === today ? "now" : ""}"><h3>Pour le ${capit(fmtLong(x))}</h3>${statutJour(x) ? `<p class="hint">${esc(statutJour(x).nom)}</p>` : devoirsEditeur(x)}</section>`).join("")}</div>`;
    $("#proj").onclick = () => projeterDevoirs(prochainJourClasse(addDays(today, 0) < lundi ? addDays(lundi, -1) : today));
  };
  brancherDevoirs(app, draw);
  draw();
}
function projeterDevoirs(date) {
  const L = state.devoirs[date] ?? [];
  const ov = document.createElement("div");
  ov.className = "projo";
  ov.innerHTML = `<div class="projo-in"><h1>📚 Devoirs pour ${fmtLong(date)}</h1>${L.length ? `<ul>${L.map((d) => `<li>${d.discipline ? `<b>${esc(d.discipline)}</b> : ` : ""}${esc(d.texte)}</li>`).join("")}</ul>` : `<p>Pas de devoirs ! 🎉</p>`}<button class="round-btn" aria-label="Fermer">✕</button></div>`;
  document.body.append(ov);
  ov.querySelector("button").onclick = () => { ov.remove(); document.exitFullscreen?.().catch(() => {}); };
  ov.requestFullscreen?.().catch(() => {});
}

// ---------- SUIVI DE CLASSE (compétences par matière, à partir des évaluations) ----------
// Pour chaque élève et chaque compétence : le dernier résultat saisi dans une évaluation.
function resultatsParCompetence(discipline) {
  const evs = state.evaluations.filter((ev) => (!discipline || ev.discipline === discipline) && ev.items.length).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const comps = new Map(); // clé -> { texte, discipline, res: { eleveId: { code, ev } } }
  for (const ev of evs) ev.items.forEach((it, k) => {
    const key = it.compId || "t:" + (it.texte || "").trim().toLowerCase();
    if (!comps.has(key)) comps.set(key, { key, texte: itemText(it), discipline: ev.discipline || "Autre", domaine: domaineItem(it), res: {} });
    for (const el of state.eleves) { const v = ev.resultats[el.id]?.[k]; if (v) comps.get(key).res[el.id] = { code: v, ev }; }
  });
  return [...comps.values()];
}
// Carte de la classe : une ligne par élève, une colonne par domaine, % d'atteint ou dépassé.
function carteDomaines(disc) {
  const doms = statsDomaines()[disc] ?? {};
  const cols = Object.keys(doms).sort((a, b) => a.localeCompare(b, "fr"));
  const cell = (c, lien) => { if (!c || !nb4(c)) return `<td class="hm-v"></td>`; const p = pctAcquis(c);
    return `<td class="hm-v" style="background:${teinte(p)}" title="${CODES.slice(1).map((x) => `${x.code} ${c[x.code]}`).join(" · ")}">${lien ? `<a href="${lien}">` : ""}<b>${p} %</b><small>${c.A + c.D}/${nb4(c)}</small>${lien ? "</a>" : ""}</td>`; };
  const rows = state.eleves.map((el) => { const cs = cols.map((k) => doms[k][el.id]); const tot = somme4(cs.filter(Boolean));
    return { el, cs, tot }; }).filter((r) => nb4(r.tot));
  if (!rows.length) return "";
  const clCols = cols.map((k) => somme4(Object.values(doms[k])));
  return `<h3 class="suivi-h">Où en est chaque élève ? <span class="hint">${esc(disc)}, par domaine</span></h3>
    <div class="suivi-wrap"><table class="heatmap"><thead><tr><th>Élève</th>${cols.map((k) => `<th>${esc(k)}</th>`).join("")}${cols.length > 1 ? "<th>Ensemble</th>" : ""}</tr></thead>
    <tbody>${rows.map(({ el, cs, tot }) => `<tr><th><a href="#/classe/${el.id}">${esc(el.prenom)}</a></th>${cs.map((c) => cell(c, `#/classe/${el.id}`)).join("")}${cols.length > 1 ? cell(tot) : ""}</tr>`).join("")}</tbody>
    <tfoot><tr><th>Classe</th>${clCols.map((c) => cell(c)).join("")}${cols.length > 1 ? cell(somme4(clCols)) : ""}</tr></tfoot></table></div>
    <p class="hint">Pourcentage de compétences atteintes ou dépassées (dernier résultat), du rouge au vert. Touche un prénom pour voir ses graphiques.</p>`;
}
function viewSuivi(disc) {
  const discs = [...new Set(state.evaluations.filter((e) => e.items.length).map((e) => e.discipline || "Autre"))];
  const d = disc ? decodeURIComponent(disc) : discs[0] ?? "";
  const comps = d ? resultatsParCompetence(d) : [];
  app.innerHTML = `
    <p class="intro no-print">Le dernier résultat de chaque élève pour chaque compétence évaluée. Pour ajouter des résultats, crée une évaluation (elle peut porter sur n'importe quelle matière) et remplis sa grille.</p>
    <div class="toolbar no-print"><div class="seg wrap">${discs.map((x) => `<a class="${x === d ? "on" : ""} seg-link" href="#/suivi/${encodeURIComponent(x)}">${esc(x)}</a>`).join("") || `<span class="hint">Pas encore d'évaluation avec des résultats.</span>`}</div><span class="grow"></span><a class="primary btn" href="#/evaluations/new">+ Évaluation</a><button class="ghost" onclick="print()">🖨️ Imprimer</button></div>
    ${comps.length && state.eleves.length ? carteDomaines(d) : ""}
    ${comps.length && state.eleves.length ? `<h3 class="suivi-h">Détail par compétence</h3><div class="suivi-wrap"><table class="suivi"><thead><tr><th>Élève</th>${comps.map((c, i) => `<th title="${esc(c.texte)}"><span>${i + 1}</span></th>`).join("")}<th>Acquis</th></tr></thead>
      <tbody>${state.eleves.map((el) => { const vals = comps.map((c) => c.res[el.id]); const ok = vals.filter((v) => v && (v.code === "A" || v.code === "D")).length, n = vals.filter(Boolean).length;
        return `<tr><th><a href="#/classe/${el.id}">${esc(el.prenom)}</a></th>${vals.map((v) => `<td>${v ? `<a class="res r-${v.code}" href="#/evaluations/${v.ev.id}" title="${esc(v.ev.titre)}">${v.code}</a>` : ""}</td>`).join("")}<td class="suivi-tot">${n ? `${ok}/${n}` : ""}</td></tr>`; }).join("")}</tbody></table></div>
      <ol class="suivi-legend">${comps.map((c) => `<li>${esc(c.texte)}</li>`).join("")}</ol>
      <p class="hint">${CODES.slice(1).map((c) => `<span class="legend-dot r-${c.code}"></span> ${c.code} : ${c.label}`).join(" &nbsp; ")}. « Acquis » = atteint ou dépassé.</p>` : d ? `<p class="hint">Aucun résultat saisi en ${esc(d)}.</p>` : ""}`;
}

// ---------- AIDE : INSTALLER ET PROJETER ----------
function viewAide() {
  if (!state.reglages._aideVue) { state.reglages._aideVue = true; save("reglages"); }
  const standalone = estInstallee();
  app.innerHTML = `<div class="sheet aide">
    <h2>📲 Installer BagaSchool</h2>
    ${standalone ? `<p class="ok-box">✅ BagaSchool est installée sur cet appareil.</p>` : `<div class="ok-box aide-ici"><h3>Sur cet appareil</h3>${contenuInstallation()}</div>`}
    <div class="aide-grid">
      <div><h3>💻 Ordinateur (Chrome ou Edge)</h3><ol><li>Ouvre <b>${esc(location.origin + location.pathname)}</b></li><li>Clique sur l'icône <b>Installer</b> à droite de la barre d'adresse (un écran avec une flèche), ou menu <b>⋮</b> > <b>Installer BagaSchool</b>.</li><li>BagaSchool s'ouvre dans sa propre fenêtre et a son icône sur le bureau.</li></ol></div>
      <div><h3>📱 iPhone / iPad</h3><ol><li>Ouvre le lien dans <b>Safari</b>.</li><li>Touche <b>Partager</b> (carré avec une flèche vers le haut).</li><li>Touche <b>Sur l'écran d'accueil</b>, puis <b>Ajouter</b>.</li></ol></div>
      <div><h3>🤖 Android</h3><ol><li>Ouvre le lien dans <b>Chrome</b>.</li><li>Menu <b>⋮</b> > <b>Installer l'application</b> (ou <b>Ajouter à l'écran d'accueil</b>).</li></ol></div>
    </div>
    <h2>📺 Projeter au tableau</h2>
    <p>C'est <b>l'ordinateur branché au vidéoprojecteur (ou au TBI)</b> qui affiche BagaSchool. Le téléphone ne projette pas lui-même : il peut seulement servir de télécommande.</p>
    <ol class="aide-steps">
      <li><b>Branche</b> le câble du vidéoprojecteur (HDMI) sur l'ordinateur et allume le vidéoprojecteur.</li>
      <li><b>Affiche le même écran au tableau</b> : sous Windows, appuie sur les touches <kbd>⊞ Windows</kbd> + <kbd>P</kbd> et choisis <b>Dupliquer</b>. Sur Mac : menu  > Réglages Système > Écrans > <b>Recopie vidéo</b>.</li>
      <li>Ouvre BagaSchool, va dans <b>En classe</b> et choisis un outil.</li>
      <li>Clique sur <b>⛶</b> en haut à droite de l'outil pour le mettre en <b>plein écran</b> (touche <kbd>Échap</kbd> pour sortir).</li>
      <li>Avec un TBI, tu peux toucher directement le tableau : les boutons sont assez gros pour ça.</li>
    </ol>
    <h3>📱 Utiliser le téléphone comme télécommande (facultatif)</h3>
    <ol class="aide-steps"><li>Connecte-toi à ton compte sur l'ordinateur, puis Réglages > Mon compte > <b>Connecter un autre appareil</b> : un QR code s'affiche.</li><li>Scanne-le avec le téléphone et tape ton mot de passe.</li><li>En classe, sur le téléphone : <b>Télécommande</b>. Choisis un outil : il s'ouvre au tableau en plein écran, et tous ses boutons sont sur ton téléphone.</li></ol>
  </div>`;
  $("#instGo")?.addEventListener("click", async () => { await lancerInstallation(); viewAide(); });
}

// ---------- CALENDRIER DE REMPLACEMENT ----------
// state.remplacements = { rattachement, rattAdr: { label, lon, lat }, ecoles: [{ id, nom, commune, km, couleur, adr }], jours: { "AAAA-MM-JJ": { e, d: "j"|"m"|"a", classe, note } } }
// km = distance depuis l'école de rattachement (aller simple) : saisie à la main ou calculée (trajet le plus court, IGN).
// L'ISSR est estimée avec les barèmes officiels de js/data/issr.js, à titre indicatif.
const COUL_ECOLES = ["#ffd0dc", "#cfe6ff", "#c9ecd4", "#ffe3a3", "#d7ccff", "#ffd7bf", "#bfeff0", "#f3c6f0"];
const DUREES_R = { j: ["Journée", 1], m: ["Matin", 0.5], a: ["Après-midi", 0.5] };
let moisRempl = null;
function remplData() {
  const r = state.remplacements;
  r.ecoles ??= []; r.jours ??= {}; r.rattachement ??= "";
  return r;
}
function recapRempl(prefixe) {
  const r = remplData(), parEcole = {};
  let jours = 0, km = 0, issr = 0;
  for (const [d, j] of Object.entries(r.jours)) {
    if (!d.startsWith(prefixe) || !j.e) continue;
    const e = r.ecoles.find((x) => x.id === j.e); const n = DUREES_R[j.d]?.[1] ?? 1;
    parEcole[j.e] ??= { nom: e?.nom ?? "École supprimée", km: +e?.km || 0, jours: 0, presences: 0, issr: 0, issrInconnu: false };
    const x = parEcole[j.e], m = issrJour(+e?.km || 0, d);
    x.jours += n; x.presences++; jours += n; km += (+e?.km || 0);
    if (m != null) { x.issr += m; issr += m; } else if (!(+e?.km > 0)) x.issrInconnu = true;
  }
  return { parEcole: Object.values(parEcole).sort((a, b) => b.jours - a.jours), jours, km, issr };
}
const nb1 = (x) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
function viewRemplacements(partiel = false) {
  const r = remplData();
  const today = isoLocal(new Date());
  moisRempl ??= today.slice(0, 7);
  const [Y, M] = moisRempl.split("-").map(Number);
  const premier = new Date(Y, M - 1, 1), nbJours = new Date(Y, M, 0).getDate();
  const decal = (premier.getDay() + 6) % 7;
  const cases = [];
  for (let k = 0; k < decal; k++) cases.push(`<div class="rp-vide"></div>`);
  for (let d = 1; d <= nbJours; d++) {
    const iso = `${moisRempl}-${String(d).padStart(2, "0")}`, st = statutJour(iso), j = r.jours[iso];
    const e = j?.e && r.ecoles.find((x) => x.id === j.e);
    cases.push(`<button class="rp-jour ${st ? "rp-" + st.type : ""} ${iso === today ? "rp-auj" : ""} ${e ? "rp-pris" : ""}" data-jour="${iso}" ${e ? `style="--ec:${e.couleur}"` : ""} title="${esc(st?.nom ?? "")}">
      <span class="rp-n">${d}</span>${e ? `<span class="rp-e">${esc(e.nom)}</span>${j.d !== "j" ? `<span class="rp-d">${DUREES_R[j.d][0]}</span>` : ""}` : st && st.type !== "weekend" ? `<span class="rp-st">${esc(st.nom.replace("Vacances", "Vac."))}</span>` : ""}</button>`);
  }
  const rec = recapRempl(moisRempl), an = anneeScolaire(), y1 = +an.slice(0, 4);
  const recAn = (() => { const out = { jours: 0, km: 0, issr: 0 }; for (const [d, j] of Object.entries(r.jours)) { if (!j.e || d < `${y1}-09-01` || d > `${y1 + 1}-08-31`) continue; const e = r.ecoles.find((x) => x.id === j.e); out.jours += DUREES_R[j.d]?.[1] ?? 1; out.km += +e?.km || 0; out.issr += issrJour(+e?.km || 0, d) ?? 0; } return out; })();
  const eur = (x) => x.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const nomMois = capit(premier.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }));
  const html = `
    <div class="rp">
      <div class="sheet rp-ecoles">
        <h2>🏫 Mes écoles</h2>
        <label>École de rattachement <input id="rpRatt" value="${esc(r.rattachement)}" placeholder="Nom de l'école"></label>
        <div class="adr-box"><input data-adr="ratt" value="${esc(r.rattAdr?.label ?? "")}" placeholder="Adresse de l'école de rattachement (pour calculer les distances)" autocomplete="off"><div class="adr-sugg" hidden></div></div>
        <p class="hint">Écoles où tu remplaces. La distance (aller simple) se calcule depuis ton école de rattachement : choisis l'adresse dans la liste proposée puis touche 📍. Tu peux aussi la taper à la main.</p>
        <div class="rp-liste">${r.ecoles.map((e) => `
          <div class="rp-ecole" data-ecole="${e.id}">
            <button class="rp-coul" data-coul="${e.id}" style="background:${e.couleur}" aria-label="Changer la couleur"></button>
            <input data-f="nom" value="${esc(e.nom)}" placeholder="Nom de l'école">
            <input data-f="commune" value="${esc(e.commune ?? "")}" placeholder="Commune">
            <label class="inline rp-km"><input data-f="km" type="number" min="0" step="0.1" value="${esc(e.km ?? "")}"> km</label>
            <button class="round-btn sm" data-supprecole="${e.id}" aria-label="Supprimer l'école">✕</button>
            <div class="adr-box rp-adr"><input data-adr="${e.id}" value="${esc(e.adr?.label ?? "")}" placeholder="Adresse de l'école" autocomplete="off"><div class="adr-sugg" hidden></div></div>
            <button class="pill rp-calc" data-calc="${e.id}" title="Calculer la distance depuis l'école de rattachement">📍 Calculer</button>
            ${+e.km > 0 ? `<span class="hint rp-tr">ISSR : tranche ${nomTrancheISSR(trancheISSR(e.km))}</span>` : ""}
          </div>`).join("") || `<p class="muted">Aucune école pour l'instant.</p>`}</div>
        <p class="hint" id="rpCalcMsg"></p>
        <button class="pill" id="rpAdd">+ Ajouter une école</button>
      </div>
      <div class="sheet rp-cal">
        <div class="rp-nav"><button class="round-btn" id="rpPrev" aria-label="Mois précédent">‹</button><h2>${nomMois}</h2><button class="round-btn" id="rpNext" aria-label="Mois suivant">›</button>${moisRempl !== today.slice(0, 7) ? `<button class="pill" id="rpAuj">Aujourd'hui</button>` : ""}</div>
        <div class="rp-grille">${["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => `<div class="rp-tete">${d}</div>`).join("")}${cases.join("")}</div>
        <p class="hint">Touche un jour pour noter où tu remplaces. Pour une période (plusieurs jours ou semaines), touche le premier jour et choisis la date de fin.</p>
      </div>
      <div class="sheet rp-recap">
        <h2>📊 ${nomMois}</h2>
        ${rec.parEcole.length ? `<table class="rp-table"><thead><tr><th>École</th><th>Jours</th><th>km (aller)</th><th>ISSR estimée</th></tr></thead><tbody>
          ${rec.parEcole.map((x) => `<tr><td>${esc(x.nom)}</td><td>${nb1(x.jours)}</td><td>${x.km ? `${nb1(x.km)} × ${x.presences} = ${nb1(x.km * x.presences)}` : "—"}</td><td>${x.issr ? eur(x.issr) : x.issrInconnu ? "distance ?" : "—"}</td></tr>`).join("")}
          </tbody><tfoot><tr><th>Total</th><th>${nb1(rec.jours)}</th><th>${nb1(rec.km)} km (aller-retour : ${nb1(2 * rec.km)} km)</th><th>${eur(rec.issr)}</th></tr></tfoot></table>` : `<p class="muted">Aucun remplacement noté ce mois-ci.</p>`}
        <p><b>Année ${an} :</b> ${nb1(recAn.jours)} jour${recAn.jours > 1 ? "s" : ""} de remplacement, ${nb1(recAn.km)} km aller (${nb1(2 * recAn.km)} km aller-retour), ISSR estimée ${eur(recAn.issr)}.</p>
        <details class="hint rp-issr"><summary>Comment l'ISSR est estimée (indicatif)</summary>
          <p>Montant journalier selon la distance entre l'école de rattachement et l'école du remplacement (décret n° 89-825 du 9 novembre 1989, art. 3). Une journée notée compte pour une indemnité, y compris une demi-journée : vérifie la règle appliquée par ta circonscription. Rien n'est compté pour une école à 0 km (ton école de rattachement). L'ISSR concerne les remplacements de courte ou moyenne durée : pour un remplacement à l'année, ce sont d'autres règles.</p>
          <p>Barèmes utilisés : ${ISSR_BAREMES.map((b) => `${esc(b.src)} : ${b.t.map((v) => v.toLocaleString("fr-FR")).join(" / ")} € par jour (moins de 10 km, 10-19, 20-29, 30-39, 40-49, 50-59, 60-80 km), puis ${b.sup.toLocaleString("fr-FR")} € par tranche de 20 km.`).join(" ")}</p>
          <p>Ce n'est pas un calcul officiel : le montant versé est celui de ton administration.</p></details>
        <button class="pill" id="rpCsv">⬇️ Télécharger le mois (tableur)</button>
      </div>
    </div>`;
  if (partiel && app.querySelector(".rp-ecoles")) {
    // Ne redessine que le calendrier et le récap : la liste des écoles (en cours de saisie) reste intacte.
    const tmp = document.createElement("div"); tmp.innerHTML = html;
    for (const sel of [".rp-cal", ".rp-recap"]) app.querySelector(sel).replaceWith(tmp.querySelector(sel));
    return;
  }
  app.innerHTML = html;
  const majEcole = (id, f, v) => { const e = r.ecoles.find((x) => x.id === id); if (!e) return; e[f] = f === "km" ? (v === "" ? "" : +v) : v; save("remplacements"); };
  const suggerer = (inp) => {
    clearTimeout(suggerer.t);
    const box = inp.parentElement.querySelector(".adr-sugg");
    suggerer.t = setTimeout(async () => {
      let l = [];
      try { l = await chercherAdresse(inp.value); } catch { box.hidden = false; box.innerHTML = `<p class="hint">Recherche d'adresse impossible (pas de connexion ?). Tu peux taper la distance à la main.</p>`; return; }
      box.hidden = !l.length;
      box.innerHTML = l.map((a, k) => `<button type="button" data-pick="${k}">${esc(a.label)}</button>`).join("");
      box._l = l;
    }, 350);
  };
  const cibleAdr = (k) => k === "ratt" ? null : r.ecoles.find((x) => x.id === k);
  app.oninput = (e) => {
    if (e.target.id === "rpRatt") { r.rattachement = e.target.value; save("remplacements"); return; }
    if (e.target.dataset.adr) { // l'adresse tapée n'a plus de coordonnées tant qu'on n'a pas choisi une suggestion
      const k = e.target.dataset.adr, v = { label: e.target.value };
      if (k === "ratt") r.rattAdr = v; else { const ec = cibleAdr(k); if (ec) ec.adr = v; }
      save("remplacements"); suggerer(e.target); return;
    }
    const row = e.target.closest("[data-ecole]"); if (row && e.target.dataset.f) { majEcole(row.dataset.ecole, e.target.dataset.f, e.target.value); clearTimeout(viewRemplacements._t); viewRemplacements._t = setTimeout(() => location.hash === "#/remplacements" && viewRemplacements(true), 300); }
  };

  app.onclick = async (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.pick != null) {
      const box = t.closest(".adr-sugg"), inp = box.parentElement.querySelector("[data-adr]"), a = box._l?.[+t.dataset.pick]; if (!a) return;
      const k = inp.dataset.adr; inp.value = a.label; box.hidden = true;
      if (k === "ratt") r.rattAdr = a; else { const ec = cibleAdr(k); if (ec) { ec.adr = a; if (!ec.commune) ec.commune = a.label.replace(/^.*\d{5}\s*/, ""); } }
      save("remplacements"); return;
    }
    if (t.dataset.calc) {
      const ec = cibleAdr(t.dataset.calc), msg = $("#rpCalcMsg");
      if (!r.rattAdr?.lon) { msg.textContent = "Choisis d'abord l'adresse de ton école de rattachement dans la liste proposée."; return; }
      if (!ec?.adr?.lon) { msg.textContent = "Choisis l'adresse de cette école dans la liste proposée (tape le début de l'adresse)."; return; }
      t.disabled = true; t.textContent = "⏳ Calcul…";
      try { ec.km = await distanceRoute(r.rattAdr, ec.adr); ec.kmAuto = true; save("remplacements"); viewRemplacements(); $("#rpCalcMsg").textContent = `${ec.nom || "École"} : ${nb1(ec.km)} km par le trajet le plus court en voiture (calcul IGN). Tu peux corriger le chiffre si ton administration retient une autre distance.`; }
      catch { t.disabled = false; t.textContent = "📍 Calculer"; msg.innerHTML = `Calcul impossible pour l'instant (pas de connexion ou service indisponible). Tape la distance à la main, par exemple relevée sur <a href="${lienGeoportail}" target="_blank" rel="noopener">Géoportail</a>.`; }
      return;
    }
    if (t.id === "rpAdd") { r.ecoles.push({ id: uid(), nom: "", commune: "", km: "", couleur: COUL_ECOLES[r.ecoles.length % COUL_ECOLES.length] }); save("remplacements"); viewRemplacements(); app.querySelector(".rp-ecole:last-child input")?.focus(); return; }
    if (t.dataset.supprecole) { const e2 = r.ecoles.find((x) => x.id === t.dataset.supprecole); if (confirm(`Supprimer l'école « ${e2?.nom || "sans nom"} » ? Les jours déjà notés resteront comptés sous « École supprimée ».`)) { r.ecoles = r.ecoles.filter((x) => x.id !== t.dataset.supprecole); save("remplacements"); viewRemplacements(); } return; }
    if (t.dataset.coul) { const e2 = r.ecoles.find((x) => x.id === t.dataset.coul); e2.couleur = COUL_ECOLES[(COUL_ECOLES.indexOf(e2.couleur) + 1) % COUL_ECOLES.length]; save("remplacements"); viewRemplacements(); return; }
    if (t.id === "rpPrev" || t.id === "rpNext") { const d = new Date(Y, M - 1 + (t.id === "rpNext" ? 1 : -1), 1); moisRempl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; viewRemplacements(); return; }
    if (t.id === "rpAuj") { moisRempl = today.slice(0, 7); viewRemplacements(); return; }
    if (t.id === "rpCsv") {
      const lignes = [["Date", "École", "Commune", "Durée", "Classe", "km (aller)", "ISSR estimée (€)", "Note"]];
      Object.entries(r.jours).filter(([d, j]) => d.startsWith(moisRempl) && j.e).sort().forEach(([d, j]) => { const e2 = r.ecoles.find((x) => x.id === j.e); const m = issrJour(+e2?.km || 0, d); lignes.push([d, e2?.nom ?? "", e2?.commune ?? "", DUREES_R[j.d]?.[0] ?? "", j.classe ?? "", e2?.km ?? "", m != null ? m.toLocaleString("fr-FR") : "", j.note ?? ""]); });
      const csv = "﻿" + lignes.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `remplacements-${moisRempl}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return;
    }
    if (t.dataset.jour) jourRempl(t.dataset.jour);
  };
}
function jourRempl(iso) {
  const r = remplData(), j = { e: "", d: "j", classe: "", note: "", ...(r.jours[iso] ?? {}) }, st = statutJour(iso);
  const corps = () => `
    <h2>${capit(fmtLong(iso))}</h2>
    ${st ? `<p class="hint">${esc(st.nom)}</p>` : ""}
    ${r.ecoles.length ? `<p>Où remplaces-tu ?</p><div class="rp-choix">${r.ecoles.map((e) => `<button class="rp-btn ${j.e === e.id ? "on" : ""}" data-e="${e.id}" style="--ec:${e.couleur}">${esc(e.nom || "Sans nom")}${e.commune ? `<small>${esc(e.commune)}</small>` : ""}</button>`).join("")}<button class="rp-btn ${!j.e ? "on" : ""}" data-e="">Pas de remplacement</button></div>`
      : `<p>Ajoute d'abord tes écoles dans « Mes écoles ».</p>`}
    <div class="seg">${Object.entries(DUREES_R).map(([k, [v]]) => `<button data-d="${k}" class="${j.d === k ? "on" : ""}">${v}</button>`).join("")}</div>
    <label>Jusqu'au (pour une période) <input type="date" name="fin" value="${iso}" min="${iso}"></label>
    <p class="hint" id="rpPer"></p>
    <label>Classe, niveau, enseignant remplacé <input name="classe" value="${esc(j.classe)}" placeholder="Ex. CE1 de Mme Martin"></label>
    <label>Note <input name="note" value="${esc(j.note)}"></label>
    <div class="actions"><button data-close class="ghost">Annuler</button><button class="primary" id="rpOk">Enregistrer</button></div>`;
  // Jours de classe d'une période : jours cochés dans les réglages, hors week-ends, vacances et jours fériés.
  const joursClasse = state.reglages.jours ?? ["Lundi", "Mardi", "Jeudi", "Vendredi"];
  const periode = (fin) => { const out = []; for (let d = iso; d <= fin && out.length < 400; d = addDays(d, 1)) { if (d === iso || (!statutJour(d) && joursClasse.includes(JOURS_JS[new Date(d + "T12:00").getDay()]))) out.push(d); } return out; };
  openModal(corps(), (m) => {
    const majPer = () => { const fin = m.querySelector("[name=fin]").value; const n = fin > iso ? periode(fin).length : 1; m.querySelector("#rpPer").textContent = fin > iso ? `${n} jour${n > 1 ? "s" : ""} de classe du ${fmtLong(iso)} au ${fmtLong(fin)} (sans les week-ends, mercredis non travaillés, vacances et jours fériés).` : ""; };
    m.querySelector("[name=fin]").oninput = majPer;
    m.onclick = (e) => {
      const t = e.target.closest("button"); if (!t) return;
      if (t.dataset.e != null) { j.e = t.dataset.e; m.querySelectorAll("[data-e]").forEach((b) => b.classList.toggle("on", b === t)); }
      if (t.dataset.d) { j.d = t.dataset.d; m.querySelectorAll("[data-d]").forEach((b) => b.classList.toggle("on", b === t)); }
      if (t.id === "rpOk") {
        j.classe = m.querySelector("[name=classe]").value.trim(); j.note = m.querySelector("[name=note]").value.trim();
        const fin = m.querySelector("[name=fin]").value, dates = fin > iso ? periode(fin) : [iso];
        for (const d of dates) { if (j.e) r.jours[d] = { ...j }; else delete r.jours[d]; }
        save("remplacements"); closeModal(true); viewRemplacements();
      }
    };
  });
}

// ---------- MES RESSOURCES (PDF, images, vidéos, diapos importés) ----------
let filtreDossier = "";
async function viewRessources() {
  let liste = [];
  try { liste = await res.lister(); } catch (e) { app.innerHTML = `<div class="sheet"><p class="err">Impossible d'ouvrir le stockage des fichiers sur ce navigateur (${esc(e?.message || e)}).</p></div>`; return; }
  if (document.body.dataset.view !== "ressources") return;
  const dossiers = [...new Set(liste.map((f) => f.dossier).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  if (filtreDossier && !dossiers.includes(filtreDossier)) filtreDossier = "";
  const vus = liste.filter((f) => !filtreDossier || f.dossier === filtreDossier);
  const pl = await res.place();
  const urls = [];
  const vignette = (f) => { const g = res.genre(f); if (g === "image") { const u = URL.createObjectURL(f.blob); urls.push(u); return `<img src="${u}" alt="" loading="lazy">`; } return `<span class="rs-ico">${res.ICONES[g]}</span>`; };
  app.innerHTML = `
    <div class="sheet rs-tete">
      <p>Range ici les fichiers que tu utilises en classe (PDF, images, vidéos, sons…) pour les ouvrir ou les projeter en un clic, sans chercher dans ton ordinateur.</p>
      <div class="row wrap">
        <label class="btn primary rs-ajout">＋ Ajouter des fichiers<input type="file" id="rsFile" multiple hidden accept=".pdf,image/*,video/*,audio/*,.ppt,.pptx,.odp,.key,.doc,.docx,.odt,.xls,.xlsx,.ods"></label>
        <label class="inline">dans le dossier <input id="rsDos" list="rsDosL" value="${esc(filtreDossier)}" placeholder="ex. Maths, Lecture, Anglais"><datalist id="rsDosL">${dossiers.map((d) => `<option value="${esc(d)}">`).join("")}</datalist></label>
      </div>
      <p class="hint">Tu peux aussi glisser des fichiers ici. Ils restent sur cet appareil : ils ne sont pas copiés dans ton compte ni dans la sauvegarde.${pl?.dispo ? ` Place utilisée : ${res.taille(pl.utilise)} sur ${res.taille(pl.dispo)} disponibles.` : ""}</p>
      <p class="hint">PowerPoint et diaporamas : le navigateur ne sait pas les afficher. Enregistre-les en PDF (dans PowerPoint : Fichier > Exporter > PDF) pour les projeter ici ; sinon l'app les ouvre avec ton logiciel habituel.</p>
    </div>
    ${dossiers.length ? `<div class="seg wrap rs-filtres"><button data-dos="" class="${!filtreDossier ? "on" : ""}">Tout (${liste.length})</button>${dossiers.map((d) => `<button data-dos="${esc(d)}" class="${filtreDossier === d ? "on" : ""}">${esc(d)} (${liste.filter((f) => f.dossier === d).length})</button>`).join("")}</div>` : ""}
    <div class="rs-grille" id="rsDrop">${vus.map((f) => `
      <div class="rs-carte" data-id="${f.id}">
        <a class="rs-vig" href="#/ressources/${f.id}">${vignette(f)}</a>
        <div class="rs-info"><a href="#/ressources/${f.id}" class="rs-nom">${esc(f.nom)}</a><span class="hint">${esc(f.dossier || "Sans dossier")} · ${res.taille(f.taille || f.blob?.size || 0)}</span></div>
        <div class="rs-act"><button class="mini" data-ren="${f.id}">Renommer</button><button class="mini" data-dep="${f.id}">Dossier</button><button class="mini" data-sup="${f.id}">Supprimer</button></div>
      </div>`).join("") || `<div class="empty"><span>📂</span><p>${liste.length ? "Aucun fichier dans ce dossier." : "Aucun fichier pour l'instant. Ajoute tes PDF, images ou vidéos de classe."}</p></div>`}</div>`;
  const ajouter = async (files) => {
    const dossier = ($("#rsDos")?.value || "").trim();
    let n = 0;
    for (const file of files) {
      try { await res.enregistrer({ id: uid(), nom: file.name, type: file.type, taille: file.size, dossier, ajoute: new Date().toISOString(), blob: file }); n++; }
      catch (e) { alert(`« ${file.name} » n'a pas pu être enregistré (${/quota/i.test(e?.name + e?.message) ? "plus assez de place sur l'appareil" : e?.message || e}).`); }
    }
    if (dossier) filtreDossier = dossier;
    if (n) viewRessources();
  };
  $("#rsFile").onchange = (e) => ajouter([...e.target.files]);
  const zone = app;
  zone.ondragover = (e) => { if ([...(e.dataTransfer?.types || [])].includes("Files")) { e.preventDefault(); $("#rsDrop")?.classList.add("survol"); } };
  zone.ondragleave = (e) => { if (!app.contains(e.relatedTarget)) $("#rsDrop")?.classList.remove("survol"); };
  zone.ondrop = (e) => { if (!e.dataTransfer?.files?.length) return; e.preventDefault(); $("#rsDrop")?.classList.remove("survol"); ajouter([...e.dataTransfer.files]); };
  app.onclick = async (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.dos != null) { filtreDossier = t.dataset.dos; return viewRessources(); }
    const id = t.dataset.ren || t.dataset.dep || t.dataset.sup; if (!id) return;
    const f = await res.lire(id); if (!f) return;
    if (t.dataset.ren) { const n = prompt("Nouveau nom :", f.nom); if (n && n.trim()) { f.nom = n.trim(); await res.enregistrer(f); } }
    if (t.dataset.dep) { const d = prompt(`Dossier pour « ${f.nom} » (vide = sans dossier). Dossiers existants : ${dossiers.join(", ") || "aucun"}`, f.dossier || ""); if (d != null) { f.dossier = d.trim(); await res.enregistrer(f); } }
    if (t.dataset.sup && confirm(`Supprimer « ${f.nom} » de BagaSchool ? (Le fichier d'origine sur ton ordinateur n'est pas touché.)`)) await res.supprimer(id);
    viewRessources();
  };
  toolCleanup = () => urls.forEach((u) => URL.revokeObjectURL(u));
}
async function viewRessource(id) {
  const f = await res.lire(id).catch(() => null);
  if (!f) return notFound();
  setTitle(f.nom);
  const g = res.genre(f), url = URL.createObjectURL(f.blob);
  const ouvrirAilleurs = `<a class="btn ghost" href="${url}" download="${esc(f.nom)}" target="_blank" rel="noopener">Ouvrir avec une autre application</a>`;
  const contenu = g === "pdf" ? `<iframe class="rs-pdf" src="${url}#view=FitH" title="${esc(f.nom)}"></iframe><p class="hint center rs-pdf-aide">Le PDF ne s'affiche pas ? ${ouvrirAilleurs}</p>`
    : g === "image" ? `<img class="rs-img" src="${url}" alt="${esc(f.nom)}">`
    : g === "video" ? `<video class="rs-img" src="${url}" controls playsinline></video>`
    : g === "audio" ? `<div class="tool-center"><span class="rs-ico big">🎵</span><audio src="${url}" controls></audio></div>`
    : `<div class="tool-center rs-autre"><span class="rs-ico big">${res.ICONES[g]}</span><p>${g === "diapo" ? "Le navigateur ne peut pas afficher un diaporama PowerPoint ou Keynote. Pour le projeter ici, enregistre-le en PDF (Fichier > Exporter > PDF) et ajoute le PDF. Tu peux aussi l'ouvrir avec ton logiciel :" : "Ce type de fichier ne s'affiche pas dans le navigateur. Tu peux l'ouvrir avec ton logiciel :"}</p>${ouvrirAilleurs}</div>`;
  app.innerHTML = `
    <section class="board rs-board" id="board" style="--tile:#e8e3ff">
      <header class="board-head">
        <a href="#/ressources" class="round-btn" aria-label="Retour à mes ressources">←</a>
        <h2><span>${res.ICONES[g]}</span> ${esc(f.nom)}</h2>
        <button class="round-btn" id="fs" aria-label="Plein écran" title="Plein écran">⛶</button>
      </header>
      <div class="board-body rs-corps">${contenu}</div>
    </section>`;
  const finAnnot = installerAnnotation($("#board")), finTap = tapFiable($("#board")), finBarre = installerBarre($("#board"), ctxBarre);
  $("#fs").onclick = () => { const b = $("#board"); if (document.fullscreenElement) document.exitFullscreen?.(); else { try { (b.requestFullscreen || b.webkitRequestFullscreen)?.call(b)?.catch?.(() => {}); } catch {} } };
  toolCleanup = () => { finBarre(); finAnnot(); finTap(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
}

// ---------- partager ma journée (js/partage.js) ----------
const ctxPartage = () => ({ app, state, save, esc, $, $$, fmtLong, fmtCourt, capit, addDays, isoLocal, JOURS_JS, prochainJourClasse, compte, qrcode, creneauxDuJour, compById });

// ---------- routeur ----------
const TITLES = { accueil: "Aujourd'hui", outils: "En classe", imprimer: "À imprimer", edt: "Emploi du temps", programmations: "Programmations", fiches: "Fiches de préparation", evaluations: "Évaluations", classe: "Ma classe", competences: "Compétences", reglages: "Réglages", journal: "Cahier journal", appel: "Appel", calendrier: "Calendrier scolaire", telecommande: "Télécommande", lier: "Lier un appareil", devoirs: "Devoirs", suivi: "Suivi de la classe", aide: "Installer et projeter", remplacements: "Mes remplacements", ressources: "Mes ressources", partager: "Partager ma journée", voir: "Journée de classe", connexion: "Se connecter", inscription: "Créer mon compte", bienvenue: "Bienvenue", admin: "Administration" };
function setTitle(t) { $("#viewTitle").textContent = t; document.title = `${t} · BagaSchool`; }
function notFound() { app.innerHTML = `<p>Élément introuvable. <a href="#/accueil">Retour</a></p>`; }
function route(doux = false) {
  if (!doux) closeModal(true);
  const y = window.scrollY;
  try { toolCleanup?.(); } catch {}
  toolCleanup = null;
  app.onclick = app.oninput = app.onchange = app.ondragover = app.ondragleave = app.ondrop = null;
  const [, name = "accueil", id, sub] = location.hash.split("/");
  if (id === "new" && name === "fiches") { location.replace(`#/fiches/${newFiche().id}`); return; }
  if (id === "modele" && name === "fiches") { location.replace("#/fiches"); setTimeout(choisirModele, 0); return; }
  if (id === "new" && name === "evaluations") { location.replace(`#/evaluations/${newEval().id}`); return; }
  setTitle(TITLES[name] ?? "");
  $$("[data-route]").forEach((a) => a.classList.toggle("on", a.dataset.route === name));
  document.body.classList.remove("nav-open");
  window.scrollTo(0, doux ? y : 0);
  const views = {
    accueil: viewAccueil,
    outils: () => (id ? viewOutil(id) : viewOutils()),
    imprimer: () => (id ? viewGenerateur(id) : viewImprimer()),
    edt: viewEdt,
    programmations: () => (id ? viewProg(id) : viewProgList()),
    fiches: () => (id ? viewFiche(id) : viewFiches()),
    evaluations: () => (id ? viewEval(id) : viewEvals()),
    classe: () => (id ? viewEleve(id, sub) : viewClasse()), competences: viewCompetences, reglages: viewReglages,
    telecommande: () => { toolCleanup = viewTelecommande(app, { outils: OUTILS, actif: syncActif() }); },
    lier: () => location.replace("#/connexion"),
    connexion: () => viewConnexion(id), inscription: () => viewInscription(id), bienvenue: () => viewBienvenue(id), admin: viewAdmin,
    devoirs: () => viewDevoirs(id), suivi: () => viewSuivi(id), aide: viewAide,
    journal: () => viewJournal(id), appel: () => (id === "bilan" ? viewAppelBilan() : viewAppel(id)), calendrier: viewCalendrier, remplacements: viewRemplacements, partager: () => viewPartager(ctxPartage(), id), voir: () => viewVoir(ctxPartage(), location.hash.slice("#/voir/".length)), ressources: () => (id ? viewRessource(id) : viewRessources()),
  };
  document.body.dataset.view = name;
  if (name !== "outils" && ecran.actif) surveiller();
  (views[name] ?? notFound)();
}
initInstallation();
if (compte.configure()) $("#navAvis")?.addEventListener("click", (e) => { e.preventDefault(); ouvrirAvis(); });
else $("#navAvis")?.remove();
$("#menuBtn").onclick = () => document.body.classList.toggle("nav-open");
$("#navBackdrop").onclick = () => document.body.classList.remove("nav-open");

(async () => {
  state = await db.loadAll();
  rebuildComp();
  await initBackup().catch(() => {});
  initSync({
    lire: (c) => state[c],
    ecrire: async (c, v) => { state[c] = v; await db.set(c, v); planifierBackup(); if (c === "reglages") rebuildComp(); rafraichir(); },
    etat: majEtatSync,
    rc: (msg) => { surRcEcran(msg); surRcTel(msg); },
  });
  if (compte.configure()) {
    // Démarre la synchro si un compte est connecté sur cet appareil (sans bloquer l'affichage).
    compte.session().then((s) => { if (s) { lancerSync(); compte.signalerPresence(VERSION); } }).catch((e) => console.warn(e));
    compte.surChangementSession((evt) => { if (evt === "SIGNED_OUT") arreter(); });
  }
  db.requestPersistence();
  window.addEventListener("hashchange", route);
  route();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    // Mises à jour : le service worker prend la nouvelle version dès qu'elle est publiée ; on propose de recharger.
    const avaitUnSW = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (avaitUnSW) afficherMiseAJour(); });
    navigator.serviceWorker.register("sw.js").then((reg) => {
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
      setInterval(() => reg.update().catch(() => {}), 30 * 60e3);
    }).catch(() => {});
  }
})();
