/*
   EduEvent — profil.js
   Logique de la page profil.html : connexion / inscription, profil étudiant,
   liste des événements inscrits, annulation d'inscription.
   Persistance via localStorage (pas de backend pour ce projet académique).
   Dépend des utilitaires partagés définis dans main.js.
    */

const CLES_STOCKAGE = {
  utilisateur: 'eduevent_utilisateur',
  inscriptions: 'eduevent_inscriptions',
  comptes: 'eduevent_comptes',
};

// Compte de démonstration, créé automatiquement au premier chargement
// s'il n'existe pas déjà, pour que la page soit testable immédiatement.
const COMPTE_DEMO = {
  email: 'etudiant@universite.edu',
  motDePasse: 'campus2026',
  nom: 'ALCIME Lorvenski',
  faculte: 'Informatique',
  niveau: 'Licence 3',
  annee: '2025 – 2026',
  photo: 'images/avatar-default.jpg',
};

const INSCRIPTIONS_DEMO = [1, 3, 4];

document.addEventListener('DOMContentLoaded', async () => {
  initialiserComptesDemo();
  initOngletsAuth();
  initFormulaireConnexion();
  initFormulaireInscriptionCompte();
  initDeconnexion();

  await afficherSelonEtatConnexion();
});

/* --------------------------------------------------------------------------
   Initialisation du compte de démonstration (une seule fois)
   -------------------------------------------------------------------------- */
function initialiserComptesDemo() {
  const comptesExistants = lireJSON(CLES_STOCKAGE.comptes, null);
  if (comptesExistants === null) {
    localStorage.setItem(CLES_STOCKAGE.comptes, JSON.stringify([COMPTE_DEMO]));
  }
}

/* --------------------------------------------------------------------------
   Utilitaires localStorage
   -------------------------------------------------------------------------- */
function lireJSON(cle, valeurParDefaut) {
  try {
    const valeur = localStorage.getItem(cle);
    return valeur === null ? valeurParDefaut : JSON.parse(valeur);
  } catch (erreur) {
    console.error(`Erreur de lecture localStorage (${cle}) :`, erreur);
    return valeurParDefaut;
  }
}

function ecrireJSON(cle, valeur) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch (erreur) {
    console.error(`Erreur d'écriture localStorage (${cle}) :`, erreur);
  }
}

/* --------------------------------------------------------------------------
   Bascule entre les onglets Connexion / Inscription
   -------------------------------------------------------------------------- */
function initOngletsAuth() {
  const ongletConnexion = document.getElementById('tabLogin');
  const ongletInscription = document.getElementById('tabSignup');
  const formConnexion = document.getElementById('loginForm');
  const formInscription = document.getElementById('signupForm');

  ongletConnexion.addEventListener('click', () => {
    ongletConnexion.classList.add('is-active');
    ongletInscription.classList.remove('is-active');
    ongletConnexion.setAttribute('aria-selected', 'true');
    ongletInscription.setAttribute('aria-selected', 'false');
    formConnexion.hidden = false;
    formInscription.hidden = true;
  });

  ongletInscription.addEventListener('click', () => {
    ongletInscription.classList.add('is-active');
    ongletConnexion.classList.remove('is-active');
    ongletInscription.setAttribute('aria-selected', 'true');
    ongletConnexion.setAttribute('aria-selected', 'false');
    formInscription.hidden = false;
    formConnexion.hidden = true;
  });
}

/* --------------------------------------------------------------------------
   Formulaire de connexion
   -------------------------------------------------------------------------- */
function initFormulaireConnexion() {
  const formulaire = document.getElementById('loginForm');

  const champEmail = document.getElementById('loginEmail');
  const groupeEmail = document.getElementById('loginEmailGroup');
  const erreurEmail = document.getElementById('loginEmailError');

  const champMotDePasse = document.getElementById('loginPassword');
  const groupeMotDePasse = document.getElementById('loginPasswordGroup');
  const erreurMotDePasse = document.getElementById('loginPasswordError');

  formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    let valide = true;

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (champEmail.value.trim() === '') {
      afficherErreur(groupeEmail, erreurEmail, "L'adresse email est requise.");
      valide = false;
    } else if (!regexEmail.test(champEmail.value.trim())) {
      afficherErreur(groupeEmail, erreurEmail, 'Adresse email invalide.');
      valide = false;
    } else {
      masquerErreur(groupeEmail, erreurEmail);
    }

    if (champMotDePasse.value === '') {
      afficherErreur(groupeMotDePasse, erreurMotDePasse, 'Le mot de passe est requis.');
      valide = false;
    } else {
      masquerErreur(groupeMotDePasse, erreurMotDePasse);
    }

    if (!valide) return;

    const comptes = lireJSON(CLES_STOCKAGE.comptes, []);
    const compteTrouve = comptes.find(
      (c) => c.email.toLowerCase() === champEmail.value.trim().toLowerCase() && c.motDePasse === champMotDePasse.value
    );

    if (!compteTrouve) {
      afficherErreur(groupeMotDePasse, erreurMotDePasse, 'Email ou mot de passe incorrect.');
      return;
    }

    connecterUtilisateur(compteTrouve);
  });
}

/* --------------------------------------------------------------------------
   Formulaire d'inscription (création de compte)
   -------------------------------------------------------------------------- */
function initFormulaireInscriptionCompte() {
  const formulaire = document.getElementById('signupForm');

  const champNom = document.getElementById('signupName');
  const groupeNom = document.getElementById('signupNameGroup');
  const erreurNom = document.getElementById('signupNameError');

  const champEmail = document.getElementById('signupEmail');
  const groupeEmail = document.getElementById('signupEmailGroup');
  const erreurEmail = document.getElementById('signupEmailError');

  const champFaculte = document.getElementById('signupFaculty');
  const groupeFaculte = document.getElementById('signupFacultyGroup');
  const erreurFaculte = document.getElementById('signupFacultyError');

  const champNiveau = document.getElementById('signupLevel');

  const champMotDePasse = document.getElementById('signupPassword');
  const groupeMotDePasse = document.getElementById('signupPasswordGroup');
  const erreurMotDePasse = document.getElementById('signupPasswordError');

  const champConfirmation = document.getElementById('signupConfirm');
  const groupeConfirmation = document.getElementById('signupConfirmGroup');
  const erreurConfirmation = document.getElementById('signupConfirmError');

  formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    let valide = true;

    if (champNom.value.trim() === '') {
      afficherErreur(groupeNom, erreurNom, 'Le nom est requis.');
      valide = false;
    } else {
      masquerErreur(groupeNom, erreurNom);
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const comptes = lireJSON(CLES_STOCKAGE.comptes, []);
    const emailDejaUtilise = comptes.some((c) => c.email.toLowerCase() === champEmail.value.trim().toLowerCase());

    if (champEmail.value.trim() === '') {
      afficherErreur(groupeEmail, erreurEmail, "L'adresse email est requise.");
      valide = false;
    } else if (!regexEmail.test(champEmail.value.trim())) {
      afficherErreur(groupeEmail, erreurEmail, 'Adresse email invalide.');
      valide = false;
    } else if (emailDejaUtilise) {
      afficherErreur(groupeEmail, erreurEmail, 'Un compte existe déjà avec cet email.');
      valide = false;
    } else {
      masquerErreur(groupeEmail, erreurEmail);
    }

    if (champFaculte.value.trim() === '') {
      afficherErreur(groupeFaculte, erreurFaculte, 'La faculté est requise.');
      valide = false;
    } else {
      masquerErreur(groupeFaculte, erreurFaculte);
    }

    if (champMotDePasse.value.length < 8) {
      afficherErreur(groupeMotDePasse, erreurMotDePasse, 'Le mot de passe doit contenir au moins 8 caractères.');
      valide = false;
    } else {
      masquerErreur(groupeMotDePasse, erreurMotDePasse);
    }

    if (champConfirmation.value !== champMotDePasse.value || champConfirmation.value === '') {
      afficherErreur(groupeConfirmation, erreurConfirmation, 'Les mots de passe ne correspondent pas.');
      valide = false;
    } else {
      masquerErreur(groupeConfirmation, erreurConfirmation);
    }

    if (!valide) return;

    const nouveauCompte = {
      email: champEmail.value.trim(),
      motDePasse: champMotDePasse.value,
      nom: champNom.value.trim(),
      faculte: champFaculte.value.trim(),
      niveau: champNiveau.value,
      annee: '2025 – 2026',
      photo: 'images/avatar-default.jpg',
    };

    comptes.push(nouveauCompte);
    ecrireJSON(CLES_STOCKAGE.comptes, comptes);
    ecrireJSON(CLES_STOCKAGE.inscriptions, []); // nouveau compte = aucune inscription

    connecterUtilisateur(nouveauCompte);
  });
}

/* --------------------------------------------------------------------------
   Connexion / déconnexion
   -------------------------------------------------------------------------- */
function connecterUtilisateur(compte) {
  ecrireJSON(CLES_STOCKAGE.utilisateur, compte);

  // Si c'est le compte démo et qu'aucune inscription n'existe encore, on les pré-remplit
  if (compte.email === COMPTE_DEMO.email && lireJSON(CLES_STOCKAGE.inscriptions, null) === null) {
    ecrireJSON(CLES_STOCKAGE.inscriptions, INSCRIPTIONS_DEMO);
  }

  afficherSelonEtatConnexion();
}

function initDeconnexion() {
  const boutonDeconnexion = document.getElementById('logoutBtn');
  boutonDeconnexion.addEventListener('click', () => {
    localStorage.removeItem(CLES_STOCKAGE.utilisateur);
    afficherSelonEtatConnexion();
  });
}

/* --------------------------------------------------------------------------
   Affichage conditionnel : formulaire d'auth OU profil + inscriptions
   -------------------------------------------------------------------------- */
async function afficherSelonEtatConnexion() {
  const utilisateur = lireJSON(CLES_STOCKAGE.utilisateur, null);
  const sectionAuth = document.getElementById('authSection');
  const sectionProfil = document.getElementById('profileSection');
  const lienNavProfil = document.getElementById('navProfilLink');

  if (!utilisateur) {
    sectionAuth.hidden = false;
    sectionProfil.hidden = true;
    lienNavProfil.textContent = 'Connexion';
    return;
  }

  sectionAuth.hidden = true;
  sectionProfil.hidden = false;
  lienNavProfil.textContent = utilisateur.nom.split(' ')[0];

  remplirCarteProfil(utilisateur);
  await afficherMesEvenements();
}

function remplirCarteProfil(utilisateur) {
  document.getElementById('profilePhoto').src = utilisateur.photo || "images/events/Lorvensky.jpg";
  document.getElementById('profileName').textContent = utilisateur.nom;
  document.getElementById('profileEmail').textContent = utilisateur.email;
  document.getElementById('profileFaculty').textContent = utilisateur.faculte;
  document.getElementById('profileLevel').textContent = utilisateur.niveau;
  document.getElementById('profileYear').textContent = utilisateur.annee;
}

/* --------------------------------------------------------------------------
   Mes événements inscrits
   -------------------------------------------------------------------------- */
async function afficherMesEvenements() {
  const conteneur = document.getElementById('myEventsList');
  const messageAucune = document.getElementById('noRegistrationsMessage');

  const idsInscrits = lireJSON(CLES_STOCKAGE.inscriptions, []);
  const tousLesEvenements = await chargerEvenements();
  const evenementsInscrits = tousLesEvenements.filter((evt) => idsInscrits.includes(evt.id));

  if (evenementsInscrits.length === 0) {
    conteneur.innerHTML = '';
    messageAucune.hidden = false;
    return;
  }

  messageAucune.hidden = true;
  evenementsInscrits.sort((a, b) => new Date(a.date) - new Date(b.date));
  conteneur.innerHTML = evenementsInscrits.map(creerLigneMonEvenement).join('');

  conteneur.querySelectorAll('.btn-cancel').forEach((bouton) => {
    bouton.addEventListener('click', () => annulerInscription(parseInt(bouton.dataset.id, 10)));
  });
}

function creerLigneMonEvenement(evt) {
  return `
    <article class="my-event-item">
      <img class="my-event-thumb" src="${evt.image}" alt="${evt.titre}"
           onerror="this.style.display='none'">
      <div class="my-event-info">
        <span class="my-event-category">${evt.categorieLabel}</span>
        <h3 class="my-event-title">${evt.titre}</h3>
        <p class="my-event-meta">📅 ${formaterDate(evt.date)} · 📍 ${evt.lieu}</p>
      </div>
      <div class="my-event-actions">
        <a href="detail.html?id=${evt.id}" class="btn btn-secondary btn-sm">Voir</a>
        <button type="button" class="btn-cancel" data-id="${evt.id}">Annuler</button>
      </div>
    </article>
  `;
}

function annulerInscription(idEvenement) {
  const confirmation = window.confirm("Confirmer l'annulation de ton inscription à cet événement ?");
  if (!confirmation) return;

  const idsInscrits = lireJSON(CLES_STOCKAGE.inscriptions, []);
  const nouvellesInscriptions = idsInscrits.filter((id) => id !== idEvenement);
  ecrireJSON(CLES_STOCKAGE.inscriptions, nouvellesInscriptions);

  afficherMesEvenements();
}
