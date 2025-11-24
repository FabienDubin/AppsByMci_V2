// Types partagés entre frontend et backend

// User types
export type UserRole = 'admin' | 'editor' | 'viewer'

export interface User {
  _id: string
  email: string
  passwordHash: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

// Animation types
export type AnimationStatus = 'draft' | 'published' | 'archived'
export type AccessValidationType = 'open' | 'code' | 'email'

export interface AccessValidation {
  type: AccessValidationType
  value?: string // Code or email domain
}

export interface PipelineBlock {
  blockType: string
  config: Record<string, any>
}

export interface Animation {
  _id: string
  userId: string
  name: string
  slug: string
  description: string
  status: AnimationStatus
  accessValidation: AccessValidation
  pipeline: PipelineBlock[]
  createdAt: Date
  updatedAt: Date
}

// Generation types
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Generation {
  _id: string
  animationId: string
  participantData: Record<string, any>
  selfieUrl?: string // Original image uploaded by participant
  status: GenerationStatus
  generatedImageUrl?: string // AI-generated image
  error?: string
  createdAt: Date
  updatedAt: Date
}

// Session types
export interface Session {
  _id: string
  userId: string
  refreshToken: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export type AIProvider = 'openai' | 'google'

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  capabilities: {
    requiresImage: boolean
    supportsEdit: boolean
    maxSize?: number
  }
}
