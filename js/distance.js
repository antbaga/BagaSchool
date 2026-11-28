// Distance routière entre deux adresses, avec les services gratuits de l'IGN (Géoplateforme, sans clé).
// - Géocodage : https://data.geopf.fr/geocodage/search
// - Itinéraire : https://data.geopf.fr/navigation/itineraire (ressource bdtopo-osrm, trajet le plus court en voiture)
// Rien n'est envoyé d'autre que les adresses des écoles.
const GEO = "https://data.geopf.fr/geocodage/search";
const ITI = "https://data.geopf.fr/navigation/itineraire";

async function getJSON(url, ms = 12000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Suggestions d'adresses : [{ label, lon, lat }]
export async function chercherAdresse(q, limit = 5) {
  q = String(q || "").trim();
  if (q.length < 3) return [];
  const j = await getJSON(`${GEO}?${new URLSearchParams({ q, limit, index: "address" })}`);
  return (j.features || []).map((f) => {
    const p = f.properties || {}, [lon, lat] = f.geometry?.coordinates || [];
    return { label: p.label || [p.name, p.postcode, p.city].filter(Boolean).join(" "), lon, lat };
  }).filter((x) => Number.isFinite(x.lon) && Number.isFinite(x.lat));
}

// Recherche d'une école par son nom et/ou sa commune dans l'annuaire de l'Éducation nationale
// (data.education.gouv.fr, jeu « fr-en-annuaire-education », sans clé). Renvoie [{ nom, commune, label, lon, lat }].
// Le géocodage IGN ne connaît que les adresses : « École Jules Ferry » n'y donne rien d'utile.
const ANNUAIRE = "https://data.education.gouv.fr/api/records/1.0/search/";
export async function chercherEcole(q, limit = 8) {
  q = String(q || "").replace(/(^|[\s,'-])[ée]coles?(?=[\s,'-]|$)/gi, " ").replace(/\s+/g, " ").trim();
  if (q.length < 3) return [];
  const p = new URLSearchParams({ dataset: "fr-en-annuaire-education", q, rows: limit, "refine.type_etablissement": "Ecole" });
  const j = await getJSON(`${ANNUAIRE}?${p}`);
  return (j.records || []).map((r) => {
    const f = r.fields || {}, [glon, glat] = r.geometry?.coordinates || [];
    const lon = +(f.longitude ?? glon), lat = +(f.latitude ?? glat);
    const nom = f.nom_etablissement || "École", commune = f.nom_commune || "";
    const adresse = [f.adresse_1, [f.code_postal, commune].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    return { nom, commune, label: adresse || commune, lon, lat };
  }).filter((x) => Number.isFinite(x.lon) && Number.isFinite(x.lat));
}

// Distance du trajet le plus court en voiture, en km (arrondie à 0,1).
export async function distanceRoute(a, b) {
  const p = new URLSearchParams({ resource: "bdtopo-osrm", start: `${a.lon},${a.lat}`, end: `${b.lon},${b.lat}`, profile: "car", optimization: "shortest", distanceUnit: "kilometer", getSteps: "false", geometryFormat: "geojson" });
  const j = await getJSON(`${ITI}?${p}`);
  let d = +(j.distance ?? j.properties?.distance);
  if (!Number.isFinite(d)) throw new Error("Réponse inattendue du service d'itinéraire");
  if ((j.distanceUnit || "kilometer").startsWith("m") && j.distanceUnit !== "mile") d /= 1000;
  return Math.round(d * 10) / 10;
}
export const lienGeoportail = "https://www.geoportail.gouv.fr/itineraire";
