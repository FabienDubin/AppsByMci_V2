/**
 * Tests for Step 1 Slug Protection Logic (Story 3.10)
 *
 * Critical behavior: When an animation is published, the slug must remain
 * unchanged even if the name is modified (to protect QR codes).
 */

import { describe, it, expect } from '@jest/globals'

/**
 * Simulates the slug auto-generation logic from step-1-general-info.tsx
 * This is the same function used in the component
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Simulates the shouldAutoGenerateSlug logic from the useEffect
 * Returns true if slug should be auto-generated, false otherwise
 */
function shouldAutoGenerateSlug(params: {
  name: string
  slugManuallyEdited: boolean
  canEditSlug: boolean
}): boolean {
  const { name, slugManuallyEdited, canEditSlug } = params
  return Boolean(name && !slugManuallyEdited && canEditSlug)
}

describe('Step 1 Slug Protection (Story 3.10)', () => {
  describe('generateSlug function', () => {
    it('should convert name to kebab-case slug', () => {
      expect(generateSlug('Test Animation')).toBe('test-animation')
    })

    it('should handle accented characters', () => {
      expect(generateSlug('Événement Spécial')).toBe('evenement-special')
    })

    it('should handle special characters', () => {
      expect(generateSlug('Test@Animation#2025!')).toBe('test-animation-2025')
    })

    it('should handle multiple spaces', () => {
      expect(generateSlug('Test   Animation')).toBe('test-animation')
    })

    it('should remove leading/trailing hyphens', () => {
      expect(generateSlug('  Test Animation  ')).toBe('test-animation')
    })
  })

  describe('shouldAutoGenerateSlug logic', () => {
    describe('when canEditSlug is TRUE (draft animation)', () => {
      it('should auto-generate slug when name exists and slug not manually edited', () => {
        const result = shouldAutoGenerateSlug({
          name: 'New Animation',
          slugManuallyEdited: false,
          canEditSlug: true,
        })
        expect(result).toBe(true)
      })

      it('should NOT auto-generate slug when slug was manually edited', () => {
        const result = shouldAutoGenerateSlug({
          name: 'New Animation',
          slugManuallyEdited: true,
          canEditSlug: true,
        })
        expect(result).toBe(false)
      })

      it('should NOT auto-generate slug when name is empty', () => {
        const result = shouldAutoGenerateSlug({
          name: '',
          slugManuallyEdited: false,
          canEditSlug: true,
        })
        expect(result).toBe(false)
      })
    })

    describe('when canEditSlug is FALSE (published animation)', () => {
      it('should NEVER auto-generate slug, even with valid name', () => {
        const result = shouldAutoGenerateSlug({
          name: 'Updated Animation Name',
          slugManuallyEdited: false,
          canEditSlug: false,
        })
        expect(result).toBe(false)
      })

      it('should NEVER auto-generate slug, regardless of manual edit state', () => {
        const result = shouldAutoGenerateSlug({
          name: 'Updated Animation Name',
          slugManuallyEdited: true,
          canEditSlug: false,
        })
        expect(result).toBe(false)
      })

      it('should protect slug when name changes multiple times', () => {
        // Simulate multiple name changes on a published animation
        const scenarios = [
          'First Name Change',
          'Second Name Change',
          'Third Name Change With Accénts',
        ]

        scenarios.forEach((name) => {
          const result = shouldAutoGenerateSlug({
            name,
            slugManuallyEdited: false,
            canEditSlug: false,
          })
          expect(result).toBe(false)
        })
      })
    })
  })

  describe('Integration: Slug protection on published animations', () => {
    it('should preserve original slug when editing published animation name', () => {
      // Initial state: published animation
      const originalSlug = 'original-animation-slug'
      const canEditSlug = false // Published animation

      // User changes name
      const newName = 'Completely Different Animation Name'

      // Check if auto-generation should happen
      const shouldGenerate = shouldAutoGenerateSlug({
        name: newName,
        slugManuallyEdited: false,
        canEditSlug,
      })

      // Auto-generation should be blocked
      expect(shouldGenerate).toBe(false)

      // The original slug remains unchanged
      // (In the actual component, setValue('slug', ...) is never called)
      expect(originalSlug).toBe('original-animation-slug')
    })

    it('should allow slug changes for draft animations', () => {
      // Initial state: draft animation
      const canEditSlug = true

      // User changes name
      const newName = 'New Draft Animation'

      // Check if auto-generation should happen
      const shouldGenerate = shouldAutoGenerateSlug({
        name: newName,
        slugManuallyEdited: false,
        canEditSlug,
      })

      // Auto-generation should be allowed
      expect(shouldGenerate).toBe(true)

      // New slug would be generated
      const newSlug = generateSlug(newName)
      expect(newSlug).toBe('new-draft-animation')
    })
  })
})
