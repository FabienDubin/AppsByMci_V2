# AppsByMCI_V2 UX Design Specification

_Created on 2025-11-21 by Fab_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

**AppsByMCI V2** est une plateforme d'animation événementielle corporate conçue pour démystifier l'intelligence artificielle par l'expérience interactive. Plutôt qu'une simple démonstration passive, elle permet aux participants d'événements d'entreprise de vivre une expérience immersive et engageante avec l'IA.

### Vision du Produit

La plateforme transforme la perception de l'IA en créant des animations interactives personnalisées où chaque participant devient acteur de l'expérience. En scannant un QR code, les invités d'événements corporate complètent des animations captivantes qui combinent leur participation active avec la puissance générative de l'IA, le tout visible en temps réel sur un écran public.

### Double Différenciateur

1. **Démystification par l'expérience** : Les participants ne regardent pas une démo d'IA - ils la vivent, la touchent, créent avec elle
2. **Architecture en blocs composables** : Un système flexible type "LEGO" qui évite le piège des templates rigides et permet une personnalisation infinie sans complexité technique

### Utilisateurs Cibles

- **Administrateurs** (équipe MCI) : Créent et configurent les animations via un wizard intuitif en 8 étapes, gèrent les événements et analysent les résultats
- **Participants** (invités d'événements) : Vivent l'expérience sur mobile via QR code, interagissent avec l'IA et voient leur création s'afficher publiquement

### Expérience Différenciante

Le cœur de l'expérience repose sur un **pipeline de traitement flexible** où les administrateurs peuvent composer des animations uniques en assemblant des blocs de traitement (quiz IA, transformations d'images, effets visuels) via une interface drag-and-drop. Cette approche modulaire garantit que chaque événement peut avoir sa propre animation signature sans développement custom.

### Contexte Technique

- **Frontend** : Next.js (App Router) avec TypeScript et ShadCN UI
- **Backend** : Fastify avec TypeScript pour performance et scalabilité
- **CMS** : Payload CMS pour gestion de contenu
- **Infrastructure** : Azure (Cosmos DB, Blob Storage, Static Web Apps)
- **Architecture** : Monorepo (frontend, backend, packages partagés)

---

## 1. Design System Foundation

### 1.1 Design System Choice

**Choix retenu : ShadCN UI + Radix UI + Tailwind CSS**

**Justification:**

ShadCN UI est le choix idéal pour AppsByMCI V2 pour plusieurs raisons alignées avec les besoins du projet :

1. **Composants "copy-paste"** : Tu possèdes le code source → personnalisation totale sans être bloqué par les limitations d'une lib externe
2. **Construit sur Radix UI** : Accessibilité (a11y) intégrée nativement - crucial pour les événements corporate
3. **Tailwind CSS** : Style utility-first qui accélère le développement et maintient la cohérence
4. **TypeScript natif** : Sécurité de type pour ton stack Next.js + TypeScript
5. **Pas de vendor lock-in** : Les composants sont dans ton codebase, pas une dépendance externe qui peut casser

**Composants clés pour AppsByMCI V2:**

- **Form** (wizard 8 étapes) : Gestion de formulaire robuste avec validation
- **Dialog/Modal** : Prévisualisation des animations, confirmations
- **Button** : CTA clairs pour les participants ("Commencer", "Suivant", "Voir mon résultat")
- **Card** : Affichage des blocs dans le pipeline drag-and-drop
- **Toast** : Notifications en temps réel (upload terminé, génération IA en cours)
- **Progress** : Feedback visuel pendant la génération IA
- **Tabs** : Navigation dans le dashboard admin
- **Select/Combobox** : Sélection de templates, blocs de traitement

**Intégration:**

Les composants ShadCN s'intègrent parfaitement dans l'architecture Next.js App Router avec support natif des Server Components et Client Components.

---

## 2. Core User Experience

### 2.1 Defining Experience

**Pour les Administrateurs (équipe MCI):**

L'expérience admin se concentre sur la **simplicité et la flexibilité**. Le wizard en 8 étapes guide la création d'une animation sans friction :
1. Informations générales de l'événement
2. Configuration du template de base
3. Paramétrage des questions (avec option génération IA)
4. Upload des images/médias
5. Configuration des transformations d'images
6. **Composition du pipeline** (drag-and-drop des blocs de traitement)
7. Prévisualisation et test
8. Publication et génération du QR code

La réponse émotionnelle recherchée : **"C'est étonnamment simple de créer quelque chose d'unique"** - confiance et contrôle sans complexité technique.

**Pour les Participants (invités événements):**

L'expérience participant est **immédiate et magique** :
1. Scan du QR code → Accès direct à l'animation
2. Interaction guidée (répondre aux questions, prendre une photo, etc.)
3. **Moment "Whoa!"** → L'IA génère le résultat en temps réel
4. Affichage public sur grand écran → Fierté et partage collectif
5. Option de téléchargement/partage du résultat personnel

La réponse émotionnelle recherchée : **"J'ai créé ça avec l'IA?!"** - émerveillement, surprise positive, et fierté d'avoir co-créé quelque chose avec l'intelligence artificielle.

### 2.2 Novel UX Patterns

**Pipeline Visuel Drag-and-Drop (Innovation clé)**

Plutôt que des templates figés, l'interface admin propose un **système de composition par blocs** inspiré de l'approche LEGO :
- Chaque bloc représente une transformation ou traitement (quiz IA, filtre image, effet visuel, etc.)
- Les blocs se connectent visuellement pour former un pipeline de traitement
- Feedback visuel immédiat : aperçu du résultat à chaque étape du pipeline
- Bibliothèque de blocs extensible sans refonte de l'interface

Ce pattern résout le problème identifié dans le brainstorming : "On va nous demander des nouveaux templates sans arrêt" → Maintenant, chaque admin compose sa propre "recette" unique.

**Expérience "Scan → Create → See" (Participant)**

Cycle ultra-court pour maintenir l'engagement lors d'événements :
- **Scan** : QR code → Chargement instantané (< 2s)
- **Create** : Interface mobile optimisée, 1-3 interactions max
- **See** : Affichage public immédiat avec effet "reveal" dramatique

L'innovation est dans la **boucle de gratification rapide** (< 2 minutes du scan à l'affichage public) essentielle pour les contextes événementiels où l'attention est limitée.

---

## 3. Visual Foundation

### 3.1 Color System

**Palette : "Minimal Monochrome" (façon Notion)**

Design épuré noir et blanc avec touches de couleur uniquement pour les actions critiques.

**Couleurs principales:**
- **Background** : Blanc (#ffffff) / Gris très foncé (#191919) en dark mode
- **Surface** : Gris ultra-léger (#fafafa) / Gris foncé (#252525)
- **Borders** : Gris clair (#e5e5e5) / Gris moyen (#373737)
- **Text primary** : Noir (#0f0f0f) / Blanc (#efefef)
- **Text secondary** : Gris moyen (#71717a) / Gris clair (#a1a1aa)

**Touches de couleur (usage minimal):**
- **Primary action** : Noir pur sur fond blanc (boutons pleins) ou bleu très sobre (#2563eb) pour liens
- **Success** : Vert discret (#16a34a) - statuts positifs uniquement
- **Error** : Rouge sobre (#dc2626) - erreurs uniquement
- **Accent IA** : Violet doux (#8b5cf6) - moments de génération IA uniquement

**Philosophie d'usage:**

- **90% monochrome** : Interface admin entièrement noir/blanc/gris
- **Couleur = intention** : La couleur n'apparaît que pour guider l'action (CTA, états, feedback)
- **Typographie forte** : La hiérarchie se fait par taille, poids et espacement plutôt que par couleur
- **Focus sur le contenu** : L'interface s'efface, le contenu créé par l'utilisateur devient la couleur

**Mode sombre inclus** : Toggle noir/blanc pour l'interface admin.

---

## 4. Design Direction

### 4.1 Chosen Design Approach

**Direction : "Minimal Notion-like" avec focus sur l'efficacité**

**Caractéristiques:**
- Interface épurée noir/blanc/gris (90% monochrome)
- Typographie claire et aérée (system fonts ou Inter)
- Espaces généreux entre les éléments
- Bordures subtiles (1px, gris clair)
- Coins arrondis doux (4-8px)
- Shadows légères pour la hiérarchie (pas d'ombres fortes)
- Animations micro-subtiles (pas de mouvements agressifs)

**Références visuelles:**
- Notion (minimalisme, typographie)
- Linear (clarté, efficacité)
- Vercel (simplicité moderne)

**Pourquoi ce choix:**
- Permet aux admins de se concentrer sur leur tâche (créer l'animation) sans distraction visuelle
- Scalable : facile d'ajouter des features sans polluer l'interface
- Intemporel : ne vieillit pas comme les designs très colorés/trendy
- Performance : moins de CSS, moins d'assets, plus rapide

---

## 5. User Journey Flows

### 5.1 Critical User Paths

**Parcours 1 : Admin crée une animation**

1. **Dashboard** → Bouton "Nouvelle animation" (CTA noir proéminent)
2. **Wizard Step 1/8** : Infos événement (nom, date, description) → Suivant
3. **Step 2/8** : Choix template de base → Suivant
4. **Step 3/8** : Configuration questions (+ option "Générer avec IA") → Suivant
5. **Step 4/8** : Upload médias (drag-and-drop) → Suivant
6. **Step 5/8** : Config transformations images → Suivant
7. **Step 6/8** : **Composition pipeline** (drag-and-drop blocs) → Suivant
8. **Step 7/8** : Prévisualisation complète + mode test → Suivant
9. **Step 8/8** : Publication → Génération QR code → Télécharger/Imprimer

**Points de friction à minimiser:**
- Sauvegarde auto à chaque step (pas de perte de données)
- Possibilité de revenir en arrière sans perdre les données
- Preview en temps réel dans le step 6 (pipeline)

**Parcours 2 : Participant complète une animation**

1. **Scan QR code** → Chargement direct de l'animation (< 2s)
2. **Écran d'accueil** : Titre de l'animation + CTA "Commencer"
3. **Interaction guidée** : Séquence définie par l'admin (ex: répondre à 3 questions, prendre une photo)
4. **Génération IA** : Feedback visuel (progress bar + message "L'IA crée ton résultat...")
5. **Résultat** : Affichage du résultat final + option télécharger
6. **Fin** : Message de remerciement + CTA optionnel (partage social, etc.)

**Points critiques:**
- Pas de login/signup requis (friction = 0)
- Chargement instantané (optimisations mobile)
- Feedback constant pendant la génération (pas de "page blanche")
- Option de recommencer si pas satisfait du résultat

---

## 6. Component Library

### 6.1 Component Strategy

**Approche : Composants ShadCN + composants custom métier**

**Composants ShadCN (base):**
- Button, Input, Select, Textarea, Checkbox, Radio, Switch
- Form (avec react-hook-form + zod)
- Dialog, Popover, Tooltip
- Card, Tabs, Accordion
- Toast, Alert
- Progress, Spinner
- Table, Pagination

**Composants custom AppsByMCI:**
- **WizardStepper** : Navigation 8 étapes avec indicateur de progression
- **PipelineCanvas** : Zone drag-and-drop pour composer les blocs de traitement
- **BlockCard** : Carte représentant un bloc de traitement (avec icône, config)
- **QRCodeGenerator** : Génération + download QR code
- **AnimationPreview** : Preview temps réel de l'animation
- **ParticipantView** : Container responsive pour l'expérience mobile participant
- **PublicDisplayScreen** : Vue plein écran pour l'affichage public

**Organisation:**
```
/components
  /ui (ShadCN)
  /forms (composants de formulaire)
  /wizard (WizardStepper, StepContainer)
  /pipeline (PipelineCanvas, BlockCard, BlockLibrary)
  /animation (AnimationPreview, ParticipantView, PublicDisplayScreen)
  /shared (composants réutilisables génériques)
```

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

**Navigation:**
- Sidebar fixe à gauche pour l'admin (Dashboard, Animations, Événements, Paramètres)
- Breadcrumb en haut pour situer l'utilisateur dans le wizard
- Pas de navigation pour le participant (flux linéaire guidé)

**Actions:**
- Boutons primaires : Noir sur blanc (ou blanc sur noir en dark mode)
- Boutons secondaires : Bordure grise, fond transparent
- Boutons destructifs : Rouge sobre uniquement pour supprimer
- Position : Primaire à droite, secondaire à gauche dans les modals/forms

**Feedback utilisateur:**
- Toast en haut à droite pour les confirmations ("Animation créée", "Sauvegardé")
- Toast d'erreur en rouge avec icône explicite
- Loading states : Skeleton UI (pas de spinners partout)
- Progress bar pour les processus longs (upload, génération IA)

**États:**
- Hover : Background gris très léger sur les cartes/boutons
- Focus : Ring bleu subtil (accessibilité clavier)
- Disabled : Opacité 50% + cursor not-allowed
- Loading : Skeleton ou spinner selon contexte

**Espacement (Tailwind):**
- Petits composants : gap-2 / gap-4
- Cards : p-4 / p-6
- Sections : space-y-6 / space-y-8
- Layout : Container max-w-7xl centered

**Formulaires:**
- Labels au-dessus des inputs (pas à côté)
- Validation en temps réel (après blur)
- Messages d'erreur sous l'input en rouge
- Required fields avec astérisque rouge

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

**Breakpoints (Tailwind):**
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablette portrait)
- `lg`: 1024px (tablette landscape / petit desktop)
- `xl`: 1280px (desktop)
- `2xl`: 1536px (large desktop)

**Interface Admin:**
- **Desktop/Tablette (≥ 768px)** : Sidebar fixe + contenu principal
- **Mobile (< 768px)** : Sidebar collapsible (hamburger menu) - **usage déconseillé** (créer une animation sur mobile = mauvaise UX)

**Interface Participant:**
- **Mobile-first** : Design optimisé pour mobile (320px → 768px)
- **Touch targets** : Minimum 44x44px pour tous les boutons
- **Portrait optimisé** : Interface verticale, scroll minimal
- **Clavier mobile** : Input types appropriés (email, tel, number)

**Écran Public Display:**
- **Fullscreen** : Responsive 16:9 ou 4:3 selon l'écran disponible
- **Large fonts** : Lisible à distance (> 5m)
- **Animations** : Transitions pour les nouveaux résultats

### 8.2 Accessibility (WCAG 2.1 AA minimum)

**Contraste:**
- Texte/Background : Ratio ≥ 4.5:1 (3:1 pour large text)
- Palette noir/blanc garantit des ratios excellents

**Clavier:**
- Tous les éléments interactifs accessibles au clavier
- Focus visible (ring bleu)
- Skip links pour navigation rapide
- Pas de keyboard traps

**Screen readers:**
- ARIA labels sur tous les composants interactifs
- Headings hiérarchiques (h1 → h6)
- Alt text sur toutes les images
- Live regions pour les notifications (toast)

**Autres:**
- Pas de contenu qui clignote > 3x/seconde (épilepsie)
- Textes redimensionnables (rem units)
- Pas de timeout agressifs (participant peut prendre son temps)
- Support dark mode natif (réduit fatigue visuelle)

---

## 9. Implementation Guidance

### 9.1 Completion Summary

**Décisions UX finalisées ✅**

Cette spécification UX définit une direction claire et minimaliste pour AppsByMCI V2 :

**Design System:**
- ShadCN UI + Radix UI + Tailwind CSS
- Palette "Minimal Monochrome" façon Notion (90% noir/blanc/gris)
- Dark mode inclus

**Expériences clés:**
- **Admin** : Wizard 8 étapes + pipeline drag-and-drop pour composer les animations
- **Participant** : Cycle ultra-court "Scan → Create → See" (< 2 min)
- **Patterns innovants** : Système de blocs composables LEGO, feedback temps réel

**Architecture composants:**
- Base ShadCN pour les primitives UI
- Composants custom métier (WizardStepper, PipelineCanvas, BlockCard, etc.)
- Organisation claire par domaine fonctionnel

**Responsive & Accessibilité:**
- Admin : Desktop/tablette prioritaire
- Participant : Mobile-first (touch-optimized)
- WCAG 2.1 AA respecté (contraste, clavier, screen readers)

### 9.2 Prochaines étapes

**Phase Architecture (en cours):**
1. Définir l'architecture système complète (backend, frontend, infra)
2. Spécifier les APIs et contrats de données
3. Établir la stratégie de state management

**Phase Implémentation:**
1. Setup du design system (installer ShadCN, configurer Tailwind avec la palette)
2. Créer les composants de base (layout, navigation, formulaires)
3. Implémenter le wizard en 8 étapes
4. Développer le PipelineCanvas (composant le plus complexe)
5. Créer l'expérience participant mobile
6. Développer l'écran de display public

**Notes pour les développeurs:**
- Utiliser les tokens Tailwind définis dans cette spec (pas de couleurs hardcodées)
- Tous les composants custom doivent étendre les composants ShadCN quand possible
- Tester l'accessibilité clavier dès le début (pas après coup)
- Optimiser les images pour le mobile (WebP, lazy loading)
- Implémenter le dark mode via Tailwind `dark:` dès le début

---

## Appendix

### Related Documents

- Product Requirements: `docs/prd.md`
- Brainstorming: `docs/bmm-brainstorming-session-2025-11-21.md`

### Core Interactive Deliverables

This UX Design Specification was created through visual collaboration:

- **Color Theme Visualizer**: docs/ux-color-themes.html
  - Interactive HTML showing all color theme options explored
  - Live UI component examples in each theme
  - Side-by-side comparison and semantic color usage

- **Design Direction Mockups**: docs/ux-design-directions.html
  - Interactive HTML with 6-8 complete design approaches
  - Full-screen mockups of key screens
  - Design philosophy and rationale for each direction

### Version History

| Date       | Version | Changes                         | Author |
| ---------- | ------- | ------------------------------- | ------ |
| 2025-11-21 | 1.0     | Initial UX Design Specification | Fab    |

---

_This UX Design Specification was created through collaborative design facilitation, not template generation. All decisions were made with user input and are documented with rationale._
