// Barre d'outils du tableau : une petite vignette (🧰) en haut à droite de chaque outil projeté
// ouvre des fenêtres flottantes (feu, minuteur, chrono, bruit, voix, tirage, dés, heure).
// Les fenêtres se déplacent par leur barre de titre et s'agrandissent par le coin, au stylet de TBI,
// au doigt ou à la souris. Elles restent ouvertes (et le minuteur continue) quand on change d'outil.
import { bip, dieHTML, VOIX } from "./outils.js";

const CLE = "bagaschool-barre";
const hasard = (n) => Math.floor(Math.random() * n);
const pad = (n) => String(n).padStart(2, "0");
const escB = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let prefs = {};
try { prefs = JSON.parse(localStorage.getItem(CLE)) || {}; } catch {}
const sauverPrefs = () => { try { localStorage.setItem(CLE, JSON.stringify(prefs)); } catch {} };

// ---------- les petits outils ----------
// mount(corps, fen) -> fonction de nettoyage ; fen.alerte() fait clignoter la fenêtre.

function feu(el) {
  let cur = "vert";
  const L = { rouge: "On s'arrête et on écoute", orange: "On termine", vert: "On travaille" };
  const r = () => {
    el.innerHTML = `<div class="qt-feu">${Object.keys(L).map((k) => `<button class="qt-lampe ${k} ${k === cur ? "on" : ""}" data-k="${k}" aria-label="${k}"></button>`).join("")}</div>
      <div class="qt-legende">${L[cur]}</div>`;
  };
  r();
  el.onclick = (e) => { const t = e.target.closest("[data-k]"); if (t) { cur = t.dataset.k; r(); } };
}

function minuteur(el, fen) {
  let total = prefs.minuteur?.total ?? 300, left = total, timer = null, end = 0;
  const C = 2 * Math.PI * 44;
  el.innerHTML = `
    <div class="qt-anneau"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="qt-a-fond"/><circle cx="50" cy="50" r="44" class="qt-a-plein" style="stroke-dasharray:${C}"/></svg><div class="qt-temps"></div></div>
    <div class="qt-ligne">${[1, 2, 3, 5, 10, 15].map((m) => `<button class="qt-pt" data-m="${m}">${m}′</button>`).join("")}</div>
    <div class="qt-ligne"><button class="qt-pt" data-add="-60">−1 min</button><button class="qt-pt" data-add="60">+1 min</button></div>
    <div class="qt-ligne"><button class="qt-go" data-a="go"></button><button class="qt-pt" data-a="rs" aria-label="Recommencer">↺</button></div>`;
  const plein = el.querySelector(".qt-a-plein"), tps = el.querySelector(".qt-temps"), go = el.querySelector("[data-a=go]");
  const draw = () => {
    const s = Math.max(0, Math.ceil(left));
    tps.textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`;
    plein.style.strokeDashoffset = C * (1 - (total ? left / total : 0));
    el.classList.toggle("bientot", left > 0 && left <= 10);
    el.classList.toggle("fini", left <= 0);
    go.textContent = timer ? "⏸ Pause" : "▶ Démarrer";
  };
  const stop = () => { clearInterval(timer); timer = null; };
  const tick = () => {
    left = (end - Date.now()) / 1000;
    if (left <= 0) { left = 0; stop(); bip(660, .3); bip(880, .3, .35); bip(1100, .5, .7); fen.alerte(); }
    draw();
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.m) { stop(); total = left = +t.dataset.m * 60; prefs.minuteur = { ...prefs.minuteur, total }; sauverPrefs(); fen.calme(); }
    if (t.dataset.add) { const d = +t.dataset.add; left = Math.max(0, left + d); total = Math.max(total, left); if (timer) end += d * 1000; if (left > 0) fen.calme(); }
    if (t.dataset.a === "rs") { stop(); left = total; fen.calme(); }
    if (t.dataset.a === "go") {
      if (timer) stop();
      else { if (left <= 0) left = total; bip(0, 0.01); end = Date.now() + left * 1000; timer = setInterval(tick, 200); fen.calme(); }
    }
    draw();
  };
  draw();
  return () => clearInterval(timer);
}

function chrono(el) {
  let base = 0, debut = 0, raf = 0, tours = [];
  const ecoule = () => base + (debut ? performance.now() - debut : 0);
  const fmt = (ms) => { const t = Math.floor(ms / 100); return `${Math.floor(t / 600)}:${pad(Math.floor(t / 10) % 60)}<small>,${t % 10}</small>`; };
  el.innerHTML = `<div class="qt-chrono"></div>
    <div class="qt-ligne"><button class="qt-go" data-a="go"></button><button class="qt-pt" data-a="tour">🚩 Tour</button><button class="qt-pt" data-a="rs" aria-label="Remettre à zéro">↺</button></div>
    <ol class="qt-tours"></ol>`;
  const aff = el.querySelector(".qt-chrono"), go = el.querySelector("[data-a=go]"), lt = el.querySelector(".qt-tours");
  const draw = () => { aff.innerHTML = fmt(ecoule()); go.textContent = debut ? "⏸ Pause" : "▶ Démarrer"; lt.innerHTML = tours.map((t) => `<li>${fmt(t)}</li>`).join(""); };
  const boucle = () => { aff.innerHTML = fmt(ecoule()); raf = requestAnimationFrame(boucle); };
  el.onclick = (e) => {
    const a = e.target.closest("button")?.dataset.a; if (!a) return;
    if (a === "go") { if (debut) { base = ecoule(); debut = 0; cancelAnimationFrame(raf); } else { debut = performance.now(); boucle(); } }
    if (a === "tour" && ecoule() > 0) tours = [ecoule(), ...tours].slice(0, 5);
    if (a === "rs") { base = 0; tours = []; if (debut) debut = performance.now(); }
    draw();
  };
  draw();
  return () => cancelAnimationFrame(raf);
}

// Bruit de la classe : le micro de l'ordinateur mesure le volume sonore (rien n'est enregistré).
function bruit(el, fen) {
  let seuil = prefs.bruit?.seuil ?? 60, sonne = prefs.bruit?.sonne ?? false;
  let flux = null, ac = null, an = null, buf = null, raf = 0, niveau = 0, trop = 0, dernierBip = 0;
  const accueil = (msg = "") => {
    el.innerHTML = `<p class="qt-aide">Le micro de l'ordinateur mesure le bruit de la classe. Rien n'est enregistré.</p>
      ${msg ? `<p class="qt-aide qt-err">${msg}</p>` : ""}
      <div class="qt-ligne"><button class="qt-go" data-a="micro">🎤 Activer le micro</button></div>`;
  };
  const jauge = () => {
    el.innerHTML = `<div class="qt-visage">🙂</div>
      <div class="qt-jauge"><i></i><b style="left:${seuil}%"></b></div>
      <label class="qt-reglage">Seuil <input type="range" min="15" max="95" value="${seuil}" data-r="seuil"></label>
      <div class="qt-ligne"><button class="qt-pt ${sonne ? "on" : ""}" data-a="sonne">🔔 Sonner si trop fort</button></div>`;
  };
  const demarrer = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("absent");
      flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      ac = new (window.AudioContext || window.webkitAudioContext)();
      an = ac.createAnalyser(); an.fftSize = 1024; buf = new Float32Array(an.fftSize);
      ac.createMediaStreamSource(flux).connect(an);
      jauge(); boucle();
    } catch (err) {
      accueil(err?.name === "NotAllowedError" ? "Le micro a été refusé. Autorise-le dans le cadenas de la barre d'adresse, puis réessaie." : "Pas de micro disponible sur cet appareil.");
    }
  };
  const boucle = () => {
    an.getFloatTimeDomainData(buf);
    let s = 0; for (const v of buf) s += v * v;
    const db = 20 * Math.log10(Math.sqrt(s / buf.length) + 1e-8); // de -60 dB (calme) à 0 dB (saturation)
    const cible = Math.max(0, Math.min(100, (db + 60) * 100 / 60));
    niveau += (cible - niveau) * (cible > niveau ? 0.35 : 0.06); // monte vite, redescend doucement
    trop = niveau > seuil ? trop + 1 : Math.max(0, trop - 2);
    const etat = trop > 30 ? "rouge" : niveau > seuil * 0.8 ? "orange" : "vert";
    const j = el.querySelector(".qt-jauge i"), v = el.querySelector(".qt-visage");
    if (j) { j.style.width = niveau + "%"; j.className = etat; v.textContent = { vert: "🙂", orange: "😐", rouge: "🙉" }[etat]; el.dataset.etat = etat; }
    if (etat === "rouge" && sonne && performance.now() - dernierBip > 4000) { dernierBip = performance.now(); bip(520, .25); bip(390, .35, .3); }
    raf = requestAnimationFrame(boucle);
  };
  el.onclick = (e) => {
    const a = e.target.closest("button")?.dataset.a;
    if (a === "micro") demarrer();
    if (a === "sonne") { sonne = !sonne; prefs.bruit = { ...prefs.bruit, sonne }; sauverPrefs(); e.target.closest("button").classList.toggle("on", sonne); }
  };
  el.oninput = (e) => {
    if (e.target.dataset.r !== "seuil") return;
    seuil = +e.target.value; el.querySelector(".qt-jauge b").style.left = seuil + "%";
    prefs.bruit = { ...prefs.bruit, seuil }; sauverPrefs();
  };
  accueil();
  return () => { cancelAnimationFrame(raf); flux?.getTracks().forEach((t) => t.stop()); ac?.close().catch(() => {}); };
}

function voix(el) {
  let cur = 0;
  const r = () => {
    const v = VOIX[cur];
    el.innerHTML = `<div class="qt-voix" style="background:${v.c}"><span>${v.e}</span><b>${v.n}</b><em>${v.t}</em></div>
      <div class="qt-ligne">${VOIX.map((x, i) => `<button class="qt-pt qt-vn ${i === cur ? "on" : ""}" data-i="${i}" style="--c:${x.c}" aria-label="${x.t}">${x.n}</button>`).join("")}</div>`;
  };
  r();
  el.onclick = (e) => { const t = e.target.closest("[data-i]"); if (t) { cur = +t.dataset.i; r(); } };
}

// Tirage au sort : les élèves de « Ma classe » sans les absents de l'appel du jour, ou des numéros.
function tirage(el, fen, ctx) {
  let tires = [], anim = null, max = prefs.tirage?.max ?? 25, sansRepet = true;
  const noms = () => { const l = ctx().presents(); return l.length ? l : Array.from({ length: max }, (_, k) => String(k + 1)); };
  const parNumeros = () => !ctx().presents().length;
  const r = (nom = "?") => {
    const tous = noms(), reste = tous.filter((n) => !tires.includes(n));
    el.innerHTML = `<div class="qt-nom">${escB(nom)}</div>
      <div class="qt-ligne"><button class="qt-go" data-a="go">🎯 Tirer au sort</button></div>
      <div class="qt-ligne"><button class="qt-pt ${sansRepet ? "on" : ""}" data-a="repet">Sans répétition</button><button class="qt-pt" data-a="rs" aria-label="Recommencer">↺</button></div>
      ${parNumeros() ? `<div class="qt-ligne qt-aide">Numéros de 1 à <button class="qt-pt" data-a="moins">−</button><b>${max}</b><button class="qt-pt" data-a="plus">+</button></div>` : ""}
      <p class="qt-aide">${sansRepet ? `${reste.length} restant(s) sur ${tous.length}` : `${tous.length} au total`}${parNumeros() ? "" : ctx().absents ? ` · ${ctx().absents} absent(s) exclu(s)` : ""}</p>`;
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); const a = t?.dataset.a; if (!a) return;
    if (a === "repet") { sansRepet = !sansRepet; r(el.querySelector(".qt-nom").textContent); }
    if (a === "rs") { tires = []; r(); }
    if (a === "moins" || a === "plus") { max = Math.max(2, Math.min(60, max + (a === "plus" ? 1 : -1))); prefs.tirage = { max }; sauverPrefs(); tires = []; r(); }
    if (a === "go" && !anim) {
      const tous = noms(); let src = sansRepet ? tous.filter((n) => !tires.includes(n)) : tous;
      if (!src.length) { tires = []; src = tous; }
      const choix = src[hasard(src.length)], nm = el.querySelector(".qt-nom"); let k = 0;
      anim = setInterval(() => {
        nm.textContent = tous[hasard(tous.length)]; bip(400 + k * 20, .04);
        if (++k > 12) { clearInterval(anim); anim = null; if (sansRepet) tires.push(choix); r(choix); el.querySelector(".qt-nom").classList.add("pop"); bip(990, .3); }
      }, 70);
    }
  };
  r();
  return () => clearInterval(anim);
}

function des(el) {
  let vals = [1 + hasard(6), 1 + hasard(6)];
  const r = (lance = false) => {
    el.innerHTML = `<button class="qt-des ${lance ? "rolling" : ""}" data-a="go" aria-label="Lancer les dés">${vals.map(dieHTML).join("")}</button>
      ${vals.length > 1 ? `<div class="qt-aide">Total : <b>${vals.reduce((a, b) => a + b, 0)}</b></div>` : ""}
      <div class="qt-ligne"><button class="qt-pt" data-a="moins" aria-label="Un dé de moins">−</button><span>${vals.length} dé${vals.length > 1 ? "s" : ""}</span><button class="qt-pt" data-a="plus" aria-label="Un dé de plus">+</button><button class="qt-go" data-a="go">🎲 Lancer</button></div>`;
  };
  el.onclick = (e) => {
    const a = e.target.closest("button")?.dataset.a; if (!a) return;
    if (a === "moins" && vals.length > 1) vals.pop();
    if (a === "plus" && vals.length < 4) vals.push(1 + hasard(6));
    if (a === "go") { vals = vals.map(() => 1 + hasard(6)); bip(300, .08); bip(500, .08, .1); }
    r(a === "go");
  };
  r();
}

function heure(el) {
  const graduations = Array.from({ length: 60 }, (_, k) => { const a = k * Math.PI / 30, l = k % 5 ? 4 : 9; return `<line x1="${50 + 46 * Math.sin(a)}" y1="${50 - 46 * Math.cos(a)}" x2="${50 + (46 - l) * Math.sin(a)}" y2="${50 - (46 - l) * Math.cos(a)}" stroke-width="${k % 5 ? 0.8 : 2}"/>`; }).join("");
  const chiffres = Array.from({ length: 12 }, (_, k) => { const a = (k + 1) * Math.PI / 6; return `<text x="${50 + 31 * Math.sin(a)}" y="${50 - 31 * Math.cos(a) + 3.6}">${k + 1}</text>`; }).join("");
  el.innerHTML = `<svg class="qt-horloge" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48"/><g class="qt-grad">${graduations}</g><g class="qt-chif">${chiffres}</g>
    <line class="qt-h" x1="50" y1="50" x2="50" y2="27"/><line class="qt-m" x1="50" y1="50" x2="50" y2="14"/><line class="qt-s" x1="50" y1="56" x2="50" y2="12"/><circle cx="50" cy="50" r="2.4" class="qt-centre"/></svg>
    <div class="qt-num"></div>`;
  const tourne = (sel, deg) => el.querySelector(sel).setAttribute("transform", `rotate(${deg} 50 50)`);
  const maj = () => {
    const d = new Date(), s = d.getSeconds(), m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    tourne(".qt-h", h * 30); tourne(".qt-m", m * 6); tourne(".qt-s", s * 6);
    el.querySelector(".qt-num").textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  maj();
  const t = setInterval(maj, 1000);
  return () => clearInterval(t);
}

export const OUTILS_BARRE = [
  { id: "feu", nom: "Feu tricolore", ico: "🚦", mount: feu },
  { id: "minuteur", nom: "Minuteur", ico: "⏳", mount: minuteur },
  { id: "chrono", nom: "Chronomètre", ico: "⏱️", mount: chrono },
  { id: "bruit", nom: "Bruit de la classe", ico: "👂", mount: bruit },
  { id: "voix", nom: "Niveau de voix", ico: "🔊", mount: voix },
  { id: "tirage", nom: "Tirage au sort", ico: "🎯", mount: tirage },
  { id: "des", nom: "Dés", ico: "🎲", mount: des },
  { id: "heure", nom: "Heure", ico: "🕒", mount: heure },
];

// ---------- fenêtres flottantes ----------
// Le calque (position fixe) est rattaché au tableau affiché : il passe en plein écran avec lui.
let calque = null, menu = null, ancre = { right: innerWidth - 8, bottom: 70 }, ctxCourant = () => ({ presents: () => [], absents: 0 }), zHaut = 1;
const fenetres = new Map(); // id -> { win, fin }

const borner = (win, x, y) => {
  const w = win.offsetWidth, h = win.offsetHeight;
  return [Math.max(4, Math.min(innerWidth - w - 4, x)), Math.max(4, Math.min(innerHeight - h - 4, y))]; // toujours entière à l'écran
};
const placer = (win, x, y) => { [x, y] = borner(win, x, y); win.style.left = x + "px"; win.style.top = y + "px"; return [x, y]; };
const devant = (win) => { win.style.zIndex = ++zHaut; };

function ouvrirOutil(id) {
  const o = OUTILS_BARRE.find((x) => x.id === id);
  const deja = fenetres.get(id);
  if (deja) { devant(deja.win); deja.win.classList.remove("coucou"); void deja.win.offsetWidth; deja.win.classList.add("coucou"); return; }
  const p = prefs.fen?.[id] ?? {};
  const win = document.createElement("div");
  win.className = "qt-win"; win.dataset.id = id;
  win.style.setProperty("--s", p.s ?? 1);
  win.innerHTML = `<div class="qt-tete"><span class="qt-titre">${o.ico} ${o.nom}</span><button class="qt-x" aria-label="Fermer ${o.nom}">✕</button></div>
    <div class="qt-corps"></div><div class="qt-coin-redim" aria-label="Agrandir ou réduire" title="Glisser pour agrandir ou réduire"></div>`;
  calque.appendChild(win);
  const fen = {
    alerte: () => win.classList.add("alerte"),
    calme: () => win.classList.remove("alerte"),
  };
  const fin = o.mount(win.querySelector(".qt-corps"), fen, () => ctxCourant()) || null;
  fenetres.set(id, { win, fin });
  // Première ouverture : sous la vignette (sans cacher les boutons du tableau), en cascade.
  const n = fenetres.size - 1;
  placer(win, p.x ?? ancre.right - win.offsetWidth - n * 22, p.y ?? ancre.bottom + 12 + n * 40);
  devant(win);
  win.querySelector(".qt-x").onclick = () => fermerOutil(id);
  win.addEventListener("pointerdown", () => devant(win), true);
  glisser(win.querySelector(".qt-tete"), win, "deplacer");
  glisser(win.querySelector(".qt-coin-redim"), win, "taille");
  majMenu();
}
function fermerOutil(id) {
  const f = fenetres.get(id); if (!f) return;
  f.fin?.(); f.win.remove(); fenetres.delete(id); majMenu();
}
const memoriser = (win) => {
  prefs.fen ??= {};
  prefs.fen[win.dataset.id] = { x: win.offsetLeft, y: win.offsetTop, s: +win.style.getPropertyValue("--s") || 1 };
  sauverPrefs();
};

// Glisser au stylet : capture du pointeur, pour que le geste ne parte ni dans l'outil ni dans l'annotation.
function glisser(poignee, win, mode) {
  let g = null;
  poignee.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button") || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault(); e.stopPropagation();
    try { poignee.setPointerCapture(e.pointerId); } catch {}
    g = { id: e.pointerId, x: e.clientX, y: e.clientY, l: win.offsetLeft, t: win.offsetTop, w: win.offsetWidth, s: +win.style.getPropertyValue("--s") || 1 };
    win.classList.add("bouge");
  });
  poignee.addEventListener("pointermove", (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (mode === "deplacer") placer(win, g.l + dx, g.t + dy);
    else {
      const avant = win.style.getPropertyValue("--s"), s = Math.max(0.6, Math.min(3, g.s * (g.w + Math.max(dx, dy)) / g.w));
      win.style.setProperty("--s", s.toFixed(3));
      // pas plus grande que l'écran, sinon on ne pourrait plus attraper le coin pour la réduire
      if (s > +avant && (win.offsetWidth > innerWidth - 8 || win.offsetHeight > innerHeight - 8)) win.style.setProperty("--s", avant);
      else placer(win, win.offsetLeft, win.offsetTop);
    }
  });
  const lacher = (e) => { if (!g || e.pointerId !== g.id) return; g = null; win.classList.remove("bouge"); placer(win, win.offsetLeft, win.offsetTop); memoriser(win); };
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) poignee.addEventListener(ev, lacher);
}

// ---------- vignette + menu ----------
function majMenu() {
  menu?.querySelectorAll("[data-o]").forEach((b) => b.classList.toggle("on", fenetres.has(b.dataset.o)));
  document.querySelectorAll(".qt-lanceur").forEach((b) => b.classList.toggle("actif", fenetres.size > 0));
}
function basculerMenu(depuis) {
  if (menu.classList.toggle("ouvert")) {
    const r = depuis.getBoundingClientRect(); ancre = r;
    menu.style.top = Math.round(r.bottom + 8) + "px";
    menu.style.right = Math.round(Math.max(8, innerWidth - r.right)) + "px";
    majMenu();
  }
}

export function installerBarre(board, ctx) {
  if (ctx) ctxCourant = ctx;
  if (!calque) {
    calque = document.createElement("div");
    calque.className = "qt-calque";
    calque.innerHTML = `<div class="qt-menu" role="menu" aria-label="Outils de classe">
      <div class="qt-menu-titre">Outils de classe</div>
      <div class="qt-grille">${OUTILS_BARRE.map((o) => `<button data-o="${o.id}" role="menuitem"><span>${o.ico}</span>${o.nom}</button>`).join("")}</div>
      <button class="qt-tout" data-a="fermer-tout">Fermer toutes les fenêtres</button></div>`;
    menu = calque.querySelector(".qt-menu");
    menu.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.o) ouvrirOutil(b.dataset.o);
      if (b.dataset.a === "fermer-tout") [...fenetres.keys()].forEach(fermerOutil);
      menu.classList.remove("ouvert");
    });
    addEventListener("resize", () => fenetres.forEach(({ win }) => placer(win, win.offsetLeft, win.offsetTop)));
  }
  board.appendChild(calque);
  // Deux vignettes : dans la barre de titre, et dans le coin du tableau quand la barre est masquée (projection).
  const tete = board.querySelector(".board-head");
  const enTete = document.createElement("button");
  enTete.className = "round-btn qt-lanceur"; enTete.title = "Outils de classe : feu, minuteur, chrono, bruit…"; enTete.setAttribute("aria-label", "Outils de classe"); enTete.textContent = "🧰";
  tete?.insertBefore(enTete, tete.querySelector("#annotBtn") || tete.querySelector("#fs"));
  const coin = document.createElement("button");
  coin.className = "qt-lanceur qt-coin"; coin.setAttribute("aria-label", "Outils de classe"); coin.textContent = "🧰";
  board.appendChild(coin);
  for (const b of [enTete, coin]) b.addEventListener("click", (e) => { e.stopPropagation(); basculerMenu(b); });
  const dehors = (e) => { if (menu.classList.contains("ouvert") && !menu.contains(e.target) && !e.target.closest(".qt-lanceur")) menu.classList.remove("ouvert"); };
  document.addEventListener("pointerdown", dehors, true);
  majMenu();
  return () => {
    document.removeEventListener("pointerdown", dehors, true);
    menu.classList.remove("ouvert"); enTete.remove(); coin.remove();
    calque.remove(); // les fenêtres restent en mémoire et reviennent sur le prochain tableau
  };
}
