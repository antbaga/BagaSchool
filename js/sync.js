// Synchronisation entre les appareils d'un même compte + canal de télécommande.
//
// - Seules les données de préparation sont synchronisées (SYNC_COLLS). Les élèves, les évaluations
//   (résultats) et l'appel restent sur l'appareil (RGPD).
// - Chaque collection est envoyée en entier avec un numéro de version. Si deux appareils écrivent
//   en même temps, on fusionne élément par élément (fusion à trois voies) puis on renvoie.
// - Le « transport » (compte.js) fait le lien avec le serveur ; ce fichier n'en dépend pas, ce qui
//   permet de le tester avec un faux serveur.
import * as db from "./db.js";

export const SYNC_COLLS = ["edt", "programmations", "fiches", "reglages", "journal", "modeles", "decks", "devoirs", "cahier", "remplacements"];
const DEBOUNCE = { cahier: 2500 };
export const sync = {
  t: null, canal: null, etat: "off", peers: [], moi: null, cfg: null,
  ver: {}, base: {}, dirty: new Set(), enVol: new Set(), timers: {}, retry: 2000, uid: null,
  hooks: { lire: () => null, ecrire: () => {}, etat: () => {}, rc: () => {} },
};

// ---------- fusion à trois voies ----------
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
const avecIds = (a) => Array.isArray(a) && a.every((x) => isObj(x) && x.id != null);
export function merge3(base, local, remote) {
  if (same(local, base)) return remote;
  if (same(remote, base) || same(local, remote)) return local;
  if (avecIds(local) && avecIds(remote)) {
    const B = new Map((avecIds(base) ? base : []).map((x) => [x.id, x]));
    const L = new Map(local.map((x) => [x.id, x])), R = new Map(remote.map((x) => [x.id, x]));
    const out = [];
    for (const id of new Set([...local.map((x) => x.id), ...remote.map((x) => x.id)])) {
      const b = B.get(id), l = L.get(id), r = R.get(id);
      if (l && r) out.push(merge3(b, l, r));
      else if (l) { if (!(b && same(l, b))) out.push(l); } // supprimé ailleurs sauf si modifié ici
      else if (r) { if (!(b && same(r, b))) out.push(r); } // supprimé ici sauf si modifié ailleurs
    }
    return out;
  }
  if (isObj(local) && isObj(remote)) {
    const out = {}, bo = isObj(base) ? base : {};
    for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])) {
      const v = merge3(bo[k], local[k], remote[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return local;
}
const vide = (v) => v == null || (Array.isArray(v) ? !v.length : isObj(v) && !Object.keys(v).length);

// ---------- état persistant ----------
const persister = () => Promise.all([db.set("_syncVer", sync.ver), db.set("_syncBase", sync.base), db.set("_syncDirty", [...sync.dirty])]);
function setEtat(e) { sync.etat = e; sync.hooks.etat(e); }
export const actif = () => !!sync.t;

export function appareil() {
  let id = localStorage.getItem("bagaschool-appareil");
  if (!id) { id = crypto.randomUUID().slice(0, 8); localStorage.setItem("bagaschool-appareil", id); }
  return { id, role: matchMedia("(pointer:coarse)").matches ? "tel" : "pc" };
}

export function initSync(hooks) { Object.assign(sync.hooks, hooks); }

// Démarre la synchro avec un transport connecté à un compte.
export async function demarrer(transport) {
  await arreter();
  if (!transport) return;
  const moi = appareil();
  sync.t = transport; sync.moi = moi.id; sync.cfg = { role: moi.role };
  const ancien = await db.get("_syncUser").catch(() => null);
  if (ancien !== transport.uid) {
    // Premier passage de ce compte sur cet appareil : on fusionnera avec ce qui est sur le serveur.
    sync.ver = {}; sync.base = {}; sync.dirty = new Set(); sync.premier = true;
  } else {
    sync.ver = (await db.get("_syncVer")) || {};
    sync.base = (await db.get("_syncBase")) || {};
    sync.dirty = new Set(((await db.get("_syncDirty")) || []).filter((c) => SYNC_COLLS.includes(c)));
    sync.premier = false;
  }
  sync.uid = transport.uid;
  setEtat("connexion");
  try {
    sync.canal = await transport.canal({
      message: (m) => recevoir(m).catch((e) => console.warn("sync", e)),
      appareils: (list) => { sync.peers = list; sync.hooks.etat(sync.etat); },
      statut: (s) => { if (s === "ok" && sync.etat !== "ok") rattraper(); if (s === "ko" && sync.t) { setEtat("hors-ligne"); planifierReessai(); } },
    });
  } catch (e) { console.warn("canal", e); }
  await rattraper();
}

export async function arreter() {
  clearTimeout(sync.timers._re);
  for (const k of Object.keys(sync.timers)) if (!k.startsWith("s:")) clearTimeout(sync.timers[k]);
  try { await sync.canal?.fermer(); } catch {}
  sync.t = null; sync.canal = null; sync.peers = []; sync.enVol.clear(); sync.cfg = null;
  setEtat("off");
}

// Oublie l'état de synchro de cet appareil (à la déconnexion).
export async function oublier() {
  await arreter();
  sync.ver = {}; sync.base = {}; sync.dirty = new Set();
  await persister(); await db.set("_syncUser", null);
}

let enRattrapage = null;
async function rattraper() {
  if (!sync.t) return;
  if (enRattrapage) return enRattrapage;
  enRattrapage = (async () => {
    try {
      const t = sync.t;
      const vers = await t.versions();
      if (t !== sync.t) return;
      const aLire = Object.keys(vers).filter((c) => SYNC_COLLS.includes(c) && vers[c] > (sync.ver[c] || 0));
      const recs = await t.lire(aLire);
      if (t !== sync.t) return;
      if (sync.premier) {
        for (const c of SYNC_COLLS) {
          const local = sync.hooks.lire(c), rec = recs[c];
          if (rec) {
            const res = merge3(undefined, local, rec.data); // union : rien de ce qui existe des deux côtés n'est perdu
            sync.base[c] = rec.data; sync.ver[c] = rec.v;
            if (!same(res, local)) await sync.hooks.ecrire(c, res);
            if (!same(res, rec.data)) sync.dirty.add(c);
          } else if (!vide(local)) sync.dirty.add(c);
        }
        sync.premier = false;
        await db.set("_syncUser", t.uid);
      } else {
        for (const [c, rec] of Object.entries(recs)) await appliquer(c, rec.v, rec.data);
      }
      await persister();
      sync.retry = 2000;
      setEtat("ok");
      for (const c of sync.dirty) envoyer(c);
    } catch (e) {
      console.warn("sync", e);
      if (sync.t) { setEtat("hors-ligne"); planifierReessai(); }
    } finally { enRattrapage = null; }
  })();
  return enRattrapage;
}
function planifierReessai() {
  clearTimeout(sync.timers._re);
  sync.timers._re = setTimeout(rattraper, sync.retry);
  sync.retry = Math.min(sync.retry * 2, 60000);
}
addEventListener("online", () => { sync.retry = 2000; rattraper(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && sync.t) rattraper(); });

async function appliquer(coll, v, remote) {
  if (v <= (sync.ver[coll] || 0)) return;
  const local = sync.hooks.lire(coll);
  let res = remote;
  if (sync.dirty.has(coll)) res = merge3(sync.base[coll], local, remote);
  sync.base[coll] = remote; sync.ver[coll] = v;
  if (!same(res, local)) await sync.hooks.ecrire(coll, res);
  if (!same(res, remote)) sync.dirty.add(coll); else sync.dirty.delete(coll);
}

async function recevoir(m) {
  if (m?.t === "upd" && SYNC_COLLS.includes(m.coll)) {
    if (m.v <= (sync.ver[m.coll] || 0) || !sync.t) return;
    const recs = await sync.t.lire([m.coll]);
    if (recs[m.coll]) { await appliquer(m.coll, recs[m.coll].v, recs[m.coll].data); await persister(); }
    if (sync.dirty.has(m.coll)) planifier(m.coll);
  } else if (m?.t === "rc") {
    try { sync.hooks.rc(m.msg, m.from); } catch {}
  }
}

// ---------- envoi ----------
export function marquer(coll) {
  if (!SYNC_COLLS.includes(coll)) return;
  sync.dirty.add(coll);
  db.set("_syncDirty", [...sync.dirty]);
  if (sync.t) planifier(coll);
}
function planifier(coll) {
  clearTimeout(sync.timers[coll]);
  sync.timers[coll] = setTimeout(() => envoyer(coll), DEBOUNCE[coll] ?? 700);
}
async function envoyer(coll) {
  if (!sync.t || sync.etat !== "ok" || sync.enVol.has(coll)) return;
  const t = sync.t, snap = structuredClone(sync.hooks.lire(coll));
  sync.enVol.add(coll);
  let relancer = false;
  try {
    const r = await t.ecrire(coll, sync.ver[coll] || 0, snap);
    if (t !== sync.t) return;
    if (r.ok) {
      sync.ver[coll] = r.v; sync.base[coll] = snap;
      if (same(snap, sync.hooks.lire(coll))) sync.dirty.delete(coll); else planifier(coll);
      sync.canal?.envoyer({ t: "upd", coll, v: r.v }).catch(() => {});
    } else {
      if (r.data != null) { sync.dirty.add(coll); await appliquer(coll, r.v, r.data); } else sync.ver[coll] = r.v;
      sync.dirty.add(coll);
      relancer = true;
    }
    await persister();
  } catch (e) {
    console.warn("envoi", coll, e);
    if (t === sync.t) { setEtat("hors-ligne"); planifierReessai(); }
  } finally { sync.enVol.delete(coll); }
  if (relancer) envoyer(coll);
}

// ---------- télécommande ----------
export async function envoyerRc(msg) {
  if (!sync.canal) return false;
  return sync.canal.envoyer({ t: "rc", msg, from: sync.moi }).catch(() => false);
}
export const ecransConnectes = () => sync.peers.filter((p) => p.role === "pc" && p.id !== sync.moi).length;
export const appareilsConnectes = () => sync.peers.length;
