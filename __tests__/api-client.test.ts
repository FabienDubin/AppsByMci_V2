import { apiClient, api } from '@/lib/api-client'
import { useAuthStore } from '@/lib/stores/auth.store'

// Mock fetch globally
global.fetch = jest.fn()

describe('api-client', () => {
  beforeEach(() => {
    // Reset store and mocks
    useAuthStore.getState().clearAuth()
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Token expiration detection', () => {
    it('should trigger refresh when token expires within 2 minutes', async () => {
      // Create JWT expiring in 1 minute
      const nowSeconds = Math.floor(Date.now() / 1000)
      const expiringSoonSeconds = nowSeconds + 60 // 1 minute from now
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin', exp: expiringSoonSeconds }
      const encodedPayload = btoa(JSON.stringify(payload))
      const expiringToken = `header.${encodedPayload}.signature`

      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'admin' as const }
      useAuthStore.getState().setAuth(mockUser, expiringToken)

      // Mock refresh endpoint to return new token
      const newToken = 'new.refreshed.token'
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: { accessToken: newToken } }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: { message: 'API call succeeded' } }),
        })

      // Make an API call
      await apiClient('/api/test')

      // Should have called refresh endpoint first
      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/test', expect.any(Object))

      // Store should have new token
      expect(useAuthStore.getState().getAccessToken()).toBe(newToken)
    })

    it('should NOT trigger refresh when token is valid for more than 2 minutes', async () => {
      // Create JWT expiring in 5 minutes
      const nowSeconds = Math.floor(Date.now() / 1000)
      const validTokenSeconds = nowSeconds + 5 * 60 // 5 minutes from now
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin', exp: validTokenSeconds }
      const encodedPayload = btoa(JSON.stringify(payload))
      const validToken = `header.${encodedPayload}.signature`

      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'admin' as const }
      useAuthStore.getState().setAuth(mockUser, validToken)

      // Mock API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { message: 'Success' } }),
      })

      await apiClient('/api/test')

      // Should NOT have called refresh, only the actual API
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.any(Object))
      expect(global.fetch).not.toHaveBeenCalledWith('/api/auth/refresh', expect.any(Object))
    })

    it('should trigger refresh when no token is present', async () => {
      // No token set in store
      expect(useAuthStore.getState().getAccessToken()).toBeNull()

      // Mock refresh endpoint
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: { accessToken: 'new.token' } }),
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: { message: 'Success' } }),
        })

      await apiClient('/api/test')

      // Should have called refresh first
      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
    })
  })

  describe('Mutex pattern (prevent concurrent refreshes)', () => {
    it('should only call refresh endpoint once when multiple requests happen simultaneously', async () => {
      // Create expiring token
      const nowSeconds = Math.floor(Date.now() / 1000)
      const expiringSoonSeconds = nowSeconds + 60 // 1 minute
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin', exp: expiringSoonSeconds }
      const encodedPayload = btoa(JSON.stringify(payload))
      const expiringToken = `header.${encodedPayload}.signature`

      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'admin' as const }
      useAuthStore.getState().setAuth(mockUser, expiringToken)

      // Mock refresh to return after a delay
      let refreshResolve: (value: any) => void
      const refreshPromise = new Promise((resolve) => {
        refreshResolve = resolve
      })

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/refresh') {
          return refreshPromise
        }
        return Promise.resolve({
          json: async () => ({ success: true, data: { message: 'API call' } }),
        })
      })

      // Fire 3 simultaneous API calls
      const promise1 = apiClient('/api/test1')
      const promise2 = apiClient('/api/test2')
      const promise3 = apiClient('/api/test3')

      // Wait a bit to ensure all requests start
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Now resolve the refresh
      refreshResolve!({
        json: async () => ({ success: true, data: { accessToken: 'new.token' } }),
      })

      await Promise.all([promise1, promise2, promise3])

      // Should have called refresh ONLY ONCE, then 3 API calls
      const refreshCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => call[0] === '/api/auth/refresh'
      )
      expect(refreshCalls.length).toBe(1)
    })

    it('should queue requests and execute them after refresh completes', async () => {
      // Create expiring token
      const nowSeconds = Math.floor(Date.now() / 1000)
      const expiringSoonSeconds = nowSeconds + 60
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin', exp: expiringSoonSeconds }
      const encodedPayload = btoa(JSON.stringify(payload))
      const expiringToken = `header.${encodedPayload}.signature`

      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'admin' as const }
      useAuthStore.getState().setAuth(mockUser, expiringToken)

      const newToken = 'new.refreshed.token'

      // Track call order
      const callOrder: string[] = []

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        callOrder.push(url)
        if (url === '/api/auth/refresh') {
          return Promise.resolve({
            json: async () => ({ success: true, data: { accessToken: newToken } }),
          })
        }
        return Promise.resolve({
          json: async () => ({ success: true, data: { message: 'Success' } }),
        })
      })

      // Fire 2 simultaneous requests
      await Promise.all([apiClient('/api/test1'), apiClient('/api/test2')])

      // Refresh should be called first, then both API calls
      expect(callOrder[0]).toBe('/api/auth/refresh')
      expect(callOrder).toContain('/api/test1')
      expect(callOrder).toContain('/api/test2')
    })
  })

  describe('AUTH_1002 handling', () => {
    it('should return AUTH_1002 error when refresh fails', async () => {
      // No token in store
      expect(useAuthStore.getState().getAccessToken()).toBeNull()

      // Mock refresh to fail (return AUTH_1002)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: { code: 'AUTH_1002', message: 'Session expirée. Veuillez vous reconnecter.' },
        }),
      })

      const result = await apiClient('/api/test')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('AUTH_1002')
      expect(result.error?.message).toBe('Session expirée. Veuillez vous reconnecter.')
    })

    it('should return AUTH_1002 when refresh endpoint throws error', async () => {
      // Create expiring token
      const nowSeconds = Math.floor(Date.now() / 1000)
      const expiringSoonSeconds = nowSeconds + 60
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin', exp: expiringSoonSeconds }
      const encodedPayload = btoa(JSON.stringify(payload))
      const expiringToken = `header.${encodedPayload}.signature`

      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'admin' as const }
      useAuthStore.getState().setAuth(mockUser, expiringToken)

      // Mock refresh to throw network error
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await apiClient('/api/test')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('AUTH_1002')
    })

    it('should pass through AUTH_1002 from API response', async () => {
      // Valid token (no refresh needed)
      const nowSeconds = Math.floor(Date.now() / 1000)
      const validTokenSeconds = nowSeconds + 5 * 60
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin', exp: validTokenSeconds }
      const encodedPayload = btoa(JSON.stringify(payload))
      const validToken = `header.${encodedPayload}.signature`

      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'admin' as const }
      useAuthStore.getState().setAuth(mockUser, validToken)

      // Mock API to return AUTH_1002 (session invalid server-side)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: { code: 'AUTH_1002', message: 'Session expirée. Veuillez vous reconnecter.' },
        }),
      })

      const result = await apiClient('/api/test')

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('AUTH_1002')
    })
  })

  describe('Authorization header injection', () => {
    it('should include Authorization header with Bearer token', async () => {
      const mockToken = 'valid.jwt.token'
      const nowSeconds = Math.floor(Date.now() / 1000)
      const validTokenSeconds = nowSeconds + 5 * 60
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin', exp: validTokenSeconds }
      const encodedPayload = btoa(JSON.stringify(payload))
      const validJwt = `header.${encodedPayload}.signature`

      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'admin' as const }
      useAuthStore.getState().setAuth(mockUser, validJwt)

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { message: 'Success' } }),
      })

      await apiClient('/api/test')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.any(Headers),
          credentials: 'include',
        })
      )

      // Check Authorization header
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1]
      const headers = callArgs.headers as Headers
      expect(headers.get('Authorization')).toBe(`Bearer ${validJwt}`)
    })

    it('should include credentials: include for cookies', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000)
      const validTokenSeconds = nowSeconds + 5 * 60
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin', exp: validTokenSeconds }
      const encodedPayload = btoa(JSON.stringify(payload))
      const validToken = `header.${encodedPayload}.signature`

      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'admin' as const }
      useAuthStore.getState().setAuth(mockUser, validToken)

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { message: 'Success' } }),
      })

      await apiClient('/api/test')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          credentials: 'include',
        })
      )
    })
  })

  describe('Convenience methods (api.get, api.post, etc.)', () => {
    it('should call GET with correct method', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000)
      const validTokenSeconds = nowSeconds + 5 * 60
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin', exp: validTokenSeconds }
      const encodedPayload = btoa(JSON.stringify(payload))
      const validToken = `header.${encodedPayload}.signature`

      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'admin' as const }
      useAuthStore.getState().setAuth(mockUser, validToken)

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { users: [] } }),
      })

      await api.get('/api/users')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should call POST with body', async () => {
      const nowSeconds = Math.floor(Date.now() / 1000)
      const validTokenSeconds = nowSeconds + 5 * 60
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin', exp: validTokenSeconds }
      const encodedPayload = btoa(JSON.stringify(payload))
      const validToken = `header.${encodedPayload}.signature`

      const mockUser = { id: 'user-123', email: 'test@example.com', role: 'admin' as const }
      useAuthStore.getState().setAuth(mockUser, validToken)

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { id: 'new-user' } }),
      })

      const requestBody = { name: 'New User' }
      await api.post('/api/users', requestBody)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      )
    })
  })
})
