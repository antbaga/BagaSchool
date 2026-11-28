// Boîte à outils « En classe » : outils à projeter ou à utiliser en direct.
// Chaque outil : { id, nom, icone, couleur, desc, mount(el, ctx) -> cleanup? }
// ctx = { eleves: [{id, prenom}], esc }

const rnd = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pad = (n) => String(n).padStart(2, "0");
// Date du jour et horloge : partagées avec les rituels du matin.
import { dateDuJour, horloge } from "./rituels.js";

let audio;
export function bip(freq = 880, dur = 0.25, when = 0) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = freq; o.type = "sine";
    g.gain.setValueAtTime(0.0001, audio.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.3, audio.currentTime + when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + when + dur);
    o.connect(g).connect(audio.destination); o.start(audio.currentTime + when); o.stop(audio.currentTime + when + dur + 0.05);
  } catch {}
}

// ---------- Minuteur ----------
function minuteur(el) {
  let total = 300, left = 300, timer = null, end = 0;
  el.innerHTML = `
    <div class="tool-center">
      <div class="ring-wrap"><svg viewBox="0 0 200 200" class="ring"><circle cx="100" cy="100" r="88" class="ring-bg"/><circle cx="100" cy="100" r="88" class="ring-fg" id="rf"/></svg>
        <div class="ring-time" id="rt"></div></div>
      <div class="pills">${[1, 2, 3, 5, 10, 15, 20].map((m) => `<button class="pill" data-m="${m}">${m} min</button>`).join("")}</div>
      <div class="pills"><button class="pill" data-add="-60">− 1 min</button><button class="pill" data-add="-10">− 10 s</button><button class="pill" data-add="10">+ 10 s</button><button class="pill" data-add="60">+ 1 min</button></div>
      <div class="pills"><button class="big-btn" id="go">▶ Démarrer</button><button class="big-btn soft" id="rs">↺</button></div>
    </div>`;
  const C = 2 * Math.PI * 88, rf = el.querySelector("#rf"), rt = el.querySelector("#rt"), go = el.querySelector("#go");
  rf.style.strokeDasharray = C;
  const draw = () => {
    const s = Math.max(0, Math.ceil(left));
    rt.textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`;
    rf.style.strokeDashoffset = C * (1 - (total ? left / total : 0));
    el.classList.toggle("warn", left > 0 && left <= 10);
    el.classList.toggle("done", left <= 0);
  };
  const stop = () => { clearInterval(timer); timer = null; go.textContent = "▶ Démarrer"; };
  const tick = () => {
    left = (end - Date.now()) / 1000;
    if (left <= 0) { left = 0; stop(); bip(660, .3); bip(880, .3, .35); bip(1100, .5, .7); }
    draw();
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.m) { stop(); total = left = +t.dataset.m * 60; }
    if (t.dataset.add) { const d = +t.dataset.add; left = Math.max(0, left + d); total = Math.max(total, left); if (timer) end += d * 1000; }
    if (t.id === "rs") { stop(); left = total; }
    if (t.id === "go") {
      if (timer) stop();
      else if (left > 0) { bip(0, 0.01); end = Date.now() + left * 1000; timer = setInterval(tick, 200); go.textContent = "⏸ Pause"; }
    }
    draw();
  };
  draw();
  return () => clearInterval(timer);
}

// ---------- Tirage au sort ----------
function namesFrom(ctx, el) {
  if (ctx.eleves.length) return ctx.eleves.map((e) => e.prenom);
  return null;
}
function tirage(el, ctx) {
  let pool = namesFrom(ctx), drawn = [], anim;
  if (!pool) return noPupils(el);
  let reste = [...pool];
  const render = () => {
    el.innerHTML = `
      <div class="tool-center">
        <div class="draw-name" id="nm">?</div>
        <div class="pills"><button class="big-btn" id="go">🎲 Tirer au sort</button></div>
        <label class="check"><input type="checkbox" id="rem" checked> Ne pas retirer deux fois le même élève</label>
        <p class="muted" id="info"></p>
        <div class="chips-soft" id="hist"></div>
        <button class="pill" id="rs">Recommencer</button>
      </div>`;
    upd();
  };
  const upd = () => {
    el.querySelector("#info").textContent = el.querySelector("#rem").checked ? `${reste.length} élève(s) restant(s) sur ${pool.length}` : `${pool.length} élèves`;
    el.querySelector("#hist").innerHTML = drawn.map((n) => `<span>${ctx.esc(n)}</span>`).join("");
  };
  render();
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.id === "rs") { reste = [...pool]; drawn = []; el.querySelector("#nm").textContent = "?"; upd(); }
    if (t.id === "go") {
      const noRepeat = el.querySelector("#rem").checked;
      if (noRepeat && !reste.length) reste = [...pool];
      const src = noRepeat ? reste : pool;
      const pick = src[rnd(src.length)];
      const nm = el.querySelector("#nm"); let k = 0; t.disabled = true; clearInterval(anim);
      anim = setInterval(() => {
        nm.textContent = pool[rnd(pool.length)]; nm.classList.remove("pop"); bip(400 + k * 20, .04);
        if (++k > 14) {
          clearInterval(anim); nm.textContent = pick; nm.classList.add("pop"); bip(990, .3); t.disabled = false;
          if (noRepeat) reste.splice(reste.indexOf(pick), 1);
          drawn.unshift(pick); upd();
        }
      }, 70);
    }
  };
  el.onchange = upd;
  return () => clearInterval(anim);
}
function noPupils(el) {
  el.innerHTML = `<div class="tool-center"><div class="empty-big">👧🧒</div><p>Ajoute d'abord les prénoms de tes élèves dans <a href="#/classe">Mes élèves</a>.</p></div>`;
}

// ---------- Groupes ----------
function groupes(el, ctx) {
  const pool = namesFrom(ctx);
  if (!pool) return noPupils(el);
  let mode = "nb", n = Math.min(4, Math.max(2, Math.ceil(pool.length / 4)));
  const render = (groups = []) => {
    el.innerHTML = `
      <div class="tool-top">
        <div class="seg"><button class="${mode === "nb" ? "on" : ""}" data-mode="nb">Nombre de groupes</button><button class="${mode === "taille" ? "on" : ""}" data-mode="taille">Élèves par groupe</button></div>
        <div class="stepper"><button data-d="-1">−</button><span>${n}</span><button data-d="1">+</button></div>
        <button class="big-btn" id="go">🔀 Former les groupes</button>
      </div>
      <div class="groups">${groups.map((g, i) => `<div class="group g${i % 6}"><h3>Groupe ${i + 1}</h3>${g.map((p) => `<div>${ctx.esc(p)}</div>`).join("")}</div>`).join("")}</div>`;
  };
  const make = () => {
    const s = shuffle(pool);
    const k = mode === "nb" ? n : Math.max(1, Math.ceil(s.length / n));
    const g = Array.from({ length: k }, () => []);
    s.forEach((p, i) => g[i % k].push(p));
    return g;
  };
  let last = make(); render(last);
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.mode) { mode = t.dataset.mode; }
    if (t.dataset.d) n = Math.max(1, Math.min(pool.length, n + +t.dataset.d));
    if (t.id === "go" || t.dataset.mode || t.dataset.d) last = make();
    render(last);
  };
}

// ---------- Niveaux de voix ----------
export const VOIX = [
  { n: 0, t: "Silence", e: "🤫", c: "#8fb8f2" },
  { n: 1, t: "Je chuchote", e: "🙊", c: "#9fd8a8" },
  { n: 2, t: "Je parle doucement", e: "🙂", c: "#f8d26a" },
  { n: 3, t: "Je parle à la classe", e: "🗣️", c: "#f7a96b" },
  { n: 4, t: "Je peux parler fort", e: "📣", c: "#f08585" },
];
function voix(el) {
  let cur = 0;
  const render = () => {
    const v = VOIX[cur];
    el.innerHTML = `
      <div class="voice-wrap">
        <div class="voice-big" style="background:${v.c}"><div class="voice-emoji">${v.e}</div><div class="voice-n">${v.n}</div><div class="voice-t">${v.t}</div></div>
        <div class="voice-list">${VOIX.map((x, i) => `<button class="voice-item ${i === cur ? "on" : ""}" data-i="${i}" style="--c:${x.c}"><b>${x.n}</b> ${x.t}</button>`).join("")}</div>
      </div>`;
  };
  render();
  el.onclick = (e) => { const t = e.target.closest("[data-i]"); if (t) { cur = +t.dataset.i; render(); } };
}

// ---------- Feu tricolore ----------
function feu(el) {
  let cur = "vert";
  const L = { rouge: "On s'arrête et on écoute", orange: "On termine ce qu'on fait", vert: "On peut travailler" };
  const render = () => {
    el.innerHTML = `
      <div class="light-wrap">
        <div class="traffic">${Object.keys(L).map((k) => `<button class="lamp ${k} ${k === cur ? "on" : ""}" data-k="${k}" aria-label="${k}"></button>`).join("")}</div>
        <div class="light-label">${L[cur]}</div>
      </div>`;
  };
  render();
  el.onclick = (e) => { const t = e.target.closest("[data-k]"); if (t) { cur = t.dataset.k; render(); } };
}

// ---------- Dés ----------
const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
export const dieHTML = (v) => `<div class="die">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[v].includes(i + 1) ? "p" : ""}"></i>`).join("")}</div>`;
function des(el) {
  let n = 2, vals = [3, 5];
  const render = (rolling = false) => {
    el.innerHTML = `
      <div class="tool-center">
        <div class="dice ${rolling ? "rolling" : ""}">${vals.map(dieHTML).join("")}</div>
        ${n > 1 ? `<div class="dice-total">Total : <b>${vals.reduce((a, b) => a + b, 0)}</b></div>` : ""}
        <div class="pills"><button class="big-btn" id="go">🎲 Lancer</button></div>
        <div class="stepper"><button data-d="-1">−</button><span>${n} dé${n > 1 ? "s" : ""}</span><button data-d="1">+</button></div>
      </div>`;
  };
  render();
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.d) { n = Math.max(1, Math.min(6, n + +t.dataset.d)); vals = Array.from({ length: n }, (_, i) => vals[i] ?? 1 + rnd(6)); render(); }
    if (t.id === "go") { vals = vals.map(() => 1 + rnd(6)); render(true); bip(300, .08); bip(500, .08, .1); }
  };
}

// ---------- Calcul mental ----------
// Calcul mental par niveau : types d'exercices choisis pour chaque classe (exemples, pas une liste officielle).
const dec = (x) => (+x.toFixed(3)).toLocaleString("fr-FR");
const CM_TYPES = {
  comp10: ["Compléments à 10", () => { const a = rnd(11); return [`${a} + ? = 10`, 10 - a]; }],
  dbl10: ["Doubles", () => { const a = 1 + rnd(10); return [`Le double de ${a}`, 2 * a]; }],
  mo20: ["Moitiés", () => { const a = 2 * (1 + rnd(10)); return [`La moitié de ${a}`, a / 2]; }],
  add20: ["Additions jusqu'à 20", () => { const a = rnd(11), b = rnd(21 - a); return [`${a} + ${b}`, a + b]; }],
  sous10: ["Soustractions", () => { const a = rnd(11), b = rnd(a + 1); return [`${a} − ${b}`, a - b]; }],
  plus10: ["Ajouter ou enlever 10", () => { const a = 10 + rnd(80); return rnd(2) ? [`${a} + 10`, a + 10] : [`${a} − 10`, a - 10]; }],
  dbl50: ["Doubles", () => { const a = 1 + rnd(50); return [`Le double de ${a}`, 2 * a]; }],
  mo100: ["Moitiés", () => { const a = 2 * (1 + rnd(50)); return [`La moitié de ${a}`, a / 2]; }],
  compDiz: ["Compléments à la dizaine", () => { const a = 11 + rnd(88); const d = Math.ceil(a / 10) * 10 === a ? a + 10 : Math.ceil(a / 10) * 10; return [`${a} + ? = ${d}`, d - a]; }],
  add2: ["Additions à deux chiffres", () => { const a = 10 + rnd(60), b = 10 + rnd(90 - a); return [`${a} + ${b}`, a + b]; }],
  add2r: ["Additions à deux chiffres (avec retenue)", () => { const a = 15 + rnd(70), b = 10 + rnd(Math.max(1, 99 - a - 10)); return [`${a} + ${b}`, a + b]; }],
  sous2: ["Soustractions à deux chiffres", () => { const a = 20 + rnd(80), b = 10 + rnd(a - 9); return [`${a} − ${b}`, a - b]; }],
  t2510: ["Tables de 2, 5 et 10", () => { const t = [2, 5, 10][rnd(3)], b = 1 + rnd(10); return [`${t} × ${b}`, t * b]; }],
  tables: ["Tables de 2 à 9", () => { const a = 2 + rnd(8), b = 2 + rnd(8); return [`${a} × ${b}`, a * b]; }],
  tinv: ["Tables à l'envers", () => { const a = 2 + rnd(8), b = 2 + rnd(8); return [`${a * b} = ${a} × ?`, b]; }],
  comp100: ["Compléments à 100", () => { const a = 5 + rnd(90); return [`${a} + ? = 100`, 100 - a]; }],
  x10: ["× 10, × 100", () => { const a = 2 + rnd(98), m = rnd(2) ? 10 : 100; return [`${a} × ${m}`, a * m]; }],
  dblmo: ["Doubles et moitiés", () => { const a = 10 + rnd(240); return rnd(2) ? [`Le double de ${a}`, 2 * a] : [`La moitié de ${2 * a}`, a]; }],
  x1000: ["× et ÷ par 10, 100, 1 000", () => { const m = [10, 100, 1000][rnd(3)]; if (rnd(2)) { const a = 1 + rnd(99); return [`${a} × ${m.toLocaleString("fr-FR")}`, a * m]; } const r = 1 + rnd(99); return [`${(r * m).toLocaleString("fr-FR")} ÷ ${m.toLocaleString("fr-FR")}`, r]; }],
  comp1000: ["Compléments à 1 000", () => { const a = 10 * (1 + rnd(99)); return [`${a} + ? = 1 000`, 1000 - a]; }],
  x5: ["Multiplier par 5, 25, 50", () => { const m = [5, 25, 50][rnd(3)], a = 2 + rnd(m === 5 ? 98 : 18); return [`${a} × ${m}`, a * m]; }],
  decAdd: ["Additions de décimaux", () => { const a = (1 + rnd(49)) / 10, b = (1 + rnd(49)) / 10; return [`${dec(a)} + ${dec(b)}`, dec(a + b)]; }],
  comp1: ["Compléments à 1", () => { const a = (1 + rnd(99)) / 100; return [`${dec(a)} + ? = 1`, dec(1 - a)]; }],
  decX: ["Décimaux × et ÷ par 10, 100", () => { const a = (1 + rnd(999)) / 100, m = rnd(2) ? 10 : 100; return rnd(2) ? [`${dec(a)} × ${m}`, dec(a * m)] : [`${dec(a)} ÷ ${m}`, dec(a / m)]; }],
  dblmoDec: ["Doubles et moitiés (décimaux)", () => { const a = (1 + rnd(99)) / 10; return rnd(2) ? [`Le double de ${dec(a)}`, dec(2 * a)] : [`La moitié de ${dec(a)}`, dec(a / 2)]; }],
};
const CM_NIV = {
  CP: ["comp10", "dbl10", "mo20", "add20", "sous10", "plus10"],
  CE1: ["dbl50", "mo100", "compDiz", "add2", "sous2", "t2510", "plus10"],
  CE2: ["tables", "comp100", "add2r", "sous2", "x10", "dblmo"],
  CM1: ["tables", "tinv", "x1000", "comp1000", "x5", "decAdd"],
  CM2: ["tinv", "x1000", "comp1", "decX", "dblmoDec", "decAdd"],
};
function calcul(el) {
  const OPS = { "+": "Additions", "−": "Soustractions", "×": "Multiplications", "÷": "Divisions" };
  let ops = new Set(["+"]), max = 20, tables = [2, 3, 4, 5], q = null, show = false;
  let mode = localStorage.getItem("bagaschool-cm-mode") || "niveau", niv = localStorage.getItem("bagaschool-rituel-niv") || "CE1", types = new Set(CM_NIV[niv] || CM_NIV.CE1);
  // Affichage : un calcul à la fois (« un »), défilement chronométré (« defile »), tableau + chrono (« tableau »)
  let aff = localStorage.getItem("bagaschool-cm-aff") || "un", nb = +(localStorage.getItem("bagaschool-cm-nb") || 20), duree = +(localStorage.getItem("bagaschool-cm-duree") || 60);
  let serie = [], pos = -1, debut = 0, pause = 0, tick = null, fini = false, voirRep = false;
  if (!CM_NIV[niv]) niv = "CE1";
  const gen = () => {
    if (mode === "niveau") { const ks = [...types]; const k = ks[rnd(ks.length)]; const [txt, r] = CM_TYPES[k][1](); return { txt, r, k }; }
    const op = [...ops][rnd(ops.size)];
    let a, b, r;
    if (op === "+") { a = rnd(max + 1); b = rnd(max - a + 1); r = a + b; }
    if (op === "−") { a = rnd(max + 1); b = rnd(a + 1); r = a - b; }
    if (op === "×") { a = tables[rnd(tables.length)]; b = 1 + rnd(10); if (rnd(2)) [a, b] = [b, a]; r = a * b; }
    if (op === "÷") { b = tables[rnd(tables.length)]; r = 1 + rnd(10); a = b * r; }
    return { txt: `${a} ${op} ${b}`, r };
  };
  const fmtR = (r) => typeof r === "number" ? r.toLocaleString("fr-FR") : r;
  const ecrire = (q, show) => {
    const rep = `<span class="calc-r ${show ? "" : "hide"}">${show ? fmtR(q.r) : "?"}</span>`;
    if (q.txt.includes("?")) return q.txt.replace("?", rep);
    return q.txt.startsWith("L") ? `${q.txt} : ${rep}` : `${q.txt} = ${rep}`;
  };
  const question = () => q ? ecrire(q, show) : "Prêt ?";
  // ---- séries chronométrées ----
  const stop = () => { clearInterval(tick); tick = null; };
  const ecoule = () => (pause || performance.now()) - debut; // ms
  const lancer = () => { serie = Array.from({ length: nb }, gen); pos = 0; fini = false; voirRep = false; pause = 0; debut = performance.now(); stop(); tick = setInterval(avancer, 100); bip(660, .08); render(); };
  const finir = () => { stop(); fini = true; pos = -1; bip(523, .15); bip(392, .3, .18); render(); };
  const avancer = () => {
    if (pause) return;
    const t = ecoule(), tot = duree * 1000;
    if (t >= tot) return finir();
    if (aff === "defile") { const k = Math.floor(t / (tot / nb)); if (k !== pos) { pos = k; bip(880, .04); render(); return; } }
    const bar = el.querySelector(".cm-bar i"), txt = el.querySelector(".cm-temps");
    if (bar) bar.style.width = `${100 - (t / tot) * 100}%`;
    if (aff === "defile") { const it = el.querySelector(".cm-defile-bar i"), per = tot / nb; if (it) it.style.width = `${100 - ((t % per) / per) * 100}%`; }
    if (txt) txt.textContent = fmtT(Math.ceil((tot - t) / 1000));
  };
  const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const reglagesSerie = () => `<label class="inline">Calculs <select id="cmNb">${[5, 10, 15, 20, 30, 40].map((n) => `<option ${n === nb ? "selected" : ""}>${n}</option>`).join("")}</select></label>
    <label class="inline">Temps <select id="cmDuree">${[[30, "30 s"], [60, "1 min"], [90, "1 min 30"], [120, "2 min"], [180, "3 min"], [300, "5 min"], [600, "10 min"]].map(([v, l]) => `<option value="${v}" ${v === duree ? "selected" : ""}>${l}</option>`).join("")}</select></label>`;
  const centreSerie = () => {
    const tot = duree * 1000, reste = Math.max(0, Math.ceil((tot - ecoule()) / 1000));
    const corr = `<ol class="cm-liste ${voirRep ? "rep" : ""}">${serie.map((x) => `<li>${ecrire(x, voirRep)}</li>`).join("")}</ol>`;
    if (fini) return `<div class="cm-fin"><h3>⏰ Temps écoulé !</h3>${corr}<div class="pills"><button class="big-btn soft" id="cmRep">${voirRep ? "🙈 Cacher les réponses" : "👀 Correction"}</button><button class="big-btn" id="cmGo">↻ Nouvelle série</button></div></div>`;
    if (pos < 0) return `<div class="cm-pret"><p class="muted">${aff === "defile" ? `${nb} calculs défilent tout seuls, un toutes les ${(Math.round(duree / nb * 10) / 10).toLocaleString("fr-FR")} s. Les élèves écrivent les réponses sur leur ardoise ou leur cahier.` : `${nb} calculs affichés d'un coup, ${fmtT(duree)} pour tout faire.`}</p><button class="big-btn" id="cmGo">▶ Démarrer</button></div>`;
    const barre = `<div class="cm-chrono"><div class="cm-bar"><i style="width:${100 - (ecoule() / tot) * 100}%"></i></div><span class="cm-temps">${fmtT(reste)}</span><button class="pill" id="cmPause">${pause ? "▶ Reprendre" : "⏸ Pause"}</button><button class="pill" id="cmStop">⏹ Arrêter</button></div>`;
    if (aff === "defile") { const x = serie[pos]; return `${barre}<p class="muted">Calcul ${pos + 1} / ${nb}</p><div class="calc-q">${ecrire(x, false).replace(/<span class="calc-r hide">\?<\/span>/, "…")}</div><div class="cm-defile-bar"><i></i></div>`; }
    return `<div class="cm-tab-wrap">${barre}<ol class="cm-liste cm-grille">${serie.map((x) => `<li>${ecrire(x, false).replace(/<span class="calc-r hide">\?<\/span>/, '<span class="cm-trou"></span>')}</li>`).join("")}</ol></div>`;
  };
  const render = () => {
    el.innerHTML = `
      <div class="tool-top wrap">
        <div class="seg cm-aff">${[["un", "Un par un"], ["defile", "⏱️ Chrono (défilent)"], ["tableau", "📋 Tableau + chrono"]].map(([k, v]) => `<button data-aff="${k}" class="${aff === k ? "on" : ""}">${v}</button>`).join("")}</div>
        ${aff !== "un" ? reglagesSerie() : ""}
      </div>
      <div class="tool-top wrap">
        <div class="seg"><button data-mode="niveau" class="${mode === "niveau" ? "on" : ""}">Par niveau</button><button data-mode="libre" class="${mode === "libre" ? "on" : ""}">Libre</button></div>
        ${mode === "niveau" ? `
        <div class="seg">${Object.keys(CM_NIV).map((n) => `<button data-niv="${n}" class="${niv === n ? "on" : ""}">${n}</button>`).join("")}</div>
        <div class="tables">${CM_NIV[niv].map((k) => `<button class="mini ${types.has(k) ? "on" : ""}" data-ty="${k}">${CM_TYPES[k][0]}</button>`).join("")}</div>` : `
        <div class="seg">${Object.entries(OPS).map(([k, v]) => `<button class="${ops.has(k) ? "on" : ""}" data-op="${k}" title="${v}">${k}</button>`).join("")}</div>
        ${ops.has("+") || ops.has("−") ? `<label class="inline">Jusqu'à <select id="mx">${[10, 20, 50, 100, 1000].map((m) => `<option ${m === max ? "selected" : ""}>${m}</option>`).join("")}</select></label>` : ""}
        ${ops.has("×") || ops.has("÷") ? `<div class="tables">Tables : ${[2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => `<button class="mini ${tables.includes(t) ? "on" : ""}" data-t="${t}">${t}</button>`).join("")}</div>` : ""}`}
      </div>
      ${aff === "un" ? `<div class="tool-center">
        ${q && q.k ? `<p class="muted">${CM_TYPES[q.k][0]}</p>` : ""}
        <div class="calc-q">${question()}</div>
        <div class="pills"><button class="big-btn soft" id="sh" ${q ? "" : "disabled"}>👀 Réponse</button><button class="big-btn" id="nx">Suivant ➜</button></div>
      </div>` : `<div class="tool-center cm-serie cm-${aff}">${centreSerie()}</div>`}`;
  };
  render();
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.aff) { aff = t.dataset.aff; localStorage.setItem("bagaschool-cm-aff", aff); stop(); pos = -1; fini = false; return render(); }
    if (t.id === "cmGo") return lancer();
    if (t.id === "cmStop") return finir();
    if (t.id === "cmPause") { if (pause) { debut += performance.now() - pause; pause = 0; } else pause = performance.now(); return render(); }
    if (t.id === "cmRep") { voirRep = !voirRep; return render(); }
    if (tick && (t.dataset.mode || t.dataset.niv || t.dataset.ty || t.dataset.op || t.dataset.t)) { stop(); pos = -1; }
    if (t.dataset.mode) { mode = t.dataset.mode; localStorage.setItem("bagaschool-cm-mode", mode); q = null; }
    if (t.dataset.niv) { niv = t.dataset.niv; types = new Set(CM_NIV[niv]); q = null; }
    if (t.dataset.ty) { const k = t.dataset.ty; if (types.has(k)) { if (types.size > 1) types.delete(k); } else types.add(k); q = null; }
    if (t.dataset.op) { ops.has(t.dataset.op) && ops.size > 1 ? ops.delete(t.dataset.op) : ops.add(t.dataset.op); q = null; }
    if (t.dataset.t) { const v = +t.dataset.t; tables = tables.includes(v) ? (tables.length > 1 ? tables.filter((x) => x !== v) : tables) : [...tables, v]; }
    if (t.id === "sh") show = true;
    if (t.id === "nx") { q = gen(); show = false; }
    render();
  };
  el.onchange = (e) => {
    if (e.target.id === "mx") { max = +e.target.value; q = null; render(); }
    if (e.target.id === "cmNb") { nb = +e.target.value; localStorage.setItem("bagaschool-cm-nb", nb); stop(); pos = -1; fini = false; render(); }
    if (e.target.id === "cmDuree") { duree = +e.target.value; localStorage.setItem("bagaschool-cm-duree", duree); stop(); pos = -1; fini = false; render(); }
  };
  return stop;
}

// ---------- Cadre de dix ----------
function cadre(el) {
  let frames = 1, cells = Array(20).fill(0), color = 1, showCount = true;
  const render = () => {
    const count = cells.slice(0, frames * 10).filter(Boolean).length;
    el.innerHTML = `
      <div class="tool-top">
        <div class="seg"><button class="${frames === 1 ? "on" : ""}" data-f="1">1 cadre</button><button class="${frames === 2 ? "on" : ""}" data-f="2">2 cadres</button></div>
        <div class="seg"><button class="${color === 1 ? "on" : ""}" data-c="1"><span class="dot c1"></span> Rouge</button><button class="${color === 2 ? "on" : ""}" data-c="2"><span class="dot c2"></span> Bleu</button></div>
        <button class="pill" id="cnt">${showCount ? "Masquer" : "Afficher"} le nombre</button><button class="pill" id="clr">Vider</button>
      </div>
      <div class="tool-center">
        ${Array.from({ length: frames }, (_, f) => `<div class="tenframe">${cells.slice(f * 10, f * 10 + 10).map((v, i) => `<button class="cell" data-i="${f * 10 + i}">${v ? `<span class="dot c${v}"></span>` : ""}</button>`).join("")}</div>`).join("")}
        <div class="count-big">${showCount ? count : "?"}</div>
      </div>`;
  };
  render();
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.i) { const i = +t.dataset.i; cells[i] = cells[i] === color ? 0 : color; }
    if (t.dataset.f) frames = +t.dataset.f;
    if (t.dataset.c) color = +t.dataset.c;
    if (t.id === "cnt") showCount = !showCount;
    if (t.id === "clr") cells.fill(0);
    render();
  };
}

// ---------- Droite graduée ----------
function droite(el) {
  let from = 0, to = 10, step = 1, hidden = false, revealed = new Set(), marks = new Set();
  const render = () => {
    const n = Math.round((to - from) / step);
    const ok = n > 0 && n <= 40;
    const val = (i) => +(from + i * step).toFixed(3);
    el.innerHTML = `
      <div class="tool-top wrap">
        <label class="inline">De <input type="number" id="fr" value="${from}"></label>
        <label class="inline">à <input type="number" id="to" value="${to}"></label>
        <label class="inline">pas de <input type="number" id="st" value="${step}" step="any" min="0"></label>
        <button class="pill" id="hd">${hidden ? "Afficher" : "Masquer"} les nombres</button><button class="pill" id="clr">Effacer les repères</button>
      </div>
      <div class="tool-center">
        ${ok ? `<div class="nline" style="--n:${n}">
          <div class="nline-axis"></div>
          ${Array.from({ length: n + 1 }, (_, i) => {
            const v = val(i), show = !hidden || revealed.has(i);
            return `<button class="tick ${marks.has(i) ? "mark" : ""}" data-i="${i}" style="left:${(i / n) * 100}%"><span class="tick-line"></span><span class="tick-label">${show ? String(v).replace(".", ",") : "?"}</span></button>`;
          }).join("")}
        </div>
        <p class="muted">${hidden ? "Touche un « ? » pour faire apparaître le nombre." : "Touche une graduation pour la marquer."}</p>` : `<p>Choisis un intervalle avec 1 à 40 graduations.</p>`}
      </div>`;
  };
  render();
  el.onchange = (e) => {
    const v = parseFloat(e.target.value);
    if (isNaN(v)) return;
    if (e.target.id === "fr") from = v; if (e.target.id === "to") to = v; if (e.target.id === "st" && v > 0) step = v;
    revealed.clear(); marks.clear(); render();
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.i) { const i = +t.dataset.i; if (hidden && !revealed.has(i)) revealed.add(i); else marks.has(i) ? marks.delete(i) : marks.add(i); }
    if (t.id === "hd") { hidden = !hidden; revealed.clear(); }
    if (t.id === "clr") marks.clear();
    render();
  };
}

// ---------- Barres de fractions ----------
function fractions(el) {
  let dens = [1, 2, 3, 4, 6, 8], filled = new Set();
  const render = () => {
    el.innerHTML = `
      <div class="tool-top wrap"><div class="tables">Barres : ${[1, 2, 3, 4, 5, 6, 8, 10, 12].map((d) => `<button class="mini ${dens.includes(d) ? "on" : ""}" data-d="${d}">${d === 1 ? "1" : "1/" + d}</button>`).join("")}</div><button class="pill" id="clr">Effacer</button></div>
      <div class="fbars">${dens.map((d) => `<div class="fbar">${Array.from({ length: d }, (_, i) => `<button class="fseg f${d % 6} ${filled.has(d + ":" + i) ? "on" : ""}" data-s="${d}:${i}">${d === 1 ? "1" : `<sup>1</sup>⁄<sub>${d}</sub>`}</button>`).join("")}</div>`).join("")}</div>
      <p class="muted">Touche une part pour la colorier.</p>`;
  };
  render();
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.d) { const d = +t.dataset.d; dens = dens.includes(d) ? dens.filter((x) => x !== d) : [...dens, d].sort((a, b) => a - b); }
    if (t.dataset.s) filled.has(t.dataset.s) ? filled.delete(t.dataset.s) : filled.add(t.dataset.s);
    if (t.id === "clr") filled.clear();
    render();
  };
}

// ---------- Pendu ----------
function pendu(el) {
  let word = "", found = new Set(), wrong = new Set();
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  const MAX = 8;
  const setup = () => {
    el.innerHTML = `
      <div class="tool-center">
        <p>Tape le mot à faire deviner (les élèves ne le voient pas).</p>
        <form id="f" class="pills"><input type="password" id="w" class="word-input" autocomplete="off" placeholder="Mot secret" required><button class="big-btn">C'est parti</button></form>
      </div>`;
    el.querySelector("#f").onsubmit = (e) => { e.preventDefault(); word = el.querySelector("#w").value.trim(); if (word) { found.clear(); wrong.clear(); play(); } };
  };
  const parts = [
    '<line x1="10" y1="140" x2="110" y2="140"/>', '<line x1="30" y1="140" x2="30" y2="10"/>', '<line x1="30" y1="10" x2="90" y2="10"/>',
    '<line x1="90" y1="10" x2="90" y2="30"/>', '<circle cx="90" cy="42" r="12"/>', '<line x1="90" y1="54" x2="90" y2="95"/>',
    '<line x1="90" y1="65" x2="72" y2="82"/><line x1="90" y1="65" x2="108" y2="82"/>', '<line x1="90" y1="95" x2="75" y2="120"/><line x1="90" y1="95" x2="105" y2="120"/>',
  ];
  const play = () => {
    const W = norm(word);
    const letters = [...W].map((c, i) => /[A-Z]/.test(c) ? (found.has(c) ? word[i].toUpperCase() : "") : c);
    const win = [...W].every((c) => !/[A-Z]/.test(c) || found.has(c));
    const lose = wrong.size >= MAX;
    el.innerHTML = `
      <div class="hang">
        <svg viewBox="0 0 120 150" class="gallows">${parts.slice(0, wrong.size).join("")}</svg>
        <div class="hang-main">
          <div class="slots">${[...W].map((c, i) => /[A-Z]/.test(c) ? `<span class="slot-l ${lose && !found.has(c) ? "miss" : ""}">${lose ? word[i].toUpperCase() : letters[i]}</span>` : `<span class="slot-sp">${c === " " ? "&nbsp;" : c}</span>`).join("")}</div>
          ${win ? `<div class="banner ok">Bravo ! 🎉</div>` : lose ? `<div class="banner ko">Perdu… le mot était affiché.</div>` : `<p class="muted">Erreurs : ${wrong.size} / ${MAX}</p>`}
          <div class="keys rc-keep">${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((k) => `<button class="key ${found.has(k) ? "good" : wrong.has(k) ? "bad" : ""}" data-k="${k}" ${found.has(k) || wrong.has(k) || win || lose ? "disabled" : ""}>${k}</button>`).join("")}</div>
          <button class="pill" id="new">Nouveau mot</button>
        </div>
      </div>`;
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.k) { const k = t.dataset.k; norm(word).includes(k) ? found.add(k) : wrong.add(k); play(); }
    if (t.id === "new") setup();
  };
  setup();
}

// ---------- Ardoise ----------
function ardoise(el) {
  let color = "#2b2b2b", size = 4, paper = "blanc", erase = false;
  el.innerHTML = `
    <div class="tool-top wrap">
      <div class="seg">${["#2b2b2b", "#d64545", "#3a6fd8", "#2f9e5b", "#f0a020"].map((c) => `<button data-col="${c}" class="${c === color ? "on" : ""}"><span class="dot" style="background:${c}"></span></button>`).join("")}<button data-er="1">🧽 Gomme</button></div>
      <div class="seg">${[2, 4, 8, 14].map((s) => `<button data-sz="${s}" class="${s === size ? "on" : ""}"><span class="dot" style="width:${s + 4}px;height:${s + 4}px;background:#555"></span></button>`).join("")}</div>
      <div class="seg">${[["blanc", "Uni"], ["carreaux", "Carreaux"], ["seyes", "Seyès"]].map(([k, v]) => `<button data-pp="${k}" class="${k === paper ? "on" : ""}">${v}</button>`).join("")}</div>
      <button class="pill" id="clr">Tout effacer</button>
    </div>
    <div class="slate paper-${paper}" id="sl"><canvas id="cv"></canvas></div>`;
  const sl = el.querySelector("#sl"), cv = el.querySelector("#cv"), g = cv.getContext("2d");
  const fit = () => {
    const r = sl.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const img = cv.width ? g.getImageData(0, 0, cv.width, cv.height) : null;
    cv.width = r.width * dpr; cv.height = r.height * dpr; cv.style.width = r.width + "px"; cv.style.height = r.height + "px";
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.lineCap = g.lineJoin = "round";
    if (img) g.putImageData(img, 0, 0);
  };
  const ro = new ResizeObserver(fit); ro.observe(sl);
  let last = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.onpointerdown = (e) => { cv.setPointerCapture(e.pointerId); last = pos(e); };
  cv.onpointermove = (e) => {
    if (!last) return;
    if (e.pointerType === "mouse" && e.buttons === 0) { last = null; return; } // bouton relâché ailleurs
    const p = pos(e);
    g.globalCompositeOperation = erase ? "destination-out" : "source-over";
    g.strokeStyle = color; g.lineWidth = erase ? size * 5 : size;
    g.beginPath(); g.moveTo(...last); g.lineTo(...p); g.stroke(); last = p;
  };
  cv.onpointerup = cv.onpointercancel = cv.onlostpointercapture = () => { last = null; };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    const seg = t.parentElement;
    if (t.dataset.col) { color = t.dataset.col; erase = false; }
    if (t.dataset.er) erase = true;
    if (t.dataset.sz) size = +t.dataset.sz;
    if (t.dataset.pp) { paper = t.dataset.pp; sl.className = `slate paper-${paper}`; }
    if (t.id === "clr") g.clearRect(0, 0, cv.width, cv.height);
    if (seg.classList.contains("seg")) { seg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === t)); }
  };
  return () => ro.disconnect();
}

export const OUTILS = [
  { id: "minuteur", nom: "Minuteur", icone: "⏳", couleur: "#ffe3a3", desc: "Compte à rebours visuel", mount: minuteur },
  { id: "tirage", nom: "Tirage au sort", icone: "🎯", couleur: "#ffd0dc", desc: "Désigne un élève au hasard", mount: tirage },
  { id: "groupes", nom: "Groupes", icone: "🧩", couleur: "#d7ccff", desc: "Forme des groupes au hasard", mount: groupes },
  { id: "voix", nom: "Niveaux de voix", icone: "🔊", couleur: "#c9ecd4", desc: "Affiche le niveau sonore attendu", mount: voix },
  { id: "feu", nom: "Feu tricolore", icone: "🚦", couleur: "#ffd7bf", desc: "Rouge, orange, vert", mount: feu },
  { id: "date", nom: "Date du jour", icone: "📅", couleur: "#cfe6ff", desc: "En français et en anglais, à construire", mount: dateDuJour },
  { id: "des", nom: "Dés", icone: "🎲", couleur: "#ffe3a3", desc: "De 1 à 6 dés", mount: des },
  { id: "calcul", nom: "Calcul mental", icone: "🧮", couleur: "#cfe6ff", desc: "Par niveau, du CP au CM2", mount: calcul },
  { id: "horloge", nom: "Horloge", icone: "🕒", couleur: "#c9ecd4", desc: "Lire l'heure, placer les aiguilles, durées", mount: horloge },
  { id: "cadre", nom: "Cadre de dix", icone: "🔟", couleur: "#ffd7bf", desc: "Jetons à placer", mount: cadre },
  { id: "droite", nom: "Droite graduée", icone: "📏", couleur: "#d7ccff", desc: "Graduations, nombres cachés", mount: droite },
  { id: "fractions", nom: "Barres de fractions", icone: "🍫", couleur: "#ffd0dc", desc: "Comparer des fractions", mount: fractions },
  { id: "pendu", nom: "Le pendu", icone: "🔤", couleur: "#ffe3a3", desc: "Faire deviner un mot", mount: pendu },
  { id: "ardoise", nom: "Ardoise", icone: "✏️", couleur: "#c9ecd4", desc: "Dessiner, écrire sur Seyès", mount: ardoise },
];
