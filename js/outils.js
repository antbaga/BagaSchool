// Boîte à outils « En classe » : outils à projeter ou à utiliser en direct.
// Chaque outil : { id, nom, icone, couleur, desc, mount(el, ctx) -> cleanup? }
// ctx = { eleves: [{id, prenom}], esc }

const rnd = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pad = (n) => String(n).padStart(2, "0");

let audio;
function bip(freq = 880, dur = 0.25, when = 0) {
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
  el.innerHTML = `<div class="tool-center"><div class="empty-big">👧🧒</div><p>Ajoute d'abord les prénoms de tes élèves dans <a href="#/classe">Ma classe</a>.</p></div>`;
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
const VOIX = [
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

// ---------- Date du jour ----------
function date(el) {
  const draw = () => {
    const d = new Date(), f = (x, o) => x.toLocaleDateString("fr-FR", o);
    const hier = new Date(d); hier.setDate(d.getDate() - 1);
    const dem = new Date(d); dem.setDate(d.getDate() + 1);
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    el.innerHTML = `
      <div class="tool-center date-tool">
        <div class="date-card">
          <div class="date-month">${cap(f(d, { month: "long" }))} ${d.getFullYear()}</div>
          <div class="date-num">${d.getDate()}</div>
          <div class="date-day">${cap(f(d, { weekday: "long" }))}</div>
        </div>
        <p class="date-sentence">Aujourd'hui, nous sommes ${f(d, { weekday: "long" })} ${d.getDate() === 1 ? "1er" : d.getDate()} ${f(d, { month: "long" })} ${d.getFullYear()}.</p>
        <div class="date-row"><span>Hier : <b>${f(hier, { weekday: "long" })}</b></span><span>Demain : <b>${f(dem, { weekday: "long" })}</b></span></div>
        <div class="date-clock">${pad(d.getHours())}:${pad(d.getMinutes())}</div>
      </div>`;
  };
  draw();
  const t = setInterval(draw, 15000);
  return () => clearInterval(t);
}

// ---------- Dés ----------
const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
const dieHTML = (v) => `<div class="die">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[v].includes(i + 1) ? "p" : ""}"></i>`).join("")}</div>`;
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
function calcul(el) {
  const OPS = { "+": "Additions", "−": "Soustractions", "×": "Multiplications", "÷": "Divisions" };
  let ops = new Set(["+"]), max = 20, tables = [2, 3, 4, 5], q = null, show = false;
  const gen = () => {
    const op = [...ops][rnd(ops.size)];
    let a, b, r;
    if (op === "+") { a = rnd(max + 1); b = rnd(max - a + 1); r = a + b; }
    if (op === "−") { a = rnd(max + 1); b = rnd(a + 1); r = a - b; }
    if (op === "×") { a = tables[rnd(tables.length)]; b = 1 + rnd(10); if (rnd(2)) [a, b] = [b, a]; r = a * b; }
    if (op === "÷") { b = tables[rnd(tables.length)]; r = 1 + rnd(10); a = b * r; }
    return { a, b, op, r };
  };
  const render = () => {
    el.innerHTML = `
      <div class="tool-top wrap">
        <div class="seg">${Object.entries(OPS).map(([k, v]) => `<button class="${ops.has(k) ? "on" : ""}" data-op="${k}" title="${v}">${k}</button>`).join("")}</div>
        ${ops.has("+") || ops.has("−") ? `<label class="inline">Jusqu'à <select id="mx">${[10, 20, 50, 100, 1000].map((m) => `<option ${m === max ? "selected" : ""}>${m}</option>`).join("")}</select></label>` : ""}
        ${ops.has("×") || ops.has("÷") ? `<div class="tables">Tables : ${[2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => `<button class="mini ${tables.includes(t) ? "on" : ""}" data-t="${t}">${t}</button>`).join("")}</div>` : ""}
      </div>
      <div class="tool-center">
        <div class="calc-q">${q ? `${q.a} ${q.op} ${q.b} = <span class="calc-r ${show ? "" : "hide"}">${show ? q.r : "?"}</span>` : "Prêt ?"}</div>
        <div class="pills"><button class="big-btn soft" id="sh" ${q ? "" : "disabled"}>👀 Réponse</button><button class="big-btn" id="nx">Suivant ➜</button></div>
      </div>`;
  };
  render();
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.op) { ops.has(t.dataset.op) && ops.size > 1 ? ops.delete(t.dataset.op) : ops.add(t.dataset.op); q = null; }
    if (t.dataset.t) { const v = +t.dataset.t; tables = tables.includes(v) ? (tables.length > 1 ? tables.filter((x) => x !== v) : tables) : [...tables, v]; }
    if (t.id === "sh") show = true;
    if (t.id === "nx") { q = gen(); show = false; }
    render();
  };
  el.onchange = (e) => { if (e.target.id === "mx") { max = +e.target.value; q = null; render(); } };
}

// ---------- Horloge ----------
function horloge(el) {
  let mins = (new Date().getHours() % 12) * 60 + new Date().getMinutes(), digital = true, drag = null;
  el.innerHTML = `
    <div class="clock-wrap">
      <svg viewBox="-110 -110 220 220" class="clock" id="ck">
        <circle r="104" class="clock-face"/>
        ${Array.from({ length: 60 }, (_, i) => { const a = i * 6 * Math.PI / 180, r1 = i % 5 ? 96 : 90; return `<line x1="${Math.sin(a) * r1}" y1="${-Math.cos(a) * r1}" x2="${Math.sin(a) * 100}" y2="${-Math.cos(a) * 100}" class="${i % 5 ? "tk" : "tk5"}"/>`; }).join("")}
        ${Array.from({ length: 12 }, (_, i) => { const a = (i + 1) * 30 * Math.PI / 180; return `<text x="${Math.sin(a) * 76}" y="${-Math.cos(a) * 76}" class="num">${i + 1}</text>`; }).join("")}
        <line id="hh" class="hand-h" x1="0" y1="0" x2="0" y2="-50"/>
        <line id="mh" class="hand-m" x1="0" y1="0" x2="0" y2="-80"/>
        <circle r="6" class="hub"/>
      </svg>
      <div class="clock-side">
        <div class="clock-digital" id="dg"></div>
        <p class="muted">Fais glisser la grande aiguille.</p>
        <div class="pills"><button class="pill" data-a="-60">− 1 h</button><button class="pill" data-a="-5">− 5 min</button><button class="pill" data-a="5">+ 5 min</button><button class="pill" data-a="60">+ 1 h</button></div>
        <div class="pills"><button class="pill" id="now">Heure actuelle</button><button class="pill" id="rand">Heure au hasard</button><button class="pill" id="dgt">Masquer l'heure</button></div>
      </div>
    </div>`;
  const hh = el.querySelector("#hh"), mh = el.querySelector("#mh"), dg = el.querySelector("#dg"), svg = el.querySelector("#ck");
  const draw = () => {
    mins = ((mins % 720) + 720) % 720;
    const m = mins % 60, h = Math.floor(mins / 60) || 12;
    mh.setAttribute("transform", `rotate(${m * 6})`);
    hh.setAttribute("transform", `rotate(${mins * 0.5})`);
    dg.textContent = digital ? `${h}:${pad(m)}` : "?:??";
    el.querySelector("#dgt").textContent = digital ? "Masquer l'heure" : "Afficher l'heure";
  };
  const angleMin = (e) => {
    const r = svg.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    return Math.round(((Math.atan2(x, -y) * 180 / Math.PI + 360) % 360) / 6) % 60;
  };
  svg.onpointerdown = (e) => { drag = true; svg.setPointerCapture(e.pointerId); move(e); };
  const move = (e) => {
    if (!drag) return;
    const nm = angleMin(e), old = mins % 60;
    let base = mins - old;
    if (old > 45 && nm < 15) base += 60; else if (old < 15 && nm > 45) base -= 60;
    mins = base + nm; draw();
  };
  svg.onpointermove = move;
  svg.onpointerup = svg.onpointercancel = () => { drag = false; };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.a) mins += +t.dataset.a;
    if (t.id === "now") { const d = new Date(); mins = (d.getHours() % 12) * 60 + d.getMinutes(); }
    if (t.id === "rand") mins = rnd(144) * 5;
    if (t.id === "dgt") digital = !digital;
    draw();
  };
  draw();
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
          <div class="keys">${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((k) => `<button class="key ${found.has(k) ? "good" : wrong.has(k) ? "bad" : ""}" data-k="${k}" ${found.has(k) || wrong.has(k) || win || lose ? "disabled" : ""}>${k}</button>`).join("")}</div>
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
    const p = pos(e);
    g.globalCompositeOperation = erase ? "destination-out" : "source-over";
    g.strokeStyle = color; g.lineWidth = erase ? size * 5 : size;
    g.beginPath(); g.moveTo(...last); g.lineTo(...p); g.stroke(); last = p;
  };
  cv.onpointerup = cv.onpointercancel = () => { last = null; };
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
  { id: "date", nom: "Date du jour", icone: "📅", couleur: "#cfe6ff", desc: "Date en grand et phrase du jour", mount: date },
  { id: "des", nom: "Dés", icone: "🎲", couleur: "#ffe3a3", desc: "De 1 à 6 dés", mount: des },
  { id: "calcul", nom: "Calcul mental", icone: "🧮", couleur: "#cfe6ff", desc: "Additions, soustractions, tables", mount: calcul },
  { id: "horloge", nom: "Horloge", icone: "🕒", couleur: "#c9ecd4", desc: "Lire l'heure, aiguilles à bouger", mount: horloge },
  { id: "cadre", nom: "Cadre de dix", icone: "🔟", couleur: "#ffd7bf", desc: "Jetons à placer", mount: cadre },
  { id: "droite", nom: "Droite graduée", icone: "📏", couleur: "#d7ccff", desc: "Graduations, nombres cachés", mount: droite },
  { id: "fractions", nom: "Barres de fractions", icone: "🍫", couleur: "#ffd0dc", desc: "Comparer des fractions", mount: fractions },
  { id: "pendu", nom: "Le pendu", icone: "🔤", couleur: "#ffe3a3", desc: "Faire deviner un mot", mount: pendu },
  { id: "ardoise", nom: "Ardoise", icone: "✏️", couleur: "#c9ecd4", desc: "Dessiner, écrire sur Seyès", mount: ardoise },
];
