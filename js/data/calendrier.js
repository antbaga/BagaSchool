// Calendrier scolaire officiel (France métropolitaine).
// Source : service-public.gouv.fr, actualité A18563 (mise à jour du 16 juillet 2026),
// arrêté du 22 octobre 2025 (NOR MENE2526965A).
// Convention : "debut" = premier jour sans classe (samedi, fin des cours la veille),
//              "reprise" = jour de reprise des cours, le matin.
// Note : dans le tableau officiel, la rentrée, la Toussaint, Noël et le début de l'été ne sont
// renseignés qu'une fois (cellules communes aux trois zones). On les applique donc aux zones A, B et C.
// À ajouter chaque année (nouvel arrêté).

export const ZONES = {
  A: "Besançon, Bordeaux, Clermont-Ferrand, Dijon, Grenoble, Limoges, Lyon, Poitiers",
  B: "Aix-Marseille, Amiens, Lille, Nancy-Metz, Nantes, Nice, Normandie, Orléans-Tours, Reims, Rennes, Strasbourg",
  C: "Créteil, Montpellier, Paris, Toulouse, Versailles",
};

export const CALENDRIERS = {
  "2026-2027": {
    rentree: "2026-09-01",
    ete: "2027-07-03",
    vacances: [
      { nom: "Toussaint", A: ["2026-10-17", "2026-11-02"], B: ["2026-10-17", "2026-11-02"], C: ["2026-10-17", "2026-11-02"] },
      { nom: "Noël", A: ["2026-12-19", "2027-01-04"], B: ["2026-12-19", "2027-01-04"], C: ["2026-12-19", "2027-01-04"] },
      { nom: "Hiver", A: ["2027-02-13", "2027-03-01"], B: ["2027-02-20", "2027-03-08"], C: ["2027-02-06", "2027-02-22"] },
      { nom: "Printemps", A: ["2027-04-10", "2027-04-26"], B: ["2027-04-17", "2027-05-03"], C: ["2027-04-03", "2027-04-19"] },
    ],
    // Jours sans classe annoncés dans le texte (en plus des jours fériés)
    pontsOfficiels: [{ date: "2027-05-07", nom: "Pont de l'Ascension" }],
  },
};

// Jours fériés (calculés). Pâques : algorithme de Meeus/Jones/Butcher.
function paques(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day));
}
const iso = (d) => d.toISOString().slice(0, 10);
const plus = (d, n) => new Date(d.getTime() + n * 864e5);
export function joursFeries(y) {
  const p = paques(y);
  return [
    [`${y}-01-01`, "Jour de l'an"], [iso(plus(p, 1)), "Lundi de Pâques"], [`${y}-05-01`, "Fête du Travail"], [`${y}-05-08`, "Victoire 1945"],
    [iso(plus(p, 39)), "Ascension"], [iso(plus(p, 50)), "Lundi de Pentecôte"], [`${y}-07-14`, "Fête nationale"], [`${y}-08-15`, "Assomption"],
    [`${y}-11-01`, "Toussaint"], [`${y}-11-11`, "Armistice 1918"], [`${y}-12-25`, "Noël"],
  ].map(([date, nom]) => ({ date, nom }));
}
