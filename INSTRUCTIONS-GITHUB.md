# 📋 Instructions pour Créer le Repository GitHub

## 🎯 Étape 1 : Créer le Repository sur GitHub

1. Allez sur https://github.com/new
2. Remplissez les informations :
   - **Repository name:** `quiz-rush`
   - **Description:** `🧠 Quiz Rush - Le TikTok de la connaissance. Jeu de quiz gamifié ultra-viral avec combos multiplicateurs et contenu généré par la communauté.`
   - **Visibility:** Private ou Public (votre choix)
   - ⚠️ **NE PAS** cocher "Initialize this repository with a README" (on a déjà le code)
   - ⚠️ **NE PAS** ajouter .gitignore ou license (déjà présents)

3. Cliquez sur **"Create repository"**

## 🚀 Étape 2 : Pusher le Code Local vers GitHub

Une fois le repository créé, GitHub vous affichera des instructions. Vous n'avez qu'à suivre celles pour "push an existing repository" :

```bash
cd /agent/quiz-rush

# Ajouter le remote GitHub (remplacez USERNAME par votre nom d'utilisateur)
git remote add origin https://github.com/USERNAME/quiz-rush.git

# OU si vous utilisez SSH :
git remote add origin git@github.com:USERNAME/quiz-rush.git

# Vérifier que le remote est bien ajouté
git remote -v

# Renommer la branche en main (si nécessaire)
git branch -M main

# Pusher le code
git push -u origin main
```

## ✅ Étape 3 : Vérification

1. Rafraîchissez la page de votre repository GitHub
2. Vous devriez voir :
   - ✅ README.md avec description complète
   - ✅ Structure de dossiers (backend, mobile, docs, infra)
   - ✅ 2 commits historiques
   - ✅ License MIT
   - ✅ .gitignore configuré

## 📚 Étape 4 : Configuration Repository (Optionnel mais Recommandé)

### 4.1 Ajouter Topics

Sur la page du repo, cliquez sur ⚙️ à côté de "About" et ajoutez :
- `react-native`
- `nestjs`
- `quiz-game`
- `gamification`
- `mobile-app`
- `typescript`
- `postgresql`
- `redis`

### 4.2 Créer les Secrets (pour CI/CD)

Allez dans **Settings > Secrets and variables > Actions** et ajoutez :

```
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SENTRY_DSN=https://...
OPENAI_API_KEY=sk-...
```

### 4.3 Protéger la Branche Main

**Settings > Branches > Add branch protection rule**

- Branch name pattern: `main`
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

### 4.4 Configurer GitHub Actions

Les workflows sont déjà présents dans `.github/workflows/` mais seront activés automatiquement au prochain push sur `main`.

## 🌿 Étape 5 : Créer les Branches de Développement

```bash
# Backend features
git checkout -b feature/auth
git checkout -b feature/quiz-gameplay
git checkout -b feature/duel-websocket

# Mobile features
git checkout -b feature/mobile-auth
git checkout -b feature/mobile-quiz-ui
git checkout -b feature/mobile-duel

# Infrastructure
git checkout -b feature/aws-setup
git checkout -b feature/docker-compose

# Revenir sur main
git checkout main
```

## 📱 Étape 6 : Configuration Projets Mobile (Plus tard)

### iOS - App Store Connect

1. Créer App ID sur https://developer.apple.com
   - Identifier: `com.quizrush.app`
   - Name: Quiz Rush

2. Créer app sur https://appstoreconnect.apple.com
   - Bundle ID: `com.quizrush.app`
   - SKU: `quiz-rush-ios`

### Android - Google Play Console

1. Créer app sur https://play.google.com/console
   - Package name: `com.quizrush.app`
   - App name: Quiz Rush

## 🔗 Liens Utiles

- **Repository GitHub:** https://github.com/USERNAME/quiz-rush
- **Documentation complète:** Voir `/docs/`
- **Architecture:** `/docs/ARCHITECTURE.md`
- **Guide déploiement:** `/docs/DEPLOYMENT.md`
- **Contexte projet:** `/docs/CONTEXT.md`

## 🎯 Prochaines Étapes Développement

Une fois le repository créé et pushé :

1. **Setup local development:**
   ```bash
   # Backend
   cd backend
   npm install
   cp .env.example .env
   # Éditer .env avec vos credentials
   npx prisma migrate dev
   npm run seed
   npm run start:dev
   
   # Mobile (nouveau terminal)
   cd mobile
   npm install
   npm run ios  # ou npm run android
   ```

2. **Commencer le développement:**
   - [ ] Module Auth (Backend)
   - [ ] Module Quiz (Backend)
   - [ ] Écrans Auth (Mobile)
   - [ ] Écran Quiz Game (Mobile)
   - [ ] Système de combos
   - [ ] Tests unitaires

3. **Itérations rapides:**
   - Commit souvent (atomic commits)
   - Pull requests pour review
   - Tests automatisés
   - Déploiement continu

## ⚠️ Rappels Importants

- ❌ **NE JAMAIS** commit de fichiers `.env` (déjà dans .gitignore)
- ❌ **NE JAMAIS** commit de secrets (AWS keys, API keys)
- ✅ **TOUJOURS** faire des branches pour les features
- ✅ **TOUJOURS** faire des PR pour merger dans main
- ✅ **TOUJOURS** écrire des tests pour le nouveau code

## 🆘 Problèmes Fréquents

### "Permission denied (publickey)"

Configurez SSH :
```bash
ssh-keygen -t ed25519 -C "votre-email@example.com"
cat ~/.ssh/id_ed25519.pub
# Copier et ajouter sur GitHub > Settings > SSH Keys
```

### "Remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/quiz-rush.git
```

### "Updates were rejected"

```bash
git pull origin main --rebase
git push origin main
```

---

**Besoin d'aide ?** Contactez Thib C (t.chalandon@orange.fr)

**Prêt à coder !** 🚀
