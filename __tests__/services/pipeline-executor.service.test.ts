// Tests for pipeline executor service
import {
  buildExecutionContext,
  replaceVariables,
  replaceImageVariables,
  resolveReferenceImages,
  PIPELINE_ERRORS,
} from '@/lib/services/pipeline-executor.service'
import type { ParticipantData } from '@/lib/services/generation.service'
import type { ReferenceImage } from '@/lib/types'
import type { IGeneration } from '@/models/Generation.model'

// Mock all dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

jest.mock('@/lib/blob-storage', () => ({
  blobStorageService: {
    downloadFile: jest.fn(),
    uploadResult: jest.fn(),
  },
  CONTAINERS: {
    UPLOADS: 'uploads',
    GENERATED_IMAGES: 'generated-images',
  },
}))

jest.mock('@/lib/services/generation.service', () => ({
  generationService: {
    updateGenerationStatus: jest.fn(),
    updateGenerationResult: jest.fn(),
    updateGenerationError: jest.fn(),
  },
}))

jest.mock('@/lib/services/openai-image.service', () => ({
  openaiImageService: {
    generateImage: jest.fn(),
    editImage: jest.fn(),
  },
}))

jest.mock('@/lib/services/google-ai.service', () => ({
  googleAIService: {
    generateImageWithGemini: jest.fn(),
  },
}))

jest.mock('@/lib/utils/retry', () => ({
  withRetry: jest.fn((fn) => fn()),
  isRetryableError: jest.fn(),
}))

describe('pipeline-executor.service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('buildExecutionContext', () => {
    it('should build context with basic participant data', () => {
      const participantData: ParticipantData = {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@example.com',
        answers: [],
      }

      const context = buildExecutionContext(participantData)

      expect(context.nom).toBe('Dupont')
      expect(context.prenom).toBe('Jean')
      expect(context.email).toBe('jean@example.com')
    })

    it('should handle missing optional fields with empty strings', () => {
      const participantData: ParticipantData = {
        answers: [],
      }

      const context = buildExecutionContext(participantData)

      expect(context.nom).toBe('')
      expect(context.prenom).toBe('')
      expect(context.email).toBe('')
    })

    it('should add indexed question variables', () => {
      const participantData: ParticipantData = {
        nom: 'Test',
        prenom: 'User',
        email: 'test@test.com',
        answers: [
          { elementId: 'q1', type: 'choice', value: 'Option A' },
          { elementId: 'q2', type: 'slider', value: 75 },
          { elementId: 'q3', type: 'free-text', value: 'Free text answer' },
        ],
      }

      const context = buildExecutionContext(participantData)

      expect(context.question1).toBe('Option A')
      expect(context.question2).toBe('75')
      expect(context.question3).toBe('Free text answer')
    })

    it('should add elementId-keyed variables', () => {
      const participantData: ParticipantData = {
        nom: 'Test',
        prenom: 'User',
        email: 'test@test.com',
        answers: [
          { elementId: 'ambiance', type: 'choice', value: 'Mystérieux' },
          { elementId: 'intensity', type: 'slider', value: 80 },
        ],
      }

      const context = buildExecutionContext(participantData)

      expect(context.answer_ambiance).toBe('Mystérieux')
      expect(context.answer_intensity).toBe('80')
    })

    it('should handle empty answers array', () => {
      const participantData: ParticipantData = {
        nom: 'Test',
        prenom: 'User',
        email: 'test@test.com',
        answers: [],
      }

      const context = buildExecutionContext(participantData)

      expect(context.question1).toBeUndefined()
      expect(context.answer_q1).toBeUndefined()
    })
  })

  describe('replaceVariables', () => {
    const context = {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean@example.com',
      question1: 'Mystérieux',
      question2: 'Aventure',
      answer_ambiance: 'Mystérieux',
    }

    it('should replace single variable', () => {
      const result = replaceVariables('Hello {nom}!', context)
      expect(result).toBe('Hello Dupont!')
    })

    it('should replace multiple variables', () => {
      const result = replaceVariables(
        'Portrait de {prenom} {nom}, ambiance {question1}',
        context
      )
      expect(result).toBe('Portrait de Jean Dupont, ambiance Mystérieux')
    })

    it('should replace unknown variables with empty string', () => {
      const result = replaceVariables('Hello {unknown}!', context)
      expect(result).toBe('Hello !')
    })

    it('should handle text without variables', () => {
      const result = replaceVariables('No variables here', context)
      expect(result).toBe('No variables here')
    })

    it('should handle multiple occurrences of same variable', () => {
      const result = replaceVariables('{nom} is {nom}', context)
      expect(result).toBe('Dupont is Dupont')
    })

    it('should handle elementId-keyed variables', () => {
      const result = replaceVariables('Ambiance: {answer_ambiance}', context)
      expect(result).toBe('Ambiance: Mystérieux')
    })

    it('should handle complex prompt with mixed variables', () => {
      const prompt = `Crée un avatar de {prenom} {nom}.
Style: {question1}
Thème: {question2}
Email pour contact: {email}`

      const result = replaceVariables(prompt, context)

      expect(result).toContain('Jean Dupont')
      expect(result).toContain('Style: Mystérieux')
      expect(result).toContain('Thème: Aventure')
      expect(result).toContain('jean@example.com')
    })
  })

  describe('PIPELINE_ERRORS', () => {
    it('should have correct error codes', () => {
      expect(PIPELINE_ERRORS.TIMEOUT).toBe('GEN_5002')
      expect(PIPELINE_ERRORS.API_ERROR).toBe('GEN_5003')
      expect(PIPELINE_ERRORS.UNSUPPORTED_MODEL).toBe('GEN_5004')
      expect(PIPELINE_ERRORS.INVALID_CONFIG).toBe('GEN_5005')
    })

    it('should have new error codes for Story 4.9 (AC7, AC8)', () => {
      expect(PIPELINE_ERRORS.REFERENCE_IMAGE_NOT_FOUND).toBe('GEN_5006')
      expect(PIPELINE_ERRORS.SELFIE_REQUIRED_MISSING).toBe('GEN_5007')
    })
  })

  describe('replaceImageVariables (AC2)', () => {
    it('should replace single image variable with Image N', () => {
      const referenceImages: ReferenceImage[] = [
        { id: '1', name: 'selfie', source: 'selfie', order: 1 },
      ]

      const result = replaceImageVariables('Transform {selfie} into art', referenceImages)
      expect(result).toBe('Transform Image 1 into art')
    })

    it('should replace multiple image variables according to order', () => {
      const referenceImages: ReferenceImage[] = [
        { id: '1', name: 'selfie', source: 'selfie', order: 1 },
        { id: '2', name: 'logo', source: 'upload', order: 2 },
        { id: '3', name: 'fond', source: 'url', url: 'http://example.com/bg.jpg', order: 3 },
      ]

      const result = replaceImageVariables(
        'Combine {selfie} with {logo} watermark and {fond} background',
        referenceImages
      )
      expect(result).toBe('Combine Image 1 with Image 2 watermark and Image 3 background')
    })

    it('should handle unordered images and sort by order', () => {
      const referenceImages: ReferenceImage[] = [
        { id: '3', name: 'fond', source: 'url', url: 'http://example.com/bg.jpg', order: 3 },
        { id: '1', name: 'selfie', source: 'selfie', order: 1 },
        { id: '2', name: 'logo', source: 'upload', order: 2 },
      ]

      const result = replaceImageVariables('{selfie} + {logo} + {fond}', referenceImages)
      expect(result).toBe('Image 1 + Image 2 + Image 3')
    })

    it('should be case-insensitive for image names', () => {
      const referenceImages: ReferenceImage[] = [
        { id: '1', name: 'Selfie', source: 'selfie', order: 1 },
      ]

      const result = replaceImageVariables('{SELFIE} and {selfie}', referenceImages)
      expect(result).toBe('Image 1 and Image 1')
    })

    it('should leave non-image variables untouched for replaceVariables', () => {
      const referenceImages: ReferenceImage[] = [
        { id: '1', name: 'selfie', source: 'selfie', order: 1 },
      ]

      const result = replaceImageVariables('{selfie} de {nom}', referenceImages)
      expect(result).toBe('Image 1 de {nom}')
    })

    it('should return original text if no reference images', () => {
      const result = replaceImageVariables('No images {selfie}', [])
      expect(result).toBe('No images {selfie}')
    })

    it('should return original text if reference images is undefined', () => {
      const result = replaceImageVariables('No images {selfie}', undefined as any)
      expect(result).toBe('No images {selfie}')
    })
  })

  describe('resolveReferenceImages (AC1, AC7, AC8)', () => {
    const mockBlobStorageService = require('@/lib/blob-storage').blobStorageService

    beforeEach(() => {
      mockBlobStorageService.downloadFile.mockReset()
    })

    it('should return empty array if no reference images', async () => {
      const generation = { selfieUrl: 'http://example.com/selfie.jpg' } as IGeneration
      const blockResults = new Map<string, Buffer>()

      const result = await resolveReferenceImages([], generation, blockResults)
      expect(result).toEqual([])
    })

    it('should resolve selfie source from generation.selfieUrl (AC1)', async () => {
      const selfieBuffer = Buffer.from('selfie-data')
      mockBlobStorageService.downloadFile.mockResolvedValueOnce(selfieBuffer)

      const referenceImages: ReferenceImage[] = [
        { id: '1', name: 'selfie', source: 'selfie', order: 1 },
      ]
      const generation = {
        selfieUrl: 'https://storage.blob.core.windows.net/uploads/selfies/123.jpg',
      } as IGeneration
      const blockResults = new Map<string, Buffer>()

      const result = await resolveReferenceImages(referenceImages, generation, blockResults)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('selfie')
      expect(result[0].source).toBe('selfie')
      expect(result[0].buffer).toBe(selfieBuffer)
      expect(result[0].sizeBytes).toBe(selfieBuffer.length)
    })

    it('should throw GEN_5007 if selfie required but not provided (AC8)', async () => {
      const referenceImages: ReferenceImage[] = [
        { id: '1', name: 'selfie', source: 'selfie', order: 1 },
      ]
      const generation = { selfieUrl: null } as unknown as IGeneration
      const blockResults = new Map<string, Buffer>()

      await expect(
        resolveReferenceImages(referenceImages, generation, blockResults)
      ).rejects.toMatchObject({
        code: 'GEN_5007',
        message: expect.stringContaining('Selfie requis'),
      })
    })

    it('should resolve ai-block-output source from blockResults (AC6)', async () => {
      const previousBuffer = Buffer.from('previous-block-output')
      const referenceImages: ReferenceImage[] = [
        { id: '2', name: 'base', source: 'ai-block-output', sourceBlockId: 'block-1', order: 1 },
      ]
      const generation = {} as IGeneration
      const blockResults = new Map<string, Buffer>([['block-1', previousBuffer]])

      const result = await resolveReferenceImages(referenceImages, generation, blockResults)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('base')
      expect(result[0].buffer).toBe(previousBuffer)
    })

    it('should throw GEN_5006 if ai-block-output source not found (AC7)', async () => {
      const referenceImages: ReferenceImage[] = [
        { id: '2', name: 'base', source: 'ai-block-output', sourceBlockId: 'missing-block', order: 1 },
      ]
      const generation = {} as IGeneration
      const blockResults = new Map<string, Buffer>()

      await expect(
        resolveReferenceImages(referenceImages, generation, blockResults)
      ).rejects.toMatchObject({
        code: 'GEN_5006',
        message: expect.stringContaining("bloc source 'missing-block' non trouvé"),
      })
    })

    it('should throw GEN_5006 if upload URL is missing (AC7)', async () => {
      const referenceImages: ReferenceImage[] = [
        { id: '2', name: 'logo', source: 'upload', order: 1 },  // Missing url
      ]
      const generation = {} as IGeneration
      const blockResults = new Map<string, Buffer>()

      await expect(
        resolveReferenceImages(referenceImages, generation, blockResults)
      ).rejects.toMatchObject({
        code: 'GEN_5006',
        message: expect.stringContaining('URL manquante'),
      })
    })

    it('should resolve multiple images and sort by order', async () => {
      const selfieBuffer = Buffer.from('selfie-data')
      const logoBuffer = Buffer.from('logo-data')

      mockBlobStorageService.downloadFile
        .mockResolvedValueOnce(selfieBuffer)
        .mockResolvedValueOnce(logoBuffer)

      const referenceImages: ReferenceImage[] = [
        { id: '2', name: 'logo', source: 'upload', url: 'https://storage.blob.core.windows.net/uploads/logos/logo.png', order: 2 },
        { id: '1', name: 'selfie', source: 'selfie', order: 1 },
      ]
      const generation = {
        selfieUrl: 'https://storage.blob.core.windows.net/uploads/selfies/123.jpg',
      } as IGeneration
      const blockResults = new Map<string, Buffer>()

      const result = await resolveReferenceImages(referenceImages, generation, blockResults)

      expect(result).toHaveLength(2)
      // Should be sorted by order
      expect(result[0].name).toBe('selfie')
      expect(result[0].buffer).toBe(selfieBuffer)
      expect(result[1].name).toBe('logo')
      expect(result[1].buffer).toBe(logoBuffer)
    })
  })
})
