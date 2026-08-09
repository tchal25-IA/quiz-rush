# 📚 Contexte du Projet Quiz Rush

## 🎯 Origines du Projet

### Conversation Initiale - "Idées de Jeux" (8 août 2026)

Ce projet est né d'une conversation où l'objectif était de **développer des petites applications et jeux dans le but de toucher un maximum de monde**, en rendant ludique l'accès à l'information et à l'apprentissage.

### Vision Fondatrice

> "J'aimerais développer des petites applications et jeux dans le but de toucher un maximum de monde. L'idée est de rendre ludique l'accès à l'information ou à l'apprentissage, et il faut aussi pouvoir créer, évoluer, gagner, que les niveaux aient du sens."

## 🎲 Concepts Initiaux Explorés

Quatre concepts de jeux ont été explorés initialement :

### 1. 🎾 Tennis Manager
- Jeu de gestion de carrière inspiré de "Destiny Eleven"
- Adaptation au monde du tennis
- Fiction interactive avec choix narratifs
- Gestion tactique et progression

### 2. 💼 Business Empire
- Simulation d'entreprise multi-joueurs
- Économie virtuelle où chaque joueur fait grandir le pays
- Gestion complète : contrats, recrutement, management
- IA gérant les clients et acceptant des contrats quotidiens

### 3. 📈 Stock Market Challenge
- Jeu de portefeuille boursier fictif
- Débuter avec portefeuille vide
- Choisir titres (actions, obligations, matières premières)
- Système de niveaux avec déblocages progressifs
- Automatisations et fonctionnalités avancées

### 4. 🧠 Quiz Rush (PROJET SÉLECTIONNÉ)
- Jeu de quiz gamifié ultra-viral
- Inspiration des jeux les plus addictifs au monde
- Sessions courtes et engagement fort
- Contenu généré par utilisateurs

## 🎯 Pourquoi Quiz Rush a été Choisi

### Critères de Sélection

**Quiz Rush** a été retenu parmi les 4 concepts car il présente le meilleur ratio :

| Critère | Score | Justification |
|---------|-------|---------------|
| **Viralité** | ⭐⭐⭐⭐⭐ | Partage naturel, défis entre amis, QR codes |
| **Rétention** | ⭐⭐⭐⭐⭐ | Sessions 3min, combos addictifs, streaks |
| **Accessibilité** | ⭐⭐⭐⭐⭐ | 12-60 ans, universel, multilingue facile |
| **Time-to-MVP** | ⭐⭐⭐⭐☆ | 8 semaines réalistes |
| **Scalabilité** | ⭐⭐⭐⭐⭐ | UGC = contenu infini |
| **Monétisation** | ⭐⭐⭐⭐☆ | Ads + Premium sans pay-to-win |

### Inspiration des Jeux les Plus Addictifs

Quiz Rush s'inspire des mécaniques des jeux les plus téléchargés au monde :

1. **Candy Crush** → Système de combos multiplicateurs
2. **Duolingo** → Streaks quotidiens et missions
3. **Clash Royale** → Duels en temps réel
4. **TikTok** → Sessions ultra-courtes, scroll infini
5. **Wordle** → Partage social des résultats
6. **Among Us** → UGC et contenu communautaire

## 🧩 Mécaniques d'Addiction Identifiées

### 1. Flow State (État de Flow)
- **Défi progressif:** Questions adaptées au niveau
- **Feedback immédiat:** Correct/Faux instantané
- **Sentiment de contrôle:** Jokers stratégiques

### 2. Variable Ratio Rewards (Récompenses Variables)
- **Loot boxes psychologique:** Combos imprévisibles
- **Parfois x2, parfois x5:** Variabilité addictive
- **Achievements rares:** Badges légendaires

### 3. Social Proof (Preuve Sociale)
- **Classements:** "Tu es meilleur que 73% des joueurs!"
- **Défis amis:** Compétition peer-to-peer
- **Partages:** Résultats sur réseaux sociaux

### 4. Loss Aversion (Aversion à la Perte)
- **Streaks:** Peur de casser la série de 30 jours
- **Combos:** Tension pour ne pas perdre le x5
- **FOMO:** Événements limités dans le temps

### 5. Progression Visible
- **Niveaux 1-100:** Objectifs clairs
- **Barres de progression:** Satisfaction visuelle
- **Déblocages:** Nouveaux modes tous les 5 niveaux

## 📊 Analyse Marché & Concurrence

### Concurrents Directs

| App | Points Forts | Points Faibles | Notre Avantage |
|-----|--------------|----------------|----------------|
| **QuizUp** | Grande DB questions | Abandonné 2019 | UGC + Combos |
| **Trivia Crack** | Multi-joueurs | Interface datée | Design moderne |
| **Kahoot!** | Marché éducation | Pas mobile/solo | Casual + Solo |
| **94%** | Concept viral | Un seul mode | Modes variés |

### Opportunité de Marché

- **Marché global quiz games:** $2.1B en 2025
- **Croissance annuelle:** +18% (CAGR)
- **Mobile quiz games:** 450M MAU mondial
- **Espace pour innovation:** Hybride casual/éducatif avec UGC

## 🎯 Objectifs Stratégiques

### Court Terme (6 mois)

1. ✅ **Cadrage fonctionnalités** - Complet
2. 🚧 **Développement MVP** - En cours (8 semaines)
3. 📋 **Beta testing** - 100 testeurs (4 semaines)
4. 🚀 **Soft launch** - France uniquement (4 semaines)

### Moyen Terme (12 mois)

1. **Global Launch:** iOS + Android mondial
2. **Croissance organique:** K-factor > 1.5
3. **Monétisation:** ARPU > $0.50
4. **Rétention D30:** > 18%

### Long Terme (24 mois)

1. **10M+ utilisateurs actifs**
2. **Modèle économique rentable**
3. **Expansion internationale:** Traductions 10 langues
4. **Partenariats:** Écoles, entreprises, médias

## 🏗️ Décisions Architecturales Clés

### Choix Mobile-First

**Pourquoi React Native ?**
- ✅ Code partagé iOS/Android (70-80%)
- ✅ Équipe unique (pas besoin Swift + Kotlin)
- ✅ Time-to-market rapide
- ✅ Hot reload = itérations rapides
- ✅ Communauté massive + librairies

### Choix Backend Node.js

**Pourquoi NestJS ?**
- ✅ Architecture modulaire scalable
- ✅ TypeScript = moins de bugs
- ✅ WebSockets intégrés (Socket.io)
- ✅ Documentation auto (Swagger)
- ✅ Dependency Injection

### Choix PostgreSQL + Redis

**Pourquoi cette combo ?**
- ✅ PostgreSQL: Données structurées (users, questions, scores)
- ✅ Redis: Cache + sessions + duels temps réel
- ✅ Proven stack à grande échelle
- ✅ Prisma ORM = migrations faciles

## 🎨 Principes de Design

### UX Mobile-First

1. **Thumb-friendly:** Boutons zone accessible pouce
2. **One-handed use:** Jouable d'une main
3. **Animations fluides:** 60fps minimum
4. **Feedback haptique:** Vibrations subtiles
5. **Dark mode:** Confort yeux le soir

### UI Inspirations

- **Duolingo:** Clarté, fun, encouragement
- **Clash Royale:** Animations épiques
- **TikTok:** Swipe fluide, transitions
- **Instagram:** Partage intégré

### Couleurs & Branding

- **Primaire:** Violet (#7C3AED) - Intelligence, créativité
- **Secondaire:** Orange (#F97316) - Énergie, action
- **Succès:** Vert (#10B981) - Réponse correcte
- **Erreur:** Rouge (#EF4444) - Réponse fausse
- **Neutre:** Gris (#6B7280) - Backgrounds

## 📈 Métriques de Succès MVP

### Critères de Validation MVP

Le MVP sera considéré comme réussi si :

1. **Rétention D1 > 50%** - Les joueurs reviennent
2. **Session length > 2.5 min** - Engagement fort
3. **Partages > 30%** - Viralité organique
4. **Crash rate < 1%** - Stabilité technique
5. **100 beta testeurs actifs** - Validation marché

### KPIs à Tracker

#### Engagement
- Sessions per user per day
- Questions answered per session
- Combo x3+ achievement rate
- Joker usage rate

#### Rétention
- D1, D3, D7, D14, D30
- Churn rate
- Streak completion rate

#### Viralité
- Invite sent per user
- Invite conversion rate
- Social shares per week
- K-factor

#### Monétisation (Post-MVP)
- Ad impression per user
- Premium conversion rate
- ARPU, ARPPU
- LTV

## 🚧 Risques Identifiés

### Risques Techniques

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Scaling DB | Élevé | Moyenne | Redis cache + read replicas |
| Latence duels | Élevé | Faible | WebSocket optimisé + CDN |
| Crash mobile | Critique | Faible | Testing rigoureux + Sentry |
| UGC spam | Moyen | Élevée | IA modération + rate limiting |

### Risques Business

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Pas de PMF | Critique | Moyenne | Beta extensive + itérations |
| Faible viralité | Élevé | Moyenne | A/B testing partages |
| Coûts UA élevés | Moyen | Élevée | Focus organic growth d'abord |
| Concurrence | Moyen | Faible | Différenciation UGC + combos |

## 📚 Références & Inspirations

### Articles & Resources

- ["The Psychology of Mobile Games"](https://www.gamasutra.com) - GDC 2023
- ["How Duolingo Achieves 60% D1 Retention"](https://www.reforge.com) - Reforge
- ["Viral Loops in Mobile Apps"](https://andrewchen.com) - Andrew Chen
- ["F2P Game Design Best Practices"](https://www.deconstructoroffun.com) - Deconstructor of Fun

### Benchmarks Inspirants

- **Wordle:** 2M → 300M users en 3 mois (viralité pure)
- **Duolingo:** D1 60%, D7 40%, D30 19% (référence rétention)
- **Among Us:** UGC viral spike en 2020 (power of UGC)
- **Clash Royale:** $3B revenue (proof esport mobile)

## 🤝 Équipe & Gouvernance

### Rôles Projet

- **Product Owner:** Thib C - Vision & Décisions stratégiques
- **Development Agent:** AI (Cursor Cloud) - Architecture & Code
- **Futurs recrutements:** Designers, Devs, Community Manager

### Workflow de Développement

1. **Sprints:** 2 semaines
2. **Démos:** Fin de sprint avec PO
3. **Reviews:** Code reviews systématiques
4. **Testing:** Automatisé + Manuel beta
5. **Déploiement:** CI/CD automated

## 🔮 Vision Long Terme

### Au-delà du MVP

**Évolutions potentielles:**

1. **Quiz Rush Pro:** Mode compétitif avec cashprizes
2. **Quiz Rush Éducation:** Partenariats écoles
3. **Quiz Rush Entreprise:** Team building
4. **Quiz Rush Live:** Événements streamés Twitch
5. **Quiz Rush Creator Fund:** Rémunération créateurs questions

### Expansion Internationale

**Phases:**
1. France (soft launch)
2. Europe francophone (Belgique, Suisse, Canada)
3. Europe anglophone (UK, Irlande)
4. US + monde anglophone
5. Localisation 10+ langues (LATAM, Asie)

## 📞 Historique des Décisions

### 8 août 2026 - Lancement Projet

- ✅ Sélection Quiz Rush parmi 4 concepts
- ✅ Validation stack technique (React Native + NestJS)
- ✅ Décision MVP 8 semaines
- ✅ Budget Phase 1: 120K€
- ✅ Création repository GitHub
- ✅ Rédaction spécifications complètes

---

**Document vivant** - Mis à jour au fil du développement  
**Dernière révision:** 8 août 2026  
**Propriétaire:** Thib C (t.chalandon@orange.fr)
