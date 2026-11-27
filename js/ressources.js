// « Mes ressources » : PDF, images, vidéos, diapos importés dans l'app, rangés par dossier.
// Les fichiers restent sur cet appareil (IndexedDB, base séparée « bagaschool-fichiers ») :
// ils ne sont ni synchronisés ni inclus dans la sauvegarde JSON.
const DB = "bagaschool-fichiers", ST = "fichiers";
let dbp;
const ouvrirDB = () => (dbp ??= new Promise((ok, ko) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(ST, { keyPath: "id" });
  r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error);
}));
const tx = async (mode, fn) => { const db = await ouvrirDB(); return new Promise((ok, ko) => { const t = db.transaction(ST, mode); const q = fn(t.objectStore(ST)); t.oncomplete = () => ok(q?.result); t.onerror = () => ko(t.error); t.onabort = () => ko(t.error); }); };
export const lister = async () => ((await tx("readonly", (s) => s.getAll())) || []).sort((a, b) => (b.ajoute || "").localeCompare(a.ajoute || ""));
export const lire = (id) => tx("readonly", (s) => s.get(id));
export const enregistrer = (f) => tx("readwrite", (s) => s.put(f));
export const supprimer = (id) => tx("readwrite", (s) => s.delete(id));
export const toutSupprimer = () => tx("readwrite", (s) => s.clear());

export function genre(f) {
  const t = f.type || "", n = (f.nom || "").toLowerCase();
  if (t === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (/\.(pptx?|odp|key)$/.test(n)) return "diapo";
  if (/\.(docx?|odt|xlsx?|ods|rtf)$/.test(n)) return "bureautique";
  return "autre";
}
export const ICONES = { pdf: "📄", image: "🖼️", video: "🎬", audio: "🎵", diapo: "📊", bureautique: "📝", autre: "📁" };
export const taille = (o) => o < 1e6 ? `${Math.max(1, Math.round(o / 1e3))} Ko` : `${(o / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
export async function place() {
  try { const e = await navigator.storage?.estimate?.(); return e ? { utilise: e.usage || 0, dispo: e.quota || 0 } : null; } catch { return null; }
}
