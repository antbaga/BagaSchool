// Connexion au projet Supabase (comptes, synchronisation, avis).
// Ces deux valeurs sont publiques par conception : la sécurité repose sur les règles de la base (RLS, supabase/setup.sql).
// Vides = l'app marche sans compte, uniquement sur l'appareil.
// Pour tester un autre projet sur un appareil : localStorage.setItem("bagaschool-supabase", JSON.stringify({ url, key }))
const local = (() => { try { return JSON.parse(localStorage.getItem("bagaschool-supabase")) || {}; } catch { return {}; } })();
export const SUPABASE_URL = local.url || "";
export const SUPABASE_KEY = local.key || "";
