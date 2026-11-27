// Jeux « En classe » : flashcards, memory, mots mêlés, monnaie, défi des tables.
// Même format que outils.js : { id, nom, icone, couleur, desc, mount(el, ctx) -> cleanup }.
// ctx : { eleves, esc, decks, saveDecks } (decks = paquets de cartes créés par l'enseignante).
import { grilleMotsMeles } from "./motsmeles.js";

const hasard = (n) => Math.floor(Math.random() * n);
const melange = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = hasard(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uidJ = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Paquets d'exemple (non modifiables), pour essayer sans rien saisir
const EXEMPLES = [
  { id: "ex-contraires", nom: "Les contraires", exemple: true, cartes: [["grand", "petit"], ["chaud", "froid"], ["rapide", "lent"], ["jour", "nuit"], ["ouvrir", "fermer"], ["monter", "descendre"], ["plein", "vide"], ["léger", "lourd"], ["propre", "sale"], ["gagner", "perdre"]].map(([recto, verso]) => ({ recto, verso })) },
  { id: "ex-capitales", nom: "Capitales d'Europe", exemple: true, cartes: [["France", "Paris"], ["Espagne", "Madrid"], ["Italie", "Rome"], ["Allemagne", "Berlin"], ["Portugal", "Lisbonne"], ["Belgique", "Bruxelles"], ["Royaume-Uni", "Londres"], ["Grèce", "Athènes"], ["Pays-Bas", "Amsterdam"], ["Suisse", "Berne"]].map(([recto, verso]) => ({ recto, verso })) },
  { id: "ex-table7", nom: "Table de 7", exemple: true, cartes: Array.from({ length: 10 }, (_, i) => ({ recto: `7 × ${i + 1}`, verso: String(7 * (i + 1)) })) },
];
const tousPaquets = (ctx) => [...(ctx.decks ?? []), ...EXEMPLES];
const parseCartes = (txt) => txt.split("\n").map((l) => l.split(/\s*(?:;|\t|=)\s*/)).filter((p) => p.length >= 2 && p[0].trim() && p[1].trim()).map(([recto, ...v]) => ({ recto: recto.trim(), verso: v.join(" ; ").trim() }));

// ---------- Flashcards ----------
function flashcards(el, ctx) {
  const { esc } = ctx;
  let deck = null, edition = null, ordre = [], i = 0, retourne = false, versoDabord = false;
  const liste = () => {
    deck = null; edition = null;
    const ps = tousPaquets(ctx);
    el.innerHTML = `
      <div class="tool-top wrap"><button class="big-btn" id="new">+ Nouveau paquet</button><span class="muted">Une carte = une question au recto, la réponse au verso.</span></div>
      <div class="deck-list">${ps.map((p) => `
        <div class="deck"><button class="deck-play" data-play="${p.id}"><b>${esc(p.nom)}</b><span>${p.cartes.length} cartes${p.exemple ? " · exemple" : ""}</span></button>
          ${p.exemple ? "" : `<button class="mini" data-edit="${p.id}" aria-label="Modifier">✏️</button>`}</div>`).join("")}</div>`;
  };
  const editeur = (p) => {
    edition = p; deck = null;
    el.innerHTML = `
      <form class="deck-edit" id="f">
        <label>Nom du paquet<input id="dn" value="${esc(p?.nom ?? "")}" required placeholder="ex. Vocabulaire de l'eau"></label>
        <label>Cartes : une par ligne, recto ; verso<textarea id="dc" rows="10" placeholder="chien ; dog&#10;3 × 4 ; 12&#10;Capitale de l'Italie ; Rome">${esc((p?.cartes ?? []).map((c) => `${c.recto} ; ${c.verso}`).join("\n"))}</textarea></label>
        <div class="pills">${p ? `<button type="button" class="pill danger" id="del">Supprimer</button>` : ""}<button type="button" class="pill" id="back">Annuler</button><button class="big-btn">Enregistrer</button></div>
      </form>`;
    el.querySelector("#f").onsubmit = (e) => {
      e.preventDefault();
      const cartes = parseCartes(el.querySelector("#dc").value);
      if (!cartes.length) { el.querySelector("#dc").setCustomValidity("Écris au moins une carte : recto ; verso"); el.querySelector("#dc").reportValidity(); return; }
      const nom = el.querySelector("#dn").value.trim();
      if (p) Object.assign(p, { nom, cartes }); else ctx.decks.unshift({ id: uidJ(), nom, cartes });
      ctx.saveDecks(); liste();
    };
    el.querySelector("#dc").oninput = (e) => e.target.setCustomValidity("");
  };
  const jouer = () => {
    const c = deck.cartes[ordre[i]];
    const face = (v) => esc(v ? c.verso : c.recto);
    el.innerHTML = `
      <div class="tool-top wrap"><button class="pill" id="back">← Paquets</button><b>${esc(deck.nom)}</b><span class="muted">${i + 1} / ${ordre.length}</span><span class="grow"></span>
        <button class="pill" id="mix">🔀 Mélanger</button><button class="pill ${versoDabord ? "on" : ""}" id="inv">⇄ Verso d'abord</button></div>
      <div class="tool-center">
        <button class="flash ${retourne ? "flipped" : ""}" id="card" aria-label="Retourner la carte">
          <span class="flash-in"><span class="flash-face front">${face(versoDabord)}</span><span class="flash-face back">${face(!versoDabord)}</span></span>
        </button>
        <div class="pills"><button class="big-btn soft" id="prev" ${i ? "" : "disabled"}>‹</button><button class="big-btn soft" id="flip">Retourner</button><button class="big-btn" id="next" ${i < ordre.length - 1 ? "" : "disabled"}>›</button></div>
      </div>`;
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.id === "new") return editeur(null);
    if (t.dataset.edit) return editeur(ctx.decks.find((d) => d.id === t.dataset.edit));
    if (t.id === "back") return liste();
    if (t.id === "del" && edition && confirm("Supprimer ce paquet ?")) { ctx.decks.splice(ctx.decks.indexOf(edition), 1); ctx.saveDecks(); return liste(); }
    if (t.dataset.play) { deck = tousPaquets(ctx).find((d) => d.id === t.dataset.play); ordre = deck.cartes.map((_, k) => k); i = 0; retourne = false; return jouer(); }
    if (!deck) return;
    if (t.id === "card" || t.id === "flip") { retourne = !retourne; el.querySelector("#card").classList.toggle("flipped", retourne); return; }
    if (t.id === "prev" && i > 0) { i--; retourne = false; }
    if (t.id === "next" && i < ordre.length - 1) { i++; retourne = false; }
    if (t.id === "mix") { ordre = melange(ordre); i = 0; retourne = false; }
    if (t.id === "inv") { versoDabord = !versoDabord; retourne = false; }
    jouer();
  };
  liste();
}

// ---------- Memory ----------
function memory(el, ctx) {
  const { esc } = ctx;
  let source = "calculs", paires = 8, equipes = 1, cartes = [], ouvertes = [], scores = [0, 0], tour = 0, essais = 0, timer = null;
  const sources = () => [{ id: "calculs", nom: "Tables de multiplication" }, ...tousPaquets(ctx).map((p) => ({ id: p.id, nom: p.nom }))];
  const setup = () => {
    el.innerHTML = `
      <div class="tool-center">
        <div class="mem-setup">
          <label>Cartes<select id="src">${sources().map((s) => `<option value="${s.id}" ${s.id === source ? "selected" : ""}>${esc(s.nom)}</option>`).join("")}</select></label>
          <label>Paires<select id="np">${[6, 8, 10, 12].map((n) => `<option ${n === paires ? "selected" : ""}>${n}</option>`).join("")}</select></label>
          <div class="seg"><button data-eq="1" class="${equipes === 1 ? "on" : ""}">1 joueur</button><button data-eq="2" class="${equipes === 2 ? "on" : ""}">2 équipes</button></div>
        </div>
        <p class="muted">Retrouve chaque carte et sa réponse. Pour tes propres paires, crée un paquet dans « Flashcards ».</p>
        <button class="big-btn" id="go">Jouer</button>
      </div>`;
  };
  const demarrer = () => {
    let pairs;
    if (source === "calculs") {
      const vus = new Set(); pairs = [];
      while (pairs.length < paires) { const a = 2 + hasard(8), b = 2 + hasard(8); if (vus.has(a * b)) continue; vus.add(a * b); pairs.push({ recto: `${a} × ${b}`, verso: String(a * b) }); }
    } else pairs = melange(tousPaquets(ctx).find((p) => p.id === source)?.cartes ?? []).slice(0, paires);
    cartes = melange(pairs.flatMap((p, k) => [{ k, txt: p.recto, ok: false }, { k, txt: p.verso, ok: false }]));
    ouvertes = []; scores = [0, 0]; tour = 0; essais = 0;
    jouer();
  };
  const jouer = () => {
    const fini = cartes.every((c) => c.ok);
    const cols = cartes.length <= 16 ? 4 : cartes.length <= 20 ? 5 : 6;
    el.innerHTML = `
      <div class="tool-top wrap"><button class="pill" id="back">← Réglages</button>
        ${equipes === 2 ? [0, 1].map((q) => `<span class="mem-team t${q} ${tour === q && !fini ? "on" : ""}">Équipe ${q + 1} : ${scores[q]}</span>`).join("") : `<span class="muted">Essais : ${essais} · Paires : ${scores[0]} / ${cartes.length / 2}</span>`}
        <span class="grow"></span><button class="pill" id="again">↻ Rejouer</button></div>
      ${fini ? `<div class="banner ok">${equipes === 2 ? (scores[0] === scores[1] ? "Égalité ! 🤝" : `L'équipe ${scores[0] > scores[1] ? 1 : 2} gagne ! 🎉`) : `Bravo ! Toutes les paires en ${essais} essais 🎉`}</div>` : ""}
      <div class="mem-grid" style="--cols:${cols}">${cartes.map((c, k) => `<button class="mem-card ${c.ok ? "ok" : ouvertes.includes(k) ? "open" : ""}" data-k="${k}" ${c.ok ? "disabled" : ""}><span>${c.ok || ouvertes.includes(k) ? esc(c.txt) : ""}</span></button>`).join("")}</div>`;
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.eq) { equipes = +t.dataset.eq; return setup(); }
    if (t.id === "go" || t.id === "again") return demarrer();
    if (t.id === "back") return setup();
    if (t.dataset.k !== undefined) {
      const k = +t.dataset.k;
      if (ouvertes.length === 2 || ouvertes.includes(k)) return;
      ouvertes.push(k); jouer();
      if (ouvertes.length === 2) {
        essais++;
        const [a, b] = ouvertes;
        if (cartes[a].k === cartes[b].k) { cartes[a].ok = cartes[b].ok = true; scores[equipes === 2 ? tour : 0]++; ouvertes = []; jouer(); }
        else timer = setTimeout(() => { ouvertes = []; if (equipes === 2) tour = 1 - tour; jouer(); }, 1100);
      }
    }
  };
  el.onchange = (e) => { if (e.target.id === "src") source = e.target.value; if (e.target.id === "np") paires = +e.target.value; };
  setup();
  return () => clearTimeout(timer);
}

// ---------- Mots mêlés ----------
const THEMES_MM = {
  "Animaux": "chat, chien, lapin, cheval, vache, mouton, poule, canard, lion, tigre, zèbre, girafe",
  "Fruits": "pomme, poire, banane, cerise, fraise, orange, citron, raisin, prune, kiwi, melon, pêche",
  "L'école": "cartable, cahier, crayon, gomme, règle, trousse, stylo, classe, maître, élève, livre, colle",
  "Le corps": "tête, bras, jambe, main, pied, nez, bouche, oreille, genou, coude, épaule, doigt",
};
function motsmeles(el, ctx) {
  const { esc } = ctx;
  let mots = THEMES_MM["Animaux"], taille = 10, niveau = "facile", jeu = null, trouves = new Set(), debut = null, solution = false;
  const setup = () => {
    el.innerHTML = `
      <div class="tool-center">
        <div class="pills">${Object.keys(THEMES_MM).map((t) => `<button class="pill" data-theme="${esc(t)}">${esc(t)}</button>`).join("")}</div>
        <label class="mm-words">Mots à cacher (séparés par des virgules ou un par ligne)<textarea id="mw" rows="3">${esc(mots)}</textarea></label>
        <div class="mem-setup">
          <label>Grille<select id="mt">${[8, 10, 12, 15].map((n) => `<option value="${n}" ${n === taille ? "selected" : ""}>${n} × ${n}</option>`).join("")}</select></label>
          <div class="seg">${[["facile", "→ ↓"], ["moyen", "+ diagonales"], ["difficile", "+ à l'envers"]].map(([k, l]) => `<button data-niv="${k}" class="${niveau === k ? "on" : ""}">${l}</button>`).join("")}</div>
        </div>
        <button class="big-btn" id="go">Créer la grille</button>
      </div>`;
  };
  const creer = () => {
    jeu = grilleMotsMeles(mots.split(/[\n,;]/), taille, niveau);
    trouves = new Set(); debut = null; solution = false; jouer();
  };
  const cellTrouvee = (r, c) => jeu.places.findIndex((p, k) => (trouves.has(k) || solution) && p.cells.some(([a, b]) => a === r && b === c));
  const jouer = () => {
    const fini = trouves.size === jeu.places.length;
    el.innerHTML = `
      <div class="tool-top wrap"><button class="pill" id="back">← Mots</button><span class="muted">${trouves.size} / ${jeu.places.length} trouvés</span><span class="grow"></span>
        <button class="pill" id="sol">${solution ? "Cacher" : "Voir"} la solution</button><button class="pill" id="go">↻ Nouvelle grille</button></div>
      ${fini ? `<div class="banner ok">Tous les mots sont trouvés ! 🎉</div>` : `<p class="muted center">Touche la première lettre d'un mot, puis la dernière.</p>`}
      <div class="mm-wrap">
        <div class="mm-grid" style="--n:${taille}">${jeu.grille.map((row, r) => row.map((l, c) => { const k = cellTrouvee(r, c); return `<button class="mm-cell ${k >= 0 ? `f f${k % 6}` : ""} ${debut && debut[0] === r && debut[1] === c ? "start" : ""}" data-rc="${r},${c}">${l}</button>`; }).join("")).join("")}</div>
        <ul class="mm-list">${jeu.places.map((p, k) => `<li class="${trouves.has(k) ? "done" : ""}">${esc(p.mot)}</li>`).join("")}</ul>
      </div>
      ${jeu.rejetes.length ? `<p class="muted center">Mots trop longs ou impossibles à placer : ${jeu.rejetes.map(esc).join(", ")}</p>` : ""}`;
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.theme) { mots = THEMES_MM[t.dataset.theme]; el.querySelector("#mw").value = mots; return; }
    if (t.dataset.niv) { niveau = t.dataset.niv; mots = el.querySelector("#mw").value; return setup(); }
    if (t.id === "go") { if (el.querySelector("#mw")) mots = el.querySelector("#mw").value; return creer(); }
    if (t.id === "back") return setup();
    if (t.id === "sol") { solution = !solution; return jouer(); }
    if (t.dataset.rc) {
      const [r, c] = t.dataset.rc.split(",").map(Number);
      if (!debut) { debut = [r, c]; return jouer(); }
      const k = jeu.places.findIndex((p) => { const a = p.cells[0], b = p.cells[p.cells.length - 1]; return (a[0] === debut[0] && a[1] === debut[1] && b[0] === r && b[1] === c) || (b[0] === debut[0] && b[1] === debut[1] && a[0] === r && a[1] === c); });
      if (k >= 0) trouves.add(k);
      debut = null; jouer();
    }
  };
  el.onchange = (e) => { if (e.target.id === "mt") taille = +e.target.value; };
  el.oninput = (e) => { if (e.target.id === "mw") mots = e.target.value; };
  setup();
}

// ---------- Monnaie ----------
const PIECES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]; // en centimes
const euro = (c) => (c % 100 === 0 ? `${c / 100} €` : (c / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €");
const pieceHTML = (v, attrs = "") => v >= 500
  ? `<button class="billet b${v / 100}" ${attrs}><span>${v / 100} €</span></button>`
  : `<button class="piece ${v >= 100 ? "bi" : v >= 10 ? "or" : "cu"} p${v}" ${attrs}><span>${v >= 100 ? v / 100 + " €" : v + " c"}</span></button>`;
const NIVEAUX_M = [
  { nom: "Euros entiers (jusqu'à 10 €)", pieces: [100, 200, 500, 1000], prix: () => 100 * (1 + hasard(10)) },
  { nom: "Avec centimes (jusqu'à 10 €)", pieces: [1, 2, 5, 10, 20, 50, 100, 200, 500], prix: () => 5 * (2 + hasard(198)) },
  { nom: "Jusqu'à 100 €", pieces: [100, 200, 500, 1000, 2000, 5000], prix: () => 100 * (5 + hasard(96)) },
];
function monnaie(el) {
  let mode = "payer", niv = 0, prix = 0, tas = [], verdict = null, voirTotal = true, montre = false;
  const nouveau = () => {
    const N = NIVEAUX_M[niv]; prix = N.prix(); verdict = null; montre = false; tas = [];
    if (mode === "compter") { // décomposition aléatoire du prix avec les pièces du niveau
      let reste = prix;
      while (reste > 0) { const ok = N.pieces.filter((p) => p <= reste); const p = ok[Math.max(0, ok.length - 1 - hasard(Math.min(3, ok.length)))]; tas.push(p); reste -= p; }
      tas.sort((a, b) => b - a);
    }
  };
  const total = () => tas.reduce((a, b) => a + b, 0);
  const render = () => {
    const N = NIVEAUX_M[niv];
    el.innerHTML = `
      <div class="tool-top wrap">
        <div class="seg"><button data-mode="payer" class="${mode === "payer" ? "on" : ""}">🛒 Payer</button><button data-mode="compter" class="${mode === "compter" ? "on" : ""}">🔢 Compter</button></div>
        <select id="niv">${NIVEAUX_M.map((n, k) => `<option value="${k}" ${k === niv ? "selected" : ""}>${n.nom}</option>`).join("")}</select>
        ${mode === "payer" ? `<label class="inline"><input type="checkbox" id="vt" ${voirTotal ? "checked" : ""}> Afficher le total</label>` : ""}
      </div>
      ${mode === "payer" ? `
        <div class="tool-center">
          <div class="price-tag">À payer : <b>${euro(prix)}</b></div>
          <div class="tray" aria-label="Porte-monnaie">${tas.map((v, k) => pieceHTML(v, `data-rm="${k}"`)).join("") || `<span class="muted">Touche les pièces et les billets pour payer.</span>`}</div>
          ${voirTotal ? `<div class="muted">Total : <b>${euro(total())}</b></div>` : ""}
          ${verdict ? `<div class="banner ${verdict === "ok" ? "ok" : "ko"}">${verdict === "ok" ? "C'est juste ! 🎉" : verdict === "plus" ? "Il manque de l'argent." : "C'est trop !"}</div>` : ""}
          <div class="pills"><button class="big-btn soft" id="chk">Vérifier</button><button class="big-btn" id="nx">Suivant ➜</button></div>
          <div class="bank">${N.pieces.map((v) => pieceHTML(v, `data-add="${v}"`)).join("")}</div>
        </div>` : `
        <div class="tool-center">
          <div class="tray big">${tas.map((v) => pieceHTML(v, "tabindex=-1")).join("")}</div>
          <div class="calc-q">Total : <span class="calc-r ${montre ? "" : "hide"}">${montre ? euro(prix) : "?"}</span></div>
          <div class="pills"><button class="big-btn soft" id="sh">👀 Réponse</button><button class="big-btn" id="nx">Suivant ➜</button></div>
        </div>`}`;
  };
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.mode) { mode = t.dataset.mode; nouveau(); }
    if (t.dataset.add) { tas.push(+t.dataset.add); tas.sort((a, b) => b - a); verdict = null; }
    if (t.dataset.rm !== undefined && mode === "payer") { tas.splice(+t.dataset.rm, 1); verdict = null; }
    if (t.id === "chk") verdict = total() === prix ? "ok" : total() < prix ? "plus" : "trop";
    if (t.id === "nx") nouveau();
    if (t.id === "sh") montre = true;
    render();
  };
  el.onchange = (e) => {
    if (e.target.id === "niv") { niv = +e.target.value; nouveau(); render(); }
    if (e.target.id === "vt") { voirTotal = e.target.checked; render(); }
  };
  nouveau(); render();
}

// ---------- Défi des tables ----------
function tables(el) {
  let choix = [2, 3, 4, 5], duree = 60, q = null, rep = "", score = 0, erreurs = [], fin = 0, tick = null, flash = "", attente = null;
  const setup = () => {
    clearInterval(tick);
    el.innerHTML = `
      <div class="tool-center">
        <div class="tables">Tables : ${[2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => `<button class="mini ${choix.includes(t) ? "on" : ""}" data-t="${t}">${t}</button>`).join("")}</div>
        <div class="seg">${[[60, "1 minute"], [120, "2 minutes"], [0, "Sans chrono"]].map(([d, l]) => `<button data-d="${d}" class="${duree === d ? "on" : ""}">${l}</button>`).join("")}</div>
        <button class="big-btn" id="go">C'est parti !</button>
      </div>`;
  };
  const question = () => { const a = choix[hasard(choix.length)], b = 1 + hasard(10); q = hasard(2) ? { a, b } : { a: b, b: a }; rep = ""; };
  const restant = () => Math.max(0, Math.ceil((fin - Date.now()) / 1000));
  const jouer = () => {
    el.innerHTML = `
      <div class="tool-top wrap"><button class="pill" id="stop">■ Arrêter</button><span class="grow"></span>${duree ? `<span class="chrono" id="ch">⏱️ ${restant()} s</span>` : ""}<span class="score">⭐ ${score}</span></div>
      <div class="tool-center">
        <div class="calc-q tab-q ${flash}">${q.a} × ${q.b} = <span class="tab-rep">${flash === "ko" ? q.a * q.b : rep || "?"}</span></div>
        <div class="keypad">${[7, 8, 9, 4, 5, 6, 1, 2, 3].map((n) => `<button data-n="${n}">${n}</button>`).join("")}<button data-n="del" aria-label="Effacer">⌫</button><button data-n="0">0</button><button data-n="ok" class="ok">OK</button></div>
      </div>`;
  };
  const resultat = () => {
    clearInterval(tick); clearTimeout(attente); q = null;
    const err = [...new Map(erreurs.map((x) => [`${x.a}×${x.b}`, x])).values()];
    el.innerHTML = `
      <div class="tool-center">
        <div class="calc-q">⭐ ${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""}</div>
        ${err.length ? `<p>À revoir :</p><div class="pills">${err.map((x) => `<span class="pill">${x.a} × ${x.b} = ${x.a * x.b}</span>`).join("")}</div>` : `<div class="banner ok">Aucune erreur ! 🎉</div>`}
        <div class="pills"><button class="pill" id="back">Réglages</button><button class="big-btn" id="go">Rejouer</button></div>
      </div>`;
  };
  const valider = () => {
    if (!q || !rep || flash) return;
    if (+rep === q.a * q.b) { score++; flash = "ok"; jouer(); attente = setTimeout(() => { flash = ""; question(); jouer(); }, 350); }
    else { erreurs.push({ ...q }); flash = "ko"; jouer(); attente = setTimeout(() => { flash = ""; question(); jouer(); }, 1400); }
  };
  const touche = (n) => {
    if (!q || flash) return;
    if (n === "ok") return valider();
    rep = n === "del" ? rep.slice(0, -1) : (rep + n).slice(0, 3);
    jouer();
  };
  const onKey = (e) => { if (!q) return; if (/^\d$/.test(e.key)) touche(e.key); else if (e.key === "Backspace") touche("del"); else if (e.key === "Enter") touche("ok"); };
  document.addEventListener("keydown", onKey);
  el.onclick = (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.t) { const v = +t.dataset.t; choix = choix.includes(v) ? (choix.length > 1 ? choix.filter((x) => x !== v) : choix) : [...choix, v].sort((a, b) => a - b); setup(); }
    if (t.dataset.d !== undefined) { duree = +t.dataset.d; setup(); }
    if (t.id === "go") {
      score = 0; erreurs = []; flash = ""; question();
      if (duree) { fin = Date.now() + duree * 1000; tick = setInterval(() => { const r = restant(); const ch = el.querySelector("#ch"); if (ch) ch.textContent = `⏱️ ${r} s`; if (r <= 0) resultat(); }, 250); }
      jouer();
    }
    if (t.id === "stop") resultat();
    if (t.id === "back") setup();
    if (t.dataset.n) touche(t.dataset.n);
  };
  setup();
  return () => { clearInterval(tick); clearTimeout(attente); document.removeEventListener("keydown", onKey); };
}

export const JEUX = [
  { id: "flashcards", nom: "Flashcards", icone: "🃏", couleur: "#ffd0dc", desc: "Tes cartes question / réponse", mount: flashcards },
  { id: "memory", nom: "Memory", icone: "🧠", couleur: "#d7ccff", desc: "Retrouver les paires, seul ou en équipes", mount: memory },
  { id: "motsmeles", nom: "Mots mêlés", icone: "🔎", couleur: "#c9ecd4", desc: "Avec tes mots ou un thème", mount: motsmeles },
  { id: "monnaie", nom: "La monnaie", icone: "💶", couleur: "#ffe3a3", desc: "Payer et compter en euros", mount: monnaie },
  { id: "tables", nom: "Défi des tables", icone: "✖️", couleur: "#cfe6ff", desc: "Tables de multiplication chronométrées", mount: tables },
];
