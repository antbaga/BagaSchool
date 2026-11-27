// Synchronisation entre les appareils de l'enseignante + canal de télécommande.
//
// - Un « espace » est créé sur un appareil ; les autres le rejoignent en scannant un QR code.
// - Le QR contient l'identifiant d'espace et une clé AES-256 ; la clé ne passe jamais par le relais :
//   tout est chiffré ici (AES-GCM) avant d'être envoyé.
// - Chaque collection est envoyée en entier, avec un numéro de version. En cas de modifications
//   simultanées sur deux appareils, on fusionne élément par élément (fusion à trois voies).
import * as db from "./db.js";

const DEBOUNCE = 700;
export const sync = {
  cfg: null, ws: null, etat: "off", peers: [], moi: null,
  ver: {}, base: {}, dirty: new Set(), enVol: new Set(), timers: {}, retry: 1000,
  hooks: { lire: () => null, ecrire: () => {}, etat: () => {}, rc: () => {} },
};

// ---------- encodage ----------
const b64u = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const alea = (n) => crypto.getRandomValues(new Uint8Array(n));
const canZip = typeof CompressionStream !== "undefined";
async function flux(bytes, Stream, mode) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new Stream(mode))).arrayBuffer()); }

let cleCache = null;
async function cle() {
  if (!cleCache || cleCache.k !== sync.cfg.k) cleCache = { k: sync.cfg.k, key: await crypto.subtle.importKey("raw", unb64u(sync.cfg.k), "AES-GCM", false, ["encrypt", "decrypt"]) };
  return cleCache.key;
}
async function chiffrer(obj) {
  let bytes = new TextEncoder().encode(JSON.stringify(obj));
  const z = canZip && bytes.length > 2000;
  if (z) bytes = await flux(bytes, CompressionStream, "gzip");
  const iv = alea(12);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await cle(), bytes));
  return { iv: b64u(iv), data: b64u(data), z };
}
async function dechiffrer(blob) {
  let bytes = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(blob.iv) }, await cle(), unb64u(blob.data)));
  if (blob.z) bytes = await flux(bytes, DecompressionStream, "gzip");
  return JSON.parse(new TextDecoder().decode(bytes));
}

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

// ---------- état persistant ----------
const persister = () => Promise.all([db.set("_syncVer", sync.ver), db.set("_syncBase", sync.base), db.set("_syncDirty", [...sync.dirty])]);
function setEtat(e) { sync.etat = e; sync.hooks.etat(e); }

export async function initSync(hooks, url) {
  Object.assign(sync.hooks, hooks);
  sync.defaultUrl = url;
  sync.cfg = (await db.get("_sync").catch(() => null)) || null;
  if (!sync.cfg) return;
  sync.ver = (await db.get("_syncVer")) || {};
  sync.base = (await db.get("_syncBase")) || {};
  sync.dirty = new Set((await db.get("_syncDirty")) || []);
  connecter();
}

export const actif = () => !!sync.cfg;
export const relaisConfigure = () => !!(sync.cfg?.url || sync.defaultUrl);
export const lienAppairage = () => `${location.origin}${location.pathname}#/lier/${sync.cfg.id}.${sync.cfg.k}`;

export async function creerEspace(collections) {
  sync.cfg = { id: b64u(alea(16)), k: b64u(alea(32)), url: sync.defaultUrl, role: matchMedia("(pointer:coarse)").matches ? "tel" : "pc" };
  sync.ver = {}; sync.base = {}; sync.dirty = new Set(collections);
  await db.set("_sync", sync.cfg); await persister();
  connecter();
}
export async function rejoindre(code, collections) {
  const [id, k] = String(code).split(".");
  if (!/^[A-Za-z0-9_-]{22}$/.test(id || "") || !/^[A-Za-z0-9_-]{43}$/.test(k || "")) throw new Error("Code d'appairage invalide.");
  sync.cfg = { id, k, url: sync.defaultUrl, role: matchMedia("(pointer:coarse)").matches ? "tel" : "pc", rejoint: collections };
  sync.ver = {}; sync.base = {}; sync.dirty = new Set();
  await db.set("_sync", sync.cfg); await persister();
  connecter();
}
export async function delier() {
  const ws = sync.ws; sync.cfg = null; sync.ws = null;
  try { ws?.close(); } catch {}
  await db.set("_sync", null); sync.ver = {}; sync.base = {}; sync.dirty = new Set(); await persister();
  setEtat("off");
}
export function revoquer() {
  if (sync.ws?.readyState === 1) sync.ws.send(JSON.stringify({ t: "wipe" }));
  return delier();
}

// ---------- connexion ----------
function connecter() {
  if (!sync.cfg) return;
  const url = (sync.cfg.url || sync.defaultUrl || "").replace(/^http/, "ws").replace(/\/$/, "");
  if (!url) { setEtat("non-configure"); return; }
  if (sync.ws && sync.ws.readyState <= 1) return;
  setEtat("connexion");
  let ws;
  try { ws = new WebSocket(`${url}/ws/${sync.cfg.id}`); } catch { return planifierReconnexion(); }
  sync.ws = ws;
  ws.onopen = () => { sync.retry = 1000; ws.send(JSON.stringify({ t: "hello", role: sync.cfg.role, have: sync.ver })); };
  ws.onmessage = (e) => recevoir(JSON.parse(e.data)).catch((err) => console.warn("sync", err));
  ws.onclose = (e) => {
    if (sync.ws !== ws) return;
    sync.ws = null; sync.enVol.clear(); sync.peers = [];
    if (e.code === 1000 && e.reason === "wiped") return;
    setEtat("hors-ligne"); planifierReconnexion();
  };
}
function planifierReconnexion() {
  clearTimeout(sync.timers._re);
  sync.timers._re = setTimeout(connecter, sync.retry);
  sync.retry = Math.min(sync.retry * 2, 30000);
}
addEventListener("online", () => { sync.retry = 1000; connecter(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && sync.cfg && !sync.ws) { sync.retry = 1000; connecter(); } });

async function appliquer(coll, v, blob) {
  const remote = await dechiffrer(blob);
  const local = sync.hooks.lire(coll);
  let res = remote;
  if (sync.dirty.has(coll)) res = merge3(sync.base[coll], local, remote);
  sync.base[coll] = remote; sync.ver[coll] = v;
  if (!same(res, local)) await sync.hooks.ecrire(coll, res);
  if (!same(res, remote)) sync.dirty.add(coll); else sync.dirty.delete(coll);
}

async function recevoir(m) {
  if (m.t === "state") {
    sync.moi = m.you;
    for (const [c, rec] of Object.entries(m.colls)) await appliquer(c, rec.v, rec.blob);
    if (sync.cfg.rejoint) {
      // Appareil qui vient de rejoindre : ce qui existe déjà dans l'espace remplace ses données ;
      // ce qui n'y existe pas encore est envoyé.
      for (const c of sync.cfg.rejoint) { const v = sync.hooks.lire(c); if (!(c in m.colls) && v && Object.keys(v).length) sync.dirty.add(c); }
      delete sync.cfg.rejoint; await db.set("_sync", sync.cfg);
    }
    await persister();
    setEtat("ok");
    for (const c of sync.dirty) envoyer(c);
  } else if (m.t === "upd") {
    await appliquer(m.coll, m.v, m.blob); await persister();
    if (sync.dirty.has(m.coll)) planifier(m.coll);
  } else if (m.t === "ok") {
    sync.enVol.delete(m.coll); sync.ver[m.coll] = m.v;
    const snap = sync.timers["s:" + m.coll];
    sync.base[m.coll] = snap;
    if (same(snap, sync.hooks.lire(m.coll))) sync.dirty.delete(m.coll); else planifier(m.coll);
    await persister();
  } else if (m.t === "conflict") {
    sync.enVol.delete(m.coll);
    if (m.blob) await appliquer(m.coll, m.v, m.blob); else { sync.ver[m.coll] = m.v; }
    sync.dirty.add(m.coll); await persister(); envoyer(m.coll);
  } else if (m.t === "peers") {
    sync.peers = m.list; sync.hooks.etat(sync.etat);
  } else if (m.t === "rc") {
    try { sync.hooks.rc(await dechiffrer(m.blob), m.from); } catch {}
  } else if (m.t === "wiped") {
    await delier(); setEtat("revoque");
  } else if (m.t === "error") console.warn("relais :", m.msg);
}

// ---------- envoi ----------
export function marquer(coll) {
  if (!sync.cfg) return;
  sync.dirty.add(coll);
  db.set("_syncDirty", [...sync.dirty]);
  planifier(coll);
}
function planifier(coll) {
  clearTimeout(sync.timers[coll]);
  sync.timers[coll] = setTimeout(() => envoyer(coll), DEBOUNCE);
}
async function envoyer(coll) {
  if (!sync.ws || sync.ws.readyState !== 1 || sync.etat !== "ok" || sync.enVol.has(coll)) return;
  const snap = structuredClone(sync.hooks.lire(coll));
  sync.enVol.add(coll);
  sync.timers["s:" + coll] = snap;
  const blob = await chiffrer(snap);
  if (!sync.ws || sync.ws.readyState !== 1) { sync.enVol.delete(coll); return; }
  sync.ws.send(JSON.stringify({ t: "put", coll, base: sync.ver[coll] || 0, blob }));
}

// ---------- télécommande ----------
export async function envoyerRc(msg) {
  if (!sync.ws || sync.ws.readyState !== 1) return false;
  sync.ws.send(JSON.stringify({ t: "rc", blob: await chiffrer(msg) }));
  return true;
}
export const ecransConnectes = () => sync.peers.filter((p) => p.role === "pc" && p.id !== sync.moi).length;
export const appareilsConnectes = () => sync.peers.length;
