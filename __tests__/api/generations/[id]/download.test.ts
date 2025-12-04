// Tests for GET /api/generations/[id]/download API route
import { GET } from '@/app/api/generations/[id]/download/route'
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
  },
}))

jest.mock('@/models/Animation.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}))

jest.mock('@/lib/services/blob', () => ({
  blobCoreService: {
    downloadFile: jest.fn(),
  },
  CONTAINERS: {
    GENERATED_IMAGES: 'generated-images',
  },
}))

import Generation from '@/models/Generation.model'
import Animation from '@/models/Animation.model'
import { blobCoreService } from '@/lib/services/blob'

const mockDownloadFile = blobCoreService.downloadFile as jest.Mock

describe('GET /api/generations/[id]/download', () => {
  const validObjectId = new mongoose.Types.ObjectId().toString()
  const mockRequest = new NextRequest(
    'http://localhost/api/generations/' + validObjectId + '/download'
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Validation', () => {
    it('should return 400 for invalid ObjectId', async () => {
      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: 'invalid-id' }),
      })

      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('GEN_4004')
      expect(data.error.message).toBe('ID de génération invalide')
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
      expect(data.error.message).toBe('Génération non trouvée')
    })

    it('should return 400 if generation is not completed', async () => {
      ;(Generation.findById as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(validObjectId),
        status: 'processing',
        animationId: new mongoose.Types.ObjectId(),
      })

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: validObjectId }),
      })

      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('GEN_4005')
      expect(data.error.message).toBe("La génération n'est pas terminée")
    })
  })

  describe('Successful download', () => {
    const mockAnimationId = new mongoose.Types.ObjectId()
    const mockImageBuffer = Buffer.from('fake-png-data')

    beforeEach(() => {
      ;(Generation.findById as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(validObjectId),
        status: 'completed',
        animationId: mockAnimationId,
      })
      mockDownloadFile.mockResolvedValue(mockImageBuffer)
    })

    it('should download image with correct filename from animation slug', async () => {
      ;(Animation.findById as jest.Mock).mockResolvedValue({
        _id: mockAnimationId,
        slug: 'test-animation',
      })

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: validObjectId }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('image/png')
      expect(response.headers.get('Content-Disposition')).toMatch(
        /attachment; filename="test-animation-\d+\.png"/
      )
      expect(response.headers.get('Content-Length')).toBe(mockImageBuffer.length.toString())
    })

    it('should use "generation" as fallback slug when animation not found', async () => {
      ;(Animation.findById as jest.Mock).mockResolvedValue(null)

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: validObjectId }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Disposition')).toMatch(
        /attachment; filename="generation-\d+\.png"/
      )
    })

    it('should set correct cache control headers', async () => {
      ;(Animation.findById as jest.Mock).mockResolvedValue({
        _id: mockAnimationId,
        slug: 'test-animation',
      })

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: validObjectId }),
      })

      expect(response.headers.get('Cache-Control')).toBe('private, no-cache')
    })

    it('should download from correct blob path', async () => {
      ;(Animation.findById as jest.Mock).mockResolvedValue({
        _id: mockAnimationId,
        slug: 'test-animation',
      })

      await GET(mockRequest, {
        params: Promise.resolve({ id: validObjectId }),
      })

      expect(mockDownloadFile).toHaveBeenCalledWith(
        'generated-images',
        `results/${validObjectId}.png`
      )
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      ;(Generation.findById as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(validObjectId),
        status: 'completed',
        animationId: new mongoose.Types.ObjectId(),
      })
    })

    it('should return 404 if image blob not found', async () => {
      ;(Animation.findById as jest.Mock).mockResolvedValue({
        slug: 'test-animation',
      })
      mockDownloadFile.mockRejectedValue(new Error('Blob not found'))

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: validObjectId }),
      })

      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('GEN_4006')
      expect(data.error.message).toBe('Image non trouvée')
    })

    it('should return 500 for unexpected errors', async () => {
      ;(Animation.findById as jest.Mock).mockResolvedValue({
        slug: 'test-animation',
      })
      mockDownloadFile.mockRejectedValue(new Error('Storage service unavailable'))

      // We need to make the error NOT contain "not found" to trigger the 500 path
      mockDownloadFile.mockRejectedValue(new Error('Storage service unavailable'))

      const response = await GET(mockRequest, {
        params: Promise.resolve({ id: validObjectId }),
      })

      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error.code).toBe('GEN_5001')
    })
  })
})
