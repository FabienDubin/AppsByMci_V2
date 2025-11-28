// AI Models configuration - hardcoded for Epic 1
// Models will be configurable via CMS in Epic 6+ (Post-MVP)

import { AIModel } from './types'

/**
 * Hardcoded AI models configuration for image generation
 * - DALL-E 3: Text-to-image generation (OpenAI)
 * - GPT Image 1: Image editing with input image support (OpenAI)
 * - Imagen 4.0: Text-to-image generation (Google)
 *
 * supportedModes:
 * - 'none': Text-to-image only, no image input
 * - 'reference': Image used as style reference (OpenAI /generations with image param)
 * - 'edit': Direct image transformation (OpenAI /edits endpoint)
 */
export const AI_MODELS: AIModel[] = [
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: 'Génération d\'images créatives à partir de texte uniquement. Ne peut pas utiliser de photo de base.',
    provider: 'openai',
    capabilities: {
      supportedModes: ['none'],  // Text-to-image only
      supportsEdit: false,
      maxSize: 1024,
    },
  },
  {
    id: 'gpt-image-1',
    name: 'GPT Image Edit',
    description: 'Modification et transformation d\'images. Supporte référence de style ou édition directe.',
    provider: 'openai',
    capabilities: {
      supportedModes: ['none', 'reference', 'edit'],  // All modes supported
      supportsEdit: true,
      maxSize: 1536,
    },
  },
  {
    id: 'imagen-4.0-generate-001',
    name: 'Imagen 4.0',
    description: 'Génération d\'images photoréalistes. Peut utiliser des images de référence pour la cohérence de style.',
    provider: 'google',
    capabilities: {
      supportedModes: ['none', 'reference'],  // No edit mode - reference only
      supportsEdit: false,
      maxSize: 1024,
    },
  },
]

/**
 * Get all available AI models
 * @returns Array of all configured AI models
 */
export function getAllModels(): AIModel[] {
  return AI_MODELS
}

/**
 * Get a specific AI model by its ID
 * @param id - The model ID to search for
 * @returns The AI model if found, undefined otherwise
 */
export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((model) => model.id === id)
}

/**
 * Get all models from a specific provider
 * @param provider - The provider to filter by ('openai' or 'google')
 * @returns Array of AI models from the specified provider
 */
export function getModelsByProvider(provider: 'openai' | 'google'): AIModel[] {
  return AI_MODELS.filter((model) => model.provider === provider)
}
