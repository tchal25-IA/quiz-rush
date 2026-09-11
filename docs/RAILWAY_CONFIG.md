# Configuration Railway - Quiz Rush API

## 🚂 Projet Railway

**Project ID:** `eaf4fd49-1844-47ce-8761-f63923220876`  
**API URL:** https://api-production-55416.up.railway.app  
**API Endpoint:** https://api-production-55416.up.railway.app/api  
**Health Check:** https://api-production-55416.up.railway.app/api/health

## 📦 Services Déployés

### 1. Service API (NestJS)
- **Builder:** Docker (Dockerfile à la racine)
- **Port:** 3000
- **Health Check Path:** `/api/health`
- **Health Check Timeout:** 30s
- **Restart Policy:** ON_FAILURE (max 5 retries)

### 2. PostgreSQL Database
- Provisionné via Railway
- `DATABASE_URL` automatiquement injecté dans le service API

### 3. Redis Cache
- Provisionné via Railway
- `REDIS_URL` automatiquement injecté dans le service API
- Fallback mémoire si Redis indisponible

## ⚙️ Variables d'Environnement

### Variables requises dans Railway

| Variable | Valeur | Description |
|----------|--------|-------------|
| `DATABASE_URL` | *Auto-configuré* | URL de connexion PostgreSQL (fournie par Railway) |
| `REDIS_URL` | *Auto-configuré* | URL de connexion Redis (fournie par Railway) |
| `JWT_SECRET` | `<secret>` | Secret pour signer les tokens JWT |
| `CORS_ORIGIN` | `*` | Origines CORS autorisées (ou liste séparée par virgules) |
| `NODE_ENV` | `production` | Environnement Node.js |
| `PORT` | `3000` | Port d'écoute (ou laissez Railway le définir) |

**Note:** Railway injecte automatiquement `DATABASE_URL` et `REDIS_URL` lorsque vous provisionnez ces services.

## 🔗 Configuration Vercel (Web Frontend)

Pour que l'application web Vercel puisse communiquer avec l'API Railway:

### Variable d'environnement Vercel

**Nom:** `EXPO_PUBLIC_API_URL`  
**Valeur:** `https://api-production-55416.up.railway.app/api`  
**Environnements:** Production, Preview, Development

### Comment mettre à jour dans Vercel

#### Via Dashboard Vercel
1. Allez sur https://vercel.com
2. Sélectionnez le projet `quiz-rush-web`
3. Allez dans **Settings** → **Environment Variables**
4. Trouvez `EXPO_PUBLIC_API_URL` ou créez-la
5. Mettez la valeur: `https://api-production-55416.up.railway.app/api`
6. Cochez les environnements souhaités (Production, Preview, Development)
7. Sauvegardez
8. Redéployez l'application si nécessaire

#### Via Vercel CLI
```bash
# Supprimer l'ancienne variable (si nécessaire)
vercel env rm EXPO_PUBLIC_API_URL production

# Ajouter la nouvelle
vercel env add EXPO_PUBLIC_API_URL production
# Entrez: https://api-production-55416.up.railway.app/api

# Répétez pour preview et development si nécessaire
vercel env add EXPO_PUBLIC_API_URL preview
vercel env add EXPO_PUBLIC_API_URL development
```

**⚠️ Important:** N'oubliez pas le suffixe `/api` car l'API NestJS utilise ce préfixe global.

## 📁 Fichiers de Configuration

### `railway.toml`
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

### `Dockerfile`
Le Dockerfile à la racine du monorepo:
- Build multi-stage pour optimiser la taille de l'image
- Installe les workspaces `@quiz-rush/shared` et `@quiz-rush/api`
- Génère le client Prisma
- Build l'API NestJS
- Exécute `prisma migrate deploy` au démarrage
- Lance l'API sur le port 3000

## 🧪 Tests de Validation

### 1. Health Check
```bash
curl https://api-production-55416.up.railway.app/api/health
```

**Réponse attendue:**
```json
{
  "status": "ok",
  "timestamp": "2026-09-11T18:00:00.000Z"
}
```

### 2. Authentification Guest
```bash
curl -X POST https://api-production-55416.up.railway.app/api/auth/guest \
  -H "Content-Type: application/json"
```

**Réponse attendue:**
```json
{
  "user": {
    "id": "...",
    "username": "guest_...",
    "isGuest": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Daily Challenge
```bash
curl https://api-production-55416.up.railway.app/api/daily-challenge/today
```

**Réponse attendue:**
```json
{
  "id": "...",
  "date": "2026-09-11",
  "challenge": { ... }
}
```

## 🔧 Maintenance

### Voir les logs
```bash
railway logs --service api
```

### Redéployer
```bash
railway up --service api
```

### Accéder à la database
```bash
railway connect postgres
```

### Variables d'environnement
```bash
railway variables
```

## 📊 Monitoring

### Health Check
Railway vérifie automatiquement `/api/health` toutes les 30 secondes.
Si l'endpoint ne répond pas, le service sera redémarré.

### Logs
Les logs sont disponibles dans le dashboard Railway et via CLI.

### Métriques
- CPU usage
- Memory usage
- Network traffic
- Request rate

Disponibles dans l'onglet **Metrics** du dashboard Railway.

## 🚨 Dépannage

### Service ne démarre pas
1. Vérifier les logs: `railway logs --service api`
2. Vérifier que `DATABASE_URL` est configuré
3. Vérifier que les migrations Prisma ont réussi

### Database connection errors
1. Vérifier que PostgreSQL est provisionné
2. Vérifier que le service API est lié à la base de données
3. Tester la connexion: `railway connect postgres`

### Migrations échouent
1. Vérifier l'état: `railway run npx prisma migrate status`
2. Forcer les migrations: `railway run npx prisma migrate deploy`

---

**Dernière mise à jour:** 11 septembre 2026  
**Maintenu par:** t.chalandon@orange.fr
