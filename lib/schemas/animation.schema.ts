import { z } from 'zod'

// Slug validation regex: kebab-case (lowercase alphanumeric with hyphens)
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Base field configuration schema
 */
const baseFieldConfigSchema = z.object({
  enabled: z.boolean(),
  required: z.boolean(),
  label: z.string().max(50, 'Le label ne peut pas dépasser 50 caractères').optional(),
  placeholder: z.string().max(100, 'Le placeholder ne peut pas dépasser 100 caractères').optional(),
})

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
  accessConfig: z
    .object({
      type: z.enum(['none', 'code', 'email-domain']),
      code: z.string().optional(),
      emailDomains: z.array(z.string()).optional(),
    })
    .optional(),
  baseFields: z
    .object({
      name: baseFieldConfigSchema.optional(),
      firstName: baseFieldConfigSchema.optional(),
      email: baseFieldConfigSchema.optional(),
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

/**
 * Step 2 schema (Access Config + Base Fields)
 * Validation conditionnelle selon type d'accès
 */
export const step2Schema = z
  .object({
    accessConfig: z.object({
      type: z.enum(['none', 'code', 'email-domain']),
      code: z.string().optional(),
      emailDomains: z.array(z.string()).optional(),
    }),
    baseFields: z.object({
      name: baseFieldConfigSchema,
      firstName: baseFieldConfigSchema,
      email: baseFieldConfigSchema,
    }),
  })
  .superRefine((data, ctx) => {
    // Validation conditionnelle: Si type='code' → code requis
    if (data.accessConfig.type === 'code') {
      if (!data.accessConfig.code || data.accessConfig.code.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le code d'accès est requis quand le type est 'code'",
          path: ['accessConfig', 'code'],
        })
      }
    }

    // Validation conditionnelle: Si type='email-domain' → emailDomains requis
    if (data.accessConfig.type === 'email-domain') {
      if (!data.accessConfig.emailDomains || data.accessConfig.emailDomains.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Au moins un domaine email est requis',
          path: ['accessConfig', 'emailDomains'],
        })
      } else {
        // Validation format: chaque domaine doit commencer par @
        data.accessConfig.emailDomains.forEach((domain, index) => {
          if (!domain.startsWith('@')) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Le domaine "${domain}" doit commencer par @ (ex: @company.com)`,
              path: ['accessConfig', 'emailDomains', index],
            })
          }
        })
      }

      // Validation cohérence: Si type='email-domain', alors baseFields.email.enabled=true
      if (!data.baseFields.email.enabled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le champ Email doit être activé pour valider par domaine email",
          path: ['baseFields', 'email', 'enabled'],
        })
      }
    }
  })

// Inferred types
export type CreateAnimation = z.infer<typeof createAnimationSchema>
export type UpdateAnimation = z.infer<typeof updateAnimationSchema>
export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
