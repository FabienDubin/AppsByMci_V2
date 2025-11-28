import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/animations/[id]/route'
import { animationService } from '@/lib/services/animation.service'
import * as authModule from '@/lib/auth'

// Mocks
jest.mock('@/lib/services/animation.service')
jest.mock('@/lib/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))
jest.mock('@/lib/auth')

const mockAnimationService = animationService as jest.Mocked<typeof animationService>
const mockAuth = authModule as jest.Mocked<typeof authModule>

// Request factory
function createMockRequest(body: object, token?: string): NextRequest {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return new NextRequest('http://localhost:3000/api/animations/animation-123', {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
}

describe('PUT /api/animations/[id]', () => {
  const validToken = 'valid-jwt-token'
  const mockUser = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'admin',
  }
  const animationId = 'animation-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authentication', () => {
    it('should return 401 if no token provided', async () => {
      const request = createMockRequest({
        name: 'Updated Name',
      })

      const response = await PUT(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1001')
    })

    it('should return 401 if token is invalid', async () => {
      mockAuth.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const request = createMockRequest(
        {
          name: 'Updated Name',
        },
        'invalid-token'
      )

      const response = await PUT(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1001')
    })
  })

  describe('validation', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
    })

    it('should return VALIDATION_ERROR for invalid slug format', async () => {
      const request = createMockRequest(
        {
          slug: 'Invalid Slug!',
        },
        validToken
      )

      const response = await PUT(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('success', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
    })

    it('should update animation successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
      }

      const mockUpdatedAnimation = {
        _id: animationId,
        userId: mockUser.userId,
        name: updateData.name,
        description: updateData.description,
        slug: 'original-slug',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockResponse = {
        id: animationId,
        ...mockUpdatedAnimation,
      }

      mockAnimationService.updateAnimation.mockResolvedValue(mockUpdatedAnimation as any)
      mockAnimationService.toAnimationResponse.mockReturnValue(mockResponse as any)

      const request = createMockRequest(updateData, validToken)

      const response = await PUT(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: animationId,
        name: updateData.name,
        description: updateData.description,
        slug: 'original-slug',
        status: 'draft',
      })
      expect(mockAnimationService.updateAnimation).toHaveBeenCalledWith(
        animationId,
        mockUser.userId,
        updateData
      )
    })

    it('should update slug successfully', async () => {
      const updateData = {
        slug: 'new-slug',
      }

      const mockUpdatedAnimation = {
        _id: animationId,
        userId: mockUser.userId,
        name: 'Test Animation',
        slug: updateData.slug,
        status: 'draft',
      }

      mockAnimationService.updateAnimation.mockResolvedValue(mockUpdatedAnimation as any)
      mockAnimationService.toAnimationResponse.mockReturnValue(mockUpdatedAnimation as any)

      const request = createMockRequest(updateData, validToken)

      const response = await PUT(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockAnimationService.updateAnimation).toHaveBeenCalledWith(
        animationId,
        mockUser.userId,
        updateData
      )
    })
  })

  describe('errors', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
    })

    it('should return 403 if user does not own animation (AUTH_1003)', async () => {
      const updateData = {
        name: 'Updated Name',
      }

      const error = new Error('Accès refusé à cette animation')
      ;(error as any).code = 'AUTH_1003'
      mockAnimationService.updateAnimation.mockRejectedValue(error)

      const request = createMockRequest(updateData, validToken)

      const response = await PUT(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1003')
      expect(data.error.message).toBe('Accès refusé à cette animation')
    })

    it('should return 404 if animation not found (NOT_FOUND_3001)', async () => {
      const updateData = {
        name: 'Updated Name',
      }

      const error = new Error('Animation introuvable')
      ;(error as any).code = 'NOT_FOUND_3001'
      mockAnimationService.updateAnimation.mockRejectedValue(error)

      const request = createMockRequest(updateData, validToken)

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND_3001')
      expect(data.error.message).toBe('Animation introuvable')
    })

    it('should return 400 if slug already exists (VALIDATION_2002)', async () => {
      const updateData = {
        slug: 'existing-slug',
      }

      const error = new Error('Ce slug existe déjà')
      ;(error as any).code = 'VALIDATION_2002'
      mockAnimationService.updateAnimation.mockRejectedValue(error)

      const request = createMockRequest(updateData, validToken)

      const response = await PUT(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_2002')
      expect(data.error.message).toBe('Ce slug existe déjà')
    })

    it('should return INTERNAL_3000 for unexpected errors', async () => {
      const updateData = {
        name: 'Updated Name',
      }

      mockAnimationService.updateAnimation.mockRejectedValue(new Error('Unexpected error'))

      const request = createMockRequest(updateData, validToken)

      const response = await PUT(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_3000')
    })
  })
})
