import { step2Schema, aiConsentSchema } from '@/lib/schemas/animation.schema'

// Default aiConsent value for tests
const defaultAiConsent = { enabled: false, required: false, label: '' }

describe('Step2 Schema Validation', () => {
  describe('Valid data', () => {
    it('should validate correct step2 data with type=none', () => {
      const validData = {
        accessConfig: {
          type: 'none' as const,
        },
        baseFields: {
          name: {
            enabled: true,
            required: true,
            label: 'Nom',
            placeholder: 'Ex: Jean Dupont',
          },
          firstName: {
            enabled: false,
            required: true,
            label: 'Prénom',
            placeholder: 'Ex: Marie',
          },
          email: {
            enabled: false,
            required: true,
            label: 'Email',
            placeholder: 'exemple@email.com',
          },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate data with optional labels and placeholders', () => {
      const validData = {
        accessConfig: {
          type: 'none' as const,
        },
        baseFields: {
          name: {
            enabled: true,
            required: true,
          },
          firstName: {
            enabled: false,
            required: true,
          },
          email: {
            enabled: false,
            required: true,
          },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Access config type=code', () => {
    it('should require code when type=code', () => {
      const invalidData = {
        accessConfig: {
          type: 'code' as const,
          // Missing code
        },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('code')
      }
    })

    it('should validate when type=code and code is provided', () => {
      const validData = {
        accessConfig: {
          type: 'code' as const,
          code: 'TECH2025',
        },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty code string', () => {
      const invalidData = {
        accessConfig: {
          type: 'code' as const,
          code: '   ', // Empty/whitespace
        },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Access config type=email-domain', () => {
    it('should require emailDomains when type=email-domain', () => {
      const invalidData = {
        accessConfig: {
          type: 'email-domain' as const,
          // Missing emailDomains
        },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: true, required: true }, // Email enabled
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('domaine email')
      }
    })

    it('should validate domains starting with @', () => {
      const validData = {
        accessConfig: {
          type: 'email-domain' as const,
          emailDomains: ['@company.com', '@partner.fr'],
        },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: true, required: true },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject domains not starting with @', () => {
      const invalidData = {
        accessConfig: {
          type: 'email-domain' as const,
          emailDomains: ['company.com', '@partner.fr'], // First domain missing @
        },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: true, required: true },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('@')
      }
    })

    it('should require email.enabled=true when type=email-domain', () => {
      const invalidData = {
        accessConfig: {
          type: 'email-domain' as const,
          emailDomains: ['@company.com'],
        },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true }, // Email NOT enabled
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Email doit être activé')
      }
    })

    it('should reject empty emailDomains array', () => {
      const invalidData = {
        accessConfig: {
          type: 'email-domain' as const,
          emailDomains: [], // Empty array
        },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: true, required: true },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Label and placeholder validation', () => {
    it('should reject labels longer than 50 characters', () => {
      const invalidData = {
        accessConfig: {
          type: 'none' as const,
        },
        baseFields: {
          name: {
            enabled: true,
            required: true,
            label: 'A'.repeat(51), // 51 characters
            placeholder: 'Test',
          },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('50 caractères')
      }
    })

    it('should reject placeholders longer than 100 characters', () => {
      const invalidData = {
        accessConfig: {
          type: 'none' as const,
        },
        baseFields: {
          name: {
            enabled: true,
            required: true,
            label: 'Nom',
            placeholder: 'A'.repeat(101), // 101 characters
          },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('100 caractères')
      }
    })

    it('should accept labels at max length (50 chars)', () => {
      const validData = {
        accessConfig: {
          type: 'none' as const,
        },
        baseFields: {
          name: {
            enabled: true,
            required: true,
            label: 'A'.repeat(50), // Exactly 50 characters
            placeholder: 'Test',
          },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept placeholders at max length (100 chars)', () => {
      const validData = {
        accessConfig: {
          type: 'none' as const,
        },
        baseFields: {
          name: {
            enabled: true,
            required: true,
            label: 'Nom',
            placeholder: 'A'.repeat(100), // Exactly 100 characters
          },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: defaultAiConsent,
        },
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  // Story 3.12: AI Consent validation tests
  describe('AI Consent (Story 3.12)', () => {
    it('should validate aiConsent with all fields', () => {
      const validData = {
        accessConfig: { type: 'none' as const },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: {
            enabled: true,
            required: true,
            label: '<p>J\'accepte que mes données soient utilisées par l\'IA.</p>',
          },
        },
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate aiConsent with enabled=false', () => {
      const validData = {
        accessConfig: { type: 'none' as const },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: {
            enabled: false,
            required: false,
            label: '',
          },
        },
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate aiConsent with HTML in label', () => {
      const validData = {
        accessConfig: { type: 'none' as const },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: {
            enabled: true,
            required: true, // Always required when enabled
            label: '<p>J\'accepte les <a href="https://example.com/cgu">conditions d\'utilisation</a>.</p>',
          },
        },
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject aiConsent label longer than 5000 characters', () => {
      const invalidData = {
        accessConfig: { type: 'none' as const },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: {
            enabled: true,
            required: true, // Always required when enabled
            label: 'A'.repeat(5001), // 5001 characters
          },
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('5000 caractères')
      }
    })

    it('should accept aiConsent label at max length (5000 chars)', () => {
      const validData = {
        accessConfig: { type: 'none' as const },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: {
            enabled: true,
            required: true, // Always required when enabled
            label: 'A'.repeat(5000), // Exactly 5000 characters
          },
        },
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require aiConsent in baseFields', () => {
      const invalidData = {
        accessConfig: { type: 'none' as const },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          // Missing aiConsent
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should require label when aiConsent is enabled', () => {
      const invalidData = {
        accessConfig: { type: 'none' as const },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: {
            enabled: true,
            required: true,
            label: '', // Empty label
          },
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("texte d'autorisation")
      }
    })

    it('should reject aiConsent with only HTML tags but no text content', () => {
      const invalidData = {
        accessConfig: { type: 'none' as const },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: {
            enabled: true,
            required: true,
            label: '<p></p><br />', // HTML tags but no actual text
          },
        },
      }

      const result = step2Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("texte d'autorisation")
      }
    })

    it('should allow empty label when aiConsent is disabled', () => {
      const validData = {
        accessConfig: { type: 'none' as const },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
          aiConsent: {
            enabled: false,
            required: false,
            label: '', // Empty label is OK when disabled
          },
        },
      }

      const result = step2Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  // aiConsentSchema unit tests
  describe('aiConsentSchema unit tests', () => {
    it('should validate a complete aiConsent object', () => {
      const validData = {
        enabled: true,
        required: true,
        label: '<p>Consent text</p>',
      }

      const result = aiConsentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing enabled field', () => {
      const invalidData = {
        required: true,
        label: 'Test',
      }

      const result = aiConsentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing required field', () => {
      const invalidData = {
        enabled: true,
        label: 'Test',
      }

      const result = aiConsentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing label field', () => {
      const invalidData = {
        enabled: true,
        required: false,
      }

      const result = aiConsentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
