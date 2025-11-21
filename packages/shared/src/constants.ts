// API constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Animation status values
export const ANIMATION_STATUS = {
  DRAFT: 'draft' as const,
  PUBLISHED: 'published' as const,
  ARCHIVED: 'archived' as const,
}

// Generation status values
export const GENERATION_STATUS = {
  PENDING: 'pending' as const,
  PROCESSING: 'processing' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
}

// AI providers
export const AI_PROVIDERS = {
  OPENAI: 'openai' as const,
  GOOGLE: 'google' as const,
}

// User roles
export const USER_ROLES = {
  ADMIN: 'admin' as const,
  EDITOR: 'editor' as const,
  VIEWER: 'viewer' as const,
}
