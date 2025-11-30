import { validateForPublication, isSectionComplete, getSectionStatuses } from '@/lib/services/animation-validation.service'
import type { AnimationData } from '@/lib/stores/wizard.store'

describe('Animation Validation Service', () => {
  describe('validateForPublication', () => {
    it('should return error when name is missing', () => {
      const data: AnimationData = {
        slug: 'test-animation',
        pipeline: [{ id: '1', type: 'ai-generation', blockName: 'ai-generation', order: 0, config: {} }],
        inputCollection: { elements: [{ id: '1', type: 'selfie', order: 0 }] },
      }

      const result = validateForPublication(data)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        section: 'generalInfo',
        message: 'Le nom de l\'animation est requis',
      })
    })

    it('should return error when no input collection exists', () => {
      const data: AnimationData = {
        name: 'Test Animation',
        slug: 'test-animation',
        pipeline: [{ id: '1', type: 'ai-generation', blockName: 'ai-generation', order: 0, config: {} }],
        baseFields: {
          name: { enabled: false, required: false },
          firstName: { enabled: false, required: false },
          email: { enabled: false, required: false },
        },
        inputCollection: { elements: [] },
      }

      const result = validateForPublication(data)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        section: 'dataCollection',
        message: 'Au moins un champ de collecte doit être activé (champ de base, question ou selfie)',
      })
    })

    it('should return error when pipeline has no AI block', () => {
      const data: AnimationData = {
        name: 'Test Animation',
        slug: 'test-animation',
        pipeline: [{ id: '1', type: 'preprocessing', blockName: 'crop-resize', order: 0, config: {} }],
        inputCollection: { elements: [{ id: '1', type: 'selfie', order: 0 }] },
      }

      const result = validateForPublication(data)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        section: 'pipeline',
        message: 'Le pipeline doit contenir au moins un bloc de génération IA',
      })
    })

    it('should return error when slug is missing', () => {
      const data: AnimationData = {
        name: 'Test Animation',
        pipeline: [{ id: '1', type: 'ai-generation', blockName: 'ai-generation', order: 0, config: {} }],
        inputCollection: { elements: [{ id: '1', type: 'selfie', order: 0 }] },
      }

      const result = validateForPublication(data)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        section: 'generalInfo',
        message: 'Le slug est requis',
      })
    })

    it('should return valid when all requirements are met with selfie', () => {
      const data: AnimationData = {
        name: 'Test Animation',
        slug: 'test-animation',
        pipeline: [{ id: '1', type: 'ai-generation', blockName: 'ai-generation', order: 0, config: { modelId: 'dall-e-3' } }],
        inputCollection: { elements: [{ id: '1', type: 'selfie', order: 0 }] },
      }

      const result = validateForPublication(data)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return valid when using base fields instead of selfie', () => {
      const data: AnimationData = {
        name: 'Test Animation',
        slug: 'test-animation',
        pipeline: [{ id: '1', type: 'ai-generation', blockName: 'ai-generation', order: 0, config: { modelId: 'dall-e-3' } }],
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: false },
          email: { enabled: false, required: false },
        },
        inputCollection: { elements: [] },
      }

      const result = validateForPublication(data)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return valid when using advanced inputs instead of selfie', () => {
      const data: AnimationData = {
        name: 'Test Animation',
        slug: 'test-animation',
        pipeline: [{ id: '1', type: 'ai-generation', blockName: 'ai-generation', order: 0, config: { modelId: 'dall-e-3' } }],
        inputCollection: {
          elements: [{ id: '1', type: 'choice', order: 0, question: 'Quel est ton style?', options: ['A', 'B'] }],
        },
      }

      const result = validateForPublication(data)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('isSectionComplete', () => {
    it('should return true for generalInfo when name and slug are present', () => {
      const data: AnimationData = {
        name: 'Test',
        slug: 'test',
      }

      expect(isSectionComplete(data, 'generalInfo')).toBe(true)
    })

    it('should return false for generalInfo when name is missing', () => {
      const data: AnimationData = {
        slug: 'test',
      }

      expect(isSectionComplete(data, 'generalInfo')).toBe(false)
    })

    it('should return true for accessConfig always (has defaults)', () => {
      const data: AnimationData = {}

      expect(isSectionComplete(data, 'accessConfig')).toBe(true)
    })

    it('should return true for dataCollection when has base field enabled', () => {
      const data: AnimationData = {
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: false },
          email: { enabled: false, required: false },
        },
      }

      expect(isSectionComplete(data, 'dataCollection')).toBe(true)
    })

    it('should return true for pipeline when has AI generation block', () => {
      const data: AnimationData = {
        pipeline: [{ id: '1', type: 'ai-generation', blockName: 'ai-generation', order: 0, config: {} }],
      }

      expect(isSectionComplete(data, 'pipeline')).toBe(true)
    })

    it('should return false for pipeline when no AI generation block', () => {
      const data: AnimationData = {
        pipeline: [{ id: '1', type: 'preprocessing', blockName: 'crop-resize', order: 0, config: {} }],
      }

      expect(isSectionComplete(data, 'pipeline')).toBe(false)
    })
  })

  describe('getSectionStatuses', () => {
    it('should return all section statuses', () => {
      const data: AnimationData = {
        name: 'Test',
        slug: 'test',
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: false },
          email: { enabled: false, required: false },
        },
        pipeline: [{ id: '1', type: 'ai-generation', blockName: 'ai-generation', order: 0, config: {} }],
      }

      const statuses = getSectionStatuses(data)

      expect(statuses.generalInfo).toBe(true)
      expect(statuses.accessConfig).toBe(true)
      expect(statuses.dataCollection).toBe(true)
      expect(statuses.pipeline).toBe(true)
      expect(statuses.email).toBe(true)
      expect(statuses.publicDisplay).toBe(true)
      expect(statuses.customization).toBe(true)
    })
  })
})
