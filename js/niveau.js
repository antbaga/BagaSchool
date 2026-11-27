// Niveau de classe partagé par les jeux de français et de maths (CP à CM2).
// Le dernier niveau choisi est retenu sur l'appareil et repris par tous les jeux.
export const NIVEAUX_JEUX = ["CP", "CE1", "CE2", "CM1", "CM2"];
const CLE = "bagaschool-niveau-jeux";
export const niveauJeux = () => { const n = localStorage.getItem(CLE); return NIVEAUX_JEUX.includes(n) ? n : "CE1"; };
export const choisirNiveau = (n) => { if (NIVEAUX_JEUX.includes(n)) localStorage.setItem(CLE, n); };
// Rang du niveau (CP = 0 … CM2 = 4), pour filtrer « à partir de tel niveau ».
export const rang = (n) => NIVEAUX_JEUX.indexOf(n);
// Sélecteur de niveau : boutons data-niv. À brancher avec surNiveau(e, cb) dans le onclick de l'outil.
export const segNiveau = (courant) => `<div class="seg niv-seg" role="group" aria-label="Niveau">${NIVEAUX_JEUX.map((n) => `<button type="button" data-niv="${n}" class="${n === courant ? "on" : ""}">${n}</button>`).join("")}</div>`;
export const surNiveau = (e, cb) => { const b = e.target.closest("[data-niv]"); if (!b) return false; choisirNiveau(b.dataset.niv); cb(b.dataset.niv); return true; };
