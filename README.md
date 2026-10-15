# 🏪 MarketSquare

> Local marketplace for small businesses — click & collect and short-distance delivery.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D22.12-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Vite](https://img.shields.io/badge/Vite-8-646CFF)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)

## 🔍 Overview

Small businesses have no simple solution for selling online at a local scale. Large marketplaces are expensive, complex and ill-suited to click & collect or short-distance delivery.

MarketSquare gives them a lightweight, local online storefront. Customers discover nearby shops, place orders and either collect in store or get them delivered.

## ✨ Features

- Public shop catalogue with product pages, search by postal code / city
- Merchant dashboard to manage the shop, products, stock and orders
- Full customer journey: discovery, basket, order, history
- Click & collect (pay on site) or short-distance delivery
- Order tracking (`PENDING → PREPARING → SHIPPED → DELIVERED`, `CANCELLED`, `RETURNED`) with automatic restock
- Basket split into one order per shop, stock reserved atomically at checkout (no overselling)
- Push notifications on mobile (Expo) when an order is received or its status changes
- Favourites and customer reviews (1–5 stars) with automatic rating aggregation
- Admin back-office: stats, users & roles, shop / review moderation, orders
- Three roles: `USER` (customer), `MERCHANT`, `ADMIN`

## 📦 Stack

| Layer            | Technology                                                       |
|------------------|------------------------------------------------------------------|
| Web frontend     | React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · TanStack Query · React Router 7 |
| Mobile           | React Native 0.81 · Expo SDK 54 · React Navigation 7             |
| Backend          | Express 5 · TypeScript 6 · REST API · Zod 4                      |
| Auth             | JWT (httpOnly cookie on web, Bearer token on mobile)             |
| ORM              | Prisma 7 (`@prisma/adapter-pg`)                                   |
| Database         | PostgreSQL 17                                                    |
| Tests            | Jest 30 · Supertest · Cypress 16                                 |
| CI/CD            | GitHub Actions                                                   |
| Containerisation | Docker · docker-compose                                          |

## 🏗️ Architecture

```bash
┌──────────────────┐     ┌─────────────────┐
│  React (Vite)    │     │   Expo (Mobile) │
│       SPA        │     │      Push       │
└────────┬─────────┘     └────────┬────────┘
         │   packages/shared (types + API client)
         ▼                        ▼
┌──────────────────────────────────────────┐
│           Express.js — REST API          │
│     RBAC · Zod · Helmet · Rate Limit     │
├──────────────────────────────────────────┤
│                Prisma ORM                │
├──────────────────────────────────────────┤
│              PostgreSQL                  │
└──────────────────────────────────────────┘
```

- **Web**: React SPA built with Vite, consumes the Express REST API directly (cookie session)
- **Mobile**: Expo consumes the Express REST API directly (token stored in SecureStore)
- **Auth**: JWT issued by Express, used by both web and mobile clients
- **Monorepo**: `/backend`, `/web`, `/mobile`, `packages/shared` (shared TS types, API client, labels/formatters — no runtime dependency)

## ⚙️ Prerequisites

- Node.js ≥ 22.12
- Docker & Docker Compose
- npm

## 🚀 Installation

```bash
# Clone the repo
git clone https://github.com/Krost-t/MarketSquare.git
cd MarketSquare

# Environment variables
cp .env.example .env
cp backend/.env.example backend/.env
cp web/.env.example web/.env
cp mobile/.env.example mobile/.env    # set your machine's LAN IP for a physical device

# Start services (Postgres)
docker compose up -d db

# Backend: install, generate the Prisma client, migrate, seed demo data
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev                            # http://localhost:4896

# Web frontend (in another terminal)
cd web && npm install && npm run dev   # http://localhost:5173

# Mobile (in another terminal)
cd mobile && npm install && npm start  # scan the QR code with Expo Go
```

The whole API can also run in containers: `docker compose up -d --build` (migrations are applied by the `migrate` service, the API is exposed on `http://localhost:3000`).

### Demo accounts (after `npm run seed`)

All passwords are `Password123!`

| Email                          | Role     |
|--------------------------------|----------|
| `admin@marketsquare.dev`       | ADMIN    |
| `client@marketsquare.dev`      | USER     |
| `boulangerie@marketsquare.dev` | MERCHANT |
| `primeur@marketsquare.dev`     | MERCHANT |
| `librairie@marketsquare.dev`   | MERCHANT |

## 🔐 Environment Variables

| Variable                | Description                                   | Example                                              |
|-------------------------|-----------------------------------------------|------------------------------------------------------|
| `DATABASE_URL`          | PostgreSQL connection URL                     | `postgresql://user:pass@localhost:5433/marketsquare` |
| `JWT_SECRET`            | JWT secret key                                | `openssl rand -base64 32`                            |
| `JWT_EXPIRES_IN`        | Token lifetime                                | `7d`                                                 |
| `JWT_COOKIE_EXPIRES_IN` | Cookie lifetime (days)                        | `7`                                                  |
| `EXPRESS_PORT`          | API port                                      | `4896`                                               |
| `CORS_ORIGIN`           | Allowed origins (comma separated)             | `http://localhost:5173`                              |
| `TEST_DATABASE_URL`     | Test database (default: `DATABASE_URL` + `_test`) | `postgresql://…/marketsquare_test`              |
| `VITE_API_URL`          | Express API URL (web client)                  | `http://localhost:4896`                              |
| `EXPO_PUBLIC_API_URL`   | Express API URL (mobile client)               | `http://192.168.1.10:4896`                           |

## 🔌 API

| Resource   | Endpoints |
|------------|-----------|
| Auth       | `POST /auth/register` · `/login` · `/logout` · `/forgot-password` · `/reset-password` |
| User       | `GET /user/user-profile` · `PUT /user/update-profile` · `PATCH /user/change-password` · `DELETE /user/delete-profile` · `PATCH /user/push-token` · `GET/POST/DELETE /user/favorites/:productId` |
| Addresses  | `GET/POST /addresses` · `GET/PATCH/DELETE /addresses/:id` |
| Shops      | `GET /shops?search=&postalCode=&locality=&region=` · `GET /shops/:id` · `/:id/products` · `/:id/reviews` · `GET /shops/mine` · `POST /shops` · `PATCH/DELETE /shops/:id` (owner) |
| Products   | `GET /products?search=&shopId=&minPrice=&maxPrice=&inStock=&sort=` · `GET /products/:id` · `/:id/reviews` · `POST /products` · `PATCH/DELETE /products/:id` (owner) |
| Reviews    | `POST /reviews` · `PATCH/DELETE /reviews/:id` (author) |
| Cart       | `GET /cart` · `POST /cart/items` · `PATCH/DELETE /cart/items/:itemId` · `DELETE /cart` |
| Orders     | `GET /orders` · `GET /orders/:id` · `POST /orders/checkout` · `PATCH /orders/:id/cancel` · `GET /orders/shop/mine` · `PATCH /orders/:id/status` (merchant) |
| Admin      | `GET /admin/dashboard` · `/admin-profile` · `/users-list` · `/user/:id` · `POST /admin/create-user` · `PUT /admin/update-user/:id` · `PATCH /admin/update-user/:id/role` · `DELETE /admin/delete-user/:id` · `GET /admin/reviews-list` · `DELETE /admin/delete-review/:id` · `GET /admin/shops-list` · `DELETE /admin/delete-shop/:id` · `GET /admin/orders-list` |

Lists are paginated with `?page=&limit=` and return `{ data, pagination: { page, limit, total, totalPages } }`.

## 📁 Project Structure

```bash
marketsquare/
├── backend/              # Express REST API + Prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── tests/            # Jest + Supertest
├── web/                  # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── lib/
│   └── cypress/          # E2E tests
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
# Unit + integration tests (backend, uses the "<DATABASE_URL>_test" database, migrated automatically)
cd backend && npm run test

# E2E tests (web) — API (seeded) and web dev server must be running
cd web && npm run test:e2e

# Mobile type checking
cd mobile && npm run typecheck
```

## 🌍 Deployment

| Service  | Platform          |
|----------|-------------------|
| Backend  | Railway or Render |
| Frontend | Vercel or Netlify |
| Mobile   | Expo EAS Build    |
| Database | Railway or Neon   |

The web session cookie is `SameSite=Strict`: serve the API and the web app from the same site (e.g. `api.example.com` and `example.com`).
Push notifications require an EAS project id (`eas init`) and a development or production build.

**Branches**: `main` (production), `develop` (staging) — tags `vX.X.X`

## 📄 Licence

MIT — see [LICENSE](LICENSE)
