// ---------- Données ----------

// Nom sous lequel les tâches sont rangées dans le localStorage du navigateur.
// Attention : le localStorage n'est PAS privé. Les données restent sur cet ordinateur,
// mais elles sont lisibles en clair avec les outils du navigateur (onglet Application)
// et non chiffrées : on n'y met aucune donnée sensible.
const CLE_STOCKAGE = "taskflow.taches";

// Nombre maximum de caractères d'un titre.
const LONGUEUR_MAX_TITRE = 200;

// La liste des tâches, en mémoire. Elle est lue dans le localStorage au démarrage
// (tout en bas du fichier) et sauvegardée après chaque changement.
let taches = [];

// null = on ajoute une tâche ; sinon = id de la tâche qu'on est en train de modifier.
let idEnEdition = null;

// ---------- Éléments de la page ----------

const formulaire = document.getElementById("formulaire");
const champTitre = document.getElementById("titre");
const champPriorite = document.getElementById("priorite");
const champEcheance = document.getElementById("echeance");
const boutonValider = document.getElementById("bouton-valider");
const message = document.getElementById("message");
const liste = document.getElementById("liste");

// ---------- Sauvegarde (localStorage) ----------

// Vérifie qu'un objet ressemble bien à une tâche. Le localStorage peut être modifié
// à la main avec les outils du navigateur : on ne fait pas confiance à ce qu'on y lit.
function tacheValide(t) {
  return (
    typeof t === "object" &&
    t !== null &&
    typeof t.id === "number" &&
    typeof t.titre === "string" &&
    t.titre.trim() !== "" &&
    t.titre.length <= LONGUEUR_MAX_TITRE &&
    ["haute", "moyenne", "basse"].includes(t.priorite) &&
    typeof t.echeance === "string" &&
    // Échéance vide, ou de la forme AAAA-MM-JJ (3 morceaux séparés par des tirets).
    // On ne vérifie pas que la date existe : sans cette forme, formaterDate
    // afficherait « undefined/undefined/... ».
    (t.echeance === "" || t.echeance.split("-").length === 3) &&
    ["a_faire", "terminee"].includes(t.statut)
  );
}

// Lit les tâches sauvegardées. Renvoie [] au premier lancement,
// ou si les données sont inutilisables.
function charger() {
  try {
    const texte = localStorage.getItem(CLE_STOCKAGE);
    if (texte === null) {
      return []; // premier lancement : rien n'a encore été sauvegardé
    }
    // Le localStorage ne garde que du texte : JSON.parse retransforme ce texte en tableau.
    const donnees = JSON.parse(texte);
    if (!Array.isArray(donnees)) {
      return [];
    }
    return donnees.filter(tacheValide);
  } catch (erreur) {
    // stockage inaccessible, ou texte qui n'est pas du JSON valide
    return [];
  }
}

// Sauvegarde la liste. On l'appelle après chaque changement des données.
// Affiche un message si le navigateur refuse.
function sauvegarder() {
  try {
    // JSON.stringify transforme le tableau de tâches en texte, seul format accepté par setItem.
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(taches));
    message.textContent = ""; // ça a marché : on efface un éventuel ancien message d'échec
  } catch (erreur) {
    message.textContent = "Sauvegarde impossible : vos dernières modifications seront perdues à la fermeture.";
  }
}

// ---------- Fonctions qui modifient les tâches ----------

// Ajoute une tâche. Refuse un titre vide (ou fait seulement d'espaces) : renvoie null.
function ajouterTache(titre, priorite, echeance) {
  if (titre.trim() === "") {
    return null;
  }
  const tache = {
    id: Date.now(),
    titre: titre.trim(),
    priorite: priorite,
    echeance: echeance,
    statut: "a_faire",
  };
  taches.push(tache);
  sauvegarder();
  return tache;
}

// Change le titre, la priorité et l'échéance d'une tâche existante.
// Renvoie true si ça a marché, false sinon.
function modifierTache(id, titre, priorite, echeance) {
  if (titre.trim() === "") {
    return false;
  }
  const tache = taches.find((t) => t.id === id);
  if (tache === undefined) {
    return false;
  }
  tache.titre = titre.trim();
  tache.priorite = priorite;
  tache.echeance = echeance;
  sauvegarder();
  return true;
}

// Coche ou décoche une tâche : "a_faire" <-> "terminee".
function basculerStatut(id) {
  const tache = taches.find((t) => t.id === id);
  if (tache === undefined) {
    return;
  }
  tache.statut = tache.statut === "terminee" ? "a_faire" : "terminee";
  sauvegarder();
}

// Retire une tâche de la liste.
function supprimerTache(id) {
  taches = taches.filter((t) => t.id !== id);
  sauvegarder();
  if (id === idEnEdition) {
    quitterModification();
  }
}

// ---------- Fonctions qui travaillent sur la page ----------

// "2026-11-15" -> "15/11/2026" ; une date vide reste vide.
function formaterDate(date) {
  if (date === "") {
    return "";
  }
  const [annee, mois, jour] = date.split("-");
  return jour + "/" + mois + "/" + annee;
}

// Remplit le formulaire avec la tâche choisie, et passe en mode « modification ».
function commencerModification(tache) {
  idEnEdition = tache.id;
  message.textContent = ""; // un ancien message d'erreur n'a plus de sens
  champTitre.value = tache.titre;
  champPriorite.value = tache.priorite;
  champEcheance.value = tache.echeance;
  boutonValider.textContent = "Enregistrer";
  champTitre.focus();
}

// Vide le formulaire et revient en mode « ajout ».
function quitterModification() {
  idEnEdition = null;
  formulaire.reset();
  boutonValider.textContent = "Ajouter";
}

// Redessine toute la liste à partir du tableau `taches`.
function afficher() {
  liste.textContent = ""; // on vide la liste avant de la refaire

  for (const tache of taches) {
    const ligne = document.createElement("li");

    const caseCocher = document.createElement("input");
    caseCocher.type = "checkbox";
    caseCocher.checked = tache.statut === "terminee";
    // aria-label : le nom lu par un lecteur d'écran (il précise de quelle tâche il s'agit).
    caseCocher.setAttribute("aria-label", "Terminer : " + tache.titre);
    caseCocher.addEventListener("change", () => {
      basculerStatut(tache.id);
      afficher();
    });

    // textContent (et non innerHTML) : le titre est affiché comme du simple texte,
    // même s'il contient des balises HTML.
    const titre = document.createElement("span");
    titre.className = "titre-tache";
    titre.textContent = tache.titre;
    if (tache.statut === "terminee") {
      titre.classList.add("terminee");
    }

    // La classe du badge (haute, moyenne ou basse) donne la couleur dans style.css.
    const badge = document.createElement("span");
    badge.className = "badge " + tache.priorite;
    badge.textContent = tache.priorite;

    const date = document.createElement("span");
    date.className = "date";
    date.textContent = formaterDate(tache.echeance);

    const boutonModifier = document.createElement("button");
    boutonModifier.type = "button";
    boutonModifier.textContent = "Modifier";
    boutonModifier.setAttribute("aria-label", "Modifier : " + tache.titre);
    boutonModifier.addEventListener("click", () => commencerModification(tache));

    const boutonSupprimer = document.createElement("button");
    boutonSupprimer.type = "button";
    boutonSupprimer.textContent = "Supprimer";
    boutonSupprimer.setAttribute("aria-label", "Supprimer : " + tache.titre);
    boutonSupprimer.addEventListener("click", () => {
      supprimerTache(tache.id);
      afficher();
    });

    ligne.append(caseCocher, titre, badge);
    if (tache.echeance !== "") {
      ligne.append(date);
    }
    ligne.append(boutonModifier, boutonSupprimer);
    liste.append(ligne);
  }
}

// ---------- Réaction au formulaire ----------

formulaire.addEventListener("submit", (evenement) => {
  evenement.preventDefault(); // empêche la page de se recharger

  let reussi;
  if (idEnEdition === null) {
    reussi = ajouterTache(champTitre.value, champPriorite.value, champEcheance.value) !== null;
  } else {
    reussi = modifierTache(idEnEdition, champTitre.value, champPriorite.value, champEcheance.value);
  }

  if (!reussi) {
    message.textContent = "Le titre ne peut pas être vide.";
    return;
  }

  quitterModification();
  afficher();
});

// ---------- Démarrage ----------

champTitre.maxLength = LONGUEUR_MAX_TITRE; // le champ refuse de taper plus de caractères
taches = charger();
afficher();

// Si la page est ouverte dans deux onglets, l'événement « storage » prévient un onglet
// quand l'AUTRE a changé la sauvegarde : on relit la liste pour ne pas écraser ses changements.
window.addEventListener("storage", () => {
  taches = charger();
  if (idEnEdition !== null && !taches.some((t) => t.id === idEnEdition)) {
    quitterModification(); // la tâche qu'on modifiait a été supprimée dans l'autre onglet
  }
  afficher();
});
