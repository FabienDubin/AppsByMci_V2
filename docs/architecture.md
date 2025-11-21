# Architecture - AppsByMCI_V2

_Créé le 2025-11-21 par Fab_
_Généré avec BMad Method - Architecture Workflow v1.0_

---

## Compréhension du contexte projet

### Vue d'ensemble

**AppsByMCI V2** est une plateforme SaaS B2B d'animation événementielle qui démystifie l'IA lors d'événements corporate. Le différenciateur principal : remplacer 7 applications codées en dur par un **système de blocs composables** (philosophie LEGO) où les admins configurent des animations en 30-45 minutes via un wizard en 8 étapes.

### Fonctionnalités principales

**82 exigences fonctionnelles** réparties en 8 domaines :

1. **Authentification et utilisateurs** (FR1-FR5) : Login admin, accès sans compte pour participants
2. **Wizard de création** (FR6-FR27) : 8 étapes, génération IA de questions, pipeline drag-and-drop, QR codes
3. **Expérience participant** (FR28-FR40) : Scan QR → complète animation → reçoit résultat IA
4. **Génération IA** (FR41-FR49) : Multi-modèles (DALL-E, Gemini), prompts dynamiques, storage Azure
5. **Dashboard admin** (FR50-FR61) : Analytics, téléchargement bulk, modération
6. **Écran public** (FR62-FR68) : Affichage temps réel, masonry, refresh auto
7. **Email et QR codes** (FR69-FR76) : Templates personnalisables, génération QR auto
8. **CMS dynamique** (FR77-FR82) : Configuration modèles IA via Payload sans code

### Contraintes UX identifiées

- **Design System** : ShadCN UI + Radix + Tailwind CSS
- **Style visuel** : Minimal monochrome (90% noir/blanc/gris, inspiration Notion)
- **Composants clés** : WizardStepper, PipelineCanvas (drag-and-drop), BlockCard, QRCodeGenerator
- **Responsive** : Admin desktop-first, Participant mobile-first, Écran public fullscreen
- **Accessibilité** : WCAG 2.1 AA minimum

### Stack technique indiqué

- **Frontend** : Next.js (App Router) + TypeScript + ShadCN UI
- **Backend** : Fastify + TypeScript
- **CMS** : Payload CMS
- **DB** : Cosmos DB (API MongoDB)
- **Storage** : Azure Blob Storage
- **Infra** : Azure Static Web Apps (frontend) + Azure Web App (backend)
- **Monorepo** : apps/frontend, apps/backend, packages/shared

### Complexités architecturales notables

- **Pipeline de traitement flexible** : Blocs drag-and-drop configurables (@dnd-kit)
- **Génération IA multi-modèles** : Configuration dynamique via CMS
- **Temps réel** : Écran public qui se rafraîchit automatiquement
- **Wizard multi-étapes** : State management complexe avec sauvegarde auto
- **Génération IA de contenu** : Meta-prompts OpenAI pour questions et prompts

### Décisions architecturales requises

Les domaines nécessitant des décisions claires :
- Orchestration frontend/backend pour le pipeline de traitement
- Gestion d'état du wizard multi-étapes
- Architecture temps réel pour l'écran public
- Intégration des modèles IA configurables
- Structure du package shared (types, validation, contrats API)
- Patterns de communication frontend/backend
- Stratégie de déploiement et CI/CD

---

## Décision : Initialisation du projet

### Approche choisie : Configuration manuelle (from scratch)

**Décision :** Pas de starter template - configuration manuelle du monorepo Next.js 16 + Fastify

**Rationale :**
- **Contrôle total** : Architecture personnalisée pour les besoins spécifiques (wizard, pipeline, CMS)
- **Pas de bloat** : Pas de code/config inutile à nettoyer
- **Apprentissage** : Setup manuel = meilleure compréhension de l'architecture pour l'équipe
- **Flexibilité** : Intégration Payload CMS + Fastify + Azure nécessite une config sur mesure

**Implications :**
Toutes les décisions architecturales doivent être spécifiées explicitement :
- Configuration monorepo (workspace, build pipeline)
- TypeScript configuration (strict mode, paths)
- Linting et formatting (ESLint, Prettier)
- Build tooling
- Structure de projet
- Configuration de déploiement Azure

**Première story d'implémentation :**
```bash
# Initialisation manuelle du projet
mkdir AppsByMCI_V2
cd AppsByMCI_V2
npm init -y
# Configuration monorepo + Next.js + Fastify
# (détails dans la section Structure du projet)
```

---

## Récapitulatif des décisions architecturales

### Décisions critiques

| Catégorie | Décision | Rationale | Affects FR |
|-----------|----------|-----------|------------|
| **Frontend Framework** | Next.js 16 (App Router) + TypeScript | Défini dans PRD, SSR/SSG pour performance, App Router moderne | FR6-27, FR28-40, FR62-68 |
| **Backend Framework** | Fastify + TypeScript | Défini dans PRD, performance supérieure à Express, TypeScript natif | FR41-49, FR69-76 |
| **Database** | Cosmos DB (API MongoDB) | Défini dans PRD, Azure natif, scalable, API MongoDB familière | FR1-5, toutes FR storage |
| **ODM** | Mongoose | Schémas typés, validation intégrée, bien documenté | FR41-49 |
| **Storage** | Azure Blob Storage | Défini dans PRD, stockage images générées, CDN intégré | FR48, FR56-57 |
| **Modèles IA** | Hardcodés (OpenAI + Gemini) | MVP simple, UI admin post-MVP si besoin | Configuration modèles |
| **Monorepo** | NPM sans workspaces | Azure ne supporte pas bien workspaces au déploiement | Toutes FR |
| **API Pattern** | REST API | Simplicité, standard, pas besoin de type-safety tRPC | FR communication frontend/backend |
| **Authentication** | JWT custom | Contrôle total, pas de dépendance NextAuth, simple pour admin only | FR1-4 |

### Décisions importantes

| Catégorie | Décision | Rationale | Affects FR |
|-----------|----------|-----------|------------|
| **State Management** | Zustand + TanStack Query | Zustand pour state local (wizard), TanStack Query pour server state | FR6-27 (wizard) |
| **Real-time** | Polling simple | Écran public = refresh toutes les 5-10s, pas besoin WebSockets complexe | FR62-68 |
| **Background Jobs** | Promise async + retry manuel | MVP simple, upgrade vers Azure Queue Storage si scale requis | FR41-49 (génération IA) |
| **Email Service** | Mailjet | Simple, fiable, connu par l'équipe | FR69-76 |
| **Form Management** | React Hook Form + Zod | Natif ShadCN, validation Zod cohérente | FR6-27 |
| **Testing** | Jest + Playwright (politique simple) | Coverage > 60%, focus logique métier critique, E2E clés | Qualité globale |
| **UI Components** | ShadCN UI + Radix + Tailwind | Défini dans UX spec, accessibilité, personnalisation | FR toutes UI |
| **Drag & Drop** | @dnd-kit | Défini dans PRD, pipeline de traitement flexible | FR13 (pipeline) |

### Décisions techniques

| Catégorie | Décision | Rationale | Affects FR |
|-----------|----------|-----------|------------|
| **Validation** | Zod | Défini dans PRD, schémas partagés frontend/backend | FR toutes validation |
| **Date Handling** | date-fns | Léger, tree-shakeable, simple API | FR toutes dates |
| **QR Code** | qrcode (npm) | Ultra simple, génération QR codes animations | FR24, FR74-76 |
| **Image Processing** | Hybride (client preview + Sharp serveur) | Client = preview temps réel, Sharp = processing final fiable | FR46-47 |
| **Logging** | Pino | Ultra performant, logs structurés JSON, Azure App Insights compatible | NFR23-25 |
| **HTTP Client** | Fetch API native | Natif Next.js, pas besoin axios | FR communication |

### Décisions infrastructure

| Catégorie | Décision | Rationale | Affects FR |
|-----------|----------|-----------|------------|
| **Frontend Hosting** | Azure Static Web Apps | Défini dans PRD, CDN global, CI/CD intégré | Déploiement frontend |
| **Backend Hosting** | Azure Web App | Défini dans PRD, scale automatique, monitoring | Déploiement backend |
| **CI/CD** | GitHub Actions (existant) | Défini dans PRD, déjà fonctionnel | NFR20 |

---

## Décisions cross-cutting (cohérence globale)

Ces patterns garantissent que tous les agents AI implémentent de manière cohérente.

### Error Handling Strategy

**Pattern choisi : Error boundaries + API error standardisé**

**Frontend (Next.js) :**
```typescript
// Custom error boundary pour React
// Messages utilisateur friendly (pas de stack traces)
// Logging via Pino vers Azure App Insights
```

**Backend (Fastify) :**
```typescript
// Hook global d'error handling
// Structure standardisée :
{
  success: false,
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR" | ...,
    message: "Message utilisateur friendly",
    details?: any // Dev only
  }
}
```

**Retry strategy :**
- Génération IA : 3 tentatives max, backoff exponentiel
- Azure Blob upload : 2 tentatives
- Email : 2 tentatives
- Autres : Pas de retry automatique

### Logging Strategy

**Format : Logs structurés JSON (Pino)**

**Niveaux :**
- `ERROR` : Erreurs nécessitant attention (échecs IA, DB errors)
- `WARN` : Situations anormales mais gérées (retry, timeout)
- `INFO` : Événements métier importants (animation créée, génération lancée)
- `DEBUG` : Détails techniques (dev only)

**Contexte systématique :**
```typescript
logger.info({
  action: 'animation_created',
  userId: '...',
  animationId: '...',
  timestamp: new Date().toISOString()
}, 'Animation créée avec succès')
```

**Destination :** Azure Application Insights

### Date/Time Handling

**Stockage DB :** ISO 8601 strings (MongoDB natif)
**Manipulation :** date-fns
**Timezone :** UTC en DB, conversion locale côté frontend
**Format affichage utilisateur :** `dd/MM/yyyy HH:mm` (Europe/Paris)

```typescript
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

// Affichage
format(parseISO(dateFromDB), 'dd/MM/yyyy à HH:mm', { locale: fr })
```

### Authentication Pattern

**JWT custom avec refresh tokens**

**Structure JWT :**
```typescript
{
  userId: string,
  email: string,
  role: 'admin' | 'editor' | 'viewer', // Sprint 1 : tous admin
  iat: number,
  exp: number // 15 minutes
}
```

**Refresh token :** 7 jours, stocké en DB (collection `sessions`)

**Flow :**
1. Login → JWT (15min) + Refresh token (7j)
2. Frontend stocke JWT en memory, refresh token en httpOnly cookie
3. JWT expiré → Auto-refresh via refresh token
4. Refresh token expiré → Re-login requis

**Protection routes :**
- Frontend : Middleware Next.js vérifie JWT
- Backend : Fastify hook `preHandler` vérifie JWT

### API Response Format

**Succès :**
```typescript
{
  success: true,
  data: T
}
```

**Erreur :**
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

**Pagination (si besoin) :**
```typescript
{
  success: true,
  data: T[],
  pagination: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number
  }
}
```

### Testing Strategy (simple)

**Philosophie : Tests pragmatiques, pas de dogme**

**Backend (Jest) :**
- ✅ Logique métier critique (génération IA, validation)
- ✅ Routes API principales (auth, CRUD animations)
- ❌ Pas de tests pour getters/setters simples
- **Target : >60% coverage**

**Frontend (Jest + React Testing Library) :**
- ✅ Composants métier complexes (WizardStepper, PipelineCanvas)
- ✅ Hooks custom (useWizard, useAnimation)
- ❌ Pas de tests pour composants ShadCN wrappés
- **Target : >60% coverage**

**E2E (Playwright) :**
- ✅ Happy path principal : Admin crée animation → Participant complète → Résultat affiché
- ✅ Auth flow (login, logout)
- ✅ Wizard 8 étapes complet
- **~5-10 tests E2E max**

**Politique :**
- Tests avant merge en main (CI)
- Pas de tests pour code généré
- Priorité : logique métier > UI

---

## Structure du projet

### Architecture monorepo (sans workspaces)

```
AppsByMCI_V2/
├── apps/
│   ├── frontend/                    # Next.js 16 App Router
│   │   ├── app/                     # Next.js App Router
│   │   │   ├── (auth)/             # Route group - pages auth
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx      # Layout auth simple
│   │   │   ├── (admin)/            # Route group - dashboard admin
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx    # Liste animations
│   │   │   │   ├── animations/
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx # Wizard création
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── page.tsx # Détails animation
│   │   │   │   │   │   ├── edit/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── analytics/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── results/
│   │   │   │   │   └── [animationId]/
│   │   │   │   │       └── page.tsx # Gestion résultats
│   │   │   │   └── layout.tsx      # Layout admin (sidebar)
│   │   │   ├── a/                  # Route publique animations
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx    # Expérience participant
│   │   │   ├── display/            # Écran public
│   │   │   │   └── [animationId]/
│   │   │   │       └── page.tsx    # Écran masonry temps réel
│   │   │   ├── api/                # API routes (si nécessaire)
│   │   │   │   └── auth/
│   │   │   │       └── refresh/
│   │   │   │           └── route.ts
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── page.tsx            # Landing page
│   │   ├── components/
│   │   │   ├── ui/                 # ShadCN components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   └── ...
│   │   │   ├── wizard/             # Wizard 8 étapes
│   │   │   │   ├── WizardStepper.tsx
│   │   │   │   ├── StepContainer.tsx
│   │   │   │   ├── steps/
│   │   │   │   │   ├── Step1GeneralInfo.tsx
│   │   │   │   │   ├── Step2AccessConfig.tsx
│   │   │   │   │   ├── Step3InputCollection.tsx
│   │   │   │   │   ├── Step4Pipeline.tsx
│   │   │   │   │   ├── Step5Email.tsx
│   │   │   │   │   ├── Step6PublicDisplay.tsx
│   │   │   │   │   ├── Step7Customization.tsx
│   │   │   │   │   └── Step8Summary.tsx
│   │   │   │   └── index.ts
│   │   │   ├── pipeline/           # Pipeline drag-and-drop
│   │   │   │   ├── PipelineCanvas.tsx
│   │   │   │   ├── BlockCard.tsx
│   │   │   │   ├── BlockLibrary.tsx
│   │   │   │   ├── ConnectionLine.tsx
│   │   │   │   └── blocks/
│   │   │   │       ├── PreProcessingBlock.tsx
│   │   │   │       ├── AIGenerationBlock.tsx
│   │   │   │       └── PostProcessingBlock.tsx
│   │   │   ├── animation/          # Expérience participant
│   │   │   │   ├── ParticipantView.tsx
│   │   │   │   ├── QuestionRenderer.tsx
│   │   │   │   ├── SelfieCapture.tsx
│   │   │   │   ├── ResultDisplay.tsx
│   │   │   │   └── PublicDisplayScreen.tsx
│   │   │   ├── admin/              # Dashboard admin
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── AnimationCard.tsx
│   │   │   │   ├── AnalyticsChart.tsx
│   │   │   │   └── ResultsTable.tsx
│   │   │   ├── shared/             # Composants réutilisables
│   │   │   │   ├── QRCodeGenerator.tsx
│   │   │   │   ├── ImageUpload.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   └── providers/
│   │   │       ├── AuthProvider.tsx
│   │   │       └── QueryProvider.tsx
│   │   ├── lib/
│   │   │   ├── api-client.ts       # Fetch wrapper REST API
│   │   │   ├── auth.ts             # JWT helpers
│   │   │   ├── utils.ts            # Helpers généraux
│   │   │   └── constants.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useWizard.ts
│   │   │   ├── useAnimation.ts
│   │   │   └── usePolling.ts       # Polling écran public
│   │   ├── stores/
│   │   │   ├── wizardStore.ts      # Zustand - wizard state
│   │   │   └── authStore.ts        # Zustand - auth state
│   │   ├── styles/
│   │   │   └── globals.css         # Tailwind imports
│   │   ├── types/                  # Types frontend-specific
│   │   │   └── index.ts
│   │   ├── public/
│   │   │   ├── images/
│   │   │   └── icons/
│   │   ├── .env.local
│   │   ├── .env.production
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── backend/                     # Fastify API
│       ├── src/
│       │   ├── index.ts            # Entry point
│       │   ├── app.ts              # Fastify app config
│       │   ├── routes/
│       │   │   ├── auth.routes.ts   # POST /auth/login, /auth/refresh
│       │   │   ├── animations.routes.ts # CRUD animations
│       │   │   ├── generations.routes.ts # POST /generations (async job)
│       │   │   ├── results.routes.ts # GET results, download
│       │   │   ├── ai-models.routes.ts # GET models from Payload
│       │   │   └── index.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── animations.controller.ts
│       │   │   ├── generations.controller.ts
│       │   │   └── results.controller.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── animations.service.ts
│       │   │   ├── ai-generation.service.ts # Orchestration IA
│       │   │   ├── openai.service.ts
│       │   │   ├── gemini.service.ts
│       │   │   ├── azure-blob.service.ts
│       │   │   ├── email.service.ts # Mailjet
│       │   │   └── jobs.service.ts  # Async jobs simple
│       │   ├── models/              # Mongoose schemas
│       │   │   ├── User.model.ts
│       │   │   ├── Animation.model.ts
│       │   │   ├── Generation.model.ts
│       │   │   ├── Session.model.ts # Refresh tokens
│       │   │   └── index.ts
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts # Vérification JWT
│       │   │   ├── error-handler.middleware.ts
│       │   │   ├── logger.middleware.ts
│       │   │   └── validation.middleware.ts
│       │   ├── utils/
│       │   │   ├── jwt.util.ts
│       │   │   ├── logger.util.ts   # Pino config
│       │   │   ├── retry.util.ts
│       │   │   └── image-processing.util.ts # Sharp
│       │   ├── config/
│       │   │   ├── database.config.ts # Mongoose Cosmos DB
│       │   │   ├── azure.config.ts
│       │   │   ├── ai-models.config.ts # Modèles IA hardcodés
│       │   │   └── env.config.ts
│       │   └── types/               # Types backend-specific
│       │       └── index.ts
│       ├── tests/
│       │   ├── unit/
│       │   │   ├── services/
│       │   │   └── utils/
│       │   └── integration/
│       │       └── routes/
│       ├── .env
│       ├── .env.production
│       ├── tsconfig.json
│       ├── package.json
│       └── README.md
│
├── packages/
│   └── shared/                      # Package partagé (npm link local)
│       ├── src/
│       │   ├── types/               # Types partagés
│       │   │   ├── animation.types.ts
│       │   │   ├── generation.types.ts
│       │   │   ├── user.types.ts
│       │   │   ├── ai-model.types.ts
│       │   │   ├── api.types.ts     # API contracts
│       │   │   └── index.ts
│       │   ├── constants/           # Constantes partagées
│       │   │   ├── error-codes.ts
│       │   │   ├── api-routes.ts
│       │   │   └── index.ts
│       │   ├── validation/          # Schémas Zod partagés
│       │   │   ├── animation.schema.ts
│       │   │   ├── user.schema.ts
│       │   │   └── index.ts
│       │   └── utils/               # Utilitaires partagés
│       │       ├── date.utils.ts
│       │       └── index.ts
│       ├── tsconfig.json
│       ├── package.json
│       └── README.md
│
├── scripts/                         # Scripts utilitaires
│   ├── setup-local.sh              # Setup env local
│   ├── seed-db.ts                  # Seed data dev
│   └── deploy.sh                   # Helper déploiement
│
├── docs/                           # Documentation
│   ├── architecture.md             # Ce fichier
│   ├── prd.md
│   ├── ux-design-specification.md
│   └── api/
│       └── openapi.yaml            # Spec OpenAPI REST API
│
├── .github/
│   └── workflows/
│       ├── frontend-deploy.yml
│       ├── backend-deploy.yml
│       └── tests.yml
│
├── .gitignore
├── package.json                    # Root package pour scripts
└── README.md
```

### Mapping FR Categories → Architecture

| FR Category | Frontend Location | Backend Location | Database Collections |
|-------------|-------------------|------------------|---------------------|
| **Auth & Users (FR1-5)** | `app/(auth)`, `stores/authStore.ts` | `routes/auth.routes.ts`, `services/auth.service.ts` | `users`, `sessions` |
| **Wizard Création (FR6-27)** | `app/(admin)/animations/new`, `components/wizard/*`, `stores/wizardStore.ts` | `routes/animations.routes.ts`, `services/animations.service.ts` | `animations` |
| **Expérience Participant (FR28-40)** | `app/a/[slug]`, `components/animation/*` | `routes/generations.routes.ts`, `services/ai-generation.service.ts` | `generations` |
| **Génération IA (FR41-49)** | N/A (backend only) | `services/openai.service.ts`, `services/gemini.service.ts`, `services/azure-blob.service.ts` | `generations`, Azure Blob |
| **Dashboard Admin (FR50-61)** | `app/(admin)/dashboard`, `app/(admin)/results`, `components/admin/*` | `routes/results.routes.ts` | `generations`, `animations` |
| **Écran Public (FR62-68)** | `app/display/[animationId]`, `components/animation/PublicDisplayScreen.tsx` | `routes/results.routes.ts` (GET results visibles) | `generations` |
| **Email & QR (FR69-76)** | `components/shared/QRCodeGenerator.tsx` | `services/email.service.ts` (Mailjet) | `animations` |
| **Modèles IA Config** | N/A (hardcodé MVP) | `config/ai-models.config.ts` (OpenAI + Gemini) | Config file |

### Points d'intégration

**Frontend ↔ Backend (REST API) :**
- Base URL : `process.env.NEXT_PUBLIC_API_URL`
- Authentication : Header `Authorization: Bearer <jwt>`
- Endpoints principaux :
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `GET /api/animations`
  - `POST /api/animations`
  - `PUT /api/animations/:id`
  - `POST /api/generations` (async job)
  - `GET /api/generations/status/:jobId`
  - `GET /api/results/:animationId`
  - `POST /api/results/:id/download`
  - `GET /api/ai-models` (liste modèles disponibles)

**Backend ↔ Cosmos DB (MongoDB API) :**
- Connection via Mongoose
- Connection string : `process.env.MONGODB_CONNECTION_STRING`
- Collections : `users`, `sessions`, `animations`, `generations`

**Backend ↔ Azure Blob Storage :**
- SDK : `@azure/storage-blob`
- Container : `generated-images`
- Naming : `{animationId}/{generationId}.png`
- Accès : URLs signées temporaires (SAS tokens, 1h)

**Backend ↔ Services externes :**
- OpenAI : `@openai/openai` SDK
- Google Gemini : `@google/generative-ai` SDK
- Mailjet : `node-mailjet` SDK

**Frontend (participant) ↔ Écran public :**
- Polling simple : Frontend poll `GET /api/results/:animationId` toutes les 5-10s
- Pas de WebSocket (simplicité MVP)

### Configuration modèles IA (MVP)

**Approche : Hardcodé dans config file TypeScript**

**Fichier :** `backend/src/config/ai-models.config.ts`

```typescript
export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'google'
  modelId: string
  capabilities: {
    requiresImage: boolean
    supportsEdit: boolean
    maxImageSize?: number
  }
  enabled: boolean
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'dalle-3',
    name: 'DALL-E 3',
    provider: 'openai',
    modelId: 'dall-e-3',
    capabilities: {
      requiresImage: false,
      supportsEdit: false,
      maxImageSize: 1024
    },
    enabled: true
  },
  {
    id: 'dalle-edit',
    name: 'DALL-E Image Edit',
    provider: 'openai',
    modelId: 'dall-e-2',
    capabilities: {
      requiresImage: true,
      supportsEdit: true,
      maxImageSize: 1024
    },
    enabled: true
  },
  {
    id: 'gemini-imagen',
    name: 'Google Gemini Imagen',
    provider: 'google',
    modelId: 'imagegeneration@006',
    capabilities: {
      requiresImage: false,
      supportsEdit: false,
      maxImageSize: 1024
    },
    enabled: true
  }
]
```

**Exposition via API :**
- `GET /api/ai-models` → Retourne la liste des modèles enabled
- Frontend wizard (Step 4) récupère les modèles disponibles
- Selection dropdown dynamique basé sur les modèles retournés

**Post-MVP (Sprint 2+) :**
Si besoin de gérer dynamiquement les modèles :
- Collection Cosmos DB `ai_models`
- UI admin : `app/(admin)/ai-models`
- Routes CRUD : `GET/POST/PUT/DELETE /api/ai-models`

**Rationale :**
- ✅ MVP simple : 3 modèles hardcodés suffisent
- ✅ Pas de CMS séparé à héberger (économie ~50-100€/mois)
- ✅ Type-safe avec TypeScript
- ✅ Versionné Git
- ✅ Extensible post-MVP si besoin

---

### Email Service Configuration (MVP)

**Approche : Templates Handlebars avec variables dynamiques**

Le système d'emails permet aux admins de personnaliser les emails envoyés aux participants après génération IA (FR69-73).

**Fichier :** `backend/src/services/email.service.ts`

#### Template Engine : Handlebars

**Choix :**
- Templates stockés comme **strings** dans `animations.emailConfig.bodyTemplate` (MongoDB)
- Engine : **Handlebars** (`handlebars` npm package)
- Variables remplacées dynamiquement lors de l'envoi

**Exemple Template :**
```html
<html>
<body>
  <h1>Salut {{name}} !</h1>
  <p>Ton avatar IA pour <strong>{{animationName}}</strong> est prêt !</p>
  <p><img src="{{imageUrl}}" alt="Ton avatar" width="400" /></p>
  <p><a href="{{downloadLink}}">Télécharger ton image</a></p>
  <p>Merci d'avoir participé !</p>
</body>
</html>
```

#### Variables Disponibles

Liste exhaustive des variables utilisables dans les templates :

| Variable | Type | Description | Exemple |
|----------|------|-------------|---------|
| `{{name}}` | string | Nom complet du participant (si collecté) | "Marie Dupont" |
| `{{firstName}}` | string | Prénom du participant (si collecté) | "Marie" |
| `{{lastName}}` | string | Nom de famille (si collecté) | "Dupont" |
| `{{email}}` | string | Email du participant (si collecté) | "marie@example.com" |
| `{{animationName}}` | string | Nom de l'animation | "Avatar Tech 2025" |
| `{{imageUrl}}` | string | URL de l'image générée (Azure Blob avec SAS token) | "https://..." |
| `{{downloadLink}}` | string | Lien direct de téléchargement | "https://app.com/download/abc123" |
| `{{qX}}` | string | Réponse à la question X (ex: `{{q1}}`, `{{q2}}`) | "Futuriste" |

**Notes :**
- Toutes les variables sont **optionnelles** (Handlebars ignore les variables manquantes)
- Variables `{{qX}}` dépendent des questions configurées dans l'animation

#### Validation Template

**Backend valide les templates lors de la sauvegarde (Epic 3.5) :**

```typescript
// email.service.ts
import Handlebars from 'handlebars'

export class EmailService {
  validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      // Compile template pour détecter erreurs syntaxe
      Handlebars.compile(template)
    } catch (error) {
      errors.push(`Syntaxe template invalide: ${error.message}`)
    }

    // Vérifier variables non supportées (optionnel)
    const allowedVars = ['name', 'firstName', 'lastName', 'email', 'animationName', 'imageUrl', 'downloadLink']
    const usedVars = template.match(/\{\{(\w+)\}\}/g) || []

    usedVars.forEach(varMatch => {
      const varName = varMatch.replace(/\{\{|\}\}/g, '')
      if (!allowedVars.includes(varName) && !varName.startsWith('q')) {
        errors.push(`Variable non supportée: {{${varName}}}`)
      }
    })

    return { valid: errors.length === 0, errors }
  }

  renderTemplate(template: string, data: EmailTemplateData): string {
    const compiledTemplate = Handlebars.compile(template)
    return compiledTemplate(data)
  }
}
```

#### Envoi Email via Mailjet

**Service Provider : Mailjet** (`node-mailjet` SDK)

```typescript
// email.service.ts
import Mailjet from 'node-mailjet'

export class EmailService {
  private mailjet: Mailjet

  constructor() {
    this.mailjet = new Mailjet({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_SECRET_KEY
    })
  }

  async sendGenerationEmail(
    recipientEmail: string,
    animation: Animation,
    generation: Generation
  ): Promise<void> {
    // Préparer données template
    const templateData = {
      name: generation.participantData.answers.name || '',
      firstName: generation.participantData.answers.firstName || '',
      lastName: generation.participantData.answers.lastName || '',
      email: recipientEmail,
      animationName: animation.name,
      imageUrl: generation.generationResult.imageUrl,
      downloadLink: `${process.env.NEXT_PUBLIC_APP_URL}/download/${generation._id}`,
      ...generation.participantData.answers // Ajouter toutes réponses (q1, q2, etc.)
    }

    // Render template
    const htmlBody = this.renderTemplate(
      animation.emailConfig.bodyTemplate,
      templateData
    )

    // Envoyer via Mailjet
    await this.mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: animation.emailConfig.senderEmail || process.env.MAILJET_SENDER_EMAIL,
            Name: animation.emailConfig.senderName || process.env.MAILJET_SENDER_NAME
          },
          To: [{ Email: recipientEmail }],
          Subject: animation.emailConfig.subject || `Ton résultat ${animation.name}`,
          HTMLPart: htmlBody
        }
      ]
    })

    logger.info({
      generationId: generation._id,
      recipientEmail
    }, 'Email sent successfully')
  }
}
```

#### Data Model (MongoDB)

**Collection `animations` - Champ `emailConfig` :**

```typescript
emailConfig: {
  enabled: boolean,              // Activer envoi emails
  subject: string,               // Sujet email (ex: "Ton avatar est prêt !")
  bodyTemplate: string,          // Template HTML avec variables Handlebars
  senderName: string,            // Nom expéditeur (ex: "AppsByMCI")
  senderEmail?: string           // Email expéditeur (optionnel, défaut: env var)
}
```

**Exemple stocké en DB :**
```json
{
  "emailConfig": {
    "enabled": true,
    "subject": "Ton avatar {{animationName}} est prêt !",
    "bodyTemplate": "<html><body><h1>Salut {{name}} !</h1><p>Ton avatar est prêt : <img src=\"{{imageUrl}}\" /></p></body></html>",
    "senderName": "MCI Events",
    "senderEmail": "events@mci.com"
  }
}
```

#### Template par Défaut (Wizard Step 5)

**Lorsque admin active les emails, pré-remplir avec template par défaut :**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #2563eb; }
    img { max-width: 100%; border-radius: 8px; margin: 20px 0; }
    .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
  </style>
</head>
<body>
  <h1>Salut {{name}} !</h1>
  <p>Ton résultat personnalisé pour <strong>{{animationName}}</strong> est prêt !</p>
  <img src="{{imageUrl}}" alt="Ton résultat" />
  <p>
    <a href="{{downloadLink}}" class="button">Télécharger mon image</a>
  </p>
  <p>Merci d'avoir participé !</p>
</body>
</html>
```

Admin peut modifier ce template dans le wizard (Step 5 - Email Config).

#### Retry Strategy

**En cas d'échec envoi email :**

```typescript
// Utilise le helper retry existant (architecture.md)
import { retryWithBackoff } from '@/utils/retry.util'

await retryWithBackoff(
  () => this.sendGenerationEmail(email, animation, generation),
  2  // Max 2 tentatives (pas critique comme génération IA)
)
```

Si échec après 2 tentatives :
- Log erreur (Pino → Azure App Insights)
- Flag `generation.emailSent = false`
- Admin peut réenvoyer manuellement depuis dashboard (Epic 5)

#### Post-MVP Enhancements (Sprint 2+)

1. **Templates Mailjet Cloud** : Gérer templates dans Mailjet UI (plus complexe, dépendance externe)
2. **Preview Email** : Bouton "Prévisualiser" dans wizard pour voir rendu avant publication
3. **Email Analytics** : Tracking ouvertures/clics via Mailjet
4. **Emails Multilingues** : Variables `{{lang}}` pour templates i18n
5. **Attachments** : Joindre image au lieu de lien (alourdis email)

#### Configuration Environnement

**Variables requises (voir `docs/environment-variables.md`) :**

```bash
# Backend .env
MAILJET_API_KEY="your-mailjet-api-key"
MAILJET_SECRET_KEY="your-mailjet-secret-key"
MAILJET_SENDER_EMAIL="noreply@appsbymci.com"
MAILJET_SENDER_NAME="AppsByMCI"
```

**Setup Mailjet :**
1. Créer compte sur https://www.mailjet.com
2. Vérifier domaine expéditeur (SPF, DKIM)
3. Générer API Key + Secret Key
4. Ajouter variables dans `.env`

#### Tests

**Tests Unitaires (Jest) :**

```typescript
// email.service.test.ts
describe('EmailService', () => {
  describe('renderTemplate', () => {
    it('should replace all variables', () => {
      const template = 'Hello {{name}}, your image: {{imageUrl}}'
      const data = { name: 'Marie', imageUrl: 'https://...' }
      const result = service.renderTemplate(template, data)
      expect(result).toBe('Hello Marie, your image: https://...')
    })

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, {{missing}}'
      const data = { name: 'Marie' }
      const result = service.renderTemplate(template, data)
      expect(result).toBe('Hello Marie, ')
    })
  })

  describe('validateTemplate', () => {
    it('should accept valid template', () => {
      const { valid } = service.validateTemplate('Hello {{name}}')
      expect(valid).toBe(true)
    })

    it('should reject invalid Handlebars syntax', () => {
      const { valid, errors } = service.validateTemplate('Hello {{name')
      expect(valid).toBe(false)
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
```

**Tests Intégration (avec Mailjet Sandbox) :**

```typescript
// Utiliser Mailjet sandbox mode pour tests
process.env.MAILJET_API_KEY = 'test-key'
process.env.MAILJET_SECRET_KEY = 'test-secret'

// Mailjet sandbox n'envoie pas vraiment emails
await service.sendGenerationEmail(...)
```

---

## Architecture en couches (Separation of Concerns)

### Philosophie : Code cloisonné et maintenable

**Chaque couche a UNE responsabilité claire.** Les agents AI doivent STRICTEMENT respecter cette séparation.

### Backend : Architecture stricte Route → Controller → Service → Model

#### Flux de données backend
```
HTTP Request
    ↓
[Route] Validation Zod + définition endpoint
    ↓
[Controller] Extraction données requête + formatage réponse HTTP
    ↓
[Service] Logique métier + orchestration
    ↓
[Model] Accès DB Mongoose
    ↓
HTTP Response
```

#### 1. Routes (`routes/*.routes.ts`)

**Responsabilités :**
- ✅ Définir les endpoints HTTP
- ✅ Validation schémas Zod
- ✅ Application middlewares
- ✅ Appel controllers

**❌ NE JAMAIS :**
- Logique métier
- Accès direct models
- Appels services externes

**Exemple :**
```typescript
// animations.routes.ts
import type { FastifyInstance } from 'fastify'
import { AnimationController } from '@/controllers/animations.controller'
import { authMiddleware } from '@/middleware/auth.middleware'
import { animationSchema } from '@shared/validation'

export async function animationRoutes(app: FastifyInstance) {
  const controller = new AnimationController()

  app.addHook('preHandler', authMiddleware)

  app.get('/animations', controller.list)

  app.post('/animations', {
    schema: { body: animationSchema.create }
  }, controller.create)

  app.get('/animations/:animationId', controller.getById)
  app.put('/animations/:animationId', controller.update)
  app.delete('/animations/:animationId', controller.delete)
}
```

#### 2. Controllers (`controllers/*.controller.ts`)

**Responsabilités :**
- ✅ Extraire données requête (body, params, query, user)
- ✅ Appeler services appropriés
- ✅ Formatter réponse HTTP standardisée
- ✅ Gestion status codes HTTP

**❌ NE JAMAIS :**
- Logique métier complexe
- Accès direct models Mongoose
- Appels externes (OpenAI, Azure, etc.)

**Exemple :**
```typescript
// animations.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify'
import { AnimationService } from '@/services/animations.service'
import { logger } from '@/utils/logger.util'
import type { CreateAnimationDTO } from '@shared/types'

export class AnimationController {
  private animationService = new AnimationService()

  create = async (
    request: FastifyRequest<{ Body: CreateAnimationDTO }>,
    reply: FastifyReply
  ) => {
    try {
      const userId = request.user.id // Extrait du JWT

      const animation = await this.animationService.createAnimation({
        ...request.body,
        userId
      })

      return reply.status(201).send({
        success: true,
        data: animation
      })
    } catch (error) {
      logger.error({ error }, 'Failed to create animation')
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_5001',
          message: 'Erreur création animation'
        }
      })
    }
  }

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user.id
    const animations = await this.animationService.getAnimationsByUser(userId)
    return reply.send({ success: true, data: animations })
  }

  getById = async (
    request: FastifyRequest<{ Params: { animationId: string } }>,
    reply: FastifyReply
  ) => {
    const { animationId } = request.params
    const animation = await this.animationService.getAnimationById(animationId)

    if (!animation) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RESOURCE_3001', message: 'Animation non trouvée' }
      })
    }

    return reply.send({ success: true, data: animation })
  }
}
```

#### 3. Services (`services/*.service.ts`)

**Responsabilités :**
- ✅ Logique métier pure
- ✅ Orchestration models
- ✅ Appels autres services
- ✅ Transactions complexes
- ✅ Validations métier

**❌ NE JAMAIS :**
- Accès requête HTTP (request/reply)
- Gestion status codes HTTP
- Formatage réponse HTTP

**Exemple :**
```typescript
// animations.service.ts
import { AnimationModel } from '@/models/Animation.model'
import { logger } from '@/utils/logger.util'
import type { Animation, CreateAnimationDTO } from '@shared/types'

export class AnimationService {
  async createAnimation(data: CreateAnimationDTO): Promise<Animation> {
    logger.info({ data }, 'Creating animation')

    // Logique métier : génération slug automatique
    const slug = data.slug || this.generateSlug(data.name)

    // Validation métier : slug unique
    const existing = await AnimationModel.findOne({ slug })
    if (existing) {
      throw new Error('Slug already exists')
    }

    const animation = await AnimationModel.create({
      ...data,
      slug,
      status: 'draft' // Business rule
    })

    logger.info({ animationId: animation._id }, 'Animation created')
    return animation.toObject()
  }

  async getAnimationsByUser(userId: string): Promise<Animation[]> {
    return AnimationModel.find({ userId }).sort({ createdAt: -1 }).lean()
  }

  async getAnimationById(id: string): Promise<Animation | null> {
    return AnimationModel.findById(id).lean()
  }

  async publishAnimation(id: string): Promise<Animation> {
    const animation = await AnimationModel.findById(id)
    if (!animation) throw new Error('Animation not found')

    // Validation métier avant publication
    this.validateForPublishing(animation)

    animation.status = 'published'
    animation.publishedAt = new Date()
    await animation.save()

    logger.info({ animationId: id }, 'Animation published')
    return animation.toObject()
  }

  // Méthodes privées : helpers métier
  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  private validateForPublishing(animation: any): void {
    if (!animation.name) throw new Error('Name required')
    if (!animation.pipeline?.length) throw new Error('Pipeline required')
  }
}
```

#### 4. Models (`models/*.model.ts`)

**Responsabilités :**
- ✅ Schémas Mongoose
- ✅ Indexes DB
- ✅ Méthodes instance simples

**❌ NE JAMAIS :**
- Logique métier complexe
- Appels autres services
- Appels externes (API, Azure)

**Exemple :**
```typescript
// Animation.model.ts
import mongoose, { Schema, Document } from 'mongoose'
import type { Animation } from '@shared/types'

interface AnimationDocument extends Animation, Document {}

const animationSchema = new Schema<AnimationDocument>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    pipeline: Schema.Types.Mixed,
    publishedAt: Date
  },
  {
    timestamps: true,
    collection: 'animations'
  }
)

animationSchema.index({ userId: 1, status: 1 })

export const AnimationModel = mongoose.model<AnimationDocument>(
  'Animation',
  animationSchema
)
```

---

### Frontend : Architecture Services + Hooks + Stores

#### Flux de données frontend
```
User Interaction
    ↓
[Page/Component] UI + appel hooks
    ↓
[Hook] State local + appel services
    ↓
[Service] Appel API + logique métier frontend
    ↓
[Store] State global (Zustand)
```

#### 1. Services (`lib/services/*.service.ts`)

**Responsabilités :**
- ✅ Appels API REST
- ✅ Transformation données API → UI
- ✅ Logique métier frontend
- ✅ Gestion erreurs API

**❌ NE JAMAIS :**
- State management (utiliser hooks/stores)
- Manipulation DOM
- Logique rendu React

**Exemple :**
```typescript
// animation.service.ts
import { apiClient } from '@/lib/api-client'
import type { Animation, CreateAnimationDTO } from '@shared/types'

export class AnimationService {
  private baseUrl = '/api/animations'

  async getAnimations(): Promise<Animation[]> {
    const response = await apiClient.get<{ success: true; data: Animation[] }>(
      this.baseUrl
    )
    return response.data
  }

  async getAnimationById(id: string): Promise<Animation> {
    const response = await apiClient.get<{ success: true; data: Animation }>(
      `${this.baseUrl}/${id}`
    )
    return response.data
  }

  async createAnimation(data: CreateAnimationDTO): Promise<Animation> {
    const response = await apiClient.post<{ success: true; data: Animation }>(
      this.baseUrl,
      data
    )
    return response.data
  }

  async publishAnimation(id: string): Promise<Animation> {
    // Validation métier frontend avant envoi
    const animation = await this.getAnimationById(id)
    if (!animation.name || !animation.pipeline) {
      throw new Error('Animation incomplète')
    }

    const response = await apiClient.post<{ success: true; data: Animation }>(
      `${this.baseUrl}/${id}/publish`
    )
    return response.data
  }

  async duplicateAnimation(id: string): Promise<Animation> {
    const original = await this.getAnimationById(id)

    // Logique métier : créer copie
    return this.createAnimation({
      ...original,
      name: `${original.name} (copie)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      status: 'draft'
    })
  }
}

// Instance singleton
export const animationService = new AnimationService()
```

#### 2. Hooks (`hooks/*.ts`)

**Responsabilités :**
- ✅ State local hook
- ✅ Effects (useEffect)
- ✅ Appel services
- ✅ Logique réutilisable

**Exemple :**
```typescript
// useAnimation.ts
import { useState, useEffect } from 'react'
import { animationService } from '@/lib/services/animation.service'
import type { Animation } from '@shared/types'

export function useAnimation(id: string) {
  const [animation, setAnimation] = useState<Animation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    loadAnimation()
  }, [id])

  const loadAnimation = async () => {
    try {
      setLoading(true)
      const data = await animationService.getAnimationById(id)
      setAnimation(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const updateAnimation = async (updates: Partial<Animation>) => {
    const updated = await animationService.updateAnimation(id, updates)
    setAnimation(updated)
    return updated
  }

  return {
    animation,
    loading,
    error,
    reload: loadAnimation,
    update: updateAnimation
  }
}
```

#### 3. Stores (`stores/*.ts`)

**Responsabilités :**
- ✅ State global partagé
- ✅ Actions state management

**Exemple :**
```typescript
// wizardStore.ts
import { create } from 'zustand'
import type { Animation } from '@shared/types'

interface WizardState {
  currentStep: number
  animationData: Partial<Animation>

  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateData: (data: Partial<Animation>) => void
  resetWizard: () => void
}

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 0,
  animationData: {},

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: state.currentStep - 1 })),
  updateData: (data) => set((state) => ({
    animationData: { ...state.animationData, ...data }
  })),
  resetWizard: () => set({ currentStep: 0, animationData: {} })
}))
```

#### 4. Composants (`components/**/*.tsx`)

**Responsabilités :**
- ✅ Rendu UI
- ✅ Appel hooks/services
- ✅ Gestion événements
- ✅ State local UI

**❌ NE JAMAIS :**
- Appels fetch directs
- Logique métier complexe

**Exemple :**
```typescript
// AnimationCard.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { animationService } from '@/lib/services/animation.service'
import type { Animation } from '@shared/types'

interface AnimationCardProps {
  animation: Animation
  onDelete?: () => void
}

export function AnimationCard({ animation, onDelete }: AnimationCardProps) {
  const [loading, setLoading] = useState(false)

  const handleDuplicate = async () => {
    try {
      setLoading(true)
      await animationService.duplicateAnimation(animation._id)
      // Toast success
    } catch (error) {
      console.error('Failed to duplicate', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3>{animation.name}</h3>
      <Button onClick={handleDuplicate} disabled={loading}>
        Dupliquer
      </Button>
    </div>
  )
}
```

---

### Structure des fichiers mise à jour

**Backend :**
```
apps/backend/src/
├── routes/              # Définition endpoints
│   ├── auth.routes.ts
│   ├── animations.routes.ts
│   └── generations.routes.ts
├── controllers/         # Gestion HTTP
│   ├── auth.controller.ts
│   ├── animations.controller.ts
│   └── generations.controller.ts
├── services/            # Logique métier
│   ├── auth.service.ts
│   ├── animations.service.ts
│   ├── ai-generation.service.ts
│   ├── openai.service.ts
│   ├── azure-blob.service.ts
│   └── email.service.ts
├── models/              # Schémas Mongoose
│   ├── User.model.ts
│   ├── Animation.model.ts
│   └── Generation.model.ts
```

**Frontend :**
```
apps/frontend/
├── app/                 # Pages Next.js
├── components/          # Composants UI
├── lib/
│   └── services/        # Services API
│       ├── animation.service.ts
│       ├── generation.service.ts
│       └── auth.service.ts
├── hooks/               # Hooks custom
│   ├── useAuth.ts
│   ├── useAnimation.ts
│   └── useWizard.ts
├── stores/              # State global Zustand
│   ├── authStore.ts
│   └── wizardStore.ts
```

---

## Patterns d'implémentation (Consistency Rules)

Ces patterns garantissent que tous les agents AI implémentent le code de manière cohérente et compatible.

### Naming Conventions

#### Fichiers et dossiers

**Frontend (Next.js) :**
- Routes : `kebab-case` - `app/(admin)/animations/new/page.tsx`
- Composants React : `PascalCase.tsx` - `WizardStepper.tsx`, `AnimationCard.tsx`
- Hooks : `camelCase.ts` avec préfixe `use` - `useAuth.ts`, `useWizard.ts`
- Utilitaires : `kebab-case.ts` - `api-client.ts`, `date-utils.ts`
- Stores Zustand : `camelCase.ts` avec suffixe `Store` - `wizardStore.ts`, `authStore.ts`
- Types : `kebab-case.ts` - `animation.types.ts`, `user.types.ts`

**Backend (Fastify) :**
- Routes : `kebab-case.ts` avec suffixe `.routes` - `animations.routes.ts`
- Controllers : `kebab-case.ts` avec suffixe `.controller` - `animations.controller.ts`
- Services : `kebab-case.ts` avec suffixe `.service` - `ai-generation.service.ts`
- Models Mongoose : `PascalCase.ts` avec suffixe `.model` - `Animation.model.ts`, `User.model.ts`
- Middleware : `kebab-case.ts` avec suffixe `.middleware` - `auth.middleware.ts`
- Utils : `kebab-case.ts` avec suffixe `.util` - `jwt.util.ts`, `retry.util.ts`
- Config : `kebab-case.ts` avec suffixe `.config` - `database.config.ts`, `ai-models.config.ts`

**Package shared :**
- Types : `kebab-case.ts` avec suffixe `.types` - `animation.types.ts`
- Schemas Zod : `kebab-case.ts` avec suffixe `.schema` - `animation.schema.ts`
- Constants : `kebab-case.ts` - `error-codes.ts`, `api-routes.ts`

#### Code TypeScript

**Variables et fonctions :**
```typescript
// Variables : camelCase
const animationId = '123'
const isPublished = true
const generationStatus = 'pending'

// Fonctions : camelCase, verbes descriptifs
function createAnimation() { }
function validateInput() { }
async function generateImage() { }

// Constantes globales : UPPER_SNAKE_CASE
const MAX_RETRIES = 3
const DEFAULT_TIMEOUT = 30000
const API_BASE_URL = process.env.API_URL
```

**Classes et interfaces :**
```typescript
// Classes : PascalCase
class AnimationService { }
class AIGenerationService { }

// Interfaces : PascalCase
interface Animation { }
interface UserRepository { }

// Types : PascalCase
type AnimationStatus = 'draft' | 'published' | 'archived'
type GenerationResult = { imageUrl: string; metadata: object }

// Enums : PascalCase, valeurs string lowercase
enum AnimationStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}
```

**Composants React :**
```typescript
// Composant : PascalCase
export function WizardStepper({ step }: WizardStepperProps) { }

// Props interface : Nom du composant + Props
interface WizardStepperProps {
  step: number
  onNext: () => void
}

// Hooks personnalisés : camelCase avec use
export function useWizard() { }
export function useAnimation(id: string) { }
```

#### Base de données (MongoDB)

**Collections : snake_case pluriel**
```
users
animations
generations
sessions
```

**Champs documents : camelCase**
```typescript
{
  _id: ObjectId,
  userId: string,
  animationName: string,
  createdAt: Date,
  updatedAt: Date,
  isPublished: boolean
}
```

**IMPORTANT : Pas de champs avec underscores sauf _id**
```typescript
// ✅ Correct
{ userId: '123', createdAt: Date }

// ❌ Incorrect
{ user_id: '123', created_at: Date }
```

#### API REST

**Routes : kebab-case, pluriel pour ressources**
```
GET    /api/animations
POST   /api/animations
GET    /api/animations/:id
PUT    /api/animations/:id
DELETE /api/animations/:id

POST   /api/auth/login
POST   /api/auth/refresh

POST   /api/generations
GET    /api/generations/status/:jobId

GET    /api/results/:animationId
```

**Paramètres de route : camelCase avec deux-points**
```typescript
// ✅ Correct
app.get('/api/animations/:animationId', handler)

// ❌ Incorrect
app.get('/api/animations/:animation_id', handler)
```

**Query params : camelCase**
```
GET /api/results?animationId=123&status=completed&page=1
```

### Structure de code

#### Composants React (Frontend)

**Ordre des sections :**
```typescript
// 1. Imports (externes → internes → composants → hooks → types)
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useWizard } from '@/hooks/useWizard'
import type { Animation } from '@shared/types'

// 2. Types/Interfaces
interface WizardStepperProps {
  initialStep?: number
  onComplete: (data: Animation) => void
}

// 3. Composant
export function WizardStepper({ initialStep = 0, onComplete }: WizardStepperProps) {
  // 3a. Hooks (state → router → custom)
  const [currentStep, setCurrentStep] = useState(initialStep)
  const { saveStep } = useWizard()

  // 3b. Handlers
  const handleNext = async () => { }

  // 3c. Effects (si nécessaire)
  // useEffect(() => { }, [])

  // 3d. Render
  return <div>...</div>
}
```

#### Services Backend (Fastify)

**Ordre des méthodes : CRUD (create, read, update, delete)**
```typescript
export class AnimationService {
  async createAnimation(data: CreateAnimationDTO): Promise<Animation> {
    logger.info({ data }, 'Creating animation')
    const animation = await AnimationModel.create(data)
    return animation.toObject()
  }

  async getAnimationById(id: string): Promise<Animation | null> {
    return AnimationModel.findById(id).lean()
  }

  async updateAnimation(id: string, data: Partial<Animation>) {
    return AnimationModel.findByIdAndUpdate(id, data, { new: true }).lean()
  }

  async deleteAnimation(id: string): Promise<boolean> {
    const result = await AnimationModel.findByIdAndDelete(id)
    return !!result
  }

  // Méthodes privées à la fin
  private async validateData(data: unknown): Promise<boolean> { }
}
```

### Formats de données

#### API Responses (standardisé)

```typescript
// Succès
{
  success: true,
  data: T
}

// Erreur
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'User-friendly message',
    details?: any // Dev only
  }
}

// Pagination
{
  success: true,
  data: T[],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 156,
    totalPages: 8
  }
}
```

**Codes d'erreur constants :**
```typescript
// packages/shared/src/constants/error-codes.ts
export const ERROR_CODES = {
  // Auth (1xxx)
  INVALID_CREDENTIALS: 'AUTH_1001',
  TOKEN_EXPIRED: 'AUTH_1002',
  UNAUTHORIZED: 'AUTH_1003',

  // Validation (2xxx)
  VALIDATION_ERROR: 'VALIDATION_2001',
  MISSING_FIELD: 'VALIDATION_2002',

  // Resource (3xxx)
  NOT_FOUND: 'RESOURCE_3001',
  ALREADY_EXISTS: 'RESOURCE_3002',

  // External (4xxx)
  AI_GENERATION_FAILED: 'EXTERNAL_4001',
  AZURE_BLOB_ERROR: 'EXTERNAL_4002',

  // Internal (5xxx)
  INTERNAL_ERROR: 'INTERNAL_5001',
  DATABASE_ERROR: 'INTERNAL_5002'
} as const
```

#### Dates et timestamps

```typescript
// Stockage DB : ISO 8601 strings
const createdAt = new Date().toISOString() // "2025-11-21T10:30:00.000Z"

// Manipulation : date-fns
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

// Affichage utilisateur
format(parseISO(dateFromDB), 'dd/MM/yyyy à HH:mm', { locale: fr })
// "21/11/2025 à 10:30"
```

### Organisation tests

```typescript
// Backend : *.test.ts ou *.spec.ts
// Frontend : *.test.tsx

// Structure AAA (Arrange, Act, Assert)
describe('AnimationService', () => {
  describe('createAnimation', () => {
    it('should create animation with valid data', async () => {
      // Arrange
      const data = { name: 'Test', slug: 'test' }

      // Act
      const result = await service.createAnimation(data)

      // Assert
      expect(result).toBeDefined()
      expect(result.name).toBe('Test')
    })
  })
})
```

### Commentaires

```typescript
// ✅ Bon : Expliquer le POURQUOI
// Retry avec backoff car API OpenAI instable
await retryWithBackoff(() => generateImage(prompt), 3)

// ❌ Mauvais : Répéter le code
// Appelle retryWithBackoff
await retryWithBackoff(() => generateImage(prompt), 3)

// JSDoc pour fonctions publiques complexes
/**
 * Génère une image via IA avec retry automatique
 * @param prompt - Prompt de génération
 * @param modelId - ID du modèle (dalle-3, gemini, etc.)
 * @returns URL de l'image sur Azure Blob
 * @throws {AIGenerationError} Si échec après retries
 */
async function generateImage(prompt: string, modelId: string): Promise<string>
```

### Git commits

```
Format : <type>(<scope>): <description>

Types :
- feat     : Nouvelle feature
- fix      : Bug fix
- refactor : Refactoring
- docs     : Documentation
- test     : Tests
- chore    : Config, deps

Exemples :
feat(wizard): add pipeline drag-and-drop
fix(auth): handle expired JWT correctly
refactor(ai): extract generation to service
```

---

## Instructions pour l'agent de développement

### Workflow Git : Commits fréquents obligatoires

**RÈGLE CRITIQUE : Committer à la fin de chaque tâche**

Lors de l'implémentation d'une story, l'agent dev **DOIT** créer un commit Git après la complétion de **chaque tâche individuelle**. Ceci permet de revenir en arrière facilement si une tâche introduit des problèmes.

#### Granularité des commits

**✅ Bon exemple de découpage :**

Story : "Créer le wizard de création d'animation (8 étapes)"

```bash
# Tâche 1 : Setup structure wizard
git add .
git commit -m "feat(wizard): add wizard stepper component structure"

# Tâche 2 : Implémentation Step 1 (General Info)
git add .
git commit -m "feat(wizard): implement step 1 general info form"

# Tâche 3 : Implémentation Step 2 (Access Config)
git add .
git commit -m "feat(wizard): implement step 2 access configuration"

# Tâche 4 : State management Zustand
git add .
git commit -m "feat(wizard): add zustand store for wizard state"

# Tâche 5 : Validation formulaires
git add .
git commit -m "feat(wizard): add zod validation for wizard steps"

# Tâche 6 : Tests unitaires
git add .
git commit -m "test(wizard): add tests for wizard stepper"
```

**❌ Mauvais exemple :**

```bash
# UN SEUL commit pour toute la story
git add .
git commit -m "feat(wizard): implement complete 8-step wizard"
```

#### Règles de commit pour l'agent dev

**OBLIGATOIRE :**
- ✅ **1 commit = 1 tâche complète et fonctionnelle**
- ✅ Tester que le code compile avant de committer
- ✅ Message de commit descriptif (suivre format conventional commits)
- ✅ Ne pas committer de code cassé (sauf si explicitement en WIP)

**INTERDIT :**
- ❌ Regrouper plusieurs tâches dans un seul commit
- ❌ Committer du code qui ne compile pas (sauf WIP explicite)
- ❌ Messages de commit vagues ("fix", "update", "wip")
- ❌ Passer plusieurs heures sans committer

#### Quand committer ?

**Points de commit obligatoires :**

1. **Après création d'un nouveau fichier fonctionnel**
   ```bash
   # Exemple
   git add apps/backend/src/services/animations.service.ts
   git commit -m "feat(animations): add animations service with CRUD methods"
   ```

2. **Après implémentation d'une fonctionnalité complète**
   ```bash
   # Exemple
   git add apps/frontend/components/wizard/steps/Step1GeneralInfo.tsx
   git commit -m "feat(wizard): implement general info step with form validation"
   ```

3. **Après ajout de tests pour une feature**
   ```bash
   # Exemple
   git add apps/backend/src/services/__tests__/animations.service.test.ts
   git commit -m "test(animations): add unit tests for animations service"
   ```

4. **Après fix d'un bug découvert en cours de dev**
   ```bash
   # Exemple
   git add apps/backend/src/controllers/animations.controller.ts
   git commit -m "fix(animations): handle null animation in getById endpoint"
   ```

5. **Après refactoring d'une section**
   ```bash
   # Exemple
   git add apps/frontend/lib/services/animation.service.ts
   git commit -m "refactor(animations): extract duplicate logic to helper function"
   ```

#### Format des messages de commit

**Structure obligatoire :**
```
<type>(<scope>): <description>

[optional body]
```

**Types autorisés :**
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `refactor` : Refactoring sans changement de comportement
- `test` : Ajout ou modification de tests
- `docs` : Documentation uniquement
- `chore` : Configuration, dependencies, etc.
- `style` : Formatage, lint (pas de changement de logique)

**Exemples concrets :**
```bash
feat(wizard): add step navigation with prev/next buttons
fix(auth): handle JWT expiration correctly
refactor(services): extract retry logic to utility function
test(animations): add integration tests for CRUD endpoints
docs(api): update OpenAPI spec for animations endpoints
chore(deps): update mongoose to v8.0.0
```

#### Stratégie de rollback

Si une tâche introduit des problèmes :

**Option 1 : Revert du dernier commit**
```bash
# Annuler le dernier commit (garde les modifications)
git revert HEAD

# Ou reset hard si commit pas encore push
git reset --hard HEAD~1
```

**Option 2 : Revert d'un commit spécifique**
```bash
# Trouver le hash du commit problématique
git log --oneline

# Revert ce commit spécifique
git revert <commit-hash>
```

**Option 3 : Revenir à un état stable**
```bash
# Revenir 3 commits en arrière
git reset --hard HEAD~3

# Ou revenir à un commit spécifique
git reset --hard <commit-hash>
```

#### Checklist avant chaque commit

L'agent dev doit vérifier :

- [ ] Le code compile sans erreur
- [ ] Les tests existants passent
- [ ] Le code suit les conventions de naming
- [ ] Pas de `console.log` ou debug code oublié
- [ ] Les imports sont corrects
- [ ] Le message de commit est descriptif

#### Workflow complet d'une story

```bash
# 1. Créer une branche pour la story
git checkout -b feature/wizard-creation

# 2. Implémenter tâche 1
# ... code ...
git add .
git commit -m "feat(wizard): add wizard stepper component"

# 3. Implémenter tâche 2
# ... code ...
git add .
git commit -m "feat(wizard): implement step 1 general info"

# 4. Implémenter tâche 3
# ... code ...
git add .
git commit -m "feat(wizard): implement step 2 access config"

# Etc. pour chaque tâche...

# 5. À la fin de la story : push la branche
git push origin feature/wizard-creation

# 6. Créer une PR (optionnel selon workflow)
```

#### Cas particuliers

**WIP (Work In Progress) :**
Si besoin de sauvegarder du code non fini :
```bash
git add .
git commit -m "wip(wizard): partial implementation step 3 (NOT FUNCTIONAL)"
```

**Squash avant merge :**
Si la story contient beaucoup de petits commits, possibilité de squash avant merge en main :
```bash
# Squash des 5 derniers commits
git rebase -i HEAD~5

# Dans l'éditeur, marquer tous sauf le premier comme "squash"
```

Mais **toujours garder les commits granulaires pendant le développement** pour faciliter les rollbacks.

---

### Résumé pour l'agent dev

**La règle d'or : 1 tâche = 1 commit**

Ceci garantit :
- ✅ Points de retour sûrs après chaque tâche
- ✅ Historique Git lisible et exploitable
- ✅ Facilité de rollback si problème
- ✅ Revue de code plus simple (commits atomiques)
- ✅ Pas de perte de travail importante

**En cas de doute : committer plus souvent que pas assez.**

---

## Data Model et flux de données

### Vue d'ensemble des collections

Le système utilise **4 collections MongoDB principales** dans Cosmos DB :

```
users          → Admins qui créent les animations
animations     → Animations configurées (wizard 8 étapes)
generations    → Résultats générés pour chaque participant
sessions       → Refresh tokens JWT pour auth
```

**Stockage externe :**
- **Azure Blob Storage** : Images générées par IA (référencées dans `generations`)

---

### 1. Collection `users`

**Rôle :** Comptes admins qui créent et gèrent les animations

**Schéma :**
```typescript
{
  _id: ObjectId,
  email: string,              // Email unique
  passwordHash: string,        // Bcrypt hash
  name: string,               // Nom affichage
  role: 'admin' | 'editor' | 'viewer', // Sprint 1 : tous 'admin'
  createdAt: Date,
  updatedAt: Date
}
```

**Exemple :**
```json
{
  "_id": "6565f1a2b3c4d5e6f7a8b9c0",
  "email": "fab@mci.com",
  "passwordHash": "$2b$10$...",
  "name": "Fab",
  "role": "admin",
  "createdAt": "2025-11-21T10:00:00.000Z",
  "updatedAt": "2025-11-21T10:00:00.000Z"
}
```

**Indexes :**
- `email` (unique)

---

### 2. Collection `animations`

**Rôle :** Stocke la configuration complète de chaque animation créée via le wizard

**Schéma :**
```typescript
{
  _id: ObjectId,
  userId: string,              // Référence users._id

  // Step 1 : General Info
  name: string,
  description?: string,
  slug: string,                // URL slug unique (ex: "mon-event-2025")

  // Step 2 : Access Config
  accessConfig: {
    type: 'none' | 'code' | 'email' | 'email-domain',
    code?: string,             // Si type='code'
    emailDomain?: string,      // Si type='email-domain'
    requireEmail: boolean      // Si type='email'
  },

  // Step 3 : Input Collection
  inputCollection: {
    requireSelfie: boolean,
    questions: [
      {
        id: string,
        type: 'text' | 'textarea' | 'choice' | 'email',
        label: string,
        placeholder?: string,
        required: boolean,
        options?: string[]     // Si type='choice'
      }
    ]
  },

  // Step 4 : Pipeline (blocs de traitement)
  pipeline: [
    {
      id: string,
      type: 'preprocessing' | 'ai-generation' | 'postprocessing',
      order: number,
      config: {
        // Config spécifique au type de bloc
        modelId?: string,         // Ex: 'dalle-3', 'gemini-imagen'
        promptTemplate?: string,  // Ex: "Generate {style} portrait of {name}"
        imageTransform?: object   // Ex: crop, resize, filters
      }
    }
  ],

  // Step 5 : Email Config
  emailConfig: {
    enabled: boolean,
    subject: string,
    bodyTemplate: string,      // Template avec variables {{name}}, etc.
    senderName: string
  },

  // Step 6 : Public Display Config
  publicDisplayConfig: {
    enabled: boolean,
    layout: 'masonry' | 'grid' | 'carousel',
    showParticipantName: boolean,
    refreshInterval: number    // Secondes
  },

  // Step 7 : Customization
  customization: {
    primaryColor?: string,
    logo?: string,            // URL vers logo uploadé
    thankYouMessage?: string
  },

  // Métadonnées
  status: 'draft' | 'published' | 'archived',
  qrCodeUrl?: string,         // URL du QR code généré
  publishedAt?: Date,
  archivedAt?: Date,

  createdAt: Date,
  updatedAt: Date
}
```

**Exemple concret :**
```json
{
  "_id": "6565f2b3c4d5e6f7a8b9c1d2",
  "userId": "6565f1a2b3c4d5e6f7a8b9c0",
  "name": "Avatar IA - Événement Tech 2025",
  "description": "Crée ton avatar IA personnalisé",
  "slug": "avatar-tech-2025",

  "accessConfig": {
    "type": "none",
    "requireEmail": true
  },

  "inputCollection": {
    "requireSelfie": true,
    "questions": [
      {
        "id": "q1",
        "type": "text",
        "label": "Ton prénom",
        "required": true
      },
      {
        "id": "q2",
        "type": "choice",
        "label": "Ton style préféré",
        "options": ["Futuriste", "Cartoon", "Réaliste"],
        "required": true
      }
    ]
  },

  "pipeline": [
    {
      "id": "block1",
      "type": "preprocessing",
      "order": 1,
      "config": {
        "imageTransform": {
          "crop": "square",
          "resize": 512
        }
      }
    },
    {
      "id": "block2",
      "type": "ai-generation",
      "order": 2,
      "config": {
        "modelId": "dalle-3",
        "promptTemplate": "Create a {q2} style portrait of {q1}"
      }
    }
  ],

  "emailConfig": {
    "enabled": true,
    "subject": "Ton avatar IA est prêt !",
    "bodyTemplate": "Salut {{name}}, voici ton avatar généré par IA !",
    "senderName": "MCI Events"
  },

  "publicDisplayConfig": {
    "enabled": true,
    "layout": "masonry",
    "showParticipantName": true,
    "refreshInterval": 10
  },

  "customization": {
    "primaryColor": "#2563eb",
    "thankYouMessage": "Merci d'avoir participé !"
  },

  "status": "published",
  "qrCodeUrl": "https://appsbymci.blob.core.windows.net/qrcodes/avatar-tech-2025.png",
  "publishedAt": "2025-11-21T14:00:00.000Z",
  "createdAt": "2025-11-21T10:30:00.000Z",
  "updatedAt": "2025-11-21T14:00:00.000Z"
}
```

**Indexes :**
- `userId` (index)
- `slug` (unique)
- `{ userId: 1, status: 1 }` (compound - liste animations par user + status)

---

### 3. Collection `generations`

**Rôle :** Stocke chaque résultat généré pour un participant

**C'est la collection centrale qui relie une animation à ses résultats.**

**Schéma :**
```typescript
{
  _id: ObjectId,
  animationId: string,        // Référence animations._id

  // Données participant
  participantData: {
    email?: string,           // Si collecté
    answers: {
      [questionId: string]: any  // Réponses aux questions
    },
    selfieUrl?: string,       // URL Azure Blob du selfie uploadé
  },

  // Résultat génération IA
  generationResult: {
    status: 'pending' | 'processing' | 'completed' | 'failed',
    imageUrl?: string,        // URL Azure Blob de l'image générée
    modelUsed?: string,       // Ex: 'dalle-3'
    promptUsed?: string,      // Prompt final envoyé à l'IA
    metadata?: {
      generationTime: number, // ms
      retryCount: number,
      errorMessage?: string
    }
  },

  // Email
  emailSent: boolean,
  emailSentAt?: Date,

  // Affichage public
  visibleOnPublicDisplay: boolean,  // Admin peut masquer/afficher

  // Métadonnées
  createdAt: Date,
  updatedAt: Date
}
```

**Exemple concret :**
```json
{
  "_id": "6565f3c4d5e6f7a8b9c2d3e4",
  "animationId": "6565f2b3c4d5e6f7a8b9c1d2",

  "participantData": {
    "email": "participant@example.com",
    "answers": {
      "q1": "Marie",
      "q2": "Futuriste"
    },
    "selfieUrl": "https://appsbymci.blob.core.windows.net/uploads/6565f3c4d5e6f7a8b9c2d3e4-selfie.jpg"
  },

  "generationResult": {
    "status": "completed",
    "imageUrl": "https://appsbymci.blob.core.windows.net/generated/6565f3c4d5e6f7a8b9c2d3e4-result.png",
    "modelUsed": "dalle-3",
    "promptUsed": "Create a Futuriste style portrait of Marie",
    "metadata": {
      "generationTime": 18500,
      "retryCount": 0
    }
  },

  "emailSent": true,
  "emailSentAt": "2025-11-21T15:05:32.000Z",

  "visibleOnPublicDisplay": true,

  "createdAt": "2025-11-21T15:05:00.000Z",
  "updatedAt": "2025-11-21T15:05:32.000Z"
}
```

**Indexes :**
- `animationId` (index - requêtes fréquentes)
- `{ animationId: 1, visibleOnPublicDisplay: 1 }` (compound - écran public)
- `createdAt` (desc - tri chronologique)

---

### 4. Collection `sessions`

**Rôle :** Stocke les refresh tokens JWT pour l'authentification

**Schéma :**
```typescript
{
  _id: ObjectId,
  userId: string,              // Référence users._id
  refreshToken: string,        // Token haché
  expiresAt: Date,            // 7 jours
  createdAt: Date
}
```

**Exemple :**
```json
{
  "_id": "6565f4d5e6f7a8b9c3d4e5f6",
  "userId": "6565f1a2b3c4d5e6f7a8b9c0",
  "refreshToken": "$2b$10$hashedToken...",
  "expiresAt": "2025-11-28T10:00:00.000Z",
  "createdAt": "2025-11-21T10:00:00.000Z"
}
```

**Indexes :**
- `userId` (index)
- `expiresAt` (TTL index - suppression auto)

---

## Flow de données complet

### Flow 1 : Admin crée une animation

```
1. Admin remplit wizard (8 étapes)
   ↓
2. Frontend (useWizardStore) accumule données
   ↓
3. Step 8 : Soumission
   ↓
4. POST /api/animations
   {
     name: "...",
     slug: "...",
     inputCollection: {...},
     pipeline: [...],
     emailConfig: {...},
     ...
   }
   ↓
5. Backend AnimationService.createAnimation()
   - Génère slug si absent
   - Valide unicité slug
   - Crée document dans `animations`
   - Génère QR code → Upload Azure Blob
   - Update animation.qrCodeUrl
   ↓
6. Response : Animation créée
   ↓
7. Frontend redirige vers /dashboard
```

**Collections modifiées :**
- `animations` (INSERT 1 document)

---

### Flow 2 : Participant complète l'animation

```
1. Participant scanne QR code
   → Redirigé vers https://app.com/a/avatar-tech-2025
   ↓
2. Frontend GET /api/animations/by-slug/avatar-tech-2025
   → Récupère config animation
   ↓
3. Frontend affiche formulaire dynamique
   - Questions depuis animation.inputCollection.questions
   - Selfie si animation.inputCollection.requireSelfie
   ↓
4. Participant remplit + soumet
   ↓
5. POST /api/generations
   {
     animationId: "6565f2b3c4d5e6f7a8b9c1d2",
     participantData: {
       email: "participant@example.com",
       answers: { q1: "Marie", q2: "Futuriste" },
       selfieFile: File
     }
   }
   ↓
6. Backend GenerationController.create()
   ↓
7. Upload selfie vers Azure Blob
   → URL stockée
   ↓
8. Crée document `generations` avec status='pending'
   {
     animationId: "...",
     participantData: {...},
     generationResult: { status: 'pending' }
   }
   ↓
9. Lance job async AIGenerationService.generate()
   ↓
10. Response immédiate au frontend :
    {
      success: true,
      data: {
        generationId: "6565f3c4d5e6f7a8b9c2d3e4",
        status: 'pending'
      }
    }
    ↓
11. Frontend poll GET /api/generations/:id/status
    Toutes les 2-3 secondes
```

**Collections modifiées :**
- `generations` (INSERT 1 document avec status='pending')

---

### Flow 3 : Génération IA (job async backend)

```
Job async lancé par GenerationController

1. Récupère generation document
   ↓
2. Récupère animation config (pipeline)
   ↓
3. Pour chaque bloc du pipeline :

   [Bloc preprocessing]
   - Charge selfie depuis Azure Blob
   - Applique transformations (crop, resize)
   - Sauvegarde image transformée

   [Bloc ai-generation]
   - Construit prompt dynamique :
     Template: "Create a {q2} style portrait of {q1}"
     → "Create a Futuriste style portrait of Marie"

   - Appel OpenAI/Gemini API
     retry 3x avec backoff si échec

   - Upload image générée → Azure Blob
   - URL stockée

   [Bloc postprocessing] (si présent)
   - Applique filtres/effets
   ↓
4. Update generation document :
   {
     generationResult: {
       status: 'completed',
       imageUrl: "https://...",
       modelUsed: "dalle-3",
       promptUsed: "...",
       metadata: { generationTime: 18500, retryCount: 0 }
     }
   }
   ↓
5. Si animation.emailConfig.enabled :
   - Construit email depuis template
   - Envoie via Mailjet
   - Update generation.emailSent = true
   ↓
6. Job terminé
```

**Collections modifiées :**
- `generations` (UPDATE status 'pending' → 'processing' → 'completed')

---

### Flow 4 : Participant voit son résultat

```
Frontend poll GET /api/generations/:id/status

1. Backend récupère generation document
   ↓
2. Si status='pending' ou 'processing' :
   {
     success: true,
     data: { status: 'processing' }
   }
   Frontend continue polling
   ↓
3. Si status='completed' :
   {
     success: true,
     data: {
       status: 'completed',
       imageUrl: "https://...",
       participantName: "Marie"
     }
   }
   ↓
4. Frontend affiche image générée
   - Bouton télécharger
   - Message remerciement
```

**Collections lues :**
- `generations` (SELECT par _id)

---

### Flow 5 : Écran public affiche résultats

```
1. Écran public : /display/6565f2b3c4d5e6f7a8b9c1d2
   ↓
2. Frontend poll GET /api/results/6565f2b3c4d5e6f7a8b9c1d2
   Toutes les 10s
   ↓
3. Backend récupère tous les generations visibles :

   Query MongoDB :
   db.generations.find({
     animationId: "6565f2b3c4d5e6f7a8b9c1d2",
     visibleOnPublicDisplay: true,
     "generationResult.status": "completed"
   }).sort({ createdAt: -1 }).limit(50)
   ↓
4. Response :
   {
     success: true,
     data: [
       {
         imageUrl: "https://...",
         participantName: "Marie",
         createdAt: "..."
       },
       { ... }
     ]
   }
   ↓
5. Frontend affiche en masonry/grid
   - Nouvelles images apparaissent en haut
   - Animation "reveal" pour nouveaux résultats
```

**Collections lues :**
- `generations` (SELECT par animationId + filters)

---

### Flow 6 : Admin gère résultats

```
1. Admin : /dashboard/results/6565f2b3c4d5e6f7a8b9c1d2
   ↓
2. Frontend GET /api/results/6565f2b3c4d5e6f7a8b9c1d2
   (même endpoint que écran public mais avec auth)
   ↓
3. Backend retourne TOUS les generations (même cachés)
   ↓
4. Admin peut :

   [Masquer une image]
   PUT /api/results/:id/visibility
   { visible: false }
   → Update generation.visibleOnPublicDisplay = false

   [Télécharger bulk en ZIP]
   POST /api/results/:animationId/download-all
   → Backend récupère toutes les imageUrl
   → Télécharge depuis Azure Blob
   → Crée ZIP en mémoire
   → Stream ZIP au frontend

   [Supprimer un résultat]
   DELETE /api/results/:id
   → Soft delete ou hard delete selon config
```

**Collections modifiées :**
- `generations` (UPDATE visibleOnPublicDisplay)
- `generations` (DELETE si suppression)

---

## Relations entre collections

```
┌─────────────┐
│   users     │
│  _id: "u1"  │
└──────┬──────┘
       │
       │ 1:N
       │
       ↓
┌─────────────────────┐
│    animations       │
│  _id: "a1"          │
│  userId: "u1" ────┐ │
│  slug: "avatar"    │ │
└────────────────────┴─┘
       │
       │ 1:N
       │
       ↓
┌──────────────────────────┐
│     generations          │
│  _id: "g1"               │
│  animationId: "a1" ────┐ │
│  participantData: {...} │ │
│  generationResult: {...}│ │
└─────────────────────────┴─┘

┌─────────────┐
│  sessions   │
│  _id: "s1"  │
│  userId: "u1"
└─────────────┘
```

**Cardinalités :**
- 1 User → N Animations (un admin crée plusieurs animations)
- 1 Animation → N Generations (une animation génère N résultats)
- 1 User → N Sessions (un user peut avoir plusieurs sessions actives)

**Pas de relations bi-directionnelles** - Toutes les queries vont dans un sens :
- Récupérer animations d'un user : `db.animations.find({ userId })`
- Récupérer generations d'une animation : `db.generations.find({ animationId })`

---

## Volumétrie estimée

**Hypothèses :**
- 10 événements/mois
- 100 participants/événement
- 1000 générations/mois

**Taille documents :**
- `users` : ~500 bytes → Négligeable
- `animations` : ~5 KB/document → 50 KB/mois
- `generations` : ~2 KB/document (sans images) → 2 MB/mois
- **Images Azure Blob** : ~500 KB/image → 500 MB/mois

**Cosmos DB :** < 10 MB/mois (très léger)
**Azure Blob Storage :** ~500 MB/mois (principal stockage)

---

## Requêtes critiques à optimiser

**Query 1 : Liste animations admin**
```javascript
db.animations.find({ userId: "..." }).sort({ createdAt: -1 })
```
Index : `{ userId: 1, createdAt: -1 }`

**Query 2 : Résultats écran public**
```javascript
db.generations.find({
  animationId: "...",
  visibleOnPublicDisplay: true,
  "generationResult.status": "completed"
}).sort({ createdAt: -1 }).limit(50)
```
Index : `{ animationId: 1, visibleOnPublicDisplay: 1, createdAt: -1 }`

**Query 3 : Animation par slug (participant)**
```javascript
db.animations.findOne({ slug: "avatar-tech-2025" })
```
Index : `{ slug: 1 }` (unique)

**Query 4 : Status génération (polling)**
```javascript
db.generations.findOne({ _id: "..." })
```
Index : `_id` (natif)

---

