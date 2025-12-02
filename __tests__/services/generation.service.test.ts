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

jest.mock('@/models/Generation.model', () => ({
  __esModule: true,
  default: {
    create: mockCreate,
    findById: mockFindById,
    findByIdAndUpdate: mockFindByIdAndUpdate,
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
})
