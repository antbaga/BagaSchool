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
// Massifs : [nom, ligne de crête simplifiée (point d'étiquette au milieu), fiche, niveau, zone (contour calé sur le relief réel, généré par script)]
export const MASSIFS = {
  andes: ["Andes", [[-72,10],[-75,5.5],[-77.5,1],[-78.7,-2.5],[-78.5,-7],[-76,-11],[-72.5,-15],[-68.5,-18],[-67.5,-23],[-68.8,-28],[-70,-33],[-71,-38],[-71.6,-42],[-72.8,-47],[-73.3,-51]],
    "La plus longue chaîne de montagnes à l'air libre du monde, tout le long de l'ouest de l'Amérique du Sud.", "CE1",
    [[-71.8,-51.5],[-72.4,-50.9],[-73.4,-51.3],[-73.6,-51.2],[-74.0,-50.2],[-73.9,-48.8],[-73.5,-47.9],[-74.0,-47.4],[-73.1,-45.5],[-73.1,-45.1],[-72.7,-44.6],[-72.9,-44.1],[-72.5,-42.2],[-72.4,-39.9],[-71.9,-38.6],[-71.7,-36.9],[-70.6,-34.1],[-70.6,-33.4],[-71.2,-31.3],[-71.0,-30.8],[-71.0,-29.0],[-70.3,-27.4],[-70.5,-26.8],[-70.1,-26.2],[-70.5,-24.6],[-70.0,-23.6],[-70.1,-21.9],[-69.7,-21.2],[-70.1,-18.4],[-70.6,-17.6],[-72.5,-16.4],[-73.8,-16.0],[-74.8,-15.2],[-77.8,-10.3],[-79.2,-7.4],[-80.1,-4.8],[-80.0,-4.0],[-79.2,-2.3],[-78.9,0.4],[-77.6,1.8],[-76.5,4.5],[-76.2,5.4],[-76.3,7.3],[-75.7,7.5],[-75.0,7.0],[-75.0,5.6],[-74.6,5.3],[-73.2,7.1],[-73.4,8.6],[-72.4,7.9],[-70.0,9.9],[-69.5,9.6],[-71.0,8.2],[-72.0,7.6],[-72.2,7.1],[-71.9,6.5],[-72.2,5.8],[-73.7,4.1],[-74.7,2.6],[-77.4,0.3],[-77.5,-0.5],[-78.0,-1.6],[-77.8,-2.3],[-78.2,-4.1],[-78.5,-4.6],[-78.3,-5.2],[-77.6,-5.2],[-76.8,-5.8],[-76.7,-6.3],[-77.1,-7.2],[-76.6,-7.8],[-75.9,-8.1],[-75.5,-10.0],[-75.1,-10.5],[-74.8,-10.6],[-74.4,-10.1],[-73.0,-12.2],[-72.1,-12.0],[-70.8,-13.2],[-68.6,-13.9],[-68.1,-14.4],[-67.6,-15.5],[-66.8,-15.7],[-65.5,-17.1],[-64.8,-17.5],[-64.1,-21.0],[-63.8,-21.6],[-64.7,-22.8],[-64.9,-23.9],[-64.3,-24.2],[-65.0,-25.4],[-64.8,-26.2],[-65.8,-27.4],[-65.5,-28.5],[-66.7,-29.0],[-67.5,-30.4],[-67.4,-31.1],[-67.9,-31.6],[-68.5,-31.6],[-68.8,-32.2],[-68.9,-33.1],[-68.5,-33.6],[-68.6,-34.6],[-68.1,-35.6],[-68.2,-36.2],[-68.9,-37.7],[-69.9,-38.0],[-70.2,-38.4],[-69.8,-38.9],[-69.2,-39.0],[-68.8,-39.3],[-68.1,-39.3],[-67.4,-40.5],[-66.8,-41.0],[-66.6,-42.2],[-69.0,-43.8],[-68.9,-44.2],[-68.4,-44.2],[-68.3,-44.6],[-69.1,-44.7],[-69.7,-46.2],[-69.5,-46.6],[-68.8,-47.2],[-68.8,-47.6],[-69.4,-48.5],[-71.4,-49.3],[-71.3,-49.7],[-70.6,-49.9],[-71.8,-50.9]]],
  rocheuses: ["Rocheuses", [[-127,59],[-123,54.5],[-117,50],[-113,46],[-109.5,42],[-106.5,38.5],[-105.8,35]],
    "Une longue chaîne de montagnes dans l'ouest de l'Amérique du Nord (Canada et États-Unis).", "CE1",
    [[-105.2,32.4],[-107.0,32.6],[-108.4,33.4],[-109.0,34.4],[-109.6,37.4],[-113.9,42.1],[-114.2,42.9],[-114.8,43.2],[-117.1,45.4],[-117.1,45.7],[-116.4,45.6],[-115.6,46.2],[-115.6,46.8],[-116.0,47.2],[-115.8,48.1],[-117.6,49.4],[-119.5,49.2],[-119.9,48.6],[-120.5,48.5],[-121.2,49.1],[-121.4,49.8],[-122.8,50.2],[-126.1,52.6],[-125.9,52.8],[-124.4,53.0],[-124.1,52.7],[-124.5,52.2],[-124.2,51.8],[-122.8,51.6],[-122.2,51.2],[-121.8,51.2],[-121.4,50.6],[-120.7,50.6],[-121.1,50.1],[-120.8,49.7],[-119.8,50.3],[-119.2,50.0],[-118.7,50.4],[-118.7,51.0],[-119.8,51.4],[-120.6,51.0],[-120.6,51.8],[-121.8,53.0],[-121.1,53.9],[-121.2,54.2],[-124.4,56.6],[-124.7,56.3],[-124.6,55.8],[-125.0,55.5],[-126.6,56.1],[-127.5,55.9],[-127.5,56.4],[-127.8,56.7],[-128.2,56.6],[-128.8,56.8],[-130.0,56.4],[-130.3,57.6],[-129.7,58.6],[-130.3,59.0],[-130.2,59.8],[-129.2,59.1],[-128.8,59.3],[-128.0,58.8],[-127.2,58.6],[-126.2,59.2],[-124.6,58.7],[-123.2,57.4],[-123.1,56.2],[-122.0,55.1],[-121.4,55.2],[-121.0,54.8],[-118.3,54.0],[-117.6,53.4],[-115.3,52.2],[-114.0,50.2],[-113.9,49.4],[-112.9,49.0],[-112.2,47.3],[-111.5,47.2],[-110.6,47.5],[-109.4,46.9],[-109.2,45.6],[-109.0,45.3],[-108.4,45.5],[-108.0,45.2],[-103.6,39.8],[-103.2,39.0],[-103.3,38.0],[-102.8,36.3],[-103.4,35.3],[-103.0,34.7],[-103.6,33.5],[-104.2,34.2],[-104.5,34.1],[-104.8,33.6],[-104.8,32.6]]],
  alpes: ["Alpes", [[5.6,44.2],[6.9,45.5],[8.5,46.3],[10.5,46.6],[12.5,47],[15,47.4]],
    "La plus haute chaîne de montagnes d'Europe de l'Ouest. Son plus haut sommet est le mont Blanc, à la frontière entre la France et l'Italie.", "CE1",
    [[6.6,43.7],[6.4,43.8],[6.0,44.2],[5.5,44.2],[5.3,44.8],[6.1,45.8],[6.0,46.6],[6.5,46.9],[6.7,46.9],[7.0,46.8],[7.6,46.8],[9.2,47.3],[9.6,47.3],[10.4,47.7],[13.0,47.7],[14.0,47.8],[14.7,47.8],[15.4,47.9],[15.8,47.7],[15.8,47.5],[15.2,47.2],[15.0,46.7],[14.6,46.4],[14.2,46.4],[13.8,46.2],[13.0,46.4],[11.1,45.7],[9.6,45.9],[8.6,46.1],[7.7,45.5],[7.3,45.0],[7.3,44.7],[7.7,44.2],[7.7,44.0]]],
  atlas: ["Atlas", [[-9.3,30.6],[-6.5,31.8],[-3.5,33.3],[0,34.3],[3,35.3],[6,35.6],[9,35.8]],
    "Les montagnes du nord-ouest de l'Afrique : au Maroc, en Algérie et en Tunisie.", "CE1",
    [[-9.0,29.2],[-9.4,29.2],[-9.5,29.3],[-8.8,30.3],[-9.0,30.6],[-9.4,30.8],[-9.3,31.2],[-8.2,31.4],[-7.1,31.8],[-6.0,32.7],[-6.1,33.2],[-6.0,33.4],[-5.2,33.8],[-4.5,33.9],[-4.0,34.6],[-3.6,34.6],[-3.8,34.2],[-3.5,33.8],[-2.6,34.4],[-1.3,34.9],[-0.2,34.8],[0.8,35.0],[2.2,36.0],[2.4,35.8],[2.0,35.6],[2.0,35.3],[2.4,34.9],[2.8,34.9],[3.7,35.2],[4.3,35.0],[4.2,34.7],[3.9,34.3],[3.2,34.2],[2.3,33.6],[-3.0,32.0],[-3.9,31.5],[-4.4,31.5],[-5.6,30.6],[-6.5,30.2],[-7.4,30.1]]],
  himalaya: ["Himalaya", [[73.5,35.3],[76,33.7],[79,31],[82,29.6],[85,28.1],[88,27.8],[91,28],[94,28.8],[95.5,29.3]],
    "La plus haute chaîne de montagnes du monde, en Asie. On y trouve l'Everest, le plus haut sommet de la Terre (plus de 8 800 m).", "CE1",
    [[89.8,27.1],[88.4,27.5],[86.5,27.5],[84.8,28.2],[82.9,28.5],[81.2,29.5],[79.6,30.1],[77.9,31.2],[75.3,33.4],[74.6,33.5],[73.6,34.6],[72.9,35.0],[72.1,35.2],[72.0,35.7],[73.0,36.5],[74.2,36.4],[77.0,34.7],[80.0,32.0],[85.6,29.4],[87.9,29.1],[90.7,29.3],[95.3,30.6],[96.4,30.4],[96.9,29.6],[96.9,28.9],[96.4,28.3],[94.8,29.0],[92.1,27.2],[91.2,27.5]]],
  oural: ["Oural", [[66,68],[64.5,66.5],[60.5,64],[59.3,61.5],[59.3,59],[59.5,56.5],[59,54],[58.5,51.5]],
    "Une longue chaîne de montagnes peu élevées, en Russie. On s'en sert souvent comme limite entre l'Europe et l'Asie.", "CM1",
    [[59.0,50.4],[58.0,50.4],[57.3,50.7],[56.8,51.1],[56.7,51.7],[57.5,56.0],[57.4,57.0],[57.8,57.5],[57.2,58.6],[57.5,59.4],[57.6,60.0],[57.1,60.6],[57.1,60.8],[57.5,61.5],[57.9,61.9],[57.8,62.2],[58.0,62.6],[57.7,63.2],[57.9,63.6],[58.6,64.4],[58.7,64.8],[60.0,65.6],[60.6,65.9],[61.2,65.8],[62.2,66.0],[64.2,66.9],[64.6,67.4],[64.4,67.8],[64.5,68.0],[65.2,67.9],[66.2,68.4],[67.1,68.4],[67.2,68.2],[67.0,67.7],[67.1,67.3],[67.0,67.1],[63.7,66.3],[63.1,65.8],[62.2,65.4],[61.6,64.8],[60.6,64.6],[59.8,63.4],[59.9,62.3],[60.3,61.1],[59.8,60.4],[59.7,58.7],[60.2,58.1],[61.0,57.6],[61.3,57.1],[61.3,56.7],[61.0,55.7],[61.2,55.0],[60.3,51.3],[59.9,50.8]]],
  appalaches: ["Appalaches", [[-84.5,34],[-82,36],[-79.5,38.5],[-77,40.5],[-74.5,42],[-72.5,44],[-70,45.5],[-68,46.5]],
    "De vieilles montagnes usées par l'érosion, dans l'est de l'Amérique du Nord (États-Unis et Canada).", "CM2",
    [[-84.1,34.2],[-84.5,34.3],[-84.8,34.8],[-84.7,35.1],[-84.3,35.6],[-84.5,35.9],[-84.7,35.9],[-85.3,35.2],[-85.6,34.5],[-85.8,34.5],[-86.1,34.9],[-83.1,37.5],[-82.6,37.6],[-81.1,38.6],[-80.7,39.0],[-80.6,39.9],[-80.3,40.1],[-79.8,40.1],[-79.5,40.8],[-78.6,41.6],[-77.2,42.4],[-75.8,43.0],[-75.6,43.2],[-75.6,43.6],[-74.6,44.6],[-74.1,44.9],[-73.8,44.8],[-73.4,44.0],[-74.2,43.0],[-74.1,42.2],[-74.4,41.7],[-75.5,41.0],[-76.2,40.8],[-76.6,41.2],[-76.8,41.3],[-77.8,40.6],[-78.1,40.0],[-78.5,39.6],[-78.3,38.6],[-78.9,37.8],[-79.7,37.2],[-80.2,36.6],[-80.7,36.4],[-81.6,35.5],[-82.4,35.0]]],
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
