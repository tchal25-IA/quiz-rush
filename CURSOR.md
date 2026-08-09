# Reprendre Quiz Rush depuis Cursor (Mac & iPhone)

**Repo GitHub :** `tchal25-IA/quiz-rush`  
**URL :** https://github.com/tchal25-IA/quiz-rush  
**App live :** https://quiz-rush-web.vercel.app  
**API live :** https://api-production-55416.up.railway.app/api

## Sur Mac (Cursor Desktop)

1. Clone le repo (ou ouvre le dossier déjà présent) :
   ```bash
   git clone https://github.com/tchal25-IA/quiz-rush.git
   cd quiz-rush
   ```
2. Dans Cursor : **File → Open Folder** → sélectionne `quiz-rush`.
3. Setup local optionnel :
   ```bash
   ./scripts/setup-local.sh
   npm run dev:api
   npm run dev:mobile
   ```
4. Pour continuer le travail cloud : ouvre une conversation Agent et mentionne le repo / le dossier.

Le remote `origin` pointe déjà vers GitHub (`main`).

## Sur iPhone (app Cursor)

1. Connecte le même compte Cursor / GitHub.
2. Ouvre un **Cloud Agent** et sélectionne le dépôt **`tchal25-IA/quiz-rush`** (public).
3. Tu peux demander des changements, reviews, ou un déploiement depuis le téléphone.
4. Pour **jouer** (pas coder) : ouvre Safari → https://quiz-rush-web.vercel.app (PWA mobile-first).

> L’app Cursor mobile pilote surtout des agents cloud sur le repo GitHub. Le code source de vérité est toujours `github.com/tchal25-IA/quiz-rush`.

## Déploiements liés

| Service | Plateforme | Projet |
|---------|------------|--------|
| API | Railway | `quiz-rush` / service `api` |
| Web | Vercel | `quiz-rush-web` |
| Code | GitHub | `tchal25-IA/quiz-rush` |

Après un `git push` sur `main` :
- Railway redéploie l’API si le service est branché au repo
- Vercel redéploie le web (projet lié au repo)
