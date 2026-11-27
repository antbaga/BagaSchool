// Invitation à installer l'app à l'ouverture du lien.
// - Chrome, Edge, Android : vrai bouton « Installer » (événement beforeinstallprompt).
// - iPhone / iPad : pas de bouton possible, petit tuto (Partager > Sur l'écran d'accueil) ;
//   si on n'est pas dans Safari, on dit d'ouvrir le lien dans Safari.
// Rien ne s'affiche si l'app est déjà installée. Fermer le message le cache 7 jours.
const CLE = "bagaschool-install-ferme";
const DELAI = 7 * 864e5;
let invite = null; // événement beforeinstallprompt mis de côté

export const estInstallee = () => matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: window-controls-overlay)").matches || navigator.standalone === true;

export function plateforme() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const appInterne = /FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|LinkedInApp|GSA\//.test(ua);
  if (ios) return { os: "ios", safari: !appInterne && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(ua), appInterne };
  if (/Android/.test(ua)) return { os: "android", appInterne, firefox: /Firefox/.test(ua), samsung: /SamsungBrowser/.test(ua) };
  return { os: "pc", firefox: /Firefox/.test(ua), safari: /Safari/.test(ua) && !/Chrome|Chromium|Edg\//.test(ua), appInterne };
}

const ICO_PARTAGE = `<svg viewBox="0 0 24 24" class="inst-ico" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10H6v10h12V10h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
const ICO_AJOUT = `<svg viewBox="0 0 24 24" class="inst-ico" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

// Contenu adapté à l'appareil. Renvoie "" si on ne sait rien proposer d'utile.
export function contenuInstallation() {
  const p = plateforme();
  if (p.appInterne) return `<p>Tu as ouvert le lien dans une application (messagerie, réseau social). Pour installer BagaSchool, ouvre-le dans ${p.os === "ios" ? "<b>Safari</b>" : "<b>Chrome</b>"} : touche le menu <b>•••</b> puis « Ouvrir dans le navigateur ».</p>`;
  if (p.os === "ios" && !p.safari) return `<p>Sur iPhone et iPad, l'installation est plus simple depuis <b>Safari</b>. Copie le lien et ouvre-le dans Safari, puis suis les étapes qui s'afficheront.</p>`;
  if (p.os === "ios") return `<ol class="inst-etapes">
      <li>Touche ${ICO_PARTAGE} <b>Partager</b> (en bas de l'écran, ou dans le menu <b>•••</b> à côté de l'adresse).</li>
      <li>Fais défiler et touche ${ICO_AJOUT} <b>Sur l'écran d'accueil</b>.</li>
      <li>Touche <b>Ajouter</b>. L'icône BagaSchool apparaît avec tes autres apps.</li></ol>`;
  if (invite) return `<p>Installe BagaSchool pour l'ouvrir comme une vraie app, en plein écran, même sans internet.</p><button class="big-btn" id="instGo">📲 Installer l'app</button>`;
  if (p.os === "android") return `<p>Touche le menu <b>⋮</b> du navigateur, puis <b>Installer l'application</b> (ou « Ajouter à l'écran d'accueil »).</p>`;
  if (p.firefox) return `<p>Firefox ne sait pas installer les applications web sur ordinateur. Ouvre ce lien dans <b>Chrome</b> ou <b>Edge</b> : un bouton « Installer » apparaîtra.</p>`;
  if (p.safari) return `<p>Sur Mac avec Safari : menu <b>Fichier</b> puis <b>Ajouter au Dock</b>.</p>`;
  return `<p>Clique sur l'icône d'installation à droite de la barre d'adresse (un écran avec une flèche), ou menu <b>⋮</b> puis <b>Installer BagaSchool</b>.</p>`;
}

export const peutInstallerDirect = () => !!invite;
export async function lancerInstallation() {
  if (!invite) return false;
  invite.prompt();
  const { outcome } = await invite.userChoice.catch(() => ({ outcome: "dismissed" }));
  invite = null;
  return outcome === "accepted";
}

function fermer(retenir = true) {
  document.getElementById("instBan")?.remove();
  if (retenir) localStorage.setItem(CLE, String(Date.now()));
}

function afficher() {
  if (estInstallee() || document.getElementById("instBan")) return;
  const html = contenuInstallation(); if (!html) return;
  const ban = document.createElement("aside");
  ban.id = "instBan"; ban.className = "inst-ban no-print"; ban.setAttribute("role", "dialog"); ban.setAttribute("aria-label", "Installer BagaSchool");
  ban.innerHTML = `<button class="inst-x" id="instX" aria-label="Fermer">✕</button>
    <div class="inst-tete"><img src="icons/icon-192.png" alt="" width="44" height="44"><div><b>Installer BagaSchool</b><br><span class="muted">Sur ${plateforme().os === "pc" ? "cet ordinateur" : "ce téléphone"}, en 30 secondes</span></div></div>
    <div class="inst-corps">${html}</div>
    <button class="pill" id="instLater">Plus tard</button>`;
  document.body.appendChild(ban);
  ban.onclick = async (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.id === "instX" || t.id === "instLater") fermer();
    if (t.id === "instGo") { const ok = await lancerInstallation(); fermer(!ok ? true : false); }
  };
}

// Met à jour le bandeau s'il est déjà ouvert (ex. le bouton « Installer » devient disponible).
const rafraichir = () => { const c = document.querySelector("#instBan .inst-corps"); if (c) c.innerHTML = contenuInstallation(); };

export function initInstallation() {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); invite = e; rafraichir(); if (!fermeRecent()) afficher(); });
  window.addEventListener("appinstalled", () => { invite = null; fermer(false); });
  // Laisse au navigateur le temps d'envoyer beforeinstallprompt avant d'afficher un tuto.
  setTimeout(() => { if (!fermeRecent()) afficher(); }, 1500);
}
const fermeRecent = () => Date.now() - (+localStorage.getItem(CLE) || 0) < DELAI;
export const ouvrirInstallation = () => { localStorage.removeItem(CLE); afficher(); };
