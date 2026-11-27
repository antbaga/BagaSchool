// Textes des activités « Relief de France » et « Fleuves de France » (géo-france).
// Repères : programmes 2026 (CE2 : massifs et fleuves ; CM2 : la France, deux grands lacs). Voir docs/programmes-2026-decouvrir.md.
// Positions des étiquettes en [longitude, latitude]. Altitudes et longueurs : valeurs usuelles arrondies.

// niv = premier niveau où l'élément apparaît. type : "m" massif, "p" plaine ou bassin, "l" lac.
export const RELIEF = [
  { id: "alpes", nom: "Alpes", type: "m", niv: "CE2", pos: [6.55, 44.75], sommet: ["Mont Blanc", "environ 4 806 m", [6.865, 45.833]], note: "Sa hauteur varie de quelques mètres selon l'épaisseur de neige.",
    txt: "Le plus haut massif de France : une montagne jeune aux sommets pointus, avec des glaciers." },
  { id: "pyrenees", nom: "Pyrénées", type: "m", niv: "CE2", pos: [1.3, 42.72], sommet: ["Vignemale", "3 298 m", [-0.147, 42.774]], note: "Point culminant côté français. Le plus haut sommet des Pyrénées, l'Aneto (3 404 m), est en Espagne.",
    txt: "Une longue chaîne de montagnes qui forme la frontière avec l'Espagne, de l'océan Atlantique à la mer Méditerranée." },
  { id: "massif-central", nom: "Massif central", type: "m", niv: "CE2", pos: [2.7, 45.33], sommet: ["Puy de Sancy", "1 885 m", [2.814, 45.529]],
    txt: "Une montagne ancienne, usée, au centre de la France, avec de nombreux volcans éteints (la chaîne des Puys)." },
  { id: "jura", nom: "Jura", type: "m", niv: "CE2", pos: [5.95, 46.85], sommet: ["Crêt de la Neige", "1 720 m", [5.938, 46.271]],
    txt: "Une montagne moyenne aux sommets arrondis et aux longues crêtes, le long de la frontière avec la Suisse." },
  { id: "vosges", nom: "Vosges", type: "m", niv: "CE2", pos: [6.85, 48.3], sommet: ["Grand Ballon", "1 424 m", [7.098, 47.901]],
    txt: "Une montagne ancienne aux sommets arrondis, appelés « ballons », entre la Lorraine et l'Alsace." },
  { id: "corse", nom: "Corse", type: "m", niv: "CE2", pos: [9.15, 41.93], sommet: ["Monte Cinto", "2 706 m", [8.945, 42.379]],
    txt: "Une île très montagneuse de la mer Méditerranée : on l'appelle « la montagne dans la mer »." },
  { id: "armoricain", nom: "Massif armoricain", type: "p", niv: "CM1", pos: [-2.6, 48.1], sommet: ["Mont des Avaloirs", "416 m", [-0.135, 48.458]],
    txt: "Un très vieux massif, si usé qu'il ne forme plus que des collines et des plateaux peu élevés (Bretagne, ouest de la Normandie, Vendée)." },
  { id: "bassin-parisien", nom: "Bassin parisien", type: "p", niv: "CM1", pos: [2.5, 48.55],
    txt: "La plus grande région de plaines et de plateaux de France, autour de Paris. La Seine et ses affluents la traversent." },
  { id: "bassin-aquitain", nom: "Bassin aquitain", type: "p", niv: "CM1", pos: [0.15, 44.3],
    txt: "Les plaines et les collines du Sud-Ouest, entre le Massif central et les Pyrénées. La Garonne et la Dordogne y coulent." },
  { id: "alsace", nom: "Plaine d'Alsace", type: "p", niv: "CM2", pos: [7.75, 48.75],
    txt: "Une plaine étroite et plate entre les Vosges et le Rhin." },
  { id: "rhodanien", nom: "Couloir rhodanien", type: "p", niv: "CM2", pos: [4.85, 44.4],
    txt: "La vallée de la Saône et du Rhône, entre le Massif central et les Alpes : un grand couloir de circulation du nord au sud." },
  { id: "ardennes", nom: "Ardennes", type: "p", niv: "CM2", pos: [4.65, 50.0],
    txt: "Un vieux massif couvert de forêts, partagé avec la Belgique." },
  { id: "leman", nom: "Lac Léman", type: "l", niv: "CM2", pos: [6.55, 46.56],
    txt: "Le plus grand lac des Alpes, partagé entre la France et la Suisse. Le Rhône le traverse." },
  { id: "bourget", nom: "Lac du Bourget", type: "l", niv: "CM2", pos: [5.4, 45.72],
    txt: "Le plus grand lac naturel situé entièrement en France, en Savoie." },
];
export const ULTRAMARIN = "Un massif ultramarin : le piton des Neiges, un ancien volcan de La Réunion (environ 3 070 m), et le piton de la Fournaise, un volcan toujours actif.";

// Légende de la carte hypsométrique (mêmes seuils et couleurs que l'image img/decouvrir/relief-france.webp).
export const LEGENDE = [["0", "#76b260"], ["100", "#9ac770"], ["200", "#cede92"], ["500", "#f2dc8e"], ["1 000", "#e6b268"], ["1 500", "#d18b4c"], ["2 000", "#ab663c"], ["3 000 m", "#8a5038"]];

// Fleuves et rivières. f = fleuve (se jette dans la mer) ; dans = où il se jette ; long = longueur arrondie (seulement quand elle est bien établie).
export const FLEUVES = [
  { id: "seine", nom: "la Seine", f: 1, niv: "CE2", pos: [1.5, 49.1], long: "environ 775 km", source: "plateau de Langres (Côte-d'Or)", dans: "la Manche", villes: ["Troyes", "Paris", "Rouen", "Le Havre"] },
  { id: "loire", nom: "la Loire", f: 1, niv: "CE2", pos: [1.35, 47.6], long: "environ 1 000 km : le plus long fleuve de France", source: "mont Gerbier-de-Jonc, Massif central (Ardèche)", dans: "l'océan Atlantique", villes: ["Nevers", "Orléans", "Blois", "Tours", "Nantes"] },
  { id: "garonne", nom: "la Garonne", f: 1, niv: "CE2", pos: [0.2, 44.45], long: "environ 530 km", source: "Pyrénées espagnoles (val d'Aran)", dans: "l'océan Atlantique, par l'estuaire de la Gironde", villes: ["Toulouse", "Agen", "Bordeaux"] },
  { id: "rhone", nom: "le Rhône", f: 1, niv: "CE2", pos: [4.75, 44.6], long: "environ 810 km", source: "glacier du Rhône, Alpes suisses", dans: "la mer Méditerranée (delta de la Camargue)", villes: ["Genève", "Lyon", "Valence", "Avignon", "Arles"], plus: "Il traverse le lac Léman." },
  { id: "rhin", nom: "le Rhin", f: 1, niv: "CE2", pos: [7.62, 48.05], long: "environ 1 230 km", source: "Alpes suisses", dans: "la mer du Nord (aux Pays-Bas)", villes: ["Bâle", "Strasbourg", "Cologne"], plus: "Sur une partie de son cours, il forme la frontière entre la France et l'Allemagne." },
  { id: "maroni", nom: "le Maroni", f: 1, niv: "CE2", guyane: 1, dans: "l'océan Atlantique", villes: ["Saint-Laurent-du-Maroni"], plus: "En Guyane : il forme la frontière avec le Suriname." },
  { id: "dordogne", nom: "la Dordogne", niv: "CM1", pos: [0.55, 44.86], source: "puy de Sancy, Massif central", dans: "la Garonne, avec qui elle forme l'estuaire de la Gironde" },
  { id: "lot", nom: "le Lot", niv: "CM1", pos: [1.45, 44.47], source: "Massif central (Lozère)", dans: "la Garonne" },
  { id: "tarn", nom: "le Tarn", niv: "CM1", pos: [2.15, 43.93], source: "mont Lozère, Massif central", dans: "la Garonne", villes: ["Albi", "Montauban"] },
  { id: "allier", nom: "l'Allier", niv: "CM1", pos: [3.4, 46.2], source: "Massif central (Lozère)", dans: "la Loire, près de Nevers", villes: ["Vichy"] },
  { id: "cher", nom: "le Cher", niv: "CM1", pos: [2.3, 46.9], source: "Massif central (Creuse)", dans: "la Loire, près de Tours" },
  { id: "vienne", nom: "la Vienne", niv: "CM1", pos: [0.7, 46.45], source: "plateau de Millevaches, Massif central", dans: "la Loire", villes: ["Limoges"] },
  { id: "marne", nom: "la Marne", niv: "CM1", pos: [4.33, 48.93], source: "plateau de Langres", dans: "la Seine, près de Paris" },
  { id: "saone", nom: "la Saône", niv: "CM1", pos: [4.9, 46.6], source: "Vosges", dans: "le Rhône, à Lyon", villes: ["Chalon-sur-Saône", "Mâcon", "Lyon"] },
  { id: "durance", nom: "la Durance", niv: "CM1", pos: [5.8, 43.85], source: "Alpes (près de Montgenèvre)", dans: "le Rhône, près d'Avignon" },
  { id: "moselle", nom: "la Moselle", niv: "CM1", pos: [6.1, 48.9], source: "Vosges", dans: "le Rhin, à Coblence (Allemagne)", villes: ["Metz"] },
  { id: "yonne", nom: "l'Yonne", niv: "CM2", pos: [3.55, 47.8], source: "Morvan", dans: "la Seine", villes: ["Auxerre"] },
  { id: "doubs", nom: "le Doubs", niv: "CM2", pos: [6.0, 47.25], source: "Jura", dans: "la Saône", villes: ["Besançon"] },
  { id: "ariege", nom: "l'Ariège", niv: "CM2", pos: [1.6, 43.05], source: "Pyrénées", dans: "la Garonne, près de Toulouse", villes: ["Foix"] },
  { id: "creuse", nom: "la Creuse", niv: "CM2", pos: [1.5, 46.55], source: "plateau de Millevaches, Massif central", dans: "la Vienne" },
  { id: "meuse", nom: "la Meuse", f: 1, niv: "CM2", pos: [5.4, 49.15], source: "plateau de Langres (Haute-Marne)", dans: "la mer du Nord (aux Pays-Bas)", villes: ["Verdun", "Charleville-Mézières"] },
  { id: "adour", nom: "l'Adour", f: 1, niv: "CM2", pos: [-0.9, 43.72], source: "Pyrénées", dans: "l'océan Atlantique, à Bayonne", villes: ["Dax", "Bayonne"] },
  { id: "charente", nom: "la Charente", f: 1, niv: "CM2", pos: [-0.3, 45.7], dans: "l'océan Atlantique", villes: ["Angoulême", "Cognac", "Rochefort"] },
  { id: "somme", nom: "la Somme", f: 1, niv: "CM2", pos: [2.3, 49.9], dans: "la Manche (baie de Somme)", villes: ["Amiens"] },
  { id: "vilaine", nom: "la Vilaine", f: 1, niv: "CM2", pos: [-1.9, 47.85], dans: "l'océan Atlantique", villes: ["Rennes", "Redon"] },
  { id: "aude", nom: "l'Aude", f: 1, niv: "CM2", pos: [2.95, 43.2], source: "Pyrénées", dans: "la mer Méditerranée", villes: ["Carcassonne"] },
];
export const MERS = [
  { id: "manche", nom: "la Manche", pos: [-1.6, 50.1] },
  { id: "nord", nom: "la mer du Nord", pos: [2.3, 51.27] },
  { id: "atlantique", nom: "l'océan Atlantique", pos: [-2.9, 45.5] },
  { id: "mediterranee", nom: "la mer Méditerranée", pos: [5.3, 42.5] },
];
