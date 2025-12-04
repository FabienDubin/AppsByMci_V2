// Tests for GET /api/generations/[id] API route
import { GET } from '@/app/api/generations/[id]/route'
import { NextRequest } from 'next/server'
import mongoose from 'mongoose'

// Mock dependencies
jest.mock('@/lib/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

jest.mock('@/models/Generation.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}))

jest.mock('@/lib/blob-storage', () => ({
  blobStorageService: {
    getResultSasUrl: jest.fn().mockResolvedValue('https://example.com/result.png?sas=token'),
  },
}))

jest.mock('@/lib/services/animation.service', () => ({
  animationService: {
    incrementStats: jest.fn().mockResolvedValue(undefined),
  },
}))

import Generation from '@/models/Generation.model'
import { blobStorageService } from '@/lib/blob-storage'
import { animationService } from '@/lib/services/animation.service'

describe('GET /api/generations/[id]', () => {
  const validObjectId = new mongoose.Types.ObjectId().toString()
  const mockRequest = new NextRequest('http://localhost/api/generations/' + validObjectId)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 for invalid ObjectId', async () => {
    const response = await GET(mockRequest, {
      params: Promise.resolve({ id: 'invalid-id' }),
    })

    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('GEN_4004')
  })

  it('should return 404 if generation not found', async () => {
    ;(Generation.findById as jest.Mock).mockResolvedValue(null)

    const response = await GET(mockRequest, {
      params: Promise.resolve({ id: validObjectId }),
    })

    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('GEN_4003')
  })

  it('should return processing status correctly', async () => {
    ;(Generation.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(validObjectId),
      animationId: new mongoose.Types.ObjectId(),
      status: 'processing',
      generatedImageUrl: null,
      error: null,
      statsRecorded: false,
    })

    const response = await GET(mockRequest, {
      params: Promise.resolve({ id: validObjectId }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('processing')
    expect(data.data.resultUrl).toBeUndefined()
  })

  it('should return completed status with SAS URL', async () => {
    const animationId = new mongoose.Types.ObjectId()
    ;(Generation.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(validObjectId),
      animationId,
      status: 'completed',
      generatedImageUrl: 'https://blob.azure.net/generated-images/results/123.png',
      error: null,
      statsRecorded: false,
    })

    const response = await GET(mockRequest, {
      params: Promise.resolve({ id: validObjectId }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('completed')
    expect(data.data.resultUrl).toBe('https://example.com/result.png?sas=token')
    expect(blobStorageService.getResultSasUrl).toHaveBeenCalledWith(validObjectId, 60)
  })

  it('should return failed status with error details', async () => {
    const animationId = new mongoose.Types.ObjectId()
    ;(Generation.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(validObjectId),
      animationId,
      status: 'failed',
      generatedImageUrl: null,
      error: JSON.stringify({ code: 'GEN_5003', message: 'API error' }),
      statsRecorded: false,
    })

    const response = await GET(mockRequest, {
      params: Promise.resolve({ id: validObjectId }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('failed')
    expect(data.data.error.code).toBe('GEN_5003')
    expect(data.data.error.message).toBe('API error')
  })

  it('should handle non-JSON error strings gracefully', async () => {
    const animationId = new mongoose.Types.ObjectId()
    ;(Generation.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(validObjectId),
      animationId,
      status: 'failed',
      generatedImageUrl: null,
      error: 'Plain text error message',
      statsRecorded: false,
    })

    const response = await GET(mockRequest, {
      params: Promise.resolve({ id: validObjectId }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.error.code).toBe('GEN_5001')
    expect(data.data.error.message).toBe('Plain text error message')
  })

  it('should fallback to raw URL if SAS generation fails', async () => {
    const rawUrl = 'https://blob.azure.net/generated-images/results/123.png'
    const animationId = new mongoose.Types.ObjectId()
    ;(Generation.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(validObjectId),
      animationId,
      status: 'completed',
      generatedImageUrl: rawUrl,
      error: null,
      statsRecorded: true, // Already recorded, so no increment call
    })
    ;(blobStorageService.getResultSasUrl as jest.Mock).mockRejectedValue(
      new Error('SAS generation failed')
    )

    const response = await GET(mockRequest, {
      params: Promise.resolve({ id: validObjectId }),
    })

    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.resultUrl).toBe(rawUrl)
  })

  it('should call incrementStats with success for completed generation', async () => {
    const animationId = new mongoose.Types.ObjectId()
    ;(Generation.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(validObjectId),
      animationId,
      status: 'completed',
      generatedImageUrl: 'https://blob.azure.net/generated-images/results/123.png',
      error: null,
      statsRecorded: false,
    })

    const response = await GET(mockRequest, {
      params: Promise.resolve({ id: validObjectId }),
    })

    expect(response.status).toBe(200)
    expect(animationService.incrementStats).toHaveBeenCalledWith(animationId.toString(), 'success')
    expect(Generation.findByIdAndUpdate).toHaveBeenCalledWith(validObjectId, { statsRecorded: true })
  })

  it('should call incrementStats with failure for failed generation', async () => {
    const animationId = new mongoose.Types.ObjectId()
    ;(Generation.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(validObjectId),
      animationId,
      status: 'failed',
      generatedImageUrl: null,
      error: JSON.stringify({ code: 'GEN_5003', message: 'API error' }),
      statsRecorded: false,
    })

    const response = await GET(mockRequest, {
      params: Promise.resolve({ id: validObjectId }),
    })

    expect(response.status).toBe(200)
    expect(animationService.incrementStats).toHaveBeenCalledWith(animationId.toString(), 'failure')
    expect(Generation.findByIdAndUpdate).toHaveBeenCalledWith(validObjectId, { statsRecorded: true })
  })

  it('should NOT call incrementStats when statsRecorded is true (idempotency)', async () => {
    const animationId = new mongoose.Types.ObjectId()
    ;(Generation.findById as jest.Mock).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(validObjectId),
      animationId,
      status: 'completed',
      generatedImageUrl: 'https://blob.azure.net/generated-images/results/123.png',
      error: null,
      statsRecorded: true,
    })

    const response = await GET(mockRequest, {
      params: Promise.resolve({ id: validObjectId }),
    })

    expect(response.status).toBe(200)
    expect(animationService.incrementStats).not.toHaveBeenCalled()
    expect(Generation.findByIdAndUpdate).not.toHaveBeenCalled()
  })
})
