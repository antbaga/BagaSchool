// Grille de mots mêlés, partagée entre le jeu (En classe) et la fiche à imprimer.
// rnd : fonction qui renvoie un nombre dans [0, 1[ (Math.random ou générateur avec graine).

export const normMot = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/Œ/g, "OE").replace(/Æ/g, "AE").replace(/[^A-Z]/g, "");

const DIRS = {
  facile: [[0, 1], [1, 0]],
  moyen: [[0, 1], [1, 0], [1, 1], [-1, 1]],
  difficile: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]],
};

export function grilleMotsMeles(mots, taille, niveau = "facile", rnd = Math.random) {
  const dirs = DIRS[niveau] ?? DIRS.facile;
  const liste = [...new Set(mots.map((m) => m.trim()).filter(Boolean))]
    .map((m) => ({ mot: m, n: normMot(m) }))
    .filter((m) => m.n.length >= 2 && m.n.length <= taille)
    .sort((a, b) => b.n.length - a.n.length);
  const g = Array.from({ length: taille }, () => Array(taille).fill(""));
  const places = [], rejetes = [];
  for (const m of liste) {
    let ok = false;
    for (let essai = 0; essai < 400 && !ok; essai++) {
      const [dr, dc] = dirs[Math.floor(rnd() * dirs.length)];
      const r0 = Math.floor(rnd() * taille), c0 = Math.floor(rnd() * taille);
      const r1 = r0 + dr * (m.n.length - 1), c1 = c0 + dc * (m.n.length - 1);
      if (r1 < 0 || r1 >= taille || c1 < 0 || c1 >= taille) continue;
      const cells = [...m.n].map((_, i) => [r0 + dr * i, c0 + dc * i]);
      if (cells.every(([r, c], i) => !g[r][c] || g[r][c] === m.n[i])) {
        cells.forEach(([r, c], i) => (g[r][c] = m.n[i]));
        places.push({ ...m, cells });
        ok = true;
      }
    }
    if (!ok) rejetes.push(m.mot);
  }
  // Remplissage : lettres tirées des mots eux-mêmes, pour ne pas laisser d'indices évidents
  const pool = liste.map((m) => m.n).join("") || "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const row of g) for (let c = 0; c < taille; c++) if (!row[c]) row[c] = pool[Math.floor(rnd() * pool.length)];
  return { grille: g, places, rejetes };
}
