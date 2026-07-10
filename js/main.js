/* ==========================================================================
   EduEvent — main.js
   Script global : menu mobile, chargement événements vedette, stats animées,
   newsletter. Partagé par toutes les pages qui l'incluent.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initFeaturedEvents();
  initStatsCounter();
  initNewsletterForm();
  initFormulaireContact();
  initAccordeonFAQ();
});

/* --------------------------------------------------------------------------
   Menu mobile (hamburger)
   -------------------------------------------------------------------------- */
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Ferme le menu si on clique sur un lien (mobile)
  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* --------------------------------------------------------------------------
   Utilitaires événements (partagés avec evenements.js / detail.js)
   -------------------------------------------------------------------------- */

/**
 * Charge le fichier data/evenements.json et retourne le tableau d'événements.
 * Chemin relatif : fonctionne tant que la page appelante est à la racine du projet.
 */
async function chargerEvenements() {
  try {
    const reponse = await fetch('data/evenements.json');
    if (!reponse.ok) throw new Error('Réponse réseau invalide');
    const donnees = await reponse.json();
    return donnees.evenements || [];
  } catch (erreur) {
    console.error('Erreur lors du chargement des événements :', erreur);
    return [];
  }
}

/**
 * Formate une date ISO (YYYY-MM-DD) en format lisible français : "2 juillet 2026"
 */
function formaterDate(dateISO) {
  const date = new Date(dateISO + 'T00:00:00');
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('fr-FR', options);
}

/**
 * Formate une date courte : "02 juil."
 */
function formaterDateCourte(dateISO) {
  const date = new Date(dateISO + 'T00:00:00');
  const options = { day: '2-digit', month: 'short' };
  return date.toLocaleDateString('fr-FR', options);
}

/**
 * Retourne la classe CSS du badge de places en fonction du taux de remplissage.
 */
function classeBadgePlaces(placesRestantes, placesTotal) {
  if (placesRestantes <= 0) return 'is-full';
  if (placesRestantes / placesTotal <= 0.15) return 'is-low';
  return '';
}

/**
 * Retourne le texte du badge de places.
 */
function texteBadgePlaces(placesRestantes) {
  if (placesRestantes <= 0) return 'Complet';
  return `${placesRestantes} place${placesRestantes > 1 ? 's' : ''} restante${placesRestantes > 1 ? 's' : ''}`;
}

/**
 * Construit le HTML d'une carte "ticket" pour un événement donné.
 */
function creerCarteEvenement(evt) {
  const badgeClasse = classeBadgePlaces(evt.placesRestantes, evt.placesTotal);
  const badgeTexte = texteBadgePlaces(evt.placesRestantes);

  return `
    <article class="ticket-card reveal-on-scroll">
      <div class="ticket-main">
        <img class="ticket-image" src="${evt.image}" alt="${evt.titre}" loading="lazy"
             onerror="this.style.display='none'">
        <div class="ticket-body">
          <div class="ticket-info">
            <span class="ticket-category">${evt.categorieLabel}</span>
            <h3 class="ticket-title">${evt.titre}</h3>
            <div class="ticket-meta">
              <span> ${formaterDateCourte(evt.date)} · ${evt.heureDebut}</span>
              <span> ${evt.lieu}</span>
            </div>
          </div>
          <div class="ticket-footer">
            <span class="badge-places ${badgeClasse}">${badgeTexte}</span>
            <a href="detail.html?id=${evt.id}" class="btn btn-primary btn-sm">Voir plus</a>
          </div>
        </div>
      </div>
      <div class="ticket-stub">
        <span class="ticket-stub-label">${evt.categorieLabel}</span>
      </div>
    </article>
  `;
}

/* --------------------------------------------------------------------------
   Événements à la une (page d'accueil)
   -------------------------------------------------------------------------- */
async function initFeaturedEvents() {
  const grille = document.getElementById('featuredEventsGrid');
  if (!grille) return;

  const evenements = await chargerEvenements();
  const vedettes = evenements.filter((e) => e.vedette);

  if (vedettes.length === 0) {
    grille.innerHTML = '<p class="loading-text">Aucun événement à la une pour le moment.</p>';
    return;
  }

  grille.innerHTML = vedettes.map(creerCarteEvenement).join('');
  observerApparitions();
}

/* --------------------------------------------------------------------------
   Compteur de statistiques animé (au scroll, effet odomètre)
   -------------------------------------------------------------------------- */
function initStatsCounter() {
  const stats = document.querySelectorAll('.stat-number');
  if (stats.length === 0) return;

  const animerCompteur = (element) => {
    const cible = parseInt(element.dataset.target, 10) || 0;
    const suffixe = element.dataset.suffix || '';
    const duree = 1400;
    const debut = performance.now();

    function etape(maintenant) {
      const progres = Math.min((maintenant - debut) / duree, 1);
      const valeurActuelle = Math.floor(progres * cible);
      element.textContent = valeurActuelle.toLocaleString('fr-FR') + suffixe;
      if (progres < 1) {
        requestAnimationFrame(etape);
      } else {
        element.textContent = cible.toLocaleString('fr-FR') + suffixe;
      }
    }
    requestAnimationFrame(etape);
  };

  const observateur = new IntersectionObserver((entrees) => {
    entrees.forEach((entree) => {
      if (entree.isIntersecting) {
        animerCompteur(entree.target);
        observateur.unobserve(entree.target);
      }
    });
  }, { threshold: 0.4 });

  stats.forEach((stat) => observateur.observe(stat));
}

/* --------------------------------------------------------------------------
   Apparition au scroll (cartes événements, sections)
   -------------------------------------------------------------------------- */
function observerApparitions() {
  const elements = document.querySelectorAll('.reveal-on-scroll:not(.is-visible)');
  if (elements.length === 0) return;

  const observateur = new IntersectionObserver((entrees) => {
    entrees.forEach((entree) => {
      if (entree.isIntersecting) {
        entree.target.classList.add('is-visible');
        observateur.unobserve(entree.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach((el) => observateur.observe(el));
}

/* --------------------------------------------------------------------------
   Formulaire newsletter avec validation
   -------------------------------------------------------------------------- */
function initNewsletterForm() {
  const formulaire = document.getElementById('newsletterForm');
  if (!formulaire) return;

  const champEmail = document.getElementById('newsletterEmail');
  const groupeEmail = document.getElementById('newsletterGroup');
  const erreurEmail = document.getElementById('newsletterError');
  const messageSucces = document.getElementById('newsletterSuccess');

  formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valeur = champEmail.value.trim();

    if (valeur === '') {
      afficherErreur(groupeEmail, erreurEmail, 'L\'adresse email est requise.');
      return;
    }

    if (!regexEmail.test(valeur)) {
      afficherErreur(groupeEmail, erreurEmail, 'Veuillez saisir une adresse email valide.');
      return;
    }

    // Succès : pas de backend, on simule l'inscription
    masquerErreur(groupeEmail, erreurEmail);
    formulaire.hidden = true;
    messageSucces.hidden = false;
    champEmail.value = '';
  });
}

/* --------------------------------------------------------------------------
   Fonctions utilitaires de validation (partagées avec profil.js, detail.js, a-propos)
   -------------------------------------------------------------------------- */
function afficherErreur(groupe, elementErreur, message) {
  groupe.classList.add('has-error');
  elementErreur.textContent = message;
}

function masquerErreur(groupe, elementErreur) {
  groupe.classList.remove('has-error');
  elementErreur.textContent = '';
}

/* --------------------------------------------------------------------------
   Formulaire de contact (page a-propos.html)
   -------------------------------------------------------------------------- */
function initFormulaireContact() {
  const formulaire = document.getElementById('contactForm');
  if (!formulaire) return;

  const champNom = document.getElementById('contactName');
  const groupeNom = document.getElementById('contactNameGroup');
  const erreurNom = document.getElementById('contactNameError');

  const champEmail = document.getElementById('contactEmail');
  const groupeEmail = document.getElementById('contactEmailGroup');
  const erreurEmail = document.getElementById('contactEmailError');

  const champSujet = document.getElementById('contactSubject');
  const groupeSujet = document.getElementById('contactSubjectGroup');
  const erreurSujet = document.getElementById('contactSubjectError');

  const champMessage = document.getElementById('contactMessage');
  const groupeMessage = document.getElementById('contactMessageGroup');
  const erreurMessage = document.getElementById('contactMessageError');

  const messageSucces = document.getElementById('contactSuccess');

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
    if (champEmail.value.trim() === '') {
      afficherErreur(groupeEmail, erreurEmail, "L'adresse email est requise.");
      valide = false;
    } else if (!regexEmail.test(champEmail.value.trim())) {
      afficherErreur(groupeEmail, erreurEmail, 'Adresse email invalide.');
      valide = false;
    } else {
      masquerErreur(groupeEmail, erreurEmail);
    }

    if (champSujet.value === '') {
      afficherErreur(groupeSujet, erreurSujet, 'Merci de choisir un sujet.');
      valide = false;
    } else {
      masquerErreur(groupeSujet, erreurSujet);
    }

    if (champMessage.value.trim() === '') {
      afficherErreur(groupeMessage, erreurMessage, 'Le message ne peut pas être vide.');
      valide = false;
    } else if (champMessage.value.trim().length < 10) {
      afficherErreur(groupeMessage, erreurMessage, 'Le message doit contenir au moins 10 caractères.');
      valide = false;
    } else {
      masquerErreur(groupeMessage, erreurMessage);
    }

    if (!valide) return;

    formulaire.hidden = true;
    messageSucces.hidden = false;
  });
}

/* --------------------------------------------------------------------------
   Accordéon FAQ (page a-propos.html)
   -------------------------------------------------------------------------- */
function initAccordeonFAQ() {
  const accordeon = document.getElementById('faqAccordion');
  if (!accordeon) return;

  const declencheurs = accordeon.querySelectorAll('.accordion-trigger');

  declencheurs.forEach((declencheur) => {
    declencheur.addEventListener('click', () => {
      const item = declencheur.closest('.accordion-item');
      const estOuvert = item.classList.contains('is-open');

      // Un seul panneau ouvert à la fois
      accordeon.querySelectorAll('.accordion-item.is-open').forEach((autreItem) => {
        autreItem.classList.remove('is-open');
        autreItem.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
      });

      if (!estOuvert) {
        item.classList.add('is-open');
        declencheur.setAttribute('aria-expanded', 'true');
      }
    });
  });
}
