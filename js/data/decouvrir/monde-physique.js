// Repères du monde physique et humain (coordonnées [longitude, latitude], en degrés).
// Tracés volontairement simplifiés (schéma de carte d'école) : formes approximatives, positions justes.
// Les tracés des fleuves viennent de Natural Earth (monde-carte.js) ; ici seulement leur fiche.

// Continents et océans : point d'étiquette + fiche.
export const CONT_FICHE = {
  af: [[20, 8], "Le deuxième plus grand continent. L'équateur le traverse en son milieu."],
  eu: [[38, 56], "Un petit continent, rattaché à l'Asie. La France se trouve en Europe."],
  as: [[95, 47], "Le plus grand continent, et le plus peuplé."],
  am: [[-95, 38], "Un très long continent, des régions froides du Nord jusqu'au Sud. On le partage souvent en deux : l'Amérique du Nord et l'Amérique du Sud."],
  na: [[-102, 46], "Elle va des terres glacées du Nord jusqu'à l'Amérique centrale."],
  sa: [[-60, -12], "Elle est traversée par l'équateur. On y trouve la forêt amazonienne."],
  oc: [[134, -25], "L'Australie et des milliers d'îles de l'océan Pacifique."],
  an: [[10, -77], "Le continent du pôle Sud, couvert de glace. Personne n'y vit toute l'année : on y trouve des bases scientifiques."],
};
export const OCEANS = {
  pacifique: ["océan Pacifique", [-140, 6], "Le plus grand océan : il couvre presque un tiers de la Terre.",
    [[-150, 0], [-130, -30], [-160, 30], [-140, 45], [170, 10], [160, -20], [180, -40], [-100, -10], [-120, 15], [140, 25], [150, 5], [-85, -30], [-170, 55], [-110, -45], [150, -40]]],
  atlantique: ["océan Atlantique", [-40, 27], "Le deuxième plus grand océan, entre l'Amérique, l'Europe et l'Afrique. Il borde la France.",
    [[-40, 30], [-30, 0], [-20, -30], [-50, 45], [-30, 55], [-10, -45], [-65, 20], [-90, 25], [0, 2], [-50, -45], [3, 57], [-10, 45], [-25, 65]]],
  indien: ["océan Indien", [78, -20], "Le troisième océan, entre l'Afrique, l'Asie et l'Océanie.",
    [[75, -15], [65, 10], [90, -30], [55, -35], [108, -25], [88, 12], [40, -25], [60, 20], [120, -45], [80, -45]]],
  arctique: ["océan Arctique", [-150, 79], "Le plus petit océan, autour du pôle Nord. Une grande partie est gelée (la banquise).",
    [[0, 86], [-150, 78], [100, 81], [160, 76], [40, 75], [-60, 84], [130, 78], [-110, 77]]],
  austral: ["océan Austral", [40, -60], "L'océan qui entoure l'Antarctique.",
    [[0, -62], [90, -62], [-90, -67], [180, -68], [-150, -70], [60, -60], [130, -63], [-40, -62]]],
  mediterranee: ["mer Méditerranée", [19, 33.6], "Une mer presque fermée entre l'Europe, l'Afrique et l'Asie. Elle borde la France.",
    [[18, 34.5], [5, 39], [28, 34], [33, 34], [15, 38], [25, 37], [-2, 36.5], [12, 40], [20, 38], [4, 42], [16, 43]]],
};
// Zones de mer à ne pas confondre (mer Noire, Caspienne, baie d'Hudson…) : rien n'y est accepté.
export const MERS_NEUTRES = [[35, 43.5], [50, 42], [-85, 60], [20, 58], [52, 27], [38, 20], [120, 38], [135, 40]];

// Limite conventionnelle Europe / Asie (Oural, fleuve Oural, mer Caspienne, Caucase, Bosphore) :
// polygone qui entoure l'Europe, pour colorier les deux continents.
export const EUROPE_CLIP = [[-32, 36], [-32, 62], [-26, 63], [-26, 67.2], [-20, 70], [-8, 73], [-8, 86], [72, 86], [71, 77], [66.5, 70.5], [66, 69], [65.5, 68],
  [63, 66], [60, 64], [59.3, 62], [59.3, 59], [59.6, 56.5], [59.3, 54.5], [58.6, 51.2], [55.1, 51.8], [51.4, 51.2], [51.6, 49], [51.9, 47.1], [49.8, 41],
  [48, 41.5], [46.5, 42], [45, 42.6], [44, 42.8], [42.5, 43.2], [41, 43.4], [40, 43.6], [38.5, 44.3], [37, 45], [33, 43], [29.1, 41.15], [26.3, 40.05],
  [26.2, 39.6], [25.6, 38.8], [26.6, 37.6], [27.3, 36.7], [28.6, 35.8], [28, 34.5], [25, 34.3], [14.5, 35.5], [12, 37.25], [9.8, 38.3], [8, 38.4],
  [0, 37], [-2.5, 36.2], [-5.6, 35.95], [-6.5, 35.9], [-9, 35.5], [-14, 35]];
export const LIMITE_EU_AS = [
  [[66, 69], [65.5, 68], [63, 66], [60, 64], [59.3, 62], [59.3, 59], [59.6, 56.5], [59.3, 54.5], [58.6, 51.2], [55.1, 51.8], [51.4, 51.2], [51.6, 49], [51.9, 47.1]],
  [[49.8, 41], [48, 41.5], [46.5, 42], [45, 42.6], [44, 42.8], [42.5, 43.2], [41, 43.4], [40, 43.6], [38.5, 44.3], [37, 45]],
];

// Lignes imaginaires. [nom, latitude ou null, longitude ou null, point d'étiquette, fiche]
export const LIGNES = {
  equateur: ["Équateur", 0, null, [-25, 0], "Latitude 0°. Il partage la Terre en deux moitiés : l'hémisphère Nord et l'hémisphère Sud."],
  cancer: ["Tropique du Cancer", 23.44, null, [-140, 23.44], "Vers 23° de latitude nord. Entre les deux tropiques se trouve la zone tropicale (zone chaude)."],
  capricorne: ["Tropique du Capricorne", -23.44, null, [-100, -23.44], "Vers 23° de latitude sud. Entre les deux tropiques se trouve la zone tropicale (zone chaude)."],
  arctique: ["Cercle polaire arctique", 66.56, null, [-3, 66.56], "Vers 66° de latitude nord. Au-delà, c'est la zone froide (polaire) : il y a au moins un jour par an où le Soleil ne se couche pas."],
  antarctique: ["Cercle polaire antarctique", -66.56, null, [-160, -66.56], "Vers 66° de latitude sud. Au-delà, c'est la zone froide (polaire) autour du pôle Sud."],
  greenwich: ["Méridien de Greenwich", null, 0, [0, -45], "Longitude 0°, le méridien d'origine. Il passe à Greenwich, près de Londres, et traverse la France."],
};

// Fleuves : [nom, point d'étiquette, fiche, niveau d'apparition]
export const FLEUVES = {
  amazone: ["Amazone", [-60, -3], "Le fleuve qui transporte le plus d'eau au monde. Il traverse la forêt amazonienne (Amérique du Sud) et se jette dans l'océan Atlantique.", "CE1"],
  mississippi: ["Mississippi", [-90.5, 35], "Le grand fleuve des États-Unis (Amérique du Nord). Il se jette dans le golfe du Mexique.", "CE1"],
  nil: ["Nil", [32, 22], "Un des deux plus longs fleuves du monde, avec l'Amazone. Il traverse l'Égypte (Afrique) et se jette dans la mer Méditerranée.", "CE1"],
  congo: ["Congo", [18.3, 0.5], "Il traverse la grande forêt du bassin du Congo (Afrique) et se jette dans l'océan Atlantique.", "CE2"],
  yangtse: ["Yangtsé", [112, 30.3], "Le plus long fleuve d'Asie. Il traverse la Chine et se jette dans la mer de Chine orientale.", "CE2"],
  danube: ["Danube", [20.5, 44.8], "Un grand fleuve d'Europe. Il passe par Vienne, Bratislava, Budapest et Belgrade, puis se jette dans la mer Noire.", "CE2"],
  niger: ["Niger", [-2, 16.6], "Un grand fleuve d'Afrique de l'Ouest. Il traverse le Mali, le Niger et le Nigeria, puis se jette dans le golfe de Guinée (océan Atlantique).", "CM1"],
  gange: ["Gange", [85, 25.5], "Le grand fleuve du nord de l'Inde (Asie). Il se jette dans le golfe du Bengale.", "CM1"],
  volga: ["Volga", [45, 49], "Le plus long fleuve d'Europe. Il coule en Russie et se jette dans la mer Caspienne.", "CM1"],
  mekong: ["Mékong", [105.8, 15.1], "Un grand fleuve d'Asie du Sud-Est. Il traverse six pays, dont le Laos, le Cambodge et le Viêt Nam.", "CM1"],
  saintlaurent: ["Saint-Laurent", [-71.2, 46.9], "Il relie les Grands Lacs à l'océan Atlantique et passe à Montréal et à Québec (Canada).", "CM2"],
  huanghe: ["Huang He (fleuve Jaune)", [110.5, 37], "Le deuxième plus long fleuve de Chine. Il doit son nom à la couleur de ses eaux, chargées de limon.", "CM2"],
  orenoque: ["Orénoque", [-64, 8], "Un grand fleuve d'Amérique du Sud, au Venezuela. Il se jette dans l'océan Atlantique.", "CM2"],
};
// Massifs : [nom, ligne de crête simplifiée, fiche, niveau]
export const MASSIFS = {
  andes: ["Andes", [[-72, 10], [-75, 5.5], [-77.5, 1], [-78.7, -2.5], [-78.5, -7], [-76, -11], [-72.5, -15], [-69.3, -18], [-68.3, -23], [-68.8, -28], [-70, -33], [-71, -38], [-71.6, -42], [-72.8, -47], [-73.3, -51]],
    "La plus longue chaîne de montagnes à l'air libre du monde, tout le long de l'ouest de l'Amérique du Sud.", "CE1"],
  rocheuses: ["Rocheuses", [[-128, 59], [-123, 54.5], [-117, 50], [-113, 46], [-109.5, 42], [-106.5, 38.5], [-105.8, 35]],
    "Une longue chaîne de montagnes dans l'ouest de l'Amérique du Nord (Canada et États-Unis).", "CE1"],
  alpes: ["Alpes", [[5.6, 44.2], [6.9, 45.5], [8.5, 46.3], [10.5, 46.6], [12.5, 47], [15, 47.4]],
    "La plus haute chaîne de montagnes d'Europe de l'Ouest. Son plus haut sommet est le mont Blanc, à la frontière entre la France et l'Italie.", "CE1"],
  atlas: ["Atlas", [[-9.3, 30.6], [-6.5, 31.8], [-3.5, 33.3], [0, 34.3], [3, 35.3], [6, 35.6], [9, 35.8]],
    "Les montagnes du nord-ouest de l'Afrique : au Maroc, en Algérie et en Tunisie.", "CE1"],
  himalaya: ["Himalaya", [[73.5, 35.3], [76, 33.7], [79, 31], [82, 29.6], [85, 28.1], [88, 27.8], [91, 28], [94, 28.8], [95.5, 29.3]],
    "La plus haute chaîne de montagnes du monde, en Asie. On y trouve l'Everest, le plus haut sommet de la Terre (plus de 8 800 m).", "CE1"],
};
// Déserts et forêts : [nom, polygones, fiche, niveau, type]
export const MILIEUX = {
  sahara: ["désert du Sahara", [[[-16.5, 16.5], [-17, 21], [-14, 26], [-10, 28.5], [-5, 30], [0, 31], [8, 31.5], [12, 31], [20, 30.5], [25, 30.5], [30, 30], [32.5, 28], [35, 24], [37, 20], [36, 17], [32, 16], [25, 15.5], [15, 15.5], [5, 16], [-5, 16]]],
    "Le plus grand désert chaud du monde, dans le nord de l'Afrique.", "CE1", "desert"],
  antarctique: ["Antarctique", null, "Un désert froid : il y tombe très peu de neige chaque année, et il est presque entièrement couvert de glace.", "CE1", "desert"],
  gobi: ["désert de Gobi", [[[95, 45], [100, 46], [106, 45.5], [112, 45], [114.5, 43], [110, 41.5], [105, 41], [100, 40.5], [95, 41.5], [93, 43]]],
    "Un désert d'Asie, entre la Mongolie et la Chine. Les hivers y sont très froids.", "CE2", "desert"],
  atacama: ["désert d'Atacama", [[[-70.5, -18], [-69, -18.3], [-68.3, -22], [-68.8, -26], [-70, -28], [-71, -25], [-70.5, -22]]],
    "Un désert d'Amérique du Sud, au Chili, entre l'océan Pacifique et les Andes. C'est un des endroits les plus secs du monde.", "CE2", "desert"],
  kalahari: ["désert du Kalahari", [[[19, -20], [24, -18.5], [27, -20], [26.5, -24], [24, -27], [20, -28], [18.5, -25], [19, -22]]],
    "Un désert du sud de l'Afrique (Botswana, Namibie, Afrique du Sud).", "CM1", "desert"],
  arabie: ["désert d'Arabie", [[[38, 28], [44, 30], [48, 28], [50.5, 24.5], [55, 22], [55, 19], [52, 17.5], [47, 18], [44, 20], [41, 24], [38, 26]]],
    "Un grand désert chaud d'Asie, qui couvre une grande partie de la péninsule Arabique.", "CM1", "desert"],
  amazonie: ["forêt amazonienne", [[[-78, -2], [-74, 3], [-67, 4], [-60, 4], [-54, 3], [-50, 0], [-48, -3], [-48, -7], [-53, -11], [-60, -13], [-66, -12], [-72, -11], [-76, -7]]],
    "La plus grande forêt tropicale du monde, autour de l'Amazone (Amérique du Sud).", "CE1", "foret"],
  congo: ["forêt du bassin du Congo", [[[9, 4], [13, 4.5], [18, 4.5], [24, 4], [29, 2], [30, -1], [28, -4], [24, -5], [19, -5], [14, -3], [11, -2], [9.5, 1]]],
    "La deuxième plus grande forêt tropicale du monde, au centre de l'Afrique.", "CE1", "foret"],
  indonesie: ["forêt indonésienne", [[[95, 5.5], [98, 4], [104, -1.5], [106, -5.8], [104, -5], [100, -1], [95.5, 3]],
    [[109.5, 1.5], [111, 2.5], [116, 7], [119, 5], [118, 1], [116.5, -3.5], [114, -3.5], [110.5, -3], [109, -1]],
    [[131, -1.5], [134, -0.8], [138, -1.5], [141, -2.6], [146, -5.5], [150, -10.5], [147, -8], [143, -9], [141, -9], [138, -8], [136, -4.5], [132.5, -3.5]]],
    "La forêt tropicale des îles d'Asie du Sud-Est (Indonésie, Malaisie, Nouvelle-Guinée).", "CE1", "foret"],
};
// point d'étiquette des milieux
export const MILIEUX_PT = { sahara: [12, 24], antarctique: [10, -77], gobi: [104, 43], atacama: [-69.6, -23], kalahari: [22.5, -23], arabie: [47, 22.5], amazonie: [-62, -5], congo: [21, -0.5], indonesie: [114, 0.5] };

// Zones climatiques (bandes de latitude, schéma simplifié).
export const ZONES = {
  tropicale: ["zone tropicale (chaude)", "#ffad66", "Entre les deux tropiques. Il y fait chaud toute l'année."],
  temperee: ["zone tempérée", "#9fdc8c", "Entre un tropique et un cercle polaire. Il y a quatre saisons. La France est dans la zone tempérée."],
  froide: ["zone froide (polaire)", "#9fd2ff", "Au-delà des cercles polaires, autour des pôles. Il y fait froid toute l'année."],
};
export const BANDES = [["froide", 66.56, 90], ["temperee", 23.44, 66.56], ["tropicale", -23.44, 23.44], ["temperee", -66.56, -23.44], ["froide", -90, -66.56]];

// Grandes villes : [nom, [lon, lat], code pays, niveau d'apparition, remarque]
export const VILLES = [
  ["Tokyo", [139.69, 35.69], "jp", "CE1", "La capitale du Japon."],
  ["Le Caire", [31.24, 30.04], "eg", "CE1", "La capitale de l'Égypte, au bord du Nil."],
  ["Paris", [2.35, 48.86], "fr", "CE1", "La capitale de la France, au bord de la Seine."],
  ["New York", [-74.01, 40.71], "us", "CE1", "La plus grande ville des États-Unis (mais pas la capitale : c'est Washington)."],
  ["São Paulo", [-46.63, -23.55], "br", "CE1", "La plus grande ville du Brésil (la capitale est Brasilia)."],
  ["Sydney", [151.21, -33.87], "au", "CE1", "Une très grande ville d'Australie, au bord de l'océan Pacifique (la capitale est Canberra)."],
  ["Mexico", [-99.13, 19.43], "mx", "CE2", "La capitale du Mexique."],
  ["Shanghai", [121.47, 31.23], "cn", "CE2", "Un très grand port de Chine, à l'embouchure du Yangtsé."],
  ["Delhi", [77.21, 28.61], "in", "CE2", "New Delhi, la capitale de l'Inde, fait partie de cette immense agglomération."],
  ["Lagos", [3.38, 6.52], "ng", "CE2", "La plus grande ville du Nigeria, au bord de l'océan Atlantique."],
  ["Moscou", [37.62, 55.76], "ru", "CE2", "La capitale de la Russie."],
  ["Londres", [-0.13, 51.51], "gb", "CE2", "La capitale du Royaume-Uni, au bord de la Tamise."],
  ["Buenos Aires", [-58.38, -34.6], "ar", "CE2", "La capitale de l'Argentine."],
  ["Los Angeles", [-118.24, 34.05], "us", "CE2", "Une très grande ville de l'ouest des États-Unis, au bord de l'océan Pacifique."],
  ["Pékin", [116.4, 39.9], "cn", "CM1", "La capitale de la Chine."],
  ["Bombay", [72.88, 19.08], "in", "CM1", "Une des plus grandes villes de l'Inde, au bord de l'océan Indien."],
  ["Kinshasa", [15.27, -4.32], "cd", "CM1", "La capitale de la République démocratique du Congo, au bord du fleuve Congo."],
  ["Istanbul", [28.98, 41.01], "tr", "CM1", "La plus grande ville de Turquie, de part et d'autre du Bosphore, entre l'Europe et l'Asie."],
  ["Rio de Janeiro", [-43.17, -22.91], "br", "CM1", "Une très grande ville du Brésil, au bord de l'océan Atlantique."],
  ["Séoul", [126.98, 37.57], "kr", "CM1", "La capitale de la Corée du Sud."],
  ["Dacca", [90.41, 23.81], "bd", "CM1", "La capitale du Bangladesh."],
  ["Melbourne", [144.96, -37.81], "au", "CM1", "Une très grande ville du sud de l'Australie."],
];
