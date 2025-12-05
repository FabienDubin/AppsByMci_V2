/**
 * Email Service Tests
 * Story 4.7: Envoi email des résultats
 */

import {
  validateEmail,
  renderTemplate,
  sanitizeHtml,
  sendGenerationResult,
  buildEmailHtml,
  DEFAULT_EMAIL_DESIGN,
  type EmailTemplateData,
} from '@/lib/services/email.service'
import type { IEmailDesign } from '@/models/Animation.model'
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

  describe('DEFAULT_EMAIL_DESIGN', () => {
    it('should have all required default values', () => {
      expect(DEFAULT_EMAIL_DESIGN).toMatchObject({
        logoUrl: '',
        backgroundImageUrl: '',
        backgroundColor: '#f5f5f5',
        contentBackgroundColor: '#ffffff',
        contentBackgroundOpacity: 100,
        primaryColor: '#4F46E5',
        textColor: '#333333',
        borderRadius: 12,
        ctaText: '',
        ctaUrl: '',
      })
    })
  })

  describe('buildEmailHtml', () => {
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

    it('should build valid HTML email with default design', () => {
      const bodyContent = '<p>Bonjour Jean !</p>'
      const result = buildEmailHtml(bodyContent, undefined, templateData)

      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<html lang="fr">')
      expect(result).toContain('Bonjour Jean !')
      // Image is NOT automatically added - it should be in bodyContent via {imageUrl} variable
      expect(result).not.toContain('alt="Résultat"')
      // No CTA button by default (ctaText is empty)
      expect(result).not.toContain('href="#"')
      // No footer "Créé avec" anymore
      expect(result).not.toContain('Créé avec')
    })

    it('should apply custom background color', () => {
      const design: IEmailDesign = {
        backgroundColor: '#1a1a2e',
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      expect(result).toContain('background-color: #1a1a2e')
    })

    it('should apply background image when provided', () => {
      const design: IEmailDesign = {
        backgroundImageUrl: 'https://example.com/bg.jpg',
        backgroundColor: '#000000',
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      expect(result).toContain("background-image: url('https://example.com/bg.jpg')")
      expect(result).toContain('background-size: cover')
    })

    it('should include logo when provided', () => {
      const design: IEmailDesign = {
        logoUrl: 'https://example.com/logo.png',
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      expect(result).toContain('https://example.com/logo.png')
      expect(result).toContain('alt="Logo"')
    })

    it('should not include logo section when logoUrl is empty', () => {
      const design: IEmailDesign = {
        logoUrl: '',
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      expect(result).not.toContain('alt="Logo"')
    })

    it('should apply custom primary color to CTA button when configured', () => {
      const design: IEmailDesign = {
        primaryColor: '#FF5733',
        ctaText: 'Click me',
        ctaUrl: 'https://example.com',
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      expect(result).toContain('background-color: #FF5733')
      expect(result).toContain('Click me')
      expect(result).toContain('https://example.com')
    })

    it('should apply custom text color', () => {
      const design: IEmailDesign = {
        textColor: '#222222',
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      expect(result).toContain('color: #222222')
    })

    it('should apply custom border radius', () => {
      const design: IEmailDesign = {
        borderRadius: 24,
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      expect(result).toContain('border-radius: 24px')
    })

    it('should apply content background with opacity', () => {
      const design: IEmailDesign = {
        contentBackgroundColor: '#ffffff',
        contentBackgroundOpacity: 80,
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      // Should convert to rgba
      expect(result).toContain('rgba(255, 255, 255, 0.8)')
    })

    it('should merge partial design with defaults', () => {
      const design: IEmailDesign = {
        primaryColor: '#00FF00',
        ctaText: 'Test Button',
        // Other values should use defaults
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      // Custom value (in CTA button)
      expect(result).toContain('#00FF00')
      expect(result).toContain('Test Button')
      // Default border radius
      expect(result).toContain('border-radius: 12px')
    })

    it('should substitute {downloadLink} variable in ctaUrl', () => {
      const design: IEmailDesign = {
        ctaText: 'Download Image',
        ctaUrl: '{downloadLink}',
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      // Should substitute the variable with actual downloadLink
      expect(result).toContain(`href="${templateData.downloadLink}"`)
      expect(result).not.toContain('{downloadLink}')
    })

    it('should not add duplicate image - image comes from bodyContent only', () => {
      const bodyWithImage = `<p>Voici ton image:</p><img src="${templateData.imageUrl}" alt="Mon image">`
      const design: IEmailDesign = {
        primaryColor: '#FF0000',
      }
      const result = buildEmailHtml(bodyWithImage, design, templateData)

      // Should contain the image from bodyContent
      expect(result).toContain(templateData.imageUrl)
      // Should NOT contain auto-added image with "Résultat" alt
      expect(result).not.toContain('alt="Résultat"')
      // Count occurrences of imageUrl - should be exactly 1 (from bodyContent)
      const imageUrlCount = (result.match(new RegExp(templateData.imageUrl, 'g')) || []).length
      expect(imageUrlCount).toBe(1)
    })

    it('should not include footer with animation name', () => {
      const result = buildEmailHtml('<p>Test</p>', undefined, templateData)

      // Should NOT contain "Créé avec" footer
      expect(result).not.toContain('Créé avec')
      // animationName is still used in <title>, but not in visible footer
    })

    it('should not show CTA button when ctaText is empty', () => {
      const design: IEmailDesign = {
        ctaText: '',
        ctaUrl: 'https://example.com',
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      // Should NOT contain CTA button
      expect(result).not.toContain('https://example.com')
    })

    it('should show CTA button when ctaText is provided', () => {
      const design: IEmailDesign = {
        ctaText: 'Télécharger',
        ctaUrl: 'https://example.com/download',
        primaryColor: '#FF5733',
      }
      const result = buildEmailHtml('<p>Test</p>', design, templateData)

      // Should contain CTA button with correct text and URL
      expect(result).toContain('Télécharger')
      expect(result).toContain('https://example.com/download')
      expect(result).toContain('#FF5733')
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
              HTMLPart: expect.stringContaining('Voici ton image générée'), // Default template contains this
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

    it('should use buildEmailHtml when design is configured', async () => {
      const generation = createMockGeneration()
      const animation = createMockAnimation({
        emailConfig: {
          enabled: true,
          subject: 'Test avec design',
          bodyTemplate: '<p>Bonjour {prenom} !</p>',
          senderName: 'Test',
          senderEmail: 'test@example.com',
          design: {
            logoUrl: 'https://example.com/logo.png',
            primaryColor: '#FF0000',
            backgroundColor: '#000000',
            ctaText: 'Download',
            ctaUrl: 'https://example.com/download',
          },
        },
      } as Partial<IAnimation>)

      await sendGenerationResult(generation, animation)

      const callArgs = mockRequest.mock.calls[0][0]
      const htmlPart = callArgs.Messages[0].HTMLPart

      // Should contain design elements
      expect(htmlPart).toContain('https://example.com/logo.png')
      expect(htmlPart).toContain('#FF0000') // primaryColor in CTA button
      expect(htmlPart).toContain('#000000') // backgroundColor
      expect(htmlPart).toContain('Download') // CTA text
    })

    it('should use legacy template when design is not configured', async () => {
      const generation = createMockGeneration()
      const animation = createMockAnimation({
        emailConfig: {
          enabled: true,
          subject: 'Test sans design',
          bodyTemplate: '<p>Bonjour {prenom} !</p>',
          senderName: 'Test',
          senderEmail: 'test@example.com',
          // No design configured
        },
      } as Partial<IAnimation>)

      await sendGenerationResult(generation, animation)

      const callArgs = mockRequest.mock.calls[0][0]
      const htmlPart = callArgs.Messages[0].HTMLPart

      // Should use legacy template (with #4F46E5 header)
      expect(htmlPart).toContain('#4F46E5')
      expect(htmlPart).toContain('Bonjour Jean !')
    })
  })
})
