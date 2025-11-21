# Epic Technical Specification: Foundation & Infrastructure

Date: 2025-11-21
Author: Fab
Epic ID: 1
Status: Draft

---

## Overview

Cet epic établit les **fondations techniques essentielles** d'AppsByMCI V2, la plateforme d'animation événementielle corporate qui démystifie l'IA par l'expérience. Il crée l'infrastructure de base nécessaire pour tous les epics suivants : monorepo Next.js 16 + Fastify, connexions Azure (Cosmos DB, Blob Storage), configuration des modèles IA (OpenAI, Gemini), package shared pour réutilisation code, et logging structuré avec observabilité Azure.

Ce travail de fondation permet de réaliser l'objectif principal du PRD : **transformer 2-3 jours de développement en 30 minutes de configuration** grâce à une architecture scalable et extensible. Sans ces fondations, aucune fonctionnalité utilisateur (wizard admin, expérience participant, génération IA) ne peut être implémentée.

## Objectives and Scope

### In-Scope (MVP - Sprint 1)

**Infrastructure monorepo :**
- ✅ Structure monorepo NPM (apps/frontend, apps/backend, packages/shared)
- ✅ Next.js 16 App Router avec TypeScript strict
- ✅ Fastify backend avec TypeScript strict
- ✅ Configuration ESLint + Prettier globale
- ✅ Scripts de développement local (`npm run dev:frontend`, `npm run dev:backend`)

**Base de données et storage :**
- ✅ Connexion Cosmos DB (API MongoDB) avec Mongoose
- ✅ Collections créées : users, animations, generations, sessions
- ✅ Index critiques appliqués (email unique, slug unique, compound indexes)
- ✅ Connexion Azure Blob Storage avec containers (generated-images, uploads, qrcodes)
- ✅ Génération URLs signées (SAS tokens) pour accès sécurisé images

**Modèles IA hardcodés :**
- ✅ Configuration OpenAI (DALL-E 3, GPT Image Edit)
- ✅ Configuration Google Gemini (Imagen 3.0)
- ✅ API `GET /api/ai-models` exposant les modèles disponibles
- ✅ Types TypeScript pour modèles et capacités (requiresImage, supportsEdit)

**Package shared :**
- ✅ Types TypeScript partagés (modèles DB, API contracts)
- ✅ Schémas Zod pour validation (animations, users, generations)
- ✅ Constantes et utilitaires réutilisables
- ✅ Publication vers Azure Artifacts (npm registry interne)

**Logging et observabilité :**
- ✅ Pino pour logs structurés JSON
- ✅ Niveaux : ERROR, WARN, INFO, DEBUG
- ✅ Intégration Azure Application Insights
- ✅ Logs de requêtes HTTP (middleware Fastify)

### Out-of-Scope

**❌ Fonctionnalités utilisateur** : Authentification, wizard admin, expérience participant (Epics 2-6)
**❌ Génération IA dynamique** : Gestion CMS des modèles IA (Sprint 2+, actuellement hardcodés)
**❌ Traitement graphique avancé** : Compositing, templates PNG, background removal (Epic 3.6B Post-MVP)
**❌ Permissions granulaires** : Gestion rôles par animation (Sprint 2+, structure DB préparée uniquement)
**❌ Déploiement production** : CI/CD Azure (sera configuré après validation locale)

## System Architecture Alignment

### Composants architecturaux créés

**Frontend (Next.js 16)** :
- App Router avec Server Components et Client Components (architecture.md lignes 317-409)
- ShadCN UI + Radix UI + Tailwind CSS (UX design section 1.1)
- Zustand pour state management côté client

**Backend (Fastify)** :
- API REST avec routes modulaires (architecture.md lignes 410-537)
- Services métier séparés (architecture.md lignes 538-623)
- Middleware : logging, auth (JWT future), CORS, rate limiting

**Base de données Cosmos DB** :
- Collections MongoDB définies (architecture.md lignes 1816-2515)
- Index optimisés pour requêtes fréquentes
- TTL index sur sessions pour auto-suppression

**Azure Blob Storage** :
- Containers pour images générées, uploads, QR codes
- URLs signées pour sécurité (NFR6)
- Geo-redundancy pour backup (NFR10)

### Contraintes architecturales respectées

✅ **Monorepo sans workspaces** : Structure NPM compatible déploiement Azure (architecture ligne 335)
✅ **TypeScript strict** : Type safety sur toute la codebase (NFR17)
✅ **Secrets en env vars** : API keys OpenAI/Gemini via process.env (NFR7)
✅ **Logging structuré** : JSON logs pour Azure App Insights (NFR23-24)
✅ **Extensibilité modèles IA** : Architecture permet ajout futurs modèles sans refonte (architecture lignes 1695-1749)

## Detailed Design

### Services and Modules

Cette section détaille les services et modules créés dans Epic 1, organisés par couche architecturale.

#### Backend Services (apps/backend/src/services/)

| Service | Responsabilité | Inputs | Outputs | Owner |
|---------|---------------|--------|---------|-------|
| **database.service.ts** | Gestion connexion Cosmos DB via Mongoose | Connection string (env) | Connection MongoDB | Backend |
| **blob-storage.service.ts** | Gestion Azure Blob Storage (upload, download, URLs signées) | Blob name, container, file buffer | URL signée, confirmation upload | Backend |
| **ai-models.service.ts** | Configuration et exposition des modèles IA hardcodés | Aucun (config interne) | Liste modèles disponibles | Backend |
| **logging.service.ts** | Configuration Pino + Azure App Insights | Log level, metadata | Logs structurés JSON | Backend |

**Détails clés** :
- `database.service.ts` : Implémente singleton pattern, retry logic (3 tentatives), logs connexion réussie/échouée
- `blob-storage.service.ts` : Génère SAS tokens valides 1h, gère 3 containers (generated-images, uploads, qrcodes)
- `ai-models.service.ts` : Retourne array de modèles avec `{ id, name, provider, capabilities: { requiresImage, supportsEdit, maxSize } }`
- `logging.service.ts` : Configure Pino transport vers Azure, enrichit logs avec `requestId`, `timestamp`, `level`

#### Backend Models (apps/backend/src/models/)

| Modèle Mongoose | Collection | Schéma principal | Index appliqués |
|----------------|-----------|------------------|-----------------|
| **User.model.ts** | users | email, password (hashed), role | email (unique) |
| **Animation.model.ts** | animations | name, slug, userId, status, pipeline, etc. | slug (unique), userId + status (compound) |
| **Generation.model.ts** | generations | animationId, participantData, imageUrl, status | animationId (index) |
| **Session.model.ts** | sessions | userId, refreshToken, expiresAt | userId (index), expiresAt (TTL) |

**Notes** :
- Schémas complets définis dans architecture.md lignes 1816-2515
- Validation Mongoose activée (required fields, enum values)
- Tous les modèles incluent `createdAt`, `updatedAt` (timestamps: true)

#### Frontend Modules (apps/frontend/)

| Module | Responsabilité | Technologies | Notes |
|--------|---------------|--------------|-------|
| **app/** | Routing App Router Next.js 16 | Next.js App Router | Server Components par défaut |
| **components/ui/** | Composants ShadCN UI | ShadCN + Radix UI + Tailwind | Base design system |
| **lib/api-client.ts** | Client API fetch typé | TypeScript | Appelle backend Fastify |
| **lib/constants.ts** | Constantes frontend | TypeScript | Import depuis @shared/constants |

**Setup initial** :
- Next.js 16 configuré avec App Router (pas Pages Router)
- Tailwind CSS configuré avec palette "Minimal Monochrome" (UX design)
- ShadCN installé avec composants de base (Button, Input, Card, etc.)

#### Package Shared (packages/shared/)

| Fichier | Contenu | Utilisateurs |
|---------|---------|--------------|
| **src/types/index.ts** | Types TypeScript (User, Animation, Generation, Session) | Frontend + Backend |
| **src/schemas/index.ts** | Schémas Zod validation (AnimationSchema, UserSchema) | Backend principalement |
| **src/constants.ts** | Constantes réutilisables (STATUS_VALUES, AI_PROVIDERS) | Frontend + Backend |
| **src/utils.ts** | Utilitaires (slugify, formatDate) | Frontend + Backend |

**Publication** : Package publié vers Azure Artifacts registry NPM interne

### Data Models and Contracts

#### Schéma Cosmos DB - Collection `users`

```typescript
interface User {
  _id: ObjectId
  email: string              // Unique, validation email format
  password: string           // Bcrypt hashed (min 10 rounds)
  role: 'admin' | 'editor' | 'viewer'
  animationPermissions: [{   // Sprint 2+, préparé mais non utilisé MVP
    animationId: ObjectId
    role: 'owner' | 'editor' | 'viewer'
  }]
  createdAt: Date
  updatedAt: Date
}
```

**Index** : `email` (unique)

#### Schéma Cosmos DB - Collection `animations`

```typescript
interface Animation {
  _id: ObjectId
  userId: ObjectId           // Référence User (créateur)
  name: string
  slug: string               // Unique, URL-friendly
  description: string
  status: 'draft' | 'published' | 'archived'

  // Configuration accès
  accessConfig: {
    type: 'none' | 'code' | 'email-domain'
    code?: string            // Si type = 'code'
    allowedDomains?: string[] // Si type = 'email-domain'
  }

  // Champs de base personnalisables
  baseFields: {
    name: { enabled: boolean, label: string, placeholder: string }
    firstName: { enabled: boolean, label: string, placeholder: string }
    email: { enabled: boolean, label: string, placeholder: string }
  }

  // Collecte inputs avancés
  inputCollection: {
    selfieRequired: boolean
    elements: [{              // Questions custom
      id: string
      type: 'choice' | 'slider' | 'free-text'
      question: string
      options?: string[]      // Pour type = 'choice'
      min?: number           // Pour type = 'slider'
      max?: number
      labels?: { min: string, max: string }
    }]
  }

  // Pipeline de traitement (Epic 1 prépare structure, Epic 3 implémente)
  pipeline: [{
    id: string
    type: 'preprocessing' | 'ai-generation' | 'postprocessing'
    order: number
    name: string
    config: any               // Type spécifique par bloc
  }]

  // Configuration email
  emailConfig: {
    enabled: boolean
    subject: string
    template: string          // HTML avec variables {{name}}, {{imageUrl}}
    sender: { name: string, email: string }
  }

  // Écran public
  displayConfig: {
    enabled: boolean
    layout: 'masonry'
    columns: number
    showNames: boolean
    refreshInterval: number   // Secondes
  }

  // Personnalisation UI
  customization: {
    primaryColor: string
    secondaryColor: string
    logo?: string             // URL Azure Blob
    background?: string       // URL ou couleur
    theme: 'light' | 'dark' | 'auto'
    messages: {
      welcome?: string
      submit?: string
      thankYou?: string
    }
  }

  qrCodeUrl?: string          // URL Azure Blob (généré à publication)
  createdAt: Date
  updatedAt: Date
}
```

**Index** :
- `slug` (unique)
- `userId` + `status` (compound, pour filtrage dashboard)

#### Schéma Cosmos DB - Collection `generations`

```typescript
interface Generation {
  _id: ObjectId
  animationId: ObjectId
  participantData: {
    answers: Record<string, any>  // Réponses questions
    email?: string
    name?: string
    firstName?: string
  }
  selfieUrl?: string          // URL Azure Blob (upload participant)
  generatedImageUrl: string   // URL Azure Blob (résultat IA)
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string              // Si status = 'failed'
  processingTime?: number     // Millisecondes
  createdAt: Date
  updatedAt: Date
}
```

**Index** : `animationId` (requêtes fréquentes par animation)

#### Schéma Cosmos DB - Collection `sessions`

```typescript
interface Session {
  _id: ObjectId
  userId: ObjectId
  refreshToken: string        // UUID v4
  expiresAt: Date            // TTL index (auto-suppression)
  createdAt: Date
}
```

**Index** :
- `userId` (standard)
- `expiresAt` (TTL index, auto-supprime documents expirés)

#### Types TypeScript Shared (packages/shared/src/types/)

```typescript
// Export vers frontend + backend
export type { User, Animation, Generation, Session }

// Enums
export enum AnimationStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum GenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Modèles IA
export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'google'
  capabilities: {
    requiresImage: boolean
    supportsEdit: boolean
    maxSize?: number         // Pixels
  }
}
```

### APIs and Interfaces

#### API REST Backend (Fastify)

**Endpoint créé dans Epic 1** :

```http
GET /api/ai-models
Description: Retourne la liste des modèles IA disponibles (hardcodés)
Auth: Aucune (public, utilisé par wizard admin)
Response: 200 OK
Body: {
  models: [
    {
      id: "dall-e-3",
      name: "DALL-E 3",
      provider: "openai",
      capabilities: {
        requiresImage: false,
        supportsEdit: false,
        maxSize: 1024
      }
    },
    {
      id: "gpt-image-1",
      name: "GPT Image Edit",
      provider: "openai",
      capabilities: {
        requiresImage: true,
        supportsEdit: true,
        maxSize: 1024
      }
    },
    {
      id: "imagen-3.0-capability-001",
      name: "Gemini Imagen 3.0",
      provider: "google",
      capabilities: {
        requiresImage: false,
        supportsEdit: false,
        maxSize: 1024
      }
    }
  ]
}
```

**Configuration hardcodée** (apps/backend/src/config/ai-models.config.ts) :

```typescript
export const AI_MODELS: AIModel[] = [
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    capabilities: {
      requiresImage: false,
      supportsEdit: false,
      maxSize: 1024
    }
  },
  {
    id: 'gpt-image-1',
    name: 'GPT Image Edit',
    provider: 'openai',
    capabilities: {
      requiresImage: true,
      supportsEdit: true,
      maxSize: 1024
    }
  },
  {
    id: 'imagen-3.0-capability-001',
    name: 'Gemini Imagen 3.0',
    provider: 'google',
    capabilities: {
      requiresImage: false,
      supportsEdit: false,
      maxSize: 1024
    }
  }
]
```

**Rationale** : Configuration hardcodée pour MVP (FR80-82), extensible vers CMS dynamique Sprint 2+ si besoin

#### Interfaces Services Backend

**BlobStorageService** :

```typescript
interface IBlobStorageService {
  uploadFile(containerName: string, blobName: string, buffer: Buffer): Promise<string>
  downloadFile(containerName: string, blobName: string): Promise<Buffer>
  generateSasUrl(containerName: string, blobName: string, expiryMinutes?: number): Promise<string>
  deleteFile(containerName: string, blobName: string): Promise<void>
}
```

**DatabaseService** :

```typescript
interface IDatabaseService {
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
}
```

**AIModelsService** :

```typescript
interface IAIModelsService {
  getAllModels(): AIModel[]
  getModelById(id: string): AIModel | undefined
  getModelsByProvider(provider: 'openai' | 'google'): AIModel[]
}
```

### Workflows and Sequencing

#### Workflow 1 : Setup Initial Développeur

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Clone Repository                                          │
│    git clone <repo-url>                                       │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Install Dependencies                                      │
│    npm install (root)                                         │
│    npm install --prefix apps/frontend                         │
│    npm install --prefix apps/backend                          │
│    npm install --prefix packages/shared                       │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Configure Environment Variables                           │
│    cp .env.example .env                                       │
│    Edit .env:                                                 │
│    - MONGODB_CONNECTION_STRING                                │
│    - AZURE_STORAGE_CONNECTION_STRING                          │
│    - OPENAI_API_KEY                                           │
│    - GOOGLE_AI_API_KEY                                        │
│    - AZURE_APPINSIGHTS_CONNECTION_STRING                      │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Build Shared Package                                      │
│    cd packages/shared                                         │
│    npm run build                                              │
│    npm link (ou publish vers Azure Artifacts)                 │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Start Development Servers                                 │
│    Terminal 1: npm run dev:backend                            │
│    Terminal 2: npm run dev:frontend                           │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Verify Setup                                              │
│    - Backend: http://localhost:3001/health → 200 OK          │
│    - Frontend: http://localhost:3000 → Page loads            │
│    - Logs: Vérifier connexion DB + Azure Blob réussies       │
└──────────────────────────────────────────────────────────────┘
```

**Temps estimé** : 15-20 minutes (après provisioning Azure)

#### Workflow 2 : Démarrage Backend (Runtime)

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Load Environment Variables                                │
│    process.env.MONGODB_CONNECTION_STRING                      │
│    process.env.AZURE_STORAGE_CONNECTION_STRING                │
│    etc.                                                       │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Initialize Logging (Pino)                                 │
│    - Configure log level (DEBUG en dev, INFO en prod)         │
│    - Setup Azure App Insights transport                       │
│    - Log: "Application starting..."                           │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Connect to Cosmos DB (Mongoose)                           │
│    - Attempt connection (retry 3x avec backoff)               │
│    - Apply indexes                                            │
│    - Log: "Database connected successfully"                   │
│    - On error: Log + exit process(1)                          │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Initialize Azure Blob Storage Client                      │
│    - Create BlobServiceClient                                 │
│    - Test connection (list containers)                        │
│    - Ensure containers exist (create if missing):             │
│      * generated-images                                       │
│      * uploads                                                │
│      * qrcodes                                                │
│    - Log: "Blob Storage initialized"                          │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Register Fastify Plugins & Middleware                     │
│    - CORS plugin                                              │
│    - Rate limiting plugin                                     │
│    - Request logging middleware                               │
│    - Error handler global                                     │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Register Routes                                            │
│    - /health (healthcheck)                                    │
│    - /api/ai-models (GET)                                     │
│    - (Autres routes ajoutées dans Epics 2-6)                 │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Start Server                                               │
│    - Listen on port 3001 (configurable via env)               │
│    - Log: "Server listening on http://localhost:3001"         │
└──────────────────────────────────────────────────────────────┘
```

**Temps estimé** : 2-3 secondes (connexions DB + Azure)

#### Séquence d'appel : Frontend récupère modèles IA

```
Frontend (Wizard Step 5)          Backend (Fastify)          AIModelsService
         |                                |                          |
         |  GET /api/ai-models            |                          |
         |------------------------------->|                          |
         |                                |  getAllModels()          |
         |                                |------------------------->|
         |                                |                          |
         |                                |    [AI_MODELS array]     |
         |                                |<-------------------------|
         |                                |                          |
         |    200 OK                      |                          |
         |    { models: [...] }           |                          |
         |<-------------------------------|                          |
         |                                |                          |
    Store in Zustand                      |                          |
    wizardStore.availableModels           |                          |
         |                                |                          |
    Render dropdown                       |                          |
    "Sélectionner modèle IA"              |                          |
```

**Acteurs** : Frontend wizard, Backend API, AIModelsService
**Données échangées** : Array de AIModel avec id, name, provider, capabilities
**Timing** : < 100ms (hardcodé, pas de DB query)

## Non-Functional Requirements

### Performance

**NFR1 : Temps de connexion base de données**
- **Cible** : Connexion Cosmos DB établie en < 3 secondes au démarrage backend
- **Mesure** : Log timestamp entre "Connecting to database..." et "Database connected successfully"
- **Implémentation** : Retry logic avec backoff exponentiel (3 tentatives : 1s, 2s, 4s)
- **Rationale** : Startup rapide critique pour développement local et déploiements Azure

**NFR2 : Temps de réponse API `/api/ai-models`**
- **Cible** : Réponse < 100ms (99e percentile)
- **Mesure** : Logs Pino avec `responseTime` middleware Fastify
- **Implémentation** : Configuration hardcodée en mémoire (pas de DB query)
- **Rationale** : Endpoint appelé par wizard admin, doit être instantané

**NFR3 : Génération URLs signées Azure Blob**
- **Cible** : Génération SAS token < 500ms
- **Mesure** : Timer dans `blob-storage.service.ts` méthode `generateSasUrl()`
- **Implémentation** : SDK Azure `@azure/storage-blob` natif
- **Rationale** : URLs signées utilisées fréquemment pour accès sécurisé images

**NFR4 : Taille package shared**
- **Cible** : Bundle size < 500KB après build TypeScript
- **Mesure** : `npm run build` output size
- **Implémentation** : Types uniquement (pas de runtime dependencies lourdes)
- **Rationale** : Import rapide dans frontend/backend

### Security

**NFR5 : Secrets management (CRITIQUE)**
- **Exigence** : Aucun secret hardcodé dans le code source
- **Implémentation** :
  - API keys (OpenAI, Gemini) via `process.env.OPENAI_API_KEY`, `process.env.GOOGLE_AI_API_KEY`
  - Connection strings (Cosmos DB, Azure Blob) via env vars
  - `.env.example` dans repo avec placeholders, `.env` dans `.gitignore`
- **Validation** : Audit automatique via ESLint rule `no-hardcoded-credentials`
- **Production** : Azure Key Vault pour gestion secrets (configuration post-Epic 1)
- **Lien PRD** : NFR7 "Secrets et configuration"

**NFR6 : URLs signées Azure Blob (sécurité accès)**
- **Exigence** : Images accessibles uniquement via URLs signées temporaires (SAS tokens)
- **Implémentation** :
  - Expiration : 1 heure par défaut (configurable)
  - Permissions : Read-only pour images générées/uploads
  - Génération à la demande (pas de URLs permanentes publiques)
- **Rationale** : Protection données participants (selfies) et ressources Azure
- **Lien PRD** : NFR6 "Accès aux ressources"

**NFR7 : Validation input API**
- **Exigence** : Validation côté serveur de tous les inputs API
- **Implémentation Epic 1** :
  - Endpoint `/api/ai-models` : Pas d'input utilisateur (GET simple)
  - Future validation (Epics 2-6) : Schémas Zod dans package shared
- **Rationale** : Protection contre injection, prévention attaques
- **Lien PRD** : NFR5 "Validation des données"

**NFR8 : HTTPS uniquement (production)**
- **Exigence** : Toutes les communications chiffrées en production
- **Implémentation** :
  - Développement local : HTTP acceptable (`http://localhost:3001`)
  - Production Azure : HTTPS forcé (Azure Web App config)
  - Certificates : Gérés automatiquement par Azure
- **Lien PRD** : NFR4 "Authentification" (sessions sécurisées)

### Reliability/Availability

**NFR9 : Retry logic connexion DB**
- **Exigence** : Tentatives multiples avant échec fatal
- **Implémentation** :
  - 3 tentatives avec backoff exponentiel (1s, 2s, 4s)
  - Log chaque tentative avec niveau WARN
  - Si 3 échecs : Log ERROR + `process.exit(1)` (fail-fast)
- **Rationale** : Réseau temporairement indisponible fréquent sur Azure
- **Lien PRD** : NFR9 "Gestion des erreurs"

**NFR10 : Graceful shutdown**
- **Exigence** : Arrêt propre du serveur sans perte de requêtes en cours
- **Implémentation** :
  - Écoute signaux `SIGTERM`, `SIGINT`
  - Fermeture connexions DB (Mongoose `disconnect()`)
  - Attente fin requêtes HTTP en cours (Fastify `close()`)
  - Timeout 10 secondes puis force shutdown
- **Rationale** : Déploiements Azure sans interruption service
- **Lien PRD** : NFR8 "Disponibilité système"

**NFR11 : Health check endpoint**
- **Exigence** : Endpoint `/health` retournant état système
- **Implémentation** :
  ```typescript
  GET /health
  Response:
  {
    status: "healthy" | "degraded" | "unhealthy",
    checks: {
      database: { status: "up", responseTime: 45 },
      blobStorage: { status: "up", responseTime: 120 },
      appInsights: { status: "up" }
    },
    timestamp: "2025-11-21T10:30:00Z"
  }
  ```
- **Rationale** : Monitoring Azure App Service, détection problèmes
- **Lien PRD** : NFR8 "Disponibilité système"

**NFR12 : Error handling global**
- **Exigence** : Gestion centralisée des erreurs non capturées
- **Implémentation** :
  - Fastify error handler global (middleware)
  - Catch `uncaughtException` et `unhandledRejection` Node.js
  - Log ERROR avec stack trace + context
  - Retour 500 au client (pas de stack trace exposée)
- **Rationale** : Pas de crash serveur pour erreurs inattendues
- **Lien PRD** : NFR9 "Gestion des erreurs"

### Observability

**NFR13 : Logs structurés JSON (Pino)**
- **Exigence** : Tous les logs en format JSON pour parsing facile
- **Implémentation** :
  ```json
  {
    "level": 30,
    "time": 1700568600000,
    "msg": "Database connected successfully",
    "requestId": "req-abc123",
    "hostname": "backend-pod-1",
    "environment": "development"
  }
  ```
- **Niveaux** : ERROR (50), WARN (40), INFO (30), DEBUG (20)
- **Transport** : Console (dev) + Azure App Insights (prod)
- **Lien PRD** : NFR23 "Logs et traces"

**NFR14 : Request logging middleware**
- **Exigence** : Log automatique de chaque requête HTTP
- **Implémentation** :
  - Middleware Fastify `pino-http`
  - Log entrée : `method`, `url`, `requestId`, `timestamp`
  - Log sortie : `statusCode`, `responseTime`, `requestId`
  - Exemple :
    ```json
    {
      "level": 30,
      "msg": "Request completed",
      "requestId": "req-xyz789",
      "method": "GET",
      "url": "/api/ai-models",
      "statusCode": 200,
      "responseTime": 45
    }
    ```
- **Rationale** : Audit trail, debugging, performance monitoring
- **Lien PRD** : NFR23 "Logs et traces"

**NFR15 : Azure Application Insights intégration**
- **Exigence** : Envoi automatique logs vers Azure App Insights
- **Implémentation** :
  - SDK `@microsoft/applicationinsights` configuré au startup
  - Connection string via `process.env.AZURE_APPINSIGHTS_CONNECTION_STRING`
  - Enrichissement logs : `cloudRoleName: "backend"`, `cloudRoleInstance: "<pod-id>"`
  - Métriques custom : Temps connexion DB, temps génération SAS token
- **Dashboards Azure** :
  - Requêtes/seconde
  - Temps de réponse moyen
  - Taux d'erreur (4xx, 5xx)
  - Disponibilité système
- **Lien PRD** : NFR23-25 "Monitoring et observabilité"

**NFR16 : Logs de démarrage obligatoires**
- **Exigence** : Logs critiques au démarrage pour diagnostic rapide
- **Séquence** :
  ```
  [INFO] Application starting...
  [INFO] Environment: development
  [INFO] Node version: v20.x.x
  [INFO] Connecting to database...
  [INFO] Database connected successfully (responseTime: 1234ms)
  [INFO] Blob Storage initialized (3 containers verified)
  [INFO] Registering routes... (2 routes registered)
  [INFO] Server listening on http://localhost:3001
  ```
- **Rationale** : Validation startup correct, troubleshooting déploiements
- **Lien PRD** : NFR23 "Logs et traces"

**NFR17 : Métriques custom**
- **Exigence** : Métriques métier envoyées à Azure App Insights
- **Métriques Epic 1** :
  - `database.connectionTime` (ms)
  - `blobStorage.sasTokenGeneration` (ms)
  - `api.aiModels.requests` (count)
- **Future métriques** (Epics 2-6) :
  - Temps génération IA par modèle
  - Taux succès/échec génération
  - Coûts APIs IA
- **Lien PRD** : NFR24 "Métriques"

## Dependencies and Integrations

### NPM Dependencies - Backend (apps/backend/package.json)

| Package | Version | Purpose | Type |
|---------|---------|---------|------|
| **fastify** | ^4.26.0 | Framework backend HTTP | production |
| **@fastify/cors** | ^9.0.0 | Middleware CORS | production |
| **@fastify/rate-limit** | ^9.1.0 | Rate limiting protection | production |
| **mongoose** | ^8.1.0 | ODM Cosmos DB (MongoDB API) | production |
| **@azure/storage-blob** | ^12.17.0 | SDK Azure Blob Storage | production |
| **@microsoft/applicationinsights** | ^2.9.0 | Logs Azure App Insights | production |
| **pino** | ^8.19.0 | Logger structuré JSON | production |
| **pino-http** | ^9.0.0 | Middleware logging Fastify | production |
| **dotenv** | ^16.4.0 | Chargement variables env (.env) | production |
| **zod** | ^3.22.0 | Validation schemas (import depuis shared) | production |
| **typescript** | ^5.3.0 | Compilateur TypeScript | dev |
| **@types/node** | ^20.11.0 | Types Node.js | dev |
| **tsx** | ^4.7.0 | Exécution TypeScript en dev | dev |
| **eslint** | ^8.56.0 | Linter code | dev |
| **prettier** | ^3.2.0 | Formatter code | dev |

**Note** : Pas de dépendances OpenAI/Google SDK dans Epic 1 (ajoutées Epic 4)

### NPM Dependencies - Frontend (apps/frontend/package.json)

| Package | Version | Purpose | Type |
|---------|---------|---------|------|
| **next** | ^15.1.0 | Framework React (App Router) | production |
| **react** | ^19.0.0 | Bibliothèque UI | production |
| **react-dom** | ^19.0.0 | React DOM rendering | production |
| **tailwindcss** | ^3.4.0 | Utility CSS framework | production |
| **@radix-ui/react-*** | ^1.0.0 | Composants UI accessibles (base ShadCN) | production |
| **class-variance-authority** | ^0.7.0 | Variants CSS (ShadCN) | production |
| **clsx** | ^2.1.0 | Utilitaire classes CSS conditionnelles | production |
| **zustand** | ^4.5.0 | State management client | production |
| **zod** | ^3.22.0 | Validation schemas frontend | production |
| **typescript** | ^5.3.0 | Compilateur TypeScript | dev |
| **@types/react** | ^19.0.0 | Types React | dev |
| **@types/react-dom** | ^19.0.0 | Types React DOM | dev |
| **eslint** | ^8.56.0 | Linter code | dev |
| **eslint-config-next** | ^15.1.0 | Config ESLint pour Next.js | dev |
| **prettier** | ^3.2.0 | Formatter code | dev |
| **autoprefixer** | ^10.4.0 | PostCSS autoprefixer (Tailwind) | dev |

**Composants ShadCN installés** (Epic 1 base uniquement) :
- `button`, `input`, `card`, `label`
- Installation via CLI : `npx shadcn-ui@latest add <component>`

### NPM Dependencies - Shared Package (packages/shared/package.json)

| Package | Version | Purpose | Type |
|---------|---------|---------|------|
| **zod** | ^3.22.0 | Schémas validation | production |
| **typescript** | ^5.3.0 | Compilateur TypeScript | dev |

**Note** : Package minimal, uniquement types et validation (pas de runtime lourd)

### Intégrations Externes Azure

#### 1. Azure Cosmos DB (MongoDB API)

**Service** : Cosmos DB for MongoDB
**Configuration requise** :
- Compte Cosmos DB provisionné
- Database : `appsbymci` (ou configurable via env)
- Consistency level : Session (par défaut)
- Connection string : Disponible dans Azure Portal → Keys

**Variables d'environnement** :
```bash
MONGODB_CONNECTION_STRING=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false
```

**Coût estimé** : ~$25/mois (400 RU/s partagées, suffisant pour dev/MVP)

**Point de contact** : Architecture ligne 1816-2515 (schémas collections)

#### 2. Azure Blob Storage

**Service** : Azure Blob Storage (General Purpose v2)
**Containers requis** :
- `generated-images` : Images IA générées (public-read via SAS)
- `uploads` : Selfies participants uploadés (private)
- `qrcodes` : QR codes animations (public-read via SAS)

**Configuration requise** :
- Storage account provisionné
- Access tier : Hot (accès fréquent)
- Redundancy : LRS (Locally Redundant Storage) pour dev, GRS (Geo-Redundant) pour prod

**Variables d'environnement** :
```bash
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=<account>;AccountKey=<key>;EndpointSuffix=core.windows.net
```

**Coût estimé** : ~$5/mois (10GB storage, suffisant pour MVP)

**Point de contact** : Architecture section Blob Storage, NFR6

#### 3. Azure Application Insights

**Service** : Application Insights (Application Performance Management)
**Configuration requise** :
- Application Insights resource créé
- Connection string disponible

**Variables d'environnement** :
```bash
AZURE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=<key>;IngestionEndpoint=https://xxx.applicationinsights.azure.com/
```

**Métriques collectées** (Epic 1) :
- Temps de réponse HTTP
- Taux d'erreur (exceptions)
- Temps connexion DB
- Disponibilité (health check)

**Coût estimé** : ~$0-10/mois (5GB logs gratuits/mois, largement suffisant pour dev)

**Point de contact** : NFR15, NFR23-25

### Intégrations API Externes (Préparation Epic 1, Utilisation Epic 4+)

#### 4. OpenAI API

**Service** : OpenAI Platform
**Modèles utilisés** :
- DALL-E 3 (génération text-to-image)
- GPT-4 Vision / Image Edit (édition images)

**Configuration Epic 1** :
- API key stockée en env var
- Configuration hardcodée dans `ai-models.config.ts`
- **Pas d'appel API dans Epic 1** (juste configuration)

**Variables d'environnement** :
```bash
OPENAI_API_KEY=sk-proj-...
```

**Coût estimé** : Variable selon usage
- DALL-E 3 : $0.04-0.08 par image générée
- Usage MVP : ~100 images/mois = $4-8/mois

**Activation requise** : Compte OpenAI avec billing activé

**Point de contact** : PRD FR80-82, architecture lignes 1695-1749

#### 5. Google AI (Gemini Imagen)

**Service** : Google AI Studio / Vertex AI
**Modèle utilisé** : Imagen 3.0

**Configuration Epic 1** :
- API key stockée en env var
- Configuration hardcodée dans `ai-models.config.ts`
- **Pas d'appel API dans Epic 1** (juste configuration)

**Variables d'environnement** :
```bash
GOOGLE_AI_API_KEY=AIza...
```

**Coût estimé** : Variable selon usage
- Imagen 3.0 : ~$0.02-0.05 par image générée
- Usage MVP : ~50 images/mois = $1-2.5/mois

**Activation requise** : Compte Google Cloud avec Vertex AI activé

**Point de contact** : PRD FR80-82

### Outils de Développement

#### ESLint Configuration (.eslintrc.json)

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-hardcoded-credentials": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off"
  }
}
```

#### Prettier Configuration (.prettierrc)

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Azure Artifacts Registry (Package Shared)

**Service** : Azure Artifacts (NPM registry interne)
**Configuration** :
- Feed créé : `appsbymci-packages`
- Package published : `@appsbymci/shared`

**Setup développeur** :
```bash
npm install -g vsts-npm-auth
vsts-npm-auth -config .npmrc
```

**.npmrc** (root) :
```
registry=https://pkgs.dev.azure.com/<org>/_packaging/appsbymci-packages/npm/registry/
always-auth=true
```

**Note** : Alternative locale pour dev : `npm link` dans packages/shared

**Coût** : Gratuit (2GB artifacts inclus dans Azure DevOps)

### Résumé des Contraintes de Version

**Node.js** : v20.x LTS (recommandé)
**npm** : v10.x
**TypeScript** : ^5.3.0 (strict mode)
**Next.js** : ^15.1.0 (App Router)
**React** : ^19.0.0

**Compatibilité Azure** :
- Azure Web App : Node 20 LTS supporté nativement
- Azure Static Web Apps : Next.js 15 supporté

## Acceptance Criteria (Authoritative)

Ces critères d'acceptation définissent précisément **quand Epic 1 est terminé**. Chaque story doit satisfaire tous ses AC avant validation.

### Story 1.1 : Initialisation du Monorepo et Configuration TypeScript

**AC-1.1.1** : Structure monorepo créée
- **Given** un nouveau projet vide
- **When** j'initialise le monorepo
- **Then** la structure suivante existe :
  ```
  AppsByMCI_V2/
  ├── apps/
  │   ├── frontend/  (Next.js 16 App Router)
  │   └── backend/   (Fastify)
  ├── packages/
  │   └── shared/    (Types, validation, constants)
  ├── package.json
  └── tsconfig.json
  ```

**AC-1.1.2** : Frontend Next.js 16 configuré
- **And** le frontend utilise Next.js 16 avec App Router
- **And** la structure app/ existe (pas pages/)
- **And** `npm run dev` démarre le serveur sur port 3000

**AC-1.1.3** : Backend Fastify configuré
- **And** le backend utilise Fastify avec TypeScript
- **And** `npm run dev:backend` démarre le serveur sur port 3001
- **And** endpoint `/health` retourne 200 OK

**AC-1.1.4** : TypeScript strict activé
- **And** TypeScript strict mode est activé dans tous les packages
- **And** `npm run build` compile sans erreur TypeScript

**AC-1.1.5** : Linting et formatting configurés
- **And** ESLint + Prettier sont configurés globalement
- **And** `npm run lint` exécute sans erreur
- **And** `npm run format` formate le code

### Story 1.2 : Configuration Cosmos DB avec Mongoose

**AC-1.2.1** : Connexion Cosmos DB réussit
- **Given** Cosmos DB est provisionné sur Azure
- **When** le backend démarre
- **Then** la connexion Mongoose vers Cosmos DB réussit
- **And** log "Database connected successfully" est affiché

**AC-1.2.2** : Collections créées
- **And** les collections suivantes existent : `users`, `animations`, `generations`, `sessions`
- **And** les collections sont visibles dans Azure Portal Data Explorer

**AC-1.2.3** : Index appliqués
- **And** les index suivants sont appliqués :
  - `users.email` (unique)
  - `animations.slug` (unique)
  - `animations.userId + status` (compound)
  - `generations.animationId` (index standard)
  - `sessions.userId` (index standard)
  - `sessions.expiresAt` (TTL index)

**AC-1.2.4** : Connection string depuis env
- **And** la connection string provient de `process.env.MONGODB_CONNECTION_STRING`
- **And** aucune connection string hardcodée dans le code

**AC-1.2.5** : Retry logic fonctionnel
- **And** si Cosmos DB temporairement indisponible, retry 3x avec backoff
- **And** logs WARN affichés pour chaque tentative
- **And** après 3 échecs, process.exit(1) avec log ERROR

### Story 1.3 : Configuration Azure Blob Storage

**AC-1.3.1** : Connexion Azure Blob réussit
- **Given** Azure Blob Storage est provisionné
- **When** le backend démarre
- **Then** la connexion au storage réussit via SDK `@azure/storage-blob`
- **And** log "Blob Storage initialized" est affiché

**AC-1.3.2** : Containers existent
- **And** les containers suivants existent :
  - `generated-images`
  - `uploads`
  - `qrcodes`
- **And** containers visibles dans Azure Portal Storage Browser

**AC-1.3.3** : Génération URLs signées fonctionne
- **And** `blobStorageService.generateSasUrl()` génère une URL signée valide
- **And** URL expiration définie à 1 heure
- **And** URL permet téléchargement image (GET)

**AC-1.3.4** : Test upload/download réussit
- **And** un test d'upload fichier dummy fonctionne
- **And** le fichier uploadé est téléchargeable via URL signée
- **And** blob visible dans Azure Portal

**AC-1.3.5** : Connection string depuis env
- **And** la connection string provient de `process.env.AZURE_STORAGE_CONNECTION_STRING`
- **And** aucune connection string hardcodée dans le code

### Story 1.4 : Configuration Modèles IA Hardcodés

**AC-1.4.1** : Configuration hardcodée créée
- **Given** fichier `apps/backend/src/config/ai-models.config.ts` existe
- **When** je lis la configuration
- **Then** 3 modèles IA sont définis :
  - DALL-E 3 (OpenAI)
  - GPT Image Edit (OpenAI)
  - Imagen 3.0 (Google)

**AC-1.4.2** : Propriétés modèles complètes
- **And** chaque modèle a :
  - `id` (string unique)
  - `name` (string display)
  - `provider` ('openai' | 'google')
  - `capabilities.requiresImage` (boolean)
  - `capabilities.supportsEdit` (boolean)
  - `capabilities.maxSize` (number pixels)

**AC-1.4.3** : API endpoint fonctionnel
- **And** endpoint `GET /api/ai-models` retourne 200 OK
- **And** body contient `{ models: [...] }` avec les 3 modèles
- **And** temps de réponse < 100ms

**AC-1.4.4** : Validation types TypeScript
- **And** type `AIModel` est exporté depuis package shared
- **And** configuration passe validation TypeScript strict
- **And** aucun `any` dans les types

**AC-1.4.5** : API keys configurées (pas utilisées Epic 1)
- **And** `process.env.OPENAI_API_KEY` est défini (placeholder OK)
- **And** `process.env.GOOGLE_AI_API_KEY` est défini (placeholder OK)
- **And** pas d'appel API réel dans Epic 1 (juste configuration)

### Story 1.5 : Package Shared - Types et Validation

**AC-1.5.1** : Structure package shared créée
- **Given** répertoire `packages/shared/` existe
- **When** je consulte la structure
- **Then** les fichiers suivants existent :
  ```
  packages/shared/
  ├── src/
  │   ├── types/index.ts
  │   ├── schemas/index.ts
  │   ├── constants.ts
  │   └── utils.ts
  ├── package.json
  └── tsconfig.json
  ```

**AC-1.5.2** : Types exportés complets
- **And** les types suivants sont exportés :
  - `User` (interface)
  - `Animation` (interface)
  - `Generation` (interface)
  - `Session` (interface)
  - `AIModel` (interface)
  - `AnimationStatus` (enum)
  - `GenerationStatus` (enum)

**AC-1.5.3** : Schémas Zod créés
- **And** les schémas Zod suivants existent :
  - `UserSchema` (validation User)
  - `AnimationSchema` (validation Animation)
  - `GenerationSchema` (validation Generation)

**AC-1.5.4** : Package importable
- **And** frontend peut importer : `import { User } from '@appsbymci/shared'`
- **And** backend peut importer : `import { AnimationSchema } from '@appsbymci/shared'`
- **And** imports TypeScript résolvent correctement

**AC-1.5.5** : Build et publication
- **And** `npm run build` compile TypeScript vers dist/
- **And** package publié vers Azure Artifacts ou npm link fonctionne
- **And** taille bundle < 500KB

### Story 1.6 : Logging avec Pino et Configuration Environnement

**AC-1.6.1** : Pino configuré
- **Given** Pino est installé et configuré
- **When** le backend démarre
- **Then** tous les logs sont en format JSON structuré

**AC-1.6.2** : Niveaux logs fonctionnels
- **And** les niveaux suivants fonctionnent : ERROR, WARN, INFO, DEBUG
- **And** niveau configurable via `process.env.LOG_LEVEL`
- **And** niveau par défaut : INFO (production), DEBUG (development)

**AC-1.6.3** : Middleware logging requêtes
- **And** middleware `pino-http` installé sur Fastify
- **And** chaque requête HTTP loggée avec :
  - `requestId` (UUID)
  - `method`, `url`
  - `statusCode`, `responseTime`

**AC-1.6.4** : Azure App Insights intégré
- **And** SDK `@microsoft/applicationinsights` configuré
- **And** connection string depuis `process.env.AZURE_APPINSIGHTS_CONNECTION_STRING`
- **And** logs envoyés automatiquement vers Azure App Insights
- **And** métriques custom : `database.connectionTime`, `blobStorage.sasTokenGeneration`

**AC-1.6.5** : Logs de démarrage présents
- **And** séquence logs démarrage complète :
  1. "Application starting..."
  2. "Environment: {env}"
  3. "Connecting to database..."
  4. "Database connected successfully"
  5. "Blob Storage initialized"
  6. "Server listening on {url}"

**AC-1.6.6** : Fichier .env.example créé
- **And** fichier `.env.example` existe avec toutes les variables requises
- **And** `.env` ajouté à `.gitignore`
- **And** README contient instructions setup environnement

## Traceability Mapping

Cette table garantit la **traçabilité complète** entre exigences PRD, stories, spec technique et composants implémentés.

| Story | FRs Couvertes | Sections Spec Technique | Composants/APIs Implémentés | Tests Requis |
|-------|--------------|------------------------|------------------------------|--------------|
| **1.1 Monorepo Setup** | Infrastructure (pré-requis Epics 2-6) | - Services and Modules (structure)<br>- Dependencies (NPM packages)<br>- Workflows (Setup dev) | - Monorepo structure<br>- Next.js 16 app/<br>- Fastify src/<br>- Package shared src/<br>- ESLint/Prettier config<br>- TypeScript config | - `npm run build` réussit<br>- `npm run lint` passe<br>- Tests manuels démarrage |
| **1.2 Cosmos DB** | FR77-82 (infrastructure DB) | - Data Models (4 collections)<br>- Services (database.service.ts)<br>- Dependencies (Mongoose)<br>- NFR9 (Retry logic) | - User.model.ts<br>- Animation.model.ts<br>- Generation.model.ts<br>- Session.model.ts<br>- database.service.ts<br>- Index Mongoose | - Test connexion DB<br>- Test index appliqués<br>- Test retry logic<br>- Test TTL index sessions |
| **1.3 Azure Blob** | FR48 (stockage images), NFR6 (URLs signées) | - Services (blob-storage.service.ts)<br>- Dependencies (Azure SDK)<br>- NFR3 (Performance SAS) | - blob-storage.service.ts<br>- Containers (3)<br>- Méthodes upload/download/generateSasUrl<br>- Health check Blob | - Test upload fichier<br>- Test génération SAS URL<br>- Test download via SAS<br>- Test containers existent |
| **1.4 Modèles IA** | FR77-82 (config modèles IA) | - Data Models (AIModel interface)<br>- Services (ai-models.service.ts)<br>- APIs (GET /api/ai-models)<br>- Dependencies (API keys env) | - ai-models.config.ts (3 modèles)<br>- ai-models.service.ts<br>- GET /api/ai-models route<br>- Types AIModel shared | - Test API retourne 3 modèles<br>- Test response time < 100ms<br>- Test validation TypeScript<br>- Test env vars définies |
| **1.5 Package Shared** | NFR17 (Code quality), NFR19 (Architecture modulaire) | - Data Models (Types TS)<br>- Dependencies (Zod)<br>- NFR4 (Bundle size) | - types/index.ts (5 interfaces)<br>- schemas/index.ts (3 schémas Zod)<br>- constants.ts<br>- utils.ts<br>- package.json shared | - Test imports frontend<br>- Test imports backend<br>- Test build < 500KB<br>- Test validation Zod |
| **1.6 Logging Pino** | NFR13-17 (Observability), NFR23-25 (Monitoring) | - Services (logging.service.ts)<br>- Dependencies (Pino, App Insights)<br>- NFR15 (Azure integration)<br>- Workflows (Démarrage backend) | - logging.service.ts<br>- pino-http middleware<br>- Azure App Insights SDK<br>- Logs démarrage séquence<br>- Métriques custom | - Test logs format JSON<br>- Test niveaux logs<br>- Test request logging<br>- Test envoi App Insights<br>- Test logs démarrage |

### Mapping Détaillé : FRs → Stories

| FR(s) | Description | Story(ies) | Justification |
|-------|-------------|------------|---------------|
| **FR77** | API GET /api/ai-models exposant modèles | 1.4 | Endpoint créé dans Story 1.4 |
| **FR78** | Wizard récupère dynamiquement liste modèles | 1.4 | Frontend (Epic 3) appellera API créée dans 1.4 |
| **FR79** | Modèles incluent capacités (requiresImage, etc.) | 1.4 | Interface AIModel définie avec capabilities |
| **FR80** | Support OpenAI DALL-E 3 | 1.4 | Modèle hardcodé dans ai-models.config.ts |
| **FR81** | Support OpenAI DALL-E Edit | 1.4 | Modèle hardcodé dans ai-models.config.ts |
| **FR82** | Support Google Gemini Imagen | 1.4 | Modèle hardcodé dans ai-models.config.ts |
| **FR48** | Stockage images Azure Blob | 1.3 | Service blob-storage.service.ts créé |
| **NFR6** | URLs signées Azure Blob | 1.3 | Méthode generateSasUrl() implémentée |
| **NFR7** | Secrets en env vars | 1.2, 1.3, 1.4, 1.6 | Toutes les connection strings via process.env |
| **NFR17** | TypeScript strict, code quality | 1.1, 1.5 | TypeScript strict mode activé partout |
| **NFR23-25** | Monitoring et observabilité | 1.6 | Pino + Azure App Insights configurés |

### Mapping : Spec Technique → Composants Implémentés

| Section Spec | Composants Concrets | Fichiers Créés |
|-------------|---------------------|----------------|
| **Services and Modules - Backend** | - database.service.ts<br>- blob-storage.service.ts<br>- ai-models.service.ts<br>- logging.service.ts | apps/backend/src/services/*.ts |
| **Services and Modules - Models** | - User.model.ts<br>- Animation.model.ts<br>- Generation.model.ts<br>- Session.model.ts | apps/backend/src/models/*.ts |
| **Services and Modules - Frontend** | - app/ (App Router)<br>- components/ui/ (ShadCN)<br>- lib/api-client.ts<br>- lib/constants.ts | apps/frontend/ |
| **Services and Modules - Shared** | - types/index.ts<br>- schemas/index.ts<br>- constants.ts<br>- utils.ts | packages/shared/src/ |
| **Data Models - Cosmos DB** | - Collections: users, animations, generations, sessions<br>- Index Mongoose | Schémas Mongoose dans models/ |
| **APIs and Interfaces** | - GET /api/ai-models<br>- GET /health | apps/backend/src/routes/*.routes.ts |
| **Workflows - Setup Dev** | - Monorepo NPM structure<br>- Scripts npm dev/build/lint | package.json (root + apps) |
| **Workflows - Démarrage Backend** | - Séquence startup Fastify<br>- Connexion DB + Blob + Logs | apps/backend/src/server.ts |
| **NFRs - Performance** | - Retry logic DB<br>- SAS token génération<br>- Bundle size shared | database.service.ts, blob-storage.service.ts |
| **NFRs - Security** | - Env vars (dotenv)<br>- URLs signées<br>- .env.example + .gitignore | .env.example, services/blob-storage.service.ts |
| **NFRs - Observability** | - Pino logs JSON<br>- pino-http middleware<br>- Azure App Insights SDK | logging.service.ts, server.ts |
| **Dependencies** | - 15 packages backend<br>- 15 packages frontend<br>- 2 packages shared | package.json (3 fichiers) |

### Test Coverage Map

| Type de Test | Stories Concernées | Composants Testés | Critère de Succès |
|-------------|-------------------|-------------------|-------------------|
| **Tests unitaires** | 1.2, 1.3, 1.4, 1.5, 1.6 | - Services (database, blob, ai-models, logging)<br>- Utilitaires shared<br>- Validation Zod | Coverage > 60% (NFR17) |
| **Tests intégration** | 1.2, 1.3, 1.6 | - Connexion Cosmos DB réelle<br>- Upload/download Azure Blob<br>- Envoi logs App Insights | Tous les tests passent |
| **Tests E2E** | 1.1 | - Setup complet monorepo<br>- Démarrage frontend + backend<br>- Health check | Serveurs démarrent sans erreur |
| **Tests manuels** | Toutes | - Validation Azure Portal (DB, Blob, App Insights)<br>- Vérification logs console | Checklist validation manuelle complète |

## Risks, Assumptions, Open Questions

### Risques Identifiés

#### RISQUE-1 : Provisioning Azure retardé (Probabilité: Medium, Impact: High)

**Description** : Les ressources Azure (Cosmos DB, Blob Storage, App Insights) peuvent prendre du temps à provisionner ou nécessiter validation billing

**Impact** :
- Blocage développement Story 1.2, 1.3, 1.6
- Impossible de tester connexions réelles
- Retard sur timeline Epic 1

**Mitigation** :
1. Provisionner ressources Azure **avant** de commencer Epic 1
2. Utiliser Azure Free Tier pour dev (Cosmos DB 400 RU/s gratuit, Blob Storage 5GB gratuit)
3. Préparer comptes de secours (MongoDB local, MinIO pour blob storage) en fallback temporaire
4. Documenter process de provisioning dans README

**Owner** : Fab (admin Azure)

**Statut** : À surveiller

#### RISQUE-2 : Conflit versions Next.js 15 / React 19 (Probabilité: Low, Impact: Medium)

**Description** : Next.js 15 et React 19 sont des versions récentes (Nov 2024), risque incompatibilités avec ShadCN/Radix UI

**Impact** :
- Erreurs TypeScript non résolues
- Composants ShadCN cassés
- Rollback vers Next.js 14 / React 18 nécessaire

**Mitigation** :
1. Vérifier compatibilité ShadCN avec Next 15 avant Story 1.1
2. Utiliser versions stables documentées (Next 15.1.x, React 19.0.x)
3. Tester installation ShadCN immédiatement après setup monorepo
4. Plan B : Downgrade vers Next 14.2 / React 18.3 si bloqué

**Owner** : Développeur frontend

**Statut** : Faible risque (ShadCN supporte Next 15+)

#### RISQUE-3 : Coûts Azure imprévus (Probabilité: Low, Impact: Low)

**Description** : Cosmos DB et Blob Storage peuvent générer coûts plus élevés que prévu si mal configurés

**Impact** :
- Dépassement budget Azure
- Nécessité réduire capacités

**Mitigation** :
1. Configurer Azure Cost Alerts ($50 threshold)
2. Utiliser tiers gratuits en dev : Cosmos DB 400 RU/s, Blob Storage 5GB, App Insights 5GB logs
3. Documenter cleanup automatique : supprimer blobs de test après 7 jours
4. Monitoring quotidien coûts pendant 1ère semaine

**Owner** : Fab (admin Azure)

**Statut** : Géré

#### RISQUE-4 : Package shared publication Azure Artifacts complexe (Probabilité: Medium, Impact: Low)

**Description** : Setup Azure Artifacts NPM registry peut être complexe, authentication via vsts-npm-auth

**Impact** :
- Impossible publier package shared
- Frontend/backend ne peuvent importer @appsbymci/shared
- Workaround `npm link` obligatoire

**Mitigation** :
1. Utiliser `npm link` en local pour développement (Story 1.5)
2. Publier vers Azure Artifacts optionnel pour Epic 1 (requis production)
3. Documenter setup Azure Artifacts dans README pour future publication
4. Alternative : package shared comme dossier local (pas idéal mais fonctionne)

**Owner** : Développeur backend

**Statut** : Workaround acceptable

### Hypothèses (Assumptions)

#### ASSUMPTION-1 : Accès Azure provisionné
- **Hypothèse** : Fab a accès admin Azure pour créer Cosmos DB, Blob Storage, App Insights
- **Validation** : Vérifier accès Azure Portal avant Epic 1
- **Si faux** : Demander accès admin ou utiliser compte Azure personnel temporairement

#### ASSUMPTION-2 : Billing Azure activé
- **Hypothèse** : Compte Azure a billing activé (carte bancaire configurée) pour dépasser Free Tier si besoin
- **Validation** : Vérifier dans Azure Portal → Cost Management
- **Si faux** : Activer billing ou rester dans limites Free Tier strictement

#### ASSUMPTION-3 : Node.js 20 installé
- **Hypothèse** : Environnement dev a Node.js v20.x LTS installé
- **Validation** : `node --version` retourne v20.x.x
- **Si faux** : Installer via nvm : `nvm install 20 && nvm use 20`

#### ASSUMPTION-4 : API Keys OpenAI/Google disponibles
- **Hypothèse** : Fab a déjà des API keys OpenAI et Google AI ou peut les créer rapidement
- **Validation** : Vérifier comptes OpenAI Platform et Google AI Studio
- **Si faux** : Epic 1 peut utiliser placeholders (API keys utilisées seulement Epic 4+)

#### ASSUMPTION-5 : Monorepo NPM sans workspaces accepté
- **Hypothèse** : Contrainte "monorepo NPM sans workspaces" (mentionnée dans PRD/Architecture) est toujours valide
- **Validation** : Confirmer avec Fab si cette contrainte est toujours nécessaire
- **Si faux** : Utiliser npm workspaces (simplifie gestion dépendances)

#### ASSUMPTION-6 : Environnement local suffisant pour Epic 1
- **Hypothèse** : Epic 1 peut être développé/testé entièrement en local (pas besoin déploiement Azure immédiat)
- **Validation** : Tester connexions Azure depuis local (Cosmos DB, Blob Storage accessibles via internet)
- **Si faux** : Provisionner environnement Azure dev pour développement distant

### Questions Ouvertes

#### QUESTION-1 : Azure Artifacts obligatoire ou npm link acceptable ?
- **Question** : Est-ce que publication du package shared vers Azure Artifacts est requise pour Epic 1, ou `npm link` suffit pour développement local ?
- **Impact** : Si Azure Artifacts requis, complexité setup augmentée
- **Recommandation** : Utiliser `npm link` pour Epic 1, publier vers Azure Artifacts post-MVP
- **Décision requise de** : Fab

#### QUESTION-2 : Provisioning Azure : qui fait quoi ?
- **Question** : Fab provisionne les ressources Azure avant Epic 1, ou développeur crée ressources pendant Story 1.2-1.3 ?
- **Impact** : Coordination nécessaire si Fab provisionne à l'avance
- **Recommandation** : Fab provisionne Cosmos DB + Blob Storage + App Insights **avant** Epic 1, fournit connection strings
- **Décision requise de** : Fab

#### QUESTION-3 : Tests unitaires requis pour Epic 1 ou juste tests intégration ?
- **Question** : NFR17 mentionne coverage > 60%, mais Epic 1 est principalement infrastructure. Quel niveau de tests requis ?
- **Impact** : Si tests unitaires requis, effort supplémentaire pour Story 1.2-1.6
- **Recommandation** : Tests intégration (connexions DB/Blob réelles) obligatoires, tests unitaires optionnels Epic 1, requis Epic 2+
- **Décision requise de** : Fab

#### QUESTION-4 : .env.example : placeholders ou vraies valeurs ?
- **Question** : Fichier `.env.example` doit avoir placeholders (`MONGODB_CONNECTION_STRING=your-connection-string-here`) ou vraies connection strings Azure dev ?
- **Impact** : Sécurité vs facilité setup
- **Recommandation** : Placeholders dans `.env.example`, vraies valeurs dans `.env` (gitignored) + documentation README
- **Décision requise de** : Fab

#### QUESTION-5 : Monorepo NPM sans workspaces : pourquoi ?
- **Question** : Quelle est la raison de la contrainte "monorepo NPM sans workspaces" ? Déploiement Azure incompatible avec workspaces ?
- **Impact** : Si contrainte peut être levée, simplification gestion dépendances
- **Recommandation** : Vérifier si contrainte toujours valide, sinon utiliser npm workspaces (standard moderne)
- **Décision requise de** : Fab

### Actions de Suivi

| Action | Responsable | Deadline | Statut |
|--------|-------------|----------|--------|
| Provisionner Cosmos DB Azure | Fab | Avant Story 1.2 | ❌ Pending |
| Provisionner Blob Storage Azure | Fab | Avant Story 1.3 | ❌ Pending |
| Provisionner App Insights Azure | Fab | Avant Story 1.6 | ❌ Pending |
| Vérifier compatibilité Next 15 + ShadCN | Dev frontend | Story 1.1 | ❌ Pending |
| Configurer Azure Cost Alerts ($50) | Fab | Avant Story 1.2 | ❌ Pending |
| Décision : Azure Artifacts vs npm link | Fab | Story 1.5 | ❌ Pending |
| Décision : Niveau tests Epic 1 | Fab | Story 1.2 | ❌ Pending |
| Créer API keys OpenAI/Google (ou placeholders) | Fab | Story 1.4 | ❌ Pending |

## Test Strategy Summary

### Philosophie de Test Epic 1

Epic 1 étant **fondation infrastructure**, la stratégie de test se concentre sur :
1. ✅ **Validation connexions externes** (Cosmos DB, Azure Blob, App Insights)
2. ✅ **Tests intégration** plutôt que unitaires (infrastructure = intégration par nature)
3. ✅ **Vérification manuelle Azure Portal** (collections créées, blobs uploadés, logs reçus)
4. ✅ **Smoke tests** (serveurs démarrent, health check OK)

**Coverage cible Epic 1** : 40-50% (vs 60% Epic 2+) car beaucoup de setup manuel

### Tests par Story

#### Story 1.1 : Monorepo Setup

**Type** : Tests E2E manuels

**Tests requis** :
1. ✅ **Test build** : `npm run build` compile sans erreur TypeScript
2. ✅ **Test lint** : `npm run lint` passe sans erreur
3. ✅ **Test format** : `npm run format` formate code correctement
4. ✅ **Test démarrage frontend** : `npm run dev` démarre sur port 3000
5. ✅ **Test démarrage backend** : `npm run dev:backend` démarre sur port 3001

**Outils** : Scripts npm, vérification manuelle console

**Critère de succès** : Tous les scripts npm exécutent sans erreur

#### Story 1.2 : Cosmos DB

**Type** : Tests intégration + Tests manuels Azure Portal

**Tests requis** :
1. ✅ **Test connexion DB** : Backend démarre et se connecte à Cosmos DB
   ```typescript
   // apps/backend/tests/integration/database.test.ts
   describe('Cosmos DB Connection', () => {
     it('should connect successfully', async () => {
       await databaseService.connect()
       expect(databaseService.isConnected()).toBe(true)
     })
   })
   ```

2. ✅ **Test retry logic** : Simuler échec connexion, vérifier 3 tentatives
   ```typescript
   it('should retry 3 times on connection failure', async () => {
     // Mock Mongoose connect to fail
     jest.spyOn(mongoose, 'connect').mockRejectedValue(new Error('Connection failed'))

     await expect(databaseService.connect()).rejects.toThrow()
     expect(mongoose.connect).toHaveBeenCalledTimes(3)
   })
   ```

3. ✅ **Test collections créées** : Vérification manuelle Azure Portal Data Explorer
   - Collections visibles : users, animations, generations, sessions

4. ✅ **Test index appliqués** : Query Mongo pour lister index
   ```typescript
   it('should have indexes applied', async () => {
     const userIndexes = await User.collection.getIndexes()
     expect(userIndexes).toHaveProperty('email_1')
   })
   ```

**Outils** : Jest, Mongoose, Azure Portal

**Critère de succès** : Connexion réussit, retry fonctionne, collections + index visibles

#### Story 1.3 : Azure Blob Storage

**Type** : Tests intégration + Tests manuels Azure Portal

**Tests requis** :
1. ✅ **Test connexion Blob** : Backend initialise BlobServiceClient
   ```typescript
   describe('Azure Blob Storage', () => {
     it('should initialize BlobServiceClient', () => {
       expect(blobStorageService.isInitialized()).toBe(true)
     })
   })
   ```

2. ✅ **Test upload fichier** : Upload dummy file vers container `uploads`
   ```typescript
   it('should upload file to blob storage', async () => {
     const buffer = Buffer.from('test content')
     const blobUrl = await blobStorageService.uploadFile('uploads', 'test.txt', buffer)

     expect(blobUrl).toContain('uploads/test.txt')
   })
   ```

3. ✅ **Test génération SAS URL** : Générer URL signée valide 1h
   ```typescript
   it('should generate SAS URL with 1h expiry', async () => {
     const sasUrl = await blobStorageService.generateSasUrl('uploads', 'test.txt', 60)

     expect(sasUrl).toContain('sig=')
     expect(sasUrl).toContain('se=') // expiry

     // Test download via SAS URL
     const response = await fetch(sasUrl)
     expect(response.status).toBe(200)
   })
   ```

4. ✅ **Test containers existent** : Vérification manuelle Azure Portal Storage Browser
   - Containers visibles : generated-images, uploads, qrcodes

**Outils** : Jest, @azure/storage-blob, Azure Portal

**Critère de succès** : Upload fonctionne, SAS URL téléchargeable, containers visibles

#### Story 1.4 : Modèles IA

**Type** : Tests unitaires + Tests API

**Tests requis** :
1. ✅ **Test configuration hardcodée** : Valider 3 modèles définis
   ```typescript
   describe('AI Models Config', () => {
     it('should have 3 models configured', () => {
       const models = aiModelsService.getAllModels()
       expect(models).toHaveLength(3)
     })
   })
   ```

2. ✅ **Test API endpoint** : GET /api/ai-models retourne 200 OK
   ```typescript
   it('GET /api/ai-models should return models', async () => {
     const response = await request(app).get('/api/ai-models')

     expect(response.status).toBe(200)
     expect(response.body.models).toHaveLength(3)
     expect(response.body.models[0]).toHaveProperty('id')
     expect(response.body.models[0]).toHaveProperty('capabilities')
   })
   ```

3. ✅ **Test performance API** : Temps réponse < 100ms
   ```typescript
   it('should respond in less than 100ms', async () => {
     const start = Date.now()
     await request(app).get('/api/ai-models')
     const duration = Date.now() - start

     expect(duration).toBeLessThan(100)
   })
   ```

4. ✅ **Test types TypeScript** : Import AIModel depuis shared compile
   ```typescript
   import { AIModel } from '@appsbymci/shared'

   it('should have valid TypeScript types', () => {
     const model: AIModel = {
       id: 'dall-e-3',
       name: 'DALL-E 3',
       provider: 'openai',
       capabilities: { requiresImage: false, supportsEdit: false, maxSize: 1024 }
     }

     expect(model).toBeDefined()
   })
   ```

**Outils** : Jest, Supertest (API testing)

**Critère de succès** : API retourne 3 modèles, < 100ms, types valides

#### Story 1.5 : Package Shared

**Type** : Tests unitaires + Tests build

**Tests requis** :
1. ✅ **Test exports types** : Tous les types importables
   ```typescript
   import { User, Animation, Generation, Session, AIModel } from '@appsbymci/shared'

   it('should export all types', () => {
     expect(User).toBeDefined()
     expect(Animation).toBeDefined()
     // etc.
   })
   ```

2. ✅ **Test schémas Zod** : Validation fonctionne
   ```typescript
   import { UserSchema } from '@appsbymci/shared'

   it('should validate user with Zod schema', () => {
     const validUser = {
       email: 'test@example.com',
       password: 'hashed-password',
       role: 'admin'
     }

     const result = UserSchema.safeParse(validUser)
     expect(result.success).toBe(true)
   })
   ```

3. ✅ **Test build package** : `npm run build` génère dist/
   ```bash
   cd packages/shared
   npm run build
   ls dist/ # Vérifier fichiers compilés présents
   ```

4. ✅ **Test taille bundle** : Bundle < 500KB
   ```bash
   du -sh packages/shared/dist
   # Output: 124K (bien < 500KB)
   ```

**Outils** : Jest, Zod, Bash

**Critère de succès** : Tous les types importables, Zod valide, build < 500KB

#### Story 1.6 : Logging Pino

**Type** : Tests intégration + Vérification manuelle Azure Portal

**Tests requis** :
1. ✅ **Test logs format JSON** : Logs Pino en JSON structuré
   ```typescript
   it('should log in JSON format', () => {
     const logOutput = captureLogsOutput(() => {
       logger.info('test message')
     })

     const parsed = JSON.parse(logOutput)
     expect(parsed).toHaveProperty('level')
     expect(parsed).toHaveProperty('msg')
     expect(parsed.msg).toBe('test message')
   })
   ```

2. ✅ **Test niveaux logs** : ERROR, WARN, INFO, DEBUG fonctionnels
   ```typescript
   it('should support all log levels', () => {
     logger.error('error message')
     logger.warn('warn message')
     logger.info('info message')
     logger.debug('debug message')

     // Vérifier logs capturés
   })
   ```

3. ✅ **Test request logging** : Chaque requête HTTP loggée
   ```typescript
   it('should log HTTP requests', async () => {
     const logs = captureLogsOutput(async () => {
       await request(app).get('/api/ai-models')
     })

     expect(logs).toContain('Request completed')
     expect(logs).toContain('GET /api/ai-models')
     expect(logs).toContain('statusCode')
   })
   ```

4. ✅ **Test Azure App Insights** : Logs visibles dans Azure Portal
   - Vérification manuelle : Azure Portal → App Insights → Logs
   - Query : `traces | where message contains "Application starting"`

5. ✅ **Test logs démarrage** : Séquence complète présente
   ```typescript
   it('should log startup sequence', () => {
     const logs = captureServerStartupLogs()

     expect(logs).toContain('Application starting')
     expect(logs).toContain('Database connected successfully')
     expect(logs).toContain('Blob Storage initialized')
     expect(logs).toContain('Server listening')
   })
   ```

**Outils** : Jest, Pino, Azure Portal

**Critère de succès** : Logs JSON, tous niveaux fonctionnels, visibles Azure Portal

### Outils de Test

| Outil | Usage | Stories |
|-------|-------|---------|
| **Jest** | Framework tests unitaires/intégration | 1.2-1.6 |
| **Supertest** | Tests API HTTP (endpoints Fastify) | 1.4 |
| **@testing-library** | Tests composants React (Epic 3+, pas Epic 1) | N/A |
| **Azure Portal** | Vérification manuelle ressources créées | 1.2, 1.3, 1.6 |
| **Bash scripts** | Tests E2E setup (npm run build, lint) | 1.1 |

### Environnement de Test

**Local development** :
- Connexions réelles Azure (Cosmos DB, Blob Storage, App Insights)
- Variables env depuis `.env` local
- Pas de mocks Azure (tests intégration vrais services)

**CI/CD** (post-Epic 1) :
- Tests unitaires uniquement (pas intégration Azure)
- Mocks services Azure pour tests rapides
- Tests intégration uniquement sur environnement staging

### Checklist Validation Finale Epic 1

Avant de marquer Epic 1 comme terminé, vérifier :

- [ ] **1.1** : Monorepo structure créée, `npm run build` passe
- [ ] **1.2** : Backend se connecte à Cosmos DB, collections + index visibles Azure Portal
- [ ] **1.3** : Blob Storage initialisé, upload/download fonctionne, SAS URL valide
- [ ] **1.4** : API `/api/ai-models` retourne 3 modèles, temps réponse < 100ms
- [ ] **1.5** : Package shared buildé, types importables frontend+backend, < 500KB
- [ ] **1.6** : Logs Pino JSON, requêtes HTTP loggées, visibles Azure App Insights
- [ ] **Tests** : Au moins 40% coverage, tous tests intégration passent
- [ ] **Documentation** : README avec instructions setup environnement
- [ ] **.env.example** : Toutes variables définies avec placeholders
- [ ] **Health check** : Endpoint `/health` retourne statut DB + Blob Storage

**Temps estimé total Epic 1** : 3-4 jours développement + 1 jour tests/validation = **4-5 jours**
