// Animation summary utility for Step 8 recap display
// Generates a structured summary of the animation configuration

import type { AnimationData, AnimationSummary } from '@/lib/stores/wizard.store'
import { validateForPublication } from '@/lib/services/animation-validation.service'

// AI Model display names mapping
const AI_MODEL_NAMES: Record<string, string> = {
  'dall-e-3': 'DALL-E 3',
  'gpt-image-1': 'GPT Image 1',
  'imagen-4.0-generate-001': 'Google Imagen 4.0',
}

// Block type display names
const BLOCK_TYPE_NAMES: Record<string, string> = {
  'preprocessing': 'Prétraitement',
  'ai-generation': 'Génération IA',
  'postprocessing': 'Post-traitement',
}

// Block name display names
const BLOCK_NAME_DISPLAY: Record<string, string> = {
  'crop-resize': 'Recadrage & Redimensionnement',
  'ai-generation': 'Génération IA',
  'filters': 'Filtres',
}

/**
 * Generate a structured summary of the animation configuration
 * Used to display the recap in Step 8
 *
 * @param data - Animation data from wizard store
 * @returns AnimationSummary object for display
 */
export function generateSummary(data: AnimationData): AnimationSummary {
  // Section 1: General Info
  const generalInfo = {
    name: data.name || '',
    description: data.description,
    slug: data.slug || '',
  }

  // Section 2: Access Config
  let accessDisplayText = 'Accès libre pour tous'
  if (data.accessConfig?.type === 'code') {
    accessDisplayText = `Code requis : ${data.accessConfig.code || 'Non défini'}`
  } else if (data.accessConfig?.type === 'email-domain') {
    const domains = data.accessConfig.emailDomains?.join(', ') || 'Non défini'
    accessDisplayText = `Domaines autorisés : ${domains}`
  }

  const accessConfig = {
    type: data.accessConfig?.type || 'none',
    displayText: accessDisplayText,
  }

  // Section 3: Data Collection
  const baseFields = [
    {
      label: data.baseFields?.name?.label || 'Nom',
      fieldType: 'name',
      active: data.baseFields?.name?.enabled ?? false,
    },
    {
      label: data.baseFields?.firstName?.label || 'Prénom',
      fieldType: 'firstName',
      active: data.baseFields?.firstName?.enabled ?? false,
    },
    {
      label: data.baseFields?.email?.label || 'Email',
      fieldType: 'email',
      active: data.baseFields?.email?.enabled ?? false,
    },
  ]
  const baseFieldsCount = baseFields.filter((f) => f.active).length

  const advancedInputs =
    data.inputCollection?.elements
      ?.filter((el) => el.type !== 'selfie')
      .map((el) => ({
        label: el.question || `Question ${el.type}`,
        type: el.type,
      })) || []
  const advancedInputsCount = advancedInputs.length

  const selfieRequired =
    data.inputCollection?.elements?.some((el) => el.type === 'selfie') ?? false

  const totalFields = baseFieldsCount + advancedInputsCount + (selfieRequired ? 1 : 0)

  const dataCollection = {
    baseFieldsCount,
    baseFields,
    advancedInputsCount,
    advancedInputs,
    selfieRequired,
    totalFields,
  }

  // Section 4: Pipeline
  const pipelineBlocks = data.pipeline || []
  const blocksCount = pipelineBlocks.length
  const hasAiBlock = pipelineBlocks.some((b) => b.type === 'ai-generation')

  // Find AI model from first AI generation block
  const aiBlock = pipelineBlocks.find((b) => b.type === 'ai-generation')
  const aiModelId = aiBlock?.config.modelId || ''
  const aiModel = AI_MODEL_NAMES[aiModelId] || aiModelId || 'Non défini'

  const blocks = pipelineBlocks.map((block) => {
    let summary = BLOCK_NAME_DISPLAY[block.blockName] || block.blockName

    if (block.blockName === 'crop-resize' && block.config.format) {
      summary = `${summary} (${block.config.format})`
    }
    if (block.blockName === 'ai-generation' && block.config.modelId) {
      const modelName = AI_MODEL_NAMES[block.config.modelId] || block.config.modelId
      summary = `${summary} - ${modelName}`
    }

    return {
      type: BLOCK_TYPE_NAMES[block.type] || block.type,
      summary,
    }
  })

  const pipeline = {
    blocksCount,
    aiModel,
    blocks,
    hasAiBlock,
  }

  // Section 5: Email
  const emailEnabled = data.emailConfig?.enabled ?? false
  const emailSubject = data.emailConfig?.subject
  let variablesCount = 0
  if (emailSubject) {
    const matches = emailSubject.match(/\{[^}]+\}/g)
    variablesCount = matches ? matches.length : 0
  }
  // Also count variables in body template
  if (data.emailConfig?.bodyTemplate) {
    const bodyMatches = data.emailConfig.bodyTemplate.match(/\{[^}]+\}/g)
    variablesCount += bodyMatches ? bodyMatches.length : 0
  }

  const email = {
    enabled: emailEnabled,
    subject: emailEnabled ? emailSubject : undefined,
    variablesCount: emailEnabled ? variablesCount : undefined,
  }

  // Section 6: Public Display
  const publicDisplayEnabled = data.publicDisplayConfig?.enabled ?? true

  const publicDisplay = {
    enabled: publicDisplayEnabled,
    layout: publicDisplayEnabled ? data.publicDisplayConfig?.layout : undefined,
    columns: publicDisplayEnabled ? data.publicDisplayConfig?.columns : undefined,
    autoScroll: publicDisplayEnabled ? data.publicDisplayConfig?.autoScroll : undefined,
    autoScrollSpeed: publicDisplayEnabled ? data.publicDisplayConfig?.autoScrollSpeed : undefined,
    refreshInterval: publicDisplayEnabled ? data.publicDisplayConfig?.refreshInterval : undefined,
  }

  // Section 7: Customization
  const customization = {
    primaryColor: data.customization?.primaryColor || '#000000',
    secondaryColor: data.customization?.secondaryColor || '#71717a',
    hasLogo: !!data.customization?.logo,
    logoUrl: data.customization?.logo,
    theme: data.customization?.theme || 'auto',
    loadingMessagesCount: data.customization?.loadingMessages?.length || 4,
  }

  // Validation
  const validationResult = validateForPublication(data)

  return {
    generalInfo,
    accessConfig,
    dataCollection,
    pipeline,
    email,
    publicDisplay,
    customization,
    isComplete: validationResult.isValid,
    validationErrors: validationResult.errors,
  }
}

/**
 * Get layout display name
 */
export function getLayoutDisplayName(layout: string): string {
  const layoutNames: Record<string, string> = {
    masonry: 'Masonry',
    grid: 'Grille',
    carousel: 'Carousel',
  }
  return layoutNames[layout] || layout
}

/**
 * Get scroll speed display name
 */
export function getScrollSpeedDisplayName(speed: string): string {
  const speedNames: Record<string, string> = {
    slow: 'Lent',
    medium: 'Moyen',
    fast: 'Rapide',
  }
  return speedNames[speed] || speed
}

/**
 * Get theme display name
 */
export function getThemeDisplayName(theme: string): string {
  const themeNames: Record<string, string> = {
    light: 'Clair',
    dark: 'Sombre',
    auto: 'Automatique',
  }
  return themeNames[theme] || theme
}

/**
 * Get input type display name
 */
export function getInputTypeDisplayName(type: string): string {
  const typeNames: Record<string, string> = {
    choice: 'Choix multiple',
    slider: 'Slider',
    'free-text': 'Texte libre',
    selfie: 'Selfie',
  }
  return typeNames[type] || type
}
