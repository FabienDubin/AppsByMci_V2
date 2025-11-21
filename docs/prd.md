# AppsByMCI_V2 - Product Requirements Document

**Author:** Fab
**Date:** 2025-11-21
**Version:** 1.0

---

## Executive Summary

AppsByMCI V2 est une plateforme d'animation événementielle corporate qui permet de créer des expériences interactives engageantes pour démystifier l'IA auprès des participants. La plateforme transforme radicalement l'approche actuelle : au lieu de développer des applications codées en dur pour chaque événement (7 applications actuellement), elle offre un système de configuration flexible basé sur des blocs composables qui permet de créer des animations personnalisées en quelques minutes via un wizard intuitif.

**Le problème résolu :**
Actuellement, chaque nouvelle animation nécessite de recoder une application complète, déployer, et maintenir du code dupliqué. Fab est sollicité à chaque nouveau besoin, les déploiements sont lourds pour de petites modifications, et l'architecture ne passe pas à l'échelle.

**La solution :**
Une plateforme CMS qui permet de composer des animations à partir de blocs atomiques (collecte de données, génération IA, personnalisation visuelle, écrans publics, etc.) avec une aide IA pour accélérer la configuration. Les admins créent des animations via un wizard en 8 étapes, génèrent un QR code, et les participants vivent une expérience personnalisée lors des événements corporate.

### Ce qui rend AppsByMCI V2 spécial

**Double différenciateur :**

1. **Démystifier l'IA par l'expérience** : Au lieu d'expliquer l'IA de manière abstraite, AppsByMCI crée des moments "wow" où les participants vivent concrètement la puissance de l'IA (avatar personnalisé, cartes Pokémon, animations interactives) lors d'événements corporate. L'IA devient tangible, ludique et mémorable.

2. **Architecture en blocs composables, pas de templates** : La grande leçon du terrain : "On va faire des templates et après on nous demandera des nouveaux templates". AppsByMCI V2 adopte une philosophie LEGO où chaque animation est une composition unique de blocs atomiques. Flexibilité totale, extensibilité infinie, zéro recoding.

**Résultat :** Une plateforme qui grandit avec les besoins sans solliciter l'équipe technique à chaque événement.

---

## Classification du projet

**Type technique :** SaaS B2B
**Domaine :** Événementiel corporate (General)
**Complexité :** Medium

**Justification de la classification :**

- **SaaS B2B** : Plateforme multi-utilisateurs avec dashboard admin, gestion d'animations multiples, système de permissions (prévu pour évolution), analytics par animation. Les clients sont des organisations qui utilisent la plateforme pour leurs événements internes.

- **Domaine General** : Bien que le domaine soit l'événementiel corporate, il n'y a pas de régulations spécifiques (pas de données de santé, pas de transactions financières, pas de contraintes légales sectorielles). Les animations collectent des données basiques (selfies, quiz, emails) avec consentement explicite lors des événements.

- **Complexité Medium** : Système complexe techniquement (génération IA multi-modèles, pipeline de traitement d'images, système de blocs composables, écrans publics temps réel) mais domaine métier bien défini et maîtrisé par l'équipe.

---

## Documents sources

**Product Brief :** Intégré dans le brainstorming
**Domain Brief :** Non applicable (domaine general)
**Research Documents :** Session de brainstorming complète (2025-11-21) couvrant :
- Déconstruction First Principles
- Amélioration systématique SCAMPER
- Exploration audacieuse What If
- Priorisation MVP vs Sprint 2+

_Toutes les décisions architecturales, fonctionnelles et techniques sont tracées dans le document de brainstorming._

---

## Critères de succès

**Pour que AppsByMCI V2 soit un succès, ces résultats doivent être atteints :**

### Succès opérationnel (Impact interne)

**1. Zéro recoding pour nouvelles animations**
- **Critère** : 100% des nouvelles animations créées via le wizard admin, sans écrire de code custom
- **Mesure** : Aucun commit de code pour "nouvelle animation" après le lancement MVP
- **Impact** : Fab et l'équipe ne sont plus sollicités à chaque événement

**2. Temps de création d'animation drastiquement réduit**
- **Avant (V1)** : 2-3 jours de dev + tests + déploiement par animation
- **Après (V2)** : 30-45 minutes de configuration via wizard (voire 3 minutes avec génération IA complète en Sprint 2+)
- **Mesure** : Temps moyen de création < 1 heure pour 90% des animations
- **Impact** : Capacité à accepter plus d'événements sans augmenter l'équipe

**3. Déploiements légers et sans friction**
- **Critère** : Modifications d'animations existantes déployées en < 5 minutes
- **Mesure** : Temps entre "modification config" et "visible en prod"
- **Impact** : Réactivité maximale pour ajustements de dernière minute

### Succès utilisateur (Expérience participants)

**4. Expériences mémorables qui démystifient l'IA**
- **Critère** : Les participants vivent un "moment wow" et comprennent concrètement la puissance de l'IA
- **Mesure qualitative** : Feedback participants post-événement ("J'ai adoré", "C'était bluffant")
- **Mesure quantitative** : Taux de complétion > 80% (participants qui vont jusqu'au bout de l'animation)
- **Impact** : L'IA devient tangible et mémorable, pas abstraite

**5. Parcours utilisateur fluide et sans friction**
- **Critère** : Participants scannent QR code → complètent animation → reçoivent résultat en < 3 minutes
- **Mesure** : Temps moyen de complétion, taux d'abandon < 20%
- **Impact** : Expérience professionnelle qui reflète bien sur le client (événement corporate)

### Succès technique (Qualité système)

**6. Flexibilité et extensibilité prouvées**
- **Critère** : Le système permet de créer des animations radicalement différentes avec les mêmes blocs
- **Validation** : 5 types d'animations différentes créées sans ajouter de nouveaux blocs au système
- **Impact** : L'architecture en blocs composables tient sa promesse

**7. POC pour gros projet futur**
- **Critère** : Architecture monorepo + Azure Artifacts validée en production
- **Mesure** : Pattern réutilisable documenté et transférable
- **Impact** : Apprentissage Next.js + architecture scalable pour projet suivant

### Métriques business (Optionnelles mais utiles)

- **Volume** : Nombre d'animations créées par mois (tendance croissante = adoption)
- **Engagement** : Nombre de participants par animation (preuve de valeur)
- **Réutilisation** : Animations réutilisées sur plusieurs événements (efficacité)

**Le succès ultime :** Fab peut partir en vacances pendant qu'un événement utilise AppsByMCI V2, et tout fonctionne sans intervention technique. 🏖️

---

## Scope du produit

### MVP - Sprint 1 (Must-Have Immédiat)

**Le MVP doit éliminer complètement le besoin de recoder pour chaque animation.** Il couvre 80% des besoins actuels avec un système flexible et extensible.

#### Architecture & Infrastructure

**Stack technique :**
- **Frontend** : Next.js 16 (App Router) avec TypeScript + ShadCN UI
- **Backend** : Fastify + TypeScript
- **Base de données** : Cosmos DB avec API MongoDB
- **Storage** : Azure Blob Storage
- **Déploiement** : Azure Static Web Apps (frontend) + Azure Web App (backend)
- **Monorepo** : Structure avec apps/frontend, apps/backend, packages/shared (NPM sans workspaces)

**Package shared (npm) :**
- Types TypeScript partagés (modèles DB, API contracts)
- Constantes et configurations
- Utilitaires (validation, helpers)
- Schémas de validation Zod

#### Wizard de création d'animation (8 étapes)

**Étape 1 : Informations générales**
- Nom de l'animation
- Description
- URL slug (ex: /animations/mon-event-2025)

**Étape 2 : Configuration d'accès**
- Type de validation : Code / Email / Domaine email / Aucune
- Configuration conditionnelle selon le choix

**Étape 3 : Collecte d'inputs**
- Selfie requis ? (Oui/Non)
- **🎯 Feature clé** : Génération IA des questions
  - Bouton "Générer des questions avec IA"
  - Description thématique + nombre + type
  - Meta-prompt OpenAI pour questions structurées
  - Questions pré-remplies éditables
- Ajout manuel de champs :
  - Champs texte (nom, prénom, email)
  - Questions choix multiple
  - Questions slider (0-4 avec labels)

**Étape 4 : Pipeline de traitement (Flexible !)**
- Architecture en blocs drag & drop (@dnd-kit)
- Blocs disponibles Sprint 1 :
  - **Pre-processing** : Crop/Resize basique
  - **IA Generation** : Choix modèle (dropdown dynamique)
  - **IA Generation** : Prompt builder avec variables `{{name}}`, `{{answer1}}`, etc.
  - **IA Generation** : Aide IA pour générer le prompt système
  - **Post-processing** : Filtres simples
- Pipeline configurable : Input → [Pre-proc] → [IA] → [Post-proc] → Output

**Étape 5 : Configuration email**
- Activer envoi email ? (Oui/Non)
- Sujet avec variables
- Template HTML simple (textarea + preview)
- Variables disponibles : `{{name}}`, `{{email}}`, `{{imageUrl}}`, `{{customVar1-N}}`
- Sender config

**Étape 6 : Écran d'affichage public**
- Activer écran public ? (Oui/Non)
- Layout : Masonry (3 ou 4 colonnes)
- Afficher nom sur image ? (Oui/Non)
- Refresh automatique (intervalle configurable)
- **🎯 Feature ajoutée** : Personnalisation étendue
  - Nombre de colonnes configurable
  - Style de défilement
  - Overlay personnalisé

**Étape 7 : Personnalisation UI**
- Couleur primaire
- Couleur secondaire (personnalisation étendue)
- Logo (upload)
- Image de fond ou couleur unie
- Thème (clair/sombre/auto)
- Messages et textes des boutons customisables

**Étape 8 : Récapitulatif & Publication**
- Preview de la configuration complète
- **🎯 Feature clé** : Génération automatique du QR code
- [Bouton] Sauvegarder comme brouillon
- [Bouton] Publier l'animation

#### Configuration modèles IA

**Approche MVP : Modèles hardcodés**

Les modèles IA sont configurés dans un fichier TypeScript pour le MVP :

**Modèles disponibles Sprint 1 :**
- **OpenAI DALL-E 3** : Génération d'images text-to-image
- **OpenAI DALL-E Edit** : Édition d'images existantes
- **Google Gemini Imagen** : Génération d'images text-to-image

**Rationale :**
- ✅ Simplicité MVP : 3 modèles suffisent pour valider le produit
- ✅ Pas de service CMS séparé à héberger (économie coûts Azure)
- ✅ Type-safe avec TypeScript, versionné Git
- ✅ API `GET /api/ai-models` expose les modèles au frontend

**Post-MVP (Sprint 2+) :**
Si besoin de gérer dynamiquement plus de modèles :
- Collection Cosmos DB `ai_models`
- UI admin pour CRUD modèles
- Ajout/modification sans redéploiement

#### Dashboard Admin

**Liste des animations :**
- Toutes les animations créées
- Statut (brouillon/publiée)
- Actions : Éditer, Dupliquer, Archiver

**Analytics par animation :**
- Nombre de participants
- Taux de complétion
- Visualisation des données
- Statistiques de performance

**Gestion des résultats :**
- Consulter toutes les générations
- Télécharger image par image
- **Télécharger toutes les images en bulk (ZIP)**
- Filtrer/rechercher dans les résultats
- Accès direct à l'écran de visualisation

#### Système de rôles (Structure DB uniquement)

**Sprint 1 - Simple :**
- Tous les users = admin global
- Structure DB prête pour évolution future
- Champ `animationPermissions` prévu (non utilisé)

**Structure DB :**
```typescript
User {
  email: string,
  password: string,
  role: "admin" | "editor" | "viewer",
  animationPermissions: [{
    animationId: ObjectId,
    role: "owner" | "editor" | "viewer"
  }] // Sprint 2+
}
```

#### Expérience participant

**Flow utilisateur :**
1. Scanne QR code ou clique lien
2. Arrive sur page animation
3. Complète les champs/questions configurés
4. Upload selfie (si requis)
5. Soumission → traitement IA
6. Reçoit résultat personnalisé
7. Option download image
8. Option email automatique
9. (Optionnel) Résultat affiché sur écran public

**Contraintes :**
- Validation selon configuration (code, email, domaine)
- Limite quotidienne de soumissions par animation

---

### Growth Features - Sprint 2+ (High Priority)

Ces features augmentent significativement la valeur mais ne bloquent pas le lancement MVP.

#### 1. Génération IA complète de l'animation (Game-changer)

**Concept :** Alternative au wizard manuel - création en 3 minutes

**Flow :**
- Option "🧙 Génération IA" vs "📝 Création manuelle"
- Textarea : "Décris l'animation que tu veux créer"
- Appel GPT-4 avec meta-prompt
- Génère config JSON complète :
  - Questions de quiz
  - Pipeline de traitement
  - Prompt IA
  - Email template
  - Thème visuel
- Wizard pré-rempli pour fine-tuning
- Publier

**Impact :** 30-45 min → 3 minutes pour configuration

#### 2. Support multilingue (Probablement demandé rapidement)

**Fonctionnalités :**
- Toggle multilingue dans le wizard
- Sélection langues additionnelles
- **Génération IA des traductions automatiques** :
  - Questions quiz
  - Labels boutons
  - Messages UI
  - Email templates
- Interface d'édition par langue (vérification/ajustements)
- Sélecteur langue pour participants
- Dashboard multi-langue (filtres, exports)

**Use case :** Événements internationaux

#### 3. Traitement graphique avancé

**Compositing & Templates :**
- Upload template graphique PNG avec zones définies
- Placeholders (position, taille, type: image/texte)
- Post-processing avancé :
  - Background removal
  - Filtres couleur
  - Effets visuels
  - Blending modes
- Compositing : assembly de layers

**Exemple d'usage :** Cartes Pokémon
```
Selfie → Background removal → IA Anime →
Compositing template → Filtre couleur → Carte finale
```

#### 4. Permissions granulaires par animation

**UI gestion rôles :**
- Assigner users à animations spécifiques
- Rôles : Owner / Editor / Viewer
- Filtrage dashboard par permissions
- Gestion multi-équipes

**Use case :** Plusieurs équipes utilisant la plateforme

#### 5. Preview en temps réel

**Feature :**
- Mode preview live pendant la création
- Voir le résultat de chaque étape immédiatement
- Tester le parcours participant depuis le wizard

---

### Vision - Future / Moonshots

Ces idées sont consignées pour exploration future quand le produit est mature.

#### 1. Bloc partage social (B2C)

**Feature :**
- Bloc "Partage" optionnel dans le builder
- Désactivé par défaut (corporate)
- Activable pour événements B2C
- Plateformes : LinkedIn, Facebook, Instagram
- Texte de partage personnalisable

**Use case :** Événements B2C publics

#### 2. IA apprentissage animations passées

**Concept :** Système qui analyse les animations réussies et suggère des optimisations

**Exemples :**
- "Les animations similaires utilisent ces questions"
- "Taux de complétion optimal avec 4 questions max"
- "Validation par code = +20% participation vs email"

**Complexité :** Très élevée, nécessite ML/analytics avancés

#### 3. API externe + iframe embedable

**Vision :** Intégration dans plateformes tierces

**Features :**
- API REST complète
- Iframe du questionnaire embedable
- Webhook retour image générée
- Intégration white-label

**Use case :** Partenaires qui intègrent AppsByMCI dans leurs propres plateformes

**Note :** Post-MVP x 1000 - changement de modèle business

---

## SaaS B2B - Exigences spécifiques

Comme plateforme SaaS B2B, AppsByMCI V2 doit supporter plusieurs aspects spécifiques à ce type de produit.

### Système multi-utilisateurs

**Sprint 1 (Simple) :**
- Authentification admin (email/password)
- Tous les admins ont accès global
- Structure DB prête pour permissions granulaires futures

**Sprint 2+ (Avancé) :**
- Permissions granulaires par animation (owner/editor/viewer)
- Gestion d'équipes multiples
- Filtrage dashboard selon permissions

### Dashboard et analytics

**Visibilité par animation :**
- Métriques de performance (participants, taux complétion)
- Visualisation des données collectées
- Export des résultats (images bulk, données CSV)

**Gestion centralisée :**
- Liste de toutes les animations créées
- Statuts (brouillon/publiée/archivée)
- Actions rapides (éditer, dupliquer, archiver)

### Configuration flexible

**Système de blocs composables :**
- Pas de templates rigides
- Composition libre de capacités
- Pipeline de traitement configurable
- Extensibilité sans code

**Configuration flexible :**
- Dashboard admin Next.js custom pour gestion animations
- Modèles IA hardcodés (OpenAI + Gemini) pour MVP
- Extensibilité post-MVP : UI admin pour gestion dynamique modèles si besoin

### Déploiement et infrastructure

**Architecture Azure :**
- Frontend : Azure Static Web Apps
- Backend : Azure Web App
- Database : Cosmos DB (API MongoDB)
- Storage : Azure Blob Storage
- CI/CD existant fonctionnel

**Monorepo :**
- Package shared pour réutilisation code
- Déploiement indépendant frontend/backend
- Azure Artifacts pour packages npm internes

---

## Exigences fonctionnelles

**Les FRs définissent TOUTES les capacités que le système doit offrir.** Chaque FR est une capacité testable et implémentable indépendamment.

### Gestion des utilisateurs et authentification

**FR1** : Les admins peuvent créer un compte avec email et mot de passe
**FR2** : Les admins peuvent se connecter de manière sécurisée
**FR3** : Les admins peuvent gérer leur profil (email, mot de passe)
**FR4** : Le système maintient les sessions admin entre les visites
**FR5** : Les participants peuvent accéder aux animations sans créer de compte

### Création et configuration d'animations

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

### Expérience participant

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

### Génération IA et traitement d'images

**FR41** : Le système peut appeler différents modèles IA (OpenAI DALL-E, Gemini Imagen)
**FR42** : Le système peut générer des images via DALL-E avec un prompt construit dynamiquement
**FR43** : Le système peut éditer des images existantes via modèles d'édition IA
**FR44** : Le système peut générer des images via Google Gemini Imagen
**FR45** : Le système peut remplacer les variables de prompt par les données collectées
**FR46** : Le système peut appliquer des traitements de pre-processing (crop, resize)
**FR47** : Le système peut appliquer des filtres simples en post-processing
**FR48** : Le système stocke les images générées sur Azure Blob Storage
**FR49** : Le système conserve l'historique de toutes les générations par animation

### Dashboard admin et analytics

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

### Écran de visualisation publique

**FR62** : Le système affiche uniquement les soumissions marquées comme visibles sur l'écran public
**FR63** : L'écran de visualisation peut utiliser un layout masonry avec colonnes configurables
**FR64** : L'écran de visualisation peut afficher ou masquer les noms sur les images
**FR65** : L'écran de visualisation se rafraîchit automatiquement à intervalles configurés
**FR66** : L'écran de visualisation supporte différents styles de défilement (vitesse, direction)
**FR67** : L'écran de visualisation peut appliquer un overlay personnalisé
**FR68** : L'écran de visualisation est accessible via une URL dédiée pour projection

### Email et notifications

**FR69** : Le système peut envoyer des emails automatiques aux participants après génération
**FR70** : Les emails peuvent utiliser un template HTML personnalisable
**FR71** : Les emails peuvent inclure des variables dynamiques (nom, email, imageUrl, etc.)
**FR72** : Les admins peuvent configurer l'expéditeur des emails (nom, adresse)
**FR73** : Le système peut attacher l'image générée aux emails ou inclure un lien

### QR codes et partage

**FR74** : Le système génère automatiquement un QR code pour chaque animation publiée
**FR75** : Les admins peuvent télécharger le QR code depuis le dashboard
**FR76** : Les QR codes redirigent vers l'URL publique de l'animation

### Configuration modèles IA

**FR77** : Le système expose les modèles IA disponibles via API (`GET /api/ai-models`)
**FR78** : Le wizard récupère dynamiquement la liste des modèles IA disponibles
**FR79** : Les modèles IA incluent leurs capacités (requiresImage, supportsEdit, maxSize)
**FR80** : Le système supporte OpenAI DALL-E 3 pour génération text-to-image
**FR81** : Le système supporte OpenAI DALL-E Edit pour édition d'images
**FR82** : Le système supporte Google Gemini Imagen pour génération text-to-image

_Note : Sprint 1 = modèles hardcodés. Post-MVP : UI admin pour gestion dynamique si besoin._

**Total : 82 exigences fonctionnelles couvrant l'intégralité du MVP et des capacités système**

---

## Exigences non-fonctionnelles

Les NFRs définissent les attributs de qualité du système : performance, sécurité, fiabilité, etc.

### Performance

**NFR1 : Temps de réponse utilisateur**
- Page d'animation chargée en < 2 secondes
- Soumission de formulaire traitée en < 5 secondes (hors génération IA)
- Dashboard admin chargé en < 3 secondes

**NFR2 : Génération IA**
- Génération d'avatar via DALL-E : < 30 secondes
- Génération via Gemini : < 20 secondes
- Timeout après 60 secondes avec message d'erreur clair

**NFR3 : Écran de visualisation publique**
- Rafraîchissement fluide sans scintillement
- Support de 50+ images simultanées sans dégradation
- Animation de scroll smooth à 60 FPS

**Rationale** : Expérience utilisateur critique lors d'événements en direct. Les participants doivent avoir des retours rapides, et l'écran public doit être fluide pour projection.

### Sécurité

**NFR4 : Authentification**
- Mots de passe hachés avec bcrypt (min 10 rounds)
- Sessions sécurisées avec tokens JWT
- Protection CSRF sur toutes les mutations

**NFR5 : Validation des données**
- Validation côté serveur de tous les inputs utilisateur
- Sanitization des champs HTML (templates email)
- Limitation de taille des uploads (selfies max 10MB)

**NFR6 : Accès aux ressources**
- Images stockées sur Azure Blob avec URLs signées temporaires
- Validation des permissions avant accès aux données d'animation
- Rate limiting sur les APIs publiques (participants)

**NFR7 : Secrets et configuration**
- API keys (OpenAI, Gemini) stockées en variables d'environnement
- Pas de secrets dans le code source
- Configuration Azure Key Vault pour production

**Rationale** : Protection des données participants (selfies, informations personnelles) et des ressources système (APIs IA coûteuses).

### Fiabilité et disponibilité

**NFR8 : Disponibilité système**
- Uptime cible : 99% (acceptable pour événements planifiés)
- Pas de Single Point of Failure critique
- Graceful degradation si APIs IA indisponibles

**NFR9 : Gestion des erreurs**
- Messages d'erreur clairs pour les participants (pas de stack traces)
- Logging détaillé côté serveur pour debugging
- Retry automatique sur échecs temporaires API IA (max 3 tentatives)

**NFR10 : Backup et récupération**
- Backup automatique Cosmos DB quotidien
- Images Azure Blob Storage avec geo-redundancy
- Possibilité de restauration < 24h en cas de problème

**Rationale** : Les événements corporate sont planifiés à l'avance. Le système doit être fiable le jour J, mais pas besoin de 99.99% uptime 24/7.

### Scalabilité

**NFR11 : Charge utilisateur**
- Support de 100 participants simultanés par animation
- Support de 10 animations actives simultanément
- Dashboard admin responsive avec 500+ soumissions par animation

**NFR12 : Stockage**
- Support de 10,000 images générées par an
- Cosmos DB dimensionné pour 100,000 documents
- Architecture évolutive pour croissance future

**Rationale** : Dimensionnement initial conservateur basé sur l'usage actuel (7 applications, quelques événements/mois). Architecture permet scale-up si besoin.

### Usabilité et accessibilité

**NFR13 : Compatibilité navigateurs**
- Support des navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Dernières 2 versions de chaque navigateur
- Pas de support IE11

**NFR14 : Responsive design**
- Interface participant optimisée mobile (smartphones, tablets)
- Dashboard admin optimisé desktop (1920x1080 minimum)
- Écran de visualisation optimisé pour projection (1080p, 4K)

**NFR15 : Accessibilité**
- Contrastes WCAG AA minimum
- Navigation clavier possible dans le wizard admin
- Messages d'erreur clairs et explicites

**NFR16 : Temps de configuration**
- Création d'animation MVP : < 1 heure pour un admin formé
- Avec génération IA questions : < 30 minutes
- Modifications post-publication : < 5 minutes

**Rationale** : Participants utilisent principalement mobile lors d'événements. Admins travaillent sur desktop. L'objectif principal est réduire drastiquement le temps de configuration vs V1.

### Maintenabilité et extensibilité

**NFR17 : Code quality**
- TypeScript strict mode activé
- Linting ESLint + Prettier
- Tests unitaires pour logique métier critique (coverage > 60%)

**NFR18 : Documentation**
- README avec instructions setup local
- Documentation API endpoints (OpenAPI/Swagger)
- Guide d'utilisation admin (création d'animation)

**NFR19 : Architecture modulaire**
- Package shared réutilisable
- Blocs de traitement extensibles sans modifier le core
- Architecture extensible pour ajout de nouveaux modèles IA post-MVP

**NFR20 : DevOps**
- CI/CD automatisé (GitHub Actions existant)
- Environnements : local, staging, production
- Déploiement frontend/backend indépendant

**Rationale** : L'extensibilité est critique pour le concept de "blocs composables". La maintenabilité assure que le système reste flexible sur le long terme.

### Conformité et données

**NFR21 : Données personnelles**
- Collecte de données avec consentement explicite (checkbox)
- Possibilité de suppression des données participant (dashboard admin)
- Rétention des données : configurable par animation (30/60/90 jours ou infini)

**NFR22 : Localisation**
- Interface en français (MVP)
- Support multilingue prévu pour Sprint 2+ (structure i18n)
- Dates/heures en format local

**Rationale** : Événements corporate en France majoritairement. RGPD applicable mais usage restreint (pas de données sensibles, consentement lors de l'événement).

### Monitoring et observabilité

**NFR23 : Logs et traces**
- Logs structurés (JSON) pour recherche facile
- Niveaux : ERROR, WARN, INFO, DEBUG
- Logs Azure Application Insights

**NFR24 : Métriques**
- Temps de génération IA par modèle
- Taux d'erreur par endpoint
- Utilisation Azure Storage et Cosmos DB

**NFR25 : Alerting**
- Alerte si taux d'erreur > 10% sur 5 minutes
- Alerte si génération IA échoue systématiquement
- Notification via email/SMS

**Rationale** : Diagnostic rapide en cas de problème pendant un événement. Visibilité sur les coûts Azure (IA, storage).

---

## Résumé du PRD

### Synthèse des exigences

**Document complet capturant :**
- ✅ Vision produit : Plateforme d'animation événementielle qui démystifie l'IA
- ✅ Différenciateur : Architecture en blocs composables vs templates rigides
- ✅ 7 critères de succès mesurables (opérationnel, utilisateur, technique)
- ✅ Scope MVP complet (Sprint 1) : Wizard 8 étapes, génération IA, dashboard, écran public
- ✅ Growth features (Sprint 2+) : Génération IA complète, multilingue, compositing avancé
- ✅ Vision long terme : Partage social, IA apprentissage, API externe
- ✅ 82 exigences fonctionnelles (FRs) détaillées par domaine
- ✅ 25 exigences non-fonctionnelles (NFRs) couvrant performance, sécurité, scalabilité, maintenabilité

### Valeur essentielle du produit

AppsByMCI V2 transforme **2-3 jours de développement** en **30 minutes de configuration** grâce à :

1. **Système de blocs composables** : Flexibilité totale, zéro templates rigides
2. **Génération IA assistée** : Questions et prompts générés automatiquement
3. **Configuration simplifiée** : Dashboard admin custom avec wizard intuitif
4. **Architecture scalable** : Monorepo Next.js 16 + Fastify sur Azure
5. **Expériences mémorables** : Démystification de l'IA par l'expérience directe

**Résultat** : Fab et l'équipe libérés de la maintenance de 7 applications codées en dur. Capacité d'accepter plus d'événements sans augmenter l'équipe. POC validé pour architecture de futur gros projet.

---

_Ce PRD a été créé à travers une collaboration entre Fab et l'AI Product Manager, en s'appuyant sur une session de brainstorming approfondie (First Principles, SCAMPER, What If). Il constitue le document de référence pour toutes les phases suivantes : UX Design, Architecture technique, et implémentation._

_Prochaine étape recommandée : `/bmad:bmm:workflows:create-ux-design` (si UI requise) ou `/bmad:bmm:workflows:architecture`_

