Tu es un développeur Full Stack senior. Crée une application web complète de type "Simulateur de Prison".

Stack obligatoire :
- Frontend : React + Vite + TypeScript
- Backend : NestJS + TypeScript
- ORM : TypeORM
- Base de données : PostgreSQL

Concept :
L'utilisateur est le directeur d'une prison virtuelle. Il doit gérer une prison où chaque détenu possède une personnalité et évolue de manière autonome.

Fonctionnalités principales :
- Authentification utilisateur.
- Tableau de bord de la prison avec statistiques globales.
- Gestion des détenus (création, suppression, consultation).
- Chaque détenu possède :
  - nom
  - âge
  - niveau d'intelligence
  - niveau de peur
  - agressivité
  - moral
  - relations avec les autres détenus
  - historique des événements.

Créer un moteur de simulation qui génère automatiquement des événements quotidiens :
- tentatives d'évasion
- bagarres
- alliances entre détenus
- conflits
- corruption du personnel
- changements de comportement.

Le système doit utiliser des algorithmes simples d'intelligence artificielle (règles, probabilités, score de comportement) pour faire évoluer les détenus selon leurs caractéristiques.

Ajouter :
- une timeline des événements de la prison ;
- un système de journées simulées ;
- une page de statistiques avec graphiques ;
- un système de décisions du directeur (augmenter la sécurité, déplacer un détenu, sanctionner, récompenser).

L'objectif est que chaque simulation soit différente et que les détenus semblent avoir une vie autonome.

Respecte une architecture propre et professionnelle avec séparation frontend/backend, DTO, entities TypeORM, services NestJS et composants React réutilisables.