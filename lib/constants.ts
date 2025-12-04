// Global constants

export const USER_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  GOOGLE: 'google',
} as const

// AI Model IDs for image generation
export const MODEL_IDS = {
  GPT_IMAGE_1: 'gpt-image-1',
  GEMINI_FLASH_IMAGE: 'gemini-2.5-flash-image',
} as const

export const STATUS_VALUE = {
  ANIMATION: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
  },
  GENERATION: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
}
