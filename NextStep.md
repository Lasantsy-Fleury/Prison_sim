La base de l'application est déjà entièrement développée (authentification, backend NestJS, PostgreSQL, TypeORM, gestion des détenus, moteur de simulation, API, etc.).

Je souhaite maintenant transformer cette application en un véritable jeu de gestion visuel, similaire à Prison Architect, tout en restant en 2D et sans utiliser de moteur de jeu.

Objectif :
Créer une interface immersive permettant au joueur de voir évoluer sa prison en temps réel.

Fonctionnalités à développer :

- Une vue principale de la prison en 2D avec un plan interactif composé de cellules, couloirs, cour de promenade, cantine, infirmerie, salle de sécurité, parloir, ateliers et autres bâtiments.
- Les détenus sont représentés par des personnages (sprites ou icônes) qui se déplacent automatiquement selon leur emploi du temps et les événements de la simulation.
- Les gardiens effectuent également leurs rondes et interviennent lors des incidents.
- Chaque bâtiment est cliquable afin d'afficher ses informations, son état, sa capacité et les améliorations disponibles.

Créer un système économique complet :
- Budget de la prison.
- Revenus et dépenses journalières.
- Salaire des employés.
- Coût de construction.
- Coût de maintenance.
- Achat d'équipements.
- Affichage permanent du budget.

Créer un mode Construction permettant :
- Construire de nouveaux bâtiments.
- Agrandir les cellules.
- Ajouter des portes, caméras, clôtures, miradors et postes de garde.
- Déplacer certains bâtiments.
- Afficher une prévisualisation avant la construction.

Créer une interface de jeu moderne comprenant :
- Barre supérieure avec le jour, l'heure, le budget, le nombre de détenus, le niveau de sécurité et le niveau de satisfaction.
- Panneau latéral affichant les événements en temps réel.
- Mini-carte de la prison.
- Contrôles permettant d'accélérer, ralentir ou mettre en pause la simulation.

Les événements générés par le moteur doivent être visibles directement sur la carte :
- bagarres,
- évasions,
- incendies,
- corruption,
- fouilles,
- déplacements,
- soins médicaux.

Ajouter des animations simples (CSS ou Framer Motion) pour les déplacements, constructions et événements afin de rendre la simulation vivante.

Le résultat doit donner l'impression de jouer à un véritable jeu de gestion de prison, avec une interface claire, moderne, responsive et entièrement développée avec React + Vite + TypeScript, en réutilisant le backend existant sans modifier la stack.

---

## ✅ Progression (implémenté)

Les fonctionnalités suivantes ont été ajoutées par-dessus la base de jeu déjà existante
(carte 2D, détenus/gardiens animés, top bar, feed d'événements, contrôles de vitesse,
marqueurs d'événements, animations Framer Motion) :

- **Système économique complet** (backend) : `EconomyService` calcule le bilan journalier
  (subvention + allocations par détenu + production ateliers ; salaires gardiens + maintenance
  des bâtiments) et le déduit du budget à chaque jour (`settleDay`). Endpoint `GET /economy`.
- **Mode Construction** (backend) : catalogue de coûts `GET /buildings/catalog`, création
  `POST /buildings` (coût déduit, bâtiment en `UNDER_CONSTRUCTION` puis achevé au jour suivant),
  agrandissement `PATCH /buildings/:id/expand`. Déplacement via `PATCH /buildings/:id/position`.
- **Mode Construction** (frontend) : `BuildBar` (palette par type + coût, items non
  abordables désactivés), `PrisonMap` avec ghost de prévisualisation suivant le curseur et
  glisser-déposer pour déplacer un bâtiment, `BuildingPanel` avec boutons Améliorer /
  Agrandir / Déplacer, touche Échap pour annuler.
- **Mini-carte** (`MiniMap`) : aperçu réduit avec bâtiments (cliquables), gardiens, détenus
  et indicateur d'événement récent.
- **Panneau Économie** (`EconomyPanel`) : budget, net/jour, détail revenus/dépenses ;
  indicateur net/jour dans la top bar (clic budget ou bouton Économie).
- **Nouveaux événements** : `FIRE`, `MEDICAL`, `SEARCH` (types + icônes + positionnement).
- **Responsive** : barre de construction en ligne défilante, feed qui passe sous la carte,
  mini-carte masquée sur petit écran.

### Vérification
- `npx tsc --noEmit` : ✅ backend (exit 0) et frontend (exit 0).
- `npx vite build` : ✅ frontend (3086 modules, build OK).
- À lancer pour tester en réel : `cd backend && npm run start:dev` puis `cd frontend && npm run dev`.