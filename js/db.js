// Stockage local (IndexedDB). Une base, un store "kv" : une clé par collection.
const DB_NAME = "bagaschool";
const STORE = "kv";
let dbp;

function open() {
  if (!dbp) dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => res(out && "result" in out ? out.result : undefined);
    t.onerror = () => rej(t.error);
  });
}
export const get = (k) => tx("readonly", (s) => s.get(k));
export const set = (k, v) => tx("readwrite", (s) => s.put(v, k));
export const clear = () => tx("readwrite", (s) => s.clear());

export const COLLECTIONS = ["edt", "programmations", "fiches", "evaluations", "eleves", "reglages", "journal", "appel", "modeles", "decks", "devoirs", "cahier", "remplacements"];
export const OBJETS = ["reglages", "journal", "appel", "devoirs", "remplacements"]; // collections stockées comme objets (les autres sont des listes)

export async function loadAll() {
  const data = {};
  for (const c of COLLECTIONS) data[c] = (await get(c)) ?? (OBJETS.includes(c) ? {} : []);
  return data;
}

export async function requestPersistence() {
  try { if (navigator.storage?.persist) return await navigator.storage.persist(); } catch {}
  return false;
}
