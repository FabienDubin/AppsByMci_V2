/**
 * Step 7: Customization
 * Branding and personalization (colors, logo, background, messages)
 */

import { z } from 'zod'
import { hexColorRegex } from './common.schema'

/**
 * Text Card schema (Step 7)
 * Configuration for text card overlay ensuring text readability
 */
export const textCardSchema = z.object({
  enabled: z.boolean(),
  backgroundColor: z
    .string()
    .regex(hexColorRegex, 'Format de couleur invalide (ex: #FFFFFF)'),
  opacity: z
    .number()
    .int()
    .min(0, 'Opacité minimum 0%')
    .max(100, 'Opacité maximum 100%'),
  borderRadius: z
    .number()
    .int()
    .min(0, 'Arrondi minimum 0px')
    .max(24, 'Arrondi maximum 24px'),
  padding: z
    .number()
    .int()
    .min(8, 'Padding minimum 8px')
    .max(32, 'Padding maximum 32px'),
})

/**
 * Customization schema (Step 7)
 * Configuration for branding and personalization
 */
export const customizationSchema = z.object({
  primaryColor: z
    .string()
    .regex(hexColorRegex, 'Format de couleur invalide (ex: #000000)'),
  secondaryColor: z
    .string()
    .regex(hexColorRegex, 'Format de couleur invalide (ex: #71717a)'),
  logo: z.string().url('URL invalide pour le logo').optional(),
  backgroundImage: z.string().url('URL invalide pour l\'image de fond').optional(),
  backgroundColor: z
    .string()
    .regex(hexColorRegex, 'Format de couleur invalide')
    .optional(),
  backgroundColorOpacity: z
    .number()
    .int()
    .min(0, 'Opacité minimum 0%')
    .max(100, 'Opacité maximum 100%')
    .optional(),
  textCard: textCardSchema.optional(),
  theme: z.enum(['light', 'dark', 'auto']),
  // Story 3.13: No character limit - welcomeMessage is now HTML from WYSIWYG editor
  welcomeMessage: z
    .string()
    .optional(),
  submissionMessage: z
    .string()
    .max(100, 'Le message après soumission ne peut pas dépasser 100 caractères'),
  loadingMessages: z
    .array(z.string().max(100, 'Chaque message ne peut pas dépasser 100 caractères'))
    .min(3, 'Minimum 3 messages requis')
    .max(10, 'Maximum 10 messages autorisés'),
  thankYouMessage: z
    .string()
    .max(100, 'Le message de remerciement ne peut pas dépasser 100 caractères'),
})

/**
 * Step 7 schema (Customization)
 * Wraps customizationSchema for step-level validation
 */
export const step7Schema = z.object({
  customization: customizationSchema,
})

// Inferred types
export type TextCard = z.infer<typeof textCardSchema>
export type Customization = z.infer<typeof customizationSchema>
export type Step7Data = z.infer<typeof step7Schema>
