// Animations partagées : une seule couche, des durées et des courbes communes.
// Principe : l'app redessine souvent tout un bloc (innerHTML). Un MutationObserver compare ce qui
// est retiré et ce qui est ajouté dans le même lot : un élément identique (mêmes classes, même texte)
// n'est pas réanimé, seul ce qui change bouge (nouvelle réponse juste/fausse, nouvelle question, carte retournée…).
// Respecte prefers-reduced-motion et le réglage « Réduire les animations » (localStorage, par appareil).

const CLE = "bagaschool-anim";
export const D = { rapide: 160, normal: 280, lent: 520 };
export const EASE = { sortie: "cubic-bezier(.2,.8,.2,1)", ressort: "cubic-bezier(.34,1.5,.64,1)", doux: "cubic-bezier(.4,0,.2,1)" };

const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
export const animReduites = () => localStorage.getItem(CLE) === "reduit";
export const setAnimReduites = (v) => { if (v) localStorage.setItem(CLE, "reduit"); else localStorage.removeItem(CLE); appliquerClasse(); };
export const moinsAnim = () => !!media?.matches || animReduites();
const appliquerClasse = () => document.documentElement.classList.toggle("anim-reduites", animReduites());

const anime = (el, kf, opts) => {
  if (moinsAnim() || !el.animate) return null;
  try { return el.animate(kf, { duration: D.normal, easing: EASE.sortie, fill: "backwards", ...opts }); } catch { return null; }
};
// Transformations ajoutées à celle de l'élément (composite add) : rien ne saute sur un élément déjà centré/décalé.
const animeT = (el, kf, opts) => anime(el, kf, { composite: "add", ...opts });

// ---------- effets ----------
export const FX = {
  apparait: (el, i = 0) => animeT(el, [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { delay: Math.min(i * 35, 420) }),
  entre: (el, i = 0) => animeT(el, [{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: D.lent, easing: EASE.ressort, delay: Math.min(i * 45, 500) }),
  question: (el) => anime(el, [{ opacity: 0, filter: "blur(3px)" }, { opacity: 1, filter: "none" }], { duration: D.normal }),
  juste: (el) => {
    animeT(el, [{ transform: "scale(1)" }, { transform: "scale(1.07)", offset: .35 }, { transform: "scale(1)" }], { duration: D.lent, easing: EASE.doux, fill: "none" });
    anime(el, [{ boxShadow: "0 0 0 0 #5cc87a99" }, { boxShadow: "0 0 0 14px #5cc87a00" }], { duration: 700, composite: "add", fill: "none" });
  },
  faux: (el) => animeT(el, [0, -7, 6, -4, 2, 0].map((x) => ({ transform: `translateX(${x}px)` })), { duration: 380, easing: "ease-out", fill: "none" }),
  bosse: (el) => animeT(el, [{ transform: "scale(1)" }, { transform: "scale(1.25)", offset: .3 }, { transform: "scale(1)" }], { duration: 420, easing: EASE.doux, fill: "none" }),
  bravo: (el) => animeT(el, [{ opacity: 0, transform: "scale(.7)" }, { opacity: 1, transform: "scale(1.05)", offset: .6 }, { opacity: 1, transform: "scale(1)" }], { duration: D.lent, easing: EASE.doux }),
  oups: (el) => animeT(el, [{ opacity: 0, transform: "translateX(-10px)" }, { opacity: 1, transform: "translateX(5px)", offset: .5 }, { opacity: 1, transform: "none" }], { duration: 360 }),
  retourne: (el, i = 0) => anime(el, [{ transform: "perspective(600px) rotateY(90deg)", opacity: .6 }, { transform: "perspective(600px) rotateY(0)", opacity: 1 }], { duration: D.normal, delay: Math.min(i * 18, 360), easing: EASE.sortie }),
  allume: (el) => anime(el, [{ opacity: .25, transform: "scale(.9)" }, { opacity: 1, transform: "scale(1.04)" }], { duration: D.lent, easing: EASE.ressort }),
  clignote: (el) => anime(el, [{ opacity: .35 }, { opacity: 1 }], { duration: 450, fill: "none" }),
};

// Révéler une liste d'éléments les uns après les autres.
export function vague(els, effet = "apparait") { [...els].forEach((e, i) => FX[effet](e, i)); }
// Faire entrer un bloc entier (changement d'étape, de page).
export function entree(el) { if (el) animeT(el, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: D.normal }); }

// ---------- règles automatiques (observateur) ----------
// Ordre = priorité : la première règle qui correspond s'applique. Les éléments SVG ne reçoivent que « clignote ».
const REGLES = [
  ["[data-fete]", (el) => { FX.bravo(el); fete(); }],
  [".banner.ok, .cl-expl.ok, .clk-ok", FX.bravo],
  [".banner.ko, .cl-expl.ko, .clk-ko", FX.oups],
  [".mem-card.ok, .dt-tile.ok", FX.juste],
  [".rit-carte.vu, .rit-rep.vu", FX.retourne],
  [".mem-card, .en-carte", FX.retourne, true],
  [".good, .tab-q.ok", FX.juste],
  [".tab-q.ko", FX.faux],
  [".calc-r:not(.hide)", FX.question],
  [".bad", FX.faux],
  [".score b, span.score, .cl-compte b, .mem-team, .dice-total b, .cj-score, .homo-score, .mes-score-big", FX.bosse],
  [".calc-q, .cl-q, .clk-q, .en-q, .geo-q, .el-q-enonce, .count-big, .fr-big, .acc-vi-mot, .en-flash .en-mot", FX.question],
  [".group, .tile, .big-card, .cl-geste, .chips-soft span:first-child", FX.apparait, true],
  [".cl-gros, .voice-emoji, .rit-nb, .date-card", FX.entre],
  [".lamp.on", FX.allume],
  [".flash", FX.apparait],
  [".light-label, .voice-n, .voice-t, #clCard > h3", FX.question],
];
const TOUS = REGLES.map((r) => r[0]).join(",");
const CLASSES_VIVES = new Set(["good", "bad", "ok", "ko", "open", "revele"]);
// Ce qui se tape au clavier (réponse en cours) ne compte pas : la question ne « réapparaît » pas à chaque chiffre.
const IGNORE = ".tab-rep, .calc-r, input, [data-mv-ignore]";
const signature = (el) => {
  let t = el.textContent || "";
  if (t.length < 400) el.querySelectorAll(IGNORE).forEach((x) => { t = t.replace(x.textContent, ""); });
  return (el.getAttribute("class") || "") + "|" + t.trim().slice(0, 120);
};
const candidats = (n) => {
  if (n.nodeType !== 1 || n instanceof SVGElement) return [];
  const l = n.matches(TOUS) ? [n] : [];
  return l.concat([...n.querySelectorAll(TOUS)].filter((e) => !(e instanceof SVGElement)));
};
function traiter(records) {
  if (moinsAnim()) return;
  const retires = new Map(), nouveaux = new Set();
  for (const r of records) {
    if (r.type === "childList") {
      r.removedNodes.forEach((n) => candidats(n).forEach((e) => { const s = signature(e); retires.set(s, (retires.get(s) || 0) + 1); }));
      r.addedNodes.forEach((n) => candidats(n).forEach((e) => nouveaux.add(e)));
    } else if (r.type === "attributes" && r.target.nodeType === 1) {
      const avant = new Set((r.oldValue || "").split(/\s+/));
      const gagne = [...r.target.classList].some((c) => CLASSES_VIVES.has(c) && !avant.has(c));
      if (gagne) {
        if (r.target instanceof SVGElement) FX.clignote(r.target);
        else if (r.target.matches(TOUS)) nouveaux.add(r.target);
      }
    }
  }
  const rang = new Map();
  for (const el of nouveaux) {
    if (!el.isConnected) continue;
    const s = signature(el), k = retires.get(s);
    if (k && !el.matches("[data-fete-toujours]")) { retires.set(s, k - 1); continue; }
    const regle = REGLES.find((r) => el.matches(r[0])); if (!regle) continue;
    const i = rang.get(regle) || 0; rang.set(regle, i + 1);
    regle[1](el, regle[2] ? i : 0);
  }
}

export function initAnimations() {
  appliquerClasse();
  if (!("MutationObserver" in window)) return;
  new MutationObserver(traiter).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
}

// ---------- fête (fin de jeu réussie) ----------
// Confettis discrets : ~70 papiers, 1,6 s, couleurs de l'app, puis le canvas disparaît.
const COULEURS = ["#7a6cf0", "#f5b83d", "#5cc87a", "#ef6461", "#4d8ef0", "#ffd0dc"];
let enCours = false;
export function fete() {
  if (moinsAnim() || enCours) return;
  const hote = document.fullscreenElement || document.body;
  const c = document.createElement("canvas");
  c.className = "fete-canvas"; c.setAttribute("aria-hidden", "true");
  hote.appendChild(c);
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr;
  const g = c.getContext("2d"); if (!g) { c.remove(); return; }
  g.scale(dpr, dpr); enCours = true;
  const N = W < 700 ? 45 : 75, papiers = [];
  for (let i = 0; i < N; i++) {
    const gauche = i % 2 === 0;
    papiers.push({ x: gauche ? -10 : W + 10, y: H * (0.5 + Math.random() * 0.3), vx: (gauche ? 1 : -1) * (4 + Math.random() * 9), vy: -(9 + Math.random() * 9),
      w: 7 + Math.random() * 6, h: 4 + Math.random() * 4, r: Math.random() * 6, vr: (Math.random() - .5) * .3, col: COULEURS[i % COULEURS.length] });
  }
  const t0 = performance.now(), DUREE = 1700;
  const pas = (t) => {
    const k = (t - t0) / DUREE;
    g.clearRect(0, 0, W, H);
    g.globalAlpha = k > .7 ? Math.max(0, (1 - k) / .3) : 1;
    for (const p of papiers) {
      p.vy += .32; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, Math.cos(p.r * 2.2));
      g.fillStyle = p.col; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
    }
    if (k < 1) requestAnimationFrame(pas); else { c.remove(); enCours = false; }
  };
  requestAnimationFrame(pas);
}
