import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/animations/route'
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
jest.mock('@/lib/rate-limit', () => ({
  checkAnimationCreationRateLimit: jest.fn(),
  recordAnimationCreation: jest.fn(),
}))

const mockAnimationService = animationService as jest.Mocked<typeof animationService>
const mockAuth = authModule as jest.Mocked<typeof authModule>

// Import mocked rate limit functions
const { checkAnimationCreationRateLimit, recordAnimationCreation } = require('@/lib/rate-limit')

// Request factory
function createMockRequest(body: object, token?: string): NextRequest {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return new NextRequest('http://localhost:3000/api/animations', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('POST /api/animations', () => {
  const validToken = 'valid-jwt-token'
  const mockUser = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'admin',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authentication', () => {
    it('should return 401 if no token provided', async () => {
      const request = createMockRequest({
        name: 'Test Animation',
        slug: 'test-animation',
      })

      const response = await POST(request)
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
          name: 'Test Animation',
          slug: 'test-animation',
        },
        'invalid-token'
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1001')
    })
  })

  describe('validation', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
      checkAnimationCreationRateLimit.mockReturnValue({
        allowed: true,
        remaining: 10,
      })
    })

    it('should return VALIDATION_ERROR if name is missing', async () => {
      const request = createMockRequest(
        {
          slug: 'test-animation',
        },
        validToken
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return VALIDATION_ERROR if slug is missing', async () => {
      const request = createMockRequest(
        {
          name: 'Test Animation',
        },
        validToken
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return VALIDATION_ERROR if slug is invalid (not kebab-case)', async () => {
      const request = createMockRequest(
        {
          name: 'Test Animation',
          slug: 'Invalid Slug!',
        },
        validToken
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('success', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
      checkAnimationCreationRateLimit.mockReturnValue({
        allowed: true,
        remaining: 10,
      })
    })

    it('should create animation draft successfully', async () => {
      const requestData = {
        name: 'Test Animation',
        description: 'Test description',
        slug: 'test-animation',
      }

      const mockCreatedAnimation = {
        _id: 'animation-123',
        userId: mockUser.userId,
        ...requestData,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockResponse = {
        id: 'animation-123',
        ...requestData,
        status: 'draft',
        createdAt: mockCreatedAnimation.createdAt.toISOString(),
        updatedAt: mockCreatedAnimation.updatedAt.toISOString(),
      }

      mockAnimationService.createDraft.mockResolvedValue(mockCreatedAnimation as any)
      mockAnimationService.toAnimationResponse.mockReturnValue(mockResponse as any)

      const request = createMockRequest(requestData, validToken)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: 'animation-123',
        name: requestData.name,
        slug: requestData.slug,
        description: requestData.description,
        status: 'draft',
      })
      expect(mockAnimationService.createDraft).toHaveBeenCalledWith(
        mockUser.userId,
        requestData
      )
    })

    it('should create animation without description', async () => {
      const requestData = {
        name: 'Test Animation',
        slug: 'test-animation',
      }

      const mockCreatedAnimation = {
        _id: 'animation-123',
        userId: mockUser.userId,
        name: requestData.name,
        slug: requestData.slug,
        description: '',
        status: 'draft',
      }

      mockAnimationService.createDraft.mockResolvedValue(mockCreatedAnimation as any)
      mockAnimationService.toAnimationResponse.mockReturnValue(mockCreatedAnimation as any)

      const request = createMockRequest(requestData, validToken)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockAnimationService.createDraft).toHaveBeenCalled()
    })
  })

  describe('rate limiting', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
    })

    it('should return 429 if rate limit exceeded', async () => {
      const resetAt = new Date(Date.now() + 3600000) // 1 hour from now
      checkAnimationCreationRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt,
      })

      const requestData = {
        name: 'Test Animation',
        slug: 'test-animation',
      }

      const request = createMockRequest(requestData, validToken)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(data.error.message).toContain('Limite de créations atteinte')
      expect(checkAnimationCreationRateLimit).toHaveBeenCalledWith(mockUser.userId)
      expect(recordAnimationCreation).not.toHaveBeenCalled() // Should not record if blocked
    })

    it('should record creation on success', async () => {
      checkAnimationCreationRateLimit.mockReturnValue({
        allowed: true,
        remaining: 9,
      })

      const requestData = {
        name: 'Test Animation',
        slug: 'test-animation',
      }

      const mockCreatedAnimation = {
        _id: 'animation-123',
        userId: mockUser.userId,
        ...requestData,
        status: 'draft',
      }

      mockAnimationService.createDraft.mockResolvedValue(mockCreatedAnimation as any)
      mockAnimationService.toAnimationResponse.mockReturnValue(mockCreatedAnimation as any)

      const request = createMockRequest(requestData, validToken)

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(checkAnimationCreationRateLimit).toHaveBeenCalledWith(mockUser.userId)
      expect(recordAnimationCreation).toHaveBeenCalledWith(mockUser.userId)
    })
  })

  describe('errors', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
      checkAnimationCreationRateLimit.mockReturnValue({
        allowed: true,
        remaining: 10,
      })
    })

    it('should return VALIDATION_2002 if slug already exists', async () => {
      const requestData = {
        name: 'Test Animation',
        slug: 'existing-slug',
      }

      const error = new Error('Ce slug existe déjà')
      ;(error as any).code = 'VALIDATION_2002'
      mockAnimationService.createDraft.mockRejectedValue(error)

      const request = createMockRequest(requestData, validToken)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_2002')
      expect(data.error.message).toBe('Ce slug existe déjà')
    })

    it('should return INTERNAL_3000 for unexpected errors', async () => {
      const requestData = {
        name: 'Test Animation',
        slug: 'test-animation',
      }

      mockAnimationService.createDraft.mockRejectedValue(new Error('Unexpected error'))

      const request = createMockRequest(requestData, validToken)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_3000')
    })
  })
})

// ===== GET /api/animations Tests (Story 3.10) =====

describe('GET /api/animations', () => {
  const validToken = 'valid-jwt-token'
  const mockUser = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'admin',
  }

  function createMockGetRequest(token?: string): NextRequest {
    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return new NextRequest('http://localhost:3000/api/animations', {
      method: 'GET',
      headers,
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authentication', () => {
    it('should return 401 if not authenticated', async () => {
      const request = createMockGetRequest()

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1001')
    })
  })

  describe('success', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
    })

    it('should return list of animations for authenticated user', async () => {
      const mockAnimations = [
        {
          _id: 'animation-1',
          name: 'Test Animation 1',
          slug: 'test-animation-1',
          status: 'draft',
          userId: mockUser.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: 'animation-2',
          name: 'Test Animation 2',
          slug: 'test-animation-2',
          status: 'published',
          userId: mockUser.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockAnimationService.listAnimations.mockResolvedValue(mockAnimations as any)
      mockAnimationService.toAnimationResponse.mockImplementation((anim) => ({
        id: (anim as any)._id,
        name: anim.name,
        slug: anim.slug,
        status: anim.status,
        userId: anim.userId.toString(),
        createdAt: (anim as any).createdAt,
        updatedAt: (anim as any).updatedAt,
      }) as any)

      const request = createMockGetRequest(validToken)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].name).toBe('Test Animation 1')
      expect(data.data[1].name).toBe('Test Animation 2')
      expect(mockAnimationService.listAnimations).toHaveBeenCalledWith(mockUser.userId)
    })

    it('should return empty array when user has no animations', async () => {
      mockAnimationService.listAnimations.mockResolvedValue([])

      const request = createMockGetRequest(validToken)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(0)
    })
  })

  describe('errors', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
    })

    it('should return 500 on database error', async () => {
      mockAnimationService.listAnimations.mockRejectedValue(new Error('Database error'))

      const request = createMockGetRequest(validToken)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_3000')
    })
  })
})
