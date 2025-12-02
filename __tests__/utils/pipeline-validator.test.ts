import { describe, it, expect } from '@jest/globals'
import { validatePipelineLogic } from '@/lib/utils/pipeline-validator'
import type { PipelineBlock, InputCollection } from '@/lib/stores/wizard.store'

// Helper to create a basic AI generation block
const createAIBlock = (
  order: number,
  overrides: Partial<PipelineBlock['config']> = {}
): PipelineBlock => ({
  id: crypto.randomUUID(),
  type: 'ai-generation',
  blockName: 'ai-generation',
  order,
  config: {
    modelId: 'dall-e-3',
    promptTemplate: 'Test prompt',
    ...overrides,
  },
})

// Helper to create a crop-resize block
const createCropBlock = (order: number): PipelineBlock => ({
  id: crypto.randomUUID(),
  type: 'preprocessing',
  blockName: 'crop-resize',
  order,
  config: {
    format: 'square',
    dimensions: 1024,
  },
})

// Helper to create a filters block
const createFiltersBlock = (order: number): PipelineBlock => ({
  id: crypto.randomUUID(),
  type: 'postprocessing',
  blockName: 'filters',
  order,
  config: {},
})

// Helper to create input collection with selfie
const createInputCollectionWithSelfie = (): InputCollection => ({
  elements: [
    {
      id: crypto.randomUUID(),
      type: 'selfie',
      order: 0,
    },
  ],
})

// Helper to create input collection without selfie
const createInputCollectionWithoutSelfie = (): InputCollection => ({
  elements: [
    {
      id: crypto.randomUUID(),
      type: 'choice',
      order: 0,
      question: 'Test question?',
      options: ['A', 'B'],
    },
  ],
})

describe('Pipeline Validator', () => {
  describe('Empty pipeline / No AI blocks', () => {
    it('should return warning for empty pipeline', () => {
      const result = validatePipelineLogic([])
      expect(result.type).toBe('warning')
      expect(result).toHaveProperty('message')
      if (result.type === 'warning') {
        expect(result.message).toContain('Aucun bloc IA')
      }
    })

    it('should return warning for pipeline with only preprocessing blocks', () => {
      const pipeline: PipelineBlock[] = [createCropBlock(0)]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('warning')
    })

    it('should return warning for pipeline with only postprocessing blocks', () => {
      const pipeline: PipelineBlock[] = [createFiltersBlock(0)]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('warning')
    })

    it('should return warning for pipeline with pre and post processing but no AI', () => {
      const pipeline: PipelineBlock[] = [createCropBlock(0), createFiltersBlock(1)]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('warning')
    })
  })

  describe('Valid pipelines', () => {
    it('should return valid for pipeline with one AI block (no image mode)', () => {
      const pipeline: PipelineBlock[] = [createAIBlock(0)]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('valid')
    })

    it('should return valid for complete pipeline with crop, AI, and filters', () => {
      const pipeline: PipelineBlock[] = [
        createCropBlock(0),
        createAIBlock(1),
        createFiltersBlock(2),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('valid')
    })

    it('should return valid for AI block with imageUsageMode=none', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, { imageUsageMode: 'none' }),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('valid')
    })

    it('should return valid for AI block using selfie when selfie is configured', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'gpt-image-1',
          imageUsageMode: 'reference',
          imageSource: 'selfie',
        }),
      ]
      const inputCollection = createInputCollectionWithSelfie()
      const result = validatePipelineLogic(pipeline, inputCollection)
      expect(result.type).toBe('valid')
    })

    it('should return valid for AI block using URL with valid URL', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'gpt-image-1',
          imageUsageMode: 'edit',
          imageSource: 'url',
          imageUrl: 'https://example.com/image.jpg',
        }),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('valid')
    })

    it('should return valid for AI block using previous AI block output', () => {
      const firstBlockId = crypto.randomUUID()
      const pipeline: PipelineBlock[] = [
        {
          id: firstBlockId,
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 0,
          config: {
            modelId: 'dall-e-3',
            promptTemplate: 'Generate image',
            imageUsageMode: 'none',
          },
        },
        {
          id: crypto.randomUUID(),
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 1,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Edit image',
            imageUsageMode: 'edit',
            imageSource: 'ai-block-output',
            sourceBlockId: firstBlockId,
          },
        },
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('valid')
    })
  })

  describe('Image source validation - Selfie', () => {
    it('should return error when using selfie but no selfie configured', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'gpt-image-1',
          imageUsageMode: 'reference',
          imageSource: 'selfie',
        }),
      ]
      const inputCollection = createInputCollectionWithoutSelfie()
      const result = validatePipelineLogic(pipeline, inputCollection)
      expect(result.type).toBe('error')
      if (result.type === 'error') {
        expect(result.message).toContain('selfie')
      }
    })

    it('should return error when using selfie with no input collection', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'gpt-image-1',
          imageUsageMode: 'edit',
          imageSource: 'selfie',
        }),
      ]
      const result = validatePipelineLogic(pipeline, undefined)
      expect(result.type).toBe('error')
    })
  })

  describe('Image source validation - URL', () => {
    it('should return error when using URL source but no URL provided', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'gpt-image-1',
          imageUsageMode: 'reference',
          imageSource: 'url',
          imageUrl: undefined,
        }),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('error')
      if (result.type === 'error') {
        expect(result.message).toContain('URL')
      }
    })

    it('should return error when using URL source with empty string URL', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'gpt-image-1',
          imageUsageMode: 'edit',
          imageSource: 'url',
          imageUrl: '',
        }),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('error')
    })
  })

  describe('Image source validation - AI Block Output', () => {
    it('should return error when using ai-block-output but no sourceBlockId', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, { imageUsageMode: 'none' }),
        createAIBlock(1, {
          modelId: 'gpt-image-1',
          imageUsageMode: 'edit',
          imageSource: 'ai-block-output',
          sourceBlockId: undefined,
        }),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('error')
      if (result.type === 'error') {
        expect(result.message).toContain('bloc source')
      }
    })

    it('should return error when sourceBlockId references non-existent block', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, { imageUsageMode: 'none' }),
        createAIBlock(1, {
          modelId: 'gpt-image-1',
          imageUsageMode: 'edit',
          imageSource: 'ai-block-output',
          sourceBlockId: crypto.randomUUID(), // Non-existent
        }),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('error')
      if (result.type === 'error') {
        expect(result.message).toContain("n'existe pas")
      }
    })

    it('should return error when sourceBlockId references block AFTER current block', () => {
      const laterBlockId = crypto.randomUUID()
      const pipeline: PipelineBlock[] = [
        {
          id: crypto.randomUUID(),
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 0,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Edit',
            imageUsageMode: 'edit',
            imageSource: 'ai-block-output',
            sourceBlockId: laterBlockId, // References block at order 1
          },
        },
        {
          id: laterBlockId,
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 1,
          config: {
            modelId: 'dall-e-3',
            promptTemplate: 'Generate',
            imageUsageMode: 'none',
          },
        },
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('error')
      if (result.type === 'error') {
        expect(result.message).toContain('après lui')
      }
    })

    it('should return error when sourceBlockId references block at SAME order', () => {
      const sameOrderBlockId = crypto.randomUUID()
      const pipeline: PipelineBlock[] = [
        {
          id: sameOrderBlockId,
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 0,
          config: {
            modelId: 'dall-e-3',
            promptTemplate: 'Generate',
            imageUsageMode: 'none',
          },
        },
        {
          id: crypto.randomUUID(),
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 0, // Same order - edge case
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Edit',
            imageUsageMode: 'edit',
            imageSource: 'ai-block-output',
            sourceBlockId: sameOrderBlockId,
          },
        },
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('error')
    })
  })

  describe('Image usage mode validation', () => {
    it('should return error when imageUsageMode is set but imageSource is missing', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'gpt-image-1',
          imageUsageMode: 'reference',
          // imageSource is missing
        }),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('error')
      if (result.type === 'error') {
        expect(result.message).toContain("source d'image")
      }
    })

    it('should return error when model does not support the imageUsageMode', () => {
      // dall-e-3 only supports 'none'
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'dall-e-3',
          imageUsageMode: 'edit', // dall-e-3 doesn't support edit
          imageSource: 'selfie',
        }),
      ]
      const inputCollection = createInputCollectionWithSelfie()
      const result = validatePipelineLogic(pipeline, inputCollection)
      expect(result.type).toBe('error')
      if (result.type === 'error') {
        expect(result.message).toContain('ne supporte pas')
      }
    })

    it('should return error when trying to use reference mode on model that only supports none', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'dall-e-3',
          imageUsageMode: 'reference',
          imageSource: 'url',
          imageUrl: 'https://example.com/image.jpg',
        }),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('error')
    })
  })

  describe('Info messages - Text-to-image after other AI blocks', () => {
    it('should return info when DALL-E 3 is placed after another AI block', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, { modelId: 'gpt-image-1', imageUsageMode: 'none' }),
        createAIBlock(1, { modelId: 'dall-e-3', imageUsageMode: 'none' }),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('info')
      if (result.type === 'info') {
        expect(result.message).toContain('from scratch')
        expect(result.message).toContain('ignorée')
      }
    })

    it('should return info when text-to-image model ignores previous AI output', () => {
      const firstBlockId = crypto.randomUUID()
      const pipeline: PipelineBlock[] = [
        {
          id: firstBlockId,
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 0,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Edit something',
            imageUsageMode: 'edit',
            imageSource: 'url',
            imageUrl: 'https://example.com/img.jpg',
          },
        },
        createAIBlock(1, { modelId: 'dall-e-3' }), // Will ignore previous output
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('info')
    })

    it('should return valid (not info) for DALL-E 3 as first/only AI block', () => {
      const pipeline: PipelineBlock[] = [
        createCropBlock(0),
        createAIBlock(1, { modelId: 'dall-e-3' }),
        createFiltersBlock(2),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('valid')
    })
  })

  describe('Multiple AI blocks scenarios', () => {
    it('should validate chain: DALL-E 3 → GPT Image Edit (using previous output)', () => {
      const firstBlockId = crypto.randomUUID()
      const pipeline: PipelineBlock[] = [
        {
          id: firstBlockId,
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 0,
          config: {
            modelId: 'dall-e-3',
            promptTemplate: 'Generate avatar',
            imageUsageMode: 'none',
          },
        },
        {
          id: crypto.randomUUID(),
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 1,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Add effects to avatar',
            imageUsageMode: 'edit',
            imageSource: 'ai-block-output',
            sourceBlockId: firstBlockId,
          },
        },
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('valid')
    })

    it('should validate 4 AI blocks chain', () => {
      const block1Id = crypto.randomUUID()
      const block2Id = crypto.randomUUID()
      const block3Id = crypto.randomUUID()

      const pipeline: PipelineBlock[] = [
        {
          id: block1Id,
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 0,
          config: {
            modelId: 'dall-e-3',
            promptTemplate: 'Step 1',
            imageUsageMode: 'none',
          },
        },
        {
          id: block2Id,
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 1,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Step 2',
            imageUsageMode: 'edit',
            imageSource: 'ai-block-output',
            sourceBlockId: block1Id,
          },
        },
        {
          id: block3Id,
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 2,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Step 3',
            imageUsageMode: 'edit',
            imageSource: 'ai-block-output',
            sourceBlockId: block2Id,
          },
        },
        {
          id: crypto.randomUUID(),
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 3,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Step 4',
            imageUsageMode: 'reference',
            imageSource: 'ai-block-output',
            sourceBlockId: block3Id,
          },
        },
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('valid')
    })
  })

  describe('Edge cases', () => {
    it('should handle block with no modelId gracefully', () => {
      const pipeline: PipelineBlock[] = [
        {
          id: crypto.randomUUID(),
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 0,
          config: {
            promptTemplate: 'Test',
            // modelId is missing
          },
        },
      ]
      // Should not crash, validation handled elsewhere (Zod)
      const result = validatePipelineLogic(pipeline)
      expect(['valid', 'warning', 'info', 'error']).toContain(result.type)
    })

    it('should handle unknown model gracefully', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, { modelId: 'unknown-model-xyz' }),
      ]
      // Should not crash
      const result = validatePipelineLogic(pipeline)
      expect(['valid', 'warning', 'info', 'error']).toContain(result.type)
    })

    it('should handle empty inputCollection elements array', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'gpt-image-1',
          imageUsageMode: 'reference',
          imageSource: 'selfie',
        }),
      ]
      const inputCollection: InputCollection = { elements: [] }
      const result = validatePipelineLogic(pipeline, inputCollection)
      expect(result.type).toBe('error')
    })
  })
})
