// Zod schemas for element forms
import { z } from 'zod'

export const choiceSchema = z.object({
  question: z.string().min(1, 'La question est requise').max(500),
  options: z.array(z.string().max(100)).min(2).max(6),
  required: z.boolean(),
}).refine(
  (data) => {
    const nonEmptyOptions = data.options.filter(opt => opt.trim() !== '')
    return nonEmptyOptions.length >= 2
  },
  { message: 'Vous devez ajouter au moins 2 options de réponse', path: ['options'] }
)

export const sliderSchema = z.object({
  question: z.string().min(1, 'La question est requise').max(500),
  min: z.number(),
  max: z.number(),
  minLabel: z.string().max(50).optional(),
  maxLabel: z.string().max(50).optional(),
  required: z.boolean(),
}).refine(data => data.max > data.min, { message: 'Max doit être > Min', path: ['max'] })

export const freeTextSchema = z.object({
  question: z.string().min(1, 'La question est requise').max(500),
  maxLength: z.number().int().min(50).max(2000),
  placeholder: z.string().max(100).optional(),
  required: z.boolean(),
})

// Inferred types
export type ChoiceFormData = z.infer<typeof choiceSchema>
export type SliderFormData = z.infer<typeof sliderSchema>
export type FreeTextFormData = z.infer<typeof freeTextSchema>
