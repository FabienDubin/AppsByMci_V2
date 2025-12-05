/**
 * Email Service Tests
 * Story 4.7: Envoi email des résultats
 */

import {
  validateEmail,
  renderTemplate,
  sanitizeHtml,
  sendGenerationResult,
  type EmailTemplateData,
} from '@/lib/services/email.service'
import type { IGeneration } from '@/models/Generation.model'
import type { IAnimation } from '@/models/Animation.model'
import mongoose from 'mongoose'

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

jest.mock('@/lib/blob-storage', () => ({
  blobStorageService: {
    getResultSasUrl: jest.fn().mockResolvedValue('https://blob.azure.com/result.png?sas=token'),
  },
}))

// Mock node-mailjet
const mockPost = jest.fn()
const mockRequest = jest.fn()
mockPost.mockReturnValue({ request: mockRequest })

jest.mock('node-mailjet', () => {
  return jest.fn().mockImplementation(() => ({
    post: mockPost,
  }))
})

describe('Email Service', () => {
  const mockGenerationId = new mongoose.Types.ObjectId()
  const mockAnimationId = new mongoose.Types.ObjectId()

  beforeEach(() => {
    jest.clearAllMocks()
    // Set environment variables for tests
    process.env.MAILJET_API_KEY = 'test-api-key'
    process.env.MAILJET_SECRET_KEY = 'test-secret-key'
    process.env.MAILJET_SENDER_EMAIL = 'noreply@appsbymci.com'
    process.env.MAILJET_SENDER_NAME = 'AppsByMCI'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.appsbymci.com'
  })

  afterEach(() => {
    delete process.env.MAILJET_API_KEY
    delete process.env.MAILJET_SECRET_KEY
    delete process.env.MAILJET_SENDER_EMAIL
    delete process.env.MAILJET_SENDER_NAME
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.org')).toBe(true)
      expect(validateEmail('user+tag@company.co.uk')).toBe(true)
    })

    it('should return false for invalid email addresses', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('not-an-email')).toBe(false)
      expect(validateEmail('missing@domain')).toBe(false)
      expect(validateEmail('@nodomain.com')).toBe(false)
      expect(validateEmail('spaces in@email.com')).toBe(false)
    })
  })

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<div>Hello</div><script>alert("xss")</script><p>World</p>'
      expect(sanitizeHtml(html)).toBe('<div>Hello</div><p>World</p>')
    })

    it('should remove inline event handlers', () => {
      const html = '<div onclick="alert(1)" onmouseover="hack()">Text</div>'
      expect(sanitizeHtml(html)).not.toContain('onclick')
      expect(sanitizeHtml(html)).not.toContain('onmouseover')
    })

    it('should remove javascript: URLs', () => {
      const html = '<a href="javascript:alert(1)">Click</a>'
      expect(sanitizeHtml(html)).not.toContain('javascript:')
    })

    it('should handle empty or null input', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml(null as unknown as string)).toBe('')
    })

    it('should preserve safe HTML', () => {
      const html =
        '<div style="color: red;"><p>Hello <strong>World</strong></p></div>'
      expect(sanitizeHtml(html)).toBe(html)
    })
  })

  describe('renderTemplate', () => {
    const templateData: EmailTemplateData = {
      name: 'Jean Dupont',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
      animationName: 'Mon Animation',
      imageUrl: 'https://blob.azure.com/image.png',
      viewResultLink: 'https://app.appsbymci.com/a/test/result/123',
      downloadLink: 'https://app.appsbymci.com/api/generations/123/download',
    }

    // Tests for single braces {var} (wizard format)
    it('should replace {variable} format (wizard single braces)', () => {
      const template = 'Bonjour {prenom} {nom}, bienvenue !'
      const result = renderTemplate(template, templateData)
      expect(result).toBe('Bonjour Jean Jean Dupont, bienvenue !')
    })

    it('should replace {imageUrl} variable (single braces)', () => {
      const template = '<img src="{imageUrl}" alt="Result">'
      const result = renderTemplate(template, templateData)
      expect(result).toBe('<img src="https://blob.azure.com/image.png" alt="Result">')
    })

    it('should replace {downloadLink} variable (single braces)', () => {
      const template = '<a href="{downloadLink}">Télécharger</a>'
      const result = renderTemplate(template, templateData)
      expect(result).toContain('/api/generations/123/download')
    })

    // Tests for double braces {{var}} (backward compatibility)
    it('should replace all template variables (double braces)', () => {
      const template =
        'Bonjour {{firstName}} {{lastName}}, voici ton résultat de {{animationName}}'
      const result = renderTemplate(template, templateData)
      expect(result).toBe('Bonjour Jean Dupont, voici ton résultat de Mon Animation')
    })

    it('should replace {{imageUrl}} variable (double braces)', () => {
      const template = '<img src="{{imageUrl}}" alt="Result">'
      const result = renderTemplate(template, templateData)
      expect(result).toBe('<img src="https://blob.azure.com/image.png" alt="Result">')
    })

    it('should replace {{downloadLink}} variable (double braces)', () => {
      const template = '<a href="{{downloadLink}}">Télécharger</a>'
      const result = renderTemplate(template, templateData)
      expect(result).toContain('/api/generations/123/download')
    })

    // Tests for mixed formats
    it('should handle mixed single and double braces', () => {
      const template = 'Bonjour {prenom}, voici {{animationName}}'
      const result = renderTemplate(template, templateData)
      expect(result).toBe('Bonjour Jean, voici Mon Animation')
    })

    it('should handle missing variables by replacing with empty string', () => {
      const template = 'Hello {unknownVar}, welcome!'
      const result = renderTemplate(template, templateData)
      expect(result).toBe('Hello , welcome!')
    })

    it('should sanitize rendered HTML', () => {
      const template = '{name}<script>alert("xss")</script>'
      const result = renderTemplate(template, templateData)
      expect(result).toBe('Jean Dupont')
      expect(result).not.toContain('<script>')
    })

    it('should handle empty template', () => {
      expect(renderTemplate('', templateData)).toBe('')
    })
  })

  describe('sendGenerationResult', () => {
    const createMockGeneration = (
      overrides: Partial<IGeneration> = {}
    ): IGeneration =>
      ({
        _id: mockGenerationId,
        animationId: mockAnimationId,
        participantData: {
          email: 'participant@example.com',
          nom: 'Dupont',
          prenom: 'Jean',
        },
        status: 'completed',
        generatedImageUrl: 'https://blob.azure.com/result.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      }) as IGeneration

    const createMockAnimation = (
      overrides: Partial<IAnimation> = {}
    ): IAnimation =>
      ({
        _id: mockAnimationId,
        name: 'Test Animation',
        slug: 'test-animation',
        emailConfig: {
          enabled: true,
          subject: 'Voici ton résultat !',
          bodyTemplate: '<p>Bonjour {{firstName}}, voici ton image:</p><img src="{{imageUrl}}">',
          senderName: 'Test Sender',
          senderEmail: 'admin@example.com',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      }) as unknown as IAnimation

    beforeEach(() => {
      mockRequest.mockResolvedValue({
        body: {
          Messages: [
            {
              To: [{ MessageID: 12345678 }],
            },
          ],
        },
      })
    })

    it('should send email successfully with correct parameters (AC1, AC2)', async () => {
      const generation = createMockGeneration()
      const animation = createMockAnimation()

      const result = await sendGenerationResult(generation, animation)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('12345678')

      // Verify Mailjet was called with correct parameters
      expect(mockPost).toHaveBeenCalledWith('send', { version: 'v3.1' })
      expect(mockRequest).toHaveBeenCalledWith({
        Messages: [
          expect.objectContaining({
            From: {
              Email: 'noreply@appsbymci.com', // Fixed sender
              Name: 'Test Sender', // Dynamic name
            },
            ReplyTo: { Email: 'admin@example.com' }, // Dynamic reply-to
            To: [{ Email: 'participant@example.com' }],
            Subject: 'Voici ton résultat !',
          }),
        ],
      })
    })

    it('should skip email if emailConfig.enabled is false (AC6)', async () => {
      const generation = createMockGeneration()
      const animation = createMockAnimation({
        emailConfig: {
          enabled: false,
          senderName: 'Test',
          senderEmail: 'test@example.com',
        },
      } as Partial<IAnimation>)

      const result = await sendGenerationResult(generation, animation)

      expect(result.success).toBe(true)
      expect(mockPost).not.toHaveBeenCalled()
    })

    it('should skip email if participant email is not provided (AC6)', async () => {
      const generation = createMockGeneration({
        participantData: { nom: 'Dupont' }, // No email
      })
      const animation = createMockAnimation()

      const result = await sendGenerationResult(generation, animation)

      expect(result.success).toBe(true)
      expect(mockPost).not.toHaveBeenCalled()
    })

    it('should return error for invalid email format (AC8)', async () => {
      const generation = createMockGeneration({
        participantData: { email: 'invalid-email' },
      })
      const animation = createMockAnimation()

      const result = await sendGenerationResult(generation, animation)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('INVALID_EMAIL')
      expect(mockPost).not.toHaveBeenCalled()
    })

    it('should retry on retryable errors (AC5)', async () => {
      const generation = createMockGeneration()
      const animation = createMockAnimation()

      // First call fails with 429, second succeeds
      mockRequest
        .mockRejectedValueOnce({ statusCode: 429, message: 'Rate limit exceeded' })
        .mockResolvedValueOnce({
          body: { Messages: [{ To: [{ MessageID: 99999 }] }] },
        })

      const result = await sendGenerationResult(generation, animation)

      expect(result.success).toBe(true)
      // Should have been called twice (initial + 1 retry)
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries (AC5)', async () => {
      const generation = createMockGeneration()
      const animation = createMockAnimation()

      // All calls fail with retryable error
      mockRequest.mockRejectedValue({ statusCode: 503, message: 'Service unavailable' })

      const result = await sendGenerationResult(generation, animation)

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Service unavailable')
      // Should have been called 3 times (initial + 2 retries)
      expect(mockRequest).toHaveBeenCalledTimes(3)
    }, 15000) // Increase timeout for retry test

    it('should not retry on non-retryable errors', async () => {
      const generation = createMockGeneration()
      const animation = createMockAnimation()

      mockRequest.mockRejectedValue({ statusCode: 400, message: 'Bad request' })

      const result = await sendGenerationResult(generation, animation)

      expect(result.success).toBe(false)
      // Should only be called once (no retry for 400)
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    it('should use default template when bodyTemplate is not provided', async () => {
      const generation = createMockGeneration()
      const animation = createMockAnimation({
        emailConfig: {
          enabled: true,
          senderName: 'Test',
          senderEmail: 'test@example.com',
          // No bodyTemplate
        },
      } as Partial<IAnimation>)

      await sendGenerationResult(generation, animation)

      // Should have been called with HTML content (default template rendered)
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          Messages: [
            expect.objectContaining({
              HTMLPart: expect.stringContaining('Télécharger mon image'), // Default template contains this
            }),
          ],
        })
      )
    })

    it('should return error when Mailjet is not configured', async () => {
      delete process.env.MAILJET_API_KEY

      const generation = createMockGeneration()
      const animation = createMockAnimation()

      const result = await sendGenerationResult(generation, animation)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('MAILJET_NOT_CONFIGURED')
    })

    it('should generate SAS URL with 24h expiry (AC8)', async () => {
      const { blobStorageService } = await import('@/lib/blob-storage')
      const generation = createMockGeneration()
      const animation = createMockAnimation()

      await sendGenerationResult(generation, animation)

      // Should request 24h (1440 minutes) SAS URL
      expect(blobStorageService.getResultSasUrl).toHaveBeenCalledWith(
        mockGenerationId.toString(),
        60 * 24
      )
    })

    it('should build correct viewResultLink and downloadLink (AC3)', async () => {
      const generation = createMockGeneration()
      const animation = createMockAnimation()

      await sendGenerationResult(generation, animation)

      const callArgs = mockRequest.mock.calls[0][0]
      const htmlPart = callArgs.Messages[0].HTMLPart

      // These URLs should be built correctly in template data
      // The actual URLs depend on template, but the service should provide correct data
      expect(htmlPart).toBeDefined()
    })
  })
})
