// Animation Service Types
// Shared types and constants for animation services

// Animation error codes
export const ANIMATION_ERRORS = {
  SLUG_EXISTS: 'VALIDATION_2002',
  NOT_FOUND: 'NOT_FOUND_3001',
  ACCESS_DENIED: 'AUTH_1003',
} as const

// Animation response type for API
export interface AnimationResponse {
  id: string
  userId: string
  name: string
  slug: string
  description: string
  status: 'draft' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date
  [key: string]: any // Allow additional fields from wizard steps
}

// Animation filter types
export type AnimationFilter = 'active' | 'archived' | 'all'
