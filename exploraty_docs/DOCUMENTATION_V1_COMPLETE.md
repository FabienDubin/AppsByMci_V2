# 📋 DOCUMENTATION COMPLÈTE - AppsByMCI V1
## Analyse exhaustive de l'application existante

**Date de documentation :** 21 novembre 2025
**Version analysée :** V1 (React + Express)
**Objectif :** Documentation technique complète pour servir de base à la refonte

---

## 🎯 VUE D'ENSEMBLE

AppsByMCI est une **plateforme full-stack** hébergeant **7 applications indépendantes** qui génèrent des contenus personnalisés (avatars, portraits, transformations de photos) via intelligence artificielle. Chaque application fonctionne de manière autonome avec sa propre configuration, ses propres réponses utilisateurs, et son propre dashboard administrateur.

### Applications hébergées
1. **Mercedes CLA** - Génération d'avatars basée sur un quiz
2. **Yearbook** - Transformation de photos en style annuaire américain années 80-90
3. **Adventurer Profile** - Avatars d'aventurier (photo + quiz)
4. **Astronaut Profile** - Avatars d'astronaute (photo + quiz)
5. **Event Manager** - Avatars de chef de projet événementiel avec écran d'affichage
6. **Red Portrait (Clarins)** - Portraits artistiques rouge et noir avec écran d'affichage
7. **Links Manager** - Gestionnaire de liens courts, fichiers et calendriers ICS

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack Frontend
```
Framework:           React 18.3.1
Build Tool:          Vite 6.0.5
Routing:             React Router DOM 7.1.1
HTTP Client:         Axios 1.7.9
UI Components:       Radix UI (17 packages)
Styling:             Tailwind CSS 3.4.17
Icons:               Lucide React 0.471.2
Animations:          Framer Motion 12.16.0
Charts:              Recharts 2.15.0
Date Management:     date-fns 4.1.0
Tables:              @tanstack/react-table 8.20.6
Testing:             Jest 29.7.0 + React Testing Library 16.3.0
```

### Stack Backend
```
Framework:           Express.js 4.21.2
Database:            MongoDB avec Mongoose 8.9.5
Authentication:      JWT (jsonwebtoken + express-jwt)
File Upload:         Multer + Azure Blob Storage
Email:               Mailjet
IA - Images:         OpenAI (DALL-E 3, GPT-Image-1), Google Gemini
Security:            bcryptjs, express-rate-limit
Testing:             Jest + Supertest + MongoDB Memory Server
```

### Infrastructure
- **Hébergement :** Azure App Service (inféré par les URLs de fallback)
- **Stockage :** Azure Blob Storage (4 conteneurs : avatars, profiles, linksapp, redportrait)
- **Base de données :** MongoDB (URI configurable via variables d'environnement)

---

## 📊 STRUCTURE DE LA BASE DE DONNÉES

### Collection : `users`
**Schéma :**
```javascript
{
  email: String (unique, required),
  password: String (required, hashé avec bcrypt salt=10),
  firstName: String (required),
  lastName: String (required),
  image: String (URL Azure Blob Storage),
  role: Enum ["user", "admin", "moderator"] (default: "user"),
  passwordResetTokens: [{
    token: String,
    isUsed: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Usage :** Authentification et autorisation avec système de rôles RBAC

---

### Collection : `claconfigs` (Mercedes CLA - Configuration)
**Schéma :**
```javascript
{
  code: String,                    // Code d'accès sécurisé
  questions: [{                    // Tableau de 5 questions
    questionText: String,
    options: [{
      label: String,               // Affiché à l'utilisateur
      value: String                // Utilisé dans le prompt IA
    }]
  }],
  promptTemplate: String,          // Template Mustache avec variables {{name}}, {{gender}}, {{answers}}
  createdAt: Date,
  updatedAt: Date
}
```

**Particularités :**
- Une seule instance de config dans la base (récupérée par `findOne()`)
- 5 questions exactement requises
- Template de prompt avec variables dynamiques

---

### Collection : `claresponses` (Mercedes CLA - Réponses)
**Schéma :**
```javascript
{
  name: String,
  gender: String,
  code: String,                    // Code validé
  answers: [String],               // 5 réponses correspondant aux questions
  prompt: String,                  // Prompt final généré
  imageUrl: String,                // URL de l'avatar généré par DALL-E 3 sur Azure
  createdAt: Date,
  updatedAt: Date
}
```

**Processus de création :**
1. Utilisateur remplit nom, genre, code, et répond à 5 questions
2. Backend valide le code contre la config
3. Génération du prompt via template avec réponses mappées
4. Appel DALL-E 3 (1024x1024)
5. Upload de l'image générée vers Azure
6. Sauvegarde de la réponse avec URL

---

### Collection : `yearbookconfigs` (Yearbook - Configuration)
**Schéma :**
```javascript
{
  code: String (required),
  promptTemplate: String (required, default: transformation style yearbook américain années 80-90),
  createdAt: Date,
  updatedAt: Date
}
```

---

### Collection : `yearbookresponses` (Yearbook - Réponses)
**Schéma :**
```javascript
{
  name: String (required),
  gender: String (required),
  code: String (required),
  originalImageUrl: String (required),    // Photo uploadée sur Azure
  generatedImageUrl: String (required),   // Photo transformée via OpenAI Image Edit
  prompt: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

**Processus de création :**
1. Utilisateur upload une photo ou prend un selfie via webcam
2. Validation du code
3. Upload de l'image originale vers Azure
4. Appel OpenAI Image Edit API (modèle gpt-image-1) avec photo + prompt template
5. Upload de l'image générée vers Azure
6. Sauvegarde avec les 2 URLs

---

### Collection : `adventurerconfigs` (Adventurer - Configuration)
**Schéma :**
```javascript
{
  code: String (required, default: "ADVENTURE2024"),
  questions: [{                    // 5 questions
    questionText: String,
    options: [{
      label: String,
      value: String
    }]
  }],
  promptTemplate: String (required, thème aventurier/exploration),
  createdAt: Date,
  updatedAt: Date
}
```

---

### Collection : `adventurerresponses` (Adventurer - Réponses)
**Schéma :**
```javascript
{
  name: String,
  gender: Enum ["Homme", "Femme", "Autre"],
  code: String,
  answers: [String],               // 5 réponses au quiz
  originalImageUrl: String (required),    // Photo de référence
  generatedImageUrl: String,              // Avatar aventurier généré
  prompt: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Processus de création :**
1. Utilisateur upload photo + répond au quiz
2. Mapping des réponses avec les labels des questions
3. Génération du prompt avec les variables dynamiques
4. OpenAI Image Edit avec photo de base
5. Upload et sauvegarde

---

### Collection : `astronautconfigs` (Astronaut - Configuration)
**Schéma :**
```javascript
{
  code: String (required, default: "SPACE2024"),
  questions: [{                    // 5 questions
    questionText: String,
    options: [{
      label: String,
      value: String
    }]
  }],
  promptTemplate: String (required, thème spatial/astronaute),
  createdAt: Date,
  updatedAt: Date
}
```

---

### Collection : `astronautresponses` (Astronaut - Réponses)
**Schéma :**
```javascript
{
  name: String,
  gender: Enum ["Homme", "Femme", "Autre"],
  code: String,
  answers: [String],
  originalImageUrl: String,
  generatedImageUrl: String,
  prompt: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Note :** Identique à Adventurer mais avec thème spatial

---

### Collection : `eventmanagerconfigs` (Event Manager - Configuration)
**Schéma :**
```javascript
{
  allowedDomains: [String] (default: ["@wearemci.com", "@mci-group.com"]),
  questions: [{                    // 5 questions avec types mixtes
    questionText: String,
    type: Enum ["slider", "choice"],
    // Pour type "slider" (0-4)
    sliderMin: String,             // Label valeur min
    sliderMax: String,             // Label valeur max
    // Pour type "choice"
    options: [{
      label: String,
      value: String
    }]
  }],
  promptTemplate: String (required, thème chef de projet événementiel),
  createdAt: Date,
  updatedAt: Date
}
```

**Particularité :** Questions avec 2 types différents (slider ou choix multiples)

---

### Collection : `eventmanagerresponses` (Event Manager - Réponses)
**Schéma :**
```javascript
{
  name: String,
  gender: Enum ["Homme", "Femme", "Autre"],
  email: String (required),               // Validation domaine requise
  answers: [Mixed],                       // Number (slider) ou String (choice)
  originalImageUrl: String,
  generatedImageUrl: String,
  isVisibleOnScreen: Boolean (default: true),    // Affichage sur écran public
  prompt: String,
  emailSent: Boolean (default: false),
  emailError: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Particularités :**
- Validation de l'email contre `allowedDomains`
- Envoi d'email automatique avec l'avatar
- Gestion de la visibilité sur l'écran d'affichage public

**Processus de création :**
1. Validation du domaine email
2. Upload photo + réponses au quiz
3. Mapping des réponses (interpolation pour sliders, valeurs directes pour choix)
4. Génération avatar OpenAI Image Edit
5. Envoi email automatique via Mailjet
6. Sauvegarde avec flag emailSent

---

### Collection : `links` (Links Manager)
**Schéma :**
```javascript
{
  title: String (required),
  slug: String (unique, required),
  type: Enum ["url", "file"] (required),
  url: String (required),                 // URL de destination ou URL Azure Blob
  originalFileName: String,               // Pour type "file"
  fileType: String,                       // MIME type
  allowCalendarSubscription: Boolean,     // Pour fichiers ICS
  subscriptionUrl: String,                // URL d'abonnement calendrier
  isGeneratedIcs: Boolean,                // ICS généré vs uploadé
  eventData: {                            // Pour ICS générés
    title: String,
    description: String,
    location: String,
    startDate: Date,
    endDate: Date,
    allDay: Boolean,
    recurrence: Enum ["none", "daily", "weekly", "monthly", "yearly"],
    organizer: {
      name: String,
      email: String
    }
  },
  isActive: Boolean (default: true),
  publishDate: Date,                      // Planification publication
  unpublishDate: Date,                    // Planification dépublication
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

**Méthodes du modèle :**
- `isCurrentlyActive()` - Vérifie si actif selon dates et flag isActive
- `getDisplayStatus()` - Retourne "active" | "scheduled" | "expired" | "inactive"
- `getFullUrl()` - URL complète publique `/links/:slug`
- `getFullSubscriptionUrl()` - URL d'abonnement calendrier

**Index MongoDB :**
- `slug` (unique)
- `isActive`
- `type`
- `publishDate` + `unpublishDate`

---

### Collection : `redportraitconfigs` (Red Portrait - Configuration)
**Schéma :**
```javascript
{
  accessCode: String (required, default: "RED2025"),
  isActive: Boolean (default: true),
  emailSubject: String (required),
  emailTemplate: String (required),       // Template HTML avec variables
  promptTemplate: String (required, style palette rouge et noir),
  maxDailySubmissions: Number (default: 100),
  createdAt: Date,
  updatedAt: Date
}
```

**Particularité :** Limite quotidienne de soumissions configurable

---

### Collection : `redportraitresponses` (Red Portrait - Réponses)
**Schéma :**
```javascript
{
  accessCode: String (required),
  name: String (required),
  email: String (required),
  originalImageUrl: String,
  generatedImageUrl: String,
  prompt: String,
  isVisibleOnScreen: Boolean (default: true),
  emailSent: Boolean,
  emailSentAt: Date,
  emailError: String,
  processingTime: Number,                 // Temps de traitement en ms
  openaiRequestId: String,                // ID de requête pour tracking
  createdAt: Date,
  updatedAt: Date
}
```

**Index MongoDB :**
- `email`
- `createdAt`
- `isVisibleOnScreen`

**Particularités :**
- Utilise **Google Gemini** au lieu d'OpenAI
- Tracking du temps de traitement
- Système de renvoi d'email

---

## 🔐 SYSTÈME D'AUTHENTIFICATION

### Architecture JWT Custom

**Flow d'authentification :**
1. **Login** : `POST /auth/login`
   - Validation email (regex) + password (bcrypt compare)
   - Génération token JWT avec payload `{ _id, email, role }`
   - Expiration : 6 heures
   - Algorithm : HS256
   - Secret : `process.env.TOKEN_SECRET`

2. **Stockage** : Token stocké dans `localStorage` côté client

3. **Requêtes authentifiées** :
   - Header : `Authorization: Bearer <token>`
   - Axios interceptor ajoute automatiquement le header
   - Middleware backend `isAuthenticated` via `express-jwt`

4. **Vérification** : `GET /auth/verify`
   - Valide le token
   - Retourne les infos utilisateur

5. **Logout** : Suppression du token côté client

### Rôles & Permissions

**3 rôles disponibles :**
- `user` - Utilisateur standard (peut voir son profil)
- `moderator` - Modérateur (accès dashboard lecture seule)
- `admin` - Administrateur (accès complet dashboard)

**Middleware de vérification des rôles :**
```javascript
// role.middleware.js
hasRole(allowedRoles) // Tableau de rôles autorisés
isAdmin() // Raccourci pour hasRole(['admin'])
```

**Protection des routes :**
- Routes publiques : Animations accessibles sans authentification
- Routes privées : Profil utilisateur (middleware `isAuthenticated`)
- Routes admin : Dashboard complet (middleware `isAuthenticated` + `isAdmin`)

### Reset Password

**Flow :**
1. `POST /auth/reset-password` avec email
   - Génération token unique (uuid)
   - Token stocké dans `user.passwordResetTokens[]` avec `isUsed: false`
   - Expiration : 1 heure
   - Envoi email Mailjet avec lien `/reset-password/:token`

2. `POST /auth/reset-password/:token` avec nouveau password
   - Validation token (non expiré, non utilisé)
   - Hash du nouveau password (bcrypt)
   - "Burn" du token (`isUsed: true`)
   - Update password utilisateur

### Sécurité

**Rate Limiting :**
```javascript
// rateLimit.middleware.js
loginLimiter: 5 tentatives par IP toutes les 15 minutes
```

**Validation Password :**
```javascript
Regex: /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/
// Minimum 6 caractères, 1 majuscule, 1 minuscule, 1 chiffre
```

**Validation Email :**
```javascript
Regex: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
```

**Hash Password :**
```javascript
bcrypt.hashSync(password, 10) // 10 salt rounds
```

---

## 🛤️ ARCHITECTURE DES ROUTES

### Routes Frontend (React Router v7)

**Point d'entrée :** `main.jsx`
```jsx
<BrowserRouter>
  <AuthProviderWrapper>
    <App />
  </AuthProviderWrapper>
</BrowserRouter>
```

**Routes publiques :**
```
/                          → Home (page d'accueil)
/login                     → Login (IsAnonymous)
/reset-password            → Forgot Password (IsAnonymous)
/reset-password/:token     → Reset Password avec token
/not-authorized            → Page 403
```

**Routes animations publiques :**
```
/mercedesCLA               → Quiz Mercedes CLA
/yearbook                  → Upload photo Yearbook
/adventurer                → Profil aventurier (photo + quiz)
/astronaut                 → Profil astronaute (photo + quiz)
/eventmanager              → Quiz Event Manager
/eventmanager/screen       → Écran d'affichage Event Manager
/clarins                   → Upload Red Portrait (alias /redportrait)
/clarins/screen            → Écran d'affichage Red Portrait
/links/:slug               → Résolution de lien court
```

**Routes protégées utilisateur :**
```
/profile                   → Profil utilisateur (IsPrivate)
```

**Routes admin (IsPrivate + IsAdmin) :**
```
/dashboard                 → Dashboard principal
/dashboard/users           → Gestion utilisateurs
/dashboard/links           → Gestionnaire de liens
/dashboard/mercedes        → Config + Réponses Mercedes CLA
/dashboard/yearbook        → Config + Réponses Yearbook
/dashboard/adventurer      → Config + Réponses Adventurer
/dashboard/astronaut       → Config + Réponses Astronaut
/dashboard/eventmanager    → Config + Réponses Event Manager
/dashboard/clarins         → Config + Réponses Red Portrait
/dashboard/settings        → Paramètres généraux
```

### Routes Backend (Express)

**Base URL API :** Configuration via `process.env.API_URL`

#### Routes d'authentification : `/auth`
```
POST   /auth/signup                    # Inscription (désactivée dans l'app)
POST   /auth/login                     # Connexion (avec loginLimiter)
GET    /auth/verify                    # Validation JWT
GET    /auth/moderation                # Test accès moderator/admin
GET    /auth/admin                     # Test accès admin
POST   /auth/reset-password            # Demande reset password
POST   /auth/reset-password/:token     # Confirmation reset password
```

#### Routes utilisateurs : `/users`
```
GET    /users/all                      # Liste paginée (admin)
PUT    /users/update/:id               # Mise à jour utilisateur (admin)
PUT    /users/update-image/:userId     # Upload image profil (admin)
DELETE /users/delete/:id               # Suppression (admin)
GET    /users/search                   # Recherche (admin)
POST   /users/import                   # Import masse (admin)
```

#### Routes Mercedes CLA : `/cla`
```
GET    /cla/config                     # Récupération config
POST   /cla/config                     # MAJ config (admin)
POST   /cla/submit                     # Soumission quiz (public)
GET    /cla/results                    # Liste réponses paginée (admin)
```

#### Routes Yearbook : `/yearbook`
```
GET    /yearbook/config                # Récupération config
POST   /yearbook/config                # MAJ config (admin)
POST   /yearbook/submit                # Upload + transformation (public, multer)
GET    /yearbook/results               # Liste réponses paginée (admin)
DELETE /yearbook/delete/:id            # Suppression réponse (admin)
```

#### Routes Adventurer : `/adventurer`
```
GET    /adventurer/config              # Récupération config
POST   /adventurer/config              # MAJ config (admin)
POST   /adventurer/submit              # Upload + quiz (public, multer)
GET    /adventurer/results             # Liste réponses (admin)
DELETE /adventurer/results/:id         # Suppression (admin)
```

#### Routes Astronaut : `/astronaut`
```
GET    /astronaut/config               # Récupération config
POST   /astronaut/config               # MAJ config (admin)
POST   /astronaut/submit               # Upload + quiz (public, multer)
GET    /astronaut/results              # Liste réponses (admin)
DELETE /astronaut/results/:id          # Suppression (admin)
```

#### Routes Event Manager : `/eventmanager`
```
GET    /eventmanager/config            # Récupération config
POST   /eventmanager/config            # MAJ config (admin)
POST   /eventmanager/submit            # Upload + quiz (public, multer)
GET    /eventmanager/results           # Liste réponses (admin)
DELETE /eventmanager/results/:id       # Suppression (admin)
GET    /eventmanager/screen/images     # Images pour écran (public, max 100)
PUT    /eventmanager/results/:id/visibility  # Toggle visibilité (admin)
```

#### Routes Red Portrait : `/redportrait`
```
GET    /redportrait/config             # Récupération config
POST   /redportrait/config             # MAJ config (admin)
POST   /redportrait/validate-code      # Validation code d'accès (public)
POST   /redportrait/submit             # Upload + transformation (public, multer)
GET    /redportrait/results            # Liste réponses (admin)
DELETE /redportrait/results/:id        # Suppression (admin)
PUT    /redportrait/results/:id/visibility  # Toggle visibilité (admin)
GET    /redportrait/screen/images      # Images pour écran (public, max 100)
POST   /redportrait/results/:id/resend-email  # Renvoi email (admin)
```

#### Routes Links Manager : `/links`

**Routes admin (protégées) :**
```
GET    /links/all                      # Liste tous les liens (pagination)
GET    /links/search                   # Recherche liens (titre/slug)
GET    /links/:id                      # Détail d'un lien
POST   /links/create                   # Création lien URL ou upload fichier (multer)
POST   /links/generate-ics             # Génération événement ICS
PUT    /links/update/:id               # MAJ lien
PUT    /links/update-file/:id          # MAJ avec nouveau fichier (multer)
PUT    /links/update-ics/:id           # MAJ événement ICS
PATCH  /links/reset-schedule/:id       # Reset dates publish/unpublish
DELETE /links/delete/:id               # Suppression + nettoyage Azure
```

**Routes publiques :**
```
GET    /links/public/:slug             # Redirection 301 vers URL/fichier
GET    /links/resolve/:slug            # Métadonnées JSON (pour frontend)
GET    /links/serve/:slug              # Serve fichier avec headers appropriés
GET    /links/calendar/:slug.ics       # Abonnement calendrier ICS
```

---

## 🤖 INTÉGRATIONS INTELLIGENCE ARTIFICIELLE

### Fournisseurs utilisés

**OpenAI (5 applications)**
- **DALL-E 3** : Mercedes CLA (génération pure)
- **GPT-Image-1 (Image Edit)** : Yearbook, Adventurer, Astronaut, Event Manager

**Google Gemini (1 application)**
- **gemini-2.5-flash-image-preview** : Red Portrait

### OpenAI - DALL-E 3 (Mercedes CLA)

**Endpoint :** `https://api.openai.com/v1/images/generations`

**Requête :**
```javascript
{
  model: "dall-e-3",
  prompt: promptGenere,        // Ex: "Portrait d'un homme de 35 ans, style clubbing..."
  n: 1,
  size: "1024x1024"
}
```

**Réponse :**
```javascript
{
  data: [{
    url: "https://..." // URL temporaire OpenAI (expiration ~1h)
  }]
}
```

**Post-traitement :**
1. Download de l'image depuis l'URL temporaire (axios)
2. Upload vers Azure Blob Storage (conteneur "avatars")
3. Sauvegarde de l'URL Azure permanente dans MongoDB

### OpenAI - Image Edit (Yearbook, Adventurer, Astronaut, Event Manager)

**Endpoint :** `https://api.openai.com/v1/images/edits`

**Requête (FormData multipart) :**
```javascript
FormData:
  - image: Buffer (photo de l'utilisateur)
  - prompt: String (prompt de transformation)
  - model: "gpt-image-1"
  - size: "1024x1024"
```

**Process :**
1. Photo uploadée par utilisateur (multer → memory storage)
2. Resize avec Sharp (1024x1024, quality 90)
3. Upload photo originale vers Azure
4. Création FormData avec photo + prompt
5. Appel OpenAI Image Edit
6. Upload image générée vers Azure
7. Sauvegarde des 2 URLs dans MongoDB

**Particularité :** Utilise un fichier temporaire local pour l'API OpenAI via `toFile()`

### Google Gemini (Red Portrait)

**Modèle :** `gemini-2.5-flash-image-preview`

**Configuration :**
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' })
```

**Requête :**
```javascript
const result = await model.generateContent([
  { text: promptTemplate },                    // Prompt de transformation
  {
    inlineData: {
      mimeType: 'image/png',
      data: imageBuffer.toString('base64')     // Image en base64
    }
  }
])
```

**Process :**
1. Upload photo originale vers Azure
2. Resize avec Sharp (1024x1024)
3. Conversion en base64
4. Appel Gemini avec image inline
5. Récupération URL image générée
6. Upload vers Azure (conteneur "redportrait")
7. Sauvegarde avec tracking `processingTime`

**Particularités :**
- Tracking du temps de traitement en millisecondes
- Stockage de `openaiRequestId` (même si c'est Gemini, nom de champ conservé)
- Limite quotidienne vérifiée avant traitement

---

## 📧 SYSTÈME D'EMAIL

### Provider : Mailjet

**Configuration :**
```javascript
const mailjet = require('node-mailjet').apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
)
```

### Service : `email.service.js`

**Fonction 1 : `sendAvatarEmail` (Event Manager)**
```javascript
sendAvatarEmail({ to, name, avatarUrl })
```

**Template :**
- Expéditeur : `process.env.MAILJET_SENDER` / `process.env.MAILJET_NAME`
- Sujet : "Ton avatar de chef de projet événementiel est prêt !"
- Corps HTML avec image avatar inline
- CTA : "Télécharger mon avatar"

**Fonction 2 : `sendRedPortraitEmail` (Red Portrait)**
```javascript
sendRedPortraitEmail({ to, name, subject, html })
```

**Template :**
- Sujet et HTML configurables dans `redportraitconfigs.emailSubject` et `.emailTemplate`
- Variables dynamiques : `{{name}}`, `{{portraitUrl}}`
- Thème rouge et noir

### Trigger automatique

**Event Manager :**
- Email envoyé automatiquement après génération de l'avatar
- Flag `emailSent: true` mis à jour
- Erreurs stockées dans `emailError`

**Red Portrait :**
- Email envoyé automatiquement après transformation
- Date d'envoi stockée dans `emailSentAt`
- Possibilité de renvoyer l'email via dashboard admin

---

## ☁️ STOCKAGE AZURE BLOB STORAGE

### Configuration

**Connection String :**
```javascript
const { BlobServiceClient } = require('@azure/storage-blob')

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
```

### Conteneurs utilisés

1. **avatars** : Images générées par IA (CLA, Adventurer, Astronaut, Event Manager, Yearbook)
2. **profiles** : Photos de profil des utilisateurs
3. **linksapp** : Fichiers uploadés via Links Manager (images, vidéos, PDF, ZIP, ICS)
4. **redportrait** : Portraits rouge et noir (Clarins)

### Middleware : `avatarToAzure.middleware.js`

**Fonction : `uploadImageToAzureFromUrl(imageUrl)`**

**Process :**
1. Download de l'image depuis URL (généralement URL temporaire OpenAI)
2. Génération nom unique : `avatar-{uuid}.png`
3. Création du container client
4. Upload avec `blockBlobClient.uploadData(buffer)`
5. Headers : `Content-Type: image/png`
6. Retourne URL publique Azure

### Middleware : `profileImageUploadToAzure.middleware.js`

**Upload de photos de profil utilisateurs**

**Multer configuration :**
```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }  // 10MB max
})
```

**Fonction : `uploadToAzure(file)`**
1. Génération nom : `profile-{uuid}{extension}`
2. Upload vers conteneur "profiles"
3. Retourne URL publique

### Middleware : `linksappUploadToAzure.middleware.js`

**Upload de fichiers variés (Links Manager)**

**Types autorisés :**
- Images : `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Vidéos : `video/mp4`, `video/x-msvideo`, `video/quicktime`, `video/x-ms-wmv`
- Documents : `application/pdf`, `application/zip`, `text/calendar` (ICS)

**Multer configuration :**
```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },  // 100MB max
  fileFilter: (req, file, cb) => {
    // Validation MIME type
  }
})
```

**Fonctions principales :**

1. **`uploadToAzure(file, customName)`**
   - Upload vers conteneur "linksapp"
   - Métadonnées : `originalFileName`, `uploadDate`
   - Retourne URL + métadonnées

2. **`uploadIcsToAzure(icsContent, slug)`**
   - Upload contenu ICS généré
   - Nom : `{slug}-{timestamp}.ics`
   - Headers : `Content-Type: text/calendar`

3. **`deleteFromAzure(filename)`**
   - Suppression fichier du conteneur

4. **`getFileMetadata(filename)`**
   - Récupération métadonnées (originalFileName, uploadDate)

5. **`getContentDisposition(mimeType)`**
   - `inline` : images, vidéos, PDF
   - `attachment` : ZIP, ICS, autres

---

## 📅 GÉNÉRATION DE CALENDRIERS ICS

### Service : `ics.service.js`

**Fonctionnalités :**
- Génération de fichiers calendrier .ics conformes RFC 5545
- Support événements ponctuels et récurrents
- Support événements "all-day"
- Abonnement calendrier via URL

### Fonctions principales

**1. `generateIcsContent(eventData, options)`**

**Paramètres :**
```javascript
eventData: {
  title: String,
  description: String,
  location: String,
  startDate: Date,
  endDate: Date,
  allDay: Boolean,
  recurrence: "none" | "daily" | "weekly" | "monthly" | "yearly",
  organizer: {
    name: String,
    email: String
  }
}

options: {
  method: "PUBLISH" | "REQUEST" | "CANCEL"
}
```

**Format généré :**
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AppsByMCI//Event Manager//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:uuid-unique
DTSTAMP:20251121T120000Z
DTSTART:20251125T140000Z
DTEND:20251125T160000Z
SUMMARY:Titre événement
DESCRIPTION:Description échappée
LOCATION:Lieu
ORGANIZER;CN=Nom:mailto:email@example.com
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
END:VEVENT
END:VCALENDAR
```

**2. `validateEventData(eventData)`**
- Validation des champs requis (title, startDate, endDate)
- Validation des dates (endDate > startDate)
- Retourne `{ valid: Boolean, errors: [String] }`

**3. `formatDateForIcs(date, allDay)`**
- All-day : `YYYYMMDD` (ex: 20251125)
- Heure précise : `YYYYMMDDTHHMMSSZ` (ex: 20251125T140000Z)

**4. `escapeIcsText(text)`**
- Échappement caractères spéciaux : `,`, `;`, `\n`, `\`
- Conformité RFC 5545

**5. `formatOrganizer(organizer)`**
- Format : `ORGANIZER;CN={name}:mailto:{email}`

**6. `validateAndFormatRRule(recurrence)`**
- Validation règle récurrence
- Formats : `FREQ=DAILY`, `FREQ=WEEKLY`, `FREQ=MONTHLY`, `FREQ=YEARLY`

**7. `getCommonRecurrenceRules()`**
- Retourne règles prédéfinies (quotidien, hebdomadaire tous les lundis, etc.)

### Intégration dans Links Manager

**Scénarios :**

1. **Upload ICS existant**
   - Fichier .ics uploadé via multer
   - Stocké sur Azure conteneur "linksapp"
   - `isGeneratedIcs: false`
   - `allowCalendarSubscription: true` → URL d'abonnement générée

2. **Génération ICS via formulaire**
   - Remplissage `eventData` dans le dashboard
   - Appel `ics.service.generateIcsContent()`
   - Upload contenu généré vers Azure
   - `isGeneratedIcs: true`
   - `allowCalendarSubscription: true` → URL d'abonnement

**URL d'abonnement :**
```
/links/calendar/:slug.ics
```
Format compatible avec Google Calendar, Apple Calendar, Outlook

---

## 🎨 COMPOSANTS FRONTEND

### Architecture des composants

**Total : ~95 fichiers JS/JSX**
- Pages : 29 (19 publiques + 10 dashboards)
- Composants UI Radix : 31
- Composants features : ~25
- Services API : 11
- Hooks : 2

### Composants UI (Radix UI) - `/src/components/ui/`

**31 composants réutilisables** basés sur Radix UI avec styling Tailwind :

| Composant | Usage |
|-----------|-------|
| `button.jsx` | Boutons avec variants (default, destructive, outline, ghost) |
| `input.jsx` | Champs de saisie texte |
| `textarea.jsx` | Zones de texte multilignes |
| `select.jsx` | Sélecteurs dropdown |
| `checkbox.jsx` | Cases à cocher |
| `switch.jsx` | Interrupteurs on/off |
| `slider.jsx` | Curseurs de valeur (0-4 pour Event Manager) |
| `dialog.jsx` | Modales/dialogues |
| `sheet.jsx` | Panneaux latéraux coulissants |
| `alert-dialog.jsx` | Dialogues de confirmation |
| `toast.jsx` + `toaster.jsx` | Notifications temporaires |
| `table.jsx` | Tableaux avec header/body/footer |
| `card.jsx` | Cartes de contenu |
| `tabs.jsx` | Onglets (Config/Réponses dans dashboards) |
| `accordion.jsx` | Accordéons pliables |
| `calendar.jsx` | Sélecteur de date |
| `date-input.jsx` | Input de date personnalisé |
| `avatar.jsx` | Photos de profil circulaires |
| `badge.jsx` | Badges/labels colorés |
| `popover.jsx` | Popover flottants |
| `dropdown-menu.jsx` | Menus déroulants |
| `navigation-menu.jsx` | Menu de navigation |
| `sidebar.jsx` | Sidebar admin avec état collapse |
| `separator.jsx` | Séparateurs visuels |
| `progress.jsx` | Barres de progression |
| `skeleton.jsx` | Skeletons pour loading |
| `tooltip.jsx` | Info-bulles au survol |
| `alert.jsx` | Messages d'alerte (info, warning, error) |
| `label.jsx` | Labels de formulaire |
| `chart.jsx` | Charts avec Recharts |

### Composants de layout

**`Navbar.jsx`** (175 lignes)
- Logo avec lien vers home
- Avatar utilisateur avec dropdown
- Liens : Dashboard, Profile
- Toggle theme (light/dark)
- Logout button

**`Sidebar.jsx`** (dans `/components/Sidebar/`)
- Navigation admin avec 9 items :
  - Dashboard
  - Users (icône UsersRound)
  - Links (icône Link)
  - Mercedes (icône Car)
  - Yearbook (icône BookUser)
  - Adventurer (icône Compass)
  - Astronaut (icône Rocket)
  - Event Manager (icône CalendarDays)
  - Clarins (icône Palette)
- État collapse/expand persistant
- Active state sur route courante

**`Layout.jsx`**
- Wrapper global avec `SidebarProvider`
- Intégration Navbar + Sidebar + contenu

### Composants de protection de routes

**`IsPrivate.jsx`**
```jsx
// HOC pour routes authentifiées
if (!isLoggedIn) redirect("/login")
```

**`IsAdmin.jsx`**
```jsx
// HOC pour routes admin
if (user?.role !== "admin") redirect("/not-authorized")
```

**`IsAnonymous.jsx`**
```jsx
// HOC pour pages login/signup
if (isLoggedIn) redirect("/")
```

### Composants par application

Chaque application a une structure similaire dans son dashboard :

**Pattern de dashboard :**
```
ApplicationDashboard.jsx
  ├─ Tabs (Config / Réponses)
  │   ├─ ConfigTab.jsx           # Formulaire de configuration
  │   └─ ResponsesTab.jsx         # Tableau des réponses avec pagination
```

**Tailles des composants (lignes de code) :**
- ConfigTab : 5700-9500 lignes (très volumineux)
- ResponsesTab : 4500-15000 lignes (très volumineux)

**Composants communs dans ResponsesTab :**
- Table avec tri, pagination, recherche
- ResultSheet.jsx : Sheet latéral avec détail d'une réponse
- Boutons : Download image, Delete, Toggle visibility (si applicable)
- Filtres et statistiques

### Composants spécialisés

**`LinkResolver.jsx`** (195 lignes)
- Résout les liens courts `/links/:slug`
- Affiche le contenu dans une iframe (si URL)
- Download automatique (si fichier)

**`IcsGenerator.jsx`** (606 lignes)
- Formulaire de création d'événements ICS
- Champs : titre, description, lieu, dates, récurrence
- Preview du fichier ICS généré

**`UserImport.jsx`** (8643 lignes)
- Import masse d'utilisateurs depuis CSV/Excel
- Validation des données
- Preview avant import
- Rapport d'import

**`BackgroundPath.jsx`** (5266 lignes)
- Fond animé SVG pour la page d'accueil
- Animations Framer Motion

**`ChartTemplate.jsx`, `PieChartTemplate.jsx`, `BarChartTemplate.jsx`**
- Templates de charts Recharts pour le dashboard

---

## 📱 DESCRIPTION DES APPLICATIONS

### 1. Mercedes CLA - Quiz Avatar

**URL publique :** `/mercedesCLA`
**Dashboard admin :** `/dashboard/mercedes`

**Fonctionnement :**
1. Page avec fond noir obligatoire (thème dark)
2. Header avec logo Mercedes CLA
3. Formulaire :
   - Code d'accès
   - Nom
   - Genre
   - 5 questions à choix multiples (2-4 options par question)
4. Soumission → Génération prompt via template
5. Appel DALL-E 3 pour génération avatar (1024x1024)
6. Affichage de l'avatar généré
7. Possibilité de télécharger l'image

**Dashboard admin :**
- **Onglet Config** :
  - Champ code d'accès
  - 5 questions avec leurs options (label affiché + value pour prompt)
  - Template de prompt avec variables `{{name}}`, `{{gender}}`, `{{answer1}}` à `{{answer5}}`
- **Onglet Réponses** :
  - Tableau paginé de toutes les soumissions
  - Colonnes : Nom, Genre, Date, Preview avatar
  - ResultSheet avec détails complets

**Particularités :**
- Thème sombre obligatoire
- Logo Mercedes CLA custom
- Génération pure (pas de photo de référence)

---

### 2. Yearbook - Transformation Photo Style Annuaire

**URL publique :** `/yearbook`
**Dashboard admin :** `/dashboard/yearbook`

**Fonctionnement :**
1. Page avec interface d'upload photo
2. Options :
   - Upload fichier (jpg, png, max 10MB)
   - Selfie via webcam avec preview
3. Formulaire :
   - Code d'accès
   - Nom
   - Genre
4. Soumission → Upload photo originale vers Azure
5. Appel OpenAI Image Edit pour transformation style yearbook années 80-90
6. Affichage photo avant/après
7. Téléchargement possible

**Dashboard admin :**
- **Onglet Config** :
  - Code d'accès
  - Template de prompt (transformation style annuaire américain)
- **Onglet Réponses** :
  - Tableau avec preview image originale et transformée
  - Download des 2 images
  - Suppression possible

**Particularités :**
- Support webcam avec capture
- Transformation basée uniquement sur photo (pas de quiz)
- Style visuel années 80-90

---

### 3. Adventurer Profile - Avatar Aventurier

**URL publique :** `/adventurer`
**Dashboard admin :** `/dashboard/adventurer`

**Fonctionnement :**
1. Interface combinant upload photo + quiz
2. Upload photo de référence (fichier ou webcam)
3. Formulaire :
   - Code d'accès (default: "Mci")
   - Nom
   - Genre
   - 5 questions à choix multiples (profil aventurier)
4. Soumission → Génération prompt dynamique
5. OpenAI Image Edit avec photo de base
6. Avatar full-body style aventurier/explorateur
7. Téléchargement

**Dashboard admin :**
- **Onglet Config** :
  - Code d'accès
  - 5 questions personnalisables (ex: "Terrain favori ?", "Équipement essentiel ?")
  - Template prompt avec variables `{{name}}`, `{{gender}}`, `{{answers}}`
- **Onglet Réponses** :
  - Photos originales + avatars générés
  - Détail des réponses au quiz
  - Download et suppression

**Particularités :**
- Photo + quiz combinés
- Thème aventure/exploration
- Prompt influencé par les réponses

---

### 4. Astronaut Profile - Avatar Astronaute

**URL publique :** `/astronaut`
**Dashboard admin :** `/dashboard/astronaut`

**Fonctionnement :**
Identique à Adventurer Profile mais avec thème spatial/futuriste

1. Upload photo + quiz 5 questions
2. Code par défaut : "SPACE2024"
3. Questions sur le profil d'astronaute
4. Génération avatar style spatial/futuriste
5. Téléchargement

**Dashboard admin :**
- Même structure que Adventurer
- Questions thématiques spatiales
- Template prompt orienté espace/technologie

---

### 5. Event Manager - Avatar Chef de Projet Événementiel

**URL publique :** `/eventmanager`
**Dashboard admin :** `/dashboard/eventmanager`
**Écran public :** `/eventmanager/screen`

**Fonctionnement :**
1. Validation email avec domaines autorisés (`@wearemci.com`, `@mci-group.com`)
2. Upload photo + quiz 5 questions
3. Questions avec **2 types** :
   - **Slider** (0-4) : ex "Niveau d'organisation" → interpolation entre 2 extrêmes
   - **Choice** : choix multiples classiques
4. Génération avatar full-body chef de projet événementiel
5. **Envoi automatique d'email** avec l'avatar
6. Téléchargement
7. Avatar affiché sur écran public (si `isVisibleOnScreen: true`)

**Dashboard admin :**
- **Onglet Config** :
  - Domaines email autorisés (array)
  - 5 questions avec type (slider ou choice)
  - Template prompt
- **Onglet Réponses** :
  - Tableau avec colonne Email
  - Statut email (envoyé/erreur)
  - Toggle visibilité sur écran
  - Renvoi email possible
  - Suppression

**Écran d'affichage (`/eventmanager/screen`) :**
- Layout masonry 3 colonnes
- Scroll automatique infini (1px par frame)
- Refresh toutes les 5 secondes
- Overlay avec nom + date de création
- Compteur de créations affiché
- Uniquement les submissions avec `isVisibleOnScreen: true`

**Particularités :**
- Validation domaine email stricte
- Questions mixtes (slider + choice)
- Email automatique avec template Mailjet
- Écran d'affichage en temps réel

---

### 6. Red Portrait (Clarins) - Portrait Rouge & Noir

**URL publique :** `/clarins` (alias `/redportrait`)
**Dashboard admin :** `/dashboard/clarins`
**Écran public :** `/clarins/screen`

**Fonctionnement :**
1. Validation code d'accès (default: "RED2025")
2. Vérification limite quotidienne (default: 100/jour)
3. Upload photo ou selfie webcam avec flip horizontal
4. Formulaire :
   - Nom
   - Email
5. Transformation via **Google Gemini** (style artistique rouge & noir, high-contrast)
6. **Envoi automatique d'email** avec portrait
7. Téléchargement
8. Portrait affiché sur écran public

**Dashboard admin :**
- **Onglet Config** :
  - Code d'accès
  - Active/Inactive (toggle global)
  - Limite quotidienne
  - Template email (sujet + HTML avec variables)
  - Template prompt Gemini
- **Onglet Réponses** :
  - Photos originales + portraits générés
  - Colonnes : Nom, Email, Date, Temps de traitement (ms)
  - Statut email (envoyé/erreur)
  - Toggle visibilité sur écran
  - **Renvoi email** manuel
  - Suppression

**Écran d'affichage (`/clarins/screen`) :**
- Layout masonry 4 colonnes
- Fond gradient rouge/noir
- Scroll automatique infini
- Effets hover : scale + overlay rouge semi-transparent
- Badge "Rouge & Noir" sur chaque image
- Refresh automatique toutes les 5 secondes
- Uniquement `isVisibleOnScreen: true`

**Particularités :**
- **Google Gemini** au lieu d'OpenAI
- Limite quotidienne configurable
- Tracking du temps de traitement
- Possibilité de renvoyer l'email
- Thématique rouge et noir (Clarins)
- Écran d'affichage avec effets visuels avancés

---

### 7. Links Manager - Gestionnaire de Liens Courts

**Dashboard admin uniquement :** `/dashboard/links`
**Résolution publique :** `/links/:slug`

**Types de liens supportés :**

1. **Lien URL**
   - Redirection vers URL externe
   - Slug personnalisé
   - Planification publish/unpublish

2. **Fichier uploadé**
   - Upload vers Azure (images, vidéos, PDF, ZIP, max 100MB)
   - Serve avec headers appropriés (inline ou download)
   - Slug personnalisé

3. **Événement ICS**
   - Génération de fichier calendrier via formulaire
   - Ou upload d'un .ics existant
   - Abonnement calendrier via URL `/links/calendar/:slug.ics`
   - Support récurrence (quotidien, hebdomadaire, etc.)

**Fonctionnement :**

**Création (dashboard admin) :**
1. Choix du type (URL, Upload, ICS Event)
2. Configuration :
   - Titre, slug personnalisé
   - URL de destination OU upload fichier OU formulaire événement
   - Dates de publication/dépublication (optionnelles)
   - Pour ICS : option "Allow calendar subscription"
3. Sauvegarde → URL publique générée : `/links/:slug`

**Accès public :**
1. `/links/:slug` → Redirection 301 ou serve fichier
2. `/links/calendar/:slug.ics` → Fichier ICS pour abonnement calendrier

**Dashboard admin :**
- Tableau paginé de tous les liens
- Colonnes : Titre, Slug, Type, Status (active/scheduled/expired), Dates, Actions
- Filtres : Type, Status
- Recherche par titre/slug
- Actions : Edit, Delete, Copy URL
- Modal de création/édition avec formulaire dynamique selon type
- Pour ICS Event : Formulaire complet (titre, description, dates, récurrence, organisateur)

**Planification :**
- `publishDate` : Lien actif à partir de cette date
- `unpublishDate` : Lien désactivé à partir de cette date
- Status calculé dynamiquement :
  - `scheduled` : avant publishDate
  - `active` : entre publish et unpublish
  - `expired` : après unpublishDate
  - `inactive` : flag `isActive: false`

**Particularités :**
- Slugs personnalisés et uniques
- Support de nombreux types de fichiers
- Génération ICS conforme RFC 5545
- Abonnement calendrier (import dans Google Calendar, Apple Calendar, Outlook)
- Statistiques de clics (prévu mais non implémenté dans le code analysé)
- Reset des dates de planification possible

---

## 🔄 FLUX DE DONNÉES COMPLETS

### Flux d'authentification

```
1. User submit login form
   ↓
2. POST /auth/login
   ↓
3. Backend :
   - Validation email/password
   - Génération JWT token
   ↓
4. Response { authToken: "..." }
   ↓
5. Frontend :
   - Stockage dans localStorage
   - Mise à jour AuthContext
   ↓
6. Requêtes suivantes :
   - Axios interceptor ajoute header Authorization
   - Backend vérifie JWT via express-jwt
```

### Flux de création d'animation (exemple : Mercedes CLA)

```
1. Admin configure l'animation
   ↓
2. Dashboard → POST /cla/config
   {
     code: "CLA2025",
     questions: [5 questions],
     promptTemplate: "..."
   }
   ↓
3. Backend → Sauvegarde CLAConfig
   ↓
4. User accède à /mercedesCLA
   ↓
5. Frontend → GET /cla/config
   ↓
6. Affichage du formulaire avec questions dynamiques
   ↓
7. User soumet réponses
   ↓
8. POST /cla/submit
   {
     name: "John",
     gender: "Homme",
     code: "CLA2025",
     answers: ["reponse1", "reponse2", ...]
   }
   ↓
9. Backend :
   a. Validation code
   b. Mapping answers → labels
   c. Génération prompt via template
   d. Appel DALL-E 3
   e. Download image depuis OpenAI
   f. Upload vers Azure Blob Storage
   g. Sauvegarde CLAResponse
   ↓
10. Response { imageUrl: "https://azure...", ... }
    ↓
11. Frontend affiche l'avatar généré
    ↓
12. User télécharge l'image
```

### Flux avec photo + quiz (exemple : Event Manager)

```
1. User accède à /eventmanager
   ↓
2. GET /eventmanager/config
   ↓
3. Affichage formulaire (email + photo + quiz)
   ↓
4. User remplit et soumet
   ↓
5. POST /eventmanager/submit (multipart/form-data)
   {
     name: "Jane",
     email: "jane@wearemci.com",
     gender: "Femme",
     photo: File,
     answers: [2, "choice1", 3, ...]  // Mixed types (sliders + choices)
   }
   ↓
6. Backend :
   a. Validation domaine email
   b. Resize photo avec Sharp (1024x1024)
   c. Upload photo originale → Azure
   d. Mapping answers (interpolation sliders, valeurs choices)
   e. Génération prompt
   f. OpenAI Image Edit avec photo + prompt
   g. Upload image générée → Azure
   h. Sauvegarde EventManagerResponse
   i. Envoi email automatique via Mailjet
   j. Update emailSent: true
   ↓
7. Response { generatedImageUrl: "...", emailSent: true }
   ↓
8. Frontend affiche l'avatar
   ↓
9. En parallèle : Écran /eventmanager/screen
   ↓
10. GET /eventmanager/screen/images (polling 5s)
    ↓
11. Backend → Find submissions avec isVisibleOnScreen: true
    ↓
12. Response [{ name, generatedImageUrl, createdAt }, ...]
    ↓
13. Écran affiche masonry layout avec scroll auto
```

### Flux de gestion de liens (exemple : ICS Event)

```
1. Admin accède à /dashboard/links
   ↓
2. Clic "Create New Link" → type "ICS Event"
   ↓
3. Formulaire événement :
   - Titre, slug
   - Titre événement, description, lieu
   - Dates (start, end, all-day ?)
   - Récurrence (none, daily, weekly, etc.)
   - Organisateur (nom, email)
   - Allow calendar subscription ?
   ↓
4. POST /links/generate-ics
   {
     title: "Conférence MCI",
     slug: "conf-mci-2025",
     eventData: { ... },
     allowCalendarSubscription: true
   }
   ↓
5. Backend :
   a. Génération contenu ICS via ics.service.js
   b. Upload ICS vers Azure
   c. Création Link document
      - type: "file"
      - url: Azure ICS URL
      - isGeneratedIcs: true
      - subscriptionUrl: "/links/calendar/conf-mci-2025.ics"
   ↓
6. Response { link: { ... }, fullUrl: "/links/conf-mci-2025" }
   ↓
7. User public accède à /links/conf-mci-2025
   ↓
8. GET /links/public/conf-mci-2025
   ↓
9. Backend :
   a. Vérification isActive + dates
   b. Serve fichier ICS
   c. Headers : Content-Type: text/calendar, Content-Disposition: attachment
   ↓
10. Browser download du fichier ICS
    ↓
11. User importe dans son calendrier (une fois)
    ↓
12. Ou : User ajoute URL d'abonnement
    /links/calendar/conf-mci-2025.ics
    ↓
13. Calendrier se synchronise automatiquement
```

---

## 📈 STATISTIQUES DU CODE

### Frontend (`/client/src/`)

**Pages :** 29 fichiers
- Pages publiques : 19
- Dashboards admin : 10

**Composants :** ~56 fichiers
- UI Radix : 31
- Features : ~25

**Services API :** 11 fichiers
- auth.service.js
- users.service.js
- cla.service.js
- yearbook.service.js
- adventurer.service.js
- astronaut.service.js
- eventmanager.service.js
- redportrait.service.js
- links.service.js
- screen.service.js
- example.service.js

**Hooks :** 2 fichiers
- use-toast.js
- use-mobile.jsx

**Contextes :** 1 fichier
- auth.context.jsx

**Total lignes de code frontend :** ~35000 lignes (estimation)

### Backend (`/server/`)

**Modèles :** 14 fichiers
- User.model.js
- CLAConfig.model.js + CLAResponse.model.js
- YearbookConfig.model.js + YearbookResponse.model.js
- AdventurerConfig.model.js + AdventurerResponse.model.js
- AstronautConfig.model.js + AstronautResponse.model.js
- EventManagerConfig.model.js + EventManagerResponse.model.js
- RedPortraitConfig.model.js + RedPortraitResponse.model.js
- Link.model.js

**Controllers :** 9 fichiers
- auth.controller.js
- user.controller.js
- cla.controller.js
- yearbook.controller.js
- adventurer.controller.js
- astronaut.controller.js
- eventmanager.controller.js
- redportrait.controller.js
- links.controller.js

**Routes :** 10 fichiers
- index.route.js
- auth.route.js
- users.route.js
- cla.route.js
- yearbook.route.js
- adventurer.route.js
- astronaut.route.js
- eventmanager.route.js
- redportrait.route.js
- links.route.js

**Middleware :** 7 fichiers
- jwt.middleware.js
- role.middleware.js
- rateLimit.middleware.js
- cloudinary.middleware.js
- avatarToAzure.middleware.js
- profileImageUploadToAzure.middleware.js
- linksappUploadToAzure.middleware.js

**Services :** 2 fichiers
- email.service.js
- ics.service.js

**Total lignes de code backend :** ~8000 lignes (estimation)

---

## 🔑 VARIABLES D'ENVIRONNEMENT

### Backend (server/.env)

```bash
# Serveur
PORT=5005

# Base de données
MONGODB_URI=mongodb+srv://...
# Ou construction manuelle :
MONGODB_USER=...
MONGODB_PASSWORD=...
MONGODB_HOST=...

# JWT
TOKEN_SECRET=...

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=...

# OpenAI
OPENAI_API_KEY=...

# Google Gemini
GEMINI_API_KEY=...

# Mailjet
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
MAILJET_SENDER=noreply@example.com
MAILJET_NAME=AppsByMCI

# CORS Origins (séparés par virgules)
ORIGIN=http://localhost:5173,https://appsbymci.azurewebsites.net

# Admins (emails séparés par virgules)
ADMINS=admin@example.com,admin2@example.com
```

### Frontend (client/.env)

```bash
# API Backend
VITE_API_URL=http://localhost:5005
# Ou production :
VITE_API_URL=https://appsbymci-server.azurewebsites.net

# Fallback pour images
VITE_FALLBACK_IMG=https://storagemercedescla01.blob.core.windows.net/...

# Password par défaut (pour développement)
VITE_DEFAULT_PASS=Pass123
```

---

## 🚀 COMMANDES & SCRIPTS

### Frontend (client/)

```bash
npm run dev          # Démarrage Vite dev server (port 5173)
npm run build        # Build production (dist/)
npm run preview      # Preview du build
npm run lint         # ESLint
npm test            # Jest tests
```

### Backend (server/)

```bash
npm run dev         # Démarrage avec nodemon (hot reload)
npm start          # Démarrage production
npm test           # Jest tests
```

---

## 🎨 DESIGN SYSTEM

### Tailwind Configuration

**Mode sombre :** Class-based (`.dark`)

**Couleurs personnalisées :**
```javascript
colors: {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted))",
  accent: "hsl(var(--accent))",

  // Charts
  chart: {
    1: "hsl(var(--chart-1))",
    2: "hsl(var(--chart-2))",
    // ... jusqu'à 5
  },

  // Sidebar
  sidebar: {
    background: "hsl(var(--sidebar-background))",
    foreground: "hsl(var(--sidebar-foreground))",
    // ...
  }
}
```

**Animations :**
- `accordion-down` / `accordion-up` (Radix Accordion)
- Animations Framer Motion (page transitions, hover effects)

### Thème

**Provider :** `ThemeProvider.jsx`
- Support 3 modes : light, dark, system
- Persistance dans localStorage
- Toggle via composant dans Navbar

---

## 🧪 TESTS

### Frontend (Jest + React Testing Library)

**Fichiers de tests :**
- `src/components/__tests__/AdminAuthFlow.test.jsx`
- `src/components/__tests__/Login.test.jsx`
- `src/components/__tests__/SignUp.test.jsx`
- `src/components/__tests__/AuthContext.test.jsx`

**Configuration :** `jest.config.js`
- Environment : jsdom
- Transform : babel-jest pour JSX
- Setup : @testing-library/jest-dom

### Backend (Jest + Supertest)

**Fichiers de tests :**
- Tests dans `tests/` ou `__tests__/`
- MongoDB Memory Server pour tests d'intégration

**Configuration :** `jest.config.js`
- Environment : node
- Coverage : v8

---

## 📊 PATTERNS & CONVENTIONS

### Architecture Backend

**Pattern MVC adapté :**
- **Models** : Schémas Mongoose avec méthodes
- **Controllers** : Logique métier pure
- **Routes** : Définition endpoints + middleware
- **Services** : Intégrations externes (email, ICS)

### Architecture Frontend

**Pattern Component-Based :**
- **Pages** : Containers avec logique business
- **Components/UI** : Composants réutilisables stateless
- **Components/Features** : Composants métier avec état
- **Services** : Abstraction API calls
- **Context** : État global (Auth)

### Naming Conventions

**Backend :**
- Modèles : PascalCase (User.model.js)
- Controllers : camelCase (auth.controller.js)
- Routes : kebab-case pour endpoints (/reset-password)

**Frontend :**
- Composants : PascalCase (MercedesCLA.jsx)
- Services : camelCase (auth.service.js)
- Hooks : use-prefix (use-toast.js)
- Variables : camelCase

### Structure de données

**Pagination :**
```javascript
{
  docs: [...],      // Documents
  totalDocs: 100,
  limit: 20,
  page: 1,
  totalPages: 5,
  hasNextPage: true,
  hasPrevPage: false
}
```

**API Responses :**
```javascript
// Success
{ data: { ... } }
{ message: "Success" }

// Error
{ message: "Error message" }
```

---

## 🔍 POINTS TECHNIQUES IMPORTANTS

### Duplication de code

**Observation :** Les 6 applications (CLA, Yearbook, Adventurer, Astronaut, Event Manager, Red Portrait) partagent **énormément de code similaire** :

- Structure Config/Response identique
- ConfigTab et ResponsesTab très similaires (~90% de code dupliqué)
- Logique de dashboard identique (pagination, tri, recherche)
- Processus de génération d'avatar similaire

**Exemple :**
- `AdventurerConfig` vs `AstronautConfig` : Identiques sauf le thème
- `adventurer.controller.js` vs `astronaut.controller.js` : 95% identiques

### Questions avec types mixtes

**Event Manager** utilise 2 types de questions :

1. **Slider (0-4)** :
   ```javascript
   {
     questionText: "Ton niveau d'organisation ?",
     type: "slider",
     sliderMin: "Totalement désorganisé",
     sliderMax: "Hyper organisé"
   }
   // Réponse : 0-4 (Number)
   // Mapping : Interpolation entre min et max
   ```

2. **Choice** :
   ```javascript
   {
     questionText: "Ton outil favori ?",
     type: "choice",
     options: [
       { label: "Excel", value: "spreadsheet_master" },
       { label: "Trello", value: "kanban_lover" }
     ]
   }
   // Réponse : "spreadsheet_master" (String)
   ```

### Génération de prompt dynamique

**Template Mustache :**
```javascript
promptTemplate: "Portrait d'un {{gender}} nommé {{name}}, {{answer1}}, {{answer2}}, ..."
```

**Variables disponibles :**
- `{{name}}` : Nom utilisateur
- `{{gender}}` : Genre
- `{{answer1}}` à `{{answer5}}` : Réponses mappées

**Exemple concret (Mercedes CLA) :**
```javascript
// Template
"Portrait full-body d'un {{gender}} de 35 ans, style {{answer1}}, dans l'ambiance {{answer2}}, ..."

// Données
name: "John"
gender: "homme"
answers: ["branché et moderne", "boîte de nuit exclusive", ...]

// Prompt généré
"Portrait full-body d'un homme de 35 ans, style branché et moderne, dans l'ambiance boîte de nuit exclusive, ..."
```

### Upload et transformation d'images

**Pipeline complet (Event Manager) :**

1. **Upload utilisateur**
   ```javascript
   // Multer memory storage
   const file = req.file  // Buffer
   ```

2. **Resize avec Sharp**
   ```javascript
   const resizedBuffer = await sharp(file.buffer)
     .resize(1024, 1024)
     .jpeg({ quality: 90 })
     .toBuffer()
   ```

3. **Upload original vers Azure**
   ```javascript
   const originalUrl = await uploadToAzure(resizedBuffer, 'original-uuid.jpg')
   ```

4. **Transformation IA**
   ```javascript
   // OpenAI Image Edit
   const formData = new FormData()
   formData.append('image', resizedBuffer)
   formData.append('prompt', generatedPrompt)

   const response = await openai.images.edit(formData)
   const generatedImageUrl = response.data[0].url
   ```

5. **Download image générée**
   ```javascript
   const imageBuffer = await axios.get(generatedImageUrl, { responseType: 'arraybuffer' })
   ```

6. **Upload image générée vers Azure**
   ```javascript
   const finalUrl = await uploadToAzure(imageBuffer, 'generated-uuid.jpg')
   ```

7. **Sauvegarde en DB**
   ```javascript
   const response = new EventManagerResponse({
     originalImageUrl: originalUrl,
     generatedImageUrl: finalUrl,
     ...
   })
   await response.save()
   ```

### Écrans d'affichage en temps réel

**Technique utilisée :**
- Polling toutes les 5 secondes
- Query MongoDB avec `isVisibleOnScreen: true`
- Limit 100 images (Event Manager) ou 100 (Red Portrait)
- Tri par `createdAt` descendant

**Scroll infini :**
```javascript
// Duplication des images pour boucle seamless
const duplicatedImages = [...images, ...images, ...images]

// Scroll automatique
useEffect(() => {
  const interval = setInterval(() => {
    scrollContainerRef.current.scrollTop += 1  // 1px par frame

    // Reset si fin atteinte
    if (scrollTop >= scrollHeight / 3) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, 16)  // ~60fps
}, [])
```

**Layout masonry :**
- CSS Flexbox avec direction column
- 3 ou 4 colonnes selon l'application
- Images avec aspect-ratio préservé
- Hover effects (scale, overlay)

---

## 🎯 RÉSUMÉ DES INTERCONNEXIONS

### Applications → Backend

Chaque application suit le même pattern :

```
Application Frontend
  ↓ (API call)
Config Service (GET /app/config)
  ↓
Backend Controller
  ↓
MongoDB (AppConfig)
  ↓
Response JSON
  ↓
Frontend affiche formulaire
```

```
User soumet formulaire
  ↓ (API call)
Submit Service (POST /app/submit + FormData si photo)
  ↓
Backend Controller
  ├─ Validation (code, email domain)
  ├─ Upload photo → Azure (si applicable)
  ├─ Génération prompt
  ├─ Appel IA (OpenAI ou Gemini)
  ├─ Download image générée
  ├─ Upload image → Azure
  ├─ Envoi email (si applicable)
  └─ Sauvegarde AppResponse
  ↓
Response JSON { imageUrl, ... }
  ↓
Frontend affiche résultat
```

### Admin → Backend

```
Admin Dashboard
  ↓ (GET /app/results)
Backend Controller
  ↓
MongoDB AppResponse.find().paginate()
  ↓
Response JSON { docs, page, totalPages, ... }
  ↓
Frontend affiche tableau paginé
```

```
Admin modifie config
  ↓ (POST /app/config)
Backend Controller
  ├─ Validation (questions count, etc.)
  └─ Update AppConfig
  ↓
Response JSON { config }
  ↓
Frontend affiche succès
```

### Authentification → Toutes les routes

```
User login
  ↓
Frontend stocke token dans localStorage
  ↓
Toutes les requêtes suivantes
  ↓
Axios interceptor ajoute header Authorization
  ↓
Backend middleware express-jwt vérifie token
  ├─ Valid → req.payload = { _id, email, role }
  └─ Invalid → 401 Unauthorized
  ↓
Controller accède à req.payload.role
  ↓
Middleware hasRole(["admin"]) vérifie
  ├─ Authorized → next()
  └─ Unauthorized → 403 Forbidden
```

### Storage Azure → Applications

```
Image générée par IA
  ↓
uploadImageToAzureFromUrl(openaiUrl)
  ├─ Download depuis OpenAI
  ├─ Upload vers conteneur "avatars"
  └─ Return URL publique Azure
  ↓
Stockée dans MongoDB (imageUrl field)
  ↓
Frontend affiche <img src={azureUrl} />
```

### Email → Event Manager & Red Portrait

```
Génération avatar complète
  ↓
Backend controller
  ↓
Appel email.service.sendAvatarEmail()
  ↓
Mailjet API v3.1
  ├─ From: MAILJET_SENDER
  ├─ To: user.email
  ├─ Subject: "Ton avatar est prêt !"
  └─ HTML: Template avec image avatar inline
  ↓
Email envoyé
  ↓
Update AppResponse.emailSent = true
```

### Links Manager → Calendrier ICS

```
Admin crée ICS Event
  ↓
Frontend POST /links/generate-ics
  ↓
Backend ics.service.generateIcsContent(eventData)
  ├─ Génération contenu ICS (RFC 5545)
  └─ Return ICS string
  ↓
linksappUploadToAzure.uploadIcsToAzure(icsContent, slug)
  ├─ Upload vers conteneur "linksapp"
  └─ Return Azure URL
  ↓
Création Link document
  ├─ type: "file"
  ├─ url: Azure ICS URL
  ├─ isGeneratedIcs: true
  └─ subscriptionUrl: "/links/calendar/:slug.ics"
  ↓
User accède à /links/calendar/:slug.ics
  ↓
Backend serve ICS file
  ├─ Headers: Content-Type: text/calendar
  └─ Response: ICS content
  ↓
User importe dans son calendrier
```

---

## 📚 CONCLUSION

Cette application full-stack est une **plateforme modulaire** hébergeant 7 applications indépendantes partageant une infrastructure commune. Chaque application suit un pattern similaire :

**Pattern Config/Response :**
1. Configuration admin (code, questions, prompt template)
2. Page publique avec formulaire
3. Génération de contenu via IA
4. Dashboard admin pour visualiser les résultats

**Points forts :**
- Architecture claire et bien organisée
- Composants UI réutilisables (Radix)
- Authentification robuste avec rôles
- Intégrations IA multiples (OpenAI + Gemini)
- Stockage fiable (Azure Blob Storage)
- Écrans d'affichage en temps réel

**Points d'amélioration identifiés :**
- Duplication massive de code (ConfigTab, ResponsesTab)
- Besoin de coder en dur chaque nouvelle animation
- Déploiements lourds pour petites modifications
- Pas de système de preview avant publication
- Gestion des médias basique (pas de DAM centralisé)

Cette documentation sert de base complète pour comprendre le fonctionnement actuel et préparer une refonte architecture.

---

**Document créé le :** 21 novembre 2025
**Analysé par :** Claude Code (Anthropic)
**Lignes totales de code :** ~43000 lignes
**Nombre de fichiers :** ~120 fichiers JS/JSX
