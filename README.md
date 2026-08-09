# Quiz Rush

**Le TikTok de la connaissance** — sessions 3 min / 10 QCM, combos x1→x5, jokers, duels temps réel, classements.

Monorepo MVP : **Expo (mobile)** + **NestJS (API)** + **Prisma/PostgreSQL** + **Redis** + **Socket.io**.

## Structure

```
quiz-rush/
  apps/api/          # NestJS + Prisma + Socket.io
  apps/mobile/       # Expo Router (iOS / Android / web)
  packages/shared/   # Combos, XP, types, constantes
  docker-compose.yml # Postgres 16 + Redis 7
  scripts/setup-local.sh
```

## Prérequis

- Node.js ≥ 20
- Docker **ou** PostgreSQL 16 + Redis (Homebrew)

## Démarrage rapide

```bash
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh

# Terminal 1 — API
npm run dev:api

# Terminal 2 — Mobile
npm run dev:mobile
```

API : `http://localhost:3000/api/health`  
Mobile : Expo Dev Tools (scan QR / iOS Simulator / web).

### Variables d’environnement

Voir [`apps/api/.env.example`](apps/api/.env.example).

Par défaut :

- `DATABASE_URL=postgresql://quizrush:quizrush@localhost:5432/quizrush`
- `REDIS_URL=redis://localhost:6379` (fallback mémoire si Redis down)
- `JWT_SECRET=quiz-rush-dev-secret-change-me`

## Fonctionnalités MVP

| Module | Détail |
|--------|--------|
| Auth | Guest 1-tap + register/login JWT + claim compte invité + onboarding |
| Solo | 10 Q, chrono 10s, feedback serveur, combos, feedback visuel web/mobile |
| Jokers | 50/50, +5s, Communauté (1/partie) + recharge 6h / gems / pub stub |
| Duel | Matchmaking ≤30s, Socket.io `/duel`, Niv. ≥5 + **entraînement bot** |
| Défi ami | Code + lien 24h, mêmes questions, score à battre |
| Classements | Redis sorted sets global + hebdo |
| Progression | Niveaux 1–50, XP, streak + rappel navigateur |
| Missions | Progression + claim manuel des récompenses |
| Contenu | 5 catégories, ~25 questions uniques / catégorie |
| Viralité | Partage score + défi ami |
| Analytics | `POST /api/analytics/events` + funnel 7j |

## Scripts npm (racine)

- `npm run dev:api` — Nest watch
- `npm run dev:mobile` — Expo
- `npm run db:migrate` — Prisma migrate deploy
- `npm run db:seed` — seed questions / missions
- `npm run docker:up` — Postgres + Redis

## API utile

- `POST /api/auth/guest`
- `POST /api/auth/register` · `POST /api/auth/login`
- `GET /api/users/me`
- `GET /api/quiz/categories`
- `POST /api/quiz/solo/start`
- `POST /api/quiz/solo/:id/answer`
- `POST /api/quiz/solo/:id/joker`
- `POST /api/duel/queue`
- `GET /api/leaderboard?type=global|weekly`
- `GET /api/missions`

## Stack

React Native (Expo) · NestJS · Prisma · PostgreSQL · Redis · Socket.io · JWT

F2P éthique : **pas de pay-to-win** (jamais acheter la bonne réponse).

## Déploiement

| Service | URL |
|---------|-----|
| GitHub | https://github.com/tchal25-IA/quiz-rush |
| App web (Vercel) | https://quiz-rush-web.vercel.app |
| API (Railway) | https://api-production-55416.up.railway.app/api |
| Health | https://api-production-55416.up.railway.app/api/health |

Infra Railway : Postgres + Redis + service `api` (Docker).  
Front web : Vercel (Expo static export).

