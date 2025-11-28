/**
 * Step 5 Email Config Schema Tests
 * Tests Zod validation for emailConfigSchema and step5Schema
 */

import { emailConfigSchema, step5Schema } from '@/lib/schemas/animation.schema'
import { ZodError } from 'zod'

describe('emailConfigSchema', () => {
  describe('when enabled = false', () => {
    it('should accept email config with enabled=false without subject/body', () => {
      const data = {
        enabled: false,
        senderName: 'AppsByMCI',
        senderEmail: 'noreply@appsbymci.com',
      }

      const result = emailConfigSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept email config with enabled=false even with empty subject/body', () => {
      const data = {
        enabled: false,
        subject: '',
        bodyTemplate: '',
        senderName: 'Test Sender',
        senderEmail: 'test@example.com',
      }

      const result = emailConfigSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('when enabled = true', () => {
    it('should reject email config with enabled=true but no subject', () => {
      const data = {
        enabled: true,
        bodyTemplate: '<p>Test body</p>',
        senderName: 'AppsByMCI',
        senderEmail: 'noreply@appsbymci.com',
      }

      const result = emailConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Le sujet de l'email est requis")
      }
    })

    it('should reject email config with enabled=true but no bodyTemplate', () => {
      const data = {
        enabled: true,
        subject: 'Test Subject',
        senderName: 'AppsByMCI',
        senderEmail: 'noreply@appsbymci.com',
      }

      const result = emailConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Le corps de l'email est requis")
      }
    })

    it('should reject email config with enabled=true but empty subject', () => {
      const data = {
        enabled: true,
        subject: '   ',
        bodyTemplate: '<p>Test body</p>',
        senderName: 'AppsByMCI',
        senderEmail: 'noreply@appsbymci.com',
      }

      const result = emailConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Le sujet de l'email est requis")
      }
    })

    it('should accept email config with enabled=true and valid subject/body', () => {
      const data = {
        enabled: true,
        subject: 'Ton résultat {nom} est prêt !',
        bodyTemplate: '<p>Bonjour {nom}, voici ton image</p>',
        senderName: 'MCI Events',
        senderEmail: 'events@mci.com',
      }

      const result = emailConfigSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('senderEmail validation', () => {
    it('should reject invalid email format', () => {
      const data = {
        enabled: false,
        senderName: 'AppsByMCI',
        senderEmail: 'invalid-email',
      }

      const result = emailConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Format d'email invalide")
      }
    })

    it('should accept valid email format', () => {
      const data = {
        enabled: false,
        senderName: 'AppsByMCI',
        senderEmail: 'valid@email.com',
      }

      const result = emailConfigSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('field length validation', () => {
    it('should reject subject longer than 200 characters', () => {
      const data = {
        enabled: true,
        subject: 'a'.repeat(201),
        bodyTemplate: '<p>Test</p>',
        senderName: 'AppsByMCI',
        senderEmail: 'test@example.com',
      }

      const result = emailConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('200'))).toBe(true)
      }
    })

    it('should accept subject at exactly 200 characters', () => {
      const data = {
        enabled: true,
        subject: 'a'.repeat(200),
        bodyTemplate: '<p>Test</p>',
        senderName: 'AppsByMCI',
        senderEmail: 'test@example.com',
      }

      const result = emailConfigSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject bodyTemplate longer than 10000 characters', () => {
      const data = {
        enabled: true,
        subject: 'Test',
        bodyTemplate: 'a'.repeat(10001),
        senderName: 'AppsByMCI',
        senderEmail: 'test@example.com',
      }

      const result = emailConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('10000'))).toBe(true)
      }
    })
  })
})

describe('step5Schema', () => {
  it('should wrap emailConfig correctly', () => {
    const data = {
      emailConfig: {
        enabled: false,
        senderName: 'AppsByMCI',
        senderEmail: 'noreply@appsbymci.com',
      },
    }

    const result = step5Schema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject missing emailConfig', () => {
    const data = {}

    const result = step5Schema.safeParse(data)
    expect(result.success).toBe(false)
  })
})
