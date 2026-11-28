// Lecture chronométrée (fluence) : textes et repères, du CP au CM2.
//
// TEXTES : rédigés pour BagaSchool (textes originaux, pas des textes officiels), à relire par la prof.
// Les textes des évaluations nationales (Repères CE1, CM1, CM2, 6e) ne sont pas reproduits ici : ils ne
// sont pas publiés avec une licence de réutilisation et servent aux évaluations elles-mêmes. La prof peut
// coller le texte de son choix (« Mon texte »).
// Chaque texte est assez long pour qu'un bon lecteur du niveau ne le termine pas en une minute.
//
// REPÈRES (mots correctement lus en une minute), sources consultées le 28/11/2026 :
// - fin : « attendu de fin d'année scolaire », Eduscol, « Évaluation de début de 6e : repères pour
//   travailler la fluence » (sept. 2026), p. 2 : CP 50, CE1 70, CE2 90, CM1 110, CM2 120.
//   https://eduscol.education.gouv.fr/sites/default/files/document/evaluationdebut6efrancaisreperestravaillerfluence-130222.pdf
// - debut : seuil du groupe « satisfaisant » des évaluations nationales de début d'année, DEPP, Note
//   d'information n° 26.31 (juillet 2026), figure 1 : début CE1 30, CE2 70, CM1 90, CM2 110 (rien en CP).
//   https://www.education.gouv.fr/sites/default/files/document/deppni-2026-31fluence-de-lecturepdf-518870.pdf
export const REPERES = {
  CP: { debut: null, fin: 50 },
  CE1: { debut: 30, fin: 70 },
  CE2: { debut: 70, fin: 90 },
  CM1: { debut: 90, fin: 110 },
  CM2: { debut: 110, fin: 120 },
};

const T = (id, niv, titre, texte) => ({ id, niv, titre, texte });
export const TEXTES = [
  T("cp-chat", "CP", "Le chat de Léo",
    "Léo a un petit chat. Il est tout gris. Le chat s'appelle Pilou. Le matin, Pilou dort sur le lit. Puis il va dans le jardin. Il court après une pomme. Il saute sur le mur. Le soir, Léo lui donne du lait. Pilou est content. Il fait ronron sur le tapis. Léo rit. Il aime bien son petit chat gris. Demain, ils vont jouer avec une balle rouge."),
  T("cp-pluie", "CP", "La pluie",
    "Il pleut sur la ville. Lili a mis ses bottes et sa cape. Elle saute dans une flaque. Plouf ! L'eau va partout. Sa maman rit. Dans la rue, il y a un escargot. Il va très lentement. Lili le pose sur une feuille. Puis le soleil revient. Le ciel est bleu. On voit un arc-en-ciel au-dessus du parc. Lili lève la tête et dit : « Il est joli ! »"),
  T("ce1-gateau", "CE1", "Le gâteau de Mamie",
    "Dimanche, Nina va chez sa grand-mère. Mamie a décidé de préparer un gâteau au chocolat. Nina sort la farine, le sucre, les œufs et le beurre. Elle casse les œufs dans un grand bol. Mamie fait fondre le chocolat dans une casserole. Ça sent très bon dans toute la cuisine ! Nina mélange avec une cuillère en bois. La pâte devient lisse et brillante. Mamie la verse dans un moule et le met dans le four. Pendant la cuisson, Nina et sa grand-mère jouent aux cartes. Nina gagne deux parties. Au bout de trente minutes, la sonnerie retentit. Le gâteau est gonflé et doré. Il faut attendre qu'il refroidisse. Nina trouve que c'est très long ! Enfin, Mamie coupe une belle part pour chacune. « C'est le meilleur gâteau du monde », dit Nina en souriant. Mamie lui donne la recette pour la semaine prochaine."),
  T("ce1-ferme", "CE1", "La sortie à la ferme",
    "Ce matin, la classe de Monsieur Martin part en car pour visiter une ferme. Les élèves sont très impatients. À l'arrivée, le fermier leur montre l'étable. Il y a six vaches et un petit veau né la veille. Le veau tient à peine sur ses pattes. Ensuite, les enfants vont voir les poules. Tom ramasse un œuf encore tiède dans la paille. Il le tient avec beaucoup de précaution. Près de la mare, des canards nagent en file. Un gros cochon rose se roule dans la boue. Les enfants rient très fort. À midi, tout le monde pique-nique sous un grand chêne. L'après-midi, le fermier explique comment on fabrique le fromage avec le lait. Chacun peut goûter un petit morceau. Sur le chemin du retour, Tom raconte sa journée à son voisin. Il voudrait devenir fermier plus tard."),
  T("ce2-phare", "CE2", "Le phare",
    "Au bout de la presqu'île se dresse un vieux phare blanc et rouge. Autrefois, un gardien vivait tout en haut. Chaque soir, il montait les cent vingt marches de l'escalier en colimaçon pour allumer la lampe. Sa lumière guidait les bateaux et les empêchait de heurter les rochers. Aujourd'hui, le phare fonctionne tout seul, mais on peut encore le visiter. Pendant les vacances, Malo et sa sœur Jade ont grimpé jusqu'au sommet. Arrivés en haut, ils étaient essoufflés. Le vent soufflait si fort qu'ils devaient se tenir à la rambarde. Devant eux, la mer s'étendait à perte de vue. Ils ont aperçu un voilier, deux chalutiers et même un groupe de dauphins qui sautaient au loin. Le guide leur a montré l'énorme lentille de verre qui concentre la lumière. Elle tourne lentement et envoie un éclat toutes les cinq secondes. Ainsi, les marins savent exactement de quel phare il s'agit. En redescendant, Jade a compté les marches pour vérifier. Elle en a trouvé cent vingt-deux. Le guide a souri : personne ne compte jamais de la même façon !"),
  T("ce2-potager", "CE2", "Le potager de l'école",
    "Depuis le mois de mars, les élèves de CE2 s'occupent d'un potager derrière la cour. Au début, le terrain était couvert d'herbes folles et de cailloux. Il a fallu tout nettoyer, retourner la terre et ajouter du compost. Ensuite, la maîtresse a partagé la classe en quatre équipes. La première a semé des radis, la deuxième des carottes, la troisième des salades et la dernière des haricots. Chaque équipe tient un carnet où elle note la date des semis, la météo et la hauteur des plantes. Un matin, Sacha a découvert que des limaces avaient dévoré plusieurs salades. Les élèves ont cherché une solution sans produit chimique. Ils ont disposé des coquilles d'œufs écrasées autour des pieds, car les limaces n'aiment pas ramper dessus. Cela a plutôt bien fonctionné. Les radis ont poussé les premiers : il ne leur faut que quelques semaines. En juin, la classe a organisé une petite vente devant l'école. Avec l'argent récolté, les enfants ont acheté un récupérateur d'eau de pluie pour arroser le potager l'année prochaine."),
  T("cm1-refuge", "CM1", "Une nuit au refuge",
    "Le sentier serpentait entre les sapins depuis plus de deux heures lorsque Léna aperçut enfin le toit du refuge. Ses jambes étaient lourdes et son sac semblait peser une tonne. Son père, qui marchait devant, se retourna pour l'encourager : « Plus que quelques lacets, et nous pourrons nous reposer ! » Le refuge était une petite construction en pierre, accrochée au flanc de la montagne. À l'intérieur, une dizaine de randonneurs se réchauffaient autour d'un poêle. Le gardien leur servit une soupe de légumes fumante, puis un plat de pâtes au fromage. Léna n'avait jamais trouvé un repas aussi délicieux. Après le dîner, tout le monde sortit pour admirer le ciel. Loin des lumières de la ville, les étoiles étaient innombrables. Le gardien montra la Grande Ourse, puis l'étoile Polaire, qui indique toujours le nord. Soudain, une étoile filante traversa le ciel. Léna ferma les yeux et fit un vœu, sans le dire à personne. La nuit fut courte : le réveil sonna à cinq heures. Il fallait partir tôt pour atteindre le sommet avant que les nuages ne s'accumulent. Dans la pénombre, les lampes frontales dessinaient une guirlande de petites lumières sur la pente. Quand le soleil se leva, les sommets enneigés devinrent roses, puis dorés. Léna comprit pourquoi son père aimait tant se lever avant l'aube."),
  T("cm1-abeilles", "CM1", "La vie des abeilles",
    "Une ruche peut abriter jusqu'à cinquante mille abeilles. Pourtant, chaque colonie ne compte qu'une seule reine. Son rôle est de pondre des œufs : au printemps, elle peut en déposer plus de mille par jour. Les mâles, appelés faux bourdons, ne récoltent pas de nourriture. La plupart des abeilles sont des ouvrières, et leur vie est très organisée. Pendant les premiers jours, elles nettoient les alvéoles et nourrissent les larves. Ensuite, elles fabriquent la cire et construisent les rayons. Certaines montent la garde à l'entrée de la ruche pour repousser les intruses. Ce n'est qu'à la fin de leur courte vie qu'elles deviennent butineuses. Elles parcourent alors parfois plusieurs kilomètres pour récolter le nectar et le pollen des fleurs. Lorsqu'une butineuse découvre un champ fleuri, elle revient à la ruche et exécute une danse. Par ses mouvements, elle indique aux autres la direction et la distance de la nourriture. Le nectar rapporté est transformé en miel, qui servira de réserve pendant l'hiver. En passant de fleur en fleur, les abeilles transportent aussi le pollen : elles permettent ainsi aux plantes de produire des fruits et des graines. Sans elles, de nombreux fruits et légumes deviendraient rares. C'est pourquoi il est important de protéger ces insectes, en semant des fleurs et en évitant les pesticides."),
  T("cm2-bouteille", "CM2", "Le message dans la bouteille",
    "Ce matin-là, la marée avait laissé sur la plage une ligne d'algues, de bois flotté et de coquillages brisés. Elias longeait le rivage avec son chien lorsqu'un reflet attira son attention. À moitié enfouie dans le sable, une bouteille de verre vert brillait au soleil. Il la dégagea avec précaution et constata qu'un rouleau de papier était glissé à l'intérieur. Le bouchon, recouvert de cire, résista longtemps. Lorsqu'il parvint enfin à l'ôter, Elias déroula une feuille jaunie, couverte d'une écriture fine et penchée. Le message était rédigé en anglais. Elias reconnut quelques mots, mais il ne comprit pas tout. De retour à la maison, il demanda de l'aide à sa grande sœur, qui étudiait les langues au lycée. Ensemble, ils déchiffrèrent le texte. Une certaine Emily, âgée de douze ans, l'avait jeté à la mer depuis un ferry qui reliait l'Irlande à la France. Elle racontait qu'elle partait vivre dans un nouveau pays et qu'elle aimerait avoir un ami qui lui répondrait. En bas de la feuille figuraient une date, vieille de presque trois ans, et l'adresse d'une école. Elias hésita : Emily se souviendrait-elle encore de ce message ? Sa sœur l'encouragea à tenter sa chance. Le soir même, il rédigea une longue lettre, en mélangeant le français et les quelques phrases d'anglais qu'il connaissait. Il y joignit une photographie de la plage et un dessin de la bouteille. Plusieurs semaines passèrent sans nouvelles, et Elias finit par oublier sa lettre. Puis, un samedi, le facteur déposa une enveloppe couverte de timbres colorés. Emily avait répondu."),
  T("cm2-volcans", "CM2", "Les volcans",
    "Sous nos pieds, à plusieurs dizaines de kilomètres de profondeur, la température est si élevée que certaines roches fondent. Elles forment alors le magma, une matière brûlante, plus légère que les roches qui l'entourent. Le magma remonte lentement et s'accumule dans une poche appelée chambre magmatique. Lorsque la pression devient trop forte, il s'échappe vers la surface par une cheminée : c'est l'éruption. Une fois sorti du volcan, le magma prend le nom de lave. Tous les volcans ne se comportent pas de la même manière. Certains produisent une lave très fluide, qui s'écoule en longues coulées et peut parcourir plusieurs kilomètres. Ces éruptions, dites effusives, sont spectaculaires mais rarement meurtrières, car on a le temps de s'éloigner des coulées. D'autres volcans libèrent une lave épaisse, chargée de gaz, qui bouche la cheminée. La pression augmente jusqu'à ce que tout explose. Ces éruptions explosives projettent des cendres, des blocs de roche et des nuages de gaz brûlants qui dévalent les pentes à grande vitesse. Elles sont beaucoup plus dangereuses pour les populations. En France, la chaîne des Puys, en Auvergne, rassemble environ quatre-vingts volcans, endormis depuis plusieurs milliers d'années. Sur l'île de La Réunion, en revanche, le piton de la Fournaise entre très souvent en éruption. Des scientifiques, les volcanologues, le surveillent en permanence. Grâce à des capteurs, ils mesurent les petits tremblements de terre et la déformation du sol, ce qui leur permet souvent d'annoncer une éruption quelques heures ou quelques jours à l'avance."),
];

// LISTES DE MOTS (fluence de mots isolés) : listes rédigées pour BagaSchool, à relire.
// Trois sortes par niveau : mots fréquents, mots réguliers à décoder (ou syllabes en CP), mots inventés
// (sans signification, pour vérifier le décodage sans deviner). Pas de repère officiel intégré :
// les repères ci-dessus portent sur la lecture d'un texte.
const L = (id, niv, titre, mots) => ({ id, niv, titre, texte: mots.trim().split(/\s+/).join(" "), liste: true });
export const LISTES = [
  L("cp-syll", "CP", "Syllabes", `
    ma lo ri pu fé ta mi so lu ra ne po fi vo du sa li mo ré nu pa to la mu si ro vi ju ba de
    ca no ti lé ru fo va mé bi go ou on an in oi chu cho chi mou lon pin moi ban fon tou ral
    bra tri plo cla gru fla vre dra pli cro blé gla fri tro clo bro pré flo tra glu`),
  L("cp-freq", "CP", "Mots fréquents", `
    le la les un une et il elle est a de du dans sur avec pour mais ou on je tu nous vous ils
    mon ton son ma ta sa qui que pas ne au en papa maman ami école chat chien maison rue lit
    moto vélo porte table livre jour nuit petit grand beau joli rouge vert bleu noir blanc
    aller voir faire dire venir jouer manger lire courir sauter dormir rire matin soir eau lune soleil`),
  L("cp-reg", "CP", "Mots à décoder", `
    ami mur lama moto vélo tomate salade banane domino pirate robot tulipe cabane farine limace
    numéro otarie pyjama radis savon tapis lavabo canapé parole minute malade poli fumée pile rame
    lune mine dune sirop bidon mouton lapin chaton garage melon jupe four roue loup poule soupe
    route bouche moulin sapin matin dindon ballon pantalon maman lundi samedi vache niche chemise
    roi noix voiture poire étoile fleur sucre arbre livre zèbre`),
  L("cp-inv", "CP", "Mots inventés", `
    ra lo mi pu tafi lopu sima rilo pume fano tiva dura mipo lasi nuro bami
    pouli tonra chami lanpo moufi vinto rouba pila tirou fonsa chalu mitou
    brami glota triva plomi crafu dribo flami gripu`),
  L("ce1-freq", "CE1", "Mots fréquents", `
    toujours beaucoup maintenant ensuite pendant après avant encore aussi très trop peu bien mal
    chez sans sous vers depuis comme quand alors enfin déjà jamais souvent rien tout chaque autre
    même premier dernier heure année semaine enfant famille classe maître élève cahier crayon jardin
    arbre fleur oiseau cheval voiture train ville pays monde temps chose main tête yeux fenêtre
    histoire question réponse prendre mettre donner trouver penser regarder parler écrire partir
    arriver ouvrir savoir pouvoir vouloir devoir`),
  L("ce1-reg", "CE1", "Mots à décoder", `
    poisson maison cheveux grenouille champignon citrouille escargot feuille soleil abeille crayon
    éléphant girafe guitare bouteille fourmi coussin papillon chaussure journal chocolat bonbon
    ballon gâteau château bateau cadeau oiseau peinture tambour couteau fromage nuage plage orange
    genou cerise glace ciseaux pingouin écureuil lunettes trompette tortue renard hibou dauphin
    baleine requin cartable trousse gomme tableau récréation cantine piscine cuisine bougie
    mouchoir parapluie montagne grenier poignée chemin cheminée`),
  L("ce1-inv", "CE1", "Mots inventés", `
    ralo tipu mabou fital poune chalin grato blinou vardi tosta lirpe mouda sapir bounal frila
    gonvé prilo nirta choupe valti drimon flouse garpi toubin vrata clémou bisto mirchal ponfu
    graduche latoir spipa bourin trovel glimpe chandou fripal voumi tagnon`),
  L("ce2-freq", "CE2", "Mots fréquents", `
    cependant pourtant plusieurs quelquefois autour ensemble longtemps aujourd'hui demain hier
    lorsque puisque environ presque seulement vraiment soudain bientôt dehors dessous dessus devant
    derrière loin près bonheur voyage village montagne rivière campagne forêt animal travail nature
    silence lumière couleur chiffre nombre problème exercice expérience découvrir construire
    apprendre comprendre expliquer raconter préparer chercher choisir répondre attendre entendre
    devenir connaître paraître certain différent important difficile facile rapide immense
    ancien heureux curieux sérieux`),
  L("ce2-reg", "CE2", "Mots à décoder", `
    parapluie hélicoptère dinosaure crocodile kangourou bibliothèque ordinateur magnifique
    gymnastique pharmacie téléphone aquarium escalier ascenseur champion incroyable invisible
    imprimante explosion squelette astronaute chevalier sorcière dragon princesse grenouille
    araignée coccinelle sauterelle hérisson écureuil chauve-souris perroquet chimpanzé
    hippopotame rhinocéros toboggan boulangerie quincaillerie anniversaire gentillesse
    tranquille spectacle orchestre trompette violoncelle batterie accordéon automne printemps`),
  L("ce2-inv", "CE2", "Mots inventés", `
    grintoufle plavonade chabrique trimbalor vousquette brandinal folipreau spartoche
    cramoulin glistane tropavier quinoral blandeuse chourgnon priscoter vagnelou
    fretaille moustival grabinon plindoche tarsuvin cloumaire stribole nangrefou
    balquinette froudimer goustrale prunevaille tramoulin bristoche flanquemir
    vourdanel glimbaton crapisol moustrel plavigne drouscalet fringotte`),
  L("cm1-freq", "CM1", "Mots fréquents", `
    néanmoins davantage autrefois désormais aussitôt tellement parfois également notamment
    pareillement quoique tandis jusque malgré parmi auprès selon afin ailleurs autant
    surtout plutôt vraisemblablement immédiatement brusquement lentement doucement
    entièrement habitant population gouvernement territoire paysage frontière continent
    océan atmosphère température énergie mouvement circulation phénomène événement
    souvenir aventure mystère courage danger victoire raisonnement conclusion hypothèse
    observer mesurer comparer calculer résoudre vérifier transformer produire recevoir
    apercevoir poursuivre disparaître reconnaître obtenir maintenir appartenir convaincre`),
  L("cm1-reg", "CM1", "Mots longs", `
    extraordinaire électricité géographie mathématiques photographie thermomètre
    microscope télescope parallèle perpendiculaire rectangle quadrilatère multiplication
    soustraction division numérateur dénominateur kilomètre millilitre hectolitre
    archéologue préhistoire chevalerie monastère cathédrale explorateur navigateur
    caravelle ambassadeur parlement république démocratie constitution révolution
    chrysalide métamorphose photosynthèse respiration digestion squelette articulation
    vertébré invertébré mammifère amphibien carnivore herbivore omnivore`),
  L("cm1-inv", "CM1", "Mots inventés", `
    strombalique perfoustaire glandivoreux cratimondel bourliquette scaparniste
    fralimbodre quintaloche vroustigneur plinchaveau dramouvelle estrapignon
    crivolante moustrabaque gloufernier pratimoulade sclendrival bourtifaille
    grumolin tasprignon floubertal vandrique scolimar bruntiche placouvin dremousset
    trinquelor spavigne cloutarel mirdouche frangolin vrastimel bouscadin gluperon`),
  L("cm2-freq", "CM2", "Mots fréquents", `
    conséquence circonstance connaissance indépendance responsabilité solidarité citoyenneté
    environnement développement fonctionnement raisonnement comportement établissement
    nécessaire indispensable remarquable considérable exceptionnel particulier progressivement
    régulièrement fréquemment suffisamment évidemment apparemment récemment patiemment
    accomplir approfondir établir entreprendre interrompre apparaître abandonner accompagner
    s'efforcer s'apercevoir distinguer interpréter argumenter justifier démontrer
    paragraphe vocabulaire orthographe conjugaison ponctuation proposition complément
    adjectif adverbe préposition subordonnée imparfait conditionnel subjonctif`),
  L("cm2-reg", "CM2", "Mots longs", `
    anticonstitutionnel météorologique hydroélectrique biodiversité agriculture
    industrialisation urbanisation mondialisation décentralisation intercommunalité
    département préfecture municipalité arrondissement Méditerranée hémisphère
    équateur latitude longitude cartographie volcanologue sismographe magnétisme
    gravitation astronomie constellation chronologie Renaissance imprimerie absolutisme
    colonisation climatologie scientifique ornithologue entomologiste paléontologue
    proportionnalité pourcentage périmètre circonférence hexagone parallélépipède
    pentagone symétrique équilatéral isocèle`),
  L("cm2-inv", "CM2", "Mots inventés", `
    anticrapoulesque désembriolation cramouflaticule hydrobalvinesque strapontivore
    gribouillandesque météorisquelin plafondrimage congruliforme décabristoquet
    mirlifloquette entrequimbalade translavigneur ombrocapiteux sporadivulgue
    scrampinoir grélusquet fromantiche drapuscule plintovère crasmolin bouvrignac
    estramblin quarnedouce tifloubert sprangolin chuvrequet glandormisse vustrapol
    frenquilade brumascol trapiloche sclarmitaine poudrevingue clastrumel`),
];
