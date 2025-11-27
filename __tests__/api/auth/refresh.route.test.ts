import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/refresh/route'
import { authService } from '@/lib/services/auth.service'

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

const mockAuthService = authService as jest.Mocked<typeof authService>

// Request factory with cookie
function createMockRequest(refreshToken?: string): NextRequest {
  const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
  })

  // Add cookie if provided
  if (refreshToken) {
    // Mock cookies.get
    jest.spyOn(request.cookies, 'get').mockReturnValue({
      name: 'refreshToken',
      value: refreshToken,
    })
  }

  return request
}

describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('missing cookie', () => {
    it('should return AUTH_1002 when no refreshToken cookie is present', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1002')
      expect(data.error.message).toBe('Session expirée. Veuillez vous reconnecter.')
    })
  })

  describe('successful refresh', () => {
    it('should return new access token with valid refresh token', async () => {
      const mockNewToken = 'new.jwt.token'
      mockAuthService.refreshAccessToken.mockResolvedValue({ accessToken: mockNewToken })

      const request = createMockRequest('valid-refresh-token-uuid')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.accessToken).toBe(mockNewToken)
      expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token-uuid')
    })
  })

  describe('invalid/expired refresh token', () => {
    it('should return AUTH_1002 when refresh token is invalid', async () => {
      const error = new Error('Session expirée. Veuillez vous reconnecter.')
      ;(error as any).code = 'AUTH_1002'
      mockAuthService.refreshAccessToken.mockRejectedValue(error)

      const request = createMockRequest('invalid-refresh-token')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1002')
      expect(data.error.message).toBe('Session expirée. Veuillez vous reconnecter.')
    })

    it('should return AUTH_1002 when refresh token is expired', async () => {
      const error = new Error('Session expirée. Veuillez vous reconnecter.')
      ;(error as any).code = 'AUTH_1002'
      mockAuthService.refreshAccessToken.mockRejectedValue(error)

      const request = createMockRequest('expired-refresh-token')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_1002')
    })
  })

  describe('unexpected errors', () => {
    it('should return INTERNAL_ERROR for unexpected exceptions', async () => {
      mockAuthService.refreshAccessToken.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest('valid-refresh-token')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('Une erreur est survenue')
    })
  })
})
