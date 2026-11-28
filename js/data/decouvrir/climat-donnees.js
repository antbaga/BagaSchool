// Contenus de l'activité « Le climat change » (js/decouvrir/climat.js).
// Un texte peut être une chaîne (tous niveaux) ou un tableau [CP-CE1, CE2, CM1-CM2] ;
// s'il manque une case, on prend la précédente.
// Chiffres et sources : docs/climat-sources.md. Tout chiffre ajouté ici doit y être sourcé.

// ---------- 1. Effet de serre : les 4 crans du curseur ----------
// retour = part de la chaleur renvoyée vers le sol par l'atmosphère (valeur pédagogique, pas une mesure).
export const SERRE = [
  {
    nom: ["Pas de couverture", "Sans gaz à effet de serre", "Sans gaz à effet de serre"],
    temp: -18, affiche: "−18 °C", visage: "🥶", retour: 0, mol: 0,
    txt: [
      "Sans couverture autour de la Terre, toute la chaleur du Soleil repartirait dans l'espace. Il ferait très, très froid : la Terre serait gelée.",
      "Sans les gaz à effet de serre, la chaleur repartirait toute dans l'espace. Il ferait en moyenne −18 °C sur Terre : tout serait gelé, la vie serait presque impossible.",
      "Sans gaz à effet de serre, tout le rayonnement infrarouge émis par le sol repartirait vers l'espace. La température moyenne serait d'environ −18 °C. L'effet de serre naturel est donc indispensable à la vie.",
    ],
  },
  {
    nom: ["Couverture normale", "Avant 1850", "Avant 1850, avant l'industrie"],
    temp: 14, affiche: "≈ 14 °C", visage: "🙂", retour: 0.5, mol: 7,
    txt: [
      "L'air autour de la Terre garde une partie de la chaleur, comme une couverture. Grâce à elle, il fait bon sur Terre : on peut vivre.",
      "Certains gaz de l'air gardent une partie de la chaleur du Soleil : c'est l'effet de serre. Il est naturel et utile : grâce à lui, il fait environ 14 °C en moyenne sur Terre.",
      "La vapeur d'eau, le dioxyde de carbone (CO₂) et le méthane retiennent une partie de la chaleur et la renvoient vers le sol : c'est l'effet de serre naturel. Avant 1850, l'air contenait environ 280 ppm de CO₂ (280 molécules sur un million) et la température moyenne était d'environ 14 °C.",
    ],
  },
  {
    nom: ["Couverture plus épaisse", "Aujourd'hui", "Aujourd'hui"],
    temp: 15.4, affiche: "≈ 15,4 °C", visage: "😓", retour: 0.6, mol: 11,
    txt: [
      "Les humains ont ajouté des gaz dans l'air. La couverture est devenue plus épaisse : elle garde trop de chaleur. La Terre se réchauffe.",
      "En brûlant du charbon, du pétrole et du gaz, les humains ont ajouté beaucoup de gaz à effet de serre. Plus de chaleur reste près du sol : la Terre s'est réchauffée d'environ 1,4 °C.",
      "Depuis 1850, les activités humaines ont fait passer le CO₂ de 280 à plus de 420 ppm : une hausse de plus de 50 %. L'effet de serre est renforcé. En 2025, la Terre était environ 1,4 °C plus chaude qu'avant l'industrie, et les années 2015 à 2025 sont les 11 plus chaudes jamais mesurées.",
    ],
  },
  {
    nom: ["Couverture trop épaisse", "Si on continue", "En 2100, si les émissions augmentent encore"],
    temp: 18.4, affiche: "≈ 18 °C", visage: "🥵", retour: 0.72, mol: 17,
    txt: [
      "Si on continue à ajouter des gaz, la couverture deviendra trop épaisse et il fera beaucoup trop chaud. Mais on peut encore l'éviter !",
      "Si on continue à ajouter de plus en plus de gaz, la Terre pourrait se réchauffer d'environ 4 °C d'ici 2100. Ce n'est pas obligé : cela dépend de ce que nous faisons maintenant.",
      "Si les émissions continuent d'augmenter, les scientifiques du GIEC estiment que la Terre pourrait gagner environ +4,4 °C vers 2100 (de +3,3 à +5,7 °C). Si on les réduit très vite, le réchauffement peut rester proche de +1,5 °C. L'avenir dépend de nos choix.",
    ],
  },
];

export const SERRE_INTRO = [
  "Le Soleil chauffe le sol (flèches jaunes). Le sol renvoie de la chaleur vers le ciel (flèches rouges). L'air autour de la Terre en garde une partie, comme une couverture.",
  "Le Soleil chauffe le sol (flèches jaunes). Le sol chaud renvoie de la chaleur vers le ciel (flèches rouges). Des gaz de l'air, les gaz à effet de serre, en renvoient une partie vers le sol.",
  "La lumière du Soleil (jaune) traverse l'atmosphère et chauffe le sol. Le sol émet alors un rayonnement infrarouge, invisible (rouge). Les gaz à effet de serre en absorbent une partie et la renvoient vers le sol.",
];

// ---------- 2. Causes ----------
// x, y : position dans la scène (viewBox 800 × 460). t = premier palier où la cause apparaît (0, 1 ou 2).
export const CAUSES = [
  { id: "voiture", ico: "🚗", x: 430, y: 392, t: 0, gaz: "CO₂", nom: ["Les voitures et les camions", "Les transports : voitures, camions", "Les transports routiers"],
    txt: ["Les voitures et les camions brûlent de l'essence ou du gazole. Cela fait de la fumée qui contient un gaz qui réchauffe la Terre.",
      "Les voitures, les camions et les motos brûlent de l'essence ou du gazole, fabriqués avec du pétrole. Cela rejette du dioxyde de carbone (CO₂). En France, les transports sont la première cause des gaz à effet de serre.",
      "L'essence et le gazole viennent du pétrole. En brûlant, ils rejettent du CO₂. En France, les transports représentent environ un tiers (34 %) des émissions de gaz à effet de serre, surtout à cause des voitures et des camions."] },
  { id: "avion", ico: "✈️", x: 600, y: 70, t: 0, gaz: "CO₂", nom: "Les avions",
    txt: ["Les avions brûlent beaucoup de carburant pour voler. Prendre l'avion réchauffe beaucoup la planète.",
      "Les avions brûlent du kérosène, fabriqué avec du pétrole. Un voyage en avion rejette beaucoup plus de CO₂ par personne que le même voyage en train.",
      "Le kérosène des avions vient du pétrole. Par passager et par kilomètre, l'avion émet bien plus que le train, surtout en France où l'électricité des trains émet peu de CO₂."] },
  { id: "usine", ico: "🏭", x: 150, y: 250, t: 0, gaz: "CO₂", nom: ["Les usines", "Les usines", "L'industrie"],
    txt: ["Pour fabriquer des objets, les usines ont besoin de beaucoup d'énergie. Elles rejettent des gaz qui réchauffent la Terre.",
      "Pour fabriquer des objets, de l'acier, du ciment ou du plastique, les usines utilisent beaucoup d'énergie, souvent en brûlant du charbon, du pétrole ou du gaz.",
      "Fabriquer de l'acier, du ciment, du verre, du plastique ou des engrais demande beaucoup d'énergie, souvent fossile. La fabrication du ciment rejette aussi du CO₂ par elle-même. Plus on achète d'objets neufs, plus il faut en fabriquer."] },
  { id: "maison", ico: "🏠", x: 300, y: 300, t: 0, gaz: "CO₂", nom: ["Le chauffage", "Le chauffage des maisons", "Les bâtiments : chauffage"],
    txt: ["Certaines maisons sont chauffées en brûlant du fioul ou du gaz. Cela rejette des gaz qui réchauffent la Terre.",
      "Beaucoup de maisons et d'écoles sont chauffées avec une chaudière au fioul ou au gaz. En brûlant, ils rejettent du CO₂. Une maison mal isolée laisse partir la chaleur : il faut chauffer plus.",
      "Les chaudières au fioul et au gaz rejettent du CO₂. Les logements et les bureaux représentent environ 15 % des émissions en France. Bien isoler et régler le chauffage à 19 °C permet d'en rejeter beaucoup moins."] },
  { id: "vache", ico: "🐄", x: 560, y: 300, t: 0, gaz: "méthane", nom: ["Les vaches", "L'élevage des vaches", "L'agriculture et l'élevage"],
    txt: ["En digérant l'herbe, les vaches rotent. Leurs rots contiennent un gaz, le méthane, qui réchauffe la Terre.",
      "En digérant l'herbe, les vaches et les moutons font des rots qui contiennent du méthane, un gaz à effet de serre très puissant. Plus on mange de viande de bœuf, plus il faut de vaches.",
      "Les ruminants (vaches, moutons) rejettent du méthane en digérant. Les engrais azotés rejettent du protoxyde d'azote (N₂O). En France, l'agriculture représente environ 22 % des émissions. Le bœuf est l'aliment qui en émet le plus."] },
  { id: "foret", ico: "🪓", x: 700, y: 250, t: 0, gaz: "CO₂", nom: ["Couper les forêts", "La déforestation", "La déforestation"],
    txt: ["Les arbres aident la planète : ils absorbent le gaz qui la réchauffe. Quand on coupe ou brûle les forêts, il y a moins d'arbres pour nous aider.",
      "Les arbres absorbent du CO₂ pour grandir. Quand on coupe ou brûle une forêt, par exemple en Amazonie pour faire des champs, le CO₂ stocké repart dans l'air et il y a moins d'arbres pour en absorber.",
      "Les forêts stockent du carbone. Les déboiser, souvent pour faire des champs ou des pâturages (Amazonie, Indonésie…), libère ce carbone en CO₂ et réduit les puits de carbone. C'est une cause importante dans le monde."] },
  { id: "centrale", ico: "⚡", x: 60, y: 330, t: 1, gaz: "CO₂", nom: ["Les centrales électriques", "Les centrales au charbon et au gaz", "Les centrales au charbon et au gaz"],
    txt: ["", "Pour faire de l'électricité, beaucoup de pays brûlent du charbon ou du gaz : cela rejette beaucoup de CO₂. En France, l'électricité vient surtout du nucléaire, de l'eau, du vent et du soleil : elle en rejette peu.",
      "Dans le monde, le charbon et le gaz servent encore beaucoup à produire l'électricité : c'est la première source de CO₂. En France, l'électricité vient surtout du nucléaire et des énergies renouvelables (eau, vent, soleil) et émet peu de CO₂."] },
  { id: "dechets", ico: "🗑️", x: 230, y: 410, t: 1, gaz: "méthane", nom: "Les déchets",
    txt: ["", "Les déchets enterrés dans les décharges pourrissent et rejettent du méthane. Et chaque objet jeté a demandé de l'énergie pour être fabriqué.",
      "Les déchets qui se décomposent dans les décharges rejettent du méthane (environ 4 % des émissions en France). Jeter un objet, c'est aussi gaspiller toute l'énergie qui a servi à le fabriquer et à le transporter."] },
];

export const CAUSES_INTRO = [
  "Touche les images pour découvrir ce qui ajoute des gaz qui réchauffent la Terre.",
  "Touche les images. La plupart de ces gaz viennent du charbon, du pétrole et du gaz qu'on brûle pour se déplacer, se chauffer et fabriquer des objets.",
  "Touche les images. Le charbon, le pétrole et le gaz naturel sont des combustibles fossiles : ils se sont formés il y a des millions d'années. En les brûlant, on rejette du CO₂. Dans le monde, ils causent plus des trois quarts des émissions de gaz à effet de serre.",
];

// Émissions de la France par secteur, 2025, estimation provisoire (SDES, Chiffres clés du climat, d'après Citepa Secten 2026).
export const SECTEURS_FR = [
  { nom: "Transports", ico: "🚗", p: 34 },
  { nom: "Agriculture", ico: "🐄", p: 22 },
  { nom: "Industrie", ico: "🏭", p: 16 },
  { nom: "Logements et bureaux", ico: "🏠", p: 15 },
  { nom: "Production d'énergie", ico: "⚡", p: 9 },
  { nom: "Déchets", ico: "🗑️", p: 4 },
];

// ---------- 3. Conséquences ----------
// Époques du curseur. glacier / banquise : taille (0 à 1) ; mer : montée dessinée (px, exagérée pour être visible).
export const EPOQUES = [
  { nom: ["Autrefois", "Vers 1900", "Vers 1900"], degre: ["", "", "référence"], glacier: 1, banquise: 1, mer: 0, sec: 0 },
  { nom: "Aujourd'hui", degre: ["", "+1,4 °C", "+1,4 °C (2025)"], glacier: 0.6, banquise: 0.7, mer: 5, sec: 0.25 },
  { nom: ["Demain, si on agit", "2100, si on agit vite", "2100, si on réduit vite les émissions"], degre: ["", "+1,5 à +2 °C", "≈ +1,4 à +1,8 °C"], glacier: 0.45, banquise: 0.55, mer: 12, sec: 0.4 },
  { nom: ["Demain, si on ne fait rien", "2100, si on continue", "2100, si les émissions augmentent"], degre: ["", "+4 °C", "≈ +4,4 °C"], glacier: 0.12, banquise: 0.15, mer: 26, sec: 1 },
];
export const EPOQUES_TXT = [
  ["Autrefois, les glaciers des montagnes étaient grands et la glace du pôle Nord aussi.",
    "Vers 1900, avant que les humains rejettent beaucoup de gaz, les glaciers des Alpes étaient bien plus grands.",
    "Vers 1850-1900 : c'est la période de référence pour mesurer le réchauffement."],
  ["Aujourd'hui, la Terre a un peu de fièvre. Les glaciers fondent, il y a plus de très fortes chaleurs.",
    "Aujourd'hui, la Terre s'est réchauffée d'environ 1,4 °C, et la France d'environ 1,7 °C. Les glaciers fondent, la mer monte, les canicules sont plus fréquentes.",
    "En 2025, la Terre était environ 1,4 °C plus chaude qu'en 1850-1900 ; la France hexagonale s'est déjà réchauffée de 1,7 °C (2023). La mer est montée d'environ 20 cm depuis 1900."],
  ["Si on réduit vite les gaz, la Terre se réchauffera encore un peu, puis cela s'arrêtera. On pourra s'adapter.",
    "Si tous les pays réduisent très vite leurs gaz, le réchauffement peut rester entre +1,5 et +2 °C. La mer montera quand même un peu, mais beaucoup moins.",
    "Avec une baisse rapide des émissions, le GIEC estime le réchauffement vers 2100 entre +1,4 et +1,8 °C (meilleures estimations). La mer monterait d'environ 30 à 60 cm par rapport à 1995-2014."],
  ["Si on ne fait rien, il fera beaucoup trop chaud. Les glaciers auront presque disparu. Mais ce n'est pas obligé : on peut agir !",
    "Si on continue à rejeter de plus en plus de gaz, la Terre pourrait gagner +4 °C vers 2100, et la France encore plus. Ce n'est pas écrit d'avance : on peut l'éviter.",
    "Si les émissions augmentent fortement, le GIEC estime +4,4 °C vers 2100 (de +3,3 à +5,7 °C) et une montée de la mer d'environ 60 cm à 1 m. Ce scénario n'est pas une fatalité : il dépend des décisions prises maintenant."],
];

export const CONSEQUENCES = [
  { id: "chaleur", ico: "🔥", x: 430, y: 92, t: 0, nom: ["Il fait plus chaud", "Les canicules", "Canicules plus fréquentes"],
    txt: ["Il y a plus souvent des jours de très forte chaleur l'été. C'est difficile pour les personnes âgées, les bébés, les animaux et les plantes.",
      "Une canicule, c'est quand il fait très chaud plusieurs jours et plusieurs nuits de suite. Avec le réchauffement, il y en a plus souvent et elles sont plus fortes. En 2019, il a fait 46 °C dans l'Hérault : un record en France.",
      "Les vagues de chaleur sont plus fréquentes, plus longues et plus intenses. Record de France : 46,0 °C le 28 juin 2019 à Vérargues (Hérault). La canicule de 2003 a causé environ 15 000 morts en France. Se protéger de la chaleur devient une question de santé."] },
  { id: "secheresse", ico: "🏜️", x: 560, y: 360, t: 0, nom: ["Il pleut moins", "Les sécheresses et les incendies", "Sécheresses et incendies"],
    txt: ["Quand il fait chaud et qu'il ne pleut pas, la terre devient sèche. Les plantes ont soif et les forêts brûlent plus facilement.",
      "Avec la chaleur, l'eau s'évapore plus vite. Les sols deviennent secs, les rivières baissent, les plantes manquent d'eau. Les forêts sèches brûlent plus facilement.",
      "La chaleur augmente l'évaporation : les sols s'assèchent plus vite, les nappes et les rivières baissent en été. Les sécheresses agricoles deviennent plus fréquentes en France, et le risque d'incendie s'étend vers le nord (comme en 2022)."] },
  { id: "pluie", ico: "🌧️", x: 535, y: 158, t: 0, nom: ["Des pluies très fortes", "Les pluies très fortes", "Pluies intenses et inondations"],
    txt: ["Parfois, au contraire, il tombe énormément de pluie d'un coup. L'eau déborde : ce sont des inondations.",
      "Un air plus chaud contient plus de vapeur d'eau. Quand il pleut, il peut donc tomber beaucoup d'eau d'un coup, et provoquer des inondations.",
      "Un air plus chaud peut contenir plus de vapeur d'eau (environ 7 % de plus par degré). Les pluies extrêmes deviennent plus intenses, par exemple lors des épisodes méditerranéens à l'automne. Il faut aussi éviter d'imperméabiliser les sols."] },
  { id: "glacier", ico: "🏔️", x: 655, y: 100, t: 0, nom: ["Les glaciers fondent", "Les glaciers fondent", "Recul des glaciers"],
    txt: ["En montagne, les glaciers sont de grandes rivières de glace. Avec la chaleur, ils fondent et deviennent de plus en plus petits.",
      "Les glaciers des Alpes et des Pyrénées fondent et reculent chaque année. Il y a aussi moins de neige en hiver en moyenne montagne. Or les glaciers donnent de l'eau aux rivières en été.",
      "Presque tous les glaciers du monde reculent ; ceux des Alpes ont perdu une grande partie de leur volume depuis 1900. Huit des dix années de plus forte fonte mesurées sont postérieures à 2016 (OMM). Moins de glaciers, c'est moins d'eau dans les rivières en été."] },
  { id: "banquise", ico: "🐻‍❄️", x: 105, y: 330, t: 0, nom: ["La glace des pôles fond", "La banquise fond", "La banquise et les calottes"],
    txt: ["Au pôle Nord, la mer est couverte de glace : la banquise. Elle fond et devient plus petite. Les ours polaires ont besoin de cette glace pour chasser.",
      "La banquise, c'est la mer gelée près des pôles. Au pôle Nord, elle devient plus petite et plus mince, surtout en été. Les ours polaires chassent les phoques depuis la banquise.",
      "La banquise arctique (mer gelée) a fortement reculé depuis les premières mesures par satellite en 1979, surtout en été. Les calottes du Groenland et de l'Antarctique (glace sur la terre) perdent aussi de la glace : elles font monter la mer."] },
  { id: "mer", ico: "🌊", x: 205, y: 395, t: 0, nom: ["La mer monte", "La mer monte", "Montée du niveau de la mer"],
    txt: ["La glace qui fond sur terre coule vers la mer. Et l'eau chaude prend plus de place. Alors la mer monte doucement et grignote les plages.",
      "La mer monte pour deux raisons : la glace des montagnes et du Groenland fond et coule dans la mer, et l'eau de mer qui se réchauffe prend plus de place. Elle est montée d'environ 20 cm depuis 1900.",
      "Le niveau moyen des mers a monté d'environ 20 cm entre 1901 et 2018, et de plus en plus vite (environ 11 cm depuis 1993). Causes : fonte des glaciers et des calottes, dilatation de l'eau qui se réchauffe. Les côtes basses et les îles sont menacées (érosion, submersion)."] },
  { id: "especes", ico: "🦋", x: 480, y: 250, t: 0, nom: ["Les animaux et les plantes", "Les animaux et les plantes", "La biodiversité"],
    txt: ["Certains animaux et certaines plantes ont trop chaud là où ils vivent. Ils doivent partir vers des endroits plus frais, ou ils risquent de disparaître.",
      "Les plantes fleurissent plus tôt au printemps. Certains animaux partent vers le nord ou montent en montagne pour trouver de la fraîcheur. Ceux qui ne peuvent pas bouger assez vite sont en danger.",
      "Les saisons se décalent (floraisons et migrations plus précoces), des espèces se déplacent vers le nord ou en altitude. Le réchauffement s'ajoute aux autres menaces sur la biodiversité (destruction des milieux, pollutions). Protéger la nature aide aussi à limiter le réchauffement."] },
  { id: "cultures", ico: "🌾", x: 360, y: 330, t: 1, nom: ["Les champs", "Les champs et les récoltes", "Agriculture et ressources en eau"],
    txt: ["", "Les agriculteurs doivent s'adapter : sécheresses, chaleur, gelées tardives… Les vendanges ont lieu bien plus tôt qu'autrefois.",
      "Chaleur et sécheresse font baisser certains rendements ; les cultures doivent s'adapter (variétés, dates de semis, irrigation, partage de l'eau). Les vendanges ont lieu plusieurs semaines plus tôt qu'il y a cinquante ans."] },
  { id: "ocean", ico: "🪸", x: 60, y: 420, t: 2, nom: "L'océan et les coraux",
    txt: ["", "", "L'océan absorbe plus d'un quart du CO₂ que nous rejetons et l'essentiel de la chaleur en trop. Il devient plus chaud et plus acide : les coraux blanchissent et peuvent mourir, ce qui menace de nombreux poissons qui vivent autour."] },
];

// ---------- 4. Agir : gestes à trier ----------
// ok = true : ça aide (on rejette moins de gaz). t = premier palier où le geste apparaît.
export const GESTES = [
  { id: "velo", ico: "🚲", ok: true, t: 0, nom: "Aller à l'école à pied ou à vélo" },
  { id: "lumiere", ico: "💡", ok: true, t: 0, nom: "Éteindre la lumière en sortant" },
  { id: "saison", ico: "🍎", ok: true, t: 0, nom: "Manger des fruits de saison" },
  { id: "reparer", ico: "🧸", ok: true, t: 0, nom: "Réparer ou donner ses jouets" },
  { id: "arbre", ico: "🌳", ok: true, t: 0, nom: "Planter des arbres, protéger les forêts" },
  { id: "pain", ico: "🥖", ok: false, t: 0, nom: "Jeter la nourriture qu'on n'a pas finie" },
  { id: "voiture", ico: "🚗", ok: false, t: 0, nom: "Prendre la voiture pour aller tout près" },
  { id: "fenetre", ico: "🪟", ok: false, t: 0, nom: "Chauffer avec la fenêtre ouverte" },
  { id: "ecran", ico: "📺", ok: false, t: 0, nom: "Laisser la télé allumée sans la regarder" },
  { id: "train", ico: "🚆", ok: true, t: 1, nom: "Prendre le train plutôt que l'avion" },
  { id: "gourde", ico: "🚰", ok: true, t: 1, nom: "Boire l'eau du robinet dans une gourde" },
  { id: "neuf", ico: "🛍️", ok: false, t: 1, nom: "Acheter souvent des vêtements neufs" },
  { id: "fraises", ico: "🍓", ok: false, t: 1, nom: "Manger des fraises venues de loin en hiver" },
  { id: "chauffage", ico: "🌡️", ok: true, t: 2, nom: "Régler le chauffage à 19 °C" },
  { id: "legumes", ico: "🥕", ok: true, t: 2, nom: "Manger moins de viande rouge, plus de légumes" },
  { id: "solaire", ico: "☀️", ok: true, t: 2, nom: "Produire l'électricité avec le soleil et le vent" },
  { id: "telephone", ico: "📱", ok: false, t: 2, nom: "Changer de téléphone chaque année" },
  { id: "charbon", ico: "⛏️", ok: false, t: 2, nom: "Produire l'électricité avec du charbon" },
];

// Message de fin, pour ne pas laisser les élèves sur une inquiétude.
export const ENSEMBLE = [
  { ico: "🧒", nom: ["Moi", "Moi et ma famille", "Chacun de nous"], txt: ["Je fais des petits gestes et j'en parle autour de moi.", "Petits gestes, et en parler à la maison.", "Gestes du quotidien, choix de déplacement et d'alimentation."] },
  { ico: "🏫", nom: ["L'école", "L'école", "L'école et la commune"], txt: ["On peut planter des arbres dans la cour, trier, faire un potager.", "Cour plus verte, potager, tri, moins de gaspillage à la cantine.", "Cours végétalisées, cantine locale et de saison, pistes cyclables."] },
  { ico: "🏛️", nom: ["Les grands", "Les villes et les pays", "Les États et les entreprises"], txt: ["Les maires, les pays, les entreprises décident de grandes choses : trains, énergie propre…", "Trains, transports en commun, électricité propre, protection des forêts.", "Accord de Paris (2015) : limiter le réchauffement bien en dessous de 2 °C. Énergies renouvelables, isolation, transports."] },
  { ico: "🔬", nom: ["Les savants", "Les scientifiques", "Les scientifiques"], txt: ["Ils étudient le climat et inventent des solutions.", "Ils mesurent le climat, préviennent et inventent des solutions.", "Le GIEC rassemble leurs travaux pour éclairer les décisions."] },
];
export const ENSEMBLE_MSG = [
  "On ne peut pas tout régler seul, mais tout le monde peut aider. Chaque geste compte !",
  "Ce n'est pas aux enfants de tout régler : ce sont surtout les grandes décisions qui comptent. Mais chacun peut aider, et en parler.",
  "Chaque dixième de degré évité compte : le réchauffement s'arrêtera quand on cessera d'ajouter des gaz à effet de serre. Les solutions existent déjà ; il faut les mettre en œuvre partout.",
];

// ---------- 5. Quiz ----------
// ok = index de la bonne réponse dans r. t = paliers concernés.
export const QUIZ = [
  { t: [0, 1], q: "Avoir 39 °C au lieu de 37 °C, ce n'est que 2 degrés de plus. C'est…", r: ["Avoir de la fièvre", "Rien du tout"], ok: 0, e: "2 degrés de plus et on est malade ! Pour la Terre aussi, quelques degrés en moyenne, c'est beaucoup." },
  { t: [1, 2], q: "Aujourd'hui, la Terre se réchauffe…", r: ["Beaucoup plus vite qu'à la fin de la glaciation", "Plus lentement qu'avant", "Pas du tout"], ok: 0, e: "Environ 10 fois plus vite : les plantes, les animaux et les humains ont du mal à s'adapter." },
  { t: [2], q: "Pendant la dernière glaciation, il y a 20 000 ans, la Terre était plus froide d'environ…", r: ["6 °C", "60 °C", "0,5 °C"], ok: 0, e: "Environ 6 °C (de 5 à 7 °C) : quelques degrés suffisent à changer complètement le monde." },
  { t: [2], q: "Une chaleur extrême qui arrivait 1 fois en 50 ans arriverait, à +2 °C, environ…", r: ["14 fois en 50 ans", "1 fois en 50 ans", "1 fois en 500 ans"], ok: 0, e: "Environ 14 fois selon le GIEC : une petite hausse de la moyenne rend les extrêmes beaucoup plus fréquents." },
  { t: [0, 1], q: "Qui chauffe la Terre ?", r: ["Le Soleil", "La Lune", "Les nuages"], ok: 0, e: "C'est le Soleil qui chauffe la Terre. L'air garde une partie de cette chaleur." },
  { t: [0, 1], q: "Sans la « couverture » de gaz autour de la Terre, il ferait…", r: ["Très froid", "Très chaud", "Pareil"], ok: 0, e: "Sans effet de serre, il ferait environ −18 °C : la Terre serait gelée. L'effet de serre naturel est utile !" },
  { t: [0], q: "Quel geste aide la planète ?", r: ["Aller à l'école à pied", "Laisser la lumière allumée", "Jeter son goûter"], ok: 0, e: "Marcher ou faire du vélo ne rejette pas de gaz qui réchauffe la Terre." },
  { t: [0, 1], q: "Que se passe-t-il quand la Terre se réchauffe ?", r: ["Les glaciers fondent", "Il neige plus partout", "La mer descend"], ok: 0, e: "Avec la chaleur, les glaciers fondent et la mer monte." },
  { t: [0, 1, 2], q: "Les arbres aident la planète, car…", r: ["Ils absorbent du CO₂", "Ils fabriquent des nuages de fumée", "Ils réchauffent l'air"], ok: 0, e: "Les arbres absorbent du dioxyde de carbone pour grandir. Les forêts sont précieuses." },
  { t: [0, 1], q: "Les rots des vaches contiennent un gaz qui réchauffe la Terre.", r: ["Vrai", "Faux"], ok: 0, e: "Vrai ! En digérant l'herbe, les vaches rejettent du méthane." },
  { t: [0], q: "Quel animal a besoin de la glace du pôle Nord pour chasser ?", r: ["L'ours polaire", "Le lion", "La vache"], ok: 0, e: "L'ours polaire chasse les phoques depuis la banquise, qui fond avec le réchauffement." },
  { t: [1, 2], q: "Pour aller loin, qu'est-ce qui rejette le moins de CO₂ ?", r: ["Le train", "L'avion", "La voiture seul"], ok: 0, e: "En France, le train roule surtout à l'électricité, qui émet peu de CO₂." },
  { t: [1, 2], q: "Pourquoi la mer monte-t-elle ?", r: ["La glace sur terre fond et l'eau chaude prend plus de place", "Les poissons sont plus nombreux", "Il y a plus de bateaux"], ok: 0, e: "Fonte des glaciers et des calottes, et dilatation de l'eau qui se réchauffe : la mer est montée d'environ 20 cm depuis 1900." },
  { t: [1, 2], q: "En France, quelle est la première source de gaz à effet de serre ?", r: ["Les transports", "Les déchets", "Les téléphones"], ok: 0, e: "Les transports (surtout voitures et camions) représentent environ un tiers des émissions en France." },
  { t: [1], q: "Le charbon, le pétrole et le gaz, quand on les brûle…", r: ["rejettent du CO₂", "rafraîchissent l'air", "ne rejettent rien"], ok: 0, e: "En brûlant, ils rejettent du dioxyde de carbone, le principal gaz responsable du réchauffement." },
  { t: [1, 2], q: "Un hiver très froid prouve que la Terre ne se réchauffe pas.", r: ["Vrai", "Faux"], ok: 1, e: "Faux ! Le temps qu'il fait un jour, c'est la météo. Le climat, c'est la moyenne sur au moins 30 ans. Et cette moyenne augmente." },
  { t: [2], q: "Quelle est la différence entre météo et climat ?", r: ["La météo, c'est le temps d'un jour ; le climat, la moyenne sur 30 ans", "C'est la même chose", "Le climat, c'est le temps de demain"], ok: 0, e: "La météo décrit le temps sur quelques jours. Le climat décrit le temps moyen d'une région sur au moins 30 ans." },
  { t: [2], q: "De combien la Terre s'est-elle réchauffée depuis 1850-1900 ?", r: ["Environ 1,4 °C", "Environ 10 °C", "Pas du tout"], ok: 0, e: "En 2025, la Terre était environ 1,4 °C plus chaude qu'avant l'industrie (OMM). La France s'est réchauffée de 1,7 °C." },
  { t: [2], q: "Le trou dans la couche d'ozone est la cause principale du réchauffement.", r: ["Vrai", "Faux"], ok: 1, e: "Faux ! Ce sont deux problèmes différents. Le réchauffement vient surtout du CO₂ rejeté en brûlant charbon, pétrole et gaz." },
  { t: [2], q: "Quel gaz à effet de serre rejettent surtout les vaches ?", r: ["Le méthane", "L'oxygène", "L'hélium"], ok: 0, e: "Le méthane (CH₄), un gaz à effet de serre bien plus puissant que le CO₂ mais qui reste moins longtemps dans l'air." },
  { t: [2], q: "Que dit l'Accord de Paris (2015) ?", r: ["Limiter le réchauffement bien en dessous de 2 °C", "Interdire les voitures", "Arrêter de mesurer la température"], ok: 0, e: "Presque tous les pays du monde se sont engagés à limiter le réchauffement bien en dessous de 2 °C, si possible à 1,5 °C." },
  { t: [2], q: "Qu'est-ce que le GIEC ?", r: ["Un groupe de scientifiques qui fait le point sur le climat", "Une usine", "Un glacier"], ok: 0, e: "Le GIEC (Groupe d'experts intergouvernemental sur l'évolution du climat) rassemble les connaissances scientifiques sur le climat." },
  { t: [2], q: "L'océan devient plus acide, car…", r: ["Il absorbe une partie du CO₂", "Les poissons boivent du soda", "Il pleut du vinaigre"], ok: 0, e: "L'océan absorbe plus d'un quart du CO₂ rejeté : il devient plus acide, ce qui gêne les coraux et les coquillages." },
];

// ---------- Fiche enseignant ----------
export const ENSEIGNANT = {
  deroule: [
    ["🏠 Effet de serre", "Partir de ce que savent les élèves (« Pourquoi fait-il chaud sur Terre ? »). Montrer l'animation, puis bouger le curseur. Insister : l'effet de serre est naturel et utile ; c'est son renforcement qui pose problème."],
    ["🏭 Causes", "Faire deviner aux élèves ce qui rejette des gaz avant de toucher les images. Fil rouge : on brûle du charbon, du pétrole, du gaz. En CM, montrer les parts par secteur en France."],
    ["📈 +2 °C ?", "Pourquoi quelques degrés, c'est beaucoup : la fièvre (même +2 °C), la vitesse (la courbe sur 22 000 ans : glaciation, puis réchauffement actuel environ 10 fois plus rapide), les canicules (une petite hausse de la moyenne multiplie les extrêmes)."],
    ["🌊 Conséquences", "Avancer le curseur du temps, puis toucher les étiquettes. Montrer les deux avenirs : celui-ci dépend de nos choix."],
    ["🌱 Agir", "Trier les gestes en groupe, puis discuter de « Tous ensemble » : finir sur ce qu'on peut faire, à son échelle et collectivement."],
    ["❓ Quiz", "En fin de séance ou à la séance suivante, pour réactiver."],
  ],
  vocab: [
    ["Climat / météo", "La météo, c'est le temps sur quelques jours ; le climat, la moyenne sur au moins 30 ans."],
    ["Effet de serre", "Des gaz de l'atmosphère retiennent une partie de la chaleur émise par le sol."],
    ["Gaz à effet de serre", "Vapeur d'eau, dioxyde de carbone (CO₂), méthane (CH₄), protoxyde d'azote (N₂O)…"],
    ["Combustibles fossiles", "Charbon, pétrole, gaz naturel, formés il y a des millions d'années."],
    ["Banquise / glacier", "Banquise : eau de mer gelée. Glacier : glace formée par la neige, sur la terre."],
    ["GIEC", "Groupe d'experts intergouvernemental sur l'évolution du climat (IPCC en anglais)."],
  ],
  idees: [
    "« Le trou de la couche d'ozone cause le réchauffement » : non, ce sont deux phénomènes distincts.",
    "« Il a fait froid cet hiver, donc ça ne se réchauffe pas » : confusion météo / climat.",
    "« La banquise qui fond fait monter la mer » : très peu (la glace flotte déjà). Ce sont les glaciers et calottes sur terre, et la dilatation de l'eau, qui la font monter.",
    "« L'effet de serre, c'est mal » : l'effet de serre naturel est indispensable à la vie.",
  ],
  anxiete: "Rester factuel, ne pas dramatiser, et toujours finir sur ce qui est possible. Rappeler que ce n'est pas aux enfants de porter le problème : des millions d'adultes, de scientifiques, d'élus y travaillent. Laisser les élèves exprimer leurs émotions, valoriser les actions de la classe (potager, tri, cour végétalisée).",
  programmes: [
    "Cycle 2, Questionner le monde : le vivant, la matière, les objets ; l'eau et ses états ; le temps qu'il fait et les saisons.",
    "Cycle 3, Sciences et technologie : la planète Terre, les êtres vivants dans leur environnement ; l'énergie.",
    "Éducation au développement durable (EDD), transversale de la maternelle au lycée.",
  ],
  verifier: [
    "Correspondance précise avec les programmes 2026 de sciences (BO n°24 du 11 juin 2026, non relu en détail) : les intitulés ci-dessus sont indicatifs.",
    "Chiffres datés : ils changent chaque année (température 2025, émissions françaises 2025 provisoires). Voir la date dans les sources.",
    "Les gestes « manger moins de viande rouge » et « fruits de saison » : à présenter sans juger les familles.",
    "Vendanges « plusieurs semaines plus tôt » et canicule 2003 (≈ 15 000 décès) : ordres de grandeur couramment cités, non revérifiés ici.",
    "Étape « +2 °C ? » : la courbe sur 22 000 ans est simplifiée (forme approximative) ; « environ 10 fois plus vite » est un ordre de grandeur (GIEC, NASA). Les fréquences de canicules sont celles du GIEC pour une chaleur « 1 fois en 50 ans », pas des prévisions pour la France.",
    "L'animation de l'effet de serre est un modèle simplifié : les proportions de flèches renvoyées ne sont pas des mesures.",
  ],
  sources: [
    ["GIEC (IPCC), 6e rapport, Résumé pour les décideurs du rapport de synthèse, 2023", "https://www.ipcc.ch/report/ar6/syr/"],
    ["GIEC (IPCC), 6e rapport, groupe I (2021) : glaciation, vitesse du réchauffement, extrêmes de chaleur (fig. SPM.6)", "https://www.ipcc.ch/report/ar6/wg1/"],
    ["OMM, État du climat mondial 2025 (mars 2026)", "https://wmo.int/news/media-centre/earths-climate-swings-increasingly-out-of-balance"],
    ["Ministère de la Transition écologique, TRACC : +1,7 °C en France en 2023", "https://www.ecologie.gouv.fr/dossiers/france-sadapte/rechauffement-trajectoire-reference"],
    ["SDES, Chiffres clés du climat : émissions françaises par secteur (2025, provisoire)", "https://www.statistiques.developpement-durable.gouv.fr/edition-numerique/chiffres-cles-du-climat/fr/10-panorama-francais-des-gaz-a"],
    ["Météo-France : record national de 46,0 °C (Vérargues, 28 juin 2019)", ""],
    ["ADEME, Agir pour la transition écologique (gestes, chauffage à 19 °C)", "https://agirpourlatransition.ademe.fr/particuliers/"],
  ],
};

// ---------- Effet de serre : bulles d'info des éléments de l'image ----------
export const INFOS_SERRE = {
  soleil: { ico: "☀️", nom: "Le Soleil", txt: [
    "Le Soleil envoie de la lumière et de la chaleur. C'est lui qui chauffe la Terre.",
    "Le Soleil envoie sa lumière vers la Terre. Elle traverse l'air et chauffe le sol, la mer et les plantes.",
    "Le Soleil envoie surtout de la lumière visible. Elle traverse l'atmosphère et chauffe le sol et les océans. Environ 30 % de cette lumière est directement renvoyée vers l'espace par les nuages, la glace et la neige."] },
  atm: { ico: "🌫️", nom: ["L'air autour de la Terre", "L'atmosphère", "L'atmosphère"], txt: [
    "La Terre est entourée d'air. Cet air garde un peu de chaleur, comme une couverture sur ton lit.",
    "L'atmosphère, c'est la couche d'air qui entoure la Terre. Quelques gaz, en petite quantité, retiennent la chaleur : ce sont les gaz à effet de serre, comme le CO₂.",
    "L'air est surtout fait d'azote et d'oxygène, qui ne retiennent pas la chaleur. Les gaz à effet de serre (vapeur d'eau, CO₂, méthane…) ne sont qu'une toute petite partie de l'air, mais ils absorbent l'infrarouge et en renvoient une partie vers le sol."] },
  co2: { ico: "⚫", nom: "Une molécule de CO₂", txt: "Le dioxyde de carbone : un atome de carbone (noir) et deux atomes d'oxygène (rouges). Il y en a environ 420 sur un million de molécules d'air. C'est très peu, mais assez pour changer le climat. Une partie du CO₂ rejeté reste dans l'air pendant des siècles." },
  sol: { ico: "🌍", nom: ["Le sol", "Le sol et la mer", "Le sol et les océans"], txt: [
    "Le sol chauffé par le Soleil renvoie de la chaleur vers le ciel, comme une route chaude en été.",
    "Le sol et la mer, chauffés par le Soleil, renvoient de la chaleur vers le ciel (flèches rouges). On ne la voit pas, mais on la sent, comme la chaleur d'un mur resté au soleil.",
    "Le sol et les océans chauffés émettent un rayonnement infrarouge, invisible (flèches rouges). Les océans stockent plus de 90 % de la chaleur en trop due à l'effet de serre renforcé."] },
  thermo: { ico: "🌡️", nom: ["Le thermomètre de la Terre", "La température moyenne", "La température moyenne de la Terre"], txt: [
    "Il montre si la Terre a chaud ou froid. Bouge le curseur pour voir ce qui se passe !",
    "C'est la moyenne de toutes les températures de la Terre : le jour et la nuit, l'été et l'hiver, partout. Elle change très lentement… sauf aujourd'hui.",
    "C'est une moyenne sur toute la planète et toute l'année. Quelques dixièmes de degré de plus sur cette moyenne, c'est déjà beaucoup : voir l'étape « +2 °C ? »."] },
};

// ---------- +2 °C ? Pourquoi quelques degrés, c'est beaucoup ----------
export const DEG_VUES = [["fievre", "🤒", "Comme une fièvre"], ["vitesse", "🚀", "Trop vite"], ["canicules", "🔥", "Les canicules"]];

// Fièvre : le même nombre de degrés en plus, pour un enfant (37 °C) et pour la Terre (≈ 14 °C avant 1850).
export const FIEVRE_CORPS = [[0, "🧒", "Tout va bien"], [1, "🧒", "Un peu chaud"], [2.5, "🤒", "Fièvre : on est malade"], [3.5, "🤒", "Forte fièvre : on voit le médecin"], [9, "🚑", "Très forte fièvre : c'est grave"]];
export const FIEVRE_TERRE = [[0, "🙂", "Le climat d'avant 1850"], [1, "😐", "Déjà des changements"], [1.5, "😓", "≈ aujourd'hui (+1,4 °C)"], [2, "🥵", "Limite de l'Accord de Paris"], [3, "🥵", "Beaucoup de dégâts"], [9, "🔥", "Si on ne fait rien"]];
export const FIEVRE_TXT = [
  "Quand tu as 39 °C, tu n'as que 2 degrés de plus que d'habitude, et pourtant tu es malade ! Pour la Terre, c'est pareil : quelques degrés de plus en moyenne, c'est déjà beaucoup.",
  "Ton corps reste toujours vers 37 °C : avec 2 degrés de plus, tu as de la fièvre. La Terre aussi a gardé une température moyenne presque stable pendant des milliers d'années, environ 14 °C. 2 degrés de plus en moyenne, c'est comme une fièvre pour la planète.",
  "Le corps humain reste à 37 °C : +2 °C, c'est déjà la fièvre. La température moyenne de la Terre a très peu varié depuis 10 000 ans, la période où sont apparues l'agriculture et les villes. Une moyenne, c'est très stable : +2 °C partout et toute l'année, c'est une énorme quantité de chaleur en plus.",
];

// Vitesse : courbe simplifiée de la température moyenne (écart à 1850-1900, °C) sur 22 000 ans.
// Forme approximative d'après les reconstructions citées par le GIEC (AR6) ; dernier point : OMM 2025.
export const COURBE = [[-22000, -6], [-19000, -6], [-17500, -5.7], [-16000, -5], [-14700, -4], [-13000, -3.5], [-12000, -3.7], [-11000, -2.4], [-10000, -1.3], [-8500, -0.5], [-7000, -0.1], [-4000, 0.1], [-1000, -0.1], [1850, 0], [2025, 1.4]];
export const ZOOM = [[1850, 0], [1900, 0], [1940, 0.3], [1960, 0.25], [1980, 0.45], [2000, 0.75], [2015, 1.05], [2025, 1.4]];
export const DEG_POINTS = [
  { id: "glaciation", ico: "🦣", an: -20000, T: -6, t: 0, nom: ["Au temps des mammouths", "La dernière glaciation", "La dernière glaciation"], txt: [
    "Il y a très longtemps, au temps des mammouths, il faisait beaucoup plus froid. De la glace recouvrait le nord de l'Europe.",
    "Il y a 20 000 ans, la Terre était environ 6 °C plus froide qu'avant 1850. Une énorme couche de glace recouvrait le nord de l'Europe, et la mer était bien plus basse.",
    "Il y a 20 000 ans, la Terre était environ 5 à 7 °C plus froide. Une calotte de glace couvrait le nord de l'Europe, et la mer était plus de 100 m plus bas. Seulement 6 °C d'écart : c'est la différence entre une glaciation et notre climat."] },
  { id: "lent", ico: "🐌", an: -11000, T: -2.4, t: 0, nom: ["Un réchauffement très lent", "Un réchauffement très lent", "La fin de la glaciation"], txt: [
    "Ensuite, la Terre s'est réchauffée tout doucement, pendant des milliers d'années. Les plantes et les animaux avaient le temps de s'habituer.",
    "La Terre a mis environ 10 000 ans pour se réchauffer de 6 °C. C'est très lent : les forêts et les animaux avaient le temps de se déplacer.",
    "Sortir de la glaciation a pris environ 10 000 ans, soit en moyenne moins de 0,1 °C par siècle. Les écosystèmes avaient le temps de migrer et de s'adapter."] },
  { id: "stable", ico: "🌾", an: -4000, T: 0.1, t: 0, nom: ["Un climat calme", "Un climat stable", "10 000 ans de climat stable"], txt: [
    "Puis le climat est resté calme très longtemps. Les humains ont pu cultiver des champs et construire des villages.",
    "Pendant des milliers d'années, la température moyenne a très peu changé. Les humains ont inventé l'agriculture, construit des villes : notre monde s'est construit dans ce climat stable.",
    "Depuis 10 000 ans, la température moyenne est restée stable. Agriculture, villes, écriture : toute notre civilisation s'est développée dans ce climat."] },
  { id: "vite", ico: "🚀", an: 2025, T: 1.4, t: 0, nom: ["Aujourd'hui : très vite !", "Aujourd'hui : très vite", "Aujourd'hui : environ 10 fois plus vite"], txt: [
    "Aujourd'hui, la Terre se réchauffe très, très vite, à cause des gaz que nous rejetons. Les plantes et les animaux n'ont pas le temps de s'habituer.",
    "Depuis 150 ans, la Terre a déjà gagné 1,4 °C. C'est environ 10 fois plus vite qu'à la fin de la glaciation. Les forêts, les animaux et les humains ont du mal à s'adapter aussi vite.",
    "La Terre a gagné 1,4 °C en 150 ans, environ 10 fois plus vite qu'à la sortie de la glaciation. Selon le GIEC, un réchauffement aussi rapide n'a pas eu lieu depuis au moins 2 000 ans. +2 ou +3 °C en un ou deux siècles, c'est la moitié d'une glaciation à l'envers, en un clin d'œil."] },
];

// Canicules : chaleur extrême qui arrivait 1 fois en 50 ans dans le climat de 1850-1900 (GIEC AR6, RID, figure SPM.6 : ×4,8 à +1 °C, ×8,6 à +1,5 °C, ×13,9 à +2 °C, ×39,2 à +4 °C).
export const CANICULES = [
  { nom: "Avant 1900", n: 1 }, { nom: "+1 °C", n: 5 }, { nom: "+1,5 °C", n: 9 }, { nom: "+2 °C", n: 14 }, { nom: "+4 °C", n: 39 },
];
export const CANICULES_TXT = [
  "Chaque case, c'est une année. 🔥, c'est une chaleur très, très forte. Autrefois, elle arrivait 1 seule fois en 50 ans. Bouge le curseur : avec quelques degrés de plus, elle arrive bien plus souvent !",
  "Une chaleur extrême, qui arrivait environ 1 fois en 50 ans avant 1900, arrive déjà environ 5 fois en 50 ans. À +2 °C, ce serait environ 14 fois. La moyenne monte un peu, mais les jours extrêmes deviennent beaucoup plus fréquents.",
  "Une chaleur extrême qui arrivait 1 fois en 50 ans dans le climat de 1850-1900 arrive environ 5 fois à +1 °C, 9 fois à +1,5 °C, 14 fois à +2 °C et 39 fois à +4 °C (GIEC). Et la moyenne mondiale cache des écarts : les continents se réchauffent plus que les océans (la France est déjà à +1,7 °C) et l'Arctique se réchauffe environ 4 fois plus vite que la moyenne.",
];
