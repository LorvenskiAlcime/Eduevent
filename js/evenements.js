/*  EduEvent — evenements.js
   Logique de la page evenements.html : recherche, filtres, vue, pagination.
   Dépend des utilitaires partagés définis dans main.js
   (chargerEvenements, creerCarteEvenement, formaterDate, afficherErreur).*/

const ETAT = {
  tousLesEvenements: [],
  evenementsFiltres: [],
  categorieActive: 'tous',
  dateActive: 'tous',
  termeRecherche: '',
  vue: 'grille',
  pageActuelle: 1,
  parPage: 6,
};

document.addEventListener('DOMContentLoaded', async () => {
  await initialiserPage();
});

async function initialiserPage() {
  const conteneur = document.getElementById('eventsContainer');

  ETAT.tousLesEvenements = await chargerEvenements();

  if (ETAT.tousLesEvenements.length === 0) {
    conteneur.innerHTML = '<p class="no-results-inline">Impossible de charger les événements pour le moment. Réessaie plus tard.</p>';
    return;
  }

  appliquerFiltreDepuisURL();
  initRecherche();
  initFiltresCategorie();
  initFiltreDate();
  initToggleVue();
  initResetFiltres();
  initLoadMore();

  appliquerFiltresEtAfficher();
}

/* --------------------------------------------------------------------------
   Lecture du paramètre ?categorie= dans l'URL (liens du footer / accueil)
   -------------------------------------------------------------------------- */
function appliquerFiltreDepuisURL() {
  const params = new URLSearchParams(window.location.search);
  const categorieURL = params.get('categorie');
  if (!categorieURL) return;

  const boutonCorrespondant = document.querySelector(`.filter-chip[data-categorie="${categorieURL}"]`);
  if (boutonCorrespondant) {
    document.querySelectorAll('.filter-chip').forEach((b) => b.classList.remove('is-active'));
    boutonCorrespondant.classList.add('is-active');
    ETAT.categorieActive = categorieURL;
  }
}

/* --------------------------------------------------------------------------
   Recherche en temps réel
   -------------------------------------------------------------------------- */
function initRecherche() {
  const champRecherche = document.getElementById('searchInput');
  if (!champRecherche) return;

  let debounceTimer;
  champRecherche.addEventListener('input', (evenement) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      ETAT.termeRecherche = evenement.target.value.trim().toLowerCase();
      ETAT.pageActuelle = 1;
      appliquerFiltresEtAfficher();
    }, 200);
  });
}

/* --------------------------------------------------------------------------
   Filtres par catégorie (chips)
   -------------------------------------------------------------------------- */
function initFiltresCategorie() {
  const chips = document.querySelectorAll('.filter-chip');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      ETAT.categorieActive = chip.dataset.categorie;
      ETAT.pageActuelle = 1;
      appliquerFiltresEtAfficher();
    });
  });
}

/* --------------------------------------------------------------------------
   Filtre par date
   -------------------------------------------------------------------------- */
function initFiltreDate() {
  const selectDate = document.getElementById('dateFilter');
  if (!selectDate) return;

  selectDate.addEventListener('change', () => {
    ETAT.dateActive = selectDate.value;
    ETAT.pageActuelle = 1;
    appliquerFiltresEtAfficher();
  });
}

//Vérifie si une date d'événement (YYYY-MM-DD) correspond au filtre de date sélectionné.
 
function correspondAuFiltreDate(dateEvenementISO, filtre) {
  if (filtre === 'tous') return true;

  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const dateEvenement = new Date(dateEvenementISO + 'T00:00:00');

  if (filtre === 'aujourdhui') {
    return dateEvenement.getTime() === aujourdhui.getTime();
  }

  if (filtre === 'semaine') {
    const finSemaine = new Date(aujourdhui);
    finSemaine.setDate(finSemaine.getDate() + 7);
    return dateEvenement >= aujourdhui && dateEvenement <= finSemaine;
  }

  if (filtre === 'mois') {
    return (
      dateEvenement.getFullYear() === aujourdhui.getFullYear() &&
      dateEvenement.getMonth() === aujourdhui.getMonth() &&
      dateEvenement >= aujourdhui
    );
  }

  return true;
}

/* --------------------------------------------------------------------------
   Toggle vue grille / liste
   -------------------------------------------------------------------------- */
function initToggleVue() {
  const boutonGrille = document.getElementById('viewGridBtn');
  const boutonListe = document.getElementById('viewListBtn');
  const conteneur = document.getElementById('eventsContainer');
  if (!boutonGrille || !boutonListe || !conteneur) return;

  boutonGrille.addEventListener('click', () => {
    ETAT.vue = 'grille';
    conteneur.classList.remove('is-list-view');
    boutonGrille.classList.add('is-active');
    boutonListe.classList.remove('is-active');
    boutonGrille.setAttribute('aria-pressed', 'true');
    boutonListe.setAttribute('aria-pressed', 'false');
  });

  boutonListe.addEventListener('click', () => {
    ETAT.vue = 'liste';
    conteneur.classList.add('is-list-view');
    boutonListe.classList.add('is-active');
    boutonGrille.classList.remove('is-active');
    boutonListe.setAttribute('aria-pressed', 'true');
    boutonGrille.setAttribute('aria-pressed', 'false');
  });
}

/* --------------------------------------------------------------------------
   Réinitialisation des filtres
   -------------------------------------------------------------------------- */
function initResetFiltres() {
  const boutonReset = document.getElementById('resetFiltersBtn');
  if (!boutonReset) return;

  boutonReset.addEventListener('click', () => {
    ETAT.categorieActive = 'tous';
    ETAT.dateActive = 'tous';
    ETAT.termeRecherche = '';
    ETAT.pageActuelle = 1;

    document.getElementById('searchInput').value = '';
    document.getElementById('dateFilter').value = 'tous';
    document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('is-active'));
    document.querySelector('.filter-chip[data-categorie="tous"]').classList.add('is-active');

    appliquerFiltresEtAfficher();
  });
}

/* --------------------------------------------------------------------------
   Pagination "Charger plus"
   -------------------------------------------------------------------------- */
function initLoadMore() {
  const boutonPlus = document.getElementById('loadMoreBtn');
  if (!boutonPlus) return;

  boutonPlus.addEventListener('click', () => {
    ETAT.pageActuelle += 1;
    afficherResultats();
  });
}

/* --------------------------------------------------------------------------
   Cœur de la logique : filtrage combiné + affichage
   -------------------------------------------------------------------------- */
function appliquerFiltresEtAfficher() {
  ETAT.evenementsFiltres = ETAT.tousLesEvenements.filter((evt) => {
    const correspondCategorie = ETAT.categorieActive === 'tous' || evt.categorie === ETAT.categorieActive;
    const correspondDate = correspondAuFiltreDate(evt.date, ETAT.dateActive);
    const correspondRecherche =
      ETAT.termeRecherche === '' ||
      evt.titre.toLowerCase().includes(ETAT.termeRecherche) ||
      evt.description.toLowerCase().includes(ETAT.termeRecherche) ||
      evt.lieu.toLowerCase().includes(ETAT.termeRecherche);

    return correspondCategorie && correspondDate && correspondRecherche;
  });

  // Tri par date croissante (les plus proches d'abord)
  ETAT.evenementsFiltres.sort((a, b) => new Date(a.date) - new Date(b.date));

  mettreAJourCompteurResultats();
  mettreAJourVisibiliteReset();
  afficherResultats();
}

function afficherResultats() {
  const conteneur = document.getElementById('eventsContainer');
  const messageAucunResultat = document.getElementById('noResultsMessage');
  const boutonPlus = document.getElementById('loadMoreBtn');

  if (ETAT.evenementsFiltres.length === 0) {
    conteneur.innerHTML = '';
    messageAucunResultat.hidden = false;
    boutonPlus.hidden = true;
    return;
  }

  messageAucunResultat.hidden = true;

  const nombreAAfficher = ETAT.pageActuelle * ETAT.parPage;
  const evenementsAffiches = ETAT.evenementsFiltres.slice(0, nombreAAfficher);

  conteneur.innerHTML = evenementsAffiches.map(creerCarteEvenement).join('');
  observerApparitions();

  boutonPlus.hidden = nombreAAfficher >= ETAT.evenementsFiltres.length;
}

function mettreAJourCompteurResultats() {
  const compteur = document.getElementById('resultsCount');
  if (!compteur) return;
  const total = ETAT.evenementsFiltres.length;
  compteur.textContent = `${total} événement${total !== 1 ? 's' : ''} trouvé${total !== 1 ? 's' : ''}`;
}

function mettreAJourVisibiliteReset() {
  const boutonReset = document.getElementById('resetFiltersBtn');
  if (!boutonReset) return;
  const filtresActifs =
    ETAT.categorieActive !== 'tous' || ETAT.dateActive !== 'tous' || ETAT.termeRecherche !== '';
  boutonReset.hidden = !filtresActifs;
}
