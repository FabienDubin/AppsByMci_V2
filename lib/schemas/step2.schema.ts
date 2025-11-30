/**
 * Step 2: Access Configuration & Base Fields
 * Access type (none, code, email-domain) and participant base fields (name, firstName, email)
 */

import { z } from 'zod'
import { baseFieldConfigSchema } from './common.schema'

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
export type Step2Data = z.infer<typeof step2Schema>
