/**
 * Step 3: Advanced Input Collection
 * Selfie and questions (choice, slider, free-text)
 */

import { z } from 'zod'

/**
 * Input Element schema (Step 3)
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
export type InputElement = z.infer<typeof inputElementSchema>
export type Step3Data = z.infer<typeof step3Schema>
