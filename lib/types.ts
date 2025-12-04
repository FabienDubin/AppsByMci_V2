// Shared types between frontend and backend
import { AI_PROVIDERS } from './constants'

// User types
export type UserRole = 'admin' | 'editor' | 'viewer'

export interface User {
  _id: string
  email: string
  passwordHash: string
  name?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

// Animation types
export type AnimationStatus = 'draft' | 'published' | 'archived'

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

// AI Model types
export type AIProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS]

// Image usage mode - how the image is used by the AI model
export type ImageUsageMode =
  | 'none'       // No image used - text-to-image generation only
  | 'reference'  // Image as style reference (OpenAI /generations, Gemini multimodal)
  | 'edit'       // Direct image editing/transformation (OpenAI /edits only)

// Image source type - where the image comes from
export type ImageSourceType =
  | 'selfie'           // Selfie uploaded by participant
  | 'url'              // External URL provided by user during config
  | 'upload'           // Image uploaded during config (Azure Blob Storage)
  | 'ai-block-output'  // Output from a previous AI block in the pipeline

// Aspect ratio type for AI generation
export type AspectRatio = '1:1' | '9:16' | '16:9' | '2:3' | '3:2'

// Reference image configuration for AI generation blocks (Story 4.8)
export interface ReferenceImage {
  id: string              // UUID
  name: string            // User-defined name (e.g., "selfie", "logo", "fond")
  source: ImageSourceType // Source type
  url?: string            // URL if source = 'url' or 'upload'
  sourceBlockId?: string  // Block ID if source = 'ai-block-output'
  order: number           // Position (1, 2, 3...)
}

export interface AICapabilities {
  supportedModes: ImageUsageMode[]  // Modes supported by this model
  supportsEdit: boolean
  maxSize: number // Max pixels (1024 for most models)
  supportedAspectRatios: AspectRatio[] // Supported aspect ratios for this model (Story 4.8)
}

export interface AIModel {
  id: string
  name: string
  description: string // User-friendly description of the model and its use case
  provider: AIProvider
  capabilities: AICapabilities
}
