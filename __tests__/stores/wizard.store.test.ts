import { describe, it, expect } from '@jest/globals'
import {
  getAvailableVariables,
  getAvailableEmailVariables,
  DEFAULT_EMAIL_CONFIG,
  AnimationData,
} from '@/lib/stores/wizard.store'

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
      // Selfie is skipped, questions are numbered sequentially: question1, question2
      expect(result).toContain('{question1}')
      expect(result).toContain('{question2}')
      expect(result.length).toBe(2)
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
      // Questions (selfie excluded, numbered sequentially: question1, question2, question3)
      expect(result).toContain('{question1}')
      expect(result).toContain('{question2}')
      expect(result).toContain('{question3}')
      // Total: 3 base fields + 3 questions = 6
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

describe('Wizard Store - getAvailableEmailVariables', () => {
  it('should include all base variables plus {imageUrl}', () => {
    const data: AnimationData = {
      baseFields: {
        name: { enabled: true, required: true },
        firstName: { enabled: true, required: false },
        email: { enabled: true, required: true },
      },
    }
    const result = getAvailableEmailVariables(data)
    expect(result).toContain('{nom}')
    expect(result).toContain('{prenom}')
    expect(result).toContain('{email}')
    expect(result).toContain('{imageUrl}')
  })

  it('should always include {imageUrl} even with no base fields', () => {
    const data: AnimationData = {}
    const result = getAvailableEmailVariables(data)
    expect(result).toContain('{imageUrl}')
  })

  it('should include questions and {imageUrl}', () => {
    const data: AnimationData = {
      baseFields: {
        name: { enabled: true, required: true },
        firstName: { enabled: false, required: false },
        email: { enabled: false, required: false },
      },
      inputCollection: {
        elements: [
          {
            id: crypto.randomUUID(),
            type: 'choice',
            order: 0,
            question: 'Color?',
            options: ['Red', 'Blue'],
          },
        ],
      },
    }
    const result = getAvailableEmailVariables(data)
    expect(result).toContain('{nom}')
    expect(result).toContain('{question1}')
    expect(result).toContain('{imageUrl}')
    expect(result.length).toBe(3)
  })

  it('should have {imageUrl} as the last element', () => {
    const data: AnimationData = {
      baseFields: {
        name: { enabled: true, required: true },
        firstName: { enabled: false, required: false },
        email: { enabled: false, required: false },
      },
    }
    const result = getAvailableEmailVariables(data)
    expect(result[result.length - 1]).toBe('{imageUrl}')
  })
})

describe('Wizard Store - DEFAULT_EMAIL_CONFIG', () => {
  it('should have enabled set to false by default', () => {
    expect(DEFAULT_EMAIL_CONFIG.enabled).toBe(false)
  })

  it('should have default senderName as AppsByMCI', () => {
    expect(DEFAULT_EMAIL_CONFIG.senderName).toBe('AppsByMCI')
  })

  it('should have default senderEmail as noreply@appsbymci.com', () => {
    expect(DEFAULT_EMAIL_CONFIG.senderEmail).toBe('noreply@appsbymci.com')
  })

  it('should not have subject or bodyTemplate defined', () => {
    expect(DEFAULT_EMAIL_CONFIG.subject).toBeUndefined()
    expect(DEFAULT_EMAIL_CONFIG.bodyTemplate).toBeUndefined()
  })
})
