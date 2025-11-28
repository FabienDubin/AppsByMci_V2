import { describe, it, expect } from '@jest/globals'
import { getAvailableVariables, AnimationData } from '@/lib/stores/wizard.store'

describe('Wizard Store - getAvailableVariables', () => {
  describe('Base fields variables', () => {
    it('should return empty array for empty data', () => {
      const data: AnimationData = {}
      const result = getAvailableVariables(data)
      expect(result).toEqual([])
    })

    it('should return {nom} when name field is enabled', () => {
      const data: AnimationData = {
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: false },
          email: { enabled: false, required: false },
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toContain('{nom}')
      expect(result).not.toContain('{prenom}')
      expect(result).not.toContain('{email}')
    })

    it('should return {prenom} when firstName field is enabled', () => {
      const data: AnimationData = {
        baseFields: {
          name: { enabled: false, required: false },
          firstName: { enabled: true, required: false },
          email: { enabled: false, required: false },
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toContain('{prenom}')
      expect(result).not.toContain('{nom}')
    })

    it('should return {email} when email field is enabled', () => {
      const data: AnimationData = {
        baseFields: {
          name: { enabled: false, required: false },
          firstName: { enabled: false, required: false },
          email: { enabled: true, required: true },
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toContain('{email}')
    })

    it('should return all base fields when all are enabled', () => {
      const data: AnimationData = {
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: true, required: false },
          email: { enabled: true, required: true },
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toEqual(['{nom}', '{prenom}', '{email}'])
    })

    it('should return empty array when all base fields are disabled', () => {
      const data: AnimationData = {
        baseFields: {
          name: { enabled: false, required: false },
          firstName: { enabled: false, required: false },
          email: { enabled: false, required: false },
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toEqual([])
    })
  })

  describe('Input collection variables (questions)', () => {
    it('should return {question1} for single choice question', () => {
      const data: AnimationData = {
        inputCollection: {
          elements: [
            {
              id: crypto.randomUUID(),
              type: 'choice',
              order: 0,
              question: 'What is your favorite color?',
              options: ['Red', 'Blue'],
            },
          ],
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toContain('{question1}')
    })

    it('should NOT include selfie in variables', () => {
      const data: AnimationData = {
        inputCollection: {
          elements: [
            {
              id: crypto.randomUUID(),
              type: 'selfie',
              order: 0,
            },
          ],
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toEqual([])
    })

    it('should number questions correctly with mixed elements', () => {
      const data: AnimationData = {
        inputCollection: {
          elements: [
            {
              id: crypto.randomUUID(),
              type: 'selfie',
              order: 0,
            },
            {
              id: crypto.randomUUID(),
              type: 'choice',
              order: 1,
              question: 'Question A',
              options: ['A', 'B'],
            },
            {
              id: crypto.randomUUID(),
              type: 'slider',
              order: 2,
              question: 'Question B',
              min: 0,
              max: 10,
            },
          ],
        },
      }
      const result = getAvailableVariables(data)
      // Note: Current implementation uses array index + 1, so selfie at index 0 is skipped,
      // but question1 will be index 1 (second element), question2 will be index 2
      expect(result).toContain('{question2}')
      expect(result).toContain('{question3}')
      expect(result).not.toContain('{question1}') // selfie was at index 0
    })

    it('should handle multiple question types', () => {
      const data: AnimationData = {
        inputCollection: {
          elements: [
            {
              id: crypto.randomUUID(),
              type: 'choice',
              order: 0,
              question: 'Choice question',
              options: ['A', 'B'],
            },
            {
              id: crypto.randomUUID(),
              type: 'slider',
              order: 1,
              question: 'Slider question',
              min: 0,
              max: 100,
            },
            {
              id: crypto.randomUUID(),
              type: 'free-text',
              order: 2,
              question: 'Free text question',
              maxLength: 500,
            },
          ],
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toContain('{question1}')
      expect(result).toContain('{question2}')
      expect(result).toContain('{question3}')
    })
  })

  describe('Combined base fields and questions', () => {
    it('should return both base fields and questions', () => {
      const data: AnimationData = {
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: true, required: false },
          email: { enabled: false, required: false },
        },
        inputCollection: {
          elements: [
            {
              id: crypto.randomUUID(),
              type: 'choice',
              order: 0,
              question: 'Question 1',
              options: ['A', 'B'],
            },
            {
              id: crypto.randomUUID(),
              type: 'slider',
              order: 1,
              question: 'Question 2',
              min: 0,
              max: 10,
            },
          ],
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toEqual(['{nom}', '{prenom}', '{question1}', '{question2}'])
    })

    it('should maintain correct order: base fields first, then questions', () => {
      const data: AnimationData = {
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: false },
          email: { enabled: true, required: true },
        },
        inputCollection: {
          elements: [
            {
              id: crypto.randomUUID(),
              type: 'free-text',
              order: 0,
              question: 'Question',
              maxLength: 100,
            },
          ],
        },
      }
      const result = getAvailableVariables(data)
      expect(result[0]).toBe('{nom}')
      expect(result[1]).toBe('{email}')
      expect(result[2]).toBe('{question1}')
    })

    it('should handle complete realistic scenario', () => {
      const data: AnimationData = {
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: true, required: false },
          email: { enabled: true, required: true },
        },
        inputCollection: {
          elements: [
            {
              id: crypto.randomUUID(),
              type: 'selfie',
              order: 0,
            },
            {
              id: crypto.randomUUID(),
              type: 'choice',
              order: 1,
              question: 'Quel style préfères-tu?',
              options: ['Futuriste', 'Vintage', 'Minimaliste'],
            },
            {
              id: crypto.randomUUID(),
              type: 'slider',
              order: 2,
              question: 'Niveau de créativité',
              min: 1,
              max: 10,
            },
            {
              id: crypto.randomUUID(),
              type: 'free-text',
              order: 3,
              question: 'Décris ton univers idéal',
              maxLength: 500,
            },
          ],
        },
      }
      const result = getAvailableVariables(data)
      // Base fields
      expect(result).toContain('{nom}')
      expect(result).toContain('{prenom}')
      expect(result).toContain('{email}')
      // Questions (selfie excluded, so question2, question3, question4)
      expect(result).toContain('{question2}')
      expect(result).toContain('{question3}')
      expect(result).toContain('{question4}')
      // Selfie should not generate a variable
      expect(result).not.toContain('{question1}') // selfie was at index 0
      expect(result.length).toBe(6)
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined baseFields', () => {
      const data: AnimationData = {
        inputCollection: {
          elements: [],
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toEqual([])
    })

    it('should handle undefined inputCollection', () => {
      const data: AnimationData = {
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: false },
          email: { enabled: false, required: false },
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toEqual(['{nom}'])
    })

    it('should handle empty elements array', () => {
      const data: AnimationData = {
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: false },
          email: { enabled: false, required: false },
        },
        inputCollection: {
          elements: [],
        },
      }
      const result = getAvailableVariables(data)
      expect(result).toEqual(['{nom}'])
    })
  })
})
