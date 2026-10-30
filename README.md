# TaskFlow

Mini-application web de gestion de tâches, construite en trinôme avec l'aide de l'IA
(cours Outils IA · Bachelor 1).

- **Binôme :** _Jean-Baptiste, William, Mathias_
- **Filière :** Cybersécurité
- **Technologies :** HTML, CSS, JavaScript

## Cahier des charges

### Fonctionnalités de base

| Fonction | Description |
|---|---|
| Créer | Ajouter une tâche (titre, priorité, échéance). Un titre vide est refusé. |
| Afficher | Voir toutes les tâches, avec leur priorité et leur date. |
| Modifier | Changer le titre, la priorité ou la date d'une tâche existante. |
| Terminer | Cocher une tâche faite : elle apparaît barrée. |
| Supprimer | Retirer une tâche de la liste. |
| Sauvegarder | Retrouver ses tâches après avoir fermé le navigateur (`localStorage`). |

### Fonctionnalité filière : Cybersécurité

**Écran de connexion** : l'utilisateur doit se connecter avant d'accéder à ses tâches.

**Contrôle de robustesse du mot de passe** : un mot de passe n'est accepté que s'il respecte
les 5 règles suivantes.

1. Au moins 12 caractères.
2. Au moins 1 lettre minuscule.
3. Au moins 1 lettre majuscule.
4. Au moins 1 chiffre.
5. Au moins 2 caractères spéciaux (ni lettre, ni chiffre).

**Jauge de robustesse** : un indicateur affiche la force du mot de passe saisi (faible, moyen
ou fort). _Règle de passage d'un niveau à l'autre : à définir._

**Bonus** : blocage de la connexion après 3 échecs.

#### Décisions à confirmer

- « Mélanger » signifie au moins 1 caractère de chaque type (et non plus).
- Liste des caractères spéciaux acceptés : _à fixer (par exemple `! @ # $ % & * -`)_.
- Deux fois le même caractère spécial compte pour 2.

### Cadre technique

- HTML, CSS et JavaScript, sans framework.
- `localStorage` pour la sauvegarde.
- Pas de serveur ni de base de données.
- Pas de bibliothèque externe.
- Pas de données personnelles réelles dans l'application.

## User stories

_À compléter après l'étape 2 (5 à 8 user stories obtenues avec l'IA, en au moins 3 itérations).
Format : « En tant que [rôle], je veux [action], afin de [objectif] »._

## Journal des prompts

Voir [Le prompt](PROMPT.md).
