// Activités « À découvrir » ajoutées en v0.10 : géographie, histoire, sciences (électricité), histoire des arts.
// Les activités historiques (système solaire, Lune, eau, globe, régions) restent dans js/decouvrir.js.
import { plageNiveaux } from "./kit.js";
import { GEO_FRANCE } from "./geo-france.js";
import { MONDE } from "./monde.js";
import { HISTOIRE } from "./histoire.js";
import { SCIENCES } from "./electricite.js";
import { ARTS } from "./arts.js";

const avecNiveaux = (list) => list.map((o) => ({ ...o, cat: "decouvrir", desc: o.niveaux?.length ? `${o.desc} · ${plageNiveaux(o.niveaux)}` : o.desc }));

export const DECOUVRIR_THEMES = [
  ["🗺️ Géographie", "Cartes de France et du monde : explorer, puis placer les noms.", avecNiveaux([...GEO_FRANCE, ...MONDE])],
  ["🏰 Histoire", "Frises chronologiques : les grandes périodes, puis les dates à placer.", avecNiveaux(HISTOIRE)],
  ["⚡ Sciences : l'électricité", "Construire des circuits, reconnaître les symboles.", avecNiveaux(SCIENCES)],
  ["🎨 Histoire des arts", "Observer des œuvres et apprendre les mots pour en parler.", avecNiveaux(ARTS)],
];
export const DECOUVRIR_PLUS = DECOUVRIR_THEMES.flatMap(([, , l]) => l);
