// ---------- Données ----------

// La liste des tâches. Pour l'instant elle n'existe qu'en mémoire :
// elle disparaît quand on recharge la page (la sauvegarde viendra au sprint 2).
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

// ---------- Fonctions qui travaillent sur les données ----------

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
  return true;
}

// Coche ou décoche une tâche : "a_faire" <-> "terminee".
function basculerStatut(id) {
  const tache = taches.find((t) => t.id === id);
  if (tache === undefined) {
    return;
  }
  tache.statut = tache.statut === "terminee" ? "a_faire" : "terminee";
}

// Retire une tâche de la liste.
function supprimerTache(id) {
  taches = taches.filter((t) => t.id !== id);
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
    caseCocher.setAttribute("aria-label", "Terminer la tâche");
    caseCocher.addEventListener("change", () => {
      basculerStatut(tache.id);
      afficher();
    });

    // textContent (et non innerHTML) : le titre est affiché comme du simple texte,
    // même s'il contient des balises HTML.
    const texte = document.createElement("span");
    let contenu = tache.titre + " · " + tache.priorite;
    if (tache.echeance !== "") {
      contenu += " · " + formaterDate(tache.echeance);
    }
    texte.textContent = contenu;
    if (tache.statut === "terminee") {
      texte.classList.add("terminee");
    }

    const boutonModifier = document.createElement("button");
    boutonModifier.type = "button";
    boutonModifier.textContent = "Modifier";
    boutonModifier.addEventListener("click", () => commencerModification(tache));

    const boutonSupprimer = document.createElement("button");
    boutonSupprimer.type = "button";
    boutonSupprimer.textContent = "Supprimer";
    boutonSupprimer.addEventListener("click", () => {
      supprimerTache(tache.id);
      afficher();
    });

    ligne.append(caseCocher, texte, boutonModifier, boutonSupprimer);
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

  message.textContent = "";
  quitterModification();
  afficher();
});

afficher();
