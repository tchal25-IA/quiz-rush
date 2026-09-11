# Déploiement de l'API sur Vercel (alternative avancée)

> ⚠️ **Note:** Cette solution est **non recommandée** pour Quiz Rush car elle nécessite des adaptations importantes et a des limitations. Préférez [Render.com](./DEPLOY-RENDER.md).

## Limitations Vercel Serverless

### ❌ Incompatibilités majeures
- **Pas de WebSocket** — les duels temps réel via Socket.io ne fonctionneront pas
- **Timeout 10s** (free tier) — peut être problématique pour les requêtes complexes
- **Cold start** — premières requêtes lentes après inactivité
- **Stateless** — pas de state en mémoire (Redis requis pour les leaderboards)

### ✅ Ce qui fonctionne
- Routes API REST classiques
- Auth JWT
- Prisma (avec Vercel Postgres ou connexion externe)
- Solo quiz, daily challenge, missions, analytics

### ⚠️ Ce qui ne fonctionne PAS
- Duels temps réel (Socket.io `/duel`)
- Leaderboards Redis (sauf si Redis externe comme Upstash)
- Matchmaking duel (nécessite state partagé)

---

## Approche 1: Vercel Functions + Next.js API Routes

### Prérequis
- Compte Vercel
- Base de données PostgreSQL externe (Vercel Postgres, Supabase, Neon, etc.)
- Redis externe (Upstash) pour les leaderboards

### Étapes

#### 1. Créer un projet Next.js dans le monorepo

```bash
cd apps
npx create-next-app@latest api-vercel --typescript --app --no-src-dir
cd api-vercel
```

#### 2. Installer les dépendances

```bash
npm install @prisma/client prisma bcryptjs ioredis jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

#### 3. Copier le schema Prisma

```bash
mkdir -p prisma
cp ../api/prisma/schema.prisma prisma/
cp -r ../api/prisma/migrations prisma/
```

#### 4. Créer les API routes

Créer `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'quiz-rush-api-vercel',
    ts: new Date().toISOString(),
  });
}
```

Créer `app/api/auth/guest/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST() {
  const username = `guest_${Math.random().toString(36).substring(2, 8)}`;
  
  const user = await prisma.user.create({
    data: {
      username,
      isGuest: true,
    },
  });

  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );

  return NextResponse.json({
    accessToken: token,
    user: {
      id: user.id,
      username: user.username,
      isGuest: user.isGuest,
      level: user.level,
      xp: user.xp,
      gems: user.gems,
    },
  });
}
```

#### 5. Middleware d'authentification

Créer `lib/auth.ts`:

```typescript
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function verifyAuth(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = auth.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
  return decoded.id;
}
```

#### 6. Configurer vercel.json

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "installCommand": "npm install && npx prisma generate"
}
```

#### 7. Variables d'environnement Vercel

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add REDIS_URL  # Optionnel (Upstash)
```

#### 8. Déployer

```bash
vercel --prod
```

### Inconvénients de cette approche
- ❌ Refonte complète de l'API (NestJS → Next.js API routes)
- ❌ Pas de duels temps réel (Socket.io incompatible)
- ❌ Complexité accrue (2 stacks différentes)
- ❌ Maintenance doublée

---

## Approche 2: Vercel Postgres + Prisma Accelerate

### Utiliser Vercel Postgres

```bash
vercel postgres create
```

Cela crée une base PostgreSQL serverless sur Vercel.

### Utiliser Prisma Accelerate (cache + connexion pooling)

1. Créer un compte sur https://www.prisma.io/data-platform
2. Connecter la base Vercel Postgres
3. Obtenir l'URL Accelerate (avec cache intégré)
4. Configurer `DATABASE_URL` dans Vercel avec l'URL Accelerate

### Avantages
- ✅ Pas besoin de gérer les connexions DB
- ✅ Cache intégré pour les requêtes fréquentes
- ✅ Edge-ready (déploiement global)

### Inconvénients
- ❌ Coût supplémentaire (Prisma Accelerate)
- ❌ Ne résout pas le problème WebSocket
- ❌ Timeout 10s toujours présent

---

## Approche 3: Hybrid (Vercel + service externe pour duels)

### Architecture
- **Vercel Serverless:** API REST (quiz, auth, missions, analytics, daily challenge)
- **Service externe:** Socket.io pour les duels (Render, Fly.io, Railway)
- **Frontend:** appelle Vercel pour le REST, et le service externe pour les duels

### Avantages
- ✅ Scalabilité maximale pour l'API REST
- ✅ Duels temps réel fonctionnels
- ✅ Séparation des responsabilités

### Inconvénients
- ❌ Complexité élevée (2 backends à maintenir)
- ❌ Coûts doublés
- ❌ Latence accrue (2 connexions réseau)

---

## Recommandation finale

### ✅ Pour Quiz Rush: **Render.com**

**Pourquoi?**
1. ✅ Support complet de NestJS + Socket.io
2. ✅ Pas de refonte du code
3. ✅ Free tier sans CB
4. ✅ Configuration déjà prête (`render.yaml`)
5. ✅ PostgreSQL inclus gratuitement

**Quand Vercel?**
- Si vous avez **déjà** une DB Vercel Postgres
- Si vous acceptez de **supprimer les duels temps réel**
- Si vous voulez une **scalabilité extrême** (pas nécessaire pour un MVP)

### Alternative: **Fly.io**

Si Render ne convient pas:
- Support Docker complet
- Support WebSocket
- Déploiement global (Edge)
- Mais nécessite une CB même pour le free tier

---

## Migration d'urgence vers Vercel

Si vous devez absolument déployer sur Vercel **rapidement** sans refonte:

### Solution temporaire: Vercel + Railway/Render pour Socket.io

1. **Déployer l'API sur Render** (guide: [DEPLOY-RENDER.md](./DEPLOY-RENDER.md))
2. **Garder Vercel pour le web** (déjà fait)
3. **Configurer 2 URLs:**
   - `EXPO_PUBLIC_API_URL=https://quiz-rush-api.onrender.com/api`
   - `EXPO_PUBLIC_WS_URL=https://quiz-rush-api.onrender.com/duel`

### Avantage
- ✅ Tout fonctionne sans refonte
- ✅ Déploiement en 5 minutes
- ✅ Pas de code à modifier

### Inconvénient
- ⚠️ Pas vraiment "Vercel serverless" (mais qui s'en soucie si ça marche?)

---

## Conclusion

**TL;DR:** Ne déployez **pas** l'API sur Vercel serverless pour l'instant.

Utilisez [Render.com](./DEPLOY-RENDER.md) à la place. C'est plus simple, plus rapide, et mieux adapté à la stack actuelle (NestJS + Socket.io).

Si vous devez absolument utiliser Vercel, suivez l'**Approche 3 (Hybrid)** en gardant un service externe pour Socket.io.

---

**Besoin d'aide?** Ouvrir une issue GitHub ou consulter [DEPLOY-RENDER.md](./DEPLOY-RENDER.md) pour la solution recommandée.
