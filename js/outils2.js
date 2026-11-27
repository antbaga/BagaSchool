// Outils « En classe » (v0.7) : cahier au tableau, calcul posé, fractions en images,
// étiquettes à déplacer, instruments de géométrie, rituels du matin.
// Même format que outils.js : { id, nom, icone, couleur, desc, mount(el, ctx) -> cleanup }.
import { enLettres } from "./imprimer.js";
import { pieceHTML } from "./jeux.js";

const hasard = (n) => Math.floor(Math.random() * n);
const entre = (a, b) => a + hasard(b - a + 1);
const melange = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = hasard(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uidO = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const escO = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dateLongue = (d = new Date()) => { const s = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); return s.charAt(0).toUpperCase() + s.slice(1); };
const COULEURS_STYLO = [["#2448b8", "Bleu"], ["#d0342c", "Rouge"], ["#1f8a4c", "Vert"], ["#222", "Noir"]];

// =====================================================================
// Cahier au tableau : une page de cahier (Seyès, petits carreaux ou blanc)
// avec la date, un titre et du texte en cursive, plus un stylo pour écrire à la main.
// =====================================================================
function cahier(el, ctx) {
  const pages = ctx.cahier;
  if (!pages.length) pages.push({ id: uidO(), date: dateLongue(), titre: "", texte: "", papier: "seyes", ecriture: "cursive", dessin: "" });
  let i = 0, mode = "texte", couleur = COULEURS_STYLO[0][0], gomme = false, timer = null, ro = null;
  const P = () => pages[i];
  const sauver = () => { clearTimeout(timer); timer = setTimeout(() => ctx.saveCahier(), 500); };
  const render = () => {
    const p = P();
    el.innerHTML = `
      <div class="tool-top wrap">
        <div class="seg">${[["seyes", "Seyès"], ["carreaux", "Petits carreaux"], ["blanc", "Blanc"]].map(([k, v]) => `<button data-pap="${k}" class="${p.papier === k ? "on" : ""}">${v}</button>`).join("")}</div>
        <div class="seg">${[["cursive", "Cursive"], ["script", "Script"]].map(([k, v]) => `<button data-ecr="${k}" class="${p.ecriture === k ? "on" : ""}">${v}</button>`).join("")}</div>
        <div class="seg"><button data-mode="texte" class="${mode === "texte" ? "on" : ""}">⌨️ Taper</button><button data-mode="stylo" class="${mode === "stylo" ? "on" : ""}">✏️ Stylo</button></div>
        <div class="seg">${COULEURS_STYLO.map(([c, n]) => `<button data-col="${c}" class="${!gomme && couleur === c ? "on" : ""}" aria-label="${n}"><span class="dot" style="background:${c}"></span></button>`).join("")}<button data-gom="1" class="${gomme ? "on" : ""}" aria-label="Gomme">🧽</button></div>
        <span class="grow"></span>
        <button class="pill" id="prev" ${i ? "" : "disabled"} aria-label="Page précédente">‹</button><span class="muted">Page ${i + 1} / ${pages.length}</span><button class="pill" id="next" ${i < pages.length - 1 ? "" : "disabled"} aria-label="Page suivante">›</button>
        <button class="pill" id="new">+ Page</button><button class="pill" id="clr">Effacer le stylo</button><button class="pill" id="del">Supprimer la page</button>
      </div>
      <div class="cahier pap-${p.papier} ecr-${p.ecriture} ${mode === "stylo" ? "mode-stylo" : ""}" id="pg">
        <div class="cahier-txt">
          <div class="cahier-date" contenteditable="true" spellcheck="false" data-f="date">${escO(p.date)}</div>
          <div class="cahier-titre" contenteditable="true" spellcheck="false" data-f="titre" data-ph="Titre">${escO(p.titre)}</div>
          <div class="cahier-corps" contenteditable="true" spellcheck="false" data-f="texte" data-ph="Écris ici…">${escO(p.texte).replace(/\n/g, "<br>")}</div>
        </div>
        <canvas class="cahier-cv rc-board"></canvas>
      </div>
      <p class="muted center">Astuce : clique sur la date ou le titre pour les modifier. Le stylo écrit par-dessus la page (doigt, stylet ou souris).</p>`;
    const pg = el.querySelector("#pg"), cv = pg.querySelector("canvas"), g = cv.getContext("2d");
    const fit = () => {
      const r = pg.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      cv.width = r.width * dpr; cv.height = r.height * dpr; cv.style.width = r.width + "px"; cv.style.height = r.height + "px";
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = g.lineJoin = "round";
      if (P().dessin) { const im = new Image(); im.onload = () => g.drawImage(im, 0, 0, r.width, r.height); im.src = P().dessin; }
    };
    ro?.disconnect(); ro = new ResizeObserver(fit); ro.observe(pg);
    let last = null;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.onpointerdown = (e) => { if (mode !== "stylo") return; cv.setPointerCapture(e.pointerId); last = pos(e); };
    cv.onpointermove = (e) => {
      if (!last) return; if (e.pointerType === "mouse" && e.buttons === 0) { cv.onpointerup(); return; } const q = pos(e);
      g.globalCompositeOperation = gomme ? "destination-out" : "source-over";
      g.strokeStyle = couleur; g.lineWidth = gomme ? 24 : 3.5;
      g.beginPath(); g.moveTo(...last); g.lineTo(...q); g.stroke(); last = q;
    };
    cv.onpointerup = cv.onpointercancel = cv.onlostpointercapture = () => { if (!last) return; last = null; P().dessin = cv.toDataURL("image/png"); sauver(); };
  };
  el.oninput = (e) => {
    const f = e.target.closest("[data-f]")?.dataset.f; if (!f) return;
    const n = e.target.closest("[data-f]");
    P()[f] = f === "texte" ? n.innerText.replace(/\n$/, "") : n.innerText.trim();
    sauver();
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    const p = P();
    if (t.dataset.pap) p.papier = t.dataset.pap;
    if (t.dataset.ecr) p.ecriture = t.dataset.ecr;
    if (t.dataset.mode) mode = t.dataset.mode;
    if (t.dataset.col) { couleur = t.dataset.col; gomme = false; mode = "stylo"; }
    if (t.dataset.gom) { gomme = true; mode = "stylo"; }
    if (t.id === "prev" && i > 0) i--;
    if (t.id === "next" && i < pages.length - 1) i++;
    if (t.id === "new") { pages.push({ id: uidO(), date: dateLongue(), titre: "", texte: "", papier: p.papier, ecriture: p.ecriture, dessin: "" }); i = pages.length - 1; }
    if (t.id === "clr") p.dessin = "";
    if (t.id === "del" && confirm("Supprimer cette page ?")) { pages.splice(i, 1); if (!pages.length) pages.push({ id: uidO(), date: dateLongue(), titre: "", texte: "", papier: "seyes", ecriture: "cursive", dessin: "" }); i = Math.min(i, pages.length - 1); }
    sauver(); render();
  };
  render();
  return () => { ro?.disconnect(); clearTimeout(timer); ctx.saveCahier(); };
}

// =====================================================================
// Calcul posé au tableau : grille à carreaux, chiffres alignés, cases de retenues.
// On touche une case puis on tape le chiffre (clavier de l'outil ou du PC).
// =====================================================================
function calculPose(el) {
  let op = "+", a = 347, b = 285, nd = 3, corr = false, sel = null, rouge = false;
  let cells = {}; // "r,c" -> { v, rouge }
  const exemple = () => {
    const n = (k) => entre(10 ** (k - 1), 10 ** k - 1);
    if (op === "+") { a = n(nd); b = n(nd); }
    if (op === "−") { a = n(nd); b = n(nd); if (b > a) [a, b] = [b, a]; }
    if (op === "×") { a = n(nd); b = n(Math.min(2, nd)); }
    if (op === "÷") { b = entre(2, 9); a = n(Math.max(2, nd)); }
    cells = {}; corr = false; sel = null;
  };
  // Construit la disposition : liste de lignes { cls, cases: [{ t: "fixe"|"vide"|"ret"|"signe", v }] }
  const disposer = () => {
    const A = String(a), B = String(b);
    if (op === "+" || op === "−") {
      const r = String(op === "+" ? a + b : a - b), W = Math.max(A.length, B.length, r.length) + 1;
      const ligne = (s, kind) => Array.from({ length: W }, (_, c) => { const k = c - (W - s.length); return k >= 0 ? { t: kind, v: s[k] } : { t: "rien" }; });
      return { W, lignes: [
        { cls: "ret", cases: Array.from({ length: W }, (_, c) => (c > 0 ? { t: "ret" } : { t: "rien" })) },
        { cases: ligne(A, "fixe") },
        ...(op === "−" ? [{ cls: "ret", cases: Array.from({ length: W }, (_, c) => (c > 0 ? { t: "ret" } : { t: "rien" })) }] : []),
        { cases: ligne(B, "fixe").map((x, c) => (c === 0 ? { t: "signe", v: op } : x)), trait: true },
        { cases: ligne(r, "vide"), sol: r },
      ] };
    }
    if (op === "×") {
      const r = String(a * b), W = Math.max(A.length, B.length, r.length) + 1;
      const ligne = (s, kind, dec = 0) => Array.from({ length: W }, (_, c) => { const k = c - (W - dec - s.length); return k >= 0 && k < s.length ? { t: kind, v: s[k] } : c >= W - dec ? { t: "vide", v: "0", point: true } : { t: kind === "vide" ? "vide" : "rien" }; });
      const partiels = B.length > 1 ? [...B].reverse().map((d, k) => ({ cases: ligne(String(a * +d), "vide", k), sol: String(a * +d) + "0".repeat(k) })) : [];
      return { W, lignes: [
        { cls: "ret", cases: Array.from({ length: W }, (_, c) => (c > 0 ? { t: "ret" } : { t: "rien" })) },
        { cases: ligne(A, "fixe") },
        { cases: ligne(B, "fixe").map((x, c) => (c === 0 ? { t: "signe", v: "×" } : x)), trait: true },
        ...partiels.map((l, k) => (k === partiels.length - 1 ? { ...l, trait: true } : l)),
        { cases: ligne(r, "vide"), sol: r },
      ] };
    }
    // Division : potence. Dividende à gauche, diviseur et quotient à droite.
    const q = String(Math.floor(a / b)), reste = a % b, WL = A.length + 1, WR = Math.max(B.length, q.length) + 1, W = WL + WR;
    const lignes = [{ cases: [...Array.from({ length: WL }, (_, c) => (c < A.length ? { t: "fixe", v: A[c] } : { t: "rien" })), ...Array.from({ length: WR }, (_, c) => (c < B.length ? { t: "fixe", v: B[c], pot: c === 0 } : { t: "rien", pot: c === 0 }))], div: true }];
    lignes.push({ cases: [...Array.from({ length: WL }, () => ({ t: "vide" })), ...Array.from({ length: WR }, (_, c) => (c < q.length ? { t: "vide", sol: q[c], pot: c === 0, q: true } : { t: "rien", pot: c === 0 }))], quot: true });
    for (let k = 0; k < 2 * q.length; k++) lignes.push({ cases: [...Array.from({ length: WL }, () => ({ t: "vide" })), ...Array.from({ length: WR }, () => ({ t: "rien" }))] });
    return { W, lignes, q, reste };
  };
  const render = () => {
    const L = disposer();
    const solRow = (l) => (l.sol ? l.sol.padStart(L.W, " ") : null);
    el.innerHTML = `
      <div class="tool-top wrap">
        <div class="seg">${["+", "−", "×", "÷"].map((o) => `<button data-op="${o}" class="${o === op ? "on" : ""}">${o}</button>`).join("")}</div>
        <label class="inline">Nombres <input id="na" class="num-in" value="${a}" inputmode="numeric"> ${op} <input id="nb" class="num-in" value="${b}" inputmode="numeric"></label>
        <button class="pill" id="go">Poser</button>
        <label class="inline">Chiffres <select id="nd">${[2, 3, 4, 5].map((n) => `<option ${n === nd ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <button class="pill" id="rnd">🎲 Au hasard</button>
        <button class="pill ${corr ? "on" : ""}" id="corr">✔ Correction</button>
        <button class="pill" id="vider">Effacer mes chiffres</button>
      </div>
      <div class="cp-wrap rc-board"><div class="cp-grid ${op === "÷" ? "div" : ""}" style="--w:${L.W}">
        ${L.lignes.map((l, r) => `<div class="cp-row ${l.cls || ""} ${l.trait ? "trait" : ""} ${l.quot ? "quot" : ""}">${l.cases.map((x, c) => {
          const key = `${r},${c}`, u = cells[key];
          const sol = corr && !u ? (x.sol ?? (solRow(l)?.[c]?.trim() || (x.point ? "0" : ""))) : "";
          const cls = ["cp-c", x.t, x.pot ? "pot" : "", sel === key ? "sel" : "", u?.rouge ? "rouge" : "", sol ? "solution" : ""].join(" ");
          const txt = x.t === "fixe" || x.t === "signe" ? x.v : u ? u.v : sol;
          return `<span class="${cls}" ${x.t === "vide" || x.t === "ret" ? `data-cell="${key}"` : ""}>${escO(txt ?? "")}</span>`;
        }).join("")}</div>`).join("")}
      </div>${op === "÷" && corr ? `<p class="cp-res">${a} = (${b} × ${L.q}) + ${L.reste}</p>` : ""}</div>
      <div class="keypad cp-keys">${[7, 8, 9, 4, 5, 6, 1, 2, 3].map((n) => `<button data-k="${n}">${n}</button>`).join("")}<button data-k="del" aria-label="Effacer">⌫</button><button data-k="0">0</button><button data-k="rouge" class="${rouge ? "on" : ""}">Rouge</button></div>`;
  };
  const taper = (k) => {
    if (k === "rouge") { rouge = !rouge; return render(); }
    if (!sel) return;
    if (k === "del") delete cells[sel]; else cells[sel] = { v: k, rouge };
    if (k !== "del") { // case suivante : vers la gauche (on calcule de droite à gauche)
      const [r, c] = sel.split(",").map(Number);
      const prev = el.querySelector(`[data-cell="${r},${c - 1}"]`);
      if (prev && !el.querySelector(`[data-cell="${sel}"]`)?.classList.contains("ret")) sel = `${r},${c - 1}`;
    }
    render();
  };
  const onKey = (e) => {
    if (e.target.matches("input,select,textarea")) return;
    if (/^[0-9]$/.test(e.key)) { taper(e.key); e.preventDefault(); }
    else if (e.key === "Backspace" || e.key === "Delete") { taper("del"); e.preventDefault(); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!sel) return; const [r, c] = sel.split(",").map(Number);
      const [dr, dc] = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
      if (el.querySelector(`[data-cell="${r + dr},${c + dc}"]`)) { sel = `${r + dr},${c + dc}`; render(); }
      e.preventDefault();
    }
  };
  document.addEventListener("keydown", onKey);
  el.onclick = (e) => {
    const cell = e.target.closest("[data-cell]");
    if (cell) { sel = cell.dataset.cell; return render(); }
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.op) { op = t.dataset.op; exemple(); }
    if (t.id === "rnd") exemple();
    if (t.id === "go") {
      const na = parseInt(el.querySelector("#na").value, 10), nb = parseInt(el.querySelector("#nb").value, 10);
      if (na >= 0 && nb >= 0 && !(op === "÷" && nb === 0) && !(op === "−" && nb > na) && String(na).length <= 7 && String(nb).length <= 4) { a = na; b = nb; cells = {}; corr = false; sel = null; }
    }
    if (t.id === "corr") corr = !corr;
    if (t.id === "vider") cells = {};
    if (t.dataset.k) return taper(t.dataset.k);
    render();
  };
  el.onchange = (e) => { if (e.target.id === "nd") { nd = +e.target.value; exemple(); render(); } };
  render();
  return () => document.removeEventListener("keydown", onKey);
}

// =====================================================================
// Fractions en images : pizzas, tablettes de chocolat, bandes.
// =====================================================================
const FORMES = { pizza: "🍕 Pizza", tablette: "🍫 Tablette", bande: "📏 Bande" };
function formeSVG(forme, n, actives, idx = 0, taille = 220) {
  const on = (k) => actives.has(`${idx}:${k}`);
  if (forme === "pizza") {
    const R = 100;
    let s = `<svg viewBox="-110 -110 220 220" width="${taille}" height="${taille}" class="fr-svg"><circle r="106" fill="#e9b872"/>`;
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * 2 * Math.PI - Math.PI / 2, a1 = ((k + 1) / n) * 2 * Math.PI - Math.PI / 2;
      const p = n === 1 ? `<circle r="${R}"` : `<path d="M0 0 L${R * Math.cos(a0)} ${R * Math.sin(a0)} A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)} Z"`;
      s += `${p} class="fr-part ${on(k) ? "on" : ""}" data-part="${idx}:${k}" fill="${on(k) ? "#e5533d" : "#fbe3b0"}" stroke="#b9772e" stroke-width="2"/>`;
      if (on(k)) { const am = (a0 + a1) / 2; for (const rr of [0.45, 0.72]) s += `<circle cx="${rr * R * Math.cos(am)}" cy="${rr * R * Math.sin(am)}" r="${Math.min(9, 50 / n + 3)}" fill="#a3242a" pointer-events="none"/>`; }
    }
    return s + `</svg>`;
  }
  if (forme === "tablette") {
    // disposition en rangées et colonnes la plus « carrée » possible
    let rows = 1; for (let r = 1; r * r <= n; r++) if (n % r === 0) rows = r;
    const cols = n / rows, W = 200, H = Math.max(80, 200 * rows / cols), cw = W / cols, ch = H / rows;
    let s = `<svg viewBox="-6 -6 ${W + 12} ${H + 12}" width="${taille}" height="${taille * (H + 12) / (W + 12)}" class="fr-svg"><rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" rx="6" fill="#5a3418"/>`;
    for (let k = 0; k < n; k++) { const x = (k % cols) * cw, y = Math.floor(k / cols) * ch;
      s += `<rect x="${x + 2}" y="${y + 2}" width="${cw - 4}" height="${ch - 4}" rx="4" class="fr-part ${on(k) ? "on" : ""}" data-part="${idx}:${k}" fill="${on(k) ? "#8b4a22" : "#f3e6d8"}" stroke="#5a3418" stroke-width="1.5"/>`; }
    return s + `</svg>`;
  }
  const W = 300, H = 60, cw = W / n;
  let s = `<svg viewBox="-4 -4 ${W + 8} ${H + 8}" width="${taille * 1.4}" height="${taille * 1.4 * (H + 8) / (W + 8)}" class="fr-svg">`;
  for (let k = 0; k < n; k++) s += `<rect x="${k * cw}" y="0" width="${cw}" height="${H}" class="fr-part ${on(k) ? "on" : ""}" data-part="${idx}:${k}" fill="${on(k) ? "#7a6cf0" : "#fff"}" stroke="#3b3355" stroke-width="2"/>`;
  return s + `</svg>`;
}
const fracHTML = (k, n) => `<span class="frac"><span>${k}</span><span>${n}</span></span>`;
function fractionsImages(el) {
  let mode = "representer", forme = "pizza", n = 4, nb = 1, actives = new Set(), voir = true;
  let cmp = [{ n: 4, k: 3 }, { n: 8, k: 5 }], montreSigne = false, eq = { n: 2, k: 1, m: 2 };
  const ctlN = (id, v, max = 12) => `<label class="inline">${id === "n" ? "Parts" : ""}<select data-sel="${id}">${Array.from({ length: max - 1 }, (_, i) => i + 2).map((x) => `<option ${x === v ? "selected" : ""}>${x}</option>`).join("")}</select></label>`;
  const render = () => {
    let corps = "";
    if (mode === "representer") {
      const k = actives.size;
      const entier = Math.floor(k / n), resteK = k % n;
      corps = `
        <div class="fr-zone rc-board">${Array.from({ length: nb }, (_, i) => formeSVG(forme, n, actives, i)).join("")}</div>
        <div class="fr-big ${voir ? "" : "cache"}">${fracHTML(k, n)}${k > n && resteK ? ` = ${entier} + ${fracHTML(resteK, n)}` : k >= n && !resteK && k ? ` = ${entier}` : ""}</div>
        <p class="muted center">Touche les parts pour les colorier.</p>`;
    } else if (mode === "comparer") {
      const v = (f) => f.k / f.n, s = v(cmp[0]) < v(cmp[1]) ? "<" : v(cmp[0]) > v(cmp[1]) ? ">" : "=";
      const act = (f, i) => new Set(Array.from({ length: f.k }, (_, j) => `${i}:${j}`));
      corps = `<div class="fr-cmp">${cmp.map((f, i) => `<div class="fr-col">${formeSVG(forme, f.n, act(f, i), i, 200)}<div class="fr-big">${fracHTML(f.k, f.n)}</div>
          <div class="fr-ctl"><button class="mini" data-cmpk="${i}:-1">−</button><select data-cmpn="${i}">${Array.from({ length: 11 }, (_, j) => j + 2).map((x) => `<option ${x === f.n ? "selected" : ""}>${x}</option>`).join("")}</select><button class="mini" data-cmpk="${i}:1">+</button></div></div>${i === 0 ? `<div class="fr-sign">${montreSigne ? s : "?"}</div>` : ""}`).join("")}</div>
        <div class="pills"><button class="big-btn" id="signe">${montreSigne ? "Cacher" : "Montrer"} la réponse</button></div>`;
    } else {
      const f2 = { n: eq.n * eq.m, k: eq.k * eq.m };
      const act = (f, i) => new Set(Array.from({ length: f.k }, (_, j) => `${i}:${j}`));
      corps = `<div class="fr-eq">
          <div class="fr-row">${formeSVG(forme, eq.n, act(eq, 0), 0, 190)}<div class="fr-big">${fracHTML(eq.k, eq.n)}</div></div>
          <div class="fr-row">${formeSVG(forme, f2.n, act(f2, 1), 1, 190)}<div class="fr-big">${voir ? fracHTML(f2.k, f2.n) : "?"}</div></div>
          <p class="fr-txt">${voir ? `${fracHTML(eq.k, eq.n)} = ${fracHTML(f2.k, f2.n)} : chaque part a été coupée en ${eq.m}.` : "Les deux fractions représentent-elles la même quantité ?"}</p></div>
        <div class="tool-top wrap center-row"><label class="inline">Fraction <select data-eqk>${Array.from({ length: eq.n - 1 }, (_, j) => j + 1).map((x) => `<option ${x === eq.k ? "selected" : ""}>${x}</option>`).join("")}</select> / <select data-eqn>${[2, 3, 4, 5, 6].map((x) => `<option ${x === eq.n ? "selected" : ""}>${x}</option>`).join("")}</select></label>
          <label class="inline">Couper chaque part en <select data-eqm>${[2, 3, 4].map((x) => `<option ${x === eq.m ? "selected" : ""}>${x}</option>`).join("")}</select></label></div>`;
    }
    el.innerHTML = `
      <div class="tool-top wrap">
        <div class="seg">${[["representer", "Représenter"], ["comparer", "Comparer"], ["equiv", "Égales ?"]].map(([k, v]) => `<button data-mode="${k}" class="${mode === k ? "on" : ""}">${v}</button>`).join("")}</div>
        <div class="seg">${Object.entries(FORMES).map(([k, v]) => `<button data-forme="${k}" class="${forme === k ? "on" : ""}">${v}</button>`).join("")}</div>
        ${mode === "representer" ? `${ctlN("n", n)}<button class="pill" id="plus">+ une ${forme === "tablette" ? "tablette" : forme === "pizza" ? "pizza" : "bande"}</button>${nb > 1 ? `<button class="pill" id="moins">− une</button>` : ""}<button class="pill" id="raz">Tout effacer</button>` : ""}
        ${mode !== "comparer" ? `<button class="pill ${voir ? "on" : ""}" id="voir">${voir ? "Cacher" : "Montrer"} l'écriture</button>` : ""}
      </div>${corps}`;
  };
  el.onclick = (e) => {
    const part = e.target.closest("[data-part]");
    if (part && mode === "representer") { const k = part.dataset.part; actives.has(k) ? actives.delete(k) : actives.add(k); return render(); }
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.mode) mode = t.dataset.mode;
    if (t.dataset.forme) forme = t.dataset.forme;
    if (t.id === "plus" && nb < 4) nb++;
    if (t.id === "moins" && nb > 1) { nb--; actives = new Set([...actives].filter((k) => +k.split(":")[0] < nb)); }
    if (t.id === "raz") actives.clear();
    if (t.id === "voir") voir = !voir;
    if (t.id === "signe") montreSigne = !montreSigne;
    if (t.dataset.cmpk) { const [i, d] = t.dataset.cmpk.split(":").map(Number); cmp[i].k = Math.max(0, Math.min(cmp[i].n, cmp[i].k + d)); montreSigne = false; }
    render();
  };
  el.onchange = (e) => {
    const t = e.target;
    if (t.dataset.sel === "n") { n = +t.value; actives.clear(); }
    if (t.dataset.cmpn !== undefined) { const f = cmp[+t.dataset.cmpn]; f.n = +t.value; f.k = Math.min(f.k, f.n); montreSigne = false; }
    if (t.dataset.eqk !== undefined) eq.k = +t.value;
    if (t.dataset.eqn !== undefined) { eq.n = +t.value; eq.k = Math.min(eq.k, eq.n - 1); }
    if (t.dataset.eqm !== undefined) eq.m = +t.value;
    render();
  };
  render();
}

// =====================================================================
// Étiquettes à déplacer : phrases à trous avec propositions, ou mots à remettre dans l'ordre.
// On glisse une étiquette sur un trou, ou on touche l'étiquette puis le trou.
// =====================================================================
const ETQ_KEY = "bagaschool-etiquettes";
const ETQ_EXEMPLES = [
  { nom: "a / à", mode: "trous", texte: "Léo [a] un chien.\nIl va [à] l'école.\nElle [a] mal [à] la tête.", intrus: "" },
  { nom: "et / est", mode: "trous", texte: "Le ciel [est] bleu [et] le soleil brille.\nMa sœur [est] grande.\nJ'ai un stylo [et] une règle.", intrus: "" },
  { nom: "Les animaux", mode: "trous", texte: "La [vache] donne du lait.\nLe [chat] attrape la souris.\nL'[abeille] fait du miel.", intrus: "poule, lapin" },
  { nom: "Remettre dans l'ordre", mode: "ordre", texte: "Le petit chat boit du lait.\nLes élèves jouent dans la cour.", intrus: "" },
];
function etiquettes(el) {
  let sets; try { sets = JSON.parse(localStorage.getItem(ETQ_KEY)) || []; } catch { sets = []; }
  if (!sets.length) sets = ETQ_EXEMPLES.map((s) => ({ ...s, id: uidO() }));
  const garder = () => localStorage.setItem(ETQ_KEY, JSON.stringify(sets));
  let cur = 0, edition = false, choisie = null, verif = false, place = {}, banque = [], trous = [];
  const S = () => sets[cur];
  // Prépare la partie : liste des trous (réponses) et des étiquettes mélangées.
  const preparer = () => {
    const s = S(); trous = []; place = {}; choisie = null; verif = false;
    const lignes = s.texte.split("\n").map((l) => l.trim()).filter(Boolean);
    if (s.mode === "ordre") {
      lignes.forEach((l, li) => l.split(/\s+/).forEach((m) => trous.push({ li, rep: m })));
    } else {
      lignes.forEach((l, li) => { for (const m of l.matchAll(/\[([^\]]+)\]/g)) trous.push({ li, rep: m[1].trim() }); });
    }
    const intrus = (s.intrus || "").split(",").map((x) => x.trim()).filter(Boolean);
    banque = melange([...trous.map((t) => t.rep), ...intrus]).map((txt, k) => ({ k, txt }));
  };
  const utilisee = (k) => Object.values(place).includes(k);
  const ligneHTML = (l, li) => {
    const s = S();
    const slot = (ti) => {
      const k = place[ti], t = trous[ti];
      const etat = verif && k != null ? (banque[k].txt === t.rep ? "good" : "bad") : verif ? "bad" : "";
      return `<button class="etq-slot ${k != null ? "plein" : ""} ${etat}" data-slot="${ti}" aria-label="Case ${ti + 1}">${k != null ? escO(banque[k].txt) : "&nbsp;"}</button>`;
    };
    const ids = trous.map((t, ti) => [t, ti]).filter(([t]) => t.li === li).map(([, ti]) => ti);
    if (s.mode === "ordre") return ids.map(slot).join(" ");
    let n = 0;
    return escO(l).replace(/\[([^\]]+)\]/g, () => slot(ids[n++]));
  };
  const render = () => {
    const s = S();
    if (edition) {
      el.innerHTML = `
        <div class="tool-top wrap"><button class="pill" id="fin">✓ Terminé</button><button class="pill" id="suppr">Supprimer cette activité</button></div>
        <div class="card etq-edit">
          <label>Nom <input id="e-nom" value="${escO(s.nom)}"></label>
          <div class="seg"><button data-emode="trous" class="${s.mode === "trous" ? "on" : ""}">Phrases à trous</button><button data-emode="ordre" class="${s.mode === "ordre" ? "on" : ""}">Mots à remettre dans l'ordre</button></div>
          <label>Phrases (une par ligne)${s.mode === "trous" ? " : mets les mots à trouver entre crochets, par exemple <code>Le chat [mange] la souris.</code>" : " : les mots seront mélangés"}
            <textarea id="e-txt" rows="6">${escO(s.texte)}</textarea></label>
          ${s.mode === "trous" ? `<label>Étiquettes pièges (séparées par des virgules, facultatif) <input id="e-intrus" value="${escO(s.intrus)}"></label>` : ""}
        </div>`;
      return;
    }
    const lignes = s.texte.split("\n").map((l) => l.trim()).filter(Boolean);
    const juste = trous.length && trous.every((t, ti) => place[ti] != null && banque[place[ti]].txt === t.rep);
    el.innerHTML = `
      <div class="tool-top wrap">
        <select id="set">${sets.map((x, j) => `<option value="${j}" ${j === cur ? "selected" : ""}>${escO(x.nom)}</option>`).join("")}</select>
        <button class="pill" id="verif">Vérifier</button><button class="pill" id="sol">Solution</button><button class="pill" id="raz">Recommencer</button>
        <span class="grow"></span><button class="pill" id="edit">✏️ Modifier</button><button class="pill" id="nouv">+ Nouvelle activité</button>
      </div>
      <div class="etq-board rc-board">
        <div class="etq-lignes">${lignes.map((l, li) => `<p class="etq-ligne">${ligneHTML(l, li)}</p>`).join("")}</div>
        <div class="etq-banque">${banque.map((b) => utilisee(b.k) ? "" : `<button class="etq ${choisie === b.k ? "on" : ""}" data-etq="${b.k}">${escO(b.txt)}</button>`).join("")}</div>
        ${verif ? `<p class="etq-res ${juste ? "good" : "bad"}">${juste ? "Bravo, tout est juste !" : "Il reste des erreurs ou des cases vides."}</p>` : ""}
      </div>`;
  };
  const poser = (k, ti) => {
    for (const [t, kk] of Object.entries(place)) if (kk === k) delete place[t];
    place[ti] = k; choisie = null; verif = false;
  };
  // Glisser-déposer au doigt ou à la souris (pointer events), le toucher-toucher reste possible.
  let drag = null;
  el.onpointerdown = (e) => {
    const b = e.target.closest("[data-etq]"); if (!b || edition) return;
    drag = { k: +b.dataset.etq, x: e.clientX, y: e.clientY, ghost: null, src: b };
  };
  el.onpointermove = (e) => {
    if (!drag) return;
    if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
      drag.ghost = drag.src.cloneNode(true); drag.ghost.classList.add("etq-ghost"); document.body.appendChild(drag.ghost);
      drag.src.style.opacity = ".3";
    }
    if (drag.ghost) { e.preventDefault(); drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px"; }
  };
  const finDrag = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.ghost) return;
    d.ghost.remove(); d.src.style.opacity = "";
    const cible = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-slot]");
    if (cible) poser(d.k, +cible.dataset.slot);
    el._dragFini = true; setTimeout(() => { el._dragFini = false; }, 0); render();
  };
  el.onpointerup = finDrag; el.onpointercancel = finDrag;
  el.onclick = (e) => {
    if (el._dragFini) { el._dragFini = false; return; }
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.etq != null) { const k = +t.dataset.etq; choisie = choisie === k ? null : k; return render(); }
    if (t.dataset.slot != null) {
      const ti = +t.dataset.slot;
      if (choisie != null) poser(choisie, ti); else if (place[ti] != null) { delete place[ti]; verif = false; }
      return render();
    }
    if (t.dataset.emode) { S().mode = t.dataset.emode; garder(); return render(); }
    if (t.id === "verif") verif = true;
    if (t.id === "sol") { place = {}; const libres = banque.map((b) => b.k); trous.forEach((tr, ti) => { const j = libres.findIndex((k) => banque[k].txt === tr.rep); if (j >= 0) place[ti] = libres.splice(j, 1)[0]; }); verif = true; }
    if (t.id === "raz") preparer();
    if (t.id === "edit") edition = true;
    if (t.id === "fin") { edition = false; garder(); preparer(); }
    if (t.id === "nouv") { sets.push({ id: uidO(), nom: "Nouvelle activité", mode: "trous", texte: "Le chat [mange] la souris.", intrus: "boit, dort" }); cur = sets.length - 1; edition = true; garder(); preparer(); }
    if (t.id === "suppr" && confirm("Supprimer cette activité ?")) { sets.splice(cur, 1); if (!sets.length) sets = ETQ_EXEMPLES.map((s) => ({ ...s, id: uidO() })); cur = 0; edition = false; garder(); preparer(); }
    render();
  };
  el.onchange = (e) => { if (e.target.id === "set") { cur = +e.target.value; preparer(); render(); } };
  el.oninput = (e) => {
    const s = S();
    if (e.target.id === "e-nom") s.nom = e.target.value;
    if (e.target.id === "e-txt") s.texte = e.target.value;
    if (e.target.id === "e-intrus") s.intrus = e.target.value;
    garder();
  };
  preparer(); render();
  return () => { drag?.ghost?.remove(); };
}

// =====================================================================
// Géométrie au tableau : règle, équerre, rapporteur et compas à déplacer et à faire tourner,
// stylo, trait à la règle, gomme. 1 cm affiché = U pixels (échelle « tableau »).
// =====================================================================
const U = 40;
function geometrie(el) {
  let outil = "main", couleur = COULEURS_STYLO[0][0], grille = "carreaux", traits = [], encours = null, act = null;
  const inst = {
    regle: { on: true, x: 120, y: 330, a: 0 },
    equerre: { on: false, x: 520, y: 320, a: 0 },
    rapporteur: { on: false, x: 380, y: 300, a: 0 },
    compas: { on: false, cx: 300, cy: 220, r: 3 * U, a: 0 },
  };
  const NOMS = { regle: "📏 Règle", equerre: "📐 Équerre", rapporteur: "◠ Rapporteur", compas: "⊹ Compas" };
  const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI;
  // Coordonnées locales -> tableau pour un instrument (translation + rotation).
  const versTableau = (o, px, py) => { const c = Math.cos(rad(o.a)), s = Math.sin(rad(o.a)); return [o.x + px * c - py * s, o.y + px * s + py * c]; };
  // Bords « à la règle » : un trait qui commence près d'un bord le suit.
  const bords = () => {
    const b = [];
    if (inst.regle.on) b.push([versTableau(inst.regle, 0, 0), versTableau(inst.regle, 15 * U, 0)]);
    if (inst.equerre.on) { const o = inst.equerre; b.push([versTableau(o, 0, 0), versTableau(o, 10 * U, 0)], [versTableau(o, 0, 0), versTableau(o, 0, -7 * U)]); }
    return b;
  };
  const projeter = (p, [a, b]) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; return [a[0] + t * dx, a[1] + t * dy, t]; };
  const bordProche = (p) => { for (const bd of bords()) { const [x, y, t] = projeter(p, bd); if (t > -0.02 && t < 1.02 && Math.hypot(x - p[0], y - p[1]) < 14) return bd; } return null; };

  const regleSVG = () => {
    let g = `<rect x="-10" y="0" width="${15 * U + 20}" height="${1.6 * U}" rx="4" class="gi-corps"/>`;
    for (let mm = 0; mm <= 150; mm++) { const x = mm * U / 10, h = mm % 10 === 0 ? 14 : mm % 5 === 0 ? 10 : 6; g += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" class="gi-grad"/>`; if (mm % 10 === 0) g += `<text x="${x}" y="27" class="gi-num">${mm / 10}</text>`; }
    return g + `<circle cx="${15 * U + 4}" cy="${1.2 * U}" r="11" class="gi-rot" data-rot="regle"/>`;
  };
  const equerreSVG = () => {
    let g = `<path d="M0 0 H${10 * U} L0 ${-7 * U} Z M${1.4 * U} ${-1.2 * U} V${-4.4 * U} L${5.6 * U} ${-1.2 * U} Z" fill-rule="evenodd" class="gi-corps"/>`;
    for (let mm = 0; mm <= 90; mm++) { const x = mm * U / 10, h = mm % 10 === 0 ? 12 : mm % 5 === 0 ? 8 : 5; g += `<line x1="${x}" y1="0" x2="${x}" y2="${-h}" class="gi-grad"/>`; if (mm % 10 === 0 && mm) g += `<text x="${x}" y="-16" class="gi-num">${mm / 10}</text>`; }
    for (let mm = 10; mm <= 60; mm += 10) g += `<text x="16" y="${-mm * U / 10 + 4}" class="gi-num">${mm / 10}</text>`;
    g += `<path d="M0 -14 H14 V0" class="gi-angle"/>`;
    return g + `<circle cx="${9.4 * U}" cy="-12" r="11" class="gi-rot" data-rot="equerre"/>`;
  };
  const rapporteurSVG = () => {
    const R = 6 * U;
    let g = `<path d="M${-R} 0 A${R} ${R} 0 0 1 ${R} 0 Z" class="gi-corps"/><circle r="4" class="gi-centre"/><line x1="${-R}" y1="0" x2="${R}" y2="0" class="gi-grad"/>`;
    for (let d = 0; d <= 180; d++) {
      const h = d % 10 === 0 ? 16 : d % 5 === 0 ? 11 : 6, c = Math.cos(rad(d)), s = -Math.sin(rad(d));
      g += `<line x1="${R * c}" y1="${R * s}" x2="${(R - h) * c}" y2="${(R - h) * s}" class="gi-grad"/>`;
      if (d % 10 === 0) { g += `<text x="${(R - 28) * c}" y="${(R - 28) * s + 4}" class="gi-num">${d}</text><text x="${(R - 46) * c}" y="${(R - 46) * s + 4}" class="gi-num2">${180 - d}</text>`; }
    }
    return g + `<circle cx="${R + 14}" cy="-6" r="11" class="gi-rot" data-rot="rapporteur"/>`;
  };
  const compasSVG = () => {
    const o = inst.compas, px = o.cx + o.r * Math.cos(rad(o.a)), py = o.cy + o.r * Math.sin(rad(o.a));
    const mx = (o.cx + px) / 2, my = (o.cy + py) / 2, nx = -(py - o.cy), ny = px - o.cx, L = Math.hypot(nx, ny) || 1;
    const hx = mx + nx / L * Math.max(60, 180 - o.r / 3), hy = my + ny / L * Math.max(60, 180 - o.r / 3);
    return `<g class="gi-compas">
      <line x1="${o.cx}" y1="${o.cy}" x2="${hx}" y2="${hy}" class="gi-jambe"/><line x1="${px}" y1="${py}" x2="${hx}" y2="${hy}" class="gi-jambe"/>
      <circle cx="${hx}" cy="${hy}" r="13" class="gi-tete" data-cmp="tout"/>
      <circle cx="${o.cx}" cy="${o.cy}" r="9" class="gi-pointe" data-cmp="pointe"/>
      <circle cx="${px}" cy="${py}" r="11" class="gi-mine" data-cmp="mine"/>
      <text x="${(o.cx + px) / 2}" y="${(o.cy + py) / 2 - 8}" class="gi-ecart">${(o.r / U).toFixed(1).replace(".", ",")} cm</text></g>`;
  };
  const traitSVG = (t, i) => t.k === "l" ? `<line x1="${t.p[0]}" y1="${t.p[1]}" x2="${t.p[2]}" y2="${t.p[3]}" stroke="${t.c}" class="gt" data-t="${i}"/>`
    : t.k === "a" ? `<path d="${t.d}" stroke="${t.c}" class="gt" data-t="${i}"/>`
    : `<polyline points="${t.p.join(" ")}" stroke="${t.c}" class="gt" data-t="${i}"/>`;
  const dessinTraits = () => traits.map(traitSVG).join("") + (encours ? traitSVG(encours, -1) : "");

  const render = () => {
    el.innerHTML = `
      <div class="tool-top wrap">
        <div class="seg">${[["main", "✋ Déplacer"], ["stylo", "✏️ Crayon"], ["trait", "📏 Trait"], ["gomme", "🧽 Gomme"]].map(([k, v]) => `<button data-outil="${k}" class="${outil === k ? "on" : ""}">${v}</button>`).join("")}</div>
        <div class="seg">${COULEURS_STYLO.map(([c, n]) => `<button data-col="${c}" class="${couleur === c ? "on" : ""}" aria-label="${n}"><span class="dot" style="background:${c}"></span></button>`).join("")}</div>
        <div class="seg">${Object.entries(NOMS).map(([k, v]) => `<button data-inst="${k}" class="${inst[k].on ? "on" : ""}">${v}</button>`).join("")}</div>
        <select id="grille"><option value="carreaux" ${grille === "carreaux" ? "selected" : ""}>Carreaux 1 cm</option><option value="points" ${grille === "points" ? "selected" : ""}>Points</option><option value="blanc" ${grille === "blanc" ? "selected" : ""}>Blanc</option></select>
        <button class="pill" id="annul">↶ Annuler</button><button class="pill" id="tout">Tout effacer</button>
      </div>
      <svg class="geo rc-board g-${outil}" id="geo">
        <defs><pattern id="gq" width="${U}" height="${U}" patternUnits="userSpaceOnUse"><path d="M${U} 0 H0 V${U}" class="gq"/></pattern>
          <pattern id="gp" width="${U}" height="${U}" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="2" class="gpt"/><circle cx="${U}" cy="0" r="2" class="gpt"/><circle cx="0" cy="${U}" r="2" class="gpt"/><circle cx="${U}" cy="${U}" r="2" class="gpt"/></pattern></defs>
        <rect width="100%" height="100%" fill="${grille === "carreaux" ? "url(#gq)" : grille === "points" ? "url(#gp)" : "#fff"}" class="gfond"/>
        <g id="gtraits">${dessinTraits()}</g>
        <g id="ginst">
          ${inst.rapporteur.on ? `<g transform="translate(${inst.rapporteur.x} ${inst.rapporteur.y}) rotate(${inst.rapporteur.a})" data-drag="rapporteur" class="gi">${rapporteurSVG()}</g>` : ""}
          ${inst.equerre.on ? `<g transform="translate(${inst.equerre.x} ${inst.equerre.y}) rotate(${inst.equerre.a})" data-drag="equerre" class="gi">${equerreSVG()}</g>` : ""}
          ${inst.regle.on ? `<g transform="translate(${inst.regle.x} ${inst.regle.y}) rotate(${inst.regle.a})" data-drag="regle" class="gi">${regleSVG()}</g>` : ""}
          ${inst.compas.on ? compasSVG() : ""}
        </g>
      </svg>
      <p class="muted center">${outil === "main" ? "Fais glisser un instrument pour le déplacer, la pastille ronde pour le faire tourner. Compas : la pointe se pose, la mine règle l'écartement." : outil === "trait" ? "Commence le trait le long d'un bord de la règle ou de l'équerre : il suivra le bord." : outil === "gomme" ? "Touche un trait pour l'effacer." : "Écris ou dessine librement. Pour tracer un cercle, fais tourner la mine du compas avec le crayon."}</p>`;
  };
  const svg = () => el.querySelector("#geo");
  const pt = (e) => { const r = svg().getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const redessiner = () => { const g = el.querySelector("#gtraits"); if (g) g.innerHTML = dessinTraits(); };
  const majInst = () => { // ne réécrit que le calque des instruments (garde le pointeur capturé sur le svg)
    const gi = el.querySelector("#ginst"); if (!gi) return;
    gi.innerHTML = `${inst.rapporteur.on ? `<g transform="translate(${inst.rapporteur.x} ${inst.rapporteur.y}) rotate(${inst.rapporteur.a})" data-drag="rapporteur" class="gi">${rapporteurSVG()}</g>` : ""}${inst.equerre.on ? `<g transform="translate(${inst.equerre.x} ${inst.equerre.y}) rotate(${inst.equerre.a})" data-drag="equerre" class="gi">${equerreSVG()}</g>` : ""}${inst.regle.on ? `<g transform="translate(${inst.regle.x} ${inst.regle.y}) rotate(${inst.regle.a})" data-drag="regle" class="gi">${regleSVG()}</g>` : ""}${inst.compas.on ? compasSVG() : ""}`;
  };
  el.onpointerdown = (e) => {
    const s = svg(); if (!s || !s.contains(e.target)) return;
    const p = pt(e);
    const cmp = e.target.closest("[data-cmp]"), rot = e.target.closest("[data-rot]"), drg = e.target.closest("[data-drag]");
    if (cmp) { // le compas répond toujours ; la mine trace si le crayon est actif
      const o = inst.compas;
      act = { k: "cmp", part: cmp.dataset.cmp, p0: p, o0: { ...o } };
      if (act.part === "mine" && outil === "stylo") act.arc = { a0: o.a, a1: o.a, c: couleur };
    } else if (outil === "main" && rot) act = { k: "rot", n: rot.dataset.rot };
    else if (outil === "main" && drg) { const o = inst[drg.dataset.drag]; act = { k: "drag", n: drg.dataset.drag, dx: p[0] - o.x, dy: p[1] - o.y }; }
    else if (outil === "stylo") { encours = { k: "p", c: couleur, p: [...p.map(Math.round)] }; act = { k: "stylo" }; }
    else if (outil === "trait") { const bd = bordProche(p); const q = bd ? projeter(p, bd) : p; encours = { k: "l", c: couleur, p: [q[0], q[1], q[0], q[1]] }; act = { k: "trait", bd }; }
    else if (outil === "gomme") { const t = e.target.closest("[data-t]"); if (t && +t.dataset.t >= 0) { traits.splice(+t.dataset.t, 1); redessiner(); } return; }
    else return;
    s.setPointerCapture(e.pointerId); e.preventDefault();
  };
  el.onpointermove = (e) => {
    if (!act) return;
    const p = pt(e);
    if (act.k === "drag") { const o = inst[act.n]; o.x = p[0] - act.dx; o.y = p[1] - act.dy; majInst(); }
    else if (act.k === "rot") { const o = inst[act.n]; let a = deg(Math.atan2(p[1] - o.y, p[0] - o.x)); if (act.n === "regle") a -= deg(Math.atan2(1.2 * U, 15 * U + 4)); if (act.n === "equerre") a -= deg(Math.atan2(-12, 9.4 * U)); if (act.n === "rapporteur") a -= deg(Math.atan2(-6, 6 * U + 14)); const snap = Math.round(a / 15) * 15; o.a = Math.abs(a - snap) < 2 ? snap : Math.round(a); majInst(); }
    else if (act.k === "cmp") {
      const o = inst.compas, dx = p[0] - act.p0[0], dy = p[1] - act.p0[1];
      if (act.part === "tout" || act.part === "pointe") { o.cx = act.o0.cx + dx; o.cy = act.o0.cy + dy; }
      else if (act.arc) { // tracé : rayon fixe, on suit l'angle (en continu, sans saut à ±180°)
        let a = deg(Math.atan2(p[1] - o.cy, p[0] - o.cx)); while (a - act.arc.a1 > 180) a -= 360; while (a - act.arc.a1 < -180) a += 360;
        act.arc.a1 = a; o.a = a;
        const a0 = Math.min(act.arc.a0, a), a1 = Math.max(act.arc.a0, a);
        if (a1 - a0 >= 359.5) encours = { k: "a", c: act.arc.c, d: `M${o.cx - o.r} ${o.cy} a${o.r} ${o.r} 0 1 0 ${2 * o.r} 0 a${o.r} ${o.r} 0 1 0 ${-2 * o.r} 0` };
        else { const P = (d) => [o.cx + o.r * Math.cos(rad(d)), o.cy + o.r * Math.sin(rad(d))], [x0, y0] = P(a0), [x1, y1] = P(a1); encours = { k: "a", c: act.arc.c, d: `M${x0.toFixed(1)} ${y0.toFixed(1)} A${o.r} ${o.r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}` }; }
        redessiner();
      } else { const r = Math.hypot(p[0] - o.cx, p[1] - o.cy); o.r = Math.max(U / 2, Math.round(r / (U / 10)) * (U / 10)); o.a = deg(Math.atan2(p[1] - o.cy, p[0] - o.cx)); }
      majInst();
    }
    else if (act.k === "stylo") { encours.p.push(Math.round(p[0]), Math.round(p[1])); redessiner(); }
    else if (act.k === "trait") { const q = act.bd ? projeter(p, act.bd) : p; encours.p[2] = q[0]; encours.p[3] = q[1]; redessiner(); }
  };
  const fin = () => { if (!act) return; if (encours && (encours.k !== "p" || encours.p.length > 2)) traits.push(encours); encours = null; act = null; redessiner(); };
  el.onpointerup = fin; el.onpointercancel = fin;
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.outil) outil = t.dataset.outil;
    if (t.dataset.col) { couleur = t.dataset.col; if (outil === "main" || outil === "gomme") outil = "stylo"; }
    if (t.dataset.inst) inst[t.dataset.inst].on = !inst[t.dataset.inst].on;
    if (t.id === "annul") traits.pop();
    if (t.id === "tout" && (!traits.length || confirm("Effacer tous les tracés ?"))) traits = [];
    render();
  };
  el.onchange = (e) => { if (e.target.id === "grille") { grille = e.target.value; render(); } };
  render();
}

// =====================================================================
// Rituels du matin : nombre du jour, enquête grammaticale, phrases à transformer.
// Contenus d'exemple rédigés pour l'outil (pas des textes officiels).
// =====================================================================
const NIVEAUX_R = ["CP", "CE1", "CE2", "CM1", "CM2"];
const MAX_NB = { CP: 100, CE1: 1000, CE2: 9999, CM1: 99999, CM2: 999999 };
const RANGS = ["unité", "dizaine", "centaine", "unité de mille", "dizaine de mille", "centaine de mille"];
const pluriel = (k, mot) => k > 1 ? mot.replace(/^(\S+)/, "$1s") : mot;
const fmtNb = (n) => n.toLocaleString("fr-FR").replace(/ | /g, " ");

function cartesNombre(n, niv) {
  const r = NIVEAUX_R.indexOf(niv), ch = String(n).split("").reverse().map(Number), cartes = [];
  const trad = enLettres(n, false);
  cartes.push(["En lettres", `<p class="rit-gros">${enLettres(n)}</p>${trad !== enLettres(n) ? `<p class="muted">Orthographe traditionnelle : ${trad}</p>` : ""}`]);
  const rangs = ch.map((c, i) => [c, i]).filter(([c]) => c).reverse();
  cartes.push(["Unités de numération", `<p>${rangs.map(([c, i]) => `${c} ${pluriel(c, RANGS[i])}`).join(", ") || "0 unité"}</p>`]);
  cartes.push(["Décomposition", `<p>${rangs.map(([c, i]) => fmtNb(c * 10 ** i)).join(" + ") || "0"}</p>${r >= 2 && rangs.length > 1 ? `<p>${rangs.map(([c, i]) => i ? `(${c} × ${fmtNb(10 ** i)})` : c).join(" + ")}</p>` : ""}`]);
  if (r >= 1 && n >= 10) cartes.push(["Combien de… ?", `<p>${fmtNb(Math.floor(n / 10))} ${pluriel(Math.floor(n / 10), "dizaine")}${n >= 100 ? `<br>${fmtNb(Math.floor(n / 100))} ${pluriel(Math.floor(n / 100), "centaine")}` : ""}${r >= 3 && n >= 1000 ? `<br>${fmtNb(Math.floor(n / 1000))} ${pluriel(Math.floor(n / 1000), "millier")}` : ""}</p>`]);
  const pas = [1, 10, 100, 1000].slice(0, r <= 0 ? 1 : r === 1 ? 2 : r === 2 ? 3 : 4).filter((p) => p <= Math.max(1, n));
  cartes.push(["Avant, après", pas.map((p) => `<p>${n - p >= 0 ? fmtNb(n - p) : "—"} ← <b>${fmtNb(n)}</b> → ${fmtNb(n + p)} <span class="muted">(${p === 1 ? "de 1 en 1" : `de ${fmtNb(p)} en ${fmtNb(p)}`})</span></p>`).join("")]);
  const enc = [10, 100, 1000].slice(0, r === 0 ? 1 : r === 1 ? 2 : 3).filter((p) => n >= p / 10 && p <= n * 10);
  const nomP = { 10: "à la dizaine", 100: "à la centaine", 1000: "au millier" };
  if (enc.length) cartes.push(["Encadrement", enc.map((p) => { const bas = n % p ? Math.floor(n / p) * p : n - p, haut = n % p ? Math.ceil(n / p) * p : n + p; return `<p>${fmtNb(Math.max(0, bas))} &lt; ${fmtNb(n)} &lt; ${fmtNb(haut)} <span class="muted">(${nomP[p]})</span></p>`; }).join("")]);
  cartes.push(["Pair ou impair ?", `<p class="rit-gros">${n % 2 ? "Impair" : "Pair"}</p><p class="muted">Son chiffre des unités est ${ch[0]}.</p>`]);
  cartes.push(["Double et moitié", `<p>Double : ${fmtNb(2 * n)}</p><p>Moitié : ${n % 2 === 0 ? fmtNb(n / 2) : r >= 3 ? (n / 2).toLocaleString("fr-FR") : "pas de moitié entière"}</p>`]);
  // Monnaie : le moins de billets et de pièces possible (euros entiers)
  let reste = n; const tas = [];
  for (const v of [500, 200, 100, 50, 20, 10, 5, 2, 1]) { const k = Math.floor(reste / v); if (k) { tas.push([v, k]); reste -= k * v; } }
  cartes.push(["En euros", `<div class="rit-monnaie">${tas.map(([v, k]) => `<span class="rit-m">${k <= 4 ? Array(k).fill(pieceHTML(v * 100, 'tabindex="-1"')).join("") : pieceHTML(v * 100, 'tabindex="-1"') + `<b>× ${k}</b>`}</span>`).join("")}</div>`]);
  // Droite graduée autour du nombre
  const u = 10 ** Math.max(0, String(n).length - 2), a0 = Math.floor(n / (10 * u)) * 10 * u, W = 520;
  let svg = `<svg viewBox="-20 0 ${W + 40} 70" class="rit-droite"><line x1="0" y1="30" x2="${W}" y2="30"/>`;
  for (let k = 0; k <= 10; k++) { const x = k * W / 10; svg += `<line x1="${x}" y1="${k % 5 ? 23 : 18}" x2="${x}" y2="${k % 5 ? 37 : 42}"/>`; if (k % 5 === 0) svg += `<text x="${x}" y="60">${fmtNb(a0 + k * u)}</text>`; }
  const xn = (n - a0) / (10 * u) * W;
  svg += `<path d="M${xn} 14 l-7 -10 h14 z" class="rit-fleche"/><text x="${xn}" y="10" class="rit-n"></text></svg>`;
  cartes.push(["Sur la droite graduée", svg]);
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

function rituels(el) {
  let niv = localStorage.getItem("bagaschool-rituel-niv") || "CE1", onglet = "nombre";
  let n = 0, vus = new Set(), cacheNb = false;
  let gi = 0, montreF = new Set(), montreN = new Set(), marques = {}, phrasePerso = "";
  let ti = 0, montreT = new Set();
  const tirerNb = () => { const m = MAX_NB[niv]; n = entre(niv === "CP" ? 1 : Math.ceil(m / 20), m); vus.clear(); };
  const ordreG = melange(PHRASES_G.map((_, k) => k));
  const listeT = () => TRANSFOS[["CM1", "CM2"].includes(niv) ? "c3" : "c2"];
  tirerNb(); ti = hasard(listeT().length);

  const vueNombre = () => {
    const cartes = cartesNombre(n, niv);
    return `<div class="tool-top wrap center-row">
        <label class="inline">Nombre <input type="number" id="nb" min="0" max="${MAX_NB[niv]}" value="${n}" class="rit-input"></label>
        <button class="pill" id="hasard">🎲 Au hasard</button><button class="pill" id="toutvoir">${vus.size === cartes.length ? "Tout cacher" : "Tout montrer"}</button>
        <button class="pill ${cacheNb ? "on" : ""}" id="cachenb">${cacheNb ? "Montrer" : "Cacher"} le nombre</button></div>
      <div class="rit-nb">${cacheNb ? "?" : fmtNb(n)}</div>
      <div class="rit-cartes">${cartes.map(([titre, corps], k) => `<button class="rit-carte ${vus.has(k) ? "vu" : ""}" data-carte="${k}" aria-label="${vus.has(k) ? "Cacher" : "Montrer"} : ${titre}"><span class="rit-titre">${titre}</span><span class="rit-corps">${vus.has(k) ? corps : "❓"}</span></button>`).join("")}</div>`;
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
  const render = () => {
    el.innerHTML = `
      <div class="tool-top wrap">
        <div class="seg">${[["nombre", "🔢 Nombre du jour"], ["grammaire", "🔍 Enquête grammaticale"], ["transfo", "🔁 Phrases à transformer"]].map(([k, v]) => `<button data-ong="${k}" class="${onglet === k ? "on" : ""}">${v}</button>`).join("")}</div>
        <span class="grow"></span>
        <div class="seg">${NIVEAUX_R.map((x) => `<button data-niv="${x}" class="${niv === x ? "on" : ""}">${x}</button>`).join("")}</div>
      </div>
      <div class="rituel">${onglet === "nombre" ? vueNombre() : onglet === "grammaire" ? vueGrammaire() : vueTransfo()}</div>`;
  };
  el.onclick = (e) => {
    const w = e.target.closest("[data-w]");
    if (w) { const k = +w.dataset.w; marques[k] = ((marques[k] || 0) + 1) % 4; return render(); }
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.ong) onglet = t.dataset.ong;
    if (t.dataset.niv) { niv = t.dataset.niv; localStorage.setItem("bagaschool-rituel-niv", niv); tirerNb(); montreF.clear(); montreN.clear(); ti = hasard(listeT().length); montreT.clear(); }
    if (t.dataset.carte != null) { const k = +t.dataset.carte; vus.has(k) ? vus.delete(k) : vus.add(k); }
    if (t.id === "hasard") tirerNb();
    if (t.id === "toutvoir") { const nc = cartesNombre(n, niv).length; vus = vus.size === nc ? new Set() : new Set(Array.from({ length: nc }, (_, k) => k)); }
    if (t.id === "cachenb") cacheNb = !cacheNb;
    if (t.id === "gsuiv") { gi++; montreF.clear(); montreN.clear(); marques = {}; }
    if (t.dataset.fct) montreF.has(t.dataset.fct) ? montreF.delete(t.dataset.fct) : montreF.add(t.dataset.fct);
    if (t.dataset.nat) montreN.has(t.dataset.nat) ? montreN.delete(t.dataset.nat) : montreN.add(t.dataset.nat);
    if (t.id === "gefface") { montreF.clear(); montreN.clear(); marques = {}; }
    if (t.id === "gcorpus") { phrasePerso = ""; marques = {}; }
    if (t.id === "tsuiv") { ti++; montreT.clear(); }
    if (t.dataset.tr != null) { const k = +t.dataset.tr; montreT.has(k) ? montreT.delete(k) : montreT.add(k); }
    if (t.id === "ttout") { const nc = listeT()[ti % listeT().length][1].length; montreT = montreT.size === nc ? new Set() : new Set(Array.from({ length: nc }, (_, k) => k)); }
    render();
  };
  el.onchange = (e) => {
    if (e.target.id === "nb") { const v = Math.max(0, Math.min(MAX_NB[niv], Math.floor(+e.target.value || 0))); n = v; vus.clear(); render(); }
    if (e.target.id === "gperso") { phrasePerso = e.target.value; marques = {}; render(); }
  };
  render();
}

export { cartesNombre as _cartesNombre };
export const OUTILS2 = [
  { id: "cahier", nom: "Cahier au tableau", icone: "📓", couleur: "#cfe6ff", desc: "Seyès, petits carreaux ou page blanche", mount: cahier },
  { id: "rituels", nom: "Rituels du matin", icone: "☀️", couleur: "#ffe3a3", desc: "Nombre du jour, enquête grammaticale, transformations", mount: rituels },
  { id: "pose", nom: "Calcul posé", icone: "➗", couleur: "#d7ccff", desc: "Les 4 opérations avec les retenues", mount: calculPose },
  { id: "fractions-img", nom: "Fractions en images", icone: "🍕", couleur: "#ffd0dc", desc: "Pizzas, tablettes : partager, comparer", mount: fractionsImages },
  { id: "etiquettes", nom: "Étiquettes à déplacer", icone: "🏷️", couleur: "#c9ecd4", desc: "Phrases à trous, mots à remettre en ordre", mount: etiquettes },
  { id: "geometrie", nom: "Géométrie", icone: "📐", couleur: "#ffd7bf", desc: "Règle, équerre, rapporteur, compas", mount: geometrie },
];
