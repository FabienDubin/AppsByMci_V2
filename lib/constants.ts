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

// Pipeline error codes (GEN_5XXX series for generation errors)
export const PIPELINE_ERROR_CODES = {
  TIMEOUT: 'GEN_5002',
  API_ERROR: 'GEN_5003',
  UNSUPPORTED_MODEL: 'GEN_5004',
  INVALID_CONFIG: 'GEN_5005',
  REFERENCE_IMAGE_NOT_FOUND: 'GEN_5006',  // AC7: Image de référence non chargeable
  SELFIE_REQUIRED_MISSING: 'GEN_5007',    // AC8: Selfie requis mais manquant
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
