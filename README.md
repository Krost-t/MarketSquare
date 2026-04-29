# 🏪 MarketSquare

> Local marketplace for small businesses  click & collect and short-distance delivery.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🔍 Overview

Small businesses have no simple solution for selling online at a local scale. Large marketplaces are expensive, complex and ill-suited to click & collect or short-distance delivery.

MarketSquare gives them a lightweight, local online storefront. Customers discover nearby shops, place orders and either collect in store or get them delivered.

## ✨ Features

- Public shop catalogue with product pages
- Merchant dashboard to manage products, stock and orders
- Full customer journey: discovery, basket, order, history
- Real-time order tracking (`pending → preparing → delivered / cancelled`)
- Push notifications on mobile
- Favourites and customer reviews (1–5 stars)
- Three roles: `CUSTOMER`, `MERCHANT`, `ADMIN`

## 📦 Stack

| Layer            | Technology                                       |
|------------------|--------------------------------------------------|
| Web frontend     | React 18 · Vite · TypeScript · Tailwind CSS      |
| Mobile           | React Native · Expo · React Navigation           |
| Backend          | Express.js · TypeScript · REST API               |
| Auth             | JWT (web & mobile)                               |
| ORM              | Prisma                                           |
| Database         | PostgreSQL                                       |
| Tests            | Jest · Supertest · Cypress                       |
| CI/CD            | GitHub Actions                                   |
| Containerisation | Docker · docker-compose                          |

## 🏗️ Architecture

```
┌──────────────────┐     ┌─────────────────┐
│  React (Vite)    │     │   Expo (Mobile) │
│       SPA        │     │   Geoloc · Push │
└────────┬─────────┘     └────────┬────────┘
         │                        │
         ▼                        ▼
┌──────────────────────────────────────────┐
│           Express.js  REST API          │
│     RBAC · Zod · Helmet · Rate Limit     │
├──────────────────────────────────────────┤
│                Prisma ORM                │
├──────────────────────────────────────────┤
│              PostgreSQL                  │
└──────────────────────────────────────────┘
```

- **Web**: React SPA built with Vite, consumes the Express REST API directly
- **Mobile**: Expo consumes the Express REST API directly
- **Auth**: JWT issued by Express, used by both web and mobile clients
- **Monorepo**: `/backend`, `/web`, `/mobile`, `packages/shared` (shared TS types, API client)

## ⚙️ Prerequisites

- Node.js ≥ 18
- Docker & Docker Compose
- npm or yarn

## 🚀 Installation

```bash
# Clone the repo
git clone https://github.com/<username>/marketsquare.git
cd marketsquare

# Install dependencies
npm install

# Environment variables
cp .env.example .env
# Fill in the values in .env

# Start services (Postgres)
docker compose up -d

# Apply migrations
npx prisma migrate dev

# Start the backend
cd backend && npm run dev

# Start the web frontend (in another terminal)
cd web && npm run dev
```

The application is available at `http://localhost:5173`

## 🔐 Environment Variables

| Variable          | Description                    | Example                                              |
|-------------------|--------------------------------|------------------------------------------------------|
| `DATABASE_URL`    | PostgreSQL connection URL      | `postgresql://user:pass@localhost:5432/marketsquare` |
| `JWT_SECRET`      | JWT secret key (API/mobile)    | `anothersecret`                                      |
| `CORS_ORIGIN`     | Allowed origins                | `http://localhost:5173`                              |
| `VITE_API_URL`    | Express API URL (web client)   | `http://localhost:4896`                              |

## 📁 Project Structure

```
marketsquare/
├── backend/              # Express REST API + Prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── validators/
│   └── prisma/
│       └── schema.prisma
├── web/                  # React + Vite SPA
│   └── src/
│       ├── pages/
│       ├── components/
│       └── lib/
├── mobile/               # React Native + Expo
│   └── src/
├── packages/
│   └── shared/           # Shared TS types and API client
├── docker-compose.yml
└── .github/
    └── workflows/        # CI/CD GitHub Actions
```

## 🧪 Tests

```bash
# Unit + integration tests (backend)
cd backend && npm run test

# E2e tests (web)
cd web && npm run test:e2e

# Mobile tests
cd mobile && npm run test
```

## 🌍 Deployment

| Service  | Platform          |
|----------|-------------------|
| Backend  | Railway or Render |
| Frontend | Vercel or Netlify |
| Mobile   | Expo EAS Build    |
| Database | Railway or Neon   |

**Branches**: `main` (production), `develop` (staging)  tags `vX.X.X`

## 📄 Licence

MIT  see [LICENSE](LICENSE)
