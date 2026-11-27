// ISSR (indemnité de sujétions spéciales de remplacement) : montants journaliers officiels, à titre indicatif.
// Décret n° 89-825 du 9 novembre 1989, art. 3 (modifié par le décret n° 2022-1189 du 27 août 2022) :
// le montant dépend de « la distance entre l'école ou l'établissement de rattachement de l'intéressé et
// l'école ou l'établissement où s'effectue le remplacement ».
// Montants par tranche : < 10 km, 10-19, 20-29, 30-39, 40-49, 50-59, 60-80, puis par tranche supplémentaire de 20 km.
// À mettre à jour quand un nouvel arrêté paraît (ajouter une ligne, ne pas modifier les anciennes).
export const ISSR_BAREMES = [
  { du: "2022-01-01", au: null, t: [15.94, 21.04, 26.16, 30.87, 36.86, 42.89, 49.24], sup: 7.34,
    src: "Arrêté du 27 août 2022 (JO du 28 août 2022)" },
  { du: "2026-06-01", au: "2026-12-31", t: [16.45, 21.71, 27.0, 31.86, 38.04, 44.26, 50.82], sup: 7.57,
    src: "Arrêté du 26 juin 2026, majoration temporaire du 1er juin au 31 décembre 2026 (JO du 7 juillet 2026)" },
];
// Le barème qui s'applique à une date : le plus récent dont la période couvre la date.
export function baremeISSR(iso) {
  let b = null;
  for (const x of ISSR_BAREMES) if (iso >= x.du && (!x.au || iso <= x.au)) b = x;
  return b;
}
// Indice de tranche pour une distance en km (19,6 km reste dans « 10 à 19 km »).
export function trancheISSR(km) {
  const k = +km;
  if (!(k > 0)) return -1;
  if (k < 60) return Math.floor(k / 10);
  if (k <= 80) return 6;
  return 6 + Math.ceil((k - 80) / 20);
}
export const nomTrancheISSR = (i) => i < 0 ? "—" : i === 0 ? "moins de 10 km" : i <= 5 ? `${i * 10} à ${i * 10 + 9} km` : i === 6 ? "60 à 80 km" : `${80 + (i - 7) * 20 + 1} à ${80 + (i - 6) * 20} km`;
// Montant d'une journée de remplacement, ou null (distance inconnue ou nulle, ou date sans barème).
export function issrJour(km, iso) {
  const i = trancheISSR(km), b = baremeISSR(iso);
  if (i < 0 || !b) return null;
  return i <= 6 ? b.t[i] : +(b.t[6] + (i - 6) * b.sup).toFixed(2);
}
