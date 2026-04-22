# 🏪 MarketSquare

> Marketplace locale pour petits commerçants — click & collect et livraison courte distance.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## 🔍 Aperçu

Les petits commerçants n'ont pas de solution simple pour vendre en ligne à l'échelle locale. Les grandes marketplaces sont coûteuses, complexes et inadaptées au click & collect ou à la livraison courte distance.

MarketSquare leur offre une vitrine en ligne légère et locale. Les clients découvrent les boutiques autour d'eux, commandent et récupèrent leurs achats en magasin ou se font livrer.

---

## ✨ Fonctionnalités

- Catalogue public des commerces avec pages produits optimisées pour le SEO
- Dashboard commerçant pour gérer produits, stocks et commandes
- Parcours client complet : découverte, panier, commande, historique
- Suivi des commandes en temps réel (`en attente → préparée → livrée / annulée`)
- Notifications push sur mobile
- Système de favoris et d'avis clients (1–5 étoiles)
- Trois rôles : `CUSTOMER`, `MERCHANT`, `ADMIN`

---

## 📦 Stack

| Couche           | Technologie                                                        |
|------------------|--------------------------------------------------------------------|
| Frontend web     | Next.js 14 (App Router, SSR, ISR, RSC) · TypeScript · CSS Modules |
| Mobile           | React Native · Expo · React Navigation                             |
| Backend          | Express.js · TypeScript · REST API                                 |
| Auth             | NextAuth.js (web) · JWT custom (mobile)                            |
| ORM              | Prisma                                                             |
| Base de données  | PostgreSQL                                                         |
| Tests            | Jest · Supertest · Cypress                                         |
| CI/CD            | GitHub Actions                                                     |
| Conteneurisation | Docker · docker-compose                                            |

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌─────────────────┐
│   Next.js (Web)  │     │   Expo (Mobile) │
│  SSR · ISR · RSC │     │   Géoloc · Push │
└────────┬─────────┘     └────────┬────────┘
         │ BFF (API Routes)       │
         ▼                        │
┌────────────────────────────────▼─────────┐
│           Express.js — REST API          │
│     RBAC · Zod · Helmet · Rate Limit     │
├──────────────────────────────────────────┤
│                Prisma ORM                │
├──────────────────────────────────────────┤
│              PostgreSQL                  │
└──────────────────────────────────────────┘
```

- **Web** : Next.js SSR/ISR pour les pages publiques, RSC pour le dashboard, BFF via API Routes vers Express
- **Mobile** : Expo consomme directement l'API REST Express
- **Auth** : NextAuth.js côté web, JWT émis par Express côté mobile
- **Monorepo** : `/backend`, `/web`, `/mobile`, `packages/shared` (types TS partagés, client API)

---

## ⚙️ Prérequis

- Node.js ≥ 18
- Docker & Docker Compose
- npm ou yarn

---

## 🚀 Installation

```bash
# Cloner le repo
git clone https://github.com/<username>/marketsquare.git
cd marketsquare

# Installer les dépendances
npm install

# Variables d'environnement
cp .env.example .env
# Remplir les valeurs dans .env

# Lancer les services (Postgres)
docker compose up -d

# Appliquer les migrations
npx prisma migrate dev

# Lancer le backend
cd backend && npm run dev

# Lancer le frontend web (dans un autre terminal)
cd web && npm run dev
```

L'application est accessible sur `http://localhost:3000`.

---

## 🔐 Variables d'environnement

| Variable          | Description                  | Exemple                                              |
|-------------------|------------------------------|------------------------------------------------------|
| `DATABASE_URL`    | URL de connexion PostgreSQL  | `postgresql://user:pass@localhost:5432/marketsquare` |
| `NEXTAUTH_SECRET` | Clé secrète NextAuth.js      | `supersecret`                                        |
| `NEXTAUTH_URL`    | URL de l'app Next.js         | `http://localhost:3000`                              |
| `JWT_SECRET`      | Clé secrète JWT (API/mobile) | `anothersecret`                                      |
| `CORS_ORIGIN`     | Origines autorisées          | `http://localhost:3000`                              |

---

## 📁 Structure du projet

```
marketsquare/
├── backend/              # API REST Express + Prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── validators/
│   └── prisma/
│       └── schema.prisma
├── web/                  # Next.js 14 App Router
│   └── src/
│       ├── app/
│       ├── components/
│       └── lib/
├── mobile/               # React Native + Expo
│   └── src/
├── packages/
│   └── shared/           # Types TS et client API partagés
├── docker-compose.yml
└── .github/
    └── workflows/        # CI/CD GitHub Actions
```

---

## 🧪 Tests

```bash
# Tests unitaires + intégration (backend)
cd backend && npm run test

# Tests e2e (web)
cd web && npm run test:e2e

# Tests mobile
cd mobile && npm run test
```

---

## 🌍 Déploiement

| Service  | Plateforme        |
|----------|-------------------|
| Backend  | Railway ou Render |
| Frontend | Vercel            |
| Mobile   | Expo EAS Build    |
| BDD      | Railway ou Neon   |

**Branches** : `main` (production), `develop` (staging) — tags `vX.X.X`.

---

## 📄 Licence

MIT — voir [LICENSE](LICENSE).