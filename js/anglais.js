// Anglais au tableau : thèmes (images + son en anglais britannique), et jeux :
// flashcards, memory, morpion par équipes, « What's missing? », « Guess who? », mot au hasard.
// CP à CE2 : images et son seulement. CM1-CM2 : le mot écrit est affiché.
const hasard = (n) => Math.floor(Math.random() * n);
const melange = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = hasard(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Un élément : [mot anglais, image] ; image = emoji, "#couleur" (pastille), "n:nombre" ou "fr:texte" (indice écrit).
// Chaque emoji est affiché par son illustration Microsoft Fluent Emoji 3D (img/emoji/<code unicode sans FE0F>.webp, MIT) ;
// si le fichier manque, on retombe sur l'emoji texte du système.
const T = (s) => s.split("|").map((x) => x.split("="));
export const THEMES = {
  colours: { nom: "Colours 🎨", items: T("red=#e53935|blue=#1e63d6|yellow=#ffd23f|green=#2e9d4a|orange=#ff8a1f|purple=#8e44ad|pink=#ff8fc7|brown=#8d5a2b|black=#222222|white=#ffffff|grey=#9aa0a6") },
  numbers: { nom: "Numbers 🔢", items: Array.from({ length: 20 }, (_, i) => [["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"][i], "n:" + (i + 1)]) },
  days: { nom: "Days 📅", items: T("Monday=fr:lundi|Tuesday=fr:mardi|Wednesday=fr:mercredi|Thursday=fr:jeudi|Friday=fr:vendredi|Saturday=fr:samedi|Sunday=fr:dimanche") },
  emotions: { nom: "Feelings 😀", items: T("happy=😀|sad=😢|angry=😠|scared=😨|tired=😴|surprised=😲|ill=🤒|bored=😑|hungry=😋") },
  clothes: { nom: "Clothes 👕", items: T("T-shirt=👕|trousers=👖|dress=👗|shorts=🩳|coat=🧥|scarf=🧣|gloves=🧤|socks=🧦|cap=🧢|hat=👒|shoes=👞|trainers=👟|boots=🥾|glasses=👓") },
  christmas: { nom: "Christmas 🎄", items: T("Christmas tree=🎄|Father Christmas=🎅|present=🎁|star=⭐|bell=🔔|reindeer=🦌|snowman=☃️|candle=🕯️|snowflake=❄️|sleigh=🛷|elf=🧝|angel=👼|stocking=🧦") },
  animals: { nom: "Animals 🐶", items: T("dog=🐶|cat=🐱|rabbit=🐰|bird=🐦|fish=🐟|horse=🐴|cow=🐮|pig=🐷|sheep=🐑|chicken=🐔|lion=🦁|elephant=🐘|monkey=🐵|mouse=🐭|frog=🐸") },
  food: { nom: "Food 🍎", items: T("apple=🍎|banana=🍌|bread=🍞|cheese=🧀|pizza=🍕|egg=🥚|milk=🥛|strawberry=🍓|orange=🍊|carrot=🥕|cake=🍰|chocolate=🍫|chips=🍟|ice cream=🍦") },
  body: { nom: "My body 👂", items: T("eye=👁️|ear=👂|nose=👃|mouth=👄|hand=✋|foot=🦶|leg=🦵|arm=💪|tooth=🦷") },
  weather: { nom: "Weather ☀️", items: T("sunny=☀️|rainy=🌧️|snowy=🌨️|cloudy=☁️|windy=🌬️|stormy=⛈️|foggy=🌁") },
  family: { nom: "Family 👪", items: T("mum=👩|dad=👨|sister=👧|brother=👦|grandma=👵|grandpa=👴|baby=👶") },
  school: { nom: "School ✏️", items: T("pencil=✏️|pen=🖊️|ruler=📏|book=📕|scissors=✂️|schoolbag=🎒|notebook=📓|crayon=🖍️|chair=🪑|computer=💻|clock=🕒") },
};

// Synthèse vocale en anglais britannique (voix du système ; la qualité dépend de l'appareil).
let voix = null;
const choisirVoix = () => { const v = speechSynthesis.getVoices(); voix = v.find((x) => x.lang === "en-GB") || v.find((x) => /^en[-_]GB/i.test(x.lang)) || v.find((x) => /^en/i.test(x.lang)) || null; };
if (typeof speechSynthesis !== "undefined") { choisirVoix(); speechSynthesis.onvoiceschanged = choisirVoix; }
export const dire = (txt) => {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt); u.lang = "en-GB"; if (voix) u.voice = voix; u.rate = 0.85;
  speechSynthesis.speak(u);
};

export const emojiSrc = (g) => `img/emoji/${[...g].map((c) => c.codePointAt(0)).filter((c) => c !== 0xfe0f).map((c) => c.toString(16)).join("-")}.webp`;
// Nombres : le chiffre + des « boîtes de dix » (2 rangées de 5 points), comme en classe.
const boites = (n) => Array.from({ length: Math.ceil(n / 10) }, (_, b) => `<span class="en-boite">${Array.from({ length: 10 }, (_, k) => `<i class="${b * 10 + k < n ? "on" : ""}"></i>`).join("")}</span>`).join("");
const imageHTML = ([mot, img], taille = "") => {
  if (img.startsWith("#")) return `<span class="en-sw ${taille}" style="background:${img}" aria-label="${esc(mot)}"></span>`;
  if (img.startsWith("n:")) { const n = +img.slice(2); return `<span class="en-num ${taille}">${n}<span class="en-boites">${boites(n)}</span></span>`; }
  if (img.startsWith("fr:")) return `<span class="en-fr ${taille}">${esc(img.slice(3))}</span>`;
  return `<span class="en-emo ${taille}"><img class="en-img" src="${emojiSrc(img)}" alt="${esc(mot)}" loading="lazy" decoding="async" draggable="false" data-emo="${esc(img)}"></span>`;
};
// Repli : image absente (hors ligne sans cache, fichier manquant) -> emoji texte.
const replier = (e) => { const i = e.target; if (i.tagName !== "IMG" || !i.dataset.emo) return; const s = document.createElement("span"); s.className = "en-emo-txt"; s.textContent = i.dataset.emo; s.setAttribute("aria-label", i.alt); i.replaceWith(s); };

// ---------- Guess who : personnages dessinés (SVG), attributs simples ----------
const PRENOMS = { girl: ["Emma", "Lily", "Sophie", "Grace", "Amy", "Chloe", "Ruby", "Mia", "Ella", "Kate"], boy: ["Tom", "Jack", "Harry", "Sam", "Ben", "Leo", "Max", "Oscar", "Alfie", "Joe"] };
const CHEVEUX = { blond: "#f2c94c", brown: "#7b4a22", black: "#222", red: "#d35400" };
const YEUX = { blue: "#2f80ed", brown: "#6b3e1e", green: "#27ae60" };
const PEAUX = ["#f6d2b8", "#e8b48f", "#c68a5f", "#8d5a3b"];
function persos() {
  const vus = new Set(), out = [], noms = { girl: melange(PRENOMS.girl), boy: melange(PRENOMS.boy) };
  while (out.length < 12) {
    const p = { g: hasard(2) ? "girl" : "boy", h: Object.keys(CHEVEUX)[hasard(4)], e: Object.keys(YEUX)[hasard(3)], gl: hasard(3) === 0, hat: hasard(4) === 0, peau: PEAUX[hasard(4)] };
    const k = [p.g, p.h, p.e, p.gl, p.hat].join();
    if (vus.has(k) || !noms[p.g].length) continue;
    vus.add(k); p.nom = noms[p.g].pop(); out.push(p);
  }
  return out;
}
const visageSVG = (p) => {
  const hc = CHEVEUX[p.h], ec = YEUX[p.e];
  return `<svg viewBox="0 0 100 110" class="gwho-face">
    ${p.g === "girl" ? `<path d="M18 52 Q14 100 30 104 H70 Q86 100 82 52 Z" fill="${hc}"/>` : ""}
    <ellipse cx="50" cy="56" rx="30" ry="34" fill="${p.peau}"/>
    <path d="M20 50 Q22 18 50 18 Q78 18 80 50 Q70 32 50 32 Q30 32 20 50 Z" fill="${hc}"/>
    <circle cx="39" cy="56" r="4.5" fill="${ec}"/><circle cx="61" cy="56" r="4.5" fill="${ec}"/>
    <circle cx="39" cy="56" r="1.8" fill="#111"/><circle cx="61" cy="56" r="1.8" fill="#111"/>
    ${p.gl ? `<g fill="none" stroke="#333" stroke-width="2.5"><circle cx="39" cy="56" r="9"/><circle cx="61" cy="56" r="9"/><path d="M48 56 H52"/></g>` : ""}
    <path d="M40 74 Q50 82 60 74" fill="none" stroke="#9b3b3b" stroke-width="3" stroke-linecap="round"/>
    ${p.hat ? `<path d="M14 34 H86 V30 H72 Q70 6 50 6 Q30 6 28 30 H14 Z" fill="#3949ab"/>` : ""}
  </svg>`;
};
const QUESTIONS_GW = [
  ["Is it a girl?", (p) => p.g === "girl"], ["Is it a boy?", (p) => p.g === "boy"],
  ...Object.keys(CHEVEUX).map((h) => [`Has your person got ${h} hair?`, (p) => p.h === h]),
  ...Object.keys(YEUX).map((e) => [`Has your person got ${e} eyes?`, (p) => p.e === e]),
  ["Has your person got glasses?", (p) => p.gl], ["Has your person got a hat?", (p) => p.hat],
];

function anglais(el) {
  let theme = localStorage.getItem("bagaschool-en-theme") || "colours", jeu = "flash";
  let mots = localStorage.getItem("bagaschool-en-mots") === "1"; // afficher les mots écrits (CM)
  let st = {};
  const items = () => THEMES[theme].items;
  const motHTML = (it, force = false) => (mots || force) ? `<span class="en-mot">${esc(it[0])}</span>` : "";
  const init = () => {
    const its = items();
    its.forEach(([, g]) => { if (!/^(#|n:|fr:)/.test(g)) new Image().src = emojiSrc(g); }); // précharge le thème (memory, morpion…)
    if (jeu === "flash") st = { ordre: melange(its.map((_, k) => k)), i: 0, voir: mots };
    if (jeu === "memory") { const pick = melange(its).slice(0, Math.min(8, its.length)); st = { cartes: melange(pick.flatMap((it, k) => [{ k, it, face: "img" }, { k, it, face: mots ? "mot" : "img" }])), ouv: [], trouve: new Set(), bloc: false, coups: 0 }; }
    if (jeu === "morpion") st = { cases: melange(its).slice(0, 9).map((it) => ({ it, eq: null })), tour: 0, sel: null, gagne: null };
    if (jeu === "kim") { const n = Math.min(6, its.length); st = { vis: melange(its).slice(0, n), cache: null, phase: "voir" }; }
    if (jeu === "gw") { const ps = persos(); st = { ps, secret: hasard(ps.length), bas: new Set(), rep: null, auto: true, revele: false }; }
    if (jeu === "tirage") st = { it: null, voir: mots, deja: [] };
  };
  const ligne3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const vue = () => {
    const its = items();
    if (jeu === "flash") {
      const it = its[st.ordre[st.i]];
      return `<div class="en-flash">${imageHTML(it, "xl")}${st.voir ? `<span class="en-mot xl">${esc(it[0])}</span>` : ""}</div>
        <div class="pills"><button class="big-btn soft" id="prev">‹</button><button class="big-btn" id="say">🔊 Écouter</button><button class="big-btn soft" id="voir">${st.voir ? "Cacher" : "Montrer"} le mot</button><button class="big-btn soft" id="next">›</button></div>
        <p class="muted center">${st.i + 1} / ${its.length}</p>`;
    }
    if (jeu === "memory") {
      const fini = st.trouve.size === st.cartes.length / 2;
      return `<div class="en-mem rc-board">${st.cartes.map((c, k) => { const ouvert = st.ouv.includes(k) || st.trouve.has(c.k); return `<button class="en-carte ${ouvert ? "ouv" : ""} ${st.trouve.has(c.k) ? "ok" : ""}" data-c="${k}">${ouvert ? (c.face === "mot" ? `<span class="en-mot">${esc(c.it[0])}</span>` : imageHTML(c.it)) : "?"}</button>`; }).join("")}</div>
        <p class="center">${fini ? `<b>Well done!</b> ${st.coups} coups.` : `<span class="muted">${st.coups} coups. Chaque carte retournée dit son mot.</span>`}</p>`;
    }
    if (jeu === "morpion") {
      const eqs = ["❌", "⭕"];
      return `<p class="center en-tour">${st.gagne ? (st.gagne === "nul" ? "Match nul !" : `L'équipe ${eqs[st.gagne - 1]} a gagné !`) : `À l'équipe ${eqs[st.tour]} de choisir une case et de dire le mot.`}</p>
        <div class="en-morpion">${st.cases.map((c, k) => `<button class="en-case ${st.sel === k ? "sel" : ""} ${c.eq != null ? "eq" + c.eq : ""}" data-m="${k}" ${c.eq != null || st.gagne ? "disabled" : ""}>${c.eq != null ? `<span class="en-pion">${eqs[c.eq]}</span>` : ""}${imageHTML(c.it)}${motHTML(c.it)}</button>`).join("")}</div>
        ${st.sel != null && !st.gagne ? `<div class="pills"><button class="big-btn soft" id="msay">🔊 Écouter</button><button class="big-btn" id="mok">✔ Bonne réponse</button><button class="big-btn soft" id="mko">✘ Raté, équipe suivante</button></div>` : ""}`;
    }
    if (jeu === "kim") {
      const liste = st.phase === "voir" ? st.vis : st.vis.filter((it) => it !== st.cache);
      return `<div class="en-kim">${liste.map((it) => `<div class="en-kim-it">${imageHTML(it)}${motHTML(it)}</div>`).join("")}${st.phase !== "voir" ? `<div class="en-kim-it trou">${st.phase === "rep" ? imageHTML(st.cache) + motHTML(st.cache, true) : "?"}</div>` : ""}</div>
        <div class="pills">${st.phase === "voir" ? `<button class="big-btn" id="kcache">🙈 Fermez les yeux… (cacher une image)</button>` : st.phase === "q" ? `<p class="en-tour">What's missing?</p><button class="big-btn" id="krep">Montrer la réponse</button>` : `<button class="big-btn soft" id="ksay">🔊 Écouter</button><button class="big-btn" id="krejouer">Rejouer</button>`}</div>`;
    }
    if (jeu === "gw") {
      return `<div class="en-gw rc-board">${st.ps.map((p, k) => `<button class="gwho ${st.bas.has(k) ? "bas" : ""} ${st.revele && k === st.secret ? "secret" : ""}" data-p="${k}">${visageSVG(p)}<span>${p.nom}</span></button>`).join("")}</div>
        ${st.rep ? `<p class="center en-tour">${esc(st.rep[0])} <b>${st.rep[1] ? "Yes!" : "No!"}</b></p>` : `<p class="muted center">L'ordinateur a choisi un personnage. Posez une question en anglais, touchez-la pour entendre la réponse.</p>`}
        <div class="pills en-q">${QUESTIONS_GW.map(([q], k) => `<button class="pill" data-q="${k}">${esc(q)}</button>`).join("")}</div>
        <div class="pills"><label class="inline"><input type="checkbox" id="gwauto" ${st.auto ? "checked" : ""}> Baisser les personnages automatiquement</label><button class="pill" id="gwrev">${st.revele ? "Nouvelle partie" : "Révéler"}</button></div>`;
    }
    if (jeu === "tirage") {
      return `<div class="en-flash">${st.it ? imageHTML(st.it, "xl") + (st.voir ? `<span class="en-mot xl">${esc(st.it[0])}</span>` : "") : `<span class="muted">Touche « Tirer un mot ».</span>`}</div>
        <div class="pills"><button class="big-btn" id="tirer">🎲 Tirer un mot</button>${st.it ? `<button class="big-btn soft" id="tsay">🔊 Écouter</button><button class="big-btn soft" id="tvoir">${st.voir ? "Cacher" : "Montrer"} le mot</button>` : ""}</div>
        <p class="muted center">${st.deja.length} / ${items().length} mots tirés${st.deja.length === items().length ? " : on recommence au prochain tirage" : ""}.</p>`;
    }
    return "";
  };
  const render = () => {
    el.innerHTML = `
      <div class="tool-top wrap">
        <select id="theme">${Object.entries(THEMES).map(([k, v]) => `<option value="${k}" ${k === theme ? "selected" : ""}>${v.nom}</option>`).join("")}</select>
        <div class="seg"><button data-mots="0" class="${mots ? "" : "on"}">CP-CE2 : images + son</button><button data-mots="1" class="${mots ? "on" : ""}">CM : avec les mots</button></div>
      </div>
      <div class="tool-top wrap"><div class="seg">${[["flash", "🃏 Flashcards"], ["memory", "🧠 Memory"], ["morpion", "⭕ Morpion"], ["kim", "🙈 What's missing?"], ["gw", "🕵️ Guess who?"], ["tirage", "🎲 Mot au hasard"]].map(([k, v]) => `<button data-jeu="${k}" class="${jeu === k ? "on" : ""}">${v}</button>`).join("")}</div></div>
      <div class="en-jeu en-th-${theme}">${vue()}</div>
      <p class="en-credit">Illustrations : Microsoft Fluent Emoji (MIT)</p>`;
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    const its = items();
    if (t.dataset.jeu) { jeu = t.dataset.jeu; init(); }
    if (t.dataset.mots) { mots = t.dataset.mots === "1"; localStorage.setItem("bagaschool-en-mots", mots ? "1" : "0"); init(); }
    // flashcards
    if (t.id === "next") { st.i = (st.i + 1) % its.length; st.voir = mots; dire(its[st.ordre[st.i]][0]); }
    if (t.id === "prev") { st.i = (st.i - 1 + its.length) % its.length; st.voir = mots; dire(its[st.ordre[st.i]][0]); }
    if (t.id === "say") dire(its[st.ordre[st.i]][0]);
    if (t.id === "voir") st.voir = !st.voir;
    // memory
    if (t.dataset.c != null && !st.bloc) {
      const k = +t.dataset.c, c = st.cartes[k];
      if (st.ouv.includes(k) || st.trouve.has(c.k)) return;
      st.ouv.push(k); dire(c.it[0]);
      if (st.ouv.length === 2) {
        st.coups++;
        const [a, b] = st.ouv.map((x) => st.cartes[x]);
        if (a.k === b.k) { st.trouve.add(a.k); st.ouv = []; }
        else { st.bloc = true; setTimeout(() => { st.ouv = []; st.bloc = false; if (el.isConnected) render(); }, 1300); }
      }
    }
    // morpion
    if (t.dataset.m != null) st.sel = +t.dataset.m;
    if (t.id === "msay") dire(st.cases[st.sel].it[0]);
    if (t.id === "mok" || t.id === "mko") {
      if (t.id === "mok") st.cases[st.sel].eq = st.tour;
      dire(st.cases[st.sel].it[0]);
      st.sel = null;
      const w = ligne3.find((l) => l.every((k) => st.cases[k].eq === st.tour));
      if (w) st.gagne = st.tour + 1; else if (st.cases.every((c) => c.eq != null)) st.gagne = "nul";
      st.tour = 1 - st.tour;
    }
    // kim
    if (t.id === "kcache") { st.cache = st.vis[hasard(st.vis.length)]; st.vis = melange(st.vis); st.phase = "q"; }
    if (t.id === "krep") { st.phase = "rep"; dire(st.cache[0]); }
    if (t.id === "ksay") dire(st.cache[0]);
    if (t.id === "krejouer") init();
    // guess who
    if (t.dataset.p != null) { const k = +t.dataset.p; st.bas.has(k) ? st.bas.delete(k) : st.bas.add(k); }
    if (t.dataset.q != null) {
      const [q, f] = QUESTIONS_GW[+t.dataset.q], oui = f(st.ps[st.secret]);
      st.rep = [q, oui]; dire(oui ? "Yes!" : "No!");
      if (st.auto) st.ps.forEach((p, k) => { if (f(p) !== oui) st.bas.add(k); });
    }
    if (t.id === "gwrev") { if (st.revele) init(); else { st.revele = true; dire(`It's ${st.ps[st.secret].nom}!`); } }
    // tirage
    if (t.id === "tirer") {
      if (st.deja.length >= its.length) st.deja = [];
      const libres = its.filter((it) => !st.deja.includes(it[0]));
      st.it = libres[hasard(libres.length)]; st.deja.push(st.it[0]); st.voir = mots; dire(st.it[0]);
    }
    if (t.id === "tsay") dire(st.it[0]);
    if (t.id === "tvoir") st.voir = !st.voir;
    render();
  };
  el.onchange = (e) => {
    if (e.target.id === "theme") { theme = e.target.value; localStorage.setItem("bagaschool-en-theme", theme); init(); render(); }
    if (e.target.id === "gwauto") st.auto = e.target.checked;
  };
  el.addEventListener("error", replier, true);
  init(); render();
  return () => { el.removeEventListener("error", replier, true); if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); };
}

export const ANGLAIS = [
  { id: "anglais", nom: "English games", icone: "🇬🇧", couleur: "#cfe6ff", desc: "Flashcards, memory, morpion, Guess who…", mount: anglais },
];
