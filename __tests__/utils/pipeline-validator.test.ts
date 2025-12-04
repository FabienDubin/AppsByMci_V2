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
    modelId: 'gpt-image-1', // Updated from dall-e-3 (removed)
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
            modelId: 'gemini-2.5-flash-image',
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
            modelId: 'gemini-2.5-flash-image',
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
            modelId: 'gemini-2.5-flash-image',
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
      // gemini-2.5-flash-image only supports 'none' and 'reference', not 'edit'
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'gemini-2.5-flash-image',
          imageUsageMode: 'edit', // gemini doesn't support edit
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

    it('should return valid when model supports the imageUsageMode', () => {
      // gemini-2.5-flash-image supports 'reference'
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, {
          modelId: 'gemini-2.5-flash-image',
          imageUsageMode: 'reference',
          imageSource: 'url',
          imageUrl: 'https://example.com/image.jpg',
        }),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('valid')
    })
  })

  // Note: "Info messages - Text-to-image after other AI blocks" tests were removed
  // because dall-e-3 has been removed and all current models support image inputs.
  // The info message logic remains in the validator for future text-to-image-only models.

  describe('Multiple AI blocks - Valid scenarios', () => {
    it('should return valid when multiple AI blocks are correctly configured', () => {
      const pipeline: PipelineBlock[] = [
        createAIBlock(0, { modelId: 'gpt-image-1', imageUsageMode: 'none' }),
        createAIBlock(1, { modelId: 'gemini-2.5-flash-image', imageUsageMode: 'none' }),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('valid')
    })

    it('should return valid for single AI block in pipeline', () => {
      const pipeline: PipelineBlock[] = [
        createCropBlock(0),
        createAIBlock(1, { modelId: 'gpt-image-1' }),
        createFiltersBlock(2),
      ]
      const result = validatePipelineLogic(pipeline)
      expect(result.type).toBe('valid')
    })
  })

  describe('Multiple AI blocks scenarios', () => {
    it('should validate chain: Gemini → GPT Image Edit (using previous output)', () => {
      const firstBlockId = crypto.randomUUID()
      const pipeline: PipelineBlock[] = [
        {
          id: firstBlockId,
          type: 'ai-generation',
          blockName: 'ai-generation',
          order: 0,
          config: {
            modelId: 'gemini-2.5-flash-image',
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
            modelId: 'gemini-2.5-flash-image',
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
