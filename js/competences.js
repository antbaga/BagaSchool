// Référentiel de compétences / objectifs d'apprentissage.
//
// ÉTAT DU PROTOTYPE : seul un EXTRAIT est présent.
// Texte recopié mot pour mot depuis « Programme de français pour le cycle 3 »
// (annexe publiée sur education.gouv.fr) :
//   https://education.gouv.fr/sites/default/files/ensel620_annexe1.pdf
// Les objectifs dont le texte était trop long pour être vérifié en entier ont été
// volontairement OMIS (pas de texte tronqué ni réécrit).
// À FAIRE avant diffusion : vérifier chaque ligne contre le Bulletin officiel,
// noter la référence BO + date, puis compléter (cycles 1 à 3, toutes disciplines).
//
// Format : un objet par compétence. `id` doit rester stable (il est stocké dans
// les fiches et évaluations de l'utilisatrice).

export const SOURCES = {
  "fr-c3-2025": {
    label: "Programme de français pour le cycle 3 (extrait)",
    url: "https://education.gouv.fr/sites/default/files/ensel620_annexe1.pdf",
    verified: false,
  },
};

const S = "fr-c3-2025";
const F = "Français";
const L = "Lecture";
const E = "Écriture";

const raw = [
  // Lecture — Lire avec fluidité
  ["CM1", L, "Lire avec fluidité", "Lire sans effort un texte d'une page silencieusement ou à voix haute"],
  ["CM1", L, "Lire avec fluidité", "Mémoriser de plus en plus de mots fréquents et irréguliers"],
  ["CM1", L, "Lire avec fluidité", "Lire correctement en ciblant 110 mots par minute en moyenne"],
  ["CM2", L, "Lire avec fluidité", "Poursuivre l'entraînement à la lecture à voix haute et à la lecture silencieuse"],
  ["CM2", L, "Lire avec fluidité", "Lire correctement en ciblant 120 mots par minute en moyenne"],
  // Lecture — Lire à voix haute avec expressivité
  ["CM1", L, "Lire à voix haute avec expressivité", "Lire à voix haute, avec aisance et expressivité, un texte court travaillé en amont"],
  ["CM1", L, "Lire à voix haute avec expressivité", "Gérer l'intensité de sa voix (volume, débit)"],
  ["CM2", L, "Lire à voix haute avec expressivité", "Lire à voix haute, avec aisance et expressivité, un texte travaillé en amont, en respectant l'articulation du texte"],
  ["CM2", L, "Lire à voix haute avec expressivité", "Travailler la mise en voix d'un texte (intonation, effets)"],
  ["CM2", L, "Lire à voix haute avec expressivité", "S'entraîner à faire vivre le texte et prendre du plaisir à le lire"],
  // Lecture — Lire et comprendre seul
  ["CM1", L, "Lire et comprendre seul des textes, des documents et des images", "Développer des stratégies de compréhension"],
  ["CM1", L, "Lire et comprendre seul des textes, des documents et des images", "Repérer, dans un texte, les informations explicites et pointer des informations implicites"],
  ["CM2", L, "Lire et comprendre seul des textes, des documents et des images", "Poursuivre son apprentissage de lecteur autonome face à des textes de plus en plus longs et de plus en plus complexes"],
  ["CM2", L, "Lire et comprendre seul des textes, des documents et des images", "Restituer l'essentiel d'un texte qui contient des informations explicites et des informations implicites"],
  ["CM2", L, "Lire et comprendre seul des textes, des documents et des images", "Reconnaître et nommer les principaux genres littéraires à l'aide de critères travaillés en classe"],
  // Écriture (CM1)
  ["CM1", E, "Écrire à la main de manière fluide et efficace", "Copier et produire des textes"],
  ["CM1", E, "Écrire à la main de manière fluide et efficace", "Acquérir des stratégies de copie"],
  ["CM1", E, "Écrire pour réfléchir, apprendre et mémoriser", "Écrire pour repérer et trier les informations pertinentes"],
  ["CM1", E, "Écrire pour réfléchir, apprendre et mémoriser", "Produire des écrits réflexifs courts pour s'entraîner à expliquer un point de vue"],
  ["CM1", E, "Écrire pour réfléchir, apprendre et mémoriser", "Reformuler, avec l'aide du professeur et de ses pairs, l'essentiel d'une leçon ou d'une activité pour se l'approprier"],
  ["CM1", E, "Écrire pour réfléchir, apprendre et mémoriser", "Produire des écrits courts pour appliquer une règle de grammaire ou employer et mémoriser le lexique appris"],
  ["CM1", E, "Produire des écrits variés", "Découvrir et explorer des situations variées d'écriture : raconter, expliquer"],
  ["CM1", E, "Produire des écrits variés", "Écrire au quotidien des textes personnels (donner son avis, imaginer une suite de texte, formuler des hypothèses, etc.)"],
  ["CM1", E, "Produire des écrits variés", "Utiliser le brouillon pour préparer son texte"],
  ["CM1", E, "Produire des écrits variés", "Exercer sa vigilance quant au respect des codes de l'écrit"],
  ["CM1", E, "Produire des écrits variés", "Prendre conscience des composantes de la cohérence textuelle"],
];

const count = {};
export const COMPETENCES = raw.map(([niveau, domaine, sousDomaine, texte]) => {
  const key = `${niveau}-${domaine}`.toLowerCase().normalize("NFD").replace(/[^a-z0-9-]/g, "");
  count[key] = (count[key] || 0) + 1;
  return { id: `fr-c3-${key}-${count[key]}`, cycle: 3, niveau, discipline: F, domaine, sousDomaine, texte, source: S };
});

export const NIVEAUX = ["PS", "MS", "GS", "CP", "CE1", "CE2", "CM1", "CM2"];
export const DISCIPLINES = ["Français", "Mathématiques", "Questionner le monde", "Sciences et technologie",
  "Histoire-géographie", "Langues vivantes", "Arts plastiques", "Éducation musicale", "EPS", "EMC", "Autre"];
