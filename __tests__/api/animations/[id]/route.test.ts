import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/animations/[id]/route'
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

// Request factory for GET requests
function createMockGetRequest(token?: string): NextRequest {
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return new NextRequest('http://localhost:3000/api/animations/animation-123', {
    method: 'GET',
    headers,
  })
}

// Request factory for PUT requests
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

  describe('Step 2: Update accessConfig and baseFields', () => {
    it('should update accessConfig with type=code successfully', async () => {
      const step2Data = {
        accessConfig: {
          type: 'code',
          code: 'TECH2025',
        },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
        },
      }

      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
      mockAnimationService.updateAnimation.mockResolvedValue({
        _id: animationId,
        ...step2Data,
      } as any)
      mockAnimationService.toAnimationResponse.mockReturnValue({
        id: animationId,
        ...step2Data,
      } as any)

      const request = createMockRequest(step2Data, validToken)
      const response = await PUT(request, { params: Promise.resolve({ id: animationId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.accessConfig.type).toBe('code')
      expect(data.data.accessConfig.code).toBe('TECH2025')
      expect(mockAnimationService.updateAnimation).toHaveBeenCalledWith(
        animationId,
        mockUser.userId,
        step2Data,
        mockUser.role
      )
    })

    it('should update accessConfig with type=email-domain successfully', async () => {
      const step2Data = {
        accessConfig: {
          type: 'email-domain',
          emailDomains: ['@company.com', '@partner.fr'],
        },
        baseFields: {
          name: {
            enabled: true,
            required: true,
            label: 'Nom complet',
            placeholder: 'Entrez votre nom',
          },
          firstName: { enabled: false, required: true },
          email: {
            enabled: true,
            required: true,
            label: 'Email professionnel',
          },
        },
      }

      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
      mockAnimationService.updateAnimation.mockResolvedValue({
        _id: animationId,
        ...step2Data,
      } as any)
      mockAnimationService.toAnimationResponse.mockReturnValue({
        id: animationId,
        ...step2Data,
      } as any)

      const request = createMockRequest(step2Data, validToken)
      const response = await PUT(request, { params: Promise.resolve({ id: animationId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.accessConfig.type).toBe('email-domain')
      expect(data.data.accessConfig.emailDomains).toEqual(['@company.com', '@partner.fr'])
      expect(data.data.baseFields.email.enabled).toBe(true)
    })

    it('should accept partial Step 2 data (updateAnimationSchema is permissive)', async () => {
      // Note: The API uses updateAnimationSchema which allows partial updates
      // Client-side validation (step2Schema) is stricter, but API accepts optional fields
      const partialData = {
        accessConfig: {
          type: 'code',
          // code is optional in updateAnimationSchema for partial updates
        },
        baseFields: {
          name: { enabled: true, required: true },
          firstName: { enabled: false, required: true },
          email: { enabled: false, required: true },
        },
      }

      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
      mockAnimationService.updateAnimation.mockResolvedValue({
        _id: animationId,
        ...partialData,
      } as any)
      mockAnimationService.toAnimationResponse.mockReturnValue({
        id: animationId,
        ...partialData,
      } as any)

      const request = createMockRequest(partialData, validToken)
      const response = await PUT(request, { params: Promise.resolve({ id: animationId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should update baseFields with custom labels and placeholders', async () => {
      const step2Data = {
        accessConfig: {
          type: 'none',
        },
        baseFields: {
          name: {
            enabled: true,
            required: true,
            label: 'Votre pseudo',
            placeholder: 'Ex: SuperCoder42',
          },
          firstName: {
            enabled: true,
            required: false,
            label: 'Prénom (optionnel)',
            placeholder: 'Ex: Alex',
          },
          email: {
            enabled: true,
            required: true,
            label: 'Email de contact',
            placeholder: 'votreemail@exemple.com',
          },
        },
      }

      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
      mockAnimationService.updateAnimation.mockResolvedValue({
        _id: animationId,
        ...step2Data,
      } as any)
      mockAnimationService.toAnimationResponse.mockReturnValue({
        id: animationId,
        ...step2Data,
      } as any)

      const request = createMockRequest(step2Data, validToken)
      const response = await PUT(request, { params: Promise.resolve({ id: animationId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.baseFields.name.label).toBe('Votre pseudo')
      expect(data.data.baseFields.name.placeholder).toBe('Ex: SuperCoder42')
      expect(data.data.baseFields.firstName.enabled).toBe(true)
      expect(data.data.baseFields.firstName.required).toBe(false)
    })
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
        updateData,
        mockUser.role
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
        updateData,
        mockUser.role
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

// ===== GET /api/animations/[id] Tests (Story 3.10) =====

describe('GET /api/animations/[id]', () => {
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
      const request = createMockGetRequest()

      const response = await GET(request, {
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

      const request = createMockGetRequest('invalid-token')

      const response = await GET(request, {
        params: Promise.resolve({ id: animationId }),
      })
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

    it('should return animation successfully', async () => {
      const mockAnimation = {
        _id: animationId,
        userId: mockUser.userId,
        name: 'Test Animation',
        slug: 'test-animation',
        description: 'Test description',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockResponse = {
        id: animationId,
        userId: mockUser.userId,
        name: 'Test Animation',
        slug: 'test-animation',
        description: 'Test description',
        status: 'draft',
        createdAt: mockAnimation.createdAt,
        updatedAt: mockAnimation.updatedAt,
      }

      mockAnimationService.getAnimationById.mockResolvedValue(mockAnimation as any)
      mockAnimationService.toAnimationResponse.mockReturnValue(mockResponse as any)

      const request = createMockGetRequest(validToken)

      const response = await GET(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: animationId,
        name: 'Test Animation',
        slug: 'test-animation',
        status: 'draft',
      })
      expect(mockAnimationService.getAnimationById).toHaveBeenCalledWith(
        animationId,
        mockUser.userId,
        mockUser.role
      )
    })

    it('should return published animation with all wizard data', async () => {
      const mockAnimation = {
        _id: animationId,
        userId: mockUser.userId,
        name: 'Published Animation',
        slug: 'published-animation',
        status: 'published',
        accessConfig: { type: 'code', code: 'TEST123' },
        baseFields: {
          name: { enabled: true, required: true },
          email: { enabled: true, required: true },
        },
        pipeline: [{ type: 'text', content: 'Test' }],
        customization: {
          primaryColor: '#FF0000',
          textCard: { backgroundColor: '#FFFFFF' },
        },
        qrCodeUrl: 'https://example.com/qr.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockResponse = {
        id: animationId,
        ...mockAnimation,
      }

      mockAnimationService.getAnimationById.mockResolvedValue(mockAnimation as any)
      mockAnimationService.toAnimationResponse.mockReturnValue(mockResponse as any)

      const request = createMockGetRequest(validToken)

      const response = await GET(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('published')
      expect(data.data.accessConfig).toBeDefined()
      expect(data.data.pipeline).toBeDefined()
      expect(data.data.customization).toBeDefined()
    })
  })

  describe('errors', () => {
    beforeEach(() => {
      mockAuth.verifyAccessToken.mockReturnValue(mockUser)
    })

    it('should return 404 if animation not found', async () => {
      const error = new Error('Animation introuvable')
      ;(error as any).code = 'NOT_FOUND_3001'
      mockAnimationService.getAnimationById.mockRejectedValue(error)

      const request = createMockGetRequest(validToken)

      const response = await GET(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND_3001')
    })

    it('should return 403 if user does not own animation', async () => {
      const error = new Error('Accès refusé à cette animation')
      ;(error as any).code = 'AUTH_1003'
      mockAnimationService.getAnimationById.mockRejectedValue(error)

      const request = createMockGetRequest(validToken)

      const response = await GET(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1003')
    })

    it('should return 500 on database error', async () => {
      mockAnimationService.getAnimationById.mockRejectedValue(new Error('Database error'))

      const request = createMockGetRequest(validToken)

      const response = await GET(request, {
        params: Promise.resolve({ id: animationId }),
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_3000')
    })
  })
})
