# Brainstorming Session Results

**Session Date:** 2025-11-21
**Facilitator:** Business Analyst Mary
**Participant:** Fab

## Session Start

**Contexte du projet :**

Fab souhaite refaire complètement AppsByMCI (actuellement en React + Express) pour passer à une V2 avec :

**Stack technique visée :**

- Frontend : Next.js (au lieu de React + Vite)
- Backend : Fastify + TypeScript (préférence pour la performance) ou Express + TypeScript
- Architecture : CMS plutôt que code en dur

**Problèmes de la V1 à résoudre :**

- Duplication massive de code (7 applications similaires codées en dur)
- Besoin de recoder pour chaque nouvelle animation
- Déploiements lourds pour petites modifications
- Fab est sollicité à chaque nouveau besoin

**Vision V2 - Workflow de création d'animation :**

1. Bouton "Créer une nouvelle animation"
2. Configuration complète via interface :
   - Nom de l'animation
   - Éléments visuels (fond, etc.)
   - Questions (nombre flexible, bouton "ajouter une question")
   - Configuration du prompt
   - Méthode d'accès (code de sécurité OU vérification email)
   - Personnalisation du prompt de sortie
   - Format d'image attendu
   - Choix du modèle IA (OpenAI, Google Gemini, etc.)

**Objectifs :**

- Gagner du temps sur les déploiements
- Ne plus être sollicité pour recoder à chaque nouveau besoin
- Apprendre Next.js et intégrer un CMS
- Haute granularité de personnalisation pour chaque animation

**Approche sélectionnée :** Parcours progressif (4 techniques complémentaires)

**Parcours de brainstorming conçu pour AppsByMCI V2 :**

**Phase 1 - Déconstruction (15-20 min) : First Principles Thinking**

- _Pourquoi_ : On va déconstruire ton système actuel jusqu'aux fondamentaux pour identifier ce qui est vraiment essentiel vs ce qui est accidentel
- _Résultat attendu_ : Comprendre les vrais besoins métier indépendamment de l'implémentation actuelle

**Phase 2 - Transformation systématique (15-20 min) : SCAMPER**

- _Pourquoi_ : Méthode structurée pour améliorer chaque aspect de ton système (Substitute, Combine, Adapt, Modify, Eliminate, Reverse)
- _Résultat attendu_ : Liste d'améliorations concrètes sur l'architecture, le workflow, le CMS

**Phase 3 - Exploration audacieuse (15-20 min) : What If Scenarios**

- _Pourquoi_ : Briser les contraintes mentales pour imaginer des possibilités radicales pour ton CMS
- _Résultat attendu_ : Idées innovantes, même folles, qui pourraient devenir des différenciateurs

**Phase 4 - Convergence & Priorisation (10-15 min)**

- _Pourquoi_ : Organiser toutes les idées générées et identifier les quick wins vs les moonshots
- _Résultat attendu_ : Plan d'action clair avec priorités

**Durée totale estimée :** 55-75 minutes

**Rationnelle du parcours :**
Ce flow te permet de d'abord comprendre en profondeur (First Principles), puis améliorer systématiquement (SCAMPER), ensuite imaginer boldement (What If), et enfin converger vers l'actionnable. C'est parfait pour une refonte architecture où tu dois à la fois rester pragmatique ET innover.

## Executive Summary

**Topic:** Refonte complète AppsByMCI V1 → V2 avec architecture CMS

**Session Goals:**

- Comprendre les besoins fondamentaux du système
- Identifier les améliorations clés vs V1
- Imaginer des possibilités audacieuses
- Prioriser les features MVP vs Sprint 2+

**Techniques Used:**

1. First Principles Thinking (déconstruction)
2. SCAMPER (amélioration systématique)
3. What If Scenarios (exploration audacieuse)
4. Convergence & Priorisation

**Total Ideas Generated:** 50+ idées concrètes

### Key Themes Identified:

**🏗️ Architecture :**

- Monorepo (Next.js + Fastify + package shared)
- Payload CMS pour extensibilité
- Blocs atomiques composables (LEGO)
- Pipeline de traitement flexible

**🤖 Intelligence IA :**

- Génération IA des questions de quiz
- Génération IA complète d'animation
- Configuration dynamique des modèles IA
- Traduction multilingue automatique

**🎨 Expérience utilisateur :**

- Wizard 8 étapes intuitif
- Personnalisation poussée (thème, UI, messages)
- Analytics avancées
- Écran visualisation ultra-configurable

**⚡ Performance & DX :**

- TypeScript partout
- Monorepo avec shared package
- CI/CD existant conservé
- POC pour futur gros projet

## Technique Sessions

### 🔍 Phase 1 : First Principles Thinking (15-20 min)

**Objectif :** Déconstruire le système jusqu'aux vérités fondamentales

**Insights découverts :**

**1. Redéfinition du produit :**

- ❌ Ce n'est PAS juste un "générateur d'avatars"
- ✅ C'est une **plateforme d'animation événementielle corporate**
- **But réel :** Créer des expériences engageantes et mémorables pour démystifier l'IA

**2. Usages multiples identifiés :**

- Photo de profil événement
- Animations pour ouverture de plénière
- Gamification (ex: cartes Pokémon)
- Écrans d'affichage en temps réel
- Expérience participative immersive

**3. Formule fondamentale d'une animation :**

```
Animation = Workflow configurable qui :
  1. Collecte des inputs (selfie optionnel + données variables)
  2. Génère du contenu personnalisé via IA (prompt construit dynamiquement)
  3. Délivre le résultat (utilisateur + écrans publics)
```

**4. Dimensions variables entre animations :**

- Traitement visuel (UI + style avatar généré)
- Type de collecte : questions à choix, sliders, texte libre, ou aucune
- Selfie requis ou non (90% des cas = oui)
- Variables pour personnalisation du prompt
- Méthode de validation (code, email, domaine)

**5. Insight clé - Le vrai problème :**

> "On va faire des templates et après on nous demandera des nouveaux templates, ça se passe toujours comme ça."

**Solution :** Pas des templates rigides, mais un **système de blocs atomiques composables** (architecture LEGO)

**6. Blocs atomiques identifiés pour le MVP :**

**Catégorie A - Collecte d'inputs (essentiels) :**

- Bloc Selfie (upload + webcam)
- Bloc Question choix multiple
- Bloc Question slider (0-4 avec labels min/max)
- Bloc Champ texte (nom, prénom, etc.)
- Bloc Email
- Bloc Code d'accès
- Bloc Validation domaine email
- Bloc Limite quotidienne de soumissions

**Catégorie B - Génération IA (essentiels) :**

- Bloc Prompt Builder avec variables dynamiques ({{name}}, {{answer1}}, etc.)
- Bloc Choix de modèle IA (OpenAI DALL-E, OpenAI Edit, Google Gemini, extensible)
- Bloc Format de sortie (résolution, style)

**Catégorie C - Délivrance & outputs (essentiels) :**

- Bloc Affichage résultat utilisateur
- Bloc Download image
- Bloc Email automatique avec template personnalisable
- Bloc Écran d'affichage public (masonry layout, scroll auto, refresh)
- Bloc Toggle visibilité sur écran

**Catégorie D - UI/UX (essentiels) :**

- Bloc Personnalisation UI (couleurs, fond, logo)
- Bloc Thème clair/sombre

**7. Features Sprint 2+ (nice-to-have avancés) :**

**Traitement graphique avancé :**

- Bloc Template Graphique (upload PNG avec zones définies)
- Bloc Placeholders (position, taille, type: image/texte)
- Bloc Post-Processing (filtres couleur, background removal, effets)
- Bloc Compositing (assembly de layers, blending modes)

**Exemple d'usage :** Cartes Pokémon

```
1. IA génère avatar → Image A
2. IA génère description → Texte B
3. Template carte avec placeholders
4. Compositing : Image A + Texte B sur template
5. Post-processing : filtre couleur
→ Carte Pokémon finale personnalisée
```

**8. Stratégie de priorisation :**

- **Sprint 1 MVP :** Tous les blocs Catégorie A, B, C, D (gain de temps immédiat, plus de recodage)
- **Sprint 2+ :** Traitement graphique avancé (compositing, templates)

**Conclusions First Principles :**

1. Le système doit permettre de **composer** des animations, pas de **coder** des templates
2. Flexibilité totale > Templates rigides
3. Architecture en blocs atomiques = extensibilité infinie
4. 80% des besoins couverts par les blocs essentiels MVP

---

### 🔧 Phase 2 : SCAMPER - Transformation Systématique (15-20 min)

**Objectif :** Améliorer systématiquement chaque aspect du système avec 7 lentilles

---

#### **S - SUBSTITUTE (Remplacer)**

**Stack technique confirmée :**

- ✅ React + Vite → **Next.js**
- ✅ Express → **Fastify + TypeScript**
- ✅ MongoDB → **Cosmos DB avec API MongoDB** (Azure mandatory)
- ✅ Azure Blob Storage → **Garder** (Azure mandatory)
- ✅ Pas de CMS → **Payload CMS**

**Architecture repo :**

```
monorepo/
├── apps/
│   ├── frontend/        (Next.js sur Azure Static Web Apps)
│   └── backend/         (Fastify + TS sur Azure Web App)
└── packages/
    └── shared/          (Types TS, constantes, utils, schémas)
                         (npm package → Azure Artifacts)
```

**DevOps confirmé :**

- Frontend : Azure Static Web Apps
- Backend : Azure Web App
- Database : Cosmos DB (API MongoDB)
- CI/CD : Existant, fonctionne bien
- Preview deployments : Non nécessaire (push direct sur main)

---

#### **C - COMBINE (Combiner)**

**1. Payload CMS + Configuration dynamique des modèles IA**

**Insight clé :** Créer une collection Payload "AI Models" pour rendre le système extensible sans code.

**Structure de config modèle :**

```typescript
AIModel {
  name: "OpenAI DALL-E 3",
  provider: "openai",
  modelId: "dall-e-3",
  apiEndpoint: "https://api.openai.com/v1/images/generations",
  requestFormat: {
    bodyTemplate: {
      model: "dall-e-3",
      prompt: "{{prompt}}",
      n: 1,
      size: "1024x1024"
    },
    headers: {
      "Authorization": "Bearer {{OPENAI_API_KEY}}",
      "Content-Type": "application/json"
    }
  },
  responseMapping: {
    imageUrl: "data[0].url"
  },
  requiresImage: false,
  supportsImageEdit: false
}
```

**Avantage :** Ajouter un nouveau modèle IA = ajouter une config dans Payload, pas de code !

**2. Package shared - Contenu :**

- Types TypeScript partagés (modèles DB, API contracts)
- Constantes (blocs disponibles, configurations)
- Utilitaires (validation, helpers)
- Schémas de validation (Zod ou équivalent)

**3. Modèles IA - Liste déroulante simple**

- Pas de cascade (trop lent pour UX)
- Sélection d'un seul modèle par animation
- Modèles disponibles : OpenAI DALL-E, OpenAI Edit, Gemini, Flux, extensible
- Post-processing dans un bloc séparé

---

#### **A - ADAPT (Adapter)**

**1. Wizard par étapes > Block builder complexe**

**Décision :** Wizard progressif avec dépendances entre étapes (plus simple et adapté au besoin)

**Architecture du wizard en 8 étapes :**

**Étape 1 : Informations générales**

- Nom de l'animation
- Description
- URL slug (ex: /animations/mon-event-2025)

**Étape 2 : Configuration d'accès**

- Type de validation : Code / Email / Domaine email / Aucune
- [Conditionnel] Configuration selon le choix

**Étape 3 : Collecte d'inputs**

- Selfie requis ? Oui/Non
- **[✨ FEATURE INNOVANTE] Génération IA des questions**
  - Bouton "Générer des questions avec IA"
  - Modal : Description thématique + Nombre de questions + Type
  - Meta-prompt OpenAI structuré
  - Questions pré-remplies éditables
- Ajout manuel de champs :
  - Champ texte (nom, prénom, email...)
  - Question choix multiple
  - Question slider

**Meta-prompt pour génération de questions :**

```
Tu es un expert en création de quiz pour événements corporate.

Contexte de l'animation : {{userDescription}}
Nombre de questions : {{questionCount}}
Type de questions : {{questionType}}

Génère {{questionCount}} questions engageantes avec 3-4 options de réponse.
Les réponses doivent être variées et créatives.

Format JSON attendu :
{
  "questions": [
    {
      "questionText": "...",
      "options": [
        {"label": "...", "value": "..."},
        ...
      ]
    }
  ]
}
```

**Étape 4 : Pipeline de traitement (FLEXIBLE !)**

**Insight clé :** Le pipeline ne peut pas être fixe, l'ordre des blocs doit être configurable.

**Blocs de traitement disponibles (drag & drop) :**

```
┌─────────────────────────────┐
│ 📦 Pre-processing           │
│ ├─ Background removal       │
│ ├─ Crop/Resize             │
│ ├─ Filters                 │
│ └─ + Ajouter bloc          │
├─────────────────────────────┤
│ 🤖 IA Generation           │
│ ├─ Choix modèle (dropdown) │
│ ├─ Prompt builder          │
│ └─ Format de sortie        │
├─────────────────────────────┤
│ 🎨 Post-processing         │
│ ├─ Filters                 │
│ ├─ Compositing (Sprint 2+) │
│ └─ + Ajouter bloc          │
└─────────────────────────────┘

Aperçu du pipeline :
Input → [Pre-proc] → [IA] → [Post-proc] → Output
        ↑ Ordre modifiable par drag & drop (@dnd-kit)
```

**Exemples de pipelines différents :**

**Pipeline A - Carte Pokémon (Sprint 2+) :**

```
Selfie → Background removal → IA Anime → Compositing template → Filtre couleur
```

**Pipeline B - Portrait yearbook :**

```
Selfie → IA Transformation → Filtre sépia
```

**Pipeline C - Avatar pur :**

```
Quiz (pas de selfie) → IA Génération DALL-E → Aucun post-proc
```

**Étape 5 : Configuration email**

- Activer envoi email ? Oui/Non
- Sujet avec variables : `{{name}}`, `{{eventName}}`, `{{imageUrl}}`
- Template HTML (textarea simple + preview)
  - Variables disponibles : `{{name}}`, `{{email}}`, `{{imageUrl}}`, `{{customVar1-N}}`
- Sender config (email, nom)
- Option : Attacher image ou juste lien ?

**Décision édition email :** Simple textarea HTML + variables + preview (améliorer plus tard si besoin)

**Étape 6 : Écran d'affichage public (optionnel)**

- Activer écran public ? Oui/Non
- Layout : Masonry 3 cols / 4 cols
- Afficher nom sur image ? Oui/Non
- Refresh auto toutes les X secondes

**Étape 7 : Personnalisation UI**

- Couleur primaire
- Logo (upload)
- Image de fond (upload ou couleur unie)
- Thème (clair/sombre/auto)

**Étape 8 : Récapitulatif & Publication**

- Preview de la configuration complète
- [Bouton] Sauvegarder comme brouillon
- [Bouton] Publier l'animation

**2. Patterns de la V1 à conserver**

- ✅ Système de questions dynamiques (déjà flexible)
- ✅ Écran d'affichage public (scroll infini, masonry, refresh auto)
- ✅ Système d'email automatique avec templates
- ✅ Validation par code/domaine email
- ✅ Limite quotidienne de soumissions

---

#### **M - MODIFY / MAGNIFY (Modifier / Amplifier)**

**Décisions d'amplification :**

**1. Personnalisation étendue (intégrée dans le builder) :**

- Messages personnalisables
- Textes des boutons customisables
- Instructions modifiables
- **Thème étendu :**
  - Couleur primaire
  - Couleur secondaire
  - Permet de personnaliser tout le questionnaire utilisateur

**2. Expérience utilisateur :**

- Animations et transitions simples mais efficaces
- Design normalisé mais personnalisable via thème
- UX fluide et professionnelle

**3. Dashboard Analytics par animation :**

- Nombre de participants
- Taux de complétion
- Visualisation des données
- Statistiques de performance

**4. Dashboard Admin - Actions par animation :**

- Consulter toutes les générations
- Télécharger image par image
- **Télécharger toutes les images en bulk** (ZIP)
- Accès direct à l'écran de visualisation
- Filtrer/rechercher dans les résultats

**5. Écran de visualisation - Personnalisation étendue :**

- Nombre de colonnes (2, 3, 4, 5...)
- Style de défilement (vitesse, direction, smooth/step)
- Layout (masonry, grid uniforme, carousel...)
- Affichage du nom sur l'image (oui/non)
- Overlay personnalisé
- Refresh automatique (intervalle configurable)

---

#### **P - PUT TO OTHER USES (Réutiliser autrement)**

**Focus actuel :** Événements corporate

**Ouvertures futures :**

- Événements B2C
- API externe + iframe embedable (Post MVP x 1000)
  - Intégration dans plateformes tierces
  - iframe du questionnaire
  - Webhook/API retourne l'image générée au système externe

---

#### **E - ELIMINATE (Éliminer)**

**Éléments éliminés de la V1 :**

- ❌ Les 7 applications codées en dur → Remplacées par système de blocs
- ❌ Duplication massive de code → Éliminée avec architecture CMS
- ❌ Dashboards séparés par app → Un seul dashboard unifié
- ❌ Signup public → Admin crée les users manuellement
- ❌ Reset password avec tokens → Gestion manuelle directe

**Système de rôles - Approche hybride :**

**Structure DB (Sprint 1 - prévoir maintenant) :**

```typescript
User {
  email: string,
  password: string,
  role: "admin" | "editor" | "viewer",  // Rôle global
  animationPermissions: [              // Permissions par animation (Sprint 2+)
    {
      animationId: ObjectId,
      role: "owner" | "editor" | "viewer"
    }
  ]
}

Animation {
  name: string,
  createdBy: ObjectId,  // User créateur
  // ...
}
```

**Implémentation Sprint 1 (simple) :**

- Tous les users = admin global
- Structure DB prête
- Pas de UI pour permissions granulaires

**Implémentation Sprint 2+ (avancé) :**

- UI pour assigner users à animations spécifiques
- Rôles granulaires (owner/editor/viewer par animation)
- Filtrage dashboard par permissions

**Rationale :** Ajouter le champ maintenant évite une migration DB complexe plus tard, sans compliquer le Sprint 1.

---

#### **R - REVERSE / REARRANGE (Inverser / Réorganiser)**

**Idées d'inversion :**

**1. Preview en temps réel pendant la création (Nice-to-have, pas MVP) :**

- Mode preview live pendant le wizard
- Voir le résultat de chaque étape immédiatement
- → Sprint 2+ si le temps le permet

**2. Processus standard conservé :**

- Admin crée animation via wizard
- Configuration sauvegardée
- Users interagissent avec l'animation publiée
- Admin consulte les résultats

---

**Conclusions Phase 2 - SCAMPER :**

**Substitutions majeures :**

- Stack moderne : Next.js + Fastify + TypeScript + Payload CMS
- Cosmos DB + Azure (mandatory)
- Monorepo avec package shared

**Combinaisons intelligentes :**

- Payload + Config dynamique des modèles IA
- Pipeline de traitement flexible (pre-proc + IA + post-proc)
- Wizard + génération IA des questions

**Adaptations clés :**

- Wizard en 8 étapes (simple et efficace)
- Génération IA des questions de quiz (game-changer !)
- Pipeline de traitement avec drag & drop (@dnd-kit)

**Amplifications :**

- Thème étendu (primaire + secondaire)
- Analytics avancées
- Écran de visualisation ultra-personnalisable
- Download bulk des images

**Éliminations :**

- Signup public, reset password
- Code dupliqué, apps en dur
- Structure simplifiée

**Réorganisations :**

- Preview en temps réel (Sprint 2+)
- Structure rôles flexible pour évolution future

---

### 🚀 Phase 3 : What If Scenarios - Exploration Audacieuse (15-20 min)

**Objectif :** Imaginer des possibilités radicales pour différencier le produit

---

#### **What If #1 : Ressources illimitées**

**💡 IDÉE BRILLANTE : Génération IA complète de l'animation via meta-prompt**

**Concept :** Au lieu de wizard manuel, option "Générer avec IA"

**Flow proposé :**

```
Créer une nouvelle animation

[Option A]                  [Option B]
🧙 Génération IA           📝 Création manuelle
Décris ton animation       Wizard pas à pas
→ 3 minutes                → Contrôle total

Si Option A :
  ↓
Interface simple avec textarea :
"Décris l'animation que tu veux créer"
  ↓
Appel GPT-4 avec meta-prompt
  ↓
Génère config JSON complète :
  - Questions de quiz
  - Pipeline de traitement
  - Prompt IA
  - Email template
  - Thème visuel
  ↓
Wizard pré-rempli pour fine-tuning
  ↓
Publier
```

**Impact :** Création d'animation de 30-45 min → **3 minutes**

**Décision :** Alternative au wizard (pas remplacement), laisse le choix à l'utilisateur

---

#### **What If #2 : IA qui apprend des animations passées**

**Concept :** Système qui analyse les animations réussies et suggère des optimisations

**Exemples :**

- "Les animations similaires utilisent ces questions"
- "Taux de complétion optimal avec 4 questions max"
- "Validation par code = +20% participation vs email"

**Décision :** 📝 **Idée géniale, consignée pour beaucoup plus tard** (trop complexe pour app simple actuelle)

---

#### **What If #3 : Partage sur réseaux sociaux**

**Concept :** Bouton de partage direct après génération avatar

**Réalité corporate :** Pas de partage public pour événements corporate (majoritaires)

**Solution :** **Bloc "Partage" optionnel dans le builder**

- Désactivé par défaut (corporate)
- Activable pour événements B2C
- Choix des plateformes : Email, LinkedIn, Facebook, Instagram
- Texte de partage personnalisable

**Décision :** Nice-to-have pour événements B2C futurs

---

#### **What If #4 : Multilingue automatique**

**💡 IDÉE FORTE : Probablement demandé rapidement pour événements internationaux**

**Flow proposé :**

```
Étape Wizard : Langues

[Toggle] Activer le multilingue ?

Si Oui :
  ├─ Langue par défaut : Français
  ├─ Langues additionnelles :
  │   ☑ Anglais ☑ Espagnol ☐ Allemand ☐ Italien
  │
  └─ [Bouton] ✨ Générer les traductions IA
      │
      ├─ Traduit automatiquement :
      │   - Questions quiz
      │   - Labels boutons
      │   - Messages UI
      │   - Email templates
      │
      └─ Interface d'édition par langue
          [FR] [EN] [ES] [DE]
          Admin vérifie/ajuste

Runtime utilisateur :
  ↓
Sélecteur langue : 🇫🇷 FR | 🇬🇧 EN | 🇪🇸 ES
  ↓
Toute l'UI dans la langue choisie

Dashboard admin :
  - Voir réponses toutes langues
  - Filtrer par langue
  - Export par langue
```

**Décision :** À prioriser (risque demande client rapide)

---

## Idea Categorization

### 🚀 Sprint 1 - MVP (Must-Have Immédiat)

**Architecture & Stack :**

- Monorepo (apps/frontend + apps/backend + packages/shared)
- Next.js + Fastify + TypeScript
- Payload CMS
- Cosmos DB (API MongoDB) sur Azure
- Azure Static Web Apps + Azure Web App + Azure Blob Storage

**Blocs essentiels :**

- Bloc Selfie (upload + webcam)
- Bloc Questions (choix multiple + slider)
- Bloc Champs texte (nom, email, etc.)
- Bloc Code d'accès / Validation email / Domaine
- Bloc Prompt Builder avec variables
- Bloc Choix modèle IA (liste déroulante dynamique via Payload)
- Bloc Email automatique (textarea HTML + variables)
- Bloc Écran d'affichage public
- Bloc Personnalisation UI (couleurs primaire/secondaire, logo, fond)

**Wizard 8 étapes :**

1. Informations générales
2. Configuration d'accès
3. Collecte d'inputs (+ génération IA des questions ✨)
4. Pipeline de traitement (pre-proc → IA → post-proc avec drag & drop)
5. Configuration email
6. Écran d'affichage public
7. Personnalisation UI
8. Récap & Publication

**Dashboard Admin :**

- Liste des animations
- Analytics par animation (participants, taux complétion)
- Consulter résultats
- Download images (unitaire + bulk ZIP)
- Accès écran visualisation

**Collection Payload "AI Models" :**

- Configuration dynamique des modèles IA
- Format requête API par modèle
- Extensible sans code

**Système de rôles (structure DB uniquement) :**

- Champ `animationPermissions` prévu
- Implémentation simple : tous admins
- UI permissions granulaires → Sprint 2+

**Écran visualisation personnalisé :**

- Layouts variés (masonry, grid, carousel)
- Scroll configurable (vitesse, direction)
- Overlay personnalisé
-

### 🔥 Sprint 2+ (High Priority Nice-to-Have)

**Génération IA complète de l'animation :**

- Option alternative au wizard manuel
- Meta-prompt → Config JSON → Wizard pré-rempli
- Création en 3 minutes

**Support multilingue :**

- Toggle multilingue dans wizard
- Traduction IA automatique
- Édition par langue
- Sélecteur langue runtime
- Dashboard multi-langue

**Traitement graphique avancé :**

- Template graphique (PNG + placeholders)
- Compositing (ex: cartes Pokémon)
- Post-processing avancé (filtres, background removal)

**Permissions granulaires :**

- UI gestion rôles par animation
- Owner / Editor / Viewer
- Filtrage dashboard

**Preview en temps réel :**

- Mode preview live pendant création

### 🌙 Future / Moonshots

**Bloc partage social :**

- Pour événements B2C
- LinkedIn, Facebook, Instagram
- Texte personnalisable

**IA apprentissage animations passées :**

- Suggestions basées sur historique
- Optimisations automatiques

**API externe + iframe embedable :**

- Intégration plateformes tierces
- Webhook retour image
- Post MVP x 1000

### ❌ Éliminé Définitivement

- Signup public (admin crée users)
- Reset password avec tokens (gestion manuelle)
- 7 applications codées en dur
- Dashboards séparés par app
- Code dupliqué

### Insights and Learnings

**Insights clés de la session :**

1. **Redéfinition du produit :** AppsByMCI n'est pas un "générateur d'avatars" mais une **plateforme d'animation événementielle corporate** qui démystifie l'IA

2. **Le vrai problème :** "On va faire des templates et après on nous demandera des nouveaux templates" → Solution = **architecture en blocs atomiques composables**

3. **Game-changer #1 :** Génération IA des questions de quiz → réduit drastiquement le temps de configuration

4. **Game-changer #2 :** Génération IA complète de l'animation via meta-prompt → création en 3 minutes au lieu de 30-45 min

5. **Pipeline flexible :** L'ordre des blocs de traitement doit être configurable (pre-proc → IA → post-proc), pas figé

6. **Multilingue essentiel :** Probablement demandé rapidement pour événements internationaux → à prioriser Sprint 2

7. **AppsByMCI V2 = POC en production :** Sert aussi à tester l'architecture monorepo + Azure Artifacts pour un autre gros projet

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: Wizard 8 étapes avec génération IA des questions

**Rationale :**

- Core du système MVP
- Génération IA des questions = différenciateur immédiat
- Réduit le temps de configuration de 50%
- Techniquement faisable avec OpenAI API

**Next steps :**

1. Setup monorepo (apps/frontend + apps/backend + packages/shared)
2. Setup Payload CMS + Cosmos DB sur Azure
3. Implémenter wizard étapes 1-3 (sans IA d'abord)
4. Ajouter génération IA questions (meta-prompt OpenAI)
5. Implémenter étapes 4-8 du wizard
6. Tests utilisateur sur le flow complet

**Resources needed :**

- Fab (dev full-stack)
- OpenAI API key
- Azure subscription (Static Web App + Web App + Cosmos DB + Blob Storage)
- ShadCN + @dnd-kit pour le UI

#### #2 Priority: Pipeline de traitement flexible (drag & drop)

**Rationale :**

- Différencie complètement de la V1
- Permet des cas d'usage avancés (cartes Pokémon, compositing)
- Extensibilité infinie
- Déjà prévu dans l'architecture avec @dnd-kit

**Next steps :**

1. Définir interface des blocs de traitement (pre-proc, IA, post-proc)
2. Implémenter drag & drop avec @dnd-kit
3. Coder les blocs essentiels Sprint 1 :
   - Bloc IA Generation (DALL-E, Gemini, Flux)
   - Bloc Pre-processing basique (resize, crop)
   - Bloc Post-processing basique (filters simples)
4. Sauvegarder config pipeline en JSON
5. Runtime : exécuter pipeline dans l'ordre configuré

**Resources needed :**

- Lib @dnd-kit
- Sharp (traitement d'image)
- OpenAI + Google Gemini APIs
- Azure Blob Storage

#### #3 Priority: Collection Payload "AI Models" dynamique

**Rationale :**

- Rend le système extensible sans code
- Ajouter un nouveau modèle IA = config dans Payload, pas de déploiement
- Future-proof (nouveaux modèles sortent tout le temps)
- Relativement simple à implémenter

**Next steps :**

1. Définir schéma Payload pour AIModel collection
2. Créer interface admin Payload pour ajouter/éditer modèles
3. Implémenter système de templating pour requêtes API (variables `{{prompt}}`, `{{OPENAI_API_KEY}}`)
4. Parser `responseMapping` pour extraire l'URL d'image
5. Pré-remplir avec modèles existants (DALL-E 3, Image Edit, Gemini)
6. Tester ajout d'un nouveau modèle sans code

**Resources needed :**

- Payload CMS
- Logique de templating (mustache ou équivalent)
- Documentation APIs IA (OpenAI, Gemini, Flux...)

## Reflection and Follow-up

### What Worked Well

**🎯 Techniques utilisées :**

- **First Principles :** Déconstruction jusqu'aux vérités fondamentales = architecture en blocs atomiques
- **SCAMPER :** Amélioration systématique = stack moderne + wizard + features clés
- **What If :** Exploration audacieuse = génération IA complète + multilingue

**🔥 Insights majeurs découverts :**

1. Génération IA des questions de quiz
2. Génération IA complète de l'animation (meta-prompt)
3. Pipeline de traitement flexible
4. Support multilingue critique

### Areas for Further Exploration

**Questions techniques à approfondir :**

1. **Payload CMS + Next.js** : Quelle architecture exacte ? (Payload admin séparé ou intégré dans Next ?)
2. **Fastify + TypeScript** : Structure des routes, middlewares, validation (Zod ?)
3. **Monorepo Azure** : Configuration CI/CD pour déployer apps séparément
4. **@dnd-kit implementation** : Pattern exact pour drag & drop du pipeline
5. **Traduction IA** : Quelle API ? (OpenAI Translate, DeepL, Google Translate ?)

**Questions métier à valider :**

1. Multilingue dans Sprint 1 ou Sprint 2 ? (si demande client rapide → Sprint 1)
2. Génération IA complète dans Sprint 1 ou Sprint 2 ?
3. Priorisation exacte des blocs de traitement avancés

### Recommended Follow-up Actions

**Immédiat (cette semaine) :**

1. ✅ Créer le repo monorepo sur GitHub
2. ✅ Setup Next.js + Fastify + TypeScript
3. ✅ Installer Payload CMS localement et tester
4. ✅ Créer maquettes UI du wizard (Figma ou direct code avec ShadCN)

**Court terme (2-3 semaines) :**

1. Architecture détaillée (diagrammes, schémas DB)
2. POC : Wizard étape 1-3 fonctionnel
3. POC : Génération IA questions (meta-prompt OpenAI)
4. Setup Azure (Cosmos DB + Static Web App + Web App)

**Moyen terme (1-2 mois) :**

1. MVP complet Sprint 1
2. Tests avec premier événement réel
3. Feedback utilisateurs
4. Ajustements et Sprint 2

### Questions That Emerged

1. **Payload admin séparé ou intégré ?** (Architecture à clarifier)
2. **Cosmos DB pricing** : Combien ça coûte vs MongoDB Atlas ?
3. **Fastify vs Express + TypeScript** : Vraiment plus performant pour ce use case ?
4. **Azure Artifacts pour package shared** : Comment setup exact ?
5. **Génération IA multilingue** : Quel provider ? Coût par traduction ?

### Next Session Planning

**Prochaine étape recommandée :** Session d'**Architecture & Tech Spec** avec l'agent Architect

**Suggested topics :**

- Schéma DB détaillé (Collections Cosmos DB)
- Architecture API (routes Fastify, middlewares, validation)
- Architecture frontend (Next.js App Router, composants, state management)
- Intégration Payload CMS (admin UI, collections, hooks)
- CI/CD pipeline (GitHub Actions + Azure)
- Diagrammes (architecture système, flux de données)

**Preparation needed :**

- Document de brainstorming actuel (déjà fait ✅)
- Décision finale : Multilingue Sprint 1 ou 2 ?
- Décision finale : Génération IA complète Sprint 1 ou 2 ?

---

_Session facilitated using the BMAD CIS brainstorming framework_
