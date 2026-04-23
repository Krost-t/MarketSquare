# =============================================================================
# ÉTAPE 1 : BUILD
# On part d'une image Node.js officielle (version 22, variante alpine = légère)
# "AS builder" donne un nom à cette étape pour qu'on puisse s'y référer plus tard
# =============================================================================
FROM node:22-alpine AS builder

# WORKDIR : définit le répertoire de travail à l'intérieur du container
# Toutes les commandes suivantes s'exécutent depuis /app
# Si le dossier n'existe pas, Docker le crée automatiquement
WORKDIR /app

# COPY package*.json ./ : copie package.json ET package-lock.json dans /app
# On les copie EN PREMIER (avant le reste du code) pour une raison importante :
# Docker met en cache chaque instruction. Si package.json n'a pas changé,
# Docker réutilise le cache et ne réinstalle pas les dépendances.
# C'est une optimisation majeure pour accélérer les builds suivants.
COPY package*.json ./

# RUN npm ci : installe toutes les dépendances (dev + production)
# "ci" = "clean install", plus strict que "npm install", idéal pour les builds automatisés
# On a besoin des devDependencies ici car typescript et tsx sont nécessaires pour compiler
RUN npm ci

# On copie les fichiers de configuration TypeScript et Prisma
COPY tsconfig.json ./
COPY prisma.config.ts ./

# On copie le dossier prisma/ qui contient schema.prisma
COPY prisma ./prisma

# On copie le code source TypeScript
COPY src ./src

# RUN npx prisma generate : génère le client Prisma à partir de ton schema.prisma
# Le client généré ira dans ./generated/prisma (comme défini dans ton schema)
# Il doit être généré AVANT la compilation TypeScript car ton code l'importera
RUN npx prisma generate

# RUN npm run build : compile TypeScript → JavaScript
# Lance le script "build": "tsc" de ton package.json
# Le résultat (fichiers .js) sera placé dans ./dist/ (défini dans tsconfig.json)
RUN npm run build

# =============================================================================
# ÉTAPE 2 : PRODUCTION
# On repart d'une image Node.js vierge et propre
# Résultat : l'image finale ne contiendra PAS typescript, tsx, @types/*, etc.
# =============================================================================
FROM node:22-alpine AS production

WORKDIR /app

# On recopie les manifestes de dépendances dans cette nouvelle image
COPY package*.json ./

# On installe UNIQUEMENT les dépendances de production (sans les devDependencies)
# --omit=dev exclut tout ce qui est dans "devDependencies" de package.json
# Cela exclut : typescript, tsx, @types/*, prisma (CLI), dotenv, etc.
RUN npm ci --omit=dev

# COPY --from=builder : copie depuis l'étape "builder" (pas depuis ton PC !)
# On copie le code JavaScript compilé depuis /app/dist de l'étape builder
COPY --from=builder /app/dist ./dist

# On copie le client Prisma généré - c'est nécessaire pour que l'app puisse
# communiquer avec PostgreSQL (c'est le code auto-généré par prisma generate)
COPY --from=builder /app/generated ./generated

# EXPOSE : documente que le container écoute sur le port 3000
# C'est informatif - cela ne publie pas réellement le port sur ta machine
# (c'est la commande "docker run -p" qui fait ça)
EXPOSE 3000

# CMD : la commande exécutée quand le container démarre
# On utilise la forme JSON (tableau) car c'est la forme recommandée
# Elle démarre directement node sans passer par un shell intermédiaire
CMD ["node", "dist/index.js"]
