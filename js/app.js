import * as db from "./db.js";
import { COMPETENCES, SOURCES, NIVEAUX, DISCIPLINES } from "./competences.js";
import { OUTILS } from "./outils.js";
import { GENERATEURS, seeded } from "./imprimer.js";

export const VERSION = "0.3.0";

// ---------- état ----------
let state = {};
const save = (coll) => db.set(coll, state[coll]);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const compById = Object.fromEntries(COMPETENCES.map((c) => [c.id, c]));

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
    <p class="hint">Référentiel du prototype : extrait du programme de français cycle 3 (CM1-CM2), à compléter.</p>
    <div class="row">
      <input type="search" id="cq" placeholder="Rechercher…">
      <select id="cn"><option value="">Tous niveaux</option>${opts([...new Set(COMPETENCES.map((c) => c.niveau))], "", null)}</select>
    </div>
    <div class="comp-list" id="cl"></div>
    <div class="actions"><span id="cc" class="hint"></span><button data-close class="ghost">Annuler</button><button id="cok" class="primary">Insérer</button></div>
  `, (m) => {
    const draw = () => {
      const q = $("#cq", m).value.toLowerCase();
      const n = $("#cn", m).value;
      const list = COMPETENCES.filter((c) => (!n || c.niveau === n) && (!q || (c.texte + c.sousDomaine).toLowerCase().includes(q)));
      let last = "";
      $("#cl", m).innerHTML = list.map((c) => {
        const head = `${c.niveau} · ${c.domaine} · ${c.sousDomaine}`;
        const h = head !== last ? `<div class="comp-head">${esc(head)}</div>` : "";
        last = head;
        return `${h}<label class="comp"><input type="checkbox" value="${c.id}" ${sel.has(c.id) ? "checked" : ""}> ${esc(c.texte)}</label>`;
      }).join("") || `<p class="hint">Aucun résultat.</p>`;
      $("#cc", m).textContent = `${sel.size} sélectionnée(s)`;
    };
    m.addEventListener("input", (e) => {
      if (e.target.type === "checkbox") { e.target.checked ? sel.add(e.target.value) : sel.delete(e.target.value); $("#cc", m).textContent = `${sel.size} sélectionnée(s)`; }
      else draw();
    });
    $("#cok", m).onclick = () => { closeModal(); onDone([...sel]); };
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
        <span class="time">${esc(s.debut)}–${esc(s.fin)}</span>
        <strong>${esc(s.discipline || "")}</strong>${s.libelle ? `<span>${esc(s.libelle)}</span>` : ""}
      </button>`).join("") || `<p class="hint">Rien pour l'instant.</p>`}
      <button class="ghost small" data-add="${d}">+ Créneau</button></section>`;
  }).join("");
  app.innerHTML = `
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
function editSlot(s) {
  const isNew = !s.id;
  s = { debut: "08:30", fin: "09:30", couleur: COULEURS[0], ...s };
  openModal(`
    <h2>${isNew ? "Nouveau créneau" : "Modifier le créneau"}</h2>
    <form id="f">
      <label>Jour<select name="jour">${opts(JOURS, s.jour, null)}</select></label>
      <div class="row"><label>Début<input type="time" name="debut" value="${s.debut}" required></label>
      <label>Fin<input type="time" name="fin" value="${s.fin}" required></label></div>
      <label>Discipline<input name="discipline" list="disc" value="${esc(s.discipline)}" required></label>
      <datalist id="disc">${DISCIPLINES.map((d) => `<option value="${d}">`).join("")}<option value="Récréation"><option value="Pause méridienne"></datalist>
      <label>Précision (facultatif)<input name="libelle" value="${esc(s.libelle)}" placeholder="ex. Lecture compréhension, groupe CM1"></label>
      <label>Couleur</label><div class="colors">${COULEURS.map((c) => `<label class="sw" style="background:${c}"><input type="radio" name="couleur" value="${c}" ${c === s.couleur ? "checked" : ""}></label>`).join("")}</div>
      <div class="actions">${isNew ? "" : `<button type="button" class="danger" id="del">Supprimer</button>`}<button type="button" data-close class="ghost">Annuler</button><button class="primary">Enregistrer</button></div>
    </form>`, (m) => {
    $("#f", m).onsubmit = (e) => {
      e.preventDefault();
      const d = formData(e.target);
      d.couleur = $("input[name=couleur]:checked", m)?.value ?? COULEURS[0];
      if (d.fin <= d.debut) return alertInline(m, "L'heure de fin doit être après l'heure de début.");
      if (isNew) state.edt.push({ id: uid(), ...d }); else Object.assign(state.edt.find((x) => x.id === s.id), d);
      save("edt"); closeModal(); viewEdt();
    };
    $("#del", m)?.addEventListener("click", () => { state.edt = state.edt.filter((x) => x.id !== s.id); save("edt"); closeModal(); viewEdt(); });
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
  app.innerHTML = `
    <div class="toolbar"><a href="#/programmations" class="ghost btn">← Programmations</a>
      <span class="grow"><strong>${esc(p.discipline)}</strong> · ${esc(p.niveau)} · ${esc(p.annee)}</span>
      <button class="ghost" onclick="print()">Imprimer</button><button class="danger" id="delp">Supprimer</button></div>
    <div class="periods">${p.periodes.map((seqs, i) => `
      <section class="period"><h3>${PERIODES[i]}</h3>
        ${seqs.map((s) => `<button class="seq" data-seq="${i}:${s.id}"><strong>${esc(s.titre)}</strong>
          <span class="hint">${s.seances.length} séance(s) · ${s.competences.length} compétence(s)</span></button>`).join("")}
        <button class="ghost small" data-addseq="${i}">+ Séquence</button></section>`).join("")}</div>`;
  app.onclick = (e) => {
    const a = e.target.closest("[data-addseq]");
    if (a) { const s = { id: uid(), titre: "Nouvelle séquence", competences: [], seances: [] }; p.periodes[+a.dataset.addseq].push(s); save("programmations"); return editSeq(p, +a.dataset.addseq, s); }
    const q = e.target.closest("[data-seq]");
    if (q) { const [i, sid] = q.dataset.seq.split(":"); return editSeq(p, +i, p.periodes[i].find((s) => s.id === sid)); }
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
  const f = { id: uid(), titre: "Nouvelle fiche", discipline: "", niveau: "", date: "", duree: "45 min", objectif: "", competences: [], materiel: "",
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
  $("#add").onclick = () => { location.hash = `#/fiches/${newFiche().id}`; };
}
const MODALITES = ["Collectif", "Individuel", "Binômes", "Groupes", "Ateliers"];
function viewFiche(id) {
  const f = state.fiches.find((x) => x.id === id);
  if (!f) return notFound();
  setTitle("Fiche de préparation");
  const draw = () => {
    app.innerHTML = `
      <div class="toolbar no-print"><a href="#/fiches" class="ghost btn">← Fiches</a><span class="grow hint">Enregistrement automatique</span>
        <button class="ghost" id="dup">Dupliquer</button><button class="ghost" onclick="print()">Imprimer / PDF</button><button class="danger" id="del">Supprimer</button></div>
      <form class="sheet" id="f" autocomplete="off">
        <input class="title-input" name="titre" value="${esc(f.titre)}" aria-label="Titre">
        <div class="grid4">
          <label>Discipline<select name="discipline">${opts(DISCIPLINES, f.discipline)}</select></label>
          <label>Niveau<input name="niveau" value="${esc(f.niveau)}"></label>
          <label>Date<input type="date" name="date" value="${esc(f.date)}"></label>
          <label>Durée<input name="duree" value="${esc(f.duree)}"></label>
        </div>
        <label>Objectif de la séance<textarea name="objectif" rows="2">${esc(f.objectif)}</textarea></label>
        <div class="label-row"><span>Compétences des programmes</span><button type="button" class="ghost small no-print" id="addc">+ Insérer</button></div>
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
          <td>${it.compId ? `<span>${esc(compById[it.compId]?.texte ?? "(compétence inconnue)")}</span>` : `<input data-it="${k}" value="${esc(it.texte)}" placeholder="Intitulé de l'item">`}</td>
          ${CODES.slice(1).map(() => `<td class="code box"></td>`).join("")}
          <td class="no-print"><button type="button" class="ghost small" data-rmit="${k}" aria-label="Retirer">×</button></td></tr>`).join("")
          || `<tr><td colspan="6" class="hint">Ajoute des compétences : elles sont insérées telles qu'écrites dans le référentiel.</td></tr>`}</tbody></table>
        <p class="hint">${CODES.slice(1).map((c) => `${c.code} = ${c.label}`).join(" · ")}</p>
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
const itemText = (it) => (it.compId ? compById[it.compId]?.texte ?? "(compétence inconnue)" : it.texte || "(item sans titre)");

// ---------- CLASSE ----------
function viewClasse() {
  app.innerHTML = `
    <p class="intro">Les prénoms restent sur cet appareil. Évite les noms de famille.</p>
    <form id="f" class="row"><textarea name="noms" rows="2" placeholder="Un ou plusieurs prénoms (un par ligne)" class="grow"></textarea><button class="primary">Ajouter</button></form>
    <ul class="pupils">${state.eleves.map((e) => `<li><input data-el="${e.id}" value="${esc(e.prenom)}"><button class="ghost small" data-rm="${e.id}" aria-label="Retirer">×</button></li>`).join("")}</ul>
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
  const src = Object.values(SOURCES);
  app.innerHTML = `
    <div class="notice"><strong>Prototype :</strong> le référentiel ne contient pour l'instant qu'un extrait
      (${COMPETENCES.length} objectifs de français, cycle 3, CM1-CM2), recopié tel quel depuis :
      ${src.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(", ")}.
      Texte non encore vérifié contre le Bulletin officiel.</div>
    <input type="search" id="q" placeholder="Rechercher…">
    <div id="l"></div>`;
  const draw = () => {
    const q = $("#q").value.toLowerCase();
    let last = "";
    $("#l").innerHTML = COMPETENCES.filter((c) => !q || c.texte.toLowerCase().includes(q)).map((c) => {
      const head = `${c.niveau} · ${c.domaine} · ${c.sousDomaine}`;
      const h = head !== last ? `<h3 class="comp-head">${esc(head)}</h3>` : ""; last = head;
      return `${h}<p class="comp">${esc(c.texte)}</p>`;
    }).join("");
  };
  $("#q").oninput = draw; draw();
}

// ---------- RÉGLAGES ----------
async function viewReglages() {
  const persisted = await navigator.storage?.persisted?.().catch(() => false);
  app.innerHTML = `
    <div class="sheet">
      <h2>Sauvegarde</h2>
      <p>Tes données sont enregistrées <strong>uniquement sur cet appareil</strong>, dans ce navigateur. Elles ne passent par aucun serveur.
      Pour ne rien perdre, ou pour passer du téléphone à l'ordinateur, exporte un fichier de sauvegarde puis importe-le sur l'autre appareil.</p>
      <p class="hint">Stockage protégé par le navigateur : ${persisted ? "oui" : "non (le navigateur peut effacer les données s'il manque de place)"}.</p>
      <div class="row"><button class="primary" id="exp">Exporter une sauvegarde</button>
        <label class="btn ghost">Importer une sauvegarde<input type="file" id="imp" accept="application/json,.json" hidden></label></div>
      <p class="hint">L'import remplace toutes les données actuelles de cet appareil.</p>
      <h2>Données d'exemple</h2>
      <div class="row"><button class="ghost" id="demo">Charger un exemple</button><button class="danger" id="wipe">Tout effacer</button></div>
      <p class="hint">BagaSchool version ${VERSION}</p>
    </div>`;
  $("#exp").onclick = () => {
    const blob = new Blob([JSON.stringify({ app: "bagaschool", version: VERSION, exportedAt: new Date().toISOString(), data: state }, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `bagaschool-${new Date().toISOString().slice(0, 10)}.json` });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $("#imp").onchange = async (e) => {
    try {
      const j = JSON.parse(await e.target.files[0].text());
      if (j.app !== "bagaschool" || !j.data) throw new Error("Ce fichier n'est pas une sauvegarde BagaSchool.");
      if (!confirm("Remplacer toutes les données de cet appareil par cette sauvegarde ?")) return;
      for (const c of db.COLLECTIONS) { state[c] = j.data[c] ?? (c === "reglages" ? {} : []); await save(c); }
      alert("Sauvegarde importée."); route();
    } catch (err) { alert(err.message); }
  };
  $("#demo").onclick = async () => { if (confirm("Ajouter des données d'exemple ?")) { await loadDemo(); location.hash = "#/accueil"; } };
  $("#wipe").onclick = async () => {
    if (!confirm("Effacer toutes les données de cet appareil ? Exporte une sauvegarde avant si besoin.")) return;
    await db.clear(); state = await db.loadAll(); route();
  };
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
  const slots = state.edt.filter((s) => s.jour === jour).sort((a, b) => a.debut.localeCompare(b.debut));
  const fiches = state.fiches.filter((f) => f.date === localISO(now));
  const recent = state.fiches.slice(0, 3);
  const dateTxt = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  app.innerHTML = `
    <section class="hello"><h2>Bonjour ! 👋</h2><p>Nous sommes ${esc(dateTxt)}.</p></section>
    <div class="home-grid">
      <section class="panel">
        <div class="panel-head"><h3>Ma journée</h3><a href="#/edt" class="link">Emploi du temps</a></div>
        ${slots.length ? `<ol class="today">${slots.map((s) => {
          const cls = s.fin <= hm ? "past" : s.debut <= hm ? "now" : "";
          return `<li class="${cls}" style="--c:${s.couleur}"><span class="today-time">${esc(s.debut)}</span><span class="today-what"><b>${esc(s.discipline)}</b>${s.libelle ? ` · ${esc(s.libelle)}` : ""}</span>${cls === "now" ? `<span class="badge">en cours</span>` : ""}</li>`;
        }).join("")}</ol>` : `<div class="empty"><span>🌤️</span><p>${state.edt.length ? `Pas de cours prévu ce ${jour.toLowerCase()}.` : "Ton emploi du temps est vide."}</p>${state.edt.length ? "" : `<a class="primary btn" href="#/edt">Remplir mon emploi du temps</a>`}</div>`}
        ${fiches.length ? `<h4>Fiches prévues aujourd'hui</h4>${fiches.map((f) => `<a class="item" href="#/fiches/${f.id}">📝 ${esc(f.titre)}</a>`).join("")}` : ""}
      </section>
      <section class="panel">
        <div class="panel-head"><h3>En classe</h3><a href="#/outils" class="link">Tous les outils</a></div>
        <div class="tiles small">${OUTILS.slice(0, 6).map((o) => toolTile(o)).join("")}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h3>Préparer</h3></div>
        <div class="quick">
          <a class="quick-btn" href="#/fiches/new"><span>📝</span>Nouvelle fiche</a>
          <a class="quick-btn" href="#/evaluations/new"><span>✅</span>Nouvelle évaluation</a>
          <a class="quick-btn" href="#/imprimer"><span>🖨️</span>À imprimer</a>
        </div>
        ${recent.length ? `<h4>Dernières fiches</h4>${recent.map((f) => `<a class="item" href="#/fiches/${f.id}">${esc(f.titre)}<span class="hint">${esc(f.discipline)}</span></a>`).join("")}` : ""}
      </section>
    </div>`;
}

// ---------- EN CLASSE (outils) ----------
let toolCleanup = null;
function viewOutils() {
  app.innerHTML = `<p class="intro">Des outils à projeter au tableau ou à utiliser sur ton téléphone pendant la classe.</p>
    <div class="tiles">${OUTILS.map((o) => toolTile(o, true)).join("")}</div>`;
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
  toolCleanup = o.mount($("#tool"), { eleves: state.eleves, esc }) || null;
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

// ---------- routeur ----------
const TITLES = { accueil: "Aujourd'hui", outils: "En classe", imprimer: "À imprimer", edt: "Emploi du temps", programmations: "Programmations", fiches: "Fiches de préparation", evaluations: "Évaluations", classe: "Ma classe", competences: "Compétences", reglages: "Réglages" };
function setTitle(t) { $("#viewTitle").textContent = t; document.title = `${t} · BagaSchool`; }
function notFound() { app.innerHTML = `<p>Élément introuvable. <a href="#/accueil">Retour</a></p>`; }
function route() {
  closeModal(true);
  try { toolCleanup?.(); } catch {}
  toolCleanup = null;
  app.onclick = app.oninput = app.onchange = null;
  const [, name = "accueil", id] = location.hash.split("/");
  if (id === "new" && name === "fiches") { location.replace(`#/fiches/${newFiche().id}`); return; }
  if (id === "new" && name === "evaluations") { location.replace(`#/evaluations/${newEval().id}`); return; }
  setTitle(TITLES[name] ?? "");
  $$("[data-route]").forEach((a) => a.classList.toggle("on", a.dataset.route === name));
  document.body.classList.remove("nav-open");
  window.scrollTo(0, 0);
  const views = {
    accueil: viewAccueil,
    outils: () => (id ? viewOutil(id) : viewOutils()),
    imprimer: () => (id ? viewGenerateur(id) : viewImprimer()),
    edt: viewEdt,
    programmations: () => (id ? viewProg(id) : viewProgList()),
    fiches: () => (id ? viewFiche(id) : viewFiches()),
    evaluations: () => (id ? viewEval(id) : viewEvals()),
    classe: viewClasse, competences: viewCompetences, reglages: viewReglages,
  };
  document.body.dataset.view = name;
  (views[name] ?? notFound)();
}
$("#menuBtn").onclick = () => document.body.classList.toggle("nav-open");
$("#navBackdrop").onclick = () => document.body.classList.remove("nav-open");

(async () => {
  state = await db.loadAll();
  db.requestPersistence();
  window.addEventListener("hashchange", route);
  route();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
