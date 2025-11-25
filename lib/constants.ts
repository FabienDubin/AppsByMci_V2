// Global constants

export const USER_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const

export const ANIMATION_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export const GENERATION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  GOOGLE: 'google',
} as const

// AI Model IDs for image generation
export const MODEL_IDS = {
  DALLE3: 'dall-e-3',
  GPT_IMAGE_1: 'gpt-image-1',
  IMAGEN_4: 'imagen-4.0-generate-001',
} as const
