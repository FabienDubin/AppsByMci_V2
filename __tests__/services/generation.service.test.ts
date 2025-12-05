/**
 * @jest-environment node
 */

// Mock database connection
jest.mock('@/lib/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}))

// Mock Generation model
const mockCreate = jest.fn()
const mockFindById = jest.fn()
const mockFindByIdAndUpdate = jest.fn()
const mockAggregate = jest.fn()

jest.mock('@/models/Generation.model', () => ({
  __esModule: true,
  default: {
    create: mockCreate,
    findById: mockFindById,
    findByIdAndUpdate: mockFindByIdAndUpdate,
    aggregate: mockAggregate,
  },
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

import { generationService } from '@/lib/services/generation.service'
import mongoose from 'mongoose'

describe('GenerationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createGeneration', () => {
    const validInput = {
      animationId: '507f1f77bcf86cd799439011',
      participantData: {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@company.com',
        answers: [
          { elementId: 'q1', type: 'choice' as const, value: 'Option A' },
        ],
      },
    }

    it('should create a generation document with pending status', async () => {
      const mockGeneration = {
        _id: new mongoose.Types.ObjectId(),
        ...validInput,
        status: 'pending',
        createdAt: new Date(),
      }

      mockCreate.mockResolvedValue(mockGeneration)

      const result = await generationService.createGeneration(validInput)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          animationId: expect.any(mongoose.Types.ObjectId),
          participantData: validInput.participantData,
          status: 'pending',
        })
      )
      expect(result).toEqual(mockGeneration)
    })

    it('should create generation with selfieUrl when provided', async () => {
      const inputWithSelfie = {
        ...validInput,
        selfieUrl: 'https://blob.azure.net/selfies/gen-123.jpg',
      }

      const mockGeneration = {
        _id: new mongoose.Types.ObjectId(),
        ...inputWithSelfie,
        status: 'pending',
      }

      mockCreate.mockResolvedValue(mockGeneration)

      await generationService.createGeneration(inputWithSelfie)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          selfieUrl: inputWithSelfie.selfieUrl,
        })
      )
    })

    it('should throw error for invalid animation ID format', async () => {
      const invalidInput = {
        ...validInput,
        animationId: 'invalid-id',
      }

      await expect(
        generationService.createGeneration(invalidInput)
      ).rejects.toThrow('Invalid animation ID format')
    })
  })

  describe('getGenerationById', () => {
    it('should return generation when found', async () => {
      const mockGeneration = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        status: 'pending',
      }

      mockFindById.mockResolvedValue(mockGeneration)

      const result = await generationService.getGenerationById(
        '507f1f77bcf86cd799439011'
      )

      expect(result).toEqual(mockGeneration)
      expect(mockFindById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
    })

    it('should return null when generation not found', async () => {
      mockFindById.mockResolvedValue(null)

      const result = await generationService.getGenerationById(
        '507f1f77bcf86cd799439011'
      )

      expect(result).toBeNull()
    })

    it('should return null for invalid ID format', async () => {
      const result = await generationService.getGenerationById('invalid-id')

      expect(result).toBeNull()
      expect(mockFindById).not.toHaveBeenCalled()
    })
  })

  describe('updateGenerationStatus', () => {
    it('should update status to processing', async () => {
      const mockGeneration = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        status: 'processing',
      }

      mockFindByIdAndUpdate.mockResolvedValue(mockGeneration)

      const result = await generationService.updateGenerationStatus(
        '507f1f77bcf86cd799439011',
        'processing'
      )

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: 'processing' },
        { new: true }
      )
      expect(result?.status).toBe('processing')
    })

    it('should update status to completed', async () => {
      const mockGeneration = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        status: 'completed',
      }

      mockFindByIdAndUpdate.mockResolvedValue(mockGeneration)

      const result = await generationService.updateGenerationStatus(
        '507f1f77bcf86cd799439011',
        'completed'
      )

      expect(result?.status).toBe('completed')
    })

    it('should update status to failed with error message', async () => {
      const mockGeneration = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        status: 'failed',
        error: 'AI processing failed',
      }

      mockFindByIdAndUpdate.mockResolvedValue(mockGeneration)

      const result = await generationService.updateGenerationStatus(
        '507f1f77bcf86cd799439011',
        'failed',
        'AI processing failed'
      )

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: 'failed', error: 'AI processing failed' },
        { new: true }
      )
      expect(result?.error).toBe('AI processing failed')
    })

    it('should return null for invalid ID format', async () => {
      const result = await generationService.updateGenerationStatus(
        'invalid-id',
        'completed'
      )

      expect(result).toBeNull()
      expect(mockFindByIdAndUpdate).not.toHaveBeenCalled()
    })

    it('should return null when generation not found', async () => {
      mockFindByIdAndUpdate.mockResolvedValue(null)

      const result = await generationService.updateGenerationStatus(
        '507f1f77bcf86cd799439011',
        'completed'
      )

      expect(result).toBeNull()
    })
  })

  describe('getAnimationStats', () => {
    const animationId1 = '507f1f77bcf86cd799439011'
    const animationId2 = '507f1f77bcf86cd799439012'

    it('should return stats for animations with generations', async () => {
      const lastActivityDate = new Date('2025-12-05T10:00:00Z')
      mockAggregate.mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(animationId1),
          participationCount: 42,
          lastActivity: lastActivityDate,
        },
      ])

      const result = await generationService.getAnimationStats([animationId1])

      expect(mockAggregate).toHaveBeenCalled()
      expect(result.get(animationId1)).toEqual({
        participationCount: 42,
        lastActivity: lastActivityDate,
      })
    })

    it('should return zero stats for animations without generations', async () => {
      mockAggregate.mockResolvedValue([])

      const result = await generationService.getAnimationStats([animationId1])

      expect(result.get(animationId1)).toEqual({
        participationCount: 0,
        lastActivity: null,
      })
    })

    it('should handle multiple animation IDs', async () => {
      const lastActivityDate1 = new Date('2025-12-05T10:00:00Z')
      const lastActivityDate2 = new Date('2025-12-04T15:00:00Z')

      mockAggregate.mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(animationId1),
          participationCount: 10,
          lastActivity: lastActivityDate1,
        },
        {
          _id: new mongoose.Types.ObjectId(animationId2),
          participationCount: 5,
          lastActivity: lastActivityDate2,
        },
      ])

      const result = await generationService.getAnimationStats([animationId1, animationId2])

      expect(result.get(animationId1)).toEqual({
        participationCount: 10,
        lastActivity: lastActivityDate1,
      })
      expect(result.get(animationId2)).toEqual({
        participationCount: 5,
        lastActivity: lastActivityDate2,
      })
    })

    it('should return empty map for empty animation IDs array', async () => {
      const result = await generationService.getAnimationStats([])

      expect(mockAggregate).not.toHaveBeenCalled()
      expect(result.size).toBe(0)
    })

    it('should filter out invalid animation IDs', async () => {
      mockAggregate.mockResolvedValue([])

      const result = await generationService.getAnimationStats(['invalid-id', animationId1])

      // Should still call aggregate with the valid ID
      expect(mockAggregate).toHaveBeenCalled()
      expect(result.get(animationId1)).toEqual({
        participationCount: 0,
        lastActivity: null,
      })
    })

    it('should return empty map when all IDs are invalid', async () => {
      const result = await generationService.getAnimationStats(['invalid-1', 'invalid-2'])

      expect(mockAggregate).not.toHaveBeenCalled()
      expect(result.size).toBe(0)
    })
  })

  describe('getAnimationDetailStats', () => {
    const animationId = '507f1f77bcf86cd799439011'

    it('should return detailed stats for animation with generations', async () => {
      mockAggregate.mockResolvedValue([
        {
          _id: null,
          totalParticipations: 100,
          successfulGenerations: 85,
          failedGenerations: 10,
          avgGenerationTime: 15.5,
          emailsSent: 75,
        },
      ])

      const result = await generationService.getAnimationDetailStats(animationId)

      expect(mockAggregate).toHaveBeenCalled()
      expect(result).toEqual({
        totalParticipations: 100,
        successfulGenerations: 85,
        failedGenerations: 10,
        successRate: 85,
        averageGenerationTime: 16, // Rounded
        emailsSent: 75,
      })
    })

    it('should return zero stats for animation without generations', async () => {
      mockAggregate.mockResolvedValue([])

      const result = await generationService.getAnimationDetailStats(animationId)

      expect(result).toEqual({
        totalParticipations: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        successRate: 0,
        averageGenerationTime: 0,
        emailsSent: 0,
      })
    })

    it('should return zero stats for invalid animation ID', async () => {
      const result = await generationService.getAnimationDetailStats('invalid-id')

      expect(mockAggregate).not.toHaveBeenCalled()
      expect(result).toEqual({
        totalParticipations: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        successRate: 0,
        averageGenerationTime: 0,
        emailsSent: 0,
      })
    })

    it('should calculate success rate correctly', async () => {
      mockAggregate.mockResolvedValue([
        {
          _id: null,
          totalParticipations: 200,
          successfulGenerations: 150,
          failedGenerations: 50,
          avgGenerationTime: 10,
          emailsSent: 100,
        },
      ])

      const result = await generationService.getAnimationDetailStats(animationId)

      expect(result.successRate).toBe(75) // 150/200 * 100 = 75%
    })

    it('should handle null avgGenerationTime', async () => {
      mockAggregate.mockResolvedValue([
        {
          _id: null,
          totalParticipations: 5,
          successfulGenerations: 0,
          failedGenerations: 5,
          avgGenerationTime: null,
          emailsSent: 0,
        },
      ])

      const result = await generationService.getAnimationDetailStats(animationId)

      expect(result.averageGenerationTime).toBe(0)
    })
  })

  describe('getAnimationTimeline', () => {
    const animationId = '507f1f77bcf86cd799439011'

    it('should return timeline data grouped by date', async () => {
      mockAggregate.mockResolvedValue([
        { _id: '2025-12-03', count: 10 },
        { _id: '2025-12-04', count: 15 },
        { _id: '2025-12-05', count: 8 },
      ])

      const result = await generationService.getAnimationTimeline(animationId, '30d')

      expect(mockAggregate).toHaveBeenCalled()
      expect(result).toEqual({
        period: '30d',
        data: [
          { date: '2025-12-03', count: 10 },
          { date: '2025-12-04', count: 15 },
          { date: '2025-12-05', count: 8 },
        ],
      })
    })

    it('should return empty data for animation without generations', async () => {
      mockAggregate.mockResolvedValue([])

      const result = await generationService.getAnimationTimeline(animationId, '7d')

      expect(result).toEqual({
        period: '7d',
        data: [],
      })
    })

    it('should use default period of 30d', async () => {
      mockAggregate.mockResolvedValue([])

      const result = await generationService.getAnimationTimeline(animationId)

      expect(result.period).toBe('30d')
    })

    it('should return empty data for invalid animation ID', async () => {
      const result = await generationService.getAnimationTimeline('invalid-id', '30d')

      expect(mockAggregate).not.toHaveBeenCalled()
      expect(result).toEqual({
        period: '30d',
        data: [],
      })
    })

    it('should handle all period without date filter', async () => {
      mockAggregate.mockResolvedValue([
        { _id: '2025-11-01', count: 5 },
        { _id: '2025-12-05', count: 20 },
      ])

      const result = await generationService.getAnimationTimeline(animationId, 'all')

      expect(result.period).toBe('all')
      expect(result.data).toHaveLength(2)
    })
  })
})
