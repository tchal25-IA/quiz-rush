# 🚢 Guide de Déploiement - Quiz Rush

## 📋 Prérequis

### Comptes & Services Requis

- [ ] **AWS Account** - Infrastructure cloud
- [ ] **GitHub Account** - Repository & CI/CD
- [ ] **Cloudflare Account** - CDN & DNS
- [ ] **OpenAI API Key** - Modération IA
- [ ] **Sentry Account** - Error tracking
- [ ] **Mixpanel Account** - Analytics
- [ ] **Apple Developer** (99$/an) - iOS deployment
- [ ] **Google Play Developer** (25$ one-time) - Android deployment

### Outils Locaux

- [ ] Node.js 20+
- [ ] Docker & Docker Compose
- [ ] AWS CLI
- [ ] Terraform CLI
- [ ] React Native CLI
- [ ] Xcode (macOS uniquement)
- [ ] Android Studio

## 🏗️ Infrastructure AWS

### 1. Configuration Terraform

```bash
cd infra/terraform

# Initialiser Terraform
terraform init

# Configurer variables
cp terraform.tfvars.example terraform.tfvars
# Éditer terraform.tfvars avec vos valeurs

# Preview des changements
terraform plan

# Appliquer l'infrastructure
terraform apply
```

### 2. Services AWS Créés

```yaml
- VPC avec subnets publics/privés
- Application Load Balancer (ALB)
- ECS Fargate Cluster
  - Service API (auto-scaling)
  - Service WebSocket (sticky sessions)
- RDS PostgreSQL 15
  - Multi-AZ
  - Read Replicas (2)
  - Automated backups
- ElastiCache Redis Cluster
  - 3 nodes
  - Automatic failover
- S3 Buckets
  - Backups
  - User uploads
  - Logs
- CloudWatch
  - Logs
  - Alarms
  - Dashboards
```

## 🔐 Secrets Management

### AWS Secrets Manager

```bash
# Créer secrets
aws secretsmanager create-secret \
  --name quiz-rush/production/database \
  --secret-string '{"username":"admin","password":"CHANGE_ME"}'

aws secretsmanager create-secret \
  --name quiz-rush/production/jwt \
  --secret-string '{"secret":"CHANGE_ME","refresh":"CHANGE_ME"}'

aws secretsmanager create-secret \
  --name quiz-rush/production/openai \
  --secret-string '{"apiKey":"sk-..."}'
```

### Environment Variables (ECS Task Definition)

```json
{
  "containerDefinitions": [{
    "name": "api",
    "environment": [
      { "name": "NODE_ENV", "value": "production" },
      { "name": "PORT", "value": "3000" }
    ],
    "secrets": [
      {
        "name": "DATABASE_URL",
        "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:quiz-rush/production/database"
      },
      {
        "name": "JWT_SECRET",
        "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:quiz-rush/production/jwt:secret"
      }
    ]
  }]
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

#### Backend Deployment

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd backend && npm ci
      - run: cd backend && npm run test
      - run: cd backend && npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: quiz-rush-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -t $ECR_REGISTRY/$ECR_REPOSITORY:latest ./backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster quiz-rush-production \
            --service api \
            --force-new-deployment
      
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster quiz-rush-production \
            --services api
```

#### Mobile Build (iOS)

```yaml
# .github/workflows/build-ios.yml
name: Build iOS

on:
  push:
    branches: [release]
    paths: ['mobile/**']

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: cd mobile && npm ci
      
      - name: Install pods
        run: cd mobile/ios && pod install
      
      - name: Build iOS app
        run: |
          cd mobile/ios
          xcodebuild archive \
            -workspace QuizRush.xcworkspace \
            -scheme QuizRush \
            -configuration Release \
            -archivePath QuizRush.xcarchive
      
      - name: Export IPA
        run: |
          cd mobile/ios
          xcodebuild -exportArchive \
            -archivePath QuizRush.xcarchive \
            -exportPath . \
            -exportOptionsPlist ExportOptions.plist
      
      - name: Upload to TestFlight
        uses: apple-actions/upload-testflight-build@v1
        with:
          app-path: mobile/ios/QuizRush.ipa
          issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APPSTORE_API_KEY_ID }}
          api-private-key: ${{ secrets.APPSTORE_API_PRIVATE_KEY }}
```

## 📱 Déploiement Mobile

### iOS (App Store)

#### 1. Configuration Xcode

```bash
cd mobile/ios
open QuizRush.xcworkspace

# Dans Xcode:
# - Signing & Capabilities
# - Team: Votre équipe
# - Bundle Identifier: com.quizrush.app
# - Version: 1.0.0
# - Build: 1
```

#### 2. Build Release

```bash
cd mobile

# Bump version
npm version patch  # ou minor, major

# Build
npm run ios -- --configuration Release

# Archive dans Xcode
# Product > Archive
# Distribute App > App Store Connect
```

#### 3. App Store Connect

1. Créer app sur https://appstoreconnect.apple.com
2. Screenshots (6.7", 6.5", 5.5")
3. Description, keywords, catégorie
4. Submit for review

### Android (Google Play)

#### 1. Générer Signing Key

```bash
cd mobile/android/app

# Créer keystore
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore quiz-rush-release.keystore \
  -alias quiz-rush \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

#### 2. Configuration Gradle

```gradle
// android/app/build.gradle

android {
  signingConfigs {
    release {
      storeFile file('quiz-rush-release.keystore')
      storePassword System.getenv("KEYSTORE_PASSWORD")
      keyAlias 'quiz-rush'
      keyPassword System.getenv("KEY_PASSWORD")
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
    }
  }
}
```

#### 3. Build APK/AAB

```bash
cd mobile/android

# Build AAB (pour Play Store)
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab

# Build APK (pour distribution directe)
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/app-release.apk
```

#### 4. Google Play Console

1. Créer app sur https://play.google.com/console
2. Upload AAB
3. Store listing (screenshots, description)
4. Content rating questionnaire
5. Pricing & distribution
6. Submit for review

## 🔍 Monitoring & Alertes

### CloudWatch Alarms

```bash
# High CPU utilization
aws cloudwatch put-metric-alarm \
  --alarm-name api-high-cpu \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --period 300 \
  --statistic Average \
  --threshold 80 \
  --actions-enabled \
  --alarm-actions arn:aws:sns:REGION:ACCOUNT:alerts

# High error rate
aws cloudwatch put-metric-alarm \
  --alarm-name api-high-errors \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --period 60 \
  --statistic Sum \
  --threshold 10
```

### Sentry Configuration

```typescript
// Backend
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

// Mobile
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.1
});
```

## 📊 Base de Données

### Migrations Production

```bash
# Backup avant migration
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma migrate status
```

### Backups Automatiques

```bash
# Script de backup quotidien
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > /backups/quiz-rush-$DATE.sql.gz

# Upload vers S3
aws s3 cp /backups/quiz-rush-$DATE.sql.gz s3://quiz-rush-backups/

# Garder 30 jours seulement
aws s3 ls s3://quiz-rush-backups/ | \
  awk '{print $4}' | \
  head -n -30 | \
  xargs -I {} aws s3 rm s3://quiz-rush-backups/{}
```

### Cron (tous les jours à 3h)

```bash
0 3 * * * /usr/local/bin/backup-database.sh
```

## 🚨 Rollback Procedure

### Backend

```bash
# Lister images ECR
aws ecr describe-images \
  --repository-name quiz-rush-api \
  --query 'sort_by(imageDetails,& imagePushedAt)[-5:]'

# Rollback vers image précédente
aws ecs update-service \
  --cluster quiz-rush-production \
  --service api \
  --task-definition quiz-rush-api:PREVIOUS_VERSION
```

### Database

```bash
# Restore depuis backup
gunzip < backup-20260808.sql.gz | psql $DATABASE_URL
```

## ✅ Checklist Déploiement

### Avant Premier Déploiement

- [ ] Infrastructure AWS créée (Terraform)
- [ ] Secrets configurés (AWS Secrets Manager)
- [ ] Database migrée (Prisma)
- [ ] Questions seed importées (5000 minimum)
- [ ] CI/CD configuré (GitHub Actions)
- [ ] Monitoring configuré (Sentry, CloudWatch)
- [ ] DNS configuré (Cloudflare)
- [ ] SSL/TLS configuré (ALB)

### Avant Chaque Release

- [ ] Tests passent (unit + e2e)
- [ ] Code review approuvé
- [ ] Changelog mis à jour
- [ ] Version bumpée (semver)
- [ ] Database migrations testées
- [ ] Backup database récent
- [ ] Rollback procedure testée

### Après Déploiement

- [ ] Health check OK (`/api/health`)
- [ ] Smoke tests passent
- [ ] Monitoring normal (pas d'alertes)
- [ ] Performance acceptable (latence < 200ms p95)
- [ ] Mobile app fonctionnelle (iOS + Android)

## 📞 Support & Incidents

### Contacts Urgents

- **Product Owner:** Thib C (t.chalandon@orange.fr)
- **On-call:** À définir

### Procédure Incident

1. **Détection:** CloudWatch alarm / Sentry / User report
2. **Triage:** Severity (P0 = down, P1 = degraded, P2 = minor)
3. **Investigation:** Logs CloudWatch + Sentry
4. **Fix:** Hotfix ou Rollback
5. **Communication:** Status page + Email users si P0/P1
6. **Post-mortem:** Document root cause + actions

---

**Document vivant** - Mis à jour à chaque release  
**Dernière mise à jour:** 8 août 2026  
**Version:** 1.0.0
