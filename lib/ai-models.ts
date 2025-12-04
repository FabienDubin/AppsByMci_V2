// AI Models configuration - hardcoded for Epic 1
// Models will be configurable via CMS in Epic 6+ (Post-MVP)
//
// Providers: OpenAI + Google (Gemini 2.5)
// POST-MVP: Consider adding Replicate integration for more models

import { AIModel } from './types'

/**
 * Hardcoded AI models configuration for image generation
 * - GPT Image 1: Text-to-image + image editing with input image support (OpenAI)
 * - Gemini 2.5 Flash Image: Text-to-image + reference image support (Google)
 *
 * supportedModes:
 * - 'none': Text-to-image only, no image input
 * - 'reference': Image used as style/subject reference
 * - 'edit': Direct image transformation (OpenAI /edits endpoint)
 */
export const AI_MODELS: AIModel[] = [
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
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    description: 'Génération et édition d\'images avec support de référence. Peut transformer un selfie ou utiliser une image comme base. Excellent pour la préservation du visage.',
    provider: 'google',
    capabilities: {
      supportedModes: ['none', 'reference'],  // Supports reference images via inline_data
      supportsEdit: false,
      maxSize: 2048,
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
