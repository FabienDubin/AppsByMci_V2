/**
 * Step 7 Customization Schema Tests
 * Tests Zod validation for customizationSchema and step7Schema
 */

import { customizationSchema, step7Schema } from '@/lib/schemas/animation.schema'

describe('customizationSchema', () => {
  const validCustomization = {
    primaryColor: '#000000',
    secondaryColor: '#71717a',
    theme: 'auto',
    submissionMessage: 'Merci ! Votre résultat arrive...',
    loadingMessages: ['Message 1', 'Message 2', 'Message 3'],
    thankYouMessage: 'Merci d\'avoir participé !',
  }

  describe('color validation', () => {
    it('should accept valid hex colors', () => {
      const data = {
        ...validCustomization,
        primaryColor: '#FF5733',
        secondaryColor: '#abcdef',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid hex color for primaryColor', () => {
      const data = {
        ...validCustomization,
        primaryColor: 'red',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Format de couleur invalide')
      }
    })

    it('should reject short hex color (3 chars)', () => {
      const data = {
        ...validCustomization,
        primaryColor: '#FFF',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject hex color without #', () => {
      const data = {
        ...validCustomization,
        secondaryColor: 'FF5733',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept optional backgroundColor when provided', () => {
      const data = {
        ...validCustomization,
        backgroundColor: '#f0f0f0',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept missing backgroundColor', () => {
      const result = customizationSchema.safeParse(validCustomization)
      expect(result.success).toBe(true)
    })
  })

  describe('theme validation', () => {
    it('should accept valid theme values', () => {
      const themes = ['light', 'dark', 'auto'] as const

      for (const theme of themes) {
        const data = {
          ...validCustomization,
          theme,
        }

        const result = customizationSchema.safeParse(data)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid theme value', () => {
      const data = {
        ...validCustomization,
        theme: 'system',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('URL validation', () => {
    it('should accept valid logo URL', () => {
      const data = {
        ...validCustomization,
        logo: 'https://example.com/logo.png',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid logo URL', () => {
      const data = {
        ...validCustomization,
        logo: 'not-a-url',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('URL invalide')
      }
    })

    it('should accept valid backgroundImage URL', () => {
      const data = {
        ...validCustomization,
        backgroundImage: 'https://storage.example.com/bg.jpg',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('message validation', () => {
    // Story 3.13: welcomeMessage is now HTML from WYSIWYG editor with no character limit
    it('should accept long welcomeMessage (HTML from WYSIWYG - Story 3.13)', () => {
      const data = {
        ...validCustomization,
        welcomeMessage: '<p>' + 'a'.repeat(1000) + '</p>',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept welcomeMessage with HTML formatting (Story 3.13)', () => {
      const data = {
        ...validCustomization,
        welcomeMessage: '<p><strong>Bienvenue</strong> à notre <em>événement</em> !</p><p>Cliquez <a href="https://example.com">ici</a> pour plus d\'infos.</p>',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept plain text welcomeMessage for backward compatibility (Story 3.13)', () => {
      const data = {
        ...validCustomization,
        welcomeMessage: 'Bienvenue à notre événement !',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept empty welcomeMessage (optional field)', () => {
      const data = {
        ...validCustomization,
        welcomeMessage: '',
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject submissionMessage longer than 100 characters', () => {
      const data = {
        ...validCustomization,
        submissionMessage: 'a'.repeat(101),
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('100'))).toBe(true)
      }
    })

    it('should reject thankYouMessage longer than 100 characters', () => {
      const data = {
        ...validCustomization,
        thankYouMessage: 'a'.repeat(101),
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('loadingMessages validation', () => {
    it('should reject less than 3 loading messages', () => {
      const data = {
        ...validCustomization,
        loadingMessages: ['Message 1', 'Message 2'],
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('Minimum 3'))).toBe(true)
      }
    })

    it('should reject more than 10 loading messages', () => {
      const data = {
        ...validCustomization,
        loadingMessages: Array.from({ length: 11 }, (_, i) => `Message ${i + 1}`),
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('Maximum 10'))).toBe(true)
      }
    })

    it('should accept between 3 and 10 loading messages', () => {
      const messageCounts = [3, 5, 7, 10]

      for (const count of messageCounts) {
        const data = {
          ...validCustomization,
          loadingMessages: Array.from({ length: count }, (_, i) => `Message ${i + 1}`),
        }

        const result = customizationSchema.safeParse(data)
        expect(result.success).toBe(true)
      }
    })

    it('should reject loading message longer than 100 characters', () => {
      const data = {
        ...validCustomization,
        loadingMessages: ['Message 1', 'Message 2', 'a'.repeat(101)],
      }

      const result = customizationSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('100'))).toBe(true)
      }
    })
  })
})

describe('step7Schema', () => {
  it('should wrap customization correctly', () => {
    const data = {
      customization: {
        primaryColor: '#000000',
        secondaryColor: '#71717a',
        theme: 'auto',
        submissionMessage: 'Merci !',
        loadingMessages: ['Msg 1', 'Msg 2', 'Msg 3'],
        thankYouMessage: 'Merci !',
      },
    }

    const result = step7Schema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject missing customization', () => {
    const data = {}

    const result = step7Schema.safeParse(data)
    expect(result.success).toBe(false)
  })
})

describe('textCard validation', () => {
  const validCustomization = {
    primaryColor: '#000000',
    secondaryColor: '#71717a',
    theme: 'auto',
    submissionMessage: 'Merci !',
    loadingMessages: ['Msg 1', 'Msg 2', 'Msg 3'],
    thankYouMessage: 'Merci !',
  }

  it('should accept valid textCard configuration', () => {
    const data = {
      ...validCustomization,
      textCard: {
        enabled: true,
        backgroundColor: '#FFFFFF',
        opacity: 90,
        borderRadius: 12,
        padding: 16,
      },
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should accept textCard with opacity at 0%', () => {
    const data = {
      ...validCustomization,
      textCard: {
        enabled: true,
        backgroundColor: '#000000',
        opacity: 0,
        borderRadius: 0,
        padding: 8,
      },
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should accept textCard with opacity at 100%', () => {
    const data = {
      ...validCustomization,
      textCard: {
        enabled: true,
        backgroundColor: '#FFFFFF',
        opacity: 100,
        borderRadius: 24,
        padding: 32,
      },
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject textCard with opacity below 0%', () => {
    const data = {
      ...validCustomization,
      textCard: {
        enabled: true,
        backgroundColor: '#FFFFFF',
        opacity: -10,
        borderRadius: 12,
        padding: 16,
      },
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject textCard with opacity above 100%', () => {
    const data = {
      ...validCustomization,
      textCard: {
        enabled: true,
        backgroundColor: '#FFFFFF',
        opacity: 150,
        borderRadius: 12,
        padding: 16,
      },
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject textCard with invalid backgroundColor', () => {
    const data = {
      ...validCustomization,
      textCard: {
        enabled: true,
        backgroundColor: 'white',
        opacity: 90,
        borderRadius: 12,
        padding: 16,
      },
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('Format de couleur invalide'))).toBe(true)
    }
  })

  it('should reject textCard with borderRadius above 24px', () => {
    const data = {
      ...validCustomization,
      textCard: {
        enabled: true,
        backgroundColor: '#FFFFFF',
        opacity: 90,
        borderRadius: 30,
        padding: 16,
      },
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject textCard with padding below 8px', () => {
    const data = {
      ...validCustomization,
      textCard: {
        enabled: true,
        backgroundColor: '#FFFFFF',
        opacity: 90,
        borderRadius: 12,
        padding: 4,
      },
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should reject textCard with padding above 32px', () => {
    const data = {
      ...validCustomization,
      textCard: {
        enabled: true,
        backgroundColor: '#FFFFFF',
        opacity: 90,
        borderRadius: 12,
        padding: 40,
      },
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('should accept customization without textCard (optional)', () => {
    const result = customizationSchema.safeParse(validCustomization)
    expect(result.success).toBe(true)
  })

  it('should accept backgroundColorOpacity at 0%', () => {
    const data = {
      ...validCustomization,
      backgroundColor: '#1a1a2e',
      backgroundColorOpacity: 0,
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should accept backgroundColorOpacity at 100%', () => {
    const data = {
      ...validCustomization,
      backgroundColor: '#1a1a2e',
      backgroundColorOpacity: 100,
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject backgroundColorOpacity above 100%', () => {
    const data = {
      ...validCustomization,
      backgroundColorOpacity: 120,
    }

    const result = customizationSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})
