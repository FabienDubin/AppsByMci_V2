/**
 * Common schemas and validators
 * Shared across multiple step schemas
 */

import { z } from 'zod'

/**
 * Slug validation regex: kebab-case (lowercase alphanumeric with hyphens)
 */
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Hex color regex validation (6 characters only, no short form)
 */
export const hexColorRegex = /^#[0-9A-Fa-f]{6}$/

/**
 * Base field configuration schema
 */
export const baseFieldConfigSchema = z.object({
  enabled: z.boolean(),
  required: z.boolean(),
  label: z.string().max(50, 'Le label ne peut pas dépasser 50 caractères').optional(),
  placeholder: z.string().max(100, 'Le placeholder ne peut pas dépasser 100 caractères').optional(),
})

// Inferred types
export type BaseFieldConfig = z.infer<typeof baseFieldConfigSchema>
