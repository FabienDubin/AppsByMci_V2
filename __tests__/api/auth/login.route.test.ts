import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'
import { authService } from '@/lib/services/auth.service'
import * as rateLimitModule from '@/lib/rate-limit'

// Mocks
jest.mock('@/lib/services/auth.service')
jest.mock('@/lib/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
  recordFailedAttempt: jest.fn(),
  resetRateLimitOnSuccess: jest.fn(),
}))

const mockAuthService = authService as jest.Mocked<typeof authService>
const mockRateLimit = rateLimitModule as jest.Mocked<typeof rateLimitModule>

// Request factory
function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: allow requests
    mockRateLimit.checkRateLimit.mockReturnValue({
      allowed: true,
      remaining: 5,
    })
  })

  describe('validation', () => {
    it('should return VALIDATION_ERROR for missing email', async () => {
      const request = createMockRequest({ password: 'Test123!' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return VALIDATION_ERROR for missing password', async () => {
      const request = createMockRequest({ email: 'test@example.com' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return VALIDATION_ERROR for invalid email format', async () => {
      const request = createMockRequest({ email: 'invalid-email', password: 'Test123!' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return VALIDATION_ERROR for empty body', async () => {
      const request = createMockRequest({})

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('successful login', () => {
    const validCredentials = {
      email: 'admin@test.com',
      password: 'Pass1234!',
    }

    const mockLoginResponse = {
      accessToken: 'mock.jwt.token',
      refreshToken: 'mock-refresh-token-uuid',
      user: {
        id: 'user-id-123',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'admin' as const,
        createdAt: new Date(),
      },
    }

    it('should return 200 with tokens and user on successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse)

      const request = createMockRequest(validCredentials)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.accessToken).toBe(mockLoginResponse.accessToken)
      expect(data.data.refreshToken).toBe(mockLoginResponse.refreshToken)
      expect(data.data.user.email).toBe(validCredentials.email)
    })

    it('should set httpOnly cookie for refresh token', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse)

      const request = createMockRequest(validCredentials)
      const response = await POST(request)

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('refreshToken=')
      expect(setCookieHeader).toContain('HttpOnly')
      expect(setCookieHeader?.toLowerCase()).toContain('samesite=strict')
    })

    it('should reset rate limit on successful login', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse)

      const request = createMockRequest(validCredentials)
      await POST(request)

      expect(mockRateLimit.resetRateLimitOnSuccess).toHaveBeenCalled()
    })
  })

  describe('authentication errors', () => {
    const validCredentials = {
      email: 'admin@test.com',
      password: 'WrongPassword!',
    }

    it('should return AUTH_1001 for invalid credentials', async () => {
      const error = new Error('Email ou mot de passe incorrect')
      ;(error as any).code = 'AUTH_1001'
      mockAuthService.login.mockRejectedValue(error)

      const request = createMockRequest(validCredentials)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1001')
      expect(data.error.message).toBe('Email ou mot de passe incorrect')
    })

    it('should record failed attempt on AUTH_1001 error', async () => {
      const error = new Error('Email ou mot de passe incorrect')
      ;(error as any).code = 'AUTH_1001'
      mockAuthService.login.mockRejectedValue(error)

      const request = createMockRequest(validCredentials)
      await POST(request)

      expect(mockRateLimit.recordFailedAttempt).toHaveBeenCalled()
    })
  })

  describe('rate limiting', () => {
    it('should return AUTH_1004 when rate limited', async () => {
      mockRateLimit.checkRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 3600000),
      })

      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'Test123!',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1004')
      expect(data.error.message).toContain('Trop de tentatives')
    })

    it('should not call authService.login when rate limited', async () => {
      mockRateLimit.checkRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
      })

      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'Test123!',
      })

      await POST(request)

      expect(mockAuthService.login).not.toHaveBeenCalled()
    })
  })

  describe('unexpected errors', () => {
    it('should return INTERNAL_ERROR for unexpected exceptions', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'Test123!',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})
