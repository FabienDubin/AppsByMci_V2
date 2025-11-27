import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/logout/route'
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (refreshToken) {
    headers['cookie'] = `refreshToken=${refreshToken}`
  }

  return new NextRequest('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    headers,
  })
}

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('successful logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token-uuid'
      mockAuthService.logout = jest.fn().mockResolvedValue(undefined)

      const request = createMockRequest(refreshToken)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toBe('Déconnexion réussie')
      expect(mockAuthService.logout).toHaveBeenCalledWith(refreshToken)

      // Verify cookie is cleared
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('refreshToken=')
      expect(setCookieHeader).toContain('Max-Age=0')
    })

    it('should succeed even without refresh token (idempotent)', async () => {
      const request = createMockRequest() // No refresh token

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.message).toBe('Déconnexion réussie')
      expect(mockAuthService.logout).not.toHaveBeenCalled()

      // Verify cookie is still cleared
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('refreshToken=')
      expect(setCookieHeader).toContain('Max-Age=0')
    })

    it('should clear cookie with correct attributes', async () => {
      const refreshToken = 'valid-refresh-token-uuid'
      mockAuthService.logout = jest.fn().mockResolvedValue(undefined)

      const request = createMockRequest(refreshToken)
      const response = await POST(request)

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('HttpOnly')
      expect(setCookieHeader?.toLowerCase()).toContain('samesite=strict')
      expect(setCookieHeader).toContain('Path=/')
      expect(setCookieHeader).toContain('Max-Age=0')
    })
  })

  describe('error handling', () => {
    it('should return INTERNAL_ERROR if authService.logout throws error', async () => {
      const refreshToken = 'valid-refresh-token-uuid'
      mockAuthService.logout = jest.fn().mockRejectedValue(new Error('Database error'))

      const request = createMockRequest(refreshToken)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
      expect(data.error.message).toBe('Une erreur est survenue')
    })

    it('should handle unexpected errors gracefully', async () => {
      const refreshToken = 'valid-refresh-token-uuid'
      mockAuthService.logout = jest.fn().mockRejectedValue('Non-Error thrown')

      const request = createMockRequest(refreshToken)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('idempotency', () => {
    it('should return success even if session does not exist', async () => {
      const refreshToken = 'non-existent-token'
      // AuthService.logout is idempotent - does not throw error
      mockAuthService.logout = jest.fn().mockResolvedValue(undefined)

      const request = createMockRequest(refreshToken)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockAuthService.logout).toHaveBeenCalledWith(refreshToken)
    })

    it('should allow multiple logout calls with same token', async () => {
      const refreshToken = 'valid-refresh-token-uuid'
      mockAuthService.logout = jest.fn().mockResolvedValue(undefined)

      // First logout
      const request1 = createMockRequest(refreshToken)
      const response1 = await POST(request1)
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1.success).toBe(true)

      // Second logout (idempotent)
      const request2 = createMockRequest(refreshToken)
      const response2 = await POST(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2.success).toBe(true)
      expect(mockAuthService.logout).toHaveBeenCalledTimes(2)
    })
  })
})
