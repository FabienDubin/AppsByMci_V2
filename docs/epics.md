# AppsByMCI_V2 - Epic Breakdown

**Author:** Fab
**Date:** 2025-11-21
**Project Level:** Medium Complexity
**Target Scale:** 100 participants simultanés, 10 animations actives, 10,000 images/an

---

## Overview

Ce document fournit la décomposition complète en épics et stories pour AppsByMCI_V2, transformant les exigences du [PRD](./prd.md) en stories implémentables.

**Living Document Notice:** Ce document intègre les spécifications UX Design et Architecture pour fournir des stories complètes et détaillées prêtes pour l'implémentation Phase 4.

---

## Functional Requirements Inventory

### Gestion des utilisateurs et authentification (FR1-FR5)

**FR1** : Les admins peuvent créer un compte avec email et mot de passe
**FR2** : Les admins peuvent se connecter de manière sécurisée
**FR3** : Les admins peuvent gérer leur profil (email, mot de passe)
**FR4** : Le système maintient les sessions admin entre les visites
**FR5** : Les participants peuvent accéder aux animations sans créer de compte

### Création et configuration d'animations (FR6-FR27)

**FR6** : Les admins peuvent créer une nouvelle animation via un wizard en 8 étapes
**FR7** : Les admins peuvent définir les informations générales d'une animation (nom, description, URL slug)
**FR8** : Les admins peuvent configurer la méthode d'accès (code, validation email, domaine email, ou aucune)
**FR9** : Les admins peuvent définir les champs de collecte de données (selfie, questions, champs texte)
**FR10** : Les admins peuvent ajouter des questions à choix multiple avec options personnalisées
**FR11** : Les admins peuvent ajouter des questions slider avec valeurs min/max et labels
**FR12** : Les admins peuvent générer automatiquement des questions via IA avec une description thématique
**FR13** : Les admins peuvent configurer un pipeline de traitement flexible en réorganisant les blocs (pre-processing, génération IA, post-processing)
**FR14** : Les admins peuvent sélectionner un modèle IA parmi ceux disponibles dans le système
**FR15** : Les admins peuvent construire un prompt IA avec variables dynamiques basées sur les réponses
**FR16** : Les admins peuvent utiliser l'aide IA pour générer le prompt système
**FR17** : Les admins peuvent configurer l'envoi d'emails automatiques avec template personnalisable
**FR18** : Les admins peuvent activer/configurer un écran d'affichage public pour l'animation
**FR19** : Les admins peuvent personnaliser l'apparence de l'animation (couleurs, logo, fond, thème)
**FR20** : Les admins peuvent personnaliser les messages et textes des boutons
**FR21** : Les admins peuvent prévisualiser la configuration avant publication
**FR22** : Les admins peuvent sauvegarder une animation comme brouillon
**FR23** : Les admins peuvent publier une animation pour la rendre accessible
**FR24** : Le système génère automatiquement un QR code pour chaque animation publiée
**FR25** : Les admins peuvent éditer une animation existante
**FR26** : Les admins peuvent dupliquer une animation existante
**FR27** : Les admins peuvent archiver une animation

### Expérience participant (FR28-FR40)

**FR28** : Les participants peuvent accéder à une animation via QR code ou lien direct
**FR29** : Les participants peuvent voir les informations de l'animation (nom, description)
**FR30** : Les participants peuvent compléter les champs de collecte configurés par l'admin
**FR31** : Les participants peuvent uploader un selfie via leur appareil
**FR32** : Les participants peuvent capturer un selfie via webcam
**FR33** : Les participants peuvent répondre aux questions à choix multiple
**FR34** : Les participants peuvent répondre aux questions slider
**FR35** : Les participants peuvent saisir des informations textuelles (nom, prénom, email)
**FR36** : Le système valide l'accès selon la méthode configurée (code, email, domaine)
**FR37** : Le système respecte les limites quotidiennes de soumissions configurées
**FR38** : Les participants reçoivent leur résultat personnalisé après traitement
**FR39** : Les participants peuvent télécharger leur image générée
**FR40** : Les participants peuvent recevoir leur résultat par email automatiquement

### Génération IA et traitement d'images (FR41-FR49)

**FR41** : Le système peut appeler différents modèles IA (OpenAI DALL-E 3, GPT Image 1, Google Imagen 3)
**FR42** : Le système peut générer des images via DALL-E avec un prompt construit dynamiquement
**FR43** : Le système peut éditer des images existantes via modèles d'édition IA
**FR44** : Le système peut générer des images via Google Imagen 3
**FR45** : Le système peut remplacer les variables de prompt par les données collectées
**FR46** : Le système peut appliquer des traitements de pre-processing (crop, resize)
**FR47** : Le système peut appliquer des filtres simples en post-processing
**FR48** : Le système stocke les images générées sur Azure Blob Storage
**FR49** : Le système conserve l'historique de toutes les générations par animation

### Dashboard admin et analytics (FR50-FR61)

**FR50** : Les admins peuvent voir la liste complète de leurs animations
**FR51** : Les admins peuvent filtrer les animations par statut (brouillon, publiée, archivée)
**FR52** : Les admins peuvent accéder aux analytics d'une animation spécifique
**FR53** : Les admins peuvent voir le nombre de participants par animation
**FR54** : Les admins peuvent voir le taux de complétion par animation
**FR55** : Les admins peuvent consulter toutes les générations d'une animation
**FR56** : Les admins peuvent télécharger une image générée individuellement
**FR57** : Les admins peuvent télécharger toutes les images d'une animation en bulk (ZIP)
**FR58** : Les admins peuvent filtrer et rechercher dans les résultats d'une animation
**FR59** : Les admins peuvent accéder directement à l'écran de visualisation publique depuis le dashboard
**FR60** : Les admins peuvent activer/désactiver l'affichage d'une soumission spécifique sur l'écran public (modération)
**FR61** : Par défaut, toutes les soumissions sont affichées sur l'écran public

### Écran de visualisation publique (FR62-FR68)

**FR62** : Le système affiche uniquement les soumissions marquées comme visibles sur l'écran public
**FR63** : L'écran de visualisation peut utiliser un layout masonry avec colonnes configurables
**FR64** : L'écran de visualisation peut afficher ou masquer les noms sur les images
**FR65** : L'écran de visualisation se rafraîchit automatiquement à intervalles configurés
**FR66** : L'écran de visualisation supporte différents styles de défilement (vitesse, direction)
**FR67** : L'écran de visualisation peut appliquer un overlay personnalisé
**FR68** : L'écran de visualisation est accessible via une URL dédiée pour projection

### Email et notifications (FR69-FR73)

**FR69** : Le système peut envoyer des emails automatiques aux participants après génération
**FR70** : Les emails peuvent utiliser un template HTML personnalisable
**FR71** : Les emails peuvent inclure des variables dynamiques (nom, email, imageUrl, etc.)
**FR72** : Les admins peuvent configurer l'expéditeur des emails (nom, adresse)
**FR73** : Le système peut attacher l'image générée aux emails ou inclure un lien

### QR codes et partage (FR74-FR76)

**FR74** : Le système génère automatiquement un QR code pour chaque animation publiée
**FR75** : Les admins peuvent télécharger le QR code depuis le dashboard
**FR76** : Les QR codes redirigent vers l'URL publique de l'animation

### Configuration modèles IA (FR77-FR82)

**FR77** : Le système expose les modèles IA disponibles via API (`GET /api/ai-models`)
**FR78** : Le wizard récupère dynamiquement la liste des modèles IA disponibles
**FR79** : Les modèles IA incluent leurs capacités (requiresImage, supportsEdit, maxSize)
**FR80** : Le système supporte OpenAI DALL-E 3 pour génération text-to-image
**FR81** : Le système supporte OpenAI GPT Image 1 pour édition d'images
**FR82** : Le système supporte Google Imagen 3 pour génération text-to-image

**Total : 82 exigences fonctionnelles**

---

## Structure des Épics - Vue d'Ensemble

Le projet est organisé en **6 épics** qui délivrent chacun une valeur utilisateur concrète et incrémentale.

### Épics Summary

**Epic 1 : Foundation & Infrastructure**
- **Valeur** : Établir les fondations techniques nécessaires pour tout le système
- **Scope** : Setup monorepo, configuration Azure, modèles IA hardcodés, schémas DB
- **Note** : Exception Foundation acceptable pour projet greenfield

**Epic 2 : Authentification & Gestion Utilisateurs**
- **Valeur** : Les admins peuvent créer des comptes, se connecter et accéder au système de manière sécurisée
- **Scope** : Signup, login, JWT, sessions, gestion profil

**Epic 3 : Création d'Animations (Wizard 8 Étapes)**
- **Valeur** : Les admins peuvent créer des animations complètes via le wizard intuitif en 30-45 minutes
- **Scope** : Wizard complet (8 étapes), pipeline drag-and-drop, sauvegarde/publication, génération QR

**Epic 4 : Expérience Participant & Génération IA**
- **Valeur** : Les participants peuvent vivre l'animation, interagir avec l'IA et recevoir leur résultat personnalisé
- **Scope** : Interface participant mobile, collecte données, génération IA, email automatique

**Epic 5 : Dashboard Admin & Gestion des Résultats**
- **Valeur** : Les admins peuvent gérer leurs animations, consulter les analytics et télécharger les résultats
- **Scope** : Dashboard, liste animations, analytics, téléchargement bulk, modération

**Epic 6 : Écran de Visualisation Publique**
- **Valeur** : L'écran public affiche les résultats en temps réel lors des événements pour créer l'effet "wow" collectif
- **Scope** : Écran masonry temps réel, polling, personnalisation affichage

---

## FR Coverage Map

Cette matrice garantit que **chaque FR est couverte** par au moins un epic.

### Epic 1 : Foundation & Infrastructure

**FRs Couvertes :**
- **FR77-FR82** : Configuration modèles IA (OpenAI DALL-E 3, DALL-E Edit, Gemini Imagen)
- **Infrastructure** : Setup nécessaire pour tous les autres FRs (DB, Azure, monorepo)

**Justification :** Aucun FR utilisateur direct, mais fondations essentielles pour le reste.

---

### Epic 2 : Authentification & Gestion Utilisateurs

**FRs Couvertes :**
- **FR1** : Création compte admin avec email/password
- **FR2** : Connexion sécurisée admin
- **FR3** : Gestion profil admin (email, password)
- **FR4** : Maintien sessions admin entre visites (JWT + refresh tokens)
- **FR5** : Accès participants sans compte (implémentation : validation = "none")

**Total : 5 FRs**

---

### Epic 3 : Création d'Animations (Wizard)

**FRs Couvertes :**
- **FR6** : Créer animation via wizard 8 étapes
- **FR7** : Définir infos générales (nom, description, slug)
- **FR8** : Configurer méthode d'accès (code, email, domaine, aucune)
- **FR9** : Définir champs collecte (selfie, questions, texte)
- **FR10** : Ajouter questions choix multiple
- **FR11** : Ajouter questions slider (min/max, labels)
- **FR12** : Générer questions automatiquement via IA
- **FR13** : Configurer pipeline traitement flexible (drag-and-drop)
- **FR14** : Sélectionner modèle IA disponible
- **FR15** : Construire prompt IA avec variables dynamiques
- **FR16** : Aide IA pour générer prompt système
- **FR17** : Configurer envoi emails automatiques
- **FR18** : Activer/configurer écran public
- **FR19** : Personnaliser apparence (couleurs, logo, fond, thème)
- **FR20** : Personnaliser messages et textes boutons
- **FR21** : Prévisualiser configuration avant publication
- **FR22** : Sauvegarder comme brouillon
- **FR23** : Publier animation
- **FR24** : Génération automatique QR code
- **FR25** : Éditer animation existante
- **FR26** : Dupliquer animation
- **FR27** : Archiver animation

**Total : 22 FRs**

---

### Epic 4 : Expérience Participant & Génération IA

**FRs Couvertes :**

**Expérience Participant (FR28-FR40) :**
- **FR28** : Accès via QR code ou lien direct
- **FR29** : Voir infos animation (nom, description)
- **FR30** : Compléter champs collecte configurés
- **FR31** : Upload selfie via appareil
- **FR32** : Capturer selfie via webcam
- **FR33** : Répondre questions choix multiple
- **FR34** : Répondre questions slider
- **FR35** : Saisir infos textuelles (nom, prénom, email)
- **FR36** : Validation accès selon méthode configurée
- **FR37** : Respect limites quotidiennes soumissions
- **FR38** : Réception résultat personnalisé après traitement
- **FR39** : Télécharger image générée
- **FR40** : Recevoir résultat par email automatiquement

**Génération IA (FR41-FR49) :**
- **FR41** : Appeler différents modèles IA (DALL-E, Gemini)
- **FR42** : Générer images DALL-E avec prompt dynamique
- **FR43** : Éditer images existantes via modèles édition IA
- **FR44** : Générer images via Gemini Imagen
- **FR45** : Remplacer variables prompt par données collectées
- **FR46** : Appliquer pre-processing (crop, resize)
- **FR47** : Appliquer filtres post-processing
- **FR48** : Stocker images sur Azure Blob Storage
- **FR49** : Conserver historique générations par animation

**Email (FR69-FR73) :**
- **FR69** : Envoyer emails automatiques après génération
- **FR70** : Templates HTML personnalisables
- **FR71** : Variables dynamiques dans emails
- **FR72** : Configurer expéditeur emails
- **FR73** : Attacher image ou inclure lien dans email

**Total : 27 FRs**

---

### Epic 5 : Dashboard Admin & Gestion Résultats

**FRs Couvertes :**

**Dashboard & Analytics (FR50-FR61) :**
- **FR50** : Voir liste complète animations
- **FR51** : Filtrer animations par statut (brouillon, publiée, archivée)
- **FR52** : Accéder analytics animation spécifique
- **FR53** : Voir nombre participants par animation
- **FR54** : Voir taux complétion par animation
- **FR55** : Consulter toutes générations d'une animation
- **FR56** : Télécharger image générée individuellement
- **FR57** : Télécharger toutes images en bulk (ZIP)
- **FR58** : Filtrer/rechercher dans résultats
- **FR59** : Accéder écran visualisation depuis dashboard
- **FR60** : Activer/désactiver affichage soumission (modération)
- **FR61** : Par défaut, toutes soumissions affichées

**QR Codes (FR74-FR76) :**
- **FR74** : Génération automatique QR code (déjà en Epic 3, mais download ici)
- **FR75** : Télécharger QR code depuis dashboard
- **FR76** : QR codes redirigent vers URL publique

**Total : 15 FRs**

---

### Epic 6 : Écran de Visualisation Publique

**FRs Couvertes :**
- **FR62** : Afficher uniquement soumissions visibles
- **FR63** : Layout masonry avec colonnes configurables
- **FR64** : Afficher/masquer noms sur images
- **FR65** : Rafraîchissement automatique à intervalles configurés
- **FR66** : Styles défilement (vitesse, direction)
- **FR67** : Appliquer overlay personnalisé
- **FR68** : URL dédiée pour projection

**Total : 7 FRs**

---

## Validation Couverture Complète

✅ **Epic 1** : Infra + FR77-82 = 6 FRs (infrastructure)
✅ **Epic 2** : FR1-5 = 5 FRs
✅ **Epic 3** : FR6-27 = 22 FRs
✅ **Epic 4** : FR28-49 + FR69-73 = 27 FRs
✅ **Epic 5** : FR50-61 + FR74-76 = 15 FRs
✅ **Epic 6** : FR62-68 = 7 FRs

**Total couvert : 82 FRs** ✅

Toutes les exigences fonctionnelles du PRD sont couvertes par les 6 épics.

---

## Epic 1 : Foundation & Infrastructure

### Goal

Établir les fondations techniques du projet : monorepo Next.js 16 + Fastify, configuration Azure (Cosmos DB, Blob Storage), modèles IA hardcodés, et schémas de base de données. Cette fondation permet à tous les épics suivants de fonctionner.

**Note :** Exception Foundation acceptable pour projet greenfield.

---

### Story 1.1 : Initialisation du Monorepo et Configuration TypeScript

**En tant que** développeur,
**Je veux** un monorepo structuré avec Next.js 16 (frontend) et Fastify (backend),
**Afin de** développer les deux applications de manière cohérente avec TypeScript strict.

**Acceptance Criteria:**

**Given** un nouveau projet vide
**When** j'initialise le monorepo
**Then** la structure suivante existe :
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

**And** le frontend utilise Next.js 16 avec App Router
**And** le backend utilise Fastify avec TypeScript
**And** TypeScript strict mode est activé dans tous les packages
**And** ESLint + Prettier sont configurés globalement
**And** les scripts `npm run dev:frontend`, `npm run dev:backend` fonctionnent

**Prerequisites:** Aucune

**Technical Notes:**
- Next.js 16 avec App Router (architecture définie)
- Fastify pour performance (voir Architecture section Backend Framework)
- Monorepo NPM sans workspaces (contrainte Azure déploiement)
- TypeScript strict mode requis (NFR17)
- Structure détaillée dans `architecture.md` lignes 317-537

---

### Story 1.2 : Configuration Cosmos DB avec Mongoose

**En tant que** développeur backend,
**Je veux** une connexion Cosmos DB (API MongoDB) fonctionnelle avec Mongoose,
**Afin de** stocker les données dans la base de données Azure.

**Acceptance Criteria:**

**Given** Cosmos DB est provisionné sur Azure
**When** le backend démarre
**Then** la connexion Mongoose vers Cosmos DB réussit
**And** les collections `users`, `animations`, `generations`, `sessions` sont créées
**And** les index définis dans `architecture.md` sont appliqués :
  - `users.email` (unique)
  - `animations.slug` (unique)
  - `animations.userId + status` (compound)
  - `generations.animationId` (index)
  - `sessions.userId` + `expiresAt` (TTL index)

**And** la connection string provient de `process.env.MONGODB_CONNECTION_STRING`
**And** les logs Pino confirment la connexion réussie

**Prerequisites:** Story 1.1

**Technical Notes:**
- Mongoose ODM pour schémas typés (décision Architecture)
- Connection string depuis env variable (NFR7)
- Collections MongoDB définies dans `architecture.md` lignes 1816-2515
- Index critiques pour performance (NFR1, requêtes optimisées)
- TTL index sur `sessions.expiresAt` pour suppression auto refresh tokens expirés

---

### Story 1.3 : Configuration Azure Blob Storage

**En tant que** développeur backend,
**Je veux** une connexion Azure Blob Storage fonctionnelle,
**Afin de** stocker les images générées et les selfies uploadés.

**Acceptance Criteria:**

**Given** Azure Blob Storage est provisionné
**When** le backend démarre
**Then** la connexion au storage réussit via `@azure/storage-blob` SDK
**And** les containers suivants existent :
  - `generated-images` (images IA générées)
  - `uploads` (selfies participants)
  - `qrcodes` (QR codes animations)

**And** le service peut générer des URLs signées (SAS tokens) valides 1 heure
**And** un test d'upload/download fonctionne
**And** la connection string provient de `process.env.AZURE_STORAGE_CONNECTION_STRING`

**Prerequisites:** Story 1.1

**Technical Notes:**
- SDK `@azure/storage-blob` (décision Architecture)
- Naming convention : `{animationId}/{generationId}.png` (voir architecture.md:575-579)
- SAS tokens pour URLs temporaires (NFR6 - sécurité accès ressources)
- Geo-redundancy activé pour backup (NFR10)
- Structure détaillée dans `architecture.md` lignes 573-579

---

### Story 1.4 : Configuration Modèles IA Hardcodés

**En tant que** développeur backend,
**Je veux** les modèles IA (OpenAI DALL-E, Gemini) configurés en TypeScript,
**Afin de** les exposer via l'API `/api/ai-models` pour le wizard admin.

**Acceptance Criteria:**

**Given** le fichier `backend/src/config/ai-models.config.ts` existe
**When** je charge la configuration
**Then** les 3 modèles suivants sont définis :
  - **DALL-E 3** : `dall-e-3`, text-to-image, max 1792x1024px
  - **GPT Image 1** : `gpt-image-1`, image-to-image editing, max 1536x1024px
  - **Imagen 3** : `imagen-3.0-capability-001`, text-to-image, max 1536x1024px

**And** chaque modèle inclut :
```typescript
{
  id: string,
  name: string,
  provider: 'openai' | 'google',
  modelId: string,
  capabilities: {
    requiresImage: boolean,
    supportsEdit: boolean,
    maxImageSize: number
  },
  enabled: boolean
}
```

**And** l'endpoint `GET /api/ai-models` retourne la liste des modèles `enabled: true`
**And** les API keys OpenAI et Google sont lues depuis `process.env`

**Prerequisites:** Story 1.1

**Technical Notes:**
- Modèles hardcodés MVP (FR77-82)
- Structure définie dans `architecture.md` lignes 593-666
- Post-MVP : Collection DB `ai_models` si gestion dynamique requise
- API keys depuis env variables (NFR7 - secrets)
- Route `ai-models.routes.ts` exposera ces modèles

---

### Story 1.5 : Package Shared - Types et Validation

**En tant que** développeur,
**Je veux** un package `shared` avec types TypeScript et schémas Zod partagés,
**Afin de** garantir la cohérence entre frontend et backend.

**Acceptance Criteria:**

**Given** le dossier `packages/shared/` existe
**When** j'importe depuis le package shared
**Then** les types suivants sont disponibles :
  - `Animation`, `CreateAnimationDTO`, `UpdateAnimationDTO`
  - `Generation`, `GenerationResult`, `GenerationStatus`
  - `User`, `UserRole`
  - `AIModel`, `AIModelCapabilities`
  - `APIResponse<T>`, `APIError`

**And** les schémas Zod suivants sont disponibles :
  - `animationSchema.create`, `animationSchema.update`
  - `userSchema.signup`, `userSchema.login`
  - `generationSchema.create`

**And** les constantes suivantes sont disponibles :
  - `ERROR_CODES` (AUTH_1001, VALIDATION_2001, etc.)
  - `API_ROUTES` (/api/animations, /api/generations, etc.)

**And** le package est linkable via `npm link` localement
**And** les imports fonctionnent : `import { Animation } from '@shared/types'`

**Prerequisites:** Story 1.1

**Technical Notes:**
- Types partagés pour cohérence frontend/backend (architecture décision)
- Zod pour validation isomorphique (décision Architecture + PRD)
- ERROR_CODES standardisés dans `architecture.md` lignes 1464-1489
- Structure package shared dans `architecture.md` lignes 492-514
- Sera publié sur Azure Artifacts post-MVP si besoin

---

### Story 1.6 : Logging avec Pino et Configuration Environnement

**En tant que** développeur,
**Je veux** un système de logging structuré avec Pino,
**Afin de** diagnostiquer rapidement les problèmes et monitorer le système.

**Acceptance Criteria:**

**Given** le backend est configuré
**When** un événement métier se produit
**Then** les logs sont émis en JSON structuré :
```json
{
  "level": "info",
  "action": "animation_created",
  "userId": "...",
  "animationId": "...",
  "timestamp": "2025-11-21T10:30:00.000Z",
  "msg": "Animation créée avec succès"
}
```

**And** les niveaux de log suivants sont utilisés :
  - `ERROR` : Erreurs nécessitant attention
  - `WARN` : Situations anormales mais gérées
  - `INFO` : Événements métier importants
  - `DEBUG` : Détails techniques (dev only)

**And** les logs sont envoyés vers Azure Application Insights en production
**And** la configuration environnement est validée au démarrage :
  - Variables requises : `MONGODB_CONNECTION_STRING`, `AZURE_STORAGE_CONNECTION_STRING`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY`, `JWT_SECRET`
  - Le backend refuse de démarrer si une variable manque

**Prerequisites:** Story 1.1

**Technical Notes:**
- Pino pour performance (décision Architecture - ultra rapide, logs structurés JSON)
- Logging strategy définie dans `architecture.md` lignes 184-206
- Azure Application Insights pour monitoring (NFR23-25)
- Validation env config au démarrage évite erreurs runtime (fail fast)
- Fichier `backend/src/config/env.config.ts` valide les variables

---

## Epic 2 : Authentification & Gestion Utilisateurs

### Goal

Les admins peuvent créer un compte, se connecter de manière sécurisée au système, gérer leur profil et maintenir leurs sessions entre les visites. Les participants peuvent accéder aux animations sans créer de compte.

---

### Story 2.1 : Création de Compte Admin (Signup)

**En tant qu'** admin,
**Je veux** créer un compte avec mon email et mot de passe,
**Afin de** pouvoir gérer des animations sur la plateforme.

**Acceptance Criteria:**

**Given** je suis sur la page `/login`
**When** je clique sur "Créer un compte"
**Then** je suis redirigé vers `/signup`

**And** le formulaire contient les champs suivants :
  - Email (type email, validation RFC 5322)
  - Mot de passe (type password, masqué par défaut)
  - Confirmation mot de passe
  - Nom complet (optionnel)

**And** la validation en temps réel affiche :
  - ✅ Email valide : format correct
  - ✅ Mot de passe fort : min 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
  - ✅ Confirmation : les deux mots de passe correspondent
  - ❌ Erreurs affichées en rouge sous le champ concerné

**When** je soumets avec des données valides
**Then** `POST /api/auth/signup` est appelé avec :
```json
{
  "email": "admin@example.com",
  "password": "SecurePass123!",
  "name": "Admin Name"
}
```

**And** le backend :
  - Vérifie que l'email n'existe pas déjà
  - Hash le mot de passe avec bcrypt (10 rounds minimum - NFR4)
  - Crée le document dans `users` collection :
    ```json
    {
      "email": "admin@example.com",
      "passwordHash": "$2b$10$...",
      "name": "Admin Name",
      "role": "admin",
      "createdAt": "2025-11-21T10:00:00Z"
    }
    ```
  - Retourne `{ success: true, data: { userId, email, name } }`

**And** je suis automatiquement connecté (JWT créé)
**And** je suis redirigé vers `/dashboard`
**And** un toast de confirmation apparaît : "Compte créé avec succès"

**Prerequisites:** Story 1.1, 1.2, 1.5 (backend + DB + types)

**Technical Notes:**
- Page : `apps/frontend/app/(auth)/signup/page.tsx`
- Composants : ShadCN Form + Input + Button (UX spec)
- Validation : React Hook Form + Zod schema `userSchema.signup` (shared package)
- Backend : `auth.routes.ts` + `auth.controller.ts` + `auth.service.ts` (architecture Route→Controller→Service)
- Bcrypt min 10 rounds (NFR4)
- Pas de CAPTCHA pour MVP (admin only, pas d'exposition publique)
- Style : Minimal monochrome (UX spec), bouton noir sur blanc

---

### Story 2.2 : Connexion Admin (Login) avec JWT

**En tant qu'** admin,
**Je veux** me connecter avec mon email et mot de passe,
**Afin de** accéder au dashboard et gérer mes animations.

**Acceptance Criteria:**

**Given** je suis sur la page `/login`
**When** je saisis email et mot de passe corrects
**Then** `POST /api/auth/login` est appelé avec :
```json
{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

**And** le backend :
  - Vérifie l'email existe dans `users` collection
  - Compare le mot de passe avec bcrypt
  - Génère un JWT (15 minutes d'expiration) :
    ```json
    {
      "userId": "...",
      "email": "admin@example.com",
      "role": "admin",
      "iat": 1700000000,
      "exp": 1700000900
    }
    ```
  - Génère un refresh token (7 jours), le hash et le stocke dans `sessions` collection
  - Retourne :
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "refresh_token_here",
        "user": { "id": "...", "email": "...", "name": "...", "role": "admin" }
      }
    }
    ```

**And** le frontend :
  - Stocke le JWT en memory (variable React state)
  - Stocke le refresh token en httpOnly cookie (sécurisé)
  - Stocke les infos user dans Zustand `authStore`
  - Redirige vers `/dashboard`

**When** je saisis des identifiants incorrects
**Then** le backend retourne :
```json
{
  "success": false,
  "error": {
    "code": "AUTH_1001",
    "message": "Email ou mot de passe incorrect"
  }
}
```
**And** un message d'erreur s'affiche en rouge sous le formulaire
**And** le champ mot de passe est réinitialisé

**Prerequisites:** Story 2.1

**Technical Notes:**
- JWT custom (décision Architecture - contrôle total, pas NextAuth)
- Structure JWT définie dans `architecture.md` lignes 223-246
- JWT secret depuis `process.env.JWT_SECRET` (NFR7)
- Refresh token haché en DB avec bcrypt (sécurité)
- httpOnly cookie pour refresh token (protection XSS)
- Rate limiting : 5 tentatives/heure/IP (NFR6)
- Logging : tentatives échouées vers `security_events` (monitoring)
- Service : `backend/src/services/auth.service.ts`
- Middleware : `backend/src/middleware/auth.middleware.ts` (vérifie JWT)

---

### Story 2.3 : Auto-Refresh JWT avec Refresh Token

**En tant qu'** admin connecté,
**Je veux** que mon JWT soit automatiquement renouvelé quand il expire,
**Afin de** rester connecté sans avoir à me reconnecter toutes les 15 minutes.

**Acceptance Criteria:**

**Given** je suis connecté et mon JWT expire dans < 2 minutes
**When** je fais une requête API protégée
**Then** le frontend détecte l'expiration imminente
**And** appelle automatiquement `POST /api/auth/refresh` avec le refresh token (depuis cookie httpOnly)

**And** le backend :
  - Vérifie le refresh token existe dans `sessions` collection
  - Vérifie le refresh token n'est pas expiré (< 7 jours)
  - Génère un nouveau JWT (15 minutes)
  - Retourne :
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "new_jwt_here"
      }
    }
    ```

**And** le frontend met à jour le JWT en memory
**And** la requête originale est rejouée avec le nouveau JWT
**And** l'utilisateur ne voit aucune interruption

**When** le refresh token est expiré (> 7 jours)
**Then** le backend retourne :
```json
{
  "success": false,
  "error": {
    "code": "AUTH_1002",
    "message": "Session expirée, veuillez vous reconnecter"
  }
}
```
**And** le frontend déconnecte l'utilisateur
**And** redirige vers `/login` avec message "Session expirée"

**Prerequisites:** Story 2.2

**Technical Notes:**
- Flow auto-refresh défini dans `architecture.md` lignes 238-243
- Interceptor fetch pour détection expiration JWT (vérifier `exp` claim)
- Refresh token stocké en httpOnly cookie = protection XSS
- TTL index MongoDB sur `sessions.expiresAt` supprime automatiquement les tokens expirés
- Service : `auth.service.ts` méthode `refreshAccessToken()`
- Frontend : `lib/api-client.ts` avec interceptor auto-refresh

---

### Story 2.4 : Gestion Profil Admin

**En tant qu'** admin connecté,
**Je veux** modifier mon nom et mon mot de passe,
**Afin de** maintenir mes informations à jour.

**Acceptance Criteria:**

**Given** je suis connecté et sur `/profile`
**When** j'affiche la page profil
**Then** je vois un formulaire avec :
  - Email actuel (affiché en lecture seule, NON modifiable)
  - Nom actuel (modifiable)
  - Section "Changer le mot de passe" (collapsed par défaut)

**When** je modifie mon nom
**And** je clique "Sauvegarder"
**Then** `PUT /api/users/me` est appelé avec :
```json
{
  "name": "Nouveau Nom"
}
```

**And** le backend :
  - Met à jour `users.name` dans la collection
  - Retourne les infos user mises à jour

**And** un toast confirme : "Profil mis à jour avec succès"
**And** le Zustand `authStore` est mis à jour avec le nouveau nom

**When** je clique "Changer le mot de passe"
**Then** la section s'étend et affiche :
  - Mot de passe actuel (requis pour sécurité)
  - Nouveau mot de passe (validation force)
  - Confirmation nouveau mot de passe

**When** je soumets un nouveau mot de passe valide
**Then** `PUT /api/users/me/password` est appelé
**And** le backend :
  - Vérifie le mot de passe actuel avec bcrypt
  - Hash le nouveau mot de passe
  - Met à jour `users.passwordHash`
  - Invalide toutes les sessions existantes (sécurité)
  - Retourne succès

**And** je suis déconnecté automatiquement
**And** redirigé vers `/login` avec message "Mot de passe changé, reconnectez-vous"

**Prerequisites:** Story 2.2

**Technical Notes:**
- Page : `apps/frontend/app/(admin)/profile/page.tsx`
- Layout admin avec sidebar (UX spec)
- **Email NON modifiable** : affiché en lecture seule (disabled input ou texte statique)
- Validation password : identique à signup (min 8 chars, 1 majuscule, 1 chiffre, 1 spécial)
- Invalidation sessions : supprime toutes les entrées `sessions` pour cet userId (sécurité après changement password)
- Service : `users.service.ts` (pas auth.service car concerne le profil user)
- Route : `users.routes.ts` avec middleware auth
- L'email sert d'identifiant unique permanent (pas de risque de collision si changement)

---

### Story 2.5 : Déconnexion et Invalidation Session

**En tant qu'** admin connecté,
**Je veux** me déconnecter proprement,
**Afin de** sécuriser mon compte quand je quitte l'application.

**Acceptance Criteria:**

**Given** je suis connecté
**When** je clique sur "Déconnexion" dans la sidebar
**Then** `POST /api/auth/logout` est appelé

**And** le backend :
  - Récupère le refresh token depuis le cookie httpOnly
  - Supprime l'entrée correspondante dans `sessions` collection
  - Retourne `{ success: true }`

**And** le frontend :
  - Supprime le JWT de la memory
  - Supprime le cookie refresh token
  - Clear le Zustand `authStore`
  - Redirige vers `/login`

**And** un toast confirme : "Déconnexion réussie"

**When** j'essaie d'accéder à une page protégée après déconnexion
**Then** je suis automatiquement redirigé vers `/login`
**And** un message s'affiche : "Veuillez vous connecter"

**Prerequisites:** Story 2.2

**Technical Notes:**
- Bouton déconnexion dans Sidebar admin (UX spec - `components/admin/Sidebar.tsx`)
- Invalidation côté serveur du refresh token (sécurité)
- Clear complet côté client (JWT + cookie + store)
- Middleware Next.js vérifie JWT sur routes `(admin)/*`
- Service : `auth.service.ts` méthode `logout()`

---

### Story 2.6 : Accès Participants Sans Compte

**En tant que** participant,
**Je veux** accéder à une animation sans créer de compte,
**Afin de** compléter l'animation rapidement lors d'un événement.

**Acceptance Criteria:**

**Given** une animation publiée avec `accessConfig.type = 'none'`
**When** je scanne le QR code ou clique le lien `/a/avatar-tech-2025`
**Then** je suis redirigé directement vers la page animation
**And** aucun formulaire de login/signup n'apparaît
**And** je vois le formulaire de collecte avec les champs configurés par l'admin
**And** je peux immédiatement commencer à remplir les informations
**And** aucune validation d'accès n'est effectuée (accès libre)

**Given** une animation avec `accessConfig.type = 'code'`
**When** j'accède à `/a/avatar-tech-2025`
**Then** je vois la page animation avec son formulaire
**And** le formulaire inclut un champ supplémentaire "Code d'accès" en premier (avant les autres champs)

**When** je remplis tous les champs (y compris le code d'accès)
**And** je clique "Soumettre"
**Then** `POST /api/generations` est appelé avec le code d'accès dans le payload

**And** le backend vérifie :
  - Le code d'accès correspond à `animation.accessConfig.code`

**When** le code est incorrect
**Then** le backend retourne :
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_2001",
    "message": "Code d'accès incorrect"
  }
}
```
**And** le frontend affiche l'erreur sous le champ "Code d'accès"
**And** je reste sur le formulaire (pas de passage à l'étape suivante)

**When** le code est correct
**Then** la validation d'accès passe
**And** la soumission continue normalement (génération IA lancée)

**Given** une animation avec `accessConfig.type = 'email-domain'` (ex: `@company.com`)
**And** le formulaire inclut un champ "Email" (ajouté par l'admin dans Step 3 - collecte inputs)
**When** je soumets avec un email du bon domaine (`user@company.com`)
**Then** le backend vérifie le domaine de l'email
**And** la validation d'accès passe
**And** la génération continue normalement

**When** je soumets avec un email d'un autre domaine (`user@other.com`)
**Then** le backend retourne :
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_2001",
    "message": "Email non autorisé pour cet événement (domaine @company.com requis)"
  }
}
```
**And** le frontend affiche l'erreur sous le champ email
**And** je reste sur le formulaire

**Given** une animation avec validation d'accès par code ET champ email collecté
**When** je soumets le formulaire
**Then** le backend vérifie DEUX choses :
  1. Le code d'accès est correct (validation d'accès)
  2. L'email est valide (format basique, aucune vérification domaine)
**And** l'email est stocké pour envoi résultat ultérieur (FR40)

**Prerequisites:** Story 2.2 (pour comprendre la logique auth)

**Technical Notes:**
- Participants = PAS d'authentification JWT (accès public)
- **Pas de modal bloquant** : la validation se fait à la soumission du formulaire
- **3 types de validation d'accès** : none, code, email-domain
- Validation accès implémentée côté frontend (UX) ET backend (sécurité - FR36)
- Page : `apps/frontend/app/a/[slug]/page.tsx`
- Le champ "Code d'accès" est ajouté dynamiquement au formulaire SI `accessConfig.type = 'code'`
- Backend vérifie à la soumission dans `generations.controller.ts` AVANT de lancer la génération IA
- Rate limiting sur soumissions : limite quotidienne par animation (FR37)
- Pas de compte user créé pour participants (anonyme)
- Le code d'accès est vérifié mais PAS stocké dans `generations` collection (privacy)
- L'email (si collecté) est stocké dans `generations.participantEmail` pour envoi résultat (FR40)

---

## Epic 3 : Création d'Animations (Wizard 8 Étapes)

### Goal

Les admins peuvent créer des animations complètes en 30-45 minutes via un wizard intuitif en 8 étapes. Le wizard permet de configurer tous les aspects de l'animation : collecte de données, pipeline de traitement IA, emails, écran public, et personnalisation visuelle. À la fin, l'animation est publiée et un QR code est généré automatiquement.

**Note :** Cet epic couvre 22 FRs - c'est le cœur du produit MVP.

---

### Story 3.1 : Structure du Wizard et Navigation (8 étapes)

**En tant qu'** admin,
**Je veux** naviguer facilement entre les 8 étapes du wizard,
**Afin de** créer une animation de manière guidée et structurée.

**Acceptance Criteria:**

**Given** je suis connecté et j'accède à `/dashboard/animations/new`
**When** la page se charge
**Then** je vois le composant `WizardStepper` affichant :
  - Indicateur de progression : "Étape 1/8"
  - Titres des 8 étapes :
    1. Informations générales
    2. Configuration d'accès
    3. Collecte d'inputs
    4. Pipeline de traitement
    5. Configuration email
    6. Écran public
    7. Personnalisation
    8. Récapitulatif & Publication
  - L'étape actuelle (1) est mise en évidence (couleur noire - UX spec)
  - Les étapes futures sont en gris clair
  - Les étapes complétées auront une coche verte

**And** je vois le contenu de l'étape 1 (formulaire Informations générales)
**And** un bouton "Suivant" en bas à droite (bouton noir - UX spec)
**And** pas de bouton "Précédent" (car étape 1)

**When** je clique "Suivant" après avoir rempli l'étape 1
**Then** je passe à l'étape 2
**And** l'indicateur affiche "Étape 2/8"
**And** l'étape 1 affiche une coche verte (complétée)
**And** je vois maintenant le bouton "Précédent" (bouton gris secondaire)

**When** je clique "Précédent"
**Then** je retourne à l'étape 1
**And** les données que j'avais saisies sont toujours présentes (sauvegarde auto)

**When** je ferme le navigateur et reviens sur `/dashboard/animations/new`
**Then** je repars de l'étape 1
**And** les données précédentes sont perdues (pas de persistence entre sessions - MVP)

**Prerequisites:** Story 2.2 (authentification admin)

**Technical Notes:**
- Composant : `components/wizard/WizardStepper.tsx` (UX spec)
- State management : Zustand store `wizardStore.ts` avec :
  ```typescript
  {
    currentStep: number,
    animationData: Partial<Animation>,
    setStep: (step: number) => void,
    nextStep: () => void,
    prevStep: () => void,
    updateData: (data: Partial<Animation>) => void
  }
  ```
- Navigation bloquée si validation échoue (React Hook Form + Zod)
- Composants steps : `components/wizard/steps/Step1GeneralInfo.tsx` ... `Step8Summary.tsx`
- Layout : `app/(admin)/animations/new/page.tsx`
- Style : Minimal monochrome (UX spec), bouton primaire noir, secondaire gris
- Pas de sauvegarde auto backend dans le MVP (sauvegarde uniquement au brouillon ou publication finale)

---

### Story 3.2 : Step 1 - Informations Générales

**En tant qu'** admin,
**Je veux** définir les informations de base de mon animation,
**Afin de** l'identifier et la décrire clairement.

**Acceptance Criteria:**

**Given** je suis sur l'étape 1 du wizard
**When** j'affiche le formulaire
**Then** je vois les champs suivants :
  - **Nom de l'animation** (texte, requis, max 100 caractères)
    - Placeholder : "Ex: Avatar IA - Événement Tech 2025"
  - **Description** (textarea, optionnel, max 500 caractères)
    - Placeholder : "Décris brièvement l'animation pour les participants"
  - **URL Slug** (texte, requis, format kebab-case)
    - Placeholder : "avatar-tech-2025"
    - Help text : "Cette URL sera utilisée pour le lien d'accès : /a/votre-slug"
    - Auto-génération : Si vide, généré automatiquement depuis le nom

**When** je saisis "Avatar IA - Tech 2025" dans le champ Nom
**And** le champ Slug est vide
**Then** le Slug est auto-rempli avec "avatar-ia-tech-2025" (conversion kebab-case)

**When** je modifie manuellement le Slug
**Then** l'auto-génération s'arrête (l'utilisateur a pris le contrôle)

**When** je clique "Suivant" avec tous les champs valides
**Then** les données sont stockées dans `wizardStore.animationData`
**And** je passe à l'étape 2

**When** je clique "Suivant" avec le champ Nom vide
**Then** une erreur s'affiche en rouge sous le champ : "Le nom est requis"
**And** je reste sur l'étape 1

**When** je saisis un Slug avec des caractères invalides (espaces, majuscules, accents)
**Then** une erreur s'affiche : "Format invalide. Utilisez uniquement : a-z, 0-9, tirets"

**Prerequisites:** Story 3.1

**Technical Notes:**
- Composant : `components/wizard/steps/Step1GeneralInfo.tsx`
- Validation : Zod schema `animationSchema.step1` depuis `@shared/validation`
- Auto-génération slug : Fonction `generateSlug(name)` côté frontend (lowercase, replace spaces with `-`, remove special chars)
- React Hook Form pour gestion formulaire
- ShadCN Input + Textarea (UX spec)
- Validation temps réel (blur) pour UX immédiate
- Le slug ne sera vérifié pour unicité qu'à la publication finale (Story 3.9)

---

### Story 3.3 : Step 2 - Validation d'Accès + Champs de Base

**En tant qu'** admin,
**Je veux** configurer la validation d'accès ET les champs de base à collecter,
**Afin de** contrôler qui peut participer et identifier les participants.

**Acceptance Criteria:**

**Given** je suis sur l'étape 2 du wizard
**When** j'affiche le formulaire
**Then** je vois deux sections :

**Section 1 : Validation d'Accès**

Un select "Type de validation d'accès" avec 3 options :
  - **Aucune** : Accès libre pour tous
  - **Code d'accès** : Les participants doivent saisir un code valide
  - **Domaine email** : Seuls les emails d'un domaine spécifique sont autorisés

**And** par défaut, "Aucune" est sélectionné

**When** je sélectionne "Code d'accès"
**Then** un champ "Code d'accès" apparaît (texte, requis)
**And** placeholder : "TECH2025"
**And** help text : "Ce code sera demandé sur le premier écran du formulaire participant"

**When** je sélectionne "Domaine email"
**Then** un champ "Domaines autorisés" apparaît (texte, requis)
**And** placeholder : "@company.com, @partner.com"
**And** help text : "Seuls les emails de ces domaines seront autorisés. Séparez plusieurs domaines par des virgules. Nécessite que le champ Email soit activé ci-dessous."
**And** validation format : chaque domaine doit commencer par "@"
**And** exemple valide : "@company.com, @partner.fr, @client.org"

**Section 2 : Champs de Base (Écran 1 Participant)**

Un help text s'affiche :
  - "Ces champs seront présentés sur le premier écran du formulaire participant (avec le code d'accès si activé)"

**Then** je vois 3 champs de base configurables :

1. **Nom** :
   - Toggle activé/désactivé (défaut : ☑ Oui)
   - Champ "Label affiché" : texte éditable (défaut : "Nom")
   - Champ "Placeholder" : texte éditable (défaut : "Ex: Jean Dupont")
   - Toggle "Requis" (défaut : ☑ Oui si activé)

2. **Prénom** :
   - Toggle activé/désactivé (défaut : ☐ Non)
   - Champ "Label affiché" : texte éditable (défaut : "Prénom")
   - Champ "Placeholder" : texte éditable (défaut : "Ex: Marie")
   - Toggle "Requis" (défaut : ☑ Oui si activé)

3. **Email** :
   - Toggle activé/désactivé (défaut : ☐ Non)
   - Champ "Label affiché" : texte éditable (défaut : "Email")
   - Champ "Placeholder" : texte éditable (défaut : "exemple@email.com")
   - Toggle "Requis" (défaut : ☑ Oui si activé)
   - Help text : "L'email sera utilisé pour envoyer le résultat au participant (si emails activés dans Step 5)"

**When** j'active le toggle "Nom"
**Then** les champs "Label affiché", "Placeholder" et "Requis" deviennent éditables

**When** je modifie le label "Nom" en "Votre pseudo"
**And** je modifie le placeholder en "Ex: SuperCoder42"
**Then** les modifications sont sauvegardées
**And** les participants verront le label "Votre pseudo" et le placeholder "Ex: SuperCoder42" sur le formulaire

**When** j'active le toggle "Email"
**Then** un help text apparaît : "L'email sera utilisé pour envoyer le résultat au participant (si emails activés dans Step 5)"

**When** je sélectionne validation "Domaine email" MAIS le toggle "Email" est désactivé
**Then** une alerte s'affiche : "⚠️ Vous devez activer le champ Email pour valider par domaine"
**And** le toggle "Email" passe automatiquement à activé

**When** je clique "Suivant" avec une configuration valide
**Then** les données sont stockées :
```typescript
{
  accessConfig: {
    type: 'none' | 'code' | 'email-domain',
    code?: string,              // Requis si type='code'
    emailDomains?: string[]     // Requis si type='email-domain', parsé depuis CSV
  },
  baseFields: {
    name: {
      enabled: boolean,
      required: boolean,
      label: string,            // Label personnalisable (défaut: "Nom")
      placeholder: string       // Placeholder personnalisable (défaut: "Ex: Jean Dupont")
    },
    firstName: {
      enabled: boolean,
      required: boolean,
      label: string,            // Label personnalisable (défaut: "Prénom")
      placeholder: string       // Placeholder personnalisable (défaut: "Ex: Marie")
    },
    email: {
      enabled: boolean,
      required: boolean,
      label: string,            // Label personnalisable (défaut: "Email")
      placeholder: string       // Placeholder personnalisable (défaut: "exemple@email.com")
    }
  }
}
```
**And** je passe à l'étape 3

**Prerequisites:** Story 3.2

**Technical Notes:**
- Composant : `components/wizard/steps/Step2AccessAndBaseFields.tsx`
- **3 types de validation** : none, code, email-domain
- **Champs de base personnalisables** : nom, prénom, email (seront sur écran 1 participant)
- **Labels ET placeholders éditables** : L'admin peut personnaliser le texte affiché ET l'exemple (ex: "Nom" → "Votre pseudo", placeholder "Ex: SuperCoder42")
- **Domaines multiples** : Support de plusieurs domaines séparés par virgules (ex: "@company.com, @partner.fr")
- Validation : Schema Zod conditionnel :
  - Si type='code' → code requis
  - Si type='email-domain' → emailDomains[] requis (parsé depuis CSV) ET baseFields.email.enabled=true
  - Labels max 50 caractères, Placeholders max 100 caractères
  - Parse CSV domaines : `split(',').map(d => d.trim())` puis validation format "@xxx"
- ShadCN Select + Toggle + Input conditionnels (UX spec)
- Configuration correspond au data model `architecture.md` lignes 1878-1900
- **Ces champs seront affichés sur l'ÉCRAN 1 du wizard participant** (Story 2.6)
- **Les éléments avancés seront sur les ÉCRANS 2+** (Story 3.4) - un élément = un écran
- **Wizard participant** : Écran 1 (champs de base) → Écran 2 (élément 1) → Écran 3 (élément 2) → etc. → Soumission
- Les labels personnalisés seront utilisés dans les variables du prompt IA (Story 3.6)
- Backend vérifie email contre TOUS les domaines autorisés (OR logic)
- Composant participant : `components/participant/StepWizard.tsx` avec indicateur de progression (étape X/Y)

---

### Story 3.4 : Step 3 - Collecte d'Inputs Avancés (Écrans 2+ Participant)

**En tant qu'** admin,
**Je veux** définir les inputs avancés à collecter (selfie et questions thématiques) et leur ordre,
**Afin de** personnaliser la génération IA et l'expérience utilisateur.

**Acceptance Criteria:**

**Given** je suis sur l'étape 3 du wizard
**When** j'affiche le formulaire
**Then** un help text s'affiche :
  - "Ces éléments seront présentés aux participants sous forme de wizard (un élément = un écran). L'ordre défini ici détermine l'ordre des écrans. Exemple : Écran 1 (champs de base) → Écran 2 (Selfie) → Écran 3 (Question 1) → Écran 4 (Question 2) → Soumission."

**And** je vois :
  - Section **"Éléments de collecte"** vide par défaut (liste draggable)
  - Bouton "+ Ajouter un élément" (bouton secondaire gris)
  - Bouton "✨ Générer avec IA" (bouton avec accent violet - UX spec)

**When** je clique "+ Ajouter un élément"
**Then** un modal s'ouvre avec les options :
  - **📸 Selfie** (capture ou upload photo)
  - **☑️ Question choix multiple**
  - **📊 Question slider** (échelle de valeurs)
  - **✍️ Réponse libre** (texte libre avec limite)

**When** je sélectionne "📸 Selfie"
**Then** le selfie est ajouté à la liste (un seul selfie maximum autorisé)
**And** le bloc affiche :
  - Icône 📸
  - Titre "Selfie"
  - Help text : "Upload ou capture via webcam"
  - Drag handle pour réordonner
  - Bouton "🗑️ Supprimer"

**When** je sélectionne "☑️ Question choix multiple"
**Then** un formulaire apparaît :
  - Question (requis)
  - Liste d'options (min 2, max 6)
  - Bouton "+ Ajouter une option"
  - Requis (toggle, défaut Oui)

**When** je sauvegarde
**Then** la question est ajoutée à la liste avec :
  - Icône type (☑️)
  - Question
  - Aperçu options (ex: "4 options")
  - Badge "Requis" si applicable
  - Drag handle pour réordonner
  - Actions : Éditer, Supprimer

**When** je sélectionne "📊 Question slider"
**Then** un formulaire apparaît :
  - Question (requis)
  - Valeur min (nombre, défaut 0)
  - Valeur max (nombre, défaut 10)
  - Labels optionnels (ex: min="Pas du tout", max="Totalement")
  - Requis (toggle, défaut Oui)

**When** je sauvegarde
**Then** la question est ajoutée à la liste avec :
  - Icône type (📊)
  - Question
  - Aperçu range (ex: "0-10")
  - Badge "Requis" si applicable
  - Drag handle pour réordonner
  - Actions : Éditer, Supprimer

**When** je sélectionne "✍️ Réponse libre"
**Then** un formulaire apparaît :
  - Question (requis)
  - Limite de caractères (nombre, défaut 500, min 50, max 2000)
  - Placeholder (optionnel)
  - Requis (toggle, défaut Oui)

**When** je sauvegarde
**Then** la question est ajoutée à la liste avec :
  - Icône type (✍️)
  - Question
  - Aperçu limite (ex: "max 500 caractères")
  - Badge "Requis" si applicable
  - Drag handle pour réordonner
  - Actions : Éditer, Supprimer

**When** j'ai ajouté plusieurs éléments (selfie + questions)
**Then** je peux les réordonner par drag-and-drop
**And** l'ordre défini détermine l'ordre des écrans du wizard participant
**And** exemple flow participant :
  - **Écran 1** : Champs de base (nom, email, code)
  - **Écran 2** : Selfie (si positionné en 1er)
  - **Écran 3** : Question 1 (choix multiple)
  - **Écran 4** : Question 2 (slider)
  - **Écran 5** : Attente + Résultat
**And** OU si réordonné : Écran 1 (champs de base) → Écran 2 (Question 1) → Écran 3 (Selfie) → Écran 4 (Question 2) → Soumission

**When** je clique "Suivant"
**Then** la config est sauvegardée :
```typescript
{
  inputCollection: {
    elements: [
      {
        id: string,
        type: 'selfie' | 'choice' | 'slider' | 'free-text',
        order: number,              // Défini par drag-and-drop
        // Si type='selfie'
        // (pas de champs supplémentaires)

        // Si type='choice' | 'slider' | 'free-text'
        question?: string,
        required?: boolean,
        options?: string[],         // Si type='choice'
        min?: number,               // Si type='slider'
        max?: number,
        minLabel?: string,
        maxLabel?: string,
        maxLength?: number,         // Si type='free-text' (50-2000)
        placeholder?: string        // Si type='free-text'
      }
    ]
  }
}
```

**Prerequisites:** Story 3.3

**Technical Notes:**
- Composant : `components/wizard/steps/Step3AdvancedInputs.tsx`
- **4 types d'éléments** : selfie, choix multiple, slider, réponse libre
- **Selfie draggable** : Le selfie n'est plus un toggle séparé, mais un élément de la liste (max 1 selfie)
- **Wizard multi-écrans participant** : CHAQUE élément = UN écran distinct dans le wizard participant
  - Écran 1 : Champs de base (Step 2 admin)
  - Écrans 2+ : Un écran par élément (ordre drag-and-drop)
  - Dernier écran : Attente + Résultat
- **Ordre personnalisable** : L'ordre défini par drag-and-drop détermine l'ordre des écrans du wizard
- Navigation participant : Bouton "Suivant" entre chaque écran, "Soumettre" sur le dernier
- Drag-and-drop : `@dnd-kit` (PRD + Architecture décision)
- Modal : ShadCN Dialog pour ajout/édition éléments
- Génération IA (Story 3.5) sera un bouton séparé
- Types correspondent au data model `architecture.md` lignes 1887-1900
- ShadCN Toggle, Input, Select, Textarea (UX spec)
- Ces questions servent à personnaliser le prompt IA (variables dynamiques dans Story 3.6)
- Type "free-text" nouveau pour réponses ouvertes (ex: "Décris ton superpouvoir idéal")
- Composant participant : `components/participant/StepWizard.tsx` avec state management Zustand

---

### Story 3.5 : Step 3 - Génération IA des Questions

**En tant qu'** admin,
**Je veux** générer automatiquement des questions pertinentes via IA,
**Afin de** gagner du temps dans la configuration de l'animation.

**Acceptance Criteria:**

**Given** je suis sur l'étape 3 du wizard
**When** je clique "✨ Générer avec IA"
**Then** un modal s'ouvre avec :
  - **Description thématique** (textarea, requis)
    - Placeholder : "Décris le thème et l'objectif de ton animation. Ex: Animation pour événement tech, profil geek, collecte préférences technologiques"
  - **Nombre de questions** (slider, 2-6, défaut 3)
  - **Types de questions** (checkboxes multiples) :
    - ☐ Champs texte (nom, prénom, etc.)
    - ☑ Choix multiples
    - ☐ Sliders
  - Bouton "Générer" (primaire noir)

**When** je saisis une description et clique "Générer"
**Then** `POST /api/ai/generate-questions` est appelé avec :
```json
{
  "description": "Animation pour événement tech, profil geek...",
  "count": 3,
  "types": ["choice"]
}
```

**And** un loader apparaît : "L'IA génère vos questions..." (spinner - UX spec)

**And** le backend :
  - Utilise OpenAI GPT-4 avec un meta-prompt
  - Génère les questions structurées en JSON
  - Retourne :
    ```json
    {
      "success": true,
      "data": {
        "questions": [
          {
            "type": "choice",
            "label": "Quel est ton langage de programmation préféré ?",
            "options": ["JavaScript", "Python", "Go", "Rust"],
            "required": true
          },
          ...
        ]
      }
    }
    ```

**When** la génération réussit
**Then** le modal affiche les questions générées
**And** chaque question est éditable inline
**And** je peux supprimer des questions individuellement
**And** je peux régénérer (bouton "🔄 Régénérer")

**When** je clique "Utiliser ces questions"
**Then** les questions sont ajoutées à la liste existante (pas de remplacement)
**And** le modal se ferme
**And** je vois les nouvelles questions dans la liste avec badge "✨ Généré par IA"

**When** la génération échoue (erreur API OpenAI)
**Then** un message d'erreur s'affiche : "Erreur lors de la génération. Veuillez réessayer."
**And** je peux retenter

**Prerequisites:** Story 3.4

**Technical Notes:**
- Feature clé différenciatrice (PRD FR12)
- Backend : `POST /api/ai/generate-questions` dans `ai-generation.routes.ts`
- Service : `openai.service.ts` méthode `generateQuestions()`
- Meta-prompt OpenAI stocké dans `backend/src/config/ai-prompts.ts`
- Timeout 30 secondes max (NFR2)
- Retry 2x si échec temporaire (architecture retry strategy)
- Modal : ShadCN Dialog avec textarea + sliders
- Les questions générées sont 100% éditables (l'admin garde le contrôle)

---

### Story 3.6 : Step 4 - Pipeline de Traitement (Blocs Drag-and-Drop)

**En tant qu'** admin,
**Je veux** composer un pipeline de traitement flexible avec des blocs,
**Afin de** définir comment l'image du participant sera transformée par l'IA.

**Acceptance Criteria:**

**Given** je suis sur l'étape 4 du wizard
**When** j'affiche la page
**Then** je vois deux zones :
  - **Bibliothèque de blocs** (gauche) :
    - Section "Pre-processing" avec bloc "Crop & Resize"
    - Section "IA Generation" avec bloc "IA Generation"
    - Section "Post-processing" avec bloc "Filtres"
  - **Canvas pipeline** (droite) : zone de drop vide avec message "Glissez des blocs ici pour construire votre pipeline"

**When** je drag un bloc "Crop & Resize" de la bibliothèque vers le canvas
**Then** le bloc apparaît dans le canvas
**And** le bloc affiche :
  - Icône type (✂️)
  - Titre "Crop & Resize"
  - Badge "Pre-processing" (gris)
  - Bouton "⚙️ Configurer"
  - Handle de drag pour réordonner
  - Bouton "🗑️ Supprimer"

**When** je clique "⚙️ Configurer" sur le bloc Crop & Resize
**Then** un modal s'ouvre avec :
  - **Format** : Select (square, 16:9, 4:3, original)
  - **Dimensions** : Input (ex: 512, 1024)
**When** je sauvegarde la config
**Then** le bloc affiche "Configuré" (badge vert)

**When** je drag un bloc "IA Generation" dans le canvas
**Then** le bloc apparaît avec badge "IA Generation" (violet - UX accent IA)
**When** je clique "⚙️ Configurer"
**Then** un modal s'ouvre avec :
  - **Modèle IA** : Select avec les options disponibles
    - DALL-E 3 (text-to-image, max 1792x1024px)
    - GPT Image 1 (image editing, max 1536x1024px)
    - Imagen 3 (text-to-image, max 1536x1024px)
  - **Prompt template** : Textarea avec variables disponibles (actif après sélection modèle)
    - Help text : "Variables disponibles : {nom}, {prenom}, {email}, {question1}, {question2}, etc. Note : le selfie est passé comme fichier image, pas comme variable texte."
    - Placeholder : "Create a futuristic portrait of {nom} in {question1} style"
  - Bouton "✨ Générer le prompt avec IA"

**When** je sélectionne "GPT Image 1"
**Then** un help text apparaît : "⚠️ Ce modèle nécessite une image source. Assurez-vous qu'un selfie est collecté ou qu'un bloc IA image précède."

**When** je clique "✨ Générer le prompt avec IA"
**Then** un modal secondaire s'ouvre :
  - "Décris l'image que tu veux générer"
  - Textarea
**When** je soumets
**Then** l'IA génère un prompt optimisé
**And** le prompt est inséré dans le champ "Prompt template"

**When** j'ai plusieurs blocs dans le canvas
**Then** je peux les réordonner par drag-and-drop
**And** l'ordre définit le flow : Bloc 1 → Bloc 2 → Bloc 3
**And** des lignes de connexion visuelles relient les blocs (UX spec)

**When** j'ai ajouté 4 blocs IA et tente d'en ajouter un 5ème
**Then** un message s'affiche : "⚠️ Maximum 4 blocs IA autorisés"
**And** le bloc ne peut pas être ajouté

**When** je clique "Suivant" avec un pipeline contenant 2 blocs IA consécutifs
**Then** une validation intelligente s'effectue :
  - Si Bloc 2 = DALL-E Edit après Bloc 1 = DALL-E 3 → ✅ OK (utilise image générée par Bloc 1)
  - Si Bloc 2 = DALL-E 3 après Bloc 1 = DALL-E Edit → ℹ️ Info : "DALL-E 3 va générer une nouvelle image. L'image du bloc 1 sera ignorée."

**When** je clique "Suivant" sans aucun bloc IA (juste pre/post-processing)
**Then** aucune erreur (pipeline valide sans IA)
**And** un warning s'affiche : "⚠️ Aucun bloc IA dans le pipeline. Les participants recevront leur image traitée uniquement."

**When** je clique "Suivant" avec un pipeline valide
**Then** la config est sauvegardée :
```typescript
{
  pipeline: [
    {
      id: string,
      type: 'preprocessing' | 'ai-generation' | 'postprocessing',
      order: number,
      config: {
        modelId?: string,
        promptTemplate?: string,
        imageTransform?: { format, dimensions }
      }
    }
  ]
}
```

**Prerequisites:** Story 3.5

**Technical Notes:**
- Composant clé : `components/pipeline/PipelineCanvas.tsx` (UX spec)
- Drag-and-drop : `@dnd-kit` (architecture décision)
- Composants : `BlockCard.tsx`, `BlockLibrary.tsx`, `ConnectionLine.tsx`
- **UN SEUL bloc "IA Generation"** dans la bibliothèque (pas un bloc par modèle)
- Liste modèles IA depuis `GET /api/ai-models` (Story 1.4) → utilisée dans le select du modal config
- **Chaînage de blocs IA** : Support de 0 à 4 blocs IA dans le pipeline
  - 0 blocs IA = Pipeline processing uniquement (selfie → crop → filtres → résultat)
  - 1-4 blocs IA = Chaînage séquentiel (output bloc N = input bloc N+1)
- Variables prompt générées dynamiquement depuis `baseFields` + `inputCollection.elements`
- Variables disponibles : {nom}, {prenom}, {email}, {question1}, {question2} (selfie n'est PAS une variable texte)
- **Validation intelligente** :
  - DALL-E Edit nécessite une image source (selfie OU résultat bloc IA précédent)
  - DALL-E 3/Gemini ignorent l'image précédente (génération from scratch)
  - Warning si DALL-E 3 après un autre bloc IA (perte de l'image précédente)
- **MVP : Image uniquement** (pas de génération texte, voir Story 3.6B pour post-MVP)
- Backend executor : Itère sur pipeline, passe output de bloc N à input de bloc N+1
- Data model pipeline : `architecture.md` lignes 1902-1916
- Cette story est complexe - feature différenciatrice clé du produit

---

### Story 3.6B : Pipeline Avancé - IA Text + Compositing (POST-MVP)

**En tant qu'** admin,
**Je veux** ajouter des blocs de génération de texte IA et de compositing sur templates,
**Afin de** créer des outputs complexes (ex: cartes Pokémon avec image + texte généré par IA).

**Acceptance Criteria:**

**Given** je suis sur l'étape 4 du wizard (post-MVP)
**When** j'affiche la bibliothèque de blocs
**Then** je vois 2 nouveaux types de blocs :
  - Section "IA Generation" :
    - **IA Image Generation** (ex-bloc "IA Generation" renommé)
    - **IA Text Generation** (NOUVEAU)
  - Section "Compositing" (NOUVELLE) :
    - **Template Overlay**

**When** je drag un bloc "IA Text Generation" dans le canvas
**Then** le bloc apparaît avec badge "IA Text" (bleu)
**When** je clique "⚙️ Configurer"
**Then** un modal s'ouvre avec :
  - **Modèle IA Text** : Select
    - GPT-4
    - Gemini Text
  - **Prompt template** : Textarea
    - Help text : "Variables disponibles : {nom}, {prenom}, {question1}, etc."
    - Placeholder : "Generate pokemon card data for {nom}: type={question1}, power based on {question2}/10. Format: JSON with type, attacks[2], power, description"
  - **Format de sortie** : Select
    - JSON structuré
    - Texte libre
  - **Variables créées** (si JSON) : Liste éditable
    - {text_type}
    - {text_attacks}
    - {text_power}
    - {text_description}
    - Bouton "+ Ajouter variable"
  - Bouton "✨ Générer le prompt avec IA"

**When** je sélectionne "JSON structuré"
**Then** je peux définir les variables qui seront extraites du JSON
**And** ces variables deviennent disponibles pour les blocs suivants (compositing)

**When** je drag un bloc "Template Overlay" dans le canvas
**Then** le bloc apparaît avec badge "Compositing" (vert)
**When** je clique "⚙️ Configurer"
**Then** un modal s'ouvre avec :
  - **Template de base** :
    - Option 1 : Upload PNG/JPG custom
    - Option 2 : Choisir template prédéfini (ex: Pokémon, Carte ID, Certificat)
  - **Preview du template** avec zones cliquables
  - **Zones définies** : Liste draggable
    - Zone 1 : Image (300x300 @ x:50, y:80)
      - Source : [Select] Résultat bloc 1, Résultat bloc 2, Selfie original
    - Zone 2 : Texte "Nom" (x:50, y:400)
      - Texte : {nom}
      - Font : [Select] Pokemon / Arial / Custom
      - Taille : 24px
      - Couleur : #000000
    - Zone 3 : Texte "Type" (x:50, y:430)
      - Texte : {text_type}
    - Zone 4 : Texte "Attaques" (x:50, y:460)
      - Texte : {text_attacks}
    - Bouton "+ Ajouter zone"

**When** je clique sur le preview du template
**Then** je peux dessiner une nouvelle zone (rectangle)
**And** définir son type (image/texte) et sa source

**When** je clique "Suivant" avec pipeline complet : Image IA → Text IA → Compositing
**Then** la config est sauvegardée :
```typescript
{
  pipeline: [
    {
      id: string,
      type: 'ai-image' | 'ai-text' | 'compositing',
      order: number,
      config: {
        // Si ai-image (identique Story 3.6)
        modelId?: 'dall-e-3' | 'gpt-image-1' | 'imagen-3.0-capability-001',
        promptTemplate?: string,

        // Si ai-text (NOUVEAU)
        modelId?: 'gpt-4' | 'gemini-text',
        promptTemplate?: string,
        outputFormat?: 'json' | 'text',
        outputVariables?: string[],  // Variables créées : {text_xxx}

        // Si compositing (NOUVEAU)
        templateUrl?: string,  // Template PNG uploadé ou prédéfini
        zones?: [
          {
            type: 'image' | 'text',
            x: number, y: number, w: number, h: number,
            source?: string,        // Si image : 'bloc-1', 'bloc-2', 'selfie'
            textTemplate?: string,  // Si texte : template avec variables
            font?: { family: string, size: number, color: string }
          }
        ]
      }
    }
  ]
}
```

**Prerequisites:** Story 3.6 (MVP)

**Technical Notes:**
- **POST-MVP Feature** : Extension majeure du système de pipeline
- **IA Text Generation** :
  - Backend : `openai.service.ts` méthode `generateText()` pour GPT-4
  - Parsing JSON : Extraction automatique des variables définies
  - Variables créées disponibles pour blocs suivants
  - Timeout 30s, retry 2x
- **Template Compositing** :
  - Backend : Service `image-compositor.service.ts` utilisant Sharp ou Canvas
  - Templates prédéfinis stockés dans `public/templates/`
  - Upload custom templates → Azure Blob Storage
  - Zones définies en coordonnées absolues (x, y, w, h)
  - Fonts custom supportés (upload TTF)
  - Output format : PNG avec alpha channel
- **Variables enrichies** :
  - Variables de base : {nom}, {prenom}, {email}, {question1}...
  - Variables générées par blocs text : {text_type}, {text_attacks}...
  - Résolution des variables dans l'ordre du pipeline
- **Use case phare** : Carte Pokémon personnalisée
  - Bloc 1 : IA Image (avatar pokémon from selfie)
  - Bloc 2 : IA Text (stats pokémon from questions)
  - Bloc 3 : Compositing (combine sur template carte)
- **Complexité** : ~10-14 jours dev
- Libraries backend :
  - Sharp (manipulation images performant)
  - OpenAI SDK (text generation GPT-4)
  - Canvas ou Jimp (text rendering sur images)

---

### Story 3.7 : Step 5 - Configuration Email

**En tant qu'** admin,
**Je veux** configurer l'envoi automatique d'emails aux participants,
**Afin qu'** ils reçoivent leur résultat par email après la génération.

**Acceptance Criteria:**

**Given** je suis sur l'étape 5 du wizard
**When** j'affiche le formulaire
**Then** je vois :
  - **Toggle "Activer l'envoi d'emails"** (Oui/Non, défaut Non)
  - Section configuration (collapsed si toggle Off)

**When** j'active le toggle
**Then** la section s'étend et affiche :
  - **Sujet de l'email** (texte, requis)
    - Placeholder : "Ton résultat {nom} est prêt !"
    - Help text : "Variables disponibles : {nom}, {prenom}, {email}, {imageUrl}, {question1}, etc."
  - **Corps de l'email** (textarea HTML simple, requis)
    - Éditeur de texte enrichi basique (gras, italique, liens)
    - Preview en temps réel (colonne droite)
    - Variables disponibles affichées
  - **Nom de l'expéditeur** (texte, défaut "AppsByMCI")
  - **Email expéditeur** (texte, défaut "noreply@appsbymci.com")

**When** je saisis un sujet avec variables : "Salut {nom}, voici ton avatar !"
**Then** le preview affiche : "Salut [NOM], voici ton avatar !" (variables en gras)

**When** je saisis un template HTML :
```html
<p>Bonjour {nom},</p>
<p>Ton image générée par IA est prête !</p>
<img src="{imageUrl}" alt="Résultat" />
<p>Merci d'avoir participé.</p>
```
**Then** le preview affiche le rendu HTML avec variables remplacées par des placeholders

**When** je clique "Suivant" avec emails activés mais sujet vide
**Then** une erreur s'affiche : "Le sujet est requis"

**When** je clique "Suivant" avec une config valide
**Then** la config est sauvegardée :
```typescript
{
  emailConfig: {
    enabled: boolean,
    subject: string,
    bodyTemplate: string,
    senderName: string,
    senderEmail: string
  }
}
```

**Prerequisites:** Story 3.6

**Technical Notes:**
- Composant : `components/wizard/steps/Step5EmailConfig.tsx`
- Éditeur HTML : Bibliothèque simple type Tiptap ou Quill (basique pour MVP)
- Preview temps réel : Parser template, remplacer variables par placeholders
- Variables extraites depuis `inputCollection.questions` + variables système (nom, email, imageUrl)
- Validation Zod : si `enabled=true`, alors sujet et body requis
- Email service backend : Mailjet (architecture décision)
- Data model : `architecture.md` lignes 1918-1923

---

### Story 3.8 : Step 6 & 7 - Écran Public et Personnalisation

**En tant qu'** admin,
**Je veux** configurer l'écran de visualisation public et personnaliser l'apparence,
**Afin de** adapter l'animation à mon événement.

**Acceptance Criteria:**

**Given** je suis sur l'étape 6 du wizard
**When** j'affiche le formulaire
**Then** je vois :
  - **Toggle "Activer l'écran public"** (Oui/Non, défaut Oui)
  - Section configuration (collapsed si toggle Off)

**When** j'active le toggle
**Then** la section affiche :
  - **Layout** : Select (Masonry, Grid, Carousel - défaut Masonry)
  - **Nombre de colonnes** : Slider (2-5, défaut 3)
  - **Afficher les noms** : Toggle (défaut Oui)
  - **Intervalle de rafraîchissement** : Input number (secondes, défaut 10, min 5, max 60)

**When** je clique "Suivant"
**Then** je passe à l'étape 7 (Personnalisation)

**Given** je suis sur l'étape 7
**When** j'affiche le formulaire
**Then** je vois :
  - **Couleur primaire** : Color picker (défaut noir #000000 - UX spec monochrome)
  - **Couleur secondaire** : Color picker (défaut gris #71717a)
  - **Logo** : Upload image (optionnel, max 2MB, formats PNG/JPG)
  - **Image de fond** : Upload image OU couleur unie (optionnel)
  - **Thème** : Radio buttons (Clair / Sombre / Auto - défaut Auto)
  - **Messages personnalisés** :
    - Message de bienvenue (optionnel)
    - Message après soumission (défaut "Merci ! Votre résultat arrive...")
    - **Messages de chargement** (Textarea, un message par ligne)
      - Placeholder : "L'IA analyse ton image...\nGénération en cours...\nBientôt prêt...\nPreque terminé !"
      - Help text : "Ces messages défileront pendant la génération IA pour faire patienter. Un message par ligne (minimum 3, maximum 10)."
      - Défauts si vide :
        - "🎨 L'IA travaille sur ton image..."
        - "✨ Génération en cours..."
        - "🚀 Presque terminé..."
        - "⏳ Encore quelques secondes..."
    - Message de remerciement final (défaut "Merci d'avoir participé !")

**When** je saisis mes messages de chargement personnalisés :
```
L'IA crée ton avatar magique...
On ajoute des paillettes ✨
Presque prêt, tiens bon !
Et voilà le résultat !
```
**Then** chaque ligne est sauvegardée comme un message distinct
**And** une preview montre comment ils défileront (animation simulation)

**When** je saisis moins de 3 messages
**Then** une erreur s'affiche : "Minimum 3 messages requis"

**When** je saisis plus de 10 messages
**Then** une erreur s'affiche : "Maximum 10 messages autorisés"

**When** j'upload un logo
**Then** une preview s'affiche
**And** le logo est uploadé vers Azure Blob Storage immédiatement
**And** l'URL est stockée

**When** je clique "Suivant" avec config valide
**Then** les données sont sauvegardées :
```typescript
{
  publicDisplayConfig: {
    enabled: boolean,
    layout: 'masonry' | 'grid' | 'carousel',
    columns: number,
    showParticipantName: boolean,
    refreshInterval: number
  },
  customization: {
    primaryColor: string,
    secondaryColor: string,
    logo?: string,           // URL Azure Blob
    backgroundImage?: string,
    theme: 'light' | 'dark' | 'auto',
    welcomeMessage?: string,
    submissionMessage?: string,
    loadingMessages: string[],  // Min 3, Max 10 messages
    thankYouMessage?: string
  }
}
```

**Prerequisites:** Story 3.7

**Technical Notes:**
- Composants : `Step6PublicDisplay.tsx`, `Step7Customization.tsx`
- Upload logo : Direct vers Azure Blob via `azure-blob.service.ts` (frontend appelle backend)
- Color picker : ShadCN ou bibliothèque simple type react-colorful
- Preview personnalisation : Aperçu live des couleurs/thème
- Data model : `architecture.md` lignes 1925-1938 (public display) et 1940-1947 (customization)

---

### Story 3.9 : Step 8 - Récapitulatif, Sauvegarde Brouillon & Publication

**En tant qu'** admin,
**Je veux** prévisualiser ma configuration complète et publier l'animation,
**Afin de** la rendre accessible aux participants avec un QR code généré.

**Acceptance Criteria:**

**Given** je suis sur l'étape 8 du wizard
**When** j'affiche la page
**Then** je vois un récapitulatif complet :
  - **Informations générales** : Nom, Description, Slug
  - **Accès** : Type de validation configuré
  - **Inputs** : Liste des champs à collecter (X champs dont Y générés par IA)
  - **Pipeline** : Nombre de blocs, modèle IA utilisé
  - **Email** : Activé ou non
  - **Écran public** : Activé ou non
  - **Personnalisation** : Aperçu des couleurs/logo
  - Badge "Configuration complète ✅"

**And** je vois deux boutons en bas :
  - "💾 Sauvegarder comme brouillon" (bouton secondaire gris)
  - "🚀 Publier l'animation" (bouton primaire noir)

**When** je clique "💾 Sauvegarder comme brouillon"
**Then** `POST /api/animations` est appelé avec `status: 'draft'`
**And** le backend :
  - Crée le document dans `animations` collection
  - **Ne génère PAS de QR code** (brouillon)
  - Retourne `{ success: true, data: { animationId, slug } }`

**And** un toast confirme : "Animation sauvegardée en brouillon"
**And** je suis redirigé vers `/dashboard/animations/{id}`
**And** je peux revenir l'éditer plus tard

**When** je clique "🚀 Publier l'animation"
**Then** une validation finale est effectuée :
  - ✅ Nom présent
  - ✅ Au moins 1 champ de collecte OU selfie requis
  - ✅ Pipeline avec au moins 1 bloc IA
  - ✅ Slug unique (vérifié backend)

**When** le slug existe déjà
**Then** une erreur s'affiche : "Ce slug est déjà utilisé. Veuillez en choisir un autre."
**And** je retourne à l'étape 1 pour modifier le slug

**When** toutes les validations passent
**Then** `POST /api/animations` est appelé avec `status: 'published'`
**And** le backend :
  - Crée le document dans `animations` collection
  - **Génère le QR code** via bibliothèque `qrcode`
  - Upload le QR code vers Azure Blob (`qrcodes/{slug}.png`)
  - Met à jour `animation.qrCodeUrl`
  - Définit `animation.publishedAt = now()`
  - Retourne `{ success: true, data: { animationId, slug, qrCodeUrl } }`

**And** un toast confirme : "✅ Animation publiée avec succès !"
**And** un modal de succès s'affiche avec :
  - "🎉 Votre animation est en ligne !"
  - URL publique : `https://app.com/a/{slug}`
  - QR code affiché (image téléchargeable)
  - Bouton "📥 Télécharger le QR code"
  - Bouton "Voir l'animation" → ouvre `/a/{slug}` dans nouvel onglet
  - Bouton "Retour au dashboard" → redirige vers `/dashboard`

**When** je clique "📥 Télécharger le QR code"
**Then** le fichier PNG du QR code est téléchargé

**Prerequisites:** Story 3.8

**Technical Notes:**
- Composant : `components/wizard/steps/Step8Summary.tsx`
- Récapitulatif : Read-only cards pour chaque section configurée
- Validation finale backend dans `animations.controller.ts` méthode `create()`
- Génération QR code : Backend service `qr-code.service.ts` utilisant `qrcode` npm
- QR code pointe vers : `${process.env.NEXT_PUBLIC_APP_URL}/a/${slug}`
- Upload Azure Blob : Container `qrcodes/`
- Modal succès : ShadCN Dialog avec image QR + actions
- Data model complet : `architecture.md` lignes 1863-2031
- Cette story complète le wizard complet (FR6-27)

---

### Story 3.10 : Édition d'une Animation Existante

**En tant qu'** admin,
**Je veux** éditer une animation existante,
**Afin de** corriger ou améliorer sa configuration.

**Acceptance Criteria:**

**Given** je suis sur `/dashboard` et je vois ma liste d'animations
**When** je clique sur "Éditer" pour une animation existante
**Then** je suis redirigé vers `/dashboard/animations/{id}/edit`

**And** le wizard s'ouvre avec toutes les étapes
**And** chaque étape est pré-remplie avec les données existantes :
  - Étape 1 : Nom, description, slug (slug NON modifiable - read-only)
  - Étape 2 : Type d'accès et config
  - Étapes 3-7 : Toutes les configurations
  - Étape 8 : Récapitulatif

**When** je modifie des champs et clique "Suivant" sur chaque étape
**Then** les modifications sont sauvegardées dans `wizardStore`

**When** j'arrive à l'étape 8
**Then** je vois deux boutons :
  - "💾 Sauvegarder les modifications" (bouton primaire)
  - "Annuler" (bouton secondaire)

**When** je clique "💾 Sauvegarder les modifications"
**Then** `PUT /api/animations/{id}` est appelé
**And** le backend :
  - Met à jour le document `animations` existant
  - **Ne régénère PAS le QR code** (slug inchangé)
  - Conserve `animation.publishedAt` si déjà publié
  - Retourne les données mises à jour

**And** un toast confirme : "Animation mise à jour avec succès"
**And** je suis redirigé vers `/dashboard/animations/{id}`

**When** l'animation était un brouillon et je clique "🚀 Publier"
**Then** le statut passe de `draft` à `published`
**And** le QR code est généré (première fois)
**And** `publishedAt` est défini

**Prerequisites:** Story 3.9

**Technical Notes:**
- Page : `app/(admin)/animations/[id]/edit/page.tsx`
- Charge l'animation existante : `GET /api/animations/{id}`
- Pré-remplit `wizardStore` avec les données existantes
- **Slug NON modifiable** en édition (évite de casser les QR codes distribués)
- Tous les autres champs modifiables
- Route backend : `PUT /api/animations/:id` dans `animations.routes.ts`
- Service : `animations.service.ts` méthode `updateAnimation()`
- Validation : mêmes règles que création

---

### Story 3.11 : Dupliquer et Archiver une Animation

**En tant qu'** admin,
**Je veux** dupliquer ou archiver une animation,
**Afin de** réutiliser des configurations ou gérer mon historique.

**Acceptance Criteria:**

**Given** je suis sur `/dashboard` et je vois une animation existante
**When** je clique sur le menu "..." de l'animation
**Then** je vois les options :
  - ✏️ Éditer
  - 📋 Dupliquer
  - 📦 Archiver (ou Restaurer si déjà archivée)
  - 🗑️ Supprimer

**When** je clique "📋 Dupliquer"
**Then** un modal de confirmation apparaît :
  - "Dupliquer '{nom de l'animation}' ?"
  - Info : "Une copie complète sera créée en brouillon"
  - Bouton "Dupliquer" (primaire)

**When** je confirme
**Then** `POST /api/animations/{id}/duplicate` est appelé
**And** le backend :
  - Copie toutes les données de l'animation source
  - Génère un nouveau nom : "{nom original} (copie)"
  - Génère un nouveau slug : "{slug-original}-copy-{timestamp}"
  - Définit `status: 'draft'` (même si source était publiée)
  - **Ne copie PAS** le QR code (sera régénéré à la publication)
  - Crée un nouveau document dans `animations`
  - Retourne la nouvelle animation

**And** un toast confirme : "Animation dupliquée avec succès"
**And** la nouvelle animation apparaît dans la liste avec badge "Brouillon"

**When** je clique "📦 Archiver" sur une animation publiée
**Then** un modal de confirmation apparaît :
  - "Archiver '{nom}' ?"
  - Warning : "L'animation ne sera plus accessible aux participants (lien et QR code désactivés)"
  - Bouton "Archiver" (rouge)

**When** je confirme
**Then** `PUT /api/animations/{id}/archive` est appelé
**And** le backend :
  - Met à jour `status: 'archived'`
  - Définit `archivedAt: now()`
  - L'animation reste en DB (pas de suppression)

**And** un toast confirme : "Animation archivée"
**And** l'animation disparaît de la liste principale (filtre par défaut : publiées + brouillons)

**When** je filtre par "Archivées" dans le dashboard
**Then** je vois les animations archivées
**And** je peux cliquer "Restaurer" pour remettre `status: 'published'`

**When** je clique "🗑️ Supprimer" (option danger)
**Then** un modal de confirmation s'affiche :
  - "Supprimer définitivement '{nom}' ?"
  - Warning : "Toutes les générations associées seront également supprimées. Cette action est irréversible."
  - Input : "Tapez 'SUPPRIMER' pour confirmer"

**When** je confirme
**Then** `DELETE /api/animations/{id}` est appelé
**And** le backend :
  - Supprime le document `animations`
  - Supprime tous les documents `generations` associés (`animationId: id`)
  - Supprime le QR code d'Azure Blob (`qrcodes/{slug}.png`)
  - Supprime les images générées d'Azure Blob (optionnel - ou garder pour historique)

**And** un toast confirme : "Animation supprimée définitivement"

**Prerequisites:** Story 3.10

**Technical Notes:**
- Routes backend :
  - `POST /api/animations/:id/duplicate` → `animations.controller.ts`
  - `PUT /api/animations/:id/archive` → change status
  - `PUT /api/animations/:id/restore` → change status
  - `DELETE /api/animations/:id` → suppression hard
- Service : `animations.service.ts` méthodes correspondantes
- Dupliquer : Logique de copie profonde (deep clone) des configs complexes (pipeline, questions, etc.)
- Archiver : Soft delete (status change, pas suppression DB)
- Supprimer : Hard delete avec cascade (animations + generations + blobs)
- Confirmation modal : ShadCN AlertDialog pour actions danger

---

### Story 3.6B : [POST-MVP] Génération de Texte IA + Compositing sur Template

**En tant qu'** admin,
**Je veux** générer du texte via IA et le composer avec une image sur un template,
**Afin de** créer des visuels complexes (cartes Pokémon, badges personnalisés, etc.).

**Acceptance Criteria:**

**Given** je suis sur l'étape 5 du wizard (Création du pipeline)
**When** j'ouvre la bibliothèque de blocs
**Then** je vois deux nouveaux types de blocs IA :
  - **"IA - Génération de Texte"** (GPT-4, Gemini Text)
  - **"Post-processing - Compositing"** (combine image + texte sur template)

**When** je glisse un bloc "IA - Génération de Texte" dans le pipeline
**Then** le modal de configuration s'ouvre avec :
  - **Modèle** : Dropdown (GPT-4 Turbo, Gemini 1.5 Pro Text)
  - **Prompt** : Textarea multiline avec support variables ({nom}, {prenom}, etc.)
  - **Nom de la variable générée** : Input text (ex: "pokemon_description")
    - Valide : lettres, chiffres, underscore uniquement
    - Sera utilisable dans les blocs suivants comme {pokemon_description}
  - **Max tokens** : Number input (100-1000, défaut 300)

**When** je sauvegarde
**Then** le bloc est ajouté au pipeline
**And** la variable créée est disponible pour les blocs suivants

**When** je glisse un bloc "Post-processing - Compositing" dans le pipeline
**Then** le modal de configuration s'ouvre avec :
  - **Template PNG** : Upload d'une image template avec zones transparentes/définies
  - **Zones configurables** :
    - Zone 1 : Type (Image | Texte), Position (X, Y, Width, Height)
    - Zone 2 : Type (Image | Texte), Position (X, Y, Width, Height)
    - ...jusqu'à 5 zones max
  - **Configuration par zone** :
    - Si type="Image" : Source (Résultat IA précédent | Upload statique)
    - Si type="Texte" : Variable ({pokemon_description}), Police, Taille, Couleur, Alignement

**When** je sauvegarde
**Then** le bloc compositing est ajouté au pipeline
**And** une preview du template avec zones s'affiche

**When** un participant soumet le formulaire
**Then** le backend exécute séquentiellement :
  1. Blocs pre-processing
  2. Bloc IA Text → génère le texte → crée variable {pokemon_description}
  3. Bloc IA Image → génère l'image
  4. Bloc Compositing → charge le template, positionne l'image et le texte selon config, génère PNG final
  5. Upload résultat vers Azure Blob

**And** le résultat final composité est affiché au participant

**Prerequisites:** Story 3.6

**Technical Notes:**
- Nouveau type de bloc : `block.type = 'ai-text'` et `block.type = 'compositing'`
- API IA texte : OpenAI Chat Completion ou Google Gemini Text API
- Variables dynamiques stockées dans `executionContext` du pipeline
- Compositing : Utiliser bibliothèque `sharp` ou `canvas` (Node.js backend)
- Template PNG : Upload vers Azure Blob (`templates/`)
- Config zones : JSON avec positions, types, sources
- Data model compositing : Extension de `architecture.md` (nouveau type de bloc)
- **Complexité estimée** : 10-14 jours dev
- **Statut** : POST-MVP (sortie v1 d'abord, puis ajout feature)

---

## Epic 4 : Expérience Participant & Génération IA

**Objectif :** Permettre aux participants d'accéder à l'animation, remplir le formulaire multi-étapes, soumettre leurs données, et recevoir une image générée par IA avec possibilité de téléchargement et envoi par email.

**User Value :** Cette epic implémente l'expérience utilisateur finale - le moment magique où un participant interagit avec l'animation et reçoit son résultat personnalisé généré par IA. C'est le cœur de la proposition de valeur du produit.

**FRs couverts :** FR28-FR49 (expérience participant, génération IA), FR69-FR73 (email des résultats) - **27 FRs**

**Stories :**
- Story 4.1 : Page d'accueil animation et personnalisation (FR28, FR29, FR49)
- Story 4.2 : Formulaire participant multi-étapes (FR30, FR31, FR34)
- Story 4.3 : Capture et upload selfie (FR32)
- Story 4.4 : Réponses aux questions custom (FR33)
- Story 4.5 : Validation accès et soumission (FR35, FR36, FR37)
- Story 4.6 : Exécution pipeline et génération IA (FR38, FR39, FR40, FR41, FR42, FR43)
- Story 4.7 : Sauvegarde et affichage résultat (FR44, FR45, FR46, FR47, FR48)
- Story 4.8 : Envoi email des résultats (FR69-FR73)

**Epic Complexity:** 🔴 High - 8 stories couvrant le flux participant complet, intégration APIs IA multiples, gestion erreurs, rate limiting, et email.

**Dependencies:**
- Epic 1 (infrastructure Azure, DB, AI clients)
- Epic 3 (config animation disponible)

---

### Story 4.1 : Page d'accueil animation et personnalisation

**En tant que** participant,
**Je veux** accéder à une animation via son lien ou QR code et voir une page d'accueil personnalisée,
**Afin de** comprendre l'animation et commencer à participer.

**Acceptance Criteria:**

**Given** une animation publiée avec slug `summer-festival`
**When** je visite `https://app.com/a/summer-festival`
**Then** le backend :
  - Appelle `GET /api/animations/by-slug/summer-festival`
  - Récupère les données complètes de l'animation
  - Vérifie `status === 'published'` (sinon 404)

**When** l'animation est publiée
**Then** j'affiche la page d'accueil avec :
  - **Logo** (si configuré) : Affiché en haut (max 200px height)
  - **Couleurs personnalisées** : Appliquées via CSS variables
    - `--primary-color` sur le bouton CTA
    - `--secondary-color` sur les accents
  - **Thème** (light/dark/auto) : Appliqué sur toute la page
  - **Image de fond** (si configurée) : Background avec overlay semi-transparent
  - **Titre de l'animation** : H1, police bold
  - **Description** : Paragraph, multi-lignes si long
  - **Message de bienvenue personnalisé** (si configuré) : Section distincte
  - **Bouton CTA** : "Commencer" (couleur primaire)

**When** je clique sur "Commencer"
**Then** je suis redirigé vers `/a/{slug}/form`
**And** le formulaire wizard démarre à l'étape 1

**When** l'animation n'existe pas ou a le statut `draft` ou `archived`
**Then** j'affiche une page d'erreur 404 :
  - "Animation introuvable"
  - "L'animation demandée n'existe pas ou n'est plus disponible."
  - Bouton "Retour à l'accueil" (redirige vers `/`)

**Prerequisites:** Story 3.8 (animation publiée disponible)

**Technical Notes:**
- Page : `app/(public)/a/[slug]/page.tsx` (route publique, pas d'auth)
- API : `GET /api/animations/by-slug/:slug` dans `animations.routes.ts`
- Controller : `animations.controller.ts` méthode `getBySlug()`
- Service : `animations.service.ts` méthode `getAnimationBySlug()`
  - Query Cosmos DB : `db.collection('animations').findOne({ slug, status: 'published' })`
- CSS : Variables dynamiques injectées via style tag ou inline styles
- Image fond : URL Azure Blob chargée en `background-image`
- Responsive : Mobile-first design, s'adapte à tous écrans
- SEO : Meta tags dynamiques (title, description) pour partage social
- Data model : `architecture.md` lignes 1940-1947 (customization) et 1925-1938 (display config)

---

### Story 4.2 : Formulaire participant multi-étapes

**En tant que** participant,
**Je veux** remplir un formulaire wizard multi-étapes avec navigation,
**Afin de** fournir mes informations et réponses étape par étape.

**Acceptance Criteria:**

**Given** je suis sur `/a/{slug}/form` après avoir cliqué "Commencer"
**When** la page se charge
**Then** le frontend :
  - Appelle `GET /api/animations/by-slug/{slug}` pour récupérer la config
  - Initialise un store participant local (ex: `participantFormStore` avec Zustand)
  - Construit le tableau d'étapes dynamiques basé sur la config :
    - **Étape 0** : Champs de base (nom, prénom, email) si activés (écran unique)
    - **Étapes 1-N** : Un écran par élément de `inputCollection.elements[]` (selfie, questions)
    - **Étape finale** : Écran de soumission (récapitulatif + validation accès si requis)

**And** je vois :
  - **Barre de progression** : En haut (ex: "Étape 2 sur 5", barre visuelle)
  - **Contenu de l'étape actuelle** : Formulaire ou question affichée
  - **Boutons de navigation** :
    - "Précédent" (disabled sur première étape)
    - "Suivant" (ou "Soumettre" sur dernière étape)

**When** je suis sur l'étape 0 (champs de base)
**Then** j'affiche les champs activés dans `animation.baseFields` :
  - **Nom** : Input text avec label et placeholder configurés (si enabled)
  - **Prénom** : Input text avec label et placeholder configurés (si enabled)
  - **Email** : Input email avec label et placeholder configurés (si enabled)

**And** si `animation.accessConfig.type === 'code'`, j'affiche également :
  - **Code d'accès** : Input text avec label "Code d'accès" et placeholder "Entrez votre code"

**When** je laisse un champ requis vide et clique "Suivant"
**Then** une erreur s'affiche sous le champ : "Ce champ est requis"
**And** je ne peux pas avancer

**When** je saisis un email invalide (format incorrect)
**Then** une erreur s'affiche sous le champ email : "Format d'email invalide"

**When** `animation.accessConfig.type === 'email-domain'`
**Then** la validation du domaine email se fait automatiquement côté frontend dès la saisie
**And** si le domaine n'est pas autorisé :
  - Message d'erreur sous le champ email : "Votre domaine email n'est pas autorisé pour cette animation"
  - Bouton "Suivant" disabled

**When** `animation.accessConfig.type === 'code'` et je clique "Suivant"
**Then** le frontend appelle `POST /api/animations/{slug}/validate-access` avec `{ accessCode: "CODE123" }`
**And** le backend vérifie `accessCode === animation.accessConfig.code`
**And** si le code est **invalide** :
  - Retourne `403 Forbidden` avec `{ error: "Code d'accès incorrect" }`
  - Message d'erreur sous le champ code : "Code d'accès incorrect"
  - Je reste bloqué sur l'étape 0

**When** le code est **valide** ou l'email domain est **valide** ou `type === 'none'`
**And** tous les champs requis sont remplis
**Then** les données sont sauvegardées dans `participantFormStore`
**And** je passe à l'étape suivante

**When** je clique "Précédent"
**Then** je reviens à l'étape précédente
**And** mes réponses précédentes sont pré-remplies (données du store)

**When** je suis sur une étape intermédiaire (selfie ou question)
**Then** l'étape est affichée en plein écran (un élément = un écran)
**And** le contenu de l'étape dépend du type d'élément (voir Stories 4.3 et 4.4)

**Prerequisites:** Story 4.1

**Technical Notes:**
- Composant : `components/participant/FormWizard.tsx`
- Store : `stores/participantFormStore.ts` (Zustand)
  - State : `{ currentStep, formData: { nom, prenom, email, accessCode, selfie, answers } }`
  - Actions : `setField()`, `nextStep()`, `prevStep()`, `reset()`
- API validation : `POST /api/animations/{slug}/validate-access`
  - Body : `{ accessCode: "CODE123" }` (si type='code')
  - Response success : `200 OK`
  - Response error : `403 Forbidden` avec `{ error: "Code d'accès incorrect" }`
- Validation email-domain : Frontend uniquement (parse domain + check dans liste)
  - Fonction : `validateEmailDomain(email, allowedDomains)` → boolean
- Validation : Utiliser `react-hook-form` avec `zod` schemas
- Barre de progression : ShadCN Progress component
- Navigation : Boutons ShadCN Button avec logique de disable
- Responsive : Formulaire mobile-first
- Architecture : `architecture.md` lignes 1863-1923 (animation data model avec baseFields et inputCollection)

---

### Story 4.3 : Capture et upload selfie

**En tant que** participant,
**Je veux** capturer un selfie depuis ma webcam (desktop) ou uploader une photo (mobile),
**Afin de** fournir mon image pour la génération IA.

**Acceptance Criteria:**

**Given** je suis sur une étape du wizard où `element.type === 'selfie'`
**When** la page se charge
**Then** je détecte le device :
  - **Desktop** : J'affiche l'interface webcam
  - **Mobile/Tablet** : J'affiche l'interface upload

**When** je suis sur desktop
**Then** je vois :
  - **Titre** : "Prends ton selfie !" (ou texte configuré dans `element.question`)
  - **Aperçu webcam** : Flux vidéo live de la webcam (permissions requises)
  - **Bouton** : "📸 Capturer" (primaire, large)
  - **Bouton secondaire** : "📤 Uploader depuis mon appareil" (fallback si webcam indisponible)

**When** je clique "📸 Capturer"
**Then** une photo est prise depuis le flux webcam
**And** l'aperçu vidéo est remplacé par l'image capturée (preview)
**And** je vois deux boutons :
  - "✓ Valider cette photo" (primaire)
  - "🔄 Reprendre" (secondaire)

**When** je clique "🔄 Reprendre"
**Then** le flux webcam redémarre
**And** je peux capturer à nouveau

**When** je clique "✓ Valider cette photo"
**Then** l'image est convertie en Blob
**And** sauvegardée dans `participantFormStore.formData.selfie` (File object)
**And** je passe automatiquement à l'étape suivante

**When** je suis sur mobile/tablet
**Then** je vois :
  - **Titre** : "Prends ton selfie !"
  - **Input file** : `<input type="file" accept="image/*" capture="user" />` (déclenche caméra frontale native)
  - **Aperçu** : Zone de drop ou bouton large "📸 Prendre une photo"

**When** je clique sur le bouton
**Then** la caméra native s'ouvre (système)
**And** je prends une photo
**And** la photo sélectionnée s'affiche en preview

**When** la photo est validée
**Then** le fichier est sauvegardé dans `participantFormStore.formData.selfie`
**And** je passe automatiquement à l'étape suivante

**When** la webcam est refusée (permissions)
**Then** j'affiche un message d'erreur :
  - "Accès à la webcam refusé"
  - "Veuillez autoriser l'accès à votre caméra ou uploader une photo."
  - Bouton "📤 Uploader une photo" (fallback)

**When** je sélectionne un fichier trop lourd (> 10 MB)
**Then** une erreur s'affiche : "La photo ne doit pas dépasser 10 MB"

**When** je sélectionne un fichier non-image
**Then** une erreur s'affiche : "Format de fichier invalide. Utilisez JPG, PNG ou WEBP."

**When** le selfie est requis (`element.required === true`)
**And** je clique "Suivant" sans photo
**Then** une erreur s'affiche : "Le selfie est requis pour continuer"

**Prerequisites:** Story 4.2

**Technical Notes:**
- Composant : `components/participant/steps/SelfieCapture.tsx`
- Webcam : Utiliser `react-webcam` library
- Permissions : Demander via `navigator.mediaDevices.getUserMedia()`
- Détection device : `navigator.userAgent` ou `window.matchMedia('(pointer: coarse)')`
- Capture mobile : HTML5 `capture="user"` attribute (déclenche caméra frontale)
- Validation taille : Max 10 MB (10 * 1024 * 1024 bytes)
- Formats acceptés : `image/jpeg`, `image/png`, `image/webp`
- Preview : Utiliser `URL.createObjectURL(blob)`
- Store : Sauvegarder File object dans `participantFormStore.formData.selfie`
- Pas d'upload immédiat - l'image sera envoyée avec la soumission finale
- Data model : `element.type = 'selfie'` dans `architecture.md` lignes 1887-1895

---

### Story 4.4 : Réponses aux questions custom

**En tant que** participant,
**Je veux** répondre aux questions configurées par l'admin (choix, slider, texte libre),
**Afin de** personnaliser ma génération IA.

**Acceptance Criteria:**

**Given** je suis sur une étape du wizard où `element.type` est une question
**When** `element.type === 'choice'`
**Then** j'affiche :
  - **Titre** : `element.question` (ex: "Quelle ambiance préfères-tu ?")
  - **Options** : Liste des choix depuis `element.options[]`
  - **UI** : Radio buttons (si ≤ 4 options) ou Dropdown (si > 4 options)
  - **Requis** : Astérisque rouge * si `element.required === true`

**When** je sélectionne une option
**Then** la valeur est sauvegardée dans `participantFormStore.formData.answers[element.id]`

**When** l'élément est requis et je clique "Suivant" sans sélectionner
**Then** une erreur s'affiche : "Veuillez sélectionner une option"

**When** `element.type === 'slider'`
**Then** j'affiche :
  - **Titre** : `element.question` (ex: "Niveau d'intensité souhaité")
  - **Slider** : Range input de `element.min` à `element.max`
  - **Labels** :
    - Gauche : `element.minLabel` (ex: "Doux")
    - Droite : `element.maxLabel` (ex: "Intense")
  - **Valeur actuelle** : Affichée en grand au-dessus du slider (ex: "7")
  - **Valeur par défaut** : Milieu de la plage (`(min + max) / 2`)

**When** je déplace le slider
**Then** la valeur affichée se met à jour en temps réel
**And** la valeur est sauvegardée dans `participantFormStore.formData.answers[element.id]`

**When** `element.type === 'free-text'`
**Then** j'affiche :
  - **Titre** : `element.question` (ex: "Décris ton super-pouvoir idéal")
  - **Textarea** : Large zone de saisie multi-lignes
  - **Placeholder** : `element.placeholder` (ex: "Ex: Je pourrais voler dans les airs...")
  - **Compteur de caractères** : "X / Y caractères" (live)
  - **Limites** : Min 0, Max = `element.maxLength` (50-2000)

**When** je tape du texte
**Then** le compteur se met à jour en temps réel
**And** le texte est sauvegardé dans `participantFormStore.formData.answers[element.id]`

**When** je dépasse `element.maxLength`
**Then** la saisie est bloquée (input ne permet plus de taper)
**And** le compteur devient rouge : "2000 / 2000 caractères (maximum atteint)"

**When** l'élément free-text est requis et je clique "Suivant" avec texte vide
**Then** une erreur s'affiche : "Veuillez remplir ce champ"

**When** je valide une question
**And** je clique "Suivant"
**Then** je passe à l'étape suivante (prochain élément ou écran de soumission)

**Prerequisites:** Story 4.2

**Technical Notes:**
- Composants :
  - `components/participant/steps/ChoiceQuestion.tsx`
  - `components/participant/steps/SliderQuestion.tsx`
  - `components/participant/steps/FreeTextQuestion.tsx`
- Choix : ShadCN RadioGroup ou Select component
- Slider : ShadCN Slider component avec labels personnalisés
- Free-text : ShadCN Textarea avec compteur live
- Validation : `react-hook-form` avec `zod` schemas dynamiques
- Store : `participantFormStore.formData.answers` est un objet `{ [elementId]: value }`
  - Ex: `{ "q1": "Mystérieux", "q2": 8, "q3": "Je veux pouvoir contrôler le temps" }`
- Architecture : `architecture.md` lignes 1887-1895 (inputCollection elements)

---

### Story 4.5 : Validation accès et soumission formulaire

**En tant que** participant,
**Je veux** soumettre mon formulaire avec validation d'accès (code ou email-domain),
**Afin de** lancer la génération IA de mon résultat.

**Acceptance Criteria:**

**Given** je suis sur la dernière étape du wizard (écran de soumission)
**When** la page se charge
**Then** j'affiche un récapitulatif :
  - **Titre** : "Récapitulatif de tes informations"
  - **Données collectées** :
    - Nom, prénom, email (si activés)
    - Selfie capturé (preview miniature)
    - Réponses aux questions (liste avec question et réponse)
  - **Bouton** : "🚀 Générer mon résultat" (primaire, large)

**When** je clique "🚀 Générer mon résultat"
**Then** `POST /api/generations` est appelé avec :
```json
{
  "animationId": "animation_id",
  "formData": {
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean@company.com",
    "selfie": File,  // Binary file
    "answers": { "q1": "Mystérieux", "q2": 8 }
  },
  "accessCode": "CODE123" // Si type='code'
}
```

**And** le backend valide :
  - `animation.status === 'published'`
  - **Rate limiting** : Max 5 requêtes par IP par minute (FR37)

**When** le rate limit est dépassé
**Then** le backend retourne `429 Too Many Requests`
**And** le frontend affiche :
  - "Trop de tentatives. Veuillez patienter quelques instants."

**When** toutes les validations passent
**Then** le backend :
  - Crée un document dans `generations` collection avec `status: 'processing'`
  - Upload le selfie vers Azure Blob (`selfies/{generationId}.jpg`)
  - Lance l'exécution du pipeline IA (asynchrone)
  - Retourne immédiatement `{ success: true, generationId: "gen_123" }`

**And** le frontend :
  - Affiche un écran de chargement avec messages personnalisés (Story 4.6)

**Prerequisites:** Story 4.4

**Technical Notes:**
- Composant : `components/participant/steps/SubmissionStep.tsx`
- API :
  - `POST /api/animations/{slug}/validate-access` (appelé à l'étape 0, Story 4.2)
  - `POST /api/generations` (appelé à la soumission finale)
- Controller : `generations.controller.ts` méthode `create()`
- Service : `generations.service.ts` méthode `createGeneration()`
- Rate limiting : Utiliser `express-rate-limit` middleware
  - Clé : IP address (`req.ip`)
  - Limite : 5 requêtes / 60 secondes
  - Store : Redis ou in-memory (MVP)
- **Note** : La validation d'accès (code/email-domain) se fait désormais à l'étape 0 (Story 4.2), pas ici
- Upload selfie : Azure Blob service avec container `selfies/`
- Data model : `architecture.md` lignes 2070-2118 (generations collection)
- Le pipeline IA s'exécute en arrière-plan (pas de blocage de la réponse HTTP)

---

### Story 4.6 : Exécution pipeline et génération IA

**En tant que** système backend,
**Je veux** exécuter le pipeline IA configuré pour générer l'image personnalisée,
**Afin de** produire le résultat final du participant.

**Acceptance Criteria:**

**Given** une génération créée avec `status: 'processing'`
**When** le pipeline démarre
**Then** le backend :
  - Récupère la config du pipeline depuis `animation.pipeline.blocks[]`
  - Initialise un contexte d'exécution avec les variables :
    - `{nom}`, `{prenom}`, `{email}`, `{question1}`, `{question2}`, etc.
  - Charge le selfie depuis Azure Blob comme File/Buffer
  - Exécute les blocs séquentiellement dans l'ordre

**When** un bloc de type `'ai-generation'` est exécuté
**Then** le backend :
  - Récupère la config du bloc : `{ model, prompt, parameters }`
  - Remplace les variables dans le prompt : `"Portrait de {nom} en style {ambiance}"` → `"Portrait de Jean en style Mystérieux"`
  - Appelle l'API IA correspondante selon le modèle

**When** `block.config.model === 'dall-e-3'` (text-to-image)
**Then** :
  - **API** : OpenAI Image Generation API
  - **Endpoint** : `POST https://api.openai.com/v1/images/generations`
  - **Payload** :
    ```json
    {
      "model": "dall-e-3",
      "prompt": "prompt avec variables remplacées",
      "size": "1024x1024",
      "quality": "standard",
      "n": 1
    }
    ```
  - **Note** : DALL-E 3 est text-to-image uniquement, ignore le selfie

**When** `block.config.model === 'gpt-image-1'` (image-to-image)
**Then** :
  - **API** : OpenAI Image Edit API
  - **Endpoint** : `POST https://api.openai.com/v1/images/edits`
  - **Payload** : FormData multipart avec :
    - `model` : "gpt-image-1"
    - `image` : Selfie file (ou image du bloc précédent si chaîné)
    - `prompt` : Prompt avec variables remplacées
    - `size` : "1024x1024" ou "1536x1024" ou "1024x1536"
  - **Note** : Utilise le selfie comme source pour édition/transformation

**When** `block.config.model === 'imagen-3.0-capability-001'` (text-to-image)
**Then** :
  - **API** : Google Vertex AI Imagen API
  - **Endpoint** : `POST https://{location}-aiplatform.googleapis.com/v1/projects/{projectId}/locations/{location}/publishers/google/models/imagen-3.0-capability-001:predict`
  - **Payload** :
    ```json
    {
      "instances": [{
        "prompt": "prompt avec variables remplacées"
      }],
      "parameters": {
        "sampleCount": 1,
        "aspectRatio": "1:1"
      }
    }
    ```
  - **Note** : Text-to-image uniquement, ignore le selfie
  - **Response** : Retourne `predictions[].bytesBase64Encoded` (image en base64)

**When** l'appel API réussit
**Then** le backend :
  - Récupère l'URL de l'image générée (temporaire)
  - Télécharge l'image depuis l'URL
  - La stocke comme résultat du bloc (`blockResult.imageBuffer`)
  - Si d'autres blocs IA suivent : Passe `imageBuffer` au prochain bloc comme source

**When** plusieurs blocs IA sont chaînés
**Then** l'exécution est séquentielle :
  1. **Bloc 1** : Selfie → GPT Image 1 (style cartoon) → Image A
  2. **Bloc 2** : Image A → GPT Image 1 (couleurs vives) → Image B (résultat final)

**When** l'appel API échoue (erreur 4xx, 5xx)
**Then** le backend :
  - Vérifie le type d'erreur :
    - **429** (rate limit) ou **503** (service unavailable) : **Retry avec backoff**
      - 1ère tentative immédiate
      - 2ème tentative après 2s
      - 3ème tentative après 5s
      - Max 3 tentatives
    - **400** (bad request) ou **401** (auth error) : **Pas de retry**, échec immédiat

**When** toutes les tentatives échouent
**Then** le backend :
  - Met à jour `generation.status = 'failed'`
  - Enregistre l'erreur dans `generation.error = { message, code, timestamp }`
  - Log l'erreur dans Azure Application Insights

**When** le timeout de 120 secondes est dépassé (FR42)
**Then** le backend :
  - Annule les requêtes en cours
  - Met à jour `generation.status = 'failed'`
  - Enregistre `generation.error = { message: "Timeout dépassé", code: "TIMEOUT" }`

**When** la génération réussit
**Then** le backend :
  - Récupère l'image finale (résultat du dernier bloc IA)
  - Upload l'image vers Azure Blob (`results/{generationId}.png`)
  - Met à jour `generation.status = 'completed'`
  - Met à jour `generation.resultUrl = "https://blob.azure.net/results/{generationId}.png"`
  - Met à jour `generation.completedAt = now()`

**And** pendant l'exécution, le frontend :
  - Affiche un écran de chargement avec :
    - **Animation** : Spinner ou lottie animation
    - **Messages rotatifs** : Les messages de `animation.customization.loadingMessages[]` défilent toutes les 3-4 secondes
    - Ex: "🎨 L'IA travaille sur ton image..." → "✨ Génération en cours..." → "🚀 Presque terminé..."
  - **Polling** : Le frontend appelle `GET /api/generations/{id}` toutes les 2 secondes pour vérifier le statut
  - Dès que `generation.status === 'completed'` ou `'failed'`, passe à l'étape suivante (Story 4.7)

**Prerequisites:** Story 4.5

**Technical Notes:**
- Service : `ai-pipeline.service.ts` (nouveau service dédié)
  - Méthode `executePipeline(generationId, animationConfig, formData)`
- Clients IA :
  - OpenAI : Réutiliser `openai.client.ts` de Story 1.4
  - Google Gemini : Réutiliser `gemini.client.ts` de Story 1.4
- Execution asynchrone : Utiliser job queue (ex: Bull avec Redis) ou simple async/await
- Variables : Utiliser template engine simple (ex: `prompt.replace(/{(\w+)}/g, (_, key) => variables[key])`)
- Timeout : Utiliser `Promise.race` avec `setTimeout(120000)`
- Retry logic : Bibliothèque `p-retry` ou implémentation custom
- Chaining : Passer `previousBlockResult.imageBuffer` comme input au bloc suivant
- Polling frontend : Utiliser `useInterval` hook React (toutes les 2s)
- Messages rotatifs : Utiliser `setInterval` pour changer de message toutes les 3-4s
- Data model : `architecture.md` lignes 2070-2118 (generations) et 1948-2031 (pipeline blocks)

---

### Story 4.7 : Sauvegarde et affichage résultat

**En tant que** participant,
**Je veux** voir mon image générée et pouvoir la télécharger ou recommencer,
**Afin de** profiter de mon résultat personnalisé.

**Acceptance Criteria:**

**Given** la génération est terminée avec `status: 'completed'`
**When** le frontend détecte le statut via polling
**Then** l'écran de chargement disparaît
**And** j'affiche la page de résultat avec :
  - **Message de succès** : `animation.customization.submissionMessage` (défaut : "Merci ! Voici ton résultat")
  - **Image générée** : Affichée en grand, centrée, responsive
    - Source : `generation.resultUrl` (URL Azure Blob)
  - **Actions** :
    - **Bouton "📥 Télécharger"** (primaire) : Télécharge l'image
    - **Bouton "🔄 Recommencer"** (secondaire) : Reset et retour au début

**When** je clique "📥 Télécharger"
**Then** le navigateur télécharge l'image avec :
  - Nom de fichier : `{animation-slug}-{timestamp}.png` (ex: `summer-festival-1704124800.png`)
  - Format : PNG ou JPEG selon l'image générée

**When** je clique "🔄 Recommencer"
**Then** :
  - Le store `participantFormStore` est réinitialisé
  - Je suis redirigé vers `/a/{slug}/form` (début du formulaire)
  - Je peux repartir à zéro

**When** `animation.emailConfig.enabled === true` et j'ai fourni mon email
**Then** un message s'affiche sous l'image :
  - "📧 Un email avec ton résultat a été envoyé à {email}"

**When** la génération a échoué avec `status: 'failed'`
**Then** j'affiche une page d'erreur :
  - **Titre** : "Oups, une erreur est survenue"
  - **Message** : Message d'erreur selon le type :
    - Si `generation.error.code === 'TIMEOUT'` :
      - "La génération a pris trop de temps. Veuillez réessayer."
    - Si `generation.error.code === 'API_ERROR'` :
      - "Une erreur technique est survenue. Veuillez réessayer plus tard."
    - Sinon :
      - "Impossible de générer ton image pour le moment."
  - **Bouton** : "🔄 Réessayer" (recharge le formulaire)

**When** le résultat est affiché
**Then** le backend incrémente les compteurs :
  - `animation.stats.totalParticipations++`
  - `animation.stats.successfulGenerations++` (si completed)

**When** une erreur est survenue
**Then** le backend incrémente :
  - `animation.stats.totalParticipations++`
  - `animation.stats.failedGenerations++`

**Prerequisites:** Story 4.6

**Technical Notes:**
- Page : `app/(public)/a/[slug]/result/[generationId]/page.tsx`
- API : `GET /api/generations/{id}` pour récupérer le résultat
- Téléchargement : Utiliser `<a href={resultUrl} download={filename}>` ou fetch + Blob
  - Alternative : Backend endpoint `GET /api/generations/{id}/download` avec header `Content-Disposition: attachment`
- Reset store : Appeler `participantFormStore.reset()`
- Compteurs : Mettre à jour dans `animations.service.ts` méthode `incrementStats()`
  - Utiliser Cosmos DB `updateOne` avec `$inc` operator
- Image responsive : CSS `max-width: 100%`, `height: auto`, centré
- Error handling : Afficher message selon `generation.error.code`
- Data model : `architecture.md` lignes 2070-2118 (generations) et 1863-1923 (animation stats)

---

### Story 4.8 : Envoi email des résultats

**En tant que** participant,
**Je veux** recevoir mon résultat par email,
**Afin de** le conserver et le partager facilement.

**Acceptance Criteria:**

**Given** une génération terminée avec `status: 'completed'`
**And** `animation.emailConfig.enabled === true`
**And** le participant a fourni son email
**When** la génération réussit
**Then** le backend lance automatiquement l'envoi d'email

**When** l'email est envoyé
**Then** le backend utilise le service email configuré :
  - **Service** : SendGrid (MVP) ou Nodemailer avec SMTP
  - **From** : `noreply@app.com` ou email configuré dans env
  - **To** : `generation.formData.email`
  - **Subject** : `animation.emailConfig.subject` (défaut : "Voici ton résultat !")
  - **Body** : Template HTML avec :
    - `animation.emailConfig.body` (texte personnalisé par admin)
    - **Image générée incrustée** : `<img src="{resultUrl}" alt="Ton résultat" />`
    - **Bouton CTA** : "Voir mon résultat" → lien vers `/a/{slug}/result/{generationId}`
    - **Footer** : Nom de l'animation, lien vers l'app

**When** le template email est rendu
**Then** les variables sont remplacées :
  - `{nom}`, `{prenom}` : Données du formulaire
  - `{resultUrl}` : URL Azure Blob de l'image
  - `{animationName}` : Nom de l'animation
  - `{viewResultLink}` : Lien public vers le résultat

**When** l'envoi réussit
**Then** le backend :
  - Met à jour `generation.emailSent = true`
  - Met à jour `generation.emailSentAt = now()`

**When** l'envoi échoue (erreur SendGrid, timeout, etc.)
**Then** le backend :
  - **Retry automatique** : 3 tentatives avec backoff (2s, 5s, 10s)
  - Si toutes les tentatives échouent :
    - Met à jour `generation.emailSent = false`
    - Enregistre l'erreur dans `generation.emailError = { message, code }`
    - Log l'erreur dans Azure Application Insights avec tag `email_failure`

**When** l'email n'a pas été envoyé (échec définitif)
**Then** le participant voit quand même son résultat sur la page web
**And** aucun message "Email envoyé" n'est affiché
**And** un administrateur peut consulter les échecs dans les logs

**When** `animation.emailConfig.enabled === false`
**Then** aucun email n'est envoyé
**And** le participant voit uniquement le résultat web

**Prerequisites:** Story 4.7

**Technical Notes:**
- Service : `email.service.ts` (nouveau service)
  - Méthode `sendGenerationResult(generationId, animation, formData)`
- Provider : SendGrid SDK (`@sendgrid/mail`)
  - API Key : Variable d'env `SENDGRID_API_KEY`
  - Alternative : Nodemailer avec SMTP (pour environnement self-hosted)
- Template HTML : Utiliser fichier HTML template dans `email-templates/result.html`
  - Variables : Remplacer avec simple regex `/{(\w+)}/g`
- Image incrustée : Deux options :
  - **Option 1** : Image externe (URL Azure Blob) → `<img src="{resultUrl}" />`
  - **Option 2** : Image attachée (CID) → Plus complexe, préférer option 1 pour MVP
- Retry logic : Utiliser `p-retry` ou custom avec backoff exponentiel
- Logs : Azure Application Insights avec custom event `EmailSent` ou `EmailFailed`
- Sécurité : Valider format email avant envoi
- Rate limiting : SendGrid a des limites (100 emails/jour en free tier), gérer quotas
- Data model : `architecture.md` lignes 2070-2118 (generations avec emailSent, emailSentAt)

---

## Epic 5 : Dashboard Admin & Gestion Résultats

**Objectif :** Permettre aux admins de consulter et gérer les animations publiées, visualiser les résultats des participants, exporter les données, et suivre les statistiques en temps réel.

**User Value :** Cette epic donne aux admins un contrôle total sur leurs animations et résultats. Ils peuvent suivre les performances, exporter les données pour analyse, et gérer le cycle de vie complet de leurs animations.

**FRs couverts :** FR50-FR61 (dashboard admin & gestion résultats), FR74-FR76 (statistiques & analytics) - **15 FRs**

**Stories :**
- Story 5.1 : Dashboard admin - Liste des animations (FR50)
- Story 5.2 : Page détails animation avec statistiques (FR59, FR61, FR74, FR75, FR76)
- Story 5.3 : Consultation des résultats d'une animation (FR51, FR52, FR53)
- Story 5.4 : Téléchargement et export des résultats (FR54, FR55, FR56)
- Story 5.5 : Gestion et suppression des résultats (FR57, FR58)

**Epic Complexity:** 🟡 Medium - 5 stories couvrant dashboard, statistiques, export de données, et gestion CRUD complète des résultats.

**Dependencies:**
- Epic 2 (authentification admin)
- Epic 3 (animations créées)
- Epic 4 (résultats générés)

---

### Story 5.1 : Dashboard admin - Liste des animations

**En tant qu'** admin,
**Je veux** voir la liste de toutes mes animations avec des filtres et une recherche,
**Afin de** gérer facilement mes animations et accéder rapidement à leurs détails.

**Acceptance Criteria:**

**Given** je suis authentifié en tant qu'admin
**When** je visite `/dashboard`
**Then** j'affiche la page du dashboard avec :
  - **Header** : "Mes animations" avec bouton "+ Nouvelle animation"
  - **Filtres** :
    - **Statut** : Dropdown (Toutes / Publiées / Brouillons / Archivées)
    - **Recherche** : Input text pour rechercher par nom ou slug
  - **Table des animations** avec colonnes :
    - **Nom** : Titre de l'animation (cliquable → détails)
    - **Slug** : URL slug (badge)
    - **Statut** : Badge coloré (Publié en vert, Brouillon en gris, Archivé en orange)
    - **Participations** : Nombre total de générations
    - **Créée le** : Date de création (format court)
    - **Dernière activité** : Date de dernière participation (ou "-" si aucune)
    - **Actions** : Menu dropdown avec options (voir, éditer, dupliquer, archiver, supprimer)

**When** la liste est vide (aucune animation)
**Then** j'affiche un état vide :
  - Illustration ou icône
  - "Aucune animation créée"
  - Bouton "+ Créer ma première animation"

**When** je clique sur le bouton "+ Nouvelle animation"
**Then** je suis redirigé vers `/dashboard/animations/create` (wizard de création, Epic 3)

**When** je tape dans la recherche (ex: "festival")
**Then** la table se filtre en temps réel
**And** seules les animations avec "festival" dans le nom ou slug s'affichent

**When** je sélectionne un filtre de statut (ex: "Publiées")
**Then** seules les animations avec `status: 'published'` s'affichent

**When** je clique sur une ligne de la table
**Then** je suis redirigé vers `/dashboard/animations/{id}` (page détails, Story 5.2)

**When** je clique sur le menu "..." d'une animation
**Then** je vois les options :
  - 👁️ Voir les détails
  - ✏️ Éditer
  - 📋 Dupliquer
  - 📦 Archiver (ou Restaurer si archivée)
  - 🗑️ Supprimer

**When** je sélectionne une option du menu
**Then** l'action correspondante est exécutée (voir Story 3.10 et 3.11)

**When** la table contient plus de 10 animations
**Then** une pagination s'affiche en bas
**And** je peux naviguer entre les pages (10 animations/page)

**Prerequisites:** Story 3.9 (animations créées)

**Technical Notes:**
- Page : `app/(admin)/dashboard/page.tsx`
- API : `GET /api/animations?status={status}&search={query}&page={n}&limit=10`
- Controller : `animations.controller.ts` méthode `getAll()`
- Service : `animations.service.ts` méthode `getAnimations()`
  - Query Cosmos DB avec filtres :
    - `status` filter si spécifié
    - `$or: [{ name: /regex/ }, { slug: /regex/ }]` pour recherche
    - Pagination : `skip()` et `limit()`
  - Sort : `createdAt` desc (plus récentes en haut)
- Table : ShadCN Table component ou TanStack Table
- Filtres : ShadCN Select + Input
- Recherche : Debounce de 300ms pour éviter trop de requêtes
- Pagination : ShadCN Pagination component
- État vide : Illustration custom ou lucide-react icons
- Data model : `architecture.md` lignes 1863-1923 (animations collection)

---

### Story 5.2 : Page détails animation avec statistiques

**En tant qu'** admin,
**Je veux** voir les détails et statistiques d'une animation spécifique,
**Afin de** suivre ses performances et accéder rapidement aux actions de gestion.

**Acceptance Criteria:**

**Given** je suis sur `/dashboard/animations/{id}`
**When** la page se charge
**Then** le backend appelle `GET /api/animations/{id}`
**And** j'affiche la page avec :
  - **Header** :
    - Nom de l'animation (H1)
    - Badges : Statut (Publié/Brouillon/Archivé)
    - Actions : Éditer, Dupliquer, Archiver, Supprimer
  - **Section 1 : Informations générales** (card) :
    - Slug : `app.com/a/{slug}` (cliquable, ouvre dans nouvel onglet)
    - QR Code : Image affichée + bouton télécharger (si publié)
    - Description : Texte complet
    - Date de création
    - Date de publication (si publié)
  - **Section 2 : Statistiques en temps réel** (cards) :
    - **Total participations** : Nombre de générations totales (FR74)
    - **Générations réussies** : Nombre avec `status: 'completed'`
    - **Taux de succès** : Pourcentage (réussies / totales) × 100 (FR76)
    - **Générations échouées** : Nombre avec `status: 'failed'`
    - **Temps moyen de génération** : Durée moyenne en secondes (FR76)
    - **Emails envoyés** : Nombre avec `emailSent: true`
  - **Section 3 : Graphique participations** (card) :
    - **Timeline** : Graphique ligne montrant le nombre de participations par jour sur les 7/30 derniers jours (FR75, FR60)
    - **Filtre période** : Tabs (7 jours / 30 jours / Tout)
  - **Section 4 : Actions rapides** (boutons larges) :
    - **Voir tous les résultats** → Redirige vers Story 5.3
    - **Exporter les données** → Déclenche export CSV (Story 5.4)
    - **Télécharger toutes les images** → Déclenche ZIP (Story 5.4)

**When** je clique sur le slug
**Then** l'animation publique s'ouvre dans un nouvel onglet (`/a/{slug}`)

**When** je clique "Télécharger le QR Code"
**Then** le fichier PNG du QR code est téléchargé

**When** je clique "Éditer"
**Then** je suis redirigé vers `/dashboard/animations/{id}/edit` (Story 3.10)

**When** je clique "Voir tous les résultats"
**Then** je suis redirigé vers `/dashboard/animations/{id}/results` (Story 5.3)

**When** les statistiques sont calculées
**Then** le backend :
  - Compte les générations dans `generations` collection où `animationId === id`
  - Calcule :
    - `totalParticipations = count(all generations)`
    - `successfulGenerations = count(status: 'completed')`
    - `failedGenerations = count(status: 'failed')`
    - `successRate = (successful / total) × 100`
    - `averageGenerationTime = avg(completedAt - createdAt)` (en secondes)
    - `emailsSent = count(emailSent: true)`

**When** le graphique est affiché
**Then** le backend :
  - Groupe les participations par jour : `aggregate([{ $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }])`
  - Retourne un tableau : `[{ date: "2024-01-15", count: 12 }, { date: "2024-01-16", count: 8 }, ...]`
  - Frontend affiche avec bibliothèque chart (ex: Recharts, Chart.js)

**When** je change la période du graphique (7 jours → 30 jours)
**Then** le graphique se met à jour avec les données de la nouvelle période

**Prerequisites:** Story 3.9 (animations publiées), Story 4.7 (générations créées)

**Technical Notes:**
- Page : `app/(admin)/animations/[id]/page.tsx`
- API :
  - `GET /api/animations/{id}` pour détails
  - `GET /api/animations/{id}/stats` pour statistiques
  - `GET /api/animations/{id}/timeline?period={7|30|all}` pour graphique
- Controller : `animations.controller.ts` méthodes `getStats()`, `getTimeline()`
- Service : `animations.service.ts` utilise Cosmos DB aggregation
- Graphique : Recharts library (Line chart)
- Cards : ShadCN Card component avec grid layout
- Stats : Afficher avec icônes et couleurs (vert pour succès, rouge pour échecs)
- Temps moyen : Formatter en secondes ou minutes selon valeur
- Data model : `architecture.md` lignes 1863-1923 (animations) et 2070-2118 (generations)

---

### Story 5.3 : Consultation des résultats d'une animation

**En tant qu'** admin,
**Je veux** consulter tous les résultats d'une animation avec filtres et pagination,
**Afin de** voir les images générées et les données des participants.

**Acceptance Criteria:**

**Given** je suis sur `/dashboard/animations/{id}/results`
**When** la page se charge
**Then** j'affiche :
  - **Header** :
    - "Résultats : {Nom de l'animation}"
    - Bouton "← Retour aux détails"
    - Actions : "Exporter CSV", "Télécharger toutes les images"
  - **Filtres** :
    - **Statut** : Dropdown (Tous / Réussis / Échoués)
    - **Email envoyé** : Dropdown (Tous / Envoyé / Non envoyé / N/A)
    - **Date** : Date range picker (du ... au ...)
    - **Recherche** : Input text (nom, prénom, email)
  - **Grille de résultats** : Affichage grid/cards (pas table) :
    - Chaque card contient :
      - **Image générée** (preview 200x200px, cliquable pour agrandir)
      - **Nom et prénom** (si fournis)
      - **Email** (si fourni, masqué partiellement : "j***@company.com")
      - **Date de génération** : Format relatif ("Il y a 2 heures")
      - **Statut** : Badge (Réussi en vert, Échoué en rouge, En cours en jaune)
      - **Email** : Badge (Envoyé ✓ en vert, Échec ✗ en rouge, N/A si désactivé)
      - **Menu actions** : Télécharger, Voir détails, Supprimer

**When** je filtre par "Statut : Réussis"
**Then** seules les générations avec `status: 'completed'` s'affichent

**When** je filtre par "Email envoyé : Envoyé"
**Then** seules les générations avec `emailSent: true` s'affichent

**When** je sélectionne une plage de dates
**Then** seules les générations créées dans cette période s'affichent

**When** je tape dans la recherche (ex: "Dupont")
**Then** la grille se filtre
**And** seuls les résultats avec "Dupont" dans nom, prénom, ou email s'affichent

**When** je clique sur une image
**Then** un modal s'ouvre avec :
  - Image en grande taille (fullscreen possible)
  - Toutes les données du participant (nom, prénom, email, réponses aux questions)
  - Date et heure de génération
  - Statut détaillé
  - Boutons : "Télécharger", "Fermer"

**When** je clique "Télécharger" dans le menu d'une card
**Then** l'image générée est téléchargée (Story 5.4)

**When** je clique "Supprimer" dans le menu d'une card
**Then** une confirmation apparaît (Story 5.5)

**When** il y a plus de 100 résultats
**Then** une pagination s'affiche en bas
**And** je peux naviguer entre les pages (100 résultats/page, FR53)

**When** la liste est vide (aucun résultat)
**Then** j'affiche un état vide :
  - "Aucun résultat pour le moment"
  - "Les participations apparaîtront ici une fois l'animation lancée."

**Prerequisites:** Story 5.2, Story 4.7 (générations créées)

**Technical Notes:**
- Page : `app/(admin)/animations/[id]/results/page.tsx`
- API : `GET /api/generations?animationId={id}&status={status}&emailSent={bool}&dateFrom={date}&dateTo={date}&search={query}&page={n}&limit=100`
- Controller : `generations.controller.ts` méthode `getAll()`
- Service : `generations.service.ts` méthode `getGenerations()`
  - Query Cosmos DB avec filtres multiples
  - Pagination : 100/page (FR53)
  - Sort : `createdAt` desc
- Grille : CSS Grid avec responsive (3 colonnes desktop, 1 mobile)
- Cards : ShadCN Card component avec image + infos
- Modal image : ShadCN Dialog avec carousel si multiple images
- Filtres : ShadCN Select, Input, DateRangePicker
- Recherche : Debounce 300ms
- Email masqué : Fonction custom `maskEmail("jean@company.com")` → `"j***@company.com"`
- Data model : `architecture.md` lignes 2070-2118 (generations collection)

---

### Story 5.4 : Téléchargement et export des résultats

**En tant qu'** admin,
**Je veux** télécharger les images et exporter les données des participants,
**Afin de** les utiliser pour mes rapports ou communications externes.

**Acceptance Criteria:**

**Given** je suis sur `/dashboard/animations/{id}/results`
**When** je clique "Exporter CSV" dans le header
**Then** le backend génère un fichier CSV avec :
  - **Colonnes** :
    - ID de génération
    - Date et heure
    - Nom
    - Prénom
    - Email
    - Réponses aux questions (une colonne par question : "Question 1", "Question 2", etc.)
    - URL de l'image générée
    - Statut (Réussi/Échoué)
    - Email envoyé (Oui/Non)
  - **Format** : UTF-8 avec BOM (pour Excel), séparateur `;` ou `,`
  - **Nom fichier** : `{animation-slug}-resultats-{date}.csv` (ex: `summer-festival-resultats-2024-01-15.csv`)

**When** le CSV est prêt
**Then** le navigateur télécharge automatiquement le fichier

**When** je clique "Télécharger toutes les images" dans le header
**Then** le backend :
  - Récupère toutes les images générées depuis Azure Blob
  - Les compresse dans un fichier ZIP
  - Nomme chaque image : `{nom}-{prenom}-{timestamp}.png` (ex: `Jean-Dupont-1704124800.png`)
  - Nom du ZIP : `{animation-slug}-images-{date}.zip`

**When** le ZIP est prêt
**Then** le navigateur télécharge automatiquement le fichier
**And** un loader s'affiche pendant la génération ("Préparation du téléchargement...")

**When** je clique "Télécharger" sur une image individuelle (depuis la grille)
**Then** l'image seule est téléchargée
**And** le nom du fichier est : `{animation-slug}-{nom}-{prenom}-{timestamp}.png`

**When** il y a plus de 500 images à télécharger
**Then** un warning s'affiche :
  - "Ce téléchargement contient {n} images et peut prendre plusieurs minutes."
  - Bouton "Continuer"

**When** le téléchargement batch échoue (timeout, trop lourd)
**Then** un message d'erreur s'affiche :
  - "Le téléchargement a échoué. Veuillez essayer de télécharger par lots plus petits ou nous contacter."

**Prerequisites:** Story 5.3

**Technical Notes:**
- API :
  - `GET /api/animations/{id}/export/csv` → génère et retourne CSV
  - `GET /api/animations/{id}/export/images` → génère et retourne ZIP
  - `GET /api/generations/{id}/download` → télécharge image individuelle
- Controller : `animations.controller.ts` méthodes `exportCSV()`, `exportImages()`
- Service :
  - CSV : Utiliser bibliothèque `csv-writer` ou `papaparse`
  - ZIP : Utiliser bibliothèque `archiver` (Node.js)
- Génération CSV :
  - Query toutes les générations de l'animation
  - Formatter en lignes CSV
  - Ajouter header avec noms de colonnes
- Génération ZIP :
  - Stream images depuis Azure Blob
  - Ajouter au ZIP avec `archiver.append(stream, { name })`
  - Ne pas charger toutes en mémoire (stream processing)
- Headers HTTP :
  - `Content-Type: text/csv; charset=utf-8` pour CSV
  - `Content-Type: application/zip` pour ZIP
  - `Content-Disposition: attachment; filename="{filename}"`
- Timeout : Augmenter timeout backend à 5 minutes pour gros exports
- Frontend : Afficher spinner pendant la génération
- Data model : `architecture.md` lignes 2070-2118 (generations)

---

### Story 5.5 : Gestion et suppression des résultats

**En tant qu'** admin,
**Je veux** supprimer des résultats individuels ou en masse,
**Afin de** gérer le contenu et respecter les demandes de suppression (RGPD).

**Acceptance Criteria:**

**Given** je suis sur `/dashboard/animations/{id}/results`
**When** je clique "Supprimer" dans le menu d'une card
**Then** un modal de confirmation s'affiche :
  - **Titre** : "Supprimer ce résultat ?"
  - **Message** : "Cette action est irréversible. L'image et les données du participant seront définitivement supprimées."
  - **Boutons** : "Annuler" (secondaire), "Supprimer" (danger, rouge)

**When** je confirme la suppression
**Then** `DELETE /api/generations/{id}` est appelé
**And** le backend :
  - Supprime le document de la collection `generations`
  - Supprime l'image de Azure Blob (`results/{generationId}.png`)
  - Supprime le selfie de Azure Blob (`selfies/{generationId}.jpg`)

**And** un toast confirme : "Résultat supprimé avec succès"
**And** la card disparaît de la grille
**And** les compteurs de l'animation sont mis à jour (-1 participation)

**When** je sélectionne plusieurs résultats (mode sélection)
**Then** des checkboxes apparaissent sur chaque card
**And** un header flottant s'affiche en haut :
  - "{n} résultats sélectionnés"
  - Bouton "Supprimer la sélection" (danger)
  - Bouton "Annuler la sélection"

**When** je clique "Supprimer la sélection"
**Then** un modal de confirmation s'affiche :
  - **Titre** : "Supprimer {n} résultats ?"
  - **Message** : "Cette action est irréversible. Toutes les images et données des participants sélectionnés seront définitivement supprimées."
  - **Boutons** : "Annuler", "Supprimer tout"

**When** je confirme la suppression batch
**Then** `DELETE /api/generations/batch` est appelé avec `{ ids: [...] }`
**And** le backend :
  - Supprime tous les documents en une transaction
  - Supprime toutes les images et selfies correspondants d'Azure Blob
  - Log l'opération dans Azure Application Insights

**And** un toast confirme : "{n} résultats supprimés avec succès"
**And** les cards disparaissent de la grille
**And** les compteurs sont mis à jour

**When** la suppression échoue (erreur réseau, blob introuvable)
**Then** un toast d'erreur s'affiche :
  - "Impossible de supprimer le résultat. Veuillez réessayer."

**When** je supprime un résultat dont l'email a été envoyé
**Then** le résultat est supprimé mais l'email reste dans la boîte du participant
**And** le lien dans l'email devient invalide (404)

**Prerequisites:** Story 5.3

**Technical Notes:**
- API :
  - `DELETE /api/generations/{id}` → suppression individuelle
  - `DELETE /api/generations/batch` → suppression multiple avec `{ ids: [...] }`
- Controller : `generations.controller.ts` méthodes `delete()`, `deleteBatch()`
- Service : `generations.service.ts`
  - Méthode `deleteGeneration(id)` :
    1. Récupère generation depuis DB
    2. Supprime document Cosmos DB
    3. Supprime blobs Azure (`resultUrl`, `selfieUrl`)
    4. Met à jour compteurs animation
  - Méthode `deleteGenerations(ids[])` : Boucle sur chaque ID
- Suppression Azure Blob : Utiliser `BlobServiceClient.deleteBlob()`
- Transaction : Utiliser try/catch avec rollback si échec
- Mode sélection : State React avec tableau `selectedIds[]`
- Checkboxes : Afficher conditionnellement si mode actif
- Confirmation modal : ShadCN AlertDialog
- RGPD : Logger les suppressions pour audit trail
- Data model : `architecture.md` lignes 2070-2118 (generations)

---

## Epic 6 : Écran de Visualisation Publique

**Objectif :** Fournir un écran public affichant en temps réel une galerie des images générées, avec refresh automatique et mode plein écran pour affichage sur grand écran (ex: écran événementiel).

**User Value :** Cette epic permet de créer une expérience collective en affichant les créations des participants en temps réel. Parfait pour des événements où on veut montrer les résultats sur un grand écran et créer de l'engagement.

**FRs couverts :** FR62-FR68 (écran public, galerie temps réel, filtres, fullscreen) - **7 FRs**

**Stories :**
- Story 6.1 : Galerie publique temps réel (FR62, FR63, FR64)
- Story 6.2 : Interactions et mode fullscreen (FR65, FR66, FR67, FR68)

**Epic Complexity:** 🟢 Low - 2 stories avec fonctionnalités simples de galerie et affichage. Pas de logique métier complexe.

**Dependencies:**
- Epic 3 (config display activée)
- Epic 4 (résultats générés)

---

### Story 6.1 : Galerie publique temps réel

**En tant que** visiteur (public ou organisateur),
**Je veux** voir une galerie des images générées qui se met à jour automatiquement,
**Afin de** suivre les participations en temps réel.

**Acceptance Criteria:**

**Given** une animation avec `publicDisplay.enabled === true`
**When** je visite `/a/{slug}/gallery`
**Then** la page affiche :
  - **Header** :
    - Titre de l'animation (H1)
    - Logo (si configuré)
    - Couleurs personnalisées appliquées
  - **Grille d'images** :
    - Affichage grid responsive (5 colonnes desktop, 3 tablette, 2 mobile)
    - Chaque image : 250x250px (square crop), avec effet hover zoom
    - Affichage des **100 dernières générations réussies** (FR63)
    - Ordre : Plus récentes en haut à gauche
    - Pas de nom/prénom affiché (anonyme pour respect RGPD)

**When** une animation n'a pas `publicDisplay.enabled === true`
**Then** la route `/a/{slug}/gallery` retourne 404 ou affiche :
  - "L'écran public n'est pas activé pour cette animation."

**When** la galerie se charge
**Then** le frontend :
  - Appelle `GET /api/animations/{slug}/gallery?limit=100`
  - Affiche les images avec animation fade-in séquentielle (effet cascade)

**When** le backend retourne les images
**Then** :
  - Query : `db.collection('generations').find({ animationId, status: 'completed' }).sort({ completedAt: -1 }).limit(100)`
  - Retourne : `[{ id, resultUrl, completedAt }, ...]`

**When** l'écran est actif depuis 10 secondes
**Then** le frontend lance un **polling automatique** :
  - Appelle `GET /api/animations/{slug}/gallery?since={lastFetchTimestamp}` toutes les 10 secondes (FR64)
  - Backend retourne uniquement les **nouvelles générations** créées depuis le dernier fetch

**When** de nouvelles images arrivent via polling
**Then** :
  - Les nouvelles images s'ajoutent **en haut à gauche** de la grille
  - Animation d'entrée : Slide-in + fade-in (effet smooth)
  - Les anciennes images se décalent vers la droite/bas
  - Si la limite de 100 images est atteinte, les plus anciennes en bas disparaissent (slide-out)

**When** aucune génération n'existe encore
**Then** j'affiche un état vide :
  - "Aucune création pour le moment"
  - "Les images apparaîtront ici dès que les participants commenceront à créer !"
  - Icône ou animation d'attente

**When** je navigue away et reviens sur la page
**Then** le polling se réinitialise et récupère les dernières images

**Prerequisites:** Story 3.7 (publicDisplay activé), Story 4.7 (générations créées)

**Technical Notes:**
- Page : `app/(public)/a/[slug]/gallery/page.tsx`
- API :
  - `GET /api/animations/:slug/gallery?limit=100` → Initial load
  - `GET /api/animations/:slug/gallery?since={timestamp}` → Polling (nouvelles images)
- Controller : `animations.controller.ts` méthode `getGallery()`
- Service : `animations.service.ts`
  - Méthode `getGalleryImages(slug, options)` :
    - Si `since` fourni : `createdAt > since`
    - Sinon : Retourne 100 dernières
- Polling : Utiliser `useInterval` hook React (10s)
- Grille : CSS Grid avec `grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))`
- Images : Next.js Image component avec `fill` et `object-fit: cover`
- Animations : Framer Motion ou CSS transitions
  - Entrée : `animate={{ opacity: [0, 1], y: [-20, 0] }}`
  - Sortie : `animate={{ opacity: [1, 0], y: [0, 20] }}`
- Optimisation : Lazy load images hors viewport
- Data model : `architecture.md` lignes 2070-2118 (generations)

---

### Story 6.2 : Interactions et mode fullscreen

**En tant que** visiteur ou organisateur,
**Je veux** filtrer les images, les voir en grand, et activer le mode plein écran,
**Afin de** mieux contrôler l'affichage et l'utiliser sur un écran événementiel.

**Acceptance Criteria:**

**Given** je suis sur `/a/{slug}/gallery`
**When** je vois la galerie
**Then** j'affiche des contrôles en haut :
  - **Filtres** (optionnels, FR65) :
    - **Date** : Dropdown (Aujourd'hui / Cette semaine / Tout)
    - **Recherche** : Input text (recherche par nom/prénom si l'admin active cette option)
  - **Bouton mode plein écran** : Icône ⛶ en haut à droite (FR68)

**When** je sélectionne "Aujourd'hui" dans le filtre date
**Then** seules les générations de la journée s'affichent
**And** le polling continue mais filtre aussi par date

**When** je tape dans la recherche (si activée)
**Then** la grille se filtre en temps réel
**And** seuls les résultats matchant s'affichent
**And** le polling s'arrête temporairement (reprise après 30s d'inactivité)

**When** je clique sur une image
**Then** un modal fullscreen s'ouvre avec :
  - **Image en grande taille** (max-width: 90vw, max-height: 90vh)
  - **Navigation** : Flèches gauche/droite pour passer à l'image précédente/suivante
  - **Fermeture** : Cliquer en dehors, touche ESC, ou bouton ✕
  - **Animation** : Zoom-in à l'ouverture, zoom-out à la fermeture (FR67)

**When** je navigue entre les images dans le modal
**Then** l'image change avec transition smooth (fade + slide)

**When** je clique sur le bouton "Mode plein écran" (⛶)
**Then** :
  - La page entre en mode fullscreen (API `document.documentElement.requestFullscreen()`)
  - Le header et les filtres disparaissent
  - Seule la grille d'images reste visible
  - Le bouton change en "Quitter le plein écran" (icône ⛶ avec croix)

**When** je suis en mode plein écran
**Then** :
  - Le polling continue normalement (nouvelles images arrivent)
  - Les transitions d'entrée/sortie des images sont fluides (FR67)
  - Le curseur se cache après 3 secondes d'inactivité
  - Bouger la souris fait réapparaître le curseur et le bouton de sortie

**When** je clique "Quitter le plein écran" ou j'appuie sur ESC
**Then** la page sort du mode fullscreen
**And** les contrôles réapparaissent

**When** je suis sur mobile/tablette
**Then** le mode plein écran fonctionne aussi
**And** les images s'adaptent au format portrait/paysage

**When** l'écran public est utilisé sur un grand écran (TV, vidéoprojecteur)
**Then** :
  - La grille s'adapte à la résolution (4K supporté)
  - Les images se chargent en haute qualité
  - Le polling est stable même sur longue durée (pas de memory leak)

**Prerequisites:** Story 6.1

**Technical Notes:**
- Filtres : ShadCN Select + Input
- Recherche : Utiliser debounce 500ms, appelle API avec `?search={query}`
- Modal image : ShadCN Dialog ou custom modal avec `position: fixed`, `z-index: 9999`
- Navigation modal : Utiliser touches clavier (←, →, ESC)
- Fullscreen API :
  - Entrée : `document.documentElement.requestFullscreen()`
  - Sortie : `document.exitFullscreen()`
  - Détection : Écouter event `fullscreenchange`
- Animations : Framer Motion
  - Modal : `initial={{ opacity: 0, scale: 0.8 }}` → `animate={{ opacity: 1, scale: 1 }}`
  - Navigation : `variants` avec direction (left/right)
- Curseur caché : CSS `cursor: none` après timeout 3s
- Responsive : Breakpoints pour 4K, 2K, FHD, mobile
- Performance : Utiliser `React.memo` pour éviter re-renders inutiles
- Memory leak : Nettoyer les intervals au unmount (`useEffect` cleanup)
- Data model : `architecture.md` lignes 1925-1938 (publicDisplay config)

---

# Validation de la Couverture des FRs

## Tableau récapitulatif

| **Catégorie** | **FRs** | **Epic** | **Stories** | **Statut** |
|--------------|---------|----------|-------------|-----------|
| **Authentification & Profil** | FR1-FR5 (5 FRs) | Epic 2 | 2.1-2.6 (6 stories) | ✅ **Complet** |
| **Wizard Admin (Config Animation)** | FR6-FR27 (22 FRs) | Epic 3 | 3.1-3.11 (11 stories MVP + 1 story Post-MVP) | ✅ **Complet** |
| **Expérience Participant & Génération IA** | FR28-FR49 (22 FRs) | Epic 4 | 4.1-4.8 (8 stories) | ✅ **Complet** |
| **Dashboard Admin & Gestion Résultats** | FR50-FR61 (12 FRs) | Epic 5 | 5.1-5.5 (5 stories) | ✅ **Complet** |
| **Écran Public** | FR62-FR68 (7 FRs) | Epic 6 | 6.1-6.2 (2 stories) | ✅ **Complet** |
| **Email des Résultats** | FR69-FR73 (5 FRs) | Epic 4 | 4.8 (1 story) | ✅ **Complet** |
| **Statistiques & Analytics** | FR74-FR76 (3 FRs) | Epic 5 | 5.2 (1 story) | ✅ **Complet** |
| **NFRs (Infrastructure)** | FR77-FR82 (6 FRs) | Epic 1 | 1.1-1.6 (6 stories) | ✅ **Complet** |
| **TOTAL** | **82 FRs** | **6 Epics** | **45 stories (44 MVP + 1 Post-MVP)** | ✅ **100% couvert** |

---

## Détails de couverture par Epic

### Epic 1 : Infrastructure & Foundation (6 stories)
- ✅ FR77 : Monorepo Next.js + Fastify → Story 1.1
- ✅ FR78 : Azure Cosmos DB (MongoDB API) → Story 1.2
- ✅ FR79 : Azure Blob Storage → Story 1.3
- ✅ FR80 : APIs IA (OpenAI, Gemini) → Story 1.4
- ✅ FR81 : Shared Types TypeScript → Story 1.5
- ✅ FR82 : Logging & Monitoring (Azure App Insights) → Story 1.6

### Epic 2 : Authentification (6 stories)
- ✅ FR1 : Login avec email + mot de passe → Story 2.1
- ✅ FR2 : JWT + Refresh tokens → Story 2.1
- ✅ FR3 : Signup avec email unique → Story 2.2
- ✅ FR4 : Logout (invalidation tokens) → Story 2.3
- ✅ FR5 : Page profil (édition nom, password) → Story 2.4
- ✅ **FR36** : Validation accès animation (code/email-domain) → Story 2.6

### Epic 3 : Wizard Admin (11 stories MVP + 1 story Post-MVP)
- ✅ FR6-FR8 : Wizard initialisation + Zustand store → Story 3.1
- ✅ FR9-FR11 : Step 1 - Infos générales (nom, slug, description) → Story 3.2
- ✅ FR12-FR14 : Step 2 - Config accès (code, email-domain) → Story 3.3
- ✅ FR15 : Step 2 - Champs de base (nom, prénom, email) avec labels/placeholders éditables → Story 3.3
- ✅ FR16-FR18 : Step 3 - Collecte inputs avancés (selfie, questions custom) → Story 3.4
- ✅ FR19 : Step 4 - Email config (enable, templates) → Story 3.5
- ✅ FR20-FR21 : Step 5 - Pipeline builder (drag-and-drop, blocs IA) → Story 3.6
- ✅ FR22 : Step 5 - Config blocs IA (modèle, prompt, params) → Story 3.6
- ✅ FR23 : Step 6 - Écran public (enable, config) → Story 3.8
- ✅ FR24-FR25 : Step 7 - Personnalisation (couleurs, logo, thème, messages) → Story 3.8
- ✅ FR26 : Step 8 - Publication (génération QR code, URL publique) → Story 3.9
- ✅ FR27 : Édition animation existante → Story 3.10
- ✅ **Bonus** : Dupliquer et archiver animations → Story 3.11
- 🔵 **POST-MVP** : Génération texte IA + compositing templates → Story 3.6B

### Epic 4 : Expérience Participant & Génération IA (8 stories)
- ✅ FR28-FR29 : Page accueil animation personnalisée → Story 4.1
- ✅ FR30-FR31 : Formulaire wizard multi-étapes (navigation) → Story 4.2
- ✅ FR34 : Validation temps réel des champs → Story 4.2
- ✅ FR32 : Capture selfie (webcam + upload) → Story 4.3
- ✅ FR33 : Questions custom (choice, slider, free-text) → Story 4.4
- ✅ FR35-FR37 : Soumission + validation accès + rate limiting → Story 4.5
- ✅ FR38-FR43 : Exécution pipeline IA (DALL-E, Gemini, timeout, retry) → Story 4.6
- ✅ FR44-FR48 : Sauvegarde résultat, affichage, téléchargement → Story 4.7
- ✅ FR49 : Page 404 si animation inexistante → Story 4.1
- ✅ FR69-FR73 : Email des résultats (SendGrid, templates, retry) → Story 4.8

### Epic 5 : Dashboard Admin & Gestion Résultats (5 stories)
- ✅ FR50 : Liste animations (filtres, recherche, pagination) → Story 5.1
- ✅ FR51-FR53 : Consultation résultats (grille, filtres, pagination 100) → Story 5.3
- ✅ FR54 : Téléchargement image individuelle → Story 5.4
- ✅ FR55 : Téléchargement batch (ZIP) → Story 5.4
- ✅ FR56 : Export CSV données participants → Story 5.4
- ✅ FR57-FR58 : Suppression résultats (individuel + batch) → Story 5.5
- ✅ FR59 : Statistiques temps réel → Story 5.2
- ✅ FR60 : Graphiques participations (timeline) → Story 5.2
- ✅ FR61 : Page détails animation → Story 5.2
- ✅ FR74-FR76 : Analytics (compteurs, taux succès, temps moyen) → Story 5.2

### Epic 6 : Écran Public (2 stories)
- ✅ FR62-FR63 : Galerie publique (100 dernières images) → Story 6.1
- ✅ FR64 : Refresh auto (polling 10s) → Story 6.1
- ✅ FR65 : Filtres optionnels (date, recherche) → Story 6.2
- ✅ FR66 : Zoom image (modal) → Story 6.2
- ✅ FR67 : Animations transitions → Story 6.2
- ✅ FR68 : Mode plein écran → Story 6.2

---

## Résumé des Epics

| **Epic** | **FRs** | **Stories** | **Complexity** | **Description** |
|---------|---------|-------------|----------------|-----------------|
| Epic 1 | 6 FRs (FR77-82) | 6 stories | 🟡 Medium | Infrastructure technique (Monorepo, DB, Azure, IA, Shared Types, Logs) |
| Epic 2 | 5 FRs (FR1-5) | 6 stories | 🟢 Low | Authentification et gestion profil admin |
| Epic 3 | 22 FRs (FR6-27) | 11 stories MVP + 1 story Post-MVP | 🔴 High | Wizard admin 8 étapes (création et configuration animations) |
| Epic 4 | 27 FRs (FR28-49, FR69-73) | 8 stories | 🔴 High | Expérience participant (formulaire, selfie, génération IA, email) |
| Epic 5 | 15 FRs (FR50-61, FR74-76) | 5 stories | 🟡 Medium | Dashboard admin (liste animations, stats, résultats, export) |
| Epic 6 | 7 FRs (FR62-68) | 2 stories | 🟢 Low | Galerie publique temps réel avec fullscreen |

**Total MVP : 82 FRs couverts par 44 stories répartis en 6 epics**

**Post-MVP : 1 story additionnelle (3.6B - Génération texte + compositing)**

---

## Notes finales

✅ **Tous les FRs du PRD sont couverts à 100%**

Les stories sont structurées avec :
- User stories au format **"En tant que... Je veux... Afin de..."**
- Acceptance Criteria en format **BDD (Given/When/Then)**
- Technical Notes détaillées (composants, API, services, data model)
- Prerequisites pour gérer les dépendances entre stories

### Ordre d'implémentation recommandé :
1. **Epic 1** (Foundation) - Blocker pour tous les autres
2. **Epic 2** (Auth) - Permet l'accès admin
3. **Epic 3** (Wizard) - Permet la création d'animations
4. **Epic 4** (Participant) - Cœur du produit (génération IA)
5. **Epic 5** (Dashboard) - Gestion et analytics
6. **Epic 6** (Public Display) - Feature bonus pour événements

### Améliorations Post-MVP :
- **Story 3.6B** : Génération de texte IA + compositing sur templates (cartes Pokémon, etc.)
- **Navigation hybride wizard** : Stepper cliquable avec validation progressive
- Potentielles optimisations de performance sur le polling et les exports batch

---
