// Pays du monde : nom français, capitale, continent, niveau de difficulté.
// [nom, capitale ("" = non affichée : capitale contestée ou en cours de transfert), continent, palier]
// palier : 1 = très connus (CE2), 2 = CM1, 3 = les autres (CM2), 0 = territoire (non souverain ou statut particulier) : jamais en quiz.
// Continents : af Afrique, eu Europe, as Asie, na Amérique du Nord (avec l'Amérique centrale et les Caraïbes), sa Amérique du Sud, oc Océanie, an Antarctique.
// Le code (ISO 3166 alpha-2 en minuscules) sert aussi à afficher le drapeau emoji.
export const CONTINENTS = {
  af: "Afrique", eu: "Europe", as: "Asie", na: "Amérique du Nord", sa: "Amérique du Sud", oc: "Océanie", an: "Antarctique",
};
export const PAYS_INFO = {
  // Afrique
  dz: ["Algérie", "Alger", "af", 1], ao: ["Angola", "Luanda", "af", 3], bj: ["Bénin", "Porto-Novo", "af", 3],
  bw: ["Botswana", "Gaborone", "af", 3], bf: ["Burkina Faso", "Ouagadougou", "af", 3], bi: ["Burundi", "Gitega", "af", 3],
  cm: ["Cameroun", "Yaoundé", "af", 2], cv: ["Cap-Vert", "Praia", "af", 3], cf: ["République centrafricaine", "Bangui", "af", 3],
  td: ["Tchad", "N'Djaména", "af", 2], km: ["Comores", "Moroni", "af", 3], cg: ["Congo", "Brazzaville", "af", 3],
  cd: ["République démocratique du Congo", "Kinshasa", "af", 2], ci: ["Côte d'Ivoire", "Yamoussoukro", "af", 2],
  dj: ["Djibouti", "Djibouti", "af", 3], eg: ["Égypte", "Le Caire", "af", 1], gq: ["Guinée équatoriale", "", "af", 3],
  er: ["Érythrée", "Asmara", "af", 3], sz: ["Eswatini", "Mbabane", "af", 3], et: ["Éthiopie", "Addis-Abeba", "af", 2],
  ga: ["Gabon", "Libreville", "af", 3], gm: ["Gambie", "Banjul", "af", 3], gh: ["Ghana", "Accra", "af", 3],
  gn: ["Guinée", "Conakry", "af", 3], gw: ["Guinée-Bissau", "Bissau", "af", 3], ke: ["Kenya", "Nairobi", "af", 2],
  ls: ["Lesotho", "Maseru", "af", 3], lr: ["Liberia", "Monrovia", "af", 3], ly: ["Libye", "Tripoli", "af", 2],
  mg: ["Madagascar", "Antananarivo", "af", 2], mw: ["Malawi", "Lilongwe", "af", 3], ml: ["Mali", "Bamako", "af", 2],
  mr: ["Mauritanie", "Nouakchott", "af", 3], mu: ["Maurice", "Port-Louis", "af", 3], ma: ["Maroc", "Rabat", "af", 1],
  mz: ["Mozambique", "Maputo", "af", 3], na: ["Namibie", "Windhoek", "af", 3], ne: ["Niger", "Niamey", "af", 2],
  ng: ["Nigeria", "Abuja", "af", 2], rw: ["Rwanda", "Kigali", "af", 3], st: ["Sao Tomé-et-Principe", "Sao Tomé", "af", 3],
  sn: ["Sénégal", "Dakar", "af", 2], sc: ["Seychelles", "Victoria", "af", 3], sl: ["Sierra Leone", "Freetown", "af", 3],
  so: ["Somalie", "Mogadiscio", "af", 3], za: ["Afrique du Sud", "Pretoria", "af", 1], ss: ["Soudan du Sud", "Djouba", "af", 3],
  sd: ["Soudan", "Khartoum", "af", 2], tz: ["Tanzanie", "Dodoma", "af", 3], tg: ["Togo", "Lomé", "af", 3],
  tn: ["Tunisie", "Tunis", "af", 2], ug: ["Ouganda", "Kampala", "af", 3], zm: ["Zambie", "Lusaka", "af", 3],
  zw: ["Zimbabwe", "Harare", "af", 3], eh: ["Sahara occidental (statut non réglé)", "", "af", 0],
  // Europe
  al: ["Albanie", "Tirana", "eu", 3], ad: ["Andorre", "Andorre-la-Vieille", "eu", 3], at: ["Autriche", "Vienne", "eu", 2],
  by: ["Biélorussie", "Minsk", "eu", 3], be: ["Belgique", "Bruxelles", "eu", 1], ba: ["Bosnie-Herzégovine", "Sarajevo", "eu", 3],
  bg: ["Bulgarie", "Sofia", "eu", 3], hr: ["Croatie", "Zagreb", "eu", 3], cy: ["Chypre", "Nicosie", "eu", 3],
  cz: ["Tchéquie", "Prague", "eu", 3], dk: ["Danemark", "Copenhague", "eu", 2], ee: ["Estonie", "Tallinn", "eu", 3],
  fi: ["Finlande", "Helsinki", "eu", 2], fr: ["France", "Paris", "eu", 1], de: ["Allemagne", "Berlin", "eu", 1],
  gr: ["Grèce", "Athènes", "eu", 2], hu: ["Hongrie", "Budapest", "eu", 3], is: ["Islande", "Reykjavik", "eu", 2],
  ie: ["Irlande", "Dublin", "eu", 2], it: ["Italie", "Rome", "eu", 1], xk: ["Kosovo", "Pristina", "eu", 0],
  lv: ["Lettonie", "Riga", "eu", 3], li: ["Liechtenstein", "Vaduz", "eu", 3], lt: ["Lituanie", "Vilnius", "eu", 3],
  lu: ["Luxembourg", "Luxembourg", "eu", 2], mt: ["Malte", "La Valette", "eu", 3], md: ["Moldavie", "Chisinau", "eu", 3],
  mc: ["Monaco", "Monaco", "eu", 3], me: ["Monténégro", "Podgorica", "eu", 3], nl: ["Pays-Bas", "Amsterdam", "eu", 1],
  mk: ["Macédoine du Nord", "Skopje", "eu", 3], no: ["Norvège", "Oslo", "eu", 2], pl: ["Pologne", "Varsovie", "eu", 2],
  pt: ["Portugal", "Lisbonne", "eu", 1], ro: ["Roumanie", "Bucarest", "eu", 2], ru: ["Russie", "Moscou", "eu", 1],
  sm: ["Saint-Marin", "Saint-Marin", "eu", 3], rs: ["Serbie", "Belgrade", "eu", 3], sk: ["Slovaquie", "Bratislava", "eu", 3],
  si: ["Slovénie", "Ljubljana", "eu", 3], es: ["Espagne", "Madrid", "eu", 1], se: ["Suède", "Stockholm", "eu", 2],
  ch: ["Suisse", "Berne", "eu", 1], ua: ["Ukraine", "Kiev (Kyiv)", "eu", 2], gb: ["Royaume-Uni", "Londres", "eu", 1],
  va: ["Vatican", "Vatican", "eu", 3], fo: ["Îles Féroé (Danemark)", "", "eu", 0],
  // Asie
  af: ["Afghanistan", "Kaboul", "as", 3], am: ["Arménie", "Erevan", "as", 3], az: ["Azerbaïdjan", "Bakou", "as", 3],
  bh: ["Bahreïn", "Manama", "as", 3], bd: ["Bangladesh", "Dacca", "as", 3], bt: ["Bhoutan", "Thimphou", "as", 3],
  bn: ["Brunei", "Bandar Seri Begawan", "as", 3], kh: ["Cambodge", "Phnom Penh", "as", 3], cn: ["Chine", "Pékin", "as", 1],
  ge: ["Géorgie", "Tbilissi", "as", 3], in: ["Inde", "New Delhi", "as", 1], id: ["Indonésie", "", "as", 2],
  ir: ["Iran", "Téhéran", "as", 2], iq: ["Irak", "Bagdad", "as", 2], il: ["Israël", "", "as", 3], jp: ["Japon", "Tokyo", "as", 1],
  jo: ["Jordanie", "Amman", "as", 3], kz: ["Kazakhstan", "Astana", "as", 2], kw: ["Koweït", "Koweït", "as", 3],
  kg: ["Kirghizistan", "Bichkek", "as", 3], la: ["Laos", "Vientiane", "as", 3], lb: ["Liban", "Beyrouth", "as", 3],
  my: ["Malaisie", "Kuala Lumpur", "as", 3], mv: ["Maldives", "Malé", "as", 3], mn: ["Mongolie", "Oulan-Bator", "as", 2],
  mm: ["Birmanie (Myanmar)", "Naypyidaw", "as", 3], np: ["Népal", "Katmandou", "as", 3], kp: ["Corée du Nord", "Pyongyang", "as", 3],
  om: ["Oman", "Mascate", "as", 3], pk: ["Pakistan", "Islamabad", "as", 2], ps: ["Palestine", "", "as", 3],
  ph: ["Philippines", "Manille", "as", 2], qa: ["Qatar", "Doha", "as", 3], sa: ["Arabie saoudite", "Riyad", "as", 2],
  sg: ["Singapour", "Singapour", "as", 3], kr: ["Corée du Sud", "Séoul", "as", 2], lk: ["Sri Lanka", "", "as", 3],
  sy: ["Syrie", "Damas", "as", 3], tw: ["Taïwan", "", "as", 0], tj: ["Tadjikistan", "Douchanbé", "as", 3],
  th: ["Thaïlande", "Bangkok", "as", 2], tl: ["Timor oriental", "Dili", "as", 3], tr: ["Turquie", "Ankara", "as", 2],
  tm: ["Turkménistan", "Achgabat", "as", 3], ae: ["Émirats arabes unis", "Abou Dabi", "as", 3], uz: ["Ouzbékistan", "Tachkent", "as", 3],
  vn: ["Viêt Nam", "Hanoï", "as", 2], ye: ["Yémen", "Sanaa", "as", 3],
  // Amérique du Nord, Amérique centrale, Caraïbes
  ag: ["Antigua-et-Barbuda", "Saint John's", "na", 3], bs: ["Bahamas", "Nassau", "na", 3], bb: ["Barbade", "Bridgetown", "na", 3],
  bz: ["Belize", "Belmopan", "na", 3], ca: ["Canada", "Ottawa", "na", 1], cr: ["Costa Rica", "San José", "na", 3],
  cu: ["Cuba", "La Havane", "na", 2], dm: ["Dominique", "Roseau", "na", 3], do: ["République dominicaine", "Saint-Domingue", "na", 3],
  sv: ["Salvador", "San Salvador", "na", 3], gd: ["Grenade", "Saint-Georges", "na", 3], gt: ["Guatemala", "Guatemala", "na", 3],
  ht: ["Haïti", "Port-au-Prince", "na", 3], hn: ["Honduras", "Tegucigalpa", "na", 3], jm: ["Jamaïque", "Kingston", "na", 3],
  mx: ["Mexique", "Mexico", "na", 1], ni: ["Nicaragua", "Managua", "na", 3], pa: ["Panama", "Panama", "na", 3],
  kn: ["Saint-Christophe-et-Niévès", "Basseterre", "na", 3], lc: ["Sainte-Lucie", "Castries", "na", 3],
  vc: ["Saint-Vincent-et-les-Grenadines", "Kingstown", "na", 3], tt: ["Trinité-et-Tobago", "Port-d'Espagne", "na", 3],
  us: ["États-Unis", "Washington", "na", 1], gl: ["Groenland (Danemark)", "Nuuk", "na", 0], pr: ["Porto Rico (États-Unis)", "", "na", 0],
  // Amérique du Sud
  ar: ["Argentine", "Buenos Aires", "sa", 1], bo: ["Bolivie", "Sucre", "sa", 2], br: ["Brésil", "Brasilia", "sa", 1],
  cl: ["Chili", "Santiago", "sa", 2], co: ["Colombie", "Bogota", "sa", 2], ec: ["Équateur", "Quito", "sa", 3],
  gy: ["Guyana", "Georgetown", "sa", 3], py: ["Paraguay", "Asuncion", "sa", 3], pe: ["Pérou", "Lima", "sa", 2],
  sr: ["Suriname", "Paramaribo", "sa", 3], uy: ["Uruguay", "Montevideo", "sa", 3], ve: ["Venezuela", "Caracas", "sa", 2],
  fk: ["Îles Malouines (Royaume-Uni)", "", "sa", 0],
  // Océanie
  au: ["Australie", "Canberra", "oc", 1], fj: ["Fidji", "Suva", "oc", 3], ki: ["Kiribati", "Tarawa", "oc", 3],
  mh: ["Îles Marshall", "Majuro", "oc", 3], fm: ["Micronésie", "Palikir", "oc", 3], nr: ["Nauru", "", "oc", 3],
  nz: ["Nouvelle-Zélande", "Wellington", "oc", 1], pw: ["Palaos", "Ngerulmud", "oc", 3], pg: ["Papouasie-Nouvelle-Guinée", "Port Moresby", "oc", 2],
  ws: ["Samoa", "Apia", "oc", 3], sb: ["Îles Salomon", "Honiara", "oc", 3], to: ["Tonga", "Nuku'alofa", "oc", 3], vu: ["Vanuatu", "Port-Vila", "oc", 3],
  // Antarctique (continent, pas un pays)
  aq: ["Antarctique", "", "an", 0],
};
// Remarques affichées dans la fiche.
export const PAYS_NOTE = {
  fr: "La France a aussi des territoires sur d'autres continents (Guyane, Antilles, La Réunion, Nouvelle-Calédonie…).",
  ru: "La Russie s'étend sur deux continents : l'Europe et l'Asie. C'est le plus grand pays du monde.",
  tr: "La Turquie s'étend surtout en Asie, avec une petite partie en Europe.",
  kz: "Le Kazakhstan a une petite partie de son territoire en Europe.",
  cy: "Chypre est membre de l'Union européenne ; l'île se trouve géographiquement en Asie.",
  bo: "Sucre est la capitale officielle ; le gouvernement siège à La Paz.",
  nl: "Amsterdam est la capitale ; le gouvernement siège à La Haye.",
  za: "Pretoria est la capitale administrative ; le Parlement siège au Cap.",
  ci: "Yamoussoukro est la capitale politique ; Abidjan est la plus grande ville.",
  bj: "Porto-Novo est la capitale officielle ; le gouvernement siège à Cotonou.",
  aq: "Un continent couvert de glace, sans pays : on y trouve seulement des bases scientifiques.",
  gl: "La plus grande île du monde. Elle fait partie du royaume de Danemark.",
  ca: "Le deuxième plus grand pays du monde.", cn: "Un des deux pays les plus peuplés du monde, avec l'Inde.",
  in: "Un des deux pays les plus peuplés du monde, avec la Chine.", va: "Le plus petit pays du monde, dans la ville de Rome.",
};
// Union européenne : les 27 États membres ; les 6 fondateurs (traité de Rome, 1957).
export const UE27 = ["de", "at", "be", "bg", "cy", "hr", "dk", "es", "ee", "fi", "fr", "gr", "hu", "ie", "it", "lv", "lt", "lu", "mt", "nl", "pl", "pt", "cz", "ro", "sk", "si", "se"];
export const UE_FONDATEURS = ["de", "be", "fr", "it", "lu", "nl"];
