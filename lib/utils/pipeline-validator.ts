import { PipelineBlock, InputCollection } from '@/lib/stores/wizard.store'
import { getModelById } from '@/lib/ai-models'
import type { ImageUsageMode } from '@/lib/types'

/**
 * Validation result types
 */
export type ValidationResult =
  | { type: 'valid' }
  | { type: 'warning'; message: string }
  | { type: 'info'; message: string }
  | { type: 'error'; message: string }

/**
 * Validate pipeline logic (AC-3.6.9)
 * Checks pipeline configuration coherence and dependencies
 *
 * @param pipeline - Array of pipeline blocks
 * @param inputCollection - Input collection from Step 3 (for selfie check)
 * @returns Validation result with type and optional message
 */
export function validatePipelineLogic(
  pipeline: PipelineBlock[],
  inputCollection?: InputCollection
): ValidationResult {
  // Check 1: 0 blocs IA → warning (still valid but no AI generation)
  const aiBlocks = pipeline.filter((b) => b.type === 'ai-generation')
  if (aiBlocks.length === 0) {
    return {
      type: 'warning',
      message:
        "⚠️ Aucun bloc IA dans le pipeline. Les participants recevront leur image traitée uniquement (crop + filtres), sans génération IA.",
    }
  }

  // Check if selfie is configured in input collection
  const hasSelfie = inputCollection?.elements.some((el) => el.type === 'selfie') || false

  // Validate each AI block
  for (const block of aiBlocks) {
    const modelId = block.config.modelId
    if (!modelId) continue

    const model = getModelById(modelId)
    if (!model) continue

    const { imageUsageMode, imageSource, imageUrl, sourceBlockId } = block.config

    // Validation 1: If imageUsageMode is set, check it's supported by the model
    if (imageUsageMode && !model.capabilities.supportedModes.includes(imageUsageMode)) {
      return {
        type: 'error',
        message: `❌ Le modèle '${model.name}' ne supporte pas le mode '${getModeFrenchLabel(imageUsageMode)}'.`,
      }
    }

    // Validation 2: If imageUsageMode !== 'none', imageSource must be set
    if (imageUsageMode && imageUsageMode !== 'none' && !imageSource) {
      return {
        type: 'error',
        message: `❌ Le bloc '${model.name}' utilise le mode '${getModeFrenchLabel(imageUsageMode)}' mais aucune source d'image n'est configurée.`,
      }
    }

    // Validation 3: If imageSource === 'selfie', check selfie is configured
    if (imageSource === 'selfie' && !hasSelfie) {
      return {
        type: 'error',
        message: `❌ Le bloc '${model.name}' est configuré pour utiliser un selfie, mais aucun selfie n'est collecté (Step 3).`,
      }
    }

    // Validation 4: If imageSource === 'url', check URL is provided
    if (imageSource === 'url' && !imageUrl) {
      return {
        type: 'error',
        message: `❌ Le bloc '${model.name}' est configuré pour utiliser une URL, mais aucune URL n'est fournie.`,
      }
    }

    // Validation 5: If imageSource === 'ai-block-output', check source block exists
    if (imageSource === 'ai-block-output') {
      if (!sourceBlockId) {
        return {
          type: 'error',
          message: `❌ Le bloc '${model.name}' est configuré pour utiliser une image générée, mais aucun bloc source n'est sélectionné.`,
        }
      }

      const sourceBlock = pipeline.find((b) => b.id === sourceBlockId)
      if (!sourceBlock) {
        return {
          type: 'error',
          message: `❌ Le bloc '${model.name}' référence un bloc IA source qui n'existe pas.`,
        }
      }

      if (sourceBlock.order >= block.order) {
        return {
          type: 'error',
          message: `❌ Le bloc '${model.name}' référence un bloc IA source situé après lui dans le pipeline.`,
        }
      }
    }

    // Info: If model only supports 'none' and is placed after another AI block
    if (model.capabilities.supportedModes.length === 1 && model.capabilities.supportedModes[0] === 'none') {
      const hasPreviousAIBlock = aiBlocks.some((b) => b.order < block.order)
      if (hasPreviousAIBlock) {
        return {
          type: 'info',
          message: `ℹ️ ${model.name} va générer une nouvelle image from scratch. L'image générée par le bloc précédent sera ignorée.`,
        }
      }
    }
  }

  // All checks passed
  return { type: 'valid' }
}

/**
 * Helper: Get French label for image usage mode
 */
function getModeFrenchLabel(mode: ImageUsageMode): string {
  switch (mode) {
    case 'none':
      return 'Pas d\'image'
    case 'reference':
      return 'Référence de style'
    case 'edit':
      return 'Édition directe'
    default:
      return mode
  }
}
