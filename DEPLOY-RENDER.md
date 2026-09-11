# Guide de déploiement Render.com

## Prérequis
- Compte GitHub avec accès au repo `tchal25-IA/quiz-rush`
- Compte Render.com (gratuit, pas de carte bancaire requise)

## Étape 1: Créer le service sur Render

1. **Connexion à Render**
   - Aller sur https://render.com
   - Se connecter avec GitHub
   - Autoriser l'accès au repo `tchal25-IA/quiz-rush`

2. **Créer le service depuis le Blueprint**
   - Cliquer sur "New +" → "Blueprint"
   - Sélectionner le repo `quiz-rush`
   - Render détectera automatiquement `render.yaml`
   - Cliquer sur "Apply"

3. **Configuration automatique**
   - Service web: `quiz-rush-api` (créé automatiquement)
   - Base de données: `quiz-rush-db` (PostgreSQL gratuite)
   - Variables d'environnement: auto-configurées via `render.yaml`

## Étape 2: Vérifier les variables d'environnement

Render configure automatiquement:
- ✅ `DATABASE_URL` - lié à la base PostgreSQL
- ✅ `JWT_SECRET` - généré automatiquement
- ✅ `JWT_EXPIRES_IN=30d`
- ✅ `CORS_ORIGIN=*`
- ✅ `NODE_ENV=production`

**Optionnel:**
- `REDIS_URL` - si vous ajoutez un service Redis (sinon fallback en mémoire)

## Étape 3: Premier déploiement

1. Render va automatiquement:
   - Cloner le repo
   - Builder l'image Docker
   - Exécuter les migrations Prisma (`prisma migrate deploy`)
   - Lancer l'application
   - Faire le seed initial si la DB est vide

2. **Surveiller les logs:**
   - Onglet "Logs" dans le dashboard Render
   - Vérifier que les migrations passent
   - Attendre "Quiz Rush API listening on..."

3. **URL de production:**
   - Format: `https://quiz-rush-api.onrender.com`
   - Health check: `https://quiz-rush-api.onrender.com/api/health`

## Étape 4: Configurer Vercel pour pointer vers l'API

1. **Aller sur Vercel Dashboard**
   - Projet: `quiz-rush-web`
   - Settings → Environment Variables

2. **Ajouter la variable:**
   ```
   EXPO_PUBLIC_API_URL = https://quiz-rush-api.onrender.com/api
   ```

3. **Redéployer le web:**
   - Onglet "Deployments"
   - Cliquer sur "..." → "Redeploy"

## Étape 5: Vérification

### 1. Health check API
```bash
curl https://quiz-rush-api.onrender.com/api/health
# Devrait retourner: {"ok":true,"service":"quiz-rush-api","ts":"..."}
```

### 2. Guest auth
```bash
curl -X POST https://quiz-rush-api.onrender.com/api/auth/guest
# Devrait retourner: {"token":"...","user":{...}}
```

### 3. Categories
```bash
TOKEN="..." # token du guest
curl -H "Authorization: Bearer $TOKEN" \
  https://quiz-rush-api.onrender.com/api/quiz/categories
# Devrait retourner 5 catégories
```

### 4. Web app
- Ouvrir https://quiz-rush-web.vercel.app
- Créer un compte invité
- Lancer une partie solo
- Vérifier que les questions chargent

## Troubleshooting

### "Application failed to respond"
- Vérifier les logs Render
- Vérifier que le health check est accessible
- Le premier déploiement peut prendre 5-10 minutes

### "Prisma migration failed"
- Vérifier que DATABASE_URL est bien configuré
- Les logs montreront les erreurs SQL
- Render.yaml configure automatiquement la connexion DB

### "CORS errors" dans le navigateur
- Vérifier que `CORS_ORIGIN=*` est bien défini
- Pour plus de sécurité en prod: `CORS_ORIGIN=https://quiz-rush-web.vercel.app`

### Service en "sleep" (free tier)
- Le free tier Render met les services en veille après 15 min d'inactivité
- Premier appel = 30-60s de réveil
- Solutions:
  - Upgrade au plan payant ($7/mois)
  - Utiliser un cron externe pour ping toutes les 10 min
  - Accepter le délai de réveil

## Free tier limitations

| Ressource | Limite |
|-----------|--------|
| Services web | 1 gratuit |
| PostgreSQL | 1 base gratuite (90 jours puis supprimée) |
| RAM | 512 MB |
| CPU | Shared |
| Build minutes | 500/mois |
| Bandwidth | 100 GB/mois |

**⚠️ Important:** La base PostgreSQL gratuite est supprimée après 90 jours d'inactivité.

## Migration depuis Railway

Si vous aviez des données sur Railway:
1. Dump la base Railway: `pg_dump $RAILWAY_DATABASE_URL > backup.sql`
2. Restore sur Render: `psql $RENDER_DATABASE_URL < backup.sql`
3. Ou recréer via seed: les données de test sont recréées automatiquement

## Déploiements automatiques

Render déploie automatiquement à chaque push sur `main`:
- Détecte les commits GitHub
- Rebuild l'image Docker
- Run les nouvelles migrations
- Redémarre le service

Logs disponibles en temps réel dans le dashboard.

## Support

- Docs Render: https://render.com/docs
- Render community: https://community.render.com
- Status page: https://status.render.com
