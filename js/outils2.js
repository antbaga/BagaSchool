// Outils « En classe » (v0.7) : cahier au tableau, calcul posé, fractions en images,
// instruments de géométrie, rituels du matin (les étiquettes sont dans francais.js).
// Même format que outils.js : { id, nom, icone, couleur, desc, mount(el, ctx) -> cleanup }.
import { rituels } from "./rituels.js";

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
// Calcul posé au tableau : page Seyès, un chiffre par carreau, cases de retenues.
// Plusieurs opérations côte à côte ; la barre du haut agit sur l'opération active.
// On touche une case puis on tape le chiffre (clavier de l'outil ou du PC). Retoucher une retenue la barre.
// « Sans carreaux » (CM) : mêmes colonnes, mais page blanche et lignes d'écriture sous la barre.
// Hauteurs de lignes en quarts de carreau (interlignes Seyès) : chiffres = 4, retenues = 2 ou 4.
// =====================================================================
function calculPose(el) {
  const MAX_OPS = 6, TAILLES = [["S", 44], ["M", 60], ["L", 76]];
  let nd = 3, corr = false, sel = null, rouge = false, act = 0, taille = 60, papier = "carreaux";
  const nouvelle = (op) => { const o = { op, a: 0, b: 0, cells: {} }; tirer(o); return o; };
  const tirer = (o) => {
    const n = (k) => entre(10 ** (k - 1), 10 ** k - 1);
    if (o.op === "+") { o.a = n(nd); o.b = n(nd); }
    if (o.op === "−") { o.a = n(nd); o.b = n(nd); if (o.b > o.a) [o.a, o.b] = [o.b, o.a]; }
    if (o.op === "×") { o.a = n(nd); o.b = n(Math.min(2, nd)); }
    if (o.op === "÷") { o.b = entre(2, 9); o.a = n(Math.max(2, nd)); }
    o.cells = {};
  };
  const ops = [{ op: "+", a: 347, b: 285, cells: {} }];
  // Disposition d'une opération : { W, lignes: [{ cls, h, trait, sol, cases: [{ t: "fixe"|"vide"|"ret"|"signe"|"rien", v }] }] }
  const disposer = ({ op, a, b }) => {
    const A = String(a), B = String(b);
    const retenues = (W) => ({ cls: "ret", cases: Array.from({ length: W }, (_, c) => (c > 0 ? { t: "ret" } : { t: "rien" })) });
    if (op === "+" || op === "−") {
      const r = String(op === "+" ? a + b : a - b), W = Math.max(A.length, B.length, r.length) + 1;
      const ligne = (s, kind) => Array.from({ length: W }, (_, c) => { const k = c - (W - s.length); return k >= 0 ? { t: kind, v: s[k] } : { t: "rien" }; });
      return { W, lignes: [
        retenues(W),
        { cases: ligne(A, "fixe") },
        ...(op === "−" ? [retenues(W)] : []),
        { cases: ligne(B, "fixe").map((x, c) => (c === 0 ? { t: "signe", v: op } : x)), trait: true },
        { cases: ligne(r, "vide"), sol: r },
      ] };
    }
    if (op === "×") {
      const r = String(a * b), W = Math.max(A.length, B.length, r.length) + 1;
      const ligne = (s, kind, dec = 0) => Array.from({ length: W }, (_, c) => { const k = c - (W - dec - s.length); return k >= 0 && k < s.length ? { t: kind, v: s[k] } : c >= W - dec ? { t: "vide", v: "0", point: true } : { t: kind === "vide" ? "vide" : "rien" }; });
      const partiels = B.length > 1 ? [...B].reverse().map((d, k) => ({ cases: ligne(String(a * +d), "vide", k), sol: String(a * +d) + "0".repeat(k) })) : [];
      // Une ligne de retenues par chiffre du multiplicateur (la plus proche du nombre = unités),
      // puis, si plusieurs lignes de produits, une ligne de retenues pour leur addition.
      return { W, lignes: [
        ...[...B].map(() => retenues(W)),
        { cases: ligne(A, "fixe") },
        { cases: ligne(B, "fixe").map((x, c) => (c === 0 ? { t: "signe", v: "×" } : x)), trait: true },
        ...(partiels.length ? [retenues(W)] : []),
        ...partiels.map((l, k) => (k === partiels.length - 1 ? { ...l, trait: true } : l)),
        { cases: ligne(r, "vide"), sol: r },
      ] };
    }
    // Division : potence. Dividende à gauche, diviseur et quotient à droite.
    const q = String(Math.floor(a / b)), reste = a % b, WL = A.length + 1, WR = Math.max(B.length, q.length) + 1, W = WL + WR;
    const lignes = [{ cases: [...Array.from({ length: WL }, (_, c) => (c < A.length ? { t: "fixe", v: A[c] } : { t: "rien" })), ...Array.from({ length: WR }, (_, c) => (c < B.length ? { t: "fixe", v: B[c], pot: c === 0 } : { t: "rien", pot: c === 0 }))], cls: "div" }];
    lignes.push({ cases: [...Array.from({ length: WL }, () => ({ t: "vide" })), ...Array.from({ length: WR }, (_, c) => (c < q.length ? { t: "vide", sol: q[c], pot: c === 0, q: true } : { t: "rien", pot: c === 0 }))] });
    for (let k = 0; k < 2 * q.length; k++) lignes.push({ cases: [...Array.from({ length: WL }, () => ({ t: "vide" })), ...Array.from({ length: WR }, () => ({ t: "rien" }))] });
    return { W, lignes, q, reste };
  };
  // Lignes de retenues : deux lignes consécutives se partagent un carreau (une par moitié),
  // une ligne seule prend un carreau entier, pour que les chiffres restent dans leurs carreaux.
  const caler = (L) => {
    for (let r = 0; r < L.lignes.length; ) {
      let k = 0; while (L.lignes[r + k]?.cls === "ret") k++;
      for (let j = 0; j < k; j++) L.lignes[r + j].h = k % 2 && j === k - 1 ? 4 : 2;
      r += k || 1;
    }
    return L;
  };
  const opHTML = (o, i) => {
    const L = caler(disposer(o)), quarts = L.lignes.reduce((s, l) => s + (l.h || 4), 0);
    const solRow = (l) => (l.sol ? l.sol.padStart(L.W, " ") : null);
    return `<div class="cp-op ${i === act && ops.length > 1 ? "act" : ""} ${o.op === "÷" ? "div" : ""}" data-op-i="${i}" style="--w:${L.W};padding-bottom:calc(var(--c) * ${(4 - (quarts % 4)) % 4} / 4)">
      ${ops.length > 1 ? `<button class="cp-x" data-suppr="${i}" aria-label="Retirer cette opération">✕</button>` : ""}
      ${L.lignes.map((l, r) => `<div class="cp-row ${l.cls || ""} ${l.h === 4 ? "plein" : ""} ${l.trait ? "trait" : ""} ${l.cls !== "ret" && l.cases.some((x) => x.t === "vide") ? "ecrire" : ""}">${l.cases.map((x, c) => {
        const key = `${i}|${r},${c}`, u = o.cells[`${r},${c}`];
        const sol = corr && !u ? (x.sol ?? (solRow(l)?.[c]?.trim() || (x.point ? "0" : ""))) : "";
        const cls = ["cp-c", x.t, x.pot ? "pot" : "", sel === key ? "sel" : "", u?.rouge ? "rouge" : "", u?.barre ? "barre" : "", sol ? "solution" : ""].join(" ");
        const txt = x.t === "fixe" || x.t === "signe" ? x.v : u ? u.v : sol;
        return `<span class="${cls}" ${x.t === "vide" || x.t === "ret" ? `data-cell="${key}"` : ""}>${escO(txt ?? "")}</span>`;
      }).join("")}</div>`).join("")}
      ${o.op === "÷" && corr ? `<p class="cp-res">${o.a} = (${o.b} × ${L.q}) + ${L.reste}</p>` : ""}
    </div>`;
  };
  const render = () => {
    const o = ops[act];
    el.innerHTML = `
      <div class="tool-top wrap">
        <div class="seg">${["+", "−", "×", "÷"].map((x) => `<button data-op="${x}" class="${x === o.op ? "on" : ""}">${x}</button>`).join("")}</div>
        <label class="inline cp-mien">Mon calcul : <input id="na" class="num-in" value="${o.a}" inputmode="numeric" aria-label="Premier nombre"> ${o.op} <input id="nb" class="num-in" value="${o.b}" inputmode="numeric" aria-label="Deuxième nombre"></label>
        <button class="pill" id="go">Poser</button>
        <label class="inline">Chiffres <select id="nd">${[2, 3, 4, 5].map((n) => `<option ${n === nd ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <button class="pill" id="rnd">🎲 Au hasard</button>
        <button class="pill" id="ajout" ${ops.length >= MAX_OPS ? "disabled" : ""}>＋ Opération</button>
        <button class="pill ${corr ? "on" : ""}" id="corr">✔ Correction</button>
        <button class="pill" id="vider">Effacer mes chiffres</button>
        <div class="seg">${[["carreaux", "Carreaux"], ["lignes", "Sans carreaux"]].map(([k, v]) => `<button data-papier="${k}" class="${k === papier ? "on" : ""}">${v}</button>`).join("")}</div>
        <div class="seg">${TAILLES.map(([n, px]) => `<button data-taille="${px}" class="${px === taille ? "on" : ""}" aria-label="Taille des carreaux ${n}">${n}</button>`).join("")}</div>
      </div>
      <div class="cp-page ${papier} rc-board" style="--c:${taille}px">${ops.map(opHTML).join("")}</div>
      <div class="keypad cp-keys">${[7, 8, 9, 4, 5, 6, 1, 2, 3].map((n) => `<button data-k="${n}">${n}</button>`).join("")}<button data-k="del" aria-label="Effacer">⌫</button><button data-k="0">0</button><button data-k="rouge" class="${rouge ? "on" : ""}">Rouge</button><button data-k="barre" class="cp-barrer">Barrer</button></div>`;
  };
  const parse = (key) => { const [i, rc] = key.split("|"); const [r, c] = rc.split(",").map(Number); return { i: +i, r, c, rc }; };
  const taper = (k) => {
    if (k === "rouge") { rouge = !rouge; return render(); }
    if (!sel) return;
    const { i, r, c, rc } = parse(sel), o = ops[i];
    if (k === "barre") { if (o.cells[rc]) o.cells[rc].barre = !o.cells[rc].barre; return render(); } // retenue utilisée
    if (k === "del") delete o.cells[rc]; else o.cells[rc] = { v: k, rouge };
    if (k !== "del") { // case suivante : vers la gauche (on calcule de droite à gauche), sauf dans les retenues
      const prev = el.querySelector(`[data-cell="${i}|${r},${c - 1}"]`);
      if (prev && !el.querySelector(`[data-cell="${sel}"]`)?.classList.contains("ret")) sel = `${i}|${r},${c - 1}`;
    }
    render();
  };
  const onKey = (e) => {
    if (e.target.matches("#na,#nb") && e.key === "Enter") { el.querySelector("#go").click(); return; }
    if (e.target.matches("input,select,textarea")) return;
    if (/^[0-9]$/.test(e.key)) { taper(e.key); e.preventDefault(); }
    else if (e.key === "Backspace" || e.key === "Delete") { taper("del"); e.preventDefault(); }
    else if (e.key === "/" || e.key === "x") { taper("barre"); e.preventDefault(); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (!sel) return; const { i, r, c } = parse(sel);
      const [dr, dc] = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
      const k = `${i}|${r + dr},${c + dc}`;
      if (el.querySelector(`[data-cell="${k}"]`)) { sel = k; render(); }
      e.preventDefault();
    }
  };
  document.addEventListener("keydown", onKey);
  el.onclick = (e) => {
    const cell = e.target.closest("[data-cell]");
    if (cell) {
      // Retoucher une retenue déjà écrite la barre (ou la débarre) : geste naturel au stylet.
      if (sel === cell.dataset.cell && cell.classList.contains("ret") && cell.textContent.trim()) return taper("barre");
      sel = cell.dataset.cell; act = parse(sel).i; return render();
    }
    const t = e.target.closest("button");
    if (!t) { const opEl = e.target.closest("[data-op-i]"); if (opEl && +opEl.dataset.opI !== act) { act = +opEl.dataset.opI; render(); } return; }
    const o = ops[act];
    if (t.dataset.suppr) { ops.splice(+t.dataset.suppr, 1); act = Math.min(act, ops.length - 1); sel = null; }
    if (t.dataset.op) { o.op = t.dataset.op; tirer(o); sel = null; }
    if (t.dataset.taille) taille = +t.dataset.taille;
    if (t.dataset.papier) papier = t.dataset.papier;
    if (t.id === "rnd") { tirer(o); sel = null; }
    if (t.id === "ajout" && ops.length < MAX_OPS) { ops.push(nouvelle(o.op)); act = ops.length - 1; sel = null; }
    if (t.id === "go") {
      const na = parseInt(el.querySelector("#na").value, 10), nb = parseInt(el.querySelector("#nb").value, 10);
      if (na >= 0 && nb >= 0 && !(o.op === "÷" && nb === 0) && !(o.op === "−" && nb > na) && String(na).length <= 7 && String(nb).length <= 4) { o.a = na; o.b = nb; o.cells = {}; sel = null; }
    }
    if (t.id === "corr") corr = !corr;
    if (t.id === "vider") o.cells = {};
    if (t.dataset.k) return taper(t.dataset.k);
    render();
  };
  el.onchange = (e) => { if (e.target.id === "nd") { nd = +e.target.value; tirer(ops[act]); sel = null; render(); } };
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

export const OUTILS2 = [
  { id: "cahier", nom: "Cahier au tableau", icone: "📓", couleur: "#cfe6ff", desc: "Seyès, petits carreaux ou page blanche", mount: cahier },
  { id: "rituels", nom: "Rituels du matin", icone: "☀️", couleur: "#ffe3a3", desc: "Date, nombre du jour, mot du jour, horloge, grammaire", mount: rituels },
  { id: "pose", nom: "Calcul posé", icone: "➗", couleur: "#d7ccff", desc: "Les 4 opérations avec les retenues", mount: calculPose },
  { id: "fractions-img", nom: "Fractions en images", icone: "🍕", couleur: "#ffd0dc", desc: "Pizzas, tablettes : partager, comparer", mount: fractionsImages },
  { id: "geometrie", nom: "Géométrie", icone: "📐", couleur: "#ffd7bf", desc: "Règle, équerre, rapporteur, compas", mount: geometrie },
];
