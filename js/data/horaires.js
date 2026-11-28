// Volumes horaires officiels de l'école élémentaire (durée hebdomadaire moyenne, en minutes).
// Source : arrêté du 9 novembre 2015 fixant les horaires d'enseignement des écoles maternelles et élémentaires,
// article 2, version consolidée en vigueur depuis le 1er septembre 2026 (modifié par l'arrêté du 12 juin 2026,
// NOR MENE2613249A), Légifrance LEGIARTI000031519252, lu le 28/11/2026.
// La nouvelle grille du cycle 2 s'applique au CP à la rentrée 2026, au CE1 et au CE2 à la rentrée 2027.
// La grille du cycle 2 d'avant 2026 (« Questionner le monde et EMC » : 2 h 30) n'a pas été relue sur le texte
// officiel : elle vient d'un récapitulatif secondaire (teetsh.com). À vérifier.
// disc : disciplines de l'application (js/competences.js) comptées dans la ligne.
export const SOURCE_HORAIRES = "Arrêté du 9 novembre 2015, article 2 (version modifiée par l'arrêté du 12 juin 2026)";
export const LIEN_HORAIRES = "https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000031519252";

const COMMUN = [
  { nom: "Mathématiques", min: 300, disc: ["Mathématiques"] },
  { nom: "Langues vivantes", min: 90, disc: ["Langues vivantes"] },
  { nom: "EPS", min: 180, disc: ["EPS"] },
  { nom: "Enseignements artistiques", min: 120, disc: ["Arts plastiques", "Éducation musicale"] },
];
const C2_2026 = [
  { nom: "Français", min: 600, disc: ["Français"] }, ...COMMUN,
  { nom: "Sciences et technologie", min: 70, disc: ["Sciences et technologie"] },
  { nom: "Histoire-géographie, EMC", min: 80, disc: ["Histoire-géographie", "EMC"] },
];
const C2_AVANT = [
  { nom: "Français", min: 600, disc: ["Français"] }, ...COMMUN,
  { nom: "Questionner le monde, EMC", min: 150, disc: ["Questionner le monde", "Sciences et technologie", "Histoire-géographie", "EMC"], aVerifier: true },
];
const C3 = [
  { nom: "Français", min: 480, disc: ["Français"] }, ...COMMUN,
  { nom: "Sciences et technologie", min: 120, disc: ["Sciences et technologie"] },
  { nom: "Histoire-géographie, EMC", min: 150, disc: ["Histoire-géographie", "EMC"], note: "dont EMC : 1 h par semaine (36 h par an)" },
];

// Grille d'un niveau pour une année scolaire « 2026-2027 ». null pour la maternelle (pas de volumes par domaine).
export function grilleHoraire(niveau, annee) {
  const debut = parseInt(annee, 10) || new Date().getFullYear();
  let g;
  if (niveau === "CP") g = debut >= 2026 ? C2_2026 : C2_AVANT;
  else if (niveau === "CE1" || niveau === "CE2") g = debut >= 2027 ? C2_2026 : C2_AVANT;
  else if (niveau === "CM1" || niveau === "CM2") g = C3;
  else return null;
  // « Questionner le monde » regroupe sciences, histoire-géographie et EMC : dans la nouvelle grille du cycle 2,
  // on fusionne les deux lignes si l'enseignant·e utilise ce libellé (fait par l'appelant via fusionQLM).
  return g;
}
export const fusionQLM = (g) => {
  const i = g.findIndex((r) => r.nom === "Sciences et technologie"), j = g.findIndex((r) => r.nom === "Histoire-géographie, EMC");
  if (i < 0 || j < 0 || g.some((r) => r.disc.includes("Questionner le monde"))) return g;
  const fus = { nom: "Questionner le monde (sciences, histoire-géo, EMC)", min: g[i].min + g[j].min, disc: ["Questionner le monde", ...g[i].disc, ...g[j].disc] };
  return g.filter((_, k) => k !== i && k !== j).concat(fus);
};
export const TOTAL_HEBDO = 24 * 60;
