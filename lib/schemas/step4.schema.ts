/**
 * Step 4: Pipeline de Traitement
 * Drag-and-drop blocks: crop-resize, ai-generation, filters, quiz-scoring
 */

import { z } from 'zod'

/**
 * Quiz Scoring profile schema
 */
const scoringProfileSchema = z.object({
  key: z
    .string()
    .min(1, 'La clé est requise')
    .max(5, 'La clé ne peut pas dépasser 5 caractères'),
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional()
    .default(''),
  imageStyle: z
    .string()
    .max(500, 'Le style visuel ne peut pas dépasser 500 caractères')
    .optional()
    .default(''),
})

/**
 * Quiz Scoring option mapping schema
 */
const optionMappingSchema = z.object({
  optionText: z.string(),
  profileKey: z.string().min(1).max(5),
})

/**
 * Quiz Scoring question mapping schema
 */
const questionMappingSchema = z.object({
  elementId: z.string(),
  optionMappings: z.array(optionMappingSchema),
})

/**
 * Quiz Scoring configuration schema
 */
const quizScoringConfigSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom du bloc est requis')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9_]+$/, 'Le nom doit être en minuscules, sans espaces (underscore autorisé)'),
  selectedQuestionIds: z.array(z.string()).min(1, 'Au moins 1 question doit être sélectionnée'),
  questionMappings: z.array(questionMappingSchema),
  profiles: z.array(scoringProfileSchema).min(2, 'Au moins 2 profils sont requis'),
})

/**
 * Reference image schema (Story 4.8)
 * Validates individual reference image configuration
 */
const referenceImageSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Name must contain only alphanumeric characters and underscore'),
  source: z.enum(['selfie', 'url', 'upload', 'ai-block-output']),
  url: z.string().url('URL invalide').optional(),
  sourceBlockId: z.string().uuid('Block ID must be a valid UUID').optional(),
  order: z.number().int().min(1, 'Order must be >= 1'),
})

/**
 * Aspect ratio enum
 */
const aspectRatioSchema = z.enum(['1:1', '9:16', '16:9', '2:3', '3:2'])

/**
 * Pipeline block schema (Step 4)
 */
export const pipelineBlockSchema = z
  .object({
    id: z.string().uuid('ID must be a valid UUID'),
    type: z.enum(['preprocessing', 'ai-generation', 'postprocessing', 'processing']),
    blockName: z.enum(['crop-resize', 'ai-generation', 'filters', 'quiz-scoring']),
    order: z.number().int().min(0, 'Order must be >= 0'),

    config: z.object({
      // Crop & Resize fields
      format: z.enum(['square', '16:9', '4:3', 'original']).optional(),
      dimensions: z
        .number()
        .int()
        .min(256, 'Minimum dimension is 256px')
        .max(2048, 'Maximum dimension is 2048px')
        .optional(),

      // IA Generation fields
      modelId: z.string().optional(),
      promptTemplate: z
        .string()
        .max(2000, 'Prompt template cannot exceed 2000 characters')
        .optional(),

      // Image configuration (for AI generation blocks) - Legacy single image
      imageUsageMode: z.enum(['none', 'reference', 'edit']).optional(),
      imageSource: z.enum(['selfie', 'url', 'upload', 'ai-block-output']).optional(),
      imageUrl: z.string().url('URL invalide').optional(),
      sourceBlockId: z.string().uuid('Block ID must be a valid UUID').optional(),

      // Aspect ratio configuration (Story 4.8)
      aspectRatio: aspectRatioSchema.optional(),

      // Multi-reference images configuration (Story 4.8)
      referenceImages: z.array(referenceImageSchema).max(10, 'Maximum 10 reference images').optional(),

      // Filters fields (future)
      filters: z.array(z.string()).optional(),

      // Quiz Scoring configuration
      quizScoring: quizScoringConfigSchema.optional(),
    }),
  })
  .superRefine((data, ctx) => {
    // Conditional validation based on blockName
    if (data.blockName === 'crop-resize') {
      // Format required
      if (!data.config.format) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Format is required for crop-resize block',
          path: ['config', 'format'],
        })
      }

      // Dimensions required if format != 'original'
      if (data.config.format !== 'original' && !data.config.dimensions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dimensions are required when format is not "original"',
          path: ['config', 'dimensions'],
        })
      }
    }

    if (data.blockName === 'ai-generation') {
      // ModelId required
      if (!data.config.modelId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'AI model selection is required for ai-generation block',
          path: ['config', 'modelId'],
        })
      }

      // PromptTemplate required
      if (!data.config.promptTemplate || data.config.promptTemplate.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Prompt template is required for ai-generation block',
          path: ['config', 'promptTemplate'],
        })
      }
    }
  })

/**
 * Step 4 complete schema
 * Validates entire pipeline structure
 */
export const step4Schema = z
  .object({
    pipeline: z
      .array(pipelineBlockSchema)
      .max(20, 'Maximum 20 blocks allowed in pipeline'),
  })
  .superRefine((data, ctx) => {
    // Validation: Max 4 AI generation blocks
    const aiBlocksCount = data.pipeline.filter((b) => b.type === 'ai-generation').length
    if (aiBlocksCount > 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum 4 AI generation blocks allowed in pipeline',
        path: ['pipeline'],
      })
    }
  })

// Inferred types
export type PipelineBlock = z.infer<typeof pipelineBlockSchema>
export type Step4Data = z.infer<typeof step4Schema>
