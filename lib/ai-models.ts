// AI Models configuration - hardcoded for Epic 1
// Models will be configurable via CMS in Epic 6+ (Post-MVP)

import { AIModel } from './types'

/**
 * Hardcoded AI models configuration for image generation
 * - DALL-E 3: Text-to-image generation (OpenAI)
 * - GPT Image 1: Image editing with input image support (OpenAI)
 * - Imagen 4.0: Text-to-image generation (Google)
 */
export const AI_MODELS: AIModel[] = [
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    capabilities: {
      requiresImage: false,
      supportsEdit: false,
      maxSize: 1024,
    },
  },
  {
    id: 'gpt-image-1',
    name: 'GPT Image Edit',
    provider: 'openai',
    capabilities: {
      requiresImage: true,
      supportsEdit: true,
      maxSize: 1536,
    },
  },
  {
    id: 'imagen-4.0-generate-001',
    name: 'Imagen 4.0',
    provider: 'google',
    capabilities: {
      requiresImage: false,
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
