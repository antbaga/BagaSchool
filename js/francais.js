// Français « En classe », du CP au CM2 : Mots baladeurs (étiquettes à déplacer), Homophones, Accords.
// Même format que outils.js : { id, nom, icone, couleur, desc, mount(el, ctx) -> cleanup }.
// Les contenus par niveau sont dans les tableaux ci-dessous, pour être relus et complétés facilement.
import { niveauJeux, segNiveau, surNiveau, rang, NIVEAUX_JEUX } from "./niveau.js";

const hasard = (n) => Math.floor(Math.random() * n);
const melange = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = hasard(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uidF = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const escF = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Glisser-déposer au doigt, au stylet ou à la souris. Le « toucher puis toucher » reste possible.
// source : sélecteur des éléments à glisser (data-k), cible : sélecteur des zones de dépôt.
function glisser(el, { source, cible, deposer }) {
  let drag = null;
  el.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(source); if (!b) return;
    drag = { k: b.dataset.k, x: e.clientX, y: e.clientY, ghost: null, src: b };
  });
  el.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
      drag.ghost = drag.src.cloneNode(true); drag.ghost.classList.add("etq-ghost"); drag.ghost.classList.remove("on"); document.body.appendChild(drag.ghost);
      drag.src.style.opacity = ".3";
    }
    if (drag.ghost) { e.preventDefault(); drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px"; }
  });
  const fin = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.ghost) return;
    d.ghost.remove(); d.src.style.opacity = "";
    const c = document.elementFromPoint(e.clientX, e.clientY)?.closest(cible);
    el._dragFini = true; setTimeout(() => { el._dragFini = false; }, 0);
    deposer(d.k, c);
  };
  el.addEventListener("pointerup", fin); el.addEventListener("pointercancel", fin);
  return () => { drag?.ghost?.remove(); };
}

// =====================================================================
// MOTS BALADEURS (anciennement « Étiquettes à déplacer »)
// Trois sortes d'activités :
//  - trous : phrases à trous, les mots à trouver entre crochets ;
//  - ordre : mots d'une phrase à remettre dans l'ordre ;
//  - tri   : étiquettes à ranger dans des colonnes (« Noms : chat, table »).
// =====================================================================
const ETQ_KEY = "bagaschool-etiquettes";
const A = (niv, nom, mode, texte, intrus = "") => ({ niv, nom, mode, texte, intrus });
export const ETQ_NIVEAUX = [
  // CP
  A("CP", "Remettre la phrase dans l'ordre", "ordre", "Le chat dort.\nJe lis un livre.\nPapa fait un gâteau.\nLa poule pond un œuf."),
  A("CP", "Un ou une ?", "trous", "J'ai [un] vélo rouge.\nC'est [une] jolie fleur.\nIl mange [une] pomme.\nNous avons [un] chien.", "un, une"),
  A("CP", "Le, la ou les ?", "trous", "[Le] lapin mange.\n[La] maison est grande.\n[Les] oiseaux chantent.\nJe vois [la] lune.", "le, les"),
  A("CP", "Le bon mot", "trous", "La [vache] donne du lait.\nLe [chat] attrape la souris.\nL'[abeille] fait du miel.\nLe [poisson] nage dans l'eau.", "poule, lapin"),
  A("CP", "Animaux ou fruits ?", "tri", "Animaux : chat, lion, poule, lapin\nFruits : pomme, poire, banane, fraise"),
  // CE1
  A("CE1", "a / à", "trous", "Léo [a] un chien.\nIl va [à] l'école.\nElle [a] mal [à] la tête.\nMon frère [a] sept ans."),
  A("CE1", "et / est", "trous", "Le ciel [est] bleu [et] le soleil brille.\nMa sœur [est] grande.\nJ'ai un stylo [et] une règle."),
  A("CE1", "son / sont", "trous", "Les enfants [sont] dans la cour.\nLéa range [son] cartable.\nOù [sont] mes clés ?"),
  A("CE1", "Noms ou verbes ?", "tri", "Noms : maison, chien, école, ballon\nVerbes : courir, manger, chanter, dormir"),
  A("CE1", "Un seul ou plusieurs ?", "tri", "Singulier : le chat, une fleur, mon vélo, la table\nPluriel : les chats, des fleurs, mes vélos, trois tables"),
  A("CE1", "Remettre la phrase dans l'ordre", "ordre", "Les élèves jouent dans la cour.\nLe petit chat boit du lait.\nMa grand-mère prépare une soupe."),
  // CE2
  A("CE2", "on / ont", "trous", "[On] va au parc.\nMes cousins [ont] un chien.\nIls [ont] froid, alors [on] ferme la fenêtre."),
  A("CE2", "la / là", "trous", "Pose ton sac [là].\n[La] maîtresse lit une histoire.\nViens [là], s'il te plaît !"),
  A("CE2", "Accorder le verbe", "trous", "Les oiseaux [chantent] dans l'arbre.\nNous [jouons] aux billes.\nTu [finis] ton dessin.\nMa sœur [lit] un livre.", "chante, jouent, finit, lisent"),
  A("CE2", "Nom, verbe, adjectif ou déterminant ?", "tri", "Noms : jardin, maîtresse, voiture\nVerbes : sauter, écrire, regarder\nAdjectifs : rapide, petit, joli\nDéterminants : le, une, des"),
  A("CE2", "Mots variables ou invariables ?", "tri", "Variables : chat, grand, mangeait, la, belle\nInvariables : et, très, sous, souvent, avec"),
  // CM1
  A("CM1", "ces / ses", "trous", "Léo range [ses] affaires.\n[Ces] fleurs sentent bon.\nLe chat lèche [ses] pattes."),
  A("CM1", "ce / se", "trous", "Le chat [se] cache sous le lit.\n[Ce] livre est passionnant.\nIls [se] lavent les mains."),
  A("CM1", "la / là / l'a", "trous", "Ferme [la] porte.\nSon vélo ? Il [l'a] réparé hier.\nJe t'attends [là]."),
  A("CM1", "Les classes de mots", "tri", "Noms : forêt, courage, Paris\nVerbes : partir, avons, finissait\nAdjectifs : immense, sombre, heureux\nDéterminants : cette, leurs, quelques\nPronoms : il, nous, elles"),
  A("CM1", "Mots invariables", "tri", "Adverbes : lentement, toujours, ici\nConjonctions de coordination : mais, ou, et, donc, or, ni, car"),
  A("CM1", "Accorder dans le groupe nominal", "trous", "Des chevaux [blancs] galopent.\nUne [grande] maison [blanche].\nLes [vieux] arbres sont [immenses].", "blanc, grand, blanches, vieille, immense"),
  // CM2
  A("CM2", "c'est / s'est", "trous", "[C'est] mon anniversaire !\nIl [s'est] levé très tôt.\nLe vase [s'est] cassé et [c'est] dommage."),
  A("CM2", "leur / leurs", "trous", "Les élèves rangent [leurs] cahiers.\nJe [leur] parle tous les jours.\nLes oiseaux construisent [leur] nid."),
  A("CM2", "Participe passé avec être", "trous", "Elles sont [parties] tôt.\nMon frère est [tombé] de vélo.\nLes lettres sont [arrivées] hier.", "parti, partis, tombée, arrivés"),
  A("CM2", "Mots variables ou invariables ?", "tri", "Variables : nuage, lumineux, leurs, chantions, nous\nInvariables : lentement, pourtant, malgré, mais, hier"),
  A("CM2", "Les classes de mots invariables", "tri", "Adverbes : rapidement, souvent, très\nPrépositions : avec, sous, pendant\nConjonctions de subordination : quand, parce que, si"),
];
// Ancien jeu d'exemples (v0.7) : sert à reconnaître les activités jamais modifiées et à ne pas les doublonner.
const ANCIENS_EXEMPLES = ["a / à", "et / est", "Les animaux", "Remettre dans l'ordre"];

function mots(el) {
  let perso; try { perso = JSON.parse(localStorage.getItem(ETQ_KEY)) || []; } catch { perso = []; }
  // Les activités d'exemple de la v0.7 sont maintenant rangées par niveau : on retire celles jamais modifiées.
  const anciens = new Set(["Léo [a] un chien.\nIl va [à] l'école.\nElle [a] mal [à] la tête.", "Le ciel [est] bleu [et] le soleil brille.\nMa sœur [est] grande.\nJ'ai un stylo [et] une règle.", "La [vache] donne du lait.\nLe [chat] attrape la souris.\nL'[abeille] fait du miel.", "Le petit chat boit du lait.\nLes élèves jouent dans la cour."]);
  perso = perso.filter((s) => !(ANCIENS_EXEMPLES.includes(s.nom) && anciens.has(s.texte)));
  const garder = () => localStorage.setItem(ETQ_KEY, JSON.stringify(perso));
  garder();
  let niv = niveauJeux(), cle = null, edition = false, choisie = null, verif = false, place = {}, banque = [], trous = [], cats = [];
  const duNiveau = () => ETQ_NIVEAUX.filter((a) => a.niv === niv);
  // cle : "n3" (3e activité du niveau) ou "p<id>" (activité de l'enseignante)
  const S = () => {
    if (cle?.startsWith("p")) { const p = perso.find((x) => "p" + x.id === cle); if (p) return p; }
    if (cle?.startsWith("n")) { const a = duNiveau()[+cle.slice(1)]; if (a) return a; }
    cle = "n0"; return duNiveau()[0];
  };
  const estPerso = () => cle?.startsWith("p");
  const lignesDe = (s) => s.texte.split("\n").map((l) => l.trim()).filter(Boolean);
  const preparer = () => {
    const s = S(); trous = []; cats = []; place = {}; choisie = null; verif = false;
    const lignes = lignesDe(s);
    let reps = [];
    if (s.mode === "ordre") lignes.forEach((l, li) => l.split(/\s+/).forEach((m) => trous.push({ li, rep: m })));
    else if (s.mode === "tri") {
      lignes.forEach((l) => { const i = l.indexOf(":"); if (i < 0) return; const nom = l.slice(0, i).trim(); const ms = l.slice(i + 1).split(",").map((x) => x.trim()).filter(Boolean); if (nom && ms.length) cats.push({ nom, ms }); });
      reps = cats.flatMap((c, ci) => c.ms.map((m) => ({ txt: m, ci })));
    } else lignes.forEach((l, li) => { for (const m of l.matchAll(/\[([^\]]+)\]/g)) trous.push({ li, rep: m[1].trim() }); });
    if (s.mode === "tri") { banque = melange(reps).map((r, k) => ({ k, ...r })); return; }
    const intrus = (s.intrus || "").split(",").map((x) => x.trim()).filter(Boolean);
    banque = melange([...trous.map((t) => t.rep), ...intrus]).map((txt, k) => ({ k, txt }));
  };
  const utilisee = (k) => Object.values(place).includes(k);
  const ligneHTML = (l, li) => {
    const s = S();
    const slot = (ti) => {
      const k = place[ti], t = trous[ti];
      const etat = verif ? (k != null && banque[k].txt === t.rep ? "good" : "bad") : "";
      return `<button class="etq-slot ${k != null ? "plein" : ""} ${etat}" data-slot="${ti}" aria-label="Case ${ti + 1}">${k != null ? escF(banque[k].txt) : "&nbsp;"}</button>`;
    };
    const ids = trous.map((t, ti) => [t, ti]).filter(([t]) => t.li === li).map(([, ti]) => ti);
    if (s.mode === "ordre") return ids.map(slot).join(" ");
    let n = 0;
    return escF(l).replace(/\[([^\]]+)\]/g, () => slot(ids[n++]));
  };
  const toutJuste = () => {
    if (S().mode === "tri") return banque.length && banque.every((b) => place[b.k] === b.ci);
    return trous.length && trous.every((t, ti) => place[ti] != null && banque[place[ti]].txt === t.rep);
  };
  const plateau = () => {
    const s = S();
    if (s.mode === "tri") {
      return `<div class="etq-cols" style="--n:${cats.length}">${cats.map((c, ci) => `
          <button class="etq-col" data-col="${ci}"><span class="etq-col-t">${escF(c.nom)}</span>
            <span class="etq-col-in">${banque.filter((b) => place[b.k] === ci).map((b) => `<span class="etq mini-etq ${verif ? (b.ci === ci ? "good" : "bad") : ""}" data-k="${b.k}" data-pris="1">${escF(b.txt)}</span>`).join("")}</span></button>`).join("")}</div>
        <div class="etq-banque">${banque.filter((b) => place[b.k] == null).map((b) => `<button class="etq ${choisie === b.k ? "on" : ""}" data-k="${b.k}">${escF(b.txt)}</button>`).join("")}</div>`;
    }
    return `<div class="etq-lignes">${lignesDe(s).map((l, li) => `<p class="etq-ligne">${ligneHTML(l, li)}</p>`).join("")}</div>
      <div class="etq-banque">${banque.map((b) => utilisee(b.k) ? "" : `<button class="etq ${choisie === b.k ? "on" : ""}" data-k="${b.k}">${escF(b.txt)}</button>`).join("")}</div>`;
  };
  const aideEdition = (m) => m === "trous" ? " : mets les mots à trouver entre crochets, par exemple <code>Le chat [mange] la souris.</code>"
    : m === "tri" ? " : une colonne par ligne, son titre puis deux-points et les mots séparés par des virgules, par exemple <code>Noms : chat, table</code>"
    : " : les mots de chaque phrase seront mélangés";
  const render = () => {
    const s = S();
    if (edition) {
      el.innerHTML = `
        <div class="tool-top wrap"><button class="pill" id="fin">✓ Terminé</button><button class="pill" id="suppr">Supprimer cette activité</button></div>
        <div class="card etq-edit">
          <label>Nom <input id="e-nom" value="${escF(s.nom)}"></label>
          <div class="seg"><button data-emode="trous" class="${s.mode === "trous" ? "on" : ""}">Phrases à trous</button><button data-emode="ordre" class="${s.mode === "ordre" ? "on" : ""}">Mots à remettre dans l'ordre</button><button data-emode="tri" class="${s.mode === "tri" ? "on" : ""}">Ranger en colonnes</button></div>
          <label>${s.mode === "tri" ? "Colonnes" : "Phrases (une par ligne)"}${aideEdition(s.mode)}
            <textarea id="e-txt" rows="6">${escF(s.texte)}</textarea></label>
          ${s.mode === "trous" ? `<label>Étiquettes pièges (séparées par des virgules, facultatif) <input id="e-intrus" value="${escF(s.intrus)}"></label>` : ""}
        </div>`;
      return;
    }
    const juste = toutJuste();
    el.innerHTML = `
      <div class="tool-top wrap">
        ${segNiveau(niv)}
        <select id="set" aria-label="Activité">
          <optgroup label="Activités ${niv}">${duNiveau().map((a, j) => `<option value="n${j}" ${cle === "n" + j ? "selected" : ""}>${escF(a.nom)}</option>`).join("")}</optgroup>
          ${perso.length ? `<optgroup label="Mes activités">${perso.map((p) => `<option value="p${p.id}" ${cle === "p" + p.id ? "selected" : ""}>${escF(p.nom)}</option>`).join("")}</optgroup>` : ""}
        </select>
      </div>
      <div class="tool-top wrap">
        <button class="pill" id="verif">Vérifier</button><button class="pill" id="sol">Solution</button><button class="pill" id="raz">Recommencer</button>
        <span class="grow"></span><button class="pill" id="edit">${estPerso() ? "✏️ Modifier" : "✏️ Copier et modifier"}</button><button class="pill" id="nouv">+ Nouvelle activité</button>
      </div>
      <div class="etq-board rc-board">
        <p class="etq-consigne">${s.mode === "tri" ? "Range chaque étiquette dans la bonne colonne." : s.mode === "ordre" ? "Remets les mots dans l'ordre pour retrouver la phrase." : "Complète les phrases avec les étiquettes."}</p>
        ${plateau()}
        ${verif ? `<p class="etq-res ${juste ? "good" : "bad"}">${juste ? "Bravo, tout est juste !" : "Il reste des erreurs ou des étiquettes à placer."}</p>` : ""}
      </div>`;
  };
  const poser = (k, ti) => {
    for (const [t, kk] of Object.entries(place)) if (kk === k) delete place[t];
    place[ti] = k; choisie = null; verif = false;
  };
  const finGlisse = glisser(el, {
    source: "[data-k]", cible: "[data-slot],[data-col],.etq-banque",
    deposer: (k, c) => {
      k = +k;
      if (S().mode === "tri") { if (c?.dataset.col != null) place[k] = +c.dataset.col; else if (c?.classList.contains("etq-banque")) delete place[k]; verif = false; }
      else if (c?.dataset.slot != null) poser(k, +c.dataset.slot);
      render();
    },
  });
  el.onclick = (e) => {
    if (el._dragFini) { el._dragFini = false; return; }
    if (surNiveau(e, (n) => { niv = n; cle = "n0"; preparer(); render(); })) return;
    const tri = S()?.mode === "tri";
    const pris = e.target.closest("[data-pris]");
    if (pris) { if (choisie != null) { place[choisie] = place[+pris.dataset.k]; choisie = null; } else delete place[+pris.dataset.k]; verif = false; return render(); }
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.k != null) { const k = +t.dataset.k; choisie = choisie === k ? null : k; return render(); }
    if (t.dataset.col != null) { if (choisie != null) { place[choisie] = +t.dataset.col; choisie = null; verif = false; } return render(); }
    if (t.dataset.slot != null) {
      const ti = +t.dataset.slot;
      if (choisie != null) poser(choisie, ti); else if (place[ti] != null) { delete place[ti]; verif = false; }
      return render();
    }
    if (t.dataset.emode) { S().mode = t.dataset.emode; garder(); return render(); }
    if (t.id === "verif") verif = true;
    if (t.id === "sol") {
      if (tri) banque.forEach((b) => { place[b.k] = b.ci; });
      else { place = {}; const libres = banque.map((b) => b.k); trous.forEach((tr, ti) => { const j = libres.findIndex((k) => banque[k].txt === tr.rep); if (j >= 0) place[ti] = libres.splice(j, 1)[0]; }); }
      verif = true;
    }
    if (t.id === "raz") preparer();
    if (t.id === "edit") {
      if (!estPerso()) { const s = S(); const c = { id: uidF(), nom: `${s.nom} (${niv})`, mode: s.mode, texte: s.texte, intrus: s.intrus || "" }; perso.push(c); cle = "p" + c.id; garder(); }
      edition = true;
    }
    if (t.id === "fin") { edition = false; garder(); preparer(); }
    if (t.id === "nouv") { const c = { id: uidF(), nom: "Nouvelle activité", mode: "trous", texte: "Le chat [mange] la souris.", intrus: "boit, dort" }; perso.push(c); cle = "p" + c.id; edition = true; garder(); preparer(); }
    if (t.id === "suppr" && confirm("Supprimer cette activité ?")) { perso = perso.filter((p) => "p" + p.id !== cle); cle = "n0"; edition = false; garder(); preparer(); }
    render();
  };
  el.onchange = (e) => { if (e.target.id === "set") { cle = e.target.value; preparer(); render(); } };
  el.oninput = (e) => {
    const s = S(); if (!estPerso()) return;
    if (e.target.id === "e-nom") s.nom = e.target.value;
    if (e.target.id === "e-txt") s.texte = e.target.value;
    if (e.target.id === "e-intrus") s.intrus = e.target.value;
    garder();
  };
  preparer(); render();
  return finGlisse;
}

// =====================================================================
// HOMOPHONES : une phrase, un trou, on touche le bon mot. Séries de 10, avec l'astuce de la règle.
// Phrases : le mot à trouver entre crochets. « des » = à partir de quel niveau.
// Les programmes 2024-2025 ne nomment pas d'homophones par niveau : cette progression est un choix
// (rattaché à la chaîne d'accords et aux mots invariables), à ajuster par l'enseignante.
// =====================================================================
export const HOMOPHONES = [
  { id: "a", nom: "a / à", mots: ["a", "à"], des: "CP",
    astuce: "On peut remplacer « a » par « avait » : c'est le verbe avoir. Si on ne peut pas, on écrit « à ».",
    phrases: ["Léo [a] un chien noir.", "Je vais [à] la piscine.", "Maman [a] acheté du pain.", "Il [a] mal [à] la tête.", "Nous allons [à] Paris.", "Ma sœur [a] six ans.", "Elle joue [à] la balle.", "Le chat [a] faim.", "Tom [a] perdu son bonnet.", "J'écris [à] mon ami.", "Ce gâteau [a] l'air délicieux.", "On mange [à] midi."] },
  { id: "et", nom: "et / est", mots: ["et", "est"], des: "CP",
    astuce: "On peut remplacer « est » par « était » : c'est le verbe être. « et » veut dire « et puis ».",
    phrases: ["Le ciel [est] bleu.", "J'aime les pommes [et] les poires.", "Mon frère [est] malade.", "Il [est] grand [et] fort.", "Papa [et] maman arrivent.", "La porte [est] fermée.", "Je prends ma trousse [et] mon cahier.", "Où [est] mon stylo ?", "Ce chien [est] gentil.", "Elle chante [et] elle danse.", "Le lait [est] chaud."] },
  { id: "son", nom: "son / sont", mots: ["son", "sont"], des: "CE1",
    astuce: "On peut remplacer « sont » par « étaient » : c'est le verbe être. « son » se remplace par « mon ».",
    phrases: ["Les enfants [sont] dans la cour.", "Léa range [son] cartable.", "Mes amis [sont] gentils.", "Il cherche [son] chat.", "Les fleurs [sont] belles.", "Où [sont] mes clés ?", "Paul mange [son] goûter.", "Ils [sont] en retard.", "Elle a oublié [son] manteau.", "Les oiseaux [sont] sur le toit."] },
  { id: "on", nom: "on / ont", mots: ["on", "ont"], des: "CE1",
    astuce: "On peut remplacer « ont » par « avaient » : c'est le verbe avoir. « on » se remplace par « il ».",
    phrases: ["[On] va au parc.", "Les élèves [ont] fini leur travail.", "Mes cousins [ont] un chien.", "Ce matin, [on] a fait du sport.", "Ils [ont] froid.", "[On] entend la pluie.", "Les filles [ont] gagné le match.", "Quand [on] lit, [on] apprend.", "Mes parents [ont] une voiture rouge.", "Les chats [ont] dormi toute la journée."] },
  { id: "ou", nom: "ou / où", mots: ["ou", "où"], des: "CE2",
    astuce: "On peut remplacer « ou » par « ou bien ». « où » indique un lieu ou un moment.",
    phrases: ["Tu veux du lait [ou] du jus ?", "[Où] habites-tu ?", "Je ne sais pas [où] est ma gomme.", "Tu préfères le rouge [ou] le bleu ?", "La ville [où] je suis né est petite.", "Viens demain [ou] samedi.", "[Où] vas-tu ?", "Tu préfères lire [ou] dessiner ?", "Le jour [où] il a neigé, nous avons fait un bonhomme.", "C'est vrai [ou] faux ?"] },
  { id: "la", nom: "la / là", mots: ["la", "là"], des: "CE2",
    astuce: "On peut remplacer « là » par « ici ». « la » est devant un nom : on peut dire « une » à la place.",
    phrases: ["Pose ton sac [là].", "[La] maîtresse lit une histoire.", "Je regarde [la] lune.", "Viens [là], s'il te plaît !", "Il est [là] depuis ce matin.", "Ferme [la] porte.", "Par [là], c'est la sortie.", "[La] pluie tombe fort.", "Je mange [la] dernière pomme.", "Mets tes bottes [là], près de [la] porte."] },
  { id: "lal", nom: "la / là / l'a", mots: ["la", "là", "l'a"], des: "CM1",
    astuce: "« l'a » se remplace par « l'avait ». « là » se remplace par « ici ». Sinon, c'est « la », devant un nom.",
    phrases: ["Son vélo ? Il [l'a] réparé hier.", "Cette histoire, la maîtresse [l'a] déjà lue.", "Le ballon ? Tom [l'a] perdu.", "Ferme [la] fenêtre.", "Je t'attends [là].", "Ta lettre, il [l'a] reçue ce matin.", "[La] neige recouvre le jardin.", "Le chat est [là], sous [la] table.", "Ce film, mon frère [l'a] vu deux fois.", "Reste [là] et regarde [la] mer."] },
  { id: "ces", nom: "ces / ses", mots: ["ces", "ses"], des: "CM1",
    astuce: "« ses » veut dire « les siens » (à lui, à elle) : au singulier, c'est « son » ou « sa ». « ces » montre : au singulier, c'est « ce » ou « cette ».",
    phrases: ["Léo range [ses] affaires.", "Regarde [ces] beaux nuages !", "Elle prête [ses] crayons à Lina.", "[Ces] fleurs sentent bon.", "Le chat lèche [ses] pattes.", "J'adore [ces] chaussures-là.", "Mon frère a perdu [ses] lunettes.", "Qui a dessiné [ces] maisons ?", "Elle promène [ses] chiens chaque soir.", "[Ces] exercices sont faciles."] },
  { id: "ce", nom: "ce / se", mots: ["ce", "se"], des: "CM1",
    astuce: "« se » est devant un verbe : on peut dire « me » à la place (il se lave, je me lave). « ce » est devant un nom : on peut dire « cette ».",
    phrases: ["Le chat [se] cache sous le lit.", "[Ce] livre est passionnant.", "Ils [se] lavent les mains.", "J'aime [ce] dessin.", "Elle [se] lève tôt.", "[Ce] matin, il pleut.", "Le soleil [se] couche.", "Regarde [ce] bateau !", "Les enfants [se] mettent en rang.", "Qui a cassé [ce] verre ?"] },
  { id: "cest", nom: "c'est / s'est", mots: ["c'est", "s'est"], des: "CM2",
    astuce: "« c'est » veut dire « cela est ». « s'est » est devant un participe passé : à la 1re personne, on dirait « je me suis ».",
    phrases: ["[C'est] mon anniversaire !", "Il [s'est] levé très tôt.", "[C'est] une belle journée.", "Le chien [s'est] sauvé.", "Regarde, [c'est] la neige !", "Paul [s'est] trompé de chemin.", "[C'est] à toi de jouer.", "Le vase [s'est] cassé.", "Je crois que [c'est] fini.", "Mon cousin [s'est] endormi dans la voiture."] },
  { id: "leur", nom: "leur / leurs", mots: ["leur", "leurs"], des: "CM2",
    astuce: "Devant un verbe, « leur » veut dire « à eux » : il ne prend jamais de s. Devant un nom, « leurs » prend un s si le nom est au pluriel.",
    phrases: ["Les élèves rangent [leurs] cahiers.", "Je [leur] parle tous les jours.", "Ils ont oublié [leur] goûter.", "Mes voisins promènent [leurs] chiens.", "Dis-[leur] de venir.", "Les oiseaux construisent [leur] nid.", "La maîtresse [leur] lit une histoire.", "Mes cousins m'ont prêté [leurs] vélos.", "Nous [leur] avons écrit une lettre.", "Les enfants mettent [leurs] bottes."] },
];
const homosDu = (niv) => HOMOPHONES.filter((h) => rang(h.des) <= rang(niv));

function homophones(el) {
  let niv = niveauJeux(), choix = new Set(), serie = [], i = 0, score = 0, reponses = [], astuce = false, fini = false;
  const dispo = () => homosDu(niv);
  const defaut = () => { const d = dispo(); choix = new Set(d.slice(-2).map((h) => h.id)); };
  // Une question = une phrase et son premier trou encore vide.
  const nouvelleSerie = () => {
    const sel = dispo().filter((h) => choix.has(h.id));
    const pool = melange(sel.flatMap((h) => h.phrases.map((p) => ({ h, p }))));
    serie = pool.slice(0, Math.min(10, pool.length)).map(({ h, p }) => ({ h, p, trous: [...p.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]), faits: [] }));
    i = 0; score = 0; reponses = []; astuce = false; fini = false;
  };
  const Q = () => serie[i];
  const phraseHTML = (q) => {
    let n = 0;
    return escF(q.p).replace(/\[([^\]]+)\]/g, (_, rep) => {
      const k = n++, fait = q.faits[k];
      if (fait) return fait.ok ? `<span class="homo-mot good">${rep}</span>` : `<span class="homo-mot bad"><s>${escF(fait.m)}</s> ${rep}</span>`;
      return `<span class="homo-trou ${k === q.faits.length ? "actif" : ""}">${k === q.faits.length ? "?" : "…"}</span>`;
    });
  };
  const render = () => {
    const d = dispo();
    const tete = `
      <div class="tool-top wrap">${segNiveau(niv)}</div>
      <div class="tool-top wrap homo-choix">${d.map((h) => `<button class="pill ${choix.has(h.id) ? "on" : ""}" data-h="${h.id}">${escF(h.nom)}</button>`).join("")}<button class="pill" id="go">🔀 Nouvelle série</button></div>`;
    if (!serie.length) { el.innerHTML = tete + `<div class="tool-center"><p class="hint">Choisis au moins un homophone.</p></div>`; return; }
    if (fini) {
      const err = reponses.filter((r) => !r.ok);
      el.innerHTML = tete + `<div class="tool-center rc-board">
        <div class="calc-q homo-score">⭐ ${score} / ${reponses.length}</div>
        ${err.length ? `<p class="homo-revoir-t">À revoir :</p><div class="homo-revoir">${err.map((r) => `<p>${escF(r.p).replace(/\[([^\]]+)\]/g, "<b>$1</b>")}</p>`).join("")}</div>` : `<div class="banner ok">Aucune erreur ! 🎉</div>`}
        <button class="big-btn" id="go">Rejouer</button></div>`;
      return;
    }
    const q = Q(), k = q.faits.length, debut = new RegExp("^\\[").test(q.p) && k === 0;
    const dernier = q.faits[q.faits.length - 1];
    el.innerHTML = tete + `
      <div class="tool-center homo-zone rc-board">
        <div class="homo-prog">${serie.map((_, j) => `<span class="${j < i ? "fait" : j === i ? "cour" : ""}"></span>`).join("")}</div>
        <p class="homo-phrase">${phraseHTML(q)}</p>
        ${k < q.trous.length ? `<div class="homo-choix-mots">${q.h.mots.map((m) => `<button class="homo-btn" data-m="${escF(m)}">${escF(debut ? majuscule(m) : m)}</button>`).join("")}</div>`
          : `<div class="banner ${q.faits.every((f) => f.ok) ? "ok" : "ko"}">${q.faits.every((f) => f.ok) ? "Bravo !" : "Oups ! Regarde la bonne réponse."}</div>`}
        <div class="pills rc-keep"><button class="pill" id="ast">💡 Astuce</button>${k >= q.trous.length ? `<button class="big-btn" id="suiv">Suivant ➜</button>` : ""}</div>
        ${astuce || (dernier && !dernier.ok) ? `<p class="homo-astuce">💡 ${escF(q.h.astuce)}</p>` : ""}
      </div>`;
  };
  const repondre = (m) => {
    const q = Q(), k = q.faits.length; if (k >= q.trous.length) return;
    const ok = q.trous[k].toLowerCase() === m.toLowerCase();
    q.faits.push({ ok, m: k === 0 && /^\[/.test(q.p) ? majuscule(m) : m });
    if (q.faits.length === q.trous.length) { const tout = q.faits.every((f) => f.ok); if (tout) score++; reponses.push({ p: q.p, ok: tout }); }
    render();
  };
  const suivant = () => { astuce = false; if (i < serie.length - 1) i++; else fini = true; render(); };
  el.onclick = (e) => {
    if (surNiveau(e, (n) => { niv = n; defaut(); nouvelleSerie(); render(); })) return;
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.h) { choix.has(t.dataset.h) ? choix.delete(t.dataset.h) : choix.add(t.dataset.h); nouvelleSerie(); return render(); }
    if (t.dataset.m) return repondre(t.dataset.m);
    if (t.id === "go") nouvelleSerie();
    if (t.id === "ast") astuce = !astuce;
    if (t.id === "suiv") return suivant();
    render();
  };
  defaut(); nouvelleSerie(); render();
}

// =====================================================================
// ACCORDS (mots variables) : on touche un mot variable pour faire défiler ses formes.
// Format : {forme1|forme2|*bonne forme} ; « e » = explication montrée avec la solution.
// Second jeu : « Variable ou invariable ? » (CE2 à CM2).
// =====================================================================
const P = (niv, t, e) => ({ niv, t, e });
export const ACCORDS = [
  // CP : le déterminant s'accorde avec le nom (genre, nombre)
  P("CP", "Je vois {*un|une} chien.", "« chien » est masculin : un chien."),
  P("CP", "{le|*la} maison est grande.", "« maison » est féminin : la maison."),
  P("CP", "{le|*les} oiseaux chantent.", "Il y a plusieurs oiseaux : les oiseaux."),
  P("CP", "Elle mange {un|*une} pomme.", "« pomme » est féminin : une pomme."),
  P("CP", "{*le|la} soleil brille.", "« soleil » est masculin : le soleil."),
  P("CP", "J'ai {*des|un} billes.", "Il y a plusieurs billes : des billes."),
  P("CP", "{un|*une} poule picore.", "« poule » est féminin : une poule."),
  P("CP", "{*les|le} enfants jouent.", "Il y a plusieurs enfants : les enfants."),
  // CE1 : pluriel du nom, accord de l'adjectif dans le groupe nominal
  P("CE1", "J'ai deux {chat|*chats}.", "Deux, c'est plusieurs : on ajoute un s au nom."),
  P("CE1", "Les {enfant|*enfants} jouent.", "« les » indique le pluriel : enfants prend un s."),
  P("CE1", "C'est une {petit|*petite} fille.", "« fille » est féminin : l'adjectif prend un e."),
  P("CE1", "Il porte des chaussures {noir|noire|noirs|*noires}.", "« chaussures » est féminin pluriel : noires."),
  P("CE1", "Mon frère a un {*grand|grande} vélo.", "« vélo » est masculin singulier : grand."),
  P("CE1", "Les {*petits|petit} chats dorment.", "« chats » est masculin pluriel : petits."),
  P("CE1", "Une {*jolie|joli|jolies} robe.", "« robe » est féminin singulier : jolie."),
  P("CE1", "Des {ballon|*ballons} rouges.", "« des » indique le pluriel : ballons."),
  P("CE1", "La {*tortue|tortues} avance lentement.", "« la » indique le singulier : tortue."),
  // CE2 : groupe nominal complet, accord sujet-verbe au présent
  P("CE2", "Les chiens {aboie|*aboient}.", "Le sujet « les chiens » est au pluriel : ils aboient."),
  P("CE2", "Nous {*chantons|chante|chantent} une chanson.", "Avec « nous », le verbe se termine par -ons."),
  P("CE2", "Tu {regarde|*regardes|regardent} la télévision.", "Avec « tu », le verbe se termine par -s."),
  P("CE2", "Les {*grandes|grande|grands} tours {blanc|blanche|blancs|*blanches}.", "« tours » est féminin pluriel : grandes et blanches."),
  P("CE2", "Mes amies {est|*sont} {gentil|gentille|gentils|*gentilles}.", "« mes amies » est féminin pluriel : sont gentilles."),
  P("CE2", "Le {*vieux|vieille} pêcheur {*répare|réparent} son filet.", "« le vieux pêcheur » est masculin singulier : il répare."),
  P("CE2", "Vous {finis|*finissez|finissent} vos exercices.", "Avec « vous », le verbe se termine par -ez."),
  P("CE2", "Mon chat et mon chien {joue|*jouent} ensemble.", "Deux sujets, c'est comme « ils » : jouent."),
  P("CE2", "Ces {belles|*beaux|belle} oiseaux {*volent|vole} haut.", "« oiseaux » est masculin pluriel : beaux ; le sujet est au pluriel : volent."),
  // CM1 : noms et adjectifs en -al, -eau, attribut du sujet, autres temps
  P("CM1", "Des chevaux {blanc|*blancs|blanches} galopent dans le pré.", "« chevaux » est masculin pluriel : blancs."),
  P("CM1", "Les filles sont {content|contente|contents|*contentes}.", "L'attribut s'accorde avec le sujet « les filles » : contentes."),
  P("CM1", "Ces {*journaux|journals} sont {ancien|ancienne|*anciens|anciennes}.", "journal fait journaux au pluriel ; masculin pluriel : anciens."),
  P("CM1", "Demain, mes cousins {viendra|*viendront|viendrons}.", "Le sujet « mes cousins » est au pluriel : viendront."),
  P("CM1", "Autrefois, les enfants {jouait|*jouaient} dans la rue.", "Le sujet est au pluriel : à l'imparfait, ils jouaient."),
  P("CM1", "Nos {*nouveaux|nouvelles|nouveau} voisins {semble|*semblent} {timide|*timides}.", "« voisins » est masculin pluriel : nouveaux, semblent, timides."),
  P("CM1", "Ma tante et ma mère sont {parti|partie|partis|*parties} au marché.", "Avec être, le participe passé s'accorde avec le sujet (féminin pluriel) : parties."),
  P("CM1", "Ces {*bateaux|bateaus} {rapide|*rapides} {traverse|*traversent} la mer.", "bateau fait bateaux au pluriel ; le sujet est au pluriel : traversent."),
  P("CM1", "La {*meilleure|meilleur} équipe {*a|ont} gagné.", "« équipe » est féminin singulier : la meilleure équipe a gagné."),
  // CM2 : participe passé avec être, sujets inversés ou éloignés, accords dans les groupes enrichis
  P("CM2", "Elles sont {parti|partie|partis|*parties} tôt ce matin.", "Avec être, le participe passé s'accorde avec le sujet « elles » : parties."),
  P("CM2", "Les lettres que tu as écrites sont {arrivé|arrivée|arrivés|*arrivées}.", "« les lettres » est féminin pluriel : arrivées."),
  P("CM2", "Dans la forêt {vit|*vivent} des loups.", "Le sujet « des loups » est placé après le verbe : vivent."),
  P("CM2", "Mes sœurs et moi {*sommes|sont|est} {allé|allée|allés|*allées} au cinéma.", "« mes sœurs et moi » = nous (féminin pluriel) : sommes allées."),
  P("CM2", "Les {*vieilles|vieux|vieille} maisons du village {*semblent|semble} {abandonné|abandonnée|abandonnés|*abandonnées}.", "« maisons » est féminin pluriel : vieilles, semblent, abandonnées."),
  P("CM2", "Les élèves de la classe {prépare|*préparent} un spectacle.", "Le noyau du sujet est « élèves » (pluriel) : préparent."),
  P("CM2", "Ma grand-mère est {né|*née|nés} en 1950.", "Avec être, le participe passé s'accorde avec le sujet (féminin singulier) : née."),
  P("CM2", "Les {*jeux|jeus} de société {amuse|*amusent} toute la famille.", "jeu fait jeux au pluriel ; le noyau du sujet est « jeux » : amusent."),
  P("CM2", "Les pommes que j'ai {cueilli|cueillie|cueillis|*cueillies} sont mûres.", "Avec avoir, le participe passé s'accorde avec le COD placé avant : « que » remplace « les pommes » (féminin pluriel)."),
  P("CM2", "Ces dessins, je les ai {*faits|fait|faites} hier.", "Le COD « les » (les dessins, masculin pluriel) est placé avant avoir : faits."),
  P("CM2", "Les chanteurs se sont {*préparés|préparé|préparées} avant le concert.", "Avec être, le participe passé s'accorde avec le sujet « les chanteurs » : préparés."),
];
// Nettoie les formes en double (une seule bonne réponse par choix).
const formesDe = (spec) => { const opts = spec.split("|"); const bonne = opts.find((o) => o.startsWith("*")).slice(1); return { bonne, formes: [...new Set(opts.map((o) => o.replace(/^\*/, "")))] }; };
export const VARIABLES = {
  CE2: [["chat", 1], ["grand", 1], ["mangeait", 1], ["belle", 1], ["la", 1], ["ils", 1], ["et", 0], ["très", 0], ["sous", 0], ["souvent", 0], ["avec", 0], ["mais", 0]],
  CM1: [["forêt", 1], ["heureux", 1], ["finissons", 1], ["cette", 1], ["nous", 1], ["leurs", 1], ["lentement", 0], ["pendant", 0], ["donc", 0], ["toujours", 0], ["chez", 0], ["ou", 0]],
  CM2: [["courage", 1], ["lumineuse", 1], ["chantions", 1], ["quelques", 1], ["elles", 1], ["aucune", 1], ["pourtant", 0], ["malgré", 0], ["hier", 0], ["ensuite", 0], ["vers", 0], ["ni", 0]],
};

function accords(el) {
  let niv = niveauJeux(), jeu = "accords", liste = [], i = 0, etat = [], verif = false, sol = false, score = 0, faits = 0;
  // Variable / invariable
  let vlist = [], vi = 0, vrep = null, vscore = 0;
  const preparer = () => {
    liste = melange(ACCORDS.filter((a) => a.niv === niv)); i = 0; score = 0; faits = 0; question();
    vlist = melange(VARIABLES[niv] || VARIABLES.CE2); vi = 0; vrep = null; vscore = 0;
  };
  const parse = (t) => {
    const parts = []; let last = 0;
    for (const m of t.matchAll(/\{([^}]+)\}/g)) { parts.push({ txt: t.slice(last, m.index) }); parts.push({ var: formesDe(m[1]) }); last = m.index + m[0].length; }
    parts.push({ txt: t.slice(last) });
    return parts;
  };
  let parts = [];
  const question = () => { const a = liste[i % liste.length]; parts = parse(a.t); etat = parts.map(() => null); verif = false; sol = false; };
  const motHTML = (p, k) => {
    const v = p.var, choisi = sol ? v.bonne : etat[k];
    const ok = choisi != null && choisi === v.bonne;
    const cls = verif || sol ? (ok ? "good" : "bad") : "";
    const debut = parts.slice(0, k).every((q) => !q.var && !q.txt.trim());
    const aff = choisi == null ? "…" : debut ? majuscule(choisi) : choisi;
    return `<button class="acc-mot ${choisi == null ? "vide" : ""} ${cls}" data-v="${k}">${escF(aff)}</button>`;
  };
  const render = () => {
    const aVI = !!VARIABLES[niv];
    const tete = `<div class="tool-top wrap">${segNiveau(niv)}${aVI ? `<div class="seg"><button data-jeu="accords" class="${jeu === "accords" ? "on" : ""}">Accorder les mots</button><button data-jeu="vi" class="${jeu === "vi" ? "on" : ""}">Variable ou invariable ?</button></div>` : ""}</div>`;
    if (jeu === "vi" && aVI) {
      const fin = vi >= vlist.length, w = vlist[vi];
      el.innerHTML = tete + `<div class="tool-center rc-board">
        ${fin ? `<div class="calc-q homo-score">⭐ ${vscore} / ${vlist.length}</div><button class="big-btn" id="vrej">Rejouer</button>` : `
        <p class="hint">Ce mot peut-il changer de forme (genre, nombre, personne, temps) ?</p>
        <div class="acc-vi-mot ${vrep ? (vrep.ok ? "good" : "bad") : ""}">${escF(w[0])}</div>
        ${vrep ? `<div class="banner ${vrep.ok ? "ok" : "ko"}">${w[1] ? "Variable" : "Invariable"}${vrep.ok ? " : bravo !" : ""}</div><button class="big-btn" id="vsuiv">Suivant ➜</button>`
          : `<div class="homo-choix-mots"><button class="homo-btn" data-vi="1">Variable</button><button class="homo-btn" data-vi="0">Invariable</button></div>`}
        <p class="hint">${vi + 1} / ${vlist.length} · ⭐ ${vscore}</p>`}
      </div>`;
      return;
    }
    const a = liste[i % liste.length];
    const vars = parts.map((p, k) => [p, k]).filter(([p]) => p.var);
    const juste = vars.every(([p, k]) => etat[k] === p.var.bonne);
    el.innerHTML = tete + `
      <div class="tool-top wrap"><button class="pill" id="verif">Vérifier</button><button class="pill" id="sol">Solution</button><button class="pill" id="suiv">Suivant ➜</button><span class="hint">${(i % liste.length) + 1} / ${liste.length} · ⭐ ${score}</span></div>
      <div class="tool-center rc-board">
        <p class="hint">Touche les mots en couleur pour choisir la bonne forme.</p>
        <p class="acc-phrase">${parts.map((p, k) => p.var ? motHTML(p, k) : escF(p.txt)).join("")}</p>
        ${verif && !sol ? `<div class="banner ${juste ? "ok" : "ko"}">${juste ? "Bravo, tout est bien accordé !" : "Pas encore : regarde les mots en rouge."}</div>` : ""}
        ${sol || (verif && juste) ? `<p class="homo-astuce">🔗 ${escF(a.e)}</p>` : ""}
      </div>`;
  };
  el.onclick = (e) => {
    if (surNiveau(e, (n) => { niv = n; if (!VARIABLES[niv]) jeu = "accords"; preparer(); render(); })) return;
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.jeu) { jeu = t.dataset.jeu; return render(); }
    if (t.dataset.v != null && !sol) {
      const k = +t.dataset.v, f = parts[k].var.formes, cur = etat[k];
      etat[k] = f[(cur == null ? 0 : f.indexOf(cur) + 1) % f.length]; verif = false; return render();
    }
    if (t.id === "verif") {
      verif = true; const vars = parts.map((p, k) => [p, k]).filter(([p]) => p.var);
      if (vars.every(([p, k]) => etat[k] === p.var.bonne) && faits <= i) { score++; faits = i + 1; }
    }
    if (t.id === "sol") { sol = true; faits = Math.max(faits, i + 1); }
    if (t.id === "suiv") { i++; if (i >= liste.length) { liste = melange(liste); i = 0; faits = 0; } question(); }
    if (t.dataset.vi != null && !vrep) { const ok = +t.dataset.vi === vlist[vi][1]; if (ok) vscore++; vrep = { ok }; }
    if (t.id === "vsuiv") { vi++; vrep = null; }
    if (t.id === "vrej") { vlist = melange(vlist); vi = 0; vscore = 0; vrep = null; }
    render();
  };
  preparer(); render();
}

export { NIVEAUX_JEUX };
export const FRANCAIS = [
  { id: "etiquettes", nom: "Mots baladeurs", icone: "🏷️", couleur: "#c9ecd4", desc: "Étiquettes à glisser : phrases à trous, mots en ordre, tris", mount: mots },
  { id: "homophones", nom: "Homophones", icone: "👂", couleur: "#ffe3a3", desc: "a/à, et/est, on/ont, la/là… avec l'astuce", mount: homophones },
  { id: "accords", nom: "Accords et mots variables", icone: "🔗", couleur: "#ffd0dc", desc: "Choisir la bonne forme, variable ou invariable", mount: accords },
];
