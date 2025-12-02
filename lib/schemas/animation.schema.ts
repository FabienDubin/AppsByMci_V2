/**
 * Animation Schema - Main file
 * Exports all step schemas and main animation schemas (create, update)
 */

import { z } from 'zod'
import { slugRegex, baseFieldConfigSchema } from './common.schema'
import { aiConsentSchema } from './step2.schema'
import { inputElementSchema } from './step3.schema'
import { pipelineBlockSchema } from './step4.schema'

// ============================================
// RE-EXPORTS: All step schemas and types
// ============================================

export * from './common.schema'
export * from './step1.schema'
export * from './step2.schema'
export * from './step3.schema'
export * from './step4.schema'
export * from './step5.schema'
export * from './step6.schema'
export * from './step7.schema'

// ============================================
// UPDATE ANIMATION SCHEMA (Main API Schema)
// ============================================

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
      aiConsent: aiConsentSchema.optional(),
    })
    .optional(),
  inputCollection: z
    .object({
      elements: z.array(inputElementSchema),
    })
    .optional(),
  pipeline: z.array(pipelineBlockSchema).optional(),
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
      subject: z.string().max(200).optional(),
      bodyTemplate: z.string().max(10000).optional(),
      senderName: z.string().max(100).default('AppsByMCI'),
      senderEmail: z.string().email().default('noreply@appsbymci.com'),
    })
    .optional(),
  // Step 6: Public Display Config (new complete schema)
  publicDisplayConfig: z
    .object({
      enabled: z.boolean().optional(),
      layout: z.enum(['masonry', 'grid', 'carousel']).optional(),
      columns: z.number().int().min(2).max(5).optional(),
      autoScroll: z.boolean().optional(),
      autoScrollSpeed: z.enum(['slow', 'medium', 'fast']).optional(),
      showParticipantName: z.boolean().optional(),
      refreshInterval: z.number().int().min(5).max(60).optional(),
    })
    .optional(),
  // Legacy displayConfig (deprecated, kept for backward compatibility)
  displayConfig: z
    .object({
      enabled: z.boolean(),
      layout: z.string(),
      columns: z.number(),
      showNames: z.boolean(),
      refreshInterval: z.number(),
    })
    .optional(),
  // Step 7: Customization (new complete schema)
  customization: z
    .object({
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      logo: z.string().url().optional(),
      backgroundImage: z.string().url().optional(),
      backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      backgroundColorOpacity: z.number().int().min(0).max(100).optional(),
      textCard: z.object({
        enabled: z.boolean(),
        backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        opacity: z.number().int().min(0).max(100),
        borderRadius: z.number().int().min(0).max(24),
        padding: z.number().int().min(8).max(32),
      }).optional(),
      theme: z.enum(['light', 'dark', 'auto']).optional(),
      // Story 3.13: No character limit - welcomeMessage is now HTML from WYSIWYG editor
      welcomeMessage: z.string().optional(),
      submissionMessage: z.string().max(100).optional(),
      loadingMessages: z.array(z.string().max(100)).min(3).max(10).optional(),
      thankYouMessage: z.string().max(100).optional(),
      // Legacy fields for backward compatibility
      colors: z.record(z.string()).optional(),
    })
    .optional(),
  qrCodeUrl: z.string().optional(),
  publishedAt: z.date().optional(),
})

// Inferred types
export type UpdateAnimation = z.infer<typeof updateAnimationSchema>
