# 🔒 Simulateur de Prison

Application web full-stack de simulation pénitentiaire. Vous incarnez le **directeur d'une prison virtuelle** : gérez les détenus, faites évoluer la prison jour après jour grâce à un moteur de simulation autonome, et prenez des décisions stratégiques.

## Stack technique

| Couche     | Technologie                                   |
| ---------- | --------------------------------------------- |
| Frontend   | React 18 + Vite + TypeScript                  |
| Backend    | NestJS + TypeScript                           |
| ORM        | TypeORM                                        |
| Base de données | PostgreSQL                               |
| Graphiques | Recharts                                       |
| Requêtes   | Axios + TanStack React Query                   |

## Architecture

```
backend/                 NestJS (API REST, port 3000)
  src/
    auth/                Authentification JWT (register / login)
    inmates/             Détenus + relations entre détenus (entités TypeORM)
    events/              Timeline d'événements de la prison
    prison/              État global de la prison (jour, sécurité, budget)
    simulation/          Moteur de simulation (IA : règles + probabilités)
    decisions/           Décisions du directeur
    stats/               Agrégations + séries temporelles
    common/              Guard JWT + décorateur CurrentUser

frontend/                React + Vite (SPA, port 5173)
  src/
    pages/               Tableau de bord, Détenus, Détail, Timeline, Stats
    components/          Layout, SimControls, InmateCard, EventItem, ...
    api/ hooks/ context/ Client Axios, React Query, AuthContext
```

## Prérequis

- Node.js >= 18
- PostgreSQL (base `prison_sim`, rôle avec droits)

Variables d'environnement (backend/.env) :

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=root1234
DB_NAME=prison_sim
DB_SYNCHRONIZE=true
JWT_SECRET=...
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Le schéma est créé automatiquement au démarrage (`DB_SYNCHRONIZE=true`).

## Lancer le projet

### 1. Backend

```bash
cd backend
npm install
npm run start:dev     # ou npm run start (build + node dist/main)
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev           # http://localhost:5173
```

Ouvrez http://localhost:5173, créez un compte directeur, puis :
- générez des détenus ("Générer 5") ou ajoutez-les un par un ;
- cliquez sur **Avancer 1 jour** (ou **▶ Auto**) pour faire vivre la prison ;
- consultez la **Timeline**, les **Statistiques** et prenez des **décisions**
  (sécurité, déplacement, sanction, récompense, libération) depuis la fiche d'un détenu.

## Fonctionnalités

- **Authentification** JWT (inscription / connexion).
- **Tableau de bord** avec statistiques globales et niveau de menace.
- **Gestion des détenus** : nom, âge, intelligence, peur, agressivité, moral, score de comportement, bloc, relations, historique.
- **Moteur de simulation** : événements quotidiens générés par probabilités
  (tentatives d'évasion, bagarres, alliances, conflits, corruption, changements de comportement).
- **Vie autonome** : chaque simulation est différente, les attributs évoluent selon les événements.
- **Timeline** filtrable et paginée.
- **Journées simulées** avec avancement manuel ou automatique.
- **Statistiques** avec graphiques (activité par jour, répartition des comportements, moyennes, répartition des événements, détenus les plus dangereux).
- **Décisions du directeur** : sécurité, déplacement, sanction, récompense, libération.
