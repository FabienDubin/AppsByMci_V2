# AppsByMCI V2

Plateforme d'animation événementielle corporate avec IA générative - Transformez 2-3 jours de développement en 30 minutes de configuration.

## 📁 Structure du Monorepo

```
AppsByMCI_V2/
├── apps/
│   ├── frontend/          # Next.js 16 App Router + React 19
│   └── backend/           # Fastify API + TypeScript
├── packages/
│   └── shared/            # Types, constants, validation partagés
├── docs/                  # Documentation projet
├── .bmad/                 # Configuration BMAD workflows
├── package.json           # Scripts globaux (dev, build, lint)
├── tsconfig.json          # Configuration TypeScript racine
├── .eslintrc.json         # Configuration ESLint
├── .prettierrc            # Configuration Prettier
└── README.md              # Ce fichier
```

## 🚀 Setup Initial

### Prérequis

- **Node.js**: v20.x LTS ou supérieur
- **npm**: v10.x ou supérieur

Vérifier les versions :
```bash
node --version  # devrait afficher v20.x.x
npm --version   # devrait afficher 10.x.x
```

### Installation

1. **Cloner le repository**
```bash
git clone <repo-url>
cd AppsByMCI_V2
```

2. **Installer les dépendances**

Le projet est un **monorepo NPM sans workspaces**. Installation manuelle par package :

```bash
# Installer les outils dev globaux (ESLint, Prettier, Concurrently)
npm install

# Installer les dépendances du frontend
npm install --prefix apps/frontend

# Installer les dépendances du backend
npm install --prefix apps/backend

# Installer les dépendances du package shared
npm install --prefix packages/shared
```

3. **Configurer les variables d'environnement (Backend)**

```bash
cd apps/backend
cp .env.example .env
```

Éditer `.env` avec vos valeurs :
```env
PORT=3001
NODE_ENV=development
```

4. **Builder le package shared**

```bash
npm run build --prefix packages/shared
```

## 🛠️ Développement

### Démarrer les serveurs de développement

**Option 1 : Démarrer frontend + backend ensemble**
```bash
npm run dev
```
- Frontend : http://localhost:3000
- Backend : http://localhost:3001

**Option 2 : Démarrer séparément**
```bash
# Terminal 1 : Frontend
npm run dev:frontend

# Terminal 2 : Backend
npm run dev:backend
```

### Health Check Backend

Vérifier que le backend fonctionne :
```bash
curl http://localhost:3001/health
```

Réponse attendue :
```json
{
  "status": "healthy",
  "timestamp": "2025-11-21T..."
}
```

## 🏗️ Build Production

Builder tous les packages :
```bash
npm run build
```

Cela exécute dans l'ordre :
1. Build du package shared (TypeScript → dist/)
2. Build du frontend (Next.js → .next/)
3. Build du backend (TypeScript → dist/)

## 🧹 Linting & Formatting

### Linter le code
```bash
npm run lint
```

### Formatter le code
```bash
# Formatter automatiquement
npm run format

# Vérifier le formatage (CI)
npm run format:check
```

## 📦 Package Shared

Le package `@appsbymci/shared` contient les types TypeScript, constantes et utilitaires partagés entre frontend et backend.

### Développement local (npm link)

Pour développer en local sans publier :

```bash
# Dans packages/shared
cd packages/shared
npm link

# Dans apps/frontend
cd apps/frontend
npm link @appsbymci/shared

# Dans apps/backend
cd apps/backend
npm link @appsbymci/shared
```

### Rebuild automatique (mode watch)

```bash
cd packages/shared
npm run dev  # watch mode
```

## 🗂️ Technologies Utilisées

### Frontend
- **Next.js 16** : Framework React avec App Router
- **React 19** : Bibliothèque UI
- **TypeScript 5.3+** : Type safety strict
- **Tailwind CSS** : Utility-first CSS framework

### Backend
- **Fastify 5.x** : Framework HTTP performant
- **TypeScript 5.3+** : Type safety strict
- **tsx** : Exécution TypeScript en développement

### Tooling
- **ESLint 8.x** : Linter JavaScript/TypeScript
- **Prettier 3.x** : Code formatter
- **Concurrently** : Exécution parallèle de commandes

## 📝 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarre frontend + backend en parallèle |
| `npm run dev:frontend` | Démarre uniquement le frontend (port 3000) |
| `npm run dev:backend` | Démarre uniquement le backend (port 3001) |
| `npm run build` | Build tous les packages (shared, frontend, backend) |
| `npm run lint` | Lint tout le projet avec ESLint |
| `npm run format` | Formate le code avec Prettier |
| `npm run format:check` | Vérifie le formatage (sans modifier) |

## 🐛 Troubleshooting

### Port déjà utilisé

Si les ports 3000 ou 3001 sont déjà pris :

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erreurs TypeScript après modification du package shared

Rebuild le package shared :
```bash
npm run build --prefix packages/shared
```

### Erreurs "Cannot find module '@appsbymci/shared'"

Vérifier que le package shared est linké :
```bash
cd packages/shared && npm link
cd apps/frontend && npm link @appsbymci/shared
cd apps/backend && npm link @appsbymci/shared
```

## 👤 Auteur

**Fab** - AppsByMCI V2

## 📄 Licence

ISC
