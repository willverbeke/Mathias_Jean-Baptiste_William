// Écran de connexion : création du compte, contrôle du mot de passe, jauge de force,
// blocage après plusieurs échecs.
//
// LIMITE À CONNAÎTRE : il n'y a pas de serveur. Le compte est rangé dans le localStorage,
// que n'importe qui peut lire ou modifier avec les outils du navigateur. Cette connexion
// est une barrière d'interface, pas une protection solide des tâches.

// ---------- Réglages ----------

// Règles du mot de passe.
const LONGUEUR_MIN_MOT_DE_PASSE = 12;
const NB_SPECIAUX_MIN = 2;
// Les caractères qui comptent comme « spéciaux ». Un espace ou une lettre accentuée n'en font pas partie.
const CARACTERES_SPECIAUX = "!@#$%^&*()-_=+[]{};:,.<>?/\\|~'\"`";

// Blocage : après ECHECS_MAX mauvais essais, la connexion est bloquée pendant DUREE_BLOCAGE_MS.
const ECHECS_MAX = 3;
const DUREE_BLOCAGE_MS = 30 * 1000;

// Nombre de tours de calcul de l'empreinte du mot de passe. Plus il est grand,
// plus deviner un mot de passe prend du temps. Pour nous, un calcul dure environ un dixième
// de seconde (mesuré sur un ordinateur récent) ; pour un pirate qui en fait des millions, c'est énorme.
const ITERATIONS = 600000;

const LONGUEUR_MAX_IDENTIFIANT = 50;

// Noms des cases du localStorage.
const CLE_COMPTE = "taskflow.compte";
const CLE_SECURITE = "taskflow.securite";

// ---------- Éléments de la page ----------

const ecranConnexion = document.getElementById("ecran-connexion");
const appli = document.getElementById("appli");
const titreConnexion = document.getElementById("titre-connexion");
const formulaireConnexion = document.getElementById("formulaire-connexion");
const champIdentifiant = document.getElementById("identifiant");
const champMotDePasse = document.getElementById("mot-de-passe");
const champConfirmation = document.getElementById("confirmation");
const zoneCreation = document.getElementById("zone-creation");
const listeRegles = document.getElementById("regles");
const jauge = document.getElementById("jauge");
const texteJauge = document.getElementById("jauge-texte");
const boutonConnexion = document.getElementById("bouton-connexion");
const messageConnexion = document.getElementById("message-connexion");
const nomUtilisateur = document.getElementById("nom-utilisateur");
const boutonDeconnexion = document.getElementById("bouton-deconnexion");

// true pendant qu'on calcule une empreinte : empêche d'envoyer le formulaire deux fois de suite.
let enCours = false;

// ---------- Règles du mot de passe et jauge ----------

// Compte les caractères d'un texte pour lesquels la fonction `test` répond true.
function compter(texte, test) {
  let total = 0;
  for (const c of texte) {
    if (test(c)) {
      total++;
    }
  }
  return total;
}

// Vérifie les 5 règles. Renvoie une liste : pour chaque règle, son texte et « ok » (true ou false).
function verifierMotDePasse(mdp) {
  return [
    {
      texte: "Au moins " + LONGUEUR_MIN_MOT_DE_PASSE + " caractères",
      ok: mdp.length >= LONGUEUR_MIN_MOT_DE_PASSE,
    },
    {
      // Une lettre minuscule change quand on la passe en majuscule.
      texte: "Au moins 1 minuscule",
      ok: compter(mdp, (c) => c !== c.toUpperCase()) >= 1,
    },
    {
      // Une lettre majuscule change quand on la passe en minuscule.
      texte: "Au moins 1 majuscule",
      ok: compter(mdp, (c) => c !== c.toLowerCase()) >= 1,
    },
    {
      texte: "Au moins 1 chiffre",
      ok: compter(mdp, (c) => c >= "0" && c <= "9") >= 1,
    },
    {
      texte: "Au moins " + NB_SPECIAUX_MIN + " caractères spéciaux",
      ok: compter(mdp, (c) => CARACTERES_SPECIAUX.includes(c)) >= NB_SPECIAUX_MIN,
    },
  ];
}

// Niveau de la jauge : faible (0 à 2 règles respectées), moyen (3 ou 4), fort (les 5).
// Seul un mot de passe « fort » est accepté.
function niveauDeForce(regles) {
  const respectees = regles.filter((regle) => regle.ok).length;
  if (respectees === regles.length) {
    return "fort";
  }
  if (respectees >= 3) {
    return "moyen";
  }
  return "faible";
}

// Redessine la liste des règles (✓ ou ✗) et la jauge, à partir du mot de passe tapé.
function mettreAJourForce() {
  const mdp = champMotDePasse.value;
  const regles = verifierMotDePasse(mdp);

  listeRegles.textContent = "";
  for (const regle of regles) {
    const ligne = document.createElement("li");
    ligne.className = regle.ok ? "regle-ok" : "regle-ko";
    ligne.textContent = (regle.ok ? "✓ " : "✗ ") + regle.texte;
    listeRegles.append(ligne);
  }

  // Tant que rien n'est tapé, la jauge reste vide.
  const niveau = mdp === "" ? "" : niveauDeForce(regles);
  jauge.className = niveau;
  const texte = niveau === "" ? "" : "Force du mot de passe : " + niveau;
  if (texteJauge.textContent !== texte) {
    texteJauge.textContent = texte; // on ne change le texte que s'il est différent (lecteurs d'écran)
  }
}

// ---------- Stockage du compte et des échecs ----------

// Lit le compte enregistré. Renvoie null s'il n'y en a pas (ou s'il est inutilisable).
// JSON.parse(null) donne null : c'est le cas où la case du localStorage est vide.
function lireCompte() {
  try {
    const compte = JSON.parse(localStorage.getItem(CLE_COMPTE));
    if (
      compte !== null &&
      typeof compte === "object" &&
      typeof compte.identifiant === "string" &&
      typeof compte.sel === "string" &&
      typeof compte.empreinte === "string"
    ) {
      return compte;
    }
  } catch (erreur) {
    // stockage inaccessible ou texte qui n'est pas du JSON : on fait comme s'il n'y avait pas de compte
  }
  return null;
}

// Lit le compteur d'échecs : { echecs, bloqueJusqua } (bloqueJusqua = heure de fin du blocage).
function lireSecurite() {
  try {
    const s = JSON.parse(localStorage.getItem(CLE_SECURITE));
    if (s !== null && typeof s === "object" && Number.isFinite(s.echecs) && Number.isFinite(s.bloqueJusqua)) {
      return { echecs: s.echecs, bloqueJusqua: s.bloqueJusqua };
    }
  } catch (erreur) {
    // on repart de zéro
  }
  return { echecs: 0, bloqueJusqua: 0 };
}

function ecrireSecurite(securite) {
  try {
    localStorage.setItem(CLE_SECURITE, JSON.stringify(securite));
  } catch (erreur) {
    // tant pis : le compteur n'est qu'un bonus
  }
}

// ---------- Calcul de l'empreinte du mot de passe ----------

// On ne range JAMAIS le mot de passe lui-même : seulement son « empreinte », un nombre
// calculé à partir de lui qu'on ne sait pas refaire à l'envers. Le « sel » est un texte
// au hasard, propre à ce compte, qui change l'empreinte même pour un mot de passe courant.

// Transforme des octets en texte hexadécimal (par exemple 255 devient "ff").
function enHexa(octets) {
  return Array.from(octets, (o) => o.toString(16).padStart(2, "0")).join("");
}

// Fabrique un sel au hasard (16 octets tirés par le navigateur).
function creerSel() {
  return enHexa(crypto.getRandomValues(new Uint8Array(16)));
}

// Calcule l'empreinte d'un mot de passe avec PBKDF2, fourni par le navigateur (crypto.subtle).
// « async / await » : le calcul prend un peu de temps, `await` attend son résultat avant de continuer.
async function calculerEmpreinte(mdp, sel) {
  const encodeur = new TextEncoder(); // transforme un texte en octets
  const cle = await crypto.subtle.importKey("raw", encodeur.encode(mdp), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encodeur.encode(sel), iterations: ITERATIONS, hash: "SHA-256" },
    cle,
    256
  );
  return enHexa(new Uint8Array(bits));
}

// ---------- Créer un compte, se connecter ----------

// Ces deux fonctions renvoient un message d'erreur (texte), ou null si tout s'est bien passé.

async function creerCompte(identifiant, mdp, confirmation) {
  if (identifiant === "" || identifiant.length > LONGUEUR_MAX_IDENTIFIANT) {
    return "Choisissez un identifiant de 1 à " + LONGUEUR_MAX_IDENTIFIANT + " caractères.";
  }
  if (niveauDeForce(verifierMotDePasse(mdp)) !== "fort") {
    return "Le mot de passe ne respecte pas toutes les règles.";
  }
  if (mdp !== confirmation) {
    return "Les deux mots de passe sont différents.";
  }

  const sel = creerSel();
  const compte = { identifiant: identifiant, sel: sel, empreinte: await calculerEmpreinte(mdp, sel) };
  try {
    localStorage.setItem(CLE_COMPTE, JSON.stringify(compte));
  } catch (erreur) {
    return "Impossible d'enregistrer le compte : le navigateur refuse d'écrire.";
  }
  ecrireSecurite({ echecs: 0, bloqueJusqua: 0 });
  return null;
}

async function seConnecter(identifiant, mdp) {
  // 1. Est-on bloqué ?
  const reste = lireSecurite().bloqueJusqua - Date.now();
  if (reste > 0) {
    return "Trop d'échecs : réessayez dans " + Math.ceil(reste / 1000) + " secondes.";
  }

  // 2. On calcule TOUJOURS l'empreinte, même si l'identifiant est faux : la réponse met
  //    ainsi le même temps, et le message ne dit pas lequel des deux était faux.
  const compte = lireCompte();
  if (compte === null) {
    return "Aucun compte n'existe : rechargez la page.";
  }
  const empreinte = await calculerEmpreinte(mdp, compte.sel);

  // 3. Bon identifiant et bonne empreinte : on remet le compteur à zéro.
  if (identifiant === compte.identifiant && empreinte === compte.empreinte) {
    ecrireSecurite({ echecs: 0, bloqueJusqua: 0 });
    return null;
  }

  // 4. Échec : on le compte (on relit le compteur, il a pu changer pendant le calcul).
  const echecs = lireSecurite().echecs + 1;
  if (echecs >= ECHECS_MAX) {
    ecrireSecurite({ echecs: 0, bloqueJusqua: Date.now() + DUREE_BLOCAGE_MS });
    return "Trop d'échecs : connexion bloquée pendant " + DUREE_BLOCAGE_MS / 1000 + " secondes.";
  }
  ecrireSecurite({ echecs: echecs, bloqueJusqua: 0 });
  return "Identifiant ou mot de passe incorrect (essais restants : " + (ECHECS_MAX - echecs) + ").";
}

// ---------- Passer de l'écran de connexion à l'application ----------

// Prépare l'écran de connexion : « création du compte » si aucun compte n'existe, sinon « connexion ».
function preparerEcranConnexion() {
  const creation = lireCompte() === null;
  titreConnexion.textContent = creation ? "Créer votre compte" : "Connexion";
  boutonConnexion.textContent = creation ? "Créer le compte" : "Se connecter";
  zoneCreation.hidden = !creation;
  // autocomplete aide les gestionnaires de mots de passe à proposer le bon geste
  champMotDePasse.autocomplete = creation ? "new-password" : "current-password";
  messageConnexion.textContent = "";

  // Le calcul d'empreinte n'existe que sur une page « sécurisée » (https, localhost, fichier local).
  if (!window.isSecureContext || !crypto.subtle) {
    messageConnexion.textContent = "Connexion indisponible : ouvrez la page en https ou depuis localhost.";
    boutonConnexion.disabled = true;
  }

  if (creation) {
    mettreAJourForce();
  }
  champIdentifiant.focus();
}

// L'identifiant est écrit avec textContent : même s'il contient des balises, elles s'affichent comme du texte.
function ouvrirSession(identifiant) {
  nomUtilisateur.textContent = identifiant;
  ecranConnexion.hidden = true;
  appli.hidden = false;
  demarrerAppli(); // définie dans app.js : charge et affiche les tâches
}

function fermerSession() {
  arreterAppli(); // définie dans app.js : efface les tâches de l'écran et de la mémoire
  nomUtilisateur.textContent = "";
  appli.hidden = true;
  ecranConnexion.hidden = false;
  formulaireConnexion.reset();
  preparerEcranConnexion();
}

// ---------- Réaction aux formulaires ----------

champMotDePasse.addEventListener("input", () => {
  if (!zoneCreation.hidden) {
    mettreAJourForce();
  }
});

formulaireConnexion.addEventListener("submit", async (evenement) => {
  evenement.preventDefault();
  if (enCours) {
    return;
  }
  enCours = true;
  boutonConnexion.disabled = true;
  messageConnexion.textContent = "";

  const creation = lireCompte() === null;
  const identifiant = champIdentifiant.value.trim();
  let erreur;
  try {
    if (creation) {
      erreur = await creerCompte(identifiant, champMotDePasse.value, champConfirmation.value);
    } else {
      erreur = await seConnecter(identifiant, champMotDePasse.value);
    }
  } catch (exception) {
    erreur = "Erreur inattendue pendant le calcul sécurisé.";
  }

  enCours = false;
  boutonConnexion.disabled = false;

  if (erreur !== null) {
    messageConnexion.textContent = erreur;
    if (!creation) {
      champMotDePasse.value = ""; // après un échec, on efface le mot de passe tapé
    }
    return;
  }
  formulaireConnexion.reset();
  ouvrirSession(identifiant);
});

boutonDeconnexion.addEventListener("click", fermerSession);

// ---------- Démarrage ----------

preparerEcranConnexion();
