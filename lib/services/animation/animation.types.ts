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

// Animation list options (search, pagination)
export interface AnimationListOptions {
  filter?: AnimationFilter
  search?: string
  page?: number
  limit?: number
}

// Pagination info
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Animation list result with pagination
export interface AnimationListResult {
  data: import('@/models/Animation.model').IAnimation[]
  pagination: PaginationInfo
}
