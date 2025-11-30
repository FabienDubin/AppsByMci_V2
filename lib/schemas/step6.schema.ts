/**
 * Step 6: Public Display Configuration
 * Gallery display settings (masonry, grid, carousel)
 */

import { z } from 'zod'

/**
 * Public Display Config schema (Step 6)
 * Configuration for the public display screen (gallery)
 */
export const publicDisplayConfigSchema = z
  .object({
    enabled: z.boolean(),
    layout: z.enum(['masonry', 'grid', 'carousel']),
    columns: z.number().int().min(2, 'Minimum 2 colonnes').max(5, 'Maximum 5 colonnes').optional(),
    autoScroll: z.boolean().optional(),
    autoScrollSpeed: z.enum(['slow', 'medium', 'fast']).optional(),
    showParticipantName: z.boolean(),
    refreshInterval: z.number().int().min(5, 'Minimum 5 secondes').max(60, 'Maximum 60 secondes'),
  })
  .superRefine((data, ctx) => {
    // Columns required if layout is masonry or grid (not carousel)
    if (data.layout !== 'carousel' && data.columns === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le nombre de colonnes est requis pour Masonry et Grid',
        path: ['columns'],
      })
    }

    // autoScrollSpeed required if autoScroll is enabled and layout is not carousel
    if (data.layout !== 'carousel' && data.autoScroll && !data.autoScrollSpeed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La vitesse de défilement est requise si auto-scroll est activé',
        path: ['autoScrollSpeed'],
      })
    }
  })

/**
 * Step 6 schema (Public Display Configuration)
 * Wraps publicDisplayConfigSchema for step-level validation
 */
export const step6Schema = z.object({
  publicDisplayConfig: publicDisplayConfigSchema,
})

// Inferred types
export type PublicDisplayConfig = z.infer<typeof publicDisplayConfigSchema>
export type Step6Data = z.infer<typeof step6Schema>
