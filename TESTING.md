# Guide de test Quiz Rush

## Tests smoke (checklist de déploiement)

### Prérequis
- API déployée et accessible (Render, Railway, ou local)
- Variable `EXPO_PUBLIC_API_URL` configurée dans Vercel
- Base de données migrée et seedée

### 1. Health check ✓
```bash
curl https://YOUR-API-URL/api/health

# Attendu:
# {"ok":true,"service":"quiz-rush-api","ts":"..."}
```

### 2. Guest auth ✓
```bash
curl -X POST https://YOUR-API-URL/api/auth/guest

# Attendu:
# {"accessToken":"...","user":{"id":"...","username":"guest_...","isGuest":true,...}}
```

Sauvegarder le token pour les tests suivants:
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Catégories ✓
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://YOUR-API-URL/api/quiz/categories

# Attendu: 5 catégories (Culture, Sciences, Sport, Histoire, Divertissement)
```

### 4. Quiz solo — start ✓
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://YOUR-API-URL/api/quiz/solo/start

# Attendu: sessionId, question, score: 0, combo: 0
# Sauvegarder SESSION_ID
```

### 5. Quiz solo — answer ✓
```bash
export SESSION_ID="clxxxxx"

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answer":"A","timeSpent":5}' \
  https://YOUR-API-URL/api/quiz/solo/$SESSION_ID/answer

# Attendu: correct: true/false, pointsEarned, nextQuestion ou finished: true
```

### 6. Duel — practice bot ✓
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://YOUR-API-URL/api/duel/practice

# Attendu: duelId, player1, player2: null, questions
```

### 7. Challenge ami — create ✓
Compléter une session solo jusqu'au bout, puis:
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"'$SESSION_ID'"}' \
  https://YOUR-API-URL/api/quiz/challenge

# Attendu: code (ex: "AB12CD"), shareUrl, expiresAt
```

### 8. Daily challenge — today 🆕
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://YOUR-API-URL/api/daily-challenge/today

# Attendu:
# {
#   "challengeId": "...",
#   "date": "2026-09-11T00:00:00.000Z",
#   "category": {"name":"...","icon":"..."},
#   "totalQuestions": 10,
#   "hasParticipated": false,
#   "userScore": null
# }
```

### 9. Daily challenge — start 🆕
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://YOUR-API-URL/api/daily-challenge/start

# Attendu: sessionId, challengeId, question, questionIndex: 0
# Sauvegarder DAILY_SESSION_ID
```

### 10. Daily challenge — answer 🆕
```bash
export DAILY_SESSION_ID="clxxxxx"

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answer":"A","timeSpent":5}' \
  https://YOUR-API-URL/api/daily-challenge/answer/$DAILY_SESSION_ID

# Répondre aux 10 questions
# Au dernier: finished: true, result: {...}
```

### 11. Daily challenge — leaderboard 🆕
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://YOUR-API-URL/api/daily-challenge/leaderboard

# Attendu:
# {
#   "challengeId": "...",
#   "date": "...",
#   "leaderboard": [
#     {"rank":1,"username":"...","score":850,"correct":10,"maxCombo":5}
#   ],
#   "userRank": 1
# }
```

### 12. Analytics funnel ✓
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "daily_challenge_finish",
    "props": {"score": 850}
  }' \
  https://YOUR-API-URL/api/analytics/events

# Attendu: {ok: true}
```

## Tests web (manuel)

### Prérequis
- App web déployée: https://quiz-rush-web.vercel.app
- Variable `EXPO_PUBLIC_API_URL` configurée dans Vercel

### Checklist web
1. ✓ Ouvrir https://quiz-rush-web.vercel.app
2. ✓ Vérifier que la page charge (pas d'erreur CORS)
3. ✓ Cliquer "Jouer" ou "Créer un compte" → doit créer un compte invité
4. ✓ Voir les catégories (5 catégories avec icônes)
5. 🆕 **Cliquer sur le banner "🌟 Défi du jour"**
6. 🆕 **Vérifier l'affichage du défi (catégorie, icon, description)**
7. 🆕 **Cliquer "Commencer" → doit lancer le quiz**
8. 🆕 **Répondre aux 10 questions**
9. 🆕 **Voir le résultat final + "Voir le classement"**
10. 🆕 **Vérifier le classement quotidien**
11. ✓ Lancer une partie solo (catégorie)
12. ✓ Répondre à plusieurs questions
13. ✓ Utiliser un joker (50/50, +5s, ou Communauté)
14. ✓ Terminer la partie → voir le résultat
15. ✓ Aller dans "Duel" → "S'entraîner contre le bot"
16. ✓ Aller dans "Profil" → voir XP, gems, niveau
17. ✓ Créer un défi ami (terminer une partie solo puis "Créer un défi")
18. ✓ Partager le code défi
19. ✓ Entrer le code défi dans un autre navigateur/session

## Tests mobile (optionnel)

### iOS Simulator / Android
```bash
cd apps/mobile
npm run start
# Presser 'i' pour iOS ou 'a' pour Android
```

### Checklist mobile
- Même checklist que web
- Vérifier les animations et transitions
- Tester les boutons tactiles (TapButton)

## Critères de succès

### API
- [x] Health check répond 200
- [x] Guest auth fonctionne
- [x] Quiz solo start/answer fonctionne
- [x] Duel practice bot fonctionne
- [x] Challenge ami création/participation fonctionne
- [x] Analytics events enregistrés
- [ ] **Daily challenge today/start/answer/leaderboard fonctionnent** 🆕

### Web
- [ ] Pas d'erreur CORS
- [ ] Compte invité se crée automatiquement
- [ ] Les 5 catégories s'affichent
- [ ] **Banner "Défi du jour" visible et cliquable** 🆕
- [ ] **Écran daily challenge fonctionnel** 🆕
- [ ] Quiz solo jouable
- [ ] Jokers utilisables
- [ ] Duel bot fonctionnel
- [ ] Défi ami créable et jouable
- [ ] Feedback visuel (scores, combos, animations)

### Données
- [ ] Migrations Prisma appliquées (incluant daily_challenge) 🆕
- [ ] Seed initial (5 catégories, ~125 questions, missions)
- [ ] Redis fonctionne (classements) ou fallback mémoire

## Débogage

### "CORS error" dans le navigateur
→ Vérifier `CORS_ORIGIN=*` dans les variables d'env de l'API

### "Failed to fetch" ou "Network request failed"
→ Vérifier que `EXPO_PUBLIC_API_URL` pointe vers l'API de prod (pas localhost)

### "Application not found" (Railway)
→ L'API Railway est DOWN, déployer sur Render (voir DEPLOY-RENDER.md)

### "Prisma migration failed"
→ Vérifier que `DATABASE_URL` est configuré et accessible

### Daily challenge "Not enough questions"
→ Vérifier que le seed a créé au moins 10 questions par catégorie
→ Relancer le seed: `npm run db:seed`

### Leaderboard vide
→ Normal au premier lancement, se remplit après les premières parties

## Environnements

### Local (dev)
```bash
# Terminal 1 — API
npm run docker:up      # Postgres + Redis
npm run db:migrate     # Migrations
npm run db:seed        # Seed
npm run dev:api        # http://localhost:3000

# Terminal 2 — Mobile/Web
npm run dev:mobile     # Expo Dev Server
```

### Staging (Render free tier)
- API: https://quiz-rush-api.onrender.com/api
- Base: PostgreSQL Render (free, 90 jours)
- Redis: optionnel (fallback mémoire)

### Production (à définir)
- Render paid plan ($7/mois + DB $7/mois)
- Ou autre service (Fly.io, AWS, etc.)
