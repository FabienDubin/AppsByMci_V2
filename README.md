# AppsByMCI V2

Plateforme de génération d'animations interactives pilotées par l'IA, permettant aux utilisateurs de créer du contenu visuel dynamique via une interface web intuitive.

## 🚀 Stack Technique

- **Framework** : Next.js 16 (App Router + API Routes + Server Actions)
- **Langage** : TypeScript (mode strict)
- **Base de données** : MongoDB (Mongoose ODM)
- **Stockage** : Azure Blob Storage
- **IA** : OpenAI API, Google AI API
- **Logging** : Pino
- **Validation** : Zod
- **Styling** : Tailwind CSS

## 📋 Prérequis

- Node.js 18.x ou supérieur
- npm ou yarn
- MongoDB local (port 27017) ou accès à Azure Cosmos DB
- Compte Azure pour Blob Storage
- Clés API : OpenAI et Google AI

## 🛠️ Installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd AppsByMCI_V2
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.local.example .env.local
```

Compléter le fichier `.env.local` avec tes clés :
```bash
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/appsbymci_v2?directConnection=true
AZURE_STORAGE_CONNECTION_STRING=<ta-connection-string>
OPENAI_API_KEY=<ta-clé>
GOOGLE_AI_API_KEY=<ta-clé>
```

## 🚦 Développement

**Lancer le serveur de développement**
```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans ton navigateur.

**Build de production**
```bash
npm run build
npm start
```

**Linter**
```bash
npm run lint
```

## 📁 Structure du Projet

```
AppsByMCI_V2/
├── app/                      # Next.js App Router
│   ├── api/                 # API Routes (backend)
│   │   └── health/          # Health check endpoint
│   ├── layout.tsx           # Layout racine
│   └── page.tsx             # Page d'accueil
├── lib/                      # Services, types, utilitaires
│   ├── types.ts             # Types TypeScript partagés
│   └── constants.ts         # Constantes globales
├── models/                   # Schémas Mongoose
├── public/                   # Assets statiques
├── docs/                     # Documentation projet
└── .env.local               # Variables d'environnement (local)
```

## 🔌 API Routes

### GET `/api/health`
Health check de l'application.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T14:30:00.000Z",
  "service": "AppsByMci_v2",
  "version": "1.0.0"
}
```

## 🏗️ Architecture

Ce projet utilise une architecture **Next.js Full-Stack** :
- **Frontend** : Composants React dans `/app`
- **Backend** : API Routes dans `/app/api`
- **Server Actions** : Mutations côté serveur
- **Types partagés** : Centralisés dans `/lib`

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [Documentation Mongoose](https://mongoosejs.com/docs/)
- [Documentation Azure Blob Storage](https://learn.microsoft.com/azure/storage/blobs/)

## 🚢 Déploiement

Le projet sera déployé sur **Azure Web App** (configuration à venir dans les sprints suivants).

## 📝 Méthodologie

Ce projet suit la méthodologie **BMAD** (Build, Measure, Adapt, Document).
Consulter `/docs/` pour la documentation complète des sprints et spécifications techniques.
