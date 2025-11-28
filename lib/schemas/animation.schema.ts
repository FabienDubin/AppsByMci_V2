import { z } from 'zod'

// Slug validation regex: kebab-case (lowercase alphanumeric with hyphens)
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Create animation schema (Step 1 - POST /api/animations)
 */
export const createAnimationSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
  slug: z
    .string()
    .min(1, 'Le slug est requis')
    .regex(slugRegex, 'Le slug doit être en kebab-case (ex: mon-animation)'),
})

/**
 * Update animation schema (PUT /api/animations/[id])
 * All fields optional for partial updates
 */
export const updateAnimationSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .optional(),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
  slug: z
    .string()
    .min(1, 'Le slug est requis')
    .regex(slugRegex, 'Le slug doit être en kebab-case (ex: mon-animation)')
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  // Additional fields for wizard steps 2-8 (added progressively)
  accessValidation: z
    .object({
      type: z.enum(['open', 'code', 'email']),
      value: z.string().optional(),
    })
    .optional(),
  questions: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(['text', 'email', 'number', 'choice', 'slider', 'selfie']),
        label: z.string(),
        required: z.boolean(),
        options: z.array(z.string()).optional(),
        validation: z.record(z.any()).optional(),
      })
    )
    .optional(),
  pipeline: z
    .array(
      z.object({
        blockType: z.string(),
        config: z.record(z.any()),
      })
    )
    .optional(),
  aiModel: z
    .object({
      modelId: z.string(),
      prompt: z.string(),
      variables: z.array(z.string()),
    })
    .optional(),
  emailConfig: z
    .object({
      enabled: z.boolean(),
      subject: z.string(),
      template: z.string(),
      sender: z.string(),
    })
    .optional(),
  displayConfig: z
    .object({
      enabled: z.boolean(),
      layout: z.string(),
      columns: z.number(),
      showNames: z.boolean(),
      refreshInterval: z.number(),
    })
    .optional(),
  customization: z
    .object({
      colors: z.record(z.string()),
      logo: z.string().optional(),
      theme: z.string(),
    })
    .optional(),
  qrCodeUrl: z.string().optional(),
  publishedAt: z.date().optional(),
})

/**
 * Step 1 schema (frontend validation)
 * Same as createAnimationSchema
 */
export const step1Schema = createAnimationSchema

// Inferred types
export type CreateAnimation = z.infer<typeof createAnimationSchema>
export type UpdateAnimation = z.infer<typeof updateAnimationSchema>
export type Step1Data = z.infer<typeof step1Schema>
