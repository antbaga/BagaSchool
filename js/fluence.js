// Lecture chronométrée (fluence), du CP au CM2 : un texte, ou une liste de mots isolés (mode « Mots »).
// L'élève lit le texte à voix haute pendant une minute (à l'écran ou sur la copie imprimée).
// La prof touche les mots mal lus pendant la lecture, puis le dernier mot lu. L'app calcule les mots
// correctement lus par minute (MCLM) et les compare aux repères officiels (js/data/fluence-textes.js).
// Historique par élève : collection « fluence », sur l'appareil seulement (jamais synchronisée, RGPD).
import { niveauJeux, segNiveau, surNiveau } from "./niveau.js";
import { TEXTES, LISTES, REPERES } from "./data/fluence-textes.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const CLE_TEXTES = "bagaschool-fluence-textes"; // textes de la prof (sur l'appareil)
const CLE_OPTS = "bagaschool-fluence-opts";
const lireJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

// Un mot = une suite de caractères sans espace qui contient une lettre ou un chiffre.
// « l'école » ou « arc-en-ciel » comptent pour un mot ; la ponctuation isolée (« : ! ?) ne compte pas.
export function decouper(texte) {
  const out = []; let n = 0;
  for (const m of texte.matchAll(/\n+|[^\s]+/g)) {
    const t = m[0];
    if (t.startsWith("\n")) out.push({ br: true });
    else if (/[\p{L}\p{N}]/u.test(t)) out.push({ t, i: n++ });
    else out.push({ t });
  }
  return { tokens: out, nb: n };
}
// Score : mots lus jusqu'au dernier (inclus), moins les erreurs, ramené à une minute.
export function score({ dernier, erreurs, secondes }) {
  const lus = dernier + 1, err = [...erreurs].filter((i) => i <= dernier).length;
  const justes = Math.max(0, lus - err);
  return { lus, err, justes, mclm: Math.round((justes * 60) / Math.max(1, secondes)), precision: lus ? Math.round((justes / lus) * 100) : 0 };
}
// Moment de l'année : sept.-déc. = début, janv.-mars = milieu, avril-août = fin.
const moment = (d = new Date()) => { const m = d.getMonth(); return m >= 8 ? "debut" : m <= 2 ? "milieu" : "fin"; };

function fluence(el, ctx) {
  const opts = Object.assign({ duree: 60, chrono: true, reperes: false, discret: false, taille: 1, sorte: "texte" }, lireJSON(CLE_OPTS, {}));
  const sauverOpts = () => localStorage.setItem(CLE_OPTS, JSON.stringify(opts));
  let mesTextes = lireJSON(CLE_TEXTES, []);
  let niv = niveauJeux(), texteId = null, eleveId = "", vue = "lire"; // lire | edit | histo
  let ordre = null; // liste de mots mélangée (mode Mots)
  let etat = "pret", erreurs = new Set(), dernier = -1, debut = 0, ecoule = 0, timer = null, mode = "erreur", enregistre = false, edition = null;
  const records = () => ctx.fluence ?? [];
  const eleves = () => ctx.eleves ?? [];
  const mots = () => opts.sorte === "mots";
  const textesNiv = () => [...(mots() ? LISTES : TEXTES).filter((t) => t.niv === niv), ...mesTextes.filter((t) => t.niv === niv && !!t.liste === mots())];
  const texte = () => { const t = textesNiv().find((x) => x.id === texteId) ?? textesNiv()[0]; return t && ordre && t.liste ? { ...t, texte: ordre } : t; };
  const melanger = () => { const t = texte(); if (!t?.liste) return; const a = t.texte.split(/\s+/); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } ordre = a.join(" "); };
  const reset = () => { clearInterval(timer); timer = null; etat = "pret"; erreurs = new Set(); dernier = -1; ecoule = 0; mode = "erreur"; enregistre = false; };

  const reste = () => Math.max(0, opts.duree - ecoule);
  const fmt = (x) => { const s = Math.ceil(x); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const tick = () => {
    ecoule = (performance.now() - debut) / 1000;
    if (ecoule >= opts.duree) { ecoule = opts.duree; finir(); return; }
    const c = el.querySelector("#fluChrono"); if (c) c.textContent = fmt(reste());
    const b = el.querySelector("#fluBarre"); if (b) b.style.width = `${(ecoule / opts.duree) * 100}%`;
  };
  const demarrer = () => { reset(); etat = "lecture"; debut = performance.now(); timer = setInterval(tick, 200); render(); };
  const finir = (avant = false) => {
    clearInterval(timer); timer = null; etat = "dernier"; mode = "dernier";
    if (avant) ecoule = Math.max(1, (performance.now() - debut) / 1000);
    bip(); render();
  };
  const bip = () => { try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; g.gain.value = 0.15; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.35); o.onended = () => a.close(); } catch {} };

  const repereHTML = (mclm) => {
    const r = REPERES[niv], mo = moment();
    const marques = [r.debut != null && { v: r.debut, l: "début" }, { v: r.fin, l: "fin" }].filter(Boolean);
    const max = Math.max(r.fin * 1.6, 80);
    const pos = (v) => `${Math.min(100, (v / max) * 100)}%`;
    const ref = mo === "debut" && r.debut != null ? r.debut : r.fin;
    const msg = mclm >= ref ? "Au niveau du repère ou au-dessus." : mclm >= ref * 0.8 ? "Proche du repère." : "En dessous du repère : à entraîner et à suivre.";
    return `<div class="flu-jauge"><div class="flu-jauge-in" style="width:${pos(mclm)}"></div>
        ${marques.map((m) => `<span class="flu-marque" style="left:${pos(m.v)}"><b>${m.v}</b><i>${m.l}</i></span>`).join("")}</div>
      <p class="flu-msg">${msg}</p>${ecoule < 20 ? `<p class="hint">⚠️ Lecture de moins de 20 secondes : le score ramené à une minute est peu fiable.</p>` : ""}
      <p class="hint flu-src">Repères en mots correctement lus par minute.${r.debut != null ? ` Début de ${niv} : ${r.debut} (seuil « satisfaisant » des évaluations nationales de début d'année, DEPP 2026).` : ""} Fin de ${niv} : ${r.fin} (attendu de fin d'année, Eduscol). On est en ${mo === "debut" ? "début" : mo === "milieu" ? "milieu" : "fin"} d'année.</p>`;
  };

  const texteHTML = (t) => {
    const { tokens } = decouper(t.texte);
    return tokens.map((k) => {
      if (k.br) return "<br>";
      if (k.i == null) return `<span class="flu-p">${esc(k.t)}</span> `;
      const c = ["flu-m", erreurs.has(k.i) && k.i <= (dernier < 0 ? Infinity : dernier) ? "err" : "", dernier >= 0 && k.i > dernier ? "apres" : "", k.i === dernier ? "dern" : ""].filter(Boolean).join(" ");
      const rep = opts.reperes && (k.i + 1) % 10 === 0 ? `<sup class="flu-rep">${k.i + 1}</sup>` : "";
      return t.liste ? `<span class="${c}" data-w="${k.i}">${esc(k.t)}${rep}</span>` : `<span class="${c}" data-w="${k.i}">${esc(k.t)}</span>${rep} `;
    }).join("");
  };

  const tete = () => `
    <div class="tool-top wrap"><div class="seg flu-sorte" role="group" aria-label="Lire"><button data-sorte="texte" class="${mots() ? "" : "on"}">📖 Texte</button><button data-sorte="mots" class="${mots() ? "on" : ""}">🔤 Mots</button></div>${segNiveau(niv)}
      <select id="fluTexte" aria-label="${mots() ? "Liste" : "Texte"}">${textesNiv().map((t) => `<option value="${t.id}" ${t.id === texte()?.id ? "selected" : ""}>${t.perso ? "✏️ " : ""}${esc(t.titre)}</option>`).join("")}</select>
      ${eleves().length ? `<select id="fluEleve" aria-label="Élève"><option value="">Élève : aucun</option>${eleves().map((e) => `<option value="${e.id}" ${e.id === eleveId ? "selected" : ""}>${esc(e.prenom)}</option>`).join("")}</select>` : ""}
    </div>
    <div class="tool-top wrap flu-opts">
      <div class="seg" role="group" aria-label="Durée">${[60, 120].map((d) => `<button data-duree="${d}" class="${opts.duree === d ? "on" : ""}">${d / 60} min</button>`).join("")}</div>
      <button class="pill ${opts.chrono ? "on" : ""}" id="fluChr" title="Afficher le temps restant">⏱️ Chrono visible</button>
      <button class="pill ${opts.discret ? "on" : ""}" id="fluDis" title="Erreurs marquées par un simple point, moins visibles pour l'élève">🙈 Marques discrètes</button>
      <button class="pill ${opts.reperes ? "on" : ""}" id="fluRep" title="Numéros tous les 10 mots">🔟 Repères</button>
      <button class="pill" id="fluMoins" aria-label="Texte plus petit">A−</button><button class="pill" id="fluPlus" aria-label="Texte plus grand">A+</button>
      ${mots() ? `<button class="pill" id="fluMel" title="Changer l'ordre des mots">🔀 Mélanger</button>` : ""}
      <button class="pill" id="fluNouv">✏️ ${mots() ? "Ma liste" : "Mon texte"}</button>
      ${texte()?.perso ? `<button class="pill" id="fluModif">Modifier</button>` : ""}
      <button class="pill" id="fluImpr">🖨️ Imprimer</button>
      <button class="pill" id="fluHisto">📈 Historique</button>
    </div>`;

  const barreAction = () => {
    if (etat === "pret") return `<button class="big-btn" id="fluGo">▶ Démarrer (${opts.duree / 60} min)</button><span class="hint">Pendant la lecture, touche les mots mal lus. Touche encore pour annuler.</span>`;
    if (etat === "lecture") return `<span class="flu-chrono ${opts.chrono ? "" : "cache"}" id="fluChrono">${fmt(reste())}</span><button class="big-btn soft" id="fluStop">⏹ A fini ${mots() ? "la liste" : "le texte"} / Arrêter</button><span class="hint">${erreurs.size} erreur(s)</span>`;
    if (etat === "dernier") return `<div class="seg" role="group"><button data-mode="dernier" class="${mode === "dernier" ? "on" : ""}">👆 Dernier mot lu</button><button data-mode="erreur" class="${mode === "erreur" ? "on" : ""}">✖ Erreurs</button></div>
      <span class="hint">${dernier < 0 ? "Touche le dernier mot lu." : `Dernier mot : n° ${dernier + 1}`}</span>
      <button class="big-btn" id="fluOk" ${dernier < 0 ? "disabled" : ""}>Voir le résultat</button><button class="pill" id="fluRaz">Recommencer</button>`;
    return "";
  };

  const resultatHTML = () => {
    const s = score({ dernier, erreurs, secondes: ecoule }), e = eleves().find((x) => x.id === eleveId);
    return `<div class="flu-res rc-board">
      <div class="flu-score"><b>${s.mclm}</b><span>mots correctement lus par minute</span></div>
      <div class="flu-stats"><span>📖 ${s.lus} mots lus</span><span>✖ ${s.err} erreur(s)</span><span>🎯 ${s.precision} % de mots justes</span><span>⏱️ ${Math.round(ecoule)} s</span></div>
      ${texte()?.liste ? `${ecoule < 20 ? `<p class="hint">⚠️ Lecture de moins de 20 secondes : le score ramené à une minute est peu fiable.</p>` : ""}<p class="hint flu-src">Pas de repère officiel intégré pour les listes de mots (les repères portent sur la lecture d'un texte) : compare surtout l'élève à lui-même, dans l'historique.</p>` : repereHTML(s.mclm)}
      <div class="pills rc-keep">
        ${e ? (enregistre ? `<span class="banner ok">Enregistré pour ${esc(e.prenom)} ✓</span>` : `<button class="big-btn" id="fluSave">💾 Enregistrer pour ${esc(e.prenom)}</button>`) : eleves().length ? `<span class="hint">Choisis un élève en haut pour garder ce résultat.</span>` : ""}
        <button class="pill" id="fluVoir">Revoir ${texte()?.liste ? "la liste" : "le texte"}</button><button class="pill" id="fluRaz">Nouvelle lecture</button>
      </div></div>`;
  };

  const histoHTML = () => {
    const ids = new Set(eleves().map((e) => e.id));
    const recs = records().filter((r) => ids.has(r.eleveId));
    const sel = eleveId ? eleves().filter((e) => e.id === eleveId) : eleves();
    if (!eleves().length) return `<p class="hint">Ajoute tes élèves dans <a href="#/classe">Ma classe</a> pour garder leurs résultats.</p>`;
    return `<div class="flu-histo">
      <p class="hint">Résultats gardés sur cet appareil seulement (ils ne sont pas envoyés sur ton compte). Ils sont inclus dans l'export de sauvegarde.</p>
      <table class="flu-table"><thead><tr><th>Élève</th><th>Dernier</th><th>Évolution</th><th>Détail</th></tr></thead><tbody>
      ${sel.map((e) => {
        const rs = recs.filter((r) => r.eleveId === e.id).sort((a, b) => a.date.localeCompare(b.date));
        const last = rs[rs.length - 1];
        return `<tr><th>${esc(e.prenom)}</th><td>${last ? `<b>${last.mclm}</b> <span class="hint">${last.niveau}</span>` : "—"}</td><td>${spark(rs)}</td>
          <td>${rs.slice().reverse().map((r) => `<span class="flu-rec" title="${esc(r.titre)} · ${r.lus} lus, ${r.erreurs} erreur(s), ${r.secondes} s">${new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} : <b>${r.mclm}</b><button class="flu-x" data-del="${r.id}" aria-label="Supprimer ce résultat">×</button></span>`).join("") || ""}</td></tr>`;
      }).join("")}</tbody></table>
      <button class="pill" id="fluRetour">← Retour à la lecture</button></div>`;
  };
  const spark = (rs) => {
    if (rs.length < 2) return "";
    const w = 120, h = 34, max = Math.max(...rs.map((r) => r.mclm), 1);
    const pts = rs.map((r, i) => `${(i / (rs.length - 1)) * (w - 6) + 3},${h - 3 - (r.mclm / max) * (h - 6)}`).join(" ");
    return `<svg class="flu-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  };

  const editHTML = () => `<div class="flu-edit">
      <label>Titre<input id="fluT" value="${esc(edition?.titre ?? "")}" placeholder="${mots() ? "ex. Mots de la semaine" : "ex. Texte Eduscol, période 2"}"></label>
      <label>${mots() ? "Mots (séparés par des espaces ou un par ligne)" : "Texte (colle ou tape le texte que l'élève lira)"}<textarea id="fluX" rows="10">${esc(edition?.texte ?? "")}</textarea></label>
      <p class="hint" id="fluNb"></p>
      <div class="pills"><button class="big-btn" id="fluEnr">Enregistrer pour le ${niv}</button><button class="pill" id="fluAnn">Annuler</button>${edition?.id ? `<button class="pill" id="fluSuppr">Supprimer</button>` : ""}</div>
    </div>`;

  const render = () => {
    const t = texte();
    if (vue === "edit") { el.innerHTML = `<div class="tool-top"><b>✏️ ${edition?.id ? (mots() ? "Modifier ma liste" : "Modifier mon texte") : mots() ? "Ma liste de mots" : "Mon texte"} (${niv})</b></div>` + editHTML(); majNb(); return; }
    if (vue === "histo") { el.innerHTML = `<div class="tool-top"><b>📈 Historique de lecture</b></div>` + histoHTML(); return; }
    el.innerHTML = tete() + (etat === "resultat" ? resultatHTML() : `
      <div class="flu-zone rc-board">
        <div class="flu-progress ${etat === "lecture" && opts.chrono ? "" : "cache"}"><div id="fluBarre" style="width:${(ecoule / opts.duree) * 100}%"></div></div>
        <h3 class="flu-titre">${esc(t?.titre ?? "")}</h3>
        <div class="flu-texte ${etat} ${opts.discret ? "discret" : ""} ${t?.liste ? "liste" : ""}" style="--flu-taille:${opts.taille}">${t ? texteHTML(t) : ""}</div>
      </div>
      <div class="flu-actions rc-keep">${barreAction()}</div>
      ${t ? `<p class="hint flu-src">${t.liste ? "Liste" : "Texte"} de ${decouper(t.texte).nb} mots, ${t.perso ? "gardé sur cet appareil" : "rédigé pour BagaSchool"}.${t.liste && !t.perso ? " Si l'élève finit la liste avant la fin, arrête le chrono : le score est ramené à une minute." : ""}</p>` : ""}`);
  };
  const majNb = () => { const x = el.querySelector("#fluX"), n = el.querySelector("#fluNb"); if (x && n) n.textContent = `${decouper(x.value).nb} mots`; };

  const imprimer = () => {
    const t = texte(); if (!t) return;
    const { tokens } = decouper(t.texte);
    const corps = (prof) => tokens.map((k) => k.br ? (t.liste ? "" : "<br>") : k.i == null ? esc(k.t) + " " : t.liste ? `<span class="w">${esc(k.t)}${prof && (k.i + 1) % 10 === 0 ? `<sup>${k.i + 1}</sup>` : ""}</span>` : esc(k.t) + (prof && (k.i + 1) % 10 === 0 ? `<sup>${k.i + 1}</sup>` : "") + " ").join("");
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>${esc(t.titre)}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;margin:18mm}h1{font-size:22px}.el{font-size:${niv === "CP" ? 26 : niv === "CE1" ? 22 : 19}px;line-height:1.9}.prof{font-size:15px;line-height:1.8;page-break-before:always}sup{color:#777;font-size:10px;margin-left:1px}p.n{color:#555;font-size:13px}.w{display:inline-block;width:24%;padding:2px 0}</style>
      <h1>${esc(t.titre)}</h1><div class="el">${corps(false)}</div>
      <div class="prof"><h1>${esc(t.titre)} : copie de l'enseignant (${decouper(t.texte).nb} mots)</h1><p class="n">Numéros tous les 10 mots. Élève : ................ Date : ........ Mots lus : ...... Erreurs : ...... MCLM : ......</p>${corps(true)}</div>
      <script>onload=()=>print()<\/script></html>`);
    w.document.close();
  };

  el.onchange = (e) => {
    if (e.target.id === "fluTexte") { texteId = e.target.value; ordre = null; reset(); render(); }
    if (e.target.id === "fluEleve") { eleveId = e.target.value; enregistre = false; render(); }
  };
  el.oninput = (e) => { if (e.target.id === "fluX") majNb(); };
  el.onclick = (e) => {
    if (etat !== "lecture" && surNiveau(e, (n) => { niv = n; texteId = null; ordre = null; reset(); render(); })) return;
    const w = e.target.closest("[data-w]");
    if (w && (etat === "lecture" || etat === "dernier")) {
      const i = +w.dataset.w;
      if (etat === "dernier" && mode === "dernier") dernier = i;
      else erreurs.has(i) ? erreurs.delete(i) : erreurs.add(i);
      if (etat === "lecture") { w.classList.toggle("err", erreurs.has(i)); const h = el.querySelector(".flu-actions .hint"); if (h) h.textContent = `${erreurs.size} erreur(s)`; return; }
      return render();
    }
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.duree && etat !== "lecture") { opts.duree = +t.dataset.duree; sauverOpts(); }
    if (t.dataset.mode) mode = t.dataset.mode;
    if (t.dataset.sorte && etat !== "lecture") { opts.sorte = t.dataset.sorte; sauverOpts(); texteId = null; ordre = null; reset(); }
    if (t.dataset.del && confirm("Supprimer ce résultat ?")) { const i = records().findIndex((r) => r.id === t.dataset.del); if (i >= 0) { ctx.fluence.splice(i, 1); ctx.saveFluence?.(); } }
    switch (t.id) {
      case "fluGo": return demarrer();
      case "fluStop": return finir(true);
      case "fluOk": etat = "resultat"; break;
      case "fluVoir": etat = "dernier"; break;
      case "fluRaz": reset(); break;
      case "fluChr": opts.chrono = !opts.chrono; sauverOpts(); break;
      case "fluDis": opts.discret = !opts.discret; sauverOpts(); break;
      case "fluRep": opts.reperes = !opts.reperes; sauverOpts(); break;
      case "fluPlus": opts.taille = Math.min(2, +(opts.taille + 0.15).toFixed(2)); sauverOpts(); break;
      case "fluMoins": opts.taille = Math.max(0.6, +(opts.taille - 0.15).toFixed(2)); sauverOpts(); break;
      case "fluMel": if (etat === "lecture") return; melanger(); reset(); break;
      case "fluImpr": return imprimer();
      case "fluHisto": if (etat === "lecture") return; vue = "histo"; break;
      case "fluRetour": vue = "lire"; break;
      case "fluNouv": if (etat === "lecture") return; edition = null; vue = "edit"; break;
      case "fluModif": if (etat === "lecture") return; edition = textesNiv().find((x) => x.id === texte()?.id); vue = "edit"; break;
      case "fluAnn": vue = "lire"; break;
      case "fluEnr": {
        const titre = el.querySelector("#fluT").value.trim() || (mots() ? "Ma liste" : "Mon texte"), brut = el.querySelector("#fluX").value.trim();
        const tx = mots() ? brut.split(/\s+/).join(" ") : brut;
        if (!decouper(tx).nb) return;
        if (edition?.id) Object.assign(mesTextes.find((m) => m.id === edition.id) ?? {}, { titre, texte: tx });
        else { const n = { id: "p-" + uid(), niv, titre, texte: tx, perso: true, ...(mots() ? { liste: true } : {}) }; mesTextes.push(n); texteId = n.id; }
        ordre = null;
        localStorage.setItem(CLE_TEXTES, JSON.stringify(mesTextes)); vue = "lire"; reset(); break;
      }
      case "fluSuppr": if (!confirm(mots() ? "Supprimer cette liste ?" : "Supprimer ce texte ?")) return; mesTextes = mesTextes.filter((m) => m.id !== edition.id); localStorage.setItem(CLE_TEXTES, JSON.stringify(mesTextes)); texteId = null; vue = "lire"; reset(); break;
      case "fluSave": {
        const tt = texte(), s = score({ dernier, erreurs, secondes: ecoule });
        ctx.fluence?.push({ id: uid(), eleveId, date: new Date().toISOString(), niveau: niv, texteId: tt.id, titre: tt.liste ? `Mots : ${tt.titre}` : tt.titre, ...(tt.liste ? { liste: true } : {}), secondes: Math.round(ecoule), lus: s.lus, erreurs: s.err, mclm: s.mclm });
        ctx.saveFluence?.(); enregistre = true; break;
      }
    }
    render();
  };
  render();
  return () => clearInterval(timer);
}

export const FLUENCE = [
  { id: "fluence", nom: "Lecture chronométrée", icone: "⏱️", couleur: "#d6ecff", desc: "Fluence : lire 1 minute, mots correctement lus par minute, repères par niveau", mount: fluence },
];
