# Statut de déploiement Quiz Rush

## Diagnostic (11 sept 2026)

### App Web Vercel ✅
- URL: https://quiz-rush-web.vercel.app
- Status: **HTTP 200** - fonctionne correctement
- Build: Expo web export depuis `apps/mobile`

### API Railway ❌
- URL historique: https://api-production-55416.up.railway.app/api
- Status: **HTTP 404** avec `x-railway-fallback: true`
- Diagnostic: Application Railway non trouvée ou supprimée
- Cause probable: Service Railway désactivé/supprimé ou token d'accès manquant

## Solutions de déploiement alternatives

### Option 1: Render.com (RECOMMANDÉ) ✅
**Avantages:**
- Configuration déjà prête dans `render.yaml`
- Free tier disponible
- Support Docker natif
- PostgreSQL inclus (free tier)
- Déploiement automatique depuis GitHub

**Déploiement:**
1. Créer un compte sur https://render.com
2. Connecter le repo GitHub `tchal25-IA/quiz-rush`
3. Render détectera automatiquement `render.yaml`
4. Configurer les variables d'environnement (JWT_SECRET, REDIS_URL optionnel)
5. Déployer

**Configuration actuelle dans render.yaml:**
- Service web Docker avec healthcheck `/api/health`
- Base de données PostgreSQL gratuite incluse
- Variables d'env auto-configurées

### Option 2: Vercel API Project
**Limitations:**
- Pas de support WebSocket natif (duels temps réel limités)
- Timeout 10s en free tier
- Nécessite une base de données externe (Vercel Postgres ou Supabase)
- Refonte partielle du code nécessaire

**Status:** Configuration préparée mais non recommandée pour cette stack

### Option 3: Fly.io
**Avantages:**
- Support Docker complet
- Free tier généreux
- Bonne latence globale
- Support WebSocket

**Inconvénients:**
- Carte de crédit requise même pour free tier
- Configuration manuelle nécessaire

## Recommandation finale

**→ Déployer sur Render.com**

1. Le `render.yaml` est déjà configuré et testé
2. Support complet de la stack (NestJS + Socket.io + PostgreSQL)
3. Déploiement en 5 minutes
4. Free tier sans carte de crédit

## Variables d'environnement requises

### Pour l'API (Render/autre):
- `DATABASE_URL` - auto-configuré par Render
- `JWT_SECRET` - généré automatiquement par Render
- `CORS_ORIGIN=*` - déjà dans render.yaml
- `REDIS_URL` - optionnel (fallback en mémoire)

### Pour le Web Vercel:
- `EXPO_PUBLIC_API_URL` - doit pointer vers l'URL de l'API déployée
  - Actuellement: non défini → défaut `http://localhost:3000/api`
  - Doit être: `https://quiz-rush-api.onrender.com/api` (ou autre URL de prod)

## Prochaines étapes

1. ✅ Documenter le problème Railway
2. ⏳ Déployer l'API sur Render.com
3. ⏳ Configurer `EXPO_PUBLIC_API_URL` dans Vercel
4. ⏳ Tester le health check et les endpoints critiques
5. ⏳ Implémenter Phase 2 (mode événement OU partage amélioré)
