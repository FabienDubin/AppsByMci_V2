# Pipeline Architecture Specification

**Date:** 2025-11-21
**Author:** Fab
**Status:** Draft - Implementation Readiness
**Related:** Epic 3.6 (Pipeline Builder), Epic 4.6 (Génération IA)

---

## Vue d'Ensemble

Le **pipeline de traitement flexible** est un différenciateur clé d'AppsByMCI V2 (PRD Success Criteria #1 "Zéro recoding"). Il permet aux admins de composer des animations uniques en assemblant des blocs de traitement via une interface drag-and-drop.

### Objectifs

1. **Flexibilité** : Admins peuvent créer des pipelines uniques sans coder
2. **Extensibilité** : Nouveaux types de blocs ajoutables sans refonte
3. **Validation** : Pipeline invalide = impossible à publier
4. **Performance** : Exécution pipeline < 30s (NFR2)

---

## Architecture des Blocs

### Types de Blocs MVP (3 types)

#### 1. Bloc Preprocessing
**Rôle :** Transformer le selfie uploadé avant génération IA

**Config :**
```typescript
interface PreprocessingConfig {
  crop: 'square' | 'circle' | 'none'
  resize: 512 | 1024 | null  // pixels, null = pas de resize
}
```

**Exemple :**
- Crop : `square` → Selfie devient carré (aspect ratio 1:1)
- Resize : `1024` → Selfie redimensionné à 1024x1024px

---

#### 2. Bloc AI Generation
**Rôle :** Générer image via modèle IA avec prompt dynamique

**Config :**
```typescript
interface AIGenerationConfig {
  modelId: 'dall-e-3' | 'gpt-image-1' | 'imagen-3.0-capability-001'
  promptTemplate: string  // Ex: "Create a {{style}} portrait of {{name}}"
  requiresSelfie: boolean // true si modèle édite image (gpt-image-1)
}
```

**Variables disponibles dans promptTemplate :**
- `{{name}}`, `{{email}}` : Champs participant
- `{{q1}}`, `{{q2}}`, etc. : Réponses aux questions (id question)
- `{{selfie}}` : Référence au selfie (si requiresSelfie)

**Exemple :**
- Model : `dall-e-3`
- Prompt : `"Create a {{style}} portrait of {{name}}"`
- Si participant répond : `{name: "Marie", q2: "Futuriste"}` (q2 = style)
- Prompt final : `"Create a Futuriste portrait of Marie"`

---

#### 3. Bloc Postprocessing
**Rôle :** Appliquer filtres simples sur l'image générée

**Config :**
```typescript
interface PostprocessingConfig {
  brightness: number  // -100 à +100
  contrast: number    // -100 à +100
  saturation: number  // -100 à +100
}
```

**Exemple :**
- Brightness : `+20` → Image plus lumineuse
- Contrast : `+10` → Contraste augmenté
- Saturation : `-30` → Couleurs désaturées (effet vintage)

---

### Structure Commune des Blocs

Tous les blocs partagent une structure de base :

```typescript
interface PipelineBlock {
  id: string              // UUID unique (ex: "block-1a2b3c")
  type: 'preprocessing' | 'ai-generation' | 'postprocessing'
  order: number           // Position dans le pipeline (0, 1, 2, ...)
  name: string            // Nom affiché dans UI (ex: "Crop & Resize")
  config: PreprocessingConfig | AIGenerationConfig | PostprocessingConfig
}
```

**Exemple complet :**
```typescript
{
  id: "block-abc123",
  type: "ai-generation",
  order: 1,
  name: "Génération Avatar IA",
  config: {
    modelId: "dall-e-3",
    promptTemplate: "Create a {{style}} portrait of {{name}}",
    requiresSelfie: false
  }
}
```

---

## State Management (Zustand)

### Store `pipelineStore`

```typescript
// apps/frontend/stores/pipelineStore.ts
import { create } from 'zustand'

interface PipelineState {
  blocks: PipelineBlock[]

  // Actions
  addBlock: (type: PipelineBlock['type']) => void
  removeBlock: (blockId: string) => void
  updateBlock: (blockId: string, config: Partial<PipelineBlock>) => void
  reorderBlocks: (startIndex: number, endIndex: number) => void
  clearPipeline: () => void

  // Validation
  validatePipeline: () => { valid: boolean; errors: string[] }
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  blocks: [],

  addBlock: (type) => {
    const newBlock: PipelineBlock = {
      id: `block-${Date.now()}`,
      type,
      order: get().blocks.length,
      name: getDefaultBlockName(type),
      config: getDefaultConfig(type)
    }
    set((state) => ({ blocks: [...state.blocks, newBlock] }))
  },

  removeBlock: (blockId) => {
    set((state) => ({
      blocks: state.blocks
        .filter(b => b.id !== blockId)
        .map((b, idx) => ({ ...b, order: idx })) // Re-index après suppression
    }))
  },

  updateBlock: (blockId, updates) => {
    set((state) => ({
      blocks: state.blocks.map(b =>
        b.id === blockId ? { ...b, ...updates } : b
      )
    }))
  },

  reorderBlocks: (startIndex, endIndex) => {
    set((state) => {
      const result = Array.from(state.blocks)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)

      // Mettre à jour les order
      return {
        blocks: result.map((b, idx) => ({ ...b, order: idx }))
      }
    })
  },

  clearPipeline: () => set({ blocks: [] }),

  validatePipeline: () => {
    const { blocks } = get()
    const errors: string[] = []

    // Validation 1 : Au moins 1 bloc AI Generation requis
    const hasAIBlock = blocks.some(b => b.type === 'ai-generation')
    if (!hasAIBlock) {
      errors.push("Le pipeline doit contenir au moins un bloc de génération IA")
    }

    // Validation 2 : Bloc AI Generation avec requiresSelfie nécessite preprocessing ou selfie
    blocks.forEach(block => {
      if (block.type === 'ai-generation' && block.config.requiresSelfie) {
        const hasPreprocessing = blocks.some(b => b.type === 'preprocessing' && b.order < block.order)
        if (!hasPreprocessing) {
          errors.push(`Le bloc "${block.name}" nécessite un selfie mais aucun bloc preprocessing n'existe avant`)
        }
      }
    })

    // Validation 3 : Prompt template non vide
    blocks.forEach(block => {
      if (block.type === 'ai-generation' && !block.config.promptTemplate.trim()) {
        errors.push(`Le bloc "${block.name}" doit avoir un prompt template`)
      }
    })

    return { valid: errors.length === 0, errors }
  }
}))

// Helpers
function getDefaultBlockName(type: PipelineBlock['type']): string {
  switch (type) {
    case 'preprocessing': return 'Préparation Selfie'
    case 'ai-generation': return 'Génération IA'
    case 'postprocessing': return 'Filtres & Effets'
  }
}

function getDefaultConfig(type: PipelineBlock['type']) {
  switch (type) {
    case 'preprocessing':
      return { crop: 'square', resize: 1024 }
    case 'ai-generation':
      return {
        modelId: 'dall-e-3',
        promptTemplate: 'Create a portrait of {{name}}',
        requiresSelfie: false
      }
    case 'postprocessing':
      return { brightness: 0, contrast: 0, saturation: 0 }
  }
}
```

---

## Composant PipelineCanvas (Drag-and-Drop)

### Technologies
- **@dnd-kit/core** : Gestion drag-and-drop
- **@dnd-kit/sortable** : Liste réordonnables
- **Zustand** : State management (pipelineStore)

### Structure UI

```
┌─────────────────────────────────────────────────┐
│  Pipeline Canvas (Wizard Step 4)                │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────┐  ← Block Library (gauche) │
│  │  📦 Blocs        │                            │
│  │                  │                            │
│  │  ⚙️  Preprocessing│  Drag →                   │
│  │  🤖  AI Generation│                           │
│  │  🎨  Postprocessing│                          │
│  └──────────────────┘                            │
│                                                  │
│         ┌────────────────────────────┐           │
│         │  Canvas Zone (centre)      │           │
│         │                            │           │
│         │  ┌──────────────────────┐  │           │
│  Drop → │  │ 1. Preprocessing    │  │           │
│         │  │ Crop: Square        │  │           │
│         │  │ Resize: 1024px      │  │ ← Draggable
│         │  └──────────────────────┘  │           │
│         │           ↓                │           │
│         │  ┌──────────────────────┐  │           │
│         │  │ 2. AI Generation    │  │           │
│         │  │ Model: DALL-E 3     │  │           │
│         │  │ Prompt: {{style}}...│  │           │
│         │  └──────────────────────┘  │           │
│         │           ↓                │           │
│         │  ┌──────────────────────┐  │           │
│         │  │ 3. Postprocessing   │  │           │
│         │  │ Brightness: +20     │  │           │
│         │  └──────────────────────┘  │           │
│         │                            │           │
│         └────────────────────────────┘           │
│                                                  │
│  [+ Ajouter un bloc]  [Valider Pipeline]        │
└─────────────────────────────────────────────────┘
```

### Code Composant

```typescript
// apps/frontend/components/pipeline/PipelineCanvas.tsx
'use client'

import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { usePipelineStore } from '@/stores/pipelineStore'
import { BlockCard } from './BlockCard'
import { BlockLibrary } from './BlockLibrary'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function PipelineCanvas() {
  const { blocks, reorderBlocks, validatePipeline } = usePipelineStore()
  const { valid, errors } = validatePipeline()

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id)
      const newIndex = blocks.findIndex(b => b.id === over.id)
      reorderBlocks(oldIndex, newIndex)
    }
  }

  return (
    <div className="grid grid-cols-[300px_1fr] gap-6">
      {/* Block Library (gauche) */}
      <BlockLibrary />

      {/* Canvas Zone (centre) */}
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Pipeline de Traitement</h3>

        {blocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Glisse des blocs depuis la bibliothèque</p>
            <p className="text-sm mt-2">ou clique sur "+ Ajouter un bloc"</p>
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {blocks.map((block) => (
                  <BlockCard key={block.id} block={block} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Validation Errors */}
        {!valid && errors.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              <ul className="list-disc pl-4">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <Button variant="outline" size="sm">
            + Ajouter un bloc
          </Button>
          <Button disabled={!valid}>
            Valider Pipeline
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Sérialisation MongoDB

### Stockage dans `animations.pipeline`

Le pipeline est stocké comme un **array de blocs JSON** dans la collection `animations` :

```typescript
// Collection animations
{
  _id: ObjectId("..."),
  name: "Avatar Tech 2025",
  // ... autres champs

  pipeline: [
    {
      id: "block-abc123",
      type: "preprocessing",
      order: 0,
      name: "Préparation Selfie",
      config: {
        crop: "square",
        resize: 1024
      }
    },
    {
      id: "block-def456",
      type: "ai-generation",
      order: 1,
      name: "Génération Avatar",
      config: {
        modelId: "dall-e-3",
        promptTemplate: "Create a {{style}} portrait of {{name}}",
        requiresSelfie: false
      }
    },
    {
      id: "block-ghi789",
      type: "postprocessing",
      order: 2,
      name: "Filtres",
      config: {
        brightness: 20,
        contrast: 10,
        saturation: -5
      }
    }
  ]
}
```

### Schéma Mongoose

```typescript
// apps/backend/src/models/Animation.model.ts
import mongoose, { Schema } from 'mongoose'

const pipelineBlockSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['preprocessing', 'ai-generation', 'postprocessing'],
    required: true
  },
  order: { type: Number, required: true },
  name: { type: String, required: true },
  config: { type: Schema.Types.Mixed, required: true }
}, { _id: false })

const animationSchema = new Schema({
  // ... autres champs

  pipeline: {
    type: [pipelineBlockSchema],
    default: [],
    validate: {
      validator: (pipeline: any[]) => {
        // Validation côté DB : Au moins 1 bloc AI Generation
        return pipeline.some(b => b.type === 'ai-generation')
      },
      message: 'Pipeline must contain at least one ai-generation block'
    }
  }
})
```

---

## Exécution du Pipeline (Backend)

### Service `ai-generation.service.ts`

```typescript
// apps/backend/src/services/ai-generation.service.ts
export class AIGenerationService {
  async executePipeline(
    pipeline: PipelineBlock[],
    participantData: ParticipantData
  ): Promise<string> {
    // Pipeline trié par order
    const sortedBlocks = pipeline.sort((a, b) => a.order - b.order)

    let currentImage: Buffer | null = null

    for (const block of sortedBlocks) {
      switch (block.type) {
        case 'preprocessing':
          currentImage = await this.executePreprocessing(block.config, participantData.selfieUrl)
          break

        case 'ai-generation':
          const prompt = this.replaceVariables(block.config.promptTemplate, participantData)
          currentImage = await this.executeAIGeneration(block.config, prompt, currentImage)
          break

        case 'postprocessing':
          currentImage = await this.executePostprocessing(block.config, currentImage)
          break
      }
    }

    // Upload image finale vers Azure Blob
    const finalImageUrl = await this.uploadToAzureBlob(currentImage)
    return finalImageUrl
  }

  private replaceVariables(template: string, data: ParticipantData): string {
    let result = template

    // Remplacer {{name}}, {{email}}, etc.
    result = result.replace(/\{\{name\}\}/g, data.answers.name || '')
    result = result.replace(/\{\{email\}\}/g, data.email || '')

    // Remplacer {{q1}}, {{q2}}, etc.
    Object.entries(data.answers).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(regex, String(value))
    })

    return result
  }

  private async executePreprocessing(
    config: PreprocessingConfig,
    selfieUrl: string
  ): Promise<Buffer> {
    // Télécharger selfie depuis Azure Blob
    const selfieBuffer = await this.downloadFromAzure(selfieUrl)

    // Appliquer crop avec Sharp
    let image = sharp(selfieBuffer)

    if (config.crop === 'square') {
      // Crop carré centré
      const metadata = await image.metadata()
      const size = Math.min(metadata.width!, metadata.height!)
      image = image.extract({
        left: Math.floor((metadata.width! - size) / 2),
        top: Math.floor((metadata.height! - size) / 2),
        width: size,
        height: size
      })
    }

    // Resize si nécessaire
    if (config.resize) {
      image = image.resize(config.resize, config.resize)
    }

    return image.toBuffer()
  }

  private async executeAIGeneration(
    config: AIGenerationConfig,
    prompt: string,
    inputImage: Buffer | null
  ): Promise<Buffer> {
    switch (config.modelId) {
      case 'dall-e-3':
        return this.openaiService.generateImage(prompt)

      case 'gpt-image-1':
        if (!inputImage) throw new Error('gpt-image-1 requires input image')
        return this.openaiService.editImage(inputImage, prompt)

      case 'imagen-3.0-capability-001':
        return this.googleService.generateImage(prompt)

      default:
        throw new Error(`Unknown model: ${config.modelId}`)
    }
  }

  private async executePostprocessing(
    config: PostprocessingConfig,
    image: Buffer
  ): Promise<Buffer> {
    let result = sharp(image)

    // Appliquer brightness, contrast, saturation
    result = result.modulate({
      brightness: 1 + (config.brightness / 100),
      saturation: 1 + (config.saturation / 100)
    })

    // Note: Sharp n'a pas de méthode contrast directe,
    // on utilise linear() pour simuler
    if (config.contrast !== 0) {
      const factor = 1 + (config.contrast / 100)
      result = result.linear(factor, -(128 * factor) + 128)
    }

    return result.toBuffer()
  }
}
```

---

## Extension Future (Post-MVP)

### Nouveaux Types de Blocs Sprint 2+

1. **Bloc Composition** : Combiner selfie + image générée
2. **Bloc Overlay** : Ajouter texte/logo sur image
3. **Bloc Multi-Generation** : Générer plusieurs images et choisir la meilleure
4. **Bloc Filter Gallery** : Bibliothèque de filtres prédéfinis (vintage, noir/blanc, etc.)

### Pattern d'Extensibilité

Pour ajouter un nouveau type de bloc :

1. **Créer interface config** dans `packages/shared/src/types/pipeline.types.ts`
2. **Ajouter type dans union** `PipelineBlock['type']`
3. **Implémenter composant UI** dans `apps/frontend/components/pipeline/blocks/`
4. **Implémenter exécution backend** dans `ai-generation.service.ts`

Aucune modification de la structure `PipelineCanvas` ou `pipelineStore` requise !

---

## Tests

### Tests Frontend (Jest + React Testing Library)

```typescript
// PipelineCanvas.test.tsx
describe('PipelineCanvas', () => {
  it('should add block when drag from library', () => {
    // Test drag-and-drop @dnd-kit
  })

  it('should reorder blocks when drag within canvas', () => {
    // Test reorder
  })

  it('should show validation errors if pipeline invalid', () => {
    // Test validation UX
  })
})
```

### Tests Backend (Jest)

```typescript
// ai-generation.service.test.ts
describe('AIGenerationService', () => {
  describe('executePipeline', () => {
    it('should execute blocks in order', async () => {
      // Test ordre exécution
    })

    it('should replace variables in prompt template', () => {
      // Test replaceVariables()
    })

    it('should throw if AI generation block missing input image', async () => {
      // Test validation requiresSelfie
    })
  })
})
```

---

## Performance

**Target : Pipeline complet < 30s (NFR2)**

**Breakdown estimé :**
- Preprocessing (Sharp) : ~500ms
- AI Generation (OpenAI/Google) : 15-25s
- Postprocessing (Sharp) : ~500ms
- Upload Azure Blob : ~1-2s

**Total : 17-28s** ✅ Respecte NFR2

**Optimisations potentielles (Post-MVP) :**
- Cache prompts identiques (Redis)
- Paralléliser multi-générations
- Compression WebP avant upload

---

## Conclusion

Cette spec définit une architecture **extensible**, **validée** et **performante** pour le pipeline de traitement flexible. Elle peut être implémentée dès Epic 1 terminé et ne nécessite pas de refonte future pour ajouter de nouveaux blocs.

**Prêt pour implémentation Epic 3.6** ✅
