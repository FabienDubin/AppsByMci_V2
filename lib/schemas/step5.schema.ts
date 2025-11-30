/**
 * Step 5: Email Configuration
 * Email sending configuration with variable support
 */

import { z } from 'zod'

/**
 * Email Config schema (Step 5)
 * Validation conditionnelle: si enabled=true, subject et bodyTemplate requis
 */
export const emailConfigSchema = z
  .object({
    enabled: z.boolean(),
    subject: z
      .string()
      .max(200, 'Le sujet ne peut pas dépasser 200 caractères')
      .optional(),
    bodyTemplate: z
      .string()
      .max(10000, 'Le corps de l\'email ne peut pas dépasser 10000 caractères')
      .optional(),
    senderName: z.string().max(100, 'Le nom de l\'expéditeur ne peut pas dépasser 100 caractères'),
    senderEmail: z
      .string()
      .email('Format d\'email invalide'),
  })
  .superRefine((data, ctx) => {
    // Conditional validation: if enabled=true, subject and bodyTemplate required
    if (data.enabled) {
      if (!data.subject || data.subject.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Le sujet de l\'email est requis',
          path: ['subject'],
        })
      }
      if (!data.bodyTemplate || data.bodyTemplate.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Le corps de l\'email est requis',
          path: ['bodyTemplate'],
        })
      }
    }
  })

/**
 * Step 5 schema (Email Configuration)
 * Wraps emailConfigSchema for step-level validation
 */
export const step5Schema = z.object({
  emailConfig: emailConfigSchema,
})

// Inferred types
export type EmailConfig = z.infer<typeof emailConfigSchema>
export type Step5Data = z.infer<typeof step5Schema>
