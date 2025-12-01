/**
 * Tests for Step 1 Schema (General Information)
 * Validates name, slug, and description fields
 */

import { describe, it, expect } from '@jest/globals'
import { step1Schema } from '@/lib/schemas/step1.schema'
import type { Step1Data } from '@/lib/schemas/step1.schema'

describe('Step 1 Schema (General Info)', () => {
  describe('Valid data', () => {
    it('should accept complete valid step1 data', () => {
      const validData: Step1Data = {
        name: 'Test Animation',
        slug: 'test-animation',
        description: 'This is a test animation for testing purposes',
      }

      const result = step1Schema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should accept minimal valid data (name + slug only)', () => {
      const minimalData: Step1Data = {
        name: 'Minimal Animation',
        slug: 'minimal-animation',
      }

      const result = step1Schema.safeParse(minimalData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Minimal Animation')
        expect(result.data.slug).toBe('minimal-animation')
        expect(result.data.description).toBeUndefined()
      }
    })

    it('should accept empty description', () => {
      const dataWithEmptyDesc: Step1Data = {
        name: 'Test',
        slug: 'test',
        description: '',
      }

      const result = step1Schema.safeParse(dataWithEmptyDesc)
      expect(result.success).toBe(true)
    })
  })

  describe('Name validation', () => {
    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        slug: 'test-slug',
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
        expect(result.error.issues[0].message).toContain('requis')
      }
    })

    it('should reject name too long (> 100 chars)', () => {
      const longName = 'a'.repeat(101)
      const invalidData = {
        name: longName,
        slug: 'test-slug',
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
        expect(result.error.issues[0].message).toContain('100 caractères')
      }
    })

    it('should accept name at max length (100 chars)', () => {
      const maxName = 'a'.repeat(100)
      const validData = {
        name: maxName,
        slug: 'test-slug',
      }

      const result = step1Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Slug validation', () => {
    it('should accept valid slug format (lowercase-with-dashes)', () => {
      const validSlugs = [
        'simple-slug',
        'animation-with-multiple-words',
        'test123',
        'test-123-animation',
        'a',
        '123',
      ]

      validSlugs.forEach((slug) => {
        const data = {
          name: 'Test',
          slug,
        }
        const result = step1Schema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject slug with spaces', () => {
      const invalidData = {
        name: 'Test',
        slug: 'test with spaces',
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('slug')
        expect(result.error.issues[0].message).toContain('kebab-case')
      }
    })

    it('should reject slug with uppercase', () => {
      const invalidData = {
        name: 'Test',
        slug: 'Test-Animation',
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('slug')
      }
    })

    it('should reject slug with special chars', () => {
      const invalidSlugs = [
        'test@animation',
        'test_animation',
        'test.animation',
        'test/animation',
        'test!animation',
      ]

      invalidSlugs.forEach((slug) => {
        const data = {
          name: 'Test',
          slug,
        }
        const result = step1Schema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    it('should reject empty slug', () => {
      const invalidData = {
        name: 'Test',
        slug: '',
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('slug')
        expect(result.error.issues[0].message).toContain('requis')
      }
    })

    it('should reject slug starting with dash', () => {
      const invalidData = {
        name: 'Test',
        slug: '-test-animation',
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject slug ending with dash', () => {
      const invalidData = {
        name: 'Test',
        slug: 'test-animation-',
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject slug with consecutive dashes', () => {
      const invalidData = {
        name: 'Test',
        slug: 'test--animation',
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Description validation', () => {
    it('should accept optional description', () => {
      const data = {
        name: 'Test',
        slug: 'test',
        description: 'A valid description',
      }

      const result = step1Schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept missing description', () => {
      const data = {
        name: 'Test',
        slug: 'test',
      }

      const result = step1Schema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject description too long (> 500 chars)', () => {
      const longDescription = 'a'.repeat(501)
      const invalidData = {
        name: 'Test',
        slug: 'test',
        description: longDescription,
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description')
        expect(result.error.issues[0].message).toContain('500 caractères')
      }
    })

    it('should accept description at max length (500 chars)', () => {
      const maxDescription = 'a'.repeat(500)
      const validData = {
        name: 'Test',
        slug: 'test',
        description: maxDescription,
      }

      const result = step1Schema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should reject missing required fields', () => {
      const invalidData = {}

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })

    it('should reject null values', () => {
      const invalidData = {
        name: null,
        slug: null,
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject undefined name (but not slug)', () => {
      const invalidData = {
        name: undefined,
        slug: 'test',
      }

      const result = step1Schema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
