# Recettes – README principal

🚀 Cloud-first: backend sur Firebase Functions + Firestore/Storage, front servi par Firebase Hosting (rewrite `/api/**` vers la fonction). Les instructions Docker ci-dessous restent pour archivage mais ne sont plus la voie principale.
<img width="992" height="629" alt="image" src="https://github.com/user-attachments/assets/8a9a88d2-81fe-42ee-9843-124643f87f4d" />
<img width="909" height="632" alt="image" src="https://github.com/user-attachments/assets/7dda72a1-6cd7-4066-803a-9a65fe4ddbc9" />
<img width="1316" height="615" alt="image" src="https://github.com/user-attachments/assets/87fa7d5c-54d9-4b50-919b-978c75f15eef" />


## Aperçu
- Frontend: `recettes_front` (React + Vite, livré via Nginx en Docker)
- Backend: `recettes_back` (Express, API REST sous `/api`)
- Base de données: `MongoDB` + UI `mongo-express`
- Seed automatique des catégories via `mongo-init/categories.js`

## Architecture
- `recettes_front`: SPA compilée et servie par Nginx dans le conteneur
- `recettes_back`: API Node/Express, connexion à MongoDB via `MONGODB_URI`
- `mongodb`: base `recette`, init et seed configurables
- `mongo-express`: interface d’administration web

## Services et ports (host → container)
- Frontend: `http://localhost:8005` → `80`
- Backend API: `http://localhost:5000` → `5000` (API sous `/api`)
- Mongo Express: `http://localhost:8087` → `8081`
- MongoDB: `localhost:27017` → `27017`

## Prérequis
- Docker et Docker Compose installés
- Ports `8005`, `5000`, `8087`, `27017` libres sur la machine

## Démarrage rapide (Docker)
1. Construire et lancer:
   - `docker compose up -d --build`
2. Vérifier les logs:
   - Backend: `docker compose logs -f recettes_back`
   - Frontend: `docker compose logs -f recettes_front`
3. Ouvrir l’application:
   - Frontend: `http://localhost:8005`
   - API: `http://localhost:5000/api`
   - Mongo Express: `http://localhost:8087`

## Variables d’environnement (principales)
- Configurées dans `docker-compose.yml` (service `recettes_back`):
  - `PORT=5000`
  - `NODE_ENV=production`
  - `JWT_SECRET=changeme` (à remplacer)
  - `MONGODB_URI=mongodb://admin:pass@mongodb:27017/recette?authSource=admin`
- Frontend (build arg):
  - `VITE_API_URL` (par défaut `http://localhost:5000/api`)

## Données de démarrage (seed)
- Script: `mongo-init/categories.js`
- Deux modes:
  - Init DB (premier démarrage): monté sur `/docker-entrypoint-initdb.d`, exécuté automatiquement.
  - Job ponctuel (idempotent): service `mongo-seed` exécute le seed même si la DB existe.
- Relancer le seed à la demande:
  - `docker compose up -d --build mongo-seed`

## Développement
- Backend (local, hors Docker):
  - `cd recettes_back`
  - Installer: `npm install`
  - Lancer: `npm run dev`
- Frontend (local, hors Docker):
  - `cd recettes_front`
  - Installer: `npm install`
  - Lancer: `npm run dev`
  - Adapter `VITE_API_URL` dans `.env` si nécessaire.

## Commandes utiles
- Lister services: `docker compose ps`
- Arrêter: `docker compose down`
- Redémarrer un service: `docker compose up -d --build <service>`
- Logs temps réel: `docker compose logs -f <service>`

## Dépannage
- Backend ne se connecte pas à MongoDB:
  - Vérifier `MONGODB_URI` dans `docker-compose.yml`
  - Confirmer que `recettes_mongodb` est `Up`: `docker compose ps`
  - Consulter logs Mongo: `docker compose logs -f mongodb`
- Frontend ne joint pas l’API:
  - Confirmer `recettes_back` sur `http://localhost:5000`
  - Adapter `VITE_API_URL` (build arg ou `.env` en dev)
- Conflits de ports:
  - Modifier les mappages dans `docker-compose.yml` puis reconstruire

## Personnalisation
- Changer le port frontend (host): éditer `ports` du service `recettes_front` (ex. `8081:80`).
- Protéger l’API: mettre un `JWT_SECRET` fort et gérer CORS selon besoin.
- Ajouter d’autres seeds: créer des scripts dans `mongo-init` et les appeler via un job similaire à `mongo-seed`.
