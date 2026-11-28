// Comptes (Supabase) : inscription avec code d'invitation, connexion, administration, avis.
// Le client Supabase n'est chargé que si l'app est configurée (js/config.js).
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

let sb = null, chargement = null;
export const configure = () => !!(SUPABASE_URL && SUPABASE_KEY);

function chargerScript(src) {
  return new Promise((ok, ko) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => ko(new Error("Chargement impossible : " + src)); document.head.append(s); });
}
export async function client() {
  if (!configure()) return null;
  if (sb) return sb;
  chargement ??= (async () => {
    if (!window.supabase?.createClient) await chargerScript("js/vendor/supabase.js");
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "bagaschool-auth" },
    });
    return sb;
  })();
  return chargement;
}

// Messages d'erreur compréhensibles
export function messageErreur(e) {
  const m = String(e?.message || e || "");
  if (/invalid login credentials/i.test(m)) return "E-mail ou mot de passe incorrect.";
  if (/already registered|already been registered|user_already_exists/i.test(m)) return "Un compte existe déjà avec cet e-mail. Connecte-toi.";
  if (/database error saving new user|INVITATION_INVALIDE/i.test(m)) return "Ce code d'invitation n'est pas valable (inconnu, déjà utilisé ou expiré).";
  if (/password.*(at least|short|characters)|weak_password/i.test(m)) return "Mot de passe trop court : 8 caractères minimum.";
  if (/email not confirmed/i.test(m)) return "Ton adresse e-mail n'est pas encore confirmée : ouvre le lien reçu par e-mail.";
  if (/invalid.*email|email.*invalid/i.test(m)) return "Adresse e-mail invalide.";
  if (/rate limit|too many/i.test(m)) return "Trop d'essais. Réessaie dans quelques minutes.";
  if (/failed to fetch|network|load failed/i.test(m)) return "Pas de connexion internet. Réessaie quand tu es en ligne.";
  if (/ADMIN_SEULEMENT/.test(m)) return "Réservé à l'administratrice.";
  if (/TROP_DE_PARTAGES/.test(m)) return "Tu as déjà 30 liens de partage actifs. Supprimes-en un pour en créer un nouveau.";
  if (/creer_partage|lire_partage|relation .*partages/i.test(m)) return "Le partage n'est pas encore activé sur le serveur (script supabase/partages.sql à lancer).";
  return m || "Erreur inconnue.";
}
const verif = ({ data, error }) => { if (error) throw error; return data; };

export async function session() {
  const c = await client(); if (!c) return null;
  const { data } = await c.auth.getSession();
  return data.session;
}
export async function utilisateur() { return (await session())?.user ?? null; }
export async function surChangementSession(cb) {
  const c = await client(); if (!c) return;
  c.auth.onAuthStateChange((evt, s) => cb(evt, s));
}

export async function codeValide(code) {
  const c = await client();
  return verif(await c.rpc("invitation_valide", { p_code: code }));
}
export async function inscrire(email, mdp, code) {
  const c = await client();
  if (String(mdp).length < 8) throw new Error("Mot de passe trop court : 8 caractères minimum.");
  if (!(await codeValide(code))) throw new Error("INVITATION_INVALIDE");
  const data = verif(await c.auth.signUp({ email: email.trim(), password: mdp, options: { data: { invitation: code.trim().toUpperCase() } } }));
  return { session: data.session, aConfirmer: !data.session };
}
export async function connecter(email, mdp) {
  const c = await client();
  return verif(await c.auth.signInWithPassword({ email: email.trim(), password: mdp })).session;
}
export async function deconnecter() {
  const c = await client(); if (!c) return;
  await c.auth.signOut({ scope: "local" });
}
export async function changerMotDePasse(mdp) {
  if (String(mdp).length < 8) throw new Error("Mot de passe trop court : 8 caractères minimum.");
  const c = await client();
  verif(await c.auth.updateUser({ password: mdp }));
}
export async function supprimerCompte() {
  const c = await client();
  verif(await c.rpc("supprimer_mon_compte"));
  await c.auth.signOut({ scope: "local" });
}
export async function signalerPresence(version) {
  const c = await client(); if (!c) return;
  await c.rpc("je_suis_la", { p_version: version }).then(() => {}, () => {});
}

// ---------- avis ----------
export async function envoyerAvis({ message, email, page, version }) {
  const c = await client();
  const u = await utilisateur();
  verif(await c.from("avis").insert({
    user_id: u?.id ?? null, email: (email || u?.email || "").slice(0, 200) || null, message: message.slice(0, 5000),
    page: (page || "").slice(0, 190), version_app: version, appareil: navigator.userAgent.slice(0, 390),
  }));
}

// ---------- administration ----------
export async function estAdmin() {
  const c = await client(); if (!c || !(await session())) return false;
  const { data, error } = await c.rpc("est_admin");
  return !error && data === true;
}
export const admin = {
  async invitations() { const c = await client(); return verif(await c.from("invitations").select("*").order("cree_le", { ascending: false })); },
  async creerInvitations(nombre, note, max, jours) { const c = await client(); return verif(await c.rpc("creer_invitations", { p_nombre: nombre, p_note: note, p_max: max, p_jours: jours || null })); },
  async revoquer(code) { const c = await client(); verif(await c.rpc("revoquer_invitation", { p_code: code })); },
  async profils() { const c = await client(); return verif(await c.from("profils").select("*").order("cree_le", { ascending: false })); },
  async motDePasseProvisoire(userId) { const c = await client(); return verif(await c.rpc("reinitialiser_mot_de_passe", { p_user: userId })); },
  async avis() { const c = await client(); return verif(await c.from("avis").select("*").order("cree_le", { ascending: false }).limit(300)); },
  async marquerAvis(id, traite) { const c = await client(); verif(await c.from("avis").update({ traite }).eq("id", id)); },
};

// ---------- liens « Partager ma journée » (contenu déjà chiffré par partage.js) ----------
export const partages = {
  async creer(contenu, heures, jour) { const c = await client(); return verif(await c.rpc("creer_partage", { p_contenu: contenu, p_heures: heures, p_jour: jour || null })); },
  async lire(id) { const c = await client(); const rows = verif(await c.rpc("lire_partage", { p_id: id })); return rows?.[0] ?? null; },
  async miens() { const c = await client(); return verif(await c.from("partages").select("id, jour, expire_le, cree_le").gt("expire_le", new Date().toISOString()).order("cree_le", { ascending: false })); },
  async supprimer(id) { const c = await client(); verif(await c.from("partages").delete().eq("id", id)); },
};

// ---------- transport de synchronisation (utilisé par sync.js) ----------
// Une ligne par collection dans la table « donnees » ; un canal temps réel privé « u:<id> » pour
// prévenir les autres appareils d'une écriture, la télécommande et la liste des appareils connectés.
export async function transportSupabase(appareil) {
  const c = await client();
  const s = await session(); if (!s) return null;
  const uid = s.user.id;
  return {
    uid,
    async versions() {
      const rows = verif(await c.from("donnees").select("coll, version"));
      return Object.fromEntries(rows.map((r) => [r.coll, r.version]));
    },
    async lire(colls) {
      if (!colls.length) return {};
      const rows = verif(await c.from("donnees").select("coll, version, data").in("coll", colls));
      return Object.fromEntries(rows.map((r) => [r.coll, { v: r.version, data: r.data }]));
    },
    async ecrire(coll, base, data) { return verif(await c.rpc("ecrire", { p_coll: coll, p_base: base, p_data: data })); },
    async canal({ message, appareils, statut }) {
      await c.realtime.setAuth();
      const ch = c.channel("u:" + uid, { config: { private: true, broadcast: { self: false }, presence: { key: appareil.id } } });
      ch.on("broadcast", { event: "m" }, ({ payload }) => message(payload));
      ch.on("presence", { event: "sync" }, () => appareils(Object.values(ch.presenceState()).flat().map((p) => ({ id: p.id, role: p.role }))));
      ch.subscribe(async (st) => {
        if (st === "SUBSCRIBED") { await ch.track({ id: appareil.id, role: appareil.role }); statut("ok"); }
        else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT" || st === "CLOSED") statut("ko");
      });
      return {
        envoyer: (payload) => ch.send({ type: "broadcast", event: "m", payload }).then((r) => r === "ok"),
        fermer: () => c.removeChannel(ch),
      };
    },
  };
}
