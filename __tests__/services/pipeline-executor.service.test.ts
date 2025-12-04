// Tests for pipeline executor service
import {
  buildExecutionContext,
  replaceVariables,
  PIPELINE_ERRORS,
} from '@/lib/services/pipeline-executor.service'
import type { ParticipantData } from '@/lib/services/generation.service'

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
  })
})
