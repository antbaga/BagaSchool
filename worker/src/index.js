// Relais de synchronisation BagaSchool (Cloudflare Worker + Durable Object).
//
// Un « espace » = les appareils d'une même enseignante, liés par QR code.
// L'identifiant d'espace (128 bits aléatoires) sert de clé d'accès ; la clé de chiffrement
// ne quitte jamais les appareils : le relais ne stocke et ne transmet que des données chiffrées.
//
// Protocole WebSocket (JSON) :
//   client → relais
//     { t: "hello", role, have: { coll: version } }   à la connexion
//     { t: "put", coll, base, blob }                   écrire une collection (blob = { iv, data } chiffré)
//     { t: "rc", blob }                                message de télécommande (non stocké, relayé)
//     { t: "wipe" }                                    supprimer l'espace (révocation)
//   relais → client
//     { t: "state", colls: { coll: { v, blob } } }     collections plus récentes que « have »
//     { t: "ok", coll, v }                             écriture acceptée
//     { t: "conflict", coll, v, blob }                 version de base dépassée : fusionner puis renvoyer
//     { t: "upd", coll, v, blob }                      une autre machine a écrit
//     { t: "rc", blob, from }                          télécommande
//     { t: "peers", list: [{ id, role }] }             appareils connectés
//     { t: "wiped" } / { t: "error", msg }

const COLLS = new Set(["edt", "programmations", "fiches", "evaluations", "eleves", "reglages", "journal", "appel", "modeles", "decks"]);
const MAX_MSG = 1_900_000; // octets (valeur max d'une ligne SQLite d'un Durable Object : 2 Mo)
const INACTIF = 400 * 864e5; // un espace inutilisé pendant ~13 mois est effacé
const ID_RE = /^[A-Za-z0-9_-]{22}$/; // 16 octets en base64url

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (url.pathname === "/") return new Response("BagaSchool sync relay", { headers: { "content-type": "text/plain" } });
    const m = url.pathname.match(/^\/ws\/([^/]+)$/);
    if (!m || !ID_RE.test(m[1])) return new Response("Not found", { status: 404 });
    if (allowed.length && !allowed.includes(origin)) return new Response("Forbidden origin", { status: 403 });
    if (req.headers.get("Upgrade") !== "websocket") return new Response("Expected websocket", { status: 426 });
    const stub = env.ESPACE.get(env.ESPACE.idFromName(m[1]));
    return stub.fetch(req);
  },
};

export class Espace {
  constructor(ctx) {
    this.ctx = ctx;
  }

  async fetch() {
    if (await this.ctx.storage.get("wiped")) return new Response("Gone", { status: 410 });
    const [client, server] = Object.values(new WebSocketPair());
    const id = crypto.randomUUID().slice(0, 8);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id, role: "?" });
    return new Response(null, { status: 101, webSocket: client });
  }

  peers() {
    return this.ctx.getWebSockets().map((ws) => ws.deserializeAttachment()).filter(Boolean);
  }

  broadcast(msg, except = null) {
    const s = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) if (ws !== except) { try { ws.send(s); } catch {} }
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > MAX_MSG) { ws.send(JSON.stringify({ t: "error", msg: "message trop gros" })); return; }
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    const me = ws.deserializeAttachment() || {};
    const st = this.ctx.storage;

    if (m.t === "hello") {
      me.role = m.role === "tel" ? "tel" : "pc";
      ws.serializeAttachment(me);
      const have = m.have && typeof m.have === "object" ? m.have : {};
      const colls = {};
      for (const c of COLLS) {
        const rec = await st.get("c:" + c);
        if (rec && rec.v > (+have[c] || 0)) colls[c] = rec;
      }
      ws.send(JSON.stringify({ t: "state", colls, you: me.id }));
      this.broadcast({ t: "peers", list: this.peers() });
      return;
    }

    if (m.t === "put") {
      if (!COLLS.has(m.coll) || !m.blob || typeof m.blob.data !== "string" || typeof m.blob.iv !== "string") return;
      const key = "c:" + m.coll;
      const cur = (await st.get(key)) || { v: 0 };
      if ((+m.base || 0) !== cur.v) { ws.send(JSON.stringify({ t: "conflict", coll: m.coll, v: cur.v, blob: cur.blob })); return; }
      const rec = { v: cur.v + 1, blob: { iv: m.blob.iv, data: m.blob.data, z: !!m.blob.z } };
      await st.put(key, rec);
      await st.put("touched", Date.now());
      await st.setAlarm(Date.now() + INACTIF);
      ws.send(JSON.stringify({ t: "ok", coll: m.coll, v: rec.v }));
      this.broadcast({ t: "upd", coll: m.coll, ...rec }, ws);
      return;
    }

    if (m.t === "rc") {
      if (!m.blob || typeof m.blob.data !== "string" || m.blob.data.length > 200_000) return;
      this.broadcast({ t: "rc", blob: m.blob, from: me.id }, ws);
      return;
    }

    if (m.t === "wipe") {
      await st.deleteAll();
      await st.put("wiped", true);
      this.broadcast({ t: "wiped" });
      for (const w of this.ctx.getWebSockets()) { try { w.close(1000, "wiped"); } catch {} }
    }
  }

  async alarm() {
    const t = await this.ctx.storage.get("touched");
    if (!t || Date.now() - t >= INACTIF - 864e5) await this.ctx.storage.deleteAll();
    else await this.ctx.storage.setAlarm(t + INACTIF);
  }

  async webSocketClose(ws) {
    try { ws.close(); } catch {}
    const gone = ws.deserializeAttachment()?.id;
    this.broadcast({ t: "peers", list: this.peers().filter((p) => p.id !== gone) }, ws);
  }

  async webSocketError(ws) { await this.webSocketClose(ws); }
}
