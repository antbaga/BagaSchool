// Français : « Vocabulaire » (familles de mots, sons et lettres, genre, préfixes et suffixes,
// synonymes et contraires) et « Mots flash » (mots invariables montrés quelques secondes).
// Même format que outils.js : { id, nom, icone, couleur, desc, mount(el, ctx) -> cleanup }.
// Tous les contenus sont dans les tableaux ci-dessous, par niveau, pour être relus et complétés.
import { niveauJeux, segNiveau, surNiveau, rang } from "./niveau.js";
import { moinsAnim } from "./anim.js";

const hasard = (n) => Math.floor(Math.random() * n);
const melange = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = hasard(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const liste = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
// Plage de niveaux : "CP-CE1" = du CP au CE1, "CM2" = CM2 seulement.
export const dans = (niv, plage) => { const [a, b = a] = plage.split("-"); return rang(niv) >= rang(a) && rang(niv) <= rang(b); };

// =====================================================================
// CONTENUS — à relire par l'enseignante.
// Repères : programmes 2024 du cycle 2 (en vigueur depuis la rentrée 2025) et 2025 du cycle 3,
// partie « étude de la langue / vocabulaire » : familles de mots et dérivation (préfixes, suffixes)
// en cycle 2 puis approfondies au cycle 3 ; correspondances graphème-phonème au CP-CE1 ; genre des
// noms ; synonymes et antonymes. La répartition par niveau ci-dessous est un choix, à ajuster.
// =====================================================================

// ---------- FAMILLES DE MOTS ----------
// tete : le mot qui donne son nom à la famille · mots : les mots à ranger · sens : « … n'a rien à voir avec <sens> »
// intrus : un mot qui ressemble mais n'est pas de la famille (jeu « L'intrus ») · pourquoi : précision sur l'intrus.
const F = (niv, tete, mots, sens, intrus = "", pourquoi = "") => ({ niv, tete, mots: liste(mots), sens, intrus, pourquoi });
export const FAMILLES = [
  F("CP-CE2", "fleur", "fleuriste, fleurir, fleuri", "les fleurs", "fleuve", "un fleuve est un grand cours d'eau"),
  F("CP-CE2", "chant", "chanter, chanteur, chanson, chantonner", "le chant", "chantier", "un chantier est un lieu où l'on construit"),
  F("CP-CE1", "dent", "dentiste, dentifrice, dentier", "les dents"),
  F("CP-CE1", "lait", "laitier, laitage, laiterie", "le lait"),
  F("CP-CE1", "jardin", "jardinier, jardiner, jardinage", "le jardin"),
  F("CP-CE1", "poisson", "poissonnier, poissonnerie", "les poissons", "poison", "un poison est un produit dangereux"),
  F("CP-CE1", "école", "écolier, écolière", "l'école", "écureuil", "c'est un animal"),
  F("CP-CE2", "loup", "louve, louveteau", "le loup", "loupe", "une loupe est un verre qui grossit"),
  F("CE1-CE2", "terre", "terrain, enterrer, terrier, terrestre", "la terre", "terrible", "il vient de « terreur »"),
  F("CE1-CM1", "glace", "glacier, glacé, glaçon, glacial", "la glace"),
  F("CE1-CE2", "neige", "neiger, enneigé, neigeux", "la neige"),
  F("CE1-CE2", "froid", "refroidir, froideur, froidement", "le froid"),
  F("CE1-CE2", "sale", "salir, saleté, salissant", "ce qui est sale", "salade", "il vient de « sel »"),
  F("CE1-CM1", "long", "longueur, allonger, rallonger, longtemps", "ce qui est long"),
  F("CE1-CM1", "bois", "boisé, reboiser, déboiser, sous-bois", "le bois", "boisson", "il vient de « boire »"),
  F("CE2-CM1", "pluie", "pleuvoir, pluvieux, parapluie", "la pluie", "plume", "les plumes couvrent les oiseaux"),
  F("CE2-CM1", "grand", "grandir, agrandir, grandeur", "ce qui est grand", "grange", "une grange est un bâtiment de ferme"),
  F("CE2-CM1", "peur", "peureux, apeuré, peureusement", "la peur", "peuple", "un peuple, ce sont les habitants d'un pays"),
  F("CE2-CM1", "plante", "planter, plantation, replanter", "les plantes", "planète", "une planète tourne autour du Soleil"),
  F("CE2-CM2", "dent", "dentaire, dentition, édenté, dentiste", "les dents"),
  F("CM1-CM2", "connaître", "connaissance, reconnaître, inconnu, méconnaissable", "le fait de connaître", "connecter", "connecter veut dire « relier »"),
  F("CM1-CM2", "lumière", "lumineux, allumer, illuminer, luminosité", "la lumière"),
  F("CM1-CM2", "mer", "marin, maritime, amerrir, marée", "la mer", "merci"),
  F("CM1-CM2", "terre", "territoire, terrestre, atterrir, souterrain", "la terre", "terreur", "la terreur est une très grande peur"),
  F("CM1-CM2", "vie", "vivre, vivant, survivre, vital", "la vie", "vitre", "une vitre est le verre d'une fenêtre"),
  F("CM1-CM2", "pied", "piéton, piétiner, trépied, piédestal", "le pied", "pièce"),
  F("CM1-CM2", "chaud", "chaleur, réchauffer, chauffage, chaleureux", "la chaleur", "chaussure", "il vient de « chausser »"),
  F("CM1-CM2", "écrire", "écriture, écrivain, réécrire, écriteau", "l'écriture", "écran"),
  F("CM1-CM2", "fleur", "floral, floraison, fleuriste, défleurir", "les fleurs", "flocon", "un flocon est un petit morceau de neige"),
  F("CM2", "nuit", "nocturne, minuit, nuitée", "la nuit", "nuire", "nuire veut dire « faire du mal »"),
  F("CM2", "eau", "aquatique, aquarium, aqueduc", "l'eau"),
];

// ---------- LES SONS ET LES LETTRES ----------
// Une ligne = une colonne : « graphie | titre affiché : mot, mot… ». Un emoji après le mot = image (surtout au CP).
// « mot>indice » : l'indice est montré à la correction (lettres muettes : grand>grande).
// Règle suivie : chaque mot ne contient qu'une seule écriture du son travaillé.
const S = (niv, id, son, cols, aide = "") => ({ niv, id, son, aide, cols: cols.trim().split("\n").map((l) => { const [t, m] = l.split(":"); const [g, titre = g] = t.split("|").map((x) => x.trim()); return { g, titre, mots: liste(m) }; }) });
export const SONS = [
  S("CP-CE1", "o", "[o] comme dans « vélo »", `
    o : vélo 🚲, moto 🏍️, robot 🤖, piano 🎹
    au : chaussure 👟, jaune 🟡, dauphin 🐬, sauterelle 🦗
    eau : bateau ⛵, gâteau 🎂, cadeau 🎁, chapeau 🎩`),
  S("CP-CE1", "an", "[ɑ̃] comme dans « maman »", `
    an : maman 👩, éléphant 🐘, orange 🍊, pantalon 👖
    en : dent 🦷, tente ⛺, serpent 🐍, vent 🌬️
    am : lampe 💡, jambe 🦵, champignon 🍄, framboise
    em : tempête ⛈️, décembre, trembler`, "On écrit « am » ou « em » devant m, b, p."),
  S("CP", "in", "[ɛ̃] comme dans « lapin »", `
    in : lapin 🐰, sapin 🎄, requin 🦈, moulin
    ain : pain 🍞, main ✋, bain 🛁, train 🚆
    ein : peinture 🎨, ceinture, frein, plein`),
  S("CP", "k", "[k] comme dans « koala »", `
    c : carotte 🥕, canard 🦆, cactus 🌵, cochon 🐷
    k : kangourou 🦘, koala 🐨, kiwi 🥝, kayak 🛶
    qu : moustique 🦟, masque 🎭, perroquet 🦜, bouquet 💐`),
  S("CE1", "in", "[ɛ̃] comme dans « lapin »", `
    in : lapin, sapin, requin, jardin
    im : timbre, simple, grimper, imprimer
    ain : pain, main, train, bain
    ein : peinture, ceinture, frein, plein`, "On écrit « im » devant m, b, p."),
  S("CE1", "s", "[s] comme dans « sac »", `
    s : sac, salade, soleil, sirop
    ss : poisson, tasse, trousse, chaussette
    c|c (devant e, i) : citron, cinéma, ciel, pouce
    ç|ç (devant a, o, u) : garçon, leçon, glaçon, maçon`, "Entre deux voyelles, on double le s : poisson. Devant a, o, u, le c prend une cédille : garçon."),
  S("CE1-CE2", "j", "[ʒ] comme dans « girafe »", `
    j : jardin, jupe, joue, bijou
    g|g (devant e, i) : girafe, gilet, genou, magie
    ge|ge (devant a, o) : pigeon, plongeon, bourgeon, orangeade`, "Devant a et o, on ajoute un e après le g : pigeon."),
  S("CE1", "è", "[ɛ] comme dans « mère »", `
    è : mère, flèche, chèvre, rivière
    ê : tête, fête, forêt, fenêtre
    ai : lait, balai, fraise, chaise
    ei : neige, baleine, reine, seize
    et : jouet, poulet, bonnet, carnet`),
  S("CE2", "s", "[s] comme dans « sac »", `
    s : sac, salade, soleil, sirop
    ss : poisson, tasse, trousse, brosse
    c|c (devant e, i) : citron, cinéma, ciel, pouce
    ç|ç (devant a, o, u) : garçon, leçon, glaçon, reçu
    t|t (dans -tion) : attention, addition, récréation, opération`),
  S("CE2-CM1", "é", "[e] comme dans « bébé »", `
    é : bébé, école, café, épée
    er : boulanger, panier, rocher, premier
    ez : nez, chez, assez`),
  S("CE2-CM2", "è", "[ɛ] comme dans « mère »", `
    è : mère, flèche, chèvre, rivière
    ê : tête, fête, forêt, fenêtre
    ai : lait, balai, fraise, chaise
    ei : neige, baleine, reine, seize
    et : jouet, poulet, bonnet, carnet
    e|e (devant deux consonnes) : terre, perle, veste, merci`, "Le e se prononce [ɛ] devant deux consonnes : terre, veste."),
  S("CE2", "g", "[g] comme dans « gare »", `
    g : gare, gomme, glace, grenouille
    gu|gu (devant e, i) : guitare, guêpe, bague, langue`, "Devant e et i, on ajoute un u après le g : guêpe."),
  S("CE2-CM2", "muettes", "Les lettres muettes à la fin du mot", `
    d : bavard>bavarder, grand>grande, chaud>chaude, froid>froide
    t : petit>petite, chat>chaton, lit>literie, fort>forte
    s : gros>grosse, gris>grise, bras>brassard, mauvais>mauvaise
    g : long>longue, rang>ranger, sang>sanguin
    p : drap>draper, galop>galoper, coup>couper`, "Pour trouver la lettre muette, on cherche un mot de la même famille ou le féminin."),
  S("CM1-CM2", "s", "[s] comme dans « sac »", `
    s : sac, salade, soleil, sirop
    ss : poisson, tasse, trousse, brosse
    c|c (devant e, i) : citron, cinéma, ciel, pouce
    ç|ç (devant a, o, u) : garçon, leçon, glaçon, reçu
    t|t (dans -tion) : attention, addition, récréation, opération
    sc : piscine, descendre, scie, scène`),
  S("CM1-CM2", "f", "[f] comme dans « fusée »", `
    f : fusée, café, fourmi, girafe
    ff : coffre, chiffre, effort, souffle
    ph : phare, photo, éléphant, dauphin`),
  S("CM1-CM2", "an", "[ɑ̃] comme dans « maman »", `
    an : orange, pantalon, chanson, géant
    en : serpent, dent, ventre, cent
    am : lampe, jambe, champion, tambour
    em : tempête, décembre, embrasser, septembre`, "On écrit « am » ou « em » devant m, b, p."),
];

// ---------- LE GENRE DES NOMS ----------
// m : noms masculins (un) · f : noms féminins (une). Au CE2 et au cours moyen : des noms « pièges ».
const G = (niv, nom, m, f) => ({ niv, nom, m: liste(m), f: liste(f) });
export const GENRES = [
  G("CP", "Un ou une ?", "vélo 🚲, ballon 🎈, livre 📕, crayon 🖍️, lit 🛏️, gâteau 🎂, chapeau 🎩, bateau ⛵",
    "fraise 🍓, pomme 🍎, maison 🏠, fleur 🌸, voiture 🚗, robe 👗, banane 🍌, lune 🌙"),
  G("CE1", "Un ou une ?", "cahier 📓, soleil ☀️, avion ✈️, stylo 🖊️, oiseau 🐦, train 🚆, nuage ☁️, arbre 🌳",
    "chaise 🪑, porte 🚪, étoile ⭐, école 🏫, assiette 🍽️, lampe 💡, cerise 🍒, montagne ⛰️"),
  G("CE2", "Les noms pièges", "arbre, orage, avion, éclair, hôpital, escalier, ongle, insecte, incendie, élastique, légume, pétale",
    "horloge, espèce, oreille, armoire, épaule, échelle, écharpe, enveloppe, image, araignée, usine, oasis"),
  G("CM1-CM2", "Les noms pièges", "tentacule, astérisque, pétale, hémisphère, planisphère, autographe, emblème, haltère, intervalle, armistice, apogée, épisode, éloge, antidote, équinoxe, orage",
    "oasis, omoplate, atmosphère, orbite, stalactite, icône, anagramme, épithète, apostrophe, orthographe, alcôve, argile, horloge, espèce"),
];
// Masculin → féminin (CE1 et plus) : « masculin>féminin ».
const PAIRES = (niv, s) => ({ niv, paires: liste(s).map((p) => p.split(">")) });
export const FEMININS = [
  PAIRES("CE1", "ami>amie, voisin>voisine, cousin>cousine, marchand>marchande, lapin>lapine, boulanger>boulangère, fermier>fermière, chanteur>chanteuse, danseur>danseuse, lion>lionne, chat>chatte"),
  PAIRES("CE2", "lion>lionne, chien>chienne, musicien>musicienne, boulanger>boulangère, chanteur>chanteuse, acteur>actrice, directeur>directrice, prince>princesse, roi>reine, coq>poule, cheval>jument, loup>louve, tigre>tigresse, maître>maîtresse"),
  PAIRES("CM1-CM2", "héros>héroïne, comte>comtesse, empereur>impératrice, dieu>déesse, compagnon>compagne, jumeau>jumelle, neveu>nièce, parrain>marraine, oncle>tante, veuf>veuve, sportif>sportive, canard>cane, sanglier>laie, cerf>biche, jars>oie, taureau>vache, bélier>brebis"),
];

// ---------- PRÉFIXES ET SUFFIXES (CE2 et plus) ----------
// « Construire » : on pose le préfixe ou le suffixe qui convient au sens donné.
// P(préfixe, radical, mot, sens) : préfixe + radical = mot. X(radical, suffixe, mot, sens, mot de base).
const P = (aff, rac, mot, sens) => ({ type: "pre", aff, rac, mot, sens });
const X = (rac, aff, mot, sens, base = "") => ({ type: "suf", aff, rac, mot, sens, base });
export const CONSTRUIRE = {
  CE2: [
    P("re", "faire", "refaire", "faire de nouveau"), P("re", "lire", "relire", "lire de nouveau"), P("re", "partir", "repartir", "partir de nouveau"),
    P("dé", "coller", "décoller", "le contraire de coller"), P("dé", "boucher", "déboucher", "le contraire de boucher"), P("dé", "faire", "défaire", "le contraire de faire"),
    P("in", "connu", "inconnu", "qui n'est pas connu"), P("in", "visible", "invisible", "qu'on ne peut pas voir"),
    P("im", "possible", "impossible", "qui n'est pas possible"), P("im", "poli", "impoli", "qui n'est pas poli"), P("im", "patient", "impatient", "qui n'est pas patient"),
    X("chant", "eur", "chanteur", "celui qui chante", "chanter"), X("nag", "eur", "nageur", "celui qui nage", "nager"),
    X("jardin", "ier", "jardinier", "celui qui s'occupe du jardin"), X("fleur", "iste", "fleuriste", "celui qui vend des fleurs"),
    X("fill", "ette", "fillette", "une petite fille", "fille"), X("fleur", "ette", "fleurette", "une petite fleur"),
    X("chat", "on", "chaton", "un petit chat"), X("lav", "age", "lavage", "l'action de laver", "laver"), X("arros", "age", "arrosage", "l'action d'arroser", "arroser"),
  ],
  CM1: [
    P("pré", "histoire", "préhistoire", "la période avant l'histoire"), P("pré", "voir", "prévoir", "voir à l'avance"),
    P("mé", "content", "mécontent", "qui n'est pas content"), P("dés", "obéir", "désobéir", "ne pas obéir"), P("dés", "ordre", "désordre", "le contraire de l'ordre"),
    P("sur", "charger", "surcharger", "charger trop"), P("sous-", "marin", "sous-marin", "qui va sous la mer"), P("sous-", "sol", "sous-sol", "ce qui est sous le sol"),
    P("in", "utile", "inutile", "qui n'est pas utile"), P("im", "mangeable", "immangeable", "qu'on ne peut pas manger"),
    P("ré", "écrire", "réécrire", "écrire de nouveau"), P("ré", "chauffer", "réchauffer", "chauffer de nouveau"), P("mal", "honnête", "malhonnête", "qui n'est pas honnête"),
    X("lav", "able", "lavable", "qu'on peut laver", "laver"), X("mange", "able", "mangeable", "qu'on peut manger", "manger"),
    X("lente", "ment", "lentement", "de manière lente", "lent"), X("douce", "ment", "doucement", "de manière douce", "doux"),
    X("peur", "eux", "peureux", "qui a peur"), X("danger", "eux", "dangereux", "qui présente un danger"),
    X("invent", "ion", "invention", "ce qu'on a inventé", "inventer"), X("boulanger", "ie", "boulangerie", "le magasin du boulanger"),
    X("dent", "iste", "dentiste", "le médecin des dents"), X("range", "ment", "rangement", "l'action de ranger", "ranger"),
  ],
  CM2: [
    P("il", "lisible", "illisible", "qu'on ne peut pas lire"), P("il", "légal", "illégal", "qui n'est pas légal"),
    P("ir", "réel", "irréel", "qui n'est pas réel"), P("ir", "responsable", "irresponsable", "qui n'est pas responsable"),
    P("anti", "vol", "antivol", "qui protège contre le vol"), P("co", "pilote", "copilote", "celui qui pilote avec le pilote"),
    P("trans", "porter", "transporter", "porter d'un lieu à un autre"), P("inter", "national", "international", "entre les nations"),
    P("multi", "colore", "multicolore", "de plusieurs couleurs"), P("sur", "naturel", "surnaturel", "au-dessus de ce qui est naturel"),
    P("extra", "ordinaire", "extraordinaire", "qui sort de l'ordinaire"), P("pré", "venir", "prévenir", "avertir à l'avance"),
    X("fais", "able", "faisable", "qu'on peut faire", "faire"), X("tranquille", "ment", "tranquillement", "de manière tranquille"),
    X("courag", "eux", "courageux", "qui a du courage", "courage"), X("nettoy", "age", "nettoyage", "l'action de nettoyer", "nettoyer"),
    X("fragil", "ité", "fragilité", "le fait d'être fragile", "fragile"), X("rapid", "ité", "rapidité", "le fait d'être rapide", "rapide"),
    X("beau", "té", "beauté", "le fait d'être beau"), X("explor", "ateur", "explorateur", "celui qui explore", "explorer"),
    X("décor", "ation", "décoration", "l'action de décorer", "décorer"),
  ],
};
// « Le sens » : ranger les mots selon le sens du préfixe ou du suffixe. « titre | aide : mots ».
const SENS = (niv, nom, cols) => ({ niv, nom, cols: cols.trim().split("\n").map((l) => { const [t, m] = l.split(":"); const [titre, aide = ""] = t.split("|").map((x) => x.trim()); return { titre, aide, mots: liste(m) }; }) });
export const SENS_AFFIXES = [
  SENS("CE2", "Le sens des suffixes", `
    petit | -ette, -et, -on : fillette, fleurette, chaton, ourson, livret, jardinet
    celui qui… (métier) | -eur, -ier, -iste : chanteur, nageur, jardinier, fleuriste, dentiste, coiffeur
    l'action de… | -age, -ment : lavage, arrosage, jardinage, rangement, nettoyage, freinage`),
  SENS("CM1-CM2", "Le sens des préfixes", `
    le contraire, pas | in-, im-, dé-, dés-, mé-, mal- : invisible, impossible, défaire, désordre, mécontent, malhonnête, inutile
    de nouveau | re-, ré- : relire, refaire, réécrire, repartir, réchauffer, revoir
    avant | pré- : préhistoire, prévoir, préchauffer, préavis
    sous | sous- : sous-marin, sous-sol, sous-titre, sous-vêtement`),
  SENS("CM1-CM2", "Le sens des suffixes", `
    qu'on peut… | -able, -ible : lavable, mangeable, buvable, faisable, jetable
    de manière… | -ment : lentement, doucement, rapidement, tranquillement
    le fait d'être… | -té, -ité, -esse : beauté, rapidité, fragilité, tendresse, politesse`),
  SENS("CM2", "D'autres préfixes", `
    le contraire | il-, ir-, dé-, dés- : illisible, irréel, illégal, déloyal, désagréable
    contre | anti-, para- : antivol, antigel, parapluie, parasol, paratonnerre
    plusieurs | multi-, poly- : multicolore, polygone, multiprise
    loin, à distance | télé- : téléphone, télévision, télescope, télécommande`),
];

// ---------- SYNONYMES ET CONTRAIRES ----------
const PA = (niv, s) => ({ niv, paires: liste(s).map((p) => p.split("/")) });
export const CONTRAIRES = [
  PA("CP-CE1", "grand/petit, chaud/froid, jour/nuit, haut/bas, vieux/jeune, ouvrir/fermer, monter/descendre, rapide/lent, plein/vide, propre/sale, gentil/méchant, devant/derrière, dur/mou, lourd/léger, entrer/sortir, gagner/perdre, allumer/éteindre, tôt/tard, acheter/vendre, rire/pleurer"),
  PA("CE2", "facile/difficile, intérieur/extérieur, présent/absent, large/étroit, toujours/jamais, commencer/finir, ami/ennemi, accepter/refuser, réussir/échouer, remplir/vider, mince/épais, monter/descendre, lourd/léger, allumer/éteindre, acheter/vendre, gagner/perdre"),
  PA("CM1-CM2", "généreux/avare, courageux/lâche, rare/fréquent, augmenter/diminuer, ancien/moderne, calme/agité, clair/obscur, maximum/minimum, victoire/défaite, paresseux/travailleur, attaquer/défendre, réussite/échec, sauvage/domestique, optimiste/pessimiste, autoriser/interdire, naturel/artificiel, économiser/dépenser, accepter/refuser"),
];
export const SYNONYMES = [
  PA("CE2", "heureux/content, joli/beau, commencer/débuter, finir/terminer, crier/hurler, vélo/bicyclette, docteur/médecin, regarder/observer, drôle/amusant, peur/frayeur, maison/habitation, voiture/automobile"),
  PA("CM1-CM2", "étrange/bizarre, célèbre/connu, erreur/faute, triste/malheureux, énorme/gigantesque, voler/dérober, habiter/résider, fatigué/épuisé, désirer/souhaiter, achever/terminer, craindre/redouter, commencer/entamer, briller/étinceler, cadeau/présent, colère/fureur, aimable/gentil, effrayant/terrifiant"),
];

// ---------- MOTS FLASH : mots invariables par niveau ----------
export const MOTS_FLASH = {
  CP: liste("et, ou, mais, avec, dans, sur, sous, chez, très, puis, pour, par, sans, aussi, alors, après, avant, ici, oui, non, bien, plus, moins, vite"),
  CE1: liste("aujourd'hui, beaucoup, toujours, jamais, maintenant, pendant, quand, souvent, longtemps, bientôt, hier, demain, encore, déjà, peut-être, dehors, dedans, devant, derrière, entre, contre, depuis, ensuite, comme, trop, assez, ensemble, tard, tôt, parce que"),
  CE2: liste("autour, loin, près, partout, surtout, pourquoi, combien, comment, dessus, dessous, parmi, presque, ailleurs, enfin, soudain, voici, voilà, aussitôt, plutôt, vraiment, malgré, selon, autant, hélas, tant, lorsque, là-bas, puisque, certainement, tout à coup"),
  CM1: liste("cependant, désormais, parfois, autrefois, davantage, environ, lorsque, pourtant, quelquefois, aussitôt, autant, malgré, selon, puisque, ainsi, auprès, plutôt, tantôt, tandis que, d'abord, au-dessus, au-dessous, longtemps, beaucoup, ensuite, vraiment, partout, dorénavant"),
  CM2: liste("néanmoins, toutefois, dorénavant, auparavant, volontiers, certes, hormis, excepté, naguère, d'ailleurs, quoique, désormais, cependant, davantage, quelquefois, autrefois, pourtant, environ, parfois, tandis que, aussitôt, lorsque, jusqu'à, afin que, c'est-à-dire"),
};

// =====================================================================
// Outils communs : emojis (illustrations Fluent 3D quand elles existent), glisser-déposer.
// =====================================================================
const EMO_DISPO = new Set("1f301 1f327 1f328 1f32c 1f34a 1f34c 1f34e 1f353 1f355 1f35e 1f35f 1f366 1f36b 1f370 1f381 1f384 1f385 1f392 1f411 1f414 1f418 1f41f 1f426 1f42d 1f42e 1f430 1f431 1f434 1f435 1f436 1f437 1f438 1f441 1f442 1f443 1f444 1f452 1f453 1f455 1f456 1f457 1f45e 1f45f 1f466 1f467 1f468 1f469 1f474 1f475 1f476 1f47c 1f4aa 1f4bb 1f4cf 1f4d3 1f4d5 1f514 1f552 1f56f 1f58a 1f58d 1f600 1f60b 1f611 1f620 1f622 1f628 1f632 1f634 1f6f7 1f912 1f955 1f95a 1f95b 1f97e 1f981 1f98c 1f9b5 1f9b6 1f9b7 1f9c0 1f9dd 1f9e2 1f9e3 1f9e4 1f9e5 1f9e6 1fa73 1fa91 2600 2601 2603 26c8 2702 270b 270f 2744 2b50".split(" "));
const codeEmo = (g) => [...g].map((c) => c.codePointAt(0)).filter((c) => c !== 0xfe0f).map((c) => c.toString(16)).join("-");
const RE_EMO = /\s+(\p{Extended_Pictographic}[\u{FE0F}\u{200D}\p{Extended_Pictographic}]*)$/u;
// « vélo 🚲 » -> { txt: "vélo", emo: "🚲" } ; « bavard>bavarder » -> { txt: "bavard", note: "bavarder" }
export const lireMot = (s) => { let emo = ""; const m = s.match(RE_EMO); if (m) { emo = m[1]; s = s.slice(0, m.index); } const [txt, note = ""] = s.split(">"); return { txt: txt.trim(), emo, note: note.trim() }; };
const emoHTML = (emo) => !emo ? "" : EMO_DISPO.has(codeEmo(emo)) ? `<img class="vo-emo" src="img/emoji/${codeEmo(emo)}.webp" alt="" draggable="false">` : `<span class="vo-emo vo-emo-t" aria-hidden="true">${emo}</span>`;

// Glisser au doigt, au stylet ou à la souris ; le « toucher puis toucher » reste possible.
function glisser(el, { source, cible, deposer }) {
  let drag = null;
  const bouge = (e) => {
    if (!drag) return;
    if (!drag.fant && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
      const g = drag.src.cloneNode(true); g.classList.add("vo-fantome"); g.classList.remove("on");
      document.body.appendChild(g); drag.fant = g; drag.src.classList.add("vo-parti");
    }
    if (drag.fant) {
      e.preventDefault(); drag.fant.style.left = e.clientX + "px"; drag.fant.style.top = e.clientY + "px";
      el.querySelectorAll(".vo-survol").forEach((x) => x.classList.remove("vo-survol"));
      const c = document.elementFromPoint(e.clientX, e.clientY)?.closest(cible); if (c && el.contains(c)) c.classList.add("vo-survol");
    }
  };
  const arreter = () => { drag?.fant?.remove(); drag = null; window.removeEventListener("pointermove", bouge); window.removeEventListener("pointerup", lache); window.removeEventListener("pointercancel", arreter); };
  const lache = (e) => {
    const d = drag; arreter(); if (!d?.fant) return;
    el._vuGlisse = true; setTimeout(() => { el._vuGlisse = false; }, 60);
    const c = document.elementFromPoint(e.clientX, e.clientY)?.closest(cible);
    deposer(d.k, c && el.contains(c) ? c : null);
  };
  const appui = (e) => {
    const b = e.target.closest(source); if (!b || !el.contains(b)) return;
    drag = { k: b.dataset.k, x: e.clientX, y: e.clientY, src: b, fant: null };
    window.addEventListener("pointermove", bouge, { passive: false }); window.addEventListener("pointerup", lache); window.addEventListener("pointercancel", arreter);
  };
  el.addEventListener("pointerdown", appui);
  return () => { arreter(); el.removeEventListener("pointerdown", appui); };
}

// =====================================================================
// OUTIL 1 : VOCABULAIRE
// Trois sortes de plateaux : « tri » (ranger en colonnes), « cases » (une étiquette par case),
// « intrus » (série de questions : toucher l'intrus).
// =====================================================================
const JEUX = [
  { id: "familles", nom: "Familles de mots", ico: "🌳", des: "CP" },
  { id: "sons", nom: "Sons et lettres", ico: "👂", des: "CP" },
  { id: "genre", nom: "Le genre", ico: "⚖️", des: "CP" },
  { id: "affixes", nom: "Préfixes et suffixes", ico: "🧩", des: "CE2" },
  { id: "synonymes", nom: "Synonymes et contraires", ico: "↔️", des: "CP" },
];
// Modes de chaque jeu, selon le niveau.
const modesDe = (jeu, niv) => {
  if (jeu === "familles") return [["ranger", "Ranger par famille"], ["intrus", "Trouver l'intrus"]];
  if (jeu === "sons") return SONS.filter((s) => dans(niv, s.niv)).map((s) => [s.id, s.id === "muettes" ? "Lettres muettes" : s.son.replace(/ comme dans « (.+) »$/, " $1")]);
  if (jeu === "genre") return rang(niv) >= 1 ? [["unune", "Un ou une ?"], ["feminin", "Masculin → féminin"]] : [["unune", "Un ou une ?"]];
  if (jeu === "affixes") return [["construire", "Construire des mots"], ...SENS_AFFIXES.filter((s) => dans(niv, s.niv)).map((s, i) => ["sens" + SENS_AFFIXES.indexOf(s), s.nom])];
  if (jeu === "synonymes") return rang(niv) >= 2 ? [["contraires", "Contraires"], ["synonymes", "Synonymes"]] : [["contraires", "Contraires"]];
  return [];
};
const PALETTE = ["#cfe8ff", "#ffe3a3", "#d6f2dc", "#ffd6e2", "#e4dcff", "#ffe0c7"];

// Fabrique une série. Renvoie un plateau { kind, consigne, … }.
function fabriquer(jeu, mode, niv) {
  const petit = niv === "CP";
  if (jeu === "familles" && mode === "ranger") {
    const fams = melange(FAMILLES.filter((f) => dans(niv, f.niv) && f.mots.length >= 2)).slice(0, petit ? 2 : 3);
    const n = petit ? 3 : 4;
    const cols = fams.map((f) => ({ titre: f.tete, sous: "la famille de", aide: `Famille de « ${f.tete} » : ${f.mots.join(", ")}. Tous ces mots parlent de ${f.sens}.` }));
    const items = fams.flatMap((f, ci) => melange(f.mots).slice(0, n).map((m) => ({ txt: m, ci })));
    return { kind: "tri", consigne: "Range chaque mot dans sa famille.", cols, items, regle: "Les mots d'une même famille ont une partie commune (le radical) et un sens proche." };
  }
  if (jeu === "familles") {
    const fams = melange(FAMILLES.filter((f) => dans(niv, f.niv) && f.intrus)).slice(0, 6);
    const qs = fams.map((f) => {
      const mots = melange([...melange(f.mots).slice(0, 3), f.intrus]);
      return { mots, bon: f.intrus, expl: `« ${f.intrus} » ressemble à « ${f.tete} », mais n'a rien à voir avec ${f.sens}${f.pourquoi ? ` : ${f.pourquoi}` : ""}. Les autres mots sont de la famille de « ${f.tete} ».` };
    });
    return { kind: "intrus", consigne: "Touche le mot qui n'est pas de la même famille que les autres.", qs };
  }
  if (jeu === "sons") {
    const g = SONS.find((s) => s.id === mode && dans(niv, s.niv)) || SONS.find((s) => dans(niv, s.niv));
    const n = g.cols.length >= 5 ? 3 : g.cols.length === 2 ? 5 : 4;
    const cols = g.cols.map((c) => ({ titre: c.g, sous: c.titre !== c.g ? c.titre.slice(c.g.length).trim() : "", aide: `« ${c.g} » : ${c.mots.map((m) => lireMot(m).txt).join(", ")}` }));
    const items = g.cols.flatMap((c, ci) => melange(c.mots).slice(0, n).map((m) => ({ ...lireMot(m), ci })));
    const muettes = g.id === "muettes";
    return { kind: "tri", consigne: muettes ? "Quelle lettre muette termine chaque mot ? Pense au féminin ou à un mot de la même famille, puis range-le." : `${g.son} : range chaque mot selon l'écriture du son.`, cols, items, regle: g.aide, titre: g.son };
  }
  if (jeu === "genre" && mode === "feminin") {
    const p = FEMININS.find((x) => dans(niv, x.niv)) || FEMININS[0];
    const lignes = melange(p.paires).slice(0, 6).map(([m, f]) => ({ avant: `un ${m}`, sep: "→", pre: "une", rep: f, note: `un ${m} → une ${f}` }));
    return { kind: "cases", consigne: "Écris le nom au féminin : place la bonne étiquette.", lignes, extra: [] };
  }
  if (jeu === "genre") {
    const g = GENRES.find((x) => dans(niv, x.niv));
    const n = petit ? 4 : 6;
    const art = (m, f) => (f ? "une " : "un ") + m;
    const items = [...melange(g.m).slice(0, n).map((m) => ({ ...lireMot(m), ci: 0 })), ...melange(g.f).slice(0, n).map((m) => ({ ...lireMot(m), ci: 1 }))];
    items.forEach((it) => { it.note = art(it.txt, it.ci === 1); });
    return { kind: "tri", consigne: rang(niv) >= 2 ? "Masculin ou féminin ? Attention aux pièges ! Dis « un » ou « une » devant le nom." : "Dit-on « un » ou « une » ? Range chaque nom.", cols: [{ titre: "un", sous: "masculin", aide: "" }, { titre: "une", sous: "féminin", aide: "" }], items, regle: "Pour trouver le genre d'un nom, on le dit avec « un » ou « une »." };
  }
  if (jeu === "affixes" && mode === "construire") {
    const pool = CONSTRUIRE[rang(niv) >= 4 ? "CM2" : rang(niv) >= 3 ? "CM1" : "CE2"];
    const sel = melange(pool).slice(0, 6);
    const lignes = sel.map((x) => ({ sens: x.sens, type: x.type, rac: x.rac, base: x.base, rep: x.aff, note: x.type === "pre" ? `${x.aff} + ${x.rac} = ${x.mot} : ${x.sens}` : `${x.rac} + ${x.aff} = ${x.mot} : ${x.sens}` }));
    const affs = [...new Set(pool.map((x) => x.aff))].filter((a) => !sel.some((x) => x.aff === a));
    const typeAff = Object.fromEntries(pool.map((x) => [x.aff, x.type]));
    return { kind: "cases", consigne: "Lis le sens, puis place le préfixe ou le suffixe qui forme le bon mot.", lignes, extra: melange(affs).slice(0, 2), affixes: true, typeAff };
  }
  if (jeu === "affixes") {
    const s = SENS_AFFIXES[+mode.slice(4)] || SENS_AFFIXES.find((x) => dans(niv, x.niv));
    const cols = s.cols.map((c) => ({ titre: c.titre, sous: c.aide, aide: `${c.aide} = ${c.titre} : ${c.mots.join(", ")}` }));
    const items = s.cols.flatMap((c, ci) => melange(c.mots).slice(0, 4).map((m) => ({ txt: m, ci })));
    return { kind: "tri", consigne: "Range chaque mot selon le sens de son préfixe ou de son suffixe.", cols, items, regle: "" };
  }
  if (jeu === "synonymes") {
    const syn = mode === "synonymes";
    const p = (syn ? SYNONYMES : CONTRAIRES).find((x) => dans(niv, x.niv)) || (syn ? SYNONYMES : CONTRAIRES)[0];
    const lignes = melange(p.paires).slice(0, petit ? 5 : 6).map(([a, b]) => ({ avant: a, sep: syn ? "=" : "≠", pre: "", rep: b, note: `${a} ${syn ? "a le même sens que" : "est le contraire de"} ${b}` }));
    return { kind: "cases", consigne: syn ? "Trouve le synonyme : un mot qui a presque le même sens." : "Trouve le contraire de chaque mot.", lignes, extra: [] };
  }
  return null;
}

function vocabulaire(el) {
  let niv = niveauJeux(), jeu = "familles", mode = "ranger", B = null, reussies = 0;
  // État du plateau : place (étiquette -> colonne ou case), sel, verif, sol ; intrus : i, rep, score, fini.
  let place = {}, sel = null, verif = false, sol = false, compte = false;
  const jeuxDu = () => JEUX.filter((j) => rang(niv) >= rang(j.des));
  const nouvelle = () => {
    if (!jeuxDu().some((j) => j.id === jeu)) jeu = "familles";
    const ms = modesDe(jeu, niv); if (!ms.some(([id]) => id === mode)) mode = ms[0][0];
    B = fabriquer(jeu, mode, niv);
    if (B.kind === "tri") B.items = melange(B.items).map((it, k) => ({ ...it, k }));
    if (B.kind === "cases") B.banque = melange([...B.lignes.map((l) => l.rep), ...B.extra]).map((txt, k) => ({ k, txt }));
    if (B.kind === "intrus") Object.assign(B, { i: 0, rep: null, score: 0, fini: false });
    place = {}; sel = null; verif = false; sol = false; compte = false;
  };
  const toutJuste = () => B.kind === "tri" ? B.items.every((it) => place[it.k] === it.ci)
    : B.lignes.every((l, li) => place[li] != null && B.banque[place[li]].txt === l.rep);
  const nbJustes = () => B.kind === "tri" ? B.items.filter((it) => place[it.k] === it.ci).length
    : B.lignes.filter((l, li) => place[li] != null && B.banque[place[li]].txt === l.rep).length;
  const total = () => B.kind === "tri" ? B.items.length : B.lignes.length;

  const etiquette = (it, extraCls = "") => `<button class="vo-etq ${it.emo ? "a-emo" : ""} ${sel === it.k ? "on" : ""} ${extraCls}" data-k="${it.k}">${emoHTML(it.emo)}<span>${esc(it.txt)}</span></button>`;
  const plateauTri = () => {
    const libres = B.items.filter((it) => place[it.k] == null);
    return `<div class="vo-cols n${B.cols.length}">${B.cols.map((c, ci) => {
      const dedans = B.items.filter((it) => place[it.k] === ci);
      return `<div class="vo-col ${sel != null ? "attend" : ""}" data-col="${ci}" style="--c:${PALETTE[ci % PALETTE.length]}" role="button" tabindex="0" aria-label="Colonne ${esc(c.titre)}">
        <div class="vo-col-t">${c.sous && jeu === "familles" ? `<small>${esc(c.sous)}</small>` : ""}<b>${esc(c.titre)}</b>${c.sous && jeu !== "familles" ? `<small>${esc(c.sous)}</small>` : ""}</div>
        <div class="vo-col-in">${dedans.map((it) => etiquette(it, `pose ${verif || sol ? (it.ci === ci ? "good" : "bad") : ""}`)).join("")}</div></div>`;
    }).join("")}</div>
    <div class="vo-banque" data-banque="1">${libres.map((it) => etiquette(it)).join("") || `<span class="hint">Toutes les étiquettes sont rangées.</span>`}</div>`;
  };
  // Préfixe affiché « re- », suffixe « -eur » (« sous- » garde son trait d'union).
  const montreAff = (a) => B.typeAff[a] === "suf" ? "-" + a : a.endsWith("-") ? a : a + "-";
  const plateauCases = () => {
    const pris = new Set(Object.values(place));
    const slot = (li) => {
      const k = place[li], l = B.lignes[li];
      const etat = verif || sol ? (k != null && B.banque[k].txt === l.rep ? "good" : "bad") : "";
      return `<button class="vo-case ${k != null ? "plein" : ""} ${etat} ${sel != null && k == null ? "attend" : ""}" data-slot="${li}" aria-label="Case ${li + 1}">${k != null ? esc(B.banque[k].txt) : "&nbsp;"}</button>`;
    };
    return `<div class="vo-lignes ${B.affixes ? "affixes" : ""}">${B.lignes.map((l, li) => B.affixes
      ? `<div class="vo-ligne"><span class="vo-sens">${esc(l.sens)}</span><span class="vo-construit">${l.type === "pre" ? `${slot(li)}<span class="vo-rac">${esc(l.rac)}</span>` : `<span class="vo-rac">${esc(l.rac)}</span>${slot(li)}`}${l.base ? `<span class="vo-base">(${esc(l.base)})</span>` : ""}</span></div>`
      : `<div class="vo-ligne"><span class="vo-g">${esc(l.avant)}</span><span class="vo-sep">${esc(l.sep)}</span><span class="vo-d">${l.pre ? `<span class="vo-pre">${esc(l.pre)}</span>` : ""}${slot(li)}</span></div>`).join("")}</div>
    <div class="vo-banque" data-banque="1">${B.banque.filter((b) => !pris.has(b.k)).map((b) => `<button class="vo-etq ${B.affixes ? "affixe" : ""} ${sel === b.k ? "on" : ""}" data-k="${b.k}">${esc(B.affixes ? montreAff(b.txt) : b.txt)}</button>`).join("") || `<span class="hint">Toutes les étiquettes sont placées.</span>`}</div>`;
  };
  const correction = () => {
    if (!(verif || sol)) return "";
    const lignes = [];
    if (B.kind === "tri") {
      const fautes = B.items.filter((it) => place[it.k] !== it.ci);
      if (sol || !fautes.length) {
        B.cols.forEach((c) => { if (c.aide) lignes.push(c.aide); });
        if (jeu === "genre" || B.items.some((it) => it.note && jeu === "sons")) lignes.push(B.items.filter((it) => it.note).map((it) => jeu === "sons" ? `${it.txt} → ${it.note}` : it.note).join(" · "));
      } else fautes.forEach((it) => lignes.push(jeu === "genre" ? `On dit « ${it.note} ».` : `« ${it.txt} » va dans la colonne « ${B.cols[it.ci].titre} »${it.note ? ` (${it.txt} → ${it.note})` : ""}.`));
      if (B.regle) lignes.push("💡 " + B.regle);
    } else {
      B.lignes.forEach((l, li) => { const ok = place[li] != null && B.banque[place[li]].txt === l.rep; if (sol || !ok || toutJuste()) lignes.push(l.note); });
      if (B.affixes) lignes.push("💡 Le préfixe se place avant le radical, le suffixe après.");
    }
    return lignes.length ? `<div class="vo-aide">${lignes.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : "";
  };
  const plateauIntrus = () => {
    if (B.fini) return `<div class="vo-fin"><div class="vo-score-big">⭐ ${B.score} / ${B.qs.length}</div>
      ${B.score === B.qs.length ? `<div class="banner ok" data-fete>Tous les intrus sont trouvés ! 🎉</div>` : `<div class="banner ko">Encore un petit effort !</div>`}</div>`;
    const q = B.qs[B.i];
    return `<div class="vo-prog">${B.qs.map((_, j) => `<span class="${j < B.i ? "fait" : j === B.i ? "cour" : ""}"></span>`).join("")}</div>
      <div class="vo-intrus">${q.mots.map((m, j) => {
        const etat = B.rep == null ? "" : m === q.bon ? "good" : m === B.rep ? "bad" : "neutre";
        return `<button class="vo-int ${etat}" data-m="${esc(m)}" style="--c:${PALETTE[j % PALETTE.length]}" ${B.rep != null ? "aria-disabled=\"true\"" : ""}>${esc(m)}</button>`;
      }).join("")}</div>
      ${B.rep != null ? `<div class="banner ${B.rep === q.bon ? "ok" : "ko"}">${B.rep === q.bon ? "Bravo !" : "Ce n'est pas celui-là…"}</div><div class="vo-aide"><p>${esc(q.expl)}</p></div>` : ""}`;
  };

  const render = () => {
    const ms = modesDe(jeu, niv);
    let corps, boutons;
    if (B.kind === "intrus") {
      corps = plateauIntrus();
      boutons = B.fini ? `<button class="big-btn" id="nouv">🔀 Nouvelle série</button>` : B.rep != null ? `<button class="big-btn" id="suiv">${B.i < B.qs.length - 1 ? "Suivant ➜" : "Voir le score"}</button>` : "";
    } else {
      const juste = toutJuste();
      corps = (B.kind === "tri" ? plateauTri() : plateauCases())
        + (verif && !sol ? `<div class="banner ${juste ? "ok" : "ko"}" ${juste ? "data-fete" : ""}>${juste ? "Bravo, tout est juste ! 🎉" : `${nbJustes()} / ${total()} : regarde les étiquettes en rouge.`}</div>` : "")
        + correction();
      boutons = `<button class="pill" id="verif">✅ Vérifier</button><button class="pill" id="sol">👀 Solution</button><button class="pill" id="raz">↺ Recommencer</button><button class="pill" id="nouv">🔀 Nouvelle série</button>`;
    }
    el.innerHTML = `
      <div class="tool-top wrap">${segNiveau(niv)}${reussies ? `<span class="score vo-reussies">⭐ <b>${reussies}</b> série${reussies > 1 ? "s" : ""} réussie${reussies > 1 ? "s" : ""}</span>` : ""}</div>
      <div class="tool-top wrap"><div class="seg vo-jeux" role="group" aria-label="Jeu">${jeuxDu().map((j) => `<button data-jeu="${j.id}" class="${j.id === jeu ? "on" : ""}">${j.ico} ${esc(j.nom)}</button>`).join("")}</div></div>
      ${ms.length > 1 ? `<div class="tool-top wrap"><div class="seg vo-modes" role="group" aria-label="Activité">${ms.map(([id, nom]) => `<button data-mode="${id}" class="${id === mode ? "on" : ""}">${esc(nom)}</button>`).join("")}</div></div>` : ""}
      <div class="vo-board rc-board vo-${jeu}">
        <p class="vo-consigne">${esc(B.consigne)}</p>
        ${corps}
        <div class="pills rc-keep vo-actions">${boutons}</div>
        ${B.kind !== "intrus" ? `<p class="hint vo-astuce">Touche une étiquette puis sa place, ou fais-la glisser.</p>` : ""}
      </div>`;
  };

  // Placer / retirer
  const poserTri = (k, ci) => { if (sol) return; if (ci == null) delete place[k]; else place[k] = ci; sel = null; verif = false; };
  const poserCase = (k, li) => {
    if (sol) return;
    for (const [l, kk] of Object.entries(place)) if (kk === k) delete place[l];
    if (li == null) { sel = null; verif = false; return; }
    place[li] = k; sel = null; verif = false;
  };
  const finGlisse = glisser(el, {
    source: ".vo-etq[data-k]", cible: "[data-col],[data-slot],[data-banque]",
    deposer: (k, c) => {
      k = +k; if (!c) return render();
      if (B.kind === "tri") poserTri(k, c.dataset.col != null ? +c.dataset.col : null);
      else if (c.dataset.slot != null) poserCase(k, +c.dataset.slot);
      else if (c.dataset.banque) poserCase(k, null);
      render();
    },
  });
  el.onclick = (e) => {
    if (el._vuGlisse) { el._vuGlisse = false; return; }
    if (surNiveau(e, (n) => { niv = n; nouvelle(); render(); })) return;
    const t = e.target.closest("button, [data-col]"); if (!t || !el.contains(t)) return;
    if (t.dataset.jeu) { jeu = t.dataset.jeu; mode = ""; nouvelle(); return render(); }
    if (t.dataset.mode) { mode = t.dataset.mode; nouvelle(); return render(); }
    if (B.kind === "intrus") {
      if (t.dataset.m != null && B.rep == null) { B.rep = t.dataset.m; if (B.rep === B.qs[B.i].bon) B.score++; return render(); }
      if (t.id === "suiv") { if (B.i < B.qs.length - 1) { B.i++; B.rep = null; } else { B.fini = true; if (B.score === B.qs.length) reussies++; } return render(); }
      if (t.id === "nouv") { nouvelle(); return render(); }
      return;
    }
    if (t.dataset.k != null) {
      const k = +t.dataset.k;
      if (sol) return;
      // Étiquette déjà rangée : avec une sélection, on échange de place ; sinon elle retourne dans la banque.
      if (t.classList.contains("pose")) { if (sel != null && sel !== k) poserTri(sel, place[k]); else poserTri(k, null); return render(); }
      sel = sel === k ? null : k; return render();
    }
    if (t.dataset.col != null) { if (sel != null) poserTri(sel, +t.dataset.col); return render(); }
    if (t.dataset.slot != null) { const li = +t.dataset.slot; if (sel != null) poserCase(sel, li); else if (place[li] != null && !sol) { delete place[li]; verif = false; } return render(); }
    if (t.id === "verif") { verif = true; if (toutJuste() && !compte && !sol) { compte = true; reussies++; } }
    if (t.id === "sol") {
      sol = true; sel = null;
      if (B.kind === "tri") B.items.forEach((it) => { place[it.k] = it.ci; });
      else { place = {}; const libres = B.banque.map((b) => b.k); B.lignes.forEach((l, li) => { const j = libres.findIndex((k) => B.banque[k].txt === l.rep); if (j >= 0) place[li] = libres.splice(j, 1)[0]; }); }
    }
    if (t.id === "raz") { place = {}; sel = null; verif = false; sol = false; }
    if (t.id === "nouv") nouvelle();
    render();
  };
  nouvelle(); render();
  return () => { finGlisse(); el.onclick = null; };
}

// =====================================================================
// OUTIL 2 : MOTS FLASH
// Un mot s'affiche quelques secondes puis disparaît ; on l'écrit sur l'ardoise ou on l'épelle,
// puis on le découvre lettre par lettre. Deux modes : un mot à la fois, ou une série puis correction.
// =====================================================================
const CLE_PERSO = "bagaschool-mots-flash-perso";
const CLE_REGL = "bagaschool-mots-flash-reglages";
let voixFr = null;
const choisirVoixFr = () => { const v = speechSynthesis.getVoices(); voixFr = v.find((x) => x.lang === "fr-FR") || v.find((x) => /^fr/i.test(x.lang)) || null; };
if (typeof speechSynthesis !== "undefined") { choisirVoixFr(); speechSynthesis.addEventListener?.("voiceschanged", choisirVoixFr); }
const direFr = (txt) => {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt); u.lang = "fr-FR"; if (voixFr) u.voice = voixFr; u.rate = 0.85;
  speechSynthesis.speak(u);
};
const lettresHTML = (m, delai0 = 0) => Array.from(m).map((c, i) => c === " " ? `<span class="mf-esp"> </span>` : `<span class="mf-l" style="--d:${delai0 + i * 0.28}s">${esc(c)}</span>`).join("");

function motsFlash(el) {
  let perso = ""; try { perso = localStorage.getItem(CLE_PERSO) || ""; } catch { perso = ""; }
  let r = {}; try { r = JSON.parse(localStorage.getItem(CLE_REGL)) || {}; } catch { r = {}; }
  let niv = niveauJeux(), duree = [1, 2, 3, 5].includes(r.duree) ? r.duree : 2, modeSerie = !!r.serie, nSerie = [5, 8, 10].includes(r.n) ? r.n : 5;
  let son = !!r.son, revisions = !!r.revisions, source = r.source === "perso" ? "perso" : "niveau", edition = false;
  // etat : pret · attention · flash · cache · revele · correction
  let etat = "pret", ordre = [], pos = 0, mot = "", serie = [], timer = null, vus = 0;
  const garderRegl = () => localStorage.setItem(CLE_REGL, JSON.stringify({ duree, serie: modeSerie, n: nSerie, son, revisions, source }));
  const motsPerso = () => [...new Set(perso.split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean))];
  const motsDispo = () => {
    if (source === "perso") return motsPerso();
    const r0 = rang(niv); let l = [...MOTS_FLASH[niv]];
    if (revisions) Object.keys(MOTS_FLASH).filter((n) => rang(n) < r0).forEach((n) => { l = l.concat(MOTS_FLASH[n]); });
    return [...new Set(l)];
  };
  const stop = () => { clearTimeout(timer); timer = null; };
  const reinit = () => { stop(); etat = "pret"; ordre = melange(motsDispo()); pos = 0; serie = []; vus = 0; };
  const tirer = () => { if (!ordre.length) return ""; if (pos >= ordre.length) { ordre = melange(motsDispo()); pos = 0; } return ordre[pos++]; };
  // Montre le mot : petit « attention » (0,7 s), puis le mot pendant la durée choisie, puis on le cache.
  const montrer = (nouveau = true) => {
    stop();
    if (nouveau) { mot = tirer(); if (!mot) return; vus++; if (modeSerie) serie.push(mot); }
    etat = "attention"; render();
    timer = setTimeout(() => {
      etat = "flash"; render(); if (son) direFr(mot);
      timer = setTimeout(() => { etat = "cache"; render(); }, duree * 1000);
    }, moinsAnim() ? 300 : 700);
  };
  const reveler = () => { stop(); etat = "revele"; render(); if (son) direFr(mot); };
  const corriger = () => { stop(); etat = "correction"; render(); };
  const action = () => { // action principale (barre d'espace / bouton vert)
    if (etat === "pret") return montrer();
    if (etat === "cache") return modeSerie ? (serie.length >= nSerie ? corriger() : montrer()) : reveler();
    if (etat === "revele") return montrer();
    if (etat === "correction") { reinit(); return montrer(); }
  };

  const carte = () => {
    const sansAnim = moinsAnim() ? "sans-anim" : "";
    if (!motsDispo().length) return `<div class="mf-carte vide"><p class="mf-msg">${source === "perso" ? "Ta liste est vide : touche « ✏️ Ma liste » pour écrire tes mots." : "Aucun mot pour ce niveau."}</p></div>`;
    const num = modeSerie ? `Mot ${Math.max(serie.length, 1)} / ${nSerie}` : vus ? `Mot ${vus}` : "";
    if (etat === "pret") return `<div class="mf-carte pret"><p class="mf-msg">${modeSerie ? `Une série de ${nSerie} mots. Chaque mot reste ${duree} s.` : `Le mot reste ${duree} seconde${duree > 1 ? "s" : ""} au tableau.`}<br>Regarde bien, puis écris-le sur ton ardoise !</p></div>`;
    if (etat === "attention") return `<div class="mf-carte attention ${sansAnim}"><span class="mf-num">${num}</span><span class="mf-oeil">👀</span><span class="mf-pret">Attention…</span></div>`;
    if (etat === "flash") return `<div class="mf-carte flash-on ${sansAnim}" style="--duree:${duree}s"><span class="mf-num">${num}</span><span class="mf-mot" data-mot="1">${esc(mot)}</span><span class="mf-barre"><i></i></span></div>`;
    if (etat === "cache") return `<div class="mf-carte cache"><span class="mf-num">${num}</span><span class="mf-crayon">✏️</span><span class="mf-msg">Écris le mot sur ton ardoise…<br><small>ou épelle-le à voix haute.</small></span></div>`;
    if (etat === "revele") return `<div class="mf-carte revele ${sansAnim}"><span class="mf-num">${num}</span><span class="mf-mot mf-lettres">${lettresHTML(mot)}</span></div>`;
    return `<div class="mf-carte correction ${sansAnim}"><p class="mf-msg">Corrige ton ardoise :</p><ol class="mf-serie">${serie.map((m, i) => `<li><span class="mf-n">${i + 1}</span><span class="mf-lettres">${lettresHTML(m, i * 0.6)}</span></li>`).join("")}</ol></div>`;
  };
  const boutons = () => {
    if (!motsDispo().length) return "";
    if (etat === "pret") return `<button class="big-btn mf-go" id="go">▶ Montrer ${modeSerie ? "le premier mot" : "le mot"}</button>`;
    if (etat === "attention" || etat === "flash") return `<button class="pill" id="stop">⏸ Arrêter</button>`;
    if (etat === "cache") return modeSerie
      ? `${serie.length >= nSerie ? `<button class="big-btn mf-go" id="corr">✅ Correction</button>` : `<button class="big-btn mf-go" id="go">Mot suivant ▶</button>`}<button class="pill" id="revoir">🔁 Revoir</button>`
      : `<button class="big-btn mf-go" id="voir">👀 Voir le mot</button><button class="pill" id="revoir">🔁 Revoir</button>${son ? `<button class="pill" id="dire">🔊 Écouter</button>` : ""}`;
    if (etat === "revele") return `<button class="big-btn mf-go" id="go">Mot suivant ▶</button>${son ? `<button class="pill" id="dire">🔊 Écouter</button>` : ""}`;
    return `<button class="big-btn mf-go" id="go">🔀 Nouvelle série</button>`;
  };
  // Le plateau seul est redessiné pendant le jeu : les réglages restent stables.
  const renderPlateau = () => { const p = el.querySelector("#mfPlateau"); if (!p) return render(true); p.innerHTML = `${carte()}<div class="pills rc-keep mf-actions">${boutons()}</div>`; };
  const render = (tout = false) => {
    if (!tout && el.querySelector("#mfPlateau")) return renderPlateau();
    const nb = motsDispo().length;
    el.innerHTML = `
      <div class="tool-top wrap">${segNiveau(niv)}
        <div class="seg" role="group" aria-label="Liste"><button data-src="niveau" class="${source === "niveau" ? "on" : ""}">Mots du ${niv}</button><button data-src="perso" class="${source === "perso" ? "on" : ""}">Ma liste (${motsPerso().length})</button></div>
        ${source === "niveau" && rang(niv) > 0 ? `<button class="pill ${revisions ? "on" : ""}" id="rev">${revisions ? "✓ " : "+ "}Mots des niveaux d'avant</button>` : ""}
        <button class="pill ${edition ? "on" : ""}" id="edit">✏️ Écrire ma liste</button>
      </div>
      <div class="tool-top wrap">
        <span class="mf-lab">Durée</span><div class="seg" role="group" aria-label="Durée">${[1, 2, 3, 5].map((d) => `<button data-duree="${d}" class="${d === duree ? "on" : ""}">${d} s</button>`).join("")}</div>
        <div class="seg" role="group" aria-label="Mode"><button data-serie="0" class="${!modeSerie ? "on" : ""}">Un mot à la fois</button><button data-serie="1" class="${modeSerie ? "on" : ""}">Une série</button></div>
        ${modeSerie ? `<div class="seg" role="group" aria-label="Nombre de mots">${[5, 8, 10].map((n) => `<button data-n="${n}" class="${n === nSerie ? "on" : ""}">${n} mots</button>`).join("")}</div>` : ""}
        <button class="pill ${son ? "on" : ""}" id="son" aria-pressed="${son}">${son ? "🔊 Voix activée" : "🔇 Voix coupée"}</button>
      </div>
      ${edition ? `<div class="card mf-edit"><label>Mes mots (un par ligne ou séparés par des virgules)<textarea id="mfPerso" rows="5" placeholder="cependant, autrefois, beaucoup…">${esc(perso)}</textarea></label>
        <div class="tool-top"><button class="pill" id="copier">Partir des mots du ${niv}</button><button class="pill" id="finEdit">✓ Terminé</button></div></div>` : ""}
      <div class="vo-board rc-board mf-board" id="mfPlateau">${carte()}<div class="pills rc-keep mf-actions">${boutons()}</div></div>
      <p class="hint center">${nb} mot${nb > 1 ? "s" : ""} dans la liste · barre d'espace = action suivante</p>`;
  };
  el.onclick = (e) => {
    if (surNiveau(e, (n) => { niv = n; reinit(); render(true); })) return;
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.src) { source = t.dataset.src; garderRegl(); reinit(); return render(true); }
    if (t.dataset.duree) { duree = +t.dataset.duree; garderRegl(); if (etat === "attention" || etat === "flash") { stop(); etat = mot ? "cache" : "pret"; } return render(true); }
    if (t.dataset.serie != null) { modeSerie = t.dataset.serie === "1"; garderRegl(); reinit(); return render(true); }
    if (t.dataset.n) { nSerie = +t.dataset.n; garderRegl(); reinit(); return render(true); }
    if (t.id === "son") { son = !son; garderRegl(); if (!son && typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); return render(true); }
    if (t.id === "rev") { revisions = !revisions; garderRegl(); reinit(); return render(true); }
    if (t.id === "edit") { edition = !edition; return render(true); }
    if (t.id === "finEdit") { edition = false; source = "perso"; garderRegl(); reinit(); return render(true); }
    if (t.id === "copier") { perso = MOTS_FLASH[niv].join("\n"); localStorage.setItem(CLE_PERSO, perso); return render(true); }
    if (t.id === "go") { if (etat === "correction") reinit(); return montrer(); }
    if (t.id === "voir") return reveler();
    if (t.id === "corr") return corriger();
    if (t.id === "revoir") return montrer(false);
    if (t.id === "stop") { stop(); etat = mot ? "cache" : "pret"; return render(); }
    if (t.id === "dire") return direFr(mot);
  };
  el.oninput = (e) => { if (e.target.id === "mfPerso") { perso = e.target.value; localStorage.setItem(CLE_PERSO, perso); const b = el.querySelector('[data-src="perso"]'); if (b) b.textContent = `Ma liste (${motsPerso().length})`; } };
  const clavier = (e) => {
    if (e.target.closest?.("input, textarea, select") || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
      if (e.key === "Enter" && e.target.closest?.("button")) return; // Entrée sur un bouton : son propre clic
      e.preventDefault(); action();
    }
  };
  document.addEventListener("keydown", clavier);
  reinit(); render(true);
  return () => { stop(); document.removeEventListener("keydown", clavier); el.onclick = null; el.oninput = null; if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); };
}

export const VOCABULAIRE = [
  { id: "vocabulaire", nom: "Vocabulaire", icone: "🌳", couleur: "#d6f2dc", desc: "Familles de mots, sons, genre, préfixes et suffixes, synonymes", mount: vocabulaire },
  { id: "mots-flash", nom: "Mots flash", icone: "⚡", couleur: "#fff0b3", desc: "Mots invariables : le mot s'affiche 2 secondes, on l'écrit", mount: motsFlash },
];
