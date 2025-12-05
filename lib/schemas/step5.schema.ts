/**
 * Step 5: Email Configuration
 * Email sending configuration with variable support and design options
 */

import { z } from 'zod'

// Hex color regex pattern
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/

/**
 * Email Design schema
 * Controls visual appearance of the email template
 */
export const emailDesignSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal('')),
  backgroundImageUrl: z.string().url().optional().or(z.literal('')),
  backgroundColor: z.string().regex(hexColorRegex, 'Format de couleur invalide').optional(),
  backgroundColorOpacity: z.number().int().min(0).max(100).optional(),
  contentBackgroundColor: z.string().regex(hexColorRegex, 'Format de couleur invalide').optional(),
  contentBackgroundOpacity: z.number().int().min(0).max(100).optional(),
  primaryColor: z.string().regex(hexColorRegex, 'Format de couleur invalide').optional(),
  textColor: z.string().regex(hexColorRegex, 'Format de couleur invalide').optional(),
  borderRadius: z.number().int().min(0).max(32).optional(),
  ctaText: z.string().max(50, 'Le texte du CTA ne peut pas dépasser 50 caractères').optional().or(z.literal('')),
  // Accept URL, empty string, or {downloadLink} variable
  ctaUrl: z.string().url('URL invalide').optional().or(z.literal('')).or(z.literal('{downloadLink}')),
})

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
    design: emailDesignSchema.optional(),
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
export type EmailDesign = z.infer<typeof emailDesignSchema>
export type EmailConfig = z.infer<typeof emailConfigSchema>
export type Step5Data = z.infer<typeof step5Schema>
