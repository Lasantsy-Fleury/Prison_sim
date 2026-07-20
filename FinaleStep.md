# Évolution du projet : Transformer le simulateur en un véritable jeu de gestion vivant

La base du projet est déjà entièrement développée (authentification, backend NestJS, PostgreSQL, TypeORM, gestion des détenus, moteur de simulation, carte 2D, système économique, construction, mini-carte, animations, gardiens, événements, etc.).

Je souhaite maintenant franchir une nouvelle étape.

L'objectif n'est plus de créer une simple application de simulation mais un **véritable jeu de gestion de prison vivant**, inspiré de **Prison Architect**, **RimWorld**, **The Sims** et **The Genesis Order** (uniquement pour la fluidité des personnages qui se déplacent librement dans le monde).

Je ne souhaite **pas utiliser Unity, Unreal, Godot, Phaser ou tout autre moteur de jeu**.

Le jeu doit être entièrement développé avec :

* React
* Vite
* TypeScript
* Framer Motion
* Canvas ou SVG si nécessaire
* NestJS
* PostgreSQL

L'architecture actuelle doit être conservée.

Le backend continue de gérer toute la logique métier tandis que le frontend devient un véritable moteur de rendu temps réel.

---

# OBJECTIF

Je veux que lorsque le joueur ouvre le jeu, il ait réellement l'impression que la prison est vivante.

Même sans interaction, des dizaines de personnages doivent vivre leur vie.

Le joueur doit pouvoir rester plusieurs minutes à simplement observer ce qui se passe.

Tous les systèmes doivent fonctionner simultanément.

Le code doit rester propre, modulaire et facilement extensible.

---

# 1. Véritable moteur de jeu

Créer un moteur de jeu léger côté React.

Le moteur doit contenir :

* Game Loop à 60 FPS
* Entity Manager
* Animation Manager
* Sprite Renderer
* Pathfinding
* Collision System léger
* Camera Manager
* Input Manager
* Scheduler
* AI Manager
* Event Bus
* Sound Manager
* Selection Manager

Le moteur doit être totalement indépendant des composants React afin de faciliter l'évolution future.

---

# 2. Système de sprites

Remplacer les simples icônes actuelles par de véritables personnages.

Chaque personnage doit utiliser un sprite animé.

Animations minimales :

* Idle
* Walk
* Run
* Eat
* Sleep
* Fight
* Talk
* Work
* Panic
* Injured
* Arrested

Les animations doivent être fluides.

---

# 3. Créateur d'avatars

Lorsqu'un nouveau détenu est créé, permettre de choisir son apparence.

L'avatar doit être entièrement personnalisable.

Exemples de caractéristiques physiques :

* couleur de peau
* visage
* coiffure
* barbe
* moustache
* lunettes
* tatouages
* cicatrices
* taille
* corpulence
* âge visuel
* vêtements
* accessoires

Créer également plusieurs avatars prédéfinis.

L'apparence physique doit être totalement indépendante de la personnalité.

Les traits psychologiques (orientation sexuelle, tempérament, sociabilité, intelligence, agressivité, empathie, etc.) doivent être gérés séparément comme des caractéristiques de simulation et ne jamais être déduits de l'apparence.

---

# 4. Déplacement intelligent

Les personnages ne doivent plus se téléporter.

Ils doivent marcher.

Ajouter un véritable système de pathfinding utilisant A*.

Les personnages doivent contourner les obstacles.

Ils doivent utiliser les portes.

Ils doivent éviter les zones interdites.

Ils doivent recalculer leur trajet lorsqu'un obstacle apparaît.

---

# 5. Horaires

Chaque personnage possède un planning.

Exemple :

06h Réveil

07h Petit-déjeuner

08h Travail

12h Déjeuner

13h Cour

15h Douche

16h Atelier

18h Dîner

20h Retour cellule

22h Sommeil

Les gardiens possèdent également leurs horaires.

---

# 6. IA comportementale

Chaque détenu prend ses propres décisions.

Ses décisions dépendent de :

* intelligence
* peur
* moral
* agressivité
* fatigue
* faim
* santé
* relations
* discipline
* stress
* réputation
* gang
* historique

Les décisions doivent produire des comportements crédibles.

---

# 7. Besoins

Ajouter un système de besoins.

Chaque détenu possède :

* faim
* fatigue
* hygiène
* stress
* santé
* solitude
* sécurité
* liberté
* confiance
* respect

Ces besoins évoluent en permanence.

Ils influencent les décisions.

---

# 8. Relations sociales

Créer un véritable système social.

Chaque détenu possède :

* amis
* ennemis
* popularité
* influence
* gang
* rivalités
* confiance
* respect

Les relations évoluent automatiquement.

Des gangs peuvent apparaître.

Des conflits peuvent naître.

Des alliances peuvent se créer.

---

# 9. Interactions

Lorsque deux personnages se rencontrent, ils peuvent :

* discuter
* se battre
* échanger
* jouer
* menacer
* recruter
* aider
* voler
* comploter
* partager un repas

Afficher une petite bulle au-dessus des personnages.

---

# 10. Inventaire

Chaque détenu possède un inventaire.

Exemples :

* argent
* nourriture
* téléphone
* arme artisanale
* lettres
* médicaments
* vêtements
* outils
* cigarettes

Les objets influencent les événements.

---

# 11. Animations de la prison

Animer :

* portes
* grillages
* caméras
* alarmes
* lumières
* incendies
* fumée
* explosions
* véhicules
* ascenseurs

---

# 12. Effets visuels

Ajouter :

* cycle jour/nuit
* pluie
* brouillard
* éclairage dynamique
* ombres
* particules
* flashs des alarmes

---

# 13. Caméra

Créer une caméra fluide.

Fonctionnalités :

* zoom
* déplacement
* suivi d'un détenu
* suivi d'un événement
* recentrage automatique

---

# 14. Interface de jeu

Ajouter une interface digne d'un véritable jeu.

Créer :

* HUD
* journal des événements
* objectifs
* missions
* notifications
* statistiques temps réel
* indicateurs au-dessus des personnages
* menu radial
* raccourcis clavier

---

# 15. Sons

Ajouter :

* pas
* portes
* bagarres
* cris
* pluie
* radio des gardiens
* alarmes
* ambiance carcérale

Prévoir un SoundManager permettant d'ajouter facilement de nouveaux sons.

---

# 16. Performances

Le moteur doit pouvoir gérer simultanément :

* 300 détenus
* 100 gardiens
* plusieurs centaines d'objets
* plusieurs milliers d'événements

Le jeu doit rester fluide.

Utiliser :

* spatial partitioning
* object pooling
* interpolation
* culling
* memoization
* optimisation des renders React

---

# 17. Architecture

Créer une architecture professionnelle.

Exemple :

```
src/game/

engine/
entities/
components/
systems/
renderer/
sprites/
animations/
pathfinding/
camera/
physics/
audio/
ui/
events/
ai/
scheduler/
inventory/
economy/
construction/
utils/
```

Chaque système doit être indépendant.

Le code doit respecter SOLID.

Le moteur doit être facilement extensible.

---

# 18. Qualité attendue

Je ne veux pas un simple prototype.

Je veux un projet qui donne réellement l'impression de jouer à un jeu de gestion moderne.

Les animations doivent être fluides.

Les déplacements naturels.

Les personnages doivent sembler vivants.

L'architecture doit être professionnelle, documentée et maintenable.

À chaque étape, privilégier la qualité du code, la modularité, les performances et la possibilité d'ajouter facilement de nouveaux bâtiments, personnages, objets, animations, événements et mécaniques de jeu à l'avenir.
