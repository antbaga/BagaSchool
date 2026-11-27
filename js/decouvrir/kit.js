// Boîte à outils partagée des activités « À découvrir » (géographie, histoire, sciences, arts).
// Chaque activité : { id, nom, icone, couleur, desc, niveaux:["CE2","CM1"], theme, mount(el, ctx) -> cleanup? }
// Aucun module ne doit toucher au DOM hors de `el` (sauf le fantôme de glisser-déposer, retiré au cleanup).

export const NIVEAUX = ["CP", "CE1", "CE2", "CM1", "CM2"];
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const rad = (d) => (d * Math.PI) / 180;

// "CE2 → CM2" pour une liste de niveaux.
export function plageNiveaux(niv) {
  const idx = niv.map((n) => NIVEAUX.indexOf(n)).filter((i) => i >= 0).sort((a, b) => a - b);
  if (!idx.length) return "";
  return idx.length === 1 ? NIVEAUX[idx[0]] : `${NIVEAUX[idx[0]]} → ${NIVEAUX[idx[idx.length - 1]]}`;
}

// Sélecteur de niveau (boutons segmentés). `dispo` = niveaux proposés, `cur` = niveau actif.
// Clic : bouton [data-niv]. Le module écoute lui-même et appelle setNiveau.
export function niveauxHTML(dispo, cur) {
  return `<div class="seg dk-niv" role="group" aria-label="Niveau">${dispo.map((n) => `<button data-niv="${n}" class="${n === cur ? "on" : ""}">${n}</button>`).join("")}</div>`;
}
// Mémorise le dernier niveau choisi pour une activité (localStorage, pas de données élèves).
export function niveauMemo(id, dispo, defaut) {
  const k = `bagaschool-dk-niv-${id}`;
  let v = localStorage.getItem(k);
  if (!dispo.includes(v)) v = defaut ?? dispo[0];
  return { get: () => v, set: (n) => { v = n; localStorage.setItem(k, n); } };
}

export const scoreHTML = (ok, total) => `<p class="score">Score : <b>${ok}</b> / ${total}</p>`;

// Petite fête à l'écran quand tout est juste (respecte prefers-reduced-motion).
export function bravo(el, texte = "Bravo !") {
  const b = document.createElement("div");
  b.className = "dk-bravo"; b.textContent = `🎉 ${texte}`;
  el.appendChild(b);
  setTimeout(() => b.remove(), 1800);
}

// Glisser-déposer d'étiquettes vers des cibles, au doigt ou à la souris (pointer events).
// - étiquettes : éléments [data-etq] dans `root` (n'importe quel élément HTML, ex. <button class="etq">)
// - cibles : éléments [data-cible] (HTML ou SVG) ; on dépose sur la cible sous le doigt,
//   ou sur la cible la plus proche dans un rayon `aimant` px (utile pour les petits points d'une carte).
// - le toucher-toucher reste possible : onTap(etqEl) puis clic sur une cible (le module gère).
// Retourne une fonction de nettoyage.
export function dragEtiquettes(root, { onPose, aimant = 0, cibles = "[data-cible]" }) {
  let drag = null;
  const plusProche = (x, y) => {
    const sous = document.elementFromPoint(x, y)?.closest?.(cibles);
    if (sous && root.contains(sous)) return sous;
    if (!aimant) return null;
    let best = null, bd = aimant;
    root.querySelectorAll(cibles).forEach((c) => {
      const r = c.getBoundingClientRect(); if (!r.width && !r.height) return;
      const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      if (d < bd) { bd = d; best = c; }
    });
    return best;
  };
  let survol = null;
  const marquer = (c) => { if (survol === c) return; survol?.classList.remove("dk-survol"); survol = c; c?.classList.add("dk-survol"); };
  const down = (e) => {
    const b = e.target.closest?.("[data-etq]"); if (!b || !root.contains(b) || b.disabled) return;
    drag = { el: b, x: e.clientX, y: e.clientY, ghost: null };
  };
  const move = (e) => {
    if (!drag) return;
    if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
      drag.ghost = drag.el.cloneNode(true);
      drag.ghost.classList.add("dk-ghost"); drag.ghost.removeAttribute("data-etq");
      document.body.appendChild(drag.ghost); drag.el.classList.add("dk-pris");
    }
    if (drag.ghost) {
      e.preventDefault();
      drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px";
      drag.ghost.style.visibility = "hidden"; marquer(plusProche(e.clientX, e.clientY)); drag.ghost.style.visibility = "";
    }
  };
  const up = (e) => {
    if (!drag) return;
    const d = drag; drag = null; marquer(null);
    if (!d.ghost) return;
    d.ghost.remove(); d.el.classList.remove("dk-pris");
    const c = plusProche(e.clientX, e.clientY);
    root._dkDragFini = true; setTimeout(() => { root._dkDragFini = false; }, 0);
    if (c) onPose(d.el, c, e);
  };
  root.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move, { passive: false });
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  return () => {
    root.removeEventListener("pointerdown", down);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    drag?.ghost?.remove();
  };
}
// À appeler au début d'un gestionnaire onclick : vrai si ce clic suit un glisser-déposer (à ignorer).
export const clicApresDrag = (root) => { if (root._dkDragFini) { root._dkDragFini = false; return true; } return false; };

// Zoom et déplacement d'un <svg> (molette, pincement à deux doigts, boutons + / − / ⟲).
// Le viewBox initial est la vue « tout ». Un glisser à un doigt sur le fond déplace la carte
// seulement quand on est zoomé (sinon le doigt reste libre pour toucher les zones).
// Retourne { cleanup, reset, boutonsHTML } ; placer boutonsHTML dans le conteneur et appeler lier(conteneur).
export function zoomSVG(svg, { max = 8 } = {}) {
  const vb0 = svg.viewBox.baseVal; const base = [vb0.x, vb0.y, vb0.width, vb0.height];
  let v = [...base];
  const appliquer = () => svg.setAttribute("viewBox", v.map((n) => n.toFixed(2)).join(" "));
  const borner = () => {
    v[2] = Math.min(base[2], Math.max(base[2] / max, v[2])); v[3] = v[2] * (base[3] / base[2]);
    v[0] = Math.min(base[0] + base[2] - v[2], Math.max(base[0], v[0]));
    v[1] = Math.min(base[1] + base[3] - v[3], Math.max(base[1], v[1]));
  };
  const versSVG = (cx, cy) => { const r = svg.getBoundingClientRect(); const s = Math.max(v[2] / r.width, v[3] / r.height); const ox = (r.width * s - v[2]) / 2, oy = (r.height * s - v[3]) / 2; return [v[0] + (cx - r.left) * s - ox, v[1] + (cy - r.top) * s - oy]; };
  const zoomer = (k, cx, cy) => {
    const [px, py] = cx == null ? [v[0] + v[2] / 2, v[1] + v[3] / 2] : versSVG(cx, cy);
    const w = v[2] / k; const kk = v[2] / Math.min(base[2], Math.max(base[2] / max, w));
    v[0] = px - (px - v[0]) / kk; v[1] = py - (py - v[1]) / kk; v[2] /= kk; v[3] = v[2] * (base[3] / base[2]);
    borner(); appliquer();
  };
  const wheel = (e) => { e.preventDefault(); zoomer(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX, e.clientY); };
  const pts = new Map(); let pan = null, pinch = null;
  const down = (e) => {
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) }; pan = null; }
    else if (pts.size === 1 && v[2] < base[2] - 0.01 && !e.target.closest("[data-etq]")) pan = { x: e.clientX, y: e.clientY, v: [...v], moved: false };
  };
  const move = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) {
      const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d > 0 && pinch.d > 0) zoomer(d / pinch.d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch.d = d; e.preventDefault();
    } else if (pan) {
      const r = svg.getBoundingClientRect(); const s = Math.max(v[2] / r.width, v[3] / r.height);
      const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
      if (Math.hypot(dx, dy) > 6) pan.moved = true;
      if (pan.moved) { v[0] = pan.v[0] - dx * s; v[1] = pan.v[1] - dy * s; borner(); appliquer(); }
    }
  };
  const up = (e) => {
    pts.delete(e.pointerId);
    if (pan?.moved) { svg._dkPanFini = true; setTimeout(() => { svg._dkPanFini = false; }, 0); }
    if (pts.size < 2) pinch = null; if (!pts.size) pan = null;
  };
  svg.addEventListener("wheel", wheel, { passive: false });
  svg.addEventListener("pointerdown", down); svg.addEventListener("pointermove", move);
  svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", up);
  svg.style.touchAction = "none";
  const reset = () => { v = [...base]; appliquer(); };
  const boutonsHTML = `<div class="dk-zoom"><button data-zoom="in" aria-label="Zoomer">+</button><button data-zoom="out" aria-label="Dézoomer">−</button><button data-zoom="reset" aria-label="Vue entière">⟲</button></div>`;
  const clic = (e) => { const b = e.target.closest?.("[data-zoom]"); if (!b) return; e.stopPropagation(); b.dataset.zoom === "in" ? zoomer(1.5) : b.dataset.zoom === "out" ? zoomer(1 / 1.5) : reset(); };
  let hote = null;
  return {
    reset, boutonsHTML,
    lier(conteneur) { hote = conteneur; conteneur.addEventListener("click", clic, true); },
    // vrai si le clic qui arrive termine un déplacement de la carte (à ignorer)
    panFini: () => !!svg._dkPanFini,
    cleanup() { svg.removeEventListener("wheel", wheel); hote?.removeEventListener("click", clic, true); },
  };
}

// Chemin SVG d'un ensemble d'anneaux [[lon,lat],...] avec une projection (lon,lat) -> [x,y].
export const cheminAnneaux = (rings, P) => rings.map((r) => "M" + r.map((p) => P(p[0], p[1]).map((n) => n.toFixed(1)).join(",")).join("L") + "Z").join("");
export const cheminLignes = (lines, P) => lines.map((l) => "M" + l.map((p) => P(p[0], p[1]).map((n) => n.toFixed(1)).join(",")).join("L")).join("");
