import { describe, it, expect } from '@jest/globals'
import { inputElementSchema, step3Schema } from '@/lib/schemas/animation.schema'

describe('Step 3 Schemas - Input Collection', () => {
  describe('inputElementSchema', () => {
    it('should validate selfie element', () => {
      const selfie = {
        id: crypto.randomUUID(),
        type: 'selfie' as const,
        order: 0,
      }

      const result = inputElementSchema.safeParse(selfie)
      expect(result.success).toBe(true)
    })

    it('should validate choice element with min 2 options', () => {
      const choice = {
        id: crypto.randomUUID(),
        type: 'choice' as const,
        order: 0,
        question: 'Quelle est ta couleur préférée?',
        required: true,
        options: ['Rouge', 'Bleu'],
      }

      const result = inputElementSchema.safeParse(choice)
      expect(result.success).toBe(true)
    })

    it('should reject choice element with < 2 options', () => {
      const choice = {
        id: crypto.randomUUID(),
        type: 'choice' as const,
        order: 0,
        question: 'Quelle est ta couleur préférée?',
        options: ['Rouge'],
      }

      const result = inputElementSchema.safeParse(choice)
      expect(result.success).toBe(false)
    })

    it('should validate slider element', () => {
      const slider = {
        id: crypto.randomUUID(),
        type: 'slider' as const,
        order: 0,
        question: 'À quel point aimes-tu le café?',
        required: true,
        min: 0,
        max: 10,
        minLabel: 'Pas du tout',
        maxLabel: 'Totalement',
      }

      const result = inputElementSchema.safeParse(slider)
      expect(result.success).toBe(true)
    })

    it('should reject slider when max <= min', () => {
      const slider = {
        id: crypto.randomUUID(),
        type: 'slider' as const,
        order: 0,
        question: 'À quel point aimes-tu le café?',
        min: 10,
        max: 5,
      }

      const result = inputElementSchema.safeParse(slider)
      expect(result.success).toBe(false)
    })

    it('should validate free-text element', () => {
      const freeText = {
        id: crypto.randomUUID(),
        type: 'free-text' as const,
        order: 0,
        question: 'Décris ton superpouvoir idéal',
        required: true,
        maxLength: 500,
        placeholder: 'Tape ta réponse ici...',
      }

      const result = inputElementSchema.safeParse(freeText)
      expect(result.success).toBe(true)
    })

    it('should reject free-text with maxLength < 50', () => {
      const freeText = {
        id: crypto.randomUUID(),
        type: 'free-text' as const,
        order: 0,
        question: 'Décris ton superpouvoir idéal',
        maxLength: 30,
      }

      const result = inputElementSchema.safeParse(freeText)
      expect(result.success).toBe(false)
    })
  })

  describe('step3Schema', () => {
    it('should validate input collection with 1 element', () => {
      const data = {
        inputCollection: {
          elements: [
            {
              id: crypto.randomUUID(),
              type: 'selfie' as const,
              order: 0,
            },
          ],
        },
      }

      const result = step3Schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject input collection with 0 elements', () => {
      const data = {
        inputCollection: {
          elements: [],
        },
      }

      const result = step3Schema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject input collection with > 1 selfie', () => {
      const data = {
        inputCollection: {
          elements: [
            {
              id: crypto.randomUUID(),
              type: 'selfie' as const,
              order: 0,
            },
            {
              id: crypto.randomUUID(),
              type: 'selfie' as const,
              order: 1,
            },
          ],
        },
      }

      const result = step3Schema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Maximum 1 selfie')
      }
    })

    it('should validate input collection with mixed elements', () => {
      const data = {
        inputCollection: {
          elements: [
            {
              id: crypto.randomUUID(),
              type: 'selfie' as const,
              order: 0,
            },
            {
              id: crypto.randomUUID(),
              type: 'choice' as const,
              order: 1,
              question: 'Question?',
              options: ['A', 'B'],
              required: true,
            },
            {
              id: crypto.randomUUID(),
              type: 'slider' as const,
              order: 2,
              question: 'Slider?',
              min: 0,
              max: 10,
              required: true,
            },
          ],
        },
      }

      const result = step3Schema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})
