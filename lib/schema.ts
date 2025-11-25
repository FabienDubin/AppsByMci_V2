import { z } from 'zod'
import { AI_PROVIDERS } from './constants'

// User validation schema
export const UserSchema = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(60),
  role: z.enum(['admin', 'editor', 'viewer']),
})

// Animation validation schema
export const AnimationSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['draft', 'published', 'archived']),
  userId: z.string(),
})

// Generation validation schema
export const GenerationSchema = z.object({
  animationId: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  generatedImageUrl: z.string().url().optional(),
  error: z.string().optional(),
})

// AI provider values for enum validation
export const AIProviderValues = Object.values(AI_PROVIDERS) as [string, ...string[]]

// AI model capabilities schema
export const AICapabilitiesSchema = z.object({
  requiresImage: z.boolean(),
  supportsEdit: z.boolean(),
  maxSize: z.number(),
})

// AI model schema
export const AIModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(AIProviderValues),
  capabilities: AICapabilitiesSchema,
})
