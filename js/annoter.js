// Annoter par-dessus n'importe quel outil « En classe » (TBI, stylet, doigt ou souris) +
// clics fiables au stylet de TBI.
//
// Les stylets de TBI se comportent souvent comme un doigt : un tout petit glissement pendant l'appui
// annule le « clic » du navigateur, et le bouton touché (une couleur, « Suivant »…) ne réagit pas.
// tapFiable() rattrape ces appuis : si on lève le stylet sur le bouton où on l'a posé, on déclenche le clic.
const COULEURS = ["#2b2b2b", "#e0384f", "#2f6fe0", "#1f9e5b", "#f29a12", "#ffffff"];
const TAILLES = [3, 7, 16];

export function tapFiable(zone) {
  let appui = null, ignorerJusqua = 0;
  const cible = (e) => e.target.closest?.("button, [role=button], .tile, a.btn");
  const down = (e) => { if (e.pointerType === "mouse") return; appui = { el: cible(e), x: e.clientX, y: e.clientY }; };
  const up = (e) => {
    if (!appui?.el) { appui = null; return; }
    const el = cible(e) || document.elementFromPoint(e.clientX, e.clientY)?.closest?.("button, [role=button], .tile, a.btn");
    const loin = Math.hypot(e.clientX - appui.x, e.clientY - appui.y) > 40;
    if (el === appui.el && !loin && !el.disabled) {
      // laisse le navigateur faire son clic ; s'il ne vient pas, on le fait nous-mêmes
      const t0 = performance.now(); let fait = false;
      const obs = () => { fait = true; };
      el.addEventListener("click", obs, { once: true, capture: true });
      setTimeout(() => { el.removeEventListener("click", obs, { capture: true }); if (!fait && performance.now() - t0 < 600 && el.isConnected) { ignorerJusqua = performance.now() + 400; el.click(); } }, 60);
    }
    appui = null;
  };
  const cancel = () => { appui = null; };
  const clic = (e) => { if (e.isTrusted && performance.now() < ignorerJusqua) { e.stopPropagation(); e.preventDefault(); ignorerJusqua = 0; } };
  zone.addEventListener("click", clic, true);
  zone.addEventListener("pointerdown", down, true);
  zone.addEventListener("pointerup", up, true);
  zone.addEventListener("pointercancel", cancel, true);
  return () => { zone.removeEventListener("click", clic, true); zone.removeEventListener("pointerdown", down, true); zone.removeEventListener("pointerup", up, true); zone.removeEventListener("pointercancel", cancel, true); };
}

export function installerAnnotation(board) {
  const corps = board.querySelector(".board-body"), tete = board.querySelector(".board-head");
  const btn = document.createElement("button");
  btn.className = "round-btn"; btn.id = "annotBtn"; btn.title = "Annoter par-dessus l'outil"; btn.setAttribute("aria-label", "Annoter"); btn.textContent = "✏️";
  tete.insertBefore(btn, tete.querySelector("#fs"));
  let calque = null, cv = null, g = null, ro = null, couleur = COULEURS[1], taille = TAILLES[1], gomme = false, main = false, traits = [], encours = null;

  const ouvrir = () => {
    calque = document.createElement("div");
    calque.className = "annot";
    calque.innerHTML = `<canvas></canvas>
      <div class="annot-barre" role="toolbar" aria-label="Annotation">
        <button data-a="fermer" aria-label="Fermer l'annotation">✕</button><span class="annot-sep"></span>
        ${COULEURS.map((c) => `<button data-c="${c}" aria-label="Couleur"><span class="dot" style="background:${c}"></span></button>`).join("")}
        <span class="annot-sep"></span>
        ${TAILLES.map((t) => `<button data-t="${t}" aria-label="Épaisseur"><span class="dot" style="width:${t + 6}px;height:${t + 6}px;background:#555"></span></button>`).join("")}
        <span class="annot-sep"></span>
        <button data-a="gomme" aria-label="Gomme">🧽</button><button data-a="annul" aria-label="Annuler">↶</button><button data-a="main" aria-label="Utiliser l'outil sans effacer les annotations">✋</button><button data-a="vider" aria-label="Tout effacer">🗑️</button>
      </div>`;
    board.appendChild(calque); // à côté de la zone de l'outil (que l'outil redessine), pas dedans
    cv = calque.querySelector("canvas"); g = cv.getContext("2d");
    ro = new ResizeObserver(adapter); ro.observe(corps); adapter();
    const barre = calque.querySelector(".annot-barre");
    // Les boutons réagissent dès qu'on pose le stylet : rien à « cliquer » proprement.
    barre.addEventListener("pointerdown", (e) => { const b = e.target.closest("button"); if (!b) return; e.preventDefault(); e.stopPropagation(); action(b); });
    cv.addEventListener("pointerdown", poser);
    cv.addEventListener("pointermove", bouger);
    for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) cv.addEventListener(ev, lever);
    maj(); btn.classList.add("on");
  };
  const fermer = () => { ro?.disconnect(); calque?.remove(); calque = null; traits = []; btn.classList.remove("on"); };
  const adapter = () => {
    Object.assign(calque.style, { top: corps.offsetTop + "px", left: corps.offsetLeft + "px", width: corps.offsetWidth + "px", height: corps.offsetHeight + "px" });
    const r = corps.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr);
    cv.style.width = r.width + "px"; cv.style.height = r.height + "px";
    g.setTransform(dpr, 0, 0, dpr, 0, 0); dessiner();
  };
  const dessiner = () => {
    const r = cv.getBoundingClientRect();
    g.clearRect(0, 0, r.width, r.height);
    for (const t of [...traits, ...(encours ? [encours] : [])]) {
      g.globalCompositeOperation = t.gomme ? "destination-out" : "source-over";
      g.strokeStyle = t.c; g.lineWidth = t.w; g.lineCap = g.lineJoin = "round";
      g.beginPath(); t.p.forEach(([x, y], k) => (k ? g.lineTo(x * r.width, y * r.height) : g.moveTo(x * r.width, y * r.height)));
      if (t.p.length === 1) g.lineTo(t.p[0][0] * r.width + 0.1, t.p[0][1] * r.height);
      g.stroke();
    }
    g.globalCompositeOperation = "source-over";
  };
  const pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  const poser = (e) => {
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch {}
    encours = { c: couleur, w: gomme ? taille * 4 : taille, gomme, p: [pt(e)], id: e.pointerId };
    dessiner();
  };
  const bouger = (e) => {
    if (!encours || e.pointerId !== encours.id) return;
    if (e.buttons === 0 && e.pointerType === "mouse") return lever(e); // bouton relâché hors de la fenêtre
    for (const ev of e.getCoalescedEvents?.() ?? [e]) encours.p.push(pt(ev));
    dessiner();
  };
  const lever = () => { if (!encours) return; traits.push(encours); encours = null; dessiner(); };
  const action = (b) => {
    if (b.dataset.c) { couleur = b.dataset.c; gomme = false; main = false; }
    if (b.dataset.t) { taille = +b.dataset.t; main = false; }
    const a = b.dataset.a;
    if (a === "gomme") { gomme = true; main = false; }
    if (a === "main") main = !main;
    if (a === "annul") { traits.pop(); dessiner(); }
    if (a === "vider") { traits = []; dessiner(); }
    if (a === "fermer") return fermer();
    maj();
  };
  const maj = () => {
    calque.classList.toggle("main", main);
    calque.querySelectorAll("[data-c]").forEach((b) => b.classList.toggle("on", !gomme && b.dataset.c === couleur));
    calque.querySelectorAll("[data-t]").forEach((b) => b.classList.toggle("on", +b.dataset.t === taille));
    calque.querySelector("[data-a=gomme]").classList.toggle("on", gomme);
    calque.querySelector("[data-a=main]").classList.toggle("on", main);
  };
  btn.onclick = () => (calque ? fermer() : ouvrir());
  return fermer;
}
