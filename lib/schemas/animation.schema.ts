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
 * Input Element schema (Step 3)
 * Defined BEFORE updateAnimationSchema to avoid circular reference
 */
export const inputElementSchema = z
  .object({
    id: z.string().uuid('ID must be a valid UUID'),
    type: z.enum(['selfie', 'choice', 'slider', 'free-text']),
    order: z.number().int().min(0, 'Order must be >= 0'),

    // Conditional fields (based on type)
    question: z.string().max(500, 'Question cannot exceed 500 characters').optional(),
    required: z.boolean().optional(),

    // Choice fields
    options: z
      .array(z.string().max(100, 'Each option cannot exceed 100 characters'))
      .min(2, 'Minimum 2 options required')
      .max(6, 'Maximum 6 options allowed')
      .optional(),

    // Slider fields
    min: z.number().optional(),
    max: z.number().optional(),
    minLabel: z.string().max(50, 'Min label cannot exceed 50 characters').optional(),
    maxLabel: z.string().max(50, 'Max label cannot exceed 50 characters').optional(),

    // Free-text fields
    maxLength: z
      .number()
      .int()
      .min(50, 'Minimum limit is 50 characters')
      .max(2000, 'Maximum limit is 2000 characters')
      .optional(),
    placeholder: z
      .string()
      .max(100, 'Placeholder cannot exceed 100 characters')
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Conditional validation based on type
    if (data.type === 'choice') {
      if (!data.question || data.question.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Question is required for multiple choice question',
          path: ['question'],
        })
      }
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Minimum 2 options required for multiple choice question',
          path: ['options'],
        })
      }
    }

    if (data.type === 'slider') {
      if (!data.question || data.question.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Question is required for slider question',
          path: ['question'],
        })
      }
      if (data.min === undefined || data.max === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Min and max values are required for slider question',
          path: ['min'],
        })
      }
      if (data.min !== undefined && data.max !== undefined && data.min >= data.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Max value must be greater than min value',
          path: ['max'],
        })
      }
    }

    if (data.type === 'free-text') {
      if (!data.question || data.question.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Question is required for free text response',
          path: ['question'],
        })
      }
      if (!data.maxLength) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Character limit is required for free text response',
          path: ['maxLength'],
        })
      }
    }
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
  inputCollection: z
    .object({
      elements: z.array(inputElementSchema),
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

/**
 * Step 3 schema (Input Collection)
 * Validation: min 1 element, max 1 selfie
 */
export const step3Schema = z
  .object({
    inputCollection: z.object({
      elements: z
        .array(inputElementSchema)
        .min(1, 'You must add at least one collection element (selfie or question)'),
    }),
  })
  .superRefine((data, ctx) => {
    // Validation: max 1 selfie
    const selfieCount = data.inputCollection.elements.filter((el) => el.type === 'selfie').length
    if (selfieCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum 1 selfie allowed per animation',
        path: ['inputCollection', 'elements'],
      })
    }
  })

// Inferred types
export type CreateAnimation = z.infer<typeof createAnimationSchema>
export type UpdateAnimation = z.infer<typeof updateAnimationSchema>
export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type InputElement = z.infer<typeof inputElementSchema>
export type Step3Data = z.infer<typeof step3Schema>
