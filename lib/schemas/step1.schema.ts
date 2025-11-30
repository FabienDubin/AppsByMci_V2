/**
 * Step 1: General Information
 * Animation name, description, and slug
 */

import { z } from 'zod'
import { slugRegex } from './common.schema'

/**
 * Create animation schema (Step 1)
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
 * Step 1 schema (frontend validation)
 */
export const step1Schema = createAnimationSchema

// Inferred types
export type CreateAnimation = z.infer<typeof createAnimationSchema>
export type Step1Data = z.infer<typeof step1Schema>
