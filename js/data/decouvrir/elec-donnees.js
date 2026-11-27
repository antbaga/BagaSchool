// Données « Sciences : l'électricité » (js/decouvrir/electricite.js). Contenu rédigé pour BagaSchool.
// Notions du primaire : cycle 2 (questionner le monde) et cycle 3 (sciences et technologie).

// Composants : nom, rôle, description du symbole normalisé. `t` = type du simulateur, `o` = options.
export const SYMBOLES = [
  { k: "pile", t: "pile", nom: "pile", role: "Elle fournit l'énergie électrique au circuit. Elle a deux bornes : la borne + et la borne −.", sym: "Un grand trait fin (la borne +) et un petit trait épais (la borne −)." },
  { k: "lampe", t: "lampe", nom: "lampe", role: "Elle brille quand le courant la traverse.", sym: "Un rond barré d'une croix." },
  { k: "inter-o", t: "inter", o: { ouvert: true }, nom: "interrupteur ouvert", role: "Le circuit est coupé : le courant ne passe pas.", sym: "Un trait levé qui ne touche pas l'autre borne." },
  { k: "inter-f", t: "inter", o: { ouvert: false }, nom: "interrupteur fermé", role: "Le circuit est fermé : le courant passe.", sym: "Un trait qui relie les deux bornes." },
  { k: "moteur", t: "moteur", nom: "moteur", role: "Il tourne quand le courant le traverse. Si on inverse les bornes de la pile, il tourne dans l'autre sens.", sym: "Un rond avec la lettre M." },
  { k: "del", t: "del", nom: "DEL", long: "DEL (diode électroluminescente)", role: "Elle s'allume seulement si le courant la traverse dans le bon sens : sa patte la plus longue (+) du côté de la borne + de la pile.", sym: "Un triangle et un trait, avec deux petites flèches pour la lumière." },
  { k: "buzzer", t: "buzzer", nom: "buzzer", role: "Il fait du bruit quand le courant le traverse.", sym: "Un demi-cercle posé sur le fil." },
  { k: "fil", t: "fil", nom: "fil de connexion", role: "Il relie les composants entre eux et laisse passer le courant.", sym: "Un trait." },
];

// Objets à tester. c : 1 conducteur, 0 isolant, 0.3 conducteur faible. n : niveau minimal (0 CE1, 1 CE2, 2 CM1).
// ico : emoji, ou svg : dessin maison (voir ICONES).
export const OBJETS = [
  { id: "cle", nom: "clé en métal", ico: "🔑", c: 1, n: 0, mat: "métal" },
  { id: "piece", nom: "pièce de monnaie", ico: "🪙", c: 1, n: 0, mat: "métal" },
  { id: "trombone", nom: "trombone en métal", ico: "📎", c: 1, n: 0, mat: "métal" },
  { id: "cuillere", nom: "cuillère en métal", ico: "🥄", c: 1, n: 0, mat: "métal" },
  { id: "gomme", nom: "gomme", svg: "gomme", c: 0, n: 0, mat: "caoutchouc ou plastique" },
  { id: "regle", nom: "règle en plastique", ico: "📏", c: 0, n: 0, mat: "plastique" },
  { id: "bois", nom: "morceau de bois", ico: "🪵", c: 0, n: 0, mat: "bois" },
  { id: "papier", nom: "feuille de papier", ico: "📄", c: 0, n: 0, mat: "papier" },
  { id: "alu", nom: "papier d'aluminium", svg: "alu", c: 1, n: 1, mat: "métal (aluminium)" },
  { id: "vis", nom: "vis et écrou en métal", ico: "🔩", c: 1, n: 1, mat: "métal" },
  { id: "verre", nom: "verre (à boire)", svg: "verre", c: 0, n: 1, mat: "verre" },
  { id: "bouchon", nom: "bouchon en liège", svg: "bouchon", c: 0, n: 1, mat: "liège" },
  { id: "elastique", nom: "élastique", svg: "elastique", c: 0, n: 1, mat: "caoutchouc" },
  { id: "laine", nom: "chaussette en laine", ico: "🧦", c: 0, n: 1, mat: "tissu (laine)" },
  { id: "carton", nom: "carton", ico: "📦", c: 0, n: 1, mat: "carton" },
  { id: "cuivre", nom: "fil de cuivre dénudé", svg: "cuivre", c: 1, n: 2, mat: "métal (cuivre)" },
  { id: "gobelet", nom: "gobelet en plastique", svg: "gobelet", c: 0, n: 2, mat: "plastique" },
  { id: "mine", nom: "mine de crayon à papier", ico: "✏️", c: 0.3, n: 2, mat: "graphite", note: "La mine du crayon est en graphite : elle conduit le courant, mais mal. La lampe brille à peine. Le bois du crayon, lui, est isolant." },
  { id: "eausalee", nom: "eau salée", svg: "eausalee", c: 0.3, n: 2, mat: "eau + sel", note: "L'eau salée conduit le courant, mais mal : la lampe brille à peine. Avec une DEL à la place de la lampe, on le voit mieux." },
];

// Petits dessins (viewBox 0 0 64 64) pour les objets sans emoji fiable.
export const ICONES = {
  gomme: `<g transform="rotate(-18 32 32)"><rect x="8" y="21" width="48" height="22" rx="5" fill="#ff9fb4" stroke="#d96b86" stroke-width="2"/><rect x="34" y="21" width="22" height="22" rx="5" fill="#5b8ff0" stroke="#3a6cc8" stroke-width="2"/></g>`,
  alu: `<path d="M10,22 L22,10 L36,16 L50,8 L56,26 L50,40 L58,52 L38,56 L24,50 L8,54 L14,38 Z" fill="#d7dde5" stroke="#8d97a5" stroke-width="2" stroke-linejoin="round"/><path d="M22,10 L28,30 L14,38 M36,16 L32,34 L50,40 M28,30 L32,34 L24,50 M32,34 L38,56" stroke="#a9b3c0" stroke-width="1.6" fill="none"/><path d="M40,18 L46,22" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  verre: `<path d="M16,10 L48,10 L44,54 Q43,58 39,58 L25,58 Q21,58 20,54 Z" fill="#e6f4ff" stroke="#7fb3d9" stroke-width="2.5" stroke-linejoin="round"/><path d="M22,16 L24,50" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
  bouchon: `<path d="M18,14 L46,14 L42,54 L22,54 Z" fill="#d9a066" stroke="#a8743f" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="32" cy="14" rx="14" ry="4" fill="#e8b984" stroke="#a8743f" stroke-width="2"/><g fill="#a8743f"><circle cx="26" cy="26" r="1.6"/><circle cx="36" cy="32" r="1.8"/><circle cx="29" cy="42" r="1.5"/><circle cx="38" cy="46" r="1.4"/><circle cx="34" cy="22" r="1.2"/></g>`,
  elastique: `<ellipse cx="32" cy="34" rx="22" ry="14" fill="none" stroke="#e08a3c" stroke-width="5" transform="rotate(-12 32 34)"/>`,
  cuivre: `<path d="M6,46 C14,46 14,22 22,22 C30,22 28,46 36,46 C44,46 42,22 50,22 C56,22 58,30 58,30" fill="none" stroke="#c96a2b" stroke-width="5" stroke-linecap="round"/><path d="M6,46 C14,46 14,22 22,22" fill="none" stroke="#f0a36b" stroke-width="1.6" stroke-linecap="round"/>`,
  gobelet: `<path d="M14,12 L50,12 L44,56 L20,56 Z" fill="#9fd8c9" stroke="#4fa68f" stroke-width="2.5" stroke-linejoin="round"/><path d="M12,12 L52,12" stroke="#4fa68f" stroke-width="4" stroke-linecap="round"/><path d="M20,22 L44,22" stroke="#e6f7f2" stroke-width="3"/>`,
  eausalee: `<path d="M14,14 L50,14 L46,56 Q45,59 41,59 L23,59 Q19,59 18,56 Z" fill="#eef7ff" stroke="#7fb3d9" stroke-width="2.5" stroke-linejoin="round"/><path d="M16.5,30 L47.5,30 L46,56 Q45,59 41,59 L23,59 Q19,59 18,56 Z" fill="#7cc0f0"/><g fill="#fff"><rect x="24" y="38" width="3" height="3"/><rect x="34" y="44" width="3" height="3"/><rect x="29" y="50" width="3" height="3"/><rect x="38" y="36" width="3" height="3"/></g><text x="32" y="10" font-size="10" text-anchor="middle" font-weight="900" fill="#4b6a85">+ sel</text>`,
};

// Les dangers de l'électricité (carte « Danger »).
export const DANGERS = [
  ["🔌", "On ne joue jamais avec les prises de courant ni avec les appareils branchés : le courant du secteur (230 volts) peut tuer. Les expériences se font uniquement avec des piles."],
  ["👄", "On ne met jamais une pile à la bouche et on ne l'avale pas. Si un enfant avale une pile (surtout une pile bouton), on prévient tout de suite un adulte : c'est une urgence."],
  ["⚡", "On ne court-circuite jamais une pile (ses deux bornes reliées par un fil, sans rien entre les deux) : elle chauffe très fort, s'abîme et peut brûler."],
  ["💧", "On ne touche pas un appareil électrique avec les mains mouillées, et on ne l'approche pas de l'eau : l'eau et l'électricité, c'est dangereux."],
  ["🪁", "On ne s'approche pas des lignes électriques, des transformateurs et des pylônes, même pour récupérer un cerf-volant ou un ballon."],
  ["♻️", "Les piles usagées ne vont pas à la poubelle : on les rapporte dans un bac de collecte (magasins, déchetterie)."],
];
