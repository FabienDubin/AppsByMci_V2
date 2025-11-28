import { describe, it, expect } from '@jest/globals'
import { pipelineBlockSchema, step4Schema } from '@/lib/schemas/animation.schema'

describe('Step 4 Schemas - Pipeline', () => {
  describe('pipelineBlockSchema', () => {
    describe('crop-resize blocks', () => {
      it('should validate crop-resize block with square format and dimensions', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'preprocessing' as const,
          blockName: 'crop-resize' as const,
          order: 0,
          config: {
            format: 'square' as const,
            dimensions: 1024,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(true)
      })

      it('should validate crop-resize block with original format (no dimensions needed)', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'preprocessing' as const,
          blockName: 'crop-resize' as const,
          order: 0,
          config: {
            format: 'original' as const,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(true)
      })

      it('should reject crop-resize block without format', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'preprocessing' as const,
          blockName: 'crop-resize' as const,
          order: 0,
          config: {
            dimensions: 1024,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors.some((e) => e.path.includes('format'))).toBe(true)
        }
      })

      it('should reject crop-resize block with non-original format but no dimensions', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'preprocessing' as const,
          blockName: 'crop-resize' as const,
          order: 0,
          config: {
            format: 'square' as const,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors.some((e) => e.path.includes('dimensions'))).toBe(true)
        }
      })

      it('should reject dimensions < 256', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'preprocessing' as const,
          blockName: 'crop-resize' as const,
          order: 0,
          config: {
            format: 'square' as const,
            dimensions: 100,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })

      it('should reject dimensions > 2048', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'preprocessing' as const,
          blockName: 'crop-resize' as const,
          order: 0,
          config: {
            format: 'square' as const,
            dimensions: 4096,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })

      it('should validate all format types', () => {
        const formats = ['square', '16:9', '4:3', 'original'] as const
        formats.forEach((format) => {
          const block = {
            id: crypto.randomUUID(),
            type: 'preprocessing' as const,
            blockName: 'crop-resize' as const,
            order: 0,
            config: {
              format,
              ...(format !== 'original' ? { dimensions: 512 } : {}),
            },
          }

          const result = pipelineBlockSchema.safeParse(block)
          expect(result.success).toBe(true)
        })
      })
    })

    describe('ai-generation blocks', () => {
      it('should validate ai-generation block with modelId and promptTemplate', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 0,
          config: {
            modelId: 'dall-e-3',
            promptTemplate: 'Create a portrait of {nom}',
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(true)
      })

      it('should reject ai-generation block without modelId', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 0,
          config: {
            promptTemplate: 'Create a portrait of {nom}',
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors.some((e) => e.path.includes('modelId'))).toBe(true)
        }
      })

      it('should reject ai-generation block without promptTemplate', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 0,
          config: {
            modelId: 'dall-e-3',
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors.some((e) => e.path.includes('promptTemplate'))).toBe(true)
        }
      })

      it('should reject ai-generation block with empty promptTemplate', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 0,
          config: {
            modelId: 'dall-e-3',
            promptTemplate: '   ',
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })

      it('should reject promptTemplate > 2000 chars', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 0,
          config: {
            modelId: 'dall-e-3',
            promptTemplate: 'a'.repeat(2001),
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })

      it('should validate ai-generation block with imageUsageMode none', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 0,
          config: {
            modelId: 'dall-e-3',
            promptTemplate: 'Create a portrait',
            imageUsageMode: 'none' as const,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(true)
      })

      it('should validate ai-generation block with imageUsageMode reference', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 0,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Transform this image',
            imageUsageMode: 'reference' as const,
            imageSource: 'selfie' as const,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(true)
      })

      it('should validate ai-generation block with imageUsageMode edit', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 0,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Edit this image',
            imageUsageMode: 'edit' as const,
            imageSource: 'url' as const,
            imageUrl: 'https://example.com/image.jpg',
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(true)
      })

      it('should validate ai-generation block with ai-block-output source', () => {
        const sourceBlockId = crypto.randomUUID()
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 1,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Edit the generated image',
            imageUsageMode: 'edit' as const,
            imageSource: 'ai-block-output' as const,
            sourceBlockId,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(true)
      })

      it('should reject invalid imageUsageMode', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 0,
          config: {
            modelId: 'dall-e-3',
            promptTemplate: 'Create a portrait',
            imageUsageMode: 'invalid' as any,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })

      it('should reject invalid imageSource', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 0,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Transform',
            imageUsageMode: 'reference' as const,
            imageSource: 'invalid' as any,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })

      it('should reject invalid URL for imageUrl', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 0,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Transform',
            imageUsageMode: 'reference' as const,
            imageSource: 'url' as const,
            imageUrl: 'not-a-valid-url',
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })

      it('should reject invalid UUID for sourceBlockId', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'ai-generation' as const,
          blockName: 'ai-generation' as const,
          order: 1,
          config: {
            modelId: 'gpt-image-1',
            promptTemplate: 'Transform',
            imageUsageMode: 'edit' as const,
            imageSource: 'ai-block-output' as const,
            sourceBlockId: 'not-a-uuid',
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })
    })

    describe('filters blocks', () => {
      it('should validate filters block (no required config for MVP)', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'postprocessing' as const,
          blockName: 'filters' as const,
          order: 0,
          config: {},
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(true)
      })

      it('should validate filters block with filters array', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'postprocessing' as const,
          blockName: 'filters' as const,
          order: 0,
          config: {
            filters: ['grayscale', 'sepia'],
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(true)
      })
    })

    describe('general validation', () => {
      it('should reject invalid block type', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'invalid' as any,
          blockName: 'crop-resize' as const,
          order: 0,
          config: {},
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })

      it('should reject invalid blockName', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'preprocessing' as const,
          blockName: 'invalid' as any,
          order: 0,
          config: {},
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })

      it('should reject invalid UUID for id', () => {
        const block = {
          id: 'not-a-uuid',
          type: 'preprocessing' as const,
          blockName: 'crop-resize' as const,
          order: 0,
          config: {
            format: 'original' as const,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })

      it('should reject negative order', () => {
        const block = {
          id: crypto.randomUUID(),
          type: 'preprocessing' as const,
          blockName: 'crop-resize' as const,
          order: -1,
          config: {
            format: 'original' as const,
          },
        }

        const result = pipelineBlockSchema.safeParse(block)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('step4Schema', () => {
    it('should validate empty pipeline', () => {
      const data = {
        pipeline: [],
      }

      const result = step4Schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate pipeline with 1 block', () => {
      const data = {
        pipeline: [
          {
            id: crypto.randomUUID(),
            type: 'preprocessing' as const,
            blockName: 'crop-resize' as const,
            order: 0,
            config: {
              format: 'square' as const,
              dimensions: 1024,
            },
          },
        ],
      }

      const result = step4Schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate pipeline with multiple blocks', () => {
      const data = {
        pipeline: [
          {
            id: crypto.randomUUID(),
            type: 'preprocessing' as const,
            blockName: 'crop-resize' as const,
            order: 0,
            config: {
              format: 'square' as const,
              dimensions: 1024,
            },
          },
          {
            id: crypto.randomUUID(),
            type: 'ai-generation' as const,
            blockName: 'ai-generation' as const,
            order: 1,
            config: {
              modelId: 'dall-e-3',
              promptTemplate: 'Create a portrait of {nom}',
            },
          },
          {
            id: crypto.randomUUID(),
            type: 'postprocessing' as const,
            blockName: 'filters' as const,
            order: 2,
            config: {},
          },
        ],
      }

      const result = step4Schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate pipeline with exactly 4 AI blocks', () => {
      const aiBlocks = Array.from({ length: 4 }, (_, i) => ({
        id: crypto.randomUUID(),
        type: 'ai-generation' as const,
        blockName: 'ai-generation' as const,
        order: i,
        config: {
          modelId: 'dall-e-3',
          promptTemplate: `Prompt ${i + 1}`,
        },
      }))

      const data = { pipeline: aiBlocks }
      const result = step4Schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject pipeline with more than 4 AI blocks', () => {
      const aiBlocks = Array.from({ length: 5 }, (_, i) => ({
        id: crypto.randomUUID(),
        type: 'ai-generation' as const,
        blockName: 'ai-generation' as const,
        order: i,
        config: {
          modelId: 'dall-e-3',
          promptTemplate: `Prompt ${i + 1}`,
        },
      }))

      const data = { pipeline: aiBlocks }
      const result = step4Schema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some((e) => e.message.includes('Maximum 4 AI'))).toBe(true)
      }
    })

    it('should validate pipeline with 4 AI blocks + other blocks', () => {
      const data = {
        pipeline: [
          {
            id: crypto.randomUUID(),
            type: 'preprocessing' as const,
            blockName: 'crop-resize' as const,
            order: 0,
            config: { format: 'square' as const, dimensions: 512 },
          },
          ...Array.from({ length: 4 }, (_, i) => ({
            id: crypto.randomUUID(),
            type: 'ai-generation' as const,
            blockName: 'ai-generation' as const,
            order: i + 1,
            config: {
              modelId: 'dall-e-3',
              promptTemplate: `Prompt ${i + 1}`,
            },
          })),
          {
            id: crypto.randomUUID(),
            type: 'postprocessing' as const,
            blockName: 'filters' as const,
            order: 5,
            config: {},
          },
        ],
      }

      const result = step4Schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject pipeline with more than 20 blocks', () => {
      const blocks = Array.from({ length: 21 }, (_, i) => ({
        id: crypto.randomUUID(),
        type: 'postprocessing' as const,
        blockName: 'filters' as const,
        order: i,
        config: {},
      }))

      const data = { pipeline: blocks }
      const result = step4Schema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some((e) => e.message.includes('Maximum 20'))).toBe(true)
      }
    })

    it('should validate complex pipeline with image configurations', () => {
      const sourceBlockId = crypto.randomUUID()
      const data = {
        pipeline: [
          {
            id: crypto.randomUUID(),
            type: 'preprocessing' as const,
            blockName: 'crop-resize' as const,
            order: 0,
            config: {
              format: 'square' as const,
              dimensions: 1024,
            },
          },
          {
            id: sourceBlockId,
            type: 'ai-generation' as const,
            blockName: 'ai-generation' as const,
            order: 1,
            config: {
              modelId: 'dall-e-3',
              promptTemplate: 'Generate initial image',
              imageUsageMode: 'none' as const,
            },
          },
          {
            id: crypto.randomUUID(),
            type: 'ai-generation' as const,
            blockName: 'ai-generation' as const,
            order: 2,
            config: {
              modelId: 'gpt-image-1',
              promptTemplate: 'Edit the generated image',
              imageUsageMode: 'edit' as const,
              imageSource: 'ai-block-output' as const,
              sourceBlockId,
            },
          },
          {
            id: crypto.randomUUID(),
            type: 'postprocessing' as const,
            blockName: 'filters' as const,
            order: 3,
            config: {},
          },
        ],
      }

      const result = step4Schema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})
