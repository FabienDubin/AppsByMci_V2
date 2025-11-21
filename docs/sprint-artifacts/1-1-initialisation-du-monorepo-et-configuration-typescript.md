# Story 1.1: Initialisation du Monorepo et Configuration TypeScript

Status: review

## Story

En tant que **développeur**,
Je veux **initialiser la structure monorepo avec Next.js 16, Fastify et TypeScript strict**,
Afin que **l'équipe dispose d'une base technique solide pour tous les développements futurs**.

## Acceptance Criteria

### AC-1.1.1 : Structure monorepo créée
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

### AC-1.1.2 : Frontend Next.js 16 configuré
- **And** le frontend utilise Next.js 16 avec App Router
- **And** la structure app/ existe (pas pages/)
- **And** `npm run dev` démarre le serveur sur port 3000

### AC-1.1.3 : Backend Fastify configuré
- **And** le backend utilise Fastify avec TypeScript
- **And** `npm run dev:backend` démarre le serveur sur port 3001
- **And** endpoint `/health` retourne 200 OK

### AC-1.1.4 : TypeScript strict activé
- **And** TypeScript strict mode est activé dans tous les packages
- **And** `npm run build` compile sans erreur TypeScript

### AC-1.1.5 : Linting et formatting configurés
- **And** ESLint + Prettier sont configurés globalement
- **And** `npm run lint` exécute sans erreur
- **And** `npm run format` formate le code

## Tasks / Subtasks

- [x] Task 1 : Créer la structure monorepo de base (AC: 1.1.1)
  - [x] Initialiser projet root avec `npm init -y`
  - [x] Créer dossiers `apps/frontend`, `apps/backend`, `packages/shared`
  - [x] Configurer package.json root avec scripts globaux

- [x] Task 2 : Configurer Next.js 16 App Router (AC: 1.1.2)
  - [x] Installer Next.js 16, React 19, TypeScript dans apps/frontend
  - [x] Créer structure App Router (`app/` directory)
  - [x] Configurer next.config.js
  - [x] Créer page d'accueil basique (app/page.tsx)
  - [x] Vérifier démarrage sur port 3000

- [x] Task 3 : Configurer Fastify backend (AC: 1.1.3)
  - [x] Installer Fastify, TypeScript, tsx dans apps/backend
  - [x] Créer src/index.ts et src/app.ts
  - [x] Implémenter endpoint GET /health
  - [x] Configurer démarrage sur port 3001
  - [x] Vérifier health check retourne 200 OK

- [x] Task 4 : Configurer TypeScript strict sur tous les packages (AC: 1.1.4)
  - [x] Créer tsconfig.json root avec strict: true
  - [x] Configurer tsconfig.json pour frontend (extends root)
  - [x] Configurer tsconfig.json pour backend (extends root)
  - [x] Configurer tsconfig.json pour shared (extends root)
  - [x] Vérifier compilation sans erreur avec `npm run build`

- [x] Task 5 : Configurer ESLint et Prettier globalement (AC: 1.1.5)
  - [x] Installer ESLint, Prettier, plugins TypeScript
  - [x] Créer .eslintrc.json root avec règles strictes
  - [x] Créer .prettierrc avec style guide projet
  - [x] Ajouter scripts lint/format dans package.json root
  - [x] Vérifier `npm run lint` et `npm run format` fonctionnent

- [x] Task 6 : Créer package shared basique (AC: 1.1.1)
  - [x] Initialiser packages/shared/package.json
  - [x] Créer src/types/index.ts avec types de base
  - [x] Créer src/constants.ts
  - [x] Configurer build TypeScript vers dist/
  - [x] Tester import depuis frontend et backend

- [x] Task 7 : Configurer scripts npm pour le développement (AC: 1.1.2, 1.1.3)
  - [x] Ajouter `npm run dev:frontend` (démarre Next.js)
  - [x] Ajouter `npm run dev:backend` (démarre Fastify)
  - [x] Ajouter `npm run dev` (démarre les 2 en parallèle avec concurrently)
  - [x] Ajouter `npm run build` (build tous les packages)

- [x] Task 8 : Documentation et fichiers de configuration (AC: tous)
  - [x] Créer README.md root avec instructions setup
  - [x] Créer .gitignore (node_modules, .env, dist, .next)
  - [x] Créer .env.example pour backend (placeholders)
  - [x] Documenter structure monorepo dans README

## Dev Notes

### Contexte Architectural

Cette story établit les **fondations critiques** de l'ensemble du projet AppsByMCI V2. Elle crée l'infrastructure de base requise pour toutes les stories suivantes.

**Philosophie monorepo :**
- Monorepo **NPM sans workspaces** (contrainte déploiement Azure)
- Package shared utilisé via `npm link` en développement local
- Chaque app (frontend/backend) est indépendante mais partage types/constants

**Choix techniques clés :**
- **Next.js 16** : Version stable avec App Router (pas Pages Router)
- **React 19** : Dernière version stable
- **Fastify** : Performance supérieure à Express, TypeScript natif
- **TypeScript strict** : Type safety maximale dès le départ

### Architecture Patterns

**Monorepo sans workspaces :**
```bash
# Installation dépendances (manuel par app)
npm install                          # Root
npm install --prefix apps/frontend   # Frontend
npm install --prefix apps/backend    # Backend
npm install --prefix packages/shared # Shared

# Développement local avec shared package
cd packages/shared && npm link
cd apps/frontend && npm link @appsbymci/shared
cd apps/backend && npm link @appsbymci/shared
```

**Structure Next.js App Router :**
```
apps/frontend/
├── app/
│   ├── layout.tsx       # Root layout global
│   ├── page.tsx         # Landing page
│   └── globals.css      # Tailwind imports
├── components/
│   └── ui/              # Composants ShadCN (story future)
├── lib/
│   ├── utils.ts
│   └── constants.ts
└── next.config.js
```

**Backend Fastify minimal :**
```typescript
// apps/backend/src/app.ts
import Fastify from 'fastify'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() }
  })

  return app
}

// apps/backend/src/index.ts
import { buildApp } from './app'

const app = buildApp()
const PORT = process.env.PORT || 3001

app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  app.log.info(`Server listening on ${address}`)
})
```

### Contraintes Techniques

**TypeScript strict mode :**
```json
// tsconfig.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

**ESLint configuration :**
```json
// .eslintrc.json
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

**Prettier configuration :**
```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Testing Standards

**Tests pour cette story :**
- ✅ **Test E2E manuel** : Démarrage frontend + backend sans erreur
- ✅ **Test build** : `npm run build` compile tous les packages
- ✅ **Test lint** : `npm run lint` passe sans erreur
- ✅ **Test health check** : `curl http://localhost:3001/health` retourne 200 OK

**Pas de tests unitaires requis** (infrastructure setup uniquement)

### Dépendances Principales

**Frontend (apps/frontend/package.json) :**
```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^15.1.0"
  }
}
```

**Backend (apps/backend/package.json) :**
```json
{
  "dependencies": {
    "fastify": "^4.26.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0"
  }
}
```

**Shared (packages/shared/package.json) :**
```json
{
  "name": "@appsbymci/shared",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### Project Structure Notes

**Structure finale attendue après Story 1.1 :**
```
AppsByMCI_V2/
├── apps/
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   ├── lib/
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── .gitignore
│   └── backend/
│       ├── src/
│       │   ├── index.ts
│       │   └── app.ts
│       ├── tsconfig.json
│       ├── package.json
│       ├── .env.example
│       └── .gitignore
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types/
│       │   │   └── index.ts
│       │   └── constants.ts
│       ├── tsconfig.json
│       └── package.json
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

**Alignement avec architecture :**
- Respecte l'architecture définie dans `docs/architecture.md` (lignes 314-499)
- Monorepo NPM sans workspaces (contrainte Azure déploiement)
- Structure préparée pour intégration future Tailwind CSS + ShadCN (Story 1.1 post-MVP ou Epic 3)

### References

**Architecture :**
- [Source: docs/architecture.md#Structure-du-projet] - Lignes 314-499
- [Source: docs/architecture.md#Décision-Initialisation] - Lignes 65-94

**Tech Spec Epic 1 :**
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Story-1.1] - Lignes 1062-1097 (Acceptance Criteria)
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Dependencies] - Lignes 803-859 (NPM packages)
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Test-Strategy] - Lignes 1498-1511 (Tests E2E)

**Contraintes Techniques :**
- TypeScript strict mode : Mandatory (NFR17)
- Node.js v20.x LTS requis
- NPM v10.x
- Pas de dépendances Azure dans Story 1.1 (ajoutées Stories 1.2-1.6)

### Warnings et Gotchas

⚠️ **Next.js 15 + React 19 :** Versions récentes (Nov 2024), vérifier compatibilité avant installation

⚠️ **Monorepo sans workspaces :** Installation manuelle dépendances par app, pas de `npm install` root automatique

⚠️ **Package shared via npm link :** En développement local uniquement, publication Azure Artifacts pour production (post-Epic 1)

⚠️ **Port conflicts :** Frontend 3000, Backend 3001 - vérifier ports disponibles

⚠️ **Node version :** Utiliser Node 20 LTS (`nvm use 20`)

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/1-1-initialisation-du-monorepo-et-configuration-typescript.context.xml

### Agent Model Used

Claude Sonnet 4.5 (model ID: claude-sonnet-4-5-20250929)

### Debug Log References

Aucun debug log nécessaire - Implémentation sans erreur bloquante.

### Completion Notes List

**Date de complétion**: 2025-11-21

✅ **Monorepo configuré avec succès** :
- Structure apps/frontend, apps/backend, packages/shared créée
- Next.js 16.0.3 avec App Router installé et fonctionnel
- Backend Fastify 5.6.2 avec endpoint /health opérationnel
- TypeScript strict activé sur tous les packages

✅ **Validations exécutées** :
- `npm run build` : Compilation réussie (shared + frontend + backend)
- `npm run lint` : Aucune erreur ESLint
- Health check backend : Répond correctement sur http://localhost:3001/health

✅ **Configuration qualité** :
- ESLint 8.x avec @typescript-eslint configuré
- Prettier 3.x avec style guide défini
- Scripts npm globaux fonctionnels (dev, build, lint, format)

✅ **Documentation complète** :
- README.md avec instructions setup détaillées
- .gitignore configuré (node_modules, dist, .env, etc.)
- .env.example pour le backend

**Note importante** : Package shared utilisable via npm link en local. Publication Azure Artifacts sera configurée ultérieurement (post-Epic 1).

### File List

**Fichiers créés** :

```
/package.json (root - scripts globaux)
/tsconfig.json (root - config TypeScript strict)
/.eslintrc.json (config ESLint)
/.prettierrc (config Prettier)
/.gitignore (exclusions git)
/README.md (documentation projet)

/apps/frontend/ (Next.js 16 via create-next-app)
  - app/, components/, public/
  - next.config.ts, tsconfig.json
  - package.json, eslint.config.mjs

/apps/backend/
  - src/index.ts (point d'entrée)
  - src/app.ts (application Fastify)
  - tsconfig.json
  - package.json
  - .env.example

/packages/shared/
  - src/types/index.ts (types User, Animation, Generation, AIModel)
  - src/constants.ts (constantes statut, providers, rôles)
  - src/index.ts (exports)
  - tsconfig.json
  - package.json
  - dist/ (compilé)
```

**Statistiques** :
- Frontend : ~290 node_modules packages (Next.js + React 19 + deps)
- Backend : ~292 node_modules packages (Fastify + deps)
- Shared : 1 package (typescript uniquement)
- Root : 157 packages (ESLint, Prettier, Concurrently)
