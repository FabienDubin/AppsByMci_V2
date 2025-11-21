# Environment Variables - AppsByMCI V2

**Date:** 2025-11-21
**Author:** Fab
**Status:** Reference Document

---

## Vue d'Ensemble

Ce document liste toutes les variables d'environnement requises pour exécuter AppsByMCI V2 en local, staging et production.

**Structure :**
- Backend : `apps/backend/.env`
- Frontend : `apps/frontend/.env.local`

---

## Backend Variables (`apps/backend/.env`)

### Database

```bash
# Cosmos DB (MongoDB API)
MONGODB_CONNECTION_STRING="mongodb://..."
# Format: mongodb://<username>:<password>@<host>:<port>/<database>?ssl=true&replicaSet=globaldb

# Exemple Local (MongoDB local):
# MONGODB_CONNECTION_STRING="mongodb://localhost:27017/appsbymci"

# Exemple Production (Cosmos DB):
# MONGODB_CONNECTION_STRING="mongodb://appsbymci-db:xxxxx@appsbymci-db.mongo.cosmos.azure.com:10255/appsbymci?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000"
```

### Azure Blob Storage

```bash
# Connection string Azure Storage Account
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"

# Containers utilisés (auto-créés si inexistants):
# - generated-images : Images IA générées
# - uploads : Selfies participants
# - qrcodes : QR codes animations
```

### Authentication & Security

```bash
# JWT Secret (générer avec: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Refresh Token Secret (différent du JWT_SECRET)
REFRESH_TOKEN_SECRET="your-super-secret-refresh-token-key"

# JWT Expiration (optionnel, défaut: 15min)
JWT_EXPIRATION="15m"

# Refresh Token Expiration (optionnel, défaut: 7d)
REFRESH_TOKEN_EXPIRATION="7d"
```

### AI Services

```bash
# OpenAI API Key (pour DALL-E 3, GPT Image 1)
OPENAI_API_KEY="sk-..."

# Google Cloud API Key (pour Imagen 3)
GOOGLE_API_KEY="AIza..."

# Google Cloud Project ID (pour Imagen 3 via Vertex AI)
GOOGLE_CLOUD_PROJECT_ID="your-project-id"

# Google Cloud Location (ex: us-central1, europe-west4)
GOOGLE_CLOUD_LOCATION="us-central1"
```

### Email Service (Mailjet)

```bash
# Mailjet API Key
MAILJET_API_KEY="your-mailjet-api-key"

# Mailjet Secret Key
MAILJET_SECRET_KEY="your-mailjet-secret-key"

# Sender Email (vérifié dans Mailjet)
MAILJET_SENDER_EMAIL="noreply@appsbymci.com"

# Sender Name
MAILJET_SENDER_NAME="AppsByMCI"
```

### Application Configuration

```bash
# Node Environment
NODE_ENV="development"  # development | staging | production

# Port Backend (défaut: 3001)
PORT=3001

# CORS Allowed Origins (frontend URL)
CORS_ORIGINS="http://localhost:3000,https://appsbymci.azurestaticapps.net"

# Logging Level (debug | info | warn | error)
LOG_LEVEL="info"
```

### Azure Application Insights (Monitoring)

```bash
# Application Insights Connection String (optionnel en local)
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=...;IngestionEndpoint=..."
```

---

## Frontend Variables (`apps/frontend/.env.local`)

### API Configuration

```bash
# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Production:
# NEXT_PUBLIC_API_URL="https://appsbymci-backend.azurewebsites.net"
```

### Application Configuration

```bash
# App Base URL (pour génération QR codes, emails, etc.)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Production:
# NEXT_PUBLIC_APP_URL="https://appsbymci.azurestaticapps.net"
```

### Analytics (Optionnel)

```bash
# Google Analytics Measurement ID (optionnel)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

---

## Fichiers `.env.example`

### Backend `.env.example`

Créer `apps/backend/.env.example` avec :

```bash
# Database
MONGODB_CONNECTION_STRING=

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=

# Authentication
JWT_SECRET=
REFRESH_TOKEN_SECRET=

# AI Services
OPENAI_API_KEY=
GOOGLE_API_KEY=
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_LOCATION=us-central1

# Email
MAILJET_API_KEY=
MAILJET_SECRET_KEY=
MAILJET_SENDER_EMAIL=noreply@appsbymci.com
MAILJET_SENDER_NAME=AppsByMCI

# Application
NODE_ENV=development
PORT=3001
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=info

# Monitoring (optionnel en local)
APPLICATIONINSIGHTS_CONNECTION_STRING=
```

### Frontend `.env.example`

Créer `apps/frontend/.env.example` avec :

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Analytics (optionnel)
NEXT_PUBLIC_GA_MEASUREMENT_ID=
```

---

## Setup Instructions

### 1. Backend Setup

```bash
cd apps/backend

# Copier le template
cp .env.example .env

# Éditer .env avec vos valeurs
nano .env
```

**Valeurs minimales requises pour démarrer en local :**
- `MONGODB_CONNECTION_STRING` : MongoDB local ou Cosmos DB
- `JWT_SECRET` et `REFRESH_TOKEN_SECRET` : Générer avec `openssl rand -base64 32`
- `OPENAI_API_KEY` : Pour génération IA (gratuit tier OK pour tests)

**Optionnel en local :**
- Azure Storage (utiliser stockage local temporaire)
- Mailjet (skip emails en local)
- Google API (si pas besoin Imagen 3)

### 2. Frontend Setup

```bash
cd apps/frontend

# Copier le template
cp .env.example .env.local

# Éditer .env.local
nano .env.local
```

**Valeurs requises :**
- `NEXT_PUBLIC_API_URL` : URL du backend (http://localhost:3001 en local)
- `NEXT_PUBLIC_APP_URL` : URL du frontend (http://localhost:3000 en local)

### 3. Vérification

**Backend :**
```bash
cd apps/backend
npm run dev

# Devrait afficher dans les logs:
# ✓ MongoDB connected
# ✓ Azure Blob connected
# ✓ Server listening on port 3001
```

**Frontend :**
```bash
cd apps/frontend
npm run dev

# Ouvrir http://localhost:3000
```

---

## Environnements

### Development (Local)

```bash
NODE_ENV=development
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/appsbymci
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Staging (Azure)

```bash
NODE_ENV=staging
MONGODB_CONNECTION_STRING=mongodb://appsbymci-staging-db:...
NEXT_PUBLIC_API_URL=https://appsbymci-staging-backend.azurewebsites.net
```

### Production (Azure)

```bash
NODE_ENV=production
MONGODB_CONNECTION_STRING=mongodb://appsbymci-prod-db:...
NEXT_PUBLIC_API_URL=https://appsbymci-backend.azurewebsites.net
```

---

## Sécurité

### ⚠️ CRITIQUES - Ne JAMAIS commit ces fichiers

```bash
# Ajouter dans .gitignore (déjà fait normalement)
.env
.env.local
.env.production
.env.staging
```

### ✅ Bonnes Pratiques

1. **Générer secrets avec CLI** :
   ```bash
   openssl rand -base64 32
   ```

2. **Utiliser Azure Key Vault en production** (optionnel Sprint 2+)

3. **Rotation des secrets** : Changer JWT_SECRET tous les 6 mois

4. **Différents secrets par environnement** : Dev ≠ Staging ≠ Prod

5. **Vérifier secrets avant commit** :
   ```bash
   git diff  # Vérifier qu'aucun .env n'est staged
   ```

---

## Troubleshooting

### Erreur "MongoDB connection failed"

**Solution :**
- Vérifier `MONGODB_CONNECTION_STRING` correct
- Si Cosmos DB : vérifier firewall rules (autoriser IP)
- Si MongoDB local : vérifier service running (`mongod`)

### Erreur "Azure Blob connection failed"

**Solution :**
- Vérifier `AZURE_STORAGE_CONNECTION_STRING` correct
- Vérifier Storage Account existe et accessible
- Vérifier containers auto-créés ou créer manuellement

### Erreur "JWT malformed"

**Solution :**
- Vérifier `JWT_SECRET` défini et > 32 caractères
- Régénérer secret si doute : `openssl rand -base64 32`

### Erreur "CORS blocked"

**Solution :**
- Vérifier `CORS_ORIGINS` contient l'URL frontend exact
- Format : `http://localhost:3000` (pas de trailing slash)
- Multiples origins : `http://localhost:3000,https://staging.com`

---

## Références

- Architecture Document : `docs/architecture.md`
- Epic 1.1 : Setup Monorepo (utilise ces variables)
- NFR7 : Gestion sécurisée des secrets via variables d'environnement
