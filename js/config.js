// Connexion au projet Supabase (comptes, synchronisation, avis).
// Ces deux valeurs sont publiques par conception : la sécurité repose sur les règles de la base (RLS, supabase/setup.sql).
// Vides = l'app marche sans compte, uniquement sur l'appareil. Projet Supabase : BagaSchool (eu-west-1).
// Pour tester un autre projet sur un appareil : localStorage.setItem("bagaschool-supabase", JSON.stringify({ url, key }))
const local = (() => { try { return JSON.parse(localStorage.getItem("bagaschool-supabase")) || {}; } catch { return {}; } })();
export const SUPABASE_URL = local.url || "https://rvutzqjozduihiyvkhqr.supabase.co";
export const SUPABASE_KEY = local.key || "sb_publishable_JU-JKSC_bDpxM4HVeZsaLw_sGWRk2nC";
