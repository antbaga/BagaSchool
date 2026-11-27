# BagaSchool : plan du prototype

## Objectif
Un outil de préparation de classe pour professeur·es des écoles (cycles 1 à 3) :
emploi du temps, programmations / progressions, fiches de préparation, évaluations
avec insertion des compétences des programmes officiels sans les retaper.
Utilisable sur téléphone et sur PC, mis à jour par un simple `git push`.

## Architecture (prototype)
- **PWA statique** : HTML + CSS + JavaScript (modules ES), aucune étape de build, aucune dépendance.
- **Hébergement** : GitHub Pages sur la branche `main`. Un push = mise à jour pour l'utilisatrice
  au prochain chargement (service worker « réseau d'abord »).
- **Données** : IndexedDB dans le navigateur, sur l'appareil uniquement. Pas de serveur, pas de compte.
  Passage téléphone ↔ PC et sauvegarde : export / import d'un fichier JSON (Réglages).
- **Installable** : manifest + service worker → « Ajouter à l'écran d'accueil » sur mobile, « Installer » sur Chrome/Edge PC. Fonctionne hors ligne une fois chargé.
- **Référentiel de compétences** : `js/competences.js`, une liste plate (id stable, cycle, niveau,
  discipline, domaine, sous-domaine, texte, source). Les fiches et évaluations stockent les `id`.

Fichiers :
```
index.html            coquille + navigation
css/app.css           styles (responsive + impression)
js/app.js             vues et routeur (#/edt, #/fiches/<id>…)
js/db.js              accès IndexedDB
js/competences.js     référentiel (extrait)
sw.js                 cache hors ligne
manifest.webmanifest  installation PWA
```

## Périmètre du prototype (fait)
- Emploi du temps hebdomadaire (jours au choix, créneaux colorés), imprimable.
- Programmations par discipline/niveau sur 5 périodes ; séquences avec compétences visées ;
  progression = séances ordonnées ; « Créer la fiche » depuis une séance (pré-remplie).
- Fiches de préparation : objectif, compétences, matériel, déroulement par phases, différenciation,
  bilan ; duplication ; impression / PDF via le navigateur.
- Évaluations : items issus du référentiel ou libres ; feuille élève imprimable (cases NA/PA/A/D) ;
  saisie des résultats par élève (touche pour changer le niveau) et total « Atteint ou + ».
- Liste d'élèves (prénoms), données d'exemple, export / import / effacement.
- **v0.2** : accueil « Aujourd'hui » (créneaux du jour, accès rapides), barre d'onglets sur mobile,
  interface pastel arrondie. Boîte à outils « En classe » (à projeter ou sur téléphone) : minuteur,
  tirage au sort, groupes, niveaux de voix, feu tricolore, date du jour, dés, calcul mental, horloge,
  cadre de dix, droite graduée, barres de fractions, pendu, ardoise (uni / carreaux / Seyès).
  Inspirée d'un post Instagram montrant ce type d'outils ; design et code originaux.
- **v0.8** (alpha fermée) : comptes Supabase (projet en UE) avec e-mail + mot de passe ; inscription seulement avec un code
  d'invitation (contrôlé par la base) ; le premier compte devient administrateur ; page Administration (créer / révoquer des
  codes, liens d'invitation, liste des comptes, mot de passe provisoire, avis reçus) ; bouton « Donner mon avis » ;
  synchronisation par compte des données de préparation uniquement (élèves, évaluations, appel restent sur l'appareil, et la
  base les refuse) ; l'app reste utilisable sans compte et les données locales sont fusionnées dans le compte à la connexion ;
  QR code pour connecter le téléphone (e-mail prérempli) ; télécommande via le canal temps réel privé du compte ; message
  « nouvelle version » quand une mise à jour est publiée. Le relais Cloudflare (v0.6) est supprimé. Schéma : supabase/setup.sql.
- **v0.7** (retours de la prof) : bandeau d'installation à l'ouverture du lien (bouton sur Chrome / Edge / Android,
  tuto Safari sur iPhone) et page « Installer et projeter » ; emploi du temps aux horaires libres (durées 15 à 120 min) ;
  fiche de prép : période, séquence, n° et type de séance (dont investigation, expérimentation), critères de réussite
  et de réalisation, 3 nouveaux modèles ; devoirs par jour (projetables) ; suivi de la classe par discipline
  (dernier résultat par compétence). Outils au tableau : cahier (Seyès / petits carreaux / blanc, cursive alignée sur
  les lignes, stylo), calcul posé (4 opérations, retenues, potence), fractions en images (pizza, tablette, bande :
  représenter, comparer, égalités), étiquettes à déplacer (phrases à trous, mots à remettre en ordre), géométrie
  (règle, équerre, rapporteur, compas, traits qui suivent la règle), rituels du matin (nombre du jour par niveau,
  enquête grammaticale nature / fonction, phrases à transformer), calcul mental par niveau CP à CM2, jeux d'anglais
  (12 thèmes, voix anglaise, flashcards, memory, morpion, What's missing?, Guess who?, mot au hasard ; images et son
  pour CP-CE2, mots écrits pour les CM). « Mes remplacements » : école de rattachement, écoles avec km, calendrier,
  jours et km par mois et par année, export tableur.
- **v0.6** : synchronisation entre appareils sans compte : appairage par QR code, relais Cloudflare (worker/)
  qui ne voit que des données chiffrées (AES-GCM, clé uniquement dans les appareils et le QR), fusion des
  modifications faites en même temps, file d'attente hors ligne. Mode télécommande : le téléphone affiche
  en grand les boutons de l'outil projeté, le tableau n'affiche que le contenu.
- **v0.5** : cahier journal (jour par jour, relié à l'EDT et aux fiches, impression jour / semaine) ;
  appel matin / après-midi (présent, absent, retard) + cantine, bilan mensuel ; calendrier scolaire 2026-2027
  par zone (périodes calculées, jours fériés, compte à rebours des vacances, dates dans les programmations) ;
  suivi par élève (bilan des évaluations par discipline, absences, observations) ; modèles de fiches
  (4 de base + les siens) et duplication d'une programmation d'une année sur l'autre ; sauvegarde
  automatique dans un fichier (Chrome / Edge sur ordinateur), bouton « Envoyer » (partage) sur téléphone,
  rappel si pas de sauvegarde depuis 7 jours ; référentiel élargi à 386 objectifs officiels (français C2 et C3,
  maths C2 CP et C3) + ajout de ses propres compétences par copier-coller ; jeux : flashcards, memory,
  mots mêlés, monnaie, défi des tables ; fiches : problèmes, dictée de nombres, fiche de lecture, mots mêlés.
- **v0.4** : apps « Découvrir » dans En classe : système solaire (orbites animées, comparaison des tailles à l'échelle),
  phases de la Lune, cycle de l'eau animé étape par étape, états de l'eau (particules + thermomètre),
  globe 3D à faire tourner (continents, océans, quiz), régions de France (chefs-lieux, quiz).
  Données : Natural Earth (domaine public) et IGN Admin Express (Licence Ouverte), simplifiées dans js/data/geo.js.
- **v0.3** : section « À imprimer », générateurs de fiches A4 (aperçu, nouvelle série, corrigé, impression / PDF) :
  calcul posé (code couleur u/d/c), calcul en ligne, lire l'heure, droite graduée, modèle d'écriture cursive
  sur Seyès (police Google « Playwrite FR Trad »), graphisme, tableaux de conjugaison vierges, étiquettes prénoms.

## Limites connues du prototype
- **Référentiel partiel** : 386 objectifs recopiés mot pour mot (français cycle 3 presque complet ; français cycle 2 :
  lecture + début de l'écriture CP ; maths cycle 2 : CP « nombres et calcul » seulement ; maths cycle 3 : nombres,
  calcul, problèmes, grandeurs). Rien pour le cycle 1 ni les autres disciplines. Les objectifs trop longs pour être
  vérifiés ont été omis. Références BO non vérifiées. Comblé en attendant par l'ajout manuel (Compétences > Ajouter).
- **Calendrier** : seule l'année 2026-2027 est intégrée (à ajouter chaque année). Toussaint, Noël, rentrée et
  début de l'été appliqués aux trois zones (cellules communes du tableau officiel).
- **Sauvegarde automatique** : seulement Chrome / Edge sur ordinateur (API File System Access). Ailleurs : export
  ou partage manuel.
- **Comptes / synchro** : demande le projet Supabase configuré (voir la notice) et ses clés publiques dans js/config.js.
  Les données de préparation sont stockées en clair dans la base (protégées par RLS, pas de chiffrement de bout en bout).
  Pas d'e-mails (confirmation, mot de passe oublié) tant qu'aucun serveur SMTP n'est branché : mot de passe provisoire via
  l'administration. Offre gratuite : projet mis en pause après 7 jours sans activité. Fusion : si le même champ est modifié
  sur deux appareils en même temps, la dernière version envoyée l'emporte.
- **Contenus des rituels et de l'anglais** : phrases, corpus grammatical et vocabulaire rédigés pour l'app (pas des
  textes officiels) ; à relire par la prof. La voix anglaise dépend de l'appareil (voix du système).
- **Remplacements** : les km sont saisis à la main ; aucun montant d'indemnité (ISSR, frais) n'est calculé.
- **Étiquettes** : les activités créées restent sur l'appareil (pas encore synchronisées).
- **Programmes 2026** : le référentiel contient les programmes de français et maths 2024-2025 (C2, C3) ; le cycle 1
  (programme 2026) et les autres disciplines restent à ajouter.
- Modifier la liste des compétences d'une évaluation remet sa grille de résultats à zéro.
- Safari iOS peut effacer les données d'un site non installé après une longue inactivité :
  conseiller d'**installer l'app sur l'écran d'accueil** et d'exporter régulièrement.
- Aucun test automatisé dans le dépôt (tests faits à la main avec Playwright, voir PR).

## Prochaines étapes (ordre proposé)
1. Retour de la prof sur le prototype (ce qui manque vraiment au quotidien).
2. Compléter le référentiel (cycle 1, CE1-CE2 maths, autres disciplines), à partir des textes du BO en vigueur
   (attention : programmes de français et maths renouvelés à partir de 2024-2025, d'autres disciplines
   encore sur les programmes 2015/2020). Garder une source par entrée.
3. Autres outils possibles : sondage ; carte de France,
   exercices de conjugaison avec correction automatique (demande un conjugueur fiable) ; liens vidéos par notion.
4. Export LSU / livret à partir du suivi élève.

## Si on passe aux abonnements payants : ce que ça implique
- **Comptes + synchronisation** : un backend devient nécessaire (ex. Supabase/Firebase ou API maison)
  pour l'authentification et la sync multi-appareils. Gérer les conflits hors ligne.
- **Paiement** : Stripe (abonnement mensuel/annuel, portail client, TVA UE via Stripe Tax), ou
  Paddle/Lemon Squeezy qui jouent le rôle de revendeur et gèrent la TVA à ta place.
  Une app installée depuis le Web évite la commission des stores ; passer par l'App Store / Play Store
  impose leurs systèmes de paiement.
- **RGPD** : dès qu'on stocke des données sur un serveur, on traite des données d'élèves (mineurs) :
  minimisation (prénoms seulement ou pseudonymes), hébergement UE, registre des traitements,
  politique de confidentialité, mentions légales, contrat de sous-traitance avec l'hébergeur,
  droit à l'export / suppression. Les écoles et l'Éducation nationale y sont attentives.
- **Juridique / commercial** : statut (micro-entreprise ok au départ), CGV/CGU, support client.
- **Contenu officiel** : les programmes sont des textes publics, mais le référentiel doit rester
  exact et à jour ; c'est un vrai travail de maintenance et un argument de vente.
- **Concurrence** : des outils payants existent déjà et sont très utilisés ; il faudra un angle
  (prix, simplicité, hors ligne, mobile) plutôt que la parité de fonctionnalités.
- Le dépôt public actuel ne convient plus si le code devient le produit payant : passer en privé
  (GitHub Pages privé = compte payant) ou héberger ailleurs (Netlify, Cloudflare Pages).
