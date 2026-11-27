// Adresse du relais de synchronisation (Cloudflare Worker, dossier worker/).
// Vide = synchronisation désactivée. Pour tester une autre adresse sur un appareil :
// localStorage.setItem("bagaschool-sync-url", "https://…")
export const SYNC_URL = localStorage.getItem("bagaschool-sync-url") || "";
