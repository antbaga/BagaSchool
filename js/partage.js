// « Partager ma journée » : un lien pour le ou la remplaçante, l'AESH ou un collègue.
//
// - L'app fabrique un instantané de la journée (emploi du temps, contenus, consignes, élèves choisis).
// - Avec un compte : l'instantané est chiffré ici (AES-GCM 256 bits), envoyé chiffré au serveur, et la clé
//   reste dans la partie « # » du lien, que le navigateur n'envoie jamais. Le lien expire et peut être supprimé.
// - Sans compte : tout l'instantané est dans la partie « # » du lien (rien n'est envoyé nulle part) ;
//   il affiche « expiré » après la date choisie mais ne peut pas être supprimé.
// - Les élèves : prénoms seulement, et seulement ceux que l'enseignant coche. Les besoins particuliers sont
//   notés sur l'appareil (collection « eleves », jamais synchronisée).

// ---------- encodage ----------
const b64u = (buf) => { let s = ""; for (const b of new Uint8Array(buf)) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const deb64u = (s) => { const t = atob(s.replace(/-/g, "+").replace(/_/g, "/")); const u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; };
const peutCompresser = () => typeof CompressionStream === "function" && typeof DecompressionStream === "function";
async function flux(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
async function emballer(obj) { // → { z: bool, bytes }
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (!peutCompresser()) return { z: false, bytes };
  return { z: true, bytes: await flux(bytes, new CompressionStream("deflate-raw")) };
}
async function deballer(z, bytes) {
  const raw = z ? await flux(bytes, new DecompressionStream("deflate-raw")) : bytes;
  return JSON.parse(new TextDecoder().decode(raw));
}

// Chiffre : renvoie { contenu (pour le serveur), cle (pour le lien) }. Format du contenu : "1z.<iv>.<chiffré>".
export async function chiffrer(obj) {
  const { z, bytes } = await emballer(obj);
  const brute = crypto.getRandomValues(new Uint8Array(32));
  const cle = await crypto.subtle.importKey("raw", brute, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cle, bytes);
  return { contenu: `1${z ? "z" : ""}.${b64u(iv)}.${b64u(ct)}`, cle: b64u(brute) };
}
export async function dechiffrer(contenu, cleTxt) {
  const [ver, iv, ct] = String(contenu).split(".");
  if (!/^1z?$/.test(ver) || !iv || !ct) throw new Error("FORMAT");
  const cle = await crypto.subtle.importKey("raw", deb64u(cleTxt), "AES-GCM", false, ["decrypt"]);
  const bytes = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: deb64u(iv) }, cle, deb64u(ct)));
  return deballer(ver === "1z", bytes);
}
// Lien sans serveur : "~z<données>" (compressé) ou "~p<données>".
export async function versLienAutonome(obj) { const { z, bytes } = await emballer(obj); return `~${z ? "z" : "p"}${b64u(bytes)}`; }
export async function depuisLienAutonome(s) { return deballer(s[1] === "z", deb64u(s.slice(2))); }

// ---------- clés gardées sur cet appareil (pour recopier un lien) ----------
const CLES = "bagaschool-partages-cles";
const lireCles = () => { try { return JSON.parse(localStorage.getItem(CLES)) || {}; } catch { return {}; } };
const garderCle = (id, cle) => { const c = lireCles(); c[id] = cle; localStorage.setItem(CLES, JSON.stringify(c)); };
const oublierCle = (id) => { const c = lireCles(); delete c[id]; localStorage.setItem(CLES, JSON.stringify(c)); };

const base = () => `${location.origin}${location.pathname}`;
const lienServeur = (id, cle) => `${base()}#/voir/${id}.${cle}`;

const POUR = { remplacant: "Remplaçant·e", aesh: "AESH", collegue: "Collègue" };
const DUREES = [[24, "24 h"], [48, "2 jours"], [168, "1 semaine"]];
const INCLURE = [
  ["edt", "Emploi du temps de la journée"],
  ["contenus", "Contenus prévus (cahier journal : objectifs, compétences, différenciation, fiches)"],
  ["fiches", "Déroulement détaillé des fiches"],
  ["devoirs", "Devoirs à donner"],
  ["besoins", "Élèves à besoins particuliers"],
  ["classe", "Liste de la classe (prénoms, pour l'appel)"],
];
const PRESETS = {
  remplacant: { edt: true, contenus: true, fiches: true, devoirs: true, besoins: true, classe: true },
  aesh: { edt: true, contenus: true, fiches: false, devoirs: false, besoins: true, classe: false },
  collegue: { edt: true, contenus: true, fiches: false, devoirs: true, besoins: true, classe: false },
};

// ---------- écran de l'enseignant : #/partager/<date> ----------
export function viewPartager(ctx, dateISO) {
  const { app, state, save, esc, $, $$, fmtLong, capit, addDays, isoLocal, JOURS_JS, prochainJourClasse, fmtCourt, compte, creneauxDuJour, compById } = ctx;
  const date = dateISO || isoLocal(new Date());
  const P = (state.reglages.partage ??= {});
  P.pour ??= "remplacant"; P.heures ??= 48;
  P.inclure = { ...PRESETS[P.pour], ...(P.inclure || {}) };
  const J = (state.journal[date] ??= { creneaux: {}, notes: "" });
  const jour = JOURS_JS[new Date(date + "T12:00").getDay()];
  const slots = creneauxDuJour(date); // emploi du temps, ou horaires adaptés pour ce jour dans le cahier journal
  // Besoins : note propre au partage (el.besoins), sinon les aménagements de la fiche élève ; dispositifs PAP, PAI…
  const dispo = (e) => e.fiche?.dispositifs ?? [];
  const note = (e) => e.besoins ?? e.fiche?.amenagements ?? "";
  const aBesoins = (e) => note(e).trim() || dispo(e).length;
  const coches = new Set(state.eleves.filter(aBesoins).map((e) => e.id)), ajoutes = new Set();

  const rendreEleves = () => {
    const liste = state.eleves.filter((e) => aBesoins(e) || ajoutes.has(e.id));
    const autres = state.eleves.filter((e) => !liste.includes(e));
    return `${liste.map((e) => `<div class="pt-eleve">
        <label class="pt-check"><input type="checkbox" data-incl="${e.id}" ${coches.has(e.id) ? "checked" : ""}> <b>${esc(e.prenom)}</b>${dispo(e).map((d) => ` <span class="pt-dispo">${esc(d)}</span>`).join("")}</label>
        <textarea data-besoin="${e.id}" rows="2" placeholder="ex. Placé devant, consignes reformulées à l'oral. PAI : ventoline dans le tiroir du bureau.">${esc(note(e))}</textarea>
      </div>`).join("") || `<p class="hint">Aucun élève noté pour l'instant.</p>`}
      ${state.eleves.length ? (autres.length ? `<div class="row"><select id="ptAjout"><option value="">+ Ajouter un élève…</option>${autres.map((e) => `<option value="${e.id}">${esc(e.prenom)}</option>`).join("")}</select></div>` : "")
        : `<p class="hint">Ajoute d'abord tes élèves dans <a href="#/classe">Mes élèves</a> (prénoms seulement).</p>`}`;
  };

  app.innerHTML = `
    <div class="toolbar no-print"><a class="pill" href="#/journal/${date}">← Cahier journal</a></div>
    <div class="sheet partage">
      <h2>👥 Partager ma journée</h2>
      <p class="intro">Un lien à envoyer à la personne qui te remplace, à l'AESH ou à un collègue. Il s'ouvre dans n'importe quel navigateur, sans compte, et s'arrête tout seul.</p>
      <div class="row wrap">
        <label>Jour<input type="date" id="ptDate" value="${date}"></label>
        <div class="field"><span class="field-label">Pour</span><div class="seg" id="ptPour">${Object.entries(POUR).map(([k, v]) => `<button type="button" data-pour="${k}" class="${P.pour === k ? "on" : ""}">${v}</button>`).join("")}</div></div>
      </div>
      <p class="banner-soft">${esc(capit(fmtLong(date)))} · ${slots.length ? `${slots.length} créneau${slots.length > 1 ? "x" : ""} dans l'emploi du temps` : `aucun créneau le ${jour.toLowerCase()} (<a href="#/edt">emploi du temps</a>)`}</p>
      <div class="row wrap">
        <label class="grow">Ton nom, tel qu'il s'affichera<input id="ptNom" value="${esc(P.nom || "")}" placeholder="ex. Mme Martin"></label>
        <label class="grow">Classe<input id="ptClasse" value="${esc(P.classe || "")}" placeholder="ex. CE2, école Jules-Ferry"></label>
      </div>
      <label>Consignes de la classe (gardées pour les prochaines fois)<textarea id="ptConsignes" rows="5" placeholder="ex. Les clés sont dans le tiroir du bureau. Service de cour le mardi matin. Sortie à 16 h 30 par le portail bleu. Le cahier de liaison est dans le casier.">${esc(P.consignes || "")}</textarea></label>
      <label>Pour ce jour-là<textarea id="ptJour" rows="3" placeholder="ex. Sortie bibliothèque à 14 h, la maman de Léa accompagne.">${esc(J.pourRemplacant || "")}</textarea></label>
      <p class="hint">Les informations sur les élèves vont dans la partie « Élèves » ci-dessous : elles restent sur cet appareil.</p>

      <h3>Ce que le lien contient</h3>
      <div class="pt-inclure">${INCLURE.map(([k, v]) => `<label class="pt-check"><input type="checkbox" data-inc="${k}" ${P.inclure[k] ? "checked" : ""}> ${v}</label>`).join("")}</div>

      <div id="ptBesoinsBox" ${P.inclure.besoins ? "" : "hidden"}>
        <h3>Élèves à besoins particuliers</h3>
        <p class="hint">Prénoms seulement. Repris de la fiche de chaque élève (dispositifs, aménagements) ; tu peux adapter le texte pour ce lien. Il reste sur cet appareil ; seuls les élèves cochés vont dans le lien.</p>
        <div id="ptEleves">${rendreEleves()}</div>
      </div>

      <h3>Durée du lien</h3>
      <div class="seg" id="ptDuree">${DUREES.map(([h, t]) => `<button type="button" data-h="${h}" class="${P.heures === h ? "on" : ""}">${t}</button>`).join("")}</div>
      <div class="actions"><button class="ghost" id="ptApercu">Aperçu</button><button class="primary" id="ptCreer">Créer le lien</button></div>
      <div id="ptResultat"></div>
      <div id="ptMiens"></div>
    </div>`;

  const sauver = () => save("reglages");
  $("#ptDate").onchange = (e) => { if (e.target.value) location.hash = `#/partager/${e.target.value}`; };
  $("#ptPour").onclick = (e) => {
    const b = e.target.closest("[data-pour]"); if (!b) return;
    P.pour = b.dataset.pour; P.inclure = { ...PRESETS[P.pour] }; sauver(); viewPartager(ctx, date);
  };
  $("#ptDuree").onclick = (e) => { const b = e.target.closest("[data-h]"); if (!b) return; P.heures = +b.dataset.h; sauver(); $$("#ptDuree button").forEach((x) => x.classList.toggle("on", x === b)); };
  app.oninput = (e) => {
    const t = e.target;
    if (t.id === "ptNom") { P.nom = t.value; sauver(); }
    if (t.id === "ptClasse") { P.classe = t.value; sauver(); }
    if (t.id === "ptConsignes") { P.consignes = t.value; sauver(); }
    if (t.id === "ptJour") { J.pourRemplacant = t.value; save("journal"); }
    if (t.dataset.besoin) { const el = state.eleves.find((x) => x.id === t.dataset.besoin); if (el) { el.besoins = t.value; save("eleves"); } }
  };
  app.onchange = (e) => {
    const t = e.target;
    if (t.dataset.inc) { P.inclure[t.dataset.inc] = t.checked; sauver(); if (t.dataset.inc === "besoins") $("#ptBesoinsBox").hidden = !t.checked; }
    if (t.dataset.incl) { t.checked ? coches.add(t.dataset.incl) : coches.delete(t.dataset.incl); }
    if (t.id === "ptAjout" && t.value) {
      const el = state.eleves.find((x) => x.id === t.value); ajoutes.add(el.id); coches.add(el.id);
      $("#ptEleves").innerHTML = rendreEleves(); $(`[data-besoin="${el.id}"]`)?.focus();
    }
  };

  const instantane = () => {
    const I = P.inclure, devoirsPour = prochainJourClasse(date);
    return {
      v: 1, pour: P.pour, date, nom: P.nom?.trim() || "", classe: P.classe?.trim() || "",
      exp: new Date(Date.now() + P.heures * 3600e3).toISOString(),
      consignes: P.consignes?.trim() || "", consignesJour: J.pourRemplacant?.trim() || "",
      creneaux: I.edt ? slots.map((s) => {
        const c = J.creneaux?.[s.id] ?? {}, f = I.contenus && c.ficheId ? state.fiches.find((x) => x.id === c.ficheId) : null;
        return {
          debut: s.debut, fin: s.fin, discipline: s.discipline || "", libelle: s.libelle || "", couleur: s.couleur || "",
          notes: I.contenus ? c.notes?.trim() || "" : "",
          // objectif, compétences et différenciation de la séance (cahier journal, même sans fiche)
          objectif: I.contenus ? c.objectif?.trim() || "" : "",
          competences: I.contenus ? (c.competences ?? []).map((id) => compById?.[id]?.texte).filter(Boolean) : [],
          differenciation: I.contenus ? c.differenciation?.trim() || "" : "",
          fiche: f ? { titre: f.titre, objectif: f.objectif || "", ...(I.fiches ? { materiel: f.materiel || "", differenciation: f.differenciation || "",
            phases: (f.phases || []).filter((p) => p.phase || p.type || p.titre || p.deroulement).map((p) => ({ duree: p.duree || "", phase: p.phase || [p.type, p.titre].filter(Boolean).join(" : "), deroulement: [p.deroulement, p.differenciation?.trim() && `Différenciation : ${p.differenciation.trim()}`].filter(Boolean).join("\n"), modalite: [p.modalite, p.forme].filter(Boolean).join(", ") })) } : {}) } : null,
        };
      }) : [],
      devoirs: I.devoirs ? { pour: devoirsPour, liste: (state.devoirs[devoirsPour] ?? []).map((d) => ({ discipline: d.discipline || "", texte: d.texte })) } : null,
      besoins: I.besoins ? state.eleves.filter((e) => coches.has(e.id) && aBesoins(e)).map((e) => ({ prenom: e.prenom, dispositifs: dispo(e), besoins: note(e).trim() })) : [],
      eleves: I.classe ? state.eleves.map((e) => e.prenom) : [],
    };
  };

  $("#ptApercu").onclick = async () => { location.hash = `#/voir/${await versLienAutonome({ ...instantane(), apercu: true })}`; };
  $("#ptCreer").onclick = async (e) => {
    const btn = e.currentTarget, out = $("#ptResultat"); btn.disabled = true;
    try {
      const data = instantane();
      const connecte = compte.configure() && (await compte.session().catch(() => null));
      let lien, autonome = false;
      if (connecte) {
        const { contenu, cle } = await chiffrer(data);
        let id = null;
        try { id = await compte.partages.creer(contenu, P.heures, date); }
        catch (err) { if (!/creer_partage|partages|PGRST|schema cache/i.test(String(err?.message))) throw err; } // serveur pas encore prêt : lien autonome
        if (id) { garderCle(id, cle); lien = lienServeur(id, cle); }
        else { lien = `${base()}#/voir/${await versLienAutonome(data)}`; autonome = true; }
      } else { lien = `${base()}#/voir/${await versLienAutonome(data)}`; autonome = true; }
      afficherLien(ctx, out, lien, data, autonome);
      chargerMiens();
    } catch (err) { out.innerHTML = `<p class="err">${esc(compte.messageErreur(err))}</p>`; }
    btn.disabled = false;
  };

  async function chargerMiens() {
    const box = $("#ptMiens"); if (!box || !compte.configure() || !(await compte.session().catch(() => null))) return;
    let liste; try { liste = await compte.partages.miens(); } catch { return; }
    const cles = lireCles();
    box.innerHTML = liste.length ? `<h3>Mes liens actifs</h3><ul class="pt-miens">${liste.map((p) => `<li>
        <span><b>${p.jour ? esc(capit(fmtLong(p.jour))) : "Journée"}</b><br><span class="hint">expire le ${esc(new Date(p.expire_le).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))}</span></span>
        ${cles[p.id] ? `<button class="ghost small" data-copier="${p.id}">Copier</button>` : ""}<button class="ghost small danger" data-suppr="${p.id}">Supprimer</button></li>`).join("")}</ul>
      <p class="hint">Supprimer un lien le rend illisible tout de suite, même pour quelqu'un qui l'a déjà reçu.</p>` : "";
    box.onclick = async (e) => {
      const c = e.target.closest("[data-copier]"), s = e.target.closest("[data-suppr]");
      if (c) { await navigator.clipboard?.writeText(lienServeur(c.dataset.copier, lireCles()[c.dataset.copier])).catch(() => {}); c.textContent = "Copié ✓"; }
      if (s && confirm("Supprimer ce lien ? La personne ne pourra plus l'ouvrir.")) {
        try { await compte.partages.supprimer(s.dataset.suppr); oublierCle(s.dataset.suppr); chargerMiens(); } catch (err) { alert(compte.messageErreur(err)); }
      }
    };
  }
  chargerMiens();
}

function afficherLien(ctx, out, lien, data, autonome) {
  const { esc, qrcode } = ctx;
  let qr = "";
  try { const q = qrcode(0, "L"); q.addData(lien); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch { /* lien trop long pour un QR code */ }
  const fin = new Date(data.exp).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  out.innerHTML = `<div class="pt-lien">
    <p><b>Lien prêt ✓</b> Il s'arrête le ${esc(fin)}.</p>
    <input readonly value="${esc(lien)}" id="ptUrl">
    <div class="actions"><button class="primary" id="ptCopie">Copier le lien</button>${navigator.share ? `<button class="ghost" id="ptShare">Envoyer…</button>` : ""}<a class="btn ghost" href="${esc(lien)}" target="_blank" rel="noopener">Ouvrir</a></div>
    ${qr ? `<div class="qr pt-qr">${qr}</div><p class="hint">À scanner avec l'appareil photo du téléphone.</p>` : ""}
    <p class="hint">${autonome
      ? "Sans compte, toute la journée est dans le lien lui-même : rien n'est envoyé sur internet, mais le lien ne peut pas être supprimé (il affiche « expiré » après la date). Connecte-toi pour des liens que tu peux supprimer."
      : "La journée est chiffrée sur ton appareil. Le serveur ne garde qu'un contenu illisible ; la clé n'existe que dans ce lien. Envoie-le seulement à la personne concernée."}</p>
  </div>`;
  out.querySelector("#ptCopie").onclick = async (e) => {
    try { await navigator.clipboard.writeText(lien); } catch { const i = out.querySelector("#ptUrl"); i.select(); document.execCommand("copy"); }
    e.currentTarget.textContent = "Copié ✓";
  };
  out.querySelector("#ptShare")?.addEventListener("click", () => navigator.share({ title: "Ma journée de classe", text: `Ma journée de classe${data.nom ? ` (${data.nom})` : ""} :`, url: lien }).catch(() => {}));
  out.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---------- vue de la personne qui reçoit le lien : #/voir/<id>.<clé> ou #/voir/~<données> ----------
export async function viewVoir(ctx, code) {
  const { app, esc, fmtLong, capit, fmtCourt, compte } = ctx;
  const erreur = (titre, txt) => { app.innerHTML = `<div class="sheet voir"><h2>${titre}</h2><p>${txt}</p></div>`; };
  if (!code) return erreur("Lien incomplet", "Ce lien n'est pas complet. Demande à l'enseignant·e de te le renvoyer.");
  app.innerHTML = `<div class="sheet voir"><p class="hint">Ouverture de la journée…</p></div>`;
  let d;
  try {
    if (code.startsWith("~")) d = await depuisLienAutonome(code);
    else {
      const [id, cle] = code.split(".");
      if (!id || !cle) return erreur("Lien incomplet", "Ce lien n'est pas complet (il manque la fin). Copie-le en entier.");
      if (!compte.configure()) return erreur("Lien indisponible", "Cette version de BagaSchool ne peut pas ouvrir ce lien.");
      const r = await compte.partages.lire(id);
      if (!r) return erreur("Lien expiré", "Ce lien a expiré ou a été supprimé par l'enseignant·e. Demande-lui un nouveau lien.");
      d = await dechiffrer(r.contenu, cle);
    }
  } catch (e) {
    if (/failed to fetch|network|load failed/i.test(String(e?.message))) return erreur("Pas de connexion", "Il faut internet pour ouvrir ce lien. Réessaie quand tu es en ligne.");
    return erreur("Lien illisible", "Ce lien est abîmé ou incomplet. Copie-le en entier, ou demande-en un nouveau.");
  }
  if (!d.apercu && d.exp && new Date(d.exp) < new Date()) return erreur("Lien expiré", "Ce lien a expiré. Demande un nouveau lien à l'enseignant·e.");
  document.title = `Journée du ${fmtCourt(d.date)} · BagaSchool`;
  const multi = (t) => esc(t).replace(/\n/g, "<br>");
  const fin = d.exp ? new Date(d.exp).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "";
  app.innerHTML = `
    ${d.apercu ? `<div class="banner-soft no-print">👀 Aperçu : c'est ce que verra la personne. <a href="#/partager/${esc(d.date)}">Revenir au partage</a></div>` : ""}
    <div class="sheet voir">
      <p class="voir-pour">${esc(POUR[d.pour] || "")}${d.nom || d.classe ? ` · ${[d.nom, d.classe].filter(Boolean).map(esc).join(" · ")}` : ""}</p>
      <h2>${esc(capit(fmtLong(d.date)))}</h2>
      <div class="toolbar no-print"><button class="ghost" onclick="print()">🖨️ Imprimer</button>${fin ? `<span class="hint">Lien valable jusqu'au ${esc(fin)}</span>` : ""}</div>
      ${d.consignesJour ? `<section class="voir-bloc voir-jour"><h3>📌 Aujourd'hui</h3><p>${multi(d.consignesJour)}</p></section>` : ""}
      ${d.consignes ? `<section class="voir-bloc"><h3>📋 Consignes de la classe</h3><p>${multi(d.consignes)}</p></section>` : ""}
      ${d.besoins?.length ? `<section class="voir-bloc voir-besoins"><h3>💛 Élèves à besoins particuliers</h3><ul>${d.besoins.map((b) => `<li><b>${esc(b.prenom)}</b>${(b.dispositifs || []).map((x) => ` <span class="pt-dispo">${esc(x)}</span>`).join("")}${b.besoins ? ` : ${multi(b.besoins)}` : ""}</li>`).join("")}</ul></section>` : ""}
      ${d.creneaux?.length ? `<section class="voir-bloc"><h3>🕘 Déroulé de la journée</h3><ol class="voir-edt">${d.creneaux.map((c) => `
        <li style="--c:${/^#[0-9a-f]{3,8}$/i.test(c.couleur) ? c.couleur : "#e5e5e5"}">
          <span class="voir-h">${esc(c.debut)}<br><span class="hint">${esc(c.fin)}</span></span>
          <div><b>${esc(c.discipline)}</b>${c.libelle ? ` · ${esc(c.libelle)}` : ""}
            ${c.fiche ? `<div class="voir-fiche"><b>${esc(c.fiche.titre)}</b>${c.fiche.objectif && !c.objectif ? `<br>Objectif : ${multi(c.fiche.objectif)}` : ""}</div>` : ""}
            ${c.objectif ? `<p>🎯 <b>Objectif :</b> ${multi(c.objectif)}</p>` : ""}
            ${c.competences?.length ? `<ul class="voir-comp">${c.competences.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
            ${c.differenciation ? `<p><b>Différenciation :</b> ${multi(c.differenciation)}</p>` : ""}
            ${c.notes ? `<p>${multi(c.notes)}</p>` : ""}
            ${c.fiche?.phases?.length || c.fiche?.materiel || c.fiche?.differenciation ? `<details class="voir-details"><summary>Déroulement détaillé</summary>
              ${c.fiche.materiel ? `<p><b>Matériel :</b> ${multi(c.fiche.materiel)}</p>` : ""}
              ${c.fiche.phases?.length ? `<table class="items"><tbody>${c.fiche.phases.map((p) => `<tr><td class="hint">${esc(p.duree)}</td><td><b>${esc(p.phase)}</b>${p.modalite ? ` <span class="hint">(${esc(p.modalite)})</span>` : ""}${p.deroulement ? `<br>${multi(p.deroulement)}` : ""}</td></tr>`).join("")}</tbody></table>` : ""}
              ${c.fiche.differenciation ? `<p><b>Différenciation :</b> ${multi(c.fiche.differenciation)}</p>` : ""}
            </details>` : ""}
          </div></li>`).join("")}</ol></section>` : ""}
      ${d.devoirs?.liste?.length ? `<section class="voir-bloc"><h3>📚 Devoirs à donner pour le ${esc(fmtCourt(d.devoirs.pour))}</h3><ul>${d.devoirs.liste.map((x) => `<li>${x.discipline ? `<b>${esc(x.discipline)}</b> : ` : ""}${esc(x.texte)}</li>`).join("")}</ul></section>` : ""}
      ${d.eleves?.length ? `<section class="voir-bloc"><h3>👧 La classe (${d.eleves.length})</h3><p class="voir-classe">${d.eleves.map(esc).join(" · ")}</p></section>` : ""}
      <p class="hint voir-pied">Partagé avec BagaSchool. Merci de ne pas transférer ce lien.</p>
    </div>`;
}
