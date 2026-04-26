# ===========================
# ====== STEP 1: BUILD ======
# ===========================
FROM node:22-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma generate
RUN npm run build



# =============================
# ====== STEP 2: PRODUCT ======
# =============================
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated


EXPOSE 4896

CMD ["node", "dist/index.js"]
