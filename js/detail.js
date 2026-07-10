/* ==========================================================================
   EduEvent — detail.js
   Logique de la page detail.html : affichage de l'événement, inscription,
   compteur de places, commentaires, partage social.
   Dépend des utilitaires partagés définis dans main.js.
   ========================================================================== */

const ETAT_DETAIL = {
  evenement: null,
  commentaires: [],
};

// Témoignages de démonstration (données statiques, comme attendu pour ce projet académique)
const COMMENTAIRES_DEMO = {
  1: [
    { auteur: 'Alexandra M.', note: 5, texte: "Conférence passionnante, les intervenants étaient très clairs sur des sujets complexes." },
    { auteur: 'DICARMEL R.', note: 4, texte: "Très instructif, j'aurais aimé un peu plus de temps pour les questions." },
  ],
  3: [
    { auteur: 'MONESTIME O.', note: 5, texte: "Ambiance électrique, on sentait vraiment l'esprit inter-facultés !" },
  ],
  4: [
    { auteur: 'ADOLPHE L.', note: 5, texte: "Une des plus belles soirées du campus, super découverte culturelle." },
    { auteur: 'Naldika F.', note: 4, texte: "Très bonne organisation, juste un peu de monde pour la restauration." },
  ],
};

document.addEventListener('DOMContentLoaded', async () => {
  await chargerEtAfficherEvenement();
});

/* --------------------------------------------------------------------------
   Chargement de l'événement à partir du paramètre ?id= de l'URL
   -------------------------------------------------------------------------- */
async function chargerEtAfficherEvenement() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'), 10);

  const elementChargement = document.getElementById('detailLoading');
  const elementErreur = document.getElementById('detailError');
  const elementContenu = document.getElementById('detailContent');

  const evenements = await chargerEvenements();
  const evenement = evenements.find((e) => e.id === id);

  elementChargement.hidden = true;

  if (!evenement) {
    elementErreur.hidden = false;
    return;
  }

  ETAT_DETAIL.evenement = evenement;
  ETAT_DETAIL.commentaires = COMMENTAIRES_DEMO[evenement.id] || [];

  remplirContenuEvenement(evenement);
  afficherCommentaires();
  initFormulaireCommentaire();
  initFormulaireInscription(evenement);
  initLiensPartage(evenement);

  elementContenu.hidden = false;
  document.title = `${evenement.titre} — EduEvent`;
}

/* --------------------------------------------------------------------------
   Remplissage du contenu (bannière, description, infos, places)
   -------------------------------------------------------------------------- */
function remplirContenuEvenement(evt) {
  const banniere = document.getElementById('detailBannerImg');
  banniere.src = evt.image;
  banniere.alt = evt.titre;
  banniere.onerror = function () {
    this.style.display = 'none';
  };

  document.getElementById('detailCategorie').textContent = evt.categorieLabel;
  document.getElementById('detailTitre').textContent = evt.titre;
  document.getElementById('detailDescription').textContent = evt.description;
  document.getElementById('detailDate').textContent = formaterDate(evt.date);
  document.getElementById('detailHoraire').textContent = `${evt.heureDebut} – ${evt.heureFin}`;
  document.getElementById('detailLieu').textContent = evt.lieu;
  document.getElementById('detailOrganisateur').textContent = evt.organisateur;

  mettreAJourCompteurPlaces(evt);
}

/* --------------------------------------------------------------------------
   Compteur de places restantes (barre de progression)
   -------------------------------------------------------------------------- */
function mettreAJourCompteurPlaces(evt) {
  const barre = document.getElementById('placesFill');
  const texte = document.getElementById('placesText');

  const tauxRempli = ((evt.placesTotal - evt.placesRestantes) / evt.placesTotal) * 100;
  barre.style.width = `${Math.min(tauxRempli, 100)}%`;

  barre.classList.remove('is-low', 'is-full');
  if (evt.placesRestantes <= 0) {
    barre.classList.add('is-full');
  } else if (evt.placesRestantes / evt.placesTotal <= 0.15) {
    barre.classList.add('is-low');
  }

  texte.textContent =
    evt.placesRestantes > 0
      ? `${evt.placesRestantes} place${evt.placesRestantes > 1 ? 's' : ''} restante${evt.placesRestantes > 1 ? 's' : ''} sur ${evt.placesTotal}`
      : `Complet (${evt.placesTotal} places)`;
}

/* --------------------------------------------------------------------------
   Formulaire d'inscription à l'événement
   -------------------------------------------------------------------------- */
function initFormulaireInscription(evt) {
  const formulaire = document.getElementById('registrationForm');
  const messageSucces = document.getElementById('registrationSuccess');
  const messageComplet = document.getElementById('registrationFull');
  const boutonSubmit = document.getElementById('regSubmitBtn');

  // Événement déjà complet à l'arrivée sur la page : on désactive direct
  if (evt.placesRestantes <= 0) {
    formulaire.hidden = true;
    messageComplet.hidden = false;
    return;
  }

  const champNom = document.getElementById('regName');
  const groupeNom = document.getElementById('regNameGroup');
  const erreurNom = document.getElementById('regNameError');

  const champEmail = document.getElementById('regEmail');
  const groupeEmail = document.getElementById('regEmailGroup');
  const erreurEmail = document.getElementById('regEmailError');

  const champProgramme = document.getElementById('regProgram');
  const groupeProgramme = document.getElementById('regProgramGroup');
  const erreurProgramme = document.getElementById('regProgramError');

  formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    let valide = true;

    // Validation nom
    if (champNom.value.trim() === '') {
      afficherErreur(groupeNom, erreurNom, 'Le nom est requis.');
      valide = false;
    } else if (champNom.value.trim().length < 2) {
      afficherErreur(groupeNom, erreurNom, 'Le nom doit contenir au moins 2 caractères.');
      valide = false;
    } else {
      masquerErreur(groupeNom, erreurNom);
    }

    // Validation email
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

    // Validation programme
    if (champProgramme.value.trim() === '') {
      afficherErreur(groupeProgramme, erreurProgramme, 'La faculté / le programme est requis.');
      valide = false;
    } else {
      masquerErreur(groupeProgramme, erreurProgramme);
    }

    if (!valide) return;

    // Succès : décrémente les places restantes localement (pas de backend)
    evt.placesRestantes = Math.max(0, evt.placesRestantes - 1);
    mettreAJourCompteurPlaces(evt);

    formulaire.hidden = true;
    messageSucces.hidden = false;

    if (evt.placesRestantes <= 0) {
      boutonSubmit.disabled = true;
    }
  });
}

/* --------------------------------------------------------------------------
   Témoignages / commentaires
   -------------------------------------------------------------------------- */
function afficherCommentaires() {
  const liste = document.getElementById('commentsList');

  if (ETAT_DETAIL.commentaires.length === 0) {
    liste.innerHTML = '<p class="no-comments">Aucun témoignage pour le moment. Sois le premier à partager ton expérience !</p>';
    return;
  }

  liste.innerHTML = ETAT_DETAIL.commentaires.map(creerCommentaireHTML).join('');
}

function creerCommentaireHTML(commentaire) {
  const etoiles = '★'.repeat(commentaire.note) + '☆'.repeat(5 - commentaire.note);
  return `
    <li class="comment-item">
      <div class="comment-header">
        <span class="comment-author">${echapperHTML(commentaire.auteur)}</span>
        <span class="comment-rating" aria-label="${commentaire.note} étoiles sur 5">${etoiles}</span>
      </div>
      <p class="comment-text">${echapperHTML(commentaire.texte)}</p>
    </li>
  `;
}

/**
 * Échappe les caractères HTML pour éviter toute injection via le contenu
 * saisi par l'utilisateur dans le formulaire de témoignage.
 */
function echapperHTML(texte) {
  const div = document.createElement('div');
  div.textContent = texte;
  return div.innerHTML;
}

function initFormulaireCommentaire() {
  const formulaire = document.getElementById('commentForm');
  if (!formulaire) return;

  const champNom = document.getElementById('commentName');
  const groupeNom = document.getElementById('commentNameGroup');
  const erreurNom = document.getElementById('commentNameError');

  const champTexte = document.getElementById('commentText');
  const groupeTexte = document.getElementById('commentTextGroup');
  const erreurTexte = document.getElementById('commentTextError');

  const champNote = document.getElementById('commentRating');

  formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    let valide = true;

    if (champNom.value.trim() === '') {
      afficherErreur(groupeNom, erreurNom, 'Le nom est requis.');
      valide = false;
    } else {
      masquerErreur(groupeNom, erreurNom);
    }

    if (champTexte.value.trim() === '') {
      afficherErreur(groupeTexte, erreurTexte, 'Le témoignage ne peut pas être vide.');
      valide = false;
    } else if (champTexte.value.trim().length < 10) {
      afficherErreur(groupeTexte, erreurTexte, 'Le témoignage doit contenir au moins 10 caractères.');
      valide = false;
    } else {
      masquerErreur(groupeTexte, erreurTexte);
    }

    if (!valide) return;

    ETAT_DETAIL.commentaires.unshift({
      auteur: champNom.value.trim(),
      note: parseInt(champNote.value, 10),
      texte: champTexte.value.trim(),
    });

    afficherCommentaires();
    formulaire.reset();
  });
}

/* --------------------------------------------------------------------------
   Partage sur les réseaux sociaux
   -------------------------------------------------------------------------- */
function initLiensPartage(evt) {
  const urlPage = window.location.href;
  const texte = encodeURIComponent(`${evt.titre} — sur EduEvent`);
  const urlEncodee = encodeURIComponent(urlPage);

  const liens = {
    shareFacebook: `https://www.facebook.com/sharer/sharer.php?u=${urlEncodee}`,
    shareTwitter: `https://twitter.com/intent/tweet?text=${texte}&url=${urlEncodee}`,
    shareWhatsapp: `https://wa.me/?text=${texte}%20${urlEncodee}`,
    shareEmail: `mailto:?subject=${texte}&body=${urlEncodee}`,
  };

  Object.entries(liens).forEach(([idElement, href]) => {
    const lien = document.getElementById(idElement);
    if (lien) lien.href = href;
  });
}
