# 🏗️ Architecture Technique - Quiz Rush

## 📐 Vue d'Ensemble

Quiz Rush adopte une architecture **mobile-first** avec une séparation claire entre le client (React Native) et le serveur (NestJS). L'application est conçue pour **scaler** de 1K à 10M+ utilisateurs avec des performances optimales.

```
┌──────────────────────────────────────────────────────────────┐
│                        UTILISATEURS                           │
│                  (iOS / Android / Web)                        │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ HTTPS / WSS
                         │
┌────────────────────────┴─────────────────────────────────────┐
│                    CLOUDFLARE CDN                             │
│          (Assets statiques, Images, Animations)              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │
┌────────────────────────┴─────────────────────────────────────┐
│                     LOAD BALANCER                             │
│                    (AWS ALB / ELB)                            │
└──────────────┬─────────────────────┬──────────────────────────┘
               │                     │
        ┌──────▼──────┐       ┌─────▼──────┐
        │  API Server │       │ WebSocket  │
        │   (NestJS)  │◄─────►│   Server   │
        │             │       │ (Socket.io)│
        └──────┬──────┘       └─────┬──────┘
               │                    │
               │    ┌───────────────┘
               │    │
        ┌──────▼────▼──────┐
        │   REDIS CACHE    │
        │  (Sessions +     │
        │   Duels temps    │
        │     réel)        │
        └──────────────────┘
               │
               │
        ┌──────▼──────────────────┐
        │   POSTGRESQL DATABASE    │
        │   (Users, Questions,     │
        │    Scores, UGC)          │
        └──────────────────────────┘
               │
               │
        ┌──────▼──────────────────┐
        │    EXTERNAL SERVICES     │
        │  - OpenAI (Modération)   │
        │  - Mixpanel (Analytics)  │
        │  - Sentry (Monitoring)   │
        │  - Firebase (Push)       │
        └──────────────────────────┘
```

## 📱 Architecture Mobile (React Native)

### Structure des Dossiers

```
mobile/src/
├── components/           # Composants UI réutilisables
│   ├── atoms/           # Boutons, Inputs, Textes
│   ├── molecules/       # QuestionCard, ComboDisplay
│   └── organisms/       # QuizGame, Leaderboard
│
├── screens/             # Écrans de l'application
│   ├── Auth/           # Login, Register, Onboarding
│   ├── Home/           # Dashboard principal
│   ├── Quiz/           # QuizGame, QuizResults
│   ├── Duel/           # DuelLobby, DuelGame
│   └── Profile/        # UserProfile, Settings
│
├── navigation/          # Configuration navigation
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
│
├── store/               # Redux Toolkit
│   ├── slices/         # auth, quiz, user, duel
│   ├── api/            # RTK Query endpoints
│   └── store.ts        # Configuration store
│
├── services/            # Services externes
│   ├── api.ts          # Axios instance
│   ├── websocket.ts    # Socket.io client
│   └── analytics.ts    # Mixpanel wrapper
│
├── hooks/               # Custom React Hooks
│   ├── useQuiz.ts
│   ├── useDuel.ts
│   └── useCombo.ts
│
├── utils/               # Utilitaires
│   ├── formatters.ts   # Date, Score formatting
│   ├── validators.ts   # Form validation
│   └── constants.ts    # Constantes app
│
└── assets/              # Ressources statiques
    ├── images/
    ├── fonts/
    ├── animations/     # Lottie files
    └── sounds/         # Feedback audio
```

### Flux de Données (Redux Toolkit)

```typescript
// Example: Quiz State Management
{
  quiz: {
    currentQuestion: Question | null,
    questionIndex: 0,
    combo: 0,
    score: 0,
    answers: Answer[],
    jokers: {
      fiftyFifty: { available: true, used: false },
      extraTime: { available: true, used: false },
      community: { available: true, used: false }
    },
    timer: 10,
    status: 'idle' | 'playing' | 'finished'
  },
  
  user: {
    id: string,
    username: string,
    level: number,
    xp: number,
    gems: number,
    streak: number,
    stats: UserStats
  },
  
  duel: {
    roomId: string | null,
    opponent: User | null,
    myScore: number,
    opponentScore: number,
    status: 'searching' | 'ready' | 'playing' | 'finished'
  }
}
```

### Navigation Structure

```
Root Navigator
├── Auth Stack (non authentifié)
│   ├── Welcome
│   ├── Login
│   └── Register
│
└── Main Tabs (authentifié)
    ├── Home Tab
    │   ├── Dashboard
    │   ├── CategorySelection
    │   └── QuizGame
    │
    ├── Duel Tab
    │   ├── DuelLobby
    │   ├── DuelMatchmaking
    │   └── DuelGame
    │
    ├── Create Tab
    │   ├── CreateQuestion (locked until level 10)
    │   └── MyQuestions
    │
    └── Profile Tab
        ├── UserProfile
        ├── Settings
        └── Stats
```

## 🖥️ Architecture Backend (NestJS)

### Structure des Modules

```
backend/src/
├── main.ts                      # Point d'entrée
│
├── modules/                     # Modules fonctionnels
│   ├── auth/                   # Authentification & JWT
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/         # JWT, Local
│   │   └── guards/             # AuthGuard, RolesGuard
│   │
│   ├── user/                   # Gestion utilisateurs
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── dto/                # CreateUserDto, UpdateUserDto
│   │
│   ├── quiz/                   # Core gameplay
│   │   ├── quiz.controller.ts
│   │   ├── quiz.service.ts
│   │   ├── question.service.ts
│   │   └── scoring.service.ts  # Calculs combos & points
│   │
│   ├── duel/                   # Mode Duel temps réel
│   │   ├── duel.gateway.ts     # WebSocket handler
│   │   ├── duel.service.ts
│   │   └── matchmaking.service.ts
│   │
│   ├── ugc/                    # User Generated Content
│   │   ├── ugc.controller.ts
│   │   ├── ugc.service.ts
│   │   └── moderation.service.ts # OpenAI integration
│   │
│   ├── leaderboard/            # Classements
│   │   ├── leaderboard.controller.ts
│   │   └── leaderboard.service.ts # Redis sorted sets
│   │
│   └── analytics/              # Métriques & événements
│       ├── analytics.service.ts
│       └── events.service.ts
│
├── common/                      # Code partagé
│   ├── decorators/             # @CurrentUser, @Roles
│   ├── filters/                # Exception filters
│   ├── guards/                 # Auth, throttle
│   ├── interceptors/           # Logging, Transform
│   └── pipes/                  # Validation pipes
│
├── config/                      # Configuration
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── openai.config.ts
│
└── database/                    # Prisma ORM
    ├── prisma.service.ts
    ├── schema.prisma           # Database schema
    └── migrations/             # SQL migrations
```

### API Endpoints Principaux

#### Authentication
```
POST   /api/auth/register       # Créer compte
POST   /api/auth/login          # Se connecter
POST   /api/auth/refresh        # Refresh JWT token
GET    /api/auth/me             # User actuel
```

#### Quiz (Solo)
```
GET    /api/quiz/categories              # Lister catégories
POST   /api/quiz/session/start           # Démarrer partie
POST   /api/quiz/session/:id/answer      # Soumettre réponse
POST   /api/quiz/session/:id/joker       # Utiliser joker
POST   /api/quiz/session/:id/finish      # Terminer partie
GET    /api/quiz/questions/:id           # Détails question
```

#### Duel (Multiplayer)
```
WebSocket: /ws/duel

Events:
- matchmaking:start          # Chercher adversaire
- matchmaking:found          # Adversaire trouvé
- duel:question              # Nouvelle question
- duel:answer                # Réponse joueur
- duel:opponent_answer       # Réponse adversaire
- duel:finish                # Fin du duel
```

#### User Generated Content
```
POST   /api/ugc/questions                # Créer question
GET    /api/ugc/questions/my             # Mes questions
GET    /api/ugc/questions/:id            # Détails question
PUT    /api/ugc/questions/:id            # Modifier question
DELETE /api/ugc/questions/:id            # Supprimer question
POST   /api/ugc/questions/:id/report     # Signaler question
```

#### Leaderboard
```
GET    /api/leaderboard/global           # Top 100 global
GET    /api/leaderboard/friends          # Classement amis
GET    /api/leaderboard/category/:id     # Par catégorie
GET    /api/leaderboard/weekly           # Événement semaine
```

## 🗄️ Schéma Base de Données (PostgreSQL)

### Tables Principales

```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String
  
  level         Int       @default(1)
  xp            Int       @default(0)
  gems          Int       @default(0)
  
  streak        Int       @default(0)
  lastPlayed    DateTime?
  
  isPremium     Boolean   @default(false)
  premiumUntil  DateTime?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      QuizSession[]
  duels         Duel[]
  questions     Question[]    // UGC
  achievements  UserAchievement[]
  
  @@index([username])
  @@index([level])
}

model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  icon        String
  color       String
  order       Int
  
  questions   Question[]
  
  @@index([slug])
}

model Question {
  id              String    @id @default(cuid())
  
  text            String
  answerA         String
  answerB         String
  answerC         String
  answerD         String
  correctAnswer   String    // 'A' | 'B' | 'C' | 'D'
  explanation     String?
  
  difficulty      String    // 'easy' | 'medium' | 'hard'
  
  categoryId      String
  category        Category  @relation(fields: [categoryId], references: [id])
  
  // User Generated Content
  isUGC           Boolean   @default(false)
  authorId        String?
  author          User?     @relation(fields: [authorId], references: [id])
  
  status          String    @default("active") // 'active' | 'beta' | 'rejected'
  
  // Stats validation communautaire
  timesShown      Int       @default(0)
  correctAnswers  Int       @default(0)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([categoryId])
  @@index([difficulty])
  @@index([isUGC, status])
}

model QuizSession {
  id            String    @id @default(cuid())
  
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  categoryId    String
  
  score         Int       @default(0)
  maxCombo      Int       @default(0)
  correctCount  Int       @default(0)
  
  answers       Answer[]
  
  xpGained      Int       @default(0)
  gemsGained    Int       @default(0)
  
  startedAt     DateTime  @default(now())
  finishedAt    DateTime?
  
  @@index([userId])
  @@index([startedAt])
}

model Answer {
  id              String      @id @default(cuid())
  
  sessionId       String
  session         QuizSession @relation(fields: [sessionId], references: [id])
  
  questionId      String
  userAnswer      String
  correctAnswer   String
  isCorrect       Boolean
  
  comboAtTime     Int
  pointsEarned    Int
  timeSpent       Int         // secondes
  
  jokerUsed       String?     // 'fiftyFifty' | 'extraTime' | 'community'
  
  createdAt       DateTime    @default(now())
  
  @@index([sessionId])
}

model Duel {
  id              String    @id @default(cuid())
  
  player1Id       String
  player1         User      @relation(fields: [player1Id], references: [id])
  
  player2Id       String
  
  player1Score    Int       @default(0)
  player2Score    Int       @default(0)
  
  winnerId        String?
  
  categoryId      String
  
  startedAt       DateTime  @default(now())
  finishedAt      DateTime?
  
  @@index([player1Id])
  @@index([startedAt])
}

model Achievement {
  id            String    @id @default(cuid())
  name          String
  description   String
  icon          String
  rarity        String    // 'common' | 'rare' | 'epic' | 'legendary'
  
  condition     Json      // Conditions de déblocage
  
  users         UserAchievement[]
}

model UserAchievement {
  id              String      @id @default(cuid())
  
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  
  achievementId   String
  achievement     Achievement @relation(fields: [achievementId], references: [id])
  
  unlockedAt      DateTime    @default(now())
  
  @@unique([userId, achievementId])
  @@index([userId])
}
```

## 🔴 Redis Cache Structure

### Keys & Data Structures

```typescript
// Sessions utilisateur
user:session:{userId}
// Type: Hash
// TTL: 24h
// Data: { token, refreshToken, expiresAt }

// Classements temps réel
leaderboard:global
leaderboard:category:{categoryId}
leaderboard:weekly
// Type: Sorted Set (ZADD, ZRANGE)
// Score: points utilisateur
// Member: userId

// Matchmaking Duel
duel:queue:{categoryId}
// Type: List (LPUSH, RPOP)
// Data: userId en attente

// Duel Room (partie en cours)
duel:room:{duelId}
// Type: Hash
// TTL: 10 minutes
// Data: { player1, player2, questions, currentIndex, scores }

// Rate Limiting
ratelimit:{userId}:{endpoint}
// Type: String (counter)
// TTL: 1 minute
// Data: nombre de requêtes

// Question Cache (fréquemment accédées)
question:{questionId}
// Type: Hash
// TTL: 1 heure
// Data: Question complète
```

## 🔌 WebSocket Architecture (Duels)

### Events Flow

```typescript
// Client → Server
{
  event: 'matchmaking:start',
  data: { categoryId, userId }
}

// Server → Client (30s max)
{
  event: 'matchmaking:found',
  data: {
    duelId,
    opponent: { id, username, level },
    questions: Question[]  // 10 questions
  }
}

// Client → Server (chaque réponse)
{
  event: 'duel:answer',
  data: {
    duelId,
    questionIndex,
    answer: 'A',
    timeSpent: 7  // secondes
  }
}

// Server → Both Clients
{
  event: 'duel:opponent_answer',
  data: {
    questionIndex,
    wasCorrect: true,
    currentScore: 450
  }
}

// Server → Both Clients (après Q10)
{
  event: 'duel:finish',
  data: {
    winner: 'player1',
    scores: { player1: 850, player2: 720 },
    xpGained: 200,
    gemsGained: 50
  }
}
```

### Matchmaking Algorithm

```typescript
// Simple FIFO matchmaking avec timeout
class MatchmakingService {
  async findMatch(userId: string, categoryId: string): Promise<Duel> {
    // Ajouter à la queue
    await redis.lpush(`duel:queue:${categoryId}`, userId);
    
    // Attendre 30s max
    const timeout = Date.now() + 30000;
    
    while (Date.now() < timeout) {
      const queueLength = await redis.llen(`duel:queue:${categoryId}`);
      
      if (queueLength >= 2) {
        // Pop 2 joueurs
        const [player1, player2] = await redis.rpop(`duel:queue:${categoryId}`, 2);
        
        // Créer duel
        return this.createDuel(player1, player2, categoryId);
      }
      
      await sleep(500);
    }
    
    // Timeout: Retirer de la queue
    await redis.lrem(`duel:queue:${categoryId}`, 1, userId);
    throw new Error('No opponent found');
  }
}
```

## 🤖 IA Modération (OpenAI)

### Validation Questions UGC

```typescript
class ModerationService {
  async moderateQuestion(question: CreateQuestionDto): Promise<ModerationResult> {
    const prompt = `
Analyse cette question de quiz et vérifie:
1. Pas de contenu offensant, NSFW, politique controversé
2. Question claire et sans ambiguïté
3. Réponses cohérentes (1 seule correcte, 3 fausses plausibles)
4. Explication factuelle si fournie

Question: ${question.text}
A) ${question.answerA}
B) ${question.answerB}
C) ${question.answerC}
D) ${question.answerD}
Réponse correcte: ${question.correctAnswer}

Réponds en JSON:
{
  "approved": boolean,
  "reason": string,
  "suggestions": string[]
}
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
}
```

## 📊 Monitoring & Observabilité

### Sentry (Error Tracking)

```typescript
// Mobile
Sentry.init({
  dsn: SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.1
});

// Backend
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(err => {
        Sentry.captureException(err);
        return throwError(() => err);
      })
    );
  }
}
```

### Métriques Clés (CloudWatch + Mixpanel)

```typescript
// Performance
- API response time (p50, p95, p99)
- Database query time
- WebSocket latency
- Mobile app startup time

// Business
- DAU, WAU, MAU
- Session length
- Questions answered per session
- Combo x3+ rate
- Duel completion rate
- UGC submission rate

// Technique
- Error rate (%)
- Crash-free rate (%)
- API availability (%)
- Cache hit rate (%)
```

## 🚀 Déploiement & Scaling

### Infrastructure AWS

```yaml
Production Setup:

Load Balancer:
  - Application Load Balancer (ALB)
  - Health checks /api/health
  - SSL/TLS termination

API Servers:
  - ECS Fargate (auto-scaling)
  - Min: 2 tasks
  - Max: 20 tasks
  - CPU threshold: 70%

WebSocket Servers:
  - ECS Fargate (sticky sessions)
  - Min: 2 tasks
  - Max: 10 tasks

Database:
  - RDS PostgreSQL 15
  - Multi-AZ
  - Read replicas: 2

Cache:
  - ElastiCache Redis 7
  - Cluster mode enabled
  - 3 nodes

CDN:
  - Cloudflare (images, assets)
  - Global distribution

Storage:
  - S3 (backups, logs, uploads)
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy-backend.yml

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    - npm run test
    - npm run lint
  
  build:
    - docker build -t quiz-rush-api
  
  deploy:
    - push to ECR
    - update ECS service
    - wait for health checks
```

## 🔒 Sécurité

### Authentification JWT

```typescript
// Token structure
{
  userId: string,
  username: string,
  level: number,
  isPremium: boolean,
  iat: number,
  exp: number  // 24h
}

// Refresh token (30 jours)
// Stocké en HTTP-only cookie
```

### Rate Limiting

```typescript
// Par endpoint
@ThrottleREST('/api/quiz/session/start', {
  ttl: 60,      // 60 secondes
  limit: 10     // 10 requêtes max
})

@ThrottleREST('/api/ugc/questions', {
  ttl: 3600,    // 1 heure
  limit: 5      // 5 questions max/heure
})
```

### Input Validation

```typescript
// Tous les DTOs validés avec class-validator
export class CreateQuestionDto {
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  text: string;
  
  @IsIn(['A', 'B', 'C', 'D'])
  correctAnswer: string;
  
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}
```

---

**Document technique vivant**  
**Dernière mise à jour:** 8 août 2026  
**Version:** 1.0.0
