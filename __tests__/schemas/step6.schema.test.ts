/**
 * Step 6 Public Display Config Schema Tests
 * Tests Zod validation for publicDisplayConfigSchema and step6Schema
 */

import { publicDisplayConfigSchema, step6Schema } from '@/lib/schemas/animation.schema'

describe('publicDisplayConfigSchema', () => {
  describe('basic validation', () => {
    it('should accept valid masonry config with columns', () => {
      const data = {
        enabled: true,
        layout: 'masonry',
        columns: 3,
        autoScroll: true,
        autoScrollSpeed: 'medium',
        showParticipantName: true,
        refreshInterval: 10,
      }

      const result = publicDisplayConfigSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept valid grid config with columns', () => {
      const data = {
        enabled: true,
        layout: 'grid',
        columns: 4,
        autoScroll: false,
        showParticipantName: false,
        refreshInterval: 30,
      }

      const result = publicDisplayConfigSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept valid carousel config without columns', () => {
      const data = {
        enabled: true,
        layout: 'carousel',
        showParticipantName: true,
        refreshInterval: 15,
      }

      const result = publicDisplayConfigSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept disabled config', () => {
      const data = {
        enabled: false,
        layout: 'masonry',
        columns: 3,
        showParticipantName: true,
        refreshInterval: 10,
      }

      const result = publicDisplayConfigSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('columns validation', () => {
    it('should reject masonry layout without columns', () => {
      const data = {
        enabled: true,
        layout: 'masonry',
        showParticipantName: true,
        refreshInterval: 10,
      }

      const result = publicDisplayConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('colonnes')
      }
    })

    it('should reject grid layout without columns', () => {
      const data = {
        enabled: true,
        layout: 'grid',
        showParticipantName: true,
        refreshInterval: 10,
      }

      const result = publicDisplayConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject columns less than 2', () => {
      const data = {
        enabled: true,
        layout: 'masonry',
        columns: 1,
        showParticipantName: true,
        refreshInterval: 10,
      }

      const result = publicDisplayConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('Minimum 2'))).toBe(true)
      }
    })

    it('should reject columns greater than 5', () => {
      const data = {
        enabled: true,
        layout: 'grid',
        columns: 6,
        showParticipantName: true,
        refreshInterval: 10,
      }

      const result = publicDisplayConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('Maximum 5'))).toBe(true)
      }
    })

    it('should accept columns between 2 and 5', () => {
      const testColumns = [2, 3, 4, 5]

      for (const columns of testColumns) {
        const data = {
          enabled: true,
          layout: 'masonry',
          columns,
          showParticipantName: true,
          refreshInterval: 10,
        }

        const result = publicDisplayConfigSchema.safeParse(data)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('auto-scroll validation', () => {
    it('should require autoScrollSpeed when autoScroll is enabled for non-carousel', () => {
      const data = {
        enabled: true,
        layout: 'masonry',
        columns: 3,
        autoScroll: true,
        showParticipantName: true,
        refreshInterval: 10,
      }

      const result = publicDisplayConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('vitesse')
      }
    })

    it('should accept autoScroll with valid speed', () => {
      const speeds = ['slow', 'medium', 'fast'] as const

      for (const speed of speeds) {
        const data = {
          enabled: true,
          layout: 'masonry',
          columns: 3,
          autoScroll: true,
          autoScrollSpeed: speed,
          showParticipantName: true,
          refreshInterval: 10,
        }

        const result = publicDisplayConfigSchema.safeParse(data)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('refreshInterval validation', () => {
    it('should reject interval less than 5 seconds', () => {
      const data = {
        enabled: true,
        layout: 'carousel',
        showParticipantName: true,
        refreshInterval: 4,
      }

      const result = publicDisplayConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('Minimum 5'))).toBe(true)
      }
    })

    it('should reject interval greater than 60 seconds', () => {
      const data = {
        enabled: true,
        layout: 'carousel',
        showParticipantName: true,
        refreshInterval: 61,
      }

      const result = publicDisplayConfigSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('Maximum 60'))).toBe(true)
      }
    })

    it('should accept interval between 5 and 60 seconds', () => {
      const intervals = [5, 10, 30, 60]

      for (const refreshInterval of intervals) {
        const data = {
          enabled: true,
          layout: 'carousel',
          showParticipantName: true,
          refreshInterval,
        }

        const result = publicDisplayConfigSchema.safeParse(data)
        expect(result.success).toBe(true)
      }
    })
  })
})

describe('step6Schema', () => {
  it('should wrap publicDisplayConfig correctly', () => {
    const data = {
      publicDisplayConfig: {
        enabled: true,
        layout: 'masonry',
        columns: 3,
        autoScroll: true,
        autoScrollSpeed: 'medium',
        showParticipantName: true,
        refreshInterval: 10,
      },
    }

    const result = step6Schema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('should reject missing publicDisplayConfig', () => {
    const data = {}

    const result = step6Schema.safeParse(data)
    expect(result.success).toBe(false)
  })
})
