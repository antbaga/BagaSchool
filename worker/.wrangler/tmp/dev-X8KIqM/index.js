var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var COLLS = /* @__PURE__ */ new Set(["edt", "programmations", "fiches", "evaluations", "eleves", "reglages", "journal", "appel", "modeles", "decks"]);
var MAX_MSG = 19e5;
var INACTIF = 400 * 864e5;
var ID_RE = /^[A-Za-z0-9_-]{22}$/;
var src_default = {
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
  }
};
var Espace = class {
  static {
    __name(this, "Espace");
  }
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
    for (const ws of this.ctx.getWebSockets()) if (ws !== except) {
      try {
        ws.send(s);
      } catch {
      }
    }
  }
  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > MAX_MSG) {
      ws.send(JSON.stringify({ t: "error", msg: "message trop gros" }));
      return;
    }
    let m;
    try {
      m = JSON.parse(raw);
    } catch {
      return;
    }
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
      const cur = await st.get(key) || { v: 0 };
      if ((+m.base || 0) !== cur.v) {
        ws.send(JSON.stringify({ t: "conflict", coll: m.coll, v: cur.v, blob: cur.blob }));
        return;
      }
      const rec = { v: cur.v + 1, blob: { iv: m.blob.iv, data: m.blob.data, z: !!m.blob.z } };
      await st.put(key, rec);
      await st.put("touched", Date.now());
      await st.setAlarm(Date.now() + INACTIF);
      ws.send(JSON.stringify({ t: "ok", coll: m.coll, v: rec.v }));
      this.broadcast({ t: "upd", coll: m.coll, ...rec }, ws);
      return;
    }
    if (m.t === "rc") {
      if (!m.blob || typeof m.blob.data !== "string" || m.blob.data.length > 2e5) return;
      this.broadcast({ t: "rc", blob: m.blob, from: me.id }, ws);
      return;
    }
    if (m.t === "wipe") {
      await st.deleteAll();
      await st.put("wiped", true);
      this.broadcast({ t: "wiped" });
      for (const w of this.ctx.getWebSockets()) {
        try {
          w.close(1e3, "wiped");
        } catch {
        }
      }
    }
  }
  async alarm() {
    const t = await this.ctx.storage.get("touched");
    if (!t || Date.now() - t >= INACTIF - 864e5) await this.ctx.storage.deleteAll();
    else await this.ctx.storage.setAlarm(t + INACTIF);
  }
  async webSocketClose(ws) {
    try {
      ws.close();
    } catch {
    }
    const gone = ws.deserializeAttachment()?.id;
    this.broadcast({ t: "peers", list: this.peers().filter((p) => p.id !== gone) }, ws);
  }
  async webSocketError(ws) {
    await this.webSocketClose(ws);
  }
};

// ../../../../tmp/claude-0/wr/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../tmp/claude-0/wr/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-hCWrIi/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../tmp/claude-0/wr/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-hCWrIi/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Espace,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
