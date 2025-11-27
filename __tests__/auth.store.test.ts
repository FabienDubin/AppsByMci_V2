import { useAuthStore } from '@/lib/stores/auth.store'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  describe('initial state', () => {
    it('should have null user initially', () => {
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('setAuth', () => {
    it('should set user and token', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin' as const,
      }
      const mockToken = 'mock.jwt.token'

      useAuthStore.getState().setAuth(mockUser, mockToken)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.accessToken).toBe(mockToken)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should update isAuthenticated to true', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin' as const,
      }

      useAuthStore.getState().setAuth(mockUser, 'token')

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })

  describe('clearAuth', () => {
    it('should reset all auth state', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin' as const,
      }
      useAuthStore.getState().setAuth(mockUser, 'token')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      useAuthStore.getState().clearAuth()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('getAccessToken', () => {
    it('should return null when not authenticated', () => {
      const token = useAuthStore.getState().getAccessToken()

      expect(token).toBeNull()
    })

    it('should return token when authenticated', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin' as const,
      }
      const mockToken = 'mock.jwt.token'

      useAuthStore.getState().setAuth(mockUser, mockToken)

      const token = useAuthStore.getState().getAccessToken()
      expect(token).toBe(mockToken)
    })
  })

  describe('updateAccessToken', () => {
    it('should update access token without changing user', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin' as const,
      }
      const initialToken = 'initial.jwt.token'
      const newToken = 'new.jwt.token'

      useAuthStore.getState().setAuth(mockUser, initialToken)
      useAuthStore.getState().updateAccessToken(newToken)

      const state = useAuthStore.getState()
      expect(state.accessToken).toBe(newToken)
      expect(state.user).toEqual(mockUser) // User unchanged
      expect(state.isAuthenticated).toBe(true) // Still authenticated
    })

    it('should update token even when no user is set', () => {
      const newToken = 'new.jwt.token'

      useAuthStore.getState().updateAccessToken(newToken)

      const state = useAuthStore.getState()
      expect(state.accessToken).toBe(newToken)
      expect(state.user).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('should update user info without changing token', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Old Name',
        role: 'admin' as const,
      }
      const mockToken = 'mock.jwt.token'

      useAuthStore.getState().setAuth(mockUser, mockToken)
      useAuthStore.getState().updateUser({ name: 'New Name' })

      const state = useAuthStore.getState()
      expect(state.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'New Name',
        role: 'admin',
      })
      expect(state.accessToken).toBe(mockToken) // Token unchanged
      expect(state.isAuthenticated).toBe(true)
    })

    it('should handle partial user updates', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin' as const,
      }

      useAuthStore.getState().setAuth(mockUser, 'token')
      useAuthStore.getState().updateUser({ name: 'Updated Name' })

      const state = useAuthStore.getState()
      expect(state.user?.name).toBe('Updated Name')
      expect(state.user?.email).toBe('test@example.com') // Other fields unchanged
      expect(state.user?.role).toBe('admin')
    })

    it('should not update if no user is set', () => {
      useAuthStore.getState().updateUser({ name: 'Test Name' })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
    })
  })

  describe('getTokenExpiration', () => {
    it('should return null when no token is set', () => {
      const expiration = useAuthStore.getState().getTokenExpiration()

      expect(expiration).toBeNull()
    })

    it('should return null for invalid token format', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin' as const,
      }

      useAuthStore.getState().setAuth(mockUser, 'invalid-token')

      const expiration = useAuthStore.getState().getTokenExpiration()
      expect(expiration).toBeNull()
    })

    it('should decode and return exp claim from valid JWT', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin' as const,
      }
      // Create a mock JWT with exp claim (base64 encoded payload)
      // Payload: {"userId":"user-123","email":"test@example.com","role":"admin","iat":1700000000,"exp":1700000900}
      const expTimestamp = 1700000900
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin', iat: 1700000000, exp: expTimestamp }
      const encodedPayload = btoa(JSON.stringify(payload))
      const mockJwt = `header.${encodedPayload}.signature`

      useAuthStore.getState().setAuth(mockUser, mockJwt)

      const expiration = useAuthStore.getState().getTokenExpiration()
      expect(expiration).toBe(expTimestamp)
    })

    it('should return null for JWT without exp claim', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin' as const,
      }
      // JWT payload without exp
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'admin' }
      const encodedPayload = btoa(JSON.stringify(payload))
      const mockJwt = `header.${encodedPayload}.signature`

      useAuthStore.getState().setAuth(mockUser, mockJwt)

      const expiration = useAuthStore.getState().getTokenExpiration()
      expect(expiration).toBeNull()
    })
  })
})
