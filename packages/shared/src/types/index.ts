// User types
export interface User {
  id: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  createdAt: Date
  updatedAt: Date
}

// Animation types
export type AnimationStatus = 'draft' | 'published' | 'archived'

export interface Animation {
  id: string
  userId: string
  name: string
  slug: string
  description: string
  status: AnimationStatus
  createdAt: Date
  updatedAt: Date
}

// Generation types
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Generation {
  id: string
  animationId: string
  status: GenerationStatus
  generatedImageUrl?: string
  error?: string
  createdAt: Date
  updatedAt: Date
}

// AI Model types
export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'google'
  capabilities: {
    requiresImage: boolean
    supportsEdit: boolean
    maxSize?: number
  }
}
