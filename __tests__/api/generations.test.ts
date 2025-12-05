/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// Mock mongoose
jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    Types: {
      ObjectId: {
        isValid: jest.fn(),
      },
    },
    models: {},
    model: jest.fn(),
  },
  Types: {
    ObjectId: jest.fn(),
  },
}))

// Mock database connection
jest.mock('@/lib/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}))

// Mock Animation model
const mockAnimation = {
  findById: jest.fn(),
}

jest.mock('@/models/Animation.model', () => ({
  __esModule: true,
  default: mockAnimation,
}))

// Mock generation service
const mockGenerationService = {
  createGeneration: jest.fn(),
  getGenerationById: jest.fn(),
}

jest.mock('@/lib/services/generation.service', () => ({
  generationService: mockGenerationService,
}))

// Mock blob storage service
const mockBlobStorageService = {
  uploadSelfie: jest.fn(),
}

jest.mock('@/lib/blob-storage', () => ({
  blobStorageService: mockBlobStorageService,
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  checkGenerationRateLimit: jest.fn().mockReturnValue({ allowed: true, remaining: 5 }),
  recordGenerationSubmission: jest.fn(),
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

// Mock pipeline orchestrator service
jest.mock('@/lib/services/pipeline-orchestrator.service', () => ({
  runPipelineForGeneration: jest.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/generations/route'
import { checkGenerationRateLimit, recordGenerationSubmission } from '@/lib/rate-limit'
import mongoose from 'mongoose'

function createRequest(body: object, ip = '127.0.0.1'): NextRequest {
  const request = new NextRequest('http://localhost/api/generations', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
  })
  return request
}

describe('POST /api/generations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true)
    ;(checkGenerationRateLimit as jest.Mock).mockReturnValue({ allowed: true, remaining: 5 })
    // Default mock for getGenerationById - returns the created generation
    mockGenerationService.getGenerationById.mockResolvedValue({
      _id: { toString: () => 'gen-123' },
      participantData: {},
      selfieUrl: null,
    })
  })

  describe('Rate limiting (AC5)', () => {
    it('should return 429 when rate limit exceeded', async () => {
      ;(checkGenerationRateLimit as jest.Mock).mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(),
      })

      const request = createRequest({
        animationId: '507f1f77bcf86cd799439011',
        formData: { answers: [] },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('GEN_4001')
      expect(data.error.message).toContain('Trop de tentatives')
    })

    it('should allow request when rate limit not exceeded', async () => {
      mockAnimation.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        status: 'published',
        baseFields: {},
      })

      mockGenerationService.createGeneration.mockResolvedValue({
        _id: { toString: () => 'gen-123' },
        updateOne: jest.fn().mockResolvedValue({}),
      })

      const request = createRequest({
        animationId: '507f1f77bcf86cd799439011',
        formData: { answers: [] },
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(recordGenerationSubmission).toHaveBeenCalled()
    })
  })

  describe('Request validation (AC3, AC10)', () => {
    it('should return 400 for invalid JSON body', async () => {
      const request = new NextRequest('http://localhost/api/generations', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('GEN_4002')
    })

    it('should return 400 for missing animationId', async () => {
      const request = createRequest({
        formData: { answers: [] },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('GEN_4002')
    })

    it('should return 400 for invalid email format', async () => {
      ;(mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true)

      mockAnimation.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        status: 'published',
        baseFields: {
          email: { enabled: true, required: true },
        },
      })

      const request = createRequest({
        animationId: '507f1f77bcf86cd799439011',
        formData: {
          email: 'invalid-email',
          answers: [],
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('GEN_4002')
    })
  })

  describe('Animation validation (AC4, AC11)', () => {
    it('should return 404 for invalid animation ID format', async () => {
      ;(mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false)

      const request = createRequest({
        animationId: 'invalid-id',
        formData: { answers: [] },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('GEN_4003')
    })

    it('should return 404 when animation not found', async () => {
      mockAnimation.findById.mockResolvedValue(null)

      const request = createRequest({
        animationId: '507f1f77bcf86cd799439011',
        formData: { answers: [] },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('GEN_4003')
    })

    it('should return 404 when animation is not published', async () => {
      mockAnimation.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        status: 'draft', // Not published
        baseFields: {},
      })

      const request = createRequest({
        animationId: '507f1f77bcf86cd799439011',
        formData: { answers: [] },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('GEN_4003')
    })
  })

  describe('Required fields validation', () => {
    it('should return 400 when required nom is missing', async () => {
      mockAnimation.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        status: 'published',
        baseFields: {
          name: { enabled: true, required: true },
        },
      })

      const request = createRequest({
        animationId: '507f1f77bcf86cd799439011',
        formData: { answers: [] },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('GEN_4002')
      expect(data.error.details).toContain('Le champ nom est requis')
    })

    it('should return 400 when required email is missing', async () => {
      mockAnimation.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        status: 'published',
        baseFields: {
          email: { enabled: true, required: true },
        },
      })

      const request = createRequest({
        animationId: '507f1f77bcf86cd799439011',
        formData: { answers: [] },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.details).toContain('Le champ email est requis')
    })
  })

  describe('Successful generation (AC7, AC8)', () => {
    beforeEach(() => {
      mockAnimation.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        status: 'published',
        baseFields: {},
      })

      mockGenerationService.createGeneration.mockResolvedValue({
        _id: { toString: () => 'gen-abc123' },
        status: 'pending',
        updateOne: jest.fn().mockResolvedValue({}),
      })
    })

    it('should return 201 with generationId on success', async () => {
      const request = createRequest({
        animationId: '507f1f77bcf86cd799439011',
        formData: {
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean@company.com',
          answers: [
            { elementId: 'q1', type: 'choice', value: 'Option A' },
          ],
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.generationId).toBe('gen-abc123')
      expect(data.data.status).toBe('pending')
    })

    it('should call createGeneration with correct data', async () => {
      const request = createRequest({
        animationId: '507f1f77bcf86cd799439011',
        formData: {
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean@company.com',
          answers: [
            { elementId: 'q1', type: 'choice', value: 'Option A' },
          ],
        },
      })

      await POST(request)

      expect(mockGenerationService.createGeneration).toHaveBeenCalledWith({
        animationId: '507f1f77bcf86cd799439011',
        participantData: {
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean@company.com',
          answers: [
            { elementId: 'q1', type: 'choice', value: 'Option A' },
          ],
        },
      })
    })
  })

  describe('Selfie upload (AC6)', () => {
    beforeEach(() => {
      mockAnimation.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        status: 'published',
        baseFields: {},
      })

      const mockGeneration = {
        _id: { toString: () => 'gen-abc123' },
        status: 'pending',
        updateOne: jest.fn().mockResolvedValue({}),
      }

      mockGenerationService.createGeneration.mockResolvedValue(mockGeneration)
      mockBlobStorageService.uploadSelfie.mockResolvedValue('https://blob.azure.net/selfies/gen-abc123.jpg')
    })

    it('should upload selfie when provided', async () => {
      const selfieBase64 = 'data:image/jpeg;base64,/9j/4AAQ...'

      const request = createRequest({
        animationId: '507f1f77bcf86cd799439011',
        formData: { answers: [] },
        selfie: selfieBase64,
      })

      await POST(request)

      expect(mockBlobStorageService.uploadSelfie).toHaveBeenCalledWith(
        selfieBase64,
        'gen-abc123'
      )
    })

    it('should continue without selfie on upload error', async () => {
      mockBlobStorageService.uploadSelfie.mockRejectedValue(new Error('Upload failed'))

      const request = createRequest({
        animationId: '507f1f77bcf86cd799439011',
        formData: { answers: [] },
        selfie: 'data:image/jpeg;base64,/9j/4AAQ...',
      })

      const response = await POST(request)
      const data = await response.json()

      // Should still succeed
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })
  })

  describe('IP extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      mockAnimation.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        status: 'published',
        baseFields: {},
      })

      mockGenerationService.createGeneration.mockResolvedValue({
        _id: { toString: () => 'gen-123' },
        updateOne: jest.fn().mockResolvedValue({}),
      })

      const request = createRequest(
        {
          animationId: '507f1f77bcf86cd799439011',
          formData: { answers: [] },
        },
        '192.168.1.100'
      )

      await POST(request)

      expect(checkGenerationRateLimit).toHaveBeenCalledWith('192.168.1.100')
      expect(recordGenerationSubmission).toHaveBeenCalledWith('192.168.1.100')
    })
  })
})
