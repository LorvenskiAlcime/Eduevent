# EduEvent — Plateforme des événements de votre campus

Projet de fin de session — Licence 3 Développement Web (HTML5 · CSS3 · JavaScript)
Faculté des Sciences et de Génie (FSG) — Département Informatique
Année académique 2025–2026, Session I

## 1. Présentation

EduEvent est une plateforme web permettant à la communauté universitaire (étudiants,
professeurs, administration) de consulter, rechercher et s'inscrire aux événements
organisés sur le campus : conférences, ateliers, compétitions sportives, activités
culturelles et soutenances.

Le projet est développé entièrement en **HTML5, CSS3 et JavaScript natif (vanilla)**,
sans aucun framework ni librairie externe, conformément aux exigences du cours.

## 2. realisateur

| Nom | Rôle |
|---|---|
| Lorvensky ALCIME | Développement complet du projet Rôle — design, contenu, tests, documentation...|


## 3. Structure du projet

```
EduEvent/
├── index.html              Page d'accueil
├── evenements.html         Liste et recherche des événements
├── detail.html             Détail d'un événement + inscription
├── profil.html             Espace étudiant (connexion, profil, inscriptions)
├── a-propos.html           Présentation, realisateur, contact, FAQ
├── README.md                Ce fichier
│
├── css/
│   ├── style.css            Design system, reset, composants partagés
│   ├── responsive.css       Media queries (1024px, 768px, 420px)
│   └── animations.css       Transitions et keyframes
│
├── js/
│   ├── main.js              Script global : nav mobile, chargement des
│   │                         événements (fetch JSON), création des cartes,
│   │                         stats animées, newsletter, contact, FAQ
│   ├── evenements.js        Recherche, filtres, tri, pagination, vue grille/liste
│   ├── detail.js            Affichage événement, inscription, commentaires, partage
│   └── profil.js            Connexion/inscription, profil, localStorage
│
├── images/
│   ├── Logo.png             image logo chcl
│   ├── hero-bg.jpg          image audito chcl
    └── events/              Visuels générés pour chaque événement 
│
└── data/
    └── evenements.json       Données des 12 événements (source unique)
```

## 4. Pages et fonctionnalités

### Accueil (`index.html`)
En-tête sticky avec navigation et bouton de connexion, section héro avec
visuel animé, 4 événements à la une (chargés dynamiquement depuis le JSON),
statistiques animées au défilement (effet compteur), formulaire newsletter
avec validation, pied de page complet.

### Liste des événements (`evenements.html`)
Recherche en temps réel (titre, description, lieu), filtres combinables par
catégorie et par date (aujourd'hui / cette semaine / ce mois), bascule entre
vue grille et vue liste, pagination par chargement progressif (« Charger
plus »), réinitialisation des filtres, lecture du paramètre `?categorie=`
dans l'URL (utilisé par les liens du pied de page et de l'accueil).

### Détail d'un événement (`detail.html`)
Bannière, description complète, informations (date, heure, lieu,
organisateur), compteur de places restantes avec barre de progression,
formulaire d'inscription avec validation (désactivé si l'événement est
complet), témoignages avec formulaire d'ajout, partage sur les réseaux
sociaux (Facebook, X, WhatsApp, email), bouton retour à la liste.
La page se base sur le paramètre `?id=` dans l'URL.

### Espace étudiant (`profil.html`)
Connexion et création de compte avec validation complète, profil étudiant
(nom, photo, faculté, programme, niveau, année), liste des événements
inscrits avec possibilité d'annulation. Les comptes et inscriptions sont
persistés via `localStorage` (pas de backend pour ce projet académique).

**Compte de démonstration** (pré-rempli automatiquement au premier
chargement) :
- Email : `etudiant@universite.edu`
- Mot de passe : `campus2026`

### À propos (`a-propos.html`)
Présentation de la plateforme, présentation de l'équipe, formulaire de
contact avec validation, carte stylisée du campus (simulée en CSS, sans
dépendance à un service externe), FAQ en accordéon.

## 5. Choix techniques

- **Aucune dépendance externe au chargement** : les visuels d'événements et
  l'avatar de démonstration sont des SVG générés localement, afin que le
  projet fonctionne même sans connexion internet stable (utile en
  soutenance). Seules les polices (Google Fonts) sont chargées à distance,
  avec un repli automatique vers les polices système si indisponibles.
- **Données centralisées** : un seul fichier `data/evenements.json` alimente
  l'accueil, la liste et le détail, via la fonction partagée
  `chargerEvenements()` dans `main.js`.
- **Réutilisation du code** : les fonctions communes (chargement JSON,
  création de carte événement, formatage de date, affichage d'erreur de
  formulaire) sont centralisées dans `main.js` et réutilisées par les
  scripts des autres pages plutôt que dupliquées.
- **Persistance locale** : `localStorage` est utilisé uniquement sur
  `profil.html` pour simuler un compte utilisateur et ses inscriptions, en
  l'absence de backend.
- **Accessibilité** : attributs `aria-*` sur les composants interactifs
  (accordéon, menu mobile, toggle de vue, pastilles de notation), états de
  focus visibles, attribut `[hidden]` garanti par une règle CSS globale.

## 6. Système de design

- **Couleurs** : encre `#1B1B1F`, blanc cassé `#FAFAF7`, corail `#FF5A36`,
  bleu nuit `#1E3A5F`, ambre `#FFC94D`.
- **Typographies** : Space Grotesk (titres), Inter (texte courant),
  JetBrains Mono (dates, données, badges).
- **Motif signature** : les événements sont présentés sous forme de
  « tickets » avec un talon perforé, rappelant un billet d'entrée physique.

## 7. Lancer le projet en local

Le chargement du fichier `data/evenements.json` via `fetch()` nécessite un
serveur local (ouvrir directement les fichiers `.html` avec `file://`
bloque cette requête dans la plupart des navigateurs).

**Avec Python (déjà installé sur la plupart des systèmes) :**
```bash
cd EduEvent
python3 -m http.server 8080
```
Puis ouvrir `http://localhost:8080/index.html` dans le navigateur.

**Avec VS Code :** utiliser l'extension *Live Server* et faire un clic droit
sur `index.html` → « Open with Live Server ».

## 8. Navigateurs testés

Le site a été testé et validé sur Chromium (desktop et viewport mobile
390px), en vérifiant l'absence d'erreurs JavaScript en console et le bon
fonctionnement de chaque formulaire, filtre et interaction.
